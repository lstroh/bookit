I have the full picture of the activator, deactivator, and cron patterns. Now generating the 6A-4 prompt:

---

```
TASK 5 OF 10: Digest Cron Jobs — Daily, Weekly, Daily Schedule
Sprint: 6A | Est: 8h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/cron/class-bookit-package-expiry.php` — Read the full file. Every new cron class must follow this pattern exactly: `const CRON_HOOK`, static-only methods, `init()`, `register_cron()`, `unregister_cron()`, `run_cleanup_with_tracking()`. Pay attention to the `wp_next_scheduled()` guard in `register_cron()` and `update_option()` tracking calls in `run_cleanup_with_tracking()`.

2. `includes/class-bookit-activator.php` — Read the full `activate()` method. Find where `Bookit_Package_Expiry::register_cron()` is called — all three new `register_cron()` calls go immediately after it.

3. `includes/class-bookit-deactivator.php` — Read the full `deactivate()` method. Find where `Bookit_Package_Expiry::unregister_cron()` is called — all three new `unregister_cron()` calls go immediately after it.

4. `includes/class-bookit-loader.php` — Read `define_cron_hooks()` and `load_dependencies()`. Find where `Bookit_Package_Expiry::init()` and `Bookit_Staff_Notifier::init()` are called — the three new `::init()` calls go immediately after them. Also confirm where to add the three new `require_once` statements.

5. `includes/notifications/class-bookit-notification-dispatcher.php` — Re-read `enqueue_email()` signature to confirm parameter order before writing the digest send calls.

6. `includes/notifications/class-bookit-staff-notifier.php` — Read `get_staff_preferences()` to confirm the preference keys and valid frequency values (`'immediate'`, `'daily'`, `'weekly'`, `false` for `daily_schedule`).

7. `database/migrations/0017-create-notification-digest-queue.php` — Confirm exact table name (`{prefix}bookit_notification_digest_queue`) and column names (`staff_id`, `event_type`, `booking_id`, `processed`, `created_at`).

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-4 creates three cron classes that process the digest queue built in 6A-2 and 6A-3. `Bookit_Staff_Digest_Daily` and `Bookit_Staff_Digest_Weekly` drain the `wp_bookit_notification_digest_queue` for staff who chose daily/weekly frequency. `Bookit_Staff_Schedule_Daily` sends each opted-in staff member a summary of today's bookings every morning. All three follow the `Bookit_Package_Expiry` pattern exactly.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/cron/class-bookit-staff-digest-daily.php` — CREATE

```php
class Bookit_Staff_Digest_Daily {

    const CRON_HOOK = 'bookit_staff_digest_daily';

    public static function init(): void { ... }
    public static function register_cron(): void { ... }
    public static function unregister_cron(): void { ... }
    public static function run_digest_with_tracking(): void { ... }
    public static function run_digest(): int { ... }
}
```

**`register_cron()`** — schedules daily at `staff_digest_send_time` setting (default `'18:00'`) in business timezone:

```php
public static function register_cron(): void {
    if ( wp_next_scheduled( self::CRON_HOOK ) ) {
        return;
    }
    $timezone  = get_option( 'timezone_string' ) ?: 'Europe/London';
    $send_time = self::get_setting( 'staff_digest_send_time' ) ?: '18:00';
    try {
        $dt = new DateTime( 'today ' . $send_time, new DateTimeZone( $timezone ) );
        // If today's send time has already passed, schedule for tomorrow.
        if ( $dt->getTimestamp() <= time() ) {
            $dt->modify( '+1 day' );
        }
        $timestamp = $dt->getTimestamp();
    } catch ( Exception $e ) {
        $timestamp = strtotime( 'today 18:00:00' ) + DAY_IN_SECONDS;
    }
    wp_schedule_event( $timestamp, 'daily', self::CRON_HOOK );
}
```

**`unregister_cron()`** — exact same pattern as `Bookit_Package_Expiry::unregister_cron()`.

**`init()`** — registers the cron hook action:
```php
public static function init(): void {
    add_action( self::CRON_HOOK, array( __CLASS__, 'run_digest_with_tracking' ) );
}
```

**`run_digest_with_tracking()`** — calls `run_digest()`, updates `bookit_staff_digest_daily_last_run` and `bookit_staff_digest_daily_last_count` options (same pattern as package expiry).

