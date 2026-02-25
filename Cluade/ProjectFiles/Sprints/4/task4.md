Good — `chart.js` and `vue-chartjs` are not yet in `package.json`. They need to be installed as part of this task. Everything else I need to know is clear. Let me write the prompt.

---

```
Sprint 4A Progress: 3/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
⏭️ Task 4:  Reports Nav + Overview Dashboard (8h)  — NEXT
□  Task 5:  Revenue Report (14h)
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 40 / 112
```

---

## Task 4 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 4 of Sprint 4A for the Bookit Booking System WordPress plugin: Reports Navigation + Overview Dashboard.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/class-bookit-loader.php` — you must add the new Reports API class here
- `bookit-booking-system/includes/api/class-dashboard-bookings-api.php` — read register_routes() to understand the existing route registration pattern. Do NOT add anything to this file in this task.
- `bookit-booking-system/dashboard/src/components/Sidebar.vue` — add Reports nav section here
- `bookit-booking-system/dashboard/src/router/index.js` — add all new report routes here
- `bookit-booking-system/dashboard/src/views/Dashboard.vue` — copy loading/error/empty state patterns
- `bookit-booking-system/dashboard/package.json` — verify chart.js and vue-chartjs are not yet installed (they are not — install them as part of this task)

### What already exists — do NOT duplicate:
- All existing routes in router/index.js
- All existing nav items in Sidebar.vue
- The entire class-dashboard-bookings-api.php — do not touch it


## PART B — NEW PHP CLASS: `Bookit_Reports_API`

### Create: `bookit-booking-system/includes/api/class-reports-api.php`

