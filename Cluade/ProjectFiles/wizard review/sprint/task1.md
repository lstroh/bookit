Good — I have the exact current state of `enqueue_wizard_assets()` confirmed. Here is the complete, copy-paste-ready Task 1 prompt:

---

```
TASK 1 OF 6: Registration & asset scaffolding
Sprint: Wizard-V2 | Est: ~3h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/class-shortcodes.php` — read the full file; pay particular attention to: (a) `__construct()` shortcode registration order, (b) `render_booking_wizard()` full method body — replicate this pattern exactly for `render_booking_wizard_v2()`, (c) `enqueue_wizard_assets()` full method body — the exact early-return guard condition and all existing enqueueing blocks must be preserved verbatim
2. `includes/class-bookit-template-loader.php` — read the `get_template()` and `locate_template()` signatures; all template includes must use this API
3. `includes/class-bookit-loader.php` — confirm where `Bookit_Shortcodes` is instantiated; no changes needed here but verify before proceeding
4. `public/templates/booking-wizard-shell.php` — existing shell pattern to follow exactly for the v2 shell stub
5. `tests/unit/test-booking-shortcode.php` — read the existing enqueue test patterns (how `$post` is set up, how `do_action( 'wp_enqueue_scripts' )` is triggered, how `wp_styles()`/`wp_scripts()` are queried); all new tests must follow this exact pattern

If any file does not exist, stop and report back before proceeding.

---

## Context

This task creates the complete scaffolding for Wizard V2: shortcode registration, asset detection and enqueueing, stub templates, and stub assets. No step content or styling is implemented yet. The goal is `[bookit_wizard_v2]` rendering an empty container on a WordPress page with the correct CSS and JS enqueued, while the existing wizard continues to work exactly as before. All new code is purely additive — no existing method, template, or asset file is modified in any way except `enqueue_wizard_assets()`.

---

## Implementation requirements

### `public/class-shortcodes.php` — MODIFY

**In `__construct()`:**
- Add `add_shortcode( 'bookit_wizard_v2', array( $this, 'render_booking_wizard_v2' ) );` immediately after the existing `bookit_booking_wizard` registration line. Do not reorder any existing lines.

**Add new method `render_booking_wizard_v2()`:**
- Place it immediately after `render_booking_wizard()` closes
- Follow `render_booking_wizard()` pattern exactly: `require_once` for session manager, `Bookit_Session_Manager::init()`, `is_expired()` check + `clear()`, get `$current_step` from session (default 1), `?step=` backward navigation block (same guard: `$requested_step >= 1 && $requested_step <= $current_step`), validate step range 1–5, `ob_start()`, `Bookit_Template_Loader::get_template( 'booking-wizard-v2-shell.php' )`, `return ob_get_clean()`
- PHPDoc block: `@param array $atts`, `@param string $content`, `@return string`

**In `enqueue_wizard_assets()`:**
- Add `$has_wizard_v2 = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'bookit_wizard_v2' );` immediately after the existing `$has_my_packages` detection line — same pattern, same format
- Update the early-return guard from:
  ```php
  if ( ! $has_wizard && ! $has_confirmation && ! $has_my_packages ) {
      return;
  }
  ```
  to:
  ```php
  if ( ! $has_wizard && ! $has_wizard_v2 && ! $has_confirmation && ! $has_my_packages ) {
      return;
  }
  ```
  This is the only change to the guard — do not alter it further
- After the existing `$has_my_packages` block at the end of the method, add a new conditional block:
  ```php
  if ( $has_wizard_v2 ) {
      wp_enqueue_style(
          'bookit-wizard-v2',
          BOOKIT_PLUGIN_URL . 'public/assets/css/booking-wizard-v2.css',
          array(),
          BOOKIT_VERSION,
          'all'
      );
      wp_enqueue_script(
          'bookit-wizard-v2',
          BOOKIT_PLUGIN_URL . 'public/assets/js/booking-wizard-v2.js',
          array( 'jquery' ),
          BOOKIT_VERSION,
          true
      );
      wp_localize_script(
          'bookit-wizard-v2',
          'bookitWizardV2',
          array(
              'restUrl'       => rest_url(),
              'ajaxUrl'       => rest_url( 'bookit/v1/wizard/session' ),
              'nonce'         => wp_create_nonce( 'wp_rest' ),
              'bookingNonce'  => Bookit_CSRF_Protection::get_nonce(),
              'currentStep'   => $current_step,
              'depositAmount' => (float) Bookit_Session_Manager::get( 'deposit_due', 0.00 ),
              'totalAmount'   => (float) Bookit_Session_Manager::get( 'total_price', 0.00 ),
          )
      );
  }
  ```
  Note: `$current_step` is already computed earlier in the method for the existing `bookitWizard` localization — reuse that variable; do not recompute it
