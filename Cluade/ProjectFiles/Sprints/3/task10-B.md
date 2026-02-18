# 🎉 PERFECT! ALL TESTS PASSING!

Every single test returned exactly the expected results:

---

## ✅ PART A COMPLETE - RESULTS SUMMARY

| Test | Result | Details |
|------|--------|---------|
| Future working day | ✅ | 18 slots, 09:00-17:00 |
| Sunday (day off) | ✅ | No slots |
| Break respected | ✅ | 0 slots during 12:00-13:00 |
| Exception day off | ✅ | Exception added, no slots on 2026-03-09 |

**Highlights:**
- ✅ Working hours save correctly
- ✅ Slot generation respects working hours
- ✅ Break time properly blocks 12:00-13:00
- ✅ Afternoon slots start at 13:00 (after break ends)
- ✅ Exception overrides weekly schedule perfectly
- ✅ `class-datetime-model.php` untouched and working

---

## 🧹 CLEANUP: Remove Test Exception

Before moving to Part B, delete the test exception we added:

```javascript
// Get exceptions to find the ID
fetch('/wp-json/bookit/v1/dashboard/staff/3/hours/exceptions', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Exceptions:', data.exceptions)
  // Note the ID of the test exception
})
```

Then delete it:
```javascript
// Replace X with the actual ID from above
fetch('/wp-json/bookit/v1/dashboard/staff/3/hours/exceptions/X', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

# 📝 TASK 10 PART B: FRONTEND WORKING HOURS PAGE

```markdown
# Task 10 Part B: Staff Working Hours Frontend Page

## Context
Task 10 Part A (backend API) is complete and tested. All endpoints work correctly:
- GET /dashboard/staff/{staff_id}/hours → returns 7-day schedule
- POST /dashboard/staff/{staff_id}/hours → saves weekly schedule
- GET /dashboard/staff/{staff_id}/hours/exceptions → list exceptions
- POST /dashboard/staff/{staff_id}/hours/exceptions → add exception
- DELETE /dashboard/staff/{staff_id}/hours/exceptions/{id} → remove exception

The slot generation model (class-datetime-model.php) is untouched and working.

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views for reference:
- `views/Staff.vue` (Task 9) - staff list with Hours button needed
- `views/Services.vue` (Task 7)
- `components/StaffFormModal.vue` (Task 9) - needs Hours link added

## Requirements

### 1. Create Working Hours View

Create new file `dashboard/src/views/StaffHours.vue`:

```vue
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        @click="goBack"
        class="mr-4 text-gray-500 hover:text-gray-700 flex items-center text-sm"
      >
        ← Back to Staff
      </button>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <!-- Staff Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="staff?.photo_url"
              :src="staff.photo_url"
              :alt="staff?.full_name"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div
              v-else-if="staff"
              class="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              :style="{ backgroundColor: getColorForInitials(staff.full_name) }"
            >
              {{ getInitials(staff.full_name) }}
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Working Hours
            </h1>
            <p class="text-sm text-gray-600">
              {{ staff?.full_name || 'Loading...' }}
              <span v-if="staff?.title" class="text-gray-400">
                · {{ staff.title }}
              </span>
            </p>
          </div>
        </div>
      </div>
      <button
        @click="saveSchedule"
        :disabled="saving"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {{ saving ? 'Saving...' : 'Save Schedule' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading working hours...</p>
    </div>

    <div v-else>
      <!-- Success/Error Messages -->
      <div v-if="saveSuccess" class="mb-4 bg-green-50 border border-green-200 rounded p-3">
        <p class="text-sm text-green-800">✓ Working hours saved successfully.</p>
      </div>
      <div v-if="saveError" class="mb-4 bg-red-50 border border-red-200 rounded p-3">
        <p class="text-sm text-red-800">{{ saveError }}</p>
      </div>

      <!-- Weekly Schedule -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          <p class="text-sm text-gray-500 mt-1">
            Set regular working hours for each day of the week
          </p>
        </div>

        <!-- Day Rows -->
        <div class="divide-y divide-gray-200">
          <div
            v-for="day in days"
            :key="day.number"
            class="px-6 py-4"
            :class="{ 'bg-gray-50': !schedule[day.number]?.is_working }"
          >
            <div class="flex items-start gap-4">
              <!-- Day Toggle -->
              <div class="flex items-center w-32 pt-1">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="schedule[day.number].is_working"
                    @change="onDayToggle(day.number)"
                    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span
                    class="ml-2 text-sm font-medium"
                    :class="schedule[day.number].is_working ? 'text-gray-900' : 'text-gray-400'"
                  >
                    {{ day.name }}
                  </span>
                </label>
              </div>

              <!-- Day Off Label -->
              <div v-if="!schedule[day.number].is_working" class="flex-1 pt-1">
                <span class="text-sm text-gray-400">Day off</span>
              </div>

              <!-- Working Hours Config -->
              <div v-else class="flex-1">
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Start Time -->
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500 w-8">From</label>
                    <input
                      type="time"
                      v-model="schedule[day.number].start_time"
                      class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <!-- End Time -->
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500 w-6">To</label>
                    <input
                      type="time"
                      v-model="schedule[day.number].end_time"
                      class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <!-- Break Divider -->
                  <div class="w-px h-6 bg-gray-300"></div>

                  <!-- Break Toggle -->
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="schedule[day.number].has_break"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span class="ml-1.5 text-xs text-gray-600">Break</span>
                  </label>

                  <!-- Break Times -->
                  <template v-if="schedule[day.number].has_break">
                    <div class="flex items-center gap-2">
                      <input
                        type="time"
                        v-model="schedule[day.number].break_start"
                        class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span class="text-xs text-gray-500">to</span>
                      <input
                        type="time"
                        v-model="schedule[day.number].break_end"
                        class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </template>

                  <!-- Seasonal Schedule Toggle -->
                  <div class="w-px h-6 bg-gray-300"></div>

                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="schedule[day.number].has_seasonal"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span class="ml-1.5 text-xs text-gray-600">Seasonal</span>
                  </label>

                  <!-- Seasonal Date Range -->
                  <template v-if="schedule[day.number].has_seasonal">
                    <div class="flex items-center gap-2 mt-2 w-full ml-28">
                      <label class="text-xs text-gray-500">Valid from</label>
                      <input
                        type="date"
                        v-model="schedule[day.number].valid_from"
                        class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <label class="text-xs text-gray-500">to</label>
                      <input
                        type="date"
                        v-model="schedule[day.number].valid_until"
                        class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </template>
                </div>

                <!-- Validation Error -->
                <p
                  v-if="validationErrors[day.number]"
                  class="text-xs text-red-600 mt-1"
                >
                  {{ validationErrors[day.number] }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button (bottom) -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <p class="text-xs text-gray-500">
            Changes are saved immediately when you click "Save Schedule"
          </p>
          <button
            @click="saveSchedule"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Schedule' }}
          </button>
        </div>
      </div>

      <!-- Date Exceptions -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Date Exceptions</h2>
              <p class="text-sm text-gray-500 mt-1">
                Override working hours for specific dates (holidays, time off, special hours)
              </p>
            </div>
            <button
              @click="showAddException = true"
              class="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              + Add Exception
            </button>
          </div>
        </div>

        <!-- Add Exception Form -->
        <div v-if="showAddException" class="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Add Date Exception</h3>
          <div class="flex flex-wrap items-end gap-3">
            <!-- Date -->
            <div>
              <label class="block text-xs text-gray-600 mb-1">Date *</label>
              <input
                type="date"
                v-model="newException.specific_date"
                :min="today"
                class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <!-- Type -->
            <div>
              <label class="block text-xs text-gray-600 mb-1">Type *</label>
              <select
                v-model="newException.is_working"
                class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option :value="false">Day Off</option>
                <option :value="true">Special Hours</option>
              </select>
            </div>

            <!-- Times (if working) -->
            <template v-if="newException.is_working">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Start *</label>
                <input
                  type="time"
                  v-model="newException.start_time"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">End *</label>
                <input
                  type="time"
                  v-model="newException.end_time"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Break Start</label>
                <input
                  type="time"
                  v-model="newException.break_start"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Break End</label>
                <input
                  type="time"
                  v-model="newException.break_end"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </template>

            <!-- Notes -->
            <div>
              <label class="block text-xs text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                v-model="newException.notes"
                placeholder="e.g., Holiday, Training day"
                class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <!-- Error -->
          <p v-if="exceptionError" class="text-xs text-red-600 mt-2">
            {{ exceptionError }}
          </p>

          <!-- Buttons -->
          <div class="flex gap-2 mt-3">
            <button
              @click="addException"
              :disabled="addingException"
              class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {{ addingException ? 'Adding...' : 'Add Exception' }}
            </button>
            <button
              @click="cancelAddException"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Exceptions List -->
        <div v-if="exceptions.length === 0 && !showAddException" class="px-6 py-8 text-center">
          <p class="text-sm text-gray-500">No date exceptions configured.</p>
          <p class="text-xs text-gray-400 mt-1">
            Add exceptions for holidays, time off, or special hours.
          </p>
        </div>

        <div v-else-if="exceptions.length > 0" class="divide-y divide-gray-200">
          <div
            v-for="exception in exceptions"
            :key="exception.id"
            class="px-6 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <!-- Date -->
              <div class="w-28">
                <p class="text-sm font-medium text-gray-900">
                  {{ formatDate(exception.specific_date) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ getDayName(exception.specific_date) }}
                </p>
              </div>

              <!-- Type Badge -->
              <span
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                :class="exception.is_working
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'"
              >
                {{ exception.is_working ? 'Special Hours' : 'Day Off' }}
              </span>

              <!-- Hours (if working) -->
              <div v-if="exception.is_working" class="text-sm text-gray-600">
                {{ formatTime(exception.start_time) }} – {{ formatTime(exception.end_time) }}
                <span v-if="exception.break_start" class="text-gray-400 text-xs ml-1">
                  (break {{ formatTime(exception.break_start) }}–{{ formatTime(exception.break_end) }})
                </span>
              </div>

              <!-- Notes -->
              <div v-if="exception.notes" class="text-sm text-gray-500 italic">
                "{{ exception.notes }}"
              </div>
            </div>

            <!-- Delete Button -->
            <button
              @click="deleteException(exception)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'

const route  = useRoute()
const router = useRouter()
const api    = useApi()

// Staff ID from route params
const staffId = computed(() => parseInt(route.params.staff_id))

// Day definitions (ISO-8601: 1=Mon...7=Sun)
const days = [
  { number: 1, name: 'Monday' },
  { number: 2, name: 'Tuesday' },
  { number: 3, name: 'Wednesday' },
  { number: 4, name: 'Thursday' },
  { number: 5, name: 'Friday' },
  { number: 6, name: 'Saturday' },
  { number: 7, name: 'Sunday' },
]

// State
const loading    = ref(false)
const saving     = ref(false)
const saveSuccess = ref(false)
const saveError  = ref('')
const staff      = ref(null)
const exceptions = ref([])

// Schedule state - one entry per day (1-7)
const schedule = ref({})
const validationErrors = ref({})

// Exception state
const showAddException  = ref(false)
const addingException   = ref(false)
const exceptionError    = ref('')
const newException      = ref(getDefaultException())

// Today's date for min attribute
const today = computed(() => new Date().toISOString().split('T')[0])

// Methods
function getDefaultException() {
  return {
    specific_date: '',
    is_working: false,
    start_time: '09:00',
    end_time: '17:00',
    break_start: '',
    break_end: '',
    notes: ''
  }
}

function initSchedule() {
  // Initialize all 7 days as day off
  for (let day = 1; day <= 7; day++) {
    schedule.value[day] = {
      day_of_week: day,
      is_working: false,
      start_time: '09:00',
      end_time: '17:00',
      has_break: false,
      break_start: '12:00',
      break_end: '13:00',
      has_seasonal: false,
      valid_from: '',
      valid_until: ''
    }
  }
}

function populateSchedule(apiSchedule) {
  for (let day = 1; day <= 7; day++) {
    const dayData = apiSchedule[day]
    
    if (!dayData || !dayData.is_working || dayData.records.length === 0) {
      schedule.value[day] = {
        day_of_week: day,
        is_working: false,
        start_time: '09:00',
        end_time: '17:00',
        has_break: false,
        break_start: '12:00',
        break_end: '13:00',
        has_seasonal: false,
        valid_from: '',
        valid_until: ''
      }
    } else {
      // Use first record for the day
      const record = dayData.records[0]
      
      schedule.value[day] = {
        day_of_week: day,
        is_working: true,
        start_time: formatTimeForInput(record.start_time),
        end_time: formatTimeForInput(record.end_time),
        has_break: !!(record.break_start && record.break_end),
        break_start: record.break_start ? formatTimeForInput(record.break_start) : '12:00',
        break_end: record.break_end ? formatTimeForInput(record.break_end) : '13:00',
        has_seasonal: !!(record.valid_from || record.valid_until),
        valid_from: record.valid_from || '',
        valid_until: record.valid_until || ''
      }
    }
  }
}

function formatTimeForInput(time) {
  // Convert H:i:s to H:i for input[type=time]
  if (!time) return ''
  return time.substring(0, 5) // '09:00:00' -> '09:00'
}

function formatTime(time) {
  // Format time for display
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getDayName(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', { weekday: 'long' })
}

function onDayToggle(dayNumber) {
  // Clear validation error when toggling
  delete validationErrors.value[dayNumber]
}

function validateSchedule() {
  validationErrors.value = {}
  let valid = true

  for (let day = 1; day <= 7; day++) {
    const dayData = schedule.value[day]
    if (!dayData.is_working) continue

    // Check start < end
    if (dayData.start_time >= dayData.end_time) {
      validationErrors.value[day] = 'End time must be after start time'
      valid = false
      continue
    }

    // Check break times if enabled
    if (dayData.has_break) {
      if (!dayData.break_start || !dayData.break_end) {
        validationErrors.value[day] = 'Break start and end times are required'
        valid = false
        continue
      }
      if (dayData.break_start >= dayData.break_end) {
        validationErrors.value[day] = 'Break end must be after break start'
        valid = false
        continue
      }
      if (dayData.break_start <= dayData.start_time ||
          dayData.break_end >= dayData.end_time) {
        validationErrors.value[day] = 'Break must be within working hours'
        valid = false
        continue
      }
    }

    // Check seasonal dates if enabled
    if (dayData.has_seasonal) {
      if (!dayData.valid_from || !dayData.valid_until) {
        validationErrors.value[day] = 'Both seasonal start and end dates are required'
        valid = false
        continue
      }
      if (dayData.valid_from >= dayData.valid_until) {
        validationErrors.value[day] = 'Seasonal end date must be after start date'
        valid = false
      }
    }
  }

  return valid
}

const loadHours = async () => {
  loading.value = true

  try {
    const response = await api.get(`staff/${staffId.value}/hours`)

    if (response.data.success) {
      staff.value = response.data.staff
      initSchedule()
      populateSchedule(response.data.schedule)
    }

    // Load exceptions separately
    const exceptionsResponse = await api.get(`staff/${staffId.value}/hours/exceptions`)
    if (exceptionsResponse.data.success) {
      exceptions.value = exceptionsResponse.data.exceptions
    }
  } catch (err) {
    console.error('Error loading hours:', err)
  } finally {
    loading.value = false
  }
}

const saveSchedule = async () => {
  if (!validateSchedule()) return

  saving.value    = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    // Build schedule array for API
    const scheduleData = []

    for (let day = 1; day <= 7; day++) {
      const dayData = schedule.value[day]

      scheduleData.push({
        day_of_week:  day,
        is_working:   dayData.is_working,
        start_time:   dayData.start_time,
        end_time:     dayData.end_time,
        break_start:  dayData.is_working && dayData.has_break ? dayData.break_start : null,
        break_end:    dayData.is_working && dayData.has_break ? dayData.break_end : null,
        valid_from:   dayData.is_working && dayData.has_seasonal ? dayData.valid_from : null,
        valid_until:  dayData.is_working && dayData.has_seasonal ? dayData.valid_until : null,
      })
    }

    const response = await api.post(`staff/${staffId.value}/hours`, {
      schedule: scheduleData
    })

    if (response.data.success) {
      saveSuccess.value = true
      // Refresh to get IDs
      await loadHours()
      // Hide success after 3 seconds
      setTimeout(() => { saveSuccess.value = false }, 3000)
    } else {
      saveError.value = response.data.message || 'Failed to save schedule'
    }
  } catch (err) {
    console.error('Error saving schedule:', err)
    saveError.value = err.message || 'Failed to save schedule'
  } finally {
    saving.value = false
  }
}

const addException = async () => {
  exceptionError.value = ''

  // Validate
  if (!newException.value.specific_date) {
    exceptionError.value = 'Date is required'
    return
  }
  if (newException.value.is_working) {
    if (!newException.value.start_time || !newException.value.end_time) {
      exceptionError.value = 'Start and end times are required for special hours'
      return
    }
  }

  addingException.value = true

  try {
    const payload = {
      specific_date: newException.value.specific_date,
      is_working:    newException.value.is_working,
      notes:         newException.value.notes || null
    }

    if (newException.value.is_working) {
      payload.start_time  = newException.value.start_time
      payload.end_time    = newException.value.end_time
      payload.break_start = newException.value.break_start || null
      payload.break_end   = newException.value.break_end || null
    }

    const response = await api.post(
      `staff/${staffId.value}/hours/exceptions`,
      payload
    )

    if (response.data.success) {
      // Reload exceptions
      const exceptionsResponse = await api.get(
        `staff/${staffId.value}/hours/exceptions`
      )
      if (exceptionsResponse.data.success) {
        exceptions.value = exceptionsResponse.data.exceptions
      }
      showAddException.value   = false
      newException.value       = getDefaultException()
    } else {
      exceptionError.value = response.data.message || 'Failed to add exception'
    }
  } catch (err) {
    console.error('Error adding exception:', err)
    if (err.response?.data?.code === 'duplicate_exception') {
      exceptionError.value = 'An exception already exists for this date'
    } else {
      exceptionError.value = err.message || 'Failed to add exception'
    }
  } finally {
    addingException.value = false
  }
}

const deleteException = async (exception) => {
  if (!confirm(`Remove exception for ${formatDate(exception.specific_date)}?`)) return

  try {
    const response = await api.delete(
      `staff/${staffId.value}/hours/exceptions/${exception.id}`
    )

    if (response.data.success) {
      exceptions.value = exceptions.value.filter(e => e.id !== exception.id)
    }
  } catch (err) {
    console.error('Error deleting exception:', err)
    alert('Failed to remove exception')
  }
}

const cancelAddException = () => {
  showAddException.value = false
  exceptionError.value   = ''
  newException.value     = getDefaultException()
}

const goBack = () => {
  router.push('/staff')
}

const getInitials = (fullName) => {
  if (!fullName) return '??'
  const names = fullName.trim().split(' ').filter(n => n)
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
  loadHours()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import StaffHours from '../views/StaffHours.vue'
```

