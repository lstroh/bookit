Here is the Task 7 Cursor prompt.

---

### Cursor Prompt — Task 7: Centralised Error Message System

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
Currently error strings are scattered across REST API controllers as ad-hoc
hardcoded strings. This task introduces a registry-based error system that
separates user-facing messages from technical log messages, makes errors
translatable, and standardises the error response shape across all API
endpoints.

Read these files before making any changes:
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (find existing WP_Error usage — error codes and messages currently used)
- bookit-booking-system/includes/api/class-audit-log-api.php
  (find the existing permission error — replace with registry)
- bookit-booking-system/includes/api/class-extensions-api.php
  (same — find existing WP_Error usage)
- bookit-booking-system/includes/class-bookit-auth.php
  (find login failure and session errors)
- bookit-booking-system/dashboard/src/ — find the API service layer or
  composable that handles API calls (likely useApi.js or api.js) to
  understand how errors are currently surfaced to the user in Vue

Do not guess at existing error strings or codes. Read the actual files first.

YOUR TASK
=========
Implement the centralised error message system in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Bookit_Error_Registry class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/class-bookit-error-registry.php

class Bookit_Error_Registry {

    /**
     * Static registry of error definitions.
     * Keyed by error code string.
     *
     * @var array<string, array>
     */
    private static array $errors = [];

    /**
     * Register a custom error code.
     * Extensions must prefix their codes with their slug
     * (e.g. 'RECURRING_E001').
     *
     * @param string $code       Unique error code (e.g. 'E1001').
     * @param array  $definition {
     *   @type string $user_message  Translatable user-facing message.
     *                               Supports {placeholder} substitution.
     *   @type string $log_message   Technical message for logs (not shown to user).
     *   @type int    $http_status   HTTP status code.
     *   @type string $category      One of: auth, booking, payment, validation, system.
     * }
     * @return void
     */
    public static function register( string $code, array $definition ): void {
        // Do not allow overwriting core error codes with extension codes.
        // If the code already exists and was registered by core (no prefix),
        // silently ignore the re-registration attempt.
        if ( isset( self::$errors[ $code ] ) ) {
            return;
        }
        self::$errors[ $code ] = $definition;
    }

    /**
     * Get an error definition by code.
     * Returns a default system error if code not found.
     *
     * @param string $code Error code.
     * @return array
     */
    public static function get( string $code ): array {
        return self::$errors[ $code ] ?? self::$errors['E9999'];
    }

    /**
     * Create a WP_Error from a registry code.
     *
     * Substitutes {placeholder} values from $context into user_message.
     * Example: user_message = 'Booking {booking_id} not found'
     *          context = ['booking_id' => 42]
     *          Result:  'Booking 42 not found'
     *
     * @param string $code    Error code.
     * @param array  $context Placeholder values for message substitution.
     * @return WP_Error
     */
    public static function to_wp_error( string $code, array $context = [] ): WP_Error {
        $definition = self::get( $code );
        $message    = $definition['user_message'];

        // Substitute {placeholder} values.
        foreach ( $context as $key => $value ) {
            $message = str_replace( '{' . $key . '}', (string) $value, $message );
        }

        return new WP_Error(
            $code,
            $message,
            array( 'status' => $definition['http_status'] )
        );
    }

    /**
     * Return all registered error definitions (for debugging/documentation).
     *
     * @return array
     */
    public static function all(): array {
        return self::$errors;
    }
}

───────────────────────────────────────────────────────────────────────────────
STEP 2: Error code definitions
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/config/error-codes.php

This file calls Bookit_Error_Registry::register() for every core error code.
It is loaded once during plugin initialisation.

Register the following error codes. All user_message strings must be wrapped
in __( 'Message', 'bookit-booking-system' ).

AUTH category:
  E1001  http_status: 401
         user_message: 'Login failed. Please check your email and password.'
         log_message:  'Authentication failed for email: {email}'

  E1002  http_status: 401
         user_message: 'Your session has expired. Please log in again.'
         log_message:  'Session expired or not found'

  E1003  http_status: 403
         user_message: 'You do not have permission to perform this action.'
         log_message:  'Insufficient permissions. Required: {required_role}, actual: {actual_role}'

BOOKING category:
  E2001  http_status: 409
         user_message: 'Sorry, that time slot is no longer available. Please choose another time.'
         log_message:  'Slot unavailable: staff {staff_id} on {date} at {time}'

  E2002  http_status: 404
         user_message: 'Booking not found.'
         log_message:  'Booking ID {booking_id} not found'

  E2003  http_status: 422
         user_message: 'This booking cannot be modified because it has already been completed.'
         log_message:  'Attempted to modify completed booking ID {booking_id}'

  E2004  http_status: 409
         user_message: 'This booking was just updated by someone else. The latest version has been loaded — please review and save again.'
         log_message:  'Optimistic lock conflict on booking ID {booking_id}'

