```
Sprint 4A Progress: 4/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
⏭️ Task 5:  Revenue Report (14h)  — NEXT
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 48 / 112
```

Good — and good catch on the `no_show` inconsistency, that would have caused subtle bugs in Task 9 tests too. Let me read the files I need before writing Task 5.Good — I have everything I need. The `wp_bookings_payments` schema is clear (`payment_type` ENUM: `deposit`, `full_payment`, `refund`; `payment_method`: stripe, paypal, cash, card; `payment_status`: pending, completed, failed, refunded, partially_refunded). The `check_admin_permission` pattern is confirmed. Let me write the prompt.

---

## Task 5 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 5 of Sprint 4A for the Bookit Booking System WordPress plugin: Revenue Report.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/api/class-reports-api.php` — add new routes and methods here
- `bookit-booking-system/database/schema.sql` — specifically wp_bookings_payments columns: id, booking_id, customer_id, amount, payment_type (ENUM: deposit, full_payment, refund), payment_method (stripe, paypal, cash, card), payment_status (ENUM: pending, completed, failed, refunded, partially_refunded), refund_amount, transaction_date
- `bookit-booking-system/dashboard/src/views/Reports.vue` — copy the Chart.js import pattern, chartOptions pattern, and period tab UI pattern exactly
- `bookit-booking-system/dashboard/src/router/index.js` — RevenueReport route already exists as a stub, no changes needed

### What already exists — do NOT duplicate:
- `GET /dashboard/reports/overview` — already in class-reports-api.php
- `check_admin_permission()` — already in class-reports-api.php
- The `RevenueReport.vue` stub file — replace it entirely with the full implementation
- Chart.js and vue-chartjs are already installed

---

## PART A — BACKEND: Add to `class-reports-api.php`

### Add to `register_routes()`:

```
GET /dashboard/reports/revenue
  permission_callback: check_admin_permission
  args:
    date_from: optional, YYYY-MM-DD, default = first day of current month
    date_to:   optional, YYYY-MM-DD, default = today
    
GET /dashboard/reports/revenue/export
  permission_callback: check_admin_permission
  args:
    date_from: optional, YYYY-MM-DD
    date_to:   optional, YYYY-MM-DD
```

### Add method `get_revenue_report( $request )`:

1. Parse `date_from` and `date_to` from request params. If not provided:
   - `date_from` defaults to first day of current month in Europe/London
   - `date_to` defaults to today in Europe/London
   Use `new DateTimeImmutable('now', new DateTimeZone('Europe/London'))` — never `date()`.

2. **Summary cards** — run these queries for the given date range:

```php
// Total revenue (completed payments, excluding refunds).
$total_revenue = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE p.payment_status = 'completed'
       AND p.payment_type != 'refund'
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL",
    $date_from, $date_to
) );

// Deposits collected.
$deposits = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE p.payment_status = 'completed'
       AND p.payment_type = 'deposit'
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL",
    $date_from, $date_to
) );

// Balance / full payments.
$balance_payments = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE p.payment_status = 'completed'
       AND p.payment_type = 'full_payment'
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL",
    $date_from, $date_to
) );

// Refunds issued.
$refunds = $wpdb->get_var( $wpdb->prepare(
    "SELECT COALESCE(SUM(p.refund_amount), 0)
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE p.payment_status IN ('refunded', 'partially_refunded')
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL",
    $date_from, $date_to
) );

// Net revenue = total_revenue - refunds.
$net_revenue = (float) $total_revenue - (float) $refunds;
```

3. **Revenue by Service** — returns array sorted by revenue DESC:
```php
$by_service = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        s.name AS service_name,
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
     GROUP BY b.service_id, s.name
     ORDER BY total_revenue DESC",
    $date_from, $date_to
), ARRAY_A );
```

4. **Revenue by Staff** — same pattern, group by staff_id:
```php
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
         ON p.booking_id = b.id AND p.payment_status = 'completed' AND p.payment_type != 'refund'
     WHERE b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL
       AND b.status != 'cancelled'
     GROUP BY b.staff_id, st.first_name, st.last_name
     ORDER BY total_revenue DESC",
    $date_from, $date_to
), ARRAY_A );
```

