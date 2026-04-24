# Bookit Extension Context Brief
**Version:** 1.0  
**Core version this targets:** 1.5.0  
**Last updated:** April 2026

This document is a quick-reference companion to the Extension Developer Handbook.
It captures the facts an extension agent needs without searching the core project.

---

## Core Plugin

| Property | Value |
|----------|-------|
| Plugin name | `bookit-booking-system` |
| Current version | `1.5.0` |
| Repo | `lstroh/bookit-imp` |
| Branch | `Phase1` |
| Minimum core version to target | `1.5.0` |
| PHPUnit baseline (core) | 976 tests, 0 failures |

---

## Environment Requirements

| Requirement | Value |
|-------------|-------|
| PHP minimum | 8.0 |
| PHP recommended | 8.2 |
| WordPress minimum | 6.0 |
| WordPress recommended | 6.4 |
| Database (production) | MariaDB 11.4 |
| Database (local dev) | MySQL 8.0 (same behaviour) |
| Node.js | 18 LTS |
| Composer | 2.0+ |

---

## WordPress Table Names (core)

All core tables use the `{wpdb_prefix}` prefix (typically `wp_`).

| Table | Contents |
|-------|----------|
| `{prefix}bookings` | All booking records |
| `{prefix}bookings_customers` | Customer records |
| `{prefix}bookings_staff` | Staff records |
| `{prefix}bookings_services` | Service definitions |
| `{prefix}bookings_settings` | Plugin settings (read via `$wpdb->get_var()` — not `get_option()`) |
| `{prefix}bookings_staff_working_hours` | Working hours and time-off blocks |
| `{prefix}bookings_service_categories` | Service category assignments (junction table) |
| `{prefix}bookings_packages` | Package type definitions |
| `{prefix}bookings_customer_packages` | Customer package purchases |
| `{prefix}bookings_audit_log` | Audit trail |
| `{prefix}bookit_email_queue` | Email queue (Action Scheduler) |
| `{prefix}bookit_migrations` | Migration history (do not write to directly) |

**Extension tables** use `{prefix}bookit_{slug}_*` naming, e.g.:
- `{prefix}bookit_meetings_credentials`
- `{prefix}bookit_review_requests`

---

## Booking Record — Key Fields

Important fields on `{prefix}bookings` that extensions commonly need:

| Field | Notes |
|-------|-------|
| `id` | Primary key |
| `booking_reference` | Human-readable ref (e.g. `BK2604-0042`) |
| `customer_id` | FK to customers table |
| `staff_id` | FK to staff table |
| `service_id` | FK to services table |
| `booking_date` | `DATE` |
| `start_time` | `TIME` — **NULL on cancelled bookings** |
| `end_time` | `TIME` — **NULL on cancelled bookings** |
| `cancelled_start_time` | Original start time — populated on cancellation |
| `cancelled_end_time` | Original end time — populated on cancellation |
| `status` | `pending`, `confirmed`, `completed`, `cancelled` |
| `payment_method` | `stripe`, `pay_on_arrival`, `package_redemption` |
| `amount_paid` | Decimal |
| `deleted_at` | Soft delete timestamp — NULL = active |

**Critical:** Cancelled bookings have `start_time = NULL` and
`end_time = NULL`. Always null-guard these fields. Original times
are in `cancelled_start_time` / `cancelled_end_time`.

---

## Authentication Model

| Context | Auth method |
|---------|-------------|
| Dashboard endpoints (admin/staff) | Session: `Bookit_Auth::is_authenticated()` checks `$_SESSION['bookit_dashboard_user_id']` + `X-WP-Nonce` header |
| Public endpoints (wizard, magic links) | HMAC-SHA256 token — never `wp_verify_nonce()` |
| Future mobile endpoints (Phase 2) | JWT Bearer token (not yet implemented in v1.5.0) |

**Extension dashboard endpoints** must use the same session auth pattern as
core dashboard endpoints. Copy `check_dashboard_permission()` from any core
API class.

