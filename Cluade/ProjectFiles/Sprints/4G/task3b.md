TASK 3B+3C+3D OF 3: Template Loader Class, Template Migration, Documentation
Sprint: 4G | Est: ~7h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/class-shortcodes.php` — full file; every include/require call that
   loads a template file; these are the calls to migrate in Task 3c.

2. `public/templates/booking-wizard-shell.php` — full file; this template also
   loads step templates via direct include — it must also be migrated.

3. `includes/class-bookit-loader.php` — read load_dependencies() in full;
   this is where the new template loader class must be required.

4. `public/assets/css/booking-wizard.css` — read only the :root block at the
   top; the documentation comment in Task 3d must list the actual variable
   names that exist in the file.

If any file does not exist or differs from expectations, stop and report
back before proceeding.

---

## CONTEXT

This task delivers the WooCommerce-style template override system. Client
themes can place override templates in `{theme}/bookit/` to replace any
plugin template without modifying plugin files. It is split into three
sub-tasks that must be implemented in order: loader class (3b), migrate
existing template loading to use the loader (3c), developer documentation
block (3d).

---

## TASK 3B: Template Loader Class

### includes/class-bookit-template-loader.php — CREATE

New file. Implement the following class exactly as specified. Read
`includes/class-bookit-loader.php` first to confirm the correct docblock
format used in this project.

```php
<?php
/**
 * Template loader with theme override support.
 *
 * Themes can override any Bookit template by placing a file at:
 *   {theme}/bookit/{template-name}.php
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/includes
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

class Bookit_Template_Loader {

    /**
     * Load a template, checking theme overrides first.
     *
     * Checks in order:
     *   1. {active-theme}/bookit/{template-name}.php
     *   2. {parent-theme}/bookit/{template-name}.php (child theme support)
     *   3. {plugin}/public/templates/{template-name}.php (fallback)
     *
     * @param string $template_name Filename e.g. 'booking-step-1-services.php'
     * @param array  $args          Variables to extract into template scope.
     * @param bool   $return        If true, return HTML string; if false, echo.
     * @return string|void
     */
    public static function get_template( $template_name, $args = array(), $return = false );

    /**
     * Locate the template file, returning the override path if it exists,
     * otherwise the plugin default path.
     *
     * @param string $template_name Filename e.g. 'booking-confirmed.php'
     * @return string Absolute path to the template file.
     */
    public static function locate_template( $template_name );

    /**
     * Return the absolute path to the plugin's default templates directory.
     * Includes trailing slash.
     *
     * @return string
     */
    public static function plugin_template_path();

    /**
     * Return the theme override subdirectory name.
     * Themes place overrides in {theme}/bookit/
     *
     * @return string 'bookit'
     */
    public static function theme_template_directory();
}
```

**Implementation rules:**

`locate_template()`:
- Build the theme override path: `get_stylesheet_directory() . '/' . self::theme_template_directory() . '/' . $template_name`
- If that file exists, return it (child theme / active theme)
- Else build parent theme path: `get_template_directory() . '/' . self::theme_template_directory() . '/' . $template_name`
- If that file exists, return it (parent theme when using child theme)
- Otherwise return: `self::plugin_template_path() . $template_name`

`get_template()`:
- Call `self::locate_template( $template_name )` to get the path
- If the file does not exist, return empty string (or void) silently — do
  not trigger a fatal error
- If `$args` is a non-empty array, call `extract( $args, EXTR_SKIP )` to
  make variables available in template scope
- If `$return` is true: `ob_start()`, `include $path`, return `ob_get_clean()`
- If `$return` is false: `include $path`

`plugin_template_path()`:
- Return `BOOKIT_PLUGIN_DIR . 'public/templates/'`

`theme_template_directory()`:
- Return `'bookit'`

---

## TASK 3C: Migrate Existing Template Loading

All existing direct `include` / `require` calls that load public templates
must be replaced with `Bookit_Template_Loader::get_template()`.

### public/class-shortcodes.php — MODIFY

Read the full file via GitHub before making any change.

Replace each template include in the shortcode methods as follows:

**`render_booking_wizard()`** — loads `booking-wizard-shell.php`:
```php
// BEFORE:
$template_path = BOOKIT_PLUGIN_DIR . 'public/templates/booking-wizard-shell.php';
if ( file_exists( $template_path ) ) {
    include $template_path;
} else {
    echo '<p>' . esc_html__( 'Booking wizard template not found.', 'bookit-booking-system' ) . '</p>';
}

