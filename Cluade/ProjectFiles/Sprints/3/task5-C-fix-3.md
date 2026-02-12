# 📝 COMPLETE CURSOR PROMPT WITH "NO PREFERENCE" + SERVICE FILTERING

```markdown
# Fix: Filter Staff by Service + Add "No Preference" Option

Currently Step 3 shows all staff members. It should:
1. Show only staff who can provide the selected service
2. Include a "No Preference - First Available" option at the top

## PART 1: Backend API Updates

Update `includes/api/class-dashboard-bookings-api.php`:

### 1A. Add Filtered Staff by Service Route

Find the `register_routes()` method and add this new route after the existing `/dashboard/staff/list` route:

```php
// Get staff list for specific service (filtered by staff_services)
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/by-service/(?P<service_id>\d+)',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_staff_by_service' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

### 1B. Add get_staff_by_service Method

Add this method to the class (after the existing `get_staff_list()` method):

```php
/**
 * Get staff list for a specific service
 * Only returns staff who can provide the service (via staff_services junction table)
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_staff_by_service( $request ) {
    global $wpdb;

    $service_id = (int) $request->get_param( 'service_id' );

    $staff = $wpdb->get_results(
        $wpdb->prepare(
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
            $service_id
        ),
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success' => true,
            'staff'   => $staff,
        )
    );
}
```

### 1C. Update create_manual_booking to Handle "No Preference"

Find the `create_manual_booking()` method and update the staff assignment logic.

Find this section (around line 150-180):

```php
// Prepare booking data for Booking_Creator
$booking_data = array(
    'service_id'         => (int) $request->get_param( 'service_id' ),
    'staff_id'           => (int) $request->get_param( 'staff_id' ),
```

Replace with:

```php
// Get staff ID (handle "no preference" = 0)
$requested_staff_id = (int) $request->get_param( 'staff_id' );
$service_id = (int) $request->get_param( 'service_id' );
$booking_date = $request->get_param( 'booking_date' );
$booking_time = $request->get_param( 'booking_time' );

// If staff_id is 0 (no preference), find first available staff for this service
if ( $requested_staff_id === 0 ) {
    // Get all staff who can provide this service
    $available_staff = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT DISTINCT s.id
            FROM {$wpdb->prefix}bookings_staff s
            INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
            WHERE s.is_active = 1
            AND s.deleted_at IS NULL
            AND ss.service_id = %d
            AND ss.deleted_at IS NULL
            ORDER BY s.first_name ASC",
            $service_id
        ),
        ARRAY_A
    );

    if ( empty( $available_staff ) ) {
        return new WP_Error(
            'no_staff_available',
            'No staff members can provide this service.',
            array( 'status' => 400 )
        );
    }

    // Load datetime model to check availability
    if ( ! class_exists( 'Datetime_Model' ) ) {
        require_once plugin_dir_path( dirname( __DIR__ ) ) . 'models/class-datetime-model.php';
    }
    $datetime_model = new Datetime_Model();

    // Find first staff with availability at this time
    $assigned_staff_id = null;
    foreach ( $available_staff as $staff ) {
        $slots_result = $datetime_model->get_available_slots( $booking_date, $service_id, $staff['id'] );
        
        if ( ! is_wp_error( $slots_result ) && $slots_result['available'] ) {
            // Check if requested time is in available slots
            $all_slots = array_merge(
                $slots_result['slots']['morning'] ?? array(),
                $slots_result['slots']['afternoon'] ?? array(),
                $slots_result['slots']['evening'] ?? array()
            );
            
            if ( in_array( $booking_time, $all_slots, true ) ) {
                $assigned_staff_id = (int) $staff['id'];
                break;
            }
        }
    }

    if ( ! $assigned_staff_id ) {
        return new WP_Error(
            'no_staff_available_at_time',
            'No staff members are available at the selected time.',
            array( 'status' => 400 )
        );
    }

    $requested_staff_id = $assigned_staff_id;
}

// Prepare booking data for Booking_Creator
$booking_data = array(
    'service_id'         => $service_id,
    'staff_id'           => $requested_staff_id,
```

### 1D. Update Timeslots Endpoint for "No Preference"

Find `includes/api/class-dashboard-timeslots-api.php` and update the `get_timeslots()` method.

Find this section:

