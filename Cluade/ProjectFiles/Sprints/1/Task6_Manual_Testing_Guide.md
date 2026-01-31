# Task 6: Contact Form - Manual Testing Guide

## 🎯 TESTING OBJECTIVE
Verify the contact form (Step 4) works correctly with validation, UK phone formatting, email typo detection, and session persistence.

---

## 🔧 PREREQUISITES

Before you start testing:

### 1. Ensure Previous Steps Work
```
✓ Step 1: Service selection works
✓ Step 2: Staff selection works  
✓ Step 3: Date/time selection works
✓ Session is being maintained
```

### 2. Have Test Data Ready
```
Valid UK Mobile: 07700 900123
Valid UK Landline: 020 1234 5678
Invalid Phone: 1234567890
Valid Email: test@example.com
Invalid Email: test@gmial.com (typo)
```

### 3. Open Browser DevTools
- Press **F12** (or right-click → Inspect)
- Keep **Console** tab open (watch for JavaScript errors)
- Keep **Network** tab open (watch for API calls)

---

## 📋 TEST SUITE

### TEST 1: Form Loads Correctly

**Steps:**
1. Navigate to your booking page
2. Complete Steps 1-3 (service, staff, date/time)
3. You should automatically be on Step 4

**Expected Result:**
```
✓ Form displays with all 6 fields
✓ All required fields marked with asterisk (*)
✓ "First Name" field is focused (cursor in field)
✓ Character counter shows "500 characters remaining"
✓ Marketing consent checkbox is UNCHECKED
✓ "Continue" button is enabled
✓ "Back to Date/Time" button visible
```

**Fail Conditions:**
- ❌ Form doesn't display → Check console for JavaScript errors
- ❌ Fields missing → Check template file loaded correctly
- ❌ Consent checkbox pre-checked → GDPR violation!

---

### TEST 2: Required Field Validation

**Steps:**
1. Click in "First Name" field
2. Click out WITHOUT typing anything (blur event)
3. Repeat for Last Name, Email, Phone

**Expected Result for Each Field:**
```
✓ Red error message appears below field
✓ Field border turns red
✓ Error message text:
  - First Name: "This field is required"
  - Last Name: "This field is required"
  - Email: "Email address is required"
  - Phone: "Phone number is required"
```

**How to Check:**
- Look below each field for red text
- Field should have red border
- Error should appear ONLY after you leave the field (not while typing)

---

### TEST 3: Name Validation Rules

**Test 3a: Too Short**
```
Input: "A"
Action: Click out of field
Expected: "Please enter at least 2 characters"
```

**Test 3b: Valid Name**
```
Input: "John"
Action: Click out of field
Expected: ✓ No error, red border disappears
```

**Test 3c: Very Long Name (edge case)**
```
Input: 101 characters (e.g., "AAAAAA..." × 101)
Action: Click out of field
Expected: "Maximum 100 characters"
```

---

### TEST 4: Email Validation

**Test 4a: Empty Email**
```
Input: [leave empty]
Action: Click out
Expected: "Email address is required"
```

**Test 4b: Invalid Format**
```
Input: "notanemail"
Action: Click out
Expected: "Please enter a valid email address"
```

**Test 4c: Common Typo Detection (IMPORTANT!)**
```
Input: "john@gmial.com"
Action: Click out
Expected: "Did you mean john@gmail.com?"

Other typos to test:
- "test@gmai.com" → suggests "gmail.com"
- "user@yahooo.com" → suggests "yahoo.com"
- "me@hotmial.com" → suggests "hotmail.com"
```

**Test 4d: Valid Email**
```
Input: "john@gmail.com"
Action: Click out
Expected: ✓ No error
```

---

### TEST 5: UK Phone Validation & Auto-Formatting

**Test 5a: Auto-Formatting (Mobile)**
```
Input: Type "07700900123" (no spaces)
Expected: As you type, it formats to "07700 900123"
```

**Test 5b: Auto-Formatting (Landline - London)**
```
Input: Type "02012345678"
Expected: Formats to "020 1234 5678"
```

