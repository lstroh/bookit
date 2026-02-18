# 🚀 TASK 11: SETTINGS PAGES

Let's build the Settings section with My Profile, Email Configuration, and Email Templates Management.

---

## 📋 TASK 11 OVERVIEW

**Estimated Time:** 10 hours

**What We're Building:**
1. **My Profile Page** - Staff can update their own info and password
2. **Email Configuration** - SMTP settings and test email
3. **Email Templates** - Customize transactional emails
4. **Settings Navigation** - Sidebar for settings sections

**Parts:**
- **Part A:** Backend API (Settings CRUD, SMTP validation, template management) - 4h
- **Part B:** My Profile Page (change password, update profile) - 2-3h
- **Part C:** Email Configuration Page (SMTP settings, test email) - 2-3h
- **Part D:** Email Templates Management (customize templates) - 2-3h

---

# 📝 TASK 11 PART A: BACKEND SETTINGS API

```markdown
# Task 11 Part A: Settings Backend API

## Context
I'm building a WordPress booking plugin dashboard. Tasks 1-10 complete. Now I need backend APIs for:
1. Staff profile updates (own profile only)
2. Password change (requires current password)
3. Settings CRUD (business info, SMTP, email templates)
4. SMTP validation and test email
5. Email template customization

## Project Structure

WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing API file:
- `includes/api/class-dashboard-bookings-api.php`

Database tables:
- `wp_bookings_staff` - Staff members (for profile updates)
- `wp_bookings_settings` - System settings (key-value pairs)
- `wp_bookings_email_templates` - Email templates

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

## Requirements

### 1. Add My Profile Routes

Add to `register_routes()` in `includes/api/class-dashboard-bookings-api.php`:

```php
// Get current user's profile
register_rest_route(
    self::NAMESPACE,
    '/dashboard/profile',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_my_profile' ),
            'permission_callback' => array( $this, 'check_dashboard_permission' ),
        ),
        array(
            'methods'             => 'PUT',
            'callback'            => array( $this, 'update_my_profile' ),
            'permission_callback' => array( $this, 'check_dashboard_permission' ),
            'args'                => array(
                'first_name' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'last_name' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'email' => array(
                    'type'              => 'string',
                    'validate_callback' => function( $param ) {
                        return is_email( $param );
                    },
                ),
                'phone' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'title' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'bio' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
                'photo_url' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ),
            ),
        ),
    )
);

// Change password
register_rest_route(
    self::NAMESPACE,
    '/dashboard/profile/change-password',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'change_password' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'current_password' => array(
                'required' => true,
                'type'     => 'string',
            ),
            'new_password' => array(
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => function( $param ) {
                    return strlen( $param ) >= 8;
                },
            ),
        ),
    )
);
```

### 2. Add Settings Routes

```php
// Get all settings (or specific by key)
register_rest_route(
    self::NAMESPACE,
    '/dashboard/settings',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_settings' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'keys' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ),
        array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'update_settings' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'settings' => array(
                    'required'          => true,
                    'type'              => 'array',
                    'sanitize_callback' => function( $param ) {
                        return is_array( $param ) ? $param : array();
                    },
                ),
            ),
        ),
    )
);

// Test email
register_rest_route(
    self::NAMESPACE,
    '/dashboard/settings/test-email',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'send_test_email' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'to_email' => array(
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => function( $param ) {
                    return is_email( $param );
                },
            ),
        ),
    )
);
```

### 3. Add Email Templates Routes

```php
// Get all email templates
register_rest_route(
    self::NAMESPACE,
    '/dashboard/email-templates',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'get_email_templates' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
    )
);

