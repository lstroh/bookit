# Future Features Backlog

Features identified during development that are deferred to Sprint 4 or Phase 2.

---
**⚠️ NOTE — 27/02/26: Features moved from Phase 2 / deferred into Phase 1**

The following features previously documented as Phase 2, deferred, or COULD HAVE have been pulled into Phase 1. Some are in the core plugin; others are in separate extension plugins.

**Moved into core plugin (Phase 1):**

| Feature | Previously | Now |
|---------|-----------|-----|
| White-label / co-branded branding | Phase 2 | Core Sprint 4B |
| Extension hook system + API spec | Not planned | Core Sprint 4B |
| Optimistic locking on booking edit | COULD-012 deferred | Core Sprint 4B |
| Comprehensive audit logging | COULD-017 deferred | Core Sprint 4B |
| Database migration framework | COULD-016 deferred | Core Sprint 4B |
| Custom booking reference format | COULD-009 deferred | Core Sprint 4B |
| Centralised error message system | COULD-014 deferred | Core Sprint 4B |
| Team calendar view | COULD-005 deferred | Core Sprint 4C |
| Cancellation policy config UI (per-service) | Deferred | Core Sprint 4C |
| Bulk booking actions | Deferred | Core Sprint 4C |
| Customer data portability (GDPR Art. 20) | Deferred | Core Sprint 4C |
| Setup wizard | Missed from Sprint 3 | Core Sprint 4C |
| Contextual help tooltips | COULD-010 deferred | Core Sprint 4C |
| Package bookings | Phase 2 Priority 2 | Core Sprint 4D |

**Moved into extension plugins (Phase 1, separate codebases):**

| Feature | Previously | Now |
|---------|-----------|-----|
| Recurring appointments | Phase 2 Priority 2 | Bookit Recurring extension |
| Group bookings & classes | Phase 2 Priority 3 | Bookit Classes extension |
| Custom intake forms per service | Phase 2 / Deferred | Bookit Forms extension |
| Online meeting links (Zoom, Meet, WhatsApp, Teams, Generic) | Phase 2 | Bookit Meetings extension (Sprint 4F + Sprint 5) |


**Still deferred to Phase 2 / post-launch:**
- Automatic refund *execution* via Stripe — Sprint 5 (requires live payment infrastructure)
- 2-way Google Calendar sync — Phase 2 Priority 2
- Customer portal (full self-service) — Phase 2 Priority 2
- PDF report exports — Phase 2
- Scheduled report emails — Phase 2

**Pulled into Phase 1 (Sprint 4H — Notification Infrastructure, ~22h):**
- Email provider abstraction layer (driver pattern): Brevo primary,
  wp_mail() fallback. Vendor-switchable via settings dropdown.
- Email queue (wp_bookit_email_queue table) + Action Scheduler integration
- Retry logic with exponential back-off (3 attempts: 5min → 30min → 2h)
- Brevo 429 handling + local rate limiter
- SMS provider abstraction: Brevo SMS stub; provider selector in settings
- Settings page: independent email and SMS provider dropdowns
- Replace existing wp_mail() calls with dispatcher
See progress.md Sprint 4H for full task breakdown.

**Pulled into Sprint 5 (Live Environment, requires live credentials):**
- Brevo account setup, sending domain verification (SPF/DKIM/DMARC)
- Brevo template creation + template ID mapping in plugin settings
- SMS queue table + full dispatcher SMS path
- Brevo delivery webhook receiver (bounce/spam tracking)
- Admin email queue log view in dashboard
- Email notifications for extension features (Meetings, Recurring, Classes)

**SMS vendor — Twilio: still Phase 2**
- Twilio SMS provider implementation (Bookit_Twilio_SMS_Provider)
- The interface and provider selector are in place after Sprint 4H;
  Twilio drops in as a new provider class with no other changes needed



## Sprint 4 / Early Phase 2 Features

### Feature 1: Shift-Based Scheduling (8-10 hours)

**Priority:** High  
**Target:** Sprint 4 or Early Phase 2  
**Status:** Documented, not started

**User Story:**
As a business owner with part-time or rotating staff, I want to create custom schedules for each staff member by week or month, so that their availability reflects their actual shifts rather than a recurring weekly pattern.

