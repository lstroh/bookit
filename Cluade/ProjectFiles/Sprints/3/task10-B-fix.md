# 🔍 TWO ISSUES FOUND!

## Issue 1: Hours Button Missing from Staff List

The Hours button update to `Staff.vue` wasn't applied. Let's fix that.

## Issue 2: `schedule[day.number]` is Undefined

The Vue template renders **before** `initSchedule()` completes, so `schedule[day.number]` is undefined when the template first renders.

---

## 🔧 FIX BOTH ISSUES

```markdown
# Fix: Staff Hours Button + Schedule Initialization Error

## Fix 1: Add Hours Button to Staff List

In `dashboard/src/views/Staff.vue`:

Find the actions column template (around the Edit/Delete buttons):

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

## Fix 2: Guard Template Against Undefined Schedule

The error `Cannot read properties of undefined (reading 'is_working')` happens because
Vue renders the template before `initSchedule()` runs and populates `schedule.value`.

In `dashboard/src/views/StaffHours.vue`:

### Fix 2a: Initialize schedule with default values immediately

Find this line in `<script setup>`:
```javascript
// Schedule state - one entry per day (1-7)
const schedule = ref({})
```

**Change to:**
```javascript
// Schedule state - one entry per day (1-7)
// Pre-initialize all days to prevent template errors before load
const schedule = ref(
  Object.fromEntries(
    [1,2,3,4,5,6,7].map(day => [day, {
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
    }])
  )
)
```

### Fix 2b: Add v-if guard on the days loop

Find the day rows loop in the template:
```vue
<div
  v-for="day in days"
  :key="day.number"
  class="px-6 py-4"
  :class="{ 'bg-gray-50': !schedule[day.number]?.is_working }"
>
```

**Change to:**
```vue
<div
  v-for="day in days"
  :key="day.number"
  class="px-6 py-4"
  :class="{ 'bg-gray-50': !schedule[day.number]?.is_working }"
  v-if="schedule[day.number]"
>
```

### Fix 2c: Add optional chaining throughout template

Find ALL instances in the template where `schedule[day.number]` is accessed
and add `?.` optional chaining:

**Replace these patterns:**
```vue
v-model="schedule[day.number].is_working"
v-model="schedule[day.number].start_time"
v-model="schedule[day.number].end_time"
v-model="schedule[day.number].has_break"
v-model="schedule[day.number].break_start"
v-model="schedule[day.number].break_end"
v-model="schedule[day.number].has_seasonal"
v-model="schedule[day.number].valid_from"
v-model="schedule[day.number].valid_until"
v-if="!schedule[day.number].is_working"
v-if="schedule[day.number].is_working"
v-if="schedule[day.number].has_break"
v-if="schedule[day.number].has_seasonal"
validationErrors[day.number]
```

**With these (add ?. where accessing nested):**
```vue
v-model="schedule[day.number].is_working"
v-model="schedule[day.number].start_time"
v-model="schedule[day.number].end_time"
v-model="schedule[day.number].has_break"
v-model="schedule[day.number].break_start"
v-model="schedule[day.number].break_end"
v-model="schedule[day.number].has_seasonal"
v-model="schedule[day.number].valid_from"
v-model="schedule[day.number].valid_until"
v-if="!schedule[day.number]?.is_working"
v-if="schedule[day.number]?.is_working"
v-if="schedule[day.number]?.has_break"
v-if="schedule[day.number]?.has_seasonal"
validationErrors[day.number]
```

Note: v-model bindings don't need ?. since Fix 2a guarantees they exist.
Only v-if conditions need ?. as extra safety.

## Testing After Fix

### Test 1: Hours Button Visible
1. Go to Staff list
2. See [Edit] [Hours] [Delete] for each staff member ✓
3. Click "Hours" for staff member
4. Navigates to /staff/{id}/hours ✓

### Test 2: Page Loads Without Error
1. Click Hours button
2. No Vue errors in console ✓
3. All 7 days render correctly ✓
4. Staff name shown in header ✓
5. Existing schedule pre-filled ✓

### Test 3: Both Navigation Paths Work
1. Staff list → Hours button → Working Hours page ✓
2. Staff list → Edit → Edit Working Hours link → Working Hours page ✓
```

---

## 🎯 ROOT CAUSE EXPLANATION

**Why it crashed:**

```javascript
// schedule starts as empty object {}
const schedule = ref({})

// Template renders immediately and tries:
schedule[day.number].is_working
// schedule[1] is UNDEFINED → crash!

// initSchedule() runs AFTER render in onMounted
// Too late - template already crashed
```

**The fix:**

```javascript
// Pre-populate all 7 days BEFORE first render
const schedule = ref(
  Object.fromEntries(
    [1,2,3,4,5,6,7].map(day => [day, {
      is_working: false,  // Always exists now
      // ... other defaults
    }])
  )
)
// Template renders → schedule[1].is_working = false ✓ No crash!
```

---

**Apply both fixes and test!** 🚀 Let me know when both issues are resolved!