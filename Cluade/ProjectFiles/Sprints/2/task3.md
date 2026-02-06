# 🟢 TASK 3: STRIPE CHECKOUT SESSION - IMPLEMENTATION

**Status:** Tests created ✅ - Now implementing the feature

---

## 📝 IMPLEMENTATION PROMPT FOR CURSOR

Copy this into **Cursor Composer** (Ctrl+I or Cmd+I):

```
TASK: Implement Stripe Checkout Session Creation (Sprint 2, Task 3)

CONTEXT:
Sprint 2, Task 3 - Implementation. We have 15 PHPUnit tests waiting (currently failing). Now implement the feature to make all tests pass.

REQUIREMENTS:

1. CREATE STRIPE CHECKOUT CLASS: includes/payment/class-stripe-checkout.php

This class handles creating Stripe Checkout Sessions for booking payments.

```php
<?php
/**
 * Stripe Checkout Session Handler
 * Creates Stripe Checkout Sessions for booking payments
 * 
 * @package Booking_System
 * @subpackage Payment
 */

class Booking_System_Stripe_Checkout {
    
    /**
     * Create Stripe Checkout Session
     * 
     * @param array $session_data Booking wizard session data
     * @return string|WP_Error Stripe session ID or error
     */
    public function create_checkout_session($session_data) {
        // Validate required fields
        // Get service and staff details from database
        // Calculate deposit amount
        // Get Stripe API key
        // Create Stripe Checkout Session
        // Return session ID or WP_Error
    }
    
    /**
     * Validate session data
     */
    private function validate_session_data($session_data) {
        // Check required fields: service_id, staff_id, date, time, customer_email, customer_first_name, customer_last_name
        // Validate email format
        // Return WP_Error if validation fails
    }
    
    /**
     * Get service from database
     */
    private function get_service($service_id) {
        // Query wp_bookings_services table
        // Return service array or false
    }
    
    /**
     * Get staff member from database
     */
    private function get_staff($staff_id) {
        // Query wp_bookings_staff table
        // Return staff array or false
    }
    
    /**
     * Calculate deposit amount based on service settings
     */
    private function calculate_deposit($service) {
        // Check service deposit_type: 'full', 'percentage', 'fixed'
        // Calculate based on base_price and deposit_amount
        // Return amount in pounds (e.g., 25.00)
    }
    
    /**
     * Build Stripe Checkout Session parameters
     */
    private function build_session_params($session_data, $service, $staff, $deposit_amount) {
        // Build line_items with service name, description, amount
        // Build metadata with all booking data
        // Map session 'date'/'time' to metadata 'booking_date'/'booking_time'
        // Set success_url and cancel_url
        // Return array of Stripe session parameters
    }
}
```

IMPLEMENTATION DETAILS:

A. Validation (validate_session_data):
```php
private function validate_session_data($session_data) {
    $required_fields = ['service_id', 'staff_id', 'date', 'time', 
                        'customer_email', 'customer_first_name', 'customer_last_name'];
    
    foreach ($required_fields as $field) {
        if (empty($session_data[$field])) {
            return new WP_Error('missing_field', sprintf('Missing required field: %s', $field));
        }
    }
    
    // Validate email
    if (!is_email($session_data['customer_email'])) {
        return new WP_Error('invalid_email', 'Invalid email address');
    }
    
    return true;
}
```

B. Database Queries:
```php
private function get_service($service_id) {
    global $wpdb;
    
    $service = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
        $service_id
    ), ARRAY_A);
    
    if (!$service) {
        return false;
    }
    
    return $service;
}

