# Bookit Meetings — Extension Plugin Project Initialisation
**Created:** March 2026
**Plugin slug:** bookit-meetings
**Plugin name:** Bookit Meetings
**Text domain:** bookit-meetings
**Requires core:** 1.0.0+
**Status:** Core pre-task ✅ complete — ready to begin extension sprint


Need to add:
In every extraction use a name for that plugin extntion, as there might be other extractions. This should be for every function,class, DB migration and so on.
I have access to the core plugin and other extractions if you have any question or not sure about code from the core plugin please ask.


---

## 1. What this extension does

Adds online meeting link support to Bookit bookings. When a service is
configured as "online", the extension auto-generates or stores a meeting
link (Zoom, Google Meet, WhatsApp, Teams, or generic URL) and delivers it
to the customer via the booking confirmation page and confirmation email.
Admins can override or manually set the meeting link per booking from the
dashboard.

---

## 2. Parent plugin context

- **Core plugin:** bookit-booking-system (repo: lstroh/bookit-imp, branch: Phase1)
- **Core plugin current test baseline:** 706 tests, 0 failures
- **Extension API contract:** Extension_Plugin_API_Spec.md
- **Core architecture:** System_Architecture_Document_PART1_Sections_1-8.md
- **Business context:** BusinessContext.md
- **Latest core sprint summary:** sprint4d-summary-and-decisions.md

### Core infrastructure already available

The core plugin exposes the following that this extension will use:

| Infrastructure | How the extension uses it |
|---|---|
| `bookit_register_extension()` | Register on `plugins_loaded` priority 5 |
| `Bookit_Migration_Runner` | Run extension migrations on activation |
| `bookit_register_migration_path()` | Point runner at extension migrations/ |
| `Bookit_Logger` | Log OAuth errors, link generation failures |
| `bookit_after_booking_created` | Hook to auto-generate meeting link |
| `bookit_booking_response` filter | Append `meeting_link` to booking API responses |
| `bookit_dashboard_js_data` filter | Pass `meetings` config/flags to Vue dashboard |
| `bookit_dashboard_loaded` action | Enqueue extension Vue app assets |
| `bookit_register_nav_item()` | Add "Meetings" to dashboard sidebar |
| `Bookit_Auth::is_authenticated()` | Auth check for extension REST endpoints |

### Core hooks added by pre-task ✅

The following hooks were added to core as a pre-task (committed March
2026, 706 tests, 0 failures). They are ready for the extension to consume:

| Hook | File | Purpose |
|---|---|---|
| `do_action( 'bookit_after_booking_confirmed', $booking_id, $booking )` | `public/templates/booking-confirmed.php` | Fires after emails sent and session cleared; extension uses to generate/store link as fallback |
| `apply_filters( 'bookit_confirmation_meeting_section', '', $booking )` | `public/templates/booking-confirmed.php` | Extension returns "Join Meeting" HTML block; empty string = nothing rendered |
| `apply_filters( 'bookit_email_meeting_section', '', $booking )` | `includes/email/class-email-sender.php` | Extension returns meeting link row HTML; empty string = nothing in email |

These hooks have no consumers in core. The confirmation page and email
are byte-for-byte identical to pre-hook state when the extension is not
active.

---

## 3. Architecture decisions

### Storage — where meeting data lives

This extension owns its own database tables for OAuth credentials and
platform settings. The core plugin's existing columns are used for
meeting data that belongs naturally to core records:

| Data | Location | Owner |
|---|---|---|
| `meeting_type` on services (`none` / `online` / `in_person`) | `wp_bookings_services` column | **This extension** (migration 0001) |
| `preferred_platform` on services | `wp_bookings_services` column | **This extension** (migration 0001) |
| `default_meeting_link` on services | `wp_bookings_services` column | **This extension** (migration 0001) |
| `meeting_link` on bookings | `wp_bookings` column | **This extension** (migration 0002) |
| OAuth credentials per staff | `wp_bookit_meetings_credentials` | **This extension** (migration 0003) |
| OAuth tokens per staff | `wp_bookit_meetings_tokens` | **This extension** (migration 0003) |

