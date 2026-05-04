Good thinking — these housekeeping changes deserve their own focused sprint rather than being mixed into Sprint 3. Let me produce the handoff prompt now.I have everything I need. I can see the exact code in the actual files — the DB re-reads in `class-bookit-meetings-customer-surfaces.php`, the `class_alias()` block in the migration file, and the test structure. Let me produce the handoff prompt.

---

## Pre-Sprint 3 Housekeeping — Paste into a new chat

---

You are the sprint agent for **Bookit Meetings**, Pre-Sprint 3 Housekeeping.

Before doing anything else, read these project knowledge files in full:

1. `bookit-meetings-overview.md`
2. `Extension_Developer_Handbook.md`
3. `Extension_Context_Brief.md`
4. `Extension_Plugin_API_Spec.md` ← now v1.5.1 — read the updated hook signatures
5. `bookit-meetings-progress.md` ← read carefully — this sprint resolves several items marked open
6. `cursor-prompt-generator-meetings.md` ← apply to every Cursor prompt you produce

---

## Context

Core plugin v1.5.1 has been delivered. It implements all 7 extension requests. Before Sprint 3 (staff email + visual verification of Sprint 2 Vue work) can begin, the extension codebase needs to be cleaned up to remove workarounds that are no longer needed, and the test suite must remain green throughout.

This is a housekeeping sprint — no new features, no new tables, no new REST endpoints. Every change in this sprint is a removal or simplification of existing code.

**PHPUnit baseline entering this sprint: 51 tests, 107 assertions, 0 failures — must not regress.**

---

## Your job in this chat

Work through Tasks 1–4 in order. For each task:

1. **Produce the Cursor prompt** using the `cursor-prompt-generator-meetings.md` skill exactly. Deliver it as a downloadable `.md` file.
2. **Wait for me to confirm the task is complete** — I will paste back the PHPUnit result and confirm.
3. **Update your running sprint log** in-chat — task number, what changed, new PHPUnit count.
4. **Move to the next task.**

After Task 4 is confirmed complete, produce a **Housekeeping Summary** as a downloadable `.md` file containing:
- What was changed per task
- Final PHPUnit count
- Confirmation that all resolved items are closed
- Updated skill file entries to remove or amend (stale gotchas)
- The clean PHPUnit baseline for Sprint 3

I will bring that summary back to the PA chat.

---

## Task list

| Task | Description | Est |
|------|-------------|-----|
| 1 | Update `.wp-env.json` — point to v1.5.1 core zip; verify plugin activates and PHPUnit is green | 30m |
| 2 | Remove `class_alias()` workaround from `0001-add-meetings-schema.php` — core runner now resolves by `migration_id()` | 30m |
| 3 | Remove extra DB re-reads from `confirmation_page_section()` and `confirmation_email_section()` in `class-bookit-meetings-customer-surfaces.php` — core now re-fetches `$booking` from DB after `bookit_after_booking_confirmed` fires, so the filter receives a fresh array with `meeting_link` already set | 1h |
| 4 | Update `ob_start()` mount point injection in `class-bookit-meetings-dashboard.php` — switch from injecting before `</body>` to hooking `bookit_dashboard_extension_content`, which now fires inside the core layout container | 1h |

---

## Task detail

### Task 1 — Update `.wp-env.json` to core v1.5.1

Straightforward environment update. No code changes to extension files.

**What to do:**
- Update the core plugin zip reference in `.wp-env.json` to the v1.5.1 zip
- Run `wp-env start` (or restart if already running)
- Deactivate and reactivate the extension to confirm clean activation
- Run PHPUnit and confirm 51 tests, 107 assertions, 0 failures before proceeding

