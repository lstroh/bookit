TASK 8 OF 9: Dashboard — Packages Section & Customer Profile Packages Tab
Sprint: 4D | Est: 10h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

### PHP files
1. `includes/api/class-customer-packages-api.php` — existing GET /dashboard/customer-packages endpoint; response shape, pagination, filter params
2. `includes/api/class-package-redemption-api.php` — POST /dashboard/package-redemptions endpoint from Task 7; request shape and response
3. `includes/api/class-package-types-api.php` — existing GET /dashboard/package-types endpoint; response shape
4. `includes/api/class-customers-api.php` — GET /dashboard/customers/{id} endpoint; read to understand what fields it already returns and whether packages are included
5. `includes/class-bookit-loader.php` — may need a new dashboard endpoint for customer packages by customer_id; check if existing endpoint already supports this filter

### Vue files
6. `dashboard/src/router/index.js` — existing routes; read in full before adding new routes
7. `dashboard/src/components/Sidebar.vue` — `mainNavigation` and `adminNavigation` arrays; read before adding Packages entry
8. `dashboard/src/views/CustomerProfile.vue` — existing tabs (Booking History, Payment History); read in full before adding Packages tab
9. `dashboard/src/views/Customers.vue` — read for list view patterns (loading state, error state, pagination, filter UI)
10. `dashboard/src/composables/useApi.js` — `api.get()` / `api.post()` signature and error handling pattern
11. `dashboard/src/components/ErrorState.vue` — error display component usage
12. `dashboard/src/components/TableSkeleton.vue` — loading skeleton usage
13. `dashboard/src/views/Reports.vue` OR `dashboard/src/views/Staff.vue` — any view with an admin-only guard at the top (`requiresAdmin` meta check pattern)
14. `vite.config.js` — confirm `base: ''` is set; do not change it

If any file does not exist, stop and report back before proceeding.

Note: Before implementing any Vue 3 Composition API features, use Context7 to resolve 'Vue 3' and confirm current `<script setup>`, `ref`, `watch`, `onMounted` patterns.

---

## CONTEXT

Task 8 delivers two things: (1) a new standalone **Packages** page in the business dashboard — an admin-only list view of all customer packages with filtering, status badges, and a manual redemption action; and (2) a new **Packages tab** on the existing Customer Profile page showing that customer's package history. Both views are read-focused — package creation and purchase remain in the wizard/Stripe flow. The manual redemption button on the Packages page calls the Task 7 endpoint. No new PHP backend work is needed — all required endpoints already exist.

---

## IMPLEMENTATION REQUIREMENTS

### PHP — `includes/api/class-customer-packages-api.php` — MODIFY (minor)

Read the file before modifying. Check whether the existing `GET /dashboard/customer-packages` endpoint already accepts a `customer_id` filter param. If it does, no change needed. If it does not, add an optional `customer_id` integer filter to the list handler so the Customer Profile Packages tab can fetch packages for a specific customer:

```php
if ( ! empty( $request->get_param('customer_id') ) ) {
    $where_clauses[] = 'cp.customer_id = %d';
    $where_values[]  = absint( $request->get_param('customer_id') );
}
```

Only add this if missing. Do not change any other logic.

---

### Vue — `dashboard/src/views/Packages.vue` — CREATE

**Purpose:** Admin-only list view of all customer packages.

**File structure:** Follow the same `<script setup>` + `<template>` pattern as `Customers.vue`. Read `Customers.vue` in full and replicate its loading/error/pagination/filter structure.

**Script setup refs:**
```js
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const packages = ref([])
const filters = ref({ status: '', per_page: 25 })
const pagination = ref({ total: 0, per_page: 25, current_page: 1, total_pages: 1 })
const searchQuery = ref('')
const redeemingId = ref(null)   // tracks which row has redeem in progress
const redeemError = ref('')
const redeemSuccess = ref('')
```

**Data fetch:** `GET /dashboard/customer-packages` with params: `page`, `per_page`, `status` (filter), `search` (if provided — check if the endpoint supports search; if not, omit).

**Table columns:**
- Customer name (link to `/customers/{customer_id}`)
- Package type name
- Sessions remaining / total (e.g. "3 / 5")
- Status badge (active = green, exhausted = gray, expired = amber, cancelled = red)
- Purchase date (formatted)
- Expires (formatted date or "Never")
- Actions: "Redeem Session" button (only when `status === 'active'` and `sessions_remaining > 0`)

