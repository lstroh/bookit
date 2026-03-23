# INTEGRATION REQUIREMENTS - PHASE 1 MVP

**Project:** WordPress Booking Plugin  
**Phase:** 2.5 - Integration Requirements  
**Version:** 1.0 DRAFT  
**Date:** January 21, 2026  
**Status:** Ready for Review

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Email Services Integration](#2-email-services-integration)
3. [Stripe Payment Integration](#3-stripe-payment-integration)
4. [PayPal Payment Integration](#4-paypal-payment-integration)
5. [Google Calendar Integration](#5-google-calendar-integration)
6. [Integration Dependencies](#6-integration-dependencies)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Phase 2 Integrations (Future)](#8-phase-2-integrations-future)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Phase 1 MVP Integrations

This document specifies the integration requirements for the four critical third-party services in Phase 1:

| Integration | Priority | Purpose | Complexity |
|-------------|----------|---------|------------|
| **Email Services (Brevo)** | CRITICAL | Booking confirmations, reminders, SMS | Medium |
| **Stripe** | CRITICAL | Primary payment processing | High |
| **PayPal** | HIGH | Alternative payment method | High |
| **Google Calendar** | MEDIUM | Staff calendar sync (1-way) | High |

### 1.2 Critical Email Deliverability Decision

**RECOMMENDATION: REQUIRE Transactional Email Service for Production**

**Rationale:**
- **WordPress wp_mail() is NOT recommended for production booking systems**
- **Why traditional SMTP fails:**
  - Shared hosting blocks port 25 (spam prevention)
  - Emails frequently land in spam folders (no SPF/DKIM)
  - No delivery tracking or retry logic
  - No bounce handling
  - Poor reliability (5-20% failure rate on shared hosting)

**Business Impact:**
- Missed bookings due to undelivered confirmations
- Customer frustration when reminders don't arrive
- Lost revenue from payment confirmations in spam
- Support burden dealing with "I never got the email"

**Recommended Solution:**
- **Primary vendor: Brevo** — covers both transactional email and SMS
  via a single API key. Free tier: 300 emails/day. Paid from ~£15/month.
- **Architecture: Provider abstraction layer (driver pattern)** — email
  and SMS providers implement interfaces. Active vendor is a settings
  choice, not a code change. Allows mixing vendors (e.g. Brevo email +
  Twilio SMS) or switching vendors without refactoring.
- **Included providers at launch:**
  - Bookit_Brevo_Email_Provider (primary)
  - Bookit_WP_Mail_Fallback_Provider (graceful degradation, warnings shown)
  - Bookit_Brevo_SMS_Provider (Sprint 5 activation)
- **Future providers (drop-in, no core changes):**
  - Bookit_Twilio_SMS_Provider (Phase 2)
  - Bookit_Mailgun_Email_Provider / Bookit_Sendgrid_Email_Provider (on demand)
- Use WordPress wp_mail() as **fallback only** (with prominent admin warning)
- Include Brevo cost in client proposals (~£0–25/month depending on volume)

**Implementation Strategy:**
1. Check for transactional service during setup wizard
2. If none configured → Show prominent warning: "Email deliverability may be poor"
3. Provide Brevo setup guide (API key + domain verification) in plugin settings
4. Monitor bounce rates and alert if >5%

---

## 2. EMAIL SERVICES INTEGRATION

### 2.1 Integration Purpose & Use Cases

**Why Needed:**
- Send critical transactional emails (confirmations, reminders, cancellations)
- Ensure 98%+ delivery rate for booking communications
- Track delivery status and bounce rates
- Comply with email best practices (SPF, DKIM, DMARC)

**User Stories:**
- **Customer:** "When I book an appointment, I want immediate email confirmation so I know it's secured"
- **Customer:** "I want a reminder email 24 hours before so I don't forget"
- **Staff:** "When I'm assigned a booking, I want instant notification so I can prepare"
- **Business Owner:** "I need to know if emails are bouncing so I can contact customers"

### 2.2 Email Architecture

**Email Types & Volume (per 10k bookings/month):**

| Email Type | Frequency | Volume/Month | Priority |
|------------|-----------|--------------|----------|
| Booking Confirmation | Per booking | 10,000 | CRITICAL |
| 24hr Reminder | Per booking | 10,000 | HIGH |
| Cancellation Confirmation | ~5% of bookings | 500 | HIGH |
| Rescheduling Confirmation | ~10% of bookings | 1,000 | HIGH |
| Staff New Booking Notification | Per booking | 10,000 | MEDIUM |
| Daily Staff Schedule | Per staff/day | 150 | LOW |
| Payment Receipt | Per paid booking | 10,000 | HIGH |
| **TOTAL** | | **~42,000/month** | |

**Peak Load:** 2,000 emails/hour during business hours

### 2.3 Data Flow

**Trigger → Queue → Send → Track**

```
Booking Created
    ↓
Add to Email Queue (Action Scheduler)
    ↓
Cron Job (every 5 min) - Process 50 emails/batch
    ↓
Call Transactional Service API
    ↓
Log Send Status (success/fail)
    ↓
Handle Bounces/Failures (retry 3x)
```

**Data Sent to Email Service:**
- `to`: Customer email (validated)
- `from`: Business email (bookings@clientbusiness.co.uk)
- `subject`: Template-based
- `html_body`: Rendered HTML template
- `text_body`: Plain text fallback
- `custom_args`: {booking_id, email_type, customer_id}
- `reply_to`: Business Owner email

**Data Received from Email Service:**
- `message_id`: Unique identifier
- `status`: accepted, delivered, bounced, spam_report, dropped
- `timestamp`: When status changed
- `bounce_reason`: (if bounced)

### 2.4 Authentication & Authorization

**Option 1: SendGrid (Recommended)**
- **Auth Method:** API Key
- **Credential Storage:** 
  - Encrypted in `wp_options` table
  - Key: `booking_sendgrid_api_key`
  - Encryption: AES-256-GCM (per TechnicalRequirements.md §2.2)
- **Configuration UI:** WordPress Admin → Settings → Email
  - Field: "SendGrid API Key" (password field)
  - Button: "Test Connection" (sends test email to admin)
  - Help text: "Get your API key from sendgrid.com/settings/api_keys"

**Option 2: Mailgun**
- **Auth Method:** API Key + Domain
- **Credentials:**
  - `mailgun_api_key` (encrypted)
  - `mailgun_domain` (e.g., mg.clientbusiness.co.uk)
- **Configuration:** Same UI pattern as SendGrid

**Option 3: AWS SES**
- **Auth Method:** IAM Access Key + Secret
- **Credentials:**
  - `aws_access_key_id` (encrypted)
  - `aws_secret_access_key` (encrypted)
  - `aws_region` (e.g., eu-west-2)

**Option 4: WordPress SMTP (Fallback)**
- **Auth Method:** SMTP credentials
- **Configuration:**
  - Host, Port, Username, Password, Encryption (TLS/SSL)
  - **Warning Message:** "SMTP delivery is less reliable than transactional services. Consider SendGrid or Mailgun for better deliverability."

**Credential Validation:**
- "Test Connection" button sends test email to Business Owner
- If fails → Display specific error (invalid key, quota exceeded, domain not verified)
- Success → Green checkmark "✓ Connected to SendGrid"

### 2.5 API Endpoints & Methods

**SendGrid API v3**

**Endpoint:** `https://api.sendgrid.com/v3/mail/send`  
**Method:** `POST`  
**Headers:**
```
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Request Payload:**
```json
{
  "personalizations": [
    {
      "to": [{"email": "customer@example.com", "name": "Sarah Johnson"}],
      "subject": "Your booking with Shine & Style is confirmed",
      "custom_args": {
        "booking_id": "12345",
        "email_type": "booking_confirmation"
      }
    }
  ],
  "from": {
    "email": "bookings@clientbusiness.co.uk",
    "name": "Shine & Style Hair Studio"
  },
  "reply_to": {
    "email": "info@clientbusiness.co.uk"
  },
  "content": [
    {
      "type": "text/plain",
      "value": "Hi Sarah, your appointment is confirmed for..."
    },
    {
      "type": "text/html",
      "value": "<html><body>...</body></html>"
    }
  ]
}
```

**Success Response (202 Accepted):**
```json
{
  "message_id": "8RwhwQoFQzOpXMO70_YLuQ"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid API key
- `403 Forbidden`: API key doesn't have mail.send permission
- `413 Payload Too Large`: Email body >30MB
- `429 Too Many Requests`: Rate limit exceeded (see §2.5 Rate Limits)

**Rate Limits:**
- SendGrid Free: 100 emails/day
- SendGrid Essentials ($14.95/mo): 40,000 emails/month = ~54 emails/hour
- **Recommendation:** Start with Essentials plan, upgrade to Pro ($89.95/mo) for 100k emails/month

**Handling Rate Limits:**
```php
if ($response_code === 429) {
    // Exponential backoff: retry after 1 min, 5 min, 15 min
    $retry_after = $response_headers['X-RateLimit-Reset'] ?? time() + 60;
    as_schedule_single_action($retry_after, 'booking_retry_email', ['email_id' => $email_id]);
}
```

### 2.6 Error Handling

**Error Scenarios:**

| Error | Cause | Handling | User Message |
|-------|-------|----------|--------------|
| `401 Unauthorized` | Invalid API key | Alert admin, fallback to SMTP | "Email service configuration error. Admin notified." |
| `403 Forbidden` | Insufficient permissions | Alert admin | Same as above |
| `429 Rate Limit` | Quota exceeded | Queue for retry (exponential backoff) | "Email queued for sending" |
| `400 Bad Request` | Invalid email address | Log error, don't retry | "Invalid email address. Please update." |
| `500 Server Error` | SendGrid downtime | Retry 3x, fallback to SMTP | "Email sending delayed" |
| Network timeout | Hosting/network issue | Retry 3x with 5s timeout | "Email queued for sending" |

**Retry Logic:**
- Attempt 1: Immediate
- Attempt 2: After 5 minutes (exponential backoff)
- Attempt 3: After 15 minutes
- Final attempt: After 60 minutes
- If all fail → Alert Business Owner, log to error_log

**Bounce Handling (via Webhooks - see §2.7):**
- Hard bounce (invalid email) → Mark customer email as invalid, alert Business Owner
- Soft bounce (mailbox full) → Retry once after 24 hours
- Spam complaint → Unsubscribe customer from marketing emails, alert admin

**Logging Requirements:**
- **DO LOG:**
  - Email sent: {booking_id, email_type, to (masked), message_id, timestamp}
  - Email bounced: {message_id, bounce_type, bounce_reason}
  - API errors: {error_code, error_message, timestamp}
- **DO NOT LOG:**
  - Full email content (GDPR compliance)
  - API keys or credentials
  - Customer personal data in error logs

### 2.7 Webhook Handling

**SendGrid Event Webhook**

**Purpose:** Track email delivery status (delivered, bounced, opened, clicked)

**Endpoint URL:**
```
https://clientsite.com/wp-json/booking/v1/sendgrid-webhook
```

**Signature Verification:**
```php
function verify_sendgrid_webhook($request) {
    $signature = $request->get_header('X-Twilio-Email-Event-Webhook-Signature');
    $timestamp = $request->get_header('X-Twilio-Email-Event-Webhook-Timestamp');
    $payload = $request->get_body();
    
    $verification_key = get_option('booking_sendgrid_verification_key');
    $expected_signature = base64_encode(hash_hmac('sha256', $timestamp . $payload, $verification_key, true));
    
    return hash_equals($expected_signature, $signature);
}
```

**Event Types Handled:**

| Event | Action | Business Logic |
|-------|--------|----------------|
| `delivered` | Mark email as delivered | Update email_log status |
| `bounce` | Handle bounce (hard/soft) | Mark customer email invalid if hard bounce |
| `spam_report` | Unsubscribe customer | Set marketing_consent = 0 |
| `dropped` | Log reason | Alert admin if pattern detected |
| `open` | Track engagement (optional) | Update open_rate metrics (Phase 2) |
| `click` | Track link clicks (optional) | Track which links clicked (Phase 2) |

**Idempotency:** Use `sg_message_id` as unique key to prevent duplicate processing

**Async Processing:**
- Webhooks processed immediately (< 3 seconds response)
- Heavy operations (refund logic, customer updates) queued via Action Scheduler

**Retry Mechanism:**
- SendGrid retries webhook delivery if response != 200 OK
- Our endpoint must return 200 immediately, process async

### 2.8 Configuration UI

**WordPress Admin → Bookings → Settings → Email**

**Section 1: Email Service Provider**
```
[ ] Use WordPress Default (wp_mail) ⚠️  Not recommended for production
    Help: WordPress email may be unreliable on shared hosting
    
[•] Use Transactional Email Service (Recommended)
    Service: [Dropdown: SendGrid | Mailgun | AWS SES | Postmark]
    
    [If SendGrid selected]
    API Key: [••••••••••••••••] (password field)
    [Test Connection] button
    
    Status: ✓ Connected | ⚠️ Not configured | ❌ Connection failed
```

**Section 2: Email Branding**
```
From Name: [Shine & Style Hair Studio]
From Email: [bookings@clientbusiness.co.uk]
Reply-To Email: [info@clientbusiness.co.uk]

⚠️ Warning: Sending from a different domain (e.g., @gmail.com) may result in spam. 
Use an email address from your domain (clientbusiness.co.uk).

Logo: [Upload] (appears in email header)
```

**Section 3: Notification Settings**
```
Customer Notifications:
☑ Booking Confirmation (sent immediately)
☑ 24-Hour Reminder (sent at 8:00 AM day before)
☑ Cancellation Confirmation
☑ Rescheduling Confirmation
☑ Payment Receipt
☑ Refund Processed

Staff Notifications:
☑ New Booking Assigned
☑ Booking Cancelled
☑ Booking Rescheduled
☑ Daily Schedule Summary (sent at 7:00 AM)

Business Owner Notifications:
☑ New Booking (all bookings)
☑ Cancellation Request
☑ Late Cancellation (outside policy window)
☐ Daily Revenue Summary (sent at 9:00 PM)
☐ Weekly Performance Report (Monday 9:00 AM)
```

**Section 4: Email Templates**
```
[Edit Templates] button → Navigate to email template editor
(See BusinessOwner-AdminRequirements.md § User Story 7.2)
```

**Validation:**
- From Email must be valid email format
- From Email domain must match site domain (warning if not)
- API Key required if transactional service selected
- "Test Connection" must succeed before saving

### 2.9 Edge Cases & Limitations

**Scenarios:**

| Edge Case | Impact | Handling |
|-----------|--------|----------|
| Email service down | Confirmations not sent | Fallback to WordPress SMTP, alert admin |
| API quota exceeded mid-day | New bookings not confirmed | Queue emails, alert admin to upgrade plan |
| Customer email bounces (hard) | Customer doesn't get confirmations | Alert Business Owner, suggest SMS (Phase 2) |
| Customer typo in email | Booking succeeds but no confirmation | Show email on confirmation page, offer "Resend" |
| Webhook endpoint unreachable | Bounces not tracked | SendGrid retries 3x, manual bounce check daily |
| Spam complaints threshold | Account suspended | Monitor spam rate <0.1%, double opt-in for marketing |
| Email template broken (syntax error) | Emails fail to send | Validate template before save, fallback to default |
| Rate limit hit during peak hour | Emails delayed | Queue overflow handling, scale plan proactively |

**Limitations:**
- Email delivery not guaranteed (3rd party reliability ~99.9%)
- Cannot prevent spam folder placement (SPF/DKIM help but not 100%)
- No synchronous email sending (always queued for reliability)
- Attachment support limited (Phase 2 - invoices, calendar .ics files)

### 2.10 Security Considerations

**Data Protection:**
- API keys encrypted at rest (AES-256-GCM)
- API keys transmitted over HTTPS only
- Webhook signatures verified (prevent spoofing)
- Customer emails masked in logs (sarah@example.com → s***@e***.com)

**PII Handling:**
- Email content NOT logged (GDPR compliance)
- Bounce data retained 90 days only
- Customer can request email deletion (GDPR right to erasure)

**Best Practices:**
- Separate API keys per environment (test vs production)
- Rotate API keys annually
- Monitor for suspicious activity (mass sends, high bounce rate)
- Rate limit email sending per user (prevent abuse)

**What NOT to Log:**
- Full email HTML/text content
- API keys or webhook secrets
- Customer passwords or tokens
- Full email addresses in error logs (mask them)

---

## 3. STRIPE PAYMENT INTEGRATION

### 3.1 Integration Purpose & Use Cases

**Why Needed:**
- Process credit/debit card payments for booking deposits
- PCI DSS compliant (no card data touches our servers)
- Handle refunds for cancellations
- Support major UK payment methods (Visa, Mastercard, Amex)

**User Stories:**
- **Customer:** "I want to pay securely with my debit card to confirm my booking"
- **Customer:** "If I cancel within the policy window, I want automatic refund"
- **Business Owner:** "I need payment confirmations before appointments are secured"
- **Business Owner:** "I want to issue refunds easily from the dashboard"

**Business Value:**
- Reduces no-shows (payment commitment)
- Guarantees revenue for business owners
- Professional checkout experience
- Automated refund processing

### 3.2 Data Flow

**Booking Flow with Stripe Checkout:**

```
Customer selects date/time/service
    ↓
Click "Pay & Confirm" (£25 deposit)
    ↓
Plugin creates Stripe Checkout Session (server-side)
    ↓
Redirect customer to Stripe hosted page (checkout.stripe.com)
    ↓
Customer enters card details on Stripe page (PCI compliant)
    ↓
Stripe processes payment
    ↓
Redirect back to our site (success_url or cancel_url)
    ↓
Stripe sends webhook to our server (payment_intent.succeeded)
    ↓
Webhook handler creates booking in database (atomic operation)
    ↓
Send confirmation email
    ↓
Sync to Google Calendar
```

**Data Sent to Stripe:**
```json
{
  "mode": "payment",
  "line_items": [{
    "price_data": {
      "currency": "gbp",
      "product_data": {
        "name": "Women's Haircut - Deposit",
        "description": "with Emma Thompson on 15 May 2026 at 2:00 PM"
      },
      "unit_amount": 2500
    },
    "quantity": 1
  }],
  "customer_email": "sarah.j@email.com",
  "client_reference_id": "temp_booking_uuid_123",
  "metadata": {
    "booking_temp_id": "temp_booking_uuid_123",
    "service_id": "5",
    "staff_id": "3",
    "booking_date": "2026-05-15",
    "booking_time": "14:00"
  },
  "success_url": "https://clientsite.com/booking-confirmed?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://clientsite.com/book?step=4&cancelled=1"
}
```

**Data Received from Stripe (Webhook):**
```json
{
  "id": "evt_1MqL3D2eZvKYlo2C7PpH9234",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "amount_total": 2500,
      "currency": "gbp",
      "customer_email": "sarah.j@email.com",
      "payment_intent": "pi_abc123",
      "payment_status": "paid",
      "metadata": {
        "booking_temp_id": "temp_booking_uuid_123"
      }
    }
  }
}
```

**Refund Flow:**
```
Business Owner clicks "Refund" on booking
    ↓
Calculate refund amount (based on cancellation policy)
    ↓
Create Stripe Refund via API
    ↓
Wait for refund confirmation
    ↓
Update booking status to 'cancelled' + 'refunded'
    ↓
Send cancellation confirmation email to customer
    ↓
Remove from Google Calendar
```

### 3.3 Authentication & Authorization

**API Key Types:**
- **Publishable Key** (`pk_test_...` or `pk_live_...`): Client-side, safe to expose
- **Secret Key** (`sk_test_...` or `sk_live_...`): Server-side ONLY, never exposed
- **Webhook Secret** (`whsec_...`): For webhook signature verification

**Credential Storage:**
```php
// wp_options table (encrypted)
'booking_stripe_public_key' => encrypt('pk_live_abc123...')
'booking_stripe_secret_key' => encrypt('sk_live_xyz789...')
'booking_stripe_webhook_secret' => encrypt('whsec_def456...')
'booking_stripe_test_mode' => false // true = test keys, false = live keys
```

**Configuration UI: WordPress Admin → Settings → Payments → Stripe**
```
Test Mode: [Toggle: ON | OFF]

[If Test Mode ON]
Test Publishable Key: [pk_test_..............................]
Test Secret Key: [sk_test_..............................]
Help: Get test keys from dashboard.stripe.com/test/apikeys

[If Test Mode OFF]
⚠️ LIVE MODE - Real charges will be processed

Live Publishable Key: [pk_live_..............................]
Live Secret Key: [sk_live_..............................]
Help: Get live keys from dashboard.stripe.com/apikeys

Webhook Signing Secret: [whsec_........................] (Optional but recommended)
Help: Found at dashboard.stripe.com/webhooks

[Test Connection] button
Status: ✓ Connected to Stripe | ❌ Invalid keys
```

**Token Refresh:** Not applicable (API keys don't expire, but can be rolled over manually)

**Credential Validation:**
```php
function test_stripe_connection($secret_key) {
    \Stripe\Stripe::setApiKey($secret_key);
    
    try {
        $account = \Stripe\Account::retrieve();
        return [
            'success' => true,
            'message' => "Connected to Stripe account: {$account->business_profile->name}"
        ];
    } catch (\Stripe\Exception\AuthenticationException $e) {
        return [
            'success' => false,
            'message' => "Invalid API key. Please check your secret key."
        ];
    }
}
```

### 3.4 API Endpoints & Methods

**Stripe API Version:** `2023-10-16` (latest stable as of Jan 2026)

**Base URL:** `https://api.stripe.com/v1/`

**Required Endpoints:**

#### 1. Create Checkout Session
**Endpoint:** `POST /v1/checkout/sessions`  
**Purpose:** Create hosted payment page  
**Headers:**
```
Authorization: Bearer sk_live_xyz789
Content-Type: application/x-www-form-urlencoded
Stripe-Version: 2023-10-16
```
**Request:**
```
mode=payment
&line_items[0][price_data][currency]=gbp
&line_items[0][price_data][unit_amount]=2500
&line_items[0][price_data][product_data][name]=Women's Haircut - Deposit
&line_items[0][quantity]=1
&customer_email=sarah@example.com
&metadata[booking_temp_id]=temp_123
&success_url=https://site.com/booking-confirmed?session_id={CHECKOUT_SESSION_ID}
&cancel_url=https://site.com/book?step=4&cancelled=1
```
**Response (200 OK):**
```json
{
  "id": "cs_test_abc123",
  "object": "checkout.session",
  "url": "https://checkout.stripe.com/c/pay/cs_test_abc123#fidkdWxOY...",
  "payment_status": "unpaid",
  "amount_total": 2500,
  "currency": "gbp"
}
```

**Usage:**
```php
$session = \Stripe\Checkout\Session::create([
    'mode' => 'payment',
    'line_items' => [[
        'price_data' => [
            'currency' => 'gbp',
            'unit_amount' => $deposit_amount * 100, // £25 = 2500 pence
            'product_data' => [
                'name' => $service_name . ' - Deposit',
                'description' => 'with ' . $staff_name . ' on ' . $booking_date
            ]
        ],
        'quantity' => 1
    ]],
    'customer_email' => $customer_email,
    'metadata' => [
        'booking_temp_id' => $temp_booking_id,
        'service_id' => $service_id
    ],
    'success_url' => home_url('/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'),
    'cancel_url' => home_url('/book?step=4&cancelled=1')
]);

// Redirect customer to Stripe
wp_redirect($session->url);
exit;
```

#### 2. Create Refund
**Endpoint:** `POST /v1/refunds`  
**Purpose:** Refund a payment  
**Request:**
```
payment_intent=pi_abc123
&amount=2500
&reason=requested_by_customer
&metadata[booking_id]=12345
```
**Response (200 OK):**
```json
{
  "id": "re_abc123",
  "object": "refund",
  "amount": 2500,
  "currency": "gbp",
  "status": "succeeded",
  "payment_intent": "pi_abc123"
}
```

**Usage:**
```php
$refund = \Stripe\Refund::create([
    'payment_intent' => $booking->stripe_payment_intent_id,
    'amount' => $refund_amount * 100, // Full or partial
    'reason' => 'requested_by_customer',
    'metadata' => ['booking_id' => $booking_id]
]);

if ($refund->status === 'succeeded') {
    update_booking_status($booking_id, 'refunded');
    send_refund_confirmation_email($booking_id);
}
```

#### 3. Retrieve Payment Intent
**Endpoint:** `GET /v1/payment_intents/:id`  
**Purpose:** Get payment details  
**Response (200 OK):**
```json
{
  "id": "pi_abc123",
  "amount": 2500,
  "currency": "gbp",
  "status": "succeeded",
  "charges": {
    "data": [{
      "id": "ch_abc123",
      "amount": 2500,
      "payment_method_details": {
        "card": {
          "brand": "visa",
          "last4": "4242"
        }
      }
    }]
  }
}
```

**Rate Limits:**
- **Production:** 100 requests/second per account
- **Test Mode:** 25 requests/second
- **Handling:**
  ```php
  if ($e instanceof \Stripe\Exception\RateLimitException) {
      sleep(2); // Wait 2 seconds
      return retry_stripe_request(); // Retry once
  }
  ```

### 3.5 Error Handling

**Stripe Error Types:**

| Error Code | Cause | Handling | User Message |
|------------|-------|----------|--------------|
| `card_declined` | Bank declined card | Show error, suggest retry | "Your card was declined. Please try another card." |
| `expired_card` | Card expired | Prompt for new card | "Your card has expired. Please use a different card." |
| `insufficient_funds` | Not enough balance | Suggest different payment method | "Insufficient funds. Please use another card." |
| `incorrect_cvc` | Wrong CVV | Prompt retry | "Incorrect security code. Please check and try again." |
| `processing_error` | Stripe temp issue | Retry automatically | "Payment processing error. Retrying..." |
| `rate_limit_error` | Too many requests | Exponential backoff | "Please wait a moment and try again." |
| `authentication_error` | Invalid API key | Alert admin, block checkout | "Payment system error. Please contact us." |
| `invalid_request_error` | Bad API call | Log error, alert admin | "Booking error. Please try again or contact us." |

**Retry Logic:**
- Card declined: No retry (customer must fix)
- Network timeout: Retry 2x with 3s delay
- Rate limit: Exponential backoff (1s, 2s, 4s)
- Stripe 5xx error: Retry 3x with 5s delay

**Fallback Behavior:**
- If Stripe is down → Allow "Pay on Arrival" option (if enabled)
- If webhook fails → Daily cron checks for abandoned checkout sessions
- If refund fails → Queue for retry, alert Business Owner

**Logging:**
```php
// DO LOG
error_log("Stripe payment failed: booking_temp_id={$temp_id}, error={$e->getMessage()}");

// DO NOT LOG
// - Full card numbers (PCI violation)
// - CVV codes
// - API secret keys
```

### 3.6 Testing Requirements

**Test Mode:**
- Use separate test API keys (`pk_test_`, `sk_test_`)
- No real money charged
- Use Stripe test cards: https://stripe.com/docs/testing

**Test Cards:**
```
Success: 4242 4242 4242 4242 (any CVC, future expiry)
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
Expired card: 4000 0000 0000 0069
```

**Test Scenarios:**

| Scenario | Test Card | Expected Outcome |
|----------|-----------|------------------|
| Successful payment | 4242 4242 4242 4242 | Booking created, email sent |
| Card declined | 4000 0000 0000 0002 | Error message, no booking |
| Network timeout | (simulate) | Retry logic triggered |
| Webhook delivery failure | (disable endpoint) | Booking created via fallback cron |
| Refund request | (after successful payment) | Refund processed, booking cancelled |
| Concurrent bookings | (load test 50 users) | Only 1 succeeds, 49 fail gracefully |

**Success Criteria:**
- ✓ Test payment completes in <3 seconds
- ✓ Webhook processed in <1 second
- ✓ Booking created atomically (no double-booking)
- ✓ Failed payments don't create bookings
- ✓ Refunds process correctly (full and partial)

**Test/Production Mode Switch:**
```php
if (get_option('booking_stripe_test_mode') === '1') {
    \Stripe\Stripe::setApiKey(get_option('booking_stripe_test_secret_key'));
} else {
    \Stripe\Stripe::setApiKey(get_option('booking_stripe_live_secret_key'));
}
```

### 3.7 Webhook Handling

**Webhook Endpoint:**
```
https://clientsite.com/wp-json/booking/v1/stripe-webhook
```

**Event Types Handled:**

| Event | Purpose | Action |
|-------|---------|--------|
| `checkout.session.completed` | Payment succeeded | Create booking in database |
| `payment_intent.succeeded` | (Secondary check) | Verify payment status |
| `charge.refunded` | Refund processed | Update booking status |
| `charge.dispute.created` | Customer disputed charge | Alert Business Owner |
| `payment_intent.payment_failed` | Payment failed after checkout | Log error, alert customer |

**Signature Verification (CRITICAL for security):**
```php
function verify_stripe_webhook() {
    $payload = @file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
    $webhook_secret = get_option('booking_stripe_webhook_secret');
    
    try {
        $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $webhook_secret);
    } catch(\UnexpectedValueException $e) {
        http_response_code(400);
        exit('Invalid payload');
    } catch(\Stripe\Exception\SignatureVerificationException $e) {
        http_response_code(400);
        exit('Invalid signature');
    }
    
    return $event;
}
```

**Webhook Handler:**
```php
add_action('rest_api_init', function() {
    register_rest_route('booking/v1', '/stripe-webhook', [
        'methods' => 'POST',
        'callback' => 'handle_stripe_webhook',
        'permission_callback' => '__return_true' // Verified by signature
    ]);
});

function handle_stripe_webhook($request) {
    $event = verify_stripe_webhook();
    
    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        
        // Extract metadata
        $temp_booking_id = $session->metadata->booking_temp_id;
        $customer_email = $session->customer_email;
        $payment_intent_id = $session->payment_intent;
        
        // ATOMIC BOOKING CREATION (prevent double-booking)
        global $wpdb;
        $wpdb->query('START TRANSACTION');
        
        try {
            $booking_id = create_booking_from_temp([
                'temp_id' => $temp_booking_id,
                'customer_email' => $customer_email,
                'payment_intent_id' => $payment_intent_id,
                'payment_status' => 'paid'
            ]);
            
            $wpdb->query('COMMIT');
            
            // Success - send emails, sync calendar (async)
            as_enqueue_async_action('booking_send_confirmation', ['booking_id' => $booking_id]);
            as_enqueue_async_action('booking_sync_google_calendar', ['booking_id' => $booking_id]);
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log("Booking creation failed: {$e->getMessage()}");
        }
    }
    
    http_response_code(200);
    echo json_encode(['received' => true]);
}
```

**Idempotency:**
- Use `booking_temp_id` as unique constraint
- Database prevents duplicate bookings (UNIQUE constraint)
- Webhook can be received multiple times safely

**Async Processing:**
- Webhook responds with 200 OK immediately (< 1 second)
- Email sending and calendar sync queued (Action Scheduler)
- Heavy operations don't block webhook response

**Retry Mechanism:**
- Stripe retries failed webhooks (5xx errors) for 72 hours
- Exponential backoff: 1 min, 5 min, 30 min, 2 hrs, 6 hrs
- After 72 hours, event appears in Dashboard → Events → Failed webhooks

### 3.8 Configuration UI

*Covered in §3.3 Authentication & Authorization*

**Additional Settings:**

```
Payment Options:
☑ Accept Stripe (Credit/Debit Cards)
☐ Accept PayPal
☐ Allow "Pay on Arrival" (no payment required)

Default Payment Method: [Dropdown: Stripe | PayPal]

Deposit Amount:
(•) Fixed amount: £[25.00] per booking
( ) Percentage: [50]% of service price
( ) Full payment required upfront

Currency: GBP (£) - Fixed for Phase 1
```

### 3.9 Edge Cases & Limitations

| Edge Case | Impact | Handling |
|-----------|--------|----------|
| Customer closes checkout tab | Payment not completed | Temp booking expires after 30 min |
| Payment succeeds but webhook fails | Booking not created | Daily cron checks abandoned sessions |
| Refund requested after 7 days | Stripe fee not returned | Warn Business Owner: "£0.20 fee not refunded" |
| Dispute (chargeback) filed | Business loses money + fee | Alert admin, provide evidence to Stripe |
| Multiple tabs open (same customer) | Risk of double-booking | Temp booking ID prevents duplicates |
| Stripe API down during checkout | Customer can't pay | Fallback: "Pay on Arrival" or try later |
| API keys rotated mid-transaction | Checkout fails | Graceful error: "Payment error. Please retry." |
| Customer books, pays, then cancels in 1 min | Refund not instant | Refund takes 5-10 days (Stripe policy) |

**Limitations:**
- Refunds take 5-10 business days (bank processing time)
- Stripe fee (1.5% + £0.20) not refunded
- No support for bank transfer or cash payments (Phase 2)
- Currency locked to GBP (Phase 1 limitation)
- Cannot split payment across multiple cards
- No installment payments or "pay later" (Phase 2)

### 3.10 Security Considerations

**PCI Compliance:**
- ✓ NO card data ever touches our servers
- ✓ All payments via Stripe Checkout (PCI-compliant hosted page)
- ✓ Only store: `payment_intent_id`, `last4`, `card_brand`, `amount_paid`
- ✓ Never log full card numbers or CVV

**Data Encryption:**
- API keys encrypted at rest (AES-256-GCM)
- Webhook signatures verified (HMAC-SHA256)
- HTTPS required for all Stripe API calls

**API Key Security:**
- Separate test vs live keys
- Keys stored in `wp_options` (encrypted)
- Never in version control or logs
- Rotate keys annually

**Webhook Security:**
- Signature verification mandatory
- Reject unsigned webhooks (400 Bad Request)
- Rate limit webhook endpoint (100 requests/min)

**Fraud Prevention:**
- Stripe Radar automatically blocks suspicious cards
- Monitor chargeback rate (keep <0.5%)
- Block repeat failed payment attempts (>3 per email)

**What NOT to Log:**
- Full card numbers (PCI violation)
- CVV codes
- API secret keys
- Customer billing addresses (unless needed for refunds)


## 5. RACE CONDITION HANDLING (Simplified)

### Problem Statement

Two customers attempt to book the same time slot simultaneously. Without protection, both might receive "available," both complete payment, but only one booking can be created.

### Solution: Database Constraints + Optimistic Locking + User-Friendly Errors

**Phase 1 Approach: Simple & Reliable**

**1. Database-Level Protection (PRIMARY)**
```sql
-- Unique constraint prevents double-bookings at database level
ALTER TABLE wp_bookings 
ADD UNIQUE KEY unique_booking (staff_id, booking_date, start_time);
```

**How it works:**
- First booking attempt succeeds
- Second booking attempt **fails with database error**
- No manual slot reservation needed
- Database guarantees no double-bookings

**2. Application-Level Optimistic Locking**
```php
function create_booking_with_payment($booking_data, $payment_data) {
    global $wpdb;
    
    // Check availability before payment redirect
    if (!is_slot_available($booking_data['staff_id'], $booking_data['date'], $booking_data['start_time'])) {
        return ['error' => 'slot_unavailable', 'message' => 'This time is no longer available'];
    }
    
    // Create Stripe/PayPal checkout session
    $payment_session = create_payment_session($booking_data, $payment_data);
    
    // Store booking data in payment metadata
    // (includes all info needed to create booking after payment)
    
    return ['success' => true, 'redirect_url' => $payment_session->url];
}

function create_booking_after_payment($metadata, $payment_intent_id) {
    global $wpdb;
    
    // Double-check availability (payment may have taken 2-5 minutes)
    if (!is_slot_available($metadata['staff_id'], $metadata['date'], $metadata['start_time'])) {
        // Slot taken while customer was paying
        // Automatic refund + friendly error message
        issue_immediate_refund($payment_intent_id);
        
        send_slot_taken_email([
            'customer_email' => $metadata['customer_email'],
            'original_time' => $metadata['start_time'],
            'staff_name' => $metadata['staff_name']
        ]);
        
        log_race_condition_event($metadata, 'slot_taken_during_payment');
        return ['error' => 'slot_taken', 'refund_issued' => true];
    }
    
    // Attempt booking creation
    try {
        $booking_id = $wpdb->insert('wp_bookings', [
            'staff_id' => $metadata['staff_id'],
            'booking_date' => $metadata['date'],
            'start_time' => $metadata['start_time'],
            'customer_email' => $metadata['customer_email'],
            'payment_intent_id' => $payment_intent_id,
            // ... other fields
        ]);
        
        if ($booking_id) {
            return ['success' => true, 'booking_id' => $booking_id];
        }
    } catch (Exception $e) {
        // UNIQUE constraint violation = race condition
        if (strpos($e->getMessage(), 'unique_booking') !== false) {
            // Someone else just booked this slot
            issue_immediate_refund($payment_intent_id);
            
            send_slot_taken_email([
                'customer_email' => $metadata['customer_email'],
                'original_time' => $metadata['start_time']
            ]);
            
            log_race_condition_event($metadata, 'database_constraint_violation');
            return ['error' => 'slot_taken', 'refund_issued' => true];
        }
        
        // Other error
        throw $e;
    }
}
```

**3. User-Friendly Error Messaging**

If slot is taken during payment:
```
┌─────────────────────────────────────┐
│ 😞 Time No Longer Available         │
│                                     │
│ Someone else booked 2:00 PM while   │
│ you were completing payment.        │
│                                     │
│ Your card was NOT charged.          │
│ (If you see a pending charge, it    │
│ will disappear in 1-2 days)         │
│                                     │
│ Would you like to:                  │
│                                     │
│ [Choose Another Time]               │
│ [Choose Another Day]                │
│ [Contact Us: 020 1234 5678]         │
│                                     │
└─────────────────────────────────────┘
```

**4. Real-Time Availability Updates (Optional Enhancement)**
```javascript
// Auto-refresh time slots every 30 seconds on Step 3
setInterval(() => {
    refreshAvailability();
}, 30000);
```

**5. Monitoring & Alerts**
```php
// Daily report to Business Owner
function send_race_condition_summary() {
    $count = get_race_condition_count_last_24h();
    
    if ($count > 0) {
        send_admin_email([
            'subject' => "Race Condition Report: {$count} occurrences",
            'message' => "{$count} customers attempted to book slots that became unavailable during checkout. All were handled automatically with refunds."
        ]);
    }
}
```

### Why This is Better Than Temp Holds

**Temp Holds Approach (Rejected):**
- ❌ Requires separate database table
- ❌ Requires cron job for cleanup
- ❌ Blocks slots even if customer abandons
- ❌ Complex edge cases (expired holds, stuck holds)
- ❌ 30-40 hours development time

**Simple Database Constraint Approach (Chosen):**
- ✅ Database guarantees no double-booking (100% safe)
- ✅ No cron jobs needed
- ✅ No artificial slot blocking
- ✅ Slots available until actually booked
- ✅ Automatic refunds if race condition occurs
- ✅ 8-12 hours development time
- ✅ Fewer bugs (simpler = more reliable)

### Expected Frequency

**Race conditions are RARE in practice:**
- Requires two customers to select same slot within ~2-5 minute window
- For 1,000 bookings/month with 50 available slots each = ~0.1-0.5% chance
- That's 1-5 occurrences per month
- All handled automatically with refunds

**Business Impact:**
- Customer inconvenience: Low (immediate refund + helpful message)
- Business Owner burden: None (handled automatically)
- Technical risk: None (database constraint prevents double-booking)

### Testing Requirements

**Critical test cases:**
- ✅ Concurrent booking attempts (use load testing tool)
- ✅ Payment completes but slot taken (manual simulation)
- ✅ Database constraint violation triggers refund
- ✅ Friendly error message displays
- ✅ No double-bookings under any scenario

**Estimated Implementation:** 8-12 hours (vs. 30-40 hours for temp holds)

### 3.12 Abandoned Checkout Recovery (Simplified)

**Problem Statement:**
Customer completes Stripe payment but closes browser before confirmation page loads. Webhook successfully receives `checkout.session.completed`, but booking creation fails because PHP session expired.

**Result:** Orphaned payment (customer charged, no booking created).

**Solution: Simple Email Recovery**

#### Implementation Approach

**1. Store Booking Data in Stripe Metadata**

Store essential booking data in Stripe Checkout Session metadata (survives session expiration):
```php
$session = \Stripe\Checkout\Session::create([
    'mode' => 'payment',
    'line_items' => [...],
    'metadata' => [
        'service_id' => $booking_data['service_id'],
        'service_name' => $booking_data['service_name'],
        'staff_id' => $booking_data['staff_id'],
        'booking_date' => $booking_data['date'],
        'booking_start_time' => $booking_data['start_time'],
        'customer_name' => $customer_data['first_name'] . ' ' . $customer_data['last_name'],
        'customer_email' => $customer_data['email'],
        'customer_phone' => $customer_data['phone'],
    ],
    'success_url' => '...',
    'cancel_url' => '...'
]);
```

**2. Webhook Handler Attempts Immediate Creation**
```php
function handle_stripe_webhook($event) {
    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        
        // Attempt immediate booking creation
        $booking_id = create_booking_from_metadata($session->metadata);
        
        if ($booking_id) {
            // Success - send confirmation
            send_confirmation_email($booking_id);
            return ['success' => true];
        }
        
        // If immediate creation fails, log for manual review
        log_failed_booking_creation($session);
        
        // Send "action required" email to Business Owner
        send_admin_alert([
            'type' => 'payment_without_booking',
            'payment_intent' => $session->payment_intent,
            'amount' => $session->amount_total / 100,
            'customer_email' => $session->customer_details->email,
            'booking_data' => $session->metadata
        ]);
        
        return ['success' => true, 'requires_manual_review' => true];
    }
}
```

**3. Business Owner Dashboard Alert**

Show simple widget:
```
⚠️ Action Required

1 payment needs booking creation

Payment: £25.00 from sarah@example.com
Time: 15 May 2026, 2:00 PM with Emma Thompson

[Create Booking] [Refund Payment]
```

**4. Manual Actions Available**

Business Owner can:
- **Create booking manually** (if slot still available)
- **Contact customer** (pre-filled email template)
- **Issue refund** (if slot taken or customer doesn't want alternative)

**5. Database Logging Only**

No complex recovery queue. Simple log table:
```sql
CREATE TABLE wp_bookings_failed_creations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_session_id VARCHAR(255) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    booking_metadata TEXT NOT NULL, -- JSON
    resolved BOOLEAN DEFAULT 0,
    resolution_notes TEXT NULL,
    created_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,
    
    INDEX idx_resolved (resolved),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Edge Cases:**

| Scenario | Handling |
|----------|----------|
| Immediate webhook creation succeeds | Normal flow, booking created |
| Immediate webhook creation fails | Log + alert Business Owner |
| Business Owner manually creates booking | Mark as resolved in log |
| Business Owner issues refund | Mark as resolved, note in system |
| Customer contacts support | Business Owner can view log to troubleshoot |

**Why This is Better:**
- ✅ No complex cron jobs
- ✅ No automatic retry logic
- ✅ Business Owner has full control
- ✅ Simpler = fewer bugs
- ✅ Edge case (happens rarely) handled manually
- ✅ Saves 15-20 hours development time

**Estimated Implementation:** 4-6 hours (vs. 12-16 hours for complex version)
---

## 4. PAYPAL PAYMENT INTEGRATION

### 4.1 Integration Purpose & Use Cases

**Why Needed:**
- Alternative payment method for customers without credit cards
- Popular in UK (30-40% of online shoppers prefer PayPal)
- Familiar checkout experience reduces abandonment
- Buyer protection increases trust

**User Stories:**
- **Customer:** "I want to pay with PayPal instead of entering my card details"
- **Customer:** "I trust PayPal's buyer protection for online payments"
- **Business Owner:** "I want to offer multiple payment options to increase conversions"

**Business Value:**
- Increases booking conversion rate (more payment options)
- Reduces cart abandonment
- PayPal brand trust increases customer confidence

### 4.2 Data Flow

**Booking Flow with PayPal:**

```
Customer selects date/time/service
    ↓
Click "Pay with PayPal"
    ↓
Plugin creates PayPal Order (server-side)
    ↓
Redirect customer to PayPal (www.paypal.com or sandbox.paypal.com)
    ↓
Customer logs into PayPal and approves payment
    ↓
Redirect back to our site (return_url)
    ↓
Capture payment (server-side API call)
    ↓
PayPal sends webhook (PAYMENT.CAPTURE.COMPLETED)
    ↓
Create booking in database (atomic operation)
    ↓
Send confirmation email
    ↓
Sync to Google Calendar
```

**Data Sent to PayPal (Create Order):**
```json
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "reference_id": "temp_booking_123",
    "description": "Women's Haircut with Emma Thompson on 15 May 2026",
    "amount": {
      "currency_code": "GBP",
      "value": "25.00"
    },
    "custom_id": "temp_booking_123"
  }],
  "application_context": {
    "return_url": "https://clientsite.com/booking-confirmed?paypal_order_id={order_id}",
    "cancel_url": "https://clientsite.com/book?step=4&paypal_cancelled=1",
    "brand_name": "Shine & Style Hair Studio",
    "user_action": "PAY_NOW"
  }
}
```

**Data Received from PayPal (Webhook):**
```json
{
  "id": "WH-abc123",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "cap_abc123",
    "status": "COMPLETED",
    "amount": {
      "currency_code": "GBP",
      "value": "25.00"
    },
    "custom_id": "temp_booking_123"
  }
}
```

### 4.3 Authentication & Authorization

**API Credentials:**
- **Client ID** (`AabcDEF123...`): Public identifier
- **Secret** (`EFG456hij...`): Private, never exposed

**Environment:**
- **Sandbox (Test):** `https://api-m.sandbox.paypal.com`
- **Live:** `https://api-m.paypal.com`

**Credential Storage:**
```php
'booking_paypal_client_id' => encrypt('AabcDEF123...')
'booking_paypal_secret' => encrypt('EFG456hij...')
'booking_paypal_test_mode' => true // Sandbox vs Live
```

**Configuration UI: WordPress Admin → Settings → Payments → PayPal**
```
Test Mode: [Toggle: Sandbox | Live]

[If Sandbox]
Sandbox Client ID: [AabcDEF123............................]
Sandbox Secret: [EFG456hij.............................]
Help: Get sandbox credentials from developer.paypal.com/developer/applications

[If Live]
⚠️ LIVE MODE - Real charges will be processed

Live Client ID: [AabcDEF123............................]
Live Secret: [EFG456hij.............................]
Help: Get live credentials from developer.paypal.com/developer/applications

Webhook ID: [auto-generated on first save]
[Test Connection] button
Status: ✓ Connected to PayPal | ❌ Invalid credentials
```

**Authentication Method: OAuth 2.0**
```php
function get_paypal_access_token() {
    $client_id = get_option('booking_paypal_client_id');
    $secret = get_option('booking_paypal_secret');
    $base_url = get_option('booking_paypal_test_mode') 
        ? 'https://api-m.sandbox.paypal.com' 
        : 'https://api-m.paypal.com';
    
    $ch = curl_init("{$base_url}/v1/oauth2/token");
    curl_setopt($ch, CURLOPT_USERPWD, "{$client_id}:{$secret}");
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    
    $response = curl_exec($ch);
    $data = json_decode($response);
    
    return $data->access_token; // Valid for 9 hours
}
```

**Token Caching:**
- Access token valid for 9 hours
- Cache in transient: `set_transient('paypal_access_token', $token, 8 * HOUR_IN_SECONDS)`
- Refresh when expired

### 4.4 API Endpoints & Methods

**PayPal REST API Version:** v2 (Orders API)

**Base URLs:**
- Sandbox: `https://api-m.sandbox.paypal.com`
- Live: `https://api-m.paypal.com`

**Required Endpoints:**

#### 1. Create Order
**Endpoint:** `POST /v2/checkout/orders`  
**Purpose:** Create payment order  
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```
**Request:**
```json
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "reference_id": "temp_booking_123",
    "amount": {
      "currency_code": "GBP",
      "value": "25.00"
    },
    "description": "Women's Haircut - Deposit"
  }],
  "application_context": {
    "return_url": "https://site.com/paypal-return?order_id={order_id}",
    "cancel_url": "https://site.com/book?cancelled=1"
  }
}
```
**Response (201 Created):**
```json
{
  "id": "5O190127TN364715T",
  "status": "CREATED",
  "links": [{
    "href": "https://www.paypal.com/checkoutnow?token=5O190127TN364715T",
    "rel": "approve",
    "method": "GET"
  }]
}
```

**Usage:**
```php
$access_token = get_paypal_access_token();

$order_data = [
    'intent' => 'CAPTURE',
    'purchase_units' => [[
        'reference_id' => $temp_booking_id,
        'amount' => [
            'currency_code' => 'GBP',
            'value' => number_format($deposit_amount, 2, '.', '')
        ]
    ]],
    'application_context' => [
        'return_url' => home_url("/paypal-return?booking_id={$temp_booking_id}"),
        'cancel_url' => home_url('/book?step=4&cancelled=1')
    ]
];

$ch = curl_init('https://api-m.paypal.com/v2/checkout/orders');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($order_data));

