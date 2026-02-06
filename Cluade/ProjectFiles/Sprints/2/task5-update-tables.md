Perfect! ✅ Your table structure looks correct now. All the columns we need are present.

---

## ✅ TABLE VERIFICATION

**Required columns - ALL PRESENT:**
- ✅ `payment_intent_id` (VARCHAR 255)
- ✅ `stripe_session_id` (VARCHAR 255)
- ✅ `deposit_paid` (DECIMAL 10,2) - Fixed!
- ✅ `balance_due` (DECIMAL 10,2) - Added!
- ✅ `special_requests` (TEXT) - Renamed!

**Your table is now correct for Sprint 2!** 🎉

---

## 📝 CURSOR PROMPT: UPDATE CODE TO MATCH TABLE

However, I notice you still have `deposit_amount` column in your table. The code might reference this. Let me give you a comprehensive prompt to align everything:

Copy this into **Cursor Composer**:

```
TASK: Align All Code with Actual Database Schema (Sprint 2, Task 5)

CONTEXT:
The database table wp_bookings has been updated with the correct columns. Need to ensure all code references match the actual table structure.

VERIFIED TABLE COLUMNS (wp_bookings):
- payment_intent_id (VARCHAR 255) ✓
- stripe_session_id (VARCHAR 255) ✓
- deposit_paid (DECIMAL 10,2) ✓
- balance_due (DECIMAL 10,2) ✓
- special_requests (TEXT) ✓
- deposit_amount (DECIMAL 10,2) - exists but for service config, not booking payment
- duration (INT) - service duration in minutes

SEARCH AND UPDATE ALL FILES:

1. BOOKING CREATOR (includes/booking/class-booking-creator.php)

VERIFY these field names in INSERT statement:
```php
$booking_data = array(
    // ... other fields
    'deposit_paid' => $data['amount_paid'],  // Should be DECIMAL amount
    'balance_due' => max(0, $service['price'] - $data['amount_paid']),
    'payment_intent_id' => $data['payment_intent_id'] ?? null,
    'stripe_session_id' => $data['stripe_session_id'] ?? null,
    'special_requests' => $data['special_requests'] ?? '',
    // NOT 'customer_notes'
);
```

Format specifiers should be:
```php
'%f', // deposit_paid (DECIMAL)
'%f', // balance_due (DECIMAL)
'%s', // payment_intent_id
'%s', // stripe_session_id
'%s', // special_requests
```

2. BOOKING RETRIEVER (includes/booking/class-booking-retriever.php)

VERIFY SELECT statement includes:
```php
"SELECT 
    b.deposit_paid,      -- DECIMAL amount, not boolean
    b.balance_due,       -- DECIMAL amount
    b.payment_intent_id,
    b.stripe_session_id,
    b.special_requests,  -- NOT customer_notes
    -- ... other fields
FROM {$wpdb->prefix}bookings b
-- ... joins
"
```

3. EMAIL SENDER (includes/email/class-email-sender.php)

VERIFY email templates use:
```php
$booking['deposit_paid']      // DECIMAL amount
$booking['balance_due']       // DECIMAL amount
$booking['special_requests']  // NOT customer_notes
```

Display with proper formatting:
```php
£<?php echo number_format($booking['deposit_paid'], 2); ?>
£<?php echo number_format($booking['balance_due'], 2); ?>
```

4. CONFIRMATION PAGE (public/templates/booking-confirmed.php)

VERIFY uses:
```php
$booking['special_requests']  // NOT customer_notes
$booking['deposit_paid']      // DECIMAL
$booking['balance_due']       // DECIMAL
```

5. STRIPE WEBHOOK (includes/api/class-stripe-webhook.php)

VERIFY metadata mapping:
```php
'special_requests' => $metadata['special_requests'] ?? '',  // NOT customer_notes
```

6. PAYMENT PROCESSOR (includes/payment/class-payment-processor.php)

VERIFY session data uses:
```php
'customer_special_requests' => // Maps to 'special_requests' in booking
```

CRITICAL CHECKS:

✓ NO references to 'customer_notes' (renamed to 'special_requests')
✓ deposit_paid is DECIMAL amount (50.00), not boolean (0/1)
✓ balance_due is DECIMAL amount
✓ payment_intent_id exists in all INSERT/SELECT
✓ stripe_session_id exists in all INSERT/SELECT
✓ Format specifiers match column types (%f for DECIMAL, %s for VARCHAR)

SEARCH FOR POTENTIAL ISSUES:

Find and fix any:
- 'customer_notes' → should be 'special_requests'
- deposit_paid as boolean → should be decimal amount
- Missing payment_intent_id in queries
- Missing balance_due in calculations

DO NOT CHANGE:
- deposit_amount (this is in services table for config, not bookings table)
- duration (this is correct as INT)

SUCCESS CRITERIA:
- All code references match actual table columns
- No 'customer_notes' references remain
- deposit_paid treated as DECIMAL everywhere
- All payment fields included in queries
- Tests still pass after changes

Please search all files and update any mismatched column references.
```

