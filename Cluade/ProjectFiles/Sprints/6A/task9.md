I now have a complete picture of the Brevo provider. Key findings:

1. **`params` IS already stored as JSON** in `wp_bookit_email_queue` and IS already decoded and passed to `provider->send()` in `process_email_queue_item()` — `$params['email_type']` is even merged in.
2. **The `send()` method already receives `$params`** but does NOT pass them to `SendTransacEmailRequest` when using a template ID — the `$request_values` array only sets `templateId`, `sender`, and `to`. The `params` field is missing.
3. **The fix is narrow** — inside `send()`, when `$template_id > 0`, add `'params' => $params` (after removing the `email_type` key that was added by the dispatcher, since that's internal scaffolding not a Brevo template variable).
4. **The template ID map** already has 6 entries — 8 new ones for staff notifications need adding.
5. **Tests already exist** with a `TestDouble` pattern that captures the `SendTransacEmailRequest` — perfect for asserting `params` pass-through.

Now generating the 6A-9 prompt:

---

```
TASK 9 OF 10: Brevo Template Variable Wiring (params pass-through)
Sprint: 6A | Est: 4h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/notifications/providers/class-bookit-brevo-email-provider.php` — Read the full file. Focus on `send()` — specifically the `$request_values` array construction when `$template_id > 0`. Confirm `params` is NOT currently included. Also read `get_template_id_for_email_type()` — you will add 8 new mappings here.

2. `includes/notifications/class-bookit-notification-dispatcher.php` — Read `process_email_queue_item()` in full. Note that `$params['email_type']` is added by the dispatcher before calling `provider->send()`. This key must be stripped before passing `$params` to Brevo — it is internal scaffolding, not a template variable.

3. `vendor/getbrevo/brevo-php/src/TransactionalEmails/Requests/SendTransacEmailRequest.php` — Read this file directly to confirm the exact field name for template variables. **Do not rely on online docs.** Confirm whether it is `params`, `templateVariables`, or something else. The Sprint 5A finding confirmed v4 uses constructor array keys — verify the correct key name from the source.

4. `tests/unit/test-brevo-email-provider.php` — Read the full file. The `Bookit_Brevo_Email_Provider_TestDouble` class and existing test pattern is what you extend. Note how `$provider->last_request` captures the request object — use the same approach to assert `params` is set correctly.

5. `includes/api/class-dashboard-bookings-api.php` — Read `get_allowed_settings_keys()` to find the existing 6 `brevo_template_*` keys — confirm their exact names. The 8 new keys follow the same naming pattern.

6. `dashboard/src/views/EmailSettings.vue` — Read the existing Brevo Email Templates sub-section (inside `v-if="emailProvider === 'brevo'"`) to understand exactly where to add the 8 new template ID inputs and how the existing 6 are structured.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When a Brevo template ID is configured, the provider currently sends only `templateId`, `sender`, and `to` — template variables (`{{ params.X }}`) receive nothing and render as blanks. This task fixes the pass-through so that `params` stored in the queue row are forwarded to Brevo's `params` field. It also adds 8 new template ID settings for the staff notification email types introduced in 6A-3.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/notifications/providers/class-bookit-brevo-email-provider.php` — MODIFY

**Change 1 — Pass `params` to Brevo when using a template:**

In `send()`, after the `$email_type` and `$template_id` resolution, build the `$template_params` to forward. Strip the `email_type` key (internal dispatcher scaffolding) before passing to Brevo:

```php
// Build template params — strip internal dispatcher keys before forwarding.
$template_params = $params;
unset( $template_params['email_type'] );
unset( $template_params['template_id'] ); // strip if present
```

Then in the `$request_values` construction, when `$template_id > 0`, add the params field. Read the exact field name from `vendor/getbrevo/brevo-php/src/TransactionalEmails/Requests/SendTransacEmailRequest.php` first — if the field is `params`:

```php
if ( $template_id > 0 ) {
    $request_values['templateId'] = $template_id;
    if ( ! empty( $template_params ) ) {
        $request_values['params'] = $template_params;
    }
}
```

If the field name in the SDK source is different (e.g. `templateVariables`), use that exact name. **Read the vendor file first — do not guess.**

**Change 2 — Add 8 new email type mappings to `get_template_id_for_email_type()`:**

Add to the `$map` array:

```php
'staff_new_booking_immediate'   => 'brevo_template_staff_new_booking',
'staff_reschedule_immediate'    => 'brevo_template_staff_reschedule',
'staff_cancellation_immediate'  => 'brevo_template_staff_cancellation',
'staff_reassigned_to_immediate' => 'brevo_template_staff_reassigned_to',
'staff_reassigned_away_immediate' => 'brevo_template_staff_reassigned_away',
'staff_daily_digest'            => 'brevo_template_staff_daily_digest',
'staff_weekly_digest'           => 'brevo_template_staff_weekly_digest',
'staff_daily_schedule'          => 'brevo_template_staff_daily_schedule',
```

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Add 8 new keys to `get_allowed_settings_keys()`:

```php
'brevo_template_staff_new_booking',
'brevo_template_staff_reschedule',
'brevo_template_staff_cancellation',
'brevo_template_staff_reassigned_to',
'brevo_template_staff_reassigned_away',
'brevo_template_staff_daily_digest',
'brevo_template_staff_weekly_digest',
'brevo_template_staff_daily_schedule',
```

### `dashboard/src/views/EmailSettings.vue` — MODIFY

**Script changes:**

1. Add 8 new keys to the `settings` ref (all defaulting to `''`):
```js
brevo_template_staff_new_booking: '',
brevo_template_staff_reschedule: '',
brevo_template_staff_cancellation: '',
brevo_template_staff_reassigned_to: '',
brevo_template_staff_reassigned_away: '',
brevo_template_staff_daily_digest: '',
brevo_template_staff_weekly_digest: '',
brevo_template_staff_daily_schedule: '',
```

2. Extend `SETTING_KEYS` to include all 8 new keys.

**Template changes:**

Inside the existing "Brevo Email Templates" sub-section (inside `v-if="emailProvider === 'brevo'"`), after the existing 6 template ID inputs, add a divider and a new sub-group for staff notification templates. Follow the exact same input pattern as the existing 6:

```html
<!-- Staff Notification Templates -->
<div class="pt-4 border-t border-gray-200">
  <h4 class="text-sm font-semibold text-gray-800 mb-3">Staff Notifications</h4>
  <div class="space-y-4">

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: New booking assigned</label>
      <input v-model="settings.brevo_template_staff_new_booking" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff new booking notification</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Booking rescheduled</label>
      <input v-model="settings.brevo_template_staff_reschedule" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff reschedule notification</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Booking cancelled</label>
      <input v-model="settings.brevo_template_staff_cancellation" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff cancellation notification</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Booking assigned to you</label>
      <input v-model="settings.brevo_template_staff_reassigned_to" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff reassignment (new assignee)</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Booking removed from schedule</label>
      <input v-model="settings.brevo_template_staff_reassigned_away" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff reassignment (previous assignee)</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Daily digest</label>
      <input v-model="settings.brevo_template_staff_daily_digest" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff daily event digest</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Weekly digest</label>
      <input v-model="settings.brevo_template_staff_weekly_digest" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff weekly event digest</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Staff: Daily schedule summary</label>
      <input v-model="settings.brevo_template_staff_daily_schedule" type="number" min="1" step="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      <p class="text-xs text-gray-500 mt-1">Brevo template ID for staff daily schedule summary</p>
    </div>

  </div>
</div>
```

**Frontend build:**
```
npm run build
(in bookit-booking-system/dashboard/)
```

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new DB tables or migrations
- [ ] 8 new keys added to `get_allowed_settings_keys()` only
- [ ] No new REST endpoints

---

## PHPUNIT REQUIREMENTS

Baseline: **925 tests, 0 failures** — must not regress.

Add to `tests/unit/test-brevo-email-provider.php` using the existing `Bookit_Brevo_Email_Provider_TestDouble` pattern:

- `test_brevo_provider_passes_params_when_template_id_set`: Set a template ID for `customer_confirmation`. Call `send()` with `$params = ['email_type' => 'customer_confirmation', 'customer_name' => 'Jane Smith', 'service_name' => 'Haircut']`. Assert `$provider->last_request->params` is set and contains `customer_name` and `service_name` but does NOT contain `email_type` (stripped by the provider).

- `test_brevo_provider_ignores_params_when_using_html_fallback`: No template ID set. Call `send()` with the same params. Assert `$provider->last_request->templateId` is null, `$provider->last_request->htmlContent` is set, and `$provider->last_request->params` is null or empty (params are irrelevant for HTML fallback path).

- `test_brevo_provider_maps_staff_new_booking_to_template_setting`: Set `brevo_template_staff_new_booking` to `'99'`. Call `send()` with `email_type = 'staff_new_booking_immediate'`. Assert `$provider->last_request->templateId === 99`.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] When `templateId` is set AND `params` is non-empty, `params` is forwarded to Brevo (stripped of `email_type` and `template_id` internal keys)
- [ ] When `html_body` fallback is used (no template ID), `params` is NOT set on the request
- [ ] All 8 new staff email types map correctly to their `brevo_template_*` setting keys
- [ ] All 8 new setting keys are in the allowlist and can be saved/retrieved via settings API
- [ ] Settings UI shows 8 new template ID inputs in the Staff Notifications sub-section

