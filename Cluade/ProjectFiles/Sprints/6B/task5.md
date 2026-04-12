Let me check the Action Scheduler pattern already in use before writing the updated prompt.Good — I have everything I need. The Action Scheduler pattern is clear from the email queue implementation. Here is the updated Task 5 prompt with the queue-first approach:

---

# TASK 5 OF 8: Token Refresh Helper + Calendar Sync Class (Queue-First)
**Sprint: 6B-1 | Est: 2.5h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/integrations/class-bookit-google-calendar-api.php` — full file; understand `Bookit_Encryption` usage and DB access pattern
2. `includes/utils/class-bookit-encryption.php` — confirm `encrypt()` and `decrypt()` signatures
3. `includes/functions-notifications.php` — read `bookit_enqueue_email()` fully; the new `bookit_enqueue_calendar_sync()` helper must follow this pattern exactly
4. `includes/notifications/class-bookit-notification-dispatcher.php` — read `schedule_queue_processing()` and `process_email_queue_item()` patterns
5. `includes/class-bookit-audit-logger.php` — confirm `log()` signature
6. `includes/class-bookit-loader.php` — identify where to register new classes
7. `database/schema.sql` — confirm column names on `wp_bookings` and `wp_bookings_staff`

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task creates `Bookit_Google_Calendar` — the class responsible for all Calendar API operations (create, update, delete events) — and a lightweight queue helper that dispatches these operations asynchronously via Action Scheduler, following the exact same pattern as the email queue. Calendar sync is **always non-blocking**: the booking flow enqueues a job and returns immediately. The actual Google API call happens in a background Action Scheduler job. This matches the architecture specified in `IntegrationRequirements_Phase1.md` §6.1.

**Two-layer design:**
- `Bookit_Google_Calendar` — does the actual Google API work (called by the queue processor)
- `bookit_enqueue_calendar_sync()` — queues a job via Action Scheduler (called by hook listeners in Task 7)

---

## IMPLEMENTATION REQUIREMENTS

### `includes/integrations/class-bookit-google-calendar.php` — CREATE

New class `Bookit_Google_Calendar`. All methods are public static.

---

**`get_client_for_staff( int $staff_id ): ?Google\Client`**

1. Read from `wp_bookings_staff` where `staff_id = $staff_id`:
   - `google_calendar_connected`
   - `google_oauth_access_token`
   - `google_oauth_refresh_token`
   - `google_oauth_token_expiry`
2. If `google_calendar_connected !== 1` or tokens are empty — return `null`
3. Decrypt both tokens via `Bookit_Encryption::decrypt()`
4. Instantiate `Google\Client` with Client ID and Secret from `wp_bookings_settings` (use `$wpdb->get_var()` — `bookit_get_setting()` does not exist)
5. Build the token array and call `$client->setAccessToken()`:
```php
$client->setAccessToken( [
    'access_token'  => $decrypted_access_token,
    'refresh_token' => $decrypted_refresh_token,
    'expires_in'    => 3600,
    'created'       => strtotime( $token_expiry ) - 3600,
] );
```
6. If `$client->isAccessTokenExpired()`:
   - Call `$client->fetchAccessTokenWithRefreshToken( $decrypted_refresh_token )`
   - Check response for `error` key — if present, log `google_calendar.token_refresh_failed` and return `null`
   - Get new token via `$client->getAccessToken()`
   - Encrypt new `access_token` via `Bookit_Encryption::encrypt()`
   - Update `wp_bookings_staff`: new encrypted `google_oauth_access_token` and `google_oauth_token_expiry = date('Y-m-d H:i:s', time() + 3600)`
7. Return the configured `Google\Client`

> **Note:** Before implementing, use Context7 to resolve `google-api-php-client`
> and confirm `isAccessTokenExpired()`, `fetchAccessTokenWithRefreshToken()` return
> shape, and `getAccessToken()` format after refresh.

---

**`create_event( int $booking_id, array $booking ): ?string`**

- Call `get_client_for_staff( $booking['staff_id'] )` — if null, return null
- Build `Google\Service\Calendar\Event`:
  - `summary`: `{service_name} — {customer_first} {customer_last}`
  - `start` + `end`: `Google\Service\Calendar\EventDateTime` with RFC 3339 datetime and `timeZone` from `get_option('timezone_string')`
  - `description`:
    ```
    Booking ref: {booking_reference}
    Customer: {customer_first} {customer_last}
    Phone: {customer_phone}
    Special requests: {special_requests}   ← omit line if empty
    ```
  - `location`: `company_name` from `wp_bookings_settings`
- Call `$service->events->insert( 'primary', $event )`
- Store returned event ID in `wp_bookings.google_calendar_event_id`
- Return event ID string, or null on failure
- Wrap entire method in try/catch — on exception: log `google_calendar.sync_failed`, return null

**DateTime helper (use in create and update):**
```php
$tz    = new \DateTimeZone( get_option( 'timezone_string' ) ?: 'UTC' );
$start = ( new \DateTime( $booking['date'] . ' ' . $booking['start_time'], $tz ) )->format( \DateTime::RFC3339 );
$end   = ( new \DateTime( $booking['date'] . ' ' . $booking['end_time'],   $tz ) )->format( \DateTime::RFC3339 );
```

---

**`update_event( int $booking_id, array $booking ): void`**

- Read `google_calendar_event_id` from `wp_bookings` — if empty, call `create_event()` instead and return
- Call `get_client_for_staff( $booking['staff_id'] )` — if null, return
- Build updated event with same fields as `create_event()`
- Call `$service->events->update( 'primary', $event_id, $event )`
- Wrap in try/catch — on exception: log `google_calendar.sync_failed`, return

---

**`delete_event( int $booking_id ): void`**

- Read `google_calendar_event_id` and `staff_id` from `wp_bookings` — if event ID empty, return silently
- Call `get_client_for_staff( $staff_id )` — if null, return
- Call `$service->events->delete( 'primary', $event_id )`
- On success: clear `google_calendar_event_id` to null in `wp_bookings`
- Wrap in try/catch — on exception: log `google_calendar.sync_failed`, return

> **Note:** Before implementing `Google\Service\Calendar\Event`, use Context7
> to resolve `google-api-php-client` and confirm `setSummary`, `setDescription`,
> `EventDateTime` setters, and `events->insert/update/delete` signatures.

---

**Mockability:**
```php
private static ?Google\Client $test_client = null;