**Business Context:**
While many service businesses (salons, therapists, consultants) have regular weekly schedules, individual staff members often work:
- Part-time hours (some days on, some off)
- Rotating shifts
- Variable schedules week-to-week

Current "recurring schedule" system handles regular patterns. This feature adds shift-based scheduling for non-regular patterns.

**Technical Approach:**

**New Database Table:**
```sql
CREATE TABLE wp_bookings_staff_shift_schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  staff_id BIGINT UNSIGNED NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME NULL,
  break_end TIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_staff_date (staff_id, shift_date),
  UNIQUE KEY unique_staff_shift (staff_id, shift_date),
  
  CONSTRAINT fk_shift_staff 
    FOREIGN KEY (staff_id) 
    REFERENCES wp_bookings_staff(id) 
    ON DELETE CASCADE
);

-- Add to existing staff table
ALTER TABLE wp_bookings_staff 
ADD COLUMN schedule_mode ENUM('recurring', 'shifts') DEFAULT 'recurring' AFTER role;
```

**Key Design Decisions:**
1. Two separate tables (recurring vs shifts) - no mixing
2. schedule_mode field determines which table to query
3. shift_date stores specific dates (not day_of_week)
4. One shift per staff per day (UNIQUE constraint)
5. Owner chooses mode per staff member

**Model Integration:**
Update `includes/models/class-datetime-model.php`:
- Check staff's schedule_mode
- If 'shifts': Query wp_bookings_staff_shift_schedules for exact date
- If 'recurring': Use existing wp_bookings_staff_working_hours (current system)
- No shift record for date = day off

**Backend Features (4-5 hours):**
- GET `/staff/{id}/schedule-mode` - Get current mode
- PUT `/staff/{id}/schedule-mode` - Toggle mode (recurring ↔ shifts)
- GET `/staff/{id}/shifts?from=date&to=date` - Get shifts for date range
- POST `/staff/{id}/shifts` - Create single shift
- POST `/staff/{id}/shifts/bulk` - Create multiple shifts (week/month)
- PUT `/staff/{id}/shifts/{date}` - Update shift
- DELETE `/staff/{id}/shifts/{date}` - Delete shift
- POST `/staff/{id}/shifts/copy-week` - Copy week to next week
- GET `/staff/{id}/shifts/warnings` - Check if shifts exist for next 2 weeks

**Frontend Features (4-5 hours):**
- Mode toggle on Working Hours page (radio buttons)
- Shift calendar view (week/month grid)
- "Create Shifts for Next X Weeks" wizard
- Copy previous week button
- Individual shift create/edit forms
- Warning banner if no shifts scheduled ahead
- Visual calendar showing scheduled vs unscheduled days
- Different UI: recurring shows 7 days, shifts shows calendar

**Business Value:**
- Handles part-time staff at salons/spas
- Supports rotating schedules common in service businesses
- No impact on businesses using recurring schedules
- Expands addressable market without complicating core feature

**Not a Deal-Breaker:**
- Can launch without this feature
- Workaround: Use date exceptions for irregular weeks
- Workaround: Use Bulk Hours feature (Task 11.5) to apply exceptions faster
- Validate demand with first 5-10 clients before building

**Estimated Effort:** 8-10 hours total

---

### Feature 2: Self-Service Password Reset (6-8 hours)

**Priority:** Medium  
**Target:** Phase 2  
**Status:** Documented in SRS, deferred

**User Story:**
As a staff member who forgot my password, I want to reset it myself without contacting an admin, so I can regain access quickly.

**Current State:**
- Admin can reset any staff password (Task 9 complete)
- No self-service "Forgot Password" flow

**Features:**
- "Forgot Password?" link on login page
- Enter email address form
- Generate secure reset token (32+ chars, cryptographically random)
- Token expiry (1 hour default, configurable)
- Email with reset link containing token
- Reset form validates token and allows new password entry
- Password strength requirements
- Token invalidation after use or expiry
- Rate limiting (3 reset requests per hour)

**Technical Requirements:**
- New table: wp_bookings_password_resets
- Token generation using random_bytes()
- Secure token validation (timing-safe comparison)
- Email sending via configured SMTP

**Dependencies:**
- Task 11 must be complete (email configuration)
- Email system must be working
- SMTP properly configured

