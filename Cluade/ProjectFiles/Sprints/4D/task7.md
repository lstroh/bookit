TASK 7 OF 9: Package Redemption — Atomic Dashboard Endpoint
Sprint: 4D | Est: 8h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-customer-packages-api.php` — existing customer packages controller; read in full for permission callback pattern, response shape, and how customer_package_id is validated
2. `includes/api/class-dashboard-bookings-api.php` — read for `check_admin_permission()` pattern, `SELECT FOR UPDATE` optimistic locking example, and `$wpdb->query('START TRANSACTION')` / `COMMIT` / `ROLLBACK` usage
3. `includes/api/class-customer-package-lookup-api.php` — read for how applicable_service_ids is filtered in PHP; do not duplicate that logic, extract it or replicate it consistently
4. `includes/class-bookit-error-registry.php` — E5001–E5005 codes; `Bookit_Error_Registry::to_wp_error()` signature
5. `includes/class-bookit-audit-logger.php` — `Bookit_Audit_Logger::log()` signature and event naming conventions
6. `includes/class-bookit-loader.php` — where to wire the new controller; read the package API block for placement
7. `database/migrations/0007-create-package-redemptions-table.php` — exact columns of `wp_bookings_package_redemptions`
8. `database/migrations/0006-create-customer-packages-table.php` — exact columns of `wp_bookings_customer_packages`
9. `tests/unit/test-customer-packages-api.php` — test helper patterns (local `login_as()`, `create_test_staff()`, truncate order)
10. `tests/unit/test-use-package-redemption.php` — `insert_customer_package()` and `insert_package_type()` helper patterns from Task 6

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 7 delivers a single admin-only REST endpoint that lets dashboard administrators manually redeem one session from a customer's active package against a specific existing booking. This is distinct from the wizard redemption path (Task 6): the wizard creates a new booking AND redeems, whereas this endpoint links an already-existing booking to an already-existing customer package in one atomic database transaction. The entire operation — validation, decrement, redemption record insert, booking update — must succeed or fail as a unit, with full rollback on any failure. Stripe is not involved.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-package-redemption-api.php` — CREATE

**Class name:** `Bookit_Package_Redemption_API`

**Constructor:** registers `rest_api_init` hook, calls `$this->register_routes()`.

**Route:** `POST /bookit/v1/dashboard/package-redemptions`

**Permission callback:** `check_admin_permission()` — copy the exact method from `class-customer-packages-api.php`. `bookit_staff` role must be blocked.

**Request args (all required):**
- `customer_package_id` — integer, minimum 1
- `booking_id` — integer, minimum 1
- `notes` — string, optional, default `''`, sanitized with `sanitize_textarea_field`

**Callback method: `redeem_package( WP_REST_Request $request ): WP_REST_Response|WP_Error`**

Implement the full atomic redemption in this method. Follow these steps exactly:

**Step 1 — Start transaction:**
```php
$wpdb->query( 'START TRANSACTION' );
```

**Step 2 — Fetch and lock the customer package row (SELECT FOR UPDATE):**
```php
$package = $wpdb->get_row( $wpdb->prepare(
    "SELECT cp.*, pt.applicable_service_ids, pt.name AS package_type_name
     FROM {$wpdb->prefix}bookings_customer_packages cp
     JOIN {$wpdb->prefix}bookings_package_types pt ON pt.id = cp.package_type_id
     WHERE cp.id = %d
     FOR UPDATE",
    $customer_package_id
), ARRAY_A );
```
If not found: rollback, return `Bookit_Error_Registry::to_wp_error('E5001')`.

**Step 3 — Validate package is usable:**
- `status !== 'active'`:
  - `exhausted` → rollback, return `Bookit_Error_Registry::to_wp_error('E5002')`
  - `expired` → rollback, return `Bookit_Error_Registry::to_wp_error('E5003')`
  - other (cancelled) → rollback, return `new WP_Error('package_not_active', __('This package is not active.', 'bookit-booking-system'), ['status' => 422])`
