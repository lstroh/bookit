# 🟣 TASK 4: STRIPE WEBHOOK - IMPLEMENTATION

**Status:** Tests created ✅ - Now implementing the feature

---

## 📝 IMPLEMENTATION OVERVIEW

We'll create this in 3 parts:

1. **Webhook Handler** - REST API endpoint, signature verification, event routing
2. **Booking Creator** - Creates booking and customer records from payment data
3. **Integration** - Register REST routes and wire everything together

Let's build them in order.

---

## 📝 PART 1: WEBHOOK HANDLER

### CURSOR PROMPT: Create Stripe Webhook Handler

Copy this into **Cursor Composer**:

```
TASK: Implement Stripe Webhook Handler (Sprint 2, Task 4 - Part 1)

CONTEXT:
Sprint 2, Task 4 - Implementation. We have 18 PHPUnit tests waiting. Now implement the webhook handler that receives payment confirmation from Stripe and processes events.

CREATE NEW FILE: includes/api/class-stripe-webhook.php

```php
<?php
/**
 * Stripe Webhook Handler
 * Receives and processes Stripe webhook events
 * 
 * @package Booking_System
 * @subpackage API
 */

class Booking_System_Stripe_Webhook {
    
    /**
     * Constructor - Register REST API routes
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register webhook REST API endpoint
     */
    public function register_routes() {
        register_rest_route('bookit/v1', '/stripe/webhook', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_webhook'),
            'permission_callback' => '__return_true' // Webhook is public, verified by signature
        ));
    }
    
    /**
     * Handle incoming webhook request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle_webhook($request) {
        // Get raw body and signature header
        $payload = $request->get_body();
        $signature = $request->get_header('stripe_signature');
        
        // Verify signature is present
        if (empty($signature)) {
            error_log('Stripe Webhook: Missing signature header');
            return new WP_Error(
                'missing_signature',
                'Missing Stripe signature',
                array('status' => 400)
            );
        }
        
        // Verify webhook signature
        $event = $this->verify_webhook_signature($payload, $signature);
        
        if (is_wp_error($event)) {
            error_log('Stripe Webhook: Invalid signature - ' . $event->get_error_message());
            return $event;
        }
        
        // Log received event
        error_log(sprintf(
            'Stripe Webhook: Received event %s (type: %s)',
            $event->id,
            $event->type
        ));
        
        // Process event based on type
        $result = $this->process_event($event);
        
        if (is_wp_error($result)) {
            error_log('Stripe Webhook: Processing failed - ' . $result->get_error_message());
            
            // Return 200 to Stripe even on processing errors to prevent retries
            // We've logged the error for investigation
            return new WP_REST_Response(array(
                'received' => true,
                'error' => $result->get_error_message()
            ), 200);
        }
        
        // Success
        return new WP_REST_Response(array(
            'received' => true,
            'processed' => true
        ), 200);
    }
    
    /**
     * Verify Stripe webhook signature
     * 
     * @param string $payload Raw request body
     * @param string $signature Stripe-Signature header value
     * @return object|WP_Error Stripe event object or error
     */
    private function verify_webhook_signature($payload, $signature) {
        // Get webhook secret
        $stripe_config = new Booking_System_Stripe_Config();
        $webhook_secret = $stripe_config->get_webhook_secret();
        
        if (empty($webhook_secret)) {
            return new WP_Error(
                'missing_webhook_secret',
                'Webhook secret not configured',
                array('status' => 500)
            );
        }
        
        // Allow tests to bypass signature verification
        $bypass = apply_filters('bookit_verify_stripe_signature', null, $payload, $signature);
        if ($bypass !== null) {
            // Test mode - parse payload manually
            $event_data = json_decode($payload);
            return (object) array(
                'id' => $event_data->id ?? 'test_event',
                'type' => $event_data->type ?? 'unknown',
                'data' => (object) array(
                    'object' => (object) $event_data->data->object
                )
            );
        }
        
        // Verify signature using Stripe SDK
        try {
            require_once dirname(dirname(__DIR__)) . '/vendor/autoload.php';
            
            \Stripe\Stripe::setApiKey($stripe_config->get_secret_key());
            
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $signature,
                $webhook_secret
            );
            
            return $event;
            
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            return new WP_Error(
                'invalid_payload',
                'Invalid webhook payload: ' . $e->getMessage(),
                array('status' => 400)
            );
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            return new WP_Error(
                'invalid_signature',
                'Invalid webhook signature: ' . $e->getMessage(),
                array('status' => 400)
            );
        }
    }
    
    /**
     * Process webhook event based on type
     * 
     * @param object $event Stripe event object
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    private function process_event($event) {
        switch ($event->type) {
            case 'checkout.session.completed':
                return $this->handle_checkout_completed($event);
            
            case 'payment_intent.succeeded':
                // For future use - already handled by checkout.session.completed
                error_log('Stripe Webhook: payment_intent.succeeded received (no action needed)');
                return true;
            
            case 'payment_intent.payment_failed':
                // For future use - Task 16 (Payment failure handling)
                error_log('Stripe Webhook: payment_intent.payment_failed received');
                return true;
            
            default:
                // Unknown/unhandled event type - log and ignore
                error_log('Stripe Webhook: Unhandled event type: ' . $event->type);
                return true;
        }
    }
    
    /**
     * Handle checkout.session.completed event
     * Creates booking after successful payment
     * 
     * @param object $event Stripe event
     * @return bool|WP_Error
     */
    private function handle_checkout_completed($event) {
        $session = $event->data->object;
        
        // Check if payment was successful
        if ($session->payment_status !== 'paid') {
            error_log(sprintf(
                'Stripe Webhook: Checkout session %s not paid (status: %s)',
                $session->id,
                $session->payment_status
            ));
            return true; // Not an error, just not paid yet
        }
        
        // Check for idempotency - prevent duplicate bookings
        $idempotency_key = 'stripe_webhook_' . $session->id;
        $existing = get_transient($idempotency_key);
        
        if ($existing) {
            error_log('Stripe Webhook: Duplicate webhook detected for session ' . $session->id);
            return true; // Already processed
        }
        
        // Extract metadata
        $metadata = (array) $session->metadata;
        
        // Validate required fields
        $required_fields = array(
            'service_id',
            'staff_id',
            'booking_date',
            'booking_time',
            'customer_email',
            'customer_first_name',
            'customer_last_name'
        );
        
        foreach ($required_fields as $field) {
            if (empty($metadata[$field])) {
                return new WP_Error(
                    'missing_metadata',
                    sprintf('Missing required metadata field: %s', $field)
                );
            }
        }
        
        // Create booking using Booking Creator
        $booking_creator = new Booking_System_Booking_Creator();
        
        $booking_data = array(
            'service_id' => (int) $metadata['service_id'],
            'staff_id' => (int) $metadata['staff_id'],
            'booking_date' => $metadata['booking_date'],
            'booking_time' => $metadata['booking_time'],
            'customer_first_name' => $metadata['customer_first_name'],
            'customer_last_name' => $metadata['customer_last_name'],
            'customer_email' => $metadata['customer_email'],
            'customer_phone' => $metadata['customer_phone'] ?? '',
            'special_requests' => $metadata['special_requests'] ?? '',
            'payment_method' => 'stripe',
            'payment_intent_id' => $session->payment_intent ?? '',
            'stripe_session_id' => $session->id,
            'amount_paid' => $session->amount_total / 100 // Convert from pence to pounds
        );
        
        $booking_id = $booking_creator->create_booking($booking_data);
        
        if (is_wp_error($booking_id)) {
            return $booking_id;
        }
        
        // Store idempotency key for 24 hours
        set_transient($idempotency_key, $booking_id, 24 * HOUR_IN_SECONDS);
        
        error_log(sprintf(
            'Stripe Webhook: Created booking #%d from session %s',
            $booking_id,
            $session->id
        ));
        
        return true;
    }
}

