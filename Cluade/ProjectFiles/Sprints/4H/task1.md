Good — Sprint 4G is complete and Sprint 4H is planned. The document you've shared is the Sprint 4H implementation prompt. Let me check the cursor-prompt-generator skill before proceeding.Good. Now let me use Context7 to get the Brevo PHP SDK docs before generating the Task 1 prompt.I have the Brevo SDK API confirmed. Now I'll generate the Task 1 Cursor prompt.

---

## Sprint 4H — Task 1 of 5: Interfaces + Provider Scaffold

```
TASK 1 OF 5: Interfaces + Provider Scaffold
Sprint: 4H | Est: ~3h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/class-bookit-loader.php` — full file; you will add `require_once` calls for all new provider files in `load_dependencies()`. Understand the existing pattern for how files are loaded.
2. `composer.json` — full file; you will add `"getbrevo/brevo-php": "^4.0"` to the require block. Confirm current dependencies so there are no conflicts.
3. `database/migrations/0009-add-performance-indexes.php` — read to confirm the migration class naming convention and that 0009 is the highest numbered migration. If migrations 0010 or 0011 exist, note that and stop — do not proceed with migration numbering until clarified.
4. `includes/email/class-email-sender.php` — read the full file to understand what settings keys are currently used for from/name/email configuration. The new Brevo provider reads `brevo_from_name` and `brevo_from_email` — confirm these are new keys, not clashing with existing ones.

If any file does not exist or differs from what is described, stop and report back before proceeding.

---

## CONTEXT

Task 1 creates the provider abstraction layer that all subsequent tasks build on. It defines two interfaces (`Bookit_Email_Provider_Interface` and `Bookit_SMS_Provider_Interface`), implements three concrete providers (Brevo email, WP Mail fallback, Brevo SMS stub), adds the Brevo PHP SDK via Composer, and wires all new files into `load_dependencies()`. No queue, no dispatcher, no Vue changes — this task is purely the provider layer.

The Brevo PHP SDK version is `^4.0`. The v4 API has been verified via Context7:
- Configuration: `Brevo\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_KEY')`
- Sending: `new Brevo\Client\Api\TransactionalEmailsApi(new GuzzleHttp\Client(), $config)`
- Email object: `new \Brevo\Client\Model\SendSmtpEmail()`
- Set sender: `$email->setSender(['email' => '...', 'name' => '...'])`
- Set recipient: `$email->setTo([['email' => '...', 'name' => '...']])`
- Set subject: `$email->setSubject('...')`
- Set HTML: `$email->setHtmlContent('...')`
- Send: `$apiInstance->sendTransacEmail($email)`
- Exception: `Brevo\Client\ApiException` with `getCode()` for HTTP status

---

## IMPLEMENTATION REQUIREMENTS

### `composer.json` — MODIFY

- Add to the `require` block: `"getbrevo/brevo-php": "^4.0"`
- Run `composer update` to install the SDK
- Do not change any other dependency

---

### `includes/notifications/interfaces/interface-bookit-email-provider.php` — CREATE

Create the directory `includes/notifications/interfaces/` if it does not exist.

Define the interface:

```php
<?php
/**
 * Email provider interface.
 *
 * All email providers must implement this interface.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

interface Bookit_Email_Provider_Interface {

    /**
     * Send an email.
     *
     * @param array  $to        Recipient: ['email' => string, 'name' => string].
     * @param string $subject   Email subject.
     * @param string $html_body HTML body content.
     * @param array  $params    Optional provider-specific parameters.
     *
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function send( array $to, string $subject, string $html_body, array $params = [] ): bool|\WP_Error;

    /**
     * Whether this provider is configured and ready to send.
     *
     * @return bool
     */
    public function is_configured(): bool;

    /**
     * Human-readable provider name.
     *
     * @return string
     */
    public function get_name(): string;

    /**
     * Provider slug (used in settings storage).
     *
     * @return string
     */
    public function get_slug(): string;
}
```

---

