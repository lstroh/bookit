# SPRINT 6C: HOTFIX
# Bookit Booking System — WordPress Plugin
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/

---

## YOUR ROLE

You are the Sprint Implementation Assistant for Sprint 6C — a focused hotfix
sprint. Three tasks, ~7h total. Generate one Cursor prompt per task. Liron
confirms each task complete before you move to the next.

Escalate any architectural conflict to the Project Assistant (separate chat).

---

## WORKFLOW RULES

- **Read before write.** GitHub connector on every file before writing code.
- **Additive only.** No modifications to working code without explicit reason.
- **One task at a time.** Confirmed complete before proceeding.
- **No frontend build needed** for tasks 6C-1 and 6C-2 (PHP only).
  Task 6C-3 modifies no files — PHP only, no Vue.

---

## PROJECT CONTEXT

- **Test suite baseline:** 976 tests, 0 failures (Sprint 6B-1 complete)
- **PHPUnit:** `cd bookit-booking-system && vendor/bin/phpunit`
- **Live site:** test.wimbledonsmart.co.uk (Hostinger, LiteSpeed)
- **Three-layer cache purge after any frontend deploy:**
  1. LiteSpeed Cache plugin → Purge All
  2. Hostinger hPanel → Cache Manager → Purge All
  3. Hostinger hPanel → CDN → Purge Cache

---

## TASK 6C-1 — Cache-Busting Fix (~1h)

### Problem

The dashboard JS is loaded via a raw `<script>` tag in
`dashboard/app/index.php` with a hardcoded URL:

```php
<script type="module" src="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/index.js' ); ?>"></script>
```

There is no version parameter. Browsers and CDN cache this URL indefinitely.
After every frontend deployment, a 3-layer manual cache purge is required
to force clients to load fresh JS.

### Fix

Replace the hardcoded `<script>` tag with a versioned URL that appends
`?v=BOOKIT_VERSION` as a query string. When `BOOKIT_VERSION` changes, the
URL changes, and browsers/CDN automatically fetch the fresh file.

Similarly, the `style.css` link tag has the same problem:
```php
<link rel="stylesheet" href="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/style.css' ); ?>">
```

Fix both in the same pass.

### Implementation

**File to modify:** `dashboard/app/index.php`

Read the full file first via GitHub connector before making any changes.

Change the JS script tag from:
```php
<script type="module" src="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/index.js' ); ?>"></script>
```
To:
```php
<script type="module" src="<?php echo esc_url( add_query_arg( 'v', BOOKIT_VERSION, BOOKIT_PLUGIN_URL . 'dashboard/dist/index.js' ) ); ?>"></script>
```

Change the CSS link tag from:
```php
<link rel="stylesheet" href="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/style.css' ); ?>">
```
To:
```php
<link rel="stylesheet" href="<?php echo esc_url( add_query_arg( 'v', BOOKIT_VERSION, BOOKIT_PLUGIN_URL . 'dashboard/dist/style.css' ) ); ?>">
```

Use `add_query_arg()` — it handles URL encoding correctly and is the
WordPress-standard way to append query parameters to URLs.

Also check `dashboard/setup.php` — it may have the same pattern for the setup
wizard JS/CSS. Read it and apply the same fix if present.

### PHPUnit requirements

No new tests needed — this is a URL formatting change with no testable
PHP logic. Confirm existing 976 tests still pass after the change.

### Manual verification on live site

After deploying:
1. Open DevTools → Network tab in Chrome
2. Hard reload the dashboard (`Ctrl+Shift+R`)
3. Confirm `index.js` URL now includes `?v=1.x.x` (or whatever BOOKIT_VERSION is)
4. Change BOOKIT_VERSION in the plugin (temporarily) and redeploy — confirm
   the URL changes and the browser fetches fresh JS without a manual cache purge

### Git commit message
```
Sprint 6C, Task 1: Add version-based cache busting to dashboard assets

- dashboard/app/index.php: append ?v=BOOKIT_VERSION to index.js and style.css
- dashboard/setup.php: same fix if applicable
- Eliminates 3-layer manual cache purge after every frontend deployment
```

---

## TASK 6C-2 — Email Notification Hotfix (~4h)

### Three confirmed bugs (all pre-existing from Sprint 6A)

**Bug 1 — Customer reschedule email missing action buttons**

The booking confirmation email (`send_customer_confirmation()`) correctly
includes Add to Calendar, Reschedule, and Cancel buttons.