**Add route:**
```javascript
{
  path: '/staff/:staff_id/hours',
  name: 'StaffHours',
  component: StaffHours
}
```

### 3. Add Hours Button to Staff List

Update `dashboard/src/views/Staff.vue`:

In the Actions column, find the Edit/Delete buttons and add Hours button:

**Change from:**
```vue
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
```

**Change to:**
```vue
<template v-else>
  <button
    @click="openEditModal(member)"
    class="text-primary-600 hover:text-primary-900 mr-3"
  >
    Edit
  </button>
  <router-link
    :to="`/staff/${member.id}/hours`"
    class="text-green-600 hover:text-green-900 mr-3"
  >
    Hours
  </router-link>
  <button
    @click="confirmDelete(member)"
    class="text-red-600 hover:text-red-900"
  >
    Delete
  </button>
</template>
```

### 4. Add Hours Link to Staff Form Modal

Update `dashboard/src/components/StaffFormModal.vue`:

Find the working hours info boxes (the blue/amber boxes) and update them to include navigation links:

**Change from:**
```vue
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
```

**Change to:**
```vue
<div v-if="isEditing && staffMember?.has_working_hours" class="bg-blue-50 border border-blue-200 rounded p-3">
  <div class="flex items-center justify-between">
    <p class="text-sm text-blue-800">
      ℹ️ Working hours are <strong>configured</strong>.
    </p>
    <router-link
      :to="`/staff/${staffMember.id}/hours`"
      @click="$emit('close')"
      class="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
    >
      Edit Working Hours →
    </router-link>
  </div>
</div>
<div v-else-if="isEditing && !staffMember?.has_working_hours" class="bg-amber-50 border border-amber-200 rounded p-3">
  <div class="flex items-center justify-between">
    <p class="text-sm text-amber-800">
      ⚠️ Working hours <strong>not configured</strong>.
      This staff member won't appear in booking availability.
    </p>
    <router-link
      :to="`/staff/${staffMember.id}/hours`"
      @click="$emit('close')"
      class="text-sm font-medium text-amber-600 hover:text-amber-700 underline whitespace-nowrap ml-3"
    >
      Configure Now →
    </router-link>
  </div>
</div>
```

