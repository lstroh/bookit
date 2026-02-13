# 🎯 EXCELLENT CATCH! Two Issues to Fix

1. **Time field empty** - Should pre-fill with current time (11:45)
2. **Past dates with no slots** - Should show helpful message instead of empty dropdown

---

## 🔧 CURSOR PROMPT TO FIX BOTH ISSUES

```markdown
# Fix: Edit Mode Time Field Issues

Two improvements needed for the booking edit modal:

1. Pre-fill the time field with the current booking's time
2. Show helpful message when no time slots are available (especially for past dates)

Update `dashboard/src/components/BookingViewModal.vue`:

## Fix 1: Pre-fill Time Field in Edit Mode

The time field should show the current booking time even if it's not in the available slots list (for past bookings or when slots haven't loaded yet).

Find the time dropdown in the edit mode section (around line 280):

**Replace this entire section:**
```vue
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Time *
  </label>
  <select
    v-model="editData.booking_time"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    required
    :disabled="!editData.booking_date || loadingSlots"
  >
    <option value="">
      {{ loadingSlots ? 'Loading...' : 'Select time...' }}
    </option>
    <optgroup v-if="timeslots?.morning?.length > 0" label="Morning">
      <option v-for="slot in timeslots.morning" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
    <optgroup v-if="timeslots?.afternoon?.length > 0" label="Afternoon">
      <option v-for="slot in timeslots.afternoon" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
    <optgroup v-if="timeslots?.evening?.length > 0" label="Evening">
      <option v-for="slot in timeslots.evening" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
  </select>
  <p v-if="timeslotsError" class="text-xs text-red-600 mt-1">
    {{ timeslotsError }}
  </p>
</div>
```

**With this:**
```vue
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Time *
  </label>
  <select
    v-model="editData.booking_time"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    required
    :disabled="!editData.booking_date || loadingSlots"
  >
    <!-- Show current time if it's not in available slots (for past bookings) -->
    <option 
      v-if="editData.booking_time && !isTimeInSlots(editData.booking_time)"
      :value="editData.booking_time"
    >
      {{ editData.booking_time }} (Current time)
    </option>
    
    <option value="">
      {{ loadingSlots ? 'Loading...' : 'Select time...' }}
    </option>
    
    <!-- Available slots grouped by time of day -->
    <optgroup v-if="timeslots?.morning?.length > 0" label="Morning">
      <option v-for="slot in timeslots.morning" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
    <optgroup v-if="timeslots?.afternoon?.length > 0" label="Afternoon">
      <option v-for="slot in timeslots.afternoon" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
    <optgroup v-if="timeslots?.evening?.length > 0" label="Evening">
      <option v-for="slot in timeslots.evening" :key="slot" :value="slot">
        {{ slot }}
      </option>
    </optgroup>
  </select>
  
  <!-- Helper messages -->
  <div v-if="!loadingSlots && editData.booking_date" class="mt-2">
    <p v-if="timeslotsError" class="text-xs text-red-600">
      {{ timeslotsError }}
    </p>
    <p v-else-if="!timeslots || totalAvailableSlots === 0" class="text-xs text-amber-600">
      ⚠️ No available time slots for this date. You can keep the current time or select a different date.
    </p>
    <p v-else-if="editData.booking_time && !isTimeInSlots(editData.booking_time)" class="text-xs text-blue-600">
      💡 Current time ({{ editData.booking_time }}) is no longer available. Select a new time to reschedule.
    </p>
  </div>
