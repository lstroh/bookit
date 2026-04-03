Good request, but before writing any prompt I need to flag a scope question.

This touches two things:

1. **The .ics file** — adding cancel/reschedule links to the `DESCRIPTION` field. Straightforward, low risk, backend only.

2. **The booking confirmation email** — this means modifying the notification dispatcher's email content. I need to understand how the email body is currently built before promising this is simple.

Let me check:Good, I have enough context. Here is the key architectural picture before I write the prompt:

**The email body is built as `html_body` stored directly in the `wp_bookit_email_queue` table** — it's not a template system with variable substitution. The email sender (`class-email-sender.php`) builds the HTML string and passes it to `enqueue_email()`. So adding cancel/reschedule links to the confirmation email means modifying where that HTML is assembled, and the magic link URLs need to be constructed using `home_url('/bookit-cancel/')` + query args at queue time.

This is a well-contained change. Here is the Cursor prompt:

---

```
TASK 5A-2 ADDENDUM: Add cancel/reschedule links to .ics DESCRIPTION and confirmation email
Sprint: 5A | Est: 2h | Plugin root: bookit-booking-system/
Depends on: 5A-2 complete, 5A-3a complete
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-wizard-api.php` — find `fetch_and_build_ical()`.
   Read the `DESCRIPTION` line exactly as built. This is where the
   cancel and reschedule links will be appended.
2. `includes/email/class-email-sender.php` — read `send_customer_confirmation()`
   in full. Find exactly where `html_body` is assembled. Identify how
   `$booking` data is structured at that point — specifically whether
   `magic_link_token`, `id`, and `booking_reference` are available on the
   `$booking` array/object passed to this method.
3. `includes/notifications/class-bookit-notification-dispatcher.php` —
   read `enqueue_email()` signature to confirm what fields are passed
   (`booking_id`, `email_type`, `recipient_email`, `recipient_name`,
   `subject`, `html_body`).
4. `public/templates/booking-confirmed-v2.php` — confirm the pattern used
   to build the cancel/reschedule page URLs, so the email uses exactly
   the same URL structure.

---

## CONTEXT

Two small additions to already-built features. The `.ics` DESCRIPTION
field currently contains only the booking reference — it should also
include the cancel and reschedule page URLs so customers can manage
their booking from their calendar app. The booking confirmation email
currently contains booking details but no cancel/reschedule links —
adding them closes the loop for customers who only read their email and
never visit the confirmation page again. Both changes construct URLs
using `home_url()` with `magic_link_token` and `booking_id` as query
args, matching the pattern already used on the V2 confirmation page.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-wizard-api.php` — MODIFY (`fetch_and_build_ical`)

Read the current `DESCRIPTION` line first. Extend it to include the
cancel and reschedule URLs. RFC 5545 requires long lines to be folded
at 75 octets with `\r\n ` (CRLF + space) continuation — use `\n` in
the DESCRIPTION value (escaped as `\\n`) to separate lines within the
field, keeping the structure readable in calendar apps:

```php
$cancel_url    = add_query_arg(
    array( 'booking_id' => $booking->id, 'token' => $booking->magic_link_token ),
    home_url( '/bookit-cancel/' )
);
$reschedule_url = add_query_arg(
    array( 'booking_id' => $booking->id, 'token' => $booking->magic_link_token ),
    home_url( '/bookit-reschedule/' )
);

$description = 'Booking reference: ' . $booking->booking_reference
             . '\\nCancel: '         . $cancel_url
             . '\\nReschedule: '     . $reschedule_url;

