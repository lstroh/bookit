I have everything I need. Key findings:

1. **`send_business_notification()` is called in `class-dashboard-bookings-api.php`** inside `create_manual_booking()` when `$send_confirmation` is true — this is the call site to remove.
2. **`send_business_notification()` is also called in `send_booking_confirmation_emails_after_webhook()`** in `class-stripe-webhook.php` — this is a **separate, distinct call site** that must also be evaluated.
3. The `send_business_notification()` method itself in `class-email-sender.php` stays — per spec.
4. The Stripe webhook's `send_booking_confirmation_emails_after_webhook()` calls both `send_customer_confirmation()` AND `send_business_notification()` — the business notification call there also needs removing since `Bookit_Staff_Notifier` now handles it via `bookit_after_booking_created` (which fires in the webhook before `send_booking_confirmation_emails_after_webhook()` is called).

---

```
TASK 4 OF 10: Retire send_business_notification() from New Booking Flow
Sprint: 6A | Est: 1h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-dashboard-bookings-api.php` — Search for `send_business_notification`. Read the full `create_manual_booking()` method. Find the `if ( $send_confirmation )` block — confirm both `send_customer_confirmation()` and `send_business_notification()` are called there.

2. `includes/api/class-stripe-webhook.php` — Search for `send_business_notification`. Read the full `send_booking_confirmation_emails_after_webhook()` private method — confirm it calls both `send_customer_confirmation()` and `send_business_notification()`. Also confirm that `do_action( 'bookit_after_booking_created', ... )` fires BEFORE `send_booking_confirmation_emails_after_webhook()` is called in both `handle_booking_checkout_completed()` and `handle_package_purchase_completed()`.

3. `includes/email/class-email-sender.php` — Confirm `send_business_notification()` method exists. **Do NOT remove or modify this method** — only remove the call sites.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

`Bookit_Staff_Notifier` (6A-3) now handles business notifications for all new bookings by listening to `bookit_after_booking_created`. The old `send_business_notification()` calls create duplicate notifications — one via the old path (to `admin_email`) and one via the new notifier (to all admin-role staff). This task removes the two call sites in the new booking flow only.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

In `create_manual_booking()`, find the `if ( $send_confirmation )` block. It currently calls both:
```php
$email_sender->send_customer_confirmation( $booking );
$email_sender->send_business_notification( $booking );
```

Remove only the `send_business_notification()` call. Leave `send_customer_confirmation()` untouched. Add the replacement comment on the line where the call was:

```php
// Business notification removed Sprint 6A-8 — replaced by Bookit_Staff_Notifier
// which sends to all admin-role staff via their preference settings.
```

### `includes/api/class-stripe-webhook.php` — MODIFY

In `send_booking_confirmation_emails_after_webhook()`, find where `send_business_notification()` is called. Remove that call only. Leave `send_customer_confirmation()` untouched. Add the same replacement comment:

```php
// Business notification removed Sprint 6A-8 — replaced by Bookit_Staff_Notifier
// which sends to all admin-role staff via their preference settings.
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables, migrations, endpoints, or error codes
- [ ] `send_business_notification()` method in `class-email-sender.php` — NOT touched

---

## PHPUNIT REQUIREMENTS

Baseline: **904 tests, 0 failures** — must not regress.

Add one new test to the existing `tests/unit/test-staff-notifier.php` file (or a new file if cleaner — read the existing file first to decide):

- `test_new_booking_does_not_call_send_business_notification`: Create a booking via `POST /dashboard/bookings/create`. Use a mock or spy on `Booking_System_Email_Sender` to assert `send_business_notification()` is NOT called. The simplest approach: add a filter on `bookit_send_email` returning false to suppress all email sending, then assert zero rows with `email_type = 'business_notification'` in `wp_bookit_email_queue` after the booking is created.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Creating a new booking via `POST /dashboard/bookings/create` with `send_confirmation: true` does NOT trigger `send_business_notification()`
- [ ] Creating a new booking via Stripe webhook does NOT trigger `send_business_notification()`
- [ ] Customer confirmation email path (`send_customer_confirmation()`) — unchanged in both flows
- [ ] `send_business_notification()` method still exists in `class-email-sender.php` — not removed
- [ ] Replacement comment present at both removed call sites

### Technical
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (905+ tests, 0 failures)

### Must NOT break
- [ ] Stripe webhook booking creation — still fires `bookit_after_booking_created` (and thus `Bookit_Staff_Notifier`) correctly
- [ ] Dashboard manual booking creation — still fires `bookit_after_booking_created` correctly
- [ ] Customer confirmation emails — still sent in both flows

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 8: Retire send_business_notification() from new booking flow

- Removed send_business_notification() call from create_manual_booking()
  in class-dashboard-bookings-api.php
- Removed send_business_notification() call from
  send_booking_confirmation_emails_after_webhook() in class-stripe-webhook.php
- send_business_notification() method itself preserved in class-email-sender.php
- Bookit_Staff_Notifier now handles admin staff notifications via
  bookit_after_booking_created hook
- Added replacement comments at both removed call sites

Tests: 905 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.