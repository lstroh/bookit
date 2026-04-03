Let me read the V2 template and CSS files before writing 5A-3b, so the prompt directs Cursor to the exact patterns.Good. I have what I need on V2 patterns. Now let me look at the V2 wizard CSS token conventions directly:I have enough context. The V2 pattern is clear: `booking-confirmed-v2.php` uses `.bookit-confirmation-page` wrapper, `--bookit-*` tokens, and `confirmation-page-v2.css`. The wizard uses `--bookit-v2-*` tokens scoped to `.bookit-v2-wizard-container`. The cancel/reschedule pages should follow the **confirmation page** V2 pattern (simpler, single-state display), not the multi-step wizard pattern.

Here is the 5A-3b Cursor prompt:

---

```
TASK 5A-3b OF 6: Magic Link Cancellation & Rescheduling — Frontend Templates
Sprint: 5A | Est: 6h | Plugin root: bookit-booking-system/
Depends on: 5A-3a complete (shortcodes registered, REST endpoints exist)
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below in full before writing a single line of code.
If any file does not exist at the path shown, STOP and report back.

1. `public/templates/booking-confirmed-v2.php` — read in full. This is
   the **primary pattern** for both new templates. Note: wrapper class
   `.bookit-confirmation-page`, how `$booking` data is fetched via
   `$wpdb->get_row()`, how variables are escaped with `esc_html()` /
   `esc_attr()` / `esc_url()`, and how the DB query retrieves joined
   service/staff names.
2. `public/assets/css/confirmation-page-v2.css` — read in full. Note
   which `--bookit-*` tokens are used, how the card layout is structured,
   and the scoping to `.bookit-confirmation-page`. The new
   `magic-link-pages.css` must follow this exact token system.
3. `public/assets/css/booking-wizard-v2.css` — read for the
   `--bookit-v2-*` token definitions (colour, radius, shadow values)
   so the new CSS reuses the same design language.
4. `public/class-shortcodes.php` — read the `render_cancel_booking()`
   and `render_reschedule_booking()` methods added in 5A-3a to confirm
   exactly which variables are passed to the templates via
   `Bookit_Template_Loader::get_template()`: `$booking_id`, `$token`,
   `$rest_url`. Also confirm how the template loader is called.
5. `includes/class-bookit-template-loader.php` — confirm how variables
   are made available inside the template (via `set_query_var()` /
   `get_query_var()`, or `extract()`, or direct `$args` array — match
   whatever pattern the shortcode render methods use).
6. `public/templates/booking-wizard-v2-step-4.php` — read to see how
   the cancellation policy notice block is structured visually (tinted
   notice block pattern used in Sprint 4C).
7. `database/schema.sql` — confirm `wp_bookings_settings` has
   `cancellation_window_hours` key and `business_phone` key (for
   "contact us" display when policy blocks cancellation).
8. `includes/class-bookit-database.php` — confirm `wp_bookings` columns
   needed for the booking summary display: `booking_date`, `start_time`,
   `end_time`, `booking_reference`, `status`, `service_id`, `staff_id`.
   Also confirm `wp_bookings_services` has `name` and
   `wp_bookings_staff` has `first_name`, `last_name`.

---

## CONTEXT

This task creates the two PHP templates and one CSS file that the
shortcodes registered in 5A-3a render. Both templates follow the V2
visual system — same wrapper class, same `--bookit-*` CSS tokens, same
card layout as `booking-confirmed-v2.php`. Each page has two states
rendered entirely in PHP: a **confirmation/form state** (before the
customer acts) and a **result state** (after JS submits to the REST
endpoint). The JS is vanilla IIFE (no jQuery, matching the V2 wizard
pattern). No new PHPUnit tests are required — the backend logic was
fully tested in 5A-3a. Manual visual testing instructions are at the end.

---

## IMPLEMENTATION REQUIREMENTS

### `public/templates/cancel-booking.php` — CREATE

**PHP section (top of file, before any HTML):**

Fetch the booking using `$booking_id` and `$token` passed in from the
shortcode render method. Read `booking-confirmed-v2.php` to see exactly
how the shortcode passes variables into the template — match that pattern.

```php
global $wpdb;

