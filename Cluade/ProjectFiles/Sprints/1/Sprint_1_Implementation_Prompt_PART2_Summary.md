# SPRINT 1 IMPLEMENTATION ASSISTANT - PART 2 OF 2
## Detailed Task Instructions & Implementation Guidance

**Note:** Due to length constraints, this document provides a streamlined version of the 8 tasks. Liron should request full implementation details for each task as needed from the Sprint Implementation Assistant.

---

## HOW TO USE PART 2

When you're ready to start a specific task:

1. **In Sprint Implementation chat, say:** "Ready for Task [number]"
2. **Claude will provide:** Complete implementation prompt with:
   - Architecture references from project knowledge
   - Cursor-ready code examples
   - Testing checklist
   - Git commit message
   - Common issues & solutions

---

## TASK SUMMARIES

### TASK 1: Booking Page Structure & Routing (14h)

**Goal:** Set up booking page, routing, and wizard shell

**Key Deliverables:**
- WordPress page template with `[bookit_booking_wizard]` shortcode
- 4-step wizard shell with progress indicator
- PHP $_SESSION initialization with security settings
- Basic responsive styling
- Back/Next navigation buttons

**Critical Architecture References:**
- System_Architecture_Document_PART1, Section 6: Booking Flow
- Session configuration: 8-hour timeout, HttpOnly, SameSite=Strict

**Files to Create:**
- `templates/booking-page.php`
- `includes/shortcodes/class-booking-shortcode.php`
- `includes/core/class-session-manager.php`
- `assets/js/booking-wizard.js`
- `assets/css/booking-wizard.css`

---

### TASK 2: Service Selection UI (20h)

**Goal:** Display services with category filtering

**Key Deliverables:**
- Service grid (1-3 columns responsive)
- Category filter buttons
- Service cards (name, duration, price, description)
- "From £X" pricing logic for staff variations
- AJAX session storage

**Critical Architecture References:**
- MoSCoW Requirements: MUST-001 to MUST-006
- Service display algorithm from Architecture Doc

**Complex Logic:**
```sql
-- Get services with min/max staff pricing
SELECT s.*, MIN(ss.custom_price) as min_price, MAX(ss.custom_price) as max_price
FROM wp_bookings_services s
LEFT JOIN wp_bookings_staff_services ss ON s.id = ss.service_id
GROUP BY s.id
```

---

### TASK 3: Staff Selection UI (18h)

**Goal:** Display staff with "No Preference" option

**Key Deliverables:**
- Staff grid with photos (or initials fallback)
- "No Preference" card at top (shows lowest price)
- Real-time availability indicators
- Staff-specific pricing display

**Critical Architecture References:**
- MoSCoW Requirements: MUST-007 to MUST-013
- "No Preference" algorithm: Phase 1 = random, Phase 2 = least busy

**Important Note:**
Phase 1 implementation uses **random assignment** when "No Preference" selected. The "Least Busy" algorithm (MUST-011) is noted but deferred to Phase 2 for simplicity.

---

### TASK 4: Date Picker Integration (14h)

**Goal:** Calendar with UK bank holidays and restrictions

**Key Deliverables:**
- Flatpickr calendar integration
- UK date format (DD/MM/YYYY)
- Block past dates, bank holidays
- Same-day lead time enforcement (configurable)
- 365-day booking window

**Critical Architecture References:**
- MoSCoW Requirements: MUST-014 to MUST-016, MUST-021 to MUST-022
- UK bank holidays list for 2026

**Library:**
```bash
npm install flatpickr
# or CDN: https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css
```

---

### TASK 5: Time Slot Availability Algorithm (28h) 🔥

**Goal:** Calculate and display available time slots

**⚠️ MOST COMPLEX TASK IN SPRINT 1**

**Key Deliverables:**
- Availability calculation algorithm
- 15-minute time slot generation
- Working hours integration
- Existing bookings check
- Service duration + buffer calculation
- Morning/Afternoon/Evening grouping
- Auto-refresh every 30 seconds

**Critical Architecture References:**
- System_Architecture_Document_PART1, Section 6.4: Availability Algorithm
- MoSCoW Requirements: MUST-017 to MUST-020, MUST-023

**Algorithm Steps:**
1. Get service duration + buffer time
2. Get staff working hours for date
3. Get existing bookings for staff/date
4. Generate 15-minute slots within working hours
5. Remove slots overlapping with bookings
6. Remove slots that don't fit duration+buffer
7. If "No Preference", aggregate all staff availability

