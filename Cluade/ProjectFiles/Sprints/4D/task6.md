TASK 6 OF 9: Booking Wizard Step 5 — "Use a Package" Option + Redemption Path
Sprint: 4D | Est: 8h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-5-payment.php` — existing Step 5 template including the Task 4 package selection section; read in full before modifying
2. `includes/payment/class-payment-processor.php` — `process_payment()` switch and `process_pay_on_arrival()` method; pattern to follow for new `use_package` case
3. `includes/booking/class-booking-creator.php` — `create_booking()` method and `$booking_data` array; must be extended to write `customer_package_id`
4. `includes/api/class-customer-packages-api.php` — `format_customer_package_row()` response shape; status validation logic
5. `includes/core/class-session-manager.php` — `get()`, `set()`, `get_data()` API
6. `includes/api/class-contact-api.php` — how session data is written from REST handlers; `customer_email` field name in session
7. `includes/api/class-available-packages-api.php` — public endpoint just built in Task 4; already returns packages filtered by service
8. `database/migrations/0007-create-package-redemptions-table.php` — schema for `wp_bookings_package_redemptions`; columns and FK constraints
9. `includes/class-bookit-error-registry.php` — existing E5001–E5005 package error codes
10. `includes/class-bookit-audit-logger.php` — `Bookit_Audit_Logger::log()` signature
11. `tests/test-pay-on-arrival.php` — test patterns for payment processor + booking creator
12. `tests/unit/test-customer-packages-api.php` — insert helpers and truncate patterns for package tables

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6 adds the "Use a Package" redemption path to the booking wizard. A customer who already owns an active package (purchased previously) can redeem one session at Step 5 instead of paying again. This path bypasses Stripe entirely — it works like Pay-on-Arrival but records the package redemption. The task also extends `class-booking-creator.php` to write the `customer_package_id` column (added by migration 0008 but not yet populated). Stripe package purchase is deferred to the live environment sprint and must NOT be implemented here.

**This task does NOT touch:**
- The "Buy a Package" UI section from Task 4 (leave it as-is)
- Stripe or PayPal payment paths
- The package redemption atomic endpoint (Task 7)

---

## IMPLEMENTATION REQUIREMENTS

### `includes/booking/class-booking-creator.php` — MODIFY

Read the file fully before making any changes.

In `create_booking()`, find the `$booking_data` array that is passed to `$wpdb->insert()`. Add `customer_package_id` to it:

```php
'customer_package_id' => isset( $data['customer_package_id'] ) ? absint( $data['customer_package_id'] ) : null,
```

Add the corresponding format placeholder to the `$format` array: `'%d'` (or `null` — use `'%d'` and let MySQL handle `0` → `NULL` via the column's nullable definition... actually: use a conditional: if `customer_package_id` is `0` or falsy, set it to `null` in `$booking_data` and use `'%s'` format for null-safe insert).

**Correct pattern for nullable BIGINT:**
```php
'customer_package_id' => ! empty( $data['customer_package_id'] ) ? absint( $data['customer_package_id'] ) : null,
```
Format: `'%d'` when set, but `$wpdb->insert()` with a PHP `null` value and `'%d'` format will insert NULL correctly in WordPress.

Do not change any other logic in `create_booking()`. All existing tests must still pass.

---

### `includes/payment/class-payment-processor.php` — MODIFY

Read the file fully before making any changes.

**Step 1 — Add new `use_package` case to `process_payment()` switch:**

```php
case 'use_package':
    $result = $this->process_use_package( $session_data );
    if ( is_wp_error( $result ) ) {
        wp_safe_redirect( home_url( '/book?step=5&bookit_error=' . rawurlencode( $result->get_error_code() ) ) );
        exit;
    }
    wp_safe_redirect( $result['redirect_url'] );
    exit;