// Fetch booking with joined service and staff names.
$booking = $wpdb->get_row(
    $wpdb->prepare(
        "SELECT b.id, b.booking_reference, b.booking_date, b.start_time,
                b.end_time, b.status, b.magic_link_token,
                s.name AS service_name,
                st.first_name AS staff_first_name,
                st.last_name  AS staff_last_name
         FROM {$wpdb->prefix}bookings b
         LEFT JOIN {$wpdb->prefix}bookings_services s  ON s.id  = b.service_id
         LEFT JOIN {$wpdb->prefix}bookings_staff    st ON st.id = b.staff_id
         WHERE b.id = %d AND b.deleted_at IS NULL",
        $booking_id
    ),
    ARRAY_A
);
```

If `$booking` is null OR `!hash_equals((string)$booking['magic_link_token'], (string)$token)`:
render an error card (same wrapper, but shows "Invalid or expired link"
message) and `return` — do not render the rest of the template.

If `$booking['status']` is `'cancelled'`: render a "already cancelled"
notice card and return.

If `$booking['status']` is `'completed'` or `'no_show'`: render a
"this booking cannot be cancelled" notice card and return.

**Policy window check (PHP, for initial render):**
```php
$notice_hours = (int) $wpdb->get_var(
    "SELECT setting_value FROM {$wpdb->prefix}bookings_settings
     WHERE setting_key = 'cancellation_window_hours'"
);
if ( ! $notice_hours ) {
    $notice_hours = 24;
}
$tz           = new DateTimeZone( get_option( 'timezone_string' ) ?: 'Europe/London' );
$appt_dt      = new DateTime( $booking['booking_date'] . ' ' . $booking['start_time'], $tz );
$now_dt       = new DateTime( 'now', $tz );
$hours_until  = ( $appt_dt->getTimestamp() - $now_dt->getTimestamp() ) / 3600;
$within_window = $hours_until < $notice_hours;
```

Read `cancellation_window_hours` from `wp_bookings_settings` using
direct `$wpdb->get_var()` — same key confirmed by 5A-3a. Also read
`business_phone` from settings for the "contact us" fallback message.

**HTML structure — follow `booking-confirmed-v2.php` exactly:**

```html
<div class="bookit-confirmation-page bookit-magic-link-page">
  <div class="bookit-confirmation-card">

    <!-- Booking summary (always shown) -->
    <div class="bookit-confirmation-details">
      <h2><?php esc_html_e( 'Cancel Your Booking', 'bookit-booking-system' ); ?></h2>
      <table class="bookit-summary-table">
        <tr>
          <th><?php esc_html_e( 'Reference', '...' ); ?></th>
          <td><?php echo esc_html( $booking['booking_reference'] ); ?></td>
        </tr>
        <tr>
          <th><?php esc_html_e( 'Service', '...' ); ?></th>
          <td><?php echo esc_html( $booking['service_name'] ); ?></td>
        </tr>
        <tr>
          <th><?php esc_html_e( 'Staff', '...' ); ?></th>
          <td><?php echo esc_html( $booking['staff_first_name'] . ' ' . $booking['staff_last_name'] ); ?></td>
        </tr>
        <tr>
          <th><?php esc_html_e( 'Date', '...' ); ?></th>
          <td><?php echo esc_html( date_i18n( 'l, j F Y', strtotime( $booking['booking_date'] ) ) ); ?></td>
        </tr>
        <tr>
          <th><?php esc_html_e( 'Time', '...' ); ?></th>
          <td><?php echo esc_html( date_i18n( 'g:i a', strtotime( $booking['start_time'] ) ) ); ?></td>
        </tr>
      </table>
    </div>

    <!-- Policy notice block (blue-grey tinted, Sprint 4C style) -->
    <div class="bookit-policy-notice">
      <?php if ( $within_window ) : ?>
        <p class="bookit-policy-notice__text">
          <?php printf(
            esc_html__( 'Online cancellation is not available within %d hours of your appointment. Please contact us directly.', 'bookit-booking-system' ),
            $notice_hours
          ); ?>
        </p>
        <?php if ( $business_phone ) : ?>
          <p><a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $business_phone ) ); ?>">
            <?php echo esc_html( $business_phone ); ?>
          </a></p>
        <?php endif; ?>
      <?php else : ?>
        <p class="bookit-policy-notice__text">
          <?php printf(
            esc_html__( 'You can cancel free of charge up to %d hours before your appointment.', 'bookit-booking-system' ),
            $notice_hours
          ); ?>
        </p>
      <?php endif; ?>
    </div>

    <!-- Action area — hidden when within_window -->
    <?php if ( ! $within_window ) : ?>
    <div class="bookit-magic-action" id="bookit-cancel-action">
      <div class="bookit-magic-message" id="bookit-cancel-message" style="display:none;"></div>
      <button
        class="bookit-btn-primary"
        id="bookit-cancel-confirm"
        data-booking-id="<?php echo esc_attr( $booking_id ); ?>"
        data-token="<?php echo esc_attr( $token ); ?>"
        data-rest-url="<?php echo esc_url( $rest_url . 'cancel' ); ?>"
      >
        <?php esc_html_e( 'Confirm Cancellation', 'bookit-booking-system' ); ?>
      </button>
    </div>
    <?php endif; ?>

  </div><!-- .bookit-confirmation-card -->
