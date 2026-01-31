# 🧪 MANUAL TESTING GUIDE: Task 3 Staff Selection

Excellent question! Here's a comprehensive manual testing checklist before writing unit tests.

---

## 🎯 PHASE 1: SETUP TEST DATA (5-10 minutes)

Before you can test staff selection, you need test data in your database.

### Method 1: Quick SQL Insert (Fastest)

**Copy and run this in your database** (Adminer or WP-CLI):

```sql
-- 1. Insert test services (if you don't have them from Task 2)
INSERT INTO wp_bookings_services (name, description, duration, price, is_active) VALUES
('Women\'s Haircut', 'Professional haircut and styling', 45, 35.00, 1),
('Men\'s Haircut', 'Classic men\'s cut', 30, 25.00, 1),
('Hair Coloring', 'Full color treatment', 90, 85.00, 1);

-- 2. Insert test staff members
INSERT INTO wp_bookings_staff (email, password_hash, first_name, last_name, phone, photo_url, bio, title, role, is_active) VALUES
('emma@salon.test', '$2y$10$example', 'Emma', 'Thompson', '07700900123', NULL, '10+ years experience in balayage and modern cuts', 'Senior Stylist', 'staff', 1),
('sarah@salon.test', '$2y$10$example', 'Sarah', 'Jones', '07700900124', NULL, 'Specialist in color treatments', 'Colorist', 'staff', 1),
('lisa@salon.test', '$2y$10$example', 'Lisa', 'Smith', '07700900125', NULL, 'Currently training, great for simple cuts', 'Junior Stylist', 'staff', 1),
('mark@salon.test', '$2y$10$example', 'Mark', 'Wilson', '07700900126', NULL, 'Men\'s grooming expert', 'Barber', 'staff', 1);

-- 3. Get the service IDs (note these down)
SELECT id, name FROM wp_bookings_services;

id	name
1	Women's Haircut
2	Women's Haircut
3	Men's Haircut
4	Hair Coloring


-- 4. Get the staff IDs (note these down)
SELECT id, first_name, last_name FROM wp_bookings_staff;
id	first_name	last_name
1	Test	Admin
2	Emma	Thompson
3	Emma	Thompson
4	Sarah	Jones
5	Lisa	Smith
6	Mark	Wilson
-- 5. Assign staff to services with custom pricing
-- Replace the IDs below with your actual IDs from steps 3 and 4

-- Emma (Senior) offers Women's Haircut at £45 (higher than base £35)
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) VALUES
(1, 1, 45.00);

-- Sarah (Mid-level) offers Women's Haircut at base price (NULL = use service price)
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) VALUES
(2, 1, NULL);

-- Lisa (Junior) offers Women's Haircut at £30 (lower than base £35)
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) VALUES
(3, 1, 30.00);

-- Mark offers Men's Haircut at base price
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) VALUES
(4, 2, NULL);

-- Sarah offers Hair Coloring at premium price
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) VALUES
(2, 3, 95.00);
```

### Method 2: Via WordPress Admin (Slower but more realistic)

If you have an admin interface built, use it to:
1. Create 3-4 staff members
2. Create 2-3 services
3. Assign staff to services

---

## 🧪 PHASE 2: FUNCTIONAL TESTING (20 minutes)

### Test 1: Basic Staff Display

**Steps:**
1. Visit your booking page: `http://bookit-booking-system.local/book-appointment/`
2. **Step 1:** Select "Women's Haircut"
3. **Step 2 should load** automatically

**✅ Expected Results:**
- Page transitions to Step 2
- Heading shows: "Select Staff Member"
- Subheading shows: "Who would you like for your Women's Haircut?"
- Staff cards display in a grid
- Staff are sorted alphabetically: Emma, Lisa, Sarah (by first name)
- "No Preference" card appears **last**

**❌ If it fails:**
- Check browser console for JavaScript errors (F12)
- Check Network tab - is the page loading?
- Check if `booking-step-2-staff.php` file exists

---

### Test 2: Staff Card Content

**For EACH staff card, verify it shows:**

**Emma's Card:**
- ✅ Photo OR colored initials "ET" 
- ✅ Name: "Emma Thompson"
- ✅ Title: "Senior Stylist"
- ✅ Price: "£45.00" (custom price, not base £35)
- ✅ Bio: "10+ years experience..."
- ✅ Button: "Select Emma →"

