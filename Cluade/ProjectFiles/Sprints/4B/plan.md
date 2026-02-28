Good answers — let me address your question about extensions displaying data in the dashboard, then clarify my backfill question, then generate the prompt.

---

**On your extension dashboard question:**

Yes, absolutely — and this is actually already decided in progress.md (Decision 2, "Option 3 — separate dashboard pages"). The confirmed architecture is:

- Each extension ships its own standalone Vue pages, mounted at new dashboard routes (e.g. `/bookit-dashboard/app/recurring`, `/bookit-dashboard/app/classes`)
- The core sidebar links to these pages **when the extension is active** (the registry makes this possible — core checks the registry and conditionally renders sidebar items)
- The extension can read/write core data via the existing REST API endpoints, and can register its own additional REST endpoints

So for your group classes example: Bookit Classes would have its own dashboard page showing class schedules, attendee lists, etc. It could also hook into the core bookings list view via a filter to display class bookings inline — but that's a design decision for when you build that extension.

**The key thing Sprint 4B needs to deliver for this:** the sidebar needs to support extension-injected nav items. So Task 1 should include a `bookit_register_nav_item()` function (or similar) that extensions call, and the Vue sidebar reads these at runtime from an API endpoint.

---

**On the backfill question:**

When the migration runs to add the `booking_reference` column, your existing bookings will have `NULL` in that column. I was asking whether the migration should also populate references for those existing rows, or leave them null. 

The answer is almost certainly **yes, backfill them** — otherwise your bookings list will show empty reference fields for old bookings, which looks broken. I'll include that in the migration task. You don't need to decide anything here, I just wanted to confirm the intent.

---

Now generating the prompt:

---

# Sprint_4B_Implementation_Prompt

