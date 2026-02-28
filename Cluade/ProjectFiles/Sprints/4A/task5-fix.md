Looks like issue 4 got cut off — could you share what it was?

In the meantime I can address 1, 2, and 3 clearly. Here's the Cursor prompt for all three fixes:

---

```
In the Bookit Booking System, make the following targeted fixes. Read each file before editing it. Do not change anything not listed below.

---

## Fix 1 — Use Bar chart instead of Line chart in RevenueReport.vue

In `bookit-booking-system/dashboard/src/views/RevenueReport.vue`:

- Remove the `Line` import from vue-chartjs
- Remove `LineElement` and `PointElement` from the chart.js imports and from `ChartJS.register()`
- Replace the `<Line>` component in the template with `<Bar>` (Bar is already registered from Reports.vue pattern — confirm it is imported, add if missing)
- Remove the `tension: 0.3` line option from chartOptions if present (that is a Line-only option)
- Keep everything else identical — same data, same axes, same tooltip formatting

---

## Fix 2 — Validate date_from is before date_to in DateRangeSelector.vue

In `bookit-booking-system/dashboard/src/components/DateRangeSelector.vue`:

In the `applyCustomRange()` function, add this validation before emitting:

```js
function applyCustomRange() {
  if (!localFrom.value || !localTo.value) return

  if (localFrom.value > localTo.value) {
    alert('The start date must be before the end date.')
    return
  }

  activeQuickFilter.value = 'custom'
  emit('change', { from: localFrom.value, to: localTo.value })
}
```

Also add the same check to `onDateChange()` so that if someone manually types dates and both are filled but in the wrong order, a clear visual error is shown. Add a reactive `dateError` ref and display it as a small red text below the date inputs:

```js
const dateError = ref('')

function onDateChange() {
  activeQuickFilter.value = 'custom'
  if (localFrom.value && localTo.value && localFrom.value > localTo.value) {
    dateError.value = 'Start date must be before end date.'
  } else {
    dateError.value = ''
  }
}
```

In the template, add this below the date inputs row:
```html
<p v-if="dateError" class="text-xs text-red-600 mt-1">{{ dateError }}</p>
```

Also disable the Apply button when dateError is set:
```html
:disabled="!!dateError || !localFrom || !localTo"
```

---

## Fix 3 — CSV export route returns 404

The issue is that `window.location.href` is firing a GET request but the route may be registered as a different method, or the nonce is being passed incorrectly as a query param which WordPress REST API does not accept for authentication (it requires the X-WP-Nonce header, not a query param).

### Fix 3a — Backend: verify the export route is registered correctly

In `bookit-booking-system/includes/api/class-reports-api.php`, find the export route registration. It must look exactly like this:

```php
register_rest_route(
    self::NAMESPACE,
    '/dashboard/reports/revenue/export',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'export_revenue_csv' ),
        'permission_callback' => array( $this, 'check_admin_permission' ),
        'args'                => array(
            'date_from' => array(
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'date_to'   => array(
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    )
);
```

Confirm this registration exists. If the route path differs in any way, correct it.

### Fix 3b — Backend: authenticate via nonce cookie, not header

The `check_admin_permission()` method uses `Bookit_Auth::is_logged_in()` which checks the PHP session — NOT the WordPress nonce. This means `window.location.href` navigation (which sends cookies) will work correctly as long as the session cookie is present.

Remove the `_wpnonce` parameter from the export URL entirely. The session cookie handles authentication.

### Fix 3c — Frontend: fix the export button implementation

In `bookit-booking-system/dashboard/src/views/RevenueReport.vue`, replace the export button click handler with:

```js
function exportCsv() {
  const base = window.BOOKIT_DASHBOARD.apiBase
  // apiBase ends with a slash e.g. "http://site.local/wp-json/bookit/v1/"
  // Build URL without nonce — session cookie authenticates.
  const url = `${base}dashboard/reports/revenue/export?date_from=${dateFrom.value}&date_to=${dateTo.value}`
  window.open(url, '_blank')
}
```

Use `window.open(url, '_blank')` rather than `window.location.href` so the current page is not navigated away.

Update the button in the template to call `@click="exportCsv"`.

---

Do not change any other files, methods, or routes.
```

---

Send me issue 4 when you have it and I'll fold it into a follow-up fix.