**Complexity Factors:**
- Time zone handling (Europe/London)
- Overlap detection logic
- Edge cases (split shifts, same-day bookings)
- Performance optimization (caching opportunities)

**Recommended Approach:**
- Start with single staff availability
- Add "No Preference" aggregation second
- Test extensively with various scenarios
- Add auto-refresh last

---

### TASK 6: Contact Form with Validation (16h)

**Goal:** Collect customer details with UK validation

**Key Deliverables:**
- Contact form (first name, last name, email, phone)
- UK phone validation (07xxx or 01xxx format)
- Email typo detection (gmial.com → gmail.com)
- Special requests textarea (500 char limit)
- GDPR marketing consent checkbox
- Client + server validation
- Booking summary display

**Critical Architecture References:**
- MoSCoW Requirements: MUST-024 to MUST-028
- GDPR compliance: Explicit opt-in required

**UK Phone Regex:**
```javascript
const ukPhoneRegex = /^(07\d{9}|01\d{9})$/;
```

**Common Email Typos to Check:**
- gmial.com → gmail.com
- gmai.com → gmail.com
- yahooo.com → yahoo.com
- hotmial.com → hotmail.com

---

### TASK 7: Session Management & Wizard Navigation (18h)

**Goal:** Robust session handling and wizard flow

**Key Deliverables:**
- Step transitions (Next/Back buttons)
- Session data persistence
- Progress indicator updates
- Step validation before progression
- Session timeout handling (8 hours)
- Clear session on completion
- URL state management (optional)

**Critical Architecture References:**
- System_Architecture_Document_PART2, Section 10.3: Session Security
- Session hijacking prevention

**Security Requirements:**
- `session_regenerate_id()` on step changes
- HttpOnly cookies
- SameSite=Strict
- CSRF protection (WordPress nonce)

---

### TASK 8: Responsive Design & Accessibility (24h)

**Goal:** WCAG 2.1 AA compliance and mobile responsiveness

**Key Deliverables:**
- Mobile-first responsive CSS (320px to 1920px)
- Keyboard navigation throughout wizard
- Screen reader compatibility
- Focus indicators (≥2px outline)
- Color contrast ≥4.5:1
- Touch targets ≥44×44px
- ARIA labels and landmarks
- Skip links
- Error announcements

**Critical Architecture References:**
- TechnicalRequirements.md: WCAG 2.1 AA requirements (NFR-4.x)
- MoSCoW Requirements: MUST-103 to MUST-110

**Testing Tools:**
- aXe DevTools browser extension
- Lighthouse (Chrome DevTools)
- NVDA screen reader (Windows) or VoiceOver (Mac)
- Manual keyboard testing

**Breakpoints:**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## TESTING STRATEGY

### Per-Task Testing (As You Go)

**For Each Task:**
1. **Unit Tests:** PHPUnit tests for PHP functions
2. **Manual Testing:** Browser verification of functionality
3. **Accessibility:** aXe scan after UI changes
4. **Responsive:** Test 320px, 768px, 1920px widths

### Integration Testing (After All Tasks)

**Complete Flow Testing:**
1. Start fresh booking (clear session)
2. Complete all 4 steps
3. Use Back button extensively
4. Verify all validations work
5. Test edge cases (no services, no staff, no availability)

**Cross-Browser:**
- Chrome 90+ (desktop + mobile)
- Firefox 88+
- Safari 14+ (Mac/iOS)
- Edge 90+

**Performance:**
- Lighthouse score ≥90
- Page load <3 seconds on 3G
- No console errors
- Time slot AJAX <500ms

---

## GIT WORKFLOW

### Branch Strategy

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b sprint-1/customer-booking-flow

# After each task
git add .
git commit -m "[Task message from prompt]"

# Push regularly
git push origin sprint-1/customer-booking-flow

# When sprint complete
git checkout develop
git merge sprint-1/customer-booking-flow
git push origin develop
```

### Commit Message Format

Use the exact format provided in each task's prompt:
```
Sprint 1, Task X: [Short description]

- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