```

**Step 2 — Add private method `process_use_package(array $session_data): array|WP_Error`:**

This method follows the same structure as `process_pay_on_arrival()`. Read that method fully and mirror its pattern.

Logic:

1. Validate `$session_data` is not empty. Return `WP_Error('invalid_session', ...)` if empty.

2. Read `$customer_package_id = absint( $session_data['customer_package_id'] ?? 0 )`. If `0`, return `WP_Error('missing_package_selection', __('No package selected.', 'bookit-booking-system'))`.

3. Fetch the customer package row from `wp_bookings_customer_packages` (JOIN with `wp_bookings_package_types` to get `sessions_count`, `applicable_service_ids`):
   ```php
   $row = $wpdb->get_row( $wpdb->prepare(
       "SELECT cp.*, pt.applicable_service_ids, pt.name AS package_type_name
        FROM {$wpdb->prefix}bookings_customer_packages cp
        JOIN {$wpdb->prefix}bookings_package_types pt ON pt.id = cp.package_type_id
        WHERE cp.id = %d LIMIT 1",
       $customer_package_id
   ), ARRAY_A );
   ```
   If not found: return `Bookit_Error_Registry::to_wp_error('E5001')`.

4. Validate the package is usable:
   - If `status !== 'active'`: check which error applies:
     - `exhausted` → return `Bookit_Error_Registry::to_wp_error('E5002')`
     - `expired` → return `Bookit_Error_Registry::to_wp_error('E5003')`
     - anything else (cancelled) → return `WP_Error('package_not_active', __('This package is not active.', 'bookit-booking-system'), ['status' => 422])`
   - If `sessions_remaining < 1`: return `Bookit_Error_Registry::to_wp_error('E5002')`
   - If `expires_at` is not null AND `strtotime($row['expires_at']) < time()`: return `Bookit_Error_Registry::to_wp_error('E5003')`

5. Validate the package applies to the selected service:
   - Read `$service_id = absint( $session_data['service_id'] ?? 0 )`
   - Decode `applicable_service_ids` from JSON. If not null and `$service_id` not in the array: return `Bookit_Error_Registry::to_wp_error('E5004', ['service_id' => $service_id])`

6. Map session data to booking data (identical to `process_pay_on_arrival()` field mapping):
   ```php
   $booking_data = [
       'service_id'          => $session_data['service_id'] ?? '',
       'staff_id'            => $session_data['staff_id'] ?? '',
       'booking_date'        => $session_data['date'] ?? '',
       'booking_time'        => $session_data['time'] ?? '',
       'customer_first_name' => $session_data['customer_first_name'] ?? '',
       'customer_last_name'  => $session_data['customer_last_name'] ?? '',
       'customer_email'      => $session_data['customer_email'] ?? '',
       'customer_phone'      => $session_data['customer_phone'] ?? '',
       'special_requests'    => $session_data['customer_special_requests'] ?? '',
       'cooling_off_waiver'  => absint( $session_data['cooling_off_waiver'] ?? 0 ),
       'payment_method'      => 'package_redemption',
       'payment_intent_id'   => null,
       'stripe_session_id'   => null,
       'amount_paid'         => 0,
       'customer_package_id' => $customer_package_id,   // NEW field
   ];
   ```

7. Apply `bookit_booking_data_before_insert` filter (same as pay_on_arrival).

8. Create booking via `Booking_System_Booking_Creator::create_booking( $booking_data )`. On `WP_Error`: return it.

9. **Decrement sessions_remaining and create redemption record** — do this AFTER booking creation succeeds:
   ```php
   // Decrement sessions_remaining
   $wpdb->query( $wpdb->prepare(
       "UPDATE {$wpdb->prefix}bookings_customer_packages
        SET sessions_remaining = sessions_remaining - 1,
            status = CASE WHEN sessions_remaining - 1 <= 0 THEN 'exhausted' ELSE 'active' END,
            updated_at = %s
        WHERE id = %d",
       current_time('mysql'),
       $customer_package_id
   ) );

   // Create redemption record
   $wpdb->insert(
       $wpdb->prefix . 'bookings_package_redemptions',
       [
           'customer_package_id' => $customer_package_id,
           'booking_id'          => $booking_id,
           'redeemed_at'         => current_time('mysql'),
           'redeemed_by'         => 0,   // 0 = customer self-service
           'notes'               => null,
           'created_at'          => current_time('mysql'),
       ],
       [ '%d', '%d', '%s', '%d', '%s', '%s' ]
   );
   ```

10. Fire audit log:
    ```php
    Bookit_Audit_Logger::log(
        'customer_package.redeemed',
        'customer_package',
        $customer_package_id,
        [ 'booking_id' => $booking_id, 'sessions_remaining' => (int)$row['sessions_remaining'] - 1 ]
    );
    ```

11. Fire `do_action('bookit_after_booking_created', $booking_id, $booking_data)`.

12. Send confirmation emails (best-effort — copy the email sending block from `process_pay_on_arrival()` exactly).

13. Return:
    ```php
    return [
        'success'      => true,
        'booking_id'   => $booking_id,
        'redirect_url' => home_url('/booking-confirmed?booking_id=' . $booking_id),
    ];
    ```

---

### New REST endpoint: `includes/api/class-customer-package-lookup-api.php` — CREATE

The payment step needs to fetch the current customer's active packages dynamically (the customer is identified by email stored in session — but since this is server-side rendered at Step 5, we also need a REST endpoint for JS use).

**Class name:** `Bookit_Customer_Package_Lookup_API`

**Route:** `GET /bookit/v1/wizard/my-packages`

**Permission callback:** `'__return_true'` (public — wizard endpoint)

**Args:**
- `customer_email` — string, required

**Callback logic:**
1. Sanitise and validate `customer_email` — must be a valid email. Return 400 if not.
2. Look up customer in `wp_bookings_customers` by email. Return `[]` (200) if not found (not an error — new customers have no packages).
3. Query `wp_bookings_customer_packages` JOIN `wp_bookings_package_types` where `cp.customer_id = X` AND `cp.status = 'active'` AND (`cp.expires_at IS NULL` OR `cp.expires_at > NOW()`) AND `cp.sessions_remaining > 0`.
4. Additionally filter by `service_id` if provided as optional param (same `applicable_service_ids` JSON check as `class-available-packages-api.php`).
5. Return array with shape per row:
   ```php
   [
       'id'                 => (int),
       'package_type_name'  => (string),
       'sessions_remaining' => (int),
       'sessions_total'     => (int),
       'expires_at'         => (string|null),
   ]
   ```

Wire in `includes/class-bookit-loader.php` after the available packages API block.

---

### `includes/class-bookit-loader.php` — MODIFY

After the available packages API block, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-customer-package-lookup-api.php';
new Bookit_Customer_Package_Lookup_API();
```