- `sessions_remaining < 1` → rollback, return `Bookit_Error_Registry::to_wp_error('E5002')`
- `expires_at` not null AND `strtotime($package['expires_at']) < time()` → rollback, return `Bookit_Error_Registry::to_wp_error('E5003')`

**Step 4 — Fetch and lock the booking row (SELECT FOR UPDATE):**
```php
$booking = $wpdb->get_row( $wpdb->prepare(
    "SELECT id, service_id, customer_id, status, customer_package_id
     FROM {$wpdb->prefix}bookings
     WHERE id = %d
     FOR UPDATE",
    $booking_id
), ARRAY_A );
```
If not found: rollback, return `new WP_Error('booking_not_found', __('Booking not found.', 'bookit-booking-system'), ['status' => 404])`.

**Step 5 — Validate booking is redeemable:**
- If `$booking['customer_package_id']` is already set (non-null, non-zero): rollback, return `new WP_Error('booking_already_redeemed', __('This booking has already been redeemed against a package.', 'bookit-booking-system'), ['status' => 422])`.
- If `$booking['status']` is `cancelled` or `no_show`: rollback, return `new WP_Error('booking_not_redeemable', __('Cannot redeem a package against a cancelled or no-show booking.', 'bookit-booking-system'), ['status' => 422])`.

**Step 6 — Validate service match:**
- Read `applicable_service_ids` from `$package['applicable_service_ids']`. If not null, JSON-decode it.
- If decoded array is not null AND `$booking['service_id']` not in array → rollback, return `Bookit_Error_Registry::to_wp_error('E5004', ['service_id' => (int)$booking['service_id']])`.

**Step 7 — Update booking to link package:**
```php
$updated = $wpdb->update(
    $wpdb->prefix . 'bookings',
    [
        'customer_package_id' => $customer_package_id,
        'payment_method'      => 'package_redemption',
        'updated_at'          => current_time('mysql'),
    ],
    [ 'id' => $booking_id ],
    [ '%d', '%s', '%s' ],
    [ '%d' ]
);
if ( false === $updated ) {
    $wpdb->query( 'ROLLBACK' );
    return new WP_Error('db_error', __('Failed to update booking.', 'bookit-booking-system'), ['status' => 500]);
}
```

**Step 8 — Decrement sessions_remaining and update status:**
```php
$decremented = $wpdb->query( $wpdb->prepare(
    "UPDATE {$wpdb->prefix}bookings_customer_packages
     SET sessions_remaining = sessions_remaining - 1,
         status = CASE WHEN sessions_remaining - 1 <= 0 THEN 'exhausted' ELSE 'active' END,
         updated_at = %s
     WHERE id = %d",
    current_time('mysql'),
    $customer_package_id
) );
if ( false === $decremented ) {
    $wpdb->query( 'ROLLBACK' );
    return new WP_Error('db_error', __('Failed to update package.', 'bookit-booking-system'), ['status' => 500]);
}
```

**Step 9 — Insert redemption record:**
```php
$inserted = $wpdb->insert(
    $wpdb->prefix . 'bookings_package_redemptions',
    [
        'customer_package_id' => $customer_package_id,
        'booking_id'          => $booking_id,
        'redeemed_at'         => current_time('mysql'),
        'redeemed_by'         => get_current_user_id(),
        'notes'               => $notes,
        'created_at'          => current_time('mysql'),
    ],
    [ '%d', '%d', '%s', '%d', '%s', '%s' ]
);
if ( ! $inserted ) {
    $wpdb->query( 'ROLLBACK' );
    return new WP_Error('db_error', __('Failed to create redemption record.', 'bookit-booking-system'), ['status' => 500]);
}
$redemption_id = (int) $wpdb->insert_id;
```

**Step 10 — Commit:**
```php
$wpdb->query( 'COMMIT' );
```

