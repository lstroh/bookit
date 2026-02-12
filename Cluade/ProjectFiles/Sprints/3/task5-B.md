# 🎉 Great! Ready for Part B: Customer Selection UI

Part B will create the **customer selection/creation step** of the booking wizard.

---

# 📝 PART B: CUSTOMER SELECTION (Cursor Prompt 2)

Copy this into Cursor Composer:

```markdown
# Task 5 Part B: Customer Selection Component

## Context
I'm building a WordPress booking plugin dashboard. Part A (backend API) is complete. Now I need to create a customer selection/creation interface that allows searching for existing customers or creating new ones. This is the first step in the manual booking creation wizard.

## Project Structure

Vue dashboard at: `dashboard/src/`

Backend endpoints (already working from Part A):
- `GET /wp-json/bookit/v1/dashboard/customers/search?search={query}`
- `POST /wp-json/bookit/v1/dashboard/bookings/create`

Existing files:
- API composable: `dashboard/src/composables/useApi.js`
- Bookings view: `dashboard/src/views/Bookings.vue` (triggers "+ New Booking" button)

## Requirements

### 1. Create Customer Selection Component

Create new file `dashboard/src/components/CustomerSelector.vue`:

```vue
<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      Select or Create Customer
    </h3>

    <!-- Search Existing Customer -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Search Existing Customer
      </label>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Type name or email to search..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          @input="onSearchInput"
          @focus="showResults = true"
        />
        <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>

        <!-- Search Results Dropdown -->
        <div
          v-if="showResults && searchQuery.length >= 2"
          class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <!-- Loading -->
          <div v-if="searching" class="px-4 py-3 text-sm text-gray-500">
            Searching...
          </div>

          <!-- No Results -->
          <div v-else-if="searchResults.length === 0" class="px-4 py-3 text-sm text-gray-500">
            No customers found. Create a new customer below.
          </div>

          <!-- Results List -->
          <div v-else>
            <button
              v-for="customer in searchResults"
              :key="customer.id"
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              @click="selectCustomer(customer)"
            >
              <div class="font-medium text-gray-900">
                {{ customer.full_name }}
              </div>
              <div class="text-sm text-gray-500">
                {{ customer.email }}
              </div>
              <div v-if="customer.phone" class="text-sm text-gray-500">
                {{ customer.phone }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Selected Customer Display -->
      <div
        v-if="selectedCustomer && !creatingNew"
        class="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="font-medium text-green-900">
              ✓ {{ selectedCustomer.full_name }}
            </div>
            <div class="text-sm text-green-700">
              {{ selectedCustomer.email }}
            </div>
            <div v-if="selectedCustomer.phone" class="text-sm text-green-700">
              {{ selectedCustomer.phone }}
            </div>
          </div>
          <button
            type="button"
            class="text-sm text-green-600 hover:text-green-800"
            @click="clearSelection"
          >
            Change
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">OR</span>
      </div>
    </div>

    <!-- Create New Customer -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <label class="block text-sm font-medium text-gray-700">
          Create New Customer
        </label>
        <button
          v-if="!creatingNew && !selectedCustomer"
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700"
          @click="creatingNew = true"
        >
          + New Customer
        </button>
      </div>

      <!-- New Customer Form -->
      <div v-if="creatingNew" class="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              v-model="newCustomer.first_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-500': errors.first_name }"
            />
            <p v-if="errors.first_name" class="text-xs text-red-600 mt-1">
              {{ errors.first_name }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              v-model="newCustomer.last_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-500': errors.last_name }"
            />
            <p v-if="errors.last_name" class="text-xs text-red-600 mt-1">
              {{ errors.last_name }}
            </p>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            v-model="newCustomer.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-xs text-red-600 mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            v-model="newCustomer.phone"
            type="tel"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="cancelNewCustomer"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            @click="confirmNewCustomer"
          >
            Use This Customer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const showResults = ref(false)
const selectedCustomer = ref(props.modelValue)
const creatingNew = ref(false)
const newCustomer = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: ''
})
const errors = ref({})

let searchTimeout = null

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedCustomer.value = newVal
})

