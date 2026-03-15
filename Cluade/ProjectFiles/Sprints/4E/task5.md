No manual testing needed for Tasks 3 or 4. Both were pure PHPUnit additions — no production code was changed, no UI was touched, no new endpoints were added. PHPUnit is the right and sufficient verification for these tasks.

---

Ready for Task 5 whenever you are. Let me pull the current state of the Sprint 4D package test files first.The picture is clear. The Sprint 4D package test files are all already registered in `phpunit.xml` and appear substantially covered. Let me check the specific gaps the sprint plan identified.Now I have a complete picture of Sprint 4D coverage. The search results show the package types API is extensively tested (list, filter, CRUD, deactivate, audit log). Let me check the one specific gap from the sprint plan — deleting a package type that has active customer packages.I now have a complete picture. The Sprint 4D package test coverage is extremely thorough. Let me identify the genuine gaps from the sprint plan:

**Already covered — skip:**
- Package types: CRUD, deactivate, audit log, 404, staff 403, list/filter ✅
- Customer packages: create, expiry date calculation, expires_at null, inactive type rejection, audit log, cancel ✅
- Package expiry cron: expires past, skips future, skips NULL, skips non-active, per-record audit log ✅
- Use package: exhausted (E5002), expired (E5003), service mismatch (E5004), missing (E5001), zero sessions ✅

**Genuine gaps from the sprint plan:**
1. **Cannot delete a package type that has active customer packages** — the API has deactivate but no delete endpoint visible in tests. Need to check if DELETE exists and if the constraint is tested
2. **Deactivating a package type does not affect existing active customer packages** — not visibly tested
3. **`discount` price mode calculates correctly** — customer packages pricing tests cover `fixed`; discount mode needs verifying
4. **`packages_enabled = '0'` gate** — package endpoints returning 403 when setting is disabled — not visibly tested anywhere

---

## TASK 5 OF 8: PHPUnit Coverage — Sprint 4D Packages (~6h, likely 2–3h actual)

```
TASK 5 OF 8: PHPUnit Coverage — Sprint 4D package gaps
Sprint: 4E | Est: 6h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file before writing any code. If any file does not exist, stop and report back.

1. `tests/unit/test-package-types-api.php` — read ALL existing tests; note whether DELETE endpoint tests or deactivation-vs-active-packages tests exist
2. `tests/unit/test-customer-packages-api.php` — read ALL existing tests; note whether discount price mode calculation is tested
3. `tests/unit/test-available-packages-api.php` — read ALL existing tests; note whether `packages_enabled` gate is tested
4. `tests/unit/test-use-package-redemption.php` — read ALL existing tests; note whether `packages_enabled` gate is tested here
5. `includes/api/class-package-types-api.php` — check whether a DELETE endpoint exists; if so, what constraint it enforces on active customer packages
6. `includes/api/class-customer-packages-api.php` — find the discount price mode calculation logic
7. `includes/api/class-available-packages-api.php` — find where `packages_enabled` is checked
8. `phpunit.xml` — confirm all test files are already registered

---

## CONTEXT

Sprint 4D package test files are extensive — 115 tests were added during the sprint. This task fills only the specific cases the sprint plan identified as required but not yet covered. All changes are append-only. No production code changes.

---

## IMPLEMENTATION REQUIREMENTS

### `tests/unit/test-package-types-api.php` — MODIFY (append only, if gaps confirmed)

Read the full file first. Then check each gap:

**Gap 1 — Cannot delete a package type with active customer packages:**
- First read `class-package-types-api.php` to confirm whether a DELETE endpoint exists
- If DELETE exists and the constraint is not tested: add `test_cannot_delete_package_type_with_active_customer_packages`
  - Create a package type, create an active customer package linked to it
  - Attempt DELETE on the package type
  - Assert the response is 422 (or whatever HTTP status the implementation returns)
  - Assert the package type still exists in the database
- If DELETE does not exist (only deactivate): do not add a test. Report: "No DELETE endpoint exists — only deactivate. No test added."

**Gap 2 — Deactivating a package type does not affect existing active customer packages:**
- If not already tested: add `test_deactivating_package_type_does_not_affect_active_customer_packages`
  - Create a package type, create an active customer package linked to it
  - Deactivate the package type via POST `/{id}/deactivate`
  - Assert the customer package status is still `active`
  - Assert the customer package `sessions_remaining` is unchanged

### `tests/unit/test-customer-packages-api.php` — MODIFY (append only, if gap confirmed)

Read the full file first. Then:

**Gap — Discount price mode calculation:**
- Read `class-customer-packages-api.php` to understand exactly how `discount` price mode calculates `purchase_price`
- If no test covers discount mode pricing: add `test_create_discount_mode_stores_correct_purchase_price`
  - Create a package type with `price_mode = 'discount'` and a `discount_percentage` value
  - Create a service with a known price
  - Set `applicable_service_ids` to that service
  - Create a customer package via the API
  - Assert `purchase_price` in the DB matches the expected discounted amount (price × (1 - discount/100))
  - If the `purchase_price` column does not exist or discount calculation is deferred to Stripe, `markTestSkipped()` with a note

### `tests/unit/test-available-packages-api.php` — MODIFY (append only, if gap confirmed)

Read the full file first. Then:

**Gap — `packages_enabled` setting gate:**
- Read `class-available-packages-api.php` to confirm where the `packages_enabled` check is performed
- If no test covers the disabled state: add `test_returns_empty_when_packages_disabled`
  - Set `packages_enabled` to `'0'` in `wp_bookings_settings` (direct DB insert/update)
  - Create an active package type
  - Call `GET /wizard/available-packages?service_id=1`
  - Assert the response is either 200 with empty array OR 403, depending on what the implementation actually returns — read the implementation first to know which
  - After the test, clean up the setting (delete or reset to `'1'`)
- If the gate check is not implemented at all in this endpoint: do not add a test. Report back.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new files created — all changes appended to existing test files
- [ ] No new entries needed in `phpunit.xml`
- [ ] No production code changes

---

## PHPUNIT REQUIREMENTS

**Baseline: 701 tests, 0 failures — must not regress.**

**Expected additions:** 2–4 new test methods.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] No duplicate tests written
- [ ] Package type deletion constraint tested (or gap reported as unimplemented)
- [ ] Deactivation-vs-active-customer-packages tested
- [ ] Discount price mode pricing tested (or marked skipped with reason)
- [ ] `packages_enabled = '0'` gate tested (or gap reported as unimplemented)

### Technical
- [ ] PHPUnit suite passes (701+ tests, 0 failures)
- [ ] No existing test methods modified — append only

### Must NOT break
- [ ] All existing Sprint 4D package test coverage
- [ ] All existing Sprint 4E Tasks 1–4 tests

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 5: PHPUnit coverage gaps — Sprint 4D packages

- [List only what was actually added or reported]

Tests: [N] passing, 0 failures
```

---

If you encounter a method or endpoint that does not exist as expected, **STOP and report back before writing any code.**