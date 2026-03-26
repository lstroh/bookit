# SPRINT 4H IMPLEMENTATION PROMPT
## Bookit Booking System — Notification Infrastructure (~22h)

**Sprint:** 4H
**Estimated hours:** ~22h
**PHPUnit baseline:** 721 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)
**No live credentials required** — all testable locally

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

- **GitHub connector** — read every file listed below before writing
  any code. Never assume file contents.
- **Context7 connector** — verify PHP interface patterns and
  Action Scheduler API before implementing.
- **cursor-prompt-generator skill** — use for every Cursor prompt.

---

## SPRINT GOAL

Build the complete notification architecture so that Sprint 5 only needs
to activate it with real credentials — no new infrastructure work in
Sprint 5.

The architecture is a provider abstraction (driver pattern). Each
notification channel (email, SMS) has an interface. Concrete providers
implement the interface. The dispatcher resolves the active provider
from settings at dispatch time, never at construction, so switching
vendors takes effect immediately without code changes.

All sends are queue-first and non-blocking. A booking confirmation
fires a DB write + Action Scheduler job and returns immediately. The
queue worker processes the job asynchronously, with retry on failure.

---

## READ FIRST — ALL FILES

Read every one of these via GitHub before writing any code:

1. `includes/email/class-email-sender.php` — full file; the existing
   email sending class with `send_customer_confirmation()`,
   `send_business_notification()`, `generate_customer_email()`,
   `generate_business_email()`. This is what Task 5 will replace.
2. `includes/class-bookit-loader.php` — full file; how to wire new
   classes in `load_dependencies()` and `define_cron_hooks()`.
3. `composer.json` — current Composer dependencies; Task 1 adds
   `getbrevo/brevo-php` v4.
4. `dashboard/src/views/EmailSettings.vue` — the existing SMTP
   settings page at `/settings/email`. Task 4 REPLACES this page
   with the new provider-based settings. Read the full file to
   understand what settings are currently stored and displayed.
5. `dashboard/src/router/index.js` — confirm `/settings/email` route
   exists; Task 4 will reuse this route.
6. `dashboard/src/components/Sidebar.vue` — confirm `emailSettings`
   nav item exists at `/settings/email`; no sidebar change needed.
7. `database/migrations/0009-add-performance-indexes.php` — read to
   confirm the migration class pattern and highest migration number
   (0009 is the last one; new migration is 0012, as 0010 and 0011
   were reserved in Sprint 4F planning but never committed).
   BEFORE WRITING THE MIGRATION: search project knowledge for
   `0010` and `0011` to confirm whether they exist. If they do,
   use `0013`. Always use the next available number.
8. `includes/api/class-dashboard-bookings-api.php` — find all
   `wp_mail()` calls and `Booking_System_Email_Sender` instantiations
   to understand the full scope of Task 5 replacements.
9. `includes/payment/class-payment-processor.php` — find all
   `Booking_System_Email_Sender` instantiations in the pay-on-arrival
   and use-package paths.
10. `includes/api/class-stripe-webhook.php` — find any direct email
    sending after booking creation.
11. `public/templates/booking-confirmed.php` — find any direct email
    sending on the confirmation page.

If any file does not exist or differs from what is described, stop
and report back before proceeding.

---

## ARCHITECTURAL DECISIONS — DO NOT DEVIATE

**Provider resolution:** The dispatcher reads the active provider slug
from wp_options (or wp_bookings_settings) at dispatch time. It never
caches the provider instance across requests. This means changing the
provider in settings takes effect on the next job.

**Queue-first:** `enqueue_email()` always writes to the DB and
schedules an Action Scheduler job. It never sends synchronously except
in the "send test" bypass path.

**wp_mail fallback:** When no email provider API key is configured,
the WP Mail fallback provider uses `wp_mail()` exactly as the current
code does. Existing behaviour is preserved without any configuration.

