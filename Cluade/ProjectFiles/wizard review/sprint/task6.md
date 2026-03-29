Yes, absolutely. The manual test for step 4 makes much more sense after Task 6 JS is in place — you'll be able to navigate naturally through the wizard and test the full flow end to end, including form submission.

Let's move to Task 6. Ready to generate the prompt?I have everything I need. Here is the Task 6 prompt:

---

```
TASK 6 OF 6: Step 5 payment and full JavaScript implementation
Sprint: Wizard-V2 | Est: ~5h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-5-payment.php` — read in full; this is the reference for all deposit/total calculation logic, package fetching, and cancellation policy text retrieval; all business logic must be replicated in v2
2. `public/templates/booking-wizard-v2-step-5.php` — stub to replace
3. `public/assets/js/booking-wizard.js` — read the `goToStep()` and `saveStepData()` methods; v2 navigation follows the same pattern (POST to session API, then `window.location.reload()`)
4. `public/assets/js/booking-wizard-v2.js` — the current file content (stub from Task 1, partially updated in Task 5 with special requests toggle); replace entirely
5. `design/wizard-step5-no-package.html` — Zone A and Zone C HTML reference; read fully
6. `design/wizard-step5-with-package.html` — Zone B use-package variant reference
7. `design/wizard-step5-buy-package.html` — Zone B buy-package variant reference
8. `design/wizard-design-decisions.md` — Step 5 zone logic and CTA label matrix
9. `tests/unit/test-booking-wizard-v2.php` — existing test class to extend

If any file does not exist, stop and report back before proceeding.

---

## Context

This is the final task. It implements Step 5 (payment) and replaces the JS stub with the full v2 JavaScript. The JS handles all interactive behaviour across all five steps: step navigation via session API, service card selection (step 1), staff card selection (step 2), date tap → slot reveal (step 3), special requests toggle (step 4), and Zone B/C mutual exclusivity + dynamic CTA label (step 5). The existing `booking-wizard.js` and `booking-step-5-payment.php` must not be modified.

---

## Implementation requirements

### `public/templates/booking-wizard-v2-step-5.php` — MODIFY (replace stub)

**Session and data setup** — replicate from `booking-step-5-payment.php`:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/core/class-session-manager.php';
Bookit_Session_Manager::init();
$session_data = Bookit_Session_Manager::get_data();

global $wpdb;

// Service
$service = $wpdb->get_row(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
        (int) $session_data['service_id']
    ),
    ARRAY_A
);
if ( ! $service ) {
    echo '<p>' . esc_html__( 'Service not found.', 'bookit-booking-system' ) . '</p>';
    return;
}

// Staff name
$staff_name = '';
if ( ! empty( $session_data['staff_id'] ) ) {
    $staff = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT first_name, last_name FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
            (int) $session_data['staff_id']
        ),
        ARRAY_A
    );
    if ( $staff ) {
        $staff_name = trim( $staff['first_name'] . ' ' . $staff['last_name'] );
    }
}
if ( empty( $staff_name ) ) {
    $staff_name = isset( $session_data['staff_name'] ) ? $session_data['staff_name'] : '';
}

// Deposit calculation — replicate exactly from booking-step-5-payment.php
$service_deposit_type   = $service['deposit_type'] ?? 'none';
$service_deposit_amount = (float) ( $service['deposit_amount'] ?? 0 );
$total_price            = (float) ( $service['price'] ?? 0 );
$has_deposit            = false;
$deposit_due            = 0.00;
$balance_due            = $total_price;

if ( 'percentage' === $service_deposit_type && $service_deposit_amount > 0 ) {
    $has_deposit = true;
    $deposit_due = round( $total_price * ( $service_deposit_amount / 100 ), 2 );
    $balance_due = round( $total_price - $deposit_due, 2 );
} elseif ( 'fixed' === $service_deposit_type && $service_deposit_amount > 0 ) {
    $has_deposit = true;
    $deposit_due = min( $service_deposit_amount, $total_price );
    $balance_due = round( $total_price - $deposit_due, 2 );
}

