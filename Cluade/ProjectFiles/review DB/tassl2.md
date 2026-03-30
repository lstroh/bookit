Let me read the remaining files I need before writing the prompt.I have everything I need. Here is the prompt.

---

```
TASK 1 OF 1: DB Schema Housekeeping — booking_reference/lock_version alignment,
             drop working_hours table, fix orphaned processing status
Sprint: DB-Audit-Fixes-2 | Est: 1.5h | Plugin root: bookit-booking-system/

═══════════════════════════════════════════════════════════
## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
═══════════════════════════════════════════════════════════

1. includes/class-bookit-database.php
   — Read create_bookings_table() in full — note the column list,
     the KEY block, and the dbDelta two-space formatting convention.
   — Read create_working_hours_table() in full.
   — Read drop_tables() in full — note the exact table list.

2. database/schema.sql
   — Read TABLE 7 (wp_bookings) in full.
   — Read TABLE 9 (wp_bookings_working_hours) in full.
   — Read the migration changelog comment block at the top.

3. database/migrations/0010-add-email-queue-table.php
   — Read in full. This is the pattern for the new migration file.
     Note the class naming convention and the up()/down() structure.

4. includes/notifications/class-bookit-email-queue.php
   — Read fetch_pending() in full.
   — Read update_status() in full.

5. includes/notifications/class-bookit-notification-dispatcher.php
   — Read process_email_queue_item() in full.
   — Confirm exactly where update_status( $queue_id, 'processing' )
     is called and where the subsequent 'sent' / 'failed' transitions
     happen.

6. tests/unit/test-notification-queue.php
   — Read in full. New tests for the stuck-processing fix must
     follow the same setUp/tearDown and helper patterns used here.

If any file does not exist, stop and report back before proceeding.

═══════════════════════════════════════════════════════════
## CONTEXT
═══════════════════════════════════════════════════════════

Three housekeeping fixes from a schema audit. No new features.

Fix A — create_bookings_table() is missing booking_reference and
lock_version columns. They exist in the live DB via migrations 0001
and 0003, but if DB_VERSION is ever bumped and dbDelta re-runs the
CREATE TABLE, they would not be created. Align the source with
reality.

Fix B — wp_bookings_working_hours is a dead table. It was created
by dbDelta on activation but the availability model queries
exclusively wp_bookings_staff_working_hours. The simple table has
no data, is never queried, and should be removed cleanly via a
migration.

Fix C — Email queue items set to 'processing' can get permanently
stuck if a PHP process is killed mid-execution (timeout or memory
limit on shared hosting). A rescue method on Bookit_Email_Queue
will reset any item stuck in 'processing' for more than 5 minutes
back to 'pending' so the retry mechanism can pick it up.

═══════════════════════════════════════════════════════════
## IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════

### includes/class-bookit-database.php — MODIFY

FIX A — create_bookings_table() only.

Add booking_reference as the second column (after id, before
customer_id), matching schema.sql TABLE 7:
```sql
booking_reference VARCHAR(12) NULL COMMENT 'Human-readable booking reference (BKYYMM-XXXX)',
```

Add lock_version after updated_at, before deleted_at:
```sql
lock_version VARCHAR(32) NULL,
```

Add the UNIQUE KEY for booking_reference in the KEY block,
after the existing UNIQUE KEY unique_booking_slot line:
```sql
UNIQUE KEY uq_booking_reference  (booking_reference),
```

Follow the exact two-space dbDelta formatting of every other
KEY line in the method. Do not touch any other column or key.

FIX B — Remove the create_working_hours_table() call from
create_tables(). Keep the private method itself but add a
single comment above it:

```php
/**
 * @deprecated Superseded by wp_bookings_staff_working_hours
 * (migration-add-staff-working-hours.php). Table removed via
 * migration 0011-drop-working-hours-table.php. Method retained
 * to avoid breaking any subclasses.
 */
