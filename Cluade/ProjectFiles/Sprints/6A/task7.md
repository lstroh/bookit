I have everything I need. I can see the full `update_staff()` method, `get_staff_details()`, and the `StaffFormModal.vue` structure clearly. Now generating the 6A-6 prompt:

---

```
TASK 7 OF 10: Staff Edit Form — Admin-Editable Notification Preferences
Sprint: 6A | Est: 3h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-dashboard-bookings-api.php` — Read the full `update_staff()` method. Find the `$new_data` array and its format string — `notification_preferences` must be added to both. Also read `get_staff_details()` in full — it must be extended to include `notification_preferences` in the response.

2. `dashboard/src/components/StaffFormModal.vue` — Read the full file. Find the Role/Display Order/Is Active fields block (the `grid grid-cols-1 sm:grid-cols-3` section) — the new preferences controls go immediately after it and before the Google Calendar ID field. Note the `populateForm()` function — it must be extended to populate the new preferences state. Note the `isEditing` computed — preferences are only shown when editing.

3. `dashboard/src/views/Staff.vue` — Read to confirm how `StaffFormModal` is called and what props it receives. Confirm `staffMember` prop shape.

4. `tests/unit/test-staff-api.php` (or equivalent) — Search for `test_update_staff` or `test_get_staff_details` to understand the existing test pattern for staff API tests. The new tests follow the same pattern.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-6 extends the staff edit form so admins can set notification preferences on behalf of any staff member. The same 4 controls from 6A-5 appear in `StaffFormModal.vue` but only when editing (not creating) and only visible to admin-role users. The existing `PUT /dashboard/staff/{id}` and `GET /dashboard/staff/{id}` endpoints are extended — no new endpoints needed.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

**Change 1 — Extend `get_staff_details()`:**

Read the full method. Find where it builds the staff response array. Add `notification_preferences` decoded with defaults, using the same pattern as `get_my_profile()`:

```php
// Decode notification preferences with defaults.
$pref_defaults = array(
    'new_booking'    => 'immediate',
    'reschedule'     => 'immediate',
    'cancellation'   => 'immediate',
    'daily_schedule' => false,
);
$raw_prefs = $staff['notification_preferences'] ?? null;
$parsed    = ! empty( $raw_prefs ) ? json_decode( $raw_prefs, true ) : null;
$staff['notification_preferences'] = is_array( $parsed )
    ? array_merge( $pref_defaults, $parsed )
    : $pref_defaults;
```

Also add `notification_preferences` to the `SELECT` columns in the `get_staff_details()` query if it isn't already there (read the method first — do not assume).

**Change 2 — Extend `update_staff()` args registration:**

In the `register_rest_route()` call for `PUT /dashboard/staff/(?P<id>\d+)`, add a new arg:

```php
'notification_preferences' => array(
    'type'              => 'object',
    'sanitize_callback' => function ( $param ) {
        return is_array( $param ) ? $param : null;
    },
),
```

**Change 3 — Extend `update_staff()` method:**

Read the full `update_staff()` method carefully. Find the `$new_data` array and its corresponding format string array. Add `notification_preferences` to both.

After reading all existing params, add this block before the `$wpdb->update()` call:

```php
// Handle notification_preferences (admin only — staff role blocked by check_admin_permission).
$raw_notification_prefs = $request->get_param( 'notification_preferences' );
if ( null !== $raw_notification_prefs && is_array( $raw_notification_prefs ) ) {
    $valid_frequencies = array( 'immediate', 'daily', 'weekly' );
    $pref_defaults     = array(
        'new_booking'    => 'immediate',
        'reschedule'     => 'immediate',
        'cancellation'   => 'immediate',
        'daily_schedule' => false,
    );
    $sanitized_prefs = array(
        'new_booking'    => in_array( $raw_notification_prefs['new_booking'] ?? '', $valid_frequencies, true )
                            ? $raw_notification_prefs['new_booking']
                            : $pref_defaults['new_booking'],
        'reschedule'     => in_array( $raw_notification_prefs['reschedule'] ?? '', $valid_frequencies, true )
                            ? $raw_notification_prefs['reschedule']
                            : $pref_defaults['reschedule'],
        'cancellation'   => in_array( $raw_notification_prefs['cancellation'] ?? '', $valid_frequencies, true )
                            ? $raw_notification_prefs['cancellation']
                            : $pref_defaults['cancellation'],
        'daily_schedule' => isset( $raw_notification_prefs['daily_schedule'] )
                            ? (bool) $raw_notification_prefs['daily_schedule']
                            : $pref_defaults['daily_schedule'],
    );
    $new_data['notification_preferences']   = wp_json_encode( $sanitized_prefs );
    $formats[]                               = '%s';
}
```

Note: `check_admin_permission` already gates this endpoint — no additional role check needed inside the method.

### `dashboard/src/components/StaffFormModal.vue` — MODIFY

**Script changes:**

Add new reactive state for notification preferences (alongside existing `formData`):

```js
const staffNotificationPrefs = ref({
  new_booking: 'immediate',
  reschedule: 'immediate',
  cancellation: 'immediate',
  daily_schedule: false
})
```

