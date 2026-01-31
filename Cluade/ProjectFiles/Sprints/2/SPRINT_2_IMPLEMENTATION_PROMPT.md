# SPRINT 2 IMPLEMENTATION PROMPT
## WordPress Booking Plugin - Payment Integration & Session Security

**Sprint:** 2 of 6  
**Duration:** 5 weeks  
**Estimated Hours:** 150 hours  
**Start Date:** [Your start date]  
**Target:** Complete payment integration (Stripe, PayPal, Pay-on-Arrival) + session security + booking creation

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
Selects payment method (Stripe/PayPal/Pay-on-Arrival)
  ↓
Payment processes
  ↓
Webhook received
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
✅ **Completed in Sprint 1:**
- Step 1: Service selection with categories
- Step 2: Staff selection with "No Preference" algorithm
- Step 3: Date/time picker with real-time availability
- Step 4: Contact form with UK phone validation
- Session management (PHP $_SESSION)
- Availability algorithm (working hours + existing bookings)
- Integration testing completed

**Session Data Available:**
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

## 📋 SPRINT 2 TASK BREAKDOWN (11 Tasks)

### WEEK 1: Session Security (18 hours)

#### Task 1: Session Security & CSRF Protection (18h)

**Requirements:**
- Session timeout (30 minutes inactive)
- HTTPS-only cookies
- Session fixation prevention
- CSRF protection (WordPress nonces)
- Session cleanup on booking completion
- Abandoned session expiry (24h cron job)

**Files to Create/Modify:**
1. `includes/class-session-manager.php` (update)
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

---

### WEEK 2: Stripe Integration (52 hours)

#### Task 2: Stripe SDK Setup & Configuration (4h)

**Install Stripe PHP SDK:**
```bash
composer require stripe/stripe-php
```

**Configuration UI:**
- Test mode toggle
- Test publishable key
- Test secret key
- Test webhook secret
- Live keys (hidden initially)

**Files:**
- `admin/settings/stripe-settings.php`
- `includes/class-stripe-config.php`

#### Task 3: Stripe Checkout Session Creation (12h)

**Create Step 5: Payment Method Selection**

**Files:**
- `public/templates/booking-step-5-payment.php`
- `public/assets/js/payment-selection.js`
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

#### Task 4: Stripe Webhook Endpoint (12h)

**Create webhook handler:**

**Files:**
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

#### Task 5: Payment Success Handling (8h)

**Create booking confirmation page:**

**Files:**
- `public/templates/booking-confirmed.php`
- `public/assets/css/booking-confirmed.css`

**Confirmation page shows:**
- ✅ Booking confirmed message
- Booking details (service, staff, date, time)
- Payment receipt
- What's next instructions
- Add to calendar button (iCal)

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

#### Task 8: Test Mode Configuration (4h)

**Add test mode toggle in settings:**
- Switch between test and live keys
- Visual indicator on checkout (TEST MODE)
- Prevent live charges in test mode

---

### WEEK 3: PayPal Integration (36 hours)

#### Task 9: PayPal SDK & Checkout Flow (20h)

**Similar structure to Stripe:**
- PayPal SDK setup
- Create PayPal order
- Redirect to PayPal
- Handle return
- Webhook processing
- Refund implementation

**Key differences:**
- Uses PayPal Orders API v2
- OAuth 2.0 authentication
- Different webhook events

**Files:**
- `includes/class-paypal-integration.php`
- `includes/api/class-paypal-webhook.php`
- `admin/settings/paypal-settings.php`

#### Task 10: PayPal Webhook & Refunds (16h)

**Webhook events:**
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.REFUNDED`

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

#### Task 12: Race Condition Handling (8h)

**When slot is taken during checkout:**

```php
function handle_race_condition($payment_info) {
    // 1. Process automatic refund
    $refund_result = $this->process_refund($payment_info);
    
    // 2. Send apology email to customer
    $this->send_race_condition_email($payment_info['customer_email'], [
        'service_name' => $payment_info['service_name'],
        'date' => $payment_info['date'],
        'time' => $payment_info['time'],
        'refund_amount' => $payment_info['amount_paid']
    ]);
    
    // 3. Alert business owner
    $this->alert_admin_race_condition($payment_info);
    
    // 4. Log for monitoring
    error_log('Race condition: ' . json_encode($payment_info));
}
```

**Customer sees friendly error:**
```
Unfortunately, this time slot was just booked by another customer.

Your payment of £25.00 has been automatically refunded.