// Initialize webhook handler
new Booking_System_Stripe_Webhook();
```

CRITICAL REQUIREMENTS:

1. REST API endpoint: POST /bookit/v1/stripe/webhook
2. Signature verification using Stripe SDK
3. Support test mode bypass via filter
4. Idempotency using WordPress transients
5. Event routing (checkout.session.completed, etc.)
6. Comprehensive error logging
7. Always return 200 to Stripe (even on processing errors)
8. Extract metadata from session
9. Validate required fields
10. Pass data to Booking Creator

SECURITY:
- Verify Stripe signature on all webhooks
- Public endpoint (no WordPress auth) but signature-verified
- Log all errors for investigation
- Prevent duplicate processing via idempotency

SUCCESS CRITERIA:
- REST route registered
- Accepts POST requests only
- Verifies Stripe signatures
- Handles checkout.session.completed events
- Stores idempotency keys
- Logs all activity
- Returns proper HTTP status codes

Please generate the complete webhook handler class.
```

---

## 📝 PART 2: BOOKING CREATOR

### CURSOR PROMPT: Create Booking Creator Class

Copy this into **Cursor Composer**:

```
TASK: Implement Booking Creator (Sprint 2, Task 4 - Part 2)

CONTEXT:
Sprint 2, Task 4 - Implementation. Create the class that handles booking and customer record creation from payment data. This is called by the webhook handler.

CREATE NEW FILE: includes/booking/class-booking-creator.php

```php
<?php
/**
 * Booking Creator
 * Creates booking and customer records from payment data
 * 
 * @package Booking_System
 * @subpackage Booking
 */

