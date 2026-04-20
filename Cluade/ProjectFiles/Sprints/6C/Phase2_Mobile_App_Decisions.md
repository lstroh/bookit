# Phase 2 Mobile App — Architecture Decisions
## Bookit Booking System — Wimbledon Smart

**Document Version:** 1.0
**Date:** April 2026
**Status:** APPROVED — Implement in Phase 2
**Owner:** Liron (Wimbledon Smart)

---

## Decision Summary

Two mobile apps in one React Native codebase: a staff/admin app (Scenario A)
and a customer booking app (Scenario B). Both share the same plugin REST API.
Web dashboard (Vue 3) and web wizard (vanilla JS) remain unchanged.

---

## Scope

### Scenario A — Staff / Admin App
Business owner and staff manage bookings from their phone. Mirrors the web
dashboard but optimised for mobile use cases: checking today's schedule,
receiving push notifications for new bookings, managing their availability.

### Scenario B — Customer Booking App
Customers book appointments from a native app. Mirrors the V2 wizard but as
a native experience with App Store / Play Store presence.

Both scenarios are served by a **single React Native codebase** with
role-based routing — the same app shows different screens depending on
whether the logged-in user is a staff member or a customer.

---

## Technology Decision: React Native

**Chosen:** React Native (not PWA, not Vue Native)

**Rationale:**

| Factor | Decision |
|--------|---------|
| App Store presence | Required for customer app — React Native supports both iOS and Android |
| Push notifications | Full native support on iOS and Android |
| Stripe payments | First-class `@stripe/stripe-react-native` SDK |
| Code sharing with web | Not applicable — web dashboard stays in Vue, mobile is a separate codebase |
| PWA alternative | Rejected — iOS push notification limitations make PWA insufficient for customer app |

**What does NOT change:**
- Web dashboard stays Vue 3 — no migration
- Web booking wizard stays vanilla JS — no migration
- Mobile app is a separate codebase, not a rewrite of the web app

---

## Architecture

### Shared foundation: Plugin REST API

The WordPress plugin's REST API is the shared contract between all clients
(web dashboard, web wizard, mobile app). No plugin changes are required
to support mobile — only a JWT authentication layer needs to be added
(session-based auth used by the web dashboard does not work for native apps).

**New auth endpoint needed (Phase 2 plugin work):**
```
POST bookit/v1/mobile/auth/login   → returns JWT access token + refresh token
POST bookit/v1/mobile/auth/refresh → exchanges refresh token for new access token
POST bookit/v1/mobile/auth/logout  → invalidates refresh token
```

All existing `bookit/v1/wizard/*` and `bookit/v1/dashboard/*` endpoints are
reused by the mobile app — they accept `Authorization: Bearer {jwt}` in
addition to the existing session-based auth.

### Single React Native app, role-based routing

```
App launches
    ↓
Login screen (staff email/password OR customer email/booking lookup)
    ↓
Role check from JWT payload
    ↓
Staff/Admin → Staff navigation stack
Customer → Customer navigation stack
```

### Staff navigation (Scenario A)
- Today's schedule
- Upcoming bookings
- Create / edit / cancel booking
- Customer lookup
- My availability
- Notification preferences
- My Profile (Google Calendar connect)

### Customer navigation (Scenario B)
- Book a service (V2 wizard flow as native screens)
- My bookings (history, upcoming)
- My packages (session bundles)
- Cancel / reschedule via deep link
- Profile (name, phone, email change)

---

## Push Notifications

Both scenarios require push notifications. Implementation via
**Expo Notifications** or **React Native Firebase (FCM/APNs)**:

| Event | Recipient | Notification |
|-------|----------|-------------|
| New booking created | Assigned staff | "New booking: [Customer] — [Service], [Date]" |
| Booking cancelled | Assigned staff | "Booking cancelled: [Customer] — [Date]" |
| Booking rescheduled | Assigned staff | "Booking rescheduled: [Customer] — new time [Date]" |
| Booking confirmed | Customer | "Your booking is confirmed — [Service], [Date]" |
| 24h reminder | Customer | "Reminder: [Service] tomorrow at [Time]" |
| Cancellation confirmed | Customer | "Your booking has been cancelled" |

