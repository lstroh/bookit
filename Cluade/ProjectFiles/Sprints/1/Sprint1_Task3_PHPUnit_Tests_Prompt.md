# Sprint 1, Task 3: Staff Selection UI - PHPUnit Tests

## 🎯 OBJECTIVE
Create comprehensive PHPUnit tests for the Staff Selection UI (Task 3) that achieve 85%+ code coverage, follow WordPress testing standards, and use the actual database schema column names.

## 📋 CONTEXT

### What Was Built in Task 3
1. **Staff Model** (`includes/models/class-staff-model.php`)
   - `get_staff_for_service($service_id)` - Returns active staff offering a service
   - `get_lowest_staff_price_for_service($service_id)` - For "No Preference" pricing
   - `get_staff_by_id($staff_id)` - Single staff retrieval

2. **Staff API** (`includes/api/class-staff-api.php`)
   - `POST /wp-json/bookit/v1/staff/select` endpoint
   - Validates staff offers selected service
   - Saves staff_id to session (0 for "No Preference")
   - Advances wizard to step 3

3. **Staff Selection Template** (`public/templates/booking-step-2-staff.php`)
   - Staff cards with photos/initials
   - Custom pricing display
   - "No Preference" option

### Actual Database Schema (CRITICAL - Use These Column Names)

**wp_bookings_staff:**
- `id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`
- `photo_url` (VARCHAR 500, NULL)
- `bio` (TEXT, NULL)
- `title` (VARCHAR 100, NULL)
- `role` (ENUM: 'staff', 'admin')
- `google_calendar_id`
- `is_active` (TINYINT 0/1, NOT 'status' ENUM)
- `display_order`, `created_at`, `updated_at`, `deleted_at`

**wp_bookings_services:**
- `id`, `name`, `description`, `duration`
- `price` (NOT base_price - DECIMAL(10,2))
- `deposit_amount`, `deposit_type`, `buffer_before`, `buffer_after`
- `is_active` (TINYINT 0/1, NOT 'status' ENUM)
- `display_order`, `created_at`, `updated_at`, `deleted_at`

**wp_bookings_staff_services:**
- `id`, `staff_id`, `service_id`
- `custom_price` (DECIMAL(10,2) NULL - if NULL, use service.price)
- `created_at`

**wp_bookings_categories:**
- `id`, `name`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`

**wp_bookings_service_categories:**
- `id`, `service_id`, `category_id`, `created_at`

### Existing Test Standards (from Tasks 1-2)
- Test class naming: `Test_ClassName` (underscores, not CamelCase)
- Base class: `WP_UnitTestCase`
- Method naming: `test_descriptive_name()`
- Helper methods for creating test data
- Clean up in `tearDown()` method
- 85%+ coverage target

## 🔨 IMPLEMENTATION REQUIREMENTS

### Files to Create

1. **tests/unit/test-staff-model.php**
   - Test all Staff_Model methods
   - Test custom pricing logic (COALESCE(custom_price, price))
   - Test alphabetical sorting by first_name
   - Test active/inactive filtering (is_active = 1)

2. **tests/unit/test-staff-api.php**
   - Test POST /wp-json/bookit/v1/staff/select endpoint
   - Test staff validation (staff must offer selected service)
   - Test session saving (staff_id storage)
   - Test "No Preference" handling (staff_id = 0)
   - Test error responses

### Test Coverage Requirements

**Staff Model Tests (test-staff-model.php):**
```php
class Test_Staff_Model extends WP_UnitTestCase {
    
    // Test Scenarios:
    // 1. get_staff_for_service() returns only active staff
    // 2. get_staff_for_service() returns only staff offering service
    // 3. get_staff_for_service() sorts alphabetically by first_name
    // 4. get_staff_for_service() uses custom_price when present
    // 5. get_staff_for_service() falls back to service.price when custom_price is NULL
    // 6. get_staff_for_service() returns empty array when no staff available
    // 7. get_lowest_staff_price_for_service() returns lowest price
    // 8. get_lowest_staff_price_for_service() considers both custom and base prices
    // 9. get_staff_by_id() returns staff with correct fields
    // 10. Inactive staff (is_active = 0) excluded from results
}
```

**Staff API Tests (test-staff-api.php):**
```php
class Test_Staff_API extends WP_UnitTestCase {
    