**Why Phase 2:**
- Requires working email system first
- More complex security considerations
- Not critical for launch (admin can reset manually)
- Professional email templates needed
- Token management adds complexity

**Estimated Effort:** 6-8 hours

---

### Feature 3: Professional HTML Email Templates (4-6 hours)

**Priority:** Medium  
**Target:** Phase 2  
**Status:** Documented in SRS

**Features:**
- HTML email templates with branding
- Responsive design (mobile-friendly)
- Template builder or editor
- Dynamic content insertion
- Email preview functionality
- Plain text fallback

**Templates Needed:**
- Password reset email (self-service)
- Booking confirmation (enhanced)
- Booking reminder (enhanced)
- Cancellation notification (enhanced)
- Welcome email (new staff member)

**Dependencies:**
- Task 11 email configuration
- CSS inliner for email compatibility
- Template engine (blade, twig, or custom)

**Estimated Effort:** 4-6 hours

---

## Implementation Priority

1. **Shift Scheduling** (High Priority) - 8-10 hours
   - Most requested by target market
   - Completes working hours feature set
   - Expected by service businesses with part-time staff

2. **Self-Service Password Reset** (Medium Priority) - 6-8 hours
   - Professional standard feature
   - Expected by users
   - Reduces admin support burden

3. **HTML Email Templates** (Medium Priority) - 4-6 hours
   - Enhances brand experience
   - Improves communication quality
   - Nice-to-have, not critical

**Total Sprint 4 Enhancements:** 18-24 hours

---

## Validation Strategy

Before building these features:
1. Launch Phase 1 with core features
2. Survey first 5-10 clients
3. Ask: "Do you need shift scheduling for your staff?"
4. If >30% say yes → prioritize for Sprint 4
5. If <30% → defer to later Phase 2

---

## Notes

- All features documented with full specifications
- Not blocking Phase 1 launch
- Can be delivered incrementally
- Business value validated before development


---

### Feature: Staff Time-Off Approval Workflow (12-15 hours)

**Priority:** Medium  
**Target:** Phase 2  
**Status:** Documented, not started  
**Decision Date:** 25/02/26

**Background:**
Sprint 4A implemented self-service time-off blocking for staff (`MyAvailability.vue`). Blocks take effect immediately with no admin approval step. The `BusinessOwner-AdminRequirements.md` (User Story 3.5) describes an approval workflow with Pending/Approved/Declined states, but this was out of scope for Phase 1 MVP.

**Partial implementation in Sprint 4A:**
Admin can view a specific staff member's time-off blocks via the staff drill-down panel in the Staff Performance Report (Task 7). This provides visibility without the full workflow.

**What Phase 2 needs to add:**

1. **Database:** Add `status` column to `wp_bookings_staff_working_hours`:
```sql
   ALTER TABLE wp_bookings_staff_working_hours
   ADD COLUMN approval_status ENUM('approved', 'pending', 'declined') DEFAULT 'approved';
```
   Existing rows and all admin-created blocks default to `approved`. Staff self-service blocks created via `POST /dashboard/my-availability` default to `pending`.

2. **Availability algorithm:** Update `get_staff_availability()` in `class-datetime-model.php` to only block slots for rows where `approval_status = 'approved'`. Pending and declined blocks should not affect customer-facing availability.

3. **Admin endpoints:**
   - `GET /dashboard/staff/time-off-requests` — all pending requests across all staff
   - `POST /dashboard/staff/time-off-requests/{id}/approve`
   - `POST /dashboard/staff/time-off-requests/{id}/decline`

4. **Email notifications:**
   - Staff submits request → email to admin
   - Admin approves/declines → email to staff

5. **Frontend:**
   - Admin: "Time-Off Requests" section showing pending items with approve/decline buttons
   - Staff `MyAvailability.vue`: show approval status badge on each block (Pending / Approved / Declined)

**Key constraint:** Until Phase 2 approval workflow is built, all staff-created blocks are treated as immediately approved (`approval_status = 'approved'` default). No behaviour change needed at launch.


## Package — Customer Visibility

