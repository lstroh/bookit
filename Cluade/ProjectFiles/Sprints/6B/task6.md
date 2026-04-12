Task 6 is the calendar event content format. Since the core implementation is already inside `create_event()` and `update_event()` in Task 5, this task is purely a **verification and refinement prompt** — making sure the event content is exactly right before Task 7 wires the hooks.Good. Context7 confirms the `Google\Service\Calendar` class patterns. Now here is the Task 6 prompt:

---

# TASK 6 OF 8: Calendar Event Content — Verify & Refine
**Sprint: 6B-1 | Est: 1h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/integrations/class-bookit-google-calendar.php` — full file; read `create_event()`, `update_event()`, `process_sync_job()` — understand exactly what booking data is available and how the event is currently built
2. `database/schema.sql` — confirm column names on `wp_bookings`, `wp_bookings_services`, `wp_bookings_staff`, and customer table
3. `includes/api/class-dashboard-bookings-api.php` — find an existing booking query that joins bookings + service + customer + staff — use the same join pattern in `process_sync_job()` if not already done

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 5 implemented `create_event()` and `update_event()` with event content fields. This task verifies the event content is complete and correct, and refines anything that does not match the specified format. No new classes or files are created — this is a targeted review and fix pass on `class-bookit-google-calendar.php` only.

---

## VERIFICATION CHECKLIST

Read `create_event()` and `process_sync_job()` carefully and verify each item below. For any item that does not match, make the correction:

---

### Event Fields

**Summary (title):**
```
{service_name} — {customer_first} {customer_last}
```
- Em dash (`—`) not hyphen (`-`)
- Confirm `service_name` comes from `wp_bookings_services`
- Confirm `customer_first` and `customer_last` are the customer's name fields — check actual column names in the DB schema before assuming

**Start and End:**
- `Google\Service\Calendar\EventDateTime` used for both
- `setDateTime()` called with RFC 3339 formatted string
- `setTimeZone()` called with `get_option('timezone_string') ?: 'UTC'`
- Date and time assembled from `wp_bookings` columns — confirm exact column names (`booking_date`? `date`? `start_time`? `time_from`?) by reading schema.sql

**Description — exact format required:**
```
Booking ref: {booking_reference}
Customer: {customer_first} {customer_last}
Phone: {customer_phone}
Special requests: {special_requests}
```
- `Special requests:` line must be **omitted entirely** when `special_requests` is empty or null — not shown as blank
- Confirm actual column names for `booking_reference`, `customer_phone`, `special_requests` in schema
- Use `\n` between lines (not `<br>` — Google Calendar description is plain text)

**Location:**
- Set to business name from `wp_bookings_settings` key `business_name`
- If `business_name` is empty, omit `setLocation()` entirely — do not set an empty string

**Reminders:**
- Add a 15-minute popup reminder so staff get a notification before the appointment:
```php
$reminder = new Google\Service\Calendar\EventReminder();
$reminder->setMethod( 'popup' );
$reminder->setMinutes( 15 );

$reminders = new Google\Service\Calendar\EventReminders();
$reminders->setUseDefault( false );
$reminders->setOverrides( [ $reminder ] );

$event->setReminders( $reminders );
```

> **Note:** Before implementing reminders, use Context7 to resolve
> `google-api-php-client` and confirm `EventReminder`, `EventReminders`
> class names and setter signatures.

**Color:**
- Set event color to blue (Google Calendar colorId `7`) so Bookit events are visually distinct:
```php
$event->setColorId( '7' );
```

---

### process_sync_job() — booking data query

Verify the query in `process_sync_job()` fetches all required fields:
- `staff_id` from `wp_bookings`
- `date` / `start_time` / `end_time` — confirm exact column names
- `service_name` — joined from `wp_bookings_services`
- `customer_first`, `customer_last`, `customer_phone` — joined from customer table; confirm exact table and column names
- `booking_reference` — from `wp_bookings`
- `special_requests` — from `wp_bookings`; confirm column exists

If any field is missing from the current query, add it. If any column name is wrong, correct it. Read `schema.sql` and the existing booking query pattern in `class-dashboard-bookings-api.php` before writing any SQL.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/integrations/class-bookit-google-calendar.php` — MODIFY ONLY IF NEEDED

Make corrections only for items that fail the verification checklist above. Do not refactor or restructure anything that is already correct.

Specific additions required regardless of current state:
- Add **reminders** (15-minute popup) to `create_event()` and `update_event()`
- Add **colorId `7`** (blue) to `create_event()` and `update_event()`
- Ensure **location is omitted** when `business_name` is empty

---

## PHPUNIT REQUIREMENTS

Baseline: **958 tests, 0 failures** — must not regress.

Update `tests/unit/test-google-calendar-sync.php`:

- `test_event_summary_format` — assert summary is `{service_name} — {customer_first} {customer_last}` with em dash
- `test_event_description_omits_special_requests_when_empty` — assert description does not contain `Special requests:` line when field is empty
- `test_event_description_includes_special_requests_when_present` — assert line present when field has a value
- `test_event_has_15_minute_popup_reminder` — assert reminders set correctly on the event object
- `test_event_color_is_blue` — assert `colorId` is `'7'`
- `test_event_location_omitted_when_business_name_empty` — assert `setLocation()` not called when business name is empty string

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Event title uses em dash and correct name fields
- [ ] Start and end use correct date/time columns with RFC 3339 format and business timezone
- [ ] Description includes booking ref, customer name, phone
- [ ] Special requests line omitted when empty
- [ ] Location set to business name or omitted if empty
- [ ] 15-minute popup reminder added to every event
- [ ] Event colour set to blue (colorId `7`)

### Technical
- [ ] All column names verified against `schema.sql` — no assumptions
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (958+ tests, 0 failures)

### Must NOT break
- [ ] Token refresh logic in `get_client_for_staff()` unaffected
- [ ] `delete_event()` unaffected
- [ ] OAuth connect/disconnect flow unaffected

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 6: Refine Google Calendar event content

- create_event/update_event: add 15-min popup reminder, colorId 7 (blue)
- description: omit special requests line when empty
- location: omit setLocation when business_name is empty
- process_sync_job: verify all booking data fields against schema
- tests: event content assertions (summary, description, reminders, color, location)

Tests: 958+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**