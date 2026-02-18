# Task 11 Part A (Updated): Settings Backend API with Activation Setup

## Context
The wp_bookings_settings table exists but is missing the setting_type column.
The wp_bookings_email_templates table doesn't exist.
We need to handle both in the plugin activation hook.

## Part 1: Update Plugin Activation

Find your main plugin file (likely `bookit-booking-system.php`) and update the activation hook.

### Locate Activation Function

Find something like:
```php
register_activation_hook( __FILE__, 'bookit_activate_plugin' );

function bookit_activate_plugin() {
    // Existing activation code...
}
```

### Add Database Setup to Activation

**Update the activation function to include:**
```php
/**
 * Plugin activation hook
 */
function bookit_activate_plugin() {
    global $wpdb;
    
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // 1. Add setting_type column to existing settings table (if missing)
    $column_exists = $wpdb->get_results(
        "SHOW COLUMNS FROM {$wpdb->prefix}bookings_settings LIKE 'setting_type'"
    );
    
    if ( empty( $column_exists ) ) {
        $wpdb->query(
            "ALTER TABLE {$wpdb->prefix}bookings_settings 
            ADD COLUMN setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string' 
            AFTER setting_value"
        );
    }
    
    // 2. Create email templates table
    $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookings_email_templates (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        template_key VARCHAR(50) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        enabled TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_template_key (template_key)
    ) $charset_collate;";
    
    dbDelta( $sql );
    
    // 3. Seed default email templates (only if table is empty)
    $count = $wpdb->get_var( 
        "SELECT COUNT(*) FROM {$wpdb->prefix}bookings_email_templates" 
    );
    
    if ( 0 == $count ) {
        $default_templates = array(
            array(
                'template_key' => 'booking_confirmation',
                'subject'      => 'Booking Confirmed - {service_name}',
                'body'         => "Hi {customer_name},\n\nYour booking is confirmed!\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nLocation: {business_address}\n\nIf you need to make changes:\n- Reschedule: {reschedule_link}\n- Cancel: {cancel_link}\n\nThank you,\n{business_name}\n{business_phone}",
                'enabled'      => 1,
            ),
            array(
                'template_key' => 'booking_reminder',
                'subject'      => 'Reminder: {service_name} tomorrow at {time}',
                'body'         => "Hi {customer_name},\n\nThis is a reminder about your booking tomorrow.\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nLocation: {business_address}\n\nWe look forward to seeing you!\n\nIf you need to make changes:\n- Reschedule: {reschedule_link}\n- Cancel: {cancel_link}\n\nSee you soon,\n{business_name}\n{business_phone}",
                'enabled'      => 1,
            ),
            array(
                'template_key' => 'booking_cancelled',
                'subject'      => 'Booking Cancelled - {service_name}',
                'body'         => "Hi {customer_name},\n\nYour booking has been cancelled.\n\n**Cancelled Booking:**\nService: {service_name}\nDate: {date}\nTime: {time}\n\nIf this was a mistake or you'd like to rebook, please contact us or visit our website.\n\nThank you,\n{business_name}\n{business_phone}",
                'enabled'      => 1,
            ),
            array(
                'template_key' => 'admin_new_booking',
                'subject'      => 'New Booking: {customer_name} - {service_name}',
                'body'         => "New booking received!\n\n**Customer:**\n{customer_name}\n{customer_email}\n{customer_phone}\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nDuration: {duration} minutes\n\n**Payment:**\nTotal: £{total_price}\nDeposit Paid: £{deposit_paid}\n\nView in dashboard: {dashboard_link}",
                'enabled'      => 1,
            ),
            array(
                'template_key' => 'staff_new_booking',
                'subject'      => 'New Booking Assigned: {customer_name}',
                'body'         => "Hi {staff_name},\n\nYou have a new booking!\n\n**Customer:**\n{customer_name}\n{customer_phone}\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nDuration: {duration} minutes\n\nView in dashboard: {dashboard_link}",
                'enabled'      => 1,
            ),
        );
        
        foreach ( $default_templates as $template ) {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_email_templates',
                $template,
                array( '%s', '%s', '%s', '%d' )
            );
        }
    }
    
    // 4. Flush rewrite rules (if using custom permalinks)
    flush_rewrite_rules();
}
```

## Part 2: Backend API Methods (Same as Before)

All the API methods from the original Part A remain the same:

### Profile Routes & Methods
- GET/PUT `/dashboard/profile`
- POST `/dashboard/profile/change-password`
- Methods: `get_my_profile()`, `update_my_profile()`, `change_password()`

### Settings Routes & Methods
- GET/POST `/dashboard/settings`
- POST `/dashboard/settings/test-email`
- Methods: `get_settings()`, `update_settings()`, `send_test_email()`

### Email Templates Routes & Methods
- GET `/dashboard/email-templates`
- PUT `/dashboard/email-templates/{key}`
- POST `/dashboard/email-templates/{key}` (reset)
- Methods: `get_email_templates()`, `update_email_template()`, `reset_email_template()`

### Helper Method
- `get_current_staff_id()`

**ALL METHODS STAY EXACTLY THE SAME** - just copy from original Part A prompt.

The only changes are in the activation hook above.

## Part 3: Update get_default_email_templates() Method

