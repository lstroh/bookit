I have everything I need. Now generating the 6A-2 Cursor prompt:

---

```
TASK 2 OF 10: DB Schema — notification_preferences column + digest queue table
Sprint: 6A | Est: 4h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/0015-add-refunded-amount-to-bookings.php` — The migration to follow exactly: class naming, `column_exists()` private helper, `up()`/`down()` guards, `migration_id()` return value, `plugin_slug()` method, phpcs ignore comments. Follow this file precisely.

2. `database/migrations/class-bookit-migration-base.php` — Base class contract. Confirm `plugin_slug()` has a default implementation returning `'bookit-booking-system'`.

3. `includes/class-bookit-database.php` — Read `create_staff_table()` (or equivalent method). Verify the current columns on `wp_bookings_staff`. Confirm `notification_preferences` does NOT exist yet before writing migration 0016.

4. `database/schema.sql` — Read the current `wp_bookings_staff` table definition and `wp_bookit_notification_digest_queue` (confirm it does not exist). You will update both sections of this file.

5. `phpunit.xml` — Check how existing test files are registered; confirm the pattern for adding new test files.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-2 adds the two DB structures required by `Bookit_Staff_Notifier` (6A-3) and the digest cron jobs (6A-4). Migration 0016 adds a `notification_preferences` column to `wp_bookings_staff`. Migration 0017 creates the `wp_bookit_notification_digest_queue` table. Both are pure schema tasks — no PHP business logic yet.

---

## IMPLEMENTATION REQUIREMENTS

### `database/migrations/0016-add-notification-preferences-to-staff.php` — CREATE

Follow the 0015 migration file exactly. Class name: `Bookit_Migration_0016_Add_Notification_Preferences_To_Staff`.

`migration_id()` returns: `'0016-add-notification-preferences-to-staff'`

`up()`:
- Use `$this->column_exists( $table, 'notification_preferences' )` guard — return early if column already exists.
- Add the column:
```sql
ALTER TABLE wp_bookings_staff
  ADD COLUMN notification_preferences LONGTEXT NULL DEFAULT NULL
  COMMENT 'JSON: {"new_booking":"immediate","reschedule":"immediate","cancellation":"immediate","daily_schedule":false}'
```
- No `AFTER` positioning needed.
- Use the same `phpcs:ignore` comment as 0015.

`down()`:
- Guard with `$this->column_exists()` — return early if column does not exist.
- Drop the column.

`column_exists()` private helper: copy exactly from 0015 — same `SHOW COLUMNS FROM ... LIKE %s` pattern.

**Do NOT use a DEFAULT JSON value** — `LONGTEXT NULL DEFAULT NULL` only. The MariaDB 10.x incompatibility with non-literal TEXT defaults is a confirmed constraint for this project.

### `database/migrations/0017-create-notification-digest-queue.php` — CREATE

Class name: `Bookit_Migration_0017_Create_Notification_Digest_Queue`.

`migration_id()` returns: `'0017-create-notification-digest-queue'`

`up()`:
- Check if table exists using `SHOW TABLES LIKE '{prefix}bookit_notification_digest_queue'` — return early if it already exists. Use `$wpdb->get_var()` for this check (same defensive pattern used in 0015 for `column_exists`).
- Create the table:
```sql
CREATE TABLE wp_bookit_notification_digest_queue (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id   BIGINT UNSIGNED NOT NULL,
    event_type ENUM('new_booking','reschedule','cancellation') NOT NULL,
    booking_id BIGINT UNSIGNED NOT NULL,
    processed  TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_staff_event_processed (staff_id, event_type, processed),
    KEY idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```
- Use the same `phpcs:ignore` comment pattern as 0015.

`down()`:
- Check if table exists — return early if it does not.
- `DROP TABLE IF EXISTS wp_bookit_notification_digest_queue`.

Add a private `table_exists()` helper to this class (same pattern as `column_exists()` in 0015, but using `SHOW TABLES LIKE %s`):
```php
private function table_exists( string $table_name ): bool {
    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared
    $result = $wpdb->get_var(
        $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name )
    );
    return ! empty( $result );
}
```

### `database/schema.sql` — MODIFY

Two changes:

1. Add `notification_preferences LONGTEXT NULL DEFAULT NULL COMMENT '...'` to the `wp_bookings_staff` table definition, after the last existing column and before the closing `PRIMARY KEY` / index lines. Match the indentation and style of the existing schema file.

