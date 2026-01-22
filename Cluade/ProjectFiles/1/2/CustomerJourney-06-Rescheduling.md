---

### **5.8.5: Rescheduling - Policy Check**

php
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
**Security Consideration:** Magic links expire after 7 days for security. This is a reasonable timeframe for customers to manage their bookings while minimizing risk of unauthorized access if links are shared or leaked.
**Problem:** Customer clicks cancel/reschedule link after 7 days

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
- Magic links (7-day validity)
**Security Consideration:** Magic links expire after 7 days for security. This is a reasonable timeframe for customers to manage their bookings while minimizing risk of unauthorized access if links are shared or leaked.
---