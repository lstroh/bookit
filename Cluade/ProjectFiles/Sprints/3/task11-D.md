# 🎉 PERFECT! Let's Build Part D: Email Templates Management!

This is the **final part of Task 11**!

---

# 📝 TASK 11 PART D: EMAIL TEMPLATES MANAGEMENT PAGE

```markdown
# Task 11 Part D: Email Templates Management Page

## Context
Task 11 Parts A, B, C complete. Backend API ready:
- GET /dashboard/email-templates (returns 5 templates)
- PUT /dashboard/email-templates/{key} (update template)
- POST /dashboard/email-templates/{key} (reset to default)

Now we need the Email Templates page where admins can:
- View all 5 email templates
- Edit subject and body for each template
- Preview templates with sample variable data
- Reset templates to defaults
- Enable/disable individual templates
- See available variables for each template

## Database Templates

The 5 templates we seeded in activation:
1. `booking_confirmation` - Sent when booking is confirmed
2. `booking_reminder` - Sent 24 hours before appointment
3. `booking_cancelled` - Sent when booking is cancelled
4. `admin_new_booking` - Sent to admin when new booking created
5. `staff_new_booking` - Sent to staff when assigned a booking

## Requirements

### 1. Create Email Templates View

Create new file `dashboard/src/views/EmailTemplates.vue`:

```vue
<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Email Templates</h1>
      <p class="text-sm text-gray-600 mt-1">
        Customize the email messages sent to customers, staff, and admins
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading templates...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Success/Error Messages -->
      <div v-if="saveSuccess" class="bg-green-50 border border-green-200 rounded p-3">
        <p class="text-sm text-green-800">✓ {{ saveSuccess }}</p>
      </div>
      <div v-if="saveError" class="bg-red-50 border border-red-200 rounded p-3">
        <p class="text-sm text-red-800">{{ saveError }}</p>
      </div>

      <!-- Available Variables Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-blue-600 text-xl">ℹ️</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-900 mb-2">
              Available Template Variables
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-800">
              <div>
                <span class="font-semibold">Customer:</span><br>
                {customer_name}<br>
                {customer_email}<br>
                {customer_phone}
              </div>
              <div>
                <span class="font-semibold">Booking:</span><br>
                {service_name}<br>
                {date}<br>
                {time}<br>
                {duration}
              </div>
              <div>
                <span class="font-semibold">Staff:</span><br>
                {staff_name}
              </div>
              <div>
                <span class="font-semibold">Business:</span><br>
                {business_name}<br>
                {business_phone}<br>
                {business_address}
              </div>
            </div>
            <p class="text-xs text-blue-700 mt-2">
              Copy and paste these variables into your templates. They will be replaced with real data when emails are sent.
            </p>
          </div>
        </div>
      </div>

      <!-- Template Cards -->
      <div
        v-for="template in templates"
        :key="template.template_key"
        class="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ getTemplateTitle(template.template_key) }}
                </h2>
                <!-- Enable/Disable Badge -->
                <span
                  class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
                  :class="template.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'"
                >
                  {{ template.enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ getTemplateDescription(template.template_key) }}
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <!-- Enable/Disable Toggle -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="template.enabled"
                  @change="toggleEnabled(template)"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
              
              <!-- Edit Button -->
              <button
                @click="editTemplate(template)"
                class="px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg"
              >
                Edit
              </button>
              
              <!-- Reset Button -->
              <button
                @click="resetTemplate(template)"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>

        <!-- Preview (Collapsed by Default) -->
        <div
          v-if="expandedTemplate === template.template_key"
          class="px-6 py-4 bg-gray-50 border-b border-gray-200"
        >
          <p class="text-xs font-semibold text-gray-700 uppercase mb-2">Preview</p>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <p class="text-sm font-semibold text-gray-900 mb-2">
              Subject: {{ template.subject }}
            </p>
            <div class="text-sm text-gray-700 whitespace-pre-wrap">
              {{ template.body }}
            </div>
          </div>
          <button
            @click="expandedTemplate = null"
            class="mt-2 text-xs text-primary-600 hover:text-primary-700"
          >
            Hide Preview
          </button>
        </div>
        <div v-else class="px-6 py-3 bg-gray-50">
          <button
            @click="expandedTemplate = template.template_key"
            class="text-xs text-primary-600 hover:text-primary-700"
          >
            Show Preview
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Template Modal -->
    <div
      v-if="editingTemplate"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Edit Template: {{ getTemplateTitle(editingTemplate.template_key) }}
            </h3>
            <button
              @click="closeEditModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="saveTemplate" class="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <!-- Subject -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Subject *
            </label>
            <input
              v-model="editForm.subject"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <!-- Body -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Body *
            </label>
            <textarea
              v-model="editForm.body"
              rows="12"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              Use variables like {customer_name}, {service_name}, {date}, {time}, etc.
            </p>
          </div>

          <!-- Variables Helper -->
          <div class="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p class="text-xs font-semibold text-gray-700 mb-2">Quick Copy Variables:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="variable in getRelevantVariables(editingTemplate.template_key)"
                :key="variable"
                type="button"
                @click="copyToClipboard(variable)"
                class="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                {{ variable }}
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Preview
            </label>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="text-sm font-semibold text-gray-900 mb-2">
                Subject: {{ editForm.subject }}
              </p>
              <div class="text-sm text-gray-700 whitespace-pre-wrap">
                {{ editForm.body }}
              </div>
            </div>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            @click="closeEditModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveTemplate"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Template' }}
          </button>
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
const saveSuccess = ref('')
const saveError = ref('')
const templates = ref([])
const editingTemplate = ref(null)
const expandedTemplate = ref(null)

