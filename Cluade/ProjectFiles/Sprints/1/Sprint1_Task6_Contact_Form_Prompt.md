# Sprint 1, Task 6: Contact Form with Validation

## 🎯 OBJECTIVE
Build Step 4 (final step) of the booking wizard - a customer contact form with UK phone validation, email validation, special requests field, and GDPR-compliant marketing consent. This completes the customer booking flow before payment integration (Sprint 2).

## 📋 CONTEXT

### Sprint 1 Progress
✅ **Task 1:** Booking wizard foundation (14h)  
✅ **Task 2:** Service selection UI (20h)  
✅ **Task 3:** Staff selection UI + tests (18h)  
✅ **Task 4:** Date/time picker UI (14h)  
✅ **Task 5:** Availability algorithm + tests (28h)  
⏳ **Task 6:** Contact Form (CURRENT - 16 hours)

### What Customer Has Selected So Far
When reaching Step 4, the session contains:
- `service_id` - Selected service
- `staff_id` - Selected staff or 0 for "No Preference"
- `booking_date` - Selected date (Y-m-d format)
- `booking_time` - Selected time (H:i:s format)

### Task 6 Requirements

**Form Fields:**
1. ✅ First Name (required)
2. ✅ Last Name (required)
3. ✅ Email Address (required, validated)
4. ✅ UK Phone Number (required, UK format validated)
5. ✅ Special Requests (optional, 500 char max)
6. ✅ Marketing Consent (optional, GDPR-compliant)

**Validation:**
- Frontend: Real-time validation as user types/leaves field
- Backend: Server-side validation before saving to session
- Clear, helpful error messages
- Accessibility: ARIA labels, error announcements

**UK-Specific:**
- Phone format: 07xxx xxxxxx (mobile) or 01xxx/02xxx (landline)
- Auto-formatting: `07700900123` → `07700 900123`
- Email domain checks (common typos: gmial.com → gmail.com)

**GDPR Compliance:**
- Marketing consent checkbox (unchecked by default)
- Clear explanation of what they're consenting to
- Link to Privacy Policy
- Store consent status with timestamp

## 🗄️ DATABASE SCHEMA

### wp_bookings_sessions (existing - from Task 1)
```sql
customer_first_name VARCHAR(100) NULL,
customer_last_name VARCHAR(100) NULL,
customer_email VARCHAR(255) NULL,
customer_phone VARCHAR(20) NULL,
customer_special_requests TEXT NULL,
marketing_consent TINYINT(1) DEFAULT 0
```

### wp_bookings_customers (for reference - used in Sprint 2)
```sql
CREATE TABLE wp_bookings_customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    marketing_consent TINYINT(1) DEFAULT 0,
    consent_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

**Note:** In Task 6, we only save to session. Customer record created in Sprint 2 after payment.

## 🎨 UI SPECIFICATION

### Contact Form Layout

```
┌─────────────────────────────────────────┐
│ Step 4: Your Details                    │
├─────────────────────────────────────────┤
│ Almost there! Just a few more details.  │
│                                          │
│ First Name *                             │
│ [________________]                       │
│                                          │
│ Last Name *                              │
│ [________________]                       │
│                                          │
│ Email Address *                          │
│ [________________]                       │
│ We'll send your confirmation here       │
│                                          │
│ Phone Number *                           │
│ [________________]                       │
│ For appointment reminders                │
│                                          │
│ Special Requests (Optional)              │
│ [________________________________]       │
│ [________________________________]       │
│ [________________________________]       │
│ 500 characters remaining                 │
│                                          │
│ ☐ Send me special offers and updates   │
│   (You can unsubscribe anytime)         │
│                                          │
│ By continuing, you agree to our          │
│ [Terms & Conditions] and [Privacy Policy]│
│                                          │
│ [← Back to Date/Time] [Continue →]      │
└─────────────────────────────────────────┘
```

### Validation Error States

```
Email Address *
[john@gmial.com________________]  ← User typed
❌ Did you mean john@gmail.com?

Phone Number *
[1234567890____________________]  ← Invalid format
❌ Please enter a valid UK phone number (e.g., 07700 900123)

First Name *
[___________________________]  ← Empty field, user clicked Continue
❌ Please enter your first name
```

## 🔨 IMPLEMENTATION REQUIREMENTS

### Files to Create

**1. public/templates/booking-step-4-contact.php**
```php
<?php
/**
 * Step 4: Contact Details Template
 */

