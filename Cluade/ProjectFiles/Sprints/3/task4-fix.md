# 🎯 GOOD CATCH! That's a Bug

You've found an inconsistency:

**Current Behavior:**
- ✅ **Table filtering works correctly** (staff only see their bookings)
- ❌ **Staff dropdown shows ALL staff** (should be hidden or show only self)

**Expected Behavior for Staff Role:**
Staff users should either:
1. **Not see the staff filter at all** (recommended), OR
2. See only their own name (less useful)

---

## 🔧 FIX: Hide Staff Filter for Non-Admin Users

This is the cleanest solution. Staff don't need to filter by staff member since they can only see their own bookings anyway.

### **Update Bookings.vue**

Find the Staff Filter section (around line 35-50) and wrap it in a conditional:

```vue
<!-- Staff Filter (Admin Only) -->
<div v-if="isAdmin">
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Staff Member
  </label>
  <select
    v-model="filters.staff_id"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    @change="applyFilters"
  >
    <option value="">All Staff</option>
    <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
      {{ staff.name }}
    </option>
  </select>
</div>
```

### **Add isAdmin Computed Property**

Add this in the `<script setup>` section after the imports:

```javascript
// Get current user role
const currentUser = window.BOOKIT_DASHBOARD.staff
const isAdmin = computed(() => currentUser.role === 'admin')
```

The complete change should look like:

```javascript
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// Get current user role
const currentUser = window.BOOKIT_DASHBOARD.staff
const isAdmin = computed(() => currentUser.role === 'admin')

// State
const loading = ref(true)
// ... rest of your code
```

---

## 📐 ADJUST GRID LAYOUT

Since the staff filter will be hidden for non-admin users, you need to adjust the grid to prevent empty space.

### **Update the Grid Container**

Change this line (around line 20):

```vue
<!-- OLD (5 columns) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

<!-- NEW (dynamic: 5 for admin, 4 for staff) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4"
     :class="isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'">
```

---

## 🎯 COMPLETE FIX (Copy to Cursor)

If you want Cursor to apply the fix, use this prompt:

```markdown
# Fix: Hide Staff Filter for Non-Admin Users

## Issue
Staff users can see all staff members in the dropdown, but they can only see their own bookings in the table. The staff filter should be hidden for non-admin users.

## Solution

Update `dashboard/src/views/Bookings.vue`:

### 1. Add isAdmin Computed Property

In the `<script setup>` section, after the imports and before state declarations:

```javascript
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// Get current user role
const currentUser = window.BOOKIT_DASHBOARD.staff
const isAdmin = computed(() => currentUser.role === 'admin')

// State
const loading = ref(true)
// ... rest continues
```

### 2. Make Grid Responsive to Role

Find the filters grid container (around line 20) and update:

```vue
<!-- Update this line -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4"
     :class="isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'">
```

### 3. Conditionally Show Staff Filter

Find the Staff Filter section (around line 35-50) and wrap it with `v-if="isAdmin"`:

```vue
<!-- Staff Filter (Admin Only) -->
<div v-if="isAdmin">
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Staff Member
  </label>
  <select
    v-model="filters.staff_id"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    @change="applyFilters"
  >
    <option value="">All Staff</option>
    <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
      {{ staff.name }}
    </option>
  </select>
</div>
```

## Testing

After implementing:

**As Admin (admin@test.com):**
- Should see 5 filter dropdowns (Date From, Date To, Staff, Service, Status)
- Can filter by any staff member

**As Staff (emma@example.com):**
- Should see 4 filter dropdowns (Date From, Date To, Service, Status)
- Staff filter is hidden
- Table still only shows their own bookings
```

---

## 🧪 TESTING AFTER FIX

### **Test 1: As Admin**
```
1. Login as admin@test.com
2. Go to Bookings page
3. Should see 5 filters in a row:
   [Date From] [Date To] [Staff Member] [Service] [Status]
4. Staff dropdown should show all staff members
```

### **Test 2: As Staff (Emma)**
```
1. Logout
2. Login as emma@example.com
3. Go to Bookings page
4. Should see 4 filters in a row:
   [Date From] [Date To] [Service] [Status]
5. No Staff filter visible
6. Table shows only Emma's bookings
```

---

## 📊 VISUAL COMPARISON

**Before Fix:**

| User | Filters Visible | Staff Dropdown Shows | Table Shows |
|------|----------------|---------------------|-------------|
| Admin | 5 filters | All staff ✅ | All bookings ✅ |
| Staff | 5 filters ❌ | All staff ❌ | Own bookings only ✅ |

**After Fix:**

| User | Filters Visible | Staff Dropdown Shows | Table Shows |
|------|----------------|---------------------|-------------|
| Admin | 5 filters ✅ | All staff ✅ | All bookings ✅ |
| Staff | 4 filters ✅ | Hidden ✅ | Own bookings only ✅ |

---

## 🎯 WHY THIS IS THE RIGHT FIX

**Alternative Considered:** Show staff filter but only with current user's name
- ❌ Confusing (why show a dropdown with one option?)
- ❌ Wastes screen space
- ❌ Looks like a bug

**Chosen Solution:** Hide staff filter for non-admin
- ✅ Clean and intuitive
- ✅ Saves screen space
- ✅ Matches user's actual permissions
- ✅ Consistent with "need-to-know" UX principle

---

## ✅ AFTER APPLYING FIX

Once you implement the fix:

1. **Test with both user roles** (admin and staff)
2. **Verify filters count** (5 for admin, 4 for staff)
3. **Verify grid layout** looks good on both roles
4. **Confirm no console errors**

Then let me know and I'll provide the **Task 4 completion commit message**! 🎯

Does this make sense? Want me to provide the Cursor prompt, or will you make the change manually?