# 🎯 SPRINT 3 - TASK 1: Vue 3 Setup & Dashboard Foundation

Perfect! I have everything I need. Here's your complete Task 1 implementation prompt.

---

## 📋 TASK 1 OVERVIEW

**Goal:** Set up Vue 3 SPA integrated with existing PHP authentication

**Time Estimate:** 14 hours (includes learning curve)
- Vue setup: 3h
- Integration: 2h  
- Dashboard shell: 4h
- API client: 2h
- Testing: 3h

**What You'll Build:**
- Vue 3 + Vite + Vue Router + Tailwind CSS project
- Integration with existing `Bookit_Auth` class
- Dashboard shell with sidebar navigation
- API client with session authentication
- Development and production build process

---

## 🚀 CURSOR COMPOSER PROMPT

Copy this entire prompt into Cursor Composer:

```markdown
# Task: Set Up Vue 3 Dashboard with Existing PHP Authentication

## Context
I'm building a WordPress booking plugin dashboard using Vue 3. I have existing PHP session-based authentication (`Bookit_Auth` class) that I need to integrate with. The Vue app should mount inside the authenticated PHP wrapper.

## Project Structure

Current WordPress plugin at: `wp-content/plugins/bookit-booking-system/`

Existing auth system:
- Login page: `dashboard/index.php` (working)
- Auth class: `includes/class-bookit-auth.php`
- Session management: `includes/class-bookit-session.php`
- Logout: `dashboard/logout.php`

## Requirements

### 1. Create Vue 3 Project Structure

Create these files in `dashboard/`:

```
dashboard/
├── app/
│   └── index.php          # PHP wrapper with auth check
├── src/
│   ├── main.js           # Vue entry point
│   ├── App.vue           # Root component
│   ├── router/
│   │   └── index.js      # Vue Router config
│   ├── composables/
│   │   └── useApi.js     # API client composable
│   ├── components/
│   │   └── Sidebar.vue   # Navigation sidebar
│   └── views/
│       └── Dashboard.vue  # Today's schedule view
├── public/
│   └── .gitkeep
├── dist/                  # Build output (gitignored for now)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

### 2. PHP Integration Wrapper

Create `dashboard/app/index.php`:

```php
<?php
/**
 * Dashboard Vue App Entry Point
 * 
 * This file checks authentication and serves the Vue 3 SPA.
 */

// Load WordPress
require_once __DIR__ . '/../../../wp-load.php';

// Load auth class
require_once plugin_dir_path( __DIR__ ) . '../includes/class-bookit-session.php';
require_once plugin_dir_path( __DIR__ ) . '../includes/class-bookit-auth.php';

// Require authentication
Bookit_Auth::require_auth();

// Get current staff
$current_staff = Bookit_Auth::get_current_staff();

if ( ! $current_staff ) {
    wp_redirect( home_url( '/bookit-dashboard/' ) );
    exit;
}

// Get WordPress REST API nonce
$rest_nonce = wp_create_nonce( 'wp_rest' );
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookit Dashboard</title>
    
    <?php if ( file_exists( __DIR__ . '/../dist/style.css' ) ) : ?>
        <link rel="stylesheet" href="<?php echo plugins_url( 'dashboard/dist/style.css', dirname( __DIR__ ) ); ?>">
    <?php endif; ?>
</head>
<body>
    <div id="app"></div>
    
    <!-- Inject session data for Vue -->
    <script>
        window.BOOKIT_DASHBOARD = {
            staff: <?php echo wp_json_encode( $current_staff ); ?>,
            apiBase: '<?php echo rest_url( 'bookit/v1/dashboard' ); ?>',
            nonce: '<?php echo esc_js( $rest_nonce ); ?>',
            pluginUrl: '<?php echo plugins_url( 'bookit-booking-system' ); ?>',
            logoutUrl: '<?php echo home_url( '/bookit-dashboard/logout/' ); ?>'
        };
    </script>
    
    <?php if ( file_exists( __DIR__ . '/../dist/index.js' ) ) : ?>
        <script type="module" src="<?php echo plugins_url( 'dashboard/dist/index.js', dirname( __DIR__ ) ); ?>"></script>
    <?php else : ?>
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/src/main.js"></script>
    <?php endif; ?>
</body>
</html>
```

