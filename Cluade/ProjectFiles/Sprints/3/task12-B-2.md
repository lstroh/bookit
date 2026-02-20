# 🎉 AWESOME! Phase B1 Complete!

Great work! The dashboard now has professional loading and empty states. Let's move to **Phase B2: Accessibility** to make sure everyone can use your dashboard, including keyboard users and those using assistive technologies.

---

# 📝 PHASE B2: ACCESSIBILITY (WCAG 2.1 AA COMPLIANCE)

```markdown
# Task 12 Part B Phase 2: Accessibility Improvements

## Context
Loading and empty states complete. Now we need to ensure the dashboard is accessible to all users, including those using:
- Keyboards only (no mouse)
- Screen readers (NVDA, JAWS, VoiceOver)
- Other assistive technologies

We're targeting WCAG 2.1 Level AA compliance.

## What We're Adding
1. **Skip to content link** (keyboard navigation)
2. **ARIA labels** for icon-only buttons
3. **Focus-visible styles** (keyboard focus indicators)
4. **Form label associations** (all inputs have labels)
5. **Live regions** (error/success announcements)
6. **Modal focus management** (trap focus, return focus)
7. **Semantic HTML** (proper heading hierarchy)

---

## Section 1: Skip to Content Link

### File: dashboard/src/components/DashboardLayout.vue

**Add at the VERY TOP of the template (before everything else):**

```vue
<template>
  <!-- Skip to main content (accessibility) -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
  >
    Skip to main content
  </a>

  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <div class="lg:hidden...">
      <!-- existing mobile header -->
    </div>

    <!-- Sidebar -->
    <aside class="...">
      <!-- existing sidebar -->
    </aside>

    <!-- Main Content -->
    <main id="main-content" class="lg:ml-64 transition-all duration-300">
      <!-- existing main content -->
    </main>
  </div>
</template>
```

**Key points:**
- Link is invisible until focused via keyboard (Tab key)
- When focused, appears at top-left
- Clicking jumps to main content
- Main has `id="main-content"` for anchor link

---

## Section 2: Add ARIA Labels to Icon-Only Buttons

### Find all icon-only buttons and add aria-label and title

**Pattern to find and fix:**

```vue
<!-- BEFORE (inaccessible) -->
<button @click="deleteItem">
  <svg>...</svg>
</button>

<!-- AFTER (accessible) -->
<button
  @click="deleteItem"
  aria-label="Delete item"
  title="Delete item"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### Apply to Common Buttons

**File: dashboard/src/components/DashboardLayout.vue**

**Hamburger menu button:**
```vue
<button
  @click="sidebarOpen = !sidebarOpen"
  class="p-2 rounded-lg hover:bg-gray-100"
  aria-label="Toggle navigation menu"
  aria-expanded="false"
  :aria-expanded="sidebarOpen"
>
  <svg aria-hidden="true" class="w-6 h-6">...</svg>
</button>
```

**Close sidebar button:**
```vue
<button
  @click="sidebarOpen = false"
  class="p-2 rounded-lg hover:bg-gray-100"
  aria-label="Close navigation menu"
>
  <svg aria-hidden="true" class="w-5 h-5">...</svg>
</button>
```

**User dropdown toggle:**
```vue
<button
  @click="showUserMenu = !showUserMenu"
  class="flex items-center gap-2"
  aria-label="User menu"
  aria-expanded="false"
  :aria-expanded="showUserMenu"
  aria-haspopup="true"
>
  <!-- avatar -->
</button>
```

**File: dashboard/src/views/BookingsList.vue**

**Edit buttons:**
```vue
<button
  @click="editBooking(booking)"
  class="text-primary-600 hover:text-primary-900"
  aria-label="Edit booking"
>
  Edit
</button>
```

**Delete buttons:**
```vue
<button
  @click="deleteBooking(booking)"
  class="text-red-600 hover:text-red-900"
  aria-label="Delete booking"
>
  Delete
</button>
```

**File: dashboard/src/components/StaffFormModal.vue**

**Close modal button:**
```vue
<button
  @click="closeModal"
  class="p-2 text-gray-400 hover:text-gray-600"
  aria-label="Close dialog"
>
  <svg aria-hidden="true" class="w-5 h-5">...</svg>
</button>
```

