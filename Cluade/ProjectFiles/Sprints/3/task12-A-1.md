# 🎯 PERFECT! Option A - Phase by Phase

Let's start with **Phase 1: Mobile Sidebar & Navigation**. This is the foundation - once the mobile menu works, everything else will be easier.

---

# 📝 PHASE 1: MOBILE SIDEBAR & HAMBURGER MENU

```markdown
# Task 12 Part A Phase 1: Mobile Sidebar & Hamburger Menu

## Context
Dashboard currently has a sidebar that's always visible, taking up space on mobile. Need to add:
- Hamburger menu button (mobile only)
- Slide-in/out sidebar animation
- Overlay behind sidebar when open
- Close sidebar on route change
- Sidebar always visible on desktop (no change)

## File: dashboard/src/components/DashboardLayout.vue

### Step 1: Add Sidebar State

**In the `<script setup>` section, add this ref at the top with other state:**

```javascript
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const sidebarOpen = ref(false)

// Your existing state (currentUser, showUserMenu, etc.)
```

### Step 2: Add Route Change Listener to Close Sidebar

**After the state declarations, add:**

```javascript
// Close sidebar when navigating on mobile
const router = useRouter()
router.afterEach(() => {
  sidebarOpen.value = false
})
```

### Step 3: Update Template Structure

**Find the main template structure. It likely looks something like:**

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <aside class="...">
      <!-- Sidebar content -->
    </aside>
    
    <main class="...">
      <!-- Main content -->
    </main>
  </div>
</template>
```

**Replace the ENTIRE template with this new responsive structure:**

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header (visible only on mobile) -->
    <div class="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-30 flex items-center justify-between">
      <!-- Hamburger Menu Button -->
      <button
        @click="sidebarOpen = !sidebarOpen"
        class="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Toggle menu"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <!-- Logo (centered) -->
      <span class="text-lg font-semibold text-gray-900">Bookit</span>
      
      <!-- Spacer for centering -->
      <div class="w-10"></div>
    </div>

    <!-- Sidebar Overlay (mobile only - click to close) -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-50"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="h-full overflow-y-auto flex flex-col">
        <!-- Close Button (mobile only) -->
        <div class="lg:hidden flex justify-between items-center p-4 border-b border-gray-200">
          <span class="text-lg font-semibold text-gray-900">Menu</span>
          <button
            @click="sidebarOpen = false"
            class="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close menu"
          >
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Logo (desktop only) -->
        <div class="hidden lg:block p-4 border-b border-gray-200">
          <h1 class="text-xl font-bold text-gray-900">Bookit Dashboard</h1>
        </div>

        <!-- Navigation Section -->
        <nav class="flex-1 p-4 space-y-1">
          <!-- YOUR EXISTING NAVIGATION LINKS GO HERE -->
          <!-- Don't change the links themselves, just keep them -->
          
          <!-- Example structure (replace with your actual nav): -->
          <router-link
            to="/bookings"
            class="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="$route.path === '/bookings' 
              ? 'bg-primary-100 text-primary-900' 
              : 'text-gray-700 hover:bg-gray-100'"
          >
            <span class="text-lg">📅</span>
            <span>Bookings</span>
          </router-link>
          
          <!-- Keep all your existing navigation links -->
        </nav>

        <!-- Settings Section (if you have one at bottom) -->
        <div
          v-if="currentUser?.role === 'admin'"
          class="mt-auto p-4 border-t border-gray-200"
        >
          <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Settings
          </p>
          
          <!-- YOUR EXISTING SETTINGS LINKS GO HERE -->
          <!-- Keep your existing settings navigation -->
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="lg:ml-64 transition-all duration-300">
      <!-- Mobile header spacer (push content down on mobile) -->
      <div class="h-16 lg:h-0"></div>

      <!-- Desktop Header (hidden on mobile) -->
      <header class="hidden lg:block sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-20">
        <div class="flex items-center justify-between">
          <div class="flex-1"></div>
          
          <!-- YOUR EXISTING USER DROPDOWN GOES HERE -->
          <!-- Keep your existing user dropdown component -->
          <div class="relative ml-auto">
            <!-- Your existing dropdown code -->
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-4 lg:p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
```

**IMPORTANT NOTES:**
- This template shows the STRUCTURE - keep your existing navigation links
- Don't delete your navigation links - just move them into the new structure
- Keep your user dropdown code - just place it where indicated
- Keep your settings section if you have one

### Step 4: Verify Existing Styles

Make sure your component imports and script setup include:

```javascript
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Add sidebar state
const sidebarOpen = ref(false)