**Acceptance criteria:**
- Plugin activates without PHP warnings or fatal errors
- PHPUnit: 51 tests, 107 assertions, 0 failures
- No `class_alias()` errors (the runner fix is in v1.5.1 but the alias is still in code — that's fine for now, Task 2 removes it)

---

### Task 2 — Remove `class_alias()` from migration file

**File:** `bookit-meetings/database/migrations/0001-add-meetings-schema.php`

**What to remove:** The entire `class_alias()` block at the bottom of the file:
```php
// Keep migration runner compatibility (expects class name derived from filename).
if ( ! class_exists( 'Bookit_Migration_0001_Add_Meetings_Schema' ) ) {
    class_alias( 'Bookit_Migration_Meetings_0001_Add_Meetings_Schema', 'Bookit_Migration_0001_Add_Meetings_Schema' );
}
```

**Why safe to remove:** Core v1.5.1 `class-bookit-migration-runner.php` now uses `get_declared_classes()` scan and resolves migrations by `migration_id()` + `plugin_slug()`, not by filename-derived class name. The alias is no longer needed and should not be left in as dead code.

**After removing:** Deactivate and reactivate the extension plugin in wp-env to confirm the migration still runs cleanly. Run PHPUnit — count must remain 51 tests, 107 assertions, 0 failures.

---

### Task 3 — Remove extra DB re-reads from customer surfaces

**File:** `bookit-meetings/includes/class-bookit-meetings-customer-surfaces.php`

**Background:** Core v1.5.1 `booking-confirmed-v2.php` now re-fetches `$booking` from the DB immediately after `do_action('bookit_after_booking_confirmed')` fires and before calling `apply_filters('bookit_confirmation_meeting_section', '', $booking)`. This means the `$booking` array passed to both filter callbacks now contains the `meeting_link` value written by Task 4's link generator — the extra DB query inside the filter is no longer needed.

**What to change in `confirmation_page_section()`:**

Remove this block (the manual DB re-read):
```php
$booking_id = isset( $booking['id'] ) ? (int) $booking['id'] : 0;
if ( $booking_id <= 0 ) {
    return $html;
}

global $wpdb;
$results = $wpdb->get_col(
    $wpdb->prepare(
        "SELECT meeting_link FROM {$wpdb->prefix}bookings WHERE id = %d LIMIT 1",
        $booking_id
    )
);
$meeting_link = empty( $results ) ? null : $results[0];
```

Replace with a simple read from the passed array:
```php
$meeting_link = isset( $booking['meeting_link'] ) ? (string) $booking['meeting_link'] : '';
```

Apply the equivalent simplification to `confirmation_email_section()`.

**Tests:** Read `tests/unit/test-customer-surfaces.php` from GitHub before making any changes. The existing tests use a `make_booking()` helper that sets `'meeting_link' => null` in the returned array but writes the real value to the DB. After this change, the tests must pass the `meeting_link` value directly in the array instead — update the `make_booking()` helper and any test that relied on the DB re-read. PHPUnit must finish at 51 tests, 107 assertions, 0 failures.

**Important:** Do not change any test assertions — only the data setup. The output HTML being tested does not change.

---

### Task 4 — Switch dashboard mount point to `bookit_dashboard_extension_content`

**File:** `bookit-meetings/includes/class-bookit-meetings-dashboard.php`

**Background:** The extension currently injects its Vue mount point div before `</body>` using `ob_start()` + `str_replace`. Core v1.5.1 has added `do_action('bookit_dashboard_extension_content')` inside the dashboard layout container (`dashboard/app/index.php`), after `<div id="app">` and before `</body>`. This is the correct injection point — using it means the extension div is inside the layout rather than below it.

**What to change:**
- Remove the `ob_start()` / `str_replace` approach for injecting the mount point div
- Replace with a direct `add_action('bookit_dashboard_extension_content', ...)` callback that echoes the mount div:
```php
add_action( 'bookit_dashboard_extension_content', function() {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if ( strpos( $uri, '/bookit-dashboard/app/meetings' ) === false ) {
        return;
    }
    echo '<div id="bookit-meetings-app"></div>';
} );
```
- The `ob_start()` callback used for JS/CSS injection (if separate from the mount div injection) must be reviewed — keep any `ob_start()` that handles JS script injection, remove only the mount div injection via `ob_start()`.

**Read first:** Read the current `class-bookit-meetings-dashboard.php` from GitHub before making any changes — confirm exactly what the `ob_start()` callback is doing before removing anything.

**Verification:** After the change, visit the Meetings settings page in the wp-env dev site and confirm the Vue app renders inside the dashboard layout (not below it). PHPUnit must remain at 51 tests, 107 assertions, 0 failures (this task has no PHPUnit coverage — verify visually).

**Git commit for this task must include a note:** `Visual verification required — confirm Vue app renders inside core layout at /bookit-dashboard/app/meetings`

---

## Decisions already locked — do not re-open

| Decision | Answer |
|----------|--------|
| `class_alias()` removal | Safe in v1.5.1 — runner uses `migration_id()` lookup |
| DB re-read in customer surfaces | Safe to remove in v1.5.1 — core re-fetches `$booking` after action |
| Mount point injection method | Switch to `bookit_dashboard_extension_content` — do not keep `ob_start()` for mount div |
| PHPUnit baseline | Must remain 51 tests, 107 assertions, 0 failures throughout all 4 tasks |

---

## Start now

Produce the Cursor prompt for **Task 1** as a downloadable `.md` file. Apply the `cursor-prompt-generator-meetings.md` skill in full.