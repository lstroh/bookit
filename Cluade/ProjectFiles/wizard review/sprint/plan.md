Good plan. Here's the full sprint brief, ready to paste into a new chat.

---

# Sprint — Wizard V2 Implementation

**Plugin root:** `bookit-booking-system/`
**Branch:** Phase1
**Baseline test count:** 761 tests, 0 failures
**Reference files:** `design/wizard-design-decisions.md` and all `design/wizard-step*.html` files

---

## Sprint overview

Build a Wizard V2 alongside the existing wizard. The existing wizard (`[bookit_booking_wizard]`, `booking-step-*.php`) must not be modified in any way. All new code is additive only. The new wizard is registered as `[bookit_wizard_v2]` shortcode and a WordPress page template. It uses new template files, a new CSS file, and a new JS file. It reuses existing `--bookit-*` CSS tokens where possible and adds new `--bookit-v2-*` tokens only for components with no existing equivalent.

---

## Task 1 of 6 — Registration & asset scaffolding (~3h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/class-shortcodes.php` — existing shortcode registration and asset enqueueing patterns to follow exactly
2. `includes/class-bookit-template-loader.php` — template loader API to use for all template includes
3. `includes/class-bookit-loader.php` — to confirm where Bookit_Shortcodes is loaded
4. `public/templates/booking-wizard-shell.php` — existing shell pattern to follow for the v2 shell stub
5. `tests/unit/test-booking-shortcode.php` — existing shortcode test patterns to follow

If any file does not exist, stop and report back before proceeding.

### Context

This task creates the scaffolding for Wizard V2 — registration, asset detection, and stub templates. No step content or styling is implemented yet. The goal is to get `[bookit_wizard_v2]` rendering an empty container on a WordPress page, with the correct CSS and JS enqueued, while the existing wizard continues to work exactly as before.

### Implementation requirements

#### `public/class-shortcodes.php` — MODIFY
- Add `add_shortcode( 'bookit_wizard_v2', array( $this, 'render_booking_wizard_v2' ) )` in `__construct()`, immediately after the existing `bookit_booking_wizard` registration
- Add method `render_booking_wizard_v2()` following the exact same pattern as `render_booking_wizard()`: init session, check expiry, get/validate current_step from session (1–5, default 1), support `?step=` backward navigation, load shell via `Bookit_Template_Loader::get_template( 'booking-wizard-v2-shell.php' )`, return `ob_get_clean()`
- In `enqueue_wizard_assets()`, add `$has_wizard_v2` detection using `has_shortcode( $post->post_content, 'bookit_wizard_v2' )` following the same pattern as `$has_wizard`
- When `$has_wizard_v2` is true, enqueue:
  - Style: handle `bookit-wizard-v2`, file `public/assets/css/booking-wizard-v2.css`, no deps, version `BOOKIT_VERSION`
  - Script: handle `bookit-wizard-v2`, file `public/assets/js/booking-wizard-v2.js`, deps `['jquery']`, version `BOOKIT_VERSION`, footer true
- Localize the v2 script as `bookitWizardV2` with the same keys as `bookitWizard` (restUrl, ajaxUrl, nonce, bookingNonce, currentStep) plus two new keys: `depositAmount` (float, from session `deposit_due` or 0.00) and `totalAmount` (float, from session `total_price` or 0.00)
- Must not modify any existing detection, enqueueing, or localization logic

#### `public/templates/page-wizard-v2.php` — CREATE
- WordPress page template file
- Template name comment at top: `Template Name: Bookit Wizard V2`
- Calls `get_header()`, then `echo do_shortcode( '[bookit_wizard_v2]' )`, then `get_footer()`

#### `public/templates/booking-wizard-v2-shell.php` — CREATE
- Stub only at this stage — step sub-templates do not exist yet
- Extract `$current_step` from session (same pattern as `booking-wizard-shell.php`)
- Render outer wrapper: `<div class="bookit-v2-wizard-container" data-step="<?php echo esc_attr( $current_step ); ?>">`
- Include progress bar partial: `Bookit_Template_Loader::get_template( 'partials/booking-wizard-v2-progress.php', [ 'current_step' => $current_step ] )`
- For each step 1–5, conditionally include the step template stub when `$current_step === N`: `Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-N.php' )`
- Close the wrapper div

#### `public/templates/partials/booking-wizard-v2-progress.php` — CREATE
- Stub only — outputs a `<nav class="bookit-v2-progress">` placeholder with five `<span>` elements labelled Service, Staff, Date & Time, Your Details, Payment
- Assigns classes `bookit-v2-step-item--active`, `bookit-v2-step-item--done`, `bookit-v2-step-item--inactive` based on `$current_step`

#### `public/templates/booking-wizard-v2-step-1.php` through `booking-wizard-v2-step-5.php` — CREATE (stubs)
- Each file outputs a single `<div class="bookit-v2-step bookit-v2-step--N">Step N placeholder</div>`
- No logic yet — that comes in Tasks 3–6