// AFTER:
Bookit_Template_Loader::get_template( 'booking-wizard-shell.php' );
```

**`bookit_confirmation_page_shortcode()`** — loads `booking-confirmed.php`:
```php
// BEFORE:
include BOOKIT_PLUGIN_DIR . 'public/templates/booking-confirmed.php';

// AFTER:
Bookit_Template_Loader::get_template( 'booking-confirmed.php' );
```

**`render_booking_confirmation()`** — loads `booking-confirmed.php`:
```php
// BEFORE:
$template_path = BOOKIT_PLUGIN_DIR . 'public/templates/booking-confirmed.php';
if ( file_exists( $template_path ) ) {
    include $template_path;
} else {
    echo '<p>' . esc_html__( 'Confirmation template not found.', 'bookit-booking-system' ) . '</p>';
}

// AFTER:
Bookit_Template_Loader::get_template( 'booking-confirmed.php' );
```

**`render_my_packages()`** — loads `my-packages.php`:
```php
// BEFORE:
$template_path = BOOKIT_PLUGIN_DIR . 'public/templates/my-packages.php';
if ( file_exists( $template_path ) ) {
    include $template_path;
} else {
    echo '<p>' . esc_html__( 'My Packages template not found.', 'bookit-booking-system' ) . '</p>';
}

// AFTER:
Bookit_Template_Loader::get_template( 'my-packages.php' );
```

### public/templates/booking-wizard-shell.php — MODIFY

Read the full file via GitHub before making any change.

The shell template loads individual step templates via a direct include.
Replace that block with the loader:

```php
// BEFORE:
$step_template = BOOKIT_PLUGIN_DIR . 'public/templates/booking-step-' . $current_step . '-' . $step_slug . '.php';
if ( file_exists( $step_template ) ) {
    include $step_template;
} else {
    echo '<div class="bookit-step bookit-step-' . esc_attr( $current_step ) . '">';
    // ... fallback output
    echo '</div>';
}

// AFTER:
$step_template_name = 'booking-step-' . $current_step . '-' . $step_slug . '.php';
Bookit_Template_Loader::get_template( $step_template_name );
```

### includes/class-bookit-loader.php — MODIFY

Read `load_dependencies()` via GitHub before making any change.

Add the require for the new template loader class. Place it in the
"Public-facing functionality" section, before the shortcode handler require:

```php
// Template loader (theme override support).
require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-template-loader.php';
```

---

## TASK 3D: Developer Documentation Block

### includes/class-bookit-template-loader.php — MODIFY

Add the following documentation block as a block comment immediately after
the `<?php` opening tag and before the `if ( ! defined( 'WPINC' ) )` guard.
This is the client/developer-facing reference for the override system:

```php
/**
 * HOW TO OVERRIDE BOOKIT TEMPLATES IN YOUR THEME
 * ================================================
 * Copy any template from:
 *   wp-content/plugins/bookit-booking-system/public/templates/
 *
 * To your theme at:
 *   wp-content/themes/{your-theme}/bookit/
 *
 * Example:
 *   Plugin default: .../bookit-booking-system/public/templates/
 *                   booking-step-1-services.php
 *   Theme override: .../themes/your-theme/bookit/
 *                   booking-step-1-services.php
 *
 * Bookit will automatically use your override file instead of the
 * plugin default. Child themes are supported — Bookit checks the
 * child theme first, then the parent theme, then the plugin default.
 *
 * IMPORTANT: When the plugin updates, check your overridden templates
 * for changes. Outdated overrides may break if the template's expected
 * variables change. The current plugin version is in BOOKIT_VERSION.
 *
 * CSS CUSTOMISATION
 * =================
 * Override CSS custom properties in your theme stylesheet to change
 * colours, typography, and spacing without touching plugin files:
 *
 *   :root {
 *     --bookit-primary:       #E91E63 !important;
 *     --bookit-border-radius: 4px !important;
 *     --bookit-font-family:   'Poppins', sans-serif !important;
 *   }
 *
 * NOTE: The !important flag is required because the plugin stylesheet
 * loads after the theme stylesheet. Without it, the plugin's own :root
 * declarations will take precedence over theme overrides.
 *
 * Available CSS custom properties (defined in booking-wizard.css):
 *
 *   Colours:    --bookit-primary, --bookit-primary-hover,
 *               --bookit-primary-light, --bookit-accent,
 *               --bookit-text-primary, --bookit-text-secondary,
 *               --bookit-text-muted, --bookit-text-inverse,
 *               --bookit-bg-page, --bookit-bg-card, --bookit-bg-input,
 *               --bookit-border, --bookit-border-focus,
 *               --bookit-color-success, --bookit-color-warning,
 *               --bookit-color-error, --bookit-color-info
 *
 *   Shape:      --bookit-border-radius, --bookit-border-radius-sm,
 *               --bookit-shadow-sm, --bookit-shadow
 *
 *   Typography: --bookit-font-family, --bookit-font-size-sm,
 *               --bookit-font-size-base, --bookit-font-size-lg,
 *               --bookit-font-size-xl, --bookit-line-height
 *
 *   Spacing:    --bookit-spacing-xs, --bookit-spacing-sm,
 *               --bookit-spacing-md, --bookit-spacing-lg,
 *               --bookit-spacing-xl
 *
 *   Buttons:    --bookit-btn-primary-bg, --bookit-btn-primary-text,
 *               --bookit-btn-radius
 *
 *   Steps:      --bookit-step-active-bg, --bookit-step-done-bg,
 *               --bookit-step-inactive-bg
 */
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new migration required.
- [ ] No new error codes required.
- [ ] No audit log event required.
- [ ] No Vue changes required.
- [ ] No `npm run build` required.
- [ ] `class-bookit-template-loader.php` wired into `load_dependencies()`
      before `class-shortcodes.php` is required (load order matters).