Please select another time slot to complete your booking.
```

#### Task 13: Pay-on-Arrival Implementation (4h)

**Bypass payment processors:**

```php
if ($payment_method === 'pay_on_arrival') {
    // Create booking immediately (no payment to process)
    $booking_id = create_booking_directly($session_data);
    
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

#### Task 14: Deposit Calculation (3h)

**Calculate deposit amount:**

```php
function calculate_deposit($service_price) {
    $deposit_type = get_option('bookit_deposit_type'); // 'full', 'percentage', 'fixed'
    
    switch ($deposit_type) {
        case 'full':
            return $service_price;
        
        case 'percentage':
            $percentage = get_option('bookit_deposit_percentage', 50);
            return $service_price * ($percentage / 100);
        
        case 'fixed':
            $fixed = get_option('bookit_deposit_fixed_amount', 20);
            return min($fixed, $service_price);
        
        default:
            return $service_price;
    }
}
```

#### Task 15: Booking Confirmation Page (6h)

**Display confirmation with booking details:**

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
│ Payment: £25.00 (deposit)                │
│ Balance: £25.00 (pay on arrival)         │
│                                          │
│ [Add to Calendar] [View Booking]         │
│                                          │
│ A confirmation email has been sent to:   │
│ john@example.com                         │
│                                          │
│ Need to make changes?                    │
│ You can cancel or reschedule using the   │
│ link in your confirmation email.         │
└─────────────────────────────────────────┘
```

#### Task 16: Payment Failure Handling (6h)

**Handle various payment failures:**
- Card declined
- Insufficient funds
- Payment timeout
- Network errors
- Webhook failures

**Show appropriate messages and retry options**

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
- [ ] Customer record created/updated
- [ ] UNIQUE constraint prevents double-booking
- [ ] Race condition triggers automatic refund

### Error Handling
- [ ] Payment declined shows friendly error
- [ ] Race condition handled gracefully
- [ ] Webhook failures logged
- [ ] Network errors have retry logic

### Testing
- [ ] End-to-end Stripe flow tested
- [ ] End-to-end PayPal flow tested
- [ ] Pay-on-Arrival flow tested
- [ ] Race condition tested (manually trigger)
- [ ] Refund tested in sandbox

---

## 🧪 TESTING CHECKLIST

### Payment Testing

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

**Test Flow:**
1. Complete Steps 1-4
2. Select Stripe payment
3. Use test card 4242...
4. Complete payment
5. Verify webhook received
6. Verify booking created
7. Verify confirmation page shows

**PayPal Sandbox:**
- Use PayPal sandbox credentials
- Test with sandbox account
- Verify webhook

**Pay-on-Arrival:**
1. Select Pay-on-Arrival
2. Verify no payment redirect
3. Verify booking created immediately
4. Verify confirmation shows

### Security Testing

**CSRF Protection:**
1. Submit form without nonce
2. Verify rejected

**Session Timeout:**
1. Start booking
2. Wait 31 minutes
3. Try to continue
4. Verify session expired

---

## 📝 GIT COMMIT STRATEGY

**Commit after each task:**

```
Sprint 2, Task 1: Session security implementation

- Added session timeout (30 min)
- HTTPS-only cookies configured
- CSRF protection on all forms
- Session cleanup cron job
- Documented security configuration

Security hardened - ready for payment integration
```

---

## 🚀 SPRINT 2 COMPLETION

When all tasks complete:

**Demo to yourself:**
1. Book appointment with Stripe
2. Book appointment with PayPal
3. Book appointment with Pay-on-Arrival
4. Verify all 3 bookings in database
5. Test refund for one booking

**Report completion:**
- All payment methods working
- Bookings created successfully
- Session security implemented
- Race conditions handled
- Ready for Sprint 3 (Email notifications)

---

## 📚 REFERENCE DOCUMENTS

**In Project Knowledge:**
- `Development_Sequence_Plan.md` - Sprint 2 detailed breakdown
- `IntegrationRequirements_Phase1.md` - Stripe/PayPal specs
- `Gap_Analysis_Report.md` - Race condition solution
- `System_Architecture_Document_PART1.md` - Payment architecture
- `CustomerJourney-03-DateTimeSelectionPayment.md` - Payment flow details

---

## ⚠️ CRITICAL REMINDERS

1. **Test mode only** - No live payments in Sprint 2
2. **UNIQUE constraint** - Prevents double-booking automatically
3. **Webhook signature verification** - Required for security
4. **Idempotency** - Prevent duplicate bookings from webhook retries
5. **Metadata storage** - All booking data in payment metadata
6. **CSRF protection** - All forms must have nonces
7. **Session security** - HTTPS-only, 30 min timeout

---

**Sprint Duration:** 5 weeks  
**Total Hours:** 150 hours  
**Tasks:** 16 tasks  
**End Goal:** Complete payment → booking flow working

Good luck with Sprint 2! 🚀