// Get session data
$session = BOOKIT_Session_Manager::get_session();

// Check prerequisites
if (!isset($session['service_id'], $session['staff_id'], $session['booking_date'], $session['booking_time'])) {
    echo '<p class="error">Please complete the previous steps first.</p>';
    return;
}

// Pre-fill from session if user came back
$first_name = $session['customer_first_name'] ?? '';
$last_name = $session['customer_last_name'] ?? '';
$email = $session['customer_email'] ?? '';
$phone = $session['customer_phone'] ?? '';
$special_requests = $session['customer_special_requests'] ?? '';
$marketing_consent = $session['marketing_consent'] ?? 0;
?>

<div class="bookit-step-4">
    <h2>Your Details</h2>
    <p class="step-intro">Almost there! Just a few more details to confirm your booking.</p>
    
    <form id="bookit-contact-form" class="bookit-contact-form" novalidate>
        
        <!-- First Name -->
        <div class="form-group">
            <label for="first-name">
                First Name <span class="required" aria-label="required">*</span>
            </label>
            <input 
                type="text" 
                id="first-name" 
                name="first_name"
                value="<?php echo esc_attr($first_name); ?>"
                required
                autocomplete="given-name"
                maxlength="100"
                aria-required="true"
                aria-describedby="first-name-error"
            />
            <span id="first-name-error" class="error-message" role="alert"></span>
        </div>
        
        <!-- Last Name -->
        <div class="form-group">
            <label for="last-name">
                Last Name <span class="required" aria-label="required">*</span>
            </label>
            <input 
                type="text" 
                id="last-name" 
                name="last_name"
                value="<?php echo esc_attr($last_name); ?>"
                required
                autocomplete="family-name"
                maxlength="100"
                aria-required="true"
                aria-describedby="last-name-error"
            />
            <span id="last-name-error" class="error-message" role="alert"></span>
        </div>
        
        <!-- Email Address -->
        <div class="form-group">
            <label for="email">
                Email Address <span class="required" aria-label="required">*</span>
            </label>
            <input 
                type="email" 
                id="email" 
                name="email"
                value="<?php echo esc_attr($email); ?>"
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
        
        <!-- Phone Number -->
        <div class="form-group">
            <label for="phone">
                Phone Number <span class="required" aria-label="required">*</span>
            </label>
            <input 
                type="tel" 
                id="phone" 
                name="phone"
                value="<?php echo esc_attr($phone); ?>"
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
        
        <!-- Special Requests -->
        <div class="form-group">
            <label for="special-requests">
                Special Requests <span class="optional">(Optional)</span>
            </label>
            <textarea 
                id="special-requests" 
                name="special_requests"
                rows="3"
                maxlength="500"
                placeholder="Any allergies, preferences, or special requirements..."
                aria-describedby="special-requests-help"
            ><?php echo esc_textarea($special_requests); ?></textarea>
            <p id="special-requests-help" class="field-help">
                <span id="char-count">500</span> characters remaining
            </p>
        </div>
        
        <!-- Marketing Consent (GDPR) -->
        <div class="form-group checkbox-group">
            <label class="checkbox-label">
                <input 
                    type="checkbox" 
                    id="marketing-consent" 
                    name="marketing_consent"
                    value="1"
                    <?php checked($marketing_consent, 1); ?>
                />
                <span>
                    Send me special offers and updates
                </span>
            </label>
            <p class="field-help">
                You can unsubscribe at any time. See our 
                <a href="<?php echo esc_url(home_url('/privacy-policy')); ?>" target="_blank">Privacy Policy</a>.
            </p>
        </div>
        
        <!-- Terms Acceptance -->
        <p class="terms-notice">
            By continuing, you agree to our 
            <a href="<?php echo esc_url(home_url('/terms-conditions')); ?>" target="_blank">Terms &amp; Conditions</a> 
            and 
            <a href="<?php echo esc_url(home_url('/privacy-policy')); ?>" target="_blank">Privacy Policy</a>.
        </p>
        
        <!-- Navigation -->
        <div class="bookit-step-navigation">
            <button type="button" class="btn-back" data-step="3">
                ← Back to Date/Time
            </button>
            <button type="submit" class="btn-continue">
                Continue to Review →
            </button>
        </div>
        
    </form>