Extend `populateForm()` — after existing field assignments, add:

```js
if (member.notification_preferences) {
  staffNotificationPrefs.value = { ...staffNotificationPrefs.value, ...member.notification_preferences }
}
```

Extend the save payload in `handleSubmit()` (or equivalent save method — read the file to find it). When `isEditing.value` is true, include:

```js
notification_preferences: staffNotificationPrefs.value
```

**Template changes:**

Add a new section after the Role/Display Order/Is Active grid and before the Google Calendar ID field. Only show when editing (`v-if="isEditing"`):

```html
<!-- Notification Preferences (admin editing only) -->
<div v-if="isEditing" class="border-t border-gray-200 pt-4">
  <h3 class="text-sm font-semibold text-gray-900 mb-3">Notification Preferences</h3>
  <p class="text-xs text-gray-500 mb-4">
    Control when this staff member receives email notifications.
    Staff members can also update these from their own profile.
  </p>

  <div class="space-y-3">
    <!-- New Booking -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">New Booking</label>
      <select
        v-model="staffNotificationPrefs.new_booking"
        class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Reschedule -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Reschedule</label>
      <select
        v-model="staffNotificationPrefs.reschedule"
        class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Cancellation -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Cancellation</label>
      <select
        v-model="staffNotificationPrefs.cancellation"
        class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Daily Schedule Toggle -->
    <div class="flex items-start justify-between pt-2 border-t border-gray-100">
      <div>
        <p class="text-sm font-medium text-gray-700">Daily Schedule Email</p>
        <p class="text-xs text-gray-500 mt-0.5">
          Send a morning summary of today's bookings
        </p>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="staffNotificationPrefs.daily_schedule"
        @click="staffNotificationPrefs.daily_schedule = !staffNotificationPrefs.daily_schedule"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-0.5"
        :class="staffNotificationPrefs.daily_schedule ? 'bg-primary-600' : 'bg-gray-200'"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="staffNotificationPrefs.daily_schedule ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
    </div>
  </div>
</div>
```

**Frontend build** — after all Vue changes:
```
npm run build
(in bookit-booking-system/dashboard/)
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables, migrations, or REST endpoints
- [ ] `check_admin_permission` already gates `PUT /dashboard/staff/{id}` — staff role is automatically blocked
- [ ] No new error codes

---

## PHPUNIT REQUIREMENTS

Baseline: **919 tests, 0 failures** — must not regress.

Add new tests to the existing staff API test file (search for `test-staff-api.php` or `test-dashboard-bookings-api.php` — read to find where existing `update_staff` tests live, and add there).

Required test cases:

- `test_update_staff_saves_notification_preferences`: Login as admin. `PUT /dashboard/staff/{id}` with `notification_preferences: { new_booking: 'daily', reschedule: 'weekly', cancellation: 'immediate', daily_schedule: true }`. Assert 200. Then `GET /dashboard/staff/{id}` and assert `staff.notification_preferences` matches.

- `test_get_staff_detail_includes_notification_preferences`: Login as admin. `GET /dashboard/staff/{id}`. Assert response includes `notification_preferences` key with all 4 subkeys.

- `test_staff_role_cannot_update_other_staff_preferences`: Login as staff role. Attempt `PUT /dashboard/staff/{other_id}` with `notification_preferences`. Assert 401 or 403 (the `check_admin_permission` gate should block this).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /dashboard/staff/{id}` response includes `notification_preferences` with all 4 keys and correct defaults for NULL
- [ ] `PUT /dashboard/staff/{id}` saves `notification_preferences` correctly
- [ ] Invalid frequency values fall back to defaults — never stored
- [ ] Staff role cannot access `PUT /dashboard/staff/{id}` (existing `check_admin_permission` gate)
- [ ] Staff edit form shows Notification Preferences section only when `isEditing = true`
- [ ] Preferences load correctly from `GET /dashboard/staff/{id}` when opening edit modal
- [ ] Preferences are included in the save payload when submitting the form

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] `notification_preferences` added to both `$new_data` array and `$formats` array in `update_staff()`
- [ ] `npm run build` completes without errors
- [ ] PHPUnit suite passes (922+ tests, 0 failures)

### Must NOT break
- [ ] All existing staff API tests — `update_staff()` and `get_staff_details()` existing behaviour unchanged
- [ ] Creating a new staff member — `notification_preferences` param absent from create flow (only edit)
- [ ] `StaffFormModal` create mode — no preferences section shown, no preferences in payload
- [ ] `GET /dashboard/staff/{id}` existing fields — all still present

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 6: Staff edit form — admin-editable notification preferences

- Extended GET /dashboard/staff/{id} to include notification_preferences
- Extended PUT /dashboard/staff/{id} to accept and save notification_preferences
- Admin-only (check_admin_permission gate already in place)
- StaffFormModal.vue: preferences section shown in edit mode only
- Preferences load from API on modal open, included in save payload
- 3 new PHPUnit tests

Tests: 922 passing, 0 failures
```

---

After implementation, run `npm run build` in `bookit-booking-system/dashboard/` before committing.

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.