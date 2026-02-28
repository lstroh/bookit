Yes. Here's the Task 1 Cursor prompt.

---

### Cursor Prompt — Task 1: Extension Hook System

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
Sprint 4B Task 1 adds the extension hook system — the foundation that allows
separate extension plugins (Bookit Recurring, Bookit Classes, Bookit Forms)
to integrate with core without modifying core files.

This task has four parts:
1. Extension registry (bookit_register_extension, bookit_register_nav_item)
2. REST endpoint for extensions/nav items
3. Action hooks added to existing controllers
4. Filter hooks added to existing controllers
5. "Active Extensions" section in Settings UI

Read these files before making any changes:
- includes/api/class-dashboard-bookings-api.php (booking creation, update, cancel)
- includes/api/class-wizard-api.php (public booking wizard — also creates bookings)
- includes/payment/class-stripe-checkout.php or equivalent webhook handler
  (look for where bookings are created after payment — add payment hook here)
- includes/models/class-datetime-model.php (availability slot calculation)
- includes/class-bookit-loader.php (to understand where to register new classes)
- admin/class-bookit-admin.php (to understand how the dashboard page is served)
- dashboard/app/components/ — find the Sidebar component (likely AppSidebar.vue
  or similar) to understand current nav structure
- dashboard/app/views/Settings/ — find the existing Settings page structure

Do not guess at method names or file locations. Read the actual files first.

YOUR TASK
=========
Implement the extension hook system in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Extension registry class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/class-bookit-extension-registry.php

class Bookit_Extension_Registry {

    private static array $extensions = [];
    private static array $nav_items  = [];

    /**
     * Register an extension plugin with Bookit core.
     * Extensions call this on plugins_loaded (priority 5, before core's priority 10).
     *
     * @param array $args {
     *   @type string $name          Display name. Required.
     *   @type string $slug          Unique slug (e.g. 'bookit-recurring'). Required.
     *   @type string $version       Extension version (e.g. '1.0.0'). Required.
     *   @type string $requires_core Minimum core version required (e.g. '1.0.0'). Required.
     *   @type string $description   Optional description.
     *   @type string $author        Optional author name.
     * }
     * @return true|WP_Error True on success, WP_Error if incompatible or duplicate.
     */
    public static function register_extension( array $args ): true|WP_Error {
        // Validate required fields: name, slug, version, requires_core.
        // Return WP_Error with code 'bookit_missing_field' if any missing.
        
        // Check core version compatibility.
        // BOOKIT_VERSION must be >= $args['requires_core'].
        // If not: return WP_Error with code 'bookit_version_incompatible',
        // message: "Bookit {$args['name']} requires Bookit core version
        // {$args['requires_core']} or higher. Current version: " . BOOKIT_VERSION
        
        // Reject duplicate slugs.
        // Return WP_Error with code 'bookit_duplicate_slug' if slug already registered.
        
        // Store in registry.
        self::$extensions[ $args['slug'] ] = [
            'name'          => sanitize_text_field( $args['name'] ),
            'slug'          => sanitize_key( $args['slug'] ),
            'version'       => sanitize_text_field( $args['version'] ),
            'requires_core' => sanitize_text_field( $args['requires_core'] ),
            'description'   => sanitize_text_field( $args['description'] ?? '' ),
            'author'        => sanitize_text_field( $args['author'] ?? '' ),
            'registered_at' => current_time( 'mysql' ),
        ];
        
        return true;
    }

