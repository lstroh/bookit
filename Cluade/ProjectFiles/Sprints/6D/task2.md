976 tests, 0 failures. 6D-1 is done.

Now generating the 6D-2 prompt. Let me read the relevant files from project knowledge first.I have everything I need. The `CustomerProfile.vue` already exists and even has a placeholder note: `"Email address cannot be changed here."` — that's the exact insertion point for the Change Email button. Let me now get the rate limiter and audit logger patterns.I have everything I need. Now generating the 6D-2 prompt.

---

```
TASK 2 OF 4: Customer Email Change Workflow (REQ-LEGAL-007)
Sprint: 6D | Est: ~7h | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
════════════════════════════════════════════════════════════

1. includes/api/class-customers-api.php
   — Full file. Understand register_routes(), check_admin_permission(),
     and the pattern used for existing customer endpoints.

2. dashboard/src/views/CustomerProfile.vue
   — Full file. Find where customer.email is displayed. There is already
     a placeholder: "Email address cannot be changed here." — this is
     the exact insertion point for the Change Email UI.

3. database/migrations/0018-add-google-oauth-columns-to-staff.php
   — Read to confirm the migration class pattern, column_exists() via
     information_schema, and up()/down() structure.

4. includes/notifications/class-bookit-notification-dispatcher.php
   — Read enqueue_email() signature and the bookit_enqueue_email()
     wrapper it calls.

5. includes/class-bookit-activator.php
   — Find the page auto-creation pattern using get_page_by_path() guard.

6. public/class-shortcodes.php
   — Find shortcode registration pattern to register [bookit_email_changed].

7. includes/class-bookit-rate-limiter.php
   — Read check() and handle_exceeded() signatures.

8. includes/class-bookit-audit-logger.php
   — Read the log() method signature.

9. includes/email/class-email-sender.php
   — Read existing email generation methods for HTML email pattern.

If any file does not exist at the path shown, STOP and report back.

════════════════════════════════════════════════════════════
CONTEXT
════════════════════════════════════════════════════════════

Admin can change a customer's email address securely from the customer
profile in the dashboard. A verification email is sent to the NEW address
— the customer must click the link to confirm. Both old and new addresses
receive notifications. Closes GDPR Right to Rectification gap
(REQ-LEGAL-007). This is admin-initiated only. Customers do not
self-service email changes in Phase 1.

════════════════════════════════════════════════════════════
IMPLEMENTATION REQUIREMENTS
════════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────
### database/migrations/0019-add-email-change-columns-to-customers.php — CREATE
─────────────────────────────────────────────────────────

- Class name: Bookit_Migration_0019_Add_Email_Change_Columns_To_Customers
- Table: $wpdb->prefix . 'bookings_customers'
- Add three columns, each guarded by column_exists() via
  information_schema (exact same pattern as migration 0018):
  - pending_email_change VARCHAR(255) NULL DEFAULT NULL
  - email_change_token   VARCHAR(64)  NULL DEFAULT NULL
  - email_change_expires DATETIME     NULL DEFAULT NULL
- up() is idempotent — safe to run twice
- down() drops all three columns if they exist
- Use information_schema.COLUMNS with TABLE_SCHEMA = DATABASE()
  and COLUMN_NAME check — NOT SHOW COLUMNS LIKE (MariaDB wildcard
  issue confirmed in Sprint 6A)

─────────────────────────────────────────────────────────
### includes/class-bookit-migration-runner.php — MODIFY
─────────────────────────────────────────────────────────

- Register migration 0019 in the migrations list following the
  existing pattern for migrations 0001–0018.

─────────────────────────────────────────────────────────
### includes/api/class-customers-api.php — MODIFY
─────────────────────────────────────────────────────────

Register two new REST endpoints following the exact pattern of
existing customer endpoints in this file:

**Endpoint 1: POST /dashboard/customers/{id}/request-email-change**
- Permission: check_admin_permission() (bookit_staff must be blocked)
- Args: new_email (string, required, valid email format), reason (string, required)
- Logic:
  1. Rate limit: 5 requests per hour per admin user ID (not IP).
     Action key: 'email_change_request'
     Use the authenticated staff ID from Bookit_Auth::get_current_staff()
     as the rate limit identifier instead of IP. Adapt
     Bookit_Rate_Limiter::check() accordingly — pass staff ID string
     as the second argument (it is md5'd internally so any string works).
  2. Validate new_email is a valid email (is_email())
  3. Check new_email is not already in use by another customer:
     SELECT id FROM {prefix}bookings_customers
     WHERE email = %s AND id != %d
     If found, return WP_Error with message "This email is already in use"
     and HTTP 409.
  4. Generate token: wp_generate_password(32, false, false)
  5. Set on customer row:
     pending_email_change = new_email
     email_change_token   = token
     email_change_expires = gmdate('Y-m-d H:i:s', time() + DAY_IN_SECONDS)
  6. Enqueue verification email to NEW address via
     Bookit_Notification_Dispatcher::enqueue_email() with type
     'email_change_verification'
  7. Enqueue notification email to OLD (current) address with type
     'email_change_notification'
  8. Fire Bookit_Audit_Logger::log('customer.email_change_requested',
     'admin', $staff_id, ['customer_id'=>$id, 'new_email'=>$new_email,
     'reason'=>$reason])
  9. Return WP_REST_Response(['success' => true], 200)

**Endpoint 2: GET /wizard/verify-email-change** (public — no auth)
- permission_callback: __return_true
- Args: token (string, required), customer_id (int, required)
- Logic:
  1. Fetch customer row by customer_id
  2. Validate: token matches email_change_token (use hash_equals())
  3. Validate: email_change_expires is not past (strtotime comparison)
  4. On failure: return WP_REST_Response with 400 and clear message
  5. On success:
     a. Store old email before update
     b. UPDATE customer: email = pending_email_change,
        pending_email_change = NULL,
        email_change_token = NULL,
        email_change_expires = NULL
     c. Enqueue confirmation email to OLD address (type:
        'email_change_confirmed')
     d. Enqueue confirmation email to NEW address (type:
        'email_change_confirmed')
     e. Fire audit log: 'customer.email_change_confirmed'
     f. wp_redirect( home_url('/bookit-email-changed/') ); exit;

─────────────────────────────────────────────────────────
### includes/email/class-email-sender.php — MODIFY
─────────────────────────────────────────────────────────

Add three new HTML email generation methods following the existing
pattern of generate_customer_email() / generate_cancellation_email():

- generate_email_change_verification_email( $customer, $token ):
  Subject: "Please verify your new email address"
  Body: Explains an admin has requested the email change. Includes
  a verify button linking to:
  rest_url('bookit/v1/wizard/verify-email-change')
    . '?token=' . $token . '&customer_id=' . $customer['id']
  Use inline CSS consistent with existing email HTML.

- generate_email_change_notification_email( $customer ):
  Subject: "Email change requested for your booking account"
  Body: "An email change has been requested for your booking account.
  If you did not request this, please contact us."
  No link. No action required from recipient.

- generate_email_change_confirmed_email( $new_email ):
  Subject: "Your booking account email has been updated"
  Body: "Your booking account email has been updated. Future booking
  communications will be sent to your new address."

All three methods return HTML strings. Subjects are plain strings.
The caller (customers API) passes subject + html_body to
Bookit_Notification_Dispatcher::enqueue_email().

─────────────────────────────────────────────────────────
### includes/class-bookit-activator.php — MODIFY
─────────────────────────────────────────────────────────

Add page auto-creation for /bookit-email-changed/ using the exact
same get_page_by_path() guard pattern already used for /bookit-cancel/
and /bookit-reschedule/:
- Title: "Email Updated"
- Slug: bookit-email-changed
- Content: [bookit_email_changed]
- Status: publish

─────────────────────────────────────────────────────────
### public/class-shortcodes.php — MODIFY
─────────────────────────────────────────────────────────

Register shortcode [bookit_email_changed] following the existing
shortcode registration pattern. The render method outputs:

  <div class="bookit-confirmation-page bookit-magic-link-page">
    <div class="bookit-confirmation-card">
      <h2>Email Updated</h2>
      <p>Your email address has been updated. Future booking
      communications will be sent to your new address.</p>
    </div>
  </div>

No script block. No PHP data injection. Pure static HTML.
Add to no_texturize_shortcodes alongside the other two
(bookit_reschedule_booking, bookit_cancel_booking).

─────────────────────────────────────────────────────────
### dashboard/src/views/CustomerProfile.vue — MODIFY
─────────────────────────────────────────────────────────

Note: Before implementing any Vue changes, use Context7 to resolve
'Vue' and confirm current Vue 3 Composition API patterns for
reactive refs, computed, and fetch.

Find the existing placeholder text:
  "Email address cannot be changed here."

Replace it with the Change Email UI:

**Display state (default):**
- Show current email with a "Change Email" button next to it
- Remove the existing placeholder text entirely

**On "Change Email" click:**
- Inline form appears below the email display (not a modal):
  - Input: New email address (type="email", required)
  - Select dropdown: Reason
    Options: "Typo fix", "Customer request", "Other"
  - Buttons: "Cancel" (hides form) | "Send Verification" (submits)

**Submit logic:**
- POST to: `${window.BOOKIT_DASHBOARD.apiBase}/customers/${id}/request-email-change`
- Headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce,
             'Content-Type': 'application/json' }
- Body: JSON.stringify({ new_email, reason })
- Success state: Hide form, show inline message:
  "Verification email sent to [new_email]. The customer must click
  the link to confirm the change."
- Error state: Show error message inline (e.g. "This email is already
  in use" from API)

**State management:**
- Use Vue 3 Composition API (ref, computed) consistent with how the
  rest of CustomerProfile.vue manages state
- showEmailForm ref (boolean)
- newEmail ref (string)
- emailReason ref (string)
- emailChangeLoading ref (boolean)
- emailChangeSuccess ref (string | null)
- emailChangeError ref (string | null)

════════════════════════════════════════════════════════════
INFRASTRUCTURE REQUIREMENTS (Sprint 4B)
════════════════════════════════════════════════════════════

- [ ] Migration 0019 created and registered in migration runner
- [ ] New REST endpoints follow class-customers-api.php pattern
- [ ] Audit log fired: customer.email_change_requested on POST
- [ ] Audit log fired: customer.email_change_confirmed on GET verify
- [ ] Rate limiting applied to request-email-change (5/hour per admin)
- [ ] bookit_staff role blocked from both new endpoints via
      check_admin_permission()

════════════════════════════════════════════════════════════
PHPUNIT REQUIREMENTS
════════════════════════════════════════════════════════════

Baseline: 976 tests, 0 failures — must not regress.

New test file: tests/unit/test-email-change-workflow.php

Required test cases:
- test_request_email_change_sends_verification_to_new_address
- test_request_email_change_sends_notification_to_old_address
- test_request_email_change_rejects_duplicate_email
- test_request_email_change_requires_admin_role
- test_verify_email_change_updates_customer_email
- test_verify_email_change_rejects_expired_token
- test_verify_email_change_rejects_invalid_token
- test_verify_email_change_clears_pending_columns
- test_verify_email_change_fires_audit_log
- test_email_change_rate_limited_after_threshold

Run after implementation:
  cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
════════════════════════════════════════════════════════════

Functional:
- [ ] Admin can click "Change Email" in customer profile
- [ ] Inline form appears with new email input + reason dropdown
- [ ] Submitting sends verification email to new address
- [ ] Submitting sends notification email to old address
- [ ] Clicking verification link in email updates the email in DB
- [ ] After verification, both addresses receive confirmation email
- [ ] Expired token (24h+) returns 400 with clear error message
- [ ] Invalid token returns 400 with clear error message
- [ ] Duplicate email returns 409 with "This email is already in use"
- [ ] Audit log entry created for request and for confirmation
- [ ] After 5 requests in one hour by same admin, returns 429
- [ ] /bookit-email-changed/ page renders [bookit_email_changed] shortcode

Technical:
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] bookit_staff role cannot access either new endpoint
- [ ] PHPUnit: 976+ tests, 0 failures

Must NOT break:
- [ ] Existing customer GET / PUT / DELETE endpoints
- [ ] CustomerProfile.vue edit mode for name/phone/notes
- [ ] Cancel and reschedule magic link pages

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 2: Customer email change workflow (REQ-LEGAL-007)

- Migration 0019: pending_email_change, email_change_token,
  email_change_expires columns on wp_bookings_customers
- POST /dashboard/customers/{id}/request-email-change (admin only)
- GET /wizard/verify-email-change (public, token-auth)
- [bookit_email_changed] shortcode + /bookit-email-changed/ page
- Three new email types: verification, notification, confirmed
- Customer profile UI: Change Email button + inline form
- Closes GDPR Right to Rectification gap (REQ-LEGAL-007)

Tests: [N] passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```