$response = json_decode(curl_exec($ch));
$approve_link = $response->links[1]->href; // Find link with rel='approve'

wp_redirect($approve_link);
exit;
```

#### 2. Capture Order
**Endpoint:** `POST /v2/checkout/orders/{order_id}/capture`  
**Purpose:** Capture payment after customer approval  
**Request:** (No body required)  
**Response (201 Created):**
```json
{
  "id": "5O190127TN364715T",
  "status": "COMPLETED",
  "purchase_units": [{
    "payments": {
      "captures": [{
        "id": "cap_abc123",
        "status": "COMPLETED",
        "amount": {
          "currency_code": "GBP",
          "value": "25.00"
        }
      }]
    }
  }]
}
```

**Usage (on return_url):**
```php
function handle_paypal_return() {
    $order_id = $_GET['token'] ?? ''; // PayPal returns 'token' param
    
    $access_token = get_paypal_access_token();
    
    $ch = curl_init("https://api-m.paypal.com/v2/checkout/orders/{$order_id}/capture");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $access_token,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, 1);
    
    $response = json_decode(curl_exec($ch));
    
    if ($response->status === 'COMPLETED') {
        $capture_id = $response->purchase_units[0]->payments->captures[0]->id;
        create_booking_from_paypal($capture_id);
    }
}
```

#### 3. Refund Capture
**Endpoint:** `POST /v2/payments/captures/{capture_id}/refund`  
**Purpose:** Refund a payment  
**Request:**
```json
{
  "amount": {
    "currency_code": "GBP",
    "value": "25.00"
  },
  "note_to_payer": "Booking cancelled within policy window"
}
```
**Response (201 Created):**
```json
{
  "id": "ref_abc123",
  "status": "COMPLETED",
  "amount": {
    "currency_code": "GBP",
    "value": "25.00"
  }
}
```

**Rate Limits:**
- **Production:** 5,000 requests/hour
- **Sandbox:** 500 requests/hour
- **Handling:** Exponential backoff if 429 response

### 4.5 Error Handling

**PayPal Error Codes:**

| Error | Cause | Handling | User Message |
|-------|-------|----------|--------------|
| `INVALID_REQUEST` | Malformed API call | Log error, alert admin | "Payment error. Please try again." |
| `AUTHENTICATION_FAILURE` | Invalid credentials | Alert admin, block checkout | "Payment system error. Contact us." |
| `INSUFFICIENT_FUNDS` | Not enough in PayPal | Prompt retry | "Insufficient PayPal balance. Add funds or use card." |
| `PAYER_ACTION_REQUIRED` | Customer must verify | Redirect back to PayPal | "Please complete verification on PayPal" |
| `ORDER_NOT_APPROVED` | Customer cancelled | Don't create booking | "Payment cancelled. No booking created." |
| `RESOURCE_NOT_FOUND` | Order expired (3 hours) | Prompt new payment | "Payment session expired. Please start again." |

**Retry Logic:**
- Authentication failure: No retry (admin must fix)
- Network timeout: Retry 2x with 5s delay
- Rate limit (429): Exponential backoff
- PayPal 5xx error: Retry 3x

**Fallback:**
- If PayPal down → Hide PayPal button, show Stripe only
- Daily health check to re-enable

### 4.6 Testing Requirements

**Sandbox Test Accounts:**
- Create test buyer/seller accounts at developer.paypal.com/dashboard/accounts
- Use sandbox credentials (Client ID/Secret start with `Ab...` for sandbox)

**Test Scenarios:**

| Scenario | Action | Expected Outcome |
|----------|--------|------------------|
| Successful payment | Complete PayPal checkout | Booking created, email sent |
| Payment cancelled | Click "Cancel and return" | No booking created |
| Order expired | Wait 3 hours before capturing | Error: "Order expired" |
| Insufficient funds | (use test account with £0) | Error message shown |
| Refund request | Refund via dashboard | PayPal refund processed |
| Webhook failure | Disable webhook | Fallback: Capture on return_url |

**Test Accounts (Sandbox):**
- Buyer: buyer@personal.example.com / password123
- Seller: (your sandbox business account)

### 4.7 Webhook Handling

**Webhook Endpoint:**
```
https://clientsite.com/wp-json/booking/v1/paypal-webhook
```

**Event Types:**

| Event | Action |
|-------|--------|
| `PAYMENT.CAPTURE.COMPLETED` | Create booking |
| `PAYMENT.CAPTURE.REFUNDED` | Update booking status |
| `PAYMENT.CAPTURE.DENIED` | Log error, alert admin |

**Webhook Verification:**
```php
function verify_paypal_webhook($request) {
    $headers = $request->get_headers();
    $body = $request->get_body();
    
    $transmission_id = $headers['paypal_transmission_id'][0];
    $timestamp = $headers['paypal_transmission_time'][0];
    $webhook_id = get_option('booking_paypal_webhook_id'); // From PayPal dashboard
    $cert_url = $headers['paypal_cert_url'][0];
    $signature = $headers['paypal_transmission_sig'][0];
    
    // Verify signature against PayPal's public cert
    $access_token = get_paypal_access_token();
    $verify_data = [
        'transmission_id' => $transmission_id,
        'transmission_time' => $timestamp,
        'cert_url' => $cert_url,
        'auth_algo' => $headers['paypal_auth_algo'][0],
        'transmission_sig' => $signature,
        'webhook_id' => $webhook_id,
        'webhook_event' => json_decode($body)
    ];
    
    $ch = curl_init('https://api-m.paypal.com/v1/notifications/verify-webhook-signature');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $access_token,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($verify_data));
    
    $response = json_decode(curl_exec($ch));
    
    return $response->verification_status === 'SUCCESS';
}
```

### 4.8 Configuration UI

*Covered in §4.3 Authentication & Authorization*

### 4.9 Edge Cases & Limitations

| Edge Case | Impact | Handling |
|-----------|--------|----------|
| Customer has no PayPal account | Can't pay with PayPal | Show guest checkout (card via PayPal) |
| PayPal limits UK customer | Payment blocked | Fallback to Stripe |
| Order expires (3 hours) | Payment fails | Customer must re-book |
| Refund takes 5-10 days | Customer upset | Set expectation in cancellation email |
| PayPal account frozen | Payments blocked | Disable PayPal, use Stripe only |

**Limitations:**
- PayPal fees: 2.9% + £0.30 (higher than Stripe)
- Refund processing: 5-10 business days
- Order expires after 3 hours (must complete checkout)
- No partial refunds to PayPal balance (only original payment method)

### 4.10 Security Considerations

**Data Protection:**
- Client ID/Secret encrypted at rest
- Webhook signature verification required
- HTTPS for all API calls

**PCI Compliance:**
- If customer pays with card via PayPal → PayPal handles PCI
- No card data touches our servers

**Fraud Prevention:**
- PayPal Seller Protection covers eligible transactions
- Monitor chargeback rate

---

## 5. GOOGLE CALENDAR INTEGRATION

### 5.1 Integration Purpose & Use Cases

**Why Needed:**
- Sync bookings to staff personal Google Calendars
- Prevent double-booking across systems
- Reduce no-shows (staff can see appointments in calendar app)
- Professional appearance (customer details visible to staff)

**User Stories:**
- **Staff:** "I want my bookings to appear in my Google Calendar so I don't miss appointments"
- **Staff:** "I want calendar alerts on my phone 15 minutes before each appointment"
- **Business Owner:** "I want staff calendars synced so they can't claim they didn't know"

**Business Value:**
- Reduces staff confusion about schedule
- Decreases no-shows (calendar reminders)
- Professional integration with existing workflows

### 5.2 Data Flow

**1-Way Sync: Plugin → Google Calendar (Phase 1)**

```
Booking Created
    ↓