    // Test Scenarios:
    // 1. POST with valid staff_id saves to session
    // 2. POST with staff_id = 0 saves "No Preference"
    // 3. POST rejects staff_id not offering selected service
    // 4. POST rejects inactive staff (is_active = 0)
    // 5. POST rejects missing staff_id
    // 6. POST rejects invalid staff_id (non-existent)
    // 7. Session advance to step 3 after successful selection
    // 8. Error responses have correct HTTP status codes
    // 9. Error responses have descriptive messages
}
```

### Helper Methods to Include

```php
/**
 * Create test staff member
 * 
 * @param array $args Override defaults
 * @return int Staff ID
 */
protected function create_test_staff($args = []) {
    global $wpdb;
    
    $defaults = [
        'email' => 'test-' . wp_generate_password(6, false) . '@example.com',
        'password_hash' => wp_hash_password('password123'),
        'first_name' => 'Test',
        'last_name' => 'Staff',
        'phone' => '07700900000',
        'photo_url' => null,
        'bio' => 'Test bio',
        'title' => 'Senior Therapist',
        'role' => 'staff',
        'google_calendar_id' => null,
        'is_active' => 1,  // CRITICAL: Use is_active, not status
        'display_order' => 0,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
        'deleted_at' => null
    ];
    
    $data = wp_parse_args($args, $defaults);
    
    $wpdb->insert($wpdb->prefix . 'bookings_staff', $data);
    return $wpdb->insert_id;
}

/**
 * Create test service
 * 
 * @param array $args Override defaults
 * @return int Service ID
 */
protected function create_test_service($args = []) {
    global $wpdb;
    
    $defaults = [
        'name' => 'Test Service ' . wp_generate_password(4, false),
        'description' => 'Test service description',
        'duration' => 60,
        'price' => 50.00,  // CRITICAL: Use price, not base_price
        'deposit_amount' => 10.00,
        'deposit_type' => 'fixed',
        'buffer_before' => 0,
        'buffer_after' => 0,
        'is_active' => 1,  // CRITICAL: Use is_active, not status
        'display_order' => 0,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
        'deleted_at' => null
    ];
    
    $data = wp_parse_args($args, $defaults);
    
    $wpdb->insert($wpdb->prefix . 'bookings_services', $data);
    return $wpdb->insert_id;
}

/**
 * Link staff to service with optional custom price
 * 
 * @param int $staff_id
 * @param int $service_id
 * @param float|null $custom_price Custom price or NULL to use service.price
 */
protected function link_staff_to_service($staff_id, $service_id, $custom_price = null) {
    global $wpdb;
    
    $wpdb->insert(
        $wpdb->prefix . 'bookings_staff_services',
        [
            'staff_id' => $staff_id,
            'service_id' => $service_id,
            'custom_price' => $custom_price,  // Can be NULL
            'created_at' => current_time('mysql')
        ],
        ['%d', '%d', $custom_price === null ? '%s' : '%f', '%s']
    );
}

/**
 * Create test session with service selected
 * 
 * @param int $service_id
 * @return string Session ID
 */
protected function create_test_session_with_service($service_id) {
    global $wpdb;
    
    $session_id = 'test_' . wp_generate_password(16, false);
    
    $wpdb->insert(
        $wpdb->prefix . 'bookings_sessions',
        [
            'session_id' => $session_id,
            'current_step' => 2,  // Staff selection step
            'service_id' => $service_id,
            'staff_id' => null,
            'booking_date' => null,
            'booking_time' => null,
            'customer_data' => null,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]
    );
    
    return $session_id;
}
```

### Edge Cases to Test

1. **No staff available for service**
   - Service exists but no staff linked
   - Should return empty array

2. **All staff inactive**
   - Staff linked to service but is_active = 0
   - Should return empty array

3. **Mixed pricing scenarios**
   - Staff A: custom_price = NULL (uses service.price)
   - Staff B: custom_price = 60.00 (overrides service.price of 50.00)
   - Staff C: custom_price = 40.00 (cheaper than service.price)
   - Verify correct prices returned

4. **"No Preference" selection**
   - staff_id = 0 should be stored
   - Should not validate against actual staff
   - Should advance to step 3

5. **Alphabetical sorting**
   - Staff: Charlie, Alice, Bob
   - Should return: Alice, Bob, Charlie (by first_name)

6. **Soft deletes**
   - Staff with deleted_at NOT NULL excluded
   - Services with deleted_at NOT NULL excluded

## ✅ ACCEPTANCE CRITERIA

- [ ] All tests follow WordPress coding standards
- [ ] Test class uses `WP_UnitTestCase` as base
- [ ] All test methods start with `test_`
- [ ] Helper methods use actual schema column names (is_active, price, custom_price)
- [ ] `tearDown()` method cleans up test data
- [ ] Tests cover both success and failure scenarios
- [ ] Edge cases have dedicated test methods
- [ ] All tests pass when run: `npm test tests/unit/test-staff-model.php`
- [ ] All tests pass when run: `npm test tests/unit/test-staff-api.php`
- [ ] Code coverage ≥85% for Staff_Model class
- [ ] Code coverage ≥85% for Staff_API class

## 🧪 TESTING CHECKLIST

### After Implementation

**Run Tests:**
```bash
# Start wp-env if not running
npm run wp-env:start