const editForm = ref({
  subject: '',
  body: '',
  enabled: true
})

// Template metadata
const templateInfo = {
  booking_confirmation: {
    title: 'Booking Confirmation',
    description: 'Sent to customers when their booking is confirmed',
    variables: ['{customer_name}', '{service_name}', '{date}', '{time}', '{staff_name}', '{business_name}', '{reschedule_link}', '{cancel_link}']
  },
  booking_reminder: {
    title: 'Booking Reminder',
    description: 'Sent to customers 24 hours before their appointment',
    variables: ['{customer_name}', '{service_name}', '{date}', '{time}', '{staff_name}', '{business_name}', '{reschedule_link}', '{cancel_link}']
  },
  booking_cancelled: {
    title: 'Booking Cancelled',
    description: 'Sent to customers when their booking is cancelled',
    variables: ['{customer_name}', '{service_name}', '{date}', '{time}', '{business_name}', '{business_phone}']
  },
  admin_new_booking: {
    title: 'New Booking (Admin)',
    description: 'Sent to admin when a new booking is created',
    variables: ['{customer_name}', '{customer_email}', '{customer_phone}', '{service_name}', '{date}', '{time}', '{staff_name}', '{duration}', '{total_price}', '{deposit_paid}', '{dashboard_link}']
  },
  staff_new_booking: {
    title: 'New Booking (Staff)',
    description: 'Sent to staff when they are assigned a new booking',
    variables: ['{staff_name}', '{customer_name}', '{customer_phone}', '{service_name}', '{date}', '{time}', '{duration}', '{dashboard_link}']
  }
}

// Methods
const getTemplateTitle = (key) => {
  return templateInfo[key]?.title || key
}

const getTemplateDescription = (key) => {
  return templateInfo[key]?.description || ''
}

const getRelevantVariables = (key) => {
  return templateInfo[key]?.variables || []
}

const loadTemplates = async () => {
  loading.value = true

  try {
    const response = await api.get('email-templates')

    if (response.data.success) {
      templates.value = response.data.templates
    }
  } catch (err) {
    console.error('Error loading templates:', err)
    saveError.value = 'Failed to load templates.'
  } finally {
    loading.value = false
  }
}

const editTemplate = (template) => {
  editingTemplate.value = template
  editForm.value = {
    subject: template.subject,
    body: template.body,
    enabled: template.enabled
  }
}

const closeEditModal = () => {
  editingTemplate.value = null
  editForm.value = {
    subject: '',
    body: '',
    enabled: true
  }
}

const saveTemplate = async () => {
  saving.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const response = await api.put(
      `email-templates/${editingTemplate.value.template_key}`,
      editForm.value
    )

    if (response.data.success) {
      saveSuccess.value = 'Template saved successfully.'
      
      // Update in list
      const index = templates.value.findIndex(
        t => t.template_key === editingTemplate.value.template_key
      )
      if (index !== -1) {
        templates.value[index] = {
          ...templates.value[index],
          ...editForm.value
        }
      }
      
      closeEditModal()
      
      // Hide success after 3 seconds
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    } else {
      saveError.value = response.data.message || 'Failed to save template.'
    }
  } catch (err) {
    console.error('Error saving template:', err)
    saveError.value = err.response?.data?.message || err.message || 'Failed to save template.'
  } finally {
    saving.value = false
  }
}

const toggleEnabled = async (template) => {
  const newEnabled = !template.enabled

  try {
    const response = await api.put(
      `email-templates/${template.template_key}`,
      {
        subject: template.subject,
        body: template.body,
        enabled: newEnabled
      }
    )

    if (response.data.success) {
      template.enabled = newEnabled
      saveSuccess.value = `Template ${newEnabled ? 'enabled' : 'disabled'}.`
      
      setTimeout(() => {
        saveSuccess.value = ''
      }, 2000)
    }
  } catch (err) {
    console.error('Error toggling template:', err)
    saveError.value = 'Failed to update template status.'
  }
}

