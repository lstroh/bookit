# Sprint 1, Task 4: Date & Time Selection UI

## 🎯 OBJECTIVE
Build Step 3 of the booking wizard - a date/time picker with UK formatting, bank holiday blocking, real-time availability checking, and session persistence. This is the most complex UI task in Sprint 1.

## 📋 CONTEXT

### Sprint 1 Progress So Far
✅ **Task 1:** Booking wizard foundation (session manager, 4-step shell)  
✅ **Task 2:** Service selection UI  
✅ **Task 3:** Staff selection UI + PHPUnit tests  
⏳ **Task 4:** Date & Time Selection UI (CURRENT - 14 hours)

### What Customer Has Selected So Far
When reaching Step 3, the session contains:
- `service_id` - Selected service (from Task 2)
- `staff_id` - Selected staff or 0 for "No Preference" (from Task 3)

### Task 4 Requirements (56 hours in original plan, simplified to 14h Phase 1)

**PHASE 1 SCOPE (This Task - 14 hours):**
1. ✅ Calendar UI with UK date format (DD/MM/YYYY)
2. ✅ UK bank holiday blocking (fixed 2026 dates)
3. ✅ Past date prevention
4. ✅ Basic time slot display (15-minute increments)
5. ✅ Morning/Afternoon/Evening grouping
6. ✅ Date/time selection and session storage
7. ✅ "Continue" button to advance to Step 4

**PHASE 2 (Task 5 - Next Sprint):**
- Real-time availability calculation (28 hours)
- Working hours integration
- Buffer time (before/after appointments)
- Existing bookings check
- "No slots available" messaging

**IMPORTANT:** For this task, show ALL time slots as available. Availability logic is Task 5.

## 🗄️ DATABASE SCHEMA REMINDER

### wp_bookings_services
- `duration` (INT) - Service duration in minutes (e.g., 60, 30, 45)
- `buffer_before` (INT) - Minutes before appointment (e.g., 15)
- `buffer_after` (INT) - Minutes after appointment (e.g., 15)

### wp_bookings_staff_working_hours
```sql
CREATE TABLE wp_bookings_staff_working_hours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES wp_bookings_staff(id) ON DELETE CASCADE,
    INDEX idx_staff_schedule (staff_id, day_of_week, is_active)
);
```

### wp_bookings_sessions (existing - from Task 1)
```sql
booking_date DATE NULL,
booking_time TIME NULL  -- Start time (e.g., '14:00:00')
```

## 🎨 UI SPECIFICATION

### Calendar Component

**Layout (Mobile-First):**
```
┌─────────────────────────────────────────┐
│ ◀ May 2026 ▶                           │
├─────────────────────────────────────────┤
│ Mo  Tu  We  Th  Fr  Sa  Su             │
├─────────────────────────────────────────┤
│     1   2   3   4   5   6              │
│ 7   8   9  10  11  12  13              │
│ 14  15  16  17  18  19  20             │
│ 21  22  23  24  25  26  27             │
│ 28  29  30  31                         │
└─────────────────────────────────────────┘

Selected: Thursday, 15 May 2026

┌─────────────────────────────────────────┐
│ Morning                                 │
│ ┌──────────┐ ┌──────────┐              │
│ │  9:00 AM │ │  9:15 AM │              │
│ └──────────┘ └──────────┘              │
│ ┌──────────┐ ┌──────────┐              │
│ │  9:30 AM │ │  9:45 AM │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ Afternoon                               │
│ ┌──────────┐ ┌──────────┐              │
│ │  1:00 PM │ │  1:15 PM │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ Evening                                 │
│ ┌──────────┐ ┌──────────┐              │
│ │  5:00 PM │ │  5:15 PM │              │
│ └──────────┘ └──────────┘              │
└─────────────────────────────────────────┘

[Continue to Contact Details →]
```

**Date States:**
1. **Available** - Normal clickable date (default state for Phase 1)
2. **Today** - Highlighted border
3. **Selected** - Blue background
4. **Past date** - Disabled, greyed out, not clickable
5. **Bank holiday** - Disabled, red text, not clickable
6. **Other month** - Greyed out but visible for context

