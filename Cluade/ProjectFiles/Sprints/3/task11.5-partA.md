# 🚀 TASK 11.5: BULK WORKING HOURS MANAGEMENT

Let's build the bulk operations feature so admins can manage working hours for multiple staff at once!

---

## 📋 TASK 11.5 OVERVIEW

**Estimated Time:** 4-5 hours

**What We're Building:**
1. **Bulk Hours Management Page** - Central hub for bulk operations
2. **Add Exception to Multiple Staff** - Same day off/special hours for selected staff
3. **Update Schedule for Multiple Staff** - Change break times, working hours in bulk
4. **Staff Selection** - Checkboxes to select which staff to apply changes
5. **Conflict Resolution** - Show existing exceptions, ask per staff whether to overwrite
6. **Preview Changes** - Confirm before applying

**Parts:**
- **Part A:** Backend API (bulk operations, conflict detection) - 2h
- **Part B:** Bulk Hours Management Page (staff selection, operations) - 2-3h

---

# 📝 TASK 11.5 PART A: BACKEND BULK OPERATIONS API

```markdown
# Task 11.5 Part A: Bulk Working Hours Backend API

## Context
Task 11 complete. Working hours system (Task 10) in place with:
- Weekly recurring schedules (day_of_week)
- Date exceptions (specific_date)
- Individual staff management working perfectly

Now we need bulk operations API to manage multiple staff at once:
- Add same exception to multiple staff (e.g., all staff off Easter Monday)
- Update schedule for multiple staff (e.g., change lunch break time)
- Check for conflicts (existing exceptions on same date)
- Preview before apply

## Database Tables Used

Already exist from Task 10:
- `wp_bookings_staff` - Staff members
- `wp_bookings_staff_working_hours` - Working hours and exceptions

## Requirements

### 1. Add Bulk Operations Routes

Add to `register_routes()` in `includes/api/class-dashboard-bookings-api.php`:

```php
// Check for conflicts before bulk operation
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/bulk-hours/check-conflicts',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'check_bulk_conflicts' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'staff_ids' => array(
                'required'          => true,
                'type'              => 'array',
                'sanitize_callback' => function( $param ) {
                    return is_array( $param ) ? array_map( 'intval', $param ) : array();
                },
            ),
            'specific_date' => array(
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'day_of_week' => array(
                'type' => 'integer',
            ),
        ),
    )
);

// Add exception to multiple staff
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/bulk-hours/add-exception',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'bulk_add_exception' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'staff_ids' => array(
                'required'          => true,
                'type'              => 'array',
                'sanitize_callback' => function( $param ) {
                    return is_array( $param ) ? array_map( 'intval', $param ) : array();
                },
            ),
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
            'overwrite_conflicts' => array(
                'type'              => 'array',
                'sanitize_callback' => function( $param ) {
                    return is_array( $param ) ? array_map( 'intval', $param ) : array();
                },
            ),
        ),
    )
);

