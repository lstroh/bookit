# Phase 2.1 Scope - FINAL & LOCKED ✅

Perfect! I'll now document all 16 gap analysis decisions and create the final Phase 2.1 deliverable.

---

## PHASE 2.1 COMPLETE - SCOPE DEFINITION DOCUMENT

### **Document Version:** 1.0 FINAL
### **Date:** January 18, 2026
### **Status:** LOCKED - Ready for Phase 2.2

---

## EXECUTIVE SUMMARY

**What We're Building:** WordPress booking plugin with separate frontend dashboard (Phase 1 MVP)

**Timeline:** 3-4 months development

**Target Users:** UK service businesses (salons, photographers, solo consultants)

**Core Value:** 24/7 online booking with co-branded dashboard, eliminating manual scheduling

**Deferred to Phase 2:** Packages, recurring appointments, group bookings, approval workflows (physio/coach personas)

---

## 1. CORE BOOKING SCENARIOS - PHASE 1

### ✅ **SUPPORTED IN PHASE 1:**

**Scenario 1: Simple Appointment Booking**
- Customer selects service → staff → date/time → pays deposit/full amount → receives confirmation
- Staff-specific pricing supported
- Overnight bookings supported (cross midnight once, e.g., 6pm Friday → 2am Saturday)
- Guest checkout (no account required)
- Example: Sarah's salon, Michael's photography shoots

### ❌ **NOT SUPPORTED IN PHASE 1 (Deferred to Phase 2):**

**Scenario 2: Package Bookings** - Emma (coach) needs multi-session packages  
**Scenario 3: Recurring Appointments** - James (physio) needs weekly series  
**Scenario 4: Group Bookings/Events** - James (physio) needs Pilates classes  
**Scenario 5: Approval Workflow** - Michael (photographer) needs to approve bookings before confirmation

---

## 2. USER ROLES & PERMISSIONS - FINAL MATRIX

### **Role 1: Customer (Guest - No Account)**

**Access:** Public booking page only

| Permission | Allowed? | Notes |
|------------|----------|-------|
| View services & pricing | ✅ Yes | Public booking page |
| View staff profiles | ✅ Yes | Staff name, photo, bio, pricing |
| Check availability | ✅ Yes | Real-time calendar |
| Book appointment | ✅ Yes | Guest checkout: name, email, phone |
| Pay deposit/full amount | ✅ Yes | Stripe or PayPal |
| Receive confirmation email | ✅ Yes | With booking details + cancellation link |
| Receive reminder email | ✅ Yes | 24hrs before appointment |
| Cancel booking | ✅ Yes | Via magic link in email (within policy window) |
| Reschedule booking | ✅ Yes | Via magic link in email (within policy window) |
| View booking history | ❌ No | Must create account first |
| Create account | ✅ Yes | After first booking, via email prompt |

---

### **Role 2: Customer (Registered Account)**

**Access:** Customer portal (frontend, not WP admin)

| Permission | Allowed? | Notes |
|------------|----------|-------|
| All Guest permissions | ✅ Yes | Everything above, PLUS: |
| Login to customer portal | ✅ Yes | Email + password |
| View booking history | ✅ Yes | Past & upcoming appointments |
| View receipts | ✅ Yes | Download PDF receipts |
| Update profile | ✅ Yes | Name, email, phone, password |
| Save payment methods | ❌ Phase 2 | Deferred - re-enter card each time |
| Manage marketing consent | ✅ Yes | Opt in/out of newsletters (GDPR) |
| Delete account | ✅ Yes | GDPR right to erasure |

---

### **Role 3: Staff Member**

**Access:** Staff dashboard (frontend, not WP admin)

| Permission | Allowed? | Notes |
|------------|----------|-------|
| **Own Bookings** | | |
| View own bookings | ✅ Yes | Calendar + list view |
| Cancel own bookings | ✅ Yes | Can cancel bookings assigned to them |
| Reschedule own bookings | ✅ Yes | Move to different time slot |
| Add manual booking | ✅ Yes | Book appointment for customer (assigned to self) |
| Add notes to booking | ✅ Yes | Internal notes (customer cannot see) |
| Mark as "no-show" | ✅ Yes | Flag customer didn't arrive |
| Mark as "completed" | ✅ Yes | Appointment finished |
| Mark as "paid in full" | ✅ Yes | If balance due was paid on arrival |
| Issue refund | ✅ Yes | Can approve refund (Business Owner can override) |
| **Team Coordination** | | |
| View team calendar | ✅ Yes | Read-only view of ALL staff bookings |
| View other staff bookings | ✅ Yes | Read-only (for coordination, "is Sarah free?") |
| Edit other staff bookings | ❌ No | Cannot touch other staff's appointments |
| **Availability** | | |
| Set working hours | ✅ Yes | Weekly pattern (Mon 9am-5pm, Tue 10am-6pm, etc.) |
| Block time off | ✅ Yes | Vacation, sick days, lunch breaks |
| Add exceptions | ✅ Yes | One-off extra hours (Saturday 10am-2pm) |
| **Reporting** | | |
| View own earnings | ✅ Yes | "Your revenue this week: £450" (if toggle enabled) |
| View own booking count | ✅ Yes | "You have 23 bookings this month" |
| View business-wide reports | ❌ No | Cannot see other staff earnings or total revenue |
| **Services & Pricing** | | |
| View services | ✅ Yes | See all services offered |
| Add/edit services | ❌ No | Must request via Business Owner (who contacts you) |
| Set own pricing | ❌ No | WordPress Admin configures pricing per staff |
| **Customers** | | |
| View own customer list | ✅ Yes | Customers who booked with them |
| View all customers | ❌ No | Privacy - only Business Owner sees all |
| Export customer data | ❌ No | Only Business Owner |

---

### **Role 4: Business Owner**

**Access:** Business Owner dashboard (frontend) + WordPress admin (optional, if no support package)

| Permission | Allowed? | Notes |
|------------|----------|-------|
| **All Staff Permissions** | ✅ Yes | Everything Staff can do, PLUS: |
| **Booking Management** | | |
| View ALL bookings | ✅ Yes | All staff, all dates |
| Edit ANY booking | ✅ Yes | Can modify, cancel, reschedule any appointment |
| Add manual booking for ANY staff | ✅ Yes | Book customer with specific staff member |
| Override cancellation policy | ✅ Yes | Allow late cancellation, waive fees |
| Bulk actions | ❌ Phase 2 | Cancel multiple bookings at once (e.g., snow day) |
| **Staff Management** | | |
| View all staff calendars | ✅ Yes | See everyone's availability |
| Edit staff working hours | ✅ Yes | Can adjust if staff misconfigured |
| Approve/deny staff time-off | ❌ No | Staff can block their own time (trust model) |
| Add/remove staff | ❌ No | Must contact WordPress Admin (you) |
| **Customer Management** | | |
| View all customers | ✅ Yes | Full customer database |
| Search customers | ✅ Yes | By name, email, phone |
| View customer booking history | ✅ Yes | See all appointments for specific customer |
| Add notes to customer | ✅ Yes | "VIP client", "Allergic to lavender oil", etc. |
| Export customer list | ✅ Yes | CSV export for marketing |
| Delete customer (GDPR) | ✅ Yes | Right to erasure |
| **Reporting** | | |
| Total bookings (week/month/all-time) | ✅ Yes | Count of appointments |
| Total revenue (week/month/all-time) | ✅ Yes | Sum of payments received |
| No-show rate | ✅ Yes | % of bookings marked as no-show |
| Cancellation rate | ✅ Yes | % of bookings cancelled by customer |
| Revenue by staff | ❌ Phase 2 | Deferred to advanced reporting |
| Peak hours analysis | ❌ Phase 2 | Deferred to advanced reporting |
| **Settings (via Dashboard)** | | |
| Configure working hours | ✅ Yes | Business hours (when booking is allowed) |
| Set cancellation policy | ✅ Yes | Cancellation window, refund rules |
| Configure email templates | ✅ Yes | Edit confirmation/reminder email text |
| Toggle staff earnings visibility | ✅ Yes | Show/hide earnings from staff dashboard |
| **Settings (via WP Admin - Limited)** | | |
| Add/edit services | ❌ No | Must contact you (if support package) OR do themselves (if tech-savvy) |
| Configure payment gateway | ❌ No | Must contact you |
| Change white-label branding | ❌ No | Must contact you |

---

### **Role 5: WordPress Admin (YOU)**

**Access:** Full WordPress admin backend

| Permission | Allowed? | Notes |
|------------|----------|-------|
| **Plugin Configuration** | | |
| Add/edit/delete services | ✅ Yes | Name, duration, base price, buffer time, description |
| Set staff-specific pricing | ✅ Yes | "Senior Stylist charges £45 for Haircut, Junior charges £30" |
| Add/remove staff members | ✅ Yes | Create staff user, assign services |
| Configure payment gateways | ✅ Yes | Stripe API keys, PayPal credentials |
| Set up Google Calendar sync | ✅ Yes | OAuth connection per staff member |
| Configure white-label branding | ✅ Yes | Upload client logo, set colors, toggle "Powered by" |
| Set global cancellation policy | ✅ Yes | Default rules (can be changed by Business Owner later) |
| Configure UK bank holidays | ✅ Yes | Enable/disable auto-blocking |
| Set email templates | ✅ Yes | Default templates (Business Owner can customize) |
| **Access Control** | | |
| View all dashboards | ✅ Yes | Can impersonate any role for support |
| View all data | ✅ Yes | All bookings, customers, payments |
| Export all data | ✅ Yes | For backups, migrations |
| Delete all data | ✅ Yes | GDPR compliance, client offboarding |

