# Bookit Meetings — Project Progress Log
**Plugin:** bookit-meetings (extension of bookit-booking-system v1.5.0)
**Phase:** 1 of 2
**Last updated:** April 2026

---

## PHPUnit Baseline (Critical — update after every sprint)

| Sprint | Tests | Assertions | Failures | Date |
|--------|-------|------------|----------|------|
| Start  | 0     | 0          | 0        | Apr 2026 |
| Sprint 1 exit | 45 | 94 | 0 | Apr 2026 |
| Sprint 2 exit | 51 | 107 | 0 | Apr 2026 |
| Pre-Sprint 3 Housekeeping exit | 51 | 107 | 0 | May 2026 |

**Sprint 3 baseline: 51 tests, 107 assertions, 0 failures**

---

## Sprint Log

### Sprint 1 — Plugin Scaffold + Core PHP
**Period:** April 2026
**Goal:** All PHP logic complete, all PHPUnit tests passing, plugin activates cleanly, link generation works end-to-end.

| Task | Description | Status | Tests added | Notes |
|------|-------------|--------|-------------|-------|
| 1 | Plugin scaffold | ✅ Complete | 4 tests, 11 assertions | wp-env PHP 8.2 (prompt specified 8.0 — no issues) |
| 2 | Database migrations | ✅ Complete | +4 tests, +14 assertions | Required significant debugging — see deviations |
| 3 | REST API | ✅ Complete | +14 tests, +37 assertions | Core API path wrong in prompt — Cursor found correct path |
| 4 | Link generation | ✅ Complete | +10 tests, +21 assertions | Hooks confirmed in core before implementation |
| 5 | Customer-facing surfaces | ✅ Complete | +13 tests, +20 assertions | Stale booking array bug found and fixed — see deviations |
| 6 | Staff notification email | ⏸️ Blocked | 0 | No extension hooks in core staff email — see open questions |

**Sprint 1 exit: 45 tests, 94 assertions, 0 failures**

---

## Decisions Made Mid-Sprint

### Migration class naming convention
**Decision:** All migration classes must be prefixed with the plugin slug:
`Bookit_Migration_Meetings_NNNN_Description` (not `Bookit_Migration_NNNN_Description`).

**Reason:** PHP class names are global across the entire WordPress runtime. Core
uses `Bookit_Migration_0001_*` and if the extension also uses `Bookit_Migration_0001_*`
a PHP fatal error occurs on class redefinition. The slug prefix guarantees
uniqueness across all plugins.

**Impact:** A `class_alias()` workaround is currently in `0001-add-meetings-schema.php`
because `Bookit_Migration_Runner` derives class names from filenames. This needs
to be resolved with the core team — see Core Hook Requests below.

**Applies to:** All migration files in this plugin, now and in future sprints.

### Migration ID convention
**Decision (corrected Pre-Sprint 3 Housekeeping):** `migration_id()` must return exactly the filename stem — `'NNNN-description'` with no plugin prefix (e.g. `'0001-add-meetings-schema'`). Core v1.5.1 runner matches by `migration_id()` value against `pathinfo( $filename, PATHINFO_FILENAME )`. A prefix causes the match to fail.

Note: The class name still uses the slug prefix (`Bookit_Migration_Meetings_NNNN_Description`) to avoid PHP class name collisions. Only `migration_id()` must drop the prefix.

### Task 6 deferred — staff email architecture
**Decision:** Task 6 (staff notification email) is blocked pending core hook
additions. Sending a separate extension-triggered email was rejected because
it would cause staff to receive two emails per booking (one from core, one from
the extension). The correct approach is a hook inside the core staff email.

**See:** Core Hook Requests section below.

### `$booking` array is stale on confirmation page filter
**Decision (discovered mid-sprint):** The `$booking` array passed to
`bookit_confirmation_meeting_section` is fetched from the DB *before*
`bookit_after_booking_confirmed` fires. This means `$booking['meeting_link']`
is always `null` even after Task 4 writes it to the DB.

**Fix applied:** `confirmation_page_section()` and `confirmation_email_section()`
in `class-bookit-meetings-customer-surfaces.php` re-read `meeting_link` fresh
from the database using `$booking['id']` instead of relying on `$booking['meeting_link']`.

**This is a permanent pattern for this extension** — any filter that needs
post-write data from a `$booking` array passed by core must re-read from DB.

---

## Deviations from Plan

### Task 1 — PHP version
**Prompt specified:** PHP 8.0
**Cursor used:** PHP 8.2 in `.wp-env.json`
**Impact:** None — PHP 8.2 is stricter, no deprecation warnings found.
**Action:** Acceptable deviation. Leave as 8.2.

### Task 2 — Migration test approach
**Original plan:** Tests call `up()` and `down()` to verify round-trip.
**Actual approach:** Tests call `up()` only (via `ensure_meetings_schema_exists()`
helper) and use `bookit_test_truncate_tables()` to reset data between tests.
`down()` tests were removed entirely.

**Reason:** `WP_UnitTestCase` wraps each test in a transaction. `ALTER TABLE`
and `CREATE TABLE` in `up()` cause implicit commits in MariaDB, disrupting the
transaction boundary. `down()` tests caused `meeting_link` to be dropped mid-suite,
breaking subsequent tests. This is consistent with how core migration tests work
(see `test-available-packages-api.php` — core also uses truncate, not down()).

**Permanent rule:** DDL round-trip tests (`up()`/`down()`) are not viable in
`WP_UnitTestCase`. Test `up()` only. Verify `down()` manually via plugin
deactivation in wp-env.

### Task 2 — `$wpdb->get_var()` empty string behaviour
**Discovered:** `$wpdb->get_var()` returns PHP `null` when the selected value
is an empty string `''`. The test helper `get_setting_value()` was returning
`null` for `meetings_platform` and `meetings_manual_url` (both empty strings)
even though the rows existed in the DB.

**Fix:** Use `$wpdb->get_col()` instead of `$wpdb->get_var()` whenever the value
may legitimately be an empty string. Check `empty( $results )` and return
`(string) $results[0]`. Remove `COALESCE()` wrappers — they are no longer needed.

**This is a plugin-wide rule** — all settings reads in this plugin use `get_col()`.
Already captured in `cursor-prompt-generator-meetings.md` KNOWN GOTCHAS.

### Task 2 — `INSERT IGNORE` silently fails in test environment
**Discovered:** `INSERT IGNORE` and `ON DUPLICATE KEY UPDATE` both failed to
produce readable rows in PHPUnit when the value was `''`. The issue was that
`$wpdb->get_var()` was returning `null` for `''` (see above) — the inserts were
actually succeeding. Replaced with `$wpdb->insert()` + existence check pattern.

### Task 3 — Core API file location
**Prompt specified:** `bookit-booking-system/api/`
**Actual location:** `bookit-booking-system/includes/api/`
**Files used as patterns:**
- `bookit-booking-system/includes/api/class-extensions-api.php` (dashboard permission pattern)
- `bookit-booking-system/includes/api/class-customers-api.php` (admin permission pattern)

**Action:** READ FIRST paths updated in skill file for future prompts.

### Task 4 — Hook location
**Prompt specified:** `bookit_after_booking_confirmed` fires from `includes/`
**Actual location:** `bookit-booking-system/public/templates/booking-confirmed-v2.php`
**Impact:** None — hook signature confirmed correct before implementation.

### Task 5 — Stale `$booking` array (critical deviation)
**Original design assumption:** The `$booking` array passed to
`bookit_confirmation_meeting_section` would include `meeting_link` set by Task 4.
**Actual behaviour:** `$booking` is assembled before `bookit_after_booking_confirmed`
fires, so `meeting_link` is always `null` in the filter parameter.