### Technical
- [ ] `params` field name confirmed from vendor source before implementing — not guessed
- [ ] `email_type` and `template_id` keys stripped from params before forwarding to Brevo
- [ ] Empty `$template_params` array does NOT set `params` on the request (no empty object sent to Brevo)
- [ ] `npm run build` completes without errors
- [ ] PHPUnit suite passes (928+ tests, 0 failures)

### Must NOT break
- [ ] HTML fallback path — when no template ID is set, `htmlContent` and `subject` still sent correctly
- [ ] Existing 6 template ID mappings — all still resolve correctly
- [ ] Existing Brevo provider tests — all still pass
- [ ] `params` column in email queue — unchanged, still stored as JSON

---

## GIT COMMIT MESSAGE
```
Sprint 6A, Task 9: Brevo template variable wiring (params pass-through)

- send() now forwards params to Brevo templateId requests
- Strips internal keys (email_type, template_id) before forwarding
- Added 8 new email type mappings to get_template_id_for_email_type()
- Added 8 new brevo_template_staff_* keys to get_allowed_settings_keys()
- EmailSettings.vue: Staff Notifications sub-section with 8 template ID inputs
- 3 new PHPUnit tests in test-brevo-email-provider.php

Tests: 928 passing, 0 failures
```

---

After implementation, run `npm run build` in `bookit-booking-system/dashboard/` before committing.

If you encounter an architecture decision not covered above — particularly if the SDK field name for template variables is not `params` — STOP and report back before writing any code.