TASK 4 OF 9: Booking Wizard — Package Selection UI & Available Packages Endpoint
Sprint: 4D | Est: 4h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-5-payment.php` — existing payment step template; must be read in full before adding anything
2. `public/assets/js/payment-step.js` (confirm exact filename from the template's enqueue call in class-shortcodes.php) — existing step-5 JS; read before modifying
3. `public/class-shortcodes.php` — confirms how step-5 JS is enqueued; read to find the exact JS filename
4. `includes/core/class-session-manager.php` — `get()`, `set()`, `get_data()`, `set_data()` API
5. `includes/api/class-contact-api.php` — how session data is written from a REST handler (pattern to follow for storing `package_type_id`)
6. `includes/api/class-package-types-api.php` — `format_package_type_row()` shape; how `applicable_service_ids` is stored (JSON) and read
7. `database/migrations/0005-create-package-types-table.php` — confirms columns available on the package types table
8. `includes/class-bookit-loader.php` — where to wire the new controller
9. `tests/unit/test-package-types-api.php` — test helper patterns (local `login_as`, `create_test_staff`, `insert_package_type`)

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 4 delivers two things:

1. A **public REST endpoint** that returns available package types for a given service — used by the booking wizard payment step to show which packages a customer can buy.
2. A **UI addition to Step 5 (payment)** — a "Buy a Package" section showing available packages, with session storage of the customer's package selection.

Stripe payment execution is deferred to the live environment sprint. For now, selecting a package stores the choice in session and shows a clear "payment will be set up when you go live" placeholder in the UI. No Stripe API calls, no `payment_method = stripe_package` routing, no webhook changes in this task.

The feature is gated by a `packages_enabled` setting — the section is only rendered when this is `'1'`.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-available-packages-api.php` — CREATE

**Class name:** `Bookit_Available_Packages_API`

**Route:** `GET /bookit/v1/wizard/available-packages`

**Permission callback:** `'__return_true'` — this is a public, customer-facing endpoint. No auth required.

**Args:**
- `service_id` — integer, required, minimum 1

**Callback logic:**

1. Read `$request->get_param('service_id')` as `(int)`.
2. Query `wp_bookings_package_types` where `is_active = 1`.
3. Filter results to packages that apply to the given service:
   - Include the row if `applicable_service_ids IS NULL` (applies to all services)
   - Include the row if `applicable_service_ids` JSON array contains the given `service_id` (use `json_decode` on the stored JSON, then `in_array`)
4. Return array of formatted rows (200). Empty array is a valid response.

**Response shape per row** (keep it minimal — only what the wizard UI needs):
```php
[
    'id'              => (int),
    'name'            => (string),
    'sessions_count'  => (int),
    'price_mode'      => (string),    // 'fixed' or 'discount'
    'fixed_price'     => (string|null), // number_format(float, 2, '.', '') or null
    'expiry_enabled'  => (bool),
    'expiry_days'     => (int|null),
]
```

**DB query:** Use `$wpdb->get_results()` with no dynamic values in the WHERE clause (only the static `is_active = 1` filter — do the service_id filtering in PHP after fetch, since `applicable_service_ids` is a JSON column not suitable for a SQL `JSON_CONTAINS` call in all MySQL versions supported by the plugin).

On DB error (`null` result): return `Bookit_Error_Registry::to_wp_error('E9001', ['db_error' => $wpdb->last_error])`.

**Constructor:** registers `rest_api_init` hook → `register_routes()`.

---

### `includes/class-bookit-loader.php` — MODIFY

Read the file first. After the customer packages API block, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-available-packages-api.php';
new Bookit_Available_Packages_API();
```

---

### `public/templates/booking-step-5-payment.php` — MODIFY

Read the file fully before making any changes.

Add a "Buy a Package" section. Placement: after the existing payment method options, before the submit button.

**Fetch packages for this service at template render time:**

```php
<?php
$packages_enabled = bookit_get_setting( 'packages_enabled' );
$available_packages = [];