    /**
     * Register a nav item for the dashboard sidebar.
     * Extensions call this after registering themselves.
     *
     * @param array $args {
     *   @type string $label      Display label. Required.
     *   @type string $route      Vue router path (e.g. '/bookit-dashboard/app/recurring'). Required.
     *   @type string $icon       Icon identifier (use same icon names as existing sidebar). Required.
     *   @type int    $position   Sort order integer. Lower = higher in sidebar. Default 100.
     *   @type string $capability Required capability. Default 'bookit_manage_all'.
     *   @type string $slug       Extension slug this nav item belongs to. Required.
     * }
     * @return true|WP_Error
     */
    public static function register_nav_item( array $args ): true|WP_Error {
        // Validate required: label, route, icon, slug.
        // Reject if slug not in $extensions registry
        // (nav items must belong to a registered extension).
        
        self::$nav_items[] = [
            'label'      => sanitize_text_field( $args['label'] ),
            'route'      => esc_url_raw( $args['route'] ),
            'icon'       => sanitize_key( $args['icon'] ),
            'position'   => absint( $args['position'] ?? 100 ),
            'capability' => sanitize_key( $args['capability'] ?? 'bookit_manage_all' ),
            'slug'       => sanitize_key( $args['slug'] ),
        ];
        
        // Sort nav_items by position ascending after each addition.
        usort( self::$nav_items, fn( $a, $b ) => $a['position'] <=> $b['position'] );
        
        return true;
    }

    /** @return array All registered extensions. */
    public static function get_extensions(): array {
        return array_values( self::$extensions );
    }

    /** @return array All registered nav items. */
    public static function get_nav_items(): array {
        return self::$nav_items;
    }

    /** @return bool Whether a given slug is registered. */
    public static function is_registered( string $slug ): bool {
        return isset( self::$extensions[ $slug ] );
    }
}

───────────────────────────────────────────────────────────────────────────────
STEP 2: Global registration functions
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/functions-extensions.php

<?php
if ( ! defined( 'WPINC' ) ) { die; }

/**
 * Register a Bookit extension plugin.
 * Call this on plugins_loaded (priority 5).
 */
function bookit_register_extension( array $args ): true|WP_Error {
    return Bookit_Extension_Registry::register_extension( $args );
}

/**
 * Register a dashboard sidebar nav item for an extension.
 */
function bookit_register_nav_item( array $args ): true|WP_Error {
    return Bookit_Extension_Registry::register_nav_item( $args );
}

───────────────────────────────────────────────────────────────────────────────
STEP 3: Extensions REST endpoint
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/api/class-extensions-api.php

Register: GET /wp-json/bookit/v1/extensions

- Permission: check_dashboard_permission (same pattern as other dashboard APIs —
  requires valid session, any authenticated dashboard user)
- Response shape:
  {
    "extensions": [
      {
        "name": "Bookit Recurring",
        "slug": "bookit-recurring",
        "version": "1.0.0",
        "requires_core": "1.0.0",
        "description": "...",
        "author": "..."
      }
    ],
    "nav_items": [
      {
        "label": "Recurring",
        "route": "/bookit-dashboard/app/recurring",
        "icon": "calendar-repeat",
        "position": 50,
        "capability": "bookit_manage_all",
        "slug": "bookit-recurring"
      }
    ]
  }

- Apply filter before returning:
  $nav_items = apply_filters( 'bookit_sidebar_nav_items', $nav_items );

- No authentication required beyond dashboard session (same as all other
  dashboard endpoints). Extensions are not sensitive data.

Follow the exact same class structure and REST registration pattern as
class-dashboard-bookings-api.php.

───────────────────────────────────────────────────────────────────────────────
STEP 4: Load new classes in class-bookit-loader.php
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-loader.php

In load_dependencies(), add:
    require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-extension-registry.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/functions-extensions.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-extensions-api.php';

Instantiate the API class in the appropriate place (same pattern as other API
classes — check how class-dashboard-bookings-api.php is instantiated).

───────────────────────────────────────────────────────────────────────────────
STEP 5: Action hooks — add do_action() calls to existing controllers
───────────────────────────────────────────────────────────────────────────────
Read the actual files before editing. Find the exact methods and add hooks
at the specified points. Do not restructure existing methods.

