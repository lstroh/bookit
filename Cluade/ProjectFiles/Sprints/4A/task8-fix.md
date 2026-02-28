Great catch — this is a real issue. Let me think through what's happening.

When you deleted the customer, the anonymisation correctly set their name to "Deleted Customer" and email to `deleted_X@deleted.invalid`. But the booking is probably disappearing from the Bookings list because the list query does an `INNER JOIN` to `wp_bookings_customers`, and the anonymised customer record either got filtered out somewhere, or the UI is hiding rows where the customer name looks like system data.

The booking record itself should still be in `wp_bookings` — the deletion code doesn't touch that table. Let me verify quickly.Good — confirmed. The bookings query uses `LEFT JOIN` on customers (in `class-booking-retriever.php`), so the booking record itself is safe. The issue is almost certainly in `class-dashboard-bookings-api.php`'s `get_bookings()` method — it likely uses `INNER JOIN` on customers, which would exclude anonymised customers whose `deleted_at` is set if there's a `WHERE c.deleted_at IS NULL` filter.

To answer your question directly: **yes, preserving the booking is the legally correct behaviour** — UK HMRC requires 7 years of financial records. But the booking disappearing from the admin view is a bug. The admin needs to be able to see those bookings, just with "Deleted Customer" shown in place of the real name.

Here's the fix:

---

```
In `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`, find the `get_bookings()` method.

There are two things to fix:

## Fix 1 — Change INNER JOIN to LEFT JOIN for customers

Find the JOIN between wp_bookings and wp_bookings_customers in the main bookings query. If it reads:
```sql
INNER JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
```
Change it to:
```sql
LEFT JOIN {$wpdb->prefix}bookings_customers c ON b.customer_id = c.id
```
This ensures bookings for anonymised/deleted customers still appear in results.

## Fix 2 — Remove any WHERE filter that excludes deleted customers

Find any WHERE clause condition like `AND c.deleted_at IS NULL` that filters out deleted customer records. Remove it. The customer's deletion status should not affect whether their historical bookings appear.

## Fix 3 — Handle NULL customer fields gracefully in format_booking()

Find the `format_booking()` method (or wherever customer_name is assembled from first_name + last_name). Ensure it handles NULL values safely:

```php
$customer_first = $booking['customer_first_name'] ?? '';
$customer_last  = $booking['customer_last_name'] ?? '';
$customer_name  = trim( $customer_first . ' ' . $customer_last );

// If name is empty (anonymised customer), show a clear label.
if ( empty( $customer_name ) ) {
    $customer_name = __( 'Deleted Customer', 'bookit-booking-system' );
}
$booking['customer_name'] = $customer_name;
```

Apply the same null-safe handling to `customer_email` and `customer_phone`:
```php
$booking['customer_email'] = $booking['customer_email'] ?? '';
$booking['customer_phone'] = $booking['customer_phone'] ?? '';
```

Do not change any other logic or file.
```

---

After this fix, deleted customer bookings will reappear in the Bookings list showing "Deleted Customer" in the name column, with no email or phone. The booking details, service, staff, date, time, and payment amounts are all preserved — which is exactly what HMRC requires for the 7-year retention period. Admins can still filter, view, and report on these bookings normally.