class Booking_System_Booking_Creator {
    
    /**
     * Create booking from payment data
     * 
     * @param array $data Booking data
     * @return int|WP_Error Booking ID or error
     */
    public function create_booking($data) {
        global $wpdb;
        
        // Validate required fields
        $validation = $this->validate_booking_data($data);
        if (is_wp_error($validation)) {
            return $validation;
        }
        
        // Get service to calculate end time
        $service = $this->get_service($data['service_id']);
        if (!$service) {
            return new WP_Error('invalid_service', 'Service not found');
        }
        
        // Verify staff exists
        $staff = $this->get_staff($data['staff_id']);
        if (!$staff) {
            return new WP_Error('invalid_staff', 'Staff member not found');
        }
        
        // Calculate end time from service duration
        $start_time = $data['booking_time'];
        $end_time = $this->calculate_end_time($start_time, $service['duration']);
        
        // Get or create customer
        $customer_id = $this->get_or_create_customer(array(
            'first_name' => $data['customer_first_name'],
            'last_name' => $data['customer_last_name'],
            'email' => $data['customer_email'],
            'phone' => $data['customer_phone'] ?? ''
        ));
        
        if (is_wp_error($customer_id)) {
            return $customer_id;
        }
        
        // Check for double booking (race condition)
        $conflict = $this->check_booking_conflict(
            $data['staff_id'],
            $data['booking_date'],
            $start_time,
            $end_time
        );
        
        if ($conflict) {
            return new WP_Error(
                'slot_unavailable',
                'This time slot is no longer available'
            );
        }
        
        // Prepare booking data
        $booking_data = array(
            'customer_id' => $customer_id,
            'service_id' => $data['service_id'],
            'staff_id' => $data['staff_id'],
            'booking_date' => $data['booking_date'],
            'start_time' => $start_time,
            'end_time' => $end_time,
            'status' => 'confirmed',
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
        
        // Insert booking
        $inserted = $wpdb->insert(
            $wpdb->prefix . 'bookings',
            $booking_data,
            array(
                '%d', // customer_id
                '%d', // service_id
                '%d', // staff_id
                '%s', // booking_date
                '%s', // start_time
                '%s', // end_time
                '%s', // status
                '%f', // total_price
                '%f', // deposit_paid
                '%f', // balance_due
                '%s', // payment_method
                '%s', // payment_intent_id
                '%s', // stripe_session_id
                '%s', // special_requests
                '%s', // created_at
                '%s'  // updated_at
            )
        );
        
        if (!$inserted) {
            error_log('Booking Creator: Database insert failed - ' . $wpdb->last_error);
            return new WP_Error('database_error', 'Failed to create booking');
        }
        
        $booking_id = $wpdb->insert_id;
        
        // Log success
        error_log(sprintf(
            'Booking Creator: Created booking #%d (customer: %s, service: %s, date: %s %s)',
            $booking_id,
            $data['customer_email'],
            $service['name'],
            $data['booking_date'],
            $start_time
        ));
        
        return $booking_id;
    }
    
    /**
     * Validate booking data
     * 
     * @param array $data
     * @return bool|WP_Error
     */
    private function validate_booking_data($data) {
        $required_fields = array(
            'service_id',
            'staff_id',
            'booking_date',
            'booking_time',
            'customer_email',
            'customer_first_name',
            'customer_last_name',
            'payment_method',
            'amount_paid'
        );
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                return new WP_Error(
                    'missing_field',
                    sprintf('Missing required field: %s', $field)
                );
            }
        }
        
        // Validate email
        if (!is_email($data['customer_email'])) {
            return new WP_Error('invalid_email', 'Invalid customer email');
        }
        
        // Validate date format
        if (!$this->is_valid_date($data['booking_date'])) {
            return new WP_Error('invalid_date', 'Invalid booking date format');
        }
        
        // Validate time format
        if (!$this->is_valid_time($data['booking_time'])) {
            return new WP_Error('invalid_time', 'Invalid booking time format');
        }
        
