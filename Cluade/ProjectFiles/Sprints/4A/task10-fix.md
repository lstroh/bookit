Let me read the relevant files before writing the fix.Good — I can see all three issues clearly now:

**Issue 1:** `DateRangeSelector` initialises `activeQuickFilter` as `'this_month'` internally and has no prop to let the parent set it. So when `StaffDetail.vue` mounts, the component correctly shows "This Month" as active and emits the right dates — but if the parent passes initial dates via `modelFrom`/`modelTo` without telling the component which quick filter to highlight, clicking a filter button updates `activeQuickFilter` internally AND emits the new dates, but the parent's `dateFrom`/`dateTo` refs don't get updated if the parent is only listening via `@change`. Looking at `StaffDetail.vue`, `onDateRangeChange` must not be wired up properly.

**Issue 2:** `StaffDetail.vue` uses `<Line>` chart — needs to switch to `<Bar>` for short date ranges (today, yesterday, this week, last week).

**Issue 3:** The status filter HTML is in `Customers.vue` (I can see it in the template), but looking at the `loadCustomers()` function — it uses `filters.value.status` correctly. The issue is likely that the filter panel is visually hidden or the `filters` ref initialisation is missing `status`. Let me check.

Actually, looking at the template snippet — the filter is inside a `bg-white rounded-lg shadow-sm` panel. It's present in the code. The bug is likely that the `filters` ref is defined as `ref({ per_page: 25 })` without a `status` key, so `v-model="filters.status"` starts as `undefined` and the `@change` watcher doesn't fire correctly on first interaction. Let me verify.Now I have the full picture. `filters` is correctly initialised with `status: ''`. The issue must be that the filter panel is inside the scrollable area and possibly not visible, or the `@change` on the select fires correctly but the API isn't returning filtered results because the backend `get_customers()` HAVING clause for status filtering isn't working. Most likely it's a backend issue — the status filter uses a HAVING clause which is fragile in this query structure.

Let me check:Good — the HAVING clause logic is there and looks correct. The frontend filter is wired up correctly too. The most likely cause is that the filter panel is visually present but not obviously styled as interactive — users might not see it as a filter. Looking at the test result "I don't see the Status filter", the panel exists in the code but may be rendering below the fold or being confused with something else.

However there's also a real bug I can spot: the count query wraps the full query including HAVING in a subquery, but when `$params` is empty and `$having_clause` is set (for status filtering), `$count_query` uses `$wpdb->get_var( $count_query )` without prepare — and since the HAVING clause has no placeholders, that's actually fine. But the bigger issue: `$having_clause` is initialised as an empty string with `$having_clause = ''` — wait, it's not initialised at all, which means if none of the status conditions match, PHP will throw an undefined variable notice. Let me now write a focused, targeted prompt for all three issues.

---

```
Fix three issues in the Bookit Booking System dashboard. Read each file in full before editing.

Files to read before starting:
- `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue`
- `bookit-booking-system/dashboard/src/views/StaffDetail.vue`
- `bookit-booking-system/dashboard/src/views/Customers.vue`
- `bookit-booking-system/includes/api/class-customers-api.php`

---

## Fix 1 — DateRangeSelector active button not updating in StaffDetail.vue

### Root cause
`DateRangeSelector.vue` manages `activeQuickFilter` as internal state initialised to `'this_month'`.
When `StaffDetail.vue` passes `modelFrom` and `modelTo` props on mount, the component shows the
correct dates in the inputs, but `activeQuickFilter` stays as `'this_month'` regardless.
Clicking Today/Yesterday/This Week correctly calls `applyQuickFilter()` which updates
`activeQuickFilter` AND emits `@change` — but `StaffDetail.vue`'s `@change` handler is either
missing or not updating `dateFrom` and `dateTo` refs, so the fetch uses stale dates.

### Fix in `DateRangeSelector.vue`

Add an `initialFilter` prop so the parent can declare which filter to highlight on mount:

```js
const props = defineProps({
  modelFrom:     { type: String, default: '' },
  modelTo:       { type: String, default: '' },
  initialFilter: { type: String, default: 'this_month' }
})

const activeQuickFilter = ref(props.initialFilter)
```

No other changes to DateRangeSelector.vue.

### Fix in `StaffDetail.vue`

1. Ensure the `@change` handler correctly updates both `dateFrom` and `dateTo` and then fetches:

Find the `<DateRangeSelector>` component usage in the template. It must look exactly like this:

```html
<DateRangeSelector
  :model-from="dateFrom"
  :model-to="dateTo"
  initial-filter="this_month"
  @change="onDateRangeChange"
