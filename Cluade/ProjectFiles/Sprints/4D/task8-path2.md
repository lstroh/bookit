TASK 8-PATCH: Packages.vue — Replace window.prompt() with Booking Selection Modal
Sprint: 4D | Est: 2h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/Packages.vue` — read in full; the only file being modified; understand all existing refs, computed properties, and the current `redeemPackage()` function before changing anything
2. `dashboard/src/components/BookingModal.vue` — read in full for the established focus-trap modal pattern (`modalRef`, `trapFocus`, `previousActiveElement`, `onMounted`/`onUnmounted` keyboard listener, `Teleport to="body"`, backdrop overlay, `nextTick` focus management)
3. `dashboard/src/composables/useApi.js` — `api.get()` signature; needed for the new booking fetch call
4. `vite.config.js` — confirm `base: './'` is unchanged; do not modify

If any file does not exist, stop and report back before proceeding.

Note: Before implementing the modal, use Context7 to resolve 'Vue 3' and confirm current `<Teleport>`, `nextTick`, and focus-trap patterns for accessible modals.

---

## CONTEXT

The `redeemPackage()` function in `Packages.vue` currently uses `window.prompt()` to collect a `booking_id`. This patch replaces that with an inline modal that fetches the selected customer's bookings that are not yet linked to a package, displays them in a selectable list, and posts the redemption when the admin confirms. The modal pattern must follow `BookingModal.vue` exactly — same focus trap, same Teleport, same keyboard handling. No other files are touched. No new PHP endpoints are needed — the existing `GET /dashboard/bookings` endpoint already supports filtering by `customer_id`; Cursor must verify this by reading the bookings API controller.

---

## IMPLEMENTATION REQUIREMENTS

### `dashboard/src/views/Packages.vue` — MODIFY ONLY

Read the entire file before writing a single line. Make only the changes described below. Do not restructure any existing code.

---

#### 1. Add new refs for modal state (add alongside existing refs)

```js
// Redeem modal state
const redeemModalOpen = ref(false)
const redeemModalPackage = ref(null)       // the package row being redeemed
const redeemModalBookings = ref([])        // unlinked bookings for this customer
const redeemModalLoading = ref(false)
const redeemModalError = ref('')
const redeemModalSelectedBookingId = ref(null)
const redeemModalSubmitting = ref(false)
const redeemModalRef = ref(null)           // template ref for focus trap
const redeemPreviousActive = ref(null)     // element to restore focus to on close
```

---

#### 2. Replace `redeemPackage(row)` function entirely

Remove the existing `window.prompt()` implementation. Replace with:

```js
async function openRedeemModal(row) {
  redeemError.value = ''
  redeemSuccess.value = ''
  redeemModalPackage.value = row
  redeemModalBookings.value = []
  redeemModalSelectedBookingId.value = null
  redeemModalError.value = ''
  redeemModalSubmitting.value = false
  redeemModalLoading.value = true
  redeemModalOpen.value = true

  // Save focus so we can restore it when the modal closes
  redeemPreviousActive.value = document.activeElement

  try {
    // Fetch this customer's bookings that are not yet linked to a package.
    // Uses customer_id filter + per_page=100 to get a full list.
    // Read the bookings API controller to confirm the correct param names
    // before implementing — do NOT assume param names.
    const response = await api.get(
      `/dashboard/bookings?customer_id=${row.customer_id}&per_page=100`
    )
    const allBookings = response.data?.bookings || response.data || []

    // Filter client-side to only unlinked bookings (customer_package_id is null/0)
    // and non-cancelled/non-no-show statuses
    redeemModalBookings.value = allBookings.filter(b =>
      !b.customer_package_id &&
      b.status !== 'cancelled' &&
      b.status !== 'no_show'
    )

    if (redeemModalBookings.value.length === 0) {
      redeemModalError.value = 'No eligible bookings found for this customer. A booking must exist and not already be linked to a package.'
    }
  } catch (err) {
    redeemModalError.value = err.message || 'Failed to load bookings.'
  } finally {
    redeemModalLoading.value = false
    // Focus the modal after data loads
    await nextTick()
    redeemModalRef.value?.focus()
  }
}

function closeRedeemModal() {
  redeemModalOpen.value = false
  redeemModalPackage.value = null
  redeemModalBookings.value = []
  redeemModalSelectedBookingId.value = null
  redeemModalError.value = ''
  redeemModalSubmitting.value = false
  // Restore focus to the button that triggered the modal
  nextTick(() => redeemPreviousActive.value?.focus())
}

