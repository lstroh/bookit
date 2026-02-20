# 🎉 PERFECT! Part A Complete!

Now let's build the **Bulk Hours Management Page** where admins can easily manage working hours for multiple staff at once!

---

# 📝 TASK 11.5 PART B: BULK HOURS MANAGEMENT PAGE

```markdown
# Task 11.5 Part B: Bulk Hours Management Frontend Page

## Context
Task 11.5 Part A complete. Backend API ready:
- POST /dashboard/staff/bulk-hours/check-conflicts
- POST /dashboard/staff/bulk-hours/add-exception
- POST /dashboard/staff/bulk-hours/update-schedule

Now we need the frontend page where admins can:
- Select multiple staff with checkboxes
- Add same exception to selected staff
- Update schedule for selected staff
- See and resolve conflicts
- Preview changes before applying

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views for reference:
- `views/StaffHours.vue` (Task 10)
- `views/EmailTemplates.vue` (Task 11)

## Requirements

### 1. Create Bulk Hours Management View

Create new file `dashboard/src/views/BulkHours.vue`:

```vue
<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Bulk Working Hours</h1>
      <p class="text-sm text-gray-600 mt-1">
        Manage working hours for multiple staff members at once
      </p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="operationSuccess" class="mb-4 bg-green-50 border border-green-200 rounded p-3">
      <p class="text-sm text-green-800">✓ {{ operationSuccess }}</p>
    </div>
    <div v-if="operationError" class="mb-4 bg-red-50 border border-red-200 rounded p-3">
      <p class="text-sm text-red-800">{{ operationError }}</p>
    </div>

    <!-- Staff Selection Card -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Select Staff Members</h2>
            <p class="text-sm text-gray-500 mt-1">
              Choose which staff to apply bulk operations to
            </p>
          </div>
          <div class="text-sm text-gray-600">
            {{ selectedStaffIds.length }} selected
          </div>
        </div>
      </div>

      <div v-if="loadingStaff" class="px-6 py-8 text-center">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-600">Loading staff...</p>
      </div>

      <div v-else class="px-6 py-4">
        <!-- Select All -->
        <div class="mb-3 pb-3 border-b border-gray-200">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-900">
              Select All Staff ({{ staffList.length }})
            </span>
          </label>
        </div>

        <!-- Staff Checkboxes -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <label
            v-for="staff in staffList"
            :key="staff.id"
            class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            <input
              type="checkbox"
              :value="staff.id"
              v-model="selectedStaffIds"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div class="ml-2 flex items-center gap-2">
              <!-- Avatar -->
              <div
                v-if="staff.photo_url"
                class="w-8 h-8 rounded-full"
                :style="{ backgroundImage: `url(${staff.photo_url})`, backgroundSize: 'cover' }"
              ></div>
              <div
                v-else
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                :style="{ backgroundColor: getColorForInitials(staff.full_name) }"
              >
                {{ getInitials(staff.full_name) }}
              </div>
              <span class="text-sm text-gray-900">{{ staff.full_name }}</span>
            </div>
          </label>
        </div>

        <!-- No staff message -->
        <div v-if="staffList.length === 0" class="text-center py-6 text-gray-500 text-sm">
          No active staff members found.
        </div>
      </div>
    </div>

    <!-- Operation Selection -->
    <div v-if="selectedStaffIds.length > 0" class="space-y-6">
      <!-- Operations Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Bulk Operations</h2>
          <p class="text-sm text-gray-500 mt-1">
            Choose an operation to apply to {{ selectedStaffIds.length }} selected staff
          </p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Operation Type Selection -->
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="operationType = 'exception'"
              class="p-4 border-2 rounded-lg text-left transition-all"
              :class="operationType === 'exception'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="text-lg mb-1">📅</div>
              <div class="font-semibold text-gray-900">Add Date Exception</div>
              <div class="text-xs text-gray-600 mt-1">
                Set day off or special hours for a specific date
              </div>
            </button>

            <button
              @click="operationType = 'schedule'"
              class="p-4 border-2 rounded-lg text-left transition-all"
              :class="operationType === 'schedule'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="text-lg mb-1">🗓️</div>
              <div class="font-semibold text-gray-900">Update Weekly Schedule</div>
              <div class="text-xs text-gray-600 mt-1">
                Change regular hours or break times for a day of the week
              </div>
            </button>
          </div>

          <!-- Exception Form -->
          <div v-if="operationType === 'exception'" class="mt-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Date Exception Details</h3>
            
            <div class="space-y-4">
              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  v-model="exceptionForm.specific_date"
                  type="date"
                  :min="today"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <!-- Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Exception Type *
                </label>
                <select
                  v-model="exceptionForm.is_working"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option :value="false">Day Off</option>
                  <option :value="true">Special Hours</option>
                </select>
              </div>

              <!-- Times (if working) -->
              <div v-if="exceptionForm.is_working" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    v-model="exceptionForm.start_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    v-model="exceptionForm.end_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <!-- Break Times (if working) -->
              <div v-if="exceptionForm.is_working" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Break Start
                  </label>
                  <input
                    v-model="exceptionForm.break_start"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Break End
                  </label>
                  <input
                    v-model="exceptionForm.break_end"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  v-model="exceptionForm.notes"
                  type="text"
                  placeholder="e.g., Bank Holiday, Team Training"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <!-- Schedule Update Form -->
          <div v-if="operationType === 'schedule'" class="mt-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Schedule Update Details</h3>
            
            <div class="space-y-4">
              <!-- Day of Week -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week *
                </label>
                <select
                  v-model.number="scheduleForm.day_of_week"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option :value="1">Monday</option>
                  <option :value="2">Tuesday</option>
                  <option :value="3">Wednesday</option>
                  <option :value="4">Thursday</option>
                  <option :value="5">Friday</option>
                  <option :value="6">Saturday</option>
                  <option :value="7">Sunday</option>
                </select>
              </div>

              <!-- What to Update -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  What to Update
                </label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      v-model="updateFields.working_hours"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">Working Hours (Start/End Time)</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="updateFields.break_times"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">Break Times</span>
                  </label>
                </div>
              </div>

              <!-- Working Hours (if selected) -->
              <div v-if="updateFields.working_hours" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    v-model="scheduleForm.start_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    v-model="scheduleForm.end_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <!-- Break Times (if selected) -->
              <div v-if="updateFields.break_times" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Break Start
                  </label>
                  <input
                    v-model="scheduleForm.break_start"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Break End
                  </label>
                  <input
                    v-model="scheduleForm.break_end"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200">
            <button
              @click="previewChanges"
              :disabled="!canPreview"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Changes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="showPreview"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showPreview = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Preview Changes
            </h3>
            <button
              @click="showPreview = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <!-- Loading -->
          <div v-if="checkingConflicts" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-600">Checking for conflicts...</p>
          </div>

          <!-- Preview Content -->
          <div v-else>
            <!-- Summary -->
            <div class="mb-4 bg-blue-50 border border-blue-200 rounded p-4">
              <p class="text-sm font-medium text-blue-900 mb-2">
                {{ operationType === 'exception' ? 'Add Date Exception' : 'Update Weekly Schedule' }}
              </p>
              <div class="text-sm text-blue-800">
                <p v-if="operationType === 'exception'">
                  <strong>Date:</strong> {{ formatDate(exceptionForm.specific_date) }}<br>
                  <strong>Type:</strong> {{ exceptionForm.is_working ? 'Special Hours' : 'Day Off' }}<br>
                  <span v-if="exceptionForm.is_working">
                    <strong>Hours:</strong> {{ exceptionForm.start_time }} - {{ exceptionForm.end_time }}<br>
                  </span>
                  <span v-if="exceptionForm.notes">
                    <strong>Notes:</strong> {{ exceptionForm.notes }}
                  </span>
                </p>
                <p v-else>
                  <strong>Day:</strong> {{ getDayName(scheduleForm.day_of_week) }}<br>
                  <strong>Updates:</strong>
                  <span v-if="updateFields.working_hours">
                    {{ scheduleForm.start_time }} - {{ scheduleForm.end_time }}
                  </span>
                  <span v-if="updateFields.break_times">
                    {{ updateFields.working_hours ? ', ' : '' }}Break: {{ scheduleForm.break_start }} - {{ scheduleForm.break_end }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Conflicts -->
            <div v-if="conflicts.length > 0" class="mb-4">
              <h4 class="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Conflicts Detected ({{ conflicts.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="conflict in conflicts"
                  :key="conflict.staff_id"
                  class="bg-amber-50 border border-amber-200 rounded p-3"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-amber-900">
                        {{ conflict.staff_name }}
                      </p>
                      <p class="text-xs text-amber-700 mt-1">
                        Already has: {{ conflict.is_working ? 'Special Hours' : 'Day Off' }}
                        <span v-if="conflict.is_working">
                          ({{ conflict.start_time }} - {{ conflict.end_time }})
                        </span>
                        <span v-if="conflict.notes" class="block mt-1">
                          Note: "{{ conflict.notes }}"
                        </span>
                      </p>
                    </div>
                    <label class="flex items-center ml-3">
                      <input
                        type="checkbox"
                        :value="conflict.staff_id"
                        v-model="overwriteConflicts"
                        class="w-4 h-4 text-amber-600 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-xs text-amber-900 whitespace-nowrap">Overwrite</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Staff List -->
            <div>
              <h4 class="text-sm font-semibold text-gray-900 mb-2">
                Will be applied to {{ selectedStaffIds.length }} staff:
              </h4>
              <div class="bg-gray-50 border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="staffId in selectedStaffIds"
                    :key="staffId"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
                    :class="conflicts.some(c => c.staff_id === staffId) && !overwriteConflicts.includes(staffId)
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'"
                  >
                    {{ getStaffName(staffId) }}
                    <span v-if="conflicts.some(c => c.staff_id === staffId) && !overwriteConflicts.includes(staffId)" class="ml-1">
                      (will skip)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="showPreview = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="applyChanges"
            :disabled="applying"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ applying ? 'Applying...' : 'Apply Changes' }}
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

