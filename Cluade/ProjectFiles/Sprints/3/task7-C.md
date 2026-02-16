# 🎉 EXCELLENT! Part B Complete!

All backend API endpoints are working. Time for **Part C: Frontend Services Page**!

---

# 📝 TASK 7 PART C: FRONTEND SERVICES PAGE

This is a comprehensive prompt since we're building the complete services management UI.

```markdown
# Task 7 Part C: Services Management Frontend Interface

## Context
I'm building a WordPress booking plugin dashboard. Task 7 Parts A & B (backend API) are complete and working. Now I need to create the frontend services management page with list view, create/edit modals, delete confirmation, and drag-and-drop reordering.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views:
- `views/Dashboard.vue` (Today's Schedule)
- `views/Bookings.vue` (Bookings list)

Existing components:
- `components/BookingModal.vue` (Task 5)
- `components/BookingViewModal.vue` (Task 6)

Backend endpoints (working):
- GET /dashboard/services/list (with filters)
- GET /dashboard/services/{id}
- POST /dashboard/services/create
- PUT /dashboard/services/{id}
- DELETE /dashboard/services/{id}
- POST /dashboard/services/reorder

## Requirements

### 1. Create Services View

Create new file `dashboard/src/views/Services.vue`:

```vue
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Services</h1>
        <p class="text-sm text-gray-600 mt-1">Manage your service offerings</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
      >
        + New Service
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search services..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="debouncedSearch"
          />
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            v-model="filters.category_id"
            @change="loadServices"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
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
            @change="loadServices"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Services Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-600">Loading services...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="services.length === 0" class="text-center py-12">
        <span class="text-5xl">📋</span>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No services found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new service.</p>
        <button
          @click="openCreateModal"
          class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          + New Service
        </button>
      </div>

      <!-- Services Table -->
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-3 py-3"></th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categories
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deposit
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buffer
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
              v-for="service in services"
              :key="service.id"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'opacity-50': !service.is_active }"
            >
              <!-- Drag Handle -->
              <td class="px-3 py-4">
                <button
                  class="cursor-move text-gray-400 hover:text-gray-600"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </button>
              </td>

              <!-- Service Name -->
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ service.name }}
                </div>
                <div v-if="service.description" class="text-xs text-gray-500 mt-1 line-clamp-1">
                  {{ service.description }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Order: {{ service.display_order }}
                </div>
              </td>

              <!-- Categories -->
              <td class="px-6 py-4">
                <div v-if="service.categories && service.categories.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="category in service.categories"
                    :key="category.id"
                    class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800"
                  >
                    {{ category.name }}
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400">No categories</span>
              </td>

              <!-- Duration -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ service.duration }} min</div>
              </td>

              <!-- Price -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  £{{ parseFloat(service.price).toFixed(2) }}
                </div>
              </td>

              <!-- Deposit -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="service.deposit_amount" class="text-sm text-gray-900">
                  £{{ parseFloat(service.deposit_amount).toFixed(2) }}
                  <span class="text-xs text-gray-500">({{ service.deposit_type }})</span>
                </div>
                <span v-else class="text-xs text-gray-400">None</span>
              </td>

              <!-- Buffer -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-xs text-gray-600">
                  <div v-if="service.buffer_before > 0">Before: {{ service.buffer_before }}m</div>
                  <div v-if="service.buffer_after > 0">After: {{ service.buffer_after }}m</div>
                  <span v-if="service.buffer_before === 0 && service.buffer_after === 0" class="text-gray-400">
                    None
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                  :class="service.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'"
                >
                  {{ service.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditModal(service)"
                  class="text-primary-600 hover:text-primary-900 mr-3"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(service)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.total_pages > 1" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} 
            to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
            of {{ pagination.total }} services
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              class="px-3 py-1 text-sm border rounded"
              :class="page === pagination.current_page 
                ? 'bg-primary-600 text-white border-primary-600' 
                : 'border-gray-300 hover:bg-gray-50'"
            >
              {{ page }}
            </button>
            <button
              @click="changePage(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.total_pages"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Form Modal -->
    <ServiceFormModal
      v-if="showFormModal"
      :service="editingService"
      :categories="categories"
      @close="closeFormModal"
      @saved="handleServiceSaved"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-start mb-4">
          <span class="text-3xl mr-3">⚠️</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Delete Service</h3>
          </div>
        </div>
        
        <p class="text-sm text-gray-700 mb-6">
          Are you sure you want to delete <strong>{{ deletingService?.name }}</strong>? 
          This action cannot be undone.
        </p>

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
            @click="deleteService"
            :disabled="deleting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleting ? 'Deleting...' : 'Delete Service' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import ServiceFormModal from '../components/ServiceFormModal.vue'

const api = useApi()

// State
const loading = ref(false)
const services = ref([])
const categories = ref([])
const pagination = ref({
  total: 0,
  per_page: 50,
  current_page: 1,
  total_pages: 1
})

// Filters
const filters = ref({
  search: '',
  category_id: '',
  status: 'all'
})

// Modal state
const showFormModal = ref(false)
const editingService = ref(null)
const showDeleteModal = ref(false)
const deletingService = ref(null)
const deleting = ref(false)
const deleteError = ref('')

// Debounce timer
let searchTimeout = null

// Computed
const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const total = pagination.value.total_pages
  const pages = []
  
  // Show max 5 page numbers
  let start = Math.max(1, current - 2)
  let end = Math.min(total, start + 4)
  
  // Adjust start if we're near the end
  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadServices = async (page = 1) => {
  loading.value = true
  
  try {
    const params = new URLSearchParams({
      page: page,
      per_page: pagination.value.per_page,
      status: filters.value.status
    })
    
    if (filters.value.search) {
      params.append('search', filters.value.search)
    }
    
    if (filters.value.category_id) {
      params.append('category_id', filters.value.category_id)
    }
    
    const response = await api.get(`/services/list?${params.toString()}`)
    
    if (response.data.success) {
      services.value = response.data.services
      pagination.value = response.data.pagination
    }
  } catch (err) {
    console.error('Error loading services:', err)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await api.get('/categories/list')
    if (response.data.success) {
      categories.value = response.data.categories
    }
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadServices(1)
  }, 500)
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    loadServices(page)
  }
}

