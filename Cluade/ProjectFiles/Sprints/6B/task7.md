Let me check the committed code quickly before writing the Task 7 prompt.Good — I have the Task 7 spec from the original sprint document. Now here is the Task 7 prompt:

---

# TASK 7 OF 8: Hook Listeners + Fallback Logic
**Sprint: 6B-1 | Est: 1.5h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/integrations/class-bookit-google-calendar.php` — full file; confirm `process_sync_job()` signature and `set_test_client()` pattern
2. `includes/functions-notifications.php` — confirm `bookit_enqueue_calendar_sync()` signature
3. `includes/class-bookit-loader.php` — full file; find where other `::init()` calls are registered and where new `require_once` entries go
4. `includes/class-bookit-audit-logger.php` — confirm `log()` signature
5. `database/schema.sql` — confirm `role` column values on `wp_bookings_staff` and `status` column values on `wp_bookings`

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task wires the three Bookit booking lifecycle hooks to the Google Calendar queue. When a booking is created, rescheduled, or cancelled, a background Action Scheduler job is enqueued to sync the change to Google Calendar. The sync class also handles fallback logic — if the assigned staff member has not connected Google Calendar, it looks for a connected admin to use as fallback. All of this is in a dedicated sync class, separate from `Bookit_Google_Calendar` (single responsibility).

---

## IMPLEMENTATION REQUIREMENTS

### `includes/integrations/class-bookit-google-calendar-sync.php` — CREATE

New class `Bookit_Google_Calendar_Sync`. Single responsibility: listen to booking hooks and enqueue sync jobs.

---

**`public static function init(): void`**

Register the three hook listeners:

```php
add_action( 'bookit_after_booking_created',   [ self::class, 'on_booking_created' ],   10, 2 );
add_action( 'bookit_booking_rescheduled',     [ self::class, 'on_booking_rescheduled' ], 10, 2 );
add_action( 'bookit_after_booking_cancelled', [ self::class, 'on_booking_cancelled' ],  10, 2 );
```

---

**`public static function on_booking_created( int $booking_id, array $booking_data ): void`**

- Only enqueue if booking status is `confirmed` or `pending_payment` — read actual status values from `schema.sql` before assuming the exact strings
- Do NOT enqueue if status is `cancelled` or any other status
- Resolve the correct staff_id to use (see fallback logic below)
- If no usable staff_id found after fallback: log via `Bookit_Audit_Logger::log( 'google_calendar.sync_skipped', 'booking', $booking_id, [ 'notes' => 'no_connected_staff' ] )` and return
- Call `bookit_enqueue_calendar_sync( 'create', $booking_id )`

---

**`public static function on_booking_rescheduled( int $booking_id, array $booking_data ): void`**

- Resolve staff_id with fallback logic
- If no usable staff_id: log `sync_skipped` and return
- Call `bookit_enqueue_calendar_sync( 'update', $booking_id )`

---

**`public static function on_booking_cancelled( int $booking_id, array $booking_data ): void`**

- No status check needed — cancellation always triggers a delete
- No fallback logic needed — `delete_event()` reads `google_calendar_event_id` from the booking; if it is null there is nothing to delete
- Call `bookit_enqueue_calendar_sync( 'delete', $booking_id )`

---

**Fallback logic — `private static function resolve_staff_id( int $booking_staff_id ): ?int`**

```
1. Read google_calendar_connected for $booking_staff_id from wp_bookings_staff
2. If connected → return $booking_staff_id
3. If not connected:
   a. Read google_calendar_fallback_enabled from wp_bookings_settings
      (use $wpdb->get_var() — bookit_get_setting() does not exist)
   b. If fallback not enabled → return null
   c. If fallback enabled → query wp_bookings_staff for the first
      staff member where:
      - role = 'admin'  ← confirm exact role value from schema.sql
      - google_calendar_connected = 1
      ORDER BY id ASC LIMIT 1
   d. If found → return that staff member's id
   e. If not found → return null
