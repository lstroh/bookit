Good — I have the full context. Now let me load Context7 for the libraries we'll need (Vue 3 and Vite).I have everything I need. Let me now generate the Cursor prompt for Task **6D-1**.

---

## Sprint 6D — Task Summary

| # | Task | Type | Est |
|---|------|------|-----|
| **6D-1** | Reschedule page UI bugs (month nav + button state) | JS/Vue fix | ~3h |
| 6D-2 | Customer email change workflow | PHP + Vue | ~7h |
| 6D-3 | Vite manifest cache-busting | Config + PHP | ~2h |
| 6D-4 | UK compliance review | Review + checklist | ~1h |

Starting with **6D-1**. Here is the Cursor prompt:

---

```
TASK 1 OF 4: Reschedule Page UI Bugs — Month Navigation + Button State Reset
Sprint: 6D | Est: ~3h | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
════════════════════════════════════════════════════════════

Read every file below in full before writing a single line of code.

1. public/templates/reschedule-booking.php
   — Full PHP template for the /bookit-reschedule/ page. Read entirely.
     The calendar and button logic may be inline <script> tags in this
     file. Understand the full JS structure before touching anything.

2. public/assets/js/ — list this directory.
   — Check whether a dedicated JS file exists for this page
     (e.g. magic-link-reschedule.js, booking-wizard-v2.js, or similar).
     If the logic is in a separate file, read that file in full.

3. public/assets/css/magic-link-pages.css
   — Scoped styles for reschedule/cancel pages. Read before adding any
     new CSS to understand existing class names.

4. includes/api/class-wizard-api.php
   — Read the GET wizard/timeslots endpoint and POST wizard/reschedule
     endpoint. Confirm the exact request/response shape both expect.
     The fix must conform to what these endpoints already return.

If any file listed above does not exist at the path shown, STOP and
report back before proceeding.

════════════════════════════════════════════════════════════
CONTEXT
════════════════════════════════════════════════════════════

The /bookit-reschedule/ magic link page was built in Sprint 5A-3b using
a vanilla JS IIFE pattern (same approach as the V2 booking wizard — not
a Vue SPA). Two bugs were found during Sprint 6C live testing and deferred
here. This task fixes both. No new PHPUnit tests are required — these are
frontend-only bugs. The test suite baseline is 976 tests, 0 failures, and
must not regress.

════════════════════════════════════════════════════════════
IMPLEMENTATION REQUIREMENTS
════════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────
BUG 1 — Month navigation does nothing
─────────────────────────────────────────────────────────

Current behaviour: Previous/next month arrow clicks produce no visible
change. The calendar is permanently locked to the current month.

Root cause (likely): The calendar's internal month/year state variable
is either not being updated on arrow click, or the timeslot fetch is
hardcoded to today's date rather than reading the current state variable.

Required fix:
- Maintain a `currentYear` and `currentMonth` JS variable (or equivalent)
  that tracks which month the calendar is displaying.
- On previous-month click: decrement month (wrapping year if needed),
  re-render the calendar grid, and re-fetch available timeslots for
  the first day of the new month.
- On next-month click: increment month (wrapping year if needed),
  re-render the calendar grid, and re-fetch available timeslots.
- Block backward navigation past the current month (i.e. the user cannot
  navigate to a month that is entirely in the past). The previous-month
  arrow should be visually disabled (e.g. opacity, pointer-events: none,
  or disabled attribute) when the displayed month is the current month.
  No restriction on forward navigation.
- The GET bookit/v1/wizard/timeslots endpoint already accepts a `date`
  parameter. Pass the first available date of the displayed month
  (or today's date if the displayed month is the current month) when
  fetching slots. Do not hardcode today's date.
- When navigating months, reset any selected time slot so the user cannot
  accidentally confirm a slot from the previous month's view.
- The calendar header must update to display the correct month and year
  after navigation.

Follow the exact same JS patterns (variable naming, fetch call style,
DOM manipulation approach) that already exist in the file you read.
Do not introduce new frameworks or libraries.

─────────────────────────────────────────────────────────
BUG 2 — Confirm button stuck on "Rescheduling..." after success
─────────────────────────────────────────────────────────

Current behaviour: After a successful POST to wizard/reschedule, the
Confirm button remains in its loading/disabled state ("Rescheduling..."
or equivalent). The user has no confirmation the action completed.

Required fix — on successful 200 response from POST wizard/reschedule:

1. Reset the button text to its original label (e.g. "Confirm Reschedule"
   or whatever it reads before submission — read the template to confirm
   the exact string).
2. Re-enable the button (remove disabled attribute / loading state).
3. Display a visible success message to the user. Suggested text:
   "Your booking has been rescheduled ✓"
   Place this message adjacent to or below the button, using a success
   style consistent with magic-link-pages.css (check what classes already
   exist for success/error states before adding new ones).
4. After 3 seconds, either:
   a. Redirect to home_url('/') — preferred if the template already has
      a redirect pattern elsewhere, or
   b. Leave the success state visible with the calendar disabled so the
      user knows they are done.
   Read the template to determine which pattern is already in use for
   similar post-action flows (e.g. the cancel page) and follow that
   pattern exactly.

On error response (non-200 or network failure):
- Reset button to original text and re-enable it (so user can retry).
- Display the error message from the API response (or a fallback:
  "Something went wrong. Please try again.") in the error message area.
- Follow the existing error display pattern in the template.

════════════════════════════════════════════════════════════
INFRASTRUCTURE REQUIREMENTS
════════════════════════════════════════════════════════════

- No new REST endpoints. No new DB columns. No migrations.
- No new PHP files.
- Changes are confined to:
  • public/templates/reschedule-booking.php (inline script block), AND/OR
  • public/assets/js/[whatever JS file serves this page — read first]
- If adding new CSS classes for the success message, add them to:
  public/assets/css/magic-link-pages.css
  Do not use inline styles.

════════════════════════════════════════════════════════════
PHPUNIT REQUIREMENTS
════════════════════════════════════════════════════════════

Baseline: 976 tests, 0 failures — must not regress.
No new test file required for this task (frontend-only changes).

After implementation, run:
  cd bookit-booking-system && vendor/bin/phpunit

All 976 tests must still pass before marking this task complete.

════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
════════════════════════════════════════════════════════════

Functional:
- [ ] Clicking the next-month arrow updates the calendar to the following
      month and fetches available slots for that month
- [ ] Clicking the previous-month arrow updates the calendar to the
      preceding month and fetches available slots for that month
- [ ] The previous-month arrow is disabled/hidden when the displayed month
      is the current calendar month (no past navigation)
- [ ] The calendar header shows the correct month and year after navigation
- [ ] Selecting a time slot in the new month and clicking Confirm sends
      the correct date/time to POST wizard/reschedule
- [ ] After a successful reschedule (200 response), the button resets to
      its original enabled state
- [ ] A visible success message appears after successful reschedule
- [ ] After an error response, the button resets and is re-enabled so
      the user can retry

Technical:
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors during normal use or on month navigation
- [ ] All new JS follows the IIFE/vanilla-JS pattern already in the file
      (no new frameworks introduced)
- [ ] New CSS classes (if any) added to magic-link-pages.css, not inline
- [ ] PHPUnit: 976 tests, 0 failures

Must NOT break:
- [ ] The cancel booking page (/bookit-cancel/) — shares CSS file
- [ ] The booking V2 wizard — shares no JS with this page but confirm
      no shared files were accidentally modified
- [ ] POST wizard/reschedule endpoint — no changes to PHP files

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 1: Fix reschedule page UI bugs

Bug 1: Month navigation now works — calendar fetches slots for selected month
Bug 2: Submit button resets after successful reschedule, success message shown

Tests: 976 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```

---

That's the Cursor prompt for **6D-1**. Confirm it complete once Cursor has implemented, tested, and you've verified the fixes on the live reschedule page — then I'll generate the 6D-2 prompt.