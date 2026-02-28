All three files are confirmed updated correctly. One minor thing to tidy up — `schema.sql` has the Migration 5 entry duplicated (once from Cursor adding it during Task 1, and once from the manual update). It's harmless but worth deleting the first shorter version so only the detailed one remains. You can do that now or at the end of the sprint when you do a final tidy-up — your call.

Everything else looks perfect. On to Task 3.

---

```
Sprint 4A Progress: 2/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
⏭️ Task 3:  Staff Earnings Display (6h)  — NEXT
□  Task 4:  Reports Nav + Overview Dashboard (8h)
□  Task 5:  Revenue Report (14h)
□  Task 6:  Booking Analytics (10h)
□  Task 7:  Staff Performance Report (10h)
□  Task 8:  Customer Database + GDPR (16h)
□  Task 9:  PHPUnit Tests (12h)
□  Task 10: Manual Testing & Polish (4h)

Hours completed: 34 / 112
```

---

Let me read the files I need before writing the prompt.Good — I have everything I need. The `get_settings` / `update_settings` endpoints already exist and handle arbitrary key/value pairs, so the `show_staff_earnings` toggle needs no new PHP endpoints — just a new key stored via the existing settings infrastructure. The `my-stats` endpoint is the only new backend work. And `MyProfile.vue` structure is clear.

---

## Task 3 — Cursor Composer Prompt

Paste the entire block below into Cursor Composer:

---

```
You are implementing Task 3 of Sprint 4A for the Bookit Booking System WordPress plugin: Staff Earnings Display.

Read every file referenced below before writing any code. Do not duplicate or modify anything not explicitly listed as a deliverable.

---

## CONTEXT — READ BEFORE CODING

### Files to read in full before starting:
- `bookit-booking-system/includes/api/class-dashboard-bookings-api.php` — the ENTIRE file. You will add one new method and one new route. Do not create a new class.
- `bookit-booking-system/includes/class-bookit-auth.php` — for Bookit_Auth::get_current_staff()
- `bookit-booking-system/dashboard/src/views/MyProfile.vue` — read in full. You are adding a section to this file. Do not restructure or remove anything existing.
- `bookit-booking-system/database/schema.sql` — specifically `wp_bookings_payments` and `wp_bookings` columns

### What already exists — do NOT duplicate:
- `GET /dashboard/settings?keys=...` — reads one or more settings by key
- `POST /dashboard/settings` — upserts settings by key/value pairs
- Both are already in `class-dashboard-bookings-api.php`. The `show_staff_earnings` toggle uses these existing endpoints — no new settings endpoints needed.

---

## PART A — BACKEND: One new endpoint in `class-dashboard-bookings-api.php`

### Add to `register_routes()`:

```
GET /dashboard/my-stats
  permission_callback: check_dashboard_permission
  No params — uses session staff_id
```

### Add method `get_my_stats( $request )`:

1. Get `$current_staff` via `Bookit_Auth::get_current_staff()`

2. Check the `show_staff_earnings` setting:
```php
global $wpdb;
$show_earnings = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT setting_value FROM {$wpdb->prefix}bookings_settings
         WHERE setting_key = %s",
        'show_staff_earnings'
    )
);

