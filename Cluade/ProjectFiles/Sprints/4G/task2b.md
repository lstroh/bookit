TASK 2B OF 3: [bookit_my_packages] Shortcode Template + CSS
Sprint: 4G | Est: ~7h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/class-shortcodes.php` — full file; understand the existing shortcode
   registration in __construct(), the render_booking_confirmation() method
   pattern (ob_start / include / ob_get_clean), and the enqueue_wizard_assets()
   method (has_shortcode gate, wp_enqueue_style/script pattern, wp_localize_script).
   This is the primary reference for all patterns in this task.

2. `public/templates/booking-confirmed.php` — full file; CSS class conventions
   (bookit- prefix, BEM-style), how escaping is applied throughout, how PHP
   variables are used inside templates.

3. `public/assets/css/confirmation-page.css` — full file; CSS structure pattern,
   how styles are scoped to a top-level class, how bookit- prefixed classes are used.

4. `public/assets/css/booking-wizard.css` — read the first 60 lines; check
   whether a :root CSS custom properties block already exists (Task 3a will add
   one — if it is already there, use those variables; if not, use the hardcoded
   colour values from confirmation-page.css as the reference palette).

5. `includes/api/class-customer-package-lookup-api.php` — read get_my_packages()
   response shape and get_package_redemptions() response shape; the template
   calls both endpoints and must match their actual field names.

6. `includes/class-bookit-activator.php` — read the booking-confirmed page
   auto-creation block; follow the exact same wp_insert_post pattern for the
   My Packages page.

7. `includes/class-csrf-protection.php` — read in full; the email form nonce
   must use the same CSRF helper used elsewhere in public templates.

If any file does not exist or differs from expectations, stop and report
back before proceeding.

---

## CONTEXT

Task 2a added the public `/wizard/package-redemptions` endpoint. This task
delivers the front-end that calls it: a new `[bookit_my_packages]` shortcode,
its PHP template, its CSS file, and the "My Packages" auto-created page on
activation. The shortcode renders a customer-facing list of their active
packages with lazy-loaded redemption history per package. No Vue — this is
server-rendered PHP with a small vanilla JS AJAX toggle, consistent with all
other public-facing templates in this plugin.

---

## IMPLEMENTATION REQUIREMENTS

---

### public/class-shortcodes.php — MODIFY

Read the full file via GitHub before making any change.

**1. Register the new shortcode** — add inside `__construct()` after the
existing `add_shortcode` calls:

```php
add_shortcode( 'bookit_my_packages', array( $this, 'render_my_packages' ) );
```

**2. Add `render_my_packages()` method** — after `render_booking_confirmation()`,
following the identical pattern (ob_start, include with file_exists guard,
ob_get_clean):

```php
public function render_my_packages( $atts = array(), $content = '' ) {
    ob_start();
    $template_path = BOOKIT_PLUGIN_DIR . 'public/templates/my-packages.php';
    if ( file_exists( $template_path ) ) {
        include $template_path;
    } else {
        echo '<p>' . esc_html__( 'My Packages template not found.', 'bookit-booking-system' ) . '</p>';
    }
    return ob_get_clean();
}
```

**3. Extend `enqueue_wizard_assets()`** — add `bookit_my_packages` detection
alongside the existing `has_shortcode` checks:

```php
$has_my_packages = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'bookit_my_packages' );
```

Update the early-return guard to include `$has_my_packages`:
```php
if ( ! $has_wizard && ! $has_confirmation && ! $has_my_packages ) {
    return;
}
```

At the end of the method (after all existing enqueues), add the my-packages
CSS — but only when on a my-packages page:
```php
if ( $has_my_packages ) {
    wp_enqueue_style(
        'bookit-my-packages',
        BOOKIT_PLUGIN_URL . 'public/assets/css/my-packages.css',
        array(),
        BOOKIT_VERSION,
        'all'
    );
    wp_localize_script(
        'bookit-wizard',
        'bookitMyPackages',
        array(
            'restUrl' => rest_url( 'bookit/v1/wizard/package-redemptions' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        )
    );
}
```

Note: `bookit-wizard` JS is already enqueued earlier in the method when
`$has_my_packages` is true (because the guard now includes it). The
`wp_localize_script` call must come after the `wp_enqueue_script` for
`bookit-wizard`.

---

### public/templates/my-packages.php — CREATE

New template file. No direct DB access — all data comes from the REST API
via `wp_remote_get()` or is read from `$_GET`.

**Template logic:**

```
1. Get customer email:
   - Check $_GET['customer_email'] — sanitize_email()
   - If empty and user is logged in (is_user_logged_in()), use wp_get_current_user()->user_email
   - If still empty — show email input form (see below) and exit

2. Validate email — if not is_email(), show email input form and exit

3. Check packages_enabled:
   global $wpdb;
   $packages_enabled = $wpdb->get_var( $wpdb->prepare(
       "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
       'packages_enabled'
   ) );
   If '1' !== (string) $packages_enabled — show "Package sessions are not
   currently available." message and exit.

4. Fetch packages via internal REST call:
   $response = wp_remote_get( rest_url( 'bookit/v1/wizard/my-packages' ) . '?' .
       http_build_query( array( 'customer_email' => $customer_email ) ) );
   If is_wp_error( $response ) or wp_remote_retrieve_response_code( $response ) !== 200
   — show error message and exit.
   $packages = json_decode( wp_remote_retrieve_body( $response ), true );
   If empty( $packages ) — show empty state message.

5. Render package cards (see HTML structure below).
```

**Email input form** (shown when no valid email is available):

```html
<div class="bookit-my-packages">
    <div class="bookit-my-packages__email-form">
        <h2 class="bookit-my-packages__title">My Packages</h2>
        <p class="bookit-my-packages__intro">
            Enter your email address to view your active packages.
        </p>
        <form method="get" action="" class="bookit-email-form">
            <?php wp_nonce_field( 'bookit_my_packages_lookup', '_bookit_nonce' ); ?>
            <div class="bookit-form-group">
                <label for="bookit-customer-email" class="bookit-form-label">
                    Email address
                </label>
                <input
                    type="email"
                    id="bookit-customer-email"
                    name="customer_email"
                    class="bookit-form-input"
                    required
                    placeholder="your@email.com"
                    value=""
                />
            </div>
            <button type="submit" class="bookit-btn-primary">
                View My Packages
            </button>
        </form>
    </div>
</div>
```

Note: When a `customer_email` GET param is present, verify the nonce with
`wp_verify_nonce( sanitize_text_field( $_GET['_bookit_nonce'] ?? '' ), 'bookit_my_packages_lookup' )`.
If nonce fails — show the email form again with an error message. Skip nonce
check for logged-in user email (not submitted via form).

**Package cards** (rendered inside `.bookit-my-packages`):

```html
<div class="bookit-my-packages">
    <h2 class="bookit-my-packages__title">My Packages</h2>

    <?php foreach ( $packages as $package ) : ?>
    <div class="bookit-package-card" data-package-id="<?php echo esc_attr( $package['id'] ); ?>">

        <div class="bookit-package-card__header">
            <span class="bookit-package-card__name">
                <?php echo esc_html( $package['package_type_name'] ); ?>
            </span>
            <span class="bookit-package-status bookit-package-status--active">
                Active
            </span>
        </div>

        <div class="bookit-package-card__body">
            <div class="bookit-package-card__sessions">
                <?php echo esc_html( $package['sessions_remaining'] ); ?>
                of
                <?php echo esc_html( $package['sessions_total'] ); ?>
                sessions remaining
            </div>
            <div class="bookit-package-card__expiry">
                <?php if ( ! empty( $package['expires_at'] ) ) : ?>
                    Expires: <?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $package['expires_at'] ) ) ); ?>
                <?php else : ?>
                    No expiry
                <?php endif; ?>
            </div>
        </div>

        <div class="bookit-package-card__footer">
            <button
                type="button"
                class="bookit-toggle-history"
                data-package-id="<?php echo esc_attr( $package['id'] ); ?>"
                data-customer-email="<?php echo esc_attr( $customer_email ); ?>"
                aria-expanded="false"
            >
                Show history
            </button>
        </div>

        <div class="bookit-redemption-history" id="bookit-history-<?php echo esc_attr( $package['id'] ); ?>" hidden>
            <p class="bookit-redemption-history__loading">Loading...</p>
        </div>

    </div>
    <?php endforeach; ?>

    <?php if ( empty( $packages ) ) : ?>
    <div class="bookit-my-packages__empty">
        <p>No packages found for this email address.</p>
    </div>
    <?php endif; ?>
