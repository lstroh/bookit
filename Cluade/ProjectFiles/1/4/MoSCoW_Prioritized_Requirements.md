# MoSCoW PRIORITIZED REQUIREMENTS
## WordPress Booking Plugin - Phase 1 MVP

**Document Version:** 1.0  
**Date:** January 22, 2026  
**Status:** FINAL - Ready for Development  
**Prepared For:** Liron (Project Lead)  
**Based On:** SRS v1.0, Gap Analysis Report, Competitive Feature Comparison Report

---

## EXECUTIVE SUMMARY

This document provides a comprehensive MoSCoW prioritization of all Phase 1 MVP requirements for the WordPress Booking Plugin, consolidating analysis from:

- **SRS_WordPress_Booking_Plugin_v1_0.md** - 130+ requirements (50+ FR, 40+ NFR)
- **Gap_Analysis_Report_WordPress_Booking_Plugin.md** - 25 identified gaps with resolutions
- **Competitive_Feature_Comparison_Report.md** - Market validation against 6 competitors
- **BusinessOwner-AdminRequirements.md** - 30 user stories across 6 epics
- **CustomerJourney files (01-06)** - Complete booking flow specifications
- **TechnicalRequirements.md** - Performance, security, accessibility requirements
- **IntegrationRequirements_Phase1.md** - External API specifications

### Priority Summary

| Priority | Count | Estimated Effort | Timeline Impact |
|----------|-------|------------------|-----------------|
| **MUST HAVE** | 78 requirements | 420-480 hours | Core 14 weeks |
| **SHOULD HAVE** | 31 requirements | 140-180 hours | +4-5 weeks |
| **COULD HAVE** | 18 requirements | 80-100 hours | Only if time permits |
| **WON'T HAVE** | 34 features | N/A (Phase 2+) | Explicitly excluded |

**TOTAL PHASE 1 (MUST + SHOULD):** 560-660 hours (~16-19 weeks development)

---

# MUST HAVE REQUIREMENTS

*These requirements are absolutely critical for Phase 1 launch. Without them, the MVP cannot function as a viable booking system. Non-negotiable.*

---

## Customer Booking Flow (MUST)

### Step 1: Service Selection

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-001** | Display all active services organized by categories | FR-1.1.1 | 8h | Database schema, Service table |
| **MUST-002** | Show service name, duration, base price, description | FR-1.1.2 | 4h | Service table |
| **MUST-003** | Responsive layout (1 column mobile, 3 columns desktop) | FR-1.1.3 | 6h | CSS framework |
| **MUST-004** | Display "From £X" when staff have different pricing | FR-1.1.4 | 3h | Staff-service pricing join |
| **MUST-005** | Persist service selection in PHP session storage | FR-1.1.5 | 2h | PHP session config |
| **MUST-006** | Validate service selection before progression | FR-1.1.6 | 2h | Form validation |

**Step 1 Subtotal:** 25 hours

### Step 2: Staff Selection

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-007** | Display all staff members offering selected service | FR-1.2.1 | 6h | Staff-service relationship |
| **MUST-008** | Show staff name, photo, title, bio, service-specific price | FR-1.2.2 | 8h | Staff table, media uploads |
| **MUST-009** | "No Preference" option showing lowest available price | FR-1.2.3 | 6h | Price comparison logic |
| **MUST-010** | Order staff alphabetically by first name | FR-1.2.4 | 1h | SQL ORDER BY |
| **MUST-011** | "Least Busy" assignment algorithm for "No Preference" | FR-1.2.5 | 12h | Booking count calculation |
| **MUST-012** | Display staff availability status | FR-1.2.6 | 8h | Real-time availability check |
| **MUST-013** | Handle edge case - no staff available for service | FR-1.2.7 | 3h | Error messaging |

**Step 2 Subtotal:** 44 hours

### Step 3: Date and Time Selection

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-014** | Monthly calendar with available dates highlighted | FR-1.3.1 | 16h | Calendar UI component |
| **MUST-015** | Block UK bank holidays (configurable) | FR-1.3.2 | 4h | Holiday data, settings |
| **MUST-016** | Enforce global same-day lead time (configurable) | FR-1.3.3 | 3h | Time calculation |
| **MUST-017** | Display time slots in 15-minute increments | FR-1.3.4 | 6h | Slot generation algorithm |
| **MUST-018** | Group slots by Morning/Afternoon/Evening | FR-1.3.5 | 4h | Time categorization |
| **MUST-019** | Calculate availability considering duration + buffer | FR-1.3.6 | 12h | Complex availability logic |
| **MUST-020** | Auto-refresh availability every 30 seconds | FR-1.3.7 | 4h | AJAX polling |
| **MUST-021** | Support 365-day booking window (configurable) | FR-1.3.8 | 2h | Date range validation |
| **MUST-022** | Prevent booking in past or outside window | FR-1.3.9 | 2h | Date validation |
| **MUST-023** | Clear messaging when no availability exists | FR-1.3.10 | 3h | Error states |

