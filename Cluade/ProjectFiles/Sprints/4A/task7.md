Task 7! Let me read the files I need first.Good — I have everything I need. The requirements doc is detailed on the drill-down. Note that ratings and customer feedback are Phase 2 (requires surveys), and utilisation calculation requires comparing booked slots against total available slots which is complex — I'll implement a simplified version based on completed bookings vs total non-cancelled bookings. The time-off tab was also committed in the earlier planning decision.

---

```
Sprint 4A Progress: 6/10 tasks complete

✅ Task 1–6 complete
⏭️ Task 7:  Staff Performance Report (10h)  — NEXT
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 72 / 112
```

---

## Task 7 — Cursor Composer Prompt

```
You are implementing Task 7 of Sprint 4A for the Bookit Booking System WordPress plugin: Staff Performance Report.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/api/class-reports-api.php` — add new routes and methods here only
- `bookit-booking-system/database/schema.sql` — wp_bookings, wp_bookings_staff, wp_bookings_staff_working_hours, wp_bookings_payments columns
- `bookit-booking-system/database/migrations/migration-add-staff-working-hours.php` — understand the working hours table structure (specific_date, is_working, day_of_week)
- `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue` — import and reuse
- `bookit-booking-system/dashboard/src/views/RevenueReport.vue` — copy loading/error/table sort patterns
- `bookit-booking-system/dashboard/src/router/index.js` — add one new route for staff detail
- `bookit-booking-system/dashboard/src/views/StaffPerformance.vue` — replace stub entirely

### What already exists — do NOT duplicate:
- `check_admin_permission()` — already in class-reports-api.php
- `DateRangeSelector.vue` — already exists, import it
- Chart.js Bar already registered — confirm import, add Line if not already imported in this file
- No `/reports/staff/:id` route exists yet — add it
- `StaffPerformance.vue` stub — replace entirely

---

## PART A — BACKEND: Add to `class-reports-api.php`

### Add to `register_routes()`:

```
GET /dashboard/reports/staff
  permission_callback: check_admin_permission
  args:
    date_from: optional, YYYY-MM-DD, default = first day of current month
    date_to:   optional, YYYY-MM-DD, default = today

GET /dashboard/reports/staff/(?P<staff_id>\d+)
  permission_callback: check_admin_permission
  args:
    date_from: optional, YYYY-MM-DD
    date_to:   optional, YYYY-MM-DD
    staff_id:  required, integer (from URL)
```

### Add method `get_staff_performance( $request )`:

Parse date params. Default: first day of current month to today (Europe/London).

**For each active staff member, calculate:**

```php
$staff_list = $wpdb->get_results(
    "SELECT id, first_name, last_name, title, photo_url, created_at
     FROM {$wpdb->prefix}bookings_staff
     WHERE deleted_at IS NULL AND is_active = 1
     ORDER BY first_name ASC",
    ARRAY_A
);
```

For each staff member, run these queries using the date range:

```php
// Bookings in period (non-cancelled).
$bookings = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d AND status != 'cancelled'
       AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $staff_id, $date_from, $date_to
) );

// Completed bookings.
$completed = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d AND status = 'completed'
       AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $staff_id, $date_from, $date_to
) );

// No-show count.
$no_shows = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d AND status = 'no_show'
       AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $staff_id, $date_from, $date_to
) );

// Revenue for period.
$revenue = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE b.staff_id = %d
       AND p.payment_status = 'completed'
       AND p.payment_type != 'refund'
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL",
    $staff_id, $date_from, $date_to
) );

// All-time totals.
$total_bookings_alltime = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d AND deleted_at IS NULL AND status != 'cancelled'",
    $staff_id
) );

$total_revenue_alltime = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE b.staff_id = %d
       AND p.payment_status = 'completed'
       AND p.payment_type != 'refund'
       AND b.deleted_at IS NULL",
    $staff_id
) );
```

Calculate derived metrics:
```php
$no_show_rate    = $bookings > 0 ? round( ($no_shows / $bookings) * 100, 1 ) : 0.0;
$avg_booking_val = $completed > 0 ? round( (float)$revenue / $completed, 2 ) : 0.0;
```

Return array per staff member:
```json
{
  "id": 1,
  "name": "Emma Thompson",
  "title": "Senior Stylist",
  "photo_url": "...",
  "member_since": "2023-03-15",
  "bookings": 52,
  "completed": 48,
  "no_shows": 2,
  "no_show_rate": 3.8,
  "revenue": 1820.00,
  "avg_booking_value": 37.92,
  "total_bookings_alltime": 412,
  "total_revenue_alltime": 14350.00
}
```

Return full response:
```json
{
  "success": true,
  "date_from": "2026-02-01",
  "date_to": "2026-02-25",
  "staff": [...]
}
```

### Add method `get_staff_detail( $request )`:

Parse `staff_id` from URL. Parse date params (same defaults).

