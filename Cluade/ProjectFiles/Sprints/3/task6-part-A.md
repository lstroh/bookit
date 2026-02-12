# 🚀 TASK 6: EDIT BOOKING MODAL

Breaking this into **2 Cursor Prompts** for manageability:

1. **Part A:** Backend API (endpoints + database updates)
2. **Part B:** Frontend Modal (view + edit interface)

---

# 📝 PART A: BACKEND API (Cursor Prompt 1)

```markdown
# Task 6 Part A: Edit Booking Backend API

## Context
I'm building a WordPress booking plugin dashboard. Task 5 (manual booking creation) is complete. Now I need endpoints to view and edit existing bookings, plus add new booking statuses for better workflow management.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing files:
- Dashboard API: `includes/api/class-dashboard-bookings-api.php`
- Booking creator: `includes/booking/class-booking-creator.php`
- Email sender: `includes/email/class-email-sender.php`
- Auth: `includes/class-bookit-auth.php`

Database:
- Table: `wp_bookings`
- Current statuses: pending_payment, confirmed, completed
- Need to add: pending, cancelled, no_show

## Requirements

### 1. Update Database Schema for New Statuses

Update table creation code (find where wp_bookings table is defined) to include all 6 statuses:

**Change status column definition from:**
```sql
status ENUM('pending_payment', 'confirmed', 'completed') NOT NULL DEFAULT 'pending_payment'
```

**To:**
```sql
status ENUM('pending', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending_payment'
```

Note: The ALTER TABLE command has already been run on the database, but the code definition needs updating for consistency.

### 2. Add Approval Requirement Setting

Add this setting initialization (likely in main plugin file or activation hook):

```php
// Add default setting for approval requirement
if (false === get_option('bookit_require_approval')) {
    add_option('bookit_require_approval', false);
}
```

This setting controls whether new bookings require admin approval (pending status) or go directly to confirmed/pending_payment.

### 3. Update Manual Booking Creation to Use Approval Setting

In `includes/api/class-dashboard-bookings-api.php`, find the `create_manual_booking()` method.

After the booking creator succeeds, before setting the booking data, add logic to determine initial status:

```php
// After: $booking_id = $result;
// Before: Send confirmation emails

// Determine initial status based on settings and payment
$require_approval = get_option('bookit_require_approval', false);

if ($require_approval) {
    // When approval required, all bookings start as pending
    $initial_status = 'pending';
} else {
    // When no approval required, use payment-based logic
    if ($payment_method === 'pay_on_arrival') {
        $initial_status = 'confirmed';
    } elseif (in_array($payment_method, array('cash', 'card_external', 'check', 'complimentary'))) {
        $initial_status = 'confirmed';
    } elseif ($payment_method === 'stripe' && $amount_paid > 0) {
        $initial_status = 'confirmed';
    } else {
        $initial_status = 'pending_payment';
    }
}

// Update booking status
$wpdb->update(
    $wpdb->prefix . 'bookings',
    array('status' => $initial_status),
    array('id' => $booking_id),
    array('%s'),
    array('%d')
);
```

### 4. Add Get Single Booking Endpoint

Add this route in `register_routes()` method:

```php
// Get single booking details
register_rest_route(
    self::NAMESPACE,
    '/dashboard/bookings/(?P<id>\d+)',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_booking_details' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

Add this method:

```php
/**
 * Get single booking details
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_booking_details( $request ) {
    global $wpdb;

    $booking_id = (int) $request->get_param( 'id' );
    
    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Get booking with all related data
    $booking = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                b.*,
                c.id as customer_id,
                c.first_name AS customer_first_name,
                c.last_name AS customer_last_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                s.id as service_id,
                s.name AS service_name,
                s.duration as service_duration,
                s.price as service_price,
                st.id as staff_id,
                st.first_name AS staff_first_name,
                st.last_name AS staff_last_name,
                CONCAT(st.first_name, ' ', st.last_name) as staff_name
            FROM {$wpdb->prefix}bookings b
            INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
            INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
            INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
            WHERE b.id = %d
            AND b.deleted_at IS NULL",
            $booking_id
        ),
        ARRAY_A
    );

    if ( ! $booking ) {
        return new WP_Error(
            'booking_not_found',
            'Booking not found.',
            array( 'status' => 404 )
        );
    }

    // Permission check: staff can only view their own bookings
    if ( 'staff' === $current_staff['role'] && (int) $booking['staff_id'] !== (int) $current_staff['id'] ) {
        return new WP_Error(
            'forbidden',
            'You do not have permission to view this booking.',
            array( 'status' => 403 )
        );
    }

    // Format booking for response
    $formatted = $this->format_booking( $booking );

    return rest_ensure_response(
        array(
            'success' => true,
            'booking' => $formatted,
        )
    );
}
```

### 5. Add Update Booking Endpoint

Add this route in `register_routes()`:

```php
// Update booking
register_rest_route(
    self::NAMESPACE,
    '/dashboard/bookings/(?P<id>\d+)',
    array(
        'methods'             => 'PUT',
        'callback'            => array( $this, 'update_booking' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'service_id' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'staff_id' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'booking_date' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                },
            ),
            'booking_time' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return preg_match( '/^\d{2}:\d{2}(:\d{2})?$/', $param );
                },
            ),
            'status' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    $valid_statuses = array( 'pending', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show' );
                    return in_array( $param, $valid_statuses, true );
                },
            ),
            'payment_method' => array(
                'required'          => true,
            ),
            'amount_paid' => array(
                'default'           => 0,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param >= 0;
                },
            ),
            'special_requests' => array(
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'staff_notes' => array(
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'send_notification' => array(
                'default'           => false,
                'validate_callback' => function( $param ) {
                    return is_bool( $param ) || in_array( $param, array( 'true', 'false', '1', '0', 1, 0 ), true );
                },
            ),
        ),
    )
);
```

Add this method:

```php
/**
 * Update existing booking
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_booking( $request ) {
    global $wpdb;

    $booking_id = (int) $request->get_param( 'id' );
    
    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Get existing booking
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings WHERE id = %d AND deleted_at IS NULL",
            $booking_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'booking_not_found',
            'Booking not found.',
            array( 'status' => 404 )
        );
    }

    // Permission check: staff can only edit their own bookings
    if ( 'staff' === $current_staff['role'] && (int) $existing['staff_id'] !== (int) $current_staff['id'] ) {
        return new WP_Error(
            'forbidden',
            'You do not have permission to edit this booking.',
            array( 'status' => 403 )
        );
    }

    // Get new values
    $new_service_id = (int) $request->get_param( 'service_id' );
    $new_staff_id   = (int) $request->get_param( 'staff_id' );
    $new_date       = $request->get_param( 'booking_date' );
    $new_time       = $request->get_param( 'booking_time' );
    $new_status     = $request->get_param( 'status' );

    // Check if date/time/staff/service changed - need to verify availability
    $datetime_changed = 
        $existing['booking_date'] !== $new_date ||
        $existing['start_time'] !== $new_time ||
        (int) $existing['staff_id'] !== $new_staff_id ||
        (int) $existing['service_id'] !== $new_service_id;

    if ( $datetime_changed ) {
        // Load datetime model for availability check
        if ( ! class_exists( 'Datetime_Model' ) ) {
            require_once plugin_dir_path( dirname( __DIR__ ) ) . 'models/class-datetime-model.php';
        }
        $datetime_model = new Datetime_Model();

        // Check if new time slot is available
        $slots_result = $datetime_model->get_available_slots( $new_date, $new_service_id, $new_staff_id );

        if ( is_wp_error( $slots_result ) || ! $slots_result['available'] ) {
            return new WP_Error(
                'time_not_available',
                'The selected time slot is not available.',
                array( 'status' => 400 )
            );
        }

        // Check if new time is in available slots
        $all_slots = array_merge(
            $slots_result['slots']['morning'] ?? array(),
            $slots_result['slots']['afternoon'] ?? array(),
            $slots_result['slots']['evening'] ?? array()
        );

        if ( ! in_array( $new_time, $all_slots, true ) ) {
            return new WP_Error(
                'time_not_available',
                'The selected time slot is not available for this staff member.',
                array( 'status' => 400 )
            );
        }
    }

    // Get service details for duration calculation
    $service = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT duration FROM {$wpdb->prefix}bookings_services WHERE id = %d",
            $new_service_id
        ),
        ARRAY_A
    );

    if ( ! $service ) {
        return new WP_Error(
            'service_not_found',
            'Service not found.',
            array( 'status' => 404 )
        );
    }

    // Calculate end time
    $start_datetime = new DateTime( $new_date . ' ' . $new_time );
    $end_datetime   = clone $start_datetime;
    $end_datetime->modify( '+' . $service['duration'] . ' minutes' );

    // Update booking
    $update_data = array(
        'service_id'        => $new_service_id,
        'staff_id'          => $new_staff_id,
        'booking_date'      => $new_date,
        'start_time'        => $new_time,
        'end_time'          => $end_datetime->format( 'H:i:s' ),
        'duration'          => $service['duration'],
        'status'            => $new_status,
        'payment_method'    => $request->get_param( 'payment_method' ),
        'amount_paid'       => (float) $request->get_param( 'amount_paid' ),
        'special_requests'  => $request->get_param( 'special_requests' ),
        'staff_notes'       => $request->get_param( 'staff_notes' ),
        'updated_at'        => current_time( 'mysql' ),
    );

    // Calculate payment status
    $service_price = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT price FROM {$wpdb->prefix}bookings_services WHERE id = %d",
            $new_service_id
        )
    );

    $amount_paid = (float) $request->get_param( 'amount_paid' );
    $update_data['total_price'] = $service_price;
    $update_data['deposit_paid'] = $amount_paid;
    $update_data['balance_due'] = $service_price - $amount_paid;
    $update_data['full_amount_paid'] = $amount_paid >= $service_price ? 1 : 0;

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings',
        $update_data,
        array( 'id' => $booking_id ),
        array( '%d', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%f', '%s', '%s', '%s', '%f', '%f', '%f', '%d' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update booking.',
            array( 'status' => 500 )
        );
    }

    // Send notification email if requested
    $send_notification = filter_var( $request->get_param( 'send_notification' ), FILTER_VALIDATE_BOOLEAN );

    if ( $send_notification ) {
        // Load email sender
        if ( ! class_exists( 'Booking_System_Email_Sender' ) ) {
            require_once plugin_dir_path( dirname( __DIR__ ) ) . 'email/class-email-sender.php';
        }

        // Get full booking details for email
        $booking = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    b.*,
                    c.first_name AS customer_first_name,
                    c.last_name AS customer_last_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    s.name AS service_name,
                    s.duration,
                    st.first_name AS staff_first_name,
                    st.last_name AS staff_last_name
                FROM {$wpdb->prefix}bookings b
                INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
                INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
                INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
                WHERE b.id = %d",
                $booking_id
            ),
            ARRAY_A
        );

        $email_sender = new Booking_System_Email_Sender();
        
        // Determine email type based on what changed
        if ( $datetime_changed ) {
            // Send reschedule notification
            $email_sender->send_customer_confirmation( $booking ); // Reuse confirmation template
        } elseif ( $existing['status'] !== $new_status ) {
            // Send status change notification
            $email_sender->send_customer_confirmation( $booking );
        } else {
            // Send general update notification
            $email_sender->send_customer_confirmation( $booking );
        }
    }

    // Get updated booking for response
    $updated_booking = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                b.*,
                c.first_name AS customer_first_name,
                c.last_name AS customer_last_name,
                c.email AS customer_email,
                s.name AS service_name,
                st.first_name AS staff_first_name,
                st.last_name AS staff_last_name
            FROM {$wpdb->prefix}bookings b
            INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
            INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
            INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
            WHERE b.id = %d",
            $booking_id
        ),
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success'         => true,
            'message'         => 'Booking updated successfully.',
            'booking'         => $this->format_booking( $updated_booking ),
            'email_sent'      => $send_notification,
        )
    );
}
```

### 6. Add Cancel Booking Endpoint

Add this route in `register_routes()`:

```php
// Cancel booking
register_rest_route(
    self::NAMESPACE,
    '/dashboard/bookings/(?P<id>\d+)/cancel',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'cancel_booking' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'cancellation_reason' => array(
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'send_notification' => array(
                'default'           => true,
                'validate_callback' => function( $param ) {
                    return is_bool( $param ) || in_array( $param, array( 'true', 'false', '1', '0', 1, 0 ), true );
                },
            ),
        ),
    )
);
```

Add this method:

```php
/**
 * Cancel booking
 * Sets status to 'cancelled' and deleted_at timestamp
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function cancel_booking( $request ) {
    global $wpdb;

    $booking_id = (int) $request->get_param( 'id' );
    
    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Get existing booking
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings WHERE id = %d AND deleted_at IS NULL",
            $booking_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'booking_not_found',
            'Booking not found.',
            array( 'status' => 404 )
        );
    }

    // Permission check: staff can only cancel their own bookings
    if ( 'staff' === $current_staff['role'] && (int) $existing['staff_id'] !== (int) $current_staff['id'] ) {
        return new WP_Error(
            'forbidden',
            'You do not have permission to cancel this booking.',
            array( 'status' => 403 )
        );
    }

    $cancellation_reason = $request->get_param( 'cancellation_reason' );

    // Update booking: set status to cancelled AND soft delete
    $update_data = array(
        'status'      => 'cancelled',
        'deleted_at'  => current_time( 'mysql' ),
        'updated_at'  => current_time( 'mysql' ),
    );

    // Add cancellation reason to staff notes
    if ( ! empty( $cancellation_reason ) ) {
        $existing_notes = $existing['staff_notes'] ?? '';
        $cancellation_note = "\n\n[Cancelled " . current_time( 'Y-m-d H:i:s' ) . "]\n" . $cancellation_reason;
        $update_data['staff_notes'] = $existing_notes . $cancellation_note;
    }

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings',
        $update_data,
        array( 'id' => $booking_id ),
        array( '%s', '%s', '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'cancellation_failed',
            'Failed to cancel booking.',
            array( 'status' => 500 )
        );
    }

    // Send cancellation email if requested
    $send_notification = filter_var( $request->get_param( 'send_notification' ), FILTER_VALIDATE_BOOLEAN );

    if ( $send_notification ) {
        // Load email sender
        if ( ! class_exists( 'Booking_System_Email_Sender' ) ) {
            require_once plugin_dir_path( dirname( __DIR__ ) ) . 'email/class-email-sender.php';
        }

        // Get full booking details for email
        $booking = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    b.*,
                    c.first_name AS customer_first_name,
                    c.last_name AS customer_last_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    s.name AS service_name,
                    s.duration,
                    st.first_name AS staff_first_name,
                    st.last_name AS staff_last_name
                FROM {$wpdb->prefix}bookings b
                INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
                INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
                INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
                WHERE b.id = %d",
                $booking_id
            ),
            ARRAY_A
        );

        $email_sender = new Booking_System_Email_Sender();
        // TODO: Add specific cancellation email template in future
        // For now, reuse confirmation template
        $email_sender->send_customer_confirmation( $booking );
    }

    return rest_ensure_response(
        array(
            'success'    => true,
            'message'    => 'Booking cancelled successfully.',
            'email_sent' => $send_notification,
        )
    );
}
```

## Testing

### Test 1: Get Single Booking
```javascript
fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Full booking details with customer, service, staff info

### Test 2: Update Booking
```javascript
fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    service_id: 2,
    staff_id: 3,
    booking_date: '2026-02-15',
    booking_time: '14:00',
    status: 'confirmed',
    payment_method: 'cash',
    amount_paid: 35.00,
    special_requests: 'Updated request',
    staff_notes: 'Test note',
    send_notification: false
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success with updated booking data

### Test 3: Cancel Booking
```javascript
fetch('/wp-json/bookit/v1/dashboard/bookings/1/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    cancellation_reason: 'Customer requested cancellation',
    send_notification: true
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, booking status='cancelled', deleted_at set

### Test 4: Staff Permission Check
Login as staff user, try to edit booking assigned to different staff:
- Should get 403 Forbidden error

### Test 5: Availability Check on Reschedule
Try updating booking to a time slot that's not available:
- Should get 400 Bad Request with "time_not_available" error

### Test 6: Approval Setting
```php
// Test with approval ON
update_option('bookit_require_approval', true);
// Create new booking via dashboard
// Should have status 'pending'

// Test with approval OFF
update_option('bookit_require_approval', false);
// Create new booking
// Should have status 'confirmed' or 'pending_payment'
```

## Database Verification

```sql
-- Check updated statuses
SELECT id, status, deleted_at, staff_notes 
FROM wp_bookings 
ORDER BY id DESC 
LIMIT 5;

-- Check cancelled bookings
SELECT id, status, deleted_at, 
       LEFT(staff_notes, 100) as notes_preview
FROM wp_bookings 
WHERE status = 'cancelled';

-- Check approval setting
SELECT option_value 
FROM wp_options 
WHERE option_name = 'bookit_require_approval';
```

## Notes

- Customer field is NOT editable (too risky, could break payment records)
- Staff can only edit/cancel their own bookings
- Admin can edit/cancel any booking
- Cancellation sets both status='cancelled' AND deleted_at (soft delete)
- Availability is re-checked when date/time/staff/service changes
- Email notifications are optional (checkbox in UI)
- Approval setting defaults to false (no approval required)
- Status ENUM now has 6 values: pending, pending_payment, confirmed, completed, cancelled, no_show
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 3 endpoints in console**
2. **Verify database schema updated**
3. **Check approval setting works**
4. **Test permissions (staff vs admin)**

**Then come back and say:** "Part A complete, ready for Part B"

I'll give you the frontend modal prompt next! 🚀

---

**Start with Part A now!** Let me know when you're done testing the backend!