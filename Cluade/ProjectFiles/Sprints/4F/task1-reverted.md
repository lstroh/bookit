Good — Sprint 4E is complete, PHPUnit baseline is **706 tests, 0 failures**, and the sprint prompt you've shared is well-formed. Let me load the skill and Context7 docs before generating the Cursor prompts.Now let me get Context7 docs for Vue 3 and WordPress REST API patterns.Good. Now let me check the sprint 4D summary for any important context before generating Task 1.I have everything I need. Let me now generate the four Cursor prompts for Sprint 4F, one task at a time. I'll present Task 1 now and wait for your confirmation before Task 2.

---

# Sprint 4F — Task 1 of 4: Database Migrations

```
TASK 1 OF 4: Database Migrations — Meeting fields on services + booking
Sprint: 4F | Est: ~2h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/0009-add-performance-indexes.php`
   — confirm the SHOW COLUMNS idempotency guard pattern and the
   current highest migration number (0009)
2. `database/migrations/class-bookit-migration-base.php`
   — base class all migrations extend; confirm method signatures
   for up(), down(), and any helpers
3. `database/schema.sql`
   — read the full file: confirm the existing migration notes block
   at the bottom; confirm the current column list for
   `wp_bookings_services` and `wp_bookings`; confirm the pattern
   used to document prior migrations at the file bottom

If any file does not exist or differs from the description above,
STOP and report back before writing any code.

---

## CONTEXT

This task adds database columns needed by the online meetings feature.
Migration 0010 adds three columns to `wp_bookings_services` (whether
a service is online, which platform, and an optional default link).
Migration 0011 adds one column to `wp_bookings` (the per-booking
meeting URL). Both migrations must be idempotent via SHOW COLUMNS
guards. schema.sql must be updated to reflect the new columns and to
record the migration notes, matching the existing documentation
pattern at the bottom of the file.

---

## IMPLEMENTATION REQUIREMENTS

### `database/migrations/0010-add-meeting-fields-to-services.php` — CREATE

Extend the base migration class. Follow the exact class naming and
file structure pattern from 0009.

**up() method:**

Use a SHOW COLUMNS guard (same pattern as 0009) to check each column
before adding it. Only execute the ALTER TABLE if the columns do not
already exist. Add all three columns in a single ALTER TABLE:

```sql
ALTER TABLE wp_bookings_services
  ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'none'
      COMMENT 'none | online | in_person',
  ADD COLUMN preferred_platform VARCHAR(20) NULL
      COMMENT 'zoom | google_meet | whatsapp | teams | generic',
  ADD COLUMN default_meeting_link VARCHAR(2048) NULL
      COMMENT 'Optional default meeting link for this service';
```

**down() method:**

Drop all three columns:

```sql
ALTER TABLE wp_bookings_services
  DROP COLUMN meeting_type,
  DROP COLUMN preferred_platform,
  DROP COLUMN default_meeting_link;
```

Use a SHOW COLUMNS guard in down() too so it is safe to run even if
the columns were never added.

---

### `database/migrations/0011-add-meeting-link-to-bookings.php` — CREATE

Same pattern as 0010. Add one column to `wp_bookings`:

**up() method (SHOW COLUMNS guard):**

```sql
ALTER TABLE wp_bookings
  ADD COLUMN meeting_link VARCHAR(2048) NULL
      COMMENT 'Meeting URL for online bookings';
```

**down() method (SHOW COLUMNS guard):**

```sql
ALTER TABLE wp_bookings
  DROP COLUMN meeting_link;
```

---

### `database/schema.sql` — MODIFY

Read the full file first. Then make two sets of changes:

1. **Column definitions** — add the new columns to the matching table
   definitions in the CREATE TABLE blocks:
   - In `wp_bookings_services`: add `meeting_type`, `preferred_platform`,
     `default_meeting_link` after the last existing column, before the
     closing parenthesis/ENGINE line, following the same column
     definition formatting already used in the file
   - In `wp_bookings`: add `meeting_link` after `customer_package_id`,
     following the same formatting

2. **Migration notes block** — at the bottom of the file, append two
   new migration note entries matching the exact format already used
   for migrations 0005–0009. Include:
   - Migration number and file name
   - Date and sprint reference
   - Summary of tables/columns changed

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Migration 0010 registered with `Bookit_Migration_Runner`
  (confirm the runner auto-discovers files or requires explicit
  registration — check how 0009 was registered)
- [ ] Migration 0011 registered with `Bookit_Migration_Runner`
  the same way

---

## PHPUNIT REQUIREMENTS

Baseline: **706 tests, 0 failures** — must not regress.

Write tests in:
`tests/integration/test-meetings-migration.php`

Before writing the test file, read:
- An existing integration migration test (e.g. the packages migration
  test from Sprint 4D) to confirm the test pattern, setUp/tearDown
  structure, and how migrations are invoked in the test environment

Required test cases:

- `test_migration_0010_up_adds_all_three_columns`
  Runs up(), then asserts meeting_type, preferred_platform, and
  default_meeting_link all exist in wp_bookings_services

- `test_migration_0010_down_removes_all_three_columns`
  Runs up() then down(), asserts all three columns are gone

- `test_migration_0010_up_is_idempotent`
  Runs up() twice in succession; asserts no exception is thrown and
  columns exist after the second call

- `test_migration_0011_up_adds_meeting_link_column`
  Runs up(), asserts meeting_link exists in wp_bookings

- `test_migration_0011_down_removes_meeting_link_column`
  Runs up() then down(), asserts meeting_link is gone

- `test_migration_0011_up_is_idempotent`
  Runs up() twice; asserts no exception and column exists

- `test_meeting_type_default_value`
  After 0010 up(), insert a row into wp_bookings_services without
  specifying meeting_type; assert the stored value is 'none'

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `wp_bookings_services` has columns: `meeting_type` (VARCHAR 20, NOT NULL DEFAULT 'none'), `preferred_platform` (VARCHAR 20, NULL), `default_meeting_link` (VARCHAR 2048, NULL)
- [ ] `wp_bookings` has column: `meeting_link` (VARCHAR 2048, NULL)
- [ ] Running migration 0010 up() twice does not throw an error
- [ ] Running migration 0011 up() twice does not throw an error
- [ ] Running migration 0010 down() removes all three columns cleanly
- [ ] Running migration 0011 down() removes meeting_link cleanly
- [ ] schema.sql CREATE TABLE blocks reflect new columns
- [ ] schema.sql migration notes block has entries for 0010 and 0011

### Technical
- [ ] No PHP warnings or notices
- [ ] Both migrations extend `Bookit_Migration_Base` (or equivalent base class)
- [ ] SHOW COLUMNS guard pattern matches the approach used in 0009
- [ ] PHPUnit suite passes (706+ tests, 0 failures)

### Must NOT break
- [ ] Existing migrations 0001–0009 still run cleanly
- [ ] Existing wp_bookings_services columns unaffected
- [ ] Existing wp_bookings columns unaffected
- [ ] Plugin activate/deactivate cycle completes without error

---

## GIT COMMIT MESSAGE

```
Sprint 4F, Task 1: Database migrations — meeting fields

- Migration 0010: meeting_type, preferred_platform, default_meeting_link on wp_bookings_services
- Migration 0011: meeting_link on wp_bookings
- schema.sql updated with new columns and migration notes
- PHPUnit integration tests: 7 tests covering up/down/idempotency

Tests: 713 passing, 0 failures
```
*(Adjust test count to actual after run)*

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.

---

That's Task 1. Run this in Cursor, report back the PHPUnit count, and I'll generate Task 2 (Services API + ServiceFormModal.vue).