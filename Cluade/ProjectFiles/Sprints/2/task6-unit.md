# 🎯 PERFECT! TASKS 6 + 13 PLAN

Let's complete the basic payment options with idempotency improvements!

---

## 📋 EXECUTION PLAN

**Task 6:** Idempotency Keys (4 hours)  
**Task 13:** Pay on Arrival (4 hours)  
**Total:** 8 hours

---

## 🔵 TASK 6: IDEMPOTENCY KEYS (First)

**Goal:** Enhance idempotency beyond transients - make it production-grade

**What We'll Improve:**

### Current State (From Task 4):
- ✅ Webhook uses transients for idempotency
- ✅ 24-hour expiry
- ⚠️ Only in webhook handler
- ⚠️ Transients can be lost (cache flush, migration)

### Task 6 Enhancements:
1. **Database-backed idempotency table** (permanent record)
2. **Idempotency for Stripe Checkout creation** (prevent duplicate sessions)
3. **Idempotency for email sending** (prevent duplicate emails)
4. **Cleanup old records** (after 30 days)
5. **Handle race conditions** properly

---

## 📝 TASK 6 UNIT TESTS - CURSOR PROMPT

Copy this into **Cursor Composer**:

```
TASK: Create PHPUnit Unit Tests for Enhanced Idempotency (Task 6)

CONTEXT:
Sprint 2, Task 6 - Test-Driven Development. Enhance idempotency beyond transients with database-backed tracking. Create comprehensive tests BEFORE implementing the feature.

CREATE NEW FILE: tests/test-idempotency.php

TEST CLASS STRUCTURE:

```php
<?php
/**
 * Unit Tests for Idempotency Keys
 * Sprint 2, Task 6
 */

class Test_Idempotency extends WP_UnitTestCase {
    
    private $idempotency_handler;
    
    public function setUp(): void {
        parent::setUp();
        
        // Load class under test
        require_once dirname(__DIR__) . '/includes/core/class-idempotency-handler.php';
        
        // Initialize
        $this->idempotency_handler = new Booking_System_Idempotency_Handler();
        
        // Ensure idempotency table exists
        global $wpdb;
        $table_name = $wpdb->prefix . 'bookings_idempotency';
        
        // Create table if not exists
        $wpdb->query("CREATE TABLE IF NOT EXISTS $table_name (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            idempotency_key VARCHAR(255) NOT NULL UNIQUE,
            operation_type VARCHAR(50) NOT NULL,
            request_hash VARCHAR(64) NOT NULL,
            response_data TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'processing',
            created_at DATETIME NOT NULL,
            completed_at DATETIME NULL,
            expires_at DATETIME NOT NULL,
            INDEX idx_key (idempotency_key),
            INDEX idx_expires (expires_at)
        )");
    }
    
    public function tearDown(): void {
        global $wpdb;
        
        // Clean up test data
        $wpdb->query("DELETE FROM {$wpdb->prefix}bookings_idempotency WHERE id > 0");
        
        parent::tearDown();
    }
    
