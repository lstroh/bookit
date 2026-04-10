I have everything I need. The `EmailSettings.vue` structure is clear, and I can see exactly where the existing Brevo template ID fields live and how `SETTING_KEYS` and `get_allowed_settings_keys()` work. Now generating the 6A-7 prompt:

---

```
TASK 8 OF 10: Settings — Digest Send Times + Weekly Day
Sprint: 6A | Est: 2h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/EmailSettings.vue` — Read the full file. Find the "Brevo Email Templates" sub-section inside the `v-if="emailProvider === 'brevo'"` block — this is the correct location for the new Notifications section. Also note the `SETTING_KEYS` string and the `settings` ref object — both must be extended. Note the save payload in `saveSettings()` — the new keys must be included.

2. `includes/api/class-dashboard-bookings-api.php` — Read `get_allowed_settings_keys()` in full. The three new keys must be added to this array.

3. `tests/unit/test-notification-settings-api.php` (or `test-settings-email-api.php`) — Read the existing settings test pattern to understand how settings save/retrieve tests are written.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Task 6A-7 adds three admin-only settings that control when the digest cron jobs fire. All three are stored in `wp_bookings_settings`. The settings UI goes inside `EmailSettings.vue` — specifically as a new "Staff Notification Timing" section, added after the existing Brevo Email Templates sub-section and before the SMTP section. These settings are only meaningful when Brevo/email is configured, so they live in the email settings page. Admin only — `bookit_staff` role is already blocked from the settings endpoint by `check_admin_permission`.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Add three keys to `get_allowed_settings_keys()`:

```php
'staff_digest_send_time',
'staff_schedule_send_time',
'staff_digest_weekly_day',
```

No other PHP changes needed — the existing `update_settings()` and `get_settings()` methods handle any key in the allowlist automatically.

### `dashboard/src/views/EmailSettings.vue` — MODIFY

**Script changes — three places:**

1. Extend the `settings` ref object with the three new keys:
```js
staff_digest_send_time: '18:00',
staff_schedule_send_time: '08:00',
staff_digest_weekly_day: 1
```

2. Extend `SETTING_KEYS` string — append `,staff_digest_send_time,staff_schedule_send_time,staff_digest_weekly_day` to the existing comma-separated string.

3. The `saveSettings()` payload already uses `...settings.value` — no change needed there since the new keys are part of `settings`.

**Template changes — add new section:**

Add a new card section immediately after the closing `</div>` of the existing Brevo Email Provider card (Section 1) and before the SMTP Configuration card (Section 2). The section is always visible to admins — not gated behind `v-if="emailProvider === 'brevo'"` since digest timing is relevant regardless of provider.

```html
<!-- Staff Notification Timing -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">Staff Notification Timing</h2>
    <p class="text-sm text-gray-500 mt-1">
      Configure when digest and schedule emails are sent to staff members
    </p>
  </div>

  <div class="px-4 sm:px-6 py-6 space-y-5">

    <!-- Digest Email Send Time -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Digest Email Send Time
      </label>
      <input
        v-model="settings.staff_digest_send_time"
        type="time"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Time of day for daily and weekly digest emails (business timezone)
      </p>
    </div>

    <!-- Daily Schedule Email Send Time -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Daily Schedule Email Send Time
      </label>
      <input
        v-model="settings.staff_schedule_send_time"
        type="time"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Time of day for the daily schedule summary email (business timezone)
      </p>
    </div>

    <!-- Weekly Digest Day -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Weekly Digest Day
      </label>
      <select
        v-model.number="settings.staff_digest_weekly_day"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option :value="1">Monday</option>
        <option :value="2">Tuesday</option>
        <option :value="3">Wednesday</option>
        <option :value="4">Thursday</option>
        <option :value="5">Friday</option>
        <option :value="6">Saturday</option>
        <option :value="7">Sunday</option>
      </select>
      <p class="text-xs text-gray-500 mt-1">
        Day of the week when weekly digest emails are sent
      </p>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200">
      <button
        type="button"
        :disabled="saving"
        @click="saveSettings"
        class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {{ saving ? 'Saving...' : 'Save Notification Timing' }}
      </button>
    </div>

  </div>
</div>
```

Note: Use `type="button"` with `@click="saveSettings"` rather than `type="submit"` to avoid accidentally submitting a parent form. The save button reuses the existing `saveSettings()` method — no new save method needed since all three keys flow through `...settings.value` in the payload.

**Frontend build** — after all Vue changes:
```
npm run build
(in bookit-booking-system/dashboard/)
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables, migrations, or REST endpoints
- [ ] Three keys added to `get_allowed_settings_keys()` only
- [ ] `bookit_staff` role blocked automatically by existing `check_admin_permission` on settings endpoint

---

## PHPUNIT REQUIREMENTS

Baseline: **922 tests, 0 failures** — must not regress.

Add three new tests to the existing settings API test file (read the file first to confirm its name — likely `test-settings-email-api.php` or `test-notification-settings-api.php`). Follow the exact same pattern as existing settings save/retrieve tests in that file.

Required test cases:

- `test_digest_send_time_setting_saved_and_retrieved`: Login as admin. `POST /dashboard/settings` with `{ settings: { staff_digest_send_time: '17:30' } }`. Assert 200. `GET /dashboard/settings?keys=staff_digest_send_time`. Assert value is `'17:30'`.

- `test_schedule_send_time_setting_saved_and_retrieved`: Same pattern with `staff_schedule_send_time: '07:00'`.

- `test_weekly_day_setting_saved_and_retrieved`: Same pattern with `staff_digest_weekly_day: 5`. Assert retrieved value is `5` (integer or string `'5'` — match whatever the existing integer settings return).

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `staff_digest_send_time` can be saved and retrieved via settings API
- [ ] `staff_schedule_send_time` can be saved and retrieved via settings API
- [ ] `staff_digest_weekly_day` can be saved and retrieved via settings API
- [ ] All three keys rejected if not in allowlist (this is automatic — just confirm no typos)
- [ ] Settings page shows the new "Staff Notification Timing" card
- [ ] Time fields render as `<input type="time">` with correct default values
- [ ] Weekly day dropdown shows Monday–Sunday with correct numeric values
- [ ] Save button calls `saveSettings()` and shows existing success/error banners

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] `v-model.number` used on the weekly day select to ensure numeric binding
- [ ] `npm run build` completes without errors
- [ ] PHPUnit suite passes (925+ tests, 0 failures)

### Must NOT break
- [ ] All existing settings API tests — allowlist additions are additive only
- [ ] Brevo Email Templates section — still visible inside `v-if="emailProvider === 'brevo'"`
- [ ] SMTP Configuration section — unchanged
- [ ] Existing `saveSettings()` behaviour — new keys flow through automatically

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 7: Settings — digest send times + weekly day

- Added staff_digest_send_time, staff_schedule_send_time,
  staff_digest_weekly_day to get_allowed_settings_keys()
- EmailSettings.vue: new Staff Notification Timing card with
  2 time inputs + weekly day dropdown
- Settings load/save via existing saveSettings() mechanism
- 3 new PHPUnit tests

Tests: 925 passing, 0 failures
```

---

After implementation, run `npm run build` in `bookit-booking-system/dashboard/` before committing.

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.