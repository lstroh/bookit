# SPRINT 4D IMPLEMENTATION PROMPT
## Bookit Booking System — Package Bookings (~80h)

**Sprint:** 4D
**Estimated hours:** ~80h
**PHPUnit baseline:** 571 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

Before generating any Cursor prompt, ensure the following are active
in this chat:

- **GitHub connector** — read live files from lstroh/bookit-imp (branch:
  Phase1) before designing any implementation. Never assume file contents.
- **Context7 connector** — resolve and query current docs for Vue 3,
  WordPress REST API, and PHPUnit before writing any library-specific code.
- **cursor-prompt-generator skill** — use this skill for every Cursor
  prompt generated in this sprint. It enforces the correct structure,
  infrastructure wiring, and quality checks.

---

## SPRINT GOAL

Implement package bookings — prepaid session bundles that customers
purchase once and redeem across multiple future bookings. The feature
is gated by an admin settings toggle (disabled by default) and is
deeply integrated with the existing payment step in the booking wizard.

**Key decisions already made (do not re-open these):**
- Packages are purchased via a new customer-facing wizard flow AND
  via admin dashboard on behalf of a customer
- Packages are redeemed at booking wizard Step 5 via a new
  "Use Package" option alongside Stripe/PayPal
- Package types are flexible — admin defines which services each
  package applies to (not tied to a single service)
- Pricing: admin sets either a fixed total price OR a discount rate
  applied to N × service price (both modes supported)
- Expiry: optional per package type — admin can enable/disable expiry
  and set the expiry duration in days
- Customer package balance shown in: customer profile page (dashboard),
  a new dedicated Packages section in the dashboard, and in the booking
  wizard at payment step
- Customer sees at payment step: sessions remaining + expiry date (if
  set) + redemption history

---

## ARCHITECTURAL CONSTRAINTS

Read these files via GitHub before planning any task:

1. `includes/class-bookit-migration-runner.php` — all new tables must
   go through this runner, not the activator
2. `includes/class-bookit-error-registry.php` + `includes/config/error-codes.php`
   — all new error codes registered here
3. `includes/class-bookit-audit-logger.php` — fire audit log on all
   significant package actions (purchase, redemption, cancellation,
   expiry)
4. `includes/api/class-dashboard-bookings-api.php` — optimistic locking
   pattern; any PATCH/PUT on a booking row must follow this pattern
5. `includes/api/class-customers-api.php` — REST controller pattern +
   rest_pre_serve_request for any file downloads
6. `dashboard/src/router/index.js` — add new Packages routes here
7. `dashboard/src/views/CustomerProfile.vue` — modify to add package
   balance section
8. `public/templates/booking-step-5-payment.php` — modify to add
   "Use Package" payment option
9. `database/migrations/` — check highest existing migration number
   to name new migrations correctly (sequential)
10. `dashboard/src/composables/` — follow existing composable patterns
    for any new usePackages.js composable
11. `includes/class-bookit-loader.php` — register new API classes here

**SPRINT AGENT DISCIPLINE RULES — READ BEFORE PLANNING:**
- Read every file you intend to modify via GitHub before writing
  any implementation guidance
- Extend existing infrastructure — do not duplicate
- Escalate scope or architecture decisions; never substitute silently
- Per-record processing for any bulk/batch operations (e.g. expiring
  multiple packages) — never a single mass SQL UPDATE
- Every Cursor prompt must include a READ FIRST section listing all
  files to read before writing code

---

## TASK BREAKDOWN

### TASK 1 OF 9: Database Migrations — Package Tables (~6h)

Create all new database tables required for the packages feature via
the Bookit_Migration_Runner.

**New tables required:**

`wp_bookings_package_types` — the package products admin creates:
- id, name, description, sessions_count (int), price_mode
  ENUM('fixed','discount'), fixed_price DECIMAL(10,2) NULL,
  discount_percentage DECIMAL(5,2) NULL, expiry_enabled TINYINT(1)
  DEFAULT 0, expiry_days INT NULL, applicable_service_ids LONGTEXT
  (JSON array of service IDs, NULL = all services), is_active
  TINYINT(1) DEFAULT 1, created_at, updated_at

