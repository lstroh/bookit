Let me read the key files for 5A-2 before writing the prompt.Good. Now let me look at the V2 confirmation page to understand how `magic_link_token` is currently exposed there (for the ical button wire-up):Now let me get the RFC 5545 iCal format via Context7 to ensure the implementation is correct:Context7 didn't return iCal-specific content. That's fine — the iCal format in `CustomerJourney-04-Notifications.md` is authoritative enough, and I have the sprint prompt spec. I have everything I need. Here is the prompt:

---

```
TASK 5A-2 OF 6: .ics Calendar Download Endpoint
Sprint: 5A | Est: 6h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-customers-api.php` — read in full. Find the
   `rest_pre_serve_request` filter pattern used for CSV export. This is
   the **exact pattern** to replicate for raw `.ics` file delivery.
   Note: how the filter is added, how headers are set, how output is
   echoed and `exit` is called, and how the filter is removed afterward
   so it does not bleed into other requests.
2. `includes/api/class-wizard-api.php` — read in full to understand
   where to add the new `GET wizard/ical` route and the new
   `get_ical` callback method. Follow the existing route registration
   pattern exactly.
3. `public/templates/booking-confirmed-v2.php` — find the "Add to
   Calendar" placeholder button/link. Read the exact HTML — note the
   current href (placeholder URL), and what data is available in the
   template (`$booking_id`, `$booking['magic_link_token']`, etc.) so
   you know what to replace it with.
4. `includes/class-bookit-database.php` — confirm `wp_bookings` columns
   available for the ical query: `booking_date`, `start_time`,
   `end_time`, `booking_reference`, `magic_link_token`, `service_id`,
   `staff_id`.
5. `database/schema.sql` — confirm `wp_bookings_settings` has keys for
   `business_name` and `business_address` (needed for LOCATION and
   PRODID fields in the .ics).
6. `includes/class-bookit-error-registry.php` — confirm `to_wp_error()`
   signature for 403 and 404 responses.
7. `tests/unit/test-wizard-api.php` — read to follow the test class
   structure and setUp() pattern.

---

## CONTEXT

Task 5A-2 wires the "Add to Calendar" button that has been a placeholder
on the V2 confirmation page since Sprint Confirmed-V2. It creates a
public `GET bookit/v1/wizard/ical` endpoint that returns a standards-
compliant `.ics` file. Security uses the `magic_link_token` added in
5A-1 — no login required, but the token must match. The endpoint uses
the `rest_pre_serve_request` pattern established for CSV exports so that
WordPress's REST JSON encoding does not corrupt the raw file output.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-wizard-api.php` — MODIFY

Register one new public route inside `register_routes()`:

```php
register_rest_route(
    self::NAMESPACE,
    '/wizard/ical',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_ical' ),
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
        ),
    )
);
```

Add new public method `get_ical( WP_REST_Request $request )`:

**Steps in order:**

1. **Params** — `$booking_id = absint($request->get_param('booking_id'))`,
   `$token = sanitize_text_field($request->get_param('token'))`.

2. **DB lookup** — query `wp_bookings` with LEFT JOINs:
   ```sql
   SELECT b.id, b.booking_reference, b.booking_date, b.start_time,
          b.end_time, b.magic_link_token, b.status,
          s.name  AS service_name,
          st.first_name AS staff_first_name,
          st.last_name  AS staff_last_name
   FROM {prefix}bookings b
   LEFT JOIN {prefix}bookings_services s  ON s.id  = b.service_id
   LEFT JOIN {prefix}bookings_staff    st ON st.id = b.staff_id
   WHERE b.id = %d AND b.deleted_at IS NULL
   ```
   If no row: return `Bookit_Error_Registry::to_wp_error('E2002', ['booking_id' => $booking_id])`.

3. **Token validation** — `hash_equals((string)$booking->magic_link_token, (string)$token)`.
   On mismatch: `new WP_Error('invalid_token', __('Invalid or expired link.', 'bookit-booking-system'), ['status' => 403])`.

4. **Business settings** — read `business_name` and `business_address`
   from `wp_bookings_settings` via direct `$wpdb->get_results()`:
   ```php
   $settings_rows = $wpdb->get_results(
       "SELECT setting_key, setting_value FROM {$wpdb->prefix}bookings_settings
        WHERE setting_key IN ('business_name','business_address')",
       ARRAY_A
   );
   $settings = array_column( $settings_rows, 'setting_value', 'setting_key' );
   $business_name    = $settings['business_name']    ?? get_bloginfo('name');
   $business_address = $settings['business_address'] ?? '';
   ```