**Step 11 — Audit log (after commit, outside transaction):**
```php
Bookit_Audit_Logger::log(
    'customer_package.redeemed',
    'customer_package',
    $customer_package_id,
    [
        'booking_id'         => $booking_id,
        'redemption_id'      => $redemption_id,
        'sessions_remaining' => (int) $package['sessions_remaining'] - 1,
        'redeemed_by'        => get_current_user_id(),
        'notes'              => $notes,
    ]
);
```

**Step 12 — Return response:**
```php
return new WP_REST_Response( [
    'success'            => true,
    'redemption_id'      => $redemption_id,
    'customer_package_id'=> $customer_package_id,
    'booking_id'         => $booking_id,
    'sessions_remaining' => (int) $package['sessions_remaining'] - 1,
    'package_status'     => ( (int) $package['sessions_remaining'] - 1 <= 0 ) ? 'exhausted' : 'active',
], 201 );
```

**`check_admin_permission()` method:** copy exactly from `class-customer-packages-api.php`.

---

### `includes/class-bookit-loader.php` — MODIFY

Read the file fully before modifying. After the customer package lookup API block, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-package-redemption-api.php';
new Bookit_Package_Redemption_API();
```

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations needed — all required tables exist
- [ ] No new error codes needed — E5001–E5005 already registered; two new `WP_Error` codes (`booking_not_found`, `booking_already_redeemed`, `booking_not_redeemable`) are inline, not registered globally
- [ ] Audit log event fired: `customer_package.redeemed` on successful commit
- [ ] REST endpoint follows `check_admin_permission()` pattern from `class-customer-packages-api.php`
- [ ] `bookit_staff` role must be blocked from this endpoint
- [ ] Full DB transaction (START TRANSACTION / COMMIT / ROLLBACK) wraps all mutating operations

---

## PHPUNIT REQUIREMENTS

Baseline: 644 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-package-redemption-api.php`

**Class name:** `Test_Package_Redemption_API`

Include local helpers: `login_as()`, `create_test_staff()`, `insert_package_type()`, `insert_customer()`, `insert_customer_package()`, `insert_booking()`.

**`insert_booking()` helper** — inserts a minimal booking row and returns the ID:
```php
private function insert_booking( array $overrides = [] ): int {
    global $wpdb;
    $defaults = [
        'customer_id'         => 1,
        'service_id'          => $this->test_service_id,
        'staff_id'            => $this->test_staff_id,
        'booking_date'        => date('Y-m-d', strtotime('+7 days')),
        'start_time'          => '10:00:00',
        'end_time'            => '11:00:00',
        'duration'            => 60,
        'status'              => 'confirmed',
        'total_price'         => 50.00,
        'deposit_amount'      => 0,
        'deposit_paid'        => 0,
        'balance_due'         => 50.00,
        'payment_method'      => 'pay_on_arrival',
        'customer_package_id' => null,
        'created_at'          => current_time('mysql'),
        'updated_at'          => current_time('mysql'),
    ];
    $data = array_merge( $defaults, $overrides );
    $wpdb->insert( $wpdb->prefix . 'bookings', $data );
    return (int) $wpdb->insert_id;
}
```

**setUp():** truncate in FK-safe order: `bookings_package_redemptions`, `bookings_customer_packages`, `bookings_package_types`, `bookings_customers`, `bookings`, `bookings_audit_log`. Seed test service and staff.

**tearDown():** same truncate + delete staff rows + restore `$_SERVER` and `$_REQUEST` if modified.

**Required test cases:**

Happy path:
- `test_redeem_package_returns_201` — valid admin, active package, valid booking → HTTP 201
- `test_redeem_package_decrements_sessions_remaining` — `sessions_remaining` is 1 less after redemption
- `test_redeem_package_sets_booking_customer_package_id` — booking row `customer_package_id` matches the redeemed package
- `test_redeem_package_sets_booking_payment_method` — booking `payment_method` becomes `package_redemption`
- `test_redeem_package_creates_redemption_record` — `wp_bookings_package_redemptions` row exists with correct `booking_id` and `customer_package_id`
- `test_redeem_package_sets_status_exhausted_on_last_session` — package with `sessions_remaining = 1` becomes `exhausted` after redemption
- `test_redeem_package_fires_audit_log` — `customer_package.redeemed` audit log entry exists after redemption
- `test_redeem_package_redeemed_by_is_current_user` — `redeemed_by` in redemption record equals the logged-in admin's user ID