**Time Slot Grouping:**
- **Morning:** 00:00 - 11:59
- **Afternoon:** 12:00 - 16:59
- **Evening:** 17:00 - 23:59

### UK Bank Holidays 2026 (Hardcoded for Phase 1)
```javascript
const UK_BANK_HOLIDAYS_2026 = [
    '2026-01-01', // New Year's Day
    '2026-04-03', // Good Friday
    '2026-04-06', // Easter Monday
    '2026-05-04', // Early May bank holiday
    '2026-05-25', // Spring bank holiday
    '2026-08-31', // Summer bank holiday
    '2026-12-25', // Christmas Day
    '2026-12-28'  // Boxing Day (substitute)
];
```

**Note:** In Phase 2, this will be fetched from UK Government API.

## 🔨 IMPLEMENTATION REQUIREMENTS

### Files to Create

**1. includes/models/class-datetime-model.php**
```php
class BOOKIT_DateTime_Model {
    /**
     * Generate time slots for a given date (15-minute increments)
     * Phase 1: Return all slots 00:00-23:45 (no availability filtering yet)
     * 
     * @param string $date Date in Y-m-d format
     * @param int $service_id Service ID (for future availability check)
     * @param int $staff_id Staff ID or 0 for "No Preference"
     * @return array Array of time slots ['09:00:00', '09:15:00', ...]
     */
    public function generate_time_slots($date, $service_id, $staff_id) {
        // Phase 1: Generate all 15-min slots from 00:00 to 23:45
        // Return: ['00:00:00', '00:15:00', '00:30:00', ... '23:45:00']
        
        // Phase 2 (Task 5) will filter by:
        // - Staff working hours
        // - Existing bookings
        // - Service duration + buffers
    }
    
    /**
     * Check if date is a UK bank holiday
     * Phase 1: Hardcoded 2026 dates
     * 
     * @param string $date Date in Y-m-d format
     * @return bool
     */
    public function is_bank_holiday($date) {
        $holidays = [
            '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04',
            '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28'
        ];
        return in_array($date, $holidays);
    }
    
    /**
     * Check if date is in the past
     * 
     * @param string $date Date in Y-m-d format
     * @return bool
     */
    public function is_past_date($date) {
        return strtotime($date) < strtotime(date('Y-m-d'));
    }
    
    /**
     * Format time for display (24h → 12h with AM/PM)
     * 
     * @param string $time Time in H:i:s format (e.g., '14:00:00')
     * @return string Formatted time (e.g., '2:00 PM')
     */
    public function format_time_display($time) {
        return date('g:i A', strtotime($time));
    }
    
    /**
     * Group time slots by period (Morning/Afternoon/Evening)
     * 
     * @param array $time_slots Array of time strings
     * @return array ['morning' => [...], 'afternoon' => [...], 'evening' => [...]]
     */
    public function group_time_slots($time_slots) {
        $grouped = [
            'morning' => [],    // 00:00 - 11:59
            'afternoon' => [],  // 12:00 - 16:59
            'evening' => []     // 17:00 - 23:59
        ];
        
        foreach ($time_slots as $time) {
            $hour = (int)date('H', strtotime($time));
            
            if ($hour < 12) {
                $grouped['morning'][] = $time;
            } elseif ($hour < 17) {
                $grouped['afternoon'][] = $time;
            } else {
                $grouped['evening'][] = $time;
            }
        }
        
        return $grouped;
    }
}
```

**2. includes/api/class-datetime-api.php**
```php
class BOOKIT_DateTime_API {
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // GET /wp-json/bookit/v1/timeslots?date=2026-05-15
        // Returns: { success: true, slots: { morning: [...], afternoon: [...], evening: [...] } }
        
        // POST /wp-json/bookit/v1/datetime/select
        // Body: { date: '2026-05-15', time: '14:00:00' }
        // Returns: { success: true, message: 'Date and time saved' }
    }
    
    /**
     * GET timeslots endpoint
     * Validates date, checks if selectable, returns grouped slots
     */
    public function get_timeslots($request) {
        $date = $request->get_param('date');
        
        // Validate date format (Y-m-d)
        // Check if past date → return error
        // Check if bank holiday → return error
        // Generate time slots
        // Group by period
        // Return JSON
    }
    
    /**
     * POST select datetime endpoint
     * Saves to session, advances to step 4
     */
    public function select_datetime($request) {
        $date = $request->get_param('date');
        $time = $request->get_param('time');
        
        // Get session
        // Validate date + time
        // Save to session: booking_date, booking_time
        // Update current_step = 4
        // Return success
    }
}
```

