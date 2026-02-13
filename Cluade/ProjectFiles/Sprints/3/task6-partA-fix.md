# ✅ PERFECT! Let's Apply the Proper Fix

Here's the complete Cursor prompt to exclude the current booking from availability checks:

---

# 📝 CURSOR PROMPT: EXCLUDE CURRENT BOOKING FROM AVAILABILITY CHECK

```markdown
# Fix: Exclude Current Booking from Availability Check on Edit

When updating a booking, the availability check incorrectly treats the booking being edited as a conflict with itself. We need to exclude the current booking from the conflict check.

## Part 1: Update Dashboard API to Pass Booking ID

Update `includes/api/class-dashboard-bookings-api.php`:

Find the availability check in the `update_booking()` method (around line 470):

**Change this:**
```php
// Check if new time slot is available
$slots_result = $datetime_model->get_available_slots( $new_date, $new_service_id, $new_staff_id );
```

**To this:**
```php
// Check if new time slot is available
// Pass the booking ID to exclude it from conflict checking
$slots_result = $datetime_model->get_available_slots( 
    $new_date, 
    $new_service_id, 
    $new_staff_id,
    $booking_id  // Exclude this booking from conflicts
);
```

## Part 2: Update Datetime Model Method Signature

Update `includes/models/class-datetime-model.php`:

### 2A. Update get_available_slots() signature

Find the `get_available_slots()` method (should be around line 50-100):

**Change from:**
```php
public function get_available_slots( $date, $service_id, $staff_id ) {
```

**To:**
```php
public function get_available_slots( $date, $service_id, $staff_id, $exclude_booking_id = null ) {
```

### 2B. Pass exclude parameter to get_staff_availability()

In the same `get_available_slots()` method, find where it calls `get_staff_availability()`:

**Change from:**
```php
$staff_slots = $this->get_staff_availability( $date, $service, $staff_id );
```

**To:**
```php
$staff_slots = $this->get_staff_availability( $date, $service, $staff_id, $exclude_booking_id );
```

### 2C. Update get_staff_availability() signature

Find the `get_staff_availability()` method:

**Change from:**
```php
private function get_staff_availability( $date, $service, $staff_id ) {
```

**To:**
```php
private function get_staff_availability( $date, $service, $staff_id, $exclude_booking_id = null ) {
```

### 2D. Add exclusion to booking conflict query

In the `get_staff_availability()` method, find where it queries existing bookings. 

Look for a query that looks like:
```php
$booked_slots = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT start_time, end_time 
        FROM {$wpdb->prefix}bookings 
        WHERE staff_id = %d 
        AND booking_date = %s 
        AND deleted_at IS NULL",
        $staff_id,
        $date
    ),
    ARRAY_A
);
```

**Replace the entire query section with:**
```php
// Build query to get booked slots, excluding current booking if editing
if ( $exclude_booking_id ) {
    // Exclude the booking being edited from conflict check
    $booked_slots = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT start_time, end_time 
            FROM {$wpdb->prefix}bookings 
            WHERE staff_id = %d 
            AND booking_date = %s 
            AND id != %d
            AND deleted_at IS NULL",
            $staff_id,
            $date,
            $exclude_booking_id
        ),
        ARRAY_A
    );
} else {
    // Normal query without exclusion (for new bookings)
    $booked_slots = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT start_time, end_time 
            FROM {$wpdb->prefix}bookings 
            WHERE staff_id = %d 
            AND booking_date = %s 
            AND deleted_at IS NULL",
            $staff_id,
            $date
        ),
        ARRAY_A
    );
}
```

## Testing

After applying all changes:

### Test 1: Update status without rescheduling (should now work)
```javascript
fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(current => {
  console.log('Current:', current.booking.booking_date, current.booking.start_time)
  
  // Update with SAME date/time, only change status
  return fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
    },
    credentials: 'include',
    body: JSON.stringify({
      service_id: current.booking.service_id,
      staff_id: current.booking.staff_id,
      booking_date: current.booking.booking_date,
      booking_time: current.booking.start_time,
      status: 'completed',
      payment_method: current.booking.payment_method || 'cash',
      amount_paid: parseFloat(current.booking.deposit_paid) || 0,
      special_requests: current.booking.special_requests || '',
      staff_notes: 'Marked as completed',
      send_notification: false
    })
  })
}).then(r => r.json()).then(result => {
  if (result.success) {
    console.log('✅ SUCCESS! Status updated without rescheduling')
    console.log('Updated booking:', result.booking)
  } else {
    console.log('❌ FAILED:', result)
  }
})
```

Expected: ✅ Success (no longer conflicts with itself)

### Test 2: Reschedule to different time (should still work)
```javascript
// Get tomorrow's date
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    service_id: 2,
    staff_id: 3,
    booking_date: tomorrowStr,
    booking_time: '14:00',
    status: 'confirmed',
    payment_method: 'cash',
    amount_paid: 35.00,
    special_requests: 'Rescheduled',
    staff_notes: 'Moved to tomorrow',
    send_notification: false
  })
}).then(r => r.json()).then(result => {
  console.log('Reschedule result:', result)
})
```

Expected: ✅ Success (works as before)

### Test 3: Try conflicting with ANOTHER booking (should still fail correctly)
First create a second booking, then try to update booking 1 to the same time as booking 2.

Expected: ❌ Error "time_not_available" (correctly prevents real conflicts)

### Test 4: Verify new bookings still work
Create a new booking via Task 5 modal.

Expected: ✅ Should work normally (backward compatible)

## Database Verification

```sql
-- Verify booking was updated
SELECT id, booking_date, start_time, status, updated_at
FROM wp_bookings 
WHERE id = 1;

