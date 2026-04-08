Let me read the relevant files before writing the prompt.I have everything I need. The pattern from `process_pay_on_arrival()` is clear — retrieve the full booking by ID using `Booking_System_Booking_Retriever`, then call `send_customer_confirmation()` and `send_business_notification()`. The Stripe webhook handlers are missing this entirely. Here is the prompt:

---

```
TASK: Wire confirmation emails into Stripe webhook booking handlers (5B-2e)
Sprint: 5B | Est: 1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-stripe-webhook.php
   — Read handle_booking_checkout_completed() and
   handle_package_purchase_completed() in full. Find exactly where
   each creates a booking (after $booking_creator->create_booking()
   succeeds). This is where you add the email calls.

2. includes/payment/class-payment-processor.php
   — Read process_pay_on_arrival() from the point after
   create_booking() succeeds. This is the exact pattern you must
   replicate: require_once the booking retriever, get_booking_by_id(),
   require_once the email sender, send_customer_confirmation(),
   send_business_notification(). Copy this pattern precisely.

3. includes/booking/class-booking-retriever.php
   — Confirm get_booking_by_id() signature and that it returns the
   full booking array with all JOIN fields needed by the email sender
   (customer_name, staff_name, service_name, etc).

4. includes/email/class-email-sender.php
   — Confirm send_customer_confirmation() and
   send_business_notification() signatures. Both accept a $booking
   array and return true or WP_Error.

5. tests/unit/test-stripe-v2-wiring.php
   — Read to follow established patterns before adding new tests.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When a booking is created via the Stripe webhook (both the regular
booking flow and the package purchase flow), no confirmation emails
are sent. The Pay on Arrival flow correctly sends both customer
and business notification emails after booking creation. This task
replicates that same pattern in the two Stripe webhook handlers.

The email sending is best-effort — failures must not block the
webhook response or cause a non-200 return. Log failures with
error_log() if self::should_log(), same as the POA pattern.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-stripe-webhook.php — MODIFY

In handle_booking_checkout_completed(), after the line:
  set_transient( $idempotency_key, $booking_id, ... )
and before the final error_log() and return true:

Add email sending block (replicate process_pay_on_arrival pattern):
- require_once BOOKIT_PLUGIN_DIR . 'includes/booking/class-booking-retriever.php'
- $booking_retriever = new Booking_System_Booking_Retriever()
- $booking = $booking_retriever->get_booking_by_id( $booking_id )
- If $booking is not null:
  - require_once BOOKIT_PLUGIN_DIR . 'includes/email/class-email-sender.php'
  - $email_sender = new Booking_System_Email_Sender()
  - $customer_result = $email_sender->send_customer_confirmation( $booking )
  - if is_wp_error($customer_result) && self::should_log(): error_log(...)
  - $business_result = $email_sender->send_business_notification( $booking )
  - if is_wp_error($business_result) && self::should_log(): error_log(...)
- Else: error_log('Stripe Webhook: Could not retrieve booking #N for emails')
  if self::should_log()

Apply the same block in handle_package_purchase_completed(), after
the booking is created and the idempotency transient is set. The
booking_id is available at that point from create_booking().

Do not add email sending to handle_charge_refunded() — refund
emails are a separate concern not in scope for this task.

---

## PHPUNIT REQUIREMENTS

Baseline: 875 tests, 0 failures — must not regress.

Add to tests/unit/test-stripe-v2-wiring.php:

- test_stripe_webhook_booking_flow_enqueues_customer_email
  Simulate checkout.session.completed with flow_type = booking.
  Assert a customer_confirmation row exists in the email queue
  table after the webhook fires.

- test_stripe_webhook_package_flow_enqueues_customer_email
  Simulate checkout.session.completed with flow_type = package.
  Assert a customer_confirmation row exists in the email queue
  after the webhook fires.

Follow the existing queue assertion pattern from
tests/unit/test-notification-dispatcher.php if needed.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

- [ ] Customer confirmation email queued after Stripe booking webhook
- [ ] Business notification email queued after Stripe booking webhook
- [ ] Customer confirmation email queued after Stripe package webhook
- [ ] Business notification email queued after Stripe package webhook
- [ ] Email failures do not cause webhook to return non-200
- [ ] No PHP warnings or notices
- [ ] PHPUnit: 875+ tests, 0 failures

### Must NOT break
- [ ] Pay on Arrival email flow unchanged
- [ ] charge.refunded handler unchanged
- [ ] Idempotency — duplicate webhook does not double-queue emails
      (idempotency transient check already returns early before
      emails are reached — confirm this is the case)

---

## GIT COMMIT MESSAGE

Sprint 5B: Wire confirmation emails into Stripe webhook handlers (5B-2e)

- handle_booking_checkout_completed(): send customer confirmation
  and business notification after booking creation
- handle_package_purchase_completed(): same email wiring after
  package + booking creation
- Both handlers follow process_pay_on_arrival() email pattern
- Email failures are best-effort and do not block webhook response
- 2 new PHPUnit tests

Tests: 877+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```