# SPRINT 4F IMPLEMENTATION PROMPT
## Bookit Booking System — Online Meetings Core Additions (~8h)

**Sprint:** 4F
**Estimated hours:** ~8h
**PHPUnit baseline:** 706 tests, 0 failures — must not regress
**Branch:** Phase1
**Repo:** lstroh/bookit-imp
**Plugin root:** bookit-booking-system/
**Environment:** Local by Flywheel (manual testing) + wp-env/Docker (PHPUnit)

---

## CONNECTORS & SKILLS — REQUIRED BEFORE STARTING

- **GitHub connector** — read every file listed below before writing
  any code. Never assume file contents.
- **Context7 connector** — verify Vue 3 and WordPress REST API patterns
  before implementing any library-specific code.
- **cursor-prompt-generator skill** — use for every Cursor prompt.

---

## SPRINT GOAL

This sprint adds the minimum core plugin infrastructure required by the
future `Bookit Meetings` extension plugin. No meeting platform logic,
no OAuth, no auto-generation — that all lives in the extension.

The core plugin needs to:
1. Store whether a service is online and which platform it uses
2. Store a meeting link per booking
3. Display the meeting link on the confirmation page and in the
   confirmation email when one is present
4. Fire hooks that the extension uses to generate and inject links
5. Allow admin to manually set/override a meeting link per booking

The extension plugin (built separately, Sprint 5) will hook into
`bookit_after_booking_created` to auto-generate the link and store it
via the new booking meeting link endpoint added in this sprint.

---

## READ FIRST — ALL FILES

Read every one of these via GitHub before writing any code:

1. `database/migrations/0009-add-performance-indexes.php`
   — confirm the migration pattern and current highest number (0009)
2. `database/migrations/class-bookit-migration-base.php`
   — base class all migrations extend
3. `includes/api/class-services-api.php`
   — read the full file: how service fields are read, written,
   and returned in responses; what columns currently exist
4. `dashboard/src/components/ServiceFormModal.vue`
   — read the full file: existing fields, form structure, formData
   shape, how the save payload is built, BookitTooltip usage
5. `includes/api/class-dashboard-bookings-api.php`
   — read format_booking() method: what fields are returned;
   read update_booking() method: what fields are accepted;
   read get_booking_details() method
6. `dashboard/src/components/BookingViewModal.vue`
   — read the full file: how booking details are displayed,
   where to add the meeting link field
7. `public/templates/booking-confirmed.php`
   — read the full file: how the confirmation page is structured,
   where meeting link section should be inserted
8. `includes/email/class-email-sender.php`
   — read generate_customer_email(): how email HTML is built,
   where meeting link section should be inserted
9. `includes/class-bookit-error-registry.php`
   + `includes/config/error-codes.php`
   — to register new error code
10. `includes/class-bookit-loader.php`
    — to wire any new API class

If any file does not exist or differs significantly from what is
described above, stop and report back before proceeding.

---

## TASK 1 OF 4: Database Migrations (~2h)

### Migration 0010 — Add meeting fields to wp_bookings_services

File: `database/migrations/0010-add-meeting-fields-to-services.php`

Add two columns to `wp_bookings_services`:

```sql
ALTER TABLE wp_bookings_services
  ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'none'
      COMMENT 'none | online | in_person',
  ADD COLUMN preferred_platform VARCHAR(20) NULL
      COMMENT 'zoom | google_meet | whatsapp | teams | generic',
  ADD COLUMN default_meeting_link VARCHAR(2048) NULL
      COMMENT 'Optional default meeting link for this service';
```

`down()` must drop all three columns:
```sql
ALTER TABLE wp_bookings_services
  DROP COLUMN meeting_type,
  DROP COLUMN preferred_platform,
  DROP COLUMN default_meeting_link;
```

Use `SHOW COLUMNS` guard (same pattern as 0009) so `up()` is
idempotent — check column exists before adding.

### Migration 0011 — Add meeting_link to wp_bookings

File: `database/migrations/0011-add-meeting-link-to-bookings.php`

Add one column to `wp_bookings`:

```sql
ALTER TABLE wp_bookings
  ADD COLUMN meeting_link VARCHAR(2048) NULL
      COMMENT 'Meeting URL for online bookings';
```

