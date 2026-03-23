# DEVELOPMENT SEQUENCE PLAN
## WordPress Booking Plugin - Phase 1 MVP

**Document Version:** 1.0  
**Date:** January 22, 2026  
**Status:** DRAFT - Ready for Sprint Planning  
**Total Timeline:** 20-22 weeks (5-5.5 months)  
**Estimated Effort:** 786-936 hours (including 36h legal compliance)

---

## EXECUTIVE SUMMARY

This document outlines the recommended development sequence for the WordPress Booking Plugin Phase 1 MVP. The plan is organized into 6 sprints plus a foundation sprint (Sprint 0), following an iterative approach that delivers value incrementally.

⚠️ REVISION — 23/02/26: Sprint sequence restructured
The sprint sequence below reflects the original plan as designed. The actual current sequence has been revised based on lessons learned during Sprints 1–3. Key changes:

Sprint 3 (Business Owner Dashboard) was completed before Sprint 2 (Post-Booking/Email) — strategic decision to allow full local development while email requires a live environment
Original Sprint 4 (Google Calendar) deferred — requires live site for OAuth callbacks; moved to the Live Environment Sprint
New Sprint 4A: Staff Dashboard Enhancements + Reports & Analytics (~112h) — fully buildable locally
New Sprint 4B: Performance + Accessibility + Security Hardening (~80h) — fully buildable locally
New Sprint 5 (Live Environment Sprint): Payments completion, Email notifications, Magic links, Google Calendar, Load testing — all work requiring a live/public URL batched together
Sprint 6: Launch Preparation — unchanged in scope

The total hours estimate and scope remain broadly the same. The ordering has changed to optimise for parallel local and live work.
For the current active sprint sequence, refer to progress.md.


**⚠️ REVISION — 27/02/26: Sprint sequence restructured + extension plugin architecture adopted**

**Sprint sequence changes:**

All locally-buildable work is now completed before any live site deployment. The original Sprint 4B (Performance + Accessibility + Security) has been pushed back to Sprint 4E. The following new local sprints have been added:

- **Sprint 4B** (~54h): Polish & Infrastructure — extension hook system + API spec, branding, audit logging, migration framework, error system, booking reference format, optimistic locking
- **Sprint 4C** (~72h): Feature Completeness — team calendar, setup wizard, per-service cancellation policy UI (no Stripe execution), bulk actions, GDPR data portability, tooltips
- **Sprint 4D** (~80h): Package Bookings — prepaid session bundles, credit balance, redemption tracking (stays in core, gated by settings toggle)
- **Sprint 4E** (~80h): Security & Quality — WCAG audit, performance optimisation, security hardening, full test coverage

**Sprint 5 (Live Environment) scope additions:**
- Automatic refund execution via Stripe (policy rules configured in Sprint 4C)
- Email notifications for extension plugin features (recurring, classes, waitlist)
- Bookit Meetings extension: Zoom + Google Meet OAuth auto-generation
  (per staff, business-level fallback), WhatsApp link construction
  from staff phone number, Microsoft Teams support

**Extension plugin architecture:**
Three features moved out of the core plugin into separate extension plugins, each with its own Claude project:
- Recurring appointments → **Bookit Recurring**
- Group bookings & classes → **Bookit Classes**
- Custom intake forms → **Bookit Forms**
- Online meeting links → Bookit Meetings (core additions in Sprint 4F;
  OAuth auto-generation in Sprint 5)

Extension plugins are built after Sprint 4B completes and the Extension Plugin API spec document exists. Package bookings remains in core.

**Total local work remaining after Sprint 4A:** ~286h core + ~160h extensions
**Refer to `progress.md` for full sprint details.**
⚠️ REVISION — 21/03/26: Sprint 4H added — Notification Infrastructure

Sprint 4H (~22h) inserted between Sprint 4G and Sprint 5.

Rationale:
Conversations with Brevo's integration documentation and API confirmed
that transactional email and SMS should be implemented via a provider
abstraction layer (driver pattern) rather than direct Brevo coupling.
This allows vendor switching and mixing (e.g. Brevo for email + Twilio
for SMS) by changing a settings dropdown, not touching code.

All of the infrastructure (interfaces, queue table, Action Scheduler
wiring, retry logic, dispatcher, settings UI) is buildable locally
with no live credentials. Sprint 5 activates it with a real Brevo
account and verified sending domain.

Sprint 4H scope:
- Bookit_Email_Provider_Interface + Bookit_SMS_Provider_Interface
- Bookit_Brevo_Email_Provider (primary, uses brevo-php v4 Composer package)
- Bookit_WP_Mail_Fallback_Provider (graceful degradation)
- Bookit_Brevo_SMS_Provider stub
- wp_bookit_email_queue DB table + migration
- Bookit_Notification_Dispatcher (queue, retry, rate limit, 429 handling)
- Settings page: independent email + SMS provider selectors
- Replace existing wp_mail() calls with dispatcher
- Full PHPUnit coverage

