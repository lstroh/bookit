# 🟢 TASK 13: PAY ON ARRIVAL - IMPLEMENTATION

**Status:** Tests created ✅ - Now implementing the feature

---

## 📝 IMPLEMENTATION OVERVIEW

We'll update this in 3 parts:

1. **Add Pay on Arrival Handler** - New method in Payment Processor
2. **Update Payment Form** - Enable "Pay on Arrival" option
3. **Update Email Templates** - Show "Pay on arrival" notice

Let's build them in order.

---

## 📝 PART 1: ADD PAY ON ARRIVAL HANDLER

### CURSOR PROMPT: Add Pay on Arrival to Payment Processor

Copy this into **Cursor Composer**:

```
TASK: Add Pay on Arrival Handler (Sprint 2, Task 13 - Part 1)

CONTEXT:
Sprint 2, Task 13 - Implementation. Add Pay on Arrival payment method to the Payment Processor class. We have 10 PHPUnit tests waiting.

FIND FILE: includes/payment/class-payment-processor.php

FIND METHOD: handle_booking_payment() or similar payment routing method

ADD NEW METHOD (after existing payment methods):

```php
/**
 * Process Pay on Arrival booking
 * Creates booking immediately without payment processor
 * 
 * @param array $session_data Booking wizard session data
 * @return array|WP_Error Booking info with booking_id or error
 */
public function process_pay_on_arrival($session_data) {
    // Validate session data exists
    if (empty($session_data)) {
        return new WP_Error('invalid_session', 'No booking data found');
    }
    
    // Get service to calculate price
    global $wpdb;
    $service = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
        $session_data['service_id']
    ), ARRAY_A);
    
    if (!$service) {
        return new WP_Error('invalid_service', 'Service not found');
    }
    
    // Verify staff exists
    $staff = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
        $session_data['staff_id']
    ), ARRAY_A);
    
    if (!$staff) {
        return new WP_Error('invalid_staff', 'Staff member not found');
    }
    
    // Prepare booking data
    $booking_data = array(
        'service_id' => $session_data['service_id'],
        'staff_id' => $session_data['staff_id'],
        'booking_date' => $session_data['date'],
        'booking_time' => $session_data['time'],
        'customer_first_name' => $session_data['customer_first_name'],
        'customer_last_name' => $session_data['customer_last_name'],
        'customer_email' => $session_data['customer_email'],
        'customer_phone' => $session_data['customer_phone'] ?? '',
        'special_requests' => $session_data['customer_special_requests'] ?? '',
        'payment_method' => 'pay_on_arrival',
        'payment_intent_id' => null,
        'stripe_session_id' => null,
        'amount_paid' => 0.00 // No payment yet
    );
    
    // Create booking using Booking Creator
    require_once dirname(__DIR__) . '/booking/class-booking-creator.php';
    $booking_creator = new Booking_System_Booking_Creator();
    
    $booking_id = $booking_creator->create_booking($booking_data);
    
    if (is_wp_error($booking_id)) {
        error_log('Pay on Arrival: Booking creation failed - ' . $booking_id->get_error_message());
        return $booking_id;
    }
    
    // Get full booking details for confirmation
    require_once dirname(__DIR__) . '/booking/class-booking-retriever.php';
    $booking_retriever = new Booking_System_Booking_Retriever();
    $booking = $booking_retriever->get_booking_by_id($booking_id);
    
    if (!$booking) {
        return new WP_Error('booking_retrieval_failed', 'Booking created but could not retrieve details');
    }
    
    // Send confirmation emails
    require_once dirname(__DIR__) . '/email/class-email-sender.php';
    $email_sender = new Booking_System_Email_Sender();
    
    // Send customer confirmation
    $customer_result = $email_sender->send_customer_confirmation($booking);
    if (is_wp_error($customer_result)) {
        error_log('Pay on Arrival: Failed to send customer email - ' . $customer_result->get_error_message());
    }
    
    // Send business notification
    $business_result = $email_sender->send_business_notification($booking);
    if (is_wp_error($business_result)) {
        error_log('Pay on Arrival: Failed to send business email - ' . $business_result->get_error_message());
    }
    
    // Clear booking wizard session
    $booking_retriever->clear_booking_session();
    
    error_log(sprintf(
        'Pay on Arrival: Booking #%d created successfully (customer: %s, service: %s, date: %s)',
        $booking_id,
        $session_data['customer_email'],
        $service['name'],
        $session_data['date']
    ));
    
    // Return booking info for redirect
    return array(
        'success' => true,
        'booking_id' => $booking_id,
        'redirect_url' => home_url('/booking-confirmed?booking_id=' . $booking_id)
    );
}
```

NOW UPDATE THE MAIN PAYMENT ROUTING METHOD:

FIND: The method that handles admin_post_bookit_process_payment

UPDATE TO INCLUDE PAY ON ARRIVAL:

```php
public function handle_booking_payment() {
    // Verify nonce
    if (!isset($_POST['bookit_nonce']) || !wp_verify_nonce($_POST['bookit_nonce'], 'bookit_booking_action')) {
        wp_die('Security check failed');
    }
    
    // Get session data
    if (!isset($_SESSION['bookit_wizard'])) {
        wp_die('Session expired. Please start booking again.');
    }
    
    $session_data = $_SESSION['bookit_wizard'];
    
    // Get payment method
    $payment_method = isset($_POST['payment_method']) ? sanitize_text_field($_POST['payment_method']) : '';
    
    if (empty($payment_method)) {
        wp_die('Please select a payment method');
    }
    
    // Route to appropriate payment handler
    switch ($payment_method) {
        case 'stripe':
            $this->process_stripe_payment($session_data);
            break;
            
        case 'paypal':
            // PayPal integration (Task 9-10)
            wp_die('PayPal integration coming soon');
            break;
            
        case 'pay_on_arrival':
            $result = $this->process_pay_on_arrival($session_data);
            
            if (is_wp_error($result)) {
                wp_die('Booking failed: ' . $result->get_error_message());
            }
            
            // Redirect to confirmation page
            wp_redirect($result['redirect_url']);
            exit;
            break;
            
        default:
            wp_die('Invalid payment method');
    }
}
```

CRITICAL REQUIREMENTS:

1. Create booking immediately (no payment processor)
2. Set deposit_paid = 0.00
3. Set balance_due = full service price
4. Set payment_method = 'pay_on_arrival'
5. Set status = 'pending_payment' (handled by Booking Creator)
6. Send confirmation emails
7. Clear session after booking
8. Redirect to confirmation page with booking_id
9. Handle errors gracefully
10. Log all operations

SUCCESS CRITERIA:
- Booking created without payment processor
- All fields set correctly
- Emails sent
- Session cleared
- Redirects to confirmation
- All tests pass

Please add the Pay on Arrival handler to the Payment Processor class.
```

