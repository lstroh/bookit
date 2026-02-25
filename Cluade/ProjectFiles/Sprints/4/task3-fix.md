The interceptor is the culprit. It creates a new `Error` object and copies the status onto it as `apiError.status` — not `apiError.response?.status`. So in the catch block, `err.response?.status` is always `undefined`, meaning the `!== 403` check always passes and `console.error` always runs.

The pre-check approach I gave you is still the cleanest solution and needs no changes to `useApi.js`. But the catch block in the stats fetch also needs the correct property. Here's the Cursor prompt for both fixes together:

---

```
In `bookit-booking-system/dashboard/src/views/MyProfile.vue`, make the following targeted changes to the stats-related code only. Do not modify anything else in the file.

Find the entire `loadStats` function and replace it with this exact implementation:

```js
const loadStats = async () => {
  // Check whether the setting is enabled before calling my-stats.
  // This avoids a guaranteed 403 and any console noise when earnings are hidden.
  try {
    const settingResponse = await api.get('settings?keys=show_staff_earnings')
    const enabled = settingResponse.data?.settings?.show_staff_earnings

    if (!enabled) {
      showStats.value = false
      return
    }
  } catch (err) {
    // Cannot read setting — hide section silently.
    showStats.value = false
    return
  }

  // Setting is enabled — fetch the stats.
  statsLoading.value = true
  try {
    const response = await api.get('my-stats')
    if (response.data.success) {
      stats.value = response.data.stats
      showStats.value = true
    }
  } catch (err) {
    // err.status (not err.response?.status) because useApi.js interceptor
    // maps the HTTP status onto the error object directly as err.status.
    if (err.status !== 403) {
      console.error('Failed to load stats:', err)
    }
    showStats.value = false
  } finally {
    statsLoading.value = false
  }
}
```

Do not change any other function, ref, or template in the file.
```

---

This fixes both issues in one go: the pre-check means the `my-stats` endpoint is never called when the setting is off (no 403 at all), and the catch block now correctly reads `err.status` instead of `err.response?.status` as a safety net for any unexpected errors. Clean console in all scenarios.