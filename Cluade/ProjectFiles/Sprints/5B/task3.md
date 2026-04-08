Let me read the key files before writing Part C.I have everything I need. Here is the Part C prompt:

---

## 5B-2 — Cursor Prompt: Part C — Refund State (Migration 0015 + charge.refunded Handler)

```
TASK 3 OF 3: Refund State — Migration 0015 + charge.refunded Webhook Handler
Sprint: 5B | Est: 3h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. database/migrations/0014-backfill-magic-link-tokens.php
   — Read the full file. Migration 0015 must follow this exact class
   structure, naming convention, migration_id(), plugin_slug(),
   up(), and down() pattern. Pay attention to the column_exists()
   guard pattern in 0008-add-customer-package-id-to-bookings.php
   — use the same guard in 0015 up() and down().

2. database/migrations/0008-add-customer-package-id-to-bookings.php
   — Read the column_exists() helper and the ALTER TABLE ADD COLUMN
   pattern. Migration 0015 adds a column the same way.

3. includes/class-bookit-migration-runner.php
   — Confirm how migrations are discovered. Check whether migration
   files are auto-discovered by scanning the migrations directory
   or whether they must be explicitly registered somewhere.

4. database/schema.sql
   — Read the wp_bookings table definition. Confirm refunded_amount
   does NOT exist. You will add it via migration 0015 and document
   it in schema.sql.

5. includes/api/class-stripe-webhook.php
   — Read the full file as it stands after Parts A and B. Find the
   main handle() dispatch method. Confirm whether charge.refunded
   is currently handled. Find handle_booking_checkout_completed()
   to understand the audit log, payment record insert, and error
   log patterns you must follow.

6. includes/class-bookit-audit-logger.php
   — Read the log() method signature to confirm parameters.

7. includes/config/error-codes.php
   — Read to follow the registration pattern for any new error codes.

8. tests/unit/test-stripe-v2-wiring.php
   — Read the existing file to follow established patterns before
   adding new tests.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task adds the ability to represent a refunded booking in the
database. Currently there is no refunded_amount column on wp_bookings,
so when Stripe issues a refund the charge.refunded webhook fires but
has nowhere to record the amount. Migration 0015 adds the column and
the webhook handler processes the event.

---

## IMPLEMENTATION REQUIREMENTS

### database/migrations/0015-add-refunded-amount-to-bookings.php — CREATE

Class name: Bookit_Migration_0015_Add_Refunded_Amount_To_Bookings
Migration ID: '0015-add-refunded-amount-to-bookings'
Plugin slug: 'bookit-booking-system'

up():
- Guard: if column already exists, return early (same pattern as 0008)
- ALTER TABLE {$wpdb->prefix}bookings
  ADD COLUMN refunded_amount DECIMAL(10,2) NULL DEFAULT NULL
  AFTER payment_intent_id (or after the last payment-related column
  — read the actual bookings table structure first)
- Use the column_exists() helper pattern from 0008

down():
- Guard: if column does not exist, return early
- ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN refunded_amount

Include the column_exists() private helper method — same
implementation as in 0008.

### database/schema.sql — MODIFY

Add refunded_amount to the wp_bookings table definition comment
block, after payment_intent_id or whichever column up() places
it after. Add:
  refunded_amount DECIMAL(10,2) NULL DEFAULT NULL,
Also add a comment noting it is added by migration 0015.

### includes/api/class-stripe-webhook.php — MODIFY

In the main handle() dispatch method, add handling for the
'charge.refunded' event type alongside the existing
'checkout.session.completed' case.

Add a new private method handle_charge_refunded($event):

Step 1 — Extract charge object:
- $charge = $event->data->object
- $payment_intent_id = $charge->payment_intent ?? ''
- If empty payment_intent_id: log and return true (can't look up)

Step 2 — Look up booking by payment_intent_id:
- SELECT id, total_price, refunded_amount, status
  FROM {$wpdb->prefix}bookings
  WHERE payment_intent_id = %s
  AND deleted_at IS NULL
  LIMIT 1
- If not found: log "charge.refunded: no booking for PI {id}"
  and return true (not an error — may be a package purchase
  payment, not a booking payment)

Step 3 — Calculate refund amount:
- $refund_amount_pence = $charge->amount_refunded ?? 0
- $refund_amount_gbp = $refund_amount_pence / 100
- If $refund_amount_gbp <= 0: return true (nothing to record)

Step 4 — Update booking refunded_amount:
- UPDATE wp_bookings SET refunded_amount = %f
  WHERE id = %d
- Use the Stripe amount_refunded value directly — this is the
  cumulative total refunded on the charge (not the delta),
  so it is safe to overwrite on multiple partial refunds.

Step 5 — If full refund, cancel the booking:
- A full refund means refunded_amount >= total_price
- Read total_price from the booking row fetched in Step 2
- If full refund AND booking status is not already 'cancelled':
  UPDATE wp_bookings SET status = 'cancelled',
  cancelled_at = NOW(), cancelled_by = 0
  WHERE id = %d
  (cancelled_by = 0 means system-initiated)
- This bypasses the admin transition guard intentionally —
  this is a system event not an admin action. Add a comment
  explaining this.

Step 6 — Insert payment record:
- INSERT into wp_bookings_payments:
  booking_id, amount = -$refund_amount_gbp (negative for refunds),
  payment_type = 'refund',
  payment_method = 'stripe',
  status (use existing payment_status column name — read the
  actual wp_bookings_payments schema to confirm the column name),
  payment_intent_id = $payment_intent_id
  Follow the exact INSERT pattern from handle_booking_checkout_completed()

Step 7 — Audit log and error log:
- Bookit_Audit_Logger::log(
    'booking.refunded',
    'booking',
    $booking_id,
    [
      'new_value' => ['refunded_amount' => $refund_amount_gbp],
      'notes' => 'Refund processed via Stripe charge.refunded webhook',
    ]
  )
- error_log() the refund details if self::should_log()
- Return true

### includes/config/error-codes.php — MODIFY (if needed)

No new error codes are required for this task — the handler
returns true (acknowledged) even on lookup failures to prevent
Stripe from retrying indefinitely. Only register a new code if
you find a case that genuinely requires one.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Migration 0015 created following exact pattern of 0008 + 0014
- [ ] column_exists() guard in both up() and down()
- [ ] schema.sql updated to document refunded_amount column
- [ ] charge.refunded event handled in webhook dispatch
- [ ] Audit log fired: 'booking.refunded' on successful update
- [ ] Payment record inserted with negative amount for refund
- [ ] Full refund sets booking status to 'cancelled'

---

## PHPUNIT REQUIREMENTS

Baseline: 870 tests, 0 failures — must not regress.

New test file: tests/unit/test-stripe-refund-webhook.php

Required test cases:

- test_migration_0015_adds_refunded_amount_column
  Run migration 0015 up(). Assert refunded_amount column exists
  on wp_bookings. Run down(). Assert column removed. Run up()
  again to leave test DB in correct state.

- test_charge_refunded_updates_refunded_amount
  Insert a booking with payment_intent_id and total_price = 50.00.
  Simulate a charge.refunded webhook event with amount_refunded
  = 2500 (£25.00 partial refund). Assert booking's refunded_amount
  = 25.00 and status is unchanged.

- test_charge_refunded_full_refund_cancels_booking
  Insert a booking with total_price = 50.00, status = 'confirmed'.
  Simulate charge.refunded with amount_refunded = 5000 (£50.00).
  Assert refunded_amount = 50.00 and status = 'cancelled'.

- test_charge_refunded_no_booking_returns_true
  Simulate charge.refunded with a payment_intent_id that does
  not match any booking. Assert handler returns true (no error).

- test_charge_refunded_inserts_payment_record
  Simulate a refund. Assert one wp_bookings_payments row exists
  with payment_type = 'refund' and negative amount.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] charge.refunded webhook updates refunded_amount on booking
- [ ] Partial refund: refunded_amount updated, status unchanged
- [ ] Full refund: refunded_amount updated, status = 'cancelled'
- [ ] Payment record inserted with payment_type = 'refund',
      negative amount
- [ ] No booking found for PI: handler returns 200 true (no error)

### Technical
- [ ] Migration 0015 is idempotent (column_exists guards)
- [ ] refunded_amount column is DECIMAL(10,2) NULL DEFAULT NULL
- [ ] Audit log fires on every refund processed
- [ ] No PHP warnings or notices
- [ ] PHPUnit: 870+ tests, 0 failures

### Must NOT break
- [ ] checkout.session.completed booking flow unchanged
- [ ] checkout.session.completed package flow unchanged
- [ ] Pay on Arrival flow unchanged
- [ ] All existing 870 tests pass

---

## GIT COMMIT MESSAGE

Sprint 5B, Task 3 of 3: Refund state — migration 0015 + charge.refunded handler

- 0015-add-refunded-amount-to-bookings.php: DECIMAL(10,2) NULL column
  on wp_bookings with column_exists() guards
- schema.sql: refunded_amount documented in wp_bookings definition
- class-stripe-webhook.php: handle_charge_refunded() — updates
  refunded_amount, cancels booking on full refund, inserts negative
  payment record, fires booking.refunded audit log
- 5 new PHPUnit tests in test-stripe-refund-webhook.php

Tests: 875+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```