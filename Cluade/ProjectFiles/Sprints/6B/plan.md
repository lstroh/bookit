# SPRINT 6B-1: GOOGLE CALENDAR OAUTH
# Bookit Booking System — Sprint Implementation Chat
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/
# Live site: test.wimbledonsmart.co.uk (Hostinger, LiteSpeed)

---

## YOUR ROLE

You are the Sprint Implementation Assistant for the Google Calendar OAuth
feature of Bookit. This is a single-feature sprint task running in the live
environment. You generate Cursor-ready prompts, track completion, and escalate
to the Project Assistant (separate chat) if any architecture decision arises
not covered here.

---

## WORKFLOW RULES

- **Read before write.** Use GitHub connector to read every file before writing
  implementation guidance. Never assume file contents.
- **Additive only.** New code alongside existing — never modifying working code
  without explicit reason stated in this prompt.
- **Context7 for libraries.** Use Context7 to verify Google API PHP client
  library current API before writing any library-specific code.
- **Live environment.** OAuth redirect URIs must use the live domain
  `https://test.wimbledonsmart.co.uk`. OAuth app must be registered in Google
  Cloud Console before implementation begins.
- **Frontend builds.** After any Vue change: `npm run build` in
  `bookit-booking-system/dashboard/`. The `dist/` directory is gitignored.

---

## PROJECT CONTEXT

- **Test suite baseline:** 928 tests, 0 failures (Sprint 6A complete)
- **PHPUnit:** `cd bookit-booking-system && vendor/bin/phpunit`
- **Settings access:** Direct `$wpdb->get_var()` against `wp_bookings_settings`
  — `bookit_get_setting()` does not exist
- **Cron pattern:** Follow `includes/cron/class-bookit-package-expiry.php`
- **Extension hooks available:**
  - `bookit_after_booking_created` — fires with `($booking_id, $booking_data)`
  - `bookit_after_booking_cancelled` — fires with `($booking_id, $booking_data)`
  - `bookit_booking_rescheduled` — fires with `($booking_id, $booking_data)`
    (added Sprint 6A from `update_booking()` when date/time changes)
- **Key files:**
  - `includes/class-bookit-loader.php` — hook registration
  - `includes/class-bookit-activator.php` — activation tasks
  - `includes/class-bookit-deactivator.php` — deactivation tasks
  - `includes/api/class-dashboard-bookings-api.php` — REST controller pattern
  - `dashboard/src/views/MyProfile.vue` — staff profile page
  - `dashboard/src/components/StaffFormModal.vue` — staff edit form
  - `dashboard/src/router/index.js` — Vue router
  - `database/migrations/0017-*.php` — most recent migration (next is 0018)

---

## FEATURE SCOPE

### What this delivers

One-way Google Calendar sync: Bookit → Google Calendar. When a booking is
created, updated, or cancelled, the assigned staff member's Google Calendar
is updated automatically.

**Not in scope:** Two-way sync (Google → Bookit), reading availability from
Google Calendar, shared business calendars as primary (per-staff only in
this sprint), Google Meet link generation (Bookit Meetings extension —
separate plugin).

---

## ARCHITECTURE

### Per-staff OAuth credentials

Each staff member connects their own personal Google account. The plugin
stores their OAuth tokens encrypted in the database. An admin can also
connect a business-level fallback calendar used for bookings where the
assigned staff member has not connected Google.

### One-way sync events

| Bookit event | Google Calendar action |
|-------------|----------------------|
| Booking created (confirmed/POA) | Create calendar event |
| Booking rescheduled (date/time changed) | Update existing event |
| Booking cancelled | Delete event |

### Token storage

New columns on `wp_bookings_staff` (migration 0018):
```sql
google_oauth_access_token  TEXT NULL  -- encrypted
google_oauth_refresh_token TEXT NULL  -- encrypted
google_oauth_token_expiry  DATETIME NULL
google_calendar_connected  TINYINT(1) DEFAULT 0
```

New column on `wp_bookings` (migration 0019):
```sql
google_calendar_event_id VARCHAR(255) NULL DEFAULT NULL
```
Note: `google_calendar_event_id` is already in `schema.sql` and
`class-bookit-database.php` as a planned column — check whether it already
exists before adding migration. If it exists, migration 0019 is not needed.

### Encryption

Use WordPress's `wp_salt()` + `openssl_encrypt()` / `openssl_decrypt()` with
`AES-256-CBC`. Create a helper class `Bookit_Encryption` in
`includes/utils/class-bookit-encryption.php`. Do not store tokens in plain
text under any circumstances.

