Let me read the key files for 5A-5 before writing the prompt.Good — I have the table columns confirmed and the Vue router/sidebar pattern from the sprint4d summary. Now let me write the prompt:

---

```
TASK 5A-5 OF 6: Admin Email Queue Log View
Sprint: 5A | Est: 6h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/notifications/class-bookit-email-queue.php` — read in full.
   Note the table name (`wp_bookit_email_queue`), all column names, and
   any existing query methods that can be reused or followed.
2. `includes/api/class-dashboard-bookings-api.php` — read the pagination
   pattern (how `page`, `per_page`, `total`, `pages` are handled) and
   the permission check pattern for admin-only endpoints. Also read how
   `bookit_staff` role is blocked on admin-only endpoints.
3. `dashboard/src/views/Packages.vue` — read in full. This is the primary
   pattern to follow for the new `EmailQueue.vue` view: table layout,
   status badges, filter dropdown, pagination, empty state, admin-only
   guard. Follow it exactly.
4. `dashboard/src/router/index.js` — read to find how to register the new
   `/email-queue` route with `requiresAdmin: true`.
5. `dashboard/src/components/Sidebar.vue` (or equivalent sidebar file —
   read the directory listing to find it) — find where admin-only nav
   items are added (e.g. Packages) and follow the same pattern.
6. `includes/class-bookit-loader.php` — confirm how new API controller
   classes are registered so the new endpoint class is wired up.
7. `tests/unit/test-email-queue-api.php` if it exists, otherwise read
   `tests/unit/test-dashboard-bookings-api.php` for the test pattern.

---

## CONTEXT

