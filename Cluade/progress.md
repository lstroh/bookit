Sprints 0 +1 completed.
## SPRINT 2: Payment Integration & Session Security (Weeks 8-12)
**Status:** 🟡 IN PROGRESS
**Duration:** February 2026
**Estimated Hours:** 150
**Actual Hours:** ~35 (so far)

### Week 1: Session Security & Foundation
- [x] Task 1: Session Security & CSRF Protection (18h → ~18h) ✅ Feb 3
  - Session timeout, HTTPS cookies, CSRF protection
  - Session cleanup cron job
  - All manual tests passed

### Week 2: Stripe Integration (In Progress)
- [x] Task 2: Stripe SDK Setup & Configuration (4h → ~5h) ✅ Feb 3
  - Stripe SDK installed via Composer
  - Admin settings page created
  - Test API keys configurable
  - 12 unit tests passing

- [x] Task 3: Stripe Checkout Session Creation (12h → ~12h) ✅ Feb 3
  - Payment selection page (Step 5) created
  - Stripe Checkout Session class
  - Deposit calculation (full/percentage/fixed)
  - Edge case handling
  - 21 unit tests passing
  - Browser testing postponed

- [ ] Task 4: Stripe Webhook Endpoint (12h) 🔄 NEXT
- [ ] Task 5: Payment Success Handling (8h)
- [ ] Task 6: Idempotency Keys (4h)
- [ ] Task 7: Stripe Refund API (8h)
- [ ] Task 8: Test Mode Configuration (4h)

### Week 3: PayPal Integration
- [ ] Task 9: PayPal SDK & Checkout Flow (20h)
- [ ] Task 10: PayPal Webhook & Refunds (16h)

### Week 4-5: Booking Creation & Error Handling
- [ ] Task 11: Atomic Booking Creation (8h)
- [ ] Task 12: Race Condition Handling (8h)
- [ ] Task 13: Pay-on-Arrival Implementation (4h)
- [ ] Task 14: Deposit Calculation (3h) - Partially done in Task 3
- [ ] Task 15: Booking Confirmation Page Enhancement (6h)
- [ ] Task 16: Payment Failure Handling (6h)

**Progress:** 3/16 tasks complete (19%)



Update 04/02/06
## SPRINT 2: Payment Integration & Session Security (Weeks 8-12)
**Status:** 🟡 IN PROGRESS
**Duration:** February 2026
**Estimated Hours:** 150
**Actual Hours:** ~47 (so far)

### Week 1: Session Security & Foundation
- [x] Task 1: Session Security & CSRF Protection (18h → 18h) ✅ Feb 3

### Week 2: Stripe Integration (In Progress)
- [x] Task 2: Stripe SDK Setup & Configuration (4h → 5h) ✅ Feb 3
- [x] Task 3: Stripe Checkout Session Creation (12h → 12h) ✅ Feb 3
- [x] Task 4: Stripe Webhook Endpoint (12h → 12h) ✅ Feb 3
  - REST API endpoint with signature verification
  - Booking and customer creation from payment data
  - End time calculation and conflict detection
  - Idempotency prevents duplicate bookings
  - 18 unit tests passing

- [ ] Task 5: Payment Success Handling (8h) 🔄 NEXT
- [ ] Task 6: Idempotency Keys (4h)
- [ ] Task 7: Stripe Refund API (8h)
- [ ] Task 8: Test Mode Configuration (4h)

### Week 3: PayPal Integration
- [ ] Task 9-10: PayPal Integration (36h)

### Week 4-5: Booking Creation & Error Handling
- [ ] Task 11-16: Remaining tasks (35h)

**Progress:** 4/16 tasks complete (25%)
**Sprint Health:** 🟢 On Track


Update 05/02/2026
## SPRINT 2: Payment Integration & Session Security (Weeks 8-12)
**Status:** 🟡 IN PROGRESS
**Duration:** February 2026
**Estimated Hours:** 150
**Actual Hours:** ~55 (so far)

### Week 1: Session Security & Foundation
- [x] Task 1: Session Security & CSRF Protection (18h) ✅ Feb 3

### Week 2: Stripe Integration (In Progress)
- [x] Task 2: Stripe SDK Setup & Configuration (5h) ✅ Feb 3
- [x] Task 3: Stripe Checkout Session Creation (12h) ✅ Feb 3
- [x] Task 4: Stripe Webhook Endpoint (12h) ✅ Feb 3
- [x] Task 5: Payment Success Handling (8h) ✅ Feb 3
  - Booking retriever with database JOINs
  - HTML confirmation emails (customer + business)
  - Booking confirmation page
  - Session cleanup
  - 14 unit tests passing
  - Browser tested successfully

- [ ] Task 6: Idempotency Keys (4h) 🔄 NEXT
- [ ] Task 7: Stripe Refund API (8h)
- [ ] Task 8: Test Mode Configuration (4h)

### Week 3: PayPal Integration
- [ ] Task 9-10: PayPal Integration (36h)

### Week 4-5: Booking Creation & Error Handling
- [ ] Task 11-16: Remaining tasks (35h)

**Progress:** 5/16 tasks complete (31%)
**Sprint Health:** 🟢 On Track

Update 06/02/26:
## SPRINT 2: Payment Integration & Session Security (Weeks 8-12)
**Status:** 🟡 IN PROGRESS
**Duration:** February 2026
**Estimated Hours:** 150
**Actual Hours:** ~67 (so far)

### Week 1: Session Security & Foundation
- [x] Task 1: Session Security & CSRF Protection (18h → 18h) ✅ Feb 3
  - Session timeout (30 minutes inactive)
  - HTTPS-only cookies, HttpOnly, SameSite=Lax
  - CSRF protection on all booking forms
  - Session cleanup cron job (24h+ abandoned)
  - Session fixation prevention
  - All manual and automated tests passing

### Week 2: Stripe Integration (In Progress)
- [x] Task 2: Stripe SDK Setup & Configuration (4h → 5h) ✅ Feb 3
  - Stripe SDK installed via Composer (v13.0)
  - Admin settings page for API keys
  - Test mode toggle with key configuration
  - Secure storage of API keys in WordPress options
  - Webhook secret configuration
  - 12 unit tests passing

- [x] Task 3: Stripe Checkout Session Creation (12h → 12h) ✅ Feb 3
  - Payment method selection page (Step 5)
  - Stripe Checkout Session class
  - Deposit calculation (full/percentage/fixed)
  - Comprehensive edge case handling:
    - Zero/negative prices rejected
    - NULL deposit configs default to full payment
    - Invalid percentages clamped to 0-100
    - Fixed deposits capped at service price
    - Decimal rounding to 2 places
  - Session field mapping (date/time → booking_date/booking_time)
  - Updated column references (base_price → price)
  - 21 unit tests passing (15 original + 6 edge cases)
  - Browser testing postponed until live environment

- [x] Task 4: Stripe Webhook Endpoint (12h → 12h) ✅ Feb 3
  - REST API endpoint (/bookit/v1/stripe/webhook)
  - Stripe signature verification with test mode bypass
  - Event handling: checkout.session.completed
  - Booking Creator class:
    - Customer creation/lookup (reuses existing by email)
    - Booking creation with payment metadata
    - End time calculation from service duration
    - Double-booking prevention (time conflict detection)
  - Idempotency using WordPress transients (24h TTL)
  - Added get_webhook_secret() to Stripe Config
  - Comprehensive error logging throughout
  - 18 unit tests passing (100%)
  - Webhooks can receive payment confirmation and create bookings

- [x] Task 5: Payment Success Handling (8h → 8h) ✅ Feb 3
  - Booking Retriever class
    - Retrieves booking by Stripe session ID with JOINs
    - Includes customer, service, and staff details
    - Date/time formatting helpers
    - Session cleanup functionality
  - Email Sender class
    - Customer confirmation email (HTML formatted)
    - Business notification email
    - Payment summary in emails
    - Test mode bypass for unit tests
    - Comprehensive error logging
  - Booking confirmation page
    - Displays all booking details after payment
    - Shows payment summary (total, paid, balance)
    - Handles missing bookings gracefully
    - Email idempotency (sends once only)
    - Clears booking wizard session
    - Professional UI with success icon
  - Updated database schema:
    - Added payment_intent_id column
    - Changed deposit_paid to DECIMAL (was boolean)
    - Renamed customer_notes to special_requests
    - Added balance_due column
  - 14 unit tests passing (100%)
  - Browser tested: Confirmation page displays correctly

- [x] Task 6: Enhanced Idempotency Keys (4h → 4h) ✅ Feb 3
  - Created Idempotency Handler class
    - Database-backed tracking (wp_bookings_idempotency table)
    - SHA256 hash for duplicate detection
    - Handles concurrent requests safely
    - 24-hour expiry with 30-day cleanup
    - Supports operation retry for failures
  - Integrated into Stripe Checkout
    - Prevents duplicate checkout sessions
    - Returns cached session ID for duplicates
    - Tracks failed operations for retry
  - Created idempotency table migration
    - Unique idempotency_key constraint
    - Status tracking (processing/completed/failed)
    - Indexed for fast lookups and cleanup
  - Added daily cleanup cron job
    - Removes records older than 30 days
    - Registers on activation, clears on deactivation
  - 12 unit tests passing (100%)
  - All existing Sprint 2 tests still passing

- [ ] Task 13: Pay on Arrival (4h) 🔄 NEXT
- [ ] Task 7: Stripe Refund API (8h)
- [ ] Task 8: Test Mode Configuration (4h)

### Week 3: PayPal Integration (Postponed)
- [ ] Task 9: PayPal SDK & Checkout Flow (20h)
- [ ] Task 10: PayPal Webhook & Refunds (16h)

### Week 4-5: Booking Creation & Error Handling (Postponed)
- [ ] Task 11: Atomic Booking Creation (8h)
- [ ] Task 12: Race Condition Handling (8h)
- [ ] Task 14: Deposit Calculation (3h) - Partially complete in Task 3
- [ ] Task 15: Booking Confirmation Page Enhancement (6h)
- [ ] Task 16: Payment Failure Handling (6h)

---

## Sprint 2 Progress Summary

**Tasks Complete:** 6/16 (38%)  
**Hours Spent:** 67/150 (45%)  
**Status:** 🟢 Ahead of Schedule

**Completed Features:**
- ✅ Session security & CSRF protection
- ✅ Stripe SDK & admin configuration
- ✅ Stripe Checkout Session creation with edge cases
- ✅ Stripe webhook handling & booking creation
- ✅ Payment success confirmation page & emails
- ✅ Database-backed idempotency system

**Current Focus:**
- 🔄 Task 13: Pay on Arrival (completing basic payment options)

**Postponed Until Live Environment:**
- ⏸️ Browser testing for Stripe payments (Tasks 3-5)
- ⏸️ PayPal integration (Tasks 9-10)
- ⏸️ Refund processing (Task 7)
- ⏸️ Advanced error handling (Tasks 15-16)

**Decision Rationale:**
Tasks 6 and 13 complete the core payment functionality (Stripe + Pay on Arrival) with production-grade idempotency. Remaining tasks (PayPal, refunds, error handling) are better tested with a live development environment.

**Next Milestone:**
After Task 13, Sprint 2 core functionality will be complete. Can pause here and move to Sprint 3 (Business Owner Dashboard) or continue with remaining payment features.

---

## Overall Project Progress

**Sprints Complete:** 0/6 (Sprint 2 is 38% complete)  
**Total Estimated Hours:** ~1,000 (across all sprints)  
**Hours Spent So Far:** ~67 hours  
**Current Sprint:** Sprint 2 (Week 2 of 5)  
**Overall Status:** 🟢 On Track

**Key Achievements to Date:**
- ✅ Complete customer booking flow (Steps 1-4)
- ✅ Stripe payment integration (checkout + webhook)
- ✅ Booking confirmation system (page + emails)
- ✅ Production-grade idempotency
- ✅ Database schema aligned with requirements
- ✅ Comprehensive test coverage (77 unit tests passing)

**Next Major Milestone:**
Complete Pay on Arrival (Task 13), then decide:
1. Continue Sprint 2 (PayPal, refunds, error handling)
2. Move to Sprint 3 (Business Owner Dashboard)
3. Move to Sprint 4 (Notifications & Communications)

Update 08/02/26:
- [x] Task 13: Pay on Arrival (4h → 4h) ✅ Feb 8
  - Pay on Arrival payment option enabled
  - Booking created immediately without payment
  - Status = 'pending_payment' for unpaid bookings
  - Confirmation page supports booking_id parameter
  - Email templates show payment due notice
  - Availability algorithm excludes pending_payment bookings
  - Error handling displays messages to users
  - Fixed memory exhaustion from infinite loop
  - 10 unit tests passing (100%)
  - Browser tested: Full flow working correctly

**Progress:** 7/16 tasks complete (44%)
**Hours Spent:** 71/150 (47%)



Update 09/02/26
git add .

git commit -m "Sprint 3, Task 3: Today's Schedule Widget with Real Data

Implemented dashboard endpoint and Vue component for displaying today's bookings:

Backend API:
- New REST endpoint: GET /wp-json/bookit/v1/dashboard/bookings/today
- Role-based filtering (admin sees all, staff sees only theirs)
- Database query with JOINs across bookings/customers/services/staff tables
- Mark complete endpoint: POST /dashboard/bookings/{id}/complete
- Permission checks prevent staff from completing others' bookings

Frontend Dashboard:
- Updated Dashboard.vue to fetch and display real booking data
- Status badges with color coding (confirmed/pending/completed/cancelled)
- 'Starting Soon' indicator for bookings within 15 minutes
- 'Overdue' indicator for past bookings still not completed
- Payment status display (paid/partial/pay on arrival)
- Quick actions: View Details (placeholder) and Mark Complete
- Loading, error, and empty state handling

Features:
- 24-hour time format (14:30) for UK standard
- Special requests displayed in italics
- Customer and staff names from database JOINs
- Booking duration and pricing information
- Real-time status updates after marking complete

API Controller:
- Class: Bookit_Dashboard_Bookings_API
- File: includes/api/class-dashboard-bookings-api.php
- Session-based authentication via Bookit_Auth
- Proper error handling and validation

Manual Testing Completed:
- Admin role: verified sees all bookings (5 bookings)
- Staff role: verified sees only own bookings (2 bookings)
- Mark complete: verified database updates status and timestamp
- Status badges: verified correct colors and labels
- Edge cases: empty state, error state, overdue bookings tested

Database verified: status changes persist, updated_at timestamps correct.