### `includes/notifications/interfaces/interface-bookit-sms-provider.php` — CREATE

```php
<?php
/**
 * SMS provider interface.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

interface Bookit_SMS_Provider_Interface {

    /**
     * Send an SMS message.
     *
     * @param string $to_phone E.164 phone number, e.g. +447911123456.
     * @param string $message  Message body.
     *
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function send( string $to_phone, string $message ): bool|\WP_Error;

    /**
     * Whether this provider is configured and ready to send.
     *
     * @return bool
     */
    public function is_configured(): bool;

    /**
     * Human-readable provider name.
     *
     * @return string
     */
    public function get_name(): string;

    /**
     * Provider slug.
     *
     * @return string
     */
    public function get_slug(): string;
}
```

---

### `includes/notifications/providers/class-bookit-brevo-email-provider.php` — CREATE

Create the directory `includes/notifications/providers/` if it does not exist.

```php
<?php
/**
 * Brevo transactional email provider.
 *
 * Uses the getbrevo/brevo-php v4 SDK to send transactional emails.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Bookit_Brevo_Email_Provider implements Bookit_Email_Provider_Interface {

    /**
     * {@inheritdoc}
     */
    public function get_name(): string {
        return 'Brevo';
    }

    /**
     * {@inheritdoc}
     */
    public function get_slug(): string {
        return 'brevo';
    }

    /**
     * {@inheritdoc}
     *
     * Returns true when brevo_api_key is set in wp_bookings_settings.
     */
    public function is_configured(): bool {
        $api_key = bookit_get_setting( 'brevo_api_key', '' );
        return ! empty( trim( (string) $api_key ) );
    }

    /**
     * {@inheritdoc}
     *
     * Sends via Brevo TransactionalEmailsApi using the v4 SDK.
     *
     * @throws nothing — all exceptions are caught and returned as WP_Error.
     */
    public function send( array $to, string $subject, string $html_body, array $params = [] ): bool|\WP_Error {
        $api_key    = bookit_get_setting( 'brevo_api_key', '' );
        $from_name  = bookit_get_setting( 'brevo_from_name', get_bloginfo( 'name' ) );
        $from_email = bookit_get_setting( 'brevo_from_email', get_option( 'admin_email' ) );

        if ( empty( trim( (string) $api_key ) ) ) {
            return new \WP_Error(
                'brevo_not_configured',
                __( 'Brevo API key is not configured.', 'booking-system' )
            );
        }

        try {
            $config = \Brevo\Client\Configuration::getDefaultConfiguration()
                ->setApiKey( 'api-key', $api_key );

            $api_instance = new \Brevo\Client\Api\TransactionalEmailsApi(
                new \GuzzleHttp\Client(),
                $config
            );

            $email = new \Brevo\Client\Model\SendSmtpEmail();
            $email->setSender( [
                'email' => sanitize_email( $from_email ),
                'name'  => sanitize_text_field( $from_name ),
            ] );
            $email->setTo( [ [
                'email' => sanitize_email( $to['email'] ),
                'name'  => sanitize_text_field( $to['name'] ?? '' ),
            ] ] );
            $email->setSubject( $subject );
            $email->setHtmlContent( $html_body );

            // Optional template ID override from $params.
            if ( ! empty( $params['template_id'] ) ) {
                $email->setTemplateId( (int) $params['template_id'] );
            }

            $api_instance->sendTransacEmail( $email );

            return true;

        } catch ( \Brevo\Client\ApiException $e ) {
            // Distinguish rate-limit responses so the dispatcher can
            // reschedule without consuming a retry attempt.
            if ( 429 === $e->getCode() ) {
                return new \WP_Error(
                    'brevo_rate_limited',
                    __( 'Brevo rate limit reached (429). Will retry shortly.', 'booking-system' )
                );
            }

            return new \WP_Error(
                'brevo_send_failed',
                sprintf(
                    /* translators: %s: exception message */
                    __( 'Brevo send failed: %s', 'booking-system' ),
                    $e->getMessage()
                )
            );

        } catch ( \Exception $e ) {
            return new \WP_Error(
                'brevo_send_exception',
                sprintf(
                    /* translators: %s: exception message */
                    __( 'Brevo unexpected error: %s', 'booking-system' ),
                    $e->getMessage()
                )
            );
        }
    }
}
```

