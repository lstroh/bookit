I have everything I need. Here is the prompt.

---

```
TASK 1 OF 1: DB Schema Housekeeping — schema.sql + create_settings_table
Sprint: DB-Audit-Fixes | Est: 30min | Plugin root: bookit-booking-system/

═══════════════════════════════════════════════════════════
## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
═══════════════════════════════════════════════════════════

1. database/schema.sql
   — Read the full TABLE 7 (wp_bookings) column list and its KEY block.
   — Read TABLE 10 (wp_bookings_settings) column list.

2. includes/class-bookit-database.php
   — Read create_settings_table() in full.
   — Note the exact column order and dbDelta formatting conventions
     used in every other create_*_table() method (two spaces before
     PRIMARY KEY, two spaces before each KEY line, etc).

3. includes/class-bookit-activator.php
   — Find the block that reads:
     "// Add setting_type column to settings table if missing."
   — Read it in full, including the SHOW COLUMNS guard and the
     ALTER TABLE statement. This is the block you will remove.

4. database/migrations/0004-add-cooling-off-waiver.php
   — Read in full to confirm the exact column names, types, and
     defaults that were added to wp_bookings.

If any file does not exist, stop and report back before proceeding.

═══════════════════════════════════════════════════════════
## CONTEXT
═══════════════════════════════════════════════════════════

Two housekeeping fixes identified in a schema audit. No new features,
no migrations, no changes to any booking logic. Both changes are
purely structural alignment between what the live database already
contains and what the source files say it contains.

Fix A: schema.sql is missing the cooling-off waiver columns that
       migration 0004 added to wp_bookings in Sprint 4C. The columns
       exist in the live DB and are written to on every booking. The
       reference document just never got updated.

Fix B: wp_bookings_settings.setting_type is added via a raw ALTER
       TABLE in the activator rather than in create_settings_table().
       Moving it into create_settings_table() means a fresh install
       gets the column from dbDelta, and the activator stays clean.
       The activator guard is removed since it is no longer needed.

═══════════════════════════════════════════════════════════
## IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════

### database/schema.sql — MODIFY

FIX A — Add two missing columns to TABLE 7 (wp_bookings).

After the line for `special_requests TEXT NULL ...`:
```sql
cooling_off_waiver_given TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Consumer Contracts Regulations 2013 — customer waived 14-day cooling-off right',
cooling_off_waiver_at DATETIME NULL COMMENT 'UTC timestamp when waiver was accepted',
```

That is the only change to TABLE 7. Do not touch any other column,
index, or comment in that block.

---

### includes/class-bookit-database.php — MODIFY (create_settings_table only)

FIX B — Add the setting_type column to the CREATE TABLE SQL inside
create_settings_table().

The column must be inserted between setting_value and autoload,
matching the order in schema.sql TABLE 10:

```sql
setting_key VARCHAR(100) NOT NULL,
setting_value LONGTEXT NULL,
setting_type ENUM('string','integer','boolean','json') DEFAULT 'string',
autoload TINYINT(1) DEFAULT 1 COMMENT 'Load on plugin init like wp_options',
```

Follow the exact dbDelta formatting of the surrounding columns:
one tab indent, no trailing spaces.

Do NOT touch any other method in this file.

---

### includes/class-bookit-activator.php — MODIFY

FIX B — Remove the ALTER TABLE block for setting_type.

Find and delete this entire block (the comment line and both
statements inside the if):

```php
// Add setting_type column to settings table if missing.
$column_exists = $wpdb->get_results(
    "SHOW COLUMNS FROM {$wpdb->prefix}bookings_settings LIKE 'setting_type'"
);

if ( empty( $column_exists ) ) {
    $wpdb->query(
        "ALTER TABLE {$wpdb->prefix}bookings_settings
        ADD COLUMN setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string'
        AFTER setting_value"
    );
}
```

Do NOT touch anything else in this file — not the branding seed
block, not the email templates block, not the pages block.

The `global $wpdb;` declaration that precedes this block may be
shared with the branding seed code below it. Check whether removing
the ALTER TABLE block would leave the global declaration orphaned.
If $wpdb is still used below (it is — the branding seed uses it),
keep the global declaration in place. Only remove the SHOW COLUMNS
+ ALTER TABLE block itself.

═══════════════════════════════════════════════════════════
## INFRASTRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════
No migrations, no error codes, no audit log events, no REST
endpoints involved in this task.

═══════════════════════════════════════════════════════════
## PHPUNIT REQUIREMENTS
═══════════════════════════════════════════════════════════
Baseline: 813 tests, 0 failures — must not regress.

No new tests are required for this task. Both changes are
documentation/structural alignment — the waiver columns already
have full test coverage in test-cooling-off-waiver.php, and the
setting_type column already works in the live DB.

After making the changes, run the full suite to confirm nothing
regressed:
  cd bookit-booking-system && vendor/bin/phpunit

All 813 tests must pass before marking this task complete.

═══════════════════════════════════════════════════════════
## ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════

### Functional
- [ ] schema.sql TABLE 7 contains cooling_off_waiver_given and
      cooling_off_waiver_at columns with correct types and defaults
- [ ] create_settings_table() SQL includes setting_type ENUM between
      setting_value and autoload
- [ ] The ALTER TABLE block for setting_type is gone from the activator
- [ ] The global $wpdb declaration in the activator is still present
      (the branding seed below still uses it)

### Technical
- [ ] No PHP warnings or notices
- [ ] dbDelta formatting conventions followed (two spaces before
      PRIMARY KEY and KEY lines) — match the existing pattern exactly
- [ ] PHPUnit suite passes (813 tests, 0 failures)

### Must NOT break
- [ ] Existing cooling-off waiver tests (test-cooling-off-waiver.php)
- [ ] Settings read/write — the setting_type column already exists in
      the live DB; this change only aligns the source code with reality
- [ ] Branding seed logic in the activator

═══════════════════════════════════════════════════════════
## GIT COMMIT MESSAGE
═══════════════════════════════════════════════════════════
DB audit housekeeping: schema.sql + create_settings_table alignment

- Add cooling_off_waiver_given + cooling_off_waiver_at to schema.sql
  TABLE 7 (columns exist in live DB via migration 0004, doc was stale)
- Add setting_type ENUM to create_settings_table() in
  class-bookit-database.php (aligns fresh-install path with live DB)
- Remove ALTER TABLE setting_type block from class-bookit-activator.php
  (superseded by the create_settings_table fix above)

Tests: 813 passing, 0 failures

═══════════════════════════════════════════════════════════
If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
═══════════════════════════════════════════════════════════
```