**Step 3 Subtotal:** 56 hours

### Step 4: Contact Details and Payment

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-024** | Collect: First Name, Last Name, Email, Phone | FR-1.4.1 | 4h | Form fields |
| **MUST-025** | Validate UK phone format (07xxx/01xxx) | FR-1.4.2 | 3h | Regex validation |
| **MUST-026** | Validate email format + common typo checking | FR-1.4.3 | 4h | Email validation library |
| **MUST-027** | Optional "Special Requests" field (500 char) | FR-1.4.4 | 2h | Textarea field |
| **MUST-028** | GDPR-compliant marketing consent checkbox | FR-1.4.5 | 2h | Consent storage |
| **MUST-029** | Three payment methods: Stripe, PayPal, Pay on Arrival | FR-1.4.6 | 32h | Payment integration |
| **MUST-030** | Display deposit amount vs. balance due | FR-1.4.7 | 3h | Payment calculation |
| **MUST-031** | Database UNIQUE constraint prevent double-booking | FR-1.4.8 | 4h | Database constraint |
| **MUST-032** | Atomic booking creation after payment | FR-1.4.9 | 8h | Transaction handling |
| **MUST-033** | Error message if slot taken during checkout | FR-1.4.10 | 4h | Race condition handling |

**Step 4 Subtotal:** 66 hours

---

## Post-Booking Management (MUST)

### Email Notifications

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-034** | Send confirmation email immediately after booking | FR-1.5.1 | 6h | Email service |
| **MUST-035** | Include iCal attachment in confirmation | FR-1.5.2 | 4h | iCal generation |
| **MUST-036** | Send reminder email 24h before (8 AM cron) | FR-1.5.3 | 6h | WP-Cron job |
| **MUST-037** | Send cancellation confirmation to customer + staff | FR-1.5.4 | 4h | Multi-recipient email |
| **MUST-038** | Send rescheduling confirmation with new details | FR-1.5.5 | 4h | Template variable swap |
| **MUST-039** | Notify staff of new bookings | FR-1.5.6 | 4h | Staff notification |
| **MUST-040** | Customizable email templates with variables | FR-1.5.7 | 12h | Template engine |
| **MUST-041** | Queue email delivery with retry (3 attempts) | FR-1.5.8 | 8h | Queue system |
| **MUST-042** | Magic links for cancel/reschedule (7-day validity) | FR-1.5.9 | 8h | Token generation |
| **MUST-043** | Never fail booking due to email failure | FR-1.5.10 | 2h | Error isolation |

**Email Subtotal:** 58 hours

### Cancellation

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-044** | Enforce configurable cancellation policy window | FR-1.6.1 | 4h | Policy settings |
| **MUST-045** | Auto-refund within policy window | FR-1.6.2 | 8h | Refund API calls |
| **MUST-046** | Late cancellation requires Business Owner approval | FR-1.6.3 | 6h | Approval workflow |
| **MUST-047** | Process Stripe refunds automatically | FR-1.6.4 | 8h | Stripe refund API |
| **MUST-048** | Process PayPal refunds automatically | FR-1.6.5 | 8h | PayPal refund API |
| **MUST-049** | Handle manual refunds for Pay-on-Arrival | FR-1.6.6 | 3h | Manual tracking |
| **MUST-050** | Update booking status to "Cancelled" | FR-1.6.7 | 2h | Status update |
| **MUST-051** | Delete from Google Calendar (if synced) | FR-1.6.8 | 4h | Calendar API |
| **MUST-052** | Retain cancelled record for reporting | FR-1.6.9 | 1h | Soft delete |

**Cancellation Subtotal:** 44 hours