</div><!-- .bookit-confirmation-page -->
```

**Inline `<script>` at bottom of template (vanilla IIFE, no jQuery):**

```javascript
(function () {
  var btn = document.getElementById('bookit-cancel-confirm');
  if (!btn) return;

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = btn.getAttribute('data-confirming-label') || 'Cancelling\u2026';

    var msg = document.getElementById('bookit-cancel-message');

    fetch(btn.dataset.restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: parseInt(btn.dataset.bookingId, 10),
        token: btn.dataset.token
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      msg.style.display = 'block';
      if (data.success) {
        msg.className = 'bookit-magic-message bookit-magic-message--success';
        msg.textContent = data.message || 'Your booking has been cancelled.';
        document.getElementById('bookit-cancel-action').querySelector('button').remove();
      } else {
        msg.className = 'bookit-magic-message bookit-magic-message--error';
        msg.textContent = (data.message) || 'Something went wrong. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Confirm Cancellation';
      }
    })
    .catch(function () {
      msg.style.display = 'block';
      msg.className = 'bookit-magic-message bookit-magic-message--error';
      msg.textContent = 'A network error occurred. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Confirm Cancellation';
    });
  });
}());
```

### `public/templates/reschedule-booking.php` — CREATE

Same PHP header pattern as `cancel-booking.php` — same DB query, same
token validation, same terminal status checks, same policy window check.

**HTML structure:**

Same `.bookit-confirmation-page.bookit-magic-link-page` wrapper. Show
the booking summary table. Show the policy notice. When **outside** the
policy window, show the reschedule form:

```html
<div class="bookit-magic-action" id="bookit-reschedule-action">
  <h3><?php esc_html_e( 'Choose a new date and time', 'bookit-booking-system' ); ?></h3>

  <div class="bookit-magic-message" id="bookit-reschedule-message"
       style="display:none;"></div>

  <div class="bookit-form-row">
    <label for="bookit-new-date">
      <?php esc_html_e( 'New Date', 'bookit-booking-system' ); ?>
    </label>
    <input type="date"
           id="bookit-new-date"
           class="bookit-input"
           min="<?php echo esc_attr( date( 'Y-m-d', strtotime( '+1 day' ) ) ); ?>">
  </div>

  <div class="bookit-form-row">
    <label for="bookit-new-time">
      <?php esc_html_e( 'New Time (HH:MM)', 'bookit-booking-system' ); ?>
    </label>
    <input type="time"
           id="bookit-new-time"
           class="bookit-input">
  </div>

  <button
    class="bookit-btn-primary"
    id="bookit-reschedule-confirm"
    data-booking-id="<?php echo esc_attr( $booking_id ); ?>"
    data-token="<?php echo esc_attr( $token ); ?>"
    data-rest-url="<?php echo esc_url( $rest_url . 'reschedule' ); ?>"
  >
    <?php esc_html_e( 'Confirm Reschedule', 'bookit-booking-system' ); ?>
  </button>