**Fix:** Re-read `meeting_link` from DB inside the filter callback using
`$booking['id']`. Applied to both `confirmation_page_section()` and
`confirmation_email_section()`.

**Lesson:** Never rely on `$booking` array fields that may have been written
by a hook that fires in the same request. Always re-read from DB.

---

## Open Questions / Carry-Forwards

### Task 6 — Staff notification email (BLOCKED)
**Status:** Blocked pending core hooks.

**Problem:** `Bookit_Staff_Notifier` (in
`bookit-booking-system/includes/notifications/class-bookit-staff-notifier.php`)
sends staff notification emails with no extension hooks in the build path.
There is no `apply_filters()` or `do_action()` inside or around the staff email
HTML generation that an extension can use to inject content.

**Why we can't send a separate email:** Staff would receive two emails per
booking — one from core, one from the extension. This is confusing and
unprofessional.

**What is needed from core:** See Core Hook Requests section.

**Carry-forward to:** Sprint 1.5 (after core hooks are added) or Sprint 2
if the hook can be added quickly.

### `class_alias()` workaround in migration file
**Status:** ✅ Resolved — Pre-Sprint 3 Housekeeping, Task 2

Root cause was a `migration_id()` return value mismatch (had a `meetings-` prefix that prevented runner lookup). Fixed by correcting `migration_id()` to return the bare filename stem. `class_alias()` block removed. See Architecture Corrections in Pre-Sprint 3 Housekeeping section.

`Bookit_Migration_Runner` derives the class name it expects from the filename
(e.g. `0001-add-meetings-schema.php` → expects `Bookit_Migration_0001_Add_Meetings_Schema`).
Our class is named `Bookit_Migration_Meetings_0001_Add_Meetings_Schema` to avoid
collision. A `class_alias()` call bridges the gap.

**Preferred fix:** Core should look up migration classes by `plugin_slug()` +
`migration_id()` rather than by filename-derived class name. This would eliminate
the need for `class_alias()` and make the naming convention clean.

**Workaround in place:** `class_alias( 'Bookit_Migration_Meetings_0001_Add_Meetings_Schema', 'Bookit_Migration_0001_Add_Meetings_Schema' )` at the bottom of the migration file.

---

## Core Hook Requests
**To be communicated to core plugin developer after Phase 1 completion.**

### REQUEST 1 — Staff email meeting section filter (CRITICAL — blocks Task 6)

**File to modify:** `bookit-booking-system/includes/notifications/class-bookit-staff-notifier.php`

**What to add:** A filter hook inside the staff email HTML generation, mirroring
the pattern already used in the customer email (`bookit_email_meeting_section`
in `class-email-sender.php`):

```php
$bookit_staff_email_meeting_html = apply_filters(
    'bookit_staff_email_meeting_section',
    '',
    $booking_full,
    $staff_id
);
if ( '' !== $bookit_staff_email_meeting_html ) {
    echo wp_kses_post( $bookit_staff_email_meeting_html );
}
```

**Where:** Inside the staff email HTML body, after the booking detail rows and
before the action links (dashboard URL / preferences URL).

**Parameters:**
- `$html` *(string)* — HTML to inject. Default: `''`
- `$booking_full` *(array)* — Full booking record including `customer_phone`,
  `booking_reference`, `meeting_link`, `customer_first_name`, `customer_last_name`
- `$staff_id` *(int)* — The staff member receiving the notification

**Why:** Allows the Meetings extension to inject meeting link (Teams/Generic)
or customer phone number (WhatsApp) into the existing staff email without
sending a second email.

---

### REQUEST 2 — Migration runner class lookup by ID not filename (NICE TO HAVE)

**File to modify:** `bookit-booking-system/includes/class-bookit-migration-runner.php`

**What to change:** When loading a migration class, look it up by
`plugin_slug()` + `migration_id()` rather than deriving the class name from
the filename. This allows extension migrations to use a prefixed naming
convention (`Bookit_Migration_Meetings_NNNN_*`) without needing `class_alias()`.

**Current behaviour:** Runner derives class name from filename:
`0001-add-meetings-schema.php` → expects `Bookit_Migration_0001_Add_Meetings_Schema`

**Desired behaviour:** Runner calls `migration_id()` and `plugin_slug()` to
identify the migration, and accepts any class name.

**Why:** Prevents PHP class name collisions when multiple extensions each have
a `0001-*.php` migration file.

---

### REQUEST 3 — `bookit_after_booking_confirmed` fires before confirmation page filter (INFORMATIONAL)

**Not a bug — informational for core team awareness.**

`bookit_after_booking_confirmed` fires correctly before `bookit_confirmation_meeting_section`.
However, the `$booking` array passed to the filter is assembled *before* the
action fires, so any data written to the DB by the action (e.g. `meeting_link`)
is not reflected in the `$booking` parameter of the filter.

**Extension workaround in place:** The Meetings extension re-reads `meeting_link`
from the DB inside the filter callback. This works but is an extra DB query.

**Potential core improvement:** Re-fetch the `$booking` array from DB after
firing `bookit_after_booking_confirmed` and before calling
`apply_filters( 'bookit_confirmation_meeting_section', '', $booking )`.
This would make the pattern cleaner for all extensions.

---

## Core Hook Discoveries

These are behaviours discovered during Sprint 1 that differ from what the
documentation or spec implied. Captured here so future prompts don't repeat
mistakes.

| Hook | Discovery | Impact |
|------|-----------|--------|
| `bookit_confirmation_meeting_section` | `$booking` array passed to filter is stale — assembled before `bookit_after_booking_confirmed` fires | Must re-read any post-write fields from DB inside filter |
| `bookit_after_booking_confirmed` | Fires from `public/templates/booking-confirmed-v2.php`, not from `includes/` | READ FIRST paths corrected |
| `bookit_email_meeting_section` | Confirmed exists in `class-email-sender.php` — but only for customer email, not staff | Staff email has no equivalent hook |
| `bookit_after_booking_created` | Core staff notifier subscribes to this at priority 10 — extension must use priority 20+ to fire after | Task 4 uses priority 10 for link generation (fires before staff email — correct) |

---

## Known Gotchas Specific to This Plugin

In addition to the gotchas already in `cursor-prompt-generator-meetings.md`:

| Gotcha | Detail |
|--------|--------|
| `$wpdb->get_var()` + empty string | Returns PHP `null` for `''`. Use `get_col()` for any setting that may be empty. |
| `$booking` array in filters | May be stale if a hook in the same request wrote to the DB. Always re-read required fields from DB inside filter callbacks. |
| DDL tests in `WP_UnitTestCase` | `ALTER TABLE` / `CREATE TABLE` cause implicit commits in MariaDB, breaking WP's test transaction wrapper. Never test `down()` in PHPUnit — test `up()` only, verify `down()` manually. |
| `class_alias()` in migration | Required because migration runner derives class name from filename. Do not remove until core REQUEST 2 is implemented. |
| Two wp-env environments | `localhost:8890` = dev site, `localhost:8891` = test site. SQL commands need `wp-env run development` vs `wp-env run tests-cli`. Settings set in one environment are not visible in the other. |
| `metting.local` is a separate env | Manual end-to-end testing uses a local site (`metting.local`) separate from wp-env. Settings must be set independently in each environment. |
| Confirmation page needs booking_id in URL | The confirmation page template reads `?booking_id=` from the URL. Navigating directly to `/booking-confirmed-v2/` without a `booking_id` param shows the page with no booking context. |
- **Plugin deactivation wipes settings** → deactivating the extension runs 
  migration down() which deletes all rows from {prefix}bookings_settings 
  that belong to this plugin (meetings_enabled, meetings_platform, 
  meetings_manual_url). After reactivation, all settings are back to 
  defaults. Always re-configure settings in the admin UI after any 
  deactivate/reactivate cycle in wp-env. This is expected behaviour — 
  not a bug.


