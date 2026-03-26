Good — I have a complete picture of the existing `EmailSettings.vue`, the `get_allowed_settings_keys()` allowlist, and the settings API patterns. Now let me get the Vue 3 docs for the dynamic show/hide pattern before writing the prompt.Good. I have everything needed. Here is the Task 4 prompt.

---

## Sprint 4H — Task 4 of 5: Settings Page + Provider Switching

```
TASK 4 OF 5: Settings Page + Provider Switching
Sprint: 4H | Est: ~4h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/EmailSettings.vue` — read the **full file**. This is a complete replacement. You must carry forward every existing SMTP field, the test email form, the help card, all reactive state, the `useApi` composable usage, and the `loadSettings`/`saveSettings`/`sendTestEmail` functions. Nothing from the existing page is deleted — it is reorganised into a new layout.
2. `dashboard/src/router/index.js` — confirm `/settings/email` route exists with component `EmailSettings.vue`. No router change needed.
3. `dashboard/src/components/Sidebar.vue` — confirm the `emailSettings` nav item points to `/settings/email`. No sidebar change needed.
4. `includes/api/class-dashboard-bookings-api.php` — read `get_allowed_settings_keys()` (the full array). You will need to add the new notification setting keys to this allowlist. Also read `send_test_email()` to understand what the existing test-email endpoint does — Task 4 replaces its behaviour with the dispatcher bypass.
5. `includes/notifications/class-bookit-notification-dispatcher.php` — read `resolve_email_provider()` and `process_email_queue_item()`. The new test-send endpoint calls `resolve_email_provider()->send()` directly, bypassing the queue.

If any file does not exist or differs from what is described, stop and report back before proceeding.

---

## CONTEXT

Task 4 replaces `EmailSettings.vue` with a new provider-based settings page that adds email provider selection (Brevo vs wp_mail), SMS provider selection, and a provider-aware test send button — while preserving all existing SMTP configuration fields unchanged. On the PHP side, the existing `send_test_email()` endpoint is updated to bypass the queue and call the dispatcher's provider directly, and the new notification setting keys are added to the settings allowlist.

---

## IMPLEMENTATION REQUIREMENTS — PHP BACKEND

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

**Change 1: Add new keys to `get_allowed_settings_keys()`**

Add these keys to the returned array:
```php
'email_provider',
'brevo_api_key',
'brevo_from_name',
'brevo_from_email',
'sms_provider',
'brevo_sms_api_key',
'email_rate_limit_per_minute',
```

`brevo_api_key` must also be added to `get_sensitive_setting_keys()` so it is masked as `'SAVED'` in GET responses (same pattern as `stripe_secret_key`). `brevo_sms_api_key` likewise.

**Change 2: Replace `send_test_email()` method body**

Read the existing method first. Replace the `wp_mail()` direct call with a dispatcher bypass:

```php
public function send_test_email( $request ) {
    $to_email = sanitize_email( $request->get_param( 'to_email' ) );

    if ( ! is_email( $to_email ) ) {
        return new WP_Error(
            'invalid_email',
            __( 'Invalid recipient email address.', 'bookit-booking-system' ),
            array( 'status' => 400 )
        );
    }

    $provider = Bookit_Notification_Dispatcher::resolve_email_provider();

    $subject  = sprintf(
        /* translators: %s: site name */
        __( 'Test Email from %s', 'bookit-booking-system' ),
        get_bloginfo( 'name' )
    );
    $html_body = sprintf(
        '<p>%s</p><p>%s</p>',
        esc_html__( 'This is a test email sent from Bookit Booking System.', 'bookit-booking-system' ),
        esc_html( current_time( 'mysql' ) )
    );

    $result = $provider->send(
        array( 'email' => $to_email, 'name' => $to_email ),
        $subject,
        $html_body
    );

    if ( is_wp_error( $result ) ) {
        return new WP_Error(
            'test_email_failed',
            $result->get_error_message(),
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response( array(
        'success' => true,
        'message' => sprintf(
            /* translators: %s: email address */
            __( 'Test email sent successfully to %s.', 'bookit-booking-system' ),
            $to_email
        ),
        'provider' => $provider->get_name(),
    ) );
}
```

The existing REST route registration for `/dashboard/settings/test-email` is unchanged — same URL, same permission, same `to_email` arg.

---

## IMPLEMENTATION REQUIREMENTS — VUE FRONTEND

### `dashboard/src/views/EmailSettings.vue` — REPLACE

Read the existing file fully before writing. Produce a complete replacement that includes everything below. The existing SMTP fields, test email section, and help card must all be preserved — just reorganised under new section headings.

**New reactive state to add** (alongside all existing `ref`s):

