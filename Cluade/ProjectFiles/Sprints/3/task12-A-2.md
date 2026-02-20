# 🎉 AWESOME! Phase 1 Complete!

Great job! Now let's move to **Phase 2: Responsive Tables & Cards**. This will make your data displays work beautifully on mobile.

---

# 📝 PHASE 2: RESPONSIVE TABLES & CARDS

```markdown
# Task 12 Part A Phase 2: Responsive Tables & Cards

## Context
Phase 1 complete - mobile sidebar working. Now we need to make tables responsive. Tables don't work well on mobile (too wide, tiny text). Solution: Show tables as cards on mobile, tables on desktop.

## Strategy
- Desktop (768px+): Show full tables
- Mobile (< 768px): Show card layout instead

## Files to Update

We'll update pages with tables:
1. Today's Schedule
2. Bookings List
3. Staff List

---

## File 1: dashboard/src/views/TodaysSchedule.vue

### Step 1: Make Summary Cards Responsive

**Find the summary cards grid (around line 40-60):**
```vue
<div class="grid grid-cols-3 gap-6 mb-6">
```

**Replace with:**
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
```

**This changes:**
- Mobile: 1 column (cards stack)
- Tablet: 2 columns
- Desktop: 3 columns
- Smaller gaps on mobile

### Step 2: Make Bookings Table Responsive