</div>
```

**2. includes/api/class-contact-api.php**
```php
<?php
/**
 * Contact Details API
 * 
 * Handles saving customer contact information to session
 */

class BOOKIT_Contact_API {
    
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('bookit/v1', '/contact/save', [
            'methods' => 'POST',
            'callback' => [$this, 'save_contact_details'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * Save contact details to session
     */
    public function save_contact_details($request) {
        // Get form data
        $first_name = sanitize_text_field($request->get_param('first_name'));
        $last_name = sanitize_text_field($request->get_param('last_name'));
        $email = sanitize_email($request->get_param('email'));
        $phone = sanitize_text_field($request->get_param('phone'));
        $special_requests = sanitize_textarea_field($request->get_param('special_requests'));
        $marketing_consent = (bool) $request->get_param('marketing_consent');
        
        // Validate required fields
        $errors = [];
        
        if (empty($first_name)) {
            $errors['first_name'] = 'First name is required';
        } elseif (strlen($first_name) > 100) {
            $errors['first_name'] = 'First name is too long';
        }
        
        if (empty($last_name)) {
            $errors['last_name'] = 'Last name is required';
        } elseif (strlen($last_name) > 100) {
            $errors['last_name'] = 'Last name is too long';
        }
        
        if (empty($email)) {
            $errors['email'] = 'Email address is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address';
        }
        
        if (empty($phone)) {
            $errors['phone'] = 'Phone number is required';
        } else {
            // Validate UK phone format
            $phone_clean = preg_replace('/\D/', '', $phone); // Remove non-digits
            if (!preg_match('/^(07|01|02|03)\d{9}$/', $phone_clean)) {
                $errors['phone'] = 'Please enter a valid UK phone number';
            } else {
                // Store cleaned version
                $phone = $phone_clean;
            }
        }
        
        // Check special requests length
        if (strlen($special_requests) > 500) {
            $errors['special_requests'] = 'Special requests must be 500 characters or less';
        }
        
        // Return errors if any
        if (!empty($errors)) {
            return new WP_REST_Response([
                'success' => false,
                'errors' => $errors
            ], 400);
        }
        
        // Get session
        $session = BOOKIT_Session_Manager::get_session();
        
        // Check prerequisites
        if (!isset($session['service_id'], $session['staff_id'], $session['booking_date'], $session['booking_time'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Previous steps not completed'
            ], 400);
        }
        
        // Save to session
        $session['customer_first_name'] = $first_name;
        $session['customer_last_name'] = $last_name;
        $session['customer_email'] = $email;
        $session['customer_phone'] = $phone;
        $session['customer_special_requests'] = $special_requests;
        $session['marketing_consent'] = $marketing_consent ? 1 : 0;
        $session['consent_date'] = current_time('mysql');
        $session['current_step'] = 5; // Move to review/payment step (Sprint 2)
        
        BOOKIT_Session_Manager::update_session($session);
        
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Contact details saved',
            'next_step' => 5
        ], 200);
    }
}

// Initialize
new BOOKIT_Contact_API();
```

**3. public/assets/js/contact-form.js**
```javascript
/**
 * Contact Form Validation & Submission
 */

class BookitContactForm {
    constructor() {
        this.form = document.getElementById('bookit-contact-form');
        if (!this.form) return;
        
        this.init();
    }
    
    init() {
        // Real-time validation
        this.attachFieldValidators();
        
        // Character counter for special requests
        this.attachCharCounter();
        
        // Phone auto-formatting
        this.attachPhoneFormatter();
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    /**
     * Attach validators to form fields
     */
    attachFieldValidators() {
        const fields = {
            'first-name': this.validateName,
            'last-name': this.validateName,
            'email': this.validateEmail,
            'phone': this.validatePhone
        };
        
        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    const error = fields[fieldId](field.value);
                    this.showFieldError(fieldId, error);
                });
                
