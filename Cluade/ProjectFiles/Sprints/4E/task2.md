No manual testing needed for Task 1. The changes were purely server-side input validation and sanitisation — no UI changes, no new user-facing behaviour, no template changes (the template was already clean). PHPUnit covered the actual fixes. You're good to move straight to Task 2.

---

## TASK 2 OF 8: Rate Limiting — Public Endpoints (~8h)

Before writing the prompt I need to verify the current state of the CSRF protection class, since the sprint prompt says rate limiting may already exist there. Let me also pull the latest WordPress Transients API patterns — I already have these from Task 1 setup, so I'll go straight to the prompt.Good — confirmed: `class-csrf-protection.php` is pure CSRF/nonce handling with no rate limiting logic. Rate limiting needs to be built from scratch. Now generating the Task 2 prompt.

---

## TASK 2 OF 8: Rate Limiting — Public Endpoints (~8h)

```
TASK 2 OF 8: Rate Limiting — Public Endpoints
Sprint: 4E | Est: 8h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back before proceeding.

1. `includes/class-csrf-protection.php` — understand the class structure and static method patterns; the new `Bookit_Rate_Limiter` class must follow the same style
2. `includes/class-bookit-loader.php` — read the full file to understand how all classes are instantiated and wired; you will add the rate limiter require/instantiation here
3. `includes/class-bookit-error-registry.php` — read the `register()` method signature so you register E6001 correctly
4. `includes/config/error-codes.php` — read ALL existing codes and their format so E6001 follows the same pattern
5. `includes/class-bookit-audit-logger.php` — read the `log()` method signature; you will call it when a rate limit is exceeded
6. `includes/api/class-wizard-api.php` — this is the primary rate-limiting target for booking creation and the pattern reference for how public endpoints are structured
7. `includes/api/class-available-packages-api.php` — public endpoint added in Sprint 4D; needs rate limiting wired in
8. `includes/api/class-customer-package-lookup-api.php` — public endpoint added in Sprint 4D; needs rate limiting wired in
9. `includes/api/class-package-redemption-api.php` — check whether the redemption endpoint is public or dashboard-authenticated; rate limit only if public
10. `tests/unit/test-security-input-validation.php` — understand the test file structure from Task 1 so you follow the same PHPUnit pattern
11. `phpunit.xml` — verify where new test files must be registered

---

## CONTEXT

`class-csrf-protection.php` contains only nonce/CSRF logic — there is no existing rate limiter to extend. This task builds a new reusable `Bookit_Rate_Limiter` class using the WordPress Transients API (no new database tables), wires it into all public-facing endpoints, registers error code E6001, and logs violations to the audit log. The class follows the static method style established in `Bookit_CSRF_Protection`.

Note: Before implementing any Transients API calls, use Context7 to resolve 'WordPress' and confirm the current `set_transient` / `get_transient` API signatures and key-length constraints.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/class-bookit-rate-limiter.php` — CREATE

This is a new standalone class. Model its structure on `class-csrf-protection.php` (static methods, same file header format, same `if ( ! defined( 'WPINC' ) ) { die; }` guard).

**Class name:** `Bookit_Rate_Limiter`

**Constants to define:**
```php
// Transient key prefix — all rate limit keys use this prefix
const KEY_PREFIX = 'bookit_rl_';
```

**Static method: `check( $action, $ip, $limit, $window_seconds )`**
- Builds the transient key: `self::KEY_PREFIX . $action . '_' . md5( $ip )`
- **Important:** The full transient key (after WordPress prepends `_transient_`) must stay under 191 characters total. With the prefix and md5 hash, this is safe as long as `$action` strings are short (under 40 chars). Document this constraint in a code comment.
- Gets current count: `$count = (int) get_transient( $key );` — if transient doesn't exist, `get_transient` returns `false`, cast to int gives 0
- If `$count >= $limit`: return `false` (rate limited)
- If `$count === 0` (first request in window): `set_transient( $key, 1, $window_seconds )`
- If `$count > 0` but under limit: increment — `set_transient( $key, $count + 1, $window_seconds )`. **Critical:** Do NOT reset the expiry window on each increment — use `set_transient` with the original `$window_seconds` value. This is a sliding counter within a fixed window; the window resets only when the transient expires naturally.
- Return `true` (allowed)

