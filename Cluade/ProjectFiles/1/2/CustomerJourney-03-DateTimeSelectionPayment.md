

 
**Race condition:** Let me analyze and propose better options...

---

## Race Condition Prevention - Analysis & Better Options

### **Approved Approach: Database Constraints (Simplified)**

**Decision:** Use database UNIQUE constraint + optimistic locking (no temp holds)

**How it works:**
- Database UNIQUE constraint prevents double-bookings at database level
- No slot reservation during checkout (keeps slots available)
- If race condition occurs: automatic refund + friendly error message
- Simpler implementation, fewer bugs, better UX

**Pros:**
- ✅ Database guarantees no double-booking (100% safe)
- ✅ No cron jobs or cleanup needed
- ✅ Slots available until actually booked (better UX)
- ✅ Simpler code = more reliable
- ✅ Race conditions rare (~1-5/month for typical SMB)

**Implementation:**
- UNIQUE constraint on (staff_id, booking_date, start_time)
- Double-check availability before payment redirect
- If slot taken during payment → immediate automatic refund
- Friendly error message + return to time selection

**Full specification:** See IntegrationRequirements_Phase1.md §3.11

---


---

## STEP 4: Contact Details & Payment Form

### **4.1: Transition from Step 3 to Step 4**

**User Action:** Customer selects time (e.g., 2:00 PM) and clicks "Continue"

**Session Data Check:**
```php
// Validate all required data present before showing Step 4
if (!isset($_SESSION['booking_data']['booking_time'])) {
    // Missing data - redirect to Step 1
    redirect_to_step(1);
}
```

**What Happens:**

**Mobile:**
- Calendar/time slots fade out
- Contact form fades in
- URL updates: `/book?service=3&staff=1&date=2026-05-15&time=14:00`

**Desktop:**
- Calendar replaced by contact form (center area)
- Summary panel updates with full booking preview:
  ```
  Your Booking
  ✓ Women's Haircut (45 min)
  ✓ Emma Thompson (£45)
  ✓ Thurs 15 May at 2:00 PM
  
  Total: £45.00
  Deposit due now: £20.00
  Balance due on arrival: £25.00
  ```

---

### **4.2: Contact Details Form - Mobile View**

```
┌─────────────────────────────────────┐
│ [← Back]          Step 4 of 4       │
├─────────────────────────────────────┤
│ Women's Haircut                     │
│ Emma • Thu 15 May • 2:00 PM         │
│                                     │
│ 👤 Your Details                     │
├─────────────────────────────────────┤
│                                     │
│ First Name *                        │
│ ┌─────────────────────────────┐   │
│ │ Sarah                       │   │
│ └─────────────────────────────┘   │
│                                     │
│ Last Name *                         │
│ ┌─────────────────────────────┐   │
│ │ Johnson                     │   │
│ └─────────────────────────────┘   │
│                                     │
│ Email Address *                     │
│ ┌─────────────────────────────┐   │
│ │ sarah.j@email.com           │   │
│ └─────────────────────────────┘   │
│ We'll send your confirmation here  │
│                                     │
│ Phone Number *                      │
│ ┌─────────────────────────────┐   │
│ │ 07700 900123                │   │
│ └─────────────────────────────┘   │
│ For appointment reminders           │
│                                     │
│ Special Requests (Optional)         │
│ ┌─────────────────────────────┐   │
│ │ I'd like a consultation     │   │
│ │ about balayage              │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│ Any allergies, preferences, etc.    │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ ☐ Send me special offers and       │
│   updates (optional)                │
│                                     │
│ By booking, you agree to our        │
│ [Terms] and [Privacy Policy]        │
│                                     │
├─────────────────────────────────────┤
│ 💳 Payment                          │
├─────────────────────────────────────┤
│                                     │
│ Total: £45.00                       │
│ Pay now: £20.00 (deposit)           │
│ Pay on arrival: £25.00              │
│                                     │
│ Choose payment method:              │
│                                     │
│ ○ Credit/Debit Card (Stripe)        │
│ ○ PayPal                            │
│ ○ Pay Full Amount on Arrival        │
│                                     │
│ [Continue to Payment →]             │
│                                     │
└─────────────────────────────────────┘
```

