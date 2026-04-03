Good catch. Before I write a fix, I need to understand exactly what "same rules as the wizard" means for the reschedule flow. Let me check the wizard's Step 3 implementation.Good. Now I understand the issue clearly. The wizard Step 3 renders a **PHP calendar** with available days highlighted, then fetches available **time slots** for a clicked day via `GET bookit/v1/wizard/timeslots` (the alias added to `class-datetime-api.php`). The reschedule template currently shows raw `<input type="date">` and `<input type="time">` fields, which means:

1. The customer can type any date/time — including days when the staff member doesn't work, bank holidays, or already-booked slots
2. There's no visual feedback about what's actually available

The fix is to **reuse the same timeslots endpoint** in the reschedule template — PHP-rendered calendar for date selection, JS slot fetch on day click, slot buttons for time selection — exactly like Step 3 of the wizard.

Here is the fix prompt for Cursor:

---

```
TASK 5A-3b FIX: Reschedule template — replace date/time inputs with wizard Step 3 calendar
Sprint: 5A | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-wizard-v2-step-3.php` — read in full.
   This is the **exact pattern** to replicate in the reschedule template.
   Note: how the PHP calendar grid is rendered, how days are marked
   available/unavailable, how the `data-date` attribute is set on each
   day cell, how the JS slot fetch is triggered on day tap.
2. `public/assets/js/booking-wizard-v2.js` — find the `initStep3()`
   function (or equivalent). Read how it: fetches slots via
   `GET bookit/v1/wizard/timeslots?staff_id=X&service_id=Y&date=YYYY-MM-DD`,
   renders slot buttons, handles slot selection, and stores the selected
   date/time before allowing the user to proceed.
3. `includes/api/class-datetime-api.php` — confirm the exact endpoint
   URL and parameters accepted by the timeslots endpoint:
   `staff_id`, `service_id`, `date`. Confirm the response shape
   (array of time strings, or objects with `time` / `available` keys).
4. `public/templates/reschedule-booking.php` — read the current file
   in full before making any changes.
5. `public/assets/css/booking-wizard-v2.css` — read the calendar and
   slot button CSS class names so the reschedule template uses the same
   classes and inherits the same styles.

---

## CONTEXT

The reschedule template currently shows raw `<input type="date">` and
`<input type="time">` text inputs. This allows customers to enter dates
when the staff member is not working, bank holidays, and already-booked
slots — none of which would be caught until the REST endpoint rejects
the request. The fix replaces those inputs with the same calendar +
slot-fetch pattern used in wizard Step 3, so only genuinely available
slots can be selected. The `bookit/v1/wizard/timeslots` endpoint already
exists and is already public — no backend changes are needed.

---

## IMPLEMENTATION REQUIREMENTS

### `public/templates/reschedule-booking.php` — MODIFY

Replace the `<input type="date">` / `<input type="time">` form and its
surrounding JS with the following:

**PHP section additions (before HTML output):**

The template already has `$booking` loaded with `service_id` and `staff_id`.
Add:
```php
// For the calendar: determine current month to display.
$today         = new DateTime( 'now', $tz );
$display_month = $today->format( 'Y-m' ); // e.g. '2026-04'
$cal_year      = (int) $today->format( 'Y' );
$cal_month     = (int) $today->format( 'm' );
```

**Replace the reschedule form HTML block** (the div containing `<input type="date">`,
`<input type="time">`, and the confirm button) with:

```html
<div class="bookit-magic-action" id="bookit-reschedule-action">
  <h3><?php esc_html_e( 'Choose a new date and time', 'bookit-booking-system' ); ?></h3>

  <div class="bookit-magic-message" id="bookit-reschedule-message"
       style="display:none;"></div>

  <!-- Calendar — reuse wizard Step 3 PHP calendar pattern exactly -->
  <div class="bookit-v2-calendar" id="bookit-reschedule-calendar"
       data-staff-id="<?php echo esc_attr( $booking['staff_id'] ); ?>"
       data-service-id="<?php echo esc_attr( $booking['service_id'] ); ?>"
       data-timeslots-url="<?php echo esc_url( rest_url( 'bookit/v1/wizard/timeslots' ) ); ?>">

    <?php
    // PHP calendar grid — replicate booking-wizard-v2-step-3.php calendar rendering.
    // Read that file FIRST and copy the grid generation logic here.
    // Key rules:
    // - Days before today must be marked data-unavailable="1" and get --disabled class
    // - Render only the current month initially (month navigation is optional for reschedule)
    // - Each available day cell: <div class="bookit-v2-day" data-date="YYYY-MM-DD">D</div>
    // - Unavailable/past day cell: <div class="bookit-v2-day bookit-v2-day--disabled">D</div>
    // - Do NOT do a DB availability lookup here — just block past dates in PHP.
    //   Actual slot availability is determined by the timeslots endpoint.
    ?>

  </div><!-- .bookit-v2-calendar -->

  <!-- Slot list — hidden until a date is selected -->
  <div class="bookit-v2-slots" id="bookit-reschedule-slots" style="display:none;">
    <p class="bookit-v2-slots__loading" id="bookit-reschedule-slots-loading">
      <?php esc_html_e( 'Loading available times\u2026', 'bookit-booking-system' ); ?>
    </p>
    <div class="bookit-v2-slots__list" id="bookit-reschedule-slots-list"></div>
    <p class="bookit-v2-slots__empty" id="bookit-reschedule-slots-empty"
       style="display:none;">
      <?php esc_html_e( 'No available times on this date. Please choose another day.', 'bookit-booking-system' ); ?>
    </p>
  </div>

  <!-- Confirm button — disabled until date + slot selected -->
  <button
    class="bookit-btn-primary"
    id="bookit-reschedule-confirm"
    disabled
    data-booking-id="<?php echo esc_attr( $booking_id ); ?>"
    data-token="<?php echo esc_attr( $token ); ?>"
    data-rest-url="<?php echo esc_url( $rest_url . 'reschedule' ); ?>"
  >
    <?php esc_html_e( 'Confirm Reschedule', 'bookit-booking-system' ); ?>
  </button>
</div>
```

**Replace the inline `<script>` block** with:

```javascript
(function () {
  var calendar    = document.getElementById('bookit-reschedule-calendar');
  var slotsWrap   = document.getElementById('bookit-reschedule-slots');
  var slotsList   = document.getElementById('bookit-reschedule-slots-list');
  var slotsEmpty  = document.getElementById('bookit-reschedule-slots-empty');
  var slotsLoading= document.getElementById('bookit-reschedule-slots-loading');
  var confirmBtn  = document.getElementById('bookit-reschedule-confirm');
  var msgEl       = document.getElementById('bookit-reschedule-message');

  if (!calendar || !confirmBtn) return;

  var staffId     = calendar.dataset.staffId;
  var serviceId   = calendar.dataset.serviceId;
  var timeslotsUrl= calendar.dataset.timeslotsUrl;
  var selectedDate= null;
  var selectedTime= null;

  // Day tap — fetch slots for selected date.
  calendar.addEventListener('click', function (e) {
    var day = e.target.closest('[data-date]');
    if (!day || day.classList.contains('bookit-v2-day--disabled')) return;

    // Clear previous selection.
    calendar.querySelectorAll('.bookit-v2-day--selected')
            .forEach(function (d) { d.classList.remove('bookit-v2-day--selected'); });
    day.classList.add('bookit-v2-day--selected');

    selectedDate = day.dataset.date;
    selectedTime = null;
    confirmBtn.disabled = true;

    // Show slots area, show loading.
    slotsWrap.style.display   = 'block';
    slotsLoading.style.display= 'block';
    slotsList.innerHTML       = '';
    slotsEmpty.style.display  = 'none';

    fetch(timeslotsUrl + '?staff_id=' + staffId
                       + '&service_id=' + serviceId
                       + '&date=' + selectedDate)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        slotsLoading.style.display = 'none';
        var slots = Array.isArray(data) ? data : (data.slots || []);

        if (!slots.length) {
          slotsEmpty.style.display = 'block';
          return;
        }

        slots.forEach(function (slot) {
          // Slot may be a string "HH:MM" or object {time:"HH:MM"}.
          var timeVal = typeof slot === 'string' ? slot : slot.time;
          var btn     = document.createElement('button');
          btn.type      = 'button';
          btn.className = 'bookit-v2-slot';
          btn.textContent = timeVal;
          btn.dataset.time = timeVal;

          btn.addEventListener('click', function () {
            slotsList.querySelectorAll('.bookit-v2-slot--selected')
                     .forEach(function (s) { s.classList.remove('bookit-v2-slot--selected'); });
            btn.classList.add('bookit-v2-slot--selected');
            selectedTime = timeVal;
            confirmBtn.disabled = false;
          });

          slotsList.appendChild(btn);
        });
      })
      .catch(function () {
        slotsLoading.style.display = 'none';
        slotsEmpty.style.display   = 'block';
        slotsEmpty.textContent     = 'Could not load available times. Please try again.';
      });
  });

  // Confirm reschedule.
  confirmBtn.addEventListener('click', function () {
    if (!selectedDate || !selectedTime) return;

    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Rescheduling\u2026';

    fetch(confirmBtn.dataset.restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: parseInt(confirmBtn.dataset.bookingId, 10),
        token:      confirmBtn.dataset.token,
        new_date:   selectedDate,
        new_time:   selectedTime
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      msgEl.style.display = 'block';
      if (data.success) {
        msgEl.className   = 'bookit-magic-message bookit-magic-message--success';
        msgEl.textContent = 'Your booking has been rescheduled to '
                          + data.new_date + ' at ' + data.new_time + '.';
        document.getElementById('bookit-reschedule-action')
                .querySelectorAll('button, .bookit-v2-day')
                .forEach(function (el) { el.style.pointerEvents = 'none'; });
      } else {
        msgEl.className      = 'bookit-magic-message bookit-magic-message--error';
        msgEl.textContent    = (data.message) || 'Something went wrong. Please try again.';
        confirmBtn.disabled  = false;
        confirmBtn.textContent = 'Confirm Reschedule';
      }
    })
    .catch(function () {
      msgEl.style.display    = 'block';
      msgEl.className        = 'bookit-magic-message bookit-magic-message--error';
      msgEl.textContent      = 'A network error occurred. Please try again.';
      confirmBtn.disabled    = false;
      confirmBtn.textContent = 'Confirm Reschedule';
    });
  });
}());
```