---

## 3. CORE USER STORIES - GIVEN/WHEN/THEN FORMAT

### **Epic 1: Customer Booking Journey**

#### **User Story 1.1: Customer Views Available Services**

**As a** customer  
**I want to** see a list of available services with pricing and duration  
**So that** I can choose which service to book

**Acceptance Criteria:**

**Given** I visit the booking page on the business's website  
**When** the page loads  
**Then** I see a list of all services grouped by category (e.g., "Haircuts", "Coloring", "Treatments")  
**And** each service displays: Name, Duration (e.g., "45 minutes"), Base price (e.g., "From £35"), Brief description  
**And** services are sorted by category, then alphabetically within category

**Edge Cases:**
- If business has no services configured → Show message: "Bookings not available yet. Please contact us."
- If service is marked "inactive" by WordPress Admin → Don't display in list

---

#### **User Story 1.2: Customer Selects Service and Staff Member**

**As a** customer  
**I want to** choose a specific service and see which staff members offer it  
**So that** I can book with my preferred staff member or the most affordable option

**Acceptance Criteria:**

**Given** I click on a service (e.g., "Women's Haircut")  
**When** the selection screen loads  
**Then** I see a list of staff members who offer this service  
**And** each staff member shows: Name, Photo, Bio (optional), Their price for this service (e.g., "Emma - £35" vs "Sarah - £45")  
**And** I can select "No Preference" (system assigns first available staff)

**Edge Cases:**
- If only one staff member offers the service → Auto-select them, skip this step
- If staff-specific pricing is NOT configured → Show base price for all staff
- If staff member is on vacation/fully booked → Show "Not available" (greyed out)

---

#### **User Story 1.3: Customer Checks Availability and Selects Time**

**As a** customer  
**I want to** see real-time availability for my chosen service and staff  
**So that** I can pick a convenient date and time

**Acceptance Criteria:**

**Given** I've selected a service and staff member  
**When** the calendar view loads  
**Then** I see a monthly calendar with:
- Available dates highlighted (clickable)
- Unavailable dates greyed out (past dates, staff vacation, fully booked)
- UK bank holidays marked (if auto-blocking enabled)

**And when** I click an available date  
**Then** I see available time slots for that day in 15-minute increments (or service duration increments)  
**And** only slots that fit the full service duration are shown (e.g., if service is 45min, don't show slots with only 30min left before closing)

**Edge Cases:**
- If no availability for next 30 days → Show message: "No availability in the next month. Please contact us to schedule."
- If staff has lunch break 12pm-1pm → Those slots not shown
- If appointment would cross midnight (photographer 6pm-2am shoot) → Allow selection, show "Ends next day" indicator

---

#### **User Story 1.4: Customer Enters Details and Pays**

**As a** customer  
**I want to** provide my contact information and pay securely  
**So that** I can confirm my booking

**Acceptance Criteria:**

**Given** I've selected date/time  
**When** I proceed to checkout  
**Then** I see a form requesting:
- Full name (required)
- Email address (required)
- Phone number (required)
- Marketing consent checkbox (optional): "Send me special offers and updates" (unchecked by default, GDPR compliant)

**And** I see payment section showing:
- Service total: £60
- Payment required now: £20 (deposit) OR £60 (full payment) — based on service configuration
- Balance due on arrival: £40 (if deposit) OR £0 (if full payment)

**And** I can pay via:
- Stripe (credit/debit card)
- PayPal

**When** I complete payment  
**Then** booking is created with status "Confirmed"  
**And** I'm redirected to confirmation page showing booking details  
**And** I receive confirmation email immediately

**Edge Cases:**
- If payment fails → Show error message, booking NOT created, customer can retry
- If someone else books the same slot while I'm checking out → Show "This time is no longer available, please choose another"
- If "Pay on arrival" configured (£0 deposit) → Skip payment, booking still confirmed

---

#### **User Story 1.5: Customer Receives Confirmation Email**

**As a** customer  
**I want to** receive a confirmation email with booking details  
**So that** I have a record and know what to expect

**Acceptance Criteria:**

**Given** I've completed a booking  
**When** the booking is created  
**Then** I receive an email within 1 minute containing:
- Booking confirmation heading
- Service name (e.g., "Women's Haircut")
- Staff member name (e.g., "with Emma")
- Date and time (e.g., "Tuesday, 15 May 2026 at 2:00 PM")
- Duration (e.g., "45 minutes")
- Location (business address)
- Total cost (e.g., "£60")
- Amount paid (e.g., "£20 deposit paid")
- Balance due (e.g., "£40 due on arrival")
- Cancellation policy reminder (e.g., "Free cancellation up to 24 hours before appointment")
- Two buttons: "Cancel Booking" (magic link) | "Reschedule Booking" (magic link)
- Footer: Client's company name + "Powered by [YourCompany]"

**Edge Cases:**
- If email bounces → Flag booking as "email failed" in dashboard, Business Owner notified
- If customer books multiple appointments → Separate confirmation email for each

---

#### **User Story 1.6: Customer Receives Reminder Email**

**As a** customer  
**I want to** receive a reminder before my appointment  
**So that** I don't forget and can cancel/reschedule if needed

**Acceptance Criteria:**

**Given** I have an upcoming booking  
**When** it's 24 hours before the appointment time  
**Then** I receive a reminder email containing:
- "Reminder: Your appointment is tomorrow"
- Service, staff, date/time (same details as confirmation)
- Balance due reminder (if applicable): "Please bring £40 to pay on arrival"
- Two buttons: "Cancel Booking" | "Reschedule Booking"

**Edge Cases:**
- If appointment is less than 24 hours away when booked → Send reminder immediately (e.g., book today for tomorrow)
- If customer already cancelled → Don't send reminder
- If reminder email fails → Don't retry (low priority)

---

#### **User Story 1.7: Customer Cancels Booking**

**As a** customer  
**I want to** cancel my booking if I can't make it  
**So that** I don't get charged a no-show fee and the time slot is freed for others

**Acceptance Criteria:**

**Given** I click "Cancel Booking" link in confirmation or reminder email  
**When** the cancellation page loads  
**Then** I see booking details and cancellation policy:
- "You can cancel free of charge up to 24 hours before your appointment"
- Current time vs appointment time countdown (e.g., "You have 36 hours remaining")

**And when** I click "Confirm Cancellation"  
**Then**:
- **If within policy window (24+ hours before):**
  - Booking status → "Cancelled by Customer"
  - Refund status → "Pending" (Business Owner must approve manually)
  - I see message: "Your booking has been cancelled. Refund will be processed within 3-5 business days."
  - Email sent to: Me (cancellation confirmation) + Staff Member (their appointment cancelled) + Business Owner (customer cancellation notice)

- **If outside policy window (<24 hours before):**
  - I see warning: "Late cancellation: According to the cancellation policy, your deposit may be non-refundable."
  - I can still cancel, but refund status → "Requires Approval"
  - Message: "Your booking has been cancelled. Please contact us regarding your refund."

**Edge Cases:**
- If I already cancelled → Show "This booking was already cancelled"
- If appointment is in the past → Show "Cannot cancel past appointments"
- If booking is marked "Completed" or "No-show" → Cannot cancel

---

#### **User Story 1.8: Customer Reschedules Booking**

**As a** customer  
**I want to** reschedule my booking to a different date/time  
**So that** I don't lose my deposit and can still receive the service

**Acceptance Criteria:**

**Given** I click "Reschedule Booking" link in confirmation or reminder email  
**When** the rescheduling page loads  
**Then** I see:
- Current booking details (service, staff, date/time)
- Cancellation policy reminder
- Availability calendar (same as original booking flow)

**And when** I select a new date/time and click "Confirm Reschedule"  
**Then**:
- **If within policy window (24+ hours before original appointment):**
  - Original appointment cancelled
  - New appointment created (same service, same staff, new date/time)
  - Payment/deposit transfers to new booking (no additional charge)
  - Status → "Rescheduled"
  - Email sent to: Me (new confirmation) + Staff Member (appointment rescheduled) + Business Owner (customer rescheduled)

- **If outside policy window (<24 hours before original appointment):**
  - Warning shown: "Late rescheduling may incur a fee. Please contact us."
  - Reschedule still allowed, but flagged for Business Owner review

**Edge Cases:**
- If new time slot is no longer available → Show "This time is no longer available, please choose another"
- If I've already rescheduled 3+ times → Still allowed, but Business Owner notified (potential abuse)
- If customer wants to change service or staff → Must cancel and create new booking (reschedule only changes date/time)

---

### **Epic 2: Staff Dashboard Management**

#### **User Story 2.1: Staff Member Logs Into Dashboard**

**As a** staff member  
**I want to** log into my dashboard securely  
**So that** I can view my schedule and manage my bookings

**Acceptance Criteria:**

**Given** I navigate to the staff dashboard URL (e.g., `/booking-dashboard`)  
**When** the login page loads  
**Then** I see:
- Client's logo (co-branded)
- "Staff Login" heading
- Email field
- Password field
- "Forgot Password?" link
- "Log In" button
- Footer: "Powered by [YourCompany]" (small text)

**And when** I enter valid credentials and click "Log In"  
**Then** I'm redirected to my dashboard home page  
**And** I see a welcome message: "Welcome back, Emma!"

**Edge Cases:**
- If wrong password → Show error: "Invalid email or password"
- If account doesn't exist → Show same error (don't reveal which emails have accounts - security)
- If staff member is deactivated → Show error: "Your account has been disabled. Please contact your manager."
- If I'm already logged in → Skip login, go straight to dashboard

