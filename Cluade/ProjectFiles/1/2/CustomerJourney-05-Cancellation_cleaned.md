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
