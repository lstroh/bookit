I have everything I need. Key findings from reading the code:

- ✅ **Availability already respects `specific_date` blocks** — `get_staff_availability()` checks `specific_date` first and returns zero slots when `is_working = 0`. No fix needed.
- ✅ **`add_exception` and `delete_exception` endpoints already exist** in `class-dashboard-bookings-api.php` — scoped to `staff/{staff_id}/hours/exceptions`. Task 2 needs new *self-service* endpoints scoped to `/dashboard/my-availability` (no staff_id in URL — uses session).
- ✅ **`repeat_weekly` column exists** in the schema but the existing exception system only creates single-date rows. Repeating blocks need to generate multiple rows.
- ✅ **`StaffHours.vue` UI pattern** is clear — copy the exception form structure but adapt it for the self-service time-off context.

---

```
Sprint 4A Progress: 1/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
⏭️ Task 2:  Time-Off Blocking (18h)  — NEXT
□  Task 3:  Staff Earnings Display (6h)
□  Task 4:  Reports Nav + Overview Dashboard (8h)
□  Task 5:  Revenue Report (14h)
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 16 / 112
```

---

## Task 2 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 2 of Sprint 4A for the Bookit Booking System WordPress plugin: Staff Time-Off / Availability Blocking.

Read every file referenced below before writing any code. Do not duplicate or modify anything that is not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/api/class-dashboard-bookings-api.php` — the ENTIRE file. You will add new methods to this class. Do not create a new class.
- `bookit-booking-system/includes/class-bookit-auth.php` — for Bookit_Auth::get_current_staff()
- `bookit-booking-system/database/schema.sql` — specifically the `wp_bookings_staff_working_hours` columns: `id, staff_id, day_of_week, specific_date, start_time, end_time, is_working, break_start, break_end, repeat_weekly, valid_from, valid_until, notes`
- `bookit-booking-system/dashboard/src/views/StaffHours.vue` — copy the exception form UI pattern and API call style
- `bookit-booking-system/dashboard/src/router/index.js` — add new route here
- `bookit-booking-system/dashboard/src/components/Sidebar.vue` — add nav item here

### What already exists — do NOT duplicate:
- `GET  /dashboard/staff/{staff_id}/hours/exceptions` — admin view of any staff member's exceptions
- `POST /dashboard/staff/{staff_id}/hours/exceptions` — admin creates exception for any staff member
- `DELETE /dashboard/staff/{staff_id}/hours/exceptions/{exception_id}` — admin deletes any exception

### What you are building — new self-service endpoints for staff managing their OWN time off:
- `GET    /dashboard/my-availability` — returns the logged-in staff member's own time-off blocks
- `POST   /dashboard/my-availability` — creates one or more time-off blocks for the logged-in staff member
- `DELETE /dashboard/my-availability/{id}` — deletes a specific time-off block belonging to the logged-in staff member

These use the session staff_id, not a URL parameter. Staff can only manage their own blocks.

---

## PART A — BACKEND: New endpoints in `class-dashboard-bookings-api.php`

### Add to `register_routes()`:

```
GET /dashboard/my-availability
  permission_callback: check_dashboard_permission
  No params required — uses session staff_id

POST /dashboard/my-availability
  permission_callback: check_dashboard_permission
  args:
    date_from:   required, YYYY-MM-DD
    date_to:     required, YYYY-MM-DD (can equal date_from for single day)
    all_day:     required, boolean
    start_time:  required if all_day = false, HH:MM or HH:MM:SS
    end_time:    required if all_day = false, HH:MM or HH:MM:SS
    reason:      required, enum: 'vacation', 'sick_leave', 'lunch_break', 'personal', 'other'
    notes:       optional, free text
    repeat:      required, enum: 'none', 'daily', 'weekly'

DELETE /dashboard/my-availability/{id}
  permission_callback: check_dashboard_permission
  args:
    id: required, numeric