---

### `public/templates/booking-step-5-payment.php` — MODIFY

Read the file fully before making any changes.

Add a **"Use an existing package"** section. This is separate from the Task 4 "Buy a Package" section. Place it ABOVE the "Buy a Package" section (existing packages should be offered before purchase).

**Fetch at template render time** (only when `packages_enabled = '1'`):

```php
<?php
$existing_packages = [];
if ( '1' === $packages_enabled && ! empty( $session['customer_email'] ) ) {
    global $wpdb;
    $customer = $wpdb->get_row( $wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}bookings_customers WHERE email = %s LIMIT 1",
        $session['customer_email']
    ) );
    if ( $customer ) {
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT cp.id, cp.sessions_remaining, cp.sessions_total, cp.expires_at,
                    pt.name AS package_type_name, pt.applicable_service_ids
             FROM {$wpdb->prefix}bookings_customer_packages cp
             JOIN {$wpdb->prefix}bookings_package_types pt ON pt.id = cp.package_type_id
             WHERE cp.customer_id = %d
               AND cp.status = 'active'
               AND cp.sessions_remaining > 0
               AND (cp.expires_at IS NULL OR cp.expires_at > NOW())",
            $customer->id
        ), ARRAY_A );
        $current_service_id = isset( $session['service_id'] ) ? (int) $session['service_id'] : 0;
        foreach ( (array) $rows as $row ) {
            $applicable = null;
            if ( ! empty( $row['applicable_service_ids'] ) ) {
                $applicable = json_decode( $row['applicable_service_ids'], true );
            }
            if ( null === $applicable || in_array( $current_service_id, (array) $applicable, true ) ) {
                $existing_packages[] = $row;
            }
        }
    }
}
?>
```

