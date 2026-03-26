Good — migrations confirmed at 0009, so the new email queue migration will be **0010**. Now let me generate the Task 2 prompt.Good — the migration pattern is confirmed. Sprint 4F reverted migrations 0010 and 0011, so **0010 is genuinely free**. Here is the Task 2 prompt.

---

## Sprint 4H — Task 2 of 5: Queue Table + Action Scheduler Integration

```
TASK 2 OF 5: Queue Table + Action Scheduler Integration
Sprint: 4H | Est: ~6h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/0009-add-performance-indexes.php` — read the full file to confirm the exact class name format (`Bookit_Migration_0009_Add_Performance_Indexes`), the `migration_id()` return value format, the `plugin_slug()` return value, and whether the class extends `Bookit_Migration_Base`. Use this as the direct template for the new migration.
2. `includes/class-bookit-loader.php` — find `load_dependencies()` and `define_cron_hooks()` (or equivalent hook-registration method). You will add new `require_once` calls and new `add_action` hooks here. Read the full existing hook registration to understand what already exists.
3. `includes/notifications/providers/class-bookit-brevo-email-provider.php` — read the `get_setting()` private static helper added in Task 1. The new `Bookit_Email_Queue` class needs the same `$wpdb->get_var()` pattern for any settings reads (there are none in this task, but confirm the wp_bookings_settings table name prefix while you are reading).
4. `includes/notifications/interfaces/interface-bookit-email-provider.php` — confirm `Bookit_Email_Provider_Interface` is defined before writing the dispatcher, which type-hints against it.
5. `includes/api/class-dashboard-bookings-api.php` — find a `private function upsert_setting()` or any method that writes to `{$wpdb->prefix}bookings_settings`. You need the confirmed table prefix pattern (`{$wpdb->prefix}bookings_settings`, not `wp_bookings_settings`). You will also check here whether `bookit_booking_cancelled` or `bookit_booking_rescheduled` actions are fired anywhere in this file.
6. `public/templates/booking-confirmed.php` — check whether `do_action('bookit_booking_cancelled', ...)` or `do_action('bookit_booking_rescheduled', ...)` is fired.
7. `includes/email/class-email-sender.php` — read fully to understand what trigger points currently fire emails. This informs which hooks you need to confirm exist for cancellation/reschedule queue cleanup.

If any file does not exist or differs from what is described, stop and report back before proceeding.

---

## CONTEXT

Task 2 builds the queue layer: the database table, the PHP class that wraps it, the enqueue helper function, and the dispatcher class that resolves the active provider and processes queue items. No emails are sent yet — that is Task 5. This task establishes the infrastructure that Tasks 3, 4, and 5 build on.

Migration number is **0010** — confirmed free after Sprint 4F reverted migrations 0010 and 0011 (which were meeting-related and never shipped).

---

## IMPLEMENTATION REQUIREMENTS

### `database/migrations/0010-add-email-queue-table.php` — CREATE

Class: `Bookit_Migration_0010_Add_Email_Queue_Table`
`migration_id()`: returns `'0010-add-email-queue-table'`
`plugin_slug()`: returns `'bookit-booking-system'` (match exactly what 0009 uses)

`up()`:
```sql
CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookit_email_queue (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id      BIGINT UNSIGNED NULL,
    email_type      VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name  VARCHAR(255) NOT NULL DEFAULT '',
    subject         VARCHAR(500) NOT NULL DEFAULT '',
    html_body       LONGTEXT NOT NULL,
    params          LONGTEXT NULL COMMENT 'JSON — provider-specific params',
    status          ENUM('pending','processing','sent','failed','cancelled')
                    NOT NULL DEFAULT 'pending',
    attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts    TINYINT UNSIGNED NOT NULL DEFAULT 3,
    scheduled_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         DATETIME NULL,
    last_error      TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_status_scheduled (status, scheduled_at),
    KEY idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`down()`: `DROP TABLE IF EXISTS {$wpdb->prefix}bookit_email_queue;`

Use `$wpdb->query()` for both `up()` and `down()`, matching the pattern in 0009. Add the `// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared` comment on the `down()` DROP line, same as 0009.

---

### `includes/notifications/class-bookit-email-queue.php` — CREATE

Class: `Bookit_Email_Queue`

