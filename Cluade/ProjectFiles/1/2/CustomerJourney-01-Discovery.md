## STEP 1: Customer Lands on Booking Page

### **URL & Access**
- **Primary URL:** `yoursite.com/book` or `/booking`
- **WordPress Implementation:** Page with shortcode `[booking_system]`
- **Direct Link:** Can be shared directly (e.g., in Instagram bio, Google Business listing)

---

### **1.1: Initial Page Load - Mobile View (320px-767px)**

**Header:**
```
[Client Logo - centered, 120px wide max]

Book an Appointment
[Subheading: "Choose your service to get started"]
```

**Main Content:**

**IF services exist and at least one staff member is active:**

```
┌─────────────────────────────────────┐
│ 📋 Select a Service                 │
├─────────────────────────────────────┤
│                                     │
│ ▼ Haircuts                         │
│   • Women's Haircut                │
│     45 min • from £35              │
│     [Book Now →]                   │
│                                     │
│   • Men's Haircut                  │
│     30 min • from £25              │
│     [Book Now →]                   │
│                                     │
│ ▼ Coloring                         │
│   • Full Color                     │
│     2 hrs • from £80               │
│     [Book Now →]                   │
│                                     │
│   • Haircut + Color Combo ⭐       │
│     2.5 hrs • from £110            │
│     [Book Now →]                   │
│     💡 Also in: Haircuts           │
│                                     │
└─────────────────────────────────────┘
```

**Key Elements:**

1. **Category Accordion:**
   - Categories collapsed by default (mobile space saving)
   - Tap category name → expands to show services
   - Icon changes: `▶` (collapsed) to `▼` (expanded)
   - Only one category expanded at a time (mobile)

2. **Service Card (within category):**
   - Service name (bold, 18px)
   - Duration + Price on same line (14px, grey text)
   - "from £X" if staff-specific pricing varies
   - "Book Now" button (full width on mobile, primary color)

3. **Multi-Category Indicator:**
   - Services in multiple categories show `⭐` badge
   - Small text below: "💡 Also in: [Other Categories]" (clickable links)
   - Clicking link scrolls to that category

---

### **1.2: Initial Page Load - Desktop View (1024px+)**

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ [Client Logo - left, 150px]          [Contact: 020 1234 5678] │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────┬─────────────────────────────────────────┐
│                      │                                         │
│  📋 Select Service   │     [Booking Summary Panel - empty]    │
│                      │                                         │
│  ▼ Haircuts          │     "Select a service to begin"        │
│    • Women's Haircut │                                         │
│      45 min • £35-45 │                                         │
│      [Book Now]      │                                         │
│                      │                                         │
│    • Men's Haircut   │                                         │
│      30 min • £25    │                                         │
│      [Book Now]      │                                         │
│                      │                                         │
│  ▼ Coloring          │                                         │
│    • Full Color      │                                         │
│      2 hrs • £80     │                                         │
│      [Book Now]      │                                         │
│                      │                                         │
│  ▼ Packages ⭐       │                                         │
│    • Haircut+Color   │                                         │
│      2.5 hrs • £110  │                                         │
│      💡 Also in:     │                                         │
│         Haircuts,    │                                         │
│         Coloring     │                                         │
│      [Book Now]      │                                         │
│                      │                                         │
└──────────────────────┴─────────────────────────────────────────┘
```

**Desktop Differences:**
- **Two-column layout:** Services (left 60%) + Sticky summary panel (right 40%)
- **All categories expanded by default** (more screen space)
- **Hover states:** Service cards highlight on hover
- **Summary panel:** Stays visible as customer scrolls (sticky positioning)

---

### **1.3: Service Card - Detailed Specification**

**Required Elements:**
```html
<div class="service-card">
  <h3 class="service-name">Women's Haircut</h3>
  <div class="service-meta">
    <span class="duration">⏱ 45 min</span>
    <span class="price">from £35</span>
  </div>
  <p class="service-description">
    Cut and blow-dry. Includes consultation and styling advice.
  </p>
  <button class="btn-book-now">Book Now →</button>
  
  <!-- Only if multi-category: -->
  <div class="multi-category-note">
    💡 Also in: <a href="#coloring">Coloring</a>, <a href="#packages">Packages</a>
  </div>
