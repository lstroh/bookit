```
Sprint 4A Progress: 8/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
✅ Task 8:  Customer Database + GDPR (16h)
⏭️ Task 9:  PHPUnit Tests (12h)  — NEXT
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 98 / 112
```

Task 9 is PHPUnit tests. Let me read what's already in place before writing the prompt.Good — I have a clear picture. Existing tests use private helper methods (`create_test_staff`, `login_as`, `create_test_booking`, `create_test_customer`, `create_test_service`) duplicated per test file. The new tests for Sprint 4A need to cover: Reports API, Customers API, status log, time-off blocking, and the `no_show` status fix. Let me write the prompt.

---

## Task 9 — Cursor Composer Prompt

```
You are implementing Task 9 of Sprint 4A for the Bookit Booking System WordPress plugin: PHPUnit Tests.

Read every file referenced below before writing any code.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/tests/unit/test-dashboard-bookings-api.php` — copy the EXACT helper methods: `create_test_staff()`, `create_test_service()`, `create_test_customer()`, `create_test_booking()`, `login_as()`. Use these verbatim in every new test file — do not rewrite them.
- `bookit-booking-system/tests/unit/test-settings-email-api.php` — copy the class structure and setUp/tearDown pattern
- `bookit-booking-system/tests/unit/test-profile-api.php` — copy the namespace constant and REST dispatch pattern
- `bookit-booking-system/phpunit.xml` — you must add all new test files here
- `bookit-booking-system/includes/api/class-reports-api.php` — understand all methods being tested
- `bookit-booking-system/includes/api/class-customers-api.php` — understand all methods being tested
- `bookit-booking-system/database/migrations/migration-add-status-log.php` — understand the status log table

### What already exists — do NOT duplicate:
- All existing test files — do not modify any of them
- Helper methods — copy them into each new test class, do not create a shared base class (follow existing pattern)

---

## TEST FILES TO CREATE

Create 4 new test files, all in `bookit-booking-system/tests/unit/`:

---

### File 1: `test-reports-api.php`

Class: `Test_Reports_API extends TestCase`
Namespace constant: `const NAMESPACE = 'bookit/v1';`

**setUp():** Load required classes, create 2 test staff members (one admin, one staff), create 2 test services, create 1 test customer. Store IDs as instance properties.

**tearDown():** Clean up all inserted rows from wp_bookings, wp_bookings_payments, wp_bookings_customers, wp_bookings_staff, wp_bookings_services. Use `$wpdb->delete()` with the test IDs.

**Tests to write:**

```
test_overview_endpoint_registered()
  Assert '/' . NAMESPACE . '/dashboard/reports/overview' exists in rest_get_server()->get_routes()

test_overview_requires_admin()
  Login as staff → GET /dashboard/reports/overview → assert 403

test_overview_returns_success_for_admin()
  Login as admin → GET /dashboard/reports/overview → assert 200, success=true
  Assert response has keys: data.this_week, data.this_month, data.all_time, data.revenue_trend

test_overview_this_week_counts_completed_bookings()
  Create a completed booking with booking_date = today for admin staff
  Login as admin → GET /dashboard/reports/overview
  Assert data.this_week.total_bookings >= 1

test_overview_excludes_cancelled_bookings_from_total()
  Create a cancelled booking with booking_date = today
  Login as admin → GET /dashboard/reports/overview
  Note the this_week.total_bookings value
  Create a completed booking → re-fetch → assert total_bookings increased by 1 but not for cancelled

test_overview_no_show_rate_uses_no_show_status()
  Create a booking with status = 'no_show' (underscore) for today
  Login as admin → GET /dashboard/reports/overview
  Assert data.this_week.no_show_rate > 0.0

test_revenue_endpoint_registered()
  Assert '/' . NAMESPACE . '/dashboard/reports/revenue' exists in routes

test_revenue_requires_admin()
  Login as staff → GET /dashboard/reports/revenue → assert 403

test_revenue_returns_correct_structure()
  Login as admin → GET /dashboard/reports/revenue
  Assert 200, success=true
  Assert response has: summary.total_revenue, summary.net_revenue, by_service, by_staff, by_payment_method, revenue_trend

test_analytics_endpoint_registered()
  Assert '/' . NAMESPACE . '/dashboard/reports/analytics' exists in routes

test_analytics_requires_admin()
  Login as staff → GET /dashboard/reports/analytics → assert 403

test_analytics_returns_correct_structure()
  Login as admin → GET /dashboard/reports/analytics
  Assert 200, success=true
  Assert response has: summary, by_day_of_week, by_hour, heatmap, lead_time, daily_trend
  Assert summary has: total_bookings, completion_rate, no_show_rate

test_staff_performance_endpoint_registered()
  Assert '/' . NAMESPACE . '/dashboard/reports/staff' exists in routes

test_staff_performance_requires_admin()
  Login as staff → GET /dashboard/reports/staff → assert 403

test_staff_performance_returns_all_active_staff()
  Login as admin → GET /dashboard/reports/staff
  Assert 200, success=true
  Assert response.staff is array
  Assert count(response.staff) >= 2 (from setUp staff)

test_staff_detail_requires_admin()
  Login as staff → GET /dashboard/reports/staff/{admin_id} → assert 403

test_staff_detail_returns_correct_structure()
  Login as admin → GET /dashboard/reports/staff/{admin_id}
  Assert 200, success=true
  Assert response.staff has: name, bookings, revenue, by_service, weekly_trend, time_off

test_staff_detail_returns_404_for_unknown_staff()
  Login as admin → GET /dashboard/reports/staff/99999 → assert 404
```

