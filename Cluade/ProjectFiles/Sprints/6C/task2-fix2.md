Same pattern as the cancellation bug. Let me check the code quickly.Confirmed. Exact same pattern as the cancellation bug — `update_booking()` calls `send_customer_confirmation()` unconditionally when `send_notification` is true, regardless of whether it's a reschedule or a general update.

Here's the targeted fix prompt for Cursor:

---

```
TASK 2 OF 3 — ADDENDUM 2: Fix dashboard reschedule sending wrong 
customer email
Sprint: 6C | Plugin root: bookit-booking-system/

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-dashboard-bookings-api.php — specifically
   update_booking() — the send_notification block at the bottom
2. includes/email/class-email-sender.php — full file — to model
   the new send_customer_reschedule() method

---

## CONTEXT

When admin updates a booking date/time via the dashboard with
send_notification enabled, update_booking() always calls
send_customer_confirmation() — sending a "Booking Confirmed!" email
even when the booking was rescheduled. Same pattern as the
cancel_booking() bug fixed in the previous addendum.

update_booking() already detects whether the booking was rescheduled:
  if ( $date_changed || $time_changed ) {
      do_action( 'bookit_booking_rescheduled', ... );
  }

We need to use the same logic to decide which customer email to send.

---

## IMPLEMENTATION REQUIREMENTS

### includes/email/class-email-sender.php — MODIFY

Add a new public method `send_customer_reschedule( array $booking )`
and private method `generate_reschedule_email( array $booking ): string`.

Model exactly after `send_customer_cancellation()` added in the
previous addendum — same queue pattern, same HTML structure.

**Subject:**
```php
sprintf(
    __( 'Booking Rescheduled — %s', 'bookit-booking-system' ),
    $booking['service_name']
)
```

**HTML body must include:**
- Greeting: "Hi {customer_first_name},"
- Heading: "Your Booking Has Been Rescheduled"
- Updated booking details block (service, new date, new time, staff)
- Add to Calendar, Reschedule, and Cancel buttons — same as
  generate_customer_email() since these are still valid actions
  after a reschedule
- Standard footer

Use email_type `customer_reschedule` with `bookit_enqueue_email()`.

### includes/api/class-dashboard-bookings-api.php — MODIFY

In `update_booking()`, replace the single unconditional call:
```php
$email_sender->send_customer_confirmation( $booking );
```

With conditional logic using the already-computed $date_changed
and $time_changed variables:
```php
if ( $date_changed || $time_changed ) {
    $email_sender->send_customer_reschedule( $booking );
} else {
    $email_sender->send_customer_confirmation( $booking );
}
```

Note: $date_changed and $time_changed are computed earlier in
update_booking() for the hook firing logic — use the same variables.
Read the method carefully to confirm their scope before using them.
If they are not in scope at the email sending block, recompute them
using the same logic.

---

## PHPUNIT REQUIREMENTS

Baseline: current passing count, 0 failures — must not regress.

Add to `tests/unit/test-6c-hotfix.php`:

- `test_reschedule_customer_email_subject_contains_rescheduled`
  Verify subject contains 'Rescheduled' and service name

- `test_reschedule_customer_email_includes_booking_details`
  Verify HTML body contains service name, date, staff name

- `test_reschedule_customer_email_includes_action_buttons`
  Verify HTML body contains 'Add to Calendar', 'Reschedule',
  and 'Cancel'

- `test_reschedule_customer_email_does_not_include_confirmed_heading`
  Verify HTML body does NOT contain 'Booking Confirmed'

Run: cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

- [ ] Dashboard reschedule → customer receives reschedule email,
      not confirmation email
- [ ] Dashboard update (no date/time change) → customer still
      receives confirmation email (unchanged behaviour)
- [ ] Reschedule email subject contains service name and 'Rescheduled'
- [ ] Reschedule email contains new booking details
- [ ] Reschedule email contains Add to Calendar, Reschedule,
      and Cancel buttons
- [ ] No PHP warnings or notices
- [ ] All PHPUnit tests pass, 0 failures

---

## GIT COMMIT MESSAGE

```
Sprint 6C, Task 2 addendum 2: Fix dashboard reschedule customer email

- class-email-sender.php: add send_customer_reschedule() and
  generate_reschedule_email() with booking details + action buttons
- class-dashboard-bookings-api.php: send reschedule email when
  date/time changed, confirmation email otherwise

Tests: [N] passing, 0 failures
```

---

If you encounter a conflict with existing code not covered above,
STOP and report back before writing any code.
```