```
Sprint 4A Progress: 7/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
⏭️ Task 8:  Customer Database + GDPR (16h)  — NEXT
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 82 / 112
```

Let me read what I need before writing the prompt.Good — no existing customer API endpoints in `class-dashboard-bookings-api.php`, so all customer endpoints go in a new dedicated class. The `wp_bookings_customers` schema is clear. Let me write the prompt.

---

## Task 8 — Cursor Composer Prompt

```
You are implementing Task 8 of Sprint 4A for the Bookit Booking System WordPress plugin: Customer Database + GDPR.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/database/schema.sql` — wp_bookings_customers columns: id, email, first_name, last_name, phone, marketing_consent, marketing_consent_date, notes, created_at, updated_at, deleted_at. Also read wp_bookings and wp_bookings_payments columns.
- `bookit-booking-system/includes/class-bookit-loader.php` — add the new Customers API class here
- `bookit-booking-system/includes/api/class-reports-api.php` — copy the check_admin_permission pattern and the rest_pre_serve_request CSV export pattern exactly
- `bookit-booking-system/dashboard/src/views/Customers.vue` — replace the stub entirely
- `bookit-booking-system/dashboard/src/views/CustomerProfile.vue` — replace the stub entirely
- `bookit-booking-system/dashboard/src/views/Bookings.vue` — copy the pagination, search, filter, and loading/error state patterns for the customer list

### What already exists — do NOT duplicate:
- `check_admin_permission()` — copy the exact same implementation from class-reports-api.php into the new class
- `Customers.vue` and `CustomerProfile.vue` stubs — replace entirely
- Routes `/customers` and `/customers/:id` — already in router/index.js, no changes needed
- The CSV export must use the `rest_pre_serve_request` filter pattern from class-reports-api.php — do not use WP_REST_Response for CSV output

---

## PART A — NEW PHP CLASS: `Bookit_Customers_API`

### Create: `bookit-booking-system/includes/api/class-customers-api.php`

Class structure — copy the constructor/namespace/check_admin_permission pattern from class-reports-api.php exactly.

### Routes to register:

```
GET    /dashboard/customers
GET    /dashboard/customers/export
GET    /dashboard/customers/(?P<id>\d+)
PUT    /dashboard/customers/(?P<id>\d+)
DELETE /dashboard/customers/(?P<id>\d+)
```

### Method: `get_customers( $request )`

Args:
- `search`: optional string — search first_name, last_name, email, phone
- `status`: optional string — 'active' (booking in last 6 months), 'inactive' (no booking in 6 months), 'new' (only 1 booking ever)
- `page`: integer, default 1
- `per_page`: integer, default 25

Query:
```php
// Base query — exclude soft-deleted customers.
// For each customer, calculate:
//   total_bookings: COUNT of non-cancelled, non-deleted bookings
//   total_spent: SUM of completed payments
//   last_visit: MAX booking_date where status = 'completed'
//   upcoming_count: COUNT of confirmed/pending bookings with booking_date >= today

$base_query = "
    SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.marketing_consent,
        c.created_at,
        COUNT(DISTINCT CASE WHEN b.status != 'cancelled' AND b.deleted_at IS NULL THEN b.id END) AS total_bookings,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_spent,
        MAX(CASE WHEN b.status = 'completed' THEN b.booking_date END) AS last_visit,
        COUNT(DISTINCT CASE WHEN b.status IN ('confirmed','pending_payment') AND b.booking_date >= CURDATE() AND b.deleted_at IS NULL THEN b.id END) AS upcoming_count
    FROM {$wpdb->prefix}bookings_customers c
    LEFT JOIN {$wpdb->prefix}bookings b ON b.customer_id = c.id
    LEFT JOIN {$wpdb->prefix}bookings_payments p ON p.booking_id = b.id
    WHERE c.deleted_at IS NULL
";
```

Add search filter:
```php
if ( ! empty( $search ) ) {
    $like = '%' . $wpdb->esc_like( $search ) . '%';
    $where_clauses[] = "(c.first_name LIKE %s OR c.last_name LIKE %s OR c.email LIKE %s OR c.phone LIKE %s)";
    // Add 4 × $like to params
}
```