#### `public/assets/css/booking-wizard-v2.css` — CREATE (stub)
- Empty file with a comment block only:
  ```css
  /*
   * Bookit Wizard V2 Stylesheet
   * Styles implemented in Task 2.
   * All selectors scoped inside .bookit-v2-wizard-container
   */
  ```

#### `public/assets/js/booking-wizard-v2.js` — CREATE (stub)
- Empty file with a comment block and a `DOMContentLoaded` listener stub:
  ```js
  /* Bookit Wizard V2 — JS implemented in Task 6 */
  ( function() {
    'use strict';
    document.addEventListener( 'DOMContentLoaded', function() {
      if ( ! document.querySelector( '.bookit-v2-wizard-container' ) ) return;
    } );
  } )();
  ```

### PHPUnit requirements

Baseline: 761 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-booking-wizard-v2.php`

Required test cases:
- `test_v2_shortcode_renders_wizard_container`: `do_shortcode( '[bookit_wizard_v2]' )` output contains `bookit-v2-wizard-container`
- `test_v2_shortcode_does_not_break_existing_wizard`: `do_shortcode( '[bookit_booking_wizard]' )` output still contains `bookit-wizard-container`
- `test_v2_css_enqueued_on_page_with_v2_shortcode`: `bookit-wizard-v2` style handle is in queue when page contains `[bookit_wizard_v2]`
- `test_v2_css_not_enqueued_on_page_without_v2_shortcode`: `bookit-wizard-v2` style handle is not in queue on unrelated page
- `test_v2_css_not_enqueued_on_page_with_only_v1_shortcode`: `bookit-wizard-v2` style handle is not in queue when page contains only `[bookit_booking_wizard]`
- `test_v2_and_v1_can_coexist_on_same_page`: both `bookit-wizard` and `bookit-wizard-v2` style handles enqueued when page contains both shortcodes

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

### Acceptance criteria

#### Functional
- [ ] `[bookit_wizard_v2]` shortcode renders on a WordPress page without errors
- [ ] Rendered output contains `.bookit-v2-wizard-container`
- [ ] Progress bar partial renders with five step items, correct active/done/inactive classes
- [ ] Step placeholder text visible for the current step
- [ ] `?step=2` (with step 2 already completed in session) navigates backward correctly
- [ ] Page template "Bookit Wizard V2" appears in WordPress page template dropdown
- [ ] `booking-wizard-v2.css` is enqueued on pages with `[bookit_wizard_v2]`
- [ ] `booking-wizard-v2.css` is NOT enqueued on pages without `[bookit_wizard_v2]`

#### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Follows existing `render_booking_wizard()` pattern exactly
- [ ] All template includes use `Bookit_Template_Loader::get_template()`
- [ ] PHPUnit suite passes (767+ tests, 0 failures)

#### Must NOT break
- [ ] `[bookit_booking_wizard]` shortcode still renders correctly
- [ ] All existing shortcode PHPUnit tests still pass
- [ ] Existing CSS and JS assets still enqueue correctly on v1 pages

### Git commit message
```
Sprint Wizard-V2, Task 1: Scaffolding — shortcode, page template, shell, stubs

- Register [bookit_wizard_v2] shortcode in Bookit_Shortcodes
- Add render_booking_wizard_v2() following render_booking_wizard() pattern
- Add bookit-wizard-v2 CSS/JS asset detection and enqueueing
- Add bookitWizardV2 localised script object with depositAmount/totalAmount
- Create page-wizard-v2.php WordPress page template
- Create booking-wizard-v2-shell.php stub
- Create partials/booking-wizard-v2-progress.php stub
- Create booking-wizard-v2-step-1.php through step-5.php stubs
- Create booking-wizard-v2.css and booking-wizard-v2.js stubs
- Add 6 PHPUnit tests in test-booking-wizard-v2.php

Tests: 767 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

## Task 2 of 6 — CSS & progress bar (~4h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/assets/css/booking-wizard.css` — full existing token list to reuse; do not duplicate any token
2. `public/assets/css/booking-wizard-v2.css` — stub from Task 1 to replace with full implementation
3. `public/templates/partials/booking-wizard-v2-progress.php` — stub to replace with full implementation
4. `design/wizard-design-decisions.md` — all visual decisions including token values
5. `design/wizard-step1.html` — reference HTML/CSS structure for card and grid components
6. `design/wizard-step2-list.html` and `design/wizard-step2-grid.html` — staff card components
7. `design/wizard-step3.html` — calendar and time slot components
8. `design/wizard-step4.html` — form and waiver components
9. `design/wizard-step5-no-package.html` — payment zone components

If any file does not exist, stop and report back before proceeding.

### Context

This task implements the full CSS for Wizard V2 and the final progress bar partial. No step PHP logic is implemented yet — the CSS must be complete so that Tasks 3–6 can implement step templates and see them styled correctly immediately.

### Implementation requirements