In the `reset_email_template()` method, update the `get_default_email_templates()` helper:
```php
/**
 * Get default email templates
 *
 * @return array
 */
private function get_default_email_templates() {
    return array(
        'booking_confirmation' => array(
            'subject' => 'Booking Confirmed - {service_name}',
            'body'    => "Hi {customer_name},\n\nYour booking is confirmed!\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nLocation: {business_address}\n\nIf you need to make changes:\n- Reschedule: {reschedule_link}\n- Cancel: {cancel_link}\n\nThank you,\n{business_name}\n{business_phone}",
        ),
        'booking_reminder' => array(
            'subject' => 'Reminder: {service_name} tomorrow at {time}',
            'body'    => "Hi {customer_name},\n\nThis is a reminder about your booking tomorrow.\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nLocation: {business_address}\n\nWe look forward to seeing you!\n\nIf you need to make changes:\n- Reschedule: {reschedule_link}\n- Cancel: {cancel_link}\n\nSee you soon,\n{business_name}\n{business_phone}",
        ),
        'booking_cancelled' => array(
            'subject' => 'Booking Cancelled - {service_name}',
            'body'    => "Hi {customer_name},\n\nYour booking has been cancelled.\n\n**Cancelled Booking:**\nService: {service_name}\nDate: {date}\nTime: {time}\n\nIf this was a mistake or you'd like to rebook, please contact us or visit our website.\n\nThank you,\n{business_name}\n{business_phone}",
        ),
        'admin_new_booking' => array(
            'subject' => 'New Booking: {customer_name} - {service_name}',
            'body'    => "New booking received!\n\n**Customer:**\n{customer_name}\n{customer_email}\n{customer_phone}\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nStaff: {staff_name}\nDuration: {duration} minutes\n\n**Payment:**\nTotal: £{total_price}\nDeposit Paid: £{deposit_paid}\n\nView in dashboard: {dashboard_link}",
        ),
        'staff_new_booking' => array(
            'subject' => 'New Booking Assigned: {customer_name}',
            'body'    => "Hi {staff_name},\n\nYou have a new booking!\n\n**Customer:**\n{customer_name}\n{customer_phone}\n\n**Booking Details:**\nService: {service_name}\nDate: {date}\nTime: {time}\nDuration: {duration} minutes\n\nView in dashboard: {dashboard_link}",
        ),
    );
}
```

## Testing After Activation

### Test 1: Verify setting_type Column Added
```sql
DESCRIBE wp_bookings_settings;
```

Expected: setting_type column exists (ENUM: string, integer, boolean, json)

### Test 2: Verify Email Templates Table Created
```sql
DESCRIBE wp_bookings_email_templates;
```

Expected: Table exists with all columns

### Test 3: Verify Default Templates Seeded
```sql
SELECT template_key, subject FROM wp_bookings_email_templates;
```

Expected: 5 templates (booking_confirmation, booking_reminder, booking_cancelled, admin_new_booking, staff_new_booking)

### Test 4: Deactivate and Reactivate Plugin
1. Deactivate plugin
2. Reactivate plugin
3. Check that it doesn't duplicate templates

Expected: Still 5 templates (COUNT check prevents duplicates)

### Test 5: Test Settings API with Types
```javascript
fetch('/wp-json/bookit/v1/dashboard/settings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    settings: {
      smtp_port: 587,           // integer
      smtp_enabled: true,       // boolean
      smtp_host: 'smtp.gmail.com', // string
      business_hours: {         // json
        monday: '9-5',
        tuesday: '9-5'
      }
    }
  })
}).then(r => r.json()).then(console.log)
```

Expected: Settings saved with correct types

### Test 6: Verify Types in Database
```sql
SELECT setting_key, setting_value, setting_type 
FROM wp_bookings_settings;
```

Expected:
- smtp_port: value=587, type=integer
- smtp_enabled: value=1, type=boolean
- smtp_host: value=smtp.gmail.com, type=string
- business_hours: value={"monday":"9-5",...}, type=json

### Test 7: Get Email Templates via API
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Templates:', data.templates)
  console.log('Count:', data.templates.length) // Should be 5
})
```

Expected: 5 templates returned

### Test 8: Update Email Template
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates/booking_confirmation', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    subject: 'CUSTOM: Booking Confirmed - {service_name}',
    body: 'Custom template body...',
    enabled: true
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success

### Test 9: Reset Email Template
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates/booking_confirmation', {
  method: 'POST',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Template reset to default (original subject/body restored)

### Test 10: All Profile & Settings Tests from Original Part A

Run all 10 tests from the original Part A (profile get/update, password change, settings, test email, etc.)

## Available Template Variables

Document these for frontend:

**Customer Variables:**
- {customer_name}
- {customer_email}
- {customer_phone}

**Booking Variables:**
- {service_name}
- {date}
- {time}
- {duration}
- {staff_name}
- {total_price}
- {deposit_paid}

**Business Variables:**
- {business_name}
- {business_phone}
- {business_address}

**Action Links:**
- {reschedule_link}
- {cancel_link}
- {dashboard_link}

## Notes

- Activation hook runs ONCE when plugin is activated
- setting_type column added only if missing (safe to run multiple times)
- Email templates table created if not exists (safe to run multiple times)
- Templates seeded only if table is empty (prevents duplicates)
- All 5 default templates enabled by default
- Templates support plain text (HTML in Phase 2)
- Variables replaced at send time (not stored in templates)