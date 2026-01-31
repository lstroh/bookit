# SPRINT 2 IMPLEMENTATION PROMPT
## WordPress Booking Plugin - Payment Integration & Session Security

**Sprint:** 2 of 6  
**Duration:** 5 weeks  
**Estimated Hours:** 150 hours  
**Start Date:** February 2026  
**Target:** Complete payment → booking flow working end-to-end

---

## 🎯 SPRINT 2 OBJECTIVES

### Primary Goals
1. ✅ Implement session security (CSRF, timeouts, HTTPS-only)
2. ✅ Integrate Stripe payments (test mode)
3. ✅ Integrate PayPal payments (test mode)
4. ✅ Implement Pay-on-Arrival option
5. ✅ Create bookings in database after payment
6. ✅ Handle race conditions (double-booking prevention)
7. ✅ Implement automatic refunds

### End-to-End Flow
```
Customer completes Steps 1-4 (from Sprint 1)
  ↓
Step 5: Selects payment method (Stripe/PayPal/Pay-on-Arrival)
  ↓
Payment processes
  ↓
Webhook received (Stripe/PayPal)
  ↓
Booking created in database
  ↓
Confirmation page shown
  ↓
Customer receives confirmation (Sprint 3 will add email)
```

---

## 📚 PROJECT CONTEXT

### What You're Building
**Product:** WordPress booking plugin for UK service businesses (salons, therapists, consultants, photographers)

**Target Market:** SMBs with 1-10 staff members

**Key Differentiator:** Separate business dashboard (not WordPress admin) + zero marketplace commissions + UK-first design

### Sprint 1 Completion Status
✅ **Completed in Sprint 1 (65% complete - 5 of 8 tasks):**
- Step 1: Service selection with categories
- Step 2: Staff selection with "No Preference" algorithm
- Step 3: Date/time picker with real-time availability
- Step 4: Contact form with UK phone validation (in progress)
- Session management (PHP $_SESSION)
- Availability algorithm (working hours + existing bookings)

**Remaining Sprint 1 Tasks (to be completed first):**
- Task 6: Contact Form with Validation (in progress)
- Task 7: Booking Summary Display
- Task 8: Confirmation Page & Integration Testing

**Session Data Available After Sprint 1:**
```php
$_SESSION['bookit_booking'] = [
    'service_id' => 1,
    'staff_id' => 2,
    'booking_date' => '2026-02-15',
    'booking_time' => '14:00:00',
    'customer_first_name' => 'John',
    'customer_last_name' => 'Smith',
    'customer_email' => 'john@example.com',
    'customer_phone' => '07700900123',
    'customer_special_requests' => '...',
    'marketing_consent' => 1,
    'current_step' => 4
];
```

### Database Schema (Key Tables)

**wp_bookings:**
```sql
CREATE TABLE wp_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show'),
    total_price DECIMAL(10,2) NOT NULL,
    deposit_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('stripe', 'paypal', 'pay_on_arrival'),
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    UNIQUE KEY unique_booking (staff_id, booking_date, start_time),
    INDEX idx_customer (customer_id),
    INDEX idx_staff_date (staff_id, booking_date),
    FOREIGN KEY (customer_id) REFERENCES wp_bookings_customers(id),
    FOREIGN KEY (service_id) REFERENCES wp_bookings_services(id),
    FOREIGN KEY (staff_id) REFERENCES wp_bookings_staff(id)
);
```

**CRITICAL:** `UNIQUE KEY unique_booking` prevents race conditions (double-booking)

**wp_bookings_customers:**
```sql
CREATE TABLE wp_bookings_customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    marketing_consent TINYINT(1) DEFAULT 0,
    consent_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 📋 SPRINT 2 TASK BREAKDOWN (16 Tasks)

### WEEK 1: Session Security & Foundation (18 hours)

#### Task 1: Session Security & CSRF Protection (18h)

**Requirements:**
- Session timeout (30 minutes inactive)
- HTTPS-only cookies
- Session fixation prevention
- CSRF protection (WordPress nonces)
- Session cleanup on booking completion
- Abandoned session expiry (24h cron job)

**Files to Create/Modify:**
1. `includes/class-session-manager.php` (update existing)
2. `includes/class-csrf-protection.php` (new)
3. `includes/cron/class-session-cleanup.php` (new)

**Implementation Details:**
```php
// Session configuration
ini_set('session.cookie_httponly', 1);  // Prevent JavaScript access
ini_set('session.cookie_secure', 1);    // HTTPS only
ini_set('session.cookie_samesite', 'Lax'); // CSRF protection
ini_set('session.gc_maxlifetime', 1800);  // 30 minutes