Files: 10h estimated (Task 3 of 11)
Refs: MUST-075 (Today's Schedule View), MUST-087 (Role-Based Filtering)"
```

---

## 📊 SPRINT 3 PROGRESS UPDATE

After committing:
```
Sprint 3 Progress: 2/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
⏭️ Task 4: Bookings List View (12h) - NEXT
□  Task 5: Manual Booking Creation (12h)
□  Task 6: Edit Booking Modal (10h)
□  Task 7: Services CRUD Interface (10h)
□  Task 8: Service Categories Management (6h)
□  Task 9: Staff CRUD Interface (10h)
□  Task 10: Staff Working Hours Configuration (12h)
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 24 / 104
Tasks Completed: 2 / 11 (18%)
Current Velocity: On track! 🎯

Update 10/02/26
Sprint 3 Progress: 3/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
⏭️ Task 5: Manual Booking Creation (12h) - NEXT
□  Task 6: Edit Booking Modal (10h)
□  Task 7: Services CRUD Interface (10h)
□  Task 8: Service Categories Management (6h)
□  Task 9: Staff CRUD Interface (10h)
□  Task 10: Staff Working Hours Configuration (12h)
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 36 / 104 (35%)
Tasks Completed: 3 / 11 (27%)
Current Velocity: Slightly ahead! 🚀

Update 11/02/26
Sprint 3 Progress: 3.5/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
🔄 Task 5: Manual Booking Creation (12h) - 50% COMPLETE
   ✅ Part A: Backend API (3-4h) - COMPLETE
   ✅ Part B: Customer Selection (3-4h) - COMPLETE
   ⏭️ Part C: Booking Wizard (5-6h) - NEXT
□  Task 6: Edit Booking Modal (10h)
□  Task 7: Services CRUD Interface (10h)
□  Task 8: Service Categories Management (6h)
□  Task 9: Staff CRUD Interface (10h)
□  Task 10: Staff Working Hours Configuration (12h)
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 42 / 104 (40%)
Tasks Completed: 3.5 / 11 (32%)
Current Velocity: Excellent progress!


Update 12/02/26
Sprint 3 Progress: 4/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
✅ Task 5: Manual Booking Creation (12h) - COMPLETE ⭐ COMPLEX
⏭️ Task 6: Edit Booking Modal (10h) - NEXT
□  Task 7: Services CRUD Interface (10h)
□  Task 8: Service Categories Management (6h)
□  Task 9: Staff CRUD Interface (10h)
□  Task 10: Staff Working Hours Configuration (12h) 🔥 COMPLEX
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 48 / 104 (46%)
Tasks Completed: 4 / 11 (36%)
Current Velocity: Excellent! You've completed the most complex task! 🎉

Update 15/02/26
Sprint 3 Progress: 6/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
✅ Task 5: Manual Booking Creation (12h) - COMPLETE 🔥 COMPLEX
✅ Task 6: Edit Booking Modal (10h) - COMPLETE
✅ Task 7: Services CRUD Interface (10h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 8: Service Categories Management (6h) - NEXT
□  Task 9: Staff CRUD Interface (10h)
□  Task 10: Staff Working Hours Configuration (12h) 🔥 COMPLEX
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 68 / 104 (65%)
Tasks Completed: 6 / 11 (55%)
Current Velocity: Over halfway! Excellent progress! 🚀


Sprint 3 Progress: 7/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
✅ Task 5: Manual Booking Creation (12h) - COMPLETE 🔥 COMPLEX
✅ Task 6: Edit Booking Modal (10h) - COMPLETE
✅ Task 7: Services CRUD Interface (10h) - COMPLETE
✅ Task 8: Service Categories Management (6h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 9: Staff CRUD Interface (10h) - NEXT
□  Task 10: Staff Working Hours Configuration (12h) 🔥 COMPLEX
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 74 / 104 (71%)
Tasks Completed: 7 / 11 (64%)
Current Velocity: Over 2/3 complete! Sprint 3 nearly done! 🎉

Update 16/02/26
**Completed:**
- Backend API: Staff list, create, update, delete with service assignments
- Frontend: Staff list page with photo display, service count, working hours status
- Staff form modal with all profile fields
- Service assignment with custom pricing per staff member
- Photo upload via WordPress Media Library
- **Password Reset Feature:** Admin can reset any staff member's password
  - Generate secure random passwords
  - Optional email notification to staff
  - Minimum 8 character validation
- **First Admin Creation:** One-time setup page for creating initial admin user (just added)

**Enhancements Added:**
- WordPress media library integration for staff photos
- Fallback to colored initials if no photo uploaded
- Password reset functionality (admin-initiated)
- Generate secure random passwords
- Email new password to staff member (optional)

**Deferred to Later Tasks:**
- Self-service password reset (Phase 2)
- My Profile page for staff to change own password (Task 11)
- Email template customization (Task 11)


Update 17/02/26
Sprint 3 Progress: 8/11 tasks complete

✅ Task 1:  Vue 3 Setup (14h) - COMPLETE
✅ Task 3:  Today's Schedule (10h) - COMPLETE
✅ Task 4:  Bookings List (12h) - COMPLETE
✅ Task 5:  Manual Booking (12h) - COMPLETE 🔥
✅ Task 6:  Edit Booking (10h) - COMPLETE
✅ Task 7:  Services CRUD (10h) - COMPLETE
✅ Task 8:  Categories (6h) - COMPLETE
✅ Task 9:  Staff CRUD (10.5h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 10: Working Hours (12h) - NEXT 🔥 COMPLEX
□  Task 11: Settings Pages (10h)
□  Task 12: Dashboard Polish (10h)

Hours Completed: 84.5 / 104 (81%)
Tasks Completed: 8 / 11 (73%)
Remaining: 3 tasks, ~32 hours


update 18/02/26
Sprint 3 Progress: 9/11 tasks complete

✅ Task 1:  Vue 3 Setup (14h) - COMPLETE
✅ Task 3:  Today's Schedule (10h) - COMPLETE
✅ Task 4:  Bookings List (12h) - COMPLETE
✅ Task 5:  Manual Booking (12h) - COMPLETE
✅ Task 6:  Edit Booking (10h) - COMPLETE
✅ Task 7:  Services CRUD (10h) - COMPLETE
✅ Task 8:  Categories (6h) - COMPLETE
✅ Task 9: Staff CRUD (10.5h) - COMPLETE
✅ Task 10: Working Hours (12h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 11: Settings Pages (10h) - NEXT
🆕 Task 11.5: Bulk Working Hours (4-5h) - AFTER TASK 11
□  Task 12: Dashboard Polish (10h)

Hours Completed: 96.5 / 113.5 (85%)
Tasks Completed: 9 / 12 (75%)

Update 18/02/26
Sprint 3 Progress: 9/11 tasks complete

✅ Task 1: Vue 3 Setup & Dashboard Foundation (14h) - COMPLETE
✅ Task 3: Today's Schedule Widget (10h) - COMPLETE
✅ Task 4: Bookings List View (12h) - COMPLETE
✅ Task 5: Manual Booking Creation (12h) - COMPLETE 🔥 COMPLEX
✅ Task 6: Edit Booking Modal (10h) - COMPLETE
✅ Task 7: Services CRUD Interface (10h) - COMPLETE
✅ Task 8: Service Categories Management (6h) - COMPLETE
✅ Task 9: Staff CRUD Interface (10.5h) - COMPLETE
✅ Task 10: Staff Working Hours Configuration (12h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 11: Settings Pages (10h) - NEXT
🆕 Task 11.5: Bulk Working Hours (4-5h) - AFTER TASK 11
□  Task 12: Dashboard Polish & Mobile (10h)

Hours Completed: 96.5 / 113.5 (85%)
Tasks Completed: 9 / 12 (75%)
Current Velocity: Exceptional! Nearly complete! 🚀

Task 10 Highlights:
- Weekly recurring schedules with ISO-8601 day numbering
- Break time configuration (split shifts)
- Seasonal schedules (valid_from/valid_until)
- Date exceptions (override weekly patterns)
- Comprehensive tooltips for all options
- No changes to datetime model (perfect integration)
- All slot generation tests passing

Sprint 3 Progress: 10/12 tasks complete

✅ Task 1:  Vue 3 Setup (14h) - COMPLETE
✅ Task 3:  Today's Schedule (10h) - COMPLETE
✅ Task 4:  Bookings List (12h) - COMPLETE
✅ Task 5:  Manual Booking (12h) - COMPLETE
✅ Task 6:  Edit Booking (10h) - COMPLETE
✅ Task 7:  Services CRUD (10h) - COMPLETE
✅ Task 8:  Categories (6h) - COMPLETE
✅ Task 9:  Staff CRUD (10.5h) - COMPLETE
✅ Task 10: Working Hours (12h) - COMPLETE
✅ Task 11: Settings Pages (10h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 11.5: Bulk Working Hours (4-5h) - NEXT
□  Task 12: Dashboard Polish (10h)

Hours Completed: 106.5 / 113.5 (94%)
Tasks Completed: 10 / 12 (83%)
Remaining: ~7 hours

Sprint 3 Progress: 11/12 tasks complete

✅ Task 1:  Vue 3 Setup (14h) - COMPLETE
✅ Task 3:  Today's Schedule (10h) - COMPLETE
✅ Task 4:  Bookings List (12h) - COMPLETE
✅ Task 5:  Manual Booking (12h) - COMPLETE
✅ Task 6:  Edit Booking (10h) - COMPLETE
✅ Task 7:  Services CRUD (10h) - COMPLETE
✅ Task 8:  Categories (6h) - COMPLETE
✅ Task 9:  Staff CRUD (10.5h) - COMPLETE
✅ Task 10: Working Hours (12h) - COMPLETE
✅ Task 11: Settings Pages (10h) - COMPLETE
✅ Task 11.5: Bulk Working Hours (5h) - COMPLETE ⭐ JUST FINISHED
⏭️ Task 12: Dashboard Polish (10h) - FINAL TASK

Hours Completed: 111.5 / 121.5 (92%)
Tasks Completed: 11 / 12 (92%)

Task 11.5 Highlights:
- Bulk add exceptions to multiple staff
- Bulk update schedules for multiple staff  
- Conflict detection and resolution UI
- Real-time time/date validation
- Preview before apply with conflict indicators
- Staff selection with avatars
- Success messages with detailed counts


Update 20/02/26:
# Bookit Booking System - Development Progress

## Current Status: Sprint 3 COMPLETE ✓

**Phase:** 1 (MVP)
**Sprint:** 3 of 6 (COMPLETE)
**Total Hours:** 120h / 113.5h estimated (106%)
**Completion:** 100%

---

## Sprint 3: Vue Dashboard (COMPLETE) ✓

**Duration:** 120 hours
**Status:** COMPLETE ✓

### Tasks Completed:

✅ **Task 1:** Vue 3 Setup & Authentication (14h)
✅ **Task 3:** Today's Schedule View (10h)
✅ **Task 4:** Bookings List with Filters (12h)
✅ **Task 5:** Manual Booking Creation (12h)
✅ **Task 6:** Edit Booking Functionality (10h)
✅ **Task 7:** Services CRUD Operations (10h)
✅ **Task 8:** Categories Management (6h)
✅ **Task 9:** Staff CRUD Operations (10.5h)
✅ **Task 10:** Staff Working Hours Configuration (12h)
✅ **Task 11:** Settings Pages (Profile, Email, Templates) (10h)
✅ **Task 11.5:** Bulk Working Hours Operations (5h)
✅ **Task 12:** Dashboard Polish & Accessibility (10h)
  - Part A: Responsive Design (Phases 1-3)
  - Part B: Accessibility, Loading States, Polish (Phases 1-3)
✅ **Drag & Drop Ordering:** Services, Categories, Staff (2h)

### Key Deliverables:

**Pages (13 total):**
1. Today's Schedule
2. Bookings List
3. Manual Booking
4. Edit Booking
5. Services
6. Categories
7. Staff List
8. Staff Working Hours
9. Bulk Working Hours
10. My Profile
11. Email Configuration
12. Email Templates
13. Dashboard Layout

**Features:**
- Complete CRUD for Bookings, Staff, Services, Categories
- Working hours with exceptions and bulk operations
- Drag & drop ordering (Services, Categories, Staff)
- Email configuration with SMTP
- Email templates with variable substitution
- Responsive design (mobile/tablet/desktop)
- Accessibility (WCAG 2.1 AA)
- Loading/empty/error states
- Toast notifications
- Smooth transitions

**Technology:**
- Vue 3 (Composition API)
- Vue Router (lazy loading)
- Tailwind CSS
- Sortable.js
- Axios
- NProgress

---

## Next: Sprint 4-6

**Sprint 4:** Email Notifications & Magic Links
**Sprint 5:** Customer Management & Testing
**Sprint 6:** Final Polish & Launch Prep

---

## Phase 1 Progress: 33% Complete

**Sprints Completed:** 3/9
**Hours Completed:** ~270h / 768-900h estimated
**Status:** ON TRACK

Sprint 1: ✅ Database & Backend Foundation (85h)
Sprint 2: ✅ Public Booking Page (65h)
Sprint 3: ✅ Vue Dashboard (120h)
Sprint 4: ⏭️ Email Notifications (pending)
Sprint 5: ⏭️ Customer Management (pending)
Sprint 6: ⏭️ Testing & QA (pending)
Sprint 7: ⏭️ Google Calendar (pending)
Sprint 8: ⏭️ Payment Processing (pending)
Sprint 9: ⏭️ Final Launch Prep (pending)

Update 20/02/26:
# Bookit Booking System - Development Progress

## Current Status: Sprint 3 COMPLETE ✓ (Including Tests!)

**Phase:** 1 (MVP)
**Sprint:** 3 of 9 (COMPLETE with full test coverage)
**Total Hours:** 152h (120h dev + 32h tests)
**Completion:** 100%

---

## Sprint 3: Vue Dashboard + Tests (COMPLETE) ✓

**Duration:** 152 hours (120h dev + 32h tests)
**Status:** COMPLETE ✓

### Development Tasks (120h):

✅ **Task 1:** Vue 3 Setup & Authentication (14h)
✅ **Task 3:** Today's Schedule View (10h)
✅ **Task 4:** Bookings List with Filters (12h)
✅ **Task 5:** Manual Booking Creation (12h)
✅ **Task 6:** Edit Booking Functionality (10h)
✅ **Task 7:** Services CRUD Operations (10h)
✅ **Task 8:** Categories Management (6h)
✅ **Task 9:** Staff CRUD Operations (10.5h)
✅ **Task 10:** Staff Working Hours Configuration (12h)
✅ **Task 11:** Settings Pages (Profile, Email, Templates) (10h)
✅ **Task 11.5:** Bulk Working Hours Operations (5h)
✅ **Task 12:** Dashboard Polish & Accessibility (10h)
✅ **Drag & Drop Ordering:** Services, Categories, Staff (2h)

### Testing Tasks (32h): ⭐ NEW

✅ **Phase 2:** Dashboard Bookings API Tests (12h)
✅ **Phase 3:** Bulk Working Hours API Tests (11h)
✅ **Phase 4:** Settings, Profile & Reorder Tests (9h)

**Test Coverage:**
- 6 new test files created
- 50+ test methods
- 80%+ code coverage for Sprint 3
- All success/error cases
- All edge cases
- All permission checks
- All validation

### Key Deliverables:

**Pages (13 total):**
1. Today's Schedule
2. Bookings List
3. Manual Booking
4. Edit Booking
5. Services
6. Categories
7. Staff List
8. Staff Working Hours
9. Bulk Working Hours
10. My Profile
11. Email Configuration
12. Email Templates
13. Dashboard Layout

**Features:**
- Complete CRUD for Bookings, Staff, Services, Categories
- Working hours with exceptions and bulk operations
- Drag & drop ordering (Services, Categories, Staff)
- Email configuration with SMTP
- Email templates with variable substitution
- Responsive design (mobile/tablet/desktop)
- Accessibility (WCAG 2.1 AA)
- Loading/empty/error states
- Toast notifications
- Smooth transitions
- **Comprehensive test suite** ⭐

**Technology:**
- Vue 3 (Composition API)
- Vue Router (lazy loading)
- Tailwind CSS
- Sortable.js
- Axios
- NProgress
- PHPUnit (testing)
- wp-env (test environment)


---

## Phase 1 Progress: 33% Complete

**Sprints Completed:** 3/9
**Hours Completed:** ~302h / 768-900h estimated
**Status:** ON TRACK with excellent test coverage

Update 23/02/26

Sprint 1: ✅ Database & Backend Foundation (85h)
Sprint 2: ✅ Public Booking Page (65h)
Sprint 3: ✅ Vue Dashboard (120h)
Sprint 4A: ⏭️ Staff Dashboard Enhancements + Reports & Analytics (~112h) — LOCAL
Sprint 4B: ⏭️ Performance + Accessibility + Security Hardening (~80h) — LOCAL
Sprint 5:  ⏭️ Live Environment Sprint — Payments completion, Email notifications,
               Magic links, Google Calendar OAuth, Load testing — REQUIRES LIVE SITE
               - Bookit Meetings extension: Zoom OAuth auto-generation, Google Meet
  OAuth auto-generation, WhatsApp link construction, Teams support
Sprint 6:  ⏭️ Launch Preparation — Legal compliance, documentation, first client (~140h+)


Sprint 4A Progress: 1/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
⏭️ Task 2:  Time-Off Blocking (18h)  — NEXT
□  Task 3:  Staff Earnings Display (6h)
□  Task 4:  Reports Nav + Overview Dashboard (8h)
□  Task 5:  Revenue Report (14h)
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 16 / 112

Update 25/02/26
Update 25/02/26:
# Sprint 4A Started — Staff Dashboard Enhancements + Reports & Analytics

## Sprint 4A Progress: 2/10 tasks complete

✅ Task 1: Staff Schedule View + Mark Actions (16h) — COMPLETE
✅ Task 2: Time-Off Blocking (18h) — COMPLETE
⏭️ Task 3: Staff Earnings Display (6h) — NEXT
□  Task 4: Reports Nav + Overview Dashboard (8h)
□  Task 5: Revenue Report (14h)
□  Task 6: Booking Analytics (10h)
□  Task 7: Staff Performance Report (10h)
□  Task 8: Customer Database + GDPR (16h)
□  Task 9: PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours Completed: 34 / 112

## Key Decisions & Fixes This Session

**Status Log (Task 1):**
- Added `wp_bookings_status_log` table via new migration: `database/migrations/migration-add-status-log.php`
- Columns: `id, booking_id, old_status, new_status, changed_by_staff_id, changed_at, notes`
- Bug found during testing: `update_booking()` (PUT endpoint used by Bookings list page) was not logging status changes — only the dedicated `/complete` and `/no-show` endpoints were. Fixed by adding status log INSERT to `update_booking()` as well. All three paths now log correctly.

**Time-Off Blocking (Task 2):**
- Self-service endpoints added to `class-dashboard-bookings-api.php`:
  - `GET /dashboard/my-availability`
  - `POST /dashboard/my-availability`
  - `DELETE /dashboard/my-availability/{id}`
- Reason stored in `notes` column using format `reason:{value}|notes:{value}` (no dedicated reason column in schema)
- Availability algorithm already respected `specific_date` blocks with `is_working = 0` — no fix needed
- New view: `MyAvailability.vue` at `/my-availability` (all roles)

**Admin Time-Off Visibility — Decision:**
- Admin view of all staff time-off blocks: deferred. Will add a read-only time-off tab to the staff drill-down in Task 7 (Staff Performance Report).
- Full approval workflow (pending/approved/declined states + notifications): deferred to Phase 2. See Future_Features_Backlog.md.



Sprint 4A Progress: 4/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
⏭️ Task 5:  Revenue Report (14h)  — NEXT
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 48 / 112


Sprint 4A Progress: 5/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
⏭️ Task 6:  Booking Analytics (10h)  — NEXT
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 62 / 112

Sprint 4A Progress: 6/10 tasks complete

✅ Task 1–6 complete
⏭️ Task 7:  Staff Performance Report (10h)  — NEXT
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 72 / 112

Update 26/02/26:
Sprint 4A Progress: 7/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
⏭️ Task 8:  Customer Database + GDPR (16h)  — NEXT
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 82 / 112

Sprint 4A Progress: 8/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
✅ Task 8:  Customer Database + GDPR (16h)
⏭️ Task 9:  PHPUnit Tests (12h)  — NEXT
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 98 / 112

Sprint 4A Progress: 9/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
✅ Task 8:  Customer Database + GDPR (16h)
✅ Task 9:  PHPUnit Tests (12h)
⏭️ Task 10: Manual Testing & Polish (4h)  — NEXT

Hours completed: 110 / 112

Update 27/02/26 

Sprint 4A: ✅ Staff Dashboard Enhancements + Reports & Analytics (~115h) — COMPLETE

Sprint 4A Progress: 10/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
✅ Task 8:  Customer Database + GDPR (16h)
✅ Task 9:  PHPUnit Tests (12h)
✅ Task 10: Manual Testing & Polish (4h)

Update 27/02/26:
Sprint 4A complete. Key deliverables:
- Staff schedule view, time-off blocking, earnings display
- Reports suite: Overview, Revenue (with CSV export), Booking Analytics,
  Staff Performance with drill-down, Customer Database with GDPR anonymisation
- 444 PHPUnit tests passing, zero failures
- Bug fixes: no_show status consistency, deleted customer booking visibility,
  CSV double-encoding via rest_pre_serve_request pattern
- UI additions: collapsible Reports/Settings sidebar sections,
  DateRangeSelector active state persistence

Key technical decisions made this sprint:
- CSV export bypasses WP REST JSON encoding via rest_pre_serve_request filter
- GDPR deletion anonymises customer data, preserves booking records
  for HMRC 7-year retention
- Chart type switches Bar/Line based on date range span (≤7 days = Bar)



**Update 27/02/26: Major sprint restructure — all local work before live site**

**Decision 1: Complete all locally-buildable features before deploying to a live environment.**

Sprint sequence restructured accordingly:

```
Sprint 4A:  ⏭️  Staff Dashboard + Reports (~112h)          — NEARLY COMPLETE
Sprint 4B:  □   Polish & Infrastructure (~54h)             — LOCAL
Sprint 4C:  □   Feature Completeness (~72h)                — LOCAL
Sprint 4D:  □   Package Bookings + New Booking Types (~80h) — LOCAL
Sprint 4E:  □   Security & Quality (~80h)                  — LOCAL
Sprint 5:   □   Live Environment Sprint                    — REQUIRES LIVE SITE
Sprint 6:   □   Launch Preparation                         — MIXED
```

**Extension plugins (separate Claude projects, built after Sprint 4B):**
```
Bookit Recurring  — Recurring appointments (~45h)
Bookit Classes    — Group bookings & classes (~90h)
Bookit Forms      — Custom intake forms (~25h)
Bookit Meetings   — Online meeting links (~60h total:
                    ~8h core additions + ~52h extension)
```

**Sprint summaries:**

**Sprint 4B — Polish & Infrastructure (~54h) — LOCAL**
- Extension hook system — action and filter hooks added to core at key moments (booking wizard steps, availability calculation, booking created/updated/cancelled). Produces Extension Plugin API spec document.
- White-label / co-branded branding (logo, colours, business name, "Powered by")
- Optimistic locking on booking edit
- Comprehensive audit logging
- Database migration framework
- Custom booking reference format (BK2601-XXXX)
- Centralised error message system

**Sprint 4C — Feature Completeness (~72h) — LOCAL**
- Team calendar view (all staff schedules, admin sees everyone)
- Cancellation policy configuration UI — per-service overrides, refund percentage rules, time windows (settings only, no Stripe execution)
- Bulk booking actions (cancel/complete multiple at once)
- Contextual help tooltips throughout dashboard
- Customer data portability export (GDPR Art. 20)
- Setup wizard (4-step first-time configuration)

**Sprint 4D — Package Bookings + New Booking Types (~80h) — LOCAL**
- Package bookings — buy N sessions, redeem over time, credit balance on customer profile (stays in core — deeply integrated with payment step)
- Package bookings gated by admin settings toggle, disabled by default

**Sprint 4E — Security & Quality (~80h) — LOCAL**
- Accessibility audit + fixes (WCAG 2.1 AA)
- Performance optimisation (JS bundle, queries, lazy loading)
- Security hardening (OWASP checklist, rate limiting)
- PHPUnit test coverage for all Sprint 4B–4D code

**Items deferred to Sprint 5 (Live Environment):**
- Automatic refund execution via Stripe — requires real payment intent IDs and live/test Stripe API; cannot be meaningfully tested locally. Policy configuration UI built in Sprint 4C; execution wired up in Sprint 5.
- Waitlist email notifications for Bookit Classes — hooks built in extension, emails sent in Sprint 5
- Recurring appointment email notifications — hooks built in extension, emails sent in Sprint 5

**Total local work remaining after 4A:** ~286h in core (Sprints 4B–4E) + ~160h in extensions
**Status:** ON TRACK

---

**Decision 2: Extension plugin architecture**

Certain features will be built as separate WordPress plugins that extend the core Bookit plugin rather than being bundled into the core codebase. This reduces risk of optional features affecting users who don't use them.

**Extension strategy: Option 3 (separate dashboard pages)**
Each extension ships its own standalone Vue pages accessible via new dashboard routes. The core sidebar links to these pages when the extension is active. Can migrate to tighter integration later — the PHP side and component logic would not need to change, only the mounting approach.

**Features confirmed as extension plugins:**

| Feature | Plugin name | Built after |
|---------|-------------|-------------|
| Recurring appointments | Bookit Recurring | Core Sprint 4B complete |
| Group bookings & classes | Bookit Classes | Core Sprint 4B complete |
| Custom intake forms | Bookit Forms | Core Sprint 4B complete |

**Features confirmed to stay in core:**
- Package bookings — affects payment step, customer credit balance, bookings list; too deeply integrated to isolate cleanly
- All Sprint 4B, 4C, 4E items

**Prerequisites before building any extension:**
- Sprint 4B must add extension hooks to core PHP and produce an **Extension Plugin API spec document** in this project
- Each extension gets its own separate Claude project
- The Extension Plugin API spec is added to each extension project as its first piece of knowledge

**Claude project naming:**
- Core: this project
- `Bookit Recurring`, `Bookit Classes`, `Bookit Forms` — created when ready


Update 28/02/26:

Sprint 4B Progress: 0/9 tasks complete

□  Task 1: Extension Hook System — PHP Core Hooks (8h)
□  Task 2: Extension Plugin API Spec Document (6h)
□  Task 3: White-Label Branding System (8h)
□  Task 4: Audit Logging System (8h)
⏭️ Task 5: Database Migration Framework (6h) — READY TO START
□  Task 6: Custom Booking Reference Format (4h)
□  Task 7: Centralised Error Message System (6h)
□  Task 8: Optimistic Locking on Booking Edit (4h)
□  Task 9: PHPUnit Tests + Manual Testing (4h)

Estimated: 54h | Actual: 0h

Update 01/03/26:

Sprint 4B: ✅ Polish & Infrastructure (~54h) — COMPLETE

Sprint 4B Progress: 9/9 tasks complete

✅ Task 1: Extension Hook System (8h)
✅ Task 2: Extension Plugin API Spec Document (6h)
✅ Task 3: White-Label Branding System (8h)
✅ Task 4: Audit Logging System (8h)
✅ Task 5: Database Migration Framework (6h)
✅ Task 6: Custom Booking Reference Format (4h)
✅ Task 7: Centralised Error Message System (6h)
✅ Task 8: Optimistic Locking on Booking Edit (4h)
✅ Task 9: PHPUnit Tests + Manual Polish (4h)

Estimated: 54h | Actual: ~54h

Sprint 4B complete. Key deliverables:
- Extension hook system: action/filter hooks at all key booking lifecycle
  moments; Extension Plugin API spec document produced
- White-label branding: logo, primary colour, business name, powered-by
  toggle; settings persist to DB, apply at runtime via CSS variables
- Audit logging: read-only admin log of all significant system actions,
  with date/action filters and pagination
- Database migration framework: versioned migrations with rollback support;
  migrations 0001 (booking reference), 0002 (lock version) shipped
- Custom booking reference: BK[YYMM]-[XXXX] format generated on all
  booking creation paths (wizard + manual dashboard booking)
- Centralised error message system: registry of typed error codes (E1001–
  E9999) with placeholder substitution and consistent HTTP status mapping
- Optimistic locking: lock_version token on all bookings; concurrent edit
  conflicts return E2004 with conflict dialog in Vue
- Test suite: 444 → 485 tests (+41 new), 1529 assertions, 0 failures

Bug fixes made during sprint:
- Vite build base path fixed (base: './') — chunks were 404ing when served
  from plugin subdirectory
- booking_reference NULL on new dashboard bookings — insert_id timing issue
- PHP key mismatch in load_branding_settings() — was returning snake_case
  DB keys instead of camelCase keys expected by Vue normalizeBranding()
- Tailwind dist rebuilt with CSS variable references so runtime colour
  changes apply correctly
- Undefined variable in class-datetime-model.php availability filtering
- Legacy conflict error behaviour restored in class-dashboard-bookings-api.php

Next: Sprint 4C — Feature Completeness (~72h) — LOCAL


Update 05/03/26:

Sprint 4C: ✅ Feature Completeness (~80h) — COMPLETE

Sprint 4C Progress: 9/9 tasks complete (+ 2 unplanned fixes)

✅ Task 1a: Team Calendar — Day/Week views (8h)
✅ Task 1b: Team Calendar — Month view + Day/Week/Month toggle (6h)
✅ Task 2:  Setup Guide — Backend + State (8h)
✅ Task 3:  Setup Guide — Overlay UI (10h)
✅ Task 4:  Cancellation Policy Settings UI (6h)
✅ Task 5:  REQ-LEGAL-003 — 14-day cooling-off waiver (3h)
✅ Task 6:  Payment Gateway Configuration UI (4h)
✅ Task 7:  Deposit Settings UI (4h)
✅ Fix 5A:  Deposit split display at checkout (2h)
✅ Fix 5B:  Cancellation policy display in wizard + emails (2h)
✅ Task 8:  PHPUnit coverage check and gap fill (4h)
✅ Task 9:  Manual testing and polish (4h)

Estimated: ~72h | Actual: ~61h

Key deliverables:
- Team Calendar: full day/week/month views with staff filter,
  booking cards, status dots, cross-month week labels
- Setup Guide: 4-step onboarding overlay with service creation,
  availability, payment status, go-live summary; collapsible
  ADMIN sidebar section
- Cancellation Policy: full settings UI with live preview panel,
  strict policy warning, policy text shown at checkout and in
  confirmation emails
- REQ-LEGAL-003: 14-day cooling-off waiver checkbox with fixed
  legal wording, session storage, DB columns, waiver_at timestamp
- Payment Gateway: Stripe/PayPal key storage with sensitive key
  masking (SAVED pattern), show/hide toggles, Pay on Arrival toggle
- Deposit Settings: default rules, min/max controls, refund
  behaviour toggles, live checkout preview card
- Fix 5A: deposit split (due today / due on arrival) correctly
  calculated and displayed at booking step 5
- Fix 5B: cancellation policy text wired to booking wizard step 5
  and confirmation email
- Test suite: 485 → 551 tests (+66), 1748 assertions, 0 failures
- Manual testing: clean pass, no polish fixes required

Next: Sprint 4D — Package Bookings (~80h) — LOCAL



Update 08/03/26:

Sprint 4C.5: ✅ Carry-Forward Cleanup (~20h) — COMPLETE

Sprint 4C.5 Progress: 3/3 tasks complete

✅ Task 1: Bulk Booking Actions (~6h)
✅ Task 2: GDPR Customer Data Portability Export (~8h)
✅ Task 3: Contextual Help Tooltips (~6h)

Estimated: ~20h | Actual: ~20h

Key deliverables:
- Bulk booking actions: POST /dashboard/bookings/bulk-action;
  actions cancel/complete/no_show; each booking processed
  individually server-side so lifecycle hooks and audit log
  entries fire per booking; partial success handled gracefully
  in UI (succeeded/failed arrays with reasons); admin-only,
  staff role blocked; confirmation dialog before action fires
- GDPR export: per-customer data portability export (Art. 20)
  triggered from customer profile; JSON format (structured,
  machine-readable) and CSV format (zip of separate files per
  data type); export contents: personal details, full booking
  history (all statuses), payment records; audit log entries
  and internal gateway IDs excluded from export; audit log
  entry written on every export action; no cross-customer data;
  existing bulk customer CSV export untouched
- Tooltips: new BookitTooltip.vue global component; Teleport
  to body prevents clipping in modals and sidebars; keyboard
  accessible (focus shows, Escape dismisses, hover persistence
  between trigger and panel); WCAG 2.1 AA (role=tooltip,
  aria-describedby); consolidated existing StaffHours inline
  tooltip into new component; tooltips added to: cancellation
  policy fields, deposit settings, payment gateway fields,
  branding settings, bookings list status and reference column
  headers, split shift config, buffer time on service form
- Test suite: 551 → 571 tests (+20), 1819 assertions, 0 failures

Implementation notes:
- Bulk action endpoint initially registered at /bookings/bulk-action
  (missing /dashboard/ prefix); corrected to
  /dashboard/bookings/bulk-action to align with all other
  dashboard endpoints and allow useApi composable to work
  correctly
- GDPR export: audit log entries and Stripe/PayPal gateway IDs
  removed from export contents on review — audit log is internal
  admin activity, not customer-provided data; gateway IDs are
  internal references not meaningful to the customer
- Tooltip component created from scratch (no existing tooltip
  infrastructure found); StaffHours had an inline local
  implementation which was consolidated into BookitTooltip

Next: Sprint 4D — Package Bookings (~80h) — LOCAL


**Customer package visibility gap noted:**
- Customers cannot currently see their own package history or sessions remaining
- Mitigation: admin can view via Customer Profile → Packages tab
- Sprint 4E task added: package redemption confirmation email to include sessions remaining
- Sprint 5 task added: customer-facing "My Packages" portal page (shortcode-based)

Update 14/03/26:

Sprint 4D: ✅ Package Bookings (~80h) — COMPLETE

Sprint 4D Progress: 10/10 tasks complete (Task 5 deferred to live sprint)

✅ Task 1: Database Migrations — Package Tables (~6h)
✅ Task 2: Package Types API — CRUD (~8h)
✅ Task 3: Customer Packages API — Purchase & Management (~8h)
✅ Task 4: Booking Wizard — Package Purchase UI stub (~4h)
⏸️ Task 5: Stripe Webhook — Package Purchase (DEFERRED to Sprint 5 — requires live environment)
✅ Task 6: Booking Wizard Step 5 — "Use a Package" Redemption Path (~8h)
✅ Task 7: Package Redemption — Atomic Dashboard Endpoint (~8h)
✅ Task 8: Dashboard — Packages Section & Customer Profile Tab (~12h)
✅ Task 9: Settings Toggle (packages_enabled) + Daily Expiry Cron (~8h)
✅ Task 10: Package Redemption History — Endpoint + UI (~4h)

Estimated: ~80h | Actual: ~66h (17.5% under estimate)

Key deliverables:

DB schema (4 migrations):
- wp_bookings_package_types (migration 0005): package definitions,
  price_mode (fixed/discount), expiry config, applicable_service_ids JSON
- wp_bookings_customer_packages (migration 0006): per-customer package
  ownership, sessions_total/remaining, status ENUM, expiry tracking
- wp_bookings_package_redemptions (migration 0007): immutable audit trail
  of every session redemption with booking_id, redeemed_by, notes
- wp_bookings.customer_package_id column (migration 0008): links bookings
  to the package they were redeemed against

REST API (7 new controllers/endpoints):
- GET/POST /dashboard/package-types + GET/PATCH/POST/{id}/deactivate
- GET/POST /dashboard/customer-packages + GET/{id} + POST/{id}/cancel
- GET /dashboard/customer-packages/{id}/redemptions (history)
- POST /dashboard/package-redemptions (atomic: START TRANSACTION /
  SELECT FOR UPDATE / COMMIT / ROLLBACK; double-redemption guard)
- GET /wizard/available-packages (public, service-filtered)
- GET /wizard/my-packages (public, customer email lookup)
- GET /dashboard/bookings extended: customer_id filter + customer_package_id field

Booking wizard Step 5:
- "Use one of your packages" section: server-rendered, service-filtered,
  shows customer's active packages with sessions remaining and expiry
- "Buy a session package" section: shows purchasable packages (Stripe
  routing deferred to Sprint 5)
- Three mutually exclusive radio groups: payment methods, buy package,
  use package — all JS-managed without page reload
- use_package payment method → process_use_package() in payment processor:
  validates package, creates booking, decrements sessions_remaining via
  SQL expression, inserts redemption record, fires audit log

Dashboard — Packages page:
- Admin-only list view at /packages with status filter, search,
  pagination, status badges
- Booking selection modal for session redemption (replaces window.prompt):
  fetches customer's unlinked bookings, radio selection, focus trap,
  Teleport modal following BookingModal.vue pattern
- Expandable History rows per package showing full redemption history

Dashboard — Customer Profile:
- New Packages tab (lazy-loaded on first click) showing all customer
  packages with status badges and expandable redemption history per card

Settings:
- packages_enabled toggle in Settings.vue → saves '0'/'1' via settings API
- packages_enabled added to settings API allowlist

Cron:
- Bookit_Package_Expiry: daily at 02:00 AM, per-record loop (not bulk
  UPDATE), fires customer_package.expired audit log per record,
  registered in activator/deactivator, init() in loader

Error codes (E5001–E5005):
- E5001: PACKAGE_NOT_FOUND
- E5002: PACKAGE_EXHAUSTED
- E5003: PACKAGE_EXPIRED
- E5004: PACKAGE_SERVICE_MISMATCH
- E5005: PACKAGE_INSUFFICIENT_SESSIONS

Test suite: 571 → 686 tests (+115), 0 failures

Key decisions made during Sprint 4D:
- Stripe package purchase routing deferred to Sprint 5 (live environment);
  wizard shows buy UI stub, session stored, no Stripe call locally
- Extension plugin architecture confirmed: packages remain in core
  (deeply integrated with payment step); group bookings/recurring go
  to extension plugins
- window.prompt() replaced with proper booking selection modal after
  Task 8 implementation — identified as a UX gap before commit
- Bookings API extended (customer_id filter + customer_package_id field)
  after Cursor blocked on missing params — pre-patch approach used
- Per-record cron processing enforced (not bulk UPDATE) to ensure audit
  log fires per record — sprint rule applied to expiry cron
- packages_enabled settings API uses string '0'/'1' not boolean cast —
  consistent with existing settings storage pattern
- Double-redemption guard via booking_already_redeemed WP_Error +
  SELECT FOR UPDATE lock — prevents concurrent admin redemptions

Customer package visibility gap:
- Customers cannot currently see their own package history or sessions
  remaining from the front end
- Admin can view via Customer Profile → Packages tab on their behalf
- Sprint 4E task added: package redemption confirmation email to include
  sessions remaining count (~1h)
- Sprint 5 task added: customer-facing [bookit_my_packages] shortcode
  page showing active packages, sessions remaining, redemption history

Next: Sprint 4E — Security & Quality (~80h) — LOCAL
- Accessibility audit + fixes (WCAG 2.1 AA)
- Performance optimisation (JS bundle, queries, lazy loading)
- Security hardening (OWASP checklist, rate limiting)
- PHPUnit coverage for Sprint 4B–4D code
- Package redemption email enhancement (sessions remaining in email)


Update 15/03/26:

Sprint 4E: ✅ Security & Quality (~80h) — COMPLETE

Sprint 4E Progress: 8/8 tasks complete

✅ Task 1: Security Audit & Input Validation (~8h)
✅ Task 2: Rate Limiting — Public Endpoints (~8h)
✅ Task 3: PHPUnit Coverage — Sprint 4B Infrastructure (~8h)
✅ Task 4: PHPUnit Coverage — Sprints 4C & 4C.5 (~6h)
✅ Task 5: PHPUnit Coverage — Sprint 4D Packages (~6h)
✅ Task 6: Performance Optimisation (~10h)
✅ Task 7: WCAG 2.1 AA Accessibility Fixes (~12h)
✅ Task 8: Package Redemption Email Enhancement (~2h)

Estimated: ~80h | Actual: ~40h (50% under estimate — most coverage
gaps were already filled during earlier sprints; audit work confirmed
quality rather than finding major issues)

Key deliverables:

Security hardening:
- OWASP pass across all Sprint 4D package API files: $wpdb->prepare()
  verified on all queries; applicable_service_ids validated as JSON
  array of integers; expires_at validated via DateTime::createFromFormat;
  sessions_total guarded > 0; price_mode validated against allowed ENUM
- Booking wizard Step 5 template XSS audit: all variable output already
  escaped (esc_html, esc_attr, esc_url); confirmed clean
- Staff photo upload: stored as URL field (no server-side upload handler
  in scope); documented for future backlog
- Rate limiter class (Bookit_Rate_Limiter): WordPress Transients API,
  no new DB tables; key format bookit_rl_{action}_{md5(ip)}
- Endpoints rate limited: wizard booking creation (10/hr), available-
  packages (60/hr), my-packages (60/hr), dashboard login (5/15min)
- Rate limit violations logged to audit log (action: rate_limit_exceeded)
- E6001 RATE_LIMIT_EXCEEDED registered (HTTP 429)
- packages_enabled gate added to GET /wizard/available-packages
  (was missing — returns empty array when disabled)

PHPUnit coverage gaps filled:
- Sprint 4B: pending migration detection (observable behaviour), NULL
  object_id storage in audit log; extension registry version
  incompatibility was already covered
- Sprint 4C/4C.5: gateway ID exclusion from GDPR export, deposit
  percentage calculation via Stripe_Checkout::calculate_deposit;
  audit log on export and per-service cancellation override both
  confirmed already covered / unimplemented respectively
- Sprint 4D: deactivation safety (customer packages unaffected when
  package type deactivated); discount price mode test added then
  removed (purchase_price not computed at creation — Sprint 5 gap);
  packages_enabled gate test added to available-packages suite

Performance optimisation:
- N+1 fix: staff performance report refactored from per-staff query
  loops to bulk aggregation helpers (get_staff_period_metrics_bulk,
  get_staff_all_time_totals_bulk); all other list endpoints confirmed
  clean via audit comments
- Migration 0009: composite indexes added — idx_status_date on
  bookings(status, booking_date); idx_staff_date_status on
  bookings(staff_id, booking_date, status); idx_status_expires on
  customer_packages(status, expires_at); idempotent up/down
- Vue Router: all routes already using lazy () => import() syntax
- Chart.js: already local to report views only, no global import

WCAG 2.1 AA accessibility:
- Packages.vue: role="alert" on error containers; aria-live="polite"
  loading regions; aria-expanded + aria-controls + matching panel id
  on redemption history toggles; existing focus trap on redeem modal
  confirmed intact
- CustomerProfile.vue packages tab: same aria-live / role="alert" /
  aria-expanded pattern applied
- Settings.vue: packages_enabled toggle wired with aria-labelledby
  to visible label text
- booking-step-5-payment.php: package radio group wrapped in fieldset
  + legend; lang="en-GB" documented as theme/WP scope (not plugin)
- Status badges: text confirmed alongside colour in all affected views

Package redemption email:
- generate_customer_email() extended with conditional package block
- Only fires when customer_package_id present AND payment_method is
  'package_redemption' or 'use_package'
- Line 1: "Sessions remaining on your [Package Name] package: X of Y"
- Line 2 (conditional): "Your package expires on: [formatted date]"
  using date_i18n + get_option('date_format'); omitted if expires_at null
- Graceful fallback: if package row not found, standard email sent
- Non-package booking emails unchanged; staff notifications unaffected
- pre_wp_mail filter used in tests to capture email content

Test suite: 686 → 706 tests (+20), 0 failures

Regressions: none

Implementation notes:
- class-bulk-bookings-api.php does not exist; bulk action endpoint
  lives in class-dashboard-bookings-api.php (bulk_action method)
- class-bookings-api.php does not exist; bookings list is in
  class-dashboard-bookings-api.php
- class-package-redemption-history-api.php does not exist; history
  endpoint is in class-customer-packages-api.php
- Dashboard login is not a REST endpoint; rate limiting applied to
  dashboard/index.php POST handler directly
- Audit logger signature is log(action, object_type, object_id, context)
  (4 args, not 5 as initially assumed)
- Error registry uses user_message/log_message/http_status/category
  (not 'message')
- Email method is generate_customer_email() not send_customer_confirmation()
  directly; the latter delegates to the former

Backlog items added to Future_Features_Backlog.md:
- packages_enabled gate missing from /wizard/my-packages endpoint
  (consistent fix for Sprint 5 or 4F)
- Discount mode purchase_price not stored at creation (Sprint 5)

Next: Sprint 4F — Meetings Extension core hooks (~8h) + Sprint 5
(Live Environment) — Google Calendar OAuth, Stripe package purchase,
email delivery, customer My Packages page

SPRINT 4F: Online Meetings Core Additions — CANCELLED / REDESIGNED
Date: March 2026
Original estimate: ~8h
Outcome: Partially implemented then reverted; scope moved to Bookit Meetings extension plugin
What was attempted
Sprint 4F was planned to add online meeting infrastructure to the core
plugin: DB columns on services and bookings, API field support, a UI
toggle in ServiceFormModal, confirmation page rendering, and email
rendering. Tasks 1 and 2 were implemented and committed.
Architecture review and reversal
During Task 2 review a fundamental architecture question was raised:
why does any of this live in the core plugin? After review, the
decision was made to revert Tasks 1 and 2 and move the entire online
meetings feature to a dedicated Bookit Meetings extension plugin.
Rationale:

Meeting link generation, OAuth, platform config, and UI are optional
features — they belong in an extension, not core
The core plugin should remain clean and unaware of meeting platforms
Extension plugins own their own migrations, UI, and business logic
The only legitimate core responsibility is providing hooks that
extensions can consume

What was reverted

Migration 0010 (meeting_type, preferred_platform, default_meeting_link
on wp_bookings_services) — removed
Migration 0011 (meeting_link on wp_bookings) — removed
class-dashboard-bookings-api.php: meeting field args, response
formatting, create/update write logic — removed
ServiceFormModal.vue: Online Meeting UI section, formData fields,
payload additions — removed
tests/unit/test-meetings-service-api.php — removed
tests/integration/test-meetings-migration.php — removed

Test suite after revert: 706 tests, 0 failures (confirmed back to
Sprint 4E baseline)
What was kept: Core hooks pre-task
The only core plugin changes that survived are three WordPress hooks
added to two existing files. These have no consumers yet — they are
silent until the Bookit Meetings extension is installed and active:
public/templates/booking-confirmed.php:

do_action( 'bookit_after_booking_confirmed', $booking_id, $booking )
fires after emails are sent and session is cleared
apply_filters( 'bookit_confirmation_meeting_section', '', $booking )
renders extension-supplied meeting link HTML in the confirmation page
output block; empty string default means no visible change

includes/email/class-email-sender.php:

apply_filters( 'bookit_email_meeting_section', '', $booking )
renders extension-supplied meeting link HTML inside
generate_customer_email(); empty string default means no change to
existing email output

Test suite after hooks added: 706 tests, 0 failures (no regression;
hooks with no consumers are invisible to the test suite)
Decisions log
DecisionRationaleRevert Tasks 1 and 2 from coreOnline meeting storage, UI, and logic belong in the extension, not coreKeep DB columns out of coreExtension adds its own migrations on activation, removes them on deactivation — clean lifecycleKeep ServiceFormModal UI out of coreExtension injects its own UI when active; core modal has no meeting fieldsAdd three hooks to coreExtension needs these touchpoints to inject meeting link delivery without modifying core filesHooks only, no columns, no APICore's job is to fire the hooks; extension's job is to consume them
Implementation notes

booking-confirmed.php: $bookit_meeting_section_html variable name
used (prefixed to avoid template scope collision)
class-email-sender.php: $bookit_email_meeting_html variable name
used (same reason)
Confirmation page and email output are byte-for-byte identical
before and after the hook additions when no extension is active

Bookit Meetings extension project
A full project initialisation document was created:
Bookit_Meetings_Extension_Project_Init.md
The extension owns:

Migrations for meeting_type/preferred_platform/default_meeting_link
on wp_bookings_services and meeting_link on wp_bookings
Service UI (Online Meeting toggle, platform selector, default link)
Link generation logic (WhatsApp, Teams, Generic in Phase 1;
Zoom and Google Meet OAuth in Phase 2)
Confirmation page and email meeting link injection via core hooks
Admin per-booking meeting link override endpoint
Meetings settings dashboard page (OAuth status)

Phase 2 (Zoom/Google Meet OAuth) deferred to live environment sprint.
Next
Sprint 5 (Live Environment):

Google Calendar OAuth integration
Stripe package purchase routing
Transactional email service setup
[bookit_my_packages] shortcode customer page (~8-10h)

Bookit Meetings Extension Phase 1 (~24h, separate project):

Plugin scaffold + registration
DB migrations (services columns + booking column + credentials tables)
Services API extension + ServiceFormModal UI injection
Booking link generation on bookit_after_booking_created
Booking API meeting_link via bookit_booking_response filter
Admin override endpoint (bookit-meetings/v1 namespace)
Confirmation page + email injection via core hooks
Meetings settings dashboard page

SPRINT 4H: Notification Infrastructure — PLANNED
Date: TBD (follows Sprint 4G completion)
Estimate: ~22h
Status: Not started

Goal
Build the complete notification architecture in the core plugin: provider
abstraction layer, email queue, Action Scheduler integration, retry logic,
rate limiting, and settings UI. No live Brevo account needed — all
testable locally. Sprint 5 activates it with real credentials.

Architecture decisions
- Provider pattern (driver abstraction): email provider and SMS provider
  each implement a contract interface. The dispatcher resolves the active
  provider from settings at dispatch time, never at construction — so
  switching vendors takes effect immediately.
- Brevo is the default/primary vendor for both email and SMS.
- wp_mail() fallback provider ships in core for clients without API keys.
- Twilio SMS provider: stub interface only in this sprint; full
  implementation deferred to Phase 2 SMS sprint.
- Queue-first: all sends are non-blocking. Booking confirmation fires a
  DB write + Action Scheduler job; the HTTP response returns immediately.
- Retry: 3 attempts with exponential back-off (5min → 30min → 2h).
  Brevo 429 responses re-queue without consuming a retry attempt.
- Local rate limiter (transient-based) guards against server burst on
  shared hosting. Default cap: 30 sends/minute, configurable.
- Reminder cancellation: pending queue items cancelled on booking
  cancel or reschedule events.

New files (all under includes/notifications/)
  interfaces/
    interface-bookit-email-provider.php
    interface-bookit-sms-provider.php
  providers/
    class-bookit-brevo-email-provider.php
    class-bookit-brevo-sms-provider.php      (stub — no live credentials)
    class-bookit-wp-mail-fallback-provider.php
  class-bookit-notification-dispatcher.php
  class-bookit-email-queue.php

New DB migration
  Migration 00XX: wp_bookit_email_queue table
  Columns: id, booking_id, email_type, recipient_email, recipient_name,
  template_id, params (JSON), status, attempts, scheduled_at, sent_at,
  last_error, created_at

Tasks
Task 1 — Interfaces + Provider Scaffold (~3h)
  - Define Bookit_Email_Provider_Interface (send, is_configured, get_name)
  - Define Bookit_SMS_Provider_Interface (send, is_configured, get_name)
  - Implement Bookit_Brevo_Email_Provider (full — uses brevo-php v4)
  - Implement Bookit_WP_Mail_Fallback_Provider
  - Implement Bookit_Brevo_SMS_Provider stub (interface satisfied, send()
    logs and no-ops until Sprint 5 SMS work)
  - Register providers in plugin bootstrap

Task 2 — Queue Table + Action Scheduler Integration (~6h)
  - DB migration for wp_bookit_email_queue (idempotent up/down)
  - Bookit_Email_Queue class: insert, update_status, fetch_pending,
    cancel_for_booking
  - bookit_enqueue_email() helper function
  - Bookit_Notification_Dispatcher: enqueue_email(), enqueue_sms(),
    process_email_queue_item(), resolve_email_provider(),
    resolve_sms_provider()
  - Hook reminder cancellation to bookit_booking_cancelled and
    bookit_booking_rescheduled actions

Task 3 — Retry, Rate Limiting + 429 Handling (~5h)
  - Exponential back-off: 3 attempts at 5min / 30min / 2h delays
  - Brevo 429 handling: re-schedule at +60s, do not increment attempt count
  - Local rate limiter: transient key per minute, configurable cap
  - bookit_email_permanently_failed action hook on final failure
  - Bookit_Notification_Exception custom exception class

Task 4 — Settings Page + Provider Switching (~4h)
  - Email provider dropdown: Brevo / wp_mail fallback
  - SMS provider dropdown: None / Brevo (Twilio listed as "coming soon")
  - Per-provider config fields shown/hidden dynamically
  - is_configured() status indicator per provider
  - "Send test email" / "Send test SMS" buttons (bypass queue, fire
    immediately)
  - Warning banner in dashboard if no email provider configured

Task 5 — Replace Existing Email Calls + Tests (~4h)
  - Replace wp_mail() calls in class-email-sender.php with
    dispatcher enqueue_email() calls
  - PHPUnit: queue insert, status update, retry scheduling, 429
    handling, cancellation on reschedule/cancel, provider resolution,
    fallback behaviour, rate limiter
  - Confirm no regression on existing test suite

Deferred to Sprint 5 (requires live environment)
  - Brevo account setup, domain verification, SPF/DKIM configuration
  - Template creation in Brevo dashboard (one per notification type)
  - Template ID mapping in plugin settings
  - SMS queue table + dispatcher SMS path (no live credentials to test)
  - Brevo delivery webhook receiver
  - Admin email queue log view (dashboard tab)

Next after Sprint 4H
  Sprint 5 (Live Environment): Brevo activation, Stripe live, Google
  Calendar OAuth, My Packages page


  Update 24/03/26:

Sprint 4G: ✅ Client Readiness (~20h) — COMPLETE

Sprint 4G Progress: 3/3 tasks complete

✅ Task 1: packages_enabled gate on /wizard/my-packages (~1h)
✅ Task 2: [bookit_my_packages] shortcode (~9h)
✅ Task 3: Theme override system (~10h)

Estimated: ~20h | Actual: ~20h

Key deliverables:

packages_enabled gate:
- /wizard/my-packages now returns empty array (200) when packages
  are disabled, consistent with /wizard/available-packages
- 1 PHPUnit test added

[bookit_my_packages] shortcode:
- New public endpoint GET /wizard/package-redemptions — scoped by
  customer email ownership, rate limited 30/hour, max 10 results,
  packages_enabled gated, anti-enumeration on unknown emails
- New [bookit_my_packages] shortcode with server-rendered PHP template;
  email input form with nonce, package cards with sessions/expiry,
  AJAX redemption history toggle (vanilla JS, no Vue)
- my-packages.css enqueued only on pages with the shortcode
- bookitMyPackages JS object localised with REST URL and nonce
- My Packages page auto-created on plugin activation
- Logged-in WP admin email excluded from auto-fill (non-customer
  role guard added after testing revealed admin email being used)
- 10 PHPUnit tests added across 2a and 2b sub-tasks

Theme override system:
- CSS custom property token system: :root block with full set of
  --bookit-* variables added to booking-wizard.css; hardcoded
  colour/radius/shadow values replaced with var() references in
  booking-wizard.css, confirmation-page.css, and my-packages.css
- .bookit-btn-next migrated from hardcoded #0056B3 to
  var(--bookit-primary) after CSS cascade issue discovered during
  testing (plugin stylesheet loads after theme; client overrides
  require !important — documented in template loader class)
- Bookit_Template_Loader: WooCommerce-style locate_template() +
  get_template() with child/parent/plugin fallback chain; themes
  place overrides in {theme}/bookit/
- All shortcode template includes migrated to
  Bookit_Template_Loader::get_template()
- Step template loading in booking-wizard-shell.php migrated to loader
- Developer documentation block in class-bookit-template-loader.php
  covers both template overrides and CSS custom property system
- 4 PHPUnit tests added

Test suite: 706 → 721 tests (+15), 0 failures

Implementation notes:
- CSS variable override requires !important in theme stylesheets due
  to plugin stylesheet loading after theme; this is expected cascade
  behaviour and is documented in the template loader class
- Task 2c (shortcode registration + page auto-creation) merged into
  Task 2b prompt; effectively delivered as one task

Next: Sprint 4H — Notification Infrastructure (~22h) — LOCAL


Update 26/03/26:

Sprint 4H: ✅ Notification Infrastructure (~22h) — COMPLETE

Sprint 4H Progress: 5/5 tasks complete

✅ Task 1: Interfaces + Provider Scaffold (~3h)
✅ Task 2: Queue Table + Action Scheduler Integration (~6h)
✅ Task 3: Retry, Rate Limiting + 429 Handling (~5h)
✅ Task 4: Settings Page + Provider Switching (~4h)
✅ Task 5: Replace Existing Email Calls + Tests (~4h)

Bonus fix: Cooling-off waiver not applied to dashboard manual bookings

Estimated: ~22h | Actual: ~22h

Test suite: 721 → 761 tests (+40), 0 failures

Key deliverables:

Provider abstraction layer:
- Bookit_Email_Provider_Interface and Bookit_SMS_Provider_Interface
  define the contract all providers must implement
- Bookit_Brevo_Email_Provider: full implementation using
  getbrevo/brevo-php v4 SDK; reads brevo_api_key, brevo_from_name,
  brevo_from_email from wp_bookings_settings; handles 429 as
  WP_Error('brevo_rate_limited') for retry-without-penalty path
- Bookit_WP_Mail_Fallback_Provider: wraps wp_mail() with HTML
  Content-Type header; always is_configured() = true; default
  provider when no Brevo key is set
- Bookit_Brevo_SMS_Provider: stub only; logs and no-ops; full
  implementation deferred to Sprint 5
- getbrevo/brevo-php ^4.0 added to composer.json

Email queue:
- Migration 0010: wp_bookit_email_queue table — id, booking_id,
  email_type, recipient_email, recipient_name, subject, html_body,
  params (JSON), status ENUM, attempts, max_attempts, scheduled_at,
  sent_at, last_error, created_at, updated_at
- Composite index idx_status_scheduled on (status, scheduled_at)
- Bookit_Email_Queue class: insert, update_status, get_row,
  fetch_pending, cancel_for_booking
- bookit_enqueue_email() global helper function

Dispatcher + Action Scheduler:
- Bookit_Notification_Dispatcher: enqueue_email(), resolve_email_provider(),
  resolve_sms_provider(), process_email_queue_item(), handle_send_failure()
- AS integration: as_schedule_single_action() when Action Scheduler
  available; wp_schedule_single_event() fallback
- bookit_process_email_queue action hooked to dispatcher processor
- bookit_after_booking_cancelled listener calls cancel_for_booking()
- bookit_booking_rescheduled listener registered with TODO comment
  (action not yet fired in core)

Retry + rate limiting:
- Exponential back-off: attempt 1 → +5min, attempt 2 → +30min,
  attempt 3 → +2h
- 429 from Brevo: re-queued at +60s without incrementing attempts
- Per-minute transient rate limiter: key bookit_email_rate_{YmdHi},
  cap configurable via email_rate_limit_per_minute setting (default 30),
  TTL 90s; blocked items pushed to next minute boundary, attempts unchanged
- bookit_email_permanently_failed action fired on terminal failure
- Bookit_Notification_Exception class with get_email_type() and
  get_queue_id() context methods

Settings page:
- EmailSettings.vue replaced with provider-aware layout
- Section 1: Email Provider dropdown (wp_mail / Brevo); Brevo fields
  (API key, From Name, From Email) shown/hidden via v-if; green
  "Connected" / grey "API key required" status indicator
- Section 2: SMTP Configuration (Advanced) — all existing SMTP fields
  preserved unchanged; Brevo SMTP relay recommended for production
- Section 3: SMS Notifications — provider dropdown (none / Brevo SMS
  coming soon); disabled API key input stub
- Section 4: Test Notifications — send test email via dispatcher
  bypass (not queue); success message includes resolved provider name;
  "Send Test SMS" button disabled with tooltip
- Amber warning banner at page top when email_provider = 'wp_mail'
- New setting keys added to allowlist: email_provider, brevo_api_key,
  brevo_from_name, brevo_from_email, sms_provider, brevo_sms_api_key,
  email_rate_limit_per_minute
- brevo_api_key and brevo_sms_api_key masked as 'SAVED' in GET
  responses (same pattern as Stripe keys)
- send_test_email() endpoint updated to use dispatcher provider bypass

Email call replacement:
- send_customer_confirmation() now calls bookit_enqueue_email()
  instead of wp_mail() directly
- send_business_notification() now calls bookit_enqueue_email()
  instead of wp_mail() directly
- generate_customer_email() and generate_business_email() untouched
- All existing call sites (class-dashboard-bookings-api.php,
  class-payment-processor.php, booking-confirmed.php) automatically
  use queue path with no changes needed at call sites
- class-stripe-webhook.php confirmed: no direct email calls
- test-package-email.php updated to capture HTML via
  generate_customer_email() directly (no longer relies on pre_wp_mail)
- test-payment-success.php updated to assert queue insertion

Bug fix — cooling-off waiver on dashboard bookings:
- Booking_System_Booking_Creator::create_booking() was enforcing the
  14-day cooling-off waiver check for all callers including dashboard
  staff creating manual bookings
- Consumer Contracts Regulations 2013 only applies to online/distance
  consumer contracts; staff-created bookings are not distance sales
- Fix: skip_waiver flag added to booking data; dashboard API passes
  skip_waiver=true; all public booking paths (Stripe, pay-on-arrival,
  package redemption) remain fully enforced
- 1 PHPUnit test added: test_dashboard_booking_skips_waiver_check

Architecture decisions:
- Settings reads in provider classes use direct $wpdb->get_var() query
  against wp_bookings_settings (bookit_get_setting() does not exist
  as a defined helper in this codebase; function_exists guard in
  booking-step-5-payment.php was forward-looking only)
- Private static get_setting() helper added to each provider class
  rather than a global function, keeping Task 1 self-contained
- Brevo provider sends raw HTML body in this sprint; Brevo template
  ID mapping deferred to Sprint 5 when templates are created in dashboard
- Email provider and SMTP are complementary, not competing: recommended
  production setup is Brevo API provider + Brevo SMTP relay for
  wp_mail() calls elsewhere in WordPress (password resets etc.)

New files:
- includes/notifications/interfaces/interface-bookit-email-provider.php
- includes/notifications/interfaces/interface-bookit-sms-provider.php
- includes/notifications/providers/class-bookit-brevo-email-provider.php
- includes/notifications/providers/class-bookit-wp-mail-fallback-provider.php
- includes/notifications/providers/class-bookit-brevo-sms-provider.php
- includes/notifications/class-bookit-email-queue.php
- includes/notifications/class-bookit-notification-dispatcher.php
- includes/notifications/class-bookit-notification-exception.php
- includes/functions-notifications.php
- database/migrations/0010-add-email-queue-table.php

Next: Sprint 5 (Live Environment)
- Brevo account setup, domain verification, SPF/DKIM, verified sender
- Stripe live mode + package purchase routing
- Google Calendar OAuth (requires live domain for redirect URI)
- End-to-end email testing with real Brevo credentials
- Brevo template creation + template ID mapping
- SMS queue + dispatcher SMS path
- [bookit_my_packages] customer page (deferred from Sprint 4G)


Update 29/03/26:

Sprint Wizard-V2: ✅ Customer-Facing Booking Wizard V2 — COMPLETE

Sprint Wizard-V2 Progress: 6/6 tasks complete

✅ Task 1: Shell, progress partial, step stubs
✅ Task 2: Step 1 — Service selection
✅ Task 3: Step 2 — Staff selection
✅ Task 4: Step 3 — Calendar and time slots
✅ Task 5: Step 4 — Contact details form
✅ Task 6: Step 5 — Payment and full JS implementation

Test suite: 761 → 791 tests (+30), 0 failures

Key deliverables:

New shortcode [bookit_wizard_v2] built additively alongside existing
[bookit_booking_wizard] — no existing files modified except where
explicitly required (contact-form.js, class-wizard-api.php,
class-shortcodes.php, class-datetime-api.php).

New files:
- public/templates/booking-wizard-v2-shell.php
- public/templates/booking-wizard-v2-step-1.php (service selection)
- public/templates/booking-wizard-v2-step-2.php (staff selection, avatar colour hash)
- public/templates/booking-wizard-v2-step-3.php (PHP-rendered calendar, bank holiday blocking)
- public/templates/booking-wizard-v2-step-4.php (contact form, waiver conditional)
- public/templates/booking-wizard-v2-step-5.php (Zone A/B/C payment, deposit calc)
- public/templates/partials/booking-wizard-v2-progress.php
- public/templates/page-wizard-v2.php
- public/assets/css/booking-wizard-v2.css (scoped to .bookit-v2-wizard-container,
  12 --bookit-v2-* tokens, waiver block amber values intentionally fixed)
- public/assets/js/booking-wizard-v2.js (vanilla JS IIFE, no jQuery dependency;
  step navigation, service/staff selection, date tap + slot fetch + slot reveal,
  special requests toggle, Zone B/C mutual exclusivity, dynamic CTA label matrix)
- includes/wizard-v2-payment-amounts.php (bookit_v2_compute_payment_amounts_from_service helper)
- tests/unit/test-booking-wizard-v2.php (30 PHPUnit tests)

Modified files:
- public/class-shortcodes.php: [bookit_wizard_v2] registration, asset
  enqueueing, bookitWizardV2 localisation, theme_page_templates +
  template_include filters for page template dropdown
- includes/api/class-wizard-api.php: validate_step allows 1-5, accepts
  service_name/service_duration/payment_method, maybe_fill_service_meta_from_db()
- includes/api/class-datetime-api.php: GET bookit/v1/wizard/timeslots alias
- public/assets/js/contact-form.js: success handler detects
  .bookit-v2-wizard-container and navigates to window.location.pathname
  instead of data.redirect_url (v1 redirect behaviour preserved)

Architecture decisions:
- Wizard page uses content-based shortcode (not page template dropdown)
  because Gutenberg ignores the theme_page_templates filter; template
  dropdown issue documented for Bookit Theme Workflow project
- Step 2 staff selection uses bookit/v1/staff/select (not generic session
  API) to validate staff and set staff_name, matching production behaviour
  and keeping existing wizard flow tests green
- advanceStep() navigates to window.location.pathname (not reload()) to
  strip ?step= query params that would cause PHP shell to clamp back to
  a previous step
- Contact form submit on step 4 uses form= attribute to associate the
  submit button (outside <form>) with the form, valid HTML5
- Waiver block amber values are intentionally fixed CSS — not theme-
  overridable — because the waiver is a legal signal under Consumer
  Contracts Regulations 2013, not a brand element

Post-task bug fixes (all committed):
- Calendar day cell max-width: 44px + margin:0 auto to cap size in
  7-column grid (was expanding to ~97px via aspect-ratio)
- Hidden prev arrow: min-width:32px + display:inline-block to preserve
  layout when on current month
- Step 1 card click: now saves service to session (current_step:1)
  and enables Continue button; no longer reloads to step 2 directly
- Step 1 Continue: PHP outputs disabled when $selected_service_id === 0
  to eliminate flash before DOMContentLoaded
- Step 2 Continue: PHP outputs disabled when $selected_staff_id === -1;
  JS removes disabled on staff selection
- ?step= URL clamping loop: advanceStep() navigates to
  window.location.pathname instead of reload() to prevent stale ?step=
  param from clamping PHP shell back to previous step
- Step 3 empty day: when slot fetch returns no slots, day gets --disabled
  class, no-availability message shown, Continue stays disabled
- Step 3 scroll: scrollIntoView changed from block:start to block:nearest
  to reduce jarring scroll behaviour
- Step 4→5 redirect: contact-form.js now detects v2 container and
  navigates to current page pathname instead of /book?step=5 (v1 URL)
- Step 5 Zone C pointer-events: removed pointer-events:none from
  .bookit-v2-payment-row--disabled so Zone C rows remain clickable
  when a package is selected; opacity:0.4 preserved for visual state
- Step 5 package toggle: clicking an already-selected package row
  deselects it, re-enables Zone C, resets CTA to card default

CSS customisation guide:
- bookit-wizard-v2-css-guide.md and .docx produced documenting all
  overridable --bookit-* and --bookit-v2-* tokens with examples

Next: Sprint 5 (Live Environment)
- Brevo account setup, domain verification, SPF/DKIM, verified sender
- Stripe live mode + package purchase routing
- Google Calendar OAuth (requires live domain for redirect URI)
- End-to-end email testing with real Brevo credentials
- Brevo template creation + template ID mapping
- SMS queue + dispatcher SMS path
- [bookit_my_packages] customer page (deferred from Sprint 4G)



Update 29/03/26 (continued):

Sprint Confirmed-V2: ✅ Booking Confirmed V2 Page — COMPLETE
Sprint Wizard-V2-Complete: ✅ V2 Wizard Booking Submission — COMPLETE
Sprint Pages-V2: ✅ Auto-create V2 Pages on Activation — COMPLETE

Test suite: 791 → 813 tests (+22), 0 failures

---

Sprint Confirmed-V2: Booking Confirmed V2 Page

Decision: Build a parallel V2 confirmation page additively alongside
the existing page — same shortcode pattern as Wizard V2. Old page and
stylesheet completely untouched.

New files:
- public/templates/booking-confirmed-v2.php (new template; same PHP
  logic as V1; email block replaced with comment; SVG checkmark icon;
  human-readable booking ref with BK- fallback; conditional deposit /
  full payment / pay-on-arrival blocks; waiver + special requests
  conditionals; meeting section filter preserved)
- public/assets/css/confirmation-page-v2.css (scoped to
  .bookit-confirmation-page; all --bookit-* tokens; waiver amber fixed)
- tests/unit/test-booking-confirmed-v2.php (17 PHPUnit tests)

Modified files:
- public/class-shortcodes.php: [bookit_booking_confirmed_v2] shortcode
  registered; confirmation-page-v2.css enqueued when shortcode present;
  $has_confirmation_v2 added to early-return guard; confirmed_v2_url
  added to bookitWizardV2 localisation object; wizard_version set to
  'v1' in render_booking_wizard() and 'v2' in render_booking_wizard_v2()
- includes/payment/class-payment-processor.php: process_pay_on_arrival()
  and process_use_package() read wizard_version from session snapshot
  and route to /booking-confirmed-v2/ when 'v2'
- includes/payment/class-stripe-checkout.php: success_url uses V2
  confirmation URL when wizard_version === 'v2'

Architecture decisions:
- Option A (new file + new shortcode) chosen over Option B (flag on
  existing template) to maintain additive-only discipline
- .bookit-confirmation-page wrapper class preserved on V2 template so
  theme stylesheets continue to apply
- bookit-wizard CSS dependency on confirmation-page-v2.css is
  intentional — needed for --bookit-* token resolution
- Waiver amber values fixed in V2 stylesheet (same rationale as wizard)
- design/booking-confirmed-design-decisions.md was absent from repo;
  implementation based on sprint brief and design/booking-confirmed.html

---

Sprint Wizard-V2-Complete: V2 Wizard Booking Submission

Root cause resolved: initStep5() CTA was calling window.location.reload()
after saving payment method to session. Nothing server-side triggered
the payment processor on reload, so the page re-rendered step 5 indefinitely.

New endpoint:
- POST bookit/v1/wizard/complete registered in class-wizard-api.php
  Rate limited (wizard_book, 10/hr/IP), CSRF via existing check_permission()
  Delegates to process_pay_on_arrival() or process_use_package()
  Returns { success, booking_id, redirect_url }
  Card/PayPal/Stripe return 400 payment_method_not_available (Sprint 5)
  use_package_{id} values normalised: package ID extracted, customer_package_id
  written to session, routed to process_use_package()

Modified files:
- includes/api/class-wizard-api.php: complete_booking() method + route
- includes/payment/class-payment-processor.php: process_use_package()
  changed from private to public (REST layer needs direct access)
- public/assets/js/booking-wizard-v2.js: initStep5() CTA handler replaces
  window.location.reload() with fetch() to /wizard/complete; button
  disabled + "Confirming…" during request; restores on error
- tests/unit/test-wizard-api.php: 5 new tests added; rate-limit transient
  reset in setUp() to prevent 429 in repeated test runs

---

Sprint Pages-V2: Auto-create V2 Pages on Activation

Modified files:
- includes/class-bookit-activator.php: two new wp_insert_post blocks
  added after my-packages creation, using identical get_page_by_path()
  duplicate guard pattern:
  - /book-v2/ — title "Book Online", content [bookit_wizard_v2]
  - /booking-confirmed-v2/ — title "Booking Confirmed",
    content [bookit_booking_confirmed_v2]

---

Known deferred items carried forward to Sprint 5:
- "Add to calendar" button on V2 confirmation page is a placeholder
  (links to /book/ical?booking_id=X; .ics endpoint not yet built)
- Card and PayPal payments via V2 wizard return 400 until live Stripe
  keys and Sprint 5 wiring are complete
- bookit_confirmed_v2_url stored as wp_option; default is
  home_url('/booking-confirmed-v2/') — no admin UI to change it yet

Next: Sprint 5 (Live Environment)
- Brevo account setup, domain verification, SPF/DKIM, verified sender
- Stripe live mode + V2 card payment wiring
- Google Calendar OAuth (requires live domain for redirect URI)
- End-to-end email testing with real Brevo credentials
- Brevo template creation + template ID mapping
- .ics calendar download endpoint
- [bookit_my_packages] customer page (deferred from Sprint 4G)


Update 30/03/26:

DB Schema Audit: ✅ Pre-Sprint 5 Housekeeping — COMPLETE

Test suite: 813 → 816 tests (+3), 0 failures
Commits: 2

─────────────────────────────────────────────

Full schema audit conducted across all 17 tables, cross-referencing
schema.sql, class-bookit-database.php, class-bookit-activator.php,
migrations 0001–0010, booking-creator, stripe-webhook, dashboard
bookings API, package APIs, email queue, and notification dispatcher.

19 issues identified and triaged. 6 fixed now, remainder deferred
to Sprint 5 or intentionally accepted.

─────────────────────────────────────────────

Commit 1 — schema.sql + create_settings_table alignment
Tests: 813 → 813 (no change), 0 failures

Fixed:
- Issue 1: Added cooling_off_waiver_given + cooling_off_waiver_at
  to schema.sql TABLE 7. Columns existed in live DB via migration
  0004 (Sprint 4C) but were missing from the reference document.
- Issue 3: Added setting_type ENUM to create_settings_table() in
  class-bookit-database.php, between setting_value and autoload.
  Removed the ad-hoc ALTER TABLE + SHOW COLUMNS guard from
  class-bookit-activator.php. Column now created via dbDelta on
  fresh install; activator no longer bypasses the migration pattern.

─────────────────────────────────────────────

Commit 2 — bookings table alignment, dead table removal, queue fix
Tests: 813 → 816 (+3), 0 failures

Fixed:
- Issue 2: Added booking_reference column and UNIQUE KEY
  uq_booking_reference to create_bookings_table() in
  class-bookit-database.php. lock_version was already present.
  Fresh installs now get these columns from dbDelta rather than
  relying solely on migrations 0001/0003.
- Issue 14: Dropped wp_bookings_working_hours (dead table).
  Confirmed via code search that class-datetime-model.php queries
  exclusively wp_bookings_staff_working_hours. The simple table
  had no data and was never queried. Migration 0011 drops it;
  down() recreates it for reversibility. create_working_hours_table()
  retained with deprecation docblock, call removed from
  create_tables(). table count log updated 11 → 10. schema.sql
  TABLE 9 removed, tables 10–16 renumbered to 9–15. test_all_tables_exist
  updated: no longer expects bookings_working_hours, positively
  asserts bookings_staff_working_hours is present.
- Issue 16: Added Bookit_Email_Queue::rescue_stuck_processing() —
  resets any queue item stuck in 'processing' for more than 5
  minutes back to 'pending'. Hooked at the start of
  Bookit_Notification_Dispatcher::process_email_queue_item() so
  every queue processing run clears stale items before new work
  begins. Protects against PHP process kills on shared hosting.
  3 new PHPUnit tests.

─────────────────────────────────────────────

Issues deferred to Sprint 5:
- Issue 5:  Refund state not shown on booking row (build alongside
            Stripe refund feature)
- Issue 7:  No state transition enforcement in update_booking()
- Issue 9:  stripe_session_id missing index (add on live DB)
- Issue 12: balance_payment missing from payments ENUM (build
            alongside balance collection feature)
- Issue 13: POA bookings create no payment record (build alongside
            dashboard mark-as-paid flow)

Issues intentionally accepted / deferred indefinitely:
- Issue 4:  magic_link_token — build when cancellation links built
- Issue 6:  'pending' status reserved for future approval workflow
- Issue 8:  total_bookings/total_spent — computed on demand, not cached
- Issue 15: Email queue not in uninstall — uninstall delete path
            not yet enabled
- Issue 19: Migration-added tables missing from uninstall drop list —
            same reason

Next: Sprint 5 (Live Environment)



─────────────────────────────────────────────

Update 03/04/26 — Sprint 5: Brevo Live Activation

Status: Brevo transactional email working end-to-end on live server.

## Live Site Setup (test.wimbledonsmart.co.uk / Hostinger)

### Issues resolved during first live deployment:

1. Dashboard login loop (LiteSpeed cache)
   - Root cause: LiteSpeed was caching POST requests to /bookit-dashboard/
   - Fix: Added /bookit-dashboard/, /bookit-dashboard/app/,
     /bookit-dashboard/setup/ to LiteSpeed Private Cached URIs
   - Additional pages added to exclude list:
     /bookit-dashboard/logout/, /book/, /booking-confirmed/,
     /booking-confirmed-v2/, /my-packages/, /wp-json/bookit/

2. Rate limiter lockout after repeated failed login attempts
   - Root cause: Stale session cookie in browser after cache fix
   - Fix: Clear browser cookies for site; rate limit transient
     expires automatically after 15 minutes

3. Brevo provider fatal error — Class "Brevo\Client\Configuration" not found
   - Root cause: getbrevo/brevo-php v4 is a full SDK rewrite.
     The old Brevo\Client\* namespace no longer exists. Provider
     code was written against the old API.
   - Fix: Rewrote class-bookit-brevo-email-provider.php for v4 SDK:
     · Entry point: \Brevo\Brevo (unified client)
     · Request: \Brevo\TransactionalEmails\Requests\SendTransacEmailRequest
     · Sender/To types: SendTransacEmailRequestSender /
       SendTransacEmailRequestToItem
     · Errors: BrevoApiException (429 → brevo_rate_limited),
       BrevoException (→ brevo_send_failed)
     · Class names verified against vendor/composer/autoload_classmap.php
       (sole source of truth — all online docs including Context7 are stale
       for v4)
   - Tests: 816 → 821 (+5 new unit tests for provider), 0 failures

4. Missing PSR-18 HTTP client
   - Root cause: Brevo v4 SDK dropped hard Guzzle dependency in favour
     of PSR-18. Guzzle must now be explicitly required.
   - Fix: Added "guzzlehttp/guzzle": "^7.0" to composer.json require
   - Note: Unit tests did not catch this because tests mock the SDK
     classes — real HTTP client is never instantiated in unit tests.
     This class of issue (missing runtime dependencies) requires
     integration/live testing to catch.

### Deployment process established for Hostinger:
- Run locally: composer install --no-dev --optimize-autoloader
  --classmap-authoritative -> this is not confirmed yet.
- Zip bookit-booking-system/ folder
- WordPress admin → Plugins → Deactivate → Delete → Upload → Activate
- Note: vendor/ and dist/ are gitignored — both must be built locally
  before zipping

### Brevo configuration confirmed working:
- Account: Brevo free plan (300 emails/day)
- DNS: SPF + DKIM configured on wimbledonsmart.co.uk (Brevo-assisted)
- Sender verified in Brevo dashboard
- API key saved in Bookit Dashboard → Settings → Email
- Provider: Brevo (not wp_mail fallback)
- Test email sent and received successfully ✅

Test suite: 821 tests, 0 failures

Next: Continue Sprint 5
- Brevo template creation + template ID mapping
- Stripe live mode + package purchase routing
- Google Calendar OAuth
- SMS queue + dispatcher SMS path
- Explore Brevo MCP server for email management


─────────────────────────────────────────────
Update 04/04/26 — Sprint 5A: Local Buildable Work — COMPLETE
Sprint 5A: ✅ 6/6 tasks complete
Test suite: 821 → 861 tests (+40), 0 failures
─────────────────────────────────────────────
Task 5A-1 — DB Schema Fixes (Issues 4, 7, 12, 13)
Tests: 821 → 829 (+8), 0 failures
New migrations:

0012-add-magic-link-token.php: VARCHAR(64) magic_link_token column

idx_magic_link_token index on wp_bookings


0013-add-balance-payment-type.php: MODIFY payment_type ENUM on
wp_bookings_payments to include 'balance_payment'
0014-backfill-magic-link-tokens.php: per-record loop backfill of
magic_link_token for all existing bookings

Application changes:

class-booking-creator.php: generates and stores magic_link_token
immediately after lock_version on every new booking
class-dashboard-bookings-api.php: get_allowed_transitions() static
map + transition guard in update_booking() — returns E2005 (HTTP 422)
on invalid transition; audit log fired on block
class-payment-processor.php: process_pay_on_arrival() now inserts
a payment record (payment_method='pay_on_arrival', status='pending')
class-bookit-database.php: create_payments_table() ENUM updated to
include 'balance_payment' for fresh installs
error-codes.php: E2005 INVALID_STATUS_TRANSITION registered

Resolved schema audit issues:

Issue 4: magic_link_token — built alongside cancellation links ✅
Issue 7: state transition enforcement in update_booking() ✅
Issue 12: balance_payment added to wp_bookings_payments ENUM ✅
Issue 13: POA bookings now create payment record ✅

─────────────────────────────────────────────
Task 5A-2 — .ics Calendar Download Endpoint
Tests: 829 → 847 (+18 across 5A-2 and addendum), 0 failures
New endpoint: GET bookit/v1/wizard/ical

Public, authenticated via hash_equals() on magic_link_token
RFC 5545 compliant .ics with CRLF line endings
Business timezone used for DTSTART/DTEND
Raw delivery via rest_pre_serve_request filter (same as CSV export)
fetch_and_build_ical() + build_ical_content() separation for
testability; no exit() — test-compatible
UID: booking_reference + site host (globally unique)
DESCRIPTION: booking reference, Cancel URL, Reschedule URL

Wire-ups:

booking-confirmed-v2.php "Add to Calendar" button linked to real
endpoint with booking_id + magic_link_token params
class-booking-retriever.php: Stripe path now selects magic_link_token

Addendum — cancel/reschedule links in email:

.ics DESCRIPTION extended with Cancel and Reschedule URLs
class-email-sender.php generate_customer_email(): "Need to make
changes?" section added with Reschedule + Cancel buttons (inline CSS)
Section silently omitted when magic_link_token is absent (old bookings)
3 additional PHPUnit tests

─────────────────────────────────────────────
Task 5A-3 — Magic Link Cancellation & Rescheduling
Tests: 847 → 841 (net; 5A-3a added 12, 5A-3b added 0, fix added 0)
Note: 5A-2 addendum tests interleaved — combined net is tracked above.
All 861 final tests pass, 0 failures.
5A-3a — Backend:
New REST endpoints (public, permission_callback: __return_true):

POST bookit/v1/wizard/cancel
· hash_equals() token auth, rate limited 10/hr/IP (magic_cancel)
· Policy window check via cancellation_window_hours setting
· Sets status=cancelled, cancelled_by=customer, deleted_at (soft delete)
· Fires bookit_after_booking_cancelled + enqueues booking_cancelled email
POST bookit/v1/wizard/reschedule
· hash_equals() token auth, rate limited 10/hr/IP (magic_reschedule)
· Slot conflict check, end_time recalculated from service duration
· Fires bookit_booking_rescheduled + enqueues booking_rescheduled email

New shortcodes: [bookit_cancel_booking], [bookit_reschedule_booking]
New pages auto-created on activation: /bookit-cancel/, /bookit-reschedule/
Key finding: cancellation_window_hours is the live setting key
(not cancellation_notice_hours as in sprint doc) — Cursor read the
codebase and used the correct key.
5A-3b — Frontend templates:

public/templates/cancel-booking.php: V2 card layout, booking summary,
policy notice (blue-grey tinted), PHP policy window pre-check,
Confirm Cancellation button, vanilla JS IIFE fetch + success/error states
public/templates/reschedule-booking.php: V2 card layout, PHP calendar
grid via Bookit_DateTime_Model (bank holidays blocked), day tap →
GET bookit/v1/wizard/timeslots fetch → slot buttons → Confirm button
public/assets/css/magic-link-pages.css: scoped to
.bookit-magic-link-page; --bookit-* tokens only, no hardcoded colours

Fix — class-datetime-api.php:

get_timeslots() extended to accept optional service_id and staff_id
query args (falls back to session for wizard — existing tests unaffected)
Required for reschedule page which has no active wizard session

─────────────────────────────────────────────
Task 5A-4 — bookit_confirmed_v2_url Admin UI
Tests: → 852 (+2), 0 failures

Settings.vue: new "Booking" card (admin only) with
"V2 Booking Confirmed Page URL" field
class-dashboard-bookings-api.php: bookit_confirmed_v2_url added to
allowed keys; get_settings() merges from get_option(); update_settings()
routes to update_option()/delete_option() — skips wp_bookings_settings
upsert (this key lives in wp_options, not the settings table)
esc_url_raw + FILTER_VALIDATE_URL validation on write
Empty string clears option so default (home_url('/booking-confirmed-v2/'))
applies again

─────────────────────────────────────────────
Task 5A-5 — Admin Email Queue Log View
Tests: 852 → 858 (+6), 0 failures
New endpoint: GET bookit/v1/dashboard/email-queue

Admin only (bookit_staff → 403)
Paginated (page, per_page up to 100, status filter)
Returns: id, booking_id, email_type, recipient_email, status,
attempts, max_attempts, scheduled_at, sent_at, last_error, created_at
html_body, subject, params excluded (too large for log view)

New Vue view: EmailQueue.vue

Table with status badges (pending=grey, processing=blue, sent=green,
failed=red, cancelled=grey)
Attempts shown as X / Y
last_error truncated to 60 chars, full text in title attribute
Status filter dropdown, pagination, empty state
Admin guard via BOOKIT_DASHBOARD.staff.role

Route: /email-queue (requiresAdmin: true)
Sidebar: "Email Queue" under Reports (admin only, 📧 icon)
─────────────────────────────────────────────
Task 5A-6 — Brevo Template ID Settings
Tests: 858 → 861 (+3), 0 failures
Six new settings keys (stored in wp_bookings_settings as integer strings):

brevo_template_booking_confirmed
brevo_template_booking_cancelled
brevo_template_booking_rescheduled
brevo_template_magic_link_cancel
brevo_template_magic_link_reschedule
brevo_template_business_notification

class-bookit-brevo-email-provider.php:

get_template_id_for_email_type() maps email_type slug → setting key
send(): templateId branch when setting is a positive integer;
htmlContent fallback when not set (existing behaviour unchanged)
SDK note: getbrevo/brevo-php v4 uses PSR-4 (not classmap); v4
SendTransacEmailRequest uses constructor array keys (no setters);
confirmed by reading vendor source directly
invoke_brevo_send() extracted for testability (no exit, no live HTTP)
Dispatcher now merges email_type into $params before send()
Magic-link queue rows use magic_link_cancel / magic_link_reschedule
slugs to match template settings keys

EmailSettings.vue:

"Brevo Email Templates" sub-section inside email_provider === 'brevo'
conditional; six numeric inputs, one per notification type

─────────────────────────────────────────────
Sprint 5A deferred items carried to Sprint 5B:

Stripe live keys — V2 wizard card/PayPal payments return 400 until wired
Stripe package purchase routing (deferred from Sprint 4D)
Google Calendar OAuth (requires live redirect URI on Hostinger)
stripe_session_id missing index on live DB (Issue 9, schema audit)
LiteSpeed cache exclusions needed for new pages:
/bookit-cancel/, /bookit-reschedule/
Brevo email template creation in Brevo dashboard (client-facing,
post-launch — template ID fields ready in plugin settings)

Next: Sprint 5B (Live Environment)

---

## BACKLOG

### INVOICE GENERATION (Phase 1.5)
**Priority:** High — required before first client go-live with payments
**Estimated effort:** 10–14 hours
**Migration:** 0016

**Scope:**
- Native PDF invoice generation using DOMPDF (no third-party plugin dependency)
- VAT-aware: `business_vat_number` setting — empty = standard invoice, populated = full VAT invoice
- Sequential gapless invoice numbering with configurable prefix (e.g. INV-2025-001)
- Two-document deposit flow: Invoice at deposit payment + Invoice at balance payment
- Single-document full-payment flow
- Pay-on-arrival invoice issued at time of payment recording
- Voided deposits (cancellation, forfeited): existing invoice stands — no credit note, VAT remains due
- PDF attached to Brevo confirmation email
- PDF downloadable from customer dashboard and admin booking detail view
- PDFs stored in WP uploads (`bookit/invoices/YYYY/MM/`) — retained 6 years (HMRC requirement)

**New settings keys required:**
| Key | Type | Notes |
|-----|------|-------|
| `invoice_prefix` | VARCHAR | e.g. `INV`, configurable per client |
| `business_vat_number` | VARCHAR | Empty = non-VAT registered; non-empty = full VAT invoice |

**Phase 2 extension (accounting integrations):**
- Xero REST API — priority 1 (dominant UK accountant platform)
- QuickBooks Online API — priority 2
- Both as separate Bookit extension plugins, not core
- Note: every existing WordPress Xero/QuickBooks plugin requires WooCommerce — no off-the-shelf option exists for a custom booking system

**DB Schema — `wp_bookings_invoices` (migration 0016):**
```sql
CREATE TABLE wp_bookings_invoices (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  invoice_number        INT UNSIGNED NOT NULL,
  invoice_prefix        VARCHAR(20) NOT NULL DEFAULT 'INV',

  booking_id            BIGINT UNSIGNED NOT NULL,
  payment_id            BIGINT UNSIGNED NOT NULL COMMENT 'The wp_bookings_payments row this invoice covers',
  customer_id           BIGINT UNSIGNED NOT NULL,

  parent_invoice_id     BIGINT UNSIGNED DEFAULT NULL COMMENT 'Set on balance invoice; references deposit invoice id',

  invoice_type          ENUM('deposit', 'balance', 'full_payment', 'pay_on_arrival') NOT NULL,
  status                ENUM('draft', 'issued', 'void') NOT NULL DEFAULT 'issued',

  -- Business snapshot (at time of issue)
  business_name         VARCHAR(255) NOT NULL,
  business_address      TEXT NOT NULL,
  business_email        VARCHAR(255) NOT NULL,
  business_phone        VARCHAR(20) DEFAULT NULL,
  business_vat_number   VARCHAR(30) DEFAULT NULL COMMENT 'NULL = non-VAT-registered',

  -- Customer snapshot
  customer_name         VARCHAR(255) NOT NULL,
  customer_email        VARCHAR(255) NOT NULL,
  customer_address      TEXT DEFAULT NULL,

  -- Service snapshot
  service_name          VARCHAR(255) NOT NULL,
  service_description   TEXT DEFAULT NULL COMMENT 'e.g. with Emma, 45 min, 14 Apr 2026 at 10:00',
  appointment_date      DATE NOT NULL,
  appointment_time      TIME NOT NULL,
  staff_name            VARCHAR(255) NOT NULL,

  -- Financials (GBP)
  subtotal_amount       DECIMAL(10,2) NOT NULL COMMENT 'Amount before VAT',
  vat_rate              DECIMAL(5,2) DEFAULT NULL COMMENT 'e.g. 20.00; NULL if not VAT-registered',
  vat_amount            DECIMAL(10,2) DEFAULT NULL COMMENT 'NULL if not VAT-registered',
  total_amount          DECIMAL(10,2) NOT NULL COMMENT 'Amount this invoice covers (inc. VAT if applicable)',
  booking_total_price   DECIMAL(10,2) NOT NULL COMMENT 'Full service price snapshot',

  -- HMRC tax point
  tax_point_date        DATE NOT NULL COMMENT 'Date payment received — sets the VAT period',
  invoice_date          DATE NOT NULL COMMENT 'Date invoice was generated',

  -- PDF storage
  pdf_path              VARCHAR(500) DEFAULT NULL COMMENT 'Relative to WP uploads: bookit/invoices/YYYY/MM/filename.pdf',
  pdf_generated_at      DATETIME DEFAULT NULL,

  -- Audit
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  voided_at             DATETIME DEFAULT NULL,
  voided_reason         TEXT DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_invoice_number (invoice_prefix, invoice_number),
  KEY idx_booking_id   (booking_id),
  KEY idx_payment_id   (payment_id),
  KEY idx_customer_id  (customer_id),
  KEY idx_parent       (parent_invoice_id),
  KEY idx_invoice_date (invoice_date),
  KEY idx_tax_point    (tax_point_date),
  KEY idx_status       (status),
  KEY idx_issued_date  (invoice_date, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


Update 07/04/26 — Sprint 5B: Live Environment — COMPLETE
Sprint 5B: ✅ 5/5 tasks complete (+ 4 deferred sub-tasks)
Test suite: 861 → 880 tests (+19), 0 failures
─────────────────────────────────────────────

5B-0 — Pre-Flight Deployment Steps
LiteSpeed cache exclusions confirmed for /bookit-cancel/ and
/bookit-reschedule/ (added to Private Cached URIs in Hostinger).
idx_stripe_session_id index added manually to live DB via phpMyAdmin
(also now in schema.sql for fresh installs — was missing from live DB
created before the audit fix).
All four plugin pages verified present and published on live site:
/book-v2/ [bookit_wizard_v2]
/booking-confirmed-v2/ [bookit_booking_confirmed_v2]
/bookit-cancel/ [bookit_cancel_booking]
/bookit-reschedule/ [bookit_reschedule_booking]

─────────────────────────────────────────────
5B-1 — Stripe Configuration (Test Mode)
Decision: Remaining in Stripe test mode throughout Sprint 5B.
Live keys deferred until first client go-live.
Test webhook registered in Stripe Dashboard pointing to:
https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/stripe/webhook
Events: checkout.session.completed, charge.refunded
Webhook signing secret saved in plugin settings.
Test keys confirmed reading from wp_bookings_settings (not wp_options).

─────────────────────────────────────────────
5B-2 — V2 Wizard Card/PayPal + Package Stripe Routing + Refund State

Part A — V2 wizard card payment wiring:
Tests: 861 → 865 (+4), 0 failures

class-stripe-config.php: fixed to read Stripe keys from
wp_bookings_settings via $wpdb->get_var() — was incorrectly using
get_option('bookit_stripe_*') which did not match what the dashboard
writes; keys were never being found.
class-wizard-api.php: complete_booking() — card + V2 session →
normalised to stripe before switch; stripe case creates Checkout
Session via Booking_System_Stripe_Checkout and returns
{ success: true, redirect_url: $session->url }; paypal case returns
HTTP 501 PAYMENT_METHOD_NOT_SUPPORTED.
wizard_version read from Bookit_Session_Manager::get_data() only —
never trusts client-posted value.
class-stripe-checkout.php: create_checkout_session() returns
['session_id' => ..., 'redirect_url' => ...] array for V2;
plain session ID string for V1 (backward compatible).
V2 success_url uses trailingslashit() for base URL — fixes
{CHECKOUT_SESSION_ID} placeholder not being replaced by Stripe.
Metadata cast fix: $session->metadata->toArray() used in webhook
handler instead of (array) cast which fails on Stripe\StripeObject
on MariaDB/live environment.
PAYMENT_METHOD_NOT_SUPPORTED error code registered in error-codes.php.

Part B — Package purchase Stripe routing (buy & book in one step):
Tests: 865 → 870 (+5), 0 failures

Decision: Buy + book in one step (Option B) — webhook creates
both customer_package row and booking atomically; no two-step flow.
class-wizard-api.php: buy_{id} payment method detected, package type
looked up, charge amount calculated (fixed price or discount against
service price), calls create_package_checkout_session().
class-stripe-checkout.php: new create_package_checkout_session()
method — flow_type=package metadata, full booking + package fields
in metadata (PHP session not relied on in webhook), success_url routes
to /booking-confirmed-v2/?session_id={CHECKOUT_SESSION_ID}.
class-stripe-webhook.php: flow_type=package routes to new
handle_package_purchase_completed(); DB transaction wraps:
find/create customer → insert wp_bookings_customer_packages →
create booking (payment_method=package_redemption) → SQL decrement
sessions_remaining → insert redemption record → insert payment record
→ COMMIT; idempotency key: stripe_pkg_{session_id}.
PACKAGE_PRICE_INVALID error code registered.

MariaDB JSON_CONTAINS fix:
booking-wizard-v2-step-5.php was using JSON_CONTAINS(col, CAST(%d AS
JSON)) which fails silently on MariaDB 11.4 (Hostinger). Fixed by
removing JSON_CONTAINS from both package queries entirely and
replacing with PHP-side filtering using json_decode() + in_array(),
matching the established pattern in class-available-packages-api.php.
This is now the project-wide rule: applicable_service_ids filtering
is always done in PHP, never in SQL JSON functions.

Part C — Refund state:
Tests: 870 → 875 (+5), 0 failures

Migration 0015: ADD COLUMN refunded_amount DECIMAL(10,2) NULL DEFAULT
NULL on wp_bookings; column_exists() guards in up() and down();
schema.sql updated.
class-stripe-webhook.php: handle_charge_refunded() —
lookup booking by payment_intent_id; update refunded_amount
(cumulative from Stripe amount_refunded); full refund
(refunded_amount >= total_price) sets status=cancelled,
cancelled_by='0' (system-initiated, bypasses admin guard);
inserts wp_bookings_payments row with payment_type=refund,
negative amount, payment_status=refunded or partially_refunded;
fires booking.refunded audit log; returns true on no booking found
(may be package payment, not booking payment).

─────────────────────────────────────────────
5B-2d — Hide Pay by Card/PayPal when charge amount is zero
Tests: 875 → 880 (+5, including fix), 0 failures

includes/wizard-v2-payment-amounts.php: new helper
bookit_v2_stripe_charge_amount() returns deposit_due when has_deposit
is true, 0.0 when has_deposit is false (no-deposit service = nothing
charged online now, pay in full on arrival).
booking-wizard-v2-step-5.php: $show_online_payment = charge > 0;
Pay by Card and PayPal rows both wrapped in this condition; Pay in
person becomes default selection (class + checked attribute) when
both hidden; showOnlinePayment passed to JS via wp_json_encode.
booking-wizard-v2.js: null-check guards on cardRow/cardRadio
references; package deselect fallback uses showOnlinePayment flag.

─────────────────────────────────────────────
5B-2e — Notification emails in Stripe webhook
Tests: 875 → 877 (+2), 0 failures

class-stripe-webhook.php: private helper
send_booking_confirmation_emails_after_webhook($booking_id) added —
retrieves full booking via Booking_System_Booking_Retriever,
calls send_customer_confirmation() and send_business_notification();
called from both handle_booking_checkout_completed() and
handle_package_purchase_completed() after idempotency transient set;
email failures are best-effort and do not block webhook 200 response;
handle_charge_refunded() intentionally excluded.

─────────────────────────────────────────────
5B-2f — Add to Calendar link in customer confirmation email
Tests: 877 → 878 (+1), 0 failures

class-email-sender.php: "Add to Calendar" button added as first
button in "Need to make changes?" section, linking to
GET bookit/v1/wizard/ical?booking_id=X&token=Y (token param confirmed
from reading class-wizard-api.php endpoint registration);
silently omitted when magic_link_token absent (same guard as
Reschedule/Cancel buttons).

─────────────────────────────────────────────
5B-3 — Brevo Templates + End-to-End Email Testing

Decision: Brevo template variable wiring deferred to Sprint 6.
Current architecture passes pre-rendered HTML as html_body — template
ID mode would receive no params for variable substitution and render
blanks. Pre-rendered HTML emails work correctly for Phase 1 launch.

End-to-end email testing confirmed on live site:
✅ Customer confirmation email (POA and Stripe)
✅ Business notification email
✅ Magic link cancel — cancellation email delivered
✅ Magic link reschedule — rescheduled confirmation email delivered
✅ Add to Calendar button downloads valid .ics file
✅ All emails include Cancel and Reschedule magic links

─────────────────────────────────────────────
5B-4 — Magic Link Edge Case Testing

All edge cases confirmed on live site:
✅ Invalid token → "Invalid or expired link" message
✅ Already cancelled booking → appropriate error shown
✅ Within cancellation window → blocked with correct message
✅ Rate limiting → 11th request returns rate limit message

─────────────────────────────────────────────
Sprint 5B deferred items carried to Sprint 6:

Stripe live keys — deferred until first client go-live; switch is
5 minutes of config (swap keys, register live webhook, flip mode)
Brevo template variable wiring — params not passed to Brevo send();
pre-rendered HTML fallback works for Phase 1
Google Calendar OAuth — requires live redirect URI (still deferred)

Key technical decisions and findings this sprint:
- class-stripe-config.php must read from wp_bookings_settings
  (not get_option) — matches dashboard save path
- applicable_service_ids filtering: always PHP json_decode+in_array,
  never SQL JSON_CONTAINS (MariaDB 11.4 incompatibility confirmed)
- bookit_v2_stripe_charge_amount() returns 0.0 when has_deposit=false
  (no-deposit service charges nothing online; full amount on arrival)
- wizard_version always from Bookit_Session_Manager::get_data() only
- Stripe metadata->toArray() required for StripeObject (not (array))
- trailingslashit() required on V2 success_url base for placeholder
  replacement to work
- DB transaction pattern for package purchase: customer_package +
  booking + redemption + payment all atomic with ROLLBACK on failure
- charge.refunded returns true (HTTP 200) when no booking found —
  prevents Stripe retry loop for package payments

Next: Sprint 6

Update 10/04/26 — Sprint 6A: Staff Notification System — COMPLETE
Sprint 6A: ✅ 10/10 tasks complete
Test suite: 880 → 928 tests (+48), 0 failures
─────────────────────────────────────────────

6A-1 — Fire Missing Hooks
Tests: 880 → 886 (+6), 0 failures

bookit_booking_rescheduled now fires from update_booking() in
class-dashboard-bookings-api.php when booking_date or start_time
changes. The hook was already firing from reschedule_booking_magic_link()
in class-wizard-api.php (confirmed from code — TODO comment in loader
was outdated and removed).

bookit_booking_reassigned is a new hook added to update_booking()
when staff_id changes. Fires after DB update succeeds, passing
($booking_id, $old_staff_id, $new_staff_id, $update_data). Old staff ID
read from $existing array (pre-update DB row) — no extra query.

Hook documented in Extension_Plugin_API_Spec.md following existing
hook documentation pattern. File was absent from repo; created at
bookit-booking-system/Extension_Plugin_API_Spec.md.

New test file: tests/unit/test-sprint6a-hooks.php (6 tests).

─────────────────────────────────────────────
6A-2 — DB Schema: notification_preferences + digest queue
Tests: 886 → 893 (+7), 0 failures

Migration 0016: ADD COLUMN notification_preferences LONGTEXT NULL
DEFAULT NULL on wp_bookings_staff. NULL default (not JSON default) —
MariaDB 10.x does not support non-literal defaults on TEXT columns.
column_exists() guard in up() and down(). schema.sql updated.

Migration 0017: CREATE TABLE wp_bookit_notification_digest_queue —
columns: id, staff_id, event_type ENUM, booking_id, processed, created_at;
indexes: idx_staff_event_processed (staff_id, event_type, processed),
idx_booking_id. table_exists() helper uses information_schema.tables
with exact match (avoids SHOW TABLES LIKE underscore wildcard issue).
schema.sql updated.

New test file: tests/unit/test-sprint6a-migrations.php (7 tests).
Note: test_migration_0017_creates_digest_queue_table simplified to not
test down() — table pre-exists from plugin activation in wp-env, making
down() assertion unreliable. idempotency and column presence tested
instead.

─────────────────────────────────────────────
6A-3 — Bookit_Staff_Notifier (Immediate Dispatch Path)
Tests: 893 → 904 (+11), 0 failures

New class: includes/notifications/class-bookit-staff-notifier.php
Static-only class following Bookit_Package_Expiry pattern.

Hooks into:
- bookit_after_booking_created → assigned staff + all admin staff
- bookit_booking_rescheduled → same recipients, reschedule preference
- bookit_after_booking_cancelled → same recipients, cancellation preference
- bookit_booking_reassigned → new assignee + admins via new_booking
  preference; old assignee via cancellation preference

Deduplication: array_unique() on staff IDs before iterating — staff
member appears at most once per event regardless of qualifying reasons.

Routing:
- immediate preference → Bookit_Notification_Dispatcher::enqueue_email()
- daily / weekly preference → insert into wp_bookit_notification_digest_queue

Email types: staff_new_booking_immediate, staff_reschedule_immediate,
staff_cancellation_immediate, staff_reassigned_to_immediate,
staff_reassigned_away_immediate.

Skip rules: inactive staff, deleted staff, empty email (audit log entry
fired on empty email skip: staff_notification.skipped_no_email).

Registered via Bookit_Staff_Notifier::init() in class-bookit-loader.php
define_cron_hooks(), immediately after Bookit_Package_Expiry::init().

New test file: tests/unit/test-staff-notifier.php (11 tests).

─────────────────────────────────────────────
6A-8 — Retire send_business_notification() from New Booking Flow
Tests: 904 → 905 (+1), 0 failures

Removed send_business_notification() call from:
1. create_manual_booking() in class-dashboard-bookings-api.php
   (inside the if ($send_confirmation) block)
2. send_booking_confirmation_emails_after_webhook() in
   class-stripe-webhook.php

send_business_notification() method itself preserved in
class-email-sender.php — only call sites removed.

Replacement comment added at both removed call sites:
// Business notification removed Sprint 6A-8 — replaced by
// Bookit_Staff_Notifier which sends to all admin-role staff
// via their preference settings.

Existing test-stripe-v2-wiring.php updated — tests no longer expect
business_notification queue row.

New test: test_new_booking_does_not_call_send_business_notification
added to test-dashboard-bookings-api.php (1 test).

─────────────────────────────────────────────
6A-4 — Digest Cron Jobs
Tests: 905 → 914 (+9), 0 failures

Three new cron classes, all following Bookit_Package_Expiry pattern
exactly (static, init/register/unregister/run_with_tracking):

Bookit_Staff_Digest_Daily (includes/cron/class-bookit-staff-digest-daily.php)
- Hook: bookit_staff_digest_daily
- Schedules daily at staff_digest_send_time setting (default 18:00)
  in business timezone
- Drains wp_bookit_notification_digest_queue for preference = 'daily'
- Marks rows processed = 1 BEFORE enqueuing (prevents double-send)
- Skips bookings with status = 'cancelled' or deleted_at IS NOT NULL
- Skips inactive/deleted staff and staff with no email
- email_type: staff_daily_digest

Bookit_Staff_Digest_Weekly (includes/cron/class-bookit-staff-digest-weekly.php)
- Hook: bookit_staff_digest_weekly
- Schedules weekly on staff_digest_weekly_day (default 1 = Monday)
  at staff_digest_send_time
- Same logic as daily but filters preference = 'weekly'
- Registers 'weekly' schedule via cron_schedules filter in init()
  (not register_cron) so it is active at runtime
- email_type: staff_weekly_digest

Bookit_Staff_Schedule_Daily (includes/cron/class-bookit-staff-schedule-daily.php)
- Hook: bookit_staff_schedule_daily
- Schedules daily at staff_schedule_send_time setting (default 08:00)
- Queries opted-in staff (daily_schedule = true in preferences)
- Skips staff with no bookings today — no email on empty days
- email_type: staff_daily_schedule

All three: registered in class-bookit-activator.php, unregistered in
class-bookit-deactivator.php, init() called from class-bookit-loader.php.

New test file: tests/unit/test-staff-digest-cron.php (9 tests).

─────────────────────────────────────────────
6A-5 — My Profile: Notification Preferences UI
Tests: 914 → 919 (+5), 0 failures

GET /dashboard/profile extended to include notification_preferences
object (decoded from JSON, merged with defaults) in profile response.

New endpoint: PUT /dashboard/profile/notification-preferences
- Authenticated (check_dashboard_permission, any role)
- Validates frequency values (immediate/daily/weekly), defaults on invalid
- Saves to notification_preferences column on current staff row only
- Cannot be used to update another staff member's preferences

MyProfile.vue: new Notification Preferences card added below Change
Password card, above My Stats section. Three dropdowns (New Booking,
Reschedule, Cancellation) + Daily Schedule Email toggle. Saves via
dedicated endpoint. Success banner 3s, error banner on failure.
Toggle uses role="switch" + aria-checked.

5 new tests added to tests/unit/test-profile-api.php.

─────────────────────────────────────────────
6A-6 — Staff Edit Form: Admin-Editable Preferences
Tests: 919 → 922 (+3), 0 failures

GET /dashboard/staff/{id} extended to include notification_preferences
(decoded, merged with defaults) in staff detail response.

PUT /dashboard/staff/{id} extended to accept notification_preferences
object. Validates each subkey individually. Admin-only (existing
check_admin_permission gate — bookit_staff role automatically blocked).

StaffFormModal.vue: new Notification Preferences section added in
edit mode only (v-if="isEditing"), below Role/Active/Display Order
fields, above Google Calendar ID. Same 3 dropdowns + toggle as profile
page. Loads on modal open, included in save payload.

3 new tests added to new file tests/unit/test-dashboard-staff-api.php.

─────────────────────────────────────────────
6A-7 — Settings: Digest Send Times + Weekly Day
Tests: 922 → 925 (+3), 0 failures

Three new settings keys added to get_allowed_settings_keys():
- staff_digest_send_time (default '18:00') — shared by daily + weekly digest
- staff_schedule_send_time (default '08:00') — daily schedule summary
- staff_digest_weekly_day (default 1 = Monday) — weekly digest day

EmailSettings.vue: new "Staff Notification Timing" card added between
Email Provider card and SMTP Configuration card. Two <input type="time">
fields + weekly day dropdown (v-model.number). Saves via existing
saveSettings() mechanism.

3 new tests added to tests/unit/test-notification-settings-api.php.

─────────────────────────────────────────────
6A-9 — Brevo Template Variable Wiring
Tests: 925 → 928 (+3), 0 failures

Root cause: Bookit_Brevo_Email_Provider::send() was not passing $params
to SendTransacEmailRequest when using a template ID. Template variables
({{ params.X }}) received nothing and rendered blank.

Fix: when $template_id > 0 and $template_params is non-empty, set
$request_values['params'] = $template_params. Internal keys (email_type,
template_id) stripped before forwarding to Brevo. SDK field confirmed
as 'params' from vendor source (vendor/getbrevo/brevo-php/src/
TransactionalEmails/Requests/SendTransacEmailRequest.php).

Note: staff notifier callers currently pass array() as params —
params pass-through is ready infrastructure but not yet populated
with booking data. When Brevo templates are created for staff
notifications, the notifier will need extending to pass booking fields.
Tracked in Future_Features_Backlog.md.

8 new email type mappings added to get_template_id_for_email_type():
staff_new_booking_immediate, staff_reschedule_immediate,
staff_cancellation_immediate, staff_reassigned_to_immediate,
staff_reassigned_away_immediate, staff_daily_digest,
staff_weekly_digest, staff_daily_schedule.

8 new brevo_template_staff_* keys added to get_allowed_settings_keys().

EmailSettings.vue: Staff Notifications sub-section added inside
Brevo Email Templates block with 8 numeric template ID inputs.

3 new tests added to tests/unit/test-brevo-email-provider.php.

─────────────────────────────────────────────
6A-10 — Security Review (OWASP Pass)
Tests: 928, 0 failures (unchanged — 2 fixes applied, no new tests)

11 files reviewed: all Sprint 5 + 6A new and modified files.

2 issues found and fixed:

Issue 1 — class-bookit-staff-notifier.php (Low)
Email subject lines included raw customer/service/date text without
sanitisation (header injection risk). Fix: sanitize_text_field()
applied to all subject fragment variables.

Issue 2 — class-wizard-api.php (Low)
Content-Disposition filename in iCal download built from booking_reference
without filesystem-safe sanitisation. Fix: sanitize_file_name() applied
to reference, with fallback to booking-{id} when empty.

Checklist results (all clean):
- Input sanitisation: all REST args use sanitize_callback/validate_callback
- DB queries: all dynamic queries use $wpdb->prepare(); IN (...) clauses
  use array_fill() + prepare() + int-cast IDs
- Auth/authz: all dashboard routes use check_dashboard_permission or
  check_admin_permission; cron classes have no REST routes
- IDOR: preferences update uses session staff ID only — not request param
- Output escaping: all email HTML uses esc_html() / esc_url()
- No JSON_CONTAINS() anywhere in new code
- Rate limiting: no new public endpoints added without rate limiting
- Brevo params: email_type and template_id stripped before forwarding

─────────────────────────────────────────────
Sprint 6A complete. Key decisions and findings:

- bookit_booking_rescheduled was already firing from magic link endpoint
  (TODO comment in loader was outdated)
- notification_preferences column uses NULL default — MariaDB 10.x
  does not support non-literal defaults on LONGTEXT columns
- SHOW TABLES LIKE with $wpdb->prepare() has underscore wildcard issue
  in MariaDB — use information_schema.tables with exact match instead
- weekly WP cron schedule registered via cron_schedules filter in
  init() not register_cron() — must be active at runtime
- Digest cron marks rows processed = 1 BEFORE enqueue — prevents
  double-send if enqueue fails (recoverable via retry system)
- send_business_notification() retired from new booking flow — replaced
  by Bookit_Staff_Notifier hooking bookit_after_booking_created
- Brevo params pass-through now wired but staff notification callers
  pass empty params — will need populating when Brevo templates created
- All staff notification email types follow *_immediate suffix convention
  for immediate dispatch path

Next: Sprint 6B


─────────────────────────────────────────────
Update 12/04/26

Sprint 6B-1: ✅ Google Calendar OAuth Integration — COMPLETE
Tests: 928 → 976 (+48), 0 failures

─────────────────────────────────────────────

SPRINT 6B-1: Google Calendar OAuth Integration
Status: COMPLETE
Branch: Phase1
Dates: April 2026
Test baseline start: 928 | Test baseline end: 976 | Delta: +48

─────────────────────────────────────────────
WHAT WAS DELIVERED
─────────────────────────────────────────────

One-way Google Calendar sync: Bookit → Google Calendar.
When a booking is created, rescheduled, or cancelled, the assigned
staff member's Google Calendar is updated automatically via a
background Action Scheduler job. Tokens are encrypted at rest.

Task 1 — Google Cloud Console Setup (manual, no code)
  One-time developer setup per client installation:
  - Create Google Cloud project
  - Enable Google Calendar API
  - Configure OAuth consent screen with calendar.events scope
  - Add staff Gmail addresses as Test Users (required — app stays
    in Testing mode for small client installations)
  - Create OAuth 2.0 Client ID (Web application type)
  - Set redirect URI to /wp-json/bookit/v1/google-calendar/callback
  - Store Client ID and Client Secret in plugin Settings

  Setup guide produced:
  - Bookit_Google_Calendar_Setup_Guide.md (v1.2)
  - Covers all steps, troubleshooting, client notes
  - Documents Test Users requirement and Access Blocked error fix

Task 2 — DB Migrations + Composer Dependency
  Tests: 928 → 931 (+3)

  Migration 0018: adds to wp_bookings_staff:
    google_oauth_access_token TEXT NULL
    google_oauth_refresh_token TEXT NULL
    google_oauth_token_expiry DATETIME NULL
    google_calendar_connected TINYINT(1) NOT NULL DEFAULT 0
    google_calendar_email VARCHAR(255) NULL

  Migration 0019: NOT created — google_calendar_event_id already
  existed in create_bookings_table() and schema.sql.

  composer.json: google/apiclient ^2.15.0 added with Calendar-only
  service cleanup (extra.google/apiclient-services: ["Calendar"]).
  Run locally: cd bookit-booking-system && composer update google/apiclient

Task 3 — Settings: Google Calendar Credentials
  Tests: 931 → 935 (+4)

  Three new settings in Dashboard → Settings (Integrations section):
  - google_client_id (plain text)
  - google_client_secret (masked as SAVED — same pattern as Brevo)
  - google_calendar_fallback_enabled (toggle)

  Fallback: when enabled, bookings where assigned staff has no Google
  connection will sync to the first connected admin calendar.

Task 4 — OAuth Connect/Disconnect Flow (per staff)
  Tests: 935 → 948 (+13, including 2 hotfixes)

  New classes:
  - includes/utils/class-bookit-encryption.php (Bookit_Encryption)
    AES-256-CBC, IV prepended to ciphertext, base64-encoded output
  - includes/integrations/class-bookit-google-calendar-api.php
    (Bookit_Google_Calendar_Api): get_auth_url, handle_callback,
    disconnect, fetch_google_account_email (from id_token JWT)
  - includes/api/class-bookit-google-calendar-rest-controller.php
    (Bookit_Google_Calendar_Rest_Controller):
    GET  bookit/v1/google-calendar/auth-url (session required)
    GET  bookit/v1/google-calendar/callback (public — Google redirect)
    POST bookit/v1/dashboard/profile/google-calendar/disconnect

  My Profile → Google Calendar card:
  - Connect / Disconnect buttons
  - Connected status with Gmail address
  - Success/error banners on return from Google OAuth
  - ?google_connected=1 and ?google_error=1 query param handling

  GET bookit/v1/dashboard/profile extended with:
    google_calendar_connected (bool)
    google_calendar_email (string)

  Key architectural decisions:
  - State nonce replaced with stateless HMAC-SHA256
    (wp_verify_nonce fails on public callback — no session)
    Format: base64(staff_id:token:expires:hmac_sig), 10-min TTL
  - hash_equals() used for timing-safe comparison
  - sanitize_text_field removed from state param (breaks base64)
  - Email extracted from id_token JWT (no extra HTTP call needed)
    wp_remote_get() to userinfo endpoint was failing on Hostinger
  - Scopes: calendar.events + openid + email (guarantees id_token)
  - home_url() used for redirect (not hardcoded domain)

Task 5 — Token Refresh Helper + Calendar Sync Class (Queue-First)
  Tests: 948 → 958 (+10)

  New class: includes/integrations/class-bookit-google-calendar.php
  (Bookit_Google_Calendar):
  - get_client_for_staff(): reads/decrypts tokens, checks expiry,
    refreshes via fetchAccessTokenWithRefreshToken(), re-encrypts
    and updates DB on refresh
  - create_event(): builds Google Calendar Event with RFC 3339
    datetimes, business timezone, inserts, stores event ID in
    wp_bookings.google_calendar_event_id
  - update_event(): updates existing event or falls back to create
  - delete_event(): deletes event, clears event ID in DB
  - process_sync_job(): Action Scheduler callback, loads full
    booking data from DB, routes to create/update/delete
  - set_test_client(): static setter for unit test mockability

  bookit_enqueue_calendar_sync($operation, $booking_id, $calendar_staff_id)
  added to includes/functions-notifications.php following exact
  same AS/WP-Cron pattern as bookit_enqueue_email().

  bookit_process_calendar_sync action registered in loader (3 args).

  Architecture: sync is ALWAYS non-blocking. Booking hook returns
  immediately. Google API call happens in background AS job.
  Follows IntegrationRequirements_Phase1.md §6.1.

  Key findings:
  - company_name setting key is business_name in this codebase
  - wp_bookings_staff keyed by id (not a separate staff_id column)
  - google/apiclient behaviour verified against vendor source directly

Task 6 — Calendar Event Content: Verify & Refine
  Tests: 958 → 964 (+6)

  All content fields verified against schema.sql before writing:
  - Summary: {service_name} — {customer_first} {customer_last}
    (em dash confirmed)
  - Start/end: EventDateTime, RFC 3339, timezone_string fallback UTC
  - Description: booking ref, customer name, phone, special requests
    (special requests line omitted when empty/null)
  - Location: business_name setting (omitted entirely if empty/whitespace)
  - Reminders: 15-minute popup (EventReminder/EventReminders)
  - ColorId: '7' (blue) for visual distinction

  build_calendar_event_from_booking() helper extracted so both
  create_event() and update_event() share identical event construction.

Task 7 — Hook Listeners + Fallback Logic
  Tests: 964 → 972 (+8)

  New class: includes/integrations/class-bookit-google-calendar-sync.php
  (Bookit_Google_Calendar_Sync):
  - init(): registers 3 hooks
  - on_booking_created(): status filter (confirmed/pending_payment only)
  - on_booking_rescheduled(): enqueues update
  - on_booking_cancelled(): enqueues delete (no status check)
  - resolve_staff_id(): fallback logic — if staff not connected,
    checks google_calendar_fallback_enabled, finds first admin with
    google_calendar_connected = 1 ORDER BY id ASC

  Architecture issue found and resolved:
  bookit_enqueue_calendar_sync() extended with optional third param
  $calendar_staff_id. process_sync_job() uses this to override the
  OAuth staff when fallback applies. DB booking row unchanged.
  delete_event() also has internal fallback for events created on
  admin calendar.

  Audit log: google_calendar.sync_skipped with notes=no_connected_staff
  when no calendar available after fallback check.

  AS args changed from associative to positional array to match
  three-parameter callback signature.

Task 8 — Staff Edit Form: Google Calendar Status (Admin View)
  Tests: 972 → 976 (+4)

  GET bookit/v1/dashboard/staff/{id} extended:
    google_calendar_connected (bool)
    google_calendar_email (string|null)
    NOTE: google_oauth_access_token, google_oauth_refresh_token,
    google_oauth_token_expiry are explicitly unset before response —
    tokens must NEVER travel over the wire. Security fix applied
    after tokens were found in initial API response.

  New endpoint:
  POST bookit/v1/dashboard/staff/{id}/google-calendar/disconnect
  - Admin only (check_admin_permission_callback — refactored to static
    for reuse across controllers without double route registration)
  - Validates id > 0 (400), staff exists (404)
  - Calls Bookit_Google_Calendar_Api::disconnect()
  - Returns { success: true }

  StaffFormModal.vue: Google Calendar card added in edit mode only
  (v-if="isEditing"), below Notification Preferences:
  - Connected state: green panel (bg-green-50), large dot with ring,
    bold Connected label, email on own line, Disconnect button
  - Not connected state: grey panel, hollow dot, italic helper text
  - Disconnect updates local refs immediately without page reload
  - googleCalendarConnected/googleCalendarEmail as dedicated refs
    (not read from staffDetails directly — avoids 0/1 vs bool issues)

─────────────────────────────────────────────
DEPLOYMENT NOTES — LIVE SITE (Hostinger)
─────────────────────────────────────────────

Three cache layers must ALL be cleared after every frontend deployment:

1. LiteSpeed Cache plugin (WordPress admin → LiteSpeed Cache →
   Manage → Purge All). Also disable JS Minify/Combine in
   Page Optimization → JS Settings.

2. Hostinger Server Cache (hPanel → Hosting → Manage →
   Cache Manager → Purge All).

3. Hostinger CDN Cache (hPanel → CDN → Purge Cache).
   This was the primary culprit — CDN serves cached JS from edge
   servers independently of WordPress and server-level purges.

Always test in incognito with DevTools cache disabled after purging.

dist/ is gitignored — must be manually built (npm run build in
bookit-booking-system/dashboard/) and uploaded via File Manager
after every Vue change. Plugin reinstall does NOT reliably replace
dist/ because WordPress preserves existing files during reinstall
when chunk filenames are unchanged.

─────────────────────────────────────────────
GOOGLE CLOUD CONSOLE — PER-CLIENT NOTES
─────────────────────────────────────────────

- Each client needs their own Google Cloud project (redirect URIs
  are domain-specific)
- OAuth app stays in Testing mode for all small client installs
- Each staff member's Gmail must be added to Test Users list in
  Google Cloud Console before they can connect (max 100 users)
- "Access blocked: has not completed the Google verification process"
  = staff Gmail not in Test Users list
- Redirect URI must exactly match (no trailing slash, https, correct
  subdomain) — mismatch causes redirect_uri_mismatch error
- Store Client Secret in password manager, not notes

Setup guide: Bookit_Google_Calendar_Setup_Guide.md (v1.2)
Located in project outputs — add to client onboarding pack.

─────────────────────────────────────────────
NEXT STEPS (decided during Sprint 6B-1)
─────────────────────────────────────────────

IMMEDIATE — Before next sprint starts:

1. Cache-busting fix (~1h)
   Add version-based cache busting to the PHP JS enqueue so the
   browser and CDN automatically fetch fresh JS after every build.
   Find where dashboard/dist/index.js is enqueued in PHP and ensure
   the version parameter is set to BOOKIT_VERSION (or equivalent).
   This eliminates the 3-layer manual cache purge after every
   frontend deployment.
   File to check: whichever PHP file calls wp_enqueue_script for
   the dashboard dist/index.js.

SHORT-TERM — Email notification hotfix sprint:
   Three bugs discovered during Sprint 6B-1 live testing:

   Bug 1: Reschedule confirmation email (to customer) is missing
   the Reschedule, Cancel, and Add to Calendar buttons. These appear
   in the booking confirmation email but not in the reschedule email.

   Bug 2: Staff member does not receive the reschedule notification
   email when a booking is rescheduled.

   Bug 3: Neither admin nor staff receive the cancellation
   notification email when a booking is cancelled.

   These are pre-existing email notification bugs from the Sprint 6A
   notification system — not introduced by Sprint 6B-1. Raise as a
   focused hotfix sprint after the cache-busting fix is done.

NEXT MAJOR SPRINT — To be decided with PA:
   Options in priority order based on project status:

   Option A: Invoice generation (~10-14h)
   Flagged as high priority before first client go-live with payments.
   Native PDF invoice generation (DOMPDF), VAT-aware, sequential
   invoice numbering. See Future_Features_Backlog.md for full spec.
   Migration 0020+ required.

   Option B: UK Compliance checklist completion
   Review UK_Compliance_Checklist_v1_0.md for any remaining items
   before first client go-live.

   Option C: Launch preparation
   First client onboarding documentation, deployment runbook,
   Stripe live key switch (5 minutes of config).

   Consult PA chat to confirm priority order and plan next sprint.

─────────────────────────────────────────────
KNOWN TECHNICAL DECISIONS FROM SPRINT 6B-1
─────────────────────────────────────────────

- wp_verify_nonce() cannot be used on public REST endpoints —
  requires session. Use stateless HMAC-SHA256 with expiry instead.
- sanitize_text_field() must NOT be applied to base64 state params —
  strips +, /, = characters silently.
- Google id_token JWT contains email in payload — no extra HTTP call
  to userinfo endpoint needed. Requires openid + email scopes.
- AES-256-CBC with prepended IV and base64 output is the encryption
  pattern for all sensitive OAuth token storage.
- Action Scheduler args for 3-parameter callbacks must be positional
  array, not associative — AS and WP-Cron arg passing differs.
- wp_bookings_staff.id is the primary key (not staff_id column).
  Always query WHERE id = %d.
- business_name is the setting key for company name (not company_name).
- dist/ deployment: always delete entire dist/ folder on server before
  uploading fresh build. Overwriting individual files leaves stale
  chunks when Vite hash changes.


  ---

## BACKLOG

### INVOICING & ACCOUNTING INTEGRATION (Phase 2)
**Priority:** High — MTD ITSA mandation (April 2026) makes accounting 
integration a compliance requirement, not just a convenience
**Migration:** 0016 (wp_bookings_invoices — see schema below)

**Context & Rationale:**
MTD for Income Tax is now live (6 April 2026) for sole traders with 
gross income >£50,000, dropping to £30,000 in April 2027 and £20,000 
in April 2028. All Bookit clients will eventually be in scope. They 
are legally required to maintain digital income records and submit 
quarterly summaries to HMRC via MTD-compatible software (Xero, 
QuickBooks, FreeAgent etc). A PDF invoice alone does not satisfy this 
requirement.

PDF invoice generation has been deprioritised. The Stripe payment 
receipt + booking confirmation email (already built) is sufficient 
for customer-facing documentation. The business owner's compliance 
need is solved by accounting integrations and CSV export, not PDFs.

No off-the-shelf WordPress plugin exists for Xero or QuickBooks 
integration without WooCommerce. All must be built natively as 
Bookit extension plugins.

---

#### PHASE 2 — ITEM 1: Payment CSV Export
**Priority:** Highest (ship first — lowest effort, immediate MTD value)
**Estimated effort:** 2–3 hours
**Type:** Core plugin addition

**Scope:**
- Export all payments for a date range as CSV from admin dashboard
- Columns: invoice date, booking reference, customer name, 
  service name, appointment date, payment type (deposit/balance/
  full/pay-on-arrival), amount, VAT rate (if applicable), 
  VAT amount, gross total, payment gateway, transaction ID
- Importable directly into Xero, QuickBooks, FreeAgent, and 
  any spreadsheet-based MTD bridging software
- Date range filter + status filter (completed payments only)
- Existing CSV export pattern from Reports section (same 
  rest_pre_serve_request approach already used in Sprint 4A)

---

#### PHASE 2 — ITEM 2: Xero Integration (Extension Plugin)
**Priority:** High — dominant UK accounting platform, strongest MTD 
accountant mindshare
**Estimated effort:** 30–40 hours
**Type:** Bookit Xero extension plugin (separate codebase, own 
Claude project)

**Scope:**
- OAuth 2.0 connection flow (Xero PHP SDK)
- Per-client setup: connect their Xero organisation to Bookit
- Configuration page: map Bookit service types to Xero account 
  codes and tax rates (dropdown, never manual entry)
- Auto-create Xero invoice/sales receipt on every completed 
  payment event (deposit, balance, full, pay-on-arrival)
- Two-document deposit flow: Invoice 1 at deposit, Invoice 2 
  at balance (referencing Invoice 1)
- Refund handling: create Xero credit note on Bookit refund
- VAT-aware: reads tax rates from Xero API, applies correct 
  rate per transaction
- Tax point = payment received date (HMRC requirement)
- Error handling + retry queue for failed syncs
- Admin dashboard section: sync status per booking, manual 
  resync button, connection health indicator

**Technical notes:**
- Xero PHP SDK available (C#, Java, Node, PHP, Ruby, Python)
- Rate limits: 5 concurrent calls, 60/min, 5,000/day — well 
  within Bookit's expected volume
- Webhook from Xero not needed — Bookit is the source of truth, 
  pushes to Xero only
- Uses `bookit_after_payment_completed` core hook (already exists)
- Token refresh: access tokens expire 30 min, refresh tokens 
  persist until revoked — handle transparently

---

#### PHASE 2 — ITEM 3: QuickBooks Online Integration (Extension Plugin)
**Priority:** Medium — second largest UK platform, strong with 
payroll-heavy businesses
**Estimated effort:** 25–35 hours
**Type:** Bookit QuickBooks extension plugin (separate codebase, 
own Claude project)

**Scope:** Same feature set as Xero integration above, adapted 
for QuickBooks Online API (Intuit OAuth 2.0, QBO REST API)

**Note:** Intuit introduced the App Partner Program in 2025 — 
confirm current API access requirements and pricing before 
building. Free tier may be limited.

---

#### PHASE 2 — ITEM 4: PDF Invoice (Deprioritised)
**Priority:** Low — only build if clients explicitly request it
**Estimated effort:** 8–12 hours if built
**Type:** Core plugin addition

**Rationale for deprioritisation:**
- Stripe already sends customer a payment receipt automatically
- Booking confirmation email (already built) contains all 
  legally relevant fields for consumer transactions
- PDF does not satisfy MTD digital record requirements
- Business owner's compliance need is solved by Items 1–3 above
- Only genuinely needed for VAT-registered B2B transactions 
  (rare in Bookit's target market of consumer-facing service 
  businesses)

**If built, must include:**
- DOMPDF (no third-party plugin dependency)
- VAT-aware: admin setting for VAT number — empty = standard 
  invoice, non-empty = full VAT invoice with breakdown
- Sequential gapless numbering with configurable prefix 
  (e.g. INV-2025-001), stored as INT in DB
- Two-document deposit flow (deposit invoice + balance invoice)
- Tax point date separate from invoice date (HMRC requirement)
- 6-year retention (HMRC) — PDFs stored in WP uploads

**New settings keys (if PDF built):**
| Key | Type | Notes |
|-----|------|-------|
| `invoice_prefix` | VARCHAR | e.g. `INV`, per client |
| `business_vat_number` | VARCHAR | Empty = non-VAT registered |

---

**DB Schema — `wp_bookings_invoices` (migration 0016):**
*(Retained for reference — implement only if PDF invoice is built)*

```sql
CREATE TABLE wp_bookings_invoices (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_number        INT UNSIGNED NOT NULL,
  invoice_prefix        VARCHAR(20) NOT NULL DEFAULT 'INV',
  booking_id            BIGINT UNSIGNED NOT NULL,
  payment_id            BIGINT UNSIGNED NOT NULL COMMENT 'The wp_bookings_payments row this invoice covers',
  customer_id           BIGINT UNSIGNED NOT NULL,
  parent_invoice_id     BIGINT UNSIGNED DEFAULT NULL COMMENT 'Set on balance invoice; references deposit invoice id',
  invoice_type          ENUM('deposit', 'balance', 'full_payment', 'pay_on_arrival') NOT NULL,
  status                ENUM('draft', 'issued', 'void') NOT NULL DEFAULT 'issued',
  business_name         VARCHAR(255) NOT NULL,
  business_address      TEXT NOT NULL,
  business_email        VARCHAR(255) NOT NULL,
  business_phone        VARCHAR(20) DEFAULT NULL,
  business_vat_number   VARCHAR(30) DEFAULT NULL COMMENT 'NULL = non-VAT-registered',
  customer_name         VARCHAR(255) NOT NULL,
  customer_email        VARCHAR(255) NOT NULL,
  customer_address      TEXT DEFAULT NULL,
  service_name          VARCHAR(255) NOT NULL,
  service_description   TEXT DEFAULT NULL,
  appointment_date      DATE NOT NULL,
  appointment_time      TIME NOT NULL,
  staff_name            VARCHAR(255) NOT NULL,
  subtotal_amount       DECIMAL(10,2) NOT NULL,
  vat_rate              DECIMAL(5,2) DEFAULT NULL,
  vat_amount            DECIMAL(10,2) DEFAULT NULL,
  total_amount          DECIMAL(10,2) NOT NULL,
  booking_total_price   DECIMAL(10,2) NOT NULL,
  tax_point_date        DATE NOT NULL,
  invoice_date          DATE NOT NULL,
  pdf_path              VARCHAR(500) DEFAULT NULL,
  pdf_generated_at      DATETIME DEFAULT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  voided_at             DATETIME DEFAULT NULL,
  voided_reason         TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoice_number (invoice_prefix, invoice_number),
  KEY idx_booking_id   (booking_id),
  KEY idx_payment_id   (payment_id),
  KEY idx_customer_id  (customer_id),
  KEY idx_parent       (parent_invoice_id),
  KEY idx_invoice_date (invoice_date),
  KEY idx_tax_point    (tax_point_date),
  KEY idx_status       (status),
  KEY idx_issued_date  (invoice_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

─────────────────────────────────────────────
SPRINT 6C: HOTFIX — COMPLETE
Date: April 2026
Estimate: ~7h
Test suite: 976 tests, 0 failures (unchanged)
─────────────────────────────────────────────

6C-1 — Remove wp_enqueue_media from dashboard app page
Tests: 976, 0 failures (unchanged)

Cache-busting via ?v=BOOKIT_VERSION attempted and reverted.
Root cause: Vite is configured with base: './' which uses relative
chunk imports. Adding ?v= to index.js URL caused the browser module
loader to treat it as a different cache key, loading a second instance
of the Vue app and calling app.mount('#app') twice — crashing Vue with
"Cannot read properties of null (reading 'nextSibling')".

Correct cache-busting approach for this project is Vite manifest hash
(entryFileNames: 'index.[hash].js' + manifest: true + PHP reads
manifest.json). Deferred to pre-launch task.

Net change kept from 6C-1:
- dashboard/app/index.php: removed wp_enqueue_media(),
  wp_print_scripts(), wp_print_media_templates() — these were
  injecting 60+ unnecessary WP media library scripts and Underscore
  templates into the dashboard page body, bloating it from 10 to
  135 child nodes and interfering with Vue's DOM reconciler.
- dashboard/src/components/StaffFormModal.vue: added comment noting
  wp.media() photo upload needs replacement (file input + REST API)
  now that wp_enqueue_media() is removed.

Known gotchas discovered:
- Vite base: './' + query string on entry file = double module load
- wp_print_media_templates() injects <script type="text/html"> nodes
  as body siblings — harmless normally but catastrophic with Vue mount
- wp_enqueue_media() is not needed for dashboard boot; only needed
  lazily when staff photo upload modal is opened (future fix)

─────────────────────────────────────────────

6C-2 — Email Notification Hotfix
Tests: 976, 0 failures (unchanged — tests added within same count)

Bug 1: Customer reschedule email missing action buttons
- class-wizard-api.php: enqueue_magic_link_email() for
  magic_link_reschedule now calls generate_customer_email() with
  full booking data (JOINs) instead of stub HTML. Includes Add to
  Calendar, Reschedule, and Cancel Booking buttons. Subject updated
  to "Booking Rescheduled — {service_name}". Falls back to stub
  if full booking fetch fails.

Bug 2: Staff not notified on booking rescheduled (dashboard)
- Root cause investigated: update_booking() already fires
  bookit_booking_rescheduled with 2 args — no change needed.
- Actual cause was Bug 3 below affecting get_full_booking().

Bug 3: Staff/admin not notified on booking cancelled (dashboard)
- Root cause confirmed: get_full_booking() had deleted_at IS NULL
  filter. cancel_booking() soft-deletes the booking BEFORE firing
  bookit_after_booking_cancelled, so get_full_booking() returned
  null and the notifier silently returned early.
- Fix: removed deleted_at IS NULL from get_full_booking() query.
  Safe because this method is only called from lifecycle hook
  callbacks — booking row always exists in DB.

Addendum 1: Dashboard cancel sending wrong customer email
- cancel_booking() was calling send_customer_confirmation() with a
  TODO comment. Added send_customer_cancellation() and
  generate_cancellation_email() to class-email-sender.php.
  Email includes booking details + "Book Again" button linking to
  home_url('/bookit/'). cancel_booking() updated to call the
  correct method.

Addendum 2: Dashboard reschedule sending wrong customer email
- update_booking() was calling send_customer_confirmation()
  unconditionally. Added send_customer_reschedule() and
  generate_reschedule_email() to class-email-sender.php.
  Email includes booking details + Add to Calendar, Reschedule,
  and Cancel buttons. update_booking() now uses $date_changed /
  $time_changed (already in scope) to decide which email to send.

New test file: tests/unit/test-6c-hotfix.php
All manual tests confirmed on live site:
✅ Customer receives reschedule email with action buttons (magic link)
✅ Staff/admin receive reschedule notification (dashboard)
✅ Staff/admin receive cancellation notification (dashboard)
✅ Customer receives cancellation email with booking details (dashboard)
✅ Customer receives reschedule email with booking details (dashboard)

─────────────────────────────────────────────

6C-3 — Brevo Staff Email Template Params
Tests: 976, 0 failures (unchanged — tests added within same count)

- class-bookit-staff-notifier.php: notify_staff() now builds $params
  from $booking_full before calling enqueue_email() for all 5
  immediate email types (new_booking, reschedule, cancellation,
  reassigned_to, reassigned_away).
- get_full_booking() extended to also fetch c.phone AS customer_phone.
- Params passed: service_name, booking_date, start_time,
  customer_first, customer_last, customer_phone, booking_reference,
  dashboard_url, preferences_url.
- Enables {{ params.X }} variables in Brevo staff notification
  templates to render correctly when template IDs are configured.
- Digest email params deferred — multiple bookings per digest,
  requires different structure.
- No user-facing change until Brevo templates are created and
  template IDs set in Email Settings.

─────────────────────────────────────────────
KNOWN ISSUES FROM SPRINT 6C (deferred)
─────────────────────────────────────────────

Two Vue UI bugs found during manual testing of 6C-2:

1. Reschedule page — cannot navigate to different month in the
   calendar widget. Customer is stuck on the current month only.

2. Reschedule button stuck on "Rescheduling..." after submit
   completes. Button state not reset after successful API response.

Both are in the magic link reschedule Vue page (public-facing).
Raise with PA to schedule as a focused bug-fix task.

─────────────────────────────────────────────
NEXT STEPS (after Sprint 6C)
─────────────────────────────────────────────

Immediate — Reschedule page UI bugs (small task, ~2-3h):
  Fix month navigation and button state reset in the magic link
  reschedule Vue page.

Next major sprint — consult PA chat to confirm priority:

  Option A: Invoice generation (~10-14h)
  High priority before first client go-live with payments.
  DOMPDF, VAT-aware, sequential invoice numbering.
  See Future_Features_Backlog.md for full spec.

  Option B: UK Compliance checklist completion
  Review UK_Compliance_Checklist_v1_0.md for remaining items
  before first client go-live.

  Option C: Launch preparation
  First client onboarding docs, deployment runbook,
  Stripe live key switch (5 minutes of config).

  Option D: Vite manifest cache-busting (pre-launch, ~2h)
  Proper solution: manifest: true in vite.config.js +
  entryFileNames: 'index.[hash].js' + PHP reads manifest.json.
  Eliminates 3-layer manual cache purge permanently.

─────────────────────────────────────────────
KNOWN TECHNICAL DECISIONS FROM SPRINT 6C
─────────────────────────────────────────────

- Vite base: './' + ?v= query string on entry file causes double
  module load. Never add query params to index.js when base is './'.
  Correct cache-busting = Vite manifest hash in filename.
- wp_enqueue_media() must not be called on the dashboard app page
  at boot time — load lazily only when staff photo upload is needed.
- get_full_booking() in Bookit_Staff_Notifier must NOT filter
  deleted_at IS NULL — cancellation hook fires after soft-delete.
- Dashboard cancel_booking() must call send_customer_cancellation(),
  not send_customer_confirmation().
- Dashboard update_booking() must check $date_changed || $time_changed
  to decide between reschedule and confirmation email.

  ─────────────────────────────────────────────
SPRINT 6D: FINAL PHASE 1 CODE SPRINT — COMPLETE
Date: April 2026
Estimate: ~13h
Actual: ~16h (6D-1 required multiple root-cause debug iterations)
Test suite: 986 tests, 0 failures (up from 976 at start of sprint)
─────────────────────────────────────────────

6D-1 — Reschedule Page UI Bugs (month nav + button state)
Tests: 976 → 976 (0 new tests — frontend only), 0 failures
Actual: ~6h (multiple root causes discovered)

Root cause investigation log:
1. First attempt: esc_js() encoding of ✓ and … characters — fixed
   but did not resolve issue (str_replace edits silently failed to
   save to disk in Cursor).
2. Second attempt: booking-wizard-v2.js attaching click listeners to
   .bookit-v2-day--available on the reschedule page — fixed with
   data-step guard. Did not resolve issue (same underlying problem).
3. Third attempt: Full script block rewrite with ASCII-safe strings.
   Confirmed file on disk still had old content — Cursor str_replace
   was not persisting. Forced full block replacement. Did not resolve.
4. Root cause confirmed from rendered page source: WordPress
   the_content filter pipeline was encoding && as &#038;&#038; inside
   the <script> block returned by the shortcode. no_texturize_shortcodes
   filter attempted — did not work because the encoding happens to the
   full shortcode return value, not just the tag placeholder.
5. Final fix: Moved both reschedule and cancel <script> blocks out of
   the shortcode return value entirely and into wp_footer actions in
   class-shortcodes.php. Scripts output via raw PHP echo after
   the_content has finished — bypasses all content filters. Both
   render_reschedule_script() and render_cancel_script() added with
   static $done guards.

Fixes confirmed working:
- Month navigation advances and retreats correctly
- Calendar header updates to correct month/year
- Prev-month arrow disables when on current month
- Clicking a date loads available time slots
- Confirm button resets to enabled state after successful reschedule
- Success message shown: "Your booking has been rescheduled. ✓"
- Page redirects to homepage after 3 seconds

Known technical decisions added:
- Shortcode return values that contain <script> blocks must be output
  via wp_footer action, not returned from the shortcode handler.
  WordPress the_content filter encodes && as &#038;&#038; regardless
  of no_texturize_shortcodes.
- bookit_reschedule_booking and bookit_cancel_booking added to
  no_texturize_shortcodes (belt-and-braces, kept in place).

─────────────────────────────────────────────

6D-2 — Customer Email Change Workflow (REQ-LEGAL-007)
Tests: 976 → 986 (+10), 0 failures
New test file: tests/unit/test-email-change-workflow.php

Deliverables:
- database/migrations/0019-add-email-change-columns-to-customers.php
  Adds pending_email_change, email_change_token, email_change_expires
  to wp_bookings_customers (information_schema guarded, idempotent)
- POST /bookit/v1/dashboard/customers/{id}/request-email-change
  Admin only. Validates email, rejects duplicates (409), rate limited
  5/hour per admin staff ID, generates token, enqueues verification
  email to new address and notification to old address, fires audit log.
- GET /bookit/v1/wizard/verify-email-change (public, token-auth)
  Validates token (hash_equals) + expiry. On success: updates email,
  clears pending columns, enqueues confirmed email to both addresses,
  fires audit log, redirects to /bookit-email-changed/.
- Three new email generation methods in class-email-sender.php:
  generate_email_change_verification_email()
  generate_email_change_notification_email()
  generate_email_change_confirmed_email()
- /bookit-email-changed/ page auto-created on activation
- [bookit_email_changed] shortcode registered
- CustomerProfile.vue: Change Email button + inline form with new email
  input, reason dropdown, success/error states
- Closes GDPR Right to Rectification gap (REQ-LEGAL-007)

─────────────────────────────────────────────

6D-3 — Vite Manifest Hash Cache-Busting
Tests: 986, 0 failures (unchanged — no new tests)

- dashboard/vite.config.js: manifest: true added to build config.
  entryFileNames changed from 'index.js' to 'index.[hash].js'.
  CSS assets changed from 'style.css' to 'style.[hash].css'.
  base, plugins, server, resolve sections untouched.
- dashboard/app/index.php: reads dist/.vite/manifest.json to resolve
  current hashed filenames for JS entry and CSS. Falls back to
  'index.js'/'style.css' if manifest absent. Dev fallback to
  localhost:5173 preserved exactly.
- dist/.vite/manifest.json confirmed generated with correct structure.
  Entry: index.DuvrpLnL.js, CSS: style.DhcseoZP.css (hashes will
  change on future content changes).
- Eliminates 3-layer manual cache purge (LiteSpeed → Hostinger → CDN)
  after frontend deployments permanently.

─────────────────────────────────────────────

6D-4 — UK Compliance Review
No code changes. Chat-only review.

All 7 original compliance gaps confirmed closed:
✅ Privacy Policy template — Sprint 6B-4
✅ Terms & Conditions template — Sprint 6B-4
✅ 14-day cooling-off waiver — Sprint 4C
✅ Right to Rectification (email change) — Sprint 6D-2
✅ DPA confirmation checklist — Sprint 6B-4
✅ ICO registration guidance — Sprint 6B-4
⚠️ Accessibility Statement — DEFERRED post-launch (SHOULD HAVE,
   not blocking). Produce template within 30 days of go-live.

88/89 compliance items closed. Phase 1 is compliance-ready for launch.

─────────────────────────────────────────────
PHASE 1 CODE-COMPLETE
─────────────────────────────────────────────

Sprint 6D is the final code sprint of Phase 1. All planned features,
compliance requirements, and pre-launch tasks are complete.

Test suite at Phase 1 code-complete: 986 tests, 0 failures

Known technical decisions from Sprint 6D:
- Shortcode <script> blocks must go through wp_footer, not returned
  from shortcode handler — WordPress the_content encodes && regardless
  of no_texturize_shortcodes.
- Vite base: './' requires manifest hash for cache-busting. Query
  strings on entry file cause double Vue mount. Never use ?v= on
  index.[hash].js.
- Email change token: wp_generate_password(32, false, false),
  validated with hash_equals(), expires in DAY_IN_SECONDS.
- Migration 0019 uses information_schema.COLUMNS column check (not
  SHOW COLUMNS LIKE — MariaDB underscore wildcard issue).

─────────────────────────────────────────────
NEXT STEPS (post Phase 1 code-complete)
─────────────────────────────────────────────

Consult PA chat for launch sequencing. Options:

Option A: First client onboarding
  - Publish Privacy Policy and T&Cs (templates ready)
  - Switch Stripe to live keys (5 minutes config)
  - Deployment runbook for production go-live

Option B: Invoice generation (~10-14h)
  High priority before first client go-live with payments.
  DOMPDF, VAT-aware, sequential invoice numbering.
  See Future_Features_Backlog.md for full spec.

Option C: Accessibility Statement (post-launch, ~4h)
  Produce template within 30 days of first go-live.
  Required for public sector clients only — not blocking
  for initial salon/beauty business clients.



─────────────────────────────────────────────
CODE REVIEW SPRINT — Dead Code Removal + PHPUnit Coverage
Date: April 2026
Test suite: 986 → 993 tests (+7 net), 0 failures
Git tag: v1.0.0 on branch Phase1
─────────────────────────────────────────────

Scope: Post-Phase-1 code quality sprint. No new features. Read-before-
write discipline throughout — all removals confirmed via codebase search
before any Cursor prompt was produced.

─────────────────────────────────────────────

Task 1 — Remove send_business_notification()
Tests: 986 → 985 (−1 net: 1 test removed, 1 replacement added), 0 failures

Full codebase search revealed two live call sites missed by Sprint 6A-8:
- class-payment-processor.php lines 267 and 468 (pay-on-arrival path)
- public/templates/booking-confirmed.php line 75 (V1 template)

PA confirmed Option A: migrate remaining call sites, then remove method.

Changes made:
- class-payment-processor.php: removed both send_business_notification()
  calls. do_action('bookit_after_booking_created') already fires before
  both calls → Bookit_Staff_Notifier already handled notification.
  Fixes double-notification bug on pay-on-arrival path.
  Replacement comment: // Staff notification handled by Bookit_Staff_Notifier
  via bookit_after_booking_created hook.
- booking-confirmed.php: removed V1 template call (side effect on GET
  request; notifications already fired by payment processor before redirect).
  Replacement comment matches V2 template pattern.
- class-email-sender.php: removed send_business_notification() method and
  generate_business_email() helper (no remaining call sites).
  Class docblock updated — no longer refers to admin business emails.
- class-dashboard-bookings-api.php: replaced two-line Sprint 6A-8
  replacement comment with single accurate comment:
  // Staff notifications handled by Bookit_Staff_Notifier via
  // bookit_after_booking_created hook (fired above).
- class-stripe-webhook.php: verified clean (no call site — confirmed).
- test-notification-dispatcher.php: replaced
  test_send_business_notification_enqueues_pending_row() with
  test_poa_booking_created_action_enqueues_staff_notification()
  (fires hook, asserts staff_new_booking_immediate queue row).
- test-payment-success.php: removed test_sends_business_notification_email()
  (Staff Notifier coverage for Stripe path exists in test-stripe-v2-wiring.php).

─────────────────────────────────────────────

Task 2 — TODO/FIXME/HACK/XXX Audit
No code changes.

Full codebase search results:
- TODO: 1 hit — BookingModal.vue line 532
  "// TODO: Filter by service when staff-services relationship is available."
  → KEEP. Valid deferred feature (staff dropdown filter by selected service).
- FIXME: 0 hits.
- HACK: 0 hits.
- XXX: All hits are XXXX inside booking reference format strings (BK[YYMM]-XXXX).
  Not code quality markers — intentional placeholder notation.
- Sprint 4F remnants (meeting_type, preferred_platform, meeting_link):
  0 hits in core plugin tree. Revert confirmed fully clean.

─────────────────────────────────────────────

Task 3 — Stale Sprint 6A-8 Comments
Completed as part of Task 1 pass. See Task 1 above.

─────────────────────────────────────────────

Task 4 — V1 Booking Wizard Assessment
No code changes.

[bookit_booking_wizard] shortcode is registered and fully functional.
All 5 step templates exist under public/templates/:
booking-wizard-shell.php, booking-step-1-services.php,
booking-step-2-staff.php, booking-step-3-datetime.php,
booking-step-4-contact.php, booking-step-5-payment.php.

Decision: RETAIN. V1 may be in use on existing test pages.
No removal without explicit PA decision.

Note: booking-step-4-checkout.php also exists in public/templates/ but
is not loaded by the V1 shell (which uses contact for step 4). Flagged
as a possible orphan — see Task 7b below.

─────────────────────────────────────────────

Task 5 — Dead Table wp_bookings_working_hours
No code changes. Confirmed already clean from Sprint 5A Issue 14.

create_working_hours_table() in class-bookit-database.php:
- Deprecation docblock present and accurate.
- Not called anywhere in the codebase.
- Migration 0011 drops the table.

─────────────────────────────────────────────

Task 6 — Sprint 4F Revert Verification
No code changes. Confirmed fully clean.

Codebase search for meeting_type, preferred_platform, meeting_link:
0 matches in *.php, *.vue, *.js under bookit-booking-system/.
Sprint 4F revert was complete.

─────────────────────────────────────────────

Task 7 — wp_enqueue_media() Remnants
No code changes. Confirmed already clean.

- dashboard/app/index.php: wp_enqueue_media, wp_print_scripts,
  wp_print_media_templates — all absent (removed Sprint 6C hotfix).
- StaffFormModal.vue: wp.media() call remains with prompt() fallback;
  comment in place explaining removal of wp_enqueue_media() and that
  replacement (file input + REST upload) is deferred.
- Full PHP codebase: 0 hits for wp_enqueue_media in *.php files.

Photo upload replacement deferred — logged in PA backlog as pre-Phase 2
task (~3-4h). Endpoint needed before React Native mobile work begins.

─────────────────────────────────────────────

Task 7b — booking-step-4-checkout.php Orphan Check
Tests: 985 → 985 (no change), 0 failures

Codebase search for booking-step-4-checkout: 0 matches in *.php,
*.vue, *.js. File confirmed orphaned (superseded by V2 wizard;
Sprint 4F fully reverted).

PA confirmed removal. File deleted.

Commit message: "Code review: Remove orphaned booking-step-4-checkout.php
template — no call sites found, superseded by V2 wizard."

─────────────────────────────────────────────

Task 8 — PHPUnit Coverage Report + Gap Analysis
Tests: 985 → 993 (+8), 0 failures

Coverage report generated with Xdebug inside wp-env Docker container
(installed as root via pecl install xdebug).

Results:
  Classes:  1.45% (1/69)   — artefact of PHPUnit counting method
  Methods: 26.47% (167/631) — coverage; many classes hit indirectly
  Lines:   52.89% (11228/21229)

Highest-risk uncovered paths identified (genuine silent-failure risk):
1. Booking_System_Stripe_Checkout — 0% methods, 35.57% lines
   validate_session_data() missing-field paths uncovered.
2. Bookit_Notification_Dispatcher — 28.57% methods, 41.46% lines
   Retry/failure paths — already covered in test-notification-retry.php
   (test_final_failure_marks_failed_and_fires_hook confirmed present).
3. Bookit_Migration_Runner — 33.33% methods, 38.03% lines
   catch(Throwable) block in run_pending() uncovered.
4. Bookit_Encryption — 33.33% methods, 82.35% lines
   decrypt() failure paths (garbage/truncated/tampered input) uncovered.
5. Bookit_Google_Calendar — 18.75% methods, 60.06% lines
   missing_access_token_after_refresh branch in get_client_for_staff()
   uncovered (invalid_grant path already covered in test-google-calendar-sync.php).

New test file created: tests/unit/test-coverage-gaps.php
Four test classes, 8 new tests:

  Test_Encryption_Edge_Cases (3 tests):
  - test_decrypt_returns_empty_string_for_garbage_input
  - test_decrypt_returns_empty_string_for_truncated_blob
  - test_decrypt_returns_empty_string_for_tampered_ciphertext

  Test_Migration_Runner_Error_Path (2 tests):
  - test_run_pending_stops_on_migration_exception_and_does_not_mark_as_run
  - test_run_pending_stops_processing_further_migrations_after_exception

  Test_Stripe_Checkout_Validation (2 tests):
  - test_create_checkout_session_returns_error_for_missing_staff_id
  - test_create_checkout_session_returns_error_for_missing_required_field
  (missing_service_id and invalid_email already covered in test-stripe-checkout.php)

  Test_Google_Calendar_Token_Refresh (1 test):
  - test_get_client_for_staff_returns_null_when_refresh_returns_no_access_token
  (invalid_grant path already covered in test-google-calendar-sync.php)

Cursor conflict resolutions applied before coding:
- get_authenticated_client() does not exist; correct method is
  get_client_for_staff() in class-bookit-google-calendar.php.
- 4 of the originally planned 13 tests were duplicates of existing
  coverage — correctly excluded.

─────────────────────────────────────────────
v1.0.0 RELEASE
─────────────────────────────────────────────

git tag -a v1.0.0 -m "Phase 1 complete — 993 tests, 0 failures, dead code removed"
git push origin Phase1
git push origin v1.0.0

Final test suite: 993 tests, 0 failures
Dead code removed: send_business_notification(), generate_business_email(),
booking-step-4-checkout.php
Double-notification bug fixed: pay-on-arrival path
Sprint 4F revert: confirmed fully clean

─────────────────────────────────────────────
PRE-PHASE 2 TASKS REMAINING (from PA backlog)
─────────────────────────────────────────────

Ordered sequence agreed with PA:

1. Code review + dead code removal + coverage  ✅ COMPLETE (this sprint)
2. Git tag v1.0.0                              ✅ COMPLETE
3. Documentation (Sprint 6B-3)                 Separate chat
4. Legal documents (Sprint 6B-4)               Separate chat
5. Playwright E2E sprint (~12h)                After tasks 1-4
6. StaffFormModal photo upload (~4h)           Before Phase 2 mobile
   New REST endpoint POST bookit/v1/dashboard/staff/{id}/photo
   (multipart upload → WordPress media library → returns URL)
   Vue file input replaces wp.media() + prompt() fallback
7. Bookit Meetings extension (~60h)            New Claude project



─────────────────────────────────────────────
V1 BOOKING WIZARD REMOVAL — PA Decision: Remove
Date: April 2026
Tests: 993 → 969 (−24 V1-only tests removed), 0 failures
Branch: Phase1
─────────────────────────────────────────────

PA confirmed removal after code review sprint confirmed V1 was fully
superseded by V2 ([bookit_wizard_v2]) and all live pages use V2.

─────────────────────────────────────────────

Files deleted:
- public/templates/booking-wizard-shell.php
- public/templates/booking-step-1-services.php
- public/templates/booking-step-2-staff.php
- public/templates/booking-step-3-datetime.php
- public/templates/booking-step-4-contact.php
- public/templates/booking-step-5-payment.php
- public/templates/booking-confirmed.php
- public/assets/css/booking-wizard.css
- public/assets/js/booking-wizard.js
- public/assets/css/datetime-picker.css
- public/assets/js/datetime-picker.js
- public/assets/css/contact-form.css
- public/assets/js/contact-form.js
- public/assets/css/payment-step.css
- public/assets/css/confirmation-page.css
- tests/unit/test-booking-shortcode.php

Shortcodes removed from class-shortcodes.php:
- bookit_booking_wizard → render_booking_wizard()
- bookit_booking_confirmation → render_booking_confirmation()
- bookit_confirmation → bookit_confirmation_page_shortcode()

Methods removed from class-payment-processor.php:
- process_payment() — admin-post.php handler (V1-only entry point)
- process_stripe_payment() — inline HTML Stripe redirect (V1-only)
- Constructor hooks: admin_post_bookit_process_payment (both priv/nopriv)

Asset enqueue cleanup in enqueue_wizard_assets():
- Removed $has_wizard and $has_confirmation guards
- Removed V1 asset enqueues: bookit-wizard CSS/JS, datetime-picker
  CSS/JS, contact-form CSS/JS, payment-step CSS, confirmation CSS
- CSS token block (:root --bookit-* variables) merged into
  booking-wizard-v2.css with $needs_v2_tokens guard covering all
  remaining shortcodes (cancel, reschedule, confirmation-v2,
  my-packages, wizard-v2)

Tests updated:
- test-wizard-navigation.php: kept, updated to use [bookit_wizard_v2]
  and V2 class names; test_browser_back_button_works removed (V1-specific)
- test-wizard-flow.php: updated shortcode calls to [bookit_wizard_v2]
- test-booking-wizard-v2.php: removed test_v2_shortcode_does_not_break_existing_wizard
- test-booking-confirmed-v2.php: removed two V1-asserting tests
  (test_original_booking_confirmed_shortcode_still_works,
  test_original_booking_confirmation_template_unchanged)
- test-payment-success.php: removed two tests loading booking-confirmed.php
- phpunit.xml: replaced test-booking-shortcode.php with
  test-my-packages-shortcode.php (my-packages cases moved out)

Additional changes:
- class-bookit-activator.php: removed creation of legacy booking-confirmed
  page that used [bookit_confirmation]
- class-bookit-loader.php: verified clean — no additional V1 hooks

What was NOT changed:
- [bookit_wizard_v2], [bookit_booking_confirmed_v2], [bookit_cancel_booking],
  [bookit_reschedule_booking], [bookit_my_packages], [bookit_email_changed]
- All V2 templates, assets, REST endpoints
- process_pay_on_arrival(), process_use_package() in payment processor
  (both used by V2 REST API path via class-wizard-api.php)

─────────────────────────────────────────────
BUG FIX — Step 4 Contact Form Broken by V1 Removal
Tests: 969 → 969 (no change), 0 failures
─────────────────────────────────────────────

Root cause: contact-form.js handled Step 4 form validation, session
save, and Step 4→5 navigation. It was correctly identified as a V1
asset and deleted. However it was also the only file handling Step 4
submission for V2 — initStep4() in booking-wizard-v2.js only wired
the special requests toggle.

Result: filling in Step 4 details and clicking Continue did nothing.
No validation, no session save, no navigation to Step 5.

Discovered during manual testing immediately after V1 removal.

Fixes applied:

1. booking-wizard-v2.js — initStep4() rewritten:
   - Listens for #bookit-contact-form submit
   - Validates: first_name, last_name, email (format), phone (non-empty)
   - If cooling-off waiver group visible: requires checkbox checked
   - Clears .bookit-v2-field-error spans before each run
   - On pass: postToSession() with current_step:4, customer_first_name,
     customer_last_name, customer_email, customer_phone,
     customer_special_requests, cooling_off_waiver, marketing_consent,
     bookit_booking_nonce from hidden field
   - On res.success: advanceStep(4) → Step 5
   - On failure: inline error + .bookit-v2-step4-submit-error message

2. class-wizard-api.php — update_session() extended:
   - Previously only accepted: current_step, service_id, staff_id,
     date, time, service_name, service_duration, payment_method,
     customer (array)
   - Now also accepts and sanitizes: customer_first_name,
     customer_last_name, customer_email, customer_phone,
     customer_special_requests, cooling_off_waiver, marketing_consent
   - This was a pre-existing gap independent of the V1 removal —
     Step 4 data would never have persisted to session correctly
     even with contact-form.js present

Manual tests confirmed:
✅ Step 4 → Step 5 navigation works
✅ Validation fires correctly (blank fields, invalid email)
✅ Pay-on-arrival end-to-end booking creates correctly
✅ Customer details appear in booking record

─────────────────────────────────────────────
UPDATED PRE-PHASE 2 TASK STATUS
─────────────────────────────────────────────

1. Code review + dead code removal + coverage  ✅ COMPLETE
2. Git tag v1.0.0                              ✅ COMPLETE
3. V1 booking wizard removal                   ✅ COMPLETE
4. Documentation (Sprint 6B-3)                 Separate chat
5. Legal documents (Sprint 6B-4)               Separate chat
6. Playwright E2E sprint (~12h)                After tasks 4-5
7. StaffFormModal photo upload (~4h)           Before Phase 2 mobile
8. Bookit Meetings extension (~60h)            New Claude project