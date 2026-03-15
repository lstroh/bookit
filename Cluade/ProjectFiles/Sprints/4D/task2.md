# TASK 2 OF 9: Package Types API — CRUD
Sprint: 4D | Est: 8h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/class-bookit-loader.php` — pattern for requiring and instantiating API controllers; your new controller must be wired in here
2. `includes/api/class-team-calendar-api.php` — canonical admin-only REST controller pattern (check_admin_permission, register_routes, error handling)
3. `includes/api/class-customers-api.php` — pattern for list endpoint with pagination, search, and validate/sanitize args
4. `includes/class-bookit-error-registry.php` — existing error codes; E5001–E5005 (packages) are already registered
5. `includes/class-bookit-audit-logger.php` — audit log pattern; must fire on create, update, and deactivate
6. `database/migrations/0005-create-package-types-table.php` — exact schema for `wp_bookings_package_types` (columns, types, constraints)
7. `includes/config/error-codes.php` — confirm BOOKIT_E5001–E5005 constants are present

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 2 delivers the admin-only REST API for managing package type definitions — the catalogue of packages a business owner can create and sell (e.g. "10-session yoga block"). This is a pure backend task: PHP controller + PHPUnit tests only. No Vue frontend is built in this task. The `wp_bookings_package_types` table was created in Task 1. Error codes E5001–E5005 are already registered.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-package-types-api.php` — CREATE

Create a new REST API controller class `Bookit_Package_Types_API` following the pattern in `class-team-calendar-api.php`. Admin-only access for all endpoints (`check_admin_permission`).

