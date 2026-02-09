# 🚀 TASK 3: TODAY'S SCHEDULE WIDGET

Perfect! Let's build the Today's Schedule feature with real booking data.

---

## 📋 TASK 3 OVERVIEW

**Goal:** Display today's bookings with real data from the database

**Time Estimate:** 10 hours
- REST API endpoint: 3h
- Vue component updates: 3h
- Testing & refinement: 4h

**What You'll Build:**
1. REST API endpoint: `GET /wp-json/bookit/v1/dashboard/bookings/today`
2. Enhanced Dashboard.vue with real data
3. Role-based filtering (admin sees all, staff sees only theirs)
4. Status badges and "Starting Soon" indicator
5. Quick actions (Mark Complete)

---

## 🎯 CURSOR COMPOSER PROMPT

Copy this entire prompt into Cursor Composer:

```markdown
# Task 3: Today's Schedule Widget - Real Booking Data

## Context
I'm building a WordPress booking plugin dashboard using Vue 3. I need to create a REST API endpoint that returns today's bookings and update the Vue component to display real data instead of the placeholder.

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing files:
- Auth: `includes/class-bookit-auth.php`
- Session: `includes/class-bookit-session.php`
- API folder: `includes/api/` (8 existing customer-facing endpoints)
- Vue dashboard: `dashboard/src/views/Dashboard.vue` (currently placeholder)

Database tables:
- `wp_bookings` - main bookings table
- `wp_bookings_customers` - customer details
- `wp_bookings_services` - service details
- `wp_bookings_staff` - staff details

## Requirements

### 1. Create REST API Controller

Create `includes/api/class-dashboard-bookings-api.php`:

```php
<?php
/**
 * Dashboard Bookings REST API Controller
 *
 * Handles dashboard-specific booking endpoints with authentication.
 *
 * @package Bookit_Booking_System
 * @subpackage API
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Bookit_Dashboard_Bookings_API
 */
class Bookit_Dashboard_Bookings_API {

    /**
     * REST API namespace
     */
    const NAMESPACE = 'bookit/v1';

    /**
     * Constructor - Register REST routes
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Today's bookings
        register_rest_route(
            self::NAMESPACE,
            '/dashboard/bookings/today',
            array(
                'methods'             => 'GET',
                'callback'            => array( $this, 'get_todays_bookings' ),
                'permission_callback' => array( $this, 'check_dashboard_permission' ),
            )
        );

        // Mark booking as complete
        register_rest_route(
            self::NAMESPACE,
            '/dashboard/bookings/(?P<id>\d+)/complete',
            array(
                'methods'             => 'POST',
                'callback'            => array( $this, 'mark_booking_complete' ),
                'permission_callback' => array( $this, 'check_dashboard_permission' ),
                'args'                => array(
                    'id' => array(
                        'required'          => true,
                        'validate_callback' => function( $param ) {
                            return is_numeric( $param );
                        },
                    ),
                ),
            )
        );
    }

    /**
     * Check if user has dashboard permission
     *
     * @return bool|WP_Error
     */
    public function check_dashboard_permission() {
        // Load auth classes if not loaded
        if ( ! class_exists( 'Bookit_Session' ) ) {
            require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-session.php';
        }
        if ( ! class_exists( 'Bookit_Auth' ) ) {
            require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-auth.php';
        }

        // Check if logged in
        if ( ! Bookit_Auth::is_logged_in() ) {
            return new WP_Error(
                'unauthorized',
                'You must be logged in to access the dashboard.',
                array( 'status' => 401 )
            );
        }

        return true;
    }

