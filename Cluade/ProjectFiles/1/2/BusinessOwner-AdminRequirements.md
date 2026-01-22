# Business Owner/Admin Requirements
## Phase 2.3: Functional Requirements - Business Side

**Document Status:** DRAFT  
**Created:** Session 2.3  
**Focus:** Business Owner dashboard and WordPress Admin configuration requirements

---

## TABLE OF CONTENTS

1. [Epic 1: Initial Setup & Onboarding](#epic-1-initial-setup--onboarding)
2. [Epic 2: Day-to-Day Booking Management](#epic-2-day-to-day-booking-management)
3. [Epic 3: Staff & Service Management](#epic-3-staff--service-management)
4. [Epic 4: Pricing & Payment Configuration](#epic-4-pricing--payment-configuration)
5. [Epic 5: Reporting & Analytics](#epic-5-reporting--analytics)
6. [Epic 6: Customer Database Management](#epic-6-customer-database-management)

---

## EPIC 1: INITIAL SETUP & ONBOARDING

### User Story 1.1: Business Owner Sets Up Their First Service

**As a** Business Owner  
**I want to** create my first bookable service during initial setup  
**So that** customers can start booking immediately

**Acceptance Criteria:**

**Given** I'm a Business Owner logging into my dashboard for the first time  
**When** the dashboard loads  
**Then** I see:
- Welcome message: "Welcome to [Client Business Name] Booking System!"
- Setup wizard overlay with 4 steps:
  1. Add Your First Service
  2. Set Your Availability
  3. Configure Payments
  4. Start Taking Bookings

**And when** I click "Add Your First Service" in Step 1  
**Then** I see a simplified service creation form with:

**Basic Information:**
- Service Name (required): e.g., "Women's Haircut"
  - Character limit: 100
  - Help text: "What should customers see when booking?"
- Description (optional): 500 character textarea
  - Help text: "Describe what's included, preparation needed, etc."
- Duration (required): Dropdown with common intervals
  - 15 min, 30 min, 45 min, 1 hour, 1.5 hours, 2 hours, 3 hours, 4 hours, Custom
  - If "Custom" → Number input (5 min minimum, 24 hours maximum)

**Pricing:**
- Price (required): GBP input field
  - Format: Â£XX.XX
  - Help text: "Full price for this service"
- Deposit Required: Toggle (ON/OFF)
  - If ON → Show two options:
    - Percentage: Slider (10% - 100%, default 50%)
    - Fixed Amount: GBP input (cannot exceed service price)
  - Help text: "Customers pay deposit when booking, balance on arrival"
  - If OFF → Customer pays full amount at booking

**Buffer Time:**
- Buffer After Appointment: Dropdown
  - None, 5 min, 10 min, 15 min, 30 min
  - Help text: "Time blocked after appointment for cleanup/prep"

**And when** I click "Save & Continue"  
**Then**:
- Service is created with status "Active"
- Form validates:
  - Service name not empty
  - Duration > 0
  - Price > Â£0.01
  - If deposit ON, percentage between 10-100% OR fixed amount ≤ price
- Wizard advances to Step 2: Set Your Availability

**Edge Cases:**
- If I enter Â£0.00 price → Error: "Price must be at least Â£0.01"
- If deposit fixed amount > service price → Error: "Deposit cannot exceed service price"
- If I try to close wizard without completing → Warning: "You need at least 1 service to take bookings. Exit setup?"
- If service name already exists → Warning (not error): "You have another service with this name. Continue anyway?"

---

### User Story 1.2: Business Owner Sets Initial Availability

**As a** Business Owner  
**I want to** set my working hours during setup  
**So that** customers can only book during times I'm available

**Acceptance Criteria:**

**Given** I'm on Step 2 of the setup wizard  
**When** the availability screen loads  
**Then** I see:
- Heading: "When are you available for bookings?"
- Weekly schedule grid showing Mon-Sun
- Each day has:
  - Toggle: Working / Not Working (default: Mon-Fri ON, Sat-Sun OFF)
  - If ON → Time range selector:
    - Start Time: Dropdown (00:00 - 23:45 in 15min increments)
    - End Time: Dropdown (00:15 - 24:00 in 15min increments)
  - "Add Hours" button (for split shifts)
    - E.g., Mon 9am-12pm AND 2pm-6pm

**Default Pre-filled Values:**
- Monday-Friday: 9:00 AM - 5:00 PM
- Saturday-Sunday: Not Working

**And when** I modify hours and click "Save & Continue"  
**Then**:
- Working hours are saved to database
- These hours apply to ME (Business Owner) as a staff member
- Wizard advances to Step 3: Configure Payments

**Edge Cases:**
- If end time ≤ start time → Error: "End time must be after start time"
- If I mark all days as "Not Working" → Warning: "You have no working hours set. Customers won't be able to book. Continue anyway?"
- If I add split shift with overlapping times → Error: "Time ranges cannot overlap"
- If I have 24-hour availability (00:00-24:00) → Allowed, with confirmation: "You'll be available 24/7. Is this correct?"

---

### User Story 1.3: Business Owner Configures Payment Gateway (Setup Wizard)

**As a** Business Owner  
**I want to** connect my Stripe account during setup  
**So that** I can start accepting payments immediately

**Acceptance Criteria:**

**Given** I'm on Step 3 of the setup wizard  
**When** the payments screen loads  
**Then** I see:
- Heading: "How do you want to get paid?"
- Three payment options:
  1. **Stripe (Credit/Debit Cards)** - RECOMMENDED badge
     - "Accept card payments online"
     - "Connect with Stripe" button
  2. **PayPal** 
     - "Accept PayPal payments"
     - "Connect with PayPal" button
  3. **Pay on Arrival**
     - "Customers pay when they arrive"
     - "No online payment needed"
     - Toggle: ON/OFF

**And when** I click "Connect with Stripe"  
**Then**:
- Stripe OAuth window opens (popup or redirect)
- I log into my Stripe account (or create one if new)
- Stripe asks to authorize access for "[Client Business Name]"
- I click "Authorize"
- Popup closes, wizard shows: "✓ Stripe Connected"
- Stripe logo + Connected badge appears

**And when** I click "Save & Continue" (with Stripe connected)  
**Then**:
- Stripe credentials stored securely (OAuth tokens)
- Stripe is set as default payment method
- Wizard advances to Step 4: Start Taking Bookings

**Simplified Flow Option:**
**And when** I click "Skip for Now"  
**Then**:
- Warning: "Without payment setup, customers can only book 'Pay on Arrival' appointments"
- Checkbox: "I understand. I'll set this up later"
- If checked → Wizard advances to Step 4
- "Pay on Arrival" is set as the only available payment method

**Edge Cases:**
- If Stripe connection fails → Error: "Could not connect to Stripe. Please try again."
- If Stripe account is in unsupported country (not UK) → Error: "This booking system currently only supports UK Stripe accounts"
- If I close Stripe popup without completing → Wizard shows: "Connection cancelled. Try again?"
- If I already have Stripe connected (returning to wizard) → Show "✓ Already Connected" + "Disconnect" option

**Security Notes:**
- OAuth tokens stored encrypted in database
- Never expose Stripe Secret Key to frontend
- Use Stripe Connect (not direct API keys) for security

---

### User Story 1.4: Business Owner Completes Setup & Views Dashboard

**As a** Business Owner  
**I want to** see a summary of my setup and access my full dashboard  
**So that** I understand what's configured and can start managing bookings

**Acceptance Criteria:**

**Given** I'm on Step 4 (final) of the setup wizard  
**When** the screen loads  
**Then** I see:
- Heading: "🎉 You're Ready to Take Bookings!"
- Setup Summary card showing:
  - âœ… Services: 1 active service
  - âœ… Availability: Mon-Fri 9am-5pm
  - âœ… Payments: Stripe Connected
- "Your Booking Page" section:
  - URL shown: `https://[clientwebsite].co.uk/book`
  - "Copy Link" button
  - "View Booking Page" button (opens in new tab)
- "Next Steps" checklist:
  - â˜ Add more services (optional)
  - â˜ Add staff members (if you have a team)
  - â˜ Test a booking yourself

**And when** I click "Go to Dashboard"  
**Then**:
- Setup wizard closes permanently
- I'm redirected to main Business Owner dashboard
- Dashboard shows:
  - **Today's Appointments** widget (empty state: "No bookings yet")
  - **This Week** widget (0 bookings, Â£0 revenue)
  - **Quick Actions** buttons:
    - + Add Service
    - + Add Staff Member
    - + Create Manual Booking
    - âš™ Settings

**Edge Cases:**
- If setup wizard is incomplete (missing required steps) → Cannot advance to dashboard, must complete
- If I refresh page mid-wizard → Wizard resumes at last completed step
- If I intentionally skip setup wizard → Can access basic dashboard, but persistent banner: "⚠ Complete setup to start taking bookings"

---

## EPIC 2: DAY-TO-DAY BOOKING MANAGEMENT

### User Story 2.1: Business Owner Views All Bookings (Calendar View)

**As a** Business Owner  
**I want to** see all upcoming bookings in a calendar view  
**So that** I can get a visual overview of our schedule

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Bookings" → "Calendar"  
**Then** I see:

**Calendar Interface:**
- Monthly calendar view (default)
- View options: Day / Week / Month (tabs at top)
- Navigation: ◄ Previous | Today | Next ►
- Current date highlighted

**Booking Display:**
- Each booking appears as a colored block:
  - **Blue** = Confirmed
  - **Green** = Completed
  - **Yellow** = Pending Payment
  - **Red** = Cancelled
  - **Grey** = No-Show
  - **Purple** = Staff Time Off (blocked time)

**Booking Block Contents:**
- Time: 9:00 AM
- Customer Name: Sarah Johnson
- Service: Women's Haircut
- Staff: Emma (if multi-staff)

**Hover Interaction:**
**And when** I hover over a booking block  
**Then** I see tooltip with:
- Customer: Sarah Johnson (sarah@email.com)
- Service: Women's Haircut
- Staff: Emma Thompson
- Duration: 1 hour (9:00 AM - 10:00 AM)
- Status: Confirmed
- Payment: Â£15 deposit paid, Â£20 balance due
- Special Requests: "Please use hypoallergenic products"
- Quick Actions:
  - View Details
  - Mark as Completed
  - Cancel
  - Reschedule

**Filters:**
- Filter by Staff: [All Staff ▾] dropdown
- Filter by Service: [All Services ▾] dropdown
- Filter by Status: [All ▾] → Confirmed / Completed / Cancelled / No-Show / Pending

**And when** I click on a booking block  
**Then**:
- Booking detail modal opens (see User Story 2.2)

**Edge Cases:**
- If no bookings exist → Empty state: "No bookings scheduled. Create a manual booking or share your booking link."
- If viewing past dates → Show completed/cancelled bookings greyed out
- If multiple bookings at same time slot (different staff) → Stack blocks vertically
- If too many bookings to display → Show count bubble "+3 more" → Click to expand

---

### User Story 2.2: Business Owner Views Booking Details

**As a** Business Owner  
**I want to** see all details of a specific booking  
**So that** I can review information and take actions

**Acceptance Criteria:**

**Given** I'm viewing the calendar or list view  
**When** I click on a booking  
**Then** a modal/side panel opens showing:

**Customer Information:**
- Name: Sarah Johnson
- Email: sarah@email.com
- Phone: +44 7700 900123
- Booking History: "3rd booking" (link to customer profile)

**Booking Details:**
- Booking ID: #BK-2024-001234
- Status: Confirmed (with colored badge)
- Service: Women's Haircut
- Staff Member: Emma Thompson
- Date: Monday, 15 January 2024
- Time: 9:00 AM - 10:00 AM (1 hour)
- Special Requests: "Please use hypoallergenic products"
- Internal Notes: [Textarea - staff only]

**Payment Information:**
- Service Price: Â£35.00
- Deposit Paid: Â£15.00 (Stripe - 2024-01-10 14:32)
- Balance Due: Â£20.00
- Payment Status: Deposit Paid
- Refund Eligibility: "Full refund available until 2024-01-14 9:00 AM"

**Timeline:**
- Booked: 2024-01-10 14:32 PM
- Confirmation Email Sent: 2024-01-10 14:33 PM
- Reminder Email Sent: 2024-01-14 8:00 AM (24hrs before)

**Action Buttons:**
- [Mark as Completed]
- [Mark as No-Show]
- [Reschedule]
- [Cancel Booking]
- [Record Payment] (if balance due)
- [Send Reminder Email]
- [Download Receipt]

**And when** I click "Record Payment"  
**Then** I see form:
- Amount: Pre-filled with Â£20.00 (balance due)
- Payment Method: Dropdown (Cash / Card Machine / Bank Transfer)
- Notes: Optional textarea
- [Save Payment] button

**And when** I save payment  
**Then**:
- Payment recorded in database
- Balance Due → Â£0.00
- Payment Status → Paid in Full
- Receipt email sent to customer

**Edge Cases:**
- If booking is in the past → Hide "Reschedule" button
- If booking is cancelled → Show "Cancelled on [date] by [customer/staff/admin]" + reason
- If payment already recorded → "Record Payment" button disabled
- If customer has special accessibility needs (from WCAG form) → Show alert icon + details

---

### User Story 2.3: Business Owner Creates Manual Booking

**As a** Business Owner  
**I want to** create a booking manually (e.g., for phone orders)  
**So that** I can record appointments made outside the online system

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I click "+ Create Manual Booking" button  
**Then** I see a booking creation form with steps:

**Step 1: Customer Information**
- Search existing customer: Input field with autocomplete
  - As I type "Sarah" → Dropdown shows matching customers:
    - Sarah Johnson (sarah@email.com) - Last visit: 2024-01-05
    - Sarah Williams (sarah.w@email.com) - Last visit: 2023-12-20
- OR "Create New Customer" button
  - If clicked → Form expands:
    - First Name (required)
    - Last Name (required)
    - Email (required)
    - Phone (required)
    - Marketing Consent: Checkbox

**Step 2: Service Selection**
- Service: Dropdown [All Services]
- Staff Member: Dropdown [All Staff] (pre-filters available times)
  - Show staff faces/avatars if configured

**Step 3: Date & Time**
- Date Picker (calendar widget)
- Time Picker: Dropdown showing only available slots
  - If slot unavailable → Show greyed out with reason:
    - 9:00 AM - Booked (Sarah's Appointment)
    - 9:30 AM - Available
    - 10:00 AM - Staff Lunch Break
    - 10:30 AM - Available

**Step 4: Payment**
- Payment Method:
  - â—‹ Pay on Arrival (no payment now)
  - â—‹ Mark as Paid (already paid by cash/phone)
  - â—‹ Process Card Payment (enter card details)
- If "Mark as Paid":
  - Amount Received: Input field (default to service price)
  - Payment Method: Cash / Card / Bank Transfer
- Notes: Textarea (internal only)

**And when** I click "Create Booking"  
**Then**:
- Booking created with status "Confirmed"
- Availability blocked for that time slot
- Confirmation email sent to customer (toggle to skip)
- Google Calendar event created
- Success message: "✓ Booking created for Sarah Johnson on Mon, 15 Jan at 9:00 AM"
- Redirected to booking details view

**Edge Cases:**
- If customer email already exists → Use existing customer, don't create duplicate
- If selected time slot becomes unavailable (someone else booked) → Error: "This time is no longer available. Please select another."
- If I create booking in the past → Warning: "You're creating a booking for a past date. Continue?"
- If staff member has time off on selected date → Warning: "Emma is off on this day. Choose another staff member or date."

---

### User Story 2.4: Business Owner Cancels a Booking

**As a** Business Owner  
**I want to** cancel a booking (e.g., emergency closure, staff sick)  
**So that** the customer is notified and the slot is freed

**Acceptance Criteria:**

**Given** I'm viewing a booking's details  
**When** I click "Cancel Booking" button  
**Then** I see cancellation modal:

**Cancellation Reason:**
- Dropdown:
  - Staff member unavailable (sick, emergency)
  - Business closure (holiday, emergency)
  - Customer request (if they called)
  - Duplicate booking
  - Other (specify)
- If "Other" → Textarea appears

**Refund Options:**
- If customer paid deposit:
  - â—‹ Full Refund (recommended if our fault)
  - â—‹ Partial Refund: Input field (max = deposit amount)
  - â—‹ No Refund (policy violation or no-show)
- If "Pay on Arrival":
  - No refund section shown

**Customer Notification:**
- â˜' Send cancellation email to customer (checked by default)
- Email preview: "Your appointment on [date] at [time] has been cancelled. Reason: [reason]."

**And when** I click "Confirm Cancellation"  
**Then**:
- Booking status → Cancelled
- Availability slot freed (other customers can book)
- Refund processed (if applicable):
  - Stripe/PayPal refund initiated
  - Payment status → Refunded
  - Refund appears in customer's account within 3-5 business days
- Email sent to customer (if toggled ON)
- Google Calendar event deleted
- Internal note added: "Cancelled by Business Owner on [date]. Reason: [reason]."

**Edge Cases:**
- If booking already completed → Cannot cancel (show "Cannot cancel completed appointments")
- If customer already cancelled → Show "Already cancelled by customer on [date]"
- If Stripe refund fails (e.g., card expired) → Show error: "Automatic refund failed. Please refund manually in Stripe dashboard."
- If cancelling <2 hours before appointment → Warning: "Short notice cancellation. Customer will be notified."

---

### User Story 2.5: Business Owner Reschedules a Booking

**As a** Business Owner  
**I want to** reschedule a booking to a different date/time  
**So that** I can accommodate changes without creating a new booking

**Acceptance Criteria:**

**Given** I'm viewing a booking's details  
**When** I click "Reschedule" button  
**Then** I see reschedule modal:

**Current Booking:**
- Service: Women's Haircut
- Staff: Emma Thompson
- Current Date/Time: Mon, 15 Jan 2024 at 9:00 AM

**Reschedule Options:**
- Change Date: Date picker (calendar widget)
- Change Time: Dropdown (available slots only)
- Change Staff: Dropdown (optional - keep same staff by default)
- Reason for Reschedule: Textarea (optional, internal note)

**Customer Notification:**
- â˜' Send reschedule confirmation email (checked by default)
- Email preview: "Your appointment has been rescheduled to [new date] at [new time]."

**And when** I click "Confirm Reschedule"  
**Then**:
- Original time slot freed
- New time slot blocked
- Booking date/time updated
- Email sent to customer (if toggled)
- Google Calendar event updated (not deleted/recreated)
- Timeline entry added: "Rescheduled by Business Owner from [old date/time] to [new date/time]"
- Deposit/payment transfers to new booking (no additional charge)

**Edge Cases:**
- If new time slot unavailable → Error: "This time is already booked. Choose another."
- If customer paid deposit and new service is more expensive → Warning: "New service price is higher. Customer will owe additional balance."
- If rescheduling multiple times (>3x) → Warning: "This booking has been rescheduled 3 times. Consider confirming with customer."
- If rescheduling to a date when staff is unavailable → Warning: "Emma is not working on [new date]. Choose another staff or date."

---

## EPIC 3: STAFF & SERVICE MANAGEMENT

### User Story 3.1: Business Owner Adds a New Service

**As a** Business Owner  
**I want to** add a new bookable service  
**So that** customers can book it and I can expand my offerings

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Services" → "Add New Service"  
**Then** I see full service creation form with sections:

**1. Basic Information:**
- Service Name (required): Character limit 100
- Category: Dropdown (Haircuts / Coloring / Treatments / Styling / Other)
  - OR "Create New Category" option
- Description (optional): Rich text editor, 1000 characters
  - Supports: Bold, Italic, Bullet Points, Links
  - Help text: "Describe what's included, what to expect, preparation needed"

**2. Duration & Pricing:**
- Duration (required): 
  - Quick Select: 15min / 30min / 45min / 1hr / 1.5hr / 2hr / 3hr / 4hr
  - OR Custom: Number input (min 5 minutes, max 24 hours)
- Pricing Type:
  - â—‹ Single Price: All staff charge the same
    - Price: GBP input
  - â—‹ Staff-Specific Pricing: Different prices per staff member
    - Shows list of staff with price input next to each:
      - Emma Thompson: Â£35.00
      - Sarah Williams: Â£40.00 (Senior Stylist)

**3. Deposit Settings:**
- Require Deposit: Toggle ON/OFF
- If ON:
  - Deposit Type:
    - â—‹ Percentage: Slider (10% - 100%, default 50%)
    - â—‹ Fixed Amount: GBP input (max = service price)
  - Display: "Customers pay Â£17.50 now, Â£17.50 on arrival" (live calculation)

**4. Buffer Time:**
- Buffer After Appointment: Dropdown
  - None / 5 min / 10 min / 15 min / 30 min / 1 hour / Custom
- Help text: "Time blocked after appointment for cleanup, preparation, or rest"
- Example: "9:00 AM service + 15 min buffer → Next available slot is 10:15 AM"

**5. Booking Settings:**
- Minimum Advance Booking: Dropdown
  - No minimum / 1 hour / 2 hours / 4 hours / 12 hours / 1 day / 2 days
  - Help text: "How far in advance must customers book?"
- Maximum Advance Booking: Dropdown
  - 30 days / 60 days / 90 days / 6 months / 1 year / No limit
  - Help text: "How far ahead can customers book?"

**6. Availability:**
- Available to:
  - â˜' All Staff (default)
  - OR Select specific staff: Checkbox list
    - â˜' Emma Thompson
    - â˜' Sarah Williams
    - â˜ John Smith (not qualified for this service)

**7. Display Options:**
- Show on Booking Page: Toggle ON/OFF (default ON)
  - If OFF → Service hidden from customers (can only be booked manually by staff)
- Featured Service: Toggle ON/OFF
  - If ON → Appears at top of service list with badge
- Service Image: Upload button (optional)
  - Accepts: JPG, PNG, WebP
  - Max size: 2MB
  - Recommended: 800x600px

**And when** I click "Save Service"  
**Then**:
- Form validates:
  - Service name not empty
  - Duration ≥ 5 minutes
  - Price ≥ Â£0.01 (or staff-specific prices all valid)
  - Deposit ≤ service price (if fixed amount)
- Service created with status "Active"
- Appears in service list
- Available on customer booking page (if toggle ON)
- Success message: "✓ Women's Haircut added successfully"

**Edge Cases:**
- If service name already exists → Warning: "A service with this name already exists. Create anyway?"
- If no staff assigned → Warning: "No staff can provide this service. Assign at least one staff member."
- If deposit percentage > 100% → Error: "Deposit cannot exceed 100%"
- If max advance booking < min advance booking → Error: "Maximum booking window must be greater than minimum"
- If uploading image > 2MB → Error: "Image too large. Please upload an image under 2MB"

---

### User Story 3.2: Business Owner Edits a Service

**As a** Business Owner  
**I want to** modify service details (price, duration, settings)  
**So that** I can keep information accurate and adjust to business changes

**Acceptance Criteria:**

**Given** I'm viewing the Services list  
**When** I click "Edit" on a service  
**Then** I see the same form as "Add Service" (User Story 3.1) with:
- All fields pre-populated with current values
- Additional option: "Deactivate Service" button (if service has bookings)
- OR "Delete Service" button (if service has no bookings)

**And when** I change price from Â£35 to Â£40  
**Then** I see warning modal:
- "Price Change Impact"
- "You're changing the price from Â£35.00 to Â£40.00"
- "This affects:"
  - â—‹ New bookings only (recommended)
  - â—‹ All future bookings (including existing unpaid balances)
- "Existing completed bookings are never changed"

**And when** I select "New bookings only" and click "Save Changes"  
**Then**:
- Service price updated in database
- All future bookings (not yet created) use Â£40
- Existing future bookings (already created) keep Â£35
- Price change logged: "Price changed from Â£35 to Â£40 by Business Owner on [date]"

**Edge Cases:**
- If service has bookings and I try to reduce duration → Warning: "Reducing duration may affect existing bookings. Review calendar for conflicts."
- If I change deposit from 50% to 100% → Warning: "New deposit requirement applies to new bookings only"
- If I remove a staff member from service → Check for future bookings:
  - If bookings exist → Error: "Cannot remove Emma from this service. She has 3 upcoming bookings."
  - If no bookings → Allowed
- If I try to set duration to 0 → Error: "Duration must be at least 5 minutes"

---

### User Story 3.3: Business Owner Deactivates a Service

**As a** Business Owner  
**I want to** deactivate a service temporarily  
**So that** I can stop new bookings without deleting historical data

**Acceptance Criteria:**

**Given** I'm editing a service with existing bookings  
**When** I click "Deactivate Service" button  
**Then** I see confirmation modal:
- "Deactivate [Service Name]?"
- "This service will be hidden from the booking page"
- "Existing bookings will NOT be affected"
- "You can reactivate this service anytime"
- [Cancel] [Deactivate Service]

**And when** I click "Deactivate Service"  
**Then**:
- Service status → Deactivated
- Service removed from customer booking page
- Existing bookings remain active
- Staff can still view service in dashboard (greyed out)
- Service list shows badge: "Deactivated"

**Reactivation:**
**When** I click "Reactivate" button  
**Then**:
- Service status → Active
- Immediately available on booking page
- All settings preserved

**Edge Cases:**
- If service has pending bookings → Warning: "This service has 2 upcoming bookings. They will remain scheduled."
- Cannot delete service if bookings exist (must deactivate instead)
- If all services are deactivated → Dashboard warning: "⚠ No services available for booking"

---

### User Story 3.4: Business Owner Adds a Staff Member

**As a** Business Owner  
**I want to** add a new staff member to the system  
**So that** they can accept bookings and manage their schedule

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Staff" → "Add New Staff Member"  
**Then** I see staff creation form with sections:

**1. Personal Information:**
- First Name (required)
- Last Name (required)
- Email Address (required): Must be unique (used for login)
- Phone Number (optional)
- Profile Photo (optional):
  - Upload button
  - Max size: 1MB
  - Recommended: Square (400x400px)

**2. Role & Permissions:**
- Role: Dropdown (fixed, cannot change in Phase 1)
  - Staff Member (default and only option)
- Dashboard Access: Toggle ON/OFF (default ON)
  - If ON → Staff member can log into dashboard
  - If OFF → Staff member exists in system but cannot log in (e.g., shared resource like "Any Available")

**3. Working Hours:**
- Copy From: Dropdown (optional)
  - Business Owner's Hours
  - Another Staff Member's Hours
  - Start from Scratch
- Weekly Schedule (same interface as User Story 1.2):
  - Mon-Sun with toggle and time ranges
  - "Add Hours" for split shifts

**4. Services:**
- Assign Services: Checkbox list
  - â˜' Women's Haircut (Â£35)
  - â˜' Men's Haircut (Â£25)
  - â˜' Hair Coloring (Â£60)
  - â˜ Balayage (not qualified yet)
- Staff-Specific Pricing:
  - If service has "Staff-Specific Pricing" enabled:
    - Show price input: Emma: Â£__ (can override default)
  - If service has "Single Price":
    - Show locked price: Â£35 (cannot edit here)

**5. Calendar Integration:**
- Google Calendar Sync: Toggle ON/OFF
- If ON:
  - "Connect Google Calendar" button
  - OAuth flow (same as Business Owner setup)
  - One-way sync: Plugin → Google (bookings appear in staff's Google Calendar)

**6. Dashboard Settings:**
- Send Welcome Email: Checkbox (checked by default)
  - Email includes:
    - Dashboard login URL
    - Temporary password (staff must change on first login)
    - Getting started guide
- Show Earnings to Staff: Toggle ON/OFF (Business Owner decides)
  - If ON → Staff member sees "You earned Â£450 this week" in dashboard
  - If OFF → Staff only sees booking count, not revenue

**And when** I click "Add Staff Member"  
**Then**:
- Form validates:
  - Email not already in use
  - First/last name not empty
  - At least one service assigned
  - At least one working day with hours
- Staff member created
- Welcome email sent (if toggled)
- Staff appears in staff list
- Available for customer bookings immediately

**Edge Cases:**
- If email already exists → Error: "This email is already registered. Use a different email."
- If no services assigned → Warning: "This staff member has no services. They won't appear in booking flow."
- If no working hours → Warning: "This staff member has no availability. Set working hours to accept bookings."
- If I try to assign service staff isn't qualified for → Manual override checkbox: "â˜ I confirm this staff member can provide this service"

---

### User Story 3.5: Business Owner Manages Staff Availability

**As a** Business Owner  
**I want to** view and edit staff members' working hours  
**So that** I can ensure accurate availability for bookings

**Acceptance Criteria:**

**Given** I'm viewing the Staff list  
**When** I click on a staff member  
**Then** I see their profile page with tabs:
- Overview
- Availability
- Bookings
- Earnings (if visibility enabled)

**And when** I click "Availability" tab  
**Then** I see:

**Weekly Pattern:**
- Current working hours displayed (Mon-Sun)
- "Edit Weekly Hours" button
- Same time range interface as setup wizard

**Time Off:**
- List of blocked periods:
  - Holiday: 20-27 Dec 2024 (Approved)
  - Sick Leave: 15 Jan 2024 (Pending)
- "Add Time Off" button

**Exceptions:**
- One-off extra hours:
  - Saturday 20 Jan 2024: 10:00 AM - 2:00 PM (Special event coverage)
- "Add Exception" button

**And when** I click "Add Time Off"  
**Then** I see form:
- Reason: Dropdown (Holiday / Sick Leave / Personal / Training / Other)
- Start Date: Date picker
- End Date: Date picker
- All Day: Toggle ON/OFF
  - If OFF → Show time range selectors
- Impact: "This will block 3 appointment slots. No existing bookings."
  - OR "⚠ Warning: This overlaps with 2 existing bookings. You must reschedule them first."
- [Cancel] [Block Time Off]

**And when** I save time off with existing bookings  
**Then**:
- Modal appears: "Conflicting Bookings"
- List of affected bookings:
  - Mon, 15 Jan at 9:00 AM - Sarah Johnson (Women's Haircut)
- Options:
  - "Automatically reschedule to next available slot"
  - "I'll manually reschedule these bookings"
- [Cancel] [Proceed]

**Edge Cases:**
- If time off request is in the past → Error: "Cannot add time off for past dates"
- If blocking all availability → Warning: "This staff member will have no available hours. Continue?"
- If staff member requested time off themselves → Business Owner sees "Pending Approval" status
- If overlapping time off periods → Error: "This conflicts with existing time off from [date] to [date]"

---

## EPIC 4: PRICING & PAYMENT CONFIGURATION

### User Story 4.1: Business Owner Configures Deposit Policy

**As a** Business Owner  
**I want to** set a default deposit policy for all services  
**So that** I can require upfront payment to reduce no-shows

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Settings" → "Payments" → "Deposits"  
**Then** I see:

**Default Deposit Policy:**
- Apply Default Deposit to All Services: Toggle ON/OFF
- If ON:
  - Deposit Type:
    - â—‹ Percentage: Slider (10% - 100%, default 50%)
    - â—‹ Fixed Amount: GBP input (applies to all services)
  - Override: "Services can override this default" checkbox (checked by default)
- If OFF:
  - "Deposits are configured per service"

**No-Show Protection:**
- Require deposit for first-time customers: Toggle ON/OFF
  - Help text: "Customers with no booking history must pay deposit"
- Require deposit for customers with no-show history: Toggle ON/OFF
  - Threshold: "2+ no-shows in last 6 months"

**And when** I enable "Apply Default Deposit" at 50% and click "Save"  
**Then**:
- All services without custom deposit → Automatically use 50%
- Services with custom deposit → Keep their custom setting (not overridden)
- New services created → Default to 50% deposit
- Confirmation: "✓ Default deposit policy updated. 5 services affected."

**Edge Cases:**
- If changing default from 50% to 100% → Warning: "This will change deposit requirements for X services. Existing bookings not affected."
- If setting fixed amount higher than cheapest service → Warning: "Default Â£20 deposit exceeds price of 'Beard Trim' (Â£15). Service-specific override required."
- If disabling deposits entirely → Confirmation: "Remove all deposits? This may increase no-shows."

---

### User Story 4.2: Business Owner Configures Payment Gateways

**As a** Business Owner  
**I want to** manage connected payment gateways  
**So that** I can control which payment methods customers can use

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Settings" → "Payments" → "Payment Methods"  
**Then** I see:

**Connected Gateways:**
1. **Stripe:**
   - Status: âœ" Connected
   - Account: bookings@clientbusiness.co.uk
   - Mode: â— Live (Â£1,234 processed this month)
   - Actions:
     - [Switch to Test Mode]
     - [Disconnect]
     - [View in Stripe Dashboard] (external link)

2. **PayPal:**
   - Status: Not Connected
   - [Connect PayPal Account] button

3. **Pay on Arrival:**
   - Status: Enabled
   - Toggle: ON/OFF
   - Help text: "Customers can book without paying online"

**Payment Method Priority:**
- Default Payment Method: Dropdown
  - Stripe (pre-selected if customer doesn't choose)
  - PayPal
  - Pay on Arrival
- Display Order on Booking Page: Drag to reorder
  1. Stripe (Credit/Debit Card)
  2. PayPal
  3. Pay on Arrival

**And when** I click "Disconnect" on Stripe  
**Then** I see warning modal:
- "Disconnect Stripe?"
- "⚠ This will prevent new online payments"
- "Existing bookings with Stripe deposits are not affected"
- "You can reconnect anytime"
- "Alternative:" "Switch to Test Mode instead?" [Switch] [Disconnect]

**And when** I click "Switch to Test Mode"  
**Then**:
- Stripe mode → Test
- Badge changes: â— Live → 🔬 Test Mode
- Banner appears: "⚠ Stripe is in Test Mode. No real charges will be processed."
- Customer checkout uses Stripe test environment

**Edge Cases:**
- If disconnecting ALL payment methods → Error: "You must have at least one payment method enabled (including Pay on Arrival)"
- If PayPal connection fails → Error: "Could not connect to PayPal. Error: [API message]"
- If switching from Test to Live with pending test transactions → Warning: "You have 3 test bookings. These will not be affected."

---

### User Story 4.3: Business Owner Sets Cancellation & Refund Policy

**As a** Business Owner  
**I want to** define my cancellation and refund policy  
**So that** customers understand the rules and I can automate refunds

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Settings" → "Policies" → "Cancellation & Refunds"  
**Then** I see:

**Cancellation Window:**
- Minimum Notice Period: Dropdown
  - No restriction / 1 hour / 2 hours / 6 hours / 12 hours / 24 hours / 48 hours / 72 hours
  - Default: 24 hours
- Help text: "How far in advance must customers cancel to get a full refund?"

**Refund Policy (for cancellations within notice period):**
- â—‹ Full Refund (100% refund)
- â—‹ Partial Refund: Slider (0% - 100%, default 50%)
  - "Customers receive 50% refund, you keep 50%"
- â—‹ No Refund (forfeit entire deposit)

**Late Cancellation Policy (for cancellations outside notice period):**
- â—‹ No Refund (forfeit deposit)
- â—‹ Partial Refund: Slider (0% - 50%, default 0%)
- â—‹ Manual Review (Business Owner approves each refund)

**No-Show Policy:**
- If customer doesn't arrive:
  - â—‹ No Refund (forfeit deposit)
  - â—‹ Case-by-case (manual decision)
- Grace Period: Dropdown
  - No grace period / 5 min / 10 min / 15 min / 30 min
  - "Customer marked as no-show if not arrived within [X] minutes"

**Refund Processing:**
- Automatic Refunds: Toggle ON/OFF
  - If ON → Refunds processed immediately via Stripe/PayPal
  - If OFF → Refunds flagged for manual processing
- Refund Timeline: "3-5 business days" (informational, set by payment processor)

**Policy Display:**
- Show policy on booking page: Toggle ON/OFF (default ON)
- Policy Text: Editable textarea (appears on booking page)
  - Pre-filled with: "Cancellations made at least 24 hours in advance receive a full refund. Cancellations made within 24 hours are non-refundable."

**And when** I change policy from "24 hours notice, full refund" to "48 hours notice, 50% refund"  
**And** I click "Save Changes"  
**Then**:
- Warning modal appears:
  - "Policy Change Impact"
  - "This policy applies to all NEW bookings from now on"
  - "Existing bookings keep their original policy (based on date of booking)"
  - [Cancel] [Apply New Policy]
- After confirmation:
  - Policy saved
  - Policy text auto-updated on booking page
  - Change logged: "Policy changed by Business Owner on [date]"

**Edge Cases:**
- If setting "No refund" for all scenarios → Warning: "Strict no-refund policies may deter bookings. Consider allowing refunds for emergencies."
- If automatic refunds enabled but Stripe disconnected → Warning: "Automatic refunds require payment gateway connection"
- If changing policy to be more generous (e.g., 24hrs → 48hrs) → Option: "Apply retroactively to existing bookings?" (default NO)

---

### User Story 4.4: Business Owner Processes Manual Refund

**As a** Business Owner  
**I want to** manually refund a customer outside automatic policy  
**So that** I can handle exceptions (e.g., genuine emergencies)

**Acceptance Criteria:**

**Given** I'm viewing a cancelled booking with "Refund: Pending Review" status  
**When** I click "Process Refund" button  
**Then** I see refund form:

**Refund Details:**
- Original Payment: Â£15.00 (Stripe - Deposit)
- Refund Amount: Input field (pre-filled with Â£15.00)
  - Slider: Â£0.00 ← → Â£15.00
  - OR Percentage: 0% - 100%
- Refund Reason: Dropdown
  - Emergency/Medical Issue
  - Business Error (our fault)
  - Goodwill Gesture
  - Policy Exception
  - Other (specify)
- Internal Notes: Textarea (optional)
- Customer Notification:
  - â˜' Send refund confirmation email

**And when** I set refund to Â£7.50 (50%) and click "Process Refund"  
**Then**:
- Refund initiated in Stripe/PayPal for Â£7.50
- Payment status → Partially Refunded
- Email sent to customer:
  - "Your refund of Â£7.50 has been processed"
  - "You'll see this in your account within 3-5 business days"
- Refund logged in payment history:
  - Date: [timestamp]
  - Amount: -Â£7.50
  - Reason: Emergency/Medical Issue
  - Processed by: Business Owner

**Edge Cases:**
- If original payment was "Pay on Arrival" → No refund button (nothing to refund)
- If attempting to refund more than original payment → Error: "Cannot refund more than original payment (Â£15.00)"
- If Stripe API fails → Error: "Refund failed. Error: [message]. Try again or process manually in Stripe dashboard."
- If refunding after 90 days (Stripe limit) → Warning: "Stripe refund window expired. You must process refund manually via bank transfer."

---

## EPIC 5: REPORTING & ANALYTICS

### User Story 5.1: Business Owner Views Dashboard Overview

**As a** Business Owner  
**I want to** see high-level business metrics when I log in  
**So that** I can quickly understand daily performance

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** the home page loads  
**Then** I see:

**Top Row - Today's Snapshot:**
- **Today's Bookings:**
  - Number: 8 appointments
  - Status breakdown:
    - 5 Confirmed (blue dots)
    - 2 Completed (green checkmarks)
    - 1 No-Show (red X)
- **Today's Revenue:**
  - Amount: Â£340.00
  - Breakdown: "Â£240 completed, Â£100 pending"
- **Next Appointment:**
  - Time: 2:30 PM (in 45 minutes)
  - Customer: Sarah Johnson
  - Service: Women's Haircut
  - Staff: Emma

**Second Row - This Week:**
- **Weekly Bookings:**
  - Number: 67 appointments
  - Trend: ↑ 12% vs last week
  - Graph: Mini sparkline showing daily bookings
- **Weekly Revenue:**
  - Amount: Â£3,015.00
  - Trend: ↑ 8% vs last week
- **Utilization:**
  - Percentage: 78% of available slots booked
  - Visual: Progress bar

**Third Row - Quick Stats:**
- **No-Show Rate:**
  - This Month: 4.5% (3 out of 67)
  - Trend: ↓ 2% vs last month (good news - green)
- **Average Booking Value:**
  - Â£45.00 per appointment
- **Most Booked Service:**
  - Women's Haircut (23 bookings this week)

**Calendar Widget:**
- Current week view (Mon-Sun)
- Each day shows:
  - Number of bookings
  - Total revenue
  - Click to view day details

**Edge Cases:**
- If no bookings today → "No appointments scheduled for today"
- If first day of operation → Show "Let's get started!" message instead of trends
- If negative trend (↓ 20% bookings) → Alert icon: "Bookings down this week. Review availability or run promotion?"

---

### User Story 5.2: Business Owner Views Detailed Revenue Report

**As a** Business Owner  
**I want to** see detailed revenue breakdown by date range  
**So that** I can analyze income and identify trends

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Reports" → "Revenue"  
**Then** I see:

**Date Range Selector:**
- Quick Filters (buttons):
  - Today
  - Yesterday
  - This Week
  - Last Week
  - This Month
  - Last Month
  - Custom Range
- Date Pickers: From [DD/MM/YYYY] To [DD/MM/YYYY]
- [Apply] button

**Revenue Summary (for selected period):**
- Total Revenue: Â£12,450.00
- Deposits Collected: Â£3,200.00
- Balance Payments: Â£9,250.00
- Refunds Issued: -Â£450.00
- Net Revenue: Â£12,000.00

**Revenue by Payment Method:**
- Pie chart showing:
  - Stripe: Â£8,500 (68%)
  - PayPal: Â£2,000 (16%)
  - Cash (Pay on Arrival): Â£1,500 (12%)
  - Card Machine: Â£450 (4%)

**Revenue by Service:**
- Table with columns:
  | Service | Bookings | Total Revenue | Avg Price |
  |---------|----------|---------------|-----------|
  | Women's Haircut | 45 | Â£1,575 | Â£35.00 |
  | Hair Coloring | 20 | Â£1,200 | Â£60.00 |
  | Men's Haircut | 30 | Â£750 | Â£25.00 |
  | ... | ... | ... | ... |
- Sortable by any column
- Click service → Drill down to individual bookings

**Revenue by Staff Member:**
- Table with columns:
  | Staff | Bookings | Total Revenue | Avg per Booking |
  |-------|----------|---------------|-----------------|
  | Emma Thompson | 52 | Â£1,820 | Â£35.00 |
  | Sarah Williams | 43 | Â£1,720 | Â£40.00 |

**Revenue Trend Chart:**
- Line graph showing daily/weekly revenue
- X-axis: Time period
- Y-axis: Revenue (Â£)
- Hover tooltip: "Mon, 15 Jan: Â£340.00 (8 bookings)"

**Export Options:**
- [Export to CSV] button
- [Export to PDF] button (formatted report with logo)

**And when** I select "Last Month" and click "Apply"  
**Then**:
- All metrics recalculate for previous calendar month
- Charts and tables update
- URL updates: `/reports/revenue?period=last_month`

**Edge Cases:**
- If date range has no bookings → "No revenue data for this period"
- If custom range > 1 year → Warning: "Large date ranges may take longer to load"
- If including current incomplete day → Note: "Today's data is preliminary and may change"

---

### User Story 5.3: Business Owner Views Booking Analytics

**As a** Business Owner  
**I want to** see detailed booking statistics  
**So that** I can understand customer behavior and booking patterns

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Reports" → "Bookings"  
**Then** I see:

**Date Range Selector:** (same as Revenue Report)

**Booking Volume:**
- Total Bookings: 234
- Breakdown by status:
  - Completed: 198 (84.6%)
  - Upcoming: 23 (9.8%)
  - Cancelled: 10 (4.3%)
  - No-Show: 3 (1.3%)

**Booking Source:**
- Online Bookings: 210 (89.7%)
- Manual (Staff Created): 24 (10.3%)

**Booking Timing Analysis:**
- Most Popular Days:
  | Day | Bookings | % of Total |
  |-----|----------|------------|
  | Saturday | 45 | 19.2% |
  | Friday | 42 | 17.9% |
  | Thursday | 38 | 16.2% |
  | ... | ... | ... |

- Most Popular Times:
  | Time Slot | Bookings | % of Total |
  |-----------|----------|------------|
  | 10:00 AM | 28 | 12.0% |
  | 11:00 AM | 25 | 10.7% |
  | 2:00 PM | 23 | 9.8% |
  | ... | ... | ... |

**Booking Lead Time:**
- Average advance booking: 5.3 days
- Distribution:
  - Same-day: 15%
  - 1-3 days: 35%
  - 4-7 days: 30%
  - 8-14 days: 15%
  - 15+ days: 5%
- Graph: Histogram showing booking lead time distribution

**Cancellation Analysis:**
- Cancellation Rate: 4.3%
- Average notice period: 2.1 days
- Cancellation reasons:
  - Customer request: 6
  - Staff unavailable: 2
  - Business closure: 1
  - No-show (marked as cancelled): 1

**Utilization Rate:**
- Overall: 78% of available slots booked
- By staff:
  - Emma Thompson: 85%
  - Sarah Williams: 72%
- By day of week:
  - Monday: 65%
  - Tuesday: 70%
  - ... (graph)

**Peak Hours Heatmap:**
- Visual grid: Days (rows) x Hours (columns)
- Color intensity = booking volume
- Hover: "Tue, 10:00 AM - 8 bookings"

**And when** I click on "Saturday" in Most Popular Days  
**Then**:
- Drill-down view opens
- Shows all Saturday bookings in selected period
- List with details: Date, Time, Customer, Service, Staff, Status

**Edge Cases:**
- If period has < 10 bookings → "Not enough data for meaningful analysis. Try a longer date range."
- If utilization > 95% → Alert: "Near capacity! Consider adding staff or extending hours."
- If cancellation rate > 10% → Alert: "High cancellation rate. Review your cancellation policy."

---

### User Story 5.4: Business Owner Views Staff Performance Report

**As a** Business Owner  
**I want to** see individual staff member performance metrics  
**So that** I can recognize high performers and identify training needs

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Reports" → "Staff Performance"  
**Then** I see:

**Date Range Selector:** (same as previous reports)

**Staff Comparison Table:**
| Staff Member | Bookings | Revenue | Avg Booking Value | Utilization | No-Show Rate | Rating |
|--------------|----------|---------|-------------------|-------------|--------------|---------|
| Emma Thompson | 52 | Â£1,820 | Â£35.00 | 85% | 2.1% | 4.8/5.0 |
| Sarah Williams | 43 | Â£1,720 | Â£40.00 | 72% | 5.2% | 4.6/5.0 |
| John Smith | 38 | Â£950 | Â£25.00 | 68% | 8.1% | 4.3/5.0 |

**And when** I click on "Emma Thompson"  
**Then** I see detailed staff profile:

**Overview:**
- Photo + Name
- Member since: 15 March 2023
- Total bookings (all-time): 1,247
- Total revenue (all-time): Â£43,645

**Performance Metrics (for selected period):**
- Bookings: 52 (↑ 8% vs previous period)
- Revenue: Â£1,820 (↑ 12% vs previous period)
- Average booking value: Â£35.00
- Utilization: 85% (top performer)
- No-show rate: 2.1% (below average - good)
- Rebooking rate: 68% (customers who rebook with Emma)

**Service Breakdown:**
| Service | Bookings | Revenue |
|---------|----------|---------|
| Women's Haircut | 32 | Â£1,120 |
| Styling | 12 | Â£480 |
| Consultations | 8 | Â£220 |

**Weekly Performance Chart:**
- Line graph showing bookings per week
- Trend: Consistently high

**Customer Feedback:**
- Average rating: 4.8/5.0 (based on post-appointment surveys, Phase 2 feature)
- Recent reviews: (if implemented)
  - "Emma is amazing! Always professional." - Sarah J., 12 Jan
  - "Best haircut I've had in years." - Michael T., 10 Jan

**Time Off:**
- Upcoming: Holiday, 20-27 Dec 2024
- Total days off this year: 18

**Edge Cases:**
- If staff member is new (< 1 month) → "New team member! Not enough data for trends yet."
- If staff member has high no-show rate (>10%) → Alert: "High no-show rate may indicate scheduling issues or customer experience problems"
- If staff member has very low utilization (<40%) → Alert: "Low utilization. Consider reviewing availability or marketing this staff member's services"

---

### User Story 5.5: Business Owner Exports Report Data

**As a** Business Owner  
**I want to** export report data to CSV or PDF  
**So that** I can analyze in Excel or share with accountant

**Acceptance Criteria:**

**Given** I'm viewing any report page  
**When** I click "Export" button  
**Then** I see export options dropdown:
- Export to CSV
- Export to PDF
- Email Report (sends PDF to Business Owner email)

**And when** I select "Export to CSV"  
**Then**:
- CSV file downloads immediately
- Filename: `revenue-report-2024-01-01-to-2024-01-31.csv`
- Contains:
  - All data visible in current report view
  - Date range in header
  - Generated timestamp
- Opens in Excel/Numbers/Google Sheets

**CSV Format Example (Revenue Report):**
```
Revenue Report
Date Range: 01/01/2024 - 31/01/2024
Generated: 15/01/2024 14:32

Date,Bookings,Revenue,Payment Method,Staff Member,Service
15/01/2024,8,Â£340.00,Stripe,Emma Thompson,Women's Haircut
15/01/2024,5,Â£125.00,PayPal,Sarah Williams,Men's Haircut
...
```

**And when** I select "Export to PDF"  
**Then**:
- PDF generates (may take 2-3 seconds)
- Filename: `revenue-report-2024-01-01-to-2024-01-31.pdf`
- Contents:
  - Business logo (if configured)
  - Report title and date range
  - All charts (as images)
  - All tables (formatted)
  - Summary metrics
  - Footer: "Generated by [Plugin Name] on [timestamp]"

**Edge Cases:**
- If report data is very large (>10,000 rows) → Warning: "Large export may take a minute. Continue?"
- If PDF generation fails → Fallback to CSV with message: "PDF generation failed. CSV exported instead."
- If no data to export → Error: "No data available for this period"

---

## EPIC 6: CUSTOMER DATABASE MANAGEMENT

### User Story 6.1: Business Owner Views Customer List

**As a** Business Owner  
**I want to** see a list of all customers who have booked with me  
**So that** I can manage my customer base and view booking history

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Customers"  
**Then** I see:

**Customer List Table:**
| Customer | Email | Phone | Total Bookings | Total Spent | Last Visit | Status |
|----------|-------|-------|----------------|-------------|------------|--------|
| Sarah Johnson | sarah@email.com | +44 7700 900123 | 12 | Â£420.00 | 12 Jan 2024 | âœ" Active |
| Emma Williams | emma.w@email.com | +44 7800 900234 | 8 | Â£280.00 | 10 Jan 2024 | âœ" Active |
| John Smith | john@email.com | - | 3 | Â£105.00 | 5 Jan 2024 | âŚ¸ Inactive (6+ months) |

**Search & Filters:**
- Search box: "Search by name, email, or phone"
  - Real-time filtering as I type
- Filter dropdowns:
  - Status: All / Active / Inactive / New (first booking)
  - Booking Count: All / 1 / 2-5 / 6-10 / 10+
  - Total Spent: All / <Â£100 / Â£100-Â£500 / Â£500+
- Sort by: Name / Last Visit / Total Bookings / Total Spent

**Bulk Actions:**
- Select multiple customers (checkboxes)
- Actions dropdown:
  - Send Email
  - Export Selected
  - Add Tag (Phase 2)
  - Delete (with confirmation)

**Pagination:**
- Show 25 / 50 / 100 per page
- Page navigation: ◄ 1 2 3 4 ►

**And when** I click on a customer row  
**Then**:
- Customer detail page opens (see User Story 6.2)

**Edge Cases:**
- If no customers exist → Empty state: "No customers yet. Your first booking will create a customer record."
- If searching returns no results → "No customers found matching '[search term]'"
- If customer has never made a booking (created manually) → Show "0 bookings" with note

---

### User Story 6.2: Business Owner Views Customer Profile

**As a** Business Owner  
**I want to** see a customer's complete profile and booking history  
**So that** I can provide personalized service

**Acceptance Criteria:**

**Given** I'm viewing the customer list  
**When** I click on "Sarah Johnson"  
**Then** I see customer profile page with sections:

**1. Customer Information:**
- Name: Sarah Johnson
- Email: sarah@email.com (verified)
- Phone: +44 7700 900123
- Member Since: 15 March 2023
- Tags: VIP, Prefers Emma (Phase 2 feature)
- Marketing Consent: âœ… Opted In (or â— Opted Out)
- [Edit Customer] button

**2. Statistics:**
- Total Bookings: 12
- Total Spent: Â£420.00
- Average Booking Value: Â£35.00
- Last Visit: 12 January 2024 (3 days ago)
- Upcoming Appointments: 1
- Cancellations: 1 (8.3% cancellation rate)
- No-Shows: 0 (âœ… Reliable customer)

**3. Booking History:**
- List of all bookings (most recent first)
- Each entry shows:
  - Date: Mon, 15 Jan 2024
  - Time: 9:00 AM
  - Service: Women's Haircut
  - Staff: Emma Thompson
  - Status: Completed (green badge)
  - Amount: Â£35.00
  - Actions: [View Details] [Rebook]

**4. Payment History:**
- List of all payments
- Each entry:
  - Date: 15 Jan 2024 14:32
  - Amount: Â£15.00
  - Method: Stripe (****1234)
  - Type: Deposit
  - Status: Completed
  - [View Receipt]

**5. Notes:**
- Internal notes section (staff only, customer cannot see)
- Add note: Textarea + [Save Note] button
- Note history:
  - "Customer prefers Emma for all appointments" - Business Owner, 10 Jan 2024
  - "Allergic to certain hair products - check before using" - Emma, 5 Jan 2024

**6. Quick Actions:**
- [Create New Booking]
- [Send Email]
- [Edit Profile]
- [View Full History]
- [Delete Customer] (with GDPR confirmation)

**And when** I click "Rebook" on a past booking  
**Then**:
- Manual booking form opens (User Story 2.3)
- Customer information pre-filled
- Same service pre-selected
- Same staff pre-selected
- Only need to choose date/time

**Edge Cases:**
- If customer requested data deletion (GDPR) → Show warning: "This customer requested account deletion. Are you sure you want to keep their data?"
- If customer has outstanding balance → Alert banner: "âš  Outstanding balance: Â£20.00 from booking on 12 Jan"
- If customer has no bookings → Show empty state: "No booking history yet"

---

### User Story 6.3: Business Owner Edits Customer Information

**As a** Business Owner  
**I want to** update a customer's details  
**So that** I can keep information accurate

**Acceptance Criteria:**

**Given** I'm viewing a customer profile  
**When** I click "Edit Customer" button  
**Then** I see editable form with fields:

**Personal Information:**
- First Name: [Sarah]
- Last Name: [Johnson]
- Email: sarah@email.com (with warning: "⚠ Email is used for login. Changing it will affect customer account access.")
- Phone: +44 7700 900123

**Preferences (optional):**
- Preferred Staff Member: Dropdown [All Staff]
- Preferred Contact Method: Email / Phone / SMS
- Special Notes: Textarea
  - E.g., "Prefers morning appointments", "Allergic to X product"

**Marketing:**
- Email Marketing: Toggle âœ… Opted In
- SMS Marketing: Toggle â— Opted Out (Phase 2)

**Account Status:**
- Account Status: Dropdown
  - Active (can book)
  - Suspended (cannot book - reason required)
  - Deleted (soft delete, GDPR)

**And when** I change email and click "Save Changes"  
**Then**:
- Confirmation modal: "Update customer email?"
  - "Old email: sarah@email.com"
  - "New email: sarah.johnson@newemail.com"
  - "â˜' Send email to customer notifying of this change"
- If confirmed:
  - Email updated in database
  - Customer account email updated
  - Notification sent: "Your booking account email has been updated"
  - Login credentials changed

**Edge Cases:**
- If new email already exists for another customer → Error: "This email is already in use by another customer"
- If removing phone number but SMS reminders are enabled → Warning: "This customer has SMS reminders enabled but no phone number"
- If suspending account → Require reason: "Why are you suspending this account?" (e.g., "Repeated no-shows", "Inappropriate behavior")
- If customer has upcoming bookings and you delete account → Warning: "This customer has 2 upcoming bookings. Cancel them first or keep account active."

---

### User Story 6.4: Business Owner Deletes Customer Data (GDPR)

**As a** Business Owner  
**I want to** permanently delete a customer's personal data  
**So that** I comply with GDPR right-to-erasure requests

**Acceptance Criteria:**

**Given** I'm viewing a customer profile  
**When** I click "Delete Customer" button  
**Then** I see GDPR deletion modal:

**Warning Message:**
"⚠ Permanent Deletion - This Cannot Be Undone

You are about to permanently delete all personal data for Sarah Johnson. This action complies with GDPR Right to Erasure.

**What will be deleted:**
- âœ" Customer name, email, phone
- âœ" Account login credentials
- âœ" Marketing consent records
- âœ" Special notes and preferences

**What will be kept (anonymized):**
- âœ" Booking records (anonymized as 'Deleted Customer #12345')
- âœ" Payment transactions (for accounting compliance)
- âœ" Statistical data (revenue, no-show rates)

**Requirements:**
- Customer must have no upcoming bookings
- Outstanding balances must be resolved

**Confirmation:**
Type 'DELETE' to confirm: [____]"

**And when** I type "DELETE" and click "Permanently Delete Customer"  
**Then**:
- All personal data deleted from database:
  - `first_name`, `last_name`, `email`, `phone` → NULL or "Deleted Customer #[ID]"
- Account disabled (cannot log in)
- Past bookings remain but show "Deleted Customer #12345" instead of name
- Payment records kept (financial compliance) but anonymized
- Deletion logged: "Customer data deleted by Business Owner on [date] (GDPR request)"
- Success message: "✓ Customer data permanently deleted"
- Redirected to customer list

**Edge Cases:**
- If customer has upcoming bookings → Error: "Cannot delete customer with upcoming bookings. Cancel bookings first."
- If customer has unpaid balance → Error: "Resolve outstanding balance (Â£20.00) before deletion"
- If customer was deleted less than 30 days ago → Show note: "Recently deleted. Recovery may be possible if accidental."
- If deletion fails (database error) → Error: "Deletion failed. Please try again or contact support."

**Compliance Notes:**
- Deletion completes within 24 hours (database cleanup job)
- Email sent to customer confirming deletion
- Deletion irreversible after 30-day grace period
- Satisfies GDPR Art. 17 (Right to Erasure)

---

### User Story 6.5: Business Owner Exports Customer Data

**As a** Business Owner  
**I want to** export customer data to CSV  
**So that** I can analyze in Excel, import to CRM, or provide data portability (GDPR)

**Acceptance Criteria:**

**Given** I'm viewing the customer list  
**When** I click "Export" button  
**Then** I see export options:
- Export All Customers (CSV)
- Export Selected Customers (CSV) - if customers are selected
- Export Customer Booking History (CSV) - includes all bookings for all customers

**And when** I select "Export All Customers"  
**Then**:
- CSV file downloads immediately
- Filename: `customers-export-2024-01-15.csv`
- Contains columns:
  - Customer ID
  - First Name
  - Last Name
  - Email
  - Phone
  - Member Since
  - Total Bookings
  - Total Spent
  - Last Visit Date
  - Status (Active/Inactive)
  - Marketing Consent (Yes/No)

**CSV Format Example:**
```
Customer ID,First Name,Last Name,Email,Phone,Member Since,Total Bookings,Total Spent,Last Visit,Status,Marketing Consent
12345,Sarah,Johnson,sarah@email.com,+447700900123,15/03/2023,12,Â£420.00,12/01/2024,Active,Yes
12346,Emma,Williams,emma.w@email.com,+447800900234,20/04/2023,8,Â£280.00,10/01/2024,Active,No
```

**And when** I select "Export Customer Booking History"  
**Then**:
- CSV file downloads
- Filename: `customer-bookings-export-2024-01-15.csv`
- Contains:
  - Customer Name
  - Email
  - Booking ID
  - Service
  - Staff Member
  - Date
  - Time
  - Status
  - Amount Paid

**GDPR Data Portability Request:**
**Given** a customer requests their data (GDPR Art. 20)  
**When** I navigate to their profile and click "Export Customer Data"  
**Then**:
- Full export generated:
  - Personal Information (JSON or CSV)
  - Complete Booking History
  - Payment Records
  - Marketing Preferences
  - Account Activity Log
- Filename: `sarah-johnson-data-export-2024-01-15.zip`
- Can be emailed to customer directly

**Edge Cases:**
- If no customers exist → Error: "No customers to export"
- If export includes thousands of records → Progress indicator: "Generating export... 45% complete"
- If customer has no bookings → Include in export but with "0 bookings" value
- If exporting for GDPR portability → Include note: "This export satisfies GDPR Art. 20 (Right to Data Portability)"


### User Story 6.6: Business Owner Facilitates Customer Email Change

**As a** Business Owner  
**I want to** change a customer's email address securely  
**So that** customers with email typos can receive booking confirmations

**Acceptance Criteria:**

**Given** Customer reports email typo or wants to change email  
**When** Business Owner navigates to customer profile  
**Then** I see "Change Email" button next to current email

**And when** I click "Change Email"  
**Then** I see form:
- Current email: sarah@old-email.com (read-only)
- New email: [________] (input field with validation)
- Reason: [dropdown: Typo / Customer request / Other]
- [Cancel] [Send Verification]

**And when** I submit new email  
**Then**:
1. Verification email sent to NEW address
2. Email contains: "Click to confirm email change for your booking account"
3. Link expires in 24 hours
4. Customer clicks link → Email updated in database
5. Confirmation sent to BOTH old and new emails
6. All future booking communications use new email

**Security:**
- Magic link token: cryptographically random (32 bytes)
- Link includes: booking system domain verification
- Old email receives notification: "Email change requested. Contact us if not you."

**Edge Cases:**
- If new email already exists in system → Error: "Email already registered"
- If verification not completed in 24 hours → Request expires, must re-request
- If customer books again before verification → Use old email
- Change is logged in audit trail

**Database Changes:**
```sql
-- Add to wp_bookings_customers:
ALTER TABLE wp_bookings_customers 
ADD COLUMN pending_email_change VARCHAR(255) DEFAULT NULL,
ADD COLUMN email_change_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN email_change_expires DATETIME DEFAULT NULL;
```

**Estimated Implementation:** 6-8 hours
---

## ADDITIONAL REQUIREMENTS

### User Story 7.1: Business Owner Configures Email Notifications

**As a** Business Owner  
**I want to** customize email notification settings  
**So that** I control when and how customers and staff are notified

**Acceptance Criteria:**

**Given** I'm logged into Business Owner dashboard  
**When** I navigate to "Settings" → "Notifications" → "Email"  
**Then** I see:

**Email Sending:**
- SMTP Configuration:
  - Use WordPress Default (recommended)
  - OR Custom SMTP Server:
    - Host: smtp.example.com
    - Port: 587
    - Username: bookings@clientbusiness.co.uk
    - Password: ••••••••
    - Encryption: TLS / SSL
  - [Test Email] button (sends test to Business Owner email)

**Notification Toggles:**

**Customer Notifications:**
- â˜' Booking Confirmation (sent immediately after booking)
- â˜' 24-Hour Reminder (sent at 8:00 AM day before)
- â˜' Cancellation Confirmation
- â˜' Rescheduling Confirmation
- â˜' Payment Receipt
- â˜' Refund Processed
- â˜ 1-Week Reminder (Phase 2)
- â˜ Post-Appointment Follow-up (Phase 2)

**Staff Notifications:**
- â˜' New Booking Assigned to You
- â˜' Booking Cancelled (your appointment)
- â˜' Booking Rescheduled (your appointment)
- â˜ Daily Schedule Summary (sent at 7:00 AM each day)

**Business Owner Notifications:**
- â˜' New Booking (all bookings)
- â˜' Cancellation Request (requires approval)
- â˜' Late Cancellation (outside policy window)
- â˜ Daily Revenue Summary (sent at 9:00 PM)
- â˜ Weekly Performance Report (sent Monday 9:00 AM)

**Email Branding:**
- From Name: [Client Business Name]
- From Email: bookings@clientbusiness.co.uk
- Reply-To Email: info@clientbusiness.co.uk
- Email Footer Text: Customizable textarea
  - Default: "You're receiving this email because you have an appointment with [Business Name]. To unsubscribe from marketing emails, click here."
- Logo: Upload (appears in email header)

**And when** I click "Test Email" button  
**Then**:
- Test email sent to Business Owner email
- Success message: "✓ Test email sent to yourname@clientbusiness.co.uk. Check your inbox."
- If fails: "â
 Test email failed. Error: [SMTP error message]"

**Edge Cases:**
- If disabling all customer notifications → Warning: "Customers won't receive any booking confirmations. Are you sure?"
- If custom SMTP fails → Fallback to WordPress default SMTP
- If "From Email" doesn't match domain → Warning: "Using a different domain may cause emails to land in spam. Use an email address from your domain."

---

### User Story 7.2: Business Owner Customizes Email Templates

**As a** Business Owner  
**I want to** edit email templates  
**So that** I can personalize communication with my brand voice

**Acceptance Criteria:**

**Given** I'm in "Settings" → "Notifications" → "Email Templates"  
**When** the page loads  
**Then** I see list of editable templates:

**Template List:**
1. Booking Confirmation (Customer)
2. 24-Hour Reminder (Customer)
3. Cancellation Confirmation (Customer)
4. Refund Processed (Customer)
5. New Booking (Staff)
6. Booking Cancelled (Staff)

**And when** I click "Edit" on "Booking Confirmation"  
**Then** I see template editor:

**Email Preview:**
- Subject Line: "Your booking is confirmed! 🎉"
  - Editable text field
  - Character limit: 100
  - Variables available: `{customer_name}`, `{service_name}`, `{date}`, `{time}`, `{staff_name}`

**Email Body:**
- Rich text editor with:
  - Text formatting (bold, italic, headings)
  - Variables dropdown:
    - Customer: `{customer_name}`, `{customer_email}`, `{customer_phone}`
    - Booking: `{booking_id}`, `{service_name}`, `{date}`, `{time}`, `{duration}`
    - Staff: `{staff_name}`, `{staff_email}`
    - Business: `{business_name}`, `{business_phone}`, `{business_address}`
    - Actions: `{cancel_link}`, `{reschedule_link}`, `{add_to_calendar_link}`
  - Insert variable: Click to add `{variable}` to cursor position

**Default Template (editable):**
```
Hi {customer_name},

Great news! Your booking is confirmed.

**Booking Details:**
- Service: {service_name}
- Date: {date}
- Time: {time}
- Staff: {staff_name}
- Location: {business_address}

**What to do next:**
- [Add to Calendar]({add_to_calendar_link})
- Need to change something? [Reschedule]({reschedule_link}) or [Cancel]({cancel_link})

We look forward to seeing you!

{business_name}
{business_phone}
```

**Preview:**
- [Preview Email] button
  - Opens modal showing how email will look to customer
  - Variables replaced with sample data

**And when** I edit template and click "Save Changes"  
**Then**:
- Template saved
- All future emails use new template
- Confirmation: "✓ Booking Confirmation template updated"

**Revert Option:**
- [Reset to Default] button
  - Restores original template
  - Confirmation required

**Edge Cases:**
- If deleting required variable (e.g., `{service_name}`) → Warning: "This variable is required for this email type. Add it back or emails may be unclear."
- If subject line is empty → Error: "Subject line cannot be empty"
- If using invalid variable (e.g., `{invalid_var}`) → Warning icon: "Unknown variable. It will appear as-is in emails."
- If exceeding character limits → Hard limit enforced, cannot save

---

## DOCUMENT STATUS & NEXT STEPS

**Phase 2.3 Status: DRAFT COMPLETE**

### Key Deliverables Covered:
âœ… Epic 1: Initial Setup & Onboarding (4 user stories)  
âœ… Epic 2: Day-to-Day Booking Management (5 user stories)  
âœ… Epic 3: Staff & Service Management (5 user stories)  
âœ… Epic 4: Pricing & Payment Configuration (4 user stories)  
âœ… Epic 5: Reporting & Analytics (5 user stories)  
âœ… Epic 6: Customer Database Management (5 user stories)  
âœ… Additional: Email Notifications & Templates (2 user stories)

### Total User Stories: 30

### Coverage:
- ✅ Initial setup wizard (guided onboarding)
- ✅ Service creation and management
- ✅ Staff member management and availability
- ✅ Booking management (view, create, edit, cancel, reschedule)
- ✅ Payment gateway configuration
- ✅ Deposit and cancellation policies
- ✅ Comprehensive reporting (revenue, bookings, staff performance)
- ✅ Customer database with GDPR compliance
- ✅ Email notification system
- ✅ Data export capabilities

### What's NOT Covered (Phase 2+ Features):
- Group bookings / classes
- Recurring appointments
- Package deals
- Multi-location support
- SMS notifications
- Advanced marketing features
- Customer loyalty programs
- Third-party integrations (beyond Stripe/PayPal/Google Calendar)

### Next Steps:
1. **Review & Approval:** Business Owner reviews all requirements for accuracy
2. **Gap Analysis:** Identify any missing requirements
3. **Phase 2.4:** Technical & Non-Functional Requirements
4. **Phase 2.5:** Integration Requirements

---

## ESTIMATED EFFORT

Based on 30 detailed user stories:

**Development Time Estimate:**
- Epic 1 (Setup): 2-3 weeks
- Epic 2 (Booking Management): 3-4 weeks
- Epic 3 (Staff & Services): 2-3 weeks
- Epic 4 (Pricing & Payments): 2-3 weeks
- Epic 5 (Reporting): 3-4 weeks
- Epic 6 (Customer Database): 2 weeks
- Additional (Notifications): 1-2 weeks

**Total Phase 1 Development:** 15-21 weeks (4-5 months)

---

**Document Version:** 1.0  
**Last Updated:** Session 2.3  
**Status:** Ready for Review