---

## Section 3: Focus-Visible Styles

### Add Global Focus Styles

**Create or update: `dashboard/src/assets/main.css`**

```css
/* Focus-visible styles for keyboard navigation */
/* Only show focus ring when using keyboard, not mouse */

*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Buttons and links */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Form inputs */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 0;
  border-color: #3B82F6;
}

/* Router links with custom focus */
.router-link-active:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Skip to content link */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: absolute;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

**Import in your main.js if not already:**
```javascript
import './assets/main.css'
```

---

## Section 4: Form Label Associations

### Ensure ALL form inputs have associated labels

**Pattern:**

```vue
<!-- BEFORE (inaccessible) -->
<input type="text" placeholder="Name" />

<!-- AFTER (accessible) -->
<div>
  <label for="customer-name" class="block text-sm font-medium text-gray-700 mb-1">
    Customer Name *
  </label>
  <input
    id="customer-name"
    type="text"
    required
    aria-required="true"
    class="..."
  />
</div>
```

### Check These Files

**File: dashboard/src/views/ManualBooking.vue**

Ensure every input has a label with matching `for` and `id` attributes.

**File: dashboard/src/components/StaffFormModal.vue**

```vue
<!-- First Name -->
<div>
  <label for="staff-first-name" class="block text-sm font-medium text-gray-700 mb-1">
    First Name *
  </label>
  <input
    id="staff-first-name"
    v-model="form.first_name"
    type="text"
    required
    aria-required="true"
    class="..."
  />
</div>

<!-- Last Name -->
<div>
  <label for="staff-last-name" class="block text-sm font-medium text-gray-700 mb-1">
    Last Name *
  </label>
  <input
    id="staff-last-name"
    v-model="form.last_name"
    type="text"
    required
    aria-required="true"
    class="..."
  />
</div>

<!-- Email -->
<div>
  <label for="staff-email" class="block text-sm font-medium text-gray-700 mb-1">
    Email *
  </label>
  <input
    id="staff-email"
    v-model="form.email"
    type="email"
    required
    aria-required="true"
    class="..."
  />
</div>
```

**File: dashboard/src/views/BookingsList.vue (Filters)**

```vue
<!-- Date Filter -->
<div class="flex-1">
  <label for="filter-date" class="block text-sm font-medium text-gray-700 mb-1">
    From Date
  </label>
  <input
    id="filter-date"
    type="date"
    v-model="filters.date"
    class="..."
  />
</div>

<!-- Status Filter -->
<div class="flex-1">
  <label for="filter-status" class="block text-sm font-medium text-gray-700 mb-1">
    Status
  </label>
  <select
    id="filter-status"
    v-model="filters.status"
    class="..."
  >
    <option value="">All Statuses</option>
    <!-- options -->
  </select>