Check if staff member has Google Calendar connected
    ↓
If YES → Create event via Google Calendar API
    ↓
Store event_id in booking record
    ↓
If booking cancelled → Delete event from Google Calendar
    ↓
If booking rescheduled → Update event in Google Calendar
```

**Data Sent to Google Calendar:**
```json
{
  "summary": "Booking: Women's Haircut - Sarah Johnson",
  "description": "Service: Women's Haircut\nCustomer: Sarah Johnson\nPhone: 07700 900123\nEmail: sarah@example.com\nDeposit: £25.00 paid",
  "start": {
    "dateTime": "2026-05-15T14:00:00+01:00",
    "timeZone": "Europe/London"
  },
  "end": {
    "dateTime": "2026-05-15T14:45:00+01:00",
    "timeZone": "Europe/London"
  },
  "attendees": [{
    "email": "sarah@example.com",
    "displayName": "Sarah Johnson"
  }],
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "popup", "minutes": 15}
    ]
  },
  "colorId": "7" // Blue for bookings
}
```

**Data Received from Google (on event creation):**
```json
{
  "id": "abc123xyz",
  "status": "confirmed",
  "htmlLink": "https://www.google.com/calendar/event?eid=abc123"
}
```

### 5.3 Authentication & Authorization

**Auth Method:** OAuth 2.0

**OAuth Flow:**
1. Staff clicks "Connect Google Calendar" in dashboard
2. Redirect to Google OAuth consent screen
3. Staff authorizes access to Google Calendar
4. Google redirects back with authorization code
5. Exchange code for access token + refresh token
6. Store tokens encrypted in database

**Scopes Required:**
```
https://www.googleapis.com/auth/calendar.events
```
(Read/write access to calendar events only, not full calendar access)

**Credential Storage:**
```sql
-- Table: wp_bookings_staff
staff_id | google_calendar_connected | google_access_token (encrypted) | google_refresh_token (encrypted) | google_token_expires_at
3        | 1                        | ya29.abc123...              | 1//xyz789...                    | 2026-05-15 14:00:00
```

**Configuration UI: Staff Dashboard → Settings → Calendar Sync**
```
Google Calendar:
[ ] Not connected
    [Connect Google Calendar] button
    
    OR (if connected)
    