// Update schedule for multiple staff
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/bulk-hours/update-schedule',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'bulk_update_schedule' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'staff_ids' => array(
                'required'          => true,
                'type'              => 'array',
                'sanitize_callback' => function( $param ) {
                    return is_array( $param ) ? array_map( 'intval', $param ) : array();
                },
            ),
            'day_of_week' => array(
                'required' => true,
                'type'     => 'integer',
            ),
            'updates' => array(
                'required'          => true,
                'type'              => 'object',
                'sanitize_callback' => function( $param ) {
                    return is_array( $param ) ? $param : array();
                },
            ),
        ),
    )
);
```

### 2. Add Check Conflicts Method

```php
/**
 * Check for conflicts before bulk operation
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function check_bulk_conflicts( $request ) {
    global $wpdb;

    $staff_ids     = $request->get_param( 'staff_ids' );
    $specific_date = $request->get_param( 'specific_date' );
    $day_of_week   = $request->get_param( 'day_of_week' );

    if ( empty( $staff_ids ) ) {
        return rest_ensure_response(
            array(
                'success'   => true,
                'conflicts' => array(),
            )
        );
    }

    $conflicts = array();

    if ( $specific_date ) {
        // Check for existing exceptions on this date
        $placeholders = implode( ',', array_fill( 0, count( $staff_ids ), '%d' ) );
        
        $existing = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    h.staff_id,
                    h.id as exception_id,
                    h.specific_date,
                    h.is_working,
                    h.start_time,
                    h.end_time,
                    h.notes,
                    s.first_name,
                    s.last_name
                FROM {$wpdb->prefix}bookings_staff_working_hours h
                INNER JOIN {$wpdb->prefix}bookings_staff s ON h.staff_id = s.id
                WHERE h.staff_id IN ($placeholders)
                AND h.specific_date = %s",
                array_merge( $staff_ids, array( $specific_date ) )
            ),
            ARRAY_A
        );

        foreach ( $existing as $row ) {
            $conflicts[] = array(
                'staff_id'       => (int) $row['staff_id'],
                'staff_name'     => $row['first_name'] . ' ' . $row['last_name'],
                'exception_id'   => (int) $row['exception_id'],
                'specific_date'  => $row['specific_date'],
                'is_working'     => (bool) $row['is_working'],
                'start_time'     => $row['start_time'],
                'end_time'       => $row['end_time'],
                'notes'          => $row['notes'],
                'conflict_type'  => 'exception',
            );
        }
    }

    return rest_ensure_response(
        array(
            'success'   => true,
            'conflicts' => $conflicts,
        )
    );
}
```

### 3. Add Bulk Add Exception Method

```php
/**
 * Add exception to multiple staff
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function bulk_add_exception( $request ) {
    global $wpdb;

    $staff_ids           = $request->get_param( 'staff_ids' );
    $specific_date       = $request->get_param( 'specific_date' );
    $is_working          = filter_var( $request->get_param( 'is_working' ), FILTER_VALIDATE_BOOLEAN );
    $overwrite_conflicts = $request->get_param( 'overwrite_conflicts' ) ?: array();

    // Validate date
    if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $specific_date ) ) {
        return new WP_Error(
            'invalid_date',
            'Invalid date format. Use Y-m-d.',
            array( 'status' => 400 )
        );
    }

    // Prepare time fields
    $start_time  = null;
    $end_time    = null;
    $break_start = null;
    $break_end   = null;
    $notes       = $request->get_param( 'notes' ) ? sanitize_textarea_field( $request->get_param( 'notes' ) ) : null;

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

    $added   = 0;
    $skipped = 0;
    $results = array();

    foreach ( $staff_ids as $staff_id ) {
        // Check if exception already exists
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}bookings_staff_working_hours
                WHERE staff_id = %d AND specific_date = %s",
                $staff_id,
                $specific_date
            )
        );

        if ( $existing ) {
            // Conflict exists - check if we should overwrite
            if ( in_array( $staff_id, $overwrite_conflicts ) ) {
                // Delete existing, then insert new
                $wpdb->delete(
                    $wpdb->prefix . 'bookings_staff_working_hours',
                    array( 'id' => $existing ),
                    array( '%d' )
                );
            } else {
                // Skip this staff
                $skipped++;
                $results[] = array(
                    'staff_id' => $staff_id,
                    'status'   => 'skipped',
                    'reason'   => 'conflict',
                );
                continue;
            }
        }

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

        if ( false !== $result ) {
            $added++;
            $results[] = array(
                'staff_id' => $staff_id,
                'status'   => 'added',
            );
        } else {
            $results[] = array(
                'staff_id' => $staff_id,
                'status'   => 'failed',
            );
        }
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => sprintf( 
                'Exception added to %d staff member(s). %d skipped due to conflicts.', 
                $added, 
                $skipped 
            ),
            'added'   => $added,
            'skipped' => $skipped,
            'results' => $results,
        )
    );
}
```

### 4. Add Bulk Update Schedule Method

```php
/**
 * Update schedule for multiple staff
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function bulk_update_schedule( $request ) {
    global $wpdb;

    $staff_ids   = $request->get_param( 'staff_ids' );
    $day_of_week = (int) $request->get_param( 'day_of_week' );
    $updates     = $request->get_param( 'updates' );

    // Validate day_of_week
    if ( $day_of_week < 1 || $day_of_week > 7 ) {
        return new WP_Error(
            'invalid_day',
            'Day of week must be between 1 (Monday) and 7 (Sunday).',
            array( 'status' => 400 )
        );
    }

    if ( empty( $updates ) ) {
        return new WP_Error(
            'no_updates',
            'No updates provided.',
            array( 'status' => 400 )
        );
    }

    $updated = 0;
    $results = array();

    foreach ( $staff_ids as $staff_id ) {
        // Get existing schedule for this day
        $existing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bookings_staff_working_hours
                WHERE staff_id = %d 
                AND day_of_week = %d 
                AND specific_date IS NULL
                LIMIT 1",
                $staff_id,
                $day_of_week
            ),
            ARRAY_A
        );

        if ( ! $existing ) {
            $results[] = array(
                'staff_id' => $staff_id,
                'status'   => 'skipped',
                'reason'   => 'no_schedule',
            );
            continue;
        }

        // Build update data
        $update_data   = array();
        $update_format = array();

        // Update fields that are provided
        $allowed_fields = array(
            'start_time'  => '%s',
            'end_time'    => '%s',
            'break_start' => '%s',
            'break_end'   => '%s',
            'is_working'  => '%d',
        );

        foreach ( $allowed_fields as $field => $format ) {
            if ( isset( $updates[ $field ] ) ) {
                $value = $updates[ $field ];
                
                if ( $field === 'is_working' ) {
                    $update_data[ $field ] = filter_var( $value, FILTER_VALIDATE_BOOLEAN ) ? 1 : 0;
                } else {
                    $value = sanitize_text_field( $value );
                    // Ensure seconds for time fields
                    if ( in_array( $field, array( 'start_time', 'end_time', 'break_start', 'break_end' ) ) && strlen( $value ) === 5 ) {
                        $value .= ':00';
                    }
                    $update_data[ $field ] = $value;
                }
                
                $update_format[] = $format;
            }
        }

        if ( empty( $update_data ) ) {
            continue;
        }

        // Perform update
        $result = $wpdb->update(
            $wpdb->prefix . 'bookings_staff_working_hours',
            $update_data,
            array(
                'staff_id'    => $staff_id,
                'day_of_week' => $day_of_week,
            ),
            $update_format,
            array( '%d', '%d' )
        );

        if ( false !== $result ) {
            $updated++;
            $results[] = array(
                'staff_id' => $staff_id,
                'status'   => 'updated',
            );
        } else {
            $results[] = array(
                'staff_id' => $staff_id,
                'status'   => 'failed',
            );
        }
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => sprintf( 'Schedule updated for %d staff member(s).', $updated ),
            'updated' => $updated,
            'results' => $results,
        )
    );
}
```

## Testing

### Test 1: Check Conflicts (No Conflicts)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/check-conflicts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    specific_date: '2026-12-25'
  })
}).then(r => r.json()).then(data => {
  console.log('Conflicts:', data.conflicts)
  console.log('Count:', data.conflicts.length) // Should be 0 if no conflicts
})
```

Expected: Empty conflicts array

### Test 2: Check Conflicts (With Conflicts)
```javascript
// First add an exception for staff 1 on 2026-03-20
    fetch('/wp-json/bookit/v1/dashboard/staff/1/hours/exceptions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
    },
    credentials: 'include',
    body: JSON.stringify({
        specific_date: '2026-03-20',
        is_working: false,
        notes: 'Existing day off'
    })
    }).then(r => r.json()).then(() => {
    // Now check conflicts
    return fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/check-conflicts', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
        },
        credentials: 'include',
        body: JSON.stringify({
        staff_ids: [1, 3],
        specific_date: '2026-03-20'
        })
    })
    }).then(r => r.json()).then(data => {
    console.log('Conflicts:', data.conflicts)
    console.log('Staff 1 conflict:', data.conflicts.find(c => c.staff_id === 1))
    })
```

Expected: 1 conflict for staff 1, showing existing exception details

### Test 3: Bulk Add Exception (No Conflicts)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/add-exception', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    specific_date: '2026-04-18', // Good Friday
    is_working: false,
    notes: 'Bank Holiday - Good Friday'
  })
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Message:', data.message)
  console.log('Added:', data.added)
  console.log('Skipped:', data.skipped)
})
```

Expected: Success, added to 2 staff, 0 skipped

### Test 4: Bulk Add Exception (With Conflict, No Overwrite)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/add-exception', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    specific_date: '2026-03-20', // Staff 1 already has exception here
    is_working: false,
    notes: 'Bank Holiday',
    overwrite_conflicts: [] // Don't overwrite
  })
}).then(r => r.json()).then(data => {
  console.log('Added:', data.added) // Should be 1 (only staff 3)
  console.log('Skipped:', data.skipped) // Should be 1 (staff 1 skipped)
  console.log('Results:', data.results)
})
```

Expected: 1 added, 1 skipped (staff 1 skipped due to conflict)

### Test 5: Bulk Add Exception (With Conflict, Overwrite)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/add-exception', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    specific_date: '2026-03-20',
    is_working: true,
    start_time: '09:00',
    end_time: '13:00',
    notes: 'Half day - overwritten',
    overwrite_conflicts: [1] // Overwrite staff 1's existing exception
  })
}).then(r => r.json()).then(data => {
  console.log('Added:', data.added) // Should be 2
  console.log('Skipped:', data.skipped) // Should be 0
})
```

Expected: 2 added, 0 skipped (staff 1's exception overwritten)

### Test 6: Bulk Update Schedule (Change Break Time)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/update-schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    day_of_week: 1, // Monday
    updates: {
      break_start: '13:00',
      break_end: '14:00'
    }
  })
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success)
  console.log('Updated:', data.updated)
  console.log('Results:', data.results)
})
```

Expected: 2 staff updated with new break times

### Test 7: Bulk Update Schedule (Change Working Hours)
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/update-schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    day_of_week: 5, // Friday
    updates: {
      start_time: '09:00',
      end_time: '14:00' // Early finish on Fridays
    }
  })
}).then(r => r.json()).then(data => {
  console.log('Updated:', data.updated)
})
```

Expected: Friday hours updated for selected staff

### Test 8: Verify in Database
```sql
-- Check bulk exception was added
SELECT 
    staff_id,
    specific_date,
    is_working,
    notes
FROM wp_bookings_staff_working_hours
WHERE specific_date = '2026-04-18'
ORDER BY staff_id;

-- Check schedule update worked
SELECT 
    staff_id,
    day_of_week,
    break_start,
    break_end
FROM wp_bookings_staff_working_hours
WHERE day_of_week = 1 -- Monday
AND specific_date IS NULL
ORDER BY staff_id;
```

Expected: Changes reflected correctly in database

### Test 9: Special Hours Exception
```javascript
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/add-exception', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1, 3],
    specific_date: '2026-12-24', // Christmas Eve
    is_working: true,
    start_time: '09:00',
    end_time: '13:00',
    break_start: null,
    break_end: null,
    notes: 'Christmas Eve - half day'
  })
}).then(r => r.json()).then(console.log)
```

Expected: Special hours exception added for both staff

### Test 10: Admin-Only Access
```javascript
// Log in as non-admin staff
// Try to access bulk operations
fetch('/wp-json/bookit/v1/dashboard/staff/bulk-hours/add-exception', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce
  },
  credentials: 'include',
  body: JSON.stringify({
    staff_ids: [1],
    specific_date: '2026-05-01',
    is_working: false
  })
}).then(r => r.json()).then(console.log)
```

Expected: 403 Forbidden (admin-only)

## Notes

- All bulk operations are admin-only
- Conflict detection shows existing exceptions with full details
- Overwrite is explicit (admin chooses which staff to overwrite)
- Skipped staff reported in results
- Bulk update only updates existing schedules (doesn't create new)
- Staff without schedule for that day are skipped
- Can update multiple fields at once (start, end, break times)
- Date validation (Y-m-d format)
- Time validation (ensures :00 seconds)
- Results array shows status per staff (added/skipped/failed)
```

---

## ⏸️ PAUSE AFTER PART A

**After implementing Part A:**

1. **Test all 10 scenarios** in console
2. **Verify conflict detection** works
3. **Test bulk add** with and without conflicts
4. **Test bulk update** on multiple staff
5. **Check database** changes
6. **Verify admin-only** access

**Then say:** "Part A complete, ready for Part B!"

I'll give you **Part B (Bulk Hours Management Page)** next! 🚀

---

**Apply this Part A prompt now!** Let me know when it's done and tested!