TASK 10 OF 10: Package Redemption History — Endpoint + UI
Sprint: 4D | Est: 4h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

### PHP files
1. `includes/api/class-customer-packages-api.php` — read in full; add the new redemptions sub-resource route here; follow existing route registration pattern, `check_admin_permission()`, and `format_customer_package_row()` style
2. `includes/class-bookit-loader.php` — no change needed; redemptions endpoint lives in the same class as customer packages
3. `database/migrations/0007-create-package-redemptions-table.php` — exact columns of `wp_bookings_package_redemptions`

### Vue files
4. `dashboard/src/views/Packages.vue` — read in full; understand the `pagedPackages` table row structure before adding the expandable row below each package
5. `dashboard/src/views/CustomerProfile.vue` — read in full; understand the existing packages tab card structure before adding the expandable redemption list
6. `dashboard/src/composables/useApi.js` — `api.get()` signature

If any file does not exist, stop and report back before proceeding.

Note: Before implementing any Vue 3 Composition API features, use Context7 to resolve 'Vue 3' and confirm current `<script setup>`, `ref`, `watch` patterns.

---

## CONTEXT

Task 10 delivers redemption history visibility in two places: (1) an expandable row in the Packages dashboard page showing all redemptions for a given package, and (2) an expanded view on each package card in the Customer Profile Packages tab. Both share a single new PHP endpoint. No new migrations are needed — the `wp_bookings_package_redemptions` table already exists.

---

## IMPLEMENTATION REQUIREMENTS

### PHP — `includes/api/class-customer-packages-api.php` — MODIFY

Read the file fully before modifying.

**Add a new route** inside `register_routes()`:

```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/customer-packages/(?P<id>\d+)/redemptions',
    array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => array( $this, 'get_redemptions' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'id' => array(
                'required'          => true,
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param ) && (int) $param > 0;
                },
            ),
        ),
    )
);
```

**Add the `get_redemptions()` method:**

```php
public function get_redemptions( WP_REST_Request $request ): WP_REST_Response|WP_Error {
    global $wpdb;

    $package_id = absint( $request->get_param( 'id' ) );

    // Verify package exists.
    $package = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}bookings_customer_packages WHERE id = %d LIMIT 1",
        $package_id
    ) );

    if ( ! $package ) {
        return Bookit_Error_Registry::to_wp_error( 'E5001' );
    }

    $rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT
            r.id,
            r.booking_id,
            r.redeemed_at,
            r.redeemed_by,
            r.notes,
            b.booking_date,
            b.start_time,
            b.booking_reference,
            s.name  AS service_name,
            CONCAT(st.first_name, ' ', st.last_name) AS staff_name,
            CONCAT(rb.first_name, ' ', rb.last_name) AS redeemed_by_name
         FROM {$wpdb->prefix}bookings_package_redemptions r
         LEFT JOIN {$wpdb->prefix}bookings b
                ON b.id = r.booking_id
         LEFT JOIN {$wpdb->prefix}bookings_services s
                ON s.id = b.service_id
         LEFT JOIN {$wpdb->prefix}bookings_staff st
                ON st.id = b.staff_id
         LEFT JOIN {$wpdb->prefix}bookings_staff rb
                ON rb.id = r.redeemed_by
         WHERE r.customer_package_id = %d
         ORDER BY r.redeemed_at DESC",
        $package_id
    ), ARRAY_A );

    $redemptions = array_map( function( $row ) {
        return array(
            'id'               => (int) $row['id'],
            'booking_id'       => (int) $row['booking_id'],
            'booking_reference'=> $row['booking_reference'] ?? '',
            'booking_date'     => $row['booking_date'] ?? '',
            'start_time'       => $row['start_time'] ?? '',
            'service_name'     => $row['service_name'] ?? '',
            'staff_name'       => trim( $row['staff_name'] ?? '' ),
            'redeemed_at'      => $row['redeemed_at'] ?? '',
            'redeemed_by'      => (int) $row['redeemed_by'],
            'redeemed_by_name' => $row['redeemed_by'] == 0
                ? 'Customer'
                : trim( $row['redeemed_by_name'] ?? 'Admin' ),
            'notes'            => $row['notes'] ?? '',
        );
    }, (array) $rows );

    return new WP_REST_Response( array(
        'success'     => true,
        'redemptions' => $redemptions,
        'total'       => count( $redemptions ),
    ), 200 );
}
```

---

### Vue — `dashboard/src/views/Packages.vue` — MODIFY

Read the file fully before modifying.

**Add new refs** alongside existing refs:

```js
const expandedPackageId = ref(null)          // which row is expanded
const redemptionsCache = ref({})             // keyed by package id
const redemptionsLoading = ref(false)
const redemptionsError = ref({})             // keyed by package id
```

