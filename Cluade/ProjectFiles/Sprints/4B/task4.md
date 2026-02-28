Here is the Task 4 Cursor prompt.

---

### Cursor Prompt — Task 4: Audit Logging System

```
CONTEXT
=======
Plugin: bookit-booking-system (WordPress plugin)
Branch: Phase1
Environment: Local by Flywheel (dev) + wp-env (PHPUnit)
PHP: 8.0+ / WordPress 6.0+
All code follows WordPress Coding Standards.

BACKGROUND
==========
Sprint 4B Task 4 adds a comprehensive audit trail for all significant actions
in the system. The audit log is admin-only, tamper-evident (no delete/edit UI),
and GDPR-aware (retention limits, logs who viewed the log itself).

The migration framework from Task 5 is in place. Task 6 used migration 0001.
This task uses migration 0002.

Read these files before making any changes:
- bookit-booking-system/includes/class-bookit-migration-runner.php
- bookit-booking-system/database/migrations/0001-add-booking-reference.php
  (understand the migration pattern before writing 0002)
- bookit-booking-system/includes/class-bookit-session.php and
  class-bookit-auth.php (understand how to get the current authenticated
  dashboard user and their role)
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (find create_manual_booking, update_booking, cancel_booking,
  mark_booking_complete, mark_booking_no_show — these all need audit calls)
- bookit-booking-system/includes/api/ — scan for staff CRUD, settings save,
  customer anonymisation endpoints — read these files to find exact method names
- bookit-booking-system/includes/class-bookit-loader.php
- bookit-booking-system/dashboard/app/ — find the Settings page component
  structure and the Vue Router config to understand how to add a new route
- bookit-booking-system/dashboard/app/components/ — find the Sidebar component
  to understand how admin-only nav items are currently handled

Do not guess at method names or file locations. Read the actual files first.

YOUR TASK
=========
Implement the audit logging system in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Database migration
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/database/migrations/0002-add-audit-log.php

Class name: Bookit_Migration_0002_Add_Audit_Log

up() must create table wp_bookings_audit_log:

    CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookings_audit_log (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        actor_id    BIGINT UNSIGNED NOT NULL DEFAULT 0,
        actor_type  ENUM('admin','staff','customer','system') NOT NULL,
        actor_ip    VARCHAR(45) NULL,
        action      VARCHAR(100) NOT NULL,
        object_type VARCHAR(50) NOT NULL,
        object_id   BIGINT UNSIGNED NULL,
        old_value   LONGTEXT NULL,
        new_value   LONGTEXT NULL,
        notes       TEXT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_actor_id (actor_id),
        INDEX idx_action (action),
        INDEX idx_object (object_type, object_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

down() must:
    DROP TABLE IF EXISTS {$wpdb->prefix}bookings_audit_log;

───────────────────────────────────────────────────────────────────────────────
STEP 2: Bookit_Audit_Logger class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/class-bookit-audit-logger.php

The class must implement:

/**
 * Log an auditable action.
 *
 * Never throws — silently fails if DB unavailable, logging to error_log instead.
 *
 * @param string $action      Dot-notation action (e.g. 'booking.created').
 * @param string $object_type Object type (e.g. 'booking', 'customer', 'setting').
 * @param int    $object_id   ID of the object being acted on. 0 if not applicable.
 * @param array  $context {
 *   @type mixed  $old_value   Previous value (will be JSON-encoded). Optional.
 *   @type mixed  $new_value   New value (will be JSON-encoded). Optional.
 *   @type string $notes       Human-readable summary. Optional.
 *   @type int    $actor_id    Override actor ID. Optional — auto-detected if omitted.
 *   @type string $actor_type  Override actor type. Optional — auto-detected if omitted.
 * }
 */
public static function log(
    string $action,
    string $object_type,
    int $object_id = 0,
    array $context = []
): void

Implementation requirements:

a) ACTOR DETECTION (auto, unless overridden in $context):
   - Try Bookit_Auth::get_current_user() — if returns a valid user array,
     use their id as actor_id.
   - Determine actor_type from the user's role:
     'bookit_admin' role → 'admin'
     'bookit_staff' role → 'staff'
     anything else       → 'system'
   - If no authenticated dashboard user: actor_id = 0, actor_type = 'system'
     (covers cron jobs and webhook handlers)

b) IP DETECTION:
   - Use $_SERVER['HTTP_X_FORWARDED_FOR'] if set and valid, else
     $_SERVER['REMOTE_ADDR']. Sanitise with filter_var( $ip, FILTER_VALIDATE_IP ).
   - Store NULL if IP cannot be determined or is invalid.

c) SENSITIVE FIELD REDACTION:
   Never store these in old_value or new_value, even if passed in $context:
   - Any key containing: 'password', 'secret', 'api_key', 'token',
     'card', 'cvv', 'stripe_secret', 'paypal_secret'
   - Implement a private static method redact( array $data ): array
     that recursively removes these keys before JSON encoding.
   - Apply redact() to both old_value and new_value before storing.

d) JSON ENCODING:
   - JSON-encode old_value and new_value if they are arrays or objects.
   - Store NULL if the value is null or an empty array.
   - Use wp_json_encode().

e) SILENT FAILURE:
   - Wrap the entire DB insert in try/catch.
   - On any exception or $wpdb error: call error_log() with a descriptive
     message. Do NOT throw or propagate the exception.
   - The audit logger must never cause a PHP fatal error or disrupt the
     main request.

f) INSERT:
   Use $wpdb->insert() with explicit format array.
   Table: {$wpdb->prefix}bookings_audit_log

───────────────────────────────────────────────────────────────────────────────
STEP 3: Wire up audit calls in existing controllers
───────────────────────────────────────────────────────────────────────────────
Read each file before editing. Add Bookit_Audit_Logger::log() calls at the
points listed below. Place each call AFTER the action has succeeded (after
the DB write confirms success), not before.

In class-dashboard-bookings-api.php:

  create_manual_booking() — after successful insert and reference generation:
    Bookit_Audit_Logger::log(
        'booking.created',
        'booking',
        $booking_id,
        [
            'new_value' => $booking_data,
            'notes'     => sprintf( 'Booking created manually for customer ID %d', $customer_id ),
        ]
    );

  update_booking() — after successful update:
    Bookit_Audit_Logger::log(
        'booking.updated',
        'booking',
        $booking_id,
        [
            'old_value' => $old_data,
            'new_value' => $new_data,
            'notes'     => 'Booking updated via dashboard',
        ]
    );

  cancel_booking() (or equivalent) — after successful cancellation:
    Bookit_Audit_Logger::log(
        'booking.cancelled',
        'booking',
        $booking_id,
        [
            'old_value' => [ 'status' => $old_status ],
            'new_value' => [ 'status' => 'cancelled' ],
            'notes'     => 'Booking cancelled via dashboard',
        ]
    );

  mark_booking_complete() — after successful status change:
    Bookit_Audit_Logger::log(
        'booking.completed',
        'booking',
        $booking_id,
        [
            'old_value' => [ 'status' => $old_status ],
            'new_value' => [ 'status' => 'completed' ],
        ]
    );

  mark_booking_no_show() — after successful status change:
    Bookit_Audit_Logger::log(
        'booking.no_show',
        'booking',
        $booking_id,
        [
            'old_value' => [ 'status' => $old_status ],
            'new_value' => [ 'status' => 'no_show' ],
        ]
    );

In the payment webhook handler (wherever bookit_after_payment_completed fires
or where payment confirmation is processed):
    Bookit_Audit_Logger::log(
        'payment.completed',
        'booking',
        $booking_id,
        [
            'new_value' => $payment_data,
            'notes'     => 'Payment confirmed via webhook',
        ]
    );

In the staff CRUD API (read the file to find exact method names):
    After staff created:
        Bookit_Audit_Logger::log( 'staff.created', 'staff', $staff_id, [ 'new_value' => $staff_data ] );
    After staff updated:
        Bookit_Audit_Logger::log( 'staff.updated', 'staff', $staff_id, [ 'old_value' => $old_data, 'new_value' => $new_data ] );
    After staff deleted:
        Bookit_Audit_Logger::log( 'staff.deleted', 'staff', $staff_id, [ 'old_value' => $old_data ] );

In the settings API (find the save/update endpoint):
    After any setting saved:
        Bookit_Audit_Logger::log(
            'setting.updated',
            'setting',
            0,
            [
                'old_value' => $old_settings,
                'new_value' => $new_settings,
                'notes'     => 'Settings saved via dashboard',
            ]
        );
    Note: old_value and new_value here are the full settings arrays.
    The redact() method will strip any sensitive keys automatically.

In the customer anonymisation endpoint (GDPR deletion — find in customer API):
    After anonymisation:
        Bookit_Audit_Logger::log(
            'customer.anonymised',
            'customer',
            $customer_id,
            [ 'notes' => 'Customer data anonymised per GDPR request' ]
        );

───────────────────────────────────────────────────────────────────────────────
STEP 4: Retention cron job
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/cron/class-bookit-audit-retention.php

class Bookit_Audit_Retention {

    public static function register_cron(): void {
        if ( ! wp_next_scheduled( 'bookit_audit_retention' ) ) {
            // Schedule daily at 4 AM (offset from existing 3 AM cron jobs).
            wp_schedule_event( strtotime( 'tomorrow 04:00:00' ), 'daily', 'bookit_audit_retention' );
        }
    }

    public static function run(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'bookings_audit_log';

        // Delete payment records older than 7 years (HMRC retention).
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$table}
                 WHERE action LIKE %s
                 AND created_at < %s",
                'payment.%',
                gmdate( 'Y-m-d H:i:s', strtotime( '-7 years' ) )
            )
        );

        // Delete all other records older than 2 years.
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$table}
                 WHERE action NOT LIKE %s
                 AND created_at < %s",
                'payment.%',
                gmdate( 'Y-m-d H:i:s', strtotime( '-2 years' ) )
            )
        );
    }
}

Register the cron in class-bookit-activator.php activate() method:
    require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-audit-retention.php';
    Bookit_Audit_Retention::register_cron();

Register the cron handler in class-bookit-loader.php define_cron_hooks()
(or wherever other cron hooks are registered — read the file):
    add_action( 'bookit_audit_retention', array( 'Bookit_Audit_Retention', 'run' ) );

───────────────────────────────────────────────────────────────────────────────
STEP 5: Audit Log REST endpoint
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/api/class-audit-log-api.php

Register: GET /wp-json/bookit/v1/audit-log

Permission: admin-only. In the permission callback:
    $user = Bookit_Auth::get_current_user();
    if ( ! $user || $user['role'] !== 'bookit_admin' ) {
        return new WP_Error( 'bookit_forbidden', __( 'Admin access required.', 'bookit-booking-system' ), [ 'status' => 403 ] );
    }

Query parameters (all optional):
    - date_from    Y-m-d
    - date_to      Y-m-d
    - action       string (exact match, e.g. 'booking.created')
    - actor_id     integer
    - per_page     integer (default 50, max 100)
    - page         integer (default 1)

Response shape:
    {
      "data": [
        {
          "id": 1,
          "actor_id": 3,
          "actor_type": "admin",
          "actor_name": "Jane Smith",   ← join to wp_bookings_staff on actor_id
          "actor_ip": "192.168.1.1",
          "action": "booking.created",
          "object_type": "booking",
          "object_id": 42,
          "object_summary": "BK2602-A7F3",  ← join to wp_bookings on object_id when object_type = 'booking'
          "old_value": null,
          "new_value": { ... },
          "notes": "Booking created manually",
          "created_at": "2026-02-28 14:32:00"
        }
      ],
      "pagination": {
        "total": 243,
        "per_page": 50,
        "current_page": 1,
        "total_pages": 5
      }
    }

For actor_name: LEFT JOIN wp_bookings_staff on actor_id. If no match
(actor_type = 'system' or actor_id = 0), use 'System' as the name.

For object_summary: when object_type = 'booking', JOIN wp_bookings to get
booking_reference. For other object types, use the object_id as a string
or leave blank — do not attempt joins for every object type.

AFTER fetching results, log the view itself:
    Bookit_Audit_Logger::log(
        'audit_log.viewed',
        'audit_log',
        0,
        [ 'notes' => sprintf( 'Audit log viewed. Filters: %s', wp_json_encode( $filters ) ) ]
    );

Follow the exact same class structure and REST registration pattern as
class-dashboard-bookings-api.php.

───────────────────────────────────────────────────────────────────────────────
STEP 6: Load new classes in class-bookit-loader.php
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-loader.php

In load_dependencies(), add:
    require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-audit-logger.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-audit-log-api.php';
    require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-audit-retention.php';

Instantiate the API class in the same place other API classes are instantiated.

───────────────────────────────────────────────────────────────────────────────
STEP 7: Audit Log dashboard page (Vue)
───────────────────────────────────────────────────────────────────────────────
Read the Vue Router config and existing page components before implementing.
Follow the exact same patterns already established for other pages.

Create a new page component: AuditLog.vue (or audit-log equivalent)

The page must:

1. Be registered as a route in the Vue Router — path: /audit-log or similar.
   Add a route guard that checks currentUser.role === 'bookit_admin'.
   If not admin, redirect to dashboard home. Follow the existing pattern for
   role-based route guards in the router config.

2. Add a sidebar nav item for admin users only. Find how existing admin-only
   nav items are conditionally rendered in the Sidebar component and follow
   the same pattern. Label: "Audit Log", position it under Settings.

3. Page layout:
   - Page title: "Audit Log"
   - Filter bar at top:
     * Date range (from / to) — use the existing DateRangeSelector component
       if one exists, otherwise two date inputs
     * Action filter — text input or select (populate with common actions:
       booking.created, booking.updated, booking.cancelled, booking.completed,
       booking.no_show, payment.completed, staff.created, staff.updated,
       staff.deleted, setting.updated, customer.anonymised, audit_log.viewed)
     * "Filter" button and "Clear" button
   - Results table columns:
     * Timestamp (created_at, formatted as per dashboard date/time settings)
     * Actor (actor_name + actor_type badge)
     * Action (e.g. 'booking.created' — display as-is or with a label map)
     * Object (object_type + object_summary, e.g. "booking BK2602-A7F3")
     * IP address
   - Pagination controls (previous / next / page number) — 50 rows per page
   - Loading state while fetching
   - Empty state: "No audit log entries found for the selected filters."
   - Read-only — no edit, delete, or export controls

4. On mount: fetch first page from GET /wp-json/bookit/v1/audit-log
   Re-fetch when filters change or page changes.

5. Viewing the page triggers the audit_log.viewed log entry server-side
   (handled automatically by the API endpoint — no Vue action needed).

CODING STANDARDS
================
- WordPress Coding Standards throughout
- All $wpdb calls use prepare() where values substituted
- Bookit_Audit_Logger::log() calls placed after confirmed success only
- Silent failure in the logger — never let it break the main request
- Vue component follows existing patterns (match Options/Composition API
  style of existing pages)
- No inline styles — Tailwind utility classes only
- Admin-only enforcement at both API level (permission callback) and
  Vue level (route guard + sidebar conditional) — both are required
```

