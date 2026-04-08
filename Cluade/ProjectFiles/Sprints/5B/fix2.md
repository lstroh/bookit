TASK: Fix JSON_CONTAINS MariaDB compatibility in V2 Step 5 package queries
Sprint: 5B | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. public/templates/booking-wizard-v2-step-5.php
   — Read the two package queries that use JSON_CONTAINS:
   the $customer_packages query and the $available_packages query.
   These are what you are fixing.

2. includes/api/class-available-packages-api.php
   — Read get_available_packages(). This endpoint already solves
   the same filtering problem correctly: it fetches all rows then
   filters in PHP using json_decode() + in_array(). Your fix must
   use the same pattern.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

On MariaDB (Hostinger production server runs MariaDB 11.4),
CAST(%d AS JSON) in JSON_CONTAINS() does not work correctly —
it causes the JSON_CONTAINS condition to fail silently, so
packages with specific applicable_service_ids values are never
shown in V2 wizard Step 5, even when the service ID matches.

The fix is to remove JSON_CONTAINS from both SQL queries entirely
and replicate the PHP-side filtering pattern already established
in class-available-packages-api.php.

---

## IMPLEMENTATION REQUIREMENTS

### public/templates/booking-wizard-v2-step-5.php — MODIFY

Fix 1 — $customer_packages query:
- Remove the JSON_CONTAINS condition from the WHERE clause entirely.
- Keep all other conditions unchanged (status = active,
  sessions_remaining > 0, expires_at check, customer email lookup).
- After fetching results, filter in PHP:
  foreach the rows and keep only rows where package_matches_service(
  $row['applicable_service_ids'], (int) $session_data['service_id'])
  returns true.
- Add a private-style PHP function or inline closure for
  package_matches_service($applicable_service_ids, $service_id):
  - If $applicable_service_ids is NULL or '' or '[]': return true
  - json_decode to array, absint each element, in_array check
  - This is the exact logic in class-available-packages-api.php —
    read it and replicate it precisely.

Fix 2 — $available_packages query:
- Remove the JSON_CONTAINS condition from the WHERE clause entirely.
- Keep WHERE is_active = 1 only.
- After fetching results, filter in PHP using the same
  package_matches_service() function.

Do not change any other logic in this file.
Do not change class-available-packages-api.php — it already works.

---

## PHPUNIT REQUIREMENTS

Baseline: 870 tests, 0 failures — must not regress.

No new test file required. The existing test
tests/unit/test-booking-wizard-v2.php already covers the package
zone rendering. Confirm those tests still pass after the fix.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

- [ ] Package with applicable_service_ids = '[1]' appears in V2
      wizard Step 5 when booking service ID 1
- [ ] Package with applicable_service_ids = NULL appears for
      any service
- [ ] Package with applicable_service_ids = '[2]' does NOT appear
      when booking service ID 1
- [ ] No JSON_CONTAINS in either package query
- [ ] PHPUnit: 870+ tests, 0 failures

### Must NOT break
- [ ] V1 wizard Step 5 package display unchanged
- [ ] class-available-packages-api.php unchanged
- [ ] Pay on Arrival and Stripe card flows unchanged

---

## GIT COMMIT MESSAGE

Sprint 5B: Fix MariaDB JSON_CONTAINS incompatibility in V2 Step 5

- booking-wizard-v2-step-5.php: replace JSON_CONTAINS(col, CAST(%d
  AS JSON)) with PHP-side filtering using json_decode + in_array
  (same pattern as class-available-packages-api.php)
- Fixes package zone not appearing on MariaDB 11.4 (Hostinger)

Tests: 870+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.