**3. public/templates/booking-step-3-datetime.php**
```php
<?php
/**
 * Step 3: Date & Time Selection Template
 */

// Get session data
$session = BOOKIT_Session_Manager::get_session();
$service_id = $session['service_id'] ?? 0;
$staff_id = $session['staff_id'] ?? 0;

if (!$service_id) {
    echo '<p>Please select a service first.</p>';
    return;
}
?>

<div class="bookit-step-3">
    <h2>Choose Your Date & Time</h2>
    
    <!-- Calendar Component -->
    <div class="bookit-calendar-container">
        <div class="calendar-header">
            <button class="btn-prev-month" aria-label="Previous month">&larr;</button>
            <h3 class="current-month-year">May 2026</h3>
            <button class="btn-next-month" aria-label="Next month">&rarr;</button>
        </div>
        
        <div class="calendar-grid" role="grid" aria-label="Calendar">
            <!-- JavaScript will populate this -->
            <!-- Weekday headers: Mo Tu We Th Fr Sa Su -->
            <!-- Date cells with appropriate classes/states -->
        </div>
        
        <div class="selected-date-display" aria-live="polite">
            <!-- Shows: "Selected: Thursday, 15 May 2026" -->
        </div>
    </div>
    
    <!-- Time Slots -->
    <div class="bookit-timeslots-container" style="display: none;">
        <h3>Available Times for <span class="selected-date-text"></span></h3>
        
        <div class="timeslots-loading" aria-live="polite">
            <span>Loading available times...</span>
        </div>
        
        <div class="timeslots-content" style="display: none;">
            <!-- Morning Slots -->
            <div class="timeslot-period" data-period="morning">
                <h4>Morning</h4>
                <div class="timeslot-grid">
                    <!-- JS populates: <button class="timeslot" data-time="09:00:00">9:00 AM</button> -->
                </div>
            </div>
            
            <!-- Afternoon Slots -->
            <div class="timeslot-period" data-period="afternoon">
                <h4>Afternoon</h4>
                <div class="timeslot-grid"></div>
            </div>
            
            <!-- Evening Slots -->
            <div class="timeslot-period" data-period="evening">
                <h4>Evening</h4>
                <div class="timeslot-grid"></div>
            </div>
        </div>
        
        <div class="timeslots-error" style="display: none;" role="alert">
            <!-- Error messages -->
        </div>
    </div>
    
    <!-- Navigation -->
    <div class="bookit-step-navigation">
        <button class="btn-back" data-step="2">← Back to Staff</button>
        <button class="btn-continue" disabled data-step="4">Continue to Details →</button>
    </div>
</div>
```

