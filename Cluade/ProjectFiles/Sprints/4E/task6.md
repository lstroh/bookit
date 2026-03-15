Let me pull the key files before writing the Task 6 prompt.Good — the project knowledge confirms the key architectural facts I need: `base: './'` in Vite config is critical, Vue Router is used for client-side routing, Chart.js is the charting library. Now let me check the actual current router and reports API files.I have enough context. Task 6 involves reading several live files that I can't see in project knowledge (the actual vite.config.js, router/index.js, reports API, bookings API). This task requires Cursor to do significant read-first work. Let me now get Vue Router lazy loading docs via Context7 before writing the prompt.Good. I have everything I need. Now generating the Task 6 prompt.

---

## TASK 6 OF 8: Performance Optimisation (~10h)

```
TASK 6 OF 8: Performance Optimisation
Sprint: 4E | Est: 10h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back.

1. `dashboard/vite.config.js` — **CRITICAL: read this before touching any build config.** The `base: './'` setting is non-negotiable and must not be changed. Understand current chunk/build settings.
2. `dashboard/src/router/index.js` — read all route definitions; identify which use static imports vs lazy `() => import(...)` 
3. `dashboard/src/main.js` — understand how Chart.js and any heavy dependencies are imported globally vs locally
4. `includes/api/class-reports-api.php` — primary N+1 target; read all query methods
5. `includes/api/class-bookings-api.php` — bookings list query; check for N+1 on customer/service/staff names
6. `includes/api/class-customers-api.php` — customer list query; check for N+1
7. `includes/api/class-customer-packages-api.php` — customer packages list; check for package_type JOIN
8. `includes/api/class-package-redemption-history-api.php` — redemption history; check for booking details JOIN
9. `database/migrations/` — list all existing migration files; the next migration must use the correct sequential number
10. `includes/core/class-session-manager.php` — check whether wizard settings are cached or re-queried per step

---

## CONTEXT

This task hardens performance across three layers: PHP query optimisation (N+1 elimination), Vue bundle optimisation (lazy route loading + chunk size), and a new migration for any missing database indexes. No new user-facing features. All existing behaviour must be preserved exactly — this is refactoring only. Any Vue file changes require `npm run build` in `bookit-booking-system/dashboard/` after implementation.

**Critical constraint:** `base: './'` in `vite.config.js` must not be changed under any circumstances. This is the known gotcha that causes cascading chunk URL failures. Read the file, note the setting, leave it alone.

Note: Before implementing any Vue Router lazy loading changes, use Context7 to resolve 'Vue Router' and confirm the current `() => import(...)` dynamic import syntax for route-level code splitting.

---

## IMPLEMENTATION REQUIREMENTS

### 6a — Database Query Optimisation

#### `includes/api/class-reports-api.php` — MODIFY if N+1 found

Read the file fully. For each query method, check whether it:
- Fetches a list of rows and then queries per-row inside a loop (N+1)
- Uses PHP loops to aggregate data that could be done with SQL `GROUP BY`

**Fix pattern for N+1:** Replace the per-row query loop with a single query using `JOIN` or `GROUP BY`. Example:

```php
// BAD — N+1
$bookings = $wpdb->get_results("SELECT id, service_id FROM ...");
foreach ($bookings as $b) {
    $b->service_name = $wpdb->get_var("SELECT name FROM ... WHERE id = {$b->service_id}");
}