```

### Add method `get_my_availability( $request )`:

1. Get `$current_staff` via `Bookit_Auth::get_current_staff()`
2. Query `wp_bookings_staff_working_hours` where `staff_id = $current_staff['id']` AND `specific_date IS NOT NULL` AND `is_working = 0`
3. Order by `specific_date ASC`
4. For each row, return: `id, specific_date, start_time, end_time, is_working, notes, reason` — note that `reason` is stored in the `notes` column with a prefix (see POST method below — or if a dedicated `reason` column does not exist in the schema, store reason as part of notes in format `reason:{value}|notes:{value}` and parse it back on read)

**Important:** Check the actual schema — there is no dedicated `reason` column in `wp_bookings_staff_working_hours`. Store reason using the `notes` column in this format:
`reason:vacation|notes:Going to Spain` or `reason:sick_leave|notes:` when no extra notes.

On read, parse this format to return separate `reason` and `notes` fields to the frontend.

5. Return:
```json
{
  "success": true,
  "blocks": [
    {
      "id": 123,
      "specific_date": "2026-03-10",
      "start_time": null,
      "end_time": null,
      "is_all_day": true,
      "reason": "vacation",
      "notes": "Going to Spain",
      "created_at": "..."
    }
  ]
}
```

### Add method `create_my_availability_block( $request )`:

1. Get `$current_staff` via `Bookit_Auth::get_current_staff()`
2. Validate `date_from <= date_to`
3. Validate `date_from` is not in the past (compare to today in Europe/London timezone using `new DateTimeImmutable('now', new DateTimeZone('Europe/London'))`)
4. If `all_day` is false, validate `start_time < end_time`
5. **Conflict check** — before creating any rows, count how many bookings exist for this staff member in the proposed date/time range:

```php
// For all-day blocks:
$conflict_count = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d
       AND booking_date BETWEEN %s AND %s
       AND status = 'confirmed'
       AND deleted_at IS NULL",
    $current_staff['id'], $date_from, $date_to
) );

// For time-range blocks (same date range but also check time overlap):
$conflict_count = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d
       AND booking_date BETWEEN %s AND %s
       AND start_time < %s
       AND end_time > %s
       AND status = 'confirmed'
       AND deleted_at IS NULL",
    $current_staff['id'], $date_from, $date_to, $end_time, $start_time
) );
```

If `$conflict_count > 0`, return a 409 error:
```php
return new WP_Error(
    'booking_conflict',
    sprintf(
        _n(
            'You have %d confirmed booking during this time. Please reschedule it before blocking this time off.',
            'You have %d confirmed bookings during this time. Please reschedule them before blocking this time off.',
            $conflict_count,
            'bookit-booking-system'
        ),
        $conflict_count
    ),
    array( 'status' => 409 )
);
```

6. **Generate rows** — build an array of dates to insert based on `repeat`:

- `repeat = 'none'`: generate one row per calendar date from `date_from` to `date_to` (inclusive). Loop with `DateInterval('P1D')`.
- `repeat = 'daily'`: same as 'none' — creates a row per day. The `repeat_weekly` column is set to 0.
- `repeat = 'weekly'`: creates one row only on the `date_from` day-of-week, for 8 weeks from `date_from`. Set `repeat_weekly = 1` on each row.

7. **Prepare `notes` value** using the format `reason:{value}|notes:{notes_value}`. If no notes, use `reason:{value}|notes:`.

8. **Prepare `start_time` / `end_time`**:
- If `all_day = true`: `start_time = '00:00:00'`, `end_time = '23:59:00'`
- If `all_day = false`: use provided values, ensure seconds suffix `':00'` is appended if missing

9. **Insert rows** — for each date in the generated list:
```php
$wpdb->insert(
    $wpdb->prefix . 'bookings_staff_working_hours',
    array(
        'staff_id'      => $current_staff['id'],
        'specific_date' => $date_string,   // YYYY-MM-DD
        'day_of_week'   => null,
        'start_time'    => $start_time,
        'end_time'      => $end_time,
        'is_working'    => 0,
        'repeat_weekly' => $repeat_weekly, // 1 for weekly, 0 otherwise
        'notes'         => $notes_value,   // reason:xxx|notes:xxx
    ),
    array( '%d', '%s', null, '%s', '%s', '%d', '%d', '%s' )
);
```

Handle duplicate date gracefully: if a `specific_date` row already exists for this staff member (the existing `add_exception` already has a duplicate check as a pattern — use the same approach), skip that date and continue rather than failing the whole request. Track skipped dates.

10. Return:
```json
{
  "success": true,
  "message": "Time off blocked successfully.",
  "created": 5,
  "skipped": 1,
  "skipped_dates": ["2026-03-12"]
}
```

### Add method `delete_my_availability_block( $request )`:

1. Get `$current_staff` via `Bookit_Auth::get_current_staff()`
2. Get `$id = (int) $request['id']`
3. Verify the row exists AND belongs to `$current_staff['id']` — do not allow deletion of another staff member's rows:
```php
$row = $wpdb->get_row( $wpdb->prepare(
    "SELECT id, staff_id FROM {$wpdb->prefix}bookings_staff_working_hours
     WHERE id = %d AND is_working = 0 AND specific_date IS NOT NULL",
    $id
), ARRAY_A );

