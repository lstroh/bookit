# ✅ EXCELLENT! This is Incredibly Helpful!

Let me analyze the existing model thoroughly before generating prompts.

---

## 🔍 KEY INSIGHTS FROM THE MODEL

### **What Already Works (DO NOT BREAK):**

**Slot Generation Logic:**
- ✅ 15-minute increment slots (`generate_slots_in_range`)
- ✅ Break time filtering (slots overlapping break are skipped)
- ✅ Buffer times via `total_time_needed = buffer_before + duration + buffer_after`
- ✅ Existing booking conflict detection (`filter_booked_slots`)
- ✅ Past slot filtering for today (30 min cutoff)
- ✅ Specific date exceptions checked FIRST, then day_of_week fallback
- ✅ Multiple rows per day supported (split shifts via multiple patterns)
- ✅ valid_from/valid_until already in the query!
- ✅ ISO-8601 day numbering (`date('N')`)
- ✅ No Preference aggregates across all qualified staff

### **Critical Discovery - Slot Interval:**
```php
$current += 15 * 60; // Always 15-minute increments
```
Slots START every 15 minutes, but the SERVICE DURATION determines how far ahead is blocked. This is already correct - no changes needed here!

### **What the API Needs to Save (Exact Format):**
```sql
-- Weekly recurring pattern
staff_id: X
day_of_week: 1-7 (ISO-8601)
specific_date: NULL
start_time: '09:00:00'
end_time: '17:00:00'
is_working: 1
break_start: '12:00:00' (nullable)
break_end: '13:00:00' (nullable)
repeat_weekly: 1
valid_from: NULL or date
valid_until: NULL or date

-- Specific date exception
staff_id: X
day_of_week: NULL
specific_date: '2026-03-15'
start_time: '09:00:00'
end_time: '13:00:00'
is_working: 0 (day off) or 1 (special hours)
break_start: NULL
break_end: NULL
repeat_weekly: 0
```

### **Important Note on Notes Field:**
The table has a `notes` field - useful for exceptions (e.g., "Christmas Eve - half day")

---

## ✅ NO MORE QUESTIONS NEEDED!

The model is crystal clear. I have everything required. Let me generate **Part A** now.

---

# 📝 TASK 10 PART A: BACKEND WORKING HOURS API

```markdown
# Task 10 Part A: Staff Working Hours Backend API

## Context
I'm building a WordPress booking plugin dashboard. The slot generation logic already exists in `includes/models/class-datetime-model.php` and MUST NOT be modified. It already handles:
- 15-minute slot increments
- Break time filtering
- Buffer times via total_time_needed
- Specific date exceptions (checked first)
- Day-of-week patterns with valid_from/valid_until
- Existing booking conflict detection

Task 10 backend needs to provide CRUD endpoints for managing working hours data that feeds into this existing model.

## Database Table Structure

`wp_bookings_staff_working_hours`:
- id (int unsigned, PK)
- staff_id (int unsigned, FK)
- day_of_week (tinyint, nullable) - ISO-8601: 1=Mon...7=Sun, NULL for specific dates
- specific_date (date, nullable) - NULL for recurring, date for exceptions
- start_time (time) - e.g., '09:00:00'
- end_time (time) - e.g., '17:00:00'
- is_working (tinyint) - 1=working, 0=day off
- break_start (time, nullable) - break start time
- break_end (time, nullable) - break end time
- repeat_weekly (tinyint) - 1=recurring, 0=one-time
- valid_from (date, nullable) - seasonal schedule start
- valid_until (date, nullable) - seasonal schedule end
- notes (text, nullable) - admin notes for exceptions
- created_at, updated_at (timestamps)

## Requirements

### 1. Add Working Hours Routes

Add all routes in `register_routes()` in
`includes/api/class-dashboard-bookings-api.php`:

```php
// Get working hours for a staff member
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<staff_id>\d+)/hours',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_working_hours' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
        array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'save_working_hours' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'schedule' => array(
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

// Get/Update/Delete single working hours record
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<staff_id>\d+)/hours/(?P<id>\d+)',
    array(
        array(
            'methods'             => 'PUT',
            'callback'            => array( $this, 'update_working_hours_record' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
        array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_working_hours_record' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
    )
);

// Exception management (specific dates)
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<staff_id>\d+)/hours/exceptions',
    array(
        array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_exceptions' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
        ),
        array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'add_exception' ),
            'permission_callback' => array( $this, 'check_admin_permission' ),
            'args'                => array(
                'specific_date' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'is_working' => array(
                    'required' => true,
                    'type'     => 'boolean',
                ),
                'start_time' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'end_time' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'break_start' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'break_end' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'notes' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
            ),
        ),
    )
);