5. **Revenue by Payment Method**:
```php
$by_method = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        p.payment_method,
        COUNT(DISTINCT b.id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS total_revenue
     FROM {$wpdb->prefix}bookings_payments p
     INNER JOIN {$wpdb->prefix}bookings b ON b.id = p.booking_id
     WHERE p.payment_status = 'completed'
       AND p.payment_type != 'refund'
       AND b.booking_date BETWEEN %s AND %s
       AND b.deleted_at IS NULL
     GROUP BY p.payment_method
     ORDER BY total_revenue DESC",
    $date_from, $date_to
), ARRAY_A );
```

6. **Revenue trend** — daily revenue for the selected range. Reuse the existing `get_daily_revenue()` private method already in the class. Pass `$date_from` and `$date_to`.

7. Cast all monetary values to `(float)`, booking counts to `(int)`. Return:
```json
{
  "success": true,
  "date_from": "2026-02-01",
  "date_to": "2026-02-25",
  "is_today_in_range": true,
  "summary": {
    "total_revenue": 1820.50,
    "deposits": 450.00,
    "balance_payments": 1370.50,
    "refunds": 35.00,
    "net_revenue": 1785.50
  },
  "by_service": [...],
  "by_staff": [...],
  "by_payment_method": [...],
  "revenue_trend": [
    { "date": "2026-02-01", "revenue": 0.0 },
    ...
  ]
}
```

`is_today_in_range`: true if today (Europe/London) falls between date_from and date_to inclusive.

### Add method `export_revenue_csv( $request )`:

1. Parse same date params as `get_revenue_report()`.
2. Call `get_revenue_report()` internally to get the data, OR re-run the by_service and by_staff queries directly — either approach is fine.
3. Build a CSV string with these columns:
   `Date From, Date To, Total Revenue, Deposits, Balance Payments, Refunds, Net Revenue`
   followed by a blank line, then:
   `Service Name, Bookings, Total Revenue, Avg Price`
   and one row per service.
4. Set response headers and return raw CSV:
```php
$filename = 'revenue-report-' . $date_from . '-to-' . $date_to . '.csv';

// Return as WP_REST_Response with CSV headers.
$response = new WP_REST_Response( $csv_string );
$response->header( 'Content-Type', 'text/csv; charset=utf-8' );
$response->header( 'Content-Disposition', 'attachment; filename="' . $filename . '"' );
return $response;
```

---

## PART B — FRONTEND: Replace `RevenueReport.vue` stub

Replace the entire contents of `bookit-booking-system/dashboard/src/views/RevenueReport.vue`.

### Create `DateRangeSelector.vue` component first:

Create `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue` — this will be reused in Tasks 6 and 7.

