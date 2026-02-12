# 📝 PART B: VUE FRONTEND (Cursor Prompt 2)

Copy this into Cursor Composer:

```markdown
# Task 4 Part B: Bookings List Vue Component

## Context
I'm building a WordPress booking plugin dashboard using Vue 3. Part A (backend API) is complete and working. Now I need to create a comprehensive bookings list view with filtering, search, and pagination.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing files:
- API composable: `dashboard/src/composables/useApi.js`
- Placeholder view: `dashboard/src/views/Bookings.vue` (needs complete replacement)
- Today's view: `dashboard/src/views/Dashboard.vue` (reference for styling)

Backend endpoints (already working):
- `GET /wp-json/bookit/v1/dashboard/bookings` (with query params)
- `GET /wp-json/bookit/v1/dashboard/staff/list`
- `GET /wp-json/bookit/v1/dashboard/services/list`

## Requirements

### 1. Replace Bookings.vue Component

Replace the entire contents of `dashboard/src/views/Bookings.vue` with:

```vue
<template>
  <div>
    <!-- Header with Actions -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">All Bookings</h2>
        <p class="text-sm text-gray-600 mt-1">
          Manage all appointments
        </p>
      </div>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        @click="createBooking"
      >
        + New Booking
      </button>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Date From -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            v-model="filters.date_from"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="applyFilters"
          />
        </div>

        <!-- Date To -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            v-model="filters.date_to"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="applyFilters"
          />
        </div>

        <!-- Staff Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Staff Member
          </label>
          <select
            v-model="filters.staff_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="applyFilters"
          >
            <option value="">All Staff</option>
            <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
              {{ staff.name }}
            </option>
          </select>
        </div>

        <!-- Service Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <select
            v-model="filters.service_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="applyFilters"
          >
            <option value="">All Services</option>
            <option v-for="service in servicesList" :key="service.id" :value="service.id">
              {{ service.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="applyFilters"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mt-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by customer name or email..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="onSearchInput"
          />
          <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <button
            v-if="searchQuery || hasActiveFilters"
            @click="clearFilters"
            class="absolute right-3 top-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 bg-white rounded-lg shadow">
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
      <div class="text-6xl mb-4">📋</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No bookings found
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ hasActiveFilters ? 'Try adjusting your filters' : 'No bookings have been created yet' }}
      </p>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="text-sm text-primary-600 hover:text-primary-700 underline"
      >
        Clear filters
      </button>
    </div>

    <!-- Bookings Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="booking in bookings"
              :key="booking.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="viewBooking(booking)"
            >
              <!-- Date & Time -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatDate(booking.booking_date) }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ booking.start_time }} - {{ booking.end_time }}
                </div>
              </td>

              <!-- Customer -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ booking.customer_name }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ booking.customer_email }}
                </div>
              </td>

              <!-- Service -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ booking.service_name }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ booking.duration }} min
                </div>
              </td>

              <!-- Staff -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ booking.staff_name }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusClass(booking.status)"
                >
                  {{ formatStatus(booking.status) }}
                </span>
              </td>

              <!-- Amount -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  £{{ booking.total_price.toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ getPaymentLabel(booking) }}
                </div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click.stop="viewBooking(booking)"
                  class="text-primary-600 hover:text-primary-900"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <!-- Results Info -->
          <div class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{{ resultsStart }}</span>
            to
            <span class="font-medium">{{ resultsEnd }}</span>
            of
            <span class="font-medium">{{ pagination.total }}</span>
            bookings
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-2">
            <button
              @click="goToPage(1)"
              :disabled="!pagination.has_prev"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              « First
            </button>
            <button
              @click="goToPage(pagination.current_page - 1)"
              :disabled="!pagination.has_prev"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                class="px-3 py-2 text-sm font-medium rounded-lg"
                :class="page === pagination.current_page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToPage(pagination.current_page + 1)"
              :disabled="!pagination.has_next"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
            <button
              @click="goToPage(pagination.total_pages)"
              :disabled="!pagination.has_next"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// State
