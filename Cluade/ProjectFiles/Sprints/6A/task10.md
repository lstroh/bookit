I have a thorough view of the Sprint 6A code. I can now see exactly what was built and where the security-relevant areas are. Let me generate the 6A-10 prompt:

---

```
TASK 10 OF 10: Security Review — OWASP Pass on Sprint 5 + 6A Code
Sprint: 6A | Est: 8h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read all files in the scope list below before writing any findings. Do not report on files not in scope.

**Sprint 6A new files (all must be read):**
1. `includes/notifications/class-bookit-staff-notifier.php`
2. `includes/cron/class-bookit-staff-digest-daily.php`
3. `includes/cron/class-bookit-staff-digest-weekly.php`
4. `includes/cron/class-bookit-staff-schedule-daily.php`
5. `database/migrations/0016-add-notification-preferences-to-staff.php`
6. `database/migrations/0017-create-notification-digest-queue.php`

**Sprint 6A modified files (read the full file, focus on changed sections):**
7. `includes/api/class-dashboard-bookings-api.php` — focus on `update_notification_preferences()`, `get_my_profile()` extension, `update_staff()` extension, `get_staff_details()` extension, `get_allowed_settings_keys()` additions
8. `includes/notifications/providers/class-bookit-brevo-email-provider.php` — focus on `send()` params pass-through change
9. `includes/api/class-dashboard-bookings-api.php` — `update_booking()` — focus on the new hook firing block

**Sprint 5 endpoints (re-verify, do not assume clean):**
10. `includes/api/class-wizard-api.php` — `cancel_booking_magic_link()`, `reschedule_booking_magic_link()`, `get_ical()`, `complete_booking()`
11. `includes/api/class-stripe-webhook.php` — `handle_booking_checkout_completed()`, `handle_package_purchase_completed()`, `handle_charge_refunded()`

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This is a read-and-fix security review task. Cursor reads each file in scope, applies the OWASP checklist below, and reports all findings. If issues are found, fix them in the same session. Report each fix with the file, line, and nature of the issue so it can be logged in `progress.md`. If no issues are found, state that explicitly for each file.

---

## OWASP CHECKLIST

Apply every item below to every file in scope. Check each item explicitly — do not skip items because you believe the code is probably fine.

### A. Input Sanitisation
- [ ] All REST endpoint `args` arrays use `sanitize_callback` or `validate_callback` for every accepted parameter
- [ ] No raw `$_GET`, `$_POST`, `$_SERVER`, or `$_REQUEST` values used in any logic or DB query without sanitisation
- [ ] Date inputs validated against expected format (e.g. `Y-m-d` via regex or `DateTime::createFromFormat`)
- [ ] Time inputs validated against expected format (e.g. `H:i` or `H:i:s`)
- [ ] Integer inputs cast to `int` or validated as numeric before use
- [ ] JSON inputs decoded and validated as array before use — not trusted as-is
- [ ] `notification_preferences` object from REST request — each subkey validated individually before storage

### B. Database Queries
- [ ] Every `$wpdb->query()`, `$wpdb->get_var()`, `$wpdb->get_row()`, `$wpdb->get_results()` with user-supplied data uses `$wpdb->prepare()`
- [ ] `IN (...)` clauses with dynamic IDs use `$wpdb->prepare()` with `implode()` + `array_fill()` placeholder pattern — already done in digest cron, confirm it is correct
- [ ] No `JSON_CONTAINS()` anywhere in any new or modified file (MariaDB 11.4 incompatibility confirmed in Sprint 5B)
- [ ] No raw string interpolation of user values into SQL

### C. Authentication & Authorisation
- [ ] All dashboard endpoints use `check_dashboard_permission` or `check_admin_permission` as `permission_callback`
- [ ] `update_notification_preferences()` — authenticated staff can only update their own preferences (confirmed by `$current_staff['id']` used as WHERE clause — verify)
- [ ] `update_staff()` preferences extension — blocked to `bookit_staff` role (confirmed by `check_admin_permission` — verify)
- [ ] No new public endpoints (`permission_callback => '__return_true'`) in 6A code
- [ ] Cron classes have no REST endpoints — they are internal only (verify no accidental route registration)
- [ ] `get_ical()` — uses `hash_equals()` token auth, not loose string comparison (verify)

### D. Direct Object Reference
- [ ] `update_notification_preferences()` — uses `$current_staff['id']` from authenticated session, not from request param (verify — a user should not be able to pass a different `staff_id` to update another user's preferences)
- [ ] Digest queue queries — `staff_id` comes from DB query results, not from user input
- [ ] `get_staff_details()` — admin-only, direct object reference by ID is acceptable since admin can view all staff

### E. Output Escaping
- [ ] All email HTML built in `Bookit_Staff_Notifier`, `Bookit_Staff_Digest_Daily`, `Bookit_Staff_Digest_Weekly`, `Bookit_Staff_Schedule_Daily` uses `esc_html()` for user data, `esc_url()` for URLs
- [ ] No unescaped customer names, service names, or dates in email body builders
- [ ] REST response values do not need escaping (WordPress handles this) — but verify no raw HTML constructed from user input is returned in responses

### F. SQL-Specific
- [ ] The `IN (...)` pattern in digest cron classes: confirm `$row_ids` and `$booking_ids` are arrays of integers (cast via `(int)`) before being used in `implode()` + `$wpdb->prepare()` — this prevents injection if a non-integer somehow enters the array
- [ ] No `JSON_CONTAINS()` in any cron class or notifier

### G. Rate Limiting
- [ ] Confirm no new public-facing endpoints were added in 6A without rate limiting
- [ ] The preferences endpoints (`PUT /dashboard/profile/notification-preferences`) are dashboard-authenticated — rate limiting not required for authenticated endpoints
- [ ] Digest cron classes — server-side only, no HTTP surface — rate limiting not applicable

### H. Brevo params pass-through
- [ ] `$template_params` in `send()` — confirm `email_type` and `template_id` are stripped before forwarding to Brevo (leaking internal keys to the external API is an information disclosure issue)
- [ ] Confirm no sensitive data (e.g. raw customer emails, phone numbers, payment intent IDs) is included in `$template_params` without being intentional — the params come from `$row['params']` in the queue, which is caller-controlled. Verify the callers (Bookit_Staff_Notifier, digest cron classes) pass only safe display data in params

### I. PHP Notices and Warnings
- [ ] All array accesses on potentially-null values use null coalescing (`?? ''`, `?? array()`, etc.) — check especially the cron classes and notifier
- [ ] No `count()` on non-array values
- [ ] No string operations on potentially-null DB results without null check

---

## REPORTING FORMAT

For each file, report one of:

**If clean:**
```
✅ [filename] — No issues found
```

**If issues found:**
```
⚠️ [filename] — [N] issue(s) found:
  Issue 1: [Description] — Line [N] — Severity: Low/Medium/High
  Fix applied: [What was changed]
