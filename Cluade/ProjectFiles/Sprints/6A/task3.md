I now have everything I need. Here is the 6A-3 Cursor prompt:

---

```
TASK 3 OF 10: Bookit_Staff_Notifier — Immediate Dispatch Path
Sprint: 6A | Est: 8h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/notifications/class-bookit-notification-dispatcher.php` — Read the full `enqueue_email()` static method signature exactly: `( string $email_type, array $recipient, string $subject, string $html_body, int $booking_id = 0, array $params = array(), int $delay_seconds = 0 )`. This is the only enqueue method to use.

2. `includes/notifications/class-bookit-email-queue.php` — Read the `insert()` method and confirm the `email_type` column is stored as a plain string slug.

3. `includes/cron/class-bookit-package-expiry.php` — Read the full file. `Bookit_Staff_Notifier` must follow this exact pattern: static-only class, `const CRON_HOOK` equivalent (not needed here but note the `init()` structure), `init()` calls `add_action()` for each hook.

4. `includes/class-bookit-loader.php` — Read `define_cron_hooks()`. Find the block where `Bookit_Package_Expiry::init()` is called — `Bookit_Staff_Notifier::init()` goes immediately after it. Also find `load_dependencies()` to confirm where to add the `require_once` for the new class.

5. `includes/class-bookit-audit-logger.php` — Confirm `log()` signature: `( string $action, string $object_type, int $object_id, array $context = [] )`.

6. `includes/api/class-dashboard-bookings-api.php` — Search for `bookit_after_booking_created` to confirm the hook fires with `( $booking_id, $booking_data )` shape. Also confirm `bookit_after_booking_cancelled` fires with `( $booking_id, $booking_data )`.

7. `database/migrations/0017-create-notification-digest-queue.php` — Confirm the `event_type` ENUM values: `'new_booking'`, `'reschedule'`, `'cancellation'`. These are the only valid values for `event_type` in the digest queue.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-3 creates `Bookit_Staff_Notifier` — a static class that hooks into the four booking lifecycle actions and routes notifications to either immediate dispatch (via `Bookit_Notification_Dispatcher::enqueue_email()`) or the digest queue (`wp_bookit_notification_digest_queue`). This task covers only the **immediate path and digest queue insertion** — the digest cron jobs that process the queue are built in 6A-4. No frontend changes in this task.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/notifications/class-bookit-staff-notifier.php` — CREATE

Static-only class following the `Bookit_Package_Expiry` pattern exactly.

**Class structure:**

```php
class Bookit_Staff_Notifier {

    public static function init(): void { ... }

    public static function on_booking_created( int $booking_id, array $booking_data ): void { ... }
    public static function on_booking_rescheduled( int $booking_id, array $booking_data ): void { ... }
    public static function on_booking_cancelled( int $booking_id, array $booking_data ): void { ... }
    public static function on_booking_reassigned( int $booking_id, int $old_staff_id, int $new_staff_id, array $booking_data ): void { ... }

