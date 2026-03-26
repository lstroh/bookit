Good — I can see the Task 2 dispatcher implementation in project knowledge. Now I have everything needed for Task 3. Since Task 2 already scaffolded `handle_send_failure()` with the retry and 429 logic, Task 3 is genuinely additive: it only needs to layer in the **rate limiter** and the **exception class** on top of what's already there. Let me generate the prompt.

---

## Sprint 4H — Task 3 of 5: Retry Hardening, Rate Limiting + Exception Class

```
TASK 3 OF 5: Retry Hardening, Rate Limiting + Exception Class
Sprint: 4H | Est: ~5h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/notifications/class-bookit-notification-dispatcher.php` — read the full file. `handle_send_failure()` was implemented in Task 2 with retry and 429 logic. You will be modifying `process_email_queue_item()` to add the rate limiter check **before** the provider send call, and confirming the existing retry delays and 429 path are correct.
2. `includes/notifications/class-bookit-email-queue.php` — read fully. `update_status()` signature is `update_status( int $id, string $status, array $extra = [] )`. You will be calling it from the rate limiter path.
3. `includes/functions-notifications.php` — read fully. `bookit_enqueue_email()` already handles the AS/WP-Cron scheduling. The rate limiter reschedule path must call the same scheduler logic — read how `schedule_queue_processing()` (or equivalent private helper) works in the dispatcher so you don't duplicate it.
4. `includes/class-bookit-loader.php` — find where `require_once` calls are grouped for notifications. You will add one new require here for the exception class.

If any file does not exist or differs from what is described, stop and report back before proceeding.

---

## CONTEXT

Task 2 built the queue infrastructure and scaffolded retry/429 handling in `handle_send_failure()`. Task 3 completes the robustness layer with two additions: a transient-based per-minute rate limiter inserted into `process_email_queue_item()` before the send call, and a custom `Bookit_Notification_Exception` class for structured exception handling within the notification system. No new files beyond the exception class — all other changes are modifications to the dispatcher.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/notifications/class-bookit-notification-exception.php` — CREATE

```php
<?php
/**
 * Notification exception.
 *
 * Thrown internally within the notification system to carry context
 * about which queue item and email type triggered the failure.
 *
 * @package Bookit_Booking_System
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Bookit_Notification_Exception extends \RuntimeException {

    /**
     * @param string          $message    Exception message.
     * @param string          $email_type The email type that triggered this exception.
     * @param int             $queue_id   The queue row ID.
     * @param int             $code       Exception code.
     * @param \Throwable|null $previous   Previous exception.
     */
    public function __construct(
        string $message,
        private readonly string $email_type = '',
        private readonly int $queue_id = 0,
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct( $message, $code, $previous );
    }

    /**
     * The email type associated with this exception.
     *
     * @return string
     */
    public function get_email_type(): string {
        return $this->email_type;
    }

    /**
     * The queue row ID associated with this exception.
     *
     * @return int
     */
    public function get_queue_id(): int {
        return $this->queue_id;
    }
}
```

---

### `includes/notifications/class-bookit-notification-dispatcher.php` — MODIFY

Read the full file first. Make the following two changes only — do not alter any logic that is already working.

**Change 1: Add the rate limiter check to `process_email_queue_item()`**

After the row is fetched and confirmed as `'pending'`, and **before** the `update_status( $queue_id, 'processing' )` call, insert the rate limiter block:

```php
// ── Per-minute rate limiter ──────────────────────────────────────────────
$rate_key = 'bookit_email_rate_' . gmdate( 'YmdHi' );
$rate_count = (int) get_transient( $rate_key );
$rate_cap   = (int) self::get_setting( 'email_rate_limit_per_minute', 30 );

if ( $rate_count >= $rate_cap ) {
    // Cap reached — push to start of next minute without consuming a retry.
    $next_minute_ts = (int) ( ceil( time() / 60 ) * 60 );
    Bookit_Email_Queue::update_status(
        $queue_id,
        'pending',
        array( 'scheduled_at' => gmdate( 'Y-m-d H:i:s', $next_minute_ts ) )
    );
    self::schedule_queue_processing( $queue_id, $next_minute_ts );
    return;
}
set_transient( $rate_key, $rate_count + 1, 90 ); // 90s TTL covers minute boundary overlap
// ── End rate limiter ─────────────────────────────────────────────────────
```

**Important:** The rate limiter reads `email_rate_limit_per_minute` from `wp_bookings_settings`. The dispatcher already has a `get_setting()` pattern (either a private static helper or direct `$wpdb->get_var()` calls). Use whichever pattern is already in the file — do not introduce a different pattern. If the dispatcher uses direct `$wpdb->get_var()`, use that. If it delegates to `Bookit_Brevo_Email_Provider::get_setting()`, add a private static `get_setting()` to the dispatcher instead (copy the exact same `$wpdb->get_var()` implementation from the provider).

**Change 2: Verify `handle_send_failure()` retry delays are correct**

While reading the file, confirm the delay map in `handle_send_failure()` uses these exact values:
- attempt 1 → 300 seconds (5 minutes)
- attempt 2 → 1800 seconds (30 minutes)  
- attempt 3 → 7200 seconds (2 hours)

If the values are already correct, make no change. If they differ, correct them and note it in the commit message.

---

### `includes/class-bookit-loader.php` — MODIFY

In `load_dependencies()`, after the existing notification dispatcher require, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/class-bookit-notification-exception.php';
```

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new DB table in this task
- [ ] No new REST endpoints
- [ ] `email_rate_limit_per_minute` setting read from `wp_bookings_settings` — no default row needs inserting (falls back to 30 via `get_setting()` default parameter)

