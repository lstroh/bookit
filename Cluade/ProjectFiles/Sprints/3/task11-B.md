# 🎉 PERFECT! Part A Complete!

Now let's build the My Profile page where staff can update their own information and change their password.

---

# 📝 TASK 11 PART B: MY PROFILE PAGE

```markdown
# Task 11 Part B: My Profile Frontend Page

## Context
Task 11 Part A (backend API) is complete and tested. All endpoints working:
- GET/PUT /dashboard/profile
- POST /dashboard/profile/change-password

Now we need the My Profile page where any authenticated staff member can:
- View their profile information
- Update their own details (name, email, phone, title, bio, photo)
- Change their password (requires current password)
- Cannot change their own role (security)

## Project Structure

Vue dashboard at: `dashboard/src/`

Existing components:
- `components/StaffFormModal.vue` (Task 9) - can reference for photo upload

## Requirements

### 1. Create My Profile View

Create new file `dashboard/src/views/MyProfile.vue`:

```vue
<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
      <p class="text-sm text-gray-600 mt-1">
        Manage your personal information and account settings
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading profile...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Success/Error Messages -->
      <div v-if="saveSuccess" class="bg-green-50 border border-green-200 rounded p-3">
        <p class="text-sm text-green-800">✓ {{ saveSuccess }}</p>
      </div>
      <div v-if="saveError" class="bg-red-50 border border-red-200 rounded p-3">
        <p class="text-sm text-red-800">{{ saveError }}</p>
      </div>

      <!-- Profile Information Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Profile Information</h2>
          <p class="text-sm text-gray-500 mt-1">
            Update your personal details and profile photo
          </p>
        </div>

        <form @submit.prevent="saveProfile" class="px-6 py-6 space-y-6">
          <!-- Profile Photo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div class="flex items-center gap-4">
              <!-- Photo Preview -->
              <div class="flex-shrink-0">
                <img
                  v-if="profile.photo_url"
                  :src="profile.photo_url"
                  alt="Profile photo"
                  class="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div
                  v-else
                  class="h-20 w-20 rounded-full flex items-center justify-center text-white font-semibold text-xl border-2 border-gray-200"
                  :style="{ backgroundColor: getColorForInitials(profile.first_name + ' ' + profile.last_name) }"
                >
                  {{ getInitials(profile.first_name + ' ' + profile.last_name) }}
                </div>
              </div>
              
              <!-- Upload Button -->
              <div class="flex-1">
                <button
                  type="button"
                  @click="openMediaLibrary"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {{ profile.photo_url ? 'Change Photo' : 'Upload Photo' }}
                </button>
                <button
                  v-if="profile.photo_url"
                  type="button"
                  @click="profile.photo_url = ''"
                  class="ml-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
                <p class="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <!-- Name -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                v-model="profile.first_name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                v-model="profile.last_name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              v-model="profile.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <!-- Phone and Title -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                v-model="profile.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                v-model="profile.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              v-model="profile.bio"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description about yourself..."
            ></textarea>
          </div>

          <!-- Role (Read-Only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg"
                :class="profile.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'"
              >
                {{ profile.role === 'admin' ? 'Admin' : 'Staff' }}
              </span>
              <p class="text-xs text-gray-500">
                Contact an administrator to change your role
              </p>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              :disabled="savingProfile"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ savingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Change Password</h2>
          <p class="text-sm text-gray-500 mt-1">
            Update your password to keep your account secure
          </p>
        </div>

        <form @submit.prevent="changePassword" class="px-6 py-6 space-y-4">
          <!-- Current Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <input
              v-model="passwordForm.current_password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-500': passwordError }"
            />
          </div>

          <!-- New Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              required
              minlength="8"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          <!-- Confirm New Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              required
              minlength="8"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{ 'border-red-500': passwordMismatch }"
            />
            <p v-if="passwordMismatch" class="text-xs text-red-600 mt-1">
              Passwords do not match
            </p>
          </div>

          <!-- Password Error -->
          <div v-if="passwordError" class="bg-red-50 border border-red-200 rounded p-3">
            <p class="text-sm text-red-800">{{ passwordError }}</p>
          </div>

          <!-- Password Success -->
          <div v-if="passwordSuccess" class="bg-green-50 border border-green-200 rounded p-3">
            <p class="text-sm text-green-800">✓ {{ passwordSuccess }}</p>
          </div>

          <!-- Change Password Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              :disabled="changingPassword || passwordMismatch"
              class="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const api = useApi()

// State
const loading = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const saveSuccess = ref('')
const saveError = ref('')
const passwordSuccess = ref('')
const passwordError = ref('')

const profile = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  title: '',
  bio: '',
  photo_url: '',
  role: ''
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// Computed
const passwordMismatch = computed(() => {
  return passwordForm.value.new_password && 
         passwordForm.value.confirm_password && 
         passwordForm.value.new_password !== passwordForm.value.confirm_password
})

// Methods
const loadProfile = async () => {
  loading.value = true

  try {
    const response = await api.get('profile')

    if (response.data.success) {
      profile.value = response.data.profile
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    saveError.value = 'Failed to load profile.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  savingProfile.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const response = await api.put('profile', {
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      email: profile.value.email,
      phone: profile.value.phone,
      title: profile.value.title,
      bio: profile.value.bio,
      photo_url: profile.value.photo_url
    })

    if (response.data.success) {
      saveSuccess.value = response.data.message
      profile.value = response.data.profile
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    } else {
      saveError.value = response.data.message || 'Failed to save profile'
    }
  } catch (err) {
    console.error('Error saving profile:', err)
    if (err.response?.data?.code === 'duplicate_email') {
      saveError.value = 'This email is already in use by another staff member.'
    } else {
      saveError.value = err.response?.data?.message || err.message || 'Failed to save profile'
    }
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  if (passwordMismatch.value) return

  changingPassword.value = true
  passwordSuccess.value = ''
  passwordError.value = ''

  try {
    const response = await api.post('profile/change-password', {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password
    })

    if (response.data.success) {
      passwordSuccess.value = response.data.message
      
      // Clear form
      passwordForm.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        passwordSuccess.value = ''
      }, 5000)
    } else {
      passwordError.value = response.data.message || 'Failed to change password'
    }
  } catch (err) {
    console.error('Error changing password:', err)
    if (err.response?.status === 401) {
      passwordError.value = 'Current password is incorrect.'
    } else {
      passwordError.value = err.response?.data?.message || err.message || 'Failed to change password'
    }
  } finally {
    changingPassword.value = false
  }
}

