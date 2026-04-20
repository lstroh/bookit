TASK 1 OF 4 (BUG FIX 2): Reschedule Page — Isolate from booking-wizard-v2.js
Sprint: 6D | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════

The reschedule page loads booking-wizard-v2.js (enqueued by
enqueue_wizard_assets() for all reschedule/cancel pages). That script
runs at DOMContentLoaded and does two things that break the reschedule
page:

1. It calls document.querySelectorAll('.bookit-v2-day--available') and
   attaches click listeners to every matching element. These listeners
   call postToSession() and use window.bookitWizardV2.restUrl / .nonce
   — neither of which exists on the reschedule page. This causes a
   silent JS error on day click that prevents slot fetching.

2. The dynamically-created day buttons (rendered by renderCalendarGrid()
   after month navigation) are not in the DOM when booking-wizard-v2.js
   runs, so they get no listener from that script — but the error on
   step 1 may still propagate.

The reschedule page IIFE uses event delegation on the #bookit-reschedule-
calendar element (not direct listeners on each day button), so its own
click handling is correct. The problem is booking-wizard-v2.js running
alongside it.

════════════════════════════════════════════════════════════
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
════════════════════════════════════════════════════════════

1. public/assets/js/booking-wizard-v2.js
   — Read the full file. Understand how it initialises — specifically
     whether it checks for a guard element or global before running
     its day-click and slot listeners.

2. public/class-shortcodes.php
   — Read enqueue_wizard_assets(). Confirm that booking-wizard-v2.js
     is or is not currently enqueued for the reschedule page.

3. public/templates/reschedule-booking.php
   — Re-read the current <script> IIFE to understand what it already
     handles, so you don't duplicate anything.

If any file does not exist at the path shown, STOP and report back.

════════════════════════════════════════════════════════════
FIX REQUIRED — CHOOSE THE RIGHT APPROACH AFTER READING
════════════════════════════════════════════════════════════

After reading the files, apply whichever of these two approaches fits:

────────────────────────────────────────────────────────────
APPROACH A — booking-wizard-v2.js has a guard (preferred)
────────────────────────────────────────────────────────────

If booking-wizard-v2.js already checks for a guard element or global
before initialising (e.g. checks for window.bookitWizardV2, or for
a specific element ID like #bookit-v2-wizard-form), then confirm
that the reschedule page does NOT render that element or set that
global. If confirmed, the bug is something else — report back with
your finding before touching any code.

────────────────────────────────────────────────────────────
APPROACH B — booking-wizard-v2.js has no guard (likely)
────────────────────────────────────────────────────────────

Add a guard at the top of the day-click initialisation block in
booking-wizard-v2.js so it exits early on pages that are not the
V2 wizard.

The guard must check for the presence of the V2 wizard form or a
unique element that only exists on the wizard page — NOT on the
reschedule page. Read the file to find the right sentinel element.

A safe pattern:

  // Only run on the V2 booking wizard page.
  if ( ! document.getElementById('bookit-v2-wizard-form') ) {
    return; // or just wrap the relevant block in an if
  }

Use whatever element ID or class is unique to the wizard page.
Do NOT use a class that is shared with the reschedule page
(e.g. do NOT use .bookit-v2-calendar or .bookit-v2-day--available
as the guard — these exist on both pages).

────────────────────────────────────────────────────────────
APPROACH C — Do not enqueue booking-wizard-v2.js on reschedule page
────────────────────────────────────────────────────────────

Only use this if Approaches A and B are not viable. In
public/class-shortcodes.php, in enqueue_wizard_assets(), the
booking-wizard-v2.js script enqueue (if it exists) should be
conditional on $has_wizard_v2, NOT on $has_cancel || $has_reschedule.

Do NOT remove the CSS enqueue for bookit-wizard-v2.css — only the JS.

════════════════════════════════════════════════════════════
VERIFICATION
════════════════════════════════════════════════════════════

After making the change:

1. Open the reschedule page with a valid magic link. Open DevTools →
   Console. Confirm ZERO JS errors on page load.

2. Click a date in the current month → Available times appear.

3. Click next-month → Calendar advances to next month. Click a date
   → Available times appear for that month.

4. Click prev-month → Returns to current month. Prev arrow disables.

5. Select a time → Confirm button enables.

6. Open the V2 booking wizard at /book-v2/ — confirm it still works
   normally (day click still fetches slots in the wizard).

7. Run PHPUnit: cd bookit-booking-system && vendor/bin/phpunit
   Must show 976 tests, 0 failures.

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 1 (fix 2): Guard booking-wizard-v2.js from reschedule page

- booking-wizard-v2.js now exits early when not on the V2 wizard page
- Prevents day-click listener conflict on /bookit-reschedule/
- Month navigation and slot loading now work correctly on reschedule page

Tests: 976 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.