Yes, let's move to Task 6C-2. Before I write the Cursor prompt I need to read the 5 files specified in the sprint prompt. Let me search the project knowledge for each one.I now have everything I need from the code. Here are my findings before writing the prompt:

**Bug 1 — Customer reschedule email missing buttons:**
The `generate_customer_email()` method has the Add to Calendar, Reschedule and Cancel buttons. But I need to find the reschedule-specific email method. Let me check one more thing:I now have a complete picture of all 3 bugs. Here's the Cursor prompt:

---

```
TASK 2 OF 3: Email Notification Hotfix — 3 Bugs
Sprint: 6C | Est: 4h | Plugin root: bookit-booking-system/

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/email/class-email-sender.php — full file
2. includes/api/class-wizard-api.php — full file — specifically
   enqueue_magic_link_email() and reschedule_booking_magic_link()
3. includes/notifications/class-bookit-staff-notifier.php — full file
4. includes/class-bookit-loader.php — full file — check hook
   registrations for bookit_booking_rescheduled and
   bookit_after_booking_cancelled
5. includes/api/class-dashboard-bookings-api.php — full file —
   check cancel_booking() and update_booking() for hook firing

If any file does not exist, stop and report before proceeding.

---

## CONTEXT

Three confirmed bugs in the notification system from Sprint 6A.
All bugs are pre-existing — not introduced by 6C-1. This task fixes
all three and adds tests to prevent regression.

---

## BUG 1 — Customer reschedule email missing action buttons

### Root cause (confirmed from code reading)

`enqueue_magic_link_email()` in `class-wizard-api.php` generates a
minimal plain HTML body for the reschedule email:

```php
$html_body = '<p>' . __( 'Your booking has been rescheduled.', 'bookit-booking-system' ) . '</p>';
```

This is a stub — it has no Add to Calendar, Reschedule, or Cancel
buttons. The confirmation email uses `generate_customer_email()` in
`class-email-sender.php` which contains the full HTML including all
three action buttons.

### Fix

In `class-wizard-api.php`, update `enqueue_magic_link_email()` for
the `magic_link_reschedule` case:

Instead of the stub `$html_body`, fetch the full booking data and
call `Booking_System_Email_Sender::generate_customer_email( $booking )`
to generate the HTML body, matching the confirmation email pattern.

Read `enqueue_magic_link_email()` carefully — it currently only
fetches `email`, `first_name`, `last_name` from the customer. For
`generate_customer_email()` you need the full booking with JOINs
(service_name, staff_name, booking_date, start_time, magic_link_token
etc.). Add a separate DB query for the full booking when email_type
is `magic_link_reschedule`.

The subject line should also be updated to something meaningful:
```php
$subject = sprintf(
    __( 'Booking Rescheduled — %s', 'bookit-booking-system' ),
    $booking['service_name']
);
```

Do NOT change the `magic_link_cancel` path — leave it as-is.

---

## BUG 2 — Staff not notified on booking rescheduled (dashboard)

### Root cause (confirmed from code reading)

In `class-bookit-loader.php`, the `bookit_booking_rescheduled` hook
is registered with **1 argument**:

```php
add_action(
    'bookit_booking_rescheduled',
    function( int $booking_id ) {
        Bookit_Email_Queue::cancel_for_booking( $booking_id );
    },
    10,
    1  // ← only 1 arg
);
```

`Bookit_Staff_Notifier::init()` registers its listener with **2 args**:
```php
add_action( 'bookit_booking_rescheduled',
    array( __CLASS__, 'on_booking_rescheduled' ), 10, 2 );
