# TASK: Add booking reference to customer confirmation email
# Sprint: Playwright Sprint (bug fix) | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/includes/email/class-email-sender.php`
   — read the full `generate_customer_email()` method to find the
   exact location of the Staff detail row

2. `bookit-booking-system/tests/unit/test-notification-dispatcher.php`
   — read `build_minimal_booking()` helper and existing
   `test_confirmation_email_contains_cancel_link()` test to follow
   the exact pattern for new tests

3. `bookit-booking-system/includes/utils/class-bookit-reference-generator.php`
   — confirm the `generate()` format: `BK` + YYMM + `-` + 4-char hash
   e.g. `BK2504-A3F2`

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The `generate_customer_email()` method in `class-email-sender.php`
outputs a confirmation email with Service, Date, Time, and Staff rows
but does NOT include the booking reference. The `booking_reference`
field is stored in `wp_bookings.booking_reference` and is already
present in the booking array passed to this method.

The E2E test `booking-poa.spec.ts` asserts `email.HTML` contains
`/BK[\d-]/` — this fails because the email template never outputs it.

The fix is additive: one new `<div class="detail-row">` block after
the Staff row, plus a new PHPUnit test.

---

## STEP 1 — Write the PHPUnit test FIRST

Add a new test method to `tests/unit/test-notification-dispatcher.php`
in the `Test_Notification_Dispatcher` class, after the existing
`test_customer_email_includes_add_to_calendar_link` test.

Follow the exact pattern of the existing tests in that file.

```php
/**
 * @covers Booking_System_Email_Sender::generate_customer_email
 */
public function test_confirmation_email_contains_booking_reference(): void {
    $email_sender = new Booking_System_Email_Sender();
    $booking      = $this->build_minimal_booking();

    // Add a booking reference in the format produced by
    // Bookit_Reference_Generator::generate() — BK + YYMM + hyphen + 4 chars
    $booking['booking_reference'] = 'BK2504-TEST';

    $html = $email_sender->generate_customer_email( $booking );

    $this->assertStringContainsString( 'BK2504-TEST', $html );
    $this->assertStringContainsString( 'Booking ref', $html );
}

/**
 * @covers Booking_System_Email_Sender::generate_customer_email
 */
public function test_confirmation_email_omits_ref_row_when_reference_empty(): void {
    $email_sender = new Booking_System_Email_Sender();
    $booking      = $this->build_minimal_booking();

    // No booking_reference key — should not render an empty row
    unset( $booking['booking_reference'] );

    $html = $email_sender->generate_customer_email( $booking );

    $this->assertStringNotContainsString( 'Booking ref', $html );
}
```

---

## STEP 2 — Run the tests to confirm they FAIL

```bash
cd bookit-booking-system
vendor/bin/phpunit tests/unit/test-notification-dispatcher.php \
  --filter test_confirmation_email_contains_booking_reference
```

Expected result: **FAIL** — the email doesn't contain `BK2504-TEST` yet.
If it unexpectedly passes, stop and report back.

---

## STEP 3 — Implement the fix in `class-email-sender.php`

In `generate_customer_email()`, find the Staff detail row:

```php
<div class="detail-row">
    <span class="label"><?php esc_html_e( 'Staff:', 'booking-system' ); ?></span>
    <span class="value"><?php echo esc_html( $booking['staff_name'] ); ?></span>
</div>
```

Add the booking reference row immediately after it:

```php
<?php if ( ! empty( $booking['booking_reference'] ) ) : ?>
<div class="detail-row">
    <span class="label"><?php esc_html_e( 'Booking ref:', 'booking-system' ); ?></span>
    <span class="value"><?php echo esc_html( $booking['booking_reference'] ); ?></span>
</div>
<?php endif; ?>
```

No other changes to this method. No other files need changing.

---

## STEP 4 — Run the full PHPUnit suite

```bash
cd bookit-booking-system
vendor/bin/phpunit
```

Expected result:
- **Baseline:** 976 tests, 0 failures
- **After change:** 978 tests (2 new), 0 failures

If any existing test fails, stop and report back before proceeding.

---

## STEP 5 — Run the E2E test to confirm end-to-end

Only run this after PHPUnit passes.

```powershell
cd bookit-booking-system/tests/e2e
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

The test should now pass the `expect(email.HTML).toMatch(/BK[\d-]/)` assertion
because the booking reference will appear in the email HTML.

---

## ACCEPTANCE CRITERIA

### PHPUnit
- [ ] `test_confirmation_email_contains_booking_reference` — PASS
- [ ] `test_confirmation_email_omits_ref_row_when_reference_empty` — PASS
- [ ] Full suite: 978 tests, 0 failures (no regressions)

### E2E
- [ ] `booking-poa.spec.ts` passes end-to-end including email assertion
- [ ] Email HTML contains the booking reference matching `/BK[\d-]/`

### Code
- [ ] Only `generate_customer_email()` in `class-email-sender.php` modified
- [ ] The new row is conditional — only renders when `booking_reference` is non-empty
- [ ] No other files changed

---

## GIT COMMIT MESSAGE

```
Fix: Add booking reference to customer confirmation email

- generate_customer_email() now outputs "Booking ref" detail row
  when booking_reference is present in the booking array
- Row conditionally rendered — omitted for bookings with no reference
- Two new PHPUnit tests added to test-notification-dispatcher.php

Tests: 978 passing, 0 failures
```

---

If you encounter a conflict between the existing code and these
instructions, or if `build_minimal_booking()` does not exist in
`test-notification-dispatcher.php`, stop and report back before
writing any code.