# Bookit Meetings — Sprint Progress Log

---

## Sprint 2 — Dashboard Vue App

**PHPUnit baseline entering Sprint 2:** 45 tests, 94 assertions, 0 failures
**PHPUnit baseline exiting Sprint 2:** 51 tests, 107 assertions, 0 failures

---

### Task 1 — Backend Wiring ✅ Complete

**What was built:**
- `bookit_dashboard_loaded` action → enqueues Vue app JS/CSS via `Bookit_Meetings_Assets`
- `bookit_dashboard_js_data` filter → injects `meetings_enabled`, `meetings_platform`, `meetings_manual_url` into JS data object (localised as `window.bookitMeetings`)
- `bookit_booking_response` filter → adds `meeting_link` to every booking API response (re-read from DB)
- New class: `bookit-meetings/includes/class-bookit-meetings-assets.php`

**Fix applied mid-task:**
- `bookit_booking_response` filter signature: second argument is `int $booking_id`, NOT `array $booking`. Core calls `apply_filters('bookit_booking_response', $response, $booking_id)` — the ID is an integer. Cursor initially typed the parameter as `array $booking` causing a PHP fatal. Corrected to `int $booking_id`.

**Also fixed:**
- `down()` in `0001-add-meetings-schema.php` — `ALTER TABLE ... DROP COLUMN IF EXISTS` is not supported on older MariaDB. Replaced with `information_schema.COLUMNS` guard check + plain `DROP COLUMN` (no `IF EXISTS`).
- Migration `up()` settings insert changed to `INSERT ... ON DUPLICATE KEY UPDATE setting_value = IFNULL(VALUES(setting_value), setting_value)` for reliable idempotency.

**PHPUnit result:** 51 tests, 107 assertions, 0 failures

---

### Task 2 — Vite Scaffold ✅ Code complete | ⚠️ Visual rendering pending core hook

**What was built:**
- `dashboard/vite.config.js` — `base: './'`, fixed output filenames (`app.js` / `app.css`)
- `dashboard/package.json` — Vue 3.5, Vite 8, @vitejs/plugin-vue 6
- `dashboard/index.html`, `dashboard/src/main.js`, `dashboard/src/App.vue` (placeholder)
- Asset enqueue updated: `glob()` → `file_exists()` on fixed paths
- Mount point div injected via `ob_start()` callback (see Architecture Discovery below)

**Correction (Pre-Sprint 3 Housekeeping, Task 4):** Mount div injection switched from `ob_start()` + `str_replace` to `add_action('bookit_dashboard_extension_content', ...)`. JS script injection remains in `ob_start()` (still required — core template does not call `wp_footer()`). File: `class-bookit-meetings-assets.php`.

**Architecture discovery — permanent pattern:**
The Bookit dashboard HTML page does NOT call `wp_head()` or `wp_footer()`. It is a fully custom PHP template at `bookit-booking-system/dashboard/app/index.php`. This means:
- `wp_enqueue_script()` does NOT output script tags on the dashboard
- `wp_enqueue_style()` DOES work (core calls `wp_print_styles()` in `<head>`)
- Mount point divs and JS module scripts must be injected via `ob_start()` buffer

**Confirmed working (JS injection):**
```php
ob_start( function( string $html ) use ( $js_url ): string {
    $current_path = $_SERVER['REQUEST_URI'] ?? '';
    if ( str_contains( $current_path, '/bookit-dashboard/app/meetings' ) ) {
        $data   = apply_filters( 'bookit_dashboard_js_data', [] );
        $json   = wp_json_encode( $data );
        $inject = '<script>window.bookitMeetings = ' . $json . ';</script>' . "\n";
        $inject .= '<script type="module" src="' . esc_url( $js_url ) . '"></script>' . "\n";
        $inject .= '<div id="bookit-meetings-app"></div>' . "\n";
        return str_replace( '</body>', $inject . '</body>', $html );
    }
    return $html;
} );
```
`window.bookitMeetings` confirmed populated in browser console ✅
`app.js` confirmed loading (HTTP 200) ✅

**Visual rendering blocked:**
The `#bookit-meetings-app` div is injected before `</body>` but renders BELOW core's fixed-height `#app` container (y: 698px, outside viewport). Requires core hook `bookit_dashboard_extension_content` to inject inside core's layout. See Core Hook Requests below.

**Route guard confirmed working:**
`main.js` guards mount to `/bookit-dashboard/app/meetings` path only. Other pages unaffected.

**PHPUnit result:** 51 tests, 107 assertions, 0 failures

---

### Task 3 — Meetings Settings Page ✅ Code complete | ⚠️ Visual rendering pending core hook

**What was built:**
- `dashboard/src/router/index.js` — Vue Router with `createWebHashHistory()` (hash mode avoids conflict with core URL routing)
- `dashboard/src/views/SettingsView.vue` — full settings form
- `dashboard/src/components/ToggleSwitch.vue`
- `dashboard/src/components/PlatformSelector.vue` — WhatsApp, Teams, Generic (active); Zoom, Google Meet (disabled, "Coming Soon")
- `dashboard/src/components/ManualUrlField.vue`
- `dashboard/src/App.vue` updated to use `<RouterView />`

**API wiring:**
- `GET bookit-meetings/v1/settings` on mount
- `POST bookit-meetings/v1/settings` on save
- All requests include `X-WP-Nonce: window.BOOKIT_DASHBOARD.nonce`
- `meetings_enabled` converted: string `"0"`/`"1"` at API boundary ↔ boolean inside Vue

**Visual rendering:** Blocked on `bookit_dashboard_extension_content` core hook (same as Task 2).

**PHPUnit result:** 51 tests, 107 assertions, 0 failures

---

### Task 4 — Booking Detail Panel ✅ Code complete | ⚠️ Visual rendering pending core hook

**What was built:**
- `dashboard/src/views/BookingDetailView.vue` — always-mounted, renders nothing until booking detected
- `dashboard/src/components/MeetingInfoPanel.vue` — Teams/Generic: join link + copy button; WhatsApp: customer phone + `tel:` link

**Architecture discovery — booking detail approach:**
Core's booking detail is a modal-only (`BookingViewModal.vue`) with no URL change. The booking ID is not stored in the DOM. Extension uses `window.fetch` intercept to detect `GET /dashboard/bookings/{id}` calls and MutationObserver to detect modal close:

```js
// Detect booking open
const originalFetch = window.fetch
window.fetch = async ( ...args ) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url ?? ''
    const match = url.match( /\/dashboard\/bookings\/(\d+)$/ )
    if ( match ) {
        activeBookingId.value = parseInt( match[1], 10 )
        await loadMeetingInfo( activeBookingId.value )
    }
    return originalFetch( ...args ) // use original to avoid recursion
}
// Detect modal close via MutationObserver
// selector: div[role="dialog"][aria-labelledby="booking-view-modal-title"]
```

**Key confirmed field:** `customer_phone` (confirmed from `class-dashboard-bookings-api.php` SQL alias).

**Visual rendering:** Blocked on `bookit_dashboard_extension_content` core hook.

**PHPUnit result:** 51 tests, 107 assertions, 0 failures

---

### Task 5 — My-Schedule Meeting Indicator 🚫 Blocked — requires core changes

**Blocked on:**

