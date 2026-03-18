Let me read the two files that need to be modified before writing any code.Good — I can see the full `booking-confirmed.php` template. Now let me read the full email sender to know exactly where to insert the hook.I have a clear picture of both files. Now generating the Cursor prompt.

---

```
TASK: Core hooks pre-task — meeting section filters + action
Sprint: Meetings Extension Pre-Task | Est: ~1h
Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-confirmed.php`
   — read the FULL file: locate exactly where `$booking` is fully
   populated (after the `if (!$booking)` guard and after the email
   sending block), where `$retriever->clear_booking_session()` is
   called, and where the booking details HTML block ends before the
   footer/action buttons. The action hook fires after emails are sent
   and session is cleared. The filter renders in the HTML output block.

2. `includes/email/class-email-sender.php`
   — read the FULL `generate_customer_email()` method. Locate the
   closing `</div>` of the `.booking-details` block — specifically
   find the line after the cancellation policy block and before the
   `<p>We look forward to seeing you!</p>` line. The filter inserts
   immediately after the package block and before that closing line.

If either file does not exist or differs significantly from the
description above, STOP and report back before proceeding.

---

## CONTEXT

This task adds three WordPress hooks to two existing core files.
These hooks have no consumers yet — they exist solely so the
forthcoming Bookit Meetings extension plugin can hook into them
without modifying core. No columns, no API changes, no UI, no
new files. The confirmation page and email must render identically
before and after this change when no extension is hooked in.

---

## IMPLEMENTATION REQUIREMENTS

### `public/templates/booking-confirmed.php` — MODIFY

Read the full file first. Make two targeted additions:

**Addition 1 — action hook (fires after emails sent, session cleared)**

After the `$retriever->clear_booking_session()` call and before the
`$date_formatted` / `$time_formatted` lines, add:

```php
/**
 * Fires after the booking confirmation page has loaded and emails
 * have been sent. Extensions hook here to generate and store a
 * meeting link for this booking.
 *
 * @param int   $booking_id The booking ID.
 * @param array $booking    The full booking data array.
 */
do_action( 'bookit_after_booking_confirmed', $booking['id'], $booking );
```

**Addition 2 — filter hook (renders in the HTML output block)**

In the HTML output section, after the existing booking details block
and before the footer / action buttons (e.g. before the closing
`</div>` of `bookit-confirmation-page` or before the "Make another
booking" button — confirm exact position from the file), add:

```php
<?php
/**
 * Filter the meeting section HTML on the confirmation page.
 * Return non-empty HTML from an extension to display a meeting link.
 * Return empty string (default) to show nothing.
 *
 * @param string $html    The meeting section HTML. Default ''.
 * @param array  $booking The full booking data array.
 */
$bookit_meeting_section_html = apply_filters(
    'bookit_confirmation_meeting_section',
    '',
    $booking
);
if ( '' !== $bookit_meeting_section_html ) {
    echo wp_kses_post( $bookit_meeting_section_html );
}
?>
```

Use a prefixed variable name (`$bookit_meeting_section_html`) to
avoid any collision with existing variables in the template scope.

---

### `includes/email/class-email-sender.php` — MODIFY

Read the full `generate_customer_email()` method first. Make one
targeted addition.

**Addition — filter hook in the email booking details block**

Inside the `generate_customer_email()` method, after the package
info block and the cancellation policy block, and immediately before
the `<p><?php esc_html_e( 'We look forward to seeing you!' ... ?></p>`
line, add:

```php
<?php
/**
 * Filter the meeting section HTML in the customer confirmation email.
 * Return non-empty HTML from an extension to display a meeting link row.
 * Return empty string (default) to show nothing.
 *
 * @param string $html    The meeting section HTML. Default ''.
 * @param array  $booking The booking data array passed to this method.
 */
$bookit_email_meeting_html = apply_filters(
    'bookit_email_meeting_section',
    '',
    $booking
);
if ( '' !== $bookit_email_meeting_html ) {
    echo wp_kses_post( $bookit_email_meeting_html );
}
?>
```

Again use a prefixed variable name to avoid template scope collision.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new files
- [ ] No new migrations
- [ ] No new error codes
- [ ] No new REST endpoints
- [ ] No Vue changes, no `npm run build` needed

---

## PHPUNIT REQUIREMENTS

Baseline: **706 tests, 0 failures** — must not regress.

No new tests are required for this task. Hooks with no registered
consumers are invisible to the test suite and produce no testable
output change. The existing `test-payment-success.php` confirmation
page tests and `test-package-email.php` email tests must continue
to pass unchanged — verify this by running the full suite after
implementation.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
Result must be: **706 tests, 0 failures.**

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `bookit_after_booking_confirmed` action fires on confirmation
      page load when a valid booking is found
- [ ] `bookit_confirmation_meeting_section` filter fires on confirmation
      page; with no consumers returns `''` and nothing extra renders
- [ ] `bookit_email_meeting_section` filter fires inside
      `generate_customer_email()`; with no consumers returns `''` and
      nothing extra appears in the email
- [ ] Confirmation page HTML output is byte-for-byte identical to
      pre-change output when no extension hooks are registered
- [ ] Confirmation email HTML output is identical to pre-change output
      when no extension hooks are registered

### Technical
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (706 tests, 0 failures)
- [ ] `$bookit_meeting_section_html` and `$bookit_email_meeting_html`
      variable names used (not generic `$html` or `$output`)

### Must NOT break
- [ ] Existing confirmation page display (booking details, payment
      summary, cancellation policy, package info block)
- [ ] Existing confirmation email content
- [ ] Pay-on-arrival confirmation flow
- [ ] Stripe/PayPal confirmation flow
- [ ] Package redemption email block

---

## GIT COMMIT MESSAGE

```
Meetings pre-task: Add core hooks for extension meeting link injection

- booking-confirmed.php: bookit_after_booking_confirmed action (after session clear)
- booking-confirmed.php: bookit_confirmation_meeting_section filter (HTML output block)
- class-email-sender.php: bookit_email_meeting_section filter (inside generate_customer_email)
- No consumers yet — hooks are silent until Bookit Meetings extension is active

Tests: 706 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.