That error means the callback endpoint ran but `handle_callback()` returned 0 — meaning it failed either on the nonce validation or the token exchange. 

The most likely cause is the **nonce**. WordPress nonces are tied to the user session, but the callback endpoint is public (no session) — so when Google redirects back, WordPress may not have the session context needed to verify the nonce.

Let me check this.Confirmed. The root cause is the **WordPress nonce**. `wp_verify_nonce()` requires the logged-in user's session to be present — but the callback endpoint is public and Google's redirect arrives with no WordPress session cookie. So the nonce check fails every time and `handle_callback()` returns 0.

This needs a fix in Cursor before anything else will work. Here is a targeted fix prompt:

---

# TASK 4 — HOTFIX: OAuth Callback Nonce Strategy
**Sprint: 6B-1 | Est: 30min | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/integrations/class-bookit-google-calendar-api.php` — full file; specifically `get_auth_url()` and `handle_callback()`
2. `includes/class-bookit-database.php` — confirm `wp_bookings_staff` table access pattern

If any file does not exist, stop and report back before proceeding.

---

## PROBLEM

`wp_verify_nonce()` requires the logged-in user's WordPress session to be present. The OAuth callback endpoint is public — Google redirects to it with no WordPress session cookie. This causes `wp_verify_nonce()` to always fail, `handle_callback()` to return 0, and the user to see the "connection failed" error.

---

## FIX

Replace the `wp_create_nonce()` / `wp_verify_nonce()` pattern in the state parameter with a **stateless HMAC signature** that does not depend on a user session.

### `includes/integrations/class-bookit-google-calendar-api.php` — MODIFY

**In `get_auth_url( int $staff_id )`:**

Replace:
```php
$state = wp_create_nonce('google_oauth_' . $staff_id) . ':' . $staff_id;
```

With a stateless HMAC approach:
```php
$token   = bin2hex( random_bytes( 16 ) );
$expires = time() + 600; // 10 minutes
$payload = $staff_id . ':' . $token . ':' . $expires;
$sig     = hash_hmac( 'sha256', $payload, wp_salt( 'auth' ) );
$state   = base64_encode( $payload . ':' . $sig );
```

**In `handle_callback( string $code, string $state )`:**

Replace the nonce parsing and `wp_verify_nonce()` call with:
```php
$decoded = base64_decode( $state );
if ( ! $decoded ) {
    // log and return 0
}

$parts = explode( ':', $decoded );
if ( count( $parts ) !== 4 ) {
    // log and return 0
}

[ $staff_id, $token, $expires, $received_sig ] = $parts;
$staff_id = (int) $staff_id;

// Check expiry
if ( time() > (int) $expires ) {
    Bookit_Audit_Logger::log( 'google_calendar.oauth_failed', 'staff', $staff_id, [ 'reason' => 'state_expired' ] );
    return 0;
}

// Verify signature
$payload      = $staff_id . ':' . $token . ':' . $expires;
$expected_sig = hash_hmac( 'sha256', $payload, wp_salt( 'auth' ) );

if ( ! hash_equals( $expected_sig, $received_sig ) ) {
    Bookit_Audit_Logger::log( 'google_calendar.oauth_failed', 'staff', $staff_id, [ 'reason' => 'invalid_state_sig' ] );
    return 0;
}
```

Use `hash_equals()` — not `===` — to prevent timing attacks.

**Everything else in `handle_callback()` stays unchanged** — only the state validation block is replaced.

---

## PHPUNIT REQUIREMENTS

Baseline: **941 tests, 0 failures** — must not regress.

Update `tests/unit/test-google-calendar-oauth.php`:

- `test_callback_validates_state_nonce` — update to test the HMAC strategy:
  - Valid state → returns staff_id (success path)
  - Tampered signature → returns 0
  - Expired state (set `$expires` to `time() - 1`) → returns 0
  - Malformed state (not base64, wrong part count) → returns 0

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking complete.

---

## ACCEPTANCE CRITERIA

- [ ] `get_auth_url()` generates an HMAC-signed base64 state parameter
- [ ] `handle_callback()` validates signature and expiry without any WordPress session
- [ ] Tampered or expired state is rejected and audit-logged
- [ ] `hash_equals()` used for signature comparison
- [ ] PHPUnit suite passes (941+ tests, 0 failures)
- [ ] OAuth connect flow completes successfully end-to-end on the live site

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 4 hotfix: replace wp_verify_nonce with stateless HMAC in OAuth callback

- get_auth_url: state = base64(staff_id:token:expires:hmac_sig)
- handle_callback: verify HMAC + expiry without requiring WordPress session
- test-google-calendar-oauth.php: updated state validation tests

Tests: 941+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**