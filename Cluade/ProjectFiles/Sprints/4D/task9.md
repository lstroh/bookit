TASK 9 OF 9: Settings Toggle (packages_enabled) + Daily Package Expiry Cron
Sprint: 4D | Est: 8h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

### PHP files
1. `includes/cron/class-idempotency-cleanup.php` — read in full; this is the exact cron pattern to follow (CRON_HOOK constant, register_cron(), unregister_cron(), run_cleanup(), init(), run_cleanup_with_tracking(), Bookit_Logger usage)
2. `includes/class-bookit-deactivator.php` — read to understand how to add unregister_cron() for the new cron job on deactivation
3. `includes/class-bookit-activator.php` — read to understand how to add register_cron() for the new cron job on activation
4. `includes/class-bookit-loader.php` — read for where to wire the new cron class init() call
5. `includes/api/class-dashboard-settings-api.php` — read in full; understand how `packages_enabled` would be saved/loaded via the existing settings API; check if `packages_enabled` is already in the allowed settings keys list

### Vue files
6. `dashboard/src/views/Settings.vue` — read in full; understand existing toggle pattern (`showStaffEarnings`) before adding `packagesEnabled` toggle
7. `dashboard/src/views/PaymentSettings.vue` — read for the toggle/checkbox UI pattern used for `pay_on_arrival_enabled`

If any file does not exist, stop and report back before proceeding.

Note: Before implementing any Vue 3 Composition API features, use Context7 to resolve 'Vue 3' and confirm current `<script setup>`, `ref`, `onMounted` patterns.

---

## CONTEXT

Task 9 delivers two things: (1) a `packages_enabled` toggle in the dashboard Settings page so admins no longer need to set the value via direct DB insert; and (2) a daily WP-Cron job that expires customer packages whose `expires_at` timestamp has passed, updating their status from `active` to `expired`. Both are locally testable. This completes Sprint 4D core functionality.

---

## IMPLEMENTATION REQUIREMENTS

### PHP — `includes/api/class-dashboard-settings-api.php` — MODIFY

Read the file fully before modifying.

Find the list of allowed/whitelisted setting keys. Add `packages_enabled` to it if not already present. The saved value must be the string `'1'` (enabled) or `'0'` (disabled) — not a boolean. Ensure the sanitize/validate callback for `packages_enabled` uses `sanitize_text_field` and only accepts `'0'` or `'1'`.

If the settings API already handles arbitrary string keys without a whitelist, only ensure `packages_enabled` is handled correctly as a string, not cast to boolean.

Do not change any other logic.

---

### PHP — `includes/cron/class-bookit-package-expiry.php` — CREATE

**Class name:** `Bookit_Package_Expiry`

Follow `class-idempotency-cleanup.php` exactly as the structural template. Read that file in full before writing this one.

```php
const CRON_HOOK = 'bookit_expire_packages';
```

**`run_cleanup(): int`** — expires overdue packages, processing each record individually (not a bulk UPDATE):

```php
public static function run_cleanup(): int {
    global $wpdb;

    // Fetch active packages where expires_at is in the past.
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_customer_packages
             WHERE status = 'active'
               AND expires_at IS NOT NULL
               AND expires_at <= %s",
            current_time( 'mysql', true )   // UTC
        ),
        ARRAY_A
    );

    if ( empty( $rows ) ) {
        return 0;
    }

    $expired_count = 0;

    // Process each record individually so audit hooks fire per record.
    foreach ( $rows as $row ) {
        $updated = $wpdb->update(
            $wpdb->prefix . 'bookings_customer_packages',
            [
                'status'     => 'expired',
                'updated_at' => current_time( 'mysql' ),
            ],
            [ 'id' => (int) $row['id'], 'status' => 'active' ],
            [ '%s', '%s' ],
            [ '%d', '%s' ]
        );

        if ( $updated ) {
            $expired_count++;

            // Fire audit log per record.
            if ( class_exists( 'Bookit_Audit_Logger' ) ) {
                Bookit_Audit_Logger::log(
                    'customer_package.expired',
                    'customer_package',
                    (int) $row['id'],
                    [ 'expired_by' => 'cron', 'expired_at' => current_time( 'mysql' ) ]
                );
            }
        }
    }

    if ( class_exists( 'Bookit_Logger' ) ) {
        Bookit_Logger::info(
            'Package expiry cron completed',
            [
                'expired_count' => $expired_count,
                'timestamp'     => gmdate( 'Y-m-d H:i:s' ),
            ]
        );
    }

    return $expired_count;
}
```

