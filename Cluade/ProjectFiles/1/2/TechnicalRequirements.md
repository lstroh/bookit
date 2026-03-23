# Phase 2.4: Technical & Non-Functional Requirements
## WordPress Booking Plugin - Technical Specifications

**Document Version:** 1.0 DRAFT  
**Date:** January 21, 2026  
**Status:** DRAFT - Ready for Review  
**Phase:** Phase 2.4

---

## TABLE OF CONTENTS

1. [Performance Requirements](#1-performance-requirements)
2. [Security & Compliance](#2-security--compliance)
3. [Scalability Requirements](#3-scalability-requirements)
4. [WordPress Technical Requirements](#4-wordpress-technical-requirements)
5. [Accessibility Standards](#5-accessibility-standards)
6. [Browser & Device Compatibility](#6-browser--device-compatibility)
7. [Data Privacy & GDPR](#7-data-privacy--gdpr)
8. [Email & Notification Infrastructure](#8-email--notification-infrastructure)
9. [Backup & Recovery](#9-backup--recovery)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [API & Integration Standards](#11-api--integration-standards)

---

## 1. PERFORMANCE REQUIREMENTS

### 1.1 Page Load Performance

#### Booking Page (Public)
**Requirement:** Initial page load ≤ 2.0 seconds on 3G connection

**Acceptance Criteria:**
- ✅ Initial HTML render (FCP - First Contentful Paint) ≤ 1.2 seconds
- ✅ Interactive state (TTI - Time to Interactive) ≤ 2.0 seconds
- ✅ Largest Contentful Paint (LCP) ≤ 2.5 seconds
- ✅ Cumulative Layout Shift (CLS) ≤ 0.1
- ✅ First Input Delay (FID) ≤ 100ms

**Testing Method:**
- Google Lighthouse (target score: ≥90 for Performance)
- WebPageTest.org (3G Fast connection profile)
- Measure on actual device: iPhone 12, Samsung Galaxy S21

**Optimization Strategies:**
- Lazy-load service images below the fold
- Critical CSS inline in `<head>`
- Defer non-critical JavaScript
- Optimize calendar widget bundle size (≤50KB gzipped)
- CDN for static assets (if hosted on custom domain)

---

#### Dashboard (Business Owner/Staff)
**Requirement:** Dashboard page load ≤ 1.5 seconds on broadband

**Acceptance Criteria:**
- ✅ Initial render ≤ 800ms
- ✅ Interactive dashboard widgets ≤ 1.5 seconds
- ✅ Calendar view renders ≤ 1.0 seconds after navigation

**Optimization Strategies:**
- React/Vue component lazy loading
- Virtual scrolling for booking lists (>100 items)
- Cache dashboard API responses (60 second TTL)
- Prefetch next 7 days of bookings on login

---

### 1.2 API Response Times

#### Critical Operations (User-Facing)
| Operation | Maximum Response Time | p95 Response Time | Notes |
|-----------|----------------------|-------------------|--------|
| Check availability (single day) | 500ms | 300ms | Blocks customer flow |
| Create booking | 1.0 second | 700ms | Includes optimistic locking |
| Payment redirect | 800ms | 500ms | Stripe/PayPal session creation |
| Cancel booking | 600ms | 400ms | Includes refund initiation |
| Reschedule booking | 800ms | 500ms | Availability check + update |

**Acceptance Criteria:**
- ✅ 95% of requests complete within p95 target
- ✅ 99.5% of requests complete within maximum target
- ✅ No operation exceeds 3 seconds (hard timeout)

**Testing Method:**
- Load testing with k6 or Apache JMeter
- 100 concurrent users, 1,000 bookings/hour scenario
- Monitor via New Relic APM or similar

---

#### Background Operations (Non-Blocking)
| Operation | Maximum Response Time | Priority | Notes |
|-----------|----------------------|----------|--------|
| Send confirmation email | 5 seconds | Low | Queued via WP Cron |
| Google Calendar sync | 10 seconds | Low | Async, retries on failure |
| Generate daily report | 30 seconds | Low | Scheduled task |
| Process reminder emails (batch) | 60 seconds | Medium | Runs hourly |

**Implementation:**
- Use WordPress Action Scheduler for queued jobs
- Retry logic: 3 attempts with exponential backoff (1s, 5s, 15s)
- Dead letter queue for failed jobs (log + admin notification)

---

### 1.3 Database Query Performance

**Requirement:** All database queries ≤ 100ms execution time

**Acceptance Criteria:**
- ✅ Simple SELECT queries (single table): ≤ 20ms
- ✅ JOIN queries (2-3 tables): ≤ 50ms
- ✅ Complex reporting queries: ≤ 100ms
- ✅ No full table scans on tables >10,000 rows

**Optimization Requirements:**
- ✅ Proper indexing on all foreign keys
- ✅ Composite indexes on frequently filtered columns:
  - `(staff_id, booking_date, booking_status)` on `wp_bookings`
  - `(service_id, is_active)` on `wp_bookings_services`
  - `(customer_id, created_at)` on `wp_bookings`
- ✅ Query result caching (Transients API, 5-minute TTL)
- ✅ Pagination for all list views (50 items per page)

**Testing Method:**
- MySQL slow query log (threshold: 100ms)
- Query Monitor plugin during development
- Database profiling with realistic data volume (10,000+ bookings)

---

### 1.4 Concurrent Booking Handling

**Requirement:** Support 50 concurrent booking attempts without data corruption

**Acceptance Criteria:**
- ✅ Optimistic locking prevents double-booking race conditions
- ✅ Database UNIQUE constraint on `(staff_id, booking_date, booking_start_time)`
- ✅ Graceful error message: "This time slot was just booked. Please select another."
- ✅ Automatic retry logic for transient failures (deadlocks)
- ✅ Queue system for payment webhook processing (prevents duplicate bookings)

**Testing Method:**
- Concurrent load test: 50 users booking same slot simultaneously
- Expected outcome: 1 success, 49 graceful failures
- Monitor database deadlocks (should be 0 with proper locking)

**Implementation:**
```sql
-- Database constraint ensures atomicity
CREATE UNIQUE INDEX idx_booking_slot 
ON wp_bookings (staff_id, booking_date, booking_start_time)
WHERE booking_status NOT IN ('cancelled', 'no_show');
```

---

### 1.5 Asset Optimization

**Requirement:** Minimize bandwidth consumption for mobile users

**Acceptance Criteria:**
- ✅ Total page weight (booking page): ≤ 500KB (gzipped)
- ✅ JavaScript bundle: ≤ 150KB (gzipped)
- ✅ CSS bundle: ≤ 30KB (gzipped)
- ✅ Service images: WebP format, max 100KB each
- ✅ SVG icons for UI elements (vector, ≤5KB each)

**Image Optimization:**
- Responsive images with `srcset`: 400w, 800w, 1200w
- Lazy loading for below-the-fold content
- Staff photos: 400x400px, WebP, max 50KB

---

## 2. SECURITY & COMPLIANCE

### 2.1 PCI DSS Compliance

**Requirement:** Plugin NEVER stores credit card data (PCI DSS SAQ-A compliance)

**Acceptance Criteria:**
- ✅ **NO** credit card numbers stored in database (EVER)
- ✅ **NO** CVV codes stored or transmitted through plugin
- ✅ **NO** credit card data in logs or error messages
- ✅ All payment processing via Stripe/PayPal hosted checkout
- ✅ Only store: last 4 digits (from Stripe), card brand, expiry month/year (from Stripe metadata)

**Stripe Integration Security:**
- Use Stripe Checkout (hosted payment page, PCI compliant)
- Store only Stripe Payment Intent ID in database
- Validate webhook signatures (`stripe_signature` header)
- Use test mode keys during development (prefix `sk_test_`)

**PayPal Integration Security:**
- Use PayPal Standard or PayPal Commerce Platform
- Redirect to PayPal for payment (no card data touches our server)
- Validate IPN/webhook signatures

**Acceptance Test:**
- ✅ Security audit: No cardholder data anywhere in codebase
- ✅ Database schema review: No columns for card numbers
- ✅ Log file review: No sensitive data in error logs

---

### 2.2 Data Encryption

**Requirement:** Encrypt sensitive data at rest and in transit

**Acceptance Criteria:**

#### In Transit (HTTPS/TLS):
- ✅ **HTTPS required** for all booking pages (redirect HTTP → HTTPS)
- ✅ TLS 1.2 minimum (TLS 1.3 preferred)
- ✅ Valid SSL certificate (no self-signed in production)
- ✅ HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- ✅ External API calls (Stripe, PayPal, Google) use TLS 1.2+

**Implementation:**
```php
// Force HTTPS on booking pages
if (!is_ssl() && is_page('book')) {
    wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], 301);
    exit;
}
```

#### At Rest (Database):
**Sensitive Fields to Encrypt:**
- Payment processor API keys (Stripe secret key, PayPal API credentials)
- Google Calendar OAuth refresh tokens
- Customer phone numbers (optional, based on threat model)

**Encryption Method:**
- Use `openssl_encrypt()` with AES-256-GCM
- Store encryption keys in `wp-config.php` (NOT in database)
- Unique initialization vector (IV) per encrypted value

**Example Implementation:**
```php
define('BOOKING_ENCRYPTION_KEY', 'base64-encoded-32-byte-key');

function encrypt_sensitive_data($plaintext) {
    $key = base64_decode(BOOKING_ENCRYPTION_KEY);
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-gcm'));
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, 0, $iv, $tag);
    return base64_encode($iv . $tag . $ciphertext);
}
```

**Acceptance Test:**
- ✅ API keys stored encrypted in `wp_options` table
- ✅ Encryption key NOT in database (in wp-config.php only)
- ✅ Database export does not reveal sensitive data

---

### 2.3 Authentication & Authorization

#### WordPress Admin (Configuration)
**Requirement:** Only users with `manage_options` capability can configure plugin

**Acceptance Criteria:**
- ✅ Plugin settings page requires `manage_options` (Administrator role only)
- ✅ AJAX endpoints verify `check_ajax_referer()` + capability check
- ✅ Direct file access blocked: `defined('ABSPATH') or die();`

#### Frontend Dashboard (Business Owner/Staff)
**Requirement:** Secure, session-based authentication separate from WordPress

**Acceptance Criteria:**
- ✅ Username/email + password login (bcrypt hashed passwords, cost factor 12)
- ✅ Session management:
  - PHP `$_SESSION` with 8-hour timeout
  - Session ID regeneration on login (`session_regenerate_id(true)`)
  - Secure session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- ✅ Rate limiting: Max 5 login attempts per IP per 15 minutes (lockout after)
- ✅ Failed login attempts logged for security monitoring
- ✅ "Remember Me" option: 30-day cookie with separate token (NOT password hash)

**Password Requirements:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- Check against common passwords list (top 10,000 weak passwords)
- Password strength meter on registration/change password forms

**Role-Based Access Control (RBAC):**
```php
// Business Owner permissions
if ($user->role === 'business_owner') {
    // Full access to all bookings, staff, services, settings
}

// Staff Member permissions
if ($user->role === 'staff_member') {
    // Access only to their own bookings
    // Cannot view other staff schedules
    // Cannot access settings/reports
}
```

**Acceptance Test:**
- ✅ Staff member cannot access `/dashboard/settings` (403 Forbidden)
- ✅ Staff member cannot view bookings assigned to other staff
- ✅ Session expires after 8 hours of inactivity
- ✅ Password reset requires email verification (magic link, 1-hour expiry)

---

### 2.4 Protection Against Common Attacks

#### SQL Injection Prevention
**Requirement:** Zero SQL injection vulnerabilities

**Acceptance Criteria:**
- ✅ **ALWAYS** use WordPress `$wpdb->prepare()` for dynamic queries
- ✅ **NEVER** concatenate user input directly into SQL
- ✅ Use parameterized queries for all database operations

**Example:**
```php
// ✅ CORRECT
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}bookings WHERE customer_email = %s",
    $customer_email
));

// ❌ WRONG (vulnerable to SQL injection)
$results = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}bookings WHERE customer_email = '$customer_email'"
);
```

---

#### Cross-Site Scripting (XSS) Prevention
**Requirement:** All user-generated content sanitized/escaped

**Acceptance Criteria:**
- ✅ Output escaping: Use `esc_html()`, `esc_attr()`, `esc_url()` for display
- ✅ Input sanitization: `sanitize_text_field()`, `sanitize_email()`, `sanitize_textarea_field()`
- ✅ Rich text (service descriptions): Use `wp_kses_post()` to allow safe HTML only
- ✅ JSON responses: Use `wp_send_json()` (auto-escapes and sets correct headers)

**Example:**
```php
// Display customer name safely
echo '<p>Customer: ' . esc_html($booking->customer_name) . '</p>';

// Service description (allows <strong>, <em>, <p>, <br> only)
echo wp_kses_post($service->description);
```

---

#### Cross-Site Request Forgery (CSRF) Prevention
**Requirement:** All state-changing operations require CSRF token

**Acceptance Criteria:**
- ✅ WordPress nonces for admin forms: `wp_nonce_field('action_name')`
- ✅ AJAX requests verify nonce: `check_ajax_referer('action_name')`
- ✅ Frontend dashboard forms include CSRF token (custom implementation)

**Example:**
```php
// Admin form
<form method="post">
    <?php wp_nonce_field('create_service'); ?>
    <input name="service_name" />
    <button type="submit">Create</button>
</form>

// Processing
if (!wp_verify_nonce($_POST['_wpnonce'], 'create_service')) {
    wp_die('Security check failed');
}
```

---

#### Rate Limiting
**Requirement:** Prevent brute force and abuse

**Acceptance Criteria:**

| Endpoint | Limit | Window | Lockout |
|----------|-------|--------|---------|
| Login attempts | 5 attempts | 15 minutes | 30 minutes |
| Booking creation | 10 bookings | 1 hour | N/A (soft limit, show CAPTCHA) |
| Password reset | 3 requests | 1 hour | 24 hours |
| API calls (per IP) | 100 requests | 1 minute | Temporary (1 minute) |

**Implementation:**
- Store attempt counts in WordPress Transients API (auto-expire)
- Show CAPTCHA (hCaptcha or reCAPTCHA v3) after 3 failed login attempts
- Log rate limit violations for security monitoring

**Example:**
```php
function check_rate_limit($ip, $action, $limit, $window) {
    $key = "rate_limit_{$action}_{$ip}";
    $attempts = get_transient($key) ?: 0;
    
    if ($attempts >= $limit) {
        return false; // Rate limited
    }
    
    set_transient($key, $attempts + 1, $window);
    return true; // Allowed
}
```

---

#### Content Security Policy (CSP)
**Requirement:** Mitigate XSS via strict CSP headers

**Acceptance Criteria:**
```http
Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.stripe.com https://api.paypal.com;
    frame-src https://js.stripe.com https://www.paypal.com;
```

**Notes:**
- `'unsafe-inline'` required for Stripe/PayPal inline scripts
- `https:` for img-src allows external images (staff photos, service images)
- Monitor CSP violations via `report-uri` directive (Phase 2)

---

### 2.5 GDPR Compliance (UK/EU Data Protection)

**See Section 7 for full GDPR requirements**

**Critical Security Aspects:**
- ✅ Data breach notification: 72-hour window to notify ICO (UK)
- ✅ Data minimization: Collect only necessary data
- ✅ Right to erasure: Automated customer data deletion (retains bookings metadata for tax compliance)
- ✅ Data portability: Export customer data in JSON format

---

## 3. SCALABILITY REQUIREMENTS

### 3.1 Booking Volume Targets

#### Phase 1 (MVP) - Year 1:
**Target:** 10,000 bookings/month per installation

**Breakdown:**
- 330 bookings/day average
- 50 bookings/hour during peak times
- 15 concurrent users during peak

**Acceptance Criteria:**
- ✅ System handles 50 concurrent booking attempts without degradation
- ✅ Database queries remain <100ms with 10,000 booking records
- ✅ Calendar view renders in <1 second with 500 bookings/month
- ✅ No locking contention (MySQL deadlocks <0.1% of transactions)

**Testing Method:**
- Load testing with 10,000 booking records in database
- Simulate 50 concurrent users booking simultaneously (k6 script)
- Monitor: Response times, database query performance, error rates

---

#### Phase 2 (Growth) - Year 2-3:
**Target:** 50,000 bookings/month per installation

**Breakdown:**
- 1,650 bookings/day average
- 250 bookings/hour during peak times
- 75 concurrent users during peak

**Scalability Strategies:**
- Database query optimization (revisit indexes)
- Implement Redis/Memcached for booking availability cache
- Consider read replicas for reporting queries (if hosted on managed database)
- Optimize calendar rendering (virtual scrolling, date range limits)

---

#### Enterprise Clients - Year 3+:
**Target:** 100,000+ bookings/month

**Requirements:**
- Multi-location support (Phase 2 feature)
- Database sharding by location (if necessary)
- CDN for static assets
- Separate reporting database (analytics moved off primary DB)

---

### 3.2 Concurrent User Capacity

**Requirement:** Support specified concurrent users without performance degradation

| Metric | Phase 1 Target | Phase 2 Target | Enterprise |
|--------|----------------|----------------|------------|
| Concurrent booking attempts | 50 | 150 | 500 |
| Dashboard users (Business Owner/Staff) | 10 | 25 | 100 |
| Public booking page viewers | 200 | 500 | 2,000 |
| API requests/second | 20 | 50 | 200 |

**Acceptance Criteria:**
- ✅ Response times increase by <10% during peak load
- ✅ No failed requests due to server overload (<0.1% error rate)
- ✅ Database connection pool handles load (max 50 connections, Phase 1)

**Infrastructure Recommendations:**

**Phase 1 (10k bookings/month):**
- Shared hosting: 2 CPU cores, 4GB RAM, SSD storage
- Database: MySQL 5.7+, 2GB allocated
- Examples: SiteGround GrowBig, WP Engine Startup

**Phase 2 (50k bookings/month):**
- VPS or managed WordPress: 4 CPU cores, 8GB RAM
- Database: MySQL 8.0, 4GB allocated
- Examples: WP Engine Professional, Kinsta Business 1

**Enterprise (100k+ bookings/month):**
- Dedicated server or cloud infrastructure (AWS/GCP/Azure)
- Load balancer + 2-4 web servers
- Separate database server (8GB+ RAM)
- Redis for caching
- CDN (CloudFlare, AWS CloudFront)

---

### 3.3 Database Growth Management

**Requirement:** Maintain performance as data volume grows

**Projected Growth (per installation):**

| Year | Bookings | Customers | DB Size (est.) |
|------|----------|-----------|----------------|
| Year 1 | 10,000 | 2,000 | 100 MB |
| Year 2 | 35,000 | 5,000 | 300 MB |
| Year 3 | 75,000 | 10,000 | 600 MB |
| Year 5 | 200,000 | 25,000 | 1.5 GB |

**Acceptance Criteria:**
- ✅ Database queries remain <100ms at 200,000 booking records
- ✅ Archival strategy: Move completed bookings >2 years old to archive table (Phase 2)
- ✅ Implement table partitioning by year if necessary (Phase 3, >1M bookings)

**Optimization Strategies:**
- Index maintenance (ANALYZE TABLE monthly)
- Query optimization (use EXPLAIN to identify slow queries)
- Soft-delete bookings (don't physically delete for 7 years, tax compliance)
- Separate reporting queries to read replica (if hosted on managed DB)

---

### 3.4 Email Volume Scalability

**Requirement:** Handle email notification volume without delays

**Projected Email Volume (per installation):**

| Emails per Booking | Phase 1 (10k/month) | Phase 2 (50k/month) |
|-------------------|---------------------|---------------------|
| Confirmation | 1 | 10,000/month | 50,000/month |
| Reminder (24hrs) | 1 | 10,000/month | 50,000/month |
| Staff notification | 1 | 10,000/month | 50,000/month |
| **Total** | **3** | **30,000/month** | **150,000/month** |

**Acceptance Criteria:**
- ✅ Emails queued and sent within 5 minutes of trigger event
- ✅ Bounce rate <2% (valid email validation)
- ✅ Delivery rate >98% (not marked as spam)
- ✅ Transactional email service recommended (SendGrid, Mailgun, Postmark)

**Implementation:**
- Use Action Scheduler (WP plugin) for email queue
- Batch processing: 50 emails per cron run (every 5 minutes)
- Retry failed emails: 3 attempts with exponential backoff
- Monitor bounce rates via transactional email service dashboard

**Transactional Email Service Recommendations:**
- **SendGrid:** 100 emails/day free, $14.95/month for 40k emails
- **Mailgun:** 5,000 emails/month free, $35/month for 50k emails
- **Postmark:** $10/month for 10k emails, $1.25 per additional 1k

---

## 4. WORDPRESS TECHNICAL REQUIREMENTS

### 4.1 WordPress Compatibility

**Requirement:** Support current and previous major WordPress versions

**Supported Versions:**
- ✅ WordPress 6.4+ (current as of Jan 2026)
- ✅ Backwards compatible to WordPress 6.0 (October 2022)
- ✅ Test against WordPress trunk (beta) to prepare for future releases

**WordPress Features Used:**
- REST API (for AJAX endpoints)
- WP Cron (for scheduled tasks)
- Custom Post Types (NOT used - bookings stored in custom tables)
- Transients API (for caching)
- Action Scheduler (external plugin, bundled with ours)

**Acceptance Criteria:**
- ✅ Plugin activates without errors on WP 6.0, 6.1, 6.2, 6.3, 6.4
- ✅ No deprecated function warnings (check with WP_DEBUG enabled)
- ✅ Tested against WP Multisite (Phase 2 - out of scope for Phase 1)

---

### 4.2 PHP Requirements

**Minimum PHP Version:** 8.0  
**Recommended PHP Version:** 8.2+  
**Maximum Tested Version:** 8.3

**Required PHP Extensions:**
- ✅ `mysqli` or `pdo_mysql` (database)
- ✅ `curl` (external API calls: Stripe, PayPal, Google Calendar)
- ✅ `openssl` (encryption, TLS)
- ✅ `json` (API responses)
- ✅ `mbstring` (multi-byte string handling)
- ✅ `gd` or `imagick` (image processing for service photos)
- ✅ `intl` (internationalization, date/time formatting)

**PHP Configuration:**
```ini
; Minimum requirements
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 10M (for service photos)
post_max_size = 10M
```

**Acceptance Criteria:**
- ✅ Plugin checks PHP version on activation, shows error if <8.0
- ✅ Plugin checks for required extensions, shows admin notice if missing
- ✅ No PHP errors/warnings with `error_reporting(E_ALL)`

---

### 4.3 Database Requirements

**Minimum MySQL Version:** 5.7  
**Recommended MySQL Version:** 8.0+  
**Alternative:** MariaDB 10.3+

**Database Privileges Required:**
- ✅ CREATE (for initial table creation)
- ✅ SELECT, INSERT, UPDATE, DELETE (CRUD operations)
- ✅ INDEX (for performance optimization)
- ✅ ALTER (for future schema migrations)

**Storage Requirements:**
- Phase 1: 100 MB per 10,000 bookings (estimated)
- InnoDB storage engine required (ACID compliance, foreign key support)

**Character Set:**
- ✅ `utf8mb4` (supports emojis, international characters)
- ✅ Collation: `utf8mb4_unicode_ci`

**Example Table Creation:**
```sql
CREATE TABLE wp_bookings (
    booking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4.4 Server Requirements

**Minimum Server Specifications:**
- 2 CPU cores (2.0 GHz+)
- 4 GB RAM
- 10 GB SSD storage
- 100 Mbps network connection

**Web Server:**
- ✅ Apache 2.4+ with `mod_rewrite` enabled (for pretty permalinks)
- ✅ Nginx 1.18+ (alternative, with proper rewrite rules)
- ✅ LiteSpeed (supported)

**HTTPS/SSL:**
- ✅ **REQUIRED** for all booking pages (Stripe/PayPal mandate)
- Valid SSL certificate (Let's Encrypt free, or paid)
- TLS 1.2 minimum

**Cron Jobs:**
- ✅ WordPress Cron enabled OR system cron configured
- Recommended: System cron (more reliable than WP Cron)

**System Cron Configuration (recommended):**
```bash
# Disable WordPress Cron in wp-config.php:
define('DISABLE_WP_CRON', true);

# Add to system crontab (runs every 5 minutes):
*/5 * * * * wget -q -O - https://example.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

---

### 4.5 Plugin Dependencies & Conflicts

**Required Plugins (Bundled):**
- Action Scheduler (3.7.0+) - bundled with plugin for email queue

**Optional Plugins (Recommended):**
- WP Mail SMTP (for reliable email delivery)
- Query Monitor (for development/debugging)

**Plugin Conflicts (Known):**
- ⚠️ WooCommerce: Potential conflict if booking page uses checkout shortcodes
- ⚠️ Other booking plugins: Deactivate before installing ours
- ⚠️ Aggressive caching plugins: Exclude booking pages from cache

**Caching Exclusions Required:**
```php
// Exclude booking pages from cache (WP Rocket, W3 Total Cache, etc.)
$exclude_urls = [
    '/book',
    '/dashboard',
    '/my-bookings',
];
```

---

### 4.6 WordPress Coding Standards

**Requirement:** Follow WordPress coding standards and best practices

**Acceptance Criteria:**
- ✅ PHP CodeSniffer with WordPress rulesets (PHPCS)
- ✅ Prefix all functions/classes: `booking_plugin_` or `BookingPlugin\`
- ✅ Text domain: `booking-plugin` (for translations)
- ✅ Escape all output: `esc_html()`, `esc_attr()`, `esc_url()`
- ✅ Sanitize all input: `sanitize_text_field()`, `sanitize_email()`
- ✅ Use WordPress APIs (don't reinvent the wheel):
  - `$wpdb` for database queries
  - `wp_mail()` for emails
  - `wp_enqueue_script()` / `wp_enqueue_style()` for assets
  - Transients API for caching

**Code Quality:**
- PSR-12 coding style (with WordPress exceptions)
- Maximum function length: 50 lines (prefer smaller, single-purpose functions)
- Maximum file length: 500 lines (split into multiple files if longer)
- PHPDoc comments for all public functions/classes

---

## 5. ACCESSIBILITY STANDARDS

### 5.1 WCAG 2.1 Level AA Compliance

**Requirement:** Booking pages and dashboard meet WCAG 2.1 AA standards

**Acceptance Criteria:**

#### Perceivable
**1.1 Text Alternatives:**
- ✅ All images have descriptive alt text
- ✅ Decorative images use `alt=""` (empty alt)
- ✅ Icon buttons have `aria-label` attributes

**1.3 Adaptable:**
- ✅ Semantic HTML5 elements (`<nav>`, `<main>`, `<article>`, `<aside>`)
- ✅ Form labels explicitly associated with inputs (`<label for="input-id">`)
- ✅ Proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`, no skipping)

**1.4 Distinguishable:**
- ✅ Color contrast ratio ≥4.5:1 for normal text
- ✅ Color contrast ratio ≥3:1 for large text (18pt+)
- ✅ Color contrast ratio ≥3:1 for UI components (buttons, inputs)
- ✅ Information not conveyed by color alone (use icons + text)

**Color Contrast Testing:**
- Test with WebAIM Contrast Checker
- Common violations to avoid:
  - ❌ Grey text (#888) on white background (3.9:1 - fails)
  - ✅ Dark grey (#555) on white (8.6:1 - passes)
  - ❌ Light blue links (#00BFFF) on white (2.8:1 - fails)
  - ✅ Dark blue links (#0056B3) on white (8.2:1 - passes)

---

#### Operable
**2.1 Keyboard Accessible:**
- ✅ All functionality available via keyboard (no mouse-only actions)
- ✅ Logical tab order (left-to-right, top-to-bottom)
- ✅ Visible focus indicators (`:focus` styles, ≥2px outline)
- ✅ No keyboard traps (can navigate in and out of all components)

**2.2 Enough Time:**
- ✅ Session timeout warning: 2 minutes before expiry
- ✅ Option to extend session (button click)
- ✅ No auto-advancing carousels (or provide pause button)

**2.3 Seizures:**
- ✅ No content flashes more than 3 times per second

**2.4 Navigable:**
- ✅ Skip to main content link (first focusable element)
- ✅ Descriptive page titles (`<title>Book Appointment - [Business Name]</title>`)
- ✅ Link purpose clear from text alone (avoid "Click Here")
- ✅ Breadcrumb navigation for dashboard

---

#### Understandable
**3.1 Readable:**
- ✅ Language declared in HTML: `<html lang="en-GB">`
- ✅ Language changes marked: `<span lang="fr">Rendez-vous</span>`

**3.2 Predictable:**
- ✅ Navigation consistent across all pages
- ✅ Form labels consistent (don't change placeholder text on focus)
- ✅ No automatic context changes (e.g., form submits on select change)

**3.3 Input Assistance:**
- ✅ Form validation errors clearly identified
- ✅ Error messages suggest how to fix (e.g., "Email must include @")
- ✅ Required fields marked with asterisk (*) and `aria-required="true"`
- ✅ Error summary at top of form (for screen readers)

**Example:**
```html
<label for="email">
    Email Address <span class="required">*</span>
</label>
<input 
    type="email" 
    id="email" 
    name="email" 
    required 
    aria-required="true"
    aria-describedby="email-error"
/>
<span id="email-error" class="error" role="alert">
    Please enter a valid email address
</span>
```

---

#### Robust
**4.1 Compatible:**
- ✅ Valid HTML5 (no parsing errors, test with W3C Validator)
- ✅ Unique `id` attributes (no duplicates)
- ✅ ARIA attributes used correctly (follow WAI-ARIA spec)

---

### 5.2 Screen Reader Support

**Requirement:** Full functionality available to screen reader users

**Tested Screen Readers:**
- ✅ NVDA (Windows, free)
- ✅ JAWS (Windows, paid)
- ✅ VoiceOver (macOS, iOS)
- ✅ TalkBack (Android)

**Acceptance Criteria:**
- ✅ Booking flow completable using screen reader only (no sighted assistance)
- ✅ All interactive elements have accessible names
- ✅ Form errors announced immediately (`role="alert"`)
- ✅ Loading states communicated (`aria-live="polite"`)
- ✅ Calendar widget fully navigable via screen reader

**Calendar Accessibility:**
```html
<div 
    role="application" 
    aria-label="Calendar date picker"
    aria-describedby="calendar-instructions"
>
    <div id="calendar-instructions" class="sr-only">
        Use arrow keys to navigate dates. 
        Press Enter to select a date. 
        Press Escape to close calendar.
    </div>
    <!-- Calendar grid -->
</div>
```

**ARIA Live Regions:**
```html
<!-- Loading indicator -->
<div role="status" aria-live="polite" aria-atomic="true">
    <span class="sr-only">Loading available times...</span>
    <span class="spinner" aria-hidden="true"></span>
</div>

<!-- Error messages -->
<div role="alert" aria-live="assertive">
    This time slot is no longer available.
</div>
```

---

### 5.3 Keyboard Navigation

**Requirement:** Complete booking flow using keyboard only (no mouse)

**Acceptance Criteria:**

**Tab Order:**
1. Skip to main content link (always first)
2. Header navigation
3. Service selection (radio buttons or links)
4. Staff selection
5. Calendar date picker (keyboard navigable grid)
6. Time slot buttons
7. Contact form fields
8. Payment method selection
9. Submit button

**Keyboard Shortcuts (Calendar):**
- Arrow keys: Navigate dates
- Enter/Space: Select date
- Escape: Close calendar
- Home: First day of month
- End: Last day of month
- Page Up/Down: Previous/next month

**Focus Management:**
- ✅ Visible focus indicator on all interactive elements
- ✅ Focus moves logically (no unexpected jumps)
- ✅ Focus trapped in modal dialogs (can't tab outside)
- ✅ Focus returns to trigger element when modal closes

**Example CSS:**
```css
/* Visible focus indicator */
a:focus, button:focus, input:focus {
    outline: 2px solid #005FB8; /* UK Gov blue */
    outline-offset: 2px;
}

/* Never remove focus outlines globally */
/* ❌ NEVER DO THIS: *:focus { outline: none; } */
```

---

### 5.4 Mobile Accessibility

**Requirement:** Touch-friendly, accessible on mobile devices

**Acceptance Criteria:**
- ✅ Minimum touch target size: 44x44 CSS pixels (Apple HIG, WCAG 2.5.5)
- ✅ Adequate spacing between touch targets (8px minimum)
- ✅ No horizontal scrolling required (responsive design)
- ✅ Pinch-to-zoom enabled (don't disable viewport zoom)

**Touch Target Examples:**
```html
<!-- ✅ CORRECT: Button is large enough -->
<button class="time-slot">
    9:00 AM
</button>
<style>
.time-slot {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
}
</style>

<!-- ❌ WRONG: Link too small -->
<a href="#">Cancel</a> (10px text = ~20px touch target - too small)
```

**Viewport Configuration:**
```html
<!-- ✅ CORRECT: Allows zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- ❌ WRONG: Disables zoom (accessibility issue) -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

---

### 5.5 Accessibility Testing Checklist

**Automated Testing:**
- ✅ aXe DevTools browser extension (catches ~30% of issues)
- ✅ WAVE Web Accessibility Evaluation Tool
- ✅ Lighthouse Accessibility audit (target score: ≥95)
- ✅ Pa11y CI (automated testing in build pipeline)

**Manual Testing:**
- ✅ Keyboard-only navigation test (unplug mouse)
- ✅ Screen reader test (NVDA on Windows, VoiceOver on Mac)
- ✅ Color contrast check (WebAIM Contrast Checker)
- ✅ Form validation test (trigger errors, check announcements)
- ✅ Mobile touch target test (use finger, not stylus)

**User Testing:**
- Phase 2: Recruit users with disabilities to test booking flow
- Incorporate feedback into design iterations

---

## 6. BROWSER & DEVICE COMPATIBILITY

### 6.1 Supported Browsers

**Desktop Browsers:**
| Browser | Minimum Version | Market Share (UK 2025) | Notes |
|---------|----------------|------------------------|-------|
| Google Chrome | 110+ (2023) | ~60% | Evergreen browser, auto-updates |
| Mozilla Firefox | 110+ (2023) | ~10% | Evergreen browser, auto-updates |
| Microsoft Edge | 110+ (2023) | ~15% | Chromium-based, evergreen |
| Safari (macOS) | 16.0+ (2022) | ~10% | Requires special attention (WebKit) |
| Opera | 95+ (2023) | ~2% | Chromium-based |

**Mobile Browsers:**
| Browser | Minimum Version | Market Share (UK 2025) | Notes |
|---------|----------------|------------------------|-------|
| Safari (iOS) | iOS 15+ (2021) | ~50% mobile | Webkit, strict privacy |
| Chrome (Android) | 110+ | ~40% mobile | Evergreen |
| Samsung Internet | 20+ | ~5% mobile | Chromium-based |

**Browsers NOT Supported:**
- ❌ Internet Explorer 11 (obsolete, <1% market share)
- ❌ Opera Mini (limited JavaScript support)
- ❌ UC Browser (non-standard rendering)

**Acceptance Criteria:**
- ✅ Booking flow works identically across all supported browsers
- ✅ No browser-specific bugs in critical path (service → staff → date/time → payment)
- ✅ Layout does not break on any supported browser
- ✅ All JavaScript features function (polyfills if necessary)

---

### 6.2 Device Compatibility

**Supported Devices:**

**Desktop/Laptop:**
- Minimum resolution: 1366x768 (most common laptop resolution)
- Tested resolutions: 1920x1080, 2560x1440, 3840x2160 (4K)

**Tablet:**
- iPad (9.7" and larger), iPad Pro
- Android tablets (10" and larger)
- Tested resolutions: 768x1024 (portrait), 1024x768 (landscape)

**Mobile Phones:**
- iPhone SE (2020) and newer (375x667px minimum)
- Android phones (360x640px minimum)
- Tested devices:
  - iPhone 12, 13, 14, 15 series
  - Samsung Galaxy S21, S22, S23, S24
  - Google Pixel 6, 7, 8

**Acceptance Criteria:**
- ✅ Responsive design adapts to all screen sizes (320px to 3840px width)
- ✅ No horizontal scrolling on any device
- ✅ Touch targets ≥44x44px on mobile
- ✅ Text readable without zooming (minimum 16px font size on mobile)

---

### 6.3 Responsive Design Breakpoints

**Requirement:** Mobile-first responsive design

**Breakpoints:**
```css
/* Mobile first (default styles) */
/* 320px - 767px */

/* Tablet portrait */
@media (min-width: 768px) { /* iPad portrait */ }

/* Tablet landscape / small desktop */
@media (min-width: 1024px) { /* iPad landscape */ }

/* Desktop */
@media (min-width: 1280px) { /* Standard desktop */ }

/* Large desktop */
@media (min-width: 1920px) { /* Full HD */ }
```

**Layout Adaptations:**

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|----------------|---------------------|-------------------|
| Service grid | 1 column | 2 columns | 3 columns |
| Staff selection | List view | Grid (2 cols) | Grid (3-4 cols) |
| Calendar | Compact, single month | Full month | Full month + sidebar |
| Time slots | Vertical list | Grid (2 cols) | Grid (3-4 cols) |
| Dashboard sidebar | Bottom nav | Collapsible | Always visible |

**Touch vs Click:**
- Mobile: Larger buttons, swipe gestures for calendar navigation
- Desktop: Hover states, smaller spacing, keyboard shortcuts

---

### 6.4 Progressive Enhancement Strategy

**Requirement:** Core functionality works even with JavaScript disabled (graceful degradation)

**Without JavaScript (Fallback):**
- ✅ Booking form submits via traditional POST (no AJAX)
- ✅ Calendar falls back to date input: `<input type="date">`
- ✅ Time slot selection: Dropdown instead of interactive grid
- ✅ Success/error messages via page reload (no toast notifications)

**With JavaScript (Enhanced):**
- ✅ Real-time availability checking
- ✅ Interactive calendar widget
- ✅ Inline form validation
- ✅ Smooth page transitions
- ✅ Auto-save to session storage

**Acceptance Criteria:**
- ✅ Core booking flow completable with JavaScript disabled (test with JS off)
- ✅ Form validation works server-side (don't rely solely on client-side)
- ✅ No critical features break without JavaScript

---

### 6.5 Browser Feature Detection

**Requirement:** Detect and handle browser capability differences

**Polyfills Required (for older browsers):**
- `Promise` (fetch API fallback)
- `IntersectionObserver` (lazy loading images)
- `CustomEvent` (for event-driven architecture)

**Feature Detection (not User-Agent sniffing):**
```javascript
// ✅ CORRECT: Feature detection
if ('IntersectionObserver' in window) {
    // Use IntersectionObserver for lazy loading
} else {
    // Load all images immediately
}

// ❌ WRONG: User-Agent sniffing
if (navigator.userAgent.includes('Chrome')) {
    // This is unreliable and fragile
}
```

**CSS Feature Queries:**
```css
/* Modern CSS Grid layout */
@supports (display: grid) {
    .service-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

/* Fallback for older browsers */
@supports not (display: grid) {
    .service-grid {
        display: flex;
        flex-wrap: wrap;
    }
}
```

---

## 7. DATA PRIVACY & GDPR

### 7.1 GDPR Compliance Overview

**Requirement:** Full compliance with UK GDPR and EU GDPR (post-Brexit)

**Regulatory Bodies:**
- UK: Information Commissioner's Office (ICO)
- EU: National data protection authorities (varies by country)

**Key Principles:**
1. Lawfulness, fairness, transparency
2. Purpose limitation
3. Data minimization
4. Accuracy
5. Storage limitation
6. Integrity and confidentiality
7. Accountability

---

### 7.2 Lawful Basis for Processing

**Customer Data (Booking):**
**Lawful Basis:** Contractual necessity (GDPR Art. 6(1)(b))
- Processing is necessary to fulfill booking contract
- Customer cannot book without providing name, email, phone

**Marketing Communications:**
**Lawful Basis:** Consent (GDPR Art. 6(1)(a))
- Explicit opt-in checkbox (unchecked by default)
- Clear explanation of what they're consenting to
- Easy to withdraw consent (unsubscribe link in every email)

**Example Consent Checkbox:**
```html
<label>
    <input type="checkbox" name="marketing_consent" value="1" />
    I'd like to receive special offers and updates 
    (You can unsubscribe anytime)
</label>
```

---

### 7.3 Data Minimization

**Requirement:** Collect only data necessary for booking functionality

**Customer Data Collected:**
| Field | Required? | Purpose | Retention |
|-------|-----------|---------|-----------|
| First Name | Yes | Booking identification | 7 years |
| Last Name | Yes | Booking identification | 7 years |
| Email Address | Yes | Confirmation, reminders | 7 years |
| Phone Number | Yes | Emergency contact | 7 years |
| Special Requests | No | Service personalization | 7 years |
| Marketing Consent | No | Email marketing | Until withdrawn |

**Data NOT Collected (Phase 1):**
- ❌ Date of birth (unless required for specific service, e.g., age-restricted)
- ❌ Gender (unless required for service selection)
- ❌ Full address (unless mobile service requires it - Phase 2)
- ❌ National Insurance number / passport number (never)

**Acceptance Criteria:**
- ✅ Privacy Policy explains exactly what data is collected and why
- ✅ Optional fields clearly marked as optional
- ✅ No "nice-to-have" data collected

---

### 7.4 Right to Access (Subject Access Request)

**Requirement:** Customers can request all data held about them

**GDPR Article 15 - Right of Access**

**Acceptance Criteria:**
- ✅ Customer can submit data access request via email or dashboard
- ✅ Request fulfilled within 30 days (free of charge)
- ✅ Data provided in machine-readable format (JSON or CSV)

**Data Export Contents:**
- Personal details (name, email, phone)
- Booking history (all bookings: past, future, cancelled)
- Payment history (transaction IDs, amounts, dates)
- Marketing consent status
- Account creation date
- Last login date (if registered account)

**Example Export (JSON):**
```json
{
  "customer_id": 12345,
  "personal_info": {
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah@example.com",
    "phone": "+447123456789"
  },
  "bookings": [
    {
      "booking_id": 67890,
      "service": "Women's Haircut",
      "staff": "Emma Thompson",
      "date": "2026-01-25",
      "time": "10:00",
      "status": "confirmed",
      "amount_paid": 35.00
    }
  ],
  "marketing_consent": true,
  "consent_date": "2026-01-15T14:30:00Z",
  "account_created": "2026-01-15T14:30:00Z"
}
```

---

### 7.5 Right to Rectification

**Requirement:** Customers can correct inaccurate data

**GDPR Article 16 - Right to Rectification**

**Acceptance Criteria:**
- ✅ Customer can update name, phone number in dashboard
- ✅ Email address changes require verification (send confirmation to new email)
- ✅ Changes reflected immediately in system

**Locked Fields (Cannot Self-Modify):**
- Email address (locked after account creation - prevents account takeover)
  - Workaround: Contact business owner to change email
- Booking history (audit trail - cannot edit past bookings)

---

### 7.6 Right to Erasure ("Right to be Forgotten")

**Requirement:** Customers can request deletion of their data

**GDPR Article 17 - Right to Erasure**

**Acceptance Criteria:**
- ✅ Customer can request account deletion via dashboard or email
- ✅ Deletion processed within 30 days
- ✅ Confirmation email sent after deletion

**What Gets Deleted:**
- Personal identifiable information (name, email, phone)
- Marketing consent records
- Login credentials (password hash, session tokens)
- Special requests / notes

**What Gets Retained (Anonymized):**
- Booking records (for tax/accounting compliance - 7 years UK law)
- Payment transaction IDs (for financial audits)
- Anonymization: Replace name with "Deleted Customer", email with "deleted@example.com"

**Exceptions to Deletion:**
- **Legal obligation:** Tax records must be kept 7 years (HMRC requirement)
- **Active booking:** Cannot delete account with upcoming booking (must cancel first)
- **Dispute resolution:** Retain data if legal claim pending

**Example Deletion Process:**
```sql
-- Anonymize customer data (retain booking metadata)
UPDATE wp_bookings_customers
SET 
    first_name = 'Deleted',
    last_name = 'Customer',
    email = CONCAT('deleted_', customer_id, '@example.com'),
    phone = NULL,
    marketing_consent = 0
WHERE customer_id = 12345;

-- Delete login credentials
DELETE FROM wp_bookings_customer_auth WHERE customer_id = 12345;
```

---

### 7.7 Right to Data Portability

**Requirement:** Customers can export data in machine-readable format

**GDPR Article 20 - Right to Data Portability**

**Acceptance Criteria:**
- ✅ Customer can download data export from dashboard
- ✅ Export format: JSON or CSV (customer choice)
- ✅ Export includes all personal data + booking history
- ✅ Export ready within 5 minutes (generated on-demand)

**Export Trigger:**
- Dashboard: "Settings" → "Privacy" → "Download My Data" button
- Generates downloadable file immediately (no email delay)

---

### 7.8 Data Retention Policy

**Requirement:** Clear policy on how long data is kept

**Retention Periods:**
| Data Type | Retention Period | Reason |
|-----------|-----------------|--------|
| Booking records | 7 years | HMRC tax compliance (UK law) |
| Payment transaction data | 7 years | Financial audit requirements |
| Customer personal data | 7 years OR until deletion request | Contractual + legal |
| Marketing consent records | Until withdrawn + 1 year | Prove consent existed |
| Email logs (sent emails) | 2 years | Troubleshooting, dispute resolution |
| Login session data | 8 hours OR logout | Security |
| Failed login attempts | 24 hours | Rate limiting |

**Automatic Deletion:**
- Inactive accounts (no bookings in 3 years): Prompt customer to confirm account
- If no response in 30 days → Auto-delete personal data (anonymize bookings)

**Privacy Policy Statement:**
> "We retain your booking and payment data for 7 years to comply with UK tax law (HMRC requirement). After 7 years, your personal information is automatically deleted, though anonymized booking records may be retained for statistical purposes."

---

### 7.9 Privacy Policy Requirements

**Requirement:** Clear, accessible Privacy Policy on website

**GDPR Article 13 - Information to be Provided (Transparency)**

**Privacy Policy Must Include:**
1. **Data Controller Identity:**
   - Business name, address, contact email
   - Data Protection Officer (if applicable - likely not for SMBs)

2. **What Data We Collect:**
   - Name, email, phone number
   - Booking details (service, date, time, staff)
   - Payment information (via Stripe/PayPal - NOT stored by us)

3. **Why We Collect It (Lawful Basis):**
   - Contractual necessity: To fulfill your booking
   - Legitimate interest: To prevent no-shows, improve service
   - Consent: Marketing emails (opt-in only)

4. **Who We Share It With:**
   - Payment processors (Stripe, PayPal) - PCI compliant
   - Email service provider (SendGrid, Mailgun) - for notifications
   - Google Calendar (if staff member enabled sync) - with staff consent

5. **How Long We Keep It:**
   - 7 years (tax compliance)
   - Or until you request deletion (with exceptions above)

6. **Your Rights:**
   - Right to access your data
   - Right to correct inaccurate data
   - Right to delete your data (with exceptions)
   - Right to export your data
   - Right to object to marketing emails

7. **How to Exercise Rights:**
   - Email: privacy@clientbusiness.co.uk
   - Dashboard: "Settings" → "Privacy"

8. **How to Complain:**
   - UK: Information Commissioner's Office (ICO) - ico.org.uk
   - EU: Your national data protection authority

**Acceptance Criteria:**
- ✅ Privacy Policy linked in footer of every page
- ✅ Privacy Policy linked during booking checkout (before payment)
- ✅ Privacy Policy written in plain English (not legal jargon)
- ✅ Privacy Policy updated whenever data practices change

**Example Footer Link:**
```html
<footer>
    <p>
        &copy; 2026 [Client Business Name]. 
        <a href="/privacy-policy">Privacy Policy</a> | 
        <a href="/terms-and-conditions">Terms & Conditions</a>
    </p>
</footer>
```

---

### 7.10 Cookies & Consent

**Requirement:** Comply with UK PECR (Privacy and Electronic Communications Regulations)

**Cookies Used:**
1. **Strictly Necessary (No Consent Required):**
   - PHP session cookie: `PHPSESSID` (booking flow state)
   - Dashboard auth cookie: `booking_auth_token` (login session)


**Phase 1 Implementation:**
- No analytics cookies → No cookie banner required
- Only strictly necessary cookies used

---

### 7.11 Data Breach Response Plan

**Requirement:** Documented process for handling data breaches

**GDPR Article 33 - Notification of Personal Data Breach**

**Timeline:**
- Detect breach: Immediate (monitoring, alerts)
- Assess severity: Within 24 hours
- Notify ICO: Within 72 hours (if high risk to individuals)
- Notify affected customers: Without undue delay (if high risk)

**What Constitutes a Breach:**
- Unauthorized access to customer database
- Lost/stolen laptop with unencrypted customer data
- Accidental public exposure of data (e.g., misconfigured S3 bucket)
- Successful phishing attack on admin account

**Response Steps:**
1. **Contain:** Immediately revoke compromised credentials, shut down affected systems
2. **Assess:** Determine what data was accessed, how many customers affected
3. **Notify:** Report to ICO within 72 hours (use ICO's online reporting tool)
4. **Notify Customers:** If high risk (e.g., passwords exposed), email all affected customers
5. **Document:** Keep detailed records of breach, response actions, timeline
6. **Prevent:** Implement measures to prevent similar breach (e.g., enable 2FA)

**ICO Notification Contents:**
- Nature of breach (e.g., "unauthorized access to customer database")
- Categories of data affected (names, emails, booking history)
- Number of customers affected (approximate if unknown)
- Likely consequences for individuals
- Measures taken to address breach
- Contact details for Data Protection Officer (or business owner)

**Customer Notification Example:**
> Subject: Important Security Notice - Your [Business Name] Account
> 
> We're writing to inform you of a security incident that may have affected your account. On [date], we discovered unauthorized access to our customer database. We immediately secured the system and are working with security experts to investigate.
> 
> **What data was affected:**
> - Name, email address, phone number
> - Booking history
> 
> **What data was NOT affected:**
> - Passwords (encrypted)
> - Payment card details (we don't store these)
> 
> **What we're doing:**
> - We've reset all passwords as a precaution
> - We've reported this to the ICO
> - We're implementing additional security measures
> 
> **What you should do:**
> - Reset your password: [link]
> - Watch for phishing emails (we'll never ask for your password via email)
> - Monitor your accounts for suspicious activity
> 
> We sincerely apologize for this incident. If you have questions, contact us at privacy@clientbusiness.co.uk.

---

### 7.12 Third-Party Data Processors (Sub-Processors)

**Requirement:** Document all third parties that process customer data

**GDPR Article 28 - Processor**

**Data Processors Used:**
| Processor | Purpose | Data Shared | GDPR Compliant? | DPA Signed? |
|-----------|---------|-------------|-----------------|-------------|
| Stripe | Payment processing | Name, email | ✅ Yes | ✅ Yes (via ToS) |
| PayPal | Payment processing | Name, email | ✅ Yes | ✅ Yes (via ToS) |
| Google Calendar | Calendar sync | Booking details | ✅ Yes | ✅ Yes (via Google Cloud) |
| SendGrid / Mailgun | Email delivery | Name, email | ✅ Yes | ✅ Yes (via ToS) |
| [Hosting Provider] | Infrastructure | All data | ✅ Yes | ✅ Yes (check hosting agreement) |

**Data Processing Agreement (DPA) Requirements:**
- Must be in place BEFORE processing starts
- Specifies: What data is processed, for what purpose, retention period
- Processor must implement appropriate security measures
- Processor must notify us of any data breaches

**Acceptance Criteria:**
- ✅ List all sub-processors in Privacy Policy
- ✅ Verify each sub-processor is GDPR compliant (check their website/docs)
- ✅ Data Processing Agreements obtained (or covered by Terms of Service)

---

## 8. EMAIL & NOTIFICATION INFRASTRUCTURE

### 8.1 Email Deliverability Requirements

**Requirement:** >98% email delivery rate (not marked as spam)

**Acceptance Criteria:**
- ✅ SPF record configured: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`
- ✅ DKIM signing enabled (via SendGrid, Mailgun, or hosting provider)
- ✅ DMARC policy published: `v=DMARC1; p=quarantine; rua=mailto:dmarc@clientbusiness.co.uk`
- ✅ PTR record (reverse DNS) matches sending IP
- ✅ Sending from business domain (e.g., bookings@clientbusiness.co.uk, NOT noreply@gmail.com)

**Testing:**
- Send test email to Mail-Tester.com (target score: 10/10)
- Monitor bounce rate (should be <2%)
- Monitor spam complaint rate (should be <0.1%)

---

### 8.2 Transactional vs Marketing Emails

**Transactional Emails (No Opt-In Required):**
- Booking confirmation
- Payment receipt
- Booking reminder (24hrs before)
- Cancellation confirmation
- Rescheduling confirmation
- Password reset
- Dashboard login notification

**Marketing Emails (Requires Explicit Consent):**
- Special offers
- New service announcements
- Monthly newsletters
- Re-engagement campaigns ("We miss you!")

**Acceptance Criteria:**
- ✅ Transactional emails sent regardless of marketing consent
- ✅ Marketing emails ONLY sent to customers who opted in
- ✅ Every marketing email includes prominent "Unsubscribe" link
- ✅ Unsubscribe processed immediately (within 10 seconds)
- ✅ Unsubscribe does NOT require login (one-click unsubscribe)

---

### 8.3 Email Templates

**Requirement:** Professional, branded, mobile-responsive email templates

**Design Requirements:**
- ✅ Mobile-responsive (50%+ of emails opened on mobile)
- ✅ Maximum width: 600px (standard email client width)
- ✅ Inline CSS (external stylesheets not supported in many email clients)
- ✅ Alt text for all images (images often blocked by default)
- ✅ Plain text fallback (for accessibility)

**Template Variables:**
- `{{customer_name}}` - Customer first name
- `{{service_name}}` - Service booked
- `{{staff_name}}` - Staff member assigned
- `{{booking_date}}` - Human-readable date (e.g., "Monday, 25 January 2026")
- `{{booking_time}}` - Time (e.g., "10:00 AM")
- `{{business_name}}` - Client business name
- `{{business_logo}}` - Logo URL
- `{{booking_id}}` - Booking reference number
- `{{cancel_url}}` - Magic link to cancel booking
- `{{reschedule_url}}` - Magic link to reschedule

**Example Confirmation Email (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #005FB8; border-radius: 8px 8px 0 0;">
                            <img src="{{business_logo}}" alt="{{business_name}}" style="max-width: 200px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <h1 style="margin: 0 0 20px; font-size: 24px; color: #333;">
                                ✓ Booking Confirmed
                            </h1>
                            <p style="margin: 0 0 15px; font-size: 16px; color: #555;">
                                Hi {{customer_name}},
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; color: #555;">
                                Your appointment has been confirmed! We look forward to seeing you.
                            </p>
                            
                            <!-- Booking Details Box -->
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #777;">Service:</p>
                                        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #333;">{{service_name}}</p>
                                        
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #777;">With:</p>
                                        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #333;">{{staff_name}}</p>
                                        
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #777;">Date & Time:</p>
                                        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #333;">{{booking_date}} at {{booking_time}}</p>
                                        
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #777;">Booking Reference:</p>
                                        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #005FB8;">{{booking_id}}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Action Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="{{cancel_url}}" style="display: inline-block; padding: 12px 30px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px;">
                                            Cancel Booking
                                        </a>
                                    </td>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="{{reschedule_url}}" style="display: inline-block; padding: 12px 30px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px;">
                                            Reschedule
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; font-size: 14px; color: #777;">
                                If you have any questions, reply to this email or call us at {{business_phone}}.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #999;">
                                {{business_name}}<br>
                                {{business_address}}<br>
                                {{business_phone}}
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #999;">
                                You're receiving this email because you have a booking with us.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

### 8.4 Email Sending Infrastructure

**Recommended Setup:**
- Transactional email service (SendGrid, Mailgun, Postmark)
- Fallback to WordPress `wp_mail()` (SMTP)

**Why NOT Use WordPress Default Mailer:**
- Shared hosting often blocks SMTP port 25
- Emails frequently marked as spam
- No delivery tracking/logging
- No retry logic for failed sends

**SendGrid Configuration (Example):**
```php
// wp-config.php
define('SENDGRID_API_KEY', 'SG.xxxxxxxxxxxxxxxxxxxxx');

// Send email via SendGrid
function send_booking_email($to, $subject, $html_body, $plain_text_body) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.sendgrid.com/v3/mail/send');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'personalizations' => [[
            'to' => [['email' => $to]],
            'subject' => $subject,
        ]],
        'from' => ['email' => 'bookings@clientbusiness.co.uk', 'name' => 'Client Business'],
        'content' => [
            ['type' => 'text/plain', 'value' => $plain_text_body],
            ['type' => 'text/html', 'value' => $html_body],
        ],
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . SENDGRID_API_KEY,
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $http_code === 202; // SendGrid returns 202 Accepted
}
```

---

### 8.5 Email Queue & Retry Logic

**Requirement:** Reliable email delivery even during peak times

**Implementation:**
- Use Action Scheduler (WordPress plugin) for email queue
- Batch processing: 50 emails per cron run (every 5 minutes)
- Retry logic: 3 attempts with exponential backoff (5 min, 15 min, 60 min)

**Example:**
```php
// Queue email for sending
function queue_booking_confirmation($booking_id) {
    as_enqueue_async_action(
        'booking_send_confirmation_email',
        ['booking_id' => $booking_id],
        'booking_emails'
    );
}

// Process email queue (runs every 5 minutes)
add_action('booking_send_confirmation_email', function($booking_id) {
    $booking = get_booking($booking_id);
    $success = send_booking_email(
        $booking->customer_email,
        'Booking Confirmation',
        render_email_template('confirmation', $booking),
        render_email_template('confirmation_plain', $booking)
    );
    
    if (!$success) {
        // Retry (Action Scheduler handles this automatically)
        throw new Exception('Email send failed');
    }
    
    // Log success
    log_email_sent($booking_id, 'confirmation');
}, 10, 1);
```

---

## 9. BACKUP & RECOVERY

### 9.1 Backup Requirements

**Requirement:** Automated daily backups with point-in-time recovery

**Backup Frequency:**
- Database: Daily (full backup at 2:00 AM UTC)
- Files (uploads, plugin files): Weekly (full backup)
- Incremental backups: Every 6 hours (database changes only)

**Backup Retention:**
- Daily backups: 30 days
- Weekly backups: 90 days
- Monthly backups: 1 year

**Backup Storage:**
- Off-site storage (NOT on same server as WordPress)
- Amazon S3, Google Cloud Storage, or hosting provider's backup service
- Encrypted backups (AES-256)

---

### 9.2 Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

**RTO (How quickly can we restore?):**
- Critical failure (database corruption): 4 hours
- Complete site loss: 8 hours

**RPO (How much data can we lose?):**
- Maximum acceptable data loss: 6 hours (since last incremental backup)
- Critical data (bookings): Real-time replication recommended (Phase 2)

---

### 9.3 Disaster Recovery Testing

**Requirement:** Test backup restoration quarterly

**Test Procedure:**
1. Create staging environment
2. Restore latest backup to staging
3. Verify all functionality works (create test booking)
4. Document any issues
5. Update disaster recovery plan if needed

---

## 10. MONITORING & LOGGING

### 10.1 Application Monitoring

**Requirement:** Real-time monitoring of plugin health

**Metrics to Monitor:**
- Response time (API endpoints, page load)
- Error rate (% of failed requests)
- Database query performance
- Email delivery rate
- Payment success rate (Stripe/PayPal)

**Recommended Tools:**
- New Relic APM (paid)
- Query Monitor (free WordPress plugin, dev only)
- Sentry (error tracking, free tier available)

**Alerts:**
- Error rate >1% → Email admin immediately
- Response time >3 seconds → Email admin
- Payment failure rate >5% → SMS alert (critical)

---

### 10.2 Error Logging

**Requirement:** Log all errors for debugging

**What to Log:**
- PHP errors (warnings, notices, fatal errors)
- Database errors (query failures, deadlocks)
- Payment failures (Stripe/PayPal API errors)
- Email send failures
- Authentication failures (failed logins)

**What NOT to Log:**
- Customer passwords (NEVER log passwords)
- Full credit card numbers (PCI violation)
- Session tokens (security risk)

**Log Storage:**
- WordPress debug.log (development only)
- Sentry or similar (production)
- Rotate logs daily, keep 30 days

**Example Logging:**
```php
// Log error to Sentry
if ($payment_failed) {
    \Sentry\captureMessage('Payment failed', [
        'level' => 'error',
        'extra' => [
            'booking_id' => $booking_id,
            'stripe_error' => $stripe_error_message,
            'customer_email' => mask_email($customer_email), // sarah@example.com → s***@e***.com
        ],
    ]);
}
```

---

### 10.3 Audit Trail (Business Owner Actions)

**Requirement:** Log administrative actions for security

**Actions to Audit:**
- Service created/edited/deleted
- Staff member added/edited/removed
- Booking cancelled (manual cancellation by admin)
- Refund issued
- Settings changed (pricing, payment gateway, cancellation policy)

**Audit Log Fields:**
- Timestamp
- Action performed
- User who performed action (Business Owner ID)
- IP address
- Before/after values (for edits)

**Retention:**
- Audit logs: 1 year
- Security-related logs (failed logins): 90 days

---

## 11. API & INTEGRATION STANDARDS

### 11.1 REST API Design (Phase 2)

**Phase 1:** No public REST API (internal AJAX endpoints only)

**Phase 2 Preparation:**
- Database schema designed to support clean REST API
- Endpoints will follow RESTful conventions:
  - `GET /api/v1/services` - List services
  - `POST /api/v1/bookings` - Create booking
  - `GET /api/v1/bookings/:id` - Get booking details
  - `PATCH /api/v1/bookings/:id` - Update booking
  - `DELETE /api/v1/bookings/:id` - Cancel booking

**API Authentication (Phase 2):**
- OAuth 2.0 or API keys
- Rate limiting: 100 requests/hour per key

---

### 11.2 Webhook Standards

**Stripe Webhook:**
- Endpoint: `/wp-json/bookings/v1/stripe-webhook`
- Verify signature: `stripe_signature` header
- Return 200 OK immediately (process async)

**PayPal Webhook:**
- Endpoint: `/wp-json/bookings/v1/paypal-webhook`
- Verify signature: PayPal IPN validation
- Return 200 OK immediately

---

### NFR-9.5: Development Environment Requirements

#### Minimum System Requirements

**PHP:**
- Version: 8.0 or higher (8.2 recommended)
- Extensions: mysqli, json, curl, openssl, mbstring
- Memory limit: 256MB minimum (512MB recommended)

**Database:**
- MySQL 5.7+ OR MariaDB 10.3+
- InnoDB storage engine
- utf8mb4 character set support

**WordPress:**
- Version: 6.0 or higher (6.4 recommended)
- Multisite: Not required (single-site installations)

**Composer:**
- For PHP dependency management
- Version: 2.0 or higher

**Node.js and npm:**
- Node.js 18+ (LTS version recommended)
- npm 9+ (comes with Node.js)
- Required for: wp-env, build tools, package management

**Docker Desktop:**
- Required for wp-env testing environment
- Version: Latest stable release
- Platform: Windows 10/11, macOS, Linux

---

#### Supported Development Environments

**Recommended: Local by Flywheel + wp-env (Hybrid)**
- Local by Flywheel for daily development (visual interface)
- wp-env for automated PHPUnit testing (Docker-based)
- Prevents test data from polluting development database
- CI/CD-ready testing environment

**Alternative Option 1: Local by Flywheel Only**
- Suitable for development and manual testing
- Requires manual PHPUnit configuration
- Tests run against development database (not isolated)

**Alternative Option 2: Docker Compose**
- Full Docker setup (WordPress + MySQL + PHPUnit)
- More complex initial setup
- Suitable for advanced users familiar with Docker

**Alternative Option 3: XAMPP/MAMP**
- Traditional local server stack
- Requires manual WordPress installation
- Requires manual PHPUnit setup
- Not recommended (more setup overhead)

---

#### Testing Environment (wp-env)

**Purpose:**
- Provides isolated WordPress + MySQL environment for PHPUnit tests
- Prevents test data from affecting development database
- Ensures reproducible test results
- Matches CI/CD environment configuration

**Installation:**
```bash
npm install -g @wordpress/env
```

**Configuration (.wp-env.json):**
- Located in plugin root directory
- Defines WordPress version, PHP version, ports
- Maps plugin files into container
- Sets environment variables (WP_DEBUG, etc.)

**Usage:**
```bash
npm run wp-env:start    # Start environment
npm test                # Run PHPUnit tests
npm run wp-env:stop     # Stop environment
npm run wp-env:destroy  # Remove environment completely
```

**Access:**
- Development site: http://localhost:8888
- Test site: http://localhost:8889
- Admin credentials: admin / password

**Benefits:**
- ✅ Isolated testing (no database pollution)
- ✅ Fast environment reset (destroy + start)
- ✅ Matches GitHub Actions CI/CD environment
- ✅ Team consistency (same config via .wp-env.json)
- ✅ No manual PHPUnit configuration needed

---

#### Version Control Requirements

**Git:**
- Version: 2.30 or higher
- Repository: GitHub (recommended) or GitLab

**Git Workflow:**
- Branching model: main, develop, feature branches
- Commit messages: Conventional Commits format
- Code review: Pull requests required before merge

**Files to .gitignore:**
- `/vendor/` (Composer dependencies)
- `/node_modules/` (npm dependencies)
- `.wp-env.json` (may contain local paths - use example file)
- `/logs/` (error logs outside web root)
- WordPress core files (if using wp-env)

---

#### IDE/Editor Requirements

**Recommended: Cursor IDE or VS Code**
- PHP syntax highlighting and linting
- Git integration
- WordPress snippets/extensions
- PHPUnit integration

**Required Extensions/Plugins:**
- PHP Intelephense (code completion)
- PHP CS Fixer (code formatting)
- WordPress Hooks (snippet support)
- GitLens (Git visualization)

---

#### Quality Assurance Tools

**Unit Testing:**
- PHPUnit 9.5+ (installed via Composer)
- Target: 80% code coverage
- Run via: `npm test` (in wp-env environment)

**Code Quality:**
- WordPress Coding Standards (PHPCS)
- PHP_CodeSniffer for linting
- PHPStan for static analysis (optional)

**API Testing:**
- Postman or Insomnia
- Collection export for team sharing
- Automated tests via Newman (optional)

**Accessibility Testing:**
- aXe DevTools browser extension
- NVDA screen reader (Windows)
- VoiceOver (macOS)
- Lighthouse (Chrome DevTools)

**Performance Testing:**
- Google Lighthouse (target: ≥90 performance score)
- GTmetrix for page speed analysis
- Query Monitor (WordPress plugin) for database query analysis

---

#### Hosting Requirements (Production)

**PHP:**
- Version: 8.0+ (8.2 recommended)
- Memory: 256MB minimum (512MB recommended)
- Execution time: 60 seconds minimum

**Database:**
- MySQL 5.7+ OR MariaDB 10.3+
- 500MB storage minimum (1GB recommended)

**SSL/TLS:**
- HTTPS certificate required (Let's Encrypt acceptable)
- TLS 1.2 or higher

**Recommended Hosts:**
- SiteGround (UK-based, good support)
- Kinsta (premium managed WordPress)
- WP Engine (enterprise-grade)

---

#### CI/CD Environment (Future)

**GitHub Actions (Phase 2 consideration):**
- wp-env can run in GitHub Actions
- Automated PHPUnit tests on push/PR
- Example workflow:
```yaml
  - name: Set up wp-env
    run: npm install -g @wordpress/env
  - name: Start wp-env
    run: npm run wp-env:start
  - name: Run tests
    run: npm test
```

**Benefits:**
- Automated testing on every commit
- Prevents broken code from merging
- Same environment as local development

## ACCEPTANCE SIGN-OFF

**Phase 2.4 Technical Requirements - READY FOR REVIEW**

**Completed Sections:**
- ✅ Performance requirements with specific, measurable targets
- ✅ Security & compliance (PCI, GDPR, authentication)
- ✅ Scalability targets (Phase 1, 2, Enterprise)
- ✅ WordPress technical requirements (versions, PHP, MySQL)
- ✅ Accessibility (WCAG 2.1 AA, screen readers, keyboard nav)
- ✅ Browser & device compatibility (responsive design)
- ✅ Data privacy & GDPR (detailed compliance requirements)
- ✅ Email & notification infrastructure
- ✅ Backup & recovery (RTO, RPO)
- ✅ Monitoring & logging
- ✅ API standards (Phase 2 preparation)

**Status:** Ready for implementation planning

**Estimated Impact on Development:**
- Performance optimization: +2 weeks
- Security implementation: +2 weeks
- Accessibility: +1 week
- GDPR compliance: +1 week
- **Total:** +6 weeks on top of base development (3-4 months → 4.5-5.5 months)

**Next Steps:**
- Review with stakeholders
- Prioritize implementation (MoSCoW method)
- Update development timeline
- Begin architecture design (Phase 3)

---

**Document Version:** 1.0 DRAFT  
**Total Page Count:** ~40 pages  
**Total Word Count:** ~15,000 words  
**Acceptance Criteria Count:** ~200+ specific, testable criteria