In class-dashboard-bookings-api.php:

  create_manual_booking():
    - BEFORE the $wpdb->insert() call:
      do_action( 'bookit_before_booking_created', $booking_data );
      (where $booking_data is the array being inserted)
    - AFTER successful insert (after you have $booking_id):
      do_action( 'bookit_after_booking_created', $booking_id, $booking_data );

  update_booking():
    - BEFORE the update query, fetch current booking data into $old_data.
      BEFORE the update:
      do_action( 'bookit_before_booking_updated', $booking_id, $old_data, $new_data );
    - AFTER successful update:
      do_action( 'bookit_after_booking_updated', $booking_id, $new_data );

  cancel_booking() (or whichever method handles cancellation — read the file):
    - BEFORE cancel:
      do_action( 'bookit_before_booking_cancelled', $booking_id, $booking_data );
    - AFTER successful cancel:
      do_action( 'bookit_after_booking_cancelled', $booking_id, $booking_data );

Also add bookit_after_booking_created to the PUBLIC booking wizard path:

In class-wizard-api.php (or wherever bookings are created from the public
booking flow — read the file to find the correct method):
    - AFTER successful booking insert:
      do_action( 'bookit_after_booking_created', $booking_id, $booking_data );

In the Stripe webhook handler (wherever booking creation happens after payment
confirmation — read the file):
    - AFTER payment confirmed and booking created:
      do_action( 'bookit_after_payment_completed', $booking_id, $payment_data );
      ($payment_data should include: amount, currency, payment_intent_id, method)

For customer creation — find where new customers are inserted (likely in the
wizard API or a customer model):
    - AFTER successful customer insert:
      do_action( 'bookit_after_customer_created', $customer_id, $customer_data );

In admin/class-bookit-admin.php (or wherever the dashboard HTML page is served):
    - When the dashboard page is output (in the method that renders the dashboard):
      $current_user = Bookit_Auth::get_current_user(); // or equivalent
      do_action( 'bookit_dashboard_loaded', $current_user );

───────────────────────────────────────────────────────────────────────────────
STEP 6: Filter hooks — add apply_filters() calls
───────────────────────────────────────────────────────────────────────────────
In includes/models/class-datetime-model.php:

  In the method that returns available slots (read file to find exact method name):
    AFTER calculating $slots, BEFORE returning:
    $slots = apply_filters( 'bookit_available_slots', $slots, $staff_id, $date, $service_id );
    return $slots;

In class-dashboard-bookings-api.php (or booking model):

  create_manual_booking() — BEFORE the insert, AFTER building $booking_data:
    $booking_data = apply_filters( 'bookit_booking_data_before_insert', $booking_data );
  
  (Apply this same filter in the wizard/public booking path too.)

  In the method that builds a single booking's API response (the method called
  by get_booking_details() and also used in list responses):
    BEFORE returning $response:
    $response = apply_filters( 'bookit_booking_response', $response, $booking_id );
    return $response;

In admin/class-bookit-admin.php (or wherever window.bookitDashboard JS data
is built and passed to the Vue app — read the file):
    $js_data = [ /* existing data */ ];
    $js_data = apply_filters( 'bookit_dashboard_js_data', $js_data );
    // then wp_localize_script() or wp_add_inline_script() with $js_data

───────────────────────────────────────────────────────────────────────────────
STEP 7: Active Extensions section in Settings UI
───────────────────────────────────────────────────────────────────────────────
Read the existing Settings Vue page/component structure before implementing.
Find where settings tabs/sections are defined and follow the same pattern.

Add a new section or tab called "Extensions" to the Settings page. It should:

- Fetch GET /wp-json/bookit/v1/extensions on mount
- Show a simple read-only list when extensions are registered:
  Each extension: name (bold), version, description, author
  Include a compatibility indicator (green = compatible, since incompatible
  extensions are rejected at registration time, all shown are compatible)
- Show an empty state when no extensions are registered:
  "No extensions installed. Extensions add features like recurring appointments
  and group bookings."