```php
public function get_timeslots( $request ) {
    $date       = $request->get_param( 'date' );
    $service_id = (int) $request->get_param( 'service_id' );
    $staff_id   = (int) $request->get_param( 'staff_id' );

    // Load datetime model
    if ( ! class_exists( 'Datetime_Model' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'models/class-datetime-model.php';
    }

    $datetime_model = new Datetime_Model();

    // Get available slots using existing logic
    $result = $datetime_model->get_available_slots( $date, $service_id, $staff_id );

    if ( is_wp_error( $result ) ) {
        return $result;
    }

    return rest_ensure_response( $result );
}
```

Replace with:

```php
public function get_timeslots( $request ) {
    global $wpdb;
    
    $date       = $request->get_param( 'date' );
    $service_id = (int) $request->get_param( 'service_id' );
    $staff_id   = (int) $request->get_param( 'staff_id' );

    // Load datetime model
    if ( ! class_exists( 'Datetime_Model' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'models/class-datetime-model.php';
    }

    $datetime_model = new Datetime_Model();

    // If staff_id is 0 (no preference), merge slots from all qualified staff
    if ( $staff_id === 0 ) {
        // Get all staff who can provide this service
        $staff_list = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DISTINCT s.id
                FROM {$wpdb->prefix}bookings_staff s
                INNER JOIN {$wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
                WHERE s.is_active = 1
                AND s.deleted_at IS NULL
                AND ss.service_id = %d
                AND ss.deleted_at IS NULL",
                $service_id
            ),
            ARRAY_A
        );

        if ( empty( $staff_list ) ) {
            return rest_ensure_response(
                array(
                    'success'   => false,
                    'available' => false,
                    'message'   => 'No staff members can provide this service.',
                    'slots'     => array(
                        'morning'   => array(),
                        'afternoon' => array(),
                        'evening'   => array(),
                    ),
                    'total_slots' => 0,
                )
            );
        }

        // Merge slots from all staff
        $merged_slots = array(
            'morning'   => array(),
            'afternoon' => array(),
            'evening'   => array(),
        );

        foreach ( $staff_list as $staff ) {
            $result = $datetime_model->get_available_slots( $date, $service_id, $staff['id'] );
            
            if ( ! is_wp_error( $result ) && $result['available'] ) {
                foreach ( array( 'morning', 'afternoon', 'evening' ) as $period ) {
                    if ( ! empty( $result['slots'][ $period ] ) ) {
                        $merged_slots[ $period ] = array_merge(
                            $merged_slots[ $period ],
                            $result['slots'][ $period ]
                        );
                    }
                }
            }
        }

        // Remove duplicates and sort
        foreach ( $merged_slots as $period => $slots ) {
            $merged_slots[ $period ] = array_values( array_unique( $slots ) );
            sort( $merged_slots[ $period ] );
        }

        $total_slots = count( $merged_slots['morning'] ) + 
                      count( $merged_slots['afternoon'] ) + 
                      count( $merged_slots['evening'] );

        return rest_ensure_response(
            array(
                'success'     => true,
                'available'   => $total_slots > 0,
                'message'     => $total_slots > 0 ? 'Slots available' : 'No available slots',
                'slots'       => $merged_slots,
                'total_slots' => $total_slots,
            )
        );
    }

    // Single staff - use existing logic
    $result = $datetime_model->get_available_slots( $date, $service_id, $staff_id );

    if ( is_wp_error( $result ) ) {
        return $result;
    }

    return rest_ensure_response( $result );
}
```

## PART 2: Frontend Vue Component Updates

Update `dashboard/src/components/BookingModal.vue`:

### 2A. Update Staff State

Find the state declarations (around line 430) and update:

```javascript
// Staff
const staffList = ref([])
const loadingStaff = ref(false)
const showNoPreference = ref(true)  // ADD THIS LINE
```

### 2B. Update loadStaffList Method

Find the `loadStaffList()` method (around line 460) and replace it:

```javascript
const loadStaffList = async () => {
  if (!bookingData.value.service) {
    console.error('No service selected')
    return
  }

  loadingStaff.value = true
  try {
    const response = await api.get(`staff/by-service/${bookingData.value.service.id}`)
    if (response.data.success) {
      staffList.value = response.data.staff
      
      // Show "No Preference" option if there are multiple staff
      showNoPreference.value = staffList.value.length > 1
      
      // If no staff available for this service, show message
      if (staffList.value.length === 0) {
        console.warn('No staff available for this service')
      }
    }
  } catch (err) {
    console.error('Error loading staff:', err)
    staffList.value = []
    showNoPreference.value = false
  } finally {
    loadingStaff.value = false
  }
}
```

### 2C. Update nextStep Method