---

### **4.3: Form Fields - Detailed Specification**

#### **Field 1: First Name**

```html
<div class="form-group">
  <label for="first-name">
    First Name <span class="required">*</span>
  </label>
  <input 
    type="text" 
    id="first-name" 
    name="first_name"
    required
    autocomplete="given-name"
    maxlength="100"
    aria-required="true"
    aria-describedby="first-name-error"
  />
  <span id="first-name-error" class="error-message" role="alert"></span>
</div>
```

**Validation Rules:**
- **Required:** Yes
- **Min length:** 2 characters
- **Max length:** 100 characters
- **Allowed:** Letters, spaces, hyphens, apostrophes (e.g., "Mary-Jane", "O'Brien")
- **Regex:** `/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/` (supports accented characters)

**Error Messages:**
- Empty: "Please enter your first name"
- Too short: "First name must be at least 2 characters"
- Invalid characters: "Please use only letters, spaces, hyphens, and apostrophes"

---

#### **Field 2: Last Name**

Same validation as First Name.

---

#### **Field 3: Email Address**

```html
<div class="form-group">
  <label for="email">
    Email Address <span class="required">*</span>
  </label>
  <input 
    type="email" 
    id="email" 
    name="email"
    required
    autocomplete="email"
    maxlength="255"
    aria-required="true"
    aria-describedby="email-help email-error"
  />
  <p id="email-help" class="field-help">
    We'll send your confirmation here
  </p>
  <span id="email-error" class="error-message" role="alert"></span>
</div>
```

**Validation Rules:**
- **Required:** Yes
- **Format:** Valid email (RFC 5322 standard)
- **Max length:** 255 characters
- **Regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (basic check)
- **Backend:** Use PHP `filter_var($email, FILTER_VALIDATE_EMAIL)`

**Additional Backend Check:**
```php
// Check if email already exists in customer database
$existing_customer = get_customer_by_email($email);

if ($existing_customer) {
    // Customer exists - link to existing record
    $_SESSION['booking_data']['customer_id'] = $existing_customer->id;
    $_SESSION['booking_data']['returning_customer'] = true;
} else {
    // New customer - will create new record
    $_SESSION['booking_data']['returning_customer'] = false;
}
```

**Error Messages:**
- Empty: "Please enter your email address"
- Invalid format: "Please enter a valid email address (e.g., name@example.com)"
- Server error: "Unable to validate email. Please try again."

---

#### **Field 4: Phone Number**

```html
<div class="form-group">
  <label for="phone">
    Phone Number <span class="required">*</span>
  </label>
  <input 
    type="tel" 
    id="phone" 
    name="phone"
    required
    autocomplete="tel"
    placeholder="07700 900123"
    maxlength="20"
    aria-required="true"
    aria-describedby="phone-help phone-error"
  />
  <p id="phone-help" class="field-help">
    For appointment reminders
  </p>
  <span id="phone-error" class="error-message" role="alert"></span>
</div>
```

**Validation Rules:**
- **Required:** Yes
- **Formats accepted:** 
  - UK mobile: `07700 900123`, `07700900123`, `+44 7700 900123`
  - UK landline: `020 1234 5678`, `02012345678`, `+44 20 1234 5678`
- **Regex (UK):** `/^(\+44\s?|0)(\d\s?){9,10}$/`
- **Auto-formatting:** As user types, format to `07700 900123` style

**JavaScript Auto-Formatting:**
```javascript
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // UK mobile (07XXX XXXXXX)
    if (value.startsWith('07') && value.length === 11) {
        e.target.value = value.replace(/(\d{5})(\d{6})/, '$1 $2');
    }
    // UK landline (020 XXXX XXXX)
    else if (value.startsWith('02') && value.length === 11) {
        e.target.value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }
});
```

