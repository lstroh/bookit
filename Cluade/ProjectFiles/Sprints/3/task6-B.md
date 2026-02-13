# 🎉 EXCELLENT! Part A Complete!

The backend API is now working correctly. You can:
- ✅ Update bookings without rescheduling (status, payment, notes)
- ✅ Reschedule to different available times
- ✅ Still prevents conflicts with other bookings
- ✅ Excludes the booking being edited from conflict checks

---

## 📊 TASK 6 PROGRESS

```
✅ Part A: Backend API - COMPLETE
   - GET /dashboard/bookings/{id} (view details)
   - PUT /dashboard/bookings/{id} (update booking)
   - POST /dashboard/bookings/{id}/cancel (cancel with reason)
   - Database status ENUM updated (6 statuses)
   - Approval setting logic added
   - Availability check fixed (exclude current booking)

⏭️ Part B: Frontend Edit Modal - NEXT
   - BookingViewModal.vue component
   - Read-only view → Edit mode toggle
   - Pre-fill all fields from API
   - Service/Staff/DateTime selection (reuse Task 5)
   - Status dropdown, payment, notes
   - Cancel button with reason
   - Save changes
```

---

# 📝 PART B: FRONTEND EDIT MODAL (Cursor Prompt 2)

This will be a comprehensive prompt since we're building the complete view/edit modal:

```markdown
# Task 6 Part B: Edit Booking Frontend Modal

## Context
I'm building a WordPress booking plugin dashboard. Part A (backend API) is complete and working. Now I need to create a modal that opens when clicking a booking row, shows read-only details, and allows editing.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing components:
- BookingModal.vue (Task 5 - manual booking creation)
- CustomerSelector.vue (Task 5 - customer selection)
- Bookings.vue (Task 4 - bookings list)

Backend endpoints (already working):
- GET /dashboard/bookings/{id} - Get booking details
- PUT /dashboard/bookings/{id} - Update booking
- POST /dashboard/bookings/{id}/cancel - Cancel booking
- GET /dashboard/staff/by-service/{id} - Filtered staff
- GET /dashboard/timeslots - Available times

## Requirements

### 1. Create BookingViewModal Component

Create new file `dashboard/src/components/BookingViewModal.vue`:

```vue
<template>
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <!-- Modal Content -->
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ editMode ? 'Edit Booking' : 'Booking Details' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            Booking #{{ bookingId }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="!editMode && canEdit"
            @click="enableEditMode"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            Edit
          </button>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-6">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-2 text-sm text-gray-600">Loading booking details...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start">
            <span class="text-2xl mr-3">⚠️</span>
            <div>
              <h3 class="text-sm font-medium text-red-800">Error Loading Booking</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Booking Content -->
        <div v-else-if="booking" class="space-y-6">
          <!-- READ-ONLY VIEW -->
          <div v-if="!editMode">
            <!-- Customer Information -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-600">Name</label>
                  <p class="text-sm font-medium text-gray-900">{{ booking.customer_name }}</p>
                </div>
                <div>
                  <label class="text-xs text-gray-600">Email</label>
                  <p class="text-sm text-gray-900">{{ booking.customer_email }}</p>
                </div>
                <div v-if="booking.customer_phone">
                  <label class="text-xs text-gray-600">Phone</label>
                  <p class="text-sm text-gray-900">{{ booking.customer_phone }}</p>
                </div>
              </div>
            </div>

            <!-- Service & Staff -->
            <div class="grid grid-cols-2 gap-4">
              <div class="border border-gray-200 rounded-lg p-4">
                <label class="text-xs text-gray-600">Service</label>
                <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.service_name }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ booking.duration }} minutes</p>
              </div>
              <div class="border border-gray-200 rounded-lg p-4">
                <label class="text-xs text-gray-600">Staff Member</label>
                <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.staff_name }}</p>
              </div>
            </div>

            <!-- Date & Time -->
            <div class="border border-gray-200 rounded-lg p-4">
              <label class="text-xs text-gray-600">Appointment</label>
              <p class="text-base font-semibold text-gray-900 mt-1">
                {{ formatDate(booking.booking_date) }} at {{ booking.start_time }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ booking.start_time }} - {{ booking.end_time }} ({{ booking.duration }} min)
              </p>
            </div>

            <!-- Status & Payment -->
            <div class="grid grid-cols-2 gap-4">
              <div class="border border-gray-200 rounded-lg p-4">
                <label class="text-xs text-gray-600">Status</label>
                <div class="mt-2">
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusClass(booking.status)"
                  >
                    {{ formatStatus(booking.status) }}
                  </span>
                </div>
              </div>
              <div class="border border-gray-200 rounded-lg p-4">
                <label class="text-xs text-gray-600">Payment</label>
                <p class="text-sm font-medium text-gray-900 mt-1">
                  £{{ parseFloat(booking.total_price).toFixed(2) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ getPaymentLabel(booking) }}
                </p>
              </div>
            </div>

            <!-- Special Requests -->
            <div v-if="booking.special_requests" class="border border-gray-200 rounded-lg p-4">
              <label class="text-xs text-gray-600">Special Requests</label>
              <p class="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{{ booking.special_requests }}</p>
            </div>

            <!-- Staff Notes -->
            <div v-if="booking.staff_notes" class="border border-gray-200 rounded-lg p-4 bg-yellow-50">
              <label class="text-xs text-gray-600">Staff Notes</label>
              <p class="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{{ booking.staff_notes }}</p>
            </div>

            <!-- Metadata -->
            <div class="text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>Created: {{ formatDateTime(booking.created_at) }}</p>
              <p v-if="booking.updated_at">Updated: {{ formatDateTime(booking.updated_at) }}</p>
            </div>
          </div>

          <!-- EDIT MODE -->
          <div v-else class="space-y-4">
            <!-- Service Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Service *
              </label>
              <select
                v-model="editData.service_id"
                @change="onServiceChange"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select service...</option>
                <option 
                  v-for="service in services" 
                  :key="service.id" 
                  :value="service.id"
                >
                  {{ service.name }} - {{ service.duration }}min - £{{ formatPrice(service.price) }}
                </option>
              </select>
            </div>

            <!-- Staff Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Staff Member *
              </label>
              <div v-if="loadingStaff" class="text-sm text-gray-500">
                Loading staff...
              </div>
              <select
                v-else
                v-model="editData.staff_id"
                @change="onStaffChange"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select staff...</option>
                <option 
                  v-for="staff in staffList" 
                  :key="staff.id" 
                  :value="staff.id"
                >
                  {{ staff.name }}
                </option>
              </select>
            </div>

            <!-- Date & Time Selection -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  v-model="editData.booking_date"
                  type="date"
                  :min="minDate"
                  @change="onDateChange"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  v-model="editData.booking_time"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  :disabled="!editData.booking_date || loadingSlots"
                >
                  <option value="">
                    {{ loadingSlots ? 'Loading...' : 'Select time...' }}
                  </option>
                  <optgroup v-if="timeslots?.morning?.length > 0" label="Morning">
                    <option v-for="slot in timeslots.morning" :key="slot" :value="slot">
                      {{ slot }}
                    </option>
                  </optgroup>
                  <optgroup v-if="timeslots?.afternoon?.length > 0" label="Afternoon">
                    <option v-for="slot in timeslots.afternoon" :key="slot" :value="slot">
                      {{ slot }}
                    </option>
                  </optgroup>
                  <optgroup v-if="timeslots?.evening?.length > 0" label="Evening">
                    <option v-for="slot in timeslots.evening" :key="slot" :value="slot">
                      {{ slot }}
                    </option>
                  </optgroup>
                </select>
                <p v-if="timeslotsError" class="text-xs text-red-600 mt-1">
                  {{ timeslotsError }}
                </p>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                v-model="editData.status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="pending">Pending</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <!-- Payment Method & Amount -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  v-model="editData.payment_method"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="pay_on_arrival">Pay on Arrival</option>
                  <option value="cash">Cash (Paid)</option>
                  <option value="card_external">Card (Paid Outside)</option>
                  <option value="check">Check (Paid)</option>
                  <option value="complimentary">Complimentary</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    v-model.number="editData.amount_paid"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <!-- Special Requests -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                v-model="editData.special_requests"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any special requests..."
              ></textarea>
            </div>

            <!-- Staff Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Staff Notes (Internal)
              </label>
              <textarea
                v-model="editData.staff_notes"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-yellow-50"
                placeholder="Internal notes..."
              ></textarea>
            </div>

            <!-- Send Notification -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="editData.send_notification"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Send update notification to customer
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
        <div class="flex justify-between items-center">
          <!-- Cancel Booking Button (left side) -->
          <button
            v-if="!editMode && canEdit && booking?.status !== 'cancelled'"
            @click="showCancelModal = true"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Cancel Booking
          </button>
          <div v-else></div>

          <!-- Action Buttons (right side) -->
          <div class="flex gap-2">
            <button
              v-if="editMode"
              @click="cancelEdit"
              :disabled="saving"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              v-if="!editMode"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              v-if="editMode"
              @click="saveChanges"
              :disabled="saving || !canSave"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Booking Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
        
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Reason (optional)
          </label>
          <textarea
            v-model="cancellationReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Why is this booking being cancelled?"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="flex items-center">
            <input
              v-model="cancelSendNotification"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">
              Send cancellation notification to customer
            </span>
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="showCancelModal = false; cancellationReason = ''"
            :disabled="cancelling"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Keep Booking
          </button>
          <button
            @click="confirmCancel"
            :disabled="cancelling"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ cancelling ? 'Cancelling...' : 'Yes, Cancel Booking' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