**`register_cron()`** — schedule daily at 02:00 AM (offset from other crons to avoid collision):
```php
public static function register_cron(): void {
    if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
        $schedule_time = strtotime( 'tomorrow 02:00:00' );
        if ( false === $schedule_time ) {
            $schedule_time = time() + DAY_IN_SECONDS;
        }
        wp_schedule_event( $schedule_time, 'daily', self::CRON_HOOK );
        if ( class_exists( 'Bookit_Logger' ) ) {
            Bookit_Logger::info( 'Package expiry cron registered', [
                'next_run' => gmdate( 'Y-m-d H:i:s', $schedule_time ),
            ] );
        }
    }
}
```

**`unregister_cron()`**, **`is_scheduled()`**, **`init()`**, **`run_cleanup_with_tracking()`** — implement following `class-idempotency-cleanup.php` pattern exactly.

`run_cleanup_with_tracking()` must call `update_option('bookit_package_expiry_last_run', gmdate('Y-m-d H:i:s'), false)` and `update_option('bookit_package_expiry_last_count', $deleted, false)`.

---

### PHP — `includes/class-bookit-activator.php` — MODIFY

Read the file fully before modifying.

Add after the last `register_cron()` call:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-package-expiry.php';
Bookit_Package_Expiry::register_cron();
```

---

### PHP — `includes/class-bookit-deactivator.php` — MODIFY

Read the file fully before modifying.

Add after the last `unregister_cron()` call:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-package-expiry.php';
Bookit_Package_Expiry::unregister_cron();
```

---

### PHP — `includes/class-bookit-loader.php` — MODIFY

Read the file fully before modifying.