</div>
```

**Inline JavaScript** — add at the bottom of the template, inside a
`<script>` block, only if packages were found. This handles the toggle:

```javascript
(function() {
    document.querySelectorAll('.bookit-toggle-history').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var packageId    = this.dataset.packageId;
            var email        = this.dataset.customerEmail;
            var historyEl    = document.getElementById('bookit-history-' + packageId);
            var expanded     = this.getAttribute('aria-expanded') === 'true';

            if (expanded) {
                historyEl.hidden = true;
                this.setAttribute('aria-expanded', 'false');
                this.textContent = 'Show history';
                return;
            }

            // Open and load if not already loaded.
            historyEl.hidden = false;
            this.setAttribute('aria-expanded', 'true');
            this.textContent = 'Hide history';

            if (historyEl.dataset.loaded) return;

            var url = bookitMyPackages.restUrl +
                '?customer_email=' + encodeURIComponent(email) +
                '&customer_package_id=' + encodeURIComponent(packageId);

            fetch(url, {
                headers: { 'X-WP-Nonce': bookitMyPackages.nonce }
            })
            .then(function(r) { return r.json(); })
            .then(function(items) {
                historyEl.dataset.loaded = '1';
                if (!items.length) {
                    historyEl.innerHTML = '<p class="bookit-redemption-history__empty">No redemptions yet.</p>';
                    return;
                }
                var html = '<ul class="bookit-redemption-list">';
                items.forEach(function(item) {
                    html += '<li class="bookit-redemption-item">' +
                        '<span class="bookit-redemption-item__date">' + escHtml(item.redeemed_at) + '</span>' +
                        '<span class="bookit-redemption-item__service">' + escHtml(item.service_name) + '</span>' +
                        '<span class="bookit-redemption-item__staff">' + escHtml(item.staff_name) + '</span>' +
                        '</li>';
                });
                html += '</ul>';
                historyEl.innerHTML = html;
            })
            .catch(function() {
                historyEl.innerHTML = '<p class="bookit-redemption-history__error">Could not load history.</p>';
            });
        });
    });

    function escHtml(str) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }
}());
```

**Security rules for the template:**
- All output: `esc_html()`, `esc_attr()`, `esc_url()`
- Email input: `sanitize_email()`
- Form nonce verified before using GET email param
- No direct DB writes — template is read-only

---

### public/assets/css/my-packages.css — CREATE

Styles scoped to `.bookit-my-packages`. Follow the structure of
`confirmation-page.css` (read via GitHub first). Use the same palette
and spacing values. If the `:root` CSS custom properties block from Task 3a
is already present in `booking-wizard.css`, reference those variables.
If not, use matching hardcoded values consistent with `confirmation-page.css`.

Required selectors to style (layout and visual treatment to match the
quality of `confirmation-page.css`):

```
.bookit-my-packages              — outer wrapper, max-width 800px, centred
.bookit-my-packages__title       — page heading
.bookit-my-packages__intro       — intro paragraph
.bookit-my-packages__email-form  — email entry state card
.bookit-my-packages__empty       — empty state
.bookit-email-form               — form layout
.bookit-form-group               — label + input wrapper
.bookit-form-label               — label style
.bookit-form-input               — text input style
.bookit-package-card             — individual package card (white, shadow, radius)
.bookit-package-card__header     — flex row: name left, status badge right
.bookit-package-card__name       — package type name
.bookit-package-status           — base badge style
.bookit-package-status--active   — green badge
.bookit-package-card__body       — sessions + expiry rows
.bookit-package-card__sessions   — sessions remaining text
.bookit-package-card__expiry     — expiry text, muted colour
.bookit-package-card__footer     — toggle button area
.bookit-toggle-history           — text button, no border, primary colour
.bookit-redemption-history       — collapsible section
.bookit-redemption-history__loading — loading state text
.bookit-redemption-history__empty   — no redemptions state
.bookit-redemption-history__error   — error state
.bookit-redemption-list          — unstyled list
.bookit-redemption-item          — single row: date, service, staff in a flex row
.bookit-redemption-item__date    — muted, smaller font
.bookit-redemption-item__service — normal weight
.bookit-redemption-item__staff   — muted, right-aligned
.bookit-btn-primary              — primary button (already defined in wizard CSS;
                                   only add here if not already globally available)