Find the `nextStep()` method (around line 580) and update it:

```javascript
const nextStep = () => {
  // Load staff when moving from Step 2 (Service) to Step 3 (Staff)
  if (currentStep.value === 2) {
    // Clear previous staff selection
    bookingData.value.staff = null
    // Load staff filtered by selected service
    loadStaffList()
  }
  
  if (currentStep.value < 5) {
    currentStep.value++
  }
}
```

### 2D. Add selectNoPreference Method

Add this new method after the `selectStaff()` method:

```javascript
const selectNoPreference = () => {
  bookingData.value.staff = {
    id: 0,
    name: 'First Available Staff'
  }
}
```

### 2E. Update Step 3 Template

Find Step 3 (Staff Selection) in the template (around line 120-160) and replace the entire step with:

```vue
<!-- Step 3: Staff Selection -->
<div v-else-if="currentStep === 3">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">
    Select Staff Member
  </h3>

  <div v-if="loadingStaff" class="text-center py-8 text-gray-500">
    Loading staff...
  </div>

  <div v-else-if="staffList.length === 0" class="text-center py-8">
    <p class="text-gray-600">No staff available for this service.</p>
    <button
      @click="currentStep = 2"
      class="mt-4 text-sm text-primary-600 hover:text-primary-700 underline"
    >
      ← Select a different service
    </button>
  </div>

  <div v-else class="space-y-3">
    <!-- No Preference Option (only show if multiple staff) -->
    <button
      v-if="showNoPreference"
      type="button"
      class="w-full p-4 border-2 rounded-lg text-left transition-all bg-blue-50"
      :class="bookingData.staff?.id === 0
        ? 'border-primary-600 bg-primary-50'
        : 'border-blue-300 hover:border-primary-400'"
      @click="selectNoPreference"
    >
      <div class="flex items-center">
        <span class="text-2xl mr-3">🎯</span>
        <div>
          <div class="font-medium text-gray-900">
            No Preference - First Available
          </div>
          <div class="text-sm text-gray-600 mt-1">
            System will assign the first available staff member
          </div>
        </div>
      </div>
    </button>

    <!-- Individual Staff Members -->
    <button
      v-for="staff in staffList"
      :key="staff.id"
      type="button"
      class="w-full p-4 border-2 rounded-lg text-left transition-all"
      :class="bookingData.staff?.id === staff.id
        ? 'border-primary-600 bg-primary-50'
        : 'border-gray-200 hover:border-primary-300'"
      @click="selectStaff(staff)"
    >
      <div class="font-medium text-gray-900">
        {{ staff.name }}
      </div>
    </button>
  </div>
</div>
```

### 2F. Update Step 5 Summary to Handle "No Preference"

Find the booking summary in Step 5 (around line 340) and update the Staff line:

```vue
<div class="flex justify-between">
  <span class="text-gray-600">Staff:</span>
  <span class="font-medium">
    {{ bookingData.staff?.id === 0 ? 'First Available Staff' : bookingData.staff?.name }}
  </span>
</div>
```

### 2G. Update Timeslots API Call

The `loadTimeslots()` method already passes `staff_id`, so it will automatically work with staff_id = 0 (no preference) after backend changes.

No changes needed here - it will just work! ✓

## Testing

### Test 1: Service with Multiple Staff
1. Open modal
2. Step 1: Select customer
3. Step 2: Select "Women's Haircut" (assuming multiple staff can do this)
4. Step 3: Should see:
   - 🎯 "No Preference - First Available" (blue background)
   - Emma Thompson
   - Sarah Johnson
5. Click "No Preference"
6. Step 4: Should see merged availability from all qualified staff
7. Select date and time
8. Step 5: Summary should show "First Available Staff"
9. Create booking → Backend assigns first available staff

### Test 2: Service with Single Staff
1. Step 2: Select a service only one staff member provides
2. Step 3: Should see:
   - Only that one staff member
   - NO "No Preference" option (since only one choice)
3. Auto-select that staff member

### Test 3: No Preference Assignment
1. Complete booking with "No Preference"
2. After creation, check which staff was assigned
3. Verify it's one of the qualified staff members
4. Should be alphabetically first who had availability

### Test 4: Service with No Staff
1. Step 2: Select a service (if you have one with no staff assigned)
2. Step 3: Should show "No staff available for this service"
3. Show "← Select a different service" button

### Test 5: Change Service Clears Selection
1. Complete Steps 1-3 (select specific staff)
2. Click "Back" to Step 2
3. Select different service
4. Step 3: Staff list updates, previous selection cleared