### Rescheduling

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-053** | Allow reschedule to any available date/time | FR-1.7.1 | 8h | Availability reuse |
| **MUST-054** | Transfer deposit to new booking | FR-1.7.2 | 6h | Payment linking |
| **MUST-055** | Retain original booking with "Rescheduled" status | FR-1.7.3 | 3h | Status tracking |
| **MUST-056** | Create linked new booking record | FR-1.7.4 | 4h | Booking linking |
| **MUST-057** | Update Google Calendar event | FR-1.7.5 | 4h | Calendar update API |
| **MUST-058** | Validate availability before confirming | FR-1.7.8 | 3h | Availability check |

**Rescheduling Subtotal:** 28 hours

---

## Business Owner Dashboard (MUST)

### Epic 1: Initial Setup and Onboarding

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-059** | 4-step setup wizard for first-time config | FR-1.8.1 | 16h | Wizard UI |
| **MUST-060** | Guide through service creation with validation | FR-1.8.2 | 8h | Service form |
| **MUST-061** | Configure staff availability and working hours | FR-1.8.3 | 12h | Schedule UI |
| **MUST-062** | Set up payment gateway connections | FR-1.8.4 | 8h | API key management |

**Setup Subtotal:** 44 hours

### Epic 2: Day-to-Day Booking Management

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-063** | Display bookings in calendar and list views | FR-1.9.1 | 20h | Dual view UI |
| **MUST-064** | Filter by: date range, staff, service, status | FR-1.9.2 | 8h | Filter logic |
| **MUST-065** | Manual booking creation for walk-ins | FR-1.9.3 | 12h | Admin booking form |
| **MUST-066** | Edit booking details | FR-1.9.4 | 8h | Edit functionality |
| **MUST-067** | Cancellation with configurable refund rules | FR-1.9.5 | 6h | Admin cancel flow |
| **MUST-068** | Real-time booking status updates | FR-1.9.6 | 6h | AJAX status |
| **MUST-069** | Quick actions (complete, no-show, reschedule) | FR-1.9.7 | 6h | Action buttons |

**Booking Management Subtotal:** 66 hours

### Epic 3: Staff and Service Management

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-070** | Add, edit, deactivate staff members | FR-1.10.1 | 12h | Staff CRUD |
| **MUST-071** | Configure staff working hours with split shifts | FR-1.10.2 | 10h | Schedule editor |
| **MUST-072** | Staff-specific pricing per service | FR-1.10.3 | 6h | Price matrix |
| **MUST-073** | Manage service catalog (add, edit, archive) | FR-1.10.4 | 10h | Service CRUD |
| **MUST-074** | Organize services into categories | FR-1.10.5 | 6h | Category management |
| **MUST-075** | Configure service duration and buffer | FR-1.10.6 | 4h | Duration settings |

**Staff/Service Subtotal:** 48 hours

### Epic 4: Pricing and Payment Configuration

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-076** | Configure Stripe API keys (test/live) | FR-1.11.1 | 4h | Key validation |
| **MUST-077** | Configure PayPal client ID/secret | FR-1.11.2 | 4h | Key validation |
| **MUST-078** | Set deposit per service (% or fixed) | FR-1.11.3 | 4h | Deposit settings |
| **MUST-079** | Configure cancellation policies | FR-1.11.4 | 6h | Policy UI |
| **MUST-080** | Enable/disable Pay-on-Arrival | FR-1.11.5 | 2h | Toggle setting |

**Payment Config Subtotal:** 20 hours

---

## Technical/Non-Functional (MUST)

### Performance (MUST)

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-081** | Page load ≤2.0s on 3G | NFR-1.1 | 8h | Optimization |
| **MUST-082** | FCP ≤1.2 seconds | NFR-1.2 | 4h | Critical CSS |
| **MUST-083** | TTI ≤2.0 seconds | NFR-1.3 | 4h | JS optimization |
| **MUST-084** | Availability API ≤500ms | NFR-1.12 | 4h | Query optimization |
| **MUST-085** | Booking creation ≤2.0s | NFR-1.13 | 4h | Transaction efficiency |

**Performance Subtotal:** 24 hours