1. Get staff member basic info:
```php
$staff = $wpdb->get_row( $wpdb->prepare(
    "SELECT id, first_name, last_name, title, bio, photo_url, created_at
     FROM {$wpdb->prefix}bookings_staff
     WHERE id = %d AND deleted_at IS NULL",
    $staff_id
), ARRAY_A );

if ( ! $staff ) {
    return new WP_Error( 'staff_not_found', 'Staff member not found.', array( 'status' => 404 ) );
}
```

2. Run the same period metrics as `get_staff_performance()` but for this one staff member only.

3. **Service breakdown for this staff member:**
```php
$by_service = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        MAX(s.name) AS service_name,
        COUNT(DISTINCT b.id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS revenue
     FROM {$wpdb->prefix}bookings b
     INNER JOIN {$wpdb->prefix}bookings_services s ON s.id = b.service_id
     LEFT JOIN {$wpdb->prefix}bookings_payments p
         ON p.booking_id = b.id AND p.payment_status = 'completed' AND p.payment_type != 'refund'
     WHERE b.staff_id = %d
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL
       AND b.status != 'cancelled'
     GROUP BY b.service_id
     ORDER BY booking_count DESC",
    $staff_id, $date_from, $date_to
), ARRAY_A );
```

4. **Weekly bookings trend** (for line chart — bookings per week in the period):
```php
$weekly_trend = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        YEAR(booking_date) AS yr,
        WEEK(booking_date, 1) AS wk,
        MIN(booking_date) AS week_start,
        COUNT(*) AS booking_count
     FROM {$wpdb->prefix}bookings
     WHERE staff_id = %d
       AND booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status != 'cancelled'
     GROUP BY YEAR(booking_date), WEEK(booking_date, 1)
     ORDER BY yr ASC, wk ASC",
    $staff_id, $date_from, $date_to
), ARRAY_A );
```

5. **Upcoming time-off blocks** (the admin visibility tab decided in Sprint 4A planning):
```php
$tz    = new DateTimeZone( 'Europe/London' );
$today = ( new DateTimeImmutable( 'now', $tz ) )->format( 'Y-m-d' );

$time_off = $wpdb->get_results( $wpdb->prepare(
    "SELECT id, specific_date, start_time, end_time, is_working, notes
     FROM {$wpdb->prefix}bookings_staff_working_hours
     WHERE staff_id = %d
       AND specific_date IS NOT NULL
       AND specific_date >= %s
       AND is_working = 0
     ORDER BY specific_date ASC
     LIMIT 20",
    $staff_id, $today
), ARRAY_A );
```

Return:
```json
{
  "success": true,
  "date_from": "...",
  "date_to": "...",
  "staff": {
    "id": 1,
    "name": "Emma Thompson",
    "title": "Senior Stylist",
    "bio": "...",
    "photo_url": "...",
    "member_since": "2023-03-15",
    "bookings": 52,
    "completed": 48,
    "no_shows": 2,
    "no_show_rate": 3.8,
    "revenue": 1820.00,
    "avg_booking_value": 37.92,
    "total_bookings_alltime": 412,
    "total_revenue_alltime": 14350.00,
    "by_service": [...],
    "weekly_trend": [
      { "week_label": "Week of 03/02", "booking_count": 12 },
      ...
    ],
    "time_off": [
      { "id": 5, "specific_date": "2026-03-10", "start_time": "09:00:00", "end_time": "17:00:00", "notes": "reason:vacation|notes:Holiday" },
      ...
    ]
  }
}
```

For `weekly_trend`, format `week_start` as `DD/MM` for `week_label`.

---

## PART B — FRONTEND

### Modify `bookit-booking-system/dashboard/src/router/index.js`

Add one new route after the existing `/reports/staff` route:
```js
{
  path: '/reports/staff/:id',
  name: 'StaffDetail',
  component: () => import('../views/StaffDetail.vue'),
  meta: { title: 'Staff Detail', requiresAdmin: true }
},
```

### Create: `bookit-booking-system/dashboard/src/views/StaffDetail.vue`

This is the drill-down view for a single staff member. Use `useRoute()` to get `route.params.id`.

**Layout:**

```
Back button: "← Back to Staff Performance" (router-link to /reports/staff)

Header: photo (if available, else initials avatar) + name + title + "Member since DD/MM/YYYY"

DateRangeSelector (default: this month)
  On @change: re-fetch detail

"New team member" notice:
  If member_since is within the last 30 days:
    Blue info: "New team member — not enough data for trends yet."

Summary cards (6 cards):
  Bookings | Completed | No-Shows | No-Show Rate | Revenue | Avg Booking Value

  Alerts:
  - no_show_rate > 10% → amber: "⚠️ High no-show rate. May indicate scheduling or experience issues."

All-time stats (small secondary row below main cards):
  "All time: X bookings · £X,XXX revenue"

Tabs: [ Performance | Services | Time Off ]
  Default tab: Performance

  === Performance tab ===
  Weekly Bookings Trend chart:
    Line chart: X = "Week of DD/MM", Y = booking count
    Colour: #6366F1
    div style="height: 240px; position: relative;"
    Empty state if no weekly_trend data

  === Services tab ===
  Table: Service | Bookings | Revenue
  Sortable by bookings or revenue
  Empty state: "No service data for this period"

  === Time Off tab ===
  Title: "Upcoming Time Off"
  List of time-off blocks:
    Each card shows: date (DD/MM/YYYY), time range or "All Day", reason (parse from notes field)
    Parse reason from notes format: "reason:vacation|notes:Going away"
    Map reason keys to labels: vacation→"Vacation", sick_leave→"Sick Leave",
      lunch_break→"Lunch Break", personal→"Personal", other→"Other"
  Empty state: "No upcoming time off scheduled"
  Note: Read-only — no delete or edit actions here (admin manages via Staff page)
```

