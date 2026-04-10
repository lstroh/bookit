I have a clear picture of the existing profile API structure and `MyProfile.vue`. Now generating the 6A-5 prompt:

---

```
TASK 6 OF 10: My Profile — Notification Preferences UI
Sprint: 6A | Est: 4h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/MyProfile.vue` — Read the **full file**. Understand the card structure (Profile card, Change Password card, My Stats section). The new Notification Preferences card goes after the Change Password card and before the My Stats section. Note the exact Tailwind classes used for card headers, form labels, inputs, buttons, success/error banners — use identical classes for consistency.

2. `includes/api/class-dashboard-bookings-api.php` — Read the `get_my_profile()` and `update_my_profile()` methods in full. Also find the existing `register_rest_route()` block for `/dashboard/profile` — the new preferences endpoint `PUT /dashboard/profile/notification-preferences` and `GET` extension go in the same file, following the same route registration pattern.

3. `tests/unit/test-profile-api.php` — Read the full file. Understand the test helper pattern (`create_test_staff()`, `login_as()`, `setUp()`/`tearDown()`). New preference API tests follow this exact pattern.

4. `dashboard/src/router/index.js` — Confirm the `/profile` route maps to `MyProfile.vue`. No router changes needed — just confirming.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-5 adds a "Notification Preferences" card to `MyProfile.vue` and the two backend endpoints that power it. The GET endpoint extension returns preferences decoded from the `notification_preferences` column. The new PUT endpoint saves preferences for the authenticated staff member only. No admin can edit another staff member's preferences here — that's 6A-6.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

**Change 1 — Extend `get_my_profile()`:**

The existing method returns `$staff` array. Extend it to include `notification_preferences` decoded and merged with defaults. Add after the existing `$staff['full_name']` line:

```php
// Decode notification preferences with defaults.
$raw_prefs = $wpdb->get_var( $wpdb->prepare(
    "SELECT notification_preferences FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
    $current_staff['id']
) );
$pref_defaults = array(
    'new_booking'    => 'immediate',
    'reschedule'     => 'immediate',
    'cancellation'   => 'immediate',
    'daily_schedule' => false,
);
$parsed = ! empty( $raw_prefs ) ? json_decode( $raw_prefs, true ) : null;
$staff['notification_preferences'] = is_array( $parsed )
    ? array_merge( $pref_defaults, $parsed )
    : $pref_defaults;
```

**Change 2 — Register new preferences endpoint:**

Add a new `register_rest_route()` call in `register_routes()` immediately after the existing `/dashboard/profile` route block:

```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/profile/notification-preferences',
    array(
        'methods'             => 'PUT',
        'callback'            => array( $this, 'update_notification_preferences' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'new_booking'    => array(
                'type'              => 'string',
                'enum'              => array( 'immediate', 'daily', 'weekly' ),
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'reschedule'     => array(
                'type'              => 'string',
                'enum'              => array( 'immediate', 'daily', 'weekly' ),
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'cancellation'   => array(
                'type'              => 'string',
                'enum'              => array( 'immediate', 'daily', 'weekly' ),
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'daily_schedule' => array(
                'type' => 'boolean',
            ),
        ),
    )
);
```

**Change 3 — Add `update_notification_preferences()` method:**

