# 🔵 TASK 2: STRIPE SDK SETUP & CONFIGURATION

**Estimated Time:** 4 hours  
**Week:** 2 of 5  
**Status:** READY TO BEGIN

---

## 🎯 TASK OVERVIEW

**Goal:** Install Stripe PHP SDK and create admin settings interface for configuring Stripe API keys (test mode only for now).

**What You'll Build:**
- Stripe PHP SDK installed via Composer
- Admin settings page for Stripe configuration
- Test mode toggle with key fields
- Secure storage of API keys in WordPress options
- Stripe configuration class for SDK initialization

---

## 📝 IMPLEMENTATION PROMPT FOR CURSOR

Copy the section below and paste it into **Cursor Composer** (Ctrl+I or Cmd+I):

---

```
TASK: Install Stripe PHP SDK and Create Admin Configuration Interface

CONTEXT:
This is Sprint 2, Task 2. We're setting up Stripe payment gateway integration for the WordPress booking plugin. This task focuses on SDK installation and admin configuration only - no payment processing yet.

REQUIREMENTS:

1. INSTALL STRIPE SDK VIA COMPOSER:
   - Add to composer.json: "stripe/stripe-php": "^13.0"
   - Run composer install/update
   - Ensure vendor/autoload.php is included in main plugin file

2. CREATE ADMIN SETTINGS PAGE: admin/settings/stripe-settings.php
   - Navigation tab: "Payment Settings" → "Stripe"
   - Test Mode section with toggle (checkbox)
   - Test API Keys section:
     - Test Publishable Key (text input)
     - Test Secret Key (password input)
     - Test Webhook Secret (password input)
   - Live API Keys section (disabled with upgrade notice):
     - Notice: "Live mode will be enabled in production release"
     - Greyed out/disabled fields for Live keys
   - Save Settings button
   - Success/error messages
   - Field validation (required when test mode enabled)

3. CREATE CONFIGURATION CLASS: includes/payment/class-stripe-config.php
   - Get current mode (test/live)
   - Get publishable key (based on mode)
   - Get secret key (based on mode)
   - Get webhook secret (based on mode)
   - Initialize Stripe SDK with correct API key
   - Validate API keys format (starts with pk_test, sk_test, whsec_)
   - Method to test API connection

4. REGISTER SETTINGS IN WORDPRESS:
   - Register settings group: 'bookit_stripe_settings'
   - Options to store:
     - bookit_stripe_test_mode (boolean)
     - bookit_stripe_test_publishable_key (text)
     - bookit_stripe_test_secret_key (text, encrypted if possible)
     - bookit_stripe_test_webhook_secret (text, encrypted if possible)
   - Sanitization callbacks for all fields
   - Validation: ensure keys start with correct prefix

5. ADMIN MENU INTEGRATION:
   - Add submenu under main Booking System menu
   - Menu title: "Payment Settings"
   - Capability: 'manage_options'
   - Hook into existing admin menu structure

SECURITY REQUIREMENTS:
- Use WordPress Settings API (register_setting, add_settings_section)
- Sanitize all inputs with sanitize_text_field()
- Use wp_nonce_field for form security
- Verify nonce on save: check_admin_referer()
- Store sensitive keys encrypted if possible (or plaintext for now, encryption in Phase 2)
- Only users with 'manage_options' capability can access

UI/UX REQUIREMENTS:
- Clean, WordPress-style admin interface
- Clear labels and help text
- Visual indicator for test mode (green badge or notice)
- Link to Stripe dashboard for getting API keys
- Help text: "Get your test API keys from https://dashboard.stripe.com/test/apikeys"
- Validation errors shown inline near fields
- Success message on save: "Stripe settings saved successfully"

STRIPE SDK INITIALIZATION:
- Only initialize SDK when needed (not on every page load)
- Use correct API key based on mode
- Handle SDK initialization errors gracefully
- Log errors to WordPress error log

FILE STRUCTURE:
admin/settings/stripe-settings.php - Admin UI
includes/payment/class-stripe-config.php - Configuration class
composer.json - Add Stripe dependency

WORDPRESS STANDARDS:
- Follow WordPress Coding Standards
- Use WordPress Settings API
- Proper escaping: esc_html(), esc_attr(), esc_url()
- Internationalization ready: __(), _e()
- Add docblocks to all functions

SUCCESS CRITERIA:
- Composer installs Stripe SDK without errors
- Admin page accessible under Booking System menu
- Can save test API keys
- Keys stored in wp_options table
- Test mode toggle works
- Live mode fields disabled with notice
- Form validation prevents invalid keys
- Stripe SDK can be initialized with saved keys

IMPLEMENTATION NOTES:
1. Use WordPress Settings API for form generation
2. Test mode should default to ON (true)
3. Publishable keys start with: pk_test_
4. Secret keys start with: sk_test_
5. Webhook secrets start with: whsec_
6. Add inline documentation for getting Stripe test keys
7. Consider adding "Test Connection" button (optional, can be Task 3)

Please generate complete, production-ready code following WordPress best practices.
```