// CSRF nonce on all forms
wp_nonce_field('bookit_booking_action', 'bookit_nonce');

// Verify on submission
if (!wp_verify_nonce($_POST['bookit_nonce'], 'bookit_booking_action')) {
    wp_die('Security check failed');
}
```

**Testing:**
- [ ] Session expires after 30 min inactive
- [ ] CSRF token prevents form replay attacks
- [ ] HTTPS-only cookies set correctly
- [ ] Session cleanup cron runs daily

**Acceptance Criteria:**
- All forms have CSRF protection
- Session security hardened
- Cron job registered and working
- No security warnings in logs

---

### WEEK 2: Stripe Integration (52 hours)

#### Task 2: Stripe SDK Setup & Configuration (4h)

**Install Stripe PHP SDK:**
```bash
composer require stripe/stripe-php
```

**Configuration UI (in WordPress admin):**
- Test mode toggle
- Test publishable key field
- Test secret key field
- Test webhook secret field
- Live keys fields (hidden initially with upgrade notice)

**Files to Create:**
- `admin/settings/stripe-settings.php`
- `includes/payment/class-stripe-config.php`

**Acceptance Criteria:**
- Stripe SDK installed via Composer
- Admin settings page created
- Test keys can be saved
- Mode toggle works correctly

---

#### Task 3: Stripe Checkout Session Creation (12h)

**Create Step 5: Payment Method Selection**

**Files to Create:**
- `public/templates/booking-step-5-payment.php`
- `public/assets/js/payment-selection.js`
- `public/assets/css/payment-step.css`
- `includes/api/class-payment-api.php`

**UI Flow:**
```
┌────────────────────────────────────┐
│ Step 5: Payment                    │
├────────────────────────────────────┤
│ Choose Payment Method:             │
│                                    │
│ ○ Credit/Debit Card (Stripe)      │
│   Secure payment via Stripe        │
│                                    │
│ ○ PayPal                           │
│   Pay with your PayPal account     │
│                                    │
│ ○ Pay on Arrival                   │
│   Pay when you arrive              │
│                                    │
│ Total: £50.00                      │
│ Deposit: £25.00 (50%)              │
│ Balance: £25.00 (pay on arrival)   │
│                                    │
│ [← Back] [Complete Booking →]     │
└────────────────────────────────────┘
```

**Stripe Checkout Session Code:**
```php
function create_stripe_checkout_session($session_data) {
    require_once 'vendor/autoload.php';
    
    \Stripe\Stripe::setApiKey(get_option('bookit_stripe_secret_key'));
    
    $service = get_service($session_data['service_id']);
    $staff = get_staff($session_data['staff_id']);
    
    $checkout_session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'gbp',
                'product_data' => [
                    'name' => $service['name'],
                    'description' => sprintf(
                        'with %s on %s at %s',
                        $staff['first_name'],
                        date('d/m/Y', strtotime($session_data['booking_date'])),
                        date('g:i A', strtotime($session_data['booking_time']))
                    )
                ],
                'unit_amount' => $session_data['deposit_amount'] * 100 // pence
            ],
            'quantity' => 1
        ]],
        'mode' => 'payment',
        'success_url' => home_url('/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url' => home_url('/book?step=5&cancelled=1'),
        'customer_email' => $session_data['customer_email'],
        'metadata' => [
            'booking_temp_id' => wp_generate_uuid4(),
            'service_id' => $session_data['service_id'],
            'staff_id' => $session_data['staff_id'],
            'booking_date' => $session_data['booking_date'],
            'booking_time' => $session_data['booking_time'],
            'customer_first_name' => $session_data['customer_first_name'],
            'customer_last_name' => $session_data['customer_last_name'],
            'customer_email' => $session_data['customer_email'],
            'customer_phone' => $session_data['customer_phone']
        ]
    ]);
    
    return $checkout_session->id;
}
```

**Acceptance Criteria:**
- Payment selection UI displays correctly
- Stripe checkout session creates successfully
- Redirects to Stripe hosted page
- All booking data in metadata

---

#### Task 4: Stripe Webhook Endpoint (12h)

**Create webhook handler:**

**Files to Create:**
- `includes/api/class-stripe-webhook.php`

**Register REST endpoint:**
```php
register_rest_route('bookit/v1', '/stripe/webhook', [
    'methods' => 'POST',
    'callback' => [$this, 'handle_webhook'],
    'permission_callback' => '__return_true' // Signature verification handles auth
]);
```

**Webhook handler:**
```php
public function handle_webhook($request) {
    $payload = $request->get_body();
    $sig_header = $request->get_header('stripe_signature');
    $webhook_secret = get_option('bookit_stripe_webhook_secret');
    
    try {
        // Verify webhook signature
        $event = \Stripe\Webhook::constructEvent(
            $payload,
            $sig_header,
            $webhook_secret
        );
    } catch(\Exception $e) {
        return new WP_REST_Response(['error' => 'Invalid signature'], 400);
    }
    
    // Handle event
    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        
        // Create booking from metadata
        $booking_id = $this->create_booking_from_stripe($session);
        
        if ($booking_id) {
            // Success
            return new WP_REST_Response(['success' => true], 200);
        } else {
            // Log failure for manual review
            $this->log_failed_booking($session);
            return new WP_REST_Response(['success' => false], 500);
        }
    }
    
    return new WP_REST_Response(['success' => true], 200);
}
```

**Acceptance Criteria:**
- Webhook endpoint registered
- Signature verification working
- Handles checkout.session.completed event
- Logs all webhook activity

---

#### Task 5: Payment Success Handling (8h)

**Create booking confirmation page:**

**Files to Create:**
- `public/templates/booking-confirmed.php`
- `public/assets/css/booking-confirmed.css`

**Confirmation page shows:**
```
┌─────────────────────────────────────────┐
│ ✓ Booking Confirmed!                    │
├─────────────────────────────────────────┤
│ Reference: #BK-001234                   │
│                                          │
│ Service: Women's Haircut                │
│ With: Emma Thompson                      │
│ Date: Friday, 15 May 2026                │
│ Time: 2:00 PM                            │
│ Duration: 60 minutes                     │
│                                          │
│ Payment: £25.00 (deposit paid)           │
│ Balance: £25.00 (pay on arrival)         │
│                                          │
│ [Add to Calendar] [View Booking]         │
│                                          │
│ A confirmation email will be sent soon   │
│ to: john@example.com                     │
│                                          │
│ Need to make changes?                    │
│ You can cancel or reschedule using the   │
│ link in your confirmation email.         │
└─────────────────────────────────────────┘
```

**Acceptance Criteria:**
- Confirmation page displays booking details
- Reference number generated correctly
- Add to calendar button works (iCal)
- Responsive design

---

#### Task 6: Idempotency Keys (4h)

**Prevent duplicate bookings from webhook retries:**

```php
// Store in wp_options or separate table
$idempotency_key = 'stripe_' . $session->id;

