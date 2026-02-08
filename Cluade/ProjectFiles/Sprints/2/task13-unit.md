# 🟢 TASK 13: PAY ON ARRIVAL

**Estimated Time:** 4 hours  
**Goal:** Allow customers to book without payment (pay at location)

---

## 🎯 TASK OVERVIEW

**What We're Building:**

Pay on Arrival is the simplest payment method:
- ✅ No payment processor required
- ✅ No webhooks needed
- ✅ Booking created immediately
- ✅ Status = 'pending_payment'
- ✅ Customer receives confirmation
- ✅ Business owner receives notification

**Customer Flow:**
```
Step 1-4: Complete booking details ✅
  ↓
Step 5: Select "Pay on Arrival"
  ↓
Click "Complete Booking"
  ↓
Booking created immediately (no payment)
  ↓
Redirect to confirmation page
  ↓
Emails sent (with "Pay on arrival" notice)
```

---

## 🧪 UNIT TESTS FIRST (TEST-DRIVEN DEVELOPMENT)

### CURSOR PROMPT: Create Pay on Arrival Tests

Copy this into **Cursor Composer**:

```
TASK: Create PHPUnit Unit Tests for Pay on Arrival (Task 13)

CONTEXT:
Sprint 2, Task 13 - Test-Driven Development. Create comprehensive unit tests for the Pay on Arrival payment option BEFORE implementing the feature.

CREATE NEW FILE: tests/test-pay-on-arrival.php

TEST CLASS STRUCTURE:

```php
<?php
/**
 * Unit Tests for Pay on Arrival
 * Sprint 2, Task 13
 */

class Test_Pay_On_Arrival extends WP_UnitTestCase {
    
    private $payment_processor;
    private $booking_creator;
    private $test_service_id;
    private $test_staff_id;
    
    public function setUp(): void {
        parent::setUp();
        
        // Load required classes
        require_once dirname(__DIR__) . '/includes/payment/class-payment-processor.php';
        require_once dirname(__DIR__) . '/includes/booking/class-booking-creator.php';
        
        // Initialize
        $this->payment_processor = new Booking_System_Payment_Processor();
        $this->booking_creator = new Booking_System_Booking_Creator();
        
        // Create test data
        global $wpdb;
        
        // Create test service
        $wpdb->insert($wpdb->prefix . 'bookings_services', [
            'name' => 'Test Massage',
            'duration' => 90,
            'price' => 75.00,
            'deposit_type' => 'percentage',
            'deposit_amount' => 50, // 50% deposit normally
            'is_active' => 1
        ]);
        $this->test_service_id = $wpdb->insert_id;
        
        // Create test staff
        $wpdb->insert($wpdb->prefix . 'bookings_staff', [
            'first_name' => 'Sarah',
            'last_name' => 'Johnson',
            'email' => 'sarah@salon.com'
        ]);
        $this->test_staff_id = $wpdb->insert_id;
        
        // Mock session data
        $_SESSION['bookit_wizard'] = [
            'service_id' => $this->test_service_id,
            'staff_id' => $this->test_staff_id,
            'date' => '2026-03-15',
            'time' => '10:00:00',
            'customer_first_name' => 'Jane',
            'customer_last_name' => 'Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '07700900456',
            'customer_special_requests' => 'First time client'
        ];
    }
    