---

## ⏸️ AFTER CURSOR GENERATES CODE

### Step 1: Verify Composer Changes

Check `composer.json` - should have:
```json
{
  "require": {
    "stripe/stripe-php": "^13.0"
  }
}
```

### Step 2: Install Stripe SDK

Run in terminal:
```bash
cd /path/to/wp-content/plugins/booking-system
composer install
```

**Expected output:**
```
Installing dependencies from lock file
- Installing stripe/stripe-php (v13.x.x)
  ...
Generating autoload files
```

### Step 3: Verify Files Created

Check that these files exist:
- [ ] `admin/settings/stripe-settings.php`
- [ ] `includes/payment/class-stripe-config.php`
- [ ] `vendor/stripe/` directory (Stripe SDK)
- [ ] `composer.lock` file updated

### Step 4: Verify Admin Menu Registration

Check your admin class (e.g., `admin/class-booking-system-admin.php` or similar) to ensure the new settings page is registered:

```php
add_submenu_page(
    'booking-system',
    'Payment Settings',
    'Payment Settings',
    'manage_options',
    'booking-system-payments',
    array($this, 'render_payment_settings_page')
);
```

### Step 5: Include Stripe Config Class

Ensure `includes/payment/class-stripe-config.php` is included in your main plugin file:

```php
require_once plugin_dir_path(__FILE__) . 'includes/payment/class-stripe-config.php';
```

---

## 🧪 MANUAL TESTING CHECKLIST

### Test 1: Verify Stripe SDK Installation

```bash
# Check vendor directory exists
ls vendor/stripe/stripe-php/

# Should show Stripe library files
```

**Expected:** Stripe PHP library files present

---

### Test 2: Access Admin Settings Page

1. Log into WordPress Admin
2. Go to **Booking System → Payment Settings** (or similar menu)
3. **Expected:** Settings page loads without errors

---

### Test 3: Test Mode Toggle

1. On Payment Settings page
2. Check "Enable Test Mode" checkbox
3. **Expected:** Test API key fields become editable

---

### Test 4: Save Test API Keys

Use these **Stripe Test Keys** (or get real ones from Stripe):

**Test Publishable Key:**
```
pk_test_51234567890abcdef
```

**Test Secret Key:**
```
sk_test_51234567890abcdef
```

**Test Webhook Secret:**
```
whsec_1234567890abcdef
```

1. Enter the test keys above
2. Click "Save Settings"
3. **Expected:** "Settings saved successfully" message appears

---

### Test 5: Verify Keys Stored in Database

Run this SQL query:
```sql
SELECT option_name, option_value 
FROM wp_options 
WHERE option_name LIKE 'bookit_stripe%'
ORDER BY option_name;
```

**Expected result:**
```
bookit_stripe_test_mode = 1
bookit_stripe_test_publishable_key = pk_test_...
bookit_stripe_test_secret_key = sk_test_...
bookit_stripe_test_webhook_secret = whsec_...
```

---

### Test 6: Verify Live Mode Notice

1. On Payment Settings page
2. Find "Live Mode" section
3. **Expected:** 
   - Notice says "Live mode will be enabled in production release"
   - Live key fields are disabled/greyed out

---

### Test 7: Field Validation

1. Try to save with invalid key format (e.g., "invalid_key")
2. **Expected:** Validation error: "Invalid Stripe key format"

1. Try to save with test mode ON but empty keys
2. **Expected:** Validation error: "API keys required when test mode enabled"

---

