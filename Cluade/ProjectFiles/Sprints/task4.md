# 🎯 TASK 4: BOOKINGS LIST VIEW

This task is substantial, so I'll break it into **2 Cursor Composer prompts** for manageability:

1. **Part A:** Backend API with filtering & pagination
2. **Part B:** Vue component with table, filters, and search

---

## 📋 TASK 4 OVERVIEW

**Goal:** Comprehensive bookings management view with filtering and search

**Time Estimate:** 12 hours
- Part A (Backend): 5-6h
- Part B (Frontend): 6-7h

**What You'll Build:**
- REST API endpoint with query parameters (date range, staff, service, status)
- Vue table component with sortable columns
- Filter dropdowns (Staff, Service, Status)
- Date range picker
- Search by customer name/email
- Pagination (20 bookings per page)
- Click row → View details (alert placeholder for Task 6)

---

# 📝 PART A: BACKEND API (Cursor Prompt 1)

Copy this into Cursor Composer:

```markdown
# Task 4 Part A: Bookings List API with Filtering

## Context
I'm building a WordPress booking plugin dashboard. I need a REST API endpoint that returns ALL bookings (not just today's) with comprehensive filtering, searching, and pagination.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing files:
- Auth: `includes/class-bookit-auth.php`
- Existing dashboard API: `includes/api/class-dashboard-bookings-api.php` (from Task 3)
- Database tables: `wp_bookings`, `wp_bookings_customers`, `wp_bookings_services`, `wp_bookings_staff`

## Requirements

### 1. Extend Dashboard Bookings API Controller

Update `includes/api/class-dashboard-bookings-api.php` to add new endpoint:

**Add this new route in the `register_routes()` method:**

```php
// All bookings with filtering
register_rest_route(
    self::NAMESPACE,
    '/dashboard/bookings',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_all_bookings' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'page'        => array(
                'default'           => 1,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param > 0;
                },
            ),
            'per_page'    => array(
                'default'           => 20,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param > 0 && $param <= 100;
                },
            ),
            'date_from'   => array(
                'validate_callback' => function( $param ) {
                    return empty( $param ) || preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                },
            ),
            'date_to'     => array(
                'validate_callback' => function( $param ) {
                    return empty( $param ) || preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                },
            ),
            'staff_id'    => array(
                'validate_callback' => function( $param ) {
                    return empty( $param ) || is_numeric( $param );
                },
            ),
            'service_id'  => array(
                'validate_callback' => function( $param ) {
                    return empty( $param ) || is_numeric( $param );
                },
            ),
            'status'      => array(
                'validate_callback' => function( $param ) {
                    $valid_statuses = array( 'pending', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show' );
                    return empty( $param ) || in_array( $param, $valid_statuses, true );
                },
            ),
            'search'      => array(
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order_by'    => array(
                'default'           => 'booking_date',
                'validate_callback' => function( $param ) {
                    $valid_columns = array( 'booking_date', 'start_time', 'status', 'created_at' );
                    return in_array( $param, $valid_columns, true );
                },
            ),
            'order'       => array(
                'default'           => 'DESC',
                'validate_callback' => function( $param ) {
                    return in_array( strtoupper( $param ), array( 'ASC', 'DESC' ), true );
                },
            ),
        ),
    )
);
```

### 2. Implement Get All Bookings Method

Add this method to the `Bookit_Dashboard_Bookings_API` class:

```php
/**
 * Get all bookings with filtering and pagination
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_all_bookings( $request ) {
    global $wpdb;

    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Get parameters
    $page       = (int) $request->get_param( 'page' );
    $per_page   = (int) $request->get_param( 'per_page' );
    $date_from  = $request->get_param( 'date_from' );
    $date_to    = $request->get_param( 'date_to' );
    $staff_id   = $request->get_param( 'staff_id' );
    $service_id = $request->get_param( 'service_id' );
    $status     = $request->get_param( 'status' );
    $search     = $request->get_param( 'search' );
    $order_by   = $request->get_param( 'order_by' );
    $order      = strtoupper( $request->get_param( 'order' ) );

    // Build base query
    $query = "
        SELECT 
            b.id,
            b.booking_date,
            b.start_time,
            b.end_time,
            b.duration,
            b.status,
            b.total_price,
            b.deposit_paid,
            b.balance_due,
            b.full_amount_paid,
            b.payment_method,
            b.special_requests,
            b.staff_notes,
            b.created_at,
            c.first_name AS customer_first_name,
            c.last_name AS customer_last_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            s.name AS service_name,
            st.first_name AS staff_first_name,
            st.last_name AS staff_last_name,
            st.id AS staff_id
        FROM {$wpdb->prefix}bookings b
        INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
        INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
        INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
        WHERE b.deleted_at IS NULL
    ";

    $params = array();

    // Role-based filtering (staff only see their bookings)
    if ( 'staff' === $current_staff['role'] ) {
        $query   .= " AND b.staff_id = %d";
        $params[] = $current_staff['id'];
    }

    // Date range filter
    if ( ! empty( $date_from ) ) {
        $query   .= " AND b.booking_date >= %s";
        $params[] = $date_from;
    }
    if ( ! empty( $date_to ) ) {
        $query   .= " AND b.booking_date <= %s";
        $params[] = $date_to;
    }

    // Staff filter (admin can filter by specific staff)
    if ( ! empty( $staff_id ) && 'admin' === $current_staff['role'] ) {
        $query   .= " AND b.staff_id = %d";
        $params[] = (int) $staff_id;
    }

    // Service filter
    if ( ! empty( $service_id ) ) {
        $query   .= " AND b.service_id = %d";
        $params[] = (int) $service_id;
    }

    // Status filter
    if ( ! empty( $status ) ) {
        $query   .= " AND b.status = %s";
        $params[] = $status;
    }

    // Search filter (customer name or email)
    if ( ! empty( $search ) ) {
        $search_param = '%' . $wpdb->esc_like( $search ) . '%';
        $query       .= " AND (
            c.first_name LIKE %s OR 
            c.last_name LIKE %s OR 
            c.email LIKE %s OR
            CONCAT(c.first_name, ' ', c.last_name) LIKE %s
        )";
        $params[] = $search_param;
        $params[] = $search_param;
        $params[] = $search_param;
        $params[] = $search_param;
    }

    // Get total count before pagination
    $count_query = "SELECT COUNT(*) FROM ({$query}) AS filtered_bookings";
    $total       = ! empty( $params ) 
        ? $wpdb->get_var( $wpdb->prepare( $count_query, $params ) )
        : $wpdb->get_var( $count_query );

    // Add ordering
    $valid_order_columns = array(
        'booking_date' => 'b.booking_date',
        'start_time'   => 'b.start_time',
        'status'       => 'b.status',
        'created_at'   => 'b.created_at',
    );
    
    $order_column = isset( $valid_order_columns[ $order_by ] ) 
        ? $valid_order_columns[ $order_by ] 
        : 'b.booking_date';
    
    $query .= " ORDER BY {$order_column} {$order}, b.start_time {$order}";

    // Add pagination
    $offset   = ( $page - 1 ) * $per_page;
    $query   .= " LIMIT %d OFFSET %d";
    $params[] = $per_page;
    $params[] = $offset;

    // Execute query
    $results = ! empty( $params )
        ? $wpdb->get_results( $wpdb->prepare( $query, $params ), ARRAY_A )
        : $wpdb->get_results( $query, ARRAY_A );

    if ( null === $results ) {
        return new WP_Error(
            'database_error',
            'Failed to retrieve bookings.',
            array( 'status' => 500 )
        );
    }

    // Format bookings for frontend
    $bookings = array_map( array( $this, 'format_booking' ), $results );

    // Calculate pagination info
    $total_pages = ceil( $total / $per_page );

    return rest_ensure_response(
        array(
            'success'     => true,
            'bookings'    => $bookings,
            'pagination'  => array(
                'total'        => (int) $total,
                'per_page'     => $per_page,
                'current_page' => $page,
                'total_pages'  => $total_pages,
                'has_next'     => $page < $total_pages,
                'has_prev'     => $page > 1,
            ),
            'filters'     => array(
                'date_from'  => $date_from,
                'date_to'    => $date_to,
                'staff_id'   => $staff_id,
                'service_id' => $service_id,
                'status'     => $status,
                'search'     => $search,
            ),
        )
    );
}
```

### 3. Add Helper Endpoints for Filter Dropdowns

Add these routes to `register_routes()`:

```php
// Get staff list for filter dropdown
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_staff_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);

// Get services list for filter dropdown
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_services_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

Add these methods to the class:

```php
/**
 * Get staff list for filter dropdown
 *
 * @return WP_REST_Response|WP_Error
 */