Error paths:
- `test_redeem_package_returns_401_for_unauthenticated` — no login → 401
- `test_redeem_package_returns_403_for_staff_role` — `bookit_staff` login → 403
- `test_redeem_package_returns_404_for_missing_package` — non-existent `customer_package_id` → WP_Error code `E5001`
- `test_redeem_package_returns_404_for_missing_booking` — non-existent `booking_id` → WP_Error code `booking_not_found`
- `test_redeem_package_returns_422_for_exhausted_package` — package `status = exhausted` → WP_Error code `E5002`
- `test_redeem_package_returns_422_for_expired_package` — package `status = expired` → WP_Error code `E5003`
- `test_redeem_package_returns_422_for_already_redeemed_booking` — booking already has `customer_package_id` set → WP_Error code `booking_already_redeemed`
- `test_redeem_package_returns_422_for_cancelled_booking` — booking `status = cancelled` → WP_Error code `booking_not_redeemable`
- `test_redeem_package_returns_422_for_service_mismatch` — package restricted to service 99, booking for service 1 → WP_Error code `E5004`
- `test_redeem_package_returns_422_for_zero_sessions_remaining` — `sessions_remaining = 0` (even if status active) → WP_Error code `E5002`

Idempotency / rollback (unit-level):
- `test_redeem_package_does_not_double_decrement` — calling the endpoint twice with the same booking_id → second call returns `booking_already_redeemed`, `sessions_remaining` decremented only once

Note: Before implementing any WordPress REST API test assertions, use Context7 to resolve 'WordPress' and confirm current `WP_REST_Request` / `WP_REST_Response` test patterns.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `POST /bookit/v1/dashboard/package-redemptions` with valid admin credentials, active package, and unlinked booking → returns 201 with `redemption_id`, `sessions_remaining`, `package_status`
- [ ] Booking row `customer_package_id` is set after redemption
- [ ] Booking row `payment_method` updated to `package_redemption`
- [ ] `sessions_remaining` decremented by exactly 1
- [ ] Package `status` becomes `exhausted` when `sessions_remaining` reaches 0
- [ ] `wp_bookings_package_redemptions` row created with correct `redeemed_by` (admin user ID)
- [ ] Audit log entry `customer_package.redeemed` created
- [ ] Second call with same `booking_id` returns 422 `booking_already_redeemed` — no double decrement
- [ ] All error paths return the correct HTTP status code and WP_Error code

### Technical
- [ ] No PHP warnings or notices
- [ ] All mutating DB operations wrapped in START TRANSACTION / COMMIT / ROLLBACK
- [ ] `SELECT FOR UPDATE` used on both package and booking rows
- [ ] `bookit_staff` role blocked (403)
- [ ] PHPUnit suite passes (644+ tests, 0 failures)

### Must NOT break
- [ ] Wizard package redemption path (Task 6)
- [ ] Customer packages API (Task 3) — existing tests all pass
- [ ] All pay-on-arrival tests
- [ ] All booking creation tests

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 7: Atomic package redemption dashboard endpoint

- Add Bookit_Package_Redemption_API: POST /dashboard/package-redemptions
- Full DB transaction (START TRANSACTION / SELECT FOR UPDATE / COMMIT /
  ROLLBACK) wraps all mutating operations atomically
- Validates package status, expiry, sessions_remaining, service match,
  and booking redeemability before any writes
- Updates booking.customer_package_id and payment_method on success
- Decrements sessions_remaining via SQL expression; sets exhausted
  when last session used
- Inserts bookings_package_redemptions record with redeemed_by user ID
- Fires customer_package.redeemed audit log event after commit
- Prevents double-redemption: booking_already_redeemed guard
- Wire controller in class-bookit-loader.php

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.