if ( ! $show_earnings || '0' === $show_earnings || 'false' === $show_earnings ) {
    return new WP_Error(
        'earnings_hidden',
        __( 'Earnings display is disabled.', 'bookit-booking-system' ),
        array( 'status' => 403 )
    );
}
```

3. Calculate stats for three periods using Europe/London timezone.
   Use `new DateTimeImmutable('now', new DateTimeZone('Europe/London'))` — never `date()` or `time()` directly.

   - **This week:** Monday 00:00:00 to Sunday 23:59:59 of current week
   - **This month:** First day of current month 00:00:00 to last day 23:59:59
   - **All time:** No date filter

4. For each period, run this query pattern (adjust WHERE clause for date range):
```php
$result = $wpdb->get_row(
    $wpdb->prepare(
        "SELECT
            COUNT(DISTINCT b.id) AS booking_count,
            COALESCE(SUM(p.amount), 0) AS revenue
        FROM {$wpdb->prefix}bookings b
        LEFT JOIN {$wpdb->prefix}bookings_payments p
            ON p.booking_id = b.id
            AND p.payment_status = 'completed'
        WHERE b.staff_id = %d
          AND b.status = 'completed'
          AND b.deleted_at IS NULL
          AND b.booking_date BETWEEN %s AND %s",
        $current_staff['id'],
        $date_from,
        $date_to
    ),
    ARRAY_A
);
```

For the all-time query, omit the `booking_date BETWEEN` clause entirely — use a separate query without date params.

5. Return:
```json
{
  "success": true,
  "stats": {
    "this_week": {
      "booking_count": 8,
      "revenue": 420.00,
      "period_label": "This Week"
    },
    "this_month": {
      "booking_count": 34,
      "revenue": 1820.50,
      "period_label": "This Month"
    },
    "all_time": {
      "booking_count": 412,
      "revenue": 21640.00,
      "period_label": "All Time"
    }
  }
}
```

Revenue values must be cast to `(float)` — do not return strings.

---

## PART B — FRONTEND: Modify `MyProfile.vue`

### Add an admin-only settings toggle in the Settings page:

Do NOT add this to `MyProfile.vue`. Instead, read `Settings.vue` — the `show_staff_earnings` toggle should live there. Find the appropriate section in `Settings.vue` (likely the "Staff" or "General" section) and add:

- A labelled toggle: "Show earnings to staff members"
- Subtitle: "When enabled, staff can see their own booking count and revenue on their profile page"
- On change: call `POST /dashboard/settings` with `{ settings: { show_staff_earnings: true/false } }` using the same pattern as other toggles in `Settings.vue`
- On load: call `GET /dashboard/settings?keys=show_staff_earnings` to get the current value
- Default to `false` if the setting does not exist yet

### Modify `MyProfile.vue` — add "My Stats" section:

Read the existing file structure carefully. Add the stats section at the **bottom** of the page content, after all existing sections (profile form and password form), but before the closing `</div>` of the main content wrapper.

**Section structure:**

```
<!-- My Stats Section -->
<div v-if="showStats" class="bg-white rounded-lg shadow-sm border border-gray-200">
  <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
    <h2 class="text-base sm:text-lg font-semibold text-gray-900">My Stats</h2>
    <p class="text-sm text-gray-500 mt-1">Your booking performance</p>
  </div>
  <div class="px-4 sm:px-6 py-6">

    <!-- Loading state -->
    <div v-if="statsLoading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- 3 skeleton placeholder divs, h-24 bg-gray-100 animate-pulse rounded-lg -->
    </div>

    <!-- Stats tiles -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="(stat, key) in stats"
        :key="key"
        class="bg-gray-50 rounded-lg p-4 border border-gray-200"
      >
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {{ stat.period_label }}
        </p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ stat.booking_count }}
          <span class="text-sm font-normal text-gray-500">bookings</span>
        </p>
        <p class="text-lg font-semibold text-primary-600 mt-1">
          £{{ formatCurrency(stat.revenue) }}
        </p>
      </div>
    </div>

  </div>
</div>
```

**Script additions to `MyProfile.vue`** — add to the existing `<script setup>` block:

```js
// Stats state
const showStats = ref(false)
const statsLoading = ref(false)
const stats = ref(null)