    public function tearDown(): void {
        global $wpdb;
        
        // Clean up test data
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings WHERE service_id = {$this->test_service_id}");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_customers WHERE email = 'jane@example.com'");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_services WHERE id = {$this->test_service_id}");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_staff WHERE id = {$this->test_staff_id}");
        
        unset($_SESSION['bookit_wizard']);
        
        parent::tearDown();
    }
    
    // TEST METHODS BELOW
}
```

REQUIRED TEST METHODS (10 tests total):

### BOOKING CREATION TESTS (4 tests)

1. test_creates_booking_without_payment()
   - Arrange: Session with booking data, payment_method = 'pay_on_arrival'
   - Act: Process pay on arrival booking
   - Assert: Booking created in database
   - Assert: No payment processor called (no Stripe/PayPal)

2. test_booking_status_is_pending_payment()
   - Arrange: Create pay on arrival booking
   - Act: Check booking status
   - Assert: status = 'pending_payment' (NOT 'confirmed')

3. test_full_amount_marked_as_balance_due()
   - Arrange: Service costs £75.00
   - Act: Create pay on arrival booking
   - Assert: deposit_paid = 0.00
   - Assert: balance_due = 75.00
   - Assert: total_price = 75.00

4. test_payment_method_stored_correctly()
   - Arrange: Pay on arrival booking
   - Act: Check booking record
   - Assert: payment_method = 'pay_on_arrival'
   - Assert: payment_intent_id = NULL
   - Assert: stripe_session_id = NULL

### CUSTOMER CREATION TESTS (2 tests)

5. test_creates_customer_record()
   - Arrange: New customer (jane@example.com)
   - Act: Create pay on arrival booking
   - Assert: Customer created in wp_bookings_customers
   - Assert: first_name, last_name, email, phone stored

6. test_reuses_existing_customer()
   - Arrange: Customer already exists with same email
   - Act: Create another booking
   - Assert: Uses existing customer_id
   - Assert: No duplicate customer created

### VALIDATION TESTS (2 tests)

7. test_validates_required_fields()
   - Arrange: Session missing customer_email
   - Act: Try to create booking
   - Assert: Returns WP_Error with code 'missing_field'

8. test_prevents_double_booking()
   - Arrange: Staff already booked at same time
   - Act: Try to create conflicting booking
   - Assert: Returns WP_Error with code 'slot_unavailable'

### CONFIRMATION TESTS (2 tests)

9. test_redirects_to_confirmation_page()
   - Arrange: Successful pay on arrival booking
   - Act: Check response
   - Assert: Contains redirect URL to /booking-confirmed
   - Assert: URL includes booking_id parameter

10. test_clears_session_after_booking()
    - Arrange: Session has booking wizard data
    - Act: Complete pay on arrival booking
    - Assert: $_SESSION['bookit_wizard'] is cleared

EDGE CASES TO TEST:

- Empty payment method
- Invalid service_id
- Invalid staff_id
- Missing customer name
- Invalid email format
- Concurrent bookings (race condition)
- Session already expired
- Service not active

WORDPRESS TEST PATTERNS:

```php
// Test booking creation
global $wpdb;
$result = $this->payment_processor->process_pay_on_arrival($_SESSION['bookit_wizard']);
$this->assertIsArray($result);
$this->assertArrayHasKey('booking_id', $result);

$booking = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}bookings WHERE id = %d",
    $result['booking_id']
), ARRAY_A);

$this->assertNotNull($booking);
$this->assertEquals('pending_payment', $booking['status']);
$this->assertEquals(0.00, (float)$booking['deposit_paid']);
$this->assertEquals(75.00, (float)$booking['balance_due']);
```

MOCK EMAIL SENDING:

```php
// In setUp()
add_filter('bookit_send_email', '__return_false');
```

SUCCESS CRITERIA:
- All 10 test methods created
- Tests use Arrange-Act-Assert pattern
- Tests verify booking creation without payment
- Tests verify status = 'pending_payment'
- Tests verify balance_due = full price
- Tests verify customer creation/reuse
- Tests verify validation
- Tests can run in isolation

FILE LOCATION:
tests/test-pay-on-arrival.php

Please generate complete, well-documented PHPUnit tests following WordPress best practices.
```

---

## ⏸️ AFTER TESTS CREATED

### Step 1: Verify Test File

Check that this file exists:
- [ ] `tests/test-pay-on-arrival.php`

### Step 2: Run Tests (They Should FAIL)

```bash
vendor/bin/phpunit tests/test-pay-on-arrival.php
```

**Expected Output:**
```
PHPUnit 9.x.x

FFFFFFFFFF  0 / 10 (0%)

FAILURES!
Tests: 10, Assertions: 0, Errors: 10

Error: Call to undefined method ... process_pay_on_arrival()
```

**This is GOOD! ✅** The tests are ready and waiting for implementation.

---

## 🎯 WHAT'S NEXT

Once tests are created and failing:

1. I'll provide implementation prompt for Pay on Arrival handler
2. I'll provide updates to Payment Processor
3. I'll provide updates to Step 5 payment form
4. We'll run tests and verify they pass
5. We'll commit Task 13

---

**Reply with:** "Task 13 tests created ✅ - ready for implementation"

Then I'll provide the implementation prompts to make all tests pass! 🚀