---

### File 2: `test-customers-api.php`

Class: `Test_Customers_API extends TestCase`

**setUp():** Create 1 admin staff, 1 staff member. Create 3 test customers with distinct emails. Store IDs.

**tearDown():** Clean up all test customers (including any anonymised ones by checking deleted_at IS NOT NULL), staff, bookings.

**Tests to write:**

```
test_customers_endpoint_registered()
  Assert GET /dashboard/customers exists in routes

test_customers_requires_admin()
  Login as staff → GET /dashboard/customers → assert 403

test_customers_returns_list()
  Login as admin → GET /dashboard/customers
  Assert 200, success=true
  Assert customers is array, count >= 3 (from setUp)
  Assert first customer has: id, full_name, email, total_bookings, total_spent, status

test_customers_search_by_email()
  Login as admin → GET /dashboard/customers?search={email of customer 1}
  Assert exactly 1 customer returned
  Assert that customer's email matches

test_customers_search_returns_empty_for_no_match()
  Login as admin → GET /dashboard/customers?search=zzznomatch@example.com
  Assert 200, customers array is empty

test_customers_pagination_works()
  Login as admin → GET /dashboard/customers?per_page=2&page=1
  Assert 200
  Assert count(customers) <= 2
  Assert pagination.per_page == 2

test_get_single_customer_returns_detail()
  Login as admin → GET /dashboard/customers/{customer_1_id}
  Assert 200, success=true
  Assert response has: id, full_name, email, total_bookings, bookings (array), payments (array)

test_get_single_customer_returns_404_for_unknown()
  Login as admin → GET /dashboard/customers/99999 → assert 404

test_update_customer_changes_data()
  Login as admin → PUT /dashboard/customers/{customer_1_id} with first_name='UpdatedName'
  Assert 200, success=true
  Query DB directly → assert first_name = 'UpdatedName'

test_update_customer_sets_marketing_consent_date()
  Login as admin → PUT /dashboard/customers/{customer_1_id} with marketing_consent=true
  Assert 200
  Query DB → assert marketing_consent = 1, marketing_consent_date IS NOT NULL

test_update_customer_clears_marketing_consent_date()
  First set consent to true, then:
  PUT /dashboard/customers/{customer_1_id} with marketing_consent=false
  Query DB → assert marketing_consent = 0, marketing_consent_date IS NULL

test_delete_customer_anonymises_data()
  Login as admin → DELETE /dashboard/customers/{customer_2_id}
  Assert 200, success=true
  Query DB → assert customer row has deleted_at IS NOT NULL
  Assert first_name = 'Deleted', last_name = 'Customer'
  Assert email contains 'deleted_' and '@deleted.invalid'

test_delete_customer_preserves_booking_records()
  Create a completed booking for customer_3
  Login as admin → DELETE /dashboard/customers/{customer_3_id}
  Assert 200
  Query wp_bookings → assert booking still exists (deleted_at IS NULL on booking)

test_delete_customer_blocks_if_upcoming_booking_exists()
  Create a confirmed booking for customer_1 with booking_date = CURDATE() + 7 days
  Login as admin → DELETE /dashboard/customers/{customer_1_id}
  Assert 409 status
  Assert error code = 'has_upcoming_bookings'
  Query DB → assert customer NOT anonymised (deleted_at IS NULL)

test_customers_endpoint_requires_admin_for_delete()
  Login as staff → DELETE /dashboard/customers/{customer_1_id} → assert 403
```

---

### File 3: `test-status-log.php`

Class: `Test_Status_Log extends TestCase`

Tests that status changes are written to `wp_bookings_status_log`.

**setUp():** Create admin staff, staff member, service, customer. Store IDs.

**Tests to write:**

