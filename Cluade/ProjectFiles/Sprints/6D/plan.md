# SPRINT 6D: FINAL PHASE 1 CODE TASKS
# Bookit Booking System — WordPress Plugin
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/

---

## YOUR ROLE

You are the Sprint Implementation Assistant for Sprint 6D — the final code
sprint of Phase 1. Four tasks. Generate one Cursor prompt per code task.
Liron confirms each task complete before you move to the next.

Escalate any architectural conflict to the Project Assistant (separate chat).

---

## WORKFLOW RULES

- **Read before write.** GitHub connector on every file before writing code.
- **Additive only.** No modifications to working code without explicit reason.
- **Context7 for libraries.** Verify current API before any library-specific code.
- **Frontend builds.** Tasks 6D-1 and 6D-3 modify Vue/JS files.
  After each: `npm run build` in `bookit-booking-system/dashboard/`
  Then deploy: delete `dist/` on server, upload fresh build, purge all
  three cache layers (LiteSpeed plugin → Hostinger server cache → CDN).
- **One task at a time.** Confirmed complete before proceeding.

---

## PROJECT CONTEXT

- **Test suite baseline:** 976 tests, 0 failures (Sprint 6C complete)
- **PHPUnit:** `cd bookit-booking-system && vendor/bin/phpunit`
- **Known gotchas:**
  - `get_full_booking()` in staff notifier must NOT filter `deleted_at IS NULL`
  - Vite `base: './'` + `?v=` query string on entry file = double Vue mount crash
  - `applicable_service_ids` — always PHP `json_decode()` + `in_array()`, never SQL `JSON_CONTAINS()`
  - `wp_bookings_staff.id` is the primary key (not `staff_id`)
  - `bookit_get_setting()` does not exist — use `$wpdb->get_var()` directly

---

## KEY PROJECT KNOWLEDGE FILES

| File | Purpose |
|------|---------|
| `progress.md` | Full sprint history — authoritative |
| `public/templates/reschedule-booking.php` | Reschedule page PHP template |
| `public/assets/js/booking-wizard-v2.js` | May contain reschedule JS — check |
| `public/assets/css/magic-link-pages.css` | Reschedule/cancel page styles |
| `includes/api/class-wizard-api.php` | Reschedule REST endpoint |
| `includes/api/class-customers-api.php` | Customer API — email change goes here |
| `dashboard/src/views/Customers.vue` | Customer list — or wherever customer detail lives |
| `includes/email/class-email-sender.php` | Email sending — email change notifications |
| `database/migrations/0018-*.php` | Most recent migration — next is 0019 (or check) |
| `dashboard/vite.config.js` | Vite config — for cache-busting task |
| `dashboard/app/index.php` | Dashboard entry — reads manifest.json after 6D-3 |
| `UK_Compliance_Checklist_v1_0.md` | Compliance gaps to verify |

---

## SPRINT 6D SCOPE

| # | Task | Type | Hours |
|---|------|------|-------|
| 6D-1 | Reschedule page UI bugs (month nav + button state) | Vue fix | ~3h |
| 6D-2 | Customer email change workflow | PHP + Vue | ~7h |
| 6D-3 | Vite manifest cache-busting | Config + PHP | ~2h |
| 6D-4 | UK compliance review | Review + checklist | ~1h |

**Recommended order:** 6D-1 → 6D-2 → 6D-3 → 6D-4

---

## TASK DETAIL: 6D-1 — Reschedule Page UI Bugs

### Two confirmed bugs (found during Sprint 6C live testing)

**Bug 1 — Cannot navigate to different month**

The calendar widget on `/bookit-reschedule/` only shows the current month.
Clicking previous/next month arrows does nothing. Customer cannot book a
slot more than a few days away unless the month happens to align.

**Bug 2 — Reschedule button stuck on "Rescheduling..."**

After a successful reschedule submission, the Confirm button stays in its
loading state ("Rescheduling...") and is never re-enabled. Customer has no
visual confirmation that the action completed — they see a spinning/disabled
button indefinitely.

### Files to read before writing any Cursor prompt

1. `public/templates/reschedule-booking.php` — the full PHP template. This
   page was built in Sprint 5A-3b using vanilla JS (IIFE pattern, same as
   the V2 wizard). Read it fully — the calendar and button logic are in
   inline `<script>` tags or a separate JS file.