**Static method: `handle_exceeded( $action, $ip )`**
- Logs to audit log: `Bookit_Audit_Logger::log( 'rate_limit_exceeded', 'system', 0, $action, array( 'ip' => $ip ) )`
  - Read `Bookit_Audit_Logger::log()` signature first — match the exact parameter order
- Returns a `WP_REST_Response` with HTTP 429 using `Bookit_Error_Registry::to_wp_error( 'E6001' )`
  - Wrap it: `return new WP_REST_Response( Bookit_Error_Registry::to_wp_error( 'E6001' )->get_error_data(), 429 );`
  - Read the error registry pattern first — match the exact response shape used by all other endpoints

**Static method: `get_client_ip()`**
- Returns the client IP address
- Check `$_SERVER['HTTP_X_FORWARDED_FOR']` first (proxy/load balancer), fall back to `$_SERVER['REMOTE_ADDR']`
- For `HTTP_X_FORWARDED_FOR`, take only the first IP in the comma-separated list
- Apply `filter_var( $ip, FILTER_VALIDATE_IP )` — if validation fails, fall back to `REMOTE_ADDR`
- Never trust `HTTP_X_FORWARDED_FOR` blindly in production (document this in a comment), but for Phase 1 Local/staging it is needed

---

### `includes/config/error-codes.php` — MODIFY

Add E6001 following the exact same format as existing error codes. Read the file first.

```php
'E6001' => array(
    'message' => 'Too many requests. Please wait before trying again.',
    'http_status' => 429,
),
```

---

### `includes/api/class-wizard-api.php` — MODIFY

Read the file first. Locate the booking creation callback (the POST endpoint that creates a booking — likely a method named something like `create_booking` or `process_step`).

At the **start** of that callback, before any other logic:
```php
$ip = Bookit_Rate_Limiter::get_client_ip();
if ( ! Bookit_Rate_Limiter::check( 'wizard_book', $ip, 10, HOUR_IN_SECONDS ) ) {
    return Bookit_Rate_Limiter::handle_exceeded( 'wizard_book', $ip );
}
```

Also locate the dashboard login endpoint (if it is in this file — if not, find it by reading the loader). Apply:
```php
$ip = Bookit_Rate_Limiter::get_client_ip();
if ( ! Bookit_Rate_Limiter::check( 'dashboard_login', $ip, 5, 15 * MINUTE_IN_SECONDS ) ) {
    return Bookit_Rate_Limiter::handle_exceeded( 'dashboard_login', $ip );
}
```

If the dashboard login endpoint is in a different file, apply the same pattern there. Read the loader to find it.

---

### `includes/api/class-available-packages-api.php` — MODIFY

Read the file first. At the start of the public GET callback:
```php
$ip = Bookit_Rate_Limiter::get_client_ip();
if ( ! Bookit_Rate_Limiter::check( 'wizard_pkgs', $ip, 60, HOUR_IN_SECONDS ) ) {
    return Bookit_Rate_Limiter::handle_exceeded( 'wizard_pkgs', $ip );
}
```

---

### `includes/api/class-customer-package-lookup-api.php` — MODIFY

Read the file first. At the start of the public GET callback:
```php
$ip = Bookit_Rate_Limiter::get_client_ip();
if ( ! Bookit_Rate_Limiter::check( 'wizard_my_pkgs', $ip, 60, HOUR_IN_SECONDS ) ) {
    return Bookit_Rate_Limiter::handle_exceeded( 'wizard_my_pkgs', $ip );
}
```

---

### `includes/api/class-package-redemption-api.php` — MODIFY (only if public)

Read the file first. If this endpoint requires dashboard authentication (has a `check_admin_permission` or `check_dashboard_permission` callback), **do not add rate limiting** — authenticated dashboard endpoints are not in scope for this task. If it is public (no auth), apply:
```php
$ip = Bookit_Rate_Limiter::get_client_ip();
if ( ! Bookit_Rate_Limiter::check( 'pkg_redeem', $ip, 20, HOUR_IN_SECONDS ) ) {
    return Bookit_Rate_Limiter::handle_exceeded( 'pkg_redeem', $ip );
}
```

---

### `includes/class-bookit-loader.php` — MODIFY