### Security (MUST - Non-Negotiable)

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-086** | WordPress auth with secure password hash | NFR-2.1 | 2h | WP integration |
| **MUST-087** | HttpOnly + Secure session cookies | NFR-2.2 | 2h | Cookie config |
| **MUST-088** | 24-hour session timeout with warning | NFR-2.3 | 4h | Session management |
| **MUST-089** | Rate-limit failed login attempts | NFR-2.5 | 4h | Rate limiting |
| **MUST-090** | TLS 1.2+ for all API comms | NFR-2.7 | 2h | HTTPS enforcement |
| **MUST-091** | AES-256-GCM for API keys/tokens | NFR-2.8 | 6h | Encryption |
| **MUST-092** | No card data ever stored (PCI SAQ A) | NFR-2.11 | 2h | Architecture |
| **MUST-093** | Payments via Stripe/PayPal hosted pages | NFR-2.12 | 4h | Redirect flow |
| **MUST-094** | Webhook signature verification | NFR-2.15 | 6h | Signature validation |
| **MUST-095** | Prepared statements for all SQL | NFR-2.17 | 8h | Query refactoring |
| **MUST-096** | XSS protection (esc_html, esc_attr) | NFR-2.18 | 4h | Output escaping |
| **MUST-097** | CSRF protection (nonce verification) | NFR-2.19 | 4h | Nonce system |

**Security Subtotal:** 48 hours

### GDPR Compliance (MUST - UK Legal)

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-098** | Data minimization (collect only needed) | NFR-7.1 | 2h | Form audit |
| **MUST-099** | Explicit consent checkboxes | NFR-7.2 | 4h | Consent tracking |
| **MUST-100** | Right to erasure (data deletion) | FR-1.13.5 | 8h | Deletion workflow |
| **MUST-101** | Data portability (export own data) | FR-1.13.6 | 6h | Export function |
| **MUST-102** | Privacy policy link at checkout | NFR-7.3 | 1h | Policy link |

**GDPR Subtotal:** 21 hours

### Core Accessibility (MUST)

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-103** | All images have alt text | NFR-4.1 | 4h | Image audit |
| **MUST-104** | Color contrast ≥4.5:1 normal text | NFR-4.2 | 6h | Color review |
| **MUST-105** | Form labels associated with inputs | NFR-4.5 | 4h | Label audit |
| **MUST-106** | All functionality via keyboard | NFR-4.6 | 12h | Keyboard nav |
| **MUST-107** | Visible focus indicators | NFR-4.7 | 4h | Focus styles |
| **MUST-108** | No keyboard traps | NFR-4.8 | 4h | Trap testing |
| **MUST-109** | Language declared in HTML | NFR-4.11 | 1h | lang attribute |
| **MUST-110** | Touch targets minimum 44×44px | NFR-4.21 | 6h | Touch audit |

**Accessibility Subtotal:** 41 hours

---

## Integrations (MUST)

### Stripe Integration

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-111** | Stripe Checkout Session creation | INT-1.1 | 12h | Stripe SDK |
| **MUST-112** | Webhook handling (payment success/fail) | INT-1.2 | 12h | Endpoint |
| **MUST-113** | Refund processing via API | INT-1.3 | 8h | Refund endpoint |
| **MUST-114** | Idempotency keys for retries | INT-1.4 | 4h | Key generation |

**Stripe Subtotal:** 36 hours

### Email Service Integration

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-115** | Transactional email service (SendGrid/Mailgun/SES) | INT-3.1 | 16h | API integration |
| **MUST-116** | Email queue with retry mechanism | INT-3.2 | 8h | Queue system |
| **MUST-117** | Template variable substitution | INT-3.3 | 6h | Template engine |

**Email Subtotal:** 30 hours

### Google Calendar Integration

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-118** | OAuth 2.0 authentication flow | INT-2.1 | 12h | OAuth library |
| **MUST-119** | Create calendar event on booking | INT-2.2 | 8h | Calendar API |
| **MUST-120** | Update event on reschedule | INT-2.3 | 6h | Event update |
| **MUST-121** | Delete event on cancellation | INT-2.4 | 4h | Event delete |
| **MUST-122** | One-way sync only (plugin → Google) | INT-2.5 | 2h | Architecture |

**Google Calendar Subtotal:** 32 hours

---

## Database & Infrastructure (MUST)

| ID | Requirement | Reference | Effort | Dependencies |
|----|-------------|-----------|--------|--------------|
| **MUST-123** | Database schema (10 tables) | ScopeDefinition §6 | 16h | DB design |
| **MUST-124** | Service categories junction table | Gap #14 | 4h | Schema update |
| **MUST-125** | Database UNIQUE constraints | Gap #1 | 4h | Constraint setup |
| **MUST-126** | WordPress plugin boilerplate | Tech stack | 8h | Plugin structure |
| **MUST-127** | Custom dashboard (separate from WP admin) | Core differentiator | 24h | Frontend framework |
| **MUST-128** | WP-Cron scheduled tasks | Email reminders | 8h | Cron setup |