---

**Testing checklist for Task 4:**

- [ ] Deactivate and reactivate plugin — confirm `wp_bookings_audit_log` table exists with correct schema
- [ ] `wp_bookings_migrations` has a row for `0002-add-audit-log`
- [ ] `Bookit_Audit_Logger::log()` inserts a row correctly — add a temporary call in `functions.php` and check the table
- [ ] Create a manual booking — confirm a `booking.created` row appears in the audit log table
- [ ] Update a booking status — confirm a `booking.updated` row appears with correct old/new values
- [ ] Save settings — confirm a `setting.updated` row appears (check that any API keys in settings are redacted)
- [ ] Log in as a staff user — confirm `GET /wp-json/bookit/v1/audit-log` returns 403
- [ ] Log in as admin — confirm the endpoint returns data with correct pagination shape
- [ ] Visit the Audit Log page in the dashboard — confirm the `audit_log.viewed` entry appears in the table after the page loads
- [ ] Date range filter returns correct subset — create entries today, filter to yesterday, confirm empty result
- [ ] Audit Log nav item visible to admin, not visible to staff
- [ ] Confirm retention cron is registered: in browser visit `https://your-local-site.local/wp-json/bookit/v1/audit-log` and check — or run `wp cron event list` in WP-CLI and look for `bookit_audit_retention`

When done, let me know and I'll provide the git commit and Task 7 prompt.