// Your existing state
const currentUser = ref(null)
const showUserMenu = ref(false)
// ... other existing state

// Close sidebar on route change
const router = useRouter()
router.afterEach(() => {
  sidebarOpen.value = false
})

// Your existing methods
// ...
```

## Testing

### Test 1: Desktop View (1024px+)
1. Open dashboard at full desktop width
2. Sidebar visible on left ✓
3. No hamburger menu visible ✓
4. Desktop header with user dropdown visible ✓
5. Content has left margin (pushed right) ✓
6. Everything works as before ✓

### Test 2: Mobile View (375px)
1. Resize browser to mobile width
2. Sidebar hidden by default ✓
3. Mobile header visible with hamburger ✓
4. Logo centered in mobile header ✓
5. Desktop header hidden ✓
6. Content uses full width ✓

### Test 3: Open Mobile Sidebar
1. On mobile, click hamburger button
2. Sidebar slides in from left ✓
3. Dark overlay appears behind sidebar ✓
4. Close button (X) visible in sidebar ✓
5. Can scroll sidebar if needed ✓
6. Content behind overlay ✓

### Test 4: Close Mobile Sidebar
1. With sidebar open on mobile
2. Click X button → sidebar closes ✓
3. Click overlay → sidebar closes ✓
4. Click navigation link → sidebar closes ✓
5. Sidebar slides out smoothly ✓

### Test 5: Tablet View (768px)
1. Resize to tablet width
2. Hamburger still visible ✓
3. Sidebar toggle works ✓
4. Layout adapts appropriately ✓

### Test 6: Navigation Still Works
1. Click each navigation link
2. Routes change correctly ✓
3. Active link highlighted ✓
4. Sidebar closes after navigation (mobile) ✓

### Test 7: Transitions Smooth
1. Toggle sidebar multiple times
2. No janky animations ✓
3. Overlay fades in/out ✓
4. Sidebar slides smoothly ✓

### Test 8: Focus Management
1. Tab through navigation
2. Can reach hamburger button ✓
3. Can reach close button ✓
4. Focus visible ✓

### Test 9: Responsive Breakpoints
1. Slowly resize browser
2. At 1024px, sidebar becomes always visible ✓
3. Hamburger disappears at 1024px ✓
4. Smooth transition between states ✓

### Test 10: User Dropdown Still Works
1. On desktop, click user dropdown
2. Dropdown opens ✓
3. Logout works ✓
4. My Profile link works ✓

## Expected Behavior

**Mobile (< 1024px):**
- ✅ Hamburger menu in top bar
- ✅ Sidebar hidden by default
- ✅ Sidebar slides in when hamburger clicked
- ✅ Dark overlay behind sidebar
- ✅ Click overlay or X to close
- ✅ Auto-closes when navigating
- ✅ Full-width content

**Desktop (≥ 1024px):**
- ✅ Sidebar always visible
- ✅ No hamburger menu
- ✅ No overlay
- ✅ Content has left margin
- ✅ Desktop header visible
- ✅ User dropdown in header

## Notes

- Tailwind `lg:` breakpoint is 1024px (desktop)
- Sidebar is position: fixed (stays in place when scrolling)
- Z-index hierarchy: Sidebar (50) > Overlay (40) > Mobile Header (30) > Desktop Header (20)
- Transitions use Tailwind's duration-300 and ease-in-out
- Sidebar width is 16rem (256px / w-64)
- Main content margin-left matches sidebar width on desktop
- Mobile header is 4rem (64px / h-16) tall
- Focus rings for accessibility (keyboard navigation)
```

---

## ⏸️ AFTER APPLYING PHASE 1

1. **Apply the prompt** in Cursor
2. **Test all 10 scenarios** thoroughly
3. **Fix any issues** with your specific navigation structure
4. **Test on real mobile device** if possible

**Then say:** "Phase 1 complete, mobile sidebar working!"

And I'll give you **Phase 2: Responsive Tables & Cards** 🚀

---

**Apply this Phase 1 prompt now!**