---
name: cursor-prompt-generator
description: >
  Generates Cursor-ready implementation prompts for the Bookit Meetings
  extension plugin. Use this skill whenever a sprint agent needs to produce
  a Cursor prompt for any implementation task — PHP, Vue, SQL, REST
  endpoints, PHPUnit tests, migrations, or bug fixes.
---

# Cursor Prompt Generator — Bookit Meetings Extension

This skill produces Cursor implementation prompts for the Bookit Meetings
extension plugin (PHP 8.0+, WordPress 6.0+, Vue 3, Vite, PHPUnit).
Every prompt must follow the structure and rules below.

---

## BEFORE WRITING ANY PROMPT — MANDATORY CHECKS

Before generating a prompt, verify you have answers to all of these.
If any are unknown, use GitHub to read the relevant files first.

1. **What files already exist** that this task touches or depends on?
   → Use GitHub to read them. Never assume file contents.

2. **What patterns are already established** in similar files?
   → The prompt must direct Cursor to follow existing patterns, not invent new ones.

3. **Which extension infrastructure applies?**
   - New DB changes → migration file in `database/migrations/NNNN-description.php`
   - New REST endpoints → must use `bookit-meetings/v1/` namespace, never `bookit/v1/`
   - Dashboard endpoints → auth via `Bookit_Auth::is_authenticated()`
   - Public endpoints → auth via HMAC-SHA256, never `wp_verify_nonce()`
   - Settings reads → `$wpdb->get_col()` on `{prefix}bookings_settings`, never `get_option()` and never `$wpdb->get_var()` (see KNOWN GOTCHAS)

4. **Does the task touch any external library?**
   → Use Context7 to resolve and query current docs before writing any library-specific implementation guidance.

5. **What is the current PHPUnit test count?**
   → State the baseline in the prompt so Cursor knows the floor.
   → Baseline entering Sprint 3: 51 tests, 107 assertions, 0 failures.
   → Update this after each sprint.

6. **Does the task read data written by a preceding hook in the same request?**
   → If yes, the `$booking` array passed by core will be stale. Direct Cursor to re-read
   the required fields from the DB inside the callback. Never rely on `$booking` fields
   that may have been written after the array was assembled (see KNOWN GOTCHAS).
   → NOTE: Core's re-fetch in `booking-confirmed-v2.php` covers core columns only —
   it does NOT include extension-owned fields like `meeting_link`. Extensions must
   always re-read their own fields from the DB inside filter callbacks.

7. **Does the task enqueue JS or inject a mount point on the Bookit dashboard?**
   → `wp_enqueue_script()` and `wp_footer()` do NOT work on the dashboard template.
   Use `ob_start()` on `bookit_dashboard_loaded` to inject JS scripts before `</body>`.
   Mount point divs must be injected via `add_action('bookit_dashboard_extension_content', ...)` —
   NOT via `ob_start()` + `str_replace`. See KNOWN GOTCHAS for the full pattern.

8. **Does the task read booking data in a my-schedule context?**
   → `format_schedule_booking()` does NOT apply `bookit_booking_response`.
   `meeting_link` will not be present until core adds `bookit_schedule_booking_response`
   (pending core Request 5).

9. **Does the task need to detect an open booking detail modal?**
   → Core's booking detail is modal-only with no URL change. Detect via
   `window.fetch` intercept + MutationObserver pattern (see KNOWN GOTCHAS).

10. **Does the task involve READ FIRST files in the core plugin folder?**
    → If a required READ FIRST file is not accessible on disk (e.g. core plugin
    files not present in the Cursor workspace), Cursor must STOP and report back.
    It must NOT proceed on assumption about file contents.

---

## PROMPT STRUCTURE

Every Cursor prompt must contain these sections in this order:

### 1. TASK HEADER
```
TASK [N] OF [TOTAL]: [Task name]
Sprint: [Sprint ID] | Est: [Xh] | Plugin root: bookit-meetings/
```

### 2. READ FIRST (mandatory — always the first instruction)
List every file Cursor must read before writing a single line of code.

Format:
```
## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. [path/to/file] — [why it must be read]
2. [path/to/file] — [why it must be read]
...

If any file does not exist or is not accessible on disk, stop and report back before proceeding.
```

Confirmed correct paths:
- Core REST API files are in `bookit-booking-system/includes/api/` (not `bookit-booking-system/api/`)
- Dashboard permission pattern: `bookit-booking-system/includes/api/class-extensions-api.php`
- Admin permission pattern: `bookit-booking-system/includes/api/class-customers-api.php`
- Dashboard template: `bookit-booking-system/dashboard/app/index.php` — read before any task that enqueues assets or injects HTML on the dashboard
- Dashboard asset injection: `bookit-meetings/includes/class-bookit-meetings-assets.php` — NOT `class-bookit-meetings-dashboard.php` (that file does not exist)

