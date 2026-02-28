I now have everything I need. The migration pattern is clear (class-based, `up()` method, registered in `class-bookit-activator.php`), the sidebar pattern is clear (separate `mainNavigation` and `settingsNavigation` arrays with admin `v-if`), and the existing endpoints are fully understood.

---

```
Sprint 4A Progress: 0/10 tasks complete

⏭️ Task 1:  Staff Schedule View + Mark Actions (16h)  — WRITING PROMPT NOW
□  Task 2:  Time-Off Blocking (18h)
□  Task 3:  Staff Earnings Display (6h)
□  Task 4:  Reports Nav + Overview Dashboard (8h)
□  Task 5:  Revenue Report (14h)
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 0 / 112
```

---

## Task 1 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 1 of Sprint 4A for the Bookit Booking System WordPress plugin. This task has two parts:

PART 1A: A new database migration to create `wp_bookings_status_log`
PART 1B: A new backend endpoint `GET /dashboard/my-schedule`
PART 1C: A new Vue view `MySchedule.vue` at route `/my-schedule`

Read every file referenced below before writing any code. Do not duplicate anything that already exists.

---

## PART 1A — DATABASE MIGRATION

### Files to read first:
- `bookit-booking-system/database/migrations/migration-add-staff-working-hours.php` — copy this class structure exactly
- `bookit-booking-system/includes/class-bookit-activator.php` — you must add the new migration here
- `bookit-booking-system/database/schema.sql` — add migration notes at the bottom

### Create: `bookit-booking-system/database/migrations/migration-add-status-log.php`

```php
<?php
// Class: Bookit_Migration_Add_Status_Log
// Method: up() — idempotent, uses dbDelta, returns bool
// Creates table: wp_bookings_status_log with columns:
//   id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
//   booking_id         BIGINT UNSIGNED NOT NULL
//   old_status         VARCHAR(50) NOT NULL
//   new_status         VARCHAR(50) NOT NULL
//   changed_by_staff_id BIGINT UNSIGNED NOT NULL
//   changed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
//   notes              TEXT NULL
//   PRIMARY KEY (id)
//   KEY idx_booking_id (booking_id)
//   KEY idx_changed_by (changed_by_staff_id)
//   KEY idx_changed_at (changed_at)
// ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
// Use require_once ABSPATH . 'wp-admin/includes/upgrade.php' and dbDelta($sql)
// The up() method must be safe to run multiple times (dbDelta handles this)
```

### Modify: `bookit-booking-system/includes/class-bookit-activator.php`

After the existing `$staff_working_hours_migration->up();` block, add:

```php
// Run migration for status log table (Sprint 4A, Task 1).
require_once BOOKIT_PLUGIN_DIR . 'database/migrations/migration-add-status-log.php';
$status_log_migration = new Bookit_Migration_Add_Status_Log();
$status_log_migration->up();
```

### Modify: `bookit-booking-system/database/schema.sql`

At the bottom of the MIGRATION NOTES section, append:

```
-- Migration 5: Add Booking Status Log Table
-- Date: [today's date]
-- Sprint: Sprint 4A, Task 1
--
-- Added table: wp_bookings_status_log
-- Columns: id, booking_id, old_status, new_status, changed_by_staff_id, changed_at, notes
-- Migration file: database/migrations/migration-add-status-log.php
```

---

## PART 1B — BACKEND ENDPOINT + STATUS LOGGING

### Files to read first:
- `bookit-booking-system/includes/api/class-dashboard-bookings-api.php` — read the ENTIRE file before writing any code. You will add new methods to this class, not create a new class.
- `bookit-booking-system/includes/class-bookit-auth.php` — for Bookit_Auth::get_current_staff()

### DO NOT create a new PHP class. Add everything to `Bookit_Dashboard_Bookings_API`.

### Add to `register_routes()` in `class-dashboard-bookings-api.php`:

```
GET /dashboard/my-schedule
- permission_callback: check_dashboard_permission
- args:
    week_start: optional, format YYYY-MM-DD, defaults to Monday of current week (Europe/London)
    include_upcoming: optional boolean, default true — if true, also return next 7 days of bookings
```

### Add method `get_my_schedule( $request )`:

Logic:
1. Get current staff via `Bookit_Auth::get_current_staff()`. Use `$current_staff['id']` as the staff_id filter — staff only ever see their own bookings here.
2. Calculate `$week_start` from the `week_start` param, or default to the Monday of the current week in Europe/London timezone. Use `new DateTimeImmutable('now', new DateTimeZone('Europe/London'))` — never use `date()` or `time()` directly.
3. `$week_end` = $week_start + 6 days (Sunday).
4. Query `wp_bookings` for bookings where `staff_id = $current_staff['id']` AND `booking_date BETWEEN $week_start AND $week_end` AND `deleted_at IS NULL`. Order by `booking_date ASC, start_time ASC`.
5. If `include_upcoming` is true, also query bookings from `$week_end + 1 day` to `$week_end + 7 days` (the next 7 days beyond the current week). This is the "upcoming" list — order by `booking_date ASC, start_time ASC`.
6. JOIN `wp_bookings_services` (for service name, duration) and `wp_bookings_customers` (for first_name, last_name) in both queries.
7. Format each booking with this helper (reuse or extend the existing `format_booking_for_response` method if it already exists in the class):
   - id, booking_date, start_time (HH:MM), end_time (HH:MM), status, service_name, duration, customer_name (first + last), total_price, deposit_paid, staff_notes, special_requests, is_today (boolean: booking_date == today in Europe/London)
8. Group the week bookings by `booking_date` (keyed YYYY-MM-DD). Include all 7 days as keys even if empty (empty array value).
9. Return:
```json
{
  "success": true,
  "week_start": "YYYY-MM-DD",
  "week_end": "YYYY-MM-DD",
  "today": "YYYY-MM-DD",
  "staff_name": "First Last",
  "week_bookings": {
    "2026-02-23": [...],
    "2026-02-24": [],
    ...
  },
  "upcoming_bookings": [...],
  "week_total": 12,
  "today_total": 3
}
```

### Modify `mark_booking_complete()` and `mark_booking_no_show()`:

After the `$wpdb->update(...)` call that sets the new status, in BOTH methods, insert a row into `wp_bookings_status_log`:

```php
$wpdb->insert(
    $wpdb->prefix . 'bookings_status_log',
    array(
        'booking_id'          => $booking_id,
        'old_status'          => $booking['status'],
        'new_status'          => 'completed', // or 'no-show'
        'changed_by_staff_id' => $current_staff['id'],
        'changed_at'          => current_time( 'mysql' ),
        'notes'               => null,
    ),
    array( '%d', '%s', '%s', '%d', '%s', '%s' )
);
```

Make sure `$booking['status']` is captured BEFORE the update call (it already is in the existing method — verify this when reading the file).

---

## PART 1C — FRONTEND: MySchedule.vue

### Files to read first:
- `bookit-booking-system/dashboard/src/views/Dashboard.vue` — copy the loading/error/empty state patterns, toast notification usage, and api call pattern exactly
- `bookit-booking-system/dashboard/src/router/index.js` — add the new route here
- `bookit-booking-system/dashboard/src/components/Sidebar.vue` — add nav item here

### Create: `bookit-booking-system/dashboard/src/views/MySchedule.vue`

Use Vue 3 `<script setup>`, Tailwind CSS, Axios via the existing `api` import (match the pattern from Dashboard.vue exactly).

**Layout structure:**

