# DATABASE SCHEMA REVIEW PROMPT
## Bookit Booking System — Full Schema Audit

**Purpose:** Full review of all database tables. Identify issues with
structure, business logic, and alignment between schema, migrations,
activator, and PHP/Vue code. Output: issues list with recommended fixes.

---

## YOUR ROLE

You are a senior database architect reviewing the Bookit Booking System
schema before the plugin goes live with its first client.

Your job is to produce a single issues list. Every issue must include:
- **Table/column** affected
- **What the problem is** (structure, logic, or alignment)
- **Why it matters** (what breaks or becomes unreliable)
- **Recommended fix** (SQL or code change)

Issues must be prioritised:
- 🔴 CRITICAL — will cause data loss, booking failures, or security
  problems in production
- 🟠 HIGH — wrong behaviour in edge cases or common flows
- 🟡 MEDIUM — inconsistency or technical debt, not immediately harmful
- 🟢 LOW — improvement or cleanup only

---

## WHAT TO REVIEW

Cover every table in the current schema. The source of truth is
`database/schema.sql` in the project knowledge, but you must also
cross-reference:

1. **`includes/class-bookit-database.php`** — original CREATE TABLE
   definitions used by dbDelta on activation. Check for differences
   from schema.sql.

2. **`includes/class-bookit-activator.php`** — anything added outside
   the migration runner on activation (ALTER TABLE statements, seeded
   settings, auto-created pages).

3. **All migration files** (`database/migrations/0001` through `0010`)
   — columns and tables added since initial creation. Confirm schema.sql
   reflects all of them and that down() is correct inverse of up().
   Note: migrations 0010 is the email queue table (Sprint 4H). Migrations
   0011 were written during Sprint 4F planning but subsequently reverted
   when the online meetings feature was moved to an extension plugin —
   confirm no 0011 file exists in the repo.

4. **`includes/api/class-dashboard-bookings-api.php`** — specifically
   `format_booking()` and `update_booking()`. Check every column it
   reads or writes is present in the actual schema.

5. **`includes/booking/class-booking-creator.php`** — what columns it
   INSERTs into wp_bookings. Check for missing columns or type mismatches.

6. **`includes/api/class-stripe-webhook.php`** — how booking_data is
   constructed after a successful Stripe checkout. Check the INSERT path.

7. **`includes/api/class-package-types-api.php`**,
   **`includes/api/class-customer-packages-api.php`**,
   **`includes/api/class-package-redemption-api.php`** — package tables
   and their columns.

8. **Business requirements** from `ScopeDefinition.md`,
   `SRS_WordPress_Booking_Plugin_v1.0.md`, and
   `System_Architecture_Document_PART1_Sections_1-8.md` — verify the
   schema supports all the business rules that were planned.

---

## SPECIFIC THINGS TO EXAMINE

These are known divergence points discovered during development.
Examine each carefully and report what is actually there vs. what is
needed.

### wp_bookings — status ENUM

The original spec in ScopeDefinition.md defines statuses differently
from what was implemented. Examine:
- What statuses are in the actual ENUM right now
- What statuses does the code actually use (check booking_creator,
  webhook handler, dashboard API, test files)
- Is there a `pending` status that is ever actually used or set?
  Or is it dead code?
- Are all valid state transitions enforced anywhere in PHP?
  (e.g. can a `completed` booking be moved back to `confirmed`?)
- Does the ENUM match what is hardcoded in Vue dashboard status
  filters and badge rendering?

### wp_bookings — payment_status column

The original ScopeDefinition.md schema had a separate `payment_status`
ENUM column. The actual schema.sql does NOT have this column — instead
it uses `full_amount_paid` TINYINT and `balance_due`. Report:
- Is the removal of payment_status correct and intentional?
- Is `full_amount_paid + balance_due` sufficient to reconstruct all
  payment states (unpaid, deposit_paid, paid_full, refunded)?
- Can the refund state be determined from the current columns?

### wp_bookings — magic_link_token

The original ScopeDefinition.md planned a `magic_link_token` column
for cancel/reschedule magic links. Check whether:
- This column exists in the current schema
- If not, how are magic links implemented (if at all)?
- If magic link functionality exists in the code, where is the token
  stored?

### wp_bookings — cooling_off_waiver

The Stripe webhook code passes `cooling_off_waiver` in booking_data.
Check:
- Does this column exist in the schema?
- If it does, is it in schema.sql? What type is it?
- If it doesn't, where does this value go?

### wp_bookings_customers — missing columns

The original spec planned `total_bookings`, `total_spent`, and `user_id`
on wp_bookings_customers. The actual schema.sql does not have them.
Report:
- Are these columns intentionally deferred?
- Does any code reference them?
- Are there any places in the dashboard that show total spent or
  booking count per customer, and if so where does that data come from?

### wp_bookings_database vs schema.sql divergence

`class-bookit-database.php` uses dbDelta for initial table creation.
The schema.sql was updated manually through migrations. Check:
- Is class-bookit-database.php's CREATE TABLE for wp_bookings still
  missing `booking_reference`, `customer_package_id`, `lock_version`
  and other columns added via migrations?