// Cancellation policy text — replicate from booking-step-5-payment.php
$cancellation_policy_text = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
        'cancellation_policy_text'
    )
);
if ( null === $cancellation_policy_text || '' === trim( (string) $cancellation_policy_text ) ) {
    $cancellation_policy_text = get_option( 'bookit_cancellation_policy_text', '' );
}

// Packages enabled
$packages_enabled = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
        'packages_enabled'
    )
);

// Customer active packages (use-package variant)
$customer_packages = array();
$customer_email    = isset( $session_data['customer_email'] ) ? $session_data['customer_email'] : '';
if ( '1' === $packages_enabled && ! empty( $customer_email ) ) {
    $customer_packages = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT cp.*, pt.name as package_name
             FROM {$wpdb->prefix}bookings_customer_packages cp
             INNER JOIN {$wpdb->prefix}bookings_package_types pt ON cp.package_type_id = pt.id
             WHERE cp.customer_id = (
                 SELECT id FROM {$wpdb->prefix}bookings_customers WHERE email = %s LIMIT 1
             )
             AND cp.status = 'active'
             AND cp.sessions_remaining > 0
             AND (cp.expires_at IS NULL OR cp.expires_at > NOW())
             AND (pt.applicable_service_ids IS NULL
                  OR pt.applicable_service_ids = '[]'
                  OR JSON_CONTAINS(pt.applicable_service_ids, CAST(%d AS JSON)))",
            $customer_email,
            (int) $session_data['service_id']
        ),
        ARRAY_A
    );
}

// Available packages for purchase (buy-package variant)
$available_packages = array();
if ( '1' === $packages_enabled && empty( $customer_packages ) ) {
    $available_packages = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_package_types
             WHERE is_active = 1
             AND (applicable_service_ids IS NULL
                  OR applicable_service_ids = '[]'
                  OR JSON_CONTAINS(applicable_service_ids, CAST(%d AS JSON)))",
            (int) $session_data['service_id']
        ),
        ARRAY_A
    );
}

// Determine Zone B variant
$zone_b_variant = 'none'; // 'use_package', 'buy_package', or 'none'
if ( ! empty( $customer_packages ) ) {
    $zone_b_variant = 'use_package';
} elseif ( ! empty( $available_packages ) ) {
    $zone_b_variant = 'buy_package';
}

// Display values
$service_name     = isset( $session_data['service_name'] ) ? $session_data['service_name'] : $service['name'];
$service_duration = isset( $session_data['service_duration'] ) ? (int) $session_data['service_duration'] : (int) $service['duration'];
$booking_date     = isset( $session_data['date'] ) ? $session_data['date'] : '';
$booking_time     = isset( $session_data['time'] ) ? $session_data['time'] : '';
$display_date     = ! empty( $booking_date ) ? date_i18n( 'l, d F Y', strtotime( $booking_date ) ) : '';
$display_time     = ! empty( $booking_time ) ? date_i18n( 'H:i', strtotime( $booking_time ) ) : '';
```

**Outer wrapper:**
```html
<div class="bookit-v2-step bookit-v2-step--5">
```

**Confirmation banner** (all four selections + Change):
```html
<div class="bookit-v2-confirm-banner">
  <span class="bookit-v2-confirm-banner-text">
    [service_name] · [duration] min · [staff_name] · [display_date] [display_time]
  </span>
  <button type="button" class="bookit-v2-confirm-banner-change" data-goto-step="4">Change</button>
</div>
```

**Zone A — booking summary:**
```html
<div class="bookit-v2-zone-a">
  <p class="bookit-v2-zone-label">Review your booking</p>
  <div class="bookit-v2-summary-rows">
    <!-- Service / Duration / With / Date / Time rows -->
  </div>
  <div class="bookit-v2-zone-divider"></div>
  <!-- Deposit split OR single total -->
  <!-- Cancellation policy <details> — closed by default, only if policy text exists -->
