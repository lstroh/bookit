# 📝 TASK 9 PART A: BACKEND STAFF API

```markdown
# Task 9 Part A: Staff Management Backend API

## Context
I'm building a WordPress booking plugin dashboard. Tasks 1-8 are complete. Now I need full CRUD operations for managing staff members, including service assignments with custom pricing and working hours status checking.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing API file:
- `includes/api/class-dashboard-bookings-api.php`

Database tables:
- `wp_bookings_staff` - Staff members table
- `wp_bookings_staff_services` - Junction table (staff to services with custom pricing)
- `wp_bookings_staff_working_hours` - Working hours configuration
- `wp_bookings` - Bookings table (for validation)

## Requirements

### 1. Add Staff List Endpoint

Add this route in `register_routes()` method:

```php
// Get staff list
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_staff_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'search' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'role' => array(
                'type' => 'string',
                'enum' => array( 'admin', 'staff', 'all' ),
                'default' => 'all',
            ),
            'status' => array(
                'type'    => 'string',
                'enum'    => array( 'active', 'inactive', 'all' ),
                'default' => 'all',
            ),
            'service_id' => array(
                'type'              => 'integer',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
        ),
    )
);
```

### 2. Add Get Staff List Method

Add this method:

```php
/**
 * Get staff list with filters
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function get_staff_list( $request ) {
    global $wpdb;

    // Get query parameters
    $search     = $request->get_param( 'search' );
    $role       = $request->get_param( 'role' );
    $status     = $request->get_param( 'status' );
    $service_id = $request->get_param( 'service_id' );

    // Build WHERE clauses
    $where_clauses = array( 'st.deleted_at IS NULL' );
    $where_params  = array();

    // Search filter
    if ( ! empty( $search ) ) {
        $where_clauses[] = '(st.first_name LIKE %s OR st.last_name LIKE %s OR st.email LIKE %s OR st.title LIKE %s)';
        $search_term     = '%' . $wpdb->esc_like( $search ) . '%';
        $where_params[]  = $search_term;
        $where_params[]  = $search_term;
        $where_params[]  = $search_term;
        $where_params[]  = $search_term;
    }

    // Role filter
    if ( 'admin' === $role ) {
        $where_clauses[] = "st.role = 'admin'";
    } elseif ( 'staff' === $role ) {
        $where_clauses[] = "st.role = 'staff'";
    }

    // Status filter
    if ( 'active' === $status ) {
        $where_clauses[] = 'st.is_active = 1';
    } elseif ( 'inactive' === $status ) {
        $where_clauses[] = 'st.is_active = 0';
    }

    // Service filter
    if ( ! empty( $service_id ) ) {
        $where_clauses[] = 'EXISTS (
            SELECT 1 FROM ' . $wpdb->prefix . 'bookings_staff_services ss 
            WHERE ss.staff_id = st.id 
            AND ss.service_id = %d
        )';
        $where_params[] = (int) $service_id;
    }

    $where_sql = implode( ' AND ', $where_clauses );

    // Get staff with service count and working hours status
    $query = "SELECT 
                st.id,
                st.email,
                st.first_name,
                st.last_name,
                CONCAT(st.first_name, ' ', st.last_name) as full_name,
                st.phone,
                st.photo_url,
                st.bio,
                st.title,
                st.role,
                st.google_calendar_id,
                st.is_active,
                st.display_order,
                st.created_at,
                st.updated_at,
                COUNT(DISTINCT ss.service_id) as service_count,
                COUNT(DISTINCT wh.id) as working_hours_count,
                COUNT(DISTINCT CASE WHEN b.booking_date >= CURDATE() AND b.deleted_at IS NULL THEN b.id END) as future_bookings_count
            FROM {$wpdb->prefix}bookings_staff st
            LEFT JOIN {$wpdb->prefix}bookings_staff_services ss ON st.id = ss.staff_id
            LEFT JOIN {$wpdb->prefix}bookings_staff_working_hours wh ON st.id = wh.staff_id AND wh.is_working = 1
            LEFT JOIN {$wpdb->prefix}bookings b ON st.id = b.staff_id
            WHERE $where_sql
            GROUP BY st.id
            ORDER BY st.display_order ASC, st.first_name ASC, st.last_name ASC";

    if ( ! empty( $where_params ) ) {
        $query = $wpdb->prepare( $query, $where_params );
    }

    $staff_list = $wpdb->get_results( $query, ARRAY_A );

    // Process each staff member
    foreach ( $staff_list as &$staff ) {
        $staff['id']                     = (int) $staff['id'];
        $staff['display_order']          = (int) $staff['display_order'];
        $staff['is_active']              = (bool) $staff['is_active'];
        $staff['service_count']          = (int) $staff['service_count'];
        $staff['working_hours_count']    = (int) $staff['working_hours_count'];
        $staff['future_bookings_count']  = (int) $staff['future_bookings_count'];
        $staff['has_working_hours']      = $staff['working_hours_count'] > 0;
        
        // Remove password hash from response
        unset( $staff['password_hash'] );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'staff'   => $staff_list,
        )
    );
}
```

### 3. Add Get/Update/Delete Staff Routes

Add this combined route:

```php
// Get/Update/Delete single staff
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<id>\d+)',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_staff_details' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
        array(
            'methods'             => 'PUT',
            'callback'            => array( $this, 'update_staff' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'validate_callback' => function( $param ) {
                        return is_email( $param );
                    },
                ),
                'first_name' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'last_name' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'phone' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'photo_url' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ),
                'bio' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
                'title' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'role' => array(
                    'required' => true,
                    'type'     => 'string',
                    'enum'     => array( 'staff', 'admin' ),
                ),
                'google_calendar_id' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'is_active' => array(
                    'type'    => 'boolean',
                    'default' => true,
                ),
                'display_order' => array(
                    'type'    => 'integer',
                    'default' => 0,
                ),
                'service_assignments' => array(
                    'type'  => 'array',
                    'items' => array(
                        'type'       => 'object',
                        'properties' => array(
                            'service_id'   => array( 'type' => 'integer' ),
                            'custom_price' => array( 'type' => 'number' ),
                        ),
                    ),
                ),
            ),
        ),
        array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_staff' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
    )
);
```

### 4. Add Create Staff Endpoint

Add this route:

```php
// Create new staff
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/create',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'create_staff' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'email' => array(
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => function( $param ) {
                    return is_email( $param );
                },
            ),
            'password' => array(
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => function( $param ) {
                    return strlen( $param ) >= 8;
                },
            ),
            'first_name' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'last_name' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'phone' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'photo_url' => array(
                'type'              => 'string',
                'sanitize_callback' => 'esc_url_raw',
            ),
            'bio' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'title' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'role' => array(
                'required' => true,
                'type'     => 'string',
                'enum'     => array( 'staff', 'admin' ),
            ),
            'google_calendar_id' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'is_active' => array(
                'type'    => 'boolean',
                'default' => true,
            ),
            'display_order' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
            'service_assignments' => array(
                'type'  => 'array',
                'items' => array(
                    'type'       => 'object',
                    'properties' => array(
                        'service_id'   => array( 'type' => 'integer' ),
                        'custom_price' => array( 'type' => 'number' ),
                    ),
                ),
            ),
        ),
    )
);
```

### 5. Add Reorder Staff Endpoint

Add this route:

```php
// Reorder staff
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/reorder',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'reorder_staff' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'staff' => array(
                'required' => true,
                'type'     => 'array',
                'items'    => array(
                    'type'       => 'object',
                    'properties' => array(
                        'id'            => array( 'type' => 'integer' ),
                        'display_order' => array( 'type' => 'integer' ),
                    ),
                ),
            ),
        ),
    )
);
```

### 6. Add Staff Management Methods

Add these methods to the class:

```php
/**
 * Get single staff details
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_staff_details( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'id' );

    // Get staff with counts
    $staff = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                st.*,
                CONCAT(st.first_name, ' ', st.last_name) as full_name,
                COUNT(DISTINCT ss.service_id) as service_count,
                COUNT(DISTINCT wh.id) as working_hours_count,
                COUNT(DISTINCT CASE WHEN b.booking_date >= CURDATE() AND b.deleted_at IS NULL THEN b.id END) as future_bookings_count
            FROM {$wpdb->prefix}bookings_staff st
            LEFT JOIN {$wpdb->prefix}bookings_staff_services ss ON st.id = ss.staff_id
            LEFT JOIN {$wpdb->prefix}bookings_staff_working_hours wh ON st.id = wh.staff_id AND wh.is_working = 1
            LEFT JOIN {$wpdb->prefix}bookings b ON st.id = b.staff_id
            WHERE st.id = %d
            AND st.deleted_at IS NULL
            GROUP BY st.id",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $staff ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Get service assignments with custom pricing
    $service_assignments = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT 
                ss.service_id,
                ss.custom_price,
                s.name as service_name,
                s.price as base_price
            FROM {$wpdb->prefix}bookings_staff_services ss
            INNER JOIN {$wpdb->prefix}bookings_services s ON ss.service_id = s.id
            WHERE ss.staff_id = %d
            AND s.deleted_at IS NULL
            ORDER BY s.name",
            $staff_id
        ),
        ARRAY_A
    );

    // Process service assignments
    foreach ( $service_assignments as &$assignment ) {
        $assignment['service_id']   = (int) $assignment['service_id'];
        $assignment['custom_price'] = $assignment['custom_price'] ? (float) $assignment['custom_price'] : null;
        $assignment['base_price']   = (float) $assignment['base_price'];
    }

    // Convert numeric fields
    $staff['id']                    = (int) $staff['id'];
    $staff['display_order']         = (int) $staff['display_order'];
    $staff['is_active']             = (bool) $staff['is_active'];
    $staff['service_count']         = (int) $staff['service_count'];
    $staff['working_hours_count']   = (int) $staff['working_hours_count'];
    $staff['future_bookings_count'] = (int) $staff['future_bookings_count'];
    $staff['has_working_hours']     = $staff['working_hours_count'] > 0;
    $staff['service_assignments']   = $service_assignments;

    // Remove password hash
    unset( $staff['password_hash'] );

    return rest_ensure_response(
        array(
            'success' => true,
            'staff'   => $staff,
        )
    );
}

/**
 * Create new staff member
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function create_staff( $request ) {
    global $wpdb;

    $email = $request->get_param( 'email' );

    // Check for duplicate email
    $existing = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff 
            WHERE email = %s AND deleted_at IS NULL",
            $email
        )
    );

    if ( $existing ) {
        return new WP_Error(
            'duplicate_email',
            'A staff member with this email already exists.',
            array( 'status' => 409 )
        );
    }

    // Hash password
    $password      = $request->get_param( 'password' );
    $password_hash = password_hash( $password, PASSWORD_DEFAULT );

    // Insert staff
    $result = $wpdb->insert(
        $wpdb->prefix . 'bookings_staff',
        array(
            'email'              => $email,
            'password_hash'      => $password_hash,
            'first_name'         => $request->get_param( 'first_name' ),
            'last_name'          => $request->get_param( 'last_name' ),
            'phone'              => $request->get_param( 'phone' ),
            'photo_url'          => $request->get_param( 'photo_url' ),
            'bio'                => $request->get_param( 'bio' ),
            'title'              => $request->get_param( 'title' ),
            'role'               => $request->get_param( 'role' ),
            'google_calendar_id' => $request->get_param( 'google_calendar_id' ),
            'is_active'          => filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN ) ? 1 : 0,
            'display_order'      => (int) $request->get_param( 'display_order' ),
            'created_at'         => current_time( 'mysql' ),
            'updated_at'         => current_time( 'mysql' ),
        ),
        array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'creation_failed',
            'Failed to create staff member.',
            array( 'status' => 500 )
        );
    }

    $staff_id = $wpdb->insert_id;

    // Insert service assignments
    $service_assignments = $request->get_param( 'service_assignments' );
    if ( ! empty( $service_assignments ) ) {
        foreach ( $service_assignments as $assignment ) {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_staff_services',
                array(
                    'staff_id'     => $staff_id,
                    'service_id'   => (int) $assignment['service_id'],
                    'custom_price' => isset( $assignment['custom_price'] ) ? (float) $assignment['custom_price'] : null,
                    'created_at'   => current_time( 'mysql' ),
                ),
                array( '%d', '%d', '%f', '%s' )
            );
        }
    }

    // Get created staff
    $staff_response = $this->get_staff_details(
        new WP_REST_Request( 'GET', "/dashboard/staff/{$staff_id}" )
    );

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Staff member created successfully.',
            'staff'   => $staff_response->data['staff'],
        )
    );
}

/**
 * Update existing staff member
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_staff( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'id' );

    // Check if staff exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, email FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    $email = $request->get_param( 'email' );

    // Check for duplicate email (excluding current staff)
    $duplicate = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff 
            WHERE email = %s AND id != %d AND deleted_at IS NULL",
            $email,
            $staff_id
        )
    );

    if ( $duplicate ) {
        return new WP_Error(
            'duplicate_email',
            'A staff member with this email already exists.',
            array( 'status' => 409 )
        );
    }

    // Update staff
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        array(
            'email'              => $email,
            'first_name'         => $request->get_param( 'first_name' ),
            'last_name'          => $request->get_param( 'last_name' ),
            'phone'              => $request->get_param( 'phone' ),
            'photo_url'          => $request->get_param( 'photo_url' ),
            'bio'                => $request->get_param( 'bio' ),
            'title'              => $request->get_param( 'title' ),
            'role'               => $request->get_param( 'role' ),
            'google_calendar_id' => $request->get_param( 'google_calendar_id' ),
            'is_active'          => filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN ) ? 1 : 0,
            'display_order'      => (int) $request->get_param( 'display_order' ),
            'updated_at'         => current_time( 'mysql' ),
        ),
        array( 'id' => $staff_id ),
        array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update staff member.',
            array( 'status' => 500 )
        );
    }

    // Delete existing service assignments
    $wpdb->delete(
        $wpdb->prefix . 'bookings_staff_services',
        array( 'staff_id' => $staff_id ),
        array( '%d' )
    );

    // Insert new service assignments
    $service_assignments = $request->get_param( 'service_assignments' );
    if ( ! empty( $service_assignments ) ) {
        foreach ( $service_assignments as $assignment ) {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_staff_services',
                array(
                    'staff_id'     => $staff_id,
                    'service_id'   => (int) $assignment['service_id'],
                    'custom_price' => isset( $assignment['custom_price'] ) ? (float) $assignment['custom_price'] : null,
                    'created_at'   => current_time( 'mysql' ),
                ),
                array( '%d', '%d', '%f', '%s' )
            );
        }
    }

    // Get updated staff
    $staff_response = $this->get_staff_details( $request );

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Staff member updated successfully.',
            'staff'   => $staff_response->data['staff'],
        )
    );
}

/**
 * Delete staff member (soft delete)
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function delete_staff( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'id' );

    // Check if staff exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, first_name, last_name FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Check for future bookings
    $future_bookings = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings 
            WHERE staff_id = %d 
            AND booking_date >= CURDATE()
            AND deleted_at IS NULL
            AND status NOT IN ('cancelled', 'no_show')",
            $staff_id
        )
    );

    if ( $future_bookings > 0 ) {
        return new WP_Error(
            'staff_has_bookings',
            sprintf( 
                'Cannot delete %s %s because they have %d future booking(s). Please reassign or cancel these bookings first, or deactivate the staff member instead.',
                $existing['first_name'],
                $existing['last_name'],
                $future_bookings
            ),
            array( 'status' => 409 )
        );
    }

    // Soft delete the staff member
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        array(
            'deleted_at' => current_time( 'mysql' ),
            'updated_at' => current_time( 'mysql' ),
        ),
        array( 'id' => $staff_id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'deletion_failed',
            'Failed to delete staff member.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Staff member deleted successfully.',
        )
    );
}

/**
 * Reorder staff members
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function reorder_staff( $request ) {
    global $wpdb;

    $staff = $request->get_param( 'staff' );

    if ( empty( $staff ) ) {
        return new WP_Error(
            'invalid_data',
            'Staff array is required.',
            array( 'status' => 400 )
        );
    }

    // Update display order for each staff member
    foreach ( $staff as $staff_data ) {
        if ( ! isset( $staff_data['id'] ) || ! isset( $staff_data['display_order'] ) ) {
            continue;
        }

        $wpdb->update(
            $wpdb->prefix . 'bookings_staff',
            array(
                'display_order' => (int) $staff_data['display_order'],
                'updated_at'    => current_time( 'mysql' ),
            ),
            array( 'id' => (int) $staff_data['id'] ),
            array( '%d', '%s' ),
            array( '%d' )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Staff reordered successfully.',
        )
    );
}
```

## Testing

### Test 1: List All Staff
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/list', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Staff list:', data.staff)
  console.log('First staff:', data.staff[0])
  console.log('Service count:', data.staff[0].service_count)
  console.log('Has working hours:', data.staff[0].has_working_hours)
})
```

Expected: List with service counts and working hours status

### Test 2: Search Staff
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/list?search=emma', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Only staff matching "emma"

### Test 3: Filter by Service
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/list?service_id=1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Only staff assigned to service ID 1

### Test 4: Get Single Staff
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Staff details:', data.staff)
  console.log('Service assignments:', data.staff.service_assignments)
})
```

Expected: Full staff details with service assignments

### Test 5: Create Staff
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    phone: '01234567890',
    title: 'Stylist',
    bio: 'Test bio',
    role: 'staff',
    is_active: true,
    display_order: 10,
    service_assignments: [
      { service_id: 1, custom_price: null },
      { service_id: 2, custom_price: 45.00 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success with created staff and service assignments

### Test 6: Update Staff with Service Changes
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'emma@example.com',
    first_name: 'Emma',
    last_name: 'Smith',
    phone: '01234567890',
    title: 'Senior Stylist',
    bio: 'Updated bio',
    role: 'staff',
    is_active: true,
    display_order: 1,
    service_assignments: [
      { service_id: 1, custom_price: 40.00 },
      { service_id: 3, custom_price: null }
    ]
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, service assignments updated

### Test 7: Delete Staff with Future Bookings
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: 409 error with booking count

### Test 8: Duplicate Email Check
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'emma@example.com', // Duplicate
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    role: 'staff'
  })
}).then(r => r.json()).then(console.log)
```

Expected: 409 error "Email already exists"

## Database Verification

```sql
-- Check staff with service assignments
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    COUNT(ss.service_id) as service_count
FROM wp_bookings_staff s
LEFT JOIN wp_bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.deleted_at IS NULL
GROUP BY s.id;

-- Check service assignments with custom pricing
SELECT 
    CONCAT(st.first_name, ' ', st.last_name) as staff_name,
    s.name as service_name,
    s.price as base_price,
    ss.custom_price
FROM wp_bookings_staff_services ss
INNER JOIN wp_bookings_staff st ON ss.staff_id = st.id
INNER JOIN wp_bookings_services s ON ss.service_id = s.id
ORDER BY st.first_name, s.name;

-- Check working hours status
SELECT 
    s.id,
    CONCAT(s.first_name, ' ', s.last_name) as name,
    COUNT(wh.id) as working_hours_count
FROM wp_bookings_staff s
LEFT JOIN wp_bookings_staff_working_hours wh ON s.id = wh.staff_id AND wh.is_working = 1
WHERE s.deleted_at IS NULL
GROUP BY s.id;
```

## Notes

- Admin-only permissions for create/update/delete
- Staff list available to all authenticated users (needed for bookings)
- Password hashed with password_hash()
- Email must be unique (duplicate checking)
- Service assignments via junction table
- Custom pricing optional (null = use service base price)
- Working hours status computed (has_working_hours boolean)
- Future bookings count prevents deletion
- Soft delete preserves data
- Display order for sorting
- Password field only on create (not update)
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 8 scenarios** in console
2. **Create staff with service assignments**
3. **Update staff and change services**
4. **Check working hours status**
5. **Verify duplicate email validation**
6. **Test delete with future bookings**

**Then say:** "Part A complete, ready for Part B"

I'll give you **Part B (Frontend Staff Page)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when it's done and tested!