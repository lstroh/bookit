I have everything I need. Here's the Sprint 2.5 handoff prompt.

---

## Sprint 2.5: Verification + Completion — Paste into a new chat

---

You are the sprint agent for **Bookit Meetings**, Sprint 2.5.

Before doing anything else, read these project knowledge files in full:

1. `bookit-meetings-overview.md`
2. `Extension_Developer_Handbook.md`
3. `Extension_Context_Brief.md`
4. `Extension_Plugin_API_Spec.md` — v1.5.1, read the updated hook signatures
5. `bookit-meetings-progress.md` ← read every section carefully — this sprint closes out all deferred and blocked items from Sprints 1 and 2
6. `cursor-prompt-generator-meetings.md` ← apply to every Cursor prompt you produce

---

## Context

Core v1.5.1 is now running in the environment. All 7 core requests have been implemented. The housekeeping sprint has cleaned up workarounds and confirmed the Vue app mounts correctly inside `#app`.

This sprint has two purposes:

1. **Verification** — visually confirm that Sprint 1 and Sprint 2 features work correctly end-to-end against core v1.5.1. Some of these have never been verified in a live browser.
2. **Completion** — build and verify Sprint 2 Task 5 (my-schedule indicator), which was fully blocked until v1.5.1 landed, and fix the two CSS layout issues noted in housekeeping.

**This sprint produces Cursor prompts only where code changes are needed.** Verification tasks that pass cleanly require no prompt — just your confirmation that you have checked them manually. If a verification task reveals a bug, escalate back here before writing any fix code.

**PHPUnit baseline entering this sprint: 51 tests, 107 assertions, 0 failures — must not regress.**

---

## Your job in this chat

Work through Tasks 1–6 in order. For each task:

1. **Verification tasks (1–4):** No Cursor prompt needed unless a bug is found. Tell me what to check and how to check it. Wait for my confirmation that it passes — or escalate if it fails.
2. **Build tasks (5–6):** Produce the Cursor prompt using the `cursor-prompt-generator-meetings.md` skill. Deliver as a downloadable `.md` file. Wait for my confirmation + PHPUnit result before moving on.
3. **Update your running sprint log** in-chat after each task.
4. **After Task 6:** produce a **Sprint 2.5 Summary** as a downloadable `.md` file with: what was verified, what was built, any bugs found and fixed, final PHPUnit count, and the clean baseline for Sprint 3.

I will bring that summary back to the PA chat.

---

## Task list

| Task | Type | Description | Est |
|------|------|-------------|-----|
| 1 | Verify | Customer confirmation page — end-to-end booking flow | 30m |
| 2 | Verify | Meetings settings page — full visual + functional check | 30m |
| 3 | Verify | Booking detail panel — MeetingInfoPanel in live modal | 30m |
| 4 | Verify | Customer confirmation email — meeting link / WhatsApp note | 20m |
| 5 | Build | My-schedule meeting indicator — PHP backend + Vue badge | 2h |
| 6 | Build | CSS layout fixes — sidebar overlap + blank space above content | 1h |

**PHPUnit baseline: 51 tests, 107 assertions, 0 failures — must not regress.**
Tasks 5 and 6 are the only tasks that write new code and may change the PHPUnit count.

---

## Task detail

### Task 1 — Verify: Customer confirmation page

**What to check:**

Set Meetings to **enabled**, platform = **Teams**, manual URL = `https://teams.microsoft.com/meet/testroom`. Complete a new booking through the public wizard. On the confirmation page:

- [ ] "Join Meeting" button is visible
- [ ] Button links to `https://teams.microsoft.com/meet/testroom`
- [ ] No PHP warnings or notices in debug log

Repeat with platform = **WhatsApp**:
- [ ] "Your host will initiate a WhatsApp call/video at your appointment time" message is visible
- [ ] No meeting link or button shown

Set Meetings to **disabled**:
- [ ] No meeting section shown at all

**If any of these fail:** Do not write any fix code. Escalate back to the PA chat with the exact failure observed.

---

### Task 2 — Verify: Meetings settings page

**What to check:**

Navigate to `/bookit-dashboard/app/meetings` while logged in as admin:

- [ ] Vue app renders inside the core dashboard layout (inside `#app`, not below it)
- [ ] Meetings enabled/disabled toggle is visible and reflects the current saved value
- [ ] Platform selector shows: WhatsApp, Teams, Generic (active); Zoom, Google Meet (disabled / "Coming Soon")
- [ ] Manual URL field appears when Teams or Generic is selected; hidden for WhatsApp
- [ ] Save button saves successfully — refresh the page and confirm values persist
- [ ] Logged in as `bookit_staff` role — settings page should be inaccessible (403 or hidden)
- [ ] No JavaScript console errors

**Two known cosmetic issues (do not treat as failures — they are Task 6):**
- Nav sidebar may overlap the Vue app
- Blank space may appear above the content area

**If any functional check fails:** Escalate back to the PA chat before writing any fix code.

---

### Task 3 — Verify: Booking detail panel

**What to check:**

With Meetings enabled and platform = **Teams**, open the booking detail modal in the dashboard for a booking that was confirmed after Meetings was enabled:

- [ ] `MeetingInfoPanel` is visible inside or alongside the booking detail modal
- [ ] Meeting link is displayed correctly with a "Join" link and copy button
- [ ] No JavaScript console errors

