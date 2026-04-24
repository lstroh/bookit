# TASK 2 OF 2: StaffFormModal Photo Upload — File Input + REST Endpoint
Sprint: 6E | Est: ~4h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/components/StaffFormModal.vue` — Read the ENTIRE file.
   Specifically understand:
   - The `openMediaLibrary()` function and the `prompt()` fallback (lines to remove)
   - The photo upload button section in the template (exact HTML to replace)
   - How `isEditing` is computed (`!!props.staffMember`)
   - How `props.staffMember` is used — specifically that `props.staffMember?.id`
     is the staff ID needed for the upload endpoint
   - How `formData.value.photo_url` is used for the preview image
   - The existing `ref()` state variables to avoid name collisions
   - That `useApi` returns an axios instance — NOT used for multipart uploads
     (axios sets `Content-Type: application/json` by default; multipart requires
     raw `fetch()` so the browser sets the correct boundary automatically)

2. `dashboard/src/composables/useApi.js` — Read to confirm `useApi` uses axios
   with `Content-Type: application/json` hardcoded. Confirm that multipart
   uploads MUST use `fetch()` directly, not `api.post()`.

3. `dashboard/app/index.php` — Read to confirm:
   - `window.BOOKIT_DASHBOARD.apiBase` resolves to `rest_url('bookit/v1/dashboard')`
   - `window.BOOKIT_DASHBOARD.nonce` is the `wp_rest` nonce
   These are used in the Vue fetch call.

4. `includes/api/class-dashboard-bookings-api.php` — Read:
   - The `register_routes()` method — find the staff routes section and read
     the existing `'/dashboard/staff/(?P<id>\d+)'` route registration to follow
     the same pattern for the new photo route
   - The `check_dashboard_permission()` method — this is the permission
     callback to use (both admin and staff can upload their own photo;
     the method body enforces further role checks)
   - The `check_admin_permission()` method — read to understand the difference
   - Any existing file upload handling — search for `wp_handle_upload` in the
     file; it is not currently used, so there is no prior pattern to follow

5. `tests/unit/test-profile-api.php` — Read for the `login_as()` helper,
   `create_test_staff()` helper, and the general test class structure to follow.

6. `tests/unit/test-notification-settings-api.php` — Read as a second
   reference for test helper patterns.

If any file does not exist or conflicts with what is described above,
stop and report back before proceeding.

---

## CONTEXT

`StaffFormModal.vue` has a photo upload button that calls `openMediaLibrary()`,
which falls back to a browser `prompt()` when `wp.media()` is unavailable
(which it always is since Sprint 6C removed `wp_enqueue_media()`). This is
unacceptable for production.

This task replaces the `prompt()` with a proper `<input type="file">` approach:
the user clicks a button, a native OS file picker opens, they select an image,
and it is uploaded to WordPress via a new REST endpoint. The endpoint registers
the image in the WordPress media library and updates `wp_bookings_staff.photo_url`.

This endpoint is also the one the Phase 2 React Native mobile app will use —
it must exist before mobile work begins.

**Permission model:**
- Admin role: can upload photo for any staff ID
- Staff role: can only upload photo for their own staff ID

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-dashboard-bookings-api.php — MODIFY

#### Route registration (in `register_routes()`)

Add after the existing `'/dashboard/staff/(?P<id>\d+)'` route block.
Read that block first to follow the exact registration pattern.

```php
// Upload staff photo.
register_rest_route(
    self::NAMESPACE,
    '/dashboard/staff/(?P<id>\d+)/photo',
    array(
        'methods'             => 'POST',
        'callback'            => array( $this, 'upload_staff_photo' ),
        'permission_callback' => array( $this, 'check_dashboard_permission' ),
        'args'                => array(
            'id' => array(
                'required'          => true,
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param ) && (int) $param > 0;
                },
            ),
        ),
    )
);
```

#### New method: `upload_staff_photo()`

Add this method to the class. Read the existing `update_staff()` method
first to follow the same `$wpdb->update()` pattern for `wp_bookings_staff`.

```php
/**
 * Upload a staff member's profile photo.
 *
 * Accepts multipart/form-data with a file field named 'photo'.
 * Validates type (image only) and size (5MB max).
 * Inserts into WordPress media library and updates photo_url.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
public function upload_staff_photo( WP_REST_Request $request ) {
    global $wpdb;

    $staff_id      = (int) $request->get_param( 'id' );
    $current_staff = Bookit_Auth::get_current_staff();

    if ( ! $current_staff ) {
        return new WP_Error(
            'unauthorized',
            'Could not retrieve staff information.',
            array( 'status' => 401 )
        );
    }

    // Staff can only upload their own photo; admin can upload for anyone.
    if ( 'staff' === $current_staff['role'] && (int) $current_staff['id'] !== $staff_id ) {
        return new WP_Error(
            'forbidden',
            'You can only upload a photo for your own account.',
            array( 'status' => 403 )
        );
    }

    // Verify the target staff member exists and is not deleted.
    $target = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}bookings_staff
             WHERE id = %d AND deleted_at IS NULL",
            $staff_id
        ),
        ARRAY_A
    );

    if ( ! $target ) {
        return new WP_Error(
            'staff_not_found',
            'Staff member not found.',
            array( 'status' => 404 )
        );
    }

    // Get uploaded file from request.
    $files = $request->get_file_params();
    $file  = $files['photo'] ?? null;

    if ( ! $file || empty( $file['tmp_name'] ) ) {
        return new WP_Error(
            'no_file',
            'No file uploaded. Send an image in the "photo" field.',
            array( 'status' => 400 )
        );
    }

    // Validate mime type using finfo (server-side, not client-reported).
    $allowed_types = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp' );
    $finfo         = new finfo( FILEINFO_MIME_TYPE );
    $mime          = $finfo->file( $file['tmp_name'] );

    if ( ! in_array( $mime, $allowed_types, true ) ) {
        return new WP_Error(
            'invalid_type',
            'File must be an image (JPG, PNG, GIF, or WebP).',
            array( 'status' => 400 )
        );
    }

    // Validate file size (5MB max).
    if ( $file['size'] > 5 * 1024 * 1024 ) {
        return new WP_Error(
            'file_too_large',
            'File must be 5MB or less.',
            array( 'status' => 400 )
        );
    }

    // Load WordPress upload/media helpers.
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';

    // Move file to uploads directory.
    $overrides = array( 'test_form' => false );
    $upload    = wp_handle_upload( $file, $overrides );

    if ( isset( $upload['error'] ) ) {
        return new WP_Error(
            'upload_failed',
            $upload['error'],
            array( 'status' => 500 )
        );
    }

    // Register in WordPress media library.
    $attachment_id = wp_insert_attachment(
        array(
            'post_mime_type' => $upload['type'],
            'post_title'     => sanitize_file_name( $file['name'] ),
            'post_content'   => '',
            'post_status'    => 'inherit',
        ),
        $upload['file']
    );

    if ( is_wp_error( $attachment_id ) ) {
        return new WP_Error(
            'attachment_failed',
            'Could not register file in media library.',
            array( 'status' => 500 )
        );
    }

    wp_update_attachment_metadata(
        $attachment_id,
        wp_generate_attachment_metadata( $attachment_id, $upload['file'] )
    );

    $url = wp_get_attachment_url( $attachment_id );

    // Update staff photo_url.
    $result = $wpdb->update(
        $wpdb->prefix . 'bookings_staff',
        array(
            'photo_url'  => $url,
            'updated_at' => current_time( 'mysql' ),
        ),
        array( 'id' => $staff_id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    if ( false === $result ) {
        return new WP_Error(
            'db_update_failed',
            'File uploaded but failed to update staff record.',
            array( 'status' => 500 )
        );
    }

    Bookit_Audit_Logger::log(
        'staff.photo_uploaded',
        'staff',
        $staff_id,
        array(
            'notes' => 'Photo uploaded via dashboard',
        )
    );

    return rest_ensure_response(
        array(
            'success' => true,
            'url'     => $url,
        )
    );
}
```

---

### dashboard/src/components/StaffFormModal.vue — MODIFY

Read the full file before making any changes.

#### Script changes

**Remove** the entire `openMediaLibrary()` function — both the comment block
and the function body (including the `prompt()` fallback).

**Add** these reactive state variables in the `// State` section alongside the
existing `saving`, `loadingDetails`, etc.:

```javascript
const uploadingPhoto = ref(false)
const photoUploadError = ref('')
```

**Add** this upload handler function after the removed `openMediaLibrary()`:

```javascript
// Handle photo file selection and upload.
const onPhotoSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Client-side validation before uploading.
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoUploadError.value = 'Please select a JPG, PNG, GIF, or WebP image.'
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoUploadError.value = 'Image must be 5MB or less.'
    event.target.value = ''
    return
  }

  photoUploadError.value = ''
  uploadingPhoto.value = true

  try {
    const formPayload = new FormData()
    formPayload.append('photo', file)

    // Use fetch directly — axios sets Content-Type: application/json by default.
    // Multipart requires the browser to set Content-Type with the correct boundary,
    // which only works when no Content-Type header is set manually.
    const response = await fetch(
      `${window.BOOKIT_DASHBOARD.apiBase}/staff/${props.staffMember?.id}/photo`,
      {
        method: 'POST',
        headers: {
          'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce,
          // Do NOT set Content-Type here — let the browser set it with the boundary.
        },
        body: formPayload,
        credentials: 'include',
      }
    )

    const data = await response.json()

    if (data.success && data.url) {
      formData.value.photo_url = data.url
      photoUploadError.value = ''
    } else {
      photoUploadError.value = data.message || 'Upload failed. Please try again.'
    }
  } catch (err) {
    photoUploadError.value = 'Upload failed. Please try again.'
    console.error('Photo upload error:', err)
  } finally {
    uploadingPhoto.value = false
    // Reset input so the same file can be re-selected if needed.
    event.target.value = ''
  }
}
```

#### Template changes

Read the existing photo upload section in the template carefully before
editing. Find the button that calls `@click="openMediaLibrary"` and the
surrounding `<div class="flex-1">` block.

Replace the entire contents of that `<div class="flex-1">` with:

```html
<div class="flex-1">
  <!-- Hidden file input — triggered by the button below -->
  <input
    ref="photoInput"
    type="file"
    accept="image/jpeg,image/png,image/gif,image/webp"
    class="hidden"
    @change="onPhotoSelected"
  />

  <!-- Upload button (editing only — photo upload requires a staff ID) -->
  <template v-if="isEditing">
    <button
      type="button"
      @click="$refs.photoInput.click()"
      :disabled="uploadingPhoto"
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border
             border-gray-300 rounded-lg hover:bg-gray-50
             disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="uploadingPhoto">Uploading...</span>
      <span v-else>{{ formData.photo_url ? 'Change Photo' : 'Upload Photo' }}</span>
    </button>

    <button
      v-if="formData.photo_url"
      type="button"
      @click="formData.photo_url = ''"
      class="ml-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
    >
      Remove
    </button>

    <p v-if="photoUploadError" class="text-xs text-red-600 mt-1">
      {{ photoUploadError }}
    </p>
  </template>

  <!-- New staff: photo upload requires saving first -->
  <template v-else>
    <p class="text-xs text-gray-500">
      Save the staff member first, then add a photo.
    </p>
  </template>

  <p class="text-xs text-gray-500 mt-1">
    JPG, PNG, GIF or WebP. Max 5MB.
  </p>
</div>
```

**Note on `$refs.photoInput`:** This uses the Options API `$refs` syntax, which
works in `<script setup>` when a `ref` with the same name (`photoInput`) is
declared. The `ref="photoInput"` on the input element binds it. In `<script setup>`,
`const photoInput = ref(null)` must be declared for this to work — add it with
the other `ref()` declarations. Then `$refs.photoInput.click()` in the template
resolves to the same element.

Alternatively, if `$refs` syntax feels inconsistent with the existing `<script setup>`
style, replace `@click="$refs.photoInput.click()"` with `@click="photoInput.click()"` —
both are valid in Vue 3 `<script setup>`.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] New REST route registered in `register_routes()` — auto-discovered by
      WordPress REST API (no additional registration needed)
- [ ] No new migration required — `photo_url` column already exists on
      `wp_bookings_staff`
- [ ] No new error codes in error registry — standard `WP_Error` responses
- [ ] Audit log event `staff.photo_uploaded` fired via `Bookit_Audit_Logger`

---

## PHPUNIT REQUIREMENTS

Baseline: **976 tests, 0 failures** — must not regress.

Write new test file: `tests/unit/test-staff-photo-upload.php`

Read `tests/unit/test-profile-api.php` first and follow its class structure,
`setUp()`, `tearDown()`, `login_as()`, and `create_test_staff()` helpers exactly.

**Important note on `wp_handle_upload()` in tests:** `wp_handle_upload()` requires
an actual uploaded file in `$_FILES` and the WordPress upload directory to be
writable. In the wp-env PHPUnit environment, use the `pre_move_uploaded_file` filter
to bypass the actual file move:

```php
// In setUp() or per-test:
add_filter( 'pre_move_uploaded_file', function( $false, $file, $new_file ) {
    // Create a minimal valid image in the destination path.
    copy( $file['tmp_name'], $new_file );
    return $new_file;
}, 10, 3 );
```

For tests that need to simulate a real file, create a temporary image file:
```php
$tmp = tempnam( sys_get_temp_dir(), 'bookit_test_' );
imagejpeg( imagecreatetruecolor( 10, 10 ), $tmp );
$_FILES['photo'] = array(
    'name'     => 'test.jpg',
    'type'     => 'image/jpeg',
    'tmp_name' => $tmp,
    'error'    => UPLOAD_ERR_OK,
    'size'     => filesize( $tmp ),
);
```

Search existing tests for any prior use of `wp_handle_upload` or `$_FILES` — if
there is an established pattern, follow it instead.

**Required test cases:**

- `test_photo_upload_requires_authentication`
  Call `POST /dashboard/staff/{id}/photo` with no session → assert 401.

- `test_photo_upload_rejects_non_image_file`
  Create a `$_FILES['photo']` entry with a `.txt` file (mime: `text/plain`).
  Call the endpoint as admin → assert 400 with error code `invalid_type`.
  (Use a real temp file with text content so `finfo` returns `text/plain`.)

- `test_photo_upload_rejects_oversized_file`
  Set `$_FILES['photo']['size']` to `6 * 1024 * 1024` (6MB) without
  creating an actual 6MB file — the size check runs before `wp_handle_upload()`.
  Call as admin → assert 400 with error code `file_too_large`.

- `test_staff_cannot_upload_photo_for_other_staff`
  Create two staff members. Log in as the first (role: staff).
  Attempt upload for the second staff member's ID → assert 403.

- `test_admin_can_upload_photo_for_any_staff`
  Create a staff member. Log in as a different staff member with role admin.
  Mock `wp_handle_upload()` via filter to return a valid upload array.
  Call endpoint → assert 200 with `success: true` and a `url` key.

- `test_successful_upload_updates_photo_url_in_db`
  Create a staff member. Log in as admin.
  Mock `wp_handle_upload()` to return a fake URL.
  Call endpoint → read `photo_url` from `wp_bookings_staff` → assert it matches
  the URL returned in the response.

Run after implementation:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass (976+ tests, 0 failures) before marking task complete.

---

## FRONTEND BUILD

After all PHP and Vue changes are complete:

```bash
cd bookit-booking-system/dashboard
npm run build
```

Then deploy:
1. Delete the entire `dist/` folder on the server
2. Upload the fresh `dist/` build
3. Purge all three cache layers: LiteSpeed → Hostinger server → CDN

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Clicking "Upload Photo" on an existing staff member opens the native
      OS file picker (not a `prompt()` dialog)
- [ ] Selecting a non-image file shows an inline error message; no upload occurs
- [ ] Selecting an image over 5MB shows an inline error message; no upload occurs
- [ ] Selecting a valid image uploads it and the photo preview updates immediately
- [ ] "Upload Photo" button shows "Uploading..." and is disabled during upload
- [ ] For a new (unsaved) staff member, the upload button is replaced with
      "Save the staff member first, then add a photo."
- [ ] Staff role cannot upload photo for another staff member (403)
- [ ] Admin role can upload photo for any staff member

### Technical
- [ ] `openMediaLibrary()` function removed entirely from StaffFormModal.vue
- [ ] `prompt()` call removed entirely from StaffFormModal.vue
- [ ] Upload uses `fetch()` with `FormData` — NOT `api.post()` (axios)
- [ ] No `Content-Type` header set manually in the fetch call (browser sets boundary)
- [ ] PHP validates mime type using `finfo` (server-side), not client-reported type
- [ ] File registered in WordPress media library (`wp_insert_attachment` called)
- [ ] `wp_bookings_staff.photo_url` updated on successful upload
- [ ] Audit log entry created via `Bookit_Audit_Logger`
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors during upload flow
- [ ] PHPUnit: 976+ tests, 0 failures

### Must NOT break
- [ ] Existing staff create/update flow (name, email, services, etc.)
- [ ] Existing "Remove" photo button (`formData.photo_url = ''`)
- [ ] Photo URL field still saveable via `PUT /dashboard/staff/{id}` (unchanged)
- [ ] All other StaffFormModal functionality (password reset, Google Calendar, etc.)

---

## GIT COMMIT MESSAGE

```
Sprint 6E, Task 2: Replace StaffFormModal photo upload with file input + REST endpoint

- POST bookit/v1/dashboard/staff/{id}/photo: multipart upload to
  WordPress media library; validates mime type (finfo) and size (5MB);
  updates photo_url; admin can upload for any staff, staff only own
- StaffFormModal.vue: hidden file input replaces wp.media() + prompt()
  fallback; disabled for new staff (no ID yet); upload error displayed
  inline; uses fetch() + FormData (not axios — multipart boundary)
- Audit log: staff.photo_uploaded fired on success
- PHPUnit: N tests, 0 failures

Required before Phase 2 React Native mobile app (mobile uses this endpoint).
```

---

## KNOWN GOTCHAS

- **Do NOT set `Content-Type` in the fetch call.** Setting it manually breaks
  multipart uploads because the browser cannot append the correct `boundary`
  parameter. Omit the header entirely and let the browser set it from `FormData`.
- **`useApi` (axios) cannot be used for multipart.** The axios instance in
  `useApi.js` hardcodes `Content-Type: application/json`. Use raw `fetch()`.
- **`wp_handle_upload()` requires WordPress admin includes.** The three
  `require_once` calls for `file.php`, `image.php`, and `media.php` are
  mandatory — they are not loaded by default in REST API context.
- **`wp_bookings_staff.id` is the primary key** (not a `staff_id` column).
  The permission check compares `$current_staff['id']` to `$staff_id`.
- **Photo upload only works when editing** (existing staff with an ID).
  For new staff, `props.staffMember` is `null`, so `props.staffMember?.id`
  is `undefined` — the template correctly hides the button with `v-if="isEditing"`.
- **Vite build required** after any Vue file change. The `dist/` directory
  is gitignored — the build must be run manually in Local by Flywheel.
- **Deploy: always delete entire `dist/` on server** before uploading fresh build.
  Overwriting individual files leaves stale chunks when Vite hashes change.

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.