**Sarah's Card:**
- ✅ Initials "SJ" (different color than Emma)
- ✅ Name: "Sarah Jones"
- ✅ Title: "Colorist"
- ✅ Price: "£35.00" (base price because custom_price is NULL)
- ✅ Bio: "Specialist in color..."

**Lisa's Card:**
- ✅ Initials "LS"
- ✅ Price: "£30.00" (custom price, lower than base)

**"No Preference" Card:**
- ✅ Icon (not photo/initials)
- ✅ Title: "No Preference"
- ✅ Subtitle: "First Available"
- ✅ Price: "from £30.00" (Lisa's price, the lowest)
- ✅ Description: "We'll assign the first available..."
- ✅ Button: "Select Anyone →"

---

### Test 3: Staff Selection - Specific Staff

**Steps:**
1. Click "Select Emma →"
2. Watch the button state

**✅ Expected Results:**
1. Button text changes to "Selecting..." immediately
2. All buttons become disabled
3. After ~1 second:
   - Progress indicator advances to step 3
   - Page transitions to Step 3 (or placeholder)
   - URL updates (if you implemented URL hash)

**Check Session (Optional):**
Open browser DevTools → Application → Storage:
- Look for session cookie
- Session should contain:
  ```json
  {
    "service_id": 1,
    "service_name": "Women's Haircut",
    "staff_id": 1,
    "staff_name": "Emma Thompson",
    "staff_price": 45.00,
    "current_step": 3
  }
  ```

**❌ If it fails:**
- Open Console (F12) - check for JavaScript errors
- Open Network tab - check for:
  - POST to `/wp-json/bookit/v1/staff/select`
  - Status should be 200
  - Response should show `{"success": true}`
- If 404: REST route not registered - check `class-staff-api.php` is loaded
- If 403: Nonce issue - verify `wp_localize_script` is called

---

### Test 4: Staff Selection - "No Preference"

**Steps:**
1. Refresh page to restart
2. Step 1: Select "Women's Haircut" again
3. Step 2: Click "Select Anyone →"

**✅ Expected Results:**
- Advances to Step 3
- Session contains:
  - `staff_id`: 0
  - `staff_name`: "No Preference"
  - `staff_price`: 30.00 (lowest price)

---

### Test 5: Back Button Navigation

**Steps:**
1. On Step 2, click browser back button

**✅ Expected Results:**
- Returns to Step 1 (Service Selection)
- Service selection is cleared (starts fresh)

**OR** (if you implemented session preservation):
- Returns to Step 1
- Previously selected service is highlighted

---

### Test 6: Different Service

**Steps:**
1. Start fresh: Select "Men's Haircut" in Step 1
2. Check Step 2

**✅ Expected Results:**
- Only Mark appears (he's the only one offering Men's Haircut)
- "No Preference" card shows Mark's price
- Emma, Sarah, Lisa do NOT appear

---

### Test 7: Service with No Staff

**Steps:**
1. In database, create a service with no staff assigned:
   ```sql
   INSERT INTO wp_bookings_services (name, description, duration, price, is_active) 
   VALUES ('New Service', 'No staff yet', 60, 50.00, 1);
   ```
2. Select this service in Step 1

**✅ Expected Results:**
- Step 2 shows "No Staff Available" message
- Friendly message explaining situation
- No staff cards display
- No "No Preference" card

---

## 🎨 PHASE 3: RESPONSIVE DESIGN TESTING (10 minutes)

### Test 8: Mobile View (320px - 767px)

**Steps:**
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (or Ctrl+Shift+M)
3. Select "iPhone SE" or set width to 375px

**✅ Expected Results:**
- **1 column layout** (cards stack vertically)
- Cards are full width
- Text is readable (not too small)
- Buttons are at least 44px tall
- No horizontal scrolling
- Photos/initials are clear and centered

---

### Test 9: Tablet View (768px - 1023px)

**Set width to 768px (iPad)**

**✅ Expected Results:**
- **2 column layout** (2 cards side by side)
- Gap between cards visible
- "No Preference" card may be alone on last row (that's fine)

---

### Test 10: Desktop View (1024px+)

**Set width to 1280px**

**✅ Expected Results:**
- **3 column layout** (3 cards per row)
- Cards evenly spaced
- "No Preference" card on its own row or fills last spot

---

## ♿ PHASE 4: ACCESSIBILITY TESTING (15 minutes)

### Test 11: Keyboard Navigation

**Steps:**
1. Load Step 2
2. Press `Tab` key repeatedly
3. Press `Enter` on a staff button

**✅ Expected Results:**
- Tab order is logical: Emma → Emma's button → Sarah → Sarah's button → ...
- Focus indicator is VISIBLE (blue outline, 2px)
- Can reach all staff buttons
- Can reach "No Preference" button
- Pressing `Enter` on a button selects that staff (same as clicking)
- Pressing `Shift+Tab` goes backward

**❌ Common issues:**
- Focus outline not visible → Check CSS `:focus` styles
- Can't reach buttons → Check `tabindex` is not set to `-1`

---

### Test 12: Screen Reader (Basic Test)

**If on Windows:**
1. Download NVDA (free): https://www.nvaccess.org/download/
2. Start NVDA
3. Navigate Step 2 with arrow keys

**✅ Expected Announcements:**
- "Select Staff Member, heading level 2"
- "Emma Thompson, Senior Stylist, Price £45"
- "Button, Select Emma"

**If on Mac:**
1. Enable VoiceOver: Cmd+F5
2. Navigate with Ctrl+Option+Arrow keys

---

### Test 13: Color Contrast

**Use WebAIM Contrast Checker:**
https://webaim.org/resources/contrastchecker/

**Check these combinations:**
1. Staff name (black) on white background → Should be ≥4.5:1
2. Staff price (blue #0073aa) on white → Should be ≥4.5:1
3. Button text (white) on blue background → Should be ≥4.5:1

**Use browser extension:**
- Install "aXe DevTools" extension
- Open DevTools → aXe tab
- Click "Scan"
- Should show 0 critical contrast issues

---

## 🐛 PHASE 5: ERROR HANDLING TESTING (5 minutes)

### Test 14: Network Error Simulation

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to select a staff member

**✅ Expected Results:**
- User sees error message (alert or inline)
- Buttons re-enable so user can retry
- No "stuck" state

---

### Test 15: Invalid Session

**Steps:**
1. Clear cookies/session
2. Navigate directly to step 2: `http://your-site.local/book-appointment/?step=2`

**✅ Expected Results:**
- Either: Redirects to Step 1
- Or: Shows "Please select a service first" message

---

## 📊 TESTING CHECKLIST SUMMARY

Print this and check off as you go:

### Functional
- [ ] Staff display in alphabetical order (first name)
- [ ] Staff cards show all info (name, title, price, bio)
- [ ] Photos display (or initials if no photo)
- [ ] Initials have consistent colors per staff member
- [ ] Custom pricing displays correctly (£45 for Emma, £30 for Lisa)
- [ ] "No Preference" card shows lowest price (£30)
- [ ] Clicking staff button saves to session and advances
- [ ] "No Preference" (staff_id=0) saves correctly
- [ ] Back button returns to Step 1
- [ ] Different services show different staff
- [ ] Service with no staff shows friendly message

### Responsive
- [ ] Mobile (320-767px): 1 column, no horizontal scroll
- [ ] Tablet (768-1023px): 2 columns
- [ ] Desktop (1024px+): 3 columns
- [ ] Touch targets ≥44px on mobile

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators visible on all buttons
- [ ] Screen reader announces staff info correctly
- [ ] Color contrast ≥4.5:1 (checked with aXe)
- [ ] No critical aXe issues

### Technical
- [ ] No JavaScript console errors
- [ ] REST API returns 200 status
- [ ] Session persists on page refresh
- [ ] Error handling works (offline test)

---

## 🎯 READY FOR UNIT TESTS?

Once you've verified:
- ✅ All functional tests pass
- ✅ Responsive design works
- ✅ Accessibility checks pass
- ✅ No console errors

**Then you're ready for unit tests!** Let me know and I'll provide the Task 3 PHPUnit tests prompt.

---

## 🆘 COMMON ISSUES & QUICK FIXES

| Issue | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| Staff not displaying | No test data | Run SQL insert statements above |
| "No staff available" | Staff not assigned to service | Check `wp_bookings_staff_services` table |
| Wrong prices | `custom_price` not set correctly | Check SQL: should be NULL or decimal |
| REST API 404 | Routes not registered | Check `class-staff-api.php` is loaded |
| Buttons don't work | JavaScript not loaded | Check console for errors, verify file loaded |
| Not responsive | CSS not loaded | Check `booking-wizard.css` is enqueued |
| No initials colors | Hash function broken | Check PHP color generation code |

---

**Ready to start testing?** Begin with Phase 1 (test data setup) and work through each phase. Report back with any issues! 🚀