```php
<?php
/**
 * Reports REST API Controller
 *
 * Handles all dashboard reports endpoints.
 * Admin-only access for all endpoints.
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/includes/api
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

class Bookit_Reports_API {

    const NAMESPACE = 'bookit/v1';

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        // Overview report.
        register_rest_route(
            self::NAMESPACE,
            '/dashboard/reports/overview',
            array(
                'methods'             => 'GET',
                'callback'            => array( $this, 'get_overview' ),
                'permission_callback' => array( $this, 'check_admin_permission' ),
            )
        );
    }

    /**
     * Check admin permission.
     * Replicates the same pattern used in Bookit_Dashboard_Bookings_API.
     * Read class-bookit-auth.php to copy the exact implementation.
     */
    public function check_admin_permission() {
        // Copy the exact check_admin_permission implementation from
        // Bookit_Dashboard_Bookings_API — read that file first.
    }

    /**
     * GET /dashboard/reports/overview
     *
     * Returns summary metrics for three periods:
     * this_week, this_month, all_time.
     *
     * All date calculations use Europe/London timezone.
     * Use DateTimeImmutable with DateTimeZone('Europe/London') — never date() or time().
     */
    public function get_overview( $request ) {
        global $wpdb;

        $tz   = new DateTimeZone( 'Europe/London' );
        $now  = new DateTimeImmutable( 'now', $tz );

        // This week: Monday to Sunday.
        $week_start = $now->modify( 'monday this week' )->format( 'Y-m-d' );
        $week_end   = $now->modify( 'sunday this week' )->format( 'Y-m-d' );

        // This month: first to last day.
        $month_start = $now->format( 'Y-m-01' );
        $month_end   = $now->format( 'Y-m-t' );

        $periods = array(
            'this_week'  => array( $week_start, $week_end ),
            'this_month' => array( $month_start, $month_end ),
        );

        $result = array();

        foreach ( $periods as $key => $dates ) {
            $result[ $key ] = $this->get_period_metrics( $dates[0], $dates[1] );
        }

        // All time — no date filter.
        $result['all_time'] = $this->get_period_metrics( null, null );

        // Revenue trend for bar chart.
        // For this_week: daily revenue (7 bars, Mon-Sun).
        // For this_month: weekly revenue (4-5 bars).
        $result['revenue_trend'] = array(
            'this_week'  => $this->get_daily_revenue( $week_start, $week_end ),
            'this_month' => $this->get_weekly_revenue( $month_start, $month_end ),
        );

        return rest_ensure_response( array(
            'success' => true,
            'data'    => $result,
        ) );
    }

    /**
     * Get summary metrics for a date range (or all time if both params are null).
     *
     * Metrics returned:
     *   total_bookings    — count of non-cancelled bookings
     *   total_revenue     — sum of completed payments
     *   no_show_rate      — percentage (float, 1 decimal place)
     *   cancellation_rate — percentage (float, 1 decimal place)
     *
     * Queries:
     *
     * total_bookings (exclude cancelled):
     *   SELECT COUNT(*) FROM wp_bookings
     *   WHERE status != 'cancelled' AND deleted_at IS NULL
     *   [AND booking_date BETWEEN date_from AND date_to]
     *
     * total_revenue:
     *   SELECT COALESCE(SUM(p.amount), 0)
     *   FROM wp_bookings_payments p
     *   JOIN wp_bookings b ON b.id = p.booking_id
     *   WHERE p.payment_status = 'completed'
     *   AND b.deleted_at IS NULL
     *   [AND b.booking_date BETWEEN date_from AND date_to]
     *
     * no_show_count:
     *   SELECT COUNT(*) FROM wp_bookings
     *   WHERE status = 'no-show' AND deleted_at IS NULL
     *   [AND booking_date BETWEEN date_from AND date_to]
     *
     * total_for_rate (denominator — all non-cancelled, completed, no-show):
     *   SELECT COUNT(*) FROM wp_bookings
     *   WHERE status IN ('completed', 'no-show', 'confirmed')
     *   AND deleted_at IS NULL
     *   [AND booking_date BETWEEN date_from AND date_to]
     *
     * cancellation_count:
     *   SELECT COUNT(*) FROM wp_bookings
     *   WHERE status = 'cancelled' AND deleted_at IS NULL
     *   [AND booking_date BETWEEN date_from AND date_to]
     *
     * cancellation_rate denominator = total_bookings + cancellation_count
     *
     * Rate formula: round( ($count / $denominator) * 100, 1 ) — return 0.0 if denominator is 0.
     *
     * Return array:
     * [
     *   'total_bookings'    => (int),
     *   'total_revenue'     => (float),
     *   'no_show_rate'      => (float),
     *   'cancellation_rate' => (float),
     * ]
     */
    private function get_period_metrics( $date_from, $date_to ) {
        // Implement using $wpdb->prepare() and the query patterns above.
        // When $date_from and $date_to are both null, omit the date filter entirely.
    }

    /**
     * Get daily revenue for a date range (for bar chart).
     *
     * Returns array of objects: [ { date: 'YYYY-MM-DD', revenue: 0.00 }, ... ]
     * One entry per calendar day from date_from to date_to, inclusive.
     * Days with no revenue return revenue: 0.0 (do not omit them).
     *
     * Query:
     *   SELECT DATE(b.booking_date) as date,
     *          COALESCE(SUM(p.amount), 0) as revenue
     *   FROM wp_bookings b
     *   LEFT JOIN wp_bookings_payments p
     *       ON p.booking_id = b.id AND p.payment_status = 'completed'
     *   WHERE b.booking_date BETWEEN date_from AND date_to
     *     AND b.deleted_at IS NULL
     *     AND b.status != 'cancelled'
     *   GROUP BY DATE(b.booking_date)
     *   ORDER BY DATE(b.booking_date) ASC
     *
     * After querying, fill in any missing dates with revenue: 0.0
     * using a DatePeriod loop from date_from to date_to.
     */
    private function get_daily_revenue( $date_from, $date_to ) {
        // Implement as described above.
    }

    /**
     * Get weekly revenue buckets for a month range (for bar chart).
     *
     * Groups revenue by ISO week number within the month.
     * Returns array: [ { week_label: 'Week 1', revenue: 0.00 }, ... ]
     *
     * Query:
     *   SELECT WEEK(b.booking_date, 1) as week_num,
     *          MIN(b.booking_date) as week_start,
     *          COALESCE(SUM(p.amount), 0) as revenue
     *   FROM wp_bookings b
     *   LEFT JOIN wp_bookings_payments p
     *       ON p.booking_id = b.id AND p.payment_status = 'completed'
     *   WHERE b.booking_date BETWEEN date_from AND date_to
     *     AND b.deleted_at IS NULL
     *     AND b.status != 'cancelled'
     *   GROUP BY WEEK(b.booking_date, 1)
     *   ORDER BY week_num ASC
     *
     * Label each entry as "Week 1", "Week 2" etc. (sequential, not ISO week number).
     */
    private function get_weekly_revenue( $date_from, $date_to ) {
        // Implement as described above.
    }
}
```

