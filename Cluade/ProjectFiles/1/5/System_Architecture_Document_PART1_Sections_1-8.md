# SYSTEM ARCHITECTURE DOCUMENT
## WordPress Booking Plugin - Phase 1 MVP

**Document Version:** 1.0  
**Date:** January 23, 2026  
**Status:** READY FOR REVIEW  
**Project Phase:** Phase 5 - Architecture Design  
**Based On:** Complete Phase 1-4 Requirements Package

---

## DOCUMENT CONTROL

| Role | Name | Status | Date |
|------|------|--------|------|
| Project Lead | Liron | Pending Review | 23/01/2026 |
| Technical Architect | TBD | Pending Review | |
| Development Lead | TBD | Pending Review | |
| Security Reviewer | TBD | Pending Review | |

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Unique Differentiator: Separate Business Dashboard](#3-unique-differentiator-separate-business-dashboard)
4. [WordPress Plugin Architecture](#4-wordpress-plugin-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Customer Booking Flow Architecture](#6-customer-booking-flow-architecture)
7. [Payment Integration Architecture](#7-payment-integration-architecture)
8. [Email Notification Architecture](#8-email-notification-architecture)
9. [Google Calendar Integration Architecture](#9-google-calendar-integration-architecture)
10. [Security Architecture](#10-security-architecture)
11. [Accessibility Architecture (WCAG 2.1 AA)](#11-accessibility-architecture-wcag-21-aa)
12. [Performance Architecture](#12-performance-architecture)
13. [UK Compliance Architecture](#13-uk-compliance-architecture)
14. [Technology Stack Decisions](#14-technology-stack-decisions)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Error Handling & Logging](#16-error-handling--logging)
17. [Testing Strategy](#17-testing-strategy)
18. [Phase 2 Architecture Preparation](#18-phase-2-architecture-preparation)
19. [Architecture Review Checklist](#19-architecture-review-checklist)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Project Overview

The WordPress Booking Plugin is a custom-built, UK-focused appointment booking system designed for service-based SMBs (salons, photographers, consultants, therapists). Unlike existing WordPress booking plugins that force business owners to navigate WordPress admin interfaces or SaaS platforms that charge ongoing subscription fees, this plugin delivers a **professional, separate business dashboard** alongside a fully-featured WordPress plugin.

**Target Market:**
- UK service businesses with 1-10 staff members
- Appointment-based services (30-120 minute sessions)
- Business owners with minimal technical expertise
- Businesses requiring professional booking without WordPress complexity

**Business Model:**
This plugin is **not sold standalone** but is integrated as part of a complete website development service, providing a key differentiator for the web development business. Revenue comes from website creation (£495-995 setup) and ongoing support (£99-1,188 annually).

## 1.2 Unique Differentiators

### 1. True Separate Business Dashboard (MARKET GAP)
**No competitor offers this.** All WordPress plugins (Bookly, Amelia, WooCommerce Bookings) require WordPress admin access or shortcode-based "panels" that remain WordPress-dependent. SaaS platforms (Fresha, Calendly, Acuity) offer dashboards but lock clients into subscription models with marketplace fees.

**Our Approach:**
- Completely independent web application separate from WordPress admin
- Accessible via `/dashboard/` subdirectory or custom subdomain
- Zero WordPress knowledge required for daily operations
- Staff cannot accidentally break the website (no WP admin access)
- White-label capability with client branding

### 2. UK-First Design
- GDPR-compliant from day one (right to erasure, data portability)
- WCAG 2.1 Level AA accessibility (UK legal requirement)
- UK timezone (Europe/London) with bank holiday handling
- GBP-only pricing, no multi-currency complexity
- UK-specific legal compliance (PECR, Consumer Contracts Regulations)

### 3. Zero Marketplace Commissions
Unlike Fresha (10% transaction fee on card payments) or SaaS platforms with subscription tiers, clients pay **zero ongoing platform fees**. One-time setup + hosting costs only.

### 4. Complete Data Ownership
All booking data stored in client's WordPress database. No vendor lock-in, complete control, full data export capabilities.

### 5. API-Ready Architecture
Built from day one to support future mobile app development, enabling seamless transition from web-only to mobile-enabled booking system.

## 1.3 Architecture Philosophy

This architecture is guided by five core principles:

### Principle 1: Simplicity for Phase 1, Flexibility for Phase 2
Deliver the minimum viable product quickly (20-22 weeks) while architecting for future enhancements:
- 1-way calendar sync now → architecture ready for 2-way sync
- Email notifications now → SMS integration prepared for Phase 2
- Single location now → multi-location schema extensions planned
- Manual recurring bookings now → automated recurring ready for Phase 2

### Principle 2: Security Without Compromise
- PCI DSS SAQ A compliance (no card data stored)
- All payment processing via hosted checkout pages (Stripe, PayPal)
- Separate authentication systems for dashboard vs WordPress admin
- AES-256-GCM encryption for API keys and OAuth tokens
- Rate limiting, CSRF protection, SQL injection prevention via prepared statements

### Principle 3: Accessibility as Foundation, Not Afterthought
- WCAG 2.1 Level AA compliance built into component library
- Keyboard navigation for all functionality
- Screen reader support with ARIA labels and live regions
- 4.5:1 color contrast ratio minimum
- Touch targets ≥44×44 CSS pixels for mobile

### Principle 4: Performance for UK 3G Connections
- <2 second page load on 3G (NFR-1.1)
- Critical CSS inline, deferred JavaScript
- Database query optimization (<100ms with 10,000 records)
- Lighthouse performance score ≥90

### Principle 5: Fail-Safe Operations
- **Booking creation NEVER fails** due to external service failures
- Email failure → queued for retry (booking still created)
- Calendar sync failure → logged but non-blocking (booking still created)
- Payment gateway failure → fallback to "Pay on Arrival" option
- Database constraints prevent double-booking at data layer

## 1.4 Technology Stack Summary

### Backend
- **PHP 8.0+** (WordPress requirement, performance improvements over 7.4)
- **WordPress 6.0+** (block editor, REST API improvements, modern features)
- **MySQL 5.7+ / MariaDB 10.3+** (JSON column support, performance)

### Frontend - Public Booking Page
- **Vanilla JavaScript** (no framework - minimize bundle size)
- **Tailwind CSS** via CDN (utility-first, no build step required)
- **Minimal dependencies:** Date picker library only (Flatpickr)

### Frontend - Business Dashboard
- **Vue 3** (lightweight, easy to learn, excellent documentation)
- **Rationale:** React considered but Vue chosen for:
  - Smaller bundle size (40% smaller than React for equivalent app)
  - Simpler learning curve for future developers/clients
  - Better documentation for building admin interfaces
  - Excellent TypeScript support (future migration path)

### Infrastructure
- **Action Scheduler** (WordPress plugin - email queue management)
- **Composer** for PHP dependencies (Stripe SDK, PayPal SDK, Google API Client)
- **WordPress REST API** for dashboard ↔ WordPress communication
- **WP-Cron** for scheduled tasks (24h reminders, health checks)

### External Integrations
- **Stripe Checkout** (primary payment gateway)
- **PayPal Orders API** (alternative payment gateway)
- **Google Calendar API v3** (1-way booking sync)
- **Transactional Email Service** (SendGrid/Mailgun/AWS SES - NOT wp_mail)

## 1.5 Critical Success Factors

This architecture succeeds if:

1. ✅ **First client launches within 22 weeks** (Week 20 + 2-week buffer)
2. ✅ **Business owners master dashboard in <30 minutes** (NFR-6.2)
3. ✅ **Zero critical security vulnerabilities** in pre-launch audit
4. ✅ **<2 second page load** on 3G connections (NFR-1.1)
5. ✅ **WCAG 2.1 AA compliance** verified by automated + manual testing
6. ✅ **Email deliverability ≥98%** (transactional service requirement)
7. ✅ **Zero double-bookings** (database constraints + optimistic locking)
8. ✅ **Payment success rate ≥95%** (dual gateway support)
9. ✅ **Staff can manage without contacting developer** (separate dashboard success)
10. ✅ **Architecture supports Phase 2 features** without major refactoring

## 1.6 Document Scope

This document provides the technical foundation for all development work from Sprint 0 (database setup) through Sprint 6 (launch). It covers:

- ✅ High-level system architecture and component interactions
- ✅ Database schema validation and optimization strategy
- ✅ Detailed architecture for the separate business dashboard (core differentiator)
- ✅ Customer booking flow with session management and race condition handling
- ✅ Payment gateway integration (Stripe + PayPal dual support)
- ✅ Email notification system with queue-based delivery
- ✅ Google Calendar 1-way synchronization with OAuth 2.0
- ✅ Security architecture covering authentication, authorization, encryption
- ✅ Accessibility implementation strategy (WCAG 2.1 AA)
- ✅ Performance optimization approaches
- ✅ UK compliance requirements (GDPR, PECR, accessibility)
- ✅ Deployment and environment configuration
- ✅ Error handling, logging, and monitoring

**What This Document Does NOT Cover:**
- ❌ Line-by-line code implementation (covered in Sprint work)
- ❌ UI/UX wireframes and visual design (separate design phase)
- ❌ Phase 2 features beyond architectural preparation notes
- ❌ Client-specific customizations or white-label variations
- ❌ Marketing materials, pricing strategy, sales process

---

# 2. SYSTEM OVERVIEW

## 2.1 High-Level System Architecture

The WordPress Booking Plugin consists of five primary components that work together to deliver the complete booking experience:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐        ┌──────────────────────────────────┐ │
│  │   CUSTOMERS      │        │    BUSINESS OWNERS & STAFF       │ │
│  │  (Public Web)    │        │     (Dashboard Users)            │ │
│  └────────┬─────────┘        └───────────┬──────────────────────┘ │
│           │                               │                        │
│           ▼                               ▼                        │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │   PUBLIC BOOKING PAGE   │    │   BUSINESS DASHBOARD        │  │
│  │   (WordPress Frontend)  │    │   (Separate Web App)        │  │
│  │                         │    │                             │  │
│  │  • Service Selection    │    │  • Calendar View            │  │
│  │  • Staff Selection      │    │  • Booking Management       │  │
│  │  • Date/Time Picker     │    │  • Staff/Service Config     │  │
│  │  • Payment Checkout     │    │  • Reports & Analytics      │  │
│  │                         │    │  • Customer Database        │  │
│  └────────┬────────────────┘    └───────────┬─────────────────┘  │
│           │                                  │                     │
│           └──────────────┬───────────────────┘                     │
│                          │                                         │
│                          ▼                                         │
│         ┌────────────────────────────────────────┐                │
│         │     WORDPRESS PLUGIN CORE              │                │
│         │     (PHP Business Logic)               │                │
│         │                                        │                │
│         │  • Booking Engine                      │                │
│         │  • Availability Calculator             │                │
│         │  • Session Management                  │                │
│         │  • REST API Endpoints                  │                │
│         │  • Authentication & Authorization      │                │
│         │  • Email Queue Manager                 │                │
│         └──┬─────────┬─────────┬─────────┬──────┘                │
│            │         │         │         │                        │
│      ┌─────▼──┐  ┌──▼────┐ ┌──▼─────┐ ┌─▼────────┐              │
│      │ MySQL  │  │Stripe │ │PayPal  │ │  Google  │              │
│      │Database│  │  API  │ │  API   │ │ Calendar │              │
│      └────────┘  └───────┘ └────────┘ └──────────┘              │
│                                                                   │
│      ┌──────────────────────────────────────┐                    │
│      │   TRANSACTIONAL EMAIL SERVICE        │                    │
│      │   (SendGrid / Mailgun / AWS SES)     │                    │
│      └──────────────────────────────────────┘                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Descriptions

#### 1. Public Booking Page (Customer-Facing)
**Technology:** WordPress frontend (PHP templates + Vanilla JavaScript)  
**URL Structure:** `https://clientdomain.com/book/` or custom slug  
**Purpose:** Customer-facing 4-step booking wizard embedded in WordPress site

**Key Features:**
- Step 1: Service selection (with categories, pricing display)
- Step 2: Staff selection (includes "No Preference" algorithm)
- Step 3: Date/time picker (real-time availability checking via AJAX)
- Step 4: Contact details + payment (Stripe/PayPal checkout redirect)

**Technical Characteristics:**
- Vanilla JavaScript (no React/Vue - minimize bundle size for public page)
- Session-based storage (PHP $_SESSION - cleared after payment)
- Mobile-responsive (1-column mobile, 3-column desktop where appropriate)
- WCAG 2.1 AA compliant (keyboard navigation, screen reader support)
- <2 second initial load on 3G connection

#### 2. Business Dashboard (Business Owner & Staff)
**Technology:** Vue 3 SPA + WordPress REST API backend  
**URL Structure:** `https://clientdomain.com/dashboard/` OR `https://bookings.clientdomain.com/`  
**Purpose:** Separate, professional interface for booking management (NOT WordPress admin)

**Key Features:**
- Calendar view (day/week/month) with drag-and-drop rescheduling
- Booking list with filtering (date range, staff, service, status)
- Manual booking creation and editing
- Staff management (CRUD operations, availability configuration)
- Service management (CRUD operations, categories, pricing)
- Revenue reporting and analytics
- Customer database with search and export
- Settings configuration (payment gateways, cancellation policies, email templates)

**Technical Characteristics:**
- Vue 3 with Vue Router (client-side routing)
- Tailwind CSS for styling
- Axios for API calls to WordPress REST API
- Separate authentication (not WordPress admin users)
- JWT or session-based auth (decision documented in §3.4)
- White-label capability (logo, colors, domain configurable)

#### 3. WordPress Plugin Core (Business Logic)
**Technology:** PHP 8.0+ following WordPress Coding Standards  
**Location:** `/wp-content/plugins/bookit-booking-system/`  
**Purpose:** Central business logic, database operations, external integrations

**Key Responsibilities:**
- Booking engine (create, read, update, delete bookings)
- Availability calculation algorithm (staff working hours + existing bookings)
- "No Preference" staff selection (load-balancing across available staff)
- Payment processing coordination (Stripe/PayPal webhooks)
- Email queue management (Action Scheduler integration)
- Google Calendar sync (OAuth + event creation/update/deletion)
- REST API endpoints for dashboard communication
- WordPress admin settings pages (plugin configuration)
- WP-Cron scheduled tasks (24h reminders, health checks)

#### 4. MySQL Database (Data Layer)
**Tables:** 10 custom tables (prefixed `wp_bookings_*`)  
**Purpose:** All booking, customer, staff, service, and payment data

**Key Design Decisions:**
- Custom tables (not custom post types) for performance
- UNIQUE constraints on (staff_id, booking_date, start_time) prevent double-booking
- Foreign key relationships for data integrity
- Composite indexes on frequently queried columns
- Soft deletes for GDPR compliance (7-year retention)

#### 5. External Integrations
- **Stripe Checkout:** Primary payment gateway (redirect-based, PCI compliant)
- **PayPal Orders API:** Alternative payment gateway
- **Google Calendar API v3:** 1-way sync (plugin → calendar)
- **Transactional Email Service:** SendGrid/Mailgun/AWS SES (NOT wp_mail)

## 2.2 Data Flow Diagram: Customer Booking Journey

This diagram illustrates the complete data flow from initial service selection through booking confirmation:

```
STEP 1: SERVICE SELECTION
┌─────────────────────────────────────────────────────────────────┐
│ Customer selects service                                        │
│   ↓                                                             │
│ JavaScript AJAX → WordPress REST API                            │
│   ↓                                                             │
│ Query wp_bookings_services table                                │
│   ↓                                                             │
│ Return services with categories, pricing, duration              │
│   ↓                                                             │
│ Store selected service in PHP $_SESSION                         │
└─────────────────────────────────────────────────────────────────┘

STEP 2: STAFF SELECTION
┌─────────────────────────────────────────────────────────────────┐
│ Customer selects staff (or "No Preference")                     │
│   ↓                                                             │
│ JavaScript AJAX → WordPress REST API                            │
│   ↓                                                             │
│ Query wp_bookings_staff_services (staff qualified for service)  │
│   ↓                                                             │
│ Return staff list with names, photos (optional), pricing        │
│   ↓                                                             │
│ Store selected staff_id in PHP $_SESSION                        │
│  (or store "no_preference" flag)                                │
└─────────────────────────────────────────────────────────────────┘

STEP 3: DATE/TIME SELECTION
┌─────────────────────────────────────────────────────────────────┐
│ Customer browses calendar, clicks date                          │
│   ↓                                                             │
│ JavaScript AJAX → /wp-json/bookit/v1/availability              │
│   ↓                                                             │
│ Availability Algorithm:                                         │
│   1. Get staff working hours for selected date                  │
│   2. Get existing bookings for staff on date                    │
│   3. Calculate available time slots (15-min increments)         │
│   4. If "No Preference", aggregate availability across staff    │
│   5. Return available slots (e.g., ["09:00", "09:15", ...])     │
│   ↓                                                             │
│ Customer selects time slot                                      │
│   ↓                                                             │
│ Store booking_date + start_time in PHP $_SESSION                │
└─────────────────────────────────────────────────────────────────┘

STEP 4: CONTACT DETAILS & PAYMENT
┌─────────────────────────────────────────────────────────────────┐
│ Customer fills form (name, email, phone, special requests)      │
│   ↓                                                             │
│ Form submit → WordPress endpoint                                │
│   ↓                                                             │
│ Validation (required fields, email format, phone format)        │
│   ↓                                                             │
│ Store customer data in PHP $_SESSION                            │
│   ↓                                                             │
│ Create pending booking record (status = 'pending_payment')      │
│  • Check UNIQUE constraint (staff_id, date, start_time)         │
│  • If constraint violation → "Slot no longer available" error   │
│  • If success → booking_id generated                            │
│   ↓                                                             │
│ Create Stripe Checkout Session OR PayPal Order                  │
│  • Amount: deposit or full payment (per service config)         │
│  • Metadata: booking_id, customer_email, service_name           │
│  • Success URL: /booking-confirmation/?session_id={CHECKOUT}    │
│  • Cancel URL: /book/?step=4 (returns to payment step)          │
│   ↓                                                             │
│ Redirect customer to Stripe/PayPal hosted checkout page         │
└─────────────────────────────────────────────────────────────────┘

PAYMENT PROCESSING (ASYNC)
┌─────────────────────────────────────────────────────────────────┐
│ Customer completes payment on Stripe/PayPal                     │
│   ↓                                                             │
│ Payment gateway sends webhook to WordPress                      │
│  • Endpoint: /wp-json/bookit/v1/webhook/stripe (or paypal)     │
│   ↓                                                             │
│ Verify webhook signature (HMAC-SHA256)                          │
│   ↓                                                             │
│ Update booking status: 'pending_payment' → 'confirmed'          │
│   ↓                                                             │
│ Create payment record in wp_bookings_payments                   │
│  • Store: payment_id, last_4_digits, card_brand, amount         │
│  • NEVER store: full card number, CVV                           │
│   ↓                                                             │
│ Queue confirmation email (Action Scheduler)                     │
│  • Template: booking-confirmation.html                          │
│  • Variables: {customer_name}, {service_name}, {booking_date}   │
│  • Attachment: booking.ics (iCal file for manual calendar add)  │
│   ↓                                                             │
│ Queue Google Calendar sync (Action Scheduler)                   │
│  • Create calendar event for assigned staff member              │
│  • Non-blocking: booking succeeds even if calendar sync fails   │
│   ↓                                                             │
│ Clear PHP $_SESSION (booking data no longer needed)             │
└─────────────────────────────────────────────────────────────────┘

CONFIRMATION PAGE
┌─────────────────────────────────────────────────────────────────┐
│ Customer redirected to success page                             │
│   ↓                                                             │
│ Display confirmation message with booking details               │
│  • Service name, staff name, date, time, location               │
│  • "Check your email for confirmation and calendar invite"      │
│  • Optional: "Add to calendar" button (downloads .ics file)     │
│   ↓                                                             │
│ Include magic link for cancellation/rescheduling                │
│  • Format: /manage-booking/?token=abc123xyz...                  │
│  • Token: 32-byte cryptographically secure random string        │
│  • Expires: 7 days from booking date (or after booking date)    │
└─────────────────────────────────────────────────────────────────┘
```

## 2.3 External Integration Touchpoints

### 2.3.1 Stripe Integration Points
- **Outbound:** Create Checkout Session (when customer clicks "Pay with Card")
- **Inbound:** Webhook events (checkout.session.completed, payment_intent.succeeded)
- **Outbound:** Create Refund (when Business Owner cancels within refund window)
- **Authentication:** API keys (publishable key for client-side, secret key for server)
- **Error Handling:** Non-blocking (booking fails if Stripe completely down, otherwise queued)

### 2.3.2 PayPal Integration Points
- **Outbound:** Create Order (when customer clicks "Pay with PayPal")
- **Outbound:** Capture Order (after customer approves on PayPal site)
- **Inbound:** Webhook events (PAYMENT.CAPTURE.COMPLETED)
- **Outbound:** Issue Refund (when Business Owner cancels within refund window)
- **Authentication:** OAuth 2.0 client credentials flow
- **Error Handling:** Non-blocking (fallback to Stripe if PayPal down)

### 2.3.3 Google Calendar Integration Points
- **Outbound:** Create Event (after booking confirmed)
- **Outbound:** Update Event (when booking rescheduled)
- **Outbound:** Delete Event (when booking cancelled)
- **Authentication:** OAuth 2.0 per-staff (each staff authorizes individually)
- **Error Handling:** **Completely non-blocking** (booking succeeds even if calendar API down)

### 2.3.4 Email Service Integration Points
- **Outbound:** Send Email via API (SendGrid, Mailgun, or AWS SES)
- **Inbound:** Webhook events (delivered, bounced, spam_report)
- **Authentication:** API keys (stored encrypted in wp_options table)
- **Error Handling:** Queued with 3 retry attempts (Action Scheduler)

## 2.4 Deployment Architecture

### Single-Server WordPress Installation (Standard Hosting)

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT'S WEB SERVER                          │
│                  (Shared or VPS Hosting)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  HTTPS (TLS 1.2+) - REQUIRED                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WEB SERVER (Apache / Nginx)                               │ │
│  │   • Handles HTTPS/SSL termination                          │ │
│  │   • Routes requests to WordPress                           │ │
│  │   • Serves static assets (CSS, JS, images)                 │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PHP 8.0+ (FastCGI / FPM)                                  │ │
│  │   • Executes WordPress core                                │ │
│  │   • Executes booking plugin code                           │ │
│  │   • Manages PHP $_SESSION storage                          │ │
│  │   • Handles REST API requests                              │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WORDPRESS INSTALLATION                                    │ │
│  │   /public_html/                                            │ │
│  │    ├── wp-content/                                         │ │
│  │    │    ├── plugins/                                       │ │
│  │    │    │    └── bookit-booking-system/   ← PLUGIN CODE HERE     │ │
│  │    │    ├── themes/                                        │ │
│  │    │    └── uploads/                                       │ │
│  │    │         └── bookings/         ← LOG FILES HERE       │ │
│  │    ├── wp-config.php               ← API KEYS STORED HERE │ │
│  │    └── dashboard/                  ← VUE APP BUILD FILES  │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MySQL 5.7+ / MariaDB 10.3+                                │ │
│  │   • WordPress core tables (wp_*)                           │ │
│  │   • Booking plugin tables (wp_bookings_*)                  │ │
│  │   • Daily automated backups                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Environment Variables (wp-config.php)

Critical configuration stored in `wp-config.php` (above web root for security):

```php
// Booking Plugin Configuration
define('BOOKIT_BOOKING_STRIPE_SECRET_KEY', 'sk_live_...');
define('BOOKIT_BOOKING_STRIPE_WEBHOOK_SECRET', 'whsec_...');
define('BOOKIT_BOOKING_PAYPAL_CLIENT_ID', 'AYSq3RDGsmBl...');
define('BOOKIT_BOOKING_PAYPAL_CLIENT_SECRET', 'EHKxd91m...');
define('BOOKIT_BOOKING_EMAIL_API_KEY', 'SG.ab12...');
define('BOOKIT_BOOKING_ENCRYPTION_KEY', 'base64:...');  // For encrypting OAuth tokens
define('BOOKIT_BOOKING_JWT_SECRET', 'random-256-bit-key');  // If using JWT for dashboard auth
```

**Security Note:** These values NEVER stored in database. Retrieved at runtime only.

---

# 3. UNIQUE DIFFERENTIATOR: SEPARATE BUSINESS DASHBOARD

## 3.1 The Market Gap This Fills

**Problem:** Every competitor has a fatal flaw for non-technical business owners:

**WordPress Plugins (Bookly, Amelia, WooCommerce Bookings):**
- Require WordPress admin access (security risk - staff can break website)
- Complex WordPress interface overwhelms non-technical users
- "Employee panels" via shortcodes are still WordPress-dependent
- Learning curve: 2-4 hours for basic competency

**SaaS Platforms (Fresha, Calendly, Acuity):**
- Excellent dashboards BUT:
  - Monthly subscription fees forever (£20-100/month)
  - Marketplace commissions on payments (Fresha: 10%)
  - Vendor lock-in - can't export and self-host
  - Generic branding, limited customization

**Our Solution:** Professional, separate dashboard with **zero WordPress knowledge required** AND complete data ownership with no ongoing platform fees.

## 3.2 Architecture Approach: Hybrid Model

After evaluating three approaches, we're implementing a **hybrid architecture**:

### Option A: Fully Separate React/Vue App (REJECTED)
**Description:** Completely independent SPA hosted on separate subdomain with its own authentication  
**Pros:** Complete separation, could work with non-WordPress backends  
**Cons:** Duplicate authentication system, complex CORS configuration, harder to share WordPress utilities  
**Verdict:** ❌ Over-engineered for Phase 1

### Option B: WordPress Admin Customization (REJECTED)
**Description:** Heavily customize WordPress admin with custom menu pages and CSS overrides  
**Pros:** Uses existing WordPress auth, simpler deployment  
**Cons:** Still requires WordPress admin access (defeats purpose), hard to fully white-label  
**Verdict:** ❌ Doesn't solve the core problem

### Option C: Hybrid - Vue SPA + WordPress REST API (SELECTED ✅)
**Description:** Vue 3 SPA served from WordPress but communicates via REST API, separate authentication  
**Pros:** 
- Complete visual separation from WordPress admin
- Can use WordPress utilities (nonces, authentication hooks) without exposing admin
- Simpler deployment (same server, single domain)
- Easy to white-label (just CSS/logo/config changes)
- Future mobile app can use same REST API

**Cons:** 
- Two authentication systems to maintain (mitigated by using WordPress hooks)
- Slightly more complex than pure WordPress admin approach

**Verdict:** ✅ **Best balance of separation and practicality**

## 3.3 URL Structure Decision

### Option 1: Subdirectory (RECOMMENDED ✅)
**URL:** `https://clientdomain.com/dashboard/`  
**Implementation:** Rewrite rule in .htaccess routes `/dashboard/` to Vue app's index.html  
**Pros:**
- Same domain = no CORS issues
- Single SSL certificate
- Easier to set up (no DNS configuration)
- SEO-friendly (if dashboard has public-facing booking status pages)

**Cons:**
- Potential URL conflicts with WordPress pages/posts named "dashboard"
- Slightly less "premium" feel than custom subdomain

### Option 2: Subdomain
**URL:** `https://bookings.clientdomain.com/` or `https://dashboard.clientdomain.com/`  
**Implementation:** DNS A record points to same server, VirtualHost configuration serves Vue app  
**Pros:**
- Complete URL separation (more "premium" feel)
- Zero risk of WordPress URL conflicts
- Can move to separate server later without URL changes

**Cons:**
- Requires DNS configuration (adds complexity to deployment)
- Need wildcard SSL or separate SSL cert
- CORS configuration required for API calls

### Decision: **Subdirectory for Phase 1, Subdomain Option for Premium Tier**

**Rationale:**
- Faster deployment (no DNS setup during website launch)
- Simpler SSL certificate management
- Can offer custom subdomain as premium upsell
- Technically trivial to migrate from subdirectory to subdomain later (just deployment config change)

**Implementation:**
```apache
# .htaccess in WordPress root
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^dashboard/(.*)$ /wp-content/plugins/bookit-booking-system/dashboard/$1 [L]
RewriteRule ^dashboard$ /wp-content/plugins/bookit-booking-system/dashboard/index.html [L]
</IfModule>
```

## 3.4 Authentication Strategy

### Problem Statement
Dashboard users (Business Owners and Staff) need authentication that is:
1. Separate from WordPress admin (can't give WP admin access)
2. Integrated with WordPress (can leverage WP user table for single sign-on)
3. Secure (session hijacking prevention, CSRF protection)
4. Simple (staff can remember one login, not multiple)

### Evaluated Approaches

#### Approach A: Completely Separate User Table (REJECTED)
**Description:** New database table `wp_bookit_dashboard_users` with separate bcrypt passwords  
**Pros:** Complete separation, no WordPress dependencies  
**Cons:** Duplicate user management, no SSO with WordPress, more code to maintain  
**Verdict:** ❌ Unnecessary duplication

#### Approach B: WordPress Users with Custom Role (REJECTED)
**Description:** Use `wp_users` table, create `bookit_admin` and `bookit_staff` roles  
**Pros:** Leverages WordPress auth system, single user database  
**Cons:** Users technically CAN access /wp-admin (even if empty), not true "separation"  
**Verdict:** ❌ Defeats the purpose of separate dashboard

#### Approach C: Hybrid - WordPress Users + Dashboard-Only Flag (SELECTED ✅)
**Description:** Use `wp_users` table but add `bookit_dashboard_only=1` flag in `wp_usermeta`. Dashboard login endpoint validates this flag and NEVER creates WordPress admin session.

**How It Works:**
1. Business Owner/Staff user created in `wp_users` table
2. User meta: `bookit_dashboard_only = 1` (prevents WordPress admin access)
3. Custom role: `bookit_admin` (Business Owner) or `bookit_staff` (Staff)
4. Dashboard login endpoint (`/wp-json/bookit/v1/auth/login`):
   - Validates username/password using `wp_authenticate()`
   - Checks `bookit_dashboard_only` flag
   - If flag = 1, creates dashboard session (JWT or PHP session)
   - If user tries to access /wp-admin, WordPress hook redirects to dashboard

**Pros:**
- Single user database (easier management for site admin)
- Leverages WordPress password hashing (bcrypt, well-tested)
- Dashboard users CANNOT access WordPress admin (enforced by hook)
- Can add password reset via WordPress functions
- Future: Can remove `bookit_dashboard_only` flag to grant admin access if needed

**Cons:**
- Slightly more complex than pure separate system
- Need to maintain hook to prevent admin access

**Verdict:** ✅ **Best of both worlds - separation with shared infrastructure**

### Session Management: PHP Session vs JWT

#### Option 1: PHP $_SESSION (RECOMMENDED ✅)
**Implementation:**
```php
// After successful login
session_start();
$_SESSION['bookit_dashboard_user_id'] = $user_id;
$_SESSION['bookit_dashboard_role'] = 'bookit_admin'; // or 'bookit_staff'
$_SESSION['session_token'] = wp_generate_password(32, false); // CSRF token
```

**Pros:**
- Server-side storage (more secure - can't be tampered with)
- Easy to implement in PHP
- Automatic expiration via `session.gc_maxlifetime`
- Can invalidate session server-side immediately
- No client-side token management

**Cons:**
- Requires server memory (small cost)
- Horizontal scaling requires sticky sessions or shared session store (not concern for Phase 1)

#### Option 2: JWT (JSON Web Tokens)
**Implementation:**
```javascript
// After successful login, server returns:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2026-01-24T12:00:00Z"
}
// Client stores in localStorage, sends in Authorization header
```

**Pros:**
- Stateless (no server-side storage required)
- Easy to scale horizontally
- Works well with Vue/React (client-side token management)
- Can include permissions in token payload

**Cons:**
- Can't invalidate tokens server-side (must wait for expiration)
- Client-side storage (localStorage vulnerable to XSS if not careful)
- Requires JWT library (more dependencies)
- Slightly more complex implementation

### Decision: **PHP $_SESSION for Phase 1, JWT for Phase 2 Mobile App**

**Rationale:**
- Phase 1 targets are small businesses (1-10 staff) on single server → PHP session is simpler and sufficient
- PHP session more secure by default (server-side, can't be tampered with)
- Vue 3 SPA can work with session-based auth via credentials: 'include' in fetch requests
- JWT adds unnecessary complexity for Phase 1
- Phase 2: When adding mobile app, add JWT endpoint alongside session auth (backwards compatible)

### Session Security Implementation

```php
// Session configuration in plugin activation
function bookit_configure_session() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);      // Prevent JavaScript access
        ini_set('session.cookie_secure', 1);        // HTTPS only (required)
        ini_set('session.cookie_samesite', 'Lax');  // CSRF protection
        ini_set('session.gc_maxlifetime', 28800);   // 8 hours
        ini_set('session.cookie_lifetime', 28800);  // 8 hours
        session_name('bookit_dashboard_session');  // Custom session name
        session_start();
    }
}
```

**Security Features:**
- `HttpOnly` flag prevents XSS attacks from stealing session ID
- `Secure` flag ensures cookies only sent over HTTPS
- `SameSite=Lax` prevents CSRF attacks
- 8-hour timeout with 2-minute warning (NFR-2.3)
- Session ID regenerated on login (`session_regenerate_id()`)
- Rate limiting: 5 failed logins per 15 minutes per IP

## 3.5 Dashboard ↔ WordPress Communication

### REST API Endpoints

All dashboard-to-WordPress communication uses custom REST API endpoints in the `bookit/v1` namespace:

**Authentication Endpoints:**
- `POST /wp-json/bookit/v1/auth/login` - Dashboard login
- `POST /wp-json/bookit/v1/auth/logout` - Dashboard logout
- `GET /wp-json/bookit/v1/auth/me` - Get current user info

**Booking Endpoints:**
- `GET /wp-json/bookit/v1/bookings` - List bookings (with filters)
- `GET /wp-json/bookit/v1/bookings/{id}` - Get single booking
- `POST /wp-json/bookit/v1/bookings` - Create booking (manual)
- `PATCH /wp-json/bookit/v1/bookings/{id}` - Update booking
- `DELETE /wp-json/bookit/v1/bookings/{id}` - Cancel booking
- `POST /wp-json/bookit/v1/bookings/{id}/complete` - Mark completed
- `POST /wp-json/bookit/v1/bookings/{id}/no-show` - Mark no-show

**Staff Endpoints:**
- `GET /wp-json/bookit/v1/staff` - List all staff
- `POST /wp-json/bookit/v1/staff` - Create staff member
- `PATCH /wp-json/bookit/v1/staff/{id}` - Update staff
- `DELETE /wp-json/bookit/v1/staff/{id}` - Delete staff

**Service Endpoints:**
- `GET /wp-json/bookit/v1/services` - List all services
- `POST /wp-json/bookit/v1/services` - Create service
- `PATCH /wp-json/bookit/v1/services/{id}` - Update service
- `DELETE /wp-json/bookit/v1/services/{id}` - Delete service

**Customer Endpoints:**
- `GET /wp-json/bookit/v1/customers` - List customers (with search)
- `GET /wp-json/bookit/v1/customers/{id}` - Get customer details
- `GET /wp-json/bookit/v1/customers/export` - CSV export

**Reports Endpoints:**
- `GET /wp-json/bookit/v1/reports/revenue` - Revenue report (date range)
- `GET /wp-json/bookit/v1/reports/staff-performance` - Staff metrics

**Settings Endpoints:**
- `GET /wp-json/bookit/v1/settings` - Get all settings
- `PATCH /wp-json/bookit/v1/settings` - Update settings

### Permission Checks

Every REST API endpoint checks:
1. **Authentication:** Valid session exists (`$_SESSION['bookit_dashboard_user_id']` set)
2. **Authorization:** User has required role
   - `bookit_admin` = Business Owner (full access)
   - `bookit_staff` = Staff (limited to own bookings)
3. **Nonce Verification:** WordPress nonce included in request headers
4. **Rate Limiting:** Max 100 requests per minute per user

```php
// Example permission check in REST endpoint
function check_dashboard_permission($request) {
    session_start();
    
    // Check authentication
    if (!isset($_SESSION['bookit_dashboard_user_id'])) {
        return new WP_Error('unauthorized', 'Not logged in', ['status' => 401]);
    }
    
    // Check nonce (CSRF protection)
    $nonce = $request->get_header('X-WP-Nonce');
    if (!wp_verify_nonce($nonce, 'bookit_dashboard')) {
        return new WP_Error('invalid_nonce', 'Invalid security token', ['status' => 403]);
    }
    
    // Check authorization
    $user_id = $_SESSION['bookit_dashboard_user_id'];
    $user = get_userdata($user_id);
    if (!in_array('bookit_admin', $user->roles) && !in_array('bookit_staff', $user->roles)) {
        return new WP_Error('forbidden', 'Insufficient permissions', ['status' => 403]);
    }
    
    // Rate limiting check
    if (is_rate_limited($user_id)) {
        return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
    }
    
    return true;
}
```

## 3.6 Dashboard Technology Stack

### Frontend Framework: Vue 3 (Composition API)

**Decision Rationale:**
- **vs React:** Vue has smaller bundle size (40% smaller for equivalent app), simpler state management (no Redux/Context complexity), better documentation for admin interfaces
- **vs Angular:** Vue is lighter weight, faster to develop, more appropriate for plugin size
- **vs Vanilla JS:** Dashboard complexity warrants framework (routing, state management, reactive components)

**Build Configuration:**
- **Vite** for build tool (faster than Webpack, better DX)
- **Vue Router** for client-side routing (/dashboard/bookings, /dashboard/staff)
- **Pinia** for state management (replacing Vuex)
- **Axios** for HTTP requests
- **Day.js** for date formatting (lighter than Moment.js)
- **Chart.js** for revenue graphs and analytics visualizations

**Build Output:**
```
/wp-content/plugins/bookit-booking-system/dashboard/
├── index.html                  # Entry point
├── assets/
│   ├── index.js                # Main JS bundle
│   ├── vendor.js               # Third-party libraries (code-split)
│   └── style.css               # Compiled CSS
└── img/
    └── logo.svg                # Dashboard logo (white-label)
```

### Styling: Tailwind CSS

**Rationale:**
- Utility-first approach speeds up development
- Excellent component library compatibility (Headless UI)
- Easy to white-label (just override color palette)
- Tree-shaking removes unused CSS (small bundle size)
- No need for custom CSS framework

**White-Label Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Configurable per installation
        primary: process.env.VUE_APP_PRIMARY_COLOR || '#3B82F6',
        secondary: process.env.VUE_APP_SECONDARY_COLOR || '#10B981',
      },
    },
  },
};
```

## 3.7 White-Label Capability

### Configuration Options

**Three branding modes:**

**1. Default Mode (Standard Websites)**
- Developer's company branding throughout dashboard
- Logo: Developer's logo
- Color scheme: Developer's brand colors
- Footer: "Powered by [Developer Company]"
- Email templates: Developer's branding

**2. Co-Branded Mode**
- Client's logo in header
- Client's primary color as accent color
- Footer: "Powered by [Developer Company]"
- Email templates: Client's logo + developer attribution

**3. White-Label Mode (Premium Tier)**
- Client's logo and branding throughout
- Client's color scheme
- Custom subdomain: `bookings.clientdomain.com`
- Zero developer attribution (except code comment)
- Email templates: 100% client branding

### Implementation

**Configuration stored in `wp_bookings_settings` table:**
```sql
INSERT INTO wp_bookings_settings (setting_key, setting_value) VALUES
('branding_mode', 'white_label'),  -- 'default', 'co_branded', or 'white_label'
('branding_logo_url', 'https://client.com/logo.png'),
('branding_primary_color', '#FF5733'),
('branding_secondary_color', '#C70039'),
('branding_business_name', 'Jane Doe Salon'),
('branding_support_email', 'hello@janedoesalon.com'),
('branding_custom_domain', 'bookings.janedoesalon.com');  -- NULL if using subdirectory
```

**Vue app reads configuration:**
```javascript
// src/config.js
export default {
  async loadBranding() {
    const response = await axios.get('/wp-json/bookit/v1/settings/branding');
    return {
      logo: response.data.branding_logo_url,
      primaryColor: response.data.branding_primary_color,
      businessName: response.data.branding_business_name,
      mode: response.data.branding_mode,
    };
  },
};
```

**CSS variables dynamically injected:**
```javascript
// src/main.js
const branding = await loadBranding();
document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
```

## 3.8 Success Criteria for Dashboard

The separate dashboard is successful if:

1. ✅ **Business Owner masters basic functions in <30 minutes** (NFR-6.2)
   - Create manual booking
   - View today's schedule
   - Add new staff member
   - Configure service pricing

2. ✅ **Zero WordPress admin access required** for daily operations
   - Staff NEVER see WordPress admin interface
   - All booking management done in dashboard
   - No "accidental website breaking" support tickets

3. ✅ **Staff can use on mobile devices** (NFR-4.21, NFR-4.22, NFR-4.23)
   - Responsive design works on phones/tablets
   - Touch targets ≥44×44px
   - Can check schedule on-the-go

4. ✅ **White-label configuration takes <10 minutes**
   - Logo upload via Settings page
   - Color picker for primary/secondary colors
   - Business name and support email fields
   - Changes reflected immediately (no rebuild required)

5. ✅ **Dashboard loads in <1.5 seconds** on broadband (NFR-1.8)
   - Initial bundle size <250KB (gzipped)
   - Code-splitting for vendor libraries
   - Lazy-load calendar view

---

# 4. WORDPRESS PLUGIN ARCHITECTURE

## 4.1 Plugin Directory Structure

Following WordPress Coding Standards and modern PHP best practices:

```
/wp-content/plugins/bookit-booking-system/
├── bookit-booking-system.php                 # Main plugin file (header, activation/deactivation)
├── uninstall.php                      # Cleanup on plugin deletion
├── composer.json                      # PHP dependencies (Stripe SDK, Google API, etc.)
├── composer.lock
├── vendor/                            # Composer dependencies (gitignored)
│   ├── stripe/
│   ├── google/
│   └── autoload.php
│
├── includes/                          # Core PHP classes (autoloaded)
│   ├── class-plugin.php               # Main plugin class (singleton)
│   ├── class-activator.php            # Plugin activation logic
│   ├── class-deactivator.php          # Plugin deactivation logic
│   ├── class-loader.php               # Hooks and filters registry
│   │
│   ├── models/                        # Database models (Active Record pattern)
│   │   ├── class-booking.php          # Booking model
│   │   ├── class-service.php          # Service model
│   │   ├── class-staff.php            # Staff model
│   │   ├── class-customer.php         # Customer model
│   │   ├── class-payment.php          # Payment model
│   │   ├── class-category.php         # Category model
│   │   └── class-settings.php         # Settings model
│   │
│   ├── controllers/                   # Business logic controllers
│   │   ├── class-booking-controller.php
│   │   ├── class-availability-controller.php
│   │   ├── class-payment-controller.php
│   │   └── class-email-controller.php
│   │
│   ├── api/                           # REST API endpoints
│   │   ├── class-rest-controller.php  # Base REST controller
│   │   ├── class-bookings-api.php     # Booking endpoints
│   │   ├── class-staff-api.php        # Staff endpoints
│   │   ├── class-services-api.php     # Services endpoints
│   │   ├── class-customers-api.php    # Customers endpoints
│   │   ├── class-reports-api.php      # Reports endpoints
│   │   ├── class-auth-api.php         # Dashboard authentication
│   │   └── class-webhooks-api.php     # Payment gateway webhooks
│   │
│   ├── integrations/                  # External service integrations
│   │   ├── class-stripe-gateway.php   # Stripe integration
│   │   ├── class-paypal-gateway.php   # PayPal integration
│   │   ├── class-google-calendar.php  # Google Calendar sync
│   │   ├── class-email-service.php    # Transactional email (SendGrid/Mailgun)
│   │   └── class-sms-service.php      # SMS (Phase 2 - Twilio)
│   │
│   ├── security/                      # Security utilities
│   │   ├── class-encryption.php       # AES-256-GCM encryption
│   │   ├── class-rate-limiter.php     # Rate limiting
│   │   ├── class-csrf.php             # CSRF token management
│   │   └── class-input-validator.php  # Input validation
│   │
│   └── utils/                         # Helper utilities
│       ├── class-date-time.php        # Date/time helpers (timezone handling)
│       ├── class-logger.php           # Error logging
│       ├── class-email-template.php   # Email template engine
│       └── class-currency.php         # GBP formatting
│
├── admin/                             # WordPress admin pages (WP Admin users only)
│   ├── class-admin.php                # Admin menu registration
│   ├── class-settings-page.php        # Settings page controller
│   ├── views/                         # Admin page templates
│   │   ├── settings-general.php
│   │   ├── settings-payment.php
│   │   ├── settings-email.php
│   │   └── settings-calendar.php
│   └── assets/
│       ├── css/
│       │   └── admin-styles.css
│       └── js/
│           └── admin-scripts.js
│
├── public/                            # Customer-facing booking page
│   ├── class-public.php               # Public-facing functionality
│   ├── class-shortcodes.php           # [booking_form] shortcode
│   ├── templates/                     # Booking flow templates
│   │   ├── booking-step-1-services.php
│   │   ├── booking-step-2-staff.php
│   │   ├── booking-step-3-datetime.php
│   │   ├── booking-step-4-checkout.php
│   │   ├── booking-confirmation.php
│   │   └── manage-booking.php         # Magic link page (cancel/reschedule)
│   └── assets/
│       ├── css/
│       │   └── booking-styles.css
│       └── js/
│           ├── booking-wizard.js      # Step navigation
│           ├── availability-checker.js # Real-time availability AJAX
│           └── datetime-picker.js     # Flatpickr integration
│
├── dashboard/                         # Vue 3 SPA (built files)
│   ├── index.html                     # Dashboard entry point
│   ├── assets/
│   │   ├── index.js                   # Main bundle
│   │   ├── vendor.js                  # Third-party libraries
│   │   └── style.css
│   └── img/
│       └── logo.svg
│
├── database/                          # Database schema and migrations
│   ├── schema.sql                     # Initial schema (10 tables)
│   ├── migrations/                    # Version migrations
│   │   ├── 1.0.0-initial.php
│   │   └── 1.1.0-add-categories.php
│   └── seeds/                         # Development test data
│       └── demo-data.sql
│
├── tests/                             # PHPUnit tests
│   ├── bootstrap.php                  # Test bootstrap
│   ├── unit/                          # Unit tests
│   │   ├── test-booking-model.php
│   │   ├── test-availability.php
│   │   └── test-encryption.php
│   └── integration/                   # Integration tests
│       ├── test-stripe-webhook.php
│       ├── test-email-delivery.php
│       └── test-calendar-sync.php
│
├── logs/                              # Error and debug logs (gitignored)
│   └── .gitkeep
│
├── languages/                         # Internationalization (Phase 2)
│   ├── bookit-booking-system.pot
│   └── bookit-booking-system-en_GB.po
│
├── assets/                            # Shared assets
│   └── images/
│       ├── placeholder-staff.png
│       └── email-header.png
│
├── .gitignore
├── .editorconfig
├── phpcs.xml                          # WordPress Coding Standards config
├── phpunit.xml                        # PHPUnit configuration
└── README.md                          # Developer documentation
```

## 4.2 Main Plugin File Structure

**`bookit-booking-system.php`** (following WordPress plugin header standards):

```php
<?php
/**
 * Plugin Name: Professional Booking System
 * Plugin URI: https://yourcompany.com/bookit-booking-system
 * Description: Complete booking solution with separate business dashboard for UK service businesses
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: Your Company Name
 * Author URI: https://yourcompany.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bookit-booking-system
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('BOOKIT_VERSION', '1.0.0');
define('BOOKIT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BOOKIT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BOOKIT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Composer autoload
require_once BOOKIT_PLUGIN_DIR . 'vendor/autoload.php';

// Plugin activation hook
register_activation_hook(__FILE__, ['bookit_activate', 'activate']);

// Plugin deactivation hook
register_deactivation_hook(__FILE__, ['bookit_deactivate', 'deactivate']);

// Initialize plugin
function bookit_run() {
    $plugin = new Bookit_Loader();
    $plugin->run();
}
bookit_run();
```

## 4.3 MVC Pattern and Separation of Concerns

### Models (Database Layer)
**Responsibility:** Database operations, data validation, business rules  
**Example:** `includes/models/class-booking.php`

```php
class BOOKIT_Model {
    private $table_name;
    private $wpdb;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $wpdb->prefix . 'bookings';
    }
    
    /**
     * Create a new booking with race condition protection
     * @return int|WP_Error Booking ID on success, WP_Error on failure
     */
    public function create($data) {
        // Validate required fields
        $required = ['customer_id', 'staff_id', 'service_id', 'booking_date', 'start_time'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return new WP_Error('missing_field', "Required field missing: {$field}");
            }
        }
        
        // CRITICAL: Use database transaction for atomicity
        $this->wpdb->query('START TRANSACTION');
        
        try {
            // Insert booking
            $inserted = $this->wpdb->insert(
                $this->table_name,
                $data,
                ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s']
            );
            
            if ($inserted === false) {
                // Check if UNIQUE constraint violation (double-booking)
                if ($this->wpdb->last_error && strpos($this->wpdb->last_error, 'Duplicate entry') !== false) {
                    $this->wpdb->query('ROLLBACK');
                    return new WP_Error('slot_unavailable', 'This time slot is no longer available');
                }
                
                $this->wpdb->query('ROLLBACK');
                return new WP_Error('insert_failed', 'Failed to create booking');
            }
            
            $booking_id = $this->wpdb->insert_id;
            
            // Commit transaction
            $this->wpdb->query('COMMIT');
            
            return $booking_id;
            
        } catch (Exception $e) {
            $this->wpdb->query('ROLLBACK');
            return new WP_Error('exception', $e->getMessage());
        }
    }
    
    /**
     * Get booking by ID with related data
     */
    public function get($booking_id) {
        $sql = $this->wpdb->prepare("
            SELECT 
                b.*,
                s.name AS service_name,
                s.duration AS service_duration,
                st.first_name AS staff_first_name,
                st.last_name AS staff_last_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM {$this->table_name} b
            INNER JOIN {$this->wpdb->prefix}bookings_services s ON b.service_id = s.id
            INNER JOIN {$this->wpdb->prefix}bookings_staff st ON b.staff_id = st.id
            INNER JOIN {$this->wpdb->prefix}bookings_customers c ON b.customer_id = c.id
            WHERE b.id = %d
        ", $booking_id);
        
        return $this->wpdb->get_row($sql, ARRAY_A);
    }
    
    // Additional methods: update(), delete(), list(), search(), etc.
}
```

### Controllers (Business Logic Layer)
**Responsibility:** Coordinate models, process requests, apply business rules  
**Example:** `includes/controllers/class-availability-controller.php`

```php
class Availability_Controller {
    
    /**
     * Calculate available time slots for given service, staff, and date
     * 
     * Algorithm:
     * 1. Get staff working hours for date
     * 2. Get existing bookings for staff on date
     * 3. Generate time slots (15-minute increments)
     * 4. Remove booked slots
     * 5. Remove slots too close to current time (30-minute buffer)
     * 
     * @param int $service_id Service ID
     * @param int|string $staff_id Staff ID or 'no_preference'
     * @param string $date Date in Y-m-d format
     * @return array Available time slots ['09:00', '09:15', ...]
     */
    public function get_available_slots($service_id, $staff_id, $date) {
        // Get service duration
        $service = new Service_Model();
        $service_data = $service->get($service_id);
        $duration = $service_data['duration']; // minutes
        $buffer = $service_data['buffer_before'] ?? 0; // minutes
        
        // Handle "No Preference" - get all qualified staff
        if ($staff_id === 'no_preference') {
            $staff_service = new Staff_Service_Model();
            $qualified_staff = $staff_service->get_staff_for_service($service_id);
            
            // Aggregate availability across all staff
            $all_slots = [];
            foreach ($qualified_staff as $staff) {
                $staff_slots = $this->get_staff_availability($staff['id'], $date, $duration, $buffer);
                $all_slots = array_merge($all_slots, $staff_slots);
            }
            
            // Remove duplicates and sort
            $all_slots = array_unique($all_slots);
            sort($all_slots);
            
            return $all_slots;
        }
        
        // Single staff availability
        return $this->get_staff_availability($staff_id, $date, $duration, $buffer);
    }
    
    private function get_staff_availability($staff_id, $date, $duration, $buffer) {
        // Get working hours for date
        $working_hours = new Working_Hours_Model();
        $hours = $working_hours->get_for_staff_and_date($staff_id, $date);
        
        if (empty($hours)) {
            return []; // Staff not working this day
        }
        
        // Check for exceptions (vacation, sick leave)
        if ($hours['is_exception'] && !$hours['is_working']) {
            return []; // Staff has day off
        }
        
        // Get existing bookings
        $booking = new BOOKIT_Model();
        $existing_bookings = $booking->get_by_staff_and_date($staff_id, $date);
        
        // Generate all possible time slots
        $start_time = $hours['start_time']; // e.g., "09:00"
        $end_time = $hours['end_time'];     // e.g., "17:00"
        
        $all_slots = $this->generate_time_slots($start_time, $end_time, $duration);
        
        // Remove booked slots
        $available_slots = $this->remove_booked_slots($all_slots, $existing_bookings, $duration, $buffer);
        
        // Remove past slots (if date is today)
        if ($date === date('Y-m-d')) {
            $available_slots = $this->remove_past_slots($available_slots);
        }
        
        return $available_slots;
    }
    
    private function generate_time_slots($start, $end, $duration) {
        $slots = [];
        $current = strtotime($start);
        $end_timestamp = strtotime($end);
        
        while ($current + ($duration * 60) <= $end_timestamp) {
            $slots[] = date('H:i', $current);
            $current += (15 * 60); // 15-minute increments
        }
        
        return $slots;
    }
    
    // Additional private methods: remove_booked_slots(), remove_past_slots(), etc.
}
```

### Views (Presentation Layer)
**Responsibility:** Display data, collect user input  
**Example:** `public/templates/booking-step-3-datetime.php`

```php
<?php
// Template for Step 3: Date/Time Selection
// Data passed via $args array

$service_id = $args['service_id'];
$staff_id = $args['staff_id'];
$staff_name = $args['staff_name'];
?>

<div class="booking-step booking-step-3">
    <h2><?php esc_html_e('Select Date & Time', 'bookit-booking-system'); ?></h2>
    
    <div class="booking-summary">
        <p><?php echo esc_html(sprintf(__('Booking %s with %s', 'bookit-booking-system'), $args['service_name'], $staff_name)); ?></p>
    </div>
    
    <div class="datetime-picker-container">
        <div class="date-calendar">
            <input 
                type="text" 
                id="booking-date" 
                class="datepicker" 
                data-service-id="<?php echo esc_attr($service_id); ?>"
                data-staff-id="<?php echo esc_attr($staff_id); ?>"
                placeholder="<?php esc_attr_e('Select a date', 'bookit-booking-system'); ?>"
                readonly
            />
        </div>
        
        <div class="time-slots-container" style="display:none;">
            <h3><?php esc_html_e('Available Times', 'bookit-booking-system'); ?></h3>
            <div id="time-slots-list" class="time-slots-grid">
                <!-- Populated via AJAX based on selected date -->
            </div>
        </div>
    </div>
    
    <div class="booking-navigation">
        <button type="button" class="button-secondary" id="back-to-step-2">
            <?php esc_html_e('← Back to Staff Selection', 'bookit-booking-system'); ?>
        </button>
        <button type="button" class="button-primary" id="continue-to-step-4" disabled>
            <?php esc_html_e('Continue to Payment →', 'bookit-booking-system'); ?>
        </button>
    </div>
</div>
```

### REST API (Controllers for Dashboard Communication)
**Responsibility:** Handle HTTP requests, validate input, return JSON responses  
**Example:** `includes/api/class-bookings-api.php`

```php
class Bookings_REST_API extends WP_REST_Controller {
    
    public function register_routes() {
        register_rest_route('bookit/v1', '/bookings', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_bookings'],
                'permission_callback' => [$this, 'check_bookit_dashboard_permission'],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_booking'],
                'permission_callback' => [$this, 'check_bookit_dashboard_admin_permission'],
            ],
        ]);
        
        register_rest_route('bookit/v1', '/bookings/(?P<id>\d+)', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_booking'],
                'permission_callback' => [$this, 'check_bookit_dashboard_permission'],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'cancel_booking'],
                'permission_callback' => [$this, 'check_bookit_dashboard_admin_permission'],
            ],
        ]);
    }
    
    public function get_bookings($request) {
        // Extract query parameters
        $filters = [
            'date_from' => $request->get_param('date_from'),
            'date_to' => $request->get_param('date_to'),
            'staff_id' => $request->get_param('staff_id'),
            'status' => $request->get_param('status'),
            'page' => $request->get_param('page') ?? 1,
            'per_page' => $request->get_param('per_page') ?? 50,
        ];
        
        // Get bookings from model
        $booking_model = new BOOKIT_Model();
        $bookings = $booking_model->list($filters);
        $total = $booking_model->count($filters);
        
        // Return response with pagination headers
        $response = new WP_REST_Response($bookings, 200);
        $response->header('X-Total-Count', $total);
        $response->header('X-Total-Pages', ceil($total / $filters['per_page']));
        
        return $response;
    }
    
    public function check_dashboard_permission($request) {
        session_start();
        
        // Check session authentication
        if (!isset($_SESSION['bookit_dashboard_user_id'])) {
            return new WP_Error('unauthorized', 'Not logged in', ['status' => 401]);
        }
        
        // Verify nonce (CSRF protection)
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'bookit_dashboard')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', ['status' => 403]);
        }
        
        // Check user has dashboard role
        $user_id = $_SESSION['bookit_dashboard_user_id'];
        $user = get_userdata($user_id);
        
        $allowed_roles = ['bookit_admin', 'bookit_staff'];
        if (!array_intersect($allowed_roles, $user->roles)) {
            return new WP_Error('forbidden', 'Insufficient permissions', ['status' => 403]);
        }
        
        // Staff can only see their own bookings
        if (in_array('bookit_staff', $user->roles) && !in_array('bookit_admin', $user->roles)) {
            $staff_id = get_user_meta($user_id, 'bookit_staff_id', true);
            if ($request->get_param('staff_id') && $request->get_param('staff_id') != $staff_id) {
                return new WP_Error('forbidden', 'Can only view own bookings', ['status' => 403]);
            }
        }
        
        return true;
    }
}
```

## 4.4 WordPress Hooks and Filters Strategy

### Custom Hooks (Action Hooks)

**Allow extensibility without modifying core code:**

```php
// After booking created
do_action('bookit_system_booking_created', $booking_id, $booking_data);

// After payment completed
do_action('bookit_system_payment_completed', $booking_id, $payment_data);

// Before booking cancelled
do_action('bookit_system_before_booking_cancelled', $booking_id);

// After email sent
do_action('bookit_system_email_sent', $email_type, $recipient, $success);

// Before availability calculation
do_action('bookit_system_before_availability_check', $staff_id, $date);
```

**Usage:** Developers (or future add-ons) can hook into these actions for custom functionality:

```php
// Example: Send SMS notification when booking created
add_action('bookit_system_booking_created', function($booking_id, $booking_data) {
    $sms_service = new SMS_Service();
    $sms_service->send_booking_confirmation($booking_data['customer_phone'], $booking_id);
}, 10, 2);
```

### Custom Filters

**Allow modification of data without changing core code:**

```php
// Modify available time slots before returning
$slots = apply_filters('bookit_system_available_slots', $slots, $staff_id, $date);

// Modify email template content
$email_content = apply_filters('bookit_system_email_content', $content, $email_type, $booking_id);

// Modify booking creation data before insert
$booking_data = apply_filters('bookit_system_before_booking_insert', $booking_data);

// Modify refund amount calculation
$refund_amount = apply_filters('bookit_system_refund_amount', $amount, $Bookit_id, $cancellation_time);
```

### Core WordPress Hooks Used

```php
// Plugin initialization
add_action('plugins_loaded', ['Bookit_System_Plugin', 'init']);

// Enqueue scripts and styles
add_action('wp_enqueue_scripts', ['Bookit_Public', 'enqueue_scripts']);
add_action('admin_enqueue_scripts', ['Bookit_Admin', 'enqueue_scripts']);

// Register REST API endpoints
add_action('rest_api_init', ['Bookings_REST_API', 'register_routes']);

// Scheduled tasks (WP-Cron)
add_action('bookit_system_send_reminders', ['Email_Controller', 'send_24h_reminders']);
add_action('bookit_system_health_check', ['System_Monitor', 'run_health_check']);

// Prevent dashboard users from accessing wp-admin
add_action('admin_init', function() {
    if (isset($_SESSION['bookit_dashboard_user_id'])) {
        $user = get_userdata($_SESSION['bookit_dashboard_user_id']);
        if (get_user_meta($user->ID, 'bookit_dashboard_only', true) === '1') {
            wp_redirect(site_url('/dashboard/'));
            exit;
        }
    }
});
```

## 4.5 Activation, Deactivation, and Uninstall

### Activation Hook (`includes/class-activator.php`)

```php
class Bookit_Activator {
    public static function activate() {
        // Check system requirements
        if (version_compare(PHP_VERSION, '8.0', '<')) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die('This plugin requires PHP 8.0 or higher.');
        }
        
        if (!extension_loaded('mysqli')) {
            wp_die('This plugin requires MySQLi extension.');
        }
        
        // Create database tables
        self::create_tables();
        
        // Create custom user roles
        self::create_roles();
        
        // Set default settings
        self::set_default_settings();
        
        // Schedule cron jobs
        if (!wp_next_scheduled('bookit_system_send_reminders')) {
            wp_schedule_event(time(), 'daily', 'bookit_system_send_reminders');
        }
        
        if (!wp_next_scheduled('bookit_system_health_check')) {
            wp_schedule_event(time(), 'daily', 'bookit_system_health_check');
        }
        
        // Create log directory
        $log_dir = WP_CONTENT_DIR . '/uploads/bookings/logs/';
        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
            file_put_contents($log_dir . '.htaccess', 'Deny from all');
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    private static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Read schema from database/schema.sql
        $schema = file_get_contents(BOOKIT_PLUGIN_DIR . 'database/schema.sql');
        
        // Execute schema
        dbDelta($schema);
    }
    
    private static function create_roles() {
        // Business Owner role (full dashboard access)
        add_role('bookit_admin', 'Booking Admin', [
            'read' => true,
            'bookit_manage_all' => true,
            'bookit_manage_staff' => true,
            'bookit_manage_services' => true,
            'bookit_view_reports' => true,
        ]);
        
        // Staff role (limited dashboard access)
        add_role('bookit_staff', 'Booking Staff', [
            'read' => true,
            'bookit_view_own' => true,
            'bookit_manage_availability' => true,
        ]);
    }
}
```

### Deactivation Hook (`includes/class-deactivator.php`)

```php
class Bookit_Deactivator {
    public static function deactivate() {
        // Clear scheduled cron jobs
        wp_clear_scheduled_hook('bookit_system_send_reminders');
        wp_clear_scheduled_hook('bookit_system_health_check');
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // NOTE: Do NOT delete database tables or user data on deactivation
        // Only delete on uninstall (see uninstall.php)
    }
}
```

### Uninstall (`uninstall.php`)

```php
// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete database tables
global $wpdb;
$tables = [
    $wpdb->prefix . 'bookings',
    $wpdb->prefix . 'bookings_services',
    $wpdb->prefix . 'bookings_categories',
    $wpdb->prefix . 'bookings_service_categories',
    $wpdb->prefix . 'bookings_staff',
    $wpdb->prefix . 'bookings_staff_services',
    $wpdb->prefix . 'bookings_customers',
    $wpdb->prefix . 'bookings_payments',
    $wpdb->prefix . 'bookings_working_hours',
    $wpdb->prefix . 'bookings_settings',
];

foreach ($tables as $table) {
    $wpdb->query("DROP TABLE IF EXISTS $table");
}

// Delete plugin options
$wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE 'bookit_%'");

// Delete custom user roles
remove_role('bookit_admin');
remove_role('bookit_staff');

// Delete all user meta for dashboard users
$wpdb->query("DELETE FROM $wpdb->usermeta WHERE meta_key LIKE 'booking_%'");

// Delete log files
$log_dir = WP_CONTENT_DIR . '/uploads/bookings/';
if (is_dir($log_dir)) {
    array_map('unlink', glob("$log_dir/*.*"));
    rmdir($log_dir);
}

// Delete transients
delete_transient('bookit_system_cache');
```

## 4.6 wp-config.php Configuration Requirements

The following constants must be added to `wp-config.php` during installation (documented in deployment guide):

```php
/**
 * Booking System Configuration
 * Add these lines before "That's all, stop editing!"
 */

// Stripe Configuration
define('BOOKIT_STRIPE_PUBLISHABLE_KEY', 'pk_live_...');  // Or pk_test_... for testing
define('BOOKIT_STRIPE_SECRET_KEY', 'sk_live_...');      // Or sk_test_...
define('BOOKIT_STRIPE_WEBHOOK_SECRET', 'whsec_...');

// PayPal Configuration
define('BOOKIT_PAYPAL_CLIENT_ID', 'AYSq3RDGsmBl...');
define('BOOKIT_PAYPAL_CLIENT_SECRET', 'EHKxd91m...');
define('BOOKIT_PAYPAL_MODE', 'live');  // Or 'sandbox' for testing

// Email Service Configuration (Choose ONE)
// Option A: SendGrid
define('BOOKIT_EMAIL_PROVIDER', 'sendgrid');
define('BOOKIT_SENDGRID_API_KEY', 'SG.ab12cd34...');

// Option B: Mailgun
// define('BOOKIT_EMAIL_PROVIDER', 'mailgun');
// define('BOOKIT_MAILGUN_API_KEY', 'key-abc123...');
// define('BOOKIT_MAILGUN_DOMAIN', 'mg.yourdomain.com');

// Option C: AWS SES
// define('BOOKIT_EMAIL_PROVIDER', 'ses');
// define('BOOKIT_AWS_ACCESS_KEY', 'AKIAIOSFODNN7EXAMPLE');
// define('BOOKIT_AWS_SECRET_KEY', 'wJalrXUtn...');
// define('BOOKIT_AWS_REGION', 'eu-west-2');

// Encryption Key (Generate using: base64_encode(random_bytes(32)))
define('BOOKIT_ENCRYPTION_KEY', 'base64:abc123def456...');

// JWT Secret (if using JWT for dashboard auth - Phase 2)
// define('BOOKIT_JWT_SECRET', 'random-256-bit-key-here');

// Google Calendar API (OAuth credentials from Google Cloud Console)
define('BOOKIT_GOOGLE_CLIENT_ID', '123456789-abc123.apps.googleusercontent.com');
define('BOOKIT_GOOGLE_CLIENT_SECRET', 'GOCSPX-abc123...');

// Debug Mode (set to false in production)
define('BOOKIT_DEBUG', false);
```

**Security Note:** Never commit wp-config.php to version control. Use environment variables or separate config files for different environments.

# 5. DATABASE ARCHITECTURE

## 5.1 Schema Overview

The database schema consists of **10 custom tables** (already defined in `ScopeDefinition.md §6`). This architecture validates the existing schema against requirements and documents the optimization strategy for Phase 1.

**Design Philosophy:**
- **Custom tables** (not custom post types) for performance and data integrity
- **Foreign key relationships** for referential integrity
- **UNIQUE constraints** for business rule enforcement (prevents double-booking)
- **Composite indexes** on frequently queried column combinations
- **Soft deletes** for GDPR compliance (7-year retention requirement)

### Table Summary

| Table Name | Purpose | Est. Rows (Year 1) | Primary Key |
|------------|---------|-------------------|-------------|
| `wp_bookings` | Main bookings table | 10,000-50,000 | id (BIGINT) |
| `wp_bookings_services` | Service catalog | 10-50 | id (BIGINT) |
| `wp_bookings_categories` | Service categories | 5-20 | id (BIGINT) |
| `wp_bookings_service_categories` | Service-category junction | 20-100 | service_id + category_id (composite) |
| `wp_bookings_staff` | Staff members | 1-10 | id (BIGINT) |
| `wp_bookings_staff_services` | Staff-service junction | 10-100 | staff_id + service_id (composite) |
| `wp_bookings_customers` | Customer records | 5,000-25,000 | id (BIGINT) |
| `wp_bookings_payments` | Payment transactions | 10,000-50,000 | id (BIGINT) |
| `wp_bookings_working_hours` | Staff availability | 50-500 | id (BIGINT) |
| `wp_bookings_settings` | Plugin configuration | 50-100 | id (INT) |

## 5.2 Complete Schema Definitions

### 5.2.1 wp_bookings (Main Bookings Table)

**Purpose:** Core table storing all booking records

```sql
CREATE TABLE wp_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  staff_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending_payment',
  total_price DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0.00,
  special_requests TEXT DEFAULT NULL,
  internal_notes TEXT DEFAULT NULL COMMENT 'Staff/admin notes, not visible to customer',
  cancellation_reason TEXT DEFAULT NULL,
  cancelled_at DATETIME DEFAULT NULL,
  cancelled_by BIGINT UNSIGNED DEFAULT NULL COMMENT 'User ID who cancelled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL COMMENT 'Soft delete for GDPR compliance',
  
  PRIMARY KEY (id),
  
  -- CRITICAL: UNIQUE constraint prevents double-booking (Gap #1 resolution)
  UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time),
  
  -- Foreign keys
  KEY idx_customer (customer_id),
  KEY idx_staff (staff_id),
  KEY idx_service (service_id),
  KEY idx_status (status),
  KEY idx_booking_date (booking_date),
  KEY idx_deleted_at (deleted_at),
  
  -- Composite index for common queries
  KEY idx_staff_date_status (staff_id, booking_date, status),
  KEY idx_date_range (booking_date, created_at),
  
  FOREIGN KEY (customer_id) REFERENCES wp_bookings_customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (staff_id) REFERENCES wp_bookings_staff(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES wp_bookings_services(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Design Decisions:**

1. **UNIQUE constraint on (staff_id, booking_date, start_time):**
   - **Purpose:** Prevents double-booking at database level (Gap #1)
   - **Behavior:** If two customers try to book same slot simultaneously, second INSERT fails with "Duplicate entry" error
   - **Application handling:** Catch exception, show "Slot no longer available" message

2. **Soft deletes (deleted_at column):**
   - **Purpose:** GDPR right to erasure + 7-year HMRC retention requirement
   - **Implementation:** Set `deleted_at = NOW()` instead of DELETE
   - **Anonymization:** After 7 years, cron job anonymizes personal data but keeps booking record

3. **Status enum:**
   - `pending_payment`: Booking created but payment not yet confirmed (10-minute window)
   - `confirmed`: Payment received, booking active
   - `completed`: Service delivered, appointment finished
   - `cancelled`: Booking cancelled by customer or business owner
   - `no_show`: Customer didn't show up

4. **Composite indexes:**
   - `idx_staff_date_status`: Optimizes dashboard "today's schedule" queries
   - `idx_date_range`: Optimizes revenue reports by date range

### 5.2.2 wp_bookings_services (Service Catalog)

```sql
CREATE TABLE wp_bookings_services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes',
  buffer_before INT UNSIGNED DEFAULT 0 COMMENT 'Buffer time before appointment (minutes)',
  buffer_after INT UNSIGNED DEFAULT 0 COMMENT 'Buffer time after appointment (minutes)',
  base_price DECIMAL(10,2) NOT NULL COMMENT 'Base price in GBP',
  deposit_type ENUM('none', 'percentage', 'fixed') DEFAULT 'none',
  deposit_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Percentage (e.g., 50.00 = 50%) or fixed amount',
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0 COMMENT 'Display order in booking form',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_active_sort (is_active, sort_order),
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Fields:**
- `duration`: Service length (e.g., 60 for 1-hour haircut)
- `buffer_before/after`: Setup/cleanup time not bookable by customers
- `deposit_type/amount`: Configurable per service (e.g., 50% deposit for photographer sessions)

### 5.2.3 wp_bookings_categories (Service Categories)

**Purpose:** Organize services into categories (e.g., "Haircuts", "Coloring", "Styling")

```sql
CREATE TABLE wp_bookings_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL COMMENT 'Icon class or emoji',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2.4 wp_bookings_service_categories (Junction Table)

**Purpose:** Many-to-many relationship (services can belong to multiple categories)

```sql
CREATE TABLE wp_bookings_service_categories (
  service_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  
  PRIMARY KEY (service_id, category_id),
  KEY idx_category (category_id),
  
  FOREIGN KEY (service_id) REFERENCES wp_bookings_services(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES wp_bookings_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Rationale:** Junction table added per Gap #14. Allows services like "Haircut + Beard Trim" to appear in both "Haircuts" and "Grooming" categories.

### 5.2.5 wp_bookings_staff (Staff Members)

```sql
CREATE TABLE wp_bookings_staff (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wp_user_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'Link to wp_users for dashboard login',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  display_on_booking_page TINYINT(1) DEFAULT 1 COMMENT 'Show in customer-facing staff selection',
  sort_order INT DEFAULT 0,
  google_calendar_token TEXT DEFAULT NULL COMMENT 'Encrypted OAuth token',
  google_calendar_refresh_token TEXT DEFAULT NULL COMMENT 'Encrypted OAuth refresh token',
  google_calendar_connected_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY unique_email (email),
  KEY idx_wp_user (wp_user_id),
  KEY idx_active (is_active),
  KEY idx_active_display (is_active, display_on_booking_page, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Fields:**
- `wp_user_id`: Links to WordPress user for dashboard login (nullable - staff can exist without login)
- `google_calendar_token/refresh_token`: Encrypted OAuth tokens (AES-256-GCM)
- `display_on_booking_page`: Can hide staff from public (e.g., owner who doesn't take bookings)

### 5.2.6 wp_bookings_staff_services (Staff-Service Junction)

**Purpose:** Many-to-many relationship (staff can provide multiple services, services can be provided by multiple staff)

```sql
CREATE TABLE wp_bookings_staff_services (
  staff_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  custom_price DECIMAL(10,2) DEFAULT NULL COMMENT 'Override base service price for this staff member',
  custom_duration INT UNSIGNED DEFAULT NULL COMMENT 'Override base duration (minutes)',
  
  PRIMARY KEY (staff_id, service_id),
  KEY idx_service (service_id),
  
  FOREIGN KEY (staff_id) REFERENCES wp_bookings_staff(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES wp_bookings_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Use Case:** Senior stylist charges £60 for haircut, junior stylist charges £40 (same service, different pricing).

### 5.2.7 wp_bookings_customers (Customer Records)

```sql
CREATE TABLE wp_bookings_customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wp_user_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'Link to wp_users if registered customer',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  marketing_consent TINYINT(1) DEFAULT 0 COMMENT 'Explicit consent for marketing emails',
  marketing_consent_date DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL COMMENT 'Business owner notes about customer',
  total_bookings INT UNSIGNED DEFAULT 0 COMMENT 'Cached count of completed bookings',
  total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Cached lifetime value',
  last_booking_date DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- GDPR anonymization fields
  anonymized_at DATETIME DEFAULT NULL COMMENT 'Set when customer requests data erasure',
  
  PRIMARY KEY (id),
  KEY idx_email (email),
  KEY idx_phone (phone),
  KEY idx_wp_user (wp_user_id),
  KEY idx_anonymized (anonymized_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**GDPR Compliance:**
- When customer requests data erasure, set `anonymized_at = NOW()`
- Anonymization script replaces: `first_name = 'Deleted'`, `last_name = 'User'`, `email = 'deleted+{id}@example.com'`, `phone = '00000000000'`
- Booking records remain (for business records) but linked customer is anonymized

### 5.2.8 wp_bookings_payments (Payment Transactions)

```sql
CREATE TABLE wp_bookings_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  gateway ENUM('stripe', 'paypal', 'cash', 'other') NOT NULL,
  gateway_transaction_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe payment_intent_id or PayPal order_id',
  payment_type ENUM('deposit', 'full_payment', 'refund') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'GBP',
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  
  -- PCI DSS Compliance: ONLY store these fields (never full card number or CVV)
  card_last_4 VARCHAR(4) DEFAULT NULL COMMENT 'Last 4 digits only',
  card_brand VARCHAR(20) DEFAULT NULL COMMENT 'visa, mastercard, amex',
  
  refund_reason TEXT DEFAULT NULL,
  refunded_amount DECIMAL(10,2) DEFAULT 0.00,
  refunded_at DATETIME DEFAULT NULL,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_booking (booking_id),
  KEY idx_gateway_transaction (gateway, gateway_transaction_id),
  KEY idx_status (status),
  
  FOREIGN KEY (booking_id) REFERENCES wp_bookings(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PCI DSS Compliance (NFR-2.11, NFR-2.12):**
- **NEVER** store: Full card number, CVV, expiration date
- **ONLY** store: Payment gateway ID, last 4 digits, card brand
- All payment processing happens on Stripe/PayPal hosted pages (SAQ A compliance)

### 5.2.9 wp_bookings_working_hours (Staff Availability)

```sql
CREATE TABLE wp_bookings_working_hours (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED DEFAULT NULL COMMENT '0=Sunday, 6=Saturday, NULL=specific date',
  specific_date DATE DEFAULT NULL COMMENT 'For exceptions (vacation, etc.)',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working TINYINT(1) DEFAULT 1 COMMENT '0=day off/blocked',
  break_start TIME DEFAULT NULL COMMENT 'Lunch break start',
  break_end TIME DEFAULT NULL COMMENT 'Lunch break end',
  repeat_weekly TINYINT(1) DEFAULT 1 COMMENT '1=recurring pattern, 0=one-time',
  valid_from DATE DEFAULT NULL COMMENT 'Pattern valid from this date',
  valid_until DATE DEFAULT NULL COMMENT 'Pattern valid until this date',
  notes TEXT DEFAULT NULL COMMENT 'Reason for exception (e.g., vacation)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_staff_day (staff_id, day_of_week),
  KEY idx_staff_date (staff_id, specific_date),
  KEY idx_date_range (staff_id, valid_from, valid_until),
  
  FOREIGN KEY (staff_id) REFERENCES wp_bookings_staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**How It Works:**

**Regular weekly schedule:**
```sql
-- Staff works Monday-Friday 9am-5pm with 1-hour lunch
INSERT INTO wp_bookings_working_hours (staff_id, day_of_week, start_time, end_time, break_start, break_end) VALUES
(1, 1, '09:00', '17:00', '12:00', '13:00'), -- Monday
(1, 2, '09:00', '17:00', '12:00', '13:00'), -- Tuesday
(1, 3, '09:00', '17:00', '12:00', '13:00'), -- Wednesday
(1, 4, '09:00', '17:00', '12:00', '13:00'), -- Thursday
(1, 5, '09:00', '17:00', '12:00', '13:00'); -- Friday
```

**Exception (vacation):**
```sql
-- Staff takes March 10-15, 2026 off
INSERT INTO wp_bookings_working_hours (staff_id, specific_date, start_time, end_time, is_working) VALUES
(1, '2026-03-10', '00:00', '23:59', 0),
(1, '2026-03-11', '00:00', '23:59', 0),
(1, '2026-03-12', '00:00', '23:59', 0),
(1, '2026-03-13', '00:00', '23:59', 0),
(1, '2026-03-14', '00:00', '23:59', 0),
(1, '2026-03-15', '00:00', '23:59', 0);
```

**Availability Query Logic:**
1. Check for `specific_date` exception FIRST
2. If no exception, fall back to `day_of_week` pattern
3. If multiple patterns match date (e.g., split shifts), merge time ranges

### 5.2.10 wp_bookings_settings (Plugin Configuration)

```sql
CREATE TABLE wp_bookings_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(255) NOT NULL,
  setting_value LONGTEXT DEFAULT NULL COMMENT 'JSON for complex settings',
  setting_type ENUM('string', 'int', 'bool', 'json', 'encrypted') DEFAULT 'string',
  description TEXT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY unique_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Sample Settings:**
```sql
INSERT INTO wp_bookings_settings (setting_key, setting_value, setting_type) VALUES
('business_name', 'Jane Doe Salon', 'string'),
('business_email', 'hello@janedoesalon.com', 'string'),
('business_phone', '+44 20 1234 5678', 'string'),
('timezone', 'Europe/London', 'string'),
('currency', 'GBP', 'string'),
('min_advance_booking_hours', '2', 'int'),
('max_advance_booking_days', '90', 'int'),
('cancellation_hours_before', '24', 'int'),
('refund_policy', '{"within_24h": 0, "24_to_48h": 50, "48h_plus": 100}', 'json'),
('branding_mode', 'white_label', 'string'),
('branding_logo_url', 'https://example.com/logo.png', 'string'),
('branding_primary_color', '#FF5733', 'string'),
('stripe_api_key', '[encrypted_data]', 'encrypted');
```

**Encrypted Settings:**
- API keys, OAuth tokens stored with `setting_type = 'encrypted'`
- `setting_value` contains AES-256-GCM encrypted data
- Decrypted at runtime using `BOOKIT_ENCRYPTION_KEY` from wp-config.php

## 5.3 Entity Relationship Diagram

```
┌──────────────────────────┐
│  wp_bookings_customers   │
│  (5k-25k rows)           │
│  - id (PK)               │
│  - first_name            │
│  - email                 │
│  - phone                 │
│  - marketing_consent     │
└─────────┬────────────────┘
          │
          │ customer_id (FK)
          │
          ▼
┌──────────────────────────┐          ┌────────────────────────────┐
│     wp_bookings          │          │  wp_bookings_payments      │
│   (10k-50k rows)         │◄─────────│  (10k-50k rows)            │
│   - id (PK)              │booking_id│  - id (PK)                 │
│   - customer_id (FK)     │   (FK)   │  - booking_id (FK)         │
│   - staff_id (FK)        │          │  - gateway_transaction_id  │
│   - service_id (FK)      │          │  - amount                  │
│   - booking_date         │          │  - card_last_4             │
│   - start_time           │          └────────────────────────────┘
│   - status               │
│   - total_price          │
│   UNIQUE(staff_id,       │
│          booking_date,   │
│          start_time)     │
└─────┬────────┬───────────┘
      │        │
      │        │ service_id (FK)
      │        ▼
      │   ┌────────────────────────────┐
      │   │  wp_bookings_services      │
      │   │  (10-50 rows)              │
      │   │  - id (PK)                 │
      │   │  - name                    │
      │   │  - duration                │
      │   │  - base_price              │
      │   │  - deposit_type/amount     │
      │   └──────┬─────────────────────┘
      │          │
      │          │ service_id (FK)
      │          ▼
      │   ┌────────────────────────────┐      ┌──────────────────────────┐
      │   │wp_bookings_service_        │      │ wp_bookings_categories   │
      │   │     categories             │─────►│ (5-20 rows)              │
      │   │  (20-100 rows)             │      │ - id (PK)                │
      │   │  - service_id (PK, FK)     │      │ - name                   │
      │   │  - category_id (PK, FK)    │      │ - icon                   │
      │   └────────────────────────────┘      └──────────────────────────┘
      │
      │ staff_id (FK)
      ▼
┌──────────────────────────┐
│   wp_bookings_staff      │
│   (1-10 rows)            │
│   - id (PK)              │
│   - first_name           │
│   - email                │
│   - google_calendar_     │
│     token (encrypted)    │
└─────┬────────────────────┘
      │
      │ staff_id (FK)
      ├────────────────────────────────┬──────────────────────────────┐
      │                                │                              │
      ▼                                ▼                              ▼
┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐
│ wp_bookings_staff_     │  │ wp_bookings_working_  │  │  (Used in             │
│     services           │  │       hours           │  │   availability         │
│ (10-100 rows)          │  │ (50-500 rows)         │  │   calculation)         │
│ - staff_id (PK, FK)    │  │ - id (PK)             │  │                        │
│ - service_id (PK, FK)  │  │ - staff_id (FK)       │  │                        │
│ - custom_price         │  │ - day_of_week         │  │                        │
└────────────────────────┘  │ - specific_date       │  │                        │
                            │ - start_time          │  │                        │
                            │ - end_time            │  │                        │
                            │ - is_working          │  │                        │
                            └───────────────────────┘  └────────────────────────┘

┌──────────────────────────┐
│  wp_bookings_settings    │
│  (50-100 rows)           │
│  - id (PK)               │
│  - setting_key (UNIQUE)  │
│  - setting_value         │
│  - setting_type          │
│  (encrypted for API keys)│
└──────────────────────────┘
```

## 5.4 Index Strategy for Performance

### Query Performance Target (NFR-1.16)
**Requirement:** Database queries <100ms with 10,000 booking records

### Indexes Defined

**wp_bookings:**
- PRIMARY KEY (id) - Clustered index
- UNIQUE KEY (staff_id, booking_date, start_time) - **CRITICAL for race condition prevention**
- KEY idx_staff_date_status (staff_id, booking_date, status) - Composite index for dashboard queries
- KEY idx_date_range (booking_date, created_at) - Revenue reports
- KEY idx_customer (customer_id) - Customer booking history
- KEY idx_deleted_at (deleted_at) - Exclude soft-deleted records

**Common Query Patterns:**
```sql
-- Dashboard: Today's schedule for staff ID 3
SELECT * FROM wp_bookings 
WHERE staff_id = 3 
  AND booking_date = '2026-01-23' 
  AND deleted_at IS NULL 
ORDER BY start_time;
-- Uses: idx_staff_date_status

-- Availability check: Find existing bookings for staff on date
SELECT start_time, end_time 
FROM wp_bookings 
WHERE staff_id = 3 
  AND booking_date = '2026-01-25' 
  AND status IN ('confirmed', 'pending_payment') 
  AND deleted_at IS NULL;
-- Uses: idx_staff_date_status

-- Revenue report: Total revenue for date range
SELECT SUM(total_price), COUNT(*) 
FROM wp_bookings 
WHERE booking_date BETWEEN '2026-01-01' AND '2026-01-31' 
  AND status = 'completed' 
  AND deleted_at IS NULL;
-- Uses: idx_date_range

-- Customer history: All bookings for customer ID 42
SELECT * FROM wp_bookings 
WHERE customer_id = 42 
  AND deleted_at IS NULL 
ORDER BY booking_date DESC, start_time DESC;
-- Uses: idx_customer
```

**Index Validation:**
All queries will be validated with `EXPLAIN` during Sprint 0 to confirm index usage. Target: <100ms execution time with 10,000 rows.

## 5.5 Race Condition Handling (Gap #1 Resolution)

### Problem Statement
Two customers booking the same time slot simultaneously could both pay, but only one gets the booking. This creates:
- Customer service issues (refund processing, apology emails)
- Revenue loss (customer books elsewhere after bad experience)
- Database inconsistency

### Solution: Database-Level Prevention

**Approach:** UNIQUE constraint + optimistic locking + transaction handling

```sql
-- UNIQUE constraint in schema
UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)
```

**How It Works:**

**Step 1: Customer A and Customer B simultaneously try to book same slot**
```
10:00:00.000 - Customer A: Checks availability → Slot 9:00 AM available ✓
10:00:00.100 - Customer B: Checks availability → Slot 9:00 AM available ✓
```

**Step 2: Both proceed to payment**
```
10:00:05.000 - Customer A: Completes Stripe payment
10:00:06.000 - Customer B: Completes PayPal payment
```

**Step 3: Both webhooks fire nearly simultaneously**
```php
// Webhook handler (simplified)
function handle_payment_success($booking_data) {
    global $wpdb;
    
    // Start transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Attempt to insert booking
        $result = $wpdb->insert('wp_bookings', [
            'staff_id' => $booking_data['staff_id'],
            'booking_date' => $booking_data['booking_date'],
            'start_time' => $booking_data['start_time'],
            // ... other fields
        ]);
        
        if ($result === false) {
            // Check if UNIQUE constraint violation
            if (strpos($wpdb->last_error, 'Duplicate entry') !== false) {
                $wpdb->query('ROLLBACK');
                
                // CRITICAL: Refund payment automatically
                refund_payment($booking_data['payment_id']);
                
                // Send apology email
                send_slot_unavailable_email($booking_data['customer_email']);
                
                return new WP_Error('slot_taken', 'Slot no longer available - payment refunded');
            }
        }
        
        $wpdb->query('COMMIT');
        return $wpdb->insert_id; // Booking created successfully
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('exception', $e->getMessage());
    }
}
```

**Step 4: Database Enforces UNIQUE Constraint**
```
10:00:06.100 - Customer A's INSERT: SUCCESS (booking_id = 1234)
10:00:06.105 - Customer B's INSERT: FAIL (Duplicate entry for key 'unique_booking_slot')
```

**Step 5: Application Handles Failure Gracefully**
```
- Customer A: Receives confirmation email ✓
- Customer B: 
  1. Payment automatically refunded via Stripe API
  2. Receives email: "We're sorry, that time slot was just booked..."
  3. Provided link to select alternative time
```

### Performance Impact
- UNIQUE constraint adds negligible overhead (<1ms per INSERT)
- Index on (staff_id, booking_date, start_time) already exists for queries
- No additional queries needed - database enforces atomically

## 5.6 Soft Delete Strategy (GDPR Compliance)

### Requirements
- **NFR-7.5:** Right to erasure (GDPR Article 17)
- **UK Law:** 7-year record retention for tax purposes (HMRC requirement)

### Implementation

**Contradiction:** Customer has right to be forgotten, but business must keep records for 7 years.

**Solution:** Soft delete + anonymization

```php
/**
 * Handle GDPR data erasure request
 * 
 * 1. Set deleted_at timestamp
 * 2. Anonymize personal data
 * 3. Keep booking records for business compliance
 */
function anonymize_customer($customer_id) {
    global $wpdb;
    
    // Get customer
    $customer = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM wp_bookings_customers WHERE id = %d",
        $customer_id
    ), ARRAY_A);
    
    if (!$customer) {
        return new WP_Error('not_found', 'Customer not found');
    }
    
    // Update customer record with anonymized data
    $wpdb->update(
        'wp_bookings_customers',
        [
            'first_name' => 'Deleted',
            'last_name' => 'User',
            'email' => 'deleted+' . $customer_id . '@example.com',
            'phone' => '00000000000',
            'notes' => NULL,
            'anonymized_at' => current_time('mysql'),
        ],
        ['id' => $customer_id]
    );
    
    // Soft delete all bookings
    $wpdb->update(
        'wp_bookings',
        ['deleted_at' => current_time('mysql')],
        ['customer_id' => $customer_id]
    );
    
    // Log erasure request (for audit trail)
    $wpdb->insert('wp_bookings_audit_log', [
        'action' => 'customer_anonymized',
        'entity_type' => 'customer',
        'entity_id' => $customer_id,
        'performed_by' => get_current_user_id(),
        'performed_at' => current_time('mysql'),
        'ip_address' => $_SERVER['REMOTE_ADDR'],
    ]);
    
    return true;
}
```

**Queries Exclude Soft-Deleted Records:**
```sql
-- All queries include: WHERE deleted_at IS NULL
SELECT * FROM wp_bookings 
WHERE staff_id = 3 
  AND booking_date = CURDATE() 
  AND deleted_at IS NULL;
```

**After 7 Years (Automated Cron Job):**
```php
// Run monthly: Permanently delete bookings older than 7 years
function cleanup_old_bookings() {
    global $wpdb;
    
    // Hard delete bookings from 7+ years ago
    $wpdb->query("
        DELETE FROM wp_bookings 
        WHERE deleted_at IS NOT NULL 
          AND deleted_at < DATE_SUB(NOW(), INTERVAL 7 YEAR)
    ");
    
    // Hard delete payments for deleted bookings
    $wpdb->query("
        DELETE p FROM wp_bookings_payments p
        LEFT JOIN wp_bookings b ON p.booking_id = b.id
        WHERE b.id IS NULL
    ");
}
add_action('bookit_system_monthly_cleanup', 'cleanup_old_bookings');
```

## 5.7 Database Migrations

**Migration Strategy:** Version-based SQL files executed during plugin updates

```
/database/migrations/
├── 1.0.0-initial.php          # Initial schema
├── 1.1.0-add-categories.php   # Add service categories (Gap #14)
├── 1.2.0-add-sms-fields.php   # Phase 2: SMS notification fields
└── 1.3.0-add-recurring.php    # Phase 2: Recurring appointments
```

**Migration File Example:**
```php
<?php
// database/migrations/1.1.0-add-categories.php

function booking_migrate_1_1_0() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    // Create categories table
    $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookings_categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      icon VARCHAR(50) DEFAULT NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_active_sort (is_active, sort_order)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Create junction table
    $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookings_service_categories (
      service_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (service_id, category_id),
      KEY idx_category (category_id),
      FOREIGN KEY (service_id) REFERENCES {$wpdb->prefix}bookings_services(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES {$wpdb->prefix}bookings_categories(id) ON DELETE CASCADE
    ) $charset_collate;";
    
    dbDelta($sql);
    
    // Update version in database
    update_option('bookit_system_db_version', '1.1.0');
    
    return true;
}
```

**Migration Runner:**
```php
// Run during plugin activation or update
function bookit_run_migrations() {
    $current_version = get_option('bookit_system_db_version', '0.0.0');
    $plugin_version = BOOKIT_VERSION; // From main plugin file constant
    
    if (version_compare($current_version, $plugin_version, '<')) {
        // Get all migration files
        $migrations = glob(BOOKIT_PLUGIN_DIR . 'database/migrations/*.php');
        
        foreach ($migrations as $migration_file) {
            // Extract version from filename (e.g., "1.1.0" from "1.1.0-add-categories.php")
            preg_match('/(\d+\.\d+\.\d+)-/', basename($migration_file), $matches);
            $migration_version = $matches[1];
            
            // Run if migration version > current version AND <= plugin version
            if (version_compare($migration_version, $current_version, '>') && 
                version_compare($migration_version, $plugin_version, '<=')) {
                
                require_once $migration_file;
                $function_name = 'BOOKIT_migrate_' . str_replace('.', '_', $migration_version);
                
                if (function_exists($function_name)) {
                    $function_name();
                }
            }
        }
    }
}
```

## 5.8 Database Backup and Recovery

**Requirements:**
- **NFR-5.3:** Daily automated backups with 30-day retention
- Recovery time objective (RTO): <2 hours
- Recovery point objective (RPO): <24 hours

**Implementation:**
```bash
# Daily backup script (client's hosting cron job)
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/home/client/backups/database"
DB_NAME="wordpress_db"
DB_USER="wp_user"
DB_PASS="password"

# Create backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup-$DATE.sql

# Compress
gzip $BACKUP_DIR/backup-$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +30 -delete

# Upload to offsite storage (optional but recommended)
# aws s3 cp $BACKUP_DIR/backup-$DATE.sql.gz s3://client-backups/database/
```

**Recovery Procedure:**
```bash
# 1. Stop WordPress (prevent new writes)
# 2. Restore from backup
gunzip -c /home/client/backups/database/backup-2026-01-22.sql.gz | mysql -u$DB_USER -p$DB_PASS $DB_NAME

# 3. Restart WordPress
# 4. Verify data integrity
```

---