## Testing

### Test 1: Navigate to Working Hours
1. Go to Staff list
2. Click "Hours" button for any staff member
3. Working Hours page loads ✓
4. Staff name and photo/initials shown in header ✓
5. All 7 days shown ✓
6. Days with existing data pre-filled ✓
7. Days without data show as "Day off" ✓

### Test 2: Toggle Day On
1. Click checkbox for Monday
2. Working hours inputs appear ✓
3. Default times 09:00-17:00 shown ✓
4. Break checkbox visible ✓

### Test 3: Toggle Day Off
1. Click checkbox for a working day
2. "Day off" text appears ✓
3. Inputs hidden ✓
4. Row background grays out ✓

### Test 4: Configure Break
1. Enable Monday
2. Check "Break" checkbox
3. Break time inputs appear ✓
4. Set break 12:00-13:00 ✓

### Test 5: Configure Seasonal
1. Enable Tuesday
2. Check "Seasonal" checkbox
3. Date range inputs appear ✓
4. Set valid_from/valid_until ✓

### Test 6: Save Schedule
1. Configure Mon-Fri 09:00-17:00 with break
2. Click "Save Schedule"
3. Success message appears ✓
4. Refresh page
5. Schedule pre-filled correctly ✓

### Test 7: Validation
1. Set end time before start time
2. Click Save
3. Error shown on that day ✓
4. Save blocked ✓
5. Set break outside working hours
6. Error shown ✓

