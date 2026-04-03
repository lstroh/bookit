Now let me read the key files for Task 5A-1 before writing the prompt.I have enough context. Let me check one more thing — the payments table column names to confirm the `type` vs `payment_type` inconsistency:I now have all the context needed. Key findings:

1. **Payments column is `payment_type` not `type`** — the ENUM in the live schema is `payment_type ENUM('deposit','full_payment','refund')`. The sprint doc says `type` but the actual DB uses `payment_type`. Cursor must use `payment_type`.
2. **Next error code is `E2005`** (E2001–E2004 are taken, booking category).
3. **Backfill migration needs per-record loop** — matching the `0003-add-booking-lock-version.php` pattern exactly.
4. **`magic_link_token` is absent** from `create_bookings_table()` — confirmed.
5. **`payment_type` ENUM missing `balance_payment`** — confirmed in both `class-bookit-database.php` and `schema.sql`.

Here is the Cursor prompt:

---

```
TASK 1 OF 6: DB Schema Fixes — Issues 4, 7, 12, 13
Sprint: 5A | Est: 8h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below in full before writing a single line of code.
If any file does not exist at the path shown, STOP and report back.

1. `database/migrations/0011-drop-working-hours-table.php` — class naming
   convention for the next three migrations (0012, 0013, 0014)
2. `database/migrations/class-bookit-migration-base.php` — base class contract
3. `database/migrations/0003-add-booking-lock-version.php` — per-record
   backfill loop pattern to replicate in migration 0014
4. `includes/class-bookit-migration-runner.php` — runner class_name_from_filename()
   convention (must match class names you create)
5. `includes/class-bookit-database.php` — read `create_bookings_table()` to
   confirm `magic_link_token` is absent; read `create_payments_table()` to
   confirm the ENUM column name (`payment_type`) and its current values
6. `includes/api/class-dashboard-bookings-api.php` — read the full
   `update_booking()` method to understand exactly where the transition guard
   must be inserted (after `$old_status = $existing['status'];` is set, before
   the availability check)
7. `includes/payment/class-payment-processor.php` — read
   `process_pay_on_arrival()` in full to find where the payment record insert
   must go (after `$booking_id` is confirmed non-error, before the email send)
8. `includes/booking/class-booking-creator.php` — read the full
   `create_booking()` method to find where `magic_link_token` generation must
   be wired (after `lock_version` is stored, before the return of `$booking_id`)
9. `includes/class-bookit-error-registry.php` — confirm `register()` signature
10. `includes/config/error-codes.php` — confirm the highest existing E2xxx
    code (E2004) so the new code `E2005` does not collide
11. `includes/class-bookit-audit-logger.php` — confirm `log()` signature:
    `log(action, object_type, object_id, context)`
12. `tests/unit/test-dashboard-bookings-api.php` — read all existing
    `update_booking` tests so you do not break them

---

## CONTEXT

This task fixes four deferred DB audit issues that are prerequisites for
Task 5A-3 (magic link cancellation/rescheduling). Issue 4 adds the
`magic_link_token` column and wires generation on booking creation. Issue 7
adds state transition enforcement to `update_booking()`. Issue 12 adds
`balance_payment` to the payments ENUM. Issue 13 fixes a gap where
pay-on-arrival bookings create no payment record. All schema changes go
through `Bookit_Migration_Runner` using the 4-digit numbered pattern.

---

## IMPLEMENTATION REQUIREMENTS

### `database/migrations/0012-add-magic-link-token.php` — CREATE

- Class name: `Bookit_Migration_0012_Add_Magic_Link_Token`
  (derive from `class_name_from_filename()` convention in migration runner)
- `migration_id()` returns `'0012-add-magic-link-token'`
- `plugin_slug()` returns `'bookit-booking-system'`
- `up()`:
  - `ALTER TABLE {$wpdb->prefix}bookings ADD COLUMN magic_link_token VARCHAR(64) NULL DEFAULT NULL AFTER lock_version`
  - Then: `ALTER TABLE {$wpdb->prefix}bookings ADD KEY idx_magic_link_token (magic_link_token)`
  - Wrap each ALTER in an existence check: check `SHOW COLUMNS FROM ... LIKE 'magic_link_token'`
    before adding the column; check `SHOW INDEX FROM ... WHERE Key_name = 'idx_magic_link_token'`
    before adding the index
- `down()`:
  - Drop the index first, then drop the column
- No `require_once` for the base class — it is already loaded by the runner

### `database/migrations/0013-add-balance-payment-type.php` — CREATE

- Class name: `Bookit_Migration_0013_Add_Balance_Payment_Type`
- `migration_id()` returns `'0013-add-balance-payment-type'`
- `up()`:
  - **IMPORTANT**: The live column is named `payment_type`, not `type`.
    Read `class-bookit-database.php` to confirm before writing SQL.
  - `ALTER TABLE {$wpdb->prefix}bookings_payments MODIFY COLUMN payment_type ENUM('deposit','full_payment','balance_payment','refund') DEFAULT 'full_payment'`
  - No existence check needed — MODIFY COLUMN is idempotent for adding ENUM values
- `down()`:
  - Restore original ENUM without `balance_payment`:
    `MODIFY COLUMN payment_type ENUM('deposit','full_payment','refund') DEFAULT 'full_payment'`

### `database/migrations/0014-backfill-magic-link-tokens.php` — CREATE

- Class name: `Bookit_Migration_0014_Backfill_Magic_Link_Tokens`
- `migration_id()` returns `'0014-backfill-magic-link-tokens'`
- `up()`:
  - Requires `wp_generate_password` — call `if (!function_exists('wp_generate_password')) { require_once ABSPATH . 'wp-includes/pluggable.php'; }`
  - Query all rows WHERE `magic_link_token IS NULL` — `SELECT id FROM {$wpdb->prefix}bookings WHERE magic_link_token IS NULL`
  - **Process each row individually in a loop** — do NOT use a single mass UPDATE
  - Per row: generate token with `wp_generate_password(32, false, false)`, then
    `$wpdb->update(table, ['magic_link_token' => $token], ['id' => $row->id], ['%s'], ['%d'])`
  - Follow the exact per-record pattern from `0003-add-booking-lock-version.php`
- `down()`:
  - `UPDATE {$wpdb->prefix}bookings SET magic_link_token = NULL` (acceptable for rollback)

### `includes/config/error-codes.php` — MODIFY

Add one new error registration at the end of the E2xxx block (after E2004),
before the E3xxx block:

```php
Bookit_Error_Registry::register(
    'E2005',
    array(
        'user_message' => __( 'This status change is not allowed. Please refresh and try again.', 'bookit-booking-system' ),
        'log_message'  => 'Invalid status transition on booking ID {booking_id}: {old_status} → {new_status}',
        'http_status'  => 422,
        'category'     => 'booking',
    )
);
```

Also add the constant definition in the `if (!defined(...))` block at the top
of the file (follow E5001–E5005 pattern but in a new block for E2xxx additions):

```php
if ( ! defined( 'BOOKIT_E2005' ) ) {
    define( 'BOOKIT_E2005', 'E2005' ); // INVALID_STATUS_TRANSITION
}
```

### `includes/api/class-dashboard-bookings-api.php` — MODIFY (`update_booking()`)

After reading the full method, insert the transition guard **immediately after**
`$old_status = $existing['status'];` is set and **before** the
`$datetime_changed` availability check block.

Add a private static method `get_allowed_transitions()` to the class:

```php
private static function get_allowed_transitions(): array {
    return array(
        'pending'         => array( 'pending_payment', 'confirmed', 'cancelled' ),
        'pending_payment' => array( 'confirmed', 'cancelled' ),
        'confirmed'       => array( 'completed', 'cancelled', 'no_show' ),
        'completed'       => array(),
        'cancelled'       => array(),
        'no_show'         => array(),
    );
}
```

Insert the guard in `update_booking()`:

```php
// State transition enforcement (Issue 7).
if ( $new_status !== $old_status ) {
    $allowed = self::get_allowed_transitions()[ $old_status ] ?? array();
    if ( ! in_array( $new_status, $allowed, true ) ) {
        Bookit_Audit_Logger::log(
            'booking.invalid_transition',
            'booking',
            $booking_id,
            array(
                'old_status' => $old_status,
                'new_status' => $new_status,
            )
        );
        return Bookit_Error_Registry::to_wp_error(
            'E2005',
            array(
                'booking_id' => $booking_id,
                'old_status' => $old_status,
                'new_status' => $new_status,
            )
        );
    }
}
```

**IMPORTANT**: The guard applies to all roles including admin and `bookit_staff`.
Do not add any role bypass. The guard must fire before any DB write.

### `includes/booking/class-booking-creator.php` — MODIFY (`create_booking()`)

After reading the full method, add `magic_link_token` generation immediately
after the existing `lock_version` update block (which updates `lock_version`
via `$wpdb->update()`):

```php
// Generate and store a magic link token for customer self-service links.
$magic_link_token = wp_generate_password( 32, false, false );
$wpdb->update(
    $wpdb->prefix . 'bookings',
    array( 'magic_link_token' => $magic_link_token ),
    array( 'id' => $booking_id ),
    array( '%s' ),
    array( '%d' )
);
```

Do not add `magic_link_token` to the initial `$wpdb->insert()` call — keep
the pattern consistent with how `booking_reference` and `lock_version` are
handled (insert first, then update).

### `includes/payment/class-payment-processor.php` — MODIFY (`process_pay_on_arrival()`)

After reading the full method, find the point after `$booking_id` is confirmed
non-error (after the `is_wp_error($booking_id)` check) and insert a payment
record **before** the email send block:

```php
// Issue 13: Insert payment record for pay-on-arrival bookings.
// status = 'pending' because cash has not yet been collected by staff.
global $wpdb;
$wpdb->insert(
    $wpdb->prefix . 'bookings_payments',
    array(
        'booking_id'       => $booking_id,
        'customer_id'      => $booking_creator->get_last_customer_id(), // see note below
        'amount'           => isset( $session_data['total_price'] ) ? (float) $session_data['total_price'] : 0.00,
        'payment_type'     => 'full_payment',
        'payment_method'   => 'pay_on_arrival',
        'payment_status'   => 'pending',
        'transaction_date' => current_time( 'mysql' ),
        'created_at'       => current_time( 'mysql' ),
        'updated_at'       => current_time( 'mysql' ),
    ),
    array( '%d', '%d', '%f', '%s', '%s', '%s', '%s', '%s', '%s' )
);
```

**IMPORTANT before implementing**: Read `process_pay_on_arrival()` to find
how `customer_id` is accessible at this point. The `Booking_System_Booking_Creator`
may not expose `get_last_customer_id()` — if so, retrieve it from the DB:

```php
$customer_id = (int) $wpdb->get_var(
    $wpdb->prepare(
        "SELECT customer_id FROM {$wpdb->prefix}bookings WHERE id = %d",
        $booking_id
    )
);
```

Use whichever approach the existing code supports. The `amount` should come
from the booking's `total_price` column — retrieve from DB if not in session:

```php
$total_price = (float) $wpdb->get_var(
    $wpdb->prepare(
        "SELECT total_price FROM {$wpdb->prefix}bookings WHERE id = %d",
        $booking_id
    )
);
```

Also update `create_payments_table()` in `includes/class-bookit-database.php`
to include `balance_payment` in the `payment_type` ENUM, so fresh installs
are aligned with the migration:

```
payment_type ENUM('deposit','full_payment','balance_payment','refund') DEFAULT 'full_payment',
```

---

## INFRASTRUCTURE REQUIREMENTS

- [x] 3 new migrations via `Bookit_Migration_Runner`:
  - `0012-add-magic-link-token.php` — ADD COLUMN + index on `wp_bookings`
  - `0013-add-balance-payment-type.php` — MODIFY COLUMN on `wp_bookings_payments`
  - `0014-backfill-magic-link-tokens.php` — per-record backfill loop
- [x] New error code `E2005` registered in `includes/config/error-codes.php`
- [x] Audit log fired on invalid transition: `booking.invalid_transition`
- [x] All migrations extend `Bookit_Migration_Base` and are picked up by
      `Bookit_Migration_Runner::run_pending()`

---

## PHPUNIT REQUIREMENTS

Baseline: **821 tests, 0 failures** — must not regress.

New test file: `tests/unit/test-sprint5a-schema-fixes.php`

Use the same test class structure and `setUp()` patterns as
`tests/unit/test-dashboard-bookings-api.php`.

Required test cases:

- `test_magic_link_token_column_exists`
  Confirm column present: `SHOW COLUMNS FROM {prefix}bookings LIKE 'magic_link_token'`
  Assert result is not empty.

- `test_new_booking_has_magic_link_token`
  Create a booking via `Booking_System_Booking_Creator::create_booking()`.
  Assert the resulting row has a non-null `magic_link_token` of at least 32 chars.

- `test_magic_link_token_is_unique_per_booking`
  Create two bookings via the booking creator (different dates/times to avoid
  slot conflict). Assert their `magic_link_token` values differ.

- `test_invalid_status_transition_returns_422`
  Create a booking with `status = 'completed'`. Send a PUT request via
  `WP_REST_Request` to `bookit/v1/dashboard/bookings/{id}` with
  `status = 'confirmed'`. Assert response status is 422 and error code
  is `E2005`.

- `test_valid_status_transition_succeeds`
  Create a booking with `status = 'confirmed'`. Send PUT with
  `status = 'completed'`. Assert response is 200.

- `test_terminal_status_cannot_be_changed`
  Create bookings with `status = 'cancelled'` and `status = 'no_show'`.
  Attempt to update each to `'confirmed'`. Both must return 422 / E2005.

- `test_balance_payment_enum_value_accepted`
  `$wpdb->insert()` a row into `{prefix}bookings_payments` with
  `payment_type = 'balance_payment'`. Assert `$wpdb->last_error` is empty and
  `$wpdb->insert_id > 0`.

- `test_poa_booking_creates_payment_record`
  Mock or call `process_pay_on_arrival()` with valid session data. After it
  returns, query `{prefix}bookings_payments` for the returned booking ID.
  Assert: one row exists, `payment_method = 'pay_on_arrival'`,
  `payment_status = 'pending'`, `payment_type = 'full_payment'`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking this task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Every new booking created via the wizard or dashboard gets a non-null,
      32-character `magic_link_token` in the DB
- [ ] Existing bookings (before migration) get a backfilled token after
      migration 0014 runs
- [ ] `update_booking()` returns HTTP 422 / E2005 for any invalid transition
      (e.g. `completed → confirmed`, `cancelled → pending`)
- [ ] All transitions in the allowed map succeed without triggering the guard
- [ ] Pay-on-arrival bookings have a row in `wp_bookings_payments` with
      `payment_method = 'pay_on_arrival'` and `payment_status = 'pending'`
- [ ] Inserting a payment row with `payment_type = 'balance_payment'` succeeds
      without a DB error

### Technical
- [ ] No PHP warnings or notices
- [ ] All 3 migrations follow the 4-digit numbered pattern and are picked up
      by `Bookit_Migration_Runner::run_pending()`
- [ ] E2005 registered in `error-codes.php` with `http_status = 422`
- [ ] `BOOKIT_E2005` constant defined
- [ ] PHPUnit suite passes (821+ tests, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` — booking submission still works end-to-end
- [ ] Existing valid status updates in `update_booking()` (e.g.
      `pending → confirmed`, `confirmed → completed`) still return 200
- [ ] Stripe and dashboard manual booking flows — `magic_link_token` silently
      added alongside existing `booking_reference` and `lock_version`
- [ ] All existing `test-dashboard-bookings-api.php` tests still pass

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 1: DB schema fixes — Issues 4, 7, 12, 13

- Add magic_link_token VARCHAR(64) column to wp_bookings (migration 0012)
- Add balance_payment to wp_bookings_payments payment_type ENUM (migration 0013)
- Backfill magic_link_token for existing bookings per-record (migration 0014)
- Wire magic_link_token generation in Booking_System_Booking_Creator::create_booking()
- Add state transition guard to update_booking() with E2005 error code
- Insert payment record for pay-on-arrival bookings in process_pay_on_arrival()
- Register E2005 INVALID_STATUS_TRANSITION in error-codes.php
- Update create_payments_table() to include balance_payment in ENUM on fresh install

Tests: 821+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.