**Endpoints to register:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard/package-types` | List all package types (active + inactive) |
| POST | `/dashboard/package-types` | Create a new package type |
| GET | `/dashboard/package-types/(?P<id>\d+)` | Get a single package type |
| PUT | `/dashboard/package-types/(?P<id>\d+)` | Update a package type |
| POST | `/dashboard/package-types/(?P<id>\d+)/deactivate` | Deactivate (soft delete) |

**GET `/dashboard/package-types`:**
- Returns all rows from `wp_bookings_package_types`, ordered by `id ASC`
- Accepts optional query param `active_only` (boolean, default `false`); when `true`, filter `WHERE is_active = 1`
- Response shape per item:
  ```json
  {
    "id": 1,
    "name": "10-session block",
    "description": "...",
    "sessions_count": 10,
    "price_mode": "fixed",
    "fixed_price": "120.00",
    "discount_percentage": null,
    "expiry_enabled": false,
    "expiry_days": null,
    "applicable_service_ids": [1, 2],
    "is_active": true,
    "created_at": "2026-03-08 10:00:00",
    "updated_at": "2026-03-08 10:00:00"
  }
  ```
- `applicable_service_ids`: decode JSON from DB; return `null` if DB value is NULL (means "all services"), return array of integers otherwise
- `is_active` and `expiry_enabled`: return as PHP bool (not int)

**POST `/dashboard/package-types`:**

Required args with validation/sanitization:
- `name` (string, required) — `sanitize_text_field`
- `sessions_count` (integer, required, min 1) — `absint`
- `price_mode` (string, required) — must be one of `fixed`, `discount`
- `fixed_price` (number, required when `price_mode = fixed`, null otherwise) — validate is numeric and >= 0
- `discount_percentage` (number, required when `price_mode = discount`, null otherwise) — validate 0–100
- `description` (string, optional) — `sanitize_textarea_field`
- `expiry_enabled` (boolean, optional, default false)
- `expiry_days` (integer, optional, required when `expiry_enabled = true`, min 1) — `absint`
- `applicable_service_ids` (array of integers, optional, default null) — validate each element is a positive integer; null means all services

Business rules to enforce in the callback (not just in `args`):
- If `price_mode = fixed`, `fixed_price` must be present and >= 0; `discount_percentage` must be null/absent
- If `price_mode = discount`, `discount_percentage` must be present and 0–100; `fixed_price` must be null/absent
- If `expiry_enabled = true`, `expiry_days` must be present and >= 1
- On validation failure, return `WP_Error` with appropriate E-code (use E5001 for not found; for validation errors use HTTP 400 with a descriptive message)

On success:
- Insert row into `wp_bookings_package_types`
- Encode `applicable_service_ids` as JSON string before storing (NULL if null/empty)
- Fire `Bookit_Audit_Logger::log('package_type.created', 'package_type', $new_id, ['new_value' => $data])`
- Return `WP_REST_Response` with the newly created row (same shape as GET list item), HTTP 201

**GET `/dashboard/package-types/(?P<id>\d+)`:**
- Fetch single row by ID
- Return 404 via `Bookit_Error_Registry::to_wp_error('E5001')` if not found
- Same response shape as list item

**PUT `/dashboard/package-types/(?P<id>\d+)`:**
- Same args and business-rule validation as POST
- Fetch existing row first; return E5001 if not found
- Update only the columns passed (all columns are updatable; always update `updated_at`)
- Fire `Bookit_Audit_Logger::log('package_type.updated', 'package_type', $id, ['old_value' => $old, 'new_value' => $new])`
- Return updated row, HTTP 200

**POST `/dashboard/package-types/(?P<id>\d+)/deactivate`:**
- Fetch existing row; return E5001 if not found
- Set `is_active = 0`, update `updated_at`
- Fire `Bookit_Audit_Logger::log('package_type.deactivated', 'package_type', $id, ['old_value' => ['is_active' => true]])`
- Return `{ "success": true, "id": $id }`, HTTP 200
- Do NOT hard-delete; this is a soft deactivation only

**Shared requirements:**
- All DB writes use `$wpdb->insert()` / `$wpdb->update()` with format arrays — never raw SQL for writes
- All DB reads use `$wpdb->prepare()` for any interpolated values
- `check_admin_permission()` must follow the exact pattern in `class-team-calendar-api.php` (load session/auth classes, check `is_logged_in()`, check role is `admin` or `bookit_admin`, return `Bookit_Error_Registry::to_wp_error('E1003')` for wrong role)

---

### `includes/class-bookit-loader.php` — MODIFY

Read the file first. Following the existing pattern for other API controllers, add:

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-package-types-api.php';
new Bookit_Package_Types_API();
```

Place this after the Setup Guide API registration block.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Error codes E5001 (PACKAGE_NOT_FOUND) already registered — use for 404 responses
- [ ] Audit log events fired:
  - `package_type.created` on POST create
  - `package_type.updated` on PUT update
  - `package_type.deactivated` on POST deactivate
- [ ] REST endpoints follow pattern in: `includes/api/class-team-calendar-api.php`
- [ ] No new migrations required (table exists from Task 1)

---

## PHPUNIT REQUIREMENTS

