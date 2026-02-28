The `GET /dashboard/settings` endpoint is admin-only — staff don't have permission to read settings, so they always get a 403 on that pre-check call. The fix is simple: skip the setting check entirely for staff and just call `my-stats` directly. The backend already enforces the permission — if earnings are hidden, `my-stats` returns 403, and the pre-check approach for admin was just to avoid that. For staff, we let the backend decide and handle the 403 cleanly in the catch block.

Here's the Cursor prompt:

---

```
In `bookit-booking-system/dashboard/src/views/MyProfile.vue`, replace the entire `loadStats` function with this exact implementation. Do not change anything else in the file.

The `props.staff` object is already available in this component (it is passed in and used elsewhere in the file — check the existing script to confirm the exact prop name for the staff object and role field).

```js
const loadStats = async () => {
  // Determine the current user's role from the staff prop already available
  // in this component. Use the exact same prop/variable name already used
  // elsewhere in MyProfile.vue to access the staff role.
  const isAdmin = /* replace with: staff prop role check, e.g. props.staff?.role === 'admin' */ false

  if (isAdmin) {
    // Admin: check the setting before calling my-stats to avoid a 403.
    try {
      const settingResponse = await api.get('settings?keys=show_staff_earnings')
      const enabled = settingResponse.data?.settings?.show_staff_earnings
      if (!enabled) {
        showStats.value = false
        return
      }
    } catch (err) {
      showStats.value = false
      return
    }
  }

  // For staff (and admin when setting is enabled): call my-stats directly.
  // The backend returns 403 if earnings are hidden — handle that silently.
  statsLoading.value = true
  try {
    const response = await api.get('my-stats')
    if (response.data.success) {
      stats.value = response.data.stats
      showStats.value = true
    }
  } catch (err) {
    // err.status (not err.response?.status) — useApi.js interceptor maps
    // HTTP status onto err.status directly.
    if (err.status !== 403) {
      console.error('Failed to load stats:', err)
    }
    showStats.value = false
  } finally {
    statsLoading.value = false
  }
}
```

Before writing the code, read the existing `<script setup>` block in `MyProfile.vue` to find:
1. How the current staff/user object is accessed (prop name, variable name)
2. How the role is read from it

Then replace the `/* replace with: ... */` comment with the correct role check using the actual variable already in the file. Do not introduce any new props or imports.
```

---

Once applied, the behaviour will be:
- **Admin, setting OFF** → reads setting, gets `false`, returns early. No `my-stats` call, no console errors.
- **Admin, setting ON** → reads setting, gets `true`, calls `my-stats`, shows stats.
- **Staff, setting OFF** → skips setting check, calls `my-stats`, gets 403, caught silently. No console errors.
- **Staff, setting ON** → skips setting check, calls `my-stats`, gets 200, shows stats.