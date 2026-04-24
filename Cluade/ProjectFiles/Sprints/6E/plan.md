# SPRINT 6E: FINAL PRE-PHASE 2 TASKS
# Bookit Booking System — WordPress Plugin
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/

---

## YOUR ROLE

You are the Sprint Implementation Assistant for Sprint 6E — the final
pre-Phase 2 sprint. Two tasks. Generate one Cursor prompt per task.
Liron confirms each task complete before you move to the next.

Escalate any architectural conflict to the Project Assistant (separate chat).

---

## WORKFLOW RULES

- **Read before write.** The files are in the project knowledge.
- **Context7 for libraries.** Verify current API before any library-specific code.
- **One task at a time.** Confirmed complete before proceeding.
- **Frontend builds.** Task 2 modifies Vue files.
  After: `npm run build` in `bookit-booking-system/dashboard/`
  Then deploy: delete `dist/` on server, upload fresh build,
  purge all three cache layers (LiteSpeed → Hostinger server → CDN).

---

## PROJECT CONTEXT

- **Test suite baseline:** 971 tests, 0 failures (post-Playwright sprint)
- **PHPUnit:** `cd bookit-booking-system && vendor/bin/phpunit`
- **Playwright (full mode):** `cd bookit-booking-system/tests/e2e && npm run test:full`
- **Known gotchas:**
  - `information_schema.COLUMNS` for column checks — not `SHOW COLUMNS LIKE`
    (MariaDB underscore wildcard issue)
  - `get_full_booking()` must NOT filter `deleted_at IS NULL` — cancellation
    hook fires after soft-delete
  - `wp_bookings_staff.id` is the primary key (not `staff_id`)
  - Vite `base: './'` — never add `?v=` to entry JS. Use manifest hash.
  - `wp_enqueue_media()` must NOT be called at dashboard boot time

---

## TASK 6E-1 — Cancelled Slot Unique Constraint Bug Fix (~3h)

### Background

`wp_bookings` has:
```sql
UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)
```

This index has no partial condition on `status` or `deleted_at`. When a
booking is cancelled (`status='cancelled'`, `deleted_at` set), the row
remains in the table and permanently holds the unique slot.

Result: any attempt to create a new booking for the same staff/date/time
fails with a duplicate key error — even though the availability check
(which filters `status NOT IN ('cancelled')`) correctly shows the slot
as available.

Confirmed by WordPress error log:
```
Duplicate entry '6-2026-04-23-09:30:00' for key 'wp_bookings.unique_booking_slot'
```

Two Playwright E2E tests are currently failing because of this bug:
- `tests/full/magic-link.spec.ts` — reschedule test
- `tests/full/z-email-cancellation.spec.ts` — cancellation email test

### Solution: NULL out start_time and end_time on cancellation

MySQL/MariaDB unique indexes ignore NULL values by design. Setting
`start_time = NULL` and `end_time = NULL` on cancellation frees the
unique index slot so it can be re-booked.

### Preserving audit trail (IMPORTANT)

Liron requires proof of the original slot times after cancellation.
Add two new columns to preserve the original times before nulling them:

```sql
cancelled_start_time TIME NULL DEFAULT NULL
cancelled_end_time   TIME NULL DEFAULT NULL
```

On cancellation:
1. Copy `start_time` → `cancelled_start_time`
2. Copy `end_time` → `cancelled_end_time`
3. Set `start_time = NULL`, `end_time = NULL`

The original slot is preserved in `cancelled_*` columns.
`wp_bookings_status_log.changed_by_staff_id` already records who
cancelled (dashboard cancellations). For magic link cancellations
(customer-initiated), `changed_by_staff_id` is NULL — which correctly
distinguishes customer self-cancellation from admin/staff cancellation.

### Files to read before writing any Cursor prompt

1. `database/migrations/` — list all files to determine next migration
   number (likely 0020)
2. `includes/api/class-dashboard-bookings-api.php` — `cancel_booking()`
   method in full — read the entire UPDATE statement and surrounding logic