**Error Messages:**
- Empty: "Please enter your phone number"
- Invalid format: "Please enter a valid UK phone number (e.g., 07700 900123)"

**Question for You:**

**International phone numbers - should we support them in Phase 1?**

**Option A:** UK only (07XXX, 01XXX, 02XXX, 03XXX) - simpler validation
**Option B:** International (use library like `libphonenumber`) - better for travelers

**My Recommendation: Option A (UK only)** for Phase 1, since target market is UK SMBs.

**Your preference?**

---

#### **Field 5: Special Requests (Optional)**

```html
<div class="form-group">
  <label for="special-requests">
    Special Requests (Optional)
  </label>
  <textarea 
    id="special-requests" 
    name="special_requests"
    rows="3"
    maxlength="500"
    placeholder="Any allergies, preferences, or special requirements..."
    aria-describedby="special-requests-help"
  ></textarea>
  <p id="special-requests-help" class="field-help">
    <span id="char-count">500</span> characters remaining
  </p>
</div>
```

**Character Counter:**
```javascript
document.getElementById('special-requests').addEventListener('input', function(e) {
    const remaining = 500 - e.target.value.length;
    document.getElementById('char-count').textContent = remaining;
});
```

**Stored in Database:**
- Field: `wp_bookings_appointments.internal_notes`
- Visible to: Staff and Business Owner (not customer after booking)

**No validation errors** (optional field, free text)

---

#### **Field 6: Marketing Consent (GDPR)**

```html
<div class="form-group checkbox-group">
  <label class="checkbox-label">
    <input 
      type="checkbox" 
      id="marketing-consent" 
      name="marketing_consent"
      value="1"
    />
    <span>
      Send me special offers and updates
    </span>
  </label>
  <p class="field-help">
    You can unsubscribe at any time. See our 
    <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
  </p>
</div>
```

**GDPR Compliance:**
- **Unchecked by default** (must be opt-in, not opt-out)
- **Clear language** (no pre-ticked boxes)
- **Easy to unsubscribe** (link in every marketing email)

**Stored in Database:**
- Field: `wp_bookings_customers.marketing_consent` (BOOLEAN)
- Timestamp: `marketing_consent_date` (when they opted in)

---

#### **Field 7: Terms & Privacy Policy Agreement**

```html
<div class="form-group terms-agreement">
  <p class="legal-text">
    By booking, you agree to our 
    <a href="/terms-and-conditions" target="_blank">Terms & Conditions</a> 
    and 
    <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
  </p>
</div>
```

**Note:** NOT a checkbox (pre-acceptance implied by booking action)

**GDPR Requirement:** Privacy Policy must explain:
- What data we collect (name, email, phone, booking history)
- How we use it (appointment management, reminders)
- How long we keep it (7 years for financial records, or until customer requests deletion)
- Right to access, rectify, delete their data

---

### **4.4: Payment Method Selection**

**Payment Options Displayed:**

```html
<div class="payment-methods">
  <h3>Payment</h3>
  
  <div class="payment-summary">
    <p>Total: <strong>£45.00</strong></p>
    <p>Pay now: <strong>£20.00</strong> (deposit)</p>
    <p>Pay on arrival: <strong>£25.00</strong></p>
  </div>
  
  <p>Choose payment method:</p>
  
  <label class="payment-option">
    <input type="radio" name="payment_method" value="stripe" checked />
    <span class="payment-icon">💳</span>
    <span>Credit/Debit Card</span>
  </label>
  
  <label class="payment-option">
    <input type="radio" name="payment_method" value="paypal" />
    <span class="payment-icon">
      <img src="paypal-logo.svg" alt="PayPal" />
    </span>
    <span>PayPal</span>
  </label>
  
  <!-- Only if service allows pay-on-arrival: -->
  <label class="payment-option">
    <input type="radio" name="payment_method" value="pay_on_arrival" />
    <span class="payment-icon">💷</span>
    <span>Pay Full Amount on Arrival</span>
  </label>
</div>

<button type="submit" class="btn-primary btn-large">
  Continue to Payment →
</button>
```

