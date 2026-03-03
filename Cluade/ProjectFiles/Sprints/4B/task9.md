Here is the Task 9 Cursor prompt.

---

### Cursor Prompt — Task 9: PHPUnit Tests + Manual Testing Polish

```
CONTEXT
=======
Plugin: bookit-booking-system (WordPress plugin)
Branch: Phase1
Environment: Local by Flywheel (dev) + wp-env (PHPUnit)
PHP: 8.0+ / WordPress 6.0+
All code follows WordPress Coding Standards.
Existing test suite: 444 passing PHPUnit tests (Sprint 4A baseline).

BACKGROUND
==========
Sprint 4B added 8 major features. This task adds PHPUnit test coverage
for the new PHP classes and does a final manual polish pass.

Read these files before writing any tests:
- bookit-booking-system/tests/unit/ (understand existing test patterns,
  base test class, helper methods like create_test_booking(),
  create_test_staff(), login_as())
- bookit-booking-system/tests/bootstrap.php (understand test bootstrap)
- bookit-booking-system/includes/class-bookit-migration-runner.php
- bookit-booking-system/includes/class-bookit-audit-logger.php
- bookit-booking-system/includes/class-bookit-error-registry.php
- bookit-booking-system/includes/utils/class-bookit-reference-generator.php
- bookit-booking-system/includes/class-bookit-extension-registry.php
- bookit-booking-system/includes/api/class-audit-log-api.php

Do not guess at existing helper method signatures. Read the base test
class before writing any test.

YOUR TASK
=========
Write PHPUnit tests and complete the manual polish pass in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Test — Bookit_Migration_Runner
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/tests/unit/test-migration-runner.php

Class: Test_Bookit_Migration_Runner extends existing base test class

Tests to write:

test_create_migrations_table_creates_table()
  - Call Bookit_Migration_Runner::create_migrations_table()
  - Assert wp_bookings_migrations table exists (use $wpdb->get_var to check)

test_mark_as_run_inserts_record()
  - Call mark_as_run( 'test-migration-001', 'bookit-test' )
  - Assert has_run( 'test-migration-001', 'bookit-test' ) returns true

test_has_run_returns_false_for_unknown_migration()
  - Assert has_run( 'nonexistent-migration', 'bookit-test' ) returns false

test_run_pending_executes_valid_migration()
  - Create a temporary migration file in a temp directory:
    Class: Bookit_Migration_Temp_001
    migration_id(): 'temp-001'
    plugin_slug(): 'bookit-test'
    up(): creates a temp test table
    down(): drops the temp test table
  - Register the temp dir: register_migration_path( 'bookit-test', $temp_dir )
  - Call run_pending( 'bookit-test' )
  - Assert has_run( 'temp-001', 'bookit-test' ) returns true
  - Assert the temp table now exists

test_rollback_last_calls_down()
  - After test_run_pending_executes_valid_migration():
  - Call rollback_last( 'bookit-test' )
  - Assert has_run( 'temp-001', 'bookit-test' ) returns false
  - Assert the temp table no longer exists

test_duplicate_registration_is_silently_ignored()
  - Register the same migration path twice
  - Call run_pending() — should not throw or run the migration twice
  - Assert has_run count for that migration_id = 1

───────────────────────────────────────────────────────────────────────────────
STEP 2: Test — Bookit_Audit_Logger
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/tests/unit/test-audit-logger.php

Class: Test_Bookit_Audit_Logger

Tests to write:

test_log_inserts_row_into_audit_table()
  - Call Bookit_Audit_Logger::log( 'test.action', 'test', 42,
      [ 'notes' => 'PHPUnit test entry' ] )
  - Query wp_bookings_audit_log for the row
  - Assert: action = 'test.action', object_type = 'test', object_id = 42
  - Assert: notes = 'PHPUnit test entry'

test_log_with_old_and_new_value()
  - Call log() with old_value and new_value arrays
  - Assert old_value and new_value are JSON-encoded in the DB row

test_log_redacts_sensitive_fields()
  - Call log() with new_value containing:
      [ 'stripe_secret' => 'sk_live_abc', 'amount' => 100 ]
  - Assert the stored new_value does NOT contain 'stripe_secret'
  - Assert the stored new_value DOES contain 'amount'

test_log_does_not_throw_on_db_failure()
  - Temporarily set $wpdb->prefix to a nonexistent table prefix
  - Call Bookit_Audit_Logger::log( 'test.action', 'test', 0 )
  - Assert no exception is thrown (silent failure)
  - Restore $wpdb->prefix after the test

test_log_detects_system_actor_when_no_session()
  - Ensure no dashboard session is active
  - Call Bookit_Audit_Logger::log( 'test.action', 'test', 0 )
  - Assert the inserted row has actor_type = 'system' and actor_id = 0

───────────────────────────────────────────────────────────────────────────────
STEP 3: Test — Bookit_Error_Registry
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/tests/unit/test-error-registry.php

Class: Test_Bookit_Error_Registry

Tests to write:

test_registered_error_code_is_retrievable()
  - Call get( 'E1001' )
  - Assert returned array has keys: user_message, log_message,
    http_status, category
  - Assert http_status = 401

test_unknown_code_returns_fallback()
  - Call get( 'UNKNOWN_CODE' )
  - Assert http_status = 500 (the E9999 fallback)

test_to_wp_error_returns_wp_error_instance()
  - Call to_wp_error( 'E1001' )
  - Assert result is instance of WP_Error

test_to_wp_error_sets_correct_http_status()
  - Call to_wp_error( 'E2001' )
  - Assert WP_Error data contains status = 409

test_placeholder_substitution_in_user_message()
  - Call to_wp_error( 'E2002', [ 'booking_id' => 42 ] )
  - Assert get_error_message() contains '42'
  - Assert get_error_message() does not contain '{booking_id}'

test_duplicate_registration_is_ignored()
  - Register a test error code: 'TEST_DUP_001'
  - Register the same code again with different user_message
  - Assert get( 'TEST_DUP_001' ) still returns the FIRST registration
    (second is silently ignored per the registry spec)

test_extension_can_register_custom_code()
  - Register: 'MYEXT_E001' with valid definition
  - Assert get( 'MYEXT_E001' ) returns the correct definition

───────────────────────────────────────────────────────────────────────────────
STEP 4: Test — Bookit_Reference_Generator
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/tests/unit/test-reference-generator.php

Class: Test_Bookit_Reference_Generator

Tests to write:

test_generate_returns_correct_format()
  - Call generate( 1, '2026-02-28 10:00:00' )
  - Assert result matches regex: /^BK\d{4}-[A-Z0-9]{4}$/
  - Assert result starts with 'BK2602'

test_generate_is_deterministic()
  - Call generate() twice with same inputs
  - Assert both results are identical

test_generate_unique_returns_correct_format()
  - Call generate_unique( 1, '2026-02-28 10:00:00' )
  - Assert result matches regex: /^BK\d{4}-[A-Z0-9]{4}$/

test_generate_unique_avoids_collision()
  - Insert a booking row with booking_reference = 'BK2602-XXXX'
    (manually force the hash to match by mocking or using a known collision)
  - If true collision testing is complex, instead:
    Assert generate_unique() for a fresh booking_id returns a non-null,
    correctly formatted string — this confirms the collision loop runs
    without fatal errors

test_generate_lock_version_returns_32_char_hex()
  - Call generate_lock_version( 1, '2026-02-28 10:00:00' )
  - Assert result is exactly 32 characters
  - Assert result matches /^[a-f0-9]{32}$/

test_generate_lock_version_is_deterministic()
  - Call generate_lock_version() twice with same inputs
  - Assert both results are identical

test_different_booking_ids_produce_different_references()
  - Call generate( 1, '2026-02-28 10:00:00' )
  - Call generate( 2, '2026-02-28 10:00:00' )
  - Assert results are different

───────────────────────────────────────────────────────────────────────────────
STEP 5: Test — Bookit_Extension_Registry
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/tests/unit/test-extension-registry.php

Class: Test_Bookit_Extension_Registry

Note: The registry uses static properties. Reset between tests using
reflection or by calling a reset method if one exists. If no reset
method exists, add a private static reset_for_testing() method to the
registry class that clears $extensions and $nav_items — call it in setUp().

Tests to write:

test_register_extension_succeeds_with_valid_args()
  - Call register_extension() with all required args including a
    requires_core version <= BOOKIT_VERSION
  - Assert result is true
  - Assert is_registered( $slug ) returns true

test_register_extension_fails_without_required_fields()
  - Call register_extension() without 'name' field
  - Assert result is WP_Error with code 'bookit_missing_field'

test_register_extension_fails_with_incompatible_version()
  - Call register_extension() with requires_core = '99.0.0'
  - Assert result is WP_Error with code 'bookit_version_incompatible'

test_register_extension_rejects_duplicate_slug()
  - Register same slug twice
  - Assert second call returns WP_Error 'bookit_duplicate_slug'

test_register_nav_item_succeeds()
  - Register extension first
  - Call register_nav_item() with valid args referencing that slug
  - Assert get_nav_items() contains the item
  - Assert items are sorted by position

test_register_nav_item_fails_for_unregistered_extension()
  - Call register_nav_item() with a slug that has not been registered
  - Assert result is WP_Error

test_get_extensions_returns_all_registered()
  - Register two extensions
  - Assert get_extensions() returns array with count >= 2

───────────────────────────────────────────────────────────────────────────────
STEP 6: Test — Audit Log API endpoint
───────────────────────────────────────────────────────────────────────────────
Add to existing test file or create:
bookit-booking-system/tests/unit/test-audit-log-api.php

Class: Test_Bookit_Audit_Log_API

Tests to write:

test_get_audit_log_requires_admin()
  - Login as staff user
  - GET /bookit/v1/audit-log
  - Assert 403 response

test_get_audit_log_accessible_by_admin()
  - Login as admin
  - Insert a test audit log row directly via $wpdb
  - GET /bookit/v1/audit-log
  - Assert 200 response
  - Assert response has 'data' and 'pagination' keys

test_get_audit_log_date_filter()
  - Insert two log rows: one for today, one for 2020-01-01
  - GET /bookit/v1/audit-log?date_from=2020-01-01&date_to=2020-01-01
  - Assert only the 2020 row is returned

test_get_audit_log_action_filter()
  - Insert rows with action 'booking.created' and 'setting.updated'
  - GET /bookit/v1/audit-log?action=booking.created
  - Assert only 'booking.created' rows returned

test_get_audit_log_pagination()
  - Insert 55 log rows
  - GET /bookit/v1/audit-log?per_page=50&page=1
  - Assert pagination.total >= 55
  - Assert pagination.total_pages >= 2
  - Assert count of data array = 50

test_viewing_audit_log_creates_audit_entry()
  - Login as admin
  - GET /bookit/v1/audit-log
  - Query wp_bookings_audit_log for action = 'audit_log.viewed'
  - Assert at least one row exists

───────────────────────────────────────────────────────────────────────────────
STEP 7: Test — Optimistic locking in update_booking
───────────────────────────────────────────────────────────────────────────────
Add tests to existing test-dashboard-bookings-api.php:

test_update_booking_succeeds_with_correct_lock_version()
  - Create test booking (has lock_version set)
  - Read current lock_version from DB
  - PUT/PATCH update_booking with correct lock_version
  - Assert 200 response
  - Assert lock_version in DB has changed to a new value

test_update_booking_rejects_stale_lock_version()
  - Create test booking
  - PUT/PATCH update_booking with lock_version = 'stale_token_abc'
  - Assert 409 response
  - Assert response code = 'E2004'

test_update_booking_without_lock_version_succeeds()
  - Create test booking
  - PUT/PATCH update_booking with NO lock_version field
  - Assert 200 response (backwards compatible — no token = skip check)

───────────────────────────────────────────────────────────────────────────────
STEP 8: Run full test suite and fix any failures
───────────────────────────────────────────────────────────────────────────────
Run:
  cd bookit-booking-system && npx wp-env run tests phpunit

Target: all existing 444 tests still pass PLUS new tests pass.
Fix any failures before proceeding to Step 9.

Do not change existing tests to make them pass — fix the implementation
code if a regression is found.

───────────────────────────────────────────────────────────────────────────────
STEP 9: Manual polish pass
───────────────────────────────────────────────────────────────────────────────
Do a final visual and functional review of every Sprint 4B feature.
Fix any minor UI issues found. Specifically check:

AUDIT LOG PAGE:
- [ ] Table columns align correctly on mobile (375px viewport)
- [ ] Long action strings do not overflow table cells — add text-ellipsis
      or word-break if needed
- [ ] Empty state message is centred and clearly visible
- [ ] Loading state shows while fetching (spinner or skeleton)
- [ ] Pagination controls are not shown when total_pages = 1

BRANDING SETTINGS:
- [ ] Logo preview is shown at a reasonable size (max h-16)
- [ ] Primary colour change preview is visible before saving
      (colour picker and hex input stay in sync)
- [ ] "Save Branding" button is disabled while saving (shows "Saving...")
- [ ] Success toast auto-dismisses after 3 seconds

EXTENSION REGISTRY:
- [ ] Settings page Extensions section shows empty state correctly
- [ ] No JS errors in console on the Settings page

BOOKING REFERENCE:
- [ ] Reference column is visible in bookings list
- [ ] Reference is shown in booking detail modal
- [ ] Search by reference works (type a reference in the search bar)

OPTIMISTIC LOCK:
- [ ] Conflict dialog is clearly readable on mobile
- [ ] "Close and Refresh" button works correctly

GENERAL:
- [ ] No PHP warnings or notices in debug.log after navigating all pages
- [ ] No JS console errors on any dashboard page (ignoring Grammarly)
- [ ] All buttons have correct disabled states during async operations
```

---

**Final checklist before committing Task 9:**

- [ ] `npx wp-env run tests phpunit` passes with no failures
- [ ] New test count is higher than 444 (confirm exact count in output)
- [ ] No regressions in existing tests
- [ ] All manual polish items above checked and fixed
- [ ] `debug.log` is clean (no PHP warnings or notices)
- [ ] No JS console errors on: Bookings, Staff, Settings, Audit Log, Reports pages

When done, let me know the final test count and I'll provide the Sprint 4B completion commit message and a summary of what was built.