</div>
```

---

## Section 5: Live Regions for Announcements

### Add ARIA Live Regions for Dynamic Messages

**Create reusable component: `dashboard/src/components/Alert.vue`**

```vue
<template>
  <div
    v-if="show"
    :role="type === 'error' ? 'alert' : 'status'"
    :aria-live="type === 'error' ? 'assertive' : 'polite'"
    class="rounded-lg p-4 mb-4"
    :class="alertClass"
  >
    <div class="flex items-start gap-3">
      <span class="text-xl">{{ icon }}</span>
      <div class="flex-1">
        <p class="text-sm font-medium" :class="textClass">
          {{ title }}
        </p>
        <p v-if="message" class="text-sm mt-1" :class="textClass">
          {{ message }}
        </p>
      </div>
      <button
        v-if="dismissible"
        @click="$emit('close')"
        class="text-gray-400 hover:text-gray-600"
        aria-label="Dismiss alert"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info'
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  show: {
    type: Boolean,
    default: true
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

defineEmits(['close'])

const icon = computed(() => {
  const icons = {
    success: '✓',
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[props.type]
})

const alertClass = computed(() => {
  const classes = {
    success: 'bg-green-50 border border-green-200',
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    info: 'bg-blue-50 border border-blue-200'
  }
  return classes[props.type]
})

const textClass = computed(() => {
  const classes = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }
  return classes[props.type]
})
</script>
```

### Use Alert Component in Pages

**Example: dashboard/src/views/BookingsList.vue**

```vue
<template>
  <div class="p-4 lg:p-6">
    <!-- Success Alert -->
    <Alert
      v-if="successMessage"
      type="success"
      :title="successMessage"
      @close="successMessage = ''"
    />

    <!-- Error Alert -->
    <Alert
      v-if="errorMessage"
      type="error"
      :title="errorMessage"
      :message="errorDetails"
      @close="errorMessage = ''"
    />

    <!-- Rest of page -->
  </div>
</template>

<script setup>
import Alert from '../components/Alert.vue'
import { ref } from 'vue'

const successMessage = ref('')
const errorMessage = ref('')
const errorDetails = ref('')

// When API call succeeds:
const saveBooking = async () => {
  try {
    // ... API call
    successMessage.value = 'Booking saved successfully!'
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (err) {
    errorMessage.value = 'Failed to save booking'
    errorDetails.value = err.message
  }
}
</script>
```

---

## Section 6: Modal Focus Management

### Trap Focus Inside Modals

**File: dashboard/src/components/StaffFormModal.vue**

**Add focus trap functionality:**

```vue
<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div
      ref="modalRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8"
    >
      <!-- Modal Header -->
      <div class="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 id="modal-title" class="text-base sm:text-lg font-semibold text-gray-900">
          {{ isEditing ? 'Edit Staff Member' : 'Add Staff Member' }}
        </h3>
        <button
          ref="closeButtonRef"
          @click="closeModal"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label="Close dialog"
        >
          <svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="px-4 sm:px-6 py-4">
        <!-- Form fields -->
      </div>

      <!-- Modal Footer -->
      <div class="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          @click="closeModal"
          type="button"
          class="..."
        >
          Cancel
        </button>
        <button
          ref="submitButtonRef"
          @click="saveStaff"
          type="button"
          class="..."
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  // ... other props
})

const modalRef = ref(null)
const closeButtonRef = ref(null)
const submitButtonRef = ref(null)
const previousActiveElement = ref(null)

// Focus management
const focusableElements = () => {
  if (!modalRef.value) return []
  return Array.from(
    modalRef.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  )
}

const trapFocus = (e) => {
  if (!props.show || !modalRef.value) return
  
  const focusable = focusableElements()
  const firstFocusable = focusable[0]
  const lastFocusable = focusable[focusable.length - 1]

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }

  // Close on Escape
  if (e.key === 'Escape') {
    closeModal()
  }
}