2. `public/assets/js/` — check whether there is a dedicated JS file for
   the reschedule page (e.g. `magic-link-reschedule.js`) or whether the
   logic is inline in the template.
3. `public/assets/css/magic-link-pages.css` — scoped styles.
4. `includes/api/class-wizard-api.php` — the `POST wizard/reschedule`
   endpoint, to confirm the response shape the JS expects.

### Expected behaviour after fix

**Bug 1:** Clicking previous/next month arrows updates the calendar to show
the correct month. Available slots load correctly for the new month via the
existing `GET bookit/v1/wizard/timeslots` endpoint (which already accepts
`date` param). The current month is the default; navigation is unlimited
going forward, blocked from going before the current month.

**Bug 2:** After a successful POST to `wizard/reschedule` (200 response):
- Button text resets to "Confirm Reschedule" (or equivalent)
- Button is re-enabled
- A success message is shown (e.g. "Your booking has been rescheduled ✓")
- Optionally: redirect to a success state or home page after 3 seconds

### PHPUnit requirements

No new PHPUnit tests needed — this is frontend JS behaviour.
Confirm 976 tests still pass after the change.

### Git commit message
```
Sprint 6D, Task 1: Fix reschedule page UI bugs

Bug 1: Month navigation now works — calendar fetches slots for selected month
Bug 2: Submit button resets after successful reschedule, success message shown
```

---

## TASK DETAIL: 6D-2 — Customer Email Change Workflow

### What this delivers

Admin can change a customer's email address securely from the customer
profile in the dashboard. A verification email is sent to the NEW address —
the customer must click the link to confirm. Both old and new addresses
receive notifications. Closes GDPR Right to Rectification gap (REQ-LEGAL-007).

This is admin-initiated only. Customers do not self-service email changes
in Phase 1.

### Full spec (from `BusinessOwner-AdminRequirements.md` User Story 6.6)

**UI flow:**
1. Admin navigates to customer profile in dashboard
2. Clicks "Change Email" button next to current email
3. A form appears: new email field + Reason dropdown (Typo / Customer
   request / Other) + Cancel / Send Verification buttons
4. Admin submits → system sends verification email to NEW address
5. Old email receives: "An email change has been requested for your booking
   account. If you did not request this, please contact us."
6. Customer clicks link in NEW email → email updated in database
7. Both addresses receive: "Your booking account email has been updated."

**Edge cases:**
- New email already exists for another customer → error: "This email is
  already in use"
- Verification not completed within 24 hours → token expires, admin must
  re-initiate
- Customer makes a booking before verification → old email used (pending
  change not yet applied)
- Change is logged in audit log with old email, new email, timestamp,
  initiating admin ID

### DB migration

Next migration number — check `database/migrations/` to confirm (likely
0019 or 0020 depending on what Sprint 6B-1 used for Google Calendar).

New columns on `wp_bookings_customers`:
```sql
pending_email_change VARCHAR(255) NULL DEFAULT NULL,
email_change_token   VARCHAR(64)  NULL DEFAULT NULL,
email_change_expires DATETIME     NULL DEFAULT NULL
```

Use `information_schema.tables` column check (not `SHOW COLUMNS LIKE` —
MariaDB underscore wildcard issue confirmed in Sprint 6A).

### REST endpoints

**`POST bookit/v1/dashboard/customers/{id}/request-email-change`**
- Auth: admin only (`check_admin_permission`)
- Params: `new_email` (string, valid email), `reason` (string)
- Validates: new_email format, not already in use by another customer
- Generates token: `wp_generate_password(32, false, false)` (URL-safe)
- Sets `pending_email_change`, `email_change_token`, `email_change_expires`
  (now + 24 hours) on the customer row
- Enqueues verification email to NEW address via dispatcher
- Enqueues notification email to OLD address via dispatcher
- Fires `Bookit_Audit_Logger::log('customer.email_change_requested', ...)`
- Returns `{ success: true }`

