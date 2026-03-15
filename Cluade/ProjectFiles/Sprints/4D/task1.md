# TASK 1 OF 9: Database Migrations — Package Tables
Sprint: 4D | Est: ~6h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `database/migrations/` — read ALL existing migration files to identify the
   current highest migration number so new migrations are named sequentially
2. `includes/class-bookit-migration-runner.php` — understand how migrations
   are registered and run; all new tables MUST go through this runner
3. `includes/class-bookit-error-registry.php` — understand how error codes
   are registered; new E5001–E5005 codes go here
4. `includes/config/error-codes.php` — read existing error code constants to
   understand naming conventions and add new ones without conflict
5. `includes/class-bookit-audit-logger.php` — read to understand how audit
   log events are registered/declared; new package event names will be used
   in later tasks but must be consistent with this file's conventions
6. `includes/class-bookit-loader.php` — read to understand how the plugin
   initialises; do NOT modify this file in this task, but understand the
   load order so migrations fire at the right time

If any of these files do not exist, stop and report back before proceeding.

---

## CONTEXT

Task 1 creates the complete database schema for the Sprint 4D packages
feature. All three new tables and one column addition to `wp_bookings` are
created via the Bookit_Migration_Runner (NOT the plugin activator). This task
also registers the five new error codes (E5001–E5005) in the error registry
and constants file. No REST endpoints or Vue changes are made in this task —
schema and error codes only.

---

## IMPLEMENTATION REQUIREMENTS

### database/migrations/ — CREATE (new migration files, sequential numbering)

Read all existing files in this directory first to determine the next
sequential migration number. Name files `NNNN-create-package-types-table.php`,
`NNNN+1-create-customer-packages-table.php`, etc.

**Migration: create `wp_bookings_package_types`**

```sql
CREATE TABLE {$wpdb->prefix}bookings_package_types (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description TEXT NULL,
    sessions_count INT UNSIGNED NOT NULL,
    price_mode  ENUM('fixed', 'discount') NOT NULL,
    fixed_price DECIMAL(10,2) NULL,
    discount_percentage DECIMAL(5,2) NULL,
    expiry_enabled TINYINT(1) NOT NULL DEFAULT 0,
    expiry_days INT UNSIGNED NULL,
    applicable_service_ids LONGTEXT NULL COMMENT 'JSON array of service IDs; NULL = applies to all services',
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_is_active (is_active)
) {$charset_collate};
```

**Migration: create `wp_bookings_customer_packages`**

```sql
CREATE TABLE {$wpdb->prefix}bookings_customer_packages (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id       BIGINT UNSIGNED NOT NULL,
    package_type_id   BIGINT UNSIGNED NOT NULL,
    sessions_total    INT UNSIGNED NOT NULL,
    sessions_remaining INT UNSIGNED NOT NULL,
    purchase_price    DECIMAL(10,2) NULL,
    purchased_at      DATETIME NULL,
    expires_at        DATETIME NULL,
    status            ENUM('active','exhausted','expired','cancelled') NOT NULL DEFAULT 'active',
    payment_method    VARCHAR(50) NULL,
    payment_reference VARCHAR(255) NULL,
    notes             TEXT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_customer_id (customer_id),
    KEY idx_package_type_id (package_type_id),
    KEY idx_status (status),
    KEY idx_expires_at (expires_at),
    CONSTRAINT fk_cp_customer
        FOREIGN KEY (customer_id) REFERENCES {$wpdb->prefix}bookings_customers(id),
    CONSTRAINT fk_cp_package_type
        FOREIGN KEY (package_type_id) REFERENCES {$wpdb->prefix}bookings_package_types(id)
) {$charset_collate};
```

**Migration: create `wp_bookings_package_redemptions`**

```sql
CREATE TABLE {$wpdb->prefix}bookings_package_redemptions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_package_id BIGINT UNSIGNED NOT NULL,
    booking_id          BIGINT UNSIGNED NOT NULL,
    redeemed_at         DATETIME NOT NULL,
    redeemed_by         BIGINT UNSIGNED NOT NULL COMMENT 'WP user ID of staff/admin who redeemed',
    notes               TEXT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_customer_package_id (customer_package_id),
    KEY idx_booking_id (booking_id),
    CONSTRAINT fk_pr_customer_package
        FOREIGN KEY (customer_package_id) REFERENCES {$wpdb->prefix}bookings_customer_packages(id),
    CONSTRAINT fk_pr_booking
        FOREIGN KEY (booking_id) REFERENCES {$wpdb->prefix}bookings(id)
) {$charset_collate};
```

**Migration: add `customer_package_id` column to `wp_bookings`**

Separate migration file (sequential number after the three above):

```sql
ALTER TABLE {$wpdb->prefix}bookings
    ADD COLUMN customer_package_id BIGINT UNSIGNED NULL AFTER payment_reference,
    ADD KEY idx_customer_package_id (customer_package_id);
```

**Rollback (down) for each migration:**
- Must cleanly drop the table or column it created
- Drop order: redemptions → customer_packages → package_types (foreign key order)
- For the ALTER migration: `ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN customer_package_id`
- Verify the rollback does not error if the object does not exist
  (use `DROP TABLE IF EXISTS`, `DROP COLUMN IF EXISTS` / check column
  existence before dropping)

**Migration runner registration:**
- Read `includes/class-bookit-migration-runner.php` to confirm how migrations
  are registered (e.g. added to an array, auto-discovered by naming convention)
