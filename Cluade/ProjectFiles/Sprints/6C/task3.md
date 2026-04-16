Yes, let's move to Task 6C-3. Let me read the staff notifier to understand the current state before writing the prompt.I have everything I need. The code confirms:

- `notify_staff()` calls `Bookit_Notification_Dispatcher::enqueue_email()` with `array()` as params — that's the fix needed
- `get_full_booking()` already fetches `service_name`, `customer_first_name`, `customer_last_name`, `customer_email`, `staff_first_name`, `staff_last_name` — all the data we need is available in `$booking_full`
- The fix is purely additive — just populate `$params` from `$booking_full` before the `enqueue_email()` call

Here's the Cursor prompt:

---

```
TASK 3 OF 3: Populate Brevo params in staff notifier
Sprint: 6C | Est: 2h | Plugin root: bookit-booking-system/

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/notifications/class-bookit-staff-notifier.php — full file
2. includes/notifications/class-bookit-notification-dispatcher.php — 
   confirm enqueue_email() signature and $params handling

If any file does not exist, stop and report before proceeding.

---

## CONTEXT

Bookit_Staff_Notifier currently calls enqueue_email() with an empty
$params array for all immediate email types. The Brevo params
pass-through was wired in Sprint 6A-9 — when a Brevo template ID is
set and params is non-empty, {{ params.X }} variables render correctly
in Brevo templates. Because the notifier passes empty params, all
variables render blank when Brevo templates are used for staff
notifications.

This task populates $params with booking field values in notify_staff()
for all 5 immediate email types. Digest emails are out of scope.

No new files. One file modified: class-bookit-staff-notifier.php.
No Vue changes. No migrations. No new REST endpoints.

---

## IMPLEMENTATION REQUIREMENTS

### includes/notifications/class-bookit-staff-notifier.php — MODIFY

Read the full file first before making any changes.

In `notify_staff()`, find the `enqueue_email()` call inside the
`immediate` branch:

```php
Bookit_Notification_Dispatcher::enqueue_email(
    $email_type,
    $recipient,
    $subject,
    $html_body,
    (int) $booking_full['id'],
    array()   // ← replace this
);
```

Replace `array()` with a populated `$params` array built from
`$booking_full` (which already contains all required fields from
`get_full_booking()`):

```php
$params = array(
    'service_name'      => (string) ( $booking_full['service_name'] ?? '' ),
    'booking_date'      => (string) ( $booking_full['booking_date'] ?? '' ),
    'start_time'        => (string) ( $booking_full['start_time'] ?? '' ),
    'customer_first'    => (string) ( $booking_full['customer_first_name'] ?? '' ),
    'customer_last'     => (string) ( $booking_full['customer_last_name'] ?? '' ),
    'customer_phone'    => (string) ( $booking_full['customer_phone'] ?? '' ),
    'booking_reference' => (string) ( $booking_full['booking_reference'] ?? '' ),
    'dashboard_url'     => home_url( '/bookit-dashboard/app/bookings' ),
    'preferences_url'   => home_url( '/bookit-dashboard/app/profile' ),
);
```

Then pass `$params` to `enqueue_email()`:

```php
Bookit_Notification_Dispatcher::enqueue_email(
    $email_type,
    $recipient,
    $subject,
    $html_body,
    (int) $booking_full['id'],
    $params
);
```

Important notes:
- `customer_phone` — check whether `get_full_booking()` fetches the
  phone column. Read the query carefully. If it does not, either add
  it to the JOIN query or omit `customer_phone` from $params and
  add a code comment noting it is not currently fetched.
- Do NOT modify the digest path — only the `immediate` branch changes.
- Do NOT modify `get_full_booking()` for any reason other than adding
  customer_phone if it is missing.
- This change applies to ALL 5 immediate email types automatically
  since they all go through `notify_staff()` → `enqueue_email()`.

---

## PHPUNIT REQUIREMENTS

Baseline: current passing count, 0 failures — must not regress.

Add to `tests/unit/test-6c-hotfix.php`:

- `test_staff_notifier_passes_booking_params_to_dispatcher`
  Fire `bookit_after_booking_created`, check that the enqueued
  row in `wp_bookit_email_queue` has a non-empty `params` column
  (JSON decode it and assert it is an array with keys)

- `test_staff_notifier_params_include_service_name`
  Assert the params array contains `service_name` matching the
  test booking's service name

- `test_staff_notifier_params_include_customer_name`
  Assert the params array contains `customer_first` and
  `customer_last` matching the test booking's customer

Run: cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] All 5 immediate staff email types pass booking params to
      enqueue_email() (new_booking, reschedule, cancellation,
      reassigned_to, reassigned_away)
- [ ] params contains: service_name, booking_date, start_time,
      customer_first, customer_last, booking_reference,
      dashboard_url, preferences_url
- [ ] customer_phone included if available in get_full_booking(),
      omitted with comment if not
- [ ] Digest path unchanged

### Technical
- [ ] Only notify_staff() modified — no other methods changed
- [ ] No PHP warnings or notices
- [ ] PHPUnit passes (all tests, 0 failures)

### Must NOT break
- [ ] Immediate email sending still works (params is additive)
- [ ] Digest queue insertion unchanged
- [ ] wp_mail provider ignores params silently (no breakage)

---

## GIT COMMIT MESSAGE

```
Sprint 6C, Task 3: Populate Brevo params in staff notifier

- class-bookit-staff-notifier.php: notify_staff() now passes booking
  field values as params to enqueue_email() for all 5 immediate
  email types
- Enables {{ params.X }} variables in Brevo staff notification
  templates to render correctly
- Digest email params deferred (multiple bookings per digest)

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```