    private static function notify_staff( int $staff_id, string $event_type, string $email_type, array $booking_full, array $booking_data ): void { ... }
    private static function get_admin_staff(): array { ... }
    private static function get_staff_preferences( int $staff_id ): array { ... }
    private static function get_full_booking( int $booking_id ): ?array { ... }
    private static function build_subject( string $email_type, array $booking ): string { ... }
    private static function build_html_body( string $email_type, array $booking ): string { ... }
    private static function insert_digest_queue( int $staff_id, string $event_type, int $booking_id ): void { ... }
}
```

**`init()` method** — registers all four hooks:

```php
public static function init(): void {
    add_action( 'bookit_after_booking_created',  array( __CLASS__, 'on_booking_created' ),    10, 2 );
    add_action( 'bookit_booking_rescheduled',    array( __CLASS__, 'on_booking_rescheduled' ), 10, 2 );
    add_action( 'bookit_after_booking_cancelled', array( __CLASS__, 'on_booking_cancelled' ),   10, 2 );
    add_action( 'bookit_booking_reassigned',     array( __CLASS__, 'on_booking_reassigned' ),  10, 4 );
}
```

**`on_booking_created()`** — notifies assigned staff + all admin staff:

```php
public static function on_booking_created( int $booking_id, array $booking_data ): void {
    $booking = self::get_full_booking( $booking_id );
    if ( null === $booking ) {
        return;
    }

    $assigned_staff_id = (int) $booking['staff_id'];
    $admin_staff       = self::get_admin_staff();

    // Build deduplicated recipient list.
    $staff_ids = array( $assigned_staff_id );
    foreach ( $admin_staff as $admin ) {
        $staff_ids[] = (int) $admin['id'];
    }
    $staff_ids = array_unique( $staff_ids );

    foreach ( $staff_ids as $staff_id ) {
        self::notify_staff( $staff_id, 'new_booking', 'staff_new_booking_immediate', $booking, $booking_data );
    }
}
```

**`on_booking_rescheduled()`** — same recipient logic as created, uses `reschedule` preference key and `staff_reschedule_immediate` email type.

**`on_booking_cancelled()`** — same recipient logic, uses `cancellation` preference key and `staff_cancellation_immediate` email type.

**`on_booking_reassigned()`** — two separate notification groups:
- New assignee + all admins → `new_booking` preference key → `staff_reassigned_to_immediate` email type
- Old assignee → `cancellation` preference key → `staff_reassigned_away_immediate` email type
- Deduplicate each group independently before iterating
- If `$old_staff_id === $new_staff_id` — return early (should not happen, but defensive guard)

**`notify_staff()`** — the core routing method:

```php
private static function notify_staff( int $staff_id, string $event_type, string $email_type, array $booking_full, array $booking_data ): void {
    global $wpdb;

    // Fetch staff row.
    $staff = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, email, first_name, last_name, notification_preferences, is_active, deleted_at
             FROM {$wpdb->prefix}bookings_staff
             WHERE id = %d",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $staff ) {
        return;
    }

    // Skip inactive or deleted staff.
    if ( ! (int) $staff['is_active'] || null !== $staff['deleted_at'] ) {
        return;
    }

    // Skip staff with no email.
    if ( empty( $staff['email'] ) ) {
        Bookit_Audit_Logger::log(
            'staff_notification.skipped_no_email',
            'staff',
            $staff_id,
            array()
        );
        return;
    }

    $prefs     = self::get_staff_preferences( $staff_id );
    $frequency = $prefs[ $event_type ] ?? 'immediate';

    if ( 'immediate' === $frequency ) {
        $recipient = array(
            'email' => sanitize_email( $staff['email'] ),
            'name'  => trim( $staff['first_name'] . ' ' . $staff['last_name'] ),
        );
        $subject   = self::build_subject( $email_type, $booking_full );
        $html_body = self::build_html_body( $email_type, $booking_full );

        Bookit_Notification_Dispatcher::enqueue_email(
            $email_type,
            $recipient,
            $subject,
            $html_body,
            (int) $booking_full['id'],
            array()
        );
    } elseif ( in_array( $frequency, array( 'daily', 'weekly' ), true ) ) {
        // Map email_type back to digest event_type (always one of the three ENUM values).
        $digest_event = $event_type; // 'new_booking', 'reschedule', or 'cancellation'.
        self::insert_digest_queue( $staff_id, $digest_event, (int) $booking_full['id'] );
    }
}
```

**`get_admin_staff()`** — exactly as specified in the sprint prompt:

```php
private static function get_admin_staff(): array {
    global $wpdb;
    return $wpdb->get_results(
        "SELECT id, email, first_name, last_name, notification_preferences
         FROM {$wpdb->prefix}bookings_staff
         WHERE role = 'admin'
           AND is_active = 1
           AND deleted_at IS NULL
           AND email != ''",
        ARRAY_A
    );
}
```

**`get_staff_preferences()`** — exactly as specified in the sprint prompt (same logic already tested inline in 6A-2):

```php
private static function get_staff_preferences( int $staff_id ): array {
    global $wpdb;
    $raw = $wpdb->get_var( $wpdb->prepare(
        "SELECT notification_preferences FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
        $staff_id
    ) );
    $defaults = array(
        'new_booking'    => 'immediate',
        'reschedule'     => 'immediate',
        'cancellation'   => 'immediate',
        'daily_schedule' => false,
    );
    if ( empty( $raw ) ) {
        return $defaults;
    }
    $parsed = json_decode( $raw, true );
    return is_array( $parsed ) ? array_merge( $defaults, $parsed ) : $defaults;
}
```

**`get_full_booking()`** — fetches a full booking row joined with customer, service, and staff names:

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
             WHERE b.id = %d AND b.deleted_at IS NULL",
            $booking_id
        ),
        ARRAY_A
    );
    return $row ?: null;
}
```