---

#### **User Story 2.2: Staff Member Views Own Schedule**

**As a** staff member  
**I want to** see my upcoming appointments at a glance  
**So that** I know what my day/week looks like

**Acceptance Criteria:**

**Given** I'm logged into the staff dashboard  
**When** I land on the home page  
**Then** I see:
- **Today's Appointments** section:
  - List of appointments for today in chronological order
  - Each showing: Time, Service, Customer name, Duration, Status (Confirmed/Completed/No-show)
  - "Balance Due" badge if customer owes money
  - Quick actions: "Mark as Completed" | "Mark as No-Show" | "View Details"

- **Weekly Calendar View:**
  - Current week (Mon-Sun)
  - My bookings shown as colored blocks
  - Blocked time (lunch, vacation) shown as grey blocks
  - Hover over booking → Tooltip with customer name + service

- **Upcoming Appointments** section:
  - Next 7 days of bookings (list view)
  - Count: "You have 12 appointments this week"

**Edge Cases:**
- If no appointments today → Show "No appointments scheduled for today"
- If on vacation all week → Show "You're currently off. Enjoy your time!"
- If past appointments → Move to "Past Appointments" tab (not shown on home)

---

#### **User Story 2.3: Staff Member Blocks Time Off**

**As a** staff member  
**I want to** block time on my calendar for vacation, lunch breaks, or personal appointments  
**So that** customers cannot book me during those times

**Acceptance Criteria:**

**Given** I'm on my dashboard  
**When** I navigate to "Availability" section  
**Then** I see:
- "Working Hours" panel showing my weekly pattern (Mon 9am-5pm, Tue 10am-6pm, etc.)
- "Time Off" panel showing current blocked periods

**And when** I click "Block Time Off"  
**Then** I see a form with:
- Date range picker (single day or multiple days)
- Time range picker (e.g., 12pm-1pm for lunch, or "All Day" for vacation)
- Reason (optional dropdown): Vacation, Sick Leave, Lunch Break, Personal, Other
- Notes (optional text field)
- Repeat options: "Does not repeat" | "Repeats daily" | "Repeats weekly"

**And when** I submit  
**Then**:
- Time is blocked on calendar (greyed out, not bookable)
- Existing bookings during that time are NOT affected (staff must manually reschedule those first)
- Business Owner is notified via email: "Emma blocked time off: 1-15 Aug (Vacation)"

**Edge Cases:**
- If I try to block time with existing bookings → Warning shown: "You have 3 bookings during this time. Please reschedule them first."
- If I block "All Day" → Entire day greyed out, no bookings possible
- If I set recurring lunch break (12pm-1pm daily) → Applied to all future dates, stops showing in booking availability

---

#### **User Story 2.4: Staff Member Views Team Calendar**

**As a** staff member  
**I want to** see when other staff members are booked  
**So that** I can coordinate breaks or refer customers to available colleagues

**Acceptance Criteria:**

**Given** I'm on my dashboard  
**When** I navigate to "Team Calendar" tab  
**Then** I see a multi-staff calendar view showing:
- All staff members' names in sidebar
- Calendar grid (weekly or daily view)
- Each staff member's bookings shown as colored blocks (different color per staff member)
- My own bookings highlighted (e.g., bold border)

**And when** I hover over another staff's booking  
**Then** I see: Time, Service name, Duration  
**But NOT:** Customer name or payment details (privacy)

**And when** I click on another staff's booking  
**Then** nothing happens (read-only, cannot edit)

**Edge Cases:**
- If viewing daily view → Show all staff stacked vertically (salon-style appointment book)
- If business has 10+ staff → Add filter/search to show specific staff members only
- If staff member is on vacation → Their entire row shows "On Vacation - Aug 1-15"

---

#### **User Story 2.5: Staff Member Manages Own Booking**

**As a** staff member  
**I want to** view details of a booking, add notes, or mark it as completed/no-show  
**So that** I can keep accurate records

**Acceptance Criteria:**

**Given** I click on one of my bookings in the calendar  
**When** the booking detail modal opens  
**Then** I see:
- Customer info: Name, Email, Phone
- Service: Name, Duration, Price
- Date/Time: Full datetime
- Payment status: "£20 deposit paid, £40 balance due" OR "Paid in full"
- Booking status: Confirmed, Completed, No-show, Cancelled
- Internal notes field (only visible to staff/Business Owner, not customer)

**And** I have action buttons:
- "Add Note" (opens text field)
- "Mark as Completed" (changes status, prompts "Was balance paid?" if due)
- "Mark as No-Show" (changes status, prompts "Keep deposit?" - refers to Business Owner)
- "Cancel Booking" (prompts "Reason for cancellation?")
- "Reschedule" (opens calendar to select new time)

**And when** I click "Mark as Completed" and select "Yes, balance paid"  
**Then**:
- Status → "Completed"
- Payment status → "Paid in Full"
- Balance due → £0
- Timestamp logged: "Completed by Emma on [date/time]"

**Edge Cases:**
- If I mark as "No-Show" → Business Owner gets notification to review refund policy
- If I add note → Saved with timestamp: "Emma (15 May 2:14pm): Customer prefers short layers"
- If I cancel booking assigned to me → Customer + Business Owner notified

---

#### **User Story 2.6: Staff Member Views Own Earnings**

**As a** staff member  
**I want to** see how much revenue I've generated  
**So that** I can track my performance

**Acceptance Criteria:**

**Given** I'm logged into my dashboard  
**And** Business Owner has enabled "Show Earnings to Staff" toggle  
**When** I navigate to "My Stats" section  
**Then** I see:
- **This Week:**
  - Total appointments: 12
  - Total revenue: £540
  - Average per booking: £45
- **This Month:**
  - Total appointments: 48
  - Total revenue: £2,160
  - Average per booking: £45
- **All Time:**
  - Total appointments: 342
  - Total revenue: £15,390

**And** I see a simple bar chart showing revenue by week for past 4 weeks

**Edge Cases:**
- If Business Owner disables earnings visibility → This section hidden, show "Earnings data hidden by management"
- If I'm a new staff member with no bookings → Show "No bookings yet. Your first booking will appear here!"
- Revenue only counts COMPLETED bookings (not confirmed-but-not-happened yet)

---

### **Epic 3: Business Owner Dashboard Management**

#### **User Story 3.1: Business Owner Views All Bookings**

**As a** Business Owner  
**I want to** see all bookings across all staff members  
**So that** I can monitor my business operations

**Acceptance Criteria:**

**Given** I'm logged into the Business Owner dashboard  
**When** I land on the home page  
**Then** I see:
- **Today's Overview:**
  - Total appointments today: 18
  - Total revenue expected today: £1,080
  - "Upcoming in next 2 hours" list (appointments about to happen)
  
- **All Staff Calendar View:**
  - Multi-staff calendar showing all bookings
  - Color-coded by staff member
  - Click any booking → View/edit details

- **Recent Activity Feed:**
  - "New booking: Sarah Jones booked Women's Haircut with Emma (2pm today)" - 5 min ago
  - "Cancellation: Michael Brown cancelled Beard Trim (tomorrow 3pm)" - 1 hour ago
  - "Emma blocked time off: Aug 1-15 (Vacation)" - 2 hours ago

**Edge Cases:**
- If no bookings today → Show "No appointments scheduled for today"
- If multiple staff are off → Show "3 staff members on vacation today"

---

#### **User Story 3.2: Business Owner Manages Cancellation Refund**

**As a** Business Owner  
**I want to** approve or deny refund requests  
**So that** I can handle refunds based on my policy and customer circumstances

**Acceptance Criteria:**

**Given** a customer has cancelled a booking  
**When** I navigate to "Pending Actions" section  
**Then** I see a list of cancelled bookings awaiting refund decision:
- Customer name
- Service
- Original date/time
- Cancellation reason (if provided)
- Cancellation timestamp (e.g., "Cancelled 36 hours before appointment")
- Deposit amount: £20
**And when** I click "Review Refund"  
**Then** I see booking details and three options:
- "Approve Full Refund" (£20 back to customer)
- "Partial Refund" (enter custom amount, e.g., £10)
- "Deny Refund (Keep Deposit)" (£0 back to customer)
- Reason field (optional, sent to customer)

**And when** I click "Approve Full Refund"  
**Then**:
- System calls Stripe/PayPal API to process refund
- Refund status → "Processed"
- Customer receives email: "Your £20 deposit has been refunded. Please allow 3-5 business days."
- If refund fails (e.g., card expired) → Error shown, marked as "Refund Failed - Manual Action Needed"

