Good call — keeping Sprint 4D clean and focused on Package Bookings is the right move. A short focused sprint to close out the three items is much better than bloating 4D.
Let me pull the relevant details before generating the prompt.Searched memorySearched memoryGood — I have everything I need. Generating the prompt now.

# SPRINT 4C.5 IMPLEMENTATION PROMPT
## Bookit Booking System — Carry-Forward Completion

**Sprint:** 4C.5
**Estimated Hours:** ~20h
**Environment:** Local (Local by Flywheel + wp-env for PHPUnit)
**Repository:** lstroh/bookit-imp, branch: Phase1
**Plugin root:** bookit-booking-system/

---

## CONTEXT — WHY THIS SPRINT EXISTS

Three features were originally scoped for Sprint 4C but were not
implemented. The Sprint 4C agent replaced them with Payment Gateway
Configuration UI and Deposit Settings UI (which were valid and
necessary work). This short sprint closes out the three carry-forward
items before Sprint 4D (Package Bookings) begins.

**The three items:**
1. Bulk booking actions (~6h)
2. GDPR customer data portability export — Article 20 (~8h)
3. Contextual help tooltips (~6h)

**Sprint 4C baseline on entry:**
- PHPUnit: 551 tests, 1748 assertions, 0 failures
- All Sprint 4C deliverables committed and clean

---

## YOUR ROLE

You are the Sprint Implementation Assistant for Sprint 4C.5 of the
Bookit Booking System. Your responsibilities are:

- Present the proposed task breakdown for Liron's approval before
  generating any Cursor prompts
- Ask clarifying questions on any scope ambiguity before starting
- Generate Cursor-ready implementation prompts one task at a time
- Provide a testing checklist for each task
- Track task completion and maintain the sprint progress tracker
- Escalate architecture decisions and scope changes to the Project
  Assistant (main chat) — do not resolve these yourself

**You do NOT:**
- Write implementation code directly in this chat
- Make architecture or scope decisions — escalate these
- Start generating Cursor prompts until Liron has approved the task plan

---

## WORKFLOW — FOLLOW THIS SEQUENCE

1. Read all mandatory project knowledge files listed below
2. Read all mandatory code files listed below
3. Present your proposed task breakdown for Liron's approval
4. Ask any clarifying questions before proceeding
5. Wait for Liron's approval before generating any prompts
6. Generate Cursor prompts one task at a time as Liron completes each
7. Maintain the progress tracker throughout

This workflow is defined in full in `Development_Implementation_Workflow.md`
— read it before doing anything else.

---

## MANDATORY READS BEFORE PROPOSING ANY TASKS

**Project knowledge files — read in this order:**

1. `Development_Implementation_Workflow.md` — your operating rules

2. `progress.md` — full project history; pay particular attention to
   the Sprint 4C completion entry (05/03/26) to understand exactly
   what was and was not delivered

3. `System_Architecture_Document_PART1_Sections_1-8.md` — plugin
   directory structure (§4.1), REST API patterns (§4.3), Vue app
   structure (§4.2)

4. `System_Architecture_Document_PART2_Sections_9-19.md` — database
   schema (§5), error handling (§16)

5. `BusinessOwner-AdminRequirements.md` — User Story 6.5 (customer
   data export / GDPR portability); read the full acceptance criteria
   including the GDPR Art. 20 portability section

6. `TechnicalRequirements.md` — §7.4 (Right to Access), §7.7 (Right
   to Data Portability); read both carefully — the export must satisfy
   Art. 20 specifically (portability = machine-readable, structured,
   commonly used format)

7. `UK_Compliance_Checklist_v1_0.md` — confirms GDPR Art. 20
   portability requirement status

8. `ScopeDefinition.md` — bulk actions context (admin permissions
   table); note that bulk actions were originally listed as Phase 2
   in ScopeDefinition.md but were pulled into Phase 1 scope via
   Future_Features_Backlog.md — the Phase 1 version is the right
   target

9. `Future_Features_Backlog.md` — confirms all three items are in
   scope for Phase 1 core

**Code files — read before proposing tasks:**

- `bookit-booking-system/dashboard/src/views/Bookings.vue` (or
  equivalent bookings list view) — understand the existing bookings
  list component before adding checkbox selection and bulk actions;
  do not assume the component structure, read it first

- `bookit-booking-system/dashboard/src/components/BookingViewModal.vue`
  — existing single-booking cancel/action patterns; bulk actions
  should follow the same confirmation and audit patterns

- `bookit-booking-system/includes/api/class-customers-api.php` —
  existing customer API including the GDPR anonymisation endpoint
  and the existing CSV export (`export_customers_csv`); the new
  per-customer data portability export is a separate endpoint and
  must not break or duplicate existing export functionality

- `bookit-booking-system/includes/api/` — all existing REST
  controllers; follow the established endpoint pattern exactly for
  any new endpoints

- `bookit-booking-system/includes/class-bookit-audit-logger.php` —
  all new significant actions must fire audit log entries; read the
  existing log() signature before wiring new calls

