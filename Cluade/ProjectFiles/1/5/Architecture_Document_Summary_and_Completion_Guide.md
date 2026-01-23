# SYSTEM ARCHITECTURE DOCUMENT - COMPLETION STATUS

**Project:** WordPress Booking Plugin Phase 1 MVP  
**Document Version:** 1.0 (In Progress)  
**Date:** January 23, 2026  
**Status:** Part 1 Complete (Sections 1-8), Part 2 Required (Sections 9-19)

---

## COMPLETION STATUS

### ✅ COMPLETED SECTIONS (Part 1 - 55% Complete)

**Sections 1-8 are FULLY COMPLETE and ready for review:**

1. **Executive Summary** (3 pages) ✅
   - Project overview, unique differentiators
   - Architecture philosophy (5 core principles)
   - Technology stack summary
   - Critical success factors
   - Document scope

2. **System Overview** (4 pages) ✅
   - High-level architecture diagram
   - Component descriptions (5 major components)
   - Data flow diagram (customer booking journey)
   - External integration touchpoints
   - Deployment architecture

3. **Unique Differentiator: Separate Business Dashboard** (6 pages) ✅
   - Market gap analysis
   - Architecture approach evaluation (hybrid model selected)
   - URL structure decision (subdirectory recommended)
   - Authentication strategy (PHP $_SESSION selected over JWT)
   - Dashboard ↔ WordPress communication (REST API endpoints)
   - Dashboard technology stack (Vue 3 + Tailwind)
   - White-label capability (3 branding modes)
   - Success criteria

4. **WordPress Plugin Architecture** (5 pages) ✅
   - Complete directory structure (detailed file tree)
   - Main plugin file structure
   - MVC pattern implementation (Models, Controllers, Views examples)
   - WordPress hooks and filters strategy
   - Activation, deactivation, uninstall procedures
   - wp-config.php configuration requirements