[✓] Connected to: emma.thompson@gmail.com
    Last synced: 5 minutes ago
    [Disconnect] button
    
    Calendar: [Dropdown: Primary | Work | Personal]
    
    Sync Options:
    [✓] Create events for new bookings
    [✓] Update events when bookings rescheduled
    [✓] Delete events when bookings cancelled
    [ ] Sync cancellations as "Cancelled" instead of deleting (Phase 2)
```

**OAuth Configuration (WordPress Admin):**
```php
// wp-config.php
define('GOOGLE_OAUTH_CLIENT_ID', '123456789-abc.apps.googleusercontent.com');
define('GOOGLE_OAUTH_CLIENT_SECRET', 'secret_xyz789');
define('GOOGLE_OAUTH_REDIRECT_URI', 'https://clientsite.com/dashboard/google-callback');
```

**Token Refresh:**
- Access token expires after 1 hour
- Use refresh token to get new access token automatically
- If refresh fails (token revoked) → Prompt staff to reconnect

```php
function get_google_access_token($staff_id) {
    $staff = get_staff($staff_id);
    
    // Check if token expired
    if (strtotime($staff->google_token_expires_at) < time()) {
        // Refresh token
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'client_id' => GOOGLE_OAUTH_CLIENT_ID,
            'client_secret' => GOOGLE_OAUTH_CLIENT_SECRET,
            'refresh_token' => $staff->google_refresh_token,
            'grant_type' => 'refresh_token'
        ]);
        
        $response = json_decode(curl_exec($ch));
        $new_token = $response->access_token;
        $expires_at = date('Y-m-d H:i:s', time() + 3600);
        
        // Update database
        update_staff_google_token($staff_id, $new_token, $expires_at);
        
        return $new_token;
    }
    
    return $staff->google_access_token;
}
```

### 5.4 API Endpoints & Methods

**Google Calendar API v3**

**Base URL:** `https://www.googleapis.com/calendar/v3`