**Payment Method Availability Logic:**

```php
// Determine which payment methods to show
$service = get_service($_SESSION['booking_data']['service_id']);

$payment_methods = [];

// Always show if enabled in settings
if (get_setting('stripe_enabled')) {
    $payment_methods[] = 'stripe';
}

if (get_setting('paypal_enabled')) {
    $payment_methods[] = 'paypal';
}

// Only show if service allows it
if ($service->deposit_type === 'none' || $service->deposit_amount == 0) {
    $payment_methods[] = 'pay_on_arrival';
}
```

**Display Rules:**

| Scenario | Stripe | PayPal | Pay-on-Arrival |
|----------|--------|--------|----------------|
| Service requires deposit (£20) | ✓ | ✓ | ✗ |
| Service allows £0 deposit | ✓ | ✓ | ✓ |
| Only Stripe enabled in WP Admin | ✓ | ✗ | ✓ (if allowed) |
| No payment gateways enabled | ✗ | ✗ | ✓ (forced) |

---

### **4.5: Desktop View - Contact Form**

```
┌──────────────────────┬─────────────────────────────────────────┐
│ ✓ Women's Haircut    │  👤 Your Details                        │
│ ✓ Emma Thompson      │                                         │
│ ✓ Thu 15 May, 2pm    │  [First Name] [Last Name]              │
│   [Change]           │  (side-by-side on desktop)              │
│                      │                                         │
│ ▼ Haircuts           │  [Email Address]                        │
│                      │  We'll send confirmation here           │
│                      │                                         │
│                      │  [Phone Number]                         │
│                      │  For reminders                          │
│                      │                                         │
│                      │  [Special Requests - textarea]          │
│                      │  500 characters remaining               │
│                      │                                         │
│                      │  ☐ Send me special offers               │
│                      │                                         │
│                      │  By booking, you agree to our           │
│                      │  [Terms] and [Privacy Policy]           │
│                      │                                         │
│                      │  ─────────────────────────────────────│
│                      │  💳 Payment                             │
│                      │                                         │
│                      │  Total: £45 • Deposit: £20             │
│                      │                                         │
│                      │  ○ Card  ○ PayPal  ○ Pay on Arrival   │
│                      │                                         │
│                      │  [Continue to Payment →]                │
│                      │                                         │
│                      │  ─────────────────────────────────────│
│                      │  Your Booking                          │
│                      │  ✓ Women's Haircut (45 min)           │
│                      │  ✓ Emma Thompson (£45)                │
│                      │  ✓ Thu 15 May at 2:00 PM              │
│                      │                                         │
│                      │  Deposit: £20.00                       │
│                      │  Balance: £25.00 (on arrival)          │
└──────────────────────┴─────────────────────────────────────────┘
```

**Desktop Layout Differences:**
- First/Last Name side-by-side (50/50 split)
- Payment methods in horizontal row (not vertical stack)
- Summary panel always visible (sticky)

---

### **4.6: Form Validation - Client-Side (JavaScript)**

**Real-time Validation (on blur):**

