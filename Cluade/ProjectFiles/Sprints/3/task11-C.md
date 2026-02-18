# 🎉 EXCELLENT! Part B Complete!

Now let's build **Part C: Email Configuration Page** where admins can configure SMTP settings and send test emails.

---

# 📝 TASK 11 PART C: EMAIL CONFIGURATION PAGE

```markdown
# Task 11 Part C: Email Configuration Page

## Context
Task 11 Parts A & B complete. Backend API ready:
- GET/POST /dashboard/settings (with type support)
- POST /dashboard/settings/test-email

Now we need the Email Configuration page where admins can:
- Configure SMTP settings (host, port, username, password, encryption)
- Set "From" name and email
- Enable/disable SMTP
- Send test emails to verify configuration
- See connection status

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing views:
- `views/MyProfile.vue` (just completed)
- `views/Settings.vue` (if exists, we'll extend it)

## Requirements

### 1. Create Email Settings View

Create new file `dashboard/src/views/EmailSettings.vue`:

```vue
<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Email Configuration</h1>
      <p class="text-sm text-gray-600 mt-1">
        Configure SMTP settings to send booking confirmations, reminders, and notifications
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading email settings...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Success/Error Messages -->
      <div v-if="saveSuccess" class="bg-green-50 border border-green-200 rounded p-3">
        <p class="text-sm text-green-800">✓ {{ saveSuccess }}</p>
      </div>
      <div v-if="saveError" class="bg-red-50 border border-red-200 rounded p-3">
        <p class="text-sm text-red-800">{{ saveError }}</p>
      </div>

      <!-- SMTP Configuration Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">SMTP Settings</h2>
              <p class="text-sm text-gray-500 mt-1">
                Configure your email server for sending notifications
              </p>
            </div>
            <!-- Enable/Disable Toggle -->
            <label class="flex items-center cursor-pointer">
              <input
                v-model="settings.smtp_enabled"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span class="ml-3 text-sm font-medium text-gray-900">
                {{ settings.smtp_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </label>
          </div>
        </div>

        <form @submit.prevent="saveSettings" class="px-6 py-6 space-y-6">
          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <div class="flex items-start gap-3">
              <span class="text-blue-600 text-xl">ℹ️</span>
              <div class="flex-1 text-sm text-blue-800">
                <p class="font-medium mb-1">SMTP Configuration Required</p>
                <p>
                  WordPress uses PHP mail() by default, which often fails or goes to spam. 
                  Configure SMTP for reliable email delivery.
                </p>
                <p class="mt-2">
                  <strong>Popular providers:</strong> Gmail (smtp.gmail.com:587), 
                  SendGrid, Mailgun, Amazon SES
                </p>
              </div>
            </div>
          </div>

          <!-- SMTP Host and Port -->
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                SMTP Host *
              </label>
              <input
                v-model="settings.smtp_host"
                type="text"
                required
                placeholder="smtp.gmail.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Port *
              </label>
              <input
                v-model.number="settings.smtp_port"
                type="number"
                required
                placeholder="587"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <!-- Encryption -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Encryption
            </label>
            <select
              v-model="settings.smtp_encryption"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">None</option>
              <option value="tls">TLS (recommended)</option>
              <option value="ssl">SSL</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Use TLS for port 587, SSL for port 465
            </p>
          </div>

          <!-- Authentication -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                v-model="settings.smtp_username"
                type="text"
                required
                placeholder="your-email@gmail.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                v-model="settings.smtp_password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                For Gmail, use an App Password, not your account password
              </p>
            </div>
          </div>

          <!-- From Name and Email -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                From Name *
              </label>
              <input
                v-model="settings.smtp_from_name"
                type="text"
                required
                placeholder="My Business"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                From Email *
              </label>
              <input
                v-model="settings.smtp_from_email"
                type="email"
                required
                placeholder="noreply@mybusiness.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                Should match or be authorized by your SMTP host
              </p>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save SMTP Settings' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Test Email Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Test Email</h2>
          <p class="text-sm text-gray-500 mt-1">
            Send a test email to verify your SMTP configuration is working
          </p>
        </div>

        <div class="px-6 py-6">
          <!-- Test Email Success -->
          <div v-if="testSuccess" class="mb-4 bg-green-50 border border-green-200 rounded p-3">
            <p class="text-sm text-green-800">✓ {{ testSuccess }}</p>
          </div>

          <!-- Test Email Error -->
          <div v-if="testError" class="mb-4 bg-red-50 border border-red-200 rounded p-3">
            <p class="text-sm text-red-800">{{ testError }}</p>
          </div>

          <!-- Warning if SMTP disabled -->
          <div v-if="!settings.smtp_enabled" class="mb-4 bg-amber-50 border border-amber-200 rounded p-3">
            <p class="text-sm text-amber-800">
              ⚠️ SMTP is currently disabled. Enable it above to use custom SMTP settings.
              Test email will use WordPress default (PHP mail).
            </p>
          </div>

          <form @submit.prevent="sendTestEmail" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Send Test Email To
              </label>
              <input
                v-model="testEmailAddress"
                type="email"
                required
                placeholder="your-email@example.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                A test email will be sent to this address
              </p>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="sendingTest || !testEmailAddress"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ sendingTest ? 'Sending...' : 'Send Test Email' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Help Card -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          📚 Quick Setup Guides
        </h3>
        
        <div class="space-y-3 text-sm text-gray-700">
          <div>
            <p class="font-medium">Gmail:</p>
            <p class="text-xs text-gray-600">
              Host: smtp.gmail.com, Port: 587, Encryption: TLS<br>
              Use App Password (not account password): 
              <a href="https://support.google.com/accounts/answer/185833" target="_blank" class="text-primary-600 hover:underline">
                Create App Password →
              </a>
            </p>
          </div>
          
          <div>
            <p class="font-medium">SendGrid:</p>
            <p class="text-xs text-gray-600">
              Host: smtp.sendgrid.net, Port: 587, Encryption: TLS<br>
              Username: apikey, Password: Your SendGrid API Key
            </p>
          </div>
          
          <div>
            <p class="font-medium">Mailgun:</p>
            <p class="text-xs text-gray-600">
              Host: smtp.mailgun.org, Port: 587, Encryption: TLS<br>
              Find credentials in Mailgun dashboard under Domain Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// State
const loading = ref(false)
const saving = ref(false)
const sendingTest = ref(false)
const saveSuccess = ref('')
const saveError = ref('')
const testSuccess = ref('')
const testError = ref('')
const testEmailAddress = ref('')

const settings = ref({
  smtp_enabled: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_encryption: 'tls',
  smtp_username: '',
  smtp_password: '',
  smtp_from_name: '',
  smtp_from_email: ''
})

// Methods
const loadSettings = async () => {
  loading.value = true

  try {
    const keys = 'smtp_enabled,smtp_host,smtp_port,smtp_encryption,smtp_username,smtp_password,smtp_from_name,smtp_from_email'
    const response = await api.get(`settings?keys=${keys}`)

    if (response.data.success) {
      // Merge with defaults
      Object.assign(settings.value, response.data.settings)
    }
  } catch (err) {
    console.error('Error loading settings:', err)
    saveError.value = 'Failed to load settings.'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const response = await api.post('settings', {
      settings: settings.value
    })

    if (response.data.success) {
      saveSuccess.value = 'SMTP settings saved successfully.'
      
      // Hide success after 3 seconds
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    } else {
      saveError.value = response.data.message || 'Failed to save settings.'
    }
  } catch (err) {
    console.error('Error saving settings:', err)
    saveError.value = err.response?.data?.message || err.message || 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

const sendTestEmail = async () => {
  sendingTest.value = true
  testSuccess.value = ''
  testError.value = ''

  try {
    const response = await api.post('settings/test-email', {
      to_email: testEmailAddress.value
    })

    if (response.data.success) {
      testSuccess.value = response.data.message
      
      // Hide success after 5 seconds
      setTimeout(() => {
        testSuccess.value = ''
      }, 5000)
    } else {
      testError.value = response.data.message || 'Failed to send test email.'
    }
  } catch (err) {
    console.error('Error sending test email:', err)
    testError.value = err.response?.data?.message || err.message || 'Failed to send test email. Check your SMTP settings.'
  } finally {
    sendingTest.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import EmailSettings from '../views/EmailSettings.vue'
```

**Add route:**
```javascript
{
  path: '/settings/email',
  name: 'EmailSettings',
  component: EmailSettings,
  meta: { requiresAdmin: true }
}
```

### 3. Add Navigation Link

Add to your settings navigation or sidebar:

```vue
<router-link
  to="/settings/email"
  class="flex items-center px-4 py-2 text-sm font-medium rounded-lg"
  :class="$route.path === '/settings/email' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  📧 Email Configuration
</router-link>
```

## Testing

### Test 1: Load Email Settings Page
1. Navigate to `/bookit-dashboard/app/settings/email`
2. Page loads ✓
3. SMTP toggle shown ✓
4. All fields visible ✓
5. Help section with provider guides ✓

### Test 2: Save SMTP Settings
1. Enable SMTP toggle
2. Fill in:
   - Host: smtp.gmail.com
   - Port: 587
   - Encryption: TLS
   - Username: test@gmail.com
   - Password: app_password_here
   - From Name: Test Business
   - From Email: noreply@test.com
3. Click "Save SMTP Settings"
4. Success message appears ✓
5. Refresh page ✓
6. Settings persisted ✓

### Test 3: Verify Settings Types in Database
```sql
SELECT setting_key, setting_value, setting_type 
FROM wp_bookings_settings 
WHERE setting_key LIKE 'smtp%'
ORDER BY setting_key;
```

Expected:
- smtp_enabled: type='boolean', value='1'
- smtp_port: type='integer', value='587'
- smtp_host: type='string', value='smtp.gmail.com'
- Other SMTP fields: type='string'

### Test 4: Send Test Email (Success)
1. Configure valid SMTP settings
2. Enter your email in test field
3. Click "Send Test Email"
4. Success message appears ✓
5. Check inbox ✓
6. Test email received ✓

### Test 5: Send Test Email (Failed SMTP)
1. Set invalid SMTP password
2. Save settings
3. Try sending test email
4. Error message shown ✓
5. Message mentions checking SMTP settings ✓

### Test 6: SMTP Disabled Warning
1. Disable SMTP toggle
2. Scroll to test email section
3. Amber warning shown ✓
4. Mentions using PHP mail() ✓

### Test 7: Toggle SMTP On/Off
1. Disable SMTP toggle
2. Click "Save SMTP Settings"
3. Settings saved ✓
4. Refresh page
5. Toggle still off ✓
6. Enable toggle
7. Save
8. Toggle persists as on ✓

### Test 8: Empty Required Fields
1. Clear SMTP host
2. Try to save
3. HTML5 validation prevents save ✓

### Test 9: Help Links
1. Check Gmail App Password link
2. Opens Google support page ✓
3. SendGrid and Mailgun info shown ✓
4. Clear instructions for each provider ✓

### Test 10: Admin-Only Access
1. Log in as staff (non-admin)
2. Try to access `/settings/email`
3. Should be blocked (403 or redirect) ✓

## Notes

- Admin-only access (check route meta)
- Toggle switch for enable/disable
- Settings stored with correct types (boolean, integer, string)
- Test email uses WordPress wp_mail()
- SMTP settings passed to wp_mail via WordPress filters (requires separate implementation in Phase 2)
- For now, test email uses default PHP mail() regardless of SMTP settings
- Professional SMTP integration (actually using these settings) is Phase 2
- Help section with popular provider configs
- Gmail requires App Password, not account password
- From email should match or be authorized by SMTP provider
- Success messages auto-hide after 3-5 seconds
```

---

## ⏸️ PAUSE AFTER PART C

**After implementing Part C:**

1. **Navigate to Email Settings** page
2. **Configure SMTP settings** (use real or test credentials)
3. **Save settings** and verify persistence
4. **Send test email** to yourself
5. **Check database** for correct types
6. **Test toggle on/off**
7. **Verify all 10 test scenarios**

**Then say:** "Part C complete, ready for Part D!"

I'll give you **Part D (Email Templates Management)** - the final part of Task 11! 🚀

---

**Apply this Part C prompt now!** Let me know when it's done and tested!