### Task: Package Redemption Email Enhancement (Sprint 4E)
**Effort:** ~1h
**Description:** When a booking is created via the `use_package` payment method
(wizard redemption path), include a "sessions remaining" line in the customer
confirmation email. Format: "Sessions remaining on your [Package Name] package: X"
**File to modify:** includes/email/class-email-sender.php — send_customer_confirmation()
**Trigger:** Check booking payment_method === 'package_redemption', JOIN
customer_packages to get sessions_remaining, add to email template variables.
**Acceptance criteria:**
- Customer receives confirmation email after wizard package redemption
- Email body includes package name and sessions remaining count
- Email unaffected for non-package bookings

---

### Task: Customer-Facing "My Packages" Page (Sprint 5 — Live Environment)
**Effort:** ~8–10h
**Description:** A WordPress shortcode [bookit_my_packages] that renders a
customer-facing page showing their active and past packages. Customer identified
by email from an existing booking session or magic link token.
**Displays per package:**
- Package type name
- Sessions remaining / total
- Expiry date (or "Never")
- Status badge (active / exhausted / expired)
- Redemption history (date, service, staff)
**Technical notes:**
- Public PHP template, no Vue required
- Reuses GET /wizard/my-packages endpoint logic server-side
- Redemption history fetched via direct DB query (no new endpoint needed)
- GDPR: only shows data for the authenticated customer session
**Acceptance criteria:**
- Shortcode renders correctly on a standard WordPress page
- Only shows packages belonging to the logged-in/session customer
- Empty state shown if no packages exist
- Fully responsive, matches booking wizard CSS conventions


## Bookit Meetings Extension — Architecture Decision

**Decision date:** 15 March 2026

**Why extension plugin, not core:**
- Only relevant for remote/virtual service businesses (coaches,
  consultants, tutors) — not universal like packages
- OAuth credential complexity (Zoom + Meet each require separate
  OAuth app registration, token storage, refresh logic) adds
  unnecessary weight to core for clients who don't need it
- Can be deactivated without affecting any booking functionality
- Meeting link is supplementary data on a booking, not core to
  the booking creation flow

**Split architecture:**
Core plugin adds (Sprint 4F — COMPLETE):
- bookit_after_booking_confirmed action hook — fires after
  confirmation page loads; extension uses this to generate
  and store the meeting link
- bookit_confirmation_meeting_section filter hook — extension
  uses this to inject the "Join Meeting" section into the
  confirmation page
- bookit_email_meeting_section filter hook — extension uses
  this to inject the meeting link row into the confirmation
  email
- No database columns in core — all schema changes belong
  to the extension and are managed by its own migrations

Bookit Meetings extension owns everything else (~60h total):
Phase 1 (~24h, no live environment needed):
- Extension registration + dashboard settings page
- Its own database migrations: meeting_type + preferred_platform
  on wp_bookings_services, meeting_link on wp_bookings (added
  on activation, removed on deactivation)
- "Online Meeting" toggle + platform selector on service form
- WhatsApp: wa.me/{phone} link from staff phone — no OAuth
- Teams: manual link entry and display
- Generic URL: store and display any meeting URL
- Admin override: manually set/edit meeting link per booking
- Confirmation page + email delivery via the three core hooks

Phase 2 (~36h, requires live environment for OAuth callbacks):
- Zoom OAuth: per-staff credentials, business-level fallback,
  auto-generate unique meeting per booking via Zoom API
- Google Meet OAuth: per-staff credentials, business-level
  fallback, auto-generate via Google Calendar API

**Per-booking override:** Admin can always manually set or edit
the meeting link on any booking regardless of platform, via the
booking edit modal in the dashboard.

**Customer experience:**
- Meeting link shown on booking confirmation page
- Meeting link included in confirmation email
- If no link yet (manual entry pending): "Your meeting link will
  be sent shortly" placeholder shown


packages_enabled gate on /wizard/my-packages endpoint — the customer package lookup endpoint (class-customer-package-lookup-api.php) also lacks a packages_enabled check. Low priority (it only returns packages for a known customer email) but should be consistent with the available-packages endpoint. Sprint 5 or 4F.


Discount mode purchase_price not stored at creation — create_customer_package stores null for purchase_price on discount-mode packages. The correct price can only be calculated once the applicable service price is known. Needs to be resolved when the Stripe package purchase flow is built in Sprint 5.