if (get_transient($idempotency_key)) {
    // Already processed
    return new WP_REST_Response(['success' => true], 200);
}

// Create booking...

// Mark as processed (24h expiry)
set_transient($idempotency_key, true, DAY_IN_SECONDS);
```

**Acceptance Criteria:**
- Duplicate webhook calls don't create duplicate bookings
- Idempotency keys expire after 24 hours
- All webhook calls logged

---

#### Task 7: Stripe Refund API (8h)

**Implement refund function:**

```php
function process_stripe_refund($booking_id, $amount = null) {
    $booking = get_booking($booking_id);
    
    if ($booking['payment_method'] !== 'stripe') {
        return ['error' => 'Not a Stripe payment'];
    }
    
    \Stripe\Stripe::setApiKey(get_option('bookit_stripe_secret_key'));
    
    try {
        $refund = \Stripe\Refund::create([
            'payment_intent' => $booking['payment_intent_id'],
            'amount' => $amount ? ($amount * 100) : null // null = full refund
        ]);
        
        return ['success' => true, 'refund_id' => $refund->id];
    } catch(\Exception $e) {
        return ['error' => $e->getMessage()];
    }
}
```

**Acceptance Criteria:**
- Full refunds work correctly
- Partial refunds work correctly
- Refund status stored in database
- Error handling for declined refunds

---

#### Task 8: Test Mode Configuration (4h)

**Add test mode toggle in settings:**
- Switch between test and live keys
- Visual indicator on checkout (TEST MODE banner)
- Prevent live charges in test mode
- Test card numbers documented

**Acceptance Criteria:**
- Test mode clearly indicated
- Test cards work correctly
- Live mode disabled for now

---

### WEEK 3: PayPal Integration (36 hours)

#### Task 9: PayPal SDK & Checkout Flow (20h)

**Similar structure to Stripe:**
- PayPal SDK setup (via Composer)
- Create PayPal order
- Redirect to PayPal
- Handle return URL
- Webhook processing
- Success/failure handling

**Key differences from Stripe:**
- Uses PayPal Orders API v2
- OAuth 2.0 authentication
- Different webhook events

**Files to Create:**
- `includes/payment/class-paypal-integration.php`
- `includes/api/class-paypal-webhook.php`
- `admin/settings/paypal-settings.php`

**PayPal Order Creation:**
```php
function create_paypal_order($session_data) {
    $service = get_service($session_data['service_id']);
    $staff = get_staff($session_data['staff_id']);
    
    $order = [
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'amount' => [
                'currency_code' => 'GBP',
                'value' => number_format($session_data['deposit_amount'], 2, '.', '')
            ],
            'description' => sprintf(
                '%s with %s on %s at %s',
                $service['name'],
                $staff['first_name'],
                date('d/m/Y', strtotime($session_data['booking_date'])),
                date('g:i A', strtotime($session_data['booking_time']))
            )
        ]],
        'application_context' => [
            'return_url' => home_url('/booking-confirmed?provider=paypal'),
            'cancel_url' => home_url('/book?step=5&cancelled=1')
        ]
    ];
    
    $response = $this->paypal_api_request('/v2/checkout/orders', 'POST', $order);
    
    return $response['id'];
}
```

**Acceptance Criteria:**
- PayPal SDK configured
- Order creation works
- Redirects to PayPal correctly
- Metadata passed through

---

#### Task 10: PayPal Webhook & Refunds (16h)

**Webhook events to handle:**
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.REFUNDED`