    // TEST METHODS BELOW
}
```

REQUIRED TEST METHODS (12 tests total):

### IDEMPOTENCY KEY GENERATION (2 tests)

1. test_generates_unique_idempotency_key()
   - Arrange: Call generate_key() twice
   - Act: Generate two keys
   - Assert: Keys are different (unique)
   - Assert: Keys are 32+ characters long

2. test_idempotency_key_format()
   - Arrange: Generate key
   - Act: Check format
   - Assert: Alphanumeric + dashes/underscores only
   - Assert: No special characters that break URLs

### OPERATION TRACKING (4 tests)

3. test_starts_operation_successfully()
   - Arrange: New operation with key
   - Act: Call start_operation('stripe_checkout', $key, $data)
   - Assert: Record created in database
   - Assert: Status = 'processing'
   - Assert: expires_at is 24 hours from now

4. test_prevents_duplicate_operation()
   - Arrange: Start operation with key 'test-key-123'
   - Act: Try to start same operation again with same key
   - Assert: Returns existing record (not WP_Error)
   - Assert: Does not create duplicate database row

5. test_completes_operation_successfully()
   - Arrange: Start operation
   - Act: Call complete_operation($key, $response_data)
   - Assert: Status changed to 'completed'
   - Assert: response_data stored
   - Assert: completed_at timestamp set

6. test_fails_operation_gracefully()
   - Arrange: Start operation
   - Act: Call fail_operation($key, $error_message)
   - Assert: Status = 'failed'
   - Assert: Error stored in response_data

### STRIPE CHECKOUT IDEMPOTENCY (2 tests)

7. test_prevents_duplicate_checkout_sessions()
   - Arrange: Session data (service, staff, customer)
   - Act: Create checkout session with key
   - Act: Try to create again with same key
   - Assert: Returns same session_id (not new one)
   - Assert: Only one Stripe session created

8. test_different_data_creates_new_session()
   - Arrange: Create session with data A
   - Act: Create session with same key but data B (different hash)
   - Assert: Returns WP_Error (data mismatch)

### EMAIL IDEMPOTENCY (2 tests)

9. test_prevents_duplicate_email_sends()
   - Arrange: Email data (to, subject, body)
   - Act: Send email with key
   - Act: Try to send again with same key
   - Assert: wp_mail only called once
   - Assert: Second attempt returns cached result

10. test_allows_retry_on_email_failure()
    - Arrange: Mock wp_mail to fail first time
    - Act: Send email (fails)
    - Act: Send email again with same key
    - Assert: Second attempt allowed (status was 'failed')

### CLEANUP & EXPIRY (2 tests)

11. test_cleans_up_expired_records()
    - Arrange: Create records with expires_at in past
    - Act: Call cleanup_expired()
    - Assert: Old records deleted
    - Assert: Recent records preserved

12. test_handles_concurrent_requests()
    - Arrange: Two operations with same key start simultaneously
    - Act: Simulate race condition (mock concurrent DB inserts)
    - Assert: Only one operation proceeds
    - Assert: Second gets existing record

EDGE CASES TO TEST:

- Empty idempotency key
- Null operation type
- Very long idempotency keys (255+ chars)
- Special characters in keys
- Missing request data
- Database connection failure
- Expired operations (should allow retry)

WORDPRESS TEST PATTERNS:

```php
// Test database record creation
$record = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}bookings_idempotency WHERE idempotency_key = %s",
    $key
));
$this->assertNotNull($record);
$this->assertEquals('processing', $record->status);

// Test operation completion
$this->idempotency_handler->start_operation('test_op', 'key-123', ['data' => 'value']);
$result = $this->idempotency_handler->complete_operation('key-123', ['result' => 'success']);
$this->assertTrue($result);

// Test duplicate prevention
$first = $this->idempotency_handler->start_operation('checkout', 'key-456', $data);
$second = $this->idempotency_handler->start_operation('checkout', 'key-456', $data);
$this->assertEquals($first['id'], $second['id']); // Same record
```

MOCK STRIPE API:

```php
// In setUp()
add_filter('bookit_stripe_api_mode', function() {
    return 'mock';
});
```

SUCCESS CRITERIA:
- All 12 test methods created
- Tests use Arrange-Act-Assert pattern
- Database table tested
- Duplicate prevention tested
- Expiry and cleanup tested
- Concurrent access tested
- Tests can run in isolation

FILE LOCATION:
tests/test-idempotency.php

Please generate complete PHPUnit tests following WordPress best practices.
```

---

## ⏸️ AFTER TESTS CREATED

### Step 1: Verify Test File

Check that this file exists:
- [ ] `tests/test-idempotency.php`

### Step 2: Run Tests (They Should FAIL)

```bash
vendor/bin/phpunit tests/test-idempotency.php
```

**Expected:** All tests fail because feature doesn't exist yet ✅

---

## 🎯 WHAT'S NEXT

Once tests are created:

1. I'll provide implementation prompt for Idempotency Handler class
2. I'll provide database migration for idempotency table
3. I'll provide integration into Stripe Checkout and Email Sender
4. We'll run tests and verify they pass
5. Then move to Task 13 (Pay on Arrival)

---

**Reply with:** "Task 6 tests created ✅ - ready for implementation"

Then I'll provide the implementation prompts! 🚀