### 3. CONTEXT
2–4 sentences: what the task delivers, where it fits in the sprint, decisions that constrain it, which core hook requests unblock it (if applicable).

### 4. IMPLEMENTATION REQUIREMENTS
File-by-file breakdown. PHP backend first, then Vue frontend, then tests. Never mix.

```
### [path/to/file] — [CREATE|MODIFY]
- Bullet list of specific requirements
- Reference existing patterns by name
- State constraints explicitly
```

### 5. EXTENSION INFRASTRUCTURE WIRING
```
## INFRASTRUCTURE WIRING
- [ ] Migration registered: bookit_register_migration_path( 'bookit-meetings', ... )
- [ ] Migration file created: database/migrations/NNNN-description.php
- [ ] REST routes registered under: bookit-meetings/v1/
- [ ] Dashboard auth uses: Bookit_Auth::is_authenticated()
- [ ] Nav item registered via: bookit_register_nav_item()
- [ ] JS data passed via: bookit_dashboard_js_data filter
- [ ] Booking response extended via: bookit_booking_response filter
- [ ] JS scripts injected via: ob_start() on bookit_dashboard_loaded
- [ ] Mount point div injected via: add_action('bookit_dashboard_extension_content', ...)
```
Omit lines that do not apply.

### 6. PHPUNIT TESTS
```
## PHPUNIT REQUIREMENTS
Baseline: [N] tests, [N] assertions, 0 failures — must not regress.

Write tests in: tests/unit/test-[feature-name].php

Required test cases:
- [test name]: [what it verifies]

Run after implementation:
wp-env run tests vendor/bin/phpunit
All tests must pass before marking task complete.
```
Note: Vue components are not PHPUnit-tested. Playwright E2E tests are a separate sprint.

### 7. ACCEPTANCE CRITERIA
Binary, independently verifiable items only.

```
## ACCEPTANCE CRITERIA
### Functional
- [ ] [Specific verifiable behaviour]

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] REST namespace is bookit-meetings/v1/ — not bookit/v1/
- [ ] PHPUnit suite passes ([N]+ tests, [N]+ assertions, 0 failures)

### Must NOT break
- [ ] Core plugin activates and functions normally alongside this extension
- [ ] Extension deactivates cleanly (migration down() runs without error)
```

### 8. GIT COMMIT
```
## GIT COMMIT MESSAGE
Sprint [ID], Task [N]: [description]

- [change 1]
- [change 2]

Tests: [N] passing, [N] assertions, 0 failures
```

---

## RULES

**Read before write.** Every prompt must open with explicit read instructions.

**One task, one prompt.** Never combine tasks. Split large tasks into Na / Nb.

**No mass updates.** Process multiple records individually in a loop, not bulk SQL.

**Context7 for libraries.** Any Vue 3, WordPress REST, PHPUnit, or npm/composer usage needs:
```
Note: Before implementing [feature], use Context7 to resolve '[library]' and confirm the current API.
```

**GitHub for existing code.** Any modification of an existing file must instruct Cursor to read it from GitHub first.

**Core plugin files not on disk.** If a READ FIRST file lives in the core plugin folder and is not accessible in the Cursor workspace, Cursor must STOP and report back — never proceed on assumption.

**Frontend builds.** Any Vue/JS task must end with:
```
After implementation, run: npm run build (in bookit-meetings/dashboard/)
dist/ is gitignored — build manually in wp-env after Cursor completes changes.
```

**Admin-only features.** State explicitly: `bookit_staff role must be blocked`.
Use `Bookit_Auth::get_current_user()` and check `role === 'admin'`.

**Vue Router mode.** Always `createWebHashHistory()`. Never `createWebHistory()`.

**Escalation note.** Every prompt must end with:
```
If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.
```

---

## COMMON PATTERNS REFERENCE

| Pattern | Reference file |
|---------|---------------|
| Main plugin file | `bookit-booking-system/bookit-booking-system.php` |
| Loader class | `bookit-booking-system/includes/class-bookit-loader.php` |
| Migration file | `bookit-meetings/database/migrations/0001-add-meetings-schema.php` |
| Migration runner | `bookit-booking-system/includes/class-bookit-migration-runner.php` |
| REST endpoint class | `bookit-meetings/api/class-meetings-api.php` |
| Dashboard REST auth | `bookit-booking-system/includes/api/class-extensions-api.php` |
| Admin REST auth | `bookit-booking-system/includes/api/class-customers-api.php` |
| Auth check | `Bookit_Auth::is_authenticated()` |
| Logger | `Bookit_Logger::info()`, `::error()`, `::warning()` |
| Extension registry | `Bookit_Extension_Registry::is_registered()` |
| Settings read | `$wpdb->get_col()` — see KNOWN GOTCHAS |
| Link generator | `bookit-meetings/includes/class-bookit-meetings-link-generator.php` |
| Customer surfaces | `bookit-meetings/includes/class-bookit-meetings-customer-surfaces.php` |
| Dashboard asset injection | `bookit-meetings/includes/class-bookit-meetings-assets.php` |
| Settings Vue page | `bookit-meetings/dashboard/src/views/MeetingsSettingsView.vue` |
| Meeting info panel | `bookit-meetings/dashboard/src/components/MeetingInfoPanel.vue` |
| Booking detail view | `bookit-meetings/dashboard/src/views/BookingDetailView.vue` |
| Dashboard template | `bookit-booking-system/dashboard/app/index.php` — custom PHP, no wp_head/wp_footer |

