# 🚀 PERFECT! Ready for Part C

Great info! I'll create Part C using your existing availability logic.

---

# 📝 PART C: BOOKING WIZARD STEPS 2-5 (Cursor Prompt 3)

Since this is complex, I'll give you **one comprehensive prompt** that builds all remaining steps.

Copy this into Cursor Composer:

```markdown
# Task 5 Part C: Complete Booking Wizard (Steps 2-5)

## Context
I'm building a WordPress booking plugin dashboard. Parts A (backend API) and B (customer selection) are complete. Now I need to implement the remaining wizard steps: service selection, staff selection, date/time selection, and payment/confirmation.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing endpoints:
- Customer search: `GET /wp-json/bookit/v1/dashboard/customers/search`
- Manual booking creation: `POST /wp-json/bookit/v1/dashboard/bookings/create`
- Services list: `GET /wp-json/bookit/v1/dashboard/services/list`
- Staff list: `GET /wp-json/bookit/v1/dashboard/staff/list`
- **Availability (needs new endpoint):** Will create `GET /wp-json/bookit/v1/dashboard/timeslots`

Existing files:
- Customer selector: `dashboard/src/components/CustomerSelector.vue` (complete)
- Booking modal: `dashboard/src/components/BookingModal.vue` (Step 1 complete)
- Availability logic: `includes/models/class-datetime-model.php` (reuse this)
- Public timeslots API: `includes/api/class-datetime-api.php` (reference, but don't modify)

Database:
- `wp_bookings_staff_working_hours` table exists with working hours data

## Requirements

### PART 1: Create Dashboard Timeslots Endpoint

Create new file `includes/api/class-dashboard-timeslots-api.php`:

```php
<?php
/**
 * Dashboard Timeslots REST API
 *
 * Provides available time slots for manual booking creation.
 * Separate from public API to accept explicit service_id and staff_id parameters.
 *
 * @package Bookit_Booking_System
 * @subpackage API
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Bookit_Dashboard_Timeslots_API
 */
