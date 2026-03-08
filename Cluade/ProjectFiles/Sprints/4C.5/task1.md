Approved. Generating the Task 1 Cursor prompt now.

---

## Task 1: Bulk Booking Actions — Cursor Implementation Prompt

---

```
# CURSOR IMPLEMENTATION PROMPT
## Sprint 4C.5 — Task 1: Bulk Booking Actions
## Bookit Booking System | Branch: Phase1

---

## YOUR ROLE

You are implementing the Bulk Booking Actions feature for the Bookit
Booking System WordPress plugin. Read all specified files before
writing a single line of code. Do not guess at existing
implementations.

---

## MANDATORY READS — DO THESE FIRST

Read these files completely before writing any code:

1. `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`
   — existing booking endpoints; follow the exact same pattern for
   the new bulk-action endpoint (permission_callback, nonce, response
   format, error handling)

2. `bookit-booking-system/includes/class-bookit-audit-logger.php`
   — read the log() method signature; you will call this once per
   booking processed

3. `bookit-booking-system/includes/class-bookit-error-registry.php`
   — read the existing error code ranges and registration pattern;
   you will register new error codes here

4. `bookit-booking-system/dashboard/src/views/Bookings.vue`
   — read the entire component: table structure, existing columns,
   filter/pagination state, how bookings data is fetched and stored.
   The checkbox column must integrate with this exact structure.

5. `bookit-booking-system/dashboard/src/components/BookingViewModal.vue`
   — read how single-booking cancel/status actions are confirmed and
   executed; the bulk confirmation dialog must follow the same
   confirmation and error-display patterns

6. `bookit-booking-system/includes/class-bookit-booking-status.php`
   (or equivalent) — confirm the exact status strings used in the DB
   for cancelled, complete, no_show. Do NOT assume — read the file.

7. `bookit-booking-system/tests/` — read one existing test file for
   the bookings API to understand the test class structure, setUp
   pattern, and how the REST server is initialised in tests.

---

## WHAT YOU ARE BUILDING

### Overview

Allow `bookit_admin` users to select multiple bookings in the
bookings list and apply a single action (cancel, complete, or no_show)
to all selected at once.

### Scope

- Checkbox column in bookings list table
- "Select all" checkbox in header (selects current visible page only)
- Bulk action dropdown + "Apply" button (visible only when ≥1 booking
  is selected)
- Confirmation dialog before any action fires
- New REST endpoint that processes each booking individually
- Per-booking audit log entries
- Partial success handled gracefully in the UI
- Admin-only — `bookit_staff` must not see bulk controls

---

## BACKEND — NEW REST ENDPOINT

### Register the route

In `class-dashboard-bookings-api.php`, register alongside existing
booking routes:

```php
register_rest_route( 'bookit/v1', '/bookings/bulk-action', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'bulk_action' ],
    'permission_callback' => [ $this, 'admin_only_permission' ],
] );
```

Use the existing admin-only permission callback already in this file
(the one that checks for `bookit_admin` capability). Do not create a
new one.

### Request body

```json
{
  "action": "cancel | complete | no_show",
  "_wpnonce": "...",
  "booking_ids": [1, 2, 3]
}
```

### Response body

```json
{
  "succeeded": [1, 3],
  "failed": [
    { "id": 2, "reason": "Booking is already cancelled" }
  ]
}
```

### Processing logic — CRITICAL

Each booking must be processed individually in a loop — NOT a single
mass UPDATE query. This ensures:
- Booking lifecycle hooks fire for each booking
  (`bookit_after_booking_cancelled`, `bookit_after_booking_updated`)
- Audit log entry fires for each booking
- Existing single-booking validation runs for each booking

For each booking_id:
1. Fetch the booking row
2. Validate: booking exists, belongs to this site, current status
   allows the requested transition (e.g. already-cancelled bookings
   cannot be cancelled again)
3. Update the status
4. Fire the appropriate lifecycle action hook
5. Call `Bookit_Audit_Logger::log()` with:
   - actor_id = current user ID
   - action = 'booking_bulk_cancelled' | 'booking_bulk_completed' |
     'booking_bulk_no_show'
   - object_type = 'booking'
   - object_id = booking ID
6. Add to $succeeded or $failed accordingly

### Validation rules

- `action` must be one of: cancel, complete, no_show — return 400
  if not
- `booking_ids` must be a non-empty array of integers — return 400
  if empty or missing
- Max 100 booking IDs per request — return 400 if exceeded (prevents
  abuse)
- Each booking: must exist and belong to this site
- Status transition rules (read existing single-cancel logic to match):
  - cancel: allowed from pending, confirmed — not from already
    cancelled, completed, no_show
  - complete: allowed from confirmed — not from pending, cancelled,
    no_show, already completed
  - no_show: allowed from confirmed — not from cancelled, completed,
    already no_show

### New error codes

Register these in `Bookit_Error_Registry` following the existing
pattern. Choose codes in the correct range (check what ranges are
already in use — do not collide):

- `BULK_INVALID_ACTION` — invalid action value
- `BULK_EMPTY_IDS` — booking_ids missing or empty
- `BULK_TOO_MANY_IDS` — exceeds 100 limit

---

## FRONTEND — Bookings.vue

### Checkbox column

Add a checkbox column as the first column in the bookings table:
- Header cell: `<input type="checkbox">` — "select all on this page"
- Each row: `<input type="checkbox" :value="booking.id"
  v-model="selectedIds">`
- `selectedIds` is a `ref([])` in the component
- When the page/filter changes (bookings list reloads), clear
  `selectedIds`
- When header checkbox is clicked:
  - If all visible bookings are selected → deselect all
  - Otherwise → select all visible bookings on the current page

### Bulk action controls

Render these controls ONLY when `selectedIds.length > 0` AND the
current user role is `bookit_admin` (check how the existing code
determines the current user role — read the existing component to
find this pattern):

```html
<div v-if="selectedIds.length > 0 && isAdmin" class="bulk-actions">
  <select v-model="bulkAction">
    <option value="">Select action...</option>
    <option value="cancel">Cancel bookings</option>
    <option value="complete">Mark as complete</option>
    <option value="no_show">Mark as no-show</option>
  </select>
  <button @click="applyBulkAction" :disabled="!bulkAction">
    Apply to {{ selectedIds.length }} booking(s)
  </button>