3. `includes/api/class-wizard-api.php` — magic link cancel endpoint —
   find where `status='cancelled'` and `deleted_at` are set
4. `includes/class-bookit-database.php` — `create_bookings_table()` —
   confirm current `start_time` and `end_time` column definitions
5. `database/schema.sql` — confirm current `start_time`/`end_time` types
6. Any PHPUnit tests that assert `start_time` is non-null after cancellation

### Implementation

**Migration (next number — check migrations/ directory first):**

```sql
-- Step 1: Add cancelled_start_time and cancelled_end_time columns
-- Use information_schema check (NOT SHOW COLUMNS LIKE — MariaDB wildcard issue)

-- Step 2: Modify start_time and end_time to allow NULL
ALTER TABLE {prefix}bookings
  MODIFY start_time TIME NULL DEFAULT NULL,
  MODIFY end_time   TIME NULL DEFAULT NULL;

-- Step 3: Add new columns for audit trail
ALTER TABLE {prefix}bookings
  ADD COLUMN cancelled_start_time TIME NULL DEFAULT NULL AFTER end_time,
  ADD COLUMN cancelled_end_time   TIME NULL DEFAULT NULL AFTER cancelled_start_time;
```

Use `information_schema.COLUMNS` to guard each column addition:
```php
$col_exists = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = %s
         AND COLUMN_NAME = %s",
        $wpdb->prefix . 'bookings',
        'cancelled_start_time'
    )
);
if ( ! $col_exists ) {
    // ALTER TABLE to add column
}
```

**`cancel_booking()` in `class-dashboard-bookings-api.php`:**

In the `$update_data` array, add:
```php
$update_data['cancelled_start_time'] = $existing['start_time'];
$update_data['cancelled_end_time']   = $existing['end_time'];
$update_data['start_time']           = null;
$update_data['end_time']             = null;
```

And update `$format` array to include `%s`, `%s`, `%s`, `%s` for
the four new fields (or `null` format — use `%s` for NULL values
in wpdb, as `$wpdb->update()` accepts null with `%s`).

**Magic link cancel in `class-wizard-api.php`:**

Find the equivalent UPDATE in the magic link cancel path and apply
the same pattern — copy times to `cancelled_*` columns, NULL out
`start_time` and `end_time`.

Read the file first to locate the exact UPDATE statement before writing.

**`class-bookit-database.php`:**

Update `create_bookings_table()` to reflect the new nullable
`start_time`/`end_time` and new `cancelled_*` columns for fresh
installs. Read the method first before making any changes.

**`schema.sql`:**

Update the `wp_bookings` table definition to match the new column
definitions. Read the file first.

### PHPUnit requirements

Baseline: 971 tests, 0 failures.

Read all existing cancellation-related test files before writing new tests.
Look for any test that:
- Asserts `start_time` is non-null after cancellation → update to assert
  `cancelled_start_time` is non-null instead
- Creates a booking then cancels it → may need updating if it tries to
  re-use the same slot

New test file: `tests/unit/test-cancelled-slot-fix.php`

Required test cases:
- `test_cancelled_booking_frees_unique_slot`
  Cancel a booking, then immediately create a new booking for the same
  staff/date/start_time — assert the second booking succeeds (not a
  duplicate key error)
- `test_cancel_preserves_original_times_in_cancelled_columns`
  Cancel a booking, read the row, assert `cancelled_start_time` and
  `cancelled_end_time` match the original `start_time`/`end_time`
- `test_cancelled_booking_has_null_start_time`
  Cancel a booking, assert `start_time IS NULL`
- `test_magic_link_cancel_also_frees_slot`
  Cancel via magic link path, assert slot is freed (same as above
  but via the wizard API cancel endpoint)
- `test_availability_check_ignores_cancelled_bookings`
  Confirm that after cancellation and re-booking, availability returns
  the slot as booked (not double-counting)

