# Bookit REST API Reference — Phase 1
## WordPress Plugin REST API Documentation

**Base URL:** `https://{site}/wp-json/bookit/v1/`
**Namespace:** `bookit/v1`
**Version:** v1.5.0 (April 2026)
**Test suite:** 976 tests, 0 failures

---

## Authentication

### Dashboard endpoints (`/dashboard/*`)
Require an active PHP session set by the dashboard login endpoint.
Include `X-WP-Nonce` header on all requests (nonce available at
`window.BOOKIT_DASHBOARD.nonce`).

```
X-WP-Nonce: {nonce}
```

Two permission levels:
- **Any authenticated staff** — `check_dashboard_permission`
- **Admin only** — `check_admin_permission` (role = 'admin')

### Wizard / public endpoints (`/wizard/*`)
Public — no authentication required unless noted. Rate limited per IP.
Some endpoints use `magic_link_token` as the authentication mechanism.

### Google Calendar endpoints (`/google-calendar/*`)
Mix of session-required and public (OAuth callback).

### Future: Mobile JWT (Phase 2)
`Authorization: Bearer {jwt}` header — not yet implemented.

---

## Rate Limiting

Applied to all public endpoints via `Bookit_Rate_Limiter`.
Returns HTTP 429 when limit exceeded.

| Endpoint group | Limit |
|---------------|-------|
| Booking creation (`wizard_book`) | 10/hour/IP |
| Magic link cancel (`magic_cancel`) | 10/hour/IP |
| Magic link reschedule (`magic_reschedule`) | 10/hour/IP |
| Available packages | 60/hour/IP |
| My packages | 60/hour/IP |
| Package redemptions | 30/hour/IP |
| Email change request | 5/hour/admin user |
| Dashboard login | Rate limited |
| Photo upload (`staff_photo_upload`) | 10/hour/staff user |

---

## Wizard Endpoints (Public)

### Session

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/wizard/session` | Public | Get current booking session data |
| `POST` | `/wizard/session` | CSRF nonce | Update booking session (step, service, staff, date, time, customer) |

### Services & Staff

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/wizard/services` | Public | List all active services with categories |
| `GET` | `/wizard/staff` | Public | List all active staff |
| `GET` | `/wizard/staff-for-service` | Public | List staff available for a specific service |

### Date & Time

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/wizard/timeslots` | Public | Available time slots for a given staff, service, date. Accepts optional `service_id`, `staff_id`, `date` query params |

### Booking Submission

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/wizard/complete` | CSRF nonce, rate limited | Complete booking. Routes to POA, package redemption, or Stripe. Returns `{ success, booking_id, redirect_url }` |

**`POST /wizard/complete` payment_method values:**
- `pay_on_arrival` — creates booking immediately, no payment
- `use_package_{id}` — redeems session from customer package
- `stripe` — creates Stripe Checkout Session, returns redirect_url
- `buy_{package_type_id}` — creates Stripe Checkout Session for package purchase

### Packages (Public)

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/wizard/available-packages` | Public, rate limited | Packages available for a service. Filtered by `service_id` |
| `GET` | `/wizard/my-packages` | Public, rate limited | Customer's active packages. Identified by session email |
| `GET` | `/wizard/package-redemptions` | Public, rate limited | Customer's package redemption history |

### Magic Link Flows

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/wizard/cancel` | `magic_link_token`, rate limited | Cancel booking via token link. Checks cancellation policy window |
| `POST` | `/wizard/reschedule` | `magic_link_token`, rate limited | Reschedule booking via token link |
| `GET` | `/wizard/ical` | `magic_link_token` | Download `.ics` calendar file for a booking |
| `GET` | `/wizard/verify-email-change` | `email_change_token` | Confirm customer email change (Sprint 6D) |

**Magic link token params:**
```
?booking_id={id}&token={magic_link_token}
```

