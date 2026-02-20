# 🚀 PHASE B1: LOADING & EMPTY STATES

Let's create reusable components and apply them to the major pages. This will give immediate, visible improvement to the UX!

---

# 📝 CURSOR PROMPT: Loading & Empty State Components

```markdown
# Task 12 Part B Phase 1: Loading & Empty State Components

## Context
Responsive design complete. Now adding professional loading states (skeletons, spinners) and empty states with helpful messages to improve UX.

## What We're Building
1. **LoadingSpinner** - Reusable spinner component
2. **TableSkeleton** - Loading placeholder for tables
3. **CardSkeleton** - Loading placeholder for mobile cards
4. **EmptyState** - Reusable empty state component with icon, message, action

Then apply to major pages: BookingsList, TodaysSchedule, Staff, Services

---

## Step 1: Create Loading Spinner Component

**Create new file: `dashboard/src/components/LoadingSpinner.vue`**

```vue
<template>
  <div class="flex flex-col items-center justify-center" :class="containerClass">
    <div
      class="animate-spin rounded-full border-b-2"
      :class="[sizeClass, colorClass]"
    ></div>
    <p v-if="message" class="mt-3 text-sm text-gray-600">{{ message }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg'
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  message: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'primary' // 'primary', 'white'
  },
  fullHeight: {
    type: Boolean,
    default: false
  }
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  return sizes[props.size]
})

const colorClass = computed(() => {
  return props.color === 'white' 
    ? 'border-white' 
    : 'border-primary-600'
})

const containerClass = computed(() => {
  return props.fullHeight ? 'py-12' : 'py-6'
})
</script>
```

---

## Step 2: Create Table Skeleton Component

**Create new file: `dashboard/src/components/TableSkeleton.vue`**

```vue
<template>
  <div class="animate-pulse">
    <!-- Table Header -->
    <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div class="flex gap-4">
        <div v-for="i in columns" :key="i" class="h-4 bg-gray-300 rounded" :class="getColumnWidth(i)"></div>
      </div>
    </div>
    
    <!-- Table Rows -->
    <div v-for="i in rows" :key="i" class="px-6 py-4 border-b border-gray-200">
      <div class="flex gap-4 items-center">
        <div v-for="j in columns" :key="j" class="h-4 bg-gray-200 rounded" :class="getColumnWidth(j)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: {
    type: Number,
    default: 5
  },
  columns: {
    type: Number,
    default: 5
  }
})

// Vary widths for more realistic skeleton
const getColumnWidth = (index) => {
  const widths = ['flex-1', 'flex-1', 'w-32', 'w-24', 'w-20']
  return widths[index - 1] || 'flex-1'
}
</script>
```

---

## Step 3: Create Card Skeleton Component

**Create new file: `dashboard/src/components/CardSkeleton.vue`**

```vue
<template>
  <div class="animate-pulse bg-white border border-gray-200 rounded-lg p-4">
    <!-- Header -->
    <div class="flex items-start gap-3 mb-3">
      <div class="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-300 rounded w-3/4"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    <!-- Details -->
    <div class="space-y-2 mb-3">
      <div class="h-3 bg-gray-200 rounded w-full"></div>
      <div class="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 pt-3 border-t border-gray-100">
      <div class="h-8 bg-gray-200 rounded flex-1"></div>
      <div class="h-8 bg-gray-200 rounded flex-1"></div>
    </div>
  </div>
</template>
```

---

## Step 4: Create Empty State Component

**Create new file: `dashboard/src/components/EmptyState.vue`**

```vue
<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <!-- Icon -->
    <div class="w-16 h-16 mb-4 text-5xl">
      {{ icon }}
    </div>
    
    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p class="text-sm text-gray-600 text-center max-w-sm mb-6">
      {{ description }}
    </p>
    
    <!-- Action Button (optional) -->
    <slot name="action">
      <button
        v-if="actionText"
        @click="$emit('action')"
        class="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '📋'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])
