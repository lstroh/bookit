## 🚀 Let's Begin: Step 1 - Customer Lands on Booking Page

Before I map out the full journey, I need to clarify a few decisions that will affect the entire flow:

### **Critical Questions (Answer These First):**

#### **Q1: How does the customer GET to the booking page?**

**Option A:** Dedicated booking page
- URL: `yoursite.com/book` or `yoursite.com/booking`
- WordPress page with shortcode: `[booking_system]`
- Clean, standalone experience

**Option B:** Embedded widget on multiple pages
- Service pages have "Book Now" buttons
- Modal/popup opens with booking form
- Customer never leaves current page

**Option C:** Hybrid
- Main booking page exists
- Can also embed on other pages
- Preference?

**My Recommendation:** Start with **Option A** (dedicated page) for Phase 1 MVP, add embedding in Phase 2. Simpler to build, test, and maintain.

---

#### **Q2: Does the customer ALWAYS start by selecting a service, or can they start with a staff member?**

**Flow A: Service-First** (Recommended for your personas)
1. Customer picks service ("Women's Haircut")
2. System shows staff who offer it
3. Customer picks staff (or "No Preference")
4. Customer picks date/time

**Flow B: Staff-First**
1. Customer picks staff member ("Emma")
2. System shows services Emma offers
3. Customer picks service
4. Customer picks date/time

**Flow C: Either** (Customer chooses which path)
- Landing page shows both: "Browse Services" | "Browse Staff"
- Two different flows merge at date/time selection

**Which flow fits your target audience?**

For Sarah's salon, service-first makes sense ("I need a haircut" → "Who's available?")  
For Michael's photography, might be mixed ("I want Michael specifically" OR "I need headshots")

**My Recommendation:** **Service-First** for Phase 1 (simpler, matches most personas). Add staff-first option in Phase 2 if customers request it.

---

#### **Q3: Category Display - How are services organized?**

From ScopeDefinition, services have categories ("Haircuts", "Coloring", "Treatments").

**Option A:** Show categories first, then services within
```
Haircuts ▼
  - Women's Haircut (45 min, from £30)
  - Men's Haircut (30 min, from £25)
Coloring ▼
  - Full Color (2 hrs, from £80)
  - Highlights (3 hrs, from £120)
```

**Option B:** Show all services in one list, grouped visually
```
All Services:
[Haircuts]
Women's Haircut | 45 min | from £30
Men's Haircut | 30 min | from £25

[Coloring]
Full Color | 2 hrs | from £80
```

**Option C:** No categories, alphabetical list
- Simple but gets messy with 10+ services

**My Recommendation:** **Option A** (categories first). Matches how customers think ("I need coloring services" → browse that section).

---

#### **Q4: Staff Photos - Required or Optional?**

From ScopeDefinition, staff profiles have optional photos.

**Scenario:** Business Owner hasn't uploaded staff photos yet.

**What shows?**
- **Option A:** Generic avatar/silhouette icon
- **Option B:** Staff initials in colored circle (e.g., "ET" for Emma Thompson)
- **Option C:** No image, just name + bio
- **Option D:** Hide staff selection entirely if no photos (show "No Preference" only)

**My Recommendation:** **Option B** (initials) for MVP. Professional enough, works without photos.

---

#### **Q5: Mobile-First Design Priority?**

From ScopeDefinition:
> **Mobile Responsiveness Targets:**
> - **Customer booking flow:** All devices (320px+ width) - **PRIMARY**

This means we design mobile-first, then adapt to desktop. Agree?

**Impact on UI:**
- Mobile: Single-column layout, large tap targets, minimal scrolling
- Desktop: Can show more info side-by-side (calendar + summary panel)

**Confirm this approach?**

---

### **Once You Answer These 5 Questions, I'll Map Out:**

**Step 1: Landing on Booking Page**
- Exactly what customer sees
- Desktop vs mobile layout
- Initial load states
- Edge cases (no services configured, all staff on vacation, etc.)

**Then we'll move through:**
- Step 2: Service selection
- Step 3: Staff selection
- Step 4: Date/time selection
- Step 5: Contact details
- Step 6: Payment
- Step 7: Confirmation
- Post-booking flows (emails, cancellation, rescheduling)

**Ready to answer the 5 questions?** Or should I proceed with my recommended defaults and you'll correct me if needed?


# Phase 2.2: Customer Booking Journey - Detailed Functional Requirements

## ✅ Decisions Locked:
- Q1: Dedicated booking page (`/book`)
- Q2: Service-first flow
- Q3: Categories with multi-category support
- Q4: Initials fallback for photos
- Q5: Mobile-first design

---

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

## Ready for STEP 3: Date & Time Selection?

This is the **most complex step** with:
- Calendar view (month picker)
- Available time slots
- Real-time availability checking
- UK bank holidays blocking
- Staff working hours
- Buffer time calculations
- Booking window limits

**Should I proceed to Step 3, or do you want to clarify anything about Steps 1-2 first?**

# ✅ Decisions Locked - Step 2 Complete

**Load balancing:** Configurable in WP Admin (First Available OR Least Busy)  
**Staff ordering:** Alphabetical by name (Phase 1)  
**Data storage:** PHP Session ($_SESSION)

---

## Updated Database Schema Addition

### **Table: `wp_bookings_settings` - New Field**

Add this field to the existing settings table:

```sql
ALTER TABLE wp_bookings_settings 
ADD COLUMN no_preference_assignment ENUM('first_available', 'least_busy', 'random') 
DEFAULT 'least_busy' 
AFTER timezone;
```

**WordPress Admin UI:**

```
Settings → Bookings → General

┌─────────────────────────────────────────────────────┐
│ "No Preference" Assignment Logic                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ When customers select "No Preference", assign:     │
│                                                     │
│ ○ First Available Alphabetically                   │
│   Simple assignment to first available staff       │
│                                                     │
│ ● Least Busy Staff Member (Recommended)            │
│   Balances workload across your team               │
│                                                     │
│ ○ Random Assignment                                │
│   Randomly distributes bookings                    │
│                                                     │
│ [Save Changes]                                      │
└─────────────────────────────────────────────────────┘
```

---

## STEP 3: Date & Time Selection

### **3.1: Transition from Step 2 to Step 3**

**User Action:** Customer clicks "Select Emma →"

**What Happens:**

**Session Data Stored:**
```php
$_SESSION['booking_data'] = [
    'service_id' => 3,
    'service_name' => 'Women\'s Haircut',
    'service_duration' => 45,
    'service_buffer' => 15,
    'staff_id' => 1,
    'staff_name' => 'Emma Thompson',
    'staff_price' => 45.00,
    'staff_preference' => 'specific', // or 'none'
    'step_completed' => 2
];
```

**Mobile:**
- Staff selection slides out
- Calendar view slides in
- URL updates: `/book?service=3&staff=1`

**Desktop:**
- Staff selection area replaced by calendar
- Summary panel updates:
  ```
  Your Booking
  ✓ Women's Haircut (45 min)
  ✓ with Emma Thompson (£45)
  
  [Change selections above]
  ```

---

### **3.2: Date & Time Selection - Mobile View**

```
┌─────────────────────────────────────┐
│ [← Back]          Step 3 of 4       │
├─────────────────────────────────────┤
│ Women's Haircut • Emma Thompson     │
│                                     │
│ 📅 Choose Date & Time               │
├─────────────────────────────────────┤
│                                     │
│      ← May 2026 →                  │
│                                     │
│  Su  Mo  Tu  We  Th  Fr  Sa        │
│                   1   2   3        │
│   4   5   6   7   8   9  10        │
│  11  12  13  14 [15] 16  17        │
│  18  19  20  21  22  23  24        │
│  25  26  27  28  29  30  31        │
│                                     │
│  Legend:                            │
│  [15] = Today                       │
│   7  = Available                    │
│   1  = Past date (greyed)           │
│   ✕  = Unavailable/Holiday          │
│                                     │
├─────────────────────────────────────┤
│ Selected: Thursday, 15 May 2026     │
│                                     │
│ Available Times:                    │
│                                     │
│ Morning                             │
│ ┌──────────┐ ┌──────────┐         │
│ │  9:00 AM │ │  9:45 AM │         │
│ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐         │
│ │ 10:30 AM │ │ 11:15 AM │         │
│ └──────────┘ └──────────┘         │
│                                     │
│ Afternoon                           │
│ ┌──────────┐ ┌──────────┐         │
│ │  2:00 PM │ │  2:45 PM │         │
│ └──────────┘ └──────────┘         │
│ ┌──────────┐                       │
│ │  3:30 PM │  [Fully Booked]      │
│ └──────────┘                       │
│                                     │
│ Evening                             │
│ ┌──────────┐ ┌──────────┐         │
│ │  5:00 PM │ │  5:45 PM │         │
│ └──────────┘ └──────────┘         │
│                                     │
└─────────────────────────────────────┘
```

---

### **3.3: Calendar Component - Detailed Specification**

#### **Calendar Header:**

```html
<div class="calendar-header">
  <button class="btn-prev-month" aria-label="Previous month">←</button>
  <h3 class="current-month">May 2026</h3>
  <button class="btn-next-month" aria-label="Next month">→</button>
</div>
```

**Navigation Limits:**

**Earliest date shown:** Today (cannot book in the past)

**Latest date shown:** Based on service's `booking_window_days`:
- If `booking_window_days = 30` → Can only view current month + next month
- If `booking_window_days = 90` → Can view 3 months ahead

**Example:**
- Today: 15 May 2026
- Service booking window: 30 days
- Can view: May 2026, June 2026 (up to 14 June)
- Cannot navigate to: July 2026 (disabled "→" button)

---

#### **Calendar Grid:**

**Day Cell States:**

| State | Visual | Clickable? | Example |
|-------|--------|------------|---------|
| **Past date** | Grey text, no background | No | 1-14 May (if today is 15th) |
| **Today** | Bold, blue border | Yes | 15 May |
| **Available** | Black text, white background, hover effect | Yes | 16 May (Emma has open slots) |
| **Partially available** | Black text, yellow dot indicator | Yes | 17 May (some slots booked, some free) |
| **Fully booked** | Grey text, strikethrough | No | 18 May (Emma fully booked) |
| **Holiday/Blocked** | Grey text, red "✕" symbol | No | 26 May (UK Bank Holiday) |
| **Staff unavailable** | Grey text, no background | No | 20-27 May (Emma on vacation) |
| **Outside booking window** | Not rendered | No | 15 June+ (if window is 30 days) |

**HTML Structure:**