#### `public/assets/css/booking-wizard-v2.css` — MODIFY (replace stub)

All selectors must be scoped inside `.bookit-v2-wizard-container` except the `:root` token block.

**`:root` token block — new v2-only tokens (do not redeclare existing `--bookit-*` tokens):**
```css
:root {
  --bookit-v2-max-width:         680px;
  --bookit-v2-progress-height:   2.5px;
  --bookit-v2-avatar-size-grid:  44px;
  --bookit-v2-avatar-size-list:  36px;
  --bookit-v2-slot-radius:       10px;
  --bookit-v2-banner-bg:         #f7f6f4;
  --bookit-v2-zone-label-size:   10px;
  --bookit-v2-zone-label-spacing:0.08em;
  --bookit-v2-waiver-bg:         #fffbf0;
  --bookit-v2-waiver-border:     #e6a817;
  --bookit-v2-waiver-heading:    #92610a;
  --bookit-v2-waiver-text:       #5c3d06;
}
```

Note: waiver tokens are intentionally NOT `--bookit-*` — the waiver block is a legal signal and must not be overridden by theme stylesheets.

**Component styles to implement (referencing design HTML files for exact values):**

1. Wizard container: max-width `var(--bookit-v2-max-width)`, centred, mobile-first
2. Progress bar: flex row, label+underline pattern per `wizard-design-decisions.md`. Active step uses `--bookit-primary` underline and label colour. Completed step uses `--bookit-primary-light` underline and `--bookit-text-secondary` label. Inactive uses `--bookit-text-muted`. Underline implemented as `::after` pseudo-element, height `var(--bookit-v2-progress-height)`.
3. Confirmation banner: flex row, space-between, `--bookit-v2-banner-bg`, `--bookit-border`, `border-radius: var(--bookit-border-radius)`
4. Step heading: 22px, font-weight 600, `--bookit-text-primary`, letter-spacing -0.02em
5. Step subheading: 14px, `--bookit-text-secondary`
6. Service cards: grid layout using CSS `auto-fill, minmax(240px, 1fr)`. Selected state: `--bookit-primary` border (1.5px), `--bookit-primary-light` background tint. `.bookit-v2-services-grid--few` forces single column.
7. Category label: 11px, uppercase, letter-spacing 0.08em, `--bookit-text-muted`
8. Staff grid (4+ staff): `grid-template-columns: 1fr 1fr`. Last child odd: `grid-column: 1 / -1`
9. Staff list (1–3 staff): flex column, each row flex with avatar left, info centre, price right
10. Avatar circle: `border-radius: 50%`, size controlled by `--bookit-v2-avatar-size-grid` or `--bookit-v2-avatar-size-list`. Colour set via inline style in PHP.
11. Staff selected state: `--bookit-primary` border, `--bookit-primary-light` tint, staff name shifts to `--bookit-primary`
12. Unavailable staff: `opacity: 0.5`, cursor default, not selectable
13. "Any available" row: `--bookit-v2-banner-bg` background, always full width
14. Calendar: 7-column grid. Day cell `aspect-ratio: 1`, `border-radius: 50%`, `min-height: 36px`. States: available (dark text), selected (`--bookit-primary` filled circle, white text), disabled (0.35 opacity), other-month (0.4 opacity), today (4px dot below number using `::after`)
15. Time slot pills: `grid-template-columns: repeat(3, 1fr)`. Pill: `border-radius: var(--bookit-v2-slot-radius)`. States: available (light border, white bg), selected (`--bookit-primary` filled), unavailable (0.5 opacity, `--bookit-v2-banner-bg`)
16. Form inputs: full width, `border-radius: var(--bookit-border-radius)`, 1.5px border `--bookit-border`, 12px padding. Error state: `--bookit-color-error` border, light red background, error message below in `--bookit-color-error`
17. Special requests toggle: text link in `--bookit-primary`, no button chrome
18. Waiver block: `background: var(--bookit-v2-waiver-bg)`, `border-left: 3.5px solid var(--bookit-v2-waiver-border)`, `border-radius: var(--bookit-border-radius)`. Heading: `var(--bookit-v2-waiver-heading)`. Body: `var(--bookit-v2-waiver-text)`. Uses fixed token values — NOT `--bookit-primary`.
19. Payment rows: full-width flex rows, 1.5px border, `border-radius: var(--bookit-border-radius)`. Selected: `--bookit-primary` border, `--bookit-primary-light` tint. Disabled: `opacity: 0.4`, `pointer-events: none`
20. Logo pills: small rounded badges, hardcoded brand colours (VISA: `#1a1f71`, MC: `#eb001b`, PayPal: `#003087`), white text — these are brand colours, not theme tokens
21. Zone B package accent: `--bookit-primary-light` background for use-package variant; `#fafaf9` neutral for buy-package variant
22. Sticky footer: `position: fixed`, `bottom: 0`, full width, `background: rgba(255,255,255,0.96)`, `backdrop-filter: blur(8px)`, top border `--bookit-border`. Contains Continue button (`--bookit-btn-primary-bg`, `--bookit-btn-radius`) and Back text link (`--bookit-text-secondary`)
23. Responsive: `@media (max-width: 500px)` adjustments — reduced padding, `font-size: 10px` on step labels, 7rem bottom padding on body