</script>
```

---

## Step 5: Apply to BookingsList Page

**File: `dashboard/src/views/BookingsList.vue`**

**Add imports at the top of script:**

```javascript
import LoadingSpinner from '../components/LoadingSpinner.vue'
import TableSkeleton from '../components/TableSkeleton.vue'
import CardSkeleton from '../components/CardSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'
```

**Find where you render the bookings table/cards. Wrap with loading states:**

```vue
<template>
  <div class="p-4 lg:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Bookings</h1>
        <p class="text-sm text-gray-600 mt-1">Manage all appointments</p>
      </div>
      <button class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
        + New Booking
      </button>
    </div>

    <!-- Filters (your existing filters section) -->
    <div class="...">
      <!-- Your existing filters -->
    </div>

    <!-- Main Content Area -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Loading State -->
      <div v-if="loading">
        <!-- Desktop: Table Skeleton -->
        <div class="hidden md:block">
          <TableSkeleton :rows="8" :columns="6" />
        </div>
        
        <!-- Mobile: Card Skeletons -->
        <div class="md:hidden p-4 space-y-3">
          <CardSkeleton v-for="i in 5" :key="i" />
        </div>
      </div>

      <!-- Empty State (No Bookings) -->
      <EmptyState
        v-else-if="filteredBookings.length === 0 && !hasActiveFilters"
        icon="📅"
        title="No bookings yet"
        description="Bookings will appear here once customers start making appointments. Create your first booking to get started."
        action-text="+ Create First Booking"
        @action="$router.push('/bookings/new')"
      />

      <!-- Empty State (No Results) -->
      <EmptyState
        v-else-if="filteredBookings.length === 0 && hasActiveFilters"
        icon="🔍"
        title="No bookings found"
        description="No bookings match your current filters. Try adjusting your search criteria or clearing filters."
        action-text="Clear Filters"
        @action="clearFilters"
      />

      <!-- Actual Content (when loaded and has data) -->
      <div v-else>
        <!-- Your existing desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full">
            <!-- Your existing table -->
          </table>
        </div>

        <!-- Your existing mobile cards -->
        <div class="md:hidden divide-y divide-gray-200">
          <!-- Your existing cards -->
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## Step 6: Apply to Today's Schedule Page

**File: `dashboard/src/views/TodaysSchedule.vue`**

**Add imports:**

```javascript
import LoadingSpinner from '../components/LoadingSpinner.vue'
import CardSkeleton from '../components/CardSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'
```

**Update template:**

```vue
<template>
  <div class="p-4 lg:p-6">
    <h1 class="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Today's Schedule</h1>

    <!-- Loading State for Summary Cards -->
    <div v-if="loadingStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-white rounded-lg border border-gray-200 p-6">
        <div class="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Summary Cards (when loaded) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
      <!-- Your existing summary cards -->
    </div>

    <!-- Today's Bookings Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-4 lg:px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Today's Bookings</h2>
        <p class="text-sm text-gray-600 mt-1">{{ todaysBookings.length }} appointments scheduled</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-4">
        <div class="space-y-3">
          <CardSkeleton v-for="i in 5" :key="i" />
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="todaysBookings.length === 0"
        icon="🗓️"
        title="No bookings today"
        description="You have no appointments scheduled for today. Enjoy your free time or create a new booking."
        action-text="+ Create Booking"
        @action="$router.push('/bookings/new')"
      />

      <!-- Bookings Content (when loaded and has data) -->
      <div v-else>
        <!-- Your existing table/cards -->
      </div>
    </div>
  </div>
</template>
```

---

## Step 7: Apply to Staff Page

**File: `dashboard/src/views/Staff.vue`**

**Add imports:**

```javascript
import LoadingSpinner from '../components/LoadingSpinner.vue'
import CardSkeleton from '../components/CardSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'
```

**Update template:**

```vue
<template>
  <div class="p-4 lg:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
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

    <!-- Main Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Loading State -->
      <div v-if="loading" class="p-4">
        <div class="space-y-3">
          <CardSkeleton v-for="i in 6" :key="i" />
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="staffList.length === 0"
        icon="👥"
        title="No staff members yet"
        description="Add your first staff member to start managing your team and assigning bookings."
        action-text="+ Add First Staff Member"
        @action="openAddModal"
      />

      <!-- Staff Content (when loaded and has data) -->
      <div v-else>
        <!-- Your existing desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full">
            <!-- Your existing table -->
          </table>
        </div>

        <!-- Your existing mobile cards -->
        <div class="md:hidden divide-y divide-gray-200">
          <!-- Your existing cards -->
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## Step 8: Apply to Services Page

**File: `dashboard/src/views/Services.vue`**

**Add imports:**

```javascript
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
```

**Update template:**

```vue
<template>
  <div class="p-4 lg:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Services</h1>
        <p class="text-sm text-gray-600 mt-1">{{ services.length }} services available</p>
      </div>
      <button
        @click="openAddModal"
        class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
      >
        + Add Service
      </button>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      size="lg"
      message="Loading services..."
      full-height
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="services.length === 0"
      icon="💼"
      title="No services yet"
      description="Create your first service to start accepting bookings. Services define what you offer to customers."
      action-text="+ Add First Service"
      @action="openAddModal"
    />

    <!-- Services Grid (when loaded and has data) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Your existing service cards -->
    </div>
  </div>