**`public static function insert( array $data ): int|false`**

Inserts a new row into `{$wpdb->prefix}bookit_email_queue`. Required fields in `$data`: `email_type`, `recipient_email`, `html_body`. Optional: `booking_id`, `recipient_name`, `subject`, `params` (already JSON-encoded string), `scheduled_at` (MySQL datetime string), `max_attempts`. Returns the new row ID (`$wpdb->insert_id`) or `false` on failure.

Do not use `$wpdb->prepare()` for the insert — use `$wpdb->insert()` with the format array. Map each field to its correct format string (`%s`, `%d`).

**`public static function update_status( int $id, string $status, array $extra = [] ): void`**

Updates `status` for the given row ID. Merges `$extra` into the update data (allows passing `sent_at`, `last_error`, `attempts`, `scheduled_at` in one call). Uses `$wpdb->update()`. Valid statuses: `pending`, `processing`, `sent`, `failed`, `cancelled`.

**`public static function get_row( int $id ): array|null`**

Fetches a single queue row by ID. Returns `ARRAY_A` or `null` if not found. Used by the dispatcher.

**`public static function fetch_pending( int $limit = 10 ): array`**

Returns rows where `status = 'pending'` AND `scheduled_at <= NOW()`, ordered by `scheduled_at ASC`, limited to `$limit`. Uses `$wpdb->get_results()` with `ARRAY_A`. Use `$wpdb->prepare()`.

**`public static function cancel_for_booking( int $booking_id ): void`**

Sets `status = 'cancelled'` for all rows where `booking_id = $booking_id` AND `status = 'pending'`. Uses `$wpdb->update()`.

---

### `includes/functions-notifications.php` — CREATE

A standalone functions file (not a class). Include an `if ( ! defined( 'ABSPATH' ) ) { exit; }` guard.

**`function bookit_enqueue_email( string $email_type, array $recipient, string $subject, string $html_body, int $booking_id = 0, array $params = [], int $delay_seconds = 0 ): int|false`**

1. Compute `$scheduled_at`: if `$delay_seconds > 0`, use `gmdate( 'Y-m-d H:i:s', time() + $delay_seconds )`. Otherwise use `gmdate( 'Y-m-d H:i:s' )`.
2. Call `Bookit_Email_Queue::insert()` with all fields. `params` stored as `wp_json_encode( $params )` (empty array encodes to `'[]'`). `booking_id` stored as `NULL` when 0 (pass `null` to insert when `$booking_id === 0`).
3. If insert fails, return `false`.
4. Schedule the processor job:
   - Check `function_exists( 'as_schedule_single_action' )` first.
   - If yes: call `as_schedule_single_action( time() + $delay_seconds, 'bookit_process_email_queue', [ 'queue_id' => $queue_id ], 'bookit-notifications' )`.
   - If no: call `wp_schedule_single_event( time() + $delay_seconds, 'bookit_process_email_queue', [ $queue_id ] )`.
   - Use a minimum delay of 1 second for immediate jobs (pass `time() + 1` when `$delay_seconds === 0`) so the current request completes before the job fires.
5. Return the queue row ID.

---

### `includes/notifications/class-bookit-notification-dispatcher.php` — CREATE

Class: `Bookit_Notification_Dispatcher`

All methods are `public static`.

**`public static function enqueue_email( string $email_type, array $recipient, string $subject, string $html_body, int $booking_id = 0, array $params = [], int $delay_seconds = 0 ): int|false`**

Delegates directly to `bookit_enqueue_email()`. This is a convenience wrapper so callers can use either the class or the function.

**`public static function process_email_queue_item( int $queue_id ): void`**

1. Fetch the row via `Bookit_Email_Queue::get_row( $queue_id )`. If null or status is not `'pending'`, return silently.
2. Mark status as `'processing'` immediately (prevents duplicate processing if the job fires twice): `Bookit_Email_Queue::update_status( $queue_id, 'processing' )`.
3. Resolve the provider: `self::resolve_email_provider()`.
4. Call `$provider->send( $recipient, $subject, $html_body, $params )` where recipient is `['email' => $row['recipient_email'], 'name' => $row['recipient_name']]`, params is `json_decode( $row['params'] ?? '[]', true )`.
5. On success (`true`): update status to `'sent'`, set `sent_at = gmdate('Y-m-d H:i:s')`.
6. On failure (`WP_Error`): call `self::handle_send_failure( $queue_id, $row, $result )`.

