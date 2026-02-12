# 🎯 TASK 5: MANUAL BOOKING CREATION

This is a **complex task** (marked 🔥 in the sprint plan), so I'll break it into **3 manageable parts**:

1. **Part A:** Backend API endpoint (booking creation logic)
2. **Part B:** Customer selection/creation step (Vue)
3. **Part C:** Service/Staff/DateTime/Payment wizard (Vue)

Each part can be implemented and tested independently.

---

## 📋 TASK 5 OVERVIEW

**Goal:** Allow business owners to create bookings on behalf of customers via dashboard

**Time Estimate:** 12 hours
- Part A (Backend): 3-4h
- Part B (Customer Step): 3-4h
- Part C (Booking Wizard): 5-6h

**What You'll Build:**
- REST API endpoint for manual booking creation
- Multi-step modal wizard
- Customer search/autocomplete
- Service, staff, date/time selection
- Payment method options (manual, cash, card external, complimentary)
- Email confirmation toggle
- Reuses existing availability checking and booking creator

---

# 📝 PART A: BACKEND API (Cursor Prompt 1)

Copy this into Cursor Composer:

```markdown
# Task 5 Part A: Manual Booking Creation Backend API

## Context
I'm building a WordPress booking plugin dashboard. I need a REST API endpoint that allows business owners to create bookings manually on behalf of customers through the dashboard. This should reuse the existing booking creation logic from Sprint 1-2 but support additional payment methods for manual/offline payments.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing files:
- Booking creator: `includes/booking/class-booking-creator.php` (from Sprint 1-2)
- Email sender: `includes/email/class-email-sender.php`
- Dashboard API: `includes/api/class-dashboard-bookings-api.php`
- Auth: `includes/class-bookit-auth.php`

## Requirements

### 1. Add Manual Booking Endpoint

Update `includes/api/class-dashboard-bookings-api.php` to add new endpoint.

**Add this route in the `register_routes()` method:**

```php
// Manual booking creation
register_rest_route(
    self::NAMESPACE,
    '/dashboard/bookings/create',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'create_manual_booking' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'customer_id'       => array(
                'required'          => false,
                'validate_callback' => function( $param ) {
                    return empty( $param ) || is_numeric( $param );
                },
            ),
            'customer_email'    => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function( $param ) {
                    return empty( $param ) || is_email( $param );
                },
            ),
            'customer_first_name' => array(
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'customer_last_name' => array(
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'customer_phone'    => array(
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'service_id'        => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'staff_id'          => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'booking_date'      => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                },
            ),
            'booking_time'      => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return preg_match( '/^\d{2}:\d{2}(:\d{2})?$/', $param );
                },
            ),
            'payment_method'    => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    $valid_methods = array( 'pay_on_arrival', 'manual', 'cash', 'card_external', 'check', 'complimentary', 'stripe' );
                    return in_array( $param, $valid_methods, true );
                },
            ),
            'amount_paid'       => array(
                'default'           => 0,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param >= 0;
                },
            ),
            'special_requests'  => array(
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'send_confirmation' => array(
                'default'           => true,
                'validate_callback' => function( $param ) {
                    return is_bool( $param ) || in_array( $param, array( 'true', 'false', '1', '0', 1, 0 ), true );
                },
            ),
        ),
    )
);