### Test 8: Stripe SDK Initialization

Add this temporary test code to verify SDK works:

**Create:** `test-stripe-init.php` in plugin root (temporary):
```php
<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/includes/payment/class-stripe-config.php';

$stripe_config = new Booking_System_Stripe_Config();
$secret_key = $stripe_config->get_secret_key();

if ($secret_key) {
    \Stripe\Stripe::setApiKey($secret_key);
    
    try {
        // Test API connection
        $balance = \Stripe\Balance::retrieve();
        echo "✅ Stripe SDK initialized successfully!\n";
        echo "Available balance: " . $balance->available[0]->amount . " " . $balance->available[0]->currency . "\n";
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ No Stripe API key configured\n";
}
```

Run from terminal:
```bash
php test-stripe-init.php
```

**Expected:** Should connect to Stripe API successfully (or show specific error if keys are invalid)

**Delete this test file after verification**

---

## 🔍 TROUBLESHOOTING

### Issue 1: Composer Command Not Found
```
'composer' is not recognized as an internal or external command
```

**Solution:**
1. Download Composer from https://getcomposer.org/download/
2. Install globally for Windows
3. Restart terminal/command prompt

---

### Issue 2: Admin Page Not Appearing

**Check:**
1. Menu registration hooked correctly: `add_action('admin_menu', ...)`
2. Capability check: User has `manage_options` capability
3. No PHP errors: Check `wp-content/debug.log`

---

### Issue 3: Settings Not Saving

**Check:**
1. Nonce verification: `wp_nonce_field()` and `check_admin_referer()` present
2. Settings registered: `register_setting()` called
3. Form action points to `options.php`
4. Check PHP error log for sanitization callback errors

---

### Issue 4: Vendor Directory Not Created

**Solution:**
```bash
# Ensure composer.json is valid JSON
cat composer.json

# Delete composer.lock and try again
rm composer.lock
composer install
```

---

## ✅ TASK 2 ACCEPTANCE CRITERIA

Before marking complete, verify ALL items:

**Installation:**
- [ ] Stripe SDK installed via Composer (vendor/stripe/ exists)
- [ ] composer.lock file updated
- [ ] No Composer errors or warnings

**Admin Interface:**
- [ ] Payment Settings page accessible in admin menu
- [ ] Test mode toggle checkbox works
- [ ] Test API key fields (3 fields: publishable, secret, webhook)
- [ ] Live mode section shows "coming soon" notice
- [ ] Live key fields disabled/greyed out
- [ ] Save button works
- [ ] Success message appears on save

**Settings Storage:**
- [ ] Settings saved to wp_options table
- [ ] Test mode boolean stored correctly
- [ ] All three API keys stored
- [ ] Settings persist after page reload

**Configuration Class:**
- [ ] Stripe Config class created
- [ ] Get mode method works (returns 'test' or 'live')
- [ ] Get API keys methods work (returns correct keys)
- [ ] SDK initialization method works
- [ ] Proper error handling

**Validation:**
- [ ] Required field validation works
- [ ] Key format validation works (pk_test_, sk_test_, whsec_)
- [ ] Error messages display correctly
- [ ] Invalid data rejected

**Security:**
- [ ] WordPress Settings API used
- [ ] Nonce verification on form submission
- [ ] Capability check (manage_options)
- [ ] Input sanitization on all fields
- [ ] Keys not exposed in page source

**Code Quality:**
- [ ] WordPress Coding Standards followed
- [ ] All functions have docblocks
- [ ] No PHP warnings or notices
- [ ] Proper escaping in output

---

## 📊 REPORT YOUR PROGRESS

**Please confirm:**

1. **Composer Installation:** Did Stripe SDK install successfully? (Yes/No)

2. **Admin Page:** Can you access Payment Settings page? (Yes/No)

3. **Settings Save:** Did test keys save successfully? (Yes/No)

4. **Database Check:** Are keys stored in wp_options? (Yes/No)

5. **Any Issues?** (None if everything worked)

6. **Actual Time Spent:** ___ hours (estimated was 4h)

---

**Reply with:** 
- "All Task 2 tests passing ✅" (if everything works), OR
- Describe any issues you encountered

Once confirmed, we'll commit Task 2 and move to Task 3 (Stripe Checkout Session Creation).