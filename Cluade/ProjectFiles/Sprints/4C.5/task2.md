Perfect. 10 new tests added (551 → 561), all passing. Hours noted as unknown.

---

**SPRINT 4C.5 PROGRESS TRACKER**

| Task | Status | Est | Actual |
|------|--------|-----|--------|
| Task 1: Bulk Booking Actions | ✅ Complete | ~6h | — |
| Task 2: GDPR Data Portability Export | 🔄 In progress | ~8h | — |
| Task 3: Contextual Help Tooltips | ⬜ Not started | ~6h | — |

**PHPUnit:** 561 tests, 1796 assertions, 0 failures
**Sprint status:** Task 2 in progress

---

Here is the Task 2 Cursor prompt.

---

```
# CURSOR IMPLEMENTATION PROMPT
## Sprint 4C.5 — Task 2: GDPR Customer Data Portability Export
## Bookit Booking System | Branch: Phase1

---

## MANDATORY READS — DO THESE FIRST

Read these files completely before writing any code:

1. `bookit-booking-system/includes/api/class-customers-api.php`
   — read the ENTIRE file. Find the existing export_customers_csv()
   method and the existing GET /dashboard/customers/export route.
   Understand exactly what it does. Your new endpoint is separate
   and must not touch, duplicate, or break this existing export.
   Also read check_admin_permission() in this file — your new
   endpoint must use the same method.

2. `bookit-booking-system/dashboard/src/views/Customers.vue`
   (or equivalent customer list/detail view) — find where individual
   customer profiles are shown. Your "Export Customer Data" button
   goes on the single customer detail/profile view, not the list.

3. `bookit-booking-system/dashboard/src/components/` — check for
   any existing customer detail modal or panel component that shows
   a single customer's information. The export button belongs there.

4. `bookit-booking-system/includes/class-bookit-audit-logger.php`
   — read the log() method signature. You will call this once when
   an export is triggered.

5. `bookit-booking-system/includes/class-bookit-error-registry.php`
   — read existing error code ranges to avoid collision when
   registering new error codes.

6. `bookit-booking-system/dashboard/src/composables/useApi.js`
   — the existing API composable. Note: file download endpoints
   cannot use this composable directly (it returns JSON). You will
   need to trigger a direct browser navigation for the download
   instead. Read how the existing CSV export is triggered in the
   Vue frontend for the customer list, and follow the same pattern.

---

## WHAT YOU ARE BUILDING

A per-customer full data export satisfying GDPR Article 20 (Right
to Data Portability). Admin triggers this from the individual
customer profile view. Two formats: JSON (primary) and CSV (zip
of multiple files).

This is completely separate from the existing bulk customer CSV
export. Do not touch that feature.

---

## BACKEND — NEW REST ENDPOINT

### Route registration

Add to `class-customers-api.php` alongside existing routes:

```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/customers/(?P<id>\d+)/export',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'export_customer_data' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'id'     => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'format' => array(
                'required'          => true,
                'type'              => 'string',
                'enum'              => array( 'json', 'csv' ),
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    )
);
```

### Export data to collect

For the given customer ID, collect ALL of the following. Every query
must be scoped to this customer only — no other customer's data
may appear under any circumstances:

**Personal details** (from bookings_customers table):
- id, first_name, last_name, email, phone
- marketing_consent, created_at, deleted_at (if set)

**Booking history** (from bookings table, all statuses):
- id, booking_reference, booking_date, start_time, end_time
- status, total_price, deposit_paid, balance_due
- payment_method, special_requests, waiver_at (if column exists)
- service name (JOIN bookings_services)
- staff first_name + last_name (JOIN bookings_staff)

**Payment records** (from bookings_payments table if it exists,
otherwise from payment columns on bookings table — check the schema
before assuming):
- All payment transaction rows linked to this customer's bookings

**Audit log entries** — rows from bookings_audit_log where:
- object_type = 'customer' AND object_id = customer_id
- Include these fields: id, action, actor_id, created_at, context

### JSON format

Return a single JSON file structured as:

```json
{
  "export_date": "2026-03-08",
  "customer": { ...personal details... },
  "bookings": [ ...booking history... ],
  "payments": [ ...payment records... ],
  "audit_log": [ ...audit entries... ]
}
```

File name: `customer-{id}-data-export-{YYYY-MM-DD}.json`

### CSV format

Return a zip file containing these separate CSV files:
- `personal-details.csv` — one row of personal info with headers
- `bookings.csv` — one row per booking with headers
- `payments.csv` — one row per payment with headers
- `audit-log.csv` — one row per audit entry with headers

Zip file name: `customer-{id}-data-export-{YYYY-MM-DD}.zip`

### File download pattern

Use the `rest_pre_serve_request` filter to serve the file directly,
bypassing WordPress REST JSON encoding. Read how the existing
`export_customers_csv()` method does this in class-customers-api.php
and follow the exact same pattern. Do not invent a new approach.

### Audit logging

Before serving the file, log the export action:

```php
Bookit_Audit_Logger::log( array(
    'actor_id'    => $current_staff['id'],
    'action'      => 'customer_data_exported',
    'object_type' => 'customer',
    'object_id'   => $customer_id,
) );
```

Read the actual log() signature in class-bookit-audit-logger.php
and match it exactly — do not guess the parameter names.

### Error handling

- Customer not found → 404 with registered error code
- Invalid format → 400 (handled by enum validation above)
- Register any new error codes in Bookit_Error_Registry

---

## FRONTEND — Export button

1. Find the single customer detail view or modal component (read
   the files — do not guess where it is).

2. Add an "Export Customer Data" section with two buttons:
   - "Export as JSON"
   - "Export as CSV"

3. Trigger the download by constructing the URL and navigating
   to it directly — do NOT use the useApi composable for this.
   File downloads must be triggered via direct URL navigation or
   an anchor tag, not via axios. Follow the same pattern used
   for the existing customer list CSV export in the frontend.

   The URL pattern is:
   ```
   {apiBase}/customers/{id}/export?format=json
   {apiBase}/customers/{id}/export?format=csv
   ```

   Where apiBase = window.BOOKIT_DASHBOARD.apiBase
   (which equals .../wp-json/bookit/v1/dashboard)

4. The export buttons should only be visible to admin role users.
   Use the same role check pattern already in the component.

5. No confirmation dialog needed — downloads are non-destructive.

6. Use existing Tailwind utility classes and button styles already
   used in the component. Do not add new CSS.

---

## PHPUNIT TESTS

Create: `bookit-booking-system/tests/test-customer-data-export.php`

Extend the same base test class used by other API tests. Read an
existing test file to confirm the base class and setUp pattern.

Required test cases:

1. `test_json_export_returns_file_download`
   — admin requests JSON export; assert response has
   Content-Disposition: attachment header and content is
   valid JSON

2. `test_json_export_structure`
   — create customer with 2 bookings; export as JSON; decode
   and assert top-level keys: customer, bookings, payments,
   audit_log, export_date all present

3. `test_json_export_customer_fields`
   — assert customer object contains: id, first_name, last_name,
   email, phone, marketing_consent, created_at

4. `test_json_export_bookings_count`
   — create customer with 3 bookings of mixed statuses; export;
   assert bookings array has 3 entries (all statuses included)

5. `test_csv_export_returns_zip`
   — admin requests CSV export; assert Content-Type is
   application/zip and Content-Disposition contains .zip filename

6. `test_no_cross_customer_data`
   — create two customers each with 2 bookings; export customer 1;
   decode response; assert none of customer 2's booking IDs appear
   anywhere in the export data

7. `test_export_creates_audit_log_entry`
   — trigger export; query bookings_audit_log; assert one row with
   action = 'customer_data_exported' and object_id = customer_id

8. `test_staff_permission_denied`
   — authenticate as bookit_staff; request export; expect 403

9. `test_customer_not_found_returns_404`
   — request export for customer ID 99999; expect 404

10. `test_existing_bulk_export_still_works`
    — call GET /dashboard/customers/export (the existing bulk CSV
    endpoint); assert it still returns 200 with CSV content;
    confirm the new per-customer endpoint has not broken it

---

## ACCEPTANCE CRITERIA

### Backend
- [ ] GET /dashboard/customers/{id}/export?format=json triggers
      JSON file download with correct filename
- [ ] GET /dashboard/customers/{id}/export?format=csv triggers
      zip download containing 4 CSV files
- [ ] Export contains personal details, all bookings (all statuses),
      payments, and audit log entries
- [ ] No other customer's data appears in any export
- [ ] Audit log entry created on every export
- [ ] Staff role returns 403; unauthenticated returns 401
- [ ] Existing bulk customer CSV export still works

### Frontend
- [ ] "Export as JSON" and "Export as CSV" buttons visible on
      customer detail view (admin only)
- [ ] Clicking either button triggers the correct file download
- [ ] Buttons not visible for bookit_staff role

### Tests
- [ ] All 10 PHPUnit tests pass
- [ ] No existing tests broken
- [ ] PHPUnit count increases from 561 baseline

### General
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Committed with message:
      "Sprint 4C.5, Task 2: GDPR customer data portability export"

---

## THINGS TO WATCH OUT FOR

- The existing export route is GET /dashboard/customers/export
  (no ID segment). Your new route is
  GET /dashboard/customers/{id}/export (with ID). WordPress route
  matching is regex-based — confirm there is no collision between
  these two patterns by checking the registration order. The more
  specific pattern (with ID) must not accidentally match the
  existing one.

- ZipArchive requires PHP's zip extension. Confirm it is available
  in the Local by Flywheel environment before using it. If not
  available, use PclZip (bundled with WordPress) as fallback.

- The rest_pre_serve_request pattern sets headers and echoes the
  file content directly, then returns true to prevent WP from
  sending its own response. Read the existing implementation
  carefully before writing yours.

- Do not include any data from soft-deleted bookings that belong
  to other customers — filter strictly by customer_id on every
  query.
```

---

When Task 2 is complete and committed, come back with the PHPUnit count and any decisions Cursor had to make that weren't covered above.