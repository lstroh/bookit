# SYSTEM ARCHITECTURE DOCUMENT - PART 2
## WordPress Booking Plugin Phase 1 MVP
## Sections 9-19

**Project:** WordPress Booking Plugin for UK Service Businesses  
**Document Version:** 1.0  
**Date:** January 23, 2026  
**Status:** FINAL - Ready for Sprint 0  
**Part:** 2 of 2 (Sections 9-19)  

**Part 1 Reference:** System_Architecture_Document_PART1_Sections_1-8.md  
**Author:** AI Architecture Team with Liron  
**Total Document Pages:** ~50 pages (Part 1 + Part 2)  

---

## DOCUMENT OVERVIEW

This is Part 2 of the System Architecture Document. **Read Part 1 first** (Sections 1-8).

Part 1 covered: Introduction, High-Level Architecture, Component Architecture, Data Architecture (database schema), API Architecture (Payment & Email)

Part 2 (this document) covers:
- **Section 9:** Google Calendar Integration Architecture  
- **Section 10:** Security Architecture  
- **Section 11:** Accessibility Architecture (WCAG 2.1 AA)  
- **Section 12:** Performance Architecture  
- **Section 13:** UK Compliance Architecture  
- **Section 14:** Technology Stack Decisions  
- **Section 15:** Deployment Architecture  
- **Section 16:** Error Handling & Logging  
- **Section 17:** Testing Strategy  
- **Section 18:** Phase 2 Architecture Preparation  
- **Section 19:** Architecture Review Checklist  

---

# SECTION 9: GOOGLE CALENDAR INTEGRATION ARCHITECTURE

## 9.1 Integration Overview

### Purpose & Scope
Google Calendar integration provides **one-way synchronization** from the booking plugin to staff members' personal calendars. This prevents appointment conflicts, delivers mobile calendar notifications, and integrates booking workflows with existing staff schedules.

**Phase 1: One-Way Sync**
- Plugin → Google Calendar (create, update, delete events)
- Staff cannot edit in Google and sync back (Phase 2 feature)

### Business Value
- **Reduces no-shows:** 15-minute calendar alerts
- **Prevents confusion:** Appointments visible in native calendar apps
- **Mobile integration:** Staff see bookings on phones without opening dashboard
- **Customer details accessible:** Phone, email visible in event description

### Critical Architectural Constraint
**NFR: Calendar sync failures must NEVER block booking creation.** If Google Calendar API is down, the booking still succeeds. Sync retries happen asynchronously.

**Reference:** IntegrationRequirements_Phase1.md §5.1

---

## 9.2 OAuth 2.0 Authentication

### Per-Staff Authentication Model
Each staff member connects their own Google account. Benefits:
1. Privacy: Staff A cannot see Staff B's calendar
2. Security: Token compromise affects one staff member only
3. Flexibility: Staff can disconnect without affecting others

### OAuth Flow Diagram

```
1. Staff clicks "Connect Google Calendar" in dashboard
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. Staff authorizes calendar.events scope
   ↓
4. Google redirects back with authorization code
   ↓
5. Exchange code for access token + refresh token
   ↓
6. Store tokens encrypted in database (AES-256-GCM)
```

### Implementation Code

```php
/**
 * Initiate Google OAuth for staff member
 * @param int $staff_id
 * @return string Authorization URL
 */
function booking_initiate_google_oauth($staff_id) {
    $client = new Google_Client();
    $client->setAuthConfig([
        'client_id' => get_option('booking_google_client_id'),
        'client_secret' => get_option('booking_google_client_secret'),
        'redirect_uris' => [admin_url('admin-ajax.php?action=booking_google_callback')]
    ]);
    
    $client->addScope(Google_Service_Calendar::CALENDAR_EVENTS);
    $client->setAccessType('offline'); // Get refresh token
    $client->setPrompt('consent'); // Force consent to get refresh token
    
    // CSRF protection: state parameter
    $state = wp_generate_password(32, false);
    update_user_meta($staff_id, 'google_oauth_state', $state);
    $client->setState($state);
    
    return $client->createAuthUrl();
}

/**
 * OAuth callback handler
 */
add_action('wp_ajax_booking_google_callback', function() {
    $code = sanitize_text_field($_GET['code']);
    $state = sanitize_text_field($_GET['state']);
    
    $staff_id = get_current_user_id();
    $stored_state = get_user_meta($staff_id, 'google_oauth_state', true);
    
    if ($state !== $stored_state) {
        wp_die('Security error'); // CSRF attempt
    }
    
    $client = new Google_Client();
    // ... (config)
    
    $token = $client->fetchAccessTokenWithAuthCode($code);
    
    if (isset($token['error'])) {
        wp_die('OAuth failed');
    }
    
    booking_store_google_tokens($staff_id, $token);
    
    wp_redirect(admin_url('admin.php?page=booking-staff-settings&oauth_success=1'));
    exit;
});
```

**Reference:** IntegrationRequirements_Phase1.md §5.3

---

## 9.3 Token Storage & Encryption

### Database Schema
Tokens stored in `wp_bookings_staff` table:
```sql
ALTER TABLE wp_bookings_staff 
ADD COLUMN google_calendar_token TEXT NULL,
ADD COLUMN google_token_expires_at DATETIME NULL;
```

### Encryption Strategy
**Algorithm:** AES-256-GCM (authenticated encryption)  
**Key Storage:** `BOOKING_ENCRYPTION_KEY` constant in wp-config.php

```php
/**
 * Store encrypted tokens
 */
function booking_store_google_tokens($staff_id, $token) {
    global $wpdb;
    
    $encrypted = booking_encrypt_sensitive_data(json_encode([
        'access_token' => $token['access_token'],
        'refresh_token' => $token['refresh_token'],
        'created_at' => time()
    ]));
    
    $expires_at = date('Y-m-d H:i:s', time() + ($token['expires_in'] ?? 3600));
    
    $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        [
            'google_calendar_token' => $encrypted,
            'google_token_expires_at' => $expires_at
        ],
        ['id' => $staff_id]
    );
}

/**
 * Encrypt with AES-256-GCM
 */
function booking_encrypt_sensitive_data($data) {
    $key = base64_decode(BOOKING_ENCRYPTION_KEY); // 32 bytes
    $iv = random_bytes(12); // 12 bytes for GCM
    
    $ciphertext = openssl_encrypt(
        $data,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );
    
    return base64_encode($iv . $tag . $ciphertext);
}
```

**Key Generation:**
```bash
php -r "echo base64_encode(random_bytes(32));"
```

---

## 9.4 Event CRUD Operations

### Event Format
```json
{
  "summary": "Sarah Johnson - Women's Haircut",
  "description": "Phone: 07700 900123\nEmail: sarah@example.com",
  "start": {
    "dateTime": "2026-05-15T14:00:00+01:00",
    "timeZone": "Europe/London"
  },
  "end": {
    "dateTime": "2026-05-15T14:45:00+01:00",
    "timeZone": "Europe/London"
  },
  "reminders": {
    "overrides": [{"method": "popup", "minutes": 15}]
  }
}
```