```
# SPRINT 4B IMPLEMENTATION PROMPT
## Bookit Booking System — Polish & Infrastructure

**Sprint:** 4B  
**Estimated Hours:** 54h  
**Environment:** Local (Local by Flywheel + wp-env for PHPUnit)  
**Repository:** lstroh/bookit-imp, branch: Phase1  
**Plugin root:** bookit-booking-system/

---

## YOUR ROLE

You are the Sprint Implementation Assistant for Sprint 4B of the Bookit Booking System project. Your responsibilities are:

- Break each task down into Cursor-ready implementation prompts
- Provide a testing checklist for each task
- Answer implementation questions within the agreed scope
- Track task completion
- Escalate any scope or architecture questions to the Project Assistant (main chat)

**You do NOT:**
- Make architecture decisions — escalate these
- Change sprint scope — escalate these
- Write implementation code directly in this chat — generate Cursor prompts instead

---

## BEFORE YOU BEGIN

**Read the following project knowledge files before writing any Cursor prompts. This is mandatory — do not guess at existing implementations.**

Priority reads:
1. `progress.md` — current state, all decisions to date
2. `Development_Sequence_Plan.md` — sprint context and sequence
3. `System_Architecture_Document_PART1_Sections_1-8.md` — plugin architecture, hook strategy (§4.4), directory structure (§4.1), activation hooks (§4.5)
4. `System_Architecture_Document_PART2_Sections_9-19.md` — error handling & logging (§16), database architecture (§5)
5. `Future_Features_Backlog.md` — extension plugin decisions and strategy

Then read the following code files from the repository to understand what's already built:

- `bookit-booking-system/includes/class-bookit-loader.php` — existing hook registration, dashboard routing
- `bookit-booking-system/includes/class-bookit-activator.php` — existing migration pattern (already has one migration running inline)
- `bookit-booking-system/includes/class-bookit-logger.php` — existing logging infrastructure
- `bookit-booking-system/api/` — all existing REST API endpoints (understand the pattern before adding new ones)
- `bookit-booking-system/dashboard/app/` — Vue app structure, router, sidebar component
- `bookit-booking-system/database/migrations/` — existing migration file(s) to understand the current pattern

Do not proceed to writing Cursor prompts until you have read these files.

---

## SPRINT CONTEXT

Sprint 4A (Staff Dashboard + Reports) is complete — 10/10 tasks, ~115h, 444 PHPUnit tests passing.

Sprint 4B is the infrastructure sprint. Its most critical deliverable is the **Extension Hook System**, which unblocks three separate extension plugins (Bookit Recurring, Bookit Classes, Bookit Forms) that will be built in parallel after this sprint. Every other item in this sprint is important but self-contained.

All work is fully local. No live site required.

---

## ARCHITECTURAL DECISIONS ALREADY MADE

These are confirmed — do not re-open them:

**Extension registration:** Registry-based (Option B). Extensions call `bookit_register_extension()`. Core maintains a registry, displays active extensions in the dashboard, performs version compatibility checks.

**Extension dashboard pages:** Option 3 (separate standalone Vue pages). Each extension mounts at its own dashboard route (e.g. `/bookit-dashboard/app/recurring`). Core sidebar links to extension pages when the extension is active. The sidebar must support extension-injected nav items — implement `bookit_register_nav_item()` (or equivalent) so extensions can add their own sidebar entries, and the Vue sidebar reads these at runtime from an API endpoint.

**Audit log visibility:** Admin-only (`bookit_admin` role). Not visible to `bookit_staff`.

**Migration framework:** Include rollback support (extensions need to remove their tables on deactivate). Keep it pragmatic — numbered migrations, up/down methods, migrations table to track state.

**Branding scope:** Dashboard only for now. Does not apply to the public-facing booking widget (shortcode) in this sprint.

**Booking reference backfill:** The migration that adds the `booking_reference` column must also backfill all existing rows with generated references (no NULLs in the bookings list).

---

## TASK LIST

### Task 1: Extension Hook System — PHP Core Hooks (8h)

**Goal:** Add `do_action()` and `apply_filters()` calls to core PHP at all key extension points, plus implement the extension registration and nav item registration mechanisms.

**Deliverables:**

1. **`bookit_register_extension( array $args )`** function — extensions call this on `plugins_loaded`. Args: `name`, `slug`, `version`, `requires_core`, `description`, optional `author`. Stores in a static registry. Returns `WP_Error` if core version incompatible.

2. **`bookit_register_nav_item( array $args )`** function — extensions call this to inject sidebar items. Args: `label`, `route` (the Vue route path), `icon`, `position` (integer for ordering), `capability` (default `bookit_manage_all`). Core sidebar reads these via a REST endpoint.

3. **REST endpoint:** `GET /wp-json/bookit/v1/extensions` — returns active registered extensions and their nav items. Used by the Vue sidebar to conditionally render extension links.

4. **Action hooks — add `do_action()` calls at these points in existing code:**
   - `bookit_before_booking_created( $booking_data )` — before DB insert in booking controller
   - `bookit_after_booking_created( $booking_id, $booking_data )` — after successful insert
   - `bookit_before_booking_updated( $booking_id, $old_data, $new_data )` — before update
   - `bookit_after_booking_updated( $booking_id, $booking_data )` — after update
   - `bookit_before_booking_cancelled( $booking_id, $booking_data )` — before cancel
   - `bookit_after_booking_cancelled( $booking_id, $booking_data )` — after cancel
   - `bookit_after_payment_completed( $booking_id, $payment_data )` — after payment confirmed
   - `bookit_after_customer_created( $customer_id, $customer_data )` — after new customer insert
   - `bookit_dashboard_loaded( $current_user )` — when dashboard app page loads

5. **Filter hooks — add `apply_filters()` calls at these points:**
   - `bookit_available_slots( $slots, $staff_id, $date, $service_id )` — extensions can modify slot availability (e.g. Bookit Classes removes slots when a class is full)
   - `bookit_booking_data_before_insert( $booking_data )` — extensions can add custom fields before DB insert
   - `bookit_booking_response( $response_data, $booking_id )` — extensions can append data to booking API responses
   - `bookit_sidebar_nav_items( $nav_items )` — filter the full nav item array before sending to Vue (alternative/complement to `bookit_register_nav_item`)
   - `bookit_dashboard_js_data( $js_data )` — filter the `window.bookitDashboard` JS object passed to Vue app on load

6. **"Active Extensions" section** in the dashboard Settings area — simple read-only list showing registered extensions, their version, and compatibility status.

**File locations to modify:** Find and read existing booking controller, availability controller, payment controller, customer creation logic before writing any prompts. Hook placements must be in the right methods.

**Testing checklist:**
- [ ] `bookit_register_extension()` returns `WP_Error` when `requires_core` version exceeds current plugin version
- [ ] `bookit_register_extension()` stores valid extensions in registry
- [ ] `GET /wp-json/bookit/v1/extensions` returns empty array when no extensions registered
- [ ] `bookit_register_nav_item()` entries appear in extensions endpoint response
- [ ] `bookit_after_booking_created` fires when a booking is created (verify with a test `add_action()`)
- [ ] `bookit_available_slots` filter is applied and its return value is used
- [ ] Vue sidebar renders extension nav items when present in API response
- [ ] Vue sidebar renders no extension section when API returns empty
- [ ] Settings page shows "Active Extensions" section (empty state and populated state)

---

### Task 2: Extension Plugin API Spec Document (6h)

**Goal:** Produce `Extension_Plugin_API_Spec.md` — the definitive reference document for building Bookit extension plugins. This will be added to each extension project's knowledge base as its first document.

**This is a documentation task. No Cursor code prompt needed — write the document directly in this chat, then instruct Liron to save it as a project knowledge file in the core Bookit project and in each extension project when created.**

**Document must cover:**

1. **Overview** — what an extension plugin is, the Option 3 architecture (separate Vue pages, own dashboard routes), what extensions can and cannot do

2. **Plugin structure** — recommended directory layout for an extension plugin, `composer.json`, main plugin file header requirements

3. **Registration** — how to call `bookit_register_extension()`, required vs optional args, version compatibility, what happens if requirements aren't met

4. **All action hooks** — every hook from Task 1 with: hook name, parameters with types, when it fires, example usage

5. **All filter hooks** — every filter from Task 1 with: filter name, value being filtered, additional parameters, expected return type, example usage

6. **Adding dashboard pages** — how to call `bookit_register_nav_item()`, how to register Vue app assets (JS/CSS), the mounting contract (what `window.bookitExtension` or similar data is available), how dashboard routing works

7. **Adding REST endpoints** — convention for endpoint namespacing (`bookit-[extension-slug]/v1/`), how to access core data (read the core REST endpoints), authentication (extensions use the same session auth)

8. **Adding database migrations** — how to use the core `Bookit_Migration_Runner` from an extension, file naming convention, `up()` and `down()` requirements

9. **Accessing core data** — which core PHP classes are safe to instantiate directly, which data should go via REST API only

10. **Worked example: Bookit Hello World** — a complete minimal extension plugin (PHP stub file only, no Vue) that: registers itself, adds a sidebar nav item pointing to a placeholder route, adds one action hook listener (logs to Bookit logger on booking created), adds one database migration. This is the stub Liron will copy when starting each extension project.

11. **Versioning and compatibility** — how core version increments work, how extensions should declare compatibility ranges

**Testing checklist:**
- [ ] Document reviewed for completeness — all Task 1 hooks documented
- [ ] Hello World stub is syntactically valid PHP
- [ ] Hello World stub registers without errors when activated in local environment
- [ ] Document saved as `Extension_Plugin_API_Spec.md` in project knowledge

---

### Task 3: White-Label Branding System (8h)

**Goal:** Allow the business owner to set their logo, primary colour, business name, and "Powered by Bookit" toggle. These settings apply to the dashboard UI only (not the public booking widget in this sprint).

**Deliverables:**

1. **Settings storage** — new settings keys in `wp_bookings_settings`: `branding_logo_url`, `branding_primary_colour` (hex), `branding_business_name`, `branding_powered_by_visible` (boolean). Use existing settings model/API pattern.

2. **Branding Settings page** — new tab or section in the dashboard Settings area:
   - Logo upload (WordPress media library picker, stores URL)
   - Business name text field
   - Primary colour picker (HTML `<input type="color">` is fine for Phase 1)
   - "Show Powered by Bookit" toggle
   - Save button with success/error feedback

3. **Runtime application in Vue:**
   - On dashboard load, `window.bookitDashboard` includes branding settings (add to the `bookit_dashboard_js_data` filter from Task 1, or include in existing JS data object — check how it's currently done)
   - Vue app applies `--bookit-primary` CSS custom property to the root element using the stored colour
   - Dashboard header logo replaced with custom logo when set
   - Business name shown in dashboard header/title when set
   - "Powered by Bookit" footer text shown/hidden based on toggle

4. **REST endpoint:** `GET /wp-json/bookit/v1/settings/branding` (or integrate with existing settings endpoint — check current pattern first). `POST` to update.

**Read existing settings API and Vue settings page before writing prompts — follow the exact same pattern already established.**

**Testing checklist:**
- [ ] Logo URL saved and persists on page reload
- [ ] Business name saved and displayed in dashboard header
- [ ] Primary colour saved, CSS variable applied, a coloured UI element reflects the change
- [ ] "Powered by Bookit" toggle shows/hides footer text
- [ ] Settings survive dashboard navigation (not just page load)
- [ ] Branding section visible only to `bookit_admin` role
- [ ] Public booking widget unchanged (branding not applied there)

---

### Task 4: Audit Logging System (8h)

**Goal:** Comprehensive, tamper-evident audit trail for all significant actions. Admin-only visibility.

**Deliverables:**

1. **Database table `wp_bookings_audit_log`:**
   ```
   id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   actor_id        BIGINT UNSIGNED NOT NULL          -- WP user ID or 0 for system/cron
   actor_type      ENUM('admin','staff','customer','system') NOT NULL
   actor_ip        VARCHAR(45) NULL                  -- IPv4 or IPv6
   action          VARCHAR(100) NOT NULL             -- e.g. 'booking.created', 'booking.cancelled'
   object_type     VARCHAR(50) NOT NULL              -- e.g. 'booking', 'customer', 'setting'
   object_id       BIGINT UNSIGNED NULL
   old_value       LONGTEXT NULL                     -- JSON
   new_value       LONGTEXT NULL                     -- JSON
   notes           TEXT NULL                         -- human-readable summary
   created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   INDEX (actor_id)
   INDEX (action)
   INDEX (object_type, object_id)
   INDEX (created_at)
   ```
   Created via the new migration framework (Task 5 — coordinate sequencing).

2. **`Bookit_Audit_Logger` class** (`includes/class-bookit-audit-logger.php`):
   - `static log( string $action, string $object_type, int $object_id, array $context = [] )` — main method
   - Auto-detects actor from session (dashboard user) or WP current user
   - Auto-captures IP address
   - Never throws — silently fails if DB unavailable (log to error log instead)
   - Sensitive field redaction: never log payment card data, passwords, API keys

3. **Wire up to these events (add calls in existing controllers):**
   - Booking: created, updated (status change), cancelled, no-show marked, completed marked
   - Payment: completed, refund initiated
   - Customer: created, anonymised (GDPR deletion), data exported (GDPR portability — Sprint 4C)
   - Staff: created, updated, deleted
   - Settings: any setting saved (log setting key + old/new value, but redact sensitive values like API keys)
   - Audit log: viewed (log who viewed it and when — GDPR compliance)

4. **Retention cron** — separate cron event (not the existing 3 AM log cleanup). Runs daily. Deletes: financial records (action contains 'payment') older than 7 years; all other records older than 2 years.

5. **Audit Log dashboard page** (`/bookit-dashboard/app/audit-log`):
   - Accessible only to `bookit_admin` role (enforce on both API and Vue route level)
   - Table view: timestamp, actor (name + role), action, object summary, IP
   - Filters: date range, action type, actor
   - Pagination (50 rows per page)
   - No export in this sprint (that's Phase 2)
   - Read-only — no delete/edit controls

6. **REST endpoint:** `GET /wp-json/bookit/v1/audit-log` — admin-only, supports date range, action, actor filters, pagination.

**Testing checklist:**
- [ ] `Bookit_Audit_Logger::log()` inserts a row correctly
- [ ] Logger silently fails (no exception) when called with invalid data
- [ ] Booking created event generates an audit log entry
- [ ] Booking status change generates an audit log entry with old and new status
- [ ] Settings save generates an audit log entry
- [ ] Audit log page loads and displays entries
- [ ] Audit log page inaccessible to `bookit_staff` role (returns 403 on API, hidden in Vue)
- [ ] Date range filter returns correct subset
- [ ] Viewing the audit log page itself generates a 'audit_log.viewed' entry
- [ ] Retention cron is registered (check with `wp_next_scheduled`)

---

### Task 5: Database Migration Framework (6h)

**Goal:** Replace the ad-hoc inline migration pattern in `class-bookit-activator.php` with a proper migration runner. Must support extensions adding their own migrations.

**Note on sequencing:** Tasks 4 and 5 are interdependent — the audit log table (Task 4) should be created via the new migration framework (Task 5). Either implement Task 5 first and use it for Task 4's table, or implement them together. Resolve this sequencing with Liron at the start of the sprint.

**Deliverables:**

1. **`wp_bookings_migrations` table:**
   ```
   id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
   migration_id    VARCHAR(200) NOT NULL UNIQUE    -- e.g. '0001_add_status_log', 'recurring_0001_add_tables'
   plugin_slug     VARCHAR(100) NOT NULL DEFAULT 'bookit-booking-system'
   ran_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   INDEX (plugin_slug)
   ```
   This table is created directly in the activator (bootstraps itself — cannot use the runner to create the runner's own table).

2. **`Bookit_Migration_Runner` class** (`includes/class-bookit-migration-runner.php`):
   - `run_pending( string $plugin_slug = 'bookit-booking-system' )` — runs all unrun migrations for a plugin slug, in filename order
   - `rollback_last( string $plugin_slug )` — rolls back the most recent migration for a plugin slug
   - `rollback_to( string $migration_id, string $plugin_slug )` — rolls back to a specific migration
   - `has_run( string $migration_id, string $plugin_slug )` — check if a migration has run
   - Migration files discovered from a registered path: `bookit_register_migration_path( $plugin_slug, $path )` — extensions call this to register their migrations directory

3. **Migration file contract:**
   - Filename format: `NNNN-description.php` (e.g. `0001-add-status-log.php`, `0002-add-audit-log.php`)
   - Each file defines a class extending `Bookit_Migration_Base`
   - Must implement `up()` and `down()` methods
   - Must define `migration_id()` returning the filename without extension
   - `up()` and `down()` use `$wpdb` directly — no abstraction layer
   - `down()` must be the exact inverse of `up()` (drop tables/columns added by `up()`)

4. **Migrate existing migrations:** The current inline migration in `class-bookit-activator.php` (for `add-status-log`) must be extracted into a proper migration file (`0001-add-status-log.php`) and marked as already-run in the migrations table (so it doesn't re-run on existing installs).

5. **Integration with activator/upgrade:** `Bookit_Migration_Runner::run_pending()` called on plugin activation and on `plugins_loaded` when version number in DB differs from `BOOKIT_VERSION` constant.

6. **Extension integration:** `bookit_register_migration_path()` is called by extensions on `plugins_loaded`. When an extension is activated, it calls `Bookit_Migration_Runner::run_pending( $its_own_slug )`. When deactivated, it calls `rollback_last()` or `rollback_to()` as appropriate. Document this pattern clearly — it goes into the API spec (Task 2).

**Testing checklist:**
- [ ] `wp_bookings_migrations` table exists after activation
- [ ] Running `run_pending()` on a fresh install runs all migrations in order
- [ ] Running `run_pending()` a second time skips already-run migrations
- [ ] `0001-add-status-log.php` migration file exists, `down()` method drops the column
- [ ] `rollback_last()` runs the correct `down()` method and removes the record from migrations table
- [ ] A stub extension migration registered via `bookit_register_migration_path()` runs correctly
- [ ] Migration runner does not crash if migrations directory doesn't exist

---

### Task 6: Custom Booking Reference Format (4h)

**Goal:** Every booking gets a human-readable reference in `BK[YYMM]-[XXXX]` format (e.g. `BK2602-A7F3`). Displayed throughout dashboard and API responses.

**Deliverables:**

1. **Database migration** (using the new framework from Task 5):
   `0003-add-booking-reference.php`
   - `up()`: Adds `booking_reference VARCHAR(12) NULL UNIQUE` column to `wp_bookings`, then backfills all existing rows with generated references
   - `down()`: Drops the `booking_reference` column
   - Backfill generation: `BK` + `date('ym', strtotime($created_at))` + `-` + strtoupper(substr(md5($id . $created_at . wp_salt()), 0, 4))

2. **Generation on booking creation:** In the booking creation logic, generate the reference immediately after insert (use the new booking ID) and update the row. Never expose the raw ID as the reference.

3. **`Bookit_Reference_Generator` utility class** (`includes/utils/class-reference-generator.php`):
   - `static generate( int $booking_id, string $created_at ) : string`
   - `static generate_unique( int $booking_id, string $created_at ) : string` — adds collision check (retry with different salt if duplicate found, max 5 attempts)

4. **Display in:** bookings list (replace or supplement ID column), booking detail view/modal, any place `booking_id` is shown to users in the Vue dashboard.

5. **API responses:** Include `booking_reference` in all booking API responses alongside `id`.

6. **Search:** The existing booking search should match on `booking_reference` as well as customer name/email.

**Testing checklist:**
- [ ] Migration adds column and backfills without errors on existing dev database
- [ ] New bookings get a reference generated on creation
- [ ] Reference format matches `BK[YYMM]-[XXXX]` pattern
- [ ] References are unique (UNIQUE constraint confirmed active)
- [ ] Reference appears in bookings list UI
- [ ] Reference appears in booking detail modal
- [ ] Reference appears in `GET /wp-json/bookit/v1/bookings` API response
- [ ] Booking search returns correct result when searching by reference

---

### Task 7: Centralised Error Message System (6h)

**Goal:** Replace ad-hoc error strings across the codebase with a registry-based system that separates user-facing messages from technical log messages.

**Deliverables:**

1. **`Bookit_Error_Registry` class** (`includes/class-bookit-error-registry.php`):
   - Static registry of error definitions
   - Each error: `code` (string, e.g. `E1001`), `user_message` (string, translatable), `log_message` (string, more technical), `http_status` (int), `category` (string: `auth`, `booking`, `payment`, `validation`, `system`)
   - `static get( string $code ) : array` — returns the error definition
   - `static to_wp_error( string $code, array $context = [] ) : WP_Error` — creates a `WP_Error` with the registry message, substituting `{placeholder}` values from `$context`
   - `static register( string $code, array $definition )` — allows extensions to register their own error codes (extension error codes must be prefixed with their slug, e.g. `RECURRING_E001`)

2. **Error code definitions to include at minimum:**
   - Auth: login failed, session expired, insufficient permissions
   - Booking: slot unavailable, booking not found, cannot modify completed booking, optimistic lock conflict (from Task 8)
   - Payment: payment failed, refund not available, payment gateway error
   - Validation: required field missing, invalid email, invalid date, date in past, service not found, staff not found
   - System: database error, unexpected error

3. **Integration:** Replace the most common/visible ad-hoc error strings in existing REST API controllers with `Bookit_Error_Registry::to_wp_error()` calls. Do not attempt to replace every single string — focus on the booking wizard API, auth API, and booking management API. Document the pattern clearly so future tasks follow it.

4. **Vue frontend:** The Vue API service layer should handle the standardised error response shape. When an API call returns an error, extract `code` and `message` from the WP REST error response and display `message` to the user. Ensure existing error handling in the Vue app is consistent with this — update any hardcoded error strings in Vue to use the API-provided message.

5. **Translation-ready:** All `user_message` strings wrapped in `__( 'Message', 'bookit-booking-system' )`.

**Testing checklist:**
- [ ] `Bookit_Error_Registry::get('E1001')` returns correct definition
- [ ] `Bookit_Error_Registry::to_wp_error('E1001')` returns a `WP_Error` instance
- [ ] Placeholder substitution works: `{booking_id}` replaced with context value
- [ ] Extension can register a custom error code without collision
- [ ] Attempting to book an unavailable slot returns the correct error code in API response
- [ ] Vue displays the API-provided error message (not a hardcoded string) on booking failure
- [ ] All `user_message` strings are wrapped in `__()`

---

### Task 8: Optimistic Locking on Booking Edit (4h)

**Goal:** Prevent last-write-wins conflicts when two dashboard users edit the same booking simultaneously.

**Deliverables:**

1. **Backend — update endpoint check:** In the booking update API endpoint (`PATCH /wp-json/bookit/v1/bookings/{id}`), before applying the update:
   - Require `updated_at` in the request body (if missing, proceed without lock check for backwards compatibility — flag this in code comment)
   - Fetch current `updated_at` from DB
   - If request `updated_at` !== DB `updated_at`, return error `E_LOCK_CONFLICT` (409 HTTP status) with the current booking data in the response body (so Vue can refresh without a second request)

2. **Frontend — booking edit modal:**
   - Store `updated_at` when the booking is loaded into the edit modal
   - Send `updated_at` in the PATCH request body
   - On 409 response: show user-friendly message ("This booking was just updated by someone else. The latest version has been loaded — please review and save again"), replace modal data with the returned current booking, allow user to re-save

3. **Error code:** Register `LOCK_CONFLICT` in the error registry (Task 7): user message as above, HTTP 409, category `booking`.

**Testing checklist:**
- [ ] Edit a booking normally — saves successfully
- [ ] Simulate conflict: load booking, manually update `updated_at` in DB, attempt save — receives 409
- [ ] 409 response body contains current booking data
- [ ] Vue modal shows conflict message and refreshes with current data
- [ ] After conflict reload, user can successfully re-save

---

### Task 9: PHPUnit Tests + Manual Testing & Polish (4h)

**Goal:** Test coverage for new Sprint 4B code, plus a full manual regression pass.

**PHPUnit tests to write (targeting existing wp-env setup, 444 tests currently passing):**

- `Bookit_Extension_Registry_Test`: register valid extension, register with incompatible version returns WP_Error, registry returns all registered extensions, duplicate slug rejected
- `Bookit_Audit_Logger_Test`: log() inserts row, log() with missing DB table silently fails, sensitive field not logged
- `Bookit_Migration_Runner_Test`: run_pending() runs migrations in order, skips already-run, has_run() returns correct values, rollback_last() calls correct down() and removes record
- `Bookit_Reference_Generator_Test`: generate() returns correct format, format matches regex `BK\d{4}-[A-Z0-9]{4}`, unique constraint collision handling
- `Bookit_Error_Registry_Test`: get() returns definition, to_wp_error() returns WP_Error, placeholder substitution, extension registration
- `Bookit_Optimistic_Lock_Test`: update with matching updated_at succeeds, update with stale updated_at returns 409 with current data

**Manual testing checklist:**
- [ ] Full booking flow still works end-to-end after all hook additions (create, edit, cancel)
- [ ] Dashboard loads correctly with branding settings applied
- [ ] Audit log captures all expected events during manual testing session
- [ ] Booking reference appears on new booking in list view
- [ ] Extension API endpoint returns empty array (no extensions installed)
- [ ] Migration runner reports all migrations as already-run on existing install
- [ ] Settings save produces audit log entry
- [ ] All 444 existing PHPUnit tests still pass after sprint changes

---

## PROGRESS TRACKER

```
# SPRINT 4B PROGRESS TRACKER

