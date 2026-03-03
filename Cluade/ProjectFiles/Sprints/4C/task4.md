Task 4 Cursor Prompt — Cancellation Policy Settings UI
# TASK 4: Cancellation Policy Settings UI
# Sprint 4C | Bookit Booking System
# Estimated: 6 hours

## CONTEXT

The cancellation policy controls how the system handles customer
cancellations, late cancellations, no-shows, and rescheduling.
The policy settings are stored via the existing generic settings
API (POST /bookit/v1/dashboard/settings) which already handles
arbitrary key/value pairs — no new PHP endpoints are needed.

This task delivers:
- A new CancellationPolicy.vue view in the Settings section
- A new route under /settings/cancellation
- A sidebar entry under SETTINGS for Cancellation Policy
- A live policy preview panel showing customers what they will see
- PHPUnit tests for the new settings keys

---

## MANDATORY: READ THESE FILES FIRST

Before writing any code, read ALL of these:

1. dashboard/src/views/EmailSettings.vue
   — The ENTIRE file. This is the closest structural match to what
     Task 4 needs: loads settings on mount, saves via POST to
     'settings', shows success/error feedback. Copy this pattern
     exactly for load and save behaviour.

2. dashboard/src/views/Settings.vue
   — Read how settings are loaded (GET settings?keys=...) and saved
     (POST settings with a settings object). Note the saveGeneral
     and saveBranding pattern — Task 4 follows the same approach.

3. dashboard/src/components/Sidebar.vue
   — Find the SETTINGS collapsible section. Add a "Cancellation
     Policy" link inside it, following the exact same pattern as
     the existing settings sub-links (Email, Templates, etc.).
     Visible to admins only.

4. dashboard/src/router/index.js
   — Find where settings sub-routes are defined. Add:
     path: '/settings/cancellation'
     component: CancellationPolicy (lazy loaded, same pattern)
     requiresAdmin: true (same meta pattern)

5. includes/api/class-settings-api.php
   — Read the get_settings() and save_settings() methods in full.
     Understand which setting keys are whitelisted/allowed.
     Task 4 needs these new keys added to the whitelist:
       cancellation_window_hours
       within_window_refund_type    (full|partial|none)
       within_window_refund_percent (0-100)
       late_cancel_refund_type      (full|partial|none)
       late_cancel_refund_percent   (0-100)
       noshow_refund_type           (full|partial|none)
       reschedule_policy            (free|limited|fee|not_allowed)
       reschedule_fee_amount        (decimal, GBP)
       cancellation_policy_text     (textarea)
       auto_refund_enabled          (boolean)
     Add these to the whitelist — do not change any existing keys.

6. tests/unit/test-settings-api.php
   — Read the existing settings API tests to understand the test
     pattern. New PHPUnit tests must follow the exact same structure.

7. includes/class-bookit-audit-logger.php
   — Saving cancellation policy must be logged. Use the existing
     log() method. Action: 'cancellation_policy_updated'.

Do not write any code before reading all seven files.

---

## WHAT TO BUILD

### 1. New Vue view: CancellationPolicy.vue

File: dashboard/src/views/CancellationPolicy.vue

Layout: two-column on desktop (lg:grid-cols-2 gap-6), single column
on mobile. Left column: the settings form. Right column: live policy
preview panel.

#### Form sections (left column)

**Section 1 — Cancellation Window**
Label: "Free cancellation period"
Help: "How much notice must customers give to cancel for free?"
Control: <select> dropdown
Options (value → label):
  1    → "1 hour before"
  6    → "6 hours before"
  12   → "12 hours before"
  24   → "24 hours before" (default)
  48   → "48 hours before"
  72   → "72 hours before"
  168  → "1 week before"
Saves to: cancellation_window_hours (integer)

**Section 2 — Within Window Refund Policy**
Label: "Refund if cancelled within the free period"
Help: "Customer cancels with enough notice — what do they receive?"
Control: radio group
Options:
  full    → "Full refund (100%)"
  partial → "Partial refund"
  none    → "No refund"
When partial selected: show a range slider (0–100, step 5, default 100)
with a live label: "Customer receives [N]%"
Saves to: within_window_refund_type + within_window_refund_percent

**Section 3 — Late Cancellation Refund Policy**
Label: "Refund if cancelled late (outside free period)"
Help: "Customer cancels with less notice than your window allows."
Control: radio group
Options:
  full    → "Full refund"
  partial → "Partial refund"
  none    → "No refund" (default)
When partial selected: show slider (0–100, step 5, default 50)
Saves to: late_cancel_refund_type + late_cancel_refund_percent

**Section 4 — No-Show Policy**
Label: "Refund if customer doesn't show up"
Help: "Applied when a booking is marked as No Show."
Control: radio group
Options:
  full    → "Full refund"
  partial → "Partial refund"
  none    → "No refund — keep deposit" (default)