**`run_digest()`** — the main processing method:

1. Query all unprocessed rows for staff whose preference for that `event_type` is `'daily'`:
```sql
SELECT DISTINCT staff_id
FROM wp_bookit_notification_digest_queue
WHERE processed = 0
```
Get the distinct staff IDs, then for each check their preference.

2. For each qualifying `staff_id`:
   a. Fetch staff row — skip if inactive, deleted, or empty email.
   b. Fetch all unprocessed queue rows for this staff member grouped by `event_type`:
   ```sql
   SELECT id, event_type, booking_id
   FROM wp_bookit_notification_digest_queue
   WHERE staff_id = %d AND processed = 0
   ```
   c. Filter to only rows where the staff member's preference for that `event_type` is `'daily'`. Collect the row IDs that will be processed.
   d. If no qualifying rows after filtering — skip.
   e. For each qualifying `booking_id`, fetch full booking data (join with customer, service, staff tables). Filter out bookings where `status = 'cancelled'` OR `deleted_at IS NOT NULL`.
   f. If no active bookings remain after filter — mark rows processed, skip email.
   g. **Mark rows processed BEFORE enqueuing** (prevents double-send on retry):
   ```php
   // Mark before enqueue — prevents double-send if enqueue fails.
   $wpdb->query( $wpdb->prepare(
       "UPDATE {$wpdb->prefix}bookit_notification_digest_queue
        SET processed = 1
        WHERE id IN (" . implode( ',', array_fill( 0, count( $row_ids ), '%d' ) ) . ")",
       ...$row_ids
   ) );
   ```
   h. Build digest email subject and HTML body — group bookings by event type in sections: "New Bookings", "Rescheduled", "Cancelled". Only include sections that have items.
   i. Enqueue via `Bookit_Notification_Dispatcher::enqueue_email()` with `email_type = 'staff_daily_digest'`.

3. Return count of staff members who were sent a digest.

**`get_setting()` private helper** — reads from `wp_bookings_settings` using `$wpdb->get_var()`. Same pattern as existing provider classes:
```php
private static function get_setting( string $key, string $default = '' ): string {
    global $wpdb;
    $value = $wpdb->get_var( $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
        $key
    ) );
    return ( null !== $value && '' !== $value ) ? (string) $value : $default;
}
```

**Email content for digest:**

Subject: `Daily digest: {N} booking update(s) for {date}`

Body: Simple HTML with sections per event type. For each booking in a section: customer name, service, date, time. One dashboard link at the bottom. Footer: `You're receiving this because you're set to daily digest notifications. <a href="{site_url}/bookit-dashboard/app/profile">Change your preferences</a>`

---

### `includes/cron/class-bookit-staff-digest-weekly.php` — CREATE

Identical structure to `Bookit_Staff_Digest_Daily` with these differences:

- `const CRON_HOOK = 'bookit_staff_digest_weekly'`
- `register_cron()` uses `staff_digest_weekly_day` setting (default `'1'` = Monday) to calculate the next occurrence of that weekday at `staff_digest_send_time`
- `run_digest()` filters for preference `= 'weekly'` instead of `'daily'`
- Email type: `'staff_weekly_digest'`
- Subject: `Weekly digest: {N} booking update(s) for the week`
- Tracking options: `bookit_staff_digest_weekly_last_run` / `bookit_staff_digest_weekly_last_count`

**Weekly schedule calculation:**
```php
$day_num   = (int) ( self::get_setting( 'staff_digest_weekly_day' ) ?: 1 ); // 1=Mon, 7=Sun
$send_time = self::get_setting( 'staff_digest_send_time' ) ?: '18:00';
$timezone  = get_option( 'timezone_string' ) ?: 'Europe/London';
$days      = array( 1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday',
                    4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday' );
$day_name  = $days[ $day_num ] ?? 'Monday';
$dt        = new DateTime( 'next ' . $day_name . ' ' . $send_time, new DateTimeZone( $timezone ) );
$timestamp = $dt->getTimestamp();
wp_schedule_event( $timestamp, 'weekly', self::CRON_HOOK );
```

Note: `'weekly'` is a valid WordPress cron schedule (built-in since WP 5.4). Confirm with `wp_get_schedules()` — if not present, use a custom schedule registered via `cron_schedules` filter. Read the existing codebase for any existing custom schedule registrations before adding a new one.

