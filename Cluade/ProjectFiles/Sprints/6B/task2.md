Understood! I'll provide one Cursor prompt at a time. Let's start with Task 2, since Task 1 (Google Cloud Console setup) is a manual step you'll complete yourself.

---

# TASK 2 OF 8: DB Migrations + Composer Dependency
**Sprint: 6B-1 | Est: 1.5h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/0017-*.php` — pattern to follow exactly (column_exists via `information_schema`, NOT `SHOW COLUMNS LIKE`)
2. `includes/class-bookit-database.php` — read `create_bookings_table()` to confirm whether `google_calendar_event_id` already exists
3. `database/schema.sql` — confirm current state of both `wp_bookings` and `wp_bookings_staff`
4. `composer.json` — read current `require` block and any existing `scripts`/`extra` sections before modifying
5. `includes/class-bookit-migration-runner.php` — confirm how migrations are registered

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task lays the database and dependency foundation for Google Calendar OAuth. It adds OAuth token columns to `wp_bookings_staff` and conditionally adds `google_calendar_event_id` to `wp_bookings` (only if it does not already exist in the schema). It also installs the Google API PHP client library via Composer. All migrations must follow the Sprint 6A pattern using `information_schema` for column-existence checks.

---

## IMPLEMENTATION REQUIREMENTS

### `database/migrations/0018-add-google-oauth-columns-to-staff.php` — CREATE

- Follow the exact structure of `database/migrations/0017-*.php`
- Add the following columns to `wp_bookings_staff`, each guarded individually by a `column_exists()` check against `information_schema.COLUMNS` (not `SHOW COLUMNS LIKE`):
  - `google_oauth_access_token TEXT NULL`
  - `google_oauth_refresh_token TEXT NULL`
  - `google_oauth_token_expiry DATETIME NULL`
  - `google_calendar_connected TINYINT(1) NOT NULL DEFAULT 0`
  - `google_calendar_email VARCHAR(255) NULL`
- Use `$wpdb->prefix . 'bookings_staff'` for the table name
- Wrap each `ALTER TABLE` individually — a failure on one column must not prevent others from running
- Migration must be idempotent (safe to run multiple times without error)

### `database/migrations/0019-add-google-calendar-event-id-to-bookings.php` — CREATE CONDITIONALLY

- **Before creating this file**, read `includes/class-bookit-database.php` `create_bookings_table()` and `database/schema.sql`
- **If `google_calendar_event_id` already exists** in the schema: do NOT create migration 0019. Add a comment to your response stating which path was taken
- **If it does NOT exist**: create migration 0019 following the same pattern as 0018, adding `google_calendar_event_id VARCHAR(255) NULL DEFAULT NULL` to `wp_bookings` with an `information_schema` existence check

### `composer.json` — MODIFY

- Add `"google/apiclient": "^2.15.0"` to the `require` block
- Add the service cleanup configuration to reduce `vendor/` size (only Calendar needed):

```json
"scripts": {
    "pre-autoload-dump": "Google\\Task\\Composer::cleanup"
},
"extra": {
    "google/apiclient-services": [
        "Calendar"
    ]
}
```

- Do NOT run `composer update` inside Cursor. Output the command to run locally:
  ```bash
  composer update google/apiclient
  ```

> **Note:** Before writing the Composer configuration, use Context7 to resolve `google-api-php-client` and confirm the current stable version and the `apiclient-services` cleanup pattern.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Migration 0018 registered with `Bookit_Migration_Runner`
- [ ] Migration 0019 registered only if the column does not already exist
- [ ] No new REST endpoints in this task
- [ ] No audit log events required for schema changes

---

## PHPUNIT REQUIREMENTS

Baseline: **928 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-migrations.php`

Required test cases:
- `test_migration_0018_adds_oauth_columns_to_staff_table` — run migration, assert all five columns exist in `wp_bookings_staff` via `information_schema`
- `test_migration_0018_is_idempotent` — run migration twice, assert no DB error on second run
- `test_google_calendar_event_id_exists_in_bookings_table` — assert the column exists in `wp_bookings` regardless of which migration path was taken

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking this task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `wp_bookings_staff` has all five new columns: `google_oauth_access_token`, `google_oauth_refresh_token`, `google_oauth_token_expiry`, `google_calendar_connected`, `google_calendar_email`
- [ ] `wp_bookings` has column `google_calendar_event_id`
- [ ] Migrations run without error on a fresh activation
- [ ] Migrations are idempotent — no error on re-run

### Technical
- [ ] No PHP warnings or notices
- [ ] `information_schema` used for all column existence checks (not `SHOW COLUMNS LIKE`)
- [ ] Follows existing migration file structure exactly
- [ ] `composer.json` updated with `google/apiclient ^2.15.0` and Calendar-only cleanup config
- [ ] PHPUnit suite passes (928+ tests, 0 failures)

### Must NOT break
- [ ] All existing migrations (0001–0017) still run cleanly
- [ ] Booking creation flow unaffected
- [ ] `wp_bookings_staff` existing columns unchanged

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 2: DB migrations for Google Calendar OAuth + Composer dependency

- Migration 0018: add google_oauth_* and google_calendar_* columns to wp_bookings_staff
- Migration 0019: add google_calendar_event_id to wp_bookings (if not already present)
- composer.json: add google/apiclient ^2.15.0 with Calendar-only service cleanup

Tests: 928+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**

---

✅ Complete Task 2, run PHPUnit, verify, then come back and I'll provide Task 3.