Let me read the CSV file first.Clear picture. Four issues:

1. **Double-escaped quotes** — headers are wrapped in `\"\"` instead of clean `"` because the PHP is double-escaping
2. **Revenue values are integers** — `160` instead of `160.00`, and `16.666667` instead of `16.67`
3. **"Updated Women's Haircut" appears twice** — duplicate service rows, likely because the service was renamed and there are bookings under both the old and new name sharing the same `service_id`, or it's grouping by name rather than ID
4. **Missing section label** — no clear separation or label for the service breakdown section

Here's the Cursor prompt:

---

```
In `bookit-booking-system/includes/api/class-reports-api.php`, fix the `export_revenue_csv()` method. There are four issues to fix. Do not change any other method or file.

## Fix 1 — Double-escaped quotes in headers

The current implementation is producing `\"\"Date From\"\"` style output because PHP's fputcsv or manual quoting is being applied twice.

Replace the entire CSV building approach with PHP's built-in `fputcsv()` using an in-memory stream, which handles quoting correctly automatically:

```php
// Open in-memory stream.
$output = fopen( 'php://temp', 'r+' );

// Summary header row.
fputcsv( $output, array( 'Date From', 'Date To', 'Total Revenue', 'Deposits', 'Balance Payments', 'Refunds', 'Net Revenue' ) );

// Summary data row.
fputcsv( $output, array(
    $date_from,
    $date_to,
    number_format( (float) $summary['total_revenue'], 2, '.', '' ),
    number_format( (float) $summary['deposits'], 2, '.', '' ),
    number_format( (float) $summary['balance_payments'], 2, '.', '' ),
    number_format( (float) $summary['refunds'], 2, '.', '' ),
    number_format( (float) $summary['net_revenue'], 2, '.', '' ),
) );

// Blank line separator.
fputcsv( $output, array() );

// Service breakdown header.
fputcsv( $output, array( 'Service Name', 'Bookings', 'Total Revenue', 'Avg Price' ) );

// Service rows.
foreach ( $by_service as $row ) {
    fputcsv( $output, array(
        $row['service_name'],
        (int) $row['booking_count'],
        number_format( (float) $row['total_revenue'], 2, '.', '' ),
        number_format( (float) $row['avg_price'], 2, '.', '' ),
    ) );
}

// Read stream contents.
rewind( $output );
$csv_string = stream_get_contents( $output );
fclose( $output );
```

## Fix 2 — Revenue values formatted as integers or excessive decimals

Already resolved by the `number_format( (float) $value, 2, '.', '' )` calls in Fix 1 above. Ensure ALL monetary values use this format — `number_format( (float) $value, 2, '.', '' )` — including avg_price which was showing 6 decimal places.

## Fix 3 — Duplicate service rows ("Updated Women's Haircut" appears twice)

The `by_service` query in `get_revenue_report()` is grouping by `b.service_id, s.name`. If a service was renamed, the name change is reflected immediately in `s.name` so there should only be one row per service_id. The duplication is more likely caused by the query grouping by name text rather than ID, or by a JOIN producing multiple rows.

Find the `by_service` query and ensure it groups by `b.service_id` only (not by name):

```php
$by_service = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        b.service_id,
        MAX(s.name) AS service_name,
        COUNT(DISTINCT b.id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        CASE WHEN COUNT(DISTINCT b.id) > 0
             THEN COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT b.id)
             ELSE 0 END AS avg_price
     FROM {$wpdb->prefix}bookings b
     INNER JOIN {$wpdb->prefix}bookings_services s ON s.id = b.service_id
     LEFT JOIN {$wpdb->prefix}bookings_payments p
         ON p.booking_id = b.id AND p.payment_status = 'completed' AND p.payment_type != 'refund'
     WHERE b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL
       AND b.status != 'cancelled'
     GROUP BY b.service_id
     ORDER BY total_revenue DESC",
    $date_from, $date_to
), ARRAY_A );
```

Key change: `GROUP BY b.service_id` only (removed `s.name` from GROUP BY), and `MAX(s.name)` to get the current name. This guarantees one row per service regardless of name changes.

Apply the same fix to the `by_service` query inside `get_revenue_report()` (for the JSON response) AND inside `export_revenue_csv()` if it runs its own query. If `export_revenue_csv()` calls `get_revenue_report()` internally to get the data, the fix in `get_revenue_report()` is sufficient.

## Fix 4 — Add staff breakdown section to CSV

After the service breakdown, add a staff revenue section so the export is more complete:

```php
// Blank line separator.
fputcsv( $output, array() );

// Staff breakdown header.
fputcsv( $output, array( 'Staff Member', 'Bookings', 'Total Revenue', 'Avg per Booking' ) );

// Staff rows — use the same $by_staff data already retrieved in get_revenue_report().
foreach ( $by_staff as $row ) {
    fputcsv( $output, array(
        $row['staff_name'],
        (int) $row['booking_count'],
        number_format( (float) $row['total_revenue'], 2, '.', '' ),
        number_format( (float) $row['avg_per_booking'], 2, '.', '' ),
    ) );
}
```

Do not change any other logic, route, or file.
```

---

After applying, download a new CSV and verify: clean headers with single quotes, all monetary values to 2 decimal places, no duplicate service rows, and a staff section appended after services.