</div>
```

Deposit split (when `$has_deposit`):
```html
<div class="bookit-v2-deposit-rows">
  <div class="bookit-v2-deposit-row">
    <span class="bookit-v2-deposit-key">Today (deposit)</span>
    <span class="bookit-v2-deposit-val">£[deposit_due]</span>
  </div>
  <div class="bookit-v2-deposit-row">
    <span class="bookit-v2-deposit-key">Remaining (on the day)</span>
    <span class="bookit-v2-deposit-val">£[balance_due]</span>
  </div>
  <div class="bookit-v2-deposit-row bookit-v2-deposit-row--total">
    <span class="bookit-v2-deposit-key">Total</span>
    <span class="bookit-v2-deposit-val">£[total_price]</span>
  </div>
</div>
```

No deposit (single row):
```html
<div class="bookit-v2-deposit-rows">
  <div class="bookit-v2-deposit-row bookit-v2-deposit-row--total">
    <span class="bookit-v2-deposit-key">Total due today</span>
    <span class="bookit-v2-deposit-val">£[total_price]</span>
  </div>
</div>
```

Cancellation policy (only render if `$cancellation_policy_text` is not empty):
```html
<details class="bookit-v2-policy-disclosure">
  <summary>
    Cancellation policy
    <span class="bookit-v2-policy-chevron">&#8964;</span>
  </summary>
  <p class="bookit-v2-policy-body">[wp_kses_post cancellation_policy_text]</p>
</details>
```

**Zone B — conditional, never both variants:**

Use-package variant (`$zone_b_variant === 'use_package'`):
```html
<div class="bookit-v2-zone-b bookit-v2-zone-b--use-package">
  <p class="bookit-v2-zone-label">Your packages</p>
  <p class="bookit-v2-zone-b-intro">
    You have an active package for this service — use a session instead of paying now.
  </p>
  <?php foreach ( $customer_packages as $pkg ) : ?>
  <div class="bookit-v2-package-row" data-package-id="[id]" data-value="use_package_[id]">
    <input type="radio" name="bookit_v2_payment_choice"
      id="pkg-[id]" value="use_package_[id]"
      data-package-id="[id]" />
    <div class="bookit-v2-package-info">
      <p class="bookit-v2-package-name">[package_name]</p>
      <p class="bookit-v2-package-meta">
        [sessions_remaining] sessions remaining
        <?php if ( ! empty( $pkg['expires_at'] ) ) : ?>
          · expires [date_i18n d M Y]
        <?php endif; ?>
      </p>
    </div>
  </div>
  <?php endforeach; ?>
</div>
```

Buy-package variant (`$zone_b_variant === 'buy_package'`):
```html
<div class="bookit-v2-zone-b bookit-v2-zone-b--buy-package">
  <p class="bookit-v2-zone-label">Save with a package</p>
  <p class="bookit-v2-zone-b-intro">
    Book multiple sessions and save — use your first session for this appointment.
  </p>
  <?php foreach ( $available_packages as $pkg ) : ?>
  <div class="bookit-v2-package-row" data-value="buy_[pkg_id]">
    <input type="radio" name="bookit_v2_payment_choice"
      id="buy-pkg-[id]" value="buy_[id]" />
    <div class="bookit-v2-package-info">
      <p class="bookit-v2-package-name">[name]</p>
      <!-- saving if discount_amount exists -->
    </div>
    <span class="bookit-v2-package-price">£[price]</span>
  </div>
  <?php endforeach; ?>
  <p style="font-size:12px;color:var(--bookit-text-secondary);margin-top:8px;">
    Your appointment will be confirmed after the package purchase.
  </p>