1. `GET /dashboard/my-schedule` does not apply `bookit_booking_response` filter. It uses `format_schedule_booking()` which returns a fixed shape with no `meeting_link` field and no extension filter point.

2. Booking card DOM elements in `MySchedule.vue` have no `data-*` attribute containing the booking ID — only `:key="booking.id"` which is a Vue internal and not rendered to the DOM. Badge injection requires a stable DOM selector.

**Required core changes (see Core Hook Requests below):**
- `bookit_schedule_booking_response` filter in `format_schedule_booking()`
- `data-booking-id` attribute on booking card `<div>` elements in `MySchedule.vue`

**PHPUnit result:** 51 tests, 107 assertions, 0 failures (unchanged — no code written)

---

## Core Hook Requests — Sprint 2

### REQUEST 4 — `bookit_dashboard_extension_content` action (BLOCKING)

**File to modify:** `bookit-booking-system/dashboard/app/index.php`

**What to add:**
```php
<?php do_action( 'bookit_dashboard_extension_content' ); ?>
```

**Where:** Inside the main content area `<div>`, after the `<router-view>` equivalent and before the closing content container div. Must be inside core's layout container, not after `</body>`.

**Why:** The dashboard HTML page is a fully custom PHP template that does not use WordPress's standard `wp_head()`/`wp_footer()` hooks. Extension Vue apps inject their mount point div before `</body>` via `ob_start()`, but this places them below core's fixed-height `#app` container (y: 698px), making them invisible. The `bookit_dashboard_extension_content` action would fire inside the layout where extensions can render their content correctly.

**Impact:** Tasks 2, 3, and 4 are all code-complete but cannot be visually verified or used until this hook lands. This blocks sprint acceptance for all Vue dashboard work.

**Priority:** High — blocking.

---

### REQUEST 5 — `bookit_schedule_booking_response` filter (BLOCKING Task 5)

**File to modify:** `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`

**What to add:** At the end of `format_schedule_booking()`, before `return`:
```php
$formatted = apply_filters( 'bookit_schedule_booking_response', $formatted, (int) $row['id'] );
return $formatted;
```

**Why:** `GET /dashboard/my-schedule` uses `format_schedule_booking()` which returns a fixed shape without calling `bookit_booking_response`. Extensions cannot add fields (e.g. `meeting_link`) to schedule booking cards without this filter point. Follows the exact same pattern as the existing `bookit_booking_response` filter.

**Priority:** Medium — blocks Task 5 only.

---

### REQUEST 6 — `data-booking-id` attribute on my-schedule booking cards (BLOCKING Task 5)

**File to modify:** `bookit-booking-system/dashboard/src/views/MySchedule.vue`

**What to add:** On each booking card `<div>` in the `v-for` loops (Today, Week, Upcoming sections):
```html
<div
  v-for="booking in todayBookings"
  :key="booking.id"
  :data-booking-id="booking.id"
  class="bg-white rounded-lg shadow p-4"
>
```
Same change for week cards and upcoming cards.

**Why:** The extension needs to inject a meeting indicator badge into booking cards via MutationObserver + DOM selector. Currently cards have no stable DOM attribute containing the booking ID — only `:key` which is Vue-internal. Without `data-booking-id`, the extension cannot reliably target individual cards for badge injection.

**Priority:** Medium — blocks Task 5 badge injection approach.

---

### REQUEST 7 — Confirm `bookit_booking_response` filter signature in API spec (DOCUMENTATION)

**Spec to update:** `Extension_Plugin_API_Spec.md` — `bookit_booking_response` filter documentation.

**Issue:** The spec example implies `$booking` is an array:
```php
add_filter( 'bookit_booking_response', function( array $response_data, int $booking_id ): array {
```
But the actual core call is:
```php
apply_filters( 'bookit_booking_response', $response, $booking_id )
```
Where `$booking_id` is an **integer**, not an array. Cursor initially typed the second parameter as `array $booking` which caused a PHP fatal (`TypeError: Argument #2 ($booking) must be of type array, int given`).

**Requested action:** Confirm whether the spec example is correct or if the second parameter was intended to be an array. If integer is correct, update the spec to explicitly type it as `int $booking_id` and add a note that the full booking array is NOT passed — only the ID. Extensions that need booking data must re-read from DB.

**Priority:** Low — documentation only, no code change needed.

---

## Core Hook Discoveries — Sprint 2

These are behaviours discovered during Sprint 2 that differ from what the
documentation or spec implied. Captured here so future prompts don't repeat
mistakes.

### Discovery 1 — Dashboard template does not use wp_head()/wp_footer()

`bookit-booking-system/dashboard/app/index.php` is a fully custom PHP HTML
template. It does NOT call `wp_head()` or `wp_footer()`.

**Consequences for extension development:**
- `wp_enqueue_script()` does NOT output `<script>` tags on the dashboard — scripts must be echoed directly or injected via `ob_start()`
- `wp_enqueue_style()` DOES work — core calls `wp_print_styles()` in `<head>`
- `wp_localize_script()` does NOT work — use inline `<script>window.myData = {...}</script>` instead
- Mount point divs must be injected via `ob_start()` buffer on the `bookit_dashboard_loaded` hook

**Confirmed working pattern (JS injection only — DOM placement pending core hook):**
See Task 2 implementation above.

### Discovery 2 — `bookit_dashboard_loaded` fires before `<!DOCTYPE html>`

The `do_action('bookit_dashboard_loaded', $current_staff)` call in
`index.php` fires at line ~30, before the HTML template begins output at
line ~59. Any `echo` inside a `bookit_dashboard_loaded` callback lands
before `<!DOCTYPE html>`, breaking the HTML document.

Use `ob_start()` to capture subsequent output and inject via `str_replace('</body>', ...)`.

### Discovery 3 — Core routing: sidebar extension links are plain `<a href>` not router-links

Extension nav items registered via `bookit_register_nav_item()` are rendered
in `Sidebar.vue` as plain `<a :href="item.route">` anchors, not `<router-link>`
components. Clicking an extension nav item causes a **full page reload** to the
registered route URL, not a client-side navigation.

**Consequence:** Each extension page load is a fresh PHP request. The extension
Vue app must initialise from scratch on each visit. State does not persist
across navigation (as expected for separate pages).

### Discovery 4 — Core catch-all rewrite serves core SPA shell for all /app/* routes

`bookit-booking-system/includes/class-bookit-loader.php` registers:
```php
add_rewrite_rule( '^bookit-dashboard/app(/.*)?$', 'index.php?bookit_dashboard_page=app', 'top' );
```
This means `/bookit-dashboard/app/meetings` is served by the same core SPA
template as `/bookit-dashboard/app/bookings`. Core does NOT have separate
template handlers per extension route.

### Discovery 5 — Booking detail is modal-only, no URL change

`BookingViewModal.vue` is mounted by `Bookings.vue` with no URL update when
opened. The booking ID is not stored in any DOM attribute — only in Vue's
reactive state (`selectedBookingId`). Extensions must use `window.fetch`
intercept to detect booking detail opens.

Reliable modal selector: `div[role="dialog"][aria-labelledby="booking-view-modal-title"]`

### Discovery 6 — `GET /dashboard/my-schedule` bypasses `bookit_booking_response` filter

`get_my_schedule()` uses `format_schedule_booking()` — a private helper that
returns a fixed shape without calling `apply_filters('bookit_booking_response', ...)`.
Extensions cannot add fields to schedule booking responses without a dedicated
filter point (`bookit_schedule_booking_response` — see Core Hook Requests).

### Discovery 7 — MariaDB does not support `DROP COLUMN IF EXISTS`