```vue
<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <!-- Quick filter buttons -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="filter in quickFilters"
        :key="filter.key"
        @click="applyQuickFilter(filter.key)"
        class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
        :class="activeQuickFilter === filter.key
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Custom date range inputs -->
    <div class="flex flex-col sm:flex-row gap-3 items-end">
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1">From</label>
        <input
          type="date"
          v-model="localFrom"
          @change="onDateChange"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1">To</label>
        <input
          type="date"
          v-model="localTo"
          @change="onDateChange"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <button
        @click="applyCustomRange"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['change'])

const props = defineProps({
  modelFrom: { type: String, default: '' },
  modelTo:   { type: String, default: '' },
})

const localFrom = ref(props.modelFrom)
const localTo   = ref(props.modelTo)
const activeQuickFilter = ref('this_month')

// Helper: format Date as YYYY-MM-DD in Europe/London
function toLocalDateString(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(date)
}

const quickFilters = [
  { key: 'today',       label: 'Today' },
  { key: 'yesterday',   label: 'Yesterday' },
  { key: 'this_week',   label: 'This Week' },
  { key: 'last_week',   label: 'Last Week' },
  { key: 'this_month',  label: 'This Month' },
  { key: 'last_month',  label: 'Last Month' },
  { key: 'custom',      label: 'Custom' },
]

function applyQuickFilter(key) {
  activeQuickFilter.value = key
  if (key === 'custom') return // Let user pick dates manually

  const now = new Date()
  let from, to

  if (key === 'today') {
    from = to = toLocalDateString(now)
  } else if (key === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    from = to = toLocalDateString(y)
  } else if (key === 'this_week') {
    const d = new Date(now)
    const day = d.getDay() || 7 // Make Sunday = 7
    d.setDate(d.getDate() - day + 1) // Monday
    from = toLocalDateString(d)
    const end = new Date(d); end.setDate(d.getDate() + 6)
    to = toLocalDateString(end)
  } else if (key === 'last_week') {
    const d = new Date(now)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day - 6) // Last Monday
    from = toLocalDateString(d)
    const end = new Date(d); end.setDate(d.getDate() + 6)
    to = toLocalDateString(end)
  } else if (key === 'this_month') {
    from = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1))
    to = toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  } else if (key === 'last_month') {
    from = toLocalDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    to = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 0))
  }

  localFrom.value = from
  localTo.value   = to
  emit('change', { from, to })
}

function applyCustomRange() {
  if (!localFrom.value || !localTo.value) return
  activeQuickFilter.value = 'custom'
  emit('change', { from: localFrom.value, to: localTo.value })
}

function onDateChange() {
  activeQuickFilter.value = 'custom'
}
</script>
```

### Full `RevenueReport.vue` implementation:

```
Layout:

Header: "Revenue Report" + subtitle

DateRangeSelector component (import from ../components/DateRangeSelector.vue)
  - On @change: update date range and re-fetch report

"Today's data is preliminary" notice:
  - Show a blue info banner when is_today_in_range === true:
    "ℹ️ Today's data is preliminary and may change as more bookings are processed."

Summary cards (5 cards, responsive grid):
  Card 1: Total Revenue — £X,XXX.XX — "Before refunds"
  Card 2: Deposits Collected — £X,XXX.XX
  Card 3: Balance Payments — £X,XXX.XX
  Card 4: Refunds Issued — £X,XXX.XX — text red if > 0
  Card 5: Net Revenue — £X,XXX.XX — text green, bold

Revenue Trend line chart:
  - Import Line from vue-chartjs
  - Also register: LineElement, PointElement from chart.js
  - X axis: date labels formatted as DD/MM
  - Y axis: £ values
  - Colour: primary blue (#3B82F6) line with tension: 0.3
  - Wrapped in a div style="height: 260px; position: relative;"
  - Show "No revenue data for this period" EmptyState if all trend values are 0

Revenue by Service table:
  - Section title: "Revenue by Service"
  - Sortable columns: Service | Bookings | Total Revenue | Avg Price
  - Click a column header to sort by that column (toggle ASC/DESC)
  - Default sort: Total Revenue DESC
  - Format revenue columns as £X,XXX.XX
  - Empty state: "No service data for this period"

Revenue by Staff table:
  - Section title: "Revenue by Staff Member"
  - Sortable columns: Staff | Bookings | Total Revenue | Avg per Booking
  - Same sort pattern as service table
  - Empty state: "No staff data for this period"

Revenue by Payment Method:
  - Section title: "Revenue by Payment Method"
  - Simple cards or a small table: Method | Bookings | Total Revenue
  - Map payment_method keys to labels: stripe → "Stripe", paypal → "PayPal",
    cash → "Cash", card → "Card Machine", pay_on_arrival → "Pay on Arrival"
  - Empty state: "No payment data for this period"

CSV Export button:
  - Position: top right of the page header area
  - Label: "Export CSV"
  - On click: trigger GET /dashboard/reports/revenue/export?date_from=...&date_to=...
  - Implement as a direct window.location or anchor href — do NOT use api.get()
    because the response is a file download, not JSON. Use:
    window.location.href = `${window.BOOKIT_DASHBOARD.apiBase}reports/revenue/export?date_from=${dateFrom.value}&date_to=${dateTo.value}&_wpnonce=${window.BOOKIT_DASHBOARD.nonce}`

Loading state: CardSkeleton components while fetching
Error state: ErrorState component with retry
```

