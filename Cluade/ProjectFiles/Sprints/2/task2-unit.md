Great question! Let me check the workflow for testing requirements.Perfect! Based on the workflow, **YES - we should add unit tests for Task 2** before moving to Task 3. The workflow clearly states:

> **Layer 1: Unit Tests (PHPUnit)**  
> **When:** After implementing any function with logic  
> **Coverage Target:** 80% of core business logic

---

## 🧪 TASK 2: UNIT TESTS REQUIRED

For the Stripe configuration we just built, we need to test:

1. **Stripe Config Class** - Get API keys, mode detection, SDK initialization
2. **Settings Validation** - Key format validation, required field checks
3. **Settings Storage** - Save/retrieve from WordPress options

---

## 📝 UNIT TEST IMPLEMENTATION PROMPT

Copy this into **Cursor Composer**:

```
TASK: Create PHPUnit Unit Tests for Stripe Configuration (Task 2)

CONTEXT:
This is Sprint 2, Task 2 - Unit Testing. We need comprehensive PHPUnit tests for the Stripe SDK configuration and admin settings we just implemented.

CREATE NEW FILE: tests/test-stripe-config.php

TEST REQUIREMENTS:

1. TEST STRIPE CONFIG CLASS (includes/payment/class-stripe-config.php):

   a) Test Get Mode:
      - Test returns 'test' when test mode enabled
      - Test returns 'live' when test mode disabled
      - Test defaults to 'test' when no setting exists

   b) Test Get Publishable Key:
      - Test returns test key when in test mode
      - Test returns empty string when no key set
      - Test returns correct key after saving

   c) Test Get Secret Key:
      - Test returns test secret key when in test mode
      - Test returns empty string when no key set
      - Test handles missing option gracefully

   d) Test Get Webhook Secret:
      - Test returns webhook secret when set
      - Test returns empty string when not set

   e) Test SDK Initialization:
      - Test Stripe SDK initializes with correct API key
      - Test handles missing API key gracefully
      - Test sets correct API version

2. TEST SETTINGS VALIDATION:

   a) Test Key Format Validation:
      - Test accepts valid publishable key (pk_test_...)
      - Test accepts valid secret key (sk_test_...)
      - Test accepts valid webhook secret (whsec_...)
      - Test rejects invalid key formats
      - Test rejects empty keys when test mode enabled

   b) Test Required Fields:
      - Test validates all three keys required in test mode
      - Test allows empty keys when test mode disabled

3. TEST SETTINGS STORAGE:

   a) Test Save Settings:
      - Test settings saved to wp_options
      - Test settings persist after retrieval
      - Test sanitization applied correctly

   b) Test Retrieve Settings:
      - Test retrieves saved test mode setting
      - Test retrieves saved API keys
      - Test handles missing options (returns defaults)

4. TEST SECURITY:

   a) Test Capability Check:
      - Test only users with 'manage_options' can save
      - Test non-admin users cannot access settings

WORDPRESS TEST FRAMEWORK:
- Extend WP_UnitTestCase
- Use WordPress test functions
- Mock WordPress options API where needed
- Test both success and failure cases

MOCK DATA:
Use these test API keys:
- Publishable: 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz'
- Secret: 'sk_test_51234567890abcdefghijklmnopqrstuvwxyz'
- Webhook: 'whsec_1234567890abcdefghijklmnopqrstuvwxyz'

EDGE CASES TO TEST:
- Empty strings
- Null values
- Invalid key formats
- Missing WordPress options
- Stripe SDK not loaded

SUCCESS CRITERIA:
- All tests pass
- 80%+ code coverage of Stripe config class
- Tests run in isolation (can run in any order)
- Clear test names describing what's being tested
- Proper setup/teardown of test data

FILE LOCATION:
tests/test-stripe-config.php

Please generate complete PHPUnit tests following WordPress testing standards and best practices.
```

---

## 🏃 AFTER CURSOR GENERATES TESTS

### Step 1: Verify Test File Created

Check that this file exists:
- [ ] `tests/test-stripe-config.php`

### Step 2: Run the Tests

```bash
# Navigate to plugin directory
cd /path/to/wp-content/plugins/booking-system

# Run just the new test file
vendor/bin/phpunit tests/test-stripe-config.php

# Or run all tests
vendor/bin/phpunit
```

**Expected Output:**
```
PHPUnit 9.x.x

...............  15 / 15 (100%)

Time: 00:00.234, Memory: 12.00 MB

OK (15 tests, 30 assertions)
```

### Step 3: Check Test Coverage

The tests should cover:
- [ ] Get mode (test/live)
- [ ] Get API keys (all 3 types)
- [ ] Key format validation
- [ ] Required field validation
- [ ] Settings save/retrieve
- [ ] Edge cases (empty, null, invalid)

---

## 🐛 COMMON TEST FAILURES & FIXES

### Issue 1: Stripe SDK Not Loaded in Tests
```
Error: Class 'Stripe\Stripe' not found
```

**Fix:** Add to test file setUp():
```php
public function setUp(): void {
    parent::setUp();
    require_once dirname(__DIR__) . '/vendor/autoload.php';
}
```

### Issue 2: WordPress Options Not Mocking
```
Error: get_option() returns null
```

**Fix:** Use WordPress test factories:
```php
update_option('bookit_stripe_test_mode', 1);
update_option('bookit_stripe_test_publishable_key', 'pk_test_...');
```

### Issue 3: Class Not Found
```
Error: Class 'Booking_System_Stripe_Config' not found
```

**Fix:** Include the class in test file:
```php
require_once dirname(__DIR__) . '/includes/payment/class-stripe-config.php';
```

---

## ✅ TASK 2 TESTING ACCEPTANCE CRITERIA

Before marking Task 2 complete, verify:

**Unit Tests:**
- [ ] test-stripe-config.php file created
- [ ] At least 12-15 test methods
- [ ] All tests passing (green)
- [ ] Tests cover all critical functions
- [ ] Edge cases tested

**Test Quality:**
- [ ] Clear test method names (test_returns_test_mode_when_enabled)
- [ ] Proper setup/teardown
- [ ] Tests independent (can run in any order)
- [ ] Uses WordPress test assertions

**Code Coverage:**
- [ ] Stripe Config class >80% covered
- [ ] All public methods tested
- [ ] Validation logic tested

---

## 📊 REPORT TEST RESULTS

**Please provide:**

1. **PHPUnit Output:**
   ```
   Paste the test results here
   ```

2. **Number of Tests:** ___ tests created

3. **All Passing?** Yes/No

4. **Any Failures?** (Describe if any)

5. **Code Coverage:** ___% (if you ran with --coverage)

---

**Reply with:**
- "All Task 2 unit tests passing ✅" (if all tests pass), OR
- Paste any test failures so I can help fix them

Once tests are passing, we'll commit Task 2 completely and move to Task 3.