---

## KNOWN GOTCHAS

- **Task touches Vue files** → include `base: './'` Vite note + build instruction

- **Task adds a new DB table or column** → must use migration file, `information_schema` checks only

- **Task checks column existence** → `information_schema.COLUMNS` — never `SHOW COLUMNS LIKE`

- **Task checks table existence** → `information_schema.TABLES` — never `SHOW TABLES LIKE`

- **Task drops a column in migration `down()`** → `DROP COLUMN IF EXISTS` is NOT supported on
  older MariaDB. Guard with `information_schema.COLUMNS` check first:
  ```php
  $col = $wpdb->get_col( $wpdb->prepare(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
      DB_NAME, $wpdb->prefix . 'bookings', 'meeting_link'
  ) );
  if ( ! empty( $col ) ) {
      $wpdb->query( "ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN meeting_link" );
  }
  ```

- **Task uses JSON column data** → never `JSON_CONTAINS()` — use `json_decode()` + `in_array()` in PHP

- **Task adds a public REST endpoint** → HMAC-SHA256 auth — never `wp_verify_nonce()`

- **Task handles OAuth tokens or base64** → never pass through `sanitize_text_field()`

- **Task does file uploads** → use `fetch()` + `FormData`, not axios/`useApi()`

- **Task reads booking times** → null-guard `start_time` and `end_time` — both are NULL on cancelled bookings

- **Task enqueues assets** → use `bookit_dashboard_loaded` action only — never `init` or `wp_enqueue_scripts`

- **Task enqueues JS on the dashboard** → `wp_enqueue_script()` does NOT output `<script>` tags on
  the Bookit dashboard — the template does not call `wp_footer()`. Use `ob_start()` on
  `bookit_dashboard_loaded` to inject JS module scripts and inline `window.*` data before `</body>`.
  CSS can still use `wp_enqueue_style()` (core calls `wp_print_styles()` in `<head>`).
  Never use `wp_localize_script()` on the dashboard — use inline `<script>window.myVar = {...};</script>`.

- **Task injects mount point div on the dashboard** → Use `add_action('bookit_dashboard_extension_content', ...)`
  to echo the mount div directly. Do NOT use `ob_start()` + `str_replace` for mount div injection —
  that approach placed the div outside core's `#app` container. The `bookit_dashboard_extension_content`
  hook fires inside the core layout container after `<div id="app">`. Only echo when
  `$_SERVER['REQUEST_URI']` contains the extension route:
  ```php
  add_action( 'bookit_dashboard_extension_content', function() {
      $uri = $_SERVER['REQUEST_URI'] ?? '';
      if ( strpos( $uri, '/bookit-dashboard/app/meetings' ) === false ) {
          return;
      }
      echo '<div id="bookit-meetings-app"></div>';
  } );
  ```

- **`bookit_dashboard_loaded` fires before `<!DOCTYPE html>`** → The action fires at ~line 30 of
  `index.php`, before the HTML template begins at ~line 59. Any direct `echo` inside the callback
  lands before `<!DOCTYPE html>` and breaks the document. Always use `ob_start()` — never echo directly.

- **Task reads settings** → use `$wpdb->get_col()` — never `get_option()`, never `$wpdb->get_var()`.
  Full pattern:
  ```php
  $results = $wpdb->get_col( $wpdb->prepare(
      "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
      $key
  ) );
  return empty( $results ) ? $default : (string) $results[0];
  ```
  Reason: `$wpdb->get_var()` returns PHP `null` for empty string `''`, making it impossible to
  distinguish "row exists with empty value" from "row missing". `get_col()` returns `[]` for
  missing rows and `['']` for an empty string value.