`wp_bookings_customer_packages` — a customer's purchased instance of
a package type:
- id, customer_id (FK → wp_bookings_customers.id), package_type_id
  (FK → wp_bookings_package_types.id), sessions_total INT NOT NULL,
  sessions_remaining INT NOT NULL, purchase_price DECIMAL(10,2),
  purchased_at DATETIME, expires_at DATETIME NULL, status
  ENUM('active','exhausted','expired','cancelled') DEFAULT 'active',
  payment_method VARCHAR(50) NULL, payment_reference VARCHAR(255) NULL,
  notes TEXT NULL, created_at, updated_at

`wp_bookings_package_redemptions` — one row per session redeemed:
- id, customer_package_id (FK → wp_bookings_customer_packages.id),
  booking_id (FK → wp_bookings.id), redeemed_at DATETIME, redeemed_by
  BIGINT UNSIGNED (staff/admin user id), notes TEXT NULL, created_at

Also add `customer_package_id` column (BIGINT UNSIGNED NULL) to
`wp_bookings` table — links a booking to the package that paid for it.

**Infrastructure:**
- All tables via Bookit_Migration_Runner (check existing highest
  migration number in database/migrations/ and number sequentially)
- New error codes: E5001 PACKAGE_NOT_FOUND, E5002 PACKAGE_EXHAUSTED,
  E5003 PACKAGE_EXPIRED, E5004 PACKAGE_SERVICE_MISMATCH,
  E5005 PACKAGE_INSUFFICIENT_SESSIONS — register in error-codes.php
- Audit log events: package_purchased, package_session_redeemed,
  package_cancelled, package_expired — wire up in relevant API classes
  in later tasks

**PHPUnit:** Migration runs cleanly, tables exist with correct columns
and indexes, rollback drops all new tables and columns cleanly.

---

### TASK 2 OF 9: Package Types API — CRUD (~8h)

REST endpoints for admin to manage package type definitions.

**Endpoints (all under `/dashboard/packages/` prefix):**
- `GET  /wp-json/bookit/v1/dashboard/packages/types` — list all package
  types (active + inactive), admin only
- `POST /wp-json/bookit/v1/dashboard/packages/types` — create package
  type, admin only
- `GET  /wp-json/bookit/v1/dashboard/packages/types/{id}` — get single
- `PATCH /wp-json/bookit/v1/dashboard/packages/types/{id}` — update
- `DELETE /wp-json/bookit/v1/dashboard/packages/types/{id}` — soft
  delete (set is_active = 0), admin only

**Validation rules:**
- sessions_count: integer ≥ 1, required
- price_mode: must be 'fixed' or 'discount'
- If price_mode = 'fixed': fixed_price required, > 0
- If price_mode = 'discount': discount_percentage required, 0–100
- If expiry_enabled = 1: expiry_days required, ≥ 1
- applicable_service_ids: if provided, each ID must exist in
  wp_bookings_services; if null/empty → applies to all services
- Cannot delete a package type that has active customer packages
  (return E5001 with explanation)

**Note:** Use Context7 to verify current WordPress REST API
register_rest_route() parameter schema before implementing.

**File:** `includes/api/class-packages-api.php` (CREATE)
Register in `includes/class-bookit-loader.php` (MODIFY)

**PHPUnit:** Full CRUD cycle, validation errors, auth checks (staff
blocked), soft delete constraint.

---

### TASK 3 OF 9: Customer Packages API — Purchase & Management (~8h)

REST endpoints to purchase, list, and manage customer package instances.

**Endpoints:**
- `GET  /wp-json/bookit/v1/dashboard/packages/customers/{customer_id}`
  — list all packages for a customer (all statuses), admin only
- `POST /wp-json/bookit/v1/dashboard/packages/customers/{customer_id}`
  — admin purchases a package on behalf of a customer (dashboard flow)
- `PATCH /wp-json/bookit/v1/dashboard/packages/customers/{package_id}/cancel`
  — cancel an active customer package; sets status = 'cancelled',
  audit log entry, admin only
- `GET  /wp-json/bookit/v1/dashboard/packages` — paginated list of ALL
  customer packages across all customers (for Packages section), admin only

**Purchase logic for admin dashboard flow:**
- Validate package_type_id exists and is active
- Validate customer_id exists and is not deleted
- Create wp_bookings_customer_packages row:
  - sessions_total = package_type.sessions_count
  - sessions_remaining = package_type.sessions_count
  - purchase_price = calculated from price_mode (see Task 1 design)
  - purchased_at = now()
  - expires_at = if expiry_enabled: now() + expiry_days, else NULL
  - status = 'active'
  - payment_method = 'dashboard_manual' (admin assigned, no payment)
  - payment_reference = NULL