`ALTER TABLE {table} DROP COLUMN IF EXISTS {column}` is not supported on
older MariaDB versions used by Local by Flywheel. Always guard column drops
with an `information_schema.COLUMNS` check:
```php
$column_exists = $wpdb->get_col( $wpdb->prepare(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
    DB_NAME, $wpdb->prefix . 'bookings', 'meeting_link'
) );
if ( ! empty( $column_exists ) ) {
    $wpdb->query( "ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN meeting_link" );
}
```

---

## Updated `cursor-prompt-generator-meetings.md` — New Gotchas to Add

Add the following entries to the KNOWN GOTCHAS section:

```markdown
- **Task enqueues JS on the dashboard** → `wp_enqueue_script()` does NOT output
  script tags on the Bookit dashboard (the template does not call `wp_footer()`).
  Use `ob_start()` on the `bookit_dashboard_loaded` hook to inject JS module
  scripts and inline data directly into the HTML before `</body>`. CSS can still
  use `wp_enqueue_style()` (core calls `wp_print_styles()` in `<head>`).
  Do NOT use `wp_localize_script()` — use inline `<script>window.myVar = {...}</script>`.

- **Task injects mount point div on the dashboard** → The div must be injected
  via `ob_start()` str_replace before `</body>`. Only inject when
  `$_SERVER['REQUEST_URI']` contains the extension route (e.g.
  `/bookit-dashboard/app/meetings`) to avoid rendering on all pages.
  Visual placement requires the core `bookit_dashboard_extension_content`
  hook (pending — Sprint 2 core request).

- **Task reads booking data in my-schedule context** → `GET /dashboard/my-schedule`
  uses `format_schedule_booking()` which does NOT apply `bookit_booking_response`
  filter. `meeting_link` will not be present in my-schedule responses until
  core adds `bookit_schedule_booking_response` filter (pending — Sprint 2 core request).

- **Task detects open booking detail modal** → Core's booking detail is modal-only
  with no URL change. Detect via `window.fetch` intercept watching for
  `/dashboard/bookings/{id}` calls. Detect modal close via MutationObserver
  watching for removal of `div[role="dialog"][aria-labelledby="booking-view-modal-title"]`.
  Always use the `originalFetch` reference for the extension's own API calls
  inside the intercept to avoid infinite recursion.

- **Task uses Vue Router in extension dashboard** → Use `createWebHashHistory()`
  (hash mode). Never use `createWebHistory()` — it conflicts with core's
  catch-all URL rewrite rule that serves the core SPA shell for all
  `/bookit-dashboard/app/*` paths.

- **`bookit_booking_response` filter second argument** → Is `int $booking_id`,
  NOT `array $booking`. Core calls `apply_filters('bookit_booking_response', $response, $booking_id)`
  where the second argument is the raw integer ID. Always type as `int $booking_id`.
  Never type as `array $booking` — this causes a PHP fatal.

- **MariaDB `DROP COLUMN IF EXISTS` not supported** → Use `information_schema.COLUMNS`
  guard in `down()`. Never use `ALTER TABLE ... DROP COLUMN IF EXISTS`.
```

---

## PHPUnit Baseline for Sprint 3

**51 tests, 107 assertions, 0 failures**

Tasks blocked (Task 5) and tasks pending visual verification (Tasks 2, 3, 4)
do not affect the PHPUnit baseline — all tests pass green.


---

## Pre-Sprint 3 Housekeeping — Environment + Cleanup

**Goal:** Upgrade to core v1.5.1, remove workarounds made redundant by that release, keep PHPUnit green throughout.
**PHPUnit baseline entering:** 51 tests, 107 assertions, 0 failures
**PHPUnit baseline exiting:** 51 tests, 107 assertions, 0 failures

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Update environment to core v1.5.1 | ✅ Complete | Folder copy to `../bookit-booking-system`; `.wp-env.json` unchanged (local path reference) |
| 2 | Fix `migration_id()` + remove `class_alias()` | ✅ Complete | See Architecture Corrections below |
| 3 | Remove DB re-reads from customer surfaces | ⛔ Cancelled | See Architecture Corrections below |
| 4 | Switch dashboard mount point to `bookit_dashboard_extension_content` | ✅ Complete | Mount div now inside `#app`; Vue renders correctly |

### Architecture Corrections (from this housekeeping sprint)

#### Task 2 — `migration_id()` was wrong, not just the alias

The `class_alias()` workaround recorded in Sprint 1 was papering over a deeper bug: `migration_id()` was returning `'meetings-0001-add-meetings-schema'` with a `meetings-` prefix, but core v1.5.1's runner derives `$migration_id` from the filename (`pathinfo()` → `'0001-add-meetings-schema'`) and matches by `migration_id()` value. The prefix caused the match to fail under v1.5.1.

**Fix applied:**
- `migration_id()` now returns `'0001-add-meetings-schema'` (no prefix)
- `class_alias()` block removed (runner no longer needs it)

**Updated conventions — supersede Sprint 1 decisions:**

| Convention | Old (Sprint 1) | New (correct) |
|------------|---------------|---------------|
| Class name | `Bookit_Migration_Meetings_NNNN_Description` | Unchanged — keep slug prefix to avoid PHP class name collisions |
| `migration_id()` | `'meetings-NNNN-description'` | `'NNNN-description'` — must match filename exactly (no plugin prefix) |
| `plugin_slug()` | `'bookit-meetings'` | Unchanged |
| `class_alias()` | Required workaround | Removed — never use in future migrations |

**Rule for all future migrations:** `migration_id()` must return exactly `pathinfo( $filename, PATHINFO_FILENAME )` — i.e. the filename without `.php`, with no prefix added.

#### Task 3 — DB re-read in customer surfaces is CORRECT, not a workaround

The sprint brief stated that core v1.5.1 re-fetches `$booking` after `bookit_after_booking_confirmed` fires, making the extension's own DB re-read redundant. **This was incorrect.**

Code review of `bookit-booking-system/public/templates/booking-confirmed-v2.php` confirmed that the re-fetch SELECT lists core columns only — it does not and should not include `meeting_link`. Extension-owned data is not core's responsibility to re-fetch.

**Outcome:** The DB re-read inside `confirmation_page_section()` and `confirmation_email_section()` is the correct architectural pattern. It stays. Task 3 was cancelled.

**Updated KNOWN GOTCHA — supersedes previous entry:**
> The `$booking` array passed to `bookit_confirmation_meeting_section` and `bookit_email_meeting_section` filter callbacks does NOT contain extension-owned fields (e.g. `meeting_link`). Core's re-fetch in `booking-confirmed-v2.php` only covers core columns. Extensions must re-read their own data from the DB inside the filter callback. This is the correct pattern — do not remove it.

#### Task 4 — Dashboard file is `class-bookit-meetings-assets.php`, not `class-bookit-meetings-dashboard.php`

The mount point injection (`ob_start()` + `str_replace`) lived in `bookit-meetings/includes/class-bookit-meetings-assets.php` inside `enqueue_dashboard_assets()`, not in a separate dashboard class. The `ob_start()` callback handled both JS script injection and mount div injection in a single function. Task 4 split these: JS injection remains in `ob_start()` (required — core dashboard template does not call `wp_footer()`), mount div moved to `add_action('bookit_dashboard_extension_content', ...)`.

**Visual verification result:** Vue app renders correctly inside `<div id="app">`. Two cosmetic layout issues noted for Sprint 3:
1. Nav sidebar overlaps the Vue app in desktop view (pre-existing CSS issue)
2. Large blank space above the Vue app content (layout/padding issue inside core container)

Neither is a regression from Task 4 — both are Sprint 3 CSS items.


# Bookit Meetings — Project Progress Log
**Plugin:** bookit-meetings (extension of bookit-booking-system v1.5.1)
**Phase:** 1 of 2
**Last updated:** May 2026

---

## PHPUnit Baseline (Critical — update after every sprint)

| Sprint | Tests | Assertions | Failures | Date |
|--------|-------|------------|----------|------|
| Start  | 0     | 0          | 0        | Apr 2026 |
| Sprint 1 exit | 45 | 94 | 0 | Apr 2026 |
| Sprint 2 exit | 51 | 107 | 0 | Apr 2026 |
| Pre-Sprint 3 Housekeeping exit | 51 | 107 | 0 | May 2026 |
| Sprint 2.5 exit | 51 | 107 | 0 | May 2026 |

**Sprint 3 baseline: 51 tests, 107 assertions, 0 failures**

---

## Sprint Log

### Sprint 1 — Plugin Scaffold + Core PHP
**Period:** April 2026
**Goal:** All PHP logic complete, all PHPUnit tests passing, plugin activates cleanly, link generation works end-to-end.

| Task | Description | Status | Tests added | Notes |
|------|-------------|--------|-------------|-------|
| 1 | Plugin scaffold | ✅ Complete | 4 tests, 11 assertions | wp-env PHP 8.2 (prompt specified 8.0 — no issues) |
| 2 | Database migrations | ✅ Complete | +4 tests, +14 assertions | Required significant debugging — see deviations |
| 3 | REST API | ✅ Complete | +14 tests, +37 assertions | Core API path wrong in prompt — Cursor found correct path |
| 4 | Link generation | ✅ Complete | +10 tests, +21 assertions | Hooks confirmed in core before implementation |
| 5 | Customer-facing surfaces | ✅ Complete | +13 tests, +20 assertions | Stale booking array bug found and fixed — see deviations |
| 6 | Staff notification email | ⏸️ Blocked | 0 | No extension hooks in core staff email — see open questions |

**Sprint 1 exit: 45 tests, 94 assertions, 0 failures**

---

### Sprint 2 — Dashboard Vue App
**PHPUnit baseline entering Sprint 2:** 45 tests, 94 assertions, 0 failures
**PHPUnit baseline exiting Sprint 2:** 51 tests, 107 assertions, 0 failures

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Backend wiring | ✅ Complete | bookit_dashboard_loaded, bookit_dashboard_js_data, bookit_booking_response |
| 2 | Vue app scaffold + asset injection | ✅ Complete | ob_start() injection; mount div inside #app via bookit_dashboard_extension_content |
| 3 | Meetings settings page | ✅ Complete | ToggleSwitch, PlatformSelector, ManualUrlField, SettingsView |
| 4 | Booking detail panel | ✅ Code complete | Blocked on axios discovery — see Sprint 2.5 Task 3 |
| 5 | My-schedule meeting indicator | ⏸️ Blocked | Requires core REQUEST 5 + 6 |

**Sprint 2 exit: 51 tests, 107 assertions, 0 failures**

---

### Pre-Sprint 3 Housekeeping — Environment + Cleanup
**Goal:** Upgrade to core v1.5.1, remove workarounds, confirm Vue mounts correctly inside `#app`.
**PHPUnit baseline entering:** 51 tests, 107 assertions, 0 failures
**PHPUnit baseline exiting:** 51 tests, 107 assertions, 0 failures

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Update environment to core v1.5.1 | ✅ Complete | |
| 2 | Fix migration_id() + remove class_alias() | ✅ Complete | See Architecture Corrections |
| 3 | Remove DB re-reads from customer surfaces | ⛔ Cancelled | DB re-read is correct pattern — see Architecture Corrections |
| 4 | Switch dashboard mount point to bookit_dashboard_extension_content | ✅ Complete | Vue renders correctly inside #app |

---

### Sprint 2.5 — Verification + Completion
**PHPUnit baseline entering:** 51 tests, 107 assertions, 0 failures
**PHPUnit baseline exiting:** 51 tests, 107 assertions, 0 failures

| Task | Type | Description | Status | Notes |
|------|------|-------------|--------|-------|
| 1 | Verify | Customer confirmation page | ✅ Passed | Teams, WhatsApp, Disabled all verified |
| 2 | Verify | Meetings settings page | ✅ Passed | Required Task 2a CSS fix first |
| 2a | Fix | CSS variables + debug output removal | ✅ Complete | Core dashboard does not provide --bookit-bg-card etc. |
| 3 | Verify | Booking detail panel | ⛔ Blocked | Core uses axios not window.fetch — see new core REQUEST 8 |
| 4 | Verify | Customer confirmation email | ✅ Passed | Teams, WhatsApp, Disabled all verified via Mailpit |
| 5 | Build | My-schedule meeting indicator | ⏸️ Deferred | Blocked on core REQUEST 5 + 6 + 8 |
| 6 | Build | CSS layout fixes | ⚠️ Partial | padding removed ✅, sidebar overlap fixed ✅, vertical position blocked on core REQUEST 9 |

**Sprint 2.5 exit: 51 tests, 107 assertions, 0 failures**

---

## Decisions Made Mid-Sprint

### Migration class naming convention
**Decision:** All migration classes must be prefixed with the plugin slug:
`Bookit_Migration_Meetings_NNNN_Description` (not `Bookit_Migration_NNNN_Description`).

**Reason:** PHP class names are global. Core uses `Bookit_Migration_0001_*` and a collision causes a fatal. The slug prefix guarantees uniqueness.

**Applies to:** All migration files in this plugin, now and in future sprints.

### Migration ID convention (corrected Pre-Sprint 3 Housekeeping)
`migration_id()` must return exactly the filename stem — `'NNNN-description'` with no plugin prefix. Core v1.5.1 runner matches by `migration_id()` value against `pathinfo( $filename, PATHINFO_FILENAME )`. A prefix causes the match to fail.

### DB re-read for extension-owned fields is the correct pattern
Core's re-fetch in `booking-confirmed-v2.php` covers core columns only. Extension-owned fields (e.g. `meeting_link`) must always be re-read from DB inside filter callbacks. This is correct architecture, not a workaround.

---

## Architecture Corrections (from Housekeeping + Sprint 2.5)

### `migration_id()` convention
| Convention | Old (Sprint 1) | New (correct) |
|------------|----------------|---------------|
| Class name | `Bookit_Migration_Meetings_NNNN_Description` | Unchanged — keep slug prefix |
| `migration_id()` | `'meetings-NNNN-description'` | `'NNNN-description'` — must match filename exactly |
| `class_alias()` | Required workaround | Removed — never use in future migrations |

### CSS variables on the dashboard (discovered Sprint 2.5 Task 2a)
The Bookit dashboard `:root` block (in `style.*.css`) only defines `--bookit-primary` and `--bookit-primary-*` shade variables. It does NOT define `--bookit-bg-card`, `--bookit-border-color`, `--bookit-text-primary`, `--bookit-text-secondary`, or `--bookit-color-primary`. These variables are defined in `booking-wizard-v2.css` which is a public-facing stylesheet never loaded on the dashboard.

**Fix applied:** All missing variables defined on `#bookit-meetings-app { }` in `App.vue` (unscoped style block). `--bookit-color-primary` maps to `var(--bookit-primary)` which core does provide.

**Rule for all extensions:** Never assume `--bookit-bg-card` or other non-primary variables are available on the dashboard. Define them yourself on your app's root element.

### Vue Router for extension dashboard apps (confirmed Sprint 2.5)
Vue Router must use `createWebHashHistory()`. The extension app must NOT use Vue Router for routing between dashboard pages — use pathname-based computed refs instead (see SPA navigation discovery below).

**Pattern confirmed working:**
```js
const isMeetingsPage = ref(
    window.location.pathname.includes('/bookit-dashboard/app/meetings')
)
const originalPushState = history.pushState.bind(history)
history.pushState = function(...args) {
    originalPushState(...args)
    isMeetingsPage.value = window.location.pathname.includes('/bookit-dashboard/app/meetings')
}
```
Full confirmed working pattern (from App.vue):

const isMeetingsPage = ref(
    window.location.pathname.includes('/bookit-dashboard/app/meetings')
)

function onPopState() {
    isMeetingsPage.value = window.location.pathname
        .includes('/bookit-dashboard/app/meetings')
}

const originalPushState = history.pushState.bind(history)
history.pushState = function(...args) {
    originalPushState(...args)
    isMeetingsPage.value = window.location.pathname
        .includes('/bookit-dashboard/app/meetings')
}

const originalReplaceState = history.replaceState.bind(history)
history.replaceState = function(...args) {
    originalReplaceState(...args)
    isMeetingsPage.value = window.location.pathname
        .includes('/bookit-dashboard/app/meetings')
}

onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => {
    window.removeEventListener('popstate', onPopState)
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
})

// Template — BookingDetailView always mounted, SettingsView only on /meetings
<BookingDetailView />
<SettingsView v-if="isMeetingsPage" />

Note: history.replaceState must be patched alongside pushState — 
core uses both. Omitting replaceState causes missed navigation events.
### Core uses axios, not window.fetch, for booking detail (discovered Sprint 2.5 Task 3)
`BookingViewModal.vue` fetches booking data via `useApi()` which wraps axios. Axios uses `XMLHttpRequest` by default, completely bypassing `window.fetch`. The extension's `window.fetch` intercept never fires for booking detail modal requests.

**Impact:** The `BookingDetailView.vue` fetch intercept approach does not work for detecting booking modal opens. A new approach is needed — see Core REQUEST 8.

**Lesson for other extension developers:** Do not assume core HTTP calls go through `window.fetch`. Always verify using browser DevTools Network tab — check the "Initiator" column to see if requests come from `axios` or native `fetch`.

### Core SPA navigation is mixed (discovered Sprint 2.5 Task 3)
Navigation between dashboard pages is a mix of full page reloads and client-side SPA navigation:
- Clicking extension nav items (registered via `bookit_register_nav_item()`) → **full page reload** (plain `<a href>` anchors)
- Clicking core nav items from an extension page → **client-side SPA navigation** (Vue Router `pushState`)

**Consequence:** Extension Vue app state does not persist across full reloads (expected), but does need to handle client-side navigation correctly. `window.location.pathname` is not reactive — must be patched via `history.pushState` intercept or `popstate` event listener.

**Pattern confirmed working:** See Vue Router section above.

### `#bookit-meetings-app` is a sibling of `#app`, not inside it (confirmed Sprint 2.5 Task 6)
The `bookit_dashboard_extension_content` hook fires after core's `#app` container closes. This means `#bookit-meetings-app` is a sibling of `#app` in the DOM, not a child. Consequences:
- Extension content renders **below** core's content area, not inside it
- Extension container does not inherit core's `lg:ml-64` margin, so it sits under the fixed sidebar on desktop

**Workaround applied:**
```css
@media (min-width: 1024px) {
  #bookit-meetings-app {
    margin-left: 16rem; /* matches core's lg:ml-64 */
  }
}
```

**Long-term fix needed:** Core REQUEST 9 — move `do_action('bookit_dashboard_extension_content')` to fire inside core's main content wrapper, not after `#app`.

