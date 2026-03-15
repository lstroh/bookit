Let me check the email sender class to understand the existing email structure before writing the Task 8 prompt.The project knowledge search returned email architecture docs but not the actual implementation file. The Future_Features_Backlog has the key detail I need — it notes the email file is `includes/email/class-email-sender.php` and the method is `send_customer_confirmation()`. That's enough to write the prompt.

---

## TASK 8 OF 8: Package Redemption Email Enhancement (~2h)

```
TASK 8 OF 8: Package Redemption Email Enhancement
Sprint: 4E | Est: 2h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back.

1. `includes/email/class-email-sender.php` — read the full file; find `send_customer_confirmation()` and understand how email body is assembled, what variables are available, and where the body text ends before the footer/signature
2. `includes/booking/class-booking-creator.php` — understand how bookings are created; confirm that `customer_package_id` and `payment_method` are stored on the booking row and accessible after creation
3. `database/schema.sql` or the migration files for `wp_bookings_customer_packages` — confirm the column names: `sessions_remaining`, `sessions_total`, `expires_at`, `package_type_id`
4. `includes/api/class-package-types-api.php` or the package types table — confirm how to look up the package type name from a `customer_package_id` (need to JOIN `wp_bookings_customer_packages` → `wp_bookings_package_types` to get the name)
5. `phpunit.xml` — understand where email tests should be registered if a new test file is needed

---

## CONTEXT

When a booking is created via the package redemption path (`payment_method = 'package_redemption'` or `payment_method = 'use_package'`), the customer confirmation email currently contains no information about the package used or sessions remaining. This task adds a "Sessions remaining" line to that email only. Non-package booking emails must be unchanged.

Read the actual `payment_method` value used in the booking row — check `class-booking-creator.php` to confirm the exact string stored (it may be `'package_redemption'`, `'use_package'`, or similar — do not assume).

---

## IMPLEMENTATION REQUIREMENTS

### `includes/email/class-email-sender.php` — MODIFY

Read the full file first. Locate `send_customer_confirmation()`.

**What to add:**

After assembling the booking summary section and before the footer/closing text, add a conditional block:

```php
// Only for package bookings
if ( ! empty( $booking['customer_package_id'] ) 
    && in_array( $booking['payment_method'], array( 'package_redemption', 'use_package' ), true ) ) {

    $package_info = $this->get_package_info_for_email( (int) $booking['customer_package_id'] );

    if ( $package_info ) {
        // Append package info to email body
        // Format: "Sessions remaining on your [Package Name] package: X of Y"
        // If expires_at is set: "Your package expires on: [formatted date]"
    }
}
```

**Add a private helper method `get_package_info_for_email( int $customer_package_id ): ?array`:**

```php
private function get_package_info_for_email( int $customer_package_id ): ?array {
    global $wpdb;

    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT cp.sessions_remaining, cp.sessions_total, cp.expires_at,
                    pt.name AS package_type_name
             FROM {$wpdb->prefix}bookings_customer_packages cp
             JOIN {$wpdb->prefix}bookings_package_types pt ON pt.id = cp.package_type_id
             WHERE cp.id = %d
             LIMIT 1",
            $customer_package_id
        ),
        ARRAY_A
    );

    return $row ?: null;
}
```

**Email body addition format:**

Read the existing email body format in `send_customer_confirmation()` first to match the exact text structure (plain text, HTML, or both). Then add:

- `"Sessions remaining on your [package_type_name] package: X of Y"`
- If `expires_at` is not null: `"Your package expires on: [date formatted with date_i18n( get_option('date_format'), strtotime($expires_at) )]"`
- If `expires_at` is null: omit the expiry line entirely
- This block appears after the booking summary, before any footer/cancellation policy text

**Graceful fallback:**

If `get_package_info_for_email()` returns null (package row not found or JOIN fails), send the standard confirmation email without the package section. Do not let a missing package row break email delivery.

**Do not:**
- Change the email for non-package bookings
- Add package info to staff/admin notification emails
- Modify the email subject line

---

## PHPUNIT REQUIREMENTS

**Baseline: 703 tests, 0 failures — must not regress.**

Write tests in a new file: `tests/unit/test-package-email.php`
Register it in `phpunit.xml` following the existing pattern.

**Required test cases:**

- `test_package_booking_confirmation_includes_sessions_remaining`: create a booking with `payment_method = '[actual value]'` and a linked `customer_package_id`; trigger or call the relevant email method; assert the generated email body contains the sessions remaining text
- `test_non_package_booking_email_unchanged`: create a standard booking with `payment_method = 'stripe'` and no `customer_package_id`; assert the generated email body does NOT contain "Sessions remaining"
- `test_graceful_fallback_when_package_not_found`: create a booking with a `customer_package_id` that references a non-existent package; assert email sends without error and does not contain sessions text

**Note:** Read `class-email-sender.php` to understand how to test it — whether `send_customer_confirmation()` returns the email body, uses `wp_mail()`, or has a testable intermediate method. If `wp_mail()` is called directly and there is no testable hook or return value, use WordPress's `pre_wp_mail` filter or `phpmailer_init` action to capture the email in tests, following whatever pattern existing email tests in the project use (check `tests/` for any existing email test pattern).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Booking confirmation email for a package redemption booking includes: `"Sessions remaining on your [Package Name] package: X of Y"`
- [ ] If `expires_at` is set on the customer package: expiry date line is also included
- [ ] If `expires_at` is null: no expiry line appears
- [ ] Non-package booking confirmation emails are completely unchanged
- [ ] If `customer_package_id` is present but package row not found: email sends normally without package section (graceful fallback)
- [ ] Staff/admin notification emails are not affected

### Technical
- [ ] Uses `$wpdb->prepare()` in the package lookup query
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (703+ tests, 0 failures)

### Must NOT break
- [ ] Standard booking confirmation emails (Stripe, PayPal, pay_on_arrival)
- [ ] Package redemption flow itself (this change is email-only)
- [ ] All existing tests

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 8: Package redemption email enhancement

- Added sessions remaining info to customer confirmation email for package bookings
- Graceful fallback if package row not found (standard email sent)
- Non-package booking emails unchanged
- Staff/admin notifications unaffected

Tests: [N] passing, 0 failures
```

---

If `send_customer_confirmation()` does not exist at the path described, or if the email system is structured differently than described, **STOP and report back before writing any code.**