- Fire audit log: package_purchased
- Fire extension hook: do_action('bookit_after_package_purchased',
  $customer_package_id, $customer_id, $package_type_id)

**Pricing calculation helper (PHP):**
- fixed: purchase_price = package_type.fixed_price
- discount: purchase_price = sum of service prices × sessions_count
  × (1 - discount_percentage / 100). NOTE: if package applies to
  multiple services, use the LOWEST applicable service price for the
  discount calculation. Document this clearly in code comments.

**PHPUnit:** Purchase creates correct row, pricing both modes, expiry
calculation, cancel flow, list endpoints, auth checks.

---

### TASK 4 OF 9: Booking Wizard — Package Purchase Flow (~8h)

New customer-facing wizard flow for purchasing a package. This is a
separate entry point from the standard booking wizard (which books a
single session). Gated by packages_enabled setting.

**New public-facing page:**
- WordPress shortcode: `[bookit_buy_package]`
- URL pattern: `/buy-package/` (admin configures the page)
- New PHP file: `public/templates/package-purchase.php`
- New shortcode handler in `public/class-shortcodes.php` (MODIFY to
  add new shortcode)

**Wizard steps (3 steps, much simpler than booking wizard):**

Step 1 — Select package type:
- Show grid of active package types with: name, description, sessions
  count, price, applicable services, expiry info (if enabled)
- Step not shown if packages_enabled = 0 (redirect to homepage)

Step 2 — Contact details (if not already in session):
- First name, last name, email, phone
- Matches existing contact form pattern from booking-step-4.php
- Look up existing customer by email; pre-fill if found

Step 3 — Payment:
- Show package summary (what they're buying, total price)
- Payment options: Stripe card, PayPal (same as booking wizard)
- Pay on Arrival NOT available for package purchase (full upfront only)
- On Stripe: pass package_type_id in metadata, customer details
- On payment success: create customer_package row (via webhook handler
  in Task 5)

**Note:** Use Context7 to verify current Vite/Vue 3 patterns for any
new frontend components before implementing.

**Session storage:** Use Bookit_Session_Manager (read
`includes/core/class-session-manager.php` first) to store package
wizard steps, matching the booking wizard pattern.

**PHPUnit:** Shortcode renders, session management, customer lookup,
validation. NOTE: Stripe/PayPal payment execution not tested locally
(deferred to Sprint 5 live environment). Test the pre-payment flow
and session handling only.

---

### TASK 5 OF 9: Stripe Webhook — Package Purchase Handling (~4h)

Extend the existing Stripe webhook handler to handle package purchase
completions (in addition to booking completions it already handles).

**File:** `includes/api/class-stripe-webhook.php` (MODIFY)

**Read this file via GitHub before touching it.**

**Logic to add:**
- In `handle_checkout_completed()`, check metadata for presence of
  `package_type_id` key
- If present → this is a package purchase, not a booking
- Create wp_bookings_customer_packages row with status = 'active',
  payment_method = 'stripe', payment_reference = Stripe session ID
- Use idempotency key pattern already in this file to prevent duplicate
  processing
- Fire audit log: package_purchased
- Fire: do_action('bookit_after_package_purchased', $customer_package_id,
  $customer_id, $package_type_id)
- If metadata has `package_type_id` do NOT attempt to create a booking
  (mutually exclusive with booking creation path)

**Stripe metadata to pass from package purchase wizard (Task 4):**
- package_type_id, customer_email, customer_first_name,
  customer_last_name, customer_phone

**PHPUnit:** Mock Stripe event with package metadata creates correct
customer_package row; idempotency prevents double-creation; booking
creation path NOT triggered when package_type_id present.

---

### TASK 6 OF 9: Booking Wizard Step 5 — "Use Package" Option (~8h)

Modify the existing booking wizard payment step to show a "Use Package"
option when the customer has an active, applicable, non-expired package.

**Files to modify:**
- `public/templates/booking-step-5-payment.php` (MODIFY — read first)
- `includes/api/class-wizard-api.php` (MODIFY — read first, add
  package lookup endpoint)

**New REST endpoint:**
`GET /wp-json/bookit/v1/packages/available?email={email}&service_id={id}`
- Public endpoint (no dashboard auth required — wizard is public)
- Look up customer by email
- Return active, non-expired packages where:
  - applicable_service_ids is NULL (all services) OR service_id is
    in the applicable_service_ids JSON array
  - sessions_remaining > 0
  - status = 'active'
  - expires_at IS NULL OR expires_at > NOW()
- Response per package: package_type name, sessions_remaining,
  sessions_total, expires_at, last 5 redemptions (date + service name)

**Step 5 UI changes:**
- After existing payment option radio buttons, add conditional block:
  "Pay with Package" radio option — only shown if API returns ≥ 1
  available package
- When "Pay with Package" selected, show package selector:
  - Dropdown or card list of available packages
  - For each: name, X of Y sessions remaining, expiry date if set,
    last 5 redemptions table (date, service)
- "Book with Package" button replaces payment button
- On submit with package selected: POST to new redemption endpoint
  (Task 7) instead of Stripe/PayPal

**Note:** Use Context7 to verify current Vue 3 reactivity patterns
(ref, computed, watch) before implementing the conditional UI logic.

**After implementation, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored, must be
built manually in Local by Flywheel)