> **Note on migration numbering:** These are extension-owned migrations,
> numbered from 0001 within the extension's own migrations/ directory.
> They are completely separate from core migrations (which are at 0009
> after Sprint 4E). The `SHOW COLUMNS` idempotency guard pattern
> (private `column_exists()` helper) must be used for column additions,
> as established during Sprint 4F Task 1 work.

### Link generation strategy

- Auto-generate link if platform OAuth is connected for that staff member
  or the business; fall back to manual entry if not
- Manual entry always works regardless of OAuth state — the extension
  never blocks a booking because OAuth is unavailable
- Staff-level OAuth credentials preferred; business-level credentials
  as fallback
- Per-service default (`meeting_type`, `preferred_platform`,
  `default_meeting_link`) is the base config; admin can override the
  link per booking from the dashboard

### Per-platform strategy

| Platform | Link generation | OAuth required |
|---|---|---|
| Zoom | Auto-generate via Zoom API | Yes (per staff or business) — Phase 2 |
| Google Meet | Auto-generate via Google Calendar API | Yes (per staff or business) — Phase 2 |
| WhatsApp | Construct `wa.me/{phone}` from staff phone number | No — Phase 1 |
| Microsoft Teams | Manual link entry only in Phase 1 | No — Phase 1 |
| Generic URL | Store and display any meeting URL | No — Phase 1 |

### Confirmation page and email

- Extension hooks `bookit_confirmation_meeting_section` filter to inject
  a "Join Meeting" button block into the confirmation page
- Extension hooks `bookit_email_meeting_section` filter to inject a
  meeting link row into the confirmation email
- Core renders the output of these filters — core itself has no
  meeting-specific HTML
- If no meeting link exists, nothing is injected and the page/email
  render exactly as they did before the extension was installed

### Dashboard UI

- Service settings UI ("Online Meeting" section with toggle, platform
  selector, default link) lives entirely in the extension
- The extension injects this UI when active; core ServiceFormModal has
  no meeting fields at all
- Booking detail view meeting link display and admin override field
  live in the extension
- Extension has its own dashboard settings page (OAuth connection status,
  business-level credentials)

---

## 4. Extension plugin structure

```
bookit-meetings/
├── bookit-meetings.php                        # Main plugin file
├── composer.json
├── includes/
│   └── class-bookit-meetings-loader.php       # Registers all hooks
├── database/
│   └── migrations/
│       ├── 0001-add-meeting-columns-to-services.php
│       ├── 0002-add-meeting-link-to-bookings.php
│       └── 0003-add-meetings-credentials-tables.php
├── api/
│   ├── class-meetings-settings-api.php        # OAuth + settings endpoints
│   └── class-meetings-booking-api.php         # Per-booking link CRUD
└── dashboard/
    ├── src/
    │   ├── main.js
    │   ├── App.vue
    │   └── views/
    │       └── MeetingsSettings.vue
    └── dist/                                  # Gitignored in dev
```

---

## 5. Core hooks pre-task ✅ COMPLETE

**Committed:** March 2026
**Core test suite:** 706 tests, 0 failures (no regression)

The three hooks described in §2 above are in place. No further core
changes are needed before the extension sprint begins.

**Verified:**
- Confirmation page renders identically with no extension active
- Confirmation email renders identically with no extension active
- Full PHPUnit suite passes at 706 tests, 0 failures

---

## 6. Error codes (extension-owned)

Register these in the extension's own error handling (not in the core
error registry). Use the extension namespace prefix:

| Code | Meaning | HTTP |
|---|---|---|
| `EM001` | Meeting link not found | 404 |
| `EM002` | OAuth credentials not configured | 422 |
| `EM003` | Meeting platform API error | 502 |
| `EM004` | Invalid meeting link URL | 400 |
| `EM005` | Meeting type not supported | 422 |

