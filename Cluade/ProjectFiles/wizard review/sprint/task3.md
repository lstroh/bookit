Let me read the key files before writing the Task 3 prompt.Good — I have everything I need. I can see the exact patterns in both existing step templates, the `get_setting()` approach used throughout the codebase, and the staff model methods. Here is the Task 3 prompt:

---

```
TASK 3 OF 6: Steps 1 and 2 implementation
Sprint: Wizard-V2 | Est: ~5h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-1-services.php` — full existing Step 1; note how it loads `Bookit_Service_Model`, calls `get_active_services_by_category()`, and renders categories; v2 replicates this logic with different HTML only
2. `public/templates/booking-step-2-staff.php` — full existing Step 2; note session reads, `Bookit_Staff_Model` instantiation, `get_staff_for_service()` call, and initials/colour generation for avatar fallback
3. `public/templates/booking-wizard-v2-step-1.php` — stub to replace
4. `public/templates/booking-wizard-v2-step-2.php` — stub to replace
5. `public/assets/css/booking-wizard-v2.css` — v2 CSS class names to apply (all class names are defined here; do not invent new ones)
6. `design/wizard-step1.html` — Step 1 HTML structure reference; read the full file
7. `design/wizard-step2-list.html` — Step 2 list layout reference (1–3 staff); read the full file
8. `design/wizard-step2-grid.html` — Step 2 grid layout reference (4+ staff); read the full file
9. `design/wizard-design-decisions.md` — read Step 1 and Step 2 sections in full
10. `includes/models/class-service-model.php` — confirm `get_active_services_by_category()` return shape (keys: `id`, `name`, `duration`, `categories`, etc.)
11. `includes/models/class-staff-model.php` — confirm `get_staff_for_service()` return shape and available fields (`id`, `first_name`, `last_name`, `full_name`, `bio`, `title`, `photo_url`)
12. `tests/unit/test-booking-wizard-v2.php` — existing test class to extend with new test cases

If any file does not exist, stop and report back before proceeding.

---

## Context

This task replaces the step 1 and step 2 stub templates with full PHP implementations. All business logic — model instantiation, data fetching, session reads and writes, auto-skip rules — is replicated exactly from the existing step templates. The only differences are the HTML structure and CSS class names, which follow the v2 design reference files. The existing step templates must not be modified in any way.

---

## Implementation requirements

### `public/templates/booking-wizard-v2-step-1.php` — MODIFY (replace stub)

**Session and model setup** — replicate from `booking-step-1-services.php`:
- `require_once` for session manager (same path as existing template)
- `Bookit_Session_Manager::init()`
- `require_once` for `class-service-model.php`
- `$service_model = new Bookit_Service_Model()`
- `$services_by_category = $service_model->get_active_services_by_category()`
- Read `$selected_service_id` from session: `(int) Bookit_Session_Manager::get( 'service_id', 0 )`

**Auto-skip rule** — implement before rendering anything:
- Count total services across all categories: `array_sum( array_map( 'count', $services_by_category ) )`
- If total count === 1: extract the single service, call `Bookit_Session_Manager::set( 'service_id', $service['id'] )`, `Bookit_Session_Manager::set( 'service_name', $service['name'] )`, `Bookit_Session_Manager::set( 'service_duration', $service['duration'] )`, `Bookit_Session_Manager::set( 'current_step', 2 )`, then `wp_safe_redirect( get_permalink() )` and `exit`
- This redirect must happen before any output — place it at the very top of the template logic, before `ob_start()` or any HTML

**Empty services state** — replicate the no-services message from existing template using v2 wrapper class

**Outer wrapper:**
```html
<div class="bookit-v2-step bookit-v2-step--1">
  <div class="bookit-v2-step-body">
    <!-- heading, subheading, categories, sticky footer -->
  </div>
</div>
```

**Heading and subheading:**
- Heading: `<h2 class="bookit-v2-step-heading">What would you like to book?</h2>`
- Subheading: `<p class="bookit-v2-step-subheading">Select a service to get started.</p>`

**Grid class logic:**
- Count total services. If total ≤ 2: add class `bookit-v2-services-grid--few` to the grid element
- If total ≥ 3: use `bookit-v2-services-grid` only (auto-fill handles 2-column at wider widths)

**Category and card rendering:**
```php
foreach ( $services_by_category as $category_name => $services ) :
```
- Category label: `<p class="bookit-v2-category-label"><?php echo esc_html( $category_name ); ?></p>`
- Grid wrapper: `<div class="bookit-v2-services-grid [--few class if applicable]">`
- Each card:
  - Base class: `bookit-v2-service-card`
  - If `$service['id'] === $selected_service_id`: add `bookit-v2-service-card--selected`
  - `data-service-id`, `data-service-name`, `data-service-duration` attributes on the card div
  - Contents: `<p class="bookit-v2-service-name">` + `<p class="bookit-v2-service-duration">` with duration in minutes (e.g. "60 min") — no price