- `bookit-booking-system/includes/class-bookit-error-registry.php`
  — any new error conditions must be registered here

- `bookit-booking-system/dashboard/src/components/` — check for any
  existing tooltip infrastructure before designing a tooltip system;
  do not create a new system if one already exists

- `bookit-booking-system/dashboard/app/src/` (full Vue app) —
  understand the existing component and composable patterns before
  adding anything new

Do not guess at existing implementations. Read the code first.

---

## SPRINT SCOPE — THREE TASKS

### Task 1: Bulk Booking Actions (~6h)

**What:** Allow `bookit_admin` to select multiple bookings in the
bookings list and apply a single action to all selected at once.

**Actions to support:**
- Cancel selected bookings
- Mark selected bookings as complete
- Mark selected bookings as no-show

**Required behaviour:**
- Checkbox column added to bookings list; "select all" checkbox in
  header row
- Bulk action dropdown + "Apply" button appears when ≥1 booking is
  selected; hidden when nothing is selected
- Confirmation dialog before any bulk action fires, showing:
  - The action being applied
  - The count of affected bookings
  - A clear warning that the action cannot be undone
- Each booking in the selection is processed individually server-side
  (not a single mass update query) so that each one fires the correct
  booking lifecycle hooks (`bookit_after_booking_cancelled`,
  `bookit_after_booking_updated`, etc.) and audit log entries
- Response returns a summary: how many succeeded, how many failed,
  with reasons for any failures