**Test 5c: Auto-Formatting (Landline - Other)**
```
Input: Type "01234567890"
Expected: Formats to "01234 567890"
```

**Test 5d: Invalid Phone Number**
```
Input: "1234567890" (doesn't start with 07/01/02/03)
Action: Click out
Expected: "Please enter a valid UK phone number (e.g., 07700 900123)"
```

**Test 5e: Too Short**
```
Input: "07700"
Action: Click out
Expected: "Please enter a valid UK phone number"
```

**Test 5f: Valid Mobile**
```
Input: "07700900123"
Expected: ✓ Formats to "07700 900123", no error
```

---

### TEST 6: Special Requests (Optional Field)

**Test 6a: Empty is OK**
```
Input: [leave empty]
Action: Click out
Expected: ✓ No error (field is optional)
```

**Test 6b: Character Counter**
```
Action: Start typing in field
Expected: 
- Counter updates live: "495 characters remaining"
- Counter turns RED when <50 remaining
```

**Test 6c: Maximum Length**
```
Action: Try typing 501 characters
Expected: Field stops accepting input at 500 characters
```

**Test 6d: Normal Input**
```
Input: "I have allergies to X, Y, Z"
Expected: ✓ No error, counter shows remaining characters
```

---

### TEST 7: Marketing Consent Checkbox

**Test 7a: Default State**
```
Expected: ✓ Checkbox is UNCHECKED by default
```
*This is CRITICAL for GDPR compliance!*

**Test 7b: Check and Uncheck**
```
Action: Click checkbox
Expected: ✓ Checkbox becomes checked

Action: Click again
Expected: ✓ Checkbox becomes unchecked
```

**Test 7c: Privacy Policy Link**
```
Action: Click "Privacy Policy" link
Expected: ✓ Opens Privacy Policy page in new tab
```

---

### TEST 8: Form Submission - Success Path

**Steps:**
1. Fill out ALL required fields with valid data:
   - First Name: `John`
   - Last Name: `Smith`
   - Email: `john@example.com`
   - Phone: `07700 900123`
   - Special Requests: `I prefer morning appointments`
   - Marketing Consent: ✓ Checked

2. Click "Continue →" button

**Expected Result:**
```
✓ Button text changes to "Saving..."
✓ Button becomes disabled (can't click again)
✓ Network tab shows POST to: /wp-json/bookit/v1/contact/save
✓ Response status: 200 OK
✓ Alert appears: "Contact details saved! Payment integration coming in Sprint 2."
✓ Button text returns to "Continue →"
```

**How to Verify in DevTools:**
1. **Network Tab:**
   - Look for request to `/wp-json/bookit/v1/contact/save`
   - Click on it
   - Check **Response** tab:
     ```json
     {
       "success": true,
       "message": "Contact details saved",
       "next_step": 5
     }
     ```

2. **Console Tab:**
   - Should show: `Contact details saved successfully`
   - NO red errors

---

### TEST 9: Form Submission - Validation Errors

**Steps:**
1. Leave First Name empty
2. Enter invalid email: `test@gmial.com`
3. Enter invalid phone: `1234567890`
4. Click "Continue →"

**Expected Result:**
```
✓ NO alert appears (form doesn't submit)
✓ Multiple error messages show:
  - First Name: "This field is required"
  - Email: "Did you mean test@gmail.com?"
  - Phone: "Please enter a valid UK phone number"
✓ Page scrolls to first error field
✓ First error field receives focus
```

---

### TEST 10: Server-Side Validation

**Purpose:** Verify backend validates even if frontend is bypassed

**Steps:**
1. Open Browser Console
2. Run this command (bypasses frontend validation):
```javascript
fetch('/wp-json/bookit/v1/contact/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: '',
    last_name: 'Smith',
    email: 'invalid',
    phone: '123',
    special_requests: '',
    marketing_consent: false
  })
}).then(r => r.json()).then(console.log);
```

**Expected Result:**
```json
{
  "success": false,
  "errors": {
    "first_name": "First name is required",
    "email": "Please enter a valid email address",
    "phone": "Please enter a valid UK phone number"
  }
}
```

