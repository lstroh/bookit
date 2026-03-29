Cursor Prompt — Sprint Wizard-V2-Complete, Task 1 of 1
TASK 1 OF 1: V2 Wizard — complete booking REST endpoint + JS wiring
Sprint: Wizard-V2-Complete | Est: 3h | Plugin root: bookit-booking-system/

READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

includes/api/class-wizard-api.php — existing wizard API; you will add a new route here
includes/payment/class-payment-processor.php — process_pay_on_arrival() and process_use_package() already return { success, booking_id, redirect_url }; you will call these from the new endpoint
public/assets/js/booking-wizard-v2.js — initStep5() CTA handler currently calls window.location.reload() after posting to session; you will replace that reload with a call to the new endpoint
includes/class-csrf-protection.php — CSRF check pattern used by check_permission() in the wizard API; follow it exactly
includes/class-rate-limiter.php — rate limiter pattern used in process_payment(); apply the same pattern to the new endpoint
tests/unit/test-wizard-api.php — existing test patterns to follow

If any file does not exist, STOP and report back before proceeding.

CONTEXT
The V2 wizard CTA button on Step 5 currently saves the payment method to session then reloads the page. Nothing server-side triggers the payment processor on that reload, so the page just re-renders step 5. The fix is a new REST endpoint POST bookit/v1/wizard/complete that the JS calls instead of reloading. The endpoint reads the session, delegates to the existing process_pay_on_arrival() or process_use_package() methods, and returns a redirect_url. The JS then navigates to that URL. Stripe (card) is explicitly out of scope for this sprint — it requires live keys and belongs in Sprint 5.
Note: Before implementing the WordPress REST API endpoint, use Context7 to resolve WordPress REST API and confirm current register_rest_route and WP_REST_Response patterns.

IMPLEMENTATION REQUIREMENTS
includes/api/class-wizard-api.php — MODIFY
Read the file in full before touching it. Add a new route inside register_routes() alongside the existing /wizard/session route:
phpregister_rest_route(
    'bookit/v1',
    '/wizard/complete',
    array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => array( $this, 'complete_booking' ),
        'permission_callback' => array( $this, 'check_permission' ),
        'args'                => array(),
    )
);
Add the complete_booking() method to the class:
phppublic function complete_booking( $request ) {
    // Rate limiting — same pattern as process_payment().
    $ip = Bookit_Rate_Limiter::get_client_ip();
    if ( ! Bookit_Rate_Limiter::check( 'wizard_book', $ip, 10, HOUR_IN_SECONDS ) ) {
        return new WP_Error(
            'rate_limit_exceeded',
            __( 'Too many requests. Please wait before trying again.', 'bookit-booking-system' ),
            array( 'status' => 429 )
        );
    }

    require_once BOOKIT_PLUGIN_DIR . 'includes/core/class-session-manager.php';
    Bookit_Session_Manager::init();

    if ( Bookit_Session_Manager::is_expired() ) {
        return new WP_Error(
            'session_expired',
            __( 'Your session has expired. Please start again.', 'bookit-booking-system' ),
            array( 'status' => 400 )
        );
    }

    $session_data   = Bookit_Session_Manager::get_data();
    $payment_method = isset( $session_data['payment_method'] )
        ? sanitize_text_field( $session_data['payment_method'] )
        : '';

    if ( empty( $session_data ) ) {
        return new WP_Error(
            'invalid_session',
            __( 'No booking data found. Please start again.', 'bookit-booking-system' ),
            array( 'status' => 400 )
        );
    }

    require_once BOOKIT_PLUGIN_DIR . 'includes/payment/class-payment-processor.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/class-rate-limiter.php';
    $processor = new Booking_System_Payment_Processor();

    switch ( $payment_method ) {
        case 'pay_on_arrival':
        case 'person':
            $result = $processor->process_pay_on_arrival( $session_data );
            break;

        case 'use_package':
            // customer_package_id must be in session from Step 5 selection.
            $result = $processor->process_use_package( $session_data );
            break;

        case 'card':
        case 'stripe':
        case 'paypal':
            // Online payment methods require live environment — Sprint 5.
            return new WP_Error(
                'payment_method_not_available',
                __( 'Online payment is not yet available. Please select Pay in Person or use a package.', 'bookit-booking-system' ),
                array( 'status' => 400 )
            );

        default:
            return new WP_Error(
                'invalid_payment_method',
                __( 'Invalid payment method.', 'bookit-booking-system' ),
                array( 'status' => 400 )
            );
    }

    if ( is_wp_error( $result ) ) {
        return new WP_Error(
            $result->get_error_code(),
            $result->get_error_message(),
            array( 'status' => 400 )
        );
    }

    return rest_ensure_response( array(
        'success'      => true,
        'booking_id'   => $result['booking_id'],
        'redirect_url' => $result['redirect_url'],
    ) );
}
Important notes for Cursor:

process_pay_on_arrival() and process_use_package() are public methods — call them directly
Both already handle session clearing, email queuing, and V2 redirect URL construction
Do NOT duplicate any of that logic in complete_booking()
The V1 wizard uses admin_post_bookit_process_payment (form POST) — do not touch that handler


public/assets/js/booking-wizard-v2.js — MODIFY
Read the file in full before touching it.
Find initStep5(). The CTA click handler currently reads:
jsvar cta = document.getElementById( 'bookit-v2-cta-btn' );
if ( cta ) {
    cta.addEventListener( 'click', function() {
        var choice = getPaymentChoiceValue();
        postToSession( {
            current_step: 5,
            payment_method: choice
        } ).then( function() {
            window.location.reload();
        } );
    } );
}
Replace only the .then() callback — keep the postToSession call exactly as-is, since saving the payment method to session before calling complete is correct. Replace the .then() body with:
js.then( function() {
    var w = typeof bookitWizardV2 !== 'undefined' ? bookitWizardV2 : {};
    var btn = document.getElementById( 'bookit-v2-cta-btn' );
    if ( btn ) {
        btn.disabled = true;
        btn.textContent = 'Confirming\u2026';
    }
    return fetch( w.restUrl + 'bookit/v1/wizard/complete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': w.nonce,
            'X-Bookit-Nonce': w.bookingNonce
        },
        body: JSON.stringify( {} )
    } );
} )
.then( function( r ) { return r.json(); } )
.then( function( data ) {
    if ( data && data.success && data.redirect_url ) {
        window.location.href = data.redirect_url;
    } else {
        var msg = ( data && data.message ) ? data.message : 'Unable to complete booking. Please try again.';
        alert( msg );
        var btn = document.getElementById( 'bookit-v2-cta-btn' );
        if ( btn ) {
            btn.disabled = false;
            // Restore CTA label based on current payment choice.
            updateCtaLabel( getPaymentChoiceValue() );
        }
    }
} )
.catch( function() {
    alert( 'A network error occurred. Please try again.' );
    var btn = document.getElementById( 'bookit-v2-cta-btn' );
    if ( btn ) {
        btn.disabled = false;
        updateCtaLabel( getPaymentChoiceValue() );
    }
} );
```

**Two headers are sent:** `X-WP-Nonce` (for `wp_verify_nonce` in `check_permission`) and `X-Bookit-Nonce` (for `Bookit_CSRF_Protection`). Read `check_permission()` in `class-wizard-api.php` to confirm which header it reads — use exactly that.

**No other changes to `booking-wizard-v2.js`.** Do not touch any other step handlers.

---

### `tests/unit/test-wizard-api.php` — MODIFY

Read the file in full before touching it. Add the following test cases to the existing test class — do not create a new file:

- `test_complete_booking_endpoint_registered` — `bookit/v1/wizard/complete` route exists in `rest_get_server()->get_routes()`
- `test_complete_booking_returns_400_on_empty_session` — POST to `/bookit/v1/wizard/complete` with empty session returns 400
- `test_complete_booking_pay_on_arrival_returns_redirect_url` — seed session with full pay-on-arrival booking data (service, staff, date, time, customer fields, `payment_method = 'pay_on_arrival'`, `wizard_version = 'v2'`), POST to endpoint, assert 200, `success = true`, `redirect_url` contains `booking-confirmed`
- `test_complete_booking_card_returns_400` — seed session with `payment_method = 'card'`, assert 400 with `payment_method_not_available` error code
- `test_complete_booking_invalid_method_returns_400` — seed session with `payment_method = 'unknown'`, assert 400

Note: Before writing PHPUnit assertions, use Context7 to resolve `PHPUnit` and confirm `assertStringContainsString`, `assertEquals`, `assertArrayHasKey` API for PHPUnit 10.

---

## PHPUNIT REQUIREMENTS

Baseline: **808 tests, 0 failures** — must not regress.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking the task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Selecting "Pay in person" on Step 5 and clicking the CTA creates a booking and redirects to `/booking-confirmed-v2/?booking_id=X`
- [ ] Selecting "Use a package" on Step 5 and clicking the CTA redeems the package, creates a booking, and redirects to `/booking-confirmed-v2/?booking_id=X`
- [ ] Selecting "Pay by card" shows an error message — does not crash or reload
- [ ] CTA button shows "Confirming…" and is disabled while the request is in flight
- [ ] CTA button re-enables and label restores if the request fails
- [ ] Session is cleared after successful booking (handled by existing processor methods)
- [ ] V1 wizard pay-on-arrival flow still works via `admin-post.php` form POST — untouched

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Rate limiting applied to `POST bookit/v1/wizard/complete` (10 requests/hour per IP)
- [ ] CSRF check applied via existing `check_permission()` — no new auth logic
- [ ] `process_pay_on_arrival()` and `process_use_package()` called directly — no logic duplication
- [ ] PHPUnit suite passes (813+ tests, 0 failures)

### Must NOT break
- [ ] V1 wizard `admin_post_bookit_process_payment` handler untouched
- [ ] `POST bookit/v1/wizard/session` endpoint untouched
- [ ] All existing Step 1–4 JS handlers in `booking-wizard-v2.js` untouched

---

## GIT COMMIT MESSAGE
```
Sprint Wizard-V2-Complete, Task 1: V2 wizard booking submission

- Add POST bookit/v1/wizard/complete REST endpoint in class-wizard-api.php
- Delegates to existing process_pay_on_arrival() / process_use_package()
- Returns redirect_url; JS navigates instead of reloading
- Replace window.location.reload() in initStep5() CTA handler
- CTA disabled + "Confirming…" label during request; restores on error
- Card/PayPal return 400 (deferred to Sprint 5 live environment)
- 5 PHPUnit tests added to test-wizard-api.php

Tests: 813 passing, 0 failures

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.