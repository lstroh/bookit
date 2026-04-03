Good catch. To clarify: the REST endpoints and PHP backend logic are the same regardless of wizard version — the question is specifically about which **confirmation page template** to use as the pattern for the cancel/reschedule page templates in 5A-3b, and which **shortcode registration pattern** to follow.

Let me check the V2 confirmation template pattern before finalising.Good. The question is clear now. The backend (REST endpoints, shortcode registration, page auto-creation) is version-agnostic — that part of my prompt stands. What you're asking is that the **frontend templates in 5A-3b** should follow the V2 visual style — using `--bookit-v2-*` CSS tokens, the V2 card/container structure, and `booking-confirmed-v2.php` as the pattern rather than V1.

Confirmed. Here's the corrected prompt — this is the complete 5A-3a prompt with one clarification added to explicitly direct Cursor toward the V2 template pattern for 5A-3b:

---

```
TASK 5A-3a OF 6: Magic Link Cancellation & Rescheduling — Backend
Sprint: 5A | Est: 8h | Plugin root: bookit-booking-system/
Depends on: 5A-1 complete (magic_link_token column confirmed present)
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below in full before writing a single line of code.
If any file does not exist at the path shown, STOP and report back.

1. `includes/api/class-dashboard-bookings-api.php` — read the existing
   dashboard `cancel_booking()` method in full: policy window check
   pattern, `cancelled_by` / `cancelled_at` writes, hook firing, audit
   log call. This is the authoritative pattern for the new cancel endpoint.
2. `includes/api/class-wizard-api.php` — read in full: how existing
   public routes are registered, how `check_permission()` is used, where
   to add the two new routes
3. `includes/class-bookit-rate-limiter.php` — read `is_rate_limited()`
   and `increment()` signatures and key format
4. `includes/notifications/class-bookit-notification-dispatcher.php` —
   read `enqueue_email()` signature: parameters, valid `email_type`
   strings, `params` array shape
5. `public/class-shortcodes.php` — read in full: how `bookit_wizard_v2`
   and `bookit_booking_confirmed_v2` shortcodes are registered, how CSS
   is conditionally enqueued, the `$has_confirmation_v2` guard pattern,
   how `Bookit_Template_Loader::get_template()` is called
6. `public/templates/booking-confirmed-v2.php` — read in full: this is
   the **V2 template pattern** that the cancel/reschedule templates
   (built in 5A-3b) must follow. Note the wrapper class, CSS token usage,
   and how `$booking` data is accessed
7. `public/assets/css/confirmation-page-v2.css` — read to understand the
   V2 CSS token conventions (`--bookit-*`) so the new `magic-link-pages.css`
   created in 5A-3b follows the same system
8. `includes/class-bookit-activator.php` — read the full page
   auto-creation section to understand the exact `get_page_by_path()`
   duplicate guard pattern
9. `includes/config/error-codes.php` — find the highest existing code
   in each series to avoid collision
10. `includes/class-bookit-error-registry.php` — confirm `register()`
    and `to_wp_error()` signatures
11. `includes/class-bookit-audit-logger.php` — confirm `log()` signature
12. `includes/class-bookit-database.php` — confirm `wp_bookings` columns
    available: `booking_date`, `start_time`, `status`, `magic_link_token`,
    `cancelled_by`, `cancelled_at`, `cancellation_reason`, `customer_id`,
    `service_id`, `staff_id`
13. `database/schema.sql` — confirm `wp_bookings_settings` has
    `cancellation_notice_hours` as a stored key
14. `tests/unit/test-wizard-api.php` — read existing tests to follow the
    rate-limit transient reset pattern in `setUp()`

---

## CONTEXT

This is the backend half of Task 5A-3. It delivers two new public REST
endpoints (`POST wizard/cancel` and `POST wizard/reschedule`), shortcode
registration, and page auto-creation. The `magic_link_token` column added
in 5A-1 is the authentication mechanism — no WordPress login required.
Task 5A-3b (separate prompt) will add the PHP templates and CSS using the
**V2 visual system** (`booking-confirmed-v2.php` as pattern,
`--bookit-v2-*` CSS tokens). This task must not create any template files
— only the PHP wiring, REST logic, shortcode scaffolding, and tests.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-wizard-api.php` — MODIFY

Add two new public REST routes inside the existing `register_routes()`,
following the same pattern as `wizard/complete`:

**Route 1 — `POST bookit/v1/wizard/cancel`**
```php
register_rest_route(
    self::NAMESPACE,
    '/wizard/cancel',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'cancel_booking_magic_link' ),
        'permission_callback' => '__return_true',
        'args'                => array(
            'booking_id' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && (int) $param > 0;
                },
                'sanitize_callback' => 'absint',
            ),
            'token' => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'reason' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_textarea_field',
                'default'           => '',
            ),
        ),
    )
);
```