</div>
```

**Price Display Rules:**
1. **All staff same price:** Show "£35"
2. **Staff prices vary:** Show "from £30" (lowest price)
3. **Price range wide:** Show "£30-£45" (if difference >30%)

**Description Display:**
- **Mobile:** Hidden by default, show "Read more" link
- **Desktop:** First 80 characters visible, "... Read more" if longer
- **Expanded:** Full description + "Show less" link

---

### **1.4: Category Management (Multi-Category Services)**

**Database Implementation:**

Since a service can be in multiple categories (per Q3 clarification), we need:

**Option A: Comma-separated in `category` field**
```sql
-- wp_bookings_services table
category VARCHAR(255) -- "Haircuts,Coloring"
```
- Simple to implement
- Easy to query with `LIKE '%Haircuts%'`

**Option B: Separate junction table** (More scalable)
```sql
-- New table: wp_bookings_service_categories
CREATE TABLE wp_bookings_service_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id BIGINT UNSIGNED NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES wp_bookings_services(id)
);
```
- Better for reporting ("Show all services in Haircuts category")
- Easier to manage category renaming

**My Recommendation:** **Option B** (junction table) - small upfront cost, much cleaner long-term.

**Do you agree, or prefer simpler Option A for Phase 1?**

---

### **1.5: Error States - What If Things Go Wrong?**

#### **Error State 1: No Services Configured**

**Displayed:**
```
┌─────────────────────────────────────┐
│ [Client Logo]                       │
│                                     │
│ 😔 Bookings Not Available Yet      │
│                                     │
│ We're setting up our booking       │
│ system. Please check back soon or  │
│ contact us to schedule:            │
│                                     │
│ 📞 020 1234 5678                   │
│ ✉️  info@salon.com                 │
│                                     │
└─────────────────────────────────────┘
```

**When This Happens:**
- WordPress Admin hasn't created any services yet
- OR all services are set to `status='inactive'`

**Fix Required:** WordPress Admin must add at least one active service.

---

#### **Error State 2: No Active Staff Members**

**Displayed:**
```
┌─────────────────────────────────────┐
│ 📋 Our Services                     │
│                                     │
│ ▼ Haircuts                         │
│   • Women's Haircut                │
│     45 min • £35                   │
│     [Currently Unavailable]        │
│                                     │
│ ⚠️ All staff are currently off.    │
│    Please contact us to schedule.  │
│                                     │
│ 📞 020 1234 5678                   │
└─────────────────────────────────────┘
```

**When This Happens:**
- Services exist, but NO staff assigned to any service
- OR all staff are `status='inactive'`
- OR all staff are on vacation (blocked time for next 30 days)

**User Action:** "Book Now" buttons are disabled (greyed out)

---

#### **Error State 3: Service Has No Available Staff**

**Scenario:** "Men's Haircut" service exists, but:
- The only staff member who offered it (Mark) was deactivated
- No other staff assigned to this service

**Displayed:**
```
▼ Haircuts
  • Women's Haircut
    45 min • from £35
    [Book Now →]
    
  • Men's Haircut
    30 min • £25
    [Currently Unavailable]
    💡 This service is temporarily unavailable.
```

**User Action:** Button disabled for that specific service only.

---

#### **Error State 4: Page Load Failure**

**If JavaScript fails to load services:**

**Displayed:**
```
⚠️ Loading Error

Unable to load booking system.
Please refresh the page or contact us:

📞 020 1234 5678
✉️  info@salon.com

[Refresh Page]
```

**Technical Implementation:**
- Use skeleton/loading animation first (3 seconds)
- If AJAX request fails → Show error
- Log error to browser console for debugging

---

### **1.6: Loading States**

**Initial Page Load (0-2 seconds):**

**Mobile:**
```
┌─────────────────────────────────────┐
│ [Client Logo - centered]            │
│                                     │
│ Book an Appointment                 │
│ Loading services...                 │
│                                     │
│ [Animated spinner]                  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ [Grey skeleton box]         │   │
│ │ [Grey skeleton text line]   │   │
│ │ [Grey skeleton button]      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ [Grey skeleton box]         │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**After 2 seconds:** Services fade in, skeleton disappears.

