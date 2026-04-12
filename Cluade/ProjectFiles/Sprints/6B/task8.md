Here is the Task 8 Cursor prompt:

---

# TASK 8 OF 8: Staff Edit Form — Google Calendar Status (Admin View)
**Sprint: 6B-1 | Est: 1.5h | Plugin root: `bookit-booking-system/`**

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/components/StaffFormModal.vue` — full file; identify the existing card/section pattern, find the notification preferences section, identify where to insert the Google Calendar status row
2. `includes/api/class-dashboard-bookings-api.php` — read `get_staff()` and the single staff GET endpoint response shape; read `check_admin_permission()` pattern; read how `update_staff()` works and which fields it accepts
3. `includes/integrations/class-bookit-google-calendar-api.php` — read `disconnect()` method signature
4. `includes/api/class-bookit-google-calendar-rest-controller.php` — full file; understand existing route registration pattern before adding new route

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task adds a read-only Google Calendar status display to the Staff edit form (admin view only). Admins can see whether a staff member has connected their Google Calendar and can disconnect it on their behalf. Two changes are needed: extend the `GET staff/{id}` response to include connection fields, and add a new admin-only disconnect endpoint. The Vue component displays the status and disconnect button in edit mode only.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

- Read `get_staff()` fully before modifying
- Extend the single staff member GET response to include:
```json
{
  "google_calendar_connected": true,
  "google_calendar_email": "sarah@gmail.com"
}
```
- Read `google_calendar_connected` (cast to bool) and `google_calendar_email` from `wp_bookings_staff` for the requested staff_id
- These fields must be added to the existing response — do not change any other fields or break the existing response shape
- `bookit_staff` role must NOT be able to see other staff members' Google Calendar status — this endpoint is admin only; confirm the existing permission check before modifying

---

### `includes/api/class-bookit-google-calendar-rest-controller.php` — MODIFY

Add one new route:

**`POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect`**
- Permission: admin only — use `check_admin_permission()` pattern from `class-dashboard-bookings-api.php`
- Route parameter: `id` = staff_id (integer, required, > 0)
- Handler:
  - Validate `id` param — return 400 if not a positive integer
  - Confirm staff member exists in `wp_bookings_staff` — return 404 if not found
  - Call `Bookit_Google_Calendar_Api::disconnect( $staff_id )`
  - Return `{ "success": true }`
- `bookit_staff` role must be blocked from this endpoint

---

### `dashboard/src/components/StaffFormModal.vue` — MODIFY

- Read the full file before modifying — find the notification preferences section and the existing pattern for read-only display rows
- Add a **Google Calendar** status section in **edit mode only** (not visible when creating a new staff member)
- Place it below the notification preferences section
- Follow the existing card/section pattern exactly

**UI layout:**

```
Google Calendar
──────────────────────────────────────────
● Connected (sarah@gmail.com)  [Disconnect]
○ Not connected
──────────────────────────────────────────
```

- Show connected state (green indicator + email) when `google_calendar_connected === true`
- Show not connected state (grey indicator) when `google_calendar_connected === false`
- **Disconnect button** (visible only when connected):
  - Calls `POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect`
  - On success: updates local state to show not connected without page reload
  - Shows loading state while request is in flight
  - Shows error message if request fails
- The section is **read-only** — admin cannot connect on behalf of staff (staff must connect themselves via My Profile)
- Add a small helper text below the section: `"Staff members can connect their Google Calendar from their profile page"`
- Follow existing loading state and error handling patterns in `StaffFormModal.vue`

> **Note:** Before implementing any Vue 3 reactive patterns, use Context7
> to resolve `Vue 3` and confirm current `ref` and `computed` API if the
> component uses Composition API.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] `GET bookit/v1/dashboard/staff/{id}` response extended with `google_calendar_connected` and `google_calendar_email`
- [ ] `POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect` registered and admin-only
- [ ] `Bookit_Google_Calendar_Api::disconnect()` called by the new endpoint
- [ ] `bookit_staff` role blocked from both the extended GET fields and the disconnect endpoint
- [ ] Audit log fired via `disconnect()` — already handled by `Bookit_Google_Calendar_Api::disconnect()` from Task 4

---

## PHPUNIT REQUIREMENTS

Baseline: **972 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-google-calendar-admin.php`

Required test cases:
- `test_get_staff_response_includes_google_calendar_fields` — assert `GET staff/{id}` response contains `google_calendar_connected` and `google_calendar_email`
- `test_admin_disconnect_endpoint_clears_tokens` — call disconnect endpoint as admin, assert `google_calendar_connected = 0` and token columns NULL
- `test_staff_role_cannot_access_disconnect_endpoint` — call disconnect endpoint as `bookit_staff` role, assert 403 returned
- `test_disconnect_endpoint_returns_404_for_nonexistent_staff` — call with non-existent staff_id, assert 404 returned

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Staff edit form (admin view) shows Google Calendar connected status and email
- [ ] Staff edit form shows "Not connected" when staff has not connected
- [ ] Admin can disconnect a staff member's calendar from the edit form
- [ ] Disconnect updates the UI immediately without page reload
- [ ] Helper text directs staff to My Profile to connect
- [ ] Section is hidden when creating a new staff member (edit mode only)

### Technical
- [ ] `GET staff/{id}` response includes `google_calendar_connected` and `google_calendar_email`
- [ ] Disconnect endpoint is admin-only — `bookit_staff` role gets 403
- [ ] Non-existent staff_id returns 404
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (972+ tests, 0 failures)

### Must NOT break
- [ ] Existing staff GET response fields all still present
- [ ] Existing staff create/edit/delete flows unaffected
- [ ] My Profile Google Calendar connect/disconnect (Task 4) unaffected
- [ ] All existing REST endpoints unaffected

---

## FRONTEND BUILD

After implementation, run:
```bash
npm run build
```
in `bookit-booking-system/dashboard/`

---

## GIT COMMIT MESSAGE

```
Sprint 6B-1, Task 8: Staff edit form Google Calendar status + admin disconnect

- class-dashboard-bookings-api.php: extend get_staff response with
  google_calendar_connected and google_calendar_email
- class-bookit-google-calendar-rest-controller.php: admin disconnect
  endpoint POST staff/{id}/google-calendar/disconnect
- StaffFormModal.vue: read-only Google Calendar status + disconnect button
- tests/unit/test-google-calendar-admin.php: 4 new tests

Tests: 972+ passing, 0 failures
```

---

> ⚠️ If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, **STOP and report back before writing any code.**