5. **Timezone handling** — use `get_option('timezone_string')` with
   fallback to `'Europe/London'`. Build DateTimeZone and DateTime objects:
   ```php
   $tz       = new DateTimeZone( get_option('timezone_string') ?: 'Europe/London' );
   $dt_start = new DateTime( $booking->booking_date . ' ' . $booking->start_time, $tz );
   $dt_end   = new DateTime( $booking->booking_date . ' ' . $booking->end_time,   $tz );
   $dt_now   = new DateTime( 'now', new DateTimeZone('UTC') );
   ```

6. **Build .ics content** — follow RFC 5545. Use `\r\n` line endings
   (CRLF is required by the spec — not `\n`):
   ```php
   $staff_name = trim( $booking->staff_first_name . ' ' . $booking->staff_last_name );
   $summary    = $booking->service_name . ' with ' . $staff_name;
   $uid        = $booking->booking_reference . '@bookit.' . parse_url( home_url(), PHP_URL_HOST );

   $ics  = "BEGIN:VCALENDAR\r\n";
   $ics .= "VERSION:2.0\r\n";
   $ics .= "PRODID:-//Bookit Booking System//EN\r\n";
   $ics .= "CALSCALE:GREGORIAN\r\n";
   $ics .= "METHOD:PUBLISH\r\n";
   $ics .= "BEGIN:VEVENT\r\n";
   $ics .= "UID:" . $uid . "\r\n";
   $ics .= "DTSTAMP:" . $dt_now->format('Ymd\THis\Z') . "\r\n";
   $ics .= "DTSTART;TZID=" . $tz->getName() . ":" . $dt_start->format('Ymd\THis') . "\r\n";
   $ics .= "DTEND;TZID="   . $tz->getName() . ":" . $dt_end->format('Ymd\THis')   . "\r\n";
   $ics .= "SUMMARY:"  . $this->ical_escape( $summary )          . "\r\n";
   $ics .= "DESCRIPTION:Booking reference: " . $this->ical_escape( $booking->booking_reference ) . "\r\n";
   $ics .= "LOCATION:" . $this->ical_escape( $business_address ) . "\r\n";
   $ics .= "STATUS:CONFIRMED\r\n";
   $ics .= "END:VEVENT\r\n";
   $ics .= "END:VCALENDAR\r\n";
   ```

7. **Add private helper** `ical_escape( string $text ): string` — escapes
   commas, semicolons, and backslashes per RFC 5545:
   ```php
   private function ical_escape( string $text ): string {
       $text = str_replace( '\\', '\\\\', $text );
       $text = str_replace( ';',  '\\;',  $text );
       $text = str_replace( ',',  '\\,',  $text );
       $text = str_replace( "\n", '\\n',  $text );
       return $text;
   }
   ```

8. **Deliver via `rest_pre_serve_request`** — read `class-customers-api.php`
   first and replicate its exact pattern. The filter callback must:
   - Set `Content-Type: text/calendar; charset=utf-8`
   - Set `Content-Disposition: attachment; filename="booking-{$booking->booking_reference}.ics"`
   - Set `Content-Length: ` + `strlen($ics)`
   - Echo `$ics`
   - Call `exit`
   - Return `true` from the filter callback

   The filter must be added with `add_filter('rest_pre_serve_request', ...)` 
   **before** returning from `get_ical()`. The method itself must return
   `new WP_REST_Response(null, 200)` — the filter intercepts before it
   is sent. Read the CSV pattern carefully to get this right.

### `public/templates/booking-confirmed-v2.php` — MODIFY

Read the file first. Find the "Add to Calendar" placeholder. Replace the
placeholder `href` with the real endpoint URL including both required params.

The template already has `$booking_id`. It needs `$magic_link_token` —
fetch it from the `$booking` array that is already loaded in the template.
Read the template to confirm the exact variable name used for the booking
data (`$booking['magic_link_token']` or `$booking->magic_link_token`
depending on whether it is fetched as array or object).

The new href:
```php
esc_url( add_query_arg(
    array(
        'booking_id' => $booking_id,
        'token'      => $booking['magic_link_token'], // confirm key name from template
    ),
    rest_url( 'bookit/v1/wizard/ical' )
) )
```

The button/link should remain visually identical — only the `href` changes.

---

## INFRASTRUCTURE REQUIREMENTS

- [x] New route `GET bookit/v1/wizard/ical` — public, `__return_true`
- [x] Token validated with `hash_equals()`
- [x] Raw file delivered via `rest_pre_serve_request` filter pattern
      (same as CSV export in `class-customers-api.php`)