- Follow that exact pattern — do not invent a new registration mechanism

---

### includes/config/error-codes.php — MODIFY

Read the file first. Add the following constants following the existing
naming and grouping conventions:

```php
// Package error codes (E5xxx series)
define( 'BOOKIT_E5001', 'E5001' ); // PACKAGE_NOT_FOUND
define( 'BOOKIT_E5002', 'E5002' ); // PACKAGE_EXHAUSTED
define( 'BOOKIT_E5003', 'E5003' ); // PACKAGE_EXPIRED
define( 'BOOKIT_E5004', 'E5004' ); // PACKAGE_SERVICE_MISMATCH
define( 'BOOKIT_E5005', 'E5005' ); // PACKAGE_INSUFFICIENT_SESSIONS
```

Verify that E5001–E5005 are not already used by any existing constant.

---

### includes/class-bookit-error-registry.php — MODIFY

Read the file first. Register each new error code following the exact pattern
used for existing error codes. For each of E5001–E5005:

- Code: e.g. `E5001`
- Key: e.g. `PACKAGE_NOT_FOUND`
- Default message: human-readable English string
- Category/group: `packages` (or whatever grouping the registry supports;
  check existing registrations for the correct structure)

Example messages:
- E5001 PACKAGE_NOT_FOUND: "Package not found."
- E5002 PACKAGE_EXHAUSTED: "This package has no sessions remaining."
- E5003 PACKAGE_EXPIRED: "This package has expired."
- E5004 PACKAGE_SERVICE_MISMATCH: "This package cannot be used for the selected service."
- E5005 PACKAGE_INSUFFICIENT_SESSIONS: "Insufficient package sessions to complete this booking."

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] All four migrations created via `Bookit_Migration_Runner` — read the
      runner class to confirm the correct registration mechanism
- [ ] Migration files named sequentially after the current highest number
      in `database/migrations/`
- [ ] Each migration has a working rollback (down) method
- [ ] Error codes E5001–E5005 registered in both `error-codes.php` (constants)
      and `class-bookit-error-registry.php` (registry)
- [ ] No other files modified in this task
- [ ] No REST endpoints, no Vue changes — schema and error codes only

---

## PHPUNIT REQUIREMENTS

Baseline: **571 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-package-migrations.php`

Required test cases:

- `test_package_types_table_exists_after_migration` — after running migrations,
  `wp_bookings_package_types` table exists with all expected columns
- `test_customer_packages_table_exists_after_migration` — `wp_bookings_customer_packages`
  exists with all expected columns and ENUM values
- `test_package_redemptions_table_exists_after_migration` — `wp_bookings_package_redemptions`
  exists with all expected columns
- `test_bookings_table_has_customer_package_id_column` — `wp_bookings.customer_package_id`
  column exists and is nullable
- `test_rollback_drops_package_tables` — after rollback, all three new tables
  are gone and `customer_package_id` column is removed from `wp_bookings`
- `test_rollback_is_idempotent` — running rollback twice does not error
- `test_error_codes_registered` — E5001 through E5005 are accessible from
  the error registry with correct codes and messages
- `test_error_code_constants_defined` — PHP constants BOOKIT_E5001–BOOKIT_E5005
  are defined

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Running migrations creates all three new tables with the exact columns
      and types specified above
- [ ] `wp_bookings.customer_package_id` column added as nullable BIGINT UNSIGNED
- [ ] Rolling back migrations removes all new tables and the new column cleanly
- [ ] E5001–E5005 constants are defined and accessible
- [ ] E5001–E5005 are registered in the error registry with correct messages

### Technical
- [ ] No PHP warnings or notices during migration execution
- [ ] All migrations go through `Bookit_Migration_Runner` — NOT the plugin
      activator or any other mechanism
- [ ] Migration files are numbered sequentially after the current highest file
- [ ] Foreign key constraints created correctly (match column types exactly —
      BIGINT UNSIGNED to BIGINT UNSIGNED)
- [ ] PHPUnit suite passes (571+ tests, 0 failures)

### Must NOT break
- [ ] All existing migrations still run and roll back cleanly
- [ ] Existing `wp_bookings` table structure unchanged (only column added)
- [ ] Existing error codes unaffected
- [ ] No other plugin functionality affected

---
The three new tables created in Task 1 are:

1. **`wp_bookings_package_types`** — the package product definitions that the admin creates (e.g. "10-session physio bundle"). Stores name, session count, pricing mode (fixed price or discount percentage), optional expiry settings, and which services the package applies to.

2. **`wp_bookings_customer_packages`** — a customer's purchased instance of a package type. Tracks sessions remaining, purchase price, expiry date, status (active/exhausted/expired/cancelled), and payment details.

3. **`wp_bookings_package_redemptions`** — one row per session redeemed. Links a customer package to the specific booking it paid for, recording when it was redeemed and by whom.

There's also a fourth schema change — a `customer_package_id` column added to the existing **`wp_bookings`** table — which links any individual booking back to the package that paid for it.



## GIT COMMIT MESSAGE

```
Sprint 4D, Task 1: Database migrations for package tables

- Add migration: create wp_bookings_package_types table
- Add migration: create wp_bookings_customer_packages table
- Add migration: create wp_bookings_package_redemptions table
- Add migration: add customer_package_id column to wp_bookings
- Register error codes E5001–E5005 in error registry and constants

Tests: 571+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.