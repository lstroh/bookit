Before writing Task 5, let me do a quick pre-read on the existing step 4 template and the cooling-off function.I have everything I need. Here is the Task 5 prompt:

---

```
TASK 5 OF 6: Step 4 contact details form
Sprint: Wizard-V2 | Est: ~3h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-4-contact.php` — full existing Step 4; note the form field IDs (`first-name`, `last-name`, `email`, `phone`, `special-requests`, `marketing-consent`, `cooling-off-waiver`), the waiver conditional logic, and the CSRF nonce call — all must be replicated exactly in v2
2. `public/templates/booking-wizard-v2-step-4.php` — stub to replace
3. `includes/functions-cooling-off.php` — confirms `bookit_booking_requires_waiver( $booking_date_string )` signature and return type
4. `includes/class-csrf-protection.php` — confirms `Bookit_CSRF_Protection::nonce_field( true, true )` signature
5. `public/assets/css/booking-wizard-v2.css` — confirm class names for form, waiver, checkbox, divider, special requests toggle
6. `design/wizard-step4.html` — full HTML structure reference; read before writing any markup
7. `design/wizard-design-decisions.md` — Step 4 section
8. `tests/unit/test-booking-wizard-v2.php` — existing test class to extend

If any file does not exist, stop and report back before proceeding.

---

## Context

This task replaces the step 4 stub with the full contact details form. All logic is replicated from `booking-step-4-contact.php` — the form field IDs, autocomplete attributes, waiver conditional, and CSRF nonce must be identical because they are consumed by the existing `contact-form.js` and `class-contact-api.php`. The only differences are the HTML structure and CSS classes, which follow the v2 design. The existing `booking-step-4-contact.php` and `contact-form.js` must not be modified.

---

## Implementation requirements

### `public/templates/booking-wizard-v2-step-4.php` — MODIFY (replace stub)

**Session setup:**
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/core/class-session-manager.php';
Bookit_Session_Manager::init();
$session          = Bookit_Session_Manager::get_data();
$service_name     = isset( $session['service_name'] ) ? $session['service_name'] : '';
$service_duration = isset( $session['service_duration'] ) ? (int) $session['service_duration'] : 0;
$staff_name       = isset( $session['staff_name'] ) ? $session['staff_name'] : '';
$booking_date     = isset( $session['date'] ) ? $session['date'] : '';
$booking_time     = isset( $session['time'] ) ? $session['time'] : '';
$first_name       = isset( $session['customer_first_name'] ) ? $session['customer_first_name'] : '';
$last_name        = isset( $session['customer_last_name'] ) ? $session['customer_last_name'] : '';
$email            = isset( $session['customer_email'] ) ? $session['customer_email'] : '';
$phone            = isset( $session['customer_phone'] ) ? $session['customer_phone'] : '';
$special_requests = isset( $session['customer_special_requests'] ) ? $session['customer_special_requests'] : '';
$marketing_consent = isset( $session['marketing_consent'] ) ? (bool) $session['marketing_consent'] : false;
$waiver_given     = isset( $session['cooling_off_waiver'] ) ? (bool) $session['cooling_off_waiver'] : false;
```

**Waiver conditional:**
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/functions-cooling-off.php';
$requires_waiver = ! empty( $booking_date ) && bookit_booking_requires_waiver( $booking_date );
```

**Date/time display for confirmation banner:**
```php
$display_date = ! empty( $booking_date )
    ? date_i18n( 'd M Y', strtotime( $booking_date ) )
    : '';
$display_time = ! empty( $booking_time )
    ? date_i18n( 'H:i', strtotime( $booking_time ) )
    : '';
```

**Outer wrapper:**
```html
<div class="bookit-v2-step bookit-v2-step--4">
  <div class="bookit-v2-step-body">
    <!-- all content -->
  </div>
</div>
```