### Modify: `bookit-booking-system/includes/class-bookit-loader.php`

In the `load_dependencies()` method, after the line that requires `class-dashboard-bookings-api.php`, add:

```php
// Reports API.
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-reports-api.php';
new Bookit_Reports_API();
```

---

## PART C — FRONTEND

### Modify: `bookit-booking-system/dashboard/src/components/Sidebar.vue`

Read the existing file carefully. There is a `settingsNavigation` array and a `mainNavigation` array. Reports is admin-only so it belongs in the admin section.

Add a new `reportsNavigation` array in `<script setup>`:
```js
const reportsNavigation = [
  { name: 'reportsOverview',  path: '/reports',          icon: '📊', label: 'Overview' },
  { name: 'revenueReport',    path: '/reports/revenue',  icon: '💷', label: 'Revenue' },
  { name: 'bookingAnalytics', path: '/reports/bookings', icon: '📈', label: 'Bookings' },
  { name: 'staffPerformance', path: '/reports/staff',    icon: '👥', label: 'Staff Performance' },
  { name: 'customers',        path: '/customers',        icon: '👤', label: 'Customers' },
]
```

In the template, inside the `v-if="props.staff.role === 'admin'"` section (where `settingsNavigation` is already rendered), add a Reports section ABOVE the existing Settings section:

```html
<!-- Reports Section (Admin Only) -->
<div class="px-4 pb-2 border-t border-gray-200">
  <p class="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
    Reports
  </p>
  <router-link
    v-for="item in reportsNavigation"
    :key="item.name"
    :to="item.path"
    class="nav-item"
    :class="{ 'active': $route.path === item.path || $route.path.startsWith(item.path + '/') }"
  >
    <span class="text-xl mr-3">{{ item.icon }}</span>
    <span>{{ item.label }}</span>
  </router-link>
</div>
```

Note: The Overview item active state uses exact match (`=== item.path`), but sub-report items need `startsWith` — the single expression above handles both correctly since `/reports` won't startsWith `/reports/` falsely.

### Modify: `bookit-booking-system/dashboard/src/router/index.js`

Add all report and customer routes. Views for Tasks 5–8 will be stubs — they must exist now to prevent 404s as the sprint progresses.

Add these routes (after the existing `/my-availability` route):

```js
// Reports (admin only)
{
  path: '/reports',
  name: 'Reports',
  component: () => import('../views/Reports.vue'),
  meta: { title: 'Reports Overview', requiresAdmin: true }
},
{
  path: '/reports/revenue',
  name: 'RevenueReport',
  component: () => import('../views/RevenueReport.vue'),
  meta: { title: 'Revenue Report', requiresAdmin: true }
},
{
  path: '/reports/bookings',
  name: 'BookingAnalytics',
  component: () => import('../views/BookingAnalytics.vue'),
  meta: { title: 'Booking Analytics', requiresAdmin: true }
},
{
  path: '/reports/staff',
  name: 'StaffPerformance',
  component: () => import('../views/StaffPerformance.vue'),
  meta: { title: 'Staff Performance', requiresAdmin: true }
},
// Customers (admin only)
{
  path: '/customers',
  name: 'Customers',
  component: () => import('../views/Customers.vue'),
  meta: { title: 'Customers', requiresAdmin: true }
},
{
  path: '/customers/:id',
  name: 'CustomerProfile',
  component: () => import('../views/CustomerProfile.vue'),
  meta: { title: 'Customer Profile', requiresAdmin: true }
},
```

