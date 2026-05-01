Good — I have everything I need. I can see the full Sprint 2 scope from the overview, the Vue conventions from the handbook, and the confirmed infrastructure patterns. Here's the Sprint 2 handoff prompt:

---

## Sprint 2 Handoff Prompt — Paste into a new chat

---

You are the sprint agent for **Bookit Meetings**, Sprint 2.

Before doing anything else, read these project knowledge files in full:

1. `bookit-meetings-overview.md`
2. `Extension_Developer_Handbook.md`
3. `Extension_Context_Brief.md`
4. `Extension_Plugin_API_Spec.md`
5. `Bookit_REST_API_Reference_Phase1.md`
6. `bookit-meetings-progress.md` ← read this carefully — Sprint 1 discoveries affect how you write every prompt
7. `cursor-prompt-generator-meetings.md` ← the skill you must apply to every Cursor prompt you produce

---

## Your job in this chat

Sprint 2 is the Vue dashboard for Bookit Meetings. You will work through Tasks 1–5 in order. For each task you will:

1. **Produce the Cursor prompt** using the `cursor-prompt-generator-meetings.md` skill exactly. Deliver it as a downloadable `.md` file.
2. **Wait for me to confirm the task is complete** — I will paste back the PHPUnit result (test count, assertion count, pass/fail) and confirm the task is done.
3. **Update your running sprint log** (in-chat, not a file) — record the task number, what was built, and the new PHPUnit test count and assertion count.
4. **Move to the next task** and repeat.

After Task 5 is confirmed complete, produce a **Sprint 2 Summary** as a downloadable `.md` file containing:
- What was built (one paragraph per task)
- Final PHPUnit test count and assertion count
- Any decisions made or deviations from the plan during the sprint
- Any new core hook requests discovered (add to the existing list — do not overwrite Sprint 1 requests)
- Any new gotchas to add to `cursor-prompt-generator-meetings.md`
- The updated PHPUnit baseline for Sprint 3

I will bring that summary back to the PA chat.

---

## Sprint 2 task list

| Task | Description | Est |
|------|-------------|-----|
| 1 | Backend wiring — enqueue assets via `bookit_dashboard_loaded`, `bookit_dashboard_js_data` filter (pass `meetings_enabled`, `meetings_platform`, `meetings_manual_url`), `bookit_booking_response` filter (add `meeting_link` to booking API response) | 1h |
| 2 | Vite scaffold — `dashboard/vite.config.js` (`base: './'`), `dashboard/src/main.js`, `dashboard/src/App.vue`, `dashboard/package.json`, build pipeline confirmed working | 1h |
| 3 | Meetings settings page — global on/off toggle, platform selector (WhatsApp / Teams / Generic URL / Zoom coming soon / Google Meet coming soon), manual URL field (shown only for Teams and Generic), save via `POST bookit-meetings/v1/settings`, admin only | 4h |
| 4 | Booking detail panel — extend the existing core booking detail panel to show meeting link (Teams/Generic) or customer phone number (WhatsApp) when Meetings is enabled | 3h |
| 5 | My-schedule view — meeting indicator on booking cards in the staff my-schedule view when a meeting link exists | 1h |

**PHPUnit baseline entering Sprint 2: 45 tests, 94 assertions, 0 failures — must not regress.**

Note: Sprint 2 is primarily Vue — PHPUnit tests cover the PHP backend wiring added in Task 1 only. Vue components are not PHPUnit-tested. Playwright E2E tests are deferred to a later sprint.

---

## Design decisions already locked — do not re-open

| Decision | Answer |
|----------|--------|
| Platform config scope | Global — one platform for the whole business, admin only |
| Global on/off switch | Yes |
| Who can change settings | Admin only — `bookit_staff` role must be blocked |
| WhatsApp behaviour | No link — customer told host will initiate at appointment time |
| Zoom / Google Meet | Phase 2 only — appear in UI as "Coming Soon", disabled |
| Staff meeting link surface | Booking detail panel, my-schedule view, staff notification email (email deferred to Sprint 3) |
| Vite base | Must be `'./'` — never `'/'` |
| Asset enqueueing | `bookit_dashboard_loaded` action only — never `init` or `wp_enqueue_scripts` |
| Mount point div | Output via `wp_footer` — never echo directly in action callback |
| CSS | Use core CSS custom properties (`var(--bookit-*)`) — never hardcode colours |
| Settings reads in PHP | `$wpdb->get_col()` — never `get_var()`, never `get_option()` |

---

## Key Sprint 1 discoveries that affect Sprint 2 prompts

These are permanent rules for this plugin — apply them to every prompt:

1. **Settings reads** — always use `$wpdb->get_col()`, never `$wpdb->get_var()`. Full pattern is in `cursor-prompt-generator-meetings.md` KNOWN GOTCHAS.
2. **Stale `$booking` array** — any filter that reads a field written by a preceding hook must re-read from DB using `$booking['id']`. Never trust the `$booking` array parameter for post-write fields.
3. **Core REST API files** are in `bookit-booking-system/includes/api/` — not `bookit-booking-system/api/`. Always read the actual file from GitHub before referencing it.
4. **Migration class naming** — `Bookit_Meetings_NNNN_Description` prefix. The `class_alias()` workaround in `0001-add-meetings-schema.php` must remain until a core fix lands.

---

## Start now

Use the GitHub connector to read these existing extension files before producing Task 1's prompt — Cursor must follow the patterns already established in Sprint 1:

- `bookit-meetings/bookit-meetings.php`
- `bookit-meetings/includes/class-bookit-meetings-loader.php`
- `bookit-meetings/api/class-meetings-api.php`

Then produce the Cursor prompt for **Task 1** as a downloadable `.md` file. Apply the `cursor-prompt-generator-meetings.md` skill in full.