# 🔍 DEBUG: 404 Error on Update Endpoint

The update endpoint is not being registered correctly. This is likely because WordPress REST API requires **both GET and PUT** routes to be on the **same route registration** when they share the same URL pattern.

---

## 🔧 FIX: Combine GET and PUT Routes

The issue is that you registered:
- `GET /dashboard/services/{id}` (Part A)
- `PUT /dashboard/services/{id}` (Part B)

But WordPress REST API needs them **combined** in one `register_rest_route()` call.

---

## 📝 CURSOR PROMPT TO FIX

```markdown
# Fix: Combine GET/PUT/DELETE Routes for Services

The update (PUT) and delete (DELETE) endpoints are returning 404 because they need to be combined with the GET endpoint in a single route registration.

Update `includes/api/class-dashboard-bookings-api.php`:

## Find and Replace the Single Service Routes

In the `register_routes()` method, find these THREE separate route registrations:

**Remove these:**
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

// Update service
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/(?P<id>\d+)',
    array(
        'methods'             => 'PUT',
        'callback'            => array( $this, 'update_service' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            // ... all the args
        ),
    )
);

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

**Replace with a SINGLE combined registration:**
```php
// Get/Update/Delete single service
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/(?P<id>\d+)',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_service_details' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
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
        ),
        array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_service' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
    )
);
```

## Testing

After applying the fix, test all three methods:

### Test 1: GET (should still work)
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Service details returned

### Test 2: PUT (should now work)
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
    duration: 45,
    price: 35.00,
    deposit_amount: 100.00,
    deposit_type: 'percentage',
    buffer_before: 15,
    buffer_after: 10,
    category_ids: [2],
    is_active: true,
    display_order: 1
  })
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Updated categories:', data.service.categories)
})
```

Expected: Success, categories updated

### Test 3: DELETE (should now work)
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/4', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Success or error if has future bookings

## Notes

- WordPress REST API requires multiple methods on same URL to be in single `register_rest_route()` call
- Each method is an array element in the main args array
- GET, PUT, DELETE all share the same URL pattern but different methods
- This is the correct WordPress way to handle RESTful CRUD operations
```

---

## 🎯 WHY THIS HAPPENS

**WordPress REST API Behavior:**

When you register **multiple routes with the same URL pattern** separately:
```php
register_rest_route(..., '/services/(?P<id>\d+)', GET...)
register_rest_route(..., '/services/(?P<id>\d+)', PUT...)
register_rest_route(..., '/services/(?P<id>\d+)', DELETE...)
```

WordPress only keeps the **last one registered** and overwrites the previous ones!

**Correct way:**
```php
register_rest_route(..., '/services/(?P<id>\d+)', [
    [GET...],
    [PUT...],
    [DELETE...]
])
```

All methods are in **one array** for the same URL.

---

## ✅ AFTER APPLYING THE FIX

Run your update test again:

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
    category_ids: [2],
    is_active: true,
    display_order: 1
  })
}).then(r => r.json()).then(data => {
  console.log('Updated categories:', data.service.categories)
})
```

**Should now return:** 
```
{success: true, message: "Service updated successfully.", service: {...}}
```

---

**Apply the fix and test all three methods (GET, PUT, DELETE)!** 🚀

Let me know when it works!