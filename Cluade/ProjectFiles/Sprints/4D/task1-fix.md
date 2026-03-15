# TASK 1 FIX: Resolve FK Truncation & Test Teardown Failures
Sprint: 4D | Est: ~1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `tests/unit/test-package-migrations.php` — the migration test class;
   needs rollback assertions fixed and temporary-table approach removed
2. `tests/bootstrap.php` (or equivalent test bootstrap file — check the
   actual filename) — understand how test DB tables are set up and how
   teardown/truncation is handled between tests
3. `tests/unit/test-dashboard-bookings-api.php` — one of the affected
   existing tests; read to understand its setUp/tearDown pattern
4. `tests/test-stripe-webhook.php` — another affected test class; read
   its setUp/tearDown
5. `tests/test-bulk-booking-actions.php` — another affected test class
6. `database/migrations/0006-create-customer-packages-table.php` — the
   migration that creates the FK from customer_packages → customers
7. `database/migrations/0007-create-package-redemptions-table.php` — the
   migration that creates the FK from redemptions → bookings
8. `database/migrations/0008-add-customer-package-id-to-bookings.php` —
   the ALTER migration; read to confirm current state

If any file does not exist under the expected path, find the correct path
and read it before proceeding.

---

## CONTEXT

After Sprint 4D Task 1 added three new package tables with foreign key
constraints referencing `wp_bookings` and `wp_bookings_customers`, the PHPUnit
test suite regressed from 571 passing to 551 passing (28 failures). The root
cause is that the test framework's between-test cleanup uses `TRUNCATE TABLE`
on the parent tables, which MySQL blocks when child tables hold FK constraints.
This fix resolves two distinct problems: (1) the global truncation issue
affecting all pre-existing test classes, and (2) the rollback assertion
failures in `Test_Package_Migrations` itself. No production code changes are
needed — this is a test infrastructure fix only.

---

## PROBLEM ANALYSIS

**Problem 1 — TRUNCATE blocked by FK constraints (25 failures)**

Every test class that truncates `wp_bookings` or `wp_bookings_customers`
in setUp/tearDown now fails with:

```
WordPress database error: Cannot truncate a table referenced in a foreign
key constraint (wp_bookings_package_redemptions, CONSTRAINT fk_pr_booking
FOREIGN KEY (booking_id) REFERENCES wp_bookings (id))
```

Affected test classes (from the failure output):
- `Test_Stripe_Webhook`
- `Test_Bulk_Booking_Actions`
- `Test_Availability_Algorithm`
- `Test_Dashboard_Bookings_API`
- `Test_Customer_Data_Export`

**Problem 2 — Rollback tests asserting wrong state (2 failures)**

`test_rollback_drops_package_tables` and `test_rollback_is_idempotent` both
assert `false` (table does not exist) but receive `true` (table still exists),
meaning the migration `down()` methods are not dropping the tables in the test
environment. The test output also shows the test scaffold attempted
`CREATE TEMPORARY TABLE` with FK constraints, which MySQL does not support
for InnoDB temporary tables — these failed silently, leaving the permanent
tables created by the actual migrations still present.

---

## IMPLEMENTATION REQUIREMENTS

### Fix 1 — Test bootstrap / base test class — MODIFY

Read the bootstrap file and any base `WP_UnitTestCase` subclass used by this
plugin's tests. Locate where `TRUNCATE TABLE wp_bookings` and
`TRUNCATE TABLE wp_bookings_customers` are called (likely in `setUp()`,
`tearDown()`, or a shared utility method).

Replace the truncation sequence for tables that have FK dependents with a
`FOREIGN_KEY_CHECKS`-bracketed truncation block. The correct pattern is:

```php
// Disable FK checks before truncating parent tables that have dependents
$wpdb->query( 'SET FOREIGN_KEY_CHECKS = 0' );
$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_package_redemptions" );
$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_customer_packages" );
$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_package_types" );
$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings" );
$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_customers" );
// ... any other tables in the existing truncation sequence ...
$wpdb->query( 'SET FOREIGN_KEY_CHECKS = 1' );
```

**Important rules for this change:**
- The `SET FOREIGN_KEY_CHECKS = 0` must wrap the ENTIRE truncation sequence,
  not just the package tables
- The truncation order within the block does not matter when FK checks are
  disabled, but keep child tables (redemptions, customer_packages) before
  parent tables for clarity
- The `SET FOREIGN_KEY_CHECKS = 1` must always be called, even if an
  exception is thrown — consider a try/finally pattern if the bootstrap
  uses exception handling
- Only add the package tables to the truncation list if they actually exist
  (guard with a table-existence check, or accept that truncating a
  non-existent table when FK checks are off will error — use the existence
  check to be safe)