                // Clear error on input
                field.addEventListener('input', () => {
                    if (field.value.trim()) {
                        this.clearFieldError(fieldId);
                    }
                });
            }
        });
    }
    
    /**
     * Validate name field
     */
    validateName(value) {
        if (!value || !value.trim()) {
            return 'This field is required';
        }
        if (value.trim().length < 2) {
            return 'Please enter at least 2 characters';
        }
        if (value.length > 100) {
            return 'Maximum 100 characters';
        }
        return null;
    }
    
    /**
     * Validate email field
     */
    validateEmail(value) {
        if (!value || !value.trim()) {
            return 'Email address is required';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        
        // Check for common typos
        const typos = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'outlok.com': 'outlook.com'
        };
        
        const domain = value.split('@')[1];
        if (typos[domain]) {
            return `Did you mean ${value.split('@')[0]}@${typos[domain]}?`;
        }
        
        return null;
    }
    
    /**
     * Validate UK phone number
     */
    validatePhone(value) {
        if (!value || !value.trim()) {
            return 'Phone number is required';
        }
        
        const cleaned = value.replace(/\D/g, '');
        
        // UK mobile (07) or landline (01, 02, 03)
        if (!/^(07|01|02|03)\d{9}$/.test(cleaned)) {
            return 'Please enter a valid UK phone number (e.g., 07700 900123)';
        }
        
        return null;
    }
    
    /**
     * Show field error message
     */
    showFieldError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(fieldId + '-error');
        
        if (errorMessage) {
            field.classList.add('field-error');
            field.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = errorMessage;
            }
        } else {
            this.clearFieldError(fieldId);
        }
    }
    
    /**
     * Clear field error
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(fieldId + '-error');
        
        field.classList.remove('field-error');
        field.setAttribute('aria-invalid', 'false');
        if (errorEl) {
            errorEl.textContent = '';
        }
    }
    
    /**
     * Attach character counter to special requests
     */
    attachCharCounter() {
        const textarea = document.getElementById('special-requests');
        const counter = document.getElementById('char-count');
        
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                const remaining = 500 - textarea.value.length;
                counter.textContent = remaining;
                
                if (remaining < 50) {
                    counter.style.color = '#dc2626'; // Red warning
                } else {
                    counter.style.color = '';
                }
            });
        }
    }
    
    /**
     * Attach phone auto-formatter
     */
    attachPhoneFormatter() {
        const phoneField = document.getElementById('phone');
        if (!phoneField) return;
        
        phoneField.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            
            // UK mobile format: 07700 900123
            if (value.startsWith('07') && value.length === 11) {
                e.target.value = value.replace(/(\d{5})(\d{6})/, '$1 $2');
            }
            // UK landline (London): 020 1234 5678
            else if (value.startsWith('02') && value.length === 11) {
                e.target.value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
            }
            // UK landline (other): 01234 567890
            else if (value.startsWith('01') && value.length === 11) {
                e.target.value = value.replace(/(\d{5})(\d{6})/, '$1 $2');
            }
        });
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const fields = ['first-name', 'last-name', 'email', 'phone'];
        let hasErrors = false;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const validator = {
                'first-name': this.validateName,
                'last-name': this.validateName,
                'email': this.validateEmail,
                'phone': this.validatePhone
            }[fieldId];
            
            const error = validator(field.value);
            this.showFieldError(fieldId, error);
            
            if (error) {
                hasErrors = true;
            }
        });
        
        if (hasErrors) {
            // Scroll to first error
            const firstError = document.querySelector('.field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }
        
        // Collect form data
        const formData = {
            first_name: document.getElementById('first-name').value.trim(),
            last_name: document.getElementById('last-name').value.trim(),
            email: document.getElementById('email').value.trim().toLowerCase(),
            phone: document.getElementById('phone').value.replace(/\s/g, ''),
            special_requests: document.getElementById('special-requests').value.trim(),
            marketing_consent: document.getElementById('marketing-consent').checked
        };
        
        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        try {
            // AJAX request
            const response = await fetch('/wp-json/bookit/v1/contact/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Success - move to next step (Sprint 2: payment/review)
                console.log('Contact details saved successfully');
                // For now, show success message (payment integration in Sprint 2)
                alert('Contact details saved! Payment integration coming in Sprint 2.');
                
            } else {
                // Server-side validation errors
                if (data.errors) {
                    Object.keys(data.errors).forEach(fieldName => {
                        const fieldId = fieldName.replace('_', '-');
                        this.showFieldError(fieldId, data.errors[fieldName]);
                    });
                } else {
                    alert(data.message || 'An error occurred. Please try again.');
                }
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('Unable to save your details. Please try again.');
            
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new BookitContactForm();
});
```

**4. public/assets/css/contact-form.css**
```css
/**
 * Contact Form Styles
 */

.bookit-step-4 {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.step-intro {
    margin-bottom: 2rem;
    color: #666;
    font-size: 1rem;
}

/* Form Groups */
.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
}

.required {
    color: #dc2626;
    font-weight: 700;
}

.optional {
    color: #666;
    font-weight: 400;
    font-size: 0.875rem;
}

/* Input Fields */
.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #1e40af;
}

.form-group input.field-error,
.form-group textarea.field-error {
    border-color: #dc2626;
}

/* Field Help Text */
.field-help {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #666;
}

/* Error Messages */
.error-message {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #dc2626;
    font-weight: 500;
}

/* Textarea */
textarea {
    resize: vertical;
    min-height: 80px;
}

/* Checkbox Group */
.checkbox-group {
    margin-bottom: 1.5rem;
}

.checkbox-label {
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    font-weight: 400;
}

.checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-right: 0.75rem;
    margin-top: 2px;
    cursor: pointer;
}

