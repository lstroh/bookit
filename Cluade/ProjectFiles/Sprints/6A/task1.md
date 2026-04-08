Now let me read the key files for 6A-1 before writing the prompt:I now have a clear picture of the code. Key findings:
- `test_reschedule_endpoint_fires_rescheduled_hook` **exists** and uses `did_action()` — so the hook must already be fired in `class-wizard-api.php` OR the test is expecting it but the hook isn't wired yet. The test asserts `$before + 1` which means it expects the hook to fire. I need to check if it's actually fired or just tested via the TODO comment.
- `update_booking()` in `class-dashboard-bookings-api.php` fires `bookit_after_booking_updated` but NOT `bookit_booking_rescheduled` — that needs adding.
- The `$existing` array is fetched before the update, so `$old_staff_id` is available.
- The loader has a TODO comment confirming `bookit_booking_rescheduled` is not yet fired.Excellent — I now have everything I need. Key confirmed findings:

1. **`bookit_booking_rescheduled` IS already fired** in `class-wizard-api.php` (magic link path) ✅ — the test `test_reschedule_endpoint_fires_rescheduled_hook` passes against existing code. The TODO comment in the loader is outdated.
2. **`bookit_booking_rescheduled` is NOT fired** in `update_booking()` in `class-dashboard-bookings-api.php` — needs adding when `booking_date` or `start_time` changes.
3. **`bookit_booking_reassigned`** — new hook, needs adding to `update_booking()` when `staff_id` changes.
4. The `$existing` array is fetched before the update, giving access to `old_staff_id`.
5. The `Extension_Plugin_API_Spec.md` hook documentation pattern is clear.

Now generating the Cursor prompt:

---

```
TASK 1 OF 10: Fire Missing Hooks — bookit_booking_rescheduled + bookit_booking_reassigned
Sprint: 6A | Est: 2h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-dashboard-bookings-api.php` — Read the full `update_booking()` method. Locate: (a) where `$existing` is fetched before the update, (b) where `$new_date`, `$new_time`, `$new_staff_id` are read from the request, (c) where `bookit_after_booking_updated` is fired after the DB update succeeds. Both new hooks must fire in this same post-update block.

2. `includes/api/class-wizard-api.php` — Read `reschedule_booking_magic_link()` in full. Confirm `bookit_booking_rescheduled` is already fired here (it is — do NOT add it again). This file requires NO changes.

3. `tests/unit/test-magic-link-flows.php` — Read `test_reschedule_endpoint_fires_rescheduled_hook()`. Confirm the test uses `did_action()` and already passes. This file requires NO changes.

4. `includes/class-bookit-loader.php` — Read the `define_cron_hooks()` method. Find the TODO comment on `bookit_booking_rescheduled`. Remove the TODO comment from that line after confirming the hook is now fired from `update_booking()`.

5. `Extension_Plugin_API_Spec.md` — Read the existing hook documentation entries (e.g. `bookit_after_booking_updated`, `bookit_after_booking_cancelled`). Follow the exact same documentation format for the new `bookit_booking_reassigned` hook entry.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-1 adds the two missing booking lifecycle hooks required by `Bookit_Staff_Notifier` (6A-3) and extension plugins. `bookit_booking_rescheduled` is already fired from the magic link reschedule endpoint — it only needs to be added to the dashboard `update_booking()` path. `bookit_booking_reassigned` is a brand-new hook that fires when a booking's `staff_id` changes via the dashboard. Both hooks fire after the DB update succeeds.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Read the full `update_booking()` method before making any changes.

After the existing `do_action( 'bookit_after_booking_updated', $booking_id, $new_data )` call (already present), add the following two conditional hook fires. Insert them immediately after `bookit_after_booking_updated`:

**Part A — `bookit_booking_rescheduled`:**

Fire this hook when `booking_date` OR `start_time` has changed. Use the `$existing` array (fetched before the update) for the old values, and the new values from `$update_data`:

```php
// Fire rescheduled hook if date or time changed (Sprint 6A-1).
$date_changed = $existing['booking_date'] !== $new_date;
$time_changed = $existing['start_time'] !== $new_time;
if ( $date_changed || $time_changed ) {
    do_action(
        'bookit_booking_rescheduled',
        $booking_id,
        $update_data
    );
}
```

Note: `$new_time` is the raw param from the request (may be `H:i` format). The `$existing['start_time']` is stored as `H:i:s`. To compare correctly, normalise `$new_time` to `H:i:s` before comparing — check how `update_booking()` currently normalises time before you implement this. Use the same normalisation that is already applied.

**Part B — `bookit_booking_reassigned`:**

Fire this hook when `staff_id` has changed. Read `$old_staff_id` from `$existing['staff_id']` (cast to int) BEFORE the update. `$new_staff_id` is already in scope as it's read earlier in the method.

```php
// Fire reassigned hook if staff member changed (Sprint 6A-1).
$old_staff_id = (int) $existing['staff_id'];
if ( $old_staff_id !== $new_staff_id ) {
    do_action(
        'bookit_booking_reassigned',
        $booking_id,
        $old_staff_id,
        $new_staff_id,
        $update_data
    );
}
```

Place the `$old_staff_id` variable assignment at the top of the post-update hook block (before the rescheduled hook), so it's available. Do NOT add a new DB query — `$existing` already holds the old data.

### `includes/class-bookit-loader.php` — MODIFY

Find this line in `define_cron_hooks()`:
```php
// TODO: bookit_booking_rescheduled not yet fired in core -- hook registered for future use.
```