**`build_subject()`** — implements the subject lines from the sprint spec. Map each `$email_type` slug to its subject using the booking fields. Format dates as `d M Y` (e.g. `14 Apr 2026`). Use `customer_first_name`, `customer_last_name`, `service_name`, `booking_date`, `start_time` from the `$booking` array.

**`build_html_body()`** — brief, action-oriented HTML. Include:
- Customer name, service, date, time, booking reference (`booking_reference` column or `id` if absent)
- Dashboard link: `<a href="{site_url}/bookit-dashboard/app/bookings?date={booking_date}">View in dashboard</a>`
- Footer line: `You're receiving this because you're set to immediate notifications. <a href="{site_url}/bookit-dashboard/app/profile">Change your preferences</a>`
- Use `get_site_url()` not hardcoded URLs
- No inline styles beyond basic `<p>` and `<a>` tags — keep it simple

**`insert_digest_queue()`**:

```php
private static function insert_digest_queue( int $staff_id, string $event_type, int $booking_id ): void {
    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'bookit_notification_digest_queue',
        array(
            'staff_id'   => $staff_id,
            'event_type' => $event_type,
            'booking_id' => $booking_id,
            'processed'  => 0,
            'created_at' => current_time( 'mysql' ),
        ),
        array( '%d', '%s', '%d', '%d', '%s' )
    );
}
```

### `includes/class-bookit-loader.php` — MODIFY

Two changes:

1. In `load_dependencies()`, add after the existing notification dispatcher require:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/class-bookit-staff-notifier.php';
```

2. In `define_cron_hooks()`, add immediately after `Bookit_Package_Expiry::init()`:
```php
Bookit_Staff_Notifier::init();
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables (digest queue table created in 6A-2)
- [ ] No new migrations
- [ ] Audit log event fired: `staff_notification.skipped_no_email` on `staff` when email is empty
- [ ] No new REST endpoints
- [ ] No new error codes

---

## PHPUNIT REQUIREMENTS