// Update email template
register_rest_route(
    self::NAMESPACE,
    '/dashboard/email-templates/(?P<key>[a-z_]+)',
    array(
        array(
            'methods'             => 'PUT',
            'callback'            => array( $this, 'update_email_template' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'subject' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'body' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'wp_kses_post',
                ),
                'enabled' => array(
                    'type' => 'boolean',
                ),
            ),
        ),
        array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'reset_email_template' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
    )
);
```

### 4. Add Profile Methods

```php
/**
 * Get current user's profile
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function get_my_profile( $request ) {
    global $wpdb;

    $staff_id = $this->get_current_staff_id();

    $staff = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                id, email, first_name, last_name, phone, photo_url, bio, title, role
            FROM {$wpdb->prefix}bookings_staff
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $staff ) {
        return new WP_Error(
            'profile_not_found',
            'Profile not found.',
            array( 'status' => 404 )
        );
    }

    $staff['id']        = (int) $staff['id'];
    $staff['full_name'] = $staff['first_name'] . ' ' . $staff['last_name'];

    return rest_ensure_response(
        array(
            'success' => true,
            'profile' => $staff,
        )
    );
}

/**
 * Update current user's profile
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_my_profile( $request ) {
    global $wpdb;

    $staff_id = $this->get_current_staff_id();

    // Build update data
    $update_data   = array();
    $update_format = array();

    $fields = array(
        'first_name' => '%s',
        'last_name'  => '%s',
        'email'      => '%s',
        'phone'      => '%s',
        'title'      => '%s',
        'bio'        => '%s',
        'photo_url'  => '%s',
    );

    foreach ( $fields as $field => $format ) {
        $value = $request->get_param( $field );
        if ( null !== $value ) {
            $update_data[ $field ] = $value;
            $update_format[]       = $format;
        }
    }

    if ( empty( $update_data ) ) {
        return new WP_Error(
            'no_data',
            'No fields to update.',
            array( 'status' => 400 )
        );
    }

    // Check for duplicate email (excluding self)
    if ( isset( $update_data['email'] ) ) {
        $duplicate = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}bookings_staff
                WHERE email = %s AND id != %d AND deleted_at IS NULL",
                $update_data['email'],
                $staff_id
            )
        );

        if ( $duplicate ) {
            return new WP_Error(
                'duplicate_email',
                'This email is already in use.',
                array( 'status' => 409 )
            );
        }
    }

    $update_data['updated_at'] = current_time( 'mysql' );
    $update_format[]           = '%s';

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        $update_data,
        array( 'id' => $staff_id ),
        $update_format,
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update profile.',
            array( 'status' => 500 )
        );
    }

    // Get updated profile
    $profile_response = $this->get_my_profile( $request );

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Profile updated successfully.',
            'profile' => $profile_response->data['profile'],
        )
    );
}

/**
 * Change password for current user
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function change_password( $request ) {
    global $wpdb;

    $staff_id         = $this->get_current_staff_id();
    $current_password = $request->get_param( 'current_password' );
    $new_password     = $request->get_param( 'new_password' );

    // Get current password hash
    $current_hash = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT password_hash FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
            $staff_id
        )
    );

    if ( ! $current_hash ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Verify current password
    if ( ! password_verify( $current_password, $current_hash ) ) {
        return new WP_Error(
            'invalid_password',
            'Current password is incorrect.',
            array( 'status' => 401 )
        );
    }

    // Hash new password
    $new_hash = password_hash( $new_password, PASSWORD_DEFAULT );

    // Update password
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        array(
            'password_hash' => $new_hash,
            'updated_at'    => current_time( 'mysql' ),
        ),
        array( 'id' => $staff_id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to change password.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Password changed successfully.',
        )
    );
}
```

### 5. Add Settings Methods

```php
/**
 * Get settings by keys
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function get_settings( $request ) {
    global $wpdb;

    $keys_param = $request->get_param( 'keys' );
    
    if ( $keys_param ) {
        // Get specific settings
        $keys = array_map( 'trim', explode( ',', $keys_param ) );
        $placeholders = implode( ',', array_fill( 0, count( $keys ), '%s' ) );
        
        $settings = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT setting_key, setting_value, setting_type
                FROM {$wpdb->prefix}bookings_settings
                WHERE setting_key IN ($placeholders)",
                $keys
            ),
            ARRAY_A
        );
    } else {
        // Get all settings
        $settings = $wpdb->get_results(
            "SELECT setting_key, setting_value, setting_type
            FROM {$wpdb->prefix}bookings_settings",
            ARRAY_A
        );
    }

    // Convert types
    $formatted = array();
    foreach ( $settings as $setting ) {
        $value = $setting['setting_value'];
        
        switch ( $setting['setting_type'] ) {
            case 'integer':
                $value = (int) $value;
                break;
            case 'boolean':
                $value = (bool) $value;
                break;
            case 'json':
                $value = json_decode( $value, true );
                break;
        }
        
        $formatted[ $setting['setting_key'] ] = $value;
    }

    return rest_ensure_response(
        array(
            'success'  => true,
            'settings' => $formatted,
        )
    );
}

/**
 * Update settings
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_settings( $request ) {
    global $wpdb;

    $settings = $request->get_param( 'settings' );

    foreach ( $settings as $key => $value ) {
        $key = sanitize_key( $key );
        
        // Determine type
        $type = 'string';
        if ( is_int( $value ) ) {
            $type = 'integer';
        } elseif ( is_bool( $value ) ) {
            $type = 'boolean';
        } elseif ( is_array( $value ) ) {
            $type  = 'json';
            $value = wp_json_encode( $value );
        }

        // Upsert
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s",
                $key
            )
        );

        if ( $existing ) {
            $wpdb->update(
                $wpdb->prefix . 'bookings_settings',
                array(
                    'setting_value' => $value,
                    'setting_type'  => $type,
                ),
                array( 'setting_key' => $key ),
                array( '%s', '%s' ),
                array( '%s' )
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'bookings_settings',
                array(
                    'setting_key'   => $key,
                    'setting_value' => $value,
                    'setting_type'  => $type,
                ),
                array( '%s', '%s', '%s' )
            );
        }
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Settings saved successfully.',
        )
    );
}

/**
 * Send test email
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function send_test_email( $request ) {
    $to_email = $request->get_param( 'to_email' );

    $subject = 'Test Email from Bookit Booking System';
    $message = "This is a test email sent at " . current_time( 'mysql' ) . ".\n\n";
    $message .= "If you received this email, your email configuration is working correctly!\n\n";
    $message .= "Bookit Booking System";

    $result = wp_mail( $to_email, $subject, $message );

    if ( ! $result ) {
        return new WP_Error(
            'email_failed',
            'Failed to send test email. Please check your SMTP configuration.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => "Test email sent successfully to {$to_email}.",
        )
    );
}
```

### 6. Add Email Templates Methods

```php
/**
 * Get all email templates
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function get_email_templates( $request ) {
    global $wpdb;

    $templates = $wpdb->get_results(
        "SELECT template_key, subject, body, enabled
        FROM {$wpdb->prefix}bookings_email_templates
        ORDER BY template_key",
        ARRAY_A
    );

    // Convert boolean
    foreach ( $templates as &$template ) {
        $template['enabled'] = (bool) $template['enabled'];
    }

    return rest_ensure_response(
        array(
            'success'   => true,
            'templates' => $templates,
        )
    );
}

/**
 * Update email template
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_email_template( $request ) {
    global $wpdb;

    $key     = $request->get_param( 'key' );
    $subject = $request->get_param( 'subject' );
    $body    = $request->get_param( 'body' );
    $enabled = $request->get_param( 'enabled' );

    $update_data   = array(
        'subject' => $subject,
        'body'    => $body,
    );
    $update_format = array( '%s', '%s' );

    if ( null !== $enabled ) {
        $update_data['enabled'] = filter_var( $enabled, FILTER_VALIDATE_BOOLEAN ) ? 1 : 0;
        $update_format[]        = '%d';
    }

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_email_templates',
        $update_data,
        array( 'template_key' => $key ),
        $update_format,
        array( '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update email template.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Email template updated successfully.',
        )
    );
}

/**
 * Reset email template to default
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function reset_email_template( $request ) {
    global $wpdb;

    $key = $request->get_param( 'key' );

    // Get default template
    $defaults = $this->get_default_email_templates();

    if ( ! isset( $defaults[ $key ] ) ) {
        return new WP_Error(
            'template_not_found',
            'Template not found.',
            array( 'status' => 404 )
        );
    }

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_email_templates',
        array(
            'subject' => $defaults[ $key ]['subject'],
            'body'    => $defaults[ $key ]['body'],
        ),
        array( 'template_key' => $key ),
        array( '%s', '%s' ),
        array( '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'reset_failed',
            'Failed to reset email template.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Email template reset to default.',
        )
    );
}

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

### 7. Add Helper Method

```php
/**
 * Get current staff ID from session
 *
 * @return int|null
 */
