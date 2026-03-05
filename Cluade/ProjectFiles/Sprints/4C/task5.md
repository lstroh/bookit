Let me check what Task 5 is and load the relevant requirements.I have everything needed. Here's the Task 5 prompt:

---

## Task 5 Cursor Prompt — REQ-LEGAL-003: 14-Day Cooling-Off Waiver

```
# TASK 5: 14-Day Cooling-Off Waiver Checkbox (REQ-LEGAL-003)
# Sprint 4C | Bookit Booking System
# Estimated: 3 hours

## LEGAL CONTEXT

Under the Consumer Contracts Regulations 2013, Regulation 36 (UK),
when a customer books a service that will be performed within 14 days,
they must explicitly waive their right to a 14-day cooling-off period.
Without this waiver, the customer could legally cancel within 14 days
and claim a full refund even after the service has been provided.

The waiver checkbox:
- Must only appear when the booking date is within 14 days
- Must be unchecked by default
- Must be required (cannot proceed to payment without checking it)
- Must use specific legal wording (provided below)
- Consent must be stored in the database with a timestamp
- Must appear in the booking confirmation email

This is a MUST HAVE legal requirement for UK compliance. It is
entirely on the customer-facing booking wizard (public WordPress
pages) — not the Vue dashboard.

---

## MANDATORY: READ THESE FILES FIRST

Read ALL of these before writing any code:

1. public/templates/booking-step-4-contact.php
   — The ENTIRE file. The waiver checkbox is added here, after the
     marketing consent checkbox and before the form submit button.
     Understand the existing form structure, CSRF pattern, session
     variables, and how other checkboxes are implemented.

2. public/assets/js/contact-form.js
   — The ENTIRE file. Understand how form validation works, how
     fields are validated on blur and on submit, how error messages
     are displayed, and how session data is submitted via fetch/AJAX.
     The waiver checkbox needs validation integrated into this flow.

3. public/assets/css/contact-form.css (or booking-wizard.css)
   — Understand the existing form-group and checkbox CSS classes.
     The waiver checkbox must use the same styling patterns.

4. includes/api/class-booking-api.php (or wherever contact form
   data is saved to session/database)
   — Find where customer details (first_name, email, marketing_consent
     etc.) are saved. The waiver consent fields must be saved in the
     same place using the same pattern.

5. database/schema.sql or includes/class-database-setup.php
   — Find the bookings table schema. The waiver fields must be added
     as new columns via a database migration, not by modifying the
     original schema file.

6. includes/class-database-migrations.php (or equivalent)
   — Read how existing migrations are structured. Add the new
     migration for the two new columns using the same pattern.

7. public/templates/booking-confirmed.php (or confirmation email
   template)
   — Find where booking details are shown in the confirmation.
     The waiver consent must be included here.

8. tests/unit/ — pick the closest existing test file to understand
   test patterns for the booking/contact step.

Do not write any code before reading all eight files.

---

## WHAT TO BUILD

### 1. Database migration — two new columns

Add a migration that adds these two columns to the
wp_bookings (or wp_bookings_appointments) table:

  cooling_off_waiver_given   TINYINT(1) DEFAULT 0
    — 1 if the customer checked the waiver, 0 if not applicable
      (booking was not within 14 days)

  cooling_off_waiver_at      DATETIME DEFAULT NULL
    — UTC timestamp of when the waiver was given, NULL if not applicable

Use the existing migration pattern — do not modify schema.sql
directly. The migration must be idempotent (safe to run twice).

---

### 2. PHP — detect if booking is within 14 days

Add a helper function (or method on an appropriate existing class)
that determines whether the waiver should be shown:

  function bookit_booking_requires_waiver( $booking_date_string ) {
      // Returns true if booking date is within 14 calendar days
      // from today (inclusive of today).
      // $booking_date_string: 'YYYY-MM-DD' format
      // Uses WordPress timezone via wp_timezone()
  }

This function is called:
  a) In the PHP template (booking-step-4-contact.php) to decide
     whether to render the checkbox
  b) In the API handler when saving contact details, to validate
     that the waiver was provided when required

Use WordPress timezone functions (wp_timezone(), wp_date()) rather
than raw PHP date functions for correct UK timezone handling.

---

### 3. PHP template — booking-step-4-contact.php

After the marketing consent checkbox and before the submit button,
add:

```php
<?php
// Get booking date from session.
$booking_date = Bookit_Session_Manager::get( 'booking_date', '' );
$requires_waiver = ! empty( $booking_date ) &&
                   bookit_booking_requires_waiver( $booking_date );