const loading = ref(true)
const error = ref(null)
const bookings = ref([])
const staffList = ref([])
const servicesList = ref([])
const searchQuery = ref('')
let searchTimeout = null

// Filters
const filters = ref({
  date_from: '',
  date_to: '',
  staff_id: '',
  service_id: '',
  status: '',
})

// Pagination
const pagination = ref({
  total: 0,
  per_page: 20,
  current_page: 1,
  total_pages: 1,
  has_next: false,
  has_prev: false,
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.date_from ||
         filters.value.date_to ||
         filters.value.staff_id ||
         filters.value.service_id ||
         filters.value.status ||
         searchQuery.value
})

const resultsStart = computed(() => {
  if (bookings.value.length === 0) return 0
  return ((pagination.value.current_page - 1) * pagination.value.per_page) + 1
})

const resultsEnd = computed(() => {
  const end = pagination.value.current_page * pagination.value.per_page
  return Math.min(end, pagination.value.total)
})

const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const total = pagination.value.total_pages
  const pages = []
  
  // Always show first page
  if (total > 0) pages.push(1)
  
  // Show pages around current
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    if (!pages.includes(i)) pages.push(i)
  }
  
  // Always show last page
  if (total > 1 && !pages.includes(total)) pages.push(total)
  
  return pages
})

// Methods
const loadBookings = async (page = 1) => {
  loading.value = true
  error.value = null
  
  try {
    // Build query params
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: pagination.value.per_page.toString(),
    })
    
    if (filters.value.date_from) params.append('date_from', filters.value.date_from)
    if (filters.value.date_to) params.append('date_to', filters.value.date_to)
    if (filters.value.staff_id) params.append('staff_id', filters.value.staff_id)
    if (filters.value.service_id) params.append('service_id', filters.value.service_id)
    if (filters.value.status) params.append('status', filters.value.status)
    if (searchQuery.value) params.append('search', searchQuery.value)
    
    const response = await api.get(`/bookings?${params.toString()}`)
    
    if (response.data.success) {
      bookings.value = response.data.bookings
      pagination.value = response.data.pagination
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

const loadFilterData = async () => {
  try {
    // Load staff list
    const staffResponse = await api.get('/staff/list')
    if (staffResponse.data.success) {
      staffList.value = staffResponse.data.staff
    }
    
    // Load services list
    const servicesResponse = await api.get('/services/list')
    if (servicesResponse.data.success) {
      servicesList.value = servicesResponse.data.services
    }
  } catch (err) {
    console.error('Error loading filter data:', err)
  }
}

const applyFilters = () => {
  loadBookings(1) // Reset to page 1 when filters change
}

const onSearchInput = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadBookings(1)
  }, 500)
}

const clearFilters = () => {
  filters.value = {
    date_from: '',
    date_to: '',
    staff_id: '',
    service_id: '',
    status: '',
  }
  searchQuery.value = ''
  loadBookings(1)
}

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.total_pages) return
  loadBookings(page)
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewBooking = (booking) => {
  // TODO: Implement in Task 6 - Edit Booking Modal
  alert(
    `View Booking Details\n\n` +
    `ID: ${booking.id}\n` +
    `Customer: ${booking.customer_name}\n` +
    `Service: ${booking.service_name}\n` +
    `Date: ${formatDate(booking.booking_date)}\n` +
    `Time: ${booking.start_time}\n` +
    `Status: ${formatStatus(booking.status)}\n\n` +
    `Full booking details will be available in Task 6 (Edit Booking Modal)`
  )
}

const createBooking = () => {
  // TODO: Implement in Task 5 - Manual Booking Creation
  alert('Manual booking creation will be implemented in Task 5')
}