### Test 8: Add Exception - Day Off
1. Click "+ Add Exception"
2. Select future date
3. Type: Day Off
4. Add notes: "Holiday"
5. Click "Add Exception"
6. Exception appears in list ✓
7. Red "Day Off" badge shown ✓

### Test 9: Add Exception - Special Hours
1. Add exception
2. Type: Special Hours
3. Set 09:00-13:00
4. Save
5. Blue "Special Hours" badge ✓
6. Hours displayed ✓

### Test 10: Duplicate Exception
1. Try adding exception for same date
2. Error: "Already exists for this date" ✓

### Test 11: Delete Exception
1. Click "Remove" on exception
2. Confirm dialog appears ✓
3. Exception removed from list ✓

### Test 12: Hours Link from Edit Modal
1. Edit a staff member
2. See working hours info box
3. Click "Edit Working Hours →"
4. Modal closes ✓
5. Working Hours page opens ✓

### Test 13: Verify Slots After Save
```javascript
// After saving Mon-Fri 09:00-17:00, verify slots work
fetch('/wp-json/bookit/v1/dashboard/timeslots?staff_id=3&service_id=4&date=2026-03-02', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Available:', data.available) // true
  console.log('Total slots:', [
    ...data.slots.morning,
    ...data.slots.afternoon,
    ...data.slots.evening
  ].length) // Should match working hours
})
```

## Notes

- Back button navigates to /staff
- Staff avatar (photo or initials) in header
- All 7 days shown (ISO-8601 order Mon-Sun)
- Days off show gray background
- Break toggle shows/hides break inputs
- Seasonal toggle shows/hides date range inputs
- Validation runs before save
- Success message auto-hides after 3 seconds
- Exceptions sorted by date ascending
- Past exceptions shown (for reference)
- Confirm dialog before deleting exception
- Hours button in staff list (green color)
- Modal links close modal and navigate
```

---

## ⏸️ PAUSE AFTER PART B

**After implementing Part B:**

1. **Navigate to Staff → Hours** for a staff member
2. **Configure Mon-Fri 09:00-17:00** with break
3. **Save and refresh** (verify persists)
4. **Add exceptions** (day off + special hours)
5. **Test validation** (invalid times)
6. **Test slot verification** (Test 13)
7. **Test Hours link** from edit modal

**Then say:** "Part B complete, ready for commit!"

Task 10 is complete after Part B - no Part C needed since the backend already handles everything! 🎉

---

**Apply this Part B prompt now!** 🚀