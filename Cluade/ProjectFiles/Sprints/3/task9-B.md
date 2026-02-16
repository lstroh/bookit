# 🎉 EXCELLENT! Part A Complete!

Now let's build the frontend staff management page.

---

# 📝 TASK 9 PART B: FRONTEND STAFF PAGE

```markdown
# Task 9 Part B: Staff Management Frontend Interface

## Context
I'm building a WordPress booking plugin dashboard. Task 9 Part A (backend staff API) is complete and working. Now I need to create the frontend staff management page with list view, search/filters, and display of service assignments and working hours status.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views:
- `views/Services.vue` (Task 7)
- `views/Categories.vue` (Task 8)
- `views/Bookings.vue` (Task 4)

Backend endpoints (working):
- GET /dashboard/staff/list (with filters, service count, working hours status)
- GET /dashboard/staff/{id}
- POST /dashboard/staff/create
- PUT /dashboard/staff/{id}
- DELETE /dashboard/staff/{id}
- POST /dashboard/staff/reorder

## Requirements

### 1. Create Staff View

Create new file `dashboard/src/views/Staff.vue`:

```vue
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Staff Members</h1>
        <p class="text-sm text-gray-600 mt-1">Manage your team and their service assignments</p>
      </div>
      <button
        v-if="isAdmin"
        @click="openCreateModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
      >
        + New Staff Member
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search staff..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="debouncedSearch"
          />
        </div>

        <!-- Role Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            v-model="filters.role"
            @change="loadStaff"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            v-model="filters.status"
            @change="loadStaff"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <!-- Service Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <select
            v-model="filters.service_id"
            @change="loadStaff"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Services</option>
            <option
              v-for="service in services"
              :key="service.id"
              :value="service.id"
            >
              {{ service.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Staff Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-600">Loading staff...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="staff.length === 0" class="text-center py-12">
        <span class="text-5xl">👥</span>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by adding your first staff member.</p>
        <button
          v-if="isAdmin"
          @click="openCreateModal"
          class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          + New Staff Member
        </button>
        <p v-else class="mt-2 text-sm text-gray-500">
          Contact your administrator to add staff members.
        </p>
      </div>

      <!-- Staff Table -->
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-3 py-3"></th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Member
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Working Hours
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
            <tr
              v-for="member in staff"
              :key="member.id"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'opacity-50': !member.is_active }"
            >
              <!-- Drag Handle -->
              <td class="px-3 py-4">
                <button
                  v-if="isAdmin"
                  class="cursor-move text-gray-400 hover:text-gray-600"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </button>
              </td>

              <!-- Staff Member -->
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <!-- Photo or Initials -->
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      v-if="member.photo_url"
                      :src="member.photo_url"
                      :alt="member.full_name"
                      class="h-10 w-10 rounded-full object-cover"
                    />
                    <div
                      v-else
                      class="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      :style="{ backgroundColor: getColorForInitials(member.full_name) }"
                    >
                      {{ getInitials(member.full_name) }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ member.full_name }}
                    </div>
                    <div v-if="member.title" class="text-xs text-gray-500">
                      {{ member.title }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      Order: {{ member.display_order }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ member.email }}</div>
                <div v-if="member.phone" class="text-xs text-gray-500 mt-1">
                  {{ member.phone }}
                </div>
              </td>

              <!-- Role -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                  :class="member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'"
                >
                  {{ member.role === 'admin' ? 'Admin' : 'Staff' }}
                </span>
              </td>

              <!-- Services -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ member.service_count }} service{{ member.service_count !== 1 ? 's' : '' }}
                </div>
              </td>

              <!-- Working Hours -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="member.has_working_hours" class="flex items-center text-sm text-green-600">
                  <span class="mr-1">✓</span>
                  Configured
                </div>
                <div v-else class="flex items-center text-sm text-amber-600">
                  <span class="mr-1">⚠️</span>
                  Not configured
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                  :class="member.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'"
                >
                  {{ member.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <span v-if="!isAdmin" class="text-xs text-gray-400">View only</span>
                <template v-else>
                  <button
                    @click="openEditModal(member)"
                    class="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="confirmDelete(member)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-start mb-4">
          <span class="text-3xl mr-3">⚠️</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Delete Staff Member</h3>
          </div>
        </div>
        
        <p class="text-sm text-gray-700 mb-4">
          Are you sure you want to delete <strong>{{ deletingStaff?.full_name }}</strong>?
        </p>

        <div v-if="deletingStaff?.future_bookings_count > 0" class="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p class="text-sm text-red-800">
            ⚠️ This staff member has <strong>{{ deletingStaff.future_bookings_count }} future booking(s)</strong>. 
            Deletion is not allowed. Please reassign or cancel these bookings first, or deactivate the staff member instead.
          </p>
        </div>

        <div v-if="deleteError" class="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p class="text-sm text-red-800">{{ deleteError }}</p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="showDeleteModal = false; deleteError = ''"
            :disabled="deleting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            v-if="!deletingStaff?.future_bookings_count"
            @click="deleteStaff"
            :disabled="deleting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleting ? 'Deleting...' : 'Delete Staff Member' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// Check if current user is admin
const isAdmin = computed(() => {
  return window.BOOKIT_DASHBOARD?.staff?.role === 'admin'
})

// State
const loading = ref(false)
const staff = ref([])
const services = ref([])

// Filters
const filters = ref({
  search: '',
  role: 'all',
  status: 'all',
  service_id: ''
})

// Modal state
const showDeleteModal = ref(false)
const deletingStaff = ref(null)
const deleting = ref(false)
const deleteError = ref('')

// Debounce timer
let searchTimeout = null

// Methods
const loadStaff = async () => {
  loading.value = true
  
  try {
    const params = new URLSearchParams({
      role: filters.value.role,
      status: filters.value.status
    })
    
    if (filters.value.search) {
      params.append('search', filters.value.search)
    }
    
    if (filters.value.service_id) {
      params.append('service_id', filters.value.service_id)
    }
    
    const response = await api.get(`staff/list?${params.toString()}`)
    
    if (response.data.success) {
      staff.value = response.data.staff
    }
  } catch (err) {
    console.error('Error loading staff:', err)
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  try {
    const response = await api.get('services/list?include_all=true')
    if (response.data.success) {
      services.value = response.data.services
    }
  } catch (err) {
    console.error('Error loading services:', err)
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadStaff()
  }, 500)
}

const openCreateModal = () => {
  // Will be implemented in Part C
  alert('Create staff modal - will be implemented in Part C')
}

const openEditModal = (member) => {
  // Will be implemented in Part C
  alert(`Edit staff modal for ${member.full_name} - will be implemented in Part C`)
}

const confirmDelete = (member) => {
  deletingStaff.value = member
  deleteError.value = ''
  showDeleteModal.value = true
}

const deleteStaff = async () => {
  if (!deletingStaff.value) return
  
  deleting.value = true
  deleteError.value = ''
  
  try {
    const response = await api.delete(`staff/${deletingStaff.value.id}`)
    
    if (response.data.success) {
      showDeleteModal.value = false
      loadStaff()
    } else {
      deleteError.value = response.data.message || 'Failed to delete staff member'
    }
  } catch (err) {
    console.error('Error deleting staff:', err)
    deleteError.value = err.response?.data?.message || err.message || 'Failed to delete staff member'
  } finally {
    deleting.value = false
  }
}

const getInitials = (fullName) => {
  if (!fullName) return '??'
  const names = fullName.split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

const getColorForInitials = (name) => {
  // Generate consistent color based on name
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#6366F1', // indigo
    '#14B8A6', // teal
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Lifecycle
onMounted(() => {
  loadStaff()
  loadServices()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import Staff from '../views/Staff.vue'
```

**Add route:**
```javascript
{
  path: '/staff',
  name: 'Staff',
  component: Staff
}
```

### 3. Update Navigation

Add Staff link to your navigation:

```vue
<router-link
  to="/staff"
  class="flex items-center px-4 py-2 text-sm font-medium rounded-lg"
  :class="$route.path === '/staff' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  Staff
</router-link>
```

## Testing

### Test 1: View Staff Page
1. Navigate to `/bookit-dashboard/app/staff`
2. Staff list loads ✓
3. Shows all columns (photo/initials, name, contact, role, services, working hours, status) ✓
4. Service count displays ✓
5. Working hours status shows ✓

### Test 2: Photo Display
1. Staff with photo_url shows image ✓
2. Staff without photo shows colored circle with initials ✓
3. Initials are 2 letters (first + last name) ✓
4. Colors are consistent per name ✓

### Test 3: Working Hours Status
1. Staff with working hours: Green "✓ Configured" ✓
2. Staff without working hours: Amber "⚠️ Not configured" ✓

### Test 4: Search Staff
1. Type "emma" in search box
2. Wait 500ms (debounce)
3. List filters to matching staff ✓

### Test 5: Filter by Role
1. Select "Admin" → Only admins ✓
2. Select "Staff" → Only staff ✓
3. Select "All Roles" → All staff ✓

### Test 6: Filter by Status
1. Select "Active" → Only active ✓
2. Select "Inactive" → Only inactive ✓
3. Select "All" → All staff ✓

### Test 7: Filter by Service
1. Select service from dropdown
2. Only staff assigned to that service ✓

### Test 8: Delete Staff with Future Bookings
1. Click "Delete" on staff with future bookings
2. Modal shows warning ✓
3. Delete button hidden ✓
4. Must cancel modal ✓

### Test 9: Delete Staff without Bookings
1. Click "Delete" on staff without bookings
2. No warning shown ✓
3. Delete button visible ✓
4. Staff deleted ✓

### Test 10: Role-Based Permissions
**As Staff:**
1. No "+ New Staff Member" button ✓
2. No Edit/Delete buttons ✓
3. See "View only" in actions ✓

**As Admin:**
1. "+ New Staff Member" button visible ✓
2. Edit/Delete buttons visible ✓

### Test 11: Empty State
1. Filter to show no results
2. Empty state appears ✓
3. Admin sees create button ✓
4. Staff sees "contact administrator" message ✓

## Notes

- Photo fallback to colored initials with consistent colors
- Working hours status indicator (Task 10 will configure)
- Service count shows total assigned services
- Future bookings count prevents deletion
- Delete modal shows clear warning
- 4-column filter layout (search, role, status, service)
- Role badges: purple for admin, blue for staff
- Status badges: green for active, gray for inactive
- Admin-only actions hidden from staff users
- Drag handle placeholder (reordering not implemented yet)
- Part C will add the create/edit modal
```

---

## ⏸️ PAUSE AFTER PART B

**After implementing Part B:**

1. **Navigate to Staff page** (`/staff`)
2. **Test all 11 scenarios** above
3. **Check photo/initials display**
4. **Verify working hours status**
5. **Test all 4 filters**
6. **Check role-based permissions**

**Then say:** "Part B complete, ready for Part C"

I'll give you **Part C (Staff Form Modal with Service Assignment & Photo Upload)** next! 🚀

---

**Apply this Part B prompt now!** Let me know when it's done and tested!