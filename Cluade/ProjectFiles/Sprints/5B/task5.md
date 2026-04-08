**5B-2e approved and committed. ✅**

Now for 5B-2f — Add to Calendar link in the customer confirmation email. Let me read the relevant files first.Good — confirmed from `progress.md` that Sprint 5A-2 already added the "Need to make changes?" section with Reschedule + Cancel buttons to `generate_customer_email()`. The `.ics` endpoint exists at `GET bookit/v1/wizard/ical?booking_id=X&token=Y`. So 5B-2f is simply adding an "Add to Calendar" button to the same section in the email.

This is a very small targeted change — just one file. Here is the prompt:

---

```
TASK: Add "Add to Calendar" button to customer confirmation email (5B-2f)
Sprint: 5B | Est: 30min | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/email/class-email-sender.php
   — Read generate_customer_email() in full. Find the "Need to
   make changes?" section that was added in Sprint 5A-2 with the
   Reschedule and Cancel buttons. This is where you add the
   "Add to Calendar" button — in the same section, above or
   below the existing buttons. Also confirm the inline CSS style
   used for the existing buttons so the new button matches.

2. includes/api/class-wizard-ical.php (or wherever the .ics
   endpoint is registered — search for 'wizard/ical' if unsure)
   — Read the endpoint registration to confirm the exact URL
   parameters: booking_id and magic_link_token (or token).
   The URL format must match exactly.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The customer confirmation email already has Cancel and Reschedule
buttons added in Sprint 5A-2. The .ics calendar download endpoint
was also built in Sprint 5A-2 at GET bookit/v1/wizard/ical with
booking_id and magic_link_token parameters. This task adds an
"Add to Calendar" button to the same email section, linking to
that endpoint. The button must be silently omitted when
magic_link_token is absent (same guard as the existing buttons).

---

## IMPLEMENTATION REQUIREMENTS

### includes/email/class-email-sender.php — MODIFY

In generate_customer_email(), inside the "Need to make changes?"
section (where magic_link_token is checked):

- Build the .ics URL:
  $ical_url = add_query_arg(
    array(
      'booking_id'       => $booking['id'],
      'magic_link_token' => $booking['magic_link_token'],
    ),
    rest_url( 'bookit/v1/wizard/ical' )
  );

- Add an "Add to Calendar" button link using the same inline CSS
  style as the existing Reschedule and Cancel buttons. Read the
  existing button style first and match it exactly.
  Button label: "📅 Add to Calendar"

- Place it as the first button in the section, before Reschedule
  and Cancel — calendar download is the primary action.

- The entire section (including the new button) remains silently
  omitted when magic_link_token is absent. Do not change the
  existing guard condition.

Do not modify anything else in this file.

---

## PHPUNIT REQUIREMENTS

Baseline: 877 tests, 0 failures — must not regress.

Add one test to tests/unit/test-email-sender.php (or the
existing email test file — read it first to confirm the filename):

- test_customer_email_includes_add_to_calendar_link
  Build a minimal booking array with id, magic_link_token, and
  all other required fields. Call generate_customer_email().
  Assert the output contains 'wizard/ical' and the booking id.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

- [ ] Customer confirmation email contains "Add to Calendar" button
- [ ] Button links to bookit/v1/wizard/ical?booking_id=X&magic_link_token=Y
- [ ] Button style matches existing Reschedule/Cancel buttons
- [ ] Button is omitted when magic_link_token is absent
- [ ] PHPUnit: 877+ tests, 0 failures

### Must NOT break
- [ ] Reschedule and Cancel buttons still present and unchanged
- [ ] Email still sends correctly via Brevo queue

---

## GIT COMMIT MESSAGE

Sprint 5B: Add "Add to Calendar" button to customer confirmation email (5B-2f)

- generate_customer_email(): Add to Calendar button linking to
  bookit/v1/wizard/ical endpoint, placed before Reschedule/Cancel
- Silently omitted when magic_link_token absent
- 1 new PHPUnit test

Tests: 878+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```