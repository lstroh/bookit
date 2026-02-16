# 📝 TASK 7 PART A: BACKEND API (LIST & GET)

```markdown
# Task 7 Part A: Services Management Backend API (List & Get)

## Context
I'm building a WordPress booking plugin dashboard. Tasks 1-6 are complete (bookings CRUD). Now I need to create the Services management interface. This is Part A: backend API for listing and retrieving services.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing API files:
- `includes/api/class-dashboard-bookings-api.php` (Tasks 5-6)
- `includes/class-bookit-auth.php` (Authentication)

Database tables:
- `wp_bookings_services` - Main services table
- `wp_bookings_categories` - Categories table
- `wp_bookings_service_categories` - Junction table (service to category, many-to-many)

Existing endpoints:
- GET /dashboard/services/list (used in Task 5, needs enhancement)
- Need to add: GET /dashboard/services/{id}

## Requirements

### 1. Update Existing Services List Endpoint

Update `includes/api/class-dashboard-bookings-api.php`:

Find the existing `get_services_list()` method (created in Task 5) and enhance it with:
- Full service details (not just id, name, price, duration)
- Category information
- Search functionality
- Filter by category
- Filter by active status
- Pagination support
- Sort by display_order

**Replace the existing `get_services_list()` method with:**

```php
/**
 * Get services list with filters and pagination
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_services_list( $request ) {
    global $wpdb;

    // Get query parameters
    $search         = $request->get_param( 'search' );
    $category_id    = $request->get_param( 'category_id' );
    $status         = $request->get_param( 'status' ); // 'active', 'inactive', 'all'
    $page           = max( 1, (int) $request->get_param( 'page' ) );
    $per_page       = min( 100, max( 1, (int) $request->get_param( 'per_page' ) ) ); // Default 50, max 100
    
    if ( ! $per_page ) {
        $per_page = 50;
    }

    $offset = ( $page - 1 ) * $per_page;

    // Build WHERE clauses
    $where_clauses = array( 's.deleted_at IS NULL' );
    $where_params  = array();

    // Search filter
    if ( ! empty( $search ) ) {
        $where_clauses[] = '(s.name LIKE %s OR s.description LIKE %s)';
        $search_term     = '%' . $wpdb->esc_like( $search ) . '%';
        $where_params[]  = $search_term;
        $where_params[]  = $search_term;
    }

    // Status filter
    if ( 'active' === $status ) {
        $where_clauses[] = 's.is_active = 1';
    } elseif ( 'inactive' === $status ) {
        $where_clauses[] = 's.is_active = 0';
    }
    // 'all' or null = no status filter

    // Category filter
    if ( ! empty( $category_id ) ) {
        $where_clauses[] = 'EXISTS (
            SELECT 1 FROM ' . $wpdb->prefix . 'bookings_service_categories sc 
            WHERE sc.service_id = s.id 
            AND sc.category_id = %d
        )';
        $where_params[] = (int) $category_id;
    }

    $where_sql = implode( ' AND ', $where_clauses );

    // Get total count
    $count_query = "SELECT COUNT(DISTINCT s.id) 
                    FROM {$wpdb->prefix}bookings_services s 
                    WHERE $where_sql";
    
    if ( ! empty( $where_params ) ) {
        $count_query = $wpdb->prepare( $count_query, $where_params );
    }
    
    $total = (int) $wpdb->get_var( $count_query );

    // Get services with category information
    $query = "SELECT 
                s.id,
                s.name,
                s.description,
                s.duration,
                s.price,
                s.deposit_amount,
                s.deposit_type,
                s.buffer_before,
                s.buffer_after,
                s.is_active,
                s.display_order,
                s.created_at,
                s.updated_at,
                GROUP_CONCAT(
                    DISTINCT CONCAT(c.id, ':', c.name) 
                    ORDER BY c.name 
                    SEPARATOR '||'
                ) as categories_data
            FROM {$wpdb->prefix}bookings_services s
            LEFT JOIN {$wpdb->prefix}bookings_service_categories sc ON s.id = sc.service_id
            LEFT JOIN {$wpdb->prefix}bookings_categories c ON sc.category_id = c.id AND c.deleted_at IS NULL
            WHERE $where_sql
            GROUP BY s.id
            ORDER BY s.display_order ASC, s.name ASC
            LIMIT %d OFFSET %d";

    $query_params = array_merge( $where_params, array( $per_page, $offset ) );
    $query = $wpdb->prepare( $query, $query_params );

    $services = $wpdb->get_results( $query, ARRAY_A );

    // Process categories data for each service
    foreach ( $services as &$service ) {
        $categories = array();
        
        if ( ! empty( $service['categories_data'] ) ) {
            $categories_raw = explode( '||', $service['categories_data'] );
            foreach ( $categories_raw as $cat_data ) {
                if ( ! empty( $cat_data ) ) {
                    list( $cat_id, $cat_name ) = explode( ':', $cat_data, 2 );
                    $categories[] = array(
                        'id'   => (int) $cat_id,
                        'name' => $cat_name,
                    );
                }
            }
        }
        
        $service['categories'] = $categories;
        unset( $service['categories_data'] );

        // Convert numeric fields to proper types
        $service['id']            = (int) $service['id'];
        $service['duration']      = (int) $service['duration'];
        $service['price']         = (float) $service['price'];
        $service['deposit_amount'] = $service['deposit_amount'] ? (float) $service['deposit_amount'] : null;
        $service['buffer_before'] = (int) $service['buffer_before'];
        $service['buffer_after']  = (int) $service['buffer_after'];
        $service['is_active']     = (bool) $service['is_active'];
        $service['display_order'] = (int) $service['display_order'];
    }

    // Calculate pagination
    $total_pages = ceil( $total / $per_page );

    return rest_ensure_response(
        array(
            'success'    => true,
            'services'   => $services,
            'pagination' => array(
                'total'        => $total,
                'per_page'     => $per_page,
                'current_page' => $page,
                'total_pages'  => $total_pages,
            ),
        )
    );
}
```

### 2. Update Services List Route (Add Parameters)

Find the existing route registration for `/dashboard/services/list` in `register_routes()` method and update it:

**Replace this:**
```php
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

**With this:**
```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_services_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'search' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'category_id' => array(
                'type'              => 'integer',
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
            ),
            'status' => array(
                'type'    => 'string',
                'enum'    => array( 'active', 'inactive', 'all' ),
                'default' => 'all',
            ),
            'page' => array(
                'type'    => 'integer',
                'default' => 1,
                'minimum' => 1,
            ),
            'per_page' => array(
                'type'    => 'integer',
                'default' => 50,
                'minimum' => 1,
                'maximum' => 100,
            ),
        ),
    )
);
```

### 3. Add Get Single Service Endpoint

Add this new route in `register_routes()` method:

```php
// Get single service details
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/(?P<id>\d+)',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_service_details' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
    )
);
```

### 4. Add Admin Permission Check Method

Add this new method (after `check_dashboard_permission()`):

```php
/**
 * Check if user has admin permission
 * Only admins can manage services
 *
 * @return bool|WP_Error
 */