const openCreateModal = () => {
  editingService.value = null
  showFormModal.value = true
}

const openEditModal = (service) => {
  editingService.value = service
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingService.value = null
}

const handleServiceSaved = () => {
  closeFormModal()
  loadServices(pagination.value.current_page)
}

const confirmDelete = (service) => {
  deletingService.value = service
  deleteError.value = ''
  showDeleteModal.value = true
}

const deleteService = async () => {
  if (!deletingService.value) return
  
  deleting.value = true
  deleteError.value = ''
  
  try {
    const response = await api.delete(`/services/${deletingService.value.id}`)
    
    if (response.data.success) {
      showDeleteModal.value = false
      loadServices(pagination.value.current_page)
    } else {
      deleteError.value = response.data.message || 'Failed to delete service'
    }
  } catch (err) {
    console.error('Error deleting service:', err)
    deleteError.value = err.message || 'Failed to delete service'
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadServices()
  loadCategories()
})
</script>
```

### 2. Create Service Form Modal Component

Create new file `dashboard/src/components/ServiceFormModal.vue`:

```vue
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Service' : 'Create New Service' }}
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Body -->
      <form @submit.prevent="saveService" class="px-6 py-6 space-y-4">
        <!-- Service Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Service Name *
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Women's Haircut"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Describe the service..."
          ></textarea>
        </div>

        <!-- Duration and Price -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) *
            </label>
            <input
              v-model.number="formData.duration"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Price (£) *
            </label>
            <input
              v-model.number="formData.price"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Deposit -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Deposit Amount
            </label>
            <input
              v-model.number="formData.deposit_amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Deposit Type
            </label>
            <select
              v-model="formData.deposit_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="fixed">Fixed Amount (£)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
        </div>

        <!-- Buffer Times -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Buffer Before (minutes)
            </label>
            <input
              v-model.number="formData.buffer_before"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">Time to prepare before appointment</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Buffer After (minutes)
            </label>
            <input
              v-model.number="formData.buffer_after"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">Time to clean up after appointment</p>
          </div>
        </div>

        <!-- Categories -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <label
              v-for="category in categories"
              :key="category.id"
              class="flex items-center"
            >
              <input
                type="checkbox"
                :value="category.id"
                v-model="formData.category_ids"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1">Select one or more categories</p>
        </div>

        <!-- Display Order and Active Status -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              v-model.number="formData.display_order"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>
          <div class="flex items-end pb-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="formData.is_active"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">
                Active (visible to customers)
              </span>
            </label>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
        <button
          @click="$emit('close')"
          :disabled="saving"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          @click="saveService"
          :disabled="saving || !isValid"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

const props = defineProps({
  service: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'saved'])

// State
const saving = ref(false)
const formData = ref({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  deposit_amount: null,
  deposit_type: 'fixed',
  buffer_before: 0,
  buffer_after: 0,
  category_ids: [],
  is_active: true,
  display_order: 0
})

// Computed
const isEditing = computed(() => !!props.service)

const isValid = computed(() => {
  return formData.value.name.trim() !== '' &&
         formData.value.duration > 0 &&
         formData.value.price >= 0
})

// Watch for service prop changes (when editing)
watch(() => props.service, (service) => {
  if (service) {
    formData.value = {
      name: service.name || '',
      description: service.description || '',
      duration: service.duration || 60,
      price: parseFloat(service.price) || 0,
      deposit_amount: service.deposit_amount ? parseFloat(service.deposit_amount) : null,
      deposit_type: service.deposit_type || 'fixed',
      buffer_before: service.buffer_before || 0,
      buffer_after: service.buffer_after || 0,
      category_ids: service.category_ids || [],
      is_active: service.is_active ?? true,
      display_order: service.display_order || 0
    }
  }
}, { immediate: true })

