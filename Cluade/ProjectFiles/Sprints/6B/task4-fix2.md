Good news and a clear diagnosis. Let me read the log:

- **Line 2 (first to run):** Callback received, state present, code present ✅ — the HMAC fix worked, all state validation passed
- **Line 1 (second to run):** Failed at `could_not_fetch_google_email` ❌ — the token exchange succeeded but the call to get the user's email address from Google failed

The OAuth flow itself is working. The only problem is the `wp_remote_get()` call to the Google userinfo endpoint. Let me check what's likely causing it.Context7 confirms a much better solution. The token response from `fetchAccessTokenWithAuthCode()` already contains an `id_token` with the user's email embedded — **no extra HTTP call to Google is needed at all**. This is why `wp_remote_get()` was fragile.

Here is a targeted fix prompt for Cursor:

---

# TASK 4 — HOTFIX 2: Fix email fetch using id_token
**Sprint: 6B-1 | Est: 20min | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THIS FILE

1. `includes/integrations/class-bookit-google-calendar-api.php` — full file; specifically the `fetch_google_account_email()` method and where it is called in `handle_callback()`

---

## PROBLEM

`fetch_google_account_email()` makes a `wp_remote_get()` call to the Google userinfo endpoint. This is failing on the live site — likely blocked by Wordfence or a server firewall rule on outbound requests to Google APIs from the callback context.

The token response from `fetchAccessTokenWithAuthCode()` already contains an `id_token` field which includes the user's email in its payload. No extra HTTP call is needed.

---

## FIX

### `includes/integrations/class-bookit-google-calendar-api.php` — MODIFY

Replace `fetch_google_account_email()` entirely. Instead of making a `wp_remote_get()` call, extract the email directly from the `id_token` that is already present in the `$token` array returned by `fetchAccessTokenWithAuthCode()`.

The `id_token` is a JWT — three base64url-encoded segments separated by `.`. The payload (middle segment) contains the user's email:

```php
private static function fetch_google_account_email( array $token ): string {
    try {
        if ( empty( $token['id_token'] ) ) {
            return '';
        }

        $parts = explode( '.', $token['id_token'] );
        if ( count( $parts ) !== 3 ) {
            return '';
        }

        // Base64url decode the payload (middle segment)
        $payload = base64_decode(
            str_replace( [ '-', '_' ], [ '+', '/' ], $parts[1] )
        );

        if ( ! $payload ) {
            return '';
        }

        $data = json_decode( $payload, true );

        return isset( $data['email'] ) ? sanitize_email( $data['email'] ) : '';

    } catch ( \Exception $e ) {
        return '';
    }
}
```

- Remove the `wp_remote_get()` call and all related code entirely
- The method signature changes from `fetch_google_account_email( string $access_token )` to `fetch_google_account_email( array $token )`
- Update the call site in `handle_callback()` accordingly — pass the full `$token` array instead of `$token['access_token']`
- If the email cannot be extracted, return empty string and continue — **do not return 0 or block the flow**. A missing email is non-fatal; the connection should still succeed

> **Note:** This approach is confirmed by Context7 — the `id_token` payload contains
> `email` when the `calendar.events` scope is granted alongside the standard OpenID
> Connect scopes. No additional scope is needed.

---

## PHPUNIT REQUIREMENTS

Baseline: **945 tests, 0 failures** — must not regress.

Update `tests/unit/test-google-calendar-oauth.php`:

- `test_email_extracted_from_id_token` — build a mock `id_token` JWT payload containing a known email, assert `fetch_google_account_email()` returns it correctly
- `test_missing_id_token_returns_empty_string` — pass token array without `id_token` key, assert empty string returned
- `test_could_not_fetch_email_does_not_block_connection` — assert that even when email extraction returns empty string, `handle_callback()` still completes successfully and sets `google_calendar_connected = 1`

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

- [ ] `fetch_google_account_email()` uses `id_token` JWT payload — no HTTP call
- [ ] Failed email extraction returns empty string — does not block the connection
- [ ] `wp_remote_get()` call removed entirely
- [ ] PHPUnit suite passes (945+ tests, 0 failures)
- [ ] OAuth connect flow completes successfully end-to-end on the live site
- [ ] My Profile shows Connected status and Gmail address after connecting

---

## CLEANUP — remove debug logging after this fix is confirmed working

Once the end-to-end flow succeeds on the live site, remove all `error_log()` debug lines added in the previous hotfix from `handle_callback()`. Also revert `WP_DEBUG` in `wp-config.php` to `false` on the live site.

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 4 hotfix 2: extract email from id_token JWT instead of wp_remote_get

- fetch_google_account_email: decode id_token payload, no outbound HTTP call
- handle_callback: email failure is non-fatal, connection proceeds regardless
- tests: id_token extraction, missing token, non-fatal email failure

Tests: 945+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**