Add status filter:
```php
// 'active' = has a booking in last 6 months
// 'inactive' = no booking in last 6 months (or never)
// 'new' = exactly 1 total booking ever
// Apply as HAVING clauses after GROUP BY.
```

Query ends with:
```sql
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.marketing_consent, c.created_at
ORDER BY c.created_at DESC
```

Apply LIMIT/OFFSET for pagination.

For each customer, compute `status` field in PHP:
```php
// 'active' if last_visit within 6 months
// 'inactive' if last_visit > 6 months ago or null
// 'new' if total_bookings == 1
// Priority: new > active > inactive
```

Return:
```json
{
  "success": true,
  "customers": [...],
  "pagination": {
    "total": 47,
    "per_page": 25,
    "current_page": 1,
    "total_pages": 2
  }
}
```

Each customer object:
```json
{
  "id": 42,
  "first_name": "Sarah",
  "last_name": "Johnson",
  "full_name": "Sarah Johnson",
  "email": "sarah@example.com",
  "phone": "+44 7700 900123",
  "marketing_consent": true,
  "member_since": "2023-03-15",
  "total_bookings": 12,
  "total_spent": 420.00,
  "last_visit": "2024-01-12",
  "upcoming_count": 1,
  "status": "active"
}
```

### Method: `get_customer( $request )`

Get single customer with full detail.

Run the same aggregation query as `get_customers()` but for one `customer_id`.

Additionally fetch:
```php
// Booking history (most recent 20).
$bookings = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        b.id, b.booking_date, b.start_time, b.end_time, b.status,
        b.total_price, b.deposit_paid, b.balance_due, b.payment_method,
        s.name AS service_name,
        CONCAT(st.first_name, ' ', st.last_name) AS staff_name
     FROM {$wpdb->prefix}bookings b
     INNER JOIN {$wpdb->prefix}bookings_services s ON s.id = b.service_id
     INNER JOIN {$wpdb->prefix}bookings_staff st ON st.id = b.staff_id
     WHERE b.customer_id = %d AND b.deleted_at IS NULL
     ORDER BY b.booking_date DESC, b.start_time DESC
     LIMIT 20",
    $customer_id
), ARRAY_A );

// Payment history (most recent 10).
$payments = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        p.id, p.amount, p.payment_method, p.payment_type,
        p.payment_status, p.transaction_date, p.booking_id
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE b.customer_id = %d AND b.deleted_at IS NULL
     ORDER BY p.transaction_date DESC
     LIMIT 10",
    $customer_id
), ARRAY_A );
```

Return full customer object with `bookings` and `payments` arrays appended.

### Method: `update_customer( $request )`

Args (all optional):
- `first_name`: string, sanitize_text_field
- `last_name`: string, sanitize_text_field
- `phone`: string, sanitize_text_field
- `marketing_consent`: boolean
- `notes`: string, sanitize_textarea_field

Do NOT allow email to be updated via this endpoint (email changes are sensitive — out of scope for Phase 1).

Update `updated_at` = current_time('mysql').
If `marketing_consent` is being set to true, also set `marketing_consent_date` = current_time('mysql').
If `marketing_consent` is being set to false, set `marketing_consent_date` = NULL.

Return:
```json
{ "success": true, "message": "Customer updated successfully." }
```

### Method: `delete_customer( $request )`

This is the GDPR Right to Erasure (Article 17) implementation.

**Step 1 — Check for active upcoming bookings:**
```php
$upcoming = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE customer_id = %d
       AND status IN ('confirmed', 'pending_payment')
       AND booking_date >= CURDATE()
       AND deleted_at IS NULL",
    $customer_id
) );

if ( $upcoming > 0 ) {
    return new WP_Error(
        'has_upcoming_bookings',
        sprintf(
            __( 'Cannot delete customer with %d upcoming booking(s). Cancel them first.', 'bookit-booking-system' ),
            $upcoming
        ),
        array( 'status' => 409 )
    );
}
```