---

## 📝 PART 2: UPDATE BOOKING CREATOR STATUS

### CURSOR PROMPT: Set Correct Status for Pay on Arrival

```
TASK: Update Booking Creator to Handle Pay on Arrival Status (Sprint 2, Task 13 - Part 2)

CONTEXT:
Sprint 2, Task 13 - The Booking Creator needs to set status = 'pending_payment' for Pay on Arrival bookings instead of 'confirmed'.

FIND FILE: includes/booking/class-booking-creator.php

FIND METHOD: create_booking()

FIND THIS SECTION (where booking_data is prepared):

```php
$booking_data = array(
    // ... other fields
    'status' => 'confirmed',
    // ... other fields
);
```

CHANGE TO:

```php
// Determine status based on payment method
$status = 'confirmed'; // Default for paid bookings
if ($data['payment_method'] === 'pay_on_arrival') {
    $status = 'pending_payment';
}

$booking_data = array(
    'customer_id' => $customer_id,
    'service_id' => $data['service_id'],
    'staff_id' => $data['staff_id'],
    'booking_date' => $data['booking_date'],
    'start_time' => $start_time,
    'end_time' => $end_time,
    'status' => $status, // Dynamic based on payment method
    'total_price' => $service['price'],
    'deposit_paid' => $data['amount_paid'],
    'balance_due' => max(0, $service['price'] - $data['amount_paid']),
    'payment_method' => $data['payment_method'],
    'payment_intent_id' => $data['payment_intent_id'] ?? null,
    'stripe_session_id' => $data['stripe_session_id'] ?? null,
    'special_requests' => $data['special_requests'] ?? '',
    'created_at' => current_time('mysql'),
    'updated_at' => current_time('mysql')
);
```

REASONING:
- Stripe/PayPal bookings: status = 'confirmed' (payment received)
- Pay on Arrival bookings: status = 'pending_payment' (payment due later)

SUCCESS CRITERIA:
- Pay on Arrival bookings get status = 'pending_payment'
- Stripe bookings keep status = 'confirmed'
- No other behavior changes
- Tests pass

Please update the Booking Creator to set the correct status based on payment method.
```

---

## 📝 PART 3: UPDATE PAYMENT FORM

### CURSOR PROMPT: Enable Pay on Arrival Option