Push notification tokens are stored per device in a new DB table
(`wp_bookit_push_tokens`) — Phase 2 plugin work.

---

## Stripe Integration (Customer App)

Package: `@stripe/stripe-react-native`

The customer booking flow supports:
- Card payment via Stripe Payment Sheet (wraps Stripe Checkout equivalent)
- Pay on arrival (no payment step)
- Package redemption (use existing sessions)

The existing `bookit/v1/wizard/complete` endpoint is reused — it already
returns a Stripe Checkout URL for card payments. The mobile app opens this
URL in a `WebView` or handles it via the Stripe React Native SDK directly.

---

## Classes Extension — Design First

The Bookit Classes extension (group bookings / class schedule) should be
designed with mobile in mind from the start:

1. **Design the REST API endpoints first** (what data the class schedule
   browser needs, how seat counts are returned, how bookings are created)
2. **Build web (Vue) and mobile (React Native) against the same endpoints**
   simultaneously rather than web-first then mobile retrofit

This avoids duplicated data modelling work and ensures the mobile experience
is first-class, not an afterthought.

---

## Extension Architecture on Mobile

### How extensions work in React Native

React Native does not support dynamic code loading — the App Store model
prevents installing "plugins" into a running app. Extensions therefore work
differently on mobile than on the web dashboard.

**Chosen approach: Option A — Extensions are REST API only, mobile UI built in**

The extension lives entirely in WordPress (PHP plugin + REST endpoints under
its own namespace, e.g. `bookit-classes/v1/`). The React Native app ships
with the UI for all known extensions built in, but only shows those screens
when the corresponding extension is detected as active on the server.

**Detection mechanism:** The existing `GET bookit/v1/extensions` endpoint
(already built in Phase 1) returns the list of active extensions. On login,
the mobile app calls this endpoint and shows or hides extension screens based
on the response.

**Client experience:** Admin installs the WordPress extension plugin → mobile
app automatically gains the feature on next open. No app update required,
no App Store submission per extension.

### Extension registration — mobile_features field (Phase 2 addition)

The `GET bookit/v1/extensions` response needs one additional field per
extension for mobile feature detection. Add `mobile_features` to the
extension registration spec (`Extension_Plugin_API_Spec.md`):

```json
{
  "extensions": [
    {
      "slug": "bookit-classes",
      "name": "Bookit Classes",
      "version": "1.0.0",
      "mobile_features": ["class_schedule", "class_booking", "class_management"]
    }
  ]
}
```

Extensions declare which mobile screens they provide via `mobile_features`
in their `bookit_register_extension()` call. The mobile app uses this list
to enable the correct navigation items.

### Known extensions and their mobile screens (planned)

| Extension | Mobile screens |
|-----------|---------------|
| Bookit Classes | Class schedule browser, class booking, admin class management |
| Bookit Recurring | Recurring series view, series edit/cancel |
| Bookit Meetings | Meeting link display on booking detail |
| Bookit Reviews | Customer review submission, admin review management |

### What this means for the mobile app build

Build mobile UI for all known extensions upfront alongside each extension's
WordPress plugin. Do not attempt dynamic module loading — not feasible under
App Store guidelines.

---

## What Stays Unchanged in Phase 2

| Component | Technology | Status |
|-----------|-----------|--------|
| Web dashboard | Vue 3 SPA | No changes |
| Web booking wizard | Vanilla JS IIFE | Minor additions only |
| Plugin REST API | PHP / WordPress | JWT auth layer added |
| Email notifications | Brevo via dispatcher | No changes |
| Google Calendar sync | google/apiclient v2 | No changes |

---

## Phase 2 Mobile Sprint Estimate (preliminary)

| Track | Estimated hours |
|-------|----------------|
| JWT auth layer in plugin | ~8h |
| React Native project setup + navigation | ~8h |
| Staff app — schedule, bookings, notifications | ~20h |
| Customer app — booking wizard, history, packages | ~24h |
| Push notification infrastructure | ~8h |
| App Store / Play Store submission | ~8h |
| **Total** | **~76h** |

This is preliminary — full scoping happens when Phase 1 is complete and
the first client is live.