**`private static function handle_send_failure( int $queue_id, array $row, \WP_Error $error ): void`**

This is the retry logic (Task 3 builds on this, but the basic structure belongs here):

- If `$error->get_error_code() === 'brevo_rate_limited'`: do NOT increment attempts. Reschedule at `time() + 60` via `bookit_enqueue_email()` is wrong here — instead update `scheduled_at` to `NOW() + 60 seconds` and set status back to `'pending'`. Schedule a new AS/cron job for 60 seconds. Return.
- Otherwise: increment `attempts` by 1 (read current value from `$row['attempts']`, add 1).
  - If new attempts < `$row['max_attempts']`: set status back to `'pending'`, compute delay per attempt number (attempt 1 → 300s, attempt 2 → 1800s, attempt 3 → 7200s), update `scheduled_at`, schedule new job. 
  - If new attempts >= `$row['max_attempts']`: set status to `'failed'`, set `last_error` to `$error->get_error_message()`. Fire: `do_action( 'bookit_email_permanently_failed', $queue_id, (int) $row['booking_id'], $row['email_type'], $error->get_error_message() )`.

Update the row via `Bookit_Email_Queue::update_status()` passing the full `$extra` array in one call.

**`public static function resolve_email_provider(): Bookit_Email_Provider_Interface`**

Read `email_provider` from `{$wpdb->prefix}bookings_settings` using the same `$wpdb->get_var()` pattern as in the Brevo provider's `get_setting()` helper. If slug is `'brevo'` AND `(new Bookit_Brevo_Email_Provider())->is_configured()` is true, return `new Bookit_Brevo_Email_Provider()`. Otherwise return `new Bookit_WP_Mail_Fallback_Provider()`.

**`public static function resolve_sms_provider(): ?Bookit_SMS_Provider_Interface`**

Read `sms_provider` from settings. If slug is `'brevo'`, return `new Bookit_Brevo_SMS_Provider()`. Otherwise return `null`.

---

### `includes/class-bookit-loader.php` — MODIFY

**In `load_dependencies()`**, after the existing notification provider requires added in Task 1, add:

```php
// Notification queue and dispatcher.
require_once BOOKIT_PLUGIN_DIR . 'includes/functions-notifications.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/class-bookit-email-queue.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/notifications/class-bookit-notification-dispatcher.php';
```

**In `define_cron_hooks()` (or wherever action hooks are registered)**, add:

```php
// Email queue processor — fired by Action Scheduler or WP-Cron.
add_action( 'bookit_process_email_queue', function( int $queue_id ) {
    Bookit_Notification_Dispatcher::process_email_queue_item( $queue_id );
} );

// Cancel pending queue items when a booking is cancelled or rescheduled.
add_action( 'bookit_after_booking_cancelled', function( int $booking_id ) {
    Bookit_Email_Queue::cancel_for_booking( $booking_id );
}, 10, 1 );

add_action( 'bookit_booking_rescheduled', function( int $booking_id ) {
    Bookit_Email_Queue::cancel_for_booking( $booking_id );
}, 10, 1 );
```

**Important:** After reading the codebase, confirm whether `bookit_after_booking_cancelled` and `bookit_booking_rescheduled` are actually fired anywhere. If `bookit_booking_rescheduled` does not exist in the codebase, add the hook registration anyway (it is safe to register a listener for an action that is not yet fired), but add a `// TODO: bookit_booking_rescheduled not yet fired in core — hook registered for future use` comment on the line.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] New DB table via `Bookit_Migration_Runner`: `database/migrations/0010-add-email-queue-table.php`, class `Bookit_Migration_0010_Add_Email_Queue_Table`
- [ ] No new error codes registered in `Bookit_Error_Registry` for this task
- [ ] `bookit_email_permanently_failed` action fired in `handle_send_failure()` on final failure
- [ ] `bookit_process_email_queue` action hooked to dispatcher in loader

---

## PHPUNIT REQUIREMENTS