```javascript
const formValidation = {
    firstName: {
        validate: (value) => {
            if (!value || value.trim().length < 2) {
                return "Please enter your first name";
            }
            if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(value)) {
                return "Please use only letters, spaces, hyphens, and apostrophes";
            }
            return null; // Valid
        }
    },
    
    lastName: {
        validate: (value) => {
            if (!value || value.trim().length < 2) {
                return "Please enter your last name";
            }
            if (!/^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(value)) {
                return "Please use only letters, spaces, hyphens, and apostrophes";
            }
            return null;
        }
    },
    
    email: {
        validate: (value) => {
            if (!value) {
                return "Please enter your email address";
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Please enter a valid email address";
            }
            return null;
        }
    },
    
    phone: {
        validate: (value) => {
            if (!value) {
                return "Please enter your phone number";
            }
            const cleaned = value.replace(/\D/g, '');
            if (!/^(07|01|02|03)\d{9}$/.test(cleaned)) {
                return "Please enter a valid UK phone number";
            }
            return null;
        }
    }
};

// Attach to form fields
document.querySelectorAll('input[required]').forEach(field => {
    field.addEventListener('blur', function() {
        const fieldName = this.name;
        const validator = formValidation[fieldName];
        
        if (validator) {
            const error = validator.validate(this.value);
            const errorElement = document.getElementById(this.id + '-error');
            
            if (error) {
                this.classList.add('field-error');
                errorElement.textContent = error;
                this.setAttribute('aria-invalid', 'true');
            } else {
                this.classList.remove('field-error');
                errorElement.textContent = '';
                this.setAttribute('aria-invalid', 'false');
            }
        }
    });
});
```

---

### **4.7: Form Submission - Validation & Flow**

**When customer clicks "Continue to Payment":**

```javascript
async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Step 1: Validate all fields
    const isValid = validateAllFields();
    if (!isValid) {
        showErrorSummary("Please fix the errors above");
        scrollToFirstError();
        return;
    }
    
    // Step 2: Collect form data
    const formData = {
        first_name: document.getElementById('first-name').value.trim(),
        last_name: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.replace(/\s/g, ''),
        special_requests: document.getElementById('special-requests').value.trim(),
        marketing_consent: document.getElementById('marketing-consent').checked,
        payment_method: document.querySelector('input[name="payment_method"]:checked').value
    };
    
    // Step 3: Save to session (AJAX call)
    showLoadingSpinner("Saving your details...");
    
    const saveResult = await fetch('/wp-json/bookings/v1/save-customer-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    if (!saveResult.ok) {
        showError("Unable to save your details. Please try again.");
        return;
    }
    
    // Step 4: Redirect to payment processor
    const paymentMethod = formData.payment_method;
    
    if (paymentMethod === 'stripe') {
        redirectToStripeCheckout();
    } else if (paymentMethod === 'paypal') {
        redirectToPayPalCheckout();
    } else if (paymentMethod === 'pay_on_arrival') {
        // No payment needed - create booking directly
        createBookingWithoutPayment();
    }
}
```

---

### **4.8: Payment Processing - Three Flows**

#### **Flow 1: Stripe (Credit/Debit Card)**

**Step 1: Customer clicks "Continue to Payment" → Stripe selected**

**Backend creates Stripe Checkout Session:**

```php
function create_stripe_checkout_session($booking_data, $customer_data) {
    require_once('vendor/stripe/stripe-php/init.php');
    
    \Stripe\Stripe::setApiKey(get_setting('stripe_secret_key'));
    
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'gbp',
                'unit_amount' => $booking_data['deposit_amount'] * 100, // £20 = 2000 pence
                'product_data' => [
                    'name' => $booking_data['service_name'],
                    'description' => sprintf(
                        'with %s on %s at %s',
                        $booking_data['staff_name'],
                        $booking_data['booking_display_date'],
                        $booking_data['booking_display_time']
                    ),
                ],
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'customer_email' => $customer_data['email'],
        'success_url' => home_url('/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url' => home_url('/book?step=4&session_cancelled=1'),
        'metadata' => [
            'booking_session_id' => session_id(), // Link to PHP session
            'service_id' => $booking_data['service_id'],
            'staff_id' => $booking_data['staff_id'],
            'booking_date' => $booking_data['booking_date'],
            'booking_time' => $booking_data['booking_time'],
        ],
    ]);
    
    return $session;
}
```

**Step 2: Customer redirected to Stripe hosted checkout page**

**Step 3: Customer completes payment**

**Step 4: Stripe redirects to success_url with session_id**

**Step 5: Webhook handler processes payment:**

