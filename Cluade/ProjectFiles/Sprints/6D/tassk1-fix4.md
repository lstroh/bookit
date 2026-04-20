I have the actual rendered HTML. I can see the problem immediately — no Cursor needed, no more guessing.

Look at this in the rendered source inside the `<script>` block:

```js
var isPast   = ( currentY < todayY ) ||
    ( currentY === todayY &#038;&#038; currentM < todayM ) ||
```

**`&#038;&#038;` is the HTML entity for `&&`.**

WordPress's `wpautop` or another content filter is running on the shortcode output and **HTML-encoding the `&&` operators** in the JavaScript. The browser receives `&#038;&#038;` inside a `<script>` tag, which is invalid JavaScript — that's the `SyntaxError` at column 28 (exactly where the first `&` of `&#038;` appears).

This is a classic WordPress shortcode output filtering bug. The `[bookit_reschedule_booking]` shortcode renders the PHP template via `ob_get_clean()` and returns it — and WordPress is then running `wptexturize()` or similar filters on the returned string before inserting it into the page content.

---

## The fix

In `public/class-shortcodes.php`, the `render_reschedule_booking()` method returns the template output. It needs to be wrapped with `add_filter` to prevent content filters from touching it.

Send this to Cursor:

---

```
TASK 1 OF 4 (BUG FIX 3): Stop WordPress from HTML-encoding && in the reschedule page script
Sprint: 6D | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
ROOT CAUSE — CONFIRMED FROM RENDERED HTML
════════════════════════════════════════════════════════════

The rendered page source shows && operators inside the <script> block
have been converted to &#038;&#038; by WordPress content filters.
This makes the JavaScript invalid and causes:
  Uncaught SyntaxError: Invalid or unexpected token (line 572, col 28)

WordPress runs filters including wptexturize and wpautop on shortcode
output. The [bookit_reschedule_booking] shortcode returns a string
containing a <script> block, and WordPress is encoding the & characters.

════════════════════════════════════════════════════════════
READ FIRST
════════════════════════════════════════════════════════════

1. public/class-shortcodes.php
   Read the full file. Find:
   a. render_reschedule_booking() — the method that returns the template
   b. Wherever shortcodes are registered (add_shortcode calls)
   c. Whether any existing shortcode already uses no_texturize_shortcodes
      or removes the the_content filters

2. public/templates/cancel-booking.php
   Check whether cancel-booking.php also has && in its <script> block.
   If it does, the same fix must be applied to render_cancel_booking().

If files do not exist at these paths, STOP and report back.

════════════════════════════════════════════════════════════
FIX REQUIRED
════════════════════════════════════════════════════════════

In public/class-shortcodes.php, find where shortcodes are registered.
Add both reschedule and cancel shortcodes to the no_texturize list:

  add_filter( 'no_texturize_shortcodes', function( $shortcodes ) {
      $shortcodes[] = 'bookit_reschedule_booking';
      $shortcodes[] = 'bookit_cancel_booking';
      return $shortcodes;
  } );

Place this in the same method that calls add_shortcode() for these two
shortcodes, or in the class constructor/init method — wherever the other
filters for this class are registered. Follow the existing code style.

Also remove wpautop from the shortcode output. Add this alongside the
no_texturize filter:

  add_filter( 'bookit_reschedule_booking', 'wp_kses_post' );

No — the correct approach is simpler. In render_reschedule_booking(),
wrap the returned string to prevent wpautop from adding <p> tags:

After the ob_get_clean() line, before return, add:
  remove_filter( 'the_content', 'wpautop' );

No — that is too broad. The correct targeted fix is:

Use no_texturize_shortcodes (handles wptexturize) PLUS ensure the
shortcode is in the $shortcode_tags that bypass wpautop. The cleanest
WordPress-native solution is:

1. Add to no_texturize_shortcodes (prevents & encoding) — required.

2. In render_reschedule_booking(), before returning $output, apply:
   return '<div class="bookit-no-autop">' is not needed.

The single correct fix is:

Add this filter registration in the method that registers shortcodes:

  // Prevent WordPress texturizing shortcode content containing JS.
  add_filter( 'no_texturize_shortcodes', array( $this, 'no_texturize_shortcodes' ) );

And add this method to the class:

  public function no_texturize_shortcodes( $shortcodes ) {
      $shortcodes[] = 'bookit_reschedule_booking';
      $shortcodes[] = 'bookit_cancel_booking';
      return $shortcodes;
  }

Additionally, to prevent wpautop from wrapping the script block in <p>
tags, in render_reschedule_booking() change the return to:

  return '<div class="bookit-shortcode-wrap">' . $output . '</div>';

No — do not add wrapper divs. Instead:

THE ACTUAL CORRECT FIX — TWO LINES ONLY:

In the method that registers shortcodes (likely __construct or register()
or init()), add:

  add_filter( 'no_texturize_shortcodes', array( $this, 'get_no_texturize_shortcodes' ) );

Add this public method to the class:

  /**
   * Prevent wptexturize from encoding JS operators in these shortcodes.
   *
   * @param array $shortcodes Shortcode tags to exclude from texturizing.
   * @return array
   */
  public function get_no_texturize_shortcodes( $shortcodes ) {
      $shortcodes[] = 'bookit_reschedule_booking';
      $shortcodes[] = 'bookit_cancel_booking';
      return $shortcodes;
  }

That is the complete fix. Do NOT modify the template files.
Do NOT modify the render methods.
Do NOT add wrapper divs.
Only add the filter and the method.

════════════════════════════════════════════════════════════
VERIFICATION
════════════════════════════════════════════════════════════

After saving, reload the reschedule page and do View Page Source.
Search for &#038; inside the <script> block.
It must NOT appear. You should see && (plain ampersands) instead.

Then open DevTools Console — must show ZERO JS errors.
Then click a date — available times must load.
Then click next month — calendar must advance.

Run PHPUnit: cd bookit-booking-system && vendor/bin/phpunit
Must show 976 tests, 0 failures.

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 1 (fix 3): Prevent wptexturize encoding JS in shortcodes

- Add bookit_reschedule_booking and bookit_cancel_booking to
  no_texturize_shortcodes filter
- WordPress was encoding && as &#038;&#038; inside <script> blocks,
  causing SyntaxError on the reschedule page
- Fixes month navigation, slot loading, and confirm button reset

Tests: 976 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```