Good progress! You're now on Step 5 ✅, but we have two issues to fix:

1. **Security check failed** - CSRF nonce issue
2. **Deposit amount = £0.00** - Service deposit not configured

Let me help you fix both and set up Stripe testing.

---

## 🔧 FIX 1: DEPOSIT AMOUNT = £0.00

The error "Deposit amount must be greater than zero" means your test service doesn't have deposit settings configured.

### CURSOR PROMPT: Fix Service Deposit Configuration

```
TASK: Add Default Deposit Configuration to Services

CONTEXT:
Sprint 2, Task 3 - Services in the database don't have deposit_type and deposit_amount fields set, causing £0.00 deposit calculation.

FIND: The service creation/setup code or database schema

UPDATE: Add default deposit values to existing services

OPTION 1: Update Existing Services in Database
Run this SQL in phpMyAdmin/Adminer:

```sql
-- Update all services to have 50% deposit by default
UPDATE wp_bookings_services 
SET deposit_type = 'percentage', 
    deposit_amount = 50 
WHERE deposit_type IS NULL OR deposit_type = '';
```

OPTION 2: Update Service Creation Code
Find where services are created and add default deposit settings:

```php
// When creating a service, include:
'deposit_type' => 'percentage',
'deposit_amount' => 50  // 50% deposit
```

OPTION 3: Check if columns exist
The deposit columns might not exist in your services table. Check with:

```sql
DESCRIBE wp_bookings_services;
```

If deposit_type and deposit_amount columns are missing, add them:

```sql
ALTER TABLE wp_bookings_services 
ADD COLUMN deposit_type VARCHAR(20) DEFAULT 'percentage' AFTER base_price,
ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 50.00 AFTER deposit_type;
```

SUCCESS CRITERIA:
- Services have deposit_type set ('percentage', 'fixed', or 'full')
- Services have deposit_amount set (e.g., 50 for 50%)
- Deposit calculation returns > £0.00

Please check the services table and add deposit configuration.
```

### Quick Manual Fix (Fastest)

**Open Adminer/phpMyAdmin:**

1. Go to `wp_bookings_services` table
2. Click "SQL" tab
3. Run this:

```sql
-- First check if columns exist
DESCRIBE wp_bookings_services;

-- If deposit columns DON'T exist, add them:
ALTER TABLE wp_bookings_services 
ADD COLUMN deposit_type VARCHAR(20) DEFAULT 'percentage' AFTER base_price,
ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 50.00 AFTER deposit_type;

-- Update existing services to have 50% deposit
UPDATE wp_bookings_services 
SET deposit_type = 'percentage', 
    deposit_amount = 50;

-- Verify
SELECT id, name, base_price, deposit_type, deposit_amount FROM wp_bookings_services;
```

**Expected result:** All services should now show `deposit_type = 'percentage'` and `deposit_amount = 50.00`

---

## 🔧 FIX 2: SECURITY CHECK FAILED (CSRF Nonce)

The issue is that Step 5 template doesn't include the CSRF nonce properly.

### Check Step 5 Template

Open `public/templates/booking-step-5-payment.php`

**Find this line:**
```php
<?php wp_nonce_field('bookit_booking_action', 'bookit_nonce'); ?>
```

**Make sure it's INSIDE the `<form>` tag, like this:**
```php
<form method="POST" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="bookit-payment-form">
    <?php wp_nonce_field('bookit_booking_action', 'bookit_nonce'); ?>
    <input type="hidden" name="action" value="bookit_process_payment">
    
    <!-- Rest of form -->
</form>
```

**If the nonce is missing or outside the form, that's the issue.**

---

## 🔵 STRIPE TEST ACCOUNT SETUP (5 minutes)

You need a FREE Stripe test account to get test API keys.

### Step 1: Create Stripe Account

1. Go to: **https://dashboard.stripe.com/register**
2. Enter your email
3. Create a password
4. Verify email
5. Fill in basic business info (can be fake for testing)
   - Business name: "Test Salon"
   - Country: United Kingdom
   - Type: Individual

### Step 2: Activate Test Mode

1. After login, you'll see the Stripe Dashboard
2. Look at the **top-left corner** - there's a toggle switch
3. Make sure it says **"Test mode"** (should be ON by default)
4. The toggle should look like: `🔴 Test mode`

