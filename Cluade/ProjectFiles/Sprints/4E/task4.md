Good. Let me check the current state of the 4C/4C.5 test files before writing the prompt.Excellent. Now I have a complete picture. The coverage for 4C/4C.5 is already very thorough:

**Already covered — skip:**
- Bulk actions: cancel, complete, no-show success; staff 403; unauthenticated; empty IDs; too many IDs; mixed success/failure; invalid action; per-booking audit log ✅
- Deposit settings: all defaults, all save operations, staff 403, unauthenticated 401, audit log entry ✅
- Cancellation policy: all defaults, window hours, refund types, no-show, reschedule ✅
- GDPR export: JSON download, structure, customer fields, booking count, CSV zip, no cross-customer data ✅

**Genuine gaps from the sprint plan not yet covered:**
- Cancellation policy: **per-service override** saves and reads correctly (the existing tests cover global settings, but not service-level overrides)
- Deposit settings: **percentage deposit calculates correctly at booking step** (settings save is covered; calculation in wizard is not)
- GDPR export: **gateway IDs excluded** from export; **audit log entry written on every export**

Let me check the GDPR export tests more carefully for the audit log gap.I can see `test_export_creates_audit_log_entry` exists (partially visible). Let me check the last remaining gap — gateway IDs in the export.

The search results show `test_json_export_structure` checks that `audit_log` key is absent, and `test_csv_export_returns_zip` checks `audit-log.csv` is absent. The audit log entry test is partially visible but appears to exist. The genuine remaining gap from the sprint plan is whether **gateway IDs (payment_id/stripe IDs) are excluded** from the payments array in the export.

Given how thorough the existing coverage already is (same pattern as Tasks 3), this will be another small task. Here's the prompt:

---

## TASK 4 OF 8: PHPUnit Coverage — Sprints 4C & 4C.5 (~6h, likely 1–2h actual)

```
TASK 4 OF 8: PHPUnit Coverage — Sprints 4C & 4C.5 gaps
Sprint: 4E | Est: 6h (likely 1–2h actual) | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back before proceeding.

1. `tests/test-customer-data-export.php` — read ALL existing tests in full; identify whether gateway ID exclusion and audit log entry tests already exist
2. `tests/unit/test-cancellation-policy-settings.php` — read ALL existing tests; identify whether per-service override is tested
3. `tests/unit/test-deposit-settings.php` — read ALL existing tests; identify whether deposit calculation at booking step is tested
4. `tests/test-bulk-booking-actions.php` — read ALL existing tests; note what is already covered (for context only — bulk actions appear fully covered)
5. `includes/api/class-customers-api.php` — find the `export_customer_data` method; check exactly what fields are included in the payments array of the export response
6. `phpunit.xml` — confirm all test files are already registered

---

## CONTEXT

Coverage for Sprints 4C and 4C.5 is already extensive. This task appends only the specific cases genuinely missing after a careful read of all existing test files. All changes are append-only — no existing tests modified. The total new test count will be small.

---

## IMPLEMENTATION REQUIREMENTS

### `tests/test-customer-data-export.php` — MODIFY (append only, if gaps confirmed)

Read the full file first. Then:

**Gap 1 — Gateway ID exclusion:**
If no test currently verifies that raw gateway/payment IDs (e.g. Stripe `payment_intent_id`, `stripe_session_id`, or similar internal fields) are excluded from the payments array in the JSON export, add:

`test_json_export_payments_exclude_gateway_ids`:
- Create a customer with a booking that has a payment record — insert a payment row directly into `wp_bookings_payments` with fields including a gateway ID field (read `class-customers-api.php` first to see the exact column name used)
- Dispatch the JSON export for that customer
- Parse the response and locate the `payments` array
- Assert that any raw gateway ID column (e.g. `stripe_payment_intent_id`, `gateway_transaction_id`, or whatever the actual column is) is **not present** as a key in any payment object in the export
- If the export does not include a payments section at all, or if there are no gateway ID columns in the schema, `markTestSkipped()` with a note explaining why

**Gap 2 — Audit log entry on export:**
If `test_export_creates_audit_log_entry` (or equivalent) does not already exist, add:

`test_export_creates_audit_log_entry`:
- Create an admin, log in, create a customer, dispatch a JSON export
- After the response, query `wp_bookings_audit_log` for a row with `action` matching whatever the export action string is (read `class-customers-api.php` to find the exact action string used when an export is performed)
- Assert at least one such audit log row exists
- If the export implementation does not write an audit log entry at all, stop and report back rather than writing a test that will always fail

### `tests/unit/test-cancellation-policy-settings.php` — MODIFY (append only, if gap confirmed)

Read the full file first. Then:

**Gap — Per-service cancellation policy override:**
The sprint plan calls for testing that a per-service override saves and reads correctly. If no test currently covers this:

- Read `class-customers-api.php` or the relevant service API to understand whether per-service cancellation policy overrides are actually implemented (i.e. whether services have their own cancellation policy fields)
- If implemented: add `test_per_service_cancellation_policy_override` — create a service, save a service-specific cancellation window or policy setting, read it back, assert the service-level value is returned rather than the global default
- If **not implemented** (per-service overrides are planned for a future sprint but not built yet): do not add a test. Report back: "Per-service cancellation policy override is not implemented — no test added."

### `tests/unit/test-deposit-settings.php` — MODIFY (append only, if gap confirmed)

Read the full file first. Then:

**Gap — Deposit calculation at booking step:**
The sprint plan calls for testing that a percentage deposit calculates correctly at the booking step. If no test covers this:

- Read `includes/payment/class-payment-processor.php` to understand whether deposit calculation logic is testable in isolation (i.e. whether there's a method that takes a service price and deposit settings and returns a calculated deposit amount)
- If there is a testable calculation method: add `test_percentage_deposit_calculates_correctly` in the deposit settings test file, calling that method directly and asserting the correct amount
- If deposit calculation is only done inline in the payment flow (not a separate testable method): do not add a test here. Report back: "Deposit calculation is inline in the payment flow — not testable in isolation without a full integration test. Recommend Sprint 5 integration test."

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new files created — all changes appended to existing test files
- [ ] No new entries needed in `phpunit.xml` — all test files already registered
- [ ] No production code changes

---

## PHPUNIT REQUIREMENTS

**Baseline: 699 tests, 0 failures — must not regress.**

No new test files. All new test methods appended to existing files.

**Expected additions:** 1–3 new test methods (small task — coverage is already comprehensive).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] No duplicate tests written — every new test covers a case not already tested
- [ ] Each gap is either tested or explicitly reported as "not implemented / not testable in isolation"
- [ ] `test-customer-data-export.php` covers gateway ID exclusion (or gap is reported)
- [ ] `test-customer-data-export.php` covers audit log entry on export (or confirmed already covered)
- [ ] `test-cancellation-policy-settings.php` covers per-service override (or gap reported as unimplemented)
- [ ] `test-deposit-settings.php` covers deposit calculation (or gap reported as not testable in isolation)

### Technical
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (699+ tests, 0 failures)
- [ ] No existing test methods modified — append only

### Must NOT break
- [ ] All existing 4C/4C.5 test coverage
- [ ] All existing Sprint 4B and 4D test coverage

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 4: PHPUnit coverage gaps — Sprints 4C & 4C.5

- [List only what was actually added or reported]

Tests: [N] passing, 0 failures
```
*(Update test count from actual PHPUnit output. Note any gaps reported rather than tested.)*

---

If you encounter an architecture decision not covered above, or find that a method does not exist as expected, **STOP and report back before writing any code.**