**Infrastructure Subtotal:** 64 hours

---

## MUST HAVE SUMMARY

| Category | Requirements | Hours |
|----------|-------------|-------|
| Customer Booking Flow | 33 | 191h |
| Post-Booking Management | 19 | 130h |
| Business Owner Dashboard | 22 | 178h |
| Technical/Non-Functional | 30 | 134h |
| Integrations | 12 | 98h |
| Database & Infrastructure | 6 | 64h |
| **TOTAL MUST HAVE** | **78** | **420-480h** |

**Timeline:** 420-480 hours = **12-14 weeks** at 35h/week

---

# SHOULD HAVE REQUIREMENTS

*Important but not critical for Phase 1. Significant value but MVP can technically launch without them. Include if time/budget allows.*

---

## Customer Experience (SHOULD)

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **SHOULD-001** | Service change during reschedule (price diff calc) | FR-1.7.6 | 8h | HIGH - Common request |
| **SHOULD-002** | Staff change during reschedule | FR-1.7.7 | 6h | HIGH - Flexibility |
| **SHOULD-003** | Service images | CustomerJourney-01 | 6h | MEDIUM - Visual appeal |
| **SHOULD-004** | "Fully Booked" services visible with message | CustomerJourney-01 | 4h | MEDIUM - Transparency |
| **SHOULD-005** | Email typo suggestions (gmail→gmial) | FR-1.4.3 | 4h | LOW - Edge case |

**Customer SHOULD Subtotal:** 28 hours

## Business Owner Dashboard (SHOULD)

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **SHOULD-006** | Today's schedule view (dashboard homepage) | FR-1.12.1 | 12h | HIGH - Daily use |
| **SHOULD-007** | Weekly/monthly revenue totals with trends | FR-1.12.2 | 12h | HIGH - Business insight |
| **SHOULD-008** | Revenue reports by date range | FR-1.12.3 | 16h | HIGH - Analytics |
| **SHOULD-009** | Revenue breakdown by service/staff/payment | FR-1.12.4 | 12h | MEDIUM - Segmentation |
| **SHOULD-010** | Booking search/filter | BusinessOwner 2.1 | 8h | HIGH - Usability |
| **SHOULD-011** | Customer database list view | FR-1.13.1 | 12h | HIGH - CRM-lite |
| **SHOULD-012** | Customer profile with total spent | FR-1.13.2 | 8h | MEDIUM - LTV tracking |
| **SHOULD-013** | Private notes on customer records | FR-1.13.3 | 4h | MEDIUM - Context |
| **SHOULD-014** | Customer CSV export | FR-1.13.4 | 6h | MEDIUM - Marketing |
| **SHOULD-015** | Report export to CSV | FR-1.12.7 | 6h | MEDIUM - Accountant |

**Dashboard SHOULD Subtotal:** 96 hours

## Staff Dashboard (SHOULD)

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **SHOULD-016** | Staff personal schedule view | FR-1.14.1 | 16h | HIGH - Staff UX |
| **SHOULD-017** | Upcoming appointments with customer details | FR-1.14.2 | 6h | HIGH - Preparation |
| **SHOULD-018** | Mark appointments as completed | FR-1.16.1 | 4h | HIGH - Workflow |
| **SHOULD-019** | Mark appointments as no-show | FR-1.16.2 | 4h | HIGH - Tracking |
| **SHOULD-020** | Staff time-off blocking | FR-1.15.1 | 12h | HIGH - Availability |
| **SHOULD-021** | Recurring time blocks (e.g., daily lunch) | FR-1.15.2 | 8h | MEDIUM - Convenience |

**Staff SHOULD Subtotal:** 50 hours

## Technical Enhancements (SHOULD)

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **SHOULD-022** | Lighthouse score ≥90 | NFR-1.7 | 8h | HIGH - SEO/UX |
| **SHOULD-023** | wp_mail() fallback if email service down | INT-3.4 | 4h | MEDIUM - Resilience |
| **SHOULD-024** | Email delivery logging | Gap #23 | 6h | MEDIUM - Debugging |
| **SHOULD-025** | Screen reader navigable booking flow | NFR-4.18 | 12h | HIGH - WCAG |
| **SHOULD-026** | aria-live for loading states | NFR-4.19 | 4h | MEDIUM - WCAG |
| **SHOULD-027** | Form errors announced (role="alert") | NFR-4.20 | 4h | MEDIUM - WCAG |
| **SHOULD-028** | Virtual scrolling for 100+ booking lists | NFR-1.11 | 8h | MEDIUM - Performance |
| **SHOULD-029** | Database query caching (60s TTL) | TechReq 1.4 | 6h | MEDIUM - Performance |