- Do not modify any existing enqueueing block, localization call, or conditional

---

### `public/templates/page-wizard-v2.php` — CREATE

WordPress page template file:

```php
<?php
/**
 * Template Name: Bookit Wizard V2
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/public/templates
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

get_header();
echo do_shortcode( '[bookit_wizard_v2]' );
get_footer();
```

---

### `public/templates/booking-wizard-v2-shell.php` — CREATE

Follow the same structure as `booking-wizard-shell.php`. Stub only — no step logic yet:

```php
<?php
/**
 * Booking Wizard V2 shell template.
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/public/templates
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

$current_step = (int) Bookit_Session_Manager::get( 'current_step', 1 );
?>
<div class="bookit-v2-wizard-container" data-step="<?php echo esc_attr( $current_step ); ?>">

    <?php Bookit_Template_Loader::get_template( 'partials/booking-wizard-v2-progress.php', array( 'current_step' => $current_step ) ); ?>

    <?php if ( 1 === $current_step ) : ?>
        <?php Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-1.php' ); ?>
    <?php elseif ( 2 === $current_step ) : ?>
        <?php Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-2.php' ); ?>
    <?php elseif ( 3 === $current_step ) : ?>
        <?php Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-3.php' ); ?>
    <?php elseif ( 4 === $current_step ) : ?>
        <?php Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-4.php' ); ?>
    <?php elseif ( 5 === $current_step ) : ?>
        <?php Bookit_Template_Loader::get_template( 'booking-wizard-v2-step-5.php' ); ?>
    <?php endif; ?>

</div>
```

---

### `public/templates/partials/booking-wizard-v2-progress.php` — CREATE

Stub only. The `partials/` subdirectory must be created if it does not already exist under `public/templates/`:

```php
<?php
/**
 * Booking Wizard V2 progress bar partial.
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/public/templates
 *
 * @var int $current_step Current wizard step (1–5).
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

$step_labels = array(
    1 => __( 'Service',      'bookit-booking-system' ),
    2 => __( 'Staff',        'bookit-booking-system' ),
    3 => __( 'Date & Time',  'bookit-booking-system' ),
    4 => __( 'Your Details', 'bookit-booking-system' ),
    5 => __( 'Payment',      'bookit-booking-system' ),
);
?>
<nav class="bookit-v2-progress" aria-label="<?php esc_attr_e( 'Booking progress', 'bookit-booking-system' ); ?>">
    <?php for ( $i = 1; $i <= 5; $i++ ) : ?>
        <?php
        if ( $i < $current_step ) {
            $item_class = 'bookit-v2-step-item bookit-v2-step-item--done';
        } elseif ( $i === $current_step ) {
            $item_class = 'bookit-v2-step-item bookit-v2-step-item--active';
        } else {
            $item_class = 'bookit-v2-step-item bookit-v2-step-item--inactive';
        }
        ?>
        <span class="<?php echo esc_attr( $item_class ); ?>">
            <span class="bookit-v2-step-label"><?php echo esc_html( $step_labels[ $i ] ); ?></span>
        </span>
    <?php endfor; ?>
</nav>
```

---

### `public/templates/booking-wizard-v2-step-1.php` through `booking-wizard-v2-step-5.php` — CREATE (5 files)

Each file is a stub only. Replace `N` with the step number in each file:

```php
<?php
/**
 * Booking Wizard V2 — Step N placeholder.
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/public/templates
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}
?>
<div class="bookit-v2-step bookit-v2-step--N">Step N placeholder</div>
```

Create all five files: `booking-wizard-v2-step-1.php`, `booking-wizard-v2-step-2.php`, `booking-wizard-v2-step-3.php`, `booking-wizard-v2-step-4.php`, `booking-wizard-v2-step-5.php`.

---

### `public/assets/css/booking-wizard-v2.css` — CREATE (stub)

```css
/*
 * Bookit Wizard V2 Stylesheet
 * Styles implemented in Task 2.
 * All selectors scoped inside .bookit-v2-wizard-container
 */
```

---

### `public/assets/js/booking-wizard-v2.js` — CREATE (stub)

```js
/* Bookit Wizard V2 — JS implemented in Task 6 */
( function() {
    'use strict';
    document.addEventListener( 'DOMContentLoaded', function() {
        if ( ! document.querySelector( '.bookit-v2-wizard-container' ) ) return;
    } );
} )();
```

---

## PHPUnit requirements

Baseline: 761 tests, 0 failures — must not regress.

Write all new tests in: `tests/unit/test-booking-wizard-v2.php`