**4. public/assets/js/datetime-picker.js**
```javascript
/**
 * Date & Time Picker - Booking Step 3
 */

class BookitDateTimePicker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.bankHolidays = [
            '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04',
            '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28'
        ];
        
        this.init();
    }
    
    init() {
        this.renderCalendar();
        this.attachEventListeners();
    }
    
    /**
     * Render calendar for current month
     */
    renderCalendar() {
        // Get first day of month, last day of month
        // Calculate grid: start from Monday (UK standard)
        // Generate date cells with classes:
        //   - .date-today (if today)
        //   - .date-past (if before today) + disabled
        //   - .date-holiday (if bank holiday) + disabled
        //   - .date-other-month (if not current month)
        //   - .date-selected (if clicked)
        
        // Insert into .calendar-grid
    }
    
    /**
     * Handle date click
     */
    handleDateClick(dateElement) {
        const date = dateElement.dataset.date; // Y-m-d format
        
        // Validation
        if (this.isPastDate(date)) {
            alert('Cannot book in the past');
            return;
        }
        
        if (this.isBankHoliday(date)) {
            alert('Bank holiday - unavailable');
            return;
        }
        
        // Update selected date
        this.selectedDate = date;
        
        // Update UI
        document.querySelectorAll('.date-cell').forEach(el => 
            el.classList.remove('date-selected')
        );
        dateElement.classList.add('date-selected');
        
        // Display selected date
        this.updateSelectedDateDisplay(date);
        
        // Load time slots
        this.loadTimeSlots(date);
    }
    
    /**
     * Load time slots via AJAX
     */
    loadTimeSlots(date) {
        const container = document.querySelector('.bookit-timeslots-container');
        const loading = container.querySelector('.timeslots-loading');
        const content = container.querySelector('.timeslots-content');
        
        // Show container + loading
        container.style.display = 'block';
        loading.style.display = 'block';
        content.style.display = 'none';
        
        // AJAX request
        fetch(`/wp-json/bookit/v1/timeslots?date=${date}`)
            .then(response => response.json())
            .then(data => {
                loading.style.display = 'none';
                
                if (data.success) {
                    this.renderTimeSlots(data.slots);
                    content.style.display = 'block';
                } else {
                    // Show error
                }
            })
            .catch(error => {
                loading.style.display = 'none';
                // Show error
            });
    }
    
    /**
     * Render time slots grouped by period
     */
    renderTimeSlots(slots) {
        // slots = { morning: ['09:00:00', ...], afternoon: [...], evening: [...] }
        
        ['morning', 'afternoon', 'evening'].forEach(period => {
            const periodContainer = document.querySelector(
                `.timeslot-period[data-period="${period}"] .timeslot-grid`
            );
            
            periodContainer.innerHTML = '';
            
            if (!slots[period] || slots[period].length === 0) {
                // Hide period if no slots
                periodContainer.closest('.timeslot-period').style.display = 'none';
                return;
            }
            
            periodContainer.closest('.timeslot-period').style.display = 'block';
            
            slots[period].forEach(time => {
                const button = document.createElement('button');
                button.className = 'timeslot';
                button.dataset.time = time;
                button.textContent = this.formatTime(time);
                
                button.addEventListener('click', () => this.handleTimeClick(button));
                
                periodContainer.appendChild(button);
            });
        });
    }
    
    /**
     * Handle time slot click
     */
    handleTimeClick(timeButton) {
        const time = timeButton.dataset.time;
        
        // Update selected time
        this.selectedTime = time;
        
        // Update UI
        document.querySelectorAll('.timeslot').forEach(el => 
            el.classList.remove('timeslot-selected')
        );
        timeButton.classList.add('timeslot-selected');
        
        // Enable continue button
        document.querySelector('.btn-continue').disabled = false;
    }
    
    /**
     * Save datetime to session via AJAX
     */
    saveDateTimeToSession() {
        if (!this.selectedDate || !this.selectedTime) {
            alert('Please select both date and time');
            return false;
        }
        
        // AJAX POST to /wp-json/bookit/v1/datetime/select
        // Body: { date: this.selectedDate, time: this.selectedTime }
        // On success: return true (allow navigation)
        // On error: show error, return false
    }
    
    // Utility methods
    isPastDate(date) { /* ... */ }
    isBankHoliday(date) { /* ... */ }
    formatDate(date) { /* DD/MM/YYYY */ }
    formatTime(time) { /* 9:00 AM */ }
    updateSelectedDateDisplay(date) { /* ... */ }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.bookit-step-3')) {
        new BookitDateTimePicker();
    }
});
```

