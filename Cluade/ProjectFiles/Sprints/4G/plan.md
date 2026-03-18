# SPRINT 4G IMPLEMENTATION PROMPT
## Bookit Booking System — Client Readiness (~20h)

**Sprint:** 4G
**Estimated hours:** ~20h
**PHPUnit baseline:** 706 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

- **GitHub connector** — read every file listed below before writing
  any code. Never assume file contents.
- **Context7 connector** — verify WordPress and PHP patterns before
  implementing any library-specific code.
- **cursor-prompt-generator skill** — use for every Cursor prompt.

---

## SPRINT GOAL

Three items that make the plugin genuinely client-ready:

1. **`[bookit_my_packages]` shortcode** — customer-facing page showing
   their active packages, session balances, expiry dates, and
   redemption history. The API already exists; this is the public
   template and shortcode registration only.

2. **Theme override system** — WooCommerce-style template loader so
   client WordPress themes can replace any booking wizard template,
   plus CSS custom properties exposing all visual tokens for CSS-only
   overrides.

3. **`packages_enabled` gate on `/wizard/my-packages`** — a one-line
   bug fix: the public endpoint for customer package lookup is missing
   the packages_enabled gate that the available-packages endpoint has.

---

## READ FIRST — ALL FILES

Read every one of these via GitHub before writing any code:

1. `public/class-shortcodes.php` — full file; existing shortcode
   registration pattern, how templates are loaded, how assets are
   enqueued per shortcode
2. `public/templates/booking-confirmed.php` — template structure,
   CSS class conventions, how bookit- prefixed classes are used
3. `public/templates/booking-step-5-payment.php` — the most complex
   template; existing package UI section as reference for styling
4. `public/assets/css/booking-wizard.css` — existing CSS variable
   declarations and class naming conventions
5. `public/assets/css/confirmation-page.css` — template CSS pattern
6. `includes/api/class-customer-package-lookup-api.php` — full file;
   the API this shortcode calls; understand the response shape
7. `includes/api/class-available-packages-api.php` — how the
   packages_enabled gate is implemented (reference for Task 3 fix)
8. `includes/class-bookit-loader.php` — full file; how the dashboard
   serving handler works via rewrite rules (for understanding, not
   modification); how public hooks are registered
9. `dashboard/tailwind.config.js` — existing CSS variable names for
   dashboard primary colours (reference for defining the public-
   facing CSS custom properties)
10. `includes/class-bookit-activator.php` — how pages are auto-created
    on activation (reference pattern for the My Packages page)

If any file does not exist or differs from expectations, stop and
report back before proceeding.

---

## TASK 1 OF 3: `packages_enabled` Gate on `/wizard/my-packages` (~1h)

This is the quick fix. Read `class-customer-package-lookup-api.php`
via GitHub first.

**File:** `includes/api/class-customer-package-lookup-api.php` (MODIFY)

At the top of `get_my_packages()`, immediately after the rate limit
check and before any database queries, add the same packages_enabled
gate used in `class-available-packages-api.php`:

```php
$packages_enabled = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings
         WHERE setting_key = %s LIMIT 1",
        'packages_enabled'
    )
);
if ( '1' !== (string) $packages_enabled ) {
    return new WP_REST_Response( array(), 200 );
}
```

**PHPUnit:** Add one test to `tests/unit/test-use-package-redemption.php`
(or a new file if more appropriate — check phpunit.xml first):

```
test_my_packages_returns_empty_when_packages_disabled:
  Set packages_enabled = '0', create a customer with active packages,
  call the endpoint, assert response is 200 with empty array.
```

Baseline: 706 tests. This task adds 1 test.

---

## TASK 2 OF 3: `[bookit_my_packages]` Shortcode (~9h)

### 2a — REST endpoint for redemption history (~1h)

The `[bookit_my_packages]` template needs to show redemption history
per package. The existing `/dashboard/customer-packages/{id}/redemptions`
endpoint is dashboard-auth-gated. We need a public version.

**File:** `includes/api/class-customer-package-lookup-api.php` (MODIFY)

Add a new public endpoint:

```
GET /wp-json/bookit/v1/wizard/package-redemptions
  ?customer_email={email}&customer_package_id={id}
```

- Public (no dashboard auth) — customer accesses via their email
- Rate limit: 30/hour per IP (use Bookit_Rate_Limiter)
- Validate customer_email is a valid email (400 if not)
- Validate customer_package_id is a positive integer (400 if not)
- Look up customer by email — return empty array if not found (not
  a 404, to avoid email enumeration)
- Verify the package belongs to that customer — return 403 if not
- If packages_enabled = '0' — return empty array (200)
- Return last 10 redemptions ordered newest first:
  redeemed_at, booking_date, service_name, staff_name
  (join wp_bookings and wp_bookings_services and wp_bookings_staff)

**PHPUnit tests:**
- Returns empty array for unknown customer (no enumeration)
- Returns 403 if package belongs to a different customer
- Returns redemptions in correct shape
- Respects packages_enabled gate

### 2b — Shortcode template (~5h)

**New file:** `public/templates/my-packages.php`

This template is included by the shortcode. It renders a
customer-facing view of their packages.

**Template behaviour:**

The template accepts a customer email via GET parameter
(`?email={email}`) or from a logged-in WordPress user's email if
available. If no email is available, show a simple email input form
that submits via GET to the same page.