```php
// Stripe webhook endpoint: /wp-json/bookings/v1/stripe-webhook
function handle_stripe_webhook() {
    $payload = @file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
    $webhook_secret = get_setting('stripe_webhook_secret');
    
    try {
        $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $webhook_secret);
    } catch(\Exception $e) {
        http_response_code(400);
        exit();
    }
    
    // Handle event
    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        
        // Create booking atomically
        $result = create_booking_from_stripe_session($session);
        
        if ($result['success']) {
            // Send confirmation email
            send_booking_confirmation_email($result['booking_id']);
            
            // Sync to Google Calendar
            sync_to_google_calendar($result['booking_id']);
        }
    }
    
    http_response_code(200);
}
```

---

#### **Flow 2: PayPal**

**Step 1: Create PayPal Order:**

```php
function create_paypal_order($booking_data, $customer_data) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, 'https://api-m.paypal.com/v2/checkout/orders');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'amount' => [
                'currency_code' => 'GBP',
                'value' => number_format($booking_data['deposit_amount'], 2, '.', '')
            ],
            'description' => sprintf(
                '%s with %s on %s',
                $booking_data['service_name'],
                $booking_data['staff_name'],
                $booking_data['booking_display_date']
            )
        ]],
        'application_context' => [
            'return_url' => home_url('/booking-confirmed?paypal_order_id={order_id}'),
            'cancel_url' => home_url('/book?step=4&paypal_cancelled=1'),
        ]
    ]));
    
    // ... cURL options for auth, headers
    
    $response = curl_exec($ch);
    $order = json_decode($response);
    
    return $order;
}
```

**Step 2-5:** Similar flow to Stripe (redirect, payment, webhook, booking creation)

---

#### **Flow 3: Pay on Arrival**

**No external payment processor:**

```php
function create_booking_pay_on_arrival($booking_data, $customer_data) {
    global $wpdb;
    
    // Create customer record
    $customer_id = create_or_update_customer($customer_data);
    
    // Attempt to create booking (optimistic locking)
    $wpdb->query('START TRANSACTION');
    
    try {
        $booking_id = $wpdb->insert(
            $wpdb->prefix . 'bookings_appointments',
            [
                'customer_id' => $customer_id,
                'staff_id' => $booking_data['staff_id'],
                'service_id' => $booking_data['service_id'],
                'booking_date' => $booking_data['booking_date'],
                'start_time' => $booking_data['booking_time'],
                'end_time' => $booking_data['booking_end_time'],
                'status' => 'confirmed', // No payment needed
                'price' => $booking_data['price'],
                'deposit_paid' => 0.00,
                'balance_due' => $booking_data['price'], // Full amount due on arrival
                'payment_status' => 'unpaid',
                'payment_method' => 'pay_on_arrival',
                'internal_notes' => $customer_data['special_requests'],
                // ... other fields
            ]
        );
        
        if (!$booking_id) {
            if (strpos($wpdb->last_error, 'unique_booking') !== false) {
                throw new Exception('slot_unavailable');
            }
            throw new Exception('database_error');
        }
        
        $wpdb->query('COMMIT');
        
        // Send confirmation email
        send_booking_confirmation_email($booking_id);
        
        // Sync to Google Calendar
        sync_to_google_calendar($booking_id);
        
        return ['success' => true, 'booking_id' => $booking_id];
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return ['success' => false, 'error' => $e->getMessage()];
    }
}
```

---

### **4.9: Error States - Payment Form**

#### **Error State 1: Validation Errors**

**Multiple fields invalid:**

```
┌─────────────────────────────────────┐
│ ⚠️ Please fix the following errors: │
│                                     │
│ • First name is required            │
│ • Email address is invalid          │
│ • Phone number is required          │
│                                     │
│ [Scroll to First Error]             │
└─────────────────────────────────────┘
```

**Individual field errors shown inline:**

```
Email Address *
┌─────────────────────────────┐
│ sarah.email.com             │ ← Red border
└─────────────────────────────┘
⚠️ Please enter a valid email address (e.g., name@example.com)
```