### Google API PHP Client Library

Install via Composer: `google/apiclient:^2.0`

**Use Context7 to verify the current `google/apiclient` v2 API before writing
any implementation.** Key classes expected (verify via Context7):
- `Google\Client` — OAuth client
- `Google\Service\Calendar` — Calendar service
- `Google\Service\Calendar\Event` — event creation/update

---

## TASK BREAKDOWN

### Task 1 — Google Cloud Console setup (manual steps, no code)

Before any code is written, Liron must complete these steps:

1. Go to `console.cloud.google.com` → New Project → name it "Bookit Calendar"
2. Enable **Google Calendar API** for the project
3. Configure **OAuth consent screen**:
   - User type: External
   - App name: Bookit Booking System
   - Support email: your email
   - Authorised domains: `wimbledonsmart.co.uk`
   - Scopes: `https://www.googleapis.com/auth/calendar.events`
4. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorised redirect URIs:
     `https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/google-calendar/callback`
5. Copy **Client ID** and **Client Secret** — these go in plugin settings

Report back when Task 1 is complete before proceeding to Task 2.

---

### Task 2 — DB migrations + Composer dependency

**Migration 0018** — add OAuth token columns to `wp_bookings_staff`:
- `google_oauth_access_token TEXT NULL`
- `google_oauth_refresh_token TEXT NULL`
- `google_oauth_token_expiry DATETIME NULL`
- `google_calendar_connected TINYINT(1) DEFAULT 0 NOT NULL`
- Use `column_exists()` via `information_schema.tables` (not `SHOW COLUMNS LIKE`
  — MariaDB underscore wildcard issue confirmed in Sprint 6A)

**Migration 0019** — add `google_calendar_event_id` to `wp_bookings` IF it
does not already exist. Read `includes/class-bookit-database.php`
`create_bookings_table()` and `database/schema.sql` to confirm current state
before writing this migration.

**Composer:** Add `"google/apiclient": "^2.0"` to `composer.json` require.
Run `composer update google/apiclient` locally. Commit the updated
`composer.json` and `composer.lock`. Remember: `vendor/` is gitignored —
must be rebuilt before deploying.

**Files to read first:**
1. `database/migrations/0017-*.php` — pattern to follow
2. `includes/class-bookit-database.php` — confirm `google_calendar_event_id`
   column existence
3. `database/schema.sql` — confirm current state

---

### Task 3 — Settings: Google Calendar credentials

Add to Dashboard → Settings (read current `Settings.vue` to find right location
— likely a new "Integrations" card):

- Google Client ID (string, not sensitive — displayed in plain text)
- Google Client Secret (string, sensitive — masked as 'SAVED' pattern,
  same as Brevo API key and Stripe keys)
- Business fallback calendar toggle (on/off — when on, use the admin staff
  member's connected calendar for bookings where assigned staff has no
  Google connection)

Setting keys in `wp_bookings_settings`:
- `google_client_id`
- `google_client_secret`
- `google_calendar_fallback_enabled`

Add all three to `get_allowed_settings_keys()` in
`class-dashboard-bookings-api.php`. `google_client_secret` must follow
the sensitive key masking pattern (read how `brevo_api_key` and Stripe keys
are masked in `get_settings()` before implementing).

**Files to read first:**
1. `dashboard/src/views/Settings.vue` — full file, find correct section
2. `includes/api/class-dashboard-bookings-api.php` — `get_allowed_settings_keys()`,
   `is_sensitive_setting_key()`, masked key pattern in `get_settings()`

---

### Task 4 — OAuth connect/disconnect flow (per staff)

**My Profile → Google Calendar section** (new card in `MyProfile.vue`):

```
┌─────────────────────────────────────────┐
│ Google Calendar                         │
│ Sync your bookings to your Google       │
│ Calendar automatically                  │
├─────────────────────────────────────────┤
│ Status: ● Connected (sarah@gmail.com)   │
│         ○ Not connected                 │
│                                         │
│  [Connect Google Calendar]              │
│  [Disconnect]  (when connected)         │
└─────────────────────────────────────────┘
```

**Connect flow:**
1. Staff clicks "Connect Google Calendar"
2. Vue calls `GET bookit/v1/google-calendar/auth-url` — returns the Google
   OAuth authorisation URL