// Methods
const onSearchInput = () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  // Debounce search
  clearTimeout(searchTimeout)
  searching.value = true

  searchTimeout = setTimeout(async () => {
    try {
      const response = await api.get(`/customers/search?search=${encodeURIComponent(searchQuery.value)}`)
      
      if (response.data.success) {
        searchResults.value = response.data.customers
      }
    } catch (err) {
      console.error('Error searching customers:', err)
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const selectCustomer = (customer) => {
  selectedCustomer.value = customer
  showResults.value = false
  searchQuery.value = ''
  searchResults.value = []
  creatingNew.value = false
  
  // Emit with customer_id for existing customer
  emit('update:modelValue', {
    customer_id: customer.id,
    customer_email: customer.email,
    customer_first_name: customer.first_name,
    customer_last_name: customer.last_name,
    customer_phone: customer.phone,
    is_new: false
  })
}

const clearSelection = () => {
  selectedCustomer.value = null
  searchQuery.value = ''
  searchResults.value = []
  emit('update:modelValue', null)
}

const cancelNewCustomer = () => {
  creatingNew.value = false
  newCustomer.value = {
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  }
  errors.value = {}
}

const confirmNewCustomer = () => {
  // Validate
  errors.value = {}
  
  if (!newCustomer.value.first_name) {
    errors.value.first_name = 'First name is required'
  }
  if (!newCustomer.value.last_name) {
    errors.value.last_name = 'Last name is required'
  }
  if (!newCustomer.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (Object.keys(errors.value).length > 0) {
    return
  }
  
  // Set as selected
  selectedCustomer.value = {
    full_name: `${newCustomer.value.first_name} ${newCustomer.value.last_name}`,
    email: newCustomer.value.email,
    first_name: newCustomer.value.first_name,
    last_name: newCustomer.value.last_name,
    phone: newCustomer.value.phone
  }
  
  // Emit with customer details (no customer_id since new)
  emit('update:modelValue', {
    customer_email: newCustomer.value.email,
    customer_first_name: newCustomer.value.first_name,
    customer_last_name: newCustomer.value.last_name,
    customer_phone: newCustomer.value.phone,
    is_new: true
  })
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showResults.value = false
  }
}

// Lifecycle
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
```

### 2. Update Bookings.vue to Use Modal

Update `dashboard/src/views/Bookings.vue` to show modal when clicking "+ New Booking".

**Find the `createBooking` method** (around line 250) and replace:

```javascript
const createBooking = () => {
  // TODO: Implement in Task 5 - Manual Booking Creation
  alert('Manual booking creation will be implemented in Task 5')
}
```

**Replace with:**

```javascript
const showBookingModal = ref(false)

const createBooking = () => {
  showBookingModal.value = true
}

const closeBookingModal = () => {
  showBookingModal.value = false
}

const handleBookingCreated = (booking) => {
  // Refresh bookings list
  loadBookings(pagination.value.current_page)
  showBookingModal.value = false
  alert(`✓ Booking created successfully!\n\nID: ${booking.id}\nCustomer: ${booking.customer_name}`)
}
```

**Add to the template** (at the end, before `</template>`):

```vue
<!-- Booking Creation Modal -->
<BookingModal
  v-if="showBookingModal"
  @close="closeBookingModal"
  @created="handleBookingCreated"
/>
```

**Add import** at the top of `<script setup>`:

```javascript
import BookingModal from '../components/BookingModal.vue'
```

### 3. Create Booking Modal Component

Create new file `dashboard/src/components/BookingModal.vue`:

```vue
<template>
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <!-- Modal Content -->
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 class="text-xl font-semibold text-gray-900">
          Create New Booking
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4">
        <!-- Step 1: Customer Selection -->
        <div v-if="currentStep === 1">
          <CustomerSelector v-model="bookingData.customer" />
        </div>

        <!-- Step 2-5: Placeholder for Part C -->
        <div v-else-if="currentStep === 2">
          <p class="text-gray-600">Step 2: Service selection will be implemented in Part C</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 sticky bottom-0">
        <button
          v-if="currentStep > 1"
          @click="currentStep--"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <div v-else></div>

        <div class="flex gap-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            v-if="currentStep === 1"
            :disabled="!bookingData.customer"
            @click="nextStep"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Select Service →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CustomerSelector from './CustomerSelector.vue'

defineEmits(['close', 'created'])

const currentStep = ref(1)
const bookingData = ref({
  customer: null,
  service: null,
  staff: null,
  dateTime: null,
  payment: null
})

const nextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++
  }
}
</script>
```

## Implementation Steps

1. **Create CustomerSelector.vue** component

2. **Create BookingModal.vue** component (wrapper)

3. **Update Bookings.vue** to show modal

4. **Test in browser:**
   - Click "+ New Booking" button
   - Modal should appear
   - See customer selection step

5. **Test customer search:**
   - Type "Alice" in search box
   - Should see matching customers after 300ms
   - Click a customer → shows selected
   - Click "Change" → clears selection

6. **Test new customer:**
   - Click "+ New Customer"
   - Fill in first name, last name, email
   - Click "Use This Customer"
   - Should show as selected

7. **Test validation:**
   - Try to confirm without filling fields
   - Should show error messages

8. **Test "Next" button:**
   - Should be disabled until customer selected
   - After selection, clicking Next should show "Step 2 placeholder"

## Testing Checklist

Part B Frontend Testing:
- [ ] "+ New Booking" button opens modal
- [ ] Modal has close button (×) that works
- [ ] Customer search input shows search icon
- [ ] Typing 2+ characters triggers search (300ms debounce)
- [ ] Search results dropdown appears with matches
- [ ] Clicking customer selects it
- [ ] Selected customer shows in green box
- [ ] "Change" button clears selection
- [ ] "+ New Customer" button shows form
- [ ] New customer form has all fields
- [ ] Form validation works (required fields)
- [ ] Email validation works (format check)
- [ ] "Cancel" button in new customer form works
- [ ] "Use This Customer" button validates and selects
- [ ] "Next" button disabled until customer selected
- [ ] "Next" button advances to Step 2 (placeholder)
- [ ] "Cancel" button in footer closes modal
- [ ] Clicking outside modal does NOT close it (by design)
- [ ] No console errors

## Expected Behavior

**Initial State:**
- Modal opens showing Step 1
- Search box empty
- No customer selected
- "Next" button disabled

**After Searching:**
- Results dropdown shows below search box
- Max 20 results displayed
- Each result shows name, email, phone
- Hover highlights result

**After Selecting Existing:**
- Green box shows customer details
- Search box clears
- Results dropdown closes
- "Next" button enabled

**After Creating New:**
- Blue form shows with 4 fields
- Validation on blur or submit
- Errors show in red under fields
- On success, shows like existing customer

**Step Navigation:**
- Step 2-5 show placeholder text (Part C)
- "Back" button appears after Step 1
- "Cancel" always closes modal

## Notes

- Customer search debounced at 300ms (faster than bookings search)
- Search dropdown z-index: 10 (appears above other content)
- Modal z-index: 50 (appears above everything)
- Modal max height: 90vh (scrollable on small screens)
- Header and footer sticky (stay visible when scrolling)
- Customer data emitted includes `is_new` flag
- Existing customer emits `customer_id`
- New customer emits customer details without `customer_id`
- Part C will use this customer data to create the booking

## Troubleshooting

**Modal doesn't appear:**
- Check `showBookingModal` ref is imported
- Verify BookingModal component imported
- Check z-index conflicts

**Search doesn't work:**
- Check API endpoint `/customers/search` works
- Verify minimum 2 characters entered
- Check debounce timeout (300ms)

**Validation not working:**
- Check error messages display
- Verify email regex is correct
- Ensure required fields checked

**"Next" button stays disabled:**
- Check `bookingData.customer` is set
- Verify v-model binding works
- Console.log the customer data
```

---

## 🧪 TESTING AFTER PART B

Once Cursor completes Part B:

### **Test 1: Open Modal**
```
1. Go to: /bookit-dashboard/app/bookings
2. Click "+ New Booking" button (top right)
3. Modal should open showing "Create New Booking"
4. Should see customer search at top
```

---

### **Test 2: Search Existing Customer**
```
1. Type "Ali" in search box
2. Wait 300ms
3. Should see dropdown with matching customers
4. Click on "Alice Smith"
5. Should show green box with ✓ and customer details
6. "Next" button should be enabled
```

---

### **Test 3: Create New Customer**
```
1. Click "+ New Customer" button
2. Blue form should appear
3. Fill in:
   - First Name: John
   - Last Name: Test
   - Email: john.test@example.com
   - Phone: 07700900999
4. Click "Use This Customer"
5. Should show as selected (like existing customer)
6. "Next" button should be enabled
```

---

### **Test 4: Validation**
```
1. Click "+ New Customer"
2. Click "Use This Customer" without filling fields
3. Should show red error messages:
   - "First name is required"
   - "Last name is required"
   - "Email is required"
4. Fill first name, last name, but enter invalid email "notanemail"
5. Should show "Please enter a valid email"
```

---

### **Test 5: Navigation**
```
1. Select a customer
2. Click "Next: Select Service →"
3. Should show "Step 2: Service selection will be implemented in Part C"
4. "Back" button should appear
5. Click "Back" → returns to customer selection
6. Customer should still be selected
```

---

### **Test 6: Cancel Actions**
```
1. Open modal
2. Click "Cancel" button (footer) → modal closes
3. Open modal again
4. Click X button (top right) → modal closes
5. Open modal, select customer
6. Click "Cancel" → modal closes, booking not created
```

---

## 📝 PART B COMPLETION CHECKLIST

Mark Part B complete when:

- [ ] Modal opens when clicking "+ New Booking"
- [ ] Customer search works with debounce
- [ ] Can select existing customer
- [ ] Can create new customer
- [ ] Form validation works
- [ ] "Next" button disabled/enabled correctly
- [ ] "Back" button works
- [ ] "Cancel" button closes modal
- [ ] X button closes modal
- [ ] Customer data properly structured
- [ ] No console errors

---

## 🎯 AFTER PART B COMPLETE

Once Part B is working:

1. **Test the customer selection flow thoroughly**
2. **Take a screenshot** (optional - modal with customer selected)
3. **Come back and say:** "Part B complete, ready for Part C"

I'll give you the final Part C prompt which includes:
- Service selection
- Staff selection  
- Date & time picker (with availability)
- Payment method selection
- Booking confirmation

---

**Start implementing Part B now!** Let me know when you're done testing! 🚀