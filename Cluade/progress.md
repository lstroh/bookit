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