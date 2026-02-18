# 🎨 CURSOR PROMPT: Reorganize Navigation (Settings + User Dropdown)

```markdown
# Fix: Reorganize Navigation - Remove Settings, Add User Dropdown & Settings Section

## Context
Currently "Settings" is in the main navbar, cluttering the navigation. We need to:
1. Remove "Settings" from main navbar
2. Add user dropdown (top-right) with My Profile and Logout
3. Add Settings section at bottom of sidebar (admin only)

## Files to Modify

### File 1: dashboard/src/components/DashboardLayout.vue (or App.vue or Navigation.vue)

We need to see your current navigation structure first. The file is likely one of:
- `dashboard/src/components/DashboardLayout.vue`
- `dashboard/src/components/Navigation.vue`
- `dashboard/src/App.vue`
- `dashboard/src/components/Sidebar.vue`

#### Step 1: Find and Remove Settings from Main Nav

**Find and REMOVE this (or similar):**
```vue
<router-link to="/settings">⚙️ Settings</router-link>
```

#### Step 2: Add User Dropdown (Top-Right Header)

**Find the header/top navigation section** (usually has logo, page title, or navigation items).

**Add this user dropdown component in the top-right:**

```vue
<!-- User Dropdown (add to top-right of header) -->
<div class="relative ml-auto">
  <button
    @click="showUserMenu = !showUserMenu"
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
  >
    <!-- User Avatar or Initials -->
    <div
      v-if="currentUser"
      class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
      :style="{ backgroundColor: getUserColor(currentUser.full_name) }"
    >
      {{ getUserInitials(currentUser.full_name) }}
    </div>
    
    <!-- User Name -->
    <span>{{ currentUser?.full_name || 'User' }}</span>
    
    <!-- Dropdown Arrow -->
    <svg
      class="w-4 h-4 transition-transform"
      :class="{ 'rotate-180': showUserMenu }"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown Menu -->
  <div
    v-if="showUserMenu"
    v-click-outside="() => showUserMenu = false"
    class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
  >
    <router-link
      to="/profile"
      @click="showUserMenu = false"
      class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      <span>👤</span>
      <span>My Profile</span>
    </router-link>
    
    <div class="border-t border-gray-200 my-1"></div>
    
    <button
      @click="logout"
      class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    >
      <span>🚪</span>
      <span>Logout</span>
    </button>
  </div>
</div>
```

#### Step 3: Add State and Methods for User Dropdown

**In the `<script setup>` section, add:**

```javascript
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'

const router = useRouter()
const api = useApi()

// User dropdown state
const showUserMenu = ref(false)
const currentUser = ref(null)

// Load current user
const loadCurrentUser = async () => {
  try {
    const response = await api.get('profile')
    if (response.data.success) {
      currentUser.value = response.data.profile
    }
  } catch (err) {
    console.error('Error loading user:', err)
  }
}