// Methods
const saveService = async () => {
  if (!isValid.value || saving.value) return

  saving.value = true

  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      duration: formData.value.duration,
      price: formData.value.price,
      deposit_amount: formData.value.deposit_amount,
      deposit_type: formData.value.deposit_type,
      buffer_before: formData.value.buffer_before,
      buffer_after: formData.value.buffer_after,
      category_ids: formData.value.category_ids,
      is_active: formData.value.is_active,
      display_order: formData.value.display_order
    }

    let response
    if (isEditing.value) {
      response = await api.put(`/services/${props.service.id}`, payload)
    } else {
      response = await api.post('/services/create', payload)
    }

    if (response.data.success) {
      emit('saved', response.data.service)
    } else {
      throw new Error(response.data.message || 'Failed to save service')
    }
  } catch (err) {
    console.error('Error saving service:', err)
    alert(`Error: ${err.message}`)
  } finally {
    saving.value = false
  }
}
</script>
```

### 3. Add Categories List Endpoint

We need a categories endpoint for the dropdowns. Add to `includes/api/class-dashboard-bookings-api.php`:

**Add route:**
```php
// Get categories list
register_rest_route(
    self::NAMESPACE,
    '/dashboard/categories/list',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_categories_list' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

**Add method:**
```php
/**
 * Get categories list
 *
 * @return WP_REST_Response
 */
public function get_categories_list() {
    global $wpdb;

    $categories = $wpdb->get_results(
        "SELECT id, name, description 
        FROM {$wpdb->prefix}bookings_categories 
        WHERE deleted_at IS NULL 
        AND is_active = 1
        ORDER BY display_order ASC, name ASC",
        ARRAY_A
    );

    return rest_ensure_response(
        array(
            'success'    => true,
            'categories' => $categories,
        )
    );
}
```

### 4. Update Router

Update `dashboard/src/router/index.js` to add the Services route:

**Add import:**
```javascript
import Services from '../views/Services.vue'
```

**Add route:**
```javascript
{
  path: '/services',
  name: 'Services',
  component: Services
}
```

### 5. Update Navigation

Update the navigation in `dashboard/src/App.vue` or wherever your nav is to include Services link:

```vue
<router-link
  to="/services"
  class="flex items-center px-4 py-2 text-sm font-medium rounded-lg"
  :class="$route.path === '/services' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  Services
</router-link>
```

## Testing

### Test 1: View Services Page
1. Navigate to `/bookit-dashboard/app/services`
2. Services list loads ✓
3. All columns display correctly ✓
4. Categories shown as blue badges ✓
5. Active/inactive status visible ✓

### Test 2: Search Services
1. Type "haircut" in search box
2. Wait 500ms (debounce)
3. List filters to matching services ✓

### Test 3: Filter by Category
1. Select category from dropdown
2. Only services in that category show ✓

### Test 4: Filter by Status
1. Select "Active" → Only active services ✓
2. Select "Inactive" → Only inactive services ✓
3. Select "All" → All services ✓

### Test 5: Create Service
1. Click "+ New Service"
2. Modal opens ✓
3. Fill in all fields:
   - Name: "Test Service"
   - Description: "Test description"
   - Duration: 45
   - Price: 30.00
   - Deposit: 15.00 (percentage)
   - Buffer before: 10
   - Buffer after: 5
   - Check 2 categories
   - Active: checked
   - Display order: 5
4. Click "Create Service"
5. Modal closes, list refreshes ✓
6. New service appears in list ✓

### Test 6: Edit Service
1. Click "Edit" on a service
2. Modal opens with pre-filled data ✓
3. Change name and price
4. Uncheck one category
5. Click "Update Service"
6. Modal closes, list refreshes ✓
7. Changes visible in list ✓

### Test 7: Delete Service
1. Click "Delete" on a service without bookings
2. Confirmation modal appears ✓
3. Click "Delete Service"
4. Service removed from list ✓

### Test 8: Delete Service with Bookings
1. Click "Delete" on service with future bookings
2. Error message appears in modal ✓
3. Cannot delete ✓
4. Message suggests deactivating instead ✓

### Test 9: Pagination
1. If more than 50 services, pagination appears ✓
2. Click page 2 ✓
3. Shows next 50 services ✓
4. Page numbers update ✓

### Test 10: Form Validation
1. Open create modal
2. Leave name empty
3. "Create Service" button disabled ✓
4. Fill name
5. Button enabled ✓

## Notes

- Drag-and-drop reordering will be implemented in a future enhancement
- For now, use the display_order number input field
- Services show in order of display_order, then name
- Search is debounced by 500ms to avoid excessive API calls
- Pagination shows max 5 page numbers at a time
- Categories are loaded once on mount and used in filter + form
- Empty states guide user to create first service
- Delete checks for future bookings and prevents deletion
- Form validates required fields before allowing save
```

---

## ⏸️ PAUSE AFTER PART C

This is a BIG prompt! **After implementing Part C:**

1. **Navigate to Services page** (`/services`)
2. **Test all 10 scenarios** above
3. **Create, edit, delete services**
4. **Test filters and search**
5. **Verify categories work**

**Then say:** "Part C complete, Task 7 finished!"

Then we'll commit Task 7 and move to Task 8 or take a break! 🚀

---

**Apply this Part C prompt now!** This completes the entire Services CRUD interface!