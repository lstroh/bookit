Let me read the relevant existing files from project knowledge before generating Task 2.I now have a clear picture of the existing `class-services-api.php` and `ServiceFormModal.vue` patterns. Let me also quickly check the `PackageTypeFormModal.vue` null-omission pattern from the payload, then generate Task 2.I have everything I need. Now generating Task 2.

---

# Sprint 4F — Task 2 of 4: Services API + ServiceFormModal.vue

```
TASK 2 OF 4: Services API — meeting fields read/write + ServiceFormModal.vue — Online Meeting section
Sprint: 4F | Est: ~3h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/api/class-services-api.php`
   — read the FULL file: the service response formatting method,
   create_service(), update_service(), and how route args are
   declared. Note the exact column list in the INSERT and UPDATE
   arrays — you will be adding to these.

2. `dashboard/src/components/ServiceFormModal.vue`
   — read the FULL file: the formData ref shape, the watch()
   pre-fill block, the saveService payload object, and the
   existing field structure in the template. Note where Display
   Order sits — the new section goes before it.

3. `dashboard/src/components/PackageTypeFormModal.vue`
   — read the getPayload() function and the watch()/populateForm()
   pattern. This is the null-omission and conditional-field-
   inclusion pattern to follow for the new meeting fields.

4. `dashboard/src/components/BookitTooltip.vue`
   — confirm the component's prop interface before using it.

5. `includes/class-bookit-error-registry.php`
   + `includes/config/error-codes.php`
   — confirm the error registration format (user_message /
   log_message / http_status / category keys).

If any file does not exist or differs from the description above,
STOP and report back before writing any code.

Note: Before implementing WordPress REST API `register_rest_route`
arg schema patterns, use Context7 to resolve 'WordPress' and
confirm the current `validate_callback` / `sanitize_callback`
enum-validation approach.

Note: Before implementing Vue 3 v-model radio groups and
conditional field visibility, use Context7 to resolve 'Vue 3'
and confirm the current `v-model` pattern for radio inputs and
`v-if`/`v-show` conditional rendering.

---

## CONTEXT

This task wires the three new service meeting columns
(migration 0010) into the Services API so they are readable and
writable, and adds an "Online Meeting" section to
`ServiceFormModal.vue` so admins can configure meeting settings
per service. No meeting link generation logic lives here — this
is purely storage and UI for the service-level settings.

---

## IMPLEMENTATION REQUIREMENTS

### `includes/api/class-services-api.php` — MODIFY

Read the full file first. Then make three targeted changes:

**1. Service response formatting**

In the method that formats a service row for API responses
(used by both GET list and GET single), add the three new
fields. Follow the exact same casting/null-handling pattern
already used for existing fields:

```php
'meeting_type'         => (string) ( $service['meeting_type'] ?? 'none' ),
'preferred_platform'   => isset( $service['preferred_platform'] )
                             ? (string) $service['preferred_platform']
                             : null,
'default_meeting_link' => isset( $service['default_meeting_link'] )
                             ? (string) $service['default_meeting_link']
                             : null,
```

**2. Route args — create and update endpoints**

In the args array for both create and update routes, add three
new optional parameters. Follow the exact arg-definition pattern
already used (type, required, sanitize_callback,
validate_callback). Confirm the pattern with Context7 before
writing:

```php
'meeting_type' => array(
    'required'          => false,
    'type'              => 'string',
    'default'           => 'none',
    'sanitize_callback' => 'sanitize_text_field',
    'validate_callback' => function( $value ) {
        return in_array( (string) $value,
            array( 'none', 'online', 'in_person' ), true );
    },
),
'preferred_platform' => array(
    'required'          => false,
    'type'              => 'string',
    'sanitize_callback' => 'sanitize_text_field',
    'validate_callback' => function( $value ) {
        if ( null === $value || '' === $value ) {
            return true;
        }
        return in_array( (string) $value,
            array( 'zoom', 'google_meet', 'whatsapp',
                   'teams', 'generic' ), true );
    },
),
'default_meeting_link' => array(
    'required'          => false,
    'type'              => 'string',
    'sanitize_callback' => 'esc_url_raw',
    'validate_callback' => function( $value ) {
        if ( null === $value || '' === $value ) {
            return true;
        }
        return strlen( (string) $value ) <= 2048;
    },
),
```

**3. Write logic — create_service() and update_service()**