// Delete exception
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<staff_id>\d+)/hours/exceptions/(?P<id>\d+)',
    array(
        'methods'             => 'DELETE',
        'callback'            => array( $this, 'delete_exception' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
    )
);
```

### 2. Add Get Working Hours Method

```php
/**
 * Get weekly working hours schedule for a staff member
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_working_hours( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'staff_id' );

    // Verify staff exists
    $staff = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, first_name, last_name 
            FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $staff ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Get weekly recurring schedule (day_of_week patterns)
    $weekly_schedule = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT 
                id,
                day_of_week,
                start_time,
                end_time,
                is_working,
                break_start,
                break_end,
                repeat_weekly,
                valid_from,
                valid_until,
                notes
            FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE staff_id = %d
            AND day_of_week IS NOT NULL
            AND specific_date IS NULL
            ORDER BY day_of_week ASC, start_time ASC",
            $staff_id
        ),
        ARRAY_A
    );

    // Build structured schedule by day (1-7)
    $schedule = array();
    for ( $day = 1; $day <= 7; $day++ ) {
        $day_rows = array_filter( $weekly_schedule, function( $row ) use ( $day ) {
            return (int) $row['day_of_week'] === $day;
        });

        if ( empty( $day_rows ) ) {
            // Day has no configuration = day off
            $schedule[ $day ] = array(
                'day_of_week' => $day,
                'is_working'  => false,
                'records'     => array(),
            );
        } else {
            $day_rows = array_values( $day_rows );
            
            // Check if any record marks as working
            $is_working = false;
            foreach ( $day_rows as $row ) {
                if ( (int) $row['is_working'] === 1 ) {
                    $is_working = true;
                    break;
                }
            }

            $schedule[ $day ] = array(
                'day_of_week' => $day,
                'is_working'  => $is_working,
                'records'     => array_map( function( $row ) {
                    return array(
                        'id'           => (int) $row['id'],
                        'start_time'   => $row['start_time'],
                        'end_time'     => $row['end_time'],
                        'is_working'   => (bool) $row['is_working'],
                        'break_start'  => $row['break_start'],
                        'break_end'    => $row['break_end'],
                        'repeat_weekly' => (bool) $row['repeat_weekly'],
                        'valid_from'   => $row['valid_from'],
                        'valid_until'  => $row['valid_until'],
                        'notes'        => $row['notes'],
                    );
                }, $day_rows ),
            );
        }
    }

    return rest_ensure_response(
        array(
            'success'  => true,
            'staff'    => array(
                'id'         => (int) $staff['id'],
                'first_name' => $staff['first_name'],
                'last_name'  => $staff['last_name'],
                'full_name'  => $staff['first_name'] . ' ' . $staff['last_name'],
            ),
            'schedule' => $schedule,
        )
    );
}
```

### 3. Add Save Working Hours Method

This replaces ALL weekly schedule records for a staff member:

```php
/**
 * Save weekly working hours schedule for a staff member
 * Replaces all existing day_of_week records (not exceptions)
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function save_working_hours( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'staff_id' );
    $schedule = $request->get_param( 'schedule' );

    // Verify staff exists
    $staff = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        )
    );

    if ( ! $staff ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Delete existing weekly schedule (keep specific_date exceptions)
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE staff_id = %d
            AND day_of_week IS NOT NULL
            AND specific_date IS NULL",
            $staff_id
        )
    );

    // Insert new schedule records
    $inserted = 0;
    foreach ( $schedule as $day_data ) {
        $day_of_week = (int) ( $day_data['day_of_week'] ?? 0 );
        $is_working  = filter_var( $day_data['is_working'] ?? false, FILTER_VALIDATE_BOOLEAN );

        // Validate day_of_week
        if ( $day_of_week < 1 || $day_of_week > 7 ) {
            continue;
        }

        // Skip days marked as not working (no record needed = day off)
        if ( ! $is_working ) {
            continue;
        }

        // Validate required times
        $start_time = sanitize_text_field( $day_data['start_time'] ?? '' );
        $end_time   = sanitize_text_field( $day_data['end_time'] ?? '' );

        if ( empty( $start_time ) || empty( $end_time ) ) {
            continue;
        }

        // Validate time format (H:i or H:i:s)
        if ( ! preg_match( '/^\d{2}:\d{2}(:\d{2})?$/', $start_time ) ||
             ! preg_match( '/^\d{2}:\d{2}(:\d{2})?$/', $end_time ) ) {
            continue;
        }

        // Ensure seconds included
        if ( strlen( $start_time ) === 5 ) {
            $start_time .= ':00';
        }
        if ( strlen( $end_time ) === 5 ) {
            $end_time .= ':00';
        }

        // Validate start < end
        if ( strtotime( $start_time ) >= strtotime( $end_time ) ) {
            continue;
        }

        // Break times
        $break_start = ! empty( $day_data['break_start'] ) ? sanitize_text_field( $day_data['break_start'] ) : null;
        $break_end   = ! empty( $day_data['break_end'] ) ? sanitize_text_field( $day_data['break_end'] ) : null;

        // Validate break if provided
        if ( $break_start && $break_end ) {
            if ( strlen( $break_start ) === 5 ) {
                $break_start .= ':00';
            }
            if ( strlen( $break_end ) === 5 ) {
                $break_end .= ':00';
            }
            // Break must be within working hours
            if ( strtotime( $break_start ) <= strtotime( $start_time ) ||
                 strtotime( $break_end ) >= strtotime( $end_time ) ||
                 strtotime( $break_start ) >= strtotime( $break_end ) ) {
                $break_start = null;
                $break_end   = null;
            }
        } else {
            $break_start = null;
            $break_end   = null;
        }

        // Seasonal schedule
        $valid_from  = ! empty( $day_data['valid_from'] ) ? sanitize_text_field( $day_data['valid_from'] ) : null;
        $valid_until = ! empty( $day_data['valid_until'] ) ? sanitize_text_field( $day_data['valid_until'] ) : null;

        $result = $wpdb->insert(
            $wpdb->prefix . 'bookings_staff_working_hours',
            array(
                'staff_id'      => $staff_id,
                'day_of_week'   => $day_of_week,
                'specific_date' => null,
                'start_time'    => $start_time,
                'end_time'      => $end_time,
                'is_working'    => 1,
                'break_start'   => $break_start,
                'break_end'     => $break_end,
                'repeat_weekly' => 1,
                'valid_from'    => $valid_from,
                'valid_until'   => $valid_until,
                'notes'         => null,
            ),
            array( '%d', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s', '%s' )
        );

        if ( false !== $result ) {
            $inserted++;
        }
    }

    // Return updated schedule
    $get_request = new WP_REST_Request( 'GET' );
    $get_request->set_param( 'staff_id', $staff_id );
    $response = $this->get_working_hours( $get_request );

    return rest_ensure_response(
        array(
            'success'  => true,
            'message'  => sprintf( 'Working hours saved. %d day(s) configured.', $inserted ),
            'schedule' => $response->data['schedule'],
        )
    );
}
```

### 4. Add Get Exceptions Method

```php
/**
 * Get date exceptions for a staff member
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function get_exceptions( $request ) {
    global $wpdb;

    $staff_id = (int) $request->get_param( 'staff_id' );

    // Verify staff exists
    $staff = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        )
    );

    if ( ! $staff ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Get future exceptions (specific dates from today onwards)
    $exceptions = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT 
                id,
                specific_date,
                start_time,
                end_time,
                is_working,
                break_start,
                break_end,
                notes,
                created_at
            FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE staff_id = %d
            AND specific_date IS NOT NULL
            AND day_of_week IS NULL
            ORDER BY specific_date ASC",
            $staff_id
        ),
        ARRAY_A
    );

    // Convert types
    foreach ( $exceptions as &$exception ) {
        $exception['id']         = (int) $exception['id'];
        $exception['is_working'] = (bool) $exception['is_working'];
    }

    return rest_ensure_response(
        array(
            'success'    => true,
            'exceptions' => $exceptions,
        )
    );
}
```

### 5. Add Add Exception Method

```php
/**
 * Add a specific date exception for a staff member
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function add_exception( $request ) {
    global $wpdb;

    $staff_id      = (int) $request->get_param( 'staff_id' );
    $specific_date = $request->get_param( 'specific_date' );
    $is_working    = filter_var( $request->get_param( 'is_working' ), FILTER_VALIDATE_BOOLEAN );

    // Verify staff exists
    $staff = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff 
            WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        )
    );

    if ( ! $staff ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Validate date format
    if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $specific_date ) ) {
        return new WP_Error(
            'invalid_date',
            'Invalid date format. Use Y-m-d.',
            array( 'status' => 400 )
        );
    }

    // Check for duplicate exception on same date
    $existing = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE staff_id = %d
            AND specific_date = %s",
            $staff_id,
            $specific_date
        )
    );

    if ( $existing ) {
        return new WP_Error(
            'duplicate_exception',
            'An exception already exists for this date. Delete the existing one first.',
            array( 'status' => 409 )
        );
    }

    // Prepare time fields
    $start_time  = null;
    $end_time    = null;
    $break_start = null;
    $break_end   = null;

    if ( $is_working ) {
        $start_time = sanitize_text_field( $request->get_param( 'start_time' ) ?? '' );
        $end_time   = sanitize_text_field( $request->get_param( 'end_time' ) ?? '' );

        if ( empty( $start_time ) || empty( $end_time ) ) {
            return new WP_Error(
                'missing_times',
                'Start time and end time are required when is_working is true.',
                array( 'status' => 400 )
            );
        }

        // Ensure seconds
        if ( strlen( $start_time ) === 5 ) {
            $start_time .= ':00';
        }
        if ( strlen( $end_time ) === 5 ) {
            $end_time .= ':00';
        }

        // Break times
        $break_start_raw = $request->get_param( 'break_start' );
        $break_end_raw   = $request->get_param( 'break_end' );

        if ( ! empty( $break_start_raw ) && ! empty( $break_end_raw ) ) {
            $break_start = sanitize_text_field( $break_start_raw );
            $break_end   = sanitize_text_field( $break_end_raw );

            if ( strlen( $break_start ) === 5 ) {
                $break_start .= ':00';
            }
            if ( strlen( $break_end ) === 5 ) {
                $break_end .= ':00';
            }
        }
    }

    // Notes
    $notes = $request->get_param( 'notes' ) ? sanitize_textarea_field( $request->get_param( 'notes' ) ) : null;

    // Insert exception
    $result = $wpdb->insert(
        $wpdb->prefix . 'bookings_staff_working_hours',
        array(
            'staff_id'      => $staff_id,
            'day_of_week'   => null,
            'specific_date' => $specific_date,
            'start_time'    => $is_working ? $start_time : '00:00:00',
            'end_time'      => $is_working ? $end_time : '00:00:00',
            'is_working'    => $is_working ? 1 : 0,
            'break_start'   => $break_start,
            'break_end'     => $break_end,
            'repeat_weekly' => 0,
            'valid_from'    => null,
            'valid_until'   => null,
            'notes'         => $notes,
        ),
        array( '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s', '%s' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'insert_failed',
            'Failed to add exception.',
            array( 'status' => 500 )
        );
    }

    $exception_id = $wpdb->insert_id;

    return rest_ensure_response(
        array(
            'success'   => true,
            'message'   => 'Exception added successfully.',
            'exception' => array(
                'id'            => $exception_id,
                'specific_date' => $specific_date,
                'is_working'    => $is_working,
                'start_time'    => $is_working ? $start_time : null,
                'end_time'      => $is_working ? $end_time : null,
                'break_start'   => $break_start,
                'break_end'     => $break_end,
                'notes'         => $notes,
            ),
        )
    );
}
```

### 6. Add Delete Exception Method

```php
/**
 * Delete a specific date exception
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function delete_exception( $request ) {
    global $wpdb;

    $staff_id     = (int) $request->get_param( 'staff_id' );
    $exception_id = (int) $request->get_param( 'id' );

    // Verify exception belongs to this staff member
    $exception = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, specific_date FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE id = %d
            AND staff_id = %d
            AND specific_date IS NOT NULL",
            $exception_id,
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $exception ) {
        return new WP_Error(
            'exception_not_found',
            'Exception not found.',
            array( 'status' => 404 )
        );
    }

    $result = $wpdb->delete(
        $wpdb->prefix . 'bookings_staff_working_hours',
        array( 'id' => $exception_id ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'delete_failed',
            'Failed to delete exception.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Exception deleted successfully.',
        )
    );
}

/**
 * Update a single working hours record
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function update_working_hours_record( $request ) {
    global $wpdb;

    $staff_id  = (int) $request->get_param( 'staff_id' );
    $record_id = (int) $request->get_param( 'id' );

    // Verify record belongs to staff
    $record = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE id = %d AND staff_id = %d",
            $record_id,
            $staff_id
        )
    );

    if ( ! $record ) {
        return new WP_Error(
            'record_not_found',
            'Working hours record not found.',
            array( 'status' => 404 )
        );
    }

    // Build update data from request
    $update_data   = array();
    $update_format = array();

    $fields = array(
        'start_time'   => '%s',
        'end_time'     => '%s',
        'break_start'  => '%s',
        'break_end'    => '%s',
        'valid_from'   => '%s',
        'valid_until'  => '%s',
        'notes'        => '%s',
    );

    foreach ( $fields as $field => $format ) {
        $value = $request->get_param( $field );
        if ( null !== $value ) {
            $update_data[ $field ]   = sanitize_text_field( $value );
            $update_format[]         = $format;
        }
    }

    if ( null !== $request->get_param( 'is_working' ) ) {
        $update_data['is_working'] = filter_var( $request->get_param( 'is_working' ), FILTER_VALIDATE_BOOLEAN ) ? 1 : 0;
        $update_format[]           = '%d';
    }

    if ( empty( $update_data ) ) {
        return new WP_Error(
            'no_data',
            'No fields to update.',
            array( 'status' => 400 )
        );
    }

    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff_working_hours',
        $update_data,
        array( 'id' => $record_id ),
        $update_format,
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'update_failed',
            'Failed to update working hours.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Working hours updated successfully.',
        )
    );
}

/**
 * Delete a working hours record
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function delete_working_hours_record( $request ) {
    global $wpdb;

    $staff_id  = (int) $request->get_param( 'staff_id' );
    $record_id = (int) $request->get_param( 'id' );

    // Verify record belongs to staff
    $record = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff_working_hours
            WHERE id = %d AND staff_id = %d",
            $record_id,
            $staff_id
        )
    );

    if ( ! $record ) {
        return new WP_Error(
            'record_not_found',
            'Working hours record not found.',
            array( 'status' => 404 )
        );
    }

    $result = $wpdb->delete(
        $wpdb->prefix . 'bookings_staff_working_hours',
        array( 'id' => $record_id ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'delete_failed',
            'Failed to delete working hours record.',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Working hours record deleted successfully.',
        )
    );
}
```

## Testing

### Test 1: Get Working Hours (Staff with Existing Data)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Staff:', data.staff.full_name)
  console.log('Schedule:', data.schedule)
  // Should show days 1-7 with is_working and records
})
```

Expected: 7 days, days with records show is_working true

### Test 2: Get Working Hours (Staff with No Data)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/5/hours', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Schedule:', data.schedule)
  // Should show all 7 days as is_working: false
})
```

Expected: All days show is_working false, empty records arrays

### Test 3: Save Weekly Schedule
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    schedule: [
      {
        day_of_week: 1,
        is_working: true,
        start_time: '09:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        valid_from: null,
        valid_until: null
      },
      {
        day_of_week: 2,
        is_working: true,
        start_time: '09:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        valid_from: null,
        valid_until: null
      },
      {
        day_of_week: 3,
        is_working: true,
        start_time: '09:00',
        end_time: '17:00',
        break_start: null,
        break_end: null,
        valid_from: null,
        valid_until: null
      },
      {
        day_of_week: 6,
        is_working: false
      },
      {
        day_of_week: 7,
        is_working: false
      }
    ]
  })
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Message:', data.message)
  console.log('Schedule:', data.schedule)
})
```

Expected: 3 working days saved (Mon, Tue, Wed)

### Test 4: Add Exception - Day Off
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    specific_date: '2026-03-15',
    is_working: false,
    notes: 'Personal day off'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Exception created, staff unavailable on 2026-03-15

### Test 5: Add Exception - Special Hours
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    specific_date: '2026-12-24',
    is_working: true,
    start_time: '09:00',
    end_time: '13:00',
    break_start: null,
    break_end: null,
    notes: 'Christmas Eve - half day'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Exception created with special hours

### Test 6: Get Exceptions
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Exceptions:', data.exceptions)
})
```

Expected: List of both exceptions

### Test 7: Duplicate Exception Check
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    specific_date: '2026-03-15', // Duplicate
    is_working: false
  })
}).then(r => r.json()).then(console.log)
```

Expected: 409 error "Exception already exists for this date"

### Test 8: Delete Exception
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions/1', {
  method: 'DELETE',
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Expected: Success, exception removed

### Test 9: Verify Slot Generation Still Works
```javascript
// After saving working hours, check slots are generated correctly
fetch('/wp-json/bookit/v1/booking/slots?staff_id=1&service_id=1&date=2026-02-23', {
  headers: { 'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce },
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('Available slots:', data.slots)
  // Should respect working hours and break times
})
```

Expected: Slots only within working hours, no slots during break

### Test 10: Seasonal Schedule
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/1/hours', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    schedule: [
      {
        day_of_week: 1,
        is_working: true,
        start_time: '08:00',
        end_time: '16:00',
        break_start: '12:00',
        break_end: '13:00',
        valid_from: '2026-06-01',
        valid_until: '2026-08-31'
      }
    ]
  })
}).then(r => r.json()).then(console.log)
```

Expected: Summer hours saved for Monday only

## Database Verification

```sql
-- Check weekly schedule saved correctly
SELECT 
    staff_id,
    day_of_week,
    start_time,
    end_time,
    is_working,
    break_start,
    break_end,
    valid_from,
    valid_until
FROM wp_bookings_staff_working_hours
WHERE staff_id = 1
AND specific_date IS NULL
ORDER BY day_of_week;

-- Check exceptions saved correctly
SELECT 
    staff_id,
    specific_date,
    is_working,
    start_time,
    end_time,
    notes
FROM wp_bookings_staff_working_hours
WHERE staff_id = 1
AND specific_date IS NOT NULL
ORDER BY specific_date;
```

## Critical Notes

### DO NOT MODIFY class-datetime-model.php
The slot generation logic in `includes/models/class-datetime-model.php` is working correctly and must not be changed. The API endpoints save data in the exact format this model expects:
- day_of_week: 1-7 (ISO-8601)
- specific_date: NULL for recurring, date for exceptions
- start_time/end_time in H:i:s format
- is_working: 1 or 0
- break_start/break_end: nullable times
- valid_from/valid_until: nullable dates

### Data Format for Model Compatibility
The existing model `get_staff_availability()` checks:
1. specific_date first (exact match)
2. Falls back to day_of_week patterns
3. Respects valid_from/valid_until date ranges
4. Multiple rows per day are supported (split shifts)

Our API saves data in exactly this format so the model continues to work without modification.
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 10 scenarios** in console
2. **Save a weekly schedule** (Mon-Fri 9-5)
3. **Add a day off exception**
4. **Add special hours exception**
5. **Verify slot generation still works** (Test 9)
6. **Check database** with SQL queries

**Then say:** "Part A complete, ready for Part B"

I'll give you **Part B (Frontend Working Hours Page)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when done and tested!