**Technical SHOULD Subtotal:** 52 hours

## Integrations (SHOULD)

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **SHOULD-030** | PayPal integration | FR-1.4.6 | 20h | HIGH - 30-40% UK preference |
| **SHOULD-031** | iCal export for staff | CustomerJourney-04 | 6h | LOW - Convenience |

**Integration SHOULD Subtotal:** 26 hours

---

## SHOULD HAVE SUMMARY

| Category | Requirements | Hours |
|----------|-------------|-------|
| Customer Experience | 5 | 28h |
| Business Owner Dashboard | 10 | 96h |
| Staff Dashboard | 6 | 50h |
| Technical Enhancements | 8 | 52h |
| Integrations | 2 | 26h |
| **TOTAL SHOULD HAVE** | **31** | **140-180h** |

**Timeline:** 140-180 hours = **4-5 weeks** at 35h/week

### SHOULD HAVE Prioritization (If Time Limited)

**Priority 1 (Definitely Include):**
- SHOULD-006: Today's schedule view
- SHOULD-016: Staff personal schedule
- SHOULD-030: PayPal integration (HIGH market demand)
- SHOULD-010: Booking search/filter

**Priority 2 (Strong Candidates):**
- SHOULD-007, 008, 009: Revenue reports
- SHOULD-011, 012: Customer database
- SHOULD-018, 019, 020: Staff actions

**Priority 3 (If Time Permits):**
- SHOULD-025, 026, 027: Advanced accessibility
- SHOULD-028, 029: Performance optimization

---

# COULD HAVE REQUIREMENTS

*Nice to have features that add value but are not essential. Can be deferred to Phase 2 without major impact. Implement only if time permits after SHOULD HAVEs.*

---

| ID | Requirement | Reference | Effort | Impact |
|----|-------------|-----------|--------|--------|
| **COULD-001** | PDF report export | FR-1.12.7 | 12h | LOW - Accountant |
| **COULD-002** | Scheduled report emails | BusinessOwner 5.5 | 12h | LOW - Automation |
| **COULD-003** | Booking analytics (conversion, no-show rate) | FR-1.12.5 | 16h | MEDIUM - Insights |
| **COULD-004** | Staff utilization metrics | FR-1.12.6, FR-1.18.3 | 12h | LOW - Analytics |
| **COULD-005** | Team calendar (all staff view) | FR-1.17.1-4 | 16h | LOW - Visibility |
| **COULD-006** | Staff earnings display (configurable) | FR-1.18.1-2 | 6h | LOW - Motivation |
| **COULD-007** | Email bounce handling | Gap #22 | 8h | LOW - Deliverability |
| **COULD-008** | Service variations/options | CustomerJourney-01 | 16h | MEDIUM - Flexibility |
| **COULD-009** | Custom booking reference format (BK2601-XXXX) | Gap #21 | 4h | LOW - Branding |
| **COULD-010** | Contextual help tooltips | NFR-6.4 | 8h | LOW - UX |
| **COULD-011** | Email template preview | BusinessOwner 6.7 | 6h | LOW - UX |
| **COULD-012** | Optimistic locking on booking edit | Gap #24 | 6h | LOW - Concurrency |
| **COULD-013** | DST transition handling | Gap #19 | 8h | LOW - Edge case |
| **COULD-014** | Centralized error message system | Gap #20 | 8h | MEDIUM - Consistency |
| **COULD-015** | Service degradation dashboard | Gap #4 | 16h | MEDIUM - Resilience |
| **COULD-016** | Database migration framework | Gap #5 | 12h | MEDIUM - Upgrades |
| **COULD-017** | Audit logging (all actions) | Gap #23 | 12h | MEDIUM - Compliance |
| **COULD-018** | Daily race condition report | IntReq 3.11 | 4h | LOW - Monitoring |

---

## COULD HAVE SUMMARY

| Category | Requirements | Hours |
|----------|-------------|-------|
| Reporting & Analytics | 4 | 52h |
| Staff Features | 2 | 22h |
| Technical/Infrastructure | 8 | 72h |
| UX Enhancements | 4 | 26h |
| **TOTAL COULD HAVE** | **18** | **80-100h** |

