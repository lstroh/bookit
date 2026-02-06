# 🟣 TASK 4: STRIPE WEBHOOK ENDPOINT

**Estimated Time:** 12 hours  
**Week:** 2 of 5  
**Status:** READY TO BEGIN

---

## 🎯 TASK OVERVIEW

**Goal:** Create a webhook endpoint that receives payment confirmation from Stripe and creates bookings in the database.

**What is a Webhook?**
After a customer pays on Stripe's checkout page, Stripe sends a POST request to your server with payment details. This is called a "webhook". Your endpoint receives this, verifies it's really from Stripe, and creates the booking.

**Flow:**
```
Customer pays on Stripe
  ↓
Stripe sends webhook → /wp-json/bookit/v1/stripe/webhook
  ↓
Verify webhook signature (security)
  ↓
Extract payment metadata
  ↓
Create customer record (if new)
  ↓
Create booking record
  ↓
Return 200 OK to Stripe
```

---

## 📋 WHAT WE'LL BUILD

### Files to Create:
1. `includes/api/class-stripe-webhook.php` - Webhook handler
2. `includes/booking/class-booking-creator.php` - Creates bookings from payment data
3. `tests/test-stripe-webhook.php` - Unit tests (we'll do this FIRST)

### Key Features:
- REST API endpoint registration
- Stripe signature verification
- Event handling (`checkout.session.completed`)
- Customer creation/lookup
- Booking creation with transactions
- Idempotency (prevent duplicate bookings from retry)
- Error logging

---

## 🧪 UNIT TESTS FIRST (TEST-DRIVEN DEVELOPMENT)

Following our enhanced workflow, let's create the tests before implementing the feature.

---

## 📝 TASK 4 UNIT TESTS - CURSOR PROMPT

Copy this into **Cursor Composer**:

```
TASK: Create PHPUnit Unit Tests for Stripe Webhook Handler (Task 4)

CONTEXT:
Sprint 2, Task 4 - Test-Driven Development. Create comprehensive unit tests for Stripe webhook handling BEFORE implementing the feature. The webhook receives payment confirmation from Stripe and creates bookings in the database.

CREATE NEW FILE: tests/test-stripe-webhook.php

TEST CLASS STRUCTURE:

```php
<?php
/**
 * Unit Tests for Stripe Webhook Handler
 * Sprint 2, Task 4
 */

class Test_Stripe_Webhook extends WP_UnitTestCase {
    
    private $webhook_handler;
    private $test_webhook_payload;
    private $test_signature;
    
    public function setUp(): void {
        parent::setUp();
        
        // Load required classes
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        require_once dirname(__DIR__) . '/includes/payment/class-stripe-config.php';
        require_once dirname(__DIR__) . '/includes/api/class-stripe-webhook.php';
        require_once dirname(__DIR__) . '/includes/booking/class-booking-creator.php';
        
        // Initialize webhook handler
        $this->webhook_handler = new Booking_System_Stripe_Webhook();
        
        // Set up test webhook secret
        update_option('bookit_stripe_test_mode', 1);
        update_option('bookit_stripe_webhook_secret', 'whsec_test123456789');
        
        // Create test service
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'bookings_services', [
            'id' => 1,
            'name' => 'Test Haircut',
            'duration' => 60,
            'price' => 50.00,
            'deposit_type' => 'percentage',
            'deposit_amount' => 100
        ]);
        
        // Create test staff
        $wpdb->insert($wpdb->prefix . 'bookings_staff', [
            'id' => 2,
            'first_name' => 'Emma',
            'last_name' => 'Thompson',
            'email' => 'emma@salon.com'
        ]);
        
        // Build test webhook payload (Stripe checkout.session.completed event)
        $this->test_webhook_payload = [
            'id' => 'evt_test123',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_session123',
                    'payment_intent' => 'pi_test_intent123',
                    'amount_total' => 5000, // £50.00 in pence
                    'currency' => 'gbp',
                    'customer_email' => 'john@example.com',
                    'payment_status' => 'paid',
                    'metadata' => [
                        'booking_temp_id' => 'temp-uuid-12345',
                        'service_id' => '1',
                        'staff_id' => '2',
                        'booking_date' => '2026-02-15',
                        'booking_time' => '14:00:00',
                        'customer_first_name' => 'John',
                        'customer_last_name' => 'Smith',
                        'customer_email' => 'john@example.com',
                        'customer_phone' => '07700900123'
                    ]
                ]
            ]
        ];
    }
    
    public function tearDown(): void {
        global $wpdb;
        
        // Clean up test data
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings WHERE id > 0");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_customers WHERE id > 0");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_services WHERE id = 1");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_staff WHERE id = 2");
        
        delete_option('bookit_stripe_test_mode');
        delete_option('bookit_stripe_webhook_secret');
        
        parent::tearDown();
    }
    
    // TEST METHODS BELOW
}
```

REQUIRED TEST METHODS (18 tests total):

### WEBHOOK ENDPOINT TESTS (5 tests)

1. test_webhook_endpoint_registered()
   - Arrange: WordPress REST API loaded
   - Act: Check if route exists
   - Assert: Route '/bookit/v1/stripe/webhook' is registered

2. test_webhook_accepts_post_requests()
   - Arrange: Valid webhook payload
   - Act: Send POST request to endpoint
   - Assert: Returns 200 status (or appropriate response)

3. test_webhook_rejects_get_requests()
   - Arrange: Try GET request to webhook endpoint
   - Act: Send GET request
   - Assert: Returns 405 Method Not Allowed or similar error

4. test_webhook_requires_stripe_signature()
   - Arrange: Webhook payload without signature header
   - Act: Send request without 'Stripe-Signature' header
   - Assert: Returns 400 Bad Request with error 'missing_signature'

5. test_webhook_rejects_invalid_signature()
   - Arrange: Webhook payload with invalid/wrong signature
   - Act: Send request with bad signature
   - Assert: Returns 400 Bad Request with error 'invalid_signature'

### EVENT HANDLING TESTS (4 tests)

6. test_handles_checkout_session_completed()
   - Arrange: Valid 'checkout.session.completed' event
   - Act: Process webhook
   - Assert: Returns 200 OK, booking created

7. test_ignores_other_event_types()
   - Arrange: Different event type (e.g., 'payment_intent.succeeded')
   - Act: Process webhook
   - Assert: Returns 200 OK but no booking created (event ignored)

8. test_handles_unpaid_checkout_session()
   - Arrange: checkout.session.completed but payment_status != 'paid'
   - Act: Process webhook
   - Assert: No booking created, logs warning

9. test_logs_unknown_event_types()
   - Arrange: Unknown/new event type
   - Act: Process webhook
   - Assert: Returns 200 OK, logs event type

### CUSTOMER CREATION TESTS (3 tests)

10. test_creates_new_customer()
    - Arrange: Webhook with new customer email
    - Act: Process webhook
    - Assert: New customer record created in wp_bookings_customers

11. test_uses_existing_customer()
    - Arrange: Customer already exists with same email
    - Act: Process webhook with same email
    - Assert: Uses existing customer_id, doesn't create duplicate

12. test_customer_has_correct_data()
    - Arrange: Webhook with customer details
    - Act: Process webhook, retrieve customer
    - Assert: first_name, last_name, email, phone match metadata

### BOOKING CREATION TESTS (4 tests)

13. test_creates_booking_with_correct_data()
    - Arrange: Valid webhook payload
    - Act: Process webhook
    - Assert: Booking created with:
      - customer_id set correctly
      - service_id = 1
      - staff_id = 2
      - booking_date = '2026-02-15'
      - start_time = '14:00:00'
      - end_time calculated from service duration
      - status = 'confirmed'
      - total_price = 50.00
      - deposit_paid = 50.00
      - payment_method = 'stripe'
      - payment_intent_id = 'pi_test_intent123'

14. test_calculates_end_time_from_duration()
    - Arrange: Service with 60 minute duration, start_time 14:00
    - Act: Process webhook
    - Assert: end_time = '15:00:00' (14:00 + 60 mins)

15. test_stores_payment_intent_id()
    - Arrange: Webhook with payment_intent
    - Act: Process webhook
    - Assert: Booking has payment_intent_id stored

16. test_booking_status_is_confirmed()
    - Arrange: Successful payment webhook
    - Act: Process webhook
    - Assert: Booking status = 'confirmed' (not 'pending_payment')

### IDEMPOTENCY TESTS (2 tests)

17. test_duplicate_webhook_doesnt_create_duplicate_booking()
    - Arrange: Process same webhook twice (Stripe retries)
    - Act: Process webhook, then process again with same session_id
    - Assert: Only one booking created, second returns 200 OK

18. test_idempotency_key_stored()
    - Arrange: Process webhook
    - Act: Check transient/option storage
    - Assert: Idempotency key 'stripe_cs_test_session123' exists with 24h expiry

EDGE CASES TO TEST:

- Missing metadata fields (service_id, staff_id, etc.)
- Invalid service_id (service doesn't exist)
- Invalid staff_id (staff doesn't exist)
- Invalid date format
- Invalid time format
- Missing customer email
- Empty customer name fields
- Very long customer names (should truncate)
- Special characters in metadata
- Null payment_intent
- Amount mismatch (paid amount != service price)

WORDPRESS TEST PATTERNS:

```php
// Check REST route exists
$routes = rest_get_server()->get_routes();
$this->assertArrayHasKey('/bookit/v1/stripe/webhook', $routes);

