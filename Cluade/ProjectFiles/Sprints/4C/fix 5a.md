Good. These are two focused fixes — not full tasks, more like targeted patches. Let me check the existing booking wizard templates before writing the prompts.Searched project for “booking-step-5 payment template Stripe checkout summary price display”Searched project for “booking-step-5 payment template Stripe checkout summary price display”Good — the existing template already has the price summary rows ($deposit_amount, $balance, .price-row.deposit) so the structure is partially there. The gap is that it's not reading deposit config from the service record, and the cancellation policy text isn't being fetched or displayed anywhere. Two focused fix prompts:

Fix 5A — Deposit Split Display at Checkout
# FIX 5A: Deposit Split Display at Checkout
# Sprint 4C | Bookit Booking System
# Estimated: 2 hours

## PROBLEM

The payment step (booking-step-5-payment.php) has price summary
rows for deposit and balance, but the deposit amount shown is not
being correctly calculated from the service's deposit configuration.
The deposit fields (deposit_type, deposit_amount) exist on the
wp_bookings_services table but are not being read and applied at
checkout. This fix wires up the correct calculation and display.

NOTE: This fix is UI display only. The actual Stripe charge amount
is NOT changed — that is deferred to the live sprint. The display
shows the customer what they will owe, but the charge continues to
use the existing amount logic for now.

---

## MANDATORY: READ THESE FILES FIRST

1. public/templates/booking-step-5-payment.php
   — Full file. Find where $total_price, $deposit_amount, and
     $balance are currently set. Understand what session data is
     available ($session_data). Find the .price-row.deposit and
     .price-row.balance rows in the summary.

2. includes/api/class-booking-api.php (or wherever the service
   data is fetched for the payment step)
   — Find how $service is loaded. Confirm that deposit_type and
     deposit_amount fields are included in the SELECT. If not,
     add them.

3. database/schema or includes/class-database-setup.php
   — Confirm the exact column names:
     deposit_type  ENUM('none','percentage','fixed')
     deposit_amount DECIMAL(10,2)

4. public/assets/css/payment-step.css
   — Read existing .price-row styles. The deposit row needs a
     clear visual treatment when a deposit applies.

Do not write any code before reading all four files.

---

## WHAT TO BUILD

### PHP: booking-step-5-payment.php

At the top of the template where prices are calculated, replace
or supplement the existing deposit/balance logic with:
```php
// Fetch service deposit config (already loaded as $service).
$service_deposit_type   = $service['deposit_type'] ?? 'none';
$service_deposit_amount = (float) ( $service['deposit_amount'] ?? 0 );
$total_price            = (float) ( $service['price'] ?? 0 );

// Calculate deposit due today and balance due on arrival.
$has_deposit    = false;
$deposit_due    = 0.00;
$balance_due    = $total_price;
$deposit_label  = '';

if ( 'percentage' === $service_deposit_type && $service_deposit_amount > 0 ) {
    $has_deposit   = true;
    $deposit_due   = round( $total_price * ( $service_deposit_amount / 100 ), 2 );
    $balance_due   = round( $total_price - $deposit_due, 2 );
    $deposit_label = number_format( $service_deposit_amount, 0 ) . '%';
} elseif ( 'fixed' === $service_deposit_type && $service_deposit_amount > 0 ) {
    $has_deposit   = true;
    $deposit_due   = min( $service_deposit_amount, $total_price );
    $balance_due   = round( $total_price - $deposit_due, 2 );
    $deposit_label = '';
}
// deposit_type === 'none': no deposit, full amount due today.
```

### Template changes — booking summary section

Replace the static booking summary and price rows with this
conditional display:

**If $has_deposit is true:**
┌─────────────────────────────────────────┐
│ Booking Summary                         │
│ Women's Haircut                 £35.00  │
│ Mon, 15 June 2026 at 10:00 AM          │
│ with Emma Thompson                      │
├─────────────────────────────────────────┤
│ Due today (deposit):            £17.50  │  ← highlighted
│ Due on arrival (balance):       £17.50  │
│ Total:                          £35.00  │
└─────────────────────────────────────────┘
ℹ️ You are paying a deposit today. The remaining balance
of £17.50 is due when you arrive for your appointment.