**After 5 seconds (timeout):** Show Error State 4.

---

### **1.7: Accessibility Requirements (WCAG 2.1 AA)**

**Keyboard Navigation:**
1. Press `Tab` → Focus moves to first category
2. Press `Enter` or `Space` → Expands/collapses category
3. Press `Tab` → Focus moves to first "Book Now" button
4. Press `Enter` → Proceeds to Step 2 (staff selection)

**Screen Reader Announcements:**
- Page load: "Booking page loaded. Select a service to begin."
- Category expanded: "Haircuts category expanded. 3 services available."
- Service focused: "Women's Haircut. 45 minutes. Price from £35. Book now button."

**Color Contrast:**
- All text: Minimum 4.5:1 contrast ratio
- Buttons: Minimum 3:1 contrast ratio
- Focus indicators: 2px blue outline (visible on keyboard navigation)

**Focus Management:**
- Current focused element has visible outline
- Focus never hidden or lost
- Skip to main content link at top

---

### **1.8: Data Validation - Backend**

**Before rendering services, backend checks:**

```php
// Pseudo-code for service loading
function get_bookable_services() {
    $services = query_database("
        SELECT s.* 
        FROM wp_bookings_services s
        WHERE s.status = 'active'
        AND EXISTS (
            SELECT 1 
            FROM wp_bookings_staff_services ss
            JOIN wp_bookings_staff st ON ss.staff_id = st.id
            WHERE ss.service_id = s.id
            AND st.status = 'active'
        )
    ");
    
    if (empty($services)) {
        return error_state('no_services');
    }
    
    foreach ($services as $service) {
        // Check if ANY staff member has availability in next 30 days
        $has_availability = check_staff_availability($service->id, 30);
        $service->is_bookable = $has_availability;
    }
    
    return $services;
}
```

**Questions for You:**

1. **If a service has NO availability for next 30 days** (all staff fully booked or on vacation), should we:
   - **Option A:** Still show the service, but button says "Fully Booked"
   - **Option B:** Hide the service entirely
   - **Option C:** Show service, button says "Join Waitlist" (deferred to Phase 2)

2. **Category ordering:** Should categories have a custom sort order set by WordPress Admin, or always alphabetical?

---

## 🎯 STEP 1 SUMMARY - Ready to Proceed?

**We've defined:**
- ✅ Page layout (mobile-first, desktop two-column)
- ✅ Service card structure
- ✅ Multi-category handling (needs junction table confirmation)
- ✅ 4 error states
- ✅ Loading states
- ✅ Accessibility requirements
- ✅ Backend validation logic

**Open Questions:**
1. Multi-category: Option A (comma-separated) or Option B (junction table)?
2. Fully booked services: Show or hide?
3. Category ordering: Custom or alphabetical?

**Answer these 3, then we move to Step 2: Staff Selection!**

# ✅ Decisions Locked - Step 1 Complete

**Multi-category:** Junction table (`wp_bookings_service_categories`)  
**Fully booked:** Show with "No availability" message  
**Category order:** Alphabetical (Phase 1), custom ordering (Phase 2)

---

## STEP 2: Staff Selection Screen

### **2.1: Transition from Step 1 to Step 2**

**User Action:** Customer clicks "Book Now" on "Women's Haircut"

**What Happens:**

**Mobile:**
- Page scrolls to top
- Service selection section slides up/fades out
- Staff selection section fades in
- URL updates: `/book?service=3` (service ID in query param for back button support)

**Desktop:**
- Service list stays visible (left column)
- Selected service card highlights (border + checkmark)
- Staff selection appears in main area (center, replacing categories)
- Summary panel (right) updates:
  ```
  Your Booking
  ✓ Women's Haircut
    45 min
  
  [Continue below]
  ```

---

### **2.2: Staff Selection Screen - Mobile View**