**Status Code:** 400 Bad Request

---

### TEST 11: Session Persistence (Back Navigation)

**Steps:**
1. Fill out the form:
   - First Name: `Jane`
   - Last Name: `Doe`
   - Email: `jane@example.com`
   - Phone: `07700 900456`
   - Special Requests: `Test message`

2. Click "← Back to Date/Time"

3. Select a different time slot

4. Navigate forward to Step 4

**Expected Result:**
```
✓ Form still has your previous data:
  - First Name: "Jane"
  - Last Name: "Doe"
  - Email: "jane@example.com"
  - Phone: "07700 900456"
  - Special Requests: "Test message"
```

**If data is lost:**
- Check session storage code
- Verify session is being updated correctly
- Check browser console for errors

---

### TEST 12: Database/Session Verification

**After successful form submission, check the database:**

**Query:**
```sql
SELECT 
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    customer_special_requests,
    marketing_consent,
    consent_date
FROM wp_bookings_sessions
WHERE session_id = '[your_session_id]'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Result:**
```
customer_first_name: "John"
customer_last_name: "Smith"
customer_email: "john@example.com"
customer_phone: "07700900123" (no spaces - cleaned)
customer_special_requests: "I prefer morning appointments"
marketing_consent: 1 (if checked) or 0 (if unchecked)
consent_date: "2026-01-30 14:23:45" (if consent was given)
```

**Important:** Phone should be stored WITHOUT spaces in database.

---

### TEST 13: Accessibility Testing

**Test 13a: Keyboard Navigation**
```
Steps:
1. Click in browser address bar
2. Press TAB repeatedly

Expected Tab Order:
1. First Name field
2. Last Name field
3. Email field
4. Phone field
5. Special Requests field
6. Marketing consent checkbox
7. Privacy Policy link
8. Terms & Conditions link
9. Back button
10. Continue button

✓ Each element shows visible focus indicator (blue outline)
✓ No elements are skipped
✓ Can type in fields without using mouse
```

**Test 13b: Error Announcement**
```
Steps:
1. Leave First Name empty
2. Tab out

Expected:
✓ Screen reader announces: "First name: This field is required"
✓ Field has aria-invalid="true"
```

**Test 13c: Run aXe Scan**
```
Steps:
1. Install aXe DevTools extension (Chrome/Firefox)
2. Open DevTools → aXe tab
3. Click "Scan ALL of my page"

Expected:
✓ 0 Critical issues
✓ 0 Serious issues
✓ Moderate issues acceptable (document as needed)
```

---

### TEST 14: Mobile Responsive Testing

**Test 14a: Narrow Screen (375px - iPhone)**
```
Steps:
1. Open DevTools (F12)
2. Click device toolbar icon (mobile view)
3. Select "iPhone SE" or set width to 375px

Expected:
✓ Form fields stack vertically
✓ Buttons stack vertically (Back on top, Continue below)
✓ All text readable (no tiny fonts)
✓ No horizontal scrolling
✓ Fields are easy to tap (min 44px height)
```

**Test 14b: Tablet (768px - iPad)**
```
Expected:
✓ Form remains single column
✓ Max width around 600px (centered)
✓ Comfortable spacing
```

---

### TEST 15: Error Recovery

**Test 15a: Network Failure**
```
Steps:
1. Fill form correctly
2. Open DevTools → Network tab
3. Check "Offline" checkbox (simulates no internet)
4. Click "Continue"

Expected:
✓ Alert: "Unable to save your details. Please try again."
✓ Button re-enables
✓ Form data still present (not lost)
```

**Test 15b: Server Error (500)**
```
To simulate:
- Temporarily break the API endpoint
- Submit form

Expected:
✓ Error message displayed
✓ Form doesn't clear
✓ User can try again
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Phone Auto-Formatting Not Working
**Symptom:** Typing `07700900123` doesn't add spaces

**Debug:**
1. Check Console for JavaScript errors
2. Verify `contact-form.js` is loaded:
   ```javascript
   // In Console:
   typeof BookitContactForm
   // Should return: "function"
   ```

