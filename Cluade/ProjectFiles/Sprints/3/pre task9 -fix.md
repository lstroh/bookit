# 🚨 EXCELLENT CATCH! Security Issue Found

You're absolutely right! The frontend is showing Edit/Delete buttons to non-admin users even though the backend will reject them with 403 errors.

---

## 🐛 THE PROBLEM

**Current behavior:**
- Staff user sees Services and Categories pages ✓ (They need to see services for booking creation)
- Staff user sees "Edit" and "Delete" buttons ❌ (Should be hidden!)
- Staff user clicks "Edit" → Gets 403 error ❌ (Confusing UX)

**Correct behavior:**
- Staff user sees Services and Categories pages ✓ (Read-only view)
- Staff user does NOT see "Edit" and "Delete" buttons ✓
- Staff user does NOT see "+ New Service/Category" buttons ✓
- Admin sees everything ✓

---

## 🔧 CURSOR PROMPT TO FIX

```markdown
# Fix: Hide Admin-Only Actions from Staff Users

Staff users should have read-only access to Services and Categories pages. Hide create, edit, and delete actions for non-admin users.

## Issue
Currently staff users can see Edit/Delete buttons on Services and Categories pages, even though the backend rejects these actions with 403 errors. This creates poor UX.

## Solution
Check user role in frontend and hide admin-only actions.

## Part 1: Add Role Check to Services Page

Update `dashboard/src/views/Services.vue`:

### Add computed property for admin check

Add this after existing computed properties (around line 40):

```javascript
const isAdmin = computed(() => {
  return window.BOOKIT_DASHBOARD?.staff?.role === 'admin'
})
```

### Hide "New Service" button from staff

Find the header section (around line 5) and update:

**Change this:**
```vue
<button
  @click="openCreateModal"
  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Service
</button>
```

**To this:**
```vue
<button
  v-if="isAdmin"
  @click="openCreateModal"
  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Service
</button>
```

### Hide Edit/Delete actions from staff

Find the actions column in the table (around line 200):

**Change this:**
```vue
<!-- Actions -->
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <button
    @click="openEditModal(service)"
    class="text-primary-600 hover:text-primary-900 mr-3"
  >
    Edit
  </button>
  <button
    @click="confirmDelete(service)"
    class="text-red-600 hover:text-red-900"
  >
    Delete
  </button>
</td>
```

**To this:**
```vue
<!-- Actions -->
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <span v-if="!isAdmin" class="text-xs text-gray-400">View only</span>
  <template v-else>
    <button
      @click="openEditModal(service)"
      class="text-primary-600 hover:text-primary-900 mr-3"
    >
      Edit
    </button>
    <button
      @click="confirmDelete(service)"
      class="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  </template>
</td>
```

### Update empty state button

Find the empty state (around line 95) and update:

**Change this:**
```vue
<button
  @click="openCreateModal"
  class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Service
</button>
```

**To this:**
```vue
<button
  v-if="isAdmin"
  @click="openCreateModal"
  class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Service
</button>
<p v-else class="mt-2 text-sm text-gray-500">
  Contact your administrator to add services.
</p>
```

## Part 2: Add Role Check to Categories Page

Update `dashboard/src/views/Categories.vue`:

### Add computed property for admin check

Add this after existing computed properties:

```javascript
const isAdmin = computed(() => {
  return window.BOOKIT_DASHBOARD?.staff?.role === 'admin'
})
```

### Hide "New Category" button from staff

Find the header section and update:

**Change this:**
```vue
<button
  @click="openCreateModal"
  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Category
</button>
```

**To this:**
```vue
<button
  v-if="isAdmin"
  @click="openCreateModal"
  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Category
</button>
```

### Hide Edit/Delete actions from staff

Find the actions column in the table:

**Change this:**
```vue
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
```

**To this:**
```vue
<!-- Actions -->
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <span v-if="!isAdmin" class="text-xs text-gray-400">View only</span>
  <template v-else>
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
  </template>
</td>
```

### Update empty state button

Find the empty state and update:

**Change this:**
```vue
<button
  @click="openCreateModal"
  class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Category
</button>
```

**To this:**
```vue
<button
  v-if="isAdmin"
  @click="openCreateModal"
  class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
>
  + New Category
</button>
<p v-else class="mt-2 text-sm text-gray-500">
  Contact your administrator to add categories.
</p>
```

## Part 3: Optional - Hide Filters from Staff (If Desired)

If you want staff to have even simpler read-only view, you can hide filters too:

**In both Services.vue and Categories.vue:**

Wrap the filters section with `v-if="isAdmin"`:

```vue
<!-- Filters -->
<div v-if="isAdmin" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
  <!-- ... existing filter content ... -->
</div>
```

**Note:** I recommend keeping filters visible for staff so they can search/filter services when creating bookings.

## Testing

### Test 1: Admin User Access
1. Login as admin
2. Go to Services page
3. See "+ New Service" button ✓
4. See Edit/Delete buttons on each row ✓
5. Can create, edit, delete services ✓

### Test 2: Staff User Access (Services)
1. Login as staff user
2. Go to Services page
3. NO "+ New Service" button ✓
4. NO Edit/Delete buttons ✓
5. See "View only" in actions column ✓
6. Can still see all services (needed for bookings) ✓
7. Can still use filters ✓

### Test 3: Staff User Access (Categories)
1. Login as staff user
2. Go to Categories page
3. NO "+ New Category" button ✓
4. NO Edit/Delete buttons ✓
5. See "View only" in actions column ✓
6. Can still see all categories ✓

### Test 4: Empty State Messages
1. Login as staff user
2. Filter services/categories to show none
3. Empty state shows "Contact administrator" message ✓
4. No create button shown ✓

### Test 5: Backend Still Protected
1. Login as staff
2. Try to call create API directly in console:
```javascript
fetch('/wp-json/bookit/v1/dashboard/services/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({name: 'Test', duration: 30, price: 20})
}).then(r => r.json()).then(console.log)
```
3. Should get 403 Forbidden ✓
4. Backend protection still works ✓

## Expected Behavior

**Admin View:**
- Full access to create, edit, delete
- All buttons visible
- Complete control

**Staff View:**
- Read-only access
- Can view all services/categories (needed for bookings)
- Can use search/filters
- No action buttons
- "View only" text in actions column
- Helpful message in empty states

## Notes

- Backend permissions still enforced (defense in depth)
- Staff can still view services (required for booking creation in Task 5)
- Filters remain available to staff (helpful for finding services)
- UI now matches backend permissions
- Better UX - no confusing 403 errors
- Clear "View only" indication
```

---

## ✅ AFTER APPLYING THE FIX

**Test as staff user:**

1. **Services page:**
   - ❌ No "+ New Service" button
   - ❌ No Edit/Delete buttons
   - ✓ See all services (can read)
   - ✓ Can search/filter
   - ✓ "View only" in actions column

2. **Categories page:**
   - ❌ No "+ New Category" button
   - ❌ No Edit/Delete buttons
   - ✓ See all categories (can read)
   - ✓ Can search/filter
   - ✓ "View only" in actions column

3. **Backend still protected:**
   - Try API calls directly → 403 error ✓

---

## 🎯 WHY THIS IS IMPORTANT

**Security Layers:**
1. ✅ **Backend:** 403 errors (already working)
2. ✅ **Frontend:** Hide buttons (fixing now)

**Why both?**
- Backend = real security (can't be bypassed)
- Frontend = UX (don't show unusable features)
- **Defense in depth** = both layers working together

---

**Apply this fix now!** Then test with both admin and staff users. 🔒

Let me know when it's working correctly!