**Recommendation:** Defer all COULD HAVEs to post-launch improvements unless development finishes early.

---

# WON'T HAVE (Phase 1 Exclusions)

*Explicitly out of scope for Phase 1. Confirmed for Phase 2 or later. This list helps manage expectations and prevent scope creep.*

---

## Booking Types (Phase 2)

| Feature | Rationale | Competitive Impact |
|---------|-----------|-------------------|
| Package bookings (multi-session bundles) | Complex (inventory, redemption) | 4/6 competitors have |
| Recurring appointments (weekly series) | 40-60h development | 5/6 competitors have |
| Group bookings/classes | Capacity management complexity | 4/6 competitors have |
| Approval workflows | Adds booking friction | Some competitors have |
| Multi-day bookings (48+ hours) | Edge case for target market | Rare requirement |

## Customer Features (Phase 2)

| Feature | Rationale | Competitive Impact |
|---------|-----------|-------------------|
| Customer portal (full self-service) | MVP has magic links | Most competitors have |
| Custom intake forms per service | 20-30h development | Some competitors have |
| Saved payment methods | PCI complexity | Some competitors have |
| Email address change (self-service) | Resolved via Business Owner | Security consideration |
| Favorite staff auto-selection | Nice-to-have | Few competitors have |

## Integrations (Phase 2)

| Feature | Rationale | Competitive Impact |
|---------|-----------|-------------------|
| **SMS notifications** | **CRITICAL GAP** - 6/6 competitors | **Add to Phase 1 backlog** |
| 2-way Google Calendar sync | Complex conflict resolution | 5/6 competitors have |
| Outlook/iCal integration | Lower UK demand | Some competitors have |
| Zoom/Google Meet auto-links | Video conferencing integration | Some competitors have |
| Accounting software (Xero, QuickBooks) | Niche requirement | Few competitors have |
| WhatsApp booking | Regional preference | Few competitors have |

## Technical (Phase 2+)

| Feature | Rationale | Competitive Impact |
|---------|-----------|-------------------|
| Multi-location support | Significant architecture change | Some competitors have |
| Multi-currency (beyond GBP) | UK-first strategy | SaaS competitors have |
| Multi-timezone support | UK-first strategy | SaaS competitors have |
| Multi-language support | UK-first strategy | Some competitors have |
| WordPress Multisite | Limited market demand | Rare requirement |
| REST API endpoints | Schema designed for Phase 2 | Mobile app enabler |
| Mobile apps (iOS/Android) | Web-responsive covers 90% | SaaS competitors have |

## Advanced Features (Phase 3+)

| Feature | Rationale | Competitive Impact |
|---------|-----------|-------------------|
| Customer loyalty programs | CRM territory | Few competitors have |
| Gift cards/vouchers | Payment complexity | Few competitors have |
| Staff tips/gratuity | Regional preference | Few competitors have |
| POS integration | Outside booking scope | Few competitors have |
| Marketing automation | CRM territory | Outside scope |
| Shift scheduling/payroll | HR system territory | Outside scope |

---

## WON'T HAVE SUMMARY

| Category | Features | Phase |
|----------|----------|-------|
| Booking Types | 5 | Phase 2 |
| Customer Features | 5 | Phase 2 |
| Integrations | 6 | Phase 2 |
| Technical | 7 | Phase 2-3 |
| Advanced Features | 6 | Phase 3+ |
| **TOTAL EXCLUSIONS** | **34** | N/A |

---

# CRITICAL DECISION POINTS

Based on analysis of all project documentation, here are the key decisions:

---

## Decision 1: PayPal - MUST HAVE or SHOULD HAVE?

**RECOMMENDATION: MUST HAVE** ✅

| Factor | Analysis |
|--------|----------|
| Market Data | 30-40% UK consumers prefer PayPal for online payments |
| Competitive Position | 6/6 competitors offer PayPal |
| Implementation Effort | ~20 hours (Stripe already doing heavy lifting) |
| Risk if Excluded | 30-40% potential booking abandonment |
| Customer Expectation | Table-stakes for UK e-commerce |

**Decision:** Move PayPal from SHOULD to MUST. Implementation is straightforward once Stripe is done.

---

## Decision 2: Custom Email Templates - MUST or SHOULD?

**RECOMMENDATION: MUST HAVE** ✅