// GOOD — single JOIN
$bookings = $wpdb->get_results("
    SELECT b.id, s.name AS service_name
    FROM {$wpdb->prefix}bookings b
    LEFT JOIN {$wpdb->prefix}bookings_services s ON s.id = b.service_id
");
```

If no N+1 exists in this file, add a comment `// Performance audit: no N+1 queries found` and make no changes to the query logic.

#### `includes/api/class-bookings-api.php` — MODIFY if N+1 found

Check the bookings list endpoint. Verify that customer name, service name, staff name are fetched via JOIN not per-row queries. If they already use JOINs: add audit comment, no changes.

#### `includes/api/class-customers-api.php` — MODIFY if N+1 found

Check the customer list endpoint. Verify booking count and last visit date are aggregated via subquery or JOIN, not per-customer queries.

#### `includes/api/class-customer-packages-api.php` — MODIFY if N+1 found

Check the customer packages list. Verify `package_type` name is fetched via JOIN not per-row.

#### `includes/api/class-package-redemption-history-api.php` — MODIFY if N+1 found

Check redemption history. Verify booking details (date, service name, staff name) are fetched via JOIN not per-row.

#### `includes/core/class-session-manager.php` — MODIFY if re-querying per step

Check whether wizard settings (services, staff, opening hours) are loaded fresh from DB on every wizard step. If settings are individually `SELECT`-ed per key per request, consider whether they can be batch-loaded in one query. If already efficient: add audit comment, no changes.

---

### 6b — New Database Indexes via Migration

After reading `database/migrations/`, identify the next sequential migration number (it will be `0009` if the last is `0008`).

Create `database/migrations/0009-add-performance-indexes.php` using the existing migration file structure (read `0001-*.php` to understand the exact class pattern and `migration_id()` / `up()` / `down()` format).

**Add the following indexes in `up()`, each wrapped in a check so they are idempotent (only added if not already present):**

```sql
-- Bookings: composite index for the most common dashboard filter
-- (status + booking_date — used in list filtering and reports)
ALTER TABLE {prefix}bookings 
ADD INDEX IF NOT EXISTS idx_status_date (status, booking_date);

-- Bookings: composite index for staff schedule queries
-- (staff_id + booking_date + status — used in availability and team calendar)
ALTER TABLE {prefix}bookings 
ADD INDEX IF NOT EXISTS idx_staff_date_status (staff_id, booking_date, status);

-- Customer packages: composite index for expiry cron
-- (status + expires_at — used by Bookit_Package_Expiry::run_cleanup())
ALTER TABLE {prefix}bookings_customer_packages 
ADD INDEX IF NOT EXISTS idx_status_expires (status, expires_at);
```

**Important:** MySQL 5.7 does not support `IF NOT EXISTS` on `ALTER TABLE ADD INDEX`. Use a PHP check instead:

```php
// Check if index already exists before adding
$index_exists = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM information_schema.statistics 
     WHERE table_schema = DATABASE() 
     AND table_name = %s 
     AND index_name = %s",
    $wpdb->prefix . 'bookings',
    'idx_status_date'
) );
if ( ! $index_exists ) {
    $wpdb->query( "ALTER TABLE {$wpdb->prefix}bookings ADD INDEX idx_status_date (status, booking_date)" );
}
```

Apply this pattern for each index. `down()` must drop all three indexes using `ALTER TABLE ... DROP INDEX IF EXISTS` (or the same PHP existence-check pattern in reverse).

Register the migration in `includes/functions-migration.php` following the exact same pattern as existing migration registrations.

---

### 6c — Vue Bundle Optimisation

**Read `dashboard/src/router/index.js` first.**

#### Lazy route loading

Every route `component` must use dynamic import syntax:
```js
// CORRECT — lazy loaded
{ path: '/packages', component: () => import('../views/Packages.vue') }

// INCORRECT — static import (loaded on initial bundle)
import Packages from '../views/Packages.vue'
{ path: '/packages', component: Packages }
```

For any route that uses a static import: convert to `() => import(...)` lazy syntax. Do not change route paths, names, meta, or guards — only the `component` value.

Note: Before implementing, use Context7 to resolve 'Vue Router' and confirm the current dynamic import syntax for lazy loading.

#### Chart.js import

Read `dashboard/src/main.js` and any views that use Chart.js. If Chart.js is imported globally in `main.js` (e.g. `import Chart from 'chart.js'`), move the import to only the specific view(s) that use it. If it is already imported locally in individual views only, add a comment confirming this and make no changes.

#### Vite config — DO NOT TOUCH `base: './'`

Read `dashboard/vite.config.js`. The `base: './'` setting is critical — changing it causes all chunk URLs to break. Do not modify it. If you see any other obvious optimisation opportunities in the config (e.g. missing `build.rollupOptions.output.manualChunks` for vendor splitting), you may propose them in a comment to the code review but **do not implement them** without explicit approval — the Vite config is the highest-risk file in the frontend.

**After any Vue/JS file changes, run:**
```
npm run build
(in bookit-booking-system/dashboard/)
```
The `dist/` directory is gitignored — the build must be run manually in Local by Flywheel after Cursor completes its changes.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] New migration `0009-add-performance-indexes.php` created and registered in `functions-migration.php`
- [ ] Migration follows existing migration class pattern exactly
- [ ] No new error codes required
- [ ] No audit log events required (performance changes only)

---

## PHPUNIT REQUIREMENTS

**Baseline: 703 tests, 0 failures — must not regress.**

No new test file needed for pure performance changes. However: after any query refactoring, run the full PHPUnit suite to confirm all existing tests still pass — the query changes must not alter response shapes.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 703 tests must continue to pass.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] No N+1 queries in bookings list, customer packages list, or reports endpoints (verified by reading fixed query methods)
- [ ] All Vue Router routes use `() => import(...)` lazy syntax — no static component imports in the router
- [ ] Chart.js is not imported globally in `main.js` unless it is used on every page
- [ ] Three new DB indexes added via migration `0009`
- [ ] Migration is idempotent — running it twice does not error or duplicate indexes
- [ ] `down()` correctly drops the indexes

### Technical
- [ ] `base: './'` in `vite.config.js` is unchanged
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors after `npm run build`
- [ ] PHPUnit suite passes (703 tests, 0 failures)

### Must NOT break
- [ ] Bookings list endpoint — same response shape, all fields present
- [ ] Reports endpoints — same data, correct aggregations
- [ ] Customer packages list — package_type name present
- [ ] Dashboard login and navigation
- [ ] Booking wizard all 5 steps
- [ ] Package redemption flow

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 6: Performance optimisation

- Eliminated N+1 queries in [list affected files or "none found"]
- Added migration 0009: composite indexes on bookings and customer_packages
- Converted all Vue Router routes to lazy () => import() syntax
- [Chart.js: moved to local imports / already local — no change]

Tests: 703 passing, 0 failures
```
*(Fill in the actual findings before committing.)*

---

If you encounter an architecture decision not covered above, or if `base: './'` in `vite.config.js` is missing or different from expected, **STOP and report back before writing any code.**