5. **Database Architecture** (8 pages) ✅
   - Complete schema for all 10 tables with SQL
   - Entity relationship diagram
   - Index strategy (with query examples and EXPLAIN validation plan)
   - Race condition handling (Gap #1 resolution - UNIQUE constraints)
   - Soft delete strategy (GDPR compliance)
   - Database migrations strategy
   - Backup and recovery procedures

6. **Customer Booking Flow Architecture** (6 pages) ✅
   - 4-step wizard detailed breakdown
   - Step 1: Service selection
   - Step 2: Staff selection ("No Preference" algorithm)
   - Step 3: Date/time selection (availability algorithm)
   - Step 4: Contact details & payment
   - Session management (security configuration)
   - Abandoned booking recovery (simplified Phase 1 approach)
   - Mobile responsiveness implementation

7. **Payment Integration Architecture** (5 pages) ✅
   - Dual gateway strategy (Stripe + PayPal)
   - Stripe Checkout Session implementation
   - Webhook handler implementation (with idempotency)
   - Refund processing logic
   - PayPal Orders API flow
   - Payment state machine
   - Deposit vs full payment calculation
   - PCI DSS compliance (SAQ A level)

8. **Email Notification Architecture** (4 pages) ✅
   - Critical decision: Transactional email service required
   - Provider comparison (SendGrid recommended)
   - 6 email templates (with HTML example)
   - Variable substitution engine
   - Email queue with Action Scheduler
   - SendGrid integration code
   - iCal file generation

---

### 🔄 REMAINING SECTIONS (Part 2 - 45% Required)

**Sections 9-19 need to be completed:**

9. **Google Calendar Integration Architecture** (4 pages)
   - OAuth 2.0 authentication flow (per-staff)
   - Token storage (encrypted)
   - Event CRUD operations
   - Rate limits (1,000 events/day monitoring)
   - Error handling (non-blocking)
   - Phase 2 preparation (2-way sync architecture)

10. **Security Architecture** (5 pages)
    - Authentication (3 user types)
    - Session security (8-hour timeout, regeneration)
    - Data encryption (AES-256-GCM for API keys/tokens)
    - Input validation (prepared statements, escaping, nonces)
    - Payment security (PCI DSS)
    - Rate limiting (5 failed logins per 15 min)

11. **Accessibility Architecture (WCAG 2.1 AA)** (4 pages)
    - Semantic HTML5 requirements
    - Color contrast (≥4.5:1 normal text)
    - Keyboard navigation implementation
    - Screen reader support (ARIA labels, live regions)
    - Touch targets (44×44px minimum)
    - Testing methodology

12. **Performance Architecture** (4 pages)
    - Performance targets (<2s page load on 3G)
    - Frontend optimization (critical CSS, lazy-load)
    - Backend optimization (query caching, prepared statements)
    - Database optimization (composite indexes)
    - CDN strategy
    - Monitoring (Lighthouse, New Relic)

13. **UK Compliance Architecture** (4 pages)
    - GDPR data rights implementation
    - Data retention (7 years with anonymization)
    - Privacy Policy requirements
    - Terms & Conditions display
    - Cookie consent (not for booking, yes for analytics)
    - Email opt-in (explicit consent)
    - Data breach notification procedure

14. **Technology Stack Decisions** (3 pages)
    - Backend rationale (PHP 8.0+, WordPress 6.0+, MySQL 5.7+)
    - Frontend rationale (Vanilla JS for public, Vue 3 for dashboard)
    - WordPress plugins/libraries
    - Composer dependencies
    - Development tools (PHPUnit, Postman, Local by Flywheel)

15. **Deployment Architecture** (3 pages)
    - Hosting requirements
    - WordPress installation approach
    - Plugin installation process
    - Database migration strategy
    - Environment configuration (dev, staging, production)
    - Secret management (API keys in wp-config.php)
    - Client delivery process (7 steps)

16. **Error Handling & Logging** (3 pages)
    - Error logging strategy (file-based + Sentry optional)
    - Log rotation (weekly, 4-week retention)
    - What to log (API errors, payment failures, database errors)
    - What NOT to log (passwords, card numbers, API keys)
    - Error reporting (admin dashboard widget)
    - Critical error alerts (payment gateway down, email failure >5%)

17. **Testing Strategy** (3 pages)
    - Unit tests (PHPUnit, 80% coverage target)
    - Integration tests (payment webhooks, email, calendar)
    - Functional tests (complete booking flow)
    - Security testing (OWASP ZAP scan)
    - Accessibility testing (aXe-core + manual screen reader)
    - Performance testing (Lighthouse, 50 concurrent users)
    - User acceptance testing

18. **Phase 2 Architecture Preparation** (3 pages)
    - SMS notifications (Twilio architecture)
    - Recurring appointments (database schema additions)
    - 2-way Google Calendar sync (webhook subscriptions)
    - Multi-location support (settings table extensions)
    - Enhanced reporting (aggregations, data warehouse considerations)
    - REST API for mobile app
    - Mobile app readiness

19. **Architecture Review Checklist** (2 pages)
    - Requirements coverage verification
    - Technical decisions checklist
    - Compliance verification
    - Performance targets confirmation
    - Security hardening checklist
    - Deployment readiness checklist

---

## WHAT'S BEEN ACCOMPLISHED

### Comprehensive Documentation Delivered (Part 1):

1. **~2,700 lines of detailed architecture documentation**
2. **20+ code examples** (PHP, JavaScript, SQL, HTML/CSS)
3. **8 detailed diagrams** (system architecture, data flow, database ER diagram)
4. **50+ specific architectural decisions documented and justified**
5. **Complete database schema** with all 10 tables validated against requirements
6. **Race condition solution** fully architected (Gap #1)
7. **Dual payment gateway integration** (Stripe + PayPal) fully specified
8. **Email notification system** with transactional service requirement

### Key Architectural Decisions Locked In:

✅ **Separate Dashboard:** Hybrid approach (Vue 3 SPA + WordPress REST API)  
✅ **Authentication:** PHP $_SESSION for Phase 1, JWT-ready for Phase 2  
✅ **URL Structure:** Subdirectory (`/dashboard/`) for Phase 1  
✅ **Database:** Custom tables with UNIQUE constraints for race conditions  
✅ **Payment Flow:** Redirect to hosted pages (PCI SAQ A compliance)  
✅ **Email Service:** Transactional service REQUIRED (not wp_mail)  
✅ **Session Storage:** PHP $_SESSION (not localStorage or client-side)  
✅ **Frontend Framework:** Vanilla JS for public, Vue 3 for dashboard  

---

## HOW TO COMPLETE THE DOCUMENT

### Option 1: Continue with Claude (Recommended)

**In a new chat session, provide:**

1. This summary document
2. The completed Part 1 (System_Architecture_Document_PART1_Sections_1-8.md)
3. Relevant project knowledge files:
   - `SRS_WordPress_Booking_Plugin_v1_0.md` (for requirements reference)
   - `TechnicalRequirements.md` (for NFRs, security, accessibility)
   - `IntegrationRequirements_Phase1.md` (for Google Calendar details)
   - `UK_Compliance_Checklist_v1_0.md` (for compliance section)
   - `Development_Sequence_Plan.md` (for testing strategy)

**Prompt:**
> "Complete sections 9-19 of the System Architecture Document following the structure outlined in the summary document. Maintain the same level of detail, code examples, and justification as in Part 1. Reference the SRS and other project documents to ensure accuracy."

### Option 2: Manual Completion

Use Part 1 as the quality standard and template. For each section 9-19:

1. **Read the relevant project knowledge files** (listed in each section description above)
2. **Follow the level of detail** demonstrated in sections 1-8
3. **Include code examples** where architectural patterns need to be illustrated
4. **Justify decisions** with reference to requirements (MUST-X, NFR-X.X, etc.)
5. **Add diagrams** where helpful (ASCII art or descriptions)
6. **Cross-reference** earlier sections where appropriate

### Quality Checklist for Each Section:

- [ ] References specific requirements from SRS (e.g., "MUST-127: Custom dashboard")
- [ ] Includes code examples where appropriate
- [ ] Explains WHY decisions were made (not just WHAT)
- [ ] Addresses UK-specific requirements where relevant
- [ ] Considers Phase 2 extensibility
- [ ] Provides concrete implementation guidance
- [ ] Is ~3-5 pages as specified in the structure

---

## CRITICAL REMINDERS FOR COMPLETION

### 1. Google Calendar Integration (Section 9)

**Key Points to Cover:**
- OAuth 2.0 per-staff authentication (not site-wide)
- Token storage encrypted with AES-256-GCM
- Event creation, update, deletion via Calendar API v3
- Rate limit: 1,000 events/day per user (monitoring strategy)
- **Non-blocking error handling** (booking succeeds even if calendar sync fails)
- Phase 2 prep: Webhook subscriptions for 2-way sync

**Reference:** `IntegrationRequirements_Phase1.md` §5 has complete Google Calendar specs

### 2. Security Architecture (Section 10)

**Key Points to Cover:**
- **3 authentication systems:**
  1. WordPress admin (standard WP auth)
  2. Dashboard users (PHP $_SESSION with dashboard_only flag)
  3. Customer magic links (32-byte tokens, 7-day expiry)
- Session security: HttpOnly, Secure, SameSite=Lax cookies
- Data encryption: AES-256-GCM for API keys, OAuth tokens (BOOKING_ENCRYPTION_KEY from wp-config.php)
- Input validation: Prepared statements, WordPress escaping functions, nonce verification
- Rate limiting: 5 failed logins per 15 minutes per IP

**Reference:** `TechnicalRequirements.md` §2 has all security requirements (NFR-2.1 through NFR-2.20)

### 3. Accessibility Architecture (Section 11)

**Key Points to Cover:**
- **WCAG 2.1 Level AA compliance** (UK legal requirement)
- Semantic HTML5: nav, main, article, aside, header, footer
- Color contrast: ≥4.5:1 for normal text, ≥3:1 for large text
- Keyboard navigation: Tab order, visible focus indicators (≥2px outline)
- Screen reader support: ARIA labels, live regions, form error announcements
- Touch targets: ≥44×44 CSS pixels
- Testing: aXe-core automation + manual NVDA/VoiceOver testing

**Reference:** `TechnicalRequirements.md` §5 has all accessibility requirements (NFR-4.1 through NFR-4.23)

### 4. Performance Architecture (Section 12)

**Key Points to Cover:**
- **Target: <2 seconds page load on 3G** (NFR-1.1)
- Frontend: Critical CSS inline, lazy-load images, defer non-critical JS
- Backend: Query result caching (60-second TTL), prepared statement caching
- Database: Composite indexes on (staff_id, booking_date, start_time)
- Monitoring: Google Lighthouse (weekly automated), MySQL slow query log (>200ms)
- Target Lighthouse score: ≥90

**Reference:** `TechnicalRequirements.md` §1 has all performance requirements (NFR-1.1 through NFR-1.19)

### 5. UK Compliance Architecture (Section 13)

**Key Points to Cover:**
- GDPR data rights: Access, rectification, erasure, portability
- Data retention: 7 years (HMRC) but anonymized on deletion request
- Privacy Policy: Must be published before first booking
- Terms & Conditions: Accessible before payment
- 14-day cooling-off waiver: Checkbox for services within 14 days
- Cookie consent: Required for analytics (NOT for booking functionality)
- Email opt-in: Explicit consent checkbox for marketing
- Data breach: 72-hour ICO reporting procedure

**Reference:** `UK_Compliance_Checklist_v1_0.md` has complete compliance verification (91% covered, 7 minor gaps)

### 6. Technology Stack Decisions (Section 14)

**Already Decided - Document Rationale:**

**Backend:**
- PHP 8.0+ (WordPress requirement, performance over 7.4)
- WordPress 6.0+ (block editor, REST API improvements)
- MySQL 5.7+ / MariaDB 10.3+ (JSON support, performance)

**Frontend - Public Booking Page:**
- Vanilla JavaScript (no React/Vue - minimize bundle size)
- Tailwind CSS via CDN (utility-first, no build step)
- Flatpickr (date picker - lightweight, accessible)

**Frontend - Business Dashboard:**
- **Vue 3** (vs React: smaller bundle size, simpler state management, better admin UI docs)
- Vue Router (client-side routing)
- Pinia (state management)
- Axios (HTTP requests)

**WordPress Plugins/Libraries:**
- Action Scheduler (email queue)
- WordPress REST API (dashboard communication)

**Composer Dependencies:**
- Stripe PHP SDK (stripe/stripe-php)
- PayPal PHP SDK (paypal/rest-api-sdk-php)
- Google API Client (google/apiclient)
- OAuth library (league/oauth2-google)

**Development Tools:**
- PHPUnit (unit testing)
- Postman (API testing)
- Local by Flywheel or Docker (local environment)

**Reference:** Compare alternatives, document why each choice was made

### 7. Phase 2 Architecture Preparation (Section 18)

**Key Points to Cover:**
- SMS notifications: Twilio integration architecture (20-30h implementation)
- Recurring appointments: Database schema extensions (series_id field, recurrence_rules table)
- 2-way Google Calendar sync: Webhook subscriptions, conflict resolution strategy
- Multi-location support: settings table extensions, location_id field additions
- Enhanced reporting: Aggregation tables, data warehouse considerations
- REST API: Public API for mobile app (authentication, rate limiting)
- Mobile app readiness: JWT authentication, push notifications

**Reference:** `MoSCoW_Prioritized_Requirements.md` SHOULD HAVE and COULD HAVE sections

---

## DELIVERABLES CHECKLIST

Once sections 9-19 are complete, verify:

### Content Completeness:
- [ ] All 19 sections present (30-40 pages total)
- [ ] Every section includes code examples where appropriate
- [ ] All architectural decisions reference specific requirements
- [ ] Diagrams included where helpful

### Requirements Coverage:
- [ ] All 78 MUST HAVE requirements addressed
- [ ] All 40+ non-functional requirements (NFRs) addressed
- [ ] All 4 external integrations designed (Stripe, PayPal, Google, Email)
- [ ] Separate dashboard architecture clearly specified
- [ ] 10 database tables validated against requirements

### Technical Decisions:
- [ ] Frontend framework selected (Vue 3 for dashboard - CONFIRMED)
- [ ] Session vs JWT decision documented (PHP $_SESSION - CONFIRMED)
- [ ] Transactional email service required (NOT optional - CONFIRMED)
- [ ] Database constraint strategy documented (UNIQUE constraints - CONFIRMED)
- [ ] Encryption key storage location (wp-config.php - CONFIRMED)

### Compliance:
- [ ] GDPR data rights architecture specified
- [ ] WCAG 2.1 AA compliance approach documented
- [ ] PCI DSS compliance through hosted payment pages
- [ ] UK-specific requirements addressed (timezone, bank holidays, GBP, 14-day cooling-off)

### Performance:
- [ ] <2 second page load strategy documented
- [ ] Database query optimization approach specified
- [ ] Lighthouse ≥90 achievability confirmed

### Security:
- [ ] Authentication for 3 user types (WP admin, Business Owner, Staff)
- [ ] Session security with timeout warnings
- [ ] Input validation strategy (prepared statements, escaping, nonces)
- [ ] API key encryption (AES-256-GCM)

### Deployment:
- [ ] Hosting requirements specified
- [ ] Plugin installation process documented
- [ ] Environment configuration approach specified
- [ ] Backup and recovery strategy defined

---

## ESTIMATED COMPLETION TIME

**Remaining Work:** Sections 9-19 (11 sections, ~20 pages)  
**Estimated Time:** 4-6 hours of focused technical writing  
**With Claude:** 1-2 hours (if continuing with AI assistance)

---

## NEXT STEPS AFTER COMPLETION

1. **Technical Review:** Architecture review meeting with stakeholders
2. **Security Audit:** External security review of authentication and payment flows
3. **Performance Validation:** Review optimization strategies with performance targets
4. **Compliance Check:** Verify GDPR and UK compliance architecture
5. **Sprint 0 Planning:** Use this document to plan Sprint 0 (database setup, plugin boilerplate)

---

**Document Status:** Part 1 Complete (55%), Part 2 Required (45%)  
**Next Action:** Complete sections 9-19 following the quality standards demonstrated in Part 1  
**Timeline:** Should be completed before Sprint 0 begins (Week 3 of project)