        return true;
    }
    
    /**
     * Get or create customer record
     * 
     * @param array $data Customer data
     * @return int|WP_Error Customer ID or error
     */
    private function get_or_create_customer($data) {
        global $wpdb;
        
        // Look for existing customer by email
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_customers WHERE email = %s",
            $data['email']
        ));
        
        if ($existing) {
            // Update existing customer data (in case name/phone changed)
            $wpdb->update(
                $wpdb->prefix . 'bookings_customers',
                array(
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'phone' => $data['phone'],
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $existing->id),
                array('%s', '%s', '%s', '%s'),
                array('%d')
            );
            
            return (int) $existing->id;
        }
        
        // Create new customer
        $inserted = $wpdb->insert(
            $wpdb->prefix . 'bookings_customers',
            array(
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if (!$inserted) {
            error_log('Booking Creator: Customer insert failed - ' . $wpdb->last_error);
            return new WP_Error('database_error', 'Failed to create customer');
        }
        
        return (int) $wpdb->insert_id;
    }
    
    /**
     * Calculate end time from start time and duration
     * 
     * @param string $start_time Time in HH:MM:SS format
     * @param int $duration_minutes Duration in minutes
     * @return string End time in HH:MM:SS format
     */
    private function calculate_end_time($start_time, $duration_minutes) {
        $start = strtotime($start_time);
        $end = $start + ($duration_minutes * 60);
        return date('H:i:s', $end);
    }
    
    /**
     * Check for booking conflicts (double booking prevention)
     * 
     * @param int $staff_id
     * @param string $date
     * @param string $start_time
     * @param string $end_time
     * @return bool True if conflict exists
     */
    private function check_booking_conflict($staff_id, $date, $start_time, $end_time) {
        global $wpdb;
        
        $conflict = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
            WHERE staff_id = %d
            AND booking_date = %s
            AND status != 'cancelled'
            AND (
                (start_time < %s AND end_time > %s)
                OR (start_time < %s AND end_time > %s)
                OR (start_time >= %s AND end_time <= %s)
            )",
            $staff_id,
            $date,
            $end_time,   // New booking ends after existing starts
            $start_time, // New booking starts before existing ends
            $end_time,   // New booking ends after existing starts
            $start_time, // New booking starts before existing ends
            $start_time, // Existing booking entirely within new booking
            $end_time
        ));
        
        return $conflict > 0;
    }
    
    /**
     * Get service from database
     */
    private function get_service($service_id) {
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
            $service_id
        ), ARRAY_A);
    }
    
    /**
     * Get staff from database
     */
    private function get_staff($staff_id) {
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
            $staff_id
        ), ARRAY_A);
    }
    
    /**
     * Validate date format (YYYY-MM-DD)
     */
    private function is_valid_date($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    
    /**
     * Validate time format (HH:MM:SS)
     */
    private function is_valid_time($time) {
        return preg_match('/^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/', $time);
    }
}
```

CRITICAL REQUIREMENTS:

1. Create customer record (or use existing by email)
2. Validate all input data
3. Calculate end_time from start_time + duration
4. Check for booking conflicts (race condition)
5. Insert booking with status = 'confirmed'
6. Store payment details (intent_id, session_id, amount)
7. Calculate balance_due (total - deposit_paid)
8. Log all operations
9. Return booking ID on success
10. Return WP_Error on failure

VALIDATION:
- All required fields present
- Valid email format
- Valid date format (YYYY-MM-DD)
- Valid time format (HH:MM:SS)
- Service exists in database
- Staff exists in database

RACE CONDITION HANDLING:
- Check for overlapping bookings before insert
- Use time range overlap detection
- Exclude cancelled bookings from conflict check

SUCCESS CRITERIA:
- Creates customer if new, uses existing if found
- Creates booking with all correct data
- Calculates end_time accurately
- Prevents double bookings
- Returns booking ID on success
- Comprehensive error handling

Please generate the complete booking creator class.
```

---

## 📝 PART 3: ADD STRIPE CONFIG METHOD

We need to add a method to get the webhook secret. Update the Stripe Config class:

### CURSOR PROMPT: Add Webhook Secret Method

```
TASK: Add get_webhook_secret() Method to Stripe Config

CONTEXT:
Sprint 2, Task 4 - The webhook handler needs to get the webhook secret for signature verification.

FIND FILE: includes/payment/class-stripe-config.php

ADD NEW METHOD (after get_secret_key() method):

```php
/**
 * Get webhook secret based on current mode
 * 
 * @return string Webhook secret or empty string
 */
public function get_webhook_secret() {
    $mode = $this->get_mode();
    
    if ($mode === 'test') {
        return get_option('bookit_stripe_test_webhook_secret', '');
    }
    
    // Live mode (Phase 2)
    return get_option('bookit_stripe_live_webhook_secret', '');
}
```

LOCATION: Add this method in the Booking_System_Stripe_Config class, near other getter methods.

SUCCESS CRITERIA:
- Method returns test webhook secret when in test mode
- Method returns empty string if not configured
- Follows same pattern as get_publishable_key() and get_secret_key()

Please add the get_webhook_secret() method to the Stripe Config class.
```