```

Also remove `$table_prefix . 'bookings_working_hours'` from
the drop_tables() array. Do not touch any other entry in
that array.

---

### database/migrations/0011-drop-working-hours-table.php — CREATE

Follow the pattern in 0010-add-email-queue-table.php exactly.

- Migration ID: `0011-drop-working-hours-table`
- Class name: `Bookit_Migration_0011_Drop_Working_Hours_Table`
- Plugin slug: `bookit-booking-system`

up() method:
  Drop the table if it exists:
  ```php
  $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}bookings_working_hours" );
  ```

down() method:
  Recreate the table exactly as it was in create_working_hours_table()
  so the migration is reversible:
  ```sql
  CREATE TABLE IF NOT EXISTS {table} (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_staff_id (staff_id),
    KEY idx_day_of_week (day_of_week),
    KEY idx_is_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ```

No other logic in this file.

---

### includes/notifications/class-bookit-email-queue.php — MODIFY

FIX C — Add a new public static method rescue_stuck_processing()
after fetch_pending(). Do not modify any existing method.

```php
/**
 * Reset items stuck in 'processing' back to 'pending'.
 *
 * Protects against PHP process kills (timeout / memory limit)
 * on shared hosting that leave items permanently in 'processing'.
 * Any item that has been in 'processing' for more than 5 minutes
 * is considered stuck and is re-queued for retry.
 *
 * @param int $stale_minutes Items older than this are reset. Default 5.
 * @return int Number of rows reset.
 */
public static function rescue_stuck_processing( int $stale_minutes = 5 ): int {
    global $wpdb;

    $cutoff = gmdate( 'Y-m-d H:i:s', time() - ( $stale_minutes * 60 ) );

    $rows_affected = $wpdb->query(
        $wpdb->prepare(
            "UPDATE {$wpdb->prefix}bookit_email_queue
             SET status = 'pending'
             WHERE status = 'processing'
               AND updated_at <= %s",
            $cutoff
        )
    );

    return is_int( $rows_affected ) ? $rows_affected : 0;
}
```

Also hook this method into the existing queue processing flow.
In class-bookit-notification-dispatcher.php, find the method
that is hooked to the Action Scheduler event for queue processing
(the method that calls fetch_pending() and dispatches items).
At the top of that method, before the fetch_pending() call, add:

```php
Bookit_Email_Queue::rescue_stuck_processing();
```

This ensures stuck items are rescued on every queue processing
run without needing a separate cron job.

---

### database/schema.sql — MODIFY

FIX A — Add the two missing columns to TABLE 7 (wp_bookings):

booking_reference: already listed second in the TABLE 7 block —
confirm it is present. If for any reason it is absent, add it
after the id line:
```sql
booking_reference VARCHAR(12) NULL COMMENT 'Human-readable booking reference (BKYYMM-XXXX)',
```

lock_version: already listed in the TABLE 7 block — confirm it
is present. If absent, add it after updated_at.

Add the UNIQUE KEY if absent from the KEY block:
```sql
UNIQUE KEY uq_booking_reference (booking_reference),
```

FIX B — Remove the entire TABLE 9 block (wp_bookings_working_hours)
from schema.sql. This includes the comment header, the CREATE TABLE
statement, and any blank lines between TABLE 9 and TABLE 10.
Renumber TABLE 10 onward if the tables are numbered sequentially
in the file (check first).

Update the migration changelog comment at the top of schema.sql
to add:

-- Migration 11: Drop legacy working hours table
-- Sprint: DB-Audit-Fixes-2
-- Dropped table: wp_bookings_working_hours (superseded by
--   wp_bookings_staff_working_hours)
-- Migration file: database/migrations/0011-drop-working-hours-table.php

═══════════════════════════════════════════════════════════
## INFRASTRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════
- [x] New migration created via Bookit_Migration_Runner pattern
      (file: database/migrations/0011-drop-working-hours-table.php)
- [ ] No error codes, audit log events, or REST endpoints involved

═══════════════════════════════════════════════════════════
## PHPUNIT REQUIREMENTS
═══════════════════════════════════════════════════════════
Baseline: 813 tests, 0 failures — must not regress.

Write new tests in: tests/unit/test-notification-queue.php
Add to the existing test class — do not create a new file.

Required test cases:

- test_rescue_stuck_processing_resets_stale_items:
  Insert a queue row, set its status to 'processing' and its
  updated_at to 10 minutes ago via a direct $wpdb->update call.
  Call rescue_stuck_processing(5). Assert the row's status is
  now 'pending'.

- test_rescue_stuck_processing_ignores_recent_processing_items:
  Insert a queue row, set its status to 'processing' and its
  updated_at to NOW (current time). Call rescue_stuck_processing(5).
  Assert the row's status is still 'processing'.

- test_rescue_stuck_processing_returns_count:
  Insert two rows, set both to 'processing' with updated_at 10
  minutes ago. Call rescue_stuck_processing(5). Assert the return
  value is 2.

Run after implementation:
  cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

═══════════════════════════════════════════════════════════
## ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════

### Functional
- [ ] create_bookings_table() includes booking_reference column,
      lock_version column, and UNIQUE KEY uq_booking_reference
- [ ] migration 0011 up() drops wp_bookings_working_hours
- [ ] migration 0011 down() recreates wp_bookings_working_hours
      with the original column structure
- [ ] rescue_stuck_processing() resets items in 'processing'
      older than the threshold back to 'pending'
- [ ] rescue_stuck_processing() is called at the start of every
      queue processing run

### Technical
- [ ] No PHP warnings or notices
- [ ] dbDelta two-space formatting convention followed in
      create_bookings_table()
- [ ] Migration class name matches 0011-drop-working-hours-table
      naming convention exactly
- [ ] PHPUnit suite passes (813+ tests, 0 failures)

### Must NOT break
- [ ] Availability calculations — confirmed to use only
      wp_bookings_staff_working_hours, not wp_bookings_working_hours
- [ ] Email queue retry and rate limiting logic — rescue_stuck_processing
      must not interfere with items legitimately in 'processing' that
      are still within the 5-minute window
- [ ] Existing test-notification-queue.php tests

═══════════════════════════════════════════════════════════
## GIT COMMIT MESSAGE
═══════════════════════════════════════════════════════════
DB audit housekeeping: bookings table alignment, drop dead
working_hours table, rescue stuck queue processing items

- Add booking_reference, lock_version, uq_booking_reference to
  create_bookings_table() in class-bookit-database.php
- Add migration 0011: drop wp_bookings_working_hours (dead table,
  superseded by wp_bookings_staff_working_hours)
- Remove create_working_hours_table() call from create_tables();
  deprecate method with comment
- Remove wp_bookings_working_hours from drop_tables()
- Add Bookit_Email_Queue::rescue_stuck_processing() to reset items
  stuck in processing > 5min back to pending
- Hook rescue_stuck_processing() into queue processing run
- Update schema.sql: remove TABLE 9, update changelog
- 3 new PHPUnit tests for rescue_stuck_processing()

Tests: [N] passing, 0 failures
═══════════════════════════════════════════════════════════
If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not
resolve, STOP and report back before writing any code.
═══════════════════════════════════════════════════════════
```