private function get_current_staff_id() {
    if ( ! class_exists( 'Bookit_Session' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-session.php';
    }

    Bookit_Session::start();
    return Bookit_Session::get( 'staff_id' );
}
```

## Testing

### Test 1: Get My Profile
```javascript
fetch('/wp-json/bookit/v1/dashboard/profile', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('My profile:', data.profile)
  console.log('Name:', data.profile.first_name, data.profile.last_name)
  console.log('Role:', data.profile.role)
})
```

Expected: Current user's profile details

### Test 2: Update My Profile
```javascript
fetch('/wp-json/bookit/v1/dashboard/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    first_name: 'Updated',
    last_name: 'Name',
    phone: '07123456789'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Profile updated, returns updated profile

### Test 3: Change Password (Success)
```javascript
fetch('/wp-json/bookit/v1/dashboard/profile/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    current_password: 'password123',
    new_password: 'newpassword123'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success message

### Test 4: Change Password (Wrong Current)
```javascript
fetch('/wp-json/bookit/v1/dashboard/profile/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    current_password: 'wrongpassword',
    new_password: 'newpassword123'
  })
}).then(r => r.json()).then(console.log)
```

Expected: 401 error "Current password is incorrect"

### Test 5: Get Settings
```javascript
fetch('/wp-json/bookit/v1/dashboard/settings?keys=smtp_host,smtp_port', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Settings:', data.settings)
})
```

Expected: SMTP settings (or empty if not configured)

### Test 6: Update Settings
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
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: 'test@gmail.com',
      smtp_password: 'app_password_here',
      smtp_from_name: 'Bookit Test',
      smtp_from_email: 'test@gmail.com'
    }
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success message

### Test 7: Send Test Email
```javascript
fetch('/wp-json/bookit/v1/dashboard/settings/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    to_email: 'your-email@example.com'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success or failure message

### Test 8: Get Email Templates
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Templates:', data.templates)
})
```

Expected: List of all email templates

### Test 9: Update Email Template
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates/booking_confirmation', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    subject: 'Custom Subject - {service_name}',
    body: 'Custom body with {customer_name} and {date}',
    enabled: true
  })
}).then(r => r.json()).then(console.log)
```

Expected: Success message

### Test 10: Reset Email Template
```javascript
fetch('/wp-json/bookit/v1/dashboard/email-templates/booking_confirmation', {
  method: 'POST',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Template reset to default



## Notes

- Admin-only for settings and email templates
- Any authenticated user can view/update own profile
- Cannot change own role via profile
- Password change requires current password
- Settings stored as key-value pairs
- Email templates support variables: {customer_name}, {service_name}, {date}, {time}, {staff_name}, {business_name}
- Test email uses WordPress wp_mail()
- SMTP configuration via WordPress plugins (WP Mail SMTP, etc.)
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 10 scenarios** in console
2. **Verify profile get/update works**
3. **Test password change** (correct and incorrect current password)
4. **Test settings CRUD**
5. **Send test email**
6. **Verify email templates** get/update/reset

**Then say:** "Part A complete, ready for Part B!"

I'll give you **Part B (My Profile Page)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when it's done and tested!