```
Page header: "My Schedule" + subtitle showing staff name + current week range (e.g., "23–29 Feb 2026")

Week navigation row: 
  [← Prev Week] [Today] [→ Next Week]
  Clicking Prev/Next updates week_start param and re-fetches.
  "Today" button jumps to current week.

TODAY SECTION (shown prominently at top if today is in the displayed week):
  - "Today — Monday, 23 February 2026" heading
  - List of today's bookings OR EmptyState "No appointments scheduled for today"

THIS WEEK section:
  - One row per day (Mon–Sun), showing day label + date
  - Today's row has a subtle highlight (e.g., bg-blue-50 border-l-4 border-blue-500)
  - Each day shows its bookings or a subtle "No appointments" placeholder (not a full EmptyState component — just a soft grey text line)
  - Days in the past are slightly muted (opacity-60)

UPCOMING APPOINTMENTS section (below the week):
  - Heading: "Upcoming — Next 7 Days" with badge showing count
  - Chronological flat list
  - If empty: EmptyState with icon 📆 and message "No upcoming appointments"

BOOKING CARD (reused in all three sections):
  Each card shows:
    - Time range: "09:00 – 10:00"
    - Service name (font-semibold)
    - Customer name
    - Duration (e.g., "60 min")
    - Status badge (use same getStatusClass() and formatStatus() as Dashboard.vue)
    - If status is 'confirmed' AND booking is not in the past: show two action buttons:
        [✓ Mark Complete]  [✗ No-Show]
    - Both buttons show a native confirm() dialog before acting:
        Mark Complete: "Mark this booking as complete?\n\nCustomer: {name}\nService: {service}\nTime: {time}"
        No-Show: "Mark {customer name} as a no-show?\n\nThis will be logged. You can undo this from the Bookings list."
    - On confirm, call the existing endpoints:
        POST /dashboard/bookings/{id}/complete
        POST /dashboard/bookings/{id}/no-show
    - On success: update the booking status locally in the reactive data (do not re-fetch the whole page)
    - On success: show toast notification (copy toastSuccess pattern from Dashboard.vue)
    - On error: show toast error
    - While the action is pending: disable both buttons on that card (use a local ref per booking id)
```

**Date formatting rules (all dates displayed in UK format):**
- Week heading: "23–29 Feb 2026"
- Day headings: "Monday, 23 February 2026"
- Booking time: "09:00 – 10:00"
- Use `Intl.DateTimeFormat` with `timeZone: 'Europe/London'` for all formatting — do not use `.toLocaleDateString()` without a locale.

**Week navigation logic (frontend):**
- `weekStart` is a ref holding a `Date` object set to Monday 00:00 Europe/London.
- On mount: calculate Monday of current week. Pass as `week_start=YYYY-MM-DD` query param to the API.
- Prev/Next buttons subtract/add 7 days and re-fetch.
- The YYYY-MM-DD string sent to the API must be computed in Europe/London timezone (use Intl or a small helper, never `toISOString()` which returns UTC).

**Empty and loading states:**
- While loading: show 3 CardSkeleton components (same as Dashboard.vue)
- On error: show ErrorState component with retry button (same as Dashboard.vue)
- These components are already imported in Dashboard.vue — use the same imports.

### Modify: `bookit-booking-system/dashboard/src/router/index.js`

Add after the `/profile` route:
```js
{
  path: '/my-schedule',
  name: 'MySchedule',
  component: () => import('../views/MySchedule.vue'),
  meta: { title: 'My Schedule' }
}
```

### Modify: `bookit-booking-system/dashboard/src/components/Sidebar.vue`

In the `mainNavigation` array, add after the `{ name: 'dashboard', path: '/', ... }` entry:
```js
{ name: 'mySchedule', path: '/my-schedule', icon: '🗓️', label: 'My Schedule' }
```

This item is visible to ALL roles (both staff and admin). It does not require any `v-if` condition — it goes in `mainNavigation`, not `settingsNavigation`.

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. No direct `date()` or `time()` — use `DateTimeImmutable` with `DateTimeZone('Europe/London')` or WordPress helpers (`current_time`, `wp_date`).
- All DB queries: use `$wpdb->prepare()`. No raw interpolation.
- Vue: `<script setup>`, no Options API.
- Tailwind only — no custom CSS except what already exists in the file.
- All user-visible strings: wrap PHP strings in `__( '...', 'bookit-booking-system' )`.
- Do not remove, rename, or refactor any existing method or route.
- Do not add `require_once` for any class that is not new — only the migration class is new here.

