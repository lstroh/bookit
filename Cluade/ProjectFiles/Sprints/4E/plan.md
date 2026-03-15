# SPRINT 4E IMPLEMENTATION PROMPT
## Bookit Booking System — Security & Quality (~80h)

**Sprint:** 4E
**Estimated hours:** ~80h
**PHPUnit baseline:** 686 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

Before generating any Cursor prompt, ensure the following are active
in this chat:

- **GitHub connector** — read live files from lstroh/bookit-imp (branch:
  Phase1) before designing any implementation. Never assume file contents.
- **Context7 connector** — resolve and query current docs for Vue 3,
  WordPress REST API, and PHPUnit before writing any library-specific code.
- **cursor-prompt-generator skill** — use this skill for every Cursor
  prompt generated in this sprint. It enforces the correct structure,
  infrastructure wiring, and quality checks.

---

## SPRINT GOAL

Harden the plugin for production: close security gaps, fill PHPUnit
coverage holes from Sprints 4B–4D, optimise performance, and bring all
public-facing views and the booking wizard to WCAG 2.1 AA compliance.

This is a quality sprint — no new user-facing features except the package
redemption email enhancement in the final task.

**Priority order if hours run short:**
1. Security hardening (OWASP, rate limiting)
2. PHPUnit coverage gaps (Sprints 4B–4D)
3. Performance optimisation (JS bundle, queries)
4. WCAG 2.1 AA accessibility fixes
5. Package redemption email enhancement (last task, ~1h)

---

## ARCHITECTURAL CONSTRAINTS

Read these files via GitHub before planning any task:

1. `includes/class-bookit-loader.php` — understand how hooks, cron,
   and API classes are registered
2. `includes/class-csrf-protection.php` — existing CSRF implementation;
   extend rather than replace
3. `includes/api/class-wizard-api.php` — public endpoints; primary
   target for rate limiting
4. `includes/api/class-available-packages-api.php` — new public endpoint
   from Sprint 4D; needs rate limiting
5. `includes/api/class-customer-package-lookup-api.php` — new public
   endpoint from Sprint 4D; needs rate limiting
6. `includes/api/class-package-redemption-api.php` — atomic redemption;
   check for any untested paths
7. `includes/class-bookit-audit-logger.php` — for logging rate limit
   violations
8. `includes/class-bookit-error-registry.php` + `includes/config/error-codes.php`
   — register any new error codes
9. `dashboard/src/` (all Vue views) — accessibility audit targets
10. `public/templates/` (all PHP templates) — WCAG audit targets
11. `phpunit.xml` — understand current test suite structure before
    adding new test files

**SPRINT AGENT DISCIPLINE RULES:**
- Read every file you intend to modify via GitHub before writing any
  implementation guidance
- Extend existing infrastructure — do not duplicate
- Escalate scope or architecture decisions; never substitute silently
- Per-record processing for any bulk/batch operations
- Every Cursor prompt must include a READ FIRST section

---

## TASK BREAKDOWN

### TASK 1 OF 8: Security Audit & Input Validation (~8h)

Systematic OWASP Top 10 pass across all PHP files introduced or
modified in Sprints 4B–4D. Focus on the new package endpoints and
any gaps in existing endpoints.

**Read first via GitHub:**
- All files in `includes/api/` — read each before auditing
- `includes/core/class-session-manager.php`
- `public/templates/booking-step-5-payment.php`
- `public/templates/package-purchase.php` (if created in 4D)

**What to check and fix per endpoint:**

SQL injection:
- Every `$wpdb->query()`, `$wpdb->get_var()`, `$wpdb->get_row()`,
  `$wpdb->get_results()` call uses `$wpdb->prepare()` with typed
  placeholders (%d, %s, %f) — no string concatenation in queries
- New package API files are the primary target; also re-verify
  Sprint 4A reports API and Sprint 4C bulk actions endpoint

XSS:
- All PHP template output uses `esc_html()`, `esc_attr()`, `esc_url()`
  as appropriate — never raw `echo $variable`
- `booking-step-5-payment.php` package section added in Sprint 4D
  is the primary target

Input sanitisation:
- All REST endpoint parameters sanitised before use:
  `absint()` for integers, `sanitize_text_field()` for strings,
  `sanitize_email()` for emails, `wp_kses_post()` for HTML content
- Check all new package API request parameter handling

File upload security (existing feature, verify):
- Staff photo upload restricted to JPG/PNG, max 5MB
- MIME type checked server-side, not just file extension

**PHPUnit:** Write tests for any SQL injection or XSS vectors
identified and fixed. At minimum: one test per fixed endpoint
verifying sanitised input is handled correctly.