Refs: MUST-XXX to MUST-XXX
```

---

## COMMON ISSUES ACROSS TASKS

### Issue: Session Data Not Persisting

**Symptoms:** Data lost on page refresh or step navigation

**Solutions:**
1. Verify `session_start()` called before any output
2. Check no whitespace before `<?php` in files
3. Verify session cookie settings (HttpOnly, SameSite)
4. Check server session storage (disk space, permissions)
5. Test with `var_dump($_SESSION)` to debug

### Issue: AJAX Requests Failing

**Symptoms:** 400/401/403 errors in console

**Solutions:**
1. Verify REST API routes registered (`register_rest_route`)
2. Check WordPress nonce is included in request headers
3. Verify nonce generation: `wp_localize_script()` with nonce
4. Check `permission_callback` (usually `'__return_true'` for public endpoints)
5. Test endpoint directly in browser/Postman

### Issue: Responsive Design Breaking

**Symptoms:** Layout issues on mobile or desktop

**Solutions:**
1. Use browser DevTools responsive mode
2. Check CSS Grid/Flexbox browser compatibility
3. Verify Tailwind CSS classes applied correctly
4. Test actual devices (not just DevTools)
5. Check viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Issue: Accessibility Scan Failures

**Symptoms:** aXe shows critical issues

**Solutions:**
1. Add ARIA labels to form inputs: `aria-label` or `<label>`
2. Ensure focus indicators visible: `:focus { outline: 2px solid blue; }`
3. Check color contrast: Use contrast checker tool
4. Add keyboard handlers: `tabindex`, `keydown` events
5. Verify semantic HTML: `<button>` not `<div onclick>`

---

## WHEN TO ASK FOR HELP

### Ask Sprint Implementation Assistant When:
- ❓ Task instructions unclear
- 🐛 Debugging task-level issues
- 📋 Need testing checklist clarification
- 💡 Want code example for specific feature

### Escalate to Project Assistant When:
- 🏗️ Architecture decision needed
- 📏 Scope change required
- ⏱️ Timeline adjustment needed
- 🚧 Blocker affecting sprint completion

---

## SPRINT 1 SUCCESS CRITERIA

### Functional Requirements ✅
- [ ] Customer completes all 4 steps without errors
- [ ] Service selection works (filtering, display)
- [ ] Staff selection works ("No Preference" + specific staff)
- [ ] Date picker works (blocks past dates, holidays)
- [ ] Time slots load and display correctly
- [ ] Contact form validates correctly
- [ ] Data persists in session across steps
- [ ] Back button works without data loss

### Technical Requirements ✅
- [ ] All PHP code follows WordPress Coding Standards
- [ ] All JavaScript follows ESLint rules
- [ ] No console errors in browser
- [ ] No PHP errors in debug.log
- [ ] All PHPUnit tests passing
- [ ] Lighthouse score ≥90
- [ ] Page load <3 seconds

### Accessibility Requirements ✅
- [ ] aXe scan shows 0 critical issues
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible (≥2px)
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44×44px
- [ ] Screen reader announcements work

### Responsive Design Requirements ✅
- [ ] Works on 320px width (iPhone SE)
- [ ] Works on 768px width (iPad)
- [ ] Works on 1920px width (desktop)
- [ ] Grid layouts adapt correctly
- [ ] No horizontal scrolling

---

## NEXT STEPS AFTER SPRINT 1

When Sprint 1 is complete, return to **Project Assistant chat** and report:

```markdown
## Sprint 1 Completion Report

**Status:** ✅ COMPLETE  
**Duration:** X weeks  
**Hours:** Estimated 161h, Actual Xh (X% variance)

### Completed Tasks
1. ✅ Booking Page Structure & Routing
2. ✅ Service Selection UI
3. ✅ Staff Selection UI
4. ✅ Date Picker Integration
5. ✅ Time Slot Availability Algorithm
6. ✅ Contact Form with Validation
7. ✅ Session Management & Wizard Navigation
8. ✅ Responsive Design & Accessibility

### Exit Criteria Met
- ✅ All 4 steps functional
- ✅ Session persistence working
- ✅ Validation working
- ✅ Mobile responsive
- ✅ Accessibility compliant (aXe passed)
- ✅ All tests passing

### Key Learnings
[What went well, what was challenging, workflow improvements]

### Issues Encountered
[Any blockers, how resolved]

### Ready for Sprint 2
Payment integration can begin. Database and booking flow foundation is solid.
```

---

**END OF SPRINT 1 IMPLEMENTATION PROMPT**

**Good luck, Liron! 🚀**