**Render the "Use a Package" section** (only when there are matching existing packages):

```php
<?php if ( '1' === $packages_enabled && ! empty( $existing_packages ) ) : ?>
<div class="bookit-existing-packages" id="bookit-existing-packages">
    <h3><?php esc_html_e( 'Use one of your packages', 'bookit-booking-system' ); ?></h3>

    <div class="bookit-existing-package-list" role="radiogroup"
         aria-label="<?php esc_attr_e( 'Your packages', 'bookit-booking-system' ); ?>">
        <?php foreach ( $existing_packages as $pkg ) : ?>
        <label class="bookit-existing-package-item">
            <input
                type="radio"
                name="bookit_existing_package_selection"
                class="bookit-existing-package-radio"
                value="<?php echo esc_attr( $pkg['id'] ); ?>"
                data-package-id="<?php echo esc_attr( $pkg['id'] ); ?>"
            >
            <span class="bookit-existing-package-label">
                <strong><?php echo esc_html( $pkg['package_type_name'] ); ?></strong>
                — <?php echo esc_html( $pkg['sessions_remaining'] ); ?>/<?php echo esc_html( $pkg['sessions_total'] ); ?> sessions remaining
                <?php if ( ! empty( $pkg['expires_at'] ) ) : ?>
                    <span class="bookit-package-expiry">
                        (<?php echo esc_html( sprintf(
                            /* translators: %s: expiry date */
                            __( 'Expires %s', 'bookit-booking-system' ),
                            date_i18n( get_option('date_format'), strtotime( $pkg['expires_at'] ) )
                        ) ); ?>)
                    </span>
                <?php endif; ?>
            </span>
        </label>
        <?php endforeach; ?>
    </div>

    <!-- Hidden fields populated by JS -->
    <input type="hidden" name="bookit_selected_existing_package_id" id="bookit-selected-existing-package-id" value="">
</div>
<?php endif; ?>
```

**JS mutual exclusion** — extend the existing inline script to handle the new radio group:
- Selecting a `.bookit-existing-package-radio`: set `#bookit-selected-existing-package-id` value, set `payment_method` hidden input to `use_package`, deselect all payment method radios AND all `.bookit-package-radio` (Task 4 radios) AND clear `#bookit-selected-package-id`.
- Selecting a `.bookit-package-radio` (Task 4): also deselect `.bookit-existing-package-radio` and clear `#bookit-selected-existing-package-id`.
- Selecting a payment method radio: also deselect `.bookit-existing-package-radio` and clear `#bookit-selected-existing-package-id`.

**Hidden `payment_method` field wiring:** When an existing package radio is selected, the JS must set the value of the `payment_method` hidden input (or form field) to `use_package`. Read the existing form to find how `payment_method` is submitted and replicate the same pattern.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations needed — `wp_bookings_package_redemptions` table exists from migration 0007
- [ ] No new error codes needed — E5001–E5005 already registered
- [ ] Audit log event fired: `customer_package.redeemed` on successful redemption via wizard
- [ ] New REST endpoint (`/wizard/my-packages`) follows `__return_true` public pattern
- [ ] `bookit_staff` role: N/A — this is a public customer-facing flow

---

## PHPUNIT REQUIREMENTS