**Sticky footer:**
```html
<div class="bookit-v2-sticky-footer">
  <div class="bookit-v2-footer-inner">
    <button type="button" class="bookit-v2-cta-btn" id="bookit-v2-continue">Continue</button>
    <button type="button" class="bookit-v2-btn-back bookit-v2-btn-back--disabled" disabled>Back</button>
  </div>
</div>
```

---

### `public/templates/booking-wizard-v2-step-2.php` — MODIFY (replace stub)

**Session and model setup** — replicate from `booking-step-2-staff.php`:
- `require_once` for session manager, `Bookit_Session_Manager::init()`
- Read `$wizard_data = Bookit_Session_Manager::get_data()`
- Guard: if `empty( $wizard_data['service_id'] )`, render error message and `return`
- `$service_id = absint( $wizard_data['service_id'] )`
- `$service_name = isset( $wizard_data['service_name'] ) ? $wizard_data['service_name'] : ''`
- `$service_duration = isset( $wizard_data['service_duration'] ) ? (int) $wizard_data['service_duration'] : 0`
- `require_once` for `class-staff-model.php`
- `$staff_model = new Bookit_Staff_Model()`
- `$staff_members = $staff_model->get_staff_for_service( $service_id )`
- `$selected_staff_id = (int) Bookit_Session_Manager::get( 'staff_id', -1 )` (use -1 as "none selected" so staff ID 0 = any available is a valid selection)

**`staff_selection_hidden` auto-skip** — read setting using the same `$wpdb->get_var()` pattern used throughout the codebase:
```php
global $wpdb;
$staff_hidden = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
        'staff_selection_hidden'
    )
);
if ( '1' === $staff_hidden ) {
    Bookit_Session_Manager::set( 'staff_id', 0 );
    Bookit_Session_Manager::set( 'staff_name', 'Any available' );
    Bookit_Session_Manager::set( 'current_step', 3 );
    wp_safe_redirect( get_permalink() );
    exit;
}
```
Place this check after model setup but before rendering.

**Single staff auto-skip** — after fetching `$staff_members`:
```php
if ( count( $staff_members ) === 1 ) {
    $only = $staff_members[0];
    Bookit_Session_Manager::set( 'staff_id', $only['id'] );
    Bookit_Session_Manager::set( 'staff_name', $only['full_name'] );
    Bookit_Session_Manager::set( 'current_step', 3 );
    wp_safe_redirect( get_permalink() );
    exit;
}
```

**Avatar colour generation** — deterministic palette hash. Use this exact implementation:
```php
function bookit_v2_avatar_colour( $full_name ) {
    $palette = array( '#1a7a6e', '#7c5cbf', '#c46b1a', '#2a6db5', '#b5481a', '#1a6b7a' );
    return $palette[ abs( crc32( $full_name ) ) % count( $palette ) ];
}
```
Define this function at the top of the template file, wrapped in `if ( ! function_exists( 'bookit_v2_avatar_colour' ) )`.

**Initials generation** (for avatar fallback):
```php
$initials = strtoupper( substr( $staff['first_name'], 0, 1 ) . substr( $staff['last_name'], 0, 1 ) );
```

**Layout switch:**
- `count( $staff_members )` ≤ 3 (excluding "any available" row): use `bookit-v2-staff-list` container, render each staff as `.bookit-v2-staff-row`
- `count( $staff_members )` ≥ 4: use `bookit-v2-staff-grid` container, render each staff as `.bookit-v2-staff-card`

**Confirmation banner** (shows selected service from session):
```html
<div class="bookit-v2-confirm-banner">
  <span class="bookit-v2-confirm-banner-text">
    [service_name] · [duration] min
  </span>
  <button type="button" class="bookit-v2-confirm-banner-change" data-goto-step="1">Change</button>
</div>
```

**Heading and subheading:**
- Heading: `"Who would you like?"`
- Subheading: `"Choose a team member for your appointment."`

**Staff card / row rendering** (for both layouts):
- Base class: `bookit-v2-staff-card` (grid) or `bookit-v2-staff-row` (list)
- If staff has no working hours set or no availability this month: add `bookit-v2-staff-card--unavailable` / `bookit-v2-staff-row--unavailable`. Use `$staff['has_availability']` if present in model return, otherwise `$staff['working_hours_count'] > 0` as proxy
- If `$staff['id'] === $selected_staff_id`: add `--selected` class
- `data-staff-id` attribute on the card/row
- Avatar: `<span class="bookit-v2-avatar" style="background: <?php echo esc_attr( bookit_v2_avatar_colour( $staff['full_name'] ) ); ?>">` + initials inside
- Name: `.bookit-v2-staff-name`
- Title: `.bookit-v2-staff-title` (show if not empty)
- Price: `.bookit-v2-staff-price` — format as `£X` using `number_format( $staff['price'], 2 )` if price exists, otherwise omit
- Bio: `.bookit-v2-staff-bio` with `hidden` attribute by default — "Read more" toggle handled in Task 6 JS; for now render it hidden

**"Any available team member" row** — always render last, always full width:
```html
<div class="bookit-v2-staff-row bookit-v2-any-available [--selected if staff_id === 0]" data-staff-id="0">
  <div class="bookit-v2-avatar" style="background: #6b7280">?</div>
  <div class="bookit-v2-staff-info">
    <p class="bookit-v2-any-available-name">Any available team member</p>
    <p class="bookit-v2-any-available-sub">We'll match you with the first available person for your chosen time.</p>
  </div>
</div>
```
In grid layout, wrap in a `<div>` with `style="grid-column: 1 / -1"` to force full width.

