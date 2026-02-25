Two issues remain — the double-escaping is still happening (Fix 1 didn't apply correctly), and the duplicate service row is still there (Fix 3 didn't apply).

The double-escaping tells me Cursor is still building the CSV manually as a string rather than using `fputcsv()` with a memory stream. The fix needs to be more explicit about completely replacing the old string-building code.

Here's a more forceful prompt:

---

```
In `bookit-booking-system/includes/api/class-reports-api.php`, completely rewrite the `export_revenue_csv()` method from scratch. Delete the entire existing method body and replace it with the implementation below. Do not keep any existing CSV-building code from the current implementation — it is all being discarded.

Also fix the `by_service` query in `get_revenue_report()` as described at the bottom.

---

## Complete replacement for `export_revenue_csv()` method body:

```php
public function export_revenue_csv( $request ) {
    global $wpdb;

    $tz  = new DateTimeZone( 'Europe/London' );
    $now = new DateTimeImmutable( 'now', $tz );

    $date_from = $request->get_param( 'date_from' );
    $date_to   = $request->get_param( 'date_to' );

    if ( empty( $date_from ) ) {
        $date_from = $now->format( 'Y-m-01' );
    }
    if ( empty( $date_to ) ) {
        $date_to = $now->format( 'Y-m-d' );
    }

    // --- Summary metrics ---
    $total_revenue = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(p.amount), 0)
         FROM {$wpdb->prefix}bookings_payments p
         INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
         WHERE p.payment_status = 'completed'
           AND p.payment_type != 'refund'
           AND b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL",
        $date_from, $date_to
    ) );

    $deposits = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(p.amount), 0)
         FROM {$wpdb->prefix}bookings_payments p
         INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
         WHERE p.payment_status = 'completed'
           AND p.payment_type = 'deposit'
           AND b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL",
        $date_from, $date_to
    ) );

    $balance_payments = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(p.amount), 0)
         FROM {$wpdb->prefix}bookings_payments p
         INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
         WHERE p.payment_status = 'completed'
           AND p.payment_type = 'full_payment'
           AND b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL",
        $date_from, $date_to
    ) );

    $refunds = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT COALESCE(SUM(p.refund_amount), 0)
         FROM {$wpdb->prefix}bookings_payments p
         INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
         WHERE p.payment_status IN ('refunded', 'partially_refunded')
           AND b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL",
        $date_from, $date_to
    ) );

    $net_revenue = $total_revenue - $refunds;

    // --- By service ---
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
             ON p.booking_id = b.id
             AND p.payment_status = 'completed'
             AND p.payment_type != 'refund'
         WHERE b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL
           AND b.status != 'cancelled'
         GROUP BY b.service_id
         ORDER BY total_revenue DESC",
        $date_from, $date_to
    ), ARRAY_A );

    // --- By staff ---
    $by_staff = $wpdb->get_results( $wpdb->prepare(
        "SELECT
            CONCAT(st.first_name, ' ', st.last_name) AS staff_name,
            COUNT(DISTINCT b.id) AS booking_count,
            COALESCE(SUM(p.amount), 0) AS total_revenue,
            CASE WHEN COUNT(DISTINCT b.id) > 0
                 THEN COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT b.id)
                 ELSE 0 END AS avg_per_booking
         FROM {$wpdb->prefix}bookings b
         INNER JOIN {$wpdb->prefix}bookings_staff st ON st.id = b.staff_id
         LEFT JOIN {$wpdb->prefix}bookings_payments p
             ON p.booking_id = b.id
             AND p.payment_status = 'completed'
             AND p.payment_type != 'refund'
         WHERE b.booking_date BETWEEN %s AND %s
           AND b.deleted_at IS NULL
           AND b.status != 'cancelled'
         GROUP BY b.staff_id
         ORDER BY total_revenue DESC",
        $date_from, $date_to
    ), ARRAY_A );

    // --- Build CSV using fputcsv into memory stream ---
    // fputcsv handles all quoting automatically — do NOT manually add quotes.
    $stream = fopen( 'php://temp', 'r+' );

    // Summary section.
    fputcsv( $stream, array( 'Date From', 'Date To', 'Total Revenue', 'Deposits', 'Balance Payments', 'Refunds', 'Net Revenue' ) );
    fputcsv( $stream, array(
        $date_from,
        $date_to,
        number_format( $total_revenue,    2, '.', '' ),
        number_format( $deposits,         2, '.', '' ),
        number_format( $balance_payments, 2, '.', '' ),
        number_format( $refunds,          2, '.', '' ),
        number_format( $net_revenue,      2, '.', '' ),
    ) );

    // Blank line.
    fputcsv( $stream, array( '' ) );

    // Service section.
    fputcsv( $stream, array( 'Service Name', 'Bookings', 'Total Revenue', 'Avg Price' ) );
    foreach ( $by_service as $row ) {
        fputcsv( $stream, array(
            $row['service_name'],
            (int) $row['booking_count'],
            number_format( (float) $row['total_revenue'], 2, '.', '' ),
            number_format( (float) $row['avg_price'],     2, '.', '' ),
        ) );
    }

    // Blank line.
    fputcsv( $stream, array( '' ) );

    // Staff section.
    fputcsv( $stream, array( 'Staff Member', 'Bookings', 'Total Revenue', 'Avg per Booking' ) );
    foreach ( $by_staff as $row ) {
        fputcsv( $stream, array(
            $row['staff_name'],
            (int) $row['booking_count'],
            number_format( (float) $row['total_revenue'],   2, '.', '' ),
            number_format( (float) $row['avg_per_booking'], 2, '.', '' ),
        ) );
    }

    // Read stream into string.
    rewind( $stream );
    $csv_string = stream_get_contents( $stream );
    fclose( $stream );

    // Return as downloadable CSV response.
    $filename = 'revenue-report-' . $date_from . '-to-' . $date_to . '.csv';
    $response = new WP_REST_Response( $csv_string );
    $response->header( 'Content-Type', 'text/csv; charset=utf-8' );
    $response->header( 'Content-Disposition', 'attachment; filename="' . $filename . '"' );
    return $response;
}
```

## Also fix `get_revenue_report()` — duplicate service rows

Find the `$by_service` query inside `get_revenue_report()` (the JSON endpoint, not the CSV export). Change `GROUP BY b.service_id, s.name` to `GROUP BY b.service_id` and wrap the name in `MAX(s.name) AS service_name`. The corrected query must match exactly the `$by_service` query shown in the `export_revenue_csv()` method above.

Do not change anything else in the file.
```

---

The key difference in this prompt is explicitly telling Cursor to **delete the existing method body entirely** and replace it wholesale, rather than trying to patch it. The previous prompt left room for Cursor to keep parts of the old string-building code alongside the new `fputcsv` code, which caused the double-escaping to persist.