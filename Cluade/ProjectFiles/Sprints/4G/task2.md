TASK 2A OF 3: Public Package Redemption History Endpoint
Sprint: 4G | Est: ~1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-customer-package-lookup-api.php` — full file; this is
   the file being modified; understand the existing class structure, route
   registration pattern, rate limiter usage, and packages_enabled gate added
   in Task 1 before adding anything new.

2. `includes/api/class-customer-packages-api.php` — read the `get_redemptions()`
   method in full; the JOIN query it uses is the reference implementation for
   the new public endpoint — reuse it, do not invent a new query.

3. `phpunit.xml` (or `phpunit.xml.dist`) — confirm which test suite covers
   `class-customer-package-lookup-api.php` to determine the correct test file.

4. `tests/unit/test-use-package-redemption.php` — read in full; understand the
   fixture helpers already established in this class (insert_customer,
   insert_package_type, insert_customer_package, etc.) before writing new tests.

If any file does not exist or differs from expectations, stop and report
back before proceeding.

---

## CONTEXT

The `[bookit_my_packages]` shortcode template (Task 2b) needs to load
redemption history per package via AJAX. The existing
`GET /dashboard/customer-packages/{id}/redemptions` endpoint is
dashboard-auth-gated and cannot be called from a public page. This task
adds a public equivalent scoped by customer email (not dashboard session),
added to the existing `Bookit_Customer_Package_Lookup_API` class.
Task 2b depends on this endpoint existing before the template is built.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-customer-package-lookup-api.php — MODIFY

Read the full file via GitHub before making any change.

**1. Register a new route** inside `register_routes()`, after the existing
`/wizard/my-packages` route registration:

```
GET /wp-json/bookit/v1/wizard/package-redemptions
  ?customer_email={email}&customer_package_id={id}