**Edge Cases:**
- If customer paid full amount (£60) and I approve full refund → Entire £60 refunded
- If customer cancelled outside policy window but I want to be generous → Can still approve full refund (override policy)
- If refund takes >5 days → Customer can contact support, I can see refund status in dashboard

---

#### **User Story 3.3: Business Owner Configures Cancellation Policy**

**As a** Business Owner  
**I want to** set my cancellation and refund rules  
**So that** customers know what to expect and I can protect my business from late cancellations

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Settings" → "Cancellation Policy"  
**Then** I see a form with:

1. **Cancellation Window** (dropdown):
   - 1 hour before appointment
   - 6 hours before appointment
   - 12 hours before appointment
   - 24 hours before appointment ⭐ (default)
   - 48 hours before appointment
   - 72 hours before appointment
   - 1 week before appointment

2. **Within Window - Refund Policy** (dropdown):
   - Full refund (100%)
   - Partial refund (slider: 0-100%, default 100%)
   - Store credit only
   - No refund

3. **Outside Window (Late Cancel) - Refund Policy** (dropdown):
   - Full refund
   - Partial refund (slider: 0-100%, default 50%)
   - Store credit only
   - No refund ⭐ (default)

4. **No-Show - Refund Policy** (dropdown):
   - Full refund
   - Partial refund
   - Store credit only
   - No refund (keep deposit) ⭐ (default)

5. **Rescheduling Rules** (dropdown):
   - Free rescheduling (unlimited)
   - Free rescheduling (1 time only, then fee)
   - Rescheduling fee: £[amount] per change
   - Not allowed outside cancellation window

6. **Policy Text** (rich text editor):
   - Customizable text shown to customers during booking
   - Default: "Free cancellation up to 24 hours before your appointment. Late cancellations and no-shows forfeit deposit."

**And when** I click "Save Changes"  
**Then**:
- Policy is saved and applies to ALL future bookings immediately
- Existing bookings use the policy that was active when they were created (not retroactive)
- Policy text is displayed on booking page and in confirmation emails

**Edge Cases:**
- If I change policy mid-day → New bookings use new policy, old bookings use old policy
- If I set "No refund" for everything → Warning shown: "This is a strict policy. Consider allowing refunds for emergencies to maintain good customer relations."

---

#### **User Story 3.4: Business Owner Views Basic Reports**

**As a** Business Owner  
**I want to** see high-level metrics about my bookings and revenue  
**So that** I can understand my business performance

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Reports" tab  
**Then** I see four sections:

**1. Overview Metrics (three time periods: This Week, This Month, All Time):**
- Total Bookings: Count of all appointments (excluding cancelled)
- Total Revenue: Sum of all payments received (deposits + full payments)
- No-Show Rate: % of bookings marked as no-show
- Cancellation Rate: % of bookings cancelled by customer

Example display:
```
This Week:
- Total Bookings: 67
- Total Revenue: £3,015
- No-Show Rate: 4.5% (3 no-shows)
- Cancellation Rate: 7.5% (5 cancellations)
```

**2. Date Range Selector:**
- Quick filters: Today, Yesterday, This Week, Last Week, This Month, Last Month, Custom Range
- Date picker for custom range

**3. Simple Bar Chart:**
- X-axis: Days (if weekly view) or Weeks (if monthly view)
- Y-axis: Revenue (£)
- Shows revenue trend over selected period

**4. Export Button:**
- "Export to CSV" downloads booking data for selected date range
- Columns: Date, Time, Customer Name, Service, Staff Member, Status, Amount Paid, Payment Method

**Edge Cases:**
- If no bookings in selected period → Show "No bookings found for this period"
- If viewing "All Time" with 2+ years of data → Show monthly aggregation (not daily)
- Revenue only counts completed bookings and received payments (not pending or cancelled)

---

### **Epic 4: WordPress Admin Configuration**

#### **User Story 4.1: WordPress Admin Adds New Service**

**As a** WordPress Admin (you)  
**I want to** create a new bookable service  
**So that** customers can book it and staff can provide it

**Acceptance Criteria:**

**Given** I'm logged into WordPress admin  
**When** I navigate to "Bookings" → "Services" → "Add New"  
**Then** I see a form with fields:

**Basic Information:**
- Service Name (required): e.g., "Women's Haircut"
- Category (dropdown): Haircuts, Coloring, Treatments, Styling, etc. (can add new categories)
- Description (rich text editor): Shown to customers during booking
- Duration (required): Hours and minutes selector (e.g., 0 hours 45 minutes)
- Buffer Time (optional): Time blocked after appointment (e.g., 15 minutes for cleanup)

**Pricing:**
- Base Price (required): £ [amount] (e.g., £35) - "This is the default price if staff-specific pricing is not set"
- Deposit Required (checkbox): If checked, show deposit options:
  - Fixed amount: £[amount]
  - Percentage: [%] of total price
  - OR "Full payment required" (100% upfront)
- Pay on arrival allowed (checkbox): If checked, £0 deposit option available

**Availability:**
- Available for booking (toggle): Yes (published) / No (draft - staff can see but customers cannot book)
- Booking window: How far in advance can customers book? (dropdown)
  - Same day
  - 1 day in advance (default)
  - 2 days in advance
  - 1 week in advance
  - 2 weeks in advance
  - 1 month in advance
  - 3 months in advance

**Staff Assignment:**
- Select which staff members can provide this service (checkboxes)
- For each selected staff, optionally set custom price (overrides base price)

**And when** I click "Publish"  
**Then**:
- Service is saved and immediately available for booking (if toggle = Yes)
- If staff-specific pricing set → Those prices show when customers select staff
- Service appears in customer booking page under selected category

**Edge Cases:**
- If no staff assigned → Warning: "This service has no staff assigned. Customers cannot book it yet."
- If duration is 0 minutes → Error: "Duration must be at least 15 minutes"
- If buffer time is longer than duration → Warning: "Buffer time (30min) is longer than service duration (15min). Is this intentional?"

---

#### **User Story 4.2: WordPress Admin Configures Staff-Specific Pricing**

**As a** WordPress Admin  
**I want to** set different prices for the same service based on staff seniority  
**So that** senior staff can charge more while juniors charge less

**Acceptance Criteria:**

**Given** I'm editing a service (e.g., "Women's Haircut" with base price £35)  
**When** I scroll to "Staff Assignment" section  
**Then** I see a table:

| Staff Member | Provides Service? | Custom Price |
|--------------|-------------------|--------------|
| Emma (Senior Stylist) | ☑ Yes | £45 |
| Sarah (Stylist) | ☑ Yes | £35 (base) |
| Lisa (Junior Stylist) | ☑ Yes | £30 |
| Mark (Colorist) | ☐ No | — |

**And when** I check "Provides Service?" for Emma  
**Then** a "Custom Price" field appears (optional)  
**And when** I enter £45  
**Then** Emma's price for this service is set to £45 (overrides base £35)

**And when** customers book this service  
**Then** they see:
- "Women's Haircut - From £30"
- Staff selection shows:
  - Lisa (Junior Stylist) - £30
  - Sarah (Stylist) - £35
  - Emma (Senior Stylist) - £45

**Edge Cases:**
- If I don't set custom price for a staff member → They use base price (£35)
- If I set custom price lower than base → Allowed (e.g., trainee charges less)
- If I uncheck "Provides Service?" for all staff → Warning: "No staff can provide this service. It will not be bookable."

---

#### **User Story 4.3: WordPress Admin Adds Staff Member**

**As a** WordPress Admin  
**I want to** create a new staff account  
**So that** they can log into the dashboard and customers can book with them

**Acceptance Criteria:**

**Given** I'm logged into WordPress admin  
**When** I navigate to "Bookings" → "Staff" → "Add New"  
**Then** I see a form with:

**Personal Information:**
- First Name (required)
- Last Name (required)
- Email (required, must be unique)
- Phone (optional)
- Photo (upload): Shown to customers during booking
- Bio (textarea): Brief description shown to customers (e.g., "Emma has 10 years of experience specializing in balayage")

**Account Settings:**
- Role: Staff Member (fixed, cannot change)
- Password: Auto-generated (sent to staff via email) OR manually set
- Account Status: Active / Inactive (if inactive, cannot log in, not bookable)

**Services:**
- "Assign Services" button → Opens modal with list of all services (checkboxes)
- Select which services this staff member can provide
- Optionally set custom pricing per service (same as User Story 4.2)

**Working Hours (Default Pattern):**
- Set weekly schedule:
  - Monday: 9:00 AM - 5:00 PM
  - Tuesday: 9:00 AM - 5:00 PM
  - Wednesday: 9:00 AM - 5:00 PM
  - Thursday: 9:00 AM - 5:00 PM
  - Friday: 9:00 AM - 5:00 PM
  - Saturday: 10:00 AM - 3:00 PM
  - Sunday: Closed
- Each day has "Add hours" button (can add split shifts, e.g., "9am-12pm, 2pm-6pm")

**Google Calendar Integration:**
- "Connect Google Calendar" button
- OAuth flow: Staff member signs into their Google account, grants access
- Once connected: "Sync enabled ✓" badge shown