if ( '1' === $packages_enabled ) {
    global $wpdb;
    $rows = $wpdb->get_results(
        "SELECT id, name, sessions_count, price_mode, fixed_price, expiry_enabled, expiry_days
         FROM {$wpdb->prefix}bookings_package_types
         WHERE is_active = 1",
        ARRAY_A
    );
    $service_id = isset( $session['service_id'] ) ? (int) $session['service_id'] : 0;
    foreach ( (array) $rows as $row ) {
        $service_ids = null;
        if ( ! empty( $row['applicable_service_ids'] ) ) {
            $service_ids = json_decode( $row['applicable_service_ids'], true );
        }
        if ( null === $service_ids || in_array( $service_id, (array) $service_ids, true ) ) {
            $available_packages[] = $row;
        }
    }
}
?>
```

**Render the section only when there are packages:**

```php
<?php if ( '1' === $packages_enabled && ! empty( $available_packages ) ) : ?>
<div class="bookit-package-options" id="bookit-package-options">
    <h3><?php esc_html_e( 'Or buy a session package', 'bookit-booking-system' ); ?></h3>
    <p class="bookit-package-note">
        <?php esc_html_e( 'Purchase a bundle of sessions at a discounted rate. One session will be applied to today\'s booking.', 'bookit-booking-system' ); ?>
    </p>

    <div class="bookit-package-list" role="radiogroup" aria-label="<?php esc_attr_e( 'Available packages', 'bookit-booking-system' ); ?>">
        <?php foreach ( $available_packages as $pkg ) : ?>
        <label class="bookit-package-item">
            <input
                type="radio"
                name="bookit_package_selection"
                class="bookit-package-radio"
                value="<?php echo esc_attr( $pkg['id'] ); ?>"
                data-package-id="<?php echo esc_attr( $pkg['id'] ); ?>"
                data-package-name="<?php echo esc_attr( $pkg['name'] ); ?>"
            >
            <span class="bookit-package-label">
                <strong><?php echo esc_html( $pkg['name'] ); ?></strong>
                — <?php echo esc_html( $pkg['sessions_count'] ); ?> sessions
                <?php if ( 'fixed' === $pkg['price_mode'] && ! empty( $pkg['fixed_price'] ) ) : ?>
                    — £<?php echo esc_html( number_format( (float) $pkg['fixed_price'], 2 ) ); ?>
                <?php endif; ?>
                <?php if ( $pkg['expiry_enabled'] && $pkg['expiry_days'] ) : ?>
                    <span class="bookit-package-expiry">
                        (<?php echo esc_html( sprintf(
                            /* translators: %d: number of days */
                            __( 'Valid for %d days', 'bookit-booking-system' ),
                            (int) $pkg['expiry_days']
                        ) ); ?>)
                    </span>
                <?php endif; ?>
            </span>
        </label>
        <?php endforeach; ?>
    </div>

    <!-- Hidden field populated by JS when a package is selected -->
    <input type="hidden" name="bookit_selected_package_id" id="bookit-selected-package-id" value="">

    <!-- Deferred payment notice -->
    <div class="bookit-package-payment-notice" id="bookit-package-payment-notice" style="display:none;">
        <p><?php esc_html_e( 'Package payment will be collected when you proceed. Your booking slot is held for you.', 'bookit-booking-system' ); ?></p>
    </div>
</div>
<?php endif; ?>
```

The submit/payment method radios must deselect any selected package radio when chosen, and selecting a package radio must deselect payment method radios. Implement this in JS (see below). The hidden `bookit_selected_package_id` field is used by the server to know a package was chosen.

**Do NOT add `payment_method = stripe_package` yet** — that wiring is deferred to the live sprint.

---

### JS file for Step 5 (filename confirmed by reading class-shortcodes.php) — MODIFY

Read the file fully before making any changes.

Add the following behaviour using vanilla JS (no jQuery dependency beyond what already exists):

1. **When a `.bookit-package-radio` is selected:**
   - Set `document.getElementById('bookit-selected-package-id').value` to the radio's `data-package-id`
   - Show `#bookit-package-payment-notice`
   - Deselect all `[name="payment_method"]` radios (set `checked = false`)