`down()` must drop the column.

Use `SHOW COLUMNS` guard for idempotency.

### schema.sql update

After both migrations are implemented, add migration notes to
`database/schema.sql` following the existing migration notes pattern
at the bottom of the file. Also add the three new columns to the
`wp_bookings_services` table definition and the `meeting_link` column
to the `wp_bookings` table definition in schema.sql.

### PHPUnit

Tests in: `tests/integration/test-meetings-migration.php`

Required tests:
- Migration 0010 up() adds all three columns to services table
- Migration 0010 down() removes all three columns
- Migration 0011 up() adds meeting_link to bookings table
- Migration 0011 down() removes meeting_link column
- Both migrations are idempotent (running up() twice does not error)

---

## TASK 2 OF 4: Services API + ServiceFormModal.vue (~3h)

### PHP — `includes/api/class-services-api.php` (MODIFY)

Read the full file via GitHub first.

**In the service response formatting method:**
Add the three new fields to every service response:
- `meeting_type` — string, default 'none'
- `preferred_platform` — string|null
- `default_meeting_link` — string|null

**In the create/update endpoint args:**
Add three new optional parameters:
- `meeting_type`: string, enum: ['none', 'online', 'in_person'],
  default 'none', sanitize with `sanitize_text_field`
- `preferred_platform`: string, nullable, enum:
  ['zoom', 'google_meet', 'whatsapp', 'teams', 'generic', null],
  sanitize with `sanitize_text_field`
- `default_meeting_link`: string, nullable, max 2048 chars,
  sanitize with `esc_url_raw`

**In the write/update logic:**
Save the three fields to the database when present in the request.
When `meeting_type = 'none'`, set `preferred_platform = NULL` and
`default_meeting_link = NULL` regardless of what was sent.

**Note:** Use Context7 to verify current WordPress REST API
register_rest_route arg schema patterns before implementing.

### Vue — `dashboard/src/components/ServiceFormModal.vue` (MODIFY)

Read the full file via GitHub first. Then add an "Online Meeting"
section after the existing fields and before Display Order.

**Section structure:**

```
Online Meeting
──────────────
[Toggle] This is an online service

  [shown when toggle is ON]
  Platform:
  ○ Zoom
  ○ Google Meet
  ○ WhatsApp
  ○ Microsoft Teams
  ○ Generic URL

  Default Meeting Link (optional)
  [text input, placeholder: "https://..."]
  Helper: "Used as a fallback if no link is auto-generated.
           Leave empty to generate a new link for each booking."
```

**formData additions:**
```js
meeting_type: 'none',        // 'none' | 'online' | 'in_person'
preferred_platform: null,    // 'zoom' | 'google_meet' | 'whatsapp' |
                             // 'teams' | 'generic' | null
default_meeting_link: '',
```

**Toggle behaviour:**
- When toggle switches OFF (→ 'none'): clear preferred_platform and
  default_meeting_link, hide platform + link fields
- Platform selector only shown when meeting_type = 'online'
- Default meeting link field only shown when meeting_type = 'online'

**Pre-fill in edit mode:**
Add the three new fields to the watch(service) pre-fill block.

**Payload:**
When meeting_type = 'none': send `{ meeting_type: 'none' }` only,
omit preferred_platform and default_meeting_link from payload
(same null-omission pattern used in PackageTypeFormModal.vue).
When meeting_type = 'online': include all three fields;
send preferred_platform as null if not selected.

**BookitTooltip** for "Default Meeting Link":
"Used as a fallback when no link is auto-generated by an integration.
 Leave empty if you are using Zoom or Google Meet auto-generation."

**Note:** Use Context7 to verify current Vue 3 v-model patterns for
radio groups and conditional field visibility before implementing.

**After implementation, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored)

### PHPUnit

Tests in: `tests/unit/test-meetings-service-api.php`

Required tests:
- GET services list includes meeting_type, preferred_platform,
  default_meeting_link in response
- PATCH service with meeting_type = 'online' saves correctly
- PATCH service with meeting_type = 'none' clears platform and link
- meeting_type defaults to 'none' on new service create
- Invalid meeting_type value returns 400

