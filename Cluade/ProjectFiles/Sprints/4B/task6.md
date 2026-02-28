Here is the Task 6 Cursor prompt.

---

### Cursor Prompt — Task 6: Custom Booking Reference Format

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
Every booking needs a human-readable reference in BK[YYMM]-[XXXX] format
(e.g. BK2602-A7F3). This replaces the raw database ID as the user-facing
identifier throughout the dashboard and API responses.

The migration framework from Task 5 is now in place. This task uses it to
add the booking_reference column and backfill existing rows.

Read these files before making any changes:
- bookit-booking-system/includes/class-bookit-migration-runner.php
- bookit-booking-system/database/migrations/ (understand existing file naming)
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (find: create_manual_booking, update_booking, get_booking_details,
  get_bookings_list or equivalent — understand response shapes)
- bookit-booking-system/includes/api/class-wizard-api.php
  (find where bookings are inserted in the public wizard flow)
- bookit-booking-system/dashboard/app/ (find the bookings list view and
  booking detail modal/component to know where to display the reference)

Do not guess at method names or response shapes. Read the actual files first.

YOUR TASK
=========
Implement custom booking references in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Reference generator utility class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/utils/class-bookit-reference-generator.php

<?php
if ( ! defined( 'WPINC' ) ) { die; }

class Bookit_Reference_Generator {

    /**
     * Generate a booking reference in BK[YYMM]-[XXXX] format.
     *
     * Format breakdown:
     *   BK     — fixed prefix
     *   YYMM   — 2-digit year + 2-digit month from $created_at
     *   -      — separator
     *   XXXX   — 4 uppercase alphanumeric characters derived from
     *            md5( $booking_id . $created_at . wp_salt() )
     *
     * @param int    $booking_id  The booking's database ID.
     * @param string $created_at  MySQL datetime string (Y-m-d H:i:s).
     * @return string             e.g. 'BK2602-A7F3'
     */
    public static function generate( int $booking_id, string $created_at ): string {
        $date_part = date( 'ym', strtotime( $created_at ) );
        $hash_part = strtoupper( substr( md5( $booking_id . $created_at . wp_salt() ), 0, 4 ) );
        return 'BK' . $date_part . '-' . $hash_part;
    }

    /**
     * Generate a unique reference with collision detection.
     *
     * Attempts to generate a reference and checks the database for duplicates.
     * On collision, appends an incrementing salt and retries up to 5 times.
     * If all 5 attempts collide (extremely unlikely), falls back to a
     * timestamp-based reference to guarantee uniqueness.
     *
     * @param int    $booking_id  The booking's database ID.
     * @param string $created_at  MySQL datetime string (Y-m-d H:i:s).
     * @return string             A reference guaranteed to be unique in the DB.
     */
    public static function generate_unique( int $booking_id, string $created_at ): string {
        global $wpdb;

        for ( $attempt = 0; $attempt < 5; $attempt++ ) {
            $salt      = $attempt === 0 ? '' : '_attempt_' . $attempt;
            $date_part = date( 'ym', strtotime( $created_at ) );
            $hash_part = strtoupper( substr( md5( $booking_id . $created_at . wp_salt() . $salt ), 0, 4 ) );
            $reference = 'BK' . $date_part . '-' . $hash_part;

            // Check for collision.
            $exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings WHERE booking_reference = %s AND id != %d",
                    $reference,
                    $booking_id
                )
            );

            if ( ! $exists ) {
                return $reference;
            }
        }

        // Fallback: timestamp-based reference (guaranteed unique).
        return 'BK' . date( 'ym', strtotime( $created_at ) ) . '-' . strtoupper( substr( md5( $booking_id . microtime() ), 0, 4 ) );
    }
}

───────────────────────────────────────────────────────────────────────────────
STEP 2: Database migration
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/database/migrations/0001-add-booking-reference.php

Class name must be: Bookit_Migration_0001_Add_Booking_Reference

up() must:
1. Add column:
   ALTER TABLE {$wpdb->prefix}bookings
   ADD COLUMN booking_reference VARCHAR(12) NULL
   AFTER id;

   (Do not add UNIQUE constraint yet — backfill runs next, before constraint)

2. Backfill all existing rows that have booking_reference IS NULL:
   - Fetch all rows: SELECT id, created_at FROM wp_bookings WHERE booking_reference IS NULL
   - For each row: call Bookit_Reference_Generator::generate_unique( $row->id, $row->created_at )
   - UPDATE wp_bookings SET booking_reference = %s WHERE id = %d
   - Log progress via Bookit_Logger::info() every 100 rows for large datasets

3. Add UNIQUE constraint after backfill is complete:
   ALTER TABLE {$wpdb->prefix}bookings
   ADD UNIQUE KEY uq_booking_reference (booking_reference);

down() must:
   ALTER TABLE {$wpdb->prefix}bookings
   DROP KEY uq_booking_reference;
   
   ALTER TABLE {$wpdb->prefix}bookings
   DROP COLUMN booking_reference;

