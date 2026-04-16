Good findings. Let me separate these clearly:

**Issues to fix in this task (6C-2 scope):**

1. **Cancellation from dashboard sends wrong email to customer** — they receive a "Booking Confirmed" email instead of a cancellation email. This is a real bug in `cancel_booking()` — it calls `send_customer_confirmation()` when it should send a cancellation-specific email.

2. **Cancellation email body is too minimal** — just "Your booking has been cancelled." with no booking details or rebook link. Needs to include booking details and a link to rebook.

**Issues that are out of scope for 6C-2 (log for later):**

3. **Reschedule page — can't navigate to different month** — this is a UI bug in the Vue reschedule wizard, not related to email notifications. Should be a separate task.

4. **Reschedule button stuck on "Rescheduling..."** — same, Vue UI bug. Separate task.

Let me look at the cancel_booking() email code before writing the fix prompt:I have everything I need. Now I can write the targeted fix prompt. Here it is:

---

```
TASK 2 OF 3 — ADDENDUM: Fix cancellation email sent from dashboard
Sprint: 6C | Plugin root: bookit-booking-system/

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-dashboard-bookings-api.php — full file —
   specifically cancel_booking() method
2. includes/email/class-email-sender.php — full file —
   understand generate_customer_email() structure to model the
   new generate_cancellation_email() method after it

If any file does not exist, stop and report before proceeding.

---

## CONTEXT

When admin cancels a booking via the dashboard and send_notification
is true, cancel_booking() calls send_customer_confirmation() —
this sends a "Booking Confirmed!" email to the customer, which is
wrong. There is a TODO comment acknowledging this is a stub.

Two problems to fix:
1. Wrong email method called — sends confirmation instead of cancellation
2. Cancellation email body is too minimal — needs booking details
   and a rebook link

---

## IMPLEMENTATION REQUIREMENTS

### includes/email/class-email-sender.php — MODIFY

Add a new public method `send_customer_cancellation( array $booking )`
and a corresponding private method
`generate_cancellation_email( array $booking ): string`.

Model the structure exactly after `send_customer_confirmation()` and
`generate_customer_email()` — same queue pattern, same HTML structure.

The cancellation email must include:

**Subject:**
```php
sprintf(
    __( 'Booking Cancelled — %s', 'bookit-booking-system' ),
    $booking['service_name']
)
```

**HTML body must include:**
- Greeting: "Hi {customer_first_name},"
- Clear heading: "Your Booking Has Been Cancelled"
- Booking details block (same style as confirmation email):
  - Service name
  - Date (formatted)
  - Time (formatted)
  - Staff name
- A "Book Again" button linking to `home_url( '/bookit/' )` —
  use the same button style as the Reschedule button in
  generate_customer_email() (blue background #005FB8)
- Standard footer with business name

Do NOT include Add to Calendar, Reschedule, or Cancel buttons —
those are not appropriate for a cancellation email.

Use `bookit_enqueue_email()` with email_type `customer_cancellation`
(same pattern as `send_customer_confirmation()` uses
`customer_confirmation`).

### includes/api/class-dashboard-bookings-api.php — MODIFY

In `cancel_booking()`, replace:
```php
$email_sender->send_customer_confirmation( $booking );
```
With:
```php
$email_sender->send_customer_cancellation( $booking );
```

Remove the TODO comment above it — it is now resolved.

---

## PHPUNIT REQUIREMENTS

Baseline: 976+ tests, 0 failures — must not regress.

Add to `tests/unit/test-6c-hotfix.php`:

- `test_cancellation_email_subject_contains_service_name`
  Verify subject includes service name and "Cancelled"

- `test_cancellation_email_includes_booking_details`
  Verify HTML body contains service name, date, staff name

- `test_cancellation_email_includes_book_again_button`
  Verify HTML body contains 'Book Again' text

- `test_cancellation_email_does_not_include_confirmed_heading`
  Verify HTML body does NOT contain 'Booking Confirmed'

Run after implementation:
  cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Dashboard cancel → customer receives cancellation email,
      not confirmation email
- [ ] Cancellation email subject contains service name
- [ ] Cancellation email body contains booking details
      (service, date, time, staff)
- [ ] Cancellation email contains "Book Again" button
- [ ] No "Booking Confirmed" heading in cancellation email

### Technical
- [ ] New method send_customer_cancellation() added to
      class-email-sender.php
- [ ] cancel_booking() calls send_customer_cancellation()
- [ ] TODO comment removed
- [ ] No PHP warnings or notices
- [ ] PHPUnit passes (all tests, 0 failures)

### Must NOT break
- [ ] send_customer_confirmation() unchanged
- [ ] Magic link cancel email unchanged (uses different path)
- [ ] Staff/admin cancellation notification unchanged


## GIT COMMIT MESSAGE

```
Sprint 6C, Task 2 addendum: Fix dashboard cancellation email

- class-email-sender.php: add send_customer_cancellation() and
  generate_cancellation_email() with booking details + Book Again button
- class-dashboard-bookings-api.php: call send_customer_cancellation()
  instead of send_customer_confirmation() in cancel_booking()
- Removes TODO comment — cancellation email template now implemented

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```