**Redeem Session button behaviour:**
- On click: prompt `confirm('Redeem one session from this package against booking ID:')` — use a simple `window.prompt()` to ask for a `booking_id` integer. If user cancels or enters non-numeric: abort.
- Call `POST /dashboard/package-redemptions` with `{ customer_package_id: row.id, booking_id: parseInt(input), notes: '' }`.
- On success: show inline success message, reload the packages list.
- On error: show inline error message with the error code/message from the response.
- Set `redeemingId.value = row.id` during the request; clear after.

**Filters:** Status dropdown (`all`, `active`, `exhausted`, `expired`, `cancelled`). Triggers re-fetch on change (debounced 300ms or immediate — follow `Customers.vue` pattern).

**Pagination:** Follow `Customers.vue` pagination pattern exactly.

**Empty state:** "No packages found." with a sub-message "Customer packages will appear here once customers purchase session bundles."

**Admin guard:** At the top of `onMounted`, check `isAdmin` (follow the pattern from an existing admin-only view). If not admin, redirect to `/`.

---

### Vue — `dashboard/src/views/CustomerProfile.vue` — MODIFY

Read the file in full before modifying.

**Add a third tab button** alongside "Booking History" and "Payment History":

```html
<button
  class="px-3 py-1.5 text-sm font-medium rounded-lg"
  :class="activeTab === 'packages' ? 'bg-primary-600 text-white' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'"
  @click="activeTab = 'packages'"
>
  Packages
</button>
```

**Add packages data ref and fetch logic** in `<script setup>`:

```js
const customerPackages = ref([])
const packagesLoading = ref(false)
const packagesError = ref('')

const loadCustomerPackages = async () => {
  packagesLoading.value = true
  packagesError.value = ''
  try {
    const response = await api.get(`/dashboard/customer-packages?customer_id=${route.params.id}&per_page=50`)
    customerPackages.value = response.data?.packages || response.data || []
  } catch (err) {
    packagesError.value = 'Failed to load packages.'
  } finally {
    packagesLoading.value = false
  }
}
```

Call `loadCustomerPackages()` inside the existing `onMounted` (after the customer data fetch), OR call it lazily when `activeTab` switches to `'packages'` — use a `watch` on `activeTab`:

```js
watch(activeTab, (tab) => {
  if (tab === 'packages' && customerPackages.value.length === 0 && !packagesError.value) {
    loadCustomerPackages()
  }
})
```

**Add packages tab content panel** inside the tab content section:

```html
<div v-if="activeTab === 'packages'" class="p-4 sm:p-6">
  <div v-if="packagesLoading" class="text-sm text-gray-500">Loading packages...</div>
  <div v-else-if="packagesError" class="text-sm text-red-600">{{ packagesError }}</div>
  <div v-else-if="!customerPackages.length" class="text-sm text-gray-600">
    No packages found for this customer.
  </div>
  <div v-else class="space-y-2">
    <div
      v-for="pkg in customerPackages"
      :key="pkg.id"
      class="rounded-lg border border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      <div class="text-sm text-gray-700">
        <div class="font-medium text-gray-900">{{ pkg.package_type_name }}</div>
        <div>{{ pkg.sessions_remaining }} / {{ pkg.sessions_total }} sessions remaining</div>
        <div v-if="pkg.expires_at" class="text-xs text-gray-500">
          Expires {{ formatDate(pkg.expires_at) }}
        </div>
      </div>
      <span
        class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
        :class="{
          'bg-green-100 text-green-800': pkg.status === 'active',
          'bg-gray-100 text-gray-600': pkg.status === 'exhausted',
          'bg-amber-100 text-amber-800': pkg.status === 'expired',
          'bg-red-100 text-red-700': pkg.status === 'cancelled',
        }"
      >
        {{ pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1) }}
      </span>
    </div>
  </div>
</div>
```

Do not modify any other part of `CustomerProfile.vue`. Do not change existing tab behaviour, stats, or edit form.

---

### Vue — `dashboard/src/router/index.js` — MODIFY

Read the file in full before modifying.

