# 🎉 EXCELLENT! Part B Complete!

Now for the final piece: the staff form modal with service assignment, custom pricing, and photo upload.

---

# 📝 TASK 9 PART C: STAFF FORM MODAL

```markdown
# Task 9 Part C: Staff Form Modal with Service Assignment & Photo Upload

## Context
I'm building a WordPress booking plugin dashboard. Task 9 Parts A & B (backend API and staff list page) are complete and working. Now I need to create the staff form modal for creating and editing staff members, including service assignments with custom pricing and WordPress media photo upload.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing components:
- `components/ServiceFormModal.vue` (Task 7)
- `components/CategoryFormModal.vue` (Task 8)

Backend endpoints (working):
- GET /dashboard/staff/{id} (returns service_assignments array)
- POST /dashboard/staff/create
- PUT /dashboard/staff/{id}
- GET /dashboard/services/list?include_all=true (for service checkboxes)

## Requirements

### 1. Create Staff Form Modal Component

Create new file `dashboard/src/components/StaffFormModal.vue`:

```vue
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Edit Staff Member' : 'Add New Staff Member' }}
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
      <form @submit.prevent="saveStaff" class="px-6 py-6 space-y-6">
        <!-- Profile Photo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div class="flex items-center gap-4">
            <!-- Photo Preview -->
            <div class="flex-shrink-0">
              <img
                v-if="formData.photo_url"
                :src="formData.photo_url"
                alt="Profile photo"
                class="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
              <div
                v-else
                class="h-20 w-20 rounded-full flex items-center justify-center text-white font-semibold text-xl border-2 border-gray-200"
                :style="{ backgroundColor: getColorForInitials(formData.first_name + ' ' + formData.last_name) }"
              >
                {{ getInitials(formData.first_name + ' ' + formData.last_name) }}
              </div>
            </div>
            
            <!-- Upload Button -->
            <div class="flex-1">
              <button
                type="button"
                @click="openMediaLibrary"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {{ formData.photo_url ? 'Change Photo' : 'Upload Photo' }}
              </button>
              <button
                v-if="formData.photo_url"
                type="button"
                @click="formData.photo_url = ''"
                class="ml-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
              <p class="text-xs text-gray-500 mt-1">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        <!-- Name -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              v-model="formData.first_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="John"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              v-model="formData.last_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Doe"
            />
          </div>
        </div>

        <!-- Email and Password -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="john@example.com"
            />
          </div>
          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              v-model="formData.password"
              type="password"
              :required="!isEditing"
              minlength="8"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Min 8 characters"
            />
          </div>
        </div>

        <!-- Phone and Title -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="01234567890"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              v-model="formData.title"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Senior Stylist"
            />
          </div>
        </div>

        <!-- Bio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            v-model="formData.bio"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Brief description about this staff member..."
          ></textarea>
        </div>

        <!-- Service Assignments -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Service Assignments
          </label>
          <div class="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
            <div
              v-for="service in services"
              :key="service.id"
              class="p-3 hover:bg-gray-50"
            >
              <div class="flex items-start">
                <!-- Checkbox -->
                <div class="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    :value="service.id"
                    v-model="selectedServices"
                    @change="onServiceToggle(service)"
                    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </div>
                
                <!-- Service Info -->
                <div class="ml-3 flex-1">
                  <label class="text-sm font-medium text-gray-900">
                    {{ service.name }}
                  </label>
                  <p class="text-xs text-gray-500">
                    Base price: £{{ parseFloat(service.price).toFixed(2) }}
                  </p>
                  
                  <!-- Custom Price Input (shown when checked) -->
                  <div v-if="selectedServices.includes(service.id)" class="mt-2">
                    <label class="block text-xs text-gray-600 mb-1">
                      Custom Price (optional)
                    </label>
                    <div class="flex items-center gap-2">
                      <div class="relative flex-1">
                        <span class="absolute left-3 top-2 text-gray-500 text-sm">£</span>
                        <input
                          v-model.number="customPrices[service.id]"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty for base price"
                          class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <button
                        v-if="customPrices[service.id]"
                        type="button"
                        @click="customPrices[service.id] = null"
                        class="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Select services this staff member can provide. Set custom prices to override the base service price.
          </p>
        </div>

        <!-- Role, Status, and Display Order -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              v-model="formData.role"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
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

        <!-- Google Calendar ID (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Google Calendar ID (Optional)
          </label>
          <input
            v-model="formData.google_calendar_id"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="calendar@gmail.com"
          />
          <p class="text-xs text-gray-500 mt-1">
            For Google Calendar sync (future feature)
          </p>
        </div>

        <!-- Working Hours Info (when editing) -->
        <div v-if="isEditing && staffMember?.has_working_hours" class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm text-blue-800">
            ℹ️ Working hours are <strong>configured</strong>. 
            <span class="text-blue-600 underline cursor-pointer">Configure working hours</span> (Task 10)
          </p>
        </div>
        <div v-else-if="isEditing && !staffMember?.has_working_hours" class="bg-amber-50 border border-amber-200 rounded p-3">
          <p class="text-sm text-amber-800">
            ⚠️ Working hours are <strong>not configured</strong>. 
            This staff member won't appear in booking availability. 
            <span class="text-amber-600 underline cursor-pointer">Configure working hours</span> (Task 10)
          </p>
        </div>

        <!-- Bookings Info (when editing) -->
        <div v-if="isEditing && staffMember?.future_bookings_count > 0" class="bg-purple-50 border border-purple-200 rounded p-3">
          <p class="text-sm text-purple-800">
            📅 This staff member has <strong>{{ staffMember.future_bookings_count }} future booking(s)</strong>.
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
          @click="saveStaff"
          :disabled="saving || !isValid"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : (isEditing ? 'Update Staff Member' : 'Create Staff Member') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

const props = defineProps({
  staffMember: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

// State
const saving = ref(false)
const services = ref([])
const selectedServices = ref([])
const customPrices = ref({})

const formData = ref({
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  photo_url: '',
  bio: '',
  title: '',
  role: 'staff',
  google_calendar_id: '',
  is_active: true,
  display_order: 0
})

// Computed
const isEditing = computed(() => !!props.staffMember)

const isValid = computed(() => {
  const basicValid = formData.value.email &&
         formData.value.first_name &&
         formData.value.last_name &&
         formData.value.role
  
  if (isEditing.value) {
    return basicValid
  } else {
    return basicValid && formData.value.password && formData.value.password.length >= 8
  }
})

// Methods
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

const onServiceToggle = (service) => {
  if (!selectedServices.value.includes(service.id)) {
    // Service was unchecked, remove custom price
    delete customPrices.value[service.id]
  }
}

const openMediaLibrary = () => {
  // Check if WordPress media library is available
  if (typeof wp !== 'undefined' && wp.media) {
    const mediaFrame = wp.media({
      title: 'Select Profile Photo',
      button: {
        text: 'Use this photo'
      },
      multiple: false,
      library: {
        type: 'image'
      }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      formData.value.photo_url = attachment.url
    })

    mediaFrame.open()
  } else {
    alert('WordPress media library not available. Please enter image URL manually.')
  }
}

const getInitials = (fullName) => {
  if (!fullName || fullName.trim() === ' ') return '??'
  const names = fullName.trim().split(' ').filter(n => n)
  if (names.length === 0) return '??'
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

const getColorForInitials = (name) => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', 
    '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

const saveStaff = async () => {
  if (!isValid.value || saving.value) return

  saving.value = true

  try {
    // Build service_assignments array
    const service_assignments = selectedServices.value.map(serviceId => ({
      service_id: serviceId,
      custom_price: customPrices.value[serviceId] || null
    }))

    const payload = {
      email: formData.value.email,
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      phone: formData.value.phone,
      photo_url: formData.value.photo_url,
      bio: formData.value.bio,
      title: formData.value.title,
      role: formData.value.role,
      google_calendar_id: formData.value.google_calendar_id,
      is_active: formData.value.is_active,
      display_order: formData.value.display_order,
      service_assignments: service_assignments
    }

    // Add password only for create
    if (!isEditing.value) {
      payload.password = formData.value.password
    }

    let response
    if (isEditing.value) {
      response = await api.put(`staff/${props.staffMember.id}`, payload)
    } else {
      response = await api.post('staff/create', payload)
    }

    if (response.data.success) {
      emit('saved', response.data.staff)
    } else {
      throw new Error(response.data.message || 'Failed to save staff member')
    }
  } catch (err) {
    console.error('Error saving staff:', err)
    
    if (err.response?.data?.code === 'duplicate_email') {
      alert('A staff member with this email already exists. Please use a different email.')
    } else {
      alert(`Error: ${err.message}`)
    }
  } finally {
    saving.value = false
  }
}

// Watch for staff member prop changes (when editing)
watch(() => props.staffMember, async (member) => {
  if (member) {
    formData.value = {
      email: member.email || '',
      password: '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      phone: member.phone || '',
      photo_url: member.photo_url || '',
      bio: member.bio || '',
      title: member.title || '',
      role: member.role || 'staff',
      google_calendar_id: member.google_calendar_id || '',
      is_active: member.is_active ?? true,
      display_order: member.display_order || 0
    }
    
    // Load service assignments
    if (member.service_assignments) {
      selectedServices.value = member.service_assignments.map(a => a.service_id)
      customPrices.value = {}
      member.service_assignments.forEach(assignment => {
        if (assignment.custom_price) {
          customPrices.value[assignment.service_id] = assignment.custom_price
        }
      })
    }
  } else {
    // Reset for create
    formData.value = {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      photo_url: '',
      bio: '',
      title: '',
      role: 'staff',
      google_calendar_id: '',
      is_active: true,
      display_order: 0
    }
    selectedServices.value = []
    customPrices.value = {}
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  loadServices()
})
</script>
```

### 2. Update Staff.vue to Use the Modal

Update `dashboard/src/views/Staff.vue`:

**Add import:**
```javascript
import StaffFormModal from '../components/StaffFormModal.vue'
```

**Add modal state:**
```javascript
const showFormModal = ref(false)
const editingStaff = ref(null)
```

**Replace placeholder methods:**
```javascript
const openCreateModal = () => {
  editingStaff.value = null
  showFormModal.value = true
}

const openEditModal = (member) => {
  editingStaff.value = member
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingStaff.value = null
}

const handleStaffSaved = () => {
  closeFormModal()
  loadStaff()
}
```

**Add modal to template (before closing `</template>`):**
```vue
<!-- Staff Form Modal -->
<StaffFormModal
  v-if="showFormModal"
  :staff-member="editingStaff"
  @close="closeFormModal"
  @saved="handleStaffSaved"
/>
```

## Testing

### Test 1: Create Staff with Photo
1. Click "+ New Staff Member"
2. Fill in all fields
3. Click "Upload Photo"
4. WordPress media library opens ✓
5. Select image
6. Photo URL populated ✓
7. Preview shows image ✓
8. Fill in service assignments
9. Set custom price for one service
10. Click "Create Staff Member"
11. Success, staff created ✓

### Test 2: Create Staff without Photo
1. Create new staff
2. Don't upload photo
3. Preview shows colored initials ✓
4. Save successfully ✓

### Test 3: Service Assignments
1. Check 3 services
2. Set custom price for service 1: £40
3. Leave services 2 and 3 with base price
4. Save
5. Database shows 3 assignments ✓
6. Custom price saved for service 1 ✓

### Test 4: Edit Staff - Change Services
1. Edit existing staff
2. Service checkboxes pre-filled ✓
3. Custom prices pre-filled ✓
4. Uncheck service 1
5. Check new service 4
6. Save
7. Assignments updated ✓

### Test 5: Edit Staff - Change Photo
1. Edit staff with photo
2. Click "Change Photo"
3. Select new image
4. Click "Remove"
5. Photo cleared, initials shown ✓
6. Upload new photo
7. Save with new photo ✓

### Test 6: Password Field
1. Create mode: Password field visible and required ✓
2. Edit mode: Password field hidden ✓

### Test 7: Working Hours Info Box
1. Edit staff with configured working hours
2. Blue info box: "Working hours configured" ✓
3. Edit staff without working hours
4. Amber warning box: "Not configured" ✓

### Test 8: Future Bookings Info
1. Edit staff with future bookings
2. Purple info box shows count ✓

### Test 9: Duplicate Email Validation
1. Try creating staff with existing email
2. Alert: "Email already exists" ✓

### Test 10: Form Validation
1. Leave required fields empty
2. Save button disabled ✓
3. Fill required fields
4. Save button enabled ✓
5. Password must be 8+ characters ✓

### Test 11: Custom Price Clearing
1. Check service with custom price
2. Enter custom price: £45
3. Click "Clear" button
4. Price cleared ✓

## Notes

- WordPress media library integration for photo upload
- Fallback to colored initials if no photo
- Service assignments with expandable custom price inputs
- Custom prices optional (null = use base price)
- Password only required on create
- Email validation and duplicate checking
- Working hours status info boxes
- Future bookings warning
- Role dropdown (staff/admin)
- All profile fields from database
- Google Calendar ID for future integration
- Display order for sorting
- Active status toggle
```

---

## ⏸️ AFTER PART C

**After implementing Part C:**

1. **Create new staff member**
2. **Upload photo** (test WordPress media library)
3. **Assign services with custom pricing**
4. **Edit existing staff**
5. **Change photo**
6. **Update service assignments**
7. **Test all validation**

**Then say:** "Part C complete, Task 9 finished!"

Then we'll commit Task 9! 🚀

---

**Apply this Part C prompt now!** This completes the entire Staff CRUD interface!