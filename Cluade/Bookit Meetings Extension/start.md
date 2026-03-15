# Bookit Meetings Extension — Project Initialisation

I am building a WordPress extension plugin called **Bookit Meetings**
for the Bookit Booking System core plugin.

## What this extension does
Adds online meeting link support to bookings. When a service is
configured as "online", the extension auto-generates or stores a
meeting link (Zoom, Google Meet, WhatsApp, Teams, or generic URL)
and delivers it to the customer via confirmation email and
confirmation page.

## Parent plugin context
- Core plugin: bookit-booking-system (repo: lstroh/bookit-imp,
  branch: Phase1)
- Extension API spec: see Extension_Plugin_API_Spec.md (upload this
  to project knowledge)
- The core plugin already has the extension registry, migration
  runner, audit logger, and error registry infrastructure
- Core will add meeting_type + preferred_platform columns on services,
  meeting_link column on bookings, and the relevant hooks in Sprint 4F
  before this extension is built

## Extension slug and identity
- Plugin slug: bookit-meetings
- Plugin name: Bookit Meetings
- Text domain: bookit-meetings
- Requires core: 1.0.0+

## Architecture decisions already made
- Auto-generate link if platform API is connected; manual entry
  as fallback — always works regardless of OAuth state
- Staff-level credentials preferred; business-level fallback
- Per-service default (online/in-person); overridable per booking
  by admin in dashboard
- Customer receives link in confirmation email AND confirmation page
- WhatsApp: wa.me/{phone} link from staff phone — no OAuth needed
- Teams: manual link entry in Sprint 5; OAuth auto-generation Phase 2
- Zoom and Google Meet: OAuth per staff + business fallback, Sprint 5
- Extension hooks into bookit_after_booking_created to generate link
- Extension uses bookit_confirmation_meeting_section filter to inject
  link into confirmation email/page

## What needs to be built (Sprint 5, live environment required)
- Extension registration and settings dashboard page
- Zoom OAuth: credential storage, token refresh, meeting creation API
- Google Meet OAuth: credential storage, token refresh, meeting
  creation via Google Calendar API
- WhatsApp: link construction from staff phone number
- Teams: manual link storage and display
- Generic URL: store and display any meeting URL
- Admin per-booking meeting link override in dashboard
- PHPUnit test suite

## Project knowledge files to upload
Please upload these files from the core plugin project to give
this project its context:
1. Extension_Plugin_API_Spec.md — the full extension API contract
2. System_Architecture_Document_PART1_Sections_1-8.md — core architecture
3. BusinessContext.md — what Bookit is and who it serves
4. sprint4d-summary-and-decisions.md — latest core decisions

## My ask for this first session
Confirm you have understood the extension architecture and the
decisions above. Then help me plan the full sprint scope for
the Bookit Meetings extension, broken into tasks with hour
estimates. We will generate Cursor prompts task by task when
we are ready to build.