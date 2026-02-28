Here is the Task 8 Cursor prompt.

---

### Cursor Prompt — Task 8: Optimistic Locking on Booking Edit

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
When two admin users have the same booking open simultaneously and both
click Save, the second save silently overwrites the first. Optimistic
locking prevents this by adding a version token to each booking row.
The client sends the token it received when it loaded the booking; the
server rejects the save if the token no longer matches (meaning someone
else saved first).

The error registry from Task 7 is in place. Error code E2004 is already
defined for optimistic lock conflicts.

Read these files before making any changes:
- bookit-booking-system/database/migrations/ (understand numbering — last
  migration was 0002, so this task uses 0003)
- bookit-booking-system/includes/class-bookit-migration-runner.php
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (find update_booking() — understand the full method: parameters it
  accepts, how it reads the booking before update, how it writes, and
  what it returns)
- bookit-booking-system/includes/api/class-dashboard-bookings-api.php
  (find format_booking() or equivalent — the method that builds the
  booking response object sent to Vue)
- bookit-booking-system/dashboard/src/ — find the booking edit modal
  or form component. Understand how it loads booking data and how it
  submits the update (what fields it sends, which API method it calls)

Do not guess at method names or response shapes. Read the actual files.

YOUR TASK
=========
Implement optimistic locking on booking edit in the order below.

───────────────────────────────────────────────────────────────────────────────
STEP 1: Database migration
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/database/migrations/0003-add-booking-lock-version.php

Class name: Bookit_Migration_0003_Add_Booking_Lock_Version

up() must:
1. Add column:
   ALTER TABLE {$wpdb->prefix}bookings
   ADD COLUMN lock_version VARCHAR(32) NULL
   AFTER updated_at;

2. Backfill all existing rows where lock_version IS NULL:
   - Fetch: SELECT id, updated_at FROM wp_bookings WHERE lock_version IS NULL
   - For each row: generate md5( $row->id . $row->updated_at . wp_salt() )
   - UPDATE wp_bookings SET lock_version = %s WHERE id = %d
   - No UNIQUE constraint needed — tokens are compared, not queried uniquely

down() must:
   ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN lock_version;

───────────────────────────────────────────────────────────────────────────────
STEP 2: Token generation utility
───────────────────────────────────────────────────────────────────────────────
Add a static method to the existing Bookit_Reference_Generator class
(or create a separate file if that class is not appropriate — read it first):

    /**
     * Generate a booking lock version token.
     *
     * @param int    $booking_id The booking's database ID.
     * @param string $updated_at MySQL datetime string (Y-m-d H:i:s).
     * @return string            32-character MD5 hex string.
     */
    public static function generate_lock_version(
        int $booking_id,
        string $updated_at
    ): string {
        return md5( $booking_id . $updated_at . wp_salt() );
    }

───────────────────────────────────────────────────────────────────────────────
STEP 3: Include lock_version in booking responses
───────────────────────────────────────────────────────────────────────────────
Find format_booking() (or equivalent response builder) in
class-dashboard-bookings-api.php.

Add lock_version to the returned array:
    'lock_version' => $booking['lock_version'] ?? '',

This ensures every booking response the Vue frontend receives includes
the current token. The frontend stores it and sends it back on update.

───────────────────────────────────────────────────────────────────────────────
STEP 4: Generate new token on booking creation
───────────────────────────────────────────────────────────────────────────────
In create_manual_booking(), after the booking row is inserted and you have
$booking_id, generate and store the initial lock_version:

    $created_at  = current_time( 'mysql' );
    $lock_version = Bookit_Reference_Generator::generate_lock_version(
        $booking_id,
        $created_at
    );
    $wpdb->update(
        $wpdb->prefix . 'bookings',
        array( 'lock_version' => $lock_version ),
        array( 'id'           => $booking_id ),
        array( '%s' ),
        array( '%d' )
    );

Also apply the same pattern in class-wizard-api.php wherever new bookings
are inserted in the public booking flow. Read the file to find the exact
location — it will be after a $wpdb->insert() that creates the booking row.

───────────────────────────────────────────────────────────────────────────────
STEP 5: Enforce lock_version in update_booking()
───────────────────────────────────────────────────────────────────────────────
Read update_booking() carefully before editing.

Add the following logic at the START of update_booking(), before any
data is written to the database:

