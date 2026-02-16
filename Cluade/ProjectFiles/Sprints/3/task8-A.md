# ✅ PERFECT! Ready to Generate Task 8 Prompts!

Let me confirm everything:

1. ✅ **Table structure:** All columns confirmed
2. ✅ **Delete behavior:** Ask for confirmation, show service count
3. ✅ **Display order:** Both manual input + drag handles (like services)
4. ✅ **Permissions:** Admin only
5. ✅ **Protection:** No special treatment, all categories equal

---

# 📝 TASK 8 PART A: BACKEND API

Since Task 8 is simpler than Task 7, I'll give you **2 comprehensive prompts** (Parts A & B):

```markdown
# Task 8 Part A: Categories Management Backend API

## Context
I'm building a WordPress booking plugin dashboard. Tasks 1-7 are complete. Task 7 (Services) uses categories. Now I need full CRUD operations for managing categories.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing API file:
- `includes/api/class-dashboard-bookings-api.php`

Database table:
- `wp_bookings_categories` - Categories table
- `wp_bookings_service_categories` - Junction table (categories to services)

Existing endpoint:
- GET /dashboard/categories/list (created in Task 7, basic list)

## Requirements

### 1. Enhance Existing Categories List Endpoint

Update the existing `get_categories_list()` method in `includes/api/class-dashboard-bookings-api.php`:

**Find and replace the entire method:**

```php
/**
 * Get categories list with optional filters
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function get_categories_list( $request ) {
    global $wpdb;

    // Get query parameters
    $search      = $request->get_param( 'search' );
    $status      = $request->get_param( 'status' ); // 'active', 'inactive', 'all'
    $include_all = $request->get_param( 'include_all' ); // Include all for dropdowns

    // Build WHERE clauses
    $where_clauses = array( 'deleted_at IS NULL' );
    $where_params  = array();

    // If include_all is not set, apply filters
    if ( ! $include_all ) {
        // Search filter
        if ( ! empty( $search ) ) {
            $where_clauses[] = '(name LIKE %s OR description LIKE %s)';
            $search_term     = '%' . $wpdb->esc_like( $search ) . '%';
            $where_params[]  = $search_term;
            $where_params[]  = $search_term;
        }

        // Status filter
        if ( 'active' === $status ) {
            $where_clauses[] = 'is_active = 1';
        } elseif ( 'inactive' === $status ) {
            $where_clauses[] = 'is_active = 0';
        }
    } else {
        // For dropdowns, only show active categories
        $where_clauses[] = 'is_active = 1';
    }

    $where_sql = implode( ' AND ', $where_clauses );

    // Get categories with service count
    $query = "SELECT 
                c.id,
                c.name,
                c.description,
                c.display_order,
                c.is_active,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT sc.service_id) as service_count
            FROM {$wpdb->prefix}bookings_categories c
            LEFT JOIN {$wpdb->prefix}bookings_service_categories sc ON c.id = sc.category_id
            WHERE $where_sql
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC";

    if ( ! empty( $where_params ) ) {
        $query = $wpdb->prepare( $query, $where_params );
    }

    $categories = $wpdb->get_results( $query, ARRAY_A );

    // Convert numeric fields
    foreach ( $categories as &$category ) {
        $category['id']            = (int) $category['id'];
        $category['display_order'] = (int) $category['display_order'];
        $category['is_active']     = (bool) $category['is_active'];
        $category['service_count'] = (int) $category['service_count'];
    }

    return rest_ensure_response(
        array(
            'success'    => true,
            'categories' => $categories,
        )
    );
}
```

### 2. Update Categories List Route (Add Parameters)

Find the existing `/dashboard/categories/list` route and update it:

**Replace:**
```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_categories_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

**With:**
```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_categories_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'search' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'status' => array(
                'type'    => 'string',
                'enum'    => array( 'active', 'inactive', 'all' ),
                'default' => 'all',
            ),
            'include_all' => array(
                'type'    => 'boolean',
                'default' => false,
            ),
        ),
    )
);
```

### 3. Add Get Single Category Endpoint

Add this route in `register_routes()`:

```php
// Get/Update/Delete single category
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/(?P<id>\d+)',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_category_details' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
        array(
            'methods'             => 'PUT',
            'callback'            => array( $this, 'update_category' ),
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
                'is_active' => array(
                    'type'    => 'boolean',
                    'default' => true,
                ),
                'display_order' => array(
                    'type'    => 'integer',
                    'default' => 0,
                ),
            ),
        ),
        array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_category' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
    )
);
```

### 4. Add Create Category Endpoint

Add this route:

```php
// Create new category
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/create',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'create_category' ),
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

### 5. Add Reorder Categories Endpoint

Add this route:

```php
// Reorder categories
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/reorder',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'reorder_categories' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'categories' => array(
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

### 6. Add Methods

Add these methods to the class:

```php
/**
 * Get single category details
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_category_details( $request ) {
    global $wpdb;

    $category_id = (int) $request->get_param( 'id' );

    $category = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT c.*,
                COUNT(DISTINCT sc.service_id) as service_count
            FROM {$wpdb->prefix}bookings_categories c
            LEFT JOIN {$wpdb->prefix}bookings_service_categories sc ON c.id = sc.category_id
            WHERE c.id = %d
            AND c.deleted_at IS NULL
            GROUP BY c.id",
            $category_id
        ),
        ARRAY_A
    );

    if ( ! $category ) {
        return new WP_Error(
            'category_not_found',
            'Category not found.',
            array( 'status' => 404 )
        );
    }

    // Convert numeric fields
    $category['id']            = (int) $category['id'];
    $category['display_order'] = (int) $category['display_order'];
    $category['is_active']     = (bool) $category['is_active'];
    $category['service_count'] = (int) $category['service_count'];

    return rest_ensure_response(
        array(
            'success'  => true,
            'category' => $category,
        )
    );
}

/**
 * Create new category
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function create_category( $request ) {
    global $wpdb;

    $name          = $request->get_param( 'name' );
    $description   = $request->get_param( 'description' );
    $is_active     = filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN );
    $display_order = (int) $request->get_param( 'display_order' );

    // Check for duplicate name
    $existing = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_categories 
            WHERE name = %s AND deleted_at IS NULL",
            $name
        )
    );

    if ( $existing ) {
        return new WP_Error(
            'duplicate_name',
            'A category with this name already exists.',
            array( 'status' => 409 )
        );
    }

    // Insert category
    $result = $wpdb->insert(
        $wpdb->prefix . 'bookings_categories',
        array(
            'name'          => $name,
            'description'   => $description,
            'is_active'     => $is_active ? 1 : 0,
            'display_order' => $display_order,
            'created_at'    => current_time( 'mysql' ),
            'updated_at'    => current_time( 'mysql' ),
        ),
        array( '%s', '%s', '%d', '%d', '%s', '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'creation_failed',
            'Failed to create category.',
            array( 'status' => 500 )
        );
    }

    $category_id = $wpdb->insert_id;

    // Get created category
    $category = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bookings_categories WHERE id = %d",
            $category_id
        ),
        ARRAY_A
    );

    $category['service_count'] = 0;

    return rest_ensure_response(
        array(
            'success'  => true,
            'message'  => 'Category created successfully.',
            'category' => $category,
        )
    );
}

/**
 * Update existing category
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_category( $request ) {
    global $wpdb;

    $category_id = (int) $request->get_param( 'id' );

    // Check if category exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, name FROM {$wpdb->prefix}bookings_categories 
            WHERE id = %d AND deleted_at IS NULL",
            $category_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'category_not_found',
            'Category not found.',
            array( 'status' => 404 )
        );
    }

    $name          = $request->get_param( 'name' );
    $description   = $request->get_param( 'description' );
    $is_active     = filter_var( $request->get_param( 'is_active' ), FILTER_VALIDATE_BOOLEAN );
    $display_order = (int) $request->get_param( 'display_order' );

    // Check for duplicate name (excluding current category)
    $duplicate = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_categories 
            WHERE name = %s AND id != %d AND deleted_at IS NULL",
            $name,
            $category_id
        )
    );

    if ( $duplicate ) {
        return new WP_Error(
            'duplicate_name',
            'A category with this name already exists.',
            array( 'status' => 409 )
        );
    }

    // Update category
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_categories',
        array(
            'name'          => $name,
            'description'   => $description,
            'is_active'     => $is_active ? 1 : 0,
            'display_order' => $display_order,
            'updated_at'    => current_time( 'mysql' ),
        ),
        array( 'id' => $category_id ),
        array( '%s', '%s', '%d', '%d', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update category.',
            array( 'status' => 500 )
        );
    }

    // Get updated category with service count
    $category = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT c.*,
                COUNT(DISTINCT sc.service_id) as service_count
            FROM {$wpdb->prefix}bookings_categories c
            LEFT JOIN {$wpdb->prefix}bookings_service_categories sc ON c.id = sc.category_id
            WHERE c.id = %d
            GROUP BY c.id",
            $category_id
        ),
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success'  => true,
            'message'  => 'Category updated successfully.',
            'category' => $category,
        )
    );
}

/**
 * Delete category (soft delete)
 * Shows confirmation with service count
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function delete_category( $request ) {
    global $wpdb;

    $category_id = (int) $request->get_param( 'id' );

    // Check if category exists
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, name FROM {$wpdb->prefix}bookings_categories 
            WHERE id = %d AND deleted_at IS NULL",
            $category_id
        ),
        ARRAY_A
    );

    if ( ! $existing ) {
        return new WP_Error(
            'category_not_found',
            'Category not found.',
            array( 'status' => 404 )
        );
    }

    // Get service count
    $service_count = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(DISTINCT service_id) 
            FROM {$wpdb->prefix}bookings_service_categories 
            WHERE category_id = %d",
            $category_id
        )
    );

    // Soft delete the category
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_categories',
        array(
            'deleted_at' => current_time( 'mysql' ),
            'updated_at' => current_time( 'mysql' ),
        ),
        array( 'id' => $category_id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'deletion_failed',
            'Failed to delete category.',
            array( 'status' => 500 )
        );
    }

    $message = 'Category deleted successfully.';
    if ( $service_count > 0 ) {
        $message .= sprintf( ' %d service(s) are no longer in this category.', $service_count );
    }

    return rest_ensure_response(
        array(
            'success'       => true,
            'message'       => $message,
            'service_count' => (int) $service_count,
        )
    );
}

/**
 * Reorder categories
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function reorder_categories( $request ) {
    global $wpdb;

    $categories = $request->get_param( 'categories' );

    if ( empty( $categories ) ) {
        return new WP_Error(
            'invalid_data',
            'Categories array is required.',
            array( 'status' => 400 )
        );
    }

    // Update display order for each category
    foreach ( $categories as $category_data ) {
        if ( ! isset( $category_data['id'] ) || ! isset( $category_data['display_order'] ) ) {
            continue;
        }

        $wpdb->update(
            $wpdb->prefix . 'bookings_categories',
            array(
                'display_order' => (int) $category_data['display_order'],
                'updated_at'    => current_time( 'mysql' ),
            ),
            array( 'id' => (int) $category_data['id'] ),
            array( '%d', '%s' ),
            array( '%d' )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Categories reordered successfully.',
        )
    );
}
```

## Testing

### Test 1: Enhanced Categories List
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/list', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Categories with service count:', data.categories)
})
```

Expected: Categories with service_count field

### Test 2: Search Categories
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/list?search=hair', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Only categories matching "hair"

### Test 3: Create Category
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Spa Treatments',
    description: 'Relaxation and spa services',
    is_active: true,
    display_order: 10
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, new category created

### Test 4: Update Category
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Hair Services',
    description: 'All hair-related services',
    is_active: true,
    display_order: 1
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, category updated

### Test 5: Delete Category with Services
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/1', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Deleted:', data.success)
  console.log('Service count:', data.service_count)
  console.log('Message:', data.message)
})
```

Expected: Success with message about services

### Test 6: Duplicate Name Check
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Haircuts',  // Duplicate
    description: 'Test',
    is_active: true
  })
}).then(r => r.json()).then(console.log)
```

Expected: 409 error "A category with this name already exists"

## Database Verification

```sql
-- Check categories with service counts
SELECT 
    c.id,
    c.name,
    c.is_active,
    c.display_order,
    COUNT(sc.service_id) as service_count
FROM wp_bookings_categories c
LEFT JOIN wp_bookings_service_categories sc ON c.id = sc.category_id
WHERE c.deleted_at IS NULL
GROUP BY c.id
ORDER BY c.display_order;
```

## Notes

- Admin-only permissions (same as services)
- Delete allowed even with services (warns via message)
- Service count returned in list and single endpoints
- Duplicate name checking on create and update
- Search by name or description
- Filter by active/inactive status
- Soft delete (deleted_at timestamp)
- Display order for sorting
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 6 scenarios** in console
2. **Create a category**
3. **Update existing category**
4. **Delete category** (see service count message)
5. **Check duplicate name** validation

**Then say:** "Part A complete, ready for Part B"

I'll give you **Part B (Frontend Categories Page)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when it's done and tested!