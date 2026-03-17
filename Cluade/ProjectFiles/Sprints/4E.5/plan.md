# SPRINT 4E.5 IMPLEMENTATION PROMPT
## Bookit Booking System — Package Types UI (~6h)

**Sprint:** 4E.5
**Estimated hours:** ~6h
**PHPUnit baseline:** 706 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

- **GitHub connector** — read live files before writing any code
- **Context7 connector** — verify Vue 3 API patterns before implementing
- **cursor-prompt-generator skill** — use for the Cursor prompt

---

## SPRINT GOAL

This is a single-task sprint closing a carry-forward gap from Sprint 4D.
The Package Types PHP API (`class-package-types-api.php`) is complete and
fully tested. What is missing is any admin UI to call it. An admin currently
has no way to create, edit, or deactivate package type definitions without
a direct DB insert.

This sprint adds a "Package Types" tab to the existing `Packages.vue` view,
giving admins full CRUD over package type definitions.

---

## TASK 1 OF 1: Package Types Tab in Packages.vue (~6h)

### READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read all of these via GitHub before writing anything:

1. `dashboard/src/views/Packages.vue` — the existing view that must be
   extended; understand its current structure, data, composables, and
   styling patterns before touching it
2. `dashboard/src/views/Categories.vue` — closest existing pattern for
   a list + form modal + deactivate/delete flow; follow this pattern
3. `dashboard/src/components/CategoryFormModal.vue` — the modal pattern
   to replicate for the PackageTypeFormModal component
4. `dashboard/src/composables/` — read existing composables to understand
   the useApi pattern and follow it for any new composable
5. `dashboard/src/components/BookitTooltip.vue` — use this for any
   field tooltips; do not create inline tooltip implementations
6. `dashboard/src/router/index.js` — confirm /packages route exists;
   no changes needed but verify
7. `dashboard/vite.config.js` — confirm base: './' before any build;
   do not change it

If any file does not exist or differs significantly from expectations,
stop and report back before proceeding.

---

### CONTEXT

`Packages.vue` currently shows only customer package instances (purchased
packages). The Sprint 4D prompt specified a two-tab design — Tab 1 for
Package Types CRUD, Tab 2 for Customer Packages — but only Tab 2 was
built. This task adds Tab 1.

The PHP backend is complete:
- `GET  /dashboard/package-types` — list all (active + inactive)
- `POST /dashboard/package-types` — create
- `GET  /dashboard/package-types/{id}` — single
- `PATCH /dashboard/package-types/{id}` — update
- `POST /dashboard/package-types/{id}/deactivate` — deactivate

All endpoints are admin-only. No new PHP work is required.

---

### IMPLEMENTATION REQUIREMENTS

#### `dashboard/src/views/Packages.vue` — MODIFY

Read the current file via GitHub first. Then:

**Add a tab switcher at the top of the view** with two tabs:
- Tab 1: "Package Types" (the new tab — show first/default)
- Tab 2: "Customer Packages" (the existing content — move into this tab)

The tab switcher should follow the same pattern used elsewhere in the
dashboard (read Categories.vue or Settings.vue for the tab UI pattern).

**Tab 1 — Package Types content:**

Table columns: Name, Sessions, Pricing, Applicable Services, Expiry,
Status (Active/Inactive), Actions

- Name: package type name
- Sessions: sessions_count value (e.g. "5 sessions")
- Pricing: display price_mode clearly:
  - fixed → "£{fixed_price}" (e.g. "£120.00")
  - discount → "{discount_percentage}% discount"
- Applicable Services: if applicable_service_ids is null → "All services";
  if array → show count (e.g. "3 services") with tooltip listing names
- Expiry: if expiry_enabled = 0 → "Never"; if 1 → "{expiry_days} days"
- Status: Active (green badge) / Inactive (grey badge)
- Actions: Edit button, Deactivate button (active types only)
  — cannot delete if active customer packages exist (API enforces this,
  show the error message returned by the API in a toast/alert)

**"Add Package Type" button** in the tab header — opens
`PackageTypeFormModal` (new component, see below)

**Empty state** when no package types exist: "No package types yet.
Create your first package type to start offering session bundles."

**Tab 2 — Customer Packages:**
Move all existing Packages.vue content (search, filters, table, redeem
modal, history rows) into this tab without modification. Do not break
any existing functionality.

---