```

Route args:
- `customer_email` — required, string, `sanitize_callback: sanitize_email`
- `customer_package_id` — required, integer, `sanitize_callback: absint`,
  `validate_callback`: must be numeric and >= 1

`permission_callback`: `__return_true` (public endpoint)

**2. Add a new method** `get_package_redemptions( $request )` following the
same method ordering and docblock pattern as `get_my_packages()`.

Method logic (in this exact order):

1. Rate limit check — use action key `'wizard_pkg_redemp'`, limit 30,
   window `HOUR_IN_SECONDS`. Return `handle_exceeded()` if blocked.

2. packages_enabled gate — identical block to the one added in Task 1.
   Return `new WP_REST_Response( array(), 200 )` if disabled.

3. Validate and sanitise inputs:
   - `$customer_email` — `sanitize_email()` + `is_email()` check;
     return 400 WP_Error with message 'A valid customer email is required.'
     if invalid (reuse the identical error from `get_my_packages()`).
   - `$customer_package_id` — `absint()`; return 400 WP_Error with message
     'A valid package ID is required.' if result is 0.

4. Look up customer by email:
   ```sql
   SELECT id FROM {prefix}bookings_customers WHERE email = %s LIMIT 1
   ```
   If not found — return `new WP_REST_Response( array(), 200 )`.
   Do NOT return a 404; this avoids email enumeration.

5. Verify the package belongs to this customer:
   ```sql
   SELECT id FROM {prefix}bookings_customer_packages
   WHERE id = %d AND customer_id = %d LIMIT 1
   ```
   If not found — return `new WP_REST_Response(
       array( 'error' => 'forbidden' ), 403
   )`.

6. Query redemption history — reuse the JOIN pattern from
   `class-customer-packages-api.php` `get_redemptions()`, but:
   - Add `LIMIT 10` (most recent 10 only)
   - Keep `ORDER BY r.redeemed_at DESC`
   - Select only: `r.redeemed_at`, `b.booking_date`, `s.name AS service_name`,
     `CONCAT(st.first_name, ' ', st.last_name) AS staff_name`
   - No `redeemed_by`, `notes`, `booking_reference`, or `start_time` needed
     in the public response

7. Return `new WP_REST_Response( $items, 200 )` where `$items` is an array
   of objects each containing:
   - `redeemed_at` (string)
   - `booking_date` (string)
   - `service_name` (string)
   - `staff_name` (string, trimmed)

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new migration required.
- [ ] No new error codes required (reuse existing 400 pattern from
      `get_my_packages()`; 403 uses inline array response, not error registry).
- [ ] No audit log event required (read-only public endpoint).
- [ ] New route follows the same `bookit/v1` + `__return_true` pattern as
      the existing `/wizard/my-packages` route in this file.

---

## PHPUNIT REQUIREMENTS

Baseline: 707 tests, 0 failures — must not regress.

Read `phpunit.xml` and `tests/unit/test-use-package-redemption.php` via
GitHub before writing. Add new test cases to that file (or a new
`test-public-package-redemptions-api.php` file if that is cleaner — check
phpunit.xml to ensure it is included in the suite).

Required test cases:

**`test_package_redemptions_returns_empty_for_unknown_email`**
- Call endpoint with a valid-format email that does not exist in the DB
- Assert HTTP 200, response body is `[]`
- (No enumeration — must not return 404)

**`test_package_redemptions_returns_403_if_package_belongs_to_different_customer`**
- Create two customers (A and B), one package belonging to customer A
- Call endpoint with customer B's email and customer A's package ID
- Assert HTTP 403

**`test_package_redemptions_returns_correct_shape`**
- Create a customer, package type, customer package, booking (with service
  and staff), and one redemption record
- Call endpoint with customer email and package ID
- Assert HTTP 200
- Assert response is an array with one item containing keys:
  `redeemed_at`, `booking_date`, `service_name`, `staff_name`

**`test_package_redemptions_respects_packages_enabled_gate`**
- Set `packages_enabled` = `'0'`
- Create a customer with an active package and a redemption
- Call endpoint
- Assert HTTP 200, response body is `[]`

**`test_package_redemptions_returns_at_most_10_results`**
- Create a customer, package, and 12 redemption records
- Call endpoint
- Assert response contains exactly 10 items

After implementation run:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

Note: Before writing PHPUnit request dispatch, use Context7 to resolve
'wordpress rest api phpunit' and confirm the `WP_REST_Request` dispatch
pattern matches what is already used in this test suite.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /wp-json/bookit/v1/wizard/package-redemptions?customer_email=x&customer_package_id=1`
      returns `[]` (200) for an unknown email — no enumeration
- [ ] Returns 403 if the package does not belong to the supplied email
- [ ] Returns up to 10 redemptions newest-first with correct field shape
- [ ] Returns `[]` (200) when `packages_enabled` = `'0'`
- [ ] Returns 400 if `customer_email` is missing or invalid
- [ ] Returns 400 if `customer_package_id` is missing or zero

### Technical
- [ ] No PHP warnings or notices
- [ ] Rate limit uses action key `'wizard_pkg_redemp'`, limit 30/hour
- [ ] All SQL uses `$wpdb->prepare()`
- [ ] Follows the same class structure and docblock pattern as
      `get_my_packages()` in this file
- [ ] PHPUnit suite passes (712+ tests, 0 failures)

### Must NOT break
- [ ] Existing `/wizard/my-packages` endpoint behaviour unchanged
- [ ] Existing `get_my_packages()` method unchanged
- [ ] All 707 existing tests continue to pass

---

## GIT COMMIT MESSAGE

```
Sprint 4G, Task 2a: Add public package redemption history endpoint

- Add GET /wizard/package-redemptions to Bookit_Customer_Package_Lookup_API
- Scoped by customer_email ownership check (no dashboard auth required)
- Rate limited 30/hour, packages_enabled gated, max 10 results
- Returns empty array for unknown emails (no enumeration)
- Returns 403 if package belongs to a different customer
- Add 5 PHPUnit tests covering all guard clauses and response shape

Tests: 712 passing, 0 failures
```

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.