# TASK 1 FIX B: Suppress CREATE TEMPORARY TABLE FK Noise in Test Output
Sprint: 4D | Est: ~30min | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `tests/bootstrap.php` — read the full file; you will add a filter here.
   Look specifically for any existing `_create_temporary_tables` or
   `_drop_temporary_tables` filter registrations. The fix goes in this file.

If the file does not exist at that path, stop and report back.

---

## CONTEXT

The wp-env test framework intercepts every `CREATE TABLE` statement via a
`query` filter (WordPress core's `_create_temporary_tables()`) and rewrites
it to `CREATE TEMPORARY TABLE`. This works fine for tables without FK
constraints, but MySQL/InnoDB does not support FK constraints on temporary
tables, so the three new package tables generate visible DB error noise in
the test output on every run. The tests all pass — this is cosmetic output
pollution only. The fix is to exclude the three package tables from the
temporary-table rewrite by removing the core filter for those specific tables,
or by adding an earlier-priority filter that bypasses the rewrite for them.

---

## IMPLEMENTATION REQUIREMENTS

### tests/bootstrap.php — MODIFY

Read the full file first.

After the plugin is loaded (after the `tests_add_filter( 'muplugins_loaded', ... )`
call and before the `require bootstrap.php` line, OR after it — whichever
position is correct given what you see in the file), add the following:

**Step 1 — Remove the WordPress core temporary-table filter for package tables.**

WordPress core registers `_create_temporary_tables` on the `query` filter at
priority 10. Add a `query` filter at priority 9 (runs before core's) that
detects `CREATE TABLE` statements for the three package tables and returns the
query unchanged (bypassing the temporary-table rewrite):

```php
/**
 * Prevent WordPress test framework from converting package table CREATE
 * statements to TEMPORARY TABLE — InnoDB temporary tables don't support
 * FK constraints, which generates noise in test output.
 */
add_filter(
    'query',
    static function ( string $query ): string {
        // Only intercept CREATE TABLE statements for package tables.
        // Let everything else pass through to core's temporary-table rewrite.
        if ( preg_match(
            '/^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(wp_bookings_package_types|wp_bookings_customer_packages|wp_bookings_package_redemptions)`?/i',
            $query
        ) ) {
            // Return as-is — do NOT let core convert this to TEMPORARY TABLE.
            // Remove core's filter temporarily, run the real CREATE TABLE,
            // then restore core's filter.
            remove_filter( 'query', '_create_temporary_tables', 10 );
            remove_filter( 'query', '_drop_temporary_tables', 10 );

            global $wpdb;
            $wpdb->query( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared

            add_filter( 'query', '_create_temporary_tables', 10 );
            add_filter( 'query', '_drop_temporary_tables', 10 );

            // Return an empty string so the original caller's query() is a no-op.
            // wpdb->query('') returns 0 (not false), which is acceptable here.
            return '';
        }
        return $query;
    },
    9
);
```

**Important implementation notes:**

- This filter must be registered AFTER WordPress core has had a chance to
  register `_create_temporary_tables` — so place it after the
  `require $_tests_dir . '/includes/bootstrap.php'` line, not before it.
  Read the bootstrap file to confirm the exact placement.

- The pattern matches all three package tables:
  `wp_bookings_package_types`, `wp_bookings_customer_packages`,
  `wp_bookings_package_redemptions`. Do not add `wp_bookings` or any other
  existing table to this list.

- The `_drop_temporary_tables` filter must also be temporarily removed and
  restored in the same block — otherwise the subsequent `DROP TABLE` for
  teardown will be rewritten to `DROP TEMPORARY TABLE`, which won't find
  the real (non-temporary) table.

- If the bootstrap file already has a similar filter registered for other
  tables, extend that existing filter rather than adding a second one.

- No other files should be modified.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No production code changes — test bootstrap only
- [ ] Filter registered after WordPress core bootstrap loads
- [ ] All three package tables covered by the filter
- [ ] `_drop_temporary_tables` handled alongside `_create_temporary_tables`
- [ ] No other tables affected

---

## PHPUNIT REQUIREMENTS

Baseline: **579 tests, 0 failures** — must not regress.

After applying the fix, run the full suite:
```
cd bookit-booking-system && vendor/bin/phpunit
```

Verify:
- 579 tests, 0 failures
- Zero `Can't create table ... errno: 150` lines in output
- Zero `Cannot truncate a table referenced in a foreign key constraint` lines

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Full PHPUnit suite passes: 579 tests, 0 failures
- [ ] No `errno: 150 "Foreign key constraint is incorrectly formed"` errors
      in test output
- [ ] No `Cannot truncate a table referenced` errors in test output

### Technical
- [ ] Only `tests/bootstrap.php` modified
- [ ] Filter is registered after WordPress core bootstrap
- [ ] Pattern is specific to the three package tables only
- [ ] PHPUnit suite: 579 tests, 0 failures

### Must NOT break
- [ ] All 579 existing tests still pass
- [ ] Package table schema unchanged
- [ ] No other test output behaviour changed

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 1 fix B: Suppress FK temporary-table noise in test output

- Add query filter in bootstrap to bypass WP core temporary-table rewrite
  for the three package tables (InnoDB temporary tables cannot have FKs)
- Covers wp_bookings_package_types, wp_bookings_customer_packages,
  wp_bookings_package_redemptions

Tests: 579 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.