---

## 🧪 AFTER CURSOR UPDATES CODE

### Step 1: Run All Tests

```bash
# Run all Sprint 2 tests to verify nothing broke
vendor/bin/phpunit tests/test-stripe-checkout.php
vendor/bin/phpunit tests/test-stripe-webhook.php
vendor/bin/phpunit tests/test-payment-success.php
```

**Expected:** All tests still passing ✅

### Step 2: Insert Test Booking

Now insert a test booking with your correct schema:

```sql
-- Insert test customer (or use existing)
INSERT INTO wp_bookings_customers (first_name, last_name, email, phone, created_at, updated_at)
VALUES ('John', 'Smith', 'john@example.com', '07700900123', NOW(), NOW())
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

SET @customer_id = LAST_INSERT_ID();

-- Insert test booking
INSERT INTO wp_bookings (
    customer_id,
    service_id,
    staff_id,
    booking_date,
    start_time,
    end_time,
    duration,
    status,
    total_price,
    deposit_paid,
    balance_due,
    payment_method,
    payment_intent_id,
    stripe_session_id,
    special_requests,
    created_at,
    updated_at
)
VALUES (
    @customer_id,
    1,  -- Use your actual service_id
    2,  -- Use your actual staff_id
    '2026-02-20',
    '14:00:00',
    '15:00:00',
    60,
    'confirmed',
    50.00,
    50.00,  -- DECIMAL amount (full payment)
    0.00,   -- DECIMAL amount (no balance)
    'stripe',
    'pi_test_123456789',
    'cs_test_VIEW_PAGE',
    'Please use organic products if possible',
    NOW(),
    NOW()
);

-- Verify it was created
SELECT id, customer_id, total_price, deposit_paid, balance_due, payment_intent_id, stripe_session_id, special_requests
FROM wp_bookings 
WHERE stripe_session_id = 'cs_test_VIEW_PAGE';
```

### Step 3: Test Confirmation Page

Visit:
```
http://yoursite.local/booking-confirmed?session_id=cs_test_VIEW_PAGE
```

**Expected:** Should display the booking confirmation page with all details! 🎉

---

## 🎯 KEY DIFFERENCES TO NOTE

Your schema has some additional columns that we don't use yet but are fine to keep:

**Extra columns (OK to keep for future):**
- `full_amount_paid` (tinyint) - boolean flag, currently unused
- `staff_notes` - for staff-only notes (not customer notes)
- `cancellation_reason` - for cancellation tracking
- `google_calendar_event_id` - for Phase 2 calendar sync
- `deleted_at` - soft delete timestamp

These don't interfere with current functionality.

---

## 📋 VERIFICATION CHECKLIST

After running the Cursor prompt:

- [ ] All tests still passing
- [ ] No 'customer_notes' references in code
- [ ] deposit_paid used as DECIMAL (not boolean)
- [ ] balance_due calculated and stored correctly
- [ ] payment_intent_id in all relevant queries
- [ ] Test booking inserted successfully
- [ ] Confirmation page displays correctly

---

**Reply with:**
- "Code updated ✅, tests passing ✅, page displays correctly ✅"

Then we'll commit Task 5! 🚀