Repeat for platform = **WhatsApp**:
- [ ] Customer phone number is shown with a `tel:` link
- [ ] No meeting link shown

Open a booking that was created before Meetings was enabled (no `meeting_link`):
- [ ] `MeetingInfoPanel` shows nothing / gracefully empty

**If any of these fail:** Escalate back to the PA chat before writing any fix code.

---

### Task 4 — Verify: Customer confirmation email

**What to check:**

With Meetings enabled and platform = **Teams**, complete a booking and check the customer confirmation email that is sent:

- [ ] Meeting link row is present in the email body
- [ ] Link is correctly formatted with inline styles (no CSS classes — email clients strip them)
- [ ] No raw PHP or template tags visible in the email

Repeat with platform = **WhatsApp**:
- [ ] WhatsApp note is present: "Your host will initiate a WhatsApp call/video at your appointment time"
- [ ] No meeting link shown

With Meetings **disabled**:
- [ ] No meeting section in the email at all

**Note:** If your wp-env environment does not send real emails, use a mail catcher (e.g. Mailpit, which wp-env includes at `localhost:8025`) to inspect outgoing mail.

**If any of these fail:** Escalate back to the PA chat before writing any fix code.

---

### Task 5 — Build: My-schedule meeting indicator

**This task was fully blocked until core v1.5.1. Both required core changes are now live:**
- `bookit_schedule_booking_response` filter — lands `meeting_link` in schedule API responses
- `data-booking-id` attribute on booking cards in `MySchedule.vue`

**No code exists yet for this task. A full Cursor prompt is required.**

The prompt must direct Cursor to:

**PHP — `bookit-meetings/includes/class-bookit-meetings-loader.php` — MODIFY**
- Register a new filter callback on `bookit_schedule_booking_response` (priority 10, 2 args)
- Callback appends `meeting_link` to the formatted schedule booking array by reading from DB using `$booking_id`
- Follow the exact pattern of `add_meeting_link_to_booking_response()` in `class-bookit-meetings-assets.php`

**Vue — `bookit-meetings/dashboard/src/` — CREATE / MODIFY**
- New component: `ScheduleMeetingBadge.vue`
  - Small pill/badge: e.g. a video camera icon + "Meeting" label
  - Shown when `hasMeeting` prop is `true`
  - Uses core CSS custom properties (`var(--bookit-*)`) — no hardcoded colours
- New composable or logic in `BookingDetailView.vue` or a new file: watch for booking cards rendered in `MySchedule.vue` using MutationObserver on `[data-booking-id]` elements
  - On each card detected: call `GET bookit-meetings/v1/bookings/{id}/link` using `originalFetch` to check if a meeting link exists
  - If yes: inject `<ScheduleMeetingBadge />` into the card DOM node
  - On card removal: clean up

**PHPUnit — `tests/unit/test-schedule-response.php` — CREATE**
- Test: `bookit_schedule_booking_response` filter appends `meeting_link` when one exists
- Test: filter appends `meeting_link` as empty string when none exists
- Test: filter does not fire when Meetings is disabled (check `meetings_enabled` setting)
- Baseline: 51 tests, 107 assertions — must not regress

**After implementation:** `npm run build` in `bookit-meetings/dashboard/`. Verify badge appears on booking cards in my-schedule view.

---

### Task 6 — Build: CSS layout fixes

**Two cosmetic issues observed during housekeeping Task 4 — neither is a regression, both pre-existed the mount point fix:**

1. **Nav sidebar overlaps Vue app in desktop view** — z-index or positioning conflict between core sidebar and the extension `#bookit-meetings-app` container
2. **Large blank space above content** — padding or margin issue inside the core `#app` container when the extension app is mounted

**The prompt must direct Cursor to:**

- Read `bookit-meetings/dashboard/src/App.vue` and `bookit-meetings/dashboard/dist/app.css` (built output) from disk before touching anything
- Read `bookit-booking-system/dashboard/app/index.php` to understand the core layout structure and existing CSS classes
- Inspect the rendered DOM in browser dev tools to identify the exact elements causing each issue before writing any CSS
- Fix sidebar overlap: scope CSS to `#bookit-meetings-app` — never override core sidebar styles globally
- Fix blank space: identify whether it is a margin on the extension app container or inherited padding from core's `#app` wrapper, and fix at the correct level
- All CSS fixes must be scoped — no global overrides that could affect core dashboard pages

**After implementation:** `npm run build` in `bookit-meetings/dashboard/`. Verify both issues are resolved at `/bookit-dashboard/app/meetings`. Confirm core dashboard pages (bookings list, my-schedule, settings) are visually unaffected.

**No PHPUnit impact — CSS only.**

---

## Decisions already locked — do not re-open

| Decision | Answer |
|----------|--------|
| CSS scope | All extension CSS scoped to `#bookit-meetings-app` — never global overrides |
| Schedule badge injection | MutationObserver on `[data-booking-id]` — now available in core v1.5.1 |
| `bookit_schedule_booking_response` second arg | `int $booking_id` — same convention as `bookit_booking_response` |
| PHPUnit baseline | 51 tests, 107 assertions, 0 failures — must not regress throughout |
| Verification failures | Escalate to PA chat before writing any fix code — do not self-diagnose and fix |

---

## Start now

Begin with **Task 1**. Tell me exactly what to do to verify the customer confirmation page end-to-end, then wait for my confirmation before moving to Task 2.