private function get_staff($staff_id) {
    global $wpdb;
    
    $staff = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
        $staff_id
    ), ARRAY_A);
    
    if (!$staff) {
        return false;
    }
    
    return $staff;
}
```

C. Deposit Calculation:
```php
private function calculate_deposit($service) {
    $base_price = floatval($service['base_price']);
    $deposit_type = $service['deposit_type'] ?? 'full';
    
    switch ($deposit_type) {
        case 'percentage':
            $percentage = floatval($service['deposit_amount']);
            return ($base_price * $percentage) / 100;
        
        case 'fixed':
            $fixed = floatval($service['deposit_amount']);
            return min($fixed, $base_price); // Don't exceed total price
        
        case 'full':
        default:
            return $base_price;
    }
}
```

D. Stripe Session Creation:
```php
public function create_checkout_session($session_data) {
    // 1. Validate
    $validation = $this->validate_session_data($session_data);
    if (is_wp_error($validation)) {
        return $validation;
    }
    
    // 2. Get service
    $service = $this->get_service($session_data['service_id']);
    if (!$service) {
        return new WP_Error('missing_service', 'Service not found');
    }
    
    // 3. Get staff
    $staff = $this->get_staff($session_data['staff_id']);
    if (!$staff) {
        return new WP_Error('missing_staff', 'Staff member not found');
    }
    
    // 4. Calculate deposit
    $deposit_amount = $this->calculate_deposit($service);
    
    if ($deposit_amount <= 0) {
        return new WP_Error('invalid_amount', 'Deposit amount must be greater than zero');
    }
    
    // 5. Get Stripe API key
    require_once dirname(dirname(__DIR__)) . '/vendor/autoload.php';
    
    $stripe_config = new Booking_System_Stripe_Config();
    $secret_key = $stripe_config->get_secret_key();
    
    if (empty($secret_key)) {
        return new WP_Error('missing_api_key', 'Stripe API key not configured');
    }
    
    // 6. Check for mock mode (testing)
    if (apply_filters('bookit_stripe_api_mode', 'live') === 'mock') {
        return apply_filters('bookit_mock_stripe_session', $session_data);
    }
    
    // 7. Initialize Stripe
    \Stripe\Stripe::setApiKey($secret_key);
    
    // 8. Build session parameters
    $params = $this->build_session_params($session_data, $service, $staff, $deposit_amount);
    
    // 9. Create Stripe Checkout Session
    try {
        $checkout_session = \Stripe\Checkout\Session::create($params);
        return $checkout_session->id;
    } catch (\Exception $e) {
        error_log('Stripe Checkout Session Error: ' . $e->getMessage());
        return new WP_Error('stripe_error', 'Unable to create checkout session: ' . $e->getMessage());
    }
}
```

E. Build Session Parameters:
```php
private function build_session_params($session_data, $service, $staff, $deposit_amount) {
    // Format date for display
    $date_formatted = date('d/m/Y', strtotime($session_data['date']));
    $time_formatted = date('g:i A', strtotime($session_data['time']));
    
    // Build description
    $description = sprintf(
        'with %s %s on %s at %s',
        $staff['first_name'],
        $staff['last_name'],
        $date_formatted,
        $time_formatted
    );
    
    // Build metadata (map session fields to database field names)
    $metadata = [
        'booking_temp_id' => wp_generate_uuid4(),
        'service_id' => (string) $session_data['service_id'],
        'staff_id' => (string) $session_data['staff_id'],
        'booking_date' => $session_data['date'], // Map 'date' → 'booking_date'
        'booking_time' => $session_data['time'], // Map 'time' → 'booking_time'
        'customer_first_name' => $session_data['customer_first_name'],
        'customer_last_name' => $session_data['customer_last_name'],
        'customer_email' => $session_data['customer_email'],
        'customer_phone' => $session_data['customer_phone']
    ];
    
    // Add optional fields if present
    if (!empty($session_data['customer_special_requests'])) {
        $metadata['special_requests'] = substr($session_data['customer_special_requests'], 0, 500);
    }
    
    // Build line items
    $line_items = [[
        'price_data' => [
            'currency' => 'gbp',
            'product_data' => [
                'name' => $service['name'],
                'description' => $description
            ],
            'unit_amount' => (int) ($deposit_amount * 100) // Convert to pence
        ],
        'quantity' => 1
    ]];
    
    // Build session parameters
    return [
        'payment_method_types' => ['card'],
        'line_items' => $line_items,
        'mode' => 'payment',
        'success_url' => home_url('/booking-confirmed?session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url' => home_url('/book?step=5&cancelled=1'),
        'customer_email' => $session_data['customer_email'],
        'metadata' => $metadata
    ];
}
```

2. CREATE PAYMENT SELECTION PAGE: public/templates/booking-step-5-payment.php

This is the UI where customers select their payment method.

```php
<?php
/**
 * Booking Step 5: Payment Method Selection
 * 
 * @package Booking_System
 */

// Security check
if (!defined('ABSPATH')) {
    exit;
}

// Get session data
$session_data = $_SESSION['bookit_wizard'] ?? [];

// If no session data, redirect to step 1
if (empty($session_data) || $session_data['current_step'] < 4) {
    wp_redirect(home_url('/book?step=1'));
    exit;
}

// Get service for pricing display
global $wpdb;
$service = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}bookings_services WHERE id = %d",
    $session_data['service_id']
), ARRAY_A);