$waiver_given = isset( $session['cooling_off_waiver'] ) &&
                (bool) $session['cooling_off_waiver'];
?>

<?php if ( $requires_waiver ) : ?>
<div class="form-group bookit-waiver-group" id="cooling-off-waiver-group">
    <div class="bookit-legal-notice">
        <p class="bookit-legal-notice__heading">
            ⚖️ Important: Right to Cancel
        </p>
        <p class="bookit-legal-notice__body">
            Your appointment is scheduled within 14 days. Under the
            Consumer Contracts Regulations 2013, you normally have
            a 14-day right to cancel. By checking the box below, you
            request that we begin the service before this period
            expires and acknowledge that you will lose this cancellation
            right once the service has been performed.
        </p>
    </div>
    <label class="bookit-checkbox-label bookit-checkbox-label--legal">
        <input
            type="checkbox"
            id="cooling-off-waiver"
            name="cooling_off_waiver"
            value="1"
            <?php checked( $waiver_given, true ); ?>
            aria-required="true"
            aria-describedby="cooling-off-waiver-error"
        />
        <span class="bookit-checkbox-text">
            I expressly request this service to begin before the
            14-day cancellation period expires, and I understand that
            I will lose my right to cancel once the service has begun.
        </span>
    </label>
    <span
        id="cooling-off-waiver-error"
        class="error-message"
        role="alert"
    ></span>