---

### TASK 2 OF 8: Rate Limiting — Public Endpoints (~8h)

**Read first via GitHub:**
- ALL files in `includes/api/` to understand what already exists
- `includes/class-csrf-protection.php` — may contain existing
  rate limiting; extend rather than create from scratch
- `includes/class-bookit-loader.php` — how to wire new middleware

**Determine current state before implementing:**
Read the existing codebase thoroughly. If rate limiting already
exists for some endpoints, extend it to cover the new Sprint 4D
public endpoints. If nothing exists, build from scratch using
WordPress Transients API (auto-expiring counters, no extra tables).

**Endpoints requiring rate limiting:**

| Endpoint | Limit | Window | Action on exceed |
|----------|-------|--------|-----------------|
| POST wizard booking creation | 10/hour | Per IP | HTTP 429 + E-code |
| GET /wizard/available-packages | 60/hour | Per IP | HTTP 429 + E-code |
| GET /wizard/my-packages | 60/hour | Per IP | HTTP 429 + E-code |
| Dashboard login | 5/15min | Per IP | HTTP 429 + lockout |
| POST /packages/redeem (public) | 20/hour | Per IP | HTTP 429 + E-code |

**Implementation requirements:**
- Use WordPress Transients API (`set_transient` / `get_transient`)
  with auto-expiry — no new database tables
- Key format: `bookit_rl_{action}_{md5($ip)}`
- On rate limit exceeded: return HTTP 429 with consistent error
  response shape matching existing error registry format
- Log rate limit violations to audit log:
  `Bookit_Audit_Logger::log('rate_limit_exceeded', 'system', 0, ...)`
- Create a reusable `Bookit_Rate_Limiter` class in
  `includes/class-bookit-rate-limiter.php` — not inline per endpoint
- Register new error code E6001 RATE_LIMIT_EXCEEDED in error-codes.php

**Note:** Use Context7 to verify current WordPress Transients API
patterns before implementing.

**PHPUnit:** Rate limiter class unit tests — allows under limit,
blocks at limit, resets after window expires, correct HTTP 429
response shape, audit log entry fires on block.

---

### TASK 3 OF 8: PHPUnit Coverage — Sprint 4B Infrastructure (~8h)

Fill coverage gaps in Sprint 4B code. Read `phpunit.xml` and the
test files for Sprint 4B before starting to understand what already
exists.

**Read first via GitHub:**
- `phpunit.xml` — full test suite listing
- All existing Sprint 4B test files
- The actual implementation files being tested

**Target files and coverage gaps to investigate:**

`includes/class-bookit-migration-runner.php`:
- Test: migration runs once and is idempotent (re-running does not
  error or duplicate)
- Test: rollback removes tables/columns cleanly
- Test: pending migrations are detected correctly

`includes/class-bookit-audit-logger.php`:
- Test: log entry created with correct actor_type, action, object_type
- Test: log entry with old_value/new_value stored correctly
- Test: system actor (actor_id = 0) logged correctly

`includes/class-bookit-error-registry.php`:
- Test: registered error codes return correct HTTP status
- Test: unregistered code falls back gracefully
- Test: placeholder substitution in error messages works

`includes/utils/class-bookit-reference-generator.php`:
- Test: generates BK[YYMM]-XXXX format correctly
- Test: uniqueness constraint prevents duplicate references
- Test: correct month/year prefix for a known date

`includes/class-bookit-extension-registry.php`:
- Test: extension registers successfully with valid arguments
- Test: duplicate slug registration returns WP_Error
- Test: version incompatibility returns WP_Error

**Do not write tests for things already covered.** Read existing
test files first via GitHub and only fill genuine gaps.

**PHPUnit baseline:** 686 tests. Target: meaningful increase with
0 failures.

---

### TASK 4 OF 8: PHPUnit Coverage — Sprints 4C & 4C.5 (~6h)

Fill coverage gaps in Sprint 4C and 4C.5 code.

**Read first via GitHub:**
- All existing Sprint 4C/4C.5 test files
- `includes/api/class-cancellation-policy-api.php`
- `includes/api/class-deposit-settings-api.php`
- `includes/api/class-bulk-bookings-api.php`
- `includes/api/class-customers-api.php` (GDPR export endpoint)
- `dashboard/src/components/BookitTooltip.vue` (no PHP tests needed)

**Target coverage gaps:**

Cancellation policy API:
- Test: per-service override saves and reads correctly
- Test: policy text appears in settings response

Deposit settings API:
- Test: fixed deposit amount saves correctly
- Test: percentage deposit calculates correctly at booking step

