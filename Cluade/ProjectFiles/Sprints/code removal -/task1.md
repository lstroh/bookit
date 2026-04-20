Confirmed. The PA decision is clear and the scope is well-defined. Let me produce the Cursor prompt now.I have everything I need. I can see the exact code structure at the two live call sites in `class-payment-processor.php`, the stale comment in `class-dashboard-bookings-api.php`, and the test file patterns. Here is the Cursor prompt.

---

```
TASK 1 OF 8: Remove send_business_notification() — migrate remaining call sites
Sprint: Code Review | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/payment/class-payment-processor.php` — read in full; you are removing two call sites from the pay-on-arrival and package-redemption flows
2. `public/templates/booking-confirmed.php` — read in full; you are removing the V1 template call at line 75
3. `includes/email/class-email-sender.php` — read in full; you are removing `send_business_notification()` and `generate_business_email()` entirely
4. `includes/api/class-dashboard-bookings-api.php` — locate the Sprint 6A-8 replacement comment block; you are replacing it with a cleaner comment
5. `includes/api/class-stripe-webhook.php` — read `send_booking_confirmation_emails_after_webhook()` to confirm no call to `send_business_notification()` exists; no changes expected
6. `tests/unit/test-notification-dispatcher.php` — read in full; you are removing or replacing `test_send_business_notification_enqueues_pending_row()`
7. `tests/test-payment-success.php` — read in full; you are removing or replacing `test_sends_business_notification_email()`

If any file does not exist at the path given, stop and report back before proceeding.

---

## CONTEXT

`send_business_notification()` was retired from the dashboard manual booking path and the Stripe webhook path in Sprint 6A-8. Two live call sites in the payment processor and the V1 booking confirmation template were not migrated at that time. The PA has confirmed that `process_pay_on_arrival()` already fires `do_action('bookit_after_booking_created')` before both remaining calls, which means `Bookit_Staff_Notifier` already handles notification on those paths — the calls are therefore duplicates that cause a double-notification bug. This task removes the duplicates, removes the method itself, and updates the two PHPUnit tests that were testing the now-removed method.

Baseline: **986 tests, 0 failures.** This must not regress. The test count may decrease by up to 2 if tests are removed, or stay the same if they are replaced — either is acceptable provided 0 failures.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/payment/class-payment-processor.php` — MODIFY

- Locate the `send_business_notification()` call inside the pay-on-arrival email block (after the `do_action('bookit_after_booking_created')` call). From what you read, this is the `$business_result = $email_sender->send_business_notification($booking)` call along with its `is_wp_error` error log guard.
- Remove that call and its error log guard entirely.
- Add a single comment line in its place:
  `// Staff notification handled by Bookit_Staff_Notifier via bookit_after_booking_created hook.`
- Locate the second call site (package redemption flow or a second pay-on-arrival variant at line ~468). Apply the same removal and replacement comment.
- Do not touch `send_customer_confirmation()` — that stays.
- Do not touch the `do_action('bookit_after_booking_created')` call — that must remain.
- Do not change the `$booking_retriever->get_booking_by_id()` call — only remove the `send_business_notification` block.
- If after removing both `send_business_notification` calls the `$email_sender` variable has no remaining uses in a given block, remove the `require_once` and `$email_sender = new Booking_System_Email_Sender()` instantiation for that block too — but only if `send_customer_confirmation` is also not called in that block. Read carefully before deciding.

### `public/templates/booking-confirmed.php` — MODIFY

- Locate the `send_business_notification()` call at line 75 (read the file to confirm exact context).
- Remove the call entirely.
- Add a comment in its place that matches the V2 template pattern:
  `// Email sending intentionally omitted — notifications handled by Bookit_Staff_Notifier via bookit_after_booking_created hook fired by the payment processor.`
- Do not change any other logic in this template.

### `includes/email/class-email-sender.php` — MODIFY

- Locate `send_business_notification()` (the method, not call sites — you have already confirmed there are now no remaining call sites after the above changes).
- Remove the entire method including its docblock.
- Locate `generate_business_email()` (the HTML generation helper called only by `send_business_notification()`).
- Remove the entire method including its docblock.
- Do not touch any other method in this file.
- Before removing, do a final check: search the file for any other reference to `generate_business_email` or `send_business_notification` within the file itself (e.g. in a method list comment or class docblock). Remove those references too.

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

- Locate the two-line Sprint 6A-8 replacement comment:
  ```
  // Business notification removed Sprint 6A-8 — replaced by Bookit_Staff_Notifier
  // which sends to all admin-role staff via their preference settings.
  ```
- Replace it with a single accurate comment:
  ```
  // Staff notifications handled by Bookit_Staff_Notifier via bookit_after_booking_created hook (fired above).
  ```
- This is the only change in this file.

### `includes/api/class-stripe-webhook.php` — VERIFY ONLY