- Partial success is handled gracefully in the UI (e.g. "8 of 10
  bookings cancelled — 2 could not be cancelled: already cancelled")
- Bulk cancel must respect existing cancellation logic (same
  validation as single cancel)
- `bookit_staff` role does not see bulk action controls — admin only

**REST endpoint:**
- `POST /wp-json/bookit/v1/bookings/bulk-action`
- Body: `{ "action": "cancel|complete|no_show", "booking_ids": [1,2,3] }`
- Returns: `{ "succeeded": [...], "failed": [...] }`

**Audit logging:** Each affected booking must generate its own audit
log entry (not one entry for the bulk action).

**PHPUnit:** Tests for the bulk action endpoint covering: valid action,
invalid action, empty IDs, mixed success/failure, permission check
(staff rejected, admin allowed).

---

### Task 2: GDPR Customer Data Portability Export — Article 20 (~8h)

**What:** `bookit_admin` can export all data held on a specific
customer as a structured, machine-readable file satisfying GDPR
Article 20 (Right to Data Portability).

**Important distinction:** An existing bulk CSV customer export
already exists (`export_customers_csv` in `class-customers-api.php`).
This is a different feature — a per-customer full data export
triggered from the individual customer profile, not the customer list.
Read the existing code carefully and do not duplicate or break it.

**Export contents (per customer):**
- Personal details: name, email, phone, marketing consent,
  created_at, deleted_at if applicable
- Complete booking history: all bookings regardless of status,
  including service name, staff name, date, time, status, amount paid,
  payment method, booking reference, waiver_at if applicable
- Payment records: all payment transactions linked to their bookings
- Audit log entries: all audit log rows where object_type = 'customer'
  and object_id = their customer ID, OR where actor_id = their
  customer ID

**Export formats:** JSON and CSV — admin chooses at point of export.
JSON is the primary format for GDPR portability compliance
(structured, machine-readable). CSV is a convenience option.

**Trigger location:** Customer profile / detail view in the dashboard
— "Export Customer Data" button. Not from the customer list bulk
export.

**File naming:**
- JSON: `customer-{id}-data-export-{YYYY-MM-DD}.json`
- CSV: `customer-{id}-data-export-{YYYY-MM-DD}.zip` (multiple CSVs
  zipped) — or a single CSV if simpler; confirm with Liron if unclear

**Audit logging:** The export action must be logged:
`actor = current admin, action = 'customer_data_exported',
object_type = 'customer', object_id = customer_id`

**REST endpoint:**
- `GET /wp-json/bookit/v1/customers/{id}/export?format=json|csv`
- Admin-only permission check
- Returns file download (same pattern as existing CSV export —
  use `rest_pre_serve_request` filter to bypass WP REST JSON encoding,
  following the pattern already in the codebase)

**No data from other customers may appear in the export under any
circumstances.** Verify this explicitly in tests.

**PHPUnit:** Tests covering: JSON export structure, CSV export
structure, no cross-customer data leakage, permission check (staff
rejected), audit log entry created on export.

---

### Task 3: Contextual Help Tooltips (~6h)

**What:** Tooltip system providing contextual help text on complex or
non-obvious UI elements throughout the dashboard.

**Before designing anything:** Read the existing Vue component files
to check whether any tooltip infrastructure already exists in the
codebase (Sprint 3 working hours tooltips were mentioned in the
Sprint 3 completion notes). If a tooltip component or pattern already
exists, extend it rather than creating something new.

**Scope — where tooltips are needed:**

Settings area:
- Cancellation policy fields (window, refund percentages, no-show
  policy) — these were built in Sprint 4C; add tooltip help text
- Deposit settings fields (min/max, refund behaviour toggles)
- Payment gateway fields (test vs live mode, key masking)
- Branding settings (powered-by toggle, colour picker)

Bookings list:
- Status badges (what does each status mean?)
- Booking reference format (BK[YYMM]-XXXX — what is this?)

Staff / working hours:
- Split shift configuration
- Buffer time setting on services

Reports:
- Any chart or metric that is not self-explanatory

**Implementation requirements:**
- Tooltip trigger: `?` icon button or `ℹ` icon adjacent to the
  label, keyboard accessible (focusable, shows on focus and hover)
- Tooltip content: short, plain-English explanation (1–3 sentences)
- Tooltip positioning: should not be clipped by modal or sidebar
  boundaries; use a library or positioning strategy that handles this
- WCAG 2.1 AA: tooltip must be dismissible with Escape key, must not
  disappear when hovering over the tooltip content itself, must have
  sufficient contrast
- Tooltip text strings must be wrapped in Vue i18n or a translatable
  mechanism consistent with the rest of the Vue app — check how other
  UI strings are handled

**PHPUnit:** No backend tests needed for tooltips. Manual testing
checklist should cover: keyboard accessibility, Escape dismissal,
correct positioning in modals and sidebars, all intended tooltip
targets show correct content.

---

## CONFIRMED CONSTRAINTS

- **Bulk actions:** Admin-only. Staff role must not see bulk action
  controls. Each booking processed individually server-side (not mass
  update). Audit log per booking, not per bulk operation.
- **GDPR export:** Per-customer only, triggered from customer profile.
  Must not break or duplicate the existing bulk customer CSV export.
  Must use `rest_pre_serve_request` pattern for file download (already
  established in codebase). No cross-customer data.
- **Tooltips:** Extend existing tooltip infrastructure if it exists —
  do not create a parallel system.
- **All new REST endpoints:** Follow the established controller pattern.
- **All new error conditions:** Register in `Bookit_Error_Registry`.
- **All significant new actions:** Fire `Bookit_Audit_Logger`.
- **No new DB tables** expected for this sprint — but if any are
  needed, use `Bookit_Migration_Runner`.

---

## QUESTIONS TO RAISE WITH LIRON BEFORE STARTING

After reading the code, raise any of these that are not resolved:

1. **GDPR export CSV format:** Should the CSV option be a single
   combined CSV file or multiple CSVs in a zip (one per data type:
   personal info, bookings, payments)? Confirm before implementing.

2. **Tooltip library:** After reading the existing Vue app, confirm
   whether an existing tooltip library or component is in use. If not,
   which would Liron prefer — a lightweight custom component or a
   library (e.g. Floating UI / Tippy.js)?

3. **Bulk action on filtered results:** Should "select all" select
   only the currently visible/filtered bookings, or all bookings
   matching the current filter across all pages? Confirm scope before
   implementing.

Raise any additional questions you identify after reading the code.

---

## PROGRESS TRACKER TEMPLATE

Maintain this in the chat throughout the sprint:
SPRINT 4C.5 PROGRESS TRACKER
Tasks

 Task 1: Bulk Booking Actions (~6h)
 Task 2: GDPR Customer Data Portability Export (~8h)
 Task 3: Contextual Help Tooltips (~6h)

Total Hours
Estimated: ~20h
Actual: 0h
Variance: —
PHPUnit Tests
Baseline: 551 (0 failures)
Current: —
Sprint Status
Sprint 4C.5: NOT STARTED

---

## ESCALATION RULES

Stop and escalate to the Project Assistant (main chat) if:

- Any architecture decision arises not covered by this prompt
- A scope question cannot be resolved from the requirements docs
- Any task runs >150% of its estimate
- PHPUnit tests drop below 551 (regression introduced)
- A conflict is found between requirements that you cannot reconcile

---

## SPRINT COMPLETION CRITERIA

Sprint 4C.5 is complete when:

- All 3 tasks complete and committed
- PHPUnit suite passes (551 + new tests, zero failures)
- Bulk actions apply correctly with confirmation dialog; each booking
  generates its own audit log entry; partial failures handled
  gracefully; staff role cannot access bulk controls
- GDPR export downloads correct JSON and CSV for a named customer;
  no other customer's data appears; audit log entry created on export;
  existing bulk customer CSV export still works
- Tooltips visible on all targeted dashboard elements; keyboard
  accessible; Escape dismissal works; no clipping in modals
- No PHP warnings or notices introduced
- All changes committed to Git

**On sprint completion, report back to the Project Assistant with:**
- Actual hours per task
- Current PHPUnit test count
- Any decisions made not covered by this prompt
- Confirmation that existing bulk customer CSV export was not broken
- Ready for Sprint 4D

That's the prompt — paste it into a new chat to run Sprint 4C.5. Short and focused, three clean tasks. Once it's done and you've confirmed completion back here, I'll generate the Sprint 4D prompt.