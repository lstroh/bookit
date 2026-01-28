Perfect! Now let me get the specific architecture details for the booking page structure:Excellent! Now let me search for accessibility and WCAG requirements:Perfect! Now I have everything I need. Let me create your comprehensive **Task 1 Implementation Prompt**:

---

# 🚀 TASK 1: BOOKING PAGE STRUCTURE & ROUTING

**Sprint 1, Task 1 of 8**  
**Estimated Time:** 14 hours  
**Complexity:** Medium  

---

## 📋 TASK OVERVIEW

You're building the foundation for the 4-step customer booking wizard. This task creates the page structure, routing system, session management, and navigation framework that all subsequent tasks will build upon.

### What You're Building

1. **WordPress Page Template** with `[bookit_booking_wizard]` shortcode
2. **4-Step Wizard Shell** with progress indicator
3. **PHP Session Manager** with security settings
4. **Navigation System** (Back/Next buttons with validation)
5. **Basic Responsive Styling** (mobile-first CSS framework)

### What You're NOT Building Yet

- ❌ Service/Staff selection UI (Tasks 2-3)
- ❌ Date/Time picker (Tasks 4-5)
- ❌ Contact form (Task 6)
- ❌ Actual booking logic (Sprint 2)

---

## 🏗️ ARCHITECTURE REFERENCES

### From Your Project Knowledge

**Session Configuration (Security-First):**
```php
// Architecture Doc Section 10.3
ini_set('session.cookie_httponly', 1);  // Prevent JS access
ini_set('session.cookie_secure', 1);    // HTTPS only
ini_set('session.cookie_samesite', 'Lax'); // CSRF protection
ini_set('session.gc_maxlifetime', 28800);  // 8 hours timeout
```

**File Structure (Architecture Doc Section 4):**
```
public/
├── class-shortcodes.php           # [bookit_booking_wizard] shortcode
├── templates/
│   ├── booking-step-1-services.php
│   ├── booking-step-2-staff.php
│   ├── booking-step-3-datetime.php
│   └── booking-step-4-checkout.php
└── assets/
    ├── css/booking-wizard.css
    └── js/booking-wizard.js
```

**WCAG 2.1 AA Requirements (TechnicalRequirements.md Section 5):**
- ✅ Skip to main content link (first focusable element)
- ✅ Focus indicators ≥2px outline on all interactive elements
- ✅ Semantic HTML5 (`<main>`, `<nav>`, heading hierarchy)
- ✅ Color contrast ≥4.5:1 for text
- ✅ Touch targets ≥44×44px (mobile)

---

## 💻 CURSOR IMPLEMENTATION PROMPT

**Copy the entire section below and paste into Cursor Composer:**

```markdown
# TASK: Create Booking Wizard Foundation (Sprint 1, Task 1)

## Context
I'm building a WordPress booking plugin called "Bookit Booking System". I need to create the 4-step customer booking wizard foundation with:
- WordPress shortcode integration
- Session-based step management
- Progress indicator
- Responsive mobile-first design
- WCAG 2.1 AA accessibility

## Technical Stack
- WordPress 6.0+
- PHP 8.0+
- Vanilla JavaScript (no frameworks for public page)
- Mobile-first CSS

## Requirements

### 1. Create Session Manager Class

**File:** `includes/core/class-session-manager.php`

Create a secure session manager with:
- Start session with security settings (HttpOnly, Secure, SameSite=Lax)
- 8-hour timeout
- Session regeneration on step changes
- Get/set/clear wizard data methods
- Session timeout warning (2 minutes before expiry for WCAG 2.1)

Security configuration:
```php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_maxlifetime', 28800); // 8 hours
```

Session data structure:
```php
$_SESSION['bookit_wizard'] = [
    'current_step' => 1,
    'service_id' => null,
    'staff_id' => null,
    'date' => null,
    'time' => null,
    'customer' => []
];
```

### 2. Create Booking Shortcode Handler

**File:** `public/class-shortcodes.php`

Create shortcode class that:
- Registers `[bookit_booking_wizard]` shortcode
- Initializes session on first load
- Renders wizard shell with progress indicator
- Enqueues CSS and JavaScript
- Includes correct step template based on session

### 3. Create Wizard HTML Structure

**File:** `public/templates/booking-wizard-shell.php`

Create wizard shell with:
- Skip to main content link (WCAG 2.1)
- Progress indicator (4 steps with visual state: completed, current, upcoming)
- Main content area with `<main>` landmark
- Step content container
- Navigation buttons (Back/Next)
- Hidden navigation on step 1 (no Back button)
- Responsive layout (mobile: stack, desktop: centered max-width 1200px)

HTML structure:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<div class="bookit-wizard-container">
    <div class="bookit-progress-indicator" role="navigation" aria-label="Booking progress">
        <!-- 4 steps: services, staff, date/time, contact -->
    </div>
    
    <main id="main-content" class="bookit-wizard-content">
        <!-- Step content loaded here -->
    </main>
    
    <nav class="bookit-wizard-nav" aria-label="Booking navigation">
        <button type="button" class="bookit-btn-back" id="bookit-back-btn">
            ← Back
        </button>
        <button type="button" class="bookit-btn-next" id="bookit-next-btn">
            Next →
        </button>
    </nav>
</div>
```

