Yes! Good catch. The session structure is different from what I assumed. Let me update the test prompt with the correct session data structure.

---

## 🧪 UPDATED UNIT TEST PROMPT FOR CURSOR

Copy this **corrected version** into **Cursor Composer**:

```
TASK: Create PHPUnit Unit Tests for Stripe Checkout Session (Task 3)

CONTEXT:
Sprint 2, Task 3 - Unit Testing FIRST (Test-Driven Development). Create comprehensive tests for Stripe Checkout Session creation before implementing the feature.

CREATE NEW FILE: tests/test-stripe-checkout.php

TEST CLASS STRUCTURE:

```php
class Test_Stripe_Checkout extends WP_UnitTestCase {
    
    private $stripe_checkout;
    private $test_session_data;
    
    public function setUp(): void {
        parent::setUp();
        
        // Load Stripe SDK
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        
        // Load class under test
        require_once dirname(__DIR__) . '/includes/payment/class-stripe-checkout.php';
        
        // Initialize class
        $this->stripe_checkout = new Booking_System_Stripe_Checkout();
        
        // Create test session data (CORRECT Sprint 1 structure)
        $this->test_session_data = [
            'current_step'              => 4,
            'service_id'                => 1,
            'staff_id'                  => 2,
            'date'                      => '2026-02-15',
            'time'                      => '14:00:00',
            'customer_first_name'       => 'John',
            'customer_last_name'        => 'Smith',
            'customer_email'            => 'john@example.com',
            'customer_phone'            => '07700900123',
            'customer_special_requests' => 'Test request',
            'marketing_consent'         => 1,
            'consent_date'              => '2026-02-01 12:00:00',
            'created_at'                => time(),
            'last_activity'             => time()
        ];
        
        // Create test service in database
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'bookings_services', [
            'id' => 1,
            'name' => 'Test Haircut',
            'duration_minutes' => 60,
            'base_price' => 50.00,
            'deposit_type' => 'percentage',
            'deposit_amount' => 50
        ]);
        
        // Create test staff member
        $wpdb->insert($wpdb->prefix . 'bookings_staff', [
            'id' => 2,
            'first_name' => 'Emma',
            'last_name' => 'Thompson',
            'email' => 'emma@salon.com'
        ]);
        
        // Set Stripe test keys
        update_option('bookit_stripe_test_mode', 1);
        update_option('bookit_stripe_test_secret_key', 'sk_test_51234567890abcdef');
        update_option('bookit_stripe_test_publishable_key', 'pk_test_51234567890abcdef');
    }
    
    public function tearDown(): void {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_services WHERE id = 1");
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_staff WHERE id = 2");
        
        delete_option('bookit_stripe_test_mode');
        delete_option('bookit_stripe_test_secret_key');
        delete_option('bookit_stripe_test_publishable_key');
        
        parent::tearDown();
    }
    
    // TEST METHODS BELOW
}
```

REQUIRED TEST METHODS (15 tests total):

1. test_creates_checkout_session_successfully()
   - Arrange: Valid session data, Stripe keys configured
   - Act: Call create_checkout_session($this->test_session_data)
   - Assert: Returns Stripe session ID (starts with 'cs_test_')

2. test_checkout_session_has_correct_amount()
   - Arrange: Service price £50, deposit 50%
   - Act: Create checkout session
   - Assert: Line item amount = 2500 (£25.00 in pence)

3. test_checkout_session_currency_is_gbp()
   - Assert: currency = 'gbp'

4. test_checkout_session_includes_service_name()
   - Assert: Line item name contains 'Test Haircut'

5. test_checkout_session_includes_staff_name()
   - Assert: Line item description contains 'Emma Thompson'

6. test_checkout_session_includes_date_time()
   - Assert: Description contains '15/02/2026' and time
   - NOTE: Use 'date' field (not 'booking_date')

7. test_checkout_session_has_success_url()
   - Assert: success_url contains '/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'

8. test_checkout_session_has_cancel_url()
   - Assert: cancel_url contains '/book?step=5&cancelled=1'

9. test_checkout_session_includes_customer_email()
   - Assert: customer_email = 'john@example.com'

10. test_metadata_includes_all_booking_data()
    - Assert: metadata contains service_id, staff_id
    - Assert: metadata contains 'date' (not 'booking_date')
    - Assert: metadata contains 'time' (not 'booking_time')
    - Assert: metadata contains customer_first_name, customer_last_name
    - Assert: metadata contains customer_email, customer_phone
    - Assert: metadata has booking_temp_id (UUID format)

11. test_payment_method_types_includes_card()
    - Assert: payment_method_types contains 'card'

12. test_mode_is_payment()
    - Assert: mode = 'payment' (not 'subscription')

13. test_rejects_missing_service_id()
    - Arrange: Session data without service_id
    - Act: Create checkout session
    - Assert: Returns WP_Error or throws exception

14. test_rejects_invalid_email()
    - Arrange: Session data with invalid email
    - Assert: Returns WP_Error with 'invalid_email' code

15. test_handles_missing_stripe_keys()
    - Arrange: Delete Stripe API keys
    - Act: Create checkout session
    - Assert: Returns WP_Error with 'missing_api_key' code

CRITICAL: SESSION DATA FIELD MAPPING

The implementation should map session fields correctly:
- session['date'] → metadata['booking_date'] (for database compatibility)
- session['time'] → metadata['booking_time'] (for database compatibility)
- session['service_id'] → metadata['service_id']
- session['staff_id'] → metadata['staff_id']
- session['customer_*'] → metadata['customer_*']

Tests should verify this mapping occurs correctly.

EDGE CASES TO TEST:

- Empty session data
- Negative deposit amount (should reject)
- Service not found in database
- Staff not found in database
- Missing required session fields (date, time, service_id, staff_id)
- Very long customer names (should truncate to 255 chars)
- Special characters in metadata (should escape properly)
- Zero-price service (should reject payment)
- Missing customer_email (required field)
- Missing customer_first_name or customer_last_name

WORDPRESS TESTING PATTERNS TO USE:

- Use direct $wpdb->insert() for custom tables (not WP posts)
- Use `$this->assertInstanceOf('WP_Error', $result)` for error testing
- Use `$this->assertStringStartsWith('cs_test_', $session_id)` for Stripe IDs
- Use `$this->assertEquals(2500, $amount)` for precise amount checks (pence)
- Use `$this->assertArrayHasKey('date', $metadata)` for metadata verification

ASSERTION SPECIFICS:

For successful session creation:
```php
$this->assertNotEmpty($session_id);
$this->assertStringStartsWith('cs_test_', $session_id);
$this->assertIsString($session_id);
```

For amount verification (deposit calculation):
```php
// Service price £50.00, deposit 50% = £25.00 = 2500 pence
$this->assertEquals(2500, $session->amount_total);
$this->assertEquals('gbp', $session->currency);
```

For metadata verification:
```php
$this->assertArrayHasKey('service_id', $session->metadata);
$this->assertEquals('1', $session->metadata['service_id']);
$this->assertArrayHasKey('booking_date', $session->metadata); // mapped from 'date'
$this->assertEquals('2026-02-15', $session->metadata['booking_date']);
$this->assertArrayHasKey('booking_time', $session->metadata); // mapped from 'time'
$this->assertEquals('14:00:00', $session->metadata['booking_time']);
```

For errors:
```php
$this->assertInstanceOf('WP_Error', $result);
$this->assertEquals('missing_service', $result->get_error_code());
$this->assertStringContainsString('Service not found', $result->get_error_message());
```

MOCK STRIPE API (Important):

Since we can't actually call Stripe API in tests, create a mock:

```php
// In setUp(), add:
add_filter('bookit_stripe_api_mode', function() {
    return 'mock'; // Prevents actual API calls
});