The reschedule confirmation email sent to the customer does NOT include
these buttons — they are missing entirely.

**Root cause to investigate:** Find where the customer reschedule email is
generated in `class-email-sender.php`. There will be a separate method or
template path for reschedule emails — read it and compare it with the
confirmation email path to identify where the action buttons are absent.
The buttons were added to the confirmation email in Sprint 5A-2 — the
reschedule email was not updated at the same time.

**Bug 2 — Staff not notified on booking rescheduled (dashboard)**

When admin reschedules a booking via the dashboard (`update_booking()` in
`class-dashboard-bookings-api.php`), the `bookit_booking_rescheduled` hook
fires (confirmed added in Sprint 6A-1). `Bookit_Staff_Notifier` is hooked
to `bookit_booking_rescheduled`.

Investigate why staff notification is not being received. Possible causes:
- The hook fires but `Bookit_Staff_Notifier::on_booking_rescheduled()` is
  not receiving the right parameters (check hook signature — does it pass
  `$booking_id` only, or `$booking_id, $booking_data`?)
- The staff preference check is returning `daily` or `weekly` and the item
  is sitting in the digest queue rather than sending immediately
- The email is being enqueued but failing silently at the dispatcher level
  (check `wp_bookit_email_queue` table on live site for `failed` rows)
- `Bookit_Staff_Notifier` is not hooking to `bookit_booking_rescheduled`
  with the correct priority or arg count

Read `includes/notifications/class-bookit-staff-notifier.php` and
`includes/class-bookit-loader.php` in full before investigating.

**Bug 3 — Staff/admin not notified on booking cancelled (dashboard)**

Same investigation approach as Bug 2 but for the cancellation path.
When admin cancels a booking via the dashboard, `bookit_after_booking_cancelled`
should fire. Check:
- Does `update_booking()` / the cancel endpoint actually fire
  `bookit_after_booking_cancelled` with the correct signature?
- Is `Bookit_Staff_Notifier` hooked to it with the correct arg count?
- Same digest queue / dispatcher checks as Bug 2

### Files to read before writing any Cursor prompt

1. `includes/email/class-email-sender.php` — full file — find reschedule
   email method and compare with confirmation email method
2. `includes/notifications/class-bookit-staff-notifier.php` — full file —
   check hook registrations and `on_booking_rescheduled()` /
   `on_booking_cancelled()` implementations
3. `includes/class-bookit-loader.php` — confirm hook registration for
   `bookit_booking_rescheduled` and `bookit_after_booking_cancelled`
4. `includes/api/class-dashboard-bookings-api.php` — confirm where and how
   `bookit_after_booking_cancelled` is fired from the cancel endpoint
5. `includes/api/class-wizard-api.php` — confirm magic link cancel also
   fires the hook (it should — tested in Sprint 5A)

### PHPUnit requirements

Baseline: 976 tests, 0 failures.

New test file: `tests/unit/test-6c-hotfix.php`

Required test cases:
- `test_reschedule_email_includes_add_to_calendar_button`
- `test_reschedule_email_includes_reschedule_button`
- `test_reschedule_email_includes_cancel_button`
- `test_staff_notifier_fires_on_booking_rescheduled_hook`
- `test_staff_notifier_fires_on_booking_cancelled_hook`
- `test_admin_notified_on_booking_cancelled`

### Git commit message
```
Sprint 6C, Task 2: Email notification hotfix

Bug 1: Add action buttons (Add to Calendar, Reschedule, Cancel) to
customer reschedule confirmation email — missing since Sprint 5A-2

Bug 2: Fix staff reschedule notification — [describe root cause found]

Bug 3: Fix staff/admin cancellation notification — [describe root cause found]

Tests: [N] passing, 0 failures
```

---

## TASK 6C-3 — Brevo Staff Email Template Params (~2h)

### Problem

`Bookit_Staff_Notifier` currently calls `Bookit_Notification_Dispatcher::enqueue_email()`
with an empty `$params` array:

```php
Bookit_Notification_Dispatcher::enqueue_email(
    email_type: 'staff_new_booking_immediate',
    recipient_email: $staff['email'],
    recipient_name: $staff['first_name'] . ' ' . $staff['last_name'],
    booking_id: $booking_id,
    params: []  // ← empty — template variables will render blank
);
```