**PayPal Refund:**
```php
function process_paypal_refund($booking_id, $amount = null) {
    $booking = get_booking($booking_id);
    
    if ($booking['payment_method'] !== 'paypal') {
        return ['error' => 'Not a PayPal payment'];
    }
    
    $refund_data = [
        'amount' => [
            'value' => $amount ? number_format($amount, 2, '.', '') : $booking['deposit_paid'],
            'currency_code' => 'GBP'
        ]
    ];
    
    $response = $this->paypal_api_request(
        "/v2/payments/captures/{$booking['payment_intent_id']}/refund",
        'POST',
        $refund_data
    );
    
    return ['success' => true, 'refund_id' => $response['id']];
}
```

**Acceptance Criteria:**
- PayPal webhooks verified
- Refunds process correctly
- All events logged

---

### WEEK 4-5: Booking Creation & Error Handling (44 hours)

#### Task 11: Atomic Booking Creation (8h)

**Create booking after payment confirmed:**

```php
function create_booking_from_payment($metadata, $payment_info) {
    global $wpdb;
    
    // Start transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // 1. Create or get customer
        $customer_id = $this->create_or_update_customer([
            'first_name' => $metadata['customer_first_name'],
            'last_name' => $metadata['customer_last_name'],
            'email' => $metadata['customer_email'],
            'phone' => $metadata['customer_phone']
        ]);
        
        // 2. Calculate end time
        $service = $this->get_service($metadata['service_id']);
        $start = strtotime($metadata['booking_time']);
        $end = date('H:i:s', $start + ($service['duration'] * 60));
        
        // 3. Create booking (UNIQUE constraint prevents double-booking)
        $booking_id = $wpdb->insert($wpdb->prefix . 'bookings', [
            'customer_id' => $customer_id,
            'service_id' => $metadata['service_id'],
            'staff_id' => $metadata['staff_id'],
            'booking_date' => $metadata['booking_date'],
            'start_time' => $metadata['booking_time'],
            'end_time' => $end,
            'status' => 'confirmed',
            'total_price' => $payment_info['total'],
            'deposit_paid' => $payment_info['amount_paid'],
            'payment_method' => $payment_info['method'],
            'payment_intent_id' => $payment_info['transaction_id'],
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]);
        
        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }
        
        $wpdb->query('COMMIT');
        
        return $booking_id;
        
    } catch(Exception $e) {
        $wpdb->query('ROLLBACK');
        
        // Check if it's a duplicate key error (race condition)
        if (strpos($e->getMessage(), '1062') !== false) {
            // Slot was taken - process automatic refund
            $this->handle_race_condition($payment_info);
        }
        
        return false;
    }
}
```