if ( ! $row ) {
    return new WP_Error( 'not_found', __( 'Time-off block not found.', 'bookit-booking-system' ), array( 'status' => 404 ) );
}
if ( (int) $row['staff_id'] !== (int) $current_staff['id'] ) {
    return new WP_Error( 'forbidden', __( 'You cannot delete another staff member\'s time-off block.', 'bookit-booking-system' ), array( 'status' => 403 ) );
}
```
4. Delete the row and return `{ "success": true, "message": "Time-off block removed." }`

---

## PART B — FRONTEND: `MyAvailability.vue`

### Create: `bookit-booking-system/dashboard/src/views/MyAvailability.vue`

Use Vue 3 `<script setup>`, Tailwind CSS, Axios via the existing `api` import (copy the pattern from `StaffHours.vue` exactly).

**Page layout:**

```
Header: "My Availability" + subtitle "Block time off and manage your schedule"

BLOCK TIME OFF FORM (always visible, not behind a toggle):
  Section title: "Block Time Off"

  Row 1: Date Range
    - Start Date (date input, min = today)
    - End Date (date input, min = start date value)
    - Helper text: "For a single day, set both dates the same"

  Row 2: All Day toggle
    - Label: "All Day"
    - Toggle switch (checkbox styled as toggle — copy the pattern from an existing view if one exists, otherwise a simple styled checkbox)
    - When toggled OFF: show two time pickers (Start Time, End Time) in HH:MM format

  Row 3: Reason dropdown
    - Options: 
        vacation      → "Vacation"
        sick_leave    → "Sick Leave"
        lunch_break   → "Lunch Break"
        personal      → "Personal"
        other         → "Other"

  Row 4: Notes (optional)
    - Textarea, placeholder "Add any notes (optional)"

  Row 5: Repeat
    - Select dropdown:
        none    → "Does not repeat"
        daily   → "Repeats daily (one block per day in range)"
        weekly  → "Repeats weekly (same day of week, 8 weeks)"
    - Helper text shown when weekly is selected: "Will create blocks every [day name] for 8 weeks from your start date"

  Submit button: "Block Time Off" (full width on mobile, auto on desktop)
  
  Conflict error: If the API returns a 409 error, display the error message prominently in a red alert box above the submit button — do NOT use an alert() dialog.