## Tasks
- [ ] Task 1: Extension Hook System — PHP Core Hooks (8h)
- [ ] Task 2: Extension Plugin API Spec Document (6h)
- [ ] Task 3: White-Label Branding System (8h)
- [ ] Task 4: Audit Logging System (8h)
- [ ] Task 5: Database Migration Framework (6h)
- [ ] Task 6: Custom Booking Reference Format (4h)
- [ ] Task 7: Centralised Error Message System (6h)
- [ ] Task 8: Optimistic Locking on Booking Edit (4h)
- [ ] Task 9: PHPUnit Tests + Manual Testing (4h)

## Total Hours
Estimated: 54h
Actual: 0h
Variance: —

## Sprint Status
Sprint 4B: IN PROGRESS 🔄
```

---

## SEQUENCING NOTES

**Recommended order:**
1. **Task 5 first** (migration framework) — Tasks 4 and 6 depend on it for creating their tables/columns
2. **Task 1** (extension hooks) — foundation for the API spec
3. **Task 2** (API spec) — write this while Task 1 is fresh; no code needed
4. **Tasks 3, 4, 6, 7, 8** — independent, can be done in any order
5. **Task 9 last** — tests and regression

**Coordinate with Liron** on the Task 4/5 sequencing before starting either — the audit log table migration (Task 4) should be migration `0002` in the new framework, but the framework (Task 5) must exist first.

---

## ESCALATION

If you encounter any of the following, stop and escalate to the Project Assistant (main chat) before proceeding:

- Any decision about which hooks are needed beyond those listed here
- Any question about what data extensions should be able to access vs. what is private to core
- Any scope addition not listed in this sprint
- PHPUnit test count drops below 444 (regression introduced)
- A task is taking significantly longer than estimated (>150% of estimate)

---

## SPRINT COMPLETION CRITERIA

Sprint 4B is complete when:
- All 9 tasks marked complete
- PHPUnit test suite passes (444 + new tests, zero failures)
- `Extension_Plugin_API_Spec.md` document exists and is saved to project knowledge
- Branding settings apply correctly in dashboard
- Audit log captures booking created/updated/cancelled events
- Migration framework runs cleanly on fresh install and existing install
- Booking references appear on all bookings
- Error registry in use for key booking/auth error paths
- Optimistic locking rejects stale edits with 409

**On sprint completion, report back to the Project Assistant with:**
- Actual hours per task
- Any scope changes made during implementation
- Any decisions made that weren't covered by this prompt (so they can be recorded in progress.md)
- Any issues discovered that should be noted before Sprint 4C begins
```

---

That's the complete Sprint 4B Implementation Prompt. Copy it into a new Claude chat to start the sprint.

One thing to note before you kick off: I'd recommend starting with **Task 5 → Task 1 → Task 2** in that order in your first session, since the migration framework unblocks the audit log table and booking reference migration, and the extension hooks unblock the API spec. The other tasks can be tackled in any order after that.