Revised local sprint sequence:
  Sprint 4G  (active)   — [bookit_my_packages] shortcode + theme overrides
  Sprint 4H  (new)      — Notification Infrastructure (~22h)
  Sprint 5              — Live Environment (Brevo activation, Stripe live,
                          Google Calendar OAuth, My Packages page)
  Sprint 6              — Launch Preparation

Sprint 5 email scope (now lighter due to 4H):
  Previously: "Transactional email service setup" (large, undefined)
  Now: Brevo account activation, domain verification, template creation,
  template ID configuration, end-to-end send testing, SMS queue +
  dispatcher SMS path, admin email queue log view

### Compliance Update (January 23, 2026)

**Legal compliance work added:** 36 hours across Sprint 4-6 based on UK_Compliance_Checklist_v1_0.md findings. This includes:
- Sprint 4: 14-day cooling-off waiver checkbox (3h)
- Sprint 5: Optional email verification + accessibility statement (11h)
- Sprint 6: Privacy Policy, Terms & Conditions, DPA verification (22h)

**Total effort increased:** 1,005h → 1,041h (+36h, +3.6%)

### Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1 DEVELOPMENT TIMELINE (20-22 WEEKS)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Sprint 0 ━━━━━━ 2 weeks  │ Foundation & Setup                              │
│ Sprint 1 ━━━━━━━━━ 3 weeks │ Core Booking Flow                             │
│ Sprint 2 ━━━━━━━━━ 3 weeks │ Payment Integration                           │
│ Sprint 3 ━━━━━━━━━ 3 weeks │ Post-Booking Management                       │
│ Sprint 4 ━━━━━━━━━━━━ 4 weeks │ Business Owner Dashboard                   │
│ Sprint 5 ━━━━━━━━━ 3 weeks │ Integration & Polish                          │
│ Sprint 6 ━━━━━━ 2 weeks  │ Launch Preparation                              │
│                                                                             │
│ TOTAL: 20 weeks (+ 2 weeks buffer = 22 weeks)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SPRINT 0: FOUNDATION & SETUP
### Weeks 1-2 (40-50 hours)

**Goal:** Establish development foundation, database schema, and plugin boilerplate.

### Deliverables

| Task | Priority | Hours | Owner |
|------|----------|-------|-------|
| WordPress plugin boilerplate setup | MUST | 8h | Dev |
| Database schema implementation (10 tables) | MUST | 16h | Dev |
| Service categories junction table | MUST | 4h | Dev |
| Database UNIQUE constraints | MUST | 4h | Dev |
| Development environment setup | MUST | 6h | Dev |
| PHP session configuration | MUST | 2h | Dev |
| Basic authentication framework | MUST | 8h | Dev |
| Project structure & coding standards | MUST | 4h | Dev |

**Sprint 0 Total:** 52 hours

### Database Tables to Create

```sql
1. wp_bookings                  -- Main bookings table
2. wp_bookings_services         -- Service catalog
3. wp_bookings_categories       -- Service categories
4. wp_bookings_service_categories -- Junction table (many-to-many)
5. wp_bookings_staff            -- Staff members
6. wp_bookings_staff_services   -- Staff-service relationships
7. wp_bookings_customers        -- Customer records
8. wp_bookings_payments         -- Payment transactions
9. wp_bookings_availability     -- Staff availability/schedules
10. wp_bookings_settings        -- Plugin configuration
```

### Exit Criteria

- [ ] Plugin activates without errors
- [ ] All 10 database tables created with correct schema
- [ ] UNIQUE constraints in place for double-booking prevention
- [ ] Development environment functional
- [ ] Basic authentication working for dashboard access
- [ ] Coding standards documented


---

### Sprint 0: Actual Implementation Notes

**Status:** ✅ COMPLETE  
**Completion Date:** January 27, 2026  
**Actual Hours:** 44 / 52 estimated (85% completion)  

---

#### Environment Setup Details

**Development Environment:**
- **Primary:** Local by Flywheel
  - Visual WordPress management
  - Database access via Adminer
  - Used for: Day-to-day development, manual browser testing
  
- **Testing:** wp-env (Docker-based)
  - Version: 10.37.0
  - Configuration: `.wp-env.json` in plugin root
  - WordPress: 6.4
  - PHP: 8.2
  - Ports: 8888 (development), 8889 (tests)
  - Used for: PHPUnit automated tests

**Version Control:**
- Git repository initialized
- Branching strategy: main, develop, feature branches
- Commit workflow: Systematic commits with descriptive messages

---

#### wp-env Integration Details

**Installation Method:**
```bash
npm install -g @wordpress/env
```

