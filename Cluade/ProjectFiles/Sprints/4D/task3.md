TASK 3 OF 9: Customer Packages API — Purchase & Management
Sprint: 4D | Est: 8h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-package-types-api.php` — primary pattern reference: route registration, check_admin_permission, format row, Bookit_Error_Registry usage, Bookit_Audit_Logger usage, $wpdb->insert/update patterns
2. `includes/api/class-customers-api.php` — secondary pattern reference: customer row fetching, list endpoints with filtering
3. `includes/class-bookit-error-registry.php` — existing E5001–E5005 package error codes; do NOT register duplicates
4. `includes/config/error-codes.php` — BOOKIT_E5001–BOOKIT_E5005 constants; confirm no gaps before adding any new ones
5. `includes/class-bookit-audit-logger.php` — Bookit_Audit_Logger::log() signature
6. `includes/class-bookit-loader.php` — where to wire the new controller (after Package Types API block)
7. `database/migrations/0006-create-customer-packages-table.php` — exact schema for wp_bookings_customer_packages
8. `database/migrations/0005-create-package-types-table.php` — schema for wp_bookings_package_types (read for JOIN patterns)
9. `tests/unit/test-package-types-api.php` — test patterns to follow: setUp/tearDown, bookit_test_truncate_tables, insert_* helpers, login_as, create_test_staff
10. `tests/bootstrap.php` — bookit_test_truncate_tables() helper and table list

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 3 delivers the admin-facing Customer Packages API — the endpoints that allow the business dashboard to record package purchases (manually or post-payment), list a customer's packages, and cancel a package. This is a pure PHP backend task with no Vue changes. It sits between Task 2 (Package Types CRUD, which is complete) and Task 4 (Booking Wizard purchase flow, which comes next). The customer_packages table already exists from migration 0006. No new migrations are needed.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-customer-packages-api.php` — CREATE

Follow the exact structure of `class-package-types-api.php`. Do not invent new patterns.

**Class name:** `Bookit_Customer_Packages_API`
**Namespace constant:** `const NAMESPACE = 'bookit/v1';`
**Constructor:** registers `rest_api_init` hook calling `register_routes()`.

**Routes to register:**

| Method | Route | Callback | Auth |
|--------|-------|----------|------|
| GET | `/dashboard/customer-packages` | `list_customer_packages` | admin only |
| POST | `/dashboard/customer-packages` | `create_customer_package` | admin only |
| GET | `/dashboard/customer-packages/{id}` | `get_customer_package` | admin only |
| POST | `/dashboard/customer-packages/{id}/cancel` | `cancel_customer_package` | admin only |

All routes use `check_admin_permission` — copy the exact implementation from `class-package-types-api.php`. `bookit_staff` role must be blocked from all endpoints.

**`list_customer_packages` (GET `/dashboard/customer-packages`):**
- Accepted query params: `customer_id` (integer, optional), `status` (string, optional — one of `active`, `exhausted`, `expired`, `cancelled`)
- Joins `bookings_customer_packages` with `bookings_package_types` to include `package_type_name` in the response (SELECT cp.*, pt.name AS package_type_name)
- Filters by `customer_id` if provided (prepared statement)
- Filters by `status` if provided (validate against allowed ENUM values before querying)
- Orders by `cp.id DESC`
- Returns array of formatted rows (200) or `Bookit_Error_Registry::to_wp_error('E9001')` on DB error

**`create_customer_package` (POST `/dashboard/customer-packages`):**

Route args (all validated in `args` array of `register_rest_route`):
- `customer_id` — integer, required, minimum 1
- `package_type_id` — integer, required, minimum 1
- `payment_method` — string, optional, one of `stripe`, `paypal`, `pay_on_arrival`, `manual`, `other`
- `payment_reference` — string, optional
- `notes` — string, optional
- `purchased_at` — string (datetime), optional — defaults to `current_time('mysql')`

