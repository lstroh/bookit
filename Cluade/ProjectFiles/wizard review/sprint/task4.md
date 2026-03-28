I have everything I need. The existing step 3 template is largely JS-driven (calendar populated by `datetime-picker.js`), but the v2 design calls for a **PHP-rendered calendar** — a key difference. I have the full `Bookit_DateTime_Model` API confirmed. Here is the Task 4 prompt:

---

```
TASK 4 OF 6: Step 3 date and time selection
Sprint: Wizard-V2 | Est: ~4h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-3-datetime.php` — existing Step 3; note that it is JS-driven (calendar populated by `datetime-picker.js`); v2 replaces this with a PHP-rendered calendar — do NOT copy the JS-driven pattern
2. `public/templates/booking-wizard-v2-step-3.php` — stub to replace
3. `includes/models/class-datetime-model.php` — read in full; confirms: `get_available_slots( $date, $service_id, $staff_id )`, `group_time_slots( $slots )`, `is_bank_holiday( $date )`, `is_past_date( $date )` — these are the only methods available; there is NO `get_available_days_in_month()` method
4. `public/assets/css/booking-wizard-v2.css` — confirm all CSS class names for calendar, slots, footer
5. `design/wizard-step3.html` — full HTML structure reference; read before writing any markup
6. `design/wizard-design-decisions.md` — Step 3 section
7. `tests/unit/test-booking-wizard-v2.php` — existing test class to extend

If any file does not exist, stop and report back before proceeding.

---

## Context

This task replaces the step 3 stub with a full PHP-rendered calendar and time slot grid. Unlike the existing v1 step 3 (which delegates everything to JavaScript), the v2 calendar is rendered server-side in PHP. The current month's days are built in PHP, day states are assigned in PHP, and available slots for the currently selected date (if any) are fetched from `Bookit_DateTime_Model` and grouped into Morning/Afternoon/Evening sections. JavaScript (Task 6) handles date tap → slot reveal and slot selection; PHP handles the initial render only.

---

## Implementation requirements

### `public/templates/booking-wizard-v2-step-3.php` — MODIFY (replace stub)

**Session and model setup:**
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/core/class-session-manager.php';
Bookit_Session_Manager::init();
$wizard_data      = Bookit_Session_Manager::get_data();
$service_id       = isset( $wizard_data['service_id'] ) ? absint( $wizard_data['service_id'] ) : 0;
$staff_id         = isset( $wizard_data['staff_id'] ) ? absint( $wizard_data['staff_id'] ) : 0;
$service_name     = isset( $wizard_data['service_name'] ) ? $wizard_data['service_name'] : '';
$service_duration = isset( $wizard_data['service_duration'] ) ? (int) $wizard_data['service_duration'] : 0;
$staff_name       = isset( $wizard_data['staff_name'] ) ? $wizard_data['staff_name'] : '';
$selected_date    = isset( $wizard_data['date'] ) ? $wizard_data['date'] : '';
$selected_time    = isset( $wizard_data['time'] ) ? $wizard_data['time'] : '';
```

Guard: if `! $service_id`, render error message and `return`.

**DateTime model:**
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/models/class-datetime-model.php';
$datetime_model = new Bookit_DateTime_Model();
```