</template>
```

---

## Step 9: Apply to Categories Page

**File: `dashboard/src/views/Categories.vue`**

**Add imports:**

```javascript
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
```

**Similar pattern as Services:**

```vue
<!-- Loading State -->
<LoadingSpinner
  v-if="loading"
  size="lg"
  message="Loading categories..."
  full-height
/>

<!-- Empty State -->
<EmptyState
  v-else-if="categories.length === 0"
  icon="📁"
  title="No categories yet"
  description="Organize your services by creating categories. This helps customers find what they're looking for."
  action-text="+ Add First Category"
  @action="openAddModal"
/>

<!-- Categories Content -->
<div v-else>
  <!-- Your existing content -->
</div>
```

---

## Testing Checklist

### Test 1: LoadingSpinner Component
1. View any page while loading
2. Spinner appears centered ✓
3. Optional message displays below spinner ✓
4. Spinner is animated (rotating) ✓
5. Different sizes work (sm, md, lg) ✓

### Test 2: TableSkeleton Component
1. Load BookingsList
2. See skeleton table on desktop ✓
3. Skeleton has realistic column widths ✓
4. Animated pulse effect ✓
5. Disappears when data loads ✓

### Test 3: CardSkeleton Component
1. Load BookingsList on mobile
2. See skeleton cards ✓
3. Skeleton matches final card layout ✓
4. Animated pulse effect ✓
5. Correct number of skeletons shown ✓

### Test 4: EmptyState Component
1. View page with no data (e.g., no bookings)
2. Empty state shows with icon ✓
3. Title and description clear ✓
4. Action button present ✓
5. Action button works ✓

### Test 5: BookingsList Loading
1. Refresh BookingsList
2. See table skeleton on desktop ✓
3. See card skeletons on mobile ✓
4. Loading state transitions smoothly to content ✓

### Test 6: BookingsList Empty States
1. When no bookings: See "No bookings yet" ✓
2. With filters but no results: See "No bookings found" ✓
3. Different action buttons for each state ✓
4. Action buttons work ✓

### Test 7: Today's Schedule Loading
1. Refresh page
2. See summary card skeletons ✓
3. See booking card skeletons ✓
4. Smooth transition to content ✓

### Test 8: Staff Empty State
1. View staff page with no staff
2. Empty state shows ✓
3. "Add First Staff Member" button works ✓
4. Icon appropriate (👥) ✓

### Test 9: Services Empty State
1. View services with no services
2. Empty state shows ✓
3. "Add First Service" button works ✓
4. Icon appropriate (💼) ✓

### Test 10: Mobile Responsive
1. View all loading states on mobile ✓
2. View all empty states on mobile ✓
3. Components adapt to screen size ✓
4. Text readable on small screens ✓

## Visual Improvements Summary

**Before:**
- ❌ Blank white screen while loading
- ❌ No indication data is loading
- ❌ Confusing empty pages with no guidance
- ❌ No call-to-action when empty

**After:**
- ✅ Animated skeleton screens while loading
- ✅ Clear loading indicators
- ✅ Helpful empty states with icons
- ✅ Clear calls-to-action
- ✅ Professional, polished appearance

## Notes

- All skeletons use `animate-pulse` utility from Tailwind
- Empty states are consistent across all pages
- Icons are emojis for simplicity (can be replaced with SVGs later)
- Action buttons in empty states trigger appropriate modals/routes
- Loading states match final content layout for smooth transitions
- Components are reusable across the entire dashboard
```

---

## ⏸️ AFTER APPLYING PHASE B1

1. **Create the 4 components** (LoadingSpinner, TableSkeleton, CardSkeleton, EmptyState)
2. **Apply to 5 pages** (BookingsList, TodaysSchedule, Staff, Services, Categories)
3. **Test all 10 scenarios**
4. **Verify smooth loading transitions**

**Then say:** "Phase B1 complete, loading and empty states look great!"

And I'll give you **Phase B2: Accessibility** (keyboard nav, ARIA labels, focus management) 🚀

---

**Apply this Phase B1 prompt now!**