When partial selected: show slider (0–100, step 5, default 0)
Saves to: noshow_refund_type + noshow_refund_percent

**Section 5 — Rescheduling Rules**
Label: "Rescheduling policy"
Control: <select> dropdown
Options:
  free        → "Free rescheduling (unlimited)"
  limited     → "Free once, then no rescheduling"
  fee         → "Rescheduling fee applies"
  not_allowed → "Rescheduling not permitted"
When 'fee' selected: show a GBP input field
  Label: "Fee per reschedule (£)"
  Placeholder: "0.00", step 0.01, min 0
Saves to: reschedule_policy + reschedule_fee_amount

**Section 6 — Automatic Refunds**
Label: "Automatic refund processing"
Help: "When enabled, eligible refunds are processed immediately
      via Stripe or PayPal. When disabled, refunds are flagged for
      manual processing."
Control: toggle (same pattern as show_staff_earnings in Settings.vue)
Saves to: auto_refund_enabled (boolean)

**Section 7 — Policy Text**
Label: "Policy shown to customers"
Help: "This text appears on the booking page and in confirmation
      emails so customers know your policy before they book."
Control: <textarea> rows=4
Default: "Free cancellation up to [window] hours before your
appointment. Late cancellations and no-shows may forfeit their
deposit."
Saves to: cancellation_policy_text

**Save button**
Label: "Save Policy"
Loading state: "Saving..."
On success: useToast() success toast "Cancellation policy saved."
On error: useToast() error toast with message
Also log to audit: action='cancellation_policy_updated',
  staff_id = window.BOOKIT_DASHBOARD.staff.id
  (the audit log call goes in the PHP save handler, not Vue)

**Strict policy warning**
If all three refund types (within_window, late_cancel, noshow) are
set to 'none', show an amber inline warning below the form:
  ⚠️ "This is a strict no-refund policy. Consider allowing refunds
  for within-window cancellations to maintain good customer
  relations."
This is a Vue computed that watches the three refund type values.
Do not block saving — it is advisory only.

---

#### Live preview panel (right column)

Title: "Customer-facing policy preview"
Subtitle: "This is what customers see before booking."

The panel renders a styled read-only box that updates live as the
admin changes settings — no save needed to see the preview update.

Preview content (derived from current form values):

  📋 Cancellation Policy

  ✓ Free cancellation: Cancel up to [window_label] before your
    appointment for a [within_refund_label].

  ⚠ Late cancellation: Cancelling within [window_label] of your
    appointment: [late_refund_label].

  ✗ No-show: If you don't arrive: [noshow_refund_label].

  🔄 Rescheduling: [reschedule_label]

Where:
- window_label: human-readable version of cancellation_window_hours
  e.g. "24 hours", "1 week"
- within_refund_label: "full refund" | "50% refund" | "no refund"
- late_refund_label: same pattern
- noshow_refund_label: same pattern
- reschedule_label: human-readable version of reschedule_policy
  e.g. "Free, unlimited" | "Free once, then not permitted" |
  "£5.00 fee per change" | "Not permitted"

Below the preview box, show the editable policy_text in a muted
grey box styled to look like a customer-facing notice card.

All preview values are computed from the current form state — they
update in real time as the admin changes dropdowns, sliders, or
radio buttons.

---

### 2. Router

File: dashboard/src/router/index.js

Add inside the settings children (or alongside other settings routes,
matching the existing pattern exactly):

  {
    path: '/settings/cancellation',
    component: () => import('../views/CancellationPolicy.vue'),
    meta: { requiresAdmin: true }
  }

---

### 3. Sidebar link

File: dashboard/src/components/Sidebar.vue

Inside the SETTINGS collapsible section, add a nav link:
  Icon: 🚫 (or use the existing nav-item icon pattern)
  Label: "Cancellation Policy"
  To: /settings/cancellation
  Admin only (same v-if as other settings links)

Position it logically — after Email or Branding settings, before
any last items in the section.

---

### 4. PHP: Whitelist new setting keys

File: includes/api/class-settings-api.php

Add all 10 new setting keys to the allowed keys list in
get_settings() and save_settings().

Add default values for each key in get_settings() so that a fresh
install returns sensible defaults rather than null:
  cancellation_window_hours    → 24
  within_window_refund_type    → 'full'
  within_window_refund_percent → 100
  late_cancel_refund_type      → 'none'
  late_cancel_refund_percent   → 0
  noshow_refund_type           → 'none'
  noshow_refund_percent        → 0
  reschedule_policy            → 'free'
  reschedule_fee_amount        → '0.00'
  cancellation_policy_text     → 'Free cancellation up to 24 hours
    before your appointment. Late cancellations and no-shows may
    forfeit their deposit.'
  auto_refund_enabled          → false