**If $has_deposit is false (full payment):**
┌─────────────────────────────────────────┐
│ Booking Summary                         │
│ Women's Haircut                 £35.00  │
│ Mon, 15 June 2026 at 10:00 AM          │
│ with Emma Thompson                      │
├─────────────────────────────────────────┤
│ Total due today:                £35.00  │
└─────────────────────────────────────────┘

The deposit row and balance row must be hidden (display:none or
PHP conditional) when $has_deposit is false — do not show £0.00
deposit rows.

**Pay on Arrival wording when deposit applies:**
When $has_deposit is true and Pay on Arrival is selected, update
the POA description to read:
"Pay £[total] when you arrive. No deposit required for this
payment method."
(The deposit only applies to online payment methods.)

### CSS: payment-step.css

Add/update the deposit row styling to make it visually prominent:
```css
.price-row.deposit {
    font-weight: 600;
    font-size: 1.05rem;
    color: #0073aa;
    border-top: 2px solid #0073aa;
    padding-top: 12px;
    margin-top: 4px;
}

.price-row.balance {
    color: #555;
    font-size: 0.9rem;
}

.bookit-deposit-notice {
    background: #e8f4fd;
    border: 1px solid #b3d9f7;
    border-radius: 6px;
    padding: 10px 14px;
    margin-top: 12px;
    font-size: 0.875rem;
    color: #0a5a8a;
}
```

---

## TESTING CHECKLIST

- [ ] Service with percentage deposit (e.g. 50%):
      Shows "Due today: £X" and "Due on arrival: £Y"
      Deposit notice paragraph visible
      Total row still shows full price

- [ ] Service with fixed deposit (e.g. £10):
      Shows correct fixed split
      Balance = total minus £10

- [ ] Service with no deposit (deposit_type = 'none'):
      Shows only "Total due today: £X"
      No deposit or balance rows visible

- [ ] Pay on Arrival selected with a deposit service:
      Deposit/balance rows hidden
      POA description updated correctly

- [ ] Fixed deposit never exceeds service price
      (e.g. £50 deposit on a £35 service shows £35 deposit, £0 balance)

- [ ] npm test — zero failures (no PHP logic change, no new tests
      required unless a helper function was extracted)

---

## GIT COMMIT MESSAGE

Fix 5A: Deposit split display at checkout

- booking-step-5-payment.php: calculate deposit_due/balance_due
  from service deposit_type and deposit_amount
- Conditional display: deposit rows hidden when no deposit applies
- Deposit notice paragraph when deposit is required
- POA description updated when deposit service selected
- CSS: deposit row visual treatment updated

Fix 5B — Cancellation Policy Display
# FIX 5B: Cancellation Policy Display
# Sprint 4C | Bookit Booking System
# Estimated: 2 hours

## PROBLEM

The cancellation policy text (saved as cancellation_policy_text
in wp_options via the settings API) is not displayed anywhere in
the customer-facing booking flow or confirmation emails. It must
appear in two places:
  1. On the payment step of the booking wizard (before confirming)
  2. In the booking confirmation email sent to the customer

---

## MANDATORY: READ THESE FILES FIRST

1. public/templates/booking-step-5-payment.php
   — Full file. Find where the form ends and where content appears
     before the submit button. The policy display goes here, between
     the price summary and the form action buttons.

2. includes/api/class-settings-api.php
   — Find get_settings(). Confirm cancellation_policy_text is in
     the allowed keys and has a default value. Read how to retrieve
     a single setting value from wp_options directly in PHP (outside
     of the REST API) — the template uses get_option() directly,
     not the REST API.

3. includes/email/templates/ (or wherever email templates live)
   — Find the booking confirmation email template. Read its full
     structure. Understand where the booking details block ends
     and where a policy section can be appended before the footer.

4. public/assets/css/contact-form.css or booking-wizard.css
   — Find existing .bookit-legal-notice styles added in Task 5
     (cooling-off waiver). The cancellation policy box reuses
     the same visual treatment but with a neutral (grey/blue)
     colour rather than amber.

Do not write any code before reading all four files.

---

## WHAT TO BUILD

### 1. Payment step — booking-step-5-payment.php