### Playwright verification

After PHPUnit passes, run full Playwright suite:
```
cd bookit-booking-system/tests/e2e
npm run test:full
```

Expected: magic-link reschedule test and cancellation email test now
pass. Report the new test counts back.

### Git commit message
```
Sprint 6E, Task 1: Fix cancelled slot unique constraint bug

- Migration 0020: allow NULL on start_time/end_time; add
  cancelled_start_time and cancelled_end_time columns
- cancel_booking(): copy times to cancelled_* before nulling
- magic link cancel: same pattern applied
- create_bookings_table() and schema.sql updated for fresh installs
- PHPUnit: N tests, 0 failures
- Playwright: magic-link reschedule and cancellation email now passing

Fixes: cancelled bookings permanently blocking their unique slot.
Preserves original slot times in cancelled_start_time/end_time for
audit trail. Slot can now be re-booked after cancellation.
```

---

## TASK 6E-2 — StaffFormModal Photo Upload (~4h)

### Background

`StaffFormModal.vue` has a photo upload button that calls
`openMediaLibrary()`. This function attempts to use `wp.media()` (the
WordPress media library), but `wp_enqueue_media()` was removed from the
dashboard app page in Sprint 6C to fix a Vue mount crash.

The current fallback is a `prompt()` dialog asking for a URL — which is
not a real upload and is unacceptable for production use.

The comment in `StaffFormModal.vue` already documents the fix needed:
```
// Until replaced (e.g. file input + REST upload, or lazy wp_enqueue_media),
// the fallback prompt below applies.
```

This task replaces the `prompt()` fallback with a proper file input
that uploads the image to the WordPress media library via a new REST
endpoint and returns the URL.

This endpoint is also needed by the Phase 2 mobile app — it must be
built before React Native mobile work begins.

### New REST endpoint

`POST bookit/v1/dashboard/staff/{id}/photo`
- **Auth:** session required (`check_dashboard_permission`)
- **Content-Type:** `multipart/form-data`
- **Body:** file field named `photo` (image file)
- **Validates:**
  - File must be present
  - File must be an image (check mime type: `image/jpeg`, `image/png`,
    `image/gif`, `image/webp`)
  - File size must be ≤ 5MB
  - Staff ID must exist and belong to the current user (staff can only
    upload their own photo; admin can upload for any staff member)
- **Processing:**
  - Use `wp_handle_upload()` to move the file to the WordPress uploads dir
  - Use `wp_insert_attachment()` and `wp_generate_attachment_metadata()`
    to register it in the WordPress media library
  - Update `wp_bookings_staff.photo_url` with the attachment URL
  - Return `{ success: true, url: "https://..." }`
- **On error:** return appropriate WP_Error with HTTP status

**Permission logic:**
- Admin role: can upload photo for any staff ID
- Staff role: can only upload photo for their own staff ID
  (check `$current_staff['id'] === $staff_id`)

### Files to read before writing any Cursor prompt

1. `includes/api/class-dashboard-bookings-api.php` — read `register_routes()`
   to understand the route registration pattern and find a similar
   existing file upload or staff update endpoint to follow
2. `dashboard/src/components/StaffFormModal.vue` — read the full
   `openMediaLibrary()` function and the photo upload button section
   in the template — understand exactly what needs to change in Vue
3. `includes/class-bookit-loader.php` — confirm where API classes
   are instantiated
4. Any existing file upload handling in the codebase — search for
   `wp_handle_upload` to see if it's used elsewhere

### PHP implementation notes

`wp_handle_upload()` requires the file to be in `$_FILES`. In a REST
API context, use `WP_REST_Request::get_file_params()` to access
uploaded files:

```php
$files = $request->get_file_params();
$file  = $files['photo'] ?? null;

if ( ! $file || empty( $file['tmp_name'] ) ) {
    return new WP_Error( 'no_file', 'No file uploaded.', array( 'status' => 400 ) );
}
```

