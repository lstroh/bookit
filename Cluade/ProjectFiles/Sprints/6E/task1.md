# TASK 1 OF 2: Cancelled Slot Unique Constraint Bug Fix
Sprint: 6E | Est: ~3h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/` — List ALL files. Confirm `0019-add-email-change-columns-to-customers.php`
   is the highest-numbered migration. The new migration for this task is **0020**.

2. `database/migrations/0019-add-email-change-columns-to-customers.php` — Read in full.
   Follow its exact class structure, `column_exists()` helper, `information_schema.COLUMNS`
   guard pattern, and `migration_id()` string. This is your template.

3. `database/migrations/0018-add-google-oauth-columns-to-staff.php` — Read as a second
   reference for the migration pattern.

4. `includes/api/class-dashboard-bookings-api.php` — Read TWO methods in full:
   - `cancel_booking()` — note the exact `$update_data` array and `$format` array structure,
     and where `$existing` is fetched (the row read before the UPDATE)
   - `bulk_action()` — the section where `'cancel' === $action` builds `$update_data`
     and calls `$wpdb->update()`. This path also cancels bookings and must be fixed.

5. `includes/api/class-wizard-api.php` — Read `cancel_booking_magic_link()` in full.
   Note the exact `$wpdb->update()` call. The `$booking` SELECT at the top fetches
   `id, status, booking_date, start_time, customer_id, magic_link_token` — but NOT
   `end_time`. You will need to add `end_time` to that SELECT.

6. `includes/class-bookit-database.php` — Read `create_bookings_table()` in full.
   Note the current `start_time TIME NOT NULL` and `end_time TIME NOT NULL` definitions
   and the `UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)` line.

7. `database/schema.sql` — Read the `wp_bookings` table definition.

8. `tests/unit/` — Grep for any test file that asserts `start_time` is non-null after
   cancellation, or that creates and cancels a booking and re-reads `start_time`.
   Update any such tests before writing new ones.

If any file does not exist or the migration list differs from what is described above,
stop and report back before proceeding.

---

## CONTEXT

`wp_bookings` has a unique index on `(staff_id, booking_date, start_time)` with no
partial condition on `status` or `deleted_at`. When a booking is cancelled the row
stays in the table with `status='cancelled'` and `deleted_at` set — permanently
occupying the unique slot. Any attempt to re-book that slot fails with a duplicate
key error even though the availability check (which filters `status NOT IN ('cancelled')`)
correctly shows it as free.

Two Playwright E2E tests are currently failing because of this bug:
- `tests/full/magic-link.spec.ts` — reschedule test
- `tests/full/z-email-cancellation.spec.ts` — cancellation email test

**Fix:** MySQL/MariaDB unique indexes ignore NULL values by design. NULL out
`start_time` and `end_time` on cancellation to free the unique slot. Preserve
the original values in two new audit columns (`cancelled_start_time`,
`cancelled_end_time`) so the slot history is not lost.

---

## IMPLEMENTATION REQUIREMENTS

### database/migrations/0020-nullable-booking-times-cancelled-audit.php — CREATE

Follow the exact class/method structure from migration 0019 (read it first).

- Migration class name: `Bookit_Migration_0020_Nullable_Booking_Times_Cancelled_Audit`
- Migration ID string: `'0020-nullable-booking-times-cancelled-audit'`

`up()` must perform these three steps in order:

**Step 1 — Modify `start_time` and `end_time` to allow NULL:**
Run unconditionally (MODIFY for allowing NULL is safe to repeat):
```sql
ALTER TABLE {prefix}bookings MODIFY start_time TIME NULL DEFAULT NULL;
ALTER TABLE {prefix}bookings MODIFY end_time   TIME NULL DEFAULT NULL;
```
Use `$wpdb->query()` with phpcs ignore comments matching the pattern in 0018/0019.

**Step 2 — Add `cancelled_start_time` column (information_schema guarded):**
```php
if ( ! $this->column_exists( $wpdb->prefix . 'bookings', 'cancelled_start_time' ) ) {
    $wpdb->query(
        "ALTER TABLE {$wpdb->prefix}bookings
         ADD COLUMN cancelled_start_time TIME NULL DEFAULT NULL AFTER end_time"
    );
}
```

**Step 3 — Add `cancelled_end_time` column (information_schema guarded):**
```php
if ( ! $this->column_exists( $wpdb->prefix . 'bookings', 'cancelled_end_time' ) ) {
    $wpdb->query(
        "ALTER TABLE {$wpdb->prefix}bookings
         ADD COLUMN cancelled_end_time TIME NULL DEFAULT NULL AFTER cancelled_start_time"
    );
}
```

`down()` reverses in order: DROP `cancelled_end_time`, DROP `cancelled_start_time`,
then MODIFY `start_time` and `end_time` back to `TIME NOT NULL`. Guard each DROP
with `column_exists()`.

The migration must be **idempotent** — running `up()` twice must produce no DB error.

---

### includes/api/class-dashboard-bookings-api.php — MODIFY `cancel_booking()`

Read the method first. `$existing` is already fetched via `SELECT *` so `start_time`
and `end_time` are available. In the `$update_data` array add:

```php
$update_data['cancelled_start_time'] = $existing['start_time'];
$update_data['cancelled_end_time']   = $existing['end_time'];
$update_data['start_time']           = null;
$update_data['end_time']             = null;
```

Add four corresponding entries to `$format`:
```php
$format[] = '%s'; // cancelled_start_time
$format[] = '%s'; // cancelled_end_time
$format[] = '%s'; // start_time (NULL serialised as %s in wpdb)
$format[] = '%s'; // end_time
```

Insert these additions **before** the `do_action( 'bookit_before_booking_cancelled' )`
call. Do not change any other logic in `cancel_booking()`.

---

### includes/api/class-dashboard-bookings-api.php — MODIFY `bulk_action()`

Read this method first. The per-booking SELECT currently fetches only
`id, staff_id, status, deleted_at`. Extend it to also select `start_time, end_time`.

Inside the per-booking loop, find the `if ( 'cancel' === $action )` block and extend it:

```php
if ( 'cancel' === $action ) {
    $update_data['deleted_at']           = current_time( 'mysql' );
    $update_data['cancelled_start_time'] = $booking['start_time'] ?? null;
    $update_data['cancelled_end_time']   = $booking['end_time']   ?? null;
    $update_data['start_time']           = null;
    $update_data['end_time']             = null;
    $formats[]                           = '%s'; // deleted_at
    $formats[]                           = '%s'; // cancelled_start_time
    $formats[]                           = '%s'; // cancelled_end_time
    $formats[]                           = '%s'; // start_time
    $formats[]                           = '%s'; // end_time
}
```

Do not alter the `complete` or `no_show` action branches.

---

### includes/api/class-wizard-api.php — MODIFY `cancel_booking_magic_link()`

Read the method first. Add `end_time` to the `$booking` SELECT at the top of the
method (it currently selects `start_time` but not `end_time`).

In the `$wpdb->update()` call, add these four fields and their format entries:

```php
'cancelled_start_time' => $booking['start_time'],
'cancelled_end_time'   => $booking['end_time'],
'start_time'           => null,
'end_time'             => null,
```

Add four `'%s'` entries to the format array. Do not change the audit log,
`do_action`, or email enqueue calls.

---

### includes/class-bookit-database.php — MODIFY `create_bookings_table()`

Read the method first. In the `CREATE TABLE` SQL string, change:

```sql
-- BEFORE:
start_time TIME NOT NULL,
end_time TIME NOT NULL,