// Mock the Stripe Session creation
add_filter('bookit_mock_stripe_session', function($session_data) {
    // Calculate deposit amount
    global $wpdb;
    $service = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
            $session_data['service_id']
        )
    );
    
    $deposit = ($service->base_price * $service->deposit_amount) / 100;
    
    return (object) [
        'id' => 'cs_test_mock123456',
        'amount_total' => $deposit * 100, // Convert to pence
        'currency' => 'gbp',
        'customer_email' => $session_data['customer_email'],
        'metadata' => [
            'booking_temp_id' => wp_generate_uuid4(),
            'service_id' => $session_data['service_id'],
            'staff_id' => $session_data['staff_id'],
            'booking_date' => $session_data['date'],
            'booking_time' => $session_data['time'],
            'customer_first_name' => $session_data['customer_first_name'],
            'customer_last_name' => $session_data['customer_last_name'],
            'customer_email' => $session_data['customer_email'],
            'customer_phone' => $session_data['customer_phone']
        ],
        'success_url' => home_url('/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url' => home_url('/book?step=5&cancelled=1'),
        'payment_method_types' => ['card'],
        'mode' => 'payment'
    ];
});
```

SUCCESS CRITERIA:
- All 15 test methods created
- Tests use Arrange-Act-Assert pattern
- Each test has clear, descriptive name
- Tests cover success and failure cases
- Proper setup/teardown of test data
- Tests can run in isolation (any order)
- Mock prevents actual Stripe API calls
- Session field mapping tested ('date'/'time' → 'booking_date'/'booking_time')

FILE LOCATION:
tests/test-stripe-checkout.php

Please generate complete, well-documented PHPUnit tests following WordPress best practices and the enhanced testing patterns.
```

---

## 🎯 KEY CHANGES FROM ORIGINAL PROMPT

1. **Session field names corrected:**
   - `booking_date` → `date`
   - `booking_time` → `time`

2. **Additional session fields:**
   - `current_step`
   - `consent_date` (conditional)
   - `created_at` (timestamp)
   - `last_activity` (timestamp)

3. **Field mapping requirement:**
   - Tests must verify session `date`/`time` maps to metadata `booking_date`/`booking_time` for database compatibility

4. **More specific assertions:**
   - Verify the field name transformation happens correctly
   - Check that metadata uses database-compatible field names

---

**Reply with:** "Task 3 tests created ✅ - ready for implementation"

Once tests are created and failing as expected, I'll provide the implementation prompt.