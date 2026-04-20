TASK 1 OF 4 (BUG FIX): Reschedule Page — Syntax Error + Event Listeners
Sprint: 6D | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
CONTEXT
════════════════════════════════════════════════════════════

The previous Cursor pass added correct JS logic for month navigation and
button-state reset. However a PHP-to-JS character encoding bug is causing
the entire IIFE to crash before any event listeners attach. This is why:
- Clicking prev/next month does nothing
- Clicking a date shows no available times
- The confirm button never resets

Root cause confirmed from browser console:
  Uncaught SyntaxError: Invalid or unexpected token (line ~569)

════════════════════════════════════════════════════════════
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THIS FILE
════════════════════════════════════════════════════════════

1. public/templates/reschedule-booking.php
   Read the FULL file. Find the inline <script> block. You are
   looking at the CURRENT version that Cursor already modified —
   not a previous version. Read what is there now.

If the file does not exist at this path, STOP and report back.

════════════════════════════════════════════════════════════
EXACT FIX REQUIRED — THREE CHANGES ONLY
════════════════════════════════════════════════════════════

Do NOT rewrite the file. Make these three targeted changes:

────────────────────────────────────────────────────────────
CHANGE 1 — Replace the ✓ character in the success message string
────────────────────────────────────────────────────────────

Find this line inside the confirmBtn click handler:
  msgEl.textContent = '<?php echo esc_js( __( 'Your booking has been rescheduled ✓', 'bookit-booking-system' ) ); ?>';

Replace it with:
  msgEl.textContent = '<?php echo esc_js( __( 'Your booking has been rescheduled', 'bookit-booking-system' ) ); ?> \u2713';

Explanation: esc_js() can mangle multi-byte UTF-8 characters like ✓
(U+2713) depending on server encoding. The fix is to move the checkmark
outside the PHP string entirely and use its Unicode escape \u2713 which
is pure ASCII and always safe in a JS string literal.

────────────────────────────────────────────────────────────
CHANGE 2 — Also fix the Rescheduling… ellipsis if it uses a UTF-8 ellipsis
────────────────────────────────────────────────────────────

Find this line:
  confirmBtn.textContent = '<?php echo esc_js( __( 'Rescheduling…', 'bookit-booking-system' ) ); ?>';

The … character (U+2026) has the same risk. Replace with:
  confirmBtn.textContent = '<?php echo esc_js( __( 'Rescheduling...', 'bookit-booking-system' ) ); ?>';

(Three plain ASCII full stops — safe on all servers.)

────────────────────────────────────────────────────────────
CHANGE 3 — Verify the Loading available times… string
────────────────────────────────────────────────────────────

Search the entire <script> block for any other esc_js() call that
contains a non-ASCII character (any character outside the range
0x20–0x7E). If you find any, apply the same fix: either replace the
character with its \uXXXX escape outside the PHP string, or use a
plain ASCII equivalent.

Do NOT change any other JS logic. Do NOT touch the PHP above the
<script> tag. Do NOT modify any other files unless Change 3 finds
an additional occurrence.

════════════════════════════════════════════════════════════
VERIFICATION
════════════════════════════════════════════════════════════

After making the changes:

1. Open the browser and navigate to the reschedule page with a valid
   magic link. Open DevTools → Console.
2. Confirm: ZERO JavaScript errors on page load.
3. Click next-month arrow → calendar advances, slots area resets.
4. Click a date → available times appear in the slots section.
5. Select a time → Confirm Reschedule button enables.
6. Run PHPUnit: cd bookit-booking-system && vendor/bin/phpunit
   Must show 976 tests, 0 failures.

Do not mark complete until steps 1–6 all pass.

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 1 (fix): Resolve JS syntax error in reschedule page

- Replace UTF-8 ✓ and … in esc_js() strings with ASCII-safe equivalents
- Restores month navigation and time slot selection
- Restores confirm button state reset after successful reschedule

Tests: 976 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.