-- AFTER:
start_time TIME NULL DEFAULT NULL,
end_time TIME NULL DEFAULT NULL,
cancelled_start_time TIME NULL DEFAULT NULL,
cancelled_end_time TIME NULL DEFAULT NULL,
```

Place `cancelled_start_time` and `cancelled_end_time` immediately after `end_time`
and before `duration`. This only affects fresh installs — existing sites use migration 0020.

---

### database/schema.sql — MODIFY

Update the `wp_bookings` table definition to match:
- `start_time TIME NULL DEFAULT NULL`
- `end_time TIME NULL DEFAULT NULL`
- Add `cancelled_start_time TIME NULL DEFAULT NULL` after `end_time`
- Add `cancelled_end_time TIME NULL DEFAULT NULL` after `cancelled_start_time`

Update the header comment to reference migration 0020.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Migration 0020 extends `Bookit_Migration_Base` — auto-discovered by
      `Bookit_Migration_Runner` via the path registered in `includes/functions-migration.php`
      (no manual registration needed)
- [ ] No new error codes
- [ ] No new audit log events (existing cancel audit logging unchanged)
- [ ] No new REST routes

---

## PHPUNIT REQUIREMENTS

Baseline: **971 tests, 0 failures** — must not regress.

Before writing new tests, grep `tests/unit/` for any test that:
- Asserts `start_time` is non-null after cancellation → change to assert
  `cancelled_start_time` is non-null
- Cancels a booking then reads `start_time` expecting a value → read
  `cancelled_start_time` instead

Write new test file: `tests/unit/test-cancelled-slot-fix.php`

Read an existing unit test file (e.g. `tests/unit/test-magic-link-flows.php`) first
to follow the established class/setUp/tearDown/helper patterns exactly.

**Required test cases:**

- `test_cancelled_booking_frees_unique_slot`
  Create a booking via `create_test_booking()`. Cancel it (update status, set deleted_at,
  set cancelled_start_time, null out start_time — matching the cancel_booking() logic).
  Immediately call `create_test_booking()` with the **same** `staff_id`, `booking_date`,
  `start_time`. Assert the second booking ID is a positive integer (no duplicate key error).

- `test_cancel_preserves_original_times_in_cancelled_columns`
  Create a booking with `start_time = '10:00:00'`, `end_time = '11:00:00'`. Cancel it.
  Read the row. Assert `$row['cancelled_start_time'] === '10:00:00'` and
  `$row['cancelled_end_time'] === '11:00:00'`.

- `test_cancelled_booking_has_null_start_time`
  Create and cancel a booking. Read the row. Assert `$this->assertNull( $row['start_time'] )`.

- `test_magic_link_cancel_also_frees_slot`
  Create a booking with a date at least 48 hours in the future (avoids cancellation policy
  window). Set `magic_link_token`. Cancel via `POST /wizard/cancel` REST endpoint.
  Assert `start_time IS NULL` in the DB. Then create a new booking for the same
  staff/date/start_time — assert it succeeds.

- `test_availability_check_ignores_cancelled_bookings`
  Create booking A and cancel it (slot freed). Create booking B for the same slot.
  Assert booking B has a valid ID. Assert only one non-cancelled booking exists for
  that `staff_id`/`booking_date`/`start_time` combination.

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass (971+ tests, 0 failures) before marking task complete.

---

## PLAYWRIGHT VERIFICATION

After PHPUnit passes, run the full Playwright suite:
```bash
cd bookit-booking-system/tests/e2e
npm run test:full
```

Expected:
- `tests/full/magic-link.spec.ts` — reschedule test now passes ✅
- `tests/full/z-email-cancellation.spec.ts` — cancellation email test now passes ✅
- All other tests remain green
- Maximum 1 skip (Stripe — run manually)

Report the new test counts back.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Cancelling a booking sets `start_time = NULL` and `end_time = NULL` on that row
- [ ] `cancelled_start_time` and `cancelled_end_time` contain the original times
- [ ] A new booking can be created for the same `staff_id`/`booking_date`/`start_time`
      immediately after the previous booking for that slot was cancelled
- [ ] Dashboard cancel path (`cancel_booking()`) applies the fix
- [ ] Bulk cancel path (`bulk_action()` with `action=cancel`) applies the fix
- [ ] Magic link cancel path (`cancel_booking_magic_link()`) applies the fix

### Technical
- [ ] Migration 0020 is idempotent (running `up()` twice produces no DB error)
- [ ] `information_schema.COLUMNS` used for all column existence checks (never `SHOW COLUMNS LIKE`)
- [ ] `create_bookings_table()` reflects nullable `start_time`/`end_time` and new audit columns
- [ ] `schema.sql` updated to match
- [ ] No PHP warnings or notices
- [ ] PHPUnit: 971+ tests, 0 failures

### Must NOT break
- [ ] Booking creation — `start_time`/`end_time` still required on INSERT (NOT NULL removed
      at DB level; validation remains in the booking creator)
- [ ] Availability check — already filters `status != 'cancelled'`; no change needed
- [ ] Magic link reschedule — writes fresh `start_time`/`end_time` values on reschedule,
      so a previously-nulled row gets real times back correctly
- [ ] `get_full_booking()` — must NOT filter `deleted_at IS NULL` (existing rule, unchanged)
- [ ] All 971 existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 6E, Task 1: Fix cancelled slot unique constraint bug

- Migration 0020: MODIFY start_time/end_time to NULL DEFAULT NULL;
  ADD cancelled_start_time and cancelled_end_time TIME NULL columns
- cancel_booking(): copy times to cancelled_* before nulling start/end
- bulk_action() cancel path: same pattern applied
- cancel_booking_magic_link(): add end_time to SELECT; same pattern applied
- create_bookings_table() and schema.sql updated for fresh installs
- PHPUnit: N tests, 0 failures
- Playwright: magic-link reschedule and cancellation email now passing

Fixes: cancelled bookings permanently blocking their unique slot.
Preserves original slot times in cancelled_start_time / cancelled_end_time
for audit trail. Slot can now be re-booked immediately after cancellation.
```

---

## KNOWN GOTCHAS

- **`SHOW COLUMNS LIKE` is banned.** MariaDB treats `_` as a wildcard. Always use
  `information_schema.COLUMNS` via the `column_exists()` helper in the migration base class.
- **NULL via `$wpdb->update()`.** Pass PHP `null` as the value with `'%s'` as format.
  wpdb correctly serialises this to SQL NULL.
- **`bulk_action()` SELECT** currently omits `start_time`/`end_time` — add them.
- **`cancel_booking_magic_link()` SELECT** currently omits `end_time` — add it.
- **`wp_bookings_staff.id` is the primary key** (not a `staff_id` column).
- **No frontend changes** — this task is PHP-only. No Vue files touched, no build required.

---

If you encounter an architecture decision not covered above, or a conflict with
existing code that this prompt does not resolve, STOP and report back before
writing any code.