Add the cron init call in the appropriate location (near the other cron init calls if they exist, otherwise at the end of the loader's init block):
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/cron/class-bookit-package-expiry.php';
Bookit_Package_Expiry::init();
```

---

### Vue — `dashboard/src/views/Settings.vue` — MODIFY

Read the file fully before modifying.

**Add `packagesEnabled` ref** alongside existing refs:
```js
const packagesEnabled = ref(false)
const savingPackages = ref(false)
```

**Load in `onMounted`** — add alongside existing load calls:
```js
const loadPackagesEnabled = async () => {
  try {
    const response = await api.get('settings?keys=packages_enabled')
    if (response.data.success && response.data.settings) {
      packagesEnabled.value = response.data.settings.packages_enabled === '1' ||
                              response.data.settings.packages_enabled === true ||
                              response.data.settings.packages_enabled === 1
    }
  } catch {
    // Fall back to false
  }
}
```

Call `loadPackagesEnabled()` inside `onMounted`.

**Save function:**
```js
const savePackagesEnabled = async () => {
  savingPackages.value = true
  try {
    const response = await api.post('settings', {
      settings: { packages_enabled: packagesEnabled.value ? '1' : '0' }
    })
    if (response.data.success) {
      toastSuccess('Package settings saved.')
    } else {
      toastError(response.data.message || 'Failed to save package settings.')
    }
  } catch (err) {
    toastError(err.message || 'Failed to save package settings.')
  } finally {
    savingPackages.value = false
  }
}
```

**Add toggle UI** — add a new "Packages" section to the Settings page template. Place it after the existing "General Settings" section (the one containing the `showStaffEarnings` toggle). Follow the same card/section layout pattern already used in the file:

```html
<!-- Packages Settings -->
<div v-if="isAdmin" class="bg-white rounded-xl border border-gray-200 p-6">
  <h2 class="text-base font-semibold text-gray-900 mb-1">Session Packages</h2>
  <p class="text-sm text-gray-500 mb-4">
    Allow customers to purchase prepaid session bundles and redeem them at booking.
  </p>

  <div class="flex items-center justify-between py-3 border-b border-gray-100">
    <div>
      <p class="text-sm font-medium text-gray-900">Enable Session Packages</p>
      <p class="text-xs text-gray-500 mt-0.5">
        Shows package options at checkout and enables the Packages dashboard section.
      </p>
    </div>
    <label class="flex items-center cursor-pointer">
      <input v-model="packagesEnabled" type="checkbox" class="sr-only peer" />
      <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  </div>

  <div class="flex justify-end pt-4">
    <button
      type="button"
      :disabled="savingPackages"
      class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
      @click="savePackagesEnabled"
    >
      {{ savingPackages ? 'Saving...' : 'Save Package Settings' }}
    </button>
  </div>
</div>
```

Do not change any other part of `Settings.vue`.

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] No new migrations needed
- [ ] No new error codes needed
- [ ] Audit log event fired: `customer_package.expired` per expired package record (inside cron loop)
- [ ] Cron registered via `Bookit_Package_Expiry::register_cron()` in activator
- [ ] Cron unregistered via `Bookit_Package_Expiry::unregister_cron()` in deactivator
- [ ] Cron hook wired via `Bookit_Package_Expiry::init()` in loader
- [ ] Per-record processing (not bulk UPDATE) — required by sprint rules

---

## PHPUNIT REQUIREMENTS

Baseline: 668 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-package-expiry-cron.php`

**Class name:** `Test_Package_Expiry_Cron`

Include local helpers per-class pattern.

**setUp():** truncate `bookings_customer_packages`, `bookings_package_types`, `bookings_customers`, `bookings_audit_log`. Seed a test package type.

**Required test cases:**

`run_cleanup()`:
- `test_expires_active_package_with_past_expiry` — package with `expires_at` 1 hour ago, `status = active` → status becomes `expired`
- `test_does_not_expire_active_package_with_future_expiry` — package with `expires_at` tomorrow → status unchanged
- `test_does_not_expire_already_expired_package` — package already `status = expired` → not double-processed, count = 0
- `test_does_not_expire_package_with_null_expiry` — `expires_at IS NULL` → status unchanged
- `test_returns_correct_expired_count` — 3 packages due for expiry + 2 not due → returns 3
- `test_fires_audit_log_per_expired_package` — 2 packages expired → 2 `customer_package.expired` audit entries
- `test_does_not_expire_exhausted_package` — `status = exhausted` with past `expires_at` → not touched

`register_cron()` / `unregister_cron()`:
- `test_register_cron_schedules_daily_event` — after `register_cron()`, `wp_next_scheduled(CRON_HOOK)` is not false and schedule is `daily`
- `test_unregister_cron_removes_event` — register then unregister → `wp_next_scheduled(CRON_HOOK)` is false
- `test_register_cron_is_idempotent` — calling `register_cron()` twice does not create duplicate events

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional — Settings toggle
- [ ] Settings page shows "Session Packages" section with enable/disable toggle
- [ ] Toggling on and saving sets `packages_enabled = '1'` in `wp_bookings_settings`
- [ ] Toggling off and saving sets `packages_enabled = '0'`
- [ ] Page reload correctly reflects saved state
- [ ] Booking wizard Step 5 shows package options when `packages_enabled = '1'` (existing behaviour, must not break)

### Functional — Expiry cron
- [ ] Packages with `expires_at` in the past and `status = active` → status set to `expired` by cron
- [ ] Packages with `expires_at` in the future → unchanged
- [ ] Packages with `expires_at IS NULL` → unchanged
- [ ] Packages with `status = exhausted` or `status = cancelled` → unchanged
- [ ] Each expired package produces one `customer_package.expired` audit log entry
- [ ] Cron hook `bookit_expire_packages` is registered as `daily`

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] `npm run build` passes (Settings.vue modified)
- [ ] Per-record loop — no bulk UPDATE
- [ ] PHPUnit suite passes (668+ tests, 0 failures)

### Must NOT break
- [ ] All existing Settings page functionality (branding, staff earnings toggle)
- [ ] All existing cron jobs (session cleanup, idempotency cleanup, audit retention)
- [ ] All package-related tests from Tasks 2–8

---

## GIT COMMIT MESSAGE

```
Sprint 4D, Task 9: packages_enabled settings toggle + daily package expiry cron

- Add packages_enabled toggle to Settings.vue (saves '1'/'0' via settings API)
- Ensure packages_enabled key handled correctly in dashboard settings API
- Add Bookit_Package_Expiry cron class: daily at 02:00 AM, processes
  each record individually, fires customer_package.expired audit log per record
- Register/unregister cron in activator/deactivator
- Wire cron init() in loader
- 10 PHPUnit tests for expiry logic and cron scheduling

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