**Sticky footer:**
```html
<div class="bookit-v2-sticky-footer">
  <div class="bookit-v2-footer-inner">
    <button type="button" class="bookit-v2-cta-btn" id="bookit-v2-continue">Continue</button>
    <a href="?step=1" class="bookit-v2-btn-back">Back</a>
  </div>
</div>
```

---

## PHPUnit requirements

Baseline: 768 tests, 0 failures — must not regress.

Add new test cases to the existing `Test_Booking_Wizard_V2` class in `tests/unit/test-booking-wizard-v2.php`. Read the file first — do not create a new class or file.

Required test cases:

- `test_v2_step1_renders_service_cards`: create test service + category + staff in DB, set `current_step` to 1 in session, call `do_shortcode( '[bookit_wizard_v2]' )`, assert output contains `bookit-v2-service-card`
- `test_v2_step1_single_service_auto_skips_to_step2`: create exactly 1 service + category + staff, set session to step 1, render shortcode; because redirect cannot fire in test context (headers sent), assert that `Bookit_Session_Manager::get( 'current_step' )` is `2` after render (the redirect target, not the render itself)
- `test_v2_step1_few_services_adds_few_class`: create 2 services in same category + staff, render step 1, assert output contains `bookit-v2-services-grid--few`
- `test_v2_step1_three_or_more_services_no_few_class`: create 3 services + staff, render step 1, assert output does NOT contain `bookit-v2-services-grid--few`
- `test_v2_step2_renders_list_layout_for_three_staff`: create service + 3 staff, set session `service_id`, set `current_step` to 2, render, assert output contains `bookit-v2-staff-list`
- `test_v2_step2_renders_grid_layout_for_four_staff`: create service + 4 staff, set session, render step 2, assert output contains `bookit-v2-staff-grid`
- `test_v2_step2_single_staff_auto_skips_to_step3`: create service + 1 staff, set session, render; assert `Bookit_Session_Manager::get( 'current_step' )` is `3`
- `test_v2_step2_hidden_staff_mode_auto_skips_to_step3`: insert `staff_selection_hidden = '1'` into `wp_bookings_settings`, create service + 2 staff, set session, render; assert `current_step` is `3`; clean up setting after test
- `test_v2_step2_avatar_colour_is_deterministic`: call `bookit_v2_avatar_colour( 'Elena Torres' )` twice, assert both calls return the same hex string

Note on redirect tests: `wp_safe_redirect()` in a test context will call `wp_die()` or be intercepted. To handle this, wrap the `do_shortcode()` call in a `try/catch` for `WPDieException` or use `$this->expectException()`, and then assert the session value after. Review how existing redirect tests in the test suite handle this — follow the same pattern.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 776 tests must pass (768 baseline + 8 new) before marking task complete.

---

## Acceptance criteria

### Functional
- [ ] Step 1 renders service cards grouped by category with name + duration only (no price)
- [ ] Step 1 uses `--few` single-column layout when ≤ 2 services total
- [ ] Step 1 auto-skips to step 2 (session advances) when only 1 service exists
- [ ] Step 1 Back button is disabled on step 1
- [ ] Step 2 confirmation banner shows selected service + duration + Change link
- [ ] Step 2 renders list layout for 1–3 staff, grid layout for 4+ staff
- [ ] Step 2 auto-skips to step 3 (session advances) when only 1 staff member
- [ ] Step 2 auto-skips to step 3 when `staff_selection_hidden = '1'` in settings
- [ ] Avatar colour is consistent for the same staff name across page loads
- [ ] Unavailable staff shown with `--unavailable` class (greyed out, not selectable)
- [ ] "Any available team member" row always appears last
- [ ] In grid layout, "Any available" row spans full width

### Technical
- [ ] No PHP warnings or notices
- [ ] All session reads/writes use `Bookit_Session_Manager`
- [ ] `staff_selection_hidden` setting read via `$wpdb->get_var()` direct query (not a helper function)
- [ ] `bookit_v2_avatar_colour()` defined inside `if ( ! function_exists() )` guard
- [ ] All redirects use `wp_safe_redirect()` followed by `exit`
- [ ] No modifications to `booking-step-1-services.php` or `booking-step-2-staff.php`
- [ ] PHPUnit suite passes (776 tests, 0 failures)

### Must NOT break
- [ ] `[bookit_booking_wizard]` still renders correctly
- [ ] All 768 existing tests still pass

---

## Git commit message

```
Sprint Wizard-V2, Task 3: Steps 1 and 2 implementation

- Replace step 1 stub: service cards, category grouping, --few class
  for ≤2 services, auto-skip when single service, disabled Back button
- Replace step 2 stub: list/grid layout switch, avatar colour hash,
  deterministic palette, unavailable state, any-available row,
  staff_selection_hidden auto-skip, single staff auto-skip
- 8 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 776 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.