Excellent — 551 tests, up from 485 at Sprint 4B end. That's +66 tests this sprint, solid coverage. On to the final task:

---

## Task 9 Cursor Prompt — Manual Testing & Polish

```
# TASK 9: Manual Testing & Polish
# Sprint 4C | Bookit Booking System
# Estimated: 4 hours

## CONTEXT

This is the final task of Sprint 4C. All features are built and
PHPUnit passes at 551 tests / 0 failures. This task is a structured
manual walkthrough of every Sprint 4C feature, followed by minor
polish fixes for anything that looks rough in the browser.

No new features. No architectural changes. Fix only what is
visually broken, functionally wrong, or inaccessible.

---

## TESTING ENVIRONMENT

Local by Flywheel: http://booking-plugin.local
Browser: Chrome (primary), Firefox (secondary)
Logged in as: admin user (bookit_admin role)
Also test as: staff user (for permission boundary checks)

---

## MANUAL TESTING CHECKLIST

Work through each section in order. Fix issues as you find them.
Note what you fixed in the git commit message.

---

### 1. TEAM CALENDAR

**Day view**
- [ ] Navigate to Team Calendar → Day view loads
- [ ] Today's date is selected by default
- [ ] Navigation arrows move forward/back one day
- [ ] "Today" button returns to current date
- [ ] Bookings appear in correct time slots
- [ ] Each booking card shows: customer name, service, status dot
- [ ] Hovering a card shows tooltip with full details
- [ ] Clicking a booking card opens booking detail (or navigates
      to booking — whichever was implemented)
- [ ] Staff filter dropdown works — selecting a staff member
      filters the view to show only their bookings
- [ ] Empty state is clean when no bookings exist for a day

**Week view**
- [ ] Week view shows Mon–Sun correctly
- [ ] Cross-month week label shows correctly
      e.g. "24 Feb – 2 Mar 2026" not "24–2 February 2026"
- [ ] Booking cards show customer + status dot + service name
      (not cut off)
- [ ] Cards under ~60px tall collapse to show only customer name
- [ ] Staff filter works in week view

**Month view**
- [ ] Month view shows correct number of days for the month
- [ ] Each day cell shows booking count badge if bookings exist
- [ ] Clicking a day cell navigates to day view for that date
- [ ] Day/Week/Month toggle switches views correctly
- [ ] Current day is visually highlighted
- [ ] Month navigation moves correctly

**Admin section collapsible**
- [ ] ADMIN section in sidebar is collapsed by default
- [ ] Clicking ADMIN expands to show Team Calendar + Setup Guide
- [ ] Collapse state persists on page refresh
- [ ] Auto-expands when navigating directly to Team Calendar

---

### 2. SETUP GUIDE

**First-time appearance**
- [ ] Log out, log back in as admin with fresh status (pending)
      → Setup Guide overlay appears automatically
- [ ] Overlay does NOT appear when logged in as staff

**Overlay controls**
- [ ] × Dismiss triggers inline confirmation (not browser confirm)
- [ ] Confirming dismiss closes overlay, status → dismissed
- [ ] After dismissing, overlay does NOT reappear on next login
- [ ] Clicking 🧭 Setup Guide in sidebar reopens overlay
      even after dismissal
- [ ] Escape key triggers dismiss confirmation

**Step 1 — Add Service**
- [ ] If no services: service form renders inside overlay
- [ ] If services exist: green banner with count, no form
- [ ] Saving a service advances to Step 2 automatically
- [ ] Skip advances to Step 2

**Step 2 — Availability**
- [ ] Weekly schedule renders with Mon–Fri ON defaults
- [ ] Toggling a day ON shows time selectors
- [ ] Save posts to staff hours endpoint
- [ ] Skip advances to Step 3

**Step 3 — Payments**
- [ ] Stripe card shows correct connected/not connected status
- [ ] "Set up in Settings →" opens in new tab
- [ ] Continue advances to Step 4

**Step 4 — Go Live**
- [ ] Summary shows ✓/✗ based on completed steps
- [ ] Copy link button works and shows "Copied!" feedback
- [ ] "Go to Dashboard" calls markComplete and closes overlay
- [ ] After completing, overlay does not reappear on next login

**Progress indicator**
- [ ] Active step: filled primary colour
- [ ] Completed steps: green ✓
- [ ] Clicking a completed step navigates back to it

---

### 3. CANCELLATION POLICY SETTINGS

- [ ] Navigate to Settings → Cancellation Policy
- [ ] All fields load with correct defaults
- [ ] Changing window dropdown updates live preview immediately
- [ ] Selecting "Partial refund" shows slider
- [ ] Slider updates percentage label in real time
- [ ] Strict policy warning appears when all three = "none"
- [ ] Warning disappears when one refund type changes
- [ ] Save shows success toast
- [ ] Refresh page → saved values persist
- [ ] Sidebar link "Cancellation Policy" visible for admin,
      not visible for staff

---

### 4. 14-DAY COOLING-OFF WAIVER

- [ ] On the public booking page, book with a date within 14 days
      → waiver checkbox appears on Step 4 (contact form)
- [ ] Trying to submit without checking → validation error,
      form does not advance
- [ ] Checking the box → form submits normally
- [ ] Book with a date 15+ days away → no waiver checkbox
- [ ] Amber legal notice box is visually distinct and readable
- [ ] Waiver checkbox label text matches the legal wording exactly

---

### 5. PAYMENT SETTINGS

- [ ] Navigate to Settings → Payments
- [ ] Stripe section shows "Not configured" initially
- [ ] Enter a test publishable key (pk_test_...) → save
      → "Connected" badge appears
- [ ] Secret key field shows masked placeholder after save
      (not the actual value)
- [ ] Show/hide toggle on secret key field works
- [ ] Leaving secret key blank on re-save preserves existing key
      (verify: save again without touching the field → still shows
      as Connected)
- [ ] Test mode toggle saves correctly
- [ ] Pay on Arrival toggle saves correctly
- [ ] Sidebar link "Payments" visible for admin only
- [ ] "Payments" is first item in SETTINGS section

---

### 6. DEPOSIT SETTINGS

- [ ] Navigate to Settings → Deposits
- [ ] All fields load with correct defaults
- [ ] Toggle "Require deposit by default" ON → shows type/amount
- [ ] Switching percentage/fixed shows correct input
- [ ] Slider moves and updates live label
- [ ] Min > max shows inline validation error
- [ ] Save works, values persist on refresh
- [ ] Live preview updates reactively
- [ ] Sidebar link "Deposits" visible for admin only,
      positioned after "Payments"

---

### 7. DEPOSIT DISPLAY AT CHECKOUT (Fix 5A)

Test with a service that has a percentage deposit configured:
- [ ] Go through the public booking wizard to Step 5
- [ ] "Due today (deposit): £X" row is visible and correct
- [ ] "Due on arrival: £Y" row is visible and correct
- [ ] "Total: £Z" row shows full service price
- [ ] Deposit notice paragraph visible below summary
- [ ] Selecting Pay on Arrival hides deposit/balance rows,
      updates POA description correctly

Test with a service that has NO deposit:
- [ ] Only "Total due today: £X" row shown
- [ ] No deposit or balance rows visible

---

### 8. CANCELLATION POLICY AT CHECKOUT (Fix 5B)

- [ ] Go through booking wizard to Step 5 (payment step)
- [ ] Cancellation policy notice visible above the action buttons
- [ ] Policy text matches what is saved in Settings →
      Cancellation Policy
- [ ] Style is clean and readable (blue-grey left-accent box)
- [ ] Complete a test booking (Pay on Arrival)
- [ ] Check confirmation email → policy section present
- [ ] Policy text in email matches Settings value

---

### 9. SETTINGS SIDEBAR AUDIT

Verify the complete SETTINGS section order and visibility:

Admin user should see:
  SETTINGS (collapsible)
    💳 Payments
    💰 Deposits
    🚫 Cancellation Policy
    [existing settings links from previous sprints]

Staff user should see:
  SETTINGS (collapsible — if visible at all)
    [only non-admin links, if any]

- [ ] All three new links visible for admin
- [ ] None visible for staff
- [ ] All links navigate to correct pages
- [ ] Active state highlights correctly for each

---

## POLISH FIXES

While testing, fix any of the following if encountered:

**Visual issues to fix:**
- Misaligned elements in the calendar (cards overflowing cells)
- Truncated text that should wrap or use ellipsis
- Missing loading spinners on slow operations
- Toast notifications overlapping other UI elements
- Mobile layout breakages (test at 375px width in DevTools)

**Accessibility quick-wins (fix if found):**
- Missing aria-label on icon-only buttons
- Form fields without associated labels
- Error messages not announced to screen readers
  (missing role="alert" or aria-live)
- Focus not moving to overlay when Setup Guide opens
  (should trap focus inside the overlay)

**Do NOT fix during this task:**
- Anything requiring new API endpoints
- Anything requiring schema changes
- Performance optimisation
- Features not in Sprint 4C scope

---

## GIT COMMIT

If no polish fixes needed:
  Sprint 4C Task 9: Manual testing complete — no fixes needed

If fixes were made:
  Sprint 4C Task 9: Manual testing and polish

  Fixes applied:
  - [list each fix with the file changed]

  All manual tests passing.
  551 tests, 1748 assertions, 0 failures.
```

---

Once Task 9 is done, come back and give me a brief summary of what (if anything) needed fixing — then we'll write the Sprint 4C completion report and update progress.md before moving on to Sprint 4D.