**5. public/assets/css/datetime-picker.css**
```css
/* Calendar Styles */
.bookit-calendar-container {
    max-width: 400px;
    margin: 0 auto 2rem;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.btn-prev-month,
.btn-next-month {
    background: none;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 1.2rem;
}

.current-month-year {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-weekday {
    text-align: center;
    font-weight: 600;
    padding: 0.5rem;
    font-size: 0.875rem;
    color: #666;
}

.date-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.date-cell:hover:not(.date-past):not(.date-holiday) {
    background-color: #f0f0f0;
    border-color: #1e40af;
}

.date-cell.date-today {
    border: 2px solid #1e40af;
    font-weight: 700;
}

.date-cell.date-selected {
    background-color: #1e40af;
    color: white;
    border-color: #1e40af;
}

.date-cell.date-past,
.date-cell.date-holiday {
    color: #ccc;
    cursor: not-allowed;
    background-color: #fafafa;
}

.date-cell.date-holiday {
    color: #dc2626;
    text-decoration: line-through;
}

.date-cell.date-other-month {
    color: #999;
}

.selected-date-display {
    text-align: center;
    margin-top: 1rem;
    font-size: 1rem;
    color: #333;
    min-height: 1.5rem;
}

/* Time Slots Styles */
.bookit-timeslots-container {
    margin: 2rem 0;
}

.timeslots-loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.timeslot-period {
    margin-bottom: 2rem;
}

.timeslot-period h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #333;
}

.timeslot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
}

.timeslot {
    padding: 0.75rem 1rem;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    min-height: 44px; /* WCAG touch target */
}

.timeslot:hover {
    border-color: #1e40af;
    background-color: #eff6ff;
}

.timeslot.timeslot-selected {
    background-color: #1e40af;
    color: white;
    border-color: #1e40af;
}

.timeslot:focus {
    outline: 2px solid #1e40af;
    outline-offset: 2px;
}

/* Responsive: Mobile */
@media (max-width: 640px) {
    .calendar-grid {
        gap: 2px;
    }
    
    .date-cell {
        font-size: 0.75rem;
    }
    
    .timeslot-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
}
```

## ✅ ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] Calendar displays current month by default
- [ ] Previous/Next month buttons work
- [ ] Past dates are disabled and greyed out
- [ ] UK bank holidays are disabled with visual indicator
- [ ] Clicking available date shows time slots
- [ ] Time slots grouped into Morning/Afternoon/Evening
- [ ] All slots 00:00-23:45 shown (Phase 1 - no filtering)
- [ ] Clicking time slot selects it (blue background)
- [ ] Selected date + time saved to session
- [ ] "Continue" button enabled only when date + time selected
- [ ] "Continue" button advances to Step 4 (contact form)
- [ ] "Back" button returns to Step 2 (staff selection)

### UK Requirements
- [ ] Dates formatted as DD/MM/YYYY where displayed
- [ ] Times formatted as 12-hour with AM/PM (e.g., "2:00 PM")
- [ ] Calendar week starts Monday (UK standard)
- [ ] All 8 UK bank holidays 2026 blocked

### Accessibility
- [ ] Calendar navigable with keyboard (Tab, Arrow keys, Enter)
- [ ] Time slots have min 44x44px touch targets (WCAG 2.5.5)
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA labels on buttons ("Previous month", "Next month")
- [ ] aria-live region announces date selection
- [ ] Color contrast ≥4.5:1 (WCAG AA)

### Responsive Design
- [ ] Calendar fits mobile screens (320px+)
- [ ] Time slot grid responsive (2-3 columns on mobile, 4+ on desktop)
- [ ] No horizontal scrolling required

## 🧪 TESTING CHECKLIST

### Unit Tests (Optional for Task 4 - Can Add in Task 5)
```php
// tests/unit/test-datetime-model.php
// - test_generate_time_slots_returns_96_slots (24h * 4 per hour)
// - test_is_bank_holiday_returns_true_for_2026_dates
// - test_is_past_date_blocks_yesterday
// - test_format_time_display_converts_24h_to_12h
// - test_group_time_slots_splits_by_period
```

### Manual Testing Checklist

**Calendar Navigation:**
- [ ] Load Step 3 - calendar shows current month
- [ ] Click "→" - shows next month
- [ ] Click "←" - shows previous month
- [ ] Try to click past date - should not select (greyed out)
- [ ] Try to click bank holiday - should not select (red text)
- [ ] Click available date - time slots appear below

**Time Slot Selection:**
- [ ] Click date - loading spinner shows briefly
- [ ] Time slots load within 1 second
- [ ] Morning section shows slots 00:00-11:45
- [ ] Afternoon section shows slots 12:00-16:45
- [ ] Evening section shows slots 17:00-23:45
- [ ] Click time slot - turns blue
- [ ] Click different time - previous deselects, new one selects
- [ ] "Continue" button enables after time selected