</div>
```

**Inline `<script>` at bottom:**

```javascript
(function () {
  var btn = document.getElementById('bookit-reschedule-confirm');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var newDate = document.getElementById('bookit-new-date').value;
    var newTime = document.getElementById('bookit-new-time').value;
    var msg     = document.getElementById('bookit-reschedule-message');

    if (!newDate || !newTime) {
      msg.style.display   = 'block';
      msg.className       = 'bookit-magic-message bookit-magic-message--error';
      msg.textContent     = 'Please select a date and time.';
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Rescheduling\u2026';

    fetch(btn.dataset.restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: parseInt(btn.dataset.bookingId, 10),
        token:      btn.dataset.token,
        new_date:   newDate,
        new_time:   newTime
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      msg.style.display = 'block';
      if (data.success) {
        msg.className   = 'bookit-magic-message bookit-magic-message--success';
        msg.textContent = 'Your booking has been rescheduled to '
                        + data.new_date + ' at ' + data.new_time + '.';
        document.getElementById('bookit-reschedule-action')
                .querySelectorAll('input, button')
                .forEach(function (el) { el.disabled = true; });
      } else {
        msg.className   = 'bookit-magic-message bookit-magic-message--error';
        msg.textContent = (data.message) || 'Something went wrong. Please try again.';
        btn.disabled    = false;
        btn.textContent = 'Confirm Reschedule';
      }
    })
    .catch(function () {
      msg.style.display = 'block';
      msg.className     = 'bookit-magic-message bookit-magic-message--error';
      msg.textContent   = 'A network error occurred. Please try again.';
      btn.disabled      = false;
      btn.textContent   = 'Confirm Reschedule';
    });
  });
}());
```

### `public/assets/css/magic-link-pages.css` — CREATE

Scope all rules to `.bookit-magic-link-page`. Use `--bookit-*` tokens
from `booking-wizard.css` (the global root block). Do NOT hardcode any
colour values — use tokens only, exactly as `confirmation-page-v2.css`
does.

Required rules:

```css
/* Scoped to .bookit-magic-link-page to avoid polluting theme styles */

.bookit-magic-link-page .bookit-confirmation-card {
  /* Inherit card layout from confirmation-page-v2.css */
}

