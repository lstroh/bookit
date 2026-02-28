```
Sprint 4A Progress: 5/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
⏭️ Task 6:  Booking Analytics (10h)  — NEXT
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 62 / 112
```

Let me read what I need before writing the prompt.Good — I have everything I need. The requirements doc is detailed on what this page needs: popular days, popular times, lead time distribution, cancellation analysis, utilisation rate, and a peak hours heatmap. I'll scope this to the most valuable items for Phase 1 and keep the heatmap as the centrepiece since it's visually distinctive.

---

## Task 6 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 6 of Sprint 4A for the Bookit Booking System WordPress plugin: Booking Analytics.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/api/class-reports-api.php` — add new routes and methods here only
- `bookit-booking-system/database/schema.sql` — specifically wp_bookings columns: booking_date, start_time, status, created_at, cancelled_at, cancellation_reason
- `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue` — import and reuse this component
- `bookit-booking-system/dashboard/src/views/RevenueReport.vue` — copy loading/error state patterns and DateRangeSelector usage

### What already exists — do NOT duplicate:
- `check_admin_permission()` — already in class-reports-api.php
- `DateRangeSelector.vue` — already created in Task 5, import it, do not recreate
- Chart.js and vue-chartjs already installed
- Bar and Line already registered — only add new chart types if needed
- `BookingAnalytics.vue` stub already exists at `dashboard/src/views/BookingAnalytics.vue` — replace it entirely

---

## PART A — BACKEND: Add to `class-reports-api.php`

### Add to `register_routes()`:

```
GET /dashboard/reports/analytics
  permission_callback: check_admin_permission
  args:
    date_from: optional, YYYY-MM-DD, default = 30 days ago
    date_to:   optional, YYYY-MM-DD, default = today
```

### Add method `get_booking_analytics( $request )`:

Parse date params. Default `date_from` = 30 days ago, `date_to` = today (Europe/London).

**1. Summary metrics:**
```php
// Total bookings in period (all statuses except deleted).
$total = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $date_from, $date_to
) );

// Completed bookings.
$completed = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE status = 'completed' AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $date_from, $date_to
) );

// Cancelled bookings.
$cancelled = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE status = 'cancelled' AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $date_from, $date_to
) );

// No-show bookings.
$no_show = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}bookings
     WHERE status = 'no_show' AND booking_date BETWEEN %s AND %s AND deleted_at IS NULL",
    $date_from, $date_to
) );

// Completion rate.
$completion_rate = $total > 0 ? round( ($completed / $total) * 100, 1 ) : 0.0;
$cancellation_rate = $total > 0 ? round( ($cancelled / $total) * 100, 1 ) : 0.0;
$no_show_rate = $total > 0 ? round( ($no_show / $total) * 100, 1 ) : 0.0;
```

**2. Bookings by day of week:**
```php
// DAYOFWEEK: 1=Sunday, 2=Monday ... 7=Saturday
// Remap to UK order: 1=Monday ... 7=Sunday
$by_dow = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        DAYOFWEEK(booking_date) AS dow_mysql,
        COUNT(*) AS booking_count
     FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status NOT IN ('cancelled')
     GROUP BY DAYOFWEEK(booking_date)
     ORDER BY DAYOFWEEK(booking_date) ASC",
    $date_from, $date_to
), ARRAY_A );

// Remap to UK days array Mon-Sun with zeros for missing days.
$day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// MySQL DAYOFWEEK: Sun=1,Mon=2,Tue=3,Wed=4,Thu=5,Fri=6,Sat=7
// UK index mapping: Mon=2,Tue=3,Wed=4,Thu=5,Fri=6,Sat=7,Sun=1
$dow_to_uk = [2=>0, 3=>1, 4=>2, 5=>3, 6=>4, 7=>5, 1=>6];
$dow_data = array_fill(0, 7, 0);
foreach ($by_dow as $row) {
    $uk_idx = $dow_to_uk[(int)$row['dow_mysql']];
    $dow_data[$uk_idx] = (int)$row['booking_count'];
}
```