---

#### **Error State 2: Payment Failed (Stripe)**

**Customer's card declined:**

```
┌─────────────────────────────────────┐
│ ❌ Payment Failed                    │
│                                     │
│ Your card was declined.             │
│                                     │
│ Reason: Insufficient funds          │
│                                     │
│ Please try a different card or      │
│ payment method.                     │
│                                     │
│ [Try Again] [Change Payment Method] │
└─────────────────────────────────────┘
```

**Booking NOT created** (payment failed before booking insertion)

---

#### **Error State 3: Slot No Longer Available (Race Condition)**

**Customer submits payment, but someone else booked the slot:**

```
┌─────────────────────────────────────┐
│ 😔 Time No Longer Available          │
│                                     │
│ Someone else just booked 2:00 PM    │
│ while you were checking out.        │
│                                     │
│ Your card was NOT charged.          │
│                                     │
│ Would you like to:                  │
│                                     │
│ [Choose Another Time]               │
│ [Choose Another Day]                │
│ [Contact Us: 020 1234 5678]         │
│                                     │
└─────────────────────────────────────┘
```

**Technical Flow:**
1. Payment succeeds on Stripe
2. Booking creation fails (UNIQUE constraint violation)
3. Immediately refund payment (Stripe API)
4. Show error to customer

---

#### **Error State 4: Session Expired**

**Customer abandons form for 30+ minutes, session cleared:**

```
┌─────────────────────────────────────┐
│ ⏱️ Session Expired                   │
│                                     │
│ Your booking session has expired    │
│ for security reasons.               │
│                                     │
│ Please start again to book.         │
│                                     │
│ [Start New Booking]                 │
└─────────────────────────────────────┘
```

**Session Timeout:** 30 minutes of inactivity (configurable in WP Admin)

---

### **4.10: Success State - Booking Confirmed**

**After successful payment AND booking creation:**

**Redirect to:** `/booking-confirmed?id=[booking_id]`

**Display:**

```
┌─────────────────────────────────────┐
│ ✅ Booking Confirmed!                │
│                                     │
│ Your appointment is confirmed.      │
│ We've sent a confirmation email to: │
│                                     │
│ sarah.j@email.com                   │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ Women's Haircut                     │
│ Thursday, 15 May 2026               │
│ 2:00 PM - 2:45 PM                   │
│                                     │
│ with Emma Thompson                  │
│ Shine & Style Hair Studio           │
│ 123 High Street, London             │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ Payment Summary:                    │
│ Deposit paid: £20.00 ✓              │
│ Balance due on arrival: £25.00      │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ [Add to Calendar] [View Receipt]    │
│                                     │
│ Need to make changes?               │
│ [Cancel Booking] [Reschedule]       │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 STEP 4 COMPLETE - Summary

**We've defined:**
- ✅ Contact form fields (first/last name, email, phone, special requests)
- ✅ Validation rules (client-side + server-side)
- ✅ Marketing consent (GDPR-compliant, opt-in)
- ✅ Payment method selection (Stripe/PayPal/Pay-on-Arrival)
- ✅ Three payment processing flows
- ✅ Error states (validation, payment failed, slot taken, session expired)
- ✅ Success state (confirmation page)
- ✅ Mobile-first responsive design
- ✅ Accessibility (ARIA labels, keyboard navigation)

**Open Question:**

**International phone numbers:** UK only (Phase 1) or international support?

**Confirm, then we'll move to:**

## POST-BOOKING FLOWS

This will cover:
- Confirmation email (content, timing, design)
- Reminder email (24hr before, content)
- Cancellation process (magic link, refund flow)
- Rescheduling process (magic link, availability check)
- Customer account creation (optional, after first booking)

**Ready to proceed?**
# ✅ Decision Locked - UK Phone Numbers Only (Phase 1)

Perfect! Keeps validation simple and focused on target market.

---