**Step 2 — Anonymise personal data (do NOT hard-delete):**
```php
// Anonymise customer record — satisfy GDPR Art. 17 while preserving booking records for HMRC 7-year retention.
$wpdb->update(
    $wpdb->prefix . 'bookings_customers',
    array(
        'first_name'               => 'Deleted',
        'last_name'                => 'Customer',
        'email'                    => 'deleted_' . $customer_id . '@deleted.invalid',
        'phone'                    => '',
        'marketing_consent'        => 0,
        'marketing_consent_date'   => null,
        'notes'                    => null,
        'deleted_at'               => current_time( 'mysql' ),
        'updated_at'               => current_time( 'mysql' ),
    ),
    array( 'id' => $customer_id ),
    array( '%s', '%s', '%s', '%s', '%d', null, null, '%s', '%s' ),
    array( '%d' )
);
```

Return:
```json
{
  "success": true,
  "message": "Customer data has been anonymised in compliance with GDPR Article 17."
}
```

### Method: `export_customers_csv( $request )`

Use the `rest_pre_serve_request` filter pattern exactly as implemented in `class-reports-api.php` `export_revenue_csv()`.

Query all non-deleted customers with aggregated stats (same query as get_customers but no pagination, no filters).

CSV columns:
```
Customer ID, First Name, Last Name, Email, Phone, Member Since, Total Bookings, Total Spent, Last Visit, Upcoming Bookings, Status, Marketing Consent
```

Format:
- Member Since: DD/MM/YYYY
- Last Visit: DD/MM/YYYY or "Never"
- Total Spent: X.XX (no £ symbol — Excel handles currency formatting)
- Marketing Consent: "Yes" / "No"
- Status: "Active" / "Inactive" / "New"