async function submitRedemption() {
  if (!redeemModalSelectedBookingId.value || !redeemModalPackage.value) return

  redeemModalSubmitting.value = true
  redeemModalError.value = ''

  try {
    await api.post('/package-redemptions', {
      customer_package_id: redeemModalPackage.value.id,
      booking_id: redeemModalSelectedBookingId.value,
      notes: ''
    })
    redeemSuccess.value = 'Session redeemed successfully.'
    closeRedeemModal()
    await loadPackages(pagination.value.current_page)
  } catch (err) {
    const code = err.code ? `${err.code}: ` : ''
    redeemModalError.value = `${code}${err.message || 'Failed to redeem session.'}`
  } finally {
    redeemModalSubmitting.value = false
  }
}
```

**Also add a focus-trap keyboard handler** (copy the pattern from `BookingModal.vue`'s `trapFocus` exactly, referencing `redeemModalRef`). Register it with `addEventListener('keydown', trapFocusHandler)` when the modal opens and remove it when it closes. Use `watch(redeemModalOpen, ...)` to manage the listener lifecycle — same pattern as `BookingModal.vue`.

---

#### 3. Update the "Redeem Session" button in the template

Change `@click="redeemPackage(pkg)"` to `@click="openRedeemModal(pkg)"`. No other change to the button.

---

#### 4. Add the modal markup (inside `<template>`, after the main table section)

Use `<Teleport to="body">` wrapping a `v-if="redeemModalOpen"` modal. Follow `BookingModal.vue`'s structure exactly for the backdrop and panel. Tailor the content as follows:

```html
<Teleport to="body">
  <div
    v-if="redeemModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="redeem-modal-title"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      @click="closeRedeemModal"
      aria-hidden="true"
    />

    <!-- Panel -->
    <div
      ref="redeemModalRef"
      tabindex="-1"
      class="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl focus:outline-none"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 id="redeem-modal-title" class="text-base font-semibold text-gray-900">
          Redeem Session
        </h2>
        <button
          class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Close"
          @click="closeRedeemModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4">
        <!-- Package summary -->
        <div v-if="redeemModalPackage" class="mb-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <div class="font-medium text-gray-900">{{ redeemModalPackage.package_type_name }}</div>
          <div class="mt-0.5">
            {{ Number(redeemModalPackage.sessions_remaining) }} session{{ Number(redeemModalPackage.sessions_remaining) !== 1 ? 's' : '' }} remaining
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="redeemModalLoading" class="py-6 text-center text-sm text-gray-500">
          Loading bookings...
        </div>

        <!-- Error state -->
        <div
          v-else-if="redeemModalError && redeemModalBookings.length === 0"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          {{ redeemModalError }}
        </div>

        <!-- Booking list -->
        <div v-else>
          <p class="text-sm text-gray-600 mb-3">Select the booking to redeem this session against:</p>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <label
              v-for="booking in redeemModalBookings"
              :key="booking.id"
              class="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'border-primary-500 bg-primary-50': redeemModalSelectedBookingId === booking.id }"
            >
              <input
                type="radio"
                :value="booking.id"
                v-model="redeemModalSelectedBookingId"
                class="mt-0.5 text-primary-600 focus:ring-primary-500"
              />
              <div class="text-sm text-gray-700">
                <div class="font-medium text-gray-900">
                  #{{ booking.id }} · {{ booking.booking_date }} {{ booking.start_time }}
                </div>
                <div>{{ booking.service_name }} · {{ booking.staff_name }}</div>
                <div class="text-xs text-gray-500 capitalize">{{ booking.status }}</div>
              </div>
            </label>
          </div>

          <!-- Inline error after submit attempt -->
          <div
            v-if="redeemModalError && redeemModalBookings.length > 0"
            class="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ redeemModalError }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          @click="closeRedeemModal"
          :disabled="redeemModalSubmitting"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          :disabled="!redeemModalSelectedBookingId || redeemModalSubmitting || redeemModalLoading"
          @click="submitRedemption"
        >
          {{ redeemModalSubmitting ? 'Redeeming...' : 'Confirm Redemption' }}
        </button>
      </div>
    </div>
  </div>
</Teleport>
```

---

#### 5. Add `nextTick` to imports

Ensure `nextTick` is imported from `'vue'` alongside existing imports. Read the current import line first and add it only if missing.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No PHP changes
- [ ] No new migrations
- [ ] No new routes
- [ ] No new composables

---

## PHPUNIT REQUIREMENTS

Baseline: 663 tests, 0 failures — must not regress. No new PHPUnit tests required (frontend-only change).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
Report the test count. Must be 663, 0 failures.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Clicking "Redeem Session" opens a modal (no `window.prompt()` anywhere)
- [ ] Modal shows the package name and sessions remaining as a summary
- [ ] Modal fetches and lists the customer's bookings where `customer_package_id` is null and status is not cancelled/no_show
- [ ] Each booking row shows: booking ID, date, time, service name, staff name, status
- [ ] Admin selects a booking via radio button
- [ ] "Confirm Redemption" button is disabled until a booking is selected
- [ ] Submitting calls `POST /dashboard/package-redemptions` with correct payload
- [ ] On success: modal closes, success banner shows, packages list reloads
- [ ] On API error: error message shown inside modal, modal stays open
- [ ] If no eligible bookings exist: informative message shown inside modal
- [ ] Clicking backdrop or Cancel closes the modal
- [ ] Escape key closes the modal
- [ ] Focus is trapped inside the modal while open
- [ ] Focus returns to the "Redeem Session" button when modal closes

### Technical
- [ ] No `window.prompt()` calls remain in `Packages.vue`
- [ ] Uses `<Teleport to="body">` (same as `BookingModal.vue`)
- [ ] Focus trap follows `BookingModal.vue` pattern
- [ ] No JavaScript console errors
- [ ] `npm run build` passes without errors
- [ ] PHPUnit suite: 663 tests, 0 failures

### Must NOT break
- [ ] All existing Packages page functionality (filters, pagination, search, status badges)
- [ ] CustomerProfile.vue Packages tab
- [ ] All other dashboard views

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 8-patch: Replace window.prompt with booking selection modal

- Replace window.prompt() in Packages.vue redeemPackage() with
  accessible modal following BookingModal.vue focus-trap pattern
- Modal fetches customer's unlinked bookings via GET /dashboard/bookings
- Radio list lets admin select which booking to redeem against
- Confirm Redemption calls POST /dashboard/package-redemptions
- Error/loading/empty states handled inline in modal
- Focus trapped in modal; restored to trigger button on close
- Escape key and backdrop click close the modal

Tests: 663 passing, 0 failures
```

---

After implementation, run:
```
npm run build
```
in `bookit-booking-system/dashboard/` — the dist/ directory is gitignored and the build must be run manually in Local by Flywheel after Cursor completes its changes.

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.