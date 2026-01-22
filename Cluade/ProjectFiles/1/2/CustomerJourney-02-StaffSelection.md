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