```html
<table class="calendar-grid" role="grid" aria-label="May 2026">
  <thead>
    <tr>
      <th>Su</th>
      <th>Mo</th>
      <th>Tu</th>
      <th>We</th>
      <th>Th</th>
      <th>Fr</th>
      <th>Sa</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td class="calendar-day past" aria-disabled="true">1</td>
      <td class="calendar-day past" aria-disabled="true">2</td>
      <td class="calendar-day past" aria-disabled="true">3</td>
    </tr>
    <tr>
      <td class="calendar-day available" role="button" tabindex="0" 
          aria-label="7 May 2026, available">
        7
      </td>
      <!-- ... -->
      <td class="calendar-day today available" role="button" tabindex="0"
          aria-label="15 May 2026, today, available">
        15
      </td>
      <!-- ... -->
    </tr>
    <tr>
      <td class="calendar-day unavailable" aria-disabled="true"
          aria-label="26 May 2026, UK Bank Holiday, unavailable">
        26 <span class="holiday-indicator">✕</span>
      </td>
      <!-- ... -->
    </tr>
  </tbody>
</table>
```

---

### **3.4: Time Slot Generation Logic**

**Backend Calculation (when customer clicks a date):**

```php
function get_available_time_slots($staff_id, $date, $service_duration, $service_buffer) {
    // Step 1: Get staff working hours for this date
    $working_hours = get_staff_working_hours($staff_id, $date);
    // Returns: [['start' => '09:00', 'end' => '17:00']]
    // (Could be multiple if split shift: 9am-12pm, 2pm-6pm)
    
    // Step 2: Get existing bookings for this date
    $existing_bookings = get_staff_bookings($staff_id, $date);
    // Returns: [
    //   ['start_time' => '10:00', 'end_time' => '11:00'], // includes buffer
    //   ['start_time' => '14:00', 'end_time' => '15:00'],
    // ]
    
    // Step 3: Get blocked time (lunch, vacation)
    $blocked_times = get_staff_blocked_time($staff_id, $date);
    // Returns: [['start' => '12:00', 'end' => '13:00']] // Lunch
    
    // Step 4: Generate all possible slots (15-min increments)
    $all_slots = [];
    foreach ($working_hours as $shift) {
        $current_time = strtotime($shift['start']);
        $end_time = strtotime($shift['end']);
        
        while ($current_time < $end_time) {
            $slot_start = date('H:i', $current_time);
            $slot_end = date('H:i', $current_time + ($service_duration * 60));
            $slot_end_with_buffer = date('H:i', 
                $current_time + (($service_duration + $service_buffer) * 60)
            );
            
            // Check if slot fits before end of shift
            if (strtotime($slot_end_with_buffer) <= $end_time) {
                // Check if slot conflicts with existing booking or blocked time
                $is_available = true;
                
                foreach ($existing_bookings as $booking) {
                    if (times_overlap($slot_start, $slot_end_with_buffer, 
                                     $booking['start_time'], $booking['end_time'])) {
                        $is_available = false;
                        break;
                    }
                }
                
                foreach ($blocked_times as $block) {
                    if (times_overlap($slot_start, $slot_end_with_buffer,
                                     $block['start'], $block['end'])) {
                        $is_available = false;
                        break;
                    }
                }
                
                if ($is_available) {
                    $all_slots[] = [
                        'time' => $slot_start,
                        'display' => date('g:i A', $current_time), // "9:00 AM"
                        'end_time' => $slot_end,
                    ];
                }
            }
            
            // Move to next 15-min increment
            $current_time += (15 * 60);
        }
    }
    
    return $all_slots;
}

function times_overlap($start1, $end1, $start2, $end2) {
    return (strtotime($start1) < strtotime($end2)) && 
           (strtotime($end1) > strtotime($start2));
}
```

---

### **3.5: Time Slot Display - Grouping by Period**

**Time slots grouped into:**
- **Morning:** 5:00 AM - 11:59 AM
- **Afternoon:** 12:00 PM - 4:59 PM  
- **Evening:** 5:00 PM - 11:59 PM

**If no slots in a period:**
```
Morning
  No times available

Afternoon
  [2:00 PM]  [2:45 PM]
```

**If ALL periods empty:**
```
📅 No availability on 15 May 2026

Emma Thompson is fully booked this day.

Try another date or:
[← Choose Another Staff Member]
```

---

### **3.6: Time Slot Button Specification**

```html
<button class="time-slot-btn" 
        data-time="14:00" 
        data-display="2:00 PM"
        aria-label="Book at 2:00 PM">
  2:00 PM
</button>
```

**States:**