**Session Persistence:**
- [ ] Select date + time
- [ ] Click "Continue"
- [ ] Go back to Step 3
- [ ] Verify date + time still selected (session preserved)

**Mobile Testing:**
- [ ] Load on 375px width - calendar fits screen
- [ ] Time slots are tappable (44x44px minimum)
- [ ] No horizontal scroll

**Accessibility:**
- [ ] Tab through all interactive elements
- [ ] Calendar dates receive focus indicators
- [ ] Time slots receive focus indicators
- [ ] Screen reader announces "Previous month" / "Next month"
- [ ] Screen reader announces selected date change

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Edge

## 📦 DELIVERABLES

1. **includes/models/class-datetime-model.php** - Time slot generation, validation
2. **includes/api/class-datetime-api.php** - REST endpoints for timeslots
3. **public/templates/booking-step-3-datetime.php** - Date/time picker UI
4. **public/assets/js/datetime-picker.js** - Calendar + timeslot logic
5. **public/assets/css/datetime-picker.css** - Responsive styles
6. Session saves booking_date and booking_time
7. Navigation to Step 4 working

## 🚨 CRITICAL REMINDERS

1. **Phase 1 Simplification:**
   - Show ALL time slots 00:00-23:45 (no filtering by working hours yet)
   - No "slot unavailable" logic (that's Task 5 - 28 hours)
   - Purpose: Get UI working, defer complex availability to Task 5

2. **UK Date/Time Formatting:**
   - Display: DD/MM/YYYY (e.g., "15/05/2026")
   - Store: YYYY-MM-DD (e.g., "2026-05-15") - MySQL DATE format
   - Time Display: 12-hour with AM/PM (e.g., "2:00 PM")
   - Time Store: HH:mm:ss 24-hour (e.g., "14:00:00") - MySQL TIME format

3. **Bank Holidays 2026:**
   - Hardcoded array for Phase 1
   - Phase 2 will use UK Government API: https://www.gov.uk/bank-holidays.json

4. **Accessibility:**
   - Min 44x44px touch targets (WCAG 2.5.5)
   - Keyboard navigable
   - Focus indicators visible
   - ARIA labels on buttons

5. **Session Management:**
   - Use existing BOOKIT_Session_Manager from Task 1
   - Save to fields: booking_date (DATE), booking_time (TIME)
   - Update current_step = 4 when continuing

## ⏱️ TIME ESTIMATE

**Task 4 Total: 14 hours**

**Breakdown:**
- DateTime Model: 3h
- DateTime API: 2h
- Calendar UI HTML: 2h
- JavaScript calendar logic: 3h
- Time slots AJAX + UI: 2h
- CSS styling: 1h
- Testing + fixes: 1h

## 📝 GIT COMMIT MESSAGE TEMPLATE

```
Sprint 1, Task 4: Date & Time selection UI (Phase 1)

- Created DateTime_Model for time slot generation
- Created DateTime_API with REST endpoints
- Built calendar component with UK date format (DD/MM/YYYY)
- Implemented UK bank holiday blocking (2026 dates)
- Added past date prevention
- Time slots grouped by Morning/Afternoon/Evening
- All slots shown as available (Phase 1 - filtering in Task 5)
- Session saves booking_date and booking_time
- Responsive design (mobile-first)
- WCAG 2.5.5 compliant (44px touch targets)

Phase 1 Complete: 14h
Phase 2 (Task 5): Real-time availability calculation (28h)

Tests: Manual testing complete, unit tests deferred to Task 5
```

---

## 🚀 NEXT STEPS AFTER TASK 4

Once Task 4 is complete:
1. Test the complete booking flow Steps 1-3
2. Move to **Task 5: Time Slot Availability Algorithm** (28 hours)
   - Integrate staff working hours
   - Check existing bookings
   - Calculate available slots with duration + buffers
   - Show "No slots available" when appropriate

---

## 🎯 READY TO IMPLEMENT

Paste this entire prompt into Cursor Composer (Ctrl+I) and implement Task 4.

**Expected Implementation Time:** 12-14 hours (including testing)
**Complexity:** High (calendar UI + AJAX integration)