**Acceptance Criteria:**
- Transaction wraps booking creation
- Customer created or retrieved correctly
- End time calculated with service duration
- Database constraints enforced

---

#### Task 12: Race Condition Handling (8h)

**When slot is taken during checkout:**

```php
function handle_race_condition($payment_info) {
    // 1. Process automatic refund
    $refund_result = $this->process_refund($payment_info);
    
    // 2. Log for monitoring
    error_log('RACE CONDITION: ' . json_encode($payment_info));
    
    // 3. Store for future email (Sprint 3 will send email)
    $this->queue_race_condition_notification($payment_info);
    
    // 4. Alert business owner via admin notice
    set_transient('bookit_admin_notice_race_condition_' . time(), $payment_info, HOUR_IN_SECONDS);
}
```

**Customer-facing error message:**
```
Unfortunately, this time slot was just booked by another customer.

Your payment of £25.00 has been automatically refunded.

Please select another time slot to complete your booking.
```

**Acceptance Criteria:**
- Race condition detected correctly
- Automatic refund triggered
- Logged for monitoring
- Customer sees friendly error
- Business owner alerted

---

#### Task 13: Pay-on-Arrival Implementation (4h)

**Bypass payment processors:**

```php
if ($payment_method === 'pay_on_arrival') {
    // Create booking immediately (no payment to process)
    $booking_data = [
        'customer_id' => $customer_id,
        'service_id' => $_SESSION['bookit_booking']['service_id'],
        'staff_id' => $_SESSION['bookit_booking']['staff_id'],
        'booking_date' => $_SESSION['bookit_booking']['booking_date'],
        'start_time' => $_SESSION['bookit_booking']['booking_time'],
        'end_time' => $end_time,
        'status' => 'confirmed',
        'total_price' => $service_price,
        'deposit_paid' => 0.00,
        'payment_method' => 'pay_on_arrival',
        'payment_intent_id' => null
    ];
    
    $booking_id = $this->create_booking_directly($booking_data);
    
    if ($booking_id) {
        // Redirect to confirmation
        wp_redirect(home_url('/booking-confirmed?booking_id=' . $booking_id));
        exit;
    } else {
        // Show error
        $error = 'Unable to create booking. Please try again.';
    }
}
```

**Acceptance Criteria:**
- Pay-on-Arrival creates booking immediately
- No payment processing
- Confirmation page shows correctly
- Deposit paid = £0.00

---

#### Task 14: Deposit Calculation (3h)

**Calculate deposit amount based on settings:**

```php
function calculate_deposit($service_price) {
    $deposit_type = get_option('bookit_deposit_type', 'full'); // 'full', 'percentage', 'fixed'
    
    switch ($deposit_type) {
        case 'full':
            return $service_price;
        
        case 'percentage':
            $percentage = get_option('bookit_deposit_percentage', 50);
            return $service_price * ($percentage / 100);
        
        case 'fixed':
            $fixed = get_option('bookit_deposit_fixed_amount', 20.00);
            return min($fixed, $service_price); // Don't exceed total price
        
        default:
            return $service_price;
    }
}
```

**Admin settings (add to existing settings page):**
- Deposit type dropdown (Full Payment, Percentage, Fixed Amount)
- Percentage field (1-100%)
- Fixed amount field (£)

**Acceptance Criteria:**
- All three deposit types work
- Settings save correctly
- Calculation accurate
- Display correct on payment page

---

#### Task 15: Booking Confirmation Page Enhancement (6h)

**Display comprehensive confirmation:**

