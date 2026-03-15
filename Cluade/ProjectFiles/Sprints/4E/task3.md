TASK 3 OF 8: PHPUnit Coverage — Sprint 4B Infrastructure (~8h, actual ~2–3h)
TASK 3 OF 8: PHPUnit Coverage — Sprint 4B Infrastructure gaps
Sprint: 4E | Est: 8h (likely 2–3h actual) | Plugin root: bookit-booking-system/

READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back before proceeding.

tests/unit/test-migration-runner.php — read ALL existing tests; only add tests for gaps not already covered
tests/unit/test-audit-logger.php — read ALL existing tests; only add tests for gaps not already covered
tests/unit/test-extension-registry.php — read ALL existing tests; only add tests for gaps not already covered
includes/class-bookit-migration-runner.php — understand the full public API, especially any method for retrieving pending migrations
includes/class-bookit-extension-registry.php — understand how requires_core version checking works (or whether it exists)
phpunit.xml — confirm the three test files are already registered (do not re-register them)


CONTEXT
All five Sprint 4B test files already exist and have substantial coverage. This task adds only the specific cases that are genuinely missing. Do not rewrite or reorganise any existing tests — append new test methods only. The total new test count will be small (estimated 4–8 tests).

IMPLEMENTATION REQUIREMENTS
tests/unit/test-migration-runner.php — MODIFY (append only)
Read the file first. Confirm whether a test for detecting pending migrations already exists. If it does not:
Add: test_get_pending_returns_unrun_migrations

Register a migration path with two migration files (use the create_temp_migration_artifacts helper pattern already in the file — read it to understand the exact helper signature)
Run only the first migration via run_pending()
Call whatever method Bookit_Migration_Runner exposes to retrieve pending/unrun migrations
Assert that the second migration appears in the pending list and the first does not
If Bookit_Migration_Runner has no get_pending() or equivalent method, read the class carefully and test the observable behaviour instead (e.g. that run_pending() only runs the unrun one on a second call)
Stop and report back if the class has no mechanism at all for detecting pending migrations — do not invent a method

tests/unit/test-audit-logger.php — MODIFY (append only)
Read the file first. Confirm whether a test for object_id NULL storage already exists. If it does not:
Add: test_log_stores_null_object_id_when_zero_passed

Call Bookit_Audit_Logger::log( 'test.null.object', 'system', 0 )
Fetch the row from the audit log table
Assert that object_id in the database is NULL (not 0) — the class stores null when object_id <= 0
This verifies the DB behaviour documented in the class implementation

tests/unit/test-extension-registry.php — MODIFY (append only)
Read the file first. Confirm whether a test for version incompatibility already exists. If it does not, read class-bookit-extension-registry.php to understand whether version checking is implemented:

If requires_core version checking is implemented: Add test_register_extension_rejects_incompatible_core_version

Attempt to register an extension with requires_core set to a version significantly higher than the current BOOKIT_VERSION constant (e.g. '99.0.0')
Assert the result is a WP_Error instance
Assert the error code is whatever the registry uses for version incompatibility — read the class to find the exact error code string


If requires_core version checking is not implemented in the class: do not add a test. Instead, stop and report back with: "Version incompatibility check is not implemented in class-bookit-extension-registry.php — no test added. Recommend adding to Sprint 4F backlog."


INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

 No new files created — all changes are appended to existing test files
 No new entries needed in phpunit.xml — all three test files are already registered
 No production code changes — tests only


PHPUNIT REQUIREMENTS
Baseline: 697 tests, 0 failures — must not regress.
No new test files. All new test methods appended to existing files listed above.
Expected additions: 2–4 new test methods total (small task — most coverage already exists).
Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

ACCEPTANCE CRITERIA
Functional

 No duplicate tests written — every new test covers a case not already tested
 test-migration-runner.php covers pending migration detection (or gap is explicitly reported)
 test-audit-logger.php covers NULL object_id DB storage behaviour
 test-extension-registry.php covers version incompatibility (or gap is explicitly reported if feature not implemented)

Technical

 No PHP warnings or notices
 PHPUnit suite passes (697+ tests, 0 failures)
 No existing test methods modified — append only

Must NOT break

 All existing Sprint 4B test coverage
 All existing Sprint 4C/4D test coverage


GIT COMMIT MESSAGE
Sprint 4E, Task 3: PHPUnit coverage gaps — Sprint 4B infrastructure

- Added test for pending migration detection in test-migration-runner.php
- Added test for NULL object_id storage in test-audit-logger.php
- Added test for version incompatibility in test-extension-registry.php (if implemented)

Tests: [N] passing, 0 failures
(Update test count from actual PHPUnit output. Note any gaps that were reported rather than tested.)

If you encounter an architecture decision not covered above, or find that a tested method does not exist in the implementation, STOP and report back before writing any code.