// State
const loadingStaff = ref(false)
const checkingConflicts = ref(false)
const applying = ref(false)
const staffList = ref([])
const selectedStaffIds = ref([])
const operationType = ref('exception') // 'exception' or 'schedule'
const showPreview = ref(false)
const conflicts = ref([])
const overwriteConflicts = ref([])
const operationSuccess = ref('')
const operationError = ref('')

const updateFields = ref({
  working_hours: false,
  break_times: false
})

const exceptionForm = ref({
  specific_date: '',
  is_working: false,
  start_time: '09:00',
  end_time: '17:00',
  break_start: '',
  break_end: '',
  notes: ''
})

const scheduleForm = ref({
  day_of_week: 1,
  start_time: '09:00',
  end_time: '17:00',
  break_start: '12:00',
  break_end: '13:00'
})

// Computed
const today = computed(() => new Date().toISOString().split('T')[0])

const allSelected = computed(() => {
  return staffList.value.length > 0 && selectedStaffIds.value.length === staffList.value.length
})

const canPreview = computed(() => {
  if (operationType.value === 'exception') {
    return exceptionForm.value.specific_date && selectedStaffIds.value.length > 0
  } else {
    return (updateFields.value.working_hours || updateFields.value.break_times) && selectedStaffIds.value.length > 0
  }
})