```

After all files, provide a summary:
- Total issues found
- Total issues fixed
- Files with fixes (list)
- Confirm PHPUnit suite still passes after any fixes

---

## PHPUNIT REQUIREMENTS

Baseline: **928 tests, 0 failures** — must not regress.

If any fixes are applied, run PHPUnit after all fixes:
```
cd bookit-booking-system && vendor/bin/phpunit
```

Confirm test count has not regressed. If fixes cause test failures, resolve before reporting back.

---

## ACCEPTANCE CRITERIA

- [ ] All 11 files in scope reviewed against full checklist
- [ ] All issues found are fixed in the same session
- [ ] Each fix reported with file, approximate line, and nature
- [ ] No `JSON_CONTAINS()` in any new code
- [ ] All `IN (...)` clauses with dynamic arrays use the prepare + placeholder pattern
- [ ] All email HTML uses `esc_html()` / `esc_url()` for user data
- [ ] PHPUnit suite passes (928+ tests, 0 failures)

---

## GIT COMMIT MESSAGE

If no issues found:
```
Sprint 6A, Task 10: Security review — OWASP pass, no issues found

Reviewed all Sprint 5 + 6A code against OWASP checklist:
- Input sanitisation, DB query safety, auth/authz, IDOR, output escaping,
  SQL injection, rate limiting, Brevo params disclosure

Tests: 928 passing, 0 failures
```

If issues found and fixed:
```
Sprint 6A, Task 10: Security review — OWASP pass, [N] issue(s) fixed

[List each fix as a bullet]

Tests: [N] passing, 0 failures
```

---

If you encounter a security issue that requires an architecture decision to resolve (e.g. a structural IDOR that cannot be fixed with a simple guard), STOP and report back before making any changes.