In both methods, add the three new fields to the `$wpdb->insert`
/ `$wpdb->update` data array and their format strings:

```php
'meeting_type'         => sanitize_text_field(
    (string) ( $request->get_param( 'meeting_type' ) ?? 'none' )
),
'preferred_platform'   => $request->get_param( 'preferred_platform' )
    ? sanitize_text_field( (string) $request->get_param( 'preferred_platform' ) )
    : null,
'default_meeting_link' => $request->get_param( 'default_meeting_link' )
    ? esc_url_raw( (string) $request->get_param( 'default_meeting_link' ) )
    : null,
```

**Null-clear rule:** In the write logic, after reading the params,
add this guard before the insert/update:

```php
if ( 'none' === $meeting_type ) {
    $preferred_platform   = null;
    $default_meeting_link = null;
}
```

Add `'%s'`, `'%s'`, `'%s'` to the format arrays for all three
fields (null is handled by wpdb correctly with `'%s'`).

---

### `dashboard/src/components/ServiceFormModal.vue` — MODIFY

Read the full file first. Make four targeted changes:

**1. formData ref — add three new fields**

In the `formData` ref initialisation, add after `display_order`:

```js
meeting_type: 'none',
preferred_platform: null,
default_meeting_link: '',
```

**2. watch(service) pre-fill block**

In the watch block that populates formData when editing, add the
three new fields following the existing null-safe pattern:

```js
meeting_type: service.meeting_type || 'none',
preferred_platform: service.preferred_platform || null,
default_meeting_link: service.default_meeting_link || '',
```

**3. saveService payload (getPayload / inline payload object)**

Follow the `PackageTypeFormModal.vue` null-omission pattern.
When `meeting_type === 'none'`, send only `{ meeting_type: 'none' }`
and omit `preferred_platform` and `default_meeting_link`.
When `meeting_type === 'online'`, include all three:

```js
// In the payload construction:
payload.meeting_type = formData.value.meeting_type

if (formData.value.meeting_type === 'online') {
  payload.preferred_platform = formData.value.preferred_platform || null
  payload.default_meeting_link = formData.value.default_meeting_link || null
}
// When meeting_type is 'none', preferred_platform and
// default_meeting_link are deliberately omitted from the payload.
```

**4. Template — add "Online Meeting" section**

Add this section after the Display Order / Is Active row and
before the form's closing tag (or the footer — check the actual
file structure). Use `v-if` for conditional blocks:

```html
<!-- Online Meeting -->
<div class="border-t border-gray-100 pt-4">
  <h3 class="text-sm font-semibold text-gray-700 mb-3">
    Online Meeting
  </h3>

  <!-- Toggle: is this an online service -->
  <div class="flex items-center gap-2 mb-3">
    <input
      id="meeting-type-toggle"
      type="checkbox"
      :checked="formData.meeting_type === 'online'"
      @change="
        formData.meeting_type = $event.target.checked ? 'online' : 'none';
        if (!$event.target.checked) {
          formData.preferred_platform = null;
          formData.default_meeting_link = '';
        }
      "
      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
    />
    <label for="meeting-type-toggle" class="text-sm font-medium text-gray-700">
      This is an online service
    </label>
  </div>

  <!-- Platform + default link: only shown when online -->
  <div v-if="formData.meeting_type === 'online'" class="space-y-4 pl-6">

    <!-- Platform selector -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Platform
      </label>
      <div class="space-y-2">
        <label
          v-for="platform in [
            { value: 'zoom',         label: 'Zoom' },
            { value: 'google_meet',  label: 'Google Meet' },
            { value: 'whatsapp',     label: 'WhatsApp' },
            { value: 'teams',        label: 'Microsoft Teams' },
            { value: 'generic',      label: 'Generic URL' }
          ]"
          :key="platform.value"
          class="flex items-center gap-2 text-sm text-gray-700"
        >
          <input
            type="radio"
            :id="`platform-${platform.value}`"
            :value="platform.value"
            v-model="formData.preferred_platform"
            class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span>{{ platform.label }}</span>
        </label>
      </div>
    </div>

    <!-- Default meeting link -->
    <div>
      <div class="flex items-center gap-1 mb-1">
        <label class="block text-sm font-medium text-gray-700">
          Default Meeting Link
          <span class="text-gray-400 font-normal">(optional)</span>
        </label>
        <BookitTooltip
          content="Used as a fallback when no link is auto-generated by an integration. Leave empty if you are using Zoom or Google Meet auto-generation."
        />
      </div>
      <input
        v-model="formData.default_meeting_link"
        type="url"
        maxlength="2048"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        placeholder="https://..."
      />
      <p class="text-xs text-gray-500 mt-1">
        Used as a fallback if no link is auto-generated. Leave empty to
        generate a new link for each booking.
      </p>
    </div>

  </div>
</div>
```