### Stripe Webhook

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/stripe/webhook` | Stripe signature | Handles `checkout.session.completed` and `charge.refunded` |

---

## Dashboard Endpoints (Session Required)

### Authentication

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/dashboard/login` | Public | Dashboard login. Returns session cookie |
| `POST` | `/dashboard/logout` | Session | Dashboard logout |
| `GET` | `/dashboard/auth/check` | Session | Check if session is valid |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/bookings` | Session | List bookings. Filters: `date`, `staff_id`, `service_id`, `status`, `search`, `page`, `per_page` |
| `GET` | `/dashboard/bookings/today` | Session | Today's bookings for current staff (or all if admin) |
| `GET` | `/dashboard/bookings/{id}` | Session | Single booking detail |
| `POST` | `/dashboard/bookings` | Session | Create manual booking |
| `PUT` | `/dashboard/bookings/{id}` | Session | Update booking. Includes state transition enforcement (E2005 on invalid transition) and optimistic locking (`lock_version`) |
| `DELETE` | `/dashboard/bookings/{id}` | Session | Cancel booking (soft delete) |
| `POST` | `/dashboard/bookings/{id}/complete` | Session | Mark booking complete |
| `POST` | `/dashboard/bookings/{id}/no-show` | Session | Mark booking no-show |
| `POST` | `/dashboard/bookings/bulk-action` | Admin | Bulk cancel/complete/no-show. Per-record processing |

**Valid booking status transitions:**
```
pending         → pending_payment, confirmed, cancelled
pending_payment → confirmed, cancelled
confirmed       → completed, cancelled, no_show
completed       → (terminal)
cancelled       → (terminal)
no_show         → (terminal)
```

### Staff

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/staff` | Session | List all staff members |
| `GET` | `/dashboard/staff/{id}` | Admin | Staff detail including notification preferences, Google Calendar status |
| `POST` | `/dashboard/staff` | Admin | Create staff member |
| `PUT` | `/dashboard/staff/{id}` | Admin | Update staff member including notification preferences |
| `DELETE` | `/dashboard/staff/{id}` | Admin | Soft-delete staff member |
| `POST` | `/dashboard/staff/{id}/google-calendar/disconnect` | Admin | Admin disconnects a staff member's Google Calendar |
| `POST` | `/dashboard/staff/{id}/photo` | Session | Upload staff profile photo. Multipart/form-data, field name `photo`. Validates MIME type (jpeg/png/gif/webp) and size (5MB max). Admin can upload for any staff; staff can only upload their own. Returns `{ success: true, url: "..." }`. Registered in WordPress media library. |

### Working Hours & Availability

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/working-hours/{staff_id}` | Session | Working hours for a staff member |
| `POST` | `/dashboard/working-hours/{staff_id}` | Session | Update working hours |
| `GET` | `/dashboard/my-availability` | Session | Current staff's availability blocks |
| `POST` | `/dashboard/my-availability` | Session | Add availability block (time-off) |
| `DELETE` | `/dashboard/my-availability/{id}` | Session | Remove availability block |

### Services & Categories

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/services` | Session | List all services |
| `POST` | `/dashboard/services` | Admin | Create service |
| `PUT` | `/dashboard/services/{id}` | Admin | Update service |
| `DELETE` | `/dashboard/services/{id}` | Admin | Delete service |
| `POST` | `/dashboard/services/reorder` | Admin | Reorder services (drag & drop) |
| `GET` | `/dashboard/categories` | Session | List all categories |
| `POST` | `/dashboard/categories` | Admin | Create category |
| `PUT` | `/dashboard/categories/{id}` | Admin | Update category |
| `DELETE` | `/dashboard/categories/{id}` | Admin | Delete category |
| `POST` | `/dashboard/categories/reorder` | Admin | Reorder categories |

### Customers

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/customers` | Admin | List customers. Filters: `search`, `status`, `page`, `per_page` |
| `GET` | `/dashboard/customers/{id}` | Admin | Customer detail with booking history |
| `DELETE` | `/dashboard/customers/{id}` | Admin | GDPR erasure — anonymises personal data, retains anonymised booking records |
| `GET` | `/dashboard/customers/{id}/export` | Admin | GDPR data export (JSON) |
| `POST` | `/dashboard/customers/{id}/request-email-change` | Admin | Initiate email change — sends verification to new address (Sprint 6D) |

### Packages (Dashboard)

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/package-types` | Session | List package types |
| `POST` | `/dashboard/package-types` | Admin | Create package type |
| `PATCH` | `/dashboard/package-types/{id}` | Admin | Update package type |
| `POST` | `/dashboard/package-types/{id}/deactivate` | Admin | Deactivate package type |
| `GET` | `/dashboard/customer-packages` | Admin | List customer packages. Filters: `customer_id`, `status` |
| `GET` | `/dashboard/customer-packages/{id}` | Admin | Customer package detail |
| `POST` | `/dashboard/customer-packages/{id}/cancel` | Admin | Cancel customer package |
| `GET` | `/dashboard/customer-packages/{id}/redemptions` | Admin | Redemption history for a package |
| `POST` | `/dashboard/package-redemptions` | Admin | Atomic session redemption (SELECT FOR UPDATE transaction) |