Business logic in the callback (not just args):
1. Fetch the package type row by `package_type_id`. If not found, return `Bookit_Error_Registry::to_wp_error('E5001')`.
2. If the package type's `is_active` is `0`, return a 422 WP_Error: code `package_type_inactive`, message "Cannot purchase an inactive package type."
3. Set `sessions_total` and `sessions_remaining` from the package type's `sessions_count`.
4. Set `purchase_price` from the package type's `fixed_price` (may be null if `price_mode` is `discount`).
5. Set `status` to `'active'`.
6. If the package type's `expiry_enabled` is true and `expiry_days` is set, compute `expires_at` = `purchased_at` + `expiry_days` days (use PHP `DateTime`). Otherwise `expires_at = NULL`.
7. Insert into `wp_bookings_customer_packages` via `$wpdb->insert()`.
8. On insert failure, return `Bookit_Error_Registry::to_wp_error('E9001', ['db_error' => $wpdb->last_error])`.
9. Fire audit log: `Bookit_Audit_Logger::log('customer_package.created', 'customer_package', $new_id, ['new_value' => $formatted_row])`.
10. Return 201 with the formatted row.

**`get_customer_package` (GET `/dashboard/customer-packages/{id}`):**
- Fetch single row (JOIN with package_types for `package_type_name`).
- Return 404 via `Bookit_Error_Registry::to_wp_error('E5001')` if not found.
- Return 200 with formatted row.

**`cancel_customer_package` (POST `/dashboard/customer-packages/{id}/cancel`):**
- Fetch existing row. Return 404 if not found.
- If `status` is already `cancelled`, return 422 WP_Error: code `package_already_cancelled`, message "This package is already cancelled."
- If `status` is `exhausted`, return 422 WP_Error: code `package_already_exhausted`, message "An exhausted package cannot be cancelled."
- Update `status = 'cancelled'`, `updated_at = current_time('mysql')` via `$wpdb->update()`.
- Fire audit log: `Bookit_Audit_Logger::log('customer_package.cancelled', 'customer_package', $id, ['previous_status' => $old_status])`.
- Return 200 with updated formatted row.

**`format_customer_package_row` (private):**

Return shape:
```php
[
    'id'                  => (int),
    'customer_id'         => (int),
    'package_type_id'     => (int),
    'package_type_name'   => (string|null),   // from JOIN; null if not in row
    'sessions_total'      => (int),
    'sessions_remaining'  => (int),
    'purchase_price'      => null or number_format((float), 2, '.', ''),
    'purchased_at'        => (string|null),
    'expires_at'          => (string|null),
    'status'              => (string),         // ENUM value as-is
    'payment_method'      => (string|null),
    'payment_reference'   => (string|null),
    'notes'               => (string|null),
    'created_at'          => (string|null),
    'updated_at'          => (string|null),
]
```

**`fetch_customer_package_row` (private):**
- Executes the JOIN query for a single row by `cp.id`.
- Returns formatted row array or `Bookit_Error_Registry::to_wp_error('E5001')` if not found.

---

### `includes/class-bookit-loader.php` — MODIFY