const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00') // Force local timezone
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
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
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_payment': 'bg-orange-100 text-orange-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'no_show': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getPaymentLabel = (booking) => {
  if (booking.full_amount_paid) {
    return 'Paid'
  }
  if (booking.deposit_paid > 0) {
    return `£${booking.balance_due.toFixed(2)} due`
  }
  if (booking.payment_method === 'pay_on_arrival') {
    return 'Pay on arrival'
  }
  return 'Unpaid'
}

// Lifecycle
onMounted(() => {
  loadFilterData()
  loadBookings()
})
</script>
```

## Implementation Steps

1. **Replace the entire Bookings.vue file** with the code above

2. **Test in browser:**
   - Dev server should auto-reload
   - Navigate to: http://plugin-test-1.local/bookit-dashboard/app/bookings
   - Should see full bookings table

3. **Test filters:**
   - Select different staff members
   - Select different services
   - Select different statuses
   - Change date range
   - Type in search box
   - Click "Clear All"

4. **Test pagination:**
   - Click "Next" button
   - Click page numbers
   - Click "First" and "Last"
   - Verify correct bookings show on each page

5. **Test interactions:**
   - Click on a booking row (should show alert)
   - Click "New Booking" button (should show alert)
   - Click "View" button (should show alert)

## Testing Checklist

Part B Frontend Testing:
- [ ] Bookings table displays all bookings
- [ ] Date range filter works (from/to)
- [ ] Staff filter dropdown populates with staff list
- [ ] Service filter dropdown populates with services list
- [ ] Status filter works (all statuses)
- [ ] Search works (type customer name)
- [ ] Search debounces (waits 500ms before searching)
- [ ] "Clear All" button resets all filters
- [ ] Pagination shows correct page numbers
- [ ] "First", "Prev", "Next", "Last" buttons work
- [ ] Results count is accurate ("Showing X to Y of Z")
- [ ] Clicking row shows booking details (alert)
- [ ] "New Booking" button shows placeholder alert
- [ ] Status badges have correct colors
- [ ] Payment status shows correctly
- [ ] Loading state shows briefly
- [ ] Empty state shows when no results
- [ ] Error state works (test by stopping dev server)
- [ ] Table is responsive (test on smaller screen)
- [ ] No console errors

## Expected Behavior

**Initial Load:**
- Shows all bookings (most recent first)
- All filter dropdowns populated
- Shows 20 bookings per page
- Pagination controls enabled if more than 20 bookings

**After Filtering:**
- Table updates immediately
- Resets to page 1
- Shows "Showing X to Y of Z" with filtered count
- "Clear All" button appears if any filter active

**Pagination:**
- Shows current page highlighted
- Disables "Prev" on first page
- Disables "Next" on last page
- Scrolls to top when changing pages

**Search:**
- Waits 500ms after typing stops
- Searches customer first name, last name, or email
- Case-insensitive partial match
- Resets to page 1

**Role-Based:**
- Admin sees all bookings and staff filter
- Staff sees only their bookings (no staff filter)

## Notes

- Table uses same status colors as Task 3 (Today's Schedule)
- Date format: "09 Feb 2026" (UK format)
- Time format: 24-hour (14:30)
- Search is debounced (500ms delay)
- Pagination shows max 7 page numbers
- "New Booking" placeholder for Task 5
- "View Booking" placeholder for Task 6
- Clicking row anywhere opens details
- Staff filter only shows for admin role

## Troubleshooting

**Table shows no bookings:**
- Check browser console for API errors
- Verify Part A API endpoints working
- Check if bookings exist in database beyond today

**Filters not working:**
- Check network tab for API calls
- Verify query parameters are being sent
- Check if dropdown lists are populated

**Search not working:**
- Type slowly and wait 500ms
- Check if debounce is working
- Verify search query is sent in API call

**Pagination broken:**
- Check `pagination` object in response
- Verify `total_pages` calculation
- Check if `current_page` updates

**Staff/Service dropdowns empty:**
- Check `/staff/list` endpoint response
- Check `/services/list` endpoint response
- Verify you have active staff and services

**Date picker not working:**
- Check browser supports `<input type="date">`
- Verify date format is YYYY-MM-DD
- Check if date filter is being sent to API
```