**Fix:** Check file is enqueued in plugin

---

### Issue 2: Form Submits But No Alert
**Symptom:** Click Continue, nothing happens

**Debug:**
1. Check Network tab for API response
2. Look for status code and response body
3. Check Console for errors

**Common Causes:**
- AJAX URL wrong
- CORS issue
- PHP error in API endpoint

---

### Issue 3: Session Data Not Persisting
**Symptom:** Go back to Step 3, return to Step 4, form is empty

**Debug:**
```sql
-- Check session table
SELECT * FROM wp_bookings_sessions 
ORDER BY updated_at DESC 
LIMIT 5;
```

**Verify:**
- Session ID exists
- customer_* fields populated
- updated_at timestamp recent

---

### Issue 4: Validation Runs But Errors Don't Show
**Symptom:** Field turns red but no error message

**Debug:**
```javascript
// In Console:
document.getElementById('first-name-error').textContent
// Should show error text, not empty
```

**Check:**
- Error span elements present in HTML
- IDs match between input and error span
- JavaScript correctly targeting error elements

---

## ✅ TESTING CHECKLIST

Print this checklist and check off as you test:

### Basic Functionality
- [ ] Form loads with all 6 fields
- [ ] Required fields show asterisk (*)
- [ ] Marketing consent unchecked by default

### Validation
- [ ] Required field validation works (all 4 fields)
- [ ] Name validation (min 2 chars, max 100)
- [ ] Email format validation
- [ ] Email typo detection (gmial → gmail)
- [ ] UK phone validation (07/01/02/03)
- [ ] Special requests max 500 characters

### Auto-Formatting
- [ ] Phone auto-formats: 07700900123 → 07700 900123
- [ ] Character counter updates live
- [ ] Character counter turns red <50

### Form Submission
- [ ] Valid data submits successfully
- [ ] Invalid data shows errors (doesn't submit)
- [ ] Button shows "Saving..." during submit
- [ ] Alert shows on success
- [ ] Network request to API succeeds (200 OK)

### Session Persistence
- [ ] Data saved to session (check database)
- [ ] Phone stored without spaces
- [ ] Marketing consent stored correctly
- [ ] Back navigation preserves data

### Accessibility
- [ ] Keyboard navigation works (Tab order)
- [ ] Focus indicators visible
- [ ] Error messages have role="alert"
- [ ] aXe scan: 0 critical issues

### Responsive
- [ ] Mobile (375px): Fields stack, no scroll
- [ ] Tablet (768px): Looks good
- [ ] Desktop (1200px+): Max width applied

### Links
- [ ] Privacy Policy link works
- [ ] Terms & Conditions link works
- [ ] Links open in new tab

---

## 🎯 SUCCESS CRITERIA

**Pass Criteria:**
- ✅ All 15 tests pass
- ✅ aXe scan shows 0 critical issues
- ✅ Data successfully saves to session
- ✅ Phone number stored without spaces
- ✅ Marketing consent works correctly (GDPR)
- ✅ Works on mobile (375px) and desktop

**When to Mark Task 6 Complete:**
- All items in checklist ✓
- No critical bugs found
- Session persistence verified
- Ready for payment integration (Sprint 2)

---

## 📞 QUICK TEST (5 Minutes)

**Don't have time for full testing? Do this minimal test:**

1. **Happy Path (2 min):**
   - Fill all fields correctly
   - Submit form
   - Verify alert shows
   - Check session in database

2. **Validation (2 min):**
   - Try submitting empty form
   - Verify errors show
   - Fill correctly, verify errors clear

3. **UK Phone (1 min):**
   - Type: `07700900123`
   - Verify formats to: `07700 900123`
   - Verify invalid number rejected

If these 3 tests pass, you're 80% good. Do full testing when time permits!

---

## 🚀 READY TO TEST

Start with **TEST 1** and work through sequentially. Most important tests:
1. Test 8 (Success Path)
2. Test 5 (Phone Validation)
3. Test 4c (Email Typo Detection)
4. Test 11 (Session Persistence)

Good luck testing! 🎉