---

## 7. Sprint scope — full task breakdown

Estimated total: **~24h** (Phase 1 — manual links + WhatsApp + Teams +
confirmation delivery). OAuth auto-generation (Zoom + Google Meet) is
Phase 2 and requires the live staging environment.

---

### TASK 1 — Plugin scaffold + registration (~2h)

**Deliverables:**
- `bookit-meetings.php` main plugin file with correct header, constants,
  activation hook, deactivation hook, `plugins_loaded` registration
- Registration via `bookit_register_extension()` at priority 5
- Graceful bail if core is not active or version is incompatible
- `class-bookit-meetings-loader.php` with `init()` method (empty stubs
  for all hook registrations — wired up in later tasks)
- `composer.json` (no dependencies yet)
- PHPUnit bootstrap file and `phpunit.xml`

**PHPUnit tests:**
- Extension registers successfully when core is active
- Extension bails gracefully when `bookit_register_extension()` does not exist
- Extension bails gracefully when core version is too old

**Acceptance criteria:**
- Plugin activates and deactivates without PHP errors
- Appears in the Active Extensions list in the core dashboard
- PHPUnit suite bootstraps and passes

---

### TASK 2 — Database migrations (~2h)

**Migration 0001** — Add meeting columns to `wp_bookings_services`:
```sql
ALTER TABLE wp_bookings_services
  ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'none'
      COMMENT 'none | online | in_person',
  ADD COLUMN preferred_platform VARCHAR(20) NULL
      COMMENT 'zoom | google_meet | whatsapp | teams | generic',
  ADD COLUMN default_meeting_link VARCHAR(2048) NULL
      COMMENT 'Optional default meeting link for this service';
```

**Migration 0002** — Add `meeting_link` to `wp_bookings`:
```sql
ALTER TABLE wp_bookings
  ADD COLUMN meeting_link VARCHAR(2048) NULL
      COMMENT 'Meeting URL for online bookings';
```

**Migration 0003** — Create extension-owned credential/token tables:
```sql
CREATE TABLE wp_bookit_meetings_credentials (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scope          VARCHAR(20) NOT NULL COMMENT 'staff | business',
    staff_id       BIGINT UNSIGNED NULL,
    platform       VARCHAR(20) NOT NULL,
    client_id      TEXT NOT NULL,
    client_secret  TEXT NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE wp_bookit_meetings_tokens (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    credential_id  BIGINT UNSIGNED NOT NULL,
    access_token   TEXT NOT NULL,
    refresh_token  TEXT NULL,
    expires_at     DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

All migrations must use `column_exists()` / `CREATE TABLE IF NOT EXISTS`
idempotency guards. `down()` must be the exact inverse of `up()`.

**PHPUnit tests:**
- All three migrations up/down/idempotent
- Default value of `meeting_type` is `'none'` after migration 0001

---

### TASK 3 — Services API extension + ServiceFormModal UI (~3h)

Extends the core services API response to include meeting fields, and
adds the Online Meeting configuration UI to the service form — both
owned by this extension.

**PHP — hook into `bookit_booking_response` filter:**
Append meeting fields to every service response returned by the core API.

**Vue — inject Online Meeting section into ServiceFormModal:**
The extension enqueues a Vue component via `bookit_dashboard_loaded`
that renders the Online Meeting section:

```
[Toggle] This is an online service
  Platform: ○ Zoom ○ Google Meet ○ WhatsApp ○ Teams ○ Generic URL
  Default Meeting Link (optional) [input]
