# Fix: Category Filter and Categories List Issues

Two issues to fix:
1. Category filter not working in services list
2. "No categories available" message in service form modal

## Issue 1: Fix Categories Endpoint (May Not Exist)

The categories list endpoint might not be registered yet. Add it to `includes/api/class-dashboard-bookings-api.php`:

### Add Categories List Route

In the `register_routes()` method, add this route:
```php
// Get categories list
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

### Add Get Categories List Method

Add this method to the class:
```php
/**
 * Get categories list
 *
 * @return WP_REST_Response
 */
public function get_categories_list() {
    global $wpdb;

    $categories = $wpdb->get_results(
        "SELECT id, name, description 
        FROM {$wpdb->prefix}bookings_categories 
        WHERE deleted_at IS NULL 
        AND is_active = 1
        ORDER BY display_order ASC, name ASC",
        ARRAY_A
    );

    // Convert id to integer
    foreach ( $categories as &$category ) {
        $category['id'] = (int) $category['id'];
    }

    return rest_ensure_response(
        array(
            'success'    => true,
            'categories' => $categories,
        )
    );
}
```

## Issue 2: Fix Services.vue Categories Loading

Update `dashboard/src/views/Services.vue`:

### Fix loadCategories method

The method might be calling the wrong endpoint. Find the `loadCategories` method and ensure it's correct:
```javascript
const loadCategories = async () => {
  try {
    const response = await api.get('categories/list')  // Note: no leading slash
    if (response.data.success) {
      categories.value = response.data.categories
      console.log('Loaded categories:', categories.value)  // Debug log
    }
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}
```

### Add Debug Logging

Temporarily add console logs to verify categories are loaded:

In the `onMounted` hook, update it to:
```javascript
onMounted(async () => {
  await loadCategories()
  console.log('Categories after load:', categories.value)
  loadServices()
})
```

## Issue 3: Verify ServiceFormModal Receives Categories

Update `dashboard/src/components/ServiceFormModal.vue`:

### Add debug log in template

Temporarily add this at the top of the categories section:
```vue
<!-- Categories -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Categories
  </label>
  
  <!-- DEBUG: Remove after testing -->
  <div class="text-xs text-red-600 mb-2">
    Debug: {{ categories.length }} categories received
  </div>
  
  <div v-if="categories.length === 0" class="text-sm text-gray-500 mb-2">
    No categories available
  </div>
  
  <div v-else class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
    <label
      v-for="category in categories"
      :key="category.id"
      class="flex items-center"
    >
      <input
        type="checkbox"
        :value="category.id"
        v-model="formData.category_ids"
        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
      />
      <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
    </label>
  </div>
  <p class="text-xs text-gray-500 mt-1">Select one or more categories</p>
</div>
```

## Testing After Fixes

### Test 1: Check Categories Endpoint
```javascript
fetch('/wp-json/bookit/v1/dashboard/categories/list', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Categories:', data)
})
```

Expected:
```json
{
  "success": true,
  "categories": [
    {"id": 1, "name": "Haircuts", "description": "Hair cutting services"},
    {"id": 2, "name": "All Services", "description": "General category"}
  ]
}
```

### Test 2: Check Categories in Browser Console
1. Go to Services page
2. Open browser console
3. Look for: "Loaded categories: [...]"
4. Should show array of categories

### Test 3: Check Modal Debug Message
1. Click "+ New Service"
2. Look for red debug text showing "Debug: 2 categories received"
3. Categories checkboxes should appear below

### Test 4: Test Category Filter
1. Select "Haircuts" from dropdown
2. Check browser Network tab → Should see request to:
   `/services/list?category_id=1&status=all&page=1&per_page=50`
3. Services list should filter to only services in "Haircuts" category

## Common Issues and Solutions

### If categories endpoint returns 404:
- The route wasn't registered
- Check if you added both the route AND the method
- Try refreshing wp-admin to clear route cache

### If categories array is empty:
- Check database: `SELECT * FROM wp_bookings_categories WHERE deleted_at IS NULL`
- Verify `is_active = 1`
- Check if categories exist in database

### If category filter doesn't work:
- Check if `category_id` is being passed to API
- Look at Network tab → Services list request
- Verify the URL includes `category_id=X`
- Check backend SQL query includes category filter

## Database Verification
```sql
-- Check categories exist
SELECT id, name, is_active, deleted_at 
FROM wp_bookings_categories;

-- Check service-category relationships
SELECT 
    s.name as service_name,
    c.name as category_name
FROM wp_bookings_service_categories sc
INNER JOIN wp_bookings_services s ON sc.service_id = s.id
INNER JOIN wp_bookings_categories c ON sc.category_id = c.id
WHERE s.deleted_at IS NULL;
```

Should show services linked to categories.