Filename: `customers-export-YYYY-MM-DD.csv` (today's date).

### Modify `class-bookit-loader.php`:

After the line that requires `class-reports-api.php`, add:
```php
// Customers API.
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-customers-api.php';
new Bookit_Customers_API();
```

---

## PART B — FRONTEND

### Replace `Customers.vue` — full customer list

**Layout:**
```
Header: "Customers" + subtitle "Manage your customer database"
Right side of header: "Export CSV" button

Search bar (full width): placeholder "Search by name, email or phone..."
  Debounce 400ms before triggering search

Filter row:
  - Status dropdown: All / Active / Inactive / New
  - Per page: 25 / 50 / 100

Customer table:
  Columns: Customer | Email | Phone | Bookings | Total Spent | Last Visit | Status | Actions
  
  Customer cell: initials avatar (coloured circle) + full name
  Status badge: green "Active", gray "Inactive", blue "New"
  Marketing consent: small envelope icon if opted in (no icon if opted out)
  Actions cell: "View" button → router.push('/customers/' + customer.id)
  
  Entire row clickable → /customers/:id
  
  Empty state: "No customers found matching your search."
  
Pagination: same pattern as Bookings.vue — prev/next + page numbers
Loading: skeleton rows
Error: ErrorState with retry
```

**Script logic:**
```js
// searchQuery ref with 400ms debounce watcher → calls loadCustomers(1)
// filters ref: { status: '', per_page: 25 }
// pagination ref: { total, per_page, current_page, total_pages }
// loadCustomers(page) — builds query params, calls GET /dashboard/customers
// exportCsv() — uses restBase pattern from RevenueReport.vue to trigger download
```

**Initials avatar helper:**
```js
function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase()
}
// Colour: deterministic from customer id — cycle through 6 Tailwind colours
const avatarColours = ['bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500','bg-rose-500','bg-teal-500']
function getAvatarColour(id) {
  return avatarColours[id % avatarColours.length]
}
```

### Replace `CustomerProfile.vue` — full customer detail

**Layout:**
```
Back button: "← Back to Customers"

Header:
  Large initials avatar + Full name + email + "Member since DD/MM/YYYY"
  Right side: "Edit" button (opens inline edit form) | "Delete" button

Edit form (shown inline when edit mode active, hidden otherwise):
  Fields: First Name, Last Name, Phone, Marketing Consent toggle, Notes textarea
  Save / Cancel buttons
  Warning above form: "Email address cannot be changed here."

Statistics row (6 stats):
  Total Bookings | Total Spent | Avg Booking Value | Last Visit | Upcoming | Cancellation Rate

Marketing Consent badge:
  ✅ "Marketing opted in" (green) or ❌ "Marketing opted out" (gray)

Tabs: [ Booking History | Payment History ]

  === Booking History tab ===
  List of bookings (most recent first):
    Each row: Date (DD/MM/YYYY) | Time | Service | Staff | Status badge | Amount
    Status badge colours: confirmed=blue, completed=green, cancelled=gray, no_show=amber, pending=yellow
    Empty state: "No booking history yet."

  === Payment History tab ===
  List of payments:
    Each row: Date | Amount (£X.XX) | Method | Type | Status badge
    Map payment_type: deposit→"Deposit", full_payment→"Full Payment"
    Map payment_method: same labels as RevenueReport.vue
    Empty state: "No payment records."

Delete confirmation modal:
  Triggered by "Delete" button
  Warning text: "This will permanently anonymise this customer's personal data in compliance with GDPR Article 17. Their booking records will be retained for 7 years as required by UK tax law. This cannot be undone."
  Two buttons: "Cancel" | "Delete Customer Data" (red)
  On confirm: call DELETE /dashboard/customers/:id
  On success: show success toast, navigate back to /customers
  On error (409 upcoming bookings): show red alert with the error message from API
```

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. All queries via `$wpdb->prepare()`. No raw interpolation.
- Vue: `<script setup>`, Tailwind only, no Options API.
- All PHP strings: `__( '...', 'bookit-booking-system' )`
- CSV export: must use `rest_pre_serve_request` filter — never `WP_REST_Response` with string body.
- Do not modify any existing PHP class or Vue component other than the files listed.

---

## DELIVERABLES SUMMARY

1. NEW FILE: `bookit-booking-system/includes/api/class-customers-api.php`
   - 5 methods: `get_customers`, `get_customer`, `update_customer`, `delete_customer`, `export_customers_csv`
   - 5 routes registered
2. MODIFIED: `bookit-booking-system/includes/class-bookit-loader.php` — require and instantiate Customers API
3. MODIFIED: `bookit-booking-system/dashboard/src/views/Customers.vue` — full implementation
4. MODIFIED: `bookit-booking-system/dashboard/src/views/CustomerProfile.vue` — full implementation
```

---

## ✅ Task 8 Testing Checklist

**Customer list:**
- [ ] `/customers` loads without errors
- [ ] All customers from your test bookings appear
- [ ] Search by name, email, phone all work (debounced)
- [ ] Status filter: Active / Inactive / New each filter correctly
- [ ] Per-page selector works (25/50/100)
- [ ] Pagination shows correct page count
- [ ] Clicking a row navigates to `/customers/:id`
- [ ] Export CSV button downloads a file with correct columns

**Customer profile:**
- [ ] Back button returns to `/customers`
- [ ] Header shows name, email, member since
- [ ] 6 stats show correct values
- [ ] Marketing consent badge correct

**Edit customer:**
- [ ] Edit button shows inline form
- [ ] Can update first name, last name, phone, marketing consent, notes
- [ ] Email field is NOT editable (absent from form)
- [ ] Save updates the displayed data
- [ ] Cancel hides the form without saving

**Booking history tab:**
- [ ] All bookings shown most recent first
- [ ] Correct status badge colours
- [ ] Date and time formatted correctly

**Payment history tab:**
- [ ] Payments shown with human-readable method and type labels

**GDPR deletion:**
- [ ] Delete button shows confirmation modal with GDPR warning text
- [ ] Attempting to delete a customer with upcoming bookings shows error (409) with helpful message
- [ ] Deleting a customer with no upcoming bookings succeeds
- [ ] After deletion: redirected to `/customers`, customer no longer appears in list
- [ ] Check database directly: customer row has `deleted_at` set and name/email anonymised
- [ ] Booking records for the deleted customer still exist in `wp_bookings` (data retention preserved)

**API permissions:**
- [ ] All customer endpoints return 403 for staff users

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 8: Customer database, GDPR anonymisation, customer profile, CSV export"
```

Then report back and we'll move to Task 9 — PHPUnit Tests.