3. Vue opens the URL in a new tab (or redirects)
4. Staff grants permission in Google's consent screen
5. Google redirects to:
   `https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/google-calendar/callback?code=X&state=Y`
6. Callback endpoint exchanges code for tokens, encrypts and stores them,
   redirects to `/bookit-dashboard/app/profile` with `?google_connected=1`
7. My Profile page reads query param and shows success banner

**New REST endpoints:**

`GET bookit/v1/google-calendar/auth-url`
- Auth: dashboard session required
- Generates OAuth URL with `state` param containing staff_id (signed with
  `wp_create_nonce('google_oauth_' . $staff_id)` to prevent CSRF)
- Returns `{ url: "https://accounts.google.com/o/oauth2/..." }`

`GET bookit/v1/google-calendar/callback`
- Auth: public (Google redirects here — no session)
- Validates `state` nonce
- Exchanges `code` for access + refresh tokens via Google API client
- Encrypts tokens using `Bookit_Encryption`
- Stores in `wp_bookings_staff` columns
- Sets `google_calendar_connected = 1`
- Stores connected Google account email (display only) in a new
  `google_calendar_email VARCHAR(255) NULL` column (add to migration 0018)
- Redirects to `/bookit-dashboard/app/profile?google_connected=1`

`POST bookit/v1/dashboard/profile/google-calendar/disconnect`
- Auth: dashboard session required
- Clears token columns, sets `google_calendar_connected = 0`
- Returns `{ success: true }`

**GET profile response extension:**
Extend `GET bookit/v1/dashboard/profile` to include:
```json
{
  "google_calendar_connected": true,
  "google_calendar_email": "sarah@gmail.com"
}
```

**Files to read first:**
1. `dashboard/src/views/MyProfile.vue` — full file, find insertion point
2. `includes/api/` — read an existing controller for the REST route pattern
3. `includes/class-bookit-auth.php` — `is_authenticated()` and session pattern

---

### Task 5 — Token refresh helper

Google access tokens expire after 1 hour. Before any Calendar API call, the
plugin must check token expiry and refresh if needed.

New class `includes/integrations/class-bookit-google-calendar.php`:

```php
class Bookit_Google_Calendar {

    public static function get_client_for_staff( int $staff_id ): ?Google\Client {
        // 1. Read tokens from DB
        // 2. Decrypt via Bookit_Encryption
        // 3. If access_token expired (google_oauth_token_expiry < now):
        //    - Use refresh_token to get new access_token
        //    - Update DB with new access_token and expiry
        // 4. Return configured Google\Client or null if no tokens
    }

    public static function create_event( int $booking_id, array $booking ): ?string {
        // Returns created event ID or null on failure
    }

    public static function update_event( int $booking_id, array $booking ): void {}

    public static function delete_event( int $booking_id ): void {}
}
```

All Calendar API calls must be wrapped in try/catch. Failures must:
- Log via `Bookit_Audit_Logger::log('google_calendar.sync_failed', ...)`
- NOT throw exceptions that block the booking flow
- Return gracefully — a calendar sync failure must never prevent a booking
  from being created or cancelled

**Use Context7 to verify:**
- `google/apiclient` v2 token refresh pattern
- `Google\Service\Calendar\Event` constructor and field names
- How to set event summary, description, start, end, location

---

### Task 6 — Event content

**Calendar event format:**

```
Title:       {service_name} — {customer_first} {customer_last}
Start:       {booking_date} {start_time} (business timezone)
End:         {booking_date} {end_time} (business timezone)
Description: Booking ref: {booking_reference}
             Customer: {customer_first} {customer_last}
             Phone: {customer_phone}
             Special requests: {special_requests} (omit if empty)
Location:    {business_name} (from wp_bookings_settings)
```

Use `get_option('timezone_string')` for business timezone. Convert to
`DateTime` with `DateTimeZone` before passing to Google API. Google expects
RFC 3339 format with timezone.

---

### Task 7 — Hook listeners

New class `includes/integrations/class-bookit-google-calendar-sync.php`
(separate from the API class — single responsibility):

Hook into:
- `bookit_after_booking_created` → `Bookit_Google_Calendar::create_event()`
  — only if booking status is `confirmed` or `pending_payment` (not if
  `cancelled`)
- `bookit_booking_rescheduled` → `Bookit_Google_Calendar::update_event()`
  — reads existing `google_calendar_event_id` from DB
- `bookit_after_booking_cancelled` → `Bookit_Google_Calendar::delete_event()`
  — reads existing `google_calendar_event_id` from DB