**Baseline: 728 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-notification-queue.php`

Required test cases:

- `test_insert_returns_id_and_row_is_pending` — call `Bookit_Email_Queue::insert()` with minimum valid data, assert return value is a positive int, fetch the row and assert `status = 'pending'`
- `test_insert_stores_null_booking_id_when_zero` — insert with `booking_id = 0`, assert the stored `booking_id` is `null`
- `test_update_status_changes_status` — insert a row, call `update_status( $id, 'sent', ['sent_at' => gmdate('Y-m-d H:i:s')] )`, fetch row, assert status is `'sent'`
- `test_fetch_pending_returns_due_rows` — insert a row with `scheduled_at` in the past, assert `fetch_pending()` returns it
- `test_fetch_pending_excludes_future_rows` — insert a row with `scheduled_at` 1 hour in the future, assert `fetch_pending()` does NOT return it
- `test_fetch_pending_excludes_non_pending_status` — insert a row, set status to `'sent'`, assert `fetch_pending()` does not return it
- `test_cancel_for_booking_cancels_pending_rows` — insert two rows with the same `booking_id`, call `cancel_for_booking( $booking_id )`, assert both rows now have status `'cancelled'`
- `test_cancel_for_booking_does_not_cancel_sent_rows` — insert one pending and one sent row with the same `booking_id`, call `cancel_for_booking()`, assert the sent row status is unchanged
- `test_bookit_enqueue_email_inserts_pending_row` — call `bookit_enqueue_email( 'customer_confirmation', ['email' => 'test@example.com', 'name' => 'Test'], 'Subject', '<p>Body</p>' )`, assert returns a positive int and a pending row exists in the table
- `test_resolve_provider_returns_fallback_when_no_brevo_key` — ensure `brevo_api_key` is empty in settings, call `Bookit_Notification_Dispatcher::resolve_email_provider()`, assert returns instance of `Bookit_WP_Mail_Fallback_Provider`
- `test_resolve_provider_returns_brevo_when_configured` — insert `email_provider = 'brevo'` and a non-empty `brevo_api_key` into settings, call `resolve_email_provider()`, assert returns instance of `Bookit_Brevo_Email_Provider`

All tests must use direct `$wpdb->insert()` / `$wpdb->delete()` for setup and teardown. Clean up the `{$wpdb->prefix}bookit_email_queue` table rows in `tearDown()` using `$wpdb->query( "DELETE FROM {$wpdb->prefix}bookit_email_queue" )`. Clean up any settings rows inserted in `tearDown()` too.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `{prefix}bookit_email_queue` table is created by the migration runner on plugin activation (or manually running the migration)
- [ ] `Bookit_Email_Queue::insert()` returns a positive integer ID on success
- [ ] `Bookit_Email_Queue::cancel_for_booking()` sets matching pending rows to `'cancelled'`
- [ ] `bookit_enqueue_email()` inserts a pending row and schedules a job (AS or WP-Cron)
- [ ] `Bookit_Notification_Dispatcher::resolve_email_provider()` returns `Bookit_WP_Mail_Fallback_Provider` when no Brevo key is configured
- [ ] `bookit_process_email_queue` action is registered in the loader
- [ ] `bookit_after_booking_cancelled` listener calls `cancel_for_booking()`

### Technical
- [ ] No PHP warnings or notices
- [ ] Migration class extends `Bookit_Migration_Base` and follows exact naming pattern from 0009
- [ ] `bookit_enqueue_email()` uses AS if available, WP-Cron as fallback — checked via `function_exists('as_schedule_single_action')`
- [ ] `process_email_queue_item()` marks row as `'processing'` before calling provider
- [ ] PHPUnit suite passes (728+ tests, 0 failures)

### Must NOT break
- [ ] Existing email sending via `class-email-sender.php` — still untouched; Task 5 replaces it
- [ ] All 728 existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4H, Task 2: Email queue table + dispatcher scaffold

- Migration 0010: wp_bookit_email_queue table (idempotent up/down)
- Bookit_Email_Queue: insert, update_status, get_row, fetch_pending, cancel_for_booking
- bookit_enqueue_email() helper (AS / WP-Cron fallback)
- Bookit_Notification_Dispatcher: enqueue_email, process_email_queue_item,
  resolve_email_provider, resolve_sms_provider, handle_send_failure (retry scaffold)
- Hooked bookit_process_email_queue, bookit_after_booking_cancelled, bookit_booking_rescheduled
- 11 new PHPUnit tests

Tests: 739 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.