### API Testing

**Test filtered staff list:**
```javascript
// Service ID 1 - check which staff can provide it
fetch('/wp-json/bookit/v1/dashboard/staff/by-service/1', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Test timeslots with "no preference" (staff_id=0):**
```javascript
fetch('/wp-json/bookit/v1/dashboard/timeslots?date=2026-02-13&service_id=1&staff_id=0', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Merged slots for all staff:', data)
  console.log('Total available slots:', data.total_slots)
})
```

**Test booking creation with no preference:**
```javascript
fetch('/wp-json/bookit/v1/dashboard/bookings/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    customer_id: 1,
    service_id: 1,
    staff_id: 0,  // No preference
    booking_date: '2026-02-15',
    booking_time: '14:00',
    payment_method: 'cash',
    amount_paid: 35.00,
    send_confirmation: false
  })
}).then(r => r.json()).then(data => {
  console.log('Created booking:', data)
  console.log('Assigned staff:', data.booking.staff_name)
})
```

## Database Verification

**Check staff-service relationships:**
```sql
SELECT 
    s.name as service_name,
    CONCAT(st.first_name, ' ', st.last_name) as staff_name,
    st.id as staff_id
FROM wp_bookings_staff_services ss
INNER JOIN wp_bookings_services s ON ss.service_id = s.id
INNER JOIN wp_bookings_staff st ON ss.staff_id = st.id
WHERE ss.deleted_at IS NULL
ORDER BY s.name, st.first_name;
```

**Verify auto-assignment worked:**
```sql
SELECT 
    b.id,
    b.booking_date,
    b.start_time,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    s.name as service_name,
    CONCAT(st.first_name, ' ', st.last_name) as assigned_staff
FROM wp_bookings b
INNER JOIN wp_bookings_customers c ON b.customer_id = c.id
INNER JOIN wp_bookings_services s ON b.service_id = s.id
INNER JOIN wp_bookings_staff st ON b.staff_id = st.id
ORDER BY b.id DESC
LIMIT 5;
```

## Expected Behavior

**Flow with No Preference:**
```
Step 1: Select Customer (Alice Smith) ✓
Step 2: Select Service (Haircut - £35) ✓
Step 3: Staff Options:
  🎯 No Preference - First Available  ← Click this
  Emma Thompson
  Sarah Johnson
Step 4: Date & Time
  → Shows merged slots from Emma + Sarah
  → More time options available
  → Select 14:00 ✓
Step 5: Summary shows "First Available Staff" ✓
Create Booking → System assigns Emma (first alphabetically who has availability)
Success! → Booking created with Emma assigned ✓
```

**Flow with Specific Staff:**
```
Step 1: Select Customer ✓
Step 2: Select Service ✓
Step 3: Click "Emma Thompson" specifically ✓
Step 4: Shows only Emma's availability ✓
Step 5: Summary shows "Emma Thompson" ✓
Create Booking → Emma assigned ✓
```

## Notes

- "No Preference" only shows when service has 2+ staff members
- When staff_id = 0, timeslots merges availability from ALL qualified staff
- Backend auto-assigns first available staff alphabetically
- Assignment happens at booking creation, checking real-time availability
- If no staff available at selected time, returns error
- Custom pricing from staff_services table is respected
```

---

## 🎯 SUMMARY OF CHANGES

### **Backend (3 changes):**
1. ✅ New endpoint: `/dashboard/staff/by-service/{id}` - Returns only qualified staff
2. ✅ Updated: `create_manual_booking()` - Handles staff_id = 0 (auto-assigns)
3. ✅ Updated: `get_timeslots()` - Merges slots when staff_id = 0

### **Frontend (5 changes):**
1. ✅ Loads filtered staff (only those who provide the service)
2. ✅ Shows "No Preference" button at top (if 2+ staff)
3. ✅ Clears staff selection when changing services
4. ✅ Handles staff_id = 0 in summary display
5. ✅ Passes staff_id = 0 to timeslots API (gets merged availability)

---

## 🧪 FULL END-TO-END TEST

After implementing:

```
1. Create booking for "Haircut" with "No Preference"
2. Select tomorrow at 14:00
3. Click "Create Booking"
4. Check database - which staff was assigned?
5. Verify they had availability at that time
6. Verify they can provide "Haircut" service
```

---

**This is a comprehensive update! Take your time implementing and testing.** 🚀

Let me know when it's complete or if you hit any issues!