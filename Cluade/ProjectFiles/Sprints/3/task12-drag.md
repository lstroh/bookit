# 🎯 PERFECT! Let me add Staff to the prompt

Here's the **UPDATED** prompt with all three pages:

---

# 📝 CURSOR PROMPT: Add Drag & Drop for Services, Categories, AND Staff

```markdown
# Add Drag & Drop for Services, Categories, and Staff (Complete Missing Parts)

## Context
Database columns exist ✓
Categories reorder API exists ✓
Staff reorder API exists ✓

**Missing:**
- Services reorder backend API
- Frontend drag & drop for Services page
- Frontend drag & drop for Categories page
- Frontend drag & drop for Staff page ⭐ NEW

## Part 1: Backend - Add Services Reorder API

### File: `includes/api/class-dashboard-bookings-api.php`

**Step 1: Add route in `register_routes()` method**

Find the section with other reorder routes (staff, categories) and add:

```php
// Reorder services.
register_rest_route(
    self::NAMESPACE,
    '/dashboard/services/reorder',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'reorder_services' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'services' => array(
                'required' => true,
                'type'     => 'array',
                'items'    => array(
                    'type'       => 'object',
                    'properties' => array(
                        'id'            => array( 'type' => 'integer' ),
                        'display_order' => array( 'type' => 'integer' ),
                    ),
                ),
            ),
        ),
    )
);
```

**Step 2: Add method (after the existing `reorder_staff` and `reorder_categories` methods)**

```php
/**
 * Reorder services.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function reorder_services( $request ) {
    global $wpdb;

    $services = $request->get_param( 'services' );

    if ( empty( $services ) ) {
        return new WP_Error(
            'invalid_data',
            'Services array is required.',
            array( 'status' => 400 )
        );
    }

    // Update display order for each service.
    foreach ( $services as $service_data ) {
        if ( ! isset( $service_data['id'] ) || ! isset( $service_data['display_order'] ) ) {
            continue;
        }

        $wpdb->update(
            $wpdb->prefix . 'bookings_services',
            array(
                'display_order' => (int) $service_data['display_order'],
                'updated_at'    => current_time( 'mysql' ),
            ),
            array( 'id' => (int) $service_data['id'] ),
            array( '%d', '%s' ),
            array( '%d' )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Services reordered successfully.',
        )
    );
}
```

**Step 3: Verify ORDER BY in services list method**

Find the method that loads services (likely `get_services_list()` or similar) and ensure it has:

```php
ORDER BY display_order ASC, id ASC
```

If not present, add it to the query.

---

## Part 2: Install Sortable.js

```bash
cd dashboard
npm install sortablejs
```

---

## Part 3: Frontend - Services Page Drag & Drop

### File: `dashboard/src/views/Services.vue`

**Step 1: Add import at top of `<script setup>`**

```javascript
import Sortable from 'sortablejs'
import { ref, onMounted, nextTick } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()
```

**Step 2: Add state and methods**

Add these after your existing state declarations:

```javascript
// Add sortable instance reference
let sortableInstance = null

// Initialize Sortable.js
const initServicesSortable = async () => {
  await nextTick()
  const container = document.getElementById('services-container')
  if (!container || sortableInstance) return

  sortableInstance = Sortable.create(container, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-40',
    chosenClass: 'border-primary-500',
    dragClass: 'opacity-0',
    onEnd: async (evt) => {
      await saveServicesOrder(container)
    }
  })
}

// Save new order to backend
const saveServicesOrder = async (container) => {
  const serviceElements = Array.from(container.children)
  const servicesData = serviceElements.map((el, index) => ({
    id: parseInt(el.dataset.serviceId),
    display_order: index
  }))

  try {
    await api.post('services/reorder', { services: servicesData })
    // Optional: show success toast
  } catch (err) {
    console.error('Failed to save order:', err)
    // Reload to restore correct order
    await loadServices()
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
    await initServicesSortable()
  }
}
```

**Step 3: Update onMounted**

Find your existing `onMounted` and add the sortable initialization:

```javascript
onMounted(async () => {
  await loadServices() // Your existing load method
  await initServicesSortable() // Add this line
})
```

**Step 4: Update template**

Find your services grid/list container and update it:

```vue
<!-- Find your services container (likely a div with v-for) -->
<!-- Update the container element to have an id -->
<div 
  id="services-container" 
  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
>
  <!-- Update each service card -->
  <div
    v-for="service in services"
    :key="service.id"
    :data-service-id="service.id"
    class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
  >
    <!-- Add drag handle at the start -->
    <div class="flex items-start gap-3">
      <!-- Drag Handle -->
      <button
        class="drag-handle p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <!-- Existing service content wrapper -->
      <div class="flex-1 min-w-0">
        <!-- Your existing service card content (name, price, duration, buttons, etc.) -->
        <h3 class="text-base font-semibold text-gray-900">{{ service.name }}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ service.duration_minutes }} min • £{{ service.price }}
        </p>
        
        <!-- Your existing action buttons -->
        <div class="flex gap-2 mt-3">
          <button @click="editService(service)" class="...">Edit</button>
          <button @click="deleteService(service)" class="...">Delete</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Part 4: Frontend - Categories Page Drag & Drop

### File: `dashboard/src/views/Categories.vue`

**Step 1: Add import at top**

```javascript
import Sortable from 'sortablejs'
import { ref, onMounted, nextTick } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()
```

**Step 2: Add state and methods**

```javascript
// Add sortable instance reference
let sortableInstance = null

// Initialize Sortable.js
const initCategoriesSortable = async () => {
  await nextTick()
  const container = document.getElementById('categories-container')
  if (!container || sortableInstance) return

  sortableInstance = Sortable.create(container, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-40',
    chosenClass: 'border-primary-500',
    dragClass: 'opacity-0',
    onEnd: async (evt) => {
      await saveCategoriesOrder(container)
    }
  })
}

// Save new order to backend
const saveCategoriesOrder = async (container) => {
  const categoryElements = Array.from(container.children)
  const categoriesData = categoryElements.map((el, index) => ({
    id: parseInt(el.dataset.categoryId),
    display_order: index
  }))

  try {
    await api.post('categories/reorder', { categories: categoriesData })
    // Optional: show success toast
  } catch (err) {
    console.error('Failed to save order:', err)
    // Reload to restore correct order
    await loadCategories()
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
    await initCategoriesSortable()
  }
}
```

**Step 3: Update onMounted**

```javascript
onMounted(async () => {
  await loadCategories() // Your existing load method
  await initCategoriesSortable() // Add this line
})
```

**Step 4: Update template**

```vue
<!-- Find your categories container -->
<div 
  id="categories-container" 
  class="space-y-3"
>
  <!-- Update each category row -->
  <div
    v-for="category in categories"
    :key="category.id"
    :data-category-id="category.id"
    class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
  >
    <div class="flex items-center gap-3">
      <!-- Drag Handle -->
      <button
        class="drag-handle p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <!-- Existing category content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
        <!-- Any other category info -->
      </div>

      <!-- Your existing action buttons -->
      <div class="flex gap-2">
        <button @click="editCategory(category)">Edit</button>
        <button @click="deleteCategory(category)">Delete</button>
      </div>
    </div>
  </div>
</div>
```

---

## Part 5: Frontend - Staff Page Drag & Drop ⭐ NEW

### File: `dashboard/src/views/Staff.vue`

**Step 1: Add import at top**

```javascript
import Sortable from 'sortablejs'
import { ref, onMounted, nextTick } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()
```

**Step 2: Add state and methods**

```javascript
// Add sortable instance reference
let sortableInstance = null

// Initialize Sortable.js for staff list
const initStaffSortable = async () => {
  await nextTick()
  
  // Try desktop table first
  let container = document.querySelector('#staff-table tbody')
  
  // If not found, try mobile cards container
  if (!container) {
    container = document.getElementById('staff-mobile-container')
  }
  
  if (!container || sortableInstance) return

  sortableInstance = Sortable.create(container, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-40',
    chosenClass: 'border-primary-500',
    dragClass: 'opacity-0',
    onEnd: async (evt) => {
      await saveStaffOrder(container)
    }
  })
}

// Save new order to backend
const saveStaffOrder = async (container) => {
  const staffElements = Array.from(container.children)
  const staffData = staffElements.map((el, index) => ({
    id: parseInt(el.dataset.staffId),
    display_order: index
  }))

  try {
    await api.post('staff/reorder', { staff: staffData })
    // Optional: show success toast
  } catch (err) {
    console.error('Failed to save order:', err)
    // Reload to restore correct order
    await loadStaff()
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
    await initStaffSortable()
  }
}
```

**Step 3: Update onMounted**

```javascript
onMounted(async () => {
  await loadStaff() // Your existing load method
  await initStaffSortable() // Add this line
})
```

**Step 4: Update template - Desktop Table**

Find your desktop staff table and update it:

```vue
<!-- Desktop Table View -->
<div class="hidden md:block overflow-x-auto">
  <table id="staff-table" class="min-w-full">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          <!-- Empty header for drag handle column -->
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr 
        v-for="member in staffList" 
        :key="member.id"
        :data-staff-id="member.id"
        class="hover:bg-gray-50"
      >
        <!-- Drag Handle Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <button
            class="drag-handle p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            type="button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </td>
        
        <!-- Your existing table cells -->
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
          <!-- Your existing action buttons -->
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
```

**Step 5: Update template - Mobile Cards**

```vue
<!-- Mobile Card View -->
<div id="staff-mobile-container" class="md:hidden divide-y divide-gray-200">
  <div
    v-for="member in staffList"
    :key="member.id"
    :data-staff-id="member.id"
    class="p-4"
  >
    <div class="flex items-start gap-3">
      <!-- Drag Handle -->
      <button
        class="drag-handle p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none mt-2"
        aria-label="Drag to reorder"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>
      
      <!-- Card Header -->
      <div class="flex-1 min-w-0">
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
  </div>
</div>
```

---

## Testing Checklist

### Test 1: Services Drag & Drop
1. Go to Services page
2. See drag handle (≡≡) on each service card ✓
3. Drag service by handle to new position ✓
4. Release - order saves automatically ✓
5. Refresh page ✓
6. Order persists ✓

### Test 2: Categories Drag & Drop
1. Go to Categories page
2. See drag handle on each category ✓
3. Drag category to reorder ✓
4. Order saves automatically ✓
5. Refresh - order persists ✓

### Test 3: Staff Drag & Drop - Desktop
1. Go to Staff page (desktop view)
2. See drag handle in first column of table ✓
3. Drag staff row to reorder ✓
4. Order saves automatically ✓
5. Refresh - order persists ✓

### Test 4: Staff Drag & Drop - Mobile
1. View Staff page on mobile
2. See drag handle on each card ✓
3. Touch and drag to reorder ✓
4. Order saves ✓
5. Refresh - persists ✓

### Test 5: Visual Feedback
1. Grab any drag handle
2. Cursor changes to grabbing ✓
3. Ghost element shows drag target ✓
4. Drop - smooth animation ✓

### Test 6: Error Handling
1. Disconnect internet
2. Try to reorder any list
3. Error logged to console ✓
4. List reloads to restore original order ✓

### Test 7: Backend Verification

**Test services reorder:**
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/reorder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD?.nonce || ''
  },
  credentials: 'include',
  body: JSON.stringify({
    services: [
      { id: 3, display_order: 0 },
      { id: 1, display_order: 1 },
      { id: 2, display_order: 2 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

### Test 8: Database Check

```sql
-- Check all three tables
SELECT id, name, display_order FROM wp_bookings_services ORDER BY display_order;
SELECT id, name, display_order FROM wp_bookings_categories ORDER BY display_order;
SELECT id, first_name, last_name, display_order FROM wp_bookings_staff ORDER BY display_order;
```

All should match visual order ✓

---

## Notes

**Pattern Consistency:**
- ✅ All three follow same backend pattern
- ✅ All three use same Sortable.js config
- ✅ All three auto-save on drop
- ✅ All three handle errors identically

**Staff Page Special:**
- Works on both desktop table AND mobile cards
- Detects which container is visible
- Same drag handle style across all three pages

**UX Features:**
- `cursor-grab` / `cursor-grabbing` visual feedback
- Ghost element shows drag target
- Smooth 150ms animations
- Touch-friendly (`touch-none` on handles)
- Admin-only (existing permission checks)

---

## Implementation Time Estimate

- Backend (services reorder): **15 minutes**
- Frontend (services page): **25 minutes**
- Frontend (categories page): **20 minutes**
- Frontend (staff page): **30 minutes** (table + cards)
- Testing: **30 minutes**

**Total: ~2 hours**
```

---

## ✅ THIS PROMPT NOW COVERS ALL THREE PAGES

**Services** ✓  
**Categories** ✓  
**Staff** ✓ (both desktop table and mobile cards)

---

## 🚀 APPLY NOW

1. **Install sortablejs:** `npm install sortablejs`
2. **Apply the prompt** in Cursor
3. **Test all three pages**
4. **Verify order persists**

**Then say:** "Drag & drop complete on all three pages! Sprint 3 100% done!" 🎉

---

**Ready to apply?**