```php
public function update_notification_preferences( WP_REST_Request $request ): WP_REST_Response|WP_Error {
    global $wpdb;

    $current_staff = Bookit_Auth::get_current_staff();
    if ( ! $current_staff ) {
        return new WP_Error( 'unauthorized', 'Could not retrieve staff information.', array( 'status' => 401 ) );
    }

    $defaults = array(
        'new_booking'    => 'immediate',
        'reschedule'     => 'immediate',
        'cancellation'   => 'immediate',
        'daily_schedule' => false,
    );

    $valid_frequencies = array( 'immediate', 'daily', 'weekly' );

    $new_booking  = $request->get_param( 'new_booking' );
    $reschedule   = $request->get_param( 'reschedule' );
    $cancellation = $request->get_param( 'cancellation' );
    $daily_sched  = $request->get_param( 'daily_schedule' );

    $prefs = array(
        'new_booking'    => in_array( $new_booking, $valid_frequencies, true ) ? $new_booking : $defaults['new_booking'],
        'reschedule'     => in_array( $reschedule, $valid_frequencies, true ) ? $reschedule : $defaults['reschedule'],
        'cancellation'   => in_array( $cancellation, $valid_frequencies, true ) ? $cancellation : $defaults['cancellation'],
        'daily_schedule' => null !== $daily_sched ? (bool) $daily_sched : $defaults['daily_schedule'],
    );

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        array( 'notification_preferences' => wp_json_encode( $prefs ) ),
        array( 'id' => (int) $current_staff['id'] ),
        array( '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error( 'update_failed', 'Failed to save notification preferences.', array( 'status' => 500 ) );
    }

    return rest_ensure_response( array(
        'success'     => true,
        'preferences' => $prefs,
    ) );
}
```

### `dashboard/src/views/MyProfile.vue` — MODIFY

**Script changes** — add to the `<script setup>` block:

New reactive state:
```js
const savingPrefs = ref(false)
const prefsSuccess = ref('')
const prefsError = ref('')

const notificationPrefs = ref({
  new_booking: 'immediate',
  reschedule: 'immediate',
  cancellation: 'immediate',
  daily_schedule: false
})
```

Extend `loadProfile()` — after `profile.value = response.data.profile`, add:
```js
if (response.data.profile.notification_preferences) {
  notificationPrefs.value = response.data.profile.notification_preferences
}
```

New save method:
```js
const savePreferences = async () => {
  savingPrefs.value = true
  prefsSuccess.value = ''
  prefsError.value = ''

  try {
    const response = await api.put('profile/notification-preferences', {
      new_booking: notificationPrefs.value.new_booking,
      reschedule: notificationPrefs.value.reschedule,
      cancellation: notificationPrefs.value.cancellation,
      daily_schedule: notificationPrefs.value.daily_schedule
    })

    if (response.data.success) {
      prefsSuccess.value = 'Preferences saved.'
      setTimeout(() => { prefsSuccess.value = '' }, 3000)
    } else {
      prefsError.value = response.data.message || 'Failed to save preferences.'
    }
  } catch (err) {
    prefsError.value = err.message || 'Failed to save preferences.'
  } finally {
    savingPrefs.value = false
  }
}
```

**Template changes** — add the new card after the closing `</div>` of the Change Password card and before the My Stats section `<div v-if="showStats" ...>`. Follow the exact card structure of the Change Password card:

```html
<!-- Notification Preferences Card -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">Notification Preferences</h2>
    <p class="text-sm text-gray-500 mt-1">
      Control when you receive email notifications about your bookings
    </p>
  </div>

  <form @submit.prevent="savePreferences" class="px-4 sm:px-6 py-6 space-y-5">

    <!-- New Booking -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">New Booking</label>
      <select
        v-model="notificationPrefs.new_booking"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Reschedule -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Reschedule</label>
      <select
        v-model="notificationPrefs.reschedule"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Cancellation -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Cancellation</label>
      <select
        v-model="notificationPrefs.cancellation"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
      </select>
    </div>

    <!-- Daily Schedule Toggle -->
    <div class="flex items-start justify-between pt-2 border-t border-gray-100">
      <div>
        <p class="text-sm font-medium text-gray-700">Daily Schedule Email</p>
        <p class="text-xs text-gray-500 mt-0.5">
          Receive a summary of today's bookings each morning
        </p>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="notificationPrefs.daily_schedule"
        @click="notificationPrefs.daily_schedule = !notificationPrefs.daily_schedule"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-0.5"
        :class="notificationPrefs.daily_schedule ? 'bg-primary-600' : 'bg-gray-200'"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="notificationPrefs.daily_schedule ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
    </div>

    <!-- Error / Success -->
    <div v-if="prefsError" role="alert" aria-live="assertive" class="bg-red-50 border border-red-200 rounded p-3">
      <p class="text-sm text-red-800">{{ prefsError }}</p>
    </div>
    <div v-if="prefsSuccess" role="status" aria-live="polite" class="bg-green-50 border border-green-200 rounded p-3">
      <p class="text-sm text-green-800">&#10003; {{ prefsSuccess }}</p>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200">
      <button
        type="submit"
        :disabled="savingPrefs"
        class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {{ savingPrefs ? 'Saving...' : 'Save Preferences' }}
      </button>
    </div>

  </form>
</div>
```

