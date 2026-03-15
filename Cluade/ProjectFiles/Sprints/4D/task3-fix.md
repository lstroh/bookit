TASK 3 CLEANUP: Remove duplicated helper methods from test-customer-packages-api.php
Sprint: 4D | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `tests/unit/test-customer-packages-api.php` — the file to fix; read in full before touching it
2. `tests/unit/test-package-types-api.php` — reference for how the shared helpers are used (not defined locally)
3. `tests/bootstrap.php` — confirms where create_test_staff, login_as, and other helpers are defined for the suite

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

During Task 3 implementation, `test-customer-packages-api.php` had `login_as()` and `create_test_staff()` defined as local methods inside the `Test_Customer_Packages_API` class. These methods already exist as shared helpers available to all test classes via the base test infrastructure. The local duplicates must be removed. No logic changes — this is a pure deletion task.

---

## IMPLEMENTATION REQUIREMENTS

### `tests/unit/test-customer-packages-api.php` — MODIFY

1. Read the file in full first.
2. Locate the locally defined `login_as()` and `create_test_staff()` methods inside the `Test_Customer_Packages_API` class.
3. Delete both local method definitions entirely.
4. Do NOT change any call sites — calls to `$this->login_as(...)` and `$this->create_test_staff(...)` throughout the class must remain exactly as they are. They will resolve via inheritance.
5. Do NOT modify any other methods, test cases, helpers, setUp, or tearDown.

---

## PHPUNIT REQUIREMENTS

Baseline: 617 tests, 0 failures — must not regress.

After the deletion, run:
```
cd bookit-booking-system && vendor/bin/phpunit
```

All 617 tests must still pass. If any test fails after removal, it means the local definition was diverging from the shared one — stop and report back rather than patching the difference.

---

## ACCEPTANCE CRITERIA

- [ ] `login_as()` method no longer defined inside `Test_Customer_Packages_API`
- [ ] `create_test_staff()` method no longer defined inside `Test_Customer_Packages_API`
- [ ] All call sites (`$this->login_as(...)`, `$this->create_test_staff(...)`) unchanged
- [ ] PHPUnit suite passes (617 tests, 0 failures)

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.