### Step 3: Get Test API Keys

1. In Stripe Dashboard, click **"Developers"** in the left menu
2. Click **"API keys"**
3. You'll see your test keys (they start with `pk_test_` and `sk_test_`)

**Copy these two keys:**





⚠️ **IMPORTANT:** 
- Keep the Secret Key private (never commit to Git)
- The Publishable Key is safe to use in frontend code
- These are TEST keys - no real money involved

### Step 4: Get Webhook Secret

1. Still in **Developers** menu, click **"Webhooks"**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://yoursite.local/wp-json/bookit/v1/stripe/webhook`
   - (We'll use this in Task 4, but set it up now)
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Click on the webhook you just created
7. Click **"Reveal"** next to "Signing secret"
8. Copy the webhook secret (starts with `whsec_`)

**Webhook Secret:**
```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 5: Save Keys in WordPress

1. Go to **WordPress Admin → Booking System → Payment Settings**
2. Make sure **"Enable Test Mode"** is checked ✅
3. Paste your three keys:
   - Test Publishable Key: `pk_test_...`
   - Test Secret Key: `sk_test_...`
   - Test Webhook Secret: `whsec_...`
4. Click **"Save Settings"**

✅ **Stripe Test Account Setup Complete!**

---

## 🧪 TEST THE COMPLETE FLOW

After fixing the deposit and adding Stripe keys:

### Test 1: Verify Deposit Shows Correctly

1. Refresh Step 5 page (Ctrl+F5)
2. **Expected:**
   - Total: £25.00 (or whatever your service price is)
   - Deposit: £12.50 (50% of £25.00)
   - Balance: £12.50

### Test 2: Complete Stripe Payment

1. Click **"Complete Booking"**
2. **Expected:** Redirects to Stripe Checkout page
3. **Stripe Test Cards to use:**

**Successful Payment:**
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/28)
CVC: Any 3 digits (e.g., 123)
Postal code: Any (e.g., SW1A 1AA)
```

**Declined Payment (to test error handling):**
```
Card number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

4. Fill in the test card details
5. Click **"Pay"**
6. **Expected:** Redirects back to `/booking-confirmed?session_id=...`

---

## 📋 CHECKLIST

Before testing, verify:

- [ ] Service has deposit_type and deposit_amount set in database
- [ ] Deposit shows as £X.XX (not £0.00) on Step 5
- [ ] CSRF nonce inside `<form>` tag in Step 5 template
- [ ] Stripe test keys saved in WordPress admin
- [ ] Test mode enabled in WordPress settings
- [ ] No "Security check failed" error

---

## 🐛 TROUBLESHOOTING

### Issue: Still shows £0.00 deposit

**Check:**
```sql
SELECT id, name, base_price, deposit_type, deposit_amount 
FROM wp_bookings_services 
WHERE id = 1; -- Replace 1 with your service ID
```

**Should show:**
```
deposit_type = 'percentage'
deposit_amount = 50.00
```

### Issue: Security check still fails

**Check the form HTML source:**
1. Right-click on page → "View Page Source"
2. Search for `bookit_nonce`
3. Should see: `<input type="hidden" name="bookit_nonce" value="abc123...">`

If missing, the nonce isn't being generated.

### Issue: Can't redirect to Stripe

**Check debug.log for:**
- "Stripe API key not configured"
- "Invalid API key"
- "Unable to create checkout session"

**Solution:** Verify keys are saved correctly in WordPress options table:
```sql
SELECT option_name, option_value 
FROM wp_options 
WHERE option_name LIKE 'bookit_stripe%';
```

---

## 🎯 REPLY WITH

**After fixing the deposit and setting up Stripe:**

1. **Deposit amount:** Now shows £_____ (not £0.00)
2. **Security check:** Fixed? (Yes/No)
3. **Stripe keys:** Saved in WordPress? (Yes/No)
4. **Redirect to Stripe:** Working? (Yes/No)

**Or if you encounter issues:**
- Paste the error message from debug.log
- Screenshot of the payment summary showing amounts

Once the deposit shows correctly and you can redirect to Stripe, Task 3 will be complete! 🎉