const props = defineProps({
  bookingId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'updated', 'cancelled'])

// Get current user role
const currentUser = window.BOOKIT_DASHBOARD.staff

// State
const loading = ref(true)
const error = ref(null)
const booking = ref(null)
const editMode = ref(false)
const saving = ref(false)
const cancelling = ref(false)

// Services & Staff
const services = ref([])
const staffList = ref([])
const loadingStaff = ref(false)

// Timeslots
const timeslots = ref(null)
const loadingSlots = ref(false)
const timeslotsError = ref('')

// Edit data
const editData = ref({
  service_id: '',
  staff_id: '',
  booking_date: '',
  booking_time: '',
  status: '',
  payment_method: '',
  amount_paid: 0,
  special_requests: '',
  staff_notes: '',
  send_notification: true
})

// Cancel modal
const showCancelModal = ref(false)
const cancellationReason = ref('')
const cancelSendNotification = ref(true)

// Computed
const canEdit = computed(() => {
  if (!booking.value) return false
  
  // Admin can edit any booking
  if (currentUser.role === 'admin') return true
  
  // Staff can only edit their own bookings
  return currentUser.id === booking.value.staff_id
})

const canSave = computed(() => {
  return editData.value.service_id &&
         editData.value.staff_id &&
         editData.value.booking_date &&
         editData.value.booking_time &&
         editData.value.status &&
         editData.value.payment_method
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Methods
const loadBooking = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get(`/bookings/${props.bookingId}`)
    
    if (response.data.success) {
      booking.value = response.data.booking
    } else {
      throw new Error(response.data.message || 'Failed to load booking')
    }
  } catch (err) {
    console.error('Error loading booking:', err)
    error.value = err.message || 'Failed to load booking details'
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  try {
    const response = await api.get('/services/list')
    if (response.data.success) {
      services.value = response.data.services
    }
  } catch (err) {
    console.error('Error loading services:', err)
  }
}

const loadStaffForService = async (serviceId) => {
  if (!serviceId) return
  
  loadingStaff.value = true
  try {
    const response = await api.get(`/staff/by-service/${serviceId}`)
    if (response.data.success) {
      staffList.value = response.data.staff
    }
  } catch (err) {
    console.error('Error loading staff:', err)
    staffList.value = []
  } finally {
    loadingStaff.value = false
  }
}

const loadTimeslots = async () => {
  if (!editData.value.booking_date || !editData.value.service_id || !editData.value.staff_id) {
    return
  }

  loadingSlots.value = true
  timeslotsError.value = ''

  try {
    const params = new URLSearchParams({
      date: editData.value.booking_date,
      service_id: editData.value.service_id,
      staff_id: editData.value.staff_id
    })

    const response = await api.get(`timeslots?${params.toString()}`)

    if (response.data.success === false || response.data.available === false) {
      timeslotsError.value = response.data.message || 'No available times'
      timeslots.value = null
    } else {
      timeslots.value = response.data.slots
      timeslotsError.value = ''
    }
  } catch (err) {
    console.error('Error loading timeslots:', err)
    timeslotsError.value = err.message || 'Failed to load available times'
    timeslots.value = null
  } finally {
    loadingSlots.value = false
  }
}

const enableEditMode = () => {
  editMode.value = true
  
  // Populate edit data from current booking
  editData.value = {
    service_id: booking.value.service_id,
    staff_id: booking.value.staff_id,
    booking_date: booking.value.booking_date,
    booking_time: booking.value.start_time,
    status: booking.value.status,
    payment_method: booking.value.payment_method,
    amount_paid: parseFloat(booking.value.deposit_paid) || 0,
    special_requests: booking.value.special_requests || '',
    staff_notes: booking.value.staff_notes || '',
    send_notification: true
  }
  
  // Load services and staff
  loadServices()
  loadStaffForService(booking.value.service_id)
  loadTimeslots()
}

const cancelEdit = () => {
  editMode.value = false
  editData.value = {
    service_id: '',
    staff_id: '',
    booking_date: '',
    booking_time: '',
    status: '',
    payment_method: '',
    amount_paid: 0,
    special_requests: '',
    staff_notes: '',
    send_notification: true
  }
}

const onServiceChange = () => {
  // Reload staff when service changes
  loadStaffForService(editData.value.service_id)
  editData.value.staff_id = '' // Clear staff selection
  editData.value.booking_time = '' // Clear time selection
}

const onStaffChange = () => {
  // Reload timeslots when staff changes
  editData.value.booking_time = '' // Clear time selection
  loadTimeslots()
}

const onDateChange = () => {
  // Reload timeslots when date changes
  editData.value.booking_time = '' // Clear time selection
  loadTimeslots()
}

const saveChanges = async () => {
  if (!canSave.value || saving.value) return

  saving.value = true

  try {
    const payload = {
      service_id: editData.value.service_id,
      staff_id: editData.value.staff_id,
      booking_date: editData.value.booking_date,
      booking_time: editData.value.booking_time,
      status: editData.value.status,
      payment_method: editData.value.payment_method,
      amount_paid: editData.value.amount_paid,
      special_requests: editData.value.special_requests,
      staff_notes: editData.value.staff_notes,
      send_notification: editData.value.send_notification
    }

    const response = await api.put(`/bookings/${props.bookingId}`, payload)

    if (response.data.success) {
      emit('updated', response.data.booking)
      emit('close')
    } else {
      throw new Error(response.data.message || 'Failed to update booking')
    }
  } catch (err) {
    console.error('Error updating booking:', err)
    alert(`Error updating booking: ${err.message}`)
  } finally {
    saving.value = false
  }
}

const confirmCancel = async () => {
  cancelling.value = true

  try {
    const response = await api.post(`/bookings/${props.bookingId}/cancel`, {
      cancellation_reason: cancellationReason.value,
      send_notification: cancelSendNotification.value
    })

    if (response.data.success) {
      emit('cancelled', props.bookingId)
      emit('close')
    } else {
      throw new Error(response.data.message || 'Failed to cancel booking')
    }
  } catch (err) {
    console.error('Error cancelling booking:', err)
    alert(`Error cancelling booking: ${err.message}`)
  } finally {
    cancelling.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatStatus = (status) => {
  const labels = {
    'pending': 'Pending',
    'pending_payment': 'Pending Payment',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'no_show': 'No Show'
  }
  return labels[status] || status
}

const getStatusClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_payment': 'bg-orange-100 text-orange-800',
    'confirmed': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'no_show': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getPaymentLabel = (booking) => {
  if (booking.full_amount_paid) {
    return 'Paid in full'
  }
  if (booking.deposit_paid > 0) {
    return `£${booking.deposit_paid.toFixed(2)} paid, £${booking.balance_due.toFixed(2)} due`
  }
  if (booking.payment_method === 'pay_on_arrival') {
    return 'Pay on arrival'
  }
  return 'Unpaid'
}

const formatPrice = (price) => {
  const num = parseFloat(price)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

// Lifecycle
onMounted(() => {
  loadBooking()
})
</script>
```

### 2. Update Bookings.vue to Use New Modal

Update `dashboard/src/views/Bookings.vue`:

**Add import at top of script:**
```javascript
import BookingViewModal from '../components/BookingViewModal.vue'
```

**Add state for selected booking:**
```javascript
const selectedBookingId = ref(null)
const showViewModal = ref(false)
```

**Replace the `viewBooking` method:**
```javascript
const viewBooking = (booking) => {
  selectedBookingId.value = booking.id
  showViewModal.value = true
}
```

**Add modal refresh handlers:**
```javascript
const handleBookingUpdated = (updatedBooking) => {
  // Refresh bookings list
  loadBookings(pagination.value.current_page)
  showViewModal.value = false
}

const handleBookingCancelled = (bookingId) => {
  // Refresh bookings list
  loadBookings(pagination.value.current_page)
  showViewModal.value = false
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedBookingId.value = null
}
```

**Add modal to template (at the end, before closing `</template>`):**
```vue
<!-- Booking View/Edit Modal -->
<BookingViewModal
  v-if="showViewModal && selectedBookingId"
  :booking-id="selectedBookingId"
  @close="closeViewModal"
  @updated="handleBookingUpdated"
  @cancelled="handleBookingCancelled"
/>
```

## Testing

### Test 1: View Booking (Read-Only)
1. Go to bookings list
2. Click on a booking row
3. Modal opens showing booking details
4. All fields displayed correctly
5. "Edit" button visible (if you have permission)
6. "Cancel Booking" button visible (bottom-left)
7. "Close" button closes modal

### Test 2: Edit Booking
1. Click "Edit" button in view modal
2. All fields become editable
3. Service dropdown populated
4. Change service → staff list updates
5. Change staff → time slots update
6. Change date → time slots update
7. Modify status, payment, notes
8. Click "Save Changes"
9. Success → modal closes, list refreshes
10. Booking shows updated data

### Test 3: Cancel Booking
1. Click "Cancel Booking" (red button, bottom-left)
2. Cancel modal opens
3. Enter cancellation reason
4. Toggle email notification
5. Click "Yes, Cancel Booking"
6. Booking cancelled, list refreshes
7. Booking no longer appears in list (soft deleted)

### Test 4: Permission Checks
**As Staff:**
1. Click on another staff's booking
2. View opens (can see details)
3. NO "Edit" button (no permission)
4. NO "Cancel Booking" button

**As Admin:**
1. Click any booking
2. View opens
3. "Edit" button present
4. "Cancel Booking" button present

### Test 5: Validation
1. Edit booking
2. Clear required field (e.g., service)
3. "Save Changes" button disabled
4. Fill field again → button enabled

## Expected Behavior

**Read-Only View:**
- Clean, card-based layout
- Customer info in gray box
- Service/Staff in two columns
- Date/Time prominently displayed
- Status badge with color
- Payment summary
- Special requests and notes sections
- Metadata (created/updated timestamps)

**Edit Mode:**
- All fields editable (except customer)
- Service dropdown loads from API
- Staff filtered by selected service
- Date picker with min=today
- Time dropdown loads available slots
- Status dropdown (6 options)
- Payment method dropdown
- Amount paid number input
- Textareas for requests/notes
- Email notification checkbox

**Cancel Flow:**
- Separate modal overlay
- Reason textarea (optional)
- Email checkbox (default checked)
- Confirm/cancel buttons
- Sets status='cancelled' + deleted_at

## Notes

- Customer field is NOT editable (by design)
- Staff can only edit their own bookings
- Admin can edit/cancel any booking
- Availability check happens on save (backend)
- If time not available, shows error from API
- Email notifications are optional
- Cancellation adds reason to staff_notes
- Modal z-index 50, cancel modal z-index 60
- Responsive design (max-w-3xl)
- Sticky header and footer
```

---

## ⏸️ PAUSE AFTER PART B

**After implementing Part B:**

1. **Test viewing a booking** (click row, see details)
2. **Test editing** (click Edit, modify fields, save)
3. **Test cancelling** (click Cancel Booking, confirm)
4. **Test permissions** (staff can only edit their own)
5. **Verify list refreshes** after update/cancel

---

**Apply this Part B prompt and test thoroughly!** 🚀

Let me know when Part B is complete, then we can commit Task 6 and move to Task 7!