---

## Settings

Plugin settings are stored in `{prefix}bookings_settings` as key/value rows.

**Read via direct query — not `get_option()`:**
```php
global $wpdb;
$value = $wpdb->get_var( $wpdb->prepare(
    "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s",
    'your_setting_key'
) );
```

`bookit_get_setting()` does not exist. Do not call it.

---

## Public Classes Safe to Use in Extensions

| Class | Safe methods |
|-------|-------------|
| `Bookit_Logger` | `::info()`, `::error()`, `::warning()` |
| `Bookit_Auth` | `::is_authenticated()`, `::get_current_user()` |
| `Bookit_Migration_Runner` | `::run_pending()`, `::rollback_last()`, `::has_run()` |
| `Bookit_Extension_Registry` | `::is_registered()`, `::get_extensions()` |

Do not instantiate any other core class directly. Access core data via
the REST API from Vue, or via `$wpdb` queries from PHP.

---

## Email Infrastructure

Emails route through the core email dispatcher (Action Scheduler queue).
Extensions should not call `wp_mail()` directly for transactional email.

Hook into the dispatcher by using core action hooks:
- `bookit_after_booking_created` — to schedule an extension-specific email
- `bookit_after_booking_cancelled` — to cancel pending extension emails

Email provider: Brevo (primary), `wp_mail()` (fallback). Provider is
configurable in Dashboard → Settings → Email.

---

## Hosting and Deployment (Wimbledon Smart clients)

| Layer | Detail |
|-------|--------|
| Host | Hostinger |
| Web server | LiteSpeed |
| CDN | Hostinger CDN (optional, per client) |
| PHP handler | LiteSpeed LSAPI |

After every plugin deployment, perform the three-layer cache purge:
1. LiteSpeed cache (wp-admin → LiteSpeed Cache → Purge All)
2. Hostinger server cache (hosting control panel)
3. CDN purge (if active)

Skipping any layer causes customers to see stale pages.

---

## Core Hooks Added for Extensions (v1.5.0)

These hooks were added specifically for extension use. They are documented
in full in `Extension_Plugin_API_Spec.md`.

**Action hooks:**
`bookit_before_booking_created`, `bookit_after_booking_created`,
`bookit_before_booking_updated`, `bookit_after_booking_updated`,
`bookit_before_booking_cancelled`, `bookit_after_booking_cancelled`,
`bookit_after_payment_completed`, `bookit_after_customer_created`,
`bookit_dashboard_loaded`, `bookit_after_booking_confirmed`

**Filter hooks:**
`bookit_available_slots`, `bookit_booking_data_before_insert`,
`bookit_booking_response`, `bookit_sidebar_nav_items`,
`bookit_dashboard_js_data`, `bookit_confirmation_meeting_section`,
`bookit_email_meeting_section`

`bookit_after_booking_confirmed`, `bookit_confirmation_meeting_section`,
and `bookit_email_meeting_section` were added in Sprint 4F specifically
for the Bookit Meetings extension. They have no consumers in core —
they are silent until an extension hooks into them.

---

## Known Technical Constraints

These are non-negotiable constraints from the production environment:

- `JSON_CONTAINS()` — **broken on MariaDB 11.4**. Use PHP `json_decode()` + `in_array()`.
- `SHOW COLUMNS LIKE` / `SHOW TABLES LIKE` — **broken for names containing underscores**
  (MariaDB treats `_` as wildcard). Always use `information_schema`.
- `sanitize_text_field()` — **strips base64 characters**. Never use on tokens or OAuth state.
- `wp_verify_nonce()` — **fails on public REST endpoints** (no session). Use HMAC-SHA256.
- Vue `base: '/'` in Vite — **causes double-mount crash** with WordPress `?v=` cache busting.
  Always `base: './'`.
- Stripe settings — stored in `{prefix}bookings_settings`, not in WordPress options.