public function get_staff_list() {
    global $wpdb;

    $staff = $wpdb->get_results(
        "SELECT 
            id,
            CONCAT(first_name, ' ', last_name) as name
        FROM {$wpdb->prefix}bookings_staff
        WHERE is_active = 1
        AND deleted_at IS NULL
        ORDER BY first_name ASC",
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success' => true,
            'staff'   => $staff,
        )
    );
}

/**
 * Get services list for filter dropdown
 *
 * @return WP_REST_Response|WP_Error
 */
public function get_services_list() {
    global $wpdb;

    $services = $wpdb->get_results(
        "SELECT 
            id,
            name
        FROM {$wpdb->prefix}bookings_services
        WHERE is_active = 1
        AND deleted_at IS NULL
        ORDER BY name ASC",
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success'  => true,
            'services' => $services,
        )
    );
}
```

## Implementation Steps

1. **Open the existing API controller:**
   `includes/api/class-dashboard-bookings-api.php`

2. **Add the three new routes** in `register_routes()` method:
   - `/dashboard/bookings` (main list endpoint)
   - `/dashboard/staff/list` (for staff filter dropdown)
   - `/dashboard/services/list` (for service filter dropdown)

3. **Add the three new methods** to the class:
   - `get_all_bookings()`
   - `get_staff_list()`
   - `get_services_list()`

4. **Test the endpoints** in browser console:
   ```javascript
   // Test all bookings
   fetch('/wp-json/bookit/v1/dashboard/bookings?per_page=10', {
     headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   
   // Test with filters
   fetch('/wp-json/bookit/v1/dashboard/bookings?status=confirmed&date_from=2026-02-01', {
     headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   
   // Test staff list
   fetch('/wp-json/bookit/v1/dashboard/staff/list', {
     headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   
   // Test services list
   fetch('/wp-json/bookit/v1/dashboard/services/list', {
     headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

## Expected API Responses

**GET /dashboard/bookings?page=1&per_page=20:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "booking_date": "2026-02-09",
      "start_time": "09:00",
      "end_time": "10:00",
      "status": "confirmed",
      "customer_name": "Alice Smith",
      "service_name": "Haircut",
      "staff_name": "Emma Thompson",
      ...
    }
  ],
  "pagination": {
    "total": 45,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "date_from": null,
    "date_to": null,
    "staff_id": null,
    "service_id": null,
    "status": null,
    "search": null
  }
}
```

**GET /dashboard/staff/list:**
```json
{
  "success": true,
  "staff": [
    { "id": 1, "name": "Test Admin" },
    { "id": 2, "name": "Emma Thompson" }
  ]
}
```

**GET /dashboard/services/list:**
```json
{
  "success": true,
  "services": [
    { "id": 1, "name": "Haircut" },
    { "id": 2, "name": "Hair Coloring" }
  ]
}
```

## Testing Checklist

Part A Backend Testing:
- [ ] `/dashboard/bookings` returns paginated bookings
- [ ] Admin sees all bookings
- [ ] Staff sees only their bookings
- [ ] Date range filter works (`date_from`, `date_to`)
- [ ] Staff filter works (admin only)
- [ ] Service filter works
- [ ] Status filter works
- [ ] Search by customer name works
- [ ] Search by customer email works
- [ ] Pagination works (page 1, page 2, etc.)
- [ ] `per_page` parameter works (10, 20, 50)
- [ ] Order by date works (ASC/DESC)
- [ ] Staff list endpoint returns active staff
- [ ] Services list endpoint returns active services
- [ ] No console errors
- [ ] No PHP errors in debug.log

## Notes

- The `format_booking()` method already exists from Task 3
- Reusing the same `check_dashboard_permission()` method
- Pagination defaults to 20 items per page (max 100)
- Search is case-insensitive and matches partial names/emails
- Staff role filter is admin-only (staff can't filter by other staff)
- Role-based filtering automatically applied (staff see only theirs)
- All queries use prepared statements for security
- Deleted bookings (`deleted_at IS NOT NULL`) are excluded

## Troubleshooting

**No bookings returned:**
- Check if you have bookings in database (not just today)
- Verify `deleted_at IS NULL` in bookings table
- Check role-based filtering (staff might not have bookings)

**Pagination not working:**
- Check `total` count matches database
- Verify `page` and `per_page` parameters are numeric
- Check offset calculation: `(page - 1) * per_page`

**Filters not working:**
- Check query parameters are being received
- Verify parameter names match (underscore vs camelCase)
- Check SQL WHERE clauses are being added correctly

**Search not finding results:**
- Check `LIKE` wildcards are added (`%search%`)
- Verify `esc_like()` is being used
- Test with exact customer name first
```

---

## ⏸️ PAUSE POINT

**After implementing Part A:**

1. **Test all endpoints in browser console**
2. **Verify filters work correctly**
3. **Check pagination works**
4. **Confirm role-based access works**

**Then come back and say:** "Part A complete, ready for Part B"

I'll give you the Vue frontend prompt next! 🎯

---

**Start with Part A now?** Let me know when you're done testing the backend! 🚀