Bulk bookings API:
- Test: cancel action processes each booking individually
- Test: partial success (some bookings valid, some not) returns
  correct succeeded/failed arrays
- Test: staff role cannot access bulk endpoint (403)
- Test: confirmation required before action fires (if applicable)

GDPR export:
- Test: export contains personal details, bookings, payments
- Test: export does NOT contain audit log entries
- Test: export does NOT contain gateway IDs
- Test: cross-customer data cannot be accessed (customer A cannot
  export customer B's data)
- Test: audit log entry written on every export

**PHPUnit baseline:** carry forward from Task 3 result. 0 failures.

---

### TASK 5 OF 8: PHPUnit Coverage — Sprint 4D Packages (~6h)

Fill any remaining coverage gaps in Sprint 4D package code not
already covered by the 115 tests added during that sprint.

**Read first via GitHub:**
- `phpunit.xml` — verify which package test files exist
- `includes/api/class-package-types-api.php`
- `includes/api/class-customer-packages-api.php`
- `includes/class-bookit-package-expiry.php`

**Target coverage gaps:**

Package Types API:
- Test: cannot delete package type that has active customer packages
- Test: deactivating a package type does not affect existing active
  customer packages
- Test: applicable_service_ids validation (non-existent service ID
  returns validation error)
- Test: price_mode = 'discount' with discount_percentage > 100 returns
  validation error

Customer Packages API — pricing calculation:
- Test: fixed price mode stores correct purchase_price
- Test: discount mode calculates correctly using lowest applicable
  service price
- Test: expiry date calculated correctly when expiry_enabled = 1

Package expiry cron:
- Test: only packages with expires_at < NOW() and status = 'active'
  are expired
- Test: packages with expires_at = NULL are never expired
- Test: packages with status != 'active' are never expired (no
  double-expiry)
- Test: each package processed individually (per-record, not bulk)
- Test: audit log entry fires per expired package

`packages_enabled` setting gate:
- Test: package endpoints return 403 when packages_enabled = '0'
- Test: package endpoints return correctly when packages_enabled = '1'

**PHPUnit baseline:** carry forward from Task 4 result. 0 failures.

---

### TASK 6 OF 8: Performance Optimisation (~10h)

**Read first via GitHub:**
- `includes/api/class-reports-api.php` — reports queries are the
  most likely N+1 source
- `includes/api/class-bookings-api.php` — bookings list query
- `includes/api/class-customers-api.php` — customer list query
- `includes/api/class-packages-api.php` / customer packages listing
- `dashboard/vite.config.js` — current build config
- `dashboard/src/router/index.js` — check lazy loading of routes

**6a — Database query optimisation:**

Audit all list/search endpoints for N+1 queries. An N+1 occurs when
a loop runs a separate query per row (e.g. fetching customer name
per booking in a loop). Fix using JOINs or single queries.

Priority targets:
- Bookings list: verify customer name, service name, staff name are
  fetched via JOIN not per-row queries
- Customer packages list: verify package_type name is JOIN not per-row
- Reports queries: verify aggregations use GROUP BY not PHP loops
- Package redemption history: verify booking details are JOIN not
  per-row

Add missing database indexes if identified:
- Check `wp_bookings` for missing composite indexes on frequently
  filtered columns (booking_date + staff_id, status + booking_date)
- Check `wp_bookings_customer_packages` for expires_at + status
  composite index (used by expiry cron)
- Add via new migration (sequential number after 0008)

**6b — Vue/JS bundle optimisation:**

Read `dashboard/vite.config.js` via GitHub first.

- Verify all Vue router routes use lazy imports
  (`component: () => import(...)`) — not static imports
- Verify heavy dependencies (Chart.js, any date libraries) are not
  imported globally if only used in specific views
- Check bundle output — if any chunk exceeds 500KB, investigate
  and split if straightforward

**Note:** Do NOT change `base: './'` in vite.config.js — this is
critical for chunk URL resolution. Read known-gotchas.md before
touching vite.config.js.

**6c — PHP template optimisation:**

- Booking wizard steps: verify service/staff/settings data is cached
  in session or WP transients rather than re-queried on every step load
- If settings are queried per-request (individual SELECT per key),
  consider loading all autoloaded settings in one query

**After any Vue changes, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored)

**PHPUnit:** No new tests required for pure performance changes, but
all existing tests must continue to pass after any query refactoring.

---

### TASK 7 OF 8: WCAG 2.1 AA Accessibility Fixes (~12h)

Audit and fix WCAG 2.1 AA issues across the booking wizard PHP
templates and Vue dashboard views introduced or modified in
Sprints 4C, 4C.5, and 4D.

