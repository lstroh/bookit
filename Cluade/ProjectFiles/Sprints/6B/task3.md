Here is the Task 3 Cursor prompt — ready to paste into Cursor:

---

# TASK 3 OF 8: Settings — Google Calendar Credentials
**Sprint: 6B-1 | Est: 1.5h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/Settings.vue` — full file; identify the existing integrations section and the card/component pattern used for Brevo and Stripe API key fields
2. `includes/api/class-dashboard-bookings-api.php` — read `get_allowed_settings_keys()`, `is_sensitive_setting_key()` (or equivalent), and `get_settings()` — specifically how `brevo_api_key` and Stripe keys are masked in the response
3. `database/migrations/0017-*.php` — confirm settings key naming convention

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task adds three new settings to Dashboard → Settings for Google Calendar integration: Client ID (plain text), Client Secret (masked), and a fallback calendar toggle. It follows the existing sensitive-key masking pattern already established for Brevo and Stripe. No new DB table or migration is needed — all three settings use the existing `wp_bookings_settings` table.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

- Read the full file before touching anything
- In `get_allowed_settings_keys()`: add the following three keys:
  - `google_client_id`
  - `google_client_secret`
  - `google_calendar_fallback_enabled`
- In `is_sensitive_setting_key()` (or whichever function controls masking): add `google_client_secret` — follow the exact same pattern used for `brevo_api_key`
- In `get_settings()`: mask `google_client_secret` using the exact same 'SAVED' / empty-string pattern used for other sensitive keys — read the existing implementation first and replicate it exactly
- Do NOT modify any other logic in this file

### `dashboard/src/views/Settings.vue` — MODIFY

- Read the full file first — identify the existing card/section pattern used for Brevo and Stripe before writing anything
- Add a new **Google Calendar** card/section in the correct location, following the existing component and layout pattern exactly — do not invent a new pattern
- Three fields to add:

  **Field 1 — Google Client ID**
  - Setting key: `google_client_id`
  - Input type: text, plain (not masked)
  - Label: `Google Client ID`

  **Field 2 — Google Client Secret**
  - Setting key: `google_client_secret`
  - Masking behaviour: identical to `brevo_api_key` — shows `SAVED` when a value is stored server-side, clears to empty on focus to allow re-entry, sends the new value only if the user has typed something
  - Label: `Google Client Secret`

  **Field 3 — Business Fallback Calendar**
  - Setting key: `google_calendar_fallback_enabled`
  - Input type: toggle or checkbox (follow whichever pattern exists for boolean settings)
  - Label: `Business Fallback Calendar`
  - Helper text: `When enabled, bookings assigned to staff without a connected Google Calendar will sync to the first admin calendar that is connected`

- All three settings must save and load via the existing settings save/load mechanism — do not introduce a new mechanism
- Follow existing i18n patterns if translations are used elsewhere in `Settings.vue`

> **Note:** Before implementing any Vue 3 reactive binding or masked input pattern,
> use Context7 to resolve `Vue 3` and confirm the current API for `v-model` and
> reactive refs if the codebase uses Composition API.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] `google_client_id` added to `get_allowed_settings_keys()`
- [ ] `google_client_secret` added to `get_allowed_settings_keys()`
- [ ] `google_calendar_fallback_enabled` added to `get_allowed_settings_keys()`
- [ ] `google_client_secret` treated as sensitive — masked as `SAVED` in `get_settings()` response
- [ ] No new migrations required
- [ ] No new audit log events required (follow existing pattern for settings saves)

---

## PHPUNIT REQUIREMENTS

Baseline: **931 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-settings.php`

Required test cases:
- `test_google_client_id_is_in_allowed_settings_keys` — assert `google_client_id` is returned by `get_allowed_settings_keys()`
- `test_google_client_secret_is_in_allowed_settings_keys` — assert `google_client_secret` is in the allowed keys list
- `test_google_calendar_fallback_enabled_is_in_allowed_settings_keys` — assert key is in allowed list
- `test_google_client_secret_is_masked_in_get_settings_response` — save a value for `google_client_secret`, call `get_settings()`, assert the response contains `SAVED` and not the actual stored value

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking this task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Google Client ID field saves and loads correctly in Settings
- [ ] Google Client Secret field shows `SAVED` when a value is stored
- [ ] Google Client Secret clears on focus to allow re-entry of a new value
- [ ] Fallback calendar toggle saves and loads correctly
- [ ] `get_settings()` API response masks `google_client_secret` — never returns the actual value

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Follows existing sensitive key masking pattern exactly (same as Brevo)
- [ ] Follows existing Settings.vue card/component pattern exactly
- [ ] PHPUnit suite passes (931+ tests, 0 failures)

### Must NOT break
- [ ] Brevo API key masking still works correctly
- [ ] Stripe key masking still works correctly
- [ ] All other existing settings save and load correctly

---

## FRONTEND BUILD

After implementation, run:
```bash
npm run build
```
in `bookit-booking-system/dashboard/`
The `dist/` directory is gitignored — the build must be run manually after Cursor completes its changes.

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 3: Google Calendar settings (Client ID, Secret, fallback toggle)

- class-dashboard-bookings-api.php: add google_client_id, google_client_secret,
  google_calendar_fallback_enabled to allowed keys; mask client secret as SAVED
- Settings.vue: add Google Calendar card with Client ID, Client Secret, fallback toggle
- tests/unit/test-google-calendar-settings.php: 4 new tests

Tests: 931+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**