- Read `send_booking_confirmation_emails_after_webhook()`.
- Confirm it contains no call to `send_business_notification()`. (The docblock already states: "Business notifications are handled by Bookit_Staff_Notifier on bookit_after_booking_created.")
- If confirmed clean: no changes. If a call exists: stop and report back.

### `tests/unit/test-notification-dispatcher.php` — MODIFY

- Locate `test_send_business_notification_enqueues_pending_row()`. This test instantiates `Booking_System_Email_Sender` and calls `send_business_notification()` directly on a minimal booking array. The method no longer exists.
- **Replace** this test with a new test that verifies the Staff Notifier path works for the pay-on-arrival equivalent. The replacement test should:
  - Be named `test_poa_booking_created_action_enqueues_staff_notification()`
  - Insert a minimal booking into `wp_bookings` (with a staff member who has a valid email and `is_active = 1`)
  - Fire `do_action('bookit_after_booking_created', $booking_id, $booking_data)`
  - Assert that a row appears in `wp_bookit_email_queue` with `email_type = 'staff_new_booking_immediate'` and `booking_id` matching
  - Follow the exact same setUp/tearDown/helper patterns already established in this file — read those patterns before writing
- Do not remove or modify any other test in this file.

### `tests/test-payment-success.php` — MODIFY

- Locate `test_sends_business_notification_email()`. This test calls `send_business_notification()` and asserts a `business_notification` queue row is inserted. The method no longer exists.
- **Remove** this test. It cannot be cleanly replaced in this file because `test-payment-success.php` tests the Stripe webhook path, and the Staff Notifier coverage for that path is already provided by `test-stripe-v2-wiring.php` (which asserts `business_notification` count = 0, i.e. the legacy method is not called). Removing the test is correct here — it does not leave a coverage gap.
- Do not modify any other test in this file.

---

## PHPUNIT REQUIREMENTS

Baseline: **986 tests, 0 failures** — must not regress below 0 failures.

Test count after this task: 985 or 986 (one test removed in `test-payment-success.php`, one added in `test-notification-dispatcher.php` — net change is 0 or -1 depending on whether the replacement test adds to the count).

Run after all changes:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```

All tests must pass before marking task complete. If count drops below 985, stop and report the cause.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Pay-on-arrival bookings trigger exactly one staff notification (not two) — verifiable by querying `wp_bookit_email_queue` after a test booking; only `staff_new_booking_immediate` rows, no `business_notification` rows
- [ ] Stripe webhook bookings are unaffected — `send_booking_confirmation_emails_after_webhook()` still runs; Staff Notifier still fires via `bookit_after_booking_created`
- [ ] Dashboard manual bookings are unaffected — `create_manual_booking()` still fires `bookit_after_booking_created`; Staff Notifier handles notification
- [ ] V1 booking confirmation template renders without PHP errors

### Technical
- [ ] `send_business_notification()` does not exist anywhere in the codebase after this task
- [ ] `generate_business_email()` does not exist anywhere in the codebase after this task
- [ ] No remaining calls to either method in any PHP file
- [ ] No PHP warnings or notices introduced
- [ ] PHPUnit suite passes (985–986 tests, 0 failures)

### Must NOT break
- [ ] `send_customer_confirmation()` in `class-email-sender.php` — untouched
- [ ] `send_customer_cancellation()` in `class-email-sender.php` — untouched
- [ ] `send_customer_reschedule()` in `class-email-sender.php` — untouched
- [ ] `Bookit_Staff_Notifier` registration in `class-bookit-loader.php` — untouched
- [ ] `bookit_after_booking_created` firing in all payment paths — untouched
- [ ] `test_new_booking_does_not_call_send_business_notification` in `test-dashboard-bookings-api.php` — this test must still pass (it asserts no `business_notification` queue row from the dashboard path, which remains true)
- [ ] `test-stripe-v2-wiring.php` assertion that `business_notification` count = 0 — must still pass

---

## GIT COMMIT MESSAGE

```
Code review Task 1: Remove send_business_notification()

- class-payment-processor.php: removed duplicate calls on POA path;
  Staff Notifier already handles via bookit_after_booking_created hook.
  Fixes double-notification bug on pay-on-arrival bookings.
- booking-confirmed.php: removed V1 template call (side effect on GET;
  notifications already fired by payment processor before redirect)
- class-email-sender.php: removed send_business_notification() and
  generate_business_email() — no remaining call sites
- class-dashboard-bookings-api.php: tightened Sprint 6A-8 comment
- test-notification-dispatcher.php: replaced test of removed method with
  test_poa_booking_created_action_enqueues_staff_notification()
- test-payment-success.php: removed test of removed method (Staff Notifier
  coverage for Stripe path exists in test-stripe-v2-wiring.php)

Tests: 985–986 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.