**`GET bookit/v1/wizard/verify-email-change`** (public — customer clicks link)
- Params: `token` (string), `customer_id` (int)
- Auth: none — token is the auth mechanism
- Validates: token matches, not expired, customer_id matches
- On success:
  - Updates `email` column to `pending_email_change` value
  - Clears `pending_email_change`, `email_change_token`, `email_change_expires`
  - Enqueues confirmation email to BOTH old (stored before update) and new
  - Fires audit log: `customer.email_change_confirmed`
  - Redirects to: `home_url('/bookit-email-changed/')` (auto-created page,
    or a simple success message page — see page auto-creation below)
- On failure (invalid/expired): returns 400 with clear error message

### Page auto-creation

Add to `class-bookit-activator.php` (same `get_page_by_path()` guard pattern):
```
/bookit-email-changed/ — title "Email Updated", content [bookit_email_changed]
```

New shortcode `[bookit_email_changed]` renders a simple success page:
"Your email address has been updated. Future booking communications will be
sent to your new address."

### Email types

Two new email types for the dispatcher:
- `email_change_verification` — to NEW address. Contains the verification
  link: `{site_url}/wp-json/bookit/v1/wizard/verify-email-change?token={token}&customer_id={id}`
  Subject: "Please verify your new email address"
- `email_change_notification` — to OLD address. Plain notification, no link.
  Subject: "Email change requested for your booking account"
- `email_change_confirmed` — to BOTH addresses after successful verification.
  Subject: "Your booking account email has been updated"

Add three new Brevo template ID settings keys following the Sprint 5A-6
pattern:
- `brevo_template_email_change_verification`
- `brevo_template_email_change_notification`
- `brevo_template_email_change_confirmed`

### Dashboard UI

In the customer profile/detail view in the dashboard, add:
- "Change Email" button next to the current email display
- On click: inline form appears (new email input + reason dropdown)
- Submit calls the new endpoint
- Success state: "Verification email sent to [new_email]"
- Error state: shows error message inline

Read the current customer profile Vue component to find the correct insertion
point before writing any implementation.

### Rate limiting

Apply rate limiting to `request-email-change`: 5 requests per hour per
admin user (use existing `Bookit_Rate_Limiter` pattern, action key:
`email_change_request`).

### Files to read before writing any Cursor prompt

1. `includes/api/class-customers-api.php` — existing customer API pattern
2. The Vue component that renders the customer profile/detail view — search
   for where customer email is displayed
3. `database/migrations/` — latest migration number to determine next
4. `includes/email/class-email-sender.php` — email sending pattern
5. `includes/notifications/class-bookit-notification-dispatcher.php` —
   `enqueue_email()` signature
6. `class-bookit-activator.php` — page auto-creation pattern
7. `public/class-shortcodes.php` — shortcode registration pattern
8. `includes/class-bookit-rate-limiter.php` — rate limiter usage pattern
9. `includes/class-bookit-audit-logger.php` — `log()` signature

### PHPUnit requirements

Baseline: 976 tests, 0 failures.
New test file: `tests/unit/test-email-change-workflow.php`

Required test cases:
- `test_request_email_change_sends_verification_to_new_address`
- `test_request_email_change_sends_notification_to_old_address`
- `test_request_email_change_rejects_duplicate_email`
- `test_request_email_change_requires_admin_role`
- `test_verify_email_change_updates_customer_email`
- `test_verify_email_change_rejects_expired_token`
- `test_verify_email_change_rejects_invalid_token`
- `test_verify_email_change_clears_pending_columns`
- `test_verify_email_change_fires_audit_log`
- `test_email_change_rate_limited_after_threshold`

### Git commit message
```
Sprint 6D, Task 2: Customer email change workflow (REQ-LEGAL-007)

- Migration 0019: pending_email_change, email_change_token, email_change_expires
  columns on wp_bookings_customers
- POST /dashboard/customers/{id}/request-email-change (admin only)
- GET /wizard/verify-email-change (public, token-auth)
- [bookit_email_changed] shortcode + /bookit-email-changed/ page
- Three new email types: verification, notification, confirmed
- Three new Brevo template ID settings keys
- Customer profile UI: Change Email button + inline form
- Closes GDPR Right to Rectification gap (REQ-LEGAL-007)

Tests: [N] passing, 0 failures
```

---

## TASK DETAIL: 6D-3 — Vite Manifest Cache-Busting

### Problem (from Sprint 6C)

The dashboard JS entry file (`dashboard/dist/index.js`) has no version in its
filename. After each deployment, a 3-layer manual cache purge is required.
The `?v=BOOKIT_VERSION` query string approach failed (Vite `base: './'` +
query string = double Vue mount crash).

