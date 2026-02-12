# Fix: Services List API Missing Price Field

The services list endpoint is not returning the price field, causing all services to show £0.00.

Update `includes/api/class-dashboard-bookings-api.php`:

## Find the get_services_list() method

Locate the `get_services_list()` method (around line 200-220).

## Update the SQL query to include price and duration

**Change the SELECT clause from:**
```php
"SELECT 
    id,
    name
FROM {$wpdb->prefix}bookings_services
```

**To:**
```php
"SELECT 
    id,
    name,
    price,
    duration
FROM {$wpdb->prefix}bookings_services
```

The complete method should look like:
```php
public function get_services_list() {
    global $wpdb;

    $services = $wpdb->get_results(
        "SELECT 
            id,
            name,
            price,
            duration
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

## Testing

After applying the fix:

1. Refresh the browser
2. Open "+ New Booking" modal
3. Go to Step 2 (Services)
4. Should see correct prices:
   - Women's Haircut: £35.00
   - Men's Haircut: £25.00
   - Hair Coloring: £85.00
5. Verify in console:
```javascript
   fetch('/wp-json/bookit/v1/dashboard/services/list', {
     headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
     credentials: 'include'
   }).then(r => r.json()).then(data => {
     console.log('Services with prices:', data.services)
   })
```
```

---

## ✅ AFTER APPLYING THE FIX

Test again:
```
1. Open modal
2. Go to Step 2
3. Should see:
   - Women's Haircut - 60 minutes - £35.00 ✓
   - Men's Haircut - 45 minutes - £25.00 ✓
   - Hair Coloring - 120 minutes - £85.00 ✓