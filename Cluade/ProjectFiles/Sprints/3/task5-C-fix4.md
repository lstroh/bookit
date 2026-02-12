# Fix: Remove deleted_at from staff_services Queries

The wp_bookings_staff_services table doesn't have a deleted_at column, causing queries to fail.

## Fix 1: Update get_staff_by_service in class-dashboard-bookings-api.php

Find the `get_staff_by_service()` method and remove the line checking `ss.deleted_at`:

**Change this:**
```php
"SELECT DISTINCT
    s.id,
    CONCAT(s.first_name, ' ', s.last_name) as name,
    s.first_name,
    s.last_name,
    ss.custom_price
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d
AND ss.deleted_at IS NULL
ORDER BY s.first_name ASC",
```

**To this:**
```php
"SELECT DISTINCT
    s.id,
    CONCAT(s.first_name, ' ', s.last_name) as name,
    s.first_name,
    s.last_name,
    ss.custom_price
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d
ORDER BY s.first_name ASC",
```

## Fix 2: Update create_manual_booking in class-dashboard-bookings-api.php

Find the staff availability query in `create_manual_booking()` method (the one that handles "no preference" - around line 180):

**Change this:**
```php
"SELECT DISTINCT s.id
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d
AND ss.deleted_at IS NULL
ORDER BY s.first_name ASC",
```

**To this:**
```php
"SELECT DISTINCT s.id
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d
ORDER BY s.first_name ASC",
```

## Fix 3: Update get_timeslots in class-dashboard-timeslots-api.php

Find the staff list query in `get_timeslots()` method (the one that handles staff_id = 0 for "no preference"):

**Change this:**
```php
"SELECT DISTINCT s.id
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d
AND ss.deleted_at IS NULL",
```

**To this:**
```php
"SELECT DISTINCT s.id
FROM {$wpdb->prefix}bookings_staff s
INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
WHERE s.is_active = 1
AND s.deleted_at IS NULL
AND ss.service_id = %d",
```

## Testing

After applying all three fixes:

1. **Refresh browser**

2. **Test API endpoint:**
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/by-service/2', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Staff for service 2:', data.staff)
  console.log('Count:', data.staff?.length)
})
```

Expected: Should return 3 staff (Emma Thompson, Sarah Jones, Lisa Smith)

3. **Test in UI:**
   - Open "+ New Booking" modal
   - Step 1: Select customer
   - Step 2: Select "Women's Haircut" (service_id = 2)
   - Step 3: Should see:
     - 🎯 No Preference - First Available
     - Emma Thompson
     - Lisa Smith
     - Sarah Jones

4. **Test service with single staff:**
   - Step 2: Select "Men's Haircut" (service_id = 3)
   - Step 3: Should see:
     - Mark Wilson only
     - NO "No Preference" option (only 1 staff)

5. **Test complete booking flow:**
   - Select service with multiple staff
   - Select "No Preference"
   - Pick date and time
   - Complete booking
   - Verify which staff was auto-assigned

## Files Modified

- `includes/api/class-dashboard-bookings-api.php` (2 queries fixed)
- `includes/api/class-dashboard-timeslots-api.php` (1 query fixed)