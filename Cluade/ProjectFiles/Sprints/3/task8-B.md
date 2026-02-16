# 🎉 EXCELLENT! Part A Complete!

Now for the frontend categories management page.

---

# 📝 TASK 8 PART B: FRONTEND CATEGORIES PAGE

```markdown
# Task 8 Part B: Categories Management Frontend Interface

## Context
I'm building a WordPress booking plugin dashboard. Task 8 Part A (backend categories API) is complete and working. Now I need to create the frontend categories management page with list view, create/edit modal, delete confirmation with service count, and reordering.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views:
- `views/Services.vue` (Task 7)
- `views/Bookings.vue` (Task 4)
- `views/Dashboard.vue` (Task 3)

Backend endpoints (working):
- GET /dashboard/categories/list (with search, status filter, service count)
- GET /dashboard/categories/{id}
- POST /dashboard/categories/create
- PUT /dashboard/categories/{id}
- DELETE /dashboard/categories/{id}
- POST /dashboard/categories/reorder

## Requirements

### 1. Create Categories View

Create new file `dashboard/src/views/Categories.vue`:

```vue
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Service Categories</h1>
        <p class="text-sm text-gray-600 mt-1">Organize your services into categories</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
      >
        + New Category
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search categories..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="debouncedSearch"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            v-model="filters.status"
            @change="loadCategories"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Categories Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-600">Loading categories...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="categories.length === 0" class="text-center py-12">
        <span class="text-5xl">🏷️</span>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating your first category.</p>
        <button
          @click="openCreateModal"
          class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          + New Category
        </button>
      </div>

      <!-- Categories Table -->
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-3 py-3"></th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
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
              v-for="category in categories"
              :key="category.id"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'opacity-50': !category.is_active }"
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

              <!-- Category Name -->
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ category.name }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Order: {{ category.display_order }}
                </div>
              </td>

              <!-- Description -->
              <td class="px-6 py-4">
                <div v-if="category.description" class="text-sm text-gray-600 line-clamp-2">
                  {{ category.description }}
                </div>
                <span v-else class="text-xs text-gray-400">No description</span>
              </td>

              <!-- Service Count -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ category.service_count }} service{{ category.service_count !== 1 ? 's' : '' }}
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                  :class="category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'"
                >
                  {{ category.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditModal(category)"
                  class="text-primary-600 hover:text-primary-900 mr-3"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(category)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Form Modal -->
    <CategoryFormModal
      v-if="showFormModal"
      :category="editingCategory"
      @close="closeFormModal"
      @saved="handleCategorySaved"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-start mb-4">
          <span class="text-3xl mr-3">⚠️</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Delete Category</h3>
          </div>
        </div>
        
        <p class="text-sm text-gray-700 mb-4">
          Are you sure you want to delete <strong>{{ deletingCategory?.name }}</strong>?
        </p>

        <div v-if="deletingCategory?.service_count > 0" class="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
          <p class="text-sm text-amber-800">
            ⚠️ This category has <strong>{{ deletingCategory.service_count }} service(s)</strong> assigned to it. 
            These services will no longer be in this category after deletion.
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
            @click="deleteCategory"
            :disabled="deleting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleting ? 'Deleting...' : 'Delete Category' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import CategoryFormModal from '../components/CategoryFormModal.vue'

const api = useApi()

// State
const loading = ref(false)
const categories = ref([])

// Filters
const filters = ref({
  search: '',
  status: 'all'
})

// Modal state
const showFormModal = ref(false)
const editingCategory = ref(null)
const showDeleteModal = ref(false)
const deletingCategory = ref(null)
const deleting = ref(false)
const deleteError = ref('')

// Debounce timer
let searchTimeout = null

// Methods
const loadCategories = async () => {
  loading.value = true
  
  try {
    const params = new URLSearchParams({
      status: filters.value.status
    })
    
    if (filters.value.search) {
      params.append('search', filters.value.search)
    }
    
    const response = await api.get(`categories/list?${params.toString()}`)
    
    if (response.data.success) {
      categories.value = response.data.categories
    }
  } catch (err) {
    console.error('Error loading categories:', err)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadCategories()
  }, 500)
}

const openCreateModal = () => {
  editingCategory.value = null
  showFormModal.value = true
}

const openEditModal = (category) => {
  editingCategory.value = category
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingCategory.value = null
}

const handleCategorySaved = () => {
  closeFormModal()
  loadCategories()
}

const confirmDelete = (category) => {
  deletingCategory.value = category
  deleteError.value = ''
  showDeleteModal.value = true
}

const deleteCategory = async () => {
  if (!deletingCategory.value) return
  
  deleting.value = true
  deleteError.value = ''
  
  try {
    const response = await api.delete(`categories/${deletingCategory.value.id}`)
    
    if (response.data.success) {
      showDeleteModal.value = false
      loadCategories()
    } else {
      deleteError.value = response.data.message || 'Failed to delete category'
    }
  } catch (err) {
    console.error('Error deleting category:', err)
    deleteError.value = err.message || 'Failed to delete category'
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>
```

### 2. Create Category Form Modal Component

Create new file `dashboard/src/components/CategoryFormModal.vue`:

```vue
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Category' : 'Create New Category' }}
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
      <form @submit.prevent="saveCategory" class="px-6 py-6 space-y-4">
        <!-- Category Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Hair Services"
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
            placeholder="Describe this category..."
          ></textarea>
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
                Active
              </span>
            </label>
          </div>
        </div>

        <!-- Service Count (when editing) -->
        <div v-if="isEditing && category?.service_count > 0" class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm text-blue-800">
            ℹ️ This category is currently used by <strong>{{ category.service_count }} service(s)</strong>.
          </p>
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
          @click="saveCategory"
          :disabled="saving || !isValid"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category') }}
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
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

// State
const saving = ref(false)
const formData = ref({
  name: '',
  description: '',
  is_active: true,
  display_order: 0
})

// Computed
const isEditing = computed(() => !!props.category)

const isValid = computed(() => {
  return formData.value.name.trim() !== ''
})

// Watch for category prop changes (when editing)
watch(() => props.category, (category) => {
  if (category) {
    formData.value = {
      name: category.name || '',
      description: category.description || '',
      is_active: category.is_active ?? true,
      display_order: category.display_order || 0
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      is_active: true,
      display_order: 0
    }
  }
}, { immediate: true })

// Methods
const saveCategory = async () => {
  if (!isValid.value || saving.value) return

  saving.value = true

  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      is_active: formData.value.is_active,
      display_order: formData.value.display_order
    }

    let response
    if (isEditing.value) {
      response = await api.put(`categories/${props.category.id}`, payload)
    } else {
      response = await api.post('categories/create', payload)
    }

    if (response.data.success) {
      emit('saved', response.data.category)
    } else {
      throw new Error(response.data.message || 'Failed to save category')
    }
  } catch (err) {
    console.error('Error saving category:', err)
    
    // Show duplicate name error specifically
    if (err.response?.data?.code === 'duplicate_name') {
      alert('A category with this name already exists. Please choose a different name.')
    } else {
      alert(`Error: ${err.message}`)
    }
  } finally {
    saving.value = false
  }
}
</script>
```

### 3. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import Categories from '../views/Categories.vue'
```

**Add route:**
```javascript
{
  path: '/categories',
  name: 'Categories',
  component: Categories
}
```

### 4. Update Navigation

Update the navigation in your app to include Categories link (likely in `App.vue` or navigation component):

```vue
<router-link
  to="/categories"
  class="flex items-center px-4 py-2 text-sm font-medium rounded-lg"
  :class="$route.path === '/categories' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  Categories
</router-link>
```

## Testing

### Test 1: View Categories Page
1. Navigate to `/bookit-dashboard/app/categories`
2. Categories list loads ✓
3. Shows service count for each category ✓
4. Active/inactive status visible ✓

### Test 2: Search Categories
1. Type "hair" in search box
2. Wait 500ms (debounce)
3. List filters to matching categories ✓

### Test 3: Filter by Status
1. Select "Active" → Only active categories ✓
2. Select "Inactive" → Only inactive categories ✓
3. Select "All" → All categories ✓

### Test 4: Create Category
1. Click "+ New Category"
2. Modal opens ✓
3. Fill in:
   - Name: "Test Category"
   - Description: "Test description"
   - Active: checked
   - Display order: 5
4. Click "Create Category"
5. Modal closes, list refreshes ✓
6. New category appears in list ✓

### Test 5: Edit Category
1. Click "Edit" on a category
2. Modal opens with pre-filled data ✓
3. Shows service count info if has services ✓
4. Change name and description
5. Click "Update Category"
6. Modal closes, list refreshes ✓
7. Changes visible in list ✓

### Test 6: Duplicate Name Validation
1. Try creating category with existing name
2. Alert appears: "A category with this name already exists" ✓
3. Modal stays open ✓

### Test 7: Delete Category with Services
1. Click "Delete" on category with services
2. Confirmation modal shows service count warning ✓
3. Warning: "This category has X service(s)" ✓
4. Click "Delete Category"
5. Category deleted ✓
6. Success message mentions services ✓

### Test 8: Delete Category without Services
1. Click "Delete" on category with 0 services
2. No warning about services ✓
3. Click "Delete Category"
4. Category deleted ✓

### Test 9: Empty State
1. Delete all categories (or filter so none match)
2. Empty state appears ✓
3. Shows emoji and message ✓
4. "New Category" button present ✓

### Test 10: Form Validation
1. Open create modal
2. Leave name empty
3. "Create Category" button disabled ✓
4. Fill name
5. Button enabled ✓

## Notes

- Drag-and-drop reordering will be a future enhancement
- For now, use the display_order number input field
- Categories show in order of display_order, then name
- Search is debounced by 500ms
- Service count helps inform delete decisions
- Delete shows warning but allows deletion (removes from services)
- Empty states guide user to create first category
- Form validates required name field
- Duplicate name checking prevents conflicts
- Simple 2-column filter layout (search + status)
```

---

## ⏸️ AFTER PART B

**After implementing Part B:**

1. **Navigate to Categories page** (`/categories`)
2. **Test all 10 scenarios** above
3. **Create, edit, delete categories**
4. **Test filters and search**
5. **Verify service count displays**
6. **Test duplicate name validation**

**Then say:** "Part B complete, Task 8 finished!"

Then we'll commit Task 8! 🚀

---

**Apply this Part B prompt now!** This completes the Categories CRUD interface!