### Create stub views for Tasks 5–8:

Create these four files as minimal stubs. Each must be a valid Vue SFC that renders without errors:

**`bookit-booking-system/dashboard/src/views/RevenueReport.vue`**
**`bookit-booking-system/dashboard/src/views/BookingAnalytics.vue`**
**`bookit-booking-system/dashboard/src/views/StaffPerformance.vue`**
**`bookit-booking-system/dashboard/src/views/Customers.vue`**
**`bookit-booking-system/dashboard/src/views/CustomerProfile.vue`**

Each stub should follow this pattern:
```vue
<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">[Page Title]</h2>
      <p class="text-sm text-gray-500 mt-1">Coming soon — this report is being built.</p>
    </div>
  </div>
</template>

<script setup>
// Stub — full implementation in Sprint 4A Task [N]
</script>
```

### Create: `bookit-booking-system/dashboard/src/views/Reports.vue`

This is the main overview dashboard. Use Vue 3 `<script setup>`, Tailwind CSS, Chart.js via vue-chartjs.

**Import pattern for vue-chartjs:**
```js
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend )
```

**Page layout:**

```
Header: "Reports" + subtitle "Business performance overview"

Period tab toggle (This Week / This Month / All Time):
  - Three buttons styled as a pill toggle
  - Default: "This Week" selected
  - Clicking a tab updates the displayed metrics
  - "All Time" tab does not show the bar chart (no meaningful trend for all time)

Four summary cards (2x2 grid on mobile, 4-column on desktop):
  Card 1: Total Bookings
    - Large number
    - Subtitle: "Excluding cancellations"
    - Icon: 📋
  Card 2: Total Revenue
    - £X,XXX.XX format
    - Subtitle: "From completed payments"
    - Icon: 💷
  Card 3: No-Show Rate
    - X.X%
    - Subtitle: "Of completed appointments"
    - Icon: ⚠️
    - Text colour: red if > 10%, amber if 5-10%, green if < 5%
  Card 4: Cancellation Rate
    - X.X%
    - Subtitle: "Of all bookings"
    - Icon: ❌
    - Text colour: red if > 20%, amber if 10-20%, green if < 20%

Revenue trend bar chart (hidden when "All Time" tab is active):
  - Title: "Revenue Trend"
  - Subtitle: "Daily" when This Week tab active, "Weekly" when This Month tab active
  - Bar chart using Chart.js via vue-chartjs
  - X axis: date labels (DD/MM for daily, "Week 1" etc for weekly)
  - Y axis: £ values, formatted with £ prefix
  - Colour: primary blue (#3B82F6) bars
  - Responsive: true
  - Chart updates when tab changes (use computed chartData based on active tab)
```

**Script logic:**

```js
// On mount: fetch GET /dashboard/reports/overview
// Store full response in overviewData ref
// activeTab ref: 'this_week' | 'this_month' | 'all_time', default 'this_week'

// currentMetrics computed: returns overviewData.value?.data[activeTab.value]

// chartData computed:
//   if activeTab === 'all_time': return null (chart hidden)
//   labels: overviewData.value?.data.revenue_trend[activeTab.value].map(item => 
//     activeTab === 'this_week' 
//       ? formatChartDate(item.date)   // DD/MM
//       : item.week_label              // "Week 1" etc
//   )
//   datasets: [{ label: 'Revenue (£)', data: [...revenues], backgroundColor: '#3B82F6' }]

// formatCurrency: same as MyProfile.vue — toLocaleString('en-GB', 2dp)
// formatChartDate(dateStr): parse YYYY-MM-DD, return DD/MM

// Loading state: show 4 CardSkeleton components + chart placeholder while fetching
// Error state: show ErrorState component with retry
```