---

## 🧪 TESTING AFTER PART B

Once Cursor completes Part B:

### **Test 1: Visual Verification**
Navigate to: `http://plugin-test-1.local/bookit-dashboard/app/bookings`

**Should see:**
- ✅ Full bookings table with all columns
- ✅ Filter section at top (5 dropdowns + search)
- ✅ Pagination at bottom
- ✅ "New Booking" button (top right)

---

### **Test 2: Filter Each Dropdown**

**Staff Filter:**
```
1. Click "Staff Member" dropdown
2. Should see all your active staff (Admin, Emma, etc.)
3. Select "Emma Thompson"
4. Table should filter to only Emma's bookings
5. Select "All Staff" → shows all again
```

**Service Filter:**
```
1. Click "Service" dropdown
2. Should see all your active services
3. Select a service
4. Table filters to that service only
```

**Status Filter:**
```
1. Click "Status" dropdown
2. Should see all 6 statuses
3. Select "Confirmed"
4. Table shows only confirmed bookings
```

**Date Range:**
```
1. Click "From Date" → pick 2026-02-01
2. Click "To Date" → pick 2026-02-28
3. Table shows only February bookings
```

---

### **Test 3: Search Functionality**

```
1. Type "Alice" in search box
2. Wait 500ms
3. Should filter to bookings with customer name "Alice"
4. Type "example.com"
5. Should filter to customers with that email domain
```

---

### **Test 4: Pagination**

```
1. If you have < 20 bookings, create more test bookings first
2. Click "Next" → goes to page 2
3. Click page number "1" → back to page 1
4. Click "Last" → jumps to last page
5. Click "First" → back to page 1
6. Verify "Showing X to Y of Z" updates correctly
```

---

### **Test 5: Click Interactions**

```
1. Click anywhere on a booking row
2. Should show alert with booking details
3. Click "View" button in Actions column
4. Should also show alert
5. Click "+ New Booking" button (top right)
6. Should show "Task 5" placeholder alert
```

---

### **Test 6: Clear Filters**

```
1. Apply multiple filters (date + status + search)
2. Click "Clear All" button (top right of search box)
3. All filters should reset
4. Table shows all bookings again
```

---

### **Test 7: Role-Based Testing**

**As Admin:**
- ✅ Should see Staff filter dropdown
- ✅ Can filter by any staff member
- ✅ Sees all bookings

**As Staff (Emma):**
- ✅ Staff filter should still show (for consistency)
- ✅ But only shows Emma's bookings regardless
- ✅ Cannot see other staff's bookings

---

## 📝 TASK 4 COMPLETION CHECKLIST

Mark Task 4 complete when:

**Part A (Backend):**
- [x] `/dashboard/bookings` endpoint works
- [x] Filtering works (all parameters)
- [x] Pagination works
- [x] `/staff/list` endpoint works
- [x] `/services/list` endpoint works

**Part B (Frontend):**
- [ ] Bookings table displays all bookings
- [ ] All filter dropdowns work
- [ ] Search functionality works (with debounce)
- [ ] Pagination controls work
- [ ] "Clear All" resets filters
- [ ] Click row shows details (alert)
- [ ] "+ New Booking" button shows alert
- [ ] Status badges colored correctly
- [ ] Date format is UK standard
- [ ] Responsive on smaller screens
- [ ] No console errors

---

## 🎯 AFTER TASK 4 COMPLETE

Once both Part A and Part B are working:

1. **Test manually with both user roles**
2. **Take a screenshot** (optional - for your records)
3. **Commit to Git** (I'll provide commit message)
4. **Move to Task 5** (Manual Booking Creation)

---

**Start implementing Part B now!** Let me know when you're done testing! 🚀