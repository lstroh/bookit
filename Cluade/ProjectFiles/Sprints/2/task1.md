# 🔒 TASK 1: SESSION SECURITY & CSRF PROTECTION

**Estimated Time:** 18 hours  
**Status:** READY TO BEGIN

---

## 📝 IMPLEMENTATION PROMPT FOR CURSOR

Copy the section below (between the lines) and paste it into **Cursor Composer** (Ctrl+I or Cmd+I):

---

```
TASK: Implement Session Security & CSRF Protection for WordPress Booking Plugin

CONTEXT:
This is Sprint 2, Task 1. We're hardening the existing session management system from Sprint 1 with production-grade security features before implementing payment processing.

REQUIREMENTS:

1. UPDATE EXISTING FILE: includes/class-session-manager.php
   - Add session security configuration (HTTPS-only, HttpOnly, SameSite)
   - Implement 30-minute inactivity timeout
   - Add session fixation prevention
   - Add session cleanup on booking completion
   - Verify session data persistence across steps

2. CREATE NEW FILE: includes/class-csrf-protection.php
   - WordPress nonce generation for booking forms
   - Nonce verification on form submissions
   - AJAX nonce handling
   - Error handling with user-friendly messages

3. CREATE NEW FILE: includes/cron/class-session-cleanup.php
   - Daily cron job to clean up abandoned sessions (>24 hours old)
   - Search for session files containing 'bookit_booking'
   - Delete old sessions safely
   - Log cleanup activity
   - Register/unregister cron on activation/deactivation

4. UPDATE EXISTING FORMS (from Sprint 1):
   - Add CSRF nonce fields to all booking wizard steps (Steps 1-4)
   - Add nonce verification in form handlers
   - Update AJAX calls to include nonces

SECURITY REQUIREMENTS:
- Session timeout: 1800 seconds (30 minutes inactive)
- HTTPS-only cookies: Yes (session.cookie_secure = 1)
- HttpOnly: Yes (prevents JavaScript access)
- SameSite: Lax (CSRF protection)
- Session ID regeneration: On first visit (fixation prevention)
- Nonce lifetime: WordPress default (24 hours)

FILE LOCATIONS:
- includes/class-session-manager.php (UPDATE EXISTING)
- includes/class-csrf-protection.php (CREATE NEW)
- includes/cron/class-session-cleanup.php (CREATE NEW)
- public/templates/booking-step-*.php (UPDATE - add nonce fields)

WORDPRESS CODING STANDARDS:
- Follow WordPress PHP Coding Standards
- Use WordPress functions: wp_nonce_field(), wp_verify_nonce(), wp_schedule_event()
- Proper error handling with wp_die() for security failures
- Add docblocks to all functions
- Use proper escaping: esc_html(), esc_attr()

SUCCESS CRITERIA:
- Session expires after 30 minutes of inactivity
- CSRF tokens prevent form replay attacks
- HTTPS-only cookies configured correctly
- Daily cron job registered and functional
- All existing forms protected with nonces
- No PHP warnings or notices
- Code follows WordPress standards

IMPLEMENTATION NOTES:
1. Session configuration must happen BEFORE session_start()
2. Use WordPress 'init' hook with priority 1 for session setup
3. Store last activity timestamp in $_SESSION['last_activity']
4. Cron cleanup should check file modification time before deleting
5. Nonces should be checked before processing any form data
6. Provide clear error messages if session expires during booking

Please generate the complete, production-ready code for all three files plus the form updates.
```

---

## ⏸️ AFTER CURSOR GENERATES CODE

**Step 1: Review Generated Files**

Check that Cursor created/updated these files:
- [ ] `includes/class-session-manager.php` (modified)
- [ ] `includes/class-csrf-protection.php` (new)
- [ ] `includes/cron/class-session-cleanup.php` (new)
- [ ] Updated booking form templates with nonce fields

**Step 2: Verify Session Configuration**

Open `includes/class-session-manager.php` and verify it contains:
```php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_maxlifetime', 1800); // 30 minutes
```

**Step 3: Verify CSRF Protection**

Open `includes/class-csrf-protection.php` and verify it has:
- Method to generate nonce field
- Method to verify nonce on submission
- WordPress nonce functions used correctly

**Step 4: Verify Cron Job**

Open `includes/cron/class-session-cleanup.php` and verify:
- Cron hook registered: `wp_schedule_event()`
- Cleanup function searches for old session files
- Deactivation hook clears cron: `wp_clear_scheduled_hook()`

**Step 5: Check Form Updates**

Verify booking forms now have nonce fields:
```php
<?php wp_nonce_field('bookit_booking_action', 'bookit_nonce'); ?>
```

**Step 6: Include New Classes in Main Plugin**

Open `booking-system.php` (main plugin file) and ensure new classes are loaded:
```php
require_once plugin_dir_path(__FILE__) . 'includes/class-session-manager.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-csrf-protection.php';
require_once plugin_dir_path(__FILE__) . 'includes/cron/class-session-cleanup.php';
```

---

## 🧪 TESTING PHASE

Once code is generated and reviewed, **reply with:** "Code generated, ready to test Task 1"

I'll then provide the complete testing checklist with step-by-step manual testing instructions.

---

**Are you ready to paste this into Cursor Composer?**