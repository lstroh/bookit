Two separate bugs, both clear from the logs.

**Bug 1 — DB errors:** Cursor implemented the all-time null check as `( '' IS NULL OR booking_date BETWEEN '' AND '' )` instead of branching into two separate queries. `NULL` in PHP becomes an empty string `''` when interpolated into SQL, and MySQL rejects `''` as a DATE value. The fix is to use proper PHP `if/else` branching — one query with the date filter, one without.

**Bug 2 — No-shows not in chart:** The status value in the database is `no-show` (with a hyphen) but the query used `'no_show'` (with an underscore) in the `IN` clause. This is the same inconsistency that exists elsewhere in the codebase — the DB stores `no-show`, the Vue frontend sometimes displays `no_show`. The metrics queries need `'no-show'`.

Both fixes are in `class-reports-api.php` only. Here's the Cursor prompt:

---

```
In `bookit-booking-system/includes/api/class-reports-api.php`, fix the `get_period_metrics()` method. There are two bugs to fix. Do not change any other method or file.

## Bug 1 — All-time query uses empty string instead of NULL branching

The current implementation passes NULL date params into a single query using a construct like `( '' IS NULL OR booking_date BETWEEN '' AND '' )`. MySQL rejects empty string as a DATE value and throws database errors.

Replace the entire `get_period_metrics()` method with a proper PHP if/else branch — one set of queries when dates are provided, a separate set without any date filter for all-time.

The corrected method must work as follows:

```php
private function get_period_metrics( $date_from, $date_to ) {
    global $wpdb;

    $has_dates = ( null !== $date_from && null !== $date_to );

    // Total bookings (exclude cancelled).
    if ( $has_dates ) {
        $total_bookings = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status != 'cancelled'
               AND deleted_at IS NULL
               AND booking_date BETWEEN %s AND %s",
            $date_from, $date_to
        ) );
    } else {
        $total_bookings = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status != 'cancelled'
               AND deleted_at IS NULL"
        );
    }

    // Total revenue from completed payments.
    if ( $has_dates ) {
        $total_revenue = (float) $wpdb->get_var( $wpdb->prepare(
            "SELECT COALESCE(SUM(p.amount), 0)
             FROM {$wpdb->prefix}bookings_payments p
             INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
             WHERE p.payment_status = 'completed'
               AND b.deleted_at IS NULL
               AND b.booking_date BETWEEN %s AND %s",
            $date_from, $date_to
        ) );
    } else {
        $total_revenue = (float) $wpdb->get_var(
            "SELECT COALESCE(SUM(p.amount), 0)
             FROM {$wpdb->prefix}bookings_payments p
             INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
             WHERE p.payment_status = 'completed'
               AND b.deleted_at IS NULL"
        );
    }

    // No-show count.
    if ( $has_dates ) {
        $no_show_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status = 'no-show'
               AND deleted_at IS NULL
               AND booking_date BETWEEN %s AND %s",
            $date_from, $date_to
        ) );
    } else {
        $no_show_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status = 'no-show'
               AND deleted_at IS NULL"
        );
    }

    // Denominator for no-show rate.
    if ( $has_dates ) {
        $total_for_rate = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status IN ('completed', 'no-show', 'confirmed')
               AND deleted_at IS NULL
               AND booking_date BETWEEN %s AND %s",
            $date_from, $date_to
        ) );
    } else {
        $total_for_rate = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status IN ('completed', 'no-show', 'confirmed')
               AND deleted_at IS NULL"
        );
    }

    // Cancellation count.
    if ( $has_dates ) {
        $cancellation_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status = 'cancelled'
               AND deleted_at IS NULL
               AND booking_date BETWEEN %s AND %s",
            $date_from, $date_to
        ) );
    } else {
        $cancellation_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
             WHERE status = 'cancelled'
               AND deleted_at IS NULL"
        );
    }

    // Calculate rates.
    $no_show_rate      = $total_for_rate > 0
        ? round( ( $no_show_count / $total_for_rate ) * 100, 1 )
        : 0.0;

    $cancellation_denom = $total_bookings + $cancellation_count;
    $cancellation_rate  = $cancellation_denom > 0
        ? round( ( $cancellation_count / $cancellation_denom ) * 100, 1 )
        : 0.0;

    return array(
        'total_bookings'    => $total_bookings,
        'total_revenue'     => $total_revenue,
        'no_show_rate'      => $no_show_rate,
        'cancellation_rate' => $cancellation_rate,
    );
}
```

## Bug 2 — No-show status value is wrong

Anywhere in the file that references `'no_show'` (with an underscore) in a SQL query, change it to `'no-show'` (with a hyphen). This applies to the `get_period_metrics()` method above (already corrected) and also to `get_daily_revenue()` and `get_weekly_revenue()` if they filter by status.

Specifically — in `get_daily_revenue()` and `get_weekly_revenue()`, check whether the WHERE clause excludes cancelled bookings using `status != 'cancelled'`. That is correct and does not need changing. But if either method uses `'no_show'` anywhere, change it to `'no-show'`.

Do not change any other logic, method, or file.
```

---

After Cursor applies the fix, verify in `debug.log` that no more "Incorrect DATE value" errors appear when loading `/reports`, and check that the no-show rate card shows a non-zero value matching what you see in the Bookings page.