### `public/assets/css/magic-link-pages.css` — MODIFY (minor additions only)

The wizard calendar CSS classes (`.bookit-v2-calendar`, `.bookit-v2-day`,
`.bookit-v2-day--disabled`, `.bookit-v2-slot`, etc.) are already defined
in `booking-wizard-v2.css`, which is loaded as a dependency of
`bookit-confirmation-v2`, which is loaded as a dependency of
`bookit-magic-link-pages`. So those styles are already available.

Read `booking-wizard-v2.css` to confirm this before adding anything.
Only add overrides if the calendar or slot styles need adjustment within
the `.bookit-magic-link-page` context (e.g. max-width constraint so the
calendar doesn't stretch full-width in the card layout). Do not duplicate
any rules already in `booking-wizard-v2.css`.

---

## PHPUNIT REQUIREMENTS

No new tests. Baseline: **841 tests, 0 failures** — must not regress.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

- [ ] `/bookit-reschedule/` shows a PHP-rendered monthly calendar, not raw date/time inputs
- [ ] Tapping an available day fetches real slots via `bookit/v1/wizard/timeslots`
- [ ] Days before today are visually disabled and not tappable
- [ ] If no slots available for a day, "No available times" message shown
- [ ] Slot buttons render and are selectable; selected slot is highlighted
- [ ] "Confirm Reschedule" button is disabled until both day and slot are selected
- [ ] On success, confirmation message shows new date and time
- [ ] No `<input type="date">` or `<input type="time">` fields remain in the template
- [ ] PHPUnit suite still passes (841 tests, 0 failures)
- [ ] No browser console errors

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 3b fix: Replace reschedule date/time inputs with wizard calendar

- Reschedule template now uses PHP calendar grid + timeslots endpoint fetch
- Matches wizard Step 3 pattern: day tap → slot fetch → slot selection → confirm
- Only genuinely available slots can be selected
- Confirm button disabled until valid date + slot chosen

Tests: 841 passing, 0 failures
```

---

If you encounter a conflict with existing code not covered above,
STOP and report back before writing any code.