Here is the complete updated prompt:

---

```
TASK: Hide Pay by Card and PayPal in V2 Step 5 when charge amount is zero (5B-2d)
Sprint: 5B | Est: 1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. public/templates/booking-wizard-v2-step-5.php
   — Read the full file. Find where $deposit_due and $has_deposit
   are calculated or included. Find the Pay by Card row and the
   PayPal row in Zone C (id="bookit-v2-pay-card" and
   id="bookit-v2-pay-paypal"). These are what you will
   conditionally hide.

2. includes/wizard-v2-payment-amounts.php
   — Read bookit_v2_compute_payment_amounts_from_service(). Confirm
   the return keys: has_deposit, deposit_due, balance_due,
   total_price. When deposit_due is 0.00 and has_deposit is false,
   both Pay by Card and PayPal must be hidden.

3. public/assets/js/booking-wizard-v2.js
   — Read initStep5(). The card row is pre-selected by default.
   If the card row is hidden, the JS default selection must not
   break. Confirm whether the JS references 'bookit-v2-pay-card'
   specifically for the deselect/reselect logic when a package is
   selected/deselected — if so, add null-check guards so the code
   does not error when the element is absent from the DOM.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When a service has no deposit configured (deposit_type = 'none' or
deposit_amount = 0), the deposit_due amount is 0. Clicking Pay by
Card or PayPal in this state would attempt to charge £0, which
Stripe rejects with "Deposit amount must be greater than zero".
The same applies to PayPal — there is nothing to charge online now.

The fix: when the amount that would be charged online right now
is 0 or less, hide both Pay by Card AND PayPal entirely. The
customer should only see Pay in person (pay_on_arrival) in this
case, which becomes the default selection.

The amount to charge is:
- $deposit_due when has_deposit is true
- $total_price when has_deposit is false (full amount due now)

If both are 0, no online payment option makes sense.

---

## IMPLEMENTATION REQUIREMENTS

### includes/wizard-v2-payment-amounts.php — MODIFY

Add a new helper function alongside
bookit_v2_compute_payment_amounts_from_service():

function bookit_v2_stripe_charge_amount( array $amounts ): float
- Returns the amount that would be charged online right now.
- If $amounts['has_deposit'] is true: return $amounts['deposit_due']
- If $amounts['has_deposit'] is false: return $amounts['total_price']
- This is the amount used to decide whether to show online payment
  options.

### public/templates/booking-wizard-v2-step-5.php — MODIFY

After the payment amounts are calculated:
- Call bookit_v2_stripe_charge_amount( $amounts ) to get
  $stripe_charge_amount
- Set $show_online_payment = $stripe_charge_amount > 0

In Zone C, wrap BOTH the Pay by Card row AND the PayPal row with
the same condition:

<?php if ( $show_online_payment ) : ?>
  [existing Pay by Card row HTML — unchanged]
<?php endif; ?>

<?php if ( $show_online_payment ) : ?>
  [existing PayPal row HTML — unchanged]
<?php endif; ?>

When $show_online_payment is false:
- Both card and PayPal rows are absent from the DOM entirely
- Pay in person row must be pre-selected instead of card:
  - Add 'bookit-v2-payment-row--selected' class to the Pay in
    person row conditionally when $show_online_payment is false
  - Set checked attribute on its radio input when
    $show_online_payment is false
- Pass $show_online_payment to the inline JS block via
  wp_json_encode so initStep5() knows the card row is absent

### public/assets/js/booking-wizard-v2.js — MODIFY (if needed)

Read initStep5() first. If it references 'bookit-v2-pay-card'
for the deselect/reselect fallback when a package row is toggled,
add null-check guards:
  var cardRow = document.querySelector( '#bookit-v2-pay-card' );
  if ( cardRow ) { ... }

  var cardRadio = document.querySelector( '#bookit-v2-radio-card' );
  if ( cardRadio ) { ... }

This prevents JS errors when the card row is absent from the DOM.
Only modify this file if a null-reference error would occur.

After any JS changes: confirm whether booking-wizard-v2.js is
included in the Vite build (check vite.config.js or equivalent).
If it is a standalone vanilla JS file NOT in the Vite build,
no npm run build is needed. If it IS in the build, run
npm run build in bookit-booking-system/dashboard/.

---

## PHPUNIT REQUIREMENTS

Baseline: 878 tests, 0 failures — must not regress.

Add to tests/unit/test-booking-wizard-v2.php:

- test_v2_step5_hides_online_payment_rows_when_deposit_is_zero
  Set up a service with deposit_type = 'none' (or deposit_amount
  = 0). Set session to Step 5 with all required fields. Render
  shortcode [bookit_wizard_v2].
  Assert output does NOT contain 'bookit-v2-pay-card'.
  Assert output does NOT contain 'bookit-v2-pay-paypal'.
  Assert output DOES contain 'bookit-v2-pay-person'.

- test_v2_step5_shows_online_payment_rows_when_deposit_is_set
  Set up a service with deposit_type = 'percentage' and
  deposit_amount = 50. Render Step 5.
  Assert output DOES contain 'bookit-v2-pay-card'.
  Assert output DOES contain 'bookit-v2-pay-paypal'.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

- [ ] Pay by Card row absent from DOM when stripe_charge_amount <= 0
- [ ] PayPal row absent from DOM when stripe_charge_amount <= 0
- [ ] Pay in person pre-selected as default when both are hidden
- [ ] Pay by Card and PayPal visible when service has non-zero deposit
- [ ] Pay by Card and PayPal visible when full payment > 0 is due now
- [ ] No JS errors when card/PayPal rows are absent and package toggled
- [ ] PHPUnit: 878+ tests, 0 failures

### Must NOT break
- [ ] Pay by Card and PayPal still shown for services with deposit
- [ ] Package buy/use flows unchanged
- [ ] Pay on Arrival flow unchanged

---

## GIT COMMIT MESSAGE

Sprint 5B: Hide Pay by Card and PayPal in V2 Step 5 when charge amount is zero (5B-2d)

- wizard-v2-payment-amounts.php: bookit_v2_stripe_charge_amount()
  helper returns amount that would be charged online now
- booking-wizard-v2-step-5.php: conditionally hide Pay by Card
  and PayPal rows when stripe_charge_amount <= 0; Pay in person
  becomes default selection
- booking-wizard-v2.js: null-check guards on cardRow and
  cardRadio references if needed
- 2 new PHPUnit tests

Tests: 880+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```