```
┌─────────────────────────────────────┐
│ [← Back]          Step 2 of 4       │
├─────────────────────────────────────┤
│ Women's Haircut                     │
│ 45 minutes                          │
│                                     │
│ Who would you like?                 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐   │
│ │ [ET]  Emma Thompson         │   │
│ │       Senior Stylist        │   │
│ │       £45                   │   │
│ │                             │   │
│ │ "10+ years experience in    │   │
│ │  balayage and modern cuts"  │   │
│ │                             │   │
│ │       [Select Emma →]       │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ [ST]  Sarah Thompson        │   │
│ │       Stylist               │   │
│ │       £35                   │   │
│ │                             │   │
│ │ "Specializing in precision  │   │
│ │  cuts and blow-dry styling" │   │
│ │                             │   │
│ │       [Select Sarah →]      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ [LT]  Lisa Taylor           │   │
│ │       Junior Stylist        │   │
│ │       £30                   │   │
│ │                             │   │
│ │ "Currently training, great  │   │
│ │  for simple cuts & styling" │   │
│ │                             │   │
│ │       [Select Lisa →]       │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🎲 No Preference            │   │
│ │                             │   │
│ │ We'll assign the first      │   │
│ │ available stylist           │   │
│ │                             │   │
│ │ from £30                    │   │
│ │                             │   │
│ │    [Select Anyone →]        │   │
│ └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### **2.3: Staff Card - Detailed Specification**

**Required Elements:**

```html
<div class="staff-card">
  <!-- Photo or Initials -->
  <div class="staff-photo">
    <!-- IF photo uploaded: -->
    <img src="emma.jpg" alt="Photo of Emma Thompson">
    
    <!-- IF no photo (Option B from Q4): -->
    <div class="staff-initials" style="background-color: #3B82F6">
      ET
    </div>
  </div>
  
  <!-- Staff Info -->
  <div class="staff-info">
    <h3 class="staff-name">Emma Thompson</h3>
    <p class="staff-title">Senior Stylist</p>
    <p class="staff-price">£45</p>
    
    <!-- Bio (optional, can be empty) -->
    <p class="staff-bio">
      10+ years experience in balayage and modern cuts
    </p>
  </div>
  
  <!-- Action Button -->
  <button class="btn-select-staff">Select Emma →</button>
</div>
```

---

### **2.4: Staff Photo/Initials Logic**

**Initials Generation:**

```javascript
function generateInitials(firstName, lastName) {
  // "Emma Thompson" → "ET"
  return firstName.charAt(0).toUpperCase() + 
         lastName.charAt(0).toUpperCase();
}