- This section is visible to bookit_admin role only (check the role in the
  component's route guard or permission check — follow existing pattern)

Do not add fake/placeholder extension data. The empty state is correct for now.

CODING STANDARDS
================
- WordPress Coding Standards throughout
- All do_action() and apply_filters() calls must have inline comments
  explaining what they are for, e.g.:
  // Allow extensions to modify available slots (e.g. Bookit Classes).
  $slots = apply_filters( 'bookit_available_slots', $slots, $staff_id, $date, $service_id );
- Follow existing file and class naming conventions exactly
- No changes to existing method signatures
- Vue component follows existing component patterns (Options API or
  Composition API — match whatever the existing Settings page uses)
```

---

**Testing checklist for Task 1:**
- [ ] `bookit_register_extension()` returns `WP_Error` when `requires_core` exceeds current plugin version
- [ ] `bookit_register_extension()` stores valid extension in registry
- [ ] Duplicate slug returns `WP_Error`
- [ ] `GET /wp-json/bookit/v1/extensions` returns empty arrays when nothing registered
- [ ] `bookit_register_nav_item()` entries appear in the endpoint response
- [ ] `bookit_after_booking_created` fires when a manual booking is created (add a temporary `add_action()` in functions.php to verify, then remove it)
- [ ] `bookit_available_slots` filter is applied and its return value used
- [ ] Vue sidebar renders no extension section when API returns empty nav_items
- [ ] Settings page shows Extensions section with empty state

When done, come back with any issues encountered and I'll provide the git commit message and Task 2.


Sure. Here's a detailed walkthrough for each test.

---

### 1. `bookit_register_extension()` returns `WP_Error` when `requires_core` exceeds current version

**How:** Open your Local site's `wp-config.php` or use a throwaway snippet. In WordPress admin go to **Tools → Theme File Editor** (or use a plugin like **Code Snippets**) and add this temporarily:

```php
add_action( 'init', function() {
    $result = bookit_register_extension( [
        'name'          => 'Test Extension',
        'slug'          => 'test-ext',
        'version'       => '1.0.0',
        'requires_core' => '99.0.0',
    ] );
    if ( is_wp_error( $result ) ) {
        error_log( 'BOOKIT TEST PASS: ' . $result->get_error_code() . ' — ' . $result->get_error_message() );
    } else {
        error_log( 'BOOKIT TEST FAIL: expected WP_Error, got true' );
    }
} );
```

**What to expect:** In `wp-content/debug.log` you should see:
```
BOOKIT TEST PASS: bookit_version_incompatible — Bookit Test Extension requires Bookit core version 99.0.0 or higher. Current version: 1.0.0
```

Remove the snippet after confirming.

---

### 2. `bookit_register_extension()` stores a valid extension

**How:** Same approach, but with a valid `requires_core`:

```php
add_action( 'init', function() {
    $result = bookit_register_extension( [
        'name'          => 'Test Extension',
        'slug'          => 'test-ext',
        'version'       => '1.0.0',
        'requires_core' => '1.0.0',
    ] );
    error_log( is_wp_error( $result ) ? 'BOOKIT TEST FAIL' : 'BOOKIT TEST PASS: extension registered' );
} );
```

**What to expect:**
```
BOOKIT TEST PASS: extension registered
```

---

### 3. Duplicate slug returns `WP_Error`

**How:** Register the same slug twice in the same snippet:

```php
add_action( 'init', function() {
    bookit_register_extension( [
        'name'          => 'Test Extension',
        'slug'          => 'test-ext',
        'version'       => '1.0.0',
        'requires_core' => '1.0.0',
    ] );
    $result = bookit_register_extension( [
        'name'          => 'Test Extension Duplicate',
        'slug'          => 'test-ext',
        'version'       => '1.0.0',
        'requires_core' => '1.0.0',
    ] );
    if ( is_wp_error( $result ) && $result->get_error_code() === 'bookit_duplicate_slug' ) {
        error_log( 'BOOKIT TEST PASS: duplicate slug rejected' );
    } else {
        error_log( 'BOOKIT TEST FAIL: expected bookit_duplicate_slug WP_Error' );
    }
} );
```

**What to expect:**
```
BOOKIT TEST PASS: duplicate slug rejected
```

---

### 4. `GET /wp-json/bookit/v1/extensions` returns empty arrays

**How:** With no extensions registered, open your browser or Postman and hit the endpoint. You need to be logged into the dashboard first (the endpoint requires a valid session). The easiest way is to log into your dashboard in the browser, then in the same browser open a new tab and visit:

```
https://your-local-site.local/wp-json/bookit/v1/extensions
```

**What to expect:**
```json
{
  "extensions": [],
  "nav_items": []
}
```

---

### 5. `bookit_register_nav_item()` entries appear in the endpoint response

**How:** Add a snippet that registers an extension and a nav item, then hit the endpoint again:

```php
add_action( 'plugins_loaded', function() {
    bookit_register_extension( [
        'name'          => 'Test Extension',
        'slug'          => 'test-ext',
        'version'       => '1.0.0',
        'requires_core' => '1.0.0',
    ] );
    bookit_register_nav_item( [
        'label'    => 'Test Page',
        'route'    => '/bookit-dashboard/app/test',
        'icon'     => 'calendar',
        'position' => 50,
        'slug'     => 'test-ext',
    ] );
}, 5 );
```

Then visit the endpoint URL again.

**What to expect:**
```json
{
  "extensions": [
    {
      "name": "Test Extension",
      "slug": "test-ext",
      "version": "1.0.0",
      "requires_core": "1.0.0",
      "description": "",
      "author": ""
    }
  ],
  "nav_items": [
    {
      "label": "Test Page",
      "route": "/bookit-dashboard/app/test",
      "icon": "calendar",
      "position": 50,
      "capability": "bookit_manage_all",
      "slug": "test-ext"
    }
  ]
}
```

Remove the snippet after confirming.

---

### 6. `bookit_after_booking_created` fires when a booking is created

**How:** Add a listener in a snippet, then create a manual booking through the dashboard UI:

```php
add_action( 'bookit_after_booking_created', function( $booking_id, $booking_data ) {
    error_log( 'BOOKIT TEST PASS: bookit_after_booking_created fired. Booking ID: ' . $booking_id );
}, 10, 2 );
```

Then go to your dashboard, create a manual booking as you normally would, and submit it.

**What to expect in debug.log:**
```
BOOKIT TEST PASS: bookit_after_booking_created fired. Booking ID: 42
```
(The ID will be whatever the new booking's ID is.)

Remove the snippet after confirming.

---

### 7. `bookit_available_slots` filter is applied and its return value used

**How:** Add a filter that empties all slots, then try to pick a date in the public booking widget and verify no slots appear:

```php
add_filter( 'bookit_available_slots', function( $slots, $staff_id, $date, $service_id ) {
    error_log( 'BOOKIT TEST: bookit_available_slots filter fired. Slot count before: ' . count( $slots ) );
    return []; // Return empty to prove the filter result is used
}, 10, 4 );
```

Then open the public booking page on your local site, select a service and staff member, and pick a date that would normally show available slots.

**What to expect:**
- No time slots appear on the booking page (proving the filtered empty array was used)
- In debug.log: `BOOKIT TEST: bookit_available_slots filter fired. Slot count before: 8` (or however many slots there were)

Remove the snippet after confirming — otherwise no slots will show for anyone.

---

### 8. Vue sidebar renders no extension section when nav_items is empty

**How:** No snippet needed for this one. With no extensions registered (after removing the snippets from test 5), log into your dashboard and look at the sidebar.

**What to expect:** No "Extensions" section or extension nav items appear in the sidebar. The sidebar looks exactly as it did before Sprint 4B.

---

### 9. Settings page shows Extensions section with empty state

**How:** Log into your dashboard, go to Settings, and look for the Extensions tab or section.

**What to expect:** An "Extensions" section is visible showing the empty state message: *"No extensions installed. Extensions add features like recurring appointments and group bookings."*

If you want to also verify the populated state, temporarily add the registration snippet from test 5, reload the Settings page, and confirm the test extension appears in the list. Then remove the snippet.