**3. Bookings by hour (popular time slots):**
```php
$by_hour = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        HOUR(start_time) AS hour,
        COUNT(*) AS booking_count
     FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status NOT IN ('cancelled')
     GROUP BY HOUR(start_time)
     ORDER BY HOUR(start_time) ASC",
    $date_from, $date_to
), ARRAY_A );

// Build 24-element array, fill missing hours with 0.
// But only return hours 7–21 (7am to 9pm) — service businesses don't operate outside these.
$hour_labels = [];
$hour_data = [];
for ($h = 7; $h <= 21; $h++) {
    $hour_labels[] = sprintf('%02d:00', $h);
    $hour_data[] = 0;
}
foreach ($by_hour as $row) {
    $h = (int)$row['hour'];
    if ($h >= 7 && $h <= 21) {
        $hour_data[$h - 7] = (int)$row['booking_count'];
    }
}
```

**4. Peak hours heatmap (day of week × hour):**
```php
$heatmap_raw = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        DAYOFWEEK(booking_date) AS dow_mysql,
        HOUR(start_time) AS hour,
        COUNT(*) AS booking_count
     FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status NOT IN ('cancelled')
     GROUP BY DAYOFWEEK(booking_date), HOUR(start_time)",
    $date_from, $date_to
), ARRAY_A );

// Build 7×15 matrix (7 days Mon-Sun, hours 7-21).
// Return as array of { day: 'Mon', hour: '09:00', count: 5 } objects.
$heatmap = [];
foreach ($heatmap_raw as $row) {
    $uk_day = $day_labels[$dow_to_uk[(int)$row['dow_mysql']]];
    $h = (int)$row['hour'];
    if ($h >= 7 && $h <= 21) {
        $heatmap[] = [
            'day'   => $uk_day,
            'hour'  => sprintf('%02d:00', $h),
            'count' => (int)$row['booking_count'],
        ];
    }
}
```

**5. Booking lead time distribution:**
```php
// Lead time = days between created_at date and booking_date.
$lead_times = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        DATEDIFF(booking_date, DATE(created_at)) AS lead_days
     FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status NOT IN ('cancelled')
       AND DATEDIFF(booking_date, DATE(created_at)) >= 0",
    $date_from, $date_to
), ARRAY_A );

// Bucket into: same_day(0), one_to_three(1-3), four_to_seven(4-7),
//              eight_to_fourteen(8-14), fifteen_plus(15+)
$buckets = [
    'same_day'        => 0,
    'one_to_three'    => 0,
    'four_to_seven'   => 0,
    'eight_to_fourteen' => 0,
    'fifteen_plus'    => 0,
];
$total_lead = 0;
$sum_lead   = 0;
foreach ($lead_times as $row) {
    $d = (int)$row['lead_days'];
    $total_lead++;
    $sum_lead += $d;
    if ($d === 0)       $buckets['same_day']++;
    elseif ($d <= 3)    $buckets['one_to_three']++;
    elseif ($d <= 7)    $buckets['four_to_seven']++;
    elseif ($d <= 14)   $buckets['eight_to_fourteen']++;
    else                $buckets['fifteen_plus']++;
}
$avg_lead_days = $total_lead > 0 ? round($sum_lead / $total_lead, 1) : 0.0;
```

**6. Bookings over time (daily count trend):**
Reuse existing `get_daily_revenue()` pattern but count bookings instead of revenue:
```php
$daily_count = $wpdb->get_results( $wpdb->prepare(
    "SELECT
        DATE(booking_date) AS date,
        COUNT(*) AS booking_count
     FROM {$wpdb->prefix}bookings
     WHERE booking_date BETWEEN %s AND %s
       AND deleted_at IS NULL
       AND status NOT IN ('cancelled')
     GROUP BY DATE(booking_date)
     ORDER BY DATE(booking_date) ASC",
    $date_from, $date_to
), ARRAY_A );

// Fill missing dates with 0 using DatePeriod loop — same pattern as get_daily_revenue().
```

**Return structure:**
```json
{
  "success": true,
  "date_from": "2026-01-26",
  "date_to": "2026-02-25",
  "summary": {
    "total_bookings": 42,
    "completed": 28,
    "cancelled": 6,
    "no_show": 3,
    "completion_rate": 66.7,
    "cancellation_rate": 14.3,
    "no_show_rate": 7.1,
    "avg_lead_days": 4.2
  },
  "by_day_of_week": {
    "labels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "data": [8,6,7,9,10,12,4]
  },
  "by_hour": {
    "labels": ["07:00","08:00",...,"21:00"],
    "data": [0,2,5,...]
  },
  "heatmap": [
    { "day": "Mon", "hour": "09:00", "count": 5 },
    ...
  ],
  "lead_time": {
    "avg_days": 4.2,
    "buckets": {
      "same_day": 8,
      "one_to_three": 15,
      "four_to_seven": 12,
      "eight_to_fourteen": 5,
      "fifteen_plus": 2
    }
  },
  "daily_trend": [
    { "date": "2026-01-26", "count": 3 },
    ...
  ]
}
```