---

## PHPUNIT REQUIREMENTS

**Baseline: 739 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-notification-retry.php`

Required test cases:

- `test_rate_limiter_blocks_when_cap_reached` — set a transient `bookit_email_rate_{YmdHi}` to value `30`, insert a pending queue row, call `process_email_queue_item()`, assert row status is still `'pending'` (not `'processing'` or `'sent'`) and `scheduled_at` has been pushed forward
- `test_rate_limiter_increments_transient_on_send` — ensure transient is absent (delete it), insert a pending queue row, mock or stub the provider so `send()` returns `true`, call `process_email_queue_item()`, assert transient value is now `1`
- `test_rate_limiter_does_not_increment_attempts` — set transient to cap, insert pending row, call `process_email_queue_item()`, assert `attempts` column is still `0`
- `test_429_does_not_increment_attempts` — insert a pending row with `attempts = 0`, directly call `handle_send_failure()` (make it accessible via a test subclass or reflection, or test it indirectly by mocking the provider to return `WP_Error('brevo_rate_limited', '...')` and calling `process_email_queue_item()`), assert `attempts` is still `0` after the call and status is `'pending'`
- `test_retry_attempt_1_uses_300s_delay` — insert pending row with `attempts = 0`, trigger a non-rate-limited failure (return `WP_Error('wp_mail_failed', '...')`), assert row status is `'pending'`, assert `scheduled_at` is approximately `NOW() + 300` (within 5 seconds tolerance)
- `test_retry_attempt_2_uses_1800s_delay` — same but row starts with `attempts = 1`, assert `scheduled_at` is approximately `NOW() + 1800`
- `test_final_failure_marks_failed_and_fires_hook` — insert row with `attempts = 2`, `max_attempts = 3`, trigger failure, assert status is `'failed'`, assert `last_error` is non-empty, assert `bookit_email_permanently_failed` action was fired (use `did_action()`)
- `test_notification_exception_carries_context` — instantiate `Bookit_Notification_Exception('Test', 'customer_confirmation', 42)`, assert `get_email_type()` returns `'customer_confirmation'` and `get_queue_id()` returns `42`

**Note on testing `handle_send_failure()` directly:** If the method is `private`, test it indirectly by inserting a queue row in a known state and calling `process_email_queue_item()` with a provider that returns a specific `WP_Error`. Do not change the visibility of `handle_send_failure()` just for testing — indirect testing via the public method is correct here.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Rate limiter blocks sends when transient count >= cap, pushes `scheduled_at` to start of next minute
- [ ] Rate limiter does not increment `attempts` when blocking
- [ ] Rate limiter transient key is per-minute: `bookit_email_rate_{YmdHi}`
- [ ] Rate limiter transient TTL is 90 seconds
- [ ] Default cap of 30 is used when `email_rate_limit_per_minute` is not set in `wp_bookings_settings`
- [ ] 429 response from Brevo does not increment `attempts` (already in Task 2 — confirm still correct)
- [ ] Final failure (attempts >= max_attempts) fires `bookit_email_permanently_failed` action
- [ ] `Bookit_Notification_Exception` is instantiable with `message`, `email_type`, `queue_id`
- [ ] `get_email_type()` and `get_queue_id()` return correct values

### Technical
- [ ] No PHP warnings or notices
- [ ] Rate limiter block is inserted **before** `update_status('processing')` — a blocked item must never be marked `processing`
- [ ] `Bookit_Notification_Exception` extends `\RuntimeException`
- [ ] `email_type` and `queue_id` are `readonly` properties
- [ ] PHPUnit suite passes (739+ tests, 0 failures)

### Must NOT break
- [ ] Task 2 queue insert, status update, provider resolution behaviour
- [ ] All 739 existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4H, Task 3: Rate limiter + notification exception class

- Add per-minute transient rate limiter to process_email_queue_item()
- Rate limiter pushes scheduled_at to next minute boundary, never increments attempts
- Add Bookit_Notification_Exception with email_type and queue_id context
- Wire exception class in load_dependencies()
- 8 new PHPUnit tests

Tests: 747 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.