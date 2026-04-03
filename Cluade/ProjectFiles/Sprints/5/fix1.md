TASK 1 OF 1: Rewrite Brevo email provider for SDK v4
Sprint: 5 | Est: 2h | Plugin root: bookit-booking-system/

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/notifications/providers/class-bookit-brevo-email-provider.php
   — the file being rewritten
2. includes/notifications/interfaces/interface-bookit-email-provider.php
   — the interface this class must implement (do not change it)
3. vendor/getbrevo/brevo-php/src/Brevo.php
   — the v4 SDK entry point class
4. vendor/getbrevo/brevo-php/src/TransactionalEmails/TransactionalEmailsClient.php
   — the client used to send emails
5. vendor/getbrevo/brevo-php/src/TransactionalEmails/Requests/SendTransacEmailRequest.php
   — the typed request object for sending emails
6. vendor/getbrevo/brevo-php/src/Exceptions/BrevoApiException.php
   — the exception class for API errors
7. vendor/composer/autoload_classmap.php
   — to verify exact class names and namespaces before using them
8. tests/unit/test-brevo-email-provider.php (if it exists)
   — existing tests that must not regress

If any of the above files do not exist, stop and report back.

## CONTEXT

The installed SDK is getbrevo/brevo-php v4, which is a complete rewrite
of the previous v1/v2/v3 SDK. The old API (Brevo\Client\Configuration,
Brevo\Client\Api\TransactionalEmailsApi, Brevo\Client\Model\SendSmtpEmail)
does not exist in v4. The current provider code uses the old API and
throws a fatal "Class not found" error at runtime. This task rewrites
the provider to use the v4 SDK exclusively, using only class names
confirmed to exist in vendor/composer/autoload_classmap.php.

## CRITICAL RULE — SDK USAGE

BEFORE writing any code that references a Brevo class:
1. Open vendor/composer/autoload_classmap.php
2. Search for the class name you intend to use
3. Only use classes that appear in that file
4. If a class is not in the classmap, it does not exist — find the
   correct class name from the classmap instead

DO NOT rely on any online documentation, Context7, or GitHub README
for class names. The classmap is the only source of truth.

## IMPLEMENTATION REQUIREMENTS

### includes/notifications/providers/class-bookit-brevo-email-provider.php — MODIFY

- Rewrite the send() method to use the v4 SDK
- Entry point: instantiate \Brevo\Brevo with the API key from settings
  (read vendor/getbrevo/brevo-php/src/Brevo.php to find the correct
  constructor signature)
- Use \Brevo\TransactionalEmails\TransactionalEmailsClient to send
  (read the file to find the correct method name for sending an email)
- Use the correct typed request object for the email payload
  (read vendor/getbrevo/brevo-php/src/TransactionalEmails/Requests/
  SendTransacEmailRequest.php to find constructor and property names)
- Catch \Brevo\Exceptions\BrevoApiException for API errors
  (read the file to find how to get the HTTP status code for 429 detection)
- Catch \Brevo\Exceptions\BrevoException for general SDK errors
- Preserve all existing method signatures: send(), is_configured(),
  get_name(), get_slug() — these are interface requirements
- Preserve existing get_setting() private helper — do not change it
- The 429 detection logic must still return a WP_Error with code
  'brevo_rate_limited' so the dispatcher retry logic continues to work
- All other error paths must return WP_Error (not throw exceptions)
- Success must return true (bool)

## PHPUNIT REQUIREMENTS

Baseline: 816 tests, 0 failures — must not regress.

If a test file exists at tests/unit/test-brevo-email-provider.php:
- Read it before making any changes
- Update tests to reflect the new v4 SDK (mock the new classes)
- All existing test cases must still pass with equivalent coverage

If no test file exists, create one with these test cases:
- test_send_returns_wp_error_when_api_key_empty: verifies WP_Error
  returned without calling SDK when API key is blank
- test_is_configured_returns_false_when_no_api_key: verifies false
  when brevo_api_key setting is empty
- test_is_configured_returns_true_when_api_key_set: verifies true
  when brevo_api_key setting is present
- test_get_name_returns_brevo: verifies string 'Brevo'
- test_get_slug_returns_brevo: verifies string 'brevo'

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

## ACCEPTANCE CRITERIA

### Functional
- [ ] Sending a test email from the dashboard Settings → Email page
      succeeds with no PHP fatal errors
- [ ] A successful send returns true (not a WP_Error)
- [ ] A 429 response from Brevo returns WP_Error with code
      'brevo_rate_limited'
- [ ] Any other Brevo API error returns WP_Error with code
      'brevo_send_failed'
- [ ] is_configured() returns false when brevo_api_key is not set
- [ ] is_configured() returns true when brevo_api_key is set

### Technical
- [ ] No PHP warnings or notices
- [ ] No reference to any class not present in autoload_classmap.php
- [ ] Bookit_Email_Provider_Interface is fully implemented
- [ ] PHPUnit suite passes (816+ tests, 0 failures)

### Must NOT break
- [ ] wp_mail fallback provider still works
- [ ] Email queue processing still works
- [ ] Dispatcher retry logic for 429 responses still works
- [ ] All existing notification tests still pass

## GIT COMMIT MESSAGE
Sprint 5, Task 1: Rewrite Brevo provider for SDK v4

- Replace Brevo\Client\* classes with v4 SDK entry point
- Use classmap as sole source of truth for class names
- Preserve interface, error codes, and dispatcher integration
- Update/add PHPUnit tests for new SDK

Tests: 816+ passing, 0 failures

---
If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.