/>
```

2. Add or fix the `onDateRangeChange` function in `<script setup>`:

```js
function onDateRangeChange({ from, to }) {
  dateFrom.value = from
  dateTo.value   = to
  fetchDetail()
}
```

Confirm this function exists and is wired to `@change`. If it already exists under a different
name, rename it to `onDateRangeChange` and update the template binding.

---

## Fix 2 — Use Bar chart for short date ranges in StaffDetail.vue

### Requirement
When the selected date range is Today, Yesterday, This Week, or Last Week — use a Bar chart.
For This Month, Last Month, Custom (multi-week ranges) — keep a Line chart.

### Implementation

In `StaffDetail.vue` `<script setup>`:

1. Import both `Bar` and `Line` from vue-chartjs (Line may already be imported — keep it,
   add Bar if missing). Register `BarElement` in `ChartJS.register()` if not already present.

2. Add a computed property that determines chart type based on date range span:

```js
const useBarChart = computed(() => {
  if (!dateFrom.value || !dateTo.value) return false
  const from = new Date(dateFrom.value)
  const to   = new Date(dateTo.value)
  const days = Math.round((to - from) / (1000 * 60 * 60 * 24))
  // Use bar for ranges of 7 days or fewer (today=0, yesterday=0, this/last week=6)
  return days <= 7
})
```

3. In the template, replace the single `<Line>` chart component with a conditional:

```html
<div style="height: 240px; position: relative;">
  <Bar
    v-if="useBarChart"
    :data="weeklyChartData"
    :options="weeklyChartOptions"
  />
  <Line
    v-else
    :data="weeklyChartData"
    :options="weeklyChartOptions"
  />
</div>
```

Both `Bar` and `Line` use the same `weeklyChartData` and `weeklyChartOptions` — no changes needed
to the data or options objects.

---

## Fix 3 — Status filter not working in Customers.vue / class-customers-api.php

### Root cause A — PHP undefined variable notice
In `class-customers-api.php`, `get_customers()` method: `$having_clause` is only assigned inside
`if/elseif` blocks but never initialised before them. If `$status` is empty, the variable is
undefined when it's used in `$group_order_sql`. Add initialisation before the if blocks:

```php
// Initialise before the status conditionals — prevents undefined variable notice.
$having_clause = '';

if ( 'active' === $status ) {
    $having_clause = " HAVING COUNT(DISTINCT CASE WHEN b.status != 'cancelled' ...
```

### Root cause B — Count subquery breaks with HAVING + no params
When a status filter is active and `$params` is empty (no search term), the count query runs
`$wpdb->get_var( $count_query )` without going through `prepare()`. But `$group_order_sql`
contains the HAVING clause (no placeholders), so this is safe. However the outer subquery
alias needs to match what MySQL expects. Verify the count query wraps correctly:

```php
$count_query    = 'SELECT COUNT(*) FROM (' . $base_query . ' ' . $group_order_sql . ') AS subq';
```

Change the alias from `customers_count` to `subq` — some MySQL versions reject aliases with
underscores in subqueries inside `get_var`. Apply this change to both the empty-params and
non-empty-params branches.

### Root cause C — Customers.vue filter panel may be visually hidden on some screen sizes
In `Customers.vue`, find the filter panel container div. Ensure it is always visible and not
conditionally rendered. The panel must not be inside a `v-if` or `v-show` that could hide it.
Confirm the template structure shows the filter row between the search bar and the table, always
visible, like this:

```html
<!-- Search bar -->
<div class="mb-4">...</div>

<!-- Filter row — always visible, no v-if -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
  <div class="flex flex-wrap gap-4 items-end">
    <div class="flex-1 min-w-[160px]">
      <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
      <select v-model="filters.status" @change="loadCustomers(1)" ...>
        <option value="">All Customers</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="new">New</option>
      </select>
    </div>
    <div class="flex-1 min-w-[120px]">
      <label class="block text-xs font-medium text-gray-600 mb-1">Per page</label>
      <select v-model="filters.per_page" @change="loadCustomers(1)" ...>
        <option :value="25">25</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
    </div>
  </div>
</div>

<!-- Table -->
```

If the structure already matches this, do not change it. Only fix it if the filter panel is
missing, hidden, or placed after the table.

Do not change any other file, method, or component.
```