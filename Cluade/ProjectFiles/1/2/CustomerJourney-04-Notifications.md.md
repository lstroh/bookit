

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