Fetch the policy text at the top of the template:
```php
// Load cancellation policy text from settings.
$cancellation_policy_text = get_option(
    'bookit_setting_cancellation_policy_text',
    __( 'Please contact us if you need to cancel or reschedule your appointment.', 'bookit-booking-system' )
);
```

Note: check the exact wp_options key name used by the settings
API for cancellation_policy_text — it may be prefixed (e.g.
bookit_setting_cancellation_policy_text or stored differently).
Read class-settings-api.php to confirm the exact key before
hardcoding it.

Add the policy display block between the price summary section
and the form action buttons (Back / Complete Booking):
```php
<?php if ( ! empty( $cancellation_policy_text ) ) : ?>
<div class="bookit-policy-notice" role="note">
    <p class="bookit-policy-notice__heading">
        📋 Cancellation Policy
    </p>
    <p class="bookit-policy-notice__body">
        <?php echo wp_kses_post( nl2br( $cancellation_policy_text ) ); ?>
    </p>
</div>
<?php endif; ?>
```

### 2. CSS

Add to the appropriate public CSS file (same file as the
.bookit-legal-notice styles from Task 5):
```css
.bookit-policy-notice {
    background: #f0f4f8;
    border: 1px solid #b0c4d8;
    border-left: 4px solid #0073aa;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 20px 0;
}

.bookit-policy-notice__heading {
    font-weight: 600;
    font-size: 0.875rem;
    color: #1a3a52;
    margin-bottom: 6px;
}

.bookit-policy-notice__body {
    font-size: 0.8125rem;
    color: #2c5282;
    line-height: 1.6;
    margin: 0;
}
```

### 3. Confirmation email template

In the booking confirmation email (HTML template), after the
booking details block (service name, date, time, staff) and
before the footer/signature, add:
```html
<!-- Cancellation Policy -->
<?php if ( ! empty( $cancellation_policy_text ) ) : ?>
<tr>
    <td style="padding: 0 30px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#f0f4f8; border-left:4px solid #0073aa;
                      border-radius:4px; padding:14px 16px;">
            <tr>
                <td>
                    <p style="margin:0 0 6px; font-weight:600;
                               font-size:13px; color:#1a3a52;">
                        📋 Cancellation Policy
                    </p>
                    <p style="margin:0; font-size:13px;
                               color:#2c5282; line-height:1.6;">
                        <?php echo nl2br( esc_html( $cancellation_policy_text ) ); ?>
                    </p>
                </td>
            </tr>
        </table>
    </td>
</tr>
<?php endif; ?>
```

Make sure $cancellation_policy_text is fetched in the email
sending function using the same get_option() call as above,
before it is passed to the template.

If the email template uses a different variable passing mechanism
(e.g. token substitution like {cancellation_policy}), follow
that existing pattern instead — read the email template system
carefully before deciding the approach.

---

## TESTING CHECKLIST

### Payment step
- [ ] Navigate to booking step 5 — policy notice visible
- [ ] Policy text matches what is saved in Settings →
      Cancellation Policy
- [ ] If cancellation_policy_text is empty, notice is hidden
      entirely (no blank box)
- [ ] Policy notice sits cleanly between price summary and
      the Back/Continue buttons
- [ ] Text wraps correctly on mobile

### Confirmation email
- [ ] Complete a test booking (Pay on Arrival)
- [ ] Check the confirmation email received
- [ ] Policy section visible with correct text
- [ ] Styling renders in a basic email client (inline styles only,
      no external CSS)
- [ ] If policy text is empty, section is absent from email

### No regressions
- [ ] Payment step form still submits correctly
- [ ] Stripe redirect still works
- [ ] Pay on Arrival still works
- [ ] npm test — zero failures

---

## GIT COMMIT MESSAGE

Fix 5B: Cancellation policy display in booking wizard and emails

- booking-step-5-payment.php: policy notice block above form
  actions, fetched from wp_options
- CSS: .bookit-policy-notice styles (blue-grey, left accent)
- Confirmation email: policy section added after booking details
- Both locations hidden gracefully when policy text is empty

Two small focused commits, each around 2 hours. Do Fix 5A first (deposit display), then Fix 5B (policy display) — they touch different parts of the template so there's no conflict. Once both are committed, we move to Task 8 (sprint-wide PHPUnit check) to close out Sprint 4C.