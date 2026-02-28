Here is the Task 3 Cursor prompt.

---

### Cursor Prompt — Task 3: White-Label Branding System

```
CONTEXT
=======
Plugin: bookit-booking-system (WordPress plugin)
Branch: Phase1
Environment: Local by Flywheel (dev) + wp-env (PHPUnit)
PHP: 8.0+ / WordPress 6.0+
All code follows WordPress Coding Standards.

BACKGROUND
==========
Sprint 4B Task 3 adds white-label branding to the business dashboard only.
The business owner can set their logo, primary colour, business name, and
toggle the "Powered by Bookit" footer text. These settings apply to the
dashboard UI only — the public booking widget (shortcode) is not affected
in this sprint.

Read these files before making any changes:
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (understand the existing settings GET/PATCH endpoint pattern — find
  how settings are currently read and written)
- bookit-booking-system/includes/models/class-settings-model.php or
  equivalent (understand how settings are stored and retrieved from
  wp_bookings_settings)
- bookit-booking-system/admin/class-bookit-admin.php (find where
  window.bookitDashboard JS data object is built and passed to Vue —
  the bookit_dashboard_js_data filter from Task 1 should already be
  applied here)
- bookit-booking-system/dashboard/src/ — find:
  * The Settings page component and its existing tabs/sections
  * The main App.vue or layout component (find the dashboard header
    where the logo and business name should appear)
  * The sidebar or footer component where "Powered by Bookit" text lives
  * How the primary colour CSS variable is currently defined (look for
    --bookit-primary or similar in CSS/Tailwind config)
  * The existing media library picker if one exists, or how file uploads
    are handled elsewhere in the Vue app

Do not guess at existing patterns. Read the actual files first.

YOUR TASK
=========
Implement the white-label branding system in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Settings storage
───────────────────────────────────────────────────────────────────────────────
No migration needed — branding settings use the existing wp_bookings_settings
table via the settings model already in place.

The four new settings keys to add (follow the exact same pattern used for
existing settings):
  branding_logo_url         — string (URL to uploaded image, empty by default)
  branding_primary_colour   — string (hex colour, default '#4F46E5')
  branding_business_name    — string (empty by default)
  branding_powered_by_visible — boolean (true by default)

Add these defaults in class-bookit-activator.php in the activate() method,
alongside the existing default settings. Follow the exact same pattern
already used for other defaults. Only add if not already set (use
get_option/add_option pattern or check existing settings before inserting).

───────────────────────────────────────────────────────────────────────────────
STEP 2: Branding REST endpoints
───────────────────────────────────────────────────────────────────────────────
Read the existing settings endpoint carefully before implementing.

If the existing settings GET/PATCH endpoint already handles arbitrary
settings keys, extend it to include the four branding keys rather than
creating a separate endpoint. Only create a separate
GET /wp-json/bookit/v1/settings/branding endpoint if the existing
settings endpoint cannot easily accommodate these keys.

Whichever approach you take:

GET must return:
  {
    "branding_logo_url": "",
    "branding_primary_colour": "#4F46E5",
    "branding_business_name": "",
    "branding_powered_by_visible": true
  }

PATCH/POST must accept and validate:
  branding_logo_url         — must be empty string or valid URL
                              (use esc_url_raw + filter_var FILTER_VALIDATE_URL)
  branding_primary_colour   — must match /^#[0-9A-Fa-f]{6}$/
                              (6-digit hex only, reject shorthand #FFF)
  branding_business_name    — sanitize_text_field, max 100 chars
  branding_powered_by_visible — boolean

Permission: admin-only for PATCH. GET can be any authenticated dashboard user
(the Vue app needs branding on load for all roles).

───────────────────────────────────────────────────────────────────────────────
STEP 3: Include branding in window.bookitDashboard JS data
───────────────────────────────────────────────────────────────────────────────
Find where the bookit_dashboard_js_data filter is applied in
admin/class-bookit-admin.php (added in Task 1).

Add a listener for this filter that appends branding settings:

add_filter( 'bookit_dashboard_js_data', function( array $js_data ): array {
    // Load branding settings from the settings model.
    // Follow the exact pattern used to read settings elsewhere.
    $js_data['branding'] = [
        'logoUrl'          => get_setting( 'branding_logo_url' ) ?? '',
        'primaryColour'    => get_setting( 'branding_primary_colour' ) ?? '#4F46E5',
        'businessName'     => get_setting( 'branding_business_name' ) ?? '',
        'poweredByVisible' => (bool) ( get_setting( 'branding_powered_by_visible' ) ?? true ),
    ];
    return $js_data;
} );

Replace get_setting() with the actual method used to retrieve settings in
this codebase — read the settings model to find the correct method name.

───────────────────────────────────────────────────────────────────────────────
STEP 4: Apply branding in Vue app on load
───────────────────────────────────────────────────────────────────────────────
Read App.vue (or the root layout component) before editing.

On app mount (in App.vue or the root layout), read branding from
window.bookitDashboard.branding and apply:

1. PRIMARY COLOUR — apply as CSS custom property on the root element:
   document.documentElement.style.setProperty(
     '--bookit-primary', branding.primaryColour
   )
   
   This assumes the existing Tailwind config or CSS already uses
   --bookit-primary as a CSS variable for the primary colour. If the
   codebase uses a different variable name, find it by searching for
   the existing primary colour hex value in the CSS/config files and
   use that variable name instead.

2. BUSINESS NAME — display in the dashboard header/navbar where the
   plugin name or site name currently appears. If branding.businessName
   is empty, fall back to 'Bookit' or whatever the current default text is.

3. LOGO — in the dashboard header, if branding.logoUrl is set, replace
   the current logo/icon with an <img> tag pointing to branding.logoUrl.
   If empty, show the existing default logo/icon. Set alt text to
   branding.businessName or 'Dashboard' if business name is also empty.

4. POWERED BY — find the "Powered by Bookit" text in the sidebar footer
   or dashboard footer. Show/hide it based on branding.poweredByVisible.
   If the text does not currently exist, add it to the sidebar footer
   as a small muted text element, conditionally rendered.

All four of these must persist across Vue Router navigation — they are
set once on app mount, not re-applied on each route change.

───────────────────────────────────────────────────────────────────────────────
STEP 5: Branding Settings page in Vue
───────────────────────────────────────────────────────────────────────────────
Read the existing Settings page structure carefully. Add a new "Branding"
tab or section following the exact same pattern as existing tabs.

The Branding section must include:

1. LOGO UPLOAD
   Use the WordPress media library picker. The standard way to open it
   from a Vue component is via the wp.media() JavaScript API which is
   available when the page is loaded in WordPress context:

   function openMediaPicker() {
     const frame = wp.media({
       title: 'Select Logo',
       button: { text: 'Use this image' },
       multiple: false,
       library: { type: 'image' }
     })
     frame.on('select', () => {
       const attachment = frame.state().get('selection').first().toJSON()
       form.logoUrl = attachment.url
     })
     frame.open()
   }

   Show the current logo as a preview thumbnail if logoUrl is set.
   Show a "Remove logo" button when a logo is set (clears logoUrl to '').
   Enqueue the WordPress media scripts if not already enqueued — in
   admin/class-bookit-admin.php, add:
     wp_enqueue_media();
   in the method that enqueues dashboard assets.

2. BUSINESS NAME
   Text input, max 100 characters, label "Business Name",
   helper text: "Shown in the dashboard header instead of 'Bookit'."

3. PRIMARY COLOUR
   <input type="color"> with a text input alongside it showing the hex
   value. The two inputs must stay in sync — changing the colour picker
   updates the text input and vice versa. Validate hex format on the
   text input (must match #RRGGBB). Label: "Primary Colour".

4. POWERED BY TOGGLE
   Toggle switch (follow existing toggle pattern in the Settings page).
   Label: "Show 'Powered by Bookit'".
   Helper text: "Uncheck to hide the Bookit branding in the dashboard footer."

5. SAVE BUTTON
   On save: PATCH to the branding endpoint.
   On success: show success toast and immediately apply the new branding
   to the current session (update CSS variable, header, etc.) without
   requiring a page reload. Re-apply using the same logic as Step 4.
   On error: show error toast with the API-provided message.

6. ACCESS CONTROL
   The Branding section is visible and editable only by bookit_admin role.
   Follow the existing pattern for admin-only settings sections.

CODING STANDARDS
================
- WordPress Coding Standards throughout
- esc_url_raw() for URL storage, esc_url() for output
- Hex colour validation server-side with regex before storing
- Vue component follows existing patterns (match Options/Composition API)
- No inline styles — CSS custom property approach only for colour
- wp_enqueue_media() called only on dashboard pages, not site-wide
- Do not affect the public booking widget (shortcode) in any way
```

---

**Testing checklist for Task 3:**

- [ ] Default branding settings exist after plugin activation — check `wp_bookings_settings` table for the four `branding_*` keys
- [ ] Branding Settings section visible in Settings page when logged in as admin
- [ ] Branding Settings section not visible when logged in as staff
- [ ] Set a business name — confirm it appears in the dashboard header immediately after save without page reload
- [ ] Set a primary colour — confirm a coloured UI element (button, link, active nav item) changes colour immediately after save
- [ ] Upload a logo via the media picker — confirm the logo URL is saved and the logo appears in the dashboard header
- [ ] Remove the logo — confirm the default logo/icon returns
- [ ] Toggle "Powered by Bookit" off — confirm the footer text disappears
- [ ] Toggle "Powered by Bookit" on — confirm the footer text reappears
- [ ] `window.bookitDashboard.branding` contains the correct values — open browser console on the dashboard and type `window.bookitDashboard.branding`
- [ ] Navigate between dashboard pages — confirm branding persists across route changes
- [ ] Public booking widget (shortcode) on the front end is unchanged

When done, let me know and I'll provide the git commit and Task 8 prompt.