### Profile

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/profile` | Session | Current staff profile including notification preferences and Google Calendar status |
| `PUT` | `/dashboard/profile` | Session | Update own profile (name, email, phone, bio, title, photo) |
| `POST` | `/dashboard/profile/change-password` | Session | Change own password |
| `POST` | `/dashboard/profile/verify-password` | Session | Verify current password (used before email change) |
| `PUT` | `/dashboard/profile/notification-preferences` | Session | Save own notification preferences |
| `POST` | `/dashboard/profile/google-calendar/disconnect` | Session | Disconnect own Google Calendar |

### Reports & Analytics

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/reports/revenue` | Admin | Revenue report. Params: `start_date`, `end_date`, `group_by` |
| `GET` | `/dashboard/reports/bookings` | Admin | Booking analytics |
| `GET` | `/dashboard/reports/staff-performance` | Admin | Per-staff metrics |
| `GET` | `/dashboard/my-stats` | Session | Current staff's own stats (earnings, bookings). Returns 403 if hidden |
| `GET` | `/dashboard/my-schedule` | Session | Current staff's schedule (week view) |

### Settings

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/dashboard/settings` | Session | Get settings. Accepts `keys` param for specific keys |
| `POST` | `/dashboard/settings` | Admin | Update settings (upsert). Sensitive keys (API keys) masked as 'SAVED' in GET responses |
| `GET` | `/dashboard/email-templates` | Session | List email templates |
| `GET` | `/dashboard/email-templates/{key}` | Session | Single email template |
| `PUT` | `/dashboard/email-templates/{key}` | Admin | Update email template |
| `POST` | `/dashboard/settings/send-test-email` | Admin | Send test email bypassing queue |
| `GET` | `/dashboard/email-queue` | Admin | Email queue log. Params: `page`, `per_page`, `status` |

### Extensions & Navigation

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/extensions` | Session | List active extensions and their sidebar nav items |

---