// Methods
const loadStaff = async () => {
  loadingStaff.value = true

  try {
    const response = await api.get('staff/list')

    if (response.data.success) {
      staffList.value = response.data.staff.filter(s => s.is_active)
    }
  } catch (err) {
    console.error('Error loading staff:', err)
  } finally {
    loadingStaff.value = false
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedStaffIds.value = []
  } else {
    selectedStaffIds.value = staffList.value.map(s => s.id)
  }
}

const previewChanges = async () => {
  if (!canPreview.value) return

  showPreview.value = true
  checkingConflicts.value = true
  conflicts.value = []
  overwriteConflicts.value = []

  try {
    if (operationType.value === 'exception') {
      const response = await api.post('staff/bulk-hours/check-conflicts', {
        staff_ids: selectedStaffIds.value,
        specific_date: exceptionForm.value.specific_date
      })

      if (response.data.success) {
        conflicts.value = response.data.conflicts
      }
    }
    // No conflict check needed for schedule updates (they update existing)
  } catch (err) {
    console.error('Error checking conflicts:', err)
  } finally {
    checkingConflicts.value = false
  }
}

const applyChanges = async () => {
  applying.value = true
  operationSuccess.value = ''
  operationError.value = ''

  try {
    if (operationType.value === 'exception') {
      const response = await api.post('staff/bulk-hours/add-exception', {
        staff_ids: selectedStaffIds.value,
        specific_date: exceptionForm.value.specific_date,
        is_working: exceptionForm.value.is_working,
        start_time: exceptionForm.value.start_time || null,
        end_time: exceptionForm.value.end_time || null,
        break_start: exceptionForm.value.break_start || null,
        break_end: exceptionForm.value.break_end || null,
        notes: exceptionForm.value.notes || null,
        overwrite_conflicts: overwriteConflicts.value
      })

      if (response.data.success) {
        operationSuccess.value = response.data.message
        showPreview.value = false
        resetForms()
        
        setTimeout(() => {
          operationSuccess.value = ''
        }, 5000)
      }
    } else {
      // Build updates object
      const updates = {}
      if (updateFields.value.working_hours) {
        updates.start_time = scheduleForm.value.start_time
        updates.end_time = scheduleForm.value.end_time
      }
      if (updateFields.value.break_times) {
        updates.break_start = scheduleForm.value.break_start
        updates.break_end = scheduleForm.value.break_end
      }

      const response = await api.post('staff/bulk-hours/update-schedule', {
        staff_ids: selectedStaffIds.value,
        day_of_week: scheduleForm.value.day_of_week,
        updates: updates
      })

      if (response.data.success) {
        operationSuccess.value = response.data.message
        showPreview.value = false
        resetForms()
        
        setTimeout(() => {
          operationSuccess.value = ''
        }, 5000)
      }
    }
  } catch (err) {
    console.error('Error applying changes:', err)
    operationError.value = err.response?.data?.message || err.message || 'Failed to apply changes'
  } finally {
    applying.value = false
  }
}