**And when** I click "Save Staff Member"  
**Then**:
- Staff account created
- Welcome email sent to staff with login credentials
- Staff can immediately log into dashboard
- Staff appears in customer booking flow for assigned services

**Edge Cases:**
- If email already exists → Error: "A user with this email already exists"
- If no services assigned → Warning: "This staff member has no services assigned. They won't appear in booking flow."
- If Google Calendar not connected → Staff can still use system, but no calendar sync

---

#### **User Story 4.4: WordPress Admin Configures Payment Gateway**

**As a** WordPress Admin  
**I want to** connect Stripe and PayPal accounts  
**So that** customers can pay for bookings

**Acceptance Criteria:**

**Given** I'm logged into WordPress admin  
**When** I navigate to "Bookings" → "Settings" → "Payments"  
**Then** I see:

**Stripe Configuration:**
- "Connect with Stripe" button (if not connected)
- OR "Connected ✓" badge + "Disconnect" button (if connected)
- Test Mode toggle: On / Off
- If Test Mode ON → Use test API keys (no real charges)
- If Test Mode OFF → Use live API keys (real charges)
- Fields:
  - Stripe Publishable Key (required)
  - Stripe Secret Key (required)
  - Webhook Signing Secret (optional, for advanced users)

**PayPal Configuration:**
- "Connect with PayPal" button (if not connected)
- OR "Connected ✓" badge + "Disconnect" button (if connected)
- Test Mode toggle: Sandbox / Live
- Fields:
  - PayPal Client ID (required)
  - PayPal Secret (required)

**Payment Options:**
- Enabled Payment Methods (checkboxes):
  - ☑ Stripe (Credit/Debit Card)
  - ☑ PayPal
  - ☐ Pay on Arrival (no online payment)