// Calculate deposit
$stripe_checkout = new Booking_System_Stripe_Checkout();
$deposit_amount = $stripe_checkout->calculate_deposit($service); // Make this method public
$total_price = $service['base_price'];
$balance = $total_price - $deposit_amount;

?>

<div class="bookit-payment-step">
    <h2><?php _e('Step 5: Payment', 'booking-system'); ?></h2>
    
    <div class="bookit-booking-summary">
        <h3><?php _e('Booking Summary', 'booking-system'); ?></h3>
        <p><strong><?php echo esc_html($service['name']); ?></strong></p>
        <p><?php echo esc_html(date('l, j F Y', strtotime($session_data['date']))); ?></p>
        <p><?php echo esc_html(date('g:i A', strtotime($session_data['time']))); ?></p>
    </div>
    
    <div class="bookit-payment-options">
        <h3><?php _e('Choose Payment Method', 'booking-system'); ?></h3>
        
        <form method="POST" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="bookit-payment-form">
            <?php wp_nonce_field('bookit_booking_action', 'bookit_nonce'); ?>
            <input type="hidden" name="action" value="bookit_process_payment">
            
            <!-- Stripe Payment Option -->
            <div class="bookit-payment-option">
                <input type="radio" 
                       name="payment_method" 
                       id="payment-stripe" 
                       value="stripe" 
                       checked>
                <label for="payment-stripe">
                    <span class="payment-title"><?php _e('Credit/Debit Card', 'booking-system'); ?></span>
                    <span class="payment-description"><?php _e('Secure payment via Stripe', 'booking-system'); ?></span>
                </label>
            </div>
            
            <!-- PayPal Payment Option (Coming in Task 9) -->
            <div class="bookit-payment-option" style="opacity: 0.5;">
                <input type="radio" 
                       name="payment_method" 
                       id="payment-paypal" 
                       value="paypal" 
                       disabled>
                <label for="payment-paypal">
                    <span class="payment-title"><?php _e('PayPal', 'booking-system'); ?></span>
                    <span class="payment-description"><?php _e('Coming soon', 'booking-system'); ?></span>
                </label>
            </div>
            
            <!-- Pay on Arrival Option (Coming in Task 13) -->
            <div class="bookit-payment-option" style="opacity: 0.5;">
                <input type="radio" 
                       name="payment_method" 
                       id="payment-arrival" 
                       value="pay_on_arrival" 
                       disabled>
                <label for="payment-arrival">
                    <span class="payment-title"><?php _e('Pay on Arrival', 'booking-system'); ?></span>
                    <span class="payment-description"><?php _e('Coming soon', 'booking-system'); ?></span>
                </label>
            </div>
            
            <div class="bookit-payment-summary">
                <div class="price-row">
                    <span><?php _e('Total:', 'booking-system'); ?></span>
                    <span>£<?php echo number_format($total_price, 2); ?></span>
                </div>
                <div class="price-row deposit">
                    <span><?php _e('Deposit:', 'booking-system'); ?></span>
                    <span>£<?php echo number_format($deposit_amount, 2); ?></span>
                </div>
                <div class="price-row balance">
                    <span><?php _e('Balance (pay on arrival):', 'booking-system'); ?></span>
                    <span>£<?php echo number_format($balance, 2); ?></span>
                </div>
            </div>
            
            <div class="bookit-form-actions">
                <a href="<?php echo esc_url(home_url('/book?step=4')); ?>" class="bookit-btn-secondary">
                    <?php _e('← Back', 'booking-system'); ?>
                </a>
                <button type="submit" class="bookit-btn-primary">
                    <?php _e('Complete Booking →', 'booking-system'); ?>
                </button>
            </div>
        </form>
    </div>
</div>
```

3. CREATE PAYMENT PROCESSOR: includes/payment/class-payment-processor.php

Handles form submission and redirects to Stripe.

```php
<?php
/**
 * Payment Processor
 * Handles payment method selection and redirects to appropriate gateway
 */

class Booking_System_Payment_Processor {
    
    public function __construct() {
        add_action('admin_post_bookit_process_payment', array($this, 'process_payment'));
        add_action('admin_post_nopriv_bookit_process_payment', array($this, 'process_payment'));
    }
    