public static function set_test_client( ?Google\Client $client ): void {
    self::$test_client = $client;
}
```
In `get_client_for_staff()`: if `self::$test_client !== null`, return it directly, skipping all DB and token logic.

---

### `includes/functions-notifications.php` — MODIFY

Add a new helper function `bookit_enqueue_calendar_sync()` at the bottom of this file, following the exact same pattern as `bookit_enqueue_email()`.

```php
/**
 * Enqueue a Google Calendar sync job for async processing.
 *
 * @param string $operation  'create', 'update', or 'delete'
 * @param int    $booking_id Booking ID
 * @return void
 */
function bookit_enqueue_calendar_sync( string $operation, int $booking_id ): void {
    if ( function_exists( 'as_schedule_single_action' ) ) {
        as_schedule_single_action(
            time() + 1,
            'bookit_process_calendar_sync',
            [ 'operation' => $operation, 'booking_id' => $booking_id ],
            'bookit-calendar'
        );
    } else {
        wp_schedule_single_event(
            time() + 1,
            'bookit_process_calendar_sync',
            [ $operation, $booking_id ]
        );
    }
}
```

---

### `includes/integrations/class-bookit-google-calendar.php` — ADD processor method

Add a public static method `process_sync_job( string $operation, int $booking_id ): void` to `Bookit_Google_Calendar`. This is the Action Scheduler callback:

```php
public static function process_sync_job( string $operation, int $booking_id ): void {
    // Read full booking data from DB (wp_bookings join with service/customer)
    // needed for create_event() and update_event()
    $booking = // ... read from DB

    switch ( $operation ) {
        case 'create':
            self::create_event( $booking_id, $booking );
            break;
        case 'update':
            self::update_event( $booking_id, $booking );
            break;
        case 'delete':
            self::delete_event( $booking_id );
            break;
        default:
            Bookit_Audit_Logger::log( 'google_calendar.sync_failed', 'booking', $booking_id,
                [ 'notes' => 'unknown_operation: ' . $operation ] );
    }
}
```

The `$booking` array must include: `staff_id`, `date`, `start_time`, `end_time`, `service_name`, `customer_first`, `customer_last`, `customer_phone`, `booking_reference`, `special_requests`, `company_name`. Read the existing booking query patterns in `class-dashboard-bookings-api.php` to see how booking data is assembled — follow the same pattern.

---

### `includes/class-bookit-loader.php` — MODIFY

- Read the full file first
- Add `require_once` for `class-bookit-google-calendar.php`
- Register the Action Scheduler hook:
```php
add_action(
    'bookit_process_calendar_sync',
    [ 'Bookit_Google_Calendar', 'process_sync_job' ],
    10,
    2
);
```
Register this alongside other Action Scheduler hooks — follow existing pattern

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] `Bookit_Google_Calendar` created in `includes/integrations/`
- [ ] `bookit_enqueue_calendar_sync()` added to `includes/functions-notifications.php`
- [ ] `bookit_process_calendar_sync` Action Scheduler hook registered in loader
- [ ] `process_sync_job()` is the single entry point called by Action Scheduler
- [ ] All Google API calls wrapped in try/catch — no exceptions propagate
- [ ] Token refresh updates DB with new encrypted access token and expiry
- [ ] Audit log fired on: `google_calendar.sync_failed`, `google_calendar.token_refresh_failed`
- [ ] Static test client setter for unit test mockability

---

## PHPUNIT REQUIREMENTS

Baseline: **948 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-sync.php`