```
┌─────────────────────────────────────────┐
│ ✓ Booking Confirmed!                    │
├─────────────────────────────────────────┤
│ Reference: #BK-001234                   │
│                                          │
│ Service: Women's Haircut                │
│ With: Emma Thompson                      │
│ Date: Friday, 15 May 2026                │
│ Time: 2:00 PM - 3:00 PM                  │
│ Duration: 60 minutes                     │
│                                          │
│ Location:                                │
│ Salon Name                               │
│ 123 High Street                          │
│ London, SW1A 1AA                         │
│                                          │
│ Payment Summary:                         │
│ Total: £50.00                            │
│ Paid: £25.00 (deposit)                   │
│ Balance: £25.00 (pay on arrival)         │
│                                          │
│ [Download iCal] [Add to Google]          │
│                                          │
│ A confirmation email will be sent to:    │
│ john@example.com                         │
│                                          │
│ Need to make changes?                    │
│ You'll receive a link to cancel or       │
│ reschedule in your confirmation email.   │
│                                          │
│ Questions? Contact us at:                │
│ 020 1234 5678                            │
└─────────────────────────────────────────┘
```

**Acceptance Criteria:**
- All booking details displayed
- Payment summary clear
- Add to calendar works
- Responsive design
- Print-friendly

---

#### Task 16: Payment Failure Handling (6h)

**Handle various payment failures:**

**Card Declined:**
```
Your payment was declined.

Reason: Insufficient funds

Please try again with a different payment method or contact your bank.

[Try Again] [Change Payment Method]
```

**Payment Timeout:**
```
Payment processing timed out.

No charge has been made to your card.

Please try again or choose a different time slot.

[Try Again] [Select Different Slot]
```

**Network Error:**
```
We're experiencing technical difficulties.

Your payment was not processed.

Please try again in a few moments.

[Try Again] [Contact Support]
```

**Files to Create:**
- `public/templates/payment-error.php`
- `includes/payment/class-payment-error-handler.php`

**Acceptance Criteria:**
- All error types handled gracefully
- No charges on failed attempts
- Clear customer messaging
- Retry options available
- All failures logged

---

## ✅ SPRINT 2 EXIT CRITERIA

### Payment Methods
- [ ] Stripe test payment completes successfully
- [ ] PayPal test payment completes successfully
- [ ] Pay-on-Arrival creates booking without payment
- [ ] All three methods create bookings in database

### Session Security
- [ ] Session timeout working (30 min)
- [ ] CSRF protection on all forms
- [ ] HTTPS-only cookies configured
- [ ] Session cleanup cron job running

### Booking Creation
- [ ] Booking record created after payment
- [ ] Customer record created/updated correctly
- [ ] UNIQUE constraint prevents double-booking
- [ ] Race condition triggers automatic refund
- [ ] Transaction rollback on errors

### Error Handling
- [ ] Payment declined shows friendly error
- [ ] Race condition handled gracefully
- [ ] Webhook failures logged
- [ ] Network errors have retry logic
- [ ] All payment errors logged

### Testing
- [ ] End-to-end Stripe flow tested in test mode
- [ ] End-to-end PayPal flow tested in sandbox
- [ ] Pay-on-Arrival flow tested
- [ ] Race condition tested (manual trigger)
- [ ] Refund tested in sandbox
- [ ] All unit tests passing
- [ ] Integration tests complete

---

## 🧪 TESTING CHECKLIST