---

### `includes/notifications/providers/class-bookit-wp-mail-fallback-provider.php` — CREATE

```php
<?php
/**
 * WordPress mail fallback email provider.
 *
 * Wraps wp_mail() and is always available as the default provider when
 * no third-party API key is configured.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Bookit_WP_Mail_Fallback_Provider implements Bookit_Email_Provider_Interface {

    /**
     * {@inheritdoc}
     */
    public function get_name(): string {
        return 'WordPress Mail';
    }

    /**
     * {@inheritdoc}
     */
    public function get_slug(): string {
        return 'wp_mail';
    }

    /**
     * {@inheritdoc}
     *
     * wp_mail is always available.
     */
    public function is_configured(): bool {
        return true;
    }

    /**
     * {@inheritdoc}
     *
     * Sends via wp_mail() with HTML content-type header.
     */
    public function send( array $to, string $subject, string $html_body, array $params = [] ): bool|\WP_Error {
        $headers = [ 'Content-Type: text/html; charset=UTF-8' ];

        $sent = wp_mail(
            sanitize_email( $to['email'] ),
            $subject,
            $html_body,
            $headers
        );

        if ( ! $sent ) {
            return new \WP_Error(
                'wp_mail_failed',
                __( 'wp_mail() returned false. Check your server mail configuration.', 'booking-system' )
            );
        }

        return true;
    }
}
```

---

### `includes/notifications/providers/class-bookit-brevo-sms-provider.php` — CREATE

This is a stub only. No HTTP calls are made. Full implementation is deferred to Sprint 5.

```php
<?php
/**
 * Brevo SMS provider stub.
 *
 * Full implementation is deferred to Sprint 5 when Brevo SMS credentials
 * are available in the live environment.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Bookit_Brevo_SMS_Provider implements Bookit_SMS_Provider_Interface {

    /**
     * {@inheritdoc}
     */
    public function get_name(): string {
        return 'Brevo SMS';
    }

    /**
     * {@inheritdoc}
     */
    public function get_slug(): string {
        return 'brevo';
    }

    /**
     * {@inheritdoc}
     *
     * Returns true only when brevo_sms_api_key is set.
     */
    public function is_configured(): bool {
        $key = bookit_get_setting( 'brevo_sms_api_key', '' );
        return ! empty( trim( (string) $key ) );
    }

    /**
     * {@inheritdoc}
     *
     * Stub: logs the attempt and returns true without making any HTTP call.
     * Full Brevo SMS implementation deferred to Sprint 5.
     */
    public function send( string $to_phone, string $message ): bool|\WP_Error {
        error_log( sprintf(
            '[Bookit] Brevo SMS stub: would send to %s — "%s"',
            $to_phone,
            substr( $message, 0, 80 )
        ) );
        return true;
    }
}
```

---

### `includes/class-bookit-loader.php` — MODIFY

In `load_dependencies()`, add requires for both interfaces and all three provider files. Load the interfaces **before** the providers (providers implement the interfaces). Load the providers before any dispatcher file (which arrives in Task 2).

Follow the exact `require_once` pattern already used in `load_dependencies()`. Add the new requires in a clearly commented block, for example:

```php
// Notification provider interfaces.
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/interfaces/interface-bookit-email-provider.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/interfaces/interface-bookit-sms-provider.php';

// Notification provider implementations.
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/providers/class-bookit-brevo-email-provider.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/providers/class-bookit-wp-mail-fallback-provider.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/providers/class-bookit-brevo-sms-provider.php';
```