**Month navigation:**
- Read `$view_month` from `$_GET['month']` if set (format: `Y-m`, e.g. `2026-05`), sanitised with `sanitize_text_field`
- Default to current month: `date( 'Y-m' )`
- Clamp: do not allow navigating to past months (if `$view_month < date( 'Y-m' )`, reset to current)
- Derive: `$view_year = (int) substr( $view_month, 0, 4 )`, `$view_month_num = (int) substr( $view_month, 5, 2 )`
- Prev month URL: `add_query_arg( 'month', date( 'Y-m', strtotime( $view_month . '-01 -1 month' ) ), get_permalink() )`
- Next month URL: `add_query_arg( 'month', date( 'Y-m', strtotime( $view_month . '-01 +1 month' ) ), get_permalink() )`
- Hide prev arrow when `$view_month === date( 'Y-m' )` (can't go back to past months)

**Calendar day grid construction:**
```php
$first_day_of_month  = mktime( 0, 0, 0, $view_month_num, 1, $view_year );
$days_in_month       = (int) date( 't', $first_day_of_month );
$first_dow           = (int) date( 'N', $first_day_of_month ); // 1=Mon, 7=Sun
$today               = date( 'Y-m-d' );
```

Build an array of day cells. Pad the start with `$first_dow - 1` empty cells (for Mon–Sun grid). For each day 1–`$days_in_month`:
- Build `$date_str = sprintf( '%04d-%02d-%02d', $view_year, $view_month_num, $day )`
- Determine state:
  - `bookit-v2-day--selected` if `$date_str === $selected_date`
  - `bookit-v2-day--today` if `$date_str === $today` (can coexist with selected or available)
  - `bookit-v2-day--disabled` if `$datetime_model->is_past_date( $date_str )` OR `$datetime_model->is_bank_holiday( $date_str )`
  - `bookit-v2-day--available` otherwise
- Each day cell: `<button type="button" class="bookit-v2-day [state-classes]" data-date="[date_str]">[day_number]</button>`
- Disabled days: add `disabled` attribute and `aria-disabled="true"`
- Empty pad cells: `<span class="bookit-v2-day-empty"></span>`

**Weekday headers** (Mon–Sun, always 7 columns):
```php
$dow_labels = array( 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' );
```

**Time slot rendering:**
- If `$selected_date` is not empty and is not disabled:
  - Call `$slots_raw = $datetime_model->get_available_slots( $selected_date, $service_id, $staff_id )`
  - Call `$slots_grouped = $datetime_model->group_time_slots( $slots_raw )`
  - Render three sections: Morning (before 12:00), Afternoon (12:00–16:59), Evening (17:00+)
  - For each group: only render the section if `! empty( $slots_grouped['morning'] )` etc — skip entirely if empty
  - Section wrapper: `<div class="bookit-v2-time-section">`
  - Label: `<p class="bookit-v2-time-section-label">Morning</p>` (or Afternoon/Evening)
  - Slots grid: `<div class="bookit-v2-slots-grid">`
  - Each slot: `<button type="button" class="bookit-v2-slot bookit-v2-slot--available [bookit-v2-slot--selected if matches $selected_time]" data-time="[H:i:s]">[display time]</button>`
  - Display time: format as `H:i` (24-hour, e.g. `09:00`, `14:30`) using `date( 'H:i', strtotime( $slot ) )`
- If `$selected_date` is empty: render an empty `<div class="bookit-v2-time-sections" id="bookit-v2-time-sections"></div>` placeholder (JS populates after date tap in Task 6)
- Wrap all time sections in `<div class="bookit-v2-time-sections" id="bookit-v2-time-sections">`

**Confirmation banner:**
```html
<div class="bookit-v2-confirm-banner">
  <span class="bookit-v2-confirm-banner-text">
    [service_name] · [duration] min · [staff_name]
  </span>
  <button type="button" class="bookit-v2-confirm-banner-change" data-goto-step="2">Change</button>
</div>
```

**Headings:**
- `<h2 class="bookit-v2-step-heading">When would you like to come in?</h2>`
- `<p class="bookit-v2-step-subheading">Choose a date and time for your appointment.</p>`

**Outer wrapper:**
```html
<div class="bookit-v2-step bookit-v2-step--3">
  <div class="bookit-v2-step-body">
    <!-- confirmation banner, heading, subheading, calendar, time sections -->
  </div>
</div>
```

**Sticky footer:**
```html
<div class="bookit-v2-sticky-footer">
  <div class="bookit-v2-footer-inner">
    <button type="button" class="bookit-v2-cta-btn" id="bookit-v2-continue"
      <?php echo ( empty( $selected_date ) || empty( $selected_time ) ) ? 'disabled' : ''; ?>>
      Continue
    </button>
    <a href="?step=2" class="bookit-v2-btn-back">Back</a>
  </div>
</div>
```

---

## PHPUnit requirements

Baseline: 777 tests, 0 failures — must not regress.

Add new test cases to the existing `Test_Booking_Wizard_V2` class in `tests/unit/test-booking-wizard-v2.php`. Read the file first — do not create a new class.

Required test cases:

- `test_v2_step3_renders_calendar`: set session to step 3 with valid `service_id` and `staff_id`, render shortcode, assert output contains `bookit-v2-day--available` or `bookit-v2-day--disabled` (at least one day cell rendered)
- `test_v2_step3_morning_group_hidden_when_empty`: mock a selected date with no morning slots — morning section element absent from output. Approach: set `selected_date` in session to a past date (all slots disabled) or a bank holiday, assert `bookit-v2-time-section` is not present
- `test_v2_step3_slots_not_rendered_when_no_date_selected`: no `date` in session, render step 3, assert `bookit-v2-slot` is NOT in output
- `test_v2_step3_continue_button_disabled_when_no_slot_selected`: no `time` in session, render step 3, assert output contains `bookit-v2-cta-btn" disabled` or `bookit-v2-cta-btn"  disabled`

Note on session setup for step 3 tests: set `current_step` to 3, `service_id` to a valid created service ID, `staff_id` to 0 or a valid staff ID. Create the service and staff using the existing helper methods in the test class.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 781 tests must pass (777 baseline + 4 new) before marking task complete.

---

## Acceptance criteria

### Functional
- [ ] Confirmation banner shows service + duration + staff name + Change link
- [ ] Calendar renders current month with correct Mon–Sun column headers
- [ ] Past days and bank holidays rendered with `bookit-v2-day--disabled` class and `disabled` attribute
- [ ] Today's date has `bookit-v2-day--today` class
- [ ] Selected date (from session) has `bookit-v2-day--selected` class
- [ ] Cannot navigate to past months (prev arrow hidden on current month)
- [ ] Time sections only rendered when `$selected_date` is set in session
- [ ] Empty time groups (Morning/Afternoon/Evening) not rendered
- [ ] Selected slot (from session) has `bookit-v2-slot--selected` class
- [ ] Continue button disabled when no date+time in session

### Technical
- [ ] No PHP warnings or notices
- [ ] All session reads use `Bookit_Session_Manager`
- [ ] Only `Bookit_DateTime_Model` methods confirmed to exist are called
- [ ] No call to any non-existent method such as `get_available_days_in_month()`
- [ ] `booking-step-3-datetime.php` unchanged
- [ ] PHPUnit suite passes (781 tests, 0 failures)

### Must NOT break
- [ ] `[bookit_booking_wizard]` still renders correctly
- [ ] All 777 existing tests still pass

---

## Git commit message

```
Sprint Wizard-V2, Task 4: Step 3 date and time selection

- Replace step 3 stub: PHP-rendered month calendar with day states,
  Mon-Sun grid, prev/next month navigation clamped to current month
- Time slot grid grouped Morning/Afternoon/Evening, empty groups hidden
- Slots fetched from Bookit_DateTime_Model::get_available_slots()
- Confirmation banner shows service + duration + staff name
- Continue button disabled until date and time both in session
- 4 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 781 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.