.checkbox-label span {
    flex: 1;
}

/* Terms Notice */
.terms-notice {
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 2rem;
}

.terms-notice a {
    color: #1e40af;
    text-decoration: underline;
}

/* Navigation Buttons */
.bookit-step-navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-back,
.btn-continue {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-back {
    background: white;
    border: 2px solid #e0e0e0;
    color: #333;
}

.btn-back:hover {
    border-color: #1e40af;
    color: #1e40af;
}

.btn-continue {
    background: #1e40af;
    color: white;
    flex: 1;
}

.btn-continue:hover:not(:disabled) {
    background: #1e3a8a;
}

.btn-continue:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 640px) {
    .bookit-step-4 {
        padding: 1rem 0.5rem;
    }
    
    .bookit-step-navigation {
        flex-direction: column;
    }
    
    .btn-back,
    .btn-continue {
        width: 100%;
    }
}

/* Focus Indicators (Accessibility) */
.form-group input:focus,
.form-group textarea:focus,
.checkbox-label input:focus {
    outline: 2px solid #1e40af;
    outline-offset: 2px;
}
```

## ✅ ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] Form displays with all 6 fields
- [ ] Required fields marked with asterisk (*)
- [ ] Real-time validation on blur (leave field)
- [ ] Clear error messages below fields
- [ ] UK phone auto-formatting (07700 900123)
- [ ] Email typo suggestions (gmial.com → gmail.com)
- [ ] Special requests character counter
- [ ] Marketing consent checkbox (unchecked by default)
- [ ] Links to Terms & Privacy Policy
- [ ] Form saves to session on submit
- [ ] "Back" button returns to Step 3
- [ ] "Continue" button saves and advances (shows alert for Sprint 2)

### Validation Requirements
- [ ] First Name: Required, 2-100 characters
- [ ] Last Name: Required, 2-100 characters
- [ ] Email: Required, valid format, max 255 characters
- [ ] Phone: Required, UK format (07/01/02/03 + 9 digits)
- [ ] Special Requests: Optional, max 500 characters
- [ ] Marketing Consent: Optional (GDPR-compliant)

### Accessibility Requirements
- [ ] All inputs have associated labels
- [ ] Required fields have aria-required="true"
- [ ] Error messages have role="alert"
- [ ] Invalid fields have aria-invalid="true"
- [ ] Form is keyboard navigable (Tab order correct)
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast ≥4.5:1 (WCAG AA)

### UK-Specific Requirements
- [ ] Phone accepts: 07xxx (mobile), 01xxx/02xxx/03xxx (landline)
- [ ] Phone auto-formats with spaces
- [ ] Email domain typo detection works
- [ ] Privacy Policy and Terms links present

## 🧪 TESTING CHECKLIST

### Manual Testing Scenarios

**Scenario 1: Happy Path**
1. Complete Steps 1-3
2. Arrive at Step 4
3. Fill all required fields correctly
4. Click "Continue"
5. **Expected:** Alert "Contact details saved! Payment integration coming in Sprint 2."

**Scenario 2: Validation Errors**
1. Leave First Name empty
2. Enter invalid email: "john@gmial.com"
3. Enter invalid phone: "1234567890"
4. Click "Continue"
5. **Expected:** 
   - First Name error: "This field is required"
   - Email error: "Did you mean john@gmail.com?"
   - Phone error: "Please enter a valid UK phone number"

**Scenario 3: Phone Auto-Formatting**
1. Type: "07700900123"
2. **Expected:** Formats to "07700 900123" as you type

**Scenario 4: Character Counter**
1. Type in Special Requests field
2. **Expected:** Counter updates: "485 characters remaining"
3. Type until <50 remaining
4. **Expected:** Counter turns red

**Scenario 5: Back Navigation**
1. Fill out form
2. Click "← Back to Date/Time"
3. Select different time
4. Return to Step 4
5. **Expected:** Form still has your entered data (session persists)

**Scenario 6: Marketing Consent**
1. Check marketing consent checkbox
2. Submit form
3. **Expected:** Consent saved with timestamp in session

**Scenario 7: Required Field Validation**
1. Tab through fields without entering anything
2. **Expected:** Error appears on blur for each required field

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS + macOS)
- [ ] Edge (latest)

### Accessibility Testing
- [ ] Keyboard navigation (Tab through all fields)
- [ ] Screen reader announcements (NVDA/VoiceOver)
- [ ] aXe DevTools scan (0 critical issues)
- [ ] Color contrast check

## ⏱️ TIME ESTIMATE

**Task 6 Total: 16 hours**

**Breakdown:**
- Contact form template (HTML): 2h
- Contact API endpoint: 2h
- JavaScript validation: 4h
- Phone auto-formatting: 1h
- Email typo detection: 1h
- CSS styling: 2h
- Testing (manual + accessibility): 3h
- Edge case fixes: 1h

## 📝 GIT COMMIT MESSAGE TEMPLATE

```
Sprint 1, Task 6: Contact form with UK validation