**Configuration File (.wp-env.json):**
```json
{
  "core": "WordPress/WordPress#6.4",
  "phpVersion": "8.2",
  "plugins": [ "." ],
  "port": 8888,
  "testsPort": 8889,
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true,
    "WP_ENVIRONMENT_TYPE": "local"
  },
  "mappings": {
    "wp-content/plugins/booking-system": "."
  }
}
```

**npm Scripts Added (package.json):**
```json
{
  "scripts": {
    "wp-env:start": "wp-env start",
    "wp-env:stop": "wp-env stop",
    "wp-env:restart": "wp-env destroy && wp-env start",
    "wp-env:destroy": "wp-env destroy",
    "test": "wp-env run tests-cli --env-cwd=wp-content/plugins/booking-system vendor/bin/phpunit"
  }
}
```

**Common Commands Used:**
```bash
# Start wp-env environment
npm run wp-env:start

# Stop wp-env environment
npm run wp-env:stop

# Restart (fresh environment)
npm run wp-env:restart

# Destroy environment completely
npm run wp-env:destroy

# Run PHPUnit tests
npm test
```

---

#### Usage Pattern

**When to Use Local by Flywheel:**
- Writing PHP code
- Creating/modifying WordPress templates
- Manual browser testing
- Database inspections (via Adminer)
- Visual WordPress admin tasks

**When to Use wp-env:**
- Running PHPUnit unit tests
- Integration testing (automated)
- Verifying code doesn't break existing tests
- Pre-commit test verification

**Typical Workflow:**
1. Code feature in Local by Flywheel
2. Test manually in browser (Local environment)
3. Switch to wp-env for automated PHPUnit tests
4. Fix any failing tests
5. Commit when all tests pass

---

#### Benefits Realized

**Isolation:**
- ✅ Test database completely separate from development database
- ✅ No test data pollution in development environment
- ✅ Can destroy/rebuild test environment without affecting dev work

**Reproducibility:**
- ✅ Same WordPress/PHP versions across team members
- ✅ Configuration in `.wp-env.json` ensures consistency
- ✅ Easy onboarding for new developers

**CI/CD Ready:**
- ✅ wp-env can run in GitHub Actions (future)
- ✅ Same environment locally and in CI pipeline
- ✅ No "works on my machine" issues

**Speed:**
- ✅ Fast environment reset (destroy + start)
- ✅ PHPUnit tests run quickly in isolated container
- ✅ No need to manually configure PHPUnit

---

#### Challenges Encountered & Solutions

**Challenge 1: Database Tables Not Creating on Activation**
- **Issue:** Tables weren't created when plugin activated
- **Cause:** Database connection issues in wp-env
- **Solution:** Used `dbDelta()` with proper SQL formatting
- **Time Lost:** ~2 hours
- **Lesson:** Always verify table creation with `SHOW TABLES;`

**Challenge 2: Log Files Inside Web Root (Security)**
- **Issue:** Initial log location was inside plugin directory
- **Cause:** Default implementation used plugin directory
- **Solution:** Moved logs to `/wp-content/uploads/booking-system-logs/` with `.htaccess` protection
- **Time Lost:** ~3 hours
- **Lesson:** Security considerations should be addressed immediately, not deferred

**Challenge 3: wp-env Learning Curve**
- **Issue:** First time using wp-env, unfamiliar commands
- **Cause:** New tool for developer
- **Solution:** Created npm scripts for common tasks
- **Time Lost:** ~2 hours (setup + learning)
- **Lesson:** npm scripts make wp-env much easier to use

---

#### Sprint 0 Lessons Learned

**What Went Well:**
1. ✅ Hybrid approach (Local + wp-env) provides best of both worlds
2. ✅ npm scripts make wp-env commands memorable and easy
3. ✅ Systematic Git commits maintained clear history
4. ✅ PHPUnit infrastructure working perfectly
5. ✅ Database schema created successfully with proper indexes

**What Could Be Improved:**
1. ⚠️ Should have created .wp-env.json earlier (avoided some trial/error)
2. ⚠️ Security considerations (log location) should be first priority
3. ⚠️ More time needed for wp-env familiarization (underestimated)