- [x] `\r\n` CRLF line endings throughout `.ics` content (RFC 5545)
- [x] Business timezone used for DTSTART/DTEND via `get_option('timezone_string')`
- [x] UID includes booking reference + site host (globally unique)
- [x] V2 confirmation page "Add to Calendar" button wired to real endpoint

---

## PHPUNIT REQUIREMENTS

Baseline: **841 tests, 0 failures** — must not regress.

New test file: `tests/unit/test-ical-endpoint.php`

Follow the class structure and setUp() from `tests/unit/test-wizard-api.php`.

Required test cases:

- `test_ical_endpoint_rejects_missing_token`
  GET `bookit/v1/wizard/ical?booking_id=X` with no token param.
  Assert response is 400 (missing required arg).

- `test_ical_endpoint_rejects_wrong_token`
  Create a booking, set `magic_link_token` via `$wpdb->update`. GET with
  wrong token. Assert response is 403.

- `test_ical_endpoint_rejects_invalid_booking_id`
  GET with `booking_id=99999` and any token. Assert 404.

- `test_ical_endpoint_returns_ics_content_type`
  **Note:** Because the endpoint uses `rest_pre_serve_request` + `exit`,
  it cannot be tested via `rest_get_server()->dispatch()` in PHPUnit
  (the `exit` would terminate the test process). Instead, test the
  underlying data-building logic directly:
  - Call `get_ical()` with a mocked request that bypasses the filter
    by temporarily unhooking `rest_pre_serve_request`, OR
  - Test a helper method `build_ical_content( $booking_id, $token )`
    that is extracted from `get_ical()` and returns the raw string.
  
  **Preferred approach**: Extract the `.ics` string building into a
  separate private-turned-protected method `build_ical_content()` and
  test that directly. Assert the returned string contains
  `BEGIN:VCALENDAR`, `BEGIN:VEVENT`, `DTSTART`, `DTEND`, `SUMMARY`,
  `UID`. This is the same pattern used by the CSV export tests — read
  those tests to confirm how they handle the `rest_pre_serve_request`
  limitation.

- `test_ical_content_contains_required_fields`
  Create a booking with known service/staff/date/time. Call
  `build_ical_content()` (or equivalent). Assert:
  - String contains `BEGIN:VCALENDAR`
  - String contains `BEGIN:VEVENT`
  - String contains `DTSTART`
  - String contains `DTEND`
  - String contains `SUMMARY:` + service name
  - String contains `UID:`
  - String contains `\r\n` (CRLF line endings)

- `test_ical_endpoint_rejects_deleted_booking`
  Create a booking, set `deleted_at` to a past datetime. GET with correct
  token. Assert 404.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /wp-json/bookit/v1/wizard/ical?booking_id=X&token=Y` returns
      a `.ics` file download (not JSON) when token is valid
- [ ] Wrong token returns 403
- [ ] Missing booking returns 404
- [ ] `.ics` file opens correctly in Google Calendar, Apple Calendar,
      or Outlook (manual test)
- [ ] "Add to Calendar" button on V2 confirmation page links to the real
      endpoint (not the old placeholder)
- [ ] File is named `booking-{reference}.ics`

### Technical
- [ ] `Content-Type: text/calendar; charset=utf-8` header set
- [ ] `Content-Disposition: attachment` header set
- [ ] CRLF `\r\n` line endings throughout (RFC 5545 compliant)
- [ ] DTSTART/DTEND use business timezone, not UTC
- [ ] UID is globally unique (booking reference + site host)
- [ ] `hash_equals()` used for token comparison
- [ ] `rest_pre_serve_request` pattern used (not `header()` + `exit` in callback)
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (841+ tests, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` — booking submission unchanged
- [ ] `[bookit_booking_confirmed_v2]` — confirmation page renders correctly
- [ ] Existing wizard/cancel and wizard/reschedule endpoints unchanged
- [ ] CSV export in customers API unchanged

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 2: .ics calendar download endpoint

- Register GET bookit/v1/wizard/ical (public, token-authenticated)
- Token validated via hash_equals() on magic_link_token
- RFC 5545 compliant .ics output with CRLF line endings
- Business timezone used for DTSTART/DTEND
- Raw delivery via rest_pre_serve_request filter (same as CSV export)
- Wire V2 confirmation page "Add to Calendar" button to real endpoint
- 5 new PHPUnit tests in test-ical-endpoint.php

Tests: 841+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.