const openMediaLibrary = () => {
  if (typeof wp !== 'undefined' && wp.media) {
    const mediaFrame = wp.media({
      title: 'Select Profile Photo',
      button: {
        text: 'Use this photo'
      },
      multiple: false,
      library: {
        type: 'image'
      }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      profile.value.photo_url = attachment.url
    })

    mediaFrame.open()
  } else {
    alert('WordPress media library not available.')
  }
}

const getInitials = (fullName) => {
  if (!fullName || fullName.trim() === ' ') return '??'
  const names = fullName.trim().split(' ').filter(n => n)
  if (names.length === 0) return '??'
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

const getColorForInitials = (name) => {
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

// Lifecycle
onMounted(() => {
  loadProfile()
})
</script>
```

### 2. Update Router

Update `dashboard/src/router/index.js`:

**Add import:**
```javascript
import MyProfile from '../views/MyProfile.vue'
```

**Add route:**
```javascript
{
  path: '/profile',
  name: 'MyProfile',
  component: MyProfile
}
```

### 3. Add Navigation Link

Update your main navigation to include a profile link (usually in the header or user menu).

**If you have a user dropdown menu**, add:
```vue
<router-link
  to="/profile"
  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  My Profile
</router-link>
```

**Or add to sidebar navigation:**
```vue
<router-link
  to="/profile"
  class="flex items-center px-4 py-2 text-sm font-medium rounded-lg"
  :class="$route.path === '/profile' 
    ? 'bg-primary-100 text-primary-900' 
    : 'text-gray-700 hover:bg-gray-100'"
>
  👤 My Profile
</router-link>
```

## Testing

### Test 1: Navigate to My Profile
1. Navigate to `/bookit-dashboard/app/profile`
2. Profile page loads ✓
3. Current profile data shown ✓
4. Photo or initials displayed ✓
5. Role badge shown (Admin or Staff) ✓

### Test 2: Update Profile Information
1. Change first name to "UpdatedFirst"
2. Change last name to "UpdatedLast"
3. Update phone number
4. Click "Save Profile"
5. Success message appears ✓
6. Changes reflected immediately ✓
7. Refresh page ✓
8. Changes persisted ✓

### Test 3: Upload Photo
1. Click "Upload Photo"
2. WordPress media library opens ✓
3. Select an image
4. Image URL populated ✓
5. Preview shows new image ✓
6. Click "Save Profile"
7. Photo saved ✓

### Test 4: Remove Photo
1. Have a photo uploaded
2. Click "Remove"
3. Photo cleared ✓
4. Initials shown instead ✓
5. Click "Save Profile"
6. Photo removal saved ✓

### Test 5: Change Password (Success)
1. Enter correct current password
2. Enter new password (8+ chars)
3. Confirm new password (matching)
4. Click "Change Password"
5. Success message appears ✓
6. Form cleared ✓
7. Log out and log in with new password ✓

### Test 6: Change Password (Wrong Current)
1. Enter incorrect current password
2. Enter new password
3. Click "Change Password"
4. Error: "Current password is incorrect" ✓

### Test 7: Change Password (Mismatch)
1. Enter correct current password
2. Enter new password: "newpass123"
3. Confirm password: "newpass456"
4. Error shown: "Passwords do not match" ✓
5. Button disabled ✓

### Test 8: Duplicate Email
1. Change email to another staff member's email
2. Click "Save Profile"
3. Error: "This email is already in use" ✓

### Test 9: Required Fields
1. Clear first name
2. Click "Save Profile"
3. HTML5 validation prevents submission ✓

### Test 10: Role is Read-Only
1. See role badge displayed ✓
2. Cannot edit role ✓
3. Help text shown ✓

## Notes

- Any authenticated user (admin or staff) can access
- Cannot change own role (security)
- Password change requires current password
- Photo upload via WordPress media library
- Colored initials fallback if no photo
- Duplicate email validation
- Success messages auto-hide after 3-5 seconds
- Form cleared after successful password change
- Role displayed as read-only badge
- Separate cards for profile vs password
- Max-width container (max-w-4xl) for better readability
```

---

## ⏸️ PAUSE AFTER PART B

**After implementing Part B:**

1. **Navigate to My Profile** page
2. **Update profile information** (name, email, phone)
3. **Upload and remove photo**
4. **Test password change** (success and error cases)
5. **Verify duplicate email** validation
6. **Check all 10 test scenarios**

**Then say:** "Part B complete, ready for Part C!"

I'll give you **Part C (Email Configuration Page)** next! 🚀

---

**Apply this Part B prompt now!** Let me know when it's done and tested!