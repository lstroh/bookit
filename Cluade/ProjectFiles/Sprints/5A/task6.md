Clean verification. `BOOKIT_DASHBOARD.staff.role` is the correct property, it matches the router guard in `main.js` and the `Packages.vue` pattern — no inconsistency. ✅

**Task 5A-5 is complete and clear to commit.**

---

Now for **5A-6 — Brevo template ID settings**. Before writing the prompt I need to read the actual Brevo v4 provider to understand the current send logic, since the sprint doc has a specific warning about the SDK classmap.This is exactly what I needed. Key facts confirmed:

1. **Real v4 class names** (verified against classmap during live deployment): `\Brevo\Brevo`, `\Brevo\TransactionalEmails\Requests\SendTransacEmailRequest`, `\Brevo\TransactionalEmails\Requests\SendTransacEmailRequestSender`, `\Brevo\TransactionalEmails\Requests\SendTransacEmailRequestToItem`
2. **The classmap is the sole source of truth** — Context7 is explicitly stale for v4
3. The provider currently sends `htmlContent` — template ID branching goes on top of this
4. Settings use `private static get_setting()` with direct `$wpdb->get_var()` — no global helper

Here is the prompt:

---

```
TASK 5A-6 OF 6: Brevo Template ID Settings
Sprint: 5A | Est: 4h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `includes/notifications/providers/class-bookit-brevo-email-provider.php`
   — read in full. Find the `send()` method. Understand exactly how the
   `SendTransacEmailRequest` is constructed — specifically where
   `htmlContent` is set. This is where the `templateId` branch must be
   inserted. Also read the private `get_setting()` helper pattern so the
   new template ID lookups follow the same approach.
2. `vendor/composer/autoload_classmap.php` — search for all Brevo class
   entries. This is the **only reliable source** of Brevo v4 class names.
   Context7 and all online docs are stale for v4. Confirm the exact class
   name for setting `templateId` on the request object before writing
   any code.
3. `includes/api/class-dashboard-bookings-api.php` — find
   `get_allowed_settings_keys()` (or the equivalent allowlist method).
   The six new template ID keys must be added here.
4. `dashboard/src/views/EmailSettings.vue` (or the component that owns
   the email settings UI — read the `dashboard/src/views/` directory
   listing to confirm the filename). Read in full to find:
   - The existing Brevo section structure
   - Where to add the new "Brevo Email Templates" sub-section
   - The `v-if` condition that shows/hides Brevo-specific fields
     (likely `email_provider === 'brevo'`)
   - The exact field pattern (label + input + helper text) to follow
5. `tests/unit/test-notification-settings-api.php` — read for the
   settings save/retrieve test pattern to follow for new tests.

---

## CONTEXT

This task adds six settings fields — one numeric Brevo template ID per
notification type — and wires the Brevo provider to use them when set.
The templates themselves are created in the Brevo dashboard by the
business owner; the plugin only stores the numeric IDs. When a template
ID is set, the provider sends using `templateId` instead of `htmlContent`.
When not set, the existing plain HTML send behaviour is unchanged. This
is a pure additive change — no existing send behaviour is altered for
installations that don't configure template IDs.

**Critical SDK warning:** `getbrevo/brevo-php ^4.0` is a full rewrite.
The old `Brevo\Client\*` namespace does not exist. All class names must
be verified against `vendor/composer/autoload_classmap.php` before use.
Do not use any class name from memory, training data, or Context7.

---

## IMPLEMENTATION REQUIREMENTS

### Template ID setting keys

| Key | Notification |
|-----|-------------|
| `brevo_template_booking_confirmed` | Customer booking confirmation |
| `brevo_template_booking_cancelled` | Customer cancellation confirmation |
| `brevo_template_booking_rescheduled` | Customer reschedule confirmation |
| `brevo_template_magic_link_cancel` | Magic link cancellation email |
| `brevo_template_magic_link_reschedule` | Magic link reschedule email |
| `brevo_template_business_notification` | Business/staff new booking alert |

Values are stored as strings (integer-as-string, consistent with all
other settings in `wp_bookings_settings`). An empty string means
"no template configured — use HTML fallback".

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Read the allowlist method first. Add all six keys. They are stored in
`wp_bookings_settings` like all other email settings — no special
handling needed (unlike `bookit_confirmed_v2_url` which used `wp_options`).

### `includes/notifications/providers/class-bookit-brevo-email-provider.php` — MODIFY

Read the file in full first — specifically `send()` and `get_setting()`.

Add a private method `get_template_id_for_email_type( string $email_type ): int`:

```php
private function get_template_id_for_email_type( string $email_type ): int {
    $map = array(
        'booking_confirmed'           => 'brevo_template_booking_confirmed',
        'booking_cancelled'           => 'brevo_template_booking_cancelled',
        'booking_rescheduled'         => 'brevo_template_booking_rescheduled',
        'magic_link_cancel'           => 'brevo_template_magic_link_cancel',
        'magic_link_reschedule'       => 'brevo_template_magic_link_reschedule',
        'business_notification'       => 'brevo_template_business_notification',
    );

    $setting_key = $map[ $email_type ] ?? '';
    if ( empty( $setting_key ) ) {
        return 0;
    }

    $value = $this->get_setting( $setting_key );
    $id    = (int) $value;
    return $id > 0 ? $id : 0;
}
```

In the `send()` method, after constructing the `SendTransacEmailRequest`
object but **before** setting `htmlContent`, check for a template ID:

```php
$email_type  = $queue_item['email_type'] ?? '';
$template_id = $this->get_template_id_for_email_type( $email_type );