PAYMENT category:
  E3001  http_status: 402
         user_message: 'Payment failed. Please try again or use a different payment method.'
         log_message:  'Payment failed: {gateway_message}'

  E3002  http_status: 422
         user_message: 'A refund is not available for this booking.'
         log_message:  'Refund not available for booking ID {booking_id}: {reason}'

  E3003  http_status: 502
         user_message: 'There was a problem connecting to the payment provider. Please try again shortly.'
         log_message:  'Payment gateway error: {gateway_message}'

VALIDATION category:
  E4001  http_status: 422
         user_message: 'Please fill in all required fields.'
         log_message:  'Required field missing: {field}'

  E4002  http_status: 422
         user_message: 'Please enter a valid email address.'
         log_message:  'Invalid email: {email}'

  E4003  http_status: 422
         user_message: 'Please enter a valid date.'
         log_message:  'Invalid date: {date}'

  E4004  http_status: 422
         user_message: 'Bookings cannot be made in the past.'
         log_message:  'Date in past: {date}'

  E4005  http_status: 404
         user_message: 'The selected service could not be found.'
         log_message:  'Service ID {service_id} not found'

  E4006  http_status: 404
         user_message: 'The selected staff member could not be found.'
         log_message:  'Staff ID {staff_id} not found'

SYSTEM category:
  E9001  http_status: 500
         user_message: 'A database error occurred. Please try again.'
         log_message:  'Database error: {db_error}'

  E9002  http_status: 500
         user_message: 'An unexpected error occurred. Please try again.'
         log_message:  'Unexpected error: {error}'

  E9999  http_status: 500
         user_message: 'An unexpected error occurred. Please try again.'
         log_message:  'Unknown error code used'
         (This is the fallback returned by get() when a code is not found)

───────────────────────────────────────────────────────────────────────────────
STEP 3: Load registry in class-bookit-loader.php
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-loader.php

In load_dependencies(), add near the top (before API classes):
    require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-error-registry.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/config/error-codes.php';

───────────────────────────────────────────────────────────────────────────────
STEP 4: Replace error strings in existing controllers
───────────────────────────────────────────────────────────────────────────────
Do NOT attempt to replace every WP_Error in the codebase. Focus only on
these high-traffic paths. Read each file carefully before editing.

In class-bookit-auth.php (or wherever login is handled):
  Replace the login failure WP_Error with:
    return Bookit_Error_Registry::to_wp_error( 'E1001' );
  Replace the session expired/not found WP_Error with:
    return Bookit_Error_Registry::to_wp_error( 'E1002' );

In class-dashboard-bookings-api.php:
  Replace the slot unavailable error (in booking creation, where availability
  is checked before insert) with:
    return Bookit_Error_Registry::to_wp_error( 'E2001', [
        'staff_id' => $staff_id,
        'date'     => $booking_date,
        'time'     => $booking_time,
    ] );
  Replace booking not found errors with:
    return Bookit_Error_Registry::to_wp_error( 'E2002', [ 'booking_id' => $id ] );

In class-audit-log-api.php:
  Replace the existing permission WP_Error with:
    return Bookit_Error_Registry::to_wp_error( 'E1003' );

In class-extensions-api.php:
  Replace any permission WP_Error with:
    return Bookit_Error_Registry::to_wp_error( 'E1003' );

For all other existing WP_Error instances not listed above: leave them
unchanged. Do not do a bulk replacement. The pattern is now established
for future tasks to follow.

───────────────────────────────────────────────────────────────────────────────
STEP 5: Update Vue API error handling
───────────────────────────────────────────────────────────────────────────────
Read the Vue API service layer (useApi.js or equivalent) before editing.
Find where API errors are caught and surfaced to the user.

The WP REST API returns errors in this shape:
  {
    "code": "E2001",
    "message": "Sorry, that time slot is no longer available...",
    "data": { "status": 409 }
  }

Update the error handling in the API composable/service so that when a
request fails:
1. Extract error.response.data.message if present
2. Fall back to a generic 'Something went wrong. Please try again.' if not

This ensures the user always sees the registry user_message rather than a
raw axios error or a hardcoded Vue string.

If there are specific places in Vue components where booking errors are
displayed with hardcoded strings (e.g. 'This slot is not available' written
directly in the component), replace those with the API-provided message.
Read the booking creation flow components to find these. Do not change
error handling in components where the API message is already being used.