    /**
     * Get today's bookings
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function get_todays_bookings( $request ) {
        global $wpdb;

        $current_staff = Bookit_Auth::get_current_staff();
        if ( ! $current_staff ) {
            return new WP_Error(
                'unauthorized',
                'Could not retrieve staff information.',
                array( 'status' => 401 )
            );
        }

        $today = current_time( 'Y-m-d' );

        // Build query with role-based filtering
        $query = "
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.duration,
                b.status,
                b.total_price,
                b.deposit_paid,
                b.balance_due,
                b.full_amount_paid,
                b.payment_method,
                b.special_requests,
                b.staff_notes,
                c.first_name AS customer_first_name,
                c.last_name AS customer_last_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                s.name AS service_name,
                st.first_name AS staff_first_name,
                st.last_name AS staff_last_name
            FROM {$wpdb->prefix}bookings b
            INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
            INNER JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
            INNER JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
            WHERE b.booking_date = %s
            AND b.deleted_at IS NULL
        ";

        $params = array( $today );

        // Staff role: only see their own bookings
        // Admin role: see all bookings
        if ( 'staff' === $current_staff['role'] ) {
            $query  .= " AND b.staff_id = %d";
            $params[] = $current_staff['id'];
        }

        // Order by start time
        $query .= " ORDER BY b.start_time ASC";

        // Execute query
        $results = $wpdb->get_results( $wpdb->prepare( $query, $params ), ARRAY_A );

        if ( null === $results ) {
            return new WP_Error(
                'database_error',
                'Failed to retrieve bookings.',
                array( 'status' => 500 )
            );
        }

        // Format bookings for frontend
        $bookings = array_map( array( $this, 'format_booking' ), $results );

        return rest_ensure_response(
            array(
                'success'  => true,
                'bookings' => $bookings,
                'date'     => $today,
                'count'    => count( $bookings ),
            )
        );
    }

    /**
     * Format booking data for API response
     *
     * @param array $booking Raw booking from database.
     * @return array Formatted booking.
     */
    private function format_booking( $booking ) {
        // Calculate if booking is starting soon (within 15 minutes)
        $current_time = current_time( 'H:i:s' );
        $start_time   = $booking['start_time'];
        
        $current_timestamp = strtotime( current_time( 'Y-m-d' ) . ' ' . $current_time );
        $start_timestamp   = strtotime( current_time( 'Y-m-d' ) . ' ' . $start_time );
        
        $time_until_start = ( $start_timestamp - $current_timestamp ) / 60; // minutes
        $is_starting_soon = $time_until_start > 0 && $time_until_start <= 15;

        // Calculate if booking has passed
        $has_passed = $current_timestamp > strtotime( current_time( 'Y-m-d' ) . ' ' . $booking['end_time'] );

        return array(
            'id'                => (int) $booking['id'],
            'booking_date'      => $booking['booking_date'],
            'start_time'        => substr( $booking['start_time'], 0, 5 ), // HH:MM format
            'end_time'          => substr( $booking['end_time'], 0, 5 ),
            'duration'          => (int) $booking['duration'],
            'status'            => $booking['status'],
            'total_price'       => (float) $booking['total_price'],
            'deposit_paid'      => (float) $booking['deposit_paid'],
            'balance_due'       => (float) $booking['balance_due'],
            'full_amount_paid'  => (bool) $booking['full_amount_paid'],
            'payment_method'    => $booking['payment_method'],
            'special_requests'  => $booking['special_requests'],
            'staff_notes'       => $booking['staff_notes'],
            'customer_name'     => $booking['customer_first_name'] . ' ' . $booking['customer_last_name'],
            'customer_email'    => $booking['customer_email'],
            'customer_phone'    => $booking['customer_phone'],
            'service_name'      => $booking['service_name'],
            'staff_name'        => $booking['staff_first_name'] . ' ' . $booking['staff_last_name'],
            'is_starting_soon'  => $is_starting_soon,
            'has_passed'        => $has_passed,
        );
    }