- Default Payment Method (dropdown): Stripe (if customer doesn't choose)

**Currency:**
- Currency: GBP (£) - Fixed for Phase 1, no other options

**And when** I click "Save Changes"  
**Then**:
- Payment gateways are activated
- Customers see selected payment options at checkout
- Test charges (if Test Mode) go to Stripe/PayPal test accounts
- Live charges (if Live Mode) go to Business Owner's real accounts

**Edge Cases:**
- If I save without entering API keys → Error: "API keys are required"
- If I enter invalid API keys → Error on save: "Could not connect to Stripe. Please check your keys."
- If I enable "Pay on Arrival" only (no Stripe/PayPal) → Bookings are confirmed with £0 payment, balance tracked as "Due on arrival"

---

#### **User Story 4.5: WordPress Admin Configures White-Label Branding**

**As a** WordPress Admin  
**I want to** customize the dashboard branding for my client  
**So that** it matches their business identity (co-branded mode)

**Acceptance Criteria:**

**Given** I'm logged into WordPress admin  
**When** I navigate to "Bookings" → "Settings" → "Branding"  
**Then** I see:

**Branding Mode** (fixed for this client):
- Co-Branded Mode (client logo + "Powered by [YourCompany]")

**Client Branding:**
- Company Name (text field): e.g., "Shine & Style Hair Studio"
- Logo Upload: Click to upload client's logo (PNG/JPG, max 500KB)
  - Recommended size: 200x80px
  - Preview shown after upload
- Primary Color (color picker): Main brand color (e.g., #3B82F6)
- Secondary Color (color picker): Accent color (e.g., #10B981)
- Favicon Upload: Small icon for browser tab (ICO/PNG, 32x32px)

**Dashboard Footer:**
- "Powered by [YourCompany]" (locked, cannot disable in co-branded mode)
- Your Company Logo: Upload your logo (shown next to "Powered by" text)
- Your Company URL: Link when customers/staff click "Powered by" text

**Customer-Facing Booking Page:**
- Show "Powered by" on booking page? (toggle): Yes / No
  - If Yes → Small footer text: "Powered by [YourCompany]"
  - If No → No branding on public booking page (only in dashboards)

**Preview:**
- "Preview Dashboard" button → Opens preview of staff dashboard with applied branding
- "Preview Booking Page" button → Opens preview of customer booking flow

**And when** I click "Save Changes"  
**Then**:
- Branding is applied immediately to all dashboards (staff + business owner)
- Client's logo appears in top-left corner
- Primary color used for buttons, links, headers
- Secondary color used for hover states, accents
- "Powered by [YourCompany]" appears in footer with your logo

**Edge Cases:**
- If no logo uploaded → Show client's company name as text only
- If colors not chosen → Use default theme colors (blue primary, green secondary)
- If "Powered by" disabled on booking page → Still appears in dashboards (staff and business owner see it)

---

## 4. MOSCOW PRIORITIZATION - FINAL

### **MUST HAVE (Phase 1 MVP Blockers):**

**Core Booking:**
- ✅ Service creation with duration (15min - 24hrs)
- ✅ Staff-specific pricing
- ✅ Real-time availability (prevent double-bookings)
- ✅ Guest checkout
- ✅ Buffer time per service
- ✅ Booking confirmation emails
- ✅ 24hr reminder emails (sent at 8am day before, or immediate if <24hrs)
- ✅ **Simple "Special Requests" text field** (customer can add notes during booking)

**Payment:**
- ✅ Stripe integration (with idempotency keys to prevent double-charging)
- ✅ PayPal integration
- ✅ Deposit (fixed/percentage) or full payment per service
- ✅ Pay on arrival option (£0 deposit)
- ✅ Payment receipts
- ✅ **Partial payment tracking** (staff can record multiple payments until balance = £0)

**Dashboards:**
- ✅ Business Owner dashboard (view all, manage all, basic reports)
- ✅ Staff dashboard (own bookings only, team calendar read-only, block time off)
- ✅ Login/authentication (separate from WordPress users)

**WordPress Admin:**
- ✅ Service management (add/edit/deactivate only - cannot delete if bookings exist)
- ✅ Staff management (add/edit/deactivate only - cannot delete if bookings exist)
- ✅ Working hours per staff (weekly pattern + exceptions)
- ✅ Cancellation policy settings (global, not per-service)
- ✅ Payment gateway config
- ✅ **Co-branded white-label settings** (client logo + "Powered by [YourCompany]" in dashboards, NO "Powered by" in customer-facing emails)

**Customer Management:**
- ✅ Customer database
- ✅ Cancel/reschedule via email magic links (valid 7 days)
- ✅ Customer accounts (optional, created AFTER first booking)
- ✅ **Email cannot be changed after account creation** (Phase 1 limitation - must contact Business Owner)
- ✅ **Data export for Business Owner** (customers CSV, bookings CSV, payments CSV)

**Compliance:**
- ✅ GDPR (encryption, right to erasure, marketing consent)
- ✅ WCAG 2.1 AA accessibility
- ✅ GBP currency only
- ✅ UK timezone only (Europe/London - no automatic conversion for international customers)

**Calendar Integration:**
- ✅ Google Calendar 1-way sync (plugin → Google only)
- ✅ UK bank holidays auto-blocked (configurable on/off)

---

### **SHOULD HAVE (Deferred to Phase 2):**

- ⏭️ Package bookings
- ⏭️ Recurring appointments
- ⏭️ Group bookings/events
- ⏭️ Approval workflow
- ⏭️ Custom intake forms per service
- ⏭️ SMS reminders
- ⏭️ Google Calendar 2-way sync
- ⏭️ Automatic refunds (manual approval only in Phase 1)
- ⏭️ VAT-compliant invoices
- ⏭️ Per-service cancellation policies
- ⏭️ Advanced reporting (staff performance, peak hours)

---

### **COULD HAVE (Phase 3+):**

- 💡 Multi-location support
- 💡 Zoom/Google Meet auto-integration
- 💡 Customer loyalty tracking
- 💡 Gift cards/vouchers
- 💡 Staff tips/gratuity
- 💡 Multi-currency

---

### **WON'T HAVE (Out of Scope Permanently):**

- ❌ CRM features (treatment plans, file attachments)
- ❌ POS system integration
- ❌ Marketing automation
- ❌ Social media booking
- ❌ Membership/subscription billing
- ❌ Mobile apps (iOS/Android)
- ❌ Shift scheduling/payroll
- ❌ Multi-language support

---

## 5. TECHNICAL DECISIONS - LOCKED

### **Architecture:**
- ✅ Custom database tables (NOT WordPress post types)
- ✅ Single-site WordPress only (NOT Multisite)
- ✅ API-ready design (schema supports future REST API, but endpoints not built in Phase 1)
- ✅ Separate frontend authentication (not WordPress users table for customers)

### **Edge Case Handling:**

**1. Time Zones:**
- All times stored and displayed in UK timezone (`Europe/London`)
- No automatic conversion for international customers
- DST changes handled by PHP timezone library (existing bookings don't shift)

**2. Payment Failure Recovery:**
- Stripe idempotency keys prevent double-charging on retry
- If payment succeeds but booking creation fails → Admin alert + manual booking creation
- Payments recorded BEFORE appointments to track orphaned transactions

**3. Race Conditions:**
- Database UNIQUE constraint on (`staff_id`, `booking_date`, `start_time`)
- If two customers book same slot simultaneously → Second gets error "Time no longer available"
- No slot reservation during checkout (rare edge case, adds complexity)

**4. Data Integrity:**
- **Staff with bookings:** Can only deactivate (not delete)
- **Services with bookings:** Can only deactivate (not delete)
- **Bookings are snapshots:** Store service duration/price at booking time (don't update if service changes)
- **Customer email:** Cannot be changed after account creation (Phase 1 limitation)

**5. Multi-Day Bookings:**
- ✅ Overnight bookings supported (cross midnight once): 6pm → 2am
- ❌ Multi-day bookings NOT supported (48+ hours): Must create separate bookings per day
- Deferred to Phase 2 (adds significant calendar/payment complexity)

**6. Business vs Staff Hours:**
- Staff-level hours only (no global business hours constraint in Phase 1)
- If Business Owner wants uniform closing time → Manually sets all staff to end at 6pm
- Bookings auto-blocked if they would end after staff's working hours

**7. Reminder Email Timing:**
- Sent at 8am UK time the day before appointment
- If booking is <24 hours in advance → Reminder sent immediately after confirmation
- If same-day booking → No separate reminder (confirmation serves as reminder)

**8. No-Show Detection:**
- Manual only in Phase 1 (staff marks as "No-show" or "Completed")
- No automatic detection (avoids false positives if staff running late)
- Deferred to Phase 2: Hourly cron job to auto-mark no-shows 2+ hours past appointment time

**9. Mobile Responsiveness Targets:**
- **Customer booking flow:** All devices (320px+ width) - PRIMARY
- **Staff dashboard:** Tablet-optimized (768px+), phone-usable but not primary
- **Business Owner dashboard:** Desktop/tablet-optimized (1024px+), phone-usable but not primary
- Specific breakpoints defined in design phase

**10. Branding in Customer Communications:**
- **Customer booking page:** Client branding + optional "Powered by" footer (configurable)
- **Customer emails (confirmation, reminder, cancellation):** Client branding ONLY (no "Powered by")
- **Staff/Business Owner dashboards:** Co-branded (client logo + "Powered by [YourCompany]" footer)
- **Staff/Business Owner emails:** Co-branded (show "Powered by [YourCompany]")

---

## 6. DATABASE SCHEMA - LOCKED

Based on your decision to use **custom tables** (not WordPress post types), here's the complete database structure:

### **Table 1: `wp_bookings_services`**

Stores all bookable services.

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique service ID |
| `name` | VARCHAR(255) NOT NULL | e.g., "Women's Haircut" |
| `category` | VARCHAR(100) | e.g., "Haircuts", "Coloring" |
| `description` | TEXT | Rich text description shown to customers |
| `duration_minutes` | INT UNSIGNED NOT NULL | Service duration (e.g., 45) |
| `buffer_minutes` | INT UNSIGNED DEFAULT 0 | Cleanup time after service (e.g., 15) |
| `base_price` | DECIMAL(10,2) NOT NULL | Base price in GBP (e.g., 35.00) |
| `deposit_type` | ENUM('none', 'fixed', 'percentage', 'full') DEFAULT 'none' | How deposit is calculated |
| `deposit_amount` | DECIMAL(10,2) DEFAULT 0 | Fixed deposit (e.g., 20.00) OR percentage (e.g., 50.00 = 50%) |
| `booking_window_days` | INT UNSIGNED DEFAULT 1 | How far in advance customers can book |
| `status` | ENUM('active', 'inactive') DEFAULT 'active' | Published or draft |
| `created_at` | DATETIME NOT NULL | Timestamp when service was created |
| `updated_at` | DATETIME | Timestamp when service was last edited |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`status`) - For quickly filtering active services

---

### **Table 2: `wp_bookings_staff`**

Stores staff member profiles and settings.

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique staff ID |
| `user_id` | BIGINT UNSIGNED | Links to WordPress `wp_users` table (for login) |
| `first_name` | VARCHAR(100) NOT NULL | e.g., "Emma" |
| `last_name` | VARCHAR(100) NOT NULL | e.g., "Thompson" |
| `email` | VARCHAR(255) NOT NULL UNIQUE | Login email |
| `phone` | VARCHAR(20) | Optional phone number |
| `photo_url` | VARCHAR(500) | URL to uploaded photo |
| `bio` | TEXT | Short bio shown to customers |
| `status` | ENUM('active', 'inactive') DEFAULT 'active' | Can staff log in and be booked? |
| `show_earnings` | BOOLEAN DEFAULT TRUE | Show earnings in staff dashboard? (Business Owner toggle) |
| `google_calendar_token` | TEXT | OAuth token for Google Calendar sync (encrypted) |
| `google_calendar_id` | VARCHAR(255) | Google Calendar ID (e.g., "user@gmail.com") |
| `created_at` | DATETIME NOT NULL | When staff account was created |
| `updated_at` | DATETIME | Last profile update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`email`)
- INDEX (`user_id`) - For quick login lookups
- INDEX (`status`) - For filtering active staff

---

### **Table 3: `wp_bookings_staff_services`**

Many-to-many relationship: Which staff can provide which services, with custom pricing.

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique relationship ID |
| `staff_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_staff.id` |
| `service_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_services.id` |
| `custom_price` | DECIMAL(10,2) DEFAULT NULL | If NULL, use service's base_price. If set, overrides base_price |
| `created_at` | DATETIME NOT NULL | When assignment was created |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`staff_id`, `service_id`) - Staff cannot be assigned same service twice
- INDEX (`staff_id`) - For looking up all services a staff member provides
- INDEX (`service_id`) - For looking up all staff who provide a service

---

### **Table 4: `wp_bookings_working_hours`**

Stores staff availability patterns (weekly schedule + exceptions).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique availability ID |
| `staff_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_staff.id` |
| `type` | ENUM('pattern', 'exception') | 'pattern' = weekly repeating, 'exception' = one-off |
| `day_of_week` | TINYINT UNSIGNED | 0=Sunday, 1=Monday, ..., 6=Saturday (NULL for exceptions) |
| `date` | DATE DEFAULT NULL | Specific date (only for exceptions, e.g., vacation Aug 1-15) |
| `start_time` | TIME | e.g., "09:00:00" |
| `end_time` | TIME | e.g., "17:00:00" |
| `is_available` | BOOLEAN DEFAULT TRUE | TRUE = working, FALSE = blocked (vacation, lunch) |
| `reason` | VARCHAR(255) | e.g., "Vacation", "Lunch Break" (for blocked time) |
| `repeat_type` | ENUM('none', 'daily', 'weekly') DEFAULT 'none' | For recurring exceptions (e.g., lunch 12pm-1pm daily) |
| `created_at` | DATETIME NOT NULL | When availability was set |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`staff_id`, `day_of_week`) - For quickly fetching weekly pattern
- INDEX (`staff_id`, `date`) - For checking specific date availability
- INDEX (`staff_id`, `type`) - For separating patterns from exceptions

**Example Data:**

**Weekly Pattern (Emma works Mon-Fri 9am-5pm):**
```
staff_id=1, type='pattern', day_of_week=1 (Mon), start_time='09:00', end_time='17:00', is_available=TRUE
staff_id=1, type='pattern', day_of_week=2 (Tue), start_time='09:00', end_time='17:00', is_available=TRUE
... (repeat for Wed, Thu, Fri)
```

**Exception (Emma on vacation Aug 1-15):**
```
staff_id=1, type='exception', date='2026-08-01', start_time='00:00', end_time='23:59', is_available=FALSE, reason='Vacation'
staff_id=1, type='exception', date='2026-08-02', ... (repeat for each day)
```

**Recurring Exception (Emma's lunch 12pm-1pm daily):**
```
staff_id=1, type='exception', start_time='12:00', end_time='13:00', is_available=FALSE, reason='Lunch Break', repeat_type='daily'
```

---

### **Table 5: `wp_bookings_customers`**

Stores customer information (both guest and registered).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique customer ID |
| `user_id` | BIGINT UNSIGNED DEFAULT NULL | Links to WordPress `wp_users` if customer creates account (NULL for guests) |
| `first_name` | VARCHAR(100) NOT NULL | e.g., "Sarah" |
| `last_name` | VARCHAR(100) NOT NULL | e.g., "Johnson" |
| `email` | VARCHAR(255) NOT NULL | Login email (if account) or booking email (if guest) |
| `phone` | VARCHAR(20) NOT NULL | Required for bookings |
| `marketing_consent` | BOOLEAN DEFAULT FALSE | Opted in to newsletters? (GDPR) |
| `notes` | TEXT | Internal notes added by staff/business owner |
| `total_bookings` | INT UNSIGNED DEFAULT 0 | Count of all bookings (for loyalty tracking) |
| `total_spent` | DECIMAL(10,2) DEFAULT 0 | Lifetime value (sum of all completed bookings) |
| `created_at` | DATETIME NOT NULL | When customer first booked |
| `updated_at` | DATETIME | Last profile update |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`email`) - One customer record per email
- INDEX (`user_id`) - For quick lookups of registered customers
- INDEX (`total_bookings`) - For finding VIP customers

---

### **Table 6: `wp_bookings_appointments`**

Stores all bookings (past, present, future).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique booking ID |
| `customer_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_customers.id` |
| `staff_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_staff.id` |
| `service_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_services.id` |
| `booking_date` | DATE NOT NULL | Date of appointment (e.g., '2026-05-15') |
| `start_time` | TIME NOT NULL | Start time (e.g., '14:00:00') |
| `end_time` | TIME NOT NULL | Calculated: start_time + duration + buffer |
| `duration_minutes` | INT UNSIGNED NOT NULL | Copied from service at booking time (in case service duration changes later) |
| `price` | DECIMAL(10,2) NOT NULL | Final price (staff-specific or base price, copied at booking time) |
| `deposit_paid` | DECIMAL(10,2) DEFAULT 0 | Amount paid upfront (can be 0 for "pay on arrival") |
| `balance_due` | DECIMAL(10,2) DEFAULT 0 | Remaining amount (price - deposit_paid) |
| `status` | ENUM('confirmed', 'completed', 'cancelled', 'no_show', 'pending') DEFAULT 'confirmed' | Booking lifecycle |
| `payment_status` | ENUM('unpaid', 'deposit_paid', 'paid_full', 'refunded', 'partially_refunded') DEFAULT 'unpaid' | Payment tracking |
| `payment_method` | VARCHAR(50) | 'stripe', 'paypal', 'pay_on_arrival' |
| `payment_intent_id` | VARCHAR(255) | Stripe Payment Intent ID or PayPal Transaction ID (for refunds) |
| `cancellation_reason` | TEXT | Why was booking cancelled? (customer or staff notes) |
| `cancelled_at` | DATETIME DEFAULT NULL | Timestamp of cancellation |
| `cancelled_by` | ENUM('customer', 'staff', 'business_owner') DEFAULT NULL | Who cancelled |
| `internal_notes` | TEXT | Staff/Business Owner notes (not visible to customer) |
| `google_calendar_event_id` | VARCHAR(255) | ID of synced Google Calendar event (for updates/deletions) |
| `magic_link_token` | VARCHAR(64) | Unique token for cancellation/rescheduling links (security) |
| `created_at` | DATETIME NOT NULL | When booking was created |
| `updated_at` | DATETIME | Last modification |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`customer_id`) - For fetching customer's booking history
- INDEX (`staff_id`, `booking_date`) - For fetching staff's schedule
- INDEX (`booking_date`, `status`) - For daily booking reports
- INDEX (`magic_link_token`) - For validating cancellation/reschedule links
- INDEX (`status`, `payment_status`) - For finding pending actions

