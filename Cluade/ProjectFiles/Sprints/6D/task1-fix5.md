I can see the problem clearly in the page source. The `no_texturize_shortcodes` filter **did not work** — the rendered HTML still has `&#038;&#038;` throughout the script block. But more importantly, I can also see a **second encoding problem** in the fetch URL being built in JS:

```js
var url = slotsUrl
    + '?staff_id='   + encodeURIComponent( staffId )
    + '&#038;service_id=' + encodeURIComponent( serviceId )
    + '&#038;date='       + encodeURIComponent( dateStr );
```

The `&` characters in the string literals `'&#038;service_id='` and `'&#038;date='` are also encoded. **These are hardcoded ASCII strings in the PHP template** — they're being encoded by `wptexturize` or `wpautop` even after the `no_texturize_shortcodes` fix.

The reason `no_texturize_shortcodes` didn't work: **the `<script>` block is output directly by the PHP template via `ob_start()`/`ob_get_clean()`, not via the shortcode return value**. The filter only protects content processed through WordPress's shortcode expander — but the template is loaded and echoed inside the shortcode output, which then goes through `the_content` filters including `convert_chars` and `ent2ncr` which encode `&` regardless.

The real fix is different. Send this to Cursor:

---

```
TASK 1 OF 4 (BUG FIX 4): Move reschedule <script> to wp_footer hook
Sprint: 6D | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
ROOT CAUSE — CONFIRMED FROM RENDERED PAGE SOURCE
════════════════════════════════════════════════════════════

The no_texturize_shortcodes filter did not solve the problem.
The rendered HTML still shows &#038;&#038; for every && operator
and &#038; for every & in string literals inside the <script> block.

The encoding is applied by WordPress's the_content filter pipeline
(specifically convert_chars / wptexturize) to the entire shortcode
output including the <script> block. no_texturize_shortcodes only
prevents texturizing of the shortcode tag placeholder — it does not
protect the returned HTML string from subsequent content filters.

The correct fix: move the inline <script> block OUT of the shortcode
return value entirely, and register it via wp_footer so it is output
after WordPress has finished processing the_content.

════════════════════════════════════════════════════════════
READ FIRST
════════════════════════════════════════════════════════════

1. public/class-shortcodes.php — read in full
2. public/templates/reschedule-booking.php — read in full
3. public/templates/cancel-booking.php — read in full
   (cancel-booking.php has the same problem and needs the same fix)

════════════════════════════════════════════════════════════
FIX REQUIRED
════════════════════════════════════════════════════════════

The approach: in render_reschedule_booking(), detect whether the
reschedule calendar is being shown (i.e. $within_window is false),
and if so register the script via wp_add_inline_script or a
wp_footer action — completely outside the ob_get_clean() output.

────────────────────────────────────────────────────────────
Step 1 — Split the template
────────────────────────────────────────────────────────────

In public/templates/reschedule-booking.php:

Remove the entire <?php if ( ! $within_window ) : ?><script>
...</script><?php endif; ?> block from the template completely.
The template should end after the closing </div></div> of the
bookit-confirmation-page div.

────────────────────────────────────────────────────────────
Step 2 — Register script via wp_footer in render_reschedule_booking()
────────────────────────────────────────────────────────────

In public/class-shortcodes.php, in render_reschedule_booking():

After ob_get_clean() captures the HTML output, check if the
calendar should be shown. If so, use add_action( 'wp_footer', ... )
to output the script directly — bypassing the_content filters
entirely.

The method already has access to $booking_id, $token, and $rest_url.
Pass the additional data needed by the script (staff_id, service_id,
timeslots_url) via wp_add_inline_script on the already-enqueued
bookit-wizard script handle.

The cleanest implementation:

In render_reschedule_booking(), after ob_get_clean():

  // Only add the script if the calendar is being shown.
  // We can detect this by checking if the output contains the
  // calendar element ID.
  if ( strpos( $output, 'bookit-reschedule-calendar' ) !== false ) {
      add_action( 'wp_footer', array( $this, 'render_reschedule_script' ) );
  }
  return $output;

Add a new public method render_reschedule_script() to the class.
This method outputs the complete <script> block directly via echo —
NOT via return, and NOT via ob_get_clean(). Because it fires on
wp_footer (after the_content has finished), WordPress content
filters do not touch it.

The script content is exactly the ASCII-safe IIFE that is currently
in the template — move it verbatim into this method, wrapped in:

  public function render_reschedule_script() {
      // Only run once even if shortcode appears multiple times.
      static $done = false;
      if ( $done ) { return; }
      $done = true;

      ?>
      <script>
      (function () {
          'use strict';
          ... (full IIFE verbatim from the template) ...
      }() );
      </script>
      <?php
  }

Apply the identical pattern to cancel-booking:
- Remove the <script> block from cancel-booking.php
- Add render_cancel_script() method to class-shortcodes.php
- Register it via add_action( 'wp_footer', ... ) in
  render_cancel_booking() when the cancel button is shown

════════════════════════════════════════════════════════════
IMPORTANT CONSTRAINTS
════════════════════════════════════════════════════════════

- Do NOT use wp_add_inline_script() — it HTML-encodes its output
  in some WordPress versions, which would reintroduce the problem.
- Do NOT use esc_js() on any part of the script block.
- The script must be output via a raw echo / heredoc / nowdoc
  or inline PHP in a wp_footer action — never via a return value
  that passes through the_content.
- The only PHP value injected into the script is home_url('/') in
  the reschedule script. Verify it is output with esc_js() or
  esc_url() appropriately but that it remains outside any string
  that WordPress content filters will process.
- After the fix, verify in View Page Source that the <script> block
  appears AFTER </main> and BEFORE </body> (i.e. in the footer),
  and that && appears as literal && not &#038;&#038;.

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 1 (fix 4): Move reschedule/cancel scripts to wp_footer

- Removes inline <script> from reschedule-booking.php template
- Removes inline <script> from cancel-booking.php template  
- Registers both scripts via wp_footer action in class-shortcodes.php
- Bypasses the_content filter pipeline that was encoding && as &#038;
- Fixes month navigation, slot loading, confirm button reset

Tests: 976 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```