Read the file first. Find the block where `class-package-types-api.php` is required and instantiated. Immediately after that block, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-customer-packages-api.php';
new Bookit_Customer_Packages_API();
```

Do not move or modify any existing code.

---

### `tests/unit/test-customer-packages-api.php` — CREATE

Follow the exact structure of `tests/unit/test-package-types-api.php`.

**Class name:** `Test_Customer_Packages_API`

**setUp():**
```php
bookit_test_truncate_tables([
    'bookings_package_redemptions',
    'bookings_customer_packages',
    'bookings_package_types',
    'bookings_customers',
    'bookings_audit_log',
]);
```
Create a test admin staff member and log in. Create a test customer row in `wp_bookings_customers` (capture the ID). Create a test package type row (capture the ID).

**tearDown():** Call `bookit_test_truncate_tables()` with the same table list. Clean up staff rows. Reset `$_SESSION = []`.

**Private helpers:**
- `insert_package_type(array $overrides = [])` — inserts into `wp_bookings_package_types`, returns insert ID
- `insert_customer(array $overrides = [])` — inserts into `wp_bookings_customers`, returns insert ID
- `insert_customer_package(array $overrides = [])` — inserts directly into `wp_bookings_customer_packages`, returns insert ID

**Required test cases:**

Authentication & authorisation:
- `test_list_requires_auth` — unauthenticated GET returns 401
- `test_list_requires_admin_role` — staff role returns 403
- `test_create_requires_admin_role` — staff role returns 403

List endpoint:
- `test_list_returns_all_packages` — two customer packages, GET returns both with correct IDs
- `test_list_filters_by_customer_id` — two customers with one package each; filter by customer_id returns only that customer's package
- `test_list_filters_by_status` — two packages with different statuses; filter returns only matching one
- `test_list_includes_package_type_name` — response row includes `package_type_name` string matching the type's name
- `test_list_returns_empty_array_when_none` — no packages in DB, returns 200 with `[]`

Create endpoint:
- `test_create_sets_sessions_from_package_type` — POST creates package; `sessions_total` and `sessions_remaining` equal package type's `sessions_count`
- `test_create_sets_status_active` — newly created package has `status === 'active'`
- `test_create_computes_expires_at_when_expiry_enabled` — package type with `expiry_enabled=1`, `expiry_days=30`; `expires_at` is approximately `purchased_at + 30 days` (assert date portion matches)
- `test_create_expires_at_null_when_expiry_disabled` — package type with `expiry_enabled=0`; `expires_at` is null
- `test_create_returns_404_for_unknown_package_type` — `package_type_id` that does not exist returns 404 with code `E5001`
- `test_create_rejects_inactive_package_type` — package type with `is_active=0` returns 422
- `test_create_fires_audit_log` — after create, `customer_package.created` row exists in audit log
- `test_create_returns_201` — successful create returns HTTP 201

Get single endpoint:
- `test_get_single_returns_correct_package` — returns 200 with matching ID and correct fields
- `test_get_single_returns_404_for_missing` — ID 999999 returns 404 with code `E5001`

Cancel endpoint:
- `test_cancel_sets_status_cancelled` — POST to `/cancel`; DB row `status` is now `cancelled`
- `test_cancel_returns_404_for_missing` — ID 999999 returns 404
- `test_cancel_rejects_already_cancelled` — cancelling a cancelled package returns 422
- `test_cancel_rejects_exhausted_package` — cancelling an exhausted package returns 422
- `test_cancel_fires_audit_log` — after cancel, `customer_package.cancelled` row exists in audit log

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations needed — `wp_bookings_customer_packages` table already exists from migration 0006
- [ ] No new error codes needed — E5001–E5005 already registered; use them directly
- [ ] Audit log events fired:
  - `customer_package.created` on successful POST create
  - `customer_package.cancelled` on successful POST cancel
- [ ] REST endpoints follow pattern in: `includes/api/class-package-types-api.php`
- [ ] `bookit_staff` role blocked from all endpoints via `check_admin_permission`

---

## PHPUNIT REQUIREMENTS

Baseline: 594 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-customer-packages-api.php`

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete. Report the final test count.

Note: Before using any `$wpdb->insert()` format arrays or `WP_REST_Request` patterns, use Context7 to resolve 'WordPress' and confirm the current API.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] GET `/dashboard/customer-packages` returns all packages, filterable by `customer_id` and `status`
- [ ] Response rows include `package_type_name` from JOIN
- [ ] POST `/dashboard/customer-packages` creates a package with `sessions_total`/`sessions_remaining` copied from package type's `sessions_count`
- [ ] `expires_at` is computed correctly when `expiry_enabled = true`; null otherwise
- [ ] Attempting to purchase an inactive package type returns 422
- [ ] Attempting to purchase a non-existent package type returns 404 with code `E5001`
- [ ] POST `/dashboard/customer-packages/{id}/cancel` sets status to `cancelled`
- [ ] Cancelling an already-cancelled package returns 422
- [ ] Cancelling an exhausted package returns 422
- [ ] Audit log entries fire on create and cancel

### Technical
- [ ] No PHP warnings or notices
- [ ] Follows `check_admin_permission` pattern from `class-package-types-api.php` exactly
- [ ] All DB writes use `$wpdb->insert()` / `$wpdb->update()` with format arrays (no raw SQL for writes)
- [ ] All DB reads use `$wpdb->prepare()` for any interpolated values
- [ ] PHPUnit suite passes (594+ tests, 0 failures)

### Must NOT break
- [ ] Package Types API (Task 2) — all 23 existing tests still pass
- [ ] Stripe checkout, webhook, payment success tests — 53 tests still pass
- [ ] Existing booking creation and cancellation flows

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 3: Customer Packages API — purchase and management

- Add Bookit_Customer_Packages_API controller (GET list, POST create,
  GET single, POST cancel)
- Admin-only access via check_admin_permission pattern
- Create: copies sessions_count from package type, computes expires_at
  from expiry_days when expiry_enabled, sets status=active
- Cancel: validates status transitions, rejects exhausted/already-cancelled
- Audit log events: customer_package.created, customer_package.cancelled
- JOIN with package_types returns package_type_name in all responses
- Wire controller in class-bookit-loader.php

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.