### 3. Package.json

Create `dashboard/package.json`:

```json
{
  "name": "bookit-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.1.0"
  }
}
```

### 4. Vite Configuration

Create `dashboard/vite.config.js`:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  
  root: path.resolve(__dirname),
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.js'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'style.css'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  
  server: {
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173'
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

### 5. Tailwind Configuration

Create `dashboard/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.php',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        }
      }
    },
  },
  plugins: [],
}
```

Create `dashboard/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 6. Vue Application Files

Create `dashboard/src/main.js`:

```js
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './router'
import './assets/main.css'

// Create router with base path
const router = createRouter({
  history: createWebHistory('/bookit-dashboard/app/'),
  routes
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
```

Create `dashboard/src/App.vue`:

```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <Sidebar 
        :staff="staff"
        @logout="handleLogout"
      />
      
      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header -->
        <header class="bg-white shadow-sm z-10">
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-semibold text-gray-900">
                {{ pageTitle }}
              </h1>
              
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">
                  {{ staff.name }}
                </span>
                <button
                  @click="handleLogout"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

// Get staff data from window (injected by PHP)
const staff = window.BOOKIT_DASHBOARD.staff

// Get current page title from route
const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'Dashboard')

// Handle logout
const handleLogout = () => {
  window.location.href = window.BOOKIT_DASHBOARD.logoutUrl
}
</script>
```

Create `dashboard/src/router/index.js`:

```js
export default [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: "Today's Schedule" }
  },
  {
    path: '/bookings',
    name: 'bookings',
    component: () => import('../views/Bookings.vue'),
    meta: { title: 'Bookings' }
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('../views/Services.vue'),
    meta: { title: 'Services' }
  },
  {
    path: '/staff',
    name: 'staff',
    component: () => import('../views/Staff.vue'),
    meta: { title: 'Staff' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: 'Settings' }
  }
]
```

Create `dashboard/src/components/Sidebar.vue`:

```vue
<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
    <!-- Logo -->
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-xl font-bold text-primary-600">
        Bookit
      </h2>
      <p class="text-xs text-gray-500 mt-1">
        Booking Dashboard
      </p>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navigation"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ 'active': $route.path === item.path }"
      >
        <span class="text-xl mr-3">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
    
    <!-- User Info -->
    <div class="px-4 py-4 border-t border-gray-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span class="text-primary-600 font-semibold">
            {{ initials }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ props.staff.name }}
          </p>
          <p class="text-xs text-gray-500 capitalize">
            {{ props.staff.role }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  staff: {
    type: Object,
    required: true
  }
})

const navigation = [
  { name: 'dashboard', path: '/', icon: '📅', label: 'Today' },
  { name: 'bookings', path: '/bookings', icon: '📋', label: 'Bookings' },
  { name: 'services', path: '/services', icon: '✂️', label: 'Services' },
  { name: 'staff', path: '/staff', icon: '👥', label: 'Staff' },
  { name: 'settings', path: '/settings', icon: '⚙️', label: 'Settings' }
]

const initials = computed(() => {
  const names = props.staff.name.split(' ')
  return names.map(n => n[0]).join('').toUpperCase()
})
</script>

<style scoped>
.nav-item {
  @apply flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors;
}

.nav-item.active {
  @apply bg-primary-50 text-primary-700;
}
</style>
```

Create `dashboard/src/views/Dashboard.vue`:

```vue
<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">
        Today's Schedule
      </h2>
      <p class="text-sm text-gray-600 mt-1">
        {{ formattedDate }}
      </p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading bookings...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="bookings.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <div class="text-6xl mb-4">📅</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No bookings today
      </h3>
      <p class="text-sm text-gray-600">
        You have a clear schedule for today.
      </p>
    </div>
    
    <!-- Bookings List -->
    <div v-else class="space-y-4">
      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="bg-white rounded-lg shadow p-6"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-gray-900">
                {{ booking.start_time }}
              </span>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="statusClass(booking.status)"
              >
                {{ booking.status }}
              </span>
            </div>
            
            <p class="text-sm text-gray-600 mt-1">
              {{ booking.service_name }}
            </p>
            
            <div class="mt-2 text-sm text-gray-700">
              <p><strong>Customer:</strong> {{ booking.customer_name }}</p>
              <p><strong>Staff:</strong> {{ booking.staff_name }}</p>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              View Details
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