---

## TASK 3 OF 4: Confirmation Page + Email + Hooks (~2h)

### `public/templates/booking-confirmed.php` (MODIFY)

Read the full file via GitHub first.

After the existing booking details block and before the footer/
action buttons, add a conditional meeting link section:

```php
<?php
// Look up meeting_link for this booking.
$meeting_link = ! empty( $booking['meeting_link'] )
    ? esc_url( (string) $booking['meeting_link'] )
    : '';

// Allow extensions to modify or inject the meeting section HTML.
// Extensions use this filter to inject auto-generated links.
$meeting_section_html = apply_filters(
    'bookit_confirmation_meeting_section',
    '',          // Default empty — extensions populate this
    $booking
);

// If no extension provided HTML but a meeting_link exists on the
// booking, render a default section.
if ( '' === $meeting_section_html && '' !== $meeting_link ) {
    ob_start();
    ?>
    <div class="bookit-meeting-link">
        <h3><?php esc_html_e( 'Join Your Meeting', 'bookit-booking-system' ); ?></h3>
        <p>
            <a href="<?php echo $meeting_link; ?>"
               target="_blank"
               rel="noopener noreferrer"
               class="bookit-meeting-link__button">
                <?php esc_html_e( 'Join Meeting', 'bookit-booking-system' ); ?>
            </a>
        </p>
        <p class="bookit-meeting-link__url">
            <?php echo $meeting_link; ?>
        </p>
    </div>
    <?php
    $meeting_section_html = ob_get_clean();
}

if ( '' !== $meeting_section_html ) {
    echo wp_kses_post( $meeting_section_html );
}
?>
```

Also fire the extension hook after the booking is loaded and emails
are sent (but before page output):

```php
// Allow extensions to generate and store a meeting link
// for this booking. Extensions hook bookit_after_booking_confirmed
// to call back the admin API and store the link.
do_action( 'bookit_after_booking_confirmed', $booking['id'], $booking );
```

### `includes/email/class-email-sender.php` (MODIFY)

Read generate_customer_email() via GitHub first.

In the booking details section of the customer confirmation email,
add a meeting link block after the existing detail rows:

```php
<?php if ( ! empty( $booking['meeting_link'] ) ) : ?>
    <div class="detail-row">
        <span class="label">
            <?php esc_html_e( 'Meeting Link:', 'booking-system' ); ?>
        </span>
        <span class="value">
            <a href="<?php echo esc_url( $booking['meeting_link'] ); ?>"
               style="color: #0073aa;">
                <?php esc_html_e( 'Join Meeting', 'booking-system' ); ?>
            </a>
        </span>
    </div>
<?php endif; ?>
```

Also apply the filter so extensions can modify the email meeting
section. Add before the closing `</div>` of the booking-details block:

```php
$email_meeting_html = apply_filters(
    'bookit_email_meeting_section',
    '',
    $booking
);
if ( '' !== $email_meeting_html ) {
    echo wp_kses_post( $email_meeting_html );
}
```

**PHPUnit:** No automated tests for email HTML output. Manual testing
checklist only (see Acceptance Criteria).

---

## TASK 4 OF 4: Meeting Link on Booking — API + Dashboard (~1h)

### `includes/api/class-dashboard-bookings-api.php` (MODIFY)

Read format_booking() and update_booking() via GitHub first.

**In format_booking():**
Add `meeting_link` to the formatted booking response:
```php
'meeting_link' => isset( $booking['meeting_link'] )
    ? (string) $booking['meeting_link']
    : '',
```

**In update_booking() args:**
Add optional `meeting_link` parameter:
```php
'meeting_link' => array(
    'required'          => false,
    'sanitize_callback' => 'esc_url_raw',
),
```

**In the update_booking() $update_data array:**
Add:
```php
'meeting_link' => sanitize_url(
    (string) ( $request->get_param( 'meeting_link' ) ?? '' )
),
```

Also register new error codes in `includes/config/error-codes.php`:
```php
'E7001' => array(
    'message' => 'Meeting link is invalid.',
    'status'  => 400,
),
```

### `dashboard/src/components/BookingViewModal.vue` (MODIFY)

