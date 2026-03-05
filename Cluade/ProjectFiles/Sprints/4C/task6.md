Good call. Here's Task 6:

---

## Task 6 Cursor Prompt — Payment Gateway Configuration UI

```
# TASK 6: Payment Gateway Configuration UI
# Sprint 4C | Bookit Booking System
# Estimated: 4 hours

## CONTEXT

This task builds the Payment Gateway settings page in the dashboard.
It covers API key storage for Stripe and PayPal, and the Pay on
Arrival toggle. OAuth/Connect flows are explicitly deferred to the
live environment sprint — this task is UI + secure key storage only.

The page already has a partial placeholder visible in Step 3 of the
Setup Guide overlay (read-only status cards). This is a full settings
page with editable fields — a separate concern from that overlay.

---

## MANDATORY: READ THESE FILES FIRST

1. dashboard/src/views/EmailSettings.vue
   — Full file. Copy the load/save pattern exactly:
     GET settings?keys=... on mount, POST settings on save,
     useToast() for feedback, loading/saving refs.

2. dashboard/src/views/Settings.vue
   — How settings keys are whitelisted and how branding uses
     a separate PATCH endpoint. Payment keys use the standard
     POST settings endpoint, not a separate endpoint.

3. includes/api/class-settings-api.php
   — Find the allowed keys whitelist and the save handler.
     New keys to add (listed below). Also read how sensitive
     values are handled — if there is any existing masking or
     encryption logic, follow that pattern exactly.

4. dashboard/src/components/Sidebar.vue
   — Find the SETTINGS collapsible section. Add "Payments" link
     following the exact same pattern as Cancellation Policy
     added in Task 4.

5. dashboard/src/router/index.js
   — Add /settings/payments route, admin only, lazy loaded.

6. tests/unit/test-settings-api.php and
   tests/unit/test-cancellation-policy-settings.php
   — Understand the test pattern. New tests follow the same
     structure.

Do not write any code before reading all six files.

---

## WHAT TO BUILD

### New Vue view: PaymentSettings.vue

File: dashboard/src/views/PaymentSettings.vue

Page heading: "Payment Gateways"
Subheading: "Configure how customers pay for their bookings."

---

#### Section 1 — Stripe

Card with header: "💳 Stripe — Credit & Debit Cards"
Status badge (computed):
  - Green "Connected" if stripe_secret_key is non-empty in loaded
    settings
  - Amber "Not configured" if empty

Fields:
  Publishable Key
    Input type="text", label "Publishable key (pk_...)"
    Help: "Found in your Stripe dashboard under Developers → API keys"
    Placeholder: "pk_live_..." or "pk_test_..."

  Secret Key
    Input type="password", label "Secret key (sk_...)"
    Help: "Keep this private. Never share or expose in frontend code."
    Placeholder: "sk_live_..." or "sk_test_..."
    Show/hide toggle button (eye icon) — toggles between
    type="password" and type="text"
    Important: On load, if a key is already saved, show a masked
    placeholder "sk_••••••••••••" (do not return the actual key
    value from the API — see PHP section below).

  Webhook Secret
    Input type="password" with show/hide toggle
    Label: "Webhook signing secret (whsec_...)"
    Help: "Found in Stripe dashboard under Developers → Webhooks.
           Used to verify webhook authenticity."
    Placeholder: "whsec_..."
    Same masking behaviour as Secret Key.

  Test Mode toggle
    Label: "Test mode"
    Help: "Use Stripe test keys for development. Disable for live
           payments."
    Saves to: stripe_test_mode (boolean)

Info note (always visible):
  "ℹ️ Stripe Connect (OAuth) setup will be available once your
   site is live. For now, enter your API keys directly."

---

#### Section 2 — PayPal

Card with header: "🅿️ PayPal"
Status badge: same pattern as Stripe (based on paypal_client_id)

Fields:
  Client ID
    Input type="text"
    Label: "Client ID"
    Help: "Found in PayPal Developer dashboard under My Apps & Credentials"
    Placeholder: "AaBbCc..."

  Client Secret
    Input type="password" with show/hide toggle
    Label: "Client secret"
    Masking behaviour: same as Stripe secret key

  Sandbox Mode toggle
    Label: "Sandbox mode"
    Help: "Use PayPal sandbox for testing. Disable for live payments."
    Saves to: paypal_sandbox_mode (boolean)

Info note:
  "ℹ️ PayPal OAuth login flow will be available once your site
   is live."

---

#### Section 3 — Pay on Arrival

Card with header: "💵 Pay on Arrival"

Toggle:
  Label: "Enable Pay on Arrival"
  Help: "Allow customers to book without paying online. They pay
         when they arrive for their appointment."
  Default: true (always available unless explicitly disabled)
  Saves to: pay_on_arrival_enabled (boolean)

No status badge needed — always shows as available when enabled.

---

#### Save button

One "Save Payment Settings" button at the bottom saves ALL three
sections in a single POST. Loading state: "Saving..."
Success: useToast() "Payment settings saved."
Error: useToast() with message.

Audit log on save: action = 'payment_settings_updated'
(handled in PHP, not Vue).

---

### PHP: Whitelist new setting keys

File: includes/api/class-settings-api.php

Add to allowed keys:

  stripe_publishable_key     (string)
  stripe_secret_key          (string — sensitive, mask on GET)
  stripe_webhook_secret      (string — sensitive, mask on GET)
  stripe_test_mode           (boolean, default true)
  paypal_client_id           (string)
  paypal_client_secret       (string — sensitive, mask on GET)
  paypal_sandbox_mode        (boolean, default true)
  pay_on_arrival_enabled     (boolean, default true)

**Sensitive key masking on GET:**
When returning stripe_secret_key, stripe_webhook_secret, or
paypal_client_secret in get_settings(), if the value is non-empty,
return the string "SAVED" instead of the actual value. The Vue
component uses this to show the masked placeholder display without
ever receiving the real key in the browser.

In the Vue component:
  On load, if a key value === 'SAVED':
    - Show placeholder text "••••••••••••" in the input
    - Set a local ref (e.g. stripeSecretSaved = true)
    - Do NOT populate the actual input field value
  If the admin types a new value into the field:
    - Clear the "saved" state, use the typed value
  On save, if the field is empty AND stripeSecretSaved was true:
    - Do NOT send that key in the POST payload (preserves existing)
  If the field has a new typed value:
    - Send it in the POST payload (overwrites existing)

This prevents sensitive keys from ever reaching the browser while
allowing the admin to replace them when needed.

**Defaults for get_settings():**
  stripe_test_mode       → true
  paypal_sandbox_mode    → true
  pay_on_arrival_enabled → true
  All key fields         → '' (empty string)

**Audit log in save handler:**
After successful save, call Bookit_Audit_Logger::log() with:
  action: 'payment_settings_updated'
  staff_id: current authenticated staff ID

---

### Router

File: dashboard/src/router/index.js

Add:
  {
    path: '/settings/payments',
    component: () => import('../views/PaymentSettings.vue'),
    meta: { requiresAdmin: true }
  }

---

### Sidebar link

File: dashboard/src/components/Sidebar.vue

Inside the SETTINGS collapsible section, add:
  Icon: 💳
  Label: "Payments"
  To: /settings/payments
  Admin only

Position it as the first item in the SETTINGS section — it is
the most important settings page for a new business owner.

---

### PHPUnit tests

File: tests/unit/test-payment-settings.php

Follow test-cancellation-policy-settings.php pattern exactly.

- test_get_payment_settings_returns_defaults
  GET settings?keys=stripe_test_mode,paypal_sandbox_mode,
  pay_on_arrival_enabled as admin → assert correct defaults

- test_sensitive_keys_are_masked_on_get
  Save a real value for stripe_secret_key via direct DB write →
  GET settings?keys=stripe_secret_key → assert value === 'SAVED',
  NOT the actual key value

- test_save_stripe_publishable_key
  POST stripe_publishable_key='pk_test_abc123' → assert 200 →
  GET → assert value is 'pk_test_abc123' (not masked, not sensitive)

- test_save_stripe_secret_key
  POST stripe_secret_key='sk_test_xyz' → assert 200 →
  GET → assert value === 'SAVED' (masked, not the real key)

- test_save_does_not_overwrite_key_when_empty_sent
  Save 'sk_test_original' → then POST with stripe_secret_key='' →
  GET → assert value still 'SAVED' (original preserved)

- test_save_overwrites_key_when_new_value_sent
  Save 'sk_test_original' → POST with stripe_secret_key='sk_test_new'
  → GET → assert value === 'SAVED' (new key stored, still masked)

- test_save_pay_on_arrival_toggle
  POST pay_on_arrival_enabled=false → GET → assert false

- test_save_stripe_test_mode
  POST stripe_test_mode=false → GET → assert false

- test_save_requires_admin
  Login as staff → POST → assert 403

- test_save_logs_audit_entry
  POST valid settings as admin → query audit log →
  assert row with action='payment_settings_updated'

---

## CONSTRAINTS

- Sensitive keys (stripe_secret_key, stripe_webhook_secret,
  paypal_client_secret) must NEVER be returned in API responses —
  return 'SAVED' string only when a value exists
- No OAuth/Connect UI — info notes explain it's coming when live
- No new REST endpoints — use existing settings API throughout
- Show/hide toggles for password fields use no new libraries —
  plain JS ref toggling input type attribute
- All fields must match existing dashboard input CSS classes
- Admin only throughout

---

## TESTING CHECKLIST

### Settings load
- [ ] Page loads at /settings/payments
- [ ] Stripe section shows "Not configured" badge initially
- [ ] After saving keys, badge shows "Connected"
- [ ] Secret key fields show "••••••••••••" placeholder if saved,
      empty if not yet saved
- [ ] Show/hide toggle reveals/hides secret key field content
- [ ] Test mode and sandbox toggles reflect saved state

### Save behaviour
- [ ] All fields save correctly on button click
- [ ] Leaving a masked secret field blank preserves the existing
      key (does not overwrite with empty)
- [ ] Typing a new value into a secret field saves the new value
- [ ] Success toast appears
- [ ] Refresh page — all non-sensitive fields repopulate,
      sensitive fields show masked placeholder

### Sidebar & routing
- [ ] "Payments" link visible in SETTINGS section for admin
- [ ] Not visible for staff
- [ ] Active state highlighted when on /settings/payments

### PHPUnit
- [ ] npm test — zero failures
- [ ] All 10 new tests pass

---

## GIT COMMIT MESSAGE

Sprint 4C Task 6: Payment Gateway Configuration UI

- PaymentSettings.vue: Stripe, PayPal, Pay on Arrival sections
- Sensitive key masking: secret keys return 'SAVED' on GET,
  blank submission preserves existing value
- Show/hide toggles for all password fields
- Connected/Not configured status badges
- PHP: 8 new setting keys whitelisted with defaults and masking
- Audit log: payment_settings_updated on every save
- Router: /settings/payments (admin only)
- Sidebar: Payments link (first item in SETTINGS section)
- PHPUnit: 10 new tests including masking and preservation logic
```

---

The sensitive key masking pattern is the most important part of this task — make sure Cursor implements it correctly before moving on. Once committed, we're down to Task 7 (Deposit Settings, 4h), Task 8 (PHPUnit sprint-wide), and Task 9 (Manual Testing & Polish) to finish Sprint 4C.