**Route 2 — `POST bookit/v1/wizard/reschedule`**
```php
register_rest_route(
    self::NAMESPACE,
    '/wizard/reschedule',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'reschedule_booking_magic_link' ),
        'permission_callback' => '__return_true',
        'args'                => array(
            'booking_id' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && (int) $param > 0;
                },
                'sanitize_callback' => 'absint',
            ),
            'token' => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'new_date' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                },
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'new_time' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return (bool) preg_match( '/^\d{2}:\d{2}(:\d{2})?$/', $param );
                },
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    )
);
```

Add two new public methods to the class:

### `cancel_booking_magic_link( WP_REST_Request $request )` — new method

Steps in order — do not reorder:

1. **Rate limit** — 10/hour/IP. Action key: `'magic_cancel'`. IP from
   `sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' )`. On limit hit:
   return `Bookit_Error_Registry::to_wp_error('E6001', ['action' => 'magic_cancel'])`.
   On pass: increment.

2. **Booking lookup** — query `wp_bookings`:
   ```sql
   SELECT id, status, booking_date, start_time, customer_id,
          magic_link_token
   FROM {prefix}bookings
   WHERE id = %d AND deleted_at IS NULL
   ```
   If no row: `Bookit_Error_Registry::to_wp_error('E2002', ['booking_id' => $booking_id])`.

3. **Token validation** — `hash_equals( (string) $booking['magic_link_token'], (string) $token )`.
   On mismatch: `new WP_Error('invalid_token', __('Invalid or expired link.', 'bookit-booking-system'), ['status' => 403])`.

4. **Terminal status check** — if status is `'cancelled'`, `'completed'`,
   or `'no_show'`: return `Bookit_Error_Registry::to_wp_error('E2003', ['booking_id' => $booking_id])`.
   (Read `error-codes.php` first — if E2003's message is misleading here,
   use a more appropriate existing code or register a new one.)

5. **Policy window check** — read `cancellation_notice_hours` from
   `wp_bookings_settings` via direct `$wpdb->get_var()` (NOT
   `bookit_get_setting()` — that function does not exist). Default: `24`.
   Combine `booking_date` + `start_time` into a `DateTime` using
   `get_option('timezone_string')`. Compute hours until appointment.
   If hours remaining < notice hours:
   ```php
   return new WP_Error(
       'within_cancellation_window',
       __( 'Online cancellation is not available this close to your appointment. Please contact us directly.', 'bookit-booking-system' ),
       array( 'status' => 422, 'hours_required' => (int) $notice_hours )
   );
   ```

6. **Cancel** — `$wpdb->update()`:
   - `status = 'cancelled'`
   - `cancelled_by = 'customer'`
   - `cancelled_at = current_time('mysql')`
   - `cancellation_reason = $reason`
   - `updated_at = current_time('mysql')`
   - `deleted_at = current_time('mysql')` (soft delete — match dashboard cancel)
   WHERE `id = $booking_id`.

7. **Audit log** — `Bookit_Audit_Logger::log('booking.cancelled_by_customer', 'booking', $booking_id, ['old_status' => $old_status, 'cancelled_via' => 'magic_link'])`.

8. **Hook** — `do_action('bookit_after_booking_cancelled', $booking_id, ['cancelled_by' => 'customer', 'via' => 'magic_link'])`.

9. **Email** — enqueue `email_type = 'booking_cancelled'` via dispatcher.
   Read dispatcher's `enqueue_email()` signature before calling. Load
   dispatcher with `require_once` if not already loaded.

10. **Return** — `rest_ensure_response(['success' => true, 'message' => __('Your booking has been cancelled.', 'bookit-booking-system')])`.

### `reschedule_booking_magic_link( WP_REST_Request $request )` — new method

Steps in order:

1. **Rate limit** — same pattern. Action key: `'magic_reschedule'`.

2. **Booking lookup** — same query plus `service_id`, `staff_id`,
   `booking_date AS old_date`, `start_time AS old_time`.

3. **Token validation** — `hash_equals()` same as cancel.

4. **Terminal status check** — block `'cancelled'`, `'completed'`, `'no_show'`.

5. **Policy window check** — same logic as cancel.

6. **Availability check** — query `wp_bookings` for any non-cancelled,
   non-deleted booking with same `staff_id`, `booking_date = $new_date`,
   `start_time = $new_time`, excluding current `id`:
   ```sql
   SELECT id FROM {prefix}bookings
   WHERE staff_id = %d
     AND booking_date = %s
     AND start_time = %s
     AND id != %d
     AND deleted_at IS NULL
     AND status != 'cancelled'
   ```
   If conflict: `Bookit_Error_Registry::to_wp_error('E2001', ['staff_id' => $staff_id, 'date' => $new_date, 'time' => $new_time])`.