### Payment Testing

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242 (any CVV, future date)
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995
```

**Test Flow - Stripe:**
1. Complete Steps 1-4 (select service, staff, date/time, contact)
2. Select Stripe payment method
3. Click "Complete Booking"
4. Redirected to Stripe checkout
5. Use test card 4242 4242 4242 4242
6. Enter any email, name, postal code
7. Complete payment
8. Redirected back to confirmation page
9. Verify webhook received in logs
10. Verify booking created in database
11. Verify confirmation page shows correct details

**PayPal Sandbox:**
- Create sandbox business account
- Create sandbox personal account
- Use sandbox credentials in settings
- Test with sandbox account login
- Verify webhook received

**Pay-on-Arrival:**
1. Complete Steps 1-4
2. Select "Pay on Arrival"
3. Click "Complete Booking"
4. Verify booking created immediately (no payment redirect)
5. Verify deposit_paid = £0.00
6. Verify confirmation page shows "Pay on arrival"

### Security Testing

**CSRF Protection:**
1. Start booking flow
2. Inspect form, copy nonce value
3. Open new tab, try to submit with old nonce
4. Verify: Request rejected with "Security check failed"

**Session Timeout:**
1. Start booking flow
2. Complete Step 1
3. Wait 31 minutes (or temporarily reduce timeout for testing)
4. Try to continue to Step 2
5. Verify: Session expired message

**HTTPS Enforcement:**
1. Check session cookies in browser dev tools
2. Verify: Secure flag set to true
3. Verify: HttpOnly flag set to true

### Race Condition Testing

**Manual Race Condition Trigger:**
1. Open booking form in two browsers
2. Complete Steps 1-4 in both (same service, staff, date, time)
3. Submit payment in Browser A
4. Immediately submit payment in Browser B
5. Verify: Browser A gets booking confirmation
6. Verify: Browser B gets "slot taken" error
7. Verify: Browser B refund processed automatically
8. Check logs for race condition entry
9. Check database: Only one booking exists

### Performance Testing

**Webhook Latency:**
- Average webhook processing time < 2 seconds
- Booking creation time < 1 second
- Refund processing time < 3 seconds

---

## 📝 GIT COMMIT STRATEGY

**Commit after each task:**

```bash
git commit -m "Sprint 2, Task 1: Session security implementation

- Added session timeout (30 min inactive)
- HTTPS-only cookies configured  
- CSRF protection on all forms
- Session cleanup cron job registered
- Security configuration documented

Security hardened - ready for payment integration"
```

**Example commits:**
```
Sprint 2, Task 2: Stripe SDK setup and configuration
Sprint 2, Task 3: Stripe checkout session creation
Sprint 2, Task 4: Stripe webhook endpoint implementation
Sprint 2, Task 5: Payment success confirmation page
Sprint 2, Task 6: Idempotency keys for webhook safety
Sprint 2, Task 7: Stripe refund API integration
Sprint 2, Task 8: Test mode configuration
Sprint 2, Task 9: PayPal SDK and checkout flow
Sprint 2, Task 10: PayPal webhook and refunds
Sprint 2, Task 11: Atomic booking creation with transactions
Sprint 2, Task 12: Race condition detection and handling
Sprint 2, Task 13: Pay-on-Arrival implementation
Sprint 2, Task 14: Deposit calculation system
Sprint 2, Task 15: Enhanced confirmation page
Sprint 2, Task 16: Payment error handling
```

---

## 🚀 SPRINT 2 COMPLETION

**When all tasks complete:**

### Demo to Yourself (End-to-End Tests)

**Test 1: Stripe Payment**
1. Book appointment with test card
2. Verify webhook received
3. Verify booking in database
4. Verify confirmation page
5. Test refund in Stripe dashboard

**Test 2: PayPal Payment**
1. Book appointment with PayPal sandbox
2. Verify webhook received
3. Verify booking in database
4. Verify confirmation page

**Test 3: Pay-on-Arrival**
1. Book appointment without payment
2. Verify booking in database
3. Verify deposit_paid = £0.00

**Test 4: Race Condition**
1. Manually trigger double-booking
2. Verify second booking gets refund
3. Verify friendly error message
4. Verify only one booking exists

### Sprint 2 Completion Report

**Report to Project Assistant:**
```
Sprint 2 complete ✅

Summary:
- 16/16 tasks completed
- Estimated: 150 hours
- Actual: [X] hours
- All tests passing
- All deliverables met

Payment Methods:
- Stripe integration ✅
- PayPal integration ✅
- Pay-on-Arrival ✅

Security:
- Session security hardened ✅
- CSRF protection implemented ✅
- Race conditions handled ✅

Key Achievements:
- End-to-end payment flow working
- Automatic refunds on race conditions
- All three payment methods functional
- Webhook processing reliable

Challenges:
- [Note any issues encountered]