</div>
```

**Zone C — payment methods:**

Zone C label changes based on Zone B variant:
- No Zone B: "How would you like to pay?"
- Buy-package Zone B present: "Or pay for this session only"
- Use-package Zone B present: "Or pay now"

```html
<div class="bookit-v2-zone-c" id="bookit-v2-zone-c">
  <p class="bookit-v2-zone-label">[zone_c_label]</p>
  <div class="bookit-v2-payment-rows">

    <div class="bookit-v2-payment-row bookit-v2-payment-row--selected" id="bookit-v2-pay-card"
         data-value="card">
      <input type="radio" name="bookit_v2_payment_choice"
        id="bookit-v2-radio-card" value="card" checked />
      <div class="bookit-v2-payment-label-group">
        <p class="bookit-v2-payment-label">Pay by card</p>
      </div>
      <div class="bookit-v2-payment-logos">
        <span class="bookit-v2-logo-pill bookit-v2-logo-pill--visa">VISA</span>
        <span class="bookit-v2-logo-pill bookit-v2-logo-pill--mc">MC</span>
      </div>
    </div>

    <div class="bookit-v2-payment-row" id="bookit-v2-pay-paypal" data-value="paypal">
      <input type="radio" name="bookit_v2_payment_choice"
        id="bookit-v2-radio-paypal" value="paypal" />
      <div class="bookit-v2-payment-label-group">
        <p class="bookit-v2-payment-label">PayPal</p>
      </div>
      <div class="bookit-v2-payment-logos">
        <span class="bookit-v2-logo-pill bookit-v2-logo-pill--paypal">PayPal</span>
      </div>
    </div>

    <div class="bookit-v2-payment-row" id="bookit-v2-pay-person" data-value="person">
      <input type="radio" name="bookit_v2_payment_choice"
        id="bookit-v2-radio-person" value="person" />
      <div class="bookit-v2-payment-label-group">
        <p class="bookit-v2-payment-label">Pay in person</p>
        <p class="bookit-v2-payment-sub">No payment needed now</p>
      </div>
    </div>

  </div>
</div>
```

**Sticky footer:**
```html
<div class="bookit-v2-sticky-footer">
  <div class="bookit-v2-footer-inner">
    <button type="button" class="bookit-v2-cta-btn" id="bookit-v2-cta-btn">
      <!-- Initial text set by JS on DOMContentLoaded -->
      Continue
    </button>
    <a href="?step=4" class="bookit-v2-btn-back">Back</a>
  </div>