    /**
     * Mark booking as complete
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function mark_booking_complete( $request ) {
        global $wpdb;

        $booking_id = (int) $request['id'];
        $current_staff = Bookit_Auth::get_current_staff();

        // Get booking to verify ownership (staff can only complete their own bookings)
        $booking = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, staff_id, status FROM {$wpdb->prefix}bookings WHERE id = %d AND deleted_at IS NULL",
                $booking_id
            ),
            ARRAY_A
        );

        if ( ! $booking ) {
            return new WP_Error(
                'booking_not_found',
                'Booking not found.',
                array( 'status' => 404 )
            );
        }

        // Check permission: staff can only complete their own bookings
        if ( 'staff' === $current_staff['role'] && (int) $booking['staff_id'] !== (int) $current_staff['id'] ) {
            return new WP_Error(
                'forbidden',
                'You do not have permission to complete this booking.',
                array( 'status' => 403 )
            );
        }

        // Check if already completed
        if ( 'completed' === $booking['status'] ) {
            return new WP_Error(
                'already_completed',
                'This booking is already marked as complete.',
                array( 'status' => 400 )
            );
        }

        // Update status to completed
        $result = $wpdb->update(
            $wpdb->prefix . 'bookings',
            array(
                'status'     => 'completed',
                'updated_at' => current_time( 'mysql' ),
            ),
            array( 'id' => $booking_id ),
            array( '%s', '%s' ),
            array( '%d' )
        );

        if ( false === $result ) {
            return new WP_Error(
                'database_error',
                'Failed to update booking status.',
                array( 'status' => 500 )
            );
        }

        return rest_ensure_response(
            array(
                'success' => true,
                'message' => 'Booking marked as complete.',
                'booking_id' => $booking_id,
            )
        );
    }
}

// Initialize the API
new Bookit_Dashboard_Bookings_API();
```

### 2. Register API Controller in Plugin Loader

Add to `includes/class-bookit-loader.php` (or wherever you initialize API classes):

Find the section where other API classes are loaded and add:

```php
// Dashboard API
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-dashboard-bookings-api.php';
```

If there's no central loader, add to the main plugin file where other API classes are required.

### 3. Update Vue Dashboard Component

Replace `dashboard/src/views/Dashboard.vue` with:

```vue
<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">
        Today's Schedule
      </h2>
      <p class="text-sm text-gray-600 mt-1">
        {{ formattedDate }}
      </p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading bookings...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-start">
        <span class="text-2xl mr-3">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800">Error Loading Bookings</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          <button
            @click="loadBookings"
            class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="bookings.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <div class="text-6xl mb-4">📅</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No bookings today
      </h3>
      <p class="text-sm text-gray-600">
        You have a clear schedule for today.
      </p>
    </div>
    
    <!-- Bookings List -->
    <div v-else class="space-y-4">
      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-orange-400': booking.is_starting_soon }"
      >
        <div class="p-6">
          <!-- Header Row -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <!-- Time and Status -->
              <div class="flex items-center gap-3 mb-2">
                <span class="text-xl font-semibold text-gray-900">
                  {{ booking.start_time }}
                </span>
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusClass(booking.status)"
                >
                  {{ formatStatus(booking.status) }}
                </span>
                <span
                  v-if="booking.is_starting_soon && booking.status !== 'completed' && booking.status !== 'cancelled'"
                  class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full animate-pulse"
                >
                  ⏰ Starting Soon
                </span>
                <span
                  v-if="booking.has_passed && booking.status !== 'completed' && booking.status !== 'cancelled'"
                  class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                >
                  ⏱️ Overdue
                </span>
              </div>
              
              <!-- Service Name -->
              <h3 class="text-base font-medium text-gray-900 mb-3">
                {{ booking.service_name }}
              </h3>
              
              <!-- Details Grid -->
              <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span class="text-gray-500">Customer:</span>
                  <span class="ml-2 text-gray-900 font-medium">{{ booking.customer_name }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Staff:</span>
                  <span class="ml-2 text-gray-900">{{ booking.staff_name }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Duration:</span>
                  <span class="ml-2 text-gray-900">{{ booking.duration }} min</span>
                </div>
                <div>
                  <span class="text-gray-500">Payment:</span>
                  <span class="ml-2 text-gray-900">{{ formatPaymentStatus(booking) }}</span>
                </div>
              </div>
              
              <!-- Special Requests -->
              <div v-if="booking.special_requests" class="mt-3 text-sm">
                <span class="text-gray-500">Note:</span>
                <span class="ml-2 text-gray-700 italic">{{ booking.special_requests }}</span>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex flex-col gap-2 ml-4">
              <button
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                @click="viewDetails(booking)"
              >
                View Details
              </button>
              <button
                v-if="booking.status !== 'completed' && booking.status !== 'cancelled'"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                :disabled="markingComplete === booking.id"
                @click="markComplete(booking)"
              >
                {{ markingComplete === booking.id ? 'Updating...' : 'Mark Complete' }}
              </button>
              <span
                v-else-if="booking.status === 'completed'"
                class="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg text-center"
              >
                ✓ Completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

const loading = ref(true)
const error = ref(null)
const bookings = ref([])
const markingComplete = ref(null)

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const getStatusClass = (status) => {
  const classes = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_payment': 'bg-orange-100 text-orange-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'no_show': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatStatus = (status) => {
  const labels = {
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'pending_payment': 'Pending Payment',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'no_show': 'No Show'
  }
  return labels[status] || status
}

const formatPaymentStatus = (booking) => {
  if (booking.full_amount_paid) {
    return `£${booking.total_price.toFixed(2)} (Paid)`
  }
  
  if (booking.deposit_paid > 0) {
    return `£${booking.deposit_paid.toFixed(2)} paid, £${booking.balance_due.toFixed(2)} due`
  }
  
  if (booking.payment_method === 'pay_on_arrival') {
    return `£${booking.total_price.toFixed(2)} (Pay on Arrival)`
  }
  
  return `£${booking.total_price.toFixed(2)}`
}

const loadBookings = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/bookings/today')
    
    if (response.data.success) {
      bookings.value = response.data.bookings
    } else {
      throw new Error(response.data.message || 'Failed to load bookings')
    }
  } catch (err) {
    console.error('Error loading bookings:', err)
    error.value = err.message || 'Failed to load bookings. Please try again.'
  } finally {
    loading.value = false
  }
}

const viewDetails = (booking) => {
  // TODO: Implement in Task 6 - Edit Booking Modal
  alert(`View booking details for ${booking.customer_name}\n\nThis will be implemented in Task 6 (Edit Booking Modal)`)
}

const markComplete = async (booking) => {
  if (markingComplete.value) return
  
  // Simple confirmation for now
  const confirmed = confirm(
    `Mark booking as complete?\n\n` +
    `Customer: ${booking.customer_name}\n` +
    `Service: ${booking.service_name}\n` +
    `Time: ${booking.start_time}\n\n` +
    `Note: A full completion interface with notes will be available in Task 6.`
  )
  
  if (!confirmed) return
  
  markingComplete.value = booking.id
  
  try {
    const response = await api.post(`/bookings/${booking.id}/complete`)
    
    if (response.data.success) {
      // Update local state
      const index = bookings.value.findIndex(b => b.id === booking.id)
      if (index !== -1) {
        bookings.value[index].status = 'completed'
      }
      
      // Show success message
      alert('✓ Booking marked as complete!')
    } else {
      throw new Error(response.data.message || 'Failed to mark complete')
    }
  } catch (err) {
    console.error('Error marking complete:', err)
    alert(`Error: ${err.message || 'Failed to mark booking as complete'}`)
  } finally {
    markingComplete.value = null
  }
}

onMounted(() => {
  loadBookings()
})
</script>
```

### 4. Test the Implementation

**Testing Checklist:**

1. **Generate test bookings** (use the PHP script from earlier or SQL):
   ```bash
   php wp-content/plugins/bookit-booking-system/dashboard/test-data/generate-test-bookings.php
   ```

2. **Test as admin:**
   - Login as admin role
   - Should see ALL bookings for today

3. **Test as staff:**
   - Login as staff role
   - Should see ONLY their own bookings

4. **Test API endpoint directly:**
   ```bash
   # In browser console (after logging into dashboard):
   fetch('/wp-json/bookit/v1/dashboard/bookings/today', {
     headers: {
       'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
     },
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

5. **Test "Mark Complete":**
   - Click "Mark Complete" on a confirmed booking
   - Should update status to completed
   - Refresh page, should show as completed

6. **Test edge cases:**
   - No bookings today (empty state)
   - Network error (disconnect internet, test error state)
   - Booking starting in 10 minutes (should show "Starting Soon")

## Implementation Steps

1. **Create the API controller file** (`includes/api/class-dashboard-bookings-api.php`)

2. **Register it in your plugin loader** (find where other API classes are loaded)

3. **Update Dashboard.vue** with the new code

4. **Generate test bookings** for today

5. **Test in browser:**
   - Start dev server: `npm run dev`
   - Login: http://plugin-test-1.local/bookit-dashboard/
   - View dashboard: Should redirect to `/app/` and show today's bookings

6. **Verify role-based filtering:**
   - Test with admin account (sees all)
   - Test with staff account (sees only theirs)

## Expected Output

After completing this task:
- ✅ Today's schedule shows real booking data
- ✅ Admin sees all bookings, staff sees only theirs
- ✅ Status badges display correctly
- ✅ "Starting Soon" indicator for bookings within 15 minutes
- ✅ "Mark Complete" button works
- ✅ Loading/error/empty states work properly
- ✅ Times display in 24-hour format (14:30)
- ✅ Payment status shows clearly

## Notes

- The "View Details" button currently shows an alert (will implement in Task 6)
- "Mark Complete" uses simple confirm dialog (will enhance in Task 6)
- Times are in 24-hour format as requested (configurable setting coming in Task 11)
- API endpoint uses WordPress `current_time()` to respect site timezone

## Troubleshooting

**API returns 401 Unauthorized:**
- Check `Bookit_Auth::is_logged_in()` returns true
- Verify session cookie is being sent
- Check browser console for session data

**No bookings showing but database has data:**
- Check browser console for API errors
- Verify today's date matches booking_date in database
- Check role-based filtering (staff might not have bookings assigned)

**"Starting Soon" not showing:**
- Check system time matches database time
- Verify booking is within 15 minutes
- Check timezone settings in WordPress

**Mark Complete fails:**
- Check booking belongs to logged-in staff (if staff role)
- Verify booking is not already completed
- Check browser console for error details
```

---

## 🧪 POST-IMPLEMENTATION TESTING

After Cursor completes the task, run through these tests:

### 1. **API Endpoint Test**
```javascript
// In browser console at /bookit-dashboard/app/
fetch('/wp-json/bookit/v1/dashboard/bookings/today', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Expected response:
// {
//   success: true,
//   bookings: [...],
//   date: "2026-02-08",
//   count: 5
// }
```

### 2. **Visual Verification**
- [ ] Bookings display in chronological order
- [ ] Status badges have correct colors
- [ ] "Starting Soon" badge appears for nearby bookings
- [ ] Customer and staff names display correctly
- [ ] Payment status shows "Paid" / "£X.XX due" / "Pay on Arrival"
- [ ] Special requests show in italics
- [ ] Empty state shows when no bookings

### 3. **Functional Testing**
- [ ] "Mark Complete" changes status
- [ ] Completed bookings show green checkmark instead of button
- [ ] Cancelled bookings show in red
- [ ] Loading spinner shows during API call
- [ ] Error message shows if API fails

### 4. **Role Testing**
```sql
-- Check current staff role
SELECT id, email, role FROM wp_bookings_staff WHERE is_active = 1;

-- As admin: should see all bookings
-- As staff: should see only bookings where staff_id matches logged-in user
```

---

## 📝 TASK 3 COMPLETION CHECKLIST

Mark complete when:

- [ ] API endpoint created: `/wp-json/bookit/v1/dashboard/bookings/today`
- [ ] API returns correct data (with JOINs)
- [ ] Role-based filtering works (admin vs staff)
- [ ] Dashboard.vue displays real bookings
- [ ] Status badges show correct colors
- [ ] "Starting Soon" indicator works
- [ ] "Mark Complete" button works
- [ ] Payment status displays correctly
- [ ] Loading/error/empty states work
- [ ] No console errors
- [ ] Tested with both admin and staff roles

---

## 🎯 READY TO START?

**Before you begin:**

1. **Ensure dev server is running:**
   ```bash
   cd dashboard
   npm run dev
   ```

2. **Generate test bookings:**
   Run the PHP script to create 5 test bookings for today

3. **Have both test users ready:**
   - One admin user
   - One staff user

**Copy the Cursor Composer prompt above and let's build!** 🚀

Let me know when Task 3 is complete!