---

## PART B — FRONTEND: Replace `BookingAnalytics.vue` stub

Replace the entire contents of `bookit-booking-system/dashboard/src/views/BookingAnalytics.vue`.

### Chart.js registrations needed (add to existing ChartJS.register() if not already present):
- For heatmap: not a native Chart.js type — implement as a pure CSS/Tailwind grid (see below)
- For bar and line charts: already registered from Reports.vue, confirm they are imported here too

### Page layout:

```
Header: "Booking Analytics" + subtitle "Understand your booking patterns"

DateRangeSelector (default: last 30 days)
  On @change: re-fetch analytics

Summary cards (6 cards, 2×3 on mobile, 6-column on desktop):
  Card 1: Total Bookings — count
  Card 2: Completed — count, green
  Card 3: Cancelled — count, red if > 0
  Card 4: No-Shows — count, amber if > 0
  Card 5: Completion Rate — X.X%, green if ≥ 70%, amber if 50-70%, red if < 50%
  Card 6: Avg Lead Time — X.X days

Alerts (conditional, show below summary cards):
  - If cancellation_rate > 10%:
    Amber alert: "⚠️ High cancellation rate (X.X%). Consider reviewing your cancellation policy."
  - If no_show_rate > 10%:
    Amber alert: "⚠️ High no-show rate (X.X%). Consider sending reminder notifications."
  - If total_bookings < 10:
    Blue info: "ℹ️ Not enough data for meaningful analysis. Try a longer date range."

Section 1 — Bookings Over Time (bar chart):
  Title: "Bookings Over Time"
  Bar chart: X=date (DD/MM), Y=booking count
  Colour: #6366F1 (indigo)
  Wrapped in div style="height: 260px; position: relative;"
  Hidden (replaced by "not enough data" notice) when total_bookings < 10

Section 2 — Two charts side by side (stack on mobile):
  Left: "Popular Days" — horizontal bar chart
    Labels: Mon/Tue/Wed/Thu/Fri/Sat/Sun
    Bars: booking count per day
    Colour: #3B82F6 (blue)
    indexAxis: 'y' (horizontal bars)
    div style="height: 240px; position: relative;"

  Right: "Popular Times" — horizontal bar chart
    Labels: 07:00 through 21:00
    Colour: #8B5CF6 (purple)
    indexAxis: 'y' (horizontal bars)
    div style="height: 360px; position: relative;"

Section 3 — Peak Hours Heatmap:
  Title: "Peak Hours Heatmap"
  Subtitle: "Booking volume by day and time — darker = busier"
  
  Implement as a CSS grid — NOT a Chart.js chart.
  
  Structure:
  - Column headers: hours 07:00–21:00 (15 columns)
  - Row headers: Mon–Sun (7 rows)
  - Each cell: coloured square where opacity/darkness = count relative to max count
  - Cell colour: bg-blue-{intensity} where intensity scales from 50 (0 bookings) to 900 (max bookings)
  
  Implementation approach:
  ```js
  // Find max count across all heatmap cells for normalisation.
  const maxCount = computed(() => 
    Math.max(1, ...analyticsData.value.heatmap.map(h => h.count))
  )
  
  // Get count for a specific day/hour cell.
  function getHeatmapCount(day, hour) {
    const cell = analyticsData.value.heatmap.find(
      h => h.day === day && h.hour === hour
    )
    return cell ? cell.count : 0
  }
  
  // Get Tailwind bg class based on count relative to max.
  function getHeatmapClass(count) {
    if (count === 0) return 'bg-gray-100'
    const ratio = count / maxCount.value
    if (ratio < 0.2) return 'bg-blue-100'
    if (ratio < 0.4) return 'bg-blue-200'
    if (ratio < 0.6) return 'bg-blue-400'
    if (ratio < 0.8) return 'bg-blue-600'
    return 'bg-blue-800'
  }
  ```
  
  Template:
  ```html
  <div class="overflow-x-auto">
    <div class="min-w-max">
      <!-- Hour headers row -->
      <div class="flex">
        <div class="w-12 shrink-0"></div> <!-- spacer for day labels -->
        <div
          v-for="hour in hours"
          :key="hour"
          class="w-10 text-center text-xs text-gray-400 pb-1"
        >{{ hour.slice(0,5) }}</div>
      </div>
      <!-- Day rows -->
      <div v-for="day in days" :key="day" class="flex items-center mb-1">
        <div class="w-12 shrink-0 text-xs text-gray-500 font-medium">{{ day }}</div>
        <div
          v-for="hour in hours"
          :key="hour"
          class="w-10 h-8 mx-0.5 rounded cursor-default transition-colors"
          :class="getHeatmapClass(getHeatmapCount(day, hour))"
          :title="`${day} ${hour}: ${getHeatmapCount(day, hour)} bookings`"
        ></div>
      </div>
    </div>
  </div>
  ```
  
  Where:
  ```js
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const hours = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00',
                 '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00']
  ```

Section 4 — Booking Lead Time:
  Title: "Booking Lead Time"
  Subtitle: "How far in advance customers book — avg X.X days"
  
  Bar chart: 5 bars
  Labels: ["Same Day", "1–3 Days", "4–7 Days", "8–14 Days", "15+ Days"]
  Data: from lead_time.buckets
  Colour: #10B981 (green)
  div style="height: 220px; position: relative;"
```