The Brevo params pass-through was wired in Sprint 6A-9 — when a Brevo
template ID is set and params is non-empty, `{{ params.X }}` variables
render correctly in the Brevo template. But because the notifier passes
empty params, all variables will render blank when Brevo templates are
eventually created for staff notifications.

### Fix

In `class-bookit-staff-notifier.php`, populate the `$params` array with
booking field values before calling `enqueue_email()`.

**Read `class-bookit-staff-notifier.php` in full first** to understand the
current method structure and what booking data is available at each call site.

The params to pass (match these keys exactly — Brevo templates will use
`{{ params.service_name }}` etc.):

```php
$params = [
    'service_name'       => $booking['service_name'] ?? '',
    'booking_date'       => $booking['booking_date'] ?? '',
    'start_time'         => $booking['start_time'] ?? '',
    'customer_first'     => $booking['customer_first_name'] ?? '',
    'customer_last'      => $booking['customer_last_name'] ?? '',
    'customer_phone'     => $booking['customer_phone'] ?? '',
    'booking_reference'  => $booking['booking_reference'] ?? '',
    'dashboard_url'      => home_url( '/bookit-dashboard/app/bookings' ),
    'preferences_url'    => home_url( '/bookit-dashboard/app/profile' ),
];
```

These params must be populated for all five immediate email types:
- `staff_new_booking_immediate`
- `staff_reschedule_immediate`
- `staff_cancellation_immediate`
- `staff_reassigned_to_immediate`
- `staff_reassigned_away_immediate`

For digest emails (`staff_daily_digest`, `staff_weekly_digest`,
`staff_daily_schedule`), params are built differently (multiple bookings
per email) — leave those for when digest Brevo templates are created.
Do not attempt to fix digest params in this task.

**Investigate what booking data is available** at each call site in
`class-bookit-staff-notifier.php`. The `$booking_data` array passed via
the hook may or may not contain customer details — if not, a DB JOIN
may be needed. Read the method carefully before deciding.

If the booking data available in the notifier does not include customer
name, phone, or service name (these are in separate tables), add a helper
method to fetch the full booking with JOINs:

```php
private static function get_full_booking( int $booking_id ): ?array {
    global $wpdb;
    return $wpdb->get_row(
        $wpdb->prepare(
            "SELECT b.*,
                    s.name AS service_name,
                    c.first_name AS customer_first_name,
                    c.last_name AS customer_last_name,
                    c.phone AS customer_phone
             FROM {$wpdb->prefix}bookings b
             JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
             JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
             WHERE b.id = %d AND b.deleted_at IS NULL",
            $booking_id
        ),
        ARRAY_A
    );
}
```

### PHPUnit requirements

Add to `tests/unit/test-6c-hotfix.php`:
- `test_staff_notifier_passes_booking_params_to_dispatcher`
- `test_staff_notifier_params_include_service_name`
- `test_staff_notifier_params_include_customer_name`

### Git commit message
```
Sprint 6C, Task 3: Populate Brevo params in staff notifier

Bookit_Staff_Notifier now passes booking field values as params
when enqueuing immediate staff notification emails. Enables
{{ params.X }} variables in Brevo templates to render correctly.

Digest email params deferred (multiple bookings per digest).

Tests: [N] passing, 0 failures
```

---

## SPRINT 6C ACCEPTANCE CRITERIA

- [ ] Dashboard JS and CSS URLs include `?v=BOOKIT_VERSION`
- [ ] Browser fetches fresh dashboard JS after version change without manual
      cache purge
- [ ] Customer reschedule email includes Add to Calendar, Reschedule,
      and Cancel buttons
- [ ] Staff member receives reschedule notification when booking rescheduled
- [ ] Staff/admin receive cancellation notification when booking cancelled
- [ ] Staff notifier passes booking field params to dispatcher for all
      5 immediate email types
- [ ] PHPUnit: 976+ tests, 0 failures
- [ ] No PHP warnings or notices

---

## START HERE

1. Confirm you have read and understood this prompt
2. Start with Task 6C-1 (cache-busting) — read `dashboard/app/index.php`
   and `dashboard/setup.php` via GitHub connector first
3. Liron confirms 6C-1 complete before you generate the 6C-2 prompt
4. For 6C-2, read all listed files before writing the Cursor prompt — the
   root cause of Bugs 2 and 3 must be identified from reading the code,
   not assumed

If you find the root cause of Bug 2 or Bug 3 is something not covered by
this prompt, stop and report back before writing implementation guidance.