2. **When a `[name="payment_method"]` radio is selected:**
   - Deselect all `.bookit-package-radio` (set `checked = false`)
   - Clear `document.getElementById('bookit-selected-package-id').value = ''`
   - Hide `#bookit-package-payment-notice`

Use `document.addEventListener('DOMContentLoaded', ...)` if the file doesn't already have a DOM-ready wrapper, or add inside the existing one.

---

### `includes/api/class-contact-api.php` — READ ONLY (pattern reference)

Do NOT modify this file. Read it to understand how `package_type_id` should be optionally stored in the wizard session. The contact API already advances the session to step 5. If the payment step submission needs to store `bookit_selected_package_id` back into session before the live sprint wires the Stripe redirect, that can be handled by the existing `admin_post_bookit_process_payment` handler in `class-payment-processor.php`. Do NOT modify `class-contact-api.php`.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations needed
- [ ] No new error codes needed
- [ ] No audit log events in this task
- [ ] New REST endpoint (`/wizard/available-packages`) follows `__return_true` permission pattern — public, no auth
- [ ] Feature gated by `packages_enabled` setting check at template render time

---

## PHPUNIT REQUIREMENTS

Baseline: 617 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-available-packages-api.php`

Include `login_as()`, `create_test_staff()`, and `insert_package_type()` as local methods — follow the per-class helper pattern established in this codebase.

**setUp():** `bookit_test_truncate_tables(['bookings_package_types'])`, then `do_action('rest_api_init')`.
**tearDown():** same truncate.

**Required test cases:**

- `test_endpoint_is_registered` — route `/bookit/v1/wizard/available-packages` exists in REST server
- `test_endpoint_is_public` — GET with no auth returns 200 (not 401/403)
- `test_service_id_is_required` — GET without `service_id` param returns 400
- `test_returns_empty_array_when_no_packages` — no package types in DB → response is `[]`
- `test_returns_packages_applicable_to_all_services` — package with `applicable_service_ids = null` is returned for any service_id
- `test_returns_packages_matching_service_id` — package with `applicable_service_ids = [2, 3]` is returned when `service_id=2`
- `test_excludes_packages_not_matching_service_id` — package with `applicable_service_ids = [5]` is NOT returned when `service_id=2`
- `test_excludes_inactive_packages` — package with `is_active = 0` is not returned
- `test_response_shape` — response row contains `id`, `name`, `sessions_count`, `price_mode`, `fixed_price`, `expiry_enabled`, `expiry_days`

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] GET `/bookit/v1/wizard/available-packages?service_id=1` returns packages where `applicable_service_ids IS NULL` or contains `1`
- [ ] Inactive packages are excluded from the endpoint response
- [ ] Payment step shows "Buy a Package" section when `packages_enabled = '1'` and packages exist for the service
- [ ] Section is not rendered when `packages_enabled = '0'`
- [ ] Section is not rendered when no active packages match the service (even if `packages_enabled = '1'`)
- [ ] Selecting a package radio clears the payment method radio selection
- [ ] Selecting a payment method radio clears the package radio selection
- [ ] `#bookit-selected-package-id` hidden input is populated when a package is selected
- [ ] Package payment notice is shown when a package is selected, hidden otherwise

### Technical
- [ ] No PHP warnings or notices
- [ ] New endpoint uses `__return_true` permission callback (public)
- [ ] Service ID filtering done in PHP (not SQL JSON_CONTAINS) for MySQL compatibility
- [ ] No Stripe API calls added in this task
- [ ] PHPUnit suite passes (617+ tests, 0 failures)

### Must NOT break
- [ ] Existing Stripe payment flow (step 5 → Stripe redirect) continues working
- [ ] Pay-on-Arrival booking flow continues working
- [ ] All existing step-5 JS behaviour

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 4: Booking wizard — package selection UI and available packages endpoint

- Add Bookit_Available_Packages_API (public GET /wizard/available-packages)
  filters by service_id in PHP for MySQL compatibility; returns active packages
- Add package selection section to booking-step-5-payment.php
  (gated by packages_enabled setting; filtered by service_id)
- Add JS mutual exclusion: package radios vs payment method radios
- Wire available packages controller in class-bookit-loader.php
- Stripe payment execution deferred to live environment sprint

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.