| Factor | Analysis |
|--------|----------|
| Competitive Position | 6/6 competitors have customizable templates |
| Brand Experience | Generic templates look unprofessional |
| Implementation Effort | ~12 hours (template engine with variables) |
| Client Expectation | Part of "white-label" value proposition |

**Decision:** Keep as MUST. This is core to your differentiation (white-label, professional experience).

---

## Decision 3: WCAG 2.1 AA Compliance - MUST or SHOULD?

**RECOMMENDATION: MUST HAVE** ✅ (Core), SHOULD HAVE (Advanced)

| Factor | Analysis |
|--------|----------|
| Legal Requirement | Required for UK public sector clients |
| Target Market | NHS, universities, government contractors |
| Competitive Position | UNIQUE differentiator - no competitor offers full WCAG |
| Implementation Effort | Core: ~41 hours, Advanced: ~20 hours |
| Business Impact | Opens public sector market segment |

**Decision:** Core accessibility requirements (MUST-103 to MUST-110) stay as MUST. Advanced screen reader testing moves to SHOULD.

---

## Decision 4: Which Admin Reports are MUST vs SHOULD vs COULD?

**RECOMMENDATION:**

| Report | Priority | Rationale |
|--------|----------|-----------|
| Today's Schedule | **SHOULD** | High daily use but not blocking launch |
| Revenue Reports | **SHOULD** | Business insight but MVP can launch without |
| Staff Utilization | **COULD** | Nice-to-have analytics |
| Customer Analytics | **COULD** | Future enhancement |
| Booking Analytics | **COULD** | Future enhancement |

**Decision:** Reports are SHOULD/COULD. MVP can launch with basic booking list view; reports enhance but don't enable.

---

## Decision 5: SMS Notifications - Phase 1 or Phase 2?

**RECOMMENDATION: Phase 2** (with caveat)

| Factor | Analysis |
|--------|----------|
| Competitive Gap | CRITICAL - 6/6 competitors offer SMS |
| Implementation Effort | 20-30 hours (Twilio integration) |
| No-Show Impact | SMS reduces no-shows by 30-50% |
| Phase 1 Timeline | Already tight at 16-19 weeks |

**Decision:** Keep in Phase 2, BUT:
1. Prepare sales response: "SMS coming in v1.1 (2 months post-launch)"
2. Architecture email system to support SMS later (notification abstraction)
3. Add SMS as Phase 2 Priority 1

---

## Decision 6: How Many SHOULDs Fit in Phase 1?

**RECOMMENDATION: 60-70% of SHOULD HAVEs**

| Scenario | SHOULD HAVEs Included | Total Timeline |
|----------|----------------------|----------------|
| Conservative | Priority 1 only (4 items) | 14-15 weeks |
| Balanced | Priority 1 + 2 (14 items) | 17-18 weeks |
| Aggressive | All SHOULDs (31 items) | 19-22 weeks |

**Decision:** Target **Balanced** approach:
- Include all Priority 1 SHOULDs
- Include most Priority 2 SHOULDs
- Defer Priority 3 SHOULDs to post-launch

**Realistic SHOULD inclusion:** 20-22 requirements (~120-140 hours)

---

# EFFORT SUMMARY

## Total Estimated Development Effort

| Category | Requirements | Hours (Low) | Hours (High) |
|----------|-------------|-------------|--------------|
| **MUST HAVE** | 78 | 420 | 480 |
| **SHOULD HAVE (Included)** | 22 | 120 | 140 |
| **Testing & QA** | N/A | 80 | 100 |
| **Documentation** | N/A | 20 | 30 |
| **Buffer (20%)** | N/A | 128 | 150 |
| **TOTAL** | **100** | **768** | **900** |

## Timeline Projection

| Approach | Weeks (at 35h/week) | Recommended |
|----------|---------------------|-------------|
| Aggressive (no buffer) | 18 weeks | No |
| Balanced (15% buffer) | 21 weeks | **Yes** |
| Conservative (25% buffer) | 24 weeks | Safe |

**RECOMMENDED COMMITMENT: 20-22 weeks (5-5.5 months)**

---

# DOCUMENT APPROVAL

| Role | Name | Status | Date |
|------|------|--------|------|
| Project Lead | Liron | Pending Review | |
| Technical Lead | TBD | Pending | |

---

**Document Version:** 1.0  
**Last Updated:** January 22, 2026  
**Next Review:** Before Sprint 1 Planning

---

*End of MoSCoW Prioritized Requirements*