    public function process_payment() {
        // Verify nonce
        if (!isset($_POST['bookit_nonce']) || !wp_verify_nonce($_POST['bookit_nonce'], 'bookit_booking_action')) {
            wp_die(__('Security check failed', 'booking-system'));
        }
        
        // Get payment method
        $payment_method = sanitize_text_field($_POST['payment_method'] ?? 'stripe');
        
        // Get session data
        $session_data = $_SESSION['bookit_wizard'] ?? [];
        
        if (empty($session_data)) {
            wp_redirect(home_url('/book?step=1&error=session_expired'));
            exit;
        }
        
        // Process based on payment method
        switch ($payment_method) {
            case 'stripe':
                $this->process_stripe_payment($session_data);
                break;
            
            case 'paypal':
                // Task 9 - PayPal integration
                wp_die(__('PayPal payment coming soon', 'booking-system'));
                break;
            
            case 'pay_on_arrival':
                // Task 13 - Pay on arrival
                wp_die(__('Pay on arrival coming soon', 'booking-system'));
                break;
            
            default:
                wp_redirect(home_url('/book?step=5&error=invalid_payment_method'));
                exit;
        }
    }
    
    private function process_stripe_payment($session_data) {
        $stripe_checkout = new Booking_System_Stripe_Checkout();
        $session_id = $stripe_checkout->create_checkout_session($session_data);
        
        if (is_wp_error($session_id)) {
            error_log('Stripe Checkout Error: ' . $session_id->get_error_message());
            wp_redirect(home_url('/book?step=5&error=' . $session_id->get_error_code()));
            exit;
        }
        
        // Get Stripe publishable key
        $stripe_config = new Booking_System_Stripe_Config();
        $publishable_key = $stripe_config->get_publishable_key();
        
        // Redirect to Stripe Checkout
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body>
            <p><?php _e('Redirecting to payment...', 'booking-system'); ?></p>
            <script>
                var stripe = Stripe('<?php echo esc_js($publishable_key); ?>');
                stripe.redirectToCheckout({
                    sessionId: '<?php echo esc_js($session_id); ?>'
                }).then(function(result) {
                    if (result.error) {
                        alert(result.error.message);
                        window.location.href = '<?php echo esc_url(home_url('/book?step=5&error=stripe_redirect')); ?>';
                    }
                });
            </script>
        </body>
        </html>
        <?php
        exit;
    }
}

new Booking_System_Payment_Processor();
```

4. ADD CSS: public/assets/css/payment-step.css

```css
.bookit-payment-step {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.bookit-booking-summary {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
}

.bookit-payment-option {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.3s;
}

.bookit-payment-option:hover {
    border-color: #0073aa;
}

.bookit-payment-option input[type="radio"] {
    margin-right: 10px;
}

.bookit-payment-option label {
    cursor: pointer;
    display: block;
}

.payment-title {
    font-weight: bold;
    font-size: 16px;
    display: block;
    margin-bottom: 5px;
}

.payment-description {
    font-size: 14px;
    color: #666;
}

.bookit-payment-summary {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

.price-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #ddd;
}

.price-row.deposit {
    font-weight: bold;
    font-size: 18px;
    color: #0073aa;
}

.bookit-form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
}

.bookit-btn-primary,
.bookit-btn-secondary {
    padding: 12px 24px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 16px;
}

.bookit-btn-primary {
    background: #0073aa;
    color: white;
    border: none;
    cursor: pointer;
}

.bookit-btn-secondary {
    background: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
}
```

5. INCLUDE NEW FILES IN MAIN PLUGIN

Update booking-system.php to include new classes:

```php
// Payment processing
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-stripe-checkout.php';
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-payment-processor.php';
```

CRITICAL REQUIREMENTS:

1. Session field mapping: 'date'/'time' → 'booking_date'/'booking_time' in metadata
2. Amount in pence: Multiply by 100 for Stripe (£25.00 = 2500)
3. Error handling: Return WP_Error for all validation failures
4. Mock mode: Check for 'bookit_stripe_api_mode' filter for testing
5. Security: CSRF nonce verification on form submission
6. Deposit calculation: Support 'full', 'percentage', 'fixed' types
7. URL formatting: Use home_url() for all redirect URLs

SUCCESS CRITERIA:
- All 15 PHPUnit tests pass
- Payment selection page displays correctly
- Can select Stripe payment method
- Form submits without errors
- Redirects to Stripe Checkout (in browser test)
- Metadata includes all booking data with correct field names

Please generate complete, production-ready code following WordPress coding standards.
```

---

## ⏸️ AFTER CURSOR GENERATES CODE

### Step 1: Verify Files Created

Check these files exist:
- [ ] `includes/payment/class-stripe-checkout.php`
- [ ] `includes/payment/class-payment-processor.php`
- [ ] `public/templates/booking-step-5-payment.php`
- [ ] `public/assets/css/payment-step.css`

### Step 2: Verify Main Plugin Updated

Check `booking-system.php` includes new classes:
```php
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-stripe-checkout.php';
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-payment-processor.php';
```