Add the Packages route in the admin-only section (after the Customers routes):

```js
{
  path: '/packages',
  name: 'Packages',
  component: () => import('../views/Packages.vue'),
  meta: { title: 'Packages', requiresAdmin: true }
},
```

---

### Vue — `dashboard/src/components/Sidebar.vue` — MODIFY

Read the file in full before modifying.

In the `adminNavigation` array (the admin-only section), add a Packages entry. Find the array that contains entries like Customers, Reports, etc. and add:

```js
{ name: 'packages', path: '/packages', icon: '🎟️', label: 'Packages' },
```

Place it after the Customers entry and before Reports (or use best judgement based on existing order). Do not change any other navigation items.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new PHP files needed (all endpoints exist from Tasks 2, 3, 7)
- [ ] No new migrations
- [ ] No new error codes
- [ ] New Vue route added to `router/index.js`
- [ ] New sidebar nav item added to `Sidebar.vue` admin section
- [ ] `bookit_staff` role blocked from Packages page (admin guard in `onMounted`)

---

## PHPUNIT REQUIREMENTS

Baseline: 663 tests, 0 failures — must not regress.

No new PHPUnit test file required for this task — it is purely frontend. However, if the `customer_id` filter was added to `class-customer-packages-api.php`, add tests for it in the existing `tests/unit/test-customer-packages-api.php`:

- `test_list_filters_by_customer_id` — GET with `customer_id` param returns only packages for that customer
- `test_list_customer_id_filter_excludes_other_customers` — packages for a different customer are not in the response

Add these two tests only if the `customer_id` filter was missing and you added it. If the filter already existed with tests, skip.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass (663+ tests, 0 failures). Report the final count.

---

## ACCEPTANCE CRITERIA

### Functional — Packages page
- [ ] `/packages` route is accessible to admin users
- [ ] `/packages` redirects non-admin users to `/`
- [ ] Packages list loads from `GET /dashboard/customer-packages`
- [ ] Status filter works (active / exhausted / expired / cancelled / all)
- [ ] Each row shows: customer name (linked), package type, sessions remaining/total, status badge, purchase date, expiry
- [ ] "Redeem Session" button only visible on active packages with `sessions_remaining > 0`
- [ ] Clicking "Redeem Session" prompts for booking_id, calls POST /dashboard/package-redemptions, shows success/error inline
- [ ] After successful redemption: `sessions_remaining` updates (list reloads)
- [ ] Pagination works when more than `per_page` packages exist
- [ ] Empty state shows when no packages exist

### Functional — Customer Profile Packages tab
- [ ] "Packages" tab button visible on Customer Profile page
- [ ] Clicking Packages tab loads customer's packages from `GET /dashboard/customer-packages?customer_id={id}`
- [ ] Each package shows: type name, sessions remaining/total, status badge, expiry date (or blank if null)
- [ ] Empty state "No packages found for this customer." when customer has no packages
- [ ] Packages tab does not load data until the tab is first clicked (lazy load)

### Technical
- [ ] No JavaScript console errors
- [ ] No PHP warnings or notices
- [ ] `base: ''` in vite.config.js is unchanged
- [ ] `npm run build` runs without errors after all Vue changes
- [ ] PHPUnit suite passes (663+ tests, 0 failures)

### Must NOT break
- [ ] CustomerProfile.vue existing Booking History and Payment History tabs
- [ ] Customers list view
- [ ] Existing sidebar navigation items
- [ ] All existing Vue routes

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 8: Dashboard Packages section & Customer Profile packages tab

- Add Packages.vue: admin-only list view of all customer packages with
  status filter, pagination, status badges, and manual redeem action
  (calls POST /dashboard/package-redemptions via window.prompt for booking_id)
- Add /packages route to router/index.js (requiresAdmin: true)
- Add Packages nav item to Sidebar.vue admin section
- Add Packages tab to CustomerProfile.vue with lazy load on first click;
  fetches GET /dashboard/customer-packages?customer_id={id}
- Add customer_id filter to class-customer-packages-api.php if missing

Tests: [N] passing, 0 failures
```

---

After implementation, run:
```
npm run build
```
in `bookit-booking-system/dashboard/` — the dist/ directory is gitignored and the build must be run manually in Local by Flywheel after Cursor completes its changes.

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.