This task delivers the admin email queue log view deferred from Sprint 4H.
It is read-only — no create, edit, or delete actions. The PHP backend
delivers a new paginated REST endpoint. The Vue frontend adds a new view,
route, and sidebar nav item (admin only). The `bookit_staff` role must be
completely blocked from both the endpoint and the nav item.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-email-queue-api.php` — CREATE

New controller class following the same pattern as
`class-dashboard-bookings-api.php`. Register one route:

```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/email-queue',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_email_queue' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'page'     => array(
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'default'           => 25,
                'sanitize_callback' => 'absint',
            ),
            'status'   => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    )
);
```

`get_email_queue()` method:

1. **Admin-only check** — after `check_dashboard_permission()` passes,
   additionally check the role. Read `class-dashboard-bookings-api.php`
   to find the exact role-check pattern. If `bookit_staff` role: return
   `new WP_Error('forbidden', __('Access denied.', 'bookit-booking-system'), ['status' => 403])`.

2. **Params** — `$page = max(1, absint($request->get_param('page')))`,
   `$per_page = min(100, max(1, absint($request->get_param('per_page'))))`,
   `$status = sanitize_text_field($request->get_param('status'))`.

3. **Valid status values** — `pending`, `processing`, `sent`, `failed`,
   `cancelled`. If `$status` is non-empty and not in this list, return
   400 error.

4. **Query** — direct `$wpdb` query against `wp_bookit_email_queue`.
   Read the table columns from `class-bookit-email-queue.php` first.
   Return these columns per row:
   `id, booking_id, email_type, recipient_email, status, attempts,
   max_attempts, scheduled_at, sent_at, last_error, created_at`
   (omit `html_body`, `subject`, `params` — too large for a log view).

   With status filter:
   ```sql
   SELECT id, booking_id, email_type, recipient_email, status,
          attempts, max_attempts, scheduled_at, sent_at,
          last_error, created_at
   FROM {prefix}bookit_email_queue
   [WHERE status = %s]
   ORDER BY id DESC
   LIMIT %d OFFSET %d
   ```

5. **Total count** — separate `COUNT(*)` query with same WHERE clause.

6. **Response**:
   ```php
   return rest_ensure_response(array(
       'items' => $rows,
       'total' => (int) $total,
       'pages' => (int) ceil( $total / $per_page ),
       'page'  => $page,
   ));
   ```

### `includes/class-bookit-loader.php` — MODIFY

Read the file first. Add the new `Bookit_Email_Queue_API` controller
following the exact pattern used for other dashboard API controllers.

### `dashboard/src/views/EmailQueue.vue` — CREATE

Read `Packages.vue` in full first. Follow its exact structure for:
table layout, loading state, error state, empty state, status badge
component pattern, filter dropdown, pagination controls, and admin-only
guard. Adapt for email queue columns.

**Columns to display:**

| Column | Field | Notes |
|--------|-------|-------|
| Type | `email_type` | Plain text |
| Recipient | `recipient_email` | Plain text |
| Status | `status` | Badge (see colours below) |
| Attempts | `attempts` / `max_attempts` | Format: `1 / 3` |
| Scheduled | `scheduled_at` | Human-readable datetime |
| Sent | `sent_at` | Human-readable datetime or `—` if null |
| Error | `last_error` | Truncated to 60 chars, full on hover via `title` attribute |

**Status badge colours** (use Tailwind utility classes, same as
`Packages.vue` badge pattern):
- `pending` → grey (`bg-gray-100 text-gray-700`)
- `processing` → blue (`bg-blue-100 text-blue-700`)
- `sent` → green (`bg-green-100 text-green-700`)
- `failed` → red (`bg-red-100 text-red-700`)
- `cancelled` → grey (`bg-gray-100 text-gray-700`)

**Filter dropdown** — filter by status: All / Pending / Processing /
Sent / Failed / Cancelled. Selecting a status re-fetches page 1.

**Pagination** — reuse the exact same pagination component/pattern as
`Packages.vue`. No create/edit/delete buttons anywhere.

**Empty state** — "No email queue items found." with appropriate icon
or styling, matching the `Packages.vue` empty state pattern.

**API call** — `GET /bookit/v1/dashboard/email-queue` with `page`,
`per_page`, `status` params. Use the same `fetch` + nonce header pattern
as existing views. Read `Packages.vue` to confirm the exact fetch pattern.

**Admin-only guard** — if the current user is not admin, show an access
denied message or redirect. Read `Packages.vue` to see how it handles
this — follow the same pattern.

### `dashboard/src/router/index.js` — MODIFY

Read the file first. Add the email queue route following the same pattern
as the Packages route:

```js
{
  path: '/email-queue',
  name: 'EmailQueue',
  component: () => import('../views/EmailQueue.vue'),
  meta: { requiresAdmin: true }
}
```

### `dashboard/src/components/Sidebar.vue` — MODIFY

Read the file first. Find where the Packages nav item is added (admin
only). Add the Email Queue nav item in the same section, following the
exact same pattern:

- **Label:** "Email Queue"
- **Route:** `/bookit-dashboard/app/email-queue`
- **Icon:** use whatever icon is closest to "email" or "queue" in the
  existing icon set — read the sidebar to see available icon names
- **Admin only:** yes — same guard as Packages

---

## INFRASTRUCTURE REQUIREMENTS

- [x] New REST endpoint `GET bookit/v1/dashboard/email-queue`
- [x] `bookit_staff` role blocked at endpoint level
- [x] `bookit_staff` role blocked at sidebar nav level (admin-only)
- [x] No create/edit/delete — read only throughout
- [x] `html_body`, `subject`, `params` columns excluded from response
      (too large — log view only)
- [x] Frontend build required after Vue changes

---

## PHPUNIT REQUIREMENTS

Baseline: **852 tests, 0 failures** — must not regress.

New test file: `tests/unit/test-email-queue-api.php`

Follow the class structure and setUp() from `tests/unit/test-dashboard-bookings-api.php`.

Required test cases:

- `test_email_queue_endpoint_requires_auth`
  Call the endpoint without a dashboard session. Assert 401.

- `test_email_queue_returns_paginated_results`
  Insert 3 queue rows directly via `$wpdb->insert`. GET endpoint.
  Assert response contains `items` array, `total`, `pages`.

- `test_email_queue_filters_by_status`
  Insert 2 `pending` rows and 1 `sent` row. GET with `status=pending`.
  Assert only 2 items returned.

- `test_email_queue_staff_role_is_blocked`
  Log in as `bookit_staff`. GET endpoint. Assert 403.

- `test_email_queue_returns_correct_fields`
  Insert one row. GET endpoint. Assert response item contains
  `email_type`, `recipient_email`, `status`, `attempts` and does NOT
  contain `html_body` or `params`.

- `test_email_queue_rejects_invalid_status_filter`
  GET with `status=invalid_value`. Assert 400.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `/bookit-dashboard/app/email-queue` renders for admin users
- [ ] Table shows all queue columns with correct data
- [ ] Status badges show correct colours per status
- [ ] Attempts column shows `X / Y` format
- [ ] Status filter dropdown re-fetches correctly
- [ ] Pagination works — page 2 loads page 2 of results
- [ ] `sent_at` shows `—` when null
- [ ] `last_error` truncated to 60 chars with full text on hover
- [ ] Empty state shown when no items match filter

### Technical
- [ ] `bookit_staff` role sees 403 from the API endpoint
- [ ] `bookit_staff` does not see "Email Queue" in the sidebar
- [ ] `html_body`, `subject`, `params` NOT in API response
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Frontend built after Vue changes
- [ ] PHPUnit suite passes (852+ tests, 0 failures)

### Must NOT break
- [ ] Packages view — still renders and paginates correctly
- [ ] Existing dashboard nav items — all still present and working
- [ ] Email queue processing — `Bookit_Email_Queue` class unchanged

---

## FRONTEND BUILD INSTRUCTION

After implementation, run:
```
npm run build
(in bookit-booking-system/dashboard/)
```
The `dist/` directory is gitignored — the build must be run manually
in Local by Flywheel after Cursor completes its changes.

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 5: Admin email queue log view

- Add GET bookit/v1/dashboard/email-queue (admin only, staff blocked)
- Paginated results, status filter, excludes html_body/params columns
- New EmailQueue.vue view with status badges, filter, pagination
- Route /email-queue registered with requiresAdmin: true
- "Email Queue" sidebar nav item (admin only)
- 6 new PHPUnit tests in test-email-queue-api.php

Tests: 852+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve, STOP
and report back before writing any code.