Baseline: 626 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-use-package-redemption.php`

**Class name:** `Test_Use_Package_Redemption`

Include local helpers: `create_test_staff()`, `login_as()`, `insert_package_type()`, `insert_customer()`, `insert_customer_package()` (per-class pattern).

**setUp():** `bookit_test_truncate_tables([ 'bookings_package_redemptions', 'bookings_customer_packages', 'bookings_package_types', 'bookings_customers', 'bookings', 'bookings_audit_log' ])`, then seed a test service and staff.

**tearDown():** same truncate + clean up staff rows + `$_SESSION = []`.

**Required test cases:**

`class-booking-creator.php` extension:
- `test_booking_creator_writes_customer_package_id` — create_booking with `customer_package_id` set; DB row has correct `customer_package_id` value
- `test_booking_creator_null_when_no_package` — create_booking without `customer_package_id`; DB row has `customer_package_id = NULL`

`process_use_package()`:
- `test_use_package_creates_booking` — valid session + active package → booking row created
- `test_use_package_decrements_sessions_remaining` — `sessions_remaining` decreases by 1 after redemption
- `test_use_package_sets_status_exhausted_when_last_session` — package with 1 session remaining → status becomes `exhausted` after redemption
- `test_use_package_creates_redemption_record` — `wp_bookings_package_redemptions` row created with correct `booking_id` and `customer_package_id`
- `test_use_package_fires_audit_log` — `customer_package.redeemed` audit log entry exists
- `test_use_package_returns_error_for_exhausted_package` — package with `status = exhausted` → returns WP_Error with code `E5002`
- `test_use_package_returns_error_for_expired_package` — package with `status = expired` → returns WP_Error with code `E5003`
- `test_use_package_returns_error_for_service_mismatch` — package restricted to service 99, booking for service 1 → returns WP_Error with code `E5004`
- `test_use_package_returns_error_for_missing_package` — non-existent `customer_package_id` → returns WP_Error with code `E5001`
- `test_use_package_returns_error_for_zero_sessions_remaining` — `sessions_remaining = 0` even if status active → returns WP_Error with code `E5002`

`/wizard/my-packages` endpoint:
- `test_my_packages_endpoint_is_public` — GET with no auth returns 200
- `test_my_packages_requires_valid_email` — missing or invalid email returns 400
- `test_my_packages_returns_empty_for_unknown_customer` — email not in customers table → response is `[]`
- `test_my_packages_returns_active_packages_only` — cancelled/exhausted packages excluded
- `test_my_packages_excludes_expired_packages` — package with `expires_at` in the past excluded
- `test_my_packages_filters_by_service_id` — package restricted to service 5 not returned when `service_id=1`

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Step 5 shows "Use one of your packages" section when `packages_enabled = '1'` AND the customer has active packages for the selected service
- [ ] Section is hidden when customer has no packages, or packages are for a different service
- [ ] Selecting an existing package radio sets `payment_method = use_package` in the form
- [ ] Selecting an existing package deselects payment method radios and Task 4 package purchase radios
- [ ] Submitting with `payment_method = use_package` creates a booking via `process_use_package()`
- [ ] Booking row has correct `customer_package_id` set
- [ ] `sessions_remaining` decremented by 1 after redemption
- [ ] When last session used: package `status` becomes `exhausted`
- [ ] `wp_bookings_package_redemptions` row created with correct `booking_id`
- [ ] Audit log entry `customer_package.redeemed` created
- [ ] Customer redirected to booking confirmation page
- [ ] GET `/bookit/v1/wizard/my-packages?customer_email=X` returns active, non-expired packages for that customer
- [ ] `customer_package_id` is NULL in bookings not using a package

### Technical
- [ ] No PHP warnings or notices
- [ ] Redemption decrement uses `sessions_remaining - 1` SQL expression (not a PHP read-modify-write)
- [ ] `process_use_package()` follows same structure as `process_pay_on_arrival()`
- [ ] PHPUnit suite passes (626+ tests, 0 failures)

### Must NOT break
- [ ] Pay-on-Arrival booking flow — all 17 existing tests still pass
- [ ] Task 4 "Buy a Package" UI section still renders correctly
- [ ] All existing booking creation tests
- [ ] Existing customer package API tests (617 baseline)

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 6: Booking wizard Step 5 — use existing package redemption

- Extend Booking_System_Booking_Creator to write customer_package_id
- Add process_use_package() to Booking_System_Payment_Processor:
  validates package status/expiry/service match, creates booking,
  decrements sessions_remaining, creates redemption record,
  fires customer_package.redeemed audit log event
- Add "Use one of your packages" section to booking-step-5-payment.php
  (gated by packages_enabled + customer match + service filter)
- Add Bookit_Customer_Package_Lookup_API (public GET /wizard/my-packages)
- Wire lookup controller in class-bookit-loader.php
- JS mutual exclusion: existing package radios, buy-package radios,
  and payment method radios are all mutually exclusive

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.