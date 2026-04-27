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