```
TASK: Enable Pay on Arrival in Payment Form (Sprint 2, Task 13 - Part 3)

CONTEXT:
Sprint 2, Task 13 - Enable the "Pay on Arrival" radio button in the payment selection form (Step 5).

FIND FILE: public/templates/booking-step-5-payment.php

FIND THIS SECTION (the Pay on Arrival option):

```php
<label class="bookit-payment-option disabled">
    <input type="radio" 
           name="payment_method" 
           value="pay_on_arrival" 
           disabled>
    <div class="bookit-payment-content">
        <span class="bookit-payment-name">Pay on Arrival</span>
        <span class="bookit-coming-soon">Coming soon</span>
    </div>
</label>
```

REPLACE WITH:

```php
<label class="bookit-payment-option">
    <input type="radio" 
           name="payment_method" 
           value="pay_on_arrival">
    <div class="bookit-payment-content">
        <span class="bookit-payment-name">💵 Pay on Arrival</span>
        <span class="bookit-payment-description">
            Pay the full amount when you arrive for your appointment
        </span>
    </div>
</label>
```

ADD PAYMENT INFO DISPLAY:

After the payment options, add this section to show what happens with Pay on Arrival:

```php
<div id="payment-info" style="display: none; margin-top: 20px; padding: 15px; background: #f0f8ff; border-left: 4px solid #0073aa; border-radius: 4px;">
    <div id="stripe-info" style="display: none;">
        <strong>💳 Card Payment</strong>
        <p>You'll be redirected to Stripe's secure payment page to complete your booking.</p>
    </div>
    
    <div id="pay-on-arrival-info" style="display: none;">
        <strong>💵 Pay on Arrival</strong>
        <p>No payment required now. You'll pay <strong>£<?php echo number_format($total_price, 2); ?></strong> when you arrive for your appointment.</p>
        <p style="margin-top: 10px; font-size: 14px; color: #666;">
            ℹ️ Your booking will be confirmed immediately. Please arrive 5-10 minutes early.
        </p>
    </div>
</div>
```

ADD JAVASCRIPT TO SHOW/HIDE INFO:

At the bottom of the template, add:

```php
<script>
document.addEventListener('DOMContentLoaded', function() {
    const paymentOptions = document.querySelectorAll('input[name="payment_method"]');
    const paymentInfo = document.getElementById('payment-info');
    const stripeInfo = document.getElementById('stripe-info');
    const payOnArrivalInfo = document.getElementById('pay-on-arrival-info');
    
    paymentOptions.forEach(function(option) {
        option.addEventListener('change', function() {
            // Show payment info section
            paymentInfo.style.display = 'block';
            
            // Hide all info sections
            stripeInfo.style.display = 'none';
            payOnArrivalInfo.style.display = 'none';
            
            // Show relevant info
            if (this.value === 'stripe') {
                stripeInfo.style.display = 'block';
            } else if (this.value === 'pay_on_arrival') {
                payOnArrivalInfo.style.display = 'block';
            }
        });
    });
});
</script>
```

SUCCESS CRITERIA:
- Pay on Arrival radio button enabled
- Clicking it shows explanatory text
- Form submits correctly with payment_method = 'pay_on_arrival'
- No JavaScript errors
- Responsive design maintained

Please update the payment form template to enable Pay on Arrival.
```

---

## 📝 PART 4: UPDATE EMAIL TEMPLATE

### CURSOR PROMPT: Add Pay on Arrival Notice to Emails

```
TASK: Add Pay on Arrival Notice to Email Templates (Sprint 2, Task 13 - Part 4)

CONTEXT:
Sprint 2, Task 13 - Update customer confirmation email to show "Pay on arrival" notice for unpaid bookings.

FIND FILE: includes/email/class-email-sender.php

FIND METHOD: generate_customer_email()

FIND THE PAYMENT SUMMARY SECTION:

```php
<div class="payment-summary">
    <h3><?php _e('Payment Summary', 'booking-system'); ?></h3>
    <div class="detail-row">
        <span class="label"><?php _e('Total:', 'booking-system'); ?></span>
        <span class="value">£<?php echo number_format($booking['total_price'], 2); ?></span>
    </div>
    <div class="detail-row">
        <span class="label"><?php _e('Paid:', 'booking-system'); ?></span>
        <span class="value">£<?php echo number_format($booking['deposit_paid'], 2); ?></span>
    </div>
    <div class="detail-row">
        <span class="label"><?php _e('Balance Due:', 'booking-system'); ?></span>
        <span class="value">£<?php echo number_format($booking['balance_due'], 2); ?></span>
    </div>