Required test cases:
- `test_get_client_returns_null_when_staff_not_connected` — `google_calendar_connected = 0` returns null
- `test_token_refresh_updates_db_when_expired` — mock expired token, assert DB updated with new encrypted token and new expiry
- `test_token_refresh_failure_returns_null` — mock refresh returning error key, assert null returned and audit logged
- `test_create_event_returns_event_id` — inject mock client via `set_test_client()`, assert event ID stored in `wp_bookings`
- `test_create_event_failure_returns_null_and_logs` — mock throws exception, assert null and `google_calendar.sync_failed` logged
- `test_update_event_calls_create_when_no_event_id` — no `google_calendar_event_id` on booking, assert `create_event()` called
- `test_delete_event_clears_event_id_after_success` — assert column set to null after delete
- `test_sync_failure_does_not_throw` — mock throws, assert no exception out of `create_event()`
- `test_enqueue_calendar_sync_schedules_action` — call `bookit_enqueue_calendar_sync('create', 1)`, assert `as_schedule_single_action` was called with correct args
- `test_process_sync_job_routes_to_correct_method` — call `process_sync_job('delete', $booking_id)`, assert `delete_event()` called

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `bookit_enqueue_calendar_sync()` schedules an Action Scheduler job — does not call Google API directly
- [ ] `process_sync_job()` is called by Action Scheduler and routes to correct method
- [ ] `get_client_for_staff()` returns null when staff not connected
- [ ] Expired access token refreshed automatically and DB updated with encrypted new token
- [ ] `create_event()` returns Google Calendar event ID and stores in `wp_bookings`
- [ ] `update_event()` falls back to `create_event()` when no existing event ID
- [ ] `delete_event()` clears `google_calendar_event_id` after success
- [ ] All failures audit logged — never throw out of public methods

### Technical
- [ ] Booking hook returns immediately — Google API call happens in background
- [ ] RFC 3339 datetime format with business timezone
- [ ] New access token encrypted before DB storage
- [ ] Static test client setter works in unit tests
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (948+ tests, 0 failures)

### Must NOT break
- [ ] Email queue and `bookit_enqueue_email()` unaffected
- [ ] OAuth connect/disconnect flow (Task 4) unaffected
- [ ] Existing booking creation flow unaffected

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 5: Google Calendar sync class + async queue via Action Scheduler

- class-bookit-google-calendar.php: get_client_for_staff (token refresh),
  create_event, update_event, delete_event, process_sync_job
- functions-notifications.php: bookit_enqueue_calendar_sync() helper
- class-bookit-loader.php: require_once + bookit_process_calendar_sync hook
- tests/unit/test-google-calendar-sync.php: 10 new tests

Tests: 948+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**