Create the file as a new `WP_UnitTestCase` class named `Test_Booking_Wizard_V2`. Follow the exact setUp/tearDown pattern from `tests/unit/test-booking-shortcode.php` including `Bookit_Session_Manager::clear()` in tearDown.

Required test cases:

- `test_v2_shortcode_is_registered`: `shortcode_exists( 'bookit_wizard_v2' )` returns true
- `test_v2_shortcode_renders_wizard_container`: `do_shortcode( '[bookit_wizard_v2]' )` output contains `bookit-v2-wizard-container`
- `test_v2_shortcode_does_not_break_existing_wizard`: `do_shortcode( '[bookit_booking_wizard]' )` output still contains `bookit-wizard-container`
- `test_v2_css_enqueued_on_page_with_v2_shortcode`: create a post with `[bookit_wizard_v2]` as content, set as `global $post`, fire `do_action( 'wp_enqueue_scripts' )`, assert `in_array( 'bookit-wizard-v2', wp_styles()->queue, true )`
- `test_v2_css_not_enqueued_on_page_without_v2_shortcode`: page with unrelated content → `bookit-wizard-v2` not in `wp_styles()->queue`
- `test_v2_css_not_enqueued_on_page_with_only_v1_shortcode`: page with only `[bookit_booking_wizard]` → `bookit-wizard-v2` not in `wp_styles()->queue`
- `test_v2_and_v1_can_coexist_on_same_page`: page content contains both `[bookit_booking_wizard]` and `[bookit_wizard_v2]` → both `bookit-wizard` and `bookit-wizard-v2` in `wp_styles()->queue`

Each enqueue test must call `wp_dequeue_style( 'bookit-wizard-v2' )` and `wp_deregister_style( 'bookit-wizard-v2' )` in setUp (or at the start of each test) to prevent queue state from leaking between tests — follow the same isolation pattern as the existing enqueue tests in `test-booking-shortcode.php`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 768 tests must pass (761 baseline + 7 new) before marking task complete.

---

## Acceptance criteria

### Functional
- [ ] `[bookit_wizard_v2]` shortcode renders on a WordPress page without errors
- [ ] Rendered output contains `.bookit-v2-wizard-container`
- [ ] Progress bar partial renders with five step items
- [ ] Step 1 placeholder text visible when step 1 is active
- [ ] `?step=N` backward navigation works correctly (same as v1 wizard)
- [ ] Page template "Bookit Wizard V2" appears in WordPress page template dropdown
- [ ] `booking-wizard-v2.css` is enqueued on pages with `[bookit_wizard_v2]`
- [ ] `booking-wizard-v2.css` is NOT enqueued on pages with only `[bookit_booking_wizard]`
- [ ] `booking-wizard-v2.css` is NOT enqueued on pages with no wizard shortcode

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors on page load
- [ ] `render_booking_wizard_v2()` follows `render_booking_wizard()` pattern exactly
- [ ] All template includes use `Bookit_Template_Loader::get_template()`
- [ ] `bookitWizardV2` JS object localised with all six keys: `restUrl`, `ajaxUrl`, `nonce`, `bookingNonce`, `currentStep`, `depositAmount`, `totalAmount`
- [ ] PHPUnit suite passes (768 tests, 0 failures)

### Must NOT break
- [ ] `[bookit_booking_wizard]` shortcode still renders with `bookit-wizard-container`
- [ ] All existing shortcode PHPUnit tests still pass
- [ ] `bookit-wizard` CSS and JS still enqueue correctly on v1 pages
- [ ] `bookit-wizard` CSS and JS are NOT affected on a page that has ONLY `[bookit_wizard_v2]`

---

## Git commit message

```
Sprint Wizard-V2, Task 1: Scaffolding — shortcode, page template, shell, stubs

- Register [bookit_wizard_v2] shortcode in Bookit_Shortcodes::__construct()
- Add render_booking_wizard_v2() following render_booking_wizard() pattern exactly
- Add $has_wizard_v2 detection to enqueue_wizard_assets()
- Update early-return guard to include $has_wizard_v2
- Enqueue bookit-wizard-v2 CSS and JS when [bookit_wizard_v2] present
- Localise bookitWizardV2 object with depositAmount and totalAmount
- Create public/templates/page-wizard-v2.php WordPress page template
- Create public/templates/booking-wizard-v2-shell.php stub
- Create public/templates/partials/booking-wizard-v2-progress.php stub
- Create public/templates/booking-wizard-v2-step-1.php through step-5.php stubs
- Create public/assets/css/booking-wizard-v2.css stub
- Create public/assets/js/booking-wizard-v2.js stub
- Add 7 PHPUnit tests in tests/unit/test-booking-wizard-v2.php

Tests: 768 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.