```

> **Important:** `resolve_staff_id()` only determines whether a connected
> calendar exists. It does NOT need to pass the resolved staff_id into
> `bookit_enqueue_calendar_sync()` — `process_sync_job()` in Task 5 reads
> staff_id from the booking record in the DB. The fallback staff_id only
> matters to decide whether to enqueue at all.
>
> **Exception:** If fallback is used, `process_sync_job()` will still use
> the booking's original `staff_id` — which has no Google connection. This
> means the fallback calendar will NOT be used by `process_sync_job()` as
> currently written. Flag this as an architecture note and propose a
> solution before implementing. Do not silently implement the wrong
> behaviour.

---

### `includes/class-bookit-loader.php` — MODIFY

- Read the full file first
- Add `require_once` for `class-bookit-google-calendar-sync.php`
- Add `Bookit_Google_Calendar_Sync::init()` call alongside other `::init()` calls

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] `Bookit_Google_Calendar_Sync` created in `includes/integrations/`
- [ ] `require_once` and `::init()` registered in `class-bookit-loader.php`
- [ ] Hook listeners registered on `bookit_after_booking_created`, `bookit_booking_rescheduled`, `bookit_after_booking_cancelled`
- [ ] Status check on `on_booking_created` — only `confirmed` and `pending_payment`
- [ ] Fallback logic reads `google_calendar_fallback_enabled` from `wp_bookings_settings`
- [ ] Fallback finds first admin with `google_calendar_connected = 1`
- [ ] Audit log fired on `google_calendar.sync_skipped` when no connected staff found
- [ ] Architecture note raised on fallback staff_id not being passed to `process_sync_job()`

---

## PHPUNIT REQUIREMENTS

Baseline: **964 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-hook-listeners.php`

Required test cases:
- `test_booking_created_confirmed_enqueues_sync` — confirmed booking triggers `bookit_enqueue_calendar_sync('create', ...)`
- `test_booking_created_pending_payment_enqueues_sync` — pending_payment status also enqueues
- `test_booking_created_cancelled_does_not_enqueue` — cancelled status skips enqueue
- `test_booking_rescheduled_enqueues_update` — rescheduled hook triggers `update`
- `test_booking_cancelled_enqueues_delete` — cancelled hook triggers `delete`
- `test_fallback_used_when_staff_not_connected_and_enabled` — staff not connected, fallback enabled, admin connected → enqueues
- `test_sync_skipped_when_no_connected_staff_and_fallback_disabled` — staff not connected, fallback disabled → logs `sync_skipped`, no enqueue
- `test_sync_skipped_when_no_connected_staff_and_no_admin_fallback` — fallback enabled but no admin connected → logs `sync_skipped`

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Creating a confirmed booking enqueues a `create` calendar sync job
- [ ] Creating a `pending_payment` booking enqueues a `create` job
- [ ] Creating a `cancelled` booking does NOT enqueue anything
- [ ] Rescheduling a booking enqueues an `update` job
- [ ] Cancelling a booking enqueues a `delete` job
- [ ] Fallback admin calendar used when staff not connected and fallback enabled
- [ ] Sync skipped and audit logged when no connected calendar available

### Technical
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (964+ tests, 0 failures)
- [ ] Architecture note on fallback staff_id raised before implementation

### Must NOT break
- [ ] Email queue hooks unaffected
- [ ] Existing booking creation, reschedule, cancellation flows unaffected
- [ ] `Bookit_Google_Calendar` class unaffected

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 7: Google Calendar hook listeners + fallback logic

- class-bookit-google-calendar-sync.php: init(), on_booking_created,
  on_booking_rescheduled, on_booking_cancelled, resolve_staff_id (fallback)
- class-bookit-loader.php: require_once + ::init() call
- tests/unit/test-google-calendar-hook-listeners.php: 8 new tests

Tests: 964+ passing, 0 failures
```

---

> ⚠️ The fallback staff_id architecture issue flagged above MUST be raised as a report before any code is written. If you encounter any other architecture decision not covered above, **STOP and report back before writing any code.**