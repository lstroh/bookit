Good — I have a clear picture of all the call sites. Key findings:

- `class-dashboard-bookings-api.php` — instantiates `Booking_System_Email_Sender` directly for manual bookings
- `class-payment-processor.php` — instantiates it for pay-on-arrival and package redemption paths
- `class-stripe-webhook.php` — does **not** instantiate `Booking_System_Email_Sender` directly; it fires `bookit_after_booking_created` and lets other code handle emails
- `booking-confirmed.php` — need to verify if it sends emails directly

Here is the Task 5 prompt.

---

## Sprint 4H — Task 5 of 5: Replace Existing Email Calls + Tests

```
TASK 5 OF 5: Replace Existing Email Calls + Tests
Sprint: 4H | Est: ~4h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/email/class-email-sender.php` — full file. Read `send_customer_confirmation()`, `send_business_notification()`, `generate_customer_email()`, `generate_business_email()`. The generate methods must remain intact. Only the send methods are updated.
2. `includes/api/class-dashboard-bookings-api.php` — search for `Booking_System_Email_Sender` instantiations. There is one in the manual booking creation path (inside the `if ( $send_confirmation )` block). Read the full surrounding context — the booking array that's passed to the email sender already has `customer_email`, `customer_first_name`, `customer_last_name`, `service_name`, `staff_name` etc.
3. `includes/payment/class-payment-processor.php` — full file. There are `Booking_System_Email_Sender` instantiations in the pay-on-arrival path and the package redemption path. Read both carefully — they use `$booking_retriever->get_booking_by_id()` to fetch the full booking before calling the sender. That booking array shape must be understood before writing the replacement.
4. `public/templates/booking-confirmed.php` — read the full file. Confirm whether it instantiates `Booking_System_Email_Sender` directly. If it does, replace it. If it does not (emails may already be sent upstream at booking creation), note this and make no change.
5. `includes/api/class-stripe-webhook.php` — confirm it does NOT instantiate `Booking_System_Email_Sender` directly (it fires `bookit_after_booking_created` instead). If correct, no change needed here.
6. `includes/notifications/class-bookit-notification-dispatcher.php` — read `enqueue_email()` and confirm its full signature: `enqueue_email( string $email_type, array $recipient, string $subject, string $html_body, int $booking_id = 0, array $params = [], int $delay_seconds = 0 )`.
7. `includes/functions-notifications.php` — confirm `bookit_enqueue_email()` exists and its signature matches the above.

If any file does not exist or differs from what is described, stop and report back before proceeding.

---

## CONTEXT

This is the final task of Sprint 4H. It wires the notification infrastructure built in Tasks 1–4 into the actual booking flow. The strategy is to update `send_customer_confirmation()` and `send_business_notification()` in `class-email-sender.php` to enqueue via the dispatcher rather than call `wp_mail()` directly. This means all existing call sites (`class-dashboard-bookings-api.php`, `class-payment-processor.php`) automatically benefit from the new queue without needing to be changed — they still call the same email sender methods. The `generate_customer_email()` and `generate_business_email()` methods remain completely untouched.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/email/class-email-sender.php` — MODIFY

**Update `send_customer_confirmation()`** — replace the `wp_mail()` call with a dispatcher enqueue. Keep the test bypass filter (`bookit_send_email`), keep the method signature, keep the return type. The method now returns the queue row ID cast to bool (truthy int = true, false = false), or `WP_Error` on failure.

Replace the `wp_mail()` block with:

```php
$recipient = array(
    'email' => sanitize_email( $booking['customer_email'] ),
    'name'  => trim(
        ( $booking['customer_first_name'] ?? '' ) . ' ' .
        ( $booking['customer_last_name'] ?? '' )
    ),
);

$html_body = $this->generate_customer_email( $booking );

$queue_id = bookit_enqueue_email(
    'customer_confirmation',
    $recipient,
    $subject,
    $html_body,
    (int) ( $booking['id'] ?? 0 )
);

if ( false === $queue_id ) {
    if ( self::should_log() ) {
        error_log( 'Email Sender: Failed to enqueue customer confirmation for ' . $booking['customer_email'] );
    }
    return new \WP_Error( 'email_queue_failed', 'Failed to queue confirmation email' );
}

if ( self::should_log() ) {
    error_log( 'Email Sender: Customer confirmation queued (queue_id=' . $queue_id . ') for ' . $booking['customer_email'] );
}
return true;
```

Remove the `$body` variable and the `$headers` array that were previously used for `wp_mail()` — they are no longer needed. Keep `$subject` as it is already built before the send block.

**Update `send_business_notification()`** — same pattern:

```php
$admin_email = get_option( 'admin_email' );
$recipient   = array(
    'email' => $admin_email,
    'name'  => get_bloginfo( 'name' ),
);

$html_body = $this->generate_business_email( $booking );

$queue_id = bookit_enqueue_email(
    'business_notification',
    $recipient,
    $subject,
    $html_body,
    (int) ( $booking['id'] ?? 0 )
);

if ( false === $queue_id ) {
    if ( self::should_log() ) {
        error_log( 'Email Sender: Failed to enqueue business notification' );
    }
    return new \WP_Error( 'email_queue_failed', 'Failed to queue business notification email' );
}

