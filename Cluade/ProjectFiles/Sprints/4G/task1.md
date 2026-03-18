TASK 1 OF 3: packages_enabled Gate on /wizard/my-packages
Sprint: 4G | Est: ~1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-customer-package-lookup-api.php` — full file; this is the file
   being modified; understand the current `get_my_packages()` method structure, the
   existing rate limit check, and the full response flow before adding anything.

2. `includes/api/class-available-packages-api.php` — full file; this is the reference
   implementation for the packages_enabled gate; copy the exact gate pattern from here.

3. `phpunit.xml` (or `phpunit.xml.dist`) — check which test file/suite covers
   customer package lookup to determine the correct file for the new test.

4. `tests/unit/test-use-package-redemption.php` — read in full; understand the existing
   test setup, helper methods, and fixture pattern before writing the new test case.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The `/wizard/my-packages` public endpoint is missing a packages_enabled gate.
Every other packages-related public endpoint returns an empty response when
packages are disabled — this endpoint does not, which is inconsistent and a
minor data-leak risk. This is a one-block addition at the top of `get_my_packages()`,
mirroring the identical gate already in `class-available-packages-api.php`. This is
the first task in Sprint 4G and must be verified complete before proceeding to Task 2.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-customer-package-lookup-api.php — MODIFY

- Read the full file via GitHub before making any change.
- Locate the `get_my_packages()` method.
- Immediately after the existing rate limit check (and before any database queries
  or customer lookup), add the packages_enabled gate:

```php
$packages_enabled = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings
         WHERE setting_key = %s LIMIT 1",
        'packages_enabled'
    )
);
if ( '1' !== (string) $packages_enabled ) {
    return new WP_REST_Response( array(), 200 );
}
```

- Do not change any other logic in the method.
- Do not touch any other file in this class.
- The gate must be placed BEFORE any customer lookup or DB query that touches
  package data — placement matters for consistency with `class-available-packages-api.php`.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new migration required (no schema changes).
- [ ] No new error codes required.
- [ ] No audit log event required (read-only endpoint, no state change).
- [ ] REST endpoint pattern unchanged — this is a guard-clause addition only.

---

## PHPUNIT REQUIREMENTS

Baseline: 706 tests, 0 failures — must not regress.

Read `phpunit.xml` and `tests/unit/test-use-package-redemption.php` via GitHub
before writing anything. Confirm the correct test class and file to add the new
test case to. If a different file is more appropriate (e.g. a dedicated
`test-customer-package-lookup-api.php`), check `phpunit.xml` to confirm it is
already included in the test suite; if it isn't, add the new file AND register it.

Required test case:

**`test_my_packages_returns_empty_when_packages_disabled`**
- Set `packages_enabled` = `'0'` in `{prefix}_bookings_settings`
- Create a customer record in `{prefix}_bookings_customers`
- Create at least one active customer package record in
  `{prefix}_bookings_customer_packages` linked to that customer
- Make a request to the endpoint with the customer's email
- Assert HTTP status is 200
- Assert the response body is an empty array `[]`

After implementation run:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

Note: Before writing any PHPUnit assertions, use Context7 to resolve
'wordpress phpunit' and confirm the current WP_REST_Request testing pattern
if you are uncertain of the test request construction approach used elsewhere
in this suite.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /wp-json/bookit/v1/wizard/my-packages?customer_email=x` returns `[]`
      with HTTP 200 when `packages_enabled` = `'0'` in the settings table
- [ ] Endpoint still returns package data normally when `packages_enabled` = `'1'`
- [ ] Gate is placed before any customer or package database queries

### Technical
- [ ] No PHP warnings or notices
- [ ] Gate uses `$wpdb->prepare()` — no raw SQL
- [ ] Follows the identical pattern used in `class-available-packages-api.php`
- [ ] PHPUnit suite passes (707+ tests, 0 failures)

### Must NOT break
- [ ] All existing `get_my_packages()` behaviour when packages are enabled
- [ ] Rate limiting still fires before the new gate (gate is added AFTER the rate
      limit check, not before)
- [ ] All 706 existing tests continue to pass

---

## GIT COMMIT MESSAGE

```
Sprint 4G, Task 1: Add packages_enabled gate to /wizard/my-packages endpoint

- Add packages_enabled setting check to get_my_packages() in
  class-customer-package-lookup-api.php, mirroring the gate in
  class-available-packages-api.php
- Return empty array (200) when packages are disabled, before any DB queries
- Add PHPUnit test: test_my_packages_returns_empty_when_packages_disabled

Tests: 707 passing, 0 failures
```

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.