```

On save, calls the core `PUT /dashboard/services/{id}` endpoint with
`meeting_type`, `preferred_platform`, `default_meeting_link`.

> **Note:** Confirm whether the core services PUT/POST route args still
> accept `meeting_type`, `preferred_platform`, `default_meeting_link`
> after the Sprint 4F revert. If those args were removed from
> `class-dashboard-bookings-api.php`, they must be re-added to core
> before this task can be completed.

**PHPUnit tests:**
- Service API response includes meeting fields after extension is active
- Saving `meeting_type=none` clears platform and link

---

### TASK 4 — Booking link generation on creation (~2h)

Hook `bookit_after_booking_created` to generate or store the meeting
link when a new booking is created.

**Logic:**
1. Look up `meeting_type` for this booking's `service_id`
2. If `meeting_type != 'online'` → do nothing
3. Switch on `preferred_platform`:
   - `whatsapp` → construct `wa.me/{staff_phone}` from staff phone
   - `teams` / `generic` → use `default_meeting_link` from service
   - `zoom` / `google_meet` → Phase 2; use `default_meeting_link` as
     fallback if set, otherwise NULL
4. If a link was determined → write to `wp_bookings.meeting_link`
   via `$wpdb` UPDATE
5. Log success or failure via `Bookit_Logger`

**PHPUnit tests:**
- WhatsApp booking creates correct `wa.me/` link
- Teams booking stores `default_meeting_link` from service
- Generic booking stores `default_meeting_link` from service
- Non-online service booking leaves `meeting_link` NULL
- Missing staff phone for WhatsApp → `meeting_link` NULL, error logged

---

### TASK 5 — Booking API: meeting_link in responses + admin override (~2h)

**PHP — hook `bookit_booking_response` filter:**
Append `meeting_link` to every booking API response.

**PHP — REST endpoint for admin override:**
Register `PUT bookit-meetings/v1/bookings/{id}/meeting-link` under
the extension namespace. Requires admin permission via `Bookit_Auth`.

**Vue — booking detail view:**
Extension adds a "Meeting Link" row to the booking detail display
(clickable, opens in new tab) and an editable override field for admins.

**PHPUnit tests:**
- `bookit_booking_response` filter appends `meeting_link`
- PUT endpoint saves link correctly
- PUT endpoint with empty string clears the link
- PUT endpoint blocked for staff role (admin only)
- PUT endpoint returns 404 for unknown booking ID

---

### TASK 6 — Confirmation page + email injection (~2h)

Hook the three core filters added in the pre-task (§5).

**`bookit_after_booking_confirmed`:** Fallback link generation if
`meeting_link` is still NULL when confirmation page loads.

**`bookit_confirmation_meeting_section`:** Return "Join Meeting" HTML
block when `meeting_link` is set; empty string when not.

**`bookit_email_meeting_section`:** Return meeting link row HTML for
the confirmation email when `meeting_link` is set.

**PHPUnit tests:**
- Filter returns non-empty HTML when booking has `meeting_link`
- Filter returns empty string when booking has no `meeting_link`
- Confirmation page renders Join Meeting block end-to-end (integration)

---

### TASK 7 — Meetings settings dashboard page (~3h)

Vue 3 page at `/bookit-dashboard/app/meetings` showing:
- Connection status per platform per staff (Zoom, Google Meet)
- "Connect" button placeholder for Phase 2 OAuth
- Business-level fallback credential status
- WhatsApp: confirm staff phone field is populated
- Teams/Generic: reminder to set `default_meeting_link` on services

Registered via `bookit_register_nav_item()`:
```php
[
    'label'    => 'Meetings',
    'route'    => '/bookit-dashboard/app/meetings',
    'icon'     => 'video',
    'position' => 75,
    'slug'     => 'bookit-meetings',
]
```

**PHPUnit tests:**
- Settings endpoint returns expected structure
- Nav item registered when extension is active

---

### TASK 8 — PHPUnit suite completion + sign-off (~2h)

- Audit all tasks for missing coverage
- Add any missing edge case tests
- Run full joint suite (core + extension)
- Manual testing checklist sign-off

---

## 8. Sprint-level acceptance criteria

### Database
- [ ] `wp_bookings_services` has `meeting_type`, `preferred_platform`,
      `default_meeting_link` (extension migration 0001)
- [ ] `wp_bookings` has `meeting_link` (extension migration 0002)
- [ ] Credential/token tables created (extension migration 0003)
- [ ] All migrations idempotent and roll back cleanly
- [ ] Plugin deactivation rolls back extension migrations cleanly

### Service configuration
- [ ] Service form shows "Online Meeting" section when extension active
- [ ] Toggle OFF → platform and link hidden; saving clears them
- [ ] Toggle ON → platform selector and default link field visible
- [ ] Saving stores all three fields via core API

### Booking link generation
- [ ] WhatsApp booking: `wa.me/{staff_phone}` link stored
- [ ] Teams booking: `default_meeting_link` from service stored
- [ ] Generic URL booking: `default_meeting_link` from service stored
- [ ] Non-online service: `meeting_link` remains NULL
- [ ] Zoom/Google Meet (no OAuth): falls back to `default_meeting_link`

### Confirmation page
- [ ] Booking with `meeting_link` shows "Join Meeting" button
- [ ] Booking without `meeting_link` shows nothing extra
- [ ] Page identical to pre-extension when no link present

### Confirmation email
- [ ] Booking with `meeting_link` shows "Meeting Link" row
- [ ] Booking without `meeting_link` shows nothing extra
- [ ] Email identical to pre-extension when no link present

### Dashboard
- [ ] Booking detail shows meeting link (clickable)
- [ ] Admin can set/edit meeting link via override endpoint
- [ ] Staff role blocked from override endpoint
- [ ] Meetings settings page loads without errors
- [ ] "Meetings" appears in sidebar for admin users

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Core PHPUnit suite unchanged (706 tests, 0 failures)
- [ ] Extension PHPUnit suite passes (0 failures)
- [ ] Plugin activates/deactivates cleanly

---

## 9. Phase 2 scope (not in this sprint)

- Zoom OAuth (credential storage, token exchange, meeting creation API)
- Google Meet OAuth (credential storage, token exchange, Google Calendar API)
- Microsoft Teams auto-generation
- Customer-facing "My Meetings" page
- Meeting cancellation sync
- Meeting rescheduling sync

Phase 2 requires the live staging environment for OAuth callback URLs.

---

## 10. Files to upload to this project's knowledge base

1. `Extension_Plugin_API_Spec.md`
2. `System_Architecture_Document_PART1_Sections_1-8.md`
3. `BusinessContext.md`
4. `sprint4d-summary-and-decisions.md`
5. `Development_Implementation_Workflow.md`
6. `wp-env-quick-reference.md`

---

## 11. Key decisions log

| Decision | Rationale |
|---|---|
| Entire meetings feature in extension, not core | Core should be unaware of meeting platforms; extension adds/removes its own data cleanly on activate/deactivate |
| Sprint 4F Tasks 1+2 reverted from core | DB columns and API changes committed to core then removed — extension adds them via its own migrations |
| Core hooks pre-task added to core ✅ | Three hooks give the extension its injection points without the extension ever touching core files |
| Storage columns live in extension migrations | Clean lifecycle: extension adds columns on activation, removes on deactivation |
| Service UI lives entirely in extension | Core ServiceFormModal has no meeting fields; extension injects when active |
| `bookit/v1` namespace not used | Extension uses `bookit-meetings/v1` per Extension_Plugin_API_Spec.md §7 |
| Phase 1 = manual + WhatsApp + Teams + Generic | Zoom/Google Meet OAuth require live environment; defer to Phase 2 |
| Manual link always works as fallback | Extension never blocks a booking due to missing OAuth |

---

## 12. Sprint workflow

- Read all files via GitHub before writing any code (GitHub connector)
- Use Context7 for Vue 3 and WordPress REST API patterns
- Use the `cursor-prompt-generator` skill for every Cursor prompt
- One task at a time — confirm PHPUnit + manual tests before proceeding
- Commit after each task: `Sprint Meetings, Task [N]: [description]`
- Architecture conflicts → escalate to Claude, do not resolve independently