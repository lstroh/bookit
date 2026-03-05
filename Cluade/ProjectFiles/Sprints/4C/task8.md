Let me check the current test count before writing the Task 8 prompt.Good — last recorded count was **485 tests** at end of Sprint 4B. Sprint 4C has added tests across Tasks 2, 4, 5, 6, and 7. Here's Task 8:

---

## Task 8 Cursor Prompt — PHPUnit Coverage Check & Gap Fill

```
# TASK 8: PHPUnit Tests — Sprint 4C Coverage Check & Gap Fill
# Sprint 4C | Bookit Booking System
# Estimated: 4 hours

## CONTEXT

Sprint 4B ended with 485 PHPUnit tests, 0 failures.

Sprint 4C has added tests incrementally across tasks:
- Task 2 (Setup Guide API): test-setup-guide-api.php
- Task 4 (Cancellation Policy): test-cancellation-policy-settings.php
- Task 5 (14-day waiver): test-cooling-off-waiver.php
- Task 6 (Payment Settings): test-payment-settings.php
- Task 7 (Deposit Settings): test-deposit-settings.php

This task has two goals:
1. Run the full suite and confirm all tests pass
2. Identify and fill any coverage gaps for Sprint 4C features
   that don't yet have tests

---

## MANDATORY: READ THESE FILES FIRST

1. bookit-booking-system/phpunit.xml
   — Confirm all Sprint 4C test files are registered. Add any
     that are missing from the <testsuite> block.

2. tests/unit/test-setup-guide-api.php
3. tests/unit/test-cancellation-policy-settings.php
4. tests/unit/test-cooling-off-waiver.php
5. tests/unit/test-payment-settings.php
6. tests/unit/test-deposit-settings.php
   — Read each file in full. Note which files exist, how many
     tests each has, and whether any obvious cases are missing.

7. includes/api/class-setup-guide-api.php
8. includes/api/class-team-calendar-api.php
   — Skim both. Check if test-team-calendar-api.php exists in
     tests/unit/. If not, it needs to be created (see below).

9. public/templates/booking-step-5-payment.php
   — The bookit_booking_requires_waiver() function from Fix 5A
     and the deposit calculation logic. Confirm these are covered
     by existing tests or need new ones.

Do not write any code before reading all nine files.

---

## STEP 1: Run the full suite first

Run:  npm test

Document the output:
- Total test count
- Total assertions
- Any failures or errors
- Any skipped tests

If there are failures: fix them before proceeding to Step 2.
Do NOT add new tests while failures exist — fix first.

---

## STEP 2: Audit coverage gaps

Check each Sprint 4C feature against its test file:

### Team Calendar API
Check if tests/unit/test-team-calendar-api.php exists and is
registered in phpunit.xml.

If missing or thin, add tests covering:
- test_day_view_returns_correct_date_range
  GET ?view_type=day&date=2026-03-15 as admin →
  assert date_start = date_end = '2026-03-15',
  assert bookings array present

- test_week_view_returns_monday_to_sunday
  GET ?view_type=week&date=2026-03-18 (a Wednesday) as admin →
  assert date_start is the Monday of that week,
  assert date_end is the Sunday,
  assert 7 days in response

- test_month_view_returns_full_month
  GET ?view_type=month&date=2026-03-15 as admin →
  assert date_start = '2026-03-01',
  assert date_end = '2026-03-31',
  assert 31 entries in days array

- test_invalid_view_type_returns_400
  GET ?view_type=invalid → assert 400 response

- test_staff_filter_works
  GET ?view_type=day&date=2026-03-15&staff_id=999 (nonexistent) →
  assert 200, bookings array empty

- test_requires_admin_permission
  Login as staff → GET team-calendar → assert 403

### Setup Guide API
Confirm test-setup-guide-api.php covers:
- Default state returned on first GET
- POST complete → status becomes 'completed'
- POST dismiss → status becomes 'dismissed'
- POST update_step → current_step changes
- POST invalid action → 400
- Two admins have independent state (isolation)
- Staff cannot access → 403

Add any missing cases.

### Cooling-off waiver
Confirm test-cooling-off-waiver.php covers the boundary:
- Date today → requires waiver (true)
- Date 13 days from now → requires waiver (true)
- Date 14 days from now → does NOT require waiver (false)
- Date 30 days from now → does NOT require waiver (false)
- Booking saved with waiver=1 when required → DB columns correct
- Booking saved with waiver=0 when not required → DB columns null
- Booking rejected (400) if waiver missing when required

Add any missing cases.

### Deposit calculation helper
If a bookit_calculate_deposit() helper function or method was
extracted during Fix 5A, add unit tests:

- test_percentage_deposit_calculation
  Service price £35, deposit_type='percentage', deposit_amount=50
  → deposit_due = £17.50, balance_due = £17.50

- test_fixed_deposit_calculation
  Service price £35, deposit_type='fixed', deposit_amount=10
  → deposit_due = £10.00, balance_due = £25.00

- test_fixed_deposit_capped_at_service_price
  Service price £35, deposit_type='fixed', deposit_amount=50
  → deposit_due = £35.00, balance_due = £0.00

- test_no_deposit_returns_full_amount
  deposit_type='none' → deposit_due = £0, balance_due = £35.00

If no helper function was extracted (calculation is inline in the
template), skip these — inline template logic is not unit testable.

### Settings keys registered in phpunit.xml
Confirm these test files are all in the <testsuite> block:
  test-cancellation-policy-settings.php
  test-payment-settings.php
  test-deposit-settings.php
  test-setup-guide-api.php
  test-cooling-off-waiver.php
  test-team-calendar-api.php (create if missing)

Add any that are absent.

---

## STEP 3: Run the full suite again

After adding any gap-fill tests:

Run: npm test

Target: all tests passing, zero failures.

Record the final counts:
  Total tests: ___
  Total assertions: ___
  Failures: 0
  Errors: 0

The test count should be meaningfully higher than 485 (Sprint 4B
baseline). A reasonable target given Sprint 4C additions is
540+ tests.

---

## STEP 4: Fix any output noise

If there is any unwanted output during the test run (HTML error
fragments, stderr lines from deliberate error-path tests), apply
the suppression pattern already in tests/bootstrap.php. Do not
add output buffering hacks to individual test files — fix it
at the bootstrap level.

---

## GIT COMMIT MESSAGE

Sprint 4C Task 8: PHPUnit coverage check and gap fill

- All Sprint 4C test files registered in phpunit.xml
- test-team-calendar-api.php: [N] tests covering day/week/month
  views, invalid input, staff filter, permission check
- Gap fill: [list any specific cases added to existing files]
- Final count: [N] tests, [N] assertions, 0 failures
```

---

Once you have the final test count from the run, report it back here before we move to Task 9. That number goes into the sprint completion report.