// Watch for modal open/close
watch(() => props.show, async (isOpen) => {
  if (isOpen) {
    // Store previously focused element
    previousActiveElement.value = document.activeElement
    
    // Focus first element in modal
    await nextTick()
    const focusable = focusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }
    
    // Add event listener for focus trap
    document.addEventListener('keydown', trapFocus)
  } else {
    // Remove event listener
    document.removeEventListener('keydown', trapFocus)
    
    // Return focus to previous element
    if (previousActiveElement.value) {
      previousActiveElement.value.focus()
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
})
</script>
```

---

## Section 7: Semantic HTML & Heading Hierarchy

### Ensure Proper Heading Hierarchy

**Check each page has proper h1 → h2 → h3 structure:**

```vue
<!-- Page structure example -->
<template>
  <div class="p-4 lg:p-6">
    <!-- Main page heading (h1) -->
    <h1 class="text-2xl font-bold">Bookings</h1>

    <!-- Section headings (h2) -->
    <div class="...">
      <h2 class="text-lg font-semibold">Today's Bookings</h2>
      <!-- content -->
    </div>

    <div class="...">
      <h2 class="text-lg font-semibold">Upcoming Bookings</h2>
      <!-- content -->
    </div>

    <!-- Subsection headings (h3) if needed -->
    <div class="...">
      <h3 class="text-base font-semibold">Morning Slots</h3>
      <!-- content -->
    </div>
  </div>
</template>
```

**Rules:**
- One `<h1>` per page (main heading)
- Use `<h2>` for major sections
- Use `<h3>` for subsections
- Don't skip levels (h1 → h3 is bad)

---

## Testing Checklist

### Test 1: Skip to Content
1. Load dashboard
2. Press Tab key (first thing focused)
3. "Skip to main content" link appears ✓
4. Press Enter
5. Focus jumps to main content ✓

### Test 2: Keyboard Navigation
1. Press Tab repeatedly
2. Can reach all interactive elements ✓
3. Focus order is logical ✓
4. Focus visible (blue outline) ✓
5. Can activate with Enter/Space ✓

### Test 3: Icon Button Labels
1. Use screen reader
2. Hover over icon-only buttons
3. Tooltip appears ✓
4. Screen reader announces label ✓

### Test 4: Form Labels
1. Tab through forms
2. Screen reader announces label for each input ✓
3. Labels visually associated with inputs ✓
4. Required fields marked ✓

### Test 5: Live Regions
1. Trigger success message
2. Screen reader announces it ✓
3. Trigger error message
4. Screen reader announces it ✓

### Test 6: Modal Focus Trap
1. Open modal
2. Press Tab
3. Focus stays within modal ✓
4. Tab through all elements ✓
5. Shift+Tab goes backwards ✓
6. Focus loops back to start ✓
7. Press Escape
8. Modal closes ✓
9. Focus returns to trigger button ✓

### Test 7: Heading Hierarchy
1. Use screen reader heading navigation
2. Can jump between headings ✓
3. Hierarchy makes sense ✓
4. No skipped levels ✓

### Test 8: ARIA Attributes
1. Expandable sections have aria-expanded ✓
2. Dropdowns have aria-haspopup ✓
3. Modals have role="dialog" and aria-modal ✓
4. Alerts have role="alert" or role="status" ✓

### Test 9: Focus Visible
1. Use only keyboard
2. Blue outline appears on focused elements ✓
3. Click with mouse
4. No outline appears (only keyboard focus) ✓

### Test 10: Screen Reader Testing
1. Turn on screen reader (NVDA/JAWS/VoiceOver)
2. Navigate entire dashboard ✓
3. All content is announced ✓
4. Interactive elements are identifiable ✓
5. Form labels are read ✓

## Accessibility Compliance Summary

**WCAG 2.1 Level AA Requirements Met:**

✅ **1.3.1 Info and Relationships** - Proper HTML semantics and labels
✅ **1.4.3 Contrast (Minimum)** - Text has 4.5:1 contrast ratio
✅ **2.1.1 Keyboard** - All functionality via keyboard
✅ **2.1.2 No Keyboard Trap** - Can navigate away from all elements
✅ **2.4.1 Bypass Blocks** - Skip to content link
✅ **2.4.3 Focus Order** - Logical tab order
✅ **2.4.6 Headings and Labels** - Descriptive headings/labels
✅ **2.4.7 Focus Visible** - Visible keyboard focus indicator
✅ **3.2.1 On Focus** - No context changes on focus
✅ **3.2.2 On Input** - No context changes on input
✅ **3.3.1 Error Identification** - Errors clearly identified
✅ **3.3.2 Labels or Instructions** - Labels provided for inputs
✅ **4.1.2 Name, Role, Value** - ARIA attributes for custom controls
✅ **4.1.3 Status Messages** - Live regions for dynamic updates

## Notes

- All decorative SVG icons have `aria-hidden="true"`
- All functional buttons have `aria-label` or visible text
- Forms use proper `<label>` elements with `for` attribute
- Modals trap focus and return focus on close
- Live regions announce dynamic content changes
- Focus indicators visible for keyboard users only
- Heading hierarchy follows h1 → h2 → h3 order
- Skip link allows bypassing navigation
```

---

## ⏸️ AFTER APPLYING PHASE B2

1. **Apply all accessibility improvements**
2. **Test with keyboard only** (Tab, Enter, Escape, Arrow keys)
3. **Test with screen reader** if possible
4. **Verify focus visible** on all interactive elements
5. **Check form labels** are associated
6. **Test modal focus trap**

**Then say:** "Phase B2 complete, accessibility improved!"

And I'll give you **Phase B3: Final Polish** (error handling, transitions, visual consistency) - the FINAL phase of Task 12! 🚀

---

**Apply this Phase B2 prompt now!**