</div>
```

UPDATE TO:

```php
<div class="payment-summary">
    <h3><?php _e('Payment Summary', 'booking-system'); ?></h3>
    <div class="detail-row">
        <span class="label"><?php _e('Total:', 'booking-system'); ?></span>
        <span class="value">£<?php echo number_format($booking['total_price'], 2); ?></span>
    </div>
    
    <?php if ($booking['payment_method'] === 'pay_on_arrival') : ?>
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 4px;">
            <strong style="color: #856404;">💵 Payment Due on Arrival</strong>
            <p style="margin: 10px 0 0; color: #856404;">
                Please bring <strong>£<?php echo number_format($booking['total_price'], 2); ?></strong> 
                to pay when you arrive for your appointment.
            </p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #856404;">
                We accept cash and card payments.
            </p>
        </div>
    <?php else : ?>
        <div class="detail-row">
            <span class="label"><?php _e('Paid:', 'booking-system'); ?></span>
            <span class="value">£<?php echo number_format($booking['deposit_paid'], 2); ?></span>
        </div>
        <div class="detail-row">
            <span class="label"><?php _e('Balance Due:', 'booking-system'); ?></span>
            <span class="value">£<?php echo number_format($booking['balance_due'], 2); ?></span>
        </div>
    <?php endif; ?>
    
    <div class="detail-row">
        <span class="label"><?php _e('Payment Method:', 'booking-system'); ?></span>
        <span class="value"><?php echo esc_html(ucwords(str_replace('_', ' ', $booking['payment_method']))); ?></span>
    </div>
</div>
```

ALSO UPDATE: generate_business_email()

ADD PAY ON ARRIVAL FLAG:

After the payment section, add:

```php
<p><strong><?php _e('Payment:', 'booking-system'); ?></strong> 
    £<?php echo number_format($booking['deposit_paid'], 2); ?> 
    via <?php echo ucfirst($booking['payment_method']); ?>
</p>

<?php if ($booking['payment_method'] === 'pay_on_arrival') : ?>
    <p style="background: #fff3cd; padding: 10px; border-left: 3px solid #ffc107;">
        <strong>⚠️ Payment Due on Arrival:</strong> 
        Customer will pay £<?php echo number_format($booking['total_price'], 2); ?> when they arrive.
    </p>
<?php endif; ?>

<p><strong><?php _e('Balance Due:', 'booking-system'); ?></strong> 
    £<?php echo number_format($booking['balance_due'], 2); ?>
</p>
```

SUCCESS CRITERIA:
- Customer email shows "Payment due on arrival" notice
- Business email flags unpaid bookings
- Paid bookings show normal payment summary
- Email formatting maintained
- No PHP errors

Please update the email templates to handle Pay on Arrival bookings.
```

---

## ⏸️ AFTER CURSOR GENERATES ALL CODE

### Step 1: Verify Files Updated

Check these files were modified:
- [ ] `includes/payment/class-payment-processor.php` (has process_pay_on_arrival method)
- [ ] `includes/booking/class-booking-creator.php` (sets correct status)
- [ ] `public/templates/booking-step-5-payment.php` (Pay on Arrival enabled)
- [ ] `includes/email/class-email-sender.php` (payment notices added)

### Step 2: Run Tests

```bash
vendor/bin/phpunit tests/test-pay-on-arrival.php
```

**Expected:**
```
PHPUnit 9.x.x

..........  10 / 10 (100%)

OK (10 tests, 30 assertions)
```

### Step 3: Run All Sprint 2 Tests

Make sure nothing broke:

```bash
vendor/bin/phpunit tests/test-stripe-checkout.php
vendor/bin/phpunit tests/test-stripe-webhook.php
vendor/bin/phpunit tests/test-payment-success.php
vendor/bin/phpunit tests/test-idempotency.php
vendor/bin/phpunit tests/test-pay-on-arrival.php
```

**Expected:** All tests passing ✅

---

## 🧪 MANUAL TEST (Optional)

If you want to test the UI:

1. Go to booking form: `http://plugin-test-1.local/book`
2. Complete Steps 1-4
3. On Step 5, select "Pay on Arrival"
4. Should see: "Pay £XX.XX when you arrive"
5. Click "Complete Booking"
6. Should redirect to confirmation page
7. Check email formatting (if emails enabled)

---

**Reply with:**
- "All Task 13 tests passing ✅" (if all 10 pass), OR
- Paste any test failures so I can help fix them

Once tests pass, we'll commit Task 13 and you'll have completed the core payment features! 🎉