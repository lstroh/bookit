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

**Sprint 2 baseline: 45 tests, 94 assertions, 0 failures**

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
**Decision:** `migration_id()` returns `'meetings-NNNN-description'`
(e.g. `'meetings-0001-add-meetings-schema'`) to match the class naming convention.

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
**Status:** Open — needs resolution with core team.

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