**Script logic:**
```js
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const staffId   = computed(() => route.params.id)
const staffData = ref(null)
const loading   = ref(false)
const error     = ref(false)
const activeTab = ref('performance')

// Date range — default this month
const dateFrom = ref('')
const dateTo   = ref('')

// Fetch on mount and when date range changes
const fetchDetail = async () => {
  loading.value = true
  error.value   = false
  try {
    const response = await api.get(
      `reports/staff/${staffId.value}?date_from=${dateFrom.value}&date_to=${dateTo.value}`
    )
    if (response.data.success) {
      staffData.value = response.data.staff
    }
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}
```

### Replace: `bookit-booking-system/dashboard/src/views/StaffPerformance.vue`

Replace the stub entirely.

**Layout:**

```
Header: "Staff Performance" + subtitle "Compare performance across your team"

DateRangeSelector (default: this month)
  On @change: re-fetch

Summary: small text below selector: "X staff members · period bookings total"

Staff comparison table:
  Columns: Staff Member | Bookings | Revenue | Avg Booking Value | No-Show Rate | All-Time Bookings
  Sortable: click header to sort, toggle ASC/DESC
  Default sort: Revenue DESC

  Each row:
    Staff Member cell: photo thumbnail (or initials) + name + title
    No-Show Rate: colour coded — green < 5%, amber 5-10%, red > 10%
    Entire row is clickable → navigate to /reports/staff/{id}
    Hover state on row: bg-gray-50 cursor-pointer

  Empty state: "No staff data found for this period"

Loading: skeleton rows (3 placeholder rows)
Error: ErrorState with retry
```

**Script logic:**
```js
// On row click: router.push(`/reports/staff/${staff.id}`)
// Sort state: sortBy ref, sortDir ref
// sortedStaff computed: [...staffList.value].sort(...)
```

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. `DateTimeImmutable` + `DateTimeZone('Europe/London')`. All queries via `$wpdb->prepare()`.
- Vue: `<script setup>`, Tailwind only, no Options API.
- All PHP strings: `__( '...', 'bookit-booking-system' )`
- Do not modify any other existing file except class-reports-api.php, router/index.js, and the two Vue view files.

---

## DELIVERABLES SUMMARY

1. MODIFIED: `bookit-booking-system/includes/api/class-reports-api.php`
   - 2 new routes: `GET /dashboard/reports/staff` and `GET /dashboard/reports/staff/{id}`
   - 2 new methods: `get_staff_performance()` and `get_staff_detail()`
2. MODIFIED: `bookit-booking-system/dashboard/src/router/index.js` — add `/reports/staff/:id` route
3. NEW FILE: `bookit-booking-system/dashboard/src/views/StaffDetail.vue`
4. MODIFIED: `bookit-booking-system/dashboard/src/views/StaffPerformance.vue` — full implementation replacing stub
```

---

## ✅ Task 7 Testing Checklist

**Staff Performance table:**
- [ ] `/reports/staff` loads without errors
- [ ] All active staff members appear in the table
- [ ] Clicking a column header sorts correctly (toggle ASC/DESC)
- [ ] No-show rate colour coding correct (green/amber/red)
- [ ] Clicking a row navigates to `/reports/staff/{id}`

**Staff Detail page:**
- [ ] Back button returns to `/reports/staff`
- [ ] Name, title, member since date displayed correctly
- [ ] 6 summary cards show correct values
- [ ] All-time stats row visible below cards
- [ ] New team member notice shown if < 30 days since joining

**Performance tab:**
- [ ] Line chart renders with weekly data
- [ ] Empty state shown when no trend data

**Services tab:**
- [ ] Table shows services with correct booking counts and revenue
- [ ] Sortable by bookings and revenue

**Time Off tab:**
- [ ] Shows upcoming time-off blocks
- [ ] Reason labels are human-readable (not raw DB values)
- [ ] "All Day" shown when full day block
- [ ] Empty state when no time off scheduled
- [ ] No delete/edit buttons visible (read-only)

**Date range:**
- [ ] Changing date range on either page re-fetches correctly
- [ ] Date range on detail page is independent of performance list page

**API permissions:**
- [ ] Both endpoints return 403 for staff users

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 7: Staff performance report, staff detail drill-down, time-off visibility"
```

Then report back "Task 7 complete ✅" and I'll prepare Task 8.