Replace the TODO comment with:
```php
// bookit_booking_rescheduled -- fired from update_booking() (dashboard) and reschedule_booking_magic_link() (magic link).
```

No other changes to this file.

### `Extension_Plugin_API_Spec.md` — MODIFY

Add a new hook documentation entry for `bookit_booking_reassigned` in the "Action hooks" section, after the `bookit_after_booking_updated` entry. Follow the exact format of the existing entries. Content:

---
**Hook name:** `bookit_booking_reassigned`

**Fires:** After a booking's assigned staff member is changed via the dashboard `update_booking()` endpoint, after the DB update succeeds.

**Parameters:**
- `$booking_id` *(int)* — The booking's ID.
- `$old_staff_id` *(int)* — The staff member previously assigned.
- `$new_staff_id` *(int)* — The staff member now assigned.
- `$booking_data` *(array)* — The full updated booking data array written to the DB.

**Example use:**
```php
add_action(
    'bookit_booking_reassigned',
    function( int $booking_id, int $old_staff_id, int $new_staff_id, array $booking_data ) {
        // Notify old and new assignees, sync external calendar, etc.
    },
    10,
    4
);
```

**Note:** This hook does NOT fire for magic link reschedules (which cannot change staff) or for admin bulk actions.

---

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables or migrations (this task is hooks-only)
- [ ] No new error codes
- [ ] No new audit log events (existing `booking.rescheduled_by_customer` and `bookit_after_booking_updated` audit log entries remain in place)
- [ ] No new REST endpoints

---

## PHPUNIT REQUIREMENTS

Baseline: **880 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-sprint6a-hooks.php`

All tests must set up a valid booking (with staff, service, customer) and make REST requests using the existing test helper pattern from `tests/unit/test-dashboard-bookings-api.php`. Read that file to understand `create_test_staff()`, `create_test_service()`, `create_test_booking()`, and `login_as()` helper methods — follow the exact same pattern.

Required test cases:

- `test_rescheduled_hook_fires_on_date_change_in_update_booking`: Update a booking via `PUT /dashboard/bookings/{id}` changing only `booking_date`. Assert `did_action('bookit_booking_rescheduled')` increments by 1.

- `test_rescheduled_hook_fires_on_time_change_in_update_booking`: Update a booking changing only `booking_time`. Assert `did_action('bookit_booking_rescheduled')` increments by 1.

- `test_rescheduled_hook_does_not_fire_when_date_unchanged`: Update a booking changing only `status` (not date or time). Assert `did_action('bookit_booking_rescheduled')` does NOT change.

- `test_reassigned_hook_fires_on_staff_id_change`: Update a booking via `PUT /dashboard/bookings/{id}` changing `staff_id` to a different staff member. Assert `did_action('bookit_booking_reassigned')` increments by 1.

- `test_reassigned_hook_passes_old_and_new_staff_ids`: Same as above, but capture the hook args using `add_action()` with a closure that stores the `$old_staff_id` and `$new_staff_id` parameters. Assert both are correct.

- `test_reassigned_hook_does_not_fire_when_staff_unchanged`: Update a booking keeping the same `staff_id`. Assert `did_action('bookit_booking_reassigned')` does NOT change.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `PUT /dashboard/bookings/{id}` with a changed `booking_date` fires `bookit_booking_rescheduled` once, after the DB update
- [ ] `PUT /dashboard/bookings/{id}` with a changed `booking_time` fires `bookit_booking_rescheduled` once, after the DB update
- [ ] `PUT /dashboard/bookings/{id}` with only `status` changed does NOT fire `bookit_booking_rescheduled`
- [ ] `PUT /dashboard/bookings/{id}` with a changed `staff_id` fires `bookit_booking_reassigned` once, passing correct `$old_staff_id` and `$new_staff_id`
- [ ] `PUT /dashboard/bookings/{id}` with unchanged `staff_id` does NOT fire `bookit_booking_reassigned`
- [ ] Magic link reschedule endpoint (`POST /wizard/reschedule`) continues to fire `bookit_booking_rescheduled` exactly as before — no regression
- [ ] TODO comment removed from `class-bookit-loader.php`
- [ ] `Extension_Plugin_API_Spec.md` documents the `bookit_booking_reassigned` hook with correct signature

### Technical
- [ ] No PHP warnings or notices
- [ ] Both new `do_action()` calls placed AFTER the DB update succeeds (after the `false === $result` guard)
- [ ] `$old_staff_id` read from `$existing` array, NOT from a new DB query
- [ ] PHPUnit suite passes (885+ tests, 0 failures)

### Must NOT break
- [ ] `test_reschedule_endpoint_fires_rescheduled_hook` in `test-magic-link-flows.php` — still passes
- [ ] All existing `update_booking()` tests in `test-dashboard-bookings-api.php` — still pass
- [ ] `bookit_after_booking_updated` hook — still fires on every update unchanged

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 1: Fire bookit_booking_rescheduled + bookit_booking_reassigned hooks

- update_booking() now fires bookit_booking_rescheduled when booking_date or start_time changes
- update_booking() now fires bookit_booking_reassigned when staff_id changes, passing old + new staff IDs
- bookit_booking_rescheduled was already firing from magic link reschedule endpoint (no change needed there)
- Removed TODO comment from class-bookit-loader.php
- Documented bookit_booking_reassigned hook in Extension_Plugin_API_Spec.md
- New test file: tests/unit/test-sprint6a-hooks.php (5 new tests)

Tests: 885 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.