**Read first via GitHub:**
- `dashboard/src/App.vue` — existing accessibility foundations
  (skip link, aria-labels)
- `dashboard/src/components/SetupGuideOverlay.vue` — existing focus
  trap pattern to replicate in new modals
- `dashboard/src/components/BookitTooltip.vue` — existing accessible
  tooltip pattern
- All new Vue views from Sprint 4C–4D (TeamCalendar.vue, Packages.vue,
  CustomerProfile.vue package tab, Settings.vue packages section)
- `public/templates/booking-step-5-payment.php` — package UI added
  in Sprint 4D

**Note:** Use Context7 to verify current Vue 3 accessibility patterns
(aria attributes in templates, focus management with refs) before
implementing fixes.

**Audit checklist per view — fix any violations found:**

Perceivable:
- [ ] All images have descriptive alt text; decorative images alt=""
- [ ] Status badges (package status: active/expired/exhausted) convey
  information via text+colour, not colour alone
- [ ] Colour contrast ≥4.5:1 for normal text, ≥3:1 for large text
  (test with WebAIM Contrast Checker values)

Operable:
- [ ] All modals trap focus (Tab/Shift+Tab cycle within modal only)
  and restore focus to trigger element on close — follow
  SetupGuideOverlay.vue pattern
- [ ] All modals dismissible with Escape key
- [ ] Redemption history expandable rows keyboard-accessible
  (Enter/Space to expand)
- [ ] Package selector in wizard Step 5 keyboard-navigable
- [ ] Visible focus indicators on all interactive elements (≥2px
  outline) — never `outline: none` without accessible replacement
- [ ] No keyboard traps outside of intentional modal focus trapping

Understandable:
- [ ] All form fields have explicit `<label>` or `aria-label`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Error messages use `role="alert"` for screen reader announcement
- [ ] Loading states use `aria-live="polite"` regions
- [ ] Package cards in wizard show sessions/expiry in text, not just
  as visual badges

Robust:
- [ ] No duplicate `id` attributes in any template or Vue component
- [ ] ARIA attributes used correctly (aria-expanded on toggles,
  aria-selected on tabs, aria-controls linking triggers to panels)
- [ ] `lang="en-GB"` present on booking wizard HTML root

**Priority order within this task:**
1. Modal focus trapping (any new modals from 4C/4D that lack it)
2. Keyboard navigation gaps in new package UI
3. ARIA labels on interactive elements
4. Colour contrast fixes
5. aria-live loading states

**After any Vue changes, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored)

**PHPUnit:** No automated tests for accessibility. Manual testing
checklist instead — sprint agent must provide one covering the
keyboard navigation and screen reader scenarios above.

---

### TASK 8 OF 8: Package Redemption Email Enhancement (~2h)

Add sessions remaining information to the booking confirmation email
when payment_method = 'package' or 'package_redemption'.

This is a carry-forward from Sprint 4D.

**Read first via GitHub:**
- `includes/api/class-booking-creator.php` — how booking data is
  assembled and emails are triggered
- The existing email notification files (check `includes/` for email
  controller/sender class — read the actual file, do not assume location)
- `wp_bookings_customer_packages` schema — sessions_remaining,
  sessions_total, expires_at

**What to add:**

When a booking is created with `payment_method = 'package'`:
- Look up the associated customer_package via `customer_package_id`
  on the booking row
- Add to confirmation email body:
  - "Sessions remaining on your package: X of Y"
  - If `expires_at` is set: "Your package expires on: [date]"
- This text should appear after the booking summary and before
  any footer/policy text
- If `customer_package_id` is NULL or package lookup fails, send
  the standard email without the package section (graceful fallback)

**Do not:**
- Change the email template for non-package bookings
- Add package info to admin/staff notification emails (customer-facing
  only)

**PHPUnit:** Test that package booking confirmation email contains
sessions remaining text; test that non-package booking email does
not contain sessions remaining text; test graceful fallback when
package not found.

---

## SPRINT AGENT WORKFLOW

Follow this workflow for every task:

1. Read ALL files listed in the task's READ FIRST section via GitHub
2. Use Context7 to verify any external library APIs before implementing
3. Use cursor-prompt-generator skill to produce the Cursor prompt
4. After Liron confirms task complete, move to next task
5. Do not proceed to next task until Liron confirms
6. If you encounter a scope or architecture decision not covered in
   this prompt, STOP and escalate — do not substitute or resolve
   independently

**One task at a time. Wait for confirmation before proceeding.**