---

## Open Questions / Carry-Forwards

### Task 5 — My-schedule meeting indicator (BLOCKED)
**Status:** Blocked pending core REQUEST 5, 6, and 8.

### Task 3 — Booking detail panel (BLOCKED)
**Status:** Blocked on core REQUEST 8 — core uses axios not window.fetch.

### Sprint 1 Task 6 — Staff notification email (BLOCKED)
**Status:** Blocked pending core REQUEST 1 (staff email hook).

---

## Core Hook Requests

### REQUEST 1 — Staff notification email hook (Sprint 1)
**File:** `bookit-booking-system/includes/notifications/class-bookit-staff-notifier.php`
**What:** `apply_filters('bookit_staff_email_content', $html, $booking_id)` or `do_action('bookit_after_staff_email_sent', $booking_id)` inside or around staff email HTML generation.
**Why:** No extension hook exists in the staff email build path. Extensions cannot inject meeting link into staff emails without sending a separate email (bad UX).
**Priority:** Medium.

### REQUEST 2 — Migration runner class lookup by plugin_slug (Sprint 1)
**File:** `bookit-booking-system/includes/class-bookit-migration-runner.php`
**What:** Look up migration classes by `plugin_slug()` + `migration_id()` rather than filename-derived class name.
**Why:** Eliminates need for `class_alias()` workaround and makes naming convention clean.
**Status:** Workaround removed in Pre-Sprint 3 Housekeeping (migration_id() fix). Still a good improvement.
**Priority:** Low.