### Create Event Implementation

```php
/**
 * Create Google Calendar event on booking confirmation
 */
function booking_create_google_calendar_event($booking_id) {
    global $wpdb;
    
    $booking = $wpdb->get_row($wpdb->prepare("
        SELECT b.*, s.name as service_name, st.google_calendar_token,
               c.first_name, c.email, c.phone
        FROM {$wpdb->prefix}bookings b
        JOIN {$wpdb->prefix}bookings_services s ON b.service_id = s.id
        JOIN {$wpdb->prefix}bookings_staff st ON b.staff_id = st.id
        JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
        WHERE b.id = %d
    ", $booking_id));
    
    if (!$booking->google_calendar_token) {
        return false; // Staff hasn't connected (non-blocking)
    }
    
    try {
        $access_token = booking_get_google_access_token($booking->staff_id);
        
        $client = new Google_Client();
        $client->setAccessToken($access_token);
        $service = new Google_Service_Calendar($client);
        
        $event = new Google_Service_Calendar_Event([
            'summary' => $booking->first_name . ' - ' . $booking->service_name,
            'description' => sprintf(
                "Phone: %s\nEmail: %s\nBooking ID: #%d",
                $booking->phone, $booking->email, $booking_id
            ),
            'start' => [
                'dateTime' => date('c', strtotime($booking->booking_date . ' ' . $booking->start_time)),
                'timeZone' => 'Europe/London'
            ],
            'end' => [
                'dateTime' => date('c', strtotime($booking->booking_date . ' ' . $booking->end_time)),
                'timeZone' => 'Europe/London'
            ]
        ]);
        
        $created = $service->events->insert('primary', $event);
        
        // Store event ID for future updates
        $wpdb->update(
            $wpdb->prefix . 'bookings',
            ['google_calendar_event_id' => $created->getId()],
            ['id' => $booking_id]
        );
        
        booking_log('INFO', 'Calendar event created', ['booking_id' => $booking_id]);
        return $created->getId();
        
    } catch (Exception $e) {
        booking_log('ERROR', 'Calendar sync failed', [
            'booking_id' => $booking_id,
            'error' => $e->getMessage()
        ]);
        return false; // Non-blocking failure
    }
}

/**
 * Token refresh logic
 */
function booking_get_google_access_token($staff_id) {
    global $wpdb;
    
    $staff = $wpdb->get_row($wpdb->prepare("
        SELECT google_calendar_token, google_token_expires_at
        FROM {$wpdb->prefix}bookings_staff
        WHERE id = %d
    ", $staff_id));
    
    $token_data = json_decode(booking_decrypt_sensitive_data($staff->google_calendar_token), true);
    
    // Check if expired
    if (strtotime($staff->google_token_expires_at) < time() + 60) {
        // Refresh token
        $client = new Google_Client();
        $client->setAccessToken($token_data['access_token']);
        
        $new_token = $client->fetchAccessTokenWithRefreshToken($token_data['refresh_token']);
        
        // Update database
        booking_store_google_tokens($staff_id, $new_token);
        
        return $new_token['access_token'];
    }
    
    return $token_data['access_token'];
}
```

**Reference:** IntegrationRequirements_Phase1.md §5.4

---

## 9.5 Error Handling (Non-Blocking)

### Error Response Table

| Error Code | Cause | Action | User Message |
|------------|-------|--------|--------------|
| 401 | Token expired/revoked | Refresh token; prompt reconnect if fails | "Calendar disconnected" |
| 403 | Rate limit | Queue for retry (exponential backoff) | "Sync delayed" |
| 404 | Event not found | Silent (already deleted) | None |
| 500 | Google API down | Retry 3x, then queue hourly | "Will retry" |

### Retry Queue

```php
function booking_queue_calendar_sync_retry($booking_id) {
    $retry_count = get_post_meta($booking_id, '_calendar_sync_retry_count', true) ?: 0;
    
    if ($retry_count >= 3) {
        booking_log('ERROR', 'Sync abandoned after 3 retries', ['booking_id' => $booking_id]);
        return;
    }
    
    update_post_meta($booking_id, '_calendar_sync_retry_count', $retry_count + 1);
    
    wp_schedule_single_event(
        time() + 3600, // 1 hour
        'booking_retry_calendar_sync',
        [$booking_id]
    );
}
```

---

## 9.6 Phase 2: Two-Way Sync Preparation

### Webhook Subscriptions (Phase 2)
Google Calendar supports push notifications when events change:

```php
// Phase 2: Subscribe to calendar changes
function booking_subscribe_to_calendar_changes($staff_id) {
    $service = new Google_Service_Calendar(/* ... */);
    
    $channel = new Google_Service_Calendar_Channel([
        'id' => 'booking_staff_' . $staff_id,
        'type' => 'web_hook',
        'address' => home_url('/wp-json/bookings/v1/calendar-webhook')
    ]);
    
    $service->events->watch('primary', $channel);
}
```

### Conflict Resolution Strategy (Phase 2)

| Staff Action in Google | Plugin Response |
|------------------------|-----------------|
| Changes event time | Update booking + notify customer |
| Deletes event | Mark booking cancelled + refund |
| Changes title | Ignore (informational only) |

**Reference:** MoSCoW §SHOULD HAVE (2-way sync)

---

# SECTION 10: SECURITY ARCHITECTURE

## 10.1 Security Overview

### Defense-in-Depth Strategy
Multiple security layers protect customer data:
1. Authentication (3 separate systems)
2. Session management (8-hour timeout, regeneration)
3. Input validation (prepared statements, escaping, nonces)
4. Data encryption (AES-256-GCM at rest, TLS 1.2+ in transit)
5. Payment isolation (PCI DSS SAQ A - no card data stored)
6. Rate limiting (brute-force prevention)

### Security Requirements Summary
- **20 NFRs:** NFR-2.1 through NFR-2.20
- **OWASP Top 10:** All vulnerabilities addressed
- **UK GDPR Article 32:** "Appropriate technical measures"

**Reference:** TechnicalRequirements.md §2

---

## 10.2 Three Authentication Systems

### System 1: WordPress Admin
- **Purpose:** Plugin configuration
- **Method:** Standard WordPress authentication
- **Access:** `/wp-admin/` with `manage_options` capability

### System 2: Dashboard Users (Business Owner + Staff)
- **Purpose:** Booking management
- **Method:** **Separate authentication** (not WordPress users)
- **Access:** `/dashboard/` custom application
- **Database:** `wp_bookings_staff` table with bcrypt password hashes

**Critical Decision:** Dashboard authentication is completely separate from WordPress. This is a **key differentiator** providing security isolation and simplified UX for non-technical staff.

### Dashboard Login Implementation