The correct solution is **Vite manifest hash** — Vite generates a unique
content hash in the filename (`index.abc123.js`), and PHP reads `manifest.json`
to find the current filename.

### Implementation

**Step 1 — Update `dashboard/vite.config.js`**

Read the current `vite.config.js` fully before making any changes.

Add to the `build` config:
```js
build: {
  manifest: true,
  rollupOptions: {
    input: 'src/main.js',
    output: {
      entryFileNames: 'index.[hash].js',
      chunkFileNames: 'chunks/[name].[hash].js',
      assetFileNames: (assetInfo) => {
        if (assetInfo.name?.endsWith('.css')) return 'style.[hash].css'
        return '[name].[hash][extname]'
      }
    }
  }
}
```

This causes Vite to:
- Output `dist/.vite/manifest.json` listing all built files with their hashed names
- Generate `index.abc123.js` and `style.abc123.css` (hashes change only
  when file content changes)

**Step 2 — Update `dashboard/app/index.php`**

Replace the hardcoded `index.js` and `style.css` references with PHP that
reads `manifest.json`:

```php
// Read Vite manifest to get hashed asset filenames.
$manifest_path = BOOKIT_PLUGIN_DIR . 'dashboard/dist/.vite/manifest.json';
$manifest      = array();

if ( file_exists( $manifest_path ) ) {
    $manifest = json_decode( file_get_contents( $manifest_path ), true ) ?? array();
}

$js_file  = $manifest['src/main.js']['file'] ?? 'index.js';
$css_file = $manifest['src/main.js']['css'][0] ?? 'style.css';
```

Then use `$js_file` and `$css_file` in the script/link tags:

```php
<?php if ( file_exists( BOOKIT_PLUGIN_DIR . 'dashboard/dist/' . $js_file ) ) : ?>
    <script type="module" src="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/' . $js_file ); ?>"></script>
<?php else : ?>
    <script type="module" src="http://localhost:5173/@vite/client"></script>
    <script type="module" src="http://localhost:5173/src/main.js"></script>
<?php endif; ?>
```

Same for CSS. Preserve the `file_exists` fallback to local dev Vite server
exactly as it is now.

Also check `dashboard/setup.php` — apply the same manifest-reading pattern
if it also loads `dist/index.js` directly.

**Step 3 — Update `.gitignore` if needed**

The `dist/.vite/` directory should be gitignored (it's inside `dist/` which
is already gitignored). Confirm no change needed.

**Step 4 — Rebuild and test**

After implementing:
1. `npm run build` in `bookit-booking-system/dashboard/`
2. Confirm `dist/.vite/manifest.json` was generated
3. Confirm `dist/` contains a file like `index.abc123.js` (not `index.js`)
4. Confirm `dashboard/app/index.php` correctly reads the manifest and
   outputs the hashed filename in the `<script>` tag
5. Deploy to live site — confirm the page loads correctly with new hashed URL
6. Confirm a subsequent rebuild with no code changes produces the SAME hash
   (Vite only changes the hash when content changes — important for CDN efficiency)

### PHPUnit requirements

No new PHPUnit tests — this is a build config and PHP template change.
Confirm 976+ tests still pass.

### Git commit message
```
Sprint 6D, Task 3: Vite manifest hash cache-busting

- dashboard/vite.config.js: manifest: true, hashed entry/chunk/asset filenames
- dashboard/app/index.php: reads dist/.vite/manifest.json for current filenames
- Eliminates 3-layer manual cache purge after frontend deployments
- CDN automatically fetches fresh JS/CSS when content changes
```

---

## TASK DETAIL: 6D-4 — UK Compliance Review

### What this is

A review task — no code required. Verify the current state of the codebase
and project outputs against `UK_Compliance_Checklist_v1_0.md` and produce
a final compliance sign-off checklist.

This is done here in the sprint chat (not Cursor). Read through each item
in the compliance checklist, cross-reference with what was built, and
produce a final status table.

### Compliance status — pre-verified

Based on all sprints completed, the following gaps from the original checklist
are confirmed closed:

| Gap | Status | How closed |
|-----|--------|-----------|
| Privacy Policy template | ✅ CLOSED | Produced in Sprint 6B-4 chat |
| Terms & Conditions template | ✅ CLOSED | Produced in Sprint 6B-4 chat |
| Legal checklist (DPAs, ICO guidance) | ✅ CLOSED | Produced in Sprint 6B-4 chat |
| 14-day cooling-off waiver | ✅ CLOSED | Built Sprint 4C — checkbox + timestamp stored |
| Right to Rectification (email change) | ✅ CLOSED | Built Sprint 6D-2 |
| DPA confirmation checklist | ✅ CLOSED | In Sprint 6B-4 legal checklist document |
| ICO registration guidance | ✅ CLOSED | In Sprint 6B-4 legal checklist document |
| Accessibility Statement | ⚠️ DEFERRED | SHOULD HAVE — not blocking launch. Template needed but no code required. Produce post-launch. |

### Items to verify during this task

Work through this checklist — confirm each item is actually in place, not
just documented:

**GDPR / Data subject rights (all should be ✅ from earlier sprints):**
- [ ] Customer data export works (JSON/CSV) — test via dashboard
- [ ] Customer GDPR deletion works — test via dashboard
- [ ] 14-day waiver checkbox appears in V2 wizard Step 5 — test via `/book-v2/`
- [ ] Waiver timestamp stored in DB after booking — check `wp_bookings`
- [ ] Email change workflow works end-to-end — test via Sprint 6D-2 deliverable

**Security:**
- [ ] No card data stored in DB — verify `wp_bookings_payments` has no card columns
- [ ] HTTPS enforced on live site — test `http://` redirects to `https://`
- [ ] Stripe webhook signature verification in place — confirmed Sprint 2/5B
- [ ] Rate limiting on public endpoints — confirmed Sprint 4E

**Consumer Contracts Regulations:**
- [ ] Cancellation policy shown before payment in V2 wizard Step 5
- [ ] Cooling-off waiver wording is clear and accurate
- [ ] T&Cs link present before payment step (if not, add to wizard template)

**Legal documents:**
- [ ] Privacy Policy template exists and is ready to publish
- [ ] T&Cs template exists and is ready to publish
- [ ] Both link to ICO complaint right

**Post-review output:**

Produce a final compliance sign-off document as a Markdown table covering
all 89 items from the original checklist, showing current status for each.
This becomes the pre-launch compliance record.

---

## SPRINT 6D ACCEPTANCE CRITERIA

### 6D-1 (Reschedule bugs)
- [ ] Customer can navigate to previous and next months in reschedule calendar
- [ ] Slots load correctly for the selected month
- [ ] Confirm button resets to enabled state after successful reschedule
- [ ] Success message shown after reschedule

### 6D-2 (Email change)
- [ ] Admin can initiate email change from customer profile
- [ ] Verification email sent to new address
- [ ] Notification sent to old address
- [ ] Clicking verification link updates the email
- [ ] Expired/invalid token returns clear error
- [ ] Duplicate email rejected with clear error
- [ ] Both addresses receive confirmation after successful change
- [ ] Audit log entry created for request and confirmation
- [ ] Rate limiting applies after 5 requests per hour per admin

### 6D-3 (Cache-busting)
- [ ] `dist/.vite/manifest.json` generated after `npm run build`
- [ ] Dashboard entry JS filename contains content hash
- [ ] `dashboard/app/index.php` reads manifest and uses hashed filename
- [ ] Dashboard loads correctly on live site after deployment
- [ ] No manual cache purge needed after subsequent deploys

### 6D-4 (Compliance review)
- [ ] All 7 original compliance gaps confirmed closed (except Accessibility Statement)
- [ ] Final compliance sign-off checklist produced
- [ ] Accessibility Statement noted as post-launch task

### Overall
- [ ] PHPUnit: 976+ tests, 0 failures
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors

---

## START HERE

1. Confirm you have read and understood this prompt
2. List the 4 tasks with hour estimates
3. Start with **6D-1** — read `public/templates/reschedule-booking.php` via
   GitHub connector first to understand the current JS structure
4. Liron confirms each task complete before the next prompt is generated

After all 4 tasks are confirmed complete, Liron returns to the Project
Assistant chat. Sprint 6D complete = Phase 1 code-complete.

If anything contradicts what you find in the project files, flag it before
writing any code.