Add audit logging in the save path:
  After successfully saving, call Bookit_Audit_Logger::log() with:
    action: 'cancellation_policy_updated'
    staff_id: current authenticated staff ID

---

### 5. PHPUnit tests

File: tests/unit/test-cancellation-policy-settings.php

Follow the exact structure of tests/unit/test-settings-email-api.php.

Cover:

- test_get_cancellation_settings_returns_defaults
  GET settings?keys=cancellation_window_hours,...
  As admin → assert 200, all 10 keys present with correct defaults

- test_save_cancellation_window_hours
  POST settings with cancellation_window_hours=48 → assert 200,
  GET again → assert value is 48

- test_save_within_window_refund_type_partial
  POST with within_window_refund_type='partial',
  within_window_refund_percent=75 → assert 200,
  GET → assert both values correct

- test_save_late_cancel_refund_type_none
  POST with late_cancel_refund_type='none' → assert 200

- test_save_noshow_refund_type
  POST with noshow_refund_type='partial', noshow_refund_percent=25
  → assert both saved correctly

- test_save_reschedule_policy_fee
  POST reschedule_policy='fee', reschedule_fee_amount='10.00'
  → assert 200, GET → assert both correct

- test_save_reschedule_fee_requires_fee_amount
  POST reschedule_policy='fee' with no fee_amount → should still
  save (fee_amount optional, defaults to 0.00)

- test_save_auto_refund_enabled
  POST auto_refund_enabled=true → GET → assert true

- test_save_cancellation_policy_text
  POST with custom policy text → GET → assert text matches

- test_save_requires_admin
  Login as staff → POST settings → assert 403

- test_get_requires_authentication
  No login → GET settings → assert 401

- test_save_logs_audit_entry
  POST valid settings as admin → query audit log →
  assert row with action='cancellation_policy_updated'

---

## CONSTRAINTS

- No new PHP REST endpoints — use the existing settings API
- No new database tables — settings are stored via wp_options
  through the existing settings mechanism
- Do not modify any existing setting keys or their behaviour
- The live preview must update reactively with no API calls —
  purely computed from form state
- All form controls must use existing Tailwind input/select/
  textarea CSS classes consistent with the rest of the dashboard
- The partial refund slider must use a standard HTML range input
  (no new npm packages)
- Admin only — staff users must not see this page or the sidebar
  link (requiresAdmin guard already handles the route)

---

## TESTING CHECKLIST

### Settings load
- [ ] Navigating to /settings/cancellation loads the page
- [ ] All form fields populate with saved values on load
- [ ] Fresh install shows correct defaults (24h window, full refund
      within window, no refund late/noshow, free rescheduling)

### Form behaviour
- [ ] Selecting "Partial refund" shows the percentage slider
- [ ] Slider value updates the live label in real time
- [ ] Selecting "Full" or "None" hides the slider
- [ ] Selecting "fee" for rescheduling shows the fee amount input
- [ ] Selecting other rescheduling options hides the fee input
- [ ] Strict policy warning appears when all three are "none"
- [ ] Strict policy warning disappears when any refund type changes

### Live preview
- [ ] Preview updates immediately when window dropdown changes
- [ ] Preview updates immediately when refund type changes
- [ ] Partial refund shows correct percentage in preview
- [ ] Rescheduling label updates correctly for all four options
- [ ] Policy text textarea content shows in the preview card below

### Save
- [ ] Clicking Save posts all 10 keys to the settings API
- [ ] Success toast appears on save
- [ ] Refreshing the page and returning to /settings/cancellation
      shows the saved values (persistence confirmed)
- [ ] Error toast appears if save fails

### Sidebar & routing
- [ ] "Cancellation Policy" link visible in SETTINGS section for admin
- [ ] Link not visible for staff users
- [ ] Navigating via link loads the correct page
- [ ] Active link highlighted when on /settings/cancellation

### PHPUnit
- [ ] npm test — zero failures
- [ ] All new tests pass
- [ ] Existing settings tests unaffected

---

## GIT COMMIT MESSAGE

Sprint 4C Task 4: Cancellation Policy Settings UI

- CancellationPolicy.vue: full settings form with live preview panel
- Controls: window dropdown, refund radio+slider (×3), reschedule
  dropdown+fee input, auto-refund toggle, policy textarea
- Live preview: reactive panel showing customer-facing policy text
- Strict policy warning: advisory amber alert when all refunds = none
- PHP: 10 new setting keys whitelisted with defaults in settings API
- Audit log: cancellation_policy_updated on every save
- Router: /settings/cancellation route (admin only)
- Sidebar: Cancellation Policy link in SETTINGS section
- PHPUnit: 12 new tests covering all setting keys, auth, audit log

This is a self-contained task with no dependencies on Tasks 5–9. Come back when it's done and I'll generate Task 5 (REQ-LEGAL-003: 14-day cooling-off waiver).