const loading = ref(true)
const error = ref(null)
const bookings = ref([])

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const statusClass = (status) => {
  const classes = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_payment': 'bg-orange-100 text-orange-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'no_show': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

onMounted(async () => {
  try {
    // This endpoint doesn't exist yet - will create in Task 3
    // For now, just show empty state
    bookings.value = []
    
    // Uncomment when endpoint is ready:
    // const response = await api.get('/bookings/today')
    // bookings.value = response.data
    
  } catch (err) {
    error.value = err.message || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
})
</script>
```

Create placeholder views for other routes:

`dashboard/src/views/Bookings.vue`:
```vue
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">All Bookings</h2>
    <p class="text-gray-600">Bookings list will be implemented in Task 4</p>
  </div>
</template>
```

`dashboard/src/views/Services.vue`:
```vue
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Services</h2>
    <p class="text-gray-600">Services management will be implemented in Task 7</p>
  </div>
</template>
```

`dashboard/src/views/Staff.vue`:
```vue
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Staff</h2>
    <p class="text-gray-600">Staff management will be implemented in Task 9</p>
  </div>
</template>
```

`dashboard/src/views/Settings.vue`:
```vue
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Settings</h2>
    <p class="text-gray-600">Settings will be implemented in Task 11</p>
  </div>
</template>
```

### 7. API Client Composable

Create `dashboard/src/composables/useApi.js`:

```js
import axios from 'axios'

// Create axios instance with defaults
const createApiClient = () => {
  const config = window.BOOKIT_DASHBOARD
  
  const client = axios.create({
    baseURL: config.apiBase,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': config.nonce
    },
    withCredentials: true // Send cookies for session auth
  })
  
  // Response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Session expired - redirect to login
        window.location.href = '/bookit-dashboard/'
        return Promise.reject(new Error('Session expired'))
      }
      
      const message = error.response?.data?.message || error.message || 'An error occurred'
      return Promise.reject(new Error(message))
    }
  )
  
  return client
}

// Export composable
export const useApi = () => {
  const client = createApiClient()
  
  return {
    get: (url, config) => client.get(url, config),
    post: (url, data, config) => client.post(url, data, config),
    patch: (url, data, config) => client.patch(url, data, config),
    put: (url, data, config) => client.put(url, data, config),
    delete: (url, config) => client.delete(url, config)
  }
}
```

### 8. CSS Entry Point

Create `dashboard/src/assets/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
  }
}

@layer utilities {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors;
  }
  
  .btn-secondary {
    @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors;
  }
}
```

### 9. Gitignore

Create `dashboard/.gitignore`:

```
node_modules/
dist/
.DS_Store
*.log
```

## Implementation Steps

1. **Navigate to dashboard directory:**
   ```bash
   cd wp-content/plugins/bookit-booking-system/dashboard
   ```

2. **Create all the files above** (use file creation tool)

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test in browser:**
   - Go to: http://plugin-test-1.local/bookit-dashboard/
   - Log in (your existing PHP login works)
   - After login, manually navigate to: http://plugin-test-1.local/bookit-dashboard/app/
   - You should see the Vue dashboard with sidebar navigation

6. **Test navigation:**
   - Click through sidebar links (Today, Bookings, Services, Staff, Settings)
   - All routes should work (showing placeholder content)

7. **Build for production:**
   ```bash
   npm run build
   ```
   
   Verify `dist/` folder contains:
   - `index.js`
   - `style.css`

## Testing Checklist

- [ ] Dev server starts on port 5173
- [ ] Can access dashboard at `/bookit-dashboard/app/` after login
- [ ] Sidebar shows staff name and initials
- [ ] All navigation links work (5 routes)
- [ ] Browser console shows `window.BOOKIT_DASHBOARD` object with staff data
- [ ] Logout button redirects to `/bookit-dashboard/logout/`
- [ ] Production build creates minified files in `dist/`
- [ ] No console errors in browser
- [ ] Responsive on mobile (sidebar should eventually collapse - note for later)

## Expected Output

After completing this task, you should have:
- ✅ Vue 3 SPA running inside WordPress plugin
- ✅ Integration with existing PHP authentication
- ✅ Working sidebar navigation with 5 routes
- ✅ API client ready for future endpoints
- ✅ Both development and production build processes working

## Notes

- The dashboard currently shows placeholder content
- API endpoints will be created in future tasks
- Session authentication works via cookies (no localStorage needed)
- All future views will use the same layout structure
```

