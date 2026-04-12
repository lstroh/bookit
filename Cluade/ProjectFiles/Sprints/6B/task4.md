935 tests, 0 failures — Task 3 is complete. Here is the Task 4 Cursor prompt:

---

# TASK 4 OF 8: OAuth Connect/Disconnect Flow (Per Staff)
**Sprint: 6B-1 | Est: 3h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/MyProfile.vue` — full file; identify the existing card pattern and where to insert the new Google Calendar section
2. `includes/api/class-dashboard-bookings-api.php` — full file; read the existing REST route registration pattern, `get_profile()` response shape, and `is_authenticated()` usage
3. `includes/class-bookit-auth.php` — read `is_authenticated()` and the session/nonce pattern used for dashboard-authenticated endpoints
4. `includes/integrations/` — check whether this directory exists; if not, it will need to be created
5. `includes/class-bookit-loader.php` — identify where new `::init()` calls are registered
6. `includes/class-bookit-audit-logger.php` — read the `log()` method signature

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task delivers the per-staff Google Calendar OAuth connect/disconnect flow. Staff connect their own Google account via My Profile. Three new REST endpoints handle the auth URL generation, the OAuth callback from Google, and disconnection. The existing `GET profile` response is extended to include connection status. All token storage uses `Bookit_Encryption` (created in this task). This task has no Vue build dependency on Task 5 — the UI can be built and tested independently.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/utils/class-bookit-encryption.php` — CREATE

- New helper class `Bookit_Encryption`
- Two public static methods only:
  - `encrypt( string $value ): string`
  - `decrypt( string $encrypted ): string`
- Algorithm: `AES-256-CBC`
- Key derivation: use `wp_salt('auth')` as the basis for the encryption key — hash it with `hash('sha256', wp_salt('auth'), true)` to produce a 32-byte key
- IV: generate with `openssl_random_pseudo_bytes(16)` on encrypt; store prepended to the ciphertext (first 16 bytes = IV, remainder = ciphertext); split on decrypt
- Store result as base64-encoded string
- `decrypt()` must return empty string on failure (malformed input, wrong key) — never throw
- No external dependencies

### `includes/integrations/class-bookit-google-calendar-api.php` — CREATE

New class `Bookit_Google_Calendar_Api` — handles OAuth flow only (not event sync — that is Task 5 and 7).

Public static methods:

`get_auth_url( int $staff_id ): string`
- Instantiate `Google\Client` with Client ID and Secret from `wp_bookings_settings` (read via `$wpdb->get_var()` — `bookit_get_setting()` does not exist)
- Set redirect URI: `https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/google-calendar/callback`
- Add scope: `Google\Service\Calendar::CALENDAR_EVENTS`
- Set access type: `offline`
- Set prompt: `consent` (forces refresh token to be issued every time)
- Set state: `wp_create_nonce('google_oauth_' . $staff_id)` with staff_id appended — format: `{nonce}:{staff_id}`
- Return the auth URL string

`handle_callback( string $code, string $state ): int`
- Parse staff_id from state parameter (format: `{nonce}:{staff_id}`)
- Verify nonce: `wp_verify_nonce($nonce, 'google_oauth_' . $staff_id)` — return 0 on failure
- Exchange code for tokens using `$client->fetchAccessTokenWithAuthCode($code)`
- On error in token response: log via `Bookit_Audit_Logger::log('google_calendar.oauth_failed', ...)` and return 0
- Extract: `access_token`, `refresh_token`, `expires_in`
- Compute expiry: `date('Y-m-d H:i:s', time() + $token['expires_in'])`
- Fetch connected Google account email using `Google\Service\Oauth2` — store in `google_calendar_email`
- Encrypt `access_token` and `refresh_token` via `Bookit_Encryption::encrypt()`
- Write all five columns to `wp_bookings_staff` for the given staff_id
- Set `google_calendar_connected = 1`
- Log via `Bookit_Audit_Logger::log('google_calendar.connected', ['staff_id' => $staff_id])`
- Return staff_id on success

`disconnect( int $staff_id ): void`
- Clear `google_oauth_access_token`, `google_oauth_refresh_token`, `google_oauth_token_expiry`, `google_calendar_email` to NULL
- Set `google_calendar_connected = 0`
- Log via `Bookit_Audit_Logger::log('google_calendar.disconnected', ['staff_id' => $staff_id])`

> **Note:** Before implementing any `Google\Client` method calls, use Context7
> to resolve `google-api-php-client` and confirm:
> - `fetchAccessTokenWithAuthCode()` return shape
> - How to fetch the authenticated user's email (Oauth2 service or tokeninfo)
> - `Google\Service\Calendar::CALENDAR_EVENTS` constant name

### `includes/api/class-bookit-google-calendar-rest-controller.php` — CREATE

New REST controller class `Bookit_Google_Calendar_Rest_Controller`. Follow the exact registration pattern from `class-dashboard-bookings-api.php`.

Register three routes in `register_routes()`:

**Route 1:** `GET bookit/v1/google-calendar/auth-url`
- Permission: `is_authenticated()` (dashboard session required)
- Handler: calls `Bookit_Google_Calendar_Api::get_auth_url( $staff_id )` where `$staff_id` is the currently authenticated staff member
- Returns: `{ "url": "https://accounts.google.com/..." }`

**Route 2:** `GET bookit/v1/google-calendar/callback`
- Permission: `__return_true` (public — Google redirects here, no session)
- Handler: calls `Bookit_Google_Calendar_Api::handle_callback( $code, $state )`
- On success: `wp_redirect('/bookit-dashboard/app/profile?google_connected=1')` and `exit`
- On failure: `wp_redirect('/bookit-dashboard/app/profile?google_error=1')` and `exit`
- Do NOT return a JSON response — always redirect