if ( $template_id > 0 ) {
    // Use Brevo template — do NOT set htmlContent or subject.
    // Read the classmap to confirm the exact setter method name.
    $request->setTemplateId( $template_id );
} else {
    // Fallback: plain HTML send (existing behaviour, unchanged).
    $request->setHtmlContent( $queue_item['html_body'] ?? '' );
    $request->setSubject( $queue_item['subject'] ?? '' );
}
```

**Important**: Read `send()` carefully to understand exactly what
parameters the request currently receives and from where. The
`$queue_item` array is passed into `send()` — confirm the exact
parameter name before referencing it. If `email_type` is not currently
on the queue item passed to `send()`, read how the dispatcher calls
`send()` to find where to get it from.

**Classmap requirement**: Before calling any method on the request
object, verify the setter method name against `autoload_classmap.php`.
The method may be `setTemplateId()` or named differently in v4.
Do not guess.

### `dashboard/src/views/EmailSettings.vue` — MODIFY

Read the file first. Find the Brevo section (shown when
`email_provider === 'brevo'`). Add a new "Brevo Email Templates"
sub-section inside that conditional block, **after** the existing
Brevo API credentials fields.

Sub-section header:
```
Brevo Email Templates
```
Helper text below the header:
```
Enter the numeric template ID from your Brevo dashboard for each
notification type. Leave blank to use the default HTML email.
```

Six fields, one per template key, each following the exact existing
field pattern:
- Label (human-readable name from the table above)
- `<input type="number" min="1">` bound via `v-model` to the
  corresponding settings key
- Small helper text: e.g. "Brevo template ID for booking confirmations"

The fields load and save via the existing Brevo settings save action
— no new API call needed. Just add the keys to the reactive settings
object alongside the existing Brevo keys.

**Frontend build required** after this change.

---

## PHPUNIT REQUIREMENTS

Baseline: **858 tests, 0 failures** — must not regress.

Add to the existing Brevo provider test file (search for
`class-bookit-brevo-email-provider` in the tests directory — read the
file to find its location and class structure):

- `test_brevo_provider_uses_template_id_when_set`
  Insert a `brevo_template_booking_confirmed` setting with value `42`.
  Call `send()` with a mock queue item with `email_type =
  'booking_confirmed'`. Assert that the request object receives
  `setTemplateId(42)` and does NOT receive `setHtmlContent()`.
  Since the SDK classes cannot be instantiated in unit tests without
  a live HTTP client, use a mock or spy approach — read the existing
  Brevo provider tests to see how they mock the SDK interaction.

- `test_brevo_provider_falls_back_to_html_when_no_template_id`
  Ensure no template ID setting exists for `booking_confirmed`. Call
  `send()` with `email_type = 'booking_confirmed'`. Assert `htmlContent`
  path is used (not `templateId`).

Add to `tests/unit/test-notification-settings-api.php`:

- `test_template_id_settings_are_saved_and_retrieved`
  POST settings with `brevo_template_booking_confirmed = '42'`.
  GET settings. Assert value `'42'` is returned for that key.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Dashboard Settings → Email shows "Brevo Email Templates" section
      when `email_provider === 'brevo'`
- [ ] Section is hidden when `email_provider === 'wp_mail'`
- [ ] Each of the six template ID fields saves and retrieves correctly
- [ ] Brevo provider uses `templateId` when setting is a positive integer
- [ ] Brevo provider uses `htmlContent` fallback when setting is empty or zero
- [ ] Existing send behaviour is completely unchanged when no template
      IDs are configured

### Technical
- [ ] All six keys added to the settings allowlist
- [ ] All class/method names verified against `autoload_classmap.php`
      before use — no guessed names
- [ ] Template ID branch does NOT set `htmlContent` or `subject` (Brevo
      uses template's own subject when sending by template ID)
- [ ] HTML fallback branch unchanged from current behaviour
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Frontend built after Vue changes
- [ ] PHPUnit suite passes (858+ tests, 0 failures)

### Must NOT break
- [ ] Existing Brevo send flow (API key, from name, from email) — unchanged
- [ ] `wp_mail` fallback provider — completely unchanged
- [ ] Email queue processing — existing items without template IDs
      continue to send via HTML path

---

## FRONTEND BUILD INSTRUCTION

After implementation, run:
```
npm run build
(in bookit-booking-system/dashboard/)
```
The `dist/` directory is gitignored — must be built manually in Local
by Flywheel.

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 6: Brevo template ID settings

- Add six brevo_template_* keys to settings allowlist
- Brevo provider: use templateId when set, fall back to htmlContent
- EmailSettings.vue: "Brevo Email Templates" sub-section (Brevo only)
- All SDK class names verified against autoload_classmap.php
- 3 new PHPUnit tests

Tests: 858+ passing, 0 failures
```

---

If you encounter a conflict with existing code not covered above,
or if any Brevo v4 class name cannot be confirmed in the classmap,
STOP and report back before writing any code.