# Run staff model tests
npm test tests/unit/test-staff-model.php

# Run staff API tests
npm test tests/unit/test-staff-api.php

# Run all Task 3 tests together
npm test tests/unit/test-staff-*

# Verify all existing tests still pass
npm test
```

**Expected Output:**
```
PHPUnit 9.5.x by Sebastian Bergmann

Test_Staff_Model
 ✓ get staff for service returns only active staff
 ✓ get staff for service returns only staff offering service
 ✓ get staff for service sorts alphabetically by first name
 ✓ get staff for service uses custom price when present
 ✓ get staff for service falls back to service price
 ✓ get staff for service returns empty array when no staff
 ✓ get lowest staff price for service returns minimum
 ✓ get lowest staff price considers custom and base prices
 ✓ get staff by id returns correct data
 ✓ inactive staff excluded from results

Test_Staff_API
 ✓ post with valid staff id saves to session
 ✓ post with staff id zero saves no preference
 ✓ post rejects staff not offering service
 ✓ post rejects inactive staff
 ✓ post rejects missing staff id
 ✓ post rejects invalid staff id
 ✓ session advances to step three after selection
 ✓ error responses have correct status codes
 ✓ error responses have descriptive messages

Time: 00:01.234, Memory: 32.00 MB

OK (19 tests, 45 assertions)
```

### Manual Verification

**Check Test Data Cleanup:**
```sql
-- After tests, these should all be empty
SELECT * FROM wp_bookings_staff WHERE email LIKE 'test-%';
SELECT * FROM wp_bookings_services WHERE name LIKE 'Test Service %';
SELECT * FROM wp_bookings_staff_services WHERE staff_id IN (SELECT id FROM wp_bookings_staff WHERE email LIKE 'test-%');
```

## 📦 DELIVERABLES

1. **tests/unit/test-staff-model.php** - 10+ test methods
2. **tests/unit/test-staff-api.php** - 9+ test methods
3. All tests passing (19+ total assertions)
4. Helper methods for test data creation
5. Proper tearDown() cleanup

## 🚨 CRITICAL REMINDERS

1. **Use Actual Column Names:**
   - ✅ `is_active` (TINYINT 0/1)
   - ❌ NOT `status` (this doesn't exist)
   - ✅ `price` (service base price)
   - ❌ NOT `base_price` (this doesn't exist)
   - ✅ `custom_price` (staff-specific override)

2. **Test Data Must Match Schema:**
   - All required fields populated
   - Correct data types (DECIMAL for prices, TINYINT for is_active)
   - NULL where appropriate (photo_url, bio, custom_price)

3. **Session Testing:**
   - Session table must exist (created in Task 1)
   - Use actual session structure from schema

4. **WordPress Testing Standards:**
   - Don't use camelCase for test class names
   - Always extend WP_UnitTestCase
   - Use $this->assertEquals(), not PHPUnit's native assertions

## 🎯 SUCCESS METRICS

- **Tests Written:** 19+ test methods
- **Assertions:** 45+ assertions
- **Coverage:** ≥85% for both classes
- **Pass Rate:** 100% (all tests green)
- **Execution Time:** <2 seconds for all Task 3 tests

## 📝 GIT COMMIT MESSAGE TEMPLATE

```
Sprint 1, Task 3: PHPUnit tests for staff selection UI

- Created Test_Staff_Model with 10 test methods
- Created Test_Staff_API with 9 test methods
- Added helper methods for test data creation
- Tests use actual schema (is_active, price, custom_price)
- All edge cases covered (no staff, inactive, custom pricing)
- Proper tearDown() cleanup implemented

Tests: 19/19 passing, 45+ assertions
Coverage: Staff_Model 87%, Staff_API 89%
Execution time: 1.8s
```

---

## 🚀 READY TO IMPLEMENT

Paste this prompt into Cursor Composer and run:
1. Review the actual class implementations (Staff_Model, Staff_API)
2. Create both test files following WordPress standards
3. Implement all test methods with helper functions
4. Run tests and verify 100% pass rate
5. Check coverage is ≥85%
6. Commit with template message

**Estimated Time:** 3-4 hours
**Complexity:** Medium (standard unit testing with WordPress helpers)