```php
function booking_authenticate_dashboard_user($email, $password) {
    global $wpdb;
    
    // Rate limit check (5 attempts per 15 min)
    if (booking_is_rate_limited($_SERVER['REMOTE_ADDR'], 'dashboard_login')) {
        return new WP_Error('rate_limited', 'Too many attempts. Try again in 15 minutes.');
    }
    
    // Get staff record
    $staff = $wpdb->get_row($wpdb->prepare("
        SELECT * FROM {$wpdb->prefix}bookings_staff
        WHERE email = %s AND status = 'active'
    ", sanitize_email($email)));
    
    if (!$staff || !password_verify($password, $staff->password_hash)) {
        booking_increment_failed_attempts($_SERVER['REMOTE_ADDR'], 'dashboard_login');
        return new WP_Error('invalid', 'Invalid email or password');
    }
    
    // CRITICAL: Prevent session fixation
    session_start();
    session_regenerate_id(true);
    
    $_SESSION['dashboard_user_id'] = $staff->id;
    $_SESSION['dashboard_user_role'] = $staff->role;
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();
    
    booking_clear_failed_attempts($_SERVER['REMOTE_ADDR'], 'dashboard_login');
    
    return $staff;
}
```

### System 3: Customer Magic Links
- **Purpose:** Cancel/reschedule without password
- **Method:** Cryptographically secure token (32 bytes)
- **Expiry:** 7 days
- **One-time use:** Token deleted after use

```php
function booking_generate_magic_link($booking_id) {
    $token = bin2hex(random_bytes(32)); // 64 hex chars
    $token_hash = hash('sha256', $token); // Store hashed
    
    $wpdb->insert($wpdb->prefix . 'bookings_magic_links', [
        'booking_id' => $booking_id,
        'token_hash' => $token_hash,
        'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days'))
    ]);
    
    return home_url('/booking-manage/?token=' . $token);
}
```

**Reference:** Gap_Analysis_Report §16

---

## 10.3 Session Security

### Configuration
```php
ini_set('session.cookie_httponly', 1);  // Prevent JS access
ini_set('session.cookie_secure', 1);    // HTTPS only
ini_set('session.cookie_samesite', 'Lax'); // CSRF protection
ini_set('session.gc_maxlifetime', 28800);  // 8 hours
```

### Session Validation

```php
function booking_validate_dashboard_session() {
    if (!isset($_SESSION['dashboard_user_id'])) {
        return false;
    }
    
    // Check 8-hour timeout
    $timeout = 28800;
    if (time() - $_SESSION['last_activity'] > $timeout) {
        session_destroy();
        return false;
    }
    
    // Warn if expiring in 2 minutes (WCAG 2.1 requirement)
    if (time() - $_SESSION['last_activity'] > ($timeout - 120)) {
        header('X-Session-Warning: true');
    }
    
    $_SESSION['last_activity'] = time();
    
    return true;
}
```

### Session Timeout Warning (NFR-4.9)