**Priority rule:** If time runs short, complete tasks in priority
order: Tasks 1–2 (security) → Tasks 3–5 (PHPUnit) → Task 6
(performance) → Task 7 (accessibility) → Task 8 (email). Do not
start a lower-priority task until the higher-priority one is complete.

---

## ACCEPTANCE CRITERIA — SPRINT LEVEL

**Security:**
- [ ] All new package API endpoints use `$wpdb->prepare()` for
  every database query — no raw concatenation
- [ ] All PHP template output in package wizard UI uses correct
  WordPress escaping functions
- [ ] All new REST endpoint parameters sanitised before use
- [ ] Rate limiter class exists and is wired to all public endpoints
- [ ] Rate limit violations logged to audit log
- [ ] E6001 RATE_LIMIT_EXCEEDED registered in error registry
- [ ] File upload restricted to allowed types (existing feature verified)

**PHPUnit:**
- [ ] Sprint 4B infrastructure classes have meaningful test coverage
- [ ] Sprint 4C/4C.5 bulk actions and GDPR export gaps filled
- [ ] Sprint 4D package type deletion constraint tested
- [ ] Sprint 4D expiry cron per-record processing tested
- [ ] `packages_enabled` gate tested on all package endpoints
- [ ] Final test suite: 686+ tests, 0 failures

**Performance:**
- [ ] No N+1 queries in bookings list, customer packages list,
  or reports endpoints
- [ ] All Vue router routes use lazy imports
- [ ] No single JS chunk exceeds 500KB
- [ ] Any new DB indexes added via migration (sequential numbering)

**Accessibility:**
- [ ] All new modals from Sprints 4C–4D have focus trapping and
  Escape dismissal
- [ ] Package UI in wizard Step 5 keyboard-navigable
- [ ] Status badges convey meaning via text, not colour alone
- [ ] No `outline: none` without accessible replacement
- [ ] All form fields in new views have labels or aria-label
- [ ] Error messages use role="alert"
- [ ] Loading states use aria-live

**Email:**
- [ ] Package booking confirmation email includes sessions remaining
- [ ] Non-package booking email unchanged
- [ ] Graceful fallback if package lookup fails

**Technical:**
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] All existing features continue to work
- [ ] All new dashboard endpoints under `/dashboard/` URL prefix
- [ ] Frontend built (`npm run build`) after all Vue changes

**Must NOT break:**
- [ ] Existing booking wizard (all 5 steps)
- [ ] Existing Stripe webhook booking creation
- [ ] Package redemption flow (Sprint 4D)
- [ ] Bulk booking actions (Sprint 4C.5)
- [ ] GDPR export (Sprint 4C.5)
- [ ] All existing reports and analytics

---

## GIT COMMIT CONVENTION

```
Sprint 4E, Task [N]: [description]

- [change 1]
- [change 2]
- [change 3]

Tests: [N] passing, 0 failures
```

Commit after each task is confirmed complete.

---

## REFERENCE FILES (read via GitHub before relevant tasks)

| File | Relevant to |
|------|-------------|
| `includes/api/` (all files) | Tasks 1, 2 |
| `includes/class-csrf-protection.php` | Task 2 |
| `includes/class-bookit-loader.php` | Tasks 2, 8 |
| `includes/class-bookit-migration-runner.php` | Task 3 |
| `includes/class-bookit-audit-logger.php` | Tasks 2, 3 |
| `includes/class-bookit-error-registry.php` | Tasks 2, 3 |
| `includes/config/error-codes.php` | Task 2 |
| `includes/class-bookit-extension-registry.php` | Task 3 |
| `includes/utils/class-bookit-reference-generator.php` | Task 3 |
| `includes/class-bookit-package-expiry.php` | Tasks 4, 5 |
| `includes/api/class-reports-api.php` | Task 6 |
| `includes/api/class-bookings-api.php` | Task 6 |
| `database/migrations/` (all files) | Task 6 (new indexes) |
| `dashboard/vite.config.js` | Task 6 |
| `dashboard/src/router/index.js` | Tasks 6, 7 |
| `dashboard/src/App.vue` | Task 7 |
| `dashboard/src/components/SetupGuideOverlay.vue` | Task 7 |
| `dashboard/src/components/BookitTooltip.vue` | Task 7 |
| `dashboard/src/views/Packages.vue` | Task 7 |
| `dashboard/src/views/CustomerProfile.vue` | Task 7 |
| `dashboard/src/views/Settings.vue` | Task 7 |
| `public/templates/booking-step-5-payment.php` | Tasks 1, 7 |
| `phpunit.xml` | Tasks 3, 4, 5 |
| Email controller/sender class (locate via GitHub) | Task 8 |
| `includes/api/class-booking-creator.php` | Task 8 |