**Add `toggleRedemptions()` function:**

```js
async function toggleRedemptions(pkg) {
  if (expandedPackageId.value === pkg.id) {
    expandedPackageId.value = null
    return
  }
  expandedPackageId.value = pkg.id

  // Use cache if already loaded
  if (redemptionsCache.value[pkg.id]) return

  redemptionsLoading.value = true
  redemptionsError.value[pkg.id] = ''

  try {
    const response = await api.get(`dashboard/customer-packages/${pkg.id}/redemptions`)
    redemptionsCache.value[pkg.id] = response.data?.redemptions || []
  } catch (err) {
    redemptionsError.value[pkg.id] = err.message || 'Failed to load redemption history.'
  } finally {
    redemptionsLoading.value = false
  }
}
```

**Modify the table template** — in the `<tbody>`, after the closing `</tr>` of each package row, add an expandable detail row:

```html
<!-- Expandable redemption history row -->
<tr v-if="expandedPackageId === pkg.id" :key="`redemptions-${pkg.id}`">
  <td colspan="7" class="px-6 py-0 bg-gray-50">
    <div class="py-4">
      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Redemption History
      </h4>

      <div v-if="redemptionsLoading && !redemptionsCache[pkg.id]" class="text-sm text-gray-500">
        Loading...
      </div>

      <div v-else-if="redemptionsError[pkg.id]" class="text-sm text-red-600">
        {{ redemptionsError[pkg.id] }}
      </div>

      <div v-else-if="!redemptionsCache[pkg.id]?.length" class="text-sm text-gray-500 italic">
        No sessions redeemed yet.
      </div>

      <table v-else class="min-w-full text-sm">
        <thead>
          <tr class="text-xs text-gray-400 uppercase">
            <th class="pb-2 text-left font-medium">Date</th>
            <th class="pb-2 text-left font-medium">Booking</th>
            <th class="pb-2 text-left font-medium">Service</th>
            <th class="pb-2 text-left font-medium">Staff</th>
            <th class="pb-2 text-left font-medium">Redeemed By</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="r in redemptionsCache[pkg.id]" :key="r.id" class="text-gray-700">
            <td class="py-2 pr-4">{{ formatDate(r.redeemed_at) }}</td>
            <td class="py-2 pr-4">
              <span class="text-xs text-gray-500">#{{ r.booking_id }}</span>
              <span v-if="r.booking_reference" class="ml-1 text-xs text-gray-400">({{ r.booking_reference }})</span>
            </td>
            <td class="py-2 pr-4">{{ r.service_name || '—' }}</td>
            <td class="py-2 pr-4">{{ r.staff_name || '—' }}</td>
            <td class="py-2">{{ r.redeemed_by_name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </td>
</tr>
```

**Add a "History" toggle button** to the Actions column of each package row, before the "Redeem Session" button:

```html
<button
  class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-2"
  @click="toggleRedemptions(pkg)"
>
  {{ expandedPackageId === pkg.id ? 'Hide History' : 'History' }}
</button>
```

---

### Vue — `dashboard/src/views/CustomerProfile.vue` — MODIFY

Read the file fully before modifying.

**Add new refs** in `<script setup>`:

```js
const expandedPackageId = ref(null)
const redemptionsCache = ref({})
const redemptionsLoading = ref(false)
const redemptionsError = ref({})
```

**Add `togglePackageRedemptions()` function** — same pattern as `Packages.vue` but using the same endpoint:

```js
async function togglePackageRedemptions(pkg) {
  if (expandedPackageId.value === pkg.id) {
    expandedPackageId.value = null
    return
  }
  expandedPackageId.value = pkg.id
  if (redemptionsCache.value[pkg.id]) return

  redemptionsLoading.value = true
  redemptionsError.value[pkg.id] = ''

  try {
    const response = await api.get(`dashboard/customer-packages/${pkg.id}/redemptions`)
    redemptionsCache.value[pkg.id] = response.data?.redemptions || []
  } catch (err) {
    redemptionsError.value[pkg.id] = err.message || 'Failed to load redemption history.'
  } finally {
    redemptionsLoading.value = false
  }
}
```

**Modify the packages tab panel** — extend each package card to include a toggle button and expandable redemption list. Read the existing packages tab template carefully and add below the status badge in each card:

```html
<!-- Toggle button -->
<button
  class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
  @click="togglePackageRedemptions(pkg)"
>
  {{ expandedPackageId === pkg.id ? 'Hide history' : 'View history' }}
</button>

<!-- Redemption history -->
<div v-if="expandedPackageId === pkg.id" class="mt-3 pt-3 border-t border-gray-100">
  <div v-if="redemptionsLoading && !redemptionsCache[pkg.id]" class="text-xs text-gray-500">
    Loading...
  </div>
  <div v-else-if="redemptionsError[pkg.id]" class="text-xs text-red-600">
    {{ redemptionsError[pkg.id] }}
  </div>
  <div v-else-if="!redemptionsCache[pkg.id]?.length" class="text-xs text-gray-500 italic">
    No sessions redeemed yet.
  </div>
  <div v-else class="space-y-1">
    <div
      v-for="r in redemptionsCache[pkg.id]"
      :key="r.id"
      class="text-xs text-gray-600 flex justify-between"
    >
      <span>{{ r.booking_date }} {{ r.start_time?.slice(0,5) }} · {{ r.service_name || '—' }}</span>
      <span class="text-gray-400">{{ r.redeemed_by_name }}</span>
    </div>
  </div>
</div>
```

Do not modify any other part of `CustomerProfile.vue`.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations
- [ ] No new error codes (E5001 reused for package not found)
- [ ] No audit log event needed (read-only endpoint)
- [ ] New route follows `check_admin_permission()` pattern
- [ ] `bookit_staff` role blocked (inherits from `check_admin_permission`)

---

## PHPUNIT REQUIREMENTS

Baseline: 678 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-package-redemption-history-api.php`

**Class name:** `Test_Package_Redemption_History_API`

Include local helpers: `login_as()`, `create_test_staff()`, `insert_package_type()`, `insert_customer()`, `insert_customer_package()`, `insert_booking()`, `insert_redemption()`.

**`insert_redemption()` helper:**
```php
private function insert_redemption( array $overrides = [] ): int {
    global $wpdb;
    $defaults = [
        'customer_package_id' => 0,
        'booking_id'          => 0,
        'redeemed_at'         => current_time('mysql'),
        'redeemed_by'         => 0,
        'notes'               => null,
        'created_at'          => current_time('mysql'),
    ];
    $data = array_merge($defaults, $overrides);
    $wpdb->insert($wpdb->prefix . 'bookings_package_redemptions', $data);
    return (int) $wpdb->insert_id;
}
```

**Required test cases:**

- `test_get_redemptions_returns_200_for_admin` — valid admin + package with 2 redemptions → HTTP 200, `total = 2`
- `test_get_redemptions_returns_empty_array_for_no_redemptions` — package with zero redemptions → `redemptions = []`, `total = 0`
- `test_get_redemptions_returns_404_for_missing_package` — non-existent package ID → E5001
- `test_get_redemptions_returns_401_for_unauthenticated` — no session → 401
- `test_get_redemptions_returns_403_for_staff_role` — staff role → 403
- `test_get_redemptions_response_shape` — response includes `id`, `booking_id`, `booking_date`, `service_name`, `staff_name`, `redeemed_at`, `redeemed_by_name` fields
- `test_get_redemptions_redeemed_by_name_is_customer_when_zero` — `redeemed_by = 0` → `redeemed_by_name = 'Customer'`
- `test_get_redemptions_ordered_newest_first` — 2 redemptions; most recent `redeemed_at` appears first

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional — Packages page
- [ ] Each package row has a "History" button
- [ ] Clicking "History" expands an inline row showing all redemptions for that package
- [ ] Clicking "Hide History" collapses it
- [ ] Each redemption row shows: date, booking ID + reference, service name, staff name, redeemed by
- [ ] "No sessions redeemed yet." shown when a package has zero redemptions
- [ ] Second click on "History" collapses without re-fetching (cached)

### Functional — Customer Profile Packages tab
- [ ] Each package card has a "View history" link
- [ ] Clicking it expands an inline redemption list
- [ ] Each entry shows: booking date/time, service name, redeemed by
- [ ] "No sessions redeemed yet." shown when empty

### Technical
- [ ] No JavaScript console errors
- [ ] No PHP warnings or notices
- [ ] `npm run build` passes
- [ ] PHPUnit suite passes (678+ tests, 0 failures)

### Must NOT break
- [ ] Existing Packages page functionality (filters, pagination, redeem modal)
- [ ] CustomerProfile.vue existing tabs
- [ ] All existing customer packages API tests

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 10: Package redemption history endpoint and UI

- Add GET /dashboard/customer-packages/{id}/redemptions endpoint
  (JOINs bookings, services, staff; redeemed_by=0 returns 'Customer')
- Add expandable "History" row to Packages.vue table with cache
- Add "View history" toggle to CustomerProfile.vue Packages tab cards
- 8 PHPUnit tests for redemption history endpoint

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