---

## 📝 PART 4: INCLUDE NEW FILES IN MAIN PLUGIN

### CURSOR PROMPT: Include Webhook Files in Main Plugin

```
TASK: Include Webhook Handler and Booking Creator in Main Plugin File

CONTEXT:
Sprint 2, Task 4 - Need to load the new webhook and booking creator classes.

FIND FILE: booking-system.php

FIND SECTION: Where other payment classes are required (near Stripe SDK, Stripe Config, etc.)

ADD THESE LINES:

```php
// Webhook handling
require_once plugin_dir_path(__FILE__) . 'includes/api/class-stripe-webhook.php';
require_once plugin_dir_path(__FILE__) . 'includes/booking/class-booking-creator.php';
```

LOCATION: Add after the existing payment class includes:
```php
// Payment processing
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-stripe-config.php';
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-stripe-checkout.php';
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-payment-processor.php';

// Webhook handling (ADD THESE)
require_once plugin_dir_path(__FILE__) . 'includes/api/class-stripe-webhook.php';
require_once plugin_dir_path(__FILE__) . 'includes/booking/class-booking-creator.php';
```

SUCCESS CRITERIA:
- Files included in correct order
- No syntax errors when plugin loads
- Webhook handler instantiated automatically
- REST routes registered on rest_api_init

Please add the require statements to the main plugin file.
```

---

## ⏸️ AFTER CURSOR GENERATES ALL CODE

### Step 1: Verify Files Created

Check these files exist:
- [ ] `includes/api/class-stripe-webhook.php`
- [ ] `includes/booking/class-booking-creator.php`
- [ ] Updated: `includes/payment/class-stripe-config.php` (has get_webhook_secret())
- [ ] Updated: `booking-system.php` (includes new files)

### Step 2: Run Tests

```bash
vendor/bin/phpunit tests/test-stripe-webhook.php
```

**Expected:**
```
PHPUnit 9.x.x

..................  18 / 18 (100%)

Time: 00:00.567, Memory: 16.00 MB

OK (18 tests, 54 assertions)
```

---

## 🐛 COMMON TEST FAILURES & FIXES

### Issue 1: "REST route not found"

**Check:**
```php
// In class-stripe-webhook.php constructor:
add_action('rest_api_init', array($this, 'register_routes'));
```

**Fix:** Make sure webhook class is instantiated at bottom of file:
```php
new Booking_System_Stripe_Webhook();
```

### Issue 2: "Table doesn't exist"

**Check:** Database tables exist:
```sql
SHOW TABLES LIKE 'wp_bookings%';
```

Should show:
- `wp_bookings`
- `wp_bookings_customers`
- `wp_bookings_services`
- `wp_bookings_staff`

### Issue 3: "Column not found"

**Check booking table has these columns:**
- `payment_intent_id`
- `stripe_session_id`
- `deposit_paid`
- `balance_due`

If missing, add them:
```sql
ALTER TABLE wp_bookings 
ADD COLUMN payment_intent_id VARCHAR(255) NULL AFTER payment_method,
ADD COLUMN stripe_session_id VARCHAR(255) NULL AFTER payment_intent_id,
ADD COLUMN deposit_paid DECIMAL(10,2) DEFAULT 0 AFTER total_price,
ADD COLUMN balance_due DECIMAL(10,2) DEFAULT 0 AFTER deposit_paid;
```

---

## ✅ TASK 4 ACCEPTANCE CRITERIA

Before marking complete:

**Implementation:**
- [ ] Webhook handler class created
- [ ] Booking creator class created
- [ ] REST endpoint registered
- [ ] Signature verification implemented
- [ ] Customer creation/lookup working
- [ ] Booking creation working
- [ ] Idempotency working (transients)
- [ ] End time calculated from duration
- [ ] Conflict detection implemented

**Tests:**
- [ ] All 18 tests passing
- [ ] Webhook endpoint tests pass
- [ ] Event handling tests pass
- [ ] Customer creation tests pass
- [ ] Booking creation tests pass
- [ ] Idempotency tests pass

**Code Quality:**
- [ ] All functions have docblocks
- [ ] Error logging throughout
- [ ] Proper validation
- [ ] WP_Error returns on failures
- [ ] No PHP warnings/notices

---

**Reply with:**
- "All Task 4 tests passing ✅" (if all 18 pass), OR
- Paste any test failures so I can help fix them

Once tests pass, we'll commit Task 4 and move to Task 5! 🚀