**Confirmation banner** — shows all four previous selections:
```html
<div class="bookit-v2-confirm-banner">
  <span class="bookit-v2-confirm-banner-text">
    [service_name] · [duration] min · [staff_name] · [display_date] [display_time]
  </span>
  <button type="button" class="bookit-v2-confirm-banner-change" data-goto-step="3">Change</button>
</div>
```

**Headings:**
- `<h2 class="bookit-v2-step-heading">Your details</h2>`
- `<p class="bookit-v2-step-subheading">Almost there — just a few details to confirm your booking.</p>`

**Form** — the form element itself must use the same classes that `contact-form.js` targets:
```html
<form id="bookit-contact-form" class="bookit-contact-form bookit-v2-contact-form" novalidate>
```

Inside the form, in this exact order:

1. **CSRF nonce** — first thing inside the form:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/class-csrf-protection.php';
Bookit_CSRF_Protection::nonce_field( true, true );
```

2. **First name field:**
```html
<div class="bookit-v2-form-group">
  <label class="bookit-v2-form-label" for="first-name">First name</label>
  <input class="bookit-v2-form-input" type="text" id="first-name" name="first_name"
    value="[esc_attr $first_name]" autocomplete="given-name"
    inputmode="text" maxlength="100" aria-required="true"
    aria-describedby="first-name-error" />
  <span id="first-name-error" class="bookit-v2-field-error" role="alert"></span>
</div>
```

3. **Last name field** — same pattern, `id="last-name"`, `name="last_name"`, `autocomplete="family-name"`, `aria-describedby="last-name-error"`

4. **Email field** — `id="email"`, `name="email"`, `type="email"`, `autocomplete="email"`, `inputmode="email"`, `aria-describedby="email-error"`

5. **Phone field** — `id="phone"`, `name="phone"`, `type="tel"`, `autocomplete="tel"`, `inputmode="tel"`, `placeholder="07700 900000"`, `aria-describedby="phone-error"`

6. **Special requests toggle** (collapsed by default):
```html
<button type="button" class="bookit-v2-special-requests-toggle" id="bookit-v2-special-requests-toggle">
  <span class="bookit-v2-sr-plus">+</span> Add special requests
</button>
<textarea id="special-requests" name="special_requests"
  class="bookit-v2-form-input" rows="3"
  style="display:none;" maxlength="500"
  aria-label="Special requests"><?php echo esc_textarea( $special_requests ); ?></textarea>
```
Note: if `$special_requests` is not empty (returning customer), render the textarea visible and hide the toggle button instead.

7. **Form divider:** `<div class="bookit-v2-form-divider"></div>`

8. **Marketing consent checkbox:**
```html
<div class="bookit-v2-checkbox-group">
  <input type="checkbox" id="marketing-consent" name="marketing_consent"
    value="1" <?php checked( $marketing_consent, true ); ?> />
  <label class="bookit-v2-checkbox-label" for="marketing-consent">
    Keep me updated with offers and news
  </label>
</div>
<p class="bookit-v2-checkbox-helper">You can unsubscribe at any time.</p>
```

9. **Cooling-off waiver** — conditional on `$requires_waiver`:
```html
<?php if ( $requires_waiver ) : ?>
<div class="bookit-v2-waiver-block" id="cooling-off-waiver-group">
  <p class="bookit-v2-waiver-heading">Important: Right to Cancel</p>
  <p class="bookit-v2-waiver-body">
    Your appointment is within 14 days. Under the Consumer Contracts Regulations
    2013, you normally have a 14-day right to cancel. By checking the box below,
    you request that we begin the service before this period expires and
    acknowledge that you will lose this cancellation right once the service
    has been performed.
  </p>
  <div class="bookit-v2-checkbox-group">
    <input type="checkbox" id="cooling-off-waiver" name="cooling_off_waiver"
      value="1" <?php checked( $waiver_given, true ); ?>
      aria-required="true" aria-describedby="cooling-off-waiver-error" />
    <label class="bookit-v2-checkbox-label" for="cooling-off-waiver">
      I expressly request this service to begin before the 14-day cancellation
      period expires, and I understand that I will lose my right to cancel once
      the service has begun.
    </label>
  </div>
  <span id="cooling-off-waiver-error" class="bookit-v2-field-error" role="alert"></span>