| State | Visual | Behavior |
|-------|--------|----------|
| **Available** | White background, blue border, hover effect | Clickable |
| **Selected** | Blue background, white text, checkmark | Clickable (deselects if clicked again) |
| **Past time** | Grey, disabled | Not clickable (if today's date and time has passed) |

**Same-Day Time Filtering:**

If customer selects today's date (15 May 2026) and current time is 1:45 PM:

**Hide past slots:**
- ~~9:00 AM~~ (hidden)
- ~~10:30 AM~~ (hidden)
- ~~1:00 PM~~ (hidden)

**Show future slots only:**
- 2:00 PM ✓
- 2:45 PM ✓
- 3:30 PM ✓

**Add buffer for current time:**
- Current time: 1:45 PM
- Minimum booking lead time: 1 hour (configurable in settings)
- First available slot: 2:45 PM (not 2:00 PM)

**Question for You:**

**Same-day booking lead time - should this be configurable?**

**Option A:** Fixed 1 hour (simple)
- Customer at 1:45 PM can book from 2:45 PM onwards

**Option B:** Configurable per service (flexible)
- Haircut: 1 hour lead time
- Wedding photography: 48 hours lead time

**Option C:** Configurable globally (middle ground)
- WordPress Admin sets: "Minimum 2 hours notice required"
- Applies to all services

**My Recommendation: Option C (global setting)** for Phase 1, add per-service in Phase 2.

**Your preference?**

---

### **3.7: Desktop View - Date & Time Selection**

```
┌──────────────────────┬─────────────────────────────────────────┐
│ ✓ Women's Haircut    │  📅 Choose Date & Time                  │
│ ✓ Emma Thompson      │                                         │
│   [Change]           │  ┌─────────────┬─────────────────────┐ │
│                      │  │             │                     │ │
│ ▼ Haircuts           │  │   Calendar  │   Available Times   │ │
│                      │  │             │                     │ │
│                      │  │  ← May 2026→│  Thursday, 15 May   │ │
│                      │  │             │                     │ │
│                      │  │  [Calendar  │  Morning            │ │
│                      │  │   Grid]     │  9:00  9:45  10:30  │ │
│                      │  │             │                     │ │
│                      │  │  Selected:  │  Afternoon          │ │
│                      │  │  15 May     │  2:00  2:45  3:30   │ │
│                      │  │             │                     │ │
│                      │  │             │  Evening            │ │
│                      │  │             │  5:00  5:45         │ │
│                      │  │             │                     │ │
│                      │  └─────────────┴─────────────────────┘ │
│                      │                                         │
│                      │  ─────────────────────────────────────│
│                      │  Your Booking                          │
│                      │  ✓ Women's Haircut (45 min)           │
│                      │  ✓ Emma Thompson (£45)                │
│                      │  ⏰ Thurs 15 May at 2:00 PM           │
│                      │                                         │
│                      │  [Continue to Details →]               │
└──────────────────────┴─────────────────────────────────────────┘
```

**Desktop Enhancements:**
- Calendar and time slots side-by-side (60/40 split)
- Time slots update instantly when date clicked (no page reload)
- Summary panel shows live preview as customer selects time

---

### **3.8: UK Bank Holidays - Auto-Blocking**

**From ScopeDefinition:**
> UK bank holidays auto-blocked (configurable on/off)

**WordPress Admin Setting:**

```
Settings → Bookings → Calendar

┌─────────────────────────────────────────┐
│ UK Bank Holidays                        │
├─────────────────────────────────────────┤
│ ☑ Automatically block UK bank holidays  │
│                                         │
│ When enabled, customers cannot book on: │
│ • New Year's Day                        │
│ • Good Friday                           │
│ • Easter Monday                         │
│ • Early May Bank Holiday                │
│ • Spring Bank Holiday                   │
│ • Summer Bank Holiday                   │
│ • Christmas Day                         │
│ • Boxing Day                            │
│                                         │
│ [Save Changes]                          │
└─────────────────────────────────────────┘
```

**Calendar Display:**

If 26 May 2026 is a UK Bank Holiday (Spring Bank Holiday):

```
Calendar:
  26  ← Grey, unclickable, shows "✕" symbol

Tooltip on hover:
  "Spring Bank Holiday - No bookings available"
```

**Backend Check:**

```php
function is_date_available($date, $staff_id) {
    // Check 1: Is it a UK bank holiday?
    if (get_setting('uk_bank_holidays_enabled') === true) {
        if (is_uk_bank_holiday($date)) {
            return false;
        }
    }
    
    // Check 2: Is staff working this day?
    if (!staff_has_working_hours($staff_id, $date)) {
        return false;
    }
    
    // Check 3: Is staff blocked this day? (vacation)
    if (staff_is_blocked($staff_id, $date)) {
        return false;
    }
    
    // Check 4: Does staff have ANY open slots?
    $slots = get_available_time_slots($staff_id, $date, $service_duration, $service_buffer);
    if (empty($slots)) {
        return false;
    }
    
    return true;
}

function is_uk_bank_holiday($date) {
    global $wpdb;
    $result = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}bookings_holiday_dates 
         WHERE date = %s AND country = 'GB'",
        $date
    ));
    return $result > 0;
}
```

---

### **3.9: Error States - Date & Time Selection**

#### **Error State 1: No Dates Available in Next 30 Days**

**Scenario:** Emma is on vacation for entire month, or fully booked.

**Displayed:**

```
┌─────────────────────────────────────┐
│ 📅 No Availability                  │
│                                     │
│ Emma Thompson has no available      │
│ dates in the next 30 days.          │
│                                     │
│ Would you like to:                  │
│                                     │
│ [← Choose Another Staff Member]     │
│                                     │
│ Or contact us to check availability │
│ beyond 30 days:                     │
│ 📞 020 1234 5678                    │
│                                     │
└─────────────────────────────────────┘
```

---

#### **Error State 2: Selected Time No Longer Available**

**Scenario:** 
1. Customer viewing times for 15 May at 2:00 PM
2. Another customer books 2:00 PM slot while first customer is deciding
3. First customer clicks "2:00 PM" button

**Displayed (Modal Popup):**

```
┌─────────────────────────────────────┐
│ ⚠️ Time No Longer Available         │
│                                     │
│ Someone else just booked this time. │
│                                     │
│ Please choose another time slot.   │
│                                     │
│ [OK, Show Updated Times]            │
└─────────────────────────────────────┘
```

**After clicking OK:**
- Modal closes
- Time slots refresh (AJAX call)
- 2:00 PM button disappears
- Other available times shown

**Technical Implementation:**

```php
// When customer clicks time slot, validate it's still available
function validate_time_slot($staff_id, $date, $time, $duration, $buffer) {
    // Re-check availability in database
    $existing_bookings = get_staff_bookings($staff_id, $date);
    
    foreach ($existing_bookings as $booking) {
        if (times_overlap($time, calculate_end_time($time, $duration, $buffer),
                         $booking['start_time'], $booking['end_time'])) {
            return ['available' => false, 'message' => 'Time no longer available'];
        }
    }
    
    return ['available' => true];
}
```

**Race Condition Prevention:**

When customer proceeds to Step 4 (contact details), we:
1. Create a temporary "hold" on the time slot (5 minutes)
2. If payment not completed within 5 minutes, release the hold
3. Other customers see slot as unavailable during hold period

**Database Implementation:**

```sql
ALTER TABLE wp_bookings_appointments
ADD COLUMN held_until DATETIME DEFAULT NULL;

-- Index for cleanup
CREATE INDEX idx_held_until ON wp_bookings_appointments(held_until);
```

**Cron job to release expired holds:**

```php
// Runs every 5 minutes
function release_expired_booking_holds() {
    global $wpdb;
    $wpdb->query("
        DELETE FROM {$wpdb->prefix}bookings_appointments
        WHERE status = 'held'
        AND held_until < NOW()
    ");
}
```

**Question for You:**

**Booking hold duration - what's appropriate?**

**Option A: 5 minutes** (tight, encourages fast checkout)
**Option B: 10 minutes** (reasonable for most customers)  
**Option C: 15 minutes** (generous, but slot locked longer)

**My Recommendation: Option B (10 minutes)** - enough time to fill out form and pay, not too long to block other customers.

**Your preference?**

---

### **3.10: Loading States - Time Slots**

**When customer clicks a date (e.g., 15 May):**

```
Available Times:

[Loading spinner]
Checking Emma's availability...
```

**After 1-2 seconds (AJAX response):**

```
Available Times:

Morning
[9:00 AM]  [9:45 AM]  [10:30 AM]

Afternoon
[2:00 PM]  [2:45 PM]

Evening
[5:00 PM]
```

**Performance Optimization:**

- **Pre-load:** When calendar loads, fetch availability for today + next 7 days
- **Cache:** Store results in session for 2 minutes (reduce DB queries)
- **Lazy load:** Only fetch other dates when customer clicks them

---

### **3.11: Mobile Responsive Behavior**

**Calendar:**
- Full width (320px minimum)
- Day cells: 40px × 40px touch target (minimum for accessibility)
- Swipe left/right to change months (touch gesture support)

**Time Slots:**
- 2 columns on mobile (160px each)
- 3 columns on tablet (240px each)
- Full width buttons on very small screens (<360px)

**Touch Interactions:**
- Tap calendar date → Smooth scroll to time slots
- Tap time slot → Highlights, shows checkmark
- Tap again → Deselects

---

### **3.12: Accessibility - Calendar & Time Slots**

**Keyboard Navigation:**

1. Focus on calendar month header
2. `Tab` → Focus on "←" previous month button
3. `Tab` → Focus on first available date
4. `Arrow keys` → Navigate between dates
5. `Enter` → Select date, jump to time slots
6. `Tab` → Focus on first time slot
7. `Arrow keys` → Navigate between time slots
8. `Enter` → Select time slot

**Screen Reader:**

```
"Calendar for May 2026"
"Today is Thursday, 15 May 2026"
"7 May, available, Monday"
"26 May, unavailable, Spring Bank Holiday, Monday"

"Available times for Thursday, 15 May 2026"
"Morning section"
"9:00 AM, available, button"
"Time selected: 2:00 PM"
```

**ARIA Live Regions:**

```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Announces when time slots load: -->
  <span id="time-slots-status">
    6 times available for Thursday, 15 May
  </span>
</div>
```

---

### **3.13: Data Validation - Frontend**

**Before allowing customer to proceed to Step 4:**

```javascript
function validateDateTimeSelection() {
    const selectedDate = getSelectedDate();
    const selectedTime = getSelectedTime();
    
    // Validation 1: Date selected?
    if (!selectedDate) {
        showError("Please select a date");
        return false;
    }
    
    // Validation 2: Time selected?
    if (!selectedTime) {
        showError("Please select a time");
        return false;
    }
    
    // Validation 3: Not in the past?
    const selectedDateTime = new Date(selectedDate + ' ' + selectedTime);
    if (selectedDateTime < new Date()) {
        showError("Cannot book in the past");
        return false;
    }
    
    // Validation 4: Within booking window?
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + bookingWindowDays);
    if (selectedDateTime > maxDate) {
        showError("Date is outside booking window");
        return false;
    }
    
    return true;
}
```

---

### **3.14: Session Data Update**

**When customer selects time and clicks "Continue":**

```php
$_SESSION['booking_data'] = [
    // Previous data from Step 2:
    'service_id' => 3,
    'service_name' => 'Women\'s Haircut',
    'service_duration' => 45,
    'service_buffer' => 15,
    'staff_id' => 1,
    'staff_name' => 'Emma Thompson',
    'staff_price' => 45.00,
    'staff_preference' => 'specific',
    
    // New data from Step 3:
    'booking_date' => '2026-05-15',
    'booking_time' => '14:00',
    'booking_end_time' => '14:45', // Calculated: start + duration
    'booking_display_date' => 'Thursday, 15 May 2026',
    'booking_display_time' => '2:00 PM',
    
    'step_completed' => 3
];
```

---

## 🎯 STEP 3 COMPLETE - Summary

**We've defined:**
- ✅ Calendar layout (month view, day states)
- ✅ Time slot generation logic (working hours, existing bookings, blocked time)
- ✅ Time slot display (grouped by morning/afternoon/evening)
- ✅ UK bank holiday blocking (configurable)
- ✅ Race condition handling (booking holds, 10-minute expiry)
- ✅ Same-day booking lead time (configurable global setting)
- ✅ Error states (no availability, slot taken)
- ✅ Loading states and performance optimization
- ✅ Mobile responsiveness (swipe gestures, touch targets)
- ✅ Accessibility (keyboard navigation, screen reader support)

**Open Questions:**

1. **Same-day booking lead time:** Option C (global setting) preferred?
2. **Booking hold duration:** Option B (10 minutes) preferred?

**Confirm these, and we'll move to:**

## STEP 4: Contact Details & Payment

This will cover:
- Customer information form
- Email/phone validation
- Marketing consent (GDPR)
- Payment processing (Stripe/PayPal)
- Special requests field
- Guest vs registered account flow

**Ready to proceed?**

# ✅ Decisions Locked - Step 3 Finalized

**Same-day lead time:** Global configurable setting  
**Booking hold:** 10 minutes default, configurable in WP Admin  
**Race condition:** Let me analyze and propose better options...

---

## Race Condition Prevention - Analysis & Better Options

### **Current Approach (Booking Holds):**

**Pros:**
- ✅ Prevents double-bookings during checkout
- ✅ Gives customer time to complete payment

**Cons:**
- ❌ Blocks slot from other customers (poor UX if customer abandons)
- ❌ Requires cleanup cron job (complexity)
- ❌ Database writes on every step progression
- ❌ What if customer's browser crashes? Slot locked for 10 minutes

---

### **Better Option 1: Optimistic Locking with Database Constraint** ⭐ **RECOMMENDED**

**How it works:**

1. **No "hold" during browsing/form filling**
   - Customer browses freely, no slot reservation
   - Other customers see real-time availability

2. **Lock at final moment (payment submission)**
   - Customer clicks "Pay Now"
   - Backend attempts to create booking with `status='pending_payment'`
   - Database UNIQUE constraint prevents duplicates:
     ```sql
     UNIQUE KEY unique_booking (staff_id, booking_date, start_time)
     ```

3. **If constraint violated (someone else booked first)**
   - Payment rejected BEFORE charging customer
   - Show error: "This time was just booked. Please choose another."
   - Return to Step 3 with refreshed availability

4. **If successful**
   - Booking created with `status='pending_payment'`
   - Payment processed (Stripe/PayPal)
   - If payment succeeds → `status='confirmed'`
   - If payment fails → Delete booking immediately, slot released

**Pros:**
- ✅ No artificial slot blocking
- ✅ No cleanup cron jobs needed
- ✅ Database constraint guarantees no double-bookings
- ✅ Simpler code, fewer edge cases
- ✅ Better UX (slots available until someone actually books)

**Cons:**
- ⚠️ Small chance customer fills form, then gets "slot taken" error
- ⚠️ Requires customer to re-select time (frustrating)

**Mitigation for Cons:**
- Show real-time availability indicator: "3 people viewing this time" (optional, Phase 2)
- Auto-refresh time slots every 30 seconds while on Step 3
- Pre-validate slot availability before showing payment form

---

### **Better Option 2: Hybrid Approach (Soft Hold + Hard Lock)**

**How it works:**

1. **Soft hold when time selected (Step 3 → Step 4)**
   - Create temporary record: `wp_bookings_soft_holds`
   - NOT enforced by database constraint
   - Just a visual indicator for other customers
   - Expires in 5 minutes (short window)

2. **Hard lock when payment initiated**
   - Customer clicks "Pay Now"
   - Create actual booking with `status='pending_payment'`
   - Database UNIQUE constraint enforced
   - If fails → "Slot taken" error

3. **Display logic for other customers:**
   - If slot has soft hold <5 min old → Show as "⚠️ Someone is booking this"
   - Customer can still click it (override soft hold)
   - First person to pay wins

**Pros:**
- ✅ Gives "social proof" (others see slot being considered)
- ✅ Reduces collisions (customers avoid "contested" slots)
- ✅ Database constraint still prevents actual double-bookings
- ✅ Short soft hold (5 min) minimizes UX impact

**Cons:**
- ⚠️ More complex than Option 1
- ⚠️ Still needs cleanup for abandoned soft holds
- ⚠️ Might confuse customers ("Why can I book if someone else is?")

---

### **Better Option 3: Stripe Payment Intent Reservation** (If using Stripe only)

**How it works:**

1. **Create Payment Intent at Step 3 (time selection)**
   - Customer selects time → Backend creates Stripe Payment Intent
   - Payment Intent has 24-hour expiration (Stripe feature)
   - Store `payment_intent_id` in session

2. **Customer fills form (Step 4)**
   - No database booking yet
   - Just collecting contact details

3. **Payment submission**
   - Use existing Payment Intent
   - Confirm payment
   - If successful → Create booking atomically
   - Database constraint ensures no duplicate

4. **Stripe handles race condition:**
   - If two Payment Intents try to charge same card simultaneously
   - Stripe's idempotency keys prevent double-charge
   - Second attempt fails gracefully

**Pros:**
- ✅ Leverages Stripe's built-in race condition handling
- ✅ Payment Intent expires automatically (no cron cleanup)
- ✅ Can cancel Payment Intent if customer abandons

**Cons:**
- ❌ Only works if 100% of customers use Stripe (not PayPal or pay-on-arrival)
- ❌ Creates Payment Intent even if customer abandons (Stripe API calls cost)
- ❌ Still doesn't prevent time slot collision (two customers can create intents for same slot)

---

## **My Recommendation: Option 1 (Optimistic Locking)**

Here's why:

### **Implementation:**

**Database Schema (already defined, just emphasizing):**

```sql
-- In wp_bookings_appointments table:
UNIQUE KEY unique_booking (staff_id, booking_date, start_time)
```

**Backend Flow:**

```php
// Step 4 → Payment submission
function create_booking_and_process_payment($booking_data, $payment_data) {
    global $wpdb;
    
    // Step 1: Validate slot is still available (pre-check, not enforced)
    $is_available = validate_time_slot_available(
        $booking_data['staff_id'],
        $booking_data['booking_date'],
        $booking_data['start_time']
    );
    
    if (!$is_available) {
        return [
            'success' => false,
            'error' => 'slot_unavailable',
            'message' => 'This time was just booked by someone else. Please choose another time.'
        ];
    }
    
    // Step 2: Start transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Step 3: Create booking with status='pending_payment'
        $booking_id = $wpdb->insert(
            $wpdb->prefix . 'bookings_appointments',
            [
                'customer_id' => $booking_data['customer_id'],
                'staff_id' => $booking_data['staff_id'],
                'service_id' => $booking_data['service_id'],
                'booking_date' => $booking_data['booking_date'],
                'start_time' => $booking_data['start_time'],
                'end_time' => $booking_data['end_time'],
                'status' => 'pending_payment',
                'price' => $booking_data['price'],
                // ... other fields
            ]
        );
        
        if (!$booking_id) {
            // Check if UNIQUE constraint violation
            if (strpos($wpdb->last_error, 'unique_booking') !== false) {
                throw new Exception('slot_unavailable');
            }
            throw new Exception('database_error');
        }
        
        // Step 4: Process payment (Stripe/PayPal)
        $payment_result = process_payment($payment_data, $booking_id);
        
        if (!$payment_result['success']) {
            // Payment failed - rollback and delete booking
            $wpdb->query('ROLLBACK');
            return [
                'success' => false,
                'error' => 'payment_failed',
                'message' => $payment_result['message']
            ];
        }
        
        // Step 5: Update booking status to 'confirmed'
        $wpdb->update(
            $wpdb->prefix . 'bookings_appointments',
            ['status' => 'confirmed', 'payment_status' => 'deposit_paid'],
            ['id' => $booking_id]
        );
        
        // Step 6: Commit transaction
        $wpdb->query('COMMIT');
        
        return [
            'success' => true,
            'booking_id' => $booking_id,
            'payment_id' => $payment_result['payment_id']
        ];
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        
        if ($e->getMessage() === 'slot_unavailable') {
            return [
                'success' => false,
                'error' => 'slot_unavailable',
                'message' => 'This time was just booked. Please choose another.'
            ];
        }
        
        return [
            'success' => false,
            'error' => 'unknown_error',
            'message' => 'Booking failed. Please try again.'
        ];
    }
}
```

**Frontend Handling:**

```javascript
// When customer clicks "Pay Now"
async function submitPayment() {
    showLoadingSpinner("Processing payment...");
    
    const result = await fetch('/wp-json/bookings/v1/create-booking', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
    
    if (!result.success) {
        if (result.error === 'slot_unavailable') {
            // Specific handling for race condition
            showErrorModal(
                "Time No Longer Available",
                "Someone else just booked this time. We'll help you pick another.",
                () => {
                    // Return to Step 3, refresh availability
                    goToStep3();
                    refreshTimeSlots();
                }
            );
        } else if (result.error === 'payment_failed') {
            showErrorModal("Payment Failed", result.message);
        } else {
            showErrorModal("Booking Failed", "Please try again.");
        }
    } else {
        // Success - redirect to confirmation page
        window.location.href = '/booking-confirmed?id=' + result.booking_id;
    }
}
```

---

### **Additional Safety: Real-Time Availability Refresh**

**To minimize race condition chances:**

**Auto-refresh time slots every 30 seconds on Step 3:**

```javascript
// On Step 3 (date/time selection)
let refreshInterval;

function startAvailabilityMonitoring() {
    refreshInterval = setInterval(() => {
        const selectedDate = getSelectedDate();
        if (selectedDate) {
            refreshTimeSlotsInBackground(selectedDate);
        }
    }, 30000); // 30 seconds
}

function refreshTimeSlotsInBackground(date) {
    fetch(`/wp-json/bookings/v1/availability?date=${date}&staff=${staffId}`)
        .then(response => response.json())
        .then(data => {
            updateTimeSlotButtons(data.available_slots);
        });
}

function updateTimeSlotButtons(availableSlots) {
    const allButtons = document.querySelectorAll('.time-slot-btn');
    
    allButtons.forEach(button => {
        const time = button.dataset.time;
        const isAvailable = availableSlots.includes(time);
        
        if (!isAvailable && !button.classList.contains('disabled')) {
            // Slot was just booked by someone else
            button.classList.add('disabled');
            button.disabled = true;
            button.innerHTML = 'Just Booked ✕';
            
            // If customer had this selected, alert them
            if (button.classList.contains('selected')) {
                showToast("The time you selected was just booked. Please choose another.");
                button.classList.remove('selected');
            }
        }
    });
}

// Clean up interval when leaving Step 3
function stopAvailabilityMonitoring() {
    clearInterval(refreshInterval);
}
```

---

## Updated Database Schema & WP Admin Settings

### **1. Remove Booking Hold Fields (Not Needed with Option 1)**

~~`held_until DATETIME`~~ - DELETE THIS FIELD (not using holds)

### **2. Add Settings for Configurability**

```sql
-- Add to wp_bookings_settings table:
ALTER TABLE wp_bookings_settings
ADD COLUMN same_day_lead_time_hours INT UNSIGNED DEFAULT 1
    AFTER timezone;

-- Note: booking_hold_minutes removed (not needed with optimistic locking)
```

---

### **3. WordPress Admin UI - New Settings**

```
Settings → Bookings → Calendar

┌─────────────────────────────────────────────────────┐
│ Booking Lead Time                                   │
├─────────────────────────────────────────────────────┤
│ Minimum notice required for same-day bookings:     │
│                                                     │
│ [2] hours                                           │
│                                                     │
│ Customers must book at least this many hours in    │
│ advance. For example, if it's 1:00 PM, the first   │
│ available slot will be 3:00 PM.                    │
│                                                     │
│ Recommended: 1-2 hours for most services           │
│                                                     │
│ [Save Changes]                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Real-Time Availability                              │
├─────────────────────────────────────────────────────┤
│ ☑ Auto-refresh time slots every 30 seconds         │
│                                                     │
│ When enabled, available times update automatically │
│ while customers are booking, reducing the chance   │
│ of selecting a time that's just been booked.       │
│                                                     │
│ [Save Changes]                                      │
└─────────────────────────────────────────────────────┘
```

---

## Race Condition - Final Decision

**Do you approve Option 1 (Optimistic Locking)?**

**Summary:**
- ✅ Database UNIQUE constraint prevents double-bookings
- ✅ No artificial slot holds (better UX)
- ✅ 30-second auto-refresh reduces collisions
- ✅ Clean error handling if slot taken
- ⚠️ Small chance customer sees "slot unavailable" after form fill (acceptable tradeoff)

**Alternative:** If you prefer Option 2 (Hybrid with soft holds), I can spec that out instead.

**Your decision?**

Once confirmed, we'll proceed to:

## STEP 4: Contact Details & Payment Form

This will cover:
- Customer information fields
- Email/phone validation
- Marketing consent (GDPR)
- Special requests text field
- Payment method selection (Stripe/PayPal/Pay-on-Arrival)
- Payment processing flow
- Error handling for payment failures

**Ready to proceed with Step 4?**

# ✅ Option 1 Approved - Optimistic Locking with Database Constraint

Perfect! This is the cleanest, most scalable approach.

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

## POST-BOOKING FLOWS

### **5.1: Email System Architecture**

**Email Types:**
1. **Transactional Emails** (always sent, critical):
   - Booking confirmation
   - Booking reminder (24hrs before)
   - Booking cancelled
   - Booking rescheduled
   
2. **Operational Emails** (staff/business owner):
   - New booking notification (to staff)
   - Cancellation notification (to staff)
   - Customer rescheduled (to staff)

3. **Marketing Emails** (optional, consent-based) - Phase 2:
   - Special offers
   - Newsletters

---

### **5.2: Email Template System**

**From ScopeDefinition:**
> Table: `wp_bookings_email_templates`

**Pre-loaded Templates:**

```sql
INSERT INTO wp_bookings_email_templates (type, subject, body, enabled) VALUES
('booking_confirmation', 
 'Your booking with {business_name} is confirmed',
 '<!-- HTML template with variables -->',
 1),
 
('booking_reminder',
 'Reminder: Your appointment tomorrow at {business_name}',
 '<!-- HTML template -->',
 1),
 
('booking_cancelled',
 'Your booking has been cancelled',
 '<!-- HTML template -->',
 1),
 
('booking_rescheduled',
 'Your booking has been rescheduled',
 '<!-- HTML template -->',
 1),
 
('staff_new_booking',
 'New booking: {customer_name} - {service_name}',
 '<!-- HTML template -->',
 1);
```

**Variable System:**

Available variables for all templates:
- `{customer_first_name}` - Sarah
- `{customer_last_name}` - Johnson
- `{customer_email}` - sarah.j@email.com
- `{customer_phone}` - 07700 900123
- `{service_name}` - Women's Haircut
- `{service_duration}` - 45 minutes
- `{staff_name}` - Emma Thompson
- `{booking_date}` - Thursday, 15 May 2026
- `{booking_time}` - 2:00 PM
- `{booking_end_time}` - 2:45 PM
- `{business_name}` - Shine & Style Hair Studio
- `{business_address}` - 123 High Street, London
- `{business_phone}` - 020 1234 5678
- `{business_email}` - info@salon.com
- `{price_total}` - £45.00
- `{price_deposit}` - £20.00
- `{price_balance}` - £25.00
- `{cancel_link}` - Magic link URL
- `{reschedule_link}` - Magic link URL
- `{view_booking_link}` - Customer portal URL

---

### **5.3: Confirmation Email - Detailed Specification**

**Sent:** Immediately after booking created (within 1 minute)

**Subject:** `Your booking with {business_name} is confirmed`

**From:** `{business_name} <noreply@yourdomain.com>` (configurable)

**Reply-To:** `{business_email}` (so customer can reply to business)

**HTML Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Client Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="{business_logo_url}" alt="{business_name}" style="max-width: 200px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Success Icon -->
                    <tr>
                        <td align="center" style="padding: 0 40px 20px 40px;">
                            <div style="width: 60px; height: 60px; background-color: #10B981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <span style="color: #ffffff; font-size: 30px;">✓</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Heading -->
                    <tr>
                        <td align="center" style="padding: 0 40px 10px 40px;">
                            <h1 style="margin: 0; font-size: 28px; color: #1F2937;">Booking Confirmed!</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <p style="margin: 0; font-size: 16px; color: #6B7280;">
                                Hi {customer_first_name}, your appointment is confirmed.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Booking Details Box -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; border-radius: 8px; border-left: 4px solid #3B82F6;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1F2937;">
                                            {service_name}
                                        </h2>
                                        
                                        <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 15px;">
                                            <strong>📅 Date:</strong> {booking_date}
                                        </p>
                                        
                                        <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 15px;">
                                            <strong>🕐 Time:</strong> {booking_time} - {booking_end_time} ({service_duration})
                                        </p>
                                        
                                        <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 15px;">
                                            <strong>👤 With:</strong> {staff_name}
                                        </p>
                                        
                                        <p style="margin: 0; color: #4B5563; font-size: 15px;">
                                            <strong>📍 Location:</strong> {business_address}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Payment Summary (if deposit paid) -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                        <span style="color: #4B5563; font-size: 15px;">Total cost:</span>
                                        <span style="float: right; color: #1F2937; font-size: 15px; font-weight: bold;">{price_total}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                        <span style="color: #4B5563; font-size: 15px;">Deposit paid:</span>
                                        <span style="float: right; color: #10B981; font-size: 15px; font-weight: bold;">{price_deposit} ✓</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <span style="color: #4B5563; font-size: 15px;">Balance due on arrival:</span>
                                        <span style="float: right; color: #1F2937; font-size: 15px; font-weight: bold;">{price_balance}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Action Buttons -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <!-- Add to Calendar Button -->
                                    <td style="padding: 0 5px;">
                                        <a href="{add_to_calendar_link}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">
                                            📅 Add to Calendar
                                        </a>
                                    </td>
                                    
                                    <!-- View Receipt Button -->
                                    <td style="padding: 0 5px;">
                                        <a href="{view_receipt_link}" style="display: inline-block; padding: 12px 24px; background-color: #6B7280; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">
                                            🧾 View Receipt
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Cancellation Policy -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 6px;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400E; font-weight: 600;">
                                    Cancellation Policy
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #78350F;">
                                    Free cancellation up to 24 hours before your appointment. 
                                    Late cancellations may forfeit the deposit.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Cancel/Reschedule Links -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 15px 0; font-size: 15px; color: #6B7280;">
                                Need to make changes?
                            </p>
                            <p style="margin: 0;">
                                <a href="{reschedule_link}" style="color: #3B82F6; text-decoration: none; font-size: 15px; margin-right: 15px;">
                                    Reschedule Booking
                                </a>
                                <span style="color: #D1D5DB;">|</span>
                                <a href="{cancel_link}" style="color: #EF4444; text-decoration: none; font-size: 15px; margin-left: 15px;">
                                    Cancel Booking
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280; text-align: center;">
                                Questions? Contact us at:
                            </p>
                            <p style="margin: 0 0 5px 0; font-size: 14px; color: #4B5563; text-align: center;">
                                📞 {business_phone} | ✉️ {business_email}
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                                {business_name}<br>
                                {business_address}
                            </p>
                            
                            <!-- NO "Powered by" in customer emails (from BusinessContext decision) -->
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version (for email clients that don't support HTML):**

```
BOOKING CONFIRMED

Hi {customer_first_name},

Your appointment is confirmed!

{service_name}
Date: {booking_date}
Time: {booking_time} - {booking_end_time} ({service_duration})
With: {staff_name}
Location: {business_address}

PAYMENT SUMMARY
Total: {price_total}
Deposit paid: {price_deposit} ✓
Balance due on arrival: {price_balance}

CANCELLATION POLICY
Free cancellation up to 24 hours before your appointment. Late cancellations may forfeit the deposit.

NEED TO MAKE CHANGES?
Reschedule: {reschedule_link}
Cancel: {cancel_link}

Add to Calendar: {add_to_calendar_link}
View Receipt: {view_receipt_link}

Questions? Contact us:
{business_phone}
{business_email}

{business_name}
{business_address}
```

---

### **5.4: "Add to Calendar" Link - iCal Format**

**When customer clicks "Add to Calendar":**

**Backend generates `.ics` file:**

```php
function generate_ical_file($booking_id) {
    $booking = get_booking($booking_id);
    
    $start_datetime = new DateTime($booking->booking_date . ' ' . $booking->start_time, new DateTimeZone('Europe/London'));
    $end_datetime = new DateTime($booking->booking_date . ' ' . $booking->end_time, new DateTimeZone('Europe/London'));
    
    $ical = "BEGIN:VCALENDAR\r\n";
    $ical .= "VERSION:2.0\r\n";
    $ical .= "PRODID:-//{$business_name}//Booking System//EN\r\n";
    $ical .= "CALSCALE:GREGORIAN\r\n";
    $ical .= "METHOD:PUBLISH\r\n";
    $ical .= "BEGIN:VEVENT\r\n";
    $ical .= "UID:booking-{$booking_id}@{$domain}\r\n";
    $ical .= "DTSTAMP:" . gmdate('Ymd\THis\Z') . "\r\n";
    $ical .= "DTSTART;TZID=Europe/London:" . $start_datetime->format('Ymd\THis') . "\r\n";
    $ical .= "DTEND;TZID=Europe/London:" . $end_datetime->format('Ymd\THis') . "\r\n";
    $ical .= "SUMMARY:{$booking->service_name} with {$booking->staff_name}\r\n";
    $ical .= "DESCRIPTION:Your appointment at {$business_name}\\n\\n";
    $ical .= "Service: {$booking->service_name}\\n";
    $ical .= "Staff: {$booking->staff_name}\\n";
    $ical .= "Balance due: £{$booking->balance_due}\\n\\n";
    $ical .= "Questions? Call {$business_phone}\r\n";
    $ical .= "LOCATION:{$business_address}\r\n";
    $ical .= "STATUS:CONFIRMED\r\n";
    $ical .= "SEQUENCE:0\r\n";
    
    // Add reminder (24 hours before)
    $ical .= "BEGIN:VALARM\r\n";
    $ical .= "TRIGGER:-PT24H\r\n";
    $ical .= "ACTION:DISPLAY\r\n";
    $ical .= "DESCRIPTION:Reminder: Appointment tomorrow at {$business_name}\r\n";
    $ical .= "END:VALARM\r\n";
    
    $ical .= "END:VEVENT\r\n";
    $ical .= "END:VCALENDAR\r\n";
    
    return $ical;
}

// Endpoint: /wp-json/bookings/v1/calendar/{booking_id}
function download_ical_file($booking_id) {
    $ical = generate_ical_file($booking_id);
    
    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename="booking-' . $booking_id . '.ics"');
    
    echo $ical;
    exit;
}
```

**Link in email:**

```
{add_to_calendar_link} = https://yoursite.com/wp-json/bookings/v1/calendar/{booking_id}?token={magic_token}
```

**Supported Calendar Apps:**
- ✅ Google Calendar (imports via .ics)
- ✅ Apple Calendar (iOS, macOS)
- ✅ Outlook (Desktop, Web)
- ✅ Thunderbird
- ✅ Any calendar app supporting iCal format

---

### **5.5: Reminder Email - Sent 24 Hours Before**

**Sent:** At 8:00 AM UK time, the day before appointment

**Example:** 
- Appointment: Thursday 15 May at 2:00 PM
- Reminder sent: Wednesday 14 May at 8:00 AM

**Exception - Same Day Bookings:**
- If customer books today for tomorrow and it's already past 8:00 AM → Send immediately
- If customer books today for today → Reminder sent immediately after confirmation

**Subject:** `Reminder: Your appointment tomorrow at {business_name}`

**HTML Template (Shorter than Confirmation):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="{business_logo_url}" alt="{business_name}" style="max-width: 180px;" />
                        </td>
                    </tr>
                    
                    <!-- Reminder Icon -->
                    <tr>
                        <td align="center" style="padding: 0 40px 20px 40px;">
                            <div style="width: 60px; height: 60px; background-color: #F59E0B; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <span style="color: #ffffff; font-size: 30px;">🔔</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Message -->
                    <tr>
                        <td align="center" style="padding: 0 40px 20px 40px;">
                            <h1 style="margin: 0; font-size: 24px; color: #1F2937;">
                                Appointment Reminder
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 0 40px 20px 40px;">
                            <p style="margin: 0; font-size: 16px; color: #6B7280;">
                                Hi {customer_first_name}, this is a reminder about your upcoming appointment.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Appointment Details -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #92400E;">
                                            Tomorrow at {booking_time}
                                        </h2>
                                        
                                        <p style="margin: 0 0 8px 0; color: #78350F; font-size: 15px;">
                                            <strong>Service:</strong> {service_name} ({service_duration})
                                        </p>
                                        
                                        <p style="margin: 0 0 8px 0; color: #78350F; font-size: 15px;">
                                            <strong>With:</strong> {staff_name}
                                        </p>
                                        
                                        <p style="margin: 0; color: #78350F; font-size: 15px;">
                                            <strong>Where:</strong> {business_address}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Balance Due Reminder (if applicable) -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 6px;">
                                <p style="margin: 0; font-size: 15px; color: #1E40AF;">
                                    <strong>💳 Payment Reminder:</strong> Please bring £{price_balance} to pay on arrival.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Action Buttons -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <p style="margin: 0 0 15px 0; font-size: 15px; color: #6B7280;">
                                Can't make it?
                            </p>
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 5px;">
                                        <a href="{reschedule_link}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px;">
                                            Reschedule
                                        </a>
                                    </td>
                                    <td style="padding: 0 5px;">
                                        <a href="{cancel_link}" style="display: inline-block; padding: 12px 24px; background-color: #EF4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px;">
                                            Cancel
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 14px; color: #6B7280; text-align: center;">
                                See you tomorrow!<br>
                                {business_name} • {business_phone}
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

### **5.6: Reminder Email - Cron Job Schedule**

**WordPress Cron Hook:**

```php
// Register cron schedule
add_action('wp', 'schedule_booking_reminders');

function schedule_booking_reminders() {
    if (!wp_next_scheduled('send_booking_reminders_cron')) {
        // Run daily at 8:00 AM UK time
        wp_schedule_event(
            strtotime('tomorrow 08:00:00'),
            'daily',
            'send_booking_reminders_cron'
        );
    }
}

// Hook the function
add_action('send_booking_reminders_cron', 'send_booking_reminders');

function send_booking_reminders() {
    global $wpdb;
    
    // Get tomorrow's date
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    
    // Find all confirmed bookings for tomorrow that haven't received reminder
    $bookings = $wpdb->get_results($wpdb->prepare("
        SELECT * FROM {$wpdb->prefix}bookings_appointments
        WHERE booking_date = %s
        AND status = 'confirmed'
        AND reminder_sent = 0
    ", $tomorrow));
    
    foreach ($bookings as $booking) {
        // Send reminder email
        $sent = send_reminder_email($booking->id);
        
        if ($sent) {
            // Mark as sent
            $wpdb->update(
                $wpdb->prefix . 'bookings_appointments',
                ['reminder_sent' => 1, 'reminder_sent_at' => current_time('mysql')],
                ['id' => $booking->id]
            );
        }
    }
}
```

**Database Field Addition:**

```sql
ALTER TABLE wp_bookings_appointments
ADD COLUMN reminder_sent BOOLEAN DEFAULT 0 AFTER magic_link_token,
ADD COLUMN reminder_sent_at DATETIME DEFAULT NULL AFTER reminder_sent;
```

---

### **5.7: Cancellation Process - Magic Link Flow**

**Customer clicks "Cancel Booking" link in email**

**Magic Link Format:**
```
https://yoursite.com/booking/cancel/{booking_id}?token={magic_link_token}
```

**Token Security:**
- Generated when booking created: `bin2hex(random_bytes(32))` (64 characters)
- Stored in: `wp_bookings_appointments.magic_link_token`
- Valid for: 90 days (longer than typical booking window)
- One-time use: No (same link works for reschedule too)

---

### **5.7.1: Cancellation Page - Step 1 (Confirmation)**

```
┌─────────────────────────────────────┐
│ [Client Logo]                       │
│                                     │
│ Cancel Your Booking                 │
├─────────────────────────────────────┤
│                                     │
│ You're about to cancel:             │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Women's Haircut             │   │
│ │ Thursday, 15 May 2026       │   │
│ │ 2:00 PM with Emma Thompson  │   │
│ │                             │   │
│ │ Total: £45.00               │   │
│ │ Deposit paid: £20.00        │   │
│ └─────────────────────────────┘   │
│                                     │
│ ⏱️ Cancellation Policy               │
│                                     │
│ • Time until appointment: 36 hours │
│ • Cancellation deadline: 24 hours  │
│                                     │
│ ✅ You can cancel free of charge.   │
│    Your £20.00 deposit will be     │
│    refunded within 3-5 business    │
│    days.                            │
│                                     │
│ Reason for cancellation (optional): │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Confirm Cancellation]              │
│ [← Go Back to Booking]              │
│                                     │
└─────────────────────────────────────┘
```

---

### **5.7.2: Cancellation - Late Cancellation Warning**

**If customer cancels <24 hours before appointment:**

```
┌─────────────────────────────────────┐
│ ⚠️ Late Cancellation Warning         │
├─────────────────────────────────────┤
│                                     │
│ • Time until appointment: 18 hours │
│ • Cancellation deadline: 24 hours  │
│                                     │
│ ❌ Late Cancellation Policy          │
│                                     │
│ According to our cancellation       │
│ policy, your £20.00 deposit may be │
│ non-refundable.                     │
│                                     │
│ Your refund request will be         │
│ reviewed and you'll be notified     │
│ within 1 business day.              │
│                                     │
│ Reason for cancellation:            │
│ ┌─────────────────────────────┐   │
│ │ (Please explain - helps us  │   │
│ │  consider your refund)      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ☐ I understand my deposit may be   │
│   non-refundable                    │
│                                     │
│ [Proceed with Cancellation]         │
│ [← Go Back]                         │
│                                     │
└─────────────────────────────────────┘
```

**Backend Logic:**

```php
function calculate_cancellation_policy($booking) {
    $now= new DateTime('now', new DateTimeZone('Europe/London'));
    $appointment = new DateTime(
        $booking->booking_date . ' ' . $booking->start_time,
        new DateTimeZone('Europe/London')
    );
    
    $hours_until = ($appointment->getTimestamp() - $now->getTimestamp()) / 3600;
    
    $policy_window = get_setting('cancellation_window_hours'); // e.g., 24
    
    if ($hours_until >= $policy_window) {
        // Within policy window - full refund
        return [
            'status' => 'within_policy',
            'hours_until' => round($hours_until, 1),
            'refund_type' => get_setting('refund_within_window'), // 'full', 'partial', 'none'
            'refund_percentage' => get_setting('refund_percentage'), // 100
            'refund_amount' => $booking->deposit_paid,
            'requires_approval' => false
        ];
    } else {
        // Late cancellation
        return [
            'status' => 'late_cancellation',
            'hours_until' => round($hours_until, 1),
            'refund_type' => get_setting('refund_outside_window'), // 'none', 'partial', etc.
            'refund_percentage' => 0, // or partial if configured
            'refund_amount' => 0,
            'requires_approval' => true // Business Owner must approve
        ];
    }
}
```

---

### **5.7.3: Cancellation Confirmed**

**After customer clicks "Confirm Cancellation":**

```
┌─────────────────────────────────────┐
│ ✅ Booking Cancelled                 │
├─────────────────────────────────────┤
│                                     │
│ Your booking has been cancelled.    │
│                                     │
│ We've sent a confirmation email to: │
│ sarah.j@email.com                   │
│                                     │
│ Refund Status:                      │
│ Your £20.00 deposit will be         │
│ refunded within 3-5 business days.  │
│                                     │
│ [Book Another Appointment]          │
│ [Return to Homepage]                │
│                                     │
└─────────────────────────────────────┘
```

**OR (Late Cancellation):**

```
┌─────────────────────────────────────┐
│ Booking Cancelled                   │
├─────────────────────────────────────┤
│                                     │
│ Your booking has been cancelled.    │
│                                     │
│ Refund Status:                      │
│ Your refund request is pending      │
│ review. We'll email you within 1    │
│ business day.                       │
│                                     │
│ Questions? Contact us:              │
│ 📞 020 1234 5678                    │
│                                     │
│ [Book Another Appointment]          │
│                                     │
└─────────────────────────────────────┘
```

---

### **5.7.4: Cancellation - Backend Processing**

```php
function process_booking_cancellation($booking_id, $cancellation_reason, $customer_ip) {
    global $wpdb;
    
    $booking = get_booking($booking_id);
    
    // Calculate policy
    $policy = calculate_cancellation_policy($booking);
    
    // Update booking status
    $wpdb->update(
        $wpdb->prefix . 'bookings_appointments',
        [
            'status' => 'cancelled',
            'cancelled_at' => current_time('mysql'),
            'cancelled_by' => 'customer',
            'cancellation_reason' => sanitize_textarea_field($cancellation_reason)
        ],
        ['id' => $booking_id]
    );
    
    // Handle refund
    if ($policy['status'] === 'within_policy' && $booking->deposit_paid > 0) {
        // Process automatic refund
        $refund_result = process_automatic_refund($booking);
        
        if ($refund_result['success']) {
            // Update payment status
            $wpdb->update(
                $wpdb->prefix . 'bookings_appointments',
                ['payment_status' => 'refunded'],
                ['id' => $booking_id]
            );
            
            // Log refund
            $wpdb->insert(
                $wpdb->prefix . 'bookings_payments',
                [
                    'appointment_id' => $booking_id,
                    'customer_id' => $booking->customer_id,
                    'amount' => -$booking->deposit_paid, // Negative = refund
                    'payment_method' => $booking->payment_method,
                    'transaction_id' => $refund_result['refund_id'],
                    'status' => 'completed',
                    'type' => 'refund',
                    'notes' => 'Automatic refund - cancellation within policy window',
                    'created_at' => current_time('mysql')
                ]
            );
        }
    } elseif ($policy['status'] === 'late_cancellation') {
        // Flag for manual review
        $wpdb->update(
            $wpdb->prefix . 'bookings_appointments',
            ['payment_status' => 'refund_pending'],
            ['id' => $booking_id]
        );
        
        // Notify Business Owner
        send_late_cancellation_notification($booking_id);
    }
    
    // Send cancellation emails
    send_cancellation_confirmation_email($booking_id); // To customer
    send_staff_cancellation_notification($booking_id); // To staff member
    
    // Remove from Google Calendar
    remove_from_google_calendar($booking_id);
    
    return [
        'success' => true,
        'policy' => $policy,
        'refund_processed' => ($policy['status'] === 'within_policy')
    ];
}

function process_automatic_refund($booking) {
    if ($booking->payment_method === 'stripe') {
        return process_stripe_refund($booking->payment_intent_id, $booking->deposit_paid);
    } elseif ($booking->payment_method === 'paypal') {
        return process_paypal_refund($booking->payment_intent_id, $booking->deposit_paid);
    } else {
        // pay_on_arrival - no refund needed
        return ['success' => true, 'refund_id' => null];
    }
}

function process_stripe_refund($payment_intent_id, $amount) {
    \Stripe\Stripe::setApiKey(get_setting('stripe_secret_key'));
    
    try {
        $refund = \Stripe\Refund::create([
            'payment_intent' => $payment_intent_id,
            'amount' => $amount * 100, // Convert to pence
        ]);
        
        return [
            'success' => true,
            'refund_id' => $refund->id
        ];
    } catch (\Exception $e) {
        error_log('Stripe refund failed: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}
```
# ✅ Continuing - Let's Finish Phase 2.2!

---

## 5.8: Rescheduling Process - Magic Link Flow

**Customer clicks "Reschedule Booking" link in email**

**Magic Link Format:**
```
https://yoursite.com/booking/reschedule/{booking_id}?token={magic_link_token}
```

**Same token as cancellation** (magic_link_token is multi-purpose)

---

### **5.8.1: Rescheduling Page - Step 1 (Current Booking)**

```
┌─────────────────────────────────────┐
│ [Client Logo]                       │
│                                     │
│ Reschedule Your Booking             │
├─────────────────────────────────────┤
│                                     │
│ Current Booking:                    │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Women's Haircut             │   │
│ │ Thursday, 15 May 2026       │   │
│ │ 2:00 PM with Emma Thompson  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ⏱️ Rescheduling Policy               │
│                                     │
│ • Time until appointment: 36 hours │
│ • Free rescheduling: ✅ Allowed     │
│                                     │
│ Your £20.00 deposit will transfer  │
│ to the new date and time.           │
│                                     │
│ [Continue to Choose New Time]       │
│ [← Cancel Instead]                  │
│                                     │
└─────────────────────────────────────┘
```

**OR (Late Rescheduling - <24 hours):**

```
┌─────────────────────────────────────┐
│ ⚠️ Late Rescheduling                 │
├─────────────────────────────────────┤
│                                     │
│ • Time until appointment: 18 hours │
│ • Rescheduling deadline: 24 hours  │
│                                     │
│ You're rescheduling within the      │
│ cancellation window. This may       │
│ require approval.                   │
│                                     │
│ Reason for rescheduling:            │
│ ┌─────────────────────────────┐   │
│ │ Please explain...           │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Continue to Choose New Time]       │
│                                     │
└─────────────────────────────────────┘
```

---

### **5.8.2: Rescheduling Page - Step 2 (Select New Date/Time)**

**Customer clicks "Continue to Choose New Time"**

**Reuses Step 3 calendar component** (from original booking flow):

```
┌─────────────────────────────────────┐
│ [← Back to Current Booking]         │
├─────────────────────────────────────┤
│ Rescheduling: Women's Haircut       │
│ with Emma Thompson                  │
│                                     │
│ Choose New Date & Time              │
├─────────────────────────────────────┤
│                                     │
│      ← May 2026 →                  │
│                                     │
│  Su  Mo  Tu  We  Th  Fr  Sa        │
│                   1   2   3        │
│   4   5   6   7   8   9  10        │
│  11  12  13  14  15  16  17        │
│  18  19  20 [21] 22  23  24        │
│  25  26  27  28  29  30  31        │
│                                     │
├─────────────────────────────────────┤
│ Selected: Wednesday, 21 May 2026    │
│                                     │
│ Available Times:                    │
│                                     │
│ Morning                             │
│ ┌──────────┐ ┌──────────┐         │
│ │ 10:00 AM │ │ 10:45 AM │         │
│ └──────────┘ └──────────┘         │
│                                     │
│ Afternoon                           │
│ ┌──────────┐ ┌──────────┐         │
│ │  3:00 PM │ │  3:45 PM │         │
│ └──────────┘ └──────────┘         │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ Old: Thu 15 May at 2:00 PM          │
│ New: Wed 21 May at 3:00 PM          │
│                                     │
│ [Confirm Reschedule]                │
│                                     │
└─────────────────────────────────────┘
```

---

### **5.8.3: Rescheduling Confirmation**

**After customer clicks "Confirm Reschedule":**

```
┌─────────────────────────────────────┐
│ ✅ Booking Rescheduled               │
├─────────────────────────────────────┤
│                                     │
│ Your appointment has been moved.    │
│                                     │
│ We've sent a confirmation email to: │
│ sarah.j@email.com                   │
│                                     │
│ New Appointment:                    │
│ ┌─────────────────────────────┐   │
│ │ Women's Haircut             │   │
│ │ Wednesday, 21 May 2026      │   │
│ │ 3:00 PM with Emma Thompson  │   │
│ │                             │   │
│ │ Your £20.00 deposit has     │   │
│ │ been transferred.           │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Add to Calendar] [View Booking]    │
│                                     │
└─────────────────────────────────────┘
```

---

### **5.8.4: Rescheduling - Backend Processing**

```php
function process_booking_reschedule($booking_id, $new_date, $new_time) {
    global $wpdb;
    
    $booking = get_booking($booking_id);
    
    // Step 1: Validate new time is available (optimistic locking)
    $is_available = validate_time_slot_available(
        $booking->staff_id,
        $new_date,
        $new_time
    );
    
    if (!$is_available) {
        return [
            'success' => false,
            'error' => 'slot_unavailable',
            'message' => 'This time is no longer available. Please choose another.'
        ];
    }
    
    // Step 2: Calculate new end time
    $new_end_time = calculate_end_time($new_time, $booking->duration_minutes);
    
    // Step 3: Store old booking details (for email)
    $old_date = $booking->booking_date;
    $old_time = $booking->start_time;
    
    // Step 4: Update booking atomically
    $wpdb->query('START TRANSACTION');
    
    try {
        $updated = $wpdb->update(
            $wpdb->prefix . 'bookings_appointments',
            [
                'booking_date' => $new_date,
                'start_time' => $new_time,
                'end_time' => $new_end_time,
                'status' => 'confirmed', // Keep confirmed (or 'rescheduled' if you want to track)
                'updated_at' => current_time('mysql')
            ],
            ['id' => $booking_id]
        );
        
        if ($updated === false) {
            // Check for UNIQUE constraint violation
            if (strpos($wpdb->last_error, 'unique_booking') !== false) {
                throw new Exception('slot_unavailable');
            }
            throw new Exception('database_error');
        }
        
        $wpdb->query('COMMIT');
        
        // Step 5: Update Google Calendar
        update_google_calendar_event($booking_id, $new_date, $new_time);
        
        // Step 6: Send confirmation emails
        send_reschedule_confirmation_email($booking_id, $old_date, $old_time);
        send_staff_reschedule_notification($booking_id, $old_date, $old_time);
        
        // Step 7: Reset reminder flag (so new reminder is sent 24hrs before new date)
        $wpdb->update(
            $wpdb->prefix . 'bookings_appointments',
            ['reminder_sent' => 0, 'reminder_sent_at' => NULL],
            ['id' => $booking_id]
        );
        
        return [
            'success' => true,
            'booking_id' => $booking_id,
            'old_date' => $old_date,
            'old_time' => $old_time,
            'new_date' => $new_date,
            'new_time' => $new_time
        ];
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        
        if ($e->getMessage() === 'slot_unavailable') {
            return [
                'success' => false,
                'error' => 'slot_unavailable',
                'message' => 'This time was just booked by someone else.'
            ];
        }
        
        return [
            'success' => false,
            'error' => 'unknown_error',
            'message' => 'Unable to reschedule. Please try again.'
        ];
    }
}
```

---

### **5.8.5: Rescheduling - Policy Check**

```php
function check_reschedule_policy($booking) {
    $now = new DateTime('now', new DateTimeZone('Europe/London'));
    $appointment = new DateTime(
        $booking->booking_date . ' ' . $booking->start_time,
        new DateTimeZone('Europe/London')
    );
    
    $hours_until = ($appointment->getTimestamp() - $now->getTimestamp()) / 3600;
    $policy_window = get_setting('cancellation_window_hours'); // e.g., 24
    
    $reschedule_allowed = get_setting('reschedule_allowed'); // true/false
    $reschedule_fee = get_setting('reschedule_fee'); // 0.00 or amount
    
    if (!$reschedule_allowed) {
        return [
            'allowed' => false,
            'reason' => 'Rescheduling is not permitted. Please cancel and create a new booking.'
        ];
    }
    
    if ($hours_until >= $policy_window) {
        // Within policy window - free reschedule
        return [
            'allowed' => true,
            'fee' => 0,
            'requires_approval' => false,
            'status' => 'within_policy'
        ];
    } else {
        // Late reschedule
        if ($reschedule_fee > 0) {
            return [
                'allowed' => true,
                'fee' => $reschedule_fee,
                'requires_approval' => false,
                'status' => 'late_with_fee',
                'message' => "Rescheduling within {$policy_window} hours incurs a £{$reschedule_fee} fee."
            ];
        } else {
            // No fee, but requires approval
            return [
                'allowed' => true,
                'fee' => 0,
                'requires_approval' => true,
                'status' => 'late_requires_approval',
                'message' => "Late rescheduling requires approval. We'll confirm within 24 hours."
            ];
        }
    }
}
```

---

## 5.9: Cancellation Confirmation Email (To Customer)

**Sent:** Immediately after cancellation processed

**Subject:** `Your booking has been cancelled`

**HTML Template (Brief):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Booking Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="{business_logo_url}" alt="{business_name}" style="max-width: 180px;" />
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 0 40px 20px 40px;">
                            <h1 style="margin: 0; font-size: 24px; color: #1F2937;">
                                Booking Cancelled
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <p style="margin: 0; font-size: 16px; color: #6B7280;">
                                Hi {customer_first_name},
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 16px; color: #6B7280;">
                                Your appointment has been cancelled:
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEE2E2; border-radius: 8px; border-left: 4px solid #EF4444;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0 0 5px 0; color: #991B1B; font-size: 15px;">
                                            <strong>{service_name}</strong>
                                        </p>
                                        <p style="margin: 0; color: #7F1D1D; font-size: 14px;">
                                            {booking_date} at {booking_time}<br>
                                            with {staff_name}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Refund Status -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 6px;">
                                <p style="margin: 0 0 5px 0; font-size: 15px; color: #1E40AF; font-weight: 600;">
                                    Refund Status
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #1E3A8A;">
                                    <!-- IF within policy: -->
                                    Your £{price_deposit} deposit will be refunded within 3-5 business days.
                                    
                                    <!-- IF late cancellation: -->
                                    <!-- Your refund request is under review. We'll email you within 1 business day. -->
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <a href="{book_again_link}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px;">
                                Book Another Appointment
                            </a>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 14px; color: #6B7280; text-align: center;">
                                We're sorry to see you go. Hope to see you again soon!<br>
                                {business_name} • {business_phone}
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 5.10: Reschedule Confirmation Email (To Customer)

**Subject:** `Your booking has been rescheduled`

**Key Difference from Cancellation Email:**
- Shows OLD date/time (crossed out)
- Shows NEW date/time (highlighted)
- Confirms deposit transferred

**HTML Template (Excerpt - Main Content):**

```html
<tr>
    <td style="padding: 0 40px 20px 40px;">
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #6B7280;">
            Hi {customer_first_name}, your appointment has been rescheduled.
        </p>
        
        <!-- Old Appointment (Struck Through) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEE2E2; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 15px;">
            <tr>
                <td style="padding: 15px;">
                    <p style="margin: 0; color: #991B1B; font-size: 14px; text-decoration: line-through;">
                        <strong>Previous:</strong> {old_date} at {old_time}
                    </p>
                </td>
            </tr>
        </table>
        
        <!-- New Appointment (Highlighted) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #D1FAE5; border-radius: 8px; border-left: 4px solid #10B981;">
            <tr>
                <td style="padding: 15px;">
                    <p style="margin: 0 0 5px 0; color: #065F46; font-size: 15px; font-weight: 600;">
                        <strong>✓ New Appointment</strong>
                    </p>
                    <p style="margin: 0 0 5px 0; color: #047857; font-size: 15px;">
                        {booking_date} at {booking_time}
                    </p>
                    <p style="margin: 0; color: #047857; font-size: 14px;">
                        {service_name} with {staff_name}
                    </p>
                </td>
            </tr>
        </table>
    </td>
</tr>

<tr>
    <td style="padding: 0 40px 20px 40px;">
        <p style="margin: 0; font-size: 14px; color: #6B7280;">
            Your £{price_deposit} deposit has been transferred to the new appointment.
        </p>
    </td>
</tr>

<tr>
    <td align="center" style="padding: 0 40px 30px 40px;">
        <a href="{add_to_calendar_link}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px;">
            📅 Add to Calendar
        </a>
    </td>
</tr>
```

---

## 5.11: Staff Notification Emails

### **5.11.1: New Booking Notification (To Staff)**

**Sent:** Immediately when customer books

**Subject:** `New booking: {customer_name} - {service_name}`

**HTML Template (Brief, Mobile-Optimized for Staff):**

```html
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #1F2937;">
                                📅 New Booking
                            </h2>
                            
                            <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #F3F4F6; border-radius: 6px;">
                                <tr>
                                    <td style="color: #6B7280; font-size: 14px; width: 100px;">
                                        <strong>Customer:</strong>
                                    </td>
                                    <td style="color: #1F2937; font-size: 14px;">
                                        {customer_first_name} {customer_last_name}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #6B7280; font-size: 14px;">
                                        <strong>Service:</strong>
                                    </td>
                                    <td style="color: #1F2937; font-size: 14px;">
                                        {service_name} ({service_duration})
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #6B7280; font-size: 14px;">
                                        <strong>Date & Time:</strong>
                                    </td>
                                    <td style="color: #1F2937; font-size: 14px;">
                                        {booking_date} at {booking_time}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #6B7280; font-size: 14px;">
                                        <strong>Contact:</strong>
                                    </td>
                                    <td style="color: #1F2937; font-size: 14px;">
                                        {customer_phone}<br>
                                        {customer_email}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #6B7280; font-size: 14px;" colspan="2">
                                        <strong>Special Requests:</strong><br>
                                        <span style="color: #1F2937;">{special_requests}</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; text-align: center;">
                                <a href="{view_dashboard_link}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px;">
                                    View in Dashboard
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Co-Branded Footer -->
                    <tr>
                        <td style="padding: 20px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                                Powered by [YourCompany]
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
```

**Note:** Staff emails **DO** include "Powered by [YourCompany]" (unlike customer emails)

---

### **5.11.2: Cancellation Notification (To Staff)**

**Subject:** `Cancelled: {customer_name} - {service_name} on {date}`

**Brief notification:**
- Customer name
- Service
- Original date/time
- Cancellation reason (if provided)
- "Your schedule has been updated"

---

### **5.11.3: Reschedule Notification (To Staff)**

**Subject:** `Rescheduled: {customer_name} moved to {new_date}`

**Shows:**
- Old date/time (struck through)
- New date/time (highlighted)
- "Your schedule and calendar have been updated"

---

## 5.12: Customer Account Creation (Optional - Post-Booking)

**From ScopeDefinition:**
> Customer accounts (optional, created AFTER first booking)

### **Flow:**

**Step 1: After first booking, customer receives follow-up email (24 hours later):**

**Subject:** `Create your account for easier booking`

**Email Content:**

```
Hi Sarah,

Thanks for booking with us! 

To make your next booking even easier, create an account to:
✓ View your booking history
✓ Manage upcoming appointments
✓ Rebook with one click
✓ Download past receipts

[Create My Account]

This is completely optional - you can always book as a guest.

Best,
{business_name}
```

**Link:** `https://yoursite.com/customer-portal/create-account?email={email}&token={token}`

---

**Step 2: Account Creation Page**

```
┌─────────────────────────────────────┐
│ Create Your Account                 │
├─────────────────────────────────────┤
│                                     │
│ Email: sarah.j@email.com ✓          │
│ (This email is already verified)    │
│                                     │
│ Create Password *                   │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│ At least 8 characters               │
│                                     │
│ Confirm Password *                  │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Create Account]                    │
│                                     │
│ Already have an account? [Log In]   │
│                                     │
└─────────────────────────────────────┘
```

---

**Step 3: Account Created - Redirect to Customer Portal**

```
┌─────────────────────────────────────┐
│ Welcome, Sarah!                     │
├─────────────────────────────────────┤
│                                     │
│ Your Bookings                       │
│                                     │
│ Upcoming                            │
│ ┌─────────────────────────────┐   │
│ │ Women's Haircut             │   │
│ │ Wed 21 May 2026 at 3:00 PM  │   │
│ │ with Emma Thompson          │   │
│ │                             │   │
│ │ [View] [Reschedule] [Cancel]│   │
│ └─────────────────────────────┘   │
│                                     │
│ Past Bookings (1)                   │
│ ┌─────────────────────────────┐   │
│ │ Women's Haircut             │   │
│ │ 15 Jan 2026 - Completed     │   │
│ │ [View Receipt] [Book Again] │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Book New Appointment]              │
│                                     │
└─────────────────────────────────────┘
```

---

## 5.13: Error Edge Cases - Summary

### **Email Delivery Failures**

**Problem:** Confirmation email bounces (invalid email address)

**Detection:**
- Webhook from transactional email service (SendGrid, Postmark)
- OR check bounce logs daily

**Handling:**
1. Flag booking in database: `email_failed = 1`
2. Business Owner dashboard shows alert: "⚠️ Email failed for Sarah Johnson"
3. Business Owner can:
   - Call customer directly (phone on file)
   - Resend to corrected email
   - Mark as "notified manually"

**Database Field:**

```sql
ALTER TABLE wp_bookings_appointments
ADD COLUMN email_failed BOOLEAN DEFAULT 0 AFTER reminder_sent_at;
```

---

### **Magic Link Expired/Invalid**

**Problem:** Customer clicks cancel/reschedule link after 90 days

**Handling:**

```
┌─────────────────────────────────────┐
│ ⚠️ Link Expired                      │
│                                     │
│ This link has expired for security  │
│ reasons.                            │
│                                     │
│ To manage your booking, please      │
│ contact us:                         │
│                                     │
│ 📞 020 1234 5678                    │
│ ✉️  info@salon.com                  │
│                                     │
│ Have your booking reference ready:  │
│ #12345                              │
│                                     │
└─────────────────────────────────────┘
```

---

### **Customer Tries to Cancel Already-Cancelled Booking**

**Problem:** Customer clicks cancel link twice

**Handling:**

```
┌─────────────────────────────────────┐
│ Already Cancelled                   │
│                                     │
│ This booking was already cancelled  │
│ on {cancelled_date}.                │
│                                     │
│ If you have questions about your    │
│ refund, please contact us.          │
│                                     │
│ [Book New Appointment]              │
│                                     │
└─────────────────────────────────────┘
```

---

### **Customer Tries to Reschedule Past Appointment**

**Problem:** Appointment was yesterday, customer clicks reschedule link today

**Handling:**

```
┌─────────────────────────────────────┐
│ Cannot Reschedule                   │
│                                     │
│ This appointment has already passed │
│ ({booking_date}).                   │
│                                     │
│ To book a new appointment:          │
│                                     │
│ [Book Now]                          │
│                                     │
└─────────────────────────────────────┘
```

---

## 5.14: Mobile Responsiveness - Final Specifications

**All post-booking flows must be mobile-optimized:**

### **Email Templates:**
- **Max width:** 600px (desktop), 100% (mobile <600px)
- **Touch targets:** Buttons minimum 44px height
- **Font sizes:** 
  - Headings: 24-28px (mobile), 28-32px (desktop)
  - Body: 15-16px (mobile), 16px (desktop)
  - Small text: 14px minimum
- **Images:** Responsive (`max-width: 100%; height: auto;`)

### **Cancellation/Reschedule Pages:**
- **Single column** on mobile (<768px)
- **Calendar:** Full-width, swipeable
- **Buttons:** Full-width on mobile, inline on desktop
- **Forms:** Large input fields (minimum 44px height)

---

## 🎯 PHASE 2.2 COMPLETE!

### **Final Deliverables Summary:**

**✅ Customer Booking Journey (Steps 1-4):**
1. Service selection (categories, multi-category support)
2. Staff selection (alphabetical, "No Preference" with configurable load-balancing)
3. Date & time selection (calendar, UK bank holidays, optimistic locking for race conditions)
4. Contact details & payment (validation, Stripe/PayPal/Pay-on-Arrival, GDPR consent)

**✅ Post-Booking Flows:**
5. Confirmation email (HTML template, iCal download, magic links)
6. Reminder email (24hrs before, cron job)
7. Cancellation flow (policy check, automatic/manual refunds)
8. Rescheduling flow (new date/time selection, deposit transfer)
9. Staff notification emails (new booking, cancellations, reschedules)
10. Customer account creation (optional, post-booking invitation)

**✅ Technical Decisions Locked:**
- Session storage (PHP $_SESSION)
- Optimistic locking (database UNIQUE constraint)
- UK phone numbers only
- Global same-day lead time (configurable)
- Email templates with variable system
- Magic links (90-day validity)

---