**Action Scheduler dependency:** Use `WP_CRON` as fallback if Action
Scheduler is not available (it is a WooCommerce dependency and may not
always be present). Check `function_exists('as_schedule_single_action')`
before calling AS functions; fall back to `wp_schedule_single_event()`.

**Email types:** The following email types are supported in the queue:
- `customer_confirmation` — booking confirmed to customer
- `business_notification` — new booking alert to admin
- `customer_reminder` — 24h reminder to customer (future)
- `customer_cancellation` — booking cancelled to customer (future)
- `customer_reschedule` — booking rescheduled to customer (future)

For this sprint, only `customer_confirmation` and
`business_notification` types are actively wired. The others are
defined in the queue table ENUM but not yet triggered.

---

## TASK 1 OF 5: Interfaces + Provider Scaffold (~3h)

### Composer — add Brevo PHP SDK

Add to `composer.json` require block:
```json
"getbrevo/brevo-php": "^4.0"
```

Run `composer update` to install. The SDK provides
`Brevo\Client\Api\TransactionalEmailsApi` and related classes.

Use Context7 to verify the current `getbrevo/brevo-php` v4 API for
sending transactional emails before writing the Brevo provider class.

### New file: `includes/notifications/interfaces/interface-bookit-email-provider.php`

```php
interface Bookit_Email_Provider_Interface {
    public function send( array $to, string $subject, string $html_body, array $params = [] ): bool|WP_Error;
    public function is_configured(): bool;
    public function get_name(): string;
    public function get_slug(): string;
}
```

`$to` is an associative array: `['email' => '...', 'name' => '...']`
`$params` reserved for provider-specific options (template ID, etc.)

### New file: `includes/notifications/interfaces/interface-bookit-sms-provider.php`

```php
interface Bookit_SMS_Provider_Interface {
    public function send( string $to_phone, string $message ): bool|WP_Error;
    public function is_configured(): bool;
    public function get_name(): string;
    public function get_slug(): string;
}
```

### New file: `includes/notifications/providers/class-bookit-brevo-email-provider.php`

Full implementation using `getbrevo/brevo-php` v4 SDK.

`is_configured()` returns `true` when `brevo_api_key` setting is
non-empty in wp_bookings_settings.

`send()` reads `brevo_api_key` from settings, constructs a
`SendSmtpEmail` object with `to`, `subject`, `htmlContent`, `sender`
(from `brevo_from_name` + `brevo_from_email` settings), and calls
`TransactionalEmailsApi::sendTransacEmail()`. Returns `true` on
success, `WP_Error` on exception.

**Note:** In this sprint the Brevo provider sends raw HTML content
(the existing email HTML from `class-email-sender.php`). Template ID
mapping is deferred to Sprint 5 when Brevo templates are created.

### New file: `includes/notifications/providers/class-bookit-wp-mail-fallback-provider.php`

Wraps the existing `wp_mail()` function exactly. `is_configured()`
always returns `true` (wp_mail is always available). `send()` calls
`wp_mail()` with `Content-Type: text/html` header, returns `true` or
`WP_Error` matching existing email sender behaviour.

### New file: `includes/notifications/providers/class-bookit-brevo-sms-provider.php`

**Stub only.** `is_configured()` checks for `brevo_sms_api_key`
setting (returns false if absent). `send()` logs the attempt and
returns `true` without making any HTTP call. Full implementation
deferred to Sprint 5.

### Register in `load_dependencies()` in `includes/class-bookit-loader.php`

Add requires for all four new provider files and both interfaces.
Load them before the dispatcher (Task 2).

---

## TASK 2 OF 5: Queue Table + Action Scheduler Integration (~6h)

### New migration: `database/migrations/00NN-add-email-queue-table.php`

Where NN is the next available number after searching for existing
migrations (see READ FIRST step 7).

Migration class: `Bookit_Migration_00NN_Add_Email_Queue_Table`