</div>
<?php endif; ?>
```

**Sticky footer** — Continue here is a submit button because `contact-form.js` listens for form submit, not a button click. The Back link navigates to `?step=3`:
```html
<div class="bookit-v2-sticky-footer">
  <div class="bookit-v2-footer-inner">
    <button type="submit" form="bookit-contact-form" class="bookit-v2-cta-btn">
      Continue
    </button>
    <a href="?step=3" class="bookit-v2-btn-back">Back</a>
  </div>
</div>
```

Note: the sticky footer is outside the `<form>` tag but uses `form="bookit-contact-form"` to associate the submit button with the form. This is valid HTML5 and avoids nesting the sticky footer inside the form.

---

## PHPUnit requirements

Baseline: 781 tests, 0 failures — must not regress.

Add new test cases to the existing `Test_Booking_Wizard_V2` class in `tests/unit/test-booking-wizard-v2.php`. Read the file first.

Required test cases:

- `test_v2_step4_renders_contact_form`: set session to step 4 with `service_id`, `date`, `time`, render shortcode, assert output contains `id="first-name"`
- `test_v2_step4_waiver_shown_when_booking_within_14_days`: set `date` in session to `wp_date( 'Y-m-d', strtotime( '+3 days' ), wp_timezone() )`, render step 4, assert output contains `bookit-v2-waiver-block`
- `test_v2_step4_waiver_hidden_when_booking_beyond_14_days`: set `date` in session to `wp_date( 'Y-m-d', strtotime( '+30 days' ), wp_timezone() )`, render step 4, assert output does NOT contain `bookit-v2-waiver-block`
- `test_v2_step4_special_requests_toggle_collapsed_by_default`: no `customer_special_requests` in session, render step 4, assert output contains `bookit-v2-special-requests-toggle` and the textarea has `style="display:none;"`

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 785 tests must pass (781 baseline + 4 new) before marking task complete.

---

## Acceptance criteria

### Functional
- [ ] Confirmation banner shows service · duration · staff · date · time with Change link
- [ ] All five form fields render with correct `id`, `name`, `autocomplete`, and `inputmode` attributes
- [ ] Special requests toggle is collapsed by default; visible if `$special_requests` pre-filled
- [ ] Marketing consent checkbox unchecked by default; pre-checked if returning customer
- [ ] Waiver block rendered when booking within 14 days, absent when beyond
- [ ] Waiver block uses `bookit-v2-waiver-block` class and `--bookit-v2-waiver-*` tokens only
- [ ] CSRF nonce present as first element inside `<form>`
- [ ] Submit button correctly associated with form via `form="bookit-contact-form"`

### Technical
- [ ] No PHP warnings or notices
- [ ] Form `id="bookit-contact-form"` and `class` includes `bookit-contact-form` (required by `contact-form.js`)
- [ ] All field `id` attributes match exactly: `first-name`, `last-name`, `email`, `phone`, `special-requests`, `marketing-consent`, `cooling-off-waiver`
- [ ] `booking-step-4-contact.php` unchanged
- [ ] `contact-form.js` unchanged
- [ ] PHPUnit suite passes (785 tests, 0 failures)

### Must NOT break
- [ ] `[bookit_booking_wizard]` still renders correctly
- [ ] All 781 existing tests still pass

---

## Git commit message

```
Sprint Wizard-V2, Task 5: Step 4 contact details form

- Replace step 4 stub: full contact form with correct field IDs,
  autocomplete, inputmode attributes matching contact-form.js
- Special requests toggle collapsed by default
- Cooling-off waiver conditional on booking date, amber tokens only
- Confirmation banner shows all four previous selections
- Submit button outside form body using form= attribute
- CSRF nonce as first element inside form
- 4 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 785 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.