/* Policy notice block — blue-grey tinted, Sprint 4C style */
.bookit-magic-link-page .bookit-policy-notice {
  background-color: var(--bookit-notice-bg, #EFF6FF);
  border-left: 4px solid var(--bookit-primary, #3B82F6);
  border-radius: var(--bookit-radius, 6px);
  padding: 1rem 1.25rem;
  margin: 1.25rem 0;
  color: var(--bookit-text, #1F2937);
  font-size: 0.9375rem;
}

.bookit-magic-link-page .bookit-policy-notice a {
  color: var(--bookit-primary, #3B82F6);
  font-weight: 600;
}

/* Form rows for reschedule inputs */
.bookit-magic-link-page .bookit-form-row {
  margin-bottom: 1rem;
}

.bookit-magic-link-page .bookit-form-row label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bookit-text, #1F2937);
  margin-bottom: 0.375rem;
}

.bookit-magic-link-page .bookit-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--bookit-border, #D1D5DB);
  border-radius: var(--bookit-radius, 6px);
  font-size: 1rem;
  color: var(--bookit-text, #1F2937);
  background: #fff;
  box-sizing: border-box;
}

.bookit-magic-link-page .bookit-input:focus {
  outline: none;
  border-color: var(--bookit-primary, #3B82F6);
  box-shadow: 0 0 0 3px var(--bookit-focus-ring, rgba(59,130,246,0.2));
}

/* Feedback messages */
.bookit-magic-message {
  padding: 0.75rem 1rem;
  border-radius: var(--bookit-radius, 6px);
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.bookit-magic-message--success {
  background-color: var(--bookit-success-bg, #ECFDF5);
  color: var(--bookit-success-text, #065F46);
  border-left: 4px solid var(--bookit-success, #10B981);
}

.bookit-magic-message--error {
  background-color: var(--bookit-error-bg, #FEF2F2);
  color: var(--bookit-error-text, #991B1B);
  border-left: 4px solid var(--bookit-error, #EF4444);
}

/* Action area */
.bookit-magic-link-page .bookit-magic-action {
  margin-top: 1.5rem;
}

.bookit-magic-link-page .bookit-magic-action h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--bookit-text, #1F2937);
  margin: 0 0 1rem;
}
```

**Important**: Read `confirmation-page-v2.css` for `.bookit-btn-primary`
and `.bookit-summary-table` rules — if they are already defined there and
`magic-link-pages.css` depends on `bookit-wizard` (which loads
`confirmation-page-v2.css` as a dependency), do NOT redefine them.
Only add rules that are genuinely new to the magic-link pages.

---

## PHPUNIT REQUIREMENTS

No new PHPUnit tests are required for this task. The backend is fully
covered by `test-magic-link-flows.php` from 5A-3a.

Baseline: **841 tests, 0 failures** — must not regress.

Run after implementation to confirm no regressions:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `/bookit-cancel/?booking_id=X&token=Y` renders a booking summary
      and "Confirm Cancellation" button when outside the policy window
- [ ] `/bookit-cancel/` shows "within policy window" notice and business
      phone number when appointment is too soon to cancel online
- [ ] `/bookit-cancel/` shows "Invalid or expired link" card when token
      is wrong or booking doesn't exist
- [ ] Clicking "Confirm Cancellation" POSTs to `wizard/cancel`, shows
      success message, and removes the button — no page reload
- [ ] `/bookit-reschedule/?booking_id=X&token=Y` renders booking summary
      and date/time inputs outside the policy window
- [ ] Clicking "Confirm Reschedule" without selecting date/time shows
      inline validation error — no network request
- [ ] Clicking "Confirm Reschedule" with a valid slot shows success
      message with new date and time — no page reload
- [ ] Already-cancelled bookings show a notice card, no action button
- [ ] All output escaped with `esc_html()` / `esc_attr()` / `esc_url()`

### Visual
- [ ] Both pages use `.bookit-confirmation-page` wrapper class and match
      the V2 confirmation page card layout
- [ ] Policy notice is blue-grey tinted with left border (matches Sprint 4C style)
- [ ] Success message is green-tinted; error message is red-tinted
- [ ] No hardcoded colour values in CSS — `--bookit-*` tokens only
- [ ] No browser console errors on either page

### Technical
- [ ] No PHP warnings or notices
- [ ] JS is a vanilla IIFE — no jQuery dependency
- [ ] `hash_equals()` used for token comparison in PHP template
      (defence-in-depth, even though backend also validates)
- [ ] PHPUnit suite still passes (841 tests, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` — booking submission unchanged
- [ ] `[bookit_booking_confirmed_v2]` — confirmation page unchanged
- [ ] No CSS bleed from `.bookit-magic-link-page` into other pages

---

## MANUAL TESTING STEPS (for Local by Flywheel after implementation)

1. Visit `/bookit-cancel/?booking_id=X&token=WRONG` — confirm error card
2. Get a real booking's `magic_link_token` from the DB:
   ```sql
   SELECT id, magic_link_token FROM wp_bookings WHERE status='confirmed' LIMIT 1;
   ```
3. Visit `/bookit-cancel/?booking_id=X&token=REAL_TOKEN` — confirm booking
   summary renders, button is present (if appointment is > 24h away)
4. Click "Confirm Cancellation" — confirm success message appears,
   button disappears, no page reload
5. Refresh the page — confirm "already cancelled" notice renders
6. Repeat steps 2–4 for `/bookit-reschedule/` using a different booking,
   entering a future date and time

No `npm run build` needed — this task has no Vue files.

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 3b: Magic link cancel/reschedule — frontend templates

- Create public/templates/cancel-booking.php (V2 card layout, vanilla JS IIFE)
- Create public/templates/reschedule-booking.php (V2 card layout, date/time inputs)
- Create public/assets/css/magic-link-pages.css (scoped --bookit-* tokens, no hardcoded colours)
- PHP policy window check on initial render matches backend enforcement
- hash_equals() token validation in template (defence-in-depth)
- Both pages handle already-cancelled, within-window, and invalid-token states

Tests: 841 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.