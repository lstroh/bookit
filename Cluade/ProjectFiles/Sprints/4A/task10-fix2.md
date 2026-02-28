Perfect, I have everything I need. Clean and targeted change — only `Sidebar.vue` needs to be modified.

---

```
In `bookit-booking-system/dashboard/src/components/Sidebar.vue`, add collapsible section headers for the Reports and Settings admin sections. Read the file in full before editing. Do not change App.vue or any other file.

---

## Behaviour

- Reports and Settings section headers become clickable toggle buttons
- Default state: both collapsed (items hidden)
- State persists via localStorage — key `bookit_sidebar_reports_open` and `bookit_sidebar_settings_open`
- On mount: restore state from localStorage (default false if not set)
- When a section is collapsed: only the section header is visible, nav items are hidden
- When expanded: nav items appear with a smooth slide-down animation
- The section header shows a chevron icon: ▼ when expanded, ▶ when collapsed
- Auto-expand: if the current route matches any item in a collapsed section, that section
  auto-expands on mount so the active item is always visible

---

## Script changes

Add to `<script setup>`:

```js
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Collapsible section state — default collapsed
const reportsOpen   = ref(false)
const settingsOpen  = ref(false)

onMounted(() => {
  // Restore from localStorage
  const storedReports  = localStorage.getItem('bookit_sidebar_reports_open')
  const storedSettings = localStorage.getItem('bookit_sidebar_settings_open')

  reportsOpen.value  = storedReports  === 'true'
  settingsOpen.value = storedSettings === 'true'

  // Auto-expand if current route is inside a collapsed section
  const inReports  = reportsNavigation.some(
    item => route.path === item.path || route.path.startsWith(item.path + '/')
  )
  const inSettings = settingsNavigation.some(
    item => route.path === item.path
  )

  if (inReports)  reportsOpen.value  = true
  if (inSettings) settingsOpen.value = true
})

function toggleReports() {
  reportsOpen.value = !reportsOpen.value
  localStorage.setItem('bookit_sidebar_reports_open', String(reportsOpen.value))
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  localStorage.setItem('bookit_sidebar_settings_open', String(settingsOpen.value))
}
```

---

## Template changes

### Reports section

Replace the existing Reports section block with:

```html
<!-- Reports Section (Admin Only) -->
<div class="border-t border-gray-200">
  <button
    @click="toggleReports"
    class="w-full flex items-center justify-between px-4 pt-4 pb-2 text-left"
    :aria-expanded="reportsOpen"
    aria-controls="reports-nav"
  >
    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</span>
    <svg
      class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
      :class="reportsOpen ? 'rotate-90' : 'rotate-0'"
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>

  <div
    id="reports-nav"
    v-show="reportsOpen"
    class="px-4 pb-2 space-y-1"
  >
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
</div>
```

### Settings section

Replace the existing Settings section block with:

```html
<!-- Settings Section (Admin Only) -->
<div class="border-t border-gray-200 pb-4">
  <button
    @click="toggleSettings"
    class="w-full flex items-center justify-between px-4 pt-4 pb-2 text-left"
    :aria-expanded="settingsOpen"
    aria-controls="settings-nav"
  >
    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</span>
    <svg
      class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
      :class="settingsOpen ? 'rotate-90' : 'rotate-0'"
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>

  <div
    id="settings-nav"
    v-show="settingsOpen"
    class="px-4 pb-2 space-y-1"
  >
    <router-link
      v-for="item in settingsNavigation"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ 'active': $route.path === item.path }"
    >
      <span class="text-xl mr-3">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </router-link>
  </div>
</div>
```

---

Do not change the main navigation section, the mobile close button, the logo block, App.vue, or any other file.
```

---

## ✅ Verification checklist

- [ ] On first load: Reports and Settings sections show only the header, items hidden
- [ ] Clicking "Reports" header expands the section, chevron rotates
- [ ] Clicking again collapses it
- [ ] Same for Settings
- [ ] Navigating to a Reports page (e.g. `/reports/revenue`) and refreshing — Reports section auto-expands
- [ ] Navigating to a Settings page and refreshing — Settings section auto-expands
- [ ] Collapse Reports, navigate to another page, come back — still collapsed
- [ ] Collapse Settings, refresh page — still collapsed
- [ ] Staff users unaffected (they don't see either section)
- [ ] Main navigation items (Today, Bookings, Staff etc.) unchanged