Confirm the exact `BookitTooltip` prop name by reading
`BookitTooltip.vue` before writing — do not guess.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new migrations needed (columns exist from Task 1)
- [ ] No new error codes for this task
- [ ] No new API controller needed — modifying existing
      `class-services-api.php`

---

## PHPUNIT REQUIREMENTS

Baseline: **713 tests, 0 failures** — must not regress.

Write tests in: `tests/unit/test-meetings-service-api.php`

Before writing the test file, read an existing unit test for the
services API (e.g. the one covering service create/update) to
confirm the test pattern, setUp/tearDown, and how the REST
request is constructed.

Required test cases:

- `test_get_services_list_includes_meeting_fields`
  GET /dashboard/services — assert response includes
  `meeting_type`, `preferred_platform`, `default_meeting_link`
  on each service object

- `test_get_single_service_includes_meeting_fields`
  GET /dashboard/services/{id} — same assertion on single service

- `test_create_service_with_meeting_type_none_defaults`
  POST /services/create without meeting_type param — assert
  stored `meeting_type` is 'none'

- `test_patch_service_meeting_type_online_saves_all_fields`
  PATCH /services/{id} with meeting_type=online,
  preferred_platform=zoom, default_meeting_link=https://zoom.us/j/123
  — assert all three values saved correctly

- `test_patch_service_meeting_type_none_clears_platform_and_link`
  PATCH /services/{id} with meeting_type=none — assert
  `preferred_platform` is NULL and `default_meeting_link` is NULL
  in the database after save

- `test_patch_service_invalid_meeting_type_returns_400`
  PATCH /services/{id} with meeting_type='teleport' — assert 400
  response

- `test_patch_service_invalid_platform_returns_400`
  PATCH /services/{id} with meeting_type=online,
  preferred_platform='skype' — assert 400 response

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## FRONTEND BUILD

After all Vue changes:
```
cd bookit-booking-system/dashboard && npm run build
```
The `dist/` directory is gitignored — the build must be run
manually in Local by Flywheel after Cursor completes its changes.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] GET /dashboard/services response includes `meeting_type`,
      `preferred_platform`, `default_meeting_link` on each service
- [ ] Creating a service without meeting params stores `meeting_type = 'none'`
- [ ] Updating a service with `meeting_type = 'online'` + platform + link saves all three correctly
- [ ] Updating a service with `meeting_type = 'none'` sets `preferred_platform` and `default_meeting_link` to NULL in DB
- [ ] Invalid `meeting_type` value returns HTTP 400
- [ ] Invalid `preferred_platform` value returns HTTP 400
- [ ] ServiceFormModal shows "Online Meeting" section below existing fields
- [ ] Toggle checkbox OFF → platform selector and link field hidden
- [ ] Toggle checkbox ON → platform selector and link field visible
- [ ] Saving with toggle OFF clears platform and link from payload
- [ ] Saving with toggle ON sends meeting_type, preferred_platform, default_meeting_link
- [ ] Edit mode pre-fills meeting fields from existing service data
- [ ] BookitTooltip renders on Default Meeting Link label

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (713+ tests, 0 failures)
- [ ] Frontend built (`npm run build`) after all Vue changes

### Must NOT break
- [ ] Existing service create/edit/deactivate/reorder
- [ ] Existing booking wizard (service selection step)
- [ ] Existing test suite (713 tests, 0 failures baseline)

---

## GIT COMMIT MESSAGE

```
Sprint 4F, Task 2: Services API + ServiceFormModal — meeting fields

- class-services-api.php: meeting_type, preferred_platform, default_meeting_link in response, args, create, update
- Null-clear rule: meeting_type=none forces preferred_platform and default_meeting_link to NULL
- ServiceFormModal.vue: Online Meeting section with toggle, platform radio group, default link input, BookitTooltip
- PHPUnit: 7 new tests for services meeting fields API

Tests: [N] passing, 0 failures
```
*(Adjust test count to actual after run)*

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.