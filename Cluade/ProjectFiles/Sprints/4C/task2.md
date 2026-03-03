Excellent! Let me check the current state of the implementation before writing the Task 2 prompt.I have a clear picture of what exists and what's needed. The existing `class-wizard-api.php` is the **customer-facing booking wizard** (step-by-step booking flow shortcode), not the in-app onboarding setup guide. Task 2 needs to build something entirely separate. Here's the prompt:

---

## Task 2 Cursor Prompt — Setup Wizard: Backend + State

```
# TASK 2: Setup Guide — Backend + State
# Sprint 4C | Bookit Booking System
# Estimated: 8 hours

## CRITICAL NAMING CLARIFICATION — READ THIS FIRST

The codebase already has a file called class-wizard-api.php. That file
is the CUSTOMER-FACING BOOKING WIZARD — the multi-step shortcode that
customers use to book appointments on the website. It is completely
unrelated to this task.

This task builds the IN-APP SETUP GUIDE — an onboarding overlay shown
to bookit_admin users inside the business dashboard after they first
log in. To avoid all confusion with the existing wizard:

  USE THE NAME "Setup Guide" THROUGHOUT
  - PHP class:    Bookit_Setup_Guide_API
  - PHP file:     includes/api/class-setup-guide-api.php
  - Vue composable: useSetupGuide.js
  - wp_options key: bookit_setup_guide_status

  NEVER name anything "wizard" in the new code for this task.
  The word "wizard" is already taken by the booking flow.

---

## CONTEXT

New bookit_admin users land in the dashboard after completing the
one-time account creation (dashboard/setup.php). They are then
immediately faced with an empty dashboard and have no guidance on what
to do next.

The Setup Guide is a 4-step in-app overlay that:
- Auto-shows on first login for bookit_admin users
- Guides them through: Add First Service → Set Availability →
  Configure Payments → Start Taking Bookings
- Can be dismissed/skipped at any point
- Once completed OR dismissed, never auto-shows again
- Is always accessible from a persistent "Setup Guide" sidebar link

This task (Task 2) delivers ONLY the backend and Vue state layer:
- PHP REST API endpoints for reading/writing setup guide status
- Vue composable (useSetupGuide.js) that wraps those endpoints
- Integration into App.vue: check status on mount, expose state to
  child components

Task 3 will build the actual overlay UI on top of this foundation.

---

## MANDATORY: READ THESE FILES FIRST

Before writing a single line of code, read ALL of these:

1. dashboard/app/index.php
   — How BOOKIT_DASHBOARD JS data is injected (staff, nonce, restBase).
   — Note that staff.role is available client-side already.

2. dashboard/src/App.vue
   — The ENTIRE file. This is where the setup guide status check must
     be added on mount. Also note the existing branding fetch pattern —
     the setup guide check must follow the same async pattern.
   — Understand what data is already available and how errors are handled.

3. dashboard/src/components/Sidebar.vue
   — The ENTIRE file. The "Setup Guide" sidebar link must be added here.
   — Study mainNavigation, isAdmin, and how items are conditionally shown.

4. includes/api/class-team-calendar-api.php
   — The check_admin_permission() method. Copy this exact permission
     pattern for the new Setup Guide API — do not invent a new approach.

5. includes/class-bookit-loader.php
   — How new API controllers are registered (require_once pattern).
   — Find the correct place to add the new class-setup-guide-api.php.

6. includes/class-bookit-audit-logger.php
   — The log() method signature. The "mark complete" and "dismiss"
     actions must be logged.

7. includes/class-bookit-error-registry.php
   — Existing error codes. Register any new errors needed here rather
     than returning raw WP_Errors.

Do not skip reading these files. The implementation must be consistent
with every existing pattern.

---

## WHAT TO BUILD

### 1. Database / Storage

Do NOT create a new database table for this feature.

Store the setup guide status per admin user using WordPress user meta:
  meta_key:   bookit_setup_guide_status
  meta_value: JSON string (see shape below)

Using user meta (not wp_options) means each admin has their own setup
guide state. This is correct: if two admins exist, each completes their
own guide independently.

Status shape (stored as JSON):
  {
    "status": "pending",       // "pending" | "completed" | "dismissed"
    "current_step": 1,         // 1–4, persisted so refresh resumes position
    "completed_at": null,      // ISO 8601 UTC string or null
    "dismissed_at": null,      // ISO 8601 UTC string or null
    "steps_completed": []      // array of step numbers marked done: [1,2,3]
  }

Default (no meta set yet): treat as pending, step 1.

---

### 2. PHP: class-setup-guide-api.php

File: includes/api/class-setup-guide-api.php

Register two REST endpoints. Follow the exact pattern used in
class-team-calendar-api.php for namespace, constructor, register_routes,
and check_admin_permission.

#### GET /bookit/v1/setup-guide/status

Permission: bookit_admin only (same check_admin_permission pattern).

Response:
  {
    "success": true,
    "status": "pending",
    "current_step": 1,
    "completed_at": null,
    "dismissed_at": null,
    "steps_completed": []
  }

If no user meta exists yet, return defaults (pending, step 1).

#### POST /bookit/v1/setup-guide/status

Permission: bookit_admin only.

Accepted body params:
  action       (required) — "complete" | "dismiss" | "update_step"
  current_step (optional) — integer 1–4, used with "update_step"
  step_done    (optional) — integer 1–4, adds to steps_completed array

Behaviour:
  action = "complete":
    Set status = "completed", completed_at = current UTC time.
    Log to audit: action "setup_guide_completed", staff_id = current user.
    Fire hook: do_action('bookit_setup_guide_completed', $staff_id)

  action = "dismiss":
    Set status = "dismissed", dismissed_at = current UTC time.
    Log to audit: action "setup_guide_dismissed", staff_id = current user.
    Fire hook: do_action('bookit_setup_guide_dismissed', $staff_id)

  action = "update_step":
    Update current_step and/or append to steps_completed.
    No audit log (too granular — just navigation).
    No hook needed.

Always return the full updated status object:
  {
    "success": true,
    "status": "...",
    "current_step": N,
    "completed_at": "...",
    "dismissed_at": "...",
    "steps_completed": [...]
  }

Validation:
  - Unknown action → 400, register error in Bookit_Error_Registry
  - Invalid current_step (not 1–4) → 400

Register this controller in class-bookit-loader.php using the same
require_once pattern as class-team-calendar-api.php.

---

### 3. Vue: useSetupGuide.js composable

File: dashboard/src/composables/useSetupGuide.js

This composable is the single source of truth for setup guide state
in the Vue app. All components that need to read or update the setup
guide use this composable — nothing calls the API directly.

Export:

  const {
    setupGuideStatus,   // ref: "pending" | "completed" | "dismissed" | null (null = not yet loaded)
    currentStep,        // ref: 1–4
    stepsCompleted,     // ref: array of step numbers
    isLoading,          // ref: boolean
    showGuide,          // computed: true if status === "pending"
    fetchStatus,        // async function: GET /setup-guide/status
    markComplete,       // async function: POST with action="complete"
    dismiss,            // async function: POST with action="dismiss"
    updateStep,         // async function(step, stepDone?): POST with action="update_step"
  } = useSetupGuide()

Implementation notes:
  - Use useApi() composable for all HTTP calls (same as every other
    composable in the project — read an existing one first)
  - fetchStatus() should set isLoading = true while fetching
  - On error from fetchStatus(), set setupGuideStatus = "dismissed"
    silently — a broken status endpoint must NOT block the dashboard
    from loading
  - showGuide is a computed: returns true only when
    setupGuideStatus.value === 'pending'
  - All functions should handle errors gracefully (try/catch, no
    unhandled promise rejections)

---

### 4. App.vue: status check on mount

File: dashboard/src/App.vue

Add to the onMounted lifecycle (after the existing branding fetch or
alongside it — do not replace existing logic):

  Only run the setup guide check if the current user is bookit_admin.
  Staff users must never trigger this check — it is irrelevant to them
  and would generate unnecessary 403 API calls.

  Check: window.BOOKIT_DASHBOARD.staff.role === 'admin' ||
         window.BOOKIT_DASHBOARD.staff.role === 'bookit_admin'

  If admin: call fetchStatus() from useSetupGuide().
  Store the composable state where it can be accessed by the overlay
  component that Task 3 will add (either in App.vue's template scope
  or via a provide/inject pattern — choose the simpler option given
  the existing App.vue structure).

  The setup guide check must be non-blocking. If it fails, the
  dashboard must still load and function normally.

Do not render any overlay UI in this task. App.vue should only:
  - Call fetchStatus() on mount (admin only)
  - Expose setupGuideStatus / showGuide for Task 3 to bind to

Leave a clearly-commented placeholder in App.vue's template where
Task 3 will insert the overlay:

  <!-- TASK 3: Setup Guide overlay rendered here when showGuide is true -->

---

### 5. Sidebar: Setup Guide link

File: dashboard/src/components/Sidebar.vue

Add a "Setup Guide" nav item that is:
  - Visible to bookit_admin only (use the existing isAdmin computed)
  - Always visible (regardless of whether the guide is complete or
    dismissed — it acts as a way to reopen it)
  - Positioned at the BOTTOM of the main navigation section, just
    before the Reports collapsible section
  - Uses icon: 🧭
  - Label: "Setup Guide"

Because the Setup Guide is an overlay (not a route), this link cannot
use <router-link>. Instead use a plain <button> or <a> styled with
the nav-item CSS class. It must emit an event or call a function that
Task 3 will connect to the overlay open logic.

For now (Task 2), clicking the link should:
  - Emit a custom event: 'open-setup-guide'
  - App.vue will listen for this in Task 3

Wire the emit in Sidebar.vue even though nothing handles it yet —
this establishes the interface for Task 3 cleanly.

Sidebar already uses emit for the 'close' event — follow that same
pattern for 'open-setup-guide'.

---

## CONSTRAINTS

- Do NOT build any overlay UI in this task. That is Task 3.
- Do NOT create a new database table. Use user meta only.
- Do NOT modify the customer-facing class-wizard-api.php in any way.
- All new PHP must follow WordPress Coding Standards.
- All new errors must be registered in Bookit_Error_Registry.
- All significant actions (complete, dismiss) must use Bookit_Audit_Logger.
- The setup guide status check in App.vue must be entirely non-blocking —
  a failure must not prevent dashboard load.

---

## TESTING CHECKLIST

### PHP / API
- [ ] GET /setup-guide/status as bookit_admin returns default pending
      state when no user meta exists
- [ ] GET /setup-guide/status as bookit_staff returns 403
- [ ] GET /setup-guide/status unauthenticated returns 401
- [ ] POST with action="complete" sets status to "completed" and
      completed_at is a valid ISO timestamp
- [ ] POST with action="dismiss" sets status to "dismissed"
- [ ] POST with action="update_step" and current_step=2 updates
      current_step to 2 in the stored meta
- [ ] POST with action="update_step" and step_done=1 adds 1 to
      steps_completed array
- [ ] POST with unknown action returns 400
- [ ] POST with current_step=5 returns 400
- [ ] After "complete", GET returns status="completed" (meta persists)
- [ ] After "dismiss", GET returns status="dismissed" (meta persists)
- [ ] Two different admin users have independent status (test with
      two separate user metas — check in DB directly via Adminer)
- [ ] Audit log entries exist after complete and dismiss actions

### Vue / composable
- [ ] useSetupGuide().fetchStatus() populates setupGuideStatus,
      currentStep, stepsCompleted correctly
- [ ] showGuide computed is true when status is "pending", false
      otherwise
- [ ] isLoading is true during fetch, false after
- [ ] markComplete() calls POST and updates local state to "completed"
- [ ] dismiss() calls POST and updates local state to "dismissed"
- [ ] updateStep(2) sends current_step=2 to API
- [ ] fetchStatus() failure sets setupGuideStatus = "dismissed" and
      does not throw

### App.vue integration
- [ ] On admin login: fetchStatus() is called on mount
- [ ] On staff login: fetchStatus() is NOT called (check Network tab —
      no request to /setup-guide/status)
- [ ] A fetch error does not break dashboard load — all other
      components still render

### Sidebar
- [ ] "Setup Guide" link visible when logged in as bookit_admin
- [ ] "Setup Guide" link NOT visible when logged in as bookit_staff
- [ ] Clicking the link emits 'open-setup-guide' (verify in Vue
      DevTools → Events, or add a temporary console.log to confirm)
- [ ] Link uses nav-item styling consistent with other sidebar items
- [ ] Link is positioned correctly (bottom of main nav, above Reports)

### PHPUnit
- [ ] npm test — zero failures, all existing tests pass
- [ ] New PHPUnit tests cover: GET status (admin), GET status (staff →
      403), POST complete, POST dismiss, POST update_step, POST unknown
      action → 400, POST invalid step → 400

---

## GIT COMMIT MESSAGE (use when done)

Sprint 4C Task 2: Setup Guide backend and Vue state layer

- PHP: GET + POST /bookit/v1/setup-guide/status (admin only)
- Storage: user meta (bookit_setup_guide_status) per admin user
- Audit log: setup_guide_completed, setup_guide_dismissed events
- Extension hooks: bookit_setup_guide_completed/dismissed
- Vue: useSetupGuide.js composable (fetchStatus, markComplete,
  dismiss, updateStep, showGuide computed)
- App.vue: fetchStatus() on mount for admin users (non-blocking)
- Sidebar: Setup Guide link (admin only, emits open-setup-guide)
- Task 3 placeholder comment in App.vue template
```

---

Once Task 2 is committed, come back and I'll generate the Task 3 prompt (the overlay UI itself — 4 steps, skip logic, sidebar link connection).