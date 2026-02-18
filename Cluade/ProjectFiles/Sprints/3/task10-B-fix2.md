# 📝 ADD TOOLTIPS TO WORKING HOURS PAGE

Great idea! Tooltips help business owners understand the options without needing a manual.

---

```markdown
# Add: Tooltips to Working Hours Page

Add helpful tooltip explanations to all options on the Working Hours page.
Tooltips appear on hover using a simple CSS/Vue approach (no external library needed).

## Step 1: Add Tooltip Component

In `dashboard/src/views/StaffHours.vue`, add a reusable tooltip inside the template.

Add this BEFORE the closing `</template>` tag:

```vue
<!-- Tooltip Component (inline) -->
<teleport to="body">
  <div
    v-if="tooltip.visible"
    :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
    class="fixed z-50 max-w-xs bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg pointer-events-none"
    style="transform: translateX(-50%)"
  >
    {{ tooltip.text }}
    <!-- Arrow -->
    <div
      class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45"
    ></div>
  </div>
</teleport>
```

## Step 2: Add Tooltip State and Methods

In `<script setup>`, add tooltip state and methods after the `days` array:

```javascript
// Tooltip state
const tooltip = ref({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

let tooltipTimeout = null

const showTooltip = (event, text) => {
  clearTimeout(tooltipTimeout)
  const rect = event.currentTarget.getBoundingClientRect()
  tooltip.value = {
    visible: true,
    text,
    x: rect.left + rect.width / 2,
    y: rect.top - 12
  }
}

const hideTooltip = () => {
  tooltipTimeout = setTimeout(() => {
    tooltip.value.visible = false
  }, 100)
}
```

## Step 3: Add Tooltip Info Icons Throughout Template

Replace the existing labels with tooltip-enabled versions.

### 3a: Weekly Schedule Section Header

Find:
```vue
<div class="px-6 py-4 border-b border-gray-200">
  <h2 class="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
  <p class="text-sm text-gray-500 mt-1">
    Set regular working hours for each day of the week
  </p>
</div>
```

Replace with:
```vue
<div class="px-6 py-4 border-b border-gray-200">
  <h2 class="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
  <p class="text-sm text-gray-500 mt-1">
    Set regular working hours for each day of the week. 
    These repeat every week unless a seasonal date range is set.
  </p>
</div>
```

### 3b: Break Checkbox Label

Find:
```vue
<!-- Break Toggle -->
<label class="flex items-center cursor-pointer">
  <input
    type="checkbox"
    v-model="schedule[day.number].has_break"
    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
  />
  <span class="ml-1.5 text-xs text-gray-600">Break</span>
</label>
```

Replace with:
```vue
<!-- Break Toggle -->
<label class="flex items-center cursor-pointer">
  <input
    type="checkbox"
    v-model="schedule[day.number].has_break"
    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
  />
  <span class="ml-1.5 text-xs text-gray-600 flex items-center gap-1">
    Break
    <span
      class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help font-bold leading-none"
      @mouseenter="showTooltip($event, 'A break is a non-bookable period during the working day. For example, a lunch break from 12:00–13:00. No bookings can start during this time.')"
      @mouseleave="hideTooltip"
    >?</span>
  </span>
</label>
```

### 3c: Seasonal Checkbox Label

Find:
```vue
<label class="flex items-center cursor-pointer">
  <input
    type="checkbox"
    v-model="schedule[day.number].has_seasonal"
    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
  />
  <span class="ml-1.5 text-xs text-gray-600">Seasonal</span>
</label>
```

Replace with:
```vue
<label class="flex items-center cursor-pointer">
  <input
    type="checkbox"
    v-model="schedule[day.number].has_seasonal"
    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
  />
  <span class="ml-1.5 text-xs text-gray-600 flex items-center gap-1">
    Seasonal
    <span
      class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help font-bold leading-none"
      @mouseenter="showTooltip($event, 'Seasonal schedules are only active between two dates. Useful for summer hours, holiday periods, or temporary schedule changes. Outside these dates, this day follows no schedule (treated as day off).')"
      @mouseleave="hideTooltip"
    >?</span>
  </span>
</label>
```

### 3d: From/To Time Labels

Find the From label:
```vue
<label class="text-xs text-gray-500 w-8">From</label>
```

Replace with:
```vue
<label
  class="text-xs text-gray-500 w-8 cursor-help flex items-center gap-0.5"
  @mouseenter="showTooltip($event, 'The time this staff member starts accepting bookings.')"
  @mouseleave="hideTooltip"
>
  From
</label>
```

Find the To label:
```vue
<label class="text-xs text-gray-500 w-6">To</label>
```

Replace with:
```vue
<label
  class="text-xs text-gray-500 w-6 cursor-help"
  @mouseenter="showTooltip($event, 'The time this staff member stops accepting bookings. The last available slot will end at or before this time.')"
  @mouseleave="hideTooltip"
>
  To
</label>
```

### 3e: Valid From/Until Labels in Seasonal Section

Find:
```vue
<label class="text-xs text-gray-500">Valid from</label>
```

Replace with:
```vue
<label
  class="text-xs text-gray-500 cursor-help"
  @mouseenter="showTooltip($event, 'The first date this schedule is active. Before this date, this day is treated as a day off.')"
  @mouseleave="hideTooltip"
>
  Valid from
</label>
```

Find:
```vue
<label class="text-xs text-gray-500">to</label>
```

Replace with:
```vue
<label
  class="text-xs text-gray-500 cursor-help"
  @mouseenter="showTooltip($event, 'The last date this schedule is active. After this date, this day is treated as a day off.')"
  @mouseleave="hideTooltip"
>
  until
</label>
```

### 3f: Date Exceptions Section Header

Find:
```vue
<div>
  <h2 class="text-lg font-semibold text-gray-900">Date Exceptions</h2>
  <p class="text-sm text-gray-500 mt-1">
    Override working hours for specific dates (holidays, time off, special hours)
  </p>
</div>
```

Replace with:
```vue
<div>
  <div class="flex items-center gap-2">
    <h2 class="text-lg font-semibold text-gray-900">Date Exceptions</h2>
    <span
      class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help font-bold"
      @mouseenter="showTooltip($event, 'Date exceptions override the weekly schedule for a specific date. Use them for bank holidays, staff holidays, training days, or any day with different hours. Exceptions always take priority over the weekly schedule.')"
      @mouseleave="hideTooltip"
    >?</span>
  </div>
  <p class="text-sm text-gray-500 mt-1">
    Override working hours for specific dates. Exceptions always take priority over the weekly schedule.
  </p>
</div>
```

### 3g: Exception Type Dropdown Label

Find:
```vue
<div>
  <label class="block text-xs text-gray-600 mb-1">Type *</label>
  <select
    v-model="newException.is_working"
    ...
  >
    <option :value="false">Day Off</option>
    <option :value="true">Special Hours</option>
  </select>
</div>
```

Replace with:
```vue
<div>
  <label class="flex items-center gap-1 text-xs text-gray-600 mb-1">
    Type *
    <span
      class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help font-bold leading-none"
      @mouseenter="showTooltip($event, 'Day Off: Staff member is completely unavailable. No bookings possible.\n\nSpecial Hours: Staff works different hours than usual — set a custom start and end time.')"
      @mouseleave="hideTooltip"
    >?</span>
  </label>
  <select
    v-model="newException.is_working"
    class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  >
    <option :value="false">Day Off</option>
    <option :value="true">Special Hours</option>
  </select>
</div>
```

### 3h: Notes Field Label

Find:
```vue
<div>
  <label class="block text-xs text-gray-600 mb-1">Notes</label>
  <input
    type="text"
    v-model="newException.notes"
    placeholder="e.g., Holiday, Training day"
    ...
  />
</div>
```

Replace with:
```vue
<div>
  <label class="flex items-center gap-1 text-xs text-gray-600 mb-1">
    Notes
    <span
      class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help font-bold leading-none"
      @mouseenter="showTooltip($event, 'Optional internal note for this exception. Only visible to admins — not shown to customers. Example: \'Annual leave\', \'Bank holiday\', \'Team training day\'.')"
      @mouseleave="hideTooltip"
    >?</span>
  </label>
  <input
    type="text"
    v-model="newException.notes"
    placeholder="e.g., Holiday, Training day"
    class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  />
</div>
```

### 3i: Save Schedule Button Tooltip

Find the top Save button:
```vue
<button
  @click="saveSchedule"
  :disabled="saving"
  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
>
  {{ saving ? 'Saving...' : 'Save Schedule' }}
</button>
```

Add tooltip wrapper span next to the button:
```vue
<div class="flex items-center gap-2">
  <span
    class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs cursor-help font-bold"
    @mouseenter="showTooltip($event, 'Saves the weekly recurring schedule. Date exceptions are saved immediately when added and do not require clicking this button.')"
    @mouseleave="hideTooltip"
  >?</span>
  <button
    @click="saveSchedule"
    :disabled="saving"
    class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
  >
    {{ saving ? 'Saving...' : 'Save Schedule' }}
  </button>
</div>
```

## Testing

### Test 1: Hover over Break
1. Enable a day
2. Hover over the "?" next to Break
3. Tooltip appears explaining breaks ✓
4. Move mouse away
5. Tooltip disappears ✓

### Test 2: Hover over Seasonal
1. Hover over "?" next to Seasonal
2. Tooltip explains seasonal schedules ✓

### Test 3: Hover over From/To
1. Hover over "From" label
2. Tooltip explains start time ✓
3. Hover over "To"
4. Tooltip explains end time ✓

### Test 4: Hover over Date Exceptions heading
1. Hover over "?" next to Date Exceptions
2. Tooltip explains exceptions and priority ✓

### Test 5: Hover over Type in Add Exception form
1. Click "+ Add Exception"
2. Hover over "?" next to Type
3. Tooltip explains Day Off vs Special Hours ✓

### Test 6: Hover over Notes
1. Hover over "?" next to Notes
2. Tooltip explains it's admin-only ✓

### Test 7: Hover over Save Schedule "?"
1. Hover over "?" next to Save Schedule
2. Tooltip explains what is/isn't saved ✓

### Test 8: Tooltip Position
1. Hover over items near top of page
2. Tooltip appears above element ✓
3. Tooltip centered on element ✓
4. Arrow points down to element ✓
```

---

## 🎯 TOOLTIP SUMMARY

| Element | Tooltip Explains |
|---------|-----------------|
| **Break ?** | Non-bookable period, no slots during break |
| **Seasonal ?** | Date-limited schedule, treated as day off outside range |
| **From** | When bookings start |
| **To** | When bookings stop, last slot ends by this time |
| **Valid from** | First date seasonal schedule is active |
| **Valid until** | Last date seasonal schedule is active |
| **Date Exceptions ?** | Overrides weekly schedule, always takes priority |
| **Type ?** | Day Off vs Special Hours explanation |
| **Notes ?** | Admin-only, not shown to customers |
| **Save ? ** | Weekly schedule only, exceptions save immediately |

---

**Apply this prompt and test all tooltips!** 🚀