# Bookit Meetings — Feature Overview & Sprint Plan
**Phase 1 scope | April 2026**
**Status: Design decisions locked (pending one open question)**

---

## What Bookit Meetings Does

Adds online meeting link support to the Bookit Booking System. When the
Meetings feature is enabled and a service is configured as an online meeting,
a meeting link is automatically generated for each booking and surfaced to
both the customer and the staff member.

---

## Design Decisions (locked)

| Decision | Answer |
|----------|--------|
| Platform config scope | **Global** — one platform for the whole business, set by admin |
| Global on/off switch | **Yes** — admin can enable/disable Meetings entirely |
| Who can change settings | **Admin only** |
| WhatsApp link behaviour | **No link generated** — confirmation text tells customer their host will initiate a WhatsApp call/video at appointment time |
| Staff meeting link surface | Booking detail panel, my-schedule view, and staff notification email |
| Staff email extras | Meeting link (if exists) + customer phone (if no link) + Add to Calendar (.ics) + link to booking in dashboard |
| Customer phone fallback | Customer phone shown to staff when no meeting link exists (e.g. WhatsApp platform) |

---

## Phase 1 — Supported Platforms

| Platform | Customer sees | Staff sees | How link is generated |
|----------|--------------|------------|----------------------|
| **WhatsApp** | "Your host will initiate a WhatsApp call/video at your appointment time" | Customer phone number | No link — manual initiation |
| **Teams** | Join Meeting button/link | Join Meeting link | Admin pastes manual URL for the business |
| **Generic URL** | Join Meeting button/link | Join Meeting link | Admin pastes any URL for the business |
| **Zoom** | Join Meeting button/link | Join Meeting link | Auto-generated via Zoom API — **Phase 2** |
| **Google Meet** | Join Meeting button/link | Join Meeting link | Auto-generated via Google Calendar API — **Phase 2** |

Phase 1 requires no OAuth credentials. Zoom and Google Meet appear in the
settings UI as "Coming Soon".

---

## What Gets Built in Phase 1

### 1. Plugin Foundation
The extension registers itself with Bookit core, declares its database
migrations, and adds a "Meetings" entry to the dashboard sidebar (admin only).

### 2. Database Changes
Added on activation, removed cleanly on deactivation:

- `meetings_enabled` setting row in `wp_bookings_settings` — global on/off switch
- `meetings_platform` setting row in `wp_bookings_settings` — global platform selection
- `meetings_manual_url` setting row in `wp_bookings_settings` — manual URL for Teams/Generic
- `meeting_link` column on `wp_bookings` — generated or manually-set link per booking
- `wp_bookit_meetings_credentials` table — OAuth credential storage (empty in Phase 1, ready for Phase 2)

> Platform config is global, not per-service. No columns needed on
> `wp_bookings_services`. The credentials table is created now so Phase 2
> OAuth work has a home without a new migration.

### 3. Meetings Settings Page (Dashboard — Admin Only)
A new page in the Bookit dashboard sidebar under "Meetings":

- Global enable/disable toggle for the Meetings feature
- Platform selector: WhatsApp / Teams / Generic URL / Zoom (Coming Soon) / Google Meet (Coming Soon)
- Manual URL field — shown when Teams or Generic is selected
- WhatsApp information panel — explains the no-link behaviour
- Phase 2 connection status stubs (Zoom OAuth / Google Meet OAuth — Coming Soon)

### 4. Automatic Link Generation
When a booking is confirmed, the extension checks whether Meetings is enabled
and what platform is configured, then generates and saves the meeting link:

- **WhatsApp** — no link stored; `meetings_platform` value on booking flags downstream display logic
- **Teams / Generic** — copies the global manual URL to `meeting_link` on the booking row
- Covers both public wizard bookings (`bookit_after_booking_confirmed`) and
  dashboard-created manual bookings (`bookit_after_booking_created`)

### 5. Customer-Facing Surfaces

**Confirmation page** (via `bookit_confirmation_meeting_section` filter):
- Teams/Generic: "Join Meeting" button linking to `meeting_link`
- WhatsApp: "Your host will initiate a WhatsApp call/video at your appointment time"
- Meetings disabled or no platform set: no output

**Confirmation email** (via `bookit_email_meeting_section` filter):
- Teams/Generic: meeting link row with inline styles (email-safe HTML)
- WhatsApp: plain-text note about WhatsApp initiation
- Meetings disabled: no output

### 6. Staff-Facing Surfaces

**Booking detail panel** (via `bookit_booking_response` filter):
- `meeting_link` and `meetings_platform` appended to every booking API response
- Dashboard renders a "Meeting" section in the booking detail panel showing
  the link (Teams/Generic) or a WhatsApp note + customer phone number

**My-schedule view** (same filter — data already in payload):
- Meeting indicator shown on each booking card where a meeting applies

**Staff notification email:**
- Meeting link if one exists (Teams/Generic)
- Customer phone number if platform is WhatsApp
- "Add to Calendar" `.ics` link
- Link to `/bookit-dashboard/#/bookings` + booking reference number as visual identifier
  (no per-booking deep link exists in core v1.5.0 — the booking detail modal is not URL-addressable)

### 7. Admin Per-Booking Override
Admin can manually set or edit the meeting link on any booking via
`POST bookit-meetings/v1/bookings/{id}/link`.

### 8. Tests
Full PHPUnit coverage for all PHP logic. Playwright smoke and full E2E tests
for the dashboard settings page and confirmation page behaviour.

---

## Open Questions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Staff notification email — extend via existing core staff email hook or send a separate extension-triggered email? | Needs a check of core code before Sprint 1 Task 6. Will be resolved at sprint start. |

---

## Sprint Plan

### Sprint 1 — Plugin Scaffold + Core PHP (~12h)

| Task | Description | Est |
|------|-------------|-----|
| 1 | Plugin scaffold — main file, loader, registration, `.wp-env.json`, `.cursor/rules` | 1h |
| 2 | Database migrations — `meeting_link` column + credentials table + settings rows, `up()`/`down()`, PHPUnit | 2h |
| 3 | REST API — `GET/POST /settings`, `POST /bookings/{id}/link`, PHPUnit | 2h |
| 4 | Link generation — `bookit_after_booking_confirmed` + `bookit_after_booking_created`, WhatsApp/Teams/Generic logic, PHPUnit | 2h |
| 5 | Customer confirmation page + email injection, PHPUnit | 2h |
| 6 | Staff notification email — meeting link / customer phone / .ics link / dashboard deep link, PHPUnit | 3h |

**Exit criteria:** All PHP logic complete, all PHPUnit tests passing. Plugin
activates cleanly, link generation works end-to-end, staff email delivers
correct content per platform.

---

### Sprint 2 — Dashboard Vue App (~12h)

| Task | Description | Est |
|------|-------------|-----|
| 1 | Backend wiring — enqueue assets, `bookit_dashboard_js_data` filter, nav item, `bookit_booking_response` filter | 1h |
| 2 | Vite scaffold — `vite.config.js` (`base: './'`), `main.js`, `App.vue`, build pipeline | 1h |
| 3 | Meetings settings page — global toggle, platform selector, manual URL field, Coming Soon stubs | 4h |
| 4 | Booking detail panel — meeting link / WhatsApp note + customer phone | 3h |
| 5 | My-schedule view — meeting indicator on booking cards | 1h |
| 6 | Playwright smoke + full E2E tests | 2h |

**Exit criteria:** Admin can enable Meetings, select a platform, confirm a test
booking, and see the meeting link in the confirmation page, confirmation email,
staff email, booking detail panel, and my-schedule view.