```
test_status_log_table_exists()
  global $wpdb
  $result = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}bookings_status_log'")
  Assert $result equals $wpdb->prefix . 'bookings_status_log'

test_mark_complete_writes_status_log()
  Create confirmed booking for staff member
  Login as admin → POST /dashboard/bookings/{id}/complete
  Assert 200
  $log = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}bookings_status_log WHERE booking_id = {$booking_id}")
  Assert $log is not null
  Assert $log->old_status = 'confirmed'
  Assert $log->new_status = 'completed'
  Assert $log->changed_by_staff_id = admin_id

test_mark_no_show_writes_status_log_with_underscore_status()
  Create confirmed booking
  Login as admin → POST /dashboard/bookings/{id}/no-show
  Assert 200
  $log = $wpdb->get_row(...)
  Assert $log->new_status = 'no_show'  // underscore, not hyphen

test_update_booking_status_writes_status_log()
  Create confirmed booking
  Login as admin → PUT /dashboard/bookings/{id} with status='completed'
  $log = $wpdb->get_row(...)
  Assert $log is not null
  Assert $log->new_status = 'completed'

test_update_booking_without_status_change_does_not_write_log()
  Create confirmed booking
  Login as admin → PUT /dashboard/bookings/{id} with staff_notes='test note' (no status change)
  $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bookings_status_log WHERE booking_id = {$booking_id}")
  Assert $count = 0
```

---

### File 4: `test-time-off-api.php`

Class: `Test_Time_Off_API extends TestCase`

**setUp():** Create admin staff, staff member. Store IDs.

**Tests to write:**

```
test_my_availability_endpoint_registered()
  Assert GET /dashboard/my-availability exists in routes

test_create_time_off_block_succeeds()
  Login as staff → POST /dashboard/my-availability with:
    date_from = tomorrow (YYYY-MM-DD)
    date_to = tomorrow
    all_day = true
    reason = 'vacation'
  Assert 200, success=true
  Query DB → assert wp_bookings_staff_working_hours has row with staff_id=staff_id, is_working=0

test_create_time_off_rejects_past_dates()
  Login as staff → POST /dashboard/my-availability with date_from = '2020-01-01'
  Assert 400 status

test_staff_can_only_delete_own_blocks()
  Login as staff_1 → create a block → get the block id
  Login as staff_2 → DELETE /dashboard/my-availability/{block_id}
  Assert 403 status
  Query DB → assert block still exists

test_delete_own_block_succeeds()
  Login as staff → create block → get block id
  DELETE /dashboard/my-availability/{block_id}
  Assert 200
  Query DB → assert block no longer exists

test_get_availability_returns_only_own_blocks()
  Login as admin → create block for admin
  Login as staff → GET /dashboard/my-availability
  For each returned block, assert staff_id = staff_id (not admin's blocks)

test_conflict_detection_returns_409()
  Create a confirmed booking for staff member on a future date
  Login as staff → POST /dashboard/my-availability with:
    date_from = that booking's date
    date_to = that booking's date
    all_day = true
  Assert 409 status
  Assert response has conflict count > 0
```

---

## MODIFY `phpunit.xml`

Add all 4 new test files to the testsuite. Add these 4 lines after the last existing `<file>` entry and before `</testsuite>`:

```xml
<file>./tests/unit/test-reports-api.php</file>
<file>./tests/unit/test-customers-api.php</file>
<file>./tests/unit/test-status-log.php</file>
<file>./tests/unit/test-time-off-api.php</file>
```

---

## CODING STANDARDS

- All test classes extend `Yoast\PHPUnitPolyfills\TestCases\TestCase`
- All test method names start with `test_`
- Use `@covers ClassName::method_name` docblock on each test
- Helper methods (`create_test_staff`, `login_as`, etc.) must be `private` and copied verbatim from `test-dashboard-bookings-api.php`
- All DB cleanup in tearDown must use `$wpdb->delete()` — never raw SQL DELETE
- Use `wp_generate_password(6, false)` for unique email suffixes to prevent collisions between test runs
- Do not use `@dataProvider` — keep tests simple and explicit

---

## DELIVERABLES SUMMARY

1. NEW FILE: `tests/unit/test-reports-api.php`
2. NEW FILE: `tests/unit/test-customers-api.php`
3. NEW FILE: `tests/unit/test-status-log.php`
4. NEW FILE: `tests/unit/test-time-off-api.php`
5. MODIFIED: `phpunit.xml` — 4 new file entries added
```

---

## ✅ Task 9 Testing Checklist

Run the full test suite from the plugin root:
```bash
npm test
```

- [ ] All existing tests still pass (no regressions)
- [ ] `test-reports-api.php` — all tests pass
- [ ] `test-customers-api.php` — all tests pass
- [ ] `test-status-log.php` — all tests pass
- [ ] `test-time-off-api.php` — all tests pass
- [ ] Zero failures, zero errors in final output
- [ ] Note the total test count before and after — should increase by ~35-40 tests

---

Once all tests are green, commit with:
```
git commit -m "Sprint 4A, Task 9: PHPUnit tests for Reports API, Customers API, status log, time-off blocking"
```

Then report back and we'll do Task 10 — the final manual testing and polish pass.