---

### `includes/cron/class-bookit-staff-schedule-daily.php` — CREATE

- `const CRON_HOOK = 'bookit_staff_schedule_daily'`
- `register_cron()` schedules daily at `staff_schedule_send_time` setting (default `'08:00'`) using the same timezone pattern as `Bookit_Staff_Digest_Daily`.

**`run_schedule()`** — the main processing method:

1. Get all active staff with `daily_schedule = true` in preferences:
```php
$staff_rows = $wpdb->get_results(
    "SELECT id, email, first_name, last_name, notification_preferences
     FROM {$wpdb->prefix}bookings_staff
     WHERE is_active = 1
       AND deleted_at IS NULL
       AND email != ''",
    ARRAY_A
);
// Then filter in PHP for daily_schedule = true using get_staff_preferences() pattern.
```

2. For each opted-in staff member:
   a. Query today's bookings:
   ```sql
   SELECT b.*, s.name as service_name,
          c.first_name as customer_first_name, c.last_name as customer_last_name
   FROM wp_bookings b
   JOIN wp_bookings_services s ON b.service_id = s.id
   JOIN wp_bookings_customers c ON b.customer_id = c.id
   WHERE b.staff_id = %d
     AND b.booking_date = %s
     AND b.status IN ('confirmed','pending_payment')
     AND b.deleted_at IS NULL
   ORDER BY b.start_time ASC
   ```
   Use `gmdate( 'Y-m-d' )` for today's date.
   b. If no bookings — skip (no email on empty days).
   c. Build schedule email listing each booking: time, customer name, service name.
   d. Dashboard link: `{site_url}/bookit-dashboard/app/bookings?date={today}`
   e. Enqueue with `email_type = 'staff_daily_schedule'`.

Subject: `Your schedule for today, {date}` (e.g. `Your schedule for today, 9 Apr 2026`)

Tracking options: `bookit_staff_schedule_daily_last_run` / `bookit_staff_schedule_daily_last_count`

---

### `includes/class-bookit-activator.php` — MODIFY

After `Bookit_Package_Expiry::register_cron()`, add:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-daily.php';
Bookit_Staff_Digest_Daily::register_cron();

require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-weekly.php';
Bookit_Staff_Digest_Weekly::register_cron();

require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-schedule-daily.php';
Bookit_Staff_Schedule_Daily::register_cron();
```

### `includes/class-bookit-deactivator.php` — MODIFY

After `Bookit_Package_Expiry::unregister_cron()`, add:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-daily.php';
Bookit_Staff_Digest_Daily::unregister_cron();

require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-weekly.php';
Bookit_Staff_Digest_Weekly::unregister_cron();

require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-schedule-daily.php';
Bookit_Staff_Schedule_Daily::unregister_cron();
```

### `includes/class-bookit-loader.php` — MODIFY

In `load_dependencies()`, after the `class-bookit-staff-notifier.php` require, add:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-daily.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-digest-weekly.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-staff-schedule-daily.php';
```

In `define_cron_hooks()`, after `Bookit_Staff_Notifier::init()`, add:
```php
Bookit_Staff_Digest_Daily::init();
Bookit_Staff_Digest_Weekly::init();
Bookit_Staff_Schedule_Daily::init();
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables or migrations
- [ ] No new error codes
- [ ] No new REST endpoints
- [ ] All three cron hooks registered in activator, unregistered in deactivator, and `init()`'d in loader
- [ ] `'weekly'` WP cron schedule — confirm it exists or register it via `cron_schedules` filter if missing

---

## PHPUNIT REQUIREMENTS