### 4. Create Step Template Shells

**Files:** Create 4 empty template files that will be built in later tasks:
- `public/templates/booking-step-1-services.php`
- `public/templates/booking-step-2-staff.php`
- `public/templates/booking-step-3-datetime.php`
- `public/templates/booking-step-4-checkout.php`

Each template should just have placeholder content:
```php
<div class="bookit-step bookit-step-X">
    <h2>Step X: [Step Name]</h2>
    <p>Content will be built in Task X</p>
</div>
```

### 5. Create JavaScript Navigation Controller

**File:** `public/assets/js/booking-wizard.js`

Create wizard navigation with:
- Back button handler (decrease step, update session via AJAX)
- Next button handler (validate current step, increase step, update session)
- Progress indicator update
- Show/hide Back button based on step
- URL hash management (#step-1, #step-2, etc.)
- Browser back button support
- AJAX endpoint calls to save session data

Key functions needed:
- `initWizard()` - Initialize on page load
- `goToStep(stepNumber)` - Navigate to specific step
- `validateCurrentStep()` - Check if step can progress (stub for now)
- `updateProgressIndicator()` - Update visual state
- `saveStepData()` - AJAX save to session

### 6. Create REST API Endpoint for Session Updates

**File:** `includes/api/class-wizard-api.php`

Create REST API endpoint:
- Route: `/bookit/v1/wizard/session`
- Methods: GET (read session), POST (update session)
- Permission: Public (no auth required for booking wizard)
- Nonce verification for security

Endpoints:
```php
GET  /wp-json/bookit/v1/wizard/session  // Get current session data
POST /wp-json/bookit/v1/wizard/session  // Update session data
```

### 7. Create Mobile-First CSS

**File:** `public/assets/css/booking-wizard.css`

Create responsive stylesheet with:
- Mobile-first approach (320px base)
- Skip link styling (hidden until focused)
- Progress indicator (vertical on mobile, horizontal on desktop)
- Wizard container (full-width mobile, centered desktop)
- Navigation buttons (full-width mobile, inline desktop)
- Focus indicators ≥2px outline (WCAG 2.1)
- Color contrast ≥4.5:1 (WCAG 2.1)
- Touch targets ≥44×44px (WCAG 2.1)

Breakpoints:
```css
/* Mobile first (320px+) */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

Color scheme (ensure WCAG AA contrast):
- Primary button: #0056B3 (dark blue) on white
- Secondary button: #6C757D (gray) on white
- Focus outline: #0056B3 2px solid
- Success state: #28A745 (green)
- Error state: #DC3545 (red)

### 8. Register Shortcode in Main Plugin File

**File:** `bookit-booking-system.php`

Add to plugin initialization:
```php
// Load shortcode handler
require_once BOOKIT_PLUGIN_DIR . 'public/class-shortcodes.php';
$shortcodes = new Bookit_Shortcodes();
```

## WordPress Standards
- Follow WordPress Coding Standards for PHP
- Use `esc_html()`, `esc_attr()`, `esc_url()` for output escaping
- Use WordPress nonce for AJAX security
- Use `wp_enqueue_script()` and `wp_enqueue_style()` for assets
- Use `wp_localize_script()` to pass AJAX URL and nonce to JavaScript

## Accessibility Requirements
- Skip link must be first focusable element
- All buttons must have visible focus indicators
- Proper heading hierarchy (H1 → H2 → H3)
- ARIA labels for navigation regions
- Color alone cannot convey information

## Testing Checklist
After implementation, I need to verify:
- [ ] Shortcode renders wizard shell
- [ ] Progress indicator shows 4 steps
- [ ] Step 1 template loads on first visit
- [ ] Back button hidden on step 1
- [ ] Session persists on page refresh
- [ ] Browser back button works
- [ ] Mobile responsive (320px to 1920px)
- [ ] Skip link visible on keyboard focus
- [ ] Focus indicators visible on all buttons
- [ ] No JavaScript console errors

Generate the complete implementation following WordPress best practices.
```

---

## ✅ TESTING CHECKLIST

After Cursor generates the code, test each item:

### Functional Testing

- [ ] **Shortcode Renders:** Add `[bookit_booking_wizard]` to a page, verify wizard appears
- [ ] **Session Initializes:** Check `$_SESSION['bookit_wizard']` exists in PHP
- [ ] **Progress Indicator:** 4 steps visible with step 1 as "current"
- [ ] **Step 1 Loads:** Placeholder content from `booking-step-1-services.php` displays
- [ ] **Back Button Hidden:** Not visible on step 1
- [ ] **Next Button Works:** Clicking advances to step 2 (placeholder)
- [ ] **Back Button Works:** On step 2+, clicking goes back to previous step
- [ ] **Session Persists:** Refresh page, still on same step
- [ ] **Browser Back:** Browser back button navigates steps correctly
- [ ] **URL Hashes:** URL shows `#step-1`, `#step-2`, etc.

### Responsive Testing

- [ ] **Mobile (320px):** Wizard fits screen, no horizontal scroll
- [ ] **Tablet (768px):** Layout adapts appropriately
- [ ] **Desktop (1920px):** Centered layout, max-width respected

### Accessibility Testing

- [ ] **Skip Link:** Tab on page load, skip link visible and functional
- [ ] **Focus Indicators:** All buttons show ≥2px outline when focused
- [ ] **Keyboard Navigation:** Tab through all elements, Enter activates buttons
- [ ] **Heading Hierarchy:** Check with headingsMap browser extension (H1 → H2)
- [ ] **ARIA Labels:** Progress indicator has `aria-label="Booking progress"`
- [ ] **Color Contrast:** Use WebAIM contrast checker, verify ≥4.5:1

### Technical Testing

- [ ] **No Console Errors:** Open browser DevTools, no errors in Console tab
- [ ] **AJAX Works:** Network tab shows successful `POST /wp-json/bookit/v1/wizard/session`
- [ ] **Nonce Valid:** Session updates succeed (not blocked by nonce verification)
- [ ] **Session Security:** Check cookies in DevTools → Application → Cookies, verify HttpOnly=true

### PHPUnit Testing (if time permits)

Create: `tests/unit/test-session-manager.php`

```php
class Test_Session_Manager extends WP_UnitTestCase {
    public function test_session_starts() {
        $session = new Bookit_Session_Manager();
        $this->assertTrue(session_id() !== '');
    }
    
    public function test_wizard_data_initialization() {
        $session = new Bookit_Session_Manager();
        $data = $session->get_wizard_data();
        $this->assertEquals(1, $data['current_step']);
    }
}
```

Run tests:
```bash
npm run wp-env:start
npm test
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Session Not Persisting

**Symptoms:** Data lost on page refresh

**Solutions:**
1. Check `session_start()` called before any output
2. Verify no whitespace before `<?php` in PHP files
3. Check server has write permissions to session directory
4. Try: `var_dump(session_id());` to verify session ID exists

### Issue 2: "Headers Already Sent" Error

**Symptoms:** PHP warning about headers

**Solutions:**
1. Ensure no output before `session_start()`
2. Check for BOM (byte order mark) in PHP files
3. Move session initialization earlier in plugin load

### Issue 3: Skip Link Not Visible on Focus

**Symptoms:** Skip link doesn't appear when tabbing

**Solutions:**
1. Check CSS: `.skip-link:focus { top: 0; }`
2. Verify `z-index` is high enough
3. Test in different browsers (Firefox vs Chrome)

### Issue 4: AJAX Endpoint 404

**Symptoms:** Network tab shows 404 for REST API call

**Solutions:**
1. Verify REST API route registration: `register_rest_route()`
2. Check namespace: `bookit/v1` matches route
3. Flush rewrite rules: Go to Settings → Permalinks → Save
4. Test endpoint directly in browser: `https://yoursite.local/wp-json/bookit/v1/wizard/session`

### Issue 5: Mobile Layout Breaking

**Symptoms:** Horizontal scroll or elements cut off

**Solutions:**
1. Add viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Check for fixed-width elements (use `max-width: 100%`)
3. Test with Chrome DevTools responsive mode
4. Verify no negative margins causing overflow

---

## 📝 GIT COMMIT MESSAGE

When task complete, commit with:

```
Sprint 1, Task 1: Booking wizard foundation complete

- Created session manager with 8-hour timeout and security settings
- Implemented [bookit_booking_wizard] shortcode
- Built 4-step wizard shell with progress indicator
- Added REST API endpoints for session management
- Created mobile-first responsive CSS framework
- Implemented keyboard navigation and WCAG 2.1 AA compliance
- Added skip link and focus indicators
- Created 4 step template shells (placeholders for Tasks 2-6)

Refs: MUST-001 to MUST-028 (booking flow foundation)
Files: 8 created, 1 modified
Tests: Manual testing complete, responsive verified
```

---

## 🎯 COMPLETION CRITERIA

Task 1 is complete when:

- ✅ Shortcode renders 4-step wizard shell
- ✅ Session manager handles wizard state
- ✅ Progress indicator updates on navigation
- ✅ Back/Next buttons work correctly
- ✅ Mobile responsive (320px to 1920px)
- ✅ Accessibility requirements met (skip link, focus, ARIA)
- ✅ No JavaScript console errors
- ✅ All testing checklist items pass

---

## 🚀 NEXT STEPS

When Task 1 is complete:

1. **Commit your code** using the Git message above
2. **Return to this chat** and say: "Task 1 complete ✅"
3. **I'll provide Task 2:** Service Selection UI (20 hours)

---

**Estimated Time:** 14 hours  
**Actual Time:** [You'll track this]

**Ready to paste this into Cursor?** Let me know if you need any clarifications before starting!