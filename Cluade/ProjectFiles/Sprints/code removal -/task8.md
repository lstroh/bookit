Good — I can see the full encryption class, the retry test file already exists with good coverage, and the Google Calendar token refresh path. Let me check what's already covered for `Stripe_Checkout` before writing the prompt.I now have a complete picture. Critically, I can see that:

1. **Retry exhaustion** — already well-covered in `test-notification-retry.php` (`test_final_failure_marks_failed_and_fires_hook` exists). This gap is already closed.
2. **Encryption `decrypt()`** — `test_encryption_round_trip` exists in `test-google-calendar-oauth.php`. But decrypt with *invalid input* is not tested.
3. **Migration runner error branch** — needs a test for the `catch (Throwable)` path.
4. **Stripe Checkout** — `validate_session_data` missing fields path needs testing; Stripe API error exception path needs testing.
5. **Google Calendar token refresh** — the `oauth_refresh_with_client` override pattern exists and is testable.

Now writing the prompt:

---

```
TASK 8 OF 8: Targeted coverage tests — 4 high-risk uncovered paths
Sprint: Code Review | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/payment/class-stripe-checkout.php` — read in full; understand `create_checkout_session()`, `validate_session_data()`, and how `\Stripe\Exception\ApiErrorException` is caught at the caller level in `class-wizard-api.php`
2. `includes/utils/class-bookit-encryption.php` — read in full; understand `encrypt()`, `decrypt()`, and `get_key()`
3. `includes/class-bookit-migration-runner.php` — read in full; focus on the `catch (Throwable $e)` block in `run_pending()` and the `log_error()` method
4. `includes/integrations/class-bookit-google-calendar.php` — read the `get_authenticated_client()` method in full; understand the token refresh path and `oauth_refresh_with_client()` override
5. `tests/unit/test-notification-retry.php` — read in full; retry exhaustion is already covered here — do NOT duplicate
6. `tests/unit/test-google-calendar-oauth.php` — read in full; `test_encryption_round_trip` already exists — do NOT duplicate
7. `tests/unit/test-migration-runner.php` — read in full; understand existing patterns before adding to this file
8. `tests/test-stripe-checkout.php` — read in full; understand what is already tested before writing new tests

If any file does not exist at the path given, stop and report back before proceeding.

---

## CONTEXT

The coverage report (985 tests, 52.89% line coverage) identified four uncovered paths that represent genuine business risk if they fail silently. Retry exhaustion is already covered in `test-notification-retry.php` (`test_final_failure_marks_failed_and_fires_hook`). The encryption round-trip is already covered in `test-google-calendar-oauth.php`. This task adds targeted tests only for the four genuinely uncovered paths listed below — no coverage-padding, no duplicating existing tests.

Baseline: **985 tests, 0 failures.** New tests are additive only.

---

## IMPLEMENTATION REQUIREMENTS

### New file: `tests/unit/test-coverage-gaps.php` — CREATE

Create a single new test file containing all four test classes below. Follow the setUp/tearDown patterns from `test-notification-retry.php` and `test-migration-runner.php` exactly.

---

#### Class 1: `Test_Encryption_Edge_Cases`

**What it covers:** `Bookit_Encryption::decrypt()` failure paths — the uncovered 18% of the encryption class.

Read `class-bookit-encryption.php` before writing. The `decrypt()` method returns `''` on any failure. Test these three cases:

```
test_decrypt_returns_empty_string_for_garbage_input
  - Call Bookit_Encryption::decrypt('not-valid-base64!!!###')
  - Assert result === ''

test_decrypt_returns_empty_string_for_truncated_blob
  - base64_encode a string shorter than 17 bytes (e.g. 'short')
  - Call Bookit_Encryption::decrypt() on it
  - Assert result === '' (strlen < 17 guard)

test_decrypt_returns_empty_string_for_tampered_ciphertext
  - Encrypt a known string: $enc = Bookit_Encryption::encrypt('original')
  - Corrupt the last 4 characters: substr_replace($enc, 'XXXX', -4)
  - Call Bookit_Encryption::decrypt() on the corrupted blob
  - Assert result === '' (openssl_decrypt returns false on bad ciphertext)
```

No setUp/tearDown needed — these are pure unit tests with no DB interaction.

---

#### Class 2: `Test_Migration_Runner_Error_Path`

**What it covers:** The `catch (Throwable $e)` block in `Bookit_Migration_Runner::run_pending()` — currently 0% covered.

Read `class-bookit-migration-runner.php` and `test-migration-runner.php` before writing. The existing tests use temp directories and dynamically generated migration classes — follow that exact pattern.

```
test_run_pending_stops_on_migration_exception_and_does_not_mark_as_run
  - Create a temp migration directory (follow create_temp_migration_artifacts() pattern)
  - Write a migration PHP file whose up() method throws new RuntimeException('deliberate failure')
  - Register the path and call Bookit_Migration_Runner::run_pending()
  - Assert: has_run() returns false for that migration_id (not marked as run)
  - Assert: run_pending() returned an empty array (no migrations reported as run)

test_run_pending_stops_processing_further_migrations_after_exception
  - Create a temp dir with TWO migrations: 0001 throws, 0002 is valid
  - Call run_pending()
  - Assert: 0001 not marked as run
  - Assert: 0002 not marked as run (processing halted at the break)
```

Clean up temp dirs and tables in tearDown following the existing test's cleanup pattern.

---

#### Class 3: `Test_Stripe_Checkout_Validation`

**What it covers:** `validate_session_data()` missing-field paths and the missing-service/staff guard in `create_checkout_session()` — currently 0% method coverage.