---

## PHPUNIT REQUIREMENTS

Baseline: 717 tests, 0 failures — must not regress.

Read `tests/unit/test-booking-shortcode.php` via GitHub before writing.
Add new tests to that file.

Required test cases:

**`test_template_loader_returns_plugin_default_when_no_theme_override`**
- Call `Bookit_Template_Loader::locate_template( 'booking-confirmed.php' )`
- Assert the returned path ends with
  `public/templates/booking-confirmed.php`
- Assert the file exists at that path

**`test_template_loader_locate_returns_theme_override_when_present`**
- Create a temp file at
  `get_stylesheet_directory() . '/bookit/booking-confirmed.php'`
- Call `Bookit_Template_Loader::locate_template( 'booking-confirmed.php' )`
- Assert the returned path equals the temp file path
- Clean up the temp file in tearDown

**`test_template_loader_get_template_renders_output`**
- Call `Bookit_Template_Loader::get_template( 'booking-confirmed.php',
  array(), true )`
- Assert the returned string is non-empty

**`test_booking_wizard_shortcode_still_renders_after_loader_migration`**
- Call `do_shortcode( '[bookit_booking_wizard]' )`
- Assert output contains `bookit-wizard-container`
- (Confirms the migration didn't break existing shortcode rendering)

After implementation run:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

Note: Before writing the theme override test, use Context7 to resolve
'wordpress get_stylesheet_directory phpunit' and confirm the correct
approach for temporarily creating a file in the theme directory within
a test environment.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `Bookit_Template_Loader::locate_template()` returns plugin default
      when no theme override exists
- [ ] `Bookit_Template_Loader::locate_template()` returns theme override
      path when `{theme}/bookit/{template}.php` exists
- [ ] Child theme override takes priority over parent theme override
- [ ] All booking wizard steps render correctly after migration
- [ ] Confirmation page renders correctly after migration
- [ ] My Packages page renders correctly after migration
- [ ] Placing a file at `{theme}/bookit/booking-confirmed.php` causes
      the confirmation page to render the override instead of the plugin default

### Technical
- [ ] No PHP warnings or notices
- [ ] `Bookit_Template_Loader` is loaded before `Bookit_Shortcodes` in
      `load_dependencies()`
- [ ] `extract()` uses `EXTR_SKIP` to prevent variable collisions
- [ ] PHPUnit suite passes (721+ tests, 0 failures)

### Must NOT break
- [ ] All 5 booking wizard steps load and function correctly
- [ ] Booking confirmation page renders correctly
- [ ] My Packages page renders correctly
- [ ] All 717 existing tests continue to pass

---

## GIT COMMIT MESSAGE

```
Sprint 4G, Task 3b/3c/3d: WooCommerce-style template override system

- Create includes/class-bookit-template-loader.php with locate_template(),
  get_template(), plugin_template_path(), theme_template_directory()
- Theme overrides: place {theme}/bookit/{template}.php to override any
  plugin template; child theme support included
- Migrate all shortcode template includes in class-shortcodes.php to use
  Bookit_Template_Loader::get_template()
- Migrate step template loading in booking-wizard-shell.php to use loader
- Wire class-bookit-template-loader.php into load_dependencies() before
  shortcode handler
- Add developer documentation block explaining template and CSS override
  system, including !important requirement for CSS variable overrides
- Add 4 PHPUnit tests covering locate, theme override, render, and
  regression check

Tests: 721 passing, 0 failures
```

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.