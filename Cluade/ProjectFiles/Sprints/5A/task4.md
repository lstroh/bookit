Good. Updated test count from project knowledge first:The project knowledge search didn't surface the latest test count from the addendum commit. That's fine — the last confirmed count from the 5A-2 task was 847, and the addendum added 3 tests, so the baseline is **850**. Let me confirm by checking what was actually committed:The project knowledge hasn't updated yet with the latest commit. That's fine — I'll use 850 as the working baseline (847 + 3 from addendum). Now let me read the key files for 5A-4 before writing the prompt:Good. I have everything needed. This is a small task — just a Vue settings field plus adding the key to the PHP allowlist. Here is the prompt:

---

```
TASK 5A-4 OF 6: bookit_confirmed_v2_url Admin UI
Sprint: 5A | Est: 2h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/src/views/Settings.vue` — read in full. Find the "Booking"
   or "General" section. Identify the exact pattern used for other URL
   or text settings fields — look at how `v-model` is bound, how the
   field label and helper text are structured, and whether there is a
   consistent field wrapper component or just raw HTML. This is the
   pattern to follow exactly.
2. `includes/api/class-dashboard-bookings-api.php` — find
   `get_allowed_settings_keys()` (or equivalent — read the file to find
   the actual method name that defines which keys the settings API
   accepts). Confirm `bookit_confirmed_v2_url` is not already in the
   list.
3. `includes/payment/class-stripe-checkout.php` — find where
   `bookit_confirmed_v2_url` is read via `get_option()`. Confirm the
   option name exactly so the new field saves to the same key.
4. `includes/payment/class-payment-processor.php` — same check: find
   where `bookit_confirmed_v2_url` is read. Confirm the key is
   consistent across both files.
5. `tests/unit/test-notification-settings-api.php` OR
   `tests/unit/test-dashboard-bookings-api.php` — read whichever covers
   settings API tests, to follow the existing test pattern for settings
   save/retrieve.

---

## CONTEXT

`bookit_confirmed_v2_url` is stored as a WordPress option (not in
`wp_bookings_settings`) with a hardcoded default of
`home_url('/booking-confirmed-v2/')`. It is read by both the Stripe
checkout and payment processor to redirect customers after payment.
There is currently no UI to change it — this task adds a single settings
field in the dashboard so admin can point it at a custom page if needed.
No migration needed (it's a `wp_option`, not a settings table row).

---

## IMPLEMENTATION REQUIREMENTS

### `dashboard/src/views/Settings.vue` — MODIFY

Read the file first. Find the Booking or General settings section.
Add one new field following the exact existing pattern:

- **Label:** "V2 Booking Confirmed Page URL"
- **Helper text:** "The page customers are redirected to after completing
  a V2 wizard booking. Must be a full URL."
- **Input type:** `<input type="url">` (or match whatever input type
  other URL fields use in this file)
- **v-model:** bound to the same settings object key used by other
  fields (e.g. `settings.bookit_confirmed_v2_url`)
- **Placeholder:** `home_url('/booking-confirmed-v2/')` equivalent —
  since this is a Vue file, use a static placeholder string like
  `https://yoursite.com/booking-confirmed-v2/`
- **Position:** Place it near other booking flow URL settings if any
  exist, or at the end of the Booking section. Read the file to find
  the right location.

The field saves via the existing settings save action — no new API
call needed, just add the key to the reactive settings object and it
will be included in the next save.

**Important:** After any Vue change, include the frontend build
instruction at the end of the task. The `dist/` directory is gitignored
— the build must be run manually in Local by Flywheel.

### `includes/api/class-dashboard-bookings-api.php` — MODIFY

Read the file to find the exact method that defines allowed settings
keys. Add `'bookit_confirmed_v2_url'` to that list. This is the only
PHP change needed — the option is stored via `update_option()` not
`wp_bookings_settings`, so no migration or settings table change is
required.

**Before adding**: confirm by reading `class-stripe-checkout.php` and
`class-payment-processor.php` that the key read there is exactly
`'bookit_confirmed_v2_url'` — not a settings table key variant. If the
option is read differently in those files, match whatever pattern they
use.

---

## INFRASTRUCTURE REQUIREMENTS

- [x] No migration needed — `wp_option`, not a settings table row
- [x] No new REST endpoint needed — saved via existing settings API
- [x] Frontend build required after Vue change

---

## PHPUNIT REQUIREMENTS

Baseline: **850 tests, 0 failures** — must not regress.

Add 2 test cases to the existing settings API test file (whichever file
covers settings save/retrieve — read both candidate files to find the
right one):

- `test_confirmed_v2_url_setting_is_saved_and_retrieved`
  POST to the settings endpoint with `bookit_confirmed_v2_url` set to
  a valid URL. Then GET settings. Assert the value is returned correctly.

- `test_confirmed_v2_url_setting_accepts_valid_url`
  POST with a custom URL value. Assert 200 response and no error.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Dashboard Settings page shows "V2 Booking Confirmed Page URL" field
- [ ] Field is pre-populated with the current value of the `bookit_confirmed_v2_url`
      option (default: `home_url('/booking-confirmed-v2/')`)
- [ ] Saving a new URL updates the option correctly
- [ ] Stripe checkout and payment processor still read the correct option
      after the change (no breakage)

### Technical
- [ ] `bookit_confirmed_v2_url` added to the allowed settings keys list
- [ ] Vue field follows the exact same pattern as existing URL/text fields
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Frontend built after Vue change
- [ ] PHPUnit suite passes (850+ tests, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` — Stripe redirect still goes to the correct
      confirmation URL
- [ ] `[bookit_booking_confirmed_v2]` — still renders correctly
- [ ] All other settings fields — save and load unchanged

---

## FRONTEND BUILD INSTRUCTION

After implementation, run:
```
npm run build
(in bookit-booking-system/dashboard/)
```
The `dist/` directory is gitignored — the build must be run manually
in Local by Flywheel after Cursor completes its changes.

---

## GIT COMMIT MESSAGE

```
Sprint 5A, Task 4: bookit_confirmed_v2_url admin UI

- Add "V2 Booking Confirmed Page URL" field to dashboard Settings
- Add bookit_confirmed_v2_url to allowed settings keys in dashboard API
- 2 new PHPUnit tests for settings save/retrieve

Tests: 850+ passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve, STOP
and report back before writing any code.