**Chart options:**
```js
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `£${Number(context.raw).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `£${value.toLocaleString('en-GB')}`
      }
    }
  }
}
```

The Bar chart component must be wrapped in a div with a fixed height for Chart.js to render correctly:
```html
<div style="height: 280px; position: relative;">
  <Bar :data="chartData" :options="chartOptions" />
</div>
```

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. `DateTimeImmutable` + `DateTimeZone('Europe/London')` only. All queries via `$wpdb->prepare()`.
- Vue: `<script setup>`, Tailwind only, no Options API.
- All PHP strings: `__( '...', 'bookit-booking-system' )`
- Do not modify any existing PHP class, route, or Vue component other than Sidebar.vue and router/index.js.

---

## DELIVERABLES SUMMARY

1. Run `npm install chart.js vue-chartjs` in `dashboard/` directory
2. NEW FILE: `bookit-booking-system/includes/api/class-reports-api.php`
3. MODIFIED: `bookit-booking-system/includes/class-bookit-loader.php` — require and instantiate Reports API
4. MODIFIED: `bookit-booking-system/dashboard/src/components/Sidebar.vue` — Reports nav section
5. MODIFIED: `bookit-booking-system/dashboard/src/router/index.js` — all report + customer routes
6. NEW FILE: `bookit-booking-system/dashboard/src/views/Reports.vue` — full implementation
7. NEW STUB FILES (5): `RevenueReport.vue`, `BookingAnalytics.vue`, `StaffPerformance.vue`, `Customers.vue`, `CustomerProfile.vue`
```

---

## ✅ Task 4 Testing Checklist

**Dependencies:**
- [ ] `dashboard/package.json` now lists `chart.js` and `vue-chartjs` as dependencies
- [ ] `npm install` completed without errors

**Navigation:**
- [ ] Log in as admin — "Reports" section visible in sidebar with all 5 sub-links (Overview, Revenue, Bookings, Staff Performance, Customers)
- [ ] Log in as staff — Reports section is completely absent from sidebar
- [ ] All 5 report links navigate without 404 errors
- [ ] Stub pages show "Coming soon" message for Revenue, Bookings, Staff Performance, Customers, Customer Profile

**Reports Overview page:**
- [ ] `/reports` loads without console errors
- [ ] Three period tabs visible: This Week / This Month / All Time
- [ ] "This Week" is selected by default
- [ ] Four summary cards visible with correct labels
- [ ] Cards show real numbers (not zeros, assuming you have some bookings in the database)
- [ ] Clicking "This Month" updates all four card values
- [ ] Clicking "All Time" updates all four card values

**No-show and cancellation rate colours:**
- [ ] No-show rate < 5% shows in green text
- [ ] Cancellation rate colours follow the thresholds (test by adjusting data if needed)

**Bar chart:**
- [ ] Chart renders under the summary cards on "This Week" tab
- [ ] Chart renders on "This Month" tab (weekly buckets labelled "Week 1", "Week 2" etc)
- [ ] Chart is hidden when "All Time" tab is active
- [ ] Hovering a bar shows a tooltip with £ formatted value
- [ ] Y axis labels show £ prefix

**Loading state:**
- [ ] Throttle network in DevTools — skeleton placeholders visible before data loads

**Error state:**
- [ ] Disconnect from internet, reload — ErrorState component shown with retry button
- [ ] Clicking retry re-fetches successfully after reconnecting

**PHP:**
- [ ] No PHP errors in `wp-content/debug.log`
- [ ] `GET /wp-json/bookit/v1/dashboard/reports/overview` returns 200 for admin, 403 for staff (test in browser or Postman)

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 4: Reports navigation, overview dashboard, Chart.js setup, stub views"
```

Then report back "Task 4 complete ✅" and I'll prepare Task 5.