**PHPUnit:** Available packages endpoint — returns correct packages,
filters expired/exhausted/wrong-service correctly, empty result when
no packages match.

---

### TASK 7 OF 9: Package Redemption — Booking Creation (~8h)

New endpoint that creates a booking paid by a package session, and
decrements sessions_remaining atomically.

**New endpoint:**
`POST /wp-json/bookit/v1/packages/redeem`
Public endpoint (wizard submits this; uses nonce from
`window.bookitPublic.nonce`, same as other wizard endpoints)

**Request body:**
```json
{
  "customer_package_id": 123,
  "service_id": 5,
  "staff_id": 3,
  "booking_date": "2026-04-15",
  "booking_time": "10:00",
  "customer_email": "...",
  "customer_first_name": "...",
  "customer_last_name": "...",
  "customer_phone": "...",
  "special_requests": "...",
  "cooling_off_waiver": 0
}
```

**Redemption logic (must be atomic — use DB transaction):**
1. Lock the customer_package row with SELECT ... FOR UPDATE
2. Re-validate: status = 'active', sessions_remaining > 0,
   not expired, service_id is applicable
3. If validation fails → return appropriate E500x error
4. Create booking row (use existing Booking_System_Booking_Creator
   — read this class via GitHub first):
   - payment_method = 'package'
   - amount_paid = 0
   - customer_package_id = the package id
   - status = 'confirmed' (package bookings skip pending_payment)
5. Create wp_bookings_package_redemptions row
6. Decrement customer_package.sessions_remaining by 1
7. If sessions_remaining reaches 0: set status = 'exhausted'
8. Commit transaction
9. Fire: do_action('bookit_after_booking_created', $booking_id,
   $booking_data)
10. Fire: do_action('bookit_after_package_session_redeemed',
    $customer_package_id, $booking_id)
11. Fire audit log: package_session_redeemed
12. Return booking confirmation data (matching existing wizard
    confirmation response shape — read class-wizard-api.php first)

**PHPUnit:** Happy path creates booking + redemption + decrements
correctly; exhausted package blocked; expired package blocked;
wrong service blocked; race condition — two simultaneous requests
only one succeeds (test with sequential calls checking state).

---

### TASK 8 OF 9: Dashboard — Packages Section & Customer Profile (~10h)

Two Vue frontend areas: a new Packages management section in the
dashboard sidebar, and additions to the existing CustomerProfile view.

**Read before starting:**
- `dashboard/src/router/index.js` — to add new routes correctly
- `dashboard/src/views/CustomerProfile.vue` — to extend, not rewrite
- `dashboard/src/views/Customers.vue` — for list/table patterns to follow
- `dashboard/src/composables/` — to follow existing composable patterns

**8a — New Packages section (admin only):**

New route: `/packages` → new view `dashboard/src/views/Packages.vue`
Add to sidebar under a new "Packages" nav item (admin only, hidden
from bookit_staff role)

`Packages.vue` contains two tabs:

Tab 1 — "Package Types": CRUD for package type definitions
- Table: name, sessions, pricing, applicable services, expiry,
  status, actions (edit/deactivate)