</div>
```

Place this above the bookings table. Use the existing Tailwind utility
classes used elsewhere in the component for spacing and button styles —
do not introduce new CSS classes.

### Confirmation dialog

Before firing the API call, show a confirmation dialog using the
same modal/dialog pattern already used in `BookingViewModal.vue`.
The dialog must show:

- The action being applied (e.g. "Cancel bookings")
- The count: "This will apply to X booking(s)"
- Warning: "This action cannot be undone."
- Two buttons: "Confirm" and "Cancel"

### API call

On confirm, POST to `/wp-json/bookit/v1/bookings/bulk-action` with:
```json
{
  "action": "<selected action>",
  "booking_ids": [<selectedIds>],
  "_wpnonce": "<nonce>"
}
```

Use the same Axios/fetch pattern already used in the component for
other API calls.

### Success / partial failure handling

After the response:
- If all succeeded: show a success toast/notification ("X bookings
  updated") and refresh the bookings list
- If partial failure: show a message listing the count that succeeded
  and the reasons for each failure (e.g. "8 of 10 bookings cancelled.
  2 could not be updated: [reason]")
- If all failed: show an error message
- In all cases: clear `selectedIds` and refresh the bookings list

Use the same notification/toast pattern used elsewhere in the Vue app
— do not create a new notification system.

### Admin-only guard

The bulk action controls must not render for `bookit_staff` users.
Read the existing component to find how user role is determined
(likely from a Vuex store, composable, or injected prop) and use
the same mechanism.

---

## PHPUNIT TESTS

Create a new test file:
`bookit-booking-system/tests/test-bulk-booking-actions.php`

Test class should extend the same base class used by other API tests.

Required test cases:

1. `test_bulk_cancel_success` — admin cancels 3 confirmed bookings;
   all 3 return in succeeded array; DB statuses updated; audit log
   entries created (assert 3 log rows)

2. `test_bulk_complete_success` — admin marks 2 confirmed bookings
   as complete; both succeed

3. `test_bulk_no_show_success` — admin marks 2 confirmed bookings as
   no_show; both succeed

4. `test_bulk_invalid_action` — POST with action = 'delete'; expect
   400 response with correct error code

5. `test_bulk_empty_ids` — POST with booking_ids = []; expect 400

6. `test_bulk_too_many_ids` — POST with 101 booking IDs; expect 400

7. `test_bulk_mixed_success_failure` — 3 bookings: 2 confirmed,
   1 already cancelled; cancel action; assert 2 in succeeded, 1 in
   failed with reason string

8. `test_bulk_staff_permission_denied` — authenticate as bookit_staff;
   POST to bulk-action; expect 403

9. `test_bulk_unauthenticated_denied` — no auth; expect 401 or 403

10. `test_bulk_audit_log_per_booking` — cancel 3 bookings; query
    audit log table; assert exactly 3 rows with action =
    'booking_bulk_cancelled' and correct object_ids

---

## ACCEPTANCE CRITERIA

Before marking this task complete, verify ALL of the following:

### Backend
- [ ] POST /wp-json/bookit/v1/bookings/bulk-action registered and
      reachable (test with WP REST API browser or curl)
- [ ] Each booking processed individually (not mass update)
- [ ] Lifecycle hooks fire for each booking
- [ ] Audit log creates one entry per booking (not one for the batch)
- [ ] Validation rejects: invalid action, empty IDs, >100 IDs
- [ ] Staff role returns 403
- [ ] Partial success returns correct succeeded/failed structure

### Frontend
- [ ] Checkbox column visible in bookings list
- [ ] "Select all" selects only current page
- [ ] Bulk action controls hidden when no bookings selected
- [ ] Bulk action controls hidden for bookit_staff role
- [ ] Confirmation dialog shows action + count + warning
- [ ] Partial failure message is human-readable
- [ ] selectedIds cleared after action
- [ ] Bookings list refreshes after action

### Tests
- [ ] All 10 PHPUnit tests pass
- [ ] No existing tests broken (run full suite)
- [ ] PHPUnit count increases from 551 baseline

### General
- [ ] No PHP warnings or notices introduced
- [ ] No JavaScript console errors
- [ ] Code committed to Git with message:
      "Sprint 4C.5, Task 1: Bulk booking actions"

---

## THINGS TO WATCH OUT FOR

- The status string for no-show: confirm whether the DB stores
  `no_show` or `no-show` — there was a historic bug with this
  (documented in progress.md). Use whatever the existing codebase
  consistently uses — do NOT introduce a new variant.

- Do not touch the existing single-booking cancel/complete/no_show
  logic. The bulk endpoint calls the same underlying validation and
  update logic — it does not replace it.

- The REST endpoint must verify the nonce. Follow the exact nonce
  pattern used in other POST endpoints in this file.

- Do not create a new user role check mechanism. Find how the
  existing code identifies bookit_admin vs bookit_staff and use
  the same approach in both PHP and Vue.
```

---

**SPRINT 4C.5 PROGRESS TRACKER**

| Task | Status | Est | Actual |
|------|--------|-----|--------|
| Task 1: Bulk Booking Actions | 🔄 In progress | ~6h | — |
| Task 2: GDPR Data Portability Export | ⬜ Not started | ~8h | — |
| Task 3: Contextual Help Tooltips | ⬜ Not started | ~6h | — |
| **Total** | | **~20h** | **0h** |

**PHPUnit baseline:** 551 tests, 0 failures

---

When Task 1 is complete and committed, come back with:
- Actual hours
- PHPUnit test count
- Any decisions Cursor had to make that weren't covered above (escalate anything architectural before committing)