Important notes:
- Require the reference generator class at the top of the migration file
  before using it:
  require_once BOOKIT_PLUGIN_DIR . 'includes/utils/class-bookit-reference-generator.php';
- Use $wpdb->query() for DDL (ALTER TABLE). Use $wpdb->prepare() for all
  DML (SELECT, UPDATE) where values are substituted.
- Wrap the entire up() in a try/catch. On failure: log the error and
  re-throw so the migration runner can handle it.

───────────────────────────────────────────────────────────────────────────────
STEP 3: Load the reference generator in class-bookit-loader.php
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-loader.php

In load_dependencies(), add:
    require_once BOOKIT_PLUGIN_DIR . 'includes/utils/class-bookit-reference-generator.php';

───────────────────────────────────────────────────────────────────────────────
STEP 4: Generate reference on booking creation
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/api/class-dashboard-bookings-api.php

In create_manual_booking(), AFTER the $wpdb->insert() call that creates the
booking and you have $booking_id:

    // Generate and store booking reference.
    $created_at = current_time( 'mysql' );
    $reference  = Bookit_Reference_Generator::generate_unique( $booking_id, $created_at );
    $wpdb->update(
        $wpdb->prefix . 'bookings',
        array( 'booking_reference' => $reference ),
        array( 'id' => $booking_id ),
        array( '%s' ),
        array( '%d' )
    );

Apply the same pattern in class-wizard-api.php wherever new bookings are
inserted in the public booking wizard flow. Read the file to find the exact
location — it will be after a $wpdb->insert() that creates the booking row.

Also check the Stripe webhook handler — if it creates booking rows directly
(rather than delegating to a shared method), add reference generation there
too. Read the file to confirm.

───────────────────────────────────────────────────────────────────────────────
STEP 5: Include booking_reference in all API responses
───────────────────────────────────────────────────────────────────────────────
Read class-dashboard-bookings-api.php carefully to find:
- The method that builds a single booking response (used by get_booking_details)
- The method that builds the bookings list response (used by get_bookings or
  get_todays_bookings)
- Any other places that return booking data to the Vue frontend

In each of these response-building locations, ensure booking_reference is
included in the returned array alongside id:

    'id'                => (int) $booking->id,
    'booking_reference' => $booking->booking_reference ?? '',
    // ... rest of fields

Do not remove the id field — both must be present. The id is still used
internally; the reference is the user-facing identifier.

───────────────────────────────────────────────────────────────────────────────
STEP 6: Display in Vue dashboard
───────────────────────────────────────────────────────────────────────────────
Read the Vue components before editing. Find:
- The bookings list view/component (the table showing all bookings)
- The booking detail modal or drawer component

In the bookings list:
- Add a "Reference" column showing booking_reference
- Position it as the first or second column (before or after date)
- If booking_reference is empty (legacy row not yet migrated), show the
  booking id prefixed with # as fallback: '#' + booking.id

In the booking detail modal:
- Display booking_reference prominently near the top of the modal
- Label it "Booking Reference"
- Same fallback as above if empty

Do not remove any existing columns or fields. This is additive only.

───────────────────────────────────────────────────────────────────────────────
STEP 7: Include booking_reference in booking search
───────────────────────────────────────────────────────────────────────────────
Read the existing search implementation in class-dashboard-bookings-api.php.
Find where the search query filters by customer name or email (likely a WHERE
clause with LIKE). Add booking_reference to the OR conditions:

    OR b.booking_reference LIKE %s

Make sure the search term is passed with % wildcards on both sides, the same
way customer name/email search is handled. Follow the existing pattern exactly.

CODING STANDARDS
================
- WordPress Coding Standards throughout
- No dynamic SQL without $wpdb->prepare()
- File headers: @package / @subpackage as per existing files
- Type hints on all new methods (PHP 8.0)
- Vue changes must follow the existing component style (Options API or
  Composition API — match what is already there)
- Do not use inline styles in Vue — use existing Tailwind utility classes
```

---

**Testing checklist for Task 6:**

- [ ] Deactivate and reactivate the plugin — confirm `booking_reference` column exists in `wp_bookings` and all existing rows have been backfilled (no NULLs)
- [ ] Confirm `uq_booking_reference` UNIQUE key exists on the table (check via phpMyAdmin)
- [ ] Create a new manual booking through the dashboard — confirm it gets a reference immediately (check the DB row)
- [ ] Reference matches `BK[YYMM]-[XXXX]` pattern (e.g. `BK2602-A7F3`)
- [ ] Reference appears in the bookings list UI
- [ ] Reference appears in the booking detail modal
- [ ] `GET /wp-json/bookit/v1/dashboard/bookings` response includes `booking_reference` field
- [ ] Search for a booking using its reference — correct result returned
- [ ] `wp_bookings_migrations` table has a row for `0001-add-booking-reference`

When done, let me know and I'll provide the git commit and Task 4 prompt.