```js
// Provider selection
const emailProvider = ref('wp_mail')   // 'wp_mail' | 'brevo'
const smsProvider   = ref('none')      // 'none' | 'brevo'

// Brevo-specific fields
const brevoApiKey    = ref('')
const brevoFromName  = ref('')
const brevoFromEmail = ref('')
const brevoSmsApiKey = ref('')

// Brevo connection status
const brevoConfigured = ref(false)
```

**Updated `SETTING_KEYS`** — extend to include all new keys:
```js
const SETTING_KEYS = 'smtp_enabled,smtp_host,smtp_port,smtp_encryption,smtp_username,smtp_password,smtp_from_name,smtp_from_email,email_provider,brevo_api_key,brevo_from_name,brevo_from_email,sms_provider,brevo_sms_api_key'
```

**Updated `loadSettings()`** — after `Object.assign(settings.value, ...)`, also populate the new refs:
```js
emailProvider.value  = response.data.settings.email_provider  || 'wp_mail'
smsProvider.value    = response.data.settings.sms_provider    || 'none'
brevoApiKey.value    = response.data.settings.brevo_api_key   === 'SAVED' ? '' : (response.data.settings.brevo_api_key || '')
brevoFromName.value  = response.data.settings.brevo_from_name  || ''
brevoFromEmail.value = response.data.settings.brevo_from_email || ''
brevoSmsApiKey.value = response.data.settings.brevo_sms_api_key === 'SAVED' ? '' : (response.data.settings.brevo_sms_api_key || '')
brevoConfigured.value = response.data.settings.brevo_api_key === 'SAVED'
```

**Updated `saveSettings()`** — extend the `settings` payload to include new keys alongside the existing SMTP ones:
```js
const payload = {
  ...settings.value,
  email_provider:    emailProvider.value,
  brevo_from_name:   brevoFromName.value,
  brevo_from_email:  brevoFromEmail.value,
  sms_provider:      smsProvider.value,
}
// Only include API keys if non-empty (empty string would clear a saved key)
if ( brevoApiKey.value !== '' ) {
  payload.brevo_api_key = brevoApiKey.value
}
if ( brevoSmsApiKey.value !== '' ) {
  payload.brevo_sms_api_key = brevoSmsApiKey.value
}
```

After a successful save, update `brevoConfigured`:
```js
brevoConfigured.value = brevoApiKey.value !== '' || response.data.settings?.brevo_api_key === 'SAVED'
```

---

**Template layout — four sections in order:**

**Section 1: Email Provider**

Card heading: "Email Provider"

- Provider dropdown, label "Email Provider", bound to `emailProvider`:
  - Option `wp_mail`: "WordPress Mail (default — no API key needed)"
  - Option `brevo`: "Brevo (recommended for production)"

- `v-if="emailProvider === 'wp_mail'"`: show a yellow warning info box:
  > ⚠️ WordPress Mail uses your server's PHP mail() function. Emails may arrive in spam. Recommended for testing only. Configure Brevo for reliable production delivery.

- `v-if="emailProvider === 'brevo'"`: show Brevo fields:
  - Brevo API Key (password input, `v-model="brevoApiKey"`, placeholder "xkeysib-...")
    - Below the input, show status indicator:
      - `v-if="brevoConfigured"`: green dot + "Connected"
      - `v-else`: grey dot + "API key required"
  - From Name (text input, `v-model="brevoFromName"`)
  - From Email (email input, `v-model="brevoFromEmail"`)

**Section 2: SMTP Configuration** (existing card, unchanged)

Keep exactly as-is. Label it "SMTP Configuration (Advanced)" — same toggle, same fields, same form submit. The section heading changes from "SMTP Settings" to "SMTP Configuration (Advanced)".

**Section 3: SMS Provider**

Card heading: "SMS Notifications"

- Provider dropdown, label "SMS Provider", bound to `smsProvider`:
  - Option `none`: "Disabled"
  - Option `brevo`: "Brevo SMS (coming soon)"

- `v-if="smsProvider === 'brevo'"`: show info box:
  > Brevo SMS will be activated in a future sprint when live credentials are available. Save your selection now to enable it automatically.
  - Brevo SMS API Key input (password, `v-model="brevoSmsApiKey"`, disabled, placeholder "Brevo SMS API key — available in Sprint 5")

**Section 4: Test Notifications**

Card heading: "Test Notifications"

Replace the existing "Test Email" card with this new version:

- Recipient email input (reuse `testEmailAddress` ref)
- "Send Test Email" button — calls `sendTestEmail()` as before. After success, show the provider name from `response.data.provider` in the success message: "Test email sent via [provider name]."
- "Send Test SMS" button — disabled, `title="SMS not yet active"`, visually greyed out

**Warning banner:**

At the very top of the page, above all cards, add:
```html
<div v-if="emailProvider === 'wp_mail'" class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
  <span class="text-amber-500 text-xl flex-shrink-0">⚠️</span>
  <p class="text-sm text-amber-800">
    <strong>Using WordPress Mail.</strong> Emails may not be delivered reliably in production. 
    Configure Brevo above for reliable delivery.
  </p>
</div>
```