`up()`:
```sql
CREATE TABLE IF NOT EXISTS {$prefix}bookit_email_queue (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id    BIGINT UNSIGNED NULL,
    email_type    VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name  VARCHAR(255) NOT NULL DEFAULT '',
    subject         VARCHAR(500) NOT NULL DEFAULT '',
    html_body       LONGTEXT NOT NULL,
    params          LONGTEXT NULL COMMENT 'JSON — provider-specific params',
    status          ENUM('pending','processing','sent','failed','cancelled')
                    NOT NULL DEFAULT 'pending',
    attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts    TINYINT UNSIGNED NOT NULL DEFAULT 3,
    scheduled_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         DATETIME NULL,
    last_error      TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_status_scheduled (status, scheduled_at),
    KEY idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`down()` drops the table. Guard with `DROP TABLE IF EXISTS`.

### New file: `includes/notifications/class-bookit-email-queue.php`

`Bookit_Email_Queue` class with:
- `insert( array $data ): int|false` — inserts a queue row, returns
  new ID or false on failure
- `update_status( int $id, string $status, array $extra = [] ): void`
  — updates status, increments attempts if transitioning to 'failed',
  sets sent_at if transitioning to 'sent'
- `fetch_pending( int $limit = 10 ): array` — returns rows where
  `status = 'pending'` and `scheduled_at <= NOW()`, ordered by
  `scheduled_at ASC`
- `cancel_for_booking( int $booking_id ): void` — sets status =
  'cancelled' for all pending rows with matching booking_id

### New helper function: `includes/functions-notifications.php`

```php
function bookit_enqueue_email(
    string $email_type,
    array $recipient,
    string $subject,
    string $html_body,
    int $booking_id = 0,
    array $params = [],
    int $delay_seconds = 0
): int|false
```

Inserts into `bookit_email_queue` with `scheduled_at = NOW() + delay`
and schedules an Action Scheduler single action
`bookit_process_email_queue` (or `wp_schedule_single_event` fallback).
Returns the queue row ID or false.

### New file: `includes/notifications/class-bookit-notification-dispatcher.php`

`Bookit_Notification_Dispatcher` class:

`enqueue_email( string $email_type, array $recipient, string $subject, string $html_body, int $booking_id = 0, array $params = [], int $delay_seconds = 0 ): int|false`
— delegates to `bookit_enqueue_email()`.

`process_email_queue_item( int $queue_id ): void`
— fetches the queue row, calls `resolve_email_provider()->send()`,
updates status to 'sent' or 'failed', handles retry scheduling
(see Task 3).

`resolve_email_provider(): Bookit_Email_Provider_Interface`
— reads `email_provider` setting from wp_bookings_settings.
Returns `Bookit_Brevo_Email_Provider` if slug is 'brevo' and
`is_configured()` is true; otherwise returns
`Bookit_WP_Mail_Fallback_Provider`.

`resolve_sms_provider(): Bookit_SMS_Provider_Interface`
— reads `sms_provider` setting. Returns `Bookit_Brevo_SMS_Provider`
if slug is 'brevo'; otherwise returns null (SMS not configured).

### Hook reminder cancellation

In `load_dependencies()` (or a new `define_notification_hooks()`
method), add:

```php
add_action( 'bookit_booking_cancelled', function( int $booking_id ) {
    Bookit_Email_Queue::cancel_for_booking( $booking_id );
} );
add_action( 'bookit_booking_rescheduled', function( int $booking_id ) {
    Bookit_Email_Queue::cancel_for_booking( $booking_id );
} );
add_action( 'bookit_process_email_queue', function( int $queue_id ) {
    Bookit_Notification_Dispatcher::process_email_queue_item( $queue_id );
} );
```

Confirm that `bookit_booking_cancelled` and `bookit_booking_rescheduled`
actions are already fired in the codebase. If not, note it but do not
add them in this sprint — that is a separate concern.

---

## TASK 3 OF 5: Retry, Rate Limiting + 429 Handling (~5h)

### Retry logic in `process_email_queue_item()`

On `send()` failure:
1. Increment `attempts` in the queue row
2. If `attempts < max_attempts`: update status back to 'pending',
   set `scheduled_at` to:
   - Attempt 1 → NOW() + 5 minutes
   - Attempt 2 → NOW() + 30 minutes
   - Attempt 3 → NOW() + 2 hours
   Schedule a new Action Scheduler job for that future time.
3. If `attempts >= max_attempts`: set status = 'failed', set
   `last_error` to the error message, fire:
   ```php
   do_action( 'bookit_email_permanently_failed', $queue_id, $booking_id, $email_type, $last_error );
   ```

### Brevo 429 handling

In `Bookit_Brevo_Email_Provider::send()`, catch HTTP 429 responses
(the Brevo SDK throws `Brevo\Client\ApiException` with code 429).
When caught:
- Do NOT mark as a failed attempt (do not increment attempts)
- Return a special `WP_Error` with code `brevo_rate_limited`
- In `process_email_queue_item()`, check for this code and reschedule
  at NOW() + 60 seconds without incrementing attempts

### Local rate limiter

In `process_email_queue_item()`, before calling `send()`, check a
transient-based rate limiter:

```php
$transient_key = 'bookit_email_rate_' . gmdate( 'YmdHi' ); // per-minute key
$count = (int) get_transient( $transient_key );
$cap = (int) bookit_get_setting( 'email_rate_limit_per_minute', 30 );
if ( $count >= $cap ) {
    // Re-schedule at next minute boundary, don't increment attempts
    // Set scheduled_at = start of next minute
    return;
}
set_transient( $transient_key, $count + 1, 90 ); // 90s TTL covers minute overlap
```

### New exception class: `includes/notifications/class-bookit-notification-exception.php`

```php
class Bookit_Notification_Exception extends RuntimeException {
    public function __construct(
        string $message,
        private readonly string $email_type = '',
        private readonly int $queue_id = 0,
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct( $message, $code, $previous );
    }