// Simulate REST request
$request = new WP_REST_Request('POST', '/bookit/v1/stripe/webhook');
$request->set_header('Stripe-Signature', 'test_signature');
$request->set_body(json_encode($webhook_payload));
$response = rest_do_request($request);
$this->assertEquals(200, $response->get_status());

// Check database records
$booking = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}bookings ORDER BY id DESC LIMIT 1");
$this->assertNotNull($booking);
$this->assertEquals('confirmed', $booking->status);

// Check customer created
$customer = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}bookings_customers WHERE email = %s",
    'john@example.com'
));
$this->assertNotNull($customer);
```

ASSERTION SPECIFICS:

For successful webhook processing:
```php
$this->assertEquals(200, $response->get_status());
$this->assertNotEmpty($booking->id);
$this->assertEquals('confirmed', $booking->status);
$this->assertEquals('stripe', $booking->payment_method);
```

For customer data:
```php
$this->assertEquals('John', $customer->first_name);
$this->assertEquals('Smith', $customer->last_name);
$this->assertEquals('john@example.com', $customer->email);
$this->assertEquals('07700900123', $customer->phone);
```

For booking times:
```php
$this->assertEquals('2026-02-15', $booking->booking_date);
$this->assertEquals('14:00:00', $booking->start_time);
$this->assertEquals('15:00:00', $booking->end_time); // 60 min duration
```

For idempotency:
```php
$idempotency_key = get_transient('stripe_webhook_cs_test_session123');
$this->assertNotFalse($idempotency_key);
```

MOCK STRIPE SIGNATURE VERIFICATION:

Since we can't actually verify Stripe signatures in tests, add a filter:

```php
// In setUp()
add_filter('bookit_verify_stripe_signature', function($valid, $payload, $signature) {
    // In test mode, accept any signature that's not empty
    return !empty($signature);
}, 10, 3);
```

SUCCESS CRITERIA:
- All 18 test methods created
- Tests use Arrange-Act-Assert pattern
- Tests cover success and failure cases
- Tests verify database records created correctly
- Tests verify idempotency works
- Tests can run in isolation
- Mock prevents actual Stripe API calls

FILE LOCATION:
tests/test-stripe-webhook.php

Please generate complete, well-documented PHPUnit tests following WordPress best practices and the enhanced testing patterns.
```

---

## ⏸️ AFTER TESTS CREATED

### Step 1: Verify Test File

Check that this file exists:
- [ ] `tests/test-stripe-webhook.php`

### Step 2: Run Tests (They Should FAIL)

This is **Test-Driven Development** - tests should fail because the feature doesn't exist yet.

```bash
vendor/bin/phpunit tests/test-stripe-webhook.php
```

**Expected Output:**
```
PHPUnit 9.x.x

FFFFFFFFFFFFFFFFFF  0 / 18 (0%)

FAILURES!
Tests: 18, Assertions: 0, Errors: 18

Error: Class 'Booking_System_Stripe_Webhook' not found
```

**This is GOOD! ✅** The tests are ready and waiting for implementation.

---

## 🎯 WHAT'S NEXT

Once tests are created and failing:

1. I'll provide implementation prompt for webhook handler
2. I'll provide implementation prompt for booking creator
3. We'll run tests and verify they pass
4. We'll commit Task 4

---

**Reply with:** "Task 4 tests created ✅ - ready for implementation"

Then I'll provide the implementation prompts to make all tests pass!