#### `public/templates/partials/booking-wizard-v2-progress.php` — MODIFY (replace stub)

Full implementation:
- Five step items in a flex row
- Each item has a `<span class="bookit-v2-step-label">` with the step name
- PHP assigns correct class (`--active`, `--done`, `--inactive`) based on `$current_step`
- Uses `::after` pseudo-element (CSS) for the underline — no inline styles for the progress indicator
- Step names: Service / Staff / Date &amp; Time / Your Details / Payment

### PHPUnit requirements

Baseline: 767 tests (post Task 1), 0 failures — must not regress.

No new tests required for pure CSS. Confirm existing Task 1 tests still pass.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

### Acceptance criteria

#### Functional
- [ ] Progress bar renders with correct active/done/inactive classes for each step
- [ ] Wizard container constrained to 680px max-width, centred
- [ ] All CSS selectors scoped inside `.bookit-v2-wizard-container`
- [ ] Waiver block uses `--bookit-v2-waiver-*` tokens, not `--bookit-primary`
- [ ] Sticky footer visible at bottom of viewport on mobile (375px)

#### Technical
- [ ] No CSS leaks outside `.bookit-v2-wizard-container`
- [ ] No existing `--bookit-*` tokens redeclared in v2 `:root` block
- [ ] New `--bookit-v2-*` tokens all present in `:root` block
- [ ] PHPUnit suite passes (767+ tests, 0 failures)

#### Must NOT break
- [ ] Existing `booking-wizard.css` unchanged
- [ ] Existing wizard visual appearance unchanged

### Git commit message
```
Sprint Wizard-V2, Task 2: CSS implementation and progress bar partial

- Implement booking-wizard-v2.css with all component styles
- Add --bookit-v2-* token block for new components
- All selectors scoped inside .bookit-v2-wizard-container
- Waiver block uses fixed amber tokens, not --bookit-primary
- Replace progress bar partial stub with full implementation
- Active/done/inactive step classes assigned from $current_step

Tests: 767 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

## Task 3 of 6 — Steps 1 & 2 (~5h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-1-services.php` — existing Step 1 logic to replicate
2. `public/templates/booking-step-2-staff.php` — existing Step 2 logic to replicate
3. `public/templates/booking-wizard-v2-step-1.php` — stub to replace
4. `public/templates/booking-wizard-v2-step-2.php` — stub to replace
5. `public/assets/css/booking-wizard-v2.css` — v2 CSS classes to apply
6. `design/wizard-step1.html` — Step 1 HTML structure reference
7. `design/wizard-step2-list.html` — Step 2 list layout reference (1–3 staff)
8. `design/wizard-step2-grid.html` — Step 2 grid layout reference (4+ staff)
9. `design/wizard-design-decisions.md` — all Step 1 and Step 2 decisions

If any file does not exist, stop and report back before proceeding.

### Context

This task implements the full PHP for Steps 1 and 2. All business logic is replicated from the existing step templates — the only difference is the HTML structure and CSS classes, which follow the v2 design reference files. The existing step templates must not be modified.

### Implementation requirements

#### `public/templates/booking-wizard-v2-step-1.php` — MODIFY (replace stub)

Replicate all business logic from `booking-step-1-services.php`. Apply v2 HTML structure from `design/wizard-step1.html`. Specific v2 requirements:

- **Auto-skip rule:** If only 1 service exists, redirect to step 2 (`Bookit_Session_Manager::set( 'current_step', 2 )` + `wp_safe_redirect`) and show a confirmation banner on step 2 instead
- **Heading:** "What would you like to book?"
- **Subheading:** "Select a service to get started."
- **Card content:** Service name (bold) + duration only. No price.
- **Grid:** CSS class `bookit-v2-services-grid`. Add class `bookit-v2-services-grid--few` when service count ≤ 2 (forces single column via CSS)
- **Categories:** Group services by category. Render category label above each group using class `bookit-v2-category-label`
- **Selected state:** PHP applies `bookit-v2-service-card--selected` class to the currently selected card (from session)
- **Back link:** Rendered but `disabled` attribute set and class `bookit-v2-btn-back--disabled` applied on Step 1

#### `public/templates/booking-wizard-v2-step-2.php` — MODIFY (replace stub)

Replicate all business logic from `booking-step-2-staff.php`. Apply v2 HTML structure. Specific v2 requirements:

- **Confirmation banner:** Slim banner showing selected service + duration (e.g. "Swedish Massage · 60 min") with a "Change" link back to step 1
- **Heading:** "Who would you like?"
- **Subheading:** "Choose a team member for your appointment."
- **Layout switch:** Count available staff for this service. 1–3 staff → apply class `bookit-v2-staff-list` on the container. 4+ staff → apply class `bookit-v2-staff-grid`
- **Auto-skip — single staff:** If only 1 available staff member, set `staff_id` in session, advance to step 3 via redirect
- **Auto-skip — hidden staff mode:** Read setting `staff_selection_hidden` from `wp_bookings_settings`. If `'1'`, set `staff_id` to 0 (no preference), advance to step 3 via redirect
- **Avatar colour:** Generate deterministic colour from staff full name hash. Use this palette array in PHP: `['#1a7a6e','#7c5cbf','#c46b1a','#2a6db5','#b5481a','#1a6b7a']`. Hash: `abs( crc32( $full_name ) ) % count( $palette )`
- **Staff card content:** Avatar circle (initials + inline `style="background: [colour]"`) + name (bold) + job title + price + one-line bio with "Read more" toggle
- **Unavailable staff:** Shown with class `bookit-v2-staff-card--unavailable`. Not selectable. "No availability this month" replaces price.
- **"Any available team member":** Always last, always full width. Class `bookit-v2-any-available`. Copy: "We'll match you with the first available person for your chosen time."
- **Selected state:** PHP applies `bookit-v2-staff-card--selected` or `bookit-v2-staff-row--selected` based on layout

### PHPUnit requirements

Baseline: 767 tests (post Task 1), 0 failures — must not regress.

Write additional tests in `tests/unit/test-booking-wizard-v2.php`:

- `test_v2_step1_renders_service_cards`: step 1 output contains `.bookit-v2-service-card`
- `test_v2_step1_single_service_redirects_to_step2`: when 1 service exists, current_step advances to 2
- `test_v2_step1_few_services_uses_single_column`: when ≤ 2 services, output contains `bookit-v2-services-grid--few`
- `test_v2_step2_renders_list_layout_for_three_staff`: 3 staff → output contains `bookit-v2-staff-list`
- `test_v2_step2_renders_grid_layout_for_four_staff`: 4 staff → output contains `bookit-v2-staff-grid`
- `test_v2_step2_single_staff_redirects_to_step3`: 1 staff → current_step advances to 3
- `test_v2_step2_hidden_staff_mode_redirects_to_step3`: `staff_selection_hidden = '1'` → current_step advances to 3
- `test_v2_step2_avatar_colour_is_deterministic`: same staff name always produces same colour

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

### Acceptance criteria

#### Functional
- [ ] Step 1 renders service cards grouped by category with name + duration
- [ ] Step 1 uses single-column layout when ≤ 2 services
- [ ] Step 1 auto-skips to step 2 when only 1 service exists
- [ ] Step 2 confirmation banner shows selected service + duration + Change link
- [ ] Step 2 renders list layout for 1–3 staff, grid for 4+
- [ ] Step 2 auto-skips to step 3 for single staff or hidden-staff mode
- [ ] Avatar colour is deterministic per staff member name
- [ ] Unavailable staff shown greyed out, not selectable
- [ ] "Any available team member" always appears last, full width

#### Technical
- [ ] No PHP warnings or notices
- [ ] All session reads/writes use `Bookit_Session_Manager`
- [ ] All redirects use `wp_safe_redirect()`
- [ ] PHPUnit suite passes (775+ tests, 0 failures)

#### Must NOT break
- [ ] `booking-step-1-services.php` and `booking-step-2-staff.php` unchanged
- [ ] Existing wizard step 1 and step 2 still render correctly

### Git commit message
```
Sprint Wizard-V2, Task 3: Steps 1 and 2 implementation

- Replace step 1 stub: service cards, category grouping, auto-skip,
  1/2-column grid based on service count
- Replace step 2 stub: staff list/grid layout switch, avatar colour
  hash, unavailable state, any-available row, auto-skip rules
- 8 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 775 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

## Task 4 of 6 — Step 3 (~4h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-3-datetime.php` — existing Step 3 logic to replicate
2. `public/templates/booking-wizard-v2-step-3.php` — stub to replace
3. `public/assets/css/booking-wizard-v2.css` — calendar and slot CSS classes to apply
4. `design/wizard-step3.html` — Step 3 HTML structure reference
5. `design/wizard-design-decisions.md` — all Step 3 decisions

If any file does not exist, stop and report back before proceeding.

### Context

Implements Step 3: date selection via month calendar and time slot grid. All availability logic is replicated from the existing step template. The calendar and slot grid follow the v2 design reference.

### Implementation requirements

#### `public/templates/booking-wizard-v2-step-3.php` — MODIFY (replace stub)

Replicate all availability logic from `booking-step-3-datetime.php`. Apply v2 HTML structure from `design/wizard-step3.html`. Specific v2 requirements:

- **Confirmation banner:** Shows service + duration + staff name (e.g. "Swedish Massage · 60 min · Elena Torres") with a "Change" link back to step 2
- **Heading:** "When would you like to come in?"
- **Subheading:** "Choose a date and time for your appointment."
- **Calendar:** Month grid. Prev/next arrows (left/right). Month + year centred. 7-column day grid (Mon–Sun headers in small uppercase). Day states assigned as PHP classes: `bookit-v2-day--available`, `bookit-v2-day--selected`, `bookit-v2-day--disabled`, `bookit-v2-day--other-month`, `bookit-v2-day--today`
- **Time slot grouping:** Group slots into Morning (before 12:00), Afternoon (12:00–17:59), Evening (18:00+). Each group rendered with class `bookit-v2-time-section`. Label in class `bookit-v2-time-section-label`. Slots in class `bookit-v2-slots-grid`
- **Empty groups:** Hidden entirely — do not render the group element if no slots exist for that period
- **Slot states:** `bookit-v2-slot--available`, `bookit-v2-slot--selected`, `bookit-v2-slot--unavailable`
- **Scroll behaviour:** Calendar and slots are both always visible on the same scroll — no collapse
- **Continue button:** Disabled until both a date and a time slot are selected (managed via JS in Task 6; PHP renders it disabled by default if no slot in session)

### PHPUnit requirements

Baseline: 775 tests (post Task 3), 0 failures — must not regress.

Write additional tests in `tests/unit/test-booking-wizard-v2.php`:

- `test_v2_step3_renders_calendar`: step 3 output contains `.bookit-v2-day--available`
- `test_v2_step3_morning_group_hidden_when_empty`: no morning slots → morning section element absent from output
- `test_v2_step3_afternoon_group_hidden_when_empty`: no afternoon slots → afternoon section element absent from output
- `test_v2_step3_slots_grouped_correctly`: slot at 11:00 renders in morning group, slot at 14:00 renders in afternoon group

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

### Acceptance criteria

#### Functional
- [ ] Confirmation banner shows service + duration + staff + Change link
- [ ] Calendar renders current month with correct day states
- [ ] Empty time groups not rendered
- [ ] Slots correctly grouped Morning/Afternoon/Evening
- [ ] Continue button disabled when no slot selected

#### Technical
- [ ] No PHP warnings or notices
- [ ] All session reads use `Bookit_Session_Manager`
- [ ] PHPUnit suite passes (779+ tests, 0 failures)

#### Must NOT break
- [ ] `booking-step-3-datetime.php` unchanged
- [ ] Existing wizard step 3 still renders correctly

### Git commit message
```
Sprint Wizard-V2, Task 4: Step 3 date and time selection

- Replace step 3 stub: month calendar with day states, time slot
  grid grouped Morning/Afternoon/Evening, empty groups hidden
- Confirmation banner shows service + duration + staff name
- 4 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 779 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

## Task 5 of 6 — Step 4 (~3h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-4-contact.php` — existing Step 4 logic to replicate
2. `public/assets/js/contact-form.js` — existing validation and waiver logic
3. `public/templates/booking-wizard-v2-step-4.php` — stub to replace
4. `public/assets/css/booking-wizard-v2.css` — form and waiver CSS classes to apply
5. `design/wizard-step4.html` — Step 4 HTML structure reference
6. `design/wizard-design-decisions.md` — all Step 4 decisions including waiver rules

If any file does not exist, stop and report back before proceeding.

### Context

Implements Step 4: the contact details form. All validation logic and waiver conditional display are replicated from the existing step template and contact-form.js. The waiver block uses fixed amber CSS tokens and must not be styled with `--bookit-primary`.

### Implementation requirements

#### `public/templates/booking-wizard-v2-step-4.php` — MODIFY (replace stub)

Replicate all logic from `booking-step-4-contact.php`. Apply v2 HTML structure from `design/wizard-step4.html`. Specific v2 requirements:

- **Confirmation banner:** Shows all four previous selections (service · duration · staff · date + time) with a "Change" link. Use `flex-start` alignment so Change link anchors to top when text wraps.
- **Heading:** "Your details"
- **Subheading:** "Almost there — just a few details to confirm your booking."
- **Field order:** First name → Last name → Email → Phone → Special requests (collapsed) → Marketing consent → Cooling-off waiver
- **Autocomplete attributes:** `given-name` / `family-name` / `email` / `tel`
- **Input modes:** `inputmode="email"` on email, `inputmode="tel"` on phone
- **Phone placeholder:** `07700 900000`
- **Special requests:** Collapsed by default. Rendered as a `<button type="button" class="bookit-v2-special-requests-toggle">+ Add special requests</button>` followed by a hidden `<textarea>`. Toggle behaviour handled in Task 6 JS.
- **Marketing consent:** Optional checkbox, unchecked by default. Label: "Keep me updated with offers and news." Helper text: "You can unsubscribe at any time."
- **Cooling-off waiver:** Replicate `bookit_booking_requires_waiver( $booking_date )` conditional from existing template. When shown: `<div class="bookit-v2-waiver-block">` — does NOT use `--bookit-primary`, uses `--bookit-v2-waiver-*` tokens. Heading: "Important: Right to Cancel". Body: plain-English explanation (same text as existing template). Required checkbox. `aria-required="true"`.
- **CSRF nonce:** Include `Bookit_CSRF_Protection::nonce_field()` as per existing template
- **Form action:** POST to same REST endpoint as existing template (`bookit/v1/contact/save`)