Verify the `BOOKIT_PLUGIN_DIR` constant is the correct constant used in this file. If a different constant or `__DIR__` pattern is used, match it exactly.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new DB table in this task — migration is Task 2
- [ ] No new error codes in this task — errors are plain `WP_Error` objects
- [ ] No new REST endpoints in this task
- [ ] `bookit_get_setting()` helper is used to read from `wp_bookings_settings` — confirm this function exists before using it; if it has a different name, use the correct one

---

## PHPUNIT REQUIREMENTS

**Baseline: 721 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-provider-interfaces.php`

Required test cases:

- `test_brevo_provider_is_not_configured_without_api_key` — set `brevo_api_key` to empty string in test settings, call `Bookit_Brevo_Email_Provider::is_configured()`, assert returns `false`
- `test_brevo_provider_is_configured_with_api_key` — set `brevo_api_key` to a non-empty string, assert `is_configured()` returns `true`
- `test_wp_mail_fallback_is_always_configured` — call `Bookit_WP_Mail_Fallback_Provider::is_configured()`, assert returns `true` regardless of settings
- `test_brevo_sms_is_not_configured_without_key` — set `brevo_sms_api_key` to empty, assert `Bookit_Brevo_SMS_Provider::is_configured()` returns `false`
- `test_brevo_sms_stub_send_returns_true` — call `Bookit_Brevo_SMS_Provider::send('+447911123456', 'Test')`, assert returns `true` without making any HTTP call
- `test_provider_slugs_are_correct` — assert `get_slug()` returns `'brevo'`, `'wp_mail'`, `'brevo'` for the three providers respectively
- `test_wp_mail_fallback_send_returns_wp_error_on_failure` — use a filter on `wp_mail` to make it return `false`, assert `send()` returns `WP_Error` with code `wp_mail_failed`

Note: Brevo email `send()` is not unit-tested with a live HTTP call. The `test_brevo_provider_is_configured_*` tests are sufficient for this task. Provider send integration is covered by the mock-based dispatcher tests in Task 5.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `Bookit_Email_Provider_Interface` exists and is correctly defined with `send()`, `is_configured()`, `get_name()`, `get_slug()` signatures
- [ ] `Bookit_SMS_Provider_Interface` exists and is correctly defined with `send()`, `is_configured()`, `get_name()`, `get_slug()` signatures
- [ ] `Bookit_Brevo_Email_Provider::is_configured()` returns `false` when `brevo_api_key` is empty, `true` when set
- [ ] `Bookit_Brevo_Email_Provider::send()` returns `WP_Error` with code `brevo_rate_limited` on 429 from Brevo
- [ ] `Bookit_WP_Mail_Fallback_Provider::is_configured()` always returns `true`
- [ ] `Bookit_WP_Mail_Fallback_Provider::send()` calls `wp_mail()` with `Content-Type: text/html` header
- [ ] `Bookit_Brevo_SMS_Provider::send()` returns `true` without making any HTTP call
- [ ] All four new files are loaded in `load_dependencies()` in the correct order (interfaces before providers)
- [ ] `composer update` completes without errors; `vendor/getbrevo` directory exists

### Technical
- [ ] No PHP warnings or notices
- [ ] All new classes implement their respective interfaces (PHP will throw a fatal error if not)
- [ ] `bookit_get_setting()` (or equivalent) is used for all settings reads — no direct `get_option()` for plugin-specific settings
- [ ] PHPUnit suite passes (721+ tests, 0 failures)

### Must NOT break
- [ ] Existing email sending in `class-email-sender.php` — Task 5 replaces it; for now it must still function unchanged
- [ ] All existing 721 PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4H, Task 1: Provider interfaces + scaffold

- Add Bookit_Email_Provider_Interface and Bookit_SMS_Provider_Interface
- Implement Bookit_Brevo_Email_Provider (full send via SDK v4, 429 handled)
- Implement Bookit_WP_Mail_Fallback_Provider (wp_mail wrapper)
- Add Bookit_Brevo_SMS_Provider stub (no-op, Sprint 5 deferred)
- Add getbrevo/brevo-php ^4.0 to composer.json
- Wire all four files in load_dependencies()
- 7 new PHPUnit tests

Tests: 728 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.