---

## DELIVERABLES SUMMARY

1. NEW FILE: `bookit-booking-system/database/migrations/migration-add-status-log.php`
2. MODIFIED: `bookit-booking-system/includes/class-bookit-activator.php` — run the new migration
3. MODIFIED: `bookit-booking-system/database/schema.sql` — migration notes appended
4. MODIFIED: `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`:
   - New route registration in `register_routes()`
   - New method `get_my_schedule()`
   - Status log INSERT added to `mark_booking_complete()` and `mark_booking_no_show()`
5. NEW FILE: `bookit-booking-system/dashboard/src/views/MySchedule.vue`
6. MODIFIED: `bookit-booking-system/dashboard/src/router/index.js` — new route
7. MODIFIED: `bookit-booking-system/dashboard/src/components/Sidebar.vue` — new nav item
```

---

## ✅ Task 1 Testing Checklist

Once Cursor has generated the code, test the following in Local by Flywheel. Tick each one off before reporting back.

**Migration:**
- [ ] Deactivate and reactivate the plugin — no PHP errors
- [ ] Check `wp_bookings_status_log` table exists in your database (use Adminer or TablePlus)
- [ ] Verify columns: `id`, `booking_id`, `old_status`, `new_status`, `changed_by_staff_id`, `changed_at`, `notes`
- [ ] Run the migration a second time (deactivate/reactivate again) — no errors, no duplicate table

**Status logging:**
- [ ] Mark a confirmed booking as "Complete" from the dashboard
- [ ] Open `wp_bookings_status_log` — verify a row was inserted with correct `old_status = 'confirmed'`, `new_status = 'completed'`, and your staff ID
- [ ] Repeat for "No-Show" — verify `new_status = 'no-show'`

**My Schedule — navigation:**
- [ ] "My Schedule" link appears in the sidebar for both staff and admin roles
- [ ] Navigating to `/my-schedule` loads the page without a 404

**My Schedule — data:**
- [ ] Page loads and shows the current week (Mon–Sun) with UK date formatting
- [ ] Week heading shows correct date range (e.g., "23–29 Feb 2026")
- [ ] If you have bookings this week, they appear under the correct day
- [ ] Today's row is visually highlighted (blue border/background)
- [ ] Past days are slightly muted
- [ ] "Upcoming — Next 7 Days" section shows bookings beyond the current week
- [ ] All booking cards show: time range, service name, customer name, duration, status badge

**My Schedule — week navigation:**
- [ ] "← Prev Week" shows previous week's bookings
- [ ] "→ Next Week" shows next week's bookings
- [ ] "Today" button returns to current week
- [ ] Date range in the heading updates correctly with each navigation

**My Schedule — mark actions:**
- [ ] "Mark Complete" button appears on confirmed bookings that are not in the past
- [ ] Clicking "Mark Complete" shows a confirmation dialog
- [ ] Confirming updates the status badge to "Completed" without a full page reload
- [ ] Success toast notification appears
- [ ] "No-Show" button works the same way
- [ ] Both buttons are disabled while an action is pending
- [ ] A row in `wp_bookings_status_log` is created for each action

**My Schedule — isolation:**
- [ ] Log in as a staff user — only that staff member's bookings appear
- [ ] Log in as admin — only the admin's own bookings appear (not all bookings)

**Empty states:**
- [ ] Navigate to a week with no bookings — "No appointments scheduled for today" shown for today, soft grey "No appointments" shown for other days
- [ ] If no upcoming bookings — EmptyState with "No upcoming appointments" shown

**Errors:**
- [ ] Check browser console — no JS errors on page load
- [ ] Check PHP debug log — no PHP errors or warnings

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 1: Staff schedule view, my-schedule endpoint, status log migration"
```

Then report back "Task 1 complete ✅" and I'll prepare Task 2.