When an email is provided:
1. Call `GET /wizard/my-packages?customer_email={email}` via PHP
   (use `wp_remote_get()` with the site's own REST URL)
2. If packages_enabled = '0' (check via settings) OR no packages
   found — show an appropriate message
3. For each package, show:
   - Package type name and status badge (active/expired/exhausted)
   - Sessions remaining / total (e.g. "3 of 5 sessions remaining")
   - Expiry date if set ("Expires: 15 June 2026") or "No expiry"
   - Purchase date
   - "Show history" toggle — when expanded, loads redemption history
     via AJAX call to the new `/wizard/package-redemptions` endpoint
     and renders: date, service name, staff name for each redemption
4. If no packages found for the email — show empty state:
   "No packages found for this email address."

**CSS class conventions:** Use `bookit-` prefix for all classes
(e.g. `bookit-my-packages`, `bookit-package-card`, `bookit-package-status`).
Follow the pattern in `booking-confirmed.php`.

**New file:** `public/assets/css/my-packages.css`

Styles for the my-packages template. Scoped to `.bookit-my-packages`.
Follow the same CSS variable usage pattern as `booking-wizard.css`.
Use CSS custom properties (defined in Task 3) for colours so client
themes can override.

**Security:**
- All output escaped with `esc_html()` / `esc_attr()` / `esc_url()`
- Email input sanitised with `sanitize_email()`
- Nonce on the email submission form

### 2c — Shortcode registration and auto-page creation (~2h)

**File:** `public/class-shortcodes.php` (MODIFY)

Read the full file via GitHub first. Then:

Register new shortcode `[bookit_my_packages]`:
```php
add_shortcode( 'bookit_my_packages', array( $this, 'render_my_packages' ) );
```

Add `render_my_packages()` method following the pattern of
`render_booking_confirmation()`. Include `my-packages.php` template.
Enqueue `my-packages.css` only on pages containing this shortcode.

**File:** `includes/class-bookit-activator.php` (MODIFY)

Read the activation file via GitHub first. After the existing
`booking-confirmed` page auto-creation block, add auto-creation of
a "My Packages" page on activation (only if it doesn't already exist):

```php
$my_packages_page = get_page_by_path( 'my-packages' );
if ( ! $my_packages_page ) {
    wp_insert_post( array(
        'post_title'   => 'My Packages',
        'post_name'    => 'my-packages',
        'post_content' => '[bookit_my_packages]',
        'post_status'  => 'publish',
        'post_type'    => 'page',
    ) );
}
```

**PHPUnit:** Shortcode is registered; template renders without fatal
errors when packages_enabled = '0'; template renders without fatal
errors when no customer email provided.

---

## TASK 3 OF 3: Theme Override System (~10h)

### 3a — CSS custom properties (~2h)

**File:** `public/assets/css/booking-wizard.css` (MODIFY)

Read the full file via GitHub first. At the very top of the file,
add a `:root` block declaring all visual tokens as CSS custom
properties with sensible defaults. These are the properties a client
theme stylesheet can override:

```css
:root {
  /* Brand colours */
  --bookit-primary:          #4F46E5;
  --bookit-primary-hover:    #4338CA;
  --bookit-primary-light:    #EEF2FF;
  --bookit-accent:           #10B981;

  /* Text */
  --bookit-text-primary:     #111827;
  --bookit-text-secondary:   #6B7280;
  --bookit-text-muted:       #9CA3AF;
  --bookit-text-inverse:     #FFFFFF;

  /* Backgrounds */
  --bookit-bg-page:          #F9FAFB;
  --bookit-bg-card:          #FFFFFF;
  --bookit-bg-input:         #FFFFFF;

  /* Borders */
  --bookit-border:           #E5E7EB;
  --bookit-border-focus:     #4F46E5;
  --bookit-border-radius:    8px;
  --bookit-border-radius-sm: 4px;

  /* Shadows */
  --bookit-shadow-sm:        0 1px 2px rgba(0,0,0,0.05);
  --bookit-shadow:           0 4px 6px rgba(0,0,0,0.07);

  /* Spacing */
  --bookit-spacing-xs:       4px;
  --bookit-spacing-sm:       8px;
  --bookit-spacing-md:       16px;
  --bookit-spacing-lg:       24px;
  --bookit-spacing-xl:       32px;

  /* Typography */
  --bookit-font-family:      -apple-system, BlinkMacSystemFont,
                              'Segoe UI', sans-serif;
  --bookit-font-size-sm:     0.875rem;
  --bookit-font-size-base:   1rem;
  --bookit-font-size-lg:     1.125rem;
  --bookit-font-size-xl:     1.25rem;
  --bookit-line-height:      1.5;

  /* Buttons */
  --bookit-btn-primary-bg:   var(--bookit-primary);
  --bookit-btn-primary-text: var(--bookit-text-inverse);
  --bookit-btn-radius:       var(--bookit-border-radius);

  /* Status colours */
  --bookit-color-success:    #10B981;
  --bookit-color-warning:    #F59E0B;
  --bookit-color-error:      #EF4444;
  --bookit-color-info:       #3B82F6;

  /* Wizard step indicator */
  --bookit-step-active-bg:   var(--bookit-primary);
  --bookit-step-done-bg:     var(--bookit-accent);
  --bookit-step-inactive-bg: var(--bookit-border);
}
```

Then audit the existing CSS in the file and replace hardcoded colour
values with these variables where they match. Do not change layout
or structural properties — only colour, border-radius, font-family,
and shadow values that correspond to defined variables.

Apply the same variable usage to `confirmation-page.css` and
`my-packages.css` (the new file from Task 2).

Note: Use Context7 to verify current CSS custom property browser
support patterns if needed.

### 3b — Template loader class (~4h)

**New file:** `includes/class-bookit-template-loader.php`

A template loader following the WooCommerce pattern. Client themes
can place override templates in `{theme}/bookit/` to replace any
core template.

```php
class Bookit_Template_Loader {

    /**
     * Load a template file, checking theme overrides first.
     *
     * Checks in order:
     *   1. {active-theme}/bookit/{template-name}.php
     *   2. {parent-theme}/bookit/{template-name}.php (if child theme)
     *   3. {plugin}/public/templates/{template-name}.php (fallback)
     *
     * @param string $template_name  Filename e.g. 'booking-step-1-services.php'
     * @param array  $args           Variables to extract into template scope
     * @param bool   $return         If true, return HTML; if false, echo it
     * @return string|void
     */
    public static function get_template( $template_name, $args = array(), $return = false );

    /**
     * Return the path to the override file if it exists, or the
     * plugin default path.
     *
     * @param string $template_name
     * @return string Absolute path to template file
     */
    public static function locate_template( $template_name );

    /**
     * Return the plugin's default templates directory.
     *
     * @return string
     */
    public static function plugin_template_path();

    /**
     * Return the theme override directory name.
     * Themes place overrides in {theme}/bookit/
     *
     * @return string 'bookit'
     */
    public static function theme_template_directory();
}
```

### 3c — Migrate existing shortcode template loading (~2h)

**File:** `public/class-shortcodes.php` (MODIFY)

Read the current shortcode methods via GitHub first. Update each
shortcode's `include` or `require` call to use
`Bookit_Template_Loader::get_template()` instead of a direct `include`.

Templates to migrate:
- `booking-step-1-services.php`
- `booking-step-2-staff.php`
- `booking-step-3-datetime.php`
- `booking-step-4-contact.php`
- `booking-step-5-payment.php`
- `booking-confirmed.php`
- `my-packages.php` (new from Task 2 — use loader from the start)

**File:** `includes/class-bookit-loader.php` (MODIFY)

Require the new template loader class in `load_dependencies()`.

### 3d — Documentation comment block (~1h)

Add a well-documented comment block at the top of
`includes/class-bookit-template-loader.php` explaining the override
system for developers/clients:

```
HOW TO OVERRIDE BOOKIT TEMPLATES IN YOUR THEME
================================================
Copy any template from:
  wp-content/plugins/bookit-booking-system/public/templates/

To your theme at:
  wp-content/themes/{your-theme}/bookit/

Example:
  Plugin default: .../bookit-booking-system/public/templates/
                  booking-step-1-services.php
  Theme override: .../themes/your-theme/bookit/
                  booking-step-1-services.php

IMPORTANT: When the plugin updates, check your overridden templates
for changes. Outdated overrides may break if the template's expected
variables change. The plugin version is stored in BOOKIT_VERSION.

CSS CUSTOMISATION
=================
Override CSS custom properties in your theme stylesheet:

  :root {
    --bookit-primary:       #E91E63;  /* Your brand colour */
    --bookit-border-radius: 4px;      /* Sharper corners */
    --bookit-font-family:   'Poppins', sans-serif;
  }

See booking-wizard.css for the full list of available properties.
```

---

## SPRINT AGENT WORKFLOW

1. Read ALL files in READ FIRST via GitHub before any code
2. Task order: Task 1 → Task 2 → Task 3 (smallest to largest)
3. Use Context7 for CSS and PHP patterns as needed
4. Use cursor-prompt-generator skill for each Cursor prompt
5. One task at a time — wait for confirmation before proceeding
6. If you encounter a scope or architecture decision not covered,
   STOP and escalate

---

## ACCEPTANCE CRITERIA — SPRINT LEVEL

**Task 1 — packages_enabled gate:**
- [ ] `/wizard/my-packages` returns empty array when
      packages_enabled = '0'
- [ ] 1 new PHPUnit test covering this

**Task 2 — `[bookit_my_packages]` shortcode:**
- [ ] Shortcode renders email input form when no email provided
- [ ] Shortcode calls API and shows packages for a valid email
- [ ] Package cards show name, sessions, expiry, status
- [ ] Redemption history loads via AJAX when expanded
- [ ] Empty state shown when no packages found
- [ ] packages_enabled = '0' shows appropriate message
- [ ] All output correctly escaped
- [ ] "My Packages" page auto-created on plugin activation
- [ ] `my-packages.css` enqueued only on pages with shortcode

**Task 3 — Theme override system:**
- [ ] CSS custom properties defined in `:root` in booking-wizard.css
- [ ] Hardcoded colour values in wizard CSS replaced with variables
- [ ] `Bookit_Template_Loader::get_template()` works correctly
- [ ] Theme override at `{theme}/bookit/` takes precedence over plugin
- [ ] All existing shortcode templates loaded via Bookit_Template_Loader
- [ ] Fallback to plugin template when no override exists
- [ ] Documentation comment block explains override system clearly

**Technical:**
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (706+ tests, 0 failures)
- [ ] Existing booking wizard all steps unaffected
- [ ] Existing confirmation page unaffected

---

## GIT COMMIT CONVENTION

```
Sprint 4G, Task [N]: [description]

- [change 1]
- [change 2]

Tests: [N] passing, 0 failures
```

Commit after each task.

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.