### Step 3: Make calculate_deposit() Public

The template needs to access this method. In `class-stripe-checkout.php`, change:
```php
private function calculate_deposit($service) {
```
To:
```php
public function calculate_deposit($service) {
```

### Step 4: Run Tests

```bash
vendor/bin/phpunit tests/test-stripe-checkout.php
```

**Expected:**
```
PHPUnit 9.x.x

...............  15 / 15 (100%)

Time: 00:00.345, Memory: 14.00 MB

OK (15 tests, 45 assertions)
```

---

## 🧪 MANUAL TESTING

After tests pass, test in browser:

### Test 1: Access Payment Step

1. Start booking flow: `yoursite.local/book?step=1`
2. Complete Steps 1-4 (service, staff, date/time, contact)
3. Should arrive at Step 5: Payment
4. **Expected:** Payment selection page displays

### Test 2: Verify Payment Options

- [ ] Stripe option is enabled (checked by default)
- [ ] PayPal option is disabled (greyed out, "Coming soon")
- [ ] Pay on Arrival option is disabled (greyed out, "Coming soon")
- [ ] Pricing summary shows: Total, Deposit, Balance
- [ ] Amounts calculated correctly (deposit based on service settings)

### Test 3: Submit Stripe Payment

1. Select "Credit/Debit Card (Stripe)"
2. Click "Complete Booking"
3. **Expected:** Redirects to Stripe Checkout page
4. **URL should be:** `checkout.stripe.com/c/pay/...`

### Test 4: Stripe Checkout Page Content

On Stripe checkout page, verify:
- [ ] Service name displayed
- [ ] Staff name in description ("with Emma Thompson on...")
- [ ] Date and time in description
- [ ] Amount is correct (deposit amount)
- [ ] Currency is GBP (£)

### Test 5: Cancel Payment

1. On Stripe checkout page, click browser back button
2. **Expected:** Returns to `/book?step=5&cancelled=1`
3. **Expected:** Still on payment selection page

---

## 🐛 TROUBLESHOOTING

### Issue 1: Tests Failing - "Class not found"

**Solution:**
```php
// In test file setUp(), add:
require_once dirname(__DIR__) . '/includes/payment/class-stripe-checkout.php';
require_once dirname(__DIR__) . '/includes/payment/class-stripe-config.php';
```

### Issue 2: "Stripe API key not configured" Error

**Check:**
1. Go to WordPress Admin → Booking System → Payment Settings
2. Verify test mode is ON
3. Verify test API keys are saved
4. Re-save if needed

### Issue 3: Redirect Loop or Blank Page

**Check:**
- Session data exists: `var_dump($_SESSION['bookit_wizard']);`
- Current step is 4 or higher
- No PHP errors in `wp-content/debug.log`

### Issue 4: Amount Incorrect on Stripe Checkout

**Check:**
- Deposit calculation in database (deposit_type, deposit_amount columns)
- Amount multiplied by 100 (convert to pence)
- Service base_price is set correctly

---

## ✅ TASK 3 ACCEPTANCE CRITERIA

Before marking complete:

**Tests:**
- [ ] All 15 PHPUnit tests passing
- [ ] No test failures or warnings
- [ ] Tests run in isolation (any order)

**Code Quality:**
- [ ] All functions have docblocks
- [ ] WordPress Coding Standards followed
- [ ] Proper error handling (WP_Error)
- [ ] No PHP warnings or notices

**Functionality:**
- [ ] Payment selection page displays
- [ ] Stripe option enabled and working
- [ ] Redirects to Stripe Checkout successfully
- [ ] Correct amount shown on Stripe page
- [ ] Service/staff/date/time shown correctly
- [ ] Metadata includes all booking data
- [ ] Field mapping correct (date→booking_date, time→booking_time)

**Security:**
- [ ] CSRF nonce on form
- [ ] Nonce verified on submission
- [ ] Session data validated
- [ ] No sensitive data in URLs

---

## 📊 REPORT YOUR RESULTS

**Please provide:**

1. **Test Results:**
   ```
   Paste PHPUnit output here
   ```

2. **Browser Test:** Did payment redirect to Stripe work? (Yes/No)

3. **Any Issues?** (None if everything worked)

4. **Actual Time Spent:** ___ hours (estimated was 12h)

---

**Reply with:**
- "All Task 3 tests passing ✅ + browser test successful" (if complete), OR
- Report any issues encountered

Once confirmed, we'll commit Task 3 and move to Task 4 (Stripe Webhook Endpoint).