-- Verify no duplicate bookings at same time/staff
SELECT 
    b1.id as booking1_id,
    b2.id as booking2_id,
    b1.booking_date,
    b1.start_time,
    b1.staff_id
FROM wp_bookings b1
INNER JOIN wp_bookings b2 ON 
    b1.staff_id = b2.staff_id 
    AND b1.booking_date = b2.booking_date 
    AND b1.start_time = b2.start_time
    AND b1.id < b2.id
WHERE b1.deleted_at IS NULL 
  AND b2.deleted_at IS NULL;
```

Should return 0 rows (no conflicts)

## Summary of Changes

**Files Modified:**
1. `includes/api/class-dashboard-bookings-api.php` - Pass booking ID to availability check
2. `includes/models/class-datetime-model.php` - Add optional exclude parameter to 3 methods

**What This Fixes:**
- ✅ Can update status without rescheduling
- ✅ Can update payment without rescheduling
- ✅ Can add notes without rescheduling
- ✅ Can update any field with same date/time
- ✅ Still prevents conflicts with OTHER bookings
- ✅ Backward compatible (existing calls still work)

**What Still Works:**
- ✅ New booking creation (passes null for exclude parameter)
- ✅ Availability checks for public booking wizard
- ✅ Rescheduling to different times
- ✅ Conflict detection with other bookings
```

---

## ✅ AFTER APPLYING THE FIX

Run the **Test 1** script from above to verify it works:

```javascript
// This should NOW succeed (previously failed)
fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(current => {
  return fetch('/wp-json/bookit/v1/dashboard/bookings/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
    },
    credentials: 'include',
    body: JSON.stringify({
      service_id: current.booking.service_id,
      staff_id: current.booking.staff_id,
      booking_date: current.booking.booking_date,
      booking_time: current.booking.start_time,
      status: 'completed',
      payment_method: current.booking.payment_method || 'cash',
      amount_paid: parseFloat(current.booking.deposit_paid) || 0,
      special_requests: current.booking.special_requests || '',
      staff_notes: 'Test: marking complete without reschedule',
      send_notification: false
    })
  })
}).then(r => r.json()).then(console.log)
```

**Expected:** ✅ `{success: true, message: "Booking updated successfully.", ...}`

---

**Apply the Cursor prompt and test!** Let me know when Part A is complete and working! 🚀

Then we'll move to **Part B: Frontend Edit Modal**.