Then:
```php
// Validate mime type before processing
$allowed = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp' );
$finfo    = new finfo( FILEINFO_MIME_TYPE );
$mime     = $finfo->file( $file['tmp_name'] );

if ( ! in_array( $mime, $allowed, true ) ) {
    return new WP_Error( 'invalid_type', 'File must be an image.', array( 'status' => 400 ) );
}

// Validate file size (5MB max)
if ( $file['size'] > 5 * 1024 * 1024 ) {
    return new WP_Error( 'file_too_large', 'File must be 5MB or less.', array( 'status' => 400 ) );
}

// WordPress upload handling
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$overrides   = array( 'test_form' => false );
$upload      = wp_handle_upload( $file, $overrides );

if ( isset( $upload['error'] ) ) {
    return new WP_Error( 'upload_failed', $upload['error'], array( 'status' => 500 ) );
}

// Register in media library
$attachment_id = wp_insert_attachment(
    array(
        'post_mime_type' => $upload['type'],
        'post_title'     => sanitize_file_name( $file['name'] ),
        'post_content'   => '',
        'post_status'    => 'inherit',
    ),
    $upload['file']
);

wp_update_attachment_metadata(
    $attachment_id,
    wp_generate_attachment_metadata( $attachment_id, $upload['file'] )
);

$url = wp_get_attachment_url( $attachment_id );

// Update staff photo_url
$wpdb->update(
    $wpdb->prefix . 'bookings_staff',
    array( 'photo_url' => $url ),
    array( 'id' => $staff_id ),
    array( '%s' ),
    array( '%d' )
);

return rest_ensure_response( array( 'success' => true, 'url' => $url ) );
```

### Vue implementation

In `StaffFormModal.vue`, replace the `openMediaLibrary()` function and
button with a hidden file input approach:

**Template changes:**
Replace the "Upload Photo" / "Change Photo" button section with:

```html
<!-- Hidden file input -->
<input
  ref="photoInput"
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp"
  class="hidden"
  @change="onPhotoSelected"
/>

<!-- Visible button triggers the hidden input -->
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
```

**Script changes:**

Remove `openMediaLibrary()` entirely.

Add reactive state:
```javascript
const uploadingPhoto = ref(false)
const photoUploadError = ref('')
```

Add upload handler:
```javascript
const onPhotoSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Client-side validation before uploading
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoUploadError.value = 'Please select a JPG, PNG, GIF, or WebP image.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoUploadError.value = 'Image must be 5MB or less.'
    return
  }

  photoUploadError.value = ''
  uploadingPhoto.value = true

  try {
    const formPayload = new FormData()
    formPayload.append('photo', file)

    // Use fetch directly (not api helper) — multipart needs special headers
    const response = await fetch(
      `${window.BOOKIT_DASHBOARD.apiBase}/staff/${props.staffMember?.id}/photo`,
      {
        method: 'POST',
        headers: {
          'X-WP-Nonce': window.BOOKIT_DASHBOARD.nonce,
        },
        body: formPayload,
        credentials: 'include',
      }
    )

    const data = await response.json()

    if (data.success && data.url) {
      formData.value.photo_url = data.url
    } else {
      photoUploadError.value = data.message || 'Upload failed. Please try again.'
    }
  } catch (err) {
    photoUploadError.value = 'Upload failed. Please try again.'
    console.error('Photo upload error:', err)
  } finally {
    uploadingPhoto.value = false
    // Reset file input so the same file can be re-selected if needed
    event.target.value = ''
  }
}
```

Add error display below the upload button in the template:
```html
<p v-if="photoUploadError" class="text-xs text-red-600 mt-1">
  {{ photoUploadError }}
</p>
```

**Note on staff ID for new staff members:**
The photo upload endpoint requires a `staff_id`. This means photo upload
only works when **editing** an existing staff member (when `props.staffMember`
has an `id`). For new staff members being created, the photo upload button
should either be hidden or show a message: "Save the staff member first,
then add a photo." Read `StaffFormModal.vue` to see how `isEditing` is
computed and use it to conditionally show/disable the upload button for
new staff.