**Fallback logic:**
If assigned staff has no Google connection (`google_calendar_connected = 0`):
- Check `google_calendar_fallback_enabled` setting
- If enabled, find the first admin-role staff member with
  `google_calendar_connected = 1` and use their calendar
- If no fallback available, skip silently + audit log

Register `Bookit_Google_Calendar_Sync::init()` in `class-bookit-loader.php`
alongside other `::init()` calls.

**Files to read first:**
1. `includes/class-bookit-loader.php` — where to add `::init()` call
2. `includes/class-bookit-audit-logger.php` — `log()` signature

---

### Task 8 — Staff edit form: Google Calendar status (admin view)

Admin should be able to see (read-only) whether a staff member has connected
their Google Calendar, and be able to disconnect it on their behalf.

In `StaffFormModal.vue` (edit mode only), add a read-only Google Calendar
status row below the notification preferences section:

```
Google Calendar:  ● Connected (sarah@gmail.com)  [Disconnect]
                  ○ Not connected
```

"Disconnect" fires `POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect`
— admin-only endpoint that clears the tokens for the specified staff member.

New endpoint: `POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect`
- Admin only (`check_admin_permission`)
- Clears token columns and `google_calendar_connected = 0` for the specified
  staff_id

Extend `GET bookit/v1/dashboard/staff/{id}` response to include:
```json
{
  "google_calendar_connected": true,
  "google_calendar_email": "sarah@gmail.com"
}
```

**Files to read first:**
1. `dashboard/src/components/StaffFormModal.vue` — full file
2. `includes/api/class-dashboard-bookings-api.php` — `get_staff()` and
   `update_staff()` response shape

---

## PHPUnit REQUIREMENTS

Baseline: 928 tests, 0 failures.

**Mock strategy:** All Google API calls must be mockable. `Bookit_Google_Calendar`
must accept an optional injected `Google\Client` instance (or use a static
setter for tests) so unit tests never make real HTTP calls.

New test file: `tests/unit/test-google-calendar-sync.php`

Required test cases:
- `test_migration_adds_oauth_columns_to_staff_table`
- `test_create_event_called_on_booking_created`
- `test_update_event_called_on_booking_rescheduled`
- `test_delete_event_called_on_booking_cancelled`
- `test_sync_skips_gracefully_when_staff_not_connected`
- `test_fallback_calendar_used_when_enabled`
- `test_sync_failure_does_not_block_booking_creation`
- `test_token_refresh_updates_db_when_expired`
- `test_disconnect_clears_token_columns`
- `test_auth_url_endpoint_requires_authentication`
- `test_callback_validates_state_nonce`

---

## DEPLOYMENT CHECKLIST

Before deploying to live site after all tasks pass PHPUnit:

1. `composer install --no-dev --optimize-autoloader` (rebuilds vendor/ with
   google/apiclient)
2. `npm run build` in `dashboard/`
3. Zip and deploy to Hostinger
4. Verify migrations 0018 and 0019 ran (check `wp_bookings_migrations` table)
5. Enter Google Client ID and Client Secret in Dashboard → Settings
6. As a staff member, click "Connect Google Calendar" and complete OAuth flow
7. Create a test booking — confirm event appears in connected Google Calendar
8. Reschedule the booking — confirm event updates
9. Cancel the booking — confirm event deletes

---

## ACCEPTANCE CRITERIA

- [ ] Staff can connect their Google account via OAuth in My Profile
- [ ] Connected status and email shown in My Profile and Staff edit form
- [ ] Admin can disconnect a staff member's calendar
- [ ] New booking creates a calendar event for the assigned staff member
- [ ] Rescheduled booking updates the existing calendar event
- [ ] Cancelled booking deletes the calendar event
- [ ] Fallback calendar used when staff not connected and fallback enabled
- [ ] Calendar sync failure never blocks booking creation or cancellation
- [ ] OAuth tokens stored encrypted, never plain text
- [ ] Token refresh works automatically before expiry
- [ ] PHPUnit: 928+ tests, 0 failures
- [ ] No PHP warnings or notices

---

## START HERE

1. Confirm you have read and understood this prompt
2. Confirm Task 1 (Google Cloud Console setup) is complete before proceeding
3. Once confirmed, start with Task 2 (DB migrations + Composer)
4. Work through tasks in order — each confirmed before moving to next

If anything contradicts what you find in project files via GitHub connector,
flag it before writing any code.