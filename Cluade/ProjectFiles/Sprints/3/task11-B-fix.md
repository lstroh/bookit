# 🔒 CURSOR PROMPT: Add Password Verification for Email Changes

```markdown
# Fix: Require Current Password for Email Changes in My Profile

## Context
The My Profile page allows users to change their email address without any verification, which is a security risk. We need to add a password confirmation requirement when the email is changed.

## Files to Modify

### File 1: dashboard/src/views/MyProfile.vue

#### Step 1: Add New Reactive State

In the `<script setup>` section, add these new refs after the existing state declarations:

```javascript
// Add after existing refs (around line 15-30)
const originalEmail = ref('')
const emailChanged = ref(false)
const emailPasswordConfirm = ref('')
```

#### Step 2: Store Original Email on Load

Update the `loadProfile` function to store the original email:

**Find:**
```javascript
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
```

**Replace with:**
```javascript
const loadProfile = async () => {
  loading.value = true

  try {
    const response = await api.get('profile')

    if (response.data.success) {
      profile.value = response.data.profile
      originalEmail.value = response.data.profile.email // Store original email
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    saveError.value = 'Failed to load profile.'
  } finally {
    loading.value = false
  }
}
```

#### Step 3: Add Password Verification to Save

Update the `saveProfile` function to verify password before allowing email change:

**Find:**
```javascript
const saveProfile = async () => {
  savingProfile.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const response = await api.put('profile', {
```

**Replace with:**
```javascript
const saveProfile = async () => {
  // Check if email changed and verify password first
  if (emailChanged.value) {
    if (!emailPasswordConfirm.value) {
      saveError.value = 'Please enter your current password to change your email address.'
      return
    }
    
    // Verify password before allowing email change
    try {
      await api.post('profile/verify-password', {
        password: emailPasswordConfirm.value
      })
    } catch (err) {
      saveError.value = 'Current password is incorrect. Email not changed.'
      return
    }
  }

  savingProfile.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const response = await api.put('profile', {
```

**Then find the success block:**
```javascript
    if (response.data.success) {
      saveSuccess.value = response.data.message
      profile.value = response.data.profile
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    }
```

**Replace with:**
```javascript
    if (response.data.success) {
      saveSuccess.value = response.data.message
      profile.value = response.data.profile
      
      // Reset email change tracking
      originalEmail.value = profile.value.email
      emailChanged.value = false
      emailPasswordConfirm.value = ''
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = ''
      }, 3000)
    }
```

#### Step 4: Update Email Input Field in Template

**Find this section in the template (around line 140-150):**
```vue
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
```

**Replace with:**
```vue
<!-- Email (with password verification if changed) -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Email Address *
  </label>
  <input
    v-model="profile.email"
    type="email"
    required
    @input="emailChanged = profile.email !== originalEmail"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  />
  
  <!-- Password confirmation (shown only if email changed) -->
  <div v-if="emailChanged" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
    <label class="block text-sm font-medium text-amber-900 mb-2">
      🔒 Confirm Current Password *
    </label>
    <input
      v-model="emailPasswordConfirm"
      type="password"
      required
      placeholder="Enter your current password"
      class="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
    />
    <p class="text-xs text-amber-700 mt-2">
      For security, we need to verify your password before changing your email address.
    </p>
  </div>
</div>
```

### File 2: includes/api/class-dashboard-bookings-api.php

#### Step 1: Add Password Verification Route

**Find the `register_routes()` method and add this route after the existing profile routes:**

```php
// Verify password (for email changes)
register_rest_route(
    self::NAMESPACE,
    '/dashboard/profile/verify-password',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'verify_password' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'password' => array(
                'required' => true,
                'type'     => 'string',
            ),
        ),
    )
);
```

#### Step 2: Add Password Verification Method

**Add this new method after the `change_password()` method:**

```php
/**
 * Verify password for current user
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function verify_password( $request ) {
    global $wpdb;

    $staff_id = $this->get_current_staff_id();
    $password = $request->get_param( 'password' );

    // Get current password hash
    $current_hash = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT password_hash FROM {$wpdb->prefix}bookings_staff WHERE id = %d",
            $staff_id
        )
    );

    if ( ! $current_hash ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Verify password
    if ( ! password_verify( $password, $current_hash ) ) {
        return new WP_Error(
            'invalid_password',
            'Password is incorrect.',
            array( 'status' => 401 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'Password verified.',
        )
    );
}
```

## Testing

### Test 1: Email Change with Correct Password
1. Navigate to My Profile
2. Change email from current to "newemail@test.com"
3. Password field appears below email ✓
4. Enter correct current password
5. Click "Save Profile"
6. Success message appears ✓
7. Email updated ✓

### Test 2: Email Change with Wrong Password
1. Change email to different address
2. Password field appears ✓
3. Enter WRONG password
4. Click "Save Profile"
5. Error: "Current password is incorrect" ✓
6. Email NOT changed ✓

### Test 3: Email Change Without Password
1. Change email
2. Password field appears ✓
3. Leave password field empty
4. Click "Save Profile"
5. Error: "Please enter your current password" ✓

### Test 4: No Password Required if Email Unchanged
1. Change first name only (don't touch email)
2. Password field does NOT appear ✓
3. Click "Save Profile"
4. Saves successfully without password ✓

### Test 5: Email Reverted (No Password Needed)
1. Change email
2. Password field appears ✓
3. Change email BACK to original
4. Password field disappears ✓
5. Save works without password ✓

### Test 6: Visual Feedback
1. Change email
2. Amber warning box appears ✓
3. Lock emoji (🔒) shown ✓
4. Explanation text clear ✓

## Notes

- Password field only appears when email is changed
- Amber background highlights security requirement
- Password verified BEFORE profile update
- If password wrong, profile save aborted
- After successful save, tracking resets
- Email changes to other fields don't require password
- Reverting email to original removes password requirement
```

---

## ✅ AFTER APPLYING

Run all 6 tests above to verify:
1. ✅ Password required when email changes
2. ✅ Wrong password prevents save
3. ✅ Empty password shows error
4. ✅ No password needed if email unchanged
5. ✅ Password field disappears if email reverted
6. ✅ Visual feedback clear

---

**Apply this prompt in Cursor and test!** Then say "Email security added, Part B complete!" 🔒