#### `dashboard/src/components/PackageTypeFormModal.vue` — CREATE

New modal component for creating and editing package types. Follow the
`CategoryFormModal.vue` pattern exactly for modal structure, header,
footer, close behaviour, and Escape key dismissal.

**Form fields:**

Name (required):
- Text input, max 255 chars
- Label: "Package Name"
- Placeholder: "e.g. 5-Session Bundle"

Description (optional):
- Textarea, max 500 chars
- Label: "Description"

Sessions Count (required):
- Number input, min 1, integer only
- Label: "Number of Sessions"
- Tooltip (BookitTooltip): "How many sessions the customer receives
  when they purchase this package"

Price Mode (required):
- Radio group: "Fixed price" / "Discount rate"
- Label: "Pricing"

Fixed Price (shown when price_mode = 'fixed'):
- Number input, min 0.01, 2 decimal places
- Label: "Total Package Price (£)"
- Tooltip: "The total price the customer pays for the whole package"

Discount Percentage (shown when price_mode = 'discount'):
- Number input, min 0.01, max 100, 2 decimal places
- Label: "Discount (%)"
- Tooltip: "Discount applied to the sum of individual session prices.
  The lowest applicable service price is used for the calculation."

Expiry Toggle:
- Label: "Package Expires"
- Checkbox or toggle: enabled / disabled (default disabled)

Expiry Days (shown when expiry_enabled = true):
- Number input, min 1, integer only
- Label: "Expires after (days)"
- Tooltip: "Days from purchase date before unused sessions expire"

Applicable Services (optional):
- Multi-select or checkbox list of active services fetched from
  GET /dashboard/services/list (read existing service list API
  endpoint via GitHub to confirm the correct endpoint URL)
- Label: "Applicable Services"
- Helper text: "Leave empty to allow this package for all services"
- Tooltip: "Which services can be booked using this package"

**Validation (client-side before submit):**
- Name: required, not empty
- sessions_count: required, integer ≥ 1
- price_mode: required
- fixed_price: required and > 0 when price_mode = 'fixed'
- discount_percentage: required, 0.01–100 when price_mode = 'discount'
- expiry_days: required, integer ≥ 1 when expiry_enabled = true

**On save:**
- POST to /dashboard/package-types (create) or
  PATCH to /dashboard/package-types/{id} (edit)
- On success: emit 'saved' event, close modal, parent reloads list
- On API error: display error message inline in the modal (not a
  page-level toast) so the form stays open for correction

**Edit mode:**
- Modal receives a packageType prop when editing
- Pre-fill all fields from the packageType object
- Send PATCH on save

**Note:** Before implementing the multi-select services field, use
Context7 to verify current Vue 3 v-model patterns for checkbox lists
and dynamic form field visibility (v-show / v-if).

---

### SPRINT 4B INFRASTRUCTURE WIRING

No new PHP files, no new migrations, no new error codes.
The existing PHP API handles all validation and returns E5001–E5005
error codes. The Vue layer only needs to display API error messages.

---

### PHPUNIT REQUIREMENTS

Baseline: 706 tests, 0 failures — must not regress.

This task is Vue-only. No new PHPUnit tests required. The Package Types
API is already fully tested from Sprint 4D.

Run after implementation to confirm no regression:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 706 tests must pass before marking complete.

---

### ACCEPTANCE CRITERIA

#### Functional
- [ ] "Package Types" tab appears as the default/first tab in Packages.vue
- [ ] "Customer Packages" tab contains all existing customer packages
      content, working identically to before
- [ ] Package types table lists all types (active and inactive)
- [ ] Pricing displayed clearly for both fixed and discount modes
- [ ] Applicable services shows "All services" or count + tooltip
- [ ] Expiry shows "Never" or "{N} days"
- [ ] "Add Package Type" opens PackageTypeFormModal
- [ ] Creating a package type saves correctly and refreshes the list
- [ ] Editing a package type pre-fills the form and saves correctly
- [ ] Deactivating a package type shows confirmation, calls deactivate
      endpoint, updates the row status in the table
- [ ] Attempting to deactivate a type with active customer packages
      shows the API error message clearly
- [ ] Empty state shown when no package types exist
- [ ] Form validation prevents submit with missing required fields
- [ ] API errors shown inline in the modal (form stays open)

#### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PackageTypeFormModal follows CategoryFormModal.vue pattern
- [ ] Modal traps focus and dismisses with Escape key
- [ ] BookitTooltip.vue used for all field tooltips
- [ ] Tab switcher follows existing dashboard tab pattern
- [ ] PHPUnit suite passes (706 tests, 0 failures)

#### Must NOT break
- [ ] Existing Customer Packages tab content and all its interactions
      (search, filter, pagination, redeem modal, history rows)
- [ ] Packages nav item in sidebar still navigates to /packages
- [ ] CustomerProfile.vue packages tab (separate component, unaffected)
- [ ] Settings.vue packages_enabled toggle (unaffected)

---

### GIT COMMIT MESSAGE

```
Sprint 4E.5, Task 1: Package Types UI — admin CRUD tab in Packages.vue

- Add tab switcher to Packages.vue (Package Types / Customer Packages)
- New PackageTypeFormModal.vue component (create + edit)
- Package types table with pricing, services, expiry, status columns
- Deactivate action with confirmation and API error handling
- Empty state for no package types
- Existing Customer Packages tab content unchanged

Tests: 706 passing, 0 failures
```

---

### AFTER IMPLEMENTATION

Run: `npm run build`
(in bookit-booking-system/dashboard/ — dist/ is gitignored, must be
built manually in Local by Flywheel after Cursor completes its changes)

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.


Testing:
Clean implementation — matches the spec well. PHPUnit passing at 706 and build clean confirms no regressions.

One thing to verify before you test: the API endpoint paths. The prompt specified `/dashboard/package-types` but the Cursor response says `POST /package-types` and `PATCH /package-types/{id}` without the `/dashboard/` prefix. This is the exact same issue that caused the bulk action URL failure in Sprint 4C.5. Worth checking the actual code before you run manual tests.

Ask Cursor to confirm the endpoint URLs used in `PackageTypeFormModal.vue` match the pattern `/dashboard/package-types` — if they're missing the prefix the `useApi` composable will fail silently.

---

**Manual testing checklist:**

**Tab switching**
- [ ] Navigate to /packages — Package Types tab is selected by default
- [ ] Click Customer Packages tab — existing content appears unchanged
- [ ] Switch back to Package Types tab — state is preserved
- [ ] Both tabs work on mobile viewport

**Package Types — empty state**
- [ ] If no package types exist, empty state text shown correctly

**Create package type — fixed price**
- [ ] Click "Add Package Type"
- [ ] Modal opens with all fields empty
- [ ] Fill: name, 5 sessions, fixed price £100, no expiry, all services
- [ ] Save — type appears in table with correct pricing display (£100.00)
- [ ] Audit log entry visible in Audit Log view

**Create package type — discount mode**
- [ ] Create with 10 sessions, 20% discount, expiry enabled 30 days
- [ ] Expiry Days field only appears after enabling expiry toggle
- [ ] Fixed Price field hidden, Discount % field visible
- [ ] Saved correctly — table shows "20.00% discount" and "30 days"

**Create package type — specific services**
- [ ] Create with 3 specific services selected (not all)
- [ ] Table shows "3 services" with tooltip listing service names on hover
- [ ] Tooltip uses BookitTooltip component (check it doesn't clip in the table)

**Edit package type**
- [ ] Click Edit on an existing type
- [ ] Modal opens with all fields pre-filled correctly
- [ ] Price mode radio reflects saved value
- [ ] Applicable services checkboxes reflect saved selection
- [ ] Change name and save — table updates correctly

**Validation**
- [ ] Submit empty form — name error shown
- [ ] Submit with price mode = fixed but no price — price error shown
- [ ] Submit with discount mode but no % — error shown
- [ ] Submit with expiry enabled but no days — error shown
- [ ] Form stays open on all validation errors (does not close)

**Deactivate**
- [ ] Click Deactivate on an active type — confirmation shown
- [ ] Confirm — status badge changes to Inactive, button disappears
- [ ] Inactive types shown in table with grey badge, no deactivate button
- [ ] Attempt to deactivate a type that has active customer packages — API error message shown inline

**API error handling**
- [ ] Temporarily disconnect from dev environment and attempt save — error shown in modal, form stays open

**Customer Packages tab — regression check**
- [ ] Search works
- [ ] Status filter works
- [ ] Pagination works
- [ ] History rows expand correctly
- [ ] Redeem Session modal opens and works

Once PHPUnit passes and you've run through the manual checks, this one is done. Ready for Sprint 4F whenever you are.