- "Add Package Type" button → modal form (fields from Task 2 API)
- Edit inline or modal, deactivate toggle

Tab 2 — "Customer Packages": all purchased packages across all customers
- Table: customer name, package type, sessions remaining/total,
  purchase date, expires, status
- Filter by status (active/exhausted/expired/cancelled)
- Click row → expands redemption history inline
- "Assign Package" button → modal: select customer, select package
  type → calls Task 3 purchase endpoint

**8b — Customer Profile additions:**

In `CustomerProfile.vue`, add a new "Packages" section after the
existing bookings history section:
- List of all packages for this customer (all statuses)
- Per package: type name, sessions remaining/total, purchase date,
  expiry (if set), status badge, redemption history (collapsible)
- "Assign Package" button → same modal as Tab 2 above
- "Cancel Package" action on active packages → confirmation dialog →
  calls cancel endpoint (Task 3)

**Note:** Use Context7 to verify current Vue 3 composables (useRoute,
useRouter, ref, computed) and any relevant patterns before implementing.

**After implementation, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored, must be
built manually in Local by Flywheel)

**PHPUnit:** No PHP tests for Vue components. Manual testing checklist
instead (see Acceptance Criteria).

---

### TASK 9 OF 9: Settings, Cron Expiry & PHPUnit Coverage (~10h)

Three smaller items that complete the sprint.

**9a — Packages enabled setting (~2h):**

Add `packages_enabled` (boolean, default 0) to wp_bookings_settings
via a new migration (sequential number after Task 1 migrations).

Add toggle to the existing Settings view in the dashboard:
- Read `dashboard/src/views/Settings.vue` via GitHub first
- New "Package Bookings" section with enable/disable toggle
- When disabled: hide "Use Package" option from wizard Step 5,
  hide Packages nav item from sidebar, return 403 from all
  /dashboard/packages/ endpoints

Read `includes/api/class-settings-api.php` via GitHub — add
packages_enabled to the settings read/write endpoints following
the existing pattern.

**9b — Package expiry cron job (~3h):**

New WP cron job: `bookit_expire_packages`
- Schedule: daily (use wp_schedule_event on plugin activation,
  unschedule on deactivation — read class-bookit-loader.php first)
- Logic: find all customer_packages where status = 'active' AND
  expires_at IS NOT NULL AND expires_at < NOW()
- Process EACH package individually in a loop (never a single
  mass UPDATE):
  - Set status = 'expired'
  - Fire audit log: package_expired
  - Fire: do_action('bookit_after_package_expired',
    $customer_package_id, $customer_id)

**9c — PHPUnit coverage gap fill (~5h):**

Run the full test suite and identify any coverage gaps introduced
in Tasks 1–8 of this sprint. Write additional tests to close gaps.
Particular focus on:
- Redemption race condition handling (Task 7)
- Expiry cron processes correct packages (Task 9b)
- Package purchase pricing calculation both modes (Task 3)
- Settings toggle gates all relevant endpoints (Task 9a)
- Webhook handler correctly branches on package vs booking (Task 5)

**PHPUnit baseline:** 571 tests, 0 failures.
Target: all new functionality covered, suite must pass with 0 failures.

---

## INFRASTRUCTURE WIRING SUMMARY

All tasks must use the following Sprint 4B infrastructure. The sprint
agent must verify these are correctly wired in every Cursor prompt:

| Infrastructure | When to use |
|---|---|
| `Bookit_Migration_Runner` | Tasks 1, 9a — all new tables/columns |
| `Bookit_Error_Registry` | Task 1 — register E5001–E5005 |
| `Bookit_Audit_Logger` | Tasks 3, 5, 7, 9b — package events |
| Extension hooks (`do_action`) | Tasks 3, 5, 7, 9b — fire lifecycle hooks |
| Optimistic locking pattern | Any PATCH/PUT on bookings table |
| `/dashboard/` URL prefix | All dashboard REST endpoints |
| `rest_pre_serve_request` | Only if any file download added (N/A here) |

---

## SPRINT AGENT WORKFLOW

Follow this workflow for every task:

1. Read ALL files listed in the task's READ FIRST section via GitHub
2. Use Context7 to verify any external library APIs before implementing
3. Use cursor-prompt-generator skill to produce the Cursor prompt
4. After Liron confirms task complete, move to next task
5. Do not proceed to next task until Liron says "all good" or "all done"
6. If you encounter a scope or architecture decision not covered in this
   prompt, STOP and escalate — do not substitute or resolve independently

**One task at a time. Wait for confirmation before proceeding.**

---

## ACCEPTANCE CRITERIA — SPRINT LEVEL

**Functional:**
- [ ] Admin can create, edit, and deactivate package types
- [ ] Admin can assign a package to a customer from the dashboard
- [ ] Customer can purchase a package via the public wizard flow
  (pre-payment UI complete; Stripe execution tested in Sprint 5)
- [ ] "Use Package" option appears at booking wizard Step 5 when
  customer has an active, applicable, non-expired package
- [ ] Selecting "Use Package" shows sessions remaining, expiry,
  and last 5 redemptions
- [ ] Booking via package creates booking with payment_method =
  'package', decrements sessions_remaining atomically
- [ ] Exhausted package (0 sessions) cannot be used for redemption
- [ ] Expired package cannot be used for redemption
- [ ] Package used for wrong service type is rejected
- [ ] Customer profile shows all packages with redemption history
- [ ] Packages dashboard section shows all customer packages + CRUD
  for package types
- [ ] Daily cron expires packages correctly (per-record, not bulk)
- [ ] packages_enabled = 0 hides all package UI and blocks all
  package API endpoints

**Technical:**
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] All new tables created via Bookit_Migration_Runner
- [ ] All new error codes in Bookit_Error_Registry (E5001–E5005)
- [ ] Audit log entry on: purchase, redemption, cancellation, expiry
- [ ] Extension hooks fire on: purchase, redemption, expiry
- [ ] Redemption is atomic (DB transaction, no race conditions)
- [ ] All new dashboard endpoints under `/dashboard/` URL prefix
- [ ] bookit_staff role blocked from all package management endpoints
- [ ] PHPUnit suite passes (571+ tests, 0 failures)
- [ ] Frontend built (npm run build) after all Vue changes

**Must NOT break:**
- [ ] Existing booking wizard Steps 1–5 (single-session bookings)
- [ ] Existing Stripe webhook booking creation path
- [ ] Existing customer profile page (other sections)
- [ ] Existing bulk booking actions (Sprint 4C.5)
- [ ] Existing GDPR export (package data excluded from customer export
  — internal financial records, not customer-provided data)
- [ ] Existing settings endpoints

---

## GIT COMMIT CONVENTION

```
Sprint 4D, Task [N]: [description]

- [change 1]
- [change 2]
- [change 3]

Tests: [N] passing, 0 failures
```

Commit after each task is confirmed complete. Do not batch multiple
tasks into one commit.

---

## REFERENCE FILES (read via GitHub before relevant tasks)

| File | Relevant to |
|---|---|
| `includes/class-bookit-migration-runner.php` | Tasks 1, 9a |
| `includes/class-bookit-error-registry.php` | Task 1 |
| `includes/config/error-codes.php` | Task 1 |
| `includes/class-bookit-audit-logger.php` | Tasks 3, 5, 7, 9b |
| `includes/class-bookit-loader.php` | Tasks 2, 9b |
| `includes/api/class-dashboard-bookings-api.php` | Tasks 2, 3, 7 |
| `includes/api/class-customers-api.php` | Tasks 2, 3 |
| `includes/api/class-wizard-api.php` | Tasks 6, 7 |
| `includes/api/class-stripe-webhook.php` | Task 5 |
| `includes/api/class-settings-api.php` | Task 9a |
| `includes/core/class-session-manager.php` | Task 4 |
| `includes/payment/class-stripe-checkout.php` | Task 4 |
| `public/class-shortcodes.php` | Task 4 |
| `public/templates/booking-step-5-payment.php` | Task 6 |
| `database/migrations/` (all files) | Task 1 |
| `dashboard/src/router/index.js` | Task 8 |
| `dashboard/src/views/CustomerProfile.vue` | Task 8b |
| `dashboard/src/views/Customers.vue` | Task 8 |
| `dashboard/src/views/Settings.vue` | Task 9a |
| `dashboard/src/composables/` (all files) | Tasks 6, 8 |
| `dashboard/vite.config.js` | Tasks 4, 6, 8 |