**Find the bookings table section (around line 80-120). It should have something like:**
```vue
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <div class="px-6 py-4 border-b">
    <h2>Today's Bookings</h2>
  </div>
  <div class="overflow-x-auto">
    <table class="min-w-full">
      <thead>
        <tr>
          <th>Time</th>
          <th>Customer</th>
          <th>Service</th>
          <th>Staff</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="booking in todaysBookings" :key="booking.id">
          <!-- table cells -->
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Replace the entire table card with this responsive version:**

```vue
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Header -->
  <div class="px-4 lg:px-6 py-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">Today's Bookings</h2>
    <p class="text-sm text-gray-600 mt-1">{{ todaysBookings.length }} bookings scheduled</p>
  </div>

  <!-- Desktop Table View -->
  <div class="hidden md:block overflow-x-auto">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Time
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
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="booking in todaysBookings" :key="booking.id" class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {{ booking.start_time }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ booking.customer_name }}
          </td>
          <td class="px-6 py-4 text-sm text-gray-900">
            {{ booking.service_name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ booking.staff_name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusColor(booking.status)"
            >
              {{ booking.status }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
            <button
              @click="viewBooking(booking)"
              class="text-primary-600 hover:text-primary-900 mr-3"
            >
              View
            </button>
            <button
              @click="editBooking(booking)"
              class="text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Card View -->
  <div class="md:hidden divide-y divide-gray-200">
    <div
      v-for="booking in todaysBookings"
      :key="booking.id"
      class="p-4 hover:bg-gray-50"
    >
      <!-- Card Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <p class="text-base font-semibold text-gray-900">{{ booking.customer_name }}</p>
          <p class="text-sm text-gray-600 mt-0.5">{{ booking.service_name }}</p>
        </div>
        <span
          class="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2"
          :class="getStatusColor(booking.status)"
        >
          {{ booking.status }}
        </span>
      </div>

      <!-- Card Details -->
      <div class="space-y-2 text-sm text-gray-700">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">⏰</span>
          <span>{{ booking.start_time }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500">👤</span>
          <span>{{ booking.staff_name }}</span>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          @click="viewBooking(booking)"
          class="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
        >
          View
        </button>
        <button
          @click="editBooking(booking)"
          class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Edit
        </button>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-if="todaysBookings.length === 0" class="p-8 text-center">
    <p class="text-gray-500 text-sm">No bookings scheduled for today</p>
  </div>
</div>
```

**Key Changes:**
- Desktop: Full table with all columns
- Mobile: Card layout with essential info
- Icons in mobile view (⏰ 👤) for visual clarity
- Full-width action buttons on mobile
- Hover states for both views
- Empty state message

---

## File 2: dashboard/src/views/BookingsList.vue

### Step 1: Make Filters Stack on Mobile

**Find the filters section (around line 50-80):**
```vue
<div class="flex items-center gap-4 mb-6">
  <!-- filters -->
</div>
```

**Replace with:**
```vue
<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
  <!-- Date Filter -->
  <input
    type="date"
    v-model="filters.date"
    class="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  />

  <!-- Status Filter -->
  <select
    v-model="filters.status"
    class="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  >
    <option value="">All Statuses</option>
    <option value="pending">Pending</option>
    <option value="confirmed">Confirmed</option>
    <option value="completed">Completed</option>
    <option value="cancelled">Cancelled</option>
  </select>

  <!-- Search -->
  <input
    type="text"
    v-model="filters.search"
    placeholder="Search customer, service..."
    class="w-full sm:flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  />

  <!-- Clear Filters Button -->
  <button
    v-if="hasActiveFilters"
    @click="clearFilters"
    class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  >
    Clear
  </button>
</div>
```

### Step 2: Make Bookings Table Responsive

**Same approach as Today's Schedule. Find the bookings table and replace with:**

```vue
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Header -->
  <div class="px-4 lg:px-6 py-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">All Bookings</h2>
    <p class="text-sm text-gray-600 mt-1">{{ filteredBookings.length }} bookings found</p>
  </div>

  <!-- Desktop Table View -->
  <div class="hidden md:block overflow-x-auto">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="booking in filteredBookings" :key="booking.id" class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ formatDate(booking.booking_date) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {{ booking.start_time }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ booking.customer_name }}
          </td>
          <td class="px-6 py-4 text-sm text-gray-900">
            {{ booking.service_name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ booking.staff_name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusColor(booking.status)"
            >
              {{ booking.status }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
            <button
              @click="editBooking(booking)"
              class="text-primary-600 hover:text-primary-900 mr-3"
            >
              Edit
            </button>
            <button
              @click="deleteBooking(booking)"
              class="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Card View -->
  <div class="md:hidden divide-y divide-gray-200">
    <div
      v-for="booking in filteredBookings"
      :key="booking.id"
      class="p-4 hover:bg-gray-50"
    >
      <!-- Card Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <p class="text-base font-semibold text-gray-900">{{ booking.customer_name }}</p>
          <p class="text-sm text-gray-600 mt-0.5">{{ booking.service_name }}</p>
        </div>
        <span
          class="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2"
          :class="getStatusColor(booking.status)"
        >
          {{ booking.status }}
        </span>
      </div>

      <!-- Card Details -->
      <div class="space-y-2 text-sm text-gray-700">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">📅</span>
          <span>{{ formatDate(booking.booking_date) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500">⏰</span>
          <span>{{ booking.start_time }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500">👤</span>
          <span>{{ booking.staff_name }}</span>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          @click="editBooking(booking)"
          class="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
        >
          Edit
        </button>
        <button
          @click="deleteBooking(booking)"
          class="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-if="filteredBookings.length === 0" class="p-8 text-center">
    <p class="text-gray-500 text-sm">No bookings found</p>
    <p v-if="hasActiveFilters" class="text-gray-400 text-xs mt-1">
      Try adjusting your filters
    </p>
  </div>
</div>
```

---

## File 3: dashboard/src/views/Staff.vue

### Step 1: Make Action Buttons Responsive

**Find the header with "Add Staff" button (around line 40-50):**
```vue
<div class="flex items-center justify-between mb-6">
  <div>
    <h1>Staff Members</h1>
  </div>
  <button @click="openAddModal">Add Staff</button>
</div>
```

**Replace with:**
```vue
<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-6">
  <div>
    <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Staff Members</h1>
    <p class="text-sm text-gray-600 mt-1">{{ staffList.length }} staff members</p>
  </div>
  <button
    @click="openAddModal"
    class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
  >
    + Add Staff
  </button>
</div>
```

### Step 2: Make Staff Table/Grid Responsive

**Find the staff table/grid. Replace with:**

```vue
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Desktop Table View -->
  <div class="hidden md:block overflow-x-auto">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="member in staffList" :key="member.id" class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center gap-3">
              <!-- Avatar -->
              <img
                v-if="member.photo_url"
                :src="member.photo_url"
                :alt="member.full_name"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                :style="{ backgroundColor: getColorForInitials(member.full_name) }"
              >
                {{ getInitials(member.full_name) }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ member.full_name }}</p>
                <p v-if="member.title" class="text-xs text-gray-500">{{ member.title }}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ member.email }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ member.phone || '-' }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="member.role === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'"
            >
              {{ member.role }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
            <router-link
              :to="`/staff/${member.id}/hours`"
              class="text-green-600 hover:text-green-900"
            >
              Hours
            </router-link>
            <button
              @click="editStaff(member)"
              class="text-primary-600 hover:text-primary-900"
            >
              Edit
            </button>
            <button
              @click="deleteStaff(member)"
              class="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Card View -->
  <div class="md:hidden divide-y divide-gray-200">
    <div
      v-for="member in staffList"
      :key="member.id"
      class="p-4"
    >
      <!-- Card Header -->
      <div class="flex items-start gap-3 mb-3">
        <!-- Avatar -->
        <img
          v-if="member.photo_url"
          :src="member.photo_url"
          :alt="member.full_name"
          class="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div
          v-else
          class="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          :style="{ backgroundColor: getColorForInitials(member.full_name) }"
        >
          {{ getInitials(member.full_name) }}
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-base font-semibold text-gray-900">{{ member.full_name }}</p>
          <p v-if="member.title" class="text-sm text-gray-600">{{ member.title }}</p>
          <span
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full mt-1"
            :class="member.role === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'"
          >
            {{ member.role }}
          </span>
        </div>
      </div>

      <!-- Card Details -->
      <div class="space-y-1 text-sm text-gray-700 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">📧</span>
          <span class="truncate">{{ member.email }}</span>
        </div>
        <div v-if="member.phone" class="flex items-center gap-2">
          <span class="text-gray-500">📱</span>
          <span>{{ member.phone }}</span>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="flex gap-2">
        <router-link
          :to="`/staff/${member.id}/hours`"
          class="flex-1 px-3 py-2 text-sm font-medium text-center text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
        >
          Hours
        </router-link>
        <button
          @click="editStaff(member)"
          class="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
        >
          Edit
        </button>
        <button
          @click="deleteStaff(member)"
          class="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-if="staffList.length === 0" class="p-8 text-center">
    <p class="text-gray-500 text-sm">No staff members yet</p>
    <button
      @click="openAddModal"
      class="mt-3 text-sm text-primary-600 hover:text-primary-700"
    >
      Add your first staff member
    </button>
  </div>
</div>
```

---

## Testing

### Test 1: Today's Schedule - Desktop
1. View at desktop width (1024px+)
2. Summary cards in 3 columns ✓
3. Full table with all columns ✓
4. Table is readable ✓

### Test 2: Today's Schedule - Mobile
1. View at mobile width (375px)
2. Summary cards stack (1 column) ✓
3. Table shows as cards ✓
4. Each booking card has customer, service, time, staff ✓
5. Action buttons full width ✓
6. No horizontal scroll ✓

### Test 3: Bookings List - Filters Mobile
1. View filters on mobile
2. Filters stack vertically ✓
3. Each filter full width ✓
4. Date, status, search all accessible ✓
5. Clear button full width ✓

### Test 4: Bookings List - Table Mobile
1. View bookings on mobile
2. Cards instead of table ✓
3. Date, time, customer, service, staff visible ✓
4. Status badge in corner ✓
5. Edit/Delete buttons work ✓

### Test 5: Staff List - Mobile
1. View staff on mobile
2. Cards with avatars ✓
3. Name, title, role, email, phone ✓
4. Hours/Edit/Delete buttons ✓
5. All tappable (44px min) ✓

### Test 6: Tablet View (768px)
1. View at tablet width
2. Tables visible (not cards) ✓
3. 2-column grids where appropriate ✓
4. Good use of space ✓

### Test 7: Empty States
1. View pages with no data
2. Empty state message shows ✓
3. Helpful text displayed ✓
4. Call-to-action if appropriate ✓

### Test 8: Touch Targets
1. On mobile, tap all buttons
2. Easy to tap (not too small) ✓
3. No accidental taps ✓
4. Good spacing between buttons ✓

### Test 9: Responsive Transitions
1. Slowly resize browser
2. Smooth transition at 768px breakpoint ✓
3. No janky layout shifts ✓
4. Cards → table or table → cards smoothly ✓

### Test 10: All Data Visible
1. Check mobile cards have all important info ✓
2. Nothing cut off ✓
3. Text readable ✓
4. Status/role badges visible ✓

## Notes

- Breakpoint is `md:` (768px) for table vs cards
- Cards show on mobile/small tablets (< 768px)
- Tables show on larger tablets/desktop (≥ 768px)
- Icons (⏰ 📅 👤 📧 📱) add visual clarity on mobile
- Action buttons are full-width on mobile for easier tapping
- Empty states provide helpful guidance
- All touch targets meet 44x44px minimum
- Filters stack vertically on mobile for better usability
```

---

## ⏸️ AFTER APPLYING PHASE 2

1. **Apply the prompt** in Cursor
2. **Test all 10 scenarios** on different screen sizes
3. **Use Chrome DevTools** device emulation
4. **Test on real mobile device** if possible

**Then say:** "Phase 2 complete, tables are responsive!"

And I'll give you **Phase 3: Responsive Forms & Modals** 🚀

---

**Apply this Phase 2 prompt now!**