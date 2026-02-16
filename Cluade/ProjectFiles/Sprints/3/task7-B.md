# 📝 TASK 7 PART B: BACKEND API (CREATE/UPDATE/DELETE)

```markdown
# Task 7 Part B: Services Management Backend API (Create/Update/Delete)

## Context
I'm building a WordPress booking plugin dashboard. Task 7 Part A (list & get services) is complete and working. Now I need to add endpoints to create, update, and delete services, including managing category assignments.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing API file:
- `includes/api/class-dashboard-bookings-api.php`

Database tables:
- `wp_bookings_services` - Main services table
- `wp_bookings_service_categories` - Junction table (many-to-many)

Existing endpoints from Part A:
- GET /dashboard/services/list (enhanced with filters)
- GET /dashboard/services/{id} (single service details)

## Requirements

### 1. Add Create Service Endpoint

Add this route in `register_routes()` method:

```php
// Create new service
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/create',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'create_service' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'name' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'description' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'duration' => array(
                'required'          => true,
                'type'              => 'integer',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param > 0;
                },
            ),
            'price' => array(
                'required'          => true,
                'type'              => 'number',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param >= 0;
                },
            ),
            'deposit_amount' => array(
                'type'              => 'number',
                'validate_callback' => function( $param ) {
                    return $param === null || ( is_numeric( $param ) && $param >= 0 );
                },
            ),
            'deposit_type' => array(
                'type'    => 'string',
                'enum'    => array( 'fixed', 'percentage' ),
                'default' => 'fixed',
            ),
            'buffer_before' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
            'buffer_after' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
            'category_ids' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'integer',
                ),
            ),
            'is_active' => array(
                'type'    => 'boolean',
                'default' => true,
            ),
            'display_order' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
        ),
    )
);
```

### 2. Add Create Service Method

Add this new method:

```php
/**
 * Create new service
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function create_service( $request ) {
    global $wpdb;

    // Get parameters
    $name           = $request->get_param( 'name' );
    $description    = $request->get_param( 'description' );
    $duration       = (int) $request->get_param( 'duration' );
    $price          = (float) $request->get_param( 'price' );
    $deposit_amount = $request->get_param( 'deposit_amount' );
    $deposit_type   = $request->get_param( 'deposit_type' ) ?: 'fixed';
    $buffer_before  = (int) $request->get_param( 'buffer_before' );
    $buffer_after   = (int) $request->get_param( 'buffer_after' );
    $category_ids   = $request->get_param( 'category_ids' ) ?: array();
    $is_active      = filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN );
    $display_order  = (int) $request->get_param( 'display_order' );

    // Insert service
    $result = $wpdb->insert(
        $wpdb->prefix . 'bookings_services',
        array(
            'name'           => $name,
            'description'    => $description,
            'duration'       => $duration,
            'price'          => $price,
            'deposit_amount' => $deposit_amount,
            'deposit_type'   => $deposit_type,
            'buffer_before'  => $buffer_before,
            'buffer_after'   => $buffer_after,
            'is_active'      => $is_active ? 1 : 0,
            'display_order'  => $display_order,
            'created_at'     => current_time( 'mysql' ),
            'updated_at'     => current_time( 'mysql' ),
        ),
        array( '%s', '%s', '%d', '%f', '%f', '%s', '%d', '%d', '%d', '%d', '%s', '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'creation_failed',
            'Failed to create service.',
            array( 'status' => 500 )
        );
    }

    $service_id = $wpdb->insert_id;

    // Insert category relationships
    if ( ! empty( $category_ids ) ) {
        foreach ( $category_ids as $category_id ) {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_service_categories',
                array(
                    'service_id'  => $service_id,
                    'category_id' => (int) $category_id,
                    'created_at'  => current_time( 'mysql' ),
                ),
                array( '%d', '%d', '%s' )
            );
        }
    }

    // Get created service with categories
    $service = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT s.* FROM {$wpdb->prefix}bookings_services s WHERE s.id = %d",
            $service_id
        ),
        ARRAY_A
    );

    // Get categories
    $categories = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT c.id, c.name 
            FROM {$wpdb->prefix}bookings_categories c
            INNER JOIN {$wpdb->prefix}bookings_service_categories sc ON c.id = sc.category_id
            WHERE sc.service_id = %d
            AND c.deleted_at IS NULL",
            $service_id
        ),
        ARRAY_A
    );

    $service['categories'] = $categories;
    $service['category_ids'] = array_column( $categories, 'id' );

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Service created successfully.',
            'service' => $service,
        )
    );
}
```

### 3. Add Update Service Endpoint

Add this route in `register_routes()` method:

```php
// Update service
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/(?P<id>\d+)',
    array(
        'methods'             => 'PUT',
        'callback'            => array( $this, 'update_service' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'name' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'description' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'duration' => array(
                'required'          => true,
                'type'              => 'integer',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param > 0;
                },
            ),
            'price' => array(
                'required'          => true,
                'type'              => 'number',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param ) && $param >= 0;
                },
            ),
            'deposit_amount' => array(
                'type'              => 'number',
                'validate_callback' => function( $param ) {
                    return $param === null || ( is_numeric( $param ) && $param >= 0 );
                },
            ),
            'deposit_type' => array(
                'type'    => 'string',
                'enum'    => array( 'fixed', 'percentage' ),
                'default' => 'fixed',
            ),
            'buffer_before' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
            'buffer_after' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
            'category_ids' => array(
                'type'  => 'array',
                'items' => array(
                    'type' => 'integer',
                ),
            ),
            'is_active' => array(
                'type'    => 'boolean',
                'default' => true,
            ),
            'display_order' => array(
                'type'    => 'integer',
                'default' => 0,
            ),
        ),
    )
);
```

### 4. Add Update Service Method

Add this new method:

```php
/**
 * Update existing service
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_service( $request ) {
    global $wpdb;

    $service_id = (int) $request->get_param( 'id' );

    // Check if service exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_services WHERE id = %d AND deleted_at IS NULL",
            $service_id
        )
    );

    if ( ! $existing ) {
        return new WP_Error(
            'service_not_found',
            'Service not found.',
            array( 'status' => 404 )
        );
    }

    // Get parameters
    $name           = $request->get_param( 'name' );
    $description    = $request->get_param( 'description' );
    $duration       = (int) $request->get_param( 'duration' );
    $price          = (float) $request->get_param( 'price' );
    $deposit_amount = $request->get_param( 'deposit_amount' );
    $deposit_type   = $request->get_param( 'deposit_type' ) ?: 'fixed';
    $buffer_before  = (int) $request->get_param( 'buffer_before' );
    $buffer_after   = (int) $request->get_param( 'buffer_after' );
    $category_ids   = $request->get_param( 'category_ids' ) ?: array();
    $is_active      = filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN );
    $display_order  = (int) $request->get_param( 'display_order' );

    // Update service
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_services',
        array(
            'name'           => $name,
            'description'    => $description,
            'duration'       => $duration,
            'price'          => $price,
            'deposit_amount' => $deposit_amount,
            'deposit_type'   => $deposit_type,
            'buffer_before'  => $buffer_before,
            'buffer_after'   => $buffer_after,
            'is_active'      => $is_active ? 1 : 0,
            'display_order'  => $display_order,
            'updated_at'     => current_time( 'mysql' ),
        ),
        array( 'id' => $service_id ),
        array( '%s', '%s', '%d', '%f', '%f', '%s', '%d', '%d', '%d', '%d', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update service.',
            array( 'status' => 500 )
        );
    }

    // Delete existing category relationships
    $wpdb->delete(
        $wpdb->prefix . 'bookings_service_categories',
        array( 'service_id' => $service_id ),
        array( '%d' )
    );

    // Insert new category relationships
    if ( ! empty( $category_ids ) ) {
        foreach ( $category_ids as $category_id ) {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_service_categories',
                array(
                    'service_id'  => $service_id,
                    'category_id' => (int) $category_id,
                    'created_at'  => current_time( 'mysql' ),
                ),
                array( '%d', '%d', '%s' )
            );
        }
    }

    // Get updated service with categories
    $service = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT s.* FROM {$wpdb->prefix}bookings_services s WHERE s.id = %d",
            $service_id
        ),
        ARRAY_A
    );

    // Get categories
    $categories = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT c.id, c.name 
            FROM {$wpdb->prefix}bookings_categories c
            INNER JOIN {$wpdb->prefix}bookings_service_categories sc ON c.id = sc.category_id
            WHERE sc.service_id = %d
            AND c.deleted_at IS NULL",
            $service_id
        ),
        ARRAY_A
    );

    $service['categories'] = $categories;
    $service['category_ids'] = array_column( $categories, 'id' );

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Service updated successfully.',
            'service' => $service,
        )
    );
}
```

### 5. Add Delete Service Endpoint

Add this route in `register_routes()` method:

```php
// Delete service (soft delete)
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/(?P<id>\d+)',
    array(
        'methods'             => 'DELETE',
        'callback'            => array( $this, 'delete_service' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
    )
);
```

### 6. Add Delete Service Method

Add this new method:

```php
/**
 * Delete service (soft delete)
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function delete_service( $request ) {
    global $wpdb;

    $service_id = (int) $request->get_param( 'id' );

    // Check if service exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, name FROM {$wpdb->prefix}bookings_services WHERE id = %d AND deleted_at IS NULL",
            $service_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'service_not_found',
            'Service not found.',
            array( 'status' => 404 )
        );
    }

    // Check if service has future bookings
    $future_bookings = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings 
            WHERE service_id = %d 
            AND booking_date >= CURDATE()
            AND deleted_at IS NULL
            AND status NOT IN ('cancelled', 'no_show')",
            $service_id
        )
    );

    if ( $future_bookings > 0 ) {
        return new WP_Error(
            'service_has_bookings',
            sprintf( 
                'Cannot delete service "%s" because it has %d future booking(s). Please cancel or complete these bookings first, or deactivate the service instead.',
                $existing['name'],
                $future_bookings
            ),
            array( 'status' => 409 )
        );
    }

    // Soft delete the service
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_services',
        array(
            'deleted_at' => current_time( 'mysql' ),
            'updated_at' => current_time( 'mysql' ),
        ),
        array( 'id' => $service_id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'deletion_failed',
            'Failed to delete service.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Service deleted successfully.',
        )
    );
}
```

### 7. Add Update Display Order Endpoint

Add this route for bulk updating display order (useful for drag-and-drop):

```php
// Update display order for multiple services
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/reorder',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'reorder_services' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'services' => array(
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

### 8. Add Reorder Services Method

Add this new method:

```php
/**
 * Update display order for multiple services
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function reorder_services( $request ) {
    global $wpdb;

    $services = $request->get_param( 'services' );

    if ( empty( $services ) ) {
        return new WP_Error(
            'invalid_data',
            'Services array is required.',
            array( 'status' => 400 )
        );
    }

    // Update display order for each service
    foreach ( $services as $service_data ) {
        if ( ! isset( $service_data['id'] ) || ! isset( $service_data['display_order'] ) ) {
            continue;
        }

        $wpdb->update(
            $wpdb->prefix . 'bookings_services',
            array(
                'display_order' => (int) $service_data['display_order'],
                'updated_at'    => current_time( 'mysql' ),
            ),
            array( 'id' => (int) $service_data['id'] ),
            array( '%d', '%s' ),
            array( '%d' )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Services reordered successfully.',
        )
    );
}
```

## Testing

### Test 1: Create Service
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Test Service',
    description: 'This is a test service',
    duration: 60,
    price: 50.00,
    deposit_amount: 10.00,
    deposit_type: 'fixed',
    buffer_before: 10,
    buffer_after: 5,
    category_ids: [1, 2],
    is_active: true,
    display_order: 10
  })
}).then(r => r.json()).then(data => {
  console.log('Created service:', data)
  console.log('Service ID:', data.service.id)
  console.log('Categories:', data.service.categories)
})
```

Expected: Success, new service created with ID

### Test 2: Update Service
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Updated Women\'s Haircut',
    description: 'Updated description',
    duration: 50,
    price: 40.00,
    deposit_amount: 20.00,
    deposit_type: 'percentage',
    buffer_before: 15,
    buffer_after: 10,
    category_ids: [1],
    is_active: true,
    display_order: 1
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, service updated

### Test 3: Delete Service (with Future Bookings)
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: 409 error if has future bookings, success if none

### Test 4: Reorder Services
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/reorder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    services: [
      { id: 1, display_order: 3 },
      { id: 2, display_order: 1 },
      { id: 3, display_order: 2 },
      { id: 4, display_order: 4 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, display order updated

### Test 5: Create Service with No Categories
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Uncategorized Service',
    description: 'No category assigned',
    duration: 30,
    price: 25.00,
    category_ids: [],
    is_active: true
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, service created with empty categories array

### Test 6: Update Categories Only
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Women\'s Haircut',
    description: 'Cut and blow-dry with styling',
    duration: 45,
    price: 35.00,
    deposit_amount: 100.00,
    deposit_type: 'percentage',
    buffer_before: 15,
    buffer_after: 10,
    category_ids: [2],  // Changed from [1,2] to [2]
    is_active: true,
    display_order: 1
  })
}).then(r => r.json()).then(data => {
  console.log('Updated categories:', data.service.categories)
})
```

Expected: Categories updated, old relationships removed

### Test 7: Staff Permission Check
Login as staff user, try to create service:

```javascript
fetch('/wp-json/bookit/v1/dashboard/services/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Test',
    duration: 30,
    price: 20
  })
}).then(r => r.json()).then(console.log)
```

Expected: 403 Forbidden error

## Database Verification

```sql
-- Check created service
SELECT * FROM wp_bookings_services 
ORDER BY id DESC LIMIT 1;

-- Check category assignments
SELECT 
    s.name as service_name,
    c.name as category_name
FROM wp_bookings_service_categories sc
INNER JOIN wp_bookings_services s ON sc.service_id = s.id
INNER JOIN wp_bookings_categories c ON sc.category_id = c.id
ORDER BY s.id, c.name;

-- Check deleted services
SELECT id, name, deleted_at 
FROM wp_bookings_services 
WHERE deleted_at IS NOT NULL;

-- Check display order
SELECT id, name, display_order 
FROM wp_bookings_services 
WHERE deleted_at IS NULL
ORDER BY display_order;
```

## Notes

- All operations require admin permission
- Create/update handle category relationships via junction table
- Delete is soft delete (sets deleted_at timestamp)
- Delete checks for future bookings and prevents deletion if found
- Reorder endpoint updates multiple services in one call (for drag-and-drop)
- Category assignments: delete all existing, then insert new ones
- Deposit amount can be null (no deposit required)
- Buffer times default to 0 if not provided
- Display order defaults to 0 if not provided
```

---

## ⏸️ PAUSE AFTER PART B

**After implementing Part B:**

1. **Test all 7 scenarios** in console
2. **Create a new service** with categories
3. **Update existing service** (change categories)
4. **Try to delete service** with future bookings (should fail)
5. **Reorder services** (test drag-and-drop endpoint)
6. **Verify staff gets 403** on all operations

**Then say:** "Part B complete, ready for Part C"

I'll give you **Part C (Frontend Services Page)** next! 🚀

---

**Apply this Part B prompt now!** Let me know when it's done and tested!