Ready for Sprint 3: Email Notifications
```

---

## 📚 REFERENCE DOCUMENTS

**In Project Knowledge:**
- `Development_Sequence_Plan.md` - Sprint 2 detailed breakdown
- `IntegrationRequirements_Phase1.md` - Stripe/PayPal specs
- `Gap_Analysis_Report.md` - Race condition solution
- `System_Architecture_Document_PART1.md` - Payment architecture (Sections 1-8)
- `System_Architecture_Document_PART2.md` - Integration patterns (Sections 9-19)
- `CustomerJourney-03-DateTimeSelectionPayment.md` - Payment flow details
- `UK_Compliance_Checklist_v1_0.md` - Payment compliance requirements

---

## ⚠️ CRITICAL REMINDERS

### Security
1. **Test mode only** - No live payments in Sprint 2
2. **CSRF protection** - All forms must have WordPress nonces
3. **Session security** - HTTPS-only, 30 min timeout, cookie flags set
4. **Webhook signature verification** - Required for Stripe and PayPal
5. **Idempotency** - Prevent duplicate bookings from webhook retries

### Database
6. **UNIQUE constraint** - Prevents double-booking automatically (staff_id, booking_date, start_time)
7. **Transactions** - Wrap all booking creation in database transactions
8. **Foreign keys** - Maintain referential integrity

### Payment Processing
9. **Metadata storage** - All booking data must be in payment metadata (for webhook processing)
10. **Automatic refunds** - Race conditions trigger immediate refunds
11. **Error logging** - Log all payment errors and webhook failures
12. **Deposit calculation** - Support full, percentage, and fixed deposit types

### Testing
13. **Test cards only** - Never use real cards
14. **Webhook testing** - Use Stripe CLI or ngrok for local webhook testing
15. **Race condition testing** - Manually test double-booking scenarios

---

## 🔧 DEVELOPMENT ENVIRONMENT SETUP

### Stripe CLI (for webhook testing)
```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local
stripe listen --forward-to http://local-site.local/wp-json/bookit/v1/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### PayPal Sandbox
- Sandbox URL: https://developer.paypal.com/dashboard/
- Create sandbox business account
- Create sandbox personal account (for testing payments)
- Use sandbox credentials in plugin settings

### Local WordPress Environment
- Using: Local by Flywheel OR wp-env
- PHP version: 8.0+
- MySQL version: 5.7+
- HTTPS enabled (for session security testing)

---

## 📊 SPRINT 2 METRICS

**Estimated Breakdown:**
- Week 1 (Session Security): 18 hours
- Week 2 (Stripe Integration): 52 hours
- Week 3 (PayPal Integration): 36 hours
- Week 4-5 (Booking Creation & Errors): 44 hours

**Total: 150 hours over 5 weeks**

**Key Performance Indicators:**
- Payment success rate: >95% (excluding test declines)
- Webhook processing time: <2 seconds average
- Race condition handling: 100% refund rate
- Security issues: 0 vulnerabilities

---

## 🎯 SUCCESS CRITERIA

Sprint 2 is complete when:

1. ✅ All 16 tasks completed
2. ✅ All three payment methods functional (Stripe, PayPal, Pay-on-Arrival)
3. ✅ Session security hardened (CSRF, timeout, HTTPS cookies)
4. ✅ Webhooks processing reliably
5. ✅ Bookings created in database after payment
6. ✅ Race conditions handled with automatic refunds
7. ✅ Confirmation page displays all details
8. ✅ All tests passing (unit + integration + manual)
9. ✅ Error handling covers all failure modes
10. ✅ Git history clean with meaningful commits
11. ✅ No PHP errors or warnings
12. ✅ No JavaScript console errors
13. ✅ Responsive design verified
14. ✅ Test mode only (no live payments)

---

**Sprint Duration:** 5 weeks  
**Total Hours:** 150 hours  
**Tasks:** 16 tasks  
**End Goal:** Complete payment → booking flow working end-to-end

**Next Sprint:** Sprint 3 - Email Notifications & Post-Booking Management

Good luck with Sprint 2! 🚀

---

## 📞 SUPPORT & ESCALATION

**If you encounter issues:**

1. **Technical blockers** - Search WordPress/Stripe/PayPal documentation
2. **Architecture questions** - Return to Project Assistant chat for guidance
3. **Scope changes** - Discuss with Project Assistant before implementing
4. **Unexpected complexity** - Report time estimate adjustments early

**Remember:** This is test/development mode. No live payments, no real customer data, no production stress. Take your time and build it right! ✅