7. **Recalculate end_time** — fetch `duration` from `wp_bookings_services`
   WHERE `id = $service_id`. Add minutes to `$new_time` using `DateTime`.
   Store as `H:i:s`.

8. **Update booking** — `$wpdb->update()`:
   - `booking_date = $new_date`
   - `start_time = $new_time`
   - `end_time = $new_end_time`
   - `updated_at = current_time('mysql')`
   WHERE `id = $booking_id`.

9. **Audit log** — `Bookit_Audit_Logger::log('booking.rescheduled_by_customer', 'booking', $booking_id, ['old_date' => $old_date, 'old_time' => $old_time, 'new_date' => $new_date, 'new_time' => $new_time, 'via' => 'magic_link'])`.

10. **Hook** — `do_action('bookit_booking_rescheduled', $booking_id, ['new_date' => $new_date, 'new_time' => $new_time, 'rescheduled_by' => 'customer', 'via' => 'magic_link'])`.

11. **Email** — enqueue `email_type = 'booking_rescheduled'` via dispatcher.

12. **Return** — `rest_ensure_response(['success' => true, 'new_date' => $new_date, 'new_time' => $new_time])`.

### `public/class-shortcodes.php` — MODIFY

Read the full file first. Register two new shortcodes following the exact
pattern used for `bookit_booking_confirmed_v2` (not V1):

- `add_shortcode('bookit_cancel_booking', [$this, 'render_cancel_booking'])`
- `add_shortcode('bookit_reschedule_booking', [$this, 'render_reschedule_booking'])`

Add `$has_cancel` and `$has_reschedule` guard flags (same pattern as
`$has_confirmation_v2`). Enqueue CSS `magic-link-pages` only when flag
is true, with `bookit-wizard` as dependency (for `--bookit-*` token
resolution — same rationale as `confirmation-page-v2.css`).

Shortcode render methods:
- Extract `booking_id = absint($_GET['booking_id'] ?? 0)` and
  `token = sanitize_text_field($_GET['token'] ?? '')`
- If either is empty/zero, return `'<p class="bookit-error">' . esc_html__('Invalid booking link.', 'bookit-booking-system') . '</p>'`
- Pass to template via `set_query_var()` or local variable extract —
  match whichever pattern `render_booking_confirmed_v2()` uses
- Template paths (to be created in 5A-3b, **do not create them here**):
  - `public/templates/cancel-booking.php`
  - `public/templates/reschedule-booking.php`
- Pass to template: `$booking_id`, `$token`, `$rest_url = rest_url('bookit/v1/wizard/')`
- Use `Bookit_Template_Loader::get_template()` — not a raw `include`

### `includes/class-bookit-activator.php` — MODIFY

Add two page auto-creation blocks after the `/booking-confirmed-v2/` block,
using the identical `get_page_by_path()` guard pattern:

```php
if ( ! get_page_by_path( 'bookit-cancel' ) ) {
    wp_insert_post( array(
        'post_title'   => 'Cancel Booking',
        'post_name'    => 'bookit-cancel',
        'post_content' => '[bookit_cancel_booking]',
        'post_status'  => 'publish',
        'post_type'    => 'page',
    ) );
}

if ( ! get_page_by_path( 'bookit-reschedule' ) ) {
    wp_insert_post( array(
        'post_title'   => 'Reschedule Booking',
        'post_name'    => 'bookit-reschedule',
        'post_content' => '[bookit_reschedule_booking]',
        'post_status'  => 'publish',
        'post_type'    => 'page',
    ) );
}
```

---

## INFRASTRUCTURE REQUIREMENTS

- [x] 2 new REST routes — public, `permission_callback => '__return_true'`
- [x] Rate limited 10/hour/IP per action via `Bookit_Rate_Limiter`
- [x] Token validated with `hash_equals()` — never `==` or `===`
- [x] Policy window read via direct `$wpdb->get_var()`, default 24h
- [x] Audit log fired on both cancel and reschedule
- [x] `bookit_after_booking_cancelled` fired on cancel
- [x] `bookit_booking_rescheduled` fired on reschedule
- [x] Email queued via dispatcher on both actions
- [x] `cancelled_by = 'customer'` written on cancel
- [x] `deleted_at` set on cancel (soft delete, consistent with dashboard)
- [x] 2 shortcodes registered, CSS conditionally enqueued, V2 pattern
- [x] 2 pages auto-created in activator

---

## PHPUNIT REQUIREMENTS

Baseline: **829 tests, 0 failures** — must not regress.

New test file: `tests/unit/test-magic-link-flows.php`

Follow class structure and `setUp()` from `tests/unit/test-wizard-api.php`.
Reset rate-limit transients for `magic_cancel` and `magic_reschedule`
actions in `setUp()` to prevent 429 bleed between tests.

Required test cases:

- `test_cancel_endpoint_requires_valid_token`
  POST `bookit/v1/wizard/cancel` with valid `booking_id`, wrong token.
  Assert 403.

- `test_cancel_endpoint_cancels_booking_with_valid_token`
  Create `confirmed` booking, `booking_date` = tomorrow + 2 days (well
  outside policy window). Set `magic_link_token` via `$wpdb->update`.
  POST with correct token. Assert 200. Query DB and assert `status =
  'cancelled'`, `cancelled_by = 'customer'`, `deleted_at IS NOT NULL`.

- `test_cancel_endpoint_sets_cancelled_by_customer`
  Same setup. Assert `cancelled_by = 'customer'` in DB after cancel.

- `test_cancel_endpoint_rejects_already_cancelled_booking`
  Create booking with `status = 'cancelled'`. POST with correct token.
  Assert 422 (terminal status block).

- `test_cancel_endpoint_rejects_within_policy_window`
  Create `confirmed` booking with `booking_date` = today, `start_time` =
  1 hour from now. Set `cancellation_notice_hours = 24` in settings.
  POST with correct token. Assert 422 with error code
  `within_cancellation_window`.

- `test_cancel_endpoint_rate_limited_after_threshold`
  Send 11 POST requests with valid token. Assert the 11th returns 429.

- `test_reschedule_endpoint_requires_valid_token`
  POST `bookit/v1/wizard/reschedule` with wrong token. Assert 403.

- `test_reschedule_endpoint_updates_booking_date_and_time`
  Create `confirmed` booking outside policy window. POST reschedule with
  a valid future `new_date` and `new_time` that has no conflict. Assert
  200. Query DB and confirm `booking_date` and `start_time` updated.

- `test_reschedule_endpoint_rejects_unavailable_slot`
  Create two bookings on same staff. Attempt to reschedule booking A
  to the same slot as booking B. Assert 409.

- `test_reschedule_endpoint_fires_rescheduled_hook`
  Use `did_action('bookit_booking_rescheduled')` before and after POST.
  Assert count increases by 1.

- `test_cancel_shortcode_renders_error_without_params`
  Call `do_shortcode('[bookit_cancel_booking]')` with no `$_GET` params.
  Assert output contains `bookit-error`.

- `test_reschedule_shortcode_renders_error_without_params`
  Same for `[bookit_reschedule_booking]`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking this task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `POST wizard/cancel` returns 403 on wrong token
- [ ] `POST wizard/cancel` returns 422 within policy window
- [ ] `POST wizard/cancel` sets `status = 'cancelled'`, `cancelled_by = 'customer'`, `deleted_at` on success
- [ ] `POST wizard/reschedule` returns 403 on wrong token
- [ ] `POST wizard/reschedule` returns 409 on slot conflict
- [ ] `POST wizard/reschedule` updates `booking_date`, `start_time`, `end_time` on success
- [ ] Both endpoints rate-limited at 10/hour/IP
- [ ] `[bookit_cancel_booking]` and `[bookit_reschedule_booking]` shortcodes registered
- [ ] `/bookit-cancel/` and `/bookit-reschedule/` pages auto-created on activation

### Technical
- [ ] No PHP warnings or notices
- [ ] `hash_equals()` used for token comparison — not `==`
- [ ] Policy window read via `$wpdb->get_var()`, not `bookit_get_setting()`
- [ ] Shortcode CSS enqueued using `$has_cancel` / `$has_reschedule` guard flags
- [ ] Template loaded via `Bookit_Template_Loader::get_template()`, not raw include
- [ ] PHPUnit suite passes (829+ tests, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` booking submission still works end-to-end
- [ ] `[bookit_booking_confirmed_v2]` still renders correctly
- [ ] Existing `test-wizard-api.php` tests still pass
- [ ] Dashboard `cancel_booking()` endpoint unchanged

---

## NOTE FOR 5A-3b

Task 5A-3b (separate prompt, follows this one) will create:
- `public/templates/cancel-booking.php` — modelled on `booking-confirmed-v2.php`
- `public/templates/reschedule-booking.php` — same V2 pattern
- `public/assets/css/magic-link-pages.css` — scoped to V2 wrapper classes,
  using `--bookit-*` and `--bookit-v2-*` token system

Do NOT create these files in this task.

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 3a: Magic link cancel/reschedule — backend

- Register POST wizard/cancel + POST wizard/reschedule REST endpoints
- Token auth via hash_equals() on magic_link_token, rate limited 10/hr/IP
- Cancel: policy window check, soft delete, cancelled_by=customer, hook + email
- Reschedule: slot conflict check, end_time recalc, hook + email
- Register [bookit_cancel_booking] and [bookit_reschedule_booking] shortcodes
- Auto-create /bookit-cancel/ and /bookit-reschedule/ pages on activation
- 12 new PHPUnit tests in test-magic-link-flows.php

Tests: 829+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.