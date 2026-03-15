TASK 8-PRE-PATCH: Dashboard Bookings API — Add customer_id Filter & customer_package_id to Response
Sprint: 4D | Est: 1h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-dashboard-bookings-api.php` — read `get_all_bookings()` in full; specifically the SELECT column list, the WHERE clause building block, the `register_rest_route` args for the all-bookings route, and `format_booking()`
2. `tests/unit/test-dashboard-bookings-api.php` — read for existing test patterns; understand `create_test_booking()` helper before adding new tests

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The `GET /dashboard/bookings` endpoint is missing two things needed by the package redemption modal (Task 8-patch): a `customer_id` filter param, and `customer_package_id` in the response payload. This pre-patch adds both in a minimal, backward-compatible way. No other logic changes.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Read the file fully before making any changes.

**Change 1 — Add `b.customer_id` and `b.customer_package_id` to the SELECT in `get_all_bookings()`:**

Find the SELECT block in `get_all_bookings()`. It currently lists specific `b.*` columns. Add two columns to that list:

```sql
b.customer_id,
b.customer_package_id,
```

Place them directly after `b.id` in the SELECT list for clarity.

**Change 2 — Add `customer_id` filter to `get_all_bookings()`:**

After the existing `service_id` filter block and before the `status` filter block, add:

```php
// Customer filter (admin only).
if ( ! empty( $request->get_param( 'customer_id' ) ) && 'admin' === $current_staff['role'] ) {
    $query   .= ' AND b.customer_id = %d';
    $params[] = absint( $request->get_param( 'customer_id' ) );
}
```

**Change 3 — Declare `customer_id` arg in the route registration:**

Find the `register_rest_route` call for `GET /dashboard/bookings`. In its `args` array, add:

```php
'customer_id' => array(
    'required'          => false,
    'type'              => 'integer',
    'minimum'           => 1,
    'sanitize_callback' => 'absint',
),
```

**Change 4 — Expose `customer_id` and `customer_package_id` in `format_booking()`:**

Find the `format_booking()` method. It builds and returns an array from the raw DB row. Add these two fields to the returned array:

```php
'customer_id'         => (int) ( $booking['customer_id'] ?? 0 ),
'customer_package_id' => ! empty( $booking['customer_package_id'] ) ? (int) $booking['customer_package_id'] : null,
```

Place them near the other `customer_*` fields for readability.

Do not change any other part of `format_booking()` or `get_all_bookings()`.

---

## PHPUNIT REQUIREMENTS

Baseline: 663 tests, 0 failures — must not regress.

Add new tests to the **existing** `tests/unit/test-dashboard-bookings-api.php` file. Do not create a new file.

**Required new test cases:**

- `test_get_all_bookings_filters_by_customer_id` — create two customers each with one booking; GET with `customer_id` of customer A returns only customer A's booking
- `test_get_all_bookings_customer_id_filter_ignored_for_staff_role` — staff role user with `customer_id` filter still only sees own bookings (filter silently ignored for staff)
- `test_format_booking_includes_customer_id` — GET /dashboard/bookings response includes `customer_id` field as integer
- `test_format_booking_includes_customer_package_id_null_when_unlinked` — booking with no package: `customer_package_id` is null in response
- `test_format_booking_includes_customer_package_id_when_linked` — booking with `customer_package_id` set: correct integer returned in response

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /dashboard/bookings?customer_id=1` returns only bookings for customer 1 (admin only)
- [ ] Staff role: `customer_id` param has no effect (staff still only see their own bookings)
- [ ] Every booking in the response includes `customer_id` as a non-zero integer
- [ ] Every booking in the response includes `customer_package_id` as integer or null

### Technical
- [ ] No PHP warnings or notices
- [ ] No change to existing response fields (fully backward-compatible)
- [ ] PHPUnit suite passes (663+ tests, 0 failures)

### Must NOT break
- [ ] All existing `test-dashboard-bookings-api.php` tests
- [ ] Existing bookings list view in the Vue dashboard

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 8-pre-patch: Add customer_id filter and customer_package_id to bookings API

- Add b.customer_id and b.customer_package_id to get_all_bookings() SELECT
- Add customer_id filter param (admin only) to get_all_bookings()
- Declare customer_id arg in route registration
- Expose customer_id and customer_package_id in format_booking() response
- Add 5 PHPUnit tests for new filter and response fields

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.