### PHPUnit requirements

Baseline: 779 tests (post Task 4), 0 failures — must not regress.

Write additional tests in `tests/unit/test-booking-wizard-v2.php`:

- `test_v2_step4_renders_contact_form`: step 4 output contains form with `first-name` field
- `test_v2_step4_waiver_shown_when_booking_within_14_days`: booking date within 14 days → waiver block present in output
- `test_v2_step4_waiver_hidden_when_booking_beyond_14_days`: booking date > 14 days away → waiver block absent from output
- `test_v2_step4_special_requests_toggle_collapsed_by_default`: textarea for special requests not visible in initial output

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

### Acceptance criteria

#### Functional
- [ ] Confirmation banner shows all four previous selections
- [ ] All fields render in correct order with correct autocomplete attributes
- [ ] Special requests toggle is collapsed by default
- [ ] Marketing consent checkbox unchecked by default
- [ ] Waiver block rendered when booking within 14 days, absent when beyond
- [ ] Waiver block uses `bookit-v2-waiver-block` class and `--bookit-v2-waiver-*` tokens
- [ ] CSRF nonce present in form

#### Technical
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (783+ tests, 0 failures)

#### Must NOT break
- [ ] `booking-step-4-contact.php` unchanged
- [ ] `contact-form.js` unchanged
- [ ] Existing wizard step 4 still renders and submits correctly

### Git commit message
```
Sprint Wizard-V2, Task 5: Step 4 contact details form

- Replace step 4 stub: full contact form with correct field order,
  autocomplete, inputmode, and CSRF nonce
- Special requests toggle collapsed by default
- Cooling-off waiver conditional on booking date, amber tokens only
- Confirmation banner shows all four previous selections
- 4 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 783 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

## Task 6 of 6 — Step 5 & JavaScript (~5h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/templates/booking-step-5-payment.php` — existing Step 5 logic to replicate
2. `public/templates/booking-wizard-v2-step-5.php` — stub to replace
3. `public/assets/js/booking-wizard.js` — existing JS patterns for step navigation and session AJAX
4. `public/assets/js/booking-wizard-v2.js` — stub to replace
5. `design/wizard-step5-with-package.html` — use-package variant reference
6. `design/wizard-step5-buy-package.html` — buy-package variant reference
7. `design/wizard-step5-no-package.html` — no-package variant reference
8. `design/wizard-design-decisions.md` — Step 5 zone logic and full CTA label matrix

If any file does not exist, stop and report back before proceeding.

### Context

Implements Step 5 (payment) and the full v2 JavaScript. Step 5 has three PHP variants based on package state. The JS handles step navigation, Zone B/C mutual exclusivity, dynamic CTA label, and the special requests toggle from Step 4.

### Implementation requirements

#### `public/templates/booking-wizard-v2-step-5.php` — MODIFY (replace stub)

Replicate all business logic from `booking-step-5-payment.php`. Apply v2 HTML structure from the three design reference files. Specific v2 requirements:

- **Confirmation banner:** All four previous selections + Change link (same as Step 4)
- **Zone A — Booking summary:**
  - Zone label: "Review your booking" — class `bookit-v2-zone-label`
  - Key-value rows: Service / Duration / With / Date / Time
  - Deposit split: if `$has_deposit`, render three rows (Today deposit / Remaining / Total bolder). If no deposit, render single "Total due today" row.
  - Cancellation policy: `<details class="bookit-v2-policy-disclosure">` with `<summary>` containing label + chevron. Closed by default.
- **Zone B — Package (conditional, never both variants together):**
  - Determine variant using same logic as existing template:
    1. Customer has active applicable package → render use-package variant (`bookit-v2-zone-b--use-package`, `--bookit-primary-light` background)
    2. No active package + `packages_enabled = '1'` + purchasable packages exist for this service → render buy-package variant (`bookit-v2-zone-b--buy-package`, `#fafaf9` background)
    3. Neither → render no Zone B
  - Use-package variant: package radio row showing name + sessions remaining + expiry
  - Buy-package variant: radio cards showing bundle name + saving in `--bookit-primary` + price right-aligned. Sub-note: "Your appointment will be confirmed after the package purchase."
- **Zone C — Payment methods:**
  - Zone label: "How would you like to pay?" — changes to "Or pay for this session only" when buy-package Zone B is shown
  - Three full-width radio rows: Pay by card (pre-selected) / PayPal / Pay in person
  - Card logos: VISA + MC pill badges. PayPal logo badge. Pay in person: no logo, sub-label "No payment needed now"
  - Class `bookit-v2-payment-row--disabled` applied via JS when package selected