Baseline: 571 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-package-types-api.php`

Test class: `Test_Package_Types_API extends WP_UnitTestCase`

Use the existing helper methods `create_test_staff()` and `login_as()` — read an existing test file like `tests/unit/test-team-calendar-api.php` to confirm the exact helper signatures before using them.

**Required test cases:**

Authentication & authorisation:
- `test_list_requires_auth` — unauthenticated GET returns 401
- `test_list_requires_admin_role` — staff role returns 403
- `test_create_requires_admin_role` — staff role returns 403

GET list:
- `test_list_returns_all_package_types` — insert 2 rows directly via `$wpdb->insert()`, call endpoint, assert both returned
- `test_list_active_only_filter` — insert 1 active + 1 inactive, call with `active_only=true`, assert only active returned
- `test_list_decodes_applicable_service_ids` — insert row with JSON service IDs, assert response contains array of integers
- `test_list_returns_null_for_all_services` — insert row with NULL `applicable_service_ids`, assert response contains `null`

POST create:
- `test_create_valid_fixed_price_package` — valid payload, assert 201, assert DB row exists
- `test_create_valid_discount_package` — `price_mode=discount`, `discount_percentage=20`, assert 201
- `test_create_requires_name` — missing `name`, assert 400
- `test_create_requires_sessions_count` — missing `sessions_count`, assert 400
- `test_create_fixed_price_requires_fixed_price_field` — `price_mode=fixed` but no `fixed_price`, assert 400
- `test_create_discount_requires_discount_percentage` — `price_mode=discount` but no `discount_percentage`, assert 400
- `test_create_expiry_enabled_requires_expiry_days` — `expiry_enabled=true` but no `expiry_days`, assert 400
- `test_create_fires_audit_log` — create package, query audit log table, assert `package_type.created` row exists

GET single:
- `test_get_single_returns_correct_package` — insert row, fetch by ID, assert fields match
- `test_get_single_returns_404_for_missing` — fetch non-existent ID, assert 404 with E5001 code

PUT update:
- `test_update_changes_name` — create, update name, assert new name returned and in DB
- `test_update_returns_404_for_missing` — update non-existent ID, assert 404
- `test_update_fires_audit_log` — update package, assert `package_type.updated` row in audit log

Deactivate:
- `test_deactivate_sets_is_active_false` — create, deactivate, assert `is_active = 0` in DB
- `test_deactivate_returns_404_for_missing` — deactivate non-existent ID, assert 404
- `test_deactivate_fires_audit_log` — deactivate, assert `package_type.deactivated` in audit log

**setUp/tearDown pattern:**
- `setUp`: truncate `wp_bookings_package_types` and `wp_bookings_audit_log` using `bookit_test_truncate_tables()`; create and login admin staff
- `tearDown`: truncate same tables; logout

Run after implementation:
```
npm test
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] GET `/dashboard/package-types` returns all package types with correct field shapes
- [ ] `active_only=true` filters to active packages only
- [ ] `applicable_service_ids` is returned as array of integers (not JSON string)
- [ ] POST create inserts a row and returns it with HTTP 201
- [ ] POST create rejects invalid `price_mode` combinations with HTTP 400
- [ ] POST create rejects missing `expiry_days` when `expiry_enabled=true` with HTTP 400
- [ ] GET single returns 404 (E5001) for non-existent ID
- [ ] PUT update modifies the row and returns the updated shape
- [ ] POST deactivate sets `is_active = 0` without deleting the row
- [ ] All mutating endpoints fire the correct audit log event

### Technical
- [ ] No PHP warnings or notices
- [ ] All DB writes use `$wpdb->insert()` / `$wpdb->update()` with format arrays
- [ ] All DB reads with interpolated values use `$wpdb->prepare()`
- [ ] Follows `check_admin_permission` pattern from `class-team-calendar-api.php`
- [ ] Controller instantiated in `class-bookit-loader.php`
- [ ] PHPUnit suite passes (571+ tests, 0 failures)

### Must NOT break
- [ ] All existing package migration tests (Task 1)
- [ ] Existing dashboard bookings, customers, team calendar, reports endpoints
- [ ] Audit log functionality for existing events

---

## GIT COMMIT MESSAGE
```
Sprint 4D, Task 2: Package Types API — admin CRUD endpoints

- Add Bookit_Package_Types_API controller (GET list, POST create,
  GET single, PUT update, POST deactivate)
- Admin-only access; follows check_admin_permission pattern
- applicable_service_ids stored as JSON, decoded to array on read
- Audit log events: package_type.created/updated/deactivated
- Wire controller in class-bookit-loader.php
- 22 new PHPUnit tests

Tests: NNN passing, 0 failures
```

---

Note: Before implementing REST endpoint args validation, use Context7 to resolve 'WordPress REST API' and confirm the current `validate_callback` and `sanitize_callback` patterns for `register_rest_route` args.

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.