if ( self::should_log() ) {
    error_log( 'Email Sender: Business notification queued (queue_id=' . $queue_id . ')' );
}
return true;
```

**Do NOT modify:**
- `generate_customer_email()` — untouched
- `generate_business_email()` — untouched
- Any other method in the class
- The `bookit_send_email` filter bypass at the top of both send methods — keep it exactly as-is

---

### `includes/api/class-dashboard-bookings-api.php` — no change required

The existing call to `$email_sender->send_customer_confirmation( $booking )` and `$email_sender->send_business_notification( $booking )` will automatically use the new queue path once `class-email-sender.php` is updated. No changes needed here.

### `includes/payment/class-payment-processor.php` — no change required

Same reasoning — the existing calls to `send_customer_confirmation()` and `send_business_notification()` will automatically route through the queue.

### `includes/api/class-stripe-webhook.php` — no change required

Confirmed: does not call `Booking_System_Email_Sender` directly.

### `public/templates/booking-confirmed.php` — verify only

Read the file. If it instantiates `Booking_System_Email_Sender` directly and calls send methods, replace those calls using the same enqueue pattern. If it does not (which is expected based on the codebase review), make no change and note this in the commit message.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new DB table or migration
- [ ] No new REST endpoints
- [ ] `bookit_enqueue_email()` must be available at the point `send_customer_confirmation()` is called — confirm `functions-notifications.php` is loaded before `class-email-sender.php` in `load_dependencies()`. If not, reorder the requires.

---

## PHPUNIT REQUIREMENTS

**Baseline: 753 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-notification-dispatcher.php`

Required test cases:

- `test_send_customer_confirmation_enqueues_pending_row` — call `send_customer_confirmation()` with a minimal valid booking array, assert a row exists in `wp_bookit_email_queue` with `email_type = 'customer_confirmation'` and `status = 'pending'`
- `test_send_business_notification_enqueues_pending_row` — same for `business_notification`
- `test_send_customer_confirmation_returns_true_on_success` — assert the method returns `true` (not a WP_Error) when enqueue succeeds
- `test_send_customer_confirmation_does_not_call_wp_mail` — add a filter on `pre_wp_mail` that records if it was called; call `send_customer_confirmation()`; assert `pre_wp_mail` was never triggered
- `test_process_item_marks_sent_on_provider_success` — insert a pending queue row, call `Bookit_Notification_Dispatcher::process_email_queue_item()` with a mocked provider (use `add_filter('pre_wp_mail', fn() => true)` so the wp_mail fallback succeeds), assert row status becomes `'sent'`
- `test_process_item_marks_failed_after_max_attempts` — insert a pending row with `max_attempts = 1`, mock the provider to fail (`add_filter('pre_wp_mail', fn() => false)`), call `process_email_queue_item()`, assert status becomes `'failed'`
- `test_bookit_send_email_filter_bypasses_queue` — add filter `bookit_send_email` returning `false`, call `send_customer_confirmation()`, assert no row was inserted in the queue table

**Note on mocking the provider:** In test environment, `resolve_email_provider()` will return `Bookit_WP_Mail_Fallback_Provider` (no Brevo key configured). To control its behaviour, use `add_filter('pre_wp_mail', ...)` to make `wp_mail()` return `true` or `false` as needed. Remove the filter in `tearDown()`.

All tests must clean up `wp_bookit_email_queue` rows in `tearDown()`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Creating a manual booking in the dashboard with "Send confirmation" checked results in a row appearing in `wp_bookit_email_queue` with `status = 'pending'`
- [ ] Completing a pay-on-arrival booking results in queue rows for both `customer_confirmation` and `business_notification`
- [ ] `send_customer_confirmation()` no longer calls `wp_mail()` directly
- [ ] `send_business_notification()` no longer calls `wp_mail()` directly
- [ ] `generate_customer_email()` and `generate_business_email()` are unchanged and still produce correct HTML
- [ ] Existing tests for email content (e.g. `test-package-email.php`) still pass — they test `generate_customer_email()` which is untouched

### Technical
- [ ] No PHP warnings or notices
- [ ] `bookit_enqueue_email()` is loaded before `class-email-sender.php` calls it
- [ ] `bookit_send_email` filter bypass still works — returning `false` skips the queue entirely
- [ ] PHPUnit suite passes (753+ tests, 0 failures)

### Must NOT break
- [ ] `test-package-email.php` tests — they call `send_customer_confirmation()` via `pre_wp_mail` filter capture; after this change the filter will no longer fire. **These tests will break** unless updated. Read `test-package-email.php` and update `send_customer_email_and_capture()` to capture the HTML body from `generate_customer_email()` directly rather than via `pre_wp_mail`. The simplest fix: call `$this->email_sender->generate_customer_email( $booking )` directly in those tests instead of `send_customer_confirmation()` + `pre_wp_mail` capture.
- [ ] All other 753 existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4H, Task 5: Route email sends through notification queue

- send_customer_confirmation() now enqueues via bookit_enqueue_email()
- send_business_notification() now enqueues via bookit_enqueue_email()
- generate_customer_email() and generate_business_email() unchanged
- booking-confirmed.php: no direct email calls found, no change needed
- Update test-package-email.php to capture HTML via generate_customer_email() directly
- 7 new PHPUnit tests in test-notification-dispatcher.php

Tests: 760 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.