- Created booking-step-4-contact.php template
- Built Contact_API with server-side validation
- Implemented real-time field validation
- UK phone validation (07xxx/01xxx format)
- Phone auto-formatting (07700 900123)
- Email typo detection (gmial → gmail)
- Special requests with character counter
- GDPR-compliant marketing consent checkbox
- Links to Terms & Privacy Policy
- Session persistence for form data
- Responsive design (mobile-first)
- WCAG 2.1 AA compliant

Form complete - ready for payment integration (Sprint 2)

Tests: Manual testing complete, accessibility scan passed
Fields: 6 fields (4 required, 2 optional)
Validation: Frontend + backend
```

## 🚨 CRITICAL REMINDERS

1. **GDPR Compliance:**
   - Marketing consent checkbox UNCHECKED by default
   - Clear explanation of what they're consenting to
   - Link to Privacy Policy required
   - Store consent timestamp

2. **UK Phone Validation:**
   - Accept: 07xxx (mobile), 01xxx/02xxx/03xxx (landline)
   - Auto-format with spaces: `07700 900123`
   - Store cleaned version (no spaces): `07700900123`

3. **Session Storage Only:**
   - Task 6 saves to session only
   - Customer record created in Sprint 2 after payment
   - Session contains: first_name, last_name, email, phone, special_requests, marketing_consent

4. **No Payment Yet:**
   - "Continue" button shows alert about Sprint 2
   - Payment integration comes next sprint
   - Form is complete and ready for payment flow

5. **Accessibility:**
   - All inputs have labels
   - Error messages have role="alert"
   - Keyboard navigable
   - Color contrast ≥4.5:1

## 🎯 SUCCESS METRICS

- **Form completion:** Customer can enter all details
- **Validation working:** Real-time + server-side
- **Session persistence:** Data saved correctly
- **Accessibility:** aXe scan 0 critical issues
- **Mobile responsive:** Works on 375px+ width

## 🚀 NEXT STEPS AFTER TASK 6

Once Task 6 is complete, you have 2 remaining Sprint 1 tasks:

**Task 7: Session Management Review (~8-12 hours)**
- Likely mostly complete from Tasks 1-6
- Session cleanup, security review
- CSRF protection verification

**Task 8: Integration Testing (24 hours)**
- End-to-end booking flow (Steps 1-4)
- Browser testing across platforms
- Mobile responsive testing
- Accessibility audit
- Performance testing

Then Sprint 1 is complete and you move to **Sprint 2: Payment Integration**!

---

## 🎯 READY TO IMPLEMENT

Paste this entire prompt into Cursor Composer (Ctrl+I) and implement Task 6.

**Expected Implementation Time:** 14-16 hours
**Complexity:** Medium (standard form with validation)