**After implementing Vue changes, run: `npm run build`**
(in `bookit-booking-system/dashboard/` — `dist/` is gitignored and must be built manually in Local by Flywheel)

---

## INFRASTRUCTURE REQUIREMENTS (Sprint 4B)

- [ ] New setting keys added to `get_allowed_settings_keys()`: `email_provider`, `brevo_api_key`, `brevo_from_name`, `brevo_from_email`, `sms_provider`, `brevo_sms_api_key`, `email_rate_limit_per_minute`
- [ ] `brevo_api_key` and `brevo_sms_api_key` added to `get_sensitive_setting_keys()` — masked as `'SAVED'` in GET responses
- [ ] No new DB table or migration in this task — settings stored in existing `wp_bookings_settings` table via existing upsert mechanism
- [ ] No new REST route — existing `/dashboard/settings/test-email` endpoint is reused with updated handler

---

## PHPUNIT REQUIREMENTS

**Baseline: 747 tests, 0 failures — must not regress.**

Write tests in: `tests/unit/test-notification-settings-api.php`

Required test cases:

- `test_email_provider_setting_is_saved_and_retrieved` — POST `email_provider = 'brevo'` to settings endpoint, GET back, assert value is `'brevo'`
- `test_brevo_api_key_is_masked_in_get_response` — insert a `brevo_api_key` row directly via `$wpdb`, GET settings, assert value returned is `'SAVED'`
- `test_brevo_api_key_is_not_overwritten_by_empty_string` — save a real key via `$wpdb`, POST settings with `brevo_api_key = ''`, GET back, assert key is still `'SAVED'` (existing sensitive-key protection applies)
- `test_sms_provider_setting_is_saved_and_retrieved` — POST `sms_provider = 'brevo'`, GET back, assert `'brevo'`
- `test_unknown_setting_key_is_rejected` — POST a settings payload with key `malicious_key = 'x'`, assert the key is not present in `wp_bookings_settings` after the request
- `test_test_email_endpoint_returns_success_with_wp_mail_provider` — ensure no `brevo_api_key` is set (so provider resolves to wp_mail fallback), POST to `/dashboard/settings/test-email` with a valid email, assert 200 and `success = true` and `provider` field is present in response

Note: The wp_mail fallback always returns `true` (it calls `wp_mail()`, which returns `true` in the test environment by default). If `wp_mail` returns `false` in the test environment, add a `add_filter('wp_mail', fn() => true)` in setUp.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `/settings/email` page loads without errors
- [ ] Email provider dropdown shows "WordPress Mail" and "Brevo" options
- [ ] Selecting "wp_mail" shows the yellow warning box and hides Brevo fields
- [ ] Selecting "brevo" shows API key, From Name, From Email fields and hides warning box
- [ ] Status indicator shows grey "API key required" when `brevo_api_key` is not saved
- [ ] Status indicator shows green "Connected" after a Brevo API key has been saved (masked as SAVED)
- [ ] SMS provider section is present with "Disabled" and "Brevo SMS (coming soon)" options
- [ ] Brevo SMS key field is disabled/read-only
- [ ] Warning banner visible at top when `emailProvider === 'wp_mail'`
- [ ] Warning banner hidden when `emailProvider === 'brevo'`
- [ ] All existing SMTP fields still present and functional under "SMTP Configuration (Advanced)"
- [ ] Test send button uses the dispatcher's resolved provider, not direct `wp_mail()`
- [ ] Test send success message includes provider name

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] `brevo_api_key` and `brevo_sms_api_key` masked as `'SAVED'` in GET responses
- [ ] Empty string for `brevo_api_key` does not overwrite a saved key (existing sensitive-key guard)
- [ ] `npm run build` passes with no errors
- [ ] PHPUnit suite passes (747+ tests, 0 failures)

### Must NOT break
- [ ] Existing SMTP settings save and load correctly
- [ ] Existing test email endpoint URL (`/dashboard/settings/test-email`) — same route, updated handler
- [ ] All 747 existing PHPUnit tests

---

## GIT COMMIT MESSAGE

```
Sprint 4H, Task 4: Email provider settings page + test send bypass

- Replace EmailSettings.vue with provider-aware layout (Brevo / wp_mail)
- Add email provider dropdown, Brevo fields with connected indicator
- Add SMS provider section (Brevo stub, disabled)
- Add wp_mail warning banner
- Add new setting keys to allowlist: email_provider, brevo_*, sms_provider, email_rate_limit_per_minute
- Mask brevo_api_key and brevo_sms_api_key as SAVED in GET responses
- Update send_test_email() to use dispatcher resolve_email_provider() bypass
- 6 new PHPUnit tests

Tests: 753 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.