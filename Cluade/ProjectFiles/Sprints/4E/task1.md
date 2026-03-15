Good — Sprint 4D is confirmed complete at 686 tests. Now let me load the cursor-prompt-generator skill before generating anything.Good. Now let me use Context7 to get current WordPress Transients API docs before generating the Task 1 and Task 2 prompts.Good. I have confirmed the Transients API patterns. Now let me generate the Task 1 Cursor prompt.

---

## Sprint 4E — Ready to Begin

**Baseline:** 686 tests, 0 failures. Sprint 4D confirmed complete.

I'll work through tasks in priority order: Tasks 1 & 2 (security) first.

---

## TASK 1 OF 8: Security Audit & Input Validation (~8h)

```
TASK 1 OF 8: Security Audit & Input Validation — OWASP Top 10 Pass
Sprint: 4E | Est: 8h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back before proceeding.

**API files — read all of them:**
1. `includes/api/class-package-types-api.php` — primary Sprint 4D target; audit all queries and output
2. `includes/api/class-customer-packages-api.php` — primary Sprint 4D target
3. `includes/api/class-package-redemption-api.php` — atomic redemption; audit for untested sanitisation
4. `includes/api/class-available-packages-api.php` — public wizard endpoint added in Sprint 4D
5. `includes/api/class-customer-package-lookup-api.php` — public wizard endpoint added in Sprint 4D
6. `includes/api/class-wizard-api.php` — existing public endpoints; use as sanitisation reference
7. `includes/api/class-reports-api.php` — Sprint 4A reports; re-verify $wpdb->prepare() usage
8. `includes/api/class-bulk-bookings-api.php` — Sprint 4C bulk actions endpoint

**Templates — XSS audit targets:**
9. `public/templates/booking-step-5-payment.php` — package UI added in Sprint 4D; primary XSS target

**Core classes:**
10. `includes/class-bookit-error-registry.php` — understand existing error pattern before adding new ones
11. `includes/config/error-codes.php` — read ALL registered codes; understand the format
12. `includes/class-bookit-audit-logger.php` — understand log signature before writing tests

**File upload (existing feature to verify):**
13. `includes/api/class-staff-api.php` — find where staff photo upload is handled; audit MIME check

---

## CONTEXT

This task performs a systematic OWASP Top 10 pass across all PHP files introduced or modified in Sprints 4B–4D. The focus is on the five new package API files, the payment template changes from Sprint 4D, and a re-verification of the earlier reports and bulk-actions endpoints. No new user-facing features are introduced — this is hardening only. Fixes must follow existing patterns established in `class-wizard-api.php` (the sanitisation reference).

---

## IMPLEMENTATION REQUIREMENTS

### All `includes/api/class-package-*.php` files — MODIFY (fix where needed)

**SQL injection audit — for every `$wpdb->query()`, `$wpdb->get_var()`, `$wpdb->get_row()`, `$wpdb->get_results()` call:**
- Every query that incorporates a variable MUST use `$wpdb->prepare()` with typed placeholders: `%d` for integers, `%s` for strings, `%f` for floats
- No string concatenation inside query strings (e.g. `"WHERE id = " . $id` is forbidden)
- If any query already uses `$wpdb->prepare()` correctly, leave it untouched — do not rewrite working code
- Pay special attention to: `customer_id`, `package_type_id`, `booking_id`, `service_id` parameters in WHERE clauses

**Input sanitisation audit — for every REST endpoint `register_rest_route` callback:**
- Integer parameters: use `absint()` before any use
- String parameters: use `sanitize_text_field()`
- Email parameters: use `sanitize_email()`
- JSON parameters (e.g. `applicable_service_ids`): validate that `json_decode()` result is an array before use; reject non-array values with a 400 error
- Parameters that arrive as arrays: validate each element individually

**Specific checks per file:**

`class-package-types-api.php`:
- `applicable_service_ids` POST/PATCH body parameter — must validate as JSON array of integers; each element must be `absint()`-processed
- `price_mode` parameter — must be validated against the allowed ENUM values `['fixed', 'discount']` explicitly
- `discount_percentage` — must be validated as numeric and between 0–100

`class-customer-packages-api.php`:
- `customer_id`, `package_type_id` path/body params — `absint()` before use
- `sessions_total` — `absint()`, must be > 0
- `expires_at` — if provided, validate as a valid date string using `DateTime::createFromFormat()` before storing; reject malformed dates with a 400 error

`class-package-redemption-api.php`:
- `customer_package_id`, `booking_id` — `absint()` before the `SELECT FOR UPDATE` queries
- Verify the atomic transaction block uses `$wpdb->prepare()` for all lock queries

`class-available-packages-api.php` and `class-customer-package-lookup-api.php`:
- These are public (no authentication) — sanitise all query parameters: `service_id`, `customer_email`, or any other params they accept

### `public/templates/booking-step-5-payment.php` — MODIFY (XSS fixes)

- Every `echo` that outputs a variable must use the correct escaping function:
  - URLs: `esc_url()`
  - HTML attribute values: `esc_attr()`
  - Plain text content: `esc_html()`
  - Translated strings containing HTML: `wp_kses_post()` only if HTML is genuinely required, otherwise `esc_html()`
- Package name, sessions remaining, expiry date, price — all must be escaped before output
- Do NOT use `echo $variable` anywhere — every echo must wrap a function
- Do not change any logic, only fix escaping

### `includes/api/class-reports-api.php` and `class-bulk-bookings-api.php` — MODIFY (re-verify only)

- Scan every `$wpdb->query/get_var/get_row/get_results()` call
- If any uses raw string concatenation instead of `$wpdb->prepare()`, fix it
- If all are already using `$wpdb->prepare()` correctly, document this in a code comment and make no changes

### Staff photo upload — MODIFY if gaps found

- Locate the upload handler (likely `class-staff-api.php` or similar)
- Verify the allowed MIME types whitelist is checked server-side (not just file extension)
- Allowed types: `image/jpeg`, `image/png` only
- Max file size: 5MB (5 * 1024 * 1024 bytes)
- If server-side MIME check is missing: add it using `wp_check_filetype()` against the whitelist
- If it already exists and is correct: add a comment confirming it and make no changes

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new DB tables or migrations required for this task
- [ ] No new error codes required (existing E-codes cover validation failures)
- [ ] No new audit log events required (this task is hardening, not new behaviour)

---

## PHPUNIT REQUIREMENTS

**Baseline: 686 tests, 0 failures — must not regress.**

Write new tests in: `tests/unit/test-security-input-validation.php`

**Required test cases — write a test for each actual vulnerability fixed:**

For each `$wpdb->prepare()` fix (if any are needed):
- `test_package_type_query_uses_prepared_statement`: call the relevant method with a SQL-injection string as the parameter (e.g. `"1 OR 1=1"`); assert the query does not return unexpected rows

For each input sanitisation fix:
- `test_package_type_invalid_price_mode_rejected`: POST with `price_mode = 'invalid_value'`; assert 400 response
- `test_package_type_discount_percentage_over_100_rejected`: POST with `discount_percentage = 150`; assert 400 response
- `test_customer_package_invalid_expires_at_rejected`: POST with `expires_at = 'not-a-date'`; assert 400 response
- `test_applicable_service_ids_non_array_rejected`: POST with `applicable_service_ids = "not-json"`; assert 400 response

For XSS (template tests):
- If you can render the template in a test context: `test_package_name_is_escaped_in_template` — inject `<script>alert(1)</script>` as a package name; assert the rendered output contains `&lt;script&gt;` not `<script>`
- If template rendering is not available in the test context: document why and skip this test with `$this->markTestSkipped()`

For file upload (if fix was needed):
- `test_staff_photo_upload_rejects_non_image_mime`: submit a file with `.jpg` extension but `text/html` MIME type; assert 400 response

**Do not write tests for things that were already correct — only write tests for actual vulnerabilities fixed.**

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] All `$wpdb->query/get_var/get_row/get_results()` calls in package API files use `$wpdb->prepare()` with typed placeholders — zero raw string concatenation
- [ ] `price_mode` validated against `['fixed', 'discount']` enum on package type create/update
- [ ] `discount_percentage` validated as 0–100 numeric on package type create/update
- [ ] `applicable_service_ids` validated as a JSON array of integers; non-array input returns 400
- [ ] `expires_at` validated as a real parseable date; malformed input returns 400
- [ ] All variable output in `booking-step-5-payment.php` wrapped in `esc_html()`, `esc_attr()`, or `esc_url()` as appropriate — no bare `echo $variable`
- [ ] Staff photo upload rejects non-image MIME types server-side (verified or fixed)
- [ ] Reports API and bulk bookings API verified — all queries using `$wpdb->prepare()`

### Technical
- [ ] No PHP warnings or notices introduced by the changes
- [ ] All new validation returns consistent HTTP 400 with an error message matching the existing error response shape
- [ ] PHPUnit suite passes (686+ tests, 0 failures)

### Must NOT break
- [ ] Package type CRUD (create, edit, deactivate, list)
- [ ] Package redemption flow (wizard Step 5 + admin dashboard)
- [ ] Booking wizard all 5 steps
- [ ] Staff photo upload for valid JPG/PNG files
- [ ] Bulk booking actions (cancel, confirm)
- [ ] Reports/analytics endpoints

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 1: Security audit & input validation

- Applied $wpdb->prepare() to all raw queries in package API files
- Added enum validation for price_mode and discount_percentage
- Added JSON array validation for applicable_service_ids
- Added date validation for expires_at parameter
- Fixed esc_html/esc_attr/esc_url in booking-step-5-payment.php
- Verified/fixed server-side MIME check on staff photo upload
- Verified reports and bulk-actions APIs use prepared statements

Tests: [N] passing, 0 failures
```
*(Update the test count from the actual PHPUnit output before committing.)*

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**

---

Ready to proceed with this task? Once Cursor has finished and you've confirmed the PHPUnit count, report back and I'll generate Task 2 (Rate Limiting).