Great progress! Task 7 — Deposit Settings:

---

## Task 7 Cursor Prompt — Deposit Settings UI

```
# TASK 7: Deposit Settings UI
# Sprint 4C | Bookit Booking System
# Estimated: 4 hours

## CONTEXT

Deposit settings control how the booking system handles upfront
payments. These settings work alongside the per-service deposit
configuration (already built in ServiceFormModal.vue) — they set
the global defaults and rules that apply when a service has deposits
enabled.

This task builds a dedicated Deposit Settings page under Settings,
following the exact same patterns as Tasks 4 and 6.

---

## MANDATORY: READ THESE FILES FIRST

1. dashboard/src/views/PaymentSettings.vue (Task 6)
   — Full file. This is the closest structural match.
     Copy the load/save pattern, masking awareness, useToast(),
     loading/saving refs, and section card layout exactly.

2. dashboard/src/components/ServiceFormModal.vue
   — Read the deposit fields: deposit_type (fixed/percentage),
     deposit_amount. Understand what per-service deposit data
     looks like. The global deposit settings in this task set
     the DEFAULTS for new services and the system-wide rules —
     they do not override per-service settings already saved.

3. includes/api/class-settings-api.php
   — Find the allowed keys whitelist. Add the new deposit keys
     here. Follow the exact same pattern as Task 6 additions.

4. dashboard/src/views/CancellationPolicy.vue (Task 4)
   — Read the live preview panel pattern. Deposit Settings also
     has a live preview showing customers what they will see
     at checkout. Copy that reactive preview approach.

5. dashboard/src/components/Sidebar.vue
   — Find the SETTINGS collapsible section. Add "Deposits" link
     after the "Payments" link added in Task 6.

6. dashboard/src/router/index.js
   — Add /settings/deposits route, admin only, lazy loaded.

7. tests/unit/test-payment-settings.php (Task 6)
   — The closest test pattern to follow for new PHPUnit tests.

Do not write any code before reading all seven files.

---

## WHAT TO BUILD

### New Vue view: DepositSettings.vue

File: dashboard/src/views/DepositSettings.vue

Page heading: "Deposit Settings"
Subheading: "Control how deposits are collected at booking."

Layout: two-column on desktop (lg:grid-cols-2 gap-6), single column
on mobile. Left: settings form. Right: live customer preview.

---

#### Section 1 — Global Deposit Behaviour

Card heading: "Default Deposit Rules"

**Require deposit by default**
Toggle: ON/OFF
Label: "Require a deposit for all new services"
Help: "When ON, new services will have deposits enabled by default.
      You can still override this per service."
Saves to: deposit_required_default (boolean, default false)

**Default deposit type**
Radio group (shown when toggle is ON):
  ◉ Percentage of service price
  ◉ Fixed amount (£)
Saves to: deposit_type_default ('percentage' | 'fixed', default 'percentage')

**Default deposit amount**
Shown when toggle is ON:
  If percentage selected:
    Range slider 10–100, step 5, default 50
    Live label: "Customers pay [N]% upfront"
  If fixed selected:
    GBP input, min 0, step 0.01
    Help: "Applied to all new services unless overridden"
Saves to: deposit_amount_default (decimal, default 50)

---

#### Section 2 — Deposit Rules

Card heading: "Deposit Rules"

**Minimum deposit percentage**
Number input, min 0, max 100, step 5
Label: "Minimum deposit percentage"
Help: "The lowest deposit percentage allowed across all services.
      Prevents staff from setting deposits too low."
Default: 10
Saves to: deposit_minimum_percent (integer)

**Maximum deposit percentage**
Number input, min 0, max 100, step 5
Label: "Maximum deposit percentage"
Help: "The highest deposit percentage allowed. Set to 100 to
      allow full upfront payment via deposit."
Default: 100
Saves to: deposit_maximum_percent (integer)

Validation (Vue-side, before save):
  If minimum > maximum → show inline error:
  "Minimum cannot exceed maximum."

**Deposit applies to**
Radio group:
  ◉ All bookings (default)
  ◉ Online bookings only (not manual bookings created by admin)
Saves to: deposit_applies_to ('all' | 'online_only', default 'all')

**Require deposit for Pay on Arrival bookings**
Toggle: ON/OFF
Label: "Collect deposit even when customer selects Pay on Arrival"
Help: "When ON, customers must pay the deposit online regardless
      of payment method chosen for the balance."
Default: false
Saves to: deposit_required_for_pay_on_arrival (boolean)

---

#### Section 3 — Deposit Refund Rules

Card heading: "Deposit Refund Behaviour"

Info note:
  "ℹ️ These rules apply specifically to deposits. Full cancellation
   and refund policy is configured in Settings → Cancellation Policy."

**Deposit refundable if cancelled within policy window**
Toggle: ON/OFF (default ON)
Label: "Refund deposit for on-time cancellations"
Help: "If the customer cancels within your free cancellation window,
      refund their deposit automatically."
Saves to: deposit_refundable_within_window (boolean, default true)

**Deposit refundable if cancelled late**
Toggle: ON/OFF (default OFF)
Label: "Refund deposit for late cancellations"
Help: "If the customer cancels outside the free window, refund
      their deposit. Leave OFF to keep the deposit as a late
      cancellation fee."
Saves to: deposit_refundable_outside_window (boolean, default false)

---

#### Live preview panel (right column)

Title: "Customer checkout preview"
Subtitle: "What customers see at the payment step."

Show a styled mock checkout summary card that updates reactively:

  ┌─────────────────────────────┐
  │ Order Summary               │
  │                             │
  │ Women's Haircut    £35.00   │
  │                             │
  │ Due today (deposit): £17.50 │  ← updates with deposit %/amount
  │ Due on arrival:     £17.50  │  ← remainder
  │                             │
  │ [Pay £17.50 now]            │  ← button (non-functional, visual)
  └─────────────────────────────┘

The example service price is fixed at £35.00 for illustration.
The deposit amount shown updates live based on:
  - deposit_type_default (percentage vs fixed)
  - deposit_amount_default (the percentage or fixed amount)

Below the card, show a small note:
  "Deposit amounts are set per service. This preview uses a
   £35.00 example service with your current default settings."

If deposit_required_default is OFF, show instead:
  "Deposits are not required by default. Customers pay the
   full amount at checkout unless a service has a deposit
   configured."

---

#### Save button

Single "Save Deposit Settings" button saves all settings.
Loading state: "Saving..."
Success: useToast() "Deposit settings saved."
Error: useToast() with message.
Audit log on save: action = 'deposit_settings_updated' (PHP side).

---

### PHP: Whitelist new setting keys

File: includes/api/class-settings-api.php

Add to allowed keys:

  deposit_required_default              (boolean, default false)
  deposit_type_default                  ('percentage'|'fixed', default 'percentage')
  deposit_amount_default                (decimal, default 50)
  deposit_minimum_percent               (integer, default 10)
  deposit_maximum_percent               (integer, default 100)
  deposit_applies_to                    ('all'|'online_only', default 'all')
  deposit_required_for_pay_on_arrival   (boolean, default false)
  deposit_refundable_within_window      (boolean, default true)
  deposit_refundable_outside_window     (boolean, default false)

None of these are sensitive — return actual values on GET.

Add audit log after successful save:
  action: 'deposit_settings_updated'
  staff_id: current authenticated staff ID

---

### Router

File: dashboard/src/router/index.js

Add:
  {
    path: '/settings/deposits',
    component: () => import('../views/DepositSettings.vue'),
    meta: { requiresAdmin: true }
  }

---

### Sidebar link

File: dashboard/src/components/Sidebar.vue

Inside the SETTINGS collapsible section, add after "Payments":
  Icon: 💰
  Label: "Deposits"
  To: /settings/deposits
  Admin only

---

### PHPUnit tests

File: tests/unit/test-deposit-settings.php

- test_get_deposit_settings_returns_defaults
  GET as admin → assert all 9 keys present with correct defaults

- test_save_deposit_required_default
  POST deposit_required_default=true → GET → assert true

- test_save_deposit_type_default
  POST deposit_type_default='fixed' → GET → assert 'fixed'

- test_save_deposit_amount_default
  POST deposit_amount_default=25 → GET → assert 25

- test_save_deposit_minimum_percent
  POST deposit_minimum_percent=20 → GET → assert 20

- test_save_deposit_maximum_percent
  POST deposit_maximum_percent=75 → GET → assert 75

- test_save_deposit_applies_to
  POST deposit_applies_to='online_only' → GET → assert 'online_only'

- test_save_deposit_refund_rules
  POST deposit_refundable_within_window=false,
       deposit_refundable_outside_window=true
  → GET → assert both values correct

- test_save_requires_admin
  Login as staff → POST → assert 403

- test_get_requires_authentication
  No login → GET → assert 401

- test_save_logs_audit_entry
  POST as admin → query audit log →
  assert row with action='deposit_settings_updated'

---

## CONSTRAINTS

- No new REST endpoints — use existing settings API
- No new database tables — wp_options via settings mechanism
- Minimum/maximum validation is Vue-side only (advisory, not
  enforced in PHP for now — full validation is Sprint 4F)
- Live preview is purely computed from form state — no API calls
- The deposit settings are DEFAULTS and RULES only — they do not
  retroactively change existing service configurations
- Admin only throughout

---

## TESTING CHECKLIST

### Settings load
- [ ] Page loads at /settings/deposits
- [ ] All fields populate with saved values on load
- [ ] Fresh install shows correct defaults

### Form behaviour
- [ ] Toggling "Require deposit by default" ON shows type/amount
      controls, OFF hides them
- [ ] Switching between percentage and fixed shows the correct
      input (slider vs GBP field)
- [ ] Slider updates live label as it moves
- [ ] Minimum > maximum shows inline validation error, blocks save

### Live preview
- [ ] Preview card updates immediately when deposit type changes
- [ ] Preview card updates when percentage slider moves
- [ ] Preview card updates when fixed amount changes
- [ ] "Deposits not required" message shows when toggle is OFF
- [ ] £35 example price used consistently

### Save
- [ ] All 9 keys save correctly in one POST
- [ ] Success toast appears
- [ ] Refresh → values persist correctly

### Sidebar & routing
- [ ] "Deposits" link visible in SETTINGS section for admin
- [ ] Not visible for staff
- [ ] Positioned after "Payments"
- [ ] Active state correct

### PHPUnit
- [ ] npm test — zero failures
- [ ] All 11 new tests pass

---

## GIT COMMIT MESSAGE

Sprint 4C Task 7: Deposit Settings UI

- DepositSettings.vue: default deposit rules, min/max controls,
  applies-to radio, refund behaviour toggles
- Live preview: reactive checkout card showing deposit split
- Validation: min/max cross-field check before save
- PHP: 9 new setting keys whitelisted with defaults
- Audit log: deposit_settings_updated on every save
- Router: /settings/deposits (admin only)
- Sidebar: Deposits link after Payments in SETTINGS section
- PHPUnit: 11 new tests covering all keys, auth, audit log
```

---

After this is committed we're into the final stretch — Task 8 (sprint-wide PHPUnit coverage check) and Task 9 (manual testing & polish), then Sprint 4C is done. Come back when Task 7 is committed.