    public function get_email_type(): string { return $this->email_type; }
    public function get_queue_id(): int { return $this->queue_id; }
}
```

---

## TASK 4 OF 5: Settings Page + Provider Switching (~4h)

### `dashboard/src/views/EmailSettings.vue` — REPLACE

Read the existing file fully via GitHub first. Then replace it with a
new version that covers both the existing SMTP settings AND the new
provider settings. The existing route `/settings/email` and sidebar
item are unchanged.

**New layout — two sections:**

**Section 1: Email Provider**
- Heading: "Email Provider"
- Provider dropdown: options are 'wp_mail' (label: "WordPress Mail
  (default — no API key needed)") and 'brevo' (label: "Brevo
  (recommended)")
- When 'brevo' selected — show:
  - Brevo API Key (password input, setting key: `brevo_api_key`)
  - From Name (text input, setting key: `brevo_from_name`)
  - From Email (email input, setting key: `brevo_from_email`)
  - Status indicator: green "Connected" when `is_configured` returns
    true, grey "API key required" when not
- When 'wp_mail' selected — show:
  - Info box: "WordPress Mail uses your server's PHP mail() function.
    Emails may arrive in spam. Recommended for testing only."
  - The existing SMTP configuration fields (host, port, encryption,
    username, password, from name, from email) — carry over from the
    existing EmailSettings.vue so no SMTP functionality is lost

**Section 2: SMS Provider**
- Heading: "SMS Provider"
- Provider dropdown: 'none' (label: "Disabled") and 'brevo'
  (label: "Brevo SMS (coming soon)")
- When 'brevo' selected — show:
  - Info box: "Brevo SMS will be activated in a future sprint. Save
    the selection to enable it when available."
  - Brevo SMS API Key (password input, setting key: `brevo_sms_api_key`,
    disabled for now)
- When 'none' selected — nothing additional shown

**Section 3: Test Notifications**
- "Send Test Email" button — sends immediately via dispatcher bypass
  (calls `POST /dashboard/notifications/test-email` endpoint added below)
- "Send Test SMS" button — disabled, tooltip "SMS not yet active"
- Test recipient email input

**Warning banner:**
Show a yellow warning banner at the top of the page if
`email_provider = 'wp_mail'`:
"⚠️ Using WordPress Mail. Emails may not be delivered reliably.
Configure Brevo for production use."

**Settings stored:**
`email_provider`, `brevo_api_key`, `brevo_from_name`,
`brevo_from_email`, `sms_provider`, `brevo_sms_api_key`,
plus all existing SMTP keys (preserved unchanged).

### New REST endpoint for test send

Add to an appropriate existing API file (or new
`includes/api/class-notifications-api.php`):

```
POST /dashboard/notifications/test-email
Body: { "recipient_email": "test@example.com" }
```

Admin only. Bypasses queue — calls `resolve_email_provider()->send()`
directly. Returns `{ success: true }` or error message.

**After implementing Vue changes, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored)

---

## TASK 5 OF 5: Replace Existing Email Calls + Tests (~4h)

### Replace `Booking_System_Email_Sender` calls

Read each file listed below via GitHub, find all direct email sending
calls, and replace them with dispatcher enqueue calls.

**Pattern to replace:**
```php
$email_sender = new Booking_System_Email_Sender();
$email_sender->send_customer_confirmation( $booking );
$email_sender->send_business_notification( $booking );
```

**Replace with:**
```php
// Build recipient and content from $booking data
$recipient = [
    'email' => $booking['customer_email'],
    'name'  => trim( ( $booking['customer_first_name'] ?? '' ) . ' ' .
                     ( $booking['customer_last_name'] ?? '' ) ),
];
$subject = sprintf(
    __( 'Booking Confirmed - %s', 'booking-system' ),
    $booking['service_name'] ?? ''
);
// Generate HTML body using existing generator (kept in class-email-sender.php)
$email_sender = new Booking_System_Email_Sender();
$html_body = $email_sender->generate_customer_email( $booking );

