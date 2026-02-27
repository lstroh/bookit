Fix two issues in the Bookit Booking System test suite. Read each file fully before editing.

---

## Fix 1 — Rewrite test_overview_excludes_cancelled_bookings_from_total

In `bookit-booking-system/tests/unit/test-reports-api.php`, find and completely replace the `test_overview_excludes_cancelled_bookings_from_total` method with this simpler, more reliable version:
```php
/**
 * @covers Bookit_Reports_API::get_overview
 */
public function test_overview_excludes_cancelled_bookings_from_total() {
    // Create one cancelled and one completed booking for today.
    $cancelled_id        = $this->create_test_booking(
        array(
            'staff_id'     => $this->admin_id,
            'service_id'   => $this->service_one_id,
            'customer_id'  => $this->customer_id,
            'booking_date' => current_time( 'Y-m-d' ),
            'status'       => 'cancelled',
        )
    );
    $this->booking_ids[] = $cancelled_id;

    $completed_id        = $this->create_test_booking(
        array(
            'staff_id'     => $this->admin_id,
            'service_id'   => $this->service_one_id,
            'customer_id'  => $this->customer_id,
            'booking_date' => current_time( 'Y-m-d' ),
            'status'       => 'completed',
        )
    );
    $this->booking_ids[] = $completed_id;

    $this->login_as( $this->admin_id, 'admin' );
    $request  = new WP_REST_Request( 'GET', '/' . self::NAMESPACE . '/dashboard/reports/overview' );
    $response = rest_get_server()->dispatch( $request );
    $data     = $response->get_data();

    $this->assertEquals( 200, $response->get_status() );

    // Count directly from DB: non-cancelled bookings for today only.
    global $wpdb;
    $today         = current_time( 'Y-m-d' );
    $expected      = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
         WHERE booking_date = %s
           AND status != 'cancelled'
           AND deleted_at IS NULL",
        $today
    ) );

    // The API total for this_week must match the DB count exactly.
    $this->assertEquals( $expected, (int) $data['data']['this_week']['total_bookings'] );

    // Sanity check: expected must be at least 1 (our completed booking).
    $this->assertGreaterThanOrEqual( 1, $expected );
}
```

The key change: instead of comparing before/after snapshots (which is fragile due to REST server caching and other test data), we now query the DB directly for the ground truth count and assert the API matches it. This is deterministic regardless of what other test data exists.

---

## Fix 2 — Suppress CSV output during tests in class-reports-api.php and class-customers-api.php

The `rest_pre_serve_request` filter fires during PHPUnit test dispatches and calls `echo` and `header()`, producing output that pollutes the test runner.

### In `bookit-booking-system/includes/api/class-reports-api.php`

Find the `export_revenue_csv()` method. Find the `add_filter( 'rest_pre_serve_request', ... )` call. Replace the entire filter callback with this version that skips output during tests:
```php
add_filter(
    'rest_pre_serve_request',
    function( $served ) use ( $csv_string, $filename ) {
        if ( ! $served ) {
            // Skip headers and output during PHPUnit test runs to prevent
            // "Cannot modify header information" warnings and stdout pollution.
            if ( defined( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' ) || defined( 'WP_TESTS_DIR' ) ) {
                return true;
            }
            header( 'Content-Type: text/csv; charset=utf-8' );
            header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
            header( 'Cache-Control: no-cache, no-store, must-revalidate' );
            header( 'Content-Length: ' . strlen( $csv_string ) );
            echo $csv_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        }
        return true;
    }
);
```

### In `bookit-booking-system/includes/api/class-customers-api.php`

Find the `export_customers_csv()` method. Apply the identical change to its `add_filter( 'rest_pre_serve_request', ... )` callback — add the same test environment guard before the `header()` calls:
```php
add_filter(
    'rest_pre_serve_request',
    function( $served ) use ( $csv_string, $filename ) {
        if ( ! $served ) {
            if ( defined( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' ) || defined( 'WP_TESTS_DIR' ) ) {
                return true;
            }
            header( 'Content-Type: text/csv; charset=utf-8' );
            header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
            header( 'Cache-Control: no-cache, no-store, must-revalidate' );
            header( 'Content-Length: ' . strlen( $csv_string ) );
            echo $csv_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        }
        return true;
    }
);
```

Both constants (`WP_TESTS_PHPUNIT_POLYFILLS_PATH` and `WP_TESTS_DIR`) are defined in the test bootstrap, so this guard is reliable. The CSV export behaviour in production is completely unchanged.

Do not modify any other method or file.