const resetForms = () => {
  selectedStaffIds.value = []
  exceptionForm.value = {
    specific_date: '',
    is_working: false,
    start_time: '09:00',
    end_time: '17:00',
    break_start: '',
    break_end: '',
    notes: ''
  }
  scheduleForm.value = {
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    break_start: '12:00',
    break_end: '13:00'
  }
  updateFields.value = {
    working_hours: false,
    break_times: false
  }
}

const getStaffName = (staffId) => {
  const staff = staffList.value.find(s => s.id === staffId)
  return staff ? staff.full_name : `Staff ${staffId}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getDayName = (dayNum) => {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[dayNum] || ''
}

const getInitials = (fullName) => {
  if (!fullName) return '??'
  const names = fullName.trim().split(' ').filter(n => n)
  if (names.length === 0) return '??'
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase()
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

// Lifecycle
onMounted(() => {
  loadStaff()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import BulkHours from '../views/BulkHours.vue'
```

**Add route:**
```javascript
{
  path: '/settings/bulk-hours',
  name: 'BulkHours',
  component: BulkHours,
  meta: { requiresAdmin: true }
}
```

### 3. Add Navigation Link

Update your settings sidebar navigation to include Bulk Hours:

```vue
<router-link
  to="/settings/bulk-hours"
  class="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
  :class="$route.path === '/settings/bulk-hours' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  <span class="text-lg">👥</span>
  <span>Bulk Working Hours</span>
</router-link>
```

## Testing

### Test 1: Load Page and Select Staff
1. Navigate to `/bookit-dashboard/app/settings/bulk-hours`
2. Page loads ✓
3. Staff list shown with checkboxes ✓
4. Avatar/initials displayed ✓
5. Select 3 staff members ✓
6. Counter shows "3 selected" ✓

### Test 2: Select All / Deselect All
1. Click "Select All Staff"
2. All checkboxes checked ✓
3. Counter shows correct total ✓
4. Click "Select All" again
5. All checkboxes unchecked ✓

### Test 3: Add Exception - Day Off
1. Select 2 staff
2. Choose "Add Date Exception"
3. Select date: 2026-12-25
4. Type: Day Off
5. Notes: "Christmas Day"
6. Click "Preview Changes"
7. Preview modal opens ✓
8. Shows 2 staff listed ✓
9. Shows date and type ✓
10. Click "Apply Changes"
11. Success message appears ✓

### Test 4: Add Exception - Special Hours
1. Select 2 staff
2. Choose "Add Date Exception"
3. Select date: 2026-12-24
4. Type: Special Hours
5. Times: 09:00 - 13:00
6. Notes: "Christmas Eve - half day"
7. Preview and apply ✓
8. Success message ✓

### Test 5: Conflict Detection
1. Manually add exception for staff 1 on 2026-04-18
2. Select staff 1 and 3
3. Try to add exception on 2026-04-18
4. Click "Preview Changes"
5. Conflict shown for staff 1 ✓
6. Shows existing exception details ✓
7. Checkbox to overwrite ✓

### Test 6: Skip Conflict
1. With conflict from Test 5
2. Don't check "Overwrite" for staff 1
3. Staff 1 badge shows "(will skip)" ✓
4. Click "Apply Changes"
5. Success message shows "1 skipped" ✓
6. Only staff 3 gets new exception ✓

### Test 7: Overwrite Conflict
1. With conflict from Test 5
2. Check "Overwrite" for staff 1 ✓
3. Staff 1 badge changes to blue ✓
4. Click "Apply Changes"
5. Success message shows "2 added, 0 skipped" ✓
6. Both staff get new exception ✓

### Test 8: Update Schedule - Break Time
1. Select 3 staff
2. Choose "Update Weekly Schedule"
3. Day: Monday
4. Check "Break Times"
5. Set: 13:00 - 14:00
6. Preview shows update details ✓
7. Apply changes ✓
8. Success message ✓

### Test 9: Update Schedule - Working Hours
1. Select 2 staff
2. Day: Friday
3. Check "Working Hours"
4. Set: 09:00 - 14:00
5. Preview and apply ✓
6. Verify in database ✓

### Test 10: Reset After Apply
1. Apply an exception
2. Success message appears ✓
3. Staff selection cleared ✓
4. Form fields reset ✓
5. Ready for next operation ✓

### Test 11: Cancel Preview
1. Select staff and fill form
2. Click "Preview Changes"
3. Preview modal opens ✓
4. Click "Cancel"
5. Modal closes ✓
6. Selection and form preserved ✓

### Test 12: Validation
1. Try to preview with no date ✓
2. Preview button disabled ✓
3. Try with no staff selected ✓
4. Preview button disabled ✓

## Database Verification

```sql
-- Check bulk exception was added
SELECT 
    s.first_name,
    s.last_name,
    h.specific_date,
    h.is_working,
    h.notes
FROM wp_bookings_staff_working_hours h
INNER JOIN wp_bookings_staff s ON h.staff_id = s.id
WHERE h.specific_date = '2026-12-25'
ORDER BY s.first_name;

-- Check schedule update worked
SELECT 
    s.first_name,
    s.last_name,
    h.day_of_week,
    h.break_start,
    h.break_end
FROM wp_bookings_staff_working_hours h
INNER JOIN wp_bookings_staff s ON h.staff_id = s.id
WHERE h.day_of_week = 1 -- Monday
AND h.specific_date IS NULL
ORDER BY s.first_name;
```

## Notes

- Admin-only access (route meta)
- Staff selection with checkboxes and avatars
- Select all / deselect all functionality
- Two operation types (exception and schedule)
- Preview modal shows summary and conflicts
- Conflict resolution with overwrite checkboxes
- Visual indicators (will skip vs will apply)
- Forms reset after successful operation
- Success messages with counts (added, skipped)
- Disabled states prevent invalid operations
- Click outside modal to close
- ISO-8601 day numbering (1=Mon...7=Sun)
- Formatted dates in preview
- Staff counter in header
```

---

## ⏸️ AFTER PART B

**After implementing Part B:**

1. **Navigate to Bulk Hours** page
2. **Select multiple staff**
3. **Add bulk exception** (day off and special hours)
4. **Test conflict detection** and resolution
5. **Update bulk schedule** (break times, working hours)
6. **Verify all 12 test scenarios**
7. **Check database** changes

**Then say:** "Task 11.5 complete! Bulk operations working!"

---

## 🎉 TASK 11.5 COMPLETE!

This will complete Task 11.5, giving you:

✅ **Backend API** for bulk operations  
✅ **Bulk Hours Page** with staff selection  
✅ **Exception Management** (add to multiple staff)  
✅ **Schedule Updates** (change hours/breaks in bulk)  
✅ **Conflict Resolution** (preview and overwrite options)  

**Apply this Part B prompt and test!** 🚀