### PHPUnit requirements

Baseline: post-Task 1 test count, 0 failures.

New test file: `tests/unit/test-staff-photo-upload.php`

Required test cases:
- `test_photo_upload_requires_authentication`
  Unauthenticated request → 401
- `test_photo_upload_rejects_non_image_file`
  Upload a `.txt` file → 400 with `invalid_type` error
- `test_photo_upload_rejects_oversized_file`
  Upload a fake file with size > 5MB → 400
- `test_staff_cannot_upload_photo_for_other_staff`
  Staff role, upload to a different staff member's ID → 403
- `test_admin_can_upload_photo_for_any_staff`
  Admin role, upload for any staff member → succeeds
- `test_successful_upload_updates_photo_url_in_db`
  Valid upload → `wp_bookings_staff.photo_url` updated

Note: for PHPUnit tests, mock `wp_handle_upload()` using a filter or
test double rather than actually uploading files. Check existing tests
for the pattern used for file upload mocking in this codebase.

### Git commit message
```
Sprint 6E, Task 2: Replace StaffFormModal photo upload with file input + REST endpoint

- POST bookit/v1/dashboard/staff/{id}/photo: multipart upload to
  WordPress media library, validates type and size, updates photo_url
- StaffFormModal.vue: hidden file input replaces wp.media() + prompt()
  fallback; disabled for new staff (no ID yet); upload error displayed
- Photo upload disabled for new staff pending first save
- PHPUnit: N tests, 0 failures

Closes: pre-Phase 2 photo upload task (required before React Native
mobile app work — mobile needs this endpoint for staff photo uploads)
```

---

## SPRINT 6E ACCEPTANCE CRITERIA

### Task 1 (Cancelled slot fix)
- [ ] Cancelled bookings no longer block their unique slot
- [ ] A new booking can be created for the same staff/date/time as a
      cancelled booking
- [ ] `cancelled_start_time` and `cancelled_end_time` contain the
      original times after cancellation
- [ ] `start_time` and `end_time` are NULL on cancelled bookings
- [ ] Dashboard cancel path applies the fix
- [ ] Magic link cancel path applies the fix
- [ ] PHPUnit: all 5 new tests passing, 0 failures
- [ ] Playwright: magic-link reschedule and cancellation email tests
      now green

### Task 2 (Photo upload)
- [ ] Clicking "Upload Photo" opens a native file picker
- [ ] Non-image files rejected with clear error message
- [ ] Files over 5MB rejected with clear error message
- [ ] Valid image uploads and URL appears in photo preview
- [ ] Photo button disabled / shows message for new (unsaved) staff
- [ ] Staff cannot upload photo for another staff member (403)
- [ ] Admin can upload photo for any staff member
- [ ] `wp.media()` and `prompt()` calls removed from StaffFormModal.vue
- [ ] PHPUnit: all 6 new tests passing, 0 failures
- [ ] No JavaScript console errors during upload flow

### Overall
- [ ] PHPUnit: 971+ tests, 0 failures throughout
- [ ] No PHP warnings or notices
- [ ] Playwright full suite: maximum 1 skip (Stripe — manual only)

---

## START HERE

1. Confirm you have read and understood this prompt
2. Start with **Task 6E-1** — read all listed files from the project knowledge
   before writing any Cursor prompt
3. Specifically: read `cancel_booking()` in `class-dashboard-bookings-api.php`
   and the magic link cancel in `class-wizard-api.php` in full before
   writing the fix — the exact UPDATE statement structure matters
4. Liron confirms 6E-1 complete (PHPUnit + Playwright) before 6E-2 starts
5. For 6E-2: read `StaffFormModal.vue` in full before writing any Vue code —
   understand the existing `isEditing` logic and how `props.staffMember`
   is used

If you find anything in the code that contradicts this prompt, flag it
before writing any implementation.