Baseline: **893 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-staff-notifier.php`

Read `tests/unit/test-package-expiry-cron.php` for the test helper pattern (setUp/tearDown truncating tables, inserting minimal data). Follow that pattern.

In `setUp()`, truncate: `bookings_email_queue`, `bookit_notification_digest_queue`, `bookings_audit_log`, `bookings`, `bookings_staff_services`, `bookings_services`, `bookings_staff`, `bookings_customers`.

Use `add_filter( 'pre_wp_mail', fn() => true )` to prevent actual email sends in tests.

Required test cases:

- `test_new_booking_enqueues_email_for_assigned_staff`: Create a booking with assigned staff. Fire `bookit_after_booking_created`. Assert one row in `wp_bookit_email_queue` with `email_type = 'staff_new_booking_immediate'` and correct `recipient_email`.

- `test_new_booking_enqueues_email_for_all_admin_staff`: Create a booking. Add two admin-role staff. Fire hook. Assert two rows in queue (one per admin).

- `test_new_booking_deduplicates_when_admin_is_assignee`: Create a booking where the assigned staff is also admin-role. Fire hook. Assert exactly one queue row for that staff member, not two.

- `test_reschedule_enqueues_via_reschedule_preference`: Fire `bookit_booking_rescheduled`. Assert queue row with `email_type = 'staff_reschedule_immediate'`.

- `test_cancellation_enqueues_via_cancellation_preference`: Fire `bookit_after_booking_cancelled`. Assert queue row with `email_type = 'staff_cancellation_immediate'`.

- `test_reassignment_notifies_new_assignee_via_new_booking_preference`: Fire `bookit_booking_reassigned` with different old/new staff IDs. Assert new assignee gets `staff_reassigned_to_immediate` queue row.

- `test_reassignment_notifies_old_assignee_via_cancellation_preference`: Same fire. Assert old assignee gets `staff_reassigned_away_immediate` queue row.

- `test_staff_with_no_email_is_skipped_silently`: Insert staff with empty email. Fire hook. Assert zero queue rows for that staff, and one audit log row with action `staff_notification.skipped_no_email`.

- `test_inactive_staff_not_notified`: Insert staff with `is_active = 0`. Fire hook. Assert zero queue rows for that staff.

- `test_digest_preference_inserts_into_digest_queue_not_email_queue`: Set staff `notification_preferences = '{"new_booking":"daily"}'`. Fire `bookit_after_booking_created`. Assert zero rows in `wp_bookit_email_queue` for that staff, and one row in `wp_bookit_notification_digest_queue` with `event_type = 'new_booking'` and `processed = 0`.

- `test_weekly_preference_inserts_into_digest_queue`: Same as above but `"new_booking":"weekly"`. Assert digest queue row inserted.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `bookit_after_booking_created` → assigned staff + all active admin staff notified
- [ ] `bookit_booking_rescheduled` → same recipients notified with reschedule email type
- [ ] `bookit_after_booking_cancelled` → same recipients notified with cancellation email type
- [ ] `bookit_booking_reassigned` → new assignee gets `staff_reassigned_to_immediate`, old assignee gets `staff_reassigned_away_immediate`
- [ ] Deduplication: a staff member appears at most once per event regardless of how many qualifying reasons
- [ ] Staff with empty email skipped silently, audit log entry fired
- [ ] Inactive staff (`is_active = 0`) not notified
- [ ] Deleted staff (`deleted_at IS NOT NULL`) not notified
- [ ] `daily` or `weekly` preference → row inserted in digest queue, NOT in email queue
- [ ] `immediate` preference → row inserted in email queue, NOT in digest queue

### Technical
- [ ] No PHP warnings or notices
- [ ] Class is static-only, follows `Bookit_Package_Expiry` pattern
- [ ] `init()` called from `class-bookit-loader.php` `define_cron_hooks()`
- [ ] `enqueue_email()` called with correct 6-parameter signature
- [ ] PHPUnit suite passes (904+ tests, 0 failures)

### Must NOT break
- [ ] `bookit_after_booking_created` existing listeners in loader — still fire
- [ ] `bookit_booking_rescheduled` existing `Bookit_Email_Queue::cancel_for_booking()` listener — still fires
- [ ] `bookit_after_booking_cancelled` existing `Bookit_Email_Queue::cancel_for_booking()` listener — still fires
- [ ] Customer confirmation emails — unchanged

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 3: Bookit_Staff_Notifier — immediate dispatch + digest queue routing

- New class: includes/notifications/class-bookit-staff-notifier.php
- Hooks into bookit_after_booking_created, bookit_booking_rescheduled,
  bookit_after_booking_cancelled, bookit_booking_reassigned
- Immediate preference: enqueues via Bookit_Notification_Dispatcher::enqueue_email()
- Daily/weekly preference: inserts into wp_bookit_notification_digest_queue
- Deduplication via array_unique() before iterating recipients
- Skips inactive/deleted staff and staff with empty email
- Registered via Bookit_Staff_Notifier::init() in class-bookit-loader.php
- New test file: tests/unit/test-staff-notifier.php (11 new tests)

Tests: 904 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.