**Script logic:**
```js
// Default date range: last 30 days
// On mount: set defaults, fetch analytics
// On DateRangeSelector @change: update dates, re-fetch

// fetchAnalytics() calls GET /dashboard/reports/analytics?date_from=...&date_to=...
// stores response in analyticsData ref

// All chart data as computed properties derived from analyticsData
// so they reactively update when data changes
```

**Chart options for horizontal bar charts:**
```js
const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } }
  }
}
```

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. `DateTimeImmutable` + `DateTimeZone('Europe/London')`. All queries via `$wpdb->prepare()`.
- Vue: `<script setup>`, Tailwind only, no Options API.
- All PHP strings: `__( '...', 'bookit-booking-system' )`
- Do not modify any other existing file except class-reports-api.php and BookingAnalytics.vue.

---

## DELIVERABLES SUMMARY

1. MODIFIED: `bookit-booking-system/includes/api/class-reports-api.php`
   - 1 new route: `GET /dashboard/reports/analytics`
   - 1 new method: `get_booking_analytics()`
2. MODIFIED: `bookit-booking-system/dashboard/src/views/BookingAnalytics.vue` — full implementation replacing stub
```

---

## ✅ Task 6 Testing Checklist

**Navigation:**
- [ ] Click "Bookings" in Reports sidebar → `/reports/bookings` loads without errors

**Date range:**
- [ ] Default range is last 30 days (verify dates shown in selector)
- [ ] Changing date range re-fetches and updates all charts

**Summary cards:**
- [ ] All 6 cards visible with correct values
- [ ] Completion rate colour correct (green/amber/red based on thresholds)

**Alerts:**
- [ ] Set a date range with few bookings → "Not enough data" info banner appears
- [ ] If cancellation rate > 10% → amber warning shown

**Bookings Over Time chart:**
- [ ] Bar chart renders with DD/MM x-axis labels
- [ ] Hidden when < 10 bookings in range

**Popular Days chart:**
- [ ] Horizontal bar chart, Mon–Sun labels
- [ ] Correct booking counts per day

**Popular Times chart:**
- [ ] Horizontal bar chart, 07:00–21:00 labels
- [ ] Correct booking counts per hour

**Peak Hours Heatmap:**
- [ ] 7 day rows × 15 hour columns grid visible
- [ ] Cells with no bookings show light gray
- [ ] Busier cells show darker blue
- [ ] Hovering a cell shows tooltip: "Tue 10:00: 3 bookings"
- [ ] Scrolls horizontally on small screens

**Lead Time chart:**
- [ ] 5-bar chart with correct bucket labels
- [ ] Avg lead days shown in section subtitle

**API permissions:**
- [ ] `GET /dashboard/reports/analytics` returns 403 for staff users

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 6: Booking analytics, heatmap, lead time, popular times/days"
```

Then report back "Task 6 complete ✅" and I'll prepare Task 7.