1. Read the client_lock_version from the request:
   $client_lock_version = sanitize_text_field(
       (string) $request->get_param( 'lock_version' )
   );

2. If client_lock_version is non-empty (client sent a token):
   a. Fetch the current lock_version from the DB:
      SELECT lock_version FROM wp_bookings WHERE id = $booking_id
   
   b. If the DB row does not exist:
      return Bookit_Error_Registry::to_wp_error( 'E2002',
          [ 'booking_id' => $booking_id ]
      );
   
   c. If $db_lock_version !== $client_lock_version:
      return Bookit_Error_Registry::to_wp_error( 'E2004',
          [ 'booking_id' => $booking_id ]
      );
      (E2004 = optimistic lock conflict — already defined in Task 7)

3. If client_lock_version is empty: allow the update to proceed without
   lock checking. This maintains backwards compatibility with any call
   paths that do not yet send the token.

4. AFTER a successful DB update, generate and store a new lock_version:
   $new_updated_at   = current_time( 'mysql' );
   $new_lock_version = Bookit_Reference_Generator::generate_lock_version(
       $booking_id,
       $new_updated_at
   );
   $wpdb->update(
       $wpdb->prefix . 'bookings',
       array( 'lock_version' => $new_lock_version ),
       array( 'id'           => $booking_id ),
       array( '%s' ),
       array( '%d' )
   );

5. Include the new lock_version in the update response so Vue can store
   the updated token:
   'lock_version' => $new_lock_version

───────────────────────────────────────────────────────────────────────────────
STEP 6: Vue — send lock_version on update, handle conflict
───────────────────────────────────────────────────────────────────────────────
Read the booking edit modal/form component before editing.

SENDING THE TOKEN:
When the edit modal loads a booking (from the bookings list or detail view),
store booking.lock_version in the component's local state alongside the
other booking fields. When submitting the update, include it in the payload:

    {
      ...bookingFields,
      lock_version: localLockVersion
    }

After a successful save response, update the stored lock_version with the
new token from the response:
    localLockVersion = response.data.lock_version

This ensures the next save attempt uses the fresh token.

HANDLING THE CONFLICT (E2004):
When the API returns a 409 with code E2004, show a clear conflict message
to the user. Do not use a generic error toast for this case — it needs
special handling because the user must take action.

Show a modal dialog or inline alert with:
  Title:   "Booking Updated by Someone Else"
  Message: "This booking was modified while you were editing it.
            Your changes have not been saved.
            Please close this form and reopen the booking to see the latest version."
  Button:  "Close and Refresh" — closes the edit modal and refreshes
            the bookings list so the user sees the current state

Follow the existing modal/dialog pattern in the Vue app. Do not use
window.alert() or window.confirm().

CODING STANDARDS
================
- WordPress Coding Standards throughout
- All $wpdb calls use prepare() where values are substituted
- lock_version check placed before any data mutation in update_booking()
- Vue component follows existing patterns (Options/Composition API —
  match what is already in the edit modal)
- No inline styles — use existing Tailwind utility classes
- E2004 conflict response handled distinctly from generic API errors
```

---

**Testing checklist for Task 8:**

- [ ] Deactivate and reactivate plugin — confirm `lock_version` column exists in `wp_bookings` and all existing rows are backfilled (no NULLs)
- [ ] `wp_bookings_migrations` has a row for `0003-add-booking-lock-version`
- [ ] Create a new booking — confirm it has a `lock_version` value in the DB immediately
- [ ] `GET /bookit/v1/dashboard/bookings` response includes `lock_version` field on each booking object
- [ ] Open a booking edit modal — confirm `lock_version` is present in the network response that loads the booking
- [ ] Edit and save a booking normally — confirm it succeeds and the `lock_version` changes in the DB after save
- [ ] Simulate a conflict:
  - Open a booking edit modal (note the lock_version in the Network tab)
  - In phpMyAdmin, manually UPDATE that booking's `lock_version` to a different value:
    ```sql
    UPDATE wp_bookings SET lock_version = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' WHERE id = X;
    ```
  - Back in the dashboard, click Save on the edit modal
  - Confirm the API returns 409 with code `E2004`
  - Confirm the conflict dialog appears with the correct title and message
  - Confirm clicking "Close and Refresh" closes the modal and refreshes the bookings list

When done, let me know and I'll provide the git commit and Task 9 prompt.