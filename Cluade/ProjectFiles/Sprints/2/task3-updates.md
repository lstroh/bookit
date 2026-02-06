Let me check what the Cursor prompt included. Looking back at the prompt I gave you:

---

## 🔍 WHAT THE CURSOR PROMPT INCLUDED

The prompt I gave you was:

```
TASK: Update Stripe Checkout to Use 'price' Column (NOT base_price)
...
EXAMPLE UPDATED calculate_deposit() method:
```php
public function calculate_deposit($service) {
    $price = floatval($service['price']); // Changed from base_price
    $deposit_type = $service['deposit_type'] ?? 'percentage';
    
    switch ($deposit_type) {
        case 'percentage':
            $percentage = floatval($service['deposit_amount'] ?? 100);
            return ($price * $percentage) / 100;
        
        case 'fixed':
            $fixed = floatval($service['deposit_amount']);
            return min($fixed, $price);
        
        default:
            // Fallback to full payment if deposit_type is NULL or invalid
            return $price;
    }
}
```
```

---

## ❌ NO - EDGE CASES NOT INCLUDED

The Cursor prompt did **NOT** include the full edge case handling I mentioned later (price validation, percentage clamping, NULL checks).

---

## 🔧 ADD EDGE CASE HANDLING NOW

### CURSOR PROMPT: Add Edge Case Handling to calculate_deposit()

Copy this into **Cursor Composer**:

```
TASK: Add Edge Case Handling to calculate_deposit() Method

CONTEXT:
Sprint 2, Task 3 - The calculate_deposit() method needs better validation and edge case handling.

FIND FILE: includes/payment/class-stripe-checkout.php

FIND METHOD: calculate_deposit()

REPLACE ENTIRE METHOD WITH:
```php
/**
 * Calculate deposit amount based on service settings
 * 
 * @param array $service Service data from database
 * @return float|WP_Error Deposit amount in pounds or error
 */
public function calculate_deposit($service) {
    // Validate service price
    $price = floatval($service['price'] ?? 0);
    
    if ($price <= 0) {
        return new WP_Error('invalid_price', 'Service price must be greater than zero');
    }
    
    $deposit_type = $service['deposit_type'] ?? null;
    $deposit_amount = $service['deposit_amount'] ?? null;
    
    // If no deposit configuration, default to full payment
    if (empty($deposit_type) || is_null($deposit_amount)) {
        return $price;
    }
    
    switch ($deposit_type) {
        case 'percentage':
            $percentage = floatval($deposit_amount);
            
            // Validate percentage range (0-100)
            if ($percentage < 0 || $percentage > 100) {
                error_log("Invalid deposit percentage: {$percentage}. Using 100%.");
                $percentage = 100;
            }
            
            $deposit = ($price * $percentage) / 100;
            
            // Round to 2 decimal places
            return round($deposit, 2);
        
        case 'fixed':
            $fixed = floatval($deposit_amount);
            
            // Validate fixed amount is positive
            if ($fixed < 0) {
                error_log("Invalid fixed deposit: {$fixed}. Using full price.");
                return $price;
            }
            
            // Don't exceed service price
            $deposit = min($fixed, $price);
            
            // Round to 2 decimal places
            return round($deposit, 2);
        
        default:
            // Unknown deposit type - log and use full payment
            error_log("Unknown deposit type: {$deposit_type}. Using full payment.");
            return $price;
    }
}
```

EDGE CASES HANDLED:
1. Zero or negative service price → Return WP_Error
2. NULL deposit_type or deposit_amount → Default to full payment
3. Percentage < 0 or > 100 → Clamp to 100% and log warning
4. Negative fixed deposit → Use full payment and log warning
5. Fixed deposit > service price → Use service price (don't overcharge)
6. Unknown deposit_type → Default to full payment and log
7. Decimal rounding → Always round to 2 decimal places (pence)

SUCCESS CRITERIA:
- Method handles all edge cases gracefully
- Never returns invalid amounts (negative, zero, or excessive)
- Logs warnings for invalid configurations
- Returns WP_Error for critical failures only
- All amounts rounded to 2 decimal places

Please update the calculate_deposit() method with full edge case handling.
```

---

## 🧪 VERIFY EDGE CASES WORK

After Cursor updates the code, let's test the edge cases:

### Test 1: Normal 100% Payment
```sql
UPDATE wp_bookings_services SET deposit_type = 'percentage', deposit_amount = 100 WHERE id = 1;
```
**Expected:** Deposit = £50.00 (full price)

### Test 2: Invalid Percentage (150%)
```sql
UPDATE wp_bookings_services SET deposit_type = 'percentage', deposit_amount = 150 WHERE id = 1;
```
**Expected:** Deposit = £50.00 (clamped to 100%), warning in debug.log

### Test 3: Negative Percentage
```sql
UPDATE wp_bookings_services SET deposit_type = 'percentage', deposit_amount = -50 WHERE id = 1;
```
**Expected:** Deposit = £50.00 (clamped to 100%), warning in debug.log

### Test 4: NULL Deposit Settings
```sql
UPDATE wp_bookings_services SET deposit_type = NULL, deposit_amount = NULL WHERE id = 1;
```
**Expected:** Deposit = £50.00 (defaults to full payment)

### Test 5: Fixed Deposit Exceeds Price
```sql
UPDATE wp_bookings_services SET deposit_type = 'fixed', deposit_amount = 100 WHERE id = 1;
-- Service price is £50, fixed deposit is £100
```
**Expected:** Deposit = £50.00 (clamped to service price, doesn't overcharge)

---

## ✅ AFTER UPDATING

### Step 1: Verify Code Updated

Check `includes/payment/class-stripe-checkout.php` and confirm:
- [ ] Method has validation for `$price <= 0`
- [ ] Method handles NULL `deposit_type` and `deposit_amount`
- [ ] Method clamps percentage to 0-100 range
- [ ] Method doesn't allow fixed deposit > service price
- [ ] Method uses `round($deposit, 2)` for amounts
- [ ] Method logs warnings with `error_log()`

### Step 2: Test Normal Flow

1. Set service to 100%:
   ```sql
   UPDATE wp_bookings_services SET deposit_type = 'percentage', deposit_amount = 100 WHERE id = 1;
   ```

2. Go through booking flow to Step 5

3. **Expected display:**
   - Total: £50.00
   - Deposit: £50.00
   - Balance: £0.00

### Step 3: Check Debug Log

After testing, check `wp-content/debug.log` to ensure no unexpected errors (only warnings for invalid configurations).

---

## 🎯 SUMMARY

**Original Cursor prompt:** ❌ Basic implementation only  
**New Cursor prompt:** ✅ Full edge case handling  

**What's now handled:**
- ✅ Invalid prices (zero/negative)
- ✅ NULL deposit configurations
- ✅ Invalid percentages (< 0 or > 100)
- ✅ Negative fixed deposits
- ✅ Fixed deposits exceeding service price
- ✅ Unknown deposit types
- ✅ Decimal rounding to 2 places

---

**Reply with:**
- "Edge cases added ✅" (after running the new Cursor prompt)
- Then test the flow and confirm deposit shows correctly

Once this is done, we're ready for Stripe testing! 🚀