</div>
```

## Fix 2: Add Helper Methods

Add these computed properties and methods in the `<script setup>` section (after the existing computed properties):

**Add computed for total available slots:**
```javascript
const totalAvailableSlots = computed(() => {
  if (!timeslots.value) return 0
  return (timeslots.value.morning?.length || 0) +
         (timeslots.value.afternoon?.length || 0) +
         (timeslots.value.evening?.length || 0)
})
```

**Add method to check if time is in available slots:**
```javascript
const isTimeInSlots = (time) => {
  if (!time || !timeslots.value) return false
  
  const allSlots = [
    ...(timeslots.value.morning || []),
    ...(timeslots.value.afternoon || []),
    ...(timeslots.value.evening || [])
  ]
  
  return allSlots.includes(time)
}
```

## Fix 3: Improve Timeslots Loading Behavior

Update the `enableEditMode()` method to NOT clear the time when loading:

Find the `enableEditMode()` method and modify it:

**Change from:**
```javascript
const enableEditMode = () => {
  editMode.value = true
  
  // Populate edit data from current booking
  editData.value = {
    service_id: booking.value.service_id,
    staff_id: booking.value.staff_id,
    booking_date: booking.value.booking_date,
    booking_time: booking.value.start_time,
    status: booking.value.status,
    payment_method: booking.value.payment_method,
    amount_paid: parseFloat(booking.value.deposit_paid) || 0,
    special_requests: booking.value.special_requests || '',
    staff_notes: booking.value.staff_notes || '',
    send_notification: true
  }
  
  // Load services and staff
  loadServices()
  loadStaffForService(booking.value.service_id)
  loadTimeslots()
}
```

**To this (no changes needed, but ensure time is set):**
```javascript
const enableEditMode = () => {
  editMode.value = true
  
  // Populate edit data from current booking
  editData.value = {
    service_id: booking.value.service_id,
    staff_id: booking.value.staff_id,
    booking_date: booking.value.booking_date,
    booking_time: booking.value.start_time, // This preserves the current time
    status: booking.value.status,
    payment_method: booking.value.payment_method,
    amount_paid: parseFloat(booking.value.deposit_paid) || 0,
    special_requests: booking.value.special_requests || '',
    staff_notes: booking.value.staff_notes || '',
    send_notification: true
  }
  
  // Load services and staff
  loadServices()
  loadStaffForService(booking.value.service_id)
  
  // Load timeslots (will show availability for current date)
  loadTimeslots()
}
```

## Fix 4: Update Date/Staff Change Handlers

Modify the change handlers to NOT clear time if it's the current booking time:

**Update `onServiceChange`:**
```javascript
const onServiceChange = () => {
  // Reload staff when service changes
  loadStaffForService(editData.value.service_id)
  editData.value.staff_id = '' // Clear staff selection
  // Don't clear time - let the user see they need to change it if unavailable
}
```

**Update `onStaffChange`:**
```javascript
const onStaffChange = () => {
  // Reload timeslots when staff changes
  // Don't clear time - let timeslots load show if current time is still available
  loadTimeslots()
}
```

**Update `onDateChange`:**
```javascript
const onDateChange = () => {
  // Reload timeslots when date changes
  // Don't clear time - let timeslots load show if current time is still available
  loadTimeslots()
}
```

## Testing

After applying all fixes:

### Test 1: Edit Past Booking (Current Issue)
1. Open booking from 12 Feb 2026 at 11:45
2. Click "Edit"
3. Date field shows: 2026-02-12 ✓
4. Time dropdown shows: "11:45 (Current time)" as first option ✓
5. Below dropdown shows: "⚠️ No available time slots for this date..." ✓
6. Can keep current time or select different date

### Test 2: Edit with Available Slots
1. Edit a future booking with available slots
2. Time dropdown shows:
   - Current time (if not in available slots)
   - "Select time..."
   - Morning slots
   - Afternoon slots
   - Evening slots
3. If current time IS in available slots, it appears in the appropriate group ✓

### Test 3: Change Date to Available Date
1. Edit past booking (no slots)
2. Change date to tomorrow
3. Time dropdown updates with available slots
4. Helper text shows: "💡 Current time (11:45) is no longer available. Select a new time..."
5. Can select new time from list

### Test 4: Save with Current Time (Past Date)
1. Edit past booking
2. Keep current time (11:45)
3. Keep past date (2026-02-12)
4. Click "Save Changes"
5. Backend validation should handle this (may succeed for status/payment updates)

### Test 5: Multiple Field Changes
1. Edit booking
2. Change service → staff list updates, time preserved
3. Change staff → timeslots reload, time preserved
4. Change date → timeslots reload, time preserved
5. Helper message updates based on availability

## Expected Behavior

**For Past Bookings (No Available Slots):**
```
Time Dropdown:
  11:45 (Current time)
  ---
  Select time...
  [No other options]

Helper Text:
⚠️ No available time slots for this date. You can keep the current 
time or select a different date.
```

**For Future Bookings (Current Time Not Available):**
```
Time Dropdown:
  11:45 (Current time)
  ---
  Select time...
  Morning
    09:00
    09:30
  Afternoon
    14:00
    14:30

Helper Text:
💡 Current time (11:45) is no longer available. Select a new time 
to reschedule.
```

**For Future Bookings (Current Time IS Available):**
```
Time Dropdown:
  Select time...
  Morning
    09:00
    09:30
  Afternoon
    11:45  ← Current time appears here
    14:00
    14:30

Helper Text:
[None - everything is fine]
```

## UX Improvements

1. ✅ Current time always visible (even if not available)
2. ✅ Clear labeling: "(Current time)"
3. ✅ Color-coded helper messages:
   - 🔴 Red (error) - API errors
   - 🟠 Amber (warning) - No slots available
   - 🔵 Blue (info) - Current time not available, select new one
4. ✅ User can keep current time for status/payment updates
5. ✅ User clearly informed when they need to select new time
6. ✅ Time doesn't mysteriously disappear when switching fields

## Notes

- Current time is preserved in dropdown even when not available
- Helper messages guide user on what action to take
- Backend will validate time availability on save
- Allows editing status/payment without forcing reschedule
- Clear visual feedback for all scenarios
```

---

## 🎯 WHAT THIS FIXES

### **Before:**
```
User opens past booking (11:45)
Clicks "Edit"
Time field: [Empty]
Dropdown: "Select time..." [No options]
User: "Where did my time go?! 😕"
```

### **After:**
```
User opens past booking (11:45)
Clicks "Edit"
Time field: "11:45 (Current time)"
Dropdown shows current time + message:
  "⚠️ No available slots for this date. You can keep 
   the current time or select a different date."
User: "Ah, I understand! I'll change the date or just 
       update the status." 😊
```

---

## ✅ BENEFITS

1. **Less Confusing** - Time doesn't disappear mysteriously
2. **More Flexible** - Can update status/notes without rescheduling
3. **Better Feedback** - Clear messages explain the situation
4. **Preserves Data** - Current time always visible
5. **Guides User** - Tells them what to do next

---

**Apply this prompt and test!** 🚀

The edit experience will be much smoother, especially for past bookings!