</div>
<?php endif; ?>
```

The legal wording in the checkbox label is FIXED. Do not paraphrase
or simplify it — it is the legally required text per Regulation 36.

---

### 4. JavaScript — contact-form.js

Two additions:

**A) Validation on form submit:**

In the existing form submission validation function, add:

  const waiverGroup = document.getElementById('cooling-off-waiver-group')
  if (waiverGroup) {
    // Waiver group exists = booking is within 14 days
    const waiverCheckbox = document.getElementById('cooling-off-waiver')
    if (!waiverCheckbox.checked) {
      showFieldError(
        'cooling-off-waiver',
        'You must acknowledge the cancellation policy to proceed.'
      )
      isValid = false
    }
  }

Use the existing showFieldError() function pattern — do not
invent a new error display method.

**B) Include in form data sent to API:**

When the contact form data is collected and sent to the session
save endpoint, include:

  cooling_off_waiver: document.getElementById('cooling-off-waiver')
    ? (document.getElementById('cooling-off-waiver').checked ? 1 : 0)
    : 0

---

### 5. PHP API — save contact details endpoint

In the handler that processes the contact form AJAX submission
and saves to session:

- Accept cooling_off_waiver as an integer parameter (0 or 1)
- Sanitize: absint()
- Save to session: Bookit_Session_Manager::set('cooling_off_waiver', $waiver)

Additionally, when the booking is CREATED (after payment):

- Read cooling_off_waiver from session
- Determine if waiver was required:
  bookit_booking_requires_waiver($booking_date)
- If required AND waiver = 1:
  - Save cooling_off_waiver_given = 1 to the bookings table
  - Save cooling_off_waiver_at = current_time('mysql') to bookings table
- If not required:
  - Save cooling_off_waiver_given = 0, cooling_off_waiver_at = NULL
- If required AND waiver = 0 (should not happen due to JS validation,
  but defensive server-side check):
  - Return 400 error: 'Cooling-off waiver is required for bookings
    within 14 days.'

---

### 6. CSS — contact-form.css

Add styles for the new legal notice box. It must stand out visually
from the regular form fields to draw attention to the legal nature:

.bookit-waiver-group {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.bookit-legal-notice {
  background: #fffbeb;         /* Amber tint */
  border: 1px solid #f59e0b;   /* Amber border */
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.bookit-legal-notice__heading {
  font-weight: 600;
  font-size: 0.875rem;
  color: #92400e;              /* Dark amber text */
  margin-bottom: 6px;
}

.bookit-legal-notice__body {
  font-size: 0.8125rem;
  color: #78350f;
  line-height: 1.5;
}

.bookit-checkbox-label--legal .bookit-checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

---

### 7. Booking confirmation — email and/or confirmation page

In the confirmation email template and/or the confirmation page
shown after booking, add a line when waiver was given:

  "✓ You have waived your 14-day right to cancel for this booking
   (Consumer Contracts Regulations 2013)."

Only show this line when cooling_off_waiver_given = 1 on the booking.

---

### 8. PHPUnit tests

File: tests/unit/test-cooling-off-waiver.php

- test_waiver_required_within_14_days
  Call bookit_booking_requires_waiver() with today's date → true
  Call with date 7 days from now → true
  Call with date 13 days from now → true

- test_waiver_not_required_beyond_14_days
  Call with date 14 days from now → false
  Call with date 30 days from now → false

- test_waiver_boundary_exactly_14_days
  Call with date exactly 14 days from now → false
  (14 days away = outside window; within means days 0-13)

- test_waiver_saved_to_booking_when_required
  Create a booking with date within 14 days, waiver = 1 →
  assert cooling_off_waiver_given = 1 in DB,
  cooling_off_waiver_at is not null

- test_waiver_not_saved_when_not_required
  Create a booking with date 30 days away →
  assert cooling_off_waiver_given = 0,
  cooling_off_waiver_at is null

- test_booking_rejected_if_waiver_missing_when_required
  Attempt to create booking within 14 days without waiver →
  assert 400 response

---

## CONSTRAINTS

- Legal wording in the checkbox label is FIXED — do not alter it
- The checkbox must be unchecked by default (no pre-checking)
- The checkbox must only appear when booking date is within 14 days
  — if no date in session or date is 14+ days away, hide it entirely
- No Vue/React — this is the public booking wizard (vanilla JS + PHP)
- Timezone: always use WordPress timezone (wp_timezone()) not PHP
  server timezone, to correctly handle UK GMT/BST transitions
- Store timestamp in UTC in the database (current_time('mysql', true))
- The waiver is a legal record — never delete it even if the booking
  is cancelled or the customer requests data deletion (retain for
  7 years per HMRC/legal requirements alongside the booking record)

---

## TESTING CHECKLIST

### Browser testing
- [ ] Book with a date within 14 days → waiver checkbox appears
- [ ] Book with a date 15+ days away → no waiver checkbox
- [ ] Try to submit contact form with waiver unchecked →
      validation error appears, form does not advance
- [ ] Check the waiver box and submit → form advances normally
- [ ] Waiver checkbox value persists if user navigates back
      and forward (session preserves value)

### Database
- [ ] After completing a booking within 14 days:
      cooling_off_waiver_given = 1 in DB
      cooling_off_waiver_at is a valid UTC datetime
- [ ] After completing a booking 15+ days away:
      cooling_off_waiver_given = 0
      cooling_off_waiver_at is NULL

### Confirmation
- [ ] Booking confirmation page/email shows waiver acknowledgement
      line when waiver was given
- [ ] Line does NOT appear for bookings where waiver was not required

### Accessibility
- [ ] aria-required="true" on checkbox
- [ ] Error message linked via aria-describedby
- [ ] Legal notice text readable at 200% zoom
- [ ] Checkbox focusable and operable by keyboard

### PHPUnit
- [ ] npm test — zero failures
- [ ] All new tests pass

---

## GIT COMMIT MESSAGE

Sprint 4C Task 5: REQ-LEGAL-003 14-day cooling-off waiver

- Migration: cooling_off_waiver_given + cooling_off_waiver_at columns
- Helper: bookit_booking_requires_waiver() with WP timezone support
- Template: waiver checkbox with fixed legal wording (Regulation 36)
- JS: validation prevents form submission if waiver unchecked
- API: waiver saved to session and to booking record on creation
- Server-side: 400 if waiver missing when required (defensive)
- CSS: amber legal notice box styling
- Confirmation: waiver acknowledgement line when applicable
- PHPUnit: 6 new tests covering boundary conditions and DB storage
```

---

This is the smallest task in Sprint 4C at 3 hours but one of the most important legally. Come back when done and I'll generate Task 6.