```

---

### includes/class-bookit-activator.php — MODIFY

Read the full file via GitHub before making any change.

After the existing `booking-confirmed` page creation block, add the
My Packages page auto-creation:

```php
$my_packages_page = get_page_by_path( 'my-packages' );
if ( ! $my_packages_page ) {
    wp_insert_post(
        array(
            'post_title'   => 'My Packages',
            'post_name'    => 'my-packages',
            'post_content' => '[bookit_my_packages]',
            'post_status'  => 'publish',
            'post_type'    => 'page',
        )
    );
}
```

Do not change any other logic in this file.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new migration required.
- [ ] No new error codes required.
- [ ] No audit log event required (read-only public template).
- [ ] No Vue changes — template is server-rendered PHP + vanilla JS.
- [ ] No `npm run build` required (no dashboard changes).

---

## PHPUNIT REQUIREMENTS

Baseline: 712 tests, 0 failures — must not regress.

Add tests to `tests/unit/test-booking-shortcode.php` (read file via GitHub
first to understand existing test patterns before adding).

Required test cases:

**`test_my_packages_shortcode_is_registered`**
- Assert `shortcode_exists( 'bookit_my_packages' )` returns true

**`test_my_packages_shortcode_renders_email_form_when_no_email`**
- Call `do_shortcode( '[bookit_my_packages]' )`
- Assert output contains `bookit-my-packages`
- Assert output contains `<form`
- Assert output contains `name="customer_email"`

**`test_my_packages_shortcode_renders_disabled_message_when_packages_off`**
- Set `packages_enabled` = `'0'` in settings
- Simulate a valid `$_GET['customer_email']` (use a test email, skip nonce
  by testing the template render method directly if needed)
- Assert output contains 'not currently available' or similar disabled message

**`test_my_packages_css_enqueued_only_on_my_packages_page`**
- Create a page with `[bookit_my_packages]` shortcode content
- Set as global `$post`, call `do_action( 'wp_enqueue_scripts' )`
- Assert `bookit-my-packages` style is in the enqueued queue

**`test_my_packages_css_not_enqueued_on_unrelated_page`**
- Create a page without the shortcode
- Assert `bookit-my-packages` style is NOT enqueued

After implementation run:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

Note: Before writing any PHPUnit enqueue assertions, use Context7 to
resolve 'wordpress shortcode phpunit' and confirm the `wp_styles()->queue`
assertion pattern matches the existing tests in `test-booking-shortcode.php`.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `[bookit_my_packages]` shortcode renders email input form when
      no email is available
- [ ] Form submits via GET to the same page
- [ ] Nonce is present on the form and verified on submission
- [ ] When a valid email is supplied and packages exist, package cards render
      with name, sessions remaining/total, expiry date or "No expiry"
- [ ] "Show history" button toggles the redemption section via AJAX
- [ ] Redemption history shows redeemed_at, service_name, staff_name
- [ ] "No packages found" empty state shown when API returns empty array
- [ ] "Not currently available" message shown when packages_enabled = '0'
- [ ] "My Packages" page exists in WordPress after plugin activation
- [ ] `my-packages.css` is enqueued only on pages containing the shortcode

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] All output escaped: esc_html(), esc_attr(), esc_url()
- [ ] Email sanitised with sanitize_email()
- [ ] JS escapes output before inserting into DOM (escHtml helper)
- [ ] Follows render_booking_confirmation() method pattern exactly
- [ ] PHPUnit suite passes (717+ tests, 0 failures)

### Must NOT break
- [ ] Existing booking wizard shortcode unaffected
- [ ] Existing confirmation shortcode unaffected
- [ ] enqueue_wizard_assets() still correctly gates wizard/confirmation assets
- [ ] All 712 existing tests continue to pass

---

## GIT COMMIT MESSAGE

```
Sprint 4G, Task 2b: Add [bookit_my_packages] shortcode, template, and CSS

- Register bookit_my_packages shortcode in Bookit_Shortcodes
- Add render_my_packages() method following render_booking_confirmation() pattern
- Create public/templates/my-packages.php with email form, package cards,
  and AJAX redemption history toggle
- Create public/assets/css/my-packages.css scoped to .bookit-my-packages
- Enqueue my-packages.css and localize bookitMyPackages JS object only on
  pages containing the shortcode
- Auto-create My Packages page on plugin activation (class-bookit-activator.php)
- Add 5 PHPUnit tests covering shortcode registration, rendering, and enqueue gating

Tests: 717 passing, 0 failures
```

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.