</div>
```

---

### `public/assets/js/booking-wizard-v2.js` — MODIFY (replace entirely)

Replace the stub with the full implementation. The file must be a self-invoking function (IIFE) using `( function() { 'use strict'; ... } )();` — no jQuery dependency (use vanilla JS only, even though jQuery is listed as a dep for future use).

**Structure:**

```js
( function() {
    'use strict';

    // Guard
    document.addEventListener( 'DOMContentLoaded', function() {
        if ( ! document.querySelector( '.bookit-v2-wizard-container' ) ) return;

        const wizard = bookitWizardV2 || {};
        const currentStep = parseInt( wizard.currentStep, 10 ) || 1;

        initStep( currentStep );
    } );

    function initStep( step ) {
        if ( step === 1 ) initStep1();
        if ( step === 2 ) initStep2();
        if ( step === 3 ) initStep3();
        if ( step === 4 ) initStep4();
        if ( step === 5 ) initStep5();
        initNavigation( step );
    }
```

**`initNavigation( step )`:**
- Bind `#bookit-v2-continue` click → call `advanceStep( step )`
- `advanceStep( step )`: POST to `bookitWizardV2.ajaxUrl` with `{ current_step: step + 1 }` and nonce header `X-WP-Nonce: bookitWizardV2.nonce`, then `window.location.reload()`
- Handle `data-goto-step` on `.bookit-v2-confirm-banner-change` buttons: click → POST `{ current_step: N }` then reload
- Handle `.bookit-v2-btn-back` links: these are `<a href="?step=N">` so they navigate natively — no JS needed

**`initStep1()`:**
- Bind click on each `.bookit-v2-service-card`:
  - Remove `bookit-v2-service-card--selected` from all cards
  - Add `bookit-v2-service-card--selected` to clicked card
  - POST to `bookitWizardV2.ajaxUrl`: `{ current_step: 1, service_id: card.dataset.serviceId, service_name: card.dataset.serviceName, service_duration: card.dataset.serviceDuration }`
  - On success: advance to step 2 → `window.location.reload()`

**`initStep2()`:**
- Bind click on each `.bookit-v2-staff-row` and `.bookit-v2-staff-card` (skip elements with `bookit-v2-staff-row--unavailable` / `bookit-v2-staff-card--unavailable`):
  - Remove selected class from all staff cards/rows
  - Add selected class to clicked element
  - POST `{ current_step: 2, staff_id: el.dataset.staffId }`
  - On success: advance to step 3 → reload

**`initStep3()`:**
- Bind click on `.bookit-v2-day--available`:
  - Remove `bookit-v2-day--selected` from all days
  - Add `bookit-v2-day--selected` to clicked day
  - POST `{ current_step: 3, date: day.dataset.date }` (does NOT advance step yet — just saves date)
  - On success: fetch slots via `GET bookitWizardV2.restUrl + 'bookit/v1/wizard/timeslots?date=' + date` with nonce, then render slot sections into `#bookit-v2-time-sections`
  - Slot section render: group into Morning/Afternoon/Evening (same grouping as PHP: morning < 12, afternoon 12-16, evening >= 17), only render non-empty groups, each slot as `<button class="bookit-v2-slot bookit-v2-slot--available" data-time="HH:MM:SS">HH:MM</button>`
  - After rendering slots: `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` on `#bookit-v2-time-sections`

- Bind click on `.bookit-v2-slot--available` (use event delegation on `#bookit-v2-time-sections` since slots are dynamically rendered):
  - Remove `bookit-v2-slot--selected` from all slots
  - Add `bookit-v2-slot--selected` to clicked slot
  - POST `{ current_step: 3, date: currentSelectedDate, time: slot.dataset.time }`
  - On success: enable `#bookit-v2-continue` (remove `disabled` attribute)

**`initStep4()`:**
- Special requests toggle: bind click on `#bookit-v2-special-requests-toggle`:
  - Hide the toggle button (`style="display:none"`)
  - Show the `<textarea id="special-requests">` (`style=""`)
  - Focus the textarea

**`initStep5()`:**
- On load: call `updateCtaLabel( 'card' )` — card is pre-selected by default
- Bind click on each `.bookit-v2-payment-row` in Zone C:
  - Remove `bookit-v2-payment-row--selected` from all Zone C rows
  - Add `bookit-v2-payment-row--selected` to clicked row
  - Check the radio inside the clicked row
  - Uncheck all package radios (`.bookit-v2-package-row input[type=radio]`)
  - Remove `bookit-v2-package-row--selected` from all package rows
  - Re-enable Zone C (remove `bookit-v2-payment-row--disabled` from all rows)
  - Call `updateCtaLabel( row.dataset.value )`

- Bind click on each `.bookit-v2-package-row`:
  - Remove `bookit-v2-package-row--selected` from all package rows
  - Add `bookit-v2-package-row--selected` to clicked row
  - Check the radio inside the clicked row
  - Add `bookit-v2-payment-row--disabled` to all `.bookit-v2-payment-row` elements
  - Uncheck all Zone C radios
  - Remove `bookit-v2-payment-row--selected` from all Zone C rows
  - Call `updateCtaLabel( row.dataset.value )`

- Bind `#bookit-v2-cta-btn` click on step 5: POST `{ current_step: 5, payment_method: currentSelection }` then reload

**`updateCtaLabel( value )`:**

```js
function updateCtaLabel( value ) {
    const btn = document.getElementById( 'bookit-v2-cta-btn' );
    if ( ! btn ) return;

    const deposit  = parseFloat( bookitWizardV2.depositAmount ) || 0;
    const total    = parseFloat( bookitWizardV2.totalAmount )   || 0;
    const amount   = deposit > 0 ? deposit : total;
    const formatted = amount > 0 ? '\u00a3' + amount.toFixed(2) : '';

    if ( value === 'card' ) {
        btn.textContent = formatted ? 'Pay ' + formatted + ' now' : 'Pay now';
    } else if ( value === 'paypal' ) {
        btn.textContent = 'Continue to PayPal';
    } else if ( value === 'person' ) {
        btn.textContent = 'Confirm booking';
    } else if ( value === 'use_package' || value.startsWith( 'use_package_' ) ) {
        btn.textContent = 'Use my package';
    } else if ( value.startsWith( 'buy_' ) ) {
        btn.textContent = 'Buy package & confirm';
    } else {
        btn.textContent = 'Continue';
    }
}
```

**`postToSession( data )`** — shared helper:

```js
function postToSession( data ) {
    return fetch( bookitWizardV2.ajaxUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': bookitWizardV2.nonce
        },
        body: JSON.stringify( data )
    } ).then( function( r ) { return r.json(); } );
}
```

---

## PHPUnit requirements

Baseline: 785 tests, 0 failures — must not regress.

Add new test cases to the existing `Test_Booking_Wizard_V2` class in `tests/unit/test-booking-wizard-v2.php`.

Required test cases:

- `test_v2_step5_renders_zone_a_summary`: set session to step 5 with service/staff/date/time, render shortcode, assert output contains `bookit-v2-zone-label`
- `test_v2_step5_renders_deposit_split_when_deposit_exists`: create service with `deposit_type=fixed` and `deposit_amount=25`, set in session, render step 5, assert output contains `Today (deposit)`
- `test_v2_step5_renders_single_total_when_no_deposit`: create service with `deposit_type=none`, render step 5, assert output contains `Total due today` and does NOT contain `Today (deposit)`
- `test_v2_step5_renders_no_zone_b_when_packages_disabled`: insert `packages_enabled=0` into settings, render step 5, assert output contains neither `bookit-v2-zone-b--use-package` nor `bookit-v2-zone-b--buy-package`; clean up setting after test
- `test_v2_step5_cancellation_policy_collapsed_by_default`: insert cancellation policy text into settings, render step 5, assert output contains `<details` without `open` attribute; clean up after test
- `test_v2_existing_wizard_all_tests_still_pass`: assert `do_shortcode( '[bookit_booking_wizard]' )` still contains `bookit-wizard-container`

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 791 tests must pass (785 baseline + 6 new) before marking task complete.

---

## Acceptance criteria

### Functional
- [ ] Zone A renders with correct summary rows, deposit split or single total
- [ ] Cancellation policy collapsed by default, expands on tap
- [ ] Zone B use-package variant renders when customer has active packages
- [ ] Zone B buy-package variant renders when packages are available and customer has none
- [ ] No Zone B when packages disabled
- [ ] Zone B and Zone C are mutually exclusive — selecting one disables the other
- [ ] Zone C "Pay by card" pre-selected on load
- [ ] CTA button text updates correctly for all six selection states
- [ ] Step 1 service card tap selects the card visually and advances to step 2
- [ ] Step 2 staff card/row tap selects and advances to step 3
- [ ] Step 3 date tap renders time slots and scrolls to them
- [ ] Step 3 slot tap enables the Continue button
- [ ] Step 4 special requests toggle reveals textarea
- [ ] Confirmation banner Change links navigate back correctly

### Technical
- [ ] No JavaScript console errors on any step
- [ ] JS uses `bookitWizardV2` localised object throughout
- [ ] `booking-step-5-payment.php` unchanged
- [ ] `booking-wizard.js` unchanged
- [ ] `contact-form.js` unchanged
- [ ] PHPUnit suite passes (791 tests, 0 failures)

### Must NOT break
- [ ] All 785 existing tests still pass
- [ ] `[bookit_booking_wizard]` still renders and navigates correctly

---

## Git commit message

```
Sprint Wizard-V2, Task 6: Step 5 payment and full JS implementation

- Replace step 5 stub: Zone A summary with deposit split, cancellation
  policy disclosure, Zone B use/buy package variants, Zone C payment rows
- Replace JS stub: full v2 wizard JS — step navigation, service/staff
  selection, date tap + slot fetch + slot reveal, special requests toggle,
  Zone B/C mutual exclusivity, dynamic CTA label matrix
- 6 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 791 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.