Read the full file via GitHub first.

**In the booking details display:**
Add a meeting link row in the booking details section:
```html
<div v-if="booking.meeting_link" class="detail-row">
  <span class="label">Meeting Link</span>
  <span class="value">
    <a :href="booking.meeting_link"
       target="_blank"
       rel="noopener noreferrer"
       class="text-primary-600 hover:text-primary-700">
      Join Meeting ↗
    </a>
  </span>
</div>
```

**In the edit form (if the modal has an edit mode):**
Add a "Meeting Link" text input field that saves to `meeting_link`
when the booking is updated via the PUT endpoint. If the modal does
not have a direct edit mode for this field, add it as an editable
inline field matching the existing edit pattern in the modal.

**After implementation, run: `npm run build`**
(in bookit-booking-system/dashboard/ — dist/ is gitignored)

**PHPUnit:**
Tests in: `tests/unit/test-meetings-booking-api.php`

Required tests:
- GET booking details includes meeting_link field
- PUT booking with meeting_link saves correctly
- PUT booking with empty meeting_link clears the value
- format_booking() returns empty string (not null) when no link set

---

## INFRASTRUCTURE WIRING SUMMARY

| Item | Task |
|------|------|
| Migration 0010 (service columns) | Task 1 |
| Migration 0011 (booking column) | Task 1 |
| E7001 error code registered | Task 4 |
| `bookit_confirmation_meeting_section` filter | Task 3 |
| `bookit_email_meeting_section` filter | Task 3 |
| `bookit_after_booking_confirmed` action | Task 3 |
| Services API reads/writes new columns | Task 2 |
| Booking API reads/writes meeting_link | Task 4 |

---

## ACCEPTANCE CRITERIA — SPRINT LEVEL

**Database:**
- [ ] wp_bookings_services has meeting_type, preferred_platform,
      default_meeting_link columns
- [ ] wp_bookings has meeting_link column
- [ ] Both migrations are idempotent
- [ ] Both migrations roll back cleanly

**Services:**
- [ ] Service API response includes meeting_type, preferred_platform,
      default_meeting_link
- [ ] ServiceFormModal shows Online Meeting toggle
- [ ] Platform selector appears only when toggle is ON
- [ ] Saving with toggle OFF clears platform and link
- [ ] Saving with toggle ON stores all three fields correctly

**Confirmation page:**
- [ ] If booking has meeting_link — "Join Meeting" section shown
- [ ] If booking has no meeting_link — section not shown
- [ ] `bookit_confirmation_meeting_section` filter fires
- [ ] `bookit_after_booking_confirmed` action fires

**Confirmation email:**
- [ ] If booking has meeting_link — "Meeting Link" row shown in email
- [ ] If booking has no meeting_link — row not shown
- [ ] `bookit_email_meeting_section` filter fires

**Dashboard:**
- [ ] Booking detail modal shows meeting link when present
- [ ] Meeting link is clickable (opens in new tab)
- [ ] Admin can set/edit meeting link via booking update
- [ ] Booking API response includes meeting_link field

**Technical:**
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (706+ tests, 0 failures)
- [ ] Frontend built (npm run build) after all Vue changes
- [ ] All new columns added via Bookit_Migration_Runner
- [ ] E7001 registered in error registry

**Must NOT break:**
- [ ] Existing service CRUD (create, edit, deactivate)
- [ ] Existing booking wizard all steps
- [ ] Existing booking confirmation page content
- [ ] Existing confirmation email content
- [ ] Booking edit/update in dashboard
- [ ] Package redemption flow

---

## GIT COMMIT CONVENTION

```
Sprint 4F, Task [N]: [description]

- [change 1]
- [change 2]

Tests: [N] passing, 0 failures
```

Commit after each task.

---

## SPRINT AGENT WORKFLOW

1. Read ALL files listed in READ FIRST via GitHub before any code
2. Use Context7 for Vue 3 and WP REST API patterns
3. Use cursor-prompt-generator skill for every Cursor prompt
4. One task at a time — wait for confirmation before proceeding
5. If you encounter a scope or architecture decision not covered,
   STOP and escalate — do not resolve independently

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.