class Bookit_Dashboard_Timeslots_API {

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
        register_rest_route(
            self::NAMESPACE,
            '/dashboard/timeslots',
            array(
                'methods'             => 'GET',
                'callback'            => array( $this, 'get_timeslots' ),
                'permission_callback' => array( $this, 'check_dashboard_permission' ),
                'args'                => array(
                    'date' => array(
                        'required'          => true,
                        'validate_callback' => function( $param ) {
                            return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $param );
                        },
                    ),
                    'service_id' => array(
                        'required'          => true,
                        'validate_callback' => function( $param ) {
                            return is_numeric( $param );
                        },
                    ),
                    'staff_id' => array(
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
     * Get available timeslots
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
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
}

// Initialize the API
new Bookit_Dashboard_Timeslots_API();
```

### PART 2: Register Dashboard Timeslots API

Find where other API classes are loaded (likely in main plugin file or a loader class) and add:

```php
// Dashboard Timeslots API
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-dashboard-timeslots-api.php';
```

### PART 3: Update BookingModal.vue - Complete All Steps

Replace the entire `dashboard/src/components/BookingModal.vue` with:

```vue
<template>
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <!-- Modal Content -->
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            Create New Booking
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            Step {{ currentStep }} of 5: {{ stepTitle }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-6">
        <!-- Step 1: Customer Selection -->
        <CustomerSelector
          v-if="currentStep === 1"
          v-model="bookingData.customer"
        />

        <!-- Step 2: Service Selection -->
        <div v-else-if="currentStep === 2">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Select Service
          </h3>

          <div v-if="loadingServices" class="text-center py-8 text-gray-500">
            Loading services...
          </div>

          <div v-else-if="services.length === 0" class="text-center py-8">
            <p class="text-gray-600">No active services found.</p>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="service in services"
              :key="service.id"
              type="button"
              class="w-full p-4 border-2 rounded-lg text-left transition-all"
              :class="bookingData.service?.id === service.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'"
              @click="selectService(service)"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium text-gray-900">
                    {{ service.name }}
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ service.duration }} minutes
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-semibold text-gray-900">
                    £{{ parseFloat(service.price).toFixed(2) }}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 3: Staff Selection -->
        <div v-else-if="currentStep === 3">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Select Staff Member
          </h3>

          <div v-if="loadingStaff" class="text-center py-8 text-gray-500">
            Loading staff...
          </div>

          <div v-else-if="availableStaff.length === 0" class="text-center py-8">
            <p class="text-gray-600">No staff available for this service.</p>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="staff in availableStaff"
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

        <!-- Step 4: Date & Time Selection -->
        <div v-else-if="currentStep === 4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Select Date & Time
          </h3>

          <!-- Date Picker -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              v-model="selectedDate"
              type="date"
              :min="minDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @change="loadTimeslots"
            />
          </div>

          <!-- Time Slots -->
          <div v-if="selectedDate">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Available Times
            </label>

            <div v-if="loadingSlots" class="text-center py-8 text-gray-500">
              Loading available times...
            </div>

            <div v-else-if="timeslotsError" class="text-center py-8">
              <p class="text-red-600">{{ timeslotsError }}</p>
            </div>

            <div v-else-if="!timeslots || totalSlots === 0" class="text-center py-8">
              <p class="text-gray-600">No available times for this date.</p>
              <p class="text-sm text-gray-500 mt-1">Please select a different date.</p>
            </div>

            <div v-else class="space-y-4">
              <!-- Morning Slots -->
              <div v-if="timeslots.morning && timeslots.morning.length > 0">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Morning</h4>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="slot in timeslots.morning"
                    :key="slot"
                    type="button"
                    class="px-3 py-2 text-sm border-2 rounded-lg transition-all"
                    :class="bookingData.time === slot
                      ? 'border-primary-600 bg-primary-600 text-white font-medium'
                      : 'border-gray-200 hover:border-primary-300 text-gray-700'"
                    @click="selectTime(slot)"
                  >
                    {{ slot }}
                  </button>
                </div>
              </div>

              <!-- Afternoon Slots -->
              <div v-if="timeslots.afternoon && timeslots.afternoon.length > 0">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Afternoon</h4>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="slot in timeslots.afternoon"
                    :key="slot"
                    type="button"
                    class="px-3 py-2 text-sm border-2 rounded-lg transition-all"
                    :class="bookingData.time === slot
                      ? 'border-primary-600 bg-primary-600 text-white font-medium'
                      : 'border-gray-200 hover:border-primary-300 text-gray-700'"
                    @click="selectTime(slot)"
                  >
                    {{ slot }}
                  </button>
                </div>
              </div>

              <!-- Evening Slots -->
              <div v-if="timeslots.evening && timeslots.evening.length > 0">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Evening</h4>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="slot in timeslots.evening"
                    :key="slot"
                    type="button"
                    class="px-3 py-2 text-sm border-2 rounded-lg transition-all"
                    :class="bookingData.time === slot
                      ? 'border-primary-600 bg-primary-600 text-white font-medium'
                      : 'border-gray-200 hover:border-primary-300 text-gray-700'"
                    @click="selectTime(slot)"
                  >
                    {{ slot }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Payment & Confirmation -->
        <div v-else-if="currentStep === 5">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Payment & Confirmation
          </h3>

          <!-- Booking Summary -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Booking Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Customer:</span>
                <span class="font-medium">{{ getCustomerName() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Service:</span>
                <span class="font-medium">{{ bookingData.service?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Staff:</span>
                <span class="font-medium">{{ bookingData.staff?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Date & Time:</span>
                <span class="font-medium">{{ formatBookingDate() }} at {{ bookingData.time }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-300">
                <span class="text-gray-900 font-medium">Total:</span>
                <span class="text-lg font-semibold text-gray-900">£{{ parseFloat(bookingData.service?.price || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              v-model="bookingData.payment_method"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select payment method...</option>
              <option value="pay_on_arrival">Pay on Arrival</option>
              <option value="cash">Cash (Paid)</option>
              <option value="card_external">Card (Paid Outside System)</option>
              <option value="check">Check (Paid)</option>
              <option value="complimentary">Complimentary (Free)</option>
            </select>
          </div>

          <!-- Amount Paid (show only for paid methods) -->
          <div v-if="showAmountPaid" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">£</span>
              <input
                v-model.number="bookingData.amount_paid"
                type="number"
                step="0.01"
                min="0"
                :max="bookingData.service?.price"
                class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Full amount: £{{ parseFloat(bookingData.service?.price || 0).toFixed(2) }}
            </p>
          </div>

          <!-- Special Requests -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Special Requests / Notes
            </label>
            <textarea
              v-model="bookingData.special_requests"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any special requests or notes..."
            ></textarea>
          </div>

          <!-- Send Confirmation Email -->
          <div class="mb-4">
            <label class="flex items-center">
              <input
                v-model="bookingData.send_confirmation"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">
                Send confirmation email to customer
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 sticky bottom-0">
        <button
          v-if="currentStep > 1"
          @click="previousStep"
          :disabled="creating"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <div v-else></div>

        <div class="flex gap-2">
          <button
            @click="$emit('close')"
            :disabled="creating"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            v-if="currentStep < 5"
            :disabled="!canProceed"
            @click="nextStep"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: {{ nextStepLabel }} →
          </button>
          
          <button
            v-else
            :disabled="!canCreate || creating"
            @click="createBooking"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ creating ? 'Creating...' : '✓ Create Booking' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import CustomerSelector from './CustomerSelector.vue'

const api = useApi()

const emit = defineEmits(['close', 'created'])

// State
const currentStep = ref(1)
const creating = ref(false)
const bookingData = ref({
  customer: null,
  service: null,
  staff: null,
  date: null,
  time: null,
  payment_method: '',
  amount_paid: 0,
  special_requests: '',
  send_confirmation: true
})

// Services & Staff
const services = ref([])
const loadingServices = ref(false)
const staffList = ref([])
const loadingStaff = ref(false)

// Date & Time
const selectedDate = ref('')
const timeslots = ref(null)
const loadingSlots = ref(false)
const timeslotsError = ref('')

// Computed
const stepTitle = computed(() => {
  const titles = {
    1: 'Customer',
    2: 'Service',
    3: 'Staff',
    4: 'Date & Time',
    5: 'Payment'
  }
  return titles[currentStep.value] || ''
})

const nextStepLabel = computed(() => {
  const labels = {
    1: 'Select Service',
    2: 'Select Staff',
    3: 'Select Date & Time',
    4: 'Payment'
  }
  return labels[currentStep.value] || 'Next'
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!bookingData.value.customer
    case 2: return !!bookingData.value.service
    case 3: return !!bookingData.value.staff
    case 4: return !!bookingData.value.date && !!bookingData.value.time
    default: return false
  }
})

const canCreate = computed(() => {
  return bookingData.value.customer &&
         bookingData.value.service &&
         bookingData.value.staff &&
         bookingData.value.date &&
         bookingData.value.time &&
         bookingData.value.payment_method
})

const availableStaff = computed(() => {
  // TODO: Filter by service when staff-services relationship is available
  return staffList.value
})

const showAmountPaid = computed(() => {
  const paidMethods = ['cash', 'card_external', 'check']
  return paidMethods.includes(bookingData.value.payment_method)
})

const totalSlots = computed(() => {
  if (!timeslots.value) return 0
  return (timeslots.value.morning?.length || 0) +
         (timeslots.value.afternoon?.length || 0) +
         (timeslots.value.evening?.length || 0)
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Watch for service change to set default amount
watch(() => bookingData.value.service, (service) => {
  if (service) {
    bookingData.value.amount_paid = parseFloat(service.price || 0)
  }
})

// Watch for payment method change
watch(() => bookingData.value.payment_method, (method) => {
  if (method === 'complimentary') {
    bookingData.value.amount_paid = 0
  } else if (method === 'pay_on_arrival') {
    bookingData.value.amount_paid = 0
  } else if (showAmountPaid.value && bookingData.value.service) {
    bookingData.value.amount_paid = parseFloat(bookingData.value.service.price || 0)
  }
})

// Methods
const loadServices = async () => {
  loadingServices.value = true
  try {
    const response = await api.get('/services/list')
    if (response.data.success) {
      services.value = response.data.services
    }
  } catch (err) {
    console.error('Error loading services:', err)
  } finally {
    loadingServices.value = false
  }
}

const loadStaffList = async () => {
  loadingStaff.value = true
  try {
    const response = await api.get('/staff/list')
    if (response.data.success) {
      staffList.value = response.data.staff
    }
  } catch (err) {
    console.error('Error loading staff:', err)
  } finally {
    loadingStaff.value = false
  }
}

const loadTimeslots = async () => {
  if (!selectedDate.value || !bookingData.value.service || !bookingData.value.staff) {
    return
  }

  loadingSlots.value = true
  timeslotsError.value = ''

  try {
    const params = new URLSearchParams({
      date: selectedDate.value,
      service_id: bookingData.value.service.id,
      staff_id: bookingData.value.staff.id
    })

    const response = await api.get(`/timeslots?${params.toString()}`)

    if (response.data.success === false) {
      timeslotsError.value = response.data.message || 'No slots available'
      timeslots.value = null
    } else if (response.data.available === false) {
      timeslotsError.value = response.data.message || 'Date not available'
      timeslots.value = null
    } else {
      timeslots.value = response.data.slots
    }
  } catch (err) {
    console.error('Error loading timeslots:', err)
    timeslotsError.value = err.message || 'Failed to load available times'
    timeslots.value = null
  } finally {
    loadingSlots.value = false
  }
}

const selectService = (service) => {
  bookingData.value.service = service
}

const selectStaff = (staff) => {
  bookingData.value.staff = staff
}

const selectTime = (time) => {
  bookingData.value.time = time
}

const nextStep = () => {
  if (currentStep.value === 2 && !loadingStaff.value && staffList.value.length === 0) {
    loadStaffList()
  }
  if (currentStep.value < 5) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const getCustomerName = () => {
  if (!bookingData.value.customer) return ''
  const c = bookingData.value.customer
  return c.customer_first_name && c.customer_last_name
    ? `${c.customer_first_name} ${c.customer_last_name}`
    : c.customer_email || ''
}

const formatBookingDate = () => {
  if (!bookingData.value.date) return ''
  const date = new Date(bookingData.value.date + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const createBooking = async () => {
  if (!canCreate.value || creating.value) return

  creating.value = true

  try {
    const payload = {
      ...bookingData.value.customer,
      service_id: bookingData.value.service.id,
      staff_id: bookingData.value.staff.id,
      booking_date: bookingData.value.date,
      booking_time: bookingData.value.time,
      payment_method: bookingData.value.payment_method,
      amount_paid: bookingData.value.amount_paid,
      special_requests: bookingData.value.special_requests,
      send_confirmation: bookingData.value.send_confirmation
    }

    const response = await api.post('/bookings/create', payload)

    if (response.data.success) {
      emit('created', response.data.booking)
    } else {
      throw new Error(response.data.message || 'Failed to create booking')
    }
  } catch (err) {
    console.error('Error creating booking:', err)
    alert(`Error creating booking: ${err.message}`)
  } finally {
    creating.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadServices()
})

// Watch for step 4 to load initial date
watch(currentStep, (newStep) => {
  if (newStep === 4 && !selectedDate.value) {
    selectedDate.value = minDate.value
  }
})

// Watch for date selection to store in bookingData
watch(selectedDate, (newDate) => {
  bookingData.value.date = newDate
  bookingData.value.time = null // Clear selected time when date changes
  if (newDate && bookingData.value.service && bookingData.value.staff) {
    loadTimeslots()
  }
})
</script>
```

## Implementation Steps

1. **Create dashboard timeslots API file:**
   `includes/api/class-dashboard-timeslots-api.php`

2. **Register the API class:**
   Find where other API classes are loaded and add the require_once statement

3. **Replace BookingModal.vue:**
   Overwrite the entire file with the complete version above

4. **Test in browser:**
   - Open modal
   - Complete all 5 steps
   - Create a booking

## Testing Checklist

**Step 2 (Service Selection):**
- [ ] Services list loads
- [ ] Click service to select
- [ ] Selected service highlighted with border
- [ ] "Next" button enabled after selection

**Step 3 (Staff Selection):**
- [ ] Staff list loads
- [ ] Click staff to select
- [ ] Selected staff highlighted
- [ ] "Next" button enabled

**Step 4 (Date & Time):**
- [ ] Date picker shows (min date = today)
- [ ] After selecting date, time slots load
- [ ] Slots grouped by morning/afternoon/evening
- [ ] Click time slot to select (turns blue)
- [ ] "Next" button enabled after time selected
- [ ] Changing date clears selected time

**Step 5 (Payment & Confirmation):**
- [ ] Booking summary shows all details
- [ ] Payment method dropdown has all options
- [ ] Amount paid field shows for cash/card/check
- [ ] Amount paid defaults to full price
- [ ] Complimentary sets amount to 0
- [ ] Special requests textarea works
- [ ] Email checkbox default checked
- [ ] "Create Booking" button works
- [ ] After creation, modal closes and shows success

**Navigation:**
- [ ] "Back" button works (goes to previous step)
- [ ] "Next" button disabled until step complete
- [ ] "Cancel" closes modal at any step
- [ ] Step indicator shows current step (1 of 5, 2 of 5, etc.)

**Integration:**
- [ ] Created booking appears in bookings list
- [ ] If email checked, confirmation sent
- [ ] Database wp_bookings has new record
- [ ] Customer created if new

## Expected Behavior

**Full Wizard Flow:**
```
Step 1: Select Customer (Alice Smith)
  ↓ Next
Step 2: Select Service (Haircut - 60 min - £50)
  ↓ Next
Step 3: Select Staff (Emma Thompson)
  ↓ Next
Step 4: Select Date (2026-02-15) + Time (14:00)
  ↓ Next
Step 5: Payment (Cash) + Amount (£50) + Send Email ✓
  ↓ Create Booking
Success! → Modal closes → Booking appears in list
```

## Notes

- Timeslots endpoint reuses existing `Datetime_Model` logic
- Service/staff/date/time selection updates bookingData ref
- Payment method determines if amount_paid field shows
- Complimentary and pay_on_arrival set amount to 0
- send_confirmation defaults to true
- Creating state prevents double-submission
- All validation happens on backend (API validates again)

## Troubleshooting

**No timeslots loading:**
- Check endpoint: `/dashboard/timeslots?date=2026-02-15&service_id=1&staff_id=1`
- Verify Datetime_Model class exists
- Check working hours exist for staff
- Verify staff is active

**Services/staff not loading:**
- Check `/services/list` endpoint
- Check `/staff/list` endpoint
- Verify is_active = 1 in database

**Booking creation fails:**
- Check payload in Network tab
- Verify all required fields present
- Check PHP error log
- Verify customer email is valid
```

---

## 🧪 COMPLETE TASK 5 TESTING PLAN

After implementing Part C, test the **complete booking creation flow**:

### **Full End-to-End Test:**

```
1. Go to /bookit-dashboard/app/bookings
2. Click "+ New Booking"
3. Step 1: Search "Alice" → Select Alice Smith → Next
4. Step 2: Click "Haircut" service → Next
5. Step 3: Click "Emma Thompson" → Next
6. Step 4: Select tomorrow's date → Click 14:00 time slot → Next
7. Step 5: 
   - Payment method: Cash
   - Amount: £50.00
   - Special requests: "Test booking from dashboard"
   - Email confirmation: ✓ Checked
   - Click "Create Booking"
8. Should see success message
9. Modal closes
10. New booking appears in bookings list
11. Check email was sent (if configured)
12. Verify in database:
    SELECT * FROM wp_bookings ORDER BY id DESC LIMIT 1;
```

---

**This is a BIG prompt! Take your time implementing and testing each step.** 

Let me know when Part C is complete! 🚀