### REQUEST 3 — `bookit_after_booking_confirmed` hook fires for all confirmation paths (Sprint 1)
**File:** `bookit-booking-system/public/templates/booking-confirmed-v2.php`
**What:** Confirm hook fires for all booking confirmation paths including pay-on-arrival.
**Finding (Sprint 2.5):** `bookit_after_booking_created` hook fires reliably for all bookings. The extension now hooks this instead. `bookit_after_booking_confirmed` may never fire in local testing because pay-on-arrival bookings stay at `pending_payment` status and are never manually confirmed.
**Priority:** Low — extension works correctly without this.

### REQUEST 4 — `bookit_dashboard_extension_content` action (Sprint 2) ✅ IMPLEMENTED in v1.5.1
**File:** `bookit-booking-system/dashboard/app/index.php`
**Status:** Confirmed working in v1.5.1. Hook fires after `<div id="app">`. Extension mount div injected correctly.
**Remaining issue:** Hook fires as a sibling of `#app`, not inside core's main content wrapper. See REQUEST 9 for the follow-up.

### REQUEST 5 — `bookit_schedule_booking_response` filter (Sprint 2)
**File:** `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`
**What:** At end of `format_schedule_booking()`, before `return`:
```php
$formatted = apply_filters( 'bookit_schedule_booking_response', $formatted, (int) $row['id'] );
return $formatted;
```
**Why:** `GET /dashboard/my-schedule` uses `format_schedule_booking()` which returns a fixed shape without calling `bookit_booking_response`. Extensions cannot add `meeting_link` to schedule booking cards without this filter.
**Priority:** Medium — blocks Task 5.

### REQUEST 6 — `data-booking-id` attribute on my-schedule booking cards (Sprint 2)
**File:** `bookit-booking-system/dashboard/src/views/MySchedule.vue`
**What:** Add `:data-booking-id="booking.id"` on each booking card `<div>` in the `v-for` loops (Today, Week, Upcoming sections).
**Why:** Extension needs to inject meeting indicator badges into booking cards via MutationObserver. Currently cards have no stable DOM attribute containing the booking ID.
**Priority:** Medium — blocks Task 5 badge injection.

### REQUEST 7 — Confirm `bookit_booking_response` filter signature (Sprint 2 — documentation)
**What:** Confirm that second parameter is `int $booking_id` (confirmed correct). Update `Extension_Plugin_API_Spec.md` to explicitly note that the full booking array is NOT passed — only the ID. Extensions needing booking data must re-read from DB.
**Priority:** Low — documentation only.