- Do NOT change the truncation logic for any other tables — only add the
  FK_CHECKS wrapper around the existing sequence and add the three new
  package tables to the list

If the teardown logic is duplicated across multiple test classes rather than
centralised in a base class or bootstrap, apply the same fix to each affected
class. Read each file to confirm where the truncation happens.

---

### Fix 2 — `tests/unit/test-package-migrations.php` — MODIFY

**Problem A — Temporary table approach:**
The test scaffold is attempting `CREATE TEMPORARY TABLE` with FK constraints
for the package tables. MySQL/InnoDB does not support FK constraints on
temporary tables. The migration tests must operate against the actual permanent
tables created by the migration runner, not temporary copies.

Read the current file and locate any `CREATE TEMPORARY TABLE` statements.
Remove them entirely. The migration tests should:
1. Call the migration runner's `up()` method (or the migration class directly)
   to create the permanent tables
2. Assert the tables exist using `$wpdb->get_var("SHOW TABLES LIKE '...'")`
3. Call the `down()` method to roll back
4. Assert the tables are gone

**Problem B — Rollback assertions failing:**
`test_rollback_drops_package_tables` is asserting `false` but receiving `true`
— the tables still exist after `down()`. Read the current `down()` methods in
each migration file to confirm they are correctly dropping the tables and
column. If the `down()` methods are correct, the issue is that the test is not
calling them properly. Fix the test to:
1. Confirm the tables exist (positive assertion first)
2. Call `down()` on each migration in reverse FK order:
   - `down()` on migration 0007 (redemptions)
   - `down()` on migration 0006 (customer_packages)
   - `down()` on migration 0005 (package_types)
   - `down()` on migration 0008 (ALTER — removes customer_package_id column)
3. Assert that each table no longer exists and the column is gone

**Problem C — Idempotent rollback test:**
`test_rollback_is_idempotent` must call `down()` twice and assert no errors
on the second call. Use `$wpdb->last_error` to check for errors after each
call:

```php
// Second down() should be a no-op, not an error
$migration->down();
$this->assertEmpty( $wpdb->last_error, 'Second rollback should not error' );
```

**Ensure the package migration test class does NOT use `setUp()` to truncate
`wp_bookings` or `wp_bookings_customers` before the FK-disable fix from Fix 1
is applied — or apply Fix 1 first in the same edit session.**

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No production code changes — test infrastructure only
- [ ] `SET FOREIGN_KEY_CHECKS = 0/1` wraps all truncation in the test teardown
- [ ] Package tables added to the truncation list (with existence guard)
- [ ] `test-package-migrations.php` does not use `CREATE TEMPORARY TABLE`
- [ ] Rollback tests call `down()` in correct FK-safe order
- [ ] No other test behaviour changed

---

## PHPUNIT REQUIREMENTS

Baseline entering this fix: **579 tests, 28 failures**.
Target after fix: **579 tests, 0 failures**.

After applying the fix, run the full suite:
```
cd bookit-booking-system && vendor/bin/phpunit
```

Verify specifically:
- All 28 previously failing tests now pass
- `Test_Package_Migrations` all 8 tests pass
- No new failures introduced

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Full PHPUnit suite runs to completion with 0 failures
- [ ] `Test_Package_Migrations::test_rollback_drops_package_tables` passes
- [ ] `Test_Package_Migrations::test_rollback_is_idempotent` passes
- [ ] All `Test_Dashboard_Bookings_API` tests pass
- [ ] All `Test_Stripe_Webhook` tests pass
- [ ] All `Test_Bulk_Booking_Actions` tests pass
- [ ] All `Test_Availability_Algorithm` tests pass
- [ ] `Test_Customer_Data_Export` tests pass

### Technical
- [ ] No `Cannot truncate a table referenced in a foreign key constraint`
      errors in test output
- [ ] No `CREATE TEMPORARY TABLE` with FK constraints in any test file
- [ ] `SET FOREIGN_KEY_CHECKS = 0` is always paired with
      `SET FOREIGN_KEY_CHECKS = 1` (no leaked state)
- [ ] No production PHP files modified
- [ ] PHPUnit suite: 579 tests, 0 failures

### Must NOT break
- [ ] All 8 `Test_Package_Migrations` tests pass (including the 6 that
      were already passing)
- [ ] Migrations themselves unchanged — schema is correct as implemented
- [ ] Error code constants and registry unchanged

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 1 fix: Resolve FK truncation failures in test suite

- Wrap test teardown TRUNCATE sequence with SET FOREIGN_KEY_CHECKS=0/1
- Add package tables to teardown truncation list
- Remove invalid CREATE TEMPORARY TABLE FK usage from migration tests
- Fix rollback test to call down() in correct FK-safe order
- Fix idempotent rollback assertion to check wpdb->last_error

Tests: 579 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.