public function check_admin_permission() {
    // Load auth classes if not loaded
    if ( ! class_exists( 'Bookit_Session' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-session.php';
    }
    if ( ! class_exists( 'Bookit_Auth' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-auth.php';
    }

    if ( ! Bookit_Auth::is_logged_in() ) {
        return new WP_Error(
            'unauthorized',
            'You must be logged in to access the dashboard.',
            array( 'status' => 401 )
        );
    }

    $current_staff = Bookit_Auth::get_current_staff();
    
    if ( ! $current_staff || 'admin' !== $current_staff['role'] ) {
        return new WP_Error(
            'forbidden',
            'Only administrators can manage services.',
            array( 'status' => 403 )
        );
    }

    return true;
}
```

### 5. Add Get Service Details Method

Add this new method:

```php
/**
 * Get single service details
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_service_details( $request ) {
    global $wpdb;

    $service_id = (int) $request->get_param( 'id' );

    // Get service with categories
    $service = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                s.*,
                GROUP_CONCAT(
                    DISTINCT CONCAT(c.id, ':', c.name) 
                    ORDER BY c.name 
                    SEPARATOR '||'
                ) as categories_data
            FROM {$wpdb->prefix}bookings_services s
            LEFT JOIN {$wpdb->prefix}bookings_service_categories sc ON s.id = sc.service_id
            LEFT JOIN {$wpdb->prefix}bookings_categories c ON sc.category_id = c.id AND c.deleted_at IS NULL
            WHERE s.id = %d
            AND s.deleted_at IS NULL
            GROUP BY s.id",
            $service_id
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

    // Process categories
    $categories = array();
    
    if ( ! empty( $service['categories_data'] ) ) {
        $categories_raw = explode( '||', $service['categories_data'] );
        foreach ( $categories_raw as $cat_data ) {
            if ( ! empty( $cat_data ) ) {
                list( $cat_id, $cat_name ) = explode( ':', $cat_data, 2 );
                $categories[] = array(
                    'id'   => (int) $cat_id,
                    'name' => $cat_name,
                );
            }
        }
    }
    
    $service['categories'] = $categories;
    $service['category_ids'] = array_column( $categories, 'id' );
    unset( $service['categories_data'] );

    // Convert numeric fields
    $service['id']            = (int) $service['id'];
    $service['duration']      = (int) $service['duration'];
    $service['price']         = (float) $service['price'];
    $service['deposit_amount'] = $service['deposit_amount'] ? (float) $service['deposit_amount'] : null;
    $service['buffer_before'] = (int) $service['buffer_before'];
    $service['buffer_after']  = (int) $service['buffer_after'];
    $service['is_active']     = (bool) $service['is_active'];
    $service['display_order'] = (int) $service['display_order'];

    return rest_ensure_response(
        array(
            'success' => true,
            'service' => $service,
        )
    );
}
```

## Testing

### Test 1: List All Services
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/list', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('All services:', data)
  console.log('Total:', data.pagination.total)
  console.log('Services:', data.services)
})
```

Expected: List of all active and inactive services with categories

### Test 2: Search Services
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/list?search=haircut', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Only services matching "haircut" in name or description

### Test 3: Filter by Category
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/list?category_id=1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Only services in category ID 1 (Haircuts)

### Test 4: Filter by Status
```javascript
// Active only
fetch('/wp-json/bookit/v1/dashboard/services/list?status=active', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Inactive only
fetch('/wp-json/bookit/v1/dashboard/services/list?status=inactive', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Filtered by active status

### Test 5: Pagination
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/list?per_page=2&page=1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Page 1:', data.services)
  console.log('Pagination:', data.pagination)
})
```

Expected: 2 services, pagination info shows total pages

### Test 6: Get Single Service
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Service details:', data.service)
  console.log('Categories:', data.service.categories)
  console.log('Category IDs:', data.service.category_ids)
})
```

Expected: Full service details including categories array

### Test 7: Admin Permission Check (as Staff)
Login as staff user, try to get single service:

```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: 403 Forbidden error "Only administrators can manage services"

### Test 8: Combined Filters
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/list?search=hair&status=active&category_id=1&per_page=10&page=1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Active services in category 1 matching "hair", paginated

## Database Verification

```sql
-- Check existing services with categories
SELECT 
    s.id,
    s.name,
    s.price,
    s.is_active,
    GROUP_CONCAT(c.name) as categories
FROM wp_bookings_services s
LEFT JOIN wp_bookings_service_categories sc ON s.id = sc.service_id
LEFT JOIN wp_bookings_categories c ON sc.category_id = c.id
WHERE s.deleted_at IS NULL
GROUP BY s.id
ORDER BY s.display_order;

-- Verify category junction table
SELECT * FROM wp_bookings_service_categories;
```

## Response Format Examples

**List Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": 1,
      "name": "Women's Haircut",
      "description": "Cut and blow-dry with styling",
      "duration": 45,
      "price": 35.00,
      "deposit_amount": 100.00,
      "deposit_type": "percentage",
      "buffer_before": 15,
      "buffer_after": 10,
      "is_active": true,
      "display_order": 1,
      "categories": [
        {"id": 1, "name": "Haircuts"},
        {"id": 2, "name": "All Services"}
      ],
      "created_at": "2026-01-28 13:02:14",
      "updated_at": "2026-02-03 09:05:49"
    }
  ],
  "pagination": {
    "total": 4,
    "per_page": 50,
    "current_page": 1,
    "total_pages": 1
  }
}
```

**Single Service Response:**
```json
{
  "success": true,
  "service": {
    "id": 1,
    "name": "Women's Haircut",
    "description": "Cut and blow-dry with styling",
    "duration": 45,
    "price": 35.00,
    "deposit_amount": 100.00,
    "deposit_type": "percentage",
    "buffer_before": 15,
    "buffer_after": 10,
    "is_active": true,
    "display_order": 1,
    "categories": [
      {"id": 1, "name": "Haircuts"},
      {"id": 2, "name": "All Services"}
    ],
    "category_ids": [1, 2],
    "created_at": "2026-01-28 13:02:14",
    "updated_at": "2026-02-03 09:05:49",
    "deleted_at": null
  }
}
```

## Notes

- Services list defaults to showing all (active + inactive)
- Search is case-insensitive and searches both name and description
- Category filter works even though services can have multiple categories
- Services are sorted by display_order first, then name
- Pagination defaults to 50 per page, max 100
- Only admins can access single service details endpoint
- Staff can still see services list (needed for booking creation)
- Categories are returned as both array of objects and array of IDs
- Soft-deleted services excluded from all results
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 8 scenarios** in console
2. **Verify pagination works**
3. **Check admin permission** (staff gets 403)
4. **Verify filters** (search, category, status)

**Then say:** "Part A complete, ready for Part B"

I'll give you **Part B (Create/Update/Delete)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when it's done and tested!