// User initials helper
const getUserInitials = (fullName) => {
  if (!fullName || fullName.trim() === ' ') return '??'
  const names = fullName.trim().split(' ').filter(n => n)
  if (names.length === 0) return '??'
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

// User color helper
const getUserColor = (name) => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
    '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Logout function
const logout = async () => {
  try {
    await api.post('logout')
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    // Redirect to login page
    window.location.href = '/bookit-dashboard/public/login.php'
  }
}

// Load user on mount
onMounted(() => {
  loadCurrentUser()
})
```

#### Step 4: Add Click-Outside Directive

**Add this directive for closing dropdown when clicking outside:**

```javascript
// Click outside directive (add to script setup)
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
```

#### Step 5: Add Settings Section to Sidebar (Bottom)

**Find your sidebar navigation** (usually has links like Bookings, Staff, Services).

**Add this Settings section at the BOTTOM of the sidebar:**

```vue
<!-- Spacer to push settings to bottom -->
<div class="flex-1"></div>

<!-- Settings Section (Admin Only) -->
<div
  v-if="currentUser?.role === 'admin'"
  class="mt-auto pt-4 border-t border-gray-200"
>
  <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
    Settings
  </p>
  
  <router-link
    to="/profile"
    class="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
    :class="$route.path === '/profile' 
      ? 'bg-primary-100 text-primary-900' 
      : 'text-gray-700 hover:bg-gray-100'"
  >
    <span class="text-lg">👤</span>
    <span>My Profile</span>
  </router-link>
  
  <router-link
    to="/settings/email"
    class="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
    :class="$route.path === '/settings/email' 
      ? 'bg-primary-100 text-primary-900' 
      : 'text-gray-700 hover:bg-gray-100'"
  >
    <span class="text-lg">📧</span>
    <span>Email Configuration</span>
  </router-link>
  
  <router-link
    to="/settings/templates"
    class="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
    :class="$route.path === '/settings/templates' 
      ? 'bg-primary-100 text-primary-900' 
      : 'text-gray-700 hover:bg-gray-100'"
  >
    <span class="text-lg">📝</span>
    <span>Email Templates</span>
  </router-link>
</div>
```

### File 2: Add Logout Endpoint to Backend (if not exists)

**In `includes/api/class-dashboard-bookings-api.php`:**

**Check if logout route exists. If not, add:**

```php
// Logout
register_rest_route(
    self::NAMESPACE,
    '/dashboard/logout',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'logout' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
    )
);
```

**Add logout method:**

```php
/**
 * Logout current user
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
public function logout( $request ) {
    if ( ! class_exists( 'Bookit_Session' ) ) {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'class-bookit-session.php';
    }

    Bookit_Session::destroy();

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Logged out successfully.',
        )
    );
}
```

## Expected Result

### Before:
```
Navbar: [Bookings] [Staff] [Services] [Settings]
Sidebar: (same links)
```

### After:
```
Navbar: [Bookings] [Staff] [Services] ... [User Dropdown ▼]
                                            ├─ My Profile
                                            └─ Logout

Sidebar: 
  [Bookings]
  [Staff]
  [Services]
  
  ─────────────────
  SETTINGS (admin only)
  [👤 My Profile]
  [📧 Email Configuration]
  [📝 Email Templates]
```

## Testing

### Test 1: User Dropdown Appears
1. Check top-right of header
2. User initials or avatar shown ✓
3. User name displayed ✓
4. Dropdown arrow shown ✓

### Test 2: User Dropdown Works
1. Click user dropdown
2. Menu opens ✓
3. Shows "My Profile" ✓
4. Shows "Logout" (in red) ✓
5. Click outside dropdown
6. Menu closes ✓

### Test 3: My Profile Link
1. Click "My Profile" in dropdown
2. Navigates to /profile ✓
3. Dropdown closes ✓

### Test 4: Logout Works
1. Click "Logout"
2. Session destroyed ✓
3. Redirected to login page ✓
4. Cannot access dashboard ✓
5. Login again works ✓

### Test 5: Settings Section (Admin)
1. Login as admin
2. Scroll to bottom of sidebar
3. See "SETTINGS" header ✓
4. See 3 links:
   - My Profile ✓
   - Email Configuration ✓
   - Email Templates ✓

### Test 6: Settings Section (Staff)
1. Login as staff (non-admin)
2. Scroll to bottom of sidebar
3. Settings section NOT shown ✓
4. Only regular nav items visible ✓

### Test 7: Active Link Highlighting
1. Navigate to /settings/email
2. Email Configuration highlighted in sidebar ✓
3. Navigate to /profile
4. My Profile highlighted ✓

### Test 8: Settings Removed from Main Nav
1. Check main navbar
2. "Settings" link NOT present ✓
3. Only core navigation remains ✓

### Test 9: Responsive (if applicable)
1. Resize browser to mobile
2. User dropdown still accessible ✓
3. Sidebar still scrollable ✓
4. Settings section at bottom ✓

### Test 10: User Info Loads
1. Check dropdown shows correct name ✓
2. Initials match user's name ✓
3. Color consistent per user ✓

## Notes

- User dropdown uses same color/initials logic as staff list
- Logout clears session and redirects to login
- Settings section only visible to admins
- Click-outside closes dropdown (better UX)
- Spacer (flex-1) pushes settings to bottom
- My Profile appears in both dropdown AND sidebar (admin convenience)
- Email Templates route (/settings/templates) will be created in Part D
- Logout endpoint uses existing session management
- User profile loaded on mount for dropdown display
```

---

## ⚠️ IMPORTANT NOTE

I don't know your exact navigation structure. You'll need to:

1. **Find your navigation component** (likely `DashboardLayout.vue`, `App.vue`, or `Sidebar.vue`)
2. **Adapt the placement** of user dropdown and settings section to match your structure
3. **Adjust styling** classes to match your design system

---

## 🎯 WHAT TO DO

1. **Apply the cursor prompt**
2. **Adapt to your navigation structure**
3. **Test all 10 scenarios**
4. **Then say:** "Navigation fixed, ready for Part D!"

Then I'll give you the final part: **Email Templates Management Page**! 🚀

---

**Let me know when the navigation is done!**