function generateColorFromName(fullName) {
  // Generate consistent color based on name
  // Hash name → Pick from predefined palette
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];
  
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
```

**Result:**
- Emma Thompson → Blue circle with "ET"
- Sarah Thompson → Green circle with "ST"
- Lisa Taylor → Orange circle with "LT"

**Consistent colors:** Same staff member always gets same color (deterministic hash).

---

### **2.5: "No Preference" Option**

**Always displayed as the LAST card.**

**Behavior:**

1. **Price shown:** "from £30" (lowest price among available staff)
2. **Description:** "We'll assign the first available stylist"
3. **Backend logic when selected:**
   - Customer picks date/time in Step 3
   - System checks which staff members have that slot available
   - Assigns first available staff (or staff with lowest booking count that day - load balancing)

**Question for You:**

**Load balancing logic for "No Preference" - which approach?**

**Option A: First Available** (Simpler)
- If Emma and Sarah both free at 2pm → Always pick Emma (alphabetically first)
- Pro: Simple, predictable
- Con: Emma might get overbooked, Sarah underutilized

**Option B: Least Busy Today** (Fairer)
- Check booking count for that day
- Emma has 6 bookings, Sarah has 3 → Assign to Sarah
- Pro: Balances workload across team
- Con: Slightly more complex query

**Option C: Random** (Truly no preference)
- Pick randomly from available staff
- Pro: Fair distribution over time
- Con: Unpredictable, harder to explain

**My Recommendation: Option B** (Least Busy). Fairest for staff, better customer experience (less likely to encounter rushed stylist).

**Your preference?**

---

### **2.6: Staff Sorting Order**

**Question:** How should staff be ordered on this screen?

**Option A: Price (Low to High)**
```
Lisa (£30)
Sarah (£35)
Emma (£45)
No Preference
```
- Pro: Budget-conscious customers see cheapest first
- Con: May devalue senior staff

**Option B: Price (High to Low)**
```
Emma (£45)
Sarah (£35)
Lisa (£30)
No Preference
```
- Pro: Showcases premium options first
- Con: May discourage budget-conscious customers

**Option C: Custom Order** (WordPress Admin sets)
```
Emma (Senior, featured)
Sarah (Mid-tier)
Lisa (Junior)
No Preference
```
- Pro: Business Owner controls positioning
- Con: Requires WordPress Admin configuration field

**Option D: Alphabetical by Name**
```
Emma Thompson
Lisa Taylor
Sarah Thompson
No Preference
```
- Pro: Simple, neutral
- Con: No strategic ordering

**My Recommendation for Phase 1: Option D (Alphabetical)** - neutral, no setup required. Add custom ordering in Phase 2.

**Agree?**

---

### **2.7: Desktop View - Staff Selection**

```
┌──────────────────────┬─────────────────────────────────────────┐
│ ✓ Women's Haircut    │  👤 Select Your Stylist                │
│   45 min             │                                         │
│   [Change Service]   │  ┌─────────┬─────────┬─────────┐      │
│                      │  │ [ET]    │ [ST]    │ [LT]    │      │
│ ▼ Haircuts           │  │ Emma    │ Sarah   │ Lisa    │      │
│   • Women's Haircut  │  │ £45     │ £35     │ £30     │      │
│   • Men's Haircut    │  │ [Select]│ [Select]│ [Select]│      │
│                      │  └─────────┴─────────┴─────────┘      │
│ ▼ Coloring           │                                         │
│   • Full Color       │  ┌───────────────────────────────┐    │
│                      │  │ 🎲 No Preference              │    │
│                      │  │ First available • from £30    │    │
│                      │  │         [Select Anyone]        │    │
│                      │  └───────────────────────────────┘    │
│                      │                                         │
│                      │  ─────────────────────────────────────│
│                      │  Your Booking                          │
│                      │  ✓ Women's Haircut (45 min)           │
│                      │  [Staff not selected yet]              │
│                      │                                         │
└──────────────────────┴─────────────────────────────────────────┘
```

**Desktop Differences:**
- **Three-column grid** for staff cards (if 3+ staff)
- **Compact cards:** Photo/initials above name, bio hidden until hover
- **Hover state:** Card expands to show full bio
- **Summary panel updates** as customer selects staff

---

### **2.8: Error States - Staff Selection**

#### **Error State 1: No Available Staff for This Service**

**Scenario:** All staff who offer "Women's Haircut" are:
- On vacation for next 30 days
- Fully booked for next 30 days
- Deactivated

**Displayed:**
```
┌─────────────────────────────────────┐
│ [← Back]          Step 2 of 4       │
├─────────────────────────────────────┤
│ Women's Haircut                     │
│                                     │
│ 😔 No Availability                  │
│                                     │
│ All stylists are currently fully    │
│ booked or unavailable for the next  │
│ 30 days.                            │
│                                     │
│ Would you like to:                  │
│                                     │
│ [← Choose Another Service]          │
│                                     │
│ [Contact Us: 020 1234 5678]         │
│                                     │
└─────────────────────────────────────┘
```

**Technical Check:**
```php
// Backend validation
function get_available_staff_for_service($service_id, $days = 30) {
    $staff_list = get_staff_assigned_to_service($service_id);
    
    foreach ($staff_list as $staff) {
        // Check if staff has ANY open slots in next X days
        $has_availability = check_staff_has_open_slots($staff->id, $days);
        
        if ($has_availability) {
            $staff->is_bookable = true;
        } else {
            $staff->is_bookable = false;
        }
    }
    
    // If ALL staff have is_bookable = false, show error
    return $staff_list;
}
```

---

#### **Error State 2: Only "No Preference" Available**

**Scenario:** 
- Emma: Fully booked next 30 days
- Sarah: On vacation
- Lisa: Available

**Displayed:**
- Show Lisa's card (normal)
- Show "No Preference" card (normal)
- Emma and Sarah cards shown but greyed out with "Currently Unavailable" badge

```
┌─────────────────────────────┐
│ [ET]  Emma Thompson    ⚠️   │
│       Senior Stylist        │
│       £45                   │
│                             │
│  Currently Unavailable      │
│  (Fully booked)             │
│                             │
│  [Button disabled/grey]     │
└─────────────────────────────┘
```

**User Action:** Can still book with Lisa or "No Preference" (which would assign Lisa anyway).

---

### **2.9: Back Button Behavior**

**User clicks [← Back]**

**Mobile:**
- Staff selection fades out
- Service selection (Step 1) fades back in
- Previous service selection is cleared (customer starts fresh)
- URL: Back to `/book`

**Desktop:**
- Staff selection area clears
- Selected service checkmark removed
- Summary panel resets: "Select a service to begin"

**Browser Back Button:**
- Same behavior as clicking [← Back]
- URL history supported: `/book` → `/book?service=3` → (back) → `/book`

---

### **2.10: Data Passed to Step 3**

**When customer clicks "Select Emma →"**

**Data captured:**
```json
{
  "service_id": 3,
  "service_name": "Women's Haircut",
  "service_duration": 45,
  "staff_id": 1,
  "staff_name": "Emma Thompson",
  "staff_price": 45.00,
  "staff_preference": "specific" // or "none" if "No Preference" selected
}
```

**Stored where:**
- **Option A:** Session storage (PHP $_SESSION)
- **Option B:** Hidden form fields
- **Option C:** JavaScript object (for single-page app feel)

**My Recommendation: Option A (Session)** - most secure, works even if JavaScript disabled.

**Agree?**

---

### **2.11: Accessibility - Staff Selection**

**Keyboard Navigation:**
1. Focus starts on first staff card (Emma)
2. Press `Tab` → Move to "Select Emma" button
3. Press `Tab` → Focus on next staff card (Sarah)
4. Press `Shift+Tab` → Move back
5. Press `Enter` on "Select Emma" → Proceed to Step 3

**Screen Reader:**
- Focus on Emma's card: "Emma Thompson, Senior Stylist, Price: £45. Button: Select Emma."
- Focus on "No Preference" card: "No Preference. We'll assign the first available stylist. Price: from £30. Button: Select Anyone."

**ARIA Labels:**
```html
<div class="staff-card" role="article" aria-label="Staff member: Emma Thompson">
  <h3 id="staff-1-name">Emma Thompson</h3>
  <p id="staff-1-title">Senior Stylist</p>
  <p id="staff-1-price">Price: £45</p>
  <button aria-describedby="staff-1-name staff-1-title staff-1-price">
    Select Emma
  </button>
</div>
```

---

### **2.12: Mobile Performance Optimization**

**Image Loading:**
- Staff photos lazy-loaded (only load visible cards)
- Use `loading="lazy"` attribute
- Compress images to <50KB each

**Initial Load:**
- Load "No Preference" and first 3 staff cards
- If 5+ staff, load remaining on scroll

**Animation:**
- Slide-in animation: 300ms duration (smooth but not slow)
- Disable animations if user has `prefers-reduced-motion` enabled

---

## 🎯 STEP 2 COMPLETE - Summary

**We've defined:**
- ✅ Staff selection layout (mobile 1-column, desktop 3-column grid)
- ✅ Staff card structure (photo/initials, name, title, price, bio, button)
- ✅ "No Preference" option (always last, shows lowest price)
- ✅ Staff ordering (alphabetical for Phase 1)
- ✅ Error states (no availability, partially available)
- ✅ Back button behavior
- ✅ Data capture and session storage
- ✅ Accessibility requirements

**Open Question:**
**"No Preference" assignment logic:** Option B (Least Busy) preferred?

---