---

### **Table 7: `wp_bookings_payments`**

Stores payment transaction history (for auditing and refunds).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Unique payment ID |
| `appointment_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_appointments.id` |
| `customer_id` | BIGINT UNSIGNED NOT NULL | Foreign key → `wp_bookings_customers.id` |
| `amount` | DECIMAL(10,2) NOT NULL | Amount charged (can be negative for refunds) |
| `payment_method` | VARCHAR(50) NOT NULL | 'stripe', 'paypal', 'cash', 'card_machine' |
| `transaction_id` | VARCHAR(255) | Stripe/PayPal transaction ID |
| `status` | ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' | Payment lifecycle |
| `type` | ENUM('deposit', 'full_payment', 'balance_payment', 'refund') | What type of payment |
| `notes` | TEXT | Internal notes (e.g., "Refunded due to no-show policy exception") |
| `created_at` | DATETIME NOT NULL | When payment was processed |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`appointment_id`) - For fetching all payments for a booking
- INDEX (`customer_id`) - For customer payment history
- INDEX (`transaction_id`) - For looking up Stripe/PayPal transactions
- INDEX (`created_at`) - For financial reports by date range

---

### **Table 8: `wp_bookings_settings`**

Stores global plugin settings (business info, policies, branding).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Always single row (ID=1) |
| `business_name` | VARCHAR(255) | Client's business name |
| `business_address` | TEXT | Physical address shown in confirmations |
| `business_phone` | VARCHAR(20) | Contact number |
| `business_email` | VARCHAR(255) | Contact email |
| `logo_url` | VARCHAR(500) | Uploaded logo URL |
| `primary_color` | VARCHAR(7) | Hex color (e.g., '#3B82F6') |
| `secondary_color` | VARCHAR(7) | Hex color |
| `favicon_url` | VARCHAR(500) | Favicon URL |
| `powered_by_visible` | BOOLEAN DEFAULT TRUE | Show "Powered by [YourCompany]"? |
| `powered_by_logo_url` | VARCHAR(500) | Your company logo |
| `powered_by_url` | VARCHAR(500) | Link when clicked |
| `cancellation_window_hours` | INT UNSIGNED DEFAULT 24 | Hours before appointment for free cancellation |
| `refund_within_window` | ENUM('full', 'partial', 'none', 'store_credit') DEFAULT 'full' | Refund policy within window |
| `refund_percentage` | TINYINT UNSIGNED DEFAULT 100 | % refunded if partial (0-100) |
| `refund_outside_window` | ENUM('full', 'partial', 'none', 'store_credit') DEFAULT 'none' | Late cancel policy |
| `refund_no_show` | ENUM('full', 'partial', 'none', 'store_credit') DEFAULT 'none' | No-show policy |
| `reschedule_allowed` | BOOLEAN DEFAULT TRUE | Can customers reschedule? |
| `reschedule_fee` | DECIMAL(10,2) DEFAULT 0 | Fee for rescheduling (0 = free) |
| `stripe_public_key` | VARCHAR(255) | Encrypted |
| `stripe_secret_key` | VARCHAR
(255) | Encrypted |
| `stripe_test_mode` | BOOLEAN DEFAULT TRUE | Test or live mode? |
| `paypal_client_id` | VARCHAR(255) | Encrypted |
| `paypal_secret` | VARCHAR(255) | Encrypted |
| `paypal_test_mode` | BOOLEAN DEFAULT TRUE | Sandbox or live? |
| `uk_bank_holidays_enabled` | BOOLEAN DEFAULT TRUE | Auto-block bank holidays? |
| `reminder_email_hours` | INT UNSIGNED DEFAULT 24 | Hours before appointment to send reminder |
| `timezone` | VARCHAR(50) DEFAULT 'Europe/London' | Business timezone |
| `created_at` | DATETIME NOT NULL | Plugin activation |
| `updated_at` | DATETIME | Last settings update |

**Note:** This table always has exactly ONE row (ID=1). Settings are updated, never inserted/deleted.

---

### **Table 9: `wp_bookings_email_templates`**

Stores customizable email templates.

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Template ID |
| `type` | VARCHAR(50) NOT NULL UNIQUE | 'booking_confirmation', 'booking_reminder', 'booking_cancellation', 'staff_new_booking', etc. |
| `subject` | VARCHAR(255) NOT NULL | Email subject line |
| `body` | TEXT NOT NULL | HTML email body (supports variables like {customer_name}, {service_name}, {date}, {time}) |
| `enabled` | BOOLEAN DEFAULT TRUE | Can be disabled without deleting |
| `updated_at` | DATETIME | Last edit |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`type`) - One template per email type

**Example Data:**
```
type='booking_confirmation'
subject='Your booking with {business_name} is confirmed'
body='<p>Hi {customer_name},</p><p>Your {service_name} with {staff_name} is confirmed for {date} at {time}.</p>...'
```

---

### **Table 10: `wp_bookings_holiday_dates`**

Stores UK bank holidays (pre-loaded, auto-blocks these dates).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY | Holiday ID |
| `date` | DATE NOT NULL UNIQUE | e.g., '2026-12-25' (Christmas) |
| `name` | VARCHAR(255) NOT NULL | e.g., "Christmas Day" |
| `country` | VARCHAR(2) DEFAULT 'GB' | For future expansion (Scotland, Wales, Northern Ireland have different holidays) |
| `created_at` | DATETIME NOT NULL | When added |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`date`) - One holiday per date
- INDEX (`country`) - For filtering by region

**Pre-Loaded Data (2026 UK Bank Holidays):**
```
2026-01-01 | New Year's Day
2026-04-03 | Good Friday
2026-04-06 | Easter Monday
2026-05-04 | Early May Bank Holiday
2026-05-25 | Spring Bank Holiday
2026-08-31 | Summer Bank Holiday
2026-12-25 | Christmas Day
2026-12-28 | Boxing Day (substitute, since 26th is Saturday)
```

---

**Key Constraints Added from Gap Analysis:**
- `wp_bookings_appointments`: UNIQUE constraint on (`staff_id`, `booking_date`, `start_time`)
- `wp_bookings_staff`: Cannot DELETE if ANY bookings exist (only deactivate via `status='inactive'`)
- `wp_bookings_services`: Cannot DELETE if ANY bookings exist (only deactivate via `status='inactive'`)
- `wp_bookings_customers`: Email cannot be updated once account created (UPDATE restricted)

---

## 7. OUT OF SCOPE - EXPLICIT LIST

### **Features NOT Built in Phase 1:**

**Booking Types:**
1. ❌ Package bookings (multi-session credits)
2. ❌ Recurring appointments (weekly series)
3. ❌ Group bookings/events (capacity limits)
4. ❌ Multi-day bookings (48+ hours)
5. ❌ Approval workflow (pending bookings)

**Customer Features:**
6. ❌ Customer portal (self-service account management beyond viewing history)
7. ❌ Custom intake forms per service
8. ❌ Saved payment methods
9. ❌ Email address changes (locked after account creation)
10. ❌ Favorite staff member auto-selection