```javascript
// JavaScript modal for 2-minute warning
function showTimeoutWarning(seconds) {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    modal.innerHTML = `
        <h2>Session Expiring Soon</h2>
        <p>Your session will expire in 2 minutes. Stay logged in?</p>
        <button id="extend-session">Stay Logged In</button>
        <button id="logout">Log Out</button>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('extend-session').focus();
}
```

**Reference:** NFR-2.3, NFR-4.9

---

## 10.4 Input Validation

### SQL Injection Prevention
**Always use prepared statements:**

```php
// ✅ CORRECT
$booking = $wpdb->get_row($wpdb->prepare("
    SELECT * FROM wp_bookings WHERE id = %d
", absint($_GET['id'])));

// ❌ NEVER DO THIS
$query = "SELECT * FROM wp_bookings WHERE id = " . $_GET['id'];
```

### XSS Prevention
**Output escaping:**

```php
echo esc_html($customer_name);
echo '<img src="' . esc_url($url) . '" alt="' . esc_attr($alt) . '">';
```

### CSRF Protection
**Nonce verification:**

```php
add_action('wp_ajax_booking_create', function() {
    check_ajax_referer('booking_create_nonce', 'nonce');
    
    $service_id = absint($_POST['service_id']);
    // ... sanitize all inputs
    
    $wpdb->insert($wpdb->prefix . 'bookings', [
        'service_id' => $service_id,
        // ... (prepared statement)
    ], ['%d', '%d', '%s']);
});
```

**Reference:** NFR-2.16 through NFR-2.19

---

## 10.5 Payment Security (PCI DSS SAQ A)

### Zero Card Data Storage
- **No storage:** Card numbers, CVV, expiry dates
- **Method:** Redirect to Stripe Checkout / PayPal hosted pages
- **Store only:** Transaction ID, last 4 digits, card brand

```php
// ✅ SAFE: Store transaction metadata only
$wpdb->update($wpdb->prefix . 'bookings', [
    'payment_method' => 'stripe',
    'payment_id' => 'pi_abc123',
    'card_last_4' => '4242',
    'card_brand' => 'Visa'
], ['id' => $booking_id]);
```

### Webhook Security
Verify signatures on all payment notifications:

```php
// Stripe webhook verification
$payload = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$endpoint_secret = get_option('stripe_webhook_secret');

try {
    $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    exit();
}
```

**Reference:** NFR-2.11 through NFR-2.15

---

## 10.6 Rate Limiting

### Implementation

```php
function booking_is_rate_limited($ip, $action) {
    $limits = [
        'dashboard_login' => ['max' => 5, 'window' => 900],   // 15 min
        'magic_link' => ['max' => 5, 'window' => 900],
        'booking_create' => ['max' => 10, 'window' => 3600],  // 1 hour
    ];
    
    $option_name = 'booking_rate_limit_' . $action . '_' . md5($ip);
    $attempts = get_option($option_name, []);
    
    // Remove old attempts
    $cutoff = time() - $limits[$action]['window'];
    $attempts = array_filter($attempts, fn($t) => $t > $cutoff);
    
    return count($attempts) >= $limits[$action]['max'];
}
```

**Reference:** NFR-2.5

---

# SECTION 11: ACCESSIBILITY ARCHITECTURE (WCAG 2.1 AA)

## 11.1 Overview

### Legal Requirement
WCAG 2.1 Level AA compliance is **required by UK law** (Equality Act 2010).

### Success Criteria
- **100% compliance** with WCAG 2.1 AA
- **Testing:** Automated (aXe-core) + Manual (screen reader)
- **Target:** Lighthouse Accessibility score ≥95

**Reference:** TechnicalRequirements.md §5

---

## 11.2 Semantic HTML5

### Structure Requirements
```html
<main id="main-content" role="main">
  <h1>Book an Appointment</h1>
  
  <section aria-labelledby="service-heading">
    <h2 id="service-heading">Select a Service</h2>
    
    <form>
      <fieldset>
        <legend>Available Services</legend>
        
        <div>
          <input type="radio" id="service-1" name="service_id" value="1" required>
          <label for="service-1">
            <strong>Women's Haircut</strong>
            <span>45 minutes • £35</span>
          </label>
        </div>
      </fieldset>
      
      <button type="submit">
        Next: Select Staff
        <span class="sr-only">(Step 2 of 4)</span>
      </button>
    </form>
  </section>
</main>
```

### Heading Hierarchy
- `<h1>`: Page title (one per page)
- `<h2>`: Major sections
- `<h3>`: Subsections
- **Never skip levels** (e.g., h1 → h3)

---

## 11.3 Color Contrast

### Requirements (NFR-4.2)
- **Normal text:** ≥4.5:1 contrast ratio
- **Large text** (18pt+): ≥3:1
- **UI components:** ≥3:1 (buttons, inputs)

### Good Examples
```css
/* ✅ PASS: 8.2:1 contrast */
.btn-primary {
  background: #0056B3; /* Dark blue */
  color: #FFFFFF; /* White */
}

/* ✅ PASS: 12.6:1 contrast */
body {
  background: #FFFFFF;
  color: #333333; /* Dark grey */
}

/* ❌ FAIL: 3.9:1 contrast (too low) */
.text-muted {
  color: #888888; /* Light grey on white */
}
```

**Testing Tool:** WebAIM Contrast Checker

---

## 11.4 Keyboard Navigation

### Focus Indicators
```css
button:focus,
input:focus,
a:focus {
  outline: 2px solid #0056B3;
  outline-offset: 2px;
}

/* ❌ NEVER disable globally */
/* *:focus { outline: none; } */
```

### Skip Link
```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### Keyboard Shortcuts (Calendar Widget)
- **Arrow keys:** Navigate dates
- **Enter/Space:** Select date
- **Escape:** Close calendar
- **Home/End:** First/last day of month

**Reference:** NFR-4.6, NFR-4.7

---

## 11.5 Screen Reader Support

### ARIA Labels
```html
<!-- Icon button with accessible name -->
<button aria-label="Delete booking">
  <span class="icon-trash" aria-hidden="true"></span>
</button>

<!-- Form field with error -->
<input 
  type="email" 
  id="email" 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

### Live Regions
```html
<!-- Loading state -->
<div role="status" aria-live="polite" aria-atomic="true">
  <span class="sr-only">Loading available times...</span>
  <span class="spinner" aria-hidden="true"></span>
</div>

<!-- Error announcement -->
<div role="alert" aria-live="assertive">
  This time slot is no longer available
</div>
```

**Reference:** NFR-4.18, NFR-4.19, NFR-4.20

---

## 11.6 Touch Targets (Mobile)

### Minimum Size (NFR-4.21)
```css
@media (max-width: 768px) {
  button,
  .btn,
  input[type="checkbox"],
  input[type="radio"] {
    min-width: 44px;
    min-height: 44px;
  }
  
  /* Spacing between targets */
  .button-group button {
    margin-right: 8px;
    margin-bottom: 8px;
  }
}
```

---

## 11.7 Form Accessibility

### Error Handling
```html
<form method="post" novalidate>
  <!-- Error summary (shown if errors exist) -->
  <div role="alert" class="error-summary" style="display:none;">
    <h2>Please correct the following errors:</h2>
    <ul id="error-list"></ul>
  </div>
  
  <!-- Field with validation -->
  <div>
    <label for="customer-email">
      Email Address
      <span class="required" aria-label="required">*</span>
    </label>
    
    <input 
      type="email" 
      id="customer-email"
      required
      aria-required="true"
      aria-describedby="email-help email-error"
      aria-invalid="false"
    >
    
    <span id="email-help" class="help-text">
      We'll send your confirmation to this email
    </span>
    
    <span id="email-error" role="alert" class="error-message" style="display:none;"></span>
  </div>
</form>
```

**Reference:** NFR-4.12, NFR-4.13

---

## 11.8 Testing Methodology

### Automated Testing
- **aXe-core DevTools:** Catches ~30% of issues
- **Lighthouse Accessibility:** Target score ≥95
- **Pa11y CI:** Automated testing in build pipeline

### Manual Testing
1. **Keyboard navigation:** Unplug mouse, navigate entire site
2. **Screen reader:** NVDA (Windows) or VoiceOver (Mac)
3. **Color contrast:** WebAIM Contrast Checker
4. **Touch targets:** Use finger (not stylus) on mobile

**Pass Criteria:** Zero WCAG 2.1 AA violations

**Reference:** TechnicalRequirements.md §5.5

---

# SECTION 12: PERFORMANCE ARCHITECTURE

## 12.1 Performance Targets

### Core Web Vitals (NFR-1.1 through NFR-1.7)
- **Page load:** <2 seconds on 3G
- **First Contentful Paint (FCP):** ≤1.2s
- **Time to Interactive (TTI):** ≤2.0s
- **Largest Contentful Paint (LCP):** ≤2.5s
- **Cumulative Layout Shift (CLS):** ≤0.1
- **First Input Delay (FID):** ≤100ms
- **Lighthouse Performance:** ≥90

---

## 12.2 Frontend Optimization

### Critical CSS Inline
```html
<!-- Inline above-the-fold styles in <head> -->
<style>
  /* Critical CSS only */
  body { font-family: sans-serif; margin: 0; }
  .header { background: #0056B3; color: white; padding: 1rem; }
  /* ... */
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/style.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/style.css"></noscript>
```

### Lazy-Load Images
```html
<img 
  src="/images/service.jpg" 
  alt="Haircut service" 
  loading="lazy"
  width="400"
  height="300"
>
```

### Defer JavaScript
```html
<script src="/booking-form.js" defer></script>
```

### Bundle Size Targets
- **Public booking page:** <50KB JS (gzipped)
- **Dashboard:** <150KB JS (gzipped, code-split)
- **No jQuery** (use vanilla JS)

---

## 12.3 Backend Optimization

### Query Caching (60-second TTL)
```php
function get_available_slots($staff_id, $date) {
    $cache_key = "availability_{$staff_id}_{$date}";
    $cached = wp_cache_get($cache_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    // Expensive query
    $slots = $wpdb->get_results(/* ... */);
    $available = calculate_available_slots($slots);
    
    wp_cache_set($cache_key, $available, '', 60);
    
    return $available;
}
```

### Avoid N+1 Queries
```php
// ❌ BAD: N+1 query problem
$bookings = $wpdb->get_results("SELECT * FROM wp_bookings");
foreach ($bookings as $booking) {
    $service = $wpdb->get_row("SELECT * FROM services WHERE id = {$booking->service_id}");
}

// ✅ GOOD: Single query with JOIN
$bookings = $wpdb->get_results("
    SELECT b.*, s.name as service_name, c.first_name
    FROM wp_bookings b
    JOIN wp_bookings_services s ON b.service_id = s.id
    JOIN wp_bookings_customers c ON b.customer_id = c.id
");
```

**Reference:** NFR-1.12 through NFR-1.16

---

## 12.4 Database Optimization

### Composite Indexes (from Section 5.4)
```sql
CREATE INDEX idx_staff_date_status 
ON wp_bookings (staff_id, booking_date, status);

CREATE INDEX idx_customer_email 
ON wp_bookings_customers (email);
```

### Query Performance Target
- **<100ms** with 10,000 records (NFR-1.16)

### EXPLAIN Analysis
```sql
EXPLAIN SELECT * FROM wp_bookings 
WHERE staff_id = 3 
  AND booking_date = '2026-01-23' 
  AND deleted_at IS NULL;

-- Expected: Uses idx_staff_date_status
-- type: ref
-- rows: ~10 (not full table scan)
```

---

## 12.5 Monitoring

### Lighthouse CI (Weekly Automated)
```bash
lighthouse https://staging.site.com/booking/ \
  --output html \
  --output-path ./reports/lighthouse.html
```

### MySQL Slow Query Log
```ini
# my.cnf
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.2  # 200ms
```

**Alert:** Performance score drops below 85

**Reference:** NFR-1.1 through NFR-1.19

---

# SECTION 13: UK COMPLIANCE ARCHITECTURE

## 13.1 Compliance Overview

### Status: 91% Compliant
- **Fully covered:** 81/89 requirements
- **Gaps:** 7 minor gaps (30-43 hours remediation)
- **Critical for launch:** Privacy Policy, Terms & Conditions

**Reference:** UK_Compliance_Checklist_v1_0.md

---

## 13.2 GDPR Data Rights

### Right to Access (Article 15)
```php
function export_customer_data($customer_id) {
    global $wpdb;
    
    $customer = $wpdb->get_row($wpdb->prepare("
        SELECT * FROM {$wpdb->prefix}bookings_customers WHERE id = %d
    ", $customer_id));
    
    $bookings = $wpdb->get_results($wpdb->prepare("
        SELECT * FROM {$wpdb->prefix}bookings WHERE customer_id = %d
    ", $customer_id));
    
    $data = [
        'personal_information' => [
            'name' => $customer->first_name . ' ' . $customer->last_name,
            'email' => $customer->email,
            'phone' => $customer->phone
        ],
        'bookings' => array_map(fn($b) => [
            'date' => $b->booking_date,
            'service' => get_service_name($b->service_id),
            'total_paid' => $b->total_price
        ], $bookings)
    ];
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="my-data.json"');
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}
```

### Right to Erasure (Article 17)
```php
// Anonymize (don't delete - 7-year retention for HMRC)
$wpdb->update($wpdb->prefix . 'bookings_customers', [
    'first_name' => 'Deleted',
    'last_name' => 'Customer',
    'email' => 'deleted_' . $customer_id . '@example.com',
    'phone' => null,
    'marketing_consent' => 0
], ['id' => $customer_id]);
```

---

## 13.3 Data Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Booking records | 7 years | HMRC tax compliance |
| Payment transactions | 7 years | Financial audit |
| Customer data | 7 years OR deletion request | Legal obligation |
| Email logs | 2 years | Troubleshooting |

### Automated Cleanup
```php
// Monthly cron: Delete bookings >7 years old
function cleanup_old_bookings() {
    global $wpdb;
    
    $wpdb->query("
        DELETE FROM {$wpdb->prefix}bookings 
        WHERE deleted_at IS NOT NULL 
          AND deleted_at < DATE_SUB(NOW(), INTERVAL 7 YEAR)
    ");
}
add_action('booking_monthly_cleanup', 'cleanup_old_bookings');
```

**Reference:** TechnicalRequirements.md §7.8

---

## 13.4 Privacy Policy Requirements

**Status:** Template required (HIGH priority - 8-12 hours)

### Must Include:
1. **Data collected:** Name, email, phone, booking details
2. **Lawful basis:** Contractual necessity, consent (marketing)
3. **Who we share with:** Stripe, PayPal, Google Calendar, email service
4. **Retention:** 7 years (HMRC requirement)
5. **Your rights:** Access, rectification, erasure, portability
6. **How to exercise rights:** Email privacy@clientbusiness.com
7. **ICO contact:** ico.org.uk for complaints

### Display Requirements
- Link in footer of all pages
- Required checkbox before payment
- Written in plain English (not legal jargon)

**Reference:** TechnicalRequirements.md §7.9, UK_Compliance_Checklist §1.9

---

## 13.5 14-Day Cooling-Off Period

### Consumer Contracts Regulations 2013
Services within 14 days require explicit waiver:

```html
<!-- Show checkbox if booking within 14 days -->
<div id="cooling-off-waiver" style="display:none;">
  <input 
    type="checkbox" 
    id="waiver-checkbox" 
    required
  >
  <label for="waiver-checkbox">
    I understand that by requesting this appointment within 14 days, 
    I waive my right to a 14-day cooling-off period.
    <a href="/terms">Learn more</a>
  </label>
</div>

<script>
const bookingDate = new Date(document.getElementById('booking-date').value);
const daysDiff = (bookingDate - new Date()) / (1000 * 60 * 60 * 24);

if (daysDiff < 14) {
  document.getElementById('cooling-off-waiver').style.display = 'block';
}
</script>
```

**Reference:** UK_Compliance_Checklist §3.2

---

## 13.6 Email Marketing Opt-In

### PECR Compliance
```html
<form>
  <!-- Must be unchecked by default -->
  <input type="checkbox" id="marketing" name="marketing_consent" value="1">
  <label for="marketing">
    I would like to receive promotional emails about special offers
  </label>
  
  <!-- Unsubscribe link in every marketing email -->
</form>
```

**Reference:** UK_Compliance_Checklist §2.1

---

## 13.7 Data Breach Notification

### Procedure (GDPR Article 33)
1. **Detect:** Monitoring, logs, alerts
2. **Contain:** Disable compromised accounts
3. **Assess:** Data types affected, number of customers
4. **Notify ICO:** Within 72 hours (online form at ico.org.uk)
5. **Notify customers:** If high risk to rights/freedoms
6. **Document:** Incident report, lessons learned

**Reference:** TechnicalRequirements.md §7.11

---

# SECTION 14: TECHNOLOGY STACK DECISIONS

## 14.1 Backend Stack

### PHP 8.0+
**Decision:** Minimum PHP 8.0  
**Rationale:**
- WordPress 6.0+ recommends PHP 8.0+
- 20-30% faster than PHP 7.4
- Named arguments, match expressions
- 95% of WordPress hosts support it

### WordPress 6.0+
**Decision:** Minimum WordPress 6.0  
**Rationale:**
- Block editor improvements
- REST API enhancements
- Released June 2022 (well-established)

### MySQL 5.7+ / MariaDB 10.3+
**Decision:** MySQL 5.7+ or MariaDB 10.3+  
**Rationale:**
- JSON column support
- Better index optimization
- Standard on all modern hosting

---

## 14.2 Frontend Stack

### Public Booking Page: Vanilla JavaScript
**Decision:** No framework  
**Rationale:**
- Minimize bundle size (<50KB target)
- Simple booking flow doesn't need React/Vue
- Faster page load
- Easy for future developers

**Libraries:**
- Flatpickr (date picker, 20KB)
- Axios (HTTP, 13KB)

### Business Dashboard: Vue 3
**Decision:** Vue 3 over React  
**Rationale:**
- **40% smaller bundle** than React
- Simpler learning curve
- Excellent admin UI documentation
- Better for junior developers

**Alternative considered:** React
- Pros: Larger ecosystem
- Cons: Larger bundle, steeper curve

### CSS: Tailwind CSS
**Decision:** Tailwind via CDN  
**Rationale:**
- Utility-first (rapid development)
- No build step (CDN)
- Consistent design system

---

## 14.3 Composer Dependencies

```json
{
  "require": {
    "stripe/stripe-php": "^10.0",
    "paypal/rest-api-sdk-php": "^1.14",
    "google/apiclient": "^2.15",
    "league/oauth2-google": "^4.0"
  },
  "require-dev": {
    "phpunit/phpunit": "^9.5"
  }
}
```

---

## 14.4 Development Tools

- **Local environment:** Local by Flywheel (easiest) or Docker
- **Version control:** GitHub (free private repos)
- **Unit testing:** PHPUnit (target: 80% coverage)
- **API testing:** Postman
- **Accessibility:** aXe DevTools, NVDA

---

# SECTION 15: DEPLOYMENT ARCHITECTURE

## 15.1 Hosting Requirements

- **PHP:** 8.0+ (required)
- **MySQL/MariaDB:** 5.7+ / 10.3+ (required)
- **Memory:** 256MB min (512MB recommended)
- **Disk:** 500MB min (1GB recommended)
- **SSL/TLS:** HTTPS certificate (required)

**Recommended Hosts:**
- SiteGround (UK-based)
- Kinsta (premium managed)
- WP Engine (enterprise)

---

## 15.2 Plugin Installation

### Activation Hook
```php
// Main plugin file
register_activation_hook(__FILE__, 'booking_plugin_activate');

function booking_plugin_activate() {
    // Create database tables
    require_once BOOKING_PLUGIN_DIR . 'includes/class-database-setup.php';
    Booking_Database_Setup::create_tables();
    
    // Default settings
    add_option('booking_plugin_version', BOOKING_VERSION);
    add_option('booking_timezone', 'Europe/London');
    add_option('booking_currency', 'GBP');
    
    flush_rewrite_rules();
}
```

---

## 15.3 Environment Configuration

### Development (wp-config.php)
```php
define('WP_DEBUG', true);
define('BOOKING_ENV', 'development');
define('BOOKING_STRIPE_MODE', 'test');
define('BOOKING_STRIPE_TEST_KEY', 'sk_test_...');
```

### Staging
```php
define('WP_DEBUG', false);
define('BOOKING_ENV', 'staging');
define('BOOKING_STRIPE_MODE', 'test');
define('BOOKING_EMAIL_SERVICE', 'log'); // Don't send real emails
```

### Production
```php
define('WP_DEBUG', false);
define('BOOKING_ENV', 'production');
define('BOOKING_STRIPE_MODE', 'live');
define('BOOKING_STRIPE_LIVE_KEY', 'sk_live_...');
define('BOOKING_ENCRYPTION_KEY', 'base64_encoded_key');
```

---

## 15.4 Client Delivery Process (7 Steps)

1. **Install WordPress:** Fresh installation
2. **Activate Plugin:** Upload + activate (triggers DB setup)
3. **Configure API Keys:** Stripe, PayPal, email service
4. **Run Setup Wizard:** First service, availability, policy
5. **Test End-to-End:** Complete test booking (Stripe test card)
6. **Train Business Owner:** 30-minute session
7. **Go Live:** Switch to live API keys, monitor 48 hours

**Rollback:** Deactivate plugin if critical issues

## 15.5 Development Environment Requirements

### Recommended Approach: Hybrid Setup (Local by Flywheel + wp-env)

**Why Hybrid?**
- **Local by Flywheel:** Visual development environment for day-to-day coding
- **wp-env:** Docker-based isolated environment for PHPUnit testing
- **Benefits:** Best of both worlds - ease of use + reproducible testing

---

### Option 1: Local by Flywheel + wp-env (RECOMMENDED - Project is using this)

**Local by Flywheel (Primary Development):**
- Visual WordPress management interface
- Easy database access via built-in Adminer
- Site management and SSL certificates
- Location: `C:\Local Sites\[site-name]\`

**wp-env (Testing Environment):**
- Docker-based WordPress + MySQL containers
- Isolated testing environment (separate from dev database)
- PHPUnit tests run in wp-env container
- CI/CD-ready (matches production-like environment)
- Installed via: `npm install -g @wordpress/env`
- Version: 10.37.0 (as of Sprint 0)

**Configuration (.wp-env.json in plugin directory):**
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

**Typical Development Workflow:**
1. Code changes in Local by Flywheel environment
2. Manual browser testing in Local (http://booking-plugin.local)
3. Run PHPUnit tests in wp-env: `npm test`
4. Commit when all tests pass

**wp-env Access:**
- Main site: http://localhost:8888
- Test site: http://localhost:8889
- Admin: http://localhost:8888/wp-admin (admin/password)

---

### Option 2: Local by Flywheel Only

**Use Case:** Developers who prefer simpler setup without Docker

**Setup:**
- Install PHPUnit directly in Local site
- Configure PHPUnit bootstrap file
- Run tests against Local's database

**Cons:**
- Tests affect development database
- Not CI/CD-ready
- Requires manual PHPUnit configuration

---

### Option 3: Full Docker Compose Setup

**Use Case:** Advanced users comfortable with Docker

**Setup:**
- Custom docker-compose.yml with WordPress + MySQL + PHPUnit
- More control over environment configuration
- Requires Docker knowledge

**Cons:**
- More complex initial setup
- Requires Docker Compose knowledge
- Overkill for solo developers

---

### Environment Requirements (All Options)

**Minimum Requirements:**
- PHP 8.0+ (8.2 recommended)
- MySQL 5.7+ or MariaDB 10.3+
- WordPress 6.4+
- Composer (for PHP dependencies)
- Node.js 18+ and npm (for wp-env if using hybrid approach)
- Docker Desktop (for wp-env if using hybrid approach)

**Testing Environment Benefits (wp-env):**
- Isolated WordPress instance prevents test data pollution
- Consistent environment across team members
- Matches CI/CD configuration (GitHub Actions can use wp-env)
- Easy reset: `npm run wp-env:destroy` + `npm run wp-env:start`

---

### wp-env Installation Guide

**Step 1: Install Node.js and npm**
- Download from https://nodejs.org/ (LTS version)
- Verify: `node --version` (should be 18+)
- Verify: `npm --version`

**Step 2: Install Docker Desktop**
- Download from https://www.docker.com/products/docker-desktop
- Start Docker Desktop (must be running for wp-env)

**Step 3: Install wp-env globally**
```bash
npm install -g @wordpress/env
```

**Step 4: Verify installation**
```bash
wp-env --version
# Output: 10.37.0 (or newer)
```

**Step 5: Create .wp-env.json in plugin directory**
(See configuration example above)

**Step 6: Add npm scripts to package.json**
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

**Step 7: Start wp-env and run tests**
```bash
npm run wp-env:start
npm test
```

---

### Development Environment Comparison

| Feature | Local by Flywheel | wp-env | Docker Compose |
|---------|-------------------|--------|----------------|
| **Ease of Setup** | âœ… Very Easy | ✔️ Easy | ❌ Complex |
| **Visual Interface** | âœ… Yes | ❌ No (CLI only) | ❌ No |
| **Database Access** | âœ… Built-in Adminer | ✔️ Via CLI | ✔️ Via tools |
| **PHPUnit Testing** | ✔️ Manual setup | âœ… Built-in | âœ… Customizable |
| **Isolated Testing** | ❌ Same database | âœ… Separate | âœ… Separate |
| **CI/CD Ready** | ❌ No | âœ… Yes | âœ… Yes |
| **Resource Usage** | Medium | Medium | High |
| **Best For** | Daily development | Automated tests | Advanced users |

**Project Decision:** Hybrid approach (Local + wp-env) for best balance of usability and testing capability.
---

# SECTION 16: ERROR HANDLING & LOGGING

## 16.1 Logging Strategy

### File-Based Logging
- **Location:** `/wp-content/uploads/bookings/logs/`
- **Format:** `bookings-2026-01-23.log` (daily)
- **Rotation:** Weekly, 4-week retention

```php
function booking_log($level, $message, $context = []) {
    $log_dir = WP_CONTENT_DIR . '/uploads/bookings/logs/';
    
    if (!file_exists($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $log_file = $log_dir . 'bookings-' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $context_json = !empty($context) ? json_encode($context) : '';
    $log_line = "[{$timestamp}] [{$level}] {$message} {$context_json}\n";
    
    file_put_contents($log_file, $log_line, FILE_APPEND);
}
```

### Sentry.io (Optional)
```php
// Real-time error tracking
if (defined('BOOKING_SENTRY_DSN')) {
    \Sentry\captureMessage($message, \Sentry\Severity::error());
}
```

---

## 16.2 What to Log

### Log These:
- Booking creation, updates, cancellations
- Payment successes/failures
- Email send attempts
- Google Calendar sync attempts
- Database errors
- API errors
- Authentication failures
- GDPR data requests

### NEVER Log These:
- Credit card numbers
- CVV codes
- Passwords (even hashed)
- API keys, encryption keys
- Session tokens
- OAuth refresh tokens

```php
// ❌ BAD: Logging sensitive data
booking_log('INFO', 'Payment', ['card_number' => $_POST['card']]);

// ✅ GOOD: Logging non-sensitive data
booking_log('INFO', 'Payment processed', [
    'booking_id' => $booking_id,
    'amount' => $amount,
    'card_last_4' => substr($card_number, -4),
    'transaction_id' => 'pi_abc123'
]);
```

---

## 16.3 Critical Error Alerts

Trigger alerts for:
- Payment gateway down >5 minutes
- Email failure rate >5% (24 hours)
- Database connection lost

```php
// Hourly cron: Check email delivery rate
function check_email_delivery_rate() {
    global $wpdb;
    
    $total = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->prefix}bookings_email_log 
        WHERE sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    
    $failed = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->prefix}bookings_email_log 
        WHERE sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND status = 'failed'
    ");
    
    if ($total > 0) {
        $failure_rate = ($failed / $total) * 100;
        
        if ($failure_rate > 5) {
            wp_mail(
                get_option('admin_email'),
                'URGENT: High Email Failure Rate',
                sprintf('Email failure rate: %.1f%%', $failure_rate)
            );
        }
    }
}
add_action('booking_hourly_checks', 'check_email_delivery_rate');
```

---

# SECTION 17: TESTING STRATEGY

## 17.1 Testing Overview

### Target: 80% Code Coverage
- **Unit tests:** PHPUnit
- **Integration tests:** Postman
- **Functional tests:** Manual + Selenium
- **Security tests:** OWASP ZAP
- **Accessibility tests:** aXe-core + manual
- **Performance tests:** Lighthouse

---

## 17.2 Unit Testing (PHPUnit)

### Target Functions
- Booking availability logic
- Payment calculations
- Date/time validation
- "No Preference" staff algorithm

```php
// tests/test-availability.php
class Test_Availability extends WP_UnitTestCase {
    
    public function test_no_availability_when_fully_booked() {
        $staff_id = $this->factory->post->create([
            'post_type' => 'booking_staff'
        ]);
        
        // Create booking 9:00-10:00
        $this->create_booking([
            'staff_id' => $staff_id,
            'booking_date' => '2026-01-25',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00'
        ]);
        
        // Check availability
        $available = get_available_slots($staff_id, '2026-01-25');
        
        // Assert 9:00 NOT available
        $this->assertNotContains('09:00', $available);
    }
}
```

---

## 17.3 Integration Testing

### Postman Test Scripts
```javascript
// Test Stripe webhook
pm.test("Webhook processed successfully", function() {
    pm.response.to.have.status(200);
});

pm.test("Booking status updated", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.booking_status).to.eql("confirmed");
});
```

---

## 17.4 Security Testing (OWASP ZAP)

### Automated Scan
```bash
# Run OWASP ZAP on staging
zap-cli quick-scan https://staging.site.com/booking/
```

**Check for:**
- SQL injection
- XSS
- CSRF
- Broken authentication
- Security misconfiguration

**Pass criterion:** Zero high-priority vulnerabilities

---

## 17.5 Accessibility Testing

### Automated (aXe-core)
```bash
npm install -g @axe-core/cli
axe https://staging.site.com/booking/ --save results.json
```

### Manual Testing
- Complete booking with NVDA screen reader
- Navigate with keyboard only (no mouse)
- Verify form errors announced

**Pass criterion:** Zero WCAG 2.1 AA violations

---

## 17.6 Performance Testing

### Lighthouse CI
```bash
lighthouse https://staging.site.com/booking/ \
  --output html \
  --chrome-flags="--headless"
```

**Target:** Performance score ≥90

### Load Testing (k6)
```javascript
// 50 concurrent users
import http from 'k6/http';

export let options = {
  vus: 50,
  duration: '1m',
};

export default function() {
  http.get('https://staging.site.com/booking/');
}
```

**Pass criterion:** <5% error rate, <3s response time

---

# SECTION 18: PHASE 2 ARCHITECTURE PREPARATION

## 18.1 Phase 2 Overview

### Top 5 Priorities
1. **SMS notifications** (20-30h) - Twilio
2. **Recurring appointments** (40-60h) - Weekly series
3. **2-way Google Calendar sync** (40-50h) - Webhooks
4. **Multi-location support** (30-40h) - Chain businesses
5. **Enhanced reporting** (30-40h) - Analytics

**Reference:** MoSCoW_Prioritized_Requirements.md

---

## 18.2 SMS Notifications (Twilio)

### Architecture
```sql
-- Add to customers table
ALTER TABLE wp_bookings_customers
  ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN sms_consent BOOLEAN DEFAULT FALSE;

-- SMS tracking
CREATE TABLE wp_bookings_sms_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status ENUM('queued', 'sent', 'delivered', 'failed'),
  sent_at DATETIME,
  twilio_sid VARCHAR(34),
  FOREIGN KEY (booking_id) REFERENCES wp_bookings(id)
);
```

### Implementation Stub
```php
function send_booking_reminder_sms($booking_id) {
    $twilio = new \Twilio\Rest\Client(
        get_option('twilio_account_sid'),
        get_option('twilio_auth_token')
    );
    
    $message = $twilio->messages->create(
        $customer_phone,
        [
            'from' => get_option('twilio_phone_number'),
            'body' => "Reminder: Appointment tomorrow at 9:00 AM"
        ]
    );
}
```

---

## 18.3 Recurring Appointments

### Database Changes
```sql
-- Add to bookings
ALTER TABLE wp_bookings
  ADD COLUMN series_id BIGINT UNSIGNED NULL,
  ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

-- Recurrence rules
CREATE TABLE wp_bookings_recurrence_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  series_id BIGINT UNSIGNED UNIQUE NOT NULL,
  frequency ENUM('daily', 'weekly', 'monthly'),
  interval INT DEFAULT 1,
  days_of_week VARCHAR(20), -- 'MON,WED,FRI'
  end_type ENUM('never', 'after_occurrences', 'on_date'),
  end_value VARCHAR(20)
);
```

---

## 18.4 Multi-Location Support

### Database Extensions
```sql
CREATE TABLE wp_bookings_locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  timezone VARCHAR(50) DEFAULT 'Europe/London'
);

ALTER TABLE wp_bookings_staff
  ADD COLUMN location_id BIGINT UNSIGNED NULL;

ALTER TABLE wp_bookings
  ADD COLUMN location_id BIGINT UNSIGNED NOT NULL;
```

---

## 18.5 REST API for Mobile App

### JWT Authentication
Replace PHP $_SESSION with JWT tokens for stateless API.

### Public API Endpoints
```
GET    /wp-json/bookings/v1/services
GET    /wp-json/bookings/v1/staff
POST   /wp-json/bookings/v1/bookings
GET    /wp-json/bookings/v1/bookings/:id
PATCH  /wp-json/bookings/v1/bookings/:id
DELETE /wp-json/bookings/v1/bookings/:id
```

### Rate Limiting
100 requests/hour per user

---

# SECTION 19: ARCHITECTURE REVIEW CHECKLIST

## 19.1 Requirements Coverage

- [ ] All 78 MUST HAVE requirements addressed
- [ ] All 40+ NFRs addressed
- [ ] 4 external integrations designed (Stripe, PayPal, Google, Email)
- [ ] Separate dashboard architecture specified
- [ ] 10 database tables validated
- [ ] Race condition handling (UNIQUE constraints)
- [ ] Service categories added

---

## 19.2 Technical Decisions Made

- [ ] Frontend: Vue 3 for dashboard, Vanilla JS for public
- [ ] Authentication: PHP $_SESSION (Phase 1), JWT-ready (Phase 2)
- [ ] Session storage: PHP $_SESSION (not localStorage)
- [ ] Email: Transactional service REQUIRED (not wp_mail)
- [ ] Race conditions: UNIQUE constraints (not locks)
- [ ] Encryption: wp-config.php (not database)
- [ ] Payment: Redirect to hosted pages (PCI SAQ A)
- [ ] Dashboard URL: /dashboard/ subdirectory

---

## 19.3 Compliance Verified

- [ ] GDPR data rights implementation
- [ ] Data retention: 7 years with anonymization
- [ ] WCAG 2.1 AA compliance approach
- [ ] PCI DSS via hosted pages
- [ ] UK timezone and bank holidays
- [ ] GBP-only currency
- [ ] Privacy Policy template required (8-12h)
- [ ] 14-day waiver checkbox

---

## 19.4 Performance Targets

- [ ] <2 second page load strategy
- [ ] Database: Composite indexes
- [ ] Lighthouse ≥90 achievable
- [ ] Frontend: Critical CSS, lazy-load, defer JS
- [ ] Backend: Query caching (60s TTL)
- [ ] Monitoring: Lighthouse CI, slow query log

---

## 19.5 Security Hardened

- [ ] 3 authentication systems
- [ ] Session: HttpOnly, Secure, SameSite, 8-hour timeout
- [ ] Input validation: Prepared statements, escaping, nonces
- [ ] Encryption: AES-256-GCM with wp-config.php key
- [ ] Rate limiting: 5 failed logins per 15 min
- [ ] Payment: No card data (PCI SAQ A)
- [ ] Webhooks: Signature verification

---

## 19.6 Deployment Ready

- [ ] Hosting requirements specified
- [ ] Plugin activation hook
- [ ] Environment config: dev, staging, production
- [ ] Secret management: wp-config.php
- [ ] Backup: Daily automated, 30-day retention
- [ ] Client delivery: 7-step process
- [ ] Rollback: Deactivate plugin

---

## 19.7 Sprint 0 Readiness

- [ ] Database schema SQL ready
- [ ] Plugin directory structure defined
- [ ] Main plugin file structure
- [ ] Activation/deactivation hooks
- [ ] wp-config.php constants
- [ ] Development environment requirements

---

## 19.8 Phase 2 Readiness

- [ ] Database supports future enhancements
- [ ] OAuth supports 2-way sync
- [ ] REST API endpoints ready
- [ ] Settings table extensible
- [ ] Recurrence architecture prepared

---

# APPENDIX A: QUICK REFERENCE

## File Locations
- **Uploads:** `/mnt/user-data/uploads`
- **Work:** `/home/claude`
- **Outputs:** `/mnt/user-data/outputs`

## Key Technologies
- **Backend:** PHP 8.0+, WordPress 6.0+, MySQL 5.7+
- **Frontend Public:** Vanilla JS, Tailwind CSS
- **Frontend Dashboard:** Vue 3, Pinia
- **Payment:** Stripe Checkout, PayPal Orders API
- **Email:** SendGrid/Mailgun/AWS SES (transactional)
- **Calendar:** Google Calendar API v3 (OAuth 2.0)

## Security Highlights
- **PCI DSS:** SAQ A (no card data)
- **Encryption:** AES-256-GCM
- **Sessions:** 8-hour timeout with 2-min warning
- **Rate Limiting:** 5 failed logins per 15 min
- **Magic Links:** 7-day expiry, one-time use

## Performance Targets
- **Page Load:** <2s on 3G
- **Lighthouse:** ≥90
- **Database Queries:** <100ms with 10K records

## Compliance
- **WCAG 2.1 AA:** 100% compliance required
- **GDPR:** 7-year retention with anonymization
- **PCI DSS:** SAQ A via hosted pages

---

# DOCUMENT STATUS

**Phase 5 Complete:** ✅ Architecture documentation finalized  
**Next Phase:** Phase 6 - Sprint 0 (Database implementation)  
**Total Architecture Pages:** ~50 pages (Part 1 + Part 2)  
**Code Examples:** 30+ comprehensive examples  
**Ready for Development:** YES  

**Last Updated:** January 23, 2026  
**Document Version:** 1.0 FINAL  

---

**END OF PART 2 - SECTIONS 9-19**