EXISTING BLOCKS section (below the form):
  Section title: "Upcoming Time Off" with count badge
  
  If loading: show 2 CardSkeleton components
  If empty: EmptyState with icon 🏖️ and message "No time off scheduled. Use the form above to block time."
  
  For each block, show a card with:
    - Date (DD/MM/YYYY format)
    - Reason label (map reason key to human label: vacation → "Vacation" etc.)
    - Time range OR "All Day" 
    - Notes (if any, shown in grey)
    - [Delete] button — on click, show a native confirm() dialog: "Remove this time-off block for [date]?" — on confirm, call DELETE endpoint and remove from local list without re-fetching

  Only show blocks where specific_date >= today (don't show past blocks)
  Sort by specific_date ascending
```

**API calls:**
- On mount: `GET /dashboard/my-availability` → populate blocks list
- On submit: `POST /dashboard/my-availability` with form data → on success, re-fetch blocks list, reset form
- On delete: `DELETE /dashboard/my-availability/{id}` → on success, remove from local array

**Validation (frontend, before API call):**
- date_from required and not in the past
- date_to >= date_from
- If all_day is false: start_time and end_time required, start_time < end_time
- reason required
- Show inline validation errors next to each field (red text below input), not as alert dialogs

**Loading / error states:**
- Form submit button shows "Saving..." while request is in flight
- On success: show toast success "Time off blocked successfully"
- On API error (non-409): show toast error with the error message
- On 409 conflict: show the conflict message in a red alert above the submit button (not a toast — the message needs to be prominent and persistent until the user changes the dates)

### Modify: `bookit-booking-system/dashboard/src/router/index.js`

Add after the `/my-schedule` route:
```js
{
  path: '/my-availability',
  name: 'MyAvailability',
  component: () => import('../views/MyAvailability.vue'),
  meta: { title: 'My Availability' }
}
```

### Modify: `bookit-booking-system/dashboard/src/components/Sidebar.vue`

In `mainNavigation`, add after the `my-schedule` entry:
```js
{ name: 'myAvailability', path: '/my-availability', icon: '🚫', label: 'My Availability' }
```

Visible to ALL roles. No `v-if` needed.

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. Use `DateTimeImmutable` with `DateTimeZone('Europe/London')` for all date calculations — never `date()` or `time()` directly.
- All DB queries: `$wpdb->prepare()`. No raw interpolation.
- Vue: `<script setup>`, no Options API.
- Tailwind only — no custom CSS.
- All PHP user-visible strings: `__( '...', 'bookit-booking-system' )`
- Do not remove, rename, or refactor any existing method or route.

---

## DELIVERABLES SUMMARY

1. MODIFIED: `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`
   - 3 new routes in `register_routes()`
   - 3 new methods: `get_my_availability()`, `create_my_availability_block()`, `delete_my_availability_block()`
2. NEW FILE: `bookit-booking-system/dashboard/src/views/MyAvailability.vue`
3. MODIFIED: `bookit-booking-system/dashboard/src/router/index.js`
4. MODIFIED: `bookit-booking-system/dashboard/src/components/Sidebar.vue`
```

---

## ✅ Task 2 Testing Checklist

**Navigation:**
- [ ] "My Availability" link appears in sidebar for both staff and admin roles
- [ ] `/my-availability` loads without a 404 or console errors

**Form — validation:**
- [ ] Submitting with an empty start date shows an inline validation error
- [ ] Setting end date before start date shows a validation error
- [ ] With All Day OFF: leaving times empty shows validation errors
- [ ] With All Day OFF: setting start time after end time shows a validation error
- [ ] Submitting with no reason selected shows a validation error

**Form — All Day toggle:**
- [ ] Toggle ON (default): time pickers are hidden
- [ ] Toggle OFF: time pickers appear

**Form — repeat helper text:**
- [ ] Selecting "Repeats weekly" shows the helper text with the correct day name (e.g. "Will create blocks every Monday for 8 weeks")

**Creating blocks:**
- [ ] Single day, all day, no repeat → 1 row appears in database, card appears in list
- [ ] Multi-day range (e.g. Mon–Fri), all day, no repeat → 5 rows in database, 5 cards in list
- [ ] Repeat weekly → 8 rows created (one per week), all appear in list
- [ ] Success toast appears after creating
- [ ] Form resets after successful submission

**Conflict detection:**
- [ ] Create a confirmed booking for yourself on a date, then try to block that date → red alert appears with "You have 1 confirmed booking during this time..."
- [ ] The form is NOT submitted to the database when a conflict exists
- [ ] Choosing different dates clears the red alert (it disappears when you change input values)

**Past date validation:**
- [ ] Setting start date to yesterday → inline error "Start date cannot be in the past"

**Existing blocks list:**
- [ ] Blocks show correct date (DD/MM/YYYY format)
- [ ] Reason label shows human-readable text ("Vacation", not "vacation")
- [ ] All-day blocks show "All Day" instead of a time range
- [ ] Timed blocks show the correct time range (e.g. "12:00 – 13:00")
- [ ] Notes appear in grey text below the reason when present
- [ ] Past blocks (specific_date < today) are NOT shown in the list

**Deleting blocks:**
- [ ] Delete button on a card shows a confirm dialog
- [ ] Confirming removes the card from the list immediately
- [ ] Row is deleted from `wp_bookings_staff_working_hours` in the database

**Availability integration:**
- [ ] Block an all-day slot for a date that previously had available slots
- [ ] Open the customer booking form for that date — no slots should be available for that staff member
- [ ] Delete the block — slots return on the booking form

**Isolation:**
- [ ] Log in as Staff A, create a block
- [ ] Log in as Staff B — cannot see or delete Staff A's blocks (the list only shows the logged-in user's own blocks)

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 2: Staff time-off blocking, my-availability endpoints and view"
```

Then report back "Task 2 complete ✅" and I'll prepare Task 3.