**Script logic:**
```js
// Import Line in addition to Bar (Bar already imported for Reports.vue pattern)
import { Line } from 'vue-chartjs'
import { ..., LineElement, PointElement } from 'chart.js'
ChartJS.register( ..., LineElement, PointElement )

// dateFrom and dateTo refs — initialise to current month
// On mount: call applyDefaultDates() then fetchReport()
// On DateRangeSelector @change: update dateFrom/dateTo, call fetchReport()

// Sorting state: sortBy ref (column key), sortDir ref ('asc'|'desc')
// sortedByService computed: [...reportData.value.by_service].sort(...)
// sortedByStaff computed: similar

// fetchReport() calls GET /dashboard/reports/revenue?date_from=...&date_to=...
// stores full response in reportData ref
```

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. `DateTimeImmutable` + `DateTimeZone('Europe/London')`. All queries via `$wpdb->prepare()`.
- Vue: `<script setup>`, Tailwind only, no Options API.
- All PHP strings: `__( '...', 'bookit-booking-system' )`
- Do not modify any other existing file except the two listed below.

---

## DELIVERABLES SUMMARY

1. MODIFIED: `bookit-booking-system/includes/api/class-reports-api.php`
   - 2 new routes: `GET /dashboard/reports/revenue` and `GET /dashboard/reports/revenue/export`
   - 2 new methods: `get_revenue_report()` and `export_revenue_csv()`
2. NEW FILE: `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue`
3. MODIFIED: `bookit-booking-system/dashboard/src/views/RevenueReport.vue` — full implementation replacing stub
```

---

## ✅ Task 5 Testing Checklist

**Navigation:**
- [ ] Click "Revenue" in sidebar → `/reports/revenue` loads without errors

**Date range selector:**
- [ ] "This Month" quick filter selected by default, correct dates shown in inputs
- [ ] Click "Today" → dates update, report re-fetches
- [ ] Click "Last Month" → dates update, report re-fetches
- [ ] Set custom dates manually and click "Apply" → report re-fetches with those dates
- [ ] Selecting "Custom" quick filter without clicking Apply does not trigger a fetch

**Summary cards:**
- [ ] All 5 cards visible: Total Revenue, Deposits, Balance Payments, Refunds, Net Revenue
- [ ] Values match what you'd expect from the test bookings in your database
- [ ] Refunds card shows red text when refunds > 0
- [ ] Net Revenue shows green text

**Preliminary data banner:**
- [ ] Select a date range that includes today → blue info banner appears
- [ ] Select a date range entirely in the past → banner absent

**Revenue trend chart:**
- [ ] Line chart renders below summary cards
- [ ] X axis shows DD/MM date labels
- [ ] Y axis shows £ prefix on tick labels
- [ ] Tooltip on hover shows £X,XXX.XX format
- [ ] If all values are 0 for the period → EmptyState shown instead of chart

**Revenue by Service table:**
- [ ] Table renders with correct columns
- [ ] Clicking "Total Revenue" column header sorts descending, then ascending on second click
- [ ] Revenue values formatted as £X,XXX.XX

**Revenue by Staff table:**
- [ ] Same sorting behaviour as service table

**Revenue by Payment Method:**
- [ ] Payment method keys shown as human-readable labels (not raw DB values)

**CSV Export:**
- [ ] Clicking "Export CSV" triggers a file download
- [ ] Filename is `revenue-report-YYYY-MM-DD-to-YYYY-MM-DD.csv`
- [ ] File opens in Excel/Numbers with correct headers and data

**Loading / error states:**
- [ ] Skeleton placeholders visible briefly on slow connection
- [ ] ErrorState shown when network is disconnected

**API permissions:**
- [ ] `GET /wp-json/bookit/v1/dashboard/reports/revenue` returns 403 for staff users

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 5: Revenue report, DateRangeSelector component, CSV export"
```

Then report back "Task 5 complete ✅" and I'll prepare Task 6.