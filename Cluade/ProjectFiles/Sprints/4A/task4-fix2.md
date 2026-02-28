Found it. Look at rows 13, 14, and 17 in your database — the status is `no_show` (underscore), not `no-show` (hyphen). The database is inconsistent. Some bookings were created with `no_show` and some with `no-show`.

This means the fix we applied earlier (`'no-show'` with a hyphen in the SQL) only catches half the data. The real fix needs to handle both values — but more importantly, the root cause is that the codebase has two different strings for the same status, which will cause problems everywhere (reports, filters, status badges etc).

Before writing any fix, let me check where `no_show` vs `no-show` is defined across the codebase.That confirms everything. The architecture document defines the status as `no_show` (underscore), but `mark_booking_no_show()` writes `no_show` to the database while the reports query was looking for `no-show` (hyphen). The Vue frontend also uses `no_show`. So **`no_show` with an underscore is the correct canonical value** — the hyphenated version in the reports query was wrong.

Your existing database rows with `no_show` are correct. The rows that show `no-show` were created before the dedicated endpoint existed, likely via the `update_booking()` PUT endpoint where someone typed `no-show` manually in the status dropdown.

There are two things to fix:

1. **Immediate** — update the reports SQL to query for both values during the transition period, then canonicalise the dirty data
2. **Data fix** — update the existing `no-show` rows in the database to `no_show`

Here's the Cursor prompt for the code fix, plus a one-line SQL query to run manually to clean the dirty data:

---

**Step 1 — Run this SQL directly in Adminer/TablePlus to fix the dirty data:**

```sql
UPDATE wp_bookings SET status = 'no_show' WHERE status = 'no-show';
UPDATE wp_bookings_status_log SET old_status = 'no_show' WHERE old_status = 'no-show';
UPDATE wp_bookings_status_log SET new_status = 'no_show' WHERE new_status = 'no-show';
```

---

**Step 2 — Cursor prompt to fix the code so `no-show` can never be written again:**

```
In `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`, make the following targeted fixes. Do not change any other logic or file.

## Fix 1 — mark_booking_no_show() writes the wrong status value

Find the `$wpdb->update()` call inside `mark_booking_no_show()` that sets `'status' => 'no-show'`. 
Change `'no-show'` to `'no_show'`.

Also find the status log INSERT in the same method where `'new_status' => 'no-show'` is set.
Change that to `'new_status' => 'no_show'`.

## Fix 2 — already_no_show check uses inconsistent value

Find this line in `mark_booking_no_show()`:
```php
if ( 'no_show' === $booking['status'] ) {
```
This is already correct — confirm it reads `'no_show'` (underscore) and leave it unchanged.

## Fix 3 — update_booking() status validation allows 'no-show' with hyphen

Find the `validate_callback` for the `status` argument in the `update_booking` route registration. It contains an array of valid statuses. Change `'no_show'` or `'no-show'` so the array contains ONLY `'no_show'` (underscore). Remove whichever variant is wrong. The valid statuses array should be:
```php
array( 'pending', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show' )
```

## Fix 4 — Reports API queries must use 'no_show' (underscore)

In `bookit-booking-system/includes/api/class-reports-api.php`, find every occurrence of `'no-show'` in SQL query strings inside `get_period_metrics()`, `get_daily_revenue()`, and `get_weekly_revenue()`. Change all of them to `'no_show'`.

Do not change any other logic.
```

---

After applying both the SQL data fix and the code fix, reload the Reports Overview page — the no-show rate card should now reflect your three no-show bookings. Also verify in the Bookings list that marking a new booking as no-show still works correctly and writes `no_show` to the database.