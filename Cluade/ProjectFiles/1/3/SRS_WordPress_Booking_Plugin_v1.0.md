# SOFTWARE REQUIREMENTS SPECIFICATION
## WordPress Booking Plugin - Phase 1 MVP

**Document Version:** 1.0  
**Date:** January 21, 2026  
**Status:** FINAL  
**Target Market:** UK service businesses (salons, photographers, solo consultants)  
**Development Timeline:** 4-5 months  
**Estimated Lines of Code:** 15,000-20,000

---

## DOCUMENT CONTROL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Lead | Liron | | 21/01/2026 |
| Technical Lead | TBD | | |
| QA Lead | TBD | | |

---

## TABLE OF CONTENTS

1. [INTRODUCTION](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
   - 1.4 [References](#14-references)
   - 1.5 [Overview](#15-overview)

2. [OVERALL DESCRIPTION](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [Assumptions and Dependencies](#26-assumptions-and-dependencies)

3. [SPECIFIC REQUIREMENTS](#3-specific-requirements)
   - 3.1 [Functional Requirements](#31-functional-requirements)
   - 3.2 [Non-Functional Requirements](#32-non-functional-requirements)
   - 3.3 [External Interface Requirements](#33-external-interface-requirements)

4. [APPENDICES](#4-appendices)
   - Appendix A: [User Story Summary](#appendix-a-user-story-summary)
   - Appendix B: [Database Schema](#appendix-b-database-schema)
   - Appendix C: [Integration Summary](#appendix-c-integration-summary)
   - Appendix D: [Glossary](#appendix-d-glossary)

---

# 1. INTRODUCTION

## 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the WordPress Booking Plugin Phase 1 MVP system. It specifies all functional and non-functional requirements necessary for development, testing, and deployment.

**Intended Audience:**

- Software developers and architects implementing the system
- Quality assurance and testing teams
- Project stakeholders and business owners
- Technical writers and documentation specialists

## 1.2 Scope

**Product Name:** WordPress Booking Plugin

### What the System Will Do:

- Enable 24/7 online booking for service-based businesses
- Process payments via Stripe and PayPal
- Synchronize bookings with Google Calendar
- Send automated email notifications (confirmations, reminders)
- Provide separate dashboards for Business Owners, Staff, and Customers
- Support guest checkout and registered customer accounts
- Handle cancellations and rescheduling with configurable policies

### What the System Will NOT Do (Phase 1 Limitations):

- Package bookings (multi-session bundles)
- Recurring appointments (weekly/monthly series)
- Group bookings or class scheduling
- Approval workflows for bookings
- Multi-location support
- SMS notifications
- Two-way Google Calendar synchronization

### Benefits and Goals:

- Eliminate manual scheduling and reduce administrative overhead
- Increase booking conversion through 24/7 availability
- Reduce no-shows through automated reminders
- Provide professional co-branded booking experience
- Enable data-driven business decisions through reporting

## 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **Business Owner** | Person who owns the business; has full access to all bookings, settings, reporting, and customer data |
| **Staff Member** | Service provider who delivers appointments; can view their own schedule, manage availability, and see assigned bookings |
| **Customer (Guest)** | End user who books appointments without creating an account; uses guest checkout |
| **Customer (Registered)** | End user with an account; can view booking history and manage future appointments |
| **WordPress Admin** | Developer who installs and configures the plugin; handles technical setup and white-label branding |
| **MVP** | Minimum Viable Product - the Phase 1 version with core features only |
| **OAuth** | Open Authorization - standard protocol for secure API authorization (used for Google Calendar) |
| **Webhook** | HTTP callback that delivers real-time event notifications (used by Stripe and PayPal) |
| **WCAG** | Web Content Accessibility Guidelines - international accessibility standard |
| **GDPR** | General Data Protection Regulation - EU/UK data privacy law |
| **PCI DSS** | Payment Card Industry Data Security Standard - security requirements for handling card payments |
| **SRS** | Software Requirements Specification |
| **API** | Application Programming Interface |
| **SSL/TLS** | Secure Sockets Layer / Transport Layer Security - encryption protocols for HTTPS |
| **SMTP** | Simple Mail Transfer Protocol - email sending standard |

## 1.4 References

### Internal Project Documents:

1. **ScopeDefinition.md** - Core features and Phase 1 scope definition
2. **CustomerJourney-01-Discovery.md** - Service discovery and selection flow
3. **CustomerJourney-02-StaffSelection.md** - Staff selection process
4. **CustomerJourney-03-DateTimeSelectionPayment.md** - Booking and payment processing
5. **CustomerJourney-04-Notifications.md** - Email notification system specifications
6. **CustomerJourney-05-Cancellation.md** - Cancellation policies and workflows
7. **CustomerJourney-06-Rescheduling.md** - Rescheduling process and rules
8. **BusinessOwner-AdminRequirements.md** - Dashboard and administrative features (30 user stories)
9. **TechnicalRequirements.md** - Performance, security, and accessibility requirements
10. **IntegrationRequirements_Phase1.md** - External API integration specifications

### External Standards:

- **WCAG 2.1 Level AA** - Web Content Accessibility Guidelines
- **UK GDPR** - General Data Protection Regulation (UK Implementation)
- **PCI DSS v4.0** - Payment Card Industry Data Security Standard
- **ISO 8601** - Date and time format standard
- **WordPress Coding Standards** - https://developer.wordpress.org/coding-standards/

## 1.5 Overview

The remainder of this document provides:

- **Section 2:** Overall product description including system context, user characteristics, and operating environment
- **Section 3:** Detailed functional and non-functional requirements organized by feature area
- **Section 4:** Appendices with supporting information including database schema, integration summary, and glossary

---

# 2. OVERALL DESCRIPTION

## 2.1 Product Perspective

The WordPress Booking Plugin is a self-contained booking system that integrates with the WordPress ecosystem while providing a custom frontend dashboard experience separate from WordPress admin. The system interacts with external services for payment processing, calendar synchronization, and email delivery.

### System Architecture:

- **WordPress Plugin Core:** Main system logic, database models, and backend API
- **Public Booking Page:** Customer-facing interface embedded in WordPress site
- **Custom Dashboard:** Separate frontend for Business Owners and Staff (not WordPress admin)
- **WordPress Admin Settings:** Configuration interface for WordPress Admin role
- **MySQL Database:** 10 custom tables for bookings, customers, staff, services, and payments

### External Integrations:

- **Stripe:** Primary payment gateway (Checkout, webhooks, refunds)
- **PayPal:** Alternative payment gateway (Orders API, capture, webhooks)
- **Google Calendar:** One-way calendar synchronization via OAuth 2.0
- **Email Service:** Transactional email delivery (SendGrid, Mailgun, AWS SES, or SMTP)

### System Context Diagram:

```
Customer → Public Booking Page → WordPress Plugin → Database
                                           ↓
                                   Payment Gateway
                                           ↓
                                  Confirmation Email
                                           ↓
                              Google Calendar Sync (Staff)
```

## 2.2 Product Functions

The system provides six major functional areas:

### 1. Online Booking Management

- 4-step customer booking flow: Service → Staff → Date/Time → Payment
- Real-time availability checking with optimistic locking
- Guest checkout and registered customer accounts
- Staff-specific pricing and availability
- "No Preference" staff selection with load-balancing

### 2. Payment Processing

- Stripe Checkout integration (deposit or full payment)
- PayPal Orders API integration
- Pay-on-arrival option (cash/card at location)
- Configurable deposit amounts and refund policies
- Automatic and manual refund processing

### 3. Calendar Synchronization

- One-way sync to Google Calendar (plugin → calendar)
- Per-staff OAuth 2.0 authentication
- Automatic event creation with customer details
- iCal file generation for manual calendar import

### 4. Email Notifications

- Booking confirmation emails (immediate)
- 24-hour reminder emails (automated cron job)
- Cancellation and rescheduling confirmations
- Staff notifications for new/modified bookings
- Customizable email templates with variable system

### 5. Business Owner Dashboard

- View all bookings across all staff
- Create, edit, cancel, and reschedule bookings
- Manage staff members and availability
- Configure services, pricing, and policies
- Access revenue reports and booking analytics
- Manage customer database with GDPR compliance

### 6. Staff Dashboard

- View personal schedule and upcoming appointments
- Block time off (holidays, breaks, lunch)
- Mark appointments as completed or no-show
- View team calendar (all staff)
- Track personal performance metrics (optional)

## 2.3 User Classes and Characteristics

### Customer (Guest)

- **Characteristics:** End consumers seeking services; varying technical ability; mobile-first users
- **Frequency:** Occasional users (monthly to quarterly visits)
- **Key Needs:** Fast booking, flexible payment options, easy cancellation/rescheduling

### Customer (Registered)

- **Characteristics:** Repeat customers with account; value convenience and booking history
- **Frequency:** Regular users (weekly to monthly visits)
- **Key Needs:** Quick rebooking, booking history access, saved payment methods

### Staff Member

- **Characteristics:** Service providers; moderate technical ability; need reliable scheduling
- **Frequency:** Daily users (check schedule multiple times per day)
- **Key Needs:** Clear schedule view, easy time-off blocking, Google Calendar integration

### Business Owner

- **Characteristics:** Business decision-maker; basic computer literacy; needs comprehensive visibility
- **Frequency:** Daily to weekly users (monitor bookings and configure system)
- **Key Needs:** Revenue reporting, booking management, policy configuration, customer database

### WordPress Admin

- **Characteristics:** Technical professional (web developer); high technical ability; handles setup
- **Frequency:** One-time setup, occasional maintenance
- **Key Needs:** Easy installation, white-label customization, API configuration, troubleshooting tools

## 2.4 Operating Environment

### Server Requirements:

- **WordPress:** Version 6.0 or higher
- **PHP:** Version 8.0 or higher (PHP 8.1+ recommended)
- **MySQL:** Version 5.7 or higher (MySQL 8.0+ recommended)
- **HTTPS:** SSL certificate required (for payment security and OAuth)
- **Memory:** 256MB PHP memory limit minimum (512MB recommended)
- **Storage:** 50MB minimum for plugin files, database growth varies by usage

### Browser Compatibility:

- Chrome 90+ (desktop and mobile)
- Firefox 88+ (desktop and mobile)
- Safari 14+ (desktop and iOS)
- Edge 90+ (Chromium-based)
- Internet Explorer NOT supported

### Device Support:

- Desktop/laptop computers (Windows, macOS, Linux)
- Tablets (iPad, Android tablets)
- Smartphones (iPhone SE 2020+, Android 360×640px minimum)

### External Service Dependencies:

- Stripe API (payment processing)
- PayPal API (alternative payment processing)
- Google Calendar API (calendar synchronization)
- Transactional email service (SendGrid, Mailgun, AWS SES, or SMTP)

## 2.5 Design and Implementation Constraints

### WordPress Ecosystem Constraints:

- Must integrate with WordPress core authentication system
- Must follow WordPress coding standards and best practices
- Must use WordPress database abstraction layer (wpdb)
- Must be compatible with common WordPress themes
- Must support WordPress multisite architecture (future Phase 2 consideration)

### Geographic and Localization Constraints:

- **UK-Only Phase 1:** GBP currency, Europe/London timezone, UK bank holidays
- UK phone number format (mobile: 07xxx xxxxxx, landline: 01xxx xxxxxx)
- Date format: DD/MM/YYYY (UK standard)
- Time format: 12-hour with AM/PM (UK preference)

### Compliance Constraints:

- **PCI DSS Compliance:** No card data stored on server; all payments via hosted checkout
- **GDPR Compliance:** Data minimization, consent management, right to erasure, data portability
- **WCAG 2.1 AA:** Accessibility requirements for public booking interface
- **UK PECR:** Privacy and Electronic Communications Regulations (cookie consent)

### Phase 1 Feature Constraints:

- No package bookings (multi-session bundles)
- No recurring appointments (weekly/monthly series)
- No group bookings or class scheduling
- No approval workflows (instant booking confirmation)
- Single location only (multi-location support in Phase 2)
- One-way calendar sync only (two-way in Phase 2)
- Email notifications only (SMS in Phase 2)

### Technical Constraints:

- Maximum booking duration: 24 hours (overnight appointments limited to single midnight crossing)
- Booking window: Maximum 365 days in advance (configurable by Business Owner)
- Database performance: Optimized for up to 10,000 bookings per month
- Concurrent users: System designed for 50 simultaneous booking attempts

## 2.6 Assumptions and Dependencies

### Assumptions:

1. WordPress 6.0+ environment with modern features available
2. PHP 8.0+ and MySQL 5.7+ meet standard hosting requirements
3. HTTPS is enabled (required for Stripe, Google Calendar OAuth)
4. Clients have Stripe or PayPal merchant accounts
5. Staff members have Google accounts for calendar synchronization
6. Business Owners have basic computer literacy
7. WordPress Admin handles all initial setup and configuration

### External API Dependencies:

- **Stripe API:** Payment processing, refunds, webhook notifications
- **PayPal API:** Alternative payment processing, refunds, webhook notifications
- **Google Calendar API:** OAuth 2.0 authentication, event creation and updates
- **Email Service:** Transactional email delivery via SendGrid, Mailgun, AWS SES, or SMTP

### WordPress Core Dependencies:

- User authentication system (for Staff and Business Owner login)
- Cron jobs (WP-Cron for reminder emails and scheduled tasks)
- Media library (for logo and staff photo uploads)
- Options API (for storing plugin configuration)

---

# 3. SPECIFIC REQUIREMENTS

## 3.1 Functional Requirements

*This section details all functional requirements organized by major feature areas. Each requirement references the relevant source documentation from Phase 2 requirements gathering.*

### 3.1.1 Customer Booking Flow

**Reference:** CustomerJourney-01-Discovery.md, CustomerJourney-02-StaffSelection.md, CustomerJourney-03-DateTimeSelectionPayment.md

#### Step 1: Service Selection

**FR-1.1.1:** The system shall display all active services organized by categories.

**FR-1.1.2:** The system shall show service name, duration, base price, and description for each service.

**FR-1.1.3:** The system shall support responsive layout (1 column mobile, 3 columns desktop).

**FR-1.1.4:** The system shall display 'From £X' when staff have different pricing.

**FR-1.1.5:** The system shall persist service selection in PHP session storage.

**FR-1.1.6:** The system shall validate service selection before allowing progression to next step.

#### Step 2: Staff Selection

**FR-1.2.1:** The system shall display all staff members who offer the selected service.

**FR-1.2.2:** The system shall show staff name, photo, title, bio, and service-specific price.

**FR-1.2.3:** The system shall offer "No Preference" option showing lowest available price.

**FR-1.2.4:** The system shall order staff alphabetically by first name (Phase 1).

**FR-1.2.5:** The system shall implement "Least Busy" assignment algorithm for "No Preference" selection.

**FR-1.2.6:** The system shall display staff availability status (Available / Partially Booked / Fully Booked).

**FR-1.2.7:** The system shall handle edge case where no staff are available for selected service.

#### Step 3: Date and Time Selection

**FR-1.3.1:** The system shall display a monthly calendar with available dates highlighted.

**FR-1.3.2:** The system shall block UK bank holidays (configurable in settings).

**FR-1.3.3:** The system shall enforce global same-day lead time (configurable, default 2 hours).

**FR-1.3.4:** The system shall display available time slots in 15-minute increments.

**FR-1.3.5:** The system shall group time slots by Morning / Afternoon / Evening.

**FR-1.3.6:** The system shall calculate availability considering service duration and buffer time.

**FR-1.3.7:** The system shall auto-refresh availability every 30 seconds to minimize race conditions.

**FR-1.3.8:** The system shall support booking window up to 365 days in advance (configurable).

**FR-1.3.9:** The system shall prevent booking in the past or outside booking window.

**FR-1.3.10:** The system shall display clear messaging when no availability exists for selected criteria.

#### Step 4: Contact Details and Payment

**FR-1.4.1:** The system shall collect: First Name, Last Name, Email, Phone Number.

**FR-1.4.2:** The system shall validate UK phone number format (07xxx or 01xxx).

**FR-1.4.3:** The system shall validate email format and check for common typos (e.g., gmial.com).

**FR-1.4.4:** The system shall provide optional "Special Requests" text field (500 character limit).

**FR-1.4.5:** The system shall display marketing consent checkbox with GDPR-compliant wording.

**FR-1.4.6:** The system shall offer three payment methods: Stripe, PayPal, Pay on Arrival.

**FR-1.4.7:** The system shall clearly display deposit amount vs. balance due on arrival.

**FR-1.4.8:** The system shall use optimistic locking (database UNIQUE constraint) to prevent double-booking.

**FR-1.4.9:** The system shall create booking atomically after successful payment.

**FR-1.4.10:** The system shall display clear error message if selected time slot becomes unavailable during checkout.

### 3.1.2 Post-Booking Management

**Reference:** CustomerJourney-04-Notifications.md, CustomerJourney-05-Cancellation.md, CustomerJourney-06-Rescheduling.md

#### Email Notifications

**FR-1.5.1:** The system shall send booking confirmation email immediately after successful booking.

**FR-1.5.2:** The system shall include iCal attachment in confirmation email.

**FR-1.5.3:** The system shall send reminder email 24 hours before appointment (via cron job at 8:00 AM).

**FR-1.5.4:** The system shall send cancellation confirmation to customer and assigned staff.

**FR-1.5.5:** The system shall send rescheduling confirmation with new date/time details.

**FR-1.5.6:** The system shall notify staff of new bookings assigned to them.

**FR-1.5.7:** The system shall support customizable email templates with variable substitution.

**FR-1.5.8:** The system shall queue email delivery for retry on failure (3 attempts maximum).

**FR-1.5.9:** The system shall include magic links for cancellation and rescheduling (90-day validity).

**FR-1.5.10:** The system shall never fail booking creation due to email send failure.

#### Cancellation

**FR-1.6.1:** The system shall enforce configurable cancellation policy window (e.g., 24 hours before).

**FR-1.6.2:** The system shall allow cancellation within policy window with full automatic refund.

**FR-1.6.3:** The system shall require Business Owner approval for late cancellations (outside policy window).

**FR-1.6.4:** The system shall process Stripe refunds automatically within policy window.

**FR-1.6.5:** The system shall process PayPal refunds automatically within policy window.

**FR-1.6.6:** The system shall handle manual refunds for Pay-on-Arrival bookings.

**FR-1.6.7:** The system shall update booking status to "Cancelled" in database.

**FR-1.6.8:** The system shall delete cancelled booking from Google Calendar (if synced).

**FR-1.6.9:** The system shall retain cancelled booking record for reporting purposes.

#### Rescheduling

**FR-1.7.1:** The system shall allow rescheduling to any available date/time.

**FR-1.7.2:** The system shall transfer deposit to new booking (no additional payment required).

**FR-1.7.3:** The system shall retain original booking record with "Rescheduled" status.

**FR-1.7.4:** The system shall create new booking record linked to original.

**FR-1.7.5:** The system shall update Google Calendar event with new date/time.

**FR-1.7.6:** The system shall allow service change during reschedule (price difference calculation).

**FR-1.7.7:** The system shall allow staff change during reschedule (if service permits).

**FR-1.7.8:** The system shall validate availability before confirming reschedule.

### 3.1.3 Business Owner Dashboard

**Reference:** BusinessOwner-AdminRequirements.md (30 user stories across 6 epics)

#### Epic 1: Initial Setup and Onboarding (4 user stories)

**FR-1.8.1:** The system shall provide a 4-step setup wizard for first-time configuration.

**FR-1.8.2:** The system shall guide Business Owner through service creation with validation.

**FR-1.8.3:** The system shall configure initial staff availability and working hours.

**FR-1.8.4:** The system shall set up payment gateway connections (Stripe and/or PayPal).

#### Epic 2: Day-to-Day Booking Management (5 user stories)

**FR-1.9.1:** The system shall display all bookings in calendar and list views with filtering.

**FR-1.9.2:** The system shall allow filtering by: date range, staff, service, status.

**FR-1.9.3:** The system shall enable manual booking creation for walk-in customers.

**FR-1.9.4:** The system shall allow editing booking details (date, time, staff, service).

**FR-1.9.5:** The system shall support cancellation with configurable refund rules.

**FR-1.9.6:** The system shall display real-time booking status updates.

**FR-1.9.7:** The system shall provide quick actions (complete, no-show, reschedule).

#### Epic 3: Staff and Service Management (5 user stories)

**FR-1.10.1:** The system shall allow adding, editing, and deactivating staff members.

**FR-1.10.2:** The system shall configure staff working hours by day of week with split shifts.

**FR-1.10.3:** The system shall set staff-specific pricing for each service.

**FR-1.10.4:** The system shall manage service catalog (add, edit, archive services).

**FR-1.10.5:** The system shall organize services into categories for customer navigation.

**FR-1.10.6:** The system shall configure service duration and buffer time independently.

#### Epic 4: Pricing and Payment Configuration (4 user stories)

**FR-1.11.1:** The system shall configure Stripe API keys (test and live modes) with validation.

**FR-1.11.2:** The system shall configure PayPal client ID and secret with validation.

**FR-1.11.3:** The system shall set deposit amounts per service (percentage or fixed amount).

**FR-1.11.4:** The system shall configure cancellation policies (time window and refund percentages).

**FR-1.11.5:** The system shall enable/disable Pay-on-Arrival option globally or per service.

#### Epic 5: Reporting and Analytics (5 user stories)

**FR-1.12.1:** The system shall display dashboard overview with today's key statistics.

**FR-1.12.2:** The system shall show weekly and monthly revenue totals with trend indicators.

**FR-1.12.3:** The system shall generate revenue reports by customizable date range.

**FR-1.12.4:** The system shall break down revenue by service, staff, and payment method.

**FR-1.12.5:** The system shall calculate booking analytics (conversion, no-show rate, cancellation rate).

**FR-1.12.6:** The system shall display staff performance metrics (bookings, revenue, utilization).

**FR-1.12.7:** The system shall export reports to CSV and PDF formats.

#### Epic 6: Customer Database Management (5 user stories)

**FR-1.13.1:** The system shall display searchable customer list with booking history.

**FR-1.13.2:** The system shall show customer profile with total spent and lifetime value calculation.

**FR-1.13.3:** The system shall allow adding private notes to customer records.

**FR-1.13.4:** The system shall support customer data export (CSV for marketing use).

**FR-1.13.5:** The system shall implement GDPR data deletion (right to erasure with audit trail).

**FR-1.13.6:** The system shall provide data portability (export customer's own data on request).

### 3.1.4 Staff Dashboard

**Reference:** ScopeDefinition.md - User Role: Staff Member

#### View Schedule

**FR-1.14.1:** The system shall display staff member's personal schedule in calendar view.

**FR-1.14.2:** The system shall show upcoming appointments with customer details (name, phone).

**FR-1.14.3:** The system shall display appointment start time, duration, service, and price.

**FR-1.14.4:** The system shall show special requests if provided by customer.

**FR-1.14.5:** The system shall highlight current day and next appointment prominently.

#### Manage Availability

**FR-1.15.1:** The system shall allow staff to block time off (vacation, sick leave, breaks).

**FR-1.15.2:** The system shall support recurring time blocks (e.g., lunch every day 12:00-13:00).

**FR-1.15.3:** The system shall prevent bookings during blocked time periods.

**FR-1.15.4:** The system shall allow removing or editing existing time blocks.

**FR-1.15.5:** The system shall validate time blocks don't conflict with existing bookings.

#### Booking Actions

**FR-1.16.1:** The system shall allow staff to mark appointments as completed.

**FR-1.16.2:** The system shall allow staff to mark appointments as no-show.

**FR-1.16.3:** The system shall allow staff to request reschedule (customer approval required).

**FR-1.16.4:** The system shall prevent staff from cancelling bookings (Business Owner only).

**FR-1.16.5:** The system shall log all booking status changes with timestamp and staff ID.

#### Team Calendar

**FR-1.17.1:** The system shall display team calendar showing all staff schedules.

**FR-1.17.2:** The system shall show staff member names and booking counts.

**FR-1.17.3:** The system shall hide customer details in team view (privacy protection).

**FR-1.17.4:** The system shall allow staff to view their colleagues' availability.

#### Performance Metrics (Configurable)

**FR-1.18.1:** The system shall optionally display staff earnings (if enabled by Business Owner).

**FR-1.18.2:** The system shall show personal booking statistics (completed, cancelled, no-show).

**FR-1.18.3:** The system shall calculate utilization rate (booked hours vs. available hours).

---

## 3.2 Non-Functional Requirements

**Reference:** TechnicalRequirements.md

### 3.2.1 Performance Requirements

#### Public Booking Page Performance

**NFR-1.1:** Initial page load shall complete in ≤2.0 seconds on 3G connection.

**NFR-1.2:** First Contentful Paint (FCP) shall occur in ≤1.2 seconds.

**NFR-1.3:** Time to Interactive (TTI) shall be ≤2.0 seconds.

**NFR-1.4:** Largest Contentful Paint (LCP) shall be ≤2.5 seconds.

**NFR-1.5:** Cumulative Layout Shift (CLS) shall be ≤0.1.

**NFR-1.6:** First Input Delay (FID) shall be ≤100ms.

**NFR-1.7:** Google Lighthouse Performance score shall be ≥90.

#### Dashboard Performance

**NFR-1.8:** Dashboard page load shall complete in ≤1.5 seconds on broadband connection.

**NFR-1.9:** Initial dashboard render shall occur in ≤800ms.

**NFR-1.10:** Calendar view render shall complete in ≤1.0 seconds.

**NFR-1.11:** List views with 100+ bookings shall use virtual scrolling for performance.

#### API Response Times

**NFR-1.12:** Availability check API shall respond in ≤500ms.

**NFR-1.13:** Booking creation API shall complete in ≤2.0 seconds (including payment gateway call).

**NFR-1.14:** Simple queries (get booking) shall respond in ≤200ms.

**NFR-1.15:** Complex queries (reports) shall complete in ≤3.0 seconds.

#### Database Performance

**NFR-1.16:** Database queries shall execute in <100ms with 10,000 booking records.

**NFR-1.17:** Full-text search on customer names shall complete in ≤200ms.

**NFR-1.18:** Report generation queries shall use appropriate indexes to minimize query time.

**NFR-1.19:** Database deadlock rate shall be <0.1% of all transactions.

### 3.2.2 Security Requirements

#### Authentication

**NFR-2.1:** Staff and Business Owner accounts shall use WordPress authentication system with secure password hashing.

**NFR-2.2:** Session cookies shall be HttpOnly and Secure (HTTPS only).

**NFR-2.3:** Session timeout shall be 24 hours with 2-minute warning before expiry.

**NFR-2.4:** Password requirements: Minimum 8 characters (enforced by WordPress core).

**NFR-2.5:** Failed login attempts shall be rate-limited (max 5 per 15 minutes per IP).

#### Data Encryption

**NFR-2.6:** All customer data shall be encrypted at rest using AES-256 encryption.

**NFR-2.7:** All API communications shall use TLS 1.2 or higher.

**NFR-2.8:** API keys and OAuth tokens shall be encrypted with AES-256-GCM.

**NFR-2.9:** Database passwords shall be stored in wp-config.php (outside web root).

**NFR-2.10:** Sensitive data shall never be logged in plain text.

#### PCI DSS Compliance

**NFR-2.11:** No card data shall ever be stored on the server (PCI Level 1 SAQ A).

**NFR-2.12:** All payments shall be processed via Stripe Checkout or PayPal hosted pages.

**NFR-2.13:** Only Stripe/PayPal payment IDs, last 4 digits, and card brand shall be stored.

**NFR-2.14:** CVV codes shall never be logged, transmitted to server, or stored.

**NFR-2.15:** Webhook signatures shall be verified for all payment gateway notifications.

#### Input Validation and Sanitization

**NFR-2.16:** All user inputs shall be validated and sanitized server-side using WordPress functions.

**NFR-2.17:** SQL queries shall use prepared statements (no raw SQL concatenation).

**NFR-2.18:** XSS protection: Output escaping using WordPress esc_html(), esc_attr() functions.

**NFR-2.19:** CSRF protection: WordPress nonce verification for all state-changing operations.

**NFR-2.20:** File uploads shall be restricted to allowed types (images only: JPG, PNG, max 5MB).

### 3.2.3 Scalability Requirements

#### Phase 1 Targets (Year 1)

**NFR-3.1:** The system shall support 10,000 bookings per month per installation without performance degradation.

**NFR-3.2:** The system shall handle 50 concurrent booking attempts without response time increase >10%.

**NFR-3.3:** The system shall support up to 10 Business Owner dashboard users concurrently.

**NFR-3.4:** The system shall handle 200 concurrent public booking page viewers without errors.

**NFR-3.5:** Database queries shall remain performant with up to 10,000 booking records.

#### Phase 2 Targets (Year 2-3)

**NFR-3.6:** The system shall be architected to scale to 50,000 bookings per month with infrastructure upgrades.

**NFR-3.7:** The system shall support caching layer (Redis/Memcached) for Phase 2 scalability.

**NFR-3.8:** Database schema shall support read replicas for Phase 2 reporting requirements.

### 3.2.4 Accessibility Requirements (WCAG 2.1 AA)

**Reference:** TechnicalRequirements.md §5

#### Perceivable

**NFR-4.1:** All images shall have descriptive alt text; decorative images shall use alt="".

**NFR-4.2:** Color contrast ratio shall be ≥4.5:1 for normal text, ≥3:1 for large text.

**NFR-4.3:** Information shall not be conveyed by color alone (use icons + text).

**NFR-4.4:** HTML shall use semantic elements (nav, main, article, aside).

**NFR-4.5:** Form labels shall be explicitly associated with inputs using for/id attributes.

#### Operable

**NFR-4.6:** All functionality shall be available via keyboard (no mouse-only actions).

**NFR-4.7:** Visible focus indicators shall be present on all interactive elements (≥2px outline).

**NFR-4.8:** No keyboard traps; users can navigate in and out of all components.

**NFR-4.9:** Session timeout shall include 2-minute warning with option to extend.

**NFR-4.10:** No content shall flash more than 3 times per second.

#### Understandable

**NFR-4.11:** Language shall be declared in HTML: `<html lang="en-GB">`.

**NFR-4.12:** Form validation errors shall be clearly identified with suggestions.

**NFR-4.13:** Required fields shall be marked with asterisk and aria-required="true".

**NFR-4.14:** Navigation shall be consistent across all pages.

#### Robust

**NFR-4.15:** HTML shall be valid HTML5 (no parsing errors).

**NFR-4.16:** ARIA attributes shall be used correctly following WAI-ARIA specification.

**NFR-4.17:** Unique IDs shall be used throughout (no duplicate id attributes).

#### Screen Reader Support

**NFR-4.18:** Complete booking flow shall be navigable using screen reader only (NVDA, JAWS, VoiceOver).

**NFR-4.19:** Loading states shall be communicated via aria-live regions.

**NFR-4.20:** Form errors shall be announced immediately using role="alert".

#### Mobile Accessibility

**NFR-4.21:** Touch targets shall be minimum 44×44 CSS pixels (WCAG 2.5.5).

**NFR-4.22:** Pinch-to-zoom shall be enabled (never disable viewport zoom).

**NFR-4.23:** No horizontal scrolling shall be required at any viewport width.

### 3.2.5 Reliability and Availability

**NFR-5.1:** System uptime shall be ≥99.5% (excluding scheduled maintenance).

**NFR-5.2:** Scheduled maintenance shall occur during low-traffic periods (2:00-4:00 AM UK time).

**NFR-5.3:** Database backups shall occur daily with 30-day retention.

**NFR-5.4:** Critical errors shall be logged and monitored via error tracking service.

**NFR-5.5:** Payment gateway failures shall not prevent booking creation (graceful degradation to Pay-on-Arrival).

### 3.2.6 Usability Requirements

**NFR-6.1:** Average customer booking completion time shall be ≤3 minutes.

**NFR-6.2:** Business Owner dashboard shall be learnable within 30 minutes (usability testing).

**NFR-6.3:** Error messages shall be clear, actionable, and non-technical.

**NFR-6.4:** System shall provide contextual help tooltips for complex features.

**NFR-6.5:** Mobile interface shall be optimized for one-handed use (thumb-friendly zones).

### 3.2.7 Compatibility Requirements

**NFR-7.1:** System shall be compatible with all major browsers (Chrome, Firefox, Safari, Edge).

**NFR-7.2:** System shall support both WordPress single-site and multisite installations.

**NFR-7.3:** System shall be compatible with standard WordPress themes (no theme-specific code).

**NFR-7.4:** System shall not conflict with common WordPress plugins (WooCommerce, Yoast SEO, etc.).

---

## 3.3 External Interface Requirements

### 3.3.1 User Interfaces

#### Public Booking Page

- **Responsive Design:** Mobile-first approach, 1-column mobile, 3-column desktop
- **Navigation:** 4-step wizard with progress indicator and back button
- **Visual Hierarchy:** Clear CTAs, prominent service/staff/time selection
- **Forms:** Inline validation with real-time feedback
- **Loading States:** Skeleton screens and progress indicators

#### Business Owner Dashboard

- **Layout:** Sidebar navigation with collapsible menu
- **Calendar View:** Week/month views with color-coded bookings
- **Data Tables:** Sortable columns, pagination, search filters
- **Charts:** Revenue trends, booking analytics (using Chart.js or similar)
- **Modals:** For creating/editing bookings, settings configuration

#### Staff Dashboard

- **Simplified Layout:** Focus on today's schedule and upcoming appointments
- **Quick Actions:** One-click complete/no-show buttons
- **Calendar Widget:** Personal schedule with team overlay option

Reference: CustomerJourney files contain detailed UI specifications for each booking step.

### 3.3.2 Hardware Interfaces

N/A (web-based system; no direct hardware interaction)

### 3.3.3 Software Interfaces

**Reference:** IntegrationRequirements_Phase1.md

#### WordPress Core API

- **Authentication:** WordPress user authentication functions
- **Database:** wpdb class for database operations
- **Cron:** wp_schedule_event() for scheduled tasks
- **Options:** get_option() / update_option() for configuration storage
- **Media:** Media library for image uploads

#### Stripe API

- **Integration Type:** Server-side API + Checkout.js
- **Authentication:** API keys (test and live)
- **Endpoints Used:**
  - Create Checkout Session
  - Retrieve Payment Intent
  - Create Refund
  - Webhook event handling
- **Data Format:** JSON
- **Error Handling:** Stripe exception handling with user-friendly messages

#### PayPal API

- **Integration Type:** Server-side REST API
- **Authentication:** OAuth 2.0 (client credentials)
- **Endpoints Used:**
  - Create Order
  - Capture Order
  - Issue Refund
  - Webhook event handling
- **Data Format:** JSON
- **Error Handling:** HTTP status codes with fallback messaging

#### Google Calendar API

- **Integration Type:** Server-side API with OAuth 2.0
- **Authentication:** Per-staff OAuth tokens (stored encrypted)
- **Endpoints Used:**
  - Create Event
  - Update Event
  - Delete Event
- **Data Format:** JSON
- **Rate Limits:** 1,000 requests per day per user (monitored)

#### Email Services

**Supported Providers:**

- SendGrid API
- Mailgun API
- AWS SES API
- SMTP (fallback)

**Integration Requirements:**

- Queued delivery with retry logic (3 attempts)
- Bounce and complaint handling
- Template variable substitution
- HTML + plain text formats

### 3.3.4 Communications Interfaces

**NFR-8.1:** All external API calls shall use HTTPS/TLS 1.2 or higher.

**NFR-8.2:** Webhook endpoints shall verify signature/authentication tokens.

**NFR-8.3:** API requests shall include appropriate User-Agent headers identifying the plugin.

**NFR-8.4:** Rate limiting shall be implemented for all outbound API calls.

**NFR-8.5:** Timeout values: 10 seconds for payment APIs, 30 seconds for email APIs.

---

# 4. APPENDICES

## Appendix A: User Story Summary

### Total User Stories by Epic

| Epic | Story Count | Priority Breakdown |
|------|-------------|-------------------|
| Initial Setup & Onboarding | 4 | Must: 4, Should: 0, Could: 0 |
| Day-to-Day Booking Management | 5 | Must: 5, Should: 0, Could: 0 |
| Staff & Service Management | 5 | Must: 5, Should: 0, Could: 0 |
| Pricing & Payment Configuration | 4 | Must: 4, Should: 0, Could: 0 |
| Reporting & Analytics | 5 | Must: 3, Should: 2, Could: 0 |
| Customer Database Management | 5 | Must: 4, Should: 1, Could: 0 |
| Email Notifications & Templates | 2 | Must: 2, Should: 0, Could: 0 |
| **TOTAL** | **30** | **Must: 27, Should: 3, Could: 0** |

### User Stories by Role

| Role | Story Count |
|------|-------------|
| Customer (Guest) | 8 |
| Customer (Registered) | 3 |
| Staff Member | 6 |
| Business Owner | 30 |
| WordPress Admin | 5 |

### Priority Distribution (MoSCoW)

- **Must Have (Phase 1):** 27 stories (90%)
- **Should Have (Phase 1 if time):** 3 stories (10%)
- **Could Have (Phase 2):** 0 stories (deferred)
- **Won't Have (Out of scope):** All package/recurring/group booking features

## Appendix B: Database Schema

**Reference:** ScopeDefinition.md §6

### Core Tables (10 total)

#### 1. wp_bookings

```sql
CREATE TABLE wp_bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  staff_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled') DEFAULT 'confirmed',
  total_price DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0.00,
  payment_method ENUM('stripe', 'paypal', 'pay-on-arrival') NOT NULL,
  payment_intent_id VARCHAR(255),
  special_requests TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_booking (staff_id, booking_date, start_time), /* Prevents double-booking */
  INDEX idx_customer (customer_id),
  INDEX idx_staff_date (staff_id, booking_date),
  INDEX idx_status (status)
);
```

#### 2. wp_booking_customers

```sql
CREATE TABLE wp_booking_customers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  marketing_consent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  FULLTEXT idx_name (first_name, last_name)
);
```

#### 3. wp_booking_staff

```sql
CREATE TABLE wp_booking_staff (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  wordpress_user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  bio TEXT,
  photo_url VARCHAR(255),
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_oauth_token TEXT, /* Encrypted */
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_wp_user (wordpress_user_id),
  INDEX idx_active (is_active)
);
```

#### 4. wp_booking_services

```sql
CREATE TABLE wp_booking_services (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  buffer_minutes INT DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  deposit_type ENUM('none', 'percentage', 'fixed') DEFAULT 'none',
  deposit_amount DECIMAL(10,2) DEFAULT 0.00,
  category_id BIGINT UNSIGNED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_category (category_id),
  INDEX idx_active (is_active)
);
```

#### 5. wp_booking_service_categories

```sql
CREATE TABLE wp_booking_service_categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL
);
```

#### 6. wp_booking_staff_services

```sql
CREATE TABLE wp_booking_staff_services (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  staff_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  custom_price DECIMAL(10,2), /* NULL = use service base_price */
  UNIQUE KEY unique_staff_service (staff_id, service_id),
  INDEX idx_service (service_id)
);
```

#### 7. wp_booking_staff_hours

```sql
CREATE TABLE wp_booking_staff_hours (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  staff_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT NOT NULL, /* 1=Monday, 7=Sunday */
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE KEY unique_staff_day_time (staff_id, day_of_week, start_time),
  INDEX idx_staff (staff_id)
);
```

#### 8. wp_booking_staff_time_off

```sql
CREATE TABLE wp_booking_staff_time_off (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  staff_id BIGINT UNSIGNED NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  reason VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(255), /* RRULE format for Phase 2 */
  created_at DATETIME NOT NULL,
  INDEX idx_staff_dates (staff_id, start_datetime, end_datetime)
);
```

#### 9. wp_booking_payments

```sql
CREATE TABLE wp_booking_payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  payment_method ENUM('stripe', 'paypal', 'pay-on-arrival', 'cash', 'card-machine') NOT NULL,
  payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  status ENUM('pending', 'completed', 'refunded', 'failed') DEFAULT 'pending',
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  refund_amount DECIMAL(10,2) DEFAULT 0.00,
  refund_date DATETIME,
  created_at DATETIME NOT NULL,
  INDEX idx_booking (booking_id),
  INDEX idx_intent (payment_intent_id)
);
```

#### 10. wp_booking_settings

```sql
CREATE TABLE wp_booking_settings (
  option_name VARCHAR(191) PRIMARY KEY,
  option_value LONGTEXT NOT NULL,
  autoload ENUM('yes', 'no') DEFAULT 'yes'
);
```

### Key Database Design Decisions

1. **Optimistic Locking:** UNIQUE constraint on (staff_id, booking_date, start_time) prevents race conditions
2. **Encrypted Fields:** OAuth tokens encrypted with AES-256-GCM before storage
3. **Soft Deletes:** is_active flags instead of DELETE operations (audit trail)
4. **Indexes:** Optimized for common queries (staff schedule, customer history, date ranges)
5. **FULLTEXT Search:** Customer name search using MySQL FULLTEXT index

## Appendix C: Integration Summary

**Reference:** IntegrationRequirements_Phase1.md

### Phase 1 Integrations (4 total)

#### 1. Email Services (CRITICAL)

**Provider Options:** SendGrid, Mailgun, AWS SES, SMTP fallback

**Why Needed:** WordPress wp_mail() is unreliable on shared hosting; 5-20% failure rate

**Integration Approach:**

- Transactional email API (preferred over SMTP)
- Queued delivery with Action Scheduler
- Retry logic: 3 attempts with exponential backoff
- Bounce and complaint tracking

**Cost:** £10-35/month depending on volume

**Data Flow:**

1. Booking event triggers email
2. Email queued in Action Scheduler
3. API call to email service
4. Delivery status tracked
5. Bounces logged for cleanup

#### 2. Stripe (CRITICAL)

**Purpose:** Primary payment gateway

**Integration Approach:**

- Stripe Checkout (hosted payment page)
- Server-side API for refunds
- Webhooks for payment confirmations
- Test mode and Live mode support

**Key Features:**

- Deposit or full payment
- Automatic refunds (within cancellation policy)
- PCI-compliant (no card data stored)
- GBP currency only (Phase 1)

**Security:** Webhook signature verification (HMAC-SHA256)

**Cost:** 1.5% + £0.20 per transaction

#### 3. PayPal (HIGH PRIORITY)

**Purpose:** Alternative payment method (30-40% UK preference)

**Integration Approach:**

- PayPal Orders API
- Server-side capture after approval
- Webhooks for payment notifications
- OAuth 2.0 authentication

**Key Features:**

- Buyer protection increases trust
- Popular alternative to credit cards
- Automatic refunds supported

**Cost:** 2.9% + £0.30 per transaction (standard rates)

#### 4. Google Calendar (MEDIUM PRIORITY)

**Purpose:** Staff calendar synchronization

**Integration Approach:**

- OAuth 2.0 per-staff authentication
- One-way sync (plugin → calendar)
- Automatic event creation/update/deletion
- iCal export as alternative

**Phase 1 Limitations:**

- One-way only (staff edits in Google don't update plugin)
- Syncs to Primary calendar only
- Rate limit: 1,000 events/day per user

**Phase 2 Enhancement:** Two-way sync using push notifications API

### Integration Health Monitoring

**Daily Health Check Cron (8:00 AM):**

- Test Stripe connectivity
- Test PayPal connectivity
- Test email send capability
- Check Google Calendar OAuth token validity
- Alert admin if any critical service fails

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Booking** | A scheduled appointment between a customer and staff member for a specific service at a specific date/time |
| **Buffer Time** | Additional time added after a service for cleanup, notes, or transition between appointments |
| **Cancellation Policy** | Rules defining the time window before an appointment when cancellation is allowed with full refund |
| **Cron Job** | Scheduled task that runs automatically at specific intervals (e.g., sending reminder emails) |
| **Deposit** | Partial payment made at booking time to secure the appointment; balance due on arrival |
| **Guest Checkout** | Booking process that doesn't require customer to create an account; uses magic links for management |
| **Magic Link** | Time-limited URL sent via email allowing customers to cancel or reschedule without logging in |
| **No Preference** | Customer option to let the system automatically assign any available staff member for their booking |
| **No-Show** | Customer who had a confirmed booking but did not arrive and did not cancel |
| **Optimistic Locking** | Concurrency control method using database constraints to prevent double-booking during checkout |
| **Pay on Arrival** | Payment method where no deposit is collected; customer pays full amount at appointment location |
| **Race Condition** | Scenario where two customers attempt to book the same time slot simultaneously |
| **Reschedule** | Changing an existing booking to a different date, time, or service while retaining deposit |
| **Service** | Bookable offering (e.g., "Women's Haircut") with defined duration, price, and staff assignments |
| **Session Storage** | PHP $_SESSION temporary data storage used during the booking flow (4-step wizard) |
| **Staff Preference** | Customer's choice to book with a specific staff member vs. "No Preference" automatic assignment |
| **Time Slot** | 15-minute increment representing a potential booking start time |
| **Utilization Rate** | Percentage of staff's available hours that are booked with paying customers |
| **White Label** | Customization allowing plugin branding to match client's business identity |
| **WordPress Admin** | Developer/agency who installs and configures the plugin for clients |
| **wpdb** | WordPress database abstraction class used for all database operations |

**Priority: Medium**
**Estimated Effort: 8-12 hours**

### Self-Service Password Reset (Forgot Password)

**User Story:**
As a staff member who forgot my password, I want to reset it myself without contacting an admin, so I can regain access quickly.

**Features:**
- "Forgot Password?" link on login page
- Enter email address form
- Generate secure reset token (cryptographically random, 32+ chars)
- Token expiry (1 hour default, configurable)
- Email with reset link containing token
- Reset form validates token and allows new password entry
- Password strength requirements (min 8 chars, optional complexity rules)
- Token invalidation after use or expiry
- Rate limiting to prevent abuse

**Technical Requirements:**
- New database table: `wp_bookings_password_resets`
  - token (varchar 64, indexed)
  - email (varchar 255, indexed)
  - created_at (datetime)
  - expires_at (datetime)
  - used_at (datetime, nullable)
- Token generation using `random_bytes()` or `wp_generate_password()`
- Secure token validation (timing-safe comparison)
- Email sending via configured SMTP (requires Task 11 completion)

**Security Considerations:**
- Tokens are one-time use only
- Tokens expire after 1 hour
- Rate limit: 3 reset requests per email per hour
- No user enumeration (same response for valid/invalid emails)
- Secure token storage (hashed in database)
- HTTPS required for reset links

**Dependencies:**
- Task 11 must be complete (email configuration)
- Email system must be working
- SMTP properly configured

**Why Phase 2:**
- Requires working email system (Task 11)
- More complex security considerations
- Not critical for initial launch (admin can reset manually)
- Professional email templates needed
- Token management adds complexity

### Professional HTML Email Templates

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

### Session Management Enhancements

**Features:**
- Remember me functionality
- Session timeout configuration
- Active sessions display (see where logged in)
- Force logout from all devices
- IP-based security alerts

**Why Phase 2:**
- Nice-to-have, not essential for launch
- Requires additional database tables
- More complex authentication logic

### Two-Factor Authentication (Optional)

**Features:**
- TOTP-based 2FA (Google Authenticator compatible)
- Backup codes
- QR code generation
- Optional enforcement for admin users

**Why Phase 2:**
- Advanced security feature
- Not required for most SMB clients
- Adds significant complexity
- Requires mobile app support

## Implementation Priority (Phase 2)

1. **Self-Service Password Reset** (High Priority)
   - Most requested feature
   - Expected by users
   - Professional standard
   - Estimated: 6-8 hours

2. **Professional Email Templates** (Medium Priority)
   - Enhances brand experience
   - Improves communication quality
   - Estimated: 4-6 hours

3. **Session Management** (Low Priority)
   - Nice-to-have for larger teams
   - Estimated: 4-6 hours

4. **Two-Factor Authentication** (Optional)
   - Only if client requests
   - Estimated: 8-12 hours

---

## DOCUMENT APPROVAL

| Name | Role | Signature | Date |
|------|------|-----------|------|
| | Project Sponsor | | |
| | Technical Architect | | |
| | Development Lead | | |
| | QA Lead | | |

**Status:** APPROVED FOR DEVELOPMENT

**Next Steps:**

1. Technical architecture design
2. Sprint planning and task breakdown
3. Development environment setup
4. Begin Phase 1 implementation

**Estimated Development Timeline:** 4-5 months (16-20 weeks)

**Target Launch Date:** Q2 2026

---

*End of Software Requirements Specification Document*

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-01-18 | Claude + Liron | Initial draft - Phase 2 requirements consolidation |
| 1.0 | 2026-01-21 | Claude + Liron | Final version - All sections complete and reviewed |