2. Add the full `wp_bookit_notification_digest_queue` table definition at the end of the file, after the last existing table, following the same formatting and comment style used for other tables in schema.sql.

### `phpunit.xml` — MODIFY

Register the two new test files following the existing pattern. Do not reorder existing entries.

---

## INFRASTRUCTURE REQUIREMENTS

- [x] Migration 0016 created via `Bookit_Migration_Runner` pattern (extends `Bookit_Migration_Base`)
- [x] Migration 0017 created via `Bookit_Migration_Runner` pattern (extends `Bookit_Migration_Base`)
- [ ] No new error codes required
- [ ] No new REST endpoints
- [ ] No audit log events

---

## PHPUNIT REQUIREMENTS

Baseline: **886 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-sprint6a-migrations.php`

Use the same pattern as `tests/unit/test-stripe-refund-webhook.php` for migration tests: instantiate the migration class directly, call `up()`, assert, call `down()`, assert, call `up()` again. Read that file for the exact pattern.

Required test cases:

- `test_migration_0016_adds_notification_preferences_column`: Run `up()` — assert column exists on `wp_bookings_staff`. Run `down()` — assert column gone. Run `up()` again — assert column back.

- `test_migration_0016_up_is_idempotent`: Call `up()` twice — assert no DB error, column still exists.

- `test_migration_0017_creates_digest_queue_table`: Run `up()` — assert table `wp_bookit_notification_digest_queue` exists. Run `down()` — assert table gone. Run `up()` again — assert table back.

- `test_migration_0017_up_is_idempotent`: Call `up()` twice — assert no DB error, table still exists.

- `test_digest_queue_has_correct_columns`: After `up()`, query `SHOW COLUMNS FROM wp_bookit_notification_digest_queue` and assert `id`, `staff_id`, `event_type`, `booking_id`, `processed`, `created_at` all exist.

- `test_get_staff_preferences_returns_defaults_when_null`: Insert a staff row with `notification_preferences = NULL`. Call the static helper (copy the helper inline in the test, or test the migration class method if it exists). Assert the returned array equals the defaults: `['new_booking' => 'immediate', 'reschedule' => 'immediate', 'cancellation' => 'immediate', 'daily_schedule' => false]`.

- `test_get_staff_preferences_merges_with_defaults`: Insert a staff row with `notification_preferences = '{"new_booking":"daily"}'`. Call the helper. Assert `new_booking` is `'daily'` and the remaining keys still return defaults.

Note: The `get_staff_preferences()` helper is defined as a private static method on `Bookit_Staff_Notifier` (which doesn't exist yet). For these two tests, either: (a) define the helper inline in the test class and test it directly, or (b) skip those two tests and note them as pending until 6A-3. **Option (a) is preferred** — the logic is simple and worth testing independently.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Migration 0016 adds `notification_preferences LONGTEXT NULL DEFAULT NULL` to `wp_bookings_staff`
- [ ] Migration 0016 `up()` is idempotent — safe to run twice
- [ ] Migration 0016 `down()` removes the column cleanly
- [ ] Migration 0017 creates `wp_bookit_notification_digest_queue` with all 6 columns and both indexes
- [ ] Migration 0017 `up()` is idempotent — safe to run twice
- [ ] Migration 0017 `down()` drops the table cleanly
- [ ] `schema.sql` reflects both changes

### Technical
- [ ] Both migration files follow the 0015 pattern exactly (class structure, helpers, phpcs ignores)
- [ ] `notification_preferences` column uses `NULL DEFAULT NULL` — no JSON default value
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (893+ tests, 0 failures)

### Must NOT break
- [ ] All existing staff API tests — `notification_preferences` column being NULL by default must not affect any existing query
- [ ] All existing migration tests — `test-migration-runner.php` still passes
- [ ] `Bookit_Migration_Runner::run_pending()` picks up 0016 and 0017 in order

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 2: DB migrations for notification_preferences + digest queue

- Migration 0016: adds notification_preferences LONGTEXT NULL to wp_bookings_staff
- Migration 0017: creates wp_bookit_notification_digest_queue table with indexes
- schema.sql updated to reflect both changes
- New test file: tests/unit/test-sprint6a-migrations.php (7 new tests)

Tests: 893 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.