Baseline: **905 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-staff-digest-cron.php`

Read `tests/unit/test-package-expiry-cron.php` for setUp/tearDown pattern, helper methods, and cron scheduling assertions. Follow that pattern exactly.

In `setUp()`, truncate: `bookit_notification_digest_queue`, `bookings_email_queue`, `bookings_audit_log`, `bookings`, `bookings_staff_services`, `bookings_services`, `bookings_staff`, `bookings_customers`, `bookings_settings`.

Clear all three cron hooks in `setUp()` and `tearDown()` using `wp_clear_scheduled_hook()`.

Required test cases:

- `test_daily_digest_sends_combined_email_for_pending_items`: Insert a staff member with `new_booking` preference `'daily'`. Insert two digest queue rows for that staff member (both `processed = 0`). Insert matching booking rows. Run `Bookit_Staff_Digest_Daily::run_digest()`. Assert one row in `wp_bookit_email_queue` with `email_type = 'staff_daily_digest'` for that staff member.

- `test_daily_digest_skips_cancelled_bookings`: Insert a digest queue row whose `booking_id` points to a booking with `status = 'cancelled'`. Run digest. Assert zero email queue rows and the digest row is marked `processed = 1`.

- `test_daily_digest_skips_inactive_staff`: Insert a digest queue row for a staff member with `is_active = 0`. Run digest. Assert zero email queue rows.

- `test_daily_digest_marks_rows_processed`: Run digest with valid pending items. Assert all processed digest rows have `processed = 1` afterwards.

- `test_daily_digest_skips_when_no_pending_items`: Run digest with empty queue. Assert return value is `0`.

- `test_weekly_digest_only_processes_weekly_preference_items`: Insert two staff — one with `new_booking = 'daily'`, one with `new_booking = 'weekly'`. Insert digest rows for both. Run `Bookit_Staff_Digest_Weekly::run_digest()`. Assert only the weekly-preference staff gets an email queue row.

- `test_schedule_digest_sends_when_bookings_exist_today`: Insert a staff member with `daily_schedule = true` in preferences. Insert a booking for today with `status = 'confirmed'`. Run `Bookit_Staff_Schedule_Daily::run_schedule()`. Assert one email queue row with `email_type = 'staff_daily_schedule'`.

- `test_schedule_digest_skips_when_no_bookings_today`: Insert a staff member with `daily_schedule = true`. No bookings for today. Run `run_schedule()`. Assert zero email queue rows.

- `test_schedule_digest_only_sends_to_opted_in_staff`: Insert two staff — one with `daily_schedule = true`, one without (NULL preferences). Insert bookings for today for both. Run `run_schedule()`. Assert only one email queue row (for the opted-in staff).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `Bookit_Staff_Digest_Daily::run_digest()` processes only `preference = 'daily'` queue rows
- [ ] `Bookit_Staff_Digest_Weekly::run_digest()` processes only `preference = 'weekly'` queue rows
- [ ] Both digest runs mark rows `processed = 1` BEFORE calling `enqueue_email()`
- [ ] Both digest runs skip bookings with `status = 'cancelled'` or `deleted_at IS NOT NULL`
- [ ] Both digest runs skip inactive/deleted staff and staff with no email
- [ ] `Bookit_Staff_Schedule_Daily::run_schedule()` only sends to staff with `daily_schedule = true`
- [ ] `run_schedule()` skips staff with no bookings today — no email on empty days
- [ ] All three cron classes registered on activation, unregistered on deactivation
- [ ] All three `init()` called from loader

### Technical
- [ ] No PHP warnings or notices
- [ ] No bulk SQL UPDATE across all staff — per-staff loop in all three classes
- [ ] `'weekly'` schedule exists or is registered correctly
- [ ] All three classes follow `Bookit_Package_Expiry` pattern exactly
- [ ] PHPUnit suite passes (914+ tests, 0 failures)

### Must NOT break
- [ ] `Bookit_Package_Expiry` cron — still registers and runs correctly
- [ ] `Bookit_Staff_Notifier` hooks — still fire on booking lifecycle events
- [ ] Existing email queue processing — unchanged

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 4: Digest cron jobs — daily, weekly, daily schedule

- New class: includes/cron/class-bookit-staff-digest-daily.php
- New class: includes/cron/class-bookit-staff-digest-weekly.php
- New class: includes/cron/class-bookit-staff-schedule-daily.php
- All three follow Bookit_Package_Expiry pattern (init/register/unregister/tracking)
- Daily + weekly digests drain wp_bookit_notification_digest_queue per preference
- Rows marked processed=1 before enqueue to prevent double-send on retry
- Daily schedule sends today's bookings to opted-in staff, skips empty days
- Registered in activator/deactivator, init()'d in loader
- New test file: tests/unit/test-staff-digest-cron.php (9 new tests)

Tests: 914 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.