**Frontend build** — after all Vue changes:
```
npm run build
(in bookit-booking-system/dashboard/)
The dist/ directory is gitignored — run this manually in Local by Flywheel after Cursor completes changes.
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables or migrations
- [ ] No new error codes
- [ ] New REST endpoint: `PUT /dashboard/profile/notification-preferences` — authenticated (`check_dashboard_permission`), any role

---

## PHPUNIT REQUIREMENTS

Baseline: **914 tests, 0 failures** — must not regress.

Add new tests to `tests/unit/test-profile-api.php` following the existing pattern in that file.

Required test cases:

- `test_preferences_endpoint_saves_and_retrieves_preferences`: Authenticate as staff. `PUT /dashboard/profile/notification-preferences` with `{ new_booking: 'daily', reschedule: 'immediate', cancellation: 'weekly', daily_schedule: true }`. Assert 200. Then `GET /dashboard/profile` and assert `profile.notification_preferences` matches what was saved.

- `test_preferences_endpoint_validates_frequency_values`: Send invalid frequency value (e.g. `new_booking: 'never'`). Assert the endpoint either returns 400 or falls back to the default `'immediate'` — either behaviour is acceptable, but it must not store invalid values.

- `test_preferences_endpoint_requires_authentication`: Call `PUT /dashboard/profile/notification-preferences` without a session. Assert 401.

- `test_get_profile_includes_notification_preferences`: Authenticate, call `GET /dashboard/profile`. Assert response includes `notification_preferences` key with at least `new_booking`, `reschedule`, `cancellation`, `daily_schedule` keys.

- `test_preferences_default_to_immediate_when_not_set`: Create a staff member with `notification_preferences = NULL`. `GET /dashboard/profile`. Assert all frequency fields default to `'immediate'` and `daily_schedule` defaults to `false`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `GET /dashboard/profile` response includes `notification_preferences` object with all 4 keys
- [ ] Staff with NULL preferences see all defaults (`immediate` / `false`)
- [ ] `PUT /dashboard/profile/notification-preferences` saves and returns the updated preferences
- [ ] Invalid frequency values are rejected or fall back to defaults — never stored
- [ ] Unauthenticated requests return 401
- [ ] My Profile page shows the Notification Preferences card below Change Password
- [ ] Three dropdowns populate correctly from loaded preferences on page load
- [ ] Toggle reflects `daily_schedule` value on page load
- [ ] Saving shows success banner for 3 seconds
- [ ] Errors show in red banner

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Vue file follows existing card structure and Tailwind class conventions
- [ ] Toggle uses `role="switch"` and `aria-checked` for accessibility
- [ ] `npm run build` completes without errors
- [ ] PHPUnit suite passes (919+ tests, 0 failures)

### Must NOT break
- [ ] Existing `GET /dashboard/profile` response structure — `profile` key still present with all existing fields
- [ ] Existing `PUT /dashboard/profile` — unchanged
- [ ] All existing profile API tests — still pass
- [ ] Change Password card — unchanged and still functional

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 5: My Profile — Notification Preferences UI

- Extended GET /dashboard/profile to include notification_preferences
- New endpoint: PUT /dashboard/profile/notification-preferences
- Validates frequency values (immediate/daily/weekly), defaults on NULL
- MyProfile.vue: new Notification Preferences card with 3 dropdowns + toggle
- Preferences loaded from API on mount, saved via dedicated endpoint
- 5 new PHPUnit tests in test-profile-api.php

Tests: 919 passing, 0 failures
```

---

After implementation, run `npm run build` in `bookit-booking-system/dashboard/` before committing.

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.