// Format currency: 1820.5 → "1,820.50"
const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const response = await api.get('my-stats')
    if (response.data.success) {
      stats.value = response.data.stats
      showStats.value = true
    }
  } catch (err) {
    // 403 means earnings are hidden — silently do nothing (section stays hidden)
    // Any other error: also hide the section (don't show an error to staff)
    showStats.value = false
  } finally {
    statsLoading.value = false
  }
}
```

In the existing `onMounted` hook (which already calls `loadProfile()`), add `loadStats()` as an additional call:
```js
onMounted(() => {
  loadProfile()
  loadStats()
})
```

**Important behaviour:**
- `showStats` starts as `false`. It only becomes `true` if the API returns a 200 success.
- If the API returns 403 (earnings hidden), the catch block runs and `showStats` stays `false` — the section is completely absent from the DOM, not hidden with CSS.
- No error message is shown to staff when the section is hidden — it simply does not appear.
- Do not add any `v-if` based on role — the backend enforces the permission. The frontend just responds to what the API returns.

---

## CODING STANDARDS

- PHP: WordPress Coding Standards. Use `DateTimeImmutable` with `DateTimeZone('Europe/London')` for all date calculations.
- All DB queries: `$wpdb->prepare()`. No raw interpolation.
- Vue: `<script setup>`, no Options API.
- Tailwind only — no custom CSS.
- All PHP user-visible strings: `__( '...', 'bookit-booking-system' )`
- Do not remove, rename, or refactor any existing method, route, or section of `MyProfile.vue`.

---

## DELIVERABLES SUMMARY

1. MODIFIED: `bookit-booking-system/includes/api/class-dashboard-bookings-api.php`
   - 1 new route in `register_routes()`
   - 1 new method: `get_my_stats()`
2. MODIFIED: `bookit-booking-system/dashboard/src/views/Settings.vue`
   - "Show earnings to staff members" toggle added
3. MODIFIED: `bookit-booking-system/dashboard/src/views/MyProfile.vue`
   - "My Stats" section added at bottom
   - `showStats`, `statsLoading`, `stats` refs added
   - `loadStats()` method added
   - `formatCurrency()` helper added
   - `loadStats()` called in `onMounted()`
```

---

## ✅ Task 3 Testing Checklist

**Settings toggle:**
- [ ] Navigate to Settings page — "Show earnings to staff members" toggle is visible (admin only)
- [ ] Toggle is OFF by default on a fresh setup
- [ ] Toggling ON saves immediately (or on save button, whichever pattern Settings.vue uses) — confirm in database: `wp_bookings_settings` row with `setting_key = 'show_staff_earnings'` and `setting_value = '1'` or `'true'`
- [ ] Toggling OFF saves and updates the database row

**Stats hidden (toggle OFF):**
- [ ] Navigate to My Profile — no "My Stats" section visible at all
- [ ] Check browser console — no errors (the 403 is caught silently)
- [ ] Log in as a staff user (not admin) with toggle OFF — same result, no stats section

**Stats visible (toggle ON):**
- [ ] Turn the toggle ON in Settings
- [ ] Navigate to My Profile — "My Stats" section appears at the bottom of the page
- [ ] Three tiles visible: "This Week", "This Month", "All Time"
- [ ] Each tile shows a booking count and a revenue figure in £
- [ ] Revenue is formatted with commas and 2 decimal places (e.g., "£1,820.50")
- [ ] Log in as a staff user — stats section also appears (toggle applies to all roles)

**Data accuracy:**
- [ ] Mark 2–3 bookings as "completed" for your logged-in staff account
- [ ] Reload My Profile — booking count reflects those completions
- [ ] Confirm only `completed` status bookings are counted (not confirmed, cancelled etc.)
- [ ] Confirm revenue comes from `wp_bookings_payments` joined to those bookings

**Loading state:**
- [ ] On a slow connection (throttle in DevTools), the 3 skeleton placeholders are visible briefly before the tiles appear

**Edge cases:**
- [ ] Staff member with zero completed bookings — tiles show "0 bookings" and "£0.00" (not blank or error)

---

Once all boxes are ticked, commit with:
```
git commit -m "Sprint 4A, Task 3: Staff earnings display, my-stats endpoint, show_staff_earnings setting"
```

Then report back "Task 3 complete ✅" and I'll prepare Task 4.