Read `class-stripe-checkout.php` before writing. `validate_session_data()` is private — call it via `create_checkout_session()` with incomplete session data (no Stripe API call will be made because validation fails first).

```
test_create_checkout_session_returns_error_for_missing_service_id
  - Call create_checkout_session([]) with empty array
  - Assert is_wp_error($result) === true
  - Assert $result->get_error_code() === 'missing_service'

test_create_checkout_session_returns_error_for_missing_staff_id
  - Build session data with valid service_id but no staff_id
    (service_id must be a real DB row — insert one in setUp)
  - Call create_checkout_session($session_data)
  - Assert is_wp_error($result) === true
  - Assert $result->get_error_code() === 'missing_staff'

test_create_checkout_session_returns_error_for_invalid_email
  - Build session data with service_id, staff_id, date, time, 
    customer_first_name, customer_last_name, but customer_email = 'not-an-email'
  - Assert is_wp_error($result) === true
  - Assert $result->get_error_code() === 'invalid_email'

test_create_checkout_session_returns_error_for_missing_required_field
  - Build session data missing customer_first_name only (all others present)
  - Assert is_wp_error($result) === true
  - Assert $result->get_error_code() === 'missing_field'
```

Insert a minimal service and staff row in setUp. Clean up in tearDown. Use `$wpdb->insert()` directly following the pattern in `test-pay-on-arrival.php`. No Stripe API calls will be made — validation short-circuits before any network call.

---

#### Class 4: `Test_Google_Calendar_Token_Refresh`

**What it covers:** The token-refresh branch in `Bookit_Google_Calendar::get_authenticated_client()` — the path where `$client->isAccessTokenExpired()` returns true and `oauth_refresh_with_client()` is called.

Read `class-bookit-google-calendar.php` before writing. The class has a protected `oauth_refresh_with_client()` method specifically designed to be overridden in tests (this is the established pattern — read `test-google-calendar-oauth.php` to see how it's used). Create a test double subclass that overrides this method.

```
test_get_authenticated_client_returns_null_when_token_refresh_fails
  - Create a test double: class Bookit_Google_Calendar_Refresh_Error_Double 
    extends Bookit_Google_Calendar {
      protected static function oauth_refresh_with_client($client, $refresh): array {
        return ['error' => 'invalid_grant', 'error_description' => 'Token expired'];
      }
    }
  - Insert a staff row with google_calendar_connected=1, a valid encrypted 
    access_token (use Bookit_Encryption::encrypt('fake-access')), a valid 
    encrypted refresh_token, and a token_expiry in the past (so isAccessTokenExpired() = true)
  - Seed Google OAuth settings in wp_bookings_settings (client_id, client_secret)
    following the seed_google_oauth_settings() pattern in test-google-calendar-oauth.php
  - Call Bookit_Google_Calendar_Refresh_Error_Double::get_authenticated_client($staff_id)
  - Assert result === null
  - Assert an audit log entry was written: query wp_bookings_audit_log for 
    action = 'google_calendar.token_refresh_failed' and object_id = $staff_id

test_get_authenticated_client_returns_null_when_refresh_returns_no_access_token
  - Same setup as above but override returns ['access_token' => ''] (empty token)
  - Assert result === null
  - Assert audit log entry written for 'google_calendar.token_refresh_failed'
```

Insert a real Google Client config in setUp using `$wpdb->insert()` into `wp_bookings_settings`. Clean up both the staff row and the settings rows in tearDown.

**Note:** `get_authenticated_client()` is a static method. Call it as `Bookit_Google_Calendar_Refresh_Error_Double::get_authenticated_client($staff_id)`.

---

## PHPUNIT REQUIREMENTS

Baseline: **985 tests, 0 failures** — must not regress.

Expected count after this task: **997–998 tests** (approximately 12–13 new tests across 4 classes, exact count depends on final implementation).

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```

All tests must pass before marking task complete. If any new test fails, fix it before committing — do not commit failing tests.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `Bookit_Encryption::decrypt()` with invalid/truncated/tampered input returns `''` in all three cases
- [ ] `Bookit_Migration_Runner::run_pending()` does not mark a migration as run when its `up()` throws
- [ ] `Bookit_Migration_Runner::run_pending()` halts at the first failing migration — subsequent migrations in the same run are not executed
- [ ] `Booking_System_Stripe_Checkout::create_checkout_session()` returns `WP_Error` for each missing/invalid field — no Stripe API call is made
- [ ] `Bookit_Google_Calendar::get_authenticated_client()` returns `null` and logs to audit when token refresh fails
- [ ] `Bookit_Google_Calendar::get_authenticated_client()` returns `null` and logs to audit when refresh response contains no access token

### Technical
- [ ] No PHP warnings or notices
- [ ] No new test duplicates an existing test
- [ ] All new tests follow setUp/tearDown patterns from existing test files in their area
- [ ] PHPUnit suite passes (997+ tests, 0 failures)

### Must NOT break
- [ ] `test-notification-retry.php` — all existing retry tests still pass
- [ ] `test-google-calendar-oauth.php` — all existing OAuth tests still pass
- [ ] `test-migration-runner.php` — all existing migration runner tests still pass
- [ ] `test-stripe-checkout.php` — all existing Stripe checkout tests still pass

---

## GIT COMMIT MESSAGE

```
Code review Task 8: Targeted coverage tests for 4 high-risk paths

- Encryption: decrypt() edge cases (garbage, truncated, tampered input)
- Migration runner: exception in up() stops run, does not mark as run
- Stripe checkout: validate_session_data() missing-field WP_Error paths
- Google Calendar: token refresh failure returns null + audit log entry

Tests: 997+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.