- **Task adds a migration file** → class name must use the plugin slug prefix:
  `Bookit_Migration_Meetings_NNNN_Description` (not `Bookit_Migration_NNNN_Description`).
  PHP class names are global — core uses `Bookit_Migration_0001_*` and a collision causes a fatal
  on class redefinition. The slug prefix guarantees uniqueness.
  → `migration_id()` must return the bare filename stem with NO plugin prefix:
  e.g. `'0001-add-meetings-schema'` not `'meetings-0001-add-meetings-schema'`.
  The runner derives `$migration_id` from `pathinfo( $filename, PATHINFO_FILENAME )` and matches
  it against `migration_id()` — any prefix causes the match to fail and the migration to error.
  → Do NOT add `class_alias()` — it is not needed in core v1.5.1+ and must not be used.

- **Task adds DDL tests** → do NOT test `down()` in PHPUnit. `ALTER TABLE` / `CREATE TABLE` cause
  implicit commits in MariaDB, breaking `WP_UnitTestCase`'s transaction wrapper. Test `up()` only.
  Verify `down()` manually via plugin deactivation in wp-env.

- **Task reads a `$booking` array passed by a core filter** → the array will NOT contain
  extension-owned fields (e.g. `meeting_link`) even after core v1.5.1's re-fetch in
  `booking-confirmed-v2.php`. Core's re-fetch SELECT covers core columns only — it does not
  and should not include extension data. Always re-read extension-owned fields from the DB
  using `$booking['id']` inside the filter callback. This is the correct permanent pattern.

- **Task reads booking data in my-schedule context** → `GET /dashboard/my-schedule` uses
  `format_schedule_booking()` which does NOT apply `bookit_booking_response`. `meeting_link`
  will not be present until core adds `bookit_schedule_booking_response` (pending — core Request 5).

- **Task detects open booking detail modal** → Core's booking detail is modal-only with no URL change.
  Detect via `window.fetch` intercept watching for `GET /dashboard/bookings/{id}`. Detect modal
  close via MutationObserver on `div[role="dialog"][aria-labelledby="booking-view-modal-title"]`.
  Store the original fetch BEFORE replacing it; use it for all extension API calls to avoid recursion:
  ```js
  const originalFetch = window.fetch
  window.fetch = async ( ...args ) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url ?? ''
      const match = url.match( /\/dashboard\/bookings\/(\d+)$/ )
      if ( match ) {
          activeBookingId.value = parseInt( match[1], 10 )
          await loadMeetingInfo( activeBookingId.value ) // uses originalFetch internally
      }
      return originalFetch( ...args )
  }
  ```

- **Task uses Vue Router** → always `createWebHashHistory()`. Never `createWebHistory()` — conflicts
  with core's catch-all rewrite rule that serves the SPA shell for all `/bookit-dashboard/app/*` paths.

- **`bookit_booking_response` filter second argument** → Is `int $booking_id`, NOT `array $booking`.
  Core calls `apply_filters( 'bookit_booking_response', $response, $booking_id )`. Always type as
  `int $booking_id`. Re-fetch from DB if the full booking array is needed.

- **Task uses sidebar nav items** → Items registered via `bookit_register_nav_item()` render as plain
  `<a href>` anchors in `Sidebar.vue`, not `<router-link>`. Clicking causes a full page reload.
  Design extension routing around this — no SPA transitions between core and extension pages.

---

## QUALITY CHECKLIST (run before delivering any prompt)

- [ ] READ FIRST section lists all files that will be touched
- [ ] READ FIRST instruction states: "If any file does not exist or is not accessible on disk, stop and report back before proceeding"
- [ ] Every implementation requirement is file-specific
- [ ] Extension infrastructure wiring checklist is explicit
- [ ] PHPUnit section states the baseline test count AND assertion count
- [ ] Acceptance criteria are all binary and verifiable
- [ ] No vague instructions ("handle errors appropriately")
- [ ] Context7 note included for any library-specific code
- [ ] Frontend build instruction included if Vue files are modified
- [ ] REST namespace is `bookit-meetings/v1/` throughout
- [ ] Admin-only note included for any admin-restricted feature
- [ ] Git commit message includes test count AND assertion count
- [ ] Escalation note present at the end
- [ ] Settings reads use `get_col()` pattern — not `get_var()`
- [ ] Any filter reading extension-owned `$booking` fields re-reads from DB — core re-fetch does not cover extension columns
- [ ] Dashboard JS injection uses `ob_start()` — not `wp_enqueue_script()` or `wp_footer()`
- [ ] Dashboard mount div uses `add_action('bookit_dashboard_extension_content', ...)` — not `ob_start()` + `str_replace`
- [ ] Migration `migration_id()` returns bare filename stem — no plugin prefix
- [ ] Migration class name uses plugin slug prefix — no `class_alias()` added
- [ ] Vue Router uses `createWebHashHistory()` — not `createWebHistory()`
- [ ] `bookit_booking_response` filter types second arg as `int $booking_id` — not `array $booking`
- [ ] Column/table drops in `down()` guard with `information_schema` check — not `IF EXISTS`