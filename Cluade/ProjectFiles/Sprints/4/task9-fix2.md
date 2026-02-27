The error is clear — the `create_test_booking()` helper always uses `10:00:00` as `start_time`, so when the test creates both a cancelled and a completed booking for the same staff member on the same date, the second insert hits the `unique_booking_slot` constraint on `(staff_id, booking_date, start_time)`. The completed booking fails to insert, leaving count = 0.Confirmed. The fix is simple — the test needs to use different `start_time` values for the two bookings so they don't collide on the unique constraint.

---

```
In `bookit-booking-system/tests/unit/test-reports-api.php`, find the `test_overview_excludes_cancelled_bookings_from_total` method and make one targeted change only.

The two `create_test_booking()` calls both use the same staff_id and booking_date (today), and the helper defaults both to start_time = '10:00:00'. This hits the unique_booking_slot constraint (staff_id, booking_date, start_time) on the second insert, causing it to silently fail and return 0.

Fix: give each booking a distinct start_time. Change the cancelled booking to use start_time '10:00:00' and the completed booking to use start_time '11:00:00'. Add end_time accordingly.

The two create_test_booking() calls must look like this:

```php
$cancelled_id        = $this->create_test_booking(
    array(
        'staff_id'     => $this->admin_id,
        'service_id'   => $this->service_one_id,
        'customer_id'  => $this->customer_id,
        'booking_date' => current_time( 'Y-m-d' ),
        'start_time'   => '10:00:00',
        'end_time'     => '11:00:00',
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
        'start_time'   => '11:00:00',
        'end_time'     => '12:00:00',
        'status'       => 'completed',
    )
);
$this->booking_ids[] = $completed_id;
```

Do not change anything else in the file.
```

---

While you're at it, it's worth noting that `test_overview_this_week_counts_completed_bookings` and `test_overview_no_show_rate_uses_no_show_status` also both insert bookings at `10:00:00` for today using the same `admin_id`. These tests run sequentially and each test's tearDown cleans up, so they're fine in isolation — but if tearDown ever fails mid-run you'd see the same collision there too. For now the single fix above is all that's needed to get to zero failures.