## Google Calendar Endpoints

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET` | `/google-calendar/auth-url` | Session | Generate Google OAuth URL for current staff member |
| `GET` | `/google-calendar/callback` | Public (token) | OAuth callback — Google redirects here. Validates HMAC state, exchanges code, stores encrypted tokens. Redirects to dashboard profile |
| `POST` | `/dashboard/profile/google-calendar/disconnect` | Session | Disconnect own Google Calendar (clears tokens) |
| `POST` | `/dashboard/staff/{id}/google-calendar/disconnect` | Admin | Admin disconnects a staff member's Google Calendar |

---

## Error Response Format

All errors follow this structure:

```json
{
  "code": "E2005",
  "message": "Invalid status transition.",
  "data": {
    "status": 422,
    "booking_id": 123
  }
}
```

### Error code registry (selected)

| Code | HTTP | Description |
|------|------|-------------|
| `E1001` | 401 | Not authenticated |
| `E1002` | 401 | Session expired |
| `E1003` | 401 | Invalid credentials |
| `E2001` | 409 | Booking slot conflict |
| `E2002` | 404 | Booking not found |
| `E2003` | 403 | Forbidden — staff cannot access other staff's bookings |
| `E2004` | 409 | Optimistic lock conflict (stale lock_version) |
| `E2005` | 422 | Invalid status transition |
| `E5001` | 404 | Package not found |
| `E5002` | 422 | Package exhausted (no sessions remaining) |
| `E5003` | 422 | Package expired |
| `E5004` | 422 | Package / service mismatch |
| `E5005` | 422 | Package insufficient sessions |
| `PAYMENT_METHOD_NOT_SUPPORTED` | 501 | PayPal not yet implemented |
| `PACKAGE_PRICE_INVALID` | 422 | Package price calculation error |
| `BULK_INVALID_ACTION` | 400 | Invalid bulk action |

---

## Standard Response Shape

Success responses:
```json
{ "success": true, "data": { ... } }
```
or
```json
{ "success": true, "bookings": [ ... ], "total": 42, "pages": 2 }
```

List responses include pagination where applicable:
```json
{
  "success": true,
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "per_page": 25,
  "pages": 4
}
```

---

## Key Settings Keys Reference

Stored in `wp_bookings_settings`. Read via `$wpdb->get_var()` — no global helper function.
Sensitive keys are masked as `'SAVED'` in GET responses.

| Key | Type | Description |
|-----|------|-------------|
| `business_name` | string | Business display name |
| `business_email` | string | Contact email |
| `business_phone` | string | Contact phone |
| `business_address` | string | Physical address |
| `timezone` | string | Business timezone (e.g. `Europe/London`) |
| `cancellation_window_hours` | integer | Hours before appointment for free cancellation |
| `email_provider` | string | `brevo` or `wp_mail` |
| `brevo_api_key` | string (sensitive) | Brevo API key — masked as SAVED |
| `brevo_from_name` | string | From name for Brevo emails |
| `brevo_from_email` | string | From email for Brevo emails |
| `stripe_test_mode` | string | `'1'` = test, `'0'` = live |
| `stripe_publishable_key` | string (sensitive) | Stripe publishable key |
| `stripe_secret_key` | string (sensitive) | Stripe secret key — masked as SAVED |
| `stripe_webhook_secret` | string (sensitive) | Stripe webhook signing secret — masked |
| `packages_enabled` | string | `'1'` or `'0'` |
| `google_client_id` | string | Google OAuth client ID |
| `google_client_secret` | string (sensitive) | Google OAuth client secret — masked |
| `google_calendar_fallback_enabled` | string | `'1'` or `'0'` |
| `staff_digest_send_time` | string | HH:MM — daily/weekly digest send time |
| `staff_schedule_send_time` | string | HH:MM — daily schedule email send time |
| `staff_digest_weekly_day` | string | `1`–`7` (1 = Monday) |
| `brevo_template_booking_confirmed` | string | Brevo template ID (integer as string) |
| `brevo_template_booking_cancelled` | string | Brevo template ID |
| `brevo_template_booking_rescheduled` | string | Brevo template ID |
| `brevo_template_magic_link_cancel` | string | Brevo template ID |
| `brevo_template_magic_link_reschedule` | string | Brevo template ID |
| `brevo_template_business_notification` | string | Brevo template ID |
| `brevo_template_staff_new_booking` | string | Brevo template ID |
| `brevo_template_staff_reschedule` | string | Brevo template ID |
| `brevo_template_staff_cancellation` | string | Brevo template ID |
| `brevo_template_staff_reassigned_to` | string | Brevo template ID |
| `brevo_template_staff_reassigned_away` | string | Brevo template ID |
| `brevo_template_staff_daily_digest` | string | Brevo template ID |
| `brevo_template_staff_weekly_digest` | string | Brevo template ID |
| `brevo_template_staff_daily_schedule` | string | Brevo template ID |
| `brevo_template_email_change_verification` | string | Brevo template ID |
| `brevo_template_email_change_notification` | string | Brevo template ID |
| `brevo_template_email_change_confirmed` | string | Brevo template ID |

---

## Notes for Mobile App (Phase 2)

1. **JWT auth required** — session-based auth (`$_SESSION`) does not work
   for native apps. A new `POST /mobile/auth/login` endpoint returning JWT
   tokens must be added to the plugin before mobile development begins.

2. **All wizard endpoints are already mobile-ready** — they are stateless
   REST endpoints. The mobile app calls them directly.

3. **Dashboard endpoints require session** — these will need the JWT auth
   middleware added before the mobile staff app can use them.

4. **Push notification tokens** — a new `wp_bookit_push_tokens` table and
   registration endpoint will be needed. Design alongside the JWT auth work.

5. **CORS** — WordPress REST API handles CORS. May need adjustment for
   native app requests depending on deployment configuration.

6. **`X-WP-Nonce` header** — not needed for mobile JWT auth (nonces are
   session-specific). Mobile requests authenticate via Bearer token only.

7. **Photo upload endpoint ready** — `POST bookit/v1/dashboard/staff/{id}/photo` is implemented and tested. The mobile app can use this endpoint directly for staff profile photo uploads. Uses multipart/form-data with field name `photo`. Requires Bearer JWT auth (Phase 2 addition) alongside existing session auth.


**Note on cancelled bookings:** As of v1.5.0, cancelled bookings have `start_time = NULL` and `end_time = NULL`. Original slot times are preserved in `cancelled_start_time` and `cancelled_end_time` columns for audit purposes. This frees the unique index slot for re-booking.