---

## 🧪 TESTING AFTER IMPLEMENTATION

Once Cursor finishes, test these scenarios:

### 1. **Authentication Flow**
```bash
# Scenario 1: Not logged in
1. Visit: http://plugin-test-1.local/bookit-dashboard/app/
2. Should redirect to: http://plugin-test-1.local/bookit-dashboard/
3. Log in with valid credentials
4. Should redirect to dashboard home (manually navigate to /app/ for now)

# Scenario 2: Already logged in
1. Log in at /bookit-dashboard/
2. Navigate to: http://plugin-test-1.local/bookit-dashboard/app/
3. Should see Vue dashboard immediately
```

### 2. **Vue Router**
```bash
# Test all routes work
- / → Today's Schedule
- /bookings → Bookings placeholder
- /services → Services placeholder
- /staff → Staff placeholder
- /settings → Settings placeholder
```

### 3. **Browser Console**
```bash
# Open DevTools console, check for:
1. window.BOOKIT_DASHBOARD object exists
2. Contains: staff, apiBase, nonce, logoutUrl
3. No Vue errors
4. No 404s for assets
```

### 4. **Development Server**
```bash
cd dashboard
npm run dev

# Should output:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 5. **Production Build**
```bash
cd dashboard
npm run build

# Should create:
# dashboard/dist/index.js
# dashboard/dist/style.css
# dashboard/dist/chunks/ (code splitting)
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot find module 'vue'"
```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use
```bash
# Kill existing Vite process
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
server: { port: 5174 }
```

### Issue: PHP fatal error "Class Bookit_Auth not found"
```bash
# Check file paths in app/index.php
# Should be:
require_once __DIR__ . '/../../../wp-load.php';
require_once plugin_dir_path( __DIR__ ) . '../includes/class-bookit-session.php';
require_once plugin_dir_path( __DIR__ ) . '../includes/class-bookit-auth.php';
```

### Issue: Vue app shows but no styling
```bash
# Check Tailwind is processing
npm run dev

# Verify main.css imports Tailwind directives:
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue: API calls return 401
```bash
# Check in browser console:
console.log(window.BOOKIT_DASHBOARD.nonce)

# Verify cookies are sent:
# DevTools → Network → Headers → Cookie should include PHP session
```

---

## ✅ TASK 1 COMPLETION CRITERIA

Mark this task complete when:

- [ ] `npm run dev` starts without errors
- [ ] Dashboard accessible at `/bookit-dashboard/app/` (after login)
- [ ] All 5 navigation routes work
- [ ] Staff name displays in sidebar
- [ ] Logout button works
- [ ] `npm run build` creates production files
- [ ] No console errors
- [ ] Vue DevTools shows Vue app running

---

## 📊 PROGRESS UPDATE TEMPLATE

When you complete Task 1, report back with:

```markdown
## Task 1 Complete ✅

**Time Taken:** X hours
**Actual vs Estimate:** X/14 hours

**What Worked:**
- [List what went smoothly]

**Challenges:**
- [List any issues encountered]

**Testing Results:**
- [ ] Dev server: Working
- [ ] Production build: Working
- [ ] Authentication: Working
- [ ] Navigation: Working
- [ ] Styling: Working

**Ready for Task 2?** Yes/No

**Screenshot:** [Optional - screenshot of working dashboard]
```

---

## 🎯 NEXT STEPS

After Task 1 is complete:
- **Task 3:** Today's Schedule Widget (skipping Task 2 since auth exists)
- Will create REST API endpoint: `GET /wp-json/bookit/v1/dashboard/bookings/today`
- Will display real booking data in the Dashboard.vue view

---

**Ready to start?** Copy the Cursor Composer prompt above and let's build! 🚀

Let me know when Task 1 is complete and we'll move to Task 3 (Today's Schedule with real data).