**Recommendations for Sprint 1+:**
1. 📋 Always run `npm test` before committing
2. 📋 Use `npm run wp-env:restart` when tests behave unexpectedly
3. 📋 Keep wp-env environment separate (don't modify files inside it)
4. 📋 Commit `.wp-env.json` to repo for team consistency
5. 📋 Document any wp-env issues encountered for future reference

---

#### Time Breakdown (Actual)

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| Plugin boilerplate | 8h | 6h | Faster due to templates |
| Database schema | 10h | 12h | Table creation debugging |
| Authentication framework | 8h | 8h | As expected |
| Admin menu structure | 4h | 3h | Simple implementation |
| Error logging | 4h | 6h | Security location change |
| wp-env setup | - | 5h | Not originally estimated |
| PHPUnit configuration | 6h | 4h | wp-env simplified this |
| **TOTAL** | 40h | 44h | **+10% variance** |

**Analysis:** 
- wp-env setup added 5 hours (not originally estimated)
- PHPUnit setup saved 2 hours (wp-env includes it)
- Security improvements added 2 hours (good investment)
- Overall: 85% estimation accuracy (very good)

---

#### Sprint 0 Exit Criteria - Verification

- [x] **Plugin activates without errors** - ✅ Verified in both Local and wp-env
- [x] **Database tables created with indexes** - ✅ All 10 tables created successfully
- [x] **Authentication framework operational** - ✅ Session handling, nonce verification working
- [x] **Admin menu structure in place** - ✅ Basic menu structure complete
- [x] **Error logging configured** - ✅ Logs to `/wp-content/uploads/booking-system-logs/`
- [x] **Development environment complete** - ✅ Local by Flywheel + wp-env hybrid setup
- [x] **Unit testing infrastructure operational** - ✅ PHPUnit tests run via `npm test`

**Overall Sprint 0 Status:** ✅ **COMPLETE - READY FOR SPRINT 1**

---

#### Files Changed/Created in Sprint 0

**Core Plugin Files:**
- `booking-system.php` (main plugin file)
- `includes/class-booking-system-activator.php` (database setup)
- `includes/class-booking-system-logger.php` (error logging)
- `admin/class-booking-system-admin.php` (admin menu)
- `tests/bootstrap.php` (PHPUnit bootstrap)
- `tests/test-booking-system.php` (initial tests)

**Configuration Files:**
- `.wp-env.json` (wp-env configuration)
- `package.json` (npm scripts)
- `composer.json` (PHP dependencies)
- `phpunit.xml` (PHPUnit configuration)
- `.gitignore` (version control exclusions)

**Documentation Files:**
- `README.md` (plugin documentation)
- `CHANGELOG.md` (version history)

**Total Files:** 14 new files created

**Lines of Code:** ~1,200 lines (including tests and documentation)

---
---

## SPRINT 1: CORE BOOKING FLOW
### Weeks 3-5 (100-120 hours)

**Goal:** Complete 4-step customer booking flow (UI only, no payment processing).

### Deliverables

#### Step 1: Service Selection (Week 3)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Service list display (categories) | MUST | 8h | MUST-001 |
| Service card component (name, duration, price) | MUST | 4h | MUST-002 |
| Responsive grid layout (1/3 columns) | MUST | 6h | MUST-003 |
| "From £X" pricing for variable staff pricing | MUST | 3h | MUST-004 |
| Session storage for selections | MUST | 2h | MUST-005 |
| Service selection validation | MUST | 2h | MUST-006 |
| Service images (optional) | SHOULD | 6h | SHOULD-003 |

**Week 3 Subtotal:** 31 hours

#### Step 2: Staff Selection (Week 3-4)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Staff list filtered by service | MUST | 6h | MUST-007 |
| Staff card component (photo, bio, price) | MUST | 8h | MUST-008 |
| "No Preference" option | MUST | 6h | MUST-009 |
| Alphabetical ordering | MUST | 1h | MUST-010 |
| "Least Busy" algorithm | MUST | 12h | MUST-011 |
| Availability status indicators | MUST | 8h | MUST-012 |
| No staff available handling | MUST | 3h | MUST-013 |

**Week 3-4 Subtotal:** 44 hours

#### Step 3: Date & Time Selection (Week 4-5)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Monthly calendar component | MUST | 16h | MUST-014 |
| UK bank holiday blocking | MUST | 4h | MUST-015 |
| Same-day lead time enforcement | MUST | 3h | MUST-016 |
| Time slot generation (15-min increments) | MUST | 6h | MUST-017 |
| Morning/Afternoon/Evening grouping | MUST | 4h | MUST-018 |
| Availability calculation (duration + buffer) | MUST | 12h | MUST-019 |
| Auto-refresh every 30 seconds | MUST | 4h | MUST-020 |
| 365-day booking window | MUST | 2h | MUST-021 |
| Past date prevention | MUST | 2h | MUST-022 |
| No availability messaging | MUST | 3h | MUST-023 |

**Week 4-5 Subtotal:** 56 hours

#### Step 4: Contact Details (Week 5, No Payment Yet)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Contact form (name, email, phone) | MUST | 4h | MUST-024 |
| UK phone validation | MUST | 3h | MUST-025 |
| Email validation + typo detection | MUST | 4h | MUST-026 |
| Special requests field | MUST | 2h | MUST-027 |
| GDPR consent checkbox | MUST | 2h | MUST-028 |

**Week 5 Subtotal:** 15 hours

### Sprint 1 Total: 146 hours

### Exit Criteria

- [ ] Customer can complete Steps 1-4 (without payment)
- [ ] Service selection persists through session
- [ ] Staff selection shows availability status
- [ ] Calendar shows available dates/times
- [ ] Form validation works correctly
- [ ] Responsive design works on mobile
- [ ] GDPR consent captured

### Demo Milestone

**End of Sprint 1 Demo:** Customer can browse services, select staff, pick date/time, and enter contact details. No booking is created yet (payment required first).

---

## SPRINT 2: PAYMENT INTEGRATION
### Weeks 6-8 (100-120 hours)

**Goal:** Integrate Stripe and PayPal, complete booking creation flow.

### Deliverables

#### Stripe Integration (Week 6-7)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Stripe SDK integration | MUST | 4h | MUST-111 |
| Checkout Session creation | MUST | 12h | MUST-111 |
| Stripe webhook endpoint | MUST | 12h | MUST-112 |
| Payment success handling | MUST | 8h | MUST-112 |
| Idempotency key implementation | MUST | 4h | MUST-114 |
| Stripe refund API | MUST | 8h | MUST-113 |
| Test mode configuration | MUST | 4h | MUST-076 |

**Week 6-7 Subtotal:** 52 hours

#### PayPal Integration (Week 7-8)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| PayPal SDK integration | MUST | 4h | SHOULD-030 |
| PayPal Checkout flow | MUST | 12h | SHOULD-030 |
| PayPal webhook handling | MUST | 8h | SHOULD-030 |
| PayPal refund API | MUST | 8h | MUST-048 |
| Client ID/secret configuration | MUST | 4h | MUST-077 |

**Week 7-8 Subtotal:** 36 hours

#### Booking Creation (Week 8)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Atomic booking creation after payment | MUST | 8h | MUST-032 |
| Database UNIQUE constraint handling | MUST | 4h | MUST-031 |
| Race condition error messaging | MUST | 4h | MUST-033 |
| Deposit vs full payment calculation | MUST | 3h | MUST-030 |
| Pay-on-Arrival option | MUST | 4h | MUST-080 |
| Booking confirmation page | MUST | 6h | - |
| Payment failure handling | MUST | 6h | - |

**Week 8 Subtotal:** 35 hours

### Sprint 2 Total: 123 hours

### Exit Criteria

- [ ] Stripe test payment completes successfully
- [ ] PayPal test payment completes successfully
- [ ] Pay-on-Arrival creates booking without payment
- [ ] Booking record created in database
- [ ] Double-booking prevented by UNIQUE constraint
- [ ] Race condition shows friendly error message
- [ ] Refund API tested in sandbox

### Demo Milestone

**End of Sprint 2 Demo:** Customer can complete full booking with Stripe, PayPal, or Pay-on-Arrival. Booking appears in database.

---

## SPRINT 3: POST-BOOKING MANAGEMENT
### Weeks 9-11 (100-120 hours)

**Goal:** Email notifications, cancellation, rescheduling flows.

### Deliverables

#### Email System (Week 9)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Email service integration (SendGrid/Mailgun) | MUST | 16h | MUST-115 |
| Email queue system with retry | MUST | 8h | MUST-116 |
| Template variable substitution engine | MUST | 6h | MUST-117 |
| Confirmation email template | MUST | 4h | MUST-034 |
| iCal attachment generation | MUST | 4h | MUST-035 |
| Send confirmation immediately after booking | MUST | 2h | MUST-034 |

**Week 9 Subtotal:** 40 hours

#### Reminder & Notification Emails (Week 10)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| WP-Cron setup for reminders | MUST | 4h | MUST-128 |
| 24-hour reminder email | MUST | 6h | MUST-036 |
| Staff new booking notification | MUST | 4h | MUST-039 |
| Magic link generation (7-day validity) | MUST | 8h | MUST-042 |
| Cancellation confirmation email | MUST | 4h | MUST-037 |
| Rescheduling confirmation email | MUST | 4h | MUST-038 |
| Never fail booking on email failure | MUST | 2h | MUST-043 |
| Customizable email templates | MUST | 12h | MUST-040 |

**Week 10 Subtotal:** 44 hours

#### Cancellation Flow (Week 10-11)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Magic link cancellation page | MUST | 8h | MUST-044 |
| Cancellation policy enforcement | MUST | 4h | MUST-044 |
| Auto-refund within policy window | MUST | 8h | MUST-045 |
| Late cancellation approval workflow | MUST | 6h | MUST-046 |
| Stripe refund processing | MUST | 4h | MUST-047 |
| PayPal refund processing | MUST | 4h | MUST-048 |
| Manual refund for Pay-on-Arrival | MUST | 3h | MUST-049 |
| Booking status update | MUST | 2h | MUST-050 |
| Google Calendar deletion | MUST | 4h | MUST-051 |
| Retain cancelled record | MUST | 1h | MUST-052 |

**Week 10-11 Subtotal:** 44 hours

#### Rescheduling Flow (Week 11)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Magic link rescheduling page | MUST | 8h | MUST-053 |
| Availability picker (reuse from booking) | MUST | 4h | - |
| Deposit transfer logic | MUST | 6h | MUST-054 |
| Original booking status update | MUST | 3h | MUST-055 |
| New booking creation linked | MUST | 4h | MUST-056 |
| Google Calendar event update | MUST | 4h | MUST-057 |
| Availability validation | MUST | 3h | MUST-058 |

**Week 11 Subtotal:** 32 hours

### Sprint 3 Total: 160 hours

### Exit Criteria

- [ ] Confirmation email sends with iCal attachment
- [ ] Reminder email sends 24h before
- [ ] Magic link cancellation works
- [ ] Magic link rescheduling works
- [ ] Refunds process automatically (within policy)
- [ ] Late cancellation requires approval
- [ ] Email queue retries on failure
- [ ] Custom template variables work

### Demo Milestone

**End of Sprint 3 Demo:** Complete post-booking lifecycle—customer receives emails, can cancel/reschedule via magic links, refunds process automatically.

---

## SPRINT 4: BUSINESS OWNER DASHBOARD
### Weeks 12-15 (140-160 hours)

**Goal:** Separate dashboard for Business Owners with booking management and configuration.

### Deliverables

#### Dashboard Foundation (Week 12)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Separate dashboard (not WP admin) | MUST | 24h | MUST-127 |
| Dashboard authentication | MUST | 8h | - |
| Sidebar navigation component | MUST | 6h | - |
| Today's schedule widget | SHOULD | 12h | SHOULD-006 |
| Quick actions buttons | MUST | 4h | MUST-069 |

**Week 12 Subtotal:** 54 hours

#### Booking Management (Week 13)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Calendar view | MUST | 12h | MUST-063 |
| List view | MUST | 8h | MUST-063 |
| Booking filtering (date, staff, service, status) | MUST | 8h | MUST-064 |
| Booking search | SHOULD | 8h | SHOULD-010 |
| Manual booking creation | MUST | 12h | MUST-065 |
| Edit booking details | MUST | 8h | MUST-066 |
| Quick actions (complete, no-show) | MUST | 6h | MUST-069 |
| Admin cancellation with refund | MUST | 6h | MUST-067 |
| Real-time status updates | MUST | 6h | MUST-068 |

**Week 13 Subtotal:** 74 hours

#### Service & Staff Management (Week 14)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Service CRUD interface | MUST | 10h | MUST-073 |
| Service categories management | MUST | 6h | MUST-074 |
| Service duration/buffer settings | MUST | 4h | MUST-075 |
| Staff CRUD interface | MUST | 12h | MUST-070 |
| Staff working hours configuration | MUST | 10h | MUST-071 |
| Split shifts support | MUST | 4h | MUST-071 |
| Staff-specific pricing | MUST | 6h | MUST-072 |

**Task 9: Staff CRUD Interface** ✅ COMPLETE
- Duration: 10 hours (actual: 10.5 hours)
- Status: Complete with enhancements
- Backend: Staff list, create, update, delete, service assignments
- Frontend: Staff list page, form modal, photo upload, password reset
- Enhancements: WordPress media library integration, password reset feature, first admin creation
- Deferred: Self-service password reset (Phase 2), My Profile (Task 11)


**Task 10: Staff Working Hours Configuration** ✅ COMPLETE
- Duration: 12 hours (actual: 12 hours)
- Status: Complete with tooltips
- Backend: Working hours API (weekly schedule + exceptions)
- Frontend: Working hours page with calendar, tooltips
- Integration: No changes to datetime model (works perfectly)
- Deferred: Shift scheduling (Sprint 4/Phase 2)

**Week 14 Subtotal:** 52 hours

#### Configuration & Reporting (Week 15)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Setup wizard (4 steps) | MUST | 16h | MUST-059-062 |
| Payment gateway configuration | MUST | 4h | MUST-076, MUST-077 |
| Deposit settings | MUST | 4h | MUST-078 |
| Cancellation policy settings | MUST | 6h | MUST-079 |
| Weekly/monthly revenue totals | SHOULD | 12h | SHOULD-007 |
| Revenue reports by date range | SHOULD | 16h | SHOULD-008 |
| Customer database list | SHOULD | 12h | SHOULD-011 |
| Customer CSV export | SHOULD | 6h | SHOULD-014 |
| 14-day cooling-off waiver checkbox | MUST | 3h | REQ-LEGAL-003 |

**Week 15 Subtotal:** 79 hours

### Sprint 4 Total: 259 hours

### Exit Criteria

- [ ] Business Owner can log in to separate dashboard
- [ ] All bookings visible in calendar and list views
- [ ] Can create manual booking
- [ ] Can add/edit services and categories
- [ ] Can add/edit staff with working hours
- [ ] Setup wizard guides first-time configuration
- [ ] Basic revenue reporting works
- [ ] Customer list with search works

### Demo Milestone

**End of Sprint 4 Demo:** Business Owner can manage entire booking operation from dashboard without touching WordPress admin.

---

## SPRINT 5: INTEGRATION & POLISH
### Weeks 16-18 (80-100 hours)

**Goal:** Google Calendar sync, staff dashboard, performance optimization, accessibility audit.

### Deliverables

#### Google Calendar Integration (Week 16)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| OAuth 2.0 authentication flow | MUST | 12h | MUST-118 |
| Create calendar event on booking | MUST | 8h | MUST-119 |
| Update event on reschedule | MUST | 6h | MUST-120 |
| Delete event on cancellation | MUST | 4h | MUST-121 |
| One-way sync architecture | MUST | 2h | MUST-122 |
| OAuth token refresh handling | MUST | 4h | - |

**Week 16 Subtotal:** 36 hours

#### Staff Dashboard (Week 17)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Staff personal schedule view | SHOULD | 16h | SHOULD-016 |
| Upcoming appointments with details | SHOULD | 6h | SHOULD-017 |
| Mark appointment complete | SHOULD | 4h | SHOULD-018 |
| Mark appointment no-show | SHOULD | 4h | SHOULD-019 |
| Staff time-off blocking | SHOULD | 12h | SHOULD-020 |
| Recurring time blocks | SHOULD | 8h | SHOULD-021 |

**Week 17 Subtotal:** 50 hours

#### Performance & Accessibility (Week 18)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Lighthouse optimization (target ≥90) | SHOULD | 8h | SHOULD-022 |
| Critical CSS implementation | MUST | 4h | MUST-082 |
| JS bundle optimization | MUST | 4h | MUST-083 |
| Accessibility audit (automated) | MUST | 4h | MUST-103-110 |
| Keyboard navigation testing | MUST | 4h | MUST-106 |
| Focus indicator review | MUST | 4h | MUST-107 |
| Color contrast verification | MUST | 6h | MUST-104 |
| Screen reader testing (basic) | SHOULD | 8h | SHOULD-025 |
| Email change verification workflow | SHOULD | 7h | REQ-LEGAL-007 |
| Accessibility Statement creation | SHOULD | 4h | REQ-LEGAL-005 |

**NEW: Hosting Validation**
- [ ] Create test scenario: 3 staff using dashboard simultaneously
- [ ] Use browser dev tools to measure page load times
- [ ] Run `ab -n 50 -c 5` on dashboard URL (concurrent load test)
- [ ] Document actual query counts vs. projected (3,560/day)
- [ ] If >5 second load times, investigate optimization or revise hosting strategy
- [ ] Update Hosting Infrastructure Strategy doc with findings

**Week 18 Subtotal:** 53 hours

### Sprint 5 Total: 139 hours

### Exit Criteria

- [ ] Google Calendar sync creates events
- [ ] Staff can view and manage their schedule
- [ ] Lighthouse score ≥90
- [ ] WCAG 2.1 AA core requirements pass
- [ ] Keyboard navigation works throughout
- [ ] Performance targets met (<2s page load)

### Demo Milestone

**End of Sprint 5 Demo:** Full integration demo—booking creates Google Calendar event, staff sees in their dashboard, all performance and accessibility tests pass.

---

## SPRINT 6: LAUNCH PREPARATION
### Weeks 19-20 (+ 2 weeks buffer = 22 weeks)

**Goal:** Security hardening, testing, documentation, first client deployment.

### Deliverables

#### Security & Testing (Week 19)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Security audit (OWASP checklist) | MUST | 12h | - |
| SQL injection testing | MUST | 4h | MUST-095 |
| XSS testing | MUST | 4h | MUST-096 |
| CSRF testing | MUST | 4h | MUST-097 |
| Rate limiting implementation | MUST | 4h | MUST-089 |
| Webhook signature verification | MUST | 6h | MUST-094 |
| End-to-end testing (happy paths) | MUST | 16h | - |
| Edge case testing | MUST | 12h | - |
| Load testing (50 concurrent users) | MUST | 8h | - |

**Week 19 Subtotal:** 70 hours
#### Legal Compliance (Week 20)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| Privacy Policy template creation | MUST | 10h | REQ-LEGAL-001 |
| Terms & Conditions template creation | MUST | 7h | REQ-LEGAL-002 |
| Data Processing Agreements verification | MUST | 3h | REQ-LEGAL-004 |
| ICO Registration guidance document | SHOULD | 2h | REQ-LEGAL-006 |
| Legal review (external - optional) | SHOULD | - | £500-1,500 |

**Week 20 Legal Compliance Subtotal:** 22 hours


#### Documentation & Launch (Week 20)

| Task | Priority | Hours | Reference |
|------|----------|-------|-----------|
| User documentation (Business Owner) | MUST | 12h | - |
| User documentation (Staff) | MUST | 6h | - |
| Setup guide | MUST | 8h | - |
| Training video scripts | SHOULD | 8h | - |
| First client site setup | MUST | 16h | - |
| First client training | MUST | 4h | - |
| Bug fixes from testing | MUST | 16h | - |

**Week 20 Documentation Subtotal:** 70 hours
**Week 20 Total (Legal + Documentation):** 92 hours

### Sprint 6 Total: 162 hours

### Exit Criteria

- [ ] Security audit complete (no critical issues)
- [ ] All happy path tests pass
- [ ] Load test passes (50 concurrent users)
- [ ] Documentation complete
- [ ] First client site deployed
- [ ] First client trained
- [ ] Privacy Policy published and linked
- [ ] Terms & Conditions published and linked
- [ ] 14-day waiver checkbox implemented and tested
- [ ] All third-party DPAs verified

### Launch Milestone

**PHASE 1 COMPLETE:** First client live, accepting bookings, all core features functional.

---

## BUFFER ALLOCATION

### Built-in Buffer: 2 weeks

| Week | Purpose |
|------|---------|
| Week 21 | Bug fixes, scope adjustment |
| Week 22 | Emergency buffer, polish |

### Buffer Usage Guidelines

1. **Priority 1:** Fix blocking bugs discovered in testing
2. **Priority 2:** Complete any incomplete MUST requirements
3. **Priority 3:** Add highest-priority SHOULD requirements not yet done
4. **Priority 4:** Performance and UX polish

---

## TOTAL EFFORT SUMMARY

| Sprint | Weeks | Hours |
|--------|-------|-------|
| Sprint 0: Foundation | 1-2 | 52h |
| Sprint 1: Core Booking | 3-5 | 146h |
| Sprint 2: Payment | 6-8 | 123h |
| Sprint 3: Post-Booking | 9-11 | 160h |
| Sprint 4: Dashboard | 12-15 | 256h |
| Sprint 5: Integration | 16-18 | 128h |
| Sprint 6: Launch | 19-20 | 140h |
| **TOTAL** | **20 weeks** | **1,041h** |

### Effort by Category

| Category | Hours | % of Total |
|----------|-------|------------|
| Customer Booking Flow | 269h | 27% |
| Payment Integration | 123h | 12% |
| Post-Booking (Email, Cancel, Reschedule) | 160h | 16% |
| Business Owner Dashboard | 256h | 25% |
| Staff Dashboard | 50h | 5% |
| Google Calendar Integration | 36h | 4% |
| Security & Testing | 70h | 7% |
| Documentation & Launch | 41h | 4% |

---

## RISK MITIGATION SCHEDULE

### High-Risk Items (Start Early)

| Risk | Sprint | Mitigation |
|------|--------|------------|
| Payment integration complexity | Sprint 2 (Week 6) | Start with Stripe, well-documented |
| Calendar sync reliability | Sprint 5 (Week 16) | Comprehensive error handling |
| Performance on shared hosting | Sprint 5 (Week 18) | Early performance testing |
| Accessibility compliance | Sprint 5 (Week 18) | Audit at 50% and 90% |

### Dependencies

```
Sprint 0 → Sprint 1 (database required for booking flow)
Sprint 1 → Sprint 2 (booking flow required for payment)
Sprint 2 → Sprint 3 (payment required for confirmation email)
Sprint 3 → Sprint 4 (email system required for dashboard notifications)
Sprint 4 → Sprint 5 (dashboard required for staff dashboard)
Sprint 5 → Sprint 6 (all features required for testing)
```

---

## SUCCESS METRICS

### Weekly Progress Tracking

| Week | Milestone | Acceptance Criteria |
|------|-----------|---------------------|
| Week 2 | Foundation Complete | Plugin activates, database created |
| Week 5 | Booking Flow Complete | Customer completes Steps 1-4 |
| Week 8 | Payment Complete | Stripe/PayPal payments work |
| Week 11 | Post-Booking Complete | Email, cancel, reschedule work |
| Week 15 | Dashboard Complete | Business Owner manages bookings |
| Week 18 | Integration Complete | Google Calendar syncs |
| Week 20 | Launch Ready | First client deployed |

### Quality Gates

| Gate | Criteria | When |
|------|----------|------|
| Code Review | All code reviewed before merge | Every PR |
| Unit Tests | Core functions covered | Sprint 2+ |
| Integration Tests | API endpoints tested | Sprint 3+ |
| Accessibility Check | WCAG compliance | Sprint 5 |
| Security Audit | OWASP checklist | Sprint 6 |
| Load Test | 50 concurrent users | Sprint 6 |

---

## DOCUMENT APPROVAL

| Role | Name | Status | Date |
|------|------|--------|------|
| Project Lead | Liron | Pending | |
| Technical Lead | TBD | Pending | |

---

**Document Version:** 1.0  
**Created:** January 22, 2026  
**Based On:** MoSCoW Prioritized Requirements v1.0

---

*End of Development Sequence Plan*