**Staff Features:**
11. ❌ Manage other staff's bookings (own bookings only)
12. ❌ Add/edit services (WordPress Admin only)
13. ❌ View business-wide revenue (own earnings only, if enabled)

**Business Owner Features:**
14. ❌ Per-service cancellation policies (global only)
15. ❌ Automatic refund processing (manual approval required)
16. ❌ Automatic no-show detection (manual marking)
17. ❌ Bulk actions (cancel multiple bookings at once)
18. ❌ Staff performance reports (basic revenue totals only)
19. ❌ Peak hours analysis
20. ❌ Customer retention metrics

**Integrations:**
21. ❌ SMS reminders (email only)
22. ❌ Google Calendar 2-way sync (one-way only: plugin → Google)
23. ❌ Zoom/Google Meet auto-links
24. ❌ Outlook/iCal sync
25. ❌ Accounting software (Xero, QuickBooks)
26. ❌ Email marketing platforms (Mailchimp)
27. ❌ WhatsApp booking

**Technical:**
28. ❌ Multi-location support (single location only)
29. ❌ Multi-currency (GBP only)
30. ❌ Multi-timezone (UK timezone only)
31. ❌ Multi-language (English only)
32. ❌ WordPress Multisite support
33. ❌ REST API endpoints (schema designed for it, but not exposed)
34. ❌ Mobile apps (web-responsive only)

---

## 8. API STRUCTURE (Designed for Phase 2, Not Built in Phase 1)

Even though we're not building REST API endpoints in Phase 1, the database schema above is designed to support clean API design later. Here's what the API structure would look like in Phase 2 when you build the mobile app:

### **Authentication Endpoints:**
```
POST   /wp-json/bookings/v1/auth/login
POST   /wp-json/bookings/v1/auth/register
POST   /wp-json/bookings/v1/auth/logout
POST   /wp-json/bookings/v1/auth/refresh-token
```

### **Customer Endpoints:**
```
GET    /wp-json/bookings/v1/services                  # List all bookable services
GET    /wp-json/bookings/v1/services/{id}/availability # Check availability for service + staff
POST   /wp-json/bookings/v1/appointments              # Create booking
GET    /wp-json/bookings/v1/appointments/{id}         # Get booking details
PATCH  /wp-json/bookings/v1/appointments/{id}         # Reschedule booking
DELETE /wp-json/bookings/v1/appointments/{id}         # Cancel booking
GET    /wp-json/bookings/v1/customers/me/appointments # My booking history
```

### **Staff Endpoints:**
```
GET    /wp-json/bookings/v1/staff/me/schedule          # My upcoming appointments
GET    /wp-json/bookings/v1/staff/me/stats             # My earnings/performance
POST   /wp-json/bookings/v1/staff/time-off             # Block time
PATCH  /wp-json/bookings/v1/appointments/{id}/complete # Mark as completed
POST   /wp-json/bookings/v1/appointments/{id}/no-show  # Mark as no-show
```

### **Business Owner Endpoints:**
```
GET    /wp-json/bookings/v1/admin/appointments         # All bookings (filtered)
GET    /wp-json/bookings/v1/admin/customers            # Customer database
GET    /wp-json/bookings/v1/admin/reports              # Analytics
POST   /wp-json/bookings/v1/admin/refunds              # Process refund
```

**Why Design This Now?**
- Ensures database schema supports efficient API queries
- Frontend dashboard code can be written in a way that's easy to convert to API calls later
- When Phase 2 starts, you're not refactoring the entire database

---

## 9. SUCCESS METRICS - PHASE 1 LAUNCH

**MVP is "launch-ready" when:**

1. ✅ WordPress Admin can build website for salon with 5 staff, 10 services
2. ✅ Customers can book appointments 24/7 (guest checkout works)
3. ✅ Staff can log in, view schedule, block time off
4. ✅ Business Owner can log in, view all bookings, see basic reports
5. ✅ Automated emails work (confirmation, reminder, cancellation)
6. ✅ Payments work (Stripe deposit, PayPal full payment, pay-on-arrival tracking)
7. ✅ Google Calendar sync works (bookings appear in staff's calendar)
8. ✅ Cancel/reschedule works (customer clicks magic link, policy enforced)
9. ✅ GDPR compliant (data encryption, consent checkboxes, right to erasure)
10. ✅ WCAG 2.1 AA compliant (keyboard navigation, screen reader support)

**Anything beyond these 10 items is scope creep for Phase 1.**

---

## 10. KNOWN LIMITATIONS - PHASE 1

These are **intentional limitations** (not bugs) that will be addressed in Phase 2:

| Limitation | Impact | Workaround for Phase 1 |
|------------|--------|------------------------|
| No package bookings | Emma (coach) cannot use | Target salons/photographers only initially |
| No recurring appointments | James (physio) cannot use | Customer books weekly manually |
| No group bookings | James (physio) Pilates classes | Run classes outside plugin, book 1-on-1 only |
| No approval workflow | Michael (photographer) must call customers | Accept bookings, confirm location via phone |
| No multi-day bookings | 3-day wedding shoots | Create 3 separate bookings (Fri, Sat, Sun) |
| Email cannot be changed | Customer typo in email | Business Owner updates database manually |
| UK timezone only | International customers confused | Clearly display "All times in UK timezone" |
| Manual refunds only | Business Owner must approve each | Adds control, prevents abuse |
| No automatic no-shows | Staff must mark manually | Encourages communication with customer first |
| Single location only | Multi-branch salons | Each branch needs separate website/plugin instance |

---

## 11. RISK ASSESSMENT

### **High-Risk Items (Could Delay Launch):**

1. **Stripe/PayPal Integration Complexity**
   - Risk: Payment webhooks, refund API, error handling
   - Mitigation: Use official SDKs, test extensively in sandbox mode

2. **Google Calendar OAuth Flow**
   - Risk: OAuth token expiry, sync failures, rate limits
   - Mitigation: Start with 1-way sync only, graceful error handling

3. **Race Condition Testing**
   - Risk: Double-bookings if database constraint fails
   - Mitigation: Load testing with concurrent requests

4. **GDPR Compliance Audit**
   - Risk: Missing data protection requirements
   - Mitigation: Legal review before launch (checklist in next phase)

### **Medium-Risk Items (Could Impact UX):**

5. **Mobile Responsiveness**
   - Risk: Complex calendar UI on small screens
   - Mitigation: Simplify mobile calendar (list view vs grid)

6. **Email Deliverability**
   - Risk: Confirmation emails going to spam
   - Mitigation: DKIM/SPF setup guide, test with major providers

### **Low-Risk Items (Minor Issues):**

7. **Browser Compatibility**
   - Risk: Old browsers (IE11) not supported
   - Mitigation: Document supported browsers (Chrome, Firefox, Safari, Edge modern versions)

---

## 12. ASSUMPTIONS & DEPENDENCIES

### **Assumptions:**

1. WordPress 6.0+ environment (modern WP features available)
2. PHP 8.0+ and MySQL 5.7+ (standard hosting requirements)
3. HTTPS enabled (required for Stripe, Google Calendar OAuth)
4. Clients have Stripe/PayPal accounts (you don't provide payment processing)
5. Staff have Google accounts (for calendar sync)
6. Business Owner has basic computer literacy (can log into dashboard)
7. You (WordPress Admin) handle all initial setup (clients don't configure plugin themselves)

### **Dependencies:**

1. **External APIs:**
   - Stripe API (payments, refunds)
   - PayPal API (payments, refunds)
   - Google Calendar API (OAuth, event creation)

2. **WordPress Core:**
   - User authentication system (for staff/business owner login)
   - Cron jobs (for reminder emails, potential no-show detection)
   - Media library (for logo/photo uploads)

3. **Hosting Requirements:**
   - PHP 8.0+, MySQL 5.7+, 256MB+ memory
   - SSL certificate (HTTPS)
   - Email sending capability (SMTP or transactional email service)

---

## 13. NEXT STEPS - MOVING TO PHASE 2.2

Now that Phase 2.1 (Discovery & Scope) is **LOCKED**, we proceed to:

### **Phase 2.2: Functional Requirements - Customer Journey**

**Deliverables:**
1. Complete customer booking flow (step-by-step wireframe descriptions)
2. Detailed acceptance criteria for each step
3. Form validation rules
4. Error messages
5. Success states
6. Edge case handling

**Estimated Time:** 90-120 minutes

**Approach:**
- Walk through all 6 steps of customer booking journey
- Define exactly what appears on each screen
- Specify all error scenarios
- Document mobile vs desktop differences

---

## 14. DOCUMENT SIGN-OFF

**Phase 2.1 Scope Definition - APPROVED**

- ✅ Core booking scenarios defined
- ✅ User roles & permissions locked
- ✅ MoSCoW prioritization complete
- ✅ Out-of-scope list explicit
- ✅ Technical decisions locked
- ✅ Database schema designed
- ✅ 16 gap analysis items resolved
- ✅ Known limitations documented
- ✅ Risk assessment complete

**Status:** READY FOR PHASE 2.2

**Estimated Phase 1 Development Time:** 3-4 months

**Estimated Lines of Code:** 15,000-20,000 (rough estimate based on scope)