$ics .= 'DESCRIPTION:' . $this->ical_escape( $description ) . "\r\n";
```

Replace the existing single-line `DESCRIPTION` with this multi-line
version. Pass the result through `ical_escape()` as before — confirm
that `ical_escape()` does not strip `\\n` (it shouldn't, but verify).

**Important**: `magic_link_token` must be available on `$booking` at
this point. Read `fetch_and_build_ical()` — if the DB query does not
currently select `magic_link_token`, add it to the SELECT.

### `includes/email/class-email-sender.php` — MODIFY (`send_customer_confirmation`)

Read the method in full first. Find where `$html_body` (or equivalent)
is assembled. After the existing booking details block and before the
closing `</table>` or footer, add a "Manage Your Booking" section:

```php
$cancel_url     = add_query_arg(
    array( 'booking_id' => $booking_id, 'token' => $magic_link_token ),
    home_url( '/bookit-cancel/' )
);
$reschedule_url = add_query_arg(
    array( 'booking_id' => $booking_id, 'token' => $magic_link_token ),
    home_url( '/bookit-reschedule/' )
);
```

The HTML block to insert — keep it simple, inline CSS only (email
clients do not support external stylesheets):

```html
<tr>
  <td style="padding: 24px 30px 8px; border-top: 1px solid #E5E7EB;">
    <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280; font-family: Arial, sans-serif;">
      Need to make changes?
    </p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-right: 12px;">
          <a href="{reschedule_url}"
             style="display:inline-block; padding: 10px 20px; background-color: #005FB8;
                    color: #ffffff; text-decoration: none; border-radius: 4px;
                    font-size: 14px; font-family: Arial, sans-serif; font-weight: 600;">
            Reschedule
          </a>
        </td>
        <td>
          <a href="{cancel_url}"
             style="display:inline-block; padding: 10px 20px; background-color: #ffffff;
                    color: #374151; text-decoration: none; border-radius: 4px;
                    font-size: 14px; font-family: Arial, sans-serif; font-weight: 600;
                    border: 1px solid #D1D5DB;">
            Cancel Booking
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

Replace `{reschedule_url}` and `{cancel_url}` with the actual PHP
variables, properly escaped with `esc_url()`.

**Getting `magic_link_token` and `booking_id`**: Read the method to
find how `$booking` is structured. If `magic_link_token` is not already
on the `$booking` object/array, fetch it:
```php
$magic_link_token = isset( $booking['magic_link_token'] )
    ? $booking['magic_link_token']
    : $wpdb->get_var( $wpdb->prepare(
        "SELECT magic_link_token FROM {$wpdb->prefix}bookings WHERE id = %d",
        $booking_id
      ) );
```

If `magic_link_token` is empty (e.g. for old bookings created before
5A-1), omit the "Manage Your Booking" section entirely — do not show
broken links. Wrap the whole block in:
```php
if ( ! empty( $magic_link_token ) ) { ... }
```

---

## PHPUNIT REQUIREMENTS

No new test file needed. Baseline: **847 tests, 0 failures**.

Add 2 test cases to `tests/unit/test-ical-endpoint.php`:

- `test_ical_description_contains_cancel_url`
  Call `build_ical_content()` with a booking that has a `magic_link_token`.
  Assert the returned string contains `DESCRIPTION:` and `bookit-cancel`.

- `test_ical_description_contains_reschedule_url`
  Same — assert string contains `bookit-reschedule`.

Add 1 test case to the existing email sender test file (find it via
search for `test-email-sender` or `send_customer_confirmation`):

- `test_confirmation_email_contains_cancel_link`
  Call `send_customer_confirmation()` (or intercept the assembled HTML)
  with a booking that has a `magic_link_token`. Assert the resulting
  `html_body` contains `bookit-cancel` and `bookit-reschedule`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

- [ ] `.ics` DESCRIPTION field contains cancel URL and reschedule URL
      when `magic_link_token` is present on the booking
- [ ] Booking confirmation email contains "Reschedule" and
      "Cancel Booking" buttons with correct URLs
- [ ] Both URLs use `home_url('/bookit-cancel/')` and
      `home_url('/bookit-reschedule/')` with `booking_id` and `token`
      query args — matching the confirmation page pattern exactly
- [ ] If `magic_link_token` is empty, email section is omitted silently
      (no broken links, no PHP notices)
- [ ] All URLs escaped with `esc_url()` in email HTML
- [ ] PHPUnit suite passes (847+ tests, 0 failures)

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 2 addendum: Add cancel/reschedule links to .ics and confirmation email

- .ics DESCRIPTION: append cancel + reschedule URLs (RFC 5545 \\n separator)
- Confirmation email: "Need to make changes?" section with Reschedule + Cancel buttons
- Omit email section silently when magic_link_token is absent (old bookings)
- 3 new PHPUnit tests

Tests: 847+ passing, 0 failures
```

---

If you encounter a conflict with existing code not covered above,
STOP and report back before writing any code.