const resetTemplate = async (template) => {
  if (!confirm(`Reset "${getTemplateTitle(template.template_key)}" to default? This cannot be undone.`)) {
    return
  }

  try {
    const response = await api.post(`email-templates/${template.template_key}`)

    if (response.data.success) {
      saveSuccess.value = 'Template reset to default successfully.'
      
      // Reload templates
      await loadTemplates()
      
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    } else {
      saveError.value = response.data.message || 'Failed to reset template.'
    }
  } catch (err) {
    console.error('Error resetting template:', err)
    saveError.value = err.response?.data?.message || err.message || 'Failed to reset template.'
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import EmailTemplates from '../views/EmailTemplates.vue'
```

**Add route:**
```javascript
{
  path: '/settings/templates',
  name: 'EmailTemplates',
  component: EmailTemplates,
  meta: { requiresAdmin: true }
}
```

### 3. Uncomment Templates Link in Sidebar

Now uncomment the Email Templates link in your sidebar settings section:

```vue
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
```

## Testing

### Test 1: Load Email Templates Page
1. Navigate to `/bookit-dashboard/app/settings/templates`
2. Page loads ✓
3. Shows 5 templates ✓
4. Each shows title and description ✓
5. Enable/disable toggle shown ✓
6. Variables info box at top ✓

### Test 2: Show/Hide Preview
1. Click "Show Preview" on any template
2. Preview expands ✓
3. Shows subject and body ✓
4. Click "Hide Preview"
5. Preview collapses ✓

### Test 3: Edit Template
1. Click "Edit" on Booking Confirmation
2. Modal opens ✓
3. Subject pre-filled ✓
4. Body pre-filled ✓
5. Variables shown below ✓
6. Preview updates as you type ✓

### Test 4: Save Template Changes
1. Edit subject to "TEST: Booking Confirmed"
2. Edit body text
3. Click "Save Template"
4. Success message appears ✓
5. Modal closes ✓
6. Changes reflected in list ✓
7. Refresh page ✓
8. Changes persisted ✓

### Test 5: Copy Variable
1. Open edit modal
2. Click on a variable button (e.g., {customer_name})
3. Variable copied to clipboard ✓
4. Can paste into body field ✓

### Test 6: Toggle Enabled/Disabled
1. Click toggle switch on any template
2. Badge changes from "Enabled" to "Disabled" ✓
3. Success message shows ✓
4. Refresh page ✓
5. Status persisted ✓

### Test 7: Reset Template
1. Edit a template significantly
2. Save changes
3. Click "Reset to Default"
4. Confirmation dialog appears ✓
5. Confirm reset
6. Template restored to original ✓
7. Success message shown ✓

### Test 8: Cancel Edit
1. Open edit modal
2. Make changes
3. Click "Cancel"
4. Modal closes ✓
5. Changes NOT saved ✓

### Test 9: Close Modal (Click Outside)
1. Open edit modal
2. Click dark background outside modal
3. Modal closes ✓
4. Changes NOT saved ✓

### Test 10: All 5 Templates Present
1. Check template list
2. See all 5 templates:
   - Booking Confirmation ✓
   - Booking Reminder ✓
   - Booking Cancelled ✓
   - New Booking (Admin) ✓
   - New Booking (Staff) ✓

### Test 11: Verify Database Updates
```sql
SELECT template_key, subject, enabled 
FROM wp_bookings_email_templates 
ORDER BY template_key;
```

Expected: Changes from tests reflected in database

### Test 12: Admin-Only Access
1. Log in as staff (non-admin)
2. Try to access `/settings/templates`
3. Blocked or redirected ✓

## Notes

- Admin-only access (route meta)
- 5 email templates from database
- Edit modal with live preview
- Copy-to-clipboard for variables
- Enable/disable individual templates
- Reset to default with confirmation
- Template variables documented in info box
- Relevant variables shown per template type
- Monospace font for template body (easier to read variables)
- Success messages auto-hide after 2-3 seconds
- Click outside modal to close
- Escape key could close modal (optional enhancement)
```

---

## ⏸️ AFTER PART D

**This completes Task 11!**

After testing Part D:

1. **Test all 12 scenarios** above
2. **Edit and save** at least 2 templates
3. **Toggle enable/disable** on a template
4. **Reset a template** to default
5. **Verify persistence** (refresh and check)

**Then say:** "Task 11 complete! All parts done!"

---

## 🎉 TASK 11 SUMMARY

When complete, you'll have:

✅ **Part A:** Backend API (profile, settings, templates)
✅ **Part B:** My Profile page (with password verification for email)
✅ **Part C:** Email Configuration page (SMTP settings)
✅ **Part D:** Email Templates page (customize all 5 templates)

**Total: 10 hours estimated**

---

**Apply this Part D prompt now!** 🚀