- Does it matter? (dbDelta + migrations should cover this, but verify)

### wp_bookings_payments — alignment with booking flow

The wp_bookings_payments table exists. Check:
- Is it actually populated during the Stripe webhook flow?
- Is it populated during pay_on_arrival flow?
- Is `payment_type` enum correct for all actual payment scenarios
  including package redemptions?
- Is there a `balance_payment` type in the ENUM, or only deposit/
  full_payment/refund?

### wp_bookings_working_hours — structure

Check this table against how working hours are actually queried in
the availability calculation. Look at:
- Column structure vs. what the availability API expects
- How split shifts / break times are stored
- Whether the table supports the "block time off" feature

### wp_bookings_settings — data type handling

The settings table stores all values as strings. Check:
- Is there a `setting_type` column that was added via migration?
- Is it used for type coercion when reading settings?
- Are all required settings seeded on activation (packages_enabled,
  branding_*, cancellation policy settings)?

### Package tables — consistency check

For the three package tables (wp_bookings_package_types,
wp_bookings_customer_packages, wp_bookings_package_redemptions):
- Does schema.sql match the actual migration files (0005–0007)?
- Is `customer_package_id` on wp_bookings covered by migration 0008
  and reflected in schema.sql?
- Are all ENUM values in package status correct and consistent with
  what the API enforces?

### wp_bookit_email_queue — new table (Sprint 4H)

This table was added by migration 0010. It is the only table in the
schema with the `bookit_` prefix rather than `bookings_`. Check:
- Is the table name prefix inconsistency (`wp_bookit_email_queue` vs
  `wp_bookings_*`) intentional or an oversight? Does it matter?
- Is the `status` ENUM complete? Values: pending / processing / sent /
  failed / cancelled. Is `processing` actually set anywhere in code,
  or is the queue worker atomic enough that items go direct from
  pending to sent/failed?
- Is `booking_id` nullable correctly? Confirm there are email types
  that legitimately have no booking_id (e.g. test emails).
- Does the `down()` method drop the table cleanly with no orphan
  data concerns?
- Are the two indexes (`idx_status_scheduled`, `idx_booking_id`)
  sufficient for the query patterns in `Bookit_Email_Queue::fetch_pending()`
  and `cancel_for_booking()`?

### Missing indexes

Identify any columns that are heavily used in WHERE clauses or JOINs
that are not indexed. Pay particular attention to:
- wp_bookings.stripe_session_id (used for webhook lookup)
- wp_bookings.booking_reference (used for human-readable lookup)
- wp_bookings_customers.email (used for wizard my-packages lookup)
- wp_bookings_package_redemptions foreign keys
- wp_bookit_email_queue.booking_id (used for cancel_for_booking())

---

## OUTPUT FORMAT

Produce a numbered issues list grouped by table. Use this structure
for each item:

```
### ISSUE N — [TABLE NAME] — [SHORT TITLE]
Priority: 🔴/🟠/🟡/🟢

Problem:
[What is wrong or inconsistent]

Evidence:
[Which file(s) confirm this — be specific, cite the relevant code
or schema fragment]

Impact:
[What breaks or becomes unreliable if not fixed]

Fix:
[Exact SQL ALTER TABLE, migration file change, or code change needed]
```

At the end, provide:
- A summary table of all issues by priority count
- A recommended fix order (which issues to tackle first and why)
- Any cases where you found the schema to be correct and well-designed
  (not everything will be wrong)

---

## IMPORTANT CONSTRAINTS

- Do not propose new features or schema changes beyond fixing existing
  issues
- Do not suggest changes to the extension plugin architecture
- If you cannot confirm something without reading a specific file,
  say so explicitly — do not guess
- If something looks like an intentional design decision (even if
  unusual), note it as such before marking it an issue
- The test suite is at 813 passing tests — any fix recommendation
  must note if it would require new or modified PHPUnit tests

---

## FILES TO READ (in order)

Start with these — do not write anything until you have read them all:

1. `database/schema.sql` — current state of all tables
2. `includes/class-bookit-database.php` — original activation schema
3. `includes/class-bookit-activator.php` — activation logic
4. `database/migrations/0001` through `0010` — all migrations in order
5. `includes/booking/class-booking-creator.php` — booking INSERT logic
6. `includes/api/class-stripe-webhook.php` — webhook booking creation
7. `includes/api/class-dashboard-bookings-api.php` — format_booking(),
   update_booking()
8. `includes/api/class-package-types-api.php`
9. `includes/api/class-customer-packages-api.php`
10. `includes/api/class-package-redemption-api.php`
11. `includes/notifications/class-bookit-email-queue.php` — queue
    insert, fetch_pending, cancel_for_booking patterns
12. `includes/notifications/class-bookit-notification-dispatcher.php`
    — how queue items are processed and status transitions happen

Cross-reference as needed with:
- `ScopeDefinition.md` — original planned schema
- `System_Architecture_Document_PART1_Sections_1-8.md` — architecture
  decisions
- `SRS_WordPress_Booking_Plugin_v1.0.md` — requirements

All of these are available in the project knowledge. Use the project
knowledge search tool to locate them.