- **Sticky footer CTA:** Default text from `bookitWizardV2.depositAmount > 0 ? 'Pay £X now' : 'Pay £X now'` — actual dynamic text managed by JS

#### `public/assets/js/booking-wizard-v2.js` — MODIFY (replace stub)

Replicate step navigation and session AJAX patterns from `booking-wizard.js`. Implement all v2-specific behaviour:

**Step navigation:**
- On Continue button click: POST to `bookitWizardV2.ajaxUrl` to advance step, reload page to render next step (same pattern as existing wizard)
- On Back button click: navigate to `?step=N-1`

**Step 3 — date → slot scroll:**
- When a `.bookit-v2-day--available` is clicked, smooth-scroll to `.bookit-v2-time-section` using `element.scrollIntoView({ behavior: 'smooth' })`

**Step 4 — special requests toggle:**
- Click on `.bookit-v2-special-requests-toggle` → hide the button, show the `<textarea>` sibling

**Step 5 — Zone B/C mutual exclusivity:**
- When any package radio selected (use or buy):
  - Add `bookit-v2-payment-row--disabled` to all `.bookit-v2-payment-row` elements
  - Uncheck all Zone C radios
  - Call `updateCtaLabel( selectedValue )`
- When any Zone C payment row clicked:
  - Remove `bookit-v2-payment-row--disabled` from all `.bookit-v2-payment-row` elements
  - Uncheck all package radios
  - Remove selected class from all package rows
  - Call `updateCtaLabel( selectedValue )`

**`updateCtaLabel( selection )`:**
Implement per this exact matrix (values from `bookitWizardV2` localised object):
```
'card'         → depositAmount > 0 ? 'Pay £[depositAmount] now' : 'Pay £[totalAmount] now'
'paypal'       → 'Continue to PayPal'
'person'       → 'Confirm booking'
'use_package'  → 'Use my package'
'buy_5'        → 'Buy package & confirm'   (or any buy_* value)
'buy_10'       → 'Buy package & confirm'
```
Update the text content of `.bookit-v2-cta-btn`.

**Initial state:**
On `DOMContentLoaded`, call `updateCtaLabel('card')` to set the default CTA label.

### PHPUnit requirements

Baseline: 783 tests (post Task 5), 0 failures — must not regress.

Write additional tests in `tests/unit/test-booking-wizard-v2.php`:

- `test_v2_step5_renders_zone_a_summary`: step 5 output contains `.bookit-v2-zone-label`
- `test_v2_step5_renders_deposit_split_when_deposit_exists`: deposit scenario → output contains "Today (deposit)"
- `test_v2_step5_renders_single_total_when_no_deposit`: no deposit → "Total due today" present, "deposit" absent
- `test_v2_step5_renders_use_package_zone_when_active_package`: active package → output contains `bookit-v2-zone-b--use-package`
- `test_v2_step5_renders_buy_package_zone_when_no_active_package`: no active package + packages enabled → output contains `bookit-v2-zone-b--buy-package`
- `test_v2_step5_renders_no_zone_b_when_packages_disabled`: packages disabled → neither zone-b class present
- `test_v2_step5_cancellation_policy_collapsed_by_default`: output contains `<details` without `open` attribute
- `test_v2_existing_wizard_all_tests_still_pass`: run full existing test suite; verify no regressions

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

### Acceptance criteria

#### Functional
- [ ] Zone A renders booking summary with correct deposit split or single total
- [ ] Cancellation policy collapsed by default, expands on tap
- [ ] Correct Zone B variant rendered based on package state
- [ ] Zone B and Zone C are mutually exclusive — selecting one deactivates the other
- [ ] Zone C Pay by card pre-selected on load
- [ ] CTA button text updates correctly for all six selection states
- [ ] Step 4 special requests toggle works
- [ ] Step 3 date tap scrolls to time slots

#### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] JS uses `bookitWizardV2` localised object for amounts and URLs
- [ ] PHPUnit suite passes (791+ tests, 0 failures)

#### Must NOT break
- [ ] `booking-step-5-payment.php` unchanged
- [ ] `booking-wizard.js` unchanged
- [ ] All 761 original tests still pass
- [ ] Both `[bookit_booking_wizard]` and `[bookit_wizard_v2]` work correctly on the same page

### Git commit message
```
Sprint Wizard-V2, Task 6: Step 5 payment and full JS implementation

- Replace step 5 stub: three zone variants based on package state,
  deposit split, collapsible cancellation policy, payment rows
- Replace JS stub: step navigation, Zone B/C mutual exclusivity,
  dynamic CTA label matrix, special requests toggle, date scroll
- 8 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 791 passing, 0 failures
```

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

Come back here when each task is done and I'll review the output, provide the manual test plan, and give you the next task prompt. If Cursor gets stuck on anything, paste the error or question here and we'll resolve it before continuing.