```

When `do_action( 'bookit_booking_rescheduled', $booking_id, $booking_data )`
fires from `update_booking()`, WordPress passes both args to any
callback registered with `$accepted_args >= 2`. The Email_Queue
callback only accepting 1 arg is fine (WordPress handles that).
BUT — read the loader carefully and confirm whether
`Bookit_Staff_Notifier::init()` is called AFTER the hooks are
registered in `define_cron_hooks()`. If the notifier's hook fires
but `on_booking_rescheduled()` receives an empty `$booking_data`
array, `get_full_booking()` is called anyway so it should still work.

The actual root cause to verify: does `update_booking()` in
`class-dashboard-bookings-api.php` fire `bookit_booking_rescheduled`
with 2 args? Read the method and confirm.

If `update_booking()` fires with only 1 arg:
```php
do_action( 'bookit_booking_rescheduled', $booking_id );
```
Fix it to pass 2 args:
```php
do_action( 'bookit_booking_rescheduled', $booking_id, $update_data );
```

This must match the hook signature that `Bookit_Staff_Notifier` and
`Bookit_Google_Calendar_Sync` both expect (2 args).

---

## BUG 3 — Staff/admin not notified on booking cancelled (dashboard)

### Root cause (confirmed from code reading)

`cancel_booking()` in `class-dashboard-bookings-api.php` fires:
```php
do_action( 'bookit_after_booking_cancelled', $booking_id, $existing );
```

This looks correct. But the bulk action path in `bulk_action()` also
fires `bookit_after_booking_cancelled` — check whether it passes
`$booking` (the full row) or just `$booking_id` as the second arg.

Also check `class-bookit-loader.php` — the loader registers a
`bookit_after_booking_cancelled` listener with **1 arg** only:
```php
add_action(
    'bookit_after_booking_cancelled',
    function( int $booking_id ) {
        Bookit_Email_Queue::cancel_for_booking( $booking_id );
    },
    10,
    1
);
```

`Bookit_Staff_Notifier::on_booking_cancelled()` expects 2 args.
WordPress will pass 2 args to callbacks registered with
`$accepted_args = 2`. This should work correctly.

Investigate: is `Bookit_Staff_Notifier` actually receiving the hook?
Add a test to confirm. The most likely issue is that the
`notification_preferences` for the staff member defaults to
`immediate` but `get_full_booking()` returns null because the booking
has `deleted_at` set (it was soft-deleted during cancellation).

Read `get_full_booking()` in `class-bookit-staff-notifier.php`:
```php
WHERE b.id = %d AND b.deleted_at IS NULL
```

**This is the bug.** When `cancel_booking()` fires
`bookit_after_booking_cancelled`, it has already set `deleted_at`
on the booking. `get_full_booking()` filters `deleted_at IS NULL`,
so it returns null, and `on_booking_cancelled()` returns early without
sending any notification.

### Fix

In `class-bookit-staff-notifier.php`, update `get_full_booking()` to
remove the `deleted_at IS NULL` filter, OR add a second query without
the filter as a fallback when the first returns null:

```php
private static function get_full_booking( int $booking_id ): ?array {
    global $wpdb;
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT b.*,
                    c.first_name  AS customer_first_name,
                    c.last_name   AS customer_last_name,
                    c.email       AS customer_email,
                    s.name        AS service_name,
                    st.first_name AS staff_first_name,
                    st.last_name  AS staff_last_name
            FROM {$wpdb->prefix}bookings b
            INNER JOIN {$wpdb->prefix}bookings_customers c  ON b.customer_id  = c.id
            INNER JOIN {$wpdb->prefix}bookings_services  s  ON b.service_id   = s.id
            INNER JOIN {$wpdb->prefix}bookings_staff     st ON b.staff_id     = st.id
            WHERE b.id = %d",
            $booking_id
        ),
        ARRAY_A
    );
    return $row ?: null;
}
```

Note: removing `deleted_at IS NULL` is safe here because this method
is only called from hook callbacks that fire immediately after a
booking lifecycle event — the booking will always exist in the DB
(soft-deleted is still a row).

Check whether Bug 2 (`get_full_booking()` with `deleted_at IS NULL`)
affects the reschedule path too — rescheduling does NOT soft-delete,
so it should be fine. But confirm by reading `update_booking()`.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-wizard-api.php — MODIFY

- In `enqueue_magic_link_email()`, for `magic_link_reschedule` case:
  - Fetch full booking with JOINs (service_name, staff_name,
    booking_date, start_time, end_time, magic_link_token, booking_reference
    and all fields needed by `generate_customer_email()`)
  - Instantiate `Booking_System_Email_Sender` and call
    `generate_customer_email( $booking )` for the html_body
  - Update subject to include service name
  - If full booking fetch fails, fall back to the existing stub
    (defensive — don't break cancel emails if JOIN fails)
- Do NOT modify the `magic_link_cancel` path

### includes/notifications/class-bookit-staff-notifier.php — MODIFY

- Remove `AND b.deleted_at IS NULL` from `get_full_booking()` query
- This fixes Bug 3 (cancelled bookings returning null)
- No other changes to this method

### includes/api/class-dashboard-bookings-api.php — MODIFY (if needed)

- If `update_booking()` fires `bookit_booking_rescheduled` with only
  1 arg, update to pass 2 args: `$booking_id, $update_data`
- Read the method before deciding — do NOT modify if already correct

---

## PHPUNIT REQUIREMENTS

Baseline: 976 tests, 0 failures — must not regress.

New test file: `tests/unit/test-6c-hotfix.php`

Required test cases:

- `test_reschedule_email_includes_add_to_calendar_button`
  Verifies the magic_link_reschedule email body contains
  'Add to Calendar' text

- `test_reschedule_email_includes_reschedule_button`
  Verifies the magic_link_reschedule email body contains
  'Reschedule' text

- `test_reschedule_email_includes_cancel_button`
  Verifies the magic_link_reschedule email body contains
  'Cancel' text

- `test_staff_notifier_fires_on_booking_rescheduled_hook`
  Fires `bookit_booking_rescheduled` with a real booking_id and
  confirms the notifier's on_booking_rescheduled() is called
  (use a spy/counter via did_action())

- `test_staff_notifier_fires_on_booking_cancelled_hook`
  Creates a booking, soft-deletes it (sets deleted_at), then fires
  `bookit_after_booking_cancelled` — confirms get_full_booking()
  returns the row despite deleted_at being set

- `test_admin_notified_on_booking_cancelled`
  Creates an admin staff member, creates a booking, fires
  `bookit_after_booking_cancelled` — confirms an email was enqueued
  in wp_bookit_email_queue for the admin

Run after implementation:
  cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Customer reschedule email contains Add to Calendar button
- [ ] Customer reschedule email contains Reschedule button
- [ ] Customer reschedule email contains Cancel Booking button
- [ ] Staff member receives immediate notification when booking
      rescheduled via dashboard
- [ ] Admin staff receive immediate notification when booking
      cancelled via dashboard
- [ ] Magic link cancel email unchanged — still sends plain body

### Technical
- [ ] `get_full_booking()` returns cancelled bookings (deleted_at set)
- [ ] No PHP warnings or notices
- [ ] PHPUnit: 976+ tests, 0 failures

### Must NOT break
- [ ] Booking confirmation email unchanged
- [ ] Magic link cancellation flow unchanged
- [ ] Google Calendar sync hooks unaffected
- [ ] Email queue cancel-on-reschedule logic unaffected

---

## GIT COMMIT MESSAGE

```
Sprint 6C, Task 2: Email notification hotfix

Bug 1: Add action buttons to customer reschedule email — generate_customer_email()
now used for magic_link_reschedule instead of stub HTML

Bug 2: [describe what you found in update_booking() hook call]

Bug 3: Remove deleted_at IS NULL filter from get_full_booking() —
cancelled bookings were returning null before notification could fire

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```