**Required Endpoints:**

#### 1. Create Event
**Endpoint:** `POST /calendars/primary/events`  
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```
**Request:**
```json
{
  "summary": "Booking: Women's Haircut - Sarah Johnson",
  "start": {
    "dateTime": "2026-05-15T14:00:00+01:00",
    "timeZone": "Europe/London"
  },
  "end": {
    "dateTime": "2026-05-15T14:45:00+01:00",
    "timeZone": "Europe/London"
  }
}
```
**Response (200 OK):**
```json
{
  "id": "abc123xyz",
  "status": "confirmed"
}
```

**Usage:**
```php
function sync_booking_to_google_calendar($booking_id) {
    $booking = get_booking($booking_id);
    $staff = get_staff($booking->staff_id);
    
    if (!$staff->google_calendar_connected) {
        return; // Skip sync if not connected
    }
    
    $access_token = get_google_access_token($staff->staff_id);
    
    $event_data = [
        'summary' => "Booking: {$booking->service_name} - {$booking->customer_name}",
        'description' => "Customer: {$booking->customer_name}\nPhone: {$booking->customer_phone}\nEmail: {$booking->customer_email}",
        'start' => [
            'dateTime' => date('c', strtotime($booking->booking_date . ' ' . $booking->booking_start_time)),
            'timeZone' => 'Europe/London'
        ],
        'end' => [
            'dateTime' => date('c', strtotime($booking->booking_date . ' ' . $booking->booking_end_time)),
            'timeZone' => 'Europe/London'
        ],
        'colorId' => '7' // Blue
    ];
    
    $ch = curl_init('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $access_token,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($event_data));
    
    $response = json_decode(curl_exec($ch));
    
    if (isset($response->id)) {
        // Store event ID for future updates/deletes
        update_booking_google_event_id($booking_id, $response->id);
    }
}
```

#### 2. Update Event
**Endpoint:** `PUT /calendars/primary/events/{eventId}`  
**Purpose:** Update event when booking rescheduled  
**Request:** Same as Create Event  

#### 3. Delete Event
**Endpoint:** `DELETE /calendars/primary/events/{eventId}`  
**Purpose:** Remove event when booking cancelled  
**Request:** (No body)  
**Response:** 204 No Content

**Rate Limits:**
- **Free:** 1,000 requests/day per user (enough for Phase 1)
- **Quota exceeded:** 403 error
- **Handling:** Queue sync for retry, alert staff

### 5.5 Error Handling

**Google Calendar Errors:**

| Error | Cause | Handling | User Message |
|-------|-------|----------|--------------|
| `401 Unauthorized` | Token expired/revoked | Attempt refresh, prompt reconnect | "Calendar sync disconnected. Reconnect?" |
| `403 Quota Exceeded` | Rate limit hit | Queue for retry (1 hour later) | "Calendar sync delayed" |
| `404 Not Found` | Event already deleted | Remove event_id from booking | (Silent, no user message) |
| `500 Server Error` | Google API down | Retry 3x, queue if fails | "Calendar sync failed, will retry" |

**Retry Logic:**
- 401 error → Refresh token once, then prompt reconnect
- 403 quota → Retry after 1 hour
- 5xx error → Retry 3x with 5-minute delay

**Fallback Behavior:**
- If sync fails → Booking still created, staff sees it in plugin dashboard
- Calendar sync non-blocking (doesn't prevent booking creation)

**Logging:**
```php
// DO LOG
error_log("Google Calendar sync failed: booking_id={$booking_id}, staff_id={$staff_id}, error={$e->getMessage()}");

// DO NOT LOG
// - OAuth tokens or refresh tokens
// - Customer personal info in sync errors
```

### 5.6 Testing Requirements

**OAuth Test Flow:**
1. Create Google Cloud Project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (Client ID + Secret)
4. Add test users (staff email addresses)
5. Test OAuth flow in plugin

**Test Scenarios:**

| Scenario | Expected Outcome |
|----------|------------------|
| Staff connects calendar | OAuth completes, event created for test booking |
| Booking rescheduled | Event updated in Google Calendar |
| Booking cancelled | Event deleted from Google Calendar |
| Token expired | Auto-refresh, sync continues |
| Token revoked (staff disconnects) | Sync disabled, prompt to reconnect |
| Rate limit hit | Sync queued for retry |
| Google API down | Graceful failure, booking still created |

**Success Criteria:**
- ✓ OAuth flow completes in <30 seconds
- ✓ Event created within 10 seconds of booking
- ✓ Token refresh works automatically
- ✓ Sync failures don't block bookings

### 5.7 Webhook Handling

**Not Applicable for Phase 1** (1-way sync only)

**Phase 2:** 2-way sync will require webhook subscriptions to detect:
- Staff manually deletes event → Mark booking as cancelled?
- Staff manually reschedules → Update booking?
- Requires Google Calendar Push Notifications API

### 5.8 Configuration UI

*Covered in §5.3 Authentication & Authorization*

### 5.9 Edge Cases & Limitations

| Edge Case | Impact | Handling |
|-----------|--------|----------|
| Staff disconnects mid-booking-flow | Booking created but not synced | Alert staff: "Calendar not synced" |
| Staff uses multiple calendars | Event goes to "Primary" only | Phase 2: Let staff choose calendar |
| OAuth token revoked by Google | Sync stops working | Alert staff, prompt reconnect |
| Rate limit exceeded (1k/day) | Sync delayed | Queue for next day |
| Staff deletes event manually | Booking still active (1-way sync) | Phase 2: Detect and mark cancelled |
| Booking created while Google API down | Not synced | Retry hourly until success |
| Staff timezone differs from business | Event times incorrect | Always use Europe/London timezone |

**Phase 1 Limitations:**
- ✗ No 2-way sync (staff edits in Google don't update plugin)
- ✗ Can't detect if staff manually deleted event
- ✗ Can't prevent double-booking if staff has other commitments in Google Calendar
- ✗ Only syncs to "Primary" calendar (can't choose Work/Personal)

### 5.10 Security Considerations

**Data Protection:**
- OAuth tokens encrypted at rest (AES-256-GCM)
- Refresh tokens never logged or exposed
- Tokens stored per-staff (not shared)

**OAuth Security:**
- Use PKCE (Proof Key for Code Exchange) for OAuth flow
- Validate `state` parameter to prevent CSRF
- HTTPS required for redirect_uri

**Privacy:**
- Staff can disconnect anytime (deletes tokens)
- Customer details visible in calendar description (inform staff)
- GDPR: Customer can request event deletion

**Minimal Permissions:**
- Only request `calendar.events` scope (not full calendar access)
- Can't read staff's other calendar events

---

## 6. INTEGRATION DEPENDENCIES

### 6.1 Critical Path Dependencies

**Booking Flow Dependencies:**

```
1. Customer selects slot
   ↓
2. Customer enters details
   ↓
3. Payment gateway (REQUIRED)
   ├── Stripe (primary) OR PayPal (alternative)
   └── If both fail → Allow "Pay on Arrival" (if enabled)
   ↓
4. Booking created in database (ATOMIC operation)
   ↓
5. Email confirmation (CRITICAL - don't fail booking if email fails)
   ├── Queue via Action Scheduler
   └── Retry 3x if fails
   ↓
6. Google Calendar sync (OPTIONAL - non-blocking)
   └── Queue for async processing
```

**Key Rules:**
- Payment MUST succeed before booking created
- Email failure NEVER prevents booking creation (email queued for retry)
- Calendar sync failure NEVER prevents booking creation

### 6.2 Service Dependencies

**Critical Services (Booking Cannot Complete Without):**
- Database (MySQL)
- Payment gateway (Stripe OR PayPal)

**Important Services (Degrades UX but Bookings Still Work):**
- Email service (confirmations delayed)

**Optional Services (Nice-to-Have):**
- Google Calendar (staff sees bookings in plugin dashboard anyway)

### 6.3 Monitoring Integration Health

**Health Check Cron (Daily 8:00 AM):**
```php
function check_integration_health() {
    $health = [];
    
    // Check Stripe
    try {
        \Stripe\Account::retrieve();
        $health['stripe'] = 'OK';
    } catch (Exception $e) {
        $health['stripe'] = 'FAIL: ' . $e->getMessage();
    }
    
    // Check PayPal
    try {
        $token = get_paypal_access_token();
        $health['paypal'] = $token ? 'OK' : 'FAIL';
    } catch (Exception $e) {
        $health['paypal'] = 'FAIL: ' . $e->getMessage();
    }
    
    // Check Email (SendGrid)
    try {
        send_test_email('admin@clientbusiness.co.uk');
        $health['email'] = 'OK';
    } catch (Exception $e) {
        $health['email'] = 'FAIL: ' . $e->getMessage();
    }
    
    // Alert if any critical service down
    if ($health['stripe'] !== 'OK' || $health['paypal'] !== 'OK') {
        send_admin_alert('URGENT: Payment gateway down!', $health);
    }
    
    return $health;
}
```

---

## 7. MONITORING & ALERTING

### 7.1 Integration Metrics to Track

**Key Metrics:**

| Metric | Target | Alert If |
|--------|--------|----------|
| Payment success rate | >95% | <90% |
| Email delivery rate | >98% | <95% |
| Email bounce rate | <2% | >5% |
| Calendar sync success rate | >90% | <80% |
| Payment webhook processing time | <1s | >3s |
| Email queue processing time | <5 min | >15 min |

**Dashboard (WordPress Admin → Bookings → System Status):**
```
Integration Health:

Stripe: ✓ Connected (Test Mode)
  Last test: 2 hours ago
  Success rate (7 days): 98.5%
  
PayPal: ✓ Connected (Live Mode)
  Last test: 2 hours ago
  Success rate (7 days): 97.2%
  
Email (SendGrid): ✓ Connected
  Delivery rate (7 days): 99.1%
  Bounce rate: 1.2%
  Queue size: 3 pending
  
Google Calendar: ⚠️ 2 staff connected, 1 disconnected
  Sync success rate: 95.3%
  
[Run Health Check Now] button
```

### 7.2 Alert Triggers

**Critical Alerts (SMS + Email to Admin):**
- Payment gateway down >5 minutes
- Payment success rate <80% (last hour)
- Database connection lost

**High Priority Alerts (Email to Admin):**
- Email delivery rate <95% (last 24 hours)
- Payment webhook failures >10 in 1 hour
- Calendar sync failures >50% (last 6 hours)

**Medium Priority Alerts (Dashboard notification):**
- Staff calendar disconnected
- Email bounce rate >5%
- Payment gateway test mode still enabled in production

### 7.3 Error Tracking Integration

**Recommended:** Sentry.io or Rollbar

**Events to Track:**
- Payment failures (with error codes, not card numbers)
- Email send failures (with bounce reasons)
- API authentication errors
- Webhook signature verification failures
- Database transaction rollbacks (double-booking attempts)

---

## 8. PHASE 2 INTEGRATIONS (FUTURE)

**Not Part of Phase 1 MVP** - Document for future planning

### 8.1 SMS Notifications (Twilio)
- **Purpose:** Booking reminders via SMS (higher open rate than email)
- **Priority:** HIGH (Phase 2.1)
- **Complexity:** MEDIUM

### 8.2 2-Way Google Calendar Sync
- **Purpose:** Detect staff edits in Google Calendar and update plugin
- **Priority:** MEDIUM (Phase 2.2)
- **Complexity:** HIGH (requires webhook subscriptions)

### 8.3 Outlook/iCal Calendar Support
- **Purpose:** Sync to Microsoft 365, Apple Calendar
- **Priority:** MEDIUM (Phase 2.2)
- **Complexity:** HIGH (separate OAuth flows)

### 8.4 Mailchimp Marketing Automation
- **Purpose:** Sync customer email list for marketing campaigns
- **Priority:** LOW (Phase 2.3)
- **Complexity:** MEDIUM

### 8.5 Zapier/Make Integration
- **Purpose:** Allow no-code integrations with 1000+ apps
- **Priority:** MEDIUM (Phase 2.3)
- **Complexity:** MEDIUM (requires REST API)

### 8.6 WhatsApp Business Notifications
- **Purpose:** Booking confirmations via WhatsApp (popular in UK)
- **Priority:** LOW (Phase 2.4)
- **Complexity:** HIGH (requires Facebook Business verification)

---

## DOCUMENT STATUS & NEXT STEPS

**Phase 2.5 Integration Requirements - STATUS: DRAFT COMPLETE**

### Coverage:
✅ Email Services (SendGrid/Mailgun/AWS SES/SMTP)  
✅ Stripe Payment Gateway (Checkout, Webhooks, Refunds)  
✅ PayPal Payment Gateway (Orders API, Capture, Webhooks)  
✅ Google Calendar Sync (1-way, OAuth 2.0)  
✅ Integration dependencies and monitoring  
✅ Phase 2 future integrations documented  

### Key Decisions Made:
1. ✅ **Email:** REQUIRE transactional email service for production (not wp_mail)
2. ✅ **Payments:** Dual gateway support (Stripe primary, PayPal alternative)
3. ✅ **Calendar:** 1-way sync only in Phase 1 (2-way in Phase 2)
4. ✅ **Error Handling:** Non-blocking for email/calendar (booking always succeeds)

### Missing from Phase 1:
- ❌ SMS notifications (Phase 2)
- ❌ 2-way calendar sync (Phase 2)
- ❌ REST API for integrations (Phase 2)
- ❌ CRM integrations (Phase 2)

### Next Steps:
1. **Review & Approval:** Review all integration specs for accuracy
2. **Security Audit:** Verify encryption, PCI compliance, OAuth security
3. **Cost Analysis:** Calculate monthly costs (SendGrid + Stripe + PayPal fees)
4. **Phase 3:** Begin API integration development & testing

---

**Estimated Development Time:**
- Email integration: 1 week
- Stripe integration: 2-3 weeks (includes webhook testing)
- PayPal integration: 2 weeks
- Google Calendar integration: 2-3 weeks (OAuth + sync logic)
- **Total Integration Development:** 7-9 weeks

---

**Document Version:** 1.0 DRAFT  
**Total Pages:** ~55 pages  
**Total Word Count:** ~18,000 words  
**Last Updated:** January 21, 2026