CODING STANDARDS
================
- WordPress Coding Standards throughout
- All user_message strings wrapped in __( 'string', 'bookit-booking-system' )
- No dynamic SQL — this task has no DB changes
- Type hints on all new methods (PHP 8.0)
- Vue changes follow existing patterns
```

---

**Testing checklist for Task 7:**

- [ ] `Bookit_Error_Registry::get('E1001')` returns the correct definition — verify with a temporary snippet:
  ```php
  add_action( 'init', function() {
      $def = Bookit_Error_Registry::get( 'E1001' );
      error_log( 'BOOKIT TEST: ' . print_r( $def, true ) );
  } );
  ```
  Check `debug.log` for the definition array.
- [ ] `Bookit_Error_Registry::to_wp_error('E2002', ['booking_id' => 99])` returns a `WP_Error` with message containing `99` — test with same snippet approach
- [ ] Placeholder substitution works — `{booking_id}` replaced with context value (confirmed by above test)
- [ ] Extension can register a custom error code — test with a snippet calling `Bookit_Error_Registry::register('MYEXT_E001', [...])` then `get('MYEXT_E001')`
- [ ] Attempting to book an unavailable slot returns `E2001` code in the API response — check Network tab in browser when triggering a slot conflict
- [ ] Login with wrong password returns `E1001` in the response — check Network tab on login page
- [ ] Vue displays the API-provided message on booking failure (not a hardcoded string)
- [ ] All `user_message` strings are wrapped in `__()` — scan the error-codes.php file visually to confirm

When done, let me know and I'll provide the git commit and Task 3 prompt.



Good — the first test confirms the registry is working correctly. Let me walk through each remaining check.

---

### `to_wp_error` with placeholder substitution + custom extension code

Do both in one snippet:

```php
add_action( 'init', function() {
    // Test to_wp_error with placeholder substitution.
    $error = Bookit_Error_Registry::to_wp_error( 'E2002', [ 'booking_id' => 99 ] );
    if ( is_wp_error( $error ) ) {
        $msg = $error->get_error_message();
        if ( strpos( $msg, '99' ) !== false ) {
            error_log( 'BOOKIT TEST PASS: placeholder substituted. Message: ' . $msg );
        } else {
            error_log( 'BOOKIT TEST FAIL: placeholder not substituted. Message: ' . $msg );
        }
    } else {
        error_log( 'BOOKIT TEST FAIL: to_wp_error did not return WP_Error' );
    }

    // Test extension error code registration.
    Bookit_Error_Registry::register( 'MYEXT_E001', [
        'user_message' => 'My extension error.',
        'log_message'  => 'Extension error occurred.',
        'http_status'  => 400,
        'category'     => 'system',
    ] );
    $def = Bookit_Error_Registry::get( 'MYEXT_E001' );
    if ( isset( $def['user_message'] ) && $def['user_message'] === 'My extension error.' ) {
        error_log( 'BOOKIT TEST PASS: custom extension code registered and retrieved' );
    } else {
        error_log( 'BOOKIT TEST FAIL: custom extension code not found' );
    }
} );
```

Check `debug.log` for both PASS lines, then remove the snippet.

---

### Slot unavailable returns E2001 in Network tab

1. Open your dashboard in Chrome and go to create a manual booking
2. Open Chrome DevTools → Network tab
3. Pick a staff member, date, and time slot
4. Before submitting, go to phpMyAdmin and manually insert a booking for that same staff member, date, and time (to make the slot conflict)
5. Submit the booking in the dashboard
6. In the Network tab, find the POST request to `/wp-json/bookit/v1/dashboard/bookings/create`
7. Click it and look at the Response tab

You should see:
```json
{
  "code": "E2001",
  "message": "Sorry, that time slot is no longer available. Please choose another time.",
  "data": { "status": 409 }
}
```

---

### Vue displays API-provided message on booking failure

This is confirmed at the same time as the above test — when the 409 comes back, look at what the dashboard shows the user on screen. It should show the message from the API response, not a hardcoded string like "This slot is not available".

---

### All user_message strings wrapped in `__()`

Open `bookit-booking-system/includes/config/error-codes.php` in your code editor and visually scan every `user_message` line. Each one should look like:

```php
'user_message' => __( 'Login failed. Please check your email and password.', 'bookit-booking-system' ),
```

Not like:

```php
'user_message' => 'Login failed. Please check your email and password.',
```

No snippet needed — just a visual check of the file.

---

### Login with wrong password — Network tab

The reason you can see the error on screen but not in the Network tab is likely that the login form is on a separate page and the Network tab was not open before you submitted. The Network tab only captures requests made while it is open.

Try this:

1. Log out of the dashboard
2. Open Chrome DevTools → Network tab **before** going to the login page
3. Navigate to the login page
4. Enter a wrong password and submit
5. In the Network tab, find the POST request to `/wp-json/bookit/v1/auth/login` (or similar)
6. Click it → Response tab

You should see:
```json
{
  "code": "E1001",
  "message": "Login failed. Please check your email and password.",
  "data": { "status": 401 }
}
```

The key is to have the Network tab open **before** submitting the form, not after.