// Customer search endpoint
register_rest_route(
    self::NAMESPACE,
    '/dashboard/customers/search',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'search_customers' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'search' => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    )
);
```

### 2. Implement Manual Booking Creation Method

Add this method to the `Bookit_Dashboard_Bookings_API` class:

```php
/**
 * Create manual booking via dashboard
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function create_manual_booking( $request ) {
    global $wpdb;

    // Verify staff is logged in
    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Get or create customer
    $customer_id = $request->get_param( 'customer_id' );

    if ( empty( $customer_id ) ) {
        // Create new customer
        $customer_email = $request->get_param( 'customer_email' );
        $customer_first = $request->get_param( 'customer_first_name' );
        $customer_last  = $request->get_param( 'customer_last_name' );
        $customer_phone = $request->get_param( 'customer_phone' );

        if ( empty( $customer_email ) || empty( $customer_first ) || empty( $customer_last ) ) {
            return new WP_Error(
                'missing_customer_data',
                'Customer email, first name, and last name are required for new customers.',
                array( 'status' => 400 )
            );
        }

        // Check if customer already exists
        $existing_customer = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_customers WHERE email = %s AND deleted_at IS NULL",
            $customer_email
        ) );

        if ( $existing_customer ) {
            $customer_id = $existing_customer;
        } else {
            // Create new customer
            $result = $wpdb->insert(
                $wpdb->prefix . 'bookings_customers',
                array(
                    'email'       => $customer_email,
                    'first_name'  => $customer_first,
                    'last_name'   => $customer_last,
                    'phone'       => $customer_phone,
                    'created_at'  => current_time( 'mysql' ),
                    'updated_at'  => current_time( 'mysql' ),
                ),
                array( '%s', '%s', '%s', '%s', '%s', '%s' )
            );

            if ( ! $result ) {
                return new WP_Error(
                    'customer_creation_failed',
                    'Failed to create customer.',
                    array( 'status' => 500 )
                );
            }

            $customer_id = $wpdb->insert_id;
        }
    }

    // Verify customer exists
    $customer = $wpdb->get_row( $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_customers WHERE id = %d AND deleted_at IS NULL",
        $customer_id
    ), ARRAY_A );

    if ( ! $customer ) {
        return new WP_Error(
            'customer_not_found',
            'Customer not found.',
            array( 'status' => 404 )
        );
    }

    // Prepare booking data for Booking_Creator
    $booking_data = array(
        'service_id'         => (int) $request->get_param( 'service_id' ),
        'staff_id'           => (int) $request->get_param( 'staff_id' ),
        'booking_date'       => $request->get_param( 'booking_date' ),
        'booking_time'       => $request->get_param( 'booking_time' ),
        'customer_email'     => $customer['email'],
        'customer_first_name' => $customer['first_name'],
        'customer_last_name' => $customer['last_name'],
        'customer_phone'     => $customer['phone'],
        'payment_method'     => $request->get_param( 'payment_method' ),
        'amount_paid'        => (float) $request->get_param( 'amount_paid' ),
        'special_requests'   => $request->get_param( 'special_requests' ),
    );

    // Load booking creator if not loaded
    if ( ! class_exists( 'Booking_System_Booking_Creator' ) ) {
        require_once plugin_dir_path( dirname( __DIR__ ) ) . 'booking/class-booking-creator.php';
    }

    // Create booking
    $creator = new Booking_System_Booking_Creator();
    $result  = $creator->create_booking( $booking_data );

    if ( is_wp_error( $result ) ) {
        return $result;
    }

    $booking_id = $result;

    // Send confirmation emails if requested
    $send_confirmation = filter_var( $request->get_param( 'send_confirmation' ), FILTER_VALIDATE_BOOLEAN );

    if ( $send_confirmation ) {
        // Load email sender
        if ( ! class_exists( 'Booking_System_Email_Sender' ) ) {
            require_once plugin_dir_path( dirname( __DIR__ ) ) . 'email/class-email-sender.php';
        }

        // Get full booking details for email
        $booking = $wpdb->get_row( $wpdb->prepare(
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
        ), ARRAY_A );

        $email_sender = new Booking_System_Email_Sender();
        $email_sender->send_customer_confirmation( $booking );
        $email_sender->send_business_notification( $booking );
    }

    // Get created booking for response
    $created_booking = $wpdb->get_row( $wpdb->prepare(
        "SELECT 
            b.*,
            c.first_name AS customer_first_name,
            c.last_name AS customer_last_name,
            s.name AS service_name,
            st.first_name AS staff_first_name,
            st.last_name AS staff_last_name
        FROM {$wpdb->prefix}bookings b
        INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
        INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
        INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
        WHERE b.id = %d",
        $booking_id
    ), ARRAY_A );

    return rest_ensure_response(
        array(
            'success'     => true,
            'message'     => 'Booking created successfully.',
            'booking_id'  => $booking_id,
            'booking'     => $this->format_booking( $created_booking ),
            'email_sent'  => $send_confirmation,
        )
    );
}
```

### 3. Implement Customer Search Method

Add this method to support customer autocomplete:

```php
/**
 * Search customers by name or email
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function search_customers( $request ) {
    global $wpdb;

    $search = $request->get_param( 'search' );

    if ( strlen( $search ) < 2 ) {
        return rest_ensure_response(
            array(
                'success'   => true,
                'customers' => array(),
            )
        );
    }

    $search_param = '%' . $wpdb->esc_like( $search ) . '%';

    $customers = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT 
                id,
                email,
                first_name,
                last_name,
                phone,
                CONCAT(first_name, ' ', last_name) as full_name
            FROM {$wpdb->prefix}bookings_customers
            WHERE deleted_at IS NULL
            AND (
                first_name LIKE %s OR
                last_name LIKE %s OR
                email LIKE %s OR
                CONCAT(first_name, ' ', last_name) LIKE %s
            )
            ORDER BY first_name ASC, last_name ASC
            LIMIT 20",
            $search_param,
            $search_param,
            $search_param,
            $search_param
        ),
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success'   => true,
            'customers' => $customers,
        )
    );
}
```

## Implementation Steps

1. **Open the dashboard API controller:**
   `includes/api/class-dashboard-bookings-api.php`

2. **Add two new routes** in `register_routes()`:
   - `/dashboard/bookings/create` (POST)
   - `/dashboard/customers/search` (GET)

3. **Add two new methods:**
   - `create_manual_booking()`
   - `search_customers()`

4. **Test endpoints in browser console:**

```javascript
// Test customer search
fetch('/wp-json/bookit/v1/dashboard/customers/search?search=Alice', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Expected: List of customers matching "Alice"

// Test manual booking creation
fetch('/wp-json/bookit/v1/dashboard/bookings/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    customer_id: 1,  // Or use customer_email, customer_first_name, customer_last_name for new customer
    service_id: 1,
    staff_id: 1,
    booking_date: '2026-02-15',
    booking_time: '14:00',
    payment_method: 'cash',
    amount_paid: 50.00,
    special_requests: 'Test booking from dashboard',
    send_confirmation: false
  })
}).then(r => r.json()).then(console.log)

// Expected: { success: true, booking_id: X, booking: {...} }
```

## Expected API Responses

**POST /dashboard/bookings/create (Success):**
```json
{
  "success": true,
  "message": "Booking created successfully.",
  "booking_id": 123,
  "booking": {
    "id": 123,
    "booking_date": "2026-02-15",
    "start_time": "14:00",
    "customer_name": "Alice Smith",
    "service_name": "Haircut",
    "staff_name": "Emma Thompson",
    "status": "confirmed",
    ...
  },
  "email_sent": false
}
```

**GET /dashboard/customers/search?search=Alice:**
```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "email": "alice.smith@example.com",
      "first_name": "Alice",
      "last_name": "Smith",
      "phone": "07700900001",
      "full_name": "Alice Smith"
    }
  ]
}
```

## Testing Checklist

Part A Backend Testing:
- [ ] Customer search endpoint returns matching customers
- [ ] Search is case-insensitive
- [ ] Search matches first name, last name, email, or full name
- [ ] Create booking with existing customer_id works
- [ ] Create booking with new customer (email, first_name, last_name) works
- [ ] Duplicate customer email reuses existing customer
- [ ] Booking creator validates service/staff/date/time
- [ ] Payment methods accepted: pay_on_arrival, manual, cash, card_external, check, complimentary
- [ ] Amount paid is optional (defaults to 0)
- [ ] Special requests are saved
- [ ] send_confirmation=true sends emails
- [ ] send_confirmation=false skips emails
- [ ] Returns booking_id and full booking data
- [ ] Validates required fields (service_id, staff_id, booking_date, booking_time, payment_method)
- [ ] Returns appropriate errors (400, 404, 500)
- [ ] No PHP errors in debug.log

## Notes

- Reuses `Booking_System_Booking_Creator::create_booking()` from Sprint 1-2
- Reuses `Booking_System_Email_Sender` for confirmation emails
- Customer search returns max 20 results
- Search requires minimum 2 characters
- If customer_id provided, ignores customer_email/first_name/last_name
- If customer_email exists, reuses that customer (prevents duplicates)
- New payment methods: manual, cash, card_external, check, complimentary
- send_confirmation defaults to true
- Booking status determined by payment_method (same as existing logic)

## Troubleshooting

**Error: "Customer not found"**
- Check customer_id is valid
- Verify customer not soft-deleted (deleted_at IS NULL)

**Error: "Failed to create customer"**
- Check customer_email is valid email format
- Verify first_name and last_name are provided
- Check database permissions

**Booking creation fails:**
- Check service_id and staff_id are valid
- Verify date format is YYYY-MM-DD
- Verify time format is HH:MM or HH:MM:SS
- Check slot is available (no conflicts)
- Verify Booking_System_Booking_Creator class exists

**Emails not sending:**
- Check send_confirmation is true
- Verify Booking_System_Email_Sender class exists
- Check email configuration in WordPress
- Look for email errors in debug.log
```

---

## ⏸️ PAUSE POINT AFTER PART A

**After implementing Part A:**

1. **Test both endpoints in browser console**
2. **Try creating a booking with existing customer**
3. **Try creating a booking with new customer**
4. **Verify customer search works**
5. **Check emails send (if send_confirmation=true)**

**Then come back and say:** "Part A complete, ready for Part B"

I'll give you the customer selection UI prompt next!

---

**Start with Part A now?** Let me know when you're done testing the backend! 🚀