bookit_enqueue_email(
    'customer_confirmation',
    $recipient,
    $subject,
    $html_body,
    (int) ( $booking['id'] ?? 0 )
);

// Business notification
$admin_recipient = [
    'email' => get_option( 'admin_email' ),
    'name'  => get_bloginfo( 'name' ),
];
$business_subject = sprintf(
    __( 'New Booking - %s on %s', 'booking-system' ),
    $booking['service_name'] ?? '',
    $booking['booking_date'] ?? ''
);
$business_html = $email_sender->generate_business_email( $booking );
bookit_enqueue_email(
    'business_notification',
    $admin_recipient,
    $business_subject,
    $business_html,
    (int) ( $booking['id'] ?? 0 )
);
```

**Files to update** (find all `Booking_System_Email_Sender`
instantiations — read each via GitHub first):
- `includes/email/class-email-sender.php` — update
  `send_customer_confirmation()` and `send_business_notification()`
  to use dispatcher internally (keep generate_* methods intact —
  they are still needed to produce the HTML body)
- `includes/payment/class-payment-processor.php` — pay-on-arrival
  and use-package email paths
- `public/templates/booking-confirmed.php` — confirmation page
- `includes/api/class-dashboard-bookings-api.php` — manual booking
  creation email path

**Important:** Do NOT delete or break `generate_customer_email()` and
`generate_business_email()` in `class-email-sender.php`. These methods
are still used by both the dispatcher wrapper and existing tests.

### PHPUnit tests

New test file: `tests/unit/test-notification-dispatcher.php`

Required tests:
- `test_enqueue_email_inserts_queue_row` — calling `bookit_enqueue_email()`
  inserts a row with status='pending' and correct fields
- `test_process_item_marks_sent_on_success` — processing a queue item
  with a mocked provider that returns true sets status='sent'
- `test_process_item_marks_failed_on_provider_error` — provider
  returns WP_Error, status becomes 'failed' after max attempts
- `test_retry_scheduling_on_failure` — after first failure, status
  is back to 'pending' with scheduled_at in the future
- `test_cancel_for_booking_cancels_pending_items` — calling
  `cancel_for_booking()` sets matching pending rows to 'cancelled'
- `test_resolve_provider_returns_fallback_when_brevo_not_configured`
  — when `email_provider = 'brevo'` but no API key, fallback returned
- `test_rate_limiter_prevents_excess_sends` — set transient count to
  cap value, assert that `process_email_queue_item()` reschedules
  rather than sending
- `test_429_does_not_increment_attempts` — Brevo provider returns
  `WP_Error('brevo_rate_limited')`, assert attempts count unchanged

Baseline: 721 tests. Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass. New tests must not use real HTTP calls — mock
provider implementations in test setUp.

---

## SPRINT 4B INFRASTRUCTURE WIRING

| Item | Where |
|------|-------|
| New migration (email queue table) | `database/migrations/00NN-add-email-queue-table.php` |
| Register migration path | Already handled by `functions-migration.php` auto-discovery |
| New setting keys | Stored in existing `wp_bookings_settings` table |
| `bookit_email_permanently_failed` action | Fired in dispatcher on final failure |
| `bookit_process_email_queue` action | Hooked to Action Scheduler job |
| New dependencies loaded | `load_dependencies()` in `class-bookit-loader.php` |

---

## ACCEPTANCE CRITERIA — SPRINT LEVEL

**Provider infrastructure:**
- [ ] `Bookit_Email_Provider_Interface` and `Bookit_SMS_Provider_Interface`
      exist and are correctly defined
- [ ] `Bookit_Brevo_Email_Provider::is_configured()` returns false when
      no API key set, true when key present
- [ ] `Bookit_WP_Mail_Fallback_Provider` sends via `wp_mail()` and is
      always configured
- [ ] `Bookit_Brevo_SMS_Provider::send()` no-ops without error

**Queue:**
- [ ] `wp_bookit_email_queue` table created by migration
- [ ] `bookit_enqueue_email()` inserts a pending row and schedules a job
- [ ] `cancel_for_booking()` cancels pending items for a booking
- [ ] `process_email_queue_item()` calls provider and updates status

**Retry and rate limiting:**
- [ ] Three retry attempts with correct delays (5m, 30m, 2h)
- [ ] 429 response does not increment attempts counter
- [ ] Rate limiter blocks sends over configured cap per minute
- [ ] `bookit_email_permanently_failed` fires on final failure

**Settings page:**
- [ ] `/settings/email` shows email provider dropdown (Brevo / wp_mail)
- [ ] Brevo fields shown/hidden correctly based on provider selection
- [ ] SMS provider section present with 'none' and 'brevo' options
- [ ] Warning banner shown when wp_mail is active
- [ ] All existing SMTP settings preserved and still functional
- [ ] Test send button works (sends immediately via bypass)

**Replacement:**
- [ ] `send_customer_confirmation()` and `send_business_notification()`
      now enqueue rather than send synchronously
- [ ] `generate_customer_email()` and `generate_business_email()` still
      work and are used by the enqueue wrappers
- [ ] No regression on booking confirmation flow
- [ ] Existing tests for email content still pass

**Technical:**
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (721+ tests, 0 failures)
- [ ] `npm run build` passes after Vue changes

---

## GIT COMMIT CONVENTION

```
Sprint 4H, Task [N]: [description]

- [change 1]
- [change 2]

Tests: [N] passing, 0 failures
```

Commit after each task.

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.