Read the file first. Add the require and instantiation for the rate limiter alongside the other infrastructure classes (near `class-csrf-protection.php`):

```php
require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-rate-limiter.php';
```

No instantiation needed — `Bookit_Rate_Limiter` uses static methods only, same as `Bookit_CSRF_Protection`.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new DB tables or migrations — uses WordPress Transients API exclusively
- [ ] Error code E6001 RATE_LIMIT_EXCEEDED registered in `includes/config/error-codes.php`
- [ ] Audit log event fired: `rate_limit_exceeded` on every block, actor_type `system`, actor_id `0`
- [ ] New class follows existing static method pattern from `class-csrf-protection.php`

---

## PHPUNIT REQUIREMENTS

**Baseline: 688 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-rate-limiter.php`
Register it in `phpunit.xml` following the same pattern as existing test files.

**Required test cases:**

- `test_check_allows_requests_under_limit`: call `Bookit_Rate_Limiter::check()` 9 times for the same action+IP with limit=10; assert all return `true`
- `test_check_blocks_at_limit`: call `check()` 10 times (hits the limit), then call an 11th time; assert the 11th returns `false`
- `test_check_first_request_sets_transient`: after calling `check()` once, assert `get_transient()` for the expected key returns `1`
- `test_check_increments_count`: call `check()` 3 times; assert the transient value is `3`
- `test_check_different_actions_are_independent`: call `check()` 10 times for `action_a`; assert `check()` for `action_b` (same IP, same limit) still returns `true`
- `test_check_different_ips_are_independent`: call `check()` 10 times for IP `1.2.3.4`; assert `check()` for IP `5.6.7.8` (same action, same limit) still returns `true`
- `test_handle_exceeded_returns_429`: assert the HTTP status code in the returned response is 429
- `test_handle_exceeded_logs_audit_entry`: after calling `handle_exceeded()`, assert an audit log row exists with `action = 'rate_limit_exceeded'` and `actor_type = 'system'`
- `test_e6001_registered_in_error_registry`: assert `Bookit_Error_Registry::get_http_status('E6001')` returns `429`

**Note:** Transients stored during tests will use the WordPress test database — they will be cleaned up automatically between tests if you call `delete_transient()` in `tearDown()`. Add a `tearDown()` method that deletes any transients created during the test using the known key pattern.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `Bookit_Rate_Limiter::check()` returns `false` after the limit is reached for a given action+IP combination
- [ ] `Bookit_Rate_Limiter::check()` returns `true` for a different IP on the same action (limits are per-IP, not global)
- [ ] `Bookit_Rate_Limiter::check()` returns `true` for a different action on the same IP
- [ ] E6001 error code returns HTTP 429 response matching existing error response shape
- [ ] Rate limit violation is written to the audit log with `actor_type = 'system'`, `actor_id = 0`
- [ ] Wizard booking creation endpoint (POST) returns 429 after 10 requests/hour from same IP
- [ ] `/wizard/available-packages` (GET) returns 429 after 60 requests/hour from same IP
- [ ] `/wizard/my-packages` (GET) returns 429 after 60 requests/hour from same IP
- [ ] Dashboard login returns 429 after 5 attempts per 15 minutes from same IP
- [ ] No new database tables created

### Technical
- [ ] All transient keys follow format `bookit_rl_{action}_{md5($ip)}`
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (688+ tests, 0 failures)

### Must NOT break
- [ ] Booking wizard completes successfully for a normal user (under the rate limit)
- [ ] Package redemption flow (wizard path)
- [ ] Dashboard login for legitimate users
- [ ] All existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 2: Rate limiting on public endpoints

- Created Bookit_Rate_Limiter class (WordPress Transients, no new tables)
- Registered E6001 RATE_LIMIT_EXCEEDED in error registry (HTTP 429)
- Wired rate limiting into wizard booking creation (10/hour per IP)
- Wired rate limiting into /wizard/available-packages (60/hour per IP)
- Wired rate limiting into /wizard/my-packages (60/hour per IP)
- Wired rate limiting into dashboard login (5/15min per IP)
- Audit log entry fires on every rate limit block

Tests: [N] passing, 0 failures
```
*(Update the test count from the actual PHPUnit output before committing.)*

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**