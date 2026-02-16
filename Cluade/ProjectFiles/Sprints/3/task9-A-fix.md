# 🔍 DEBUG: Invalid Parameter Error for service_assignments

The WordPress REST API validation is rejecting the `service_assignments` array. This is because the validation schema is too strict for complex nested objects.

---

## 🔧 FIX: Simplify service_assignments Validation

```markdown
# Fix: Service Assignments Parameter Validation

The REST API is rejecting the service_assignments array due to strict validation. We need to simplify the validation to allow the array through, then validate manually in the method.

Update `includes/api/class-dashboard-bookings-api.php`:

## Fix 1: Update Create Staff Route Args

Find the `/dashboard/staff/create` route registration and replace the `service_assignments` arg:

**Change from:**
```php
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
```

**To:**
```php
'service_assignments' => array(
    'type'              => 'array',
    'default'           => array(),
    'sanitize_callback' => function( $param ) {
        // Allow the array through, we'll validate in the method
        return is_array( $param ) ? $param : array();
    },
),
```

## Fix 2: Update Update Staff Route Args

Find the `/dashboard/staff/(?P<id>\d+)` route registration (PUT method) and replace the `service_assignments` arg:

**Change from:**
```php
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
```

**To:**
```php
'service_assignments' => array(
    'type'              => 'array',
    'default'           => array(),
    'sanitize_callback' => function( $param ) {
        // Allow the array through, we'll validate in the method
        return is_array( $param ) ? $param : array();
    },
),
```

## Testing After Fix

### Test 1: Create Staff with Service Assignments
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
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Staff ID:', data.staff.id)
  console.log('Service assignments:', data.staff.service_assignments)
})
```

Expected: Success, staff created with 2 service assignments

### Test 2: Update Staff with Service Assignments
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/2', {
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
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Updated assignments:', data.staff.service_assignments)
})
```

Expected: Success, assignments updated (old deleted, new inserted)

### Test 3: Create Staff with No Service Assignments
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test2@example.com',
    password: 'password123',
    first_name: 'Test2',
    last_name: 'User2',
    role: 'staff',
    service_assignments: []  // Empty array
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success, staff created with 0 service assignments

### Test 4: Verify in Database
```sql
-- Check created staff's service assignments
SELECT 
    CONCAT(s.first_name, ' ', s.last_name) as staff_name,
    srv.name as service_name,
    srv.price as base_price,
    ss.custom_price
FROM wp_bookings_staff_services ss
INNER JOIN wp_bookings_staff s ON ss.staff_id = s.id
INNER JOIN wp_bookings_services srv ON ss.service_id = srv.id
WHERE s.email = 'test@example.com';
```

Expected: 2 rows showing service assignments with custom pricing

## Why This Fix Works

**The Problem:**
WordPress REST API's nested object validation is very strict and doesn't handle complex structures well, especially with nullable values.

**The Solution:**
- Remove the complex nested validation schema
- Add a simple sanitize_callback that ensures we get an array
- The actual validation happens in the PHP method where we have more control
- The methods already handle the array correctly (looping and inserting)

**Security:**
- Still safe because:
  - sanitize_callback ensures it's an array
  - PHP methods validate service_id exists
  - custom_price is cast to float or null
  - All database operations use prepared statements

## Notes

- This is a common WordPress REST API limitation with complex nested objects
- The validation still happens, just in the PHP method instead of the route args
- More flexible and easier to maintain
- No security concerns (all inputs still validated and sanitized)
```

---

## 🎯 WHAT THIS DOES

**Before (Too Strict):**
```php
'items' => array(
    'type' => 'object',
    'properties' => array(...)  // WordPress REST API rejects this
)
```

**After (Flexible):**
```php
'sanitize_callback' => function( $param ) {
    return is_array( $param ) ? $param : array();  // Just ensure it's an array
}
```

Then the PHP methods handle the actual validation:
```php
foreach ( $service_assignments as $assignment ) {
    // Validate and insert each one
}
```

---

## ✅ AFTER APPLYING THE FIX

Run both test commands again:

**Test 1 (Create):**
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
    role: 'staff',
    service_assignments: [
      { service_id: 1, custom_price: null },
      { service_id: 2, custom_price: 45.00 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

**Test 2 (Update):**
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/2', {
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
    role: 'staff',
    service_assignments: [
      { service_id: 1, custom_price: 40.00 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

Both should now return success! 🎉

---

**Apply this fix and test!** Let me know when both commands work! 🚀