### REQUEST 8 — JS event when booking detail modal opens (Sprint 2.5 — NEW, BLOCKING)
**Discovery:** `BookingViewModal.vue` uses axios (`useApi()`) to fetch booking data, not `window.fetch`. The extension's `window.fetch` intercept never fires for booking modal requests. There is no way to reliably detect when a booking modal opens without a core hook.

**Recommended solution:** Fire a custom browser event when `BookingViewModal` mounts and data loads:

**File:** `bookit-booking-system/dashboard/src/components/BookingViewModal.vue`

**What to add** (inside `onMounted` after `loadBooking()` resolves):
```js
// After booking data is loaded successfully:
window.dispatchEvent( new CustomEvent( 'bookit:booking-modal-opened', {
    detail: { bookingId: props.bookingId }
} ) )
```

And when modal closes (inside `@close` handler or `onUnmounted`):
```js
window.dispatchEvent( new CustomEvent( 'bookit:booking-modal-closed', {
    detail: { bookingId: props.bookingId }
} ) )
```

**Extension usage:**
```js
window.addEventListener( 'bookit:booking-modal-opened', async ( e ) => {
    const bookingId = e.detail.bookingId
    // load meeting info for this booking
} )
```

**Why this is better than alternatives:**
- Patching `XMLHttpRequest` is fragile and breaks other extensions
- Patching the axios instance requires access to core's internal instance
- MutationObserver on the modal DOM cannot reliably extract the booking ID
- A custom event is clean, documented, and survives core refactors

**Priority:** High — blocks Task 3 (booking detail panel) and Task 5 (my-schedule indicator).

### REQUEST 9 — Move `bookit_dashboard_extension_content` inside core's main content wrapper (Sprint 2.5 — NEW)
**File:** `bookit-booking-system/dashboard/app/index.php`
**Current behaviour:** `do_action('bookit_dashboard_extension_content')` fires after `</div>` closing core's `#app` container. Extension content renders as a sibling of `#app`, not inside the content area.
**What:** Move the `do_action('bookit_dashboard_extension_content')` call to fire inside core's main content wrapper div (the div that wraps `<router-view>` output), before the closing tag.
**Why:** Extension content currently renders below core's content area. Extensions must apply a `margin-left: 16rem` workaround to avoid sidebar overlap, and content vertical position cannot be controlled from the extension side.
**Impact:** All extensions using `bookit_dashboard_extension_content` will render inside the main content area automatically. Removes need for the `margin-left` workaround.
**Priority:** Medium — visual quality improvement for all extensions.

---

## Core Hook Discoveries

### Discovery 1 — Dashboard template does not use wp_head()/wp_footer()
`bookit-booking-system/dashboard/app/index.php` is a fully custom PHP HTML template. It does NOT call `wp_head()` or `wp_footer()`.

**Consequences:**
- `wp_enqueue_script()` does NOT output `<script>` tags — use `ob_start()` on `bookit_dashboard_loaded`
- `wp_enqueue_style()` DOES work — core calls `wp_print_styles()` in `<head>`
- `wp_localize_script()` does NOT work — use inline `<script>window.myData = {...}</script>`

### Discovery 2 — `bookit_dashboard_loaded` fires before `<!DOCTYPE html>`
The action fires at ~line 30 of `index.php`, before the HTML template begins at ~line 59. Any direct `echo` inside a `bookit_dashboard_loaded` callback breaks the HTML document. Always use `ob_start()`.

### Discovery 3 — Extension nav items are plain `<a href>` anchors
Nav items registered via `bookit_register_nav_item()` render as plain `<a :href>` in `Sidebar.vue`, not `<router-link>`. Clicking causes a **full page reload**, not client-side navigation.

**Consequence:** Extension pages must initialise from scratch on each visit. Do not rely on Vue state persisting across navigation.

### Discovery 4 — Core catch-all rewrite serves core SPA for all /app/* routes
`/bookit-dashboard/app/meetings` is served by the same PHP template as `/bookit-dashboard/app/bookings`. The path is available in `$_SERVER['REQUEST_URI']` and `window.location.pathname`.

### Discovery 5 — Core SPA navigation is client-side for core pages (Sprint 2.5)
When the user is on an extension page and clicks a **core** nav item, navigation is **client-side** via `history.pushState` (Vue Router). The extension Vue app is NOT unmounted and remounted — it stays alive. `window.location.pathname` changes but Vue does not re-render unless told to.

**Consequence:** Extension Vue computed values based on `window.location.pathname` must be reactive. Plain `computed(() => window.location.pathname.includes(...))` does not update. Must intercept `history.pushState` and update a `ref` manually.

### Discovery 6 — Core uses axios (not window.fetch) for all dashboard API calls (Sprint 2.5)
`useApi()` composable in `bookit-booking-system/dashboard/src/composables/useApi.js` wraps axios. All core dashboard HTTP calls use axios with `XMLHttpRequest`, not `window.fetch`.

**Consequence:** Patching `window.fetch` does NOT intercept core API calls. This approach only catches native `fetch()` calls, not axios requests.

**Always verify:** Before assuming `window.fetch` intercept will work, check whether the target request comes from axios or native fetch using browser DevTools Network tab → Initiator column.

### Discovery 7 — CSS variable availability differs between dashboard and public pages (Sprint 2.5)
The Bookit dashboard only provides `--bookit-primary` and `--bookit-primary-*` in its `:root`. The full set of `--bookit-*` variables (bg, text, border) are only available on public-facing pages that load `booking-wizard-v2.css`.

**Rule:** Extensions must define their own fallback values for any CSS variables beyond `--bookit-primary-*`. Define them scoped to your app's root element.

---

## Known Gotchas (consolidated — for Cursor prompts and future sprints)

- **Dashboard JS injection** → `ob_start()` on `bookit_dashboard_loaded` — never `wp_enqueue_script()` or direct echo
- **Dashboard mount div** → `add_action('bookit_dashboard_extension_content', ...)` — never `ob_start()` + `str_replace`
- **Settings reads** → `$wpdb->get_col()` — never `get_option()`, never `$wpdb->get_var()`
- **Extension-owned booking fields** → always re-read from DB inside filter callbacks — core re-fetch covers core columns only
- **Migration class name** → `Bookit_Migration_Meetings_NNNN_Description` (slug prefix) — no `class_alias()`
- **Migration ID** → bare filename stem, no plugin prefix — `'0001-add-meetings-schema'` not `'meetings-0001-...'`
- **DDL tests** → never test `down()` in PHPUnit — MariaDB implicit commits break WP_UnitTestCase
- **MariaDB DROP COLUMN** → guard with `information_schema.COLUMNS` — never `DROP COLUMN IF EXISTS`
- **Vue Router** → `createWebHashHistory()` — never `createWebHistory()`
- **bookit_booking_response second arg** → `int $booking_id` — never `array $booking`
- **Dashboard CSS variables** → define `--bookit-bg-card`, `--bookit-text-primary` etc. on `#your-app { }` — core dashboard does not provide them
- - **Core HTTP calls** → axios (XMLHttpRequest), not window.fetch — intercept window.fetch does NOT catch core API calls. The window.fetch intercept approach documented in earlier sprints does NOT work for detecting booking modal opens. The correct approach is the custom browser event pattern (core REQUEST 8): `window.addEventListener('bookit:booking-modal-opened', (e) => { const bookingId = e.detail.bookingId })`. Until REQUEST 8 lands in core, booking detail panel detection is not possible.
- **SPA navigation** → client-side pushState for core→core navigation; full reload for extension nav items — handle both
- **#bookit-meetings-app position** → sibling of #app, not inside — needs `margin-left: 16rem` at lg breakpoint until REQUEST 9 is implemented