**Route 3:** `POST bookit/v1/dashboard/profile/google-calendar/disconnect`
- Permission: `is_authenticated()` (dashboard session required)
- Handler: calls `Bookit_Google_Calendar_Api::disconnect( $staff_id )` for the authenticated staff member
- Returns: `{ "success": true }`

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

- Read the full file before modifying
- Extend the `get_profile()` response to include:
  ```json
  {
    "google_calendar_connected": true,
    "google_calendar_email": "sarah@gmail.com"
  }
  ```
- Read these two values from `wp_bookings_staff` for the current staff_id — `google_calendar_connected` (cast to bool) and `google_calendar_email`
- Do NOT modify any other part of this file

### `includes/class-bookit-loader.php` — MODIFY

- Read the full file first
- Register the new REST controller: `Bookit_Google_Calendar_Rest_Controller::init()` alongside other `::init()` calls
- Add the `require_once` for both new class files in the correct location

### `dashboard/src/views/MyProfile.vue` — MODIFY

- Read the full file first; identify the existing card pattern
- Add a new **Google Calendar** card below the existing profile sections
- Card content:

```
┌─────────────────────────────────────────┐
│ Google Calendar                         │
│ Sync your bookings to your Google       │
│ Calendar automatically                  │
├─────────────────────────────────────────┤
│  ● Connected (sarah@gmail.com)          │
│  [Disconnect]                           │
│                                         │
│  ○ Not connected                        │
│  [Connect Google Calendar]              │
└─────────────────────────────────────────┘
```

- On mount: read `google_calendar_connected` and `google_calendar_email` from the existing `GET bookit/v1/dashboard/profile` response (already extended above)
- On page load: check for `?google_connected=1` query param — if present, show a success banner: `"Google Calendar connected successfully"` and clear the param from the URL
- On page load: check for `?google_error=1` — if present, show an error banner: `"Google Calendar connection failed. Please try again."` and clear the param
- **Connect button**: calls `GET bookit/v1/google-calendar/auth-url`, then redirects the current tab to the returned URL (`window.location.href = url`)
- **Disconnect button**: calls `POST bookit/v1/dashboard/profile/google-calendar/disconnect`, then updates local state to show not-connected without a full page reload
- Follow existing loading state and error handling patterns from MyProfile.vue

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] `Bookit_Encryption` class created in `includes/utils/`
- [ ] `Bookit_Google_Calendar_Api` class created in `includes/integrations/`
- [ ] `Bookit_Google_Calendar_Rest_Controller` created in `includes/api/`
- [ ] All three classes `require_once`'d in `class-bookit-loader.php`
- [ ] REST routes registered via `Bookit_Google_Calendar_Rest_Controller::init()`
- [ ] Audit log fired on: `google_calendar.connected`, `google_calendar.disconnected`, `google_calendar.oauth_failed`
- [ ] Tokens stored encrypted — never plain text

---

## PHPUNIT REQUIREMENTS

Baseline: **935 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-oauth.php`

Required test cases:
- `test_auth_url_endpoint_requires_authentication` — unauthenticated request to `auth-url` endpoint returns 401/403
- `test_callback_validates_state_nonce` — invalid state nonce causes `handle_callback()` to return 0
- `test_callback_stores_encrypted_tokens` — mock token exchange; assert stored `google_oauth_access_token` is not equal to the raw token (i.e. it is encrypted)
- `test_disconnect_clears_token_columns` — call `disconnect()`, assert all token columns are NULL and `google_calendar_connected = 0`
- `test_encryption_round_trip` — `decrypt(encrypt($value)) === $value`
- `test_get_profile_includes_google_calendar_fields` — assert `get_profile()` response contains `google_calendar_connected` and `google_calendar_email`

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking this task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Staff can click "Connect Google Calendar" in My Profile and are redirected to Google's consent screen
- [ ] After granting permission, staff are redirected back to My Profile with a success banner
- [ ] My Profile shows connected status and the connected Google account email
- [ ] Staff can disconnect their Google Calendar from My Profile
- [ ] Disconnect clears all token columns and updates the UI without a page reload
- [ ] `?google_error=1` query param shows an error banner

### Technical
- [ ] OAuth tokens are encrypted in the database — never stored in plain text
- [ ] State nonce validated on callback — invalid nonce is rejected
- [ ] Callback endpoint is public (no auth) — all other endpoints require dashboard session
- [ ] `get_profile()` response includes `google_calendar_connected` and `google_calendar_email`
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (935+ tests, 0 failures)

### Must NOT break
- [ ] Existing `get_profile()` fields still present in response
- [ ] Existing My Profile UI unaffected
- [ ] All existing REST endpoints unaffected

---

## FRONTEND BUILD

After implementation, run:
```bash
npm run build
```
in `bookit-booking-system/dashboard/`

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 4: Google Calendar OAuth connect/disconnect flow

- class-bookit-encryption.php: AES-256-CBC encrypt/decrypt helper
- class-bookit-google-calendar-api.php: get_auth_url, handle_callback, disconnect
- class-bookit-google-calendar-rest-controller.php: auth-url, callback, disconnect endpoints
- class-dashboard-bookings-api.php: extend get_profile with google_calendar fields
- class-bookit-loader.php: register new classes and routes
- MyProfile.vue: Google Calendar connect/disconnect card

Tests: 935+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**