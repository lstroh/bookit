On it. Let me read all five files before writing a single line of the Cursor prompt.I now have everything I need from project knowledge. Let me compile the full findings before writing the prompt.

---

## Pre-prompt findings

### File 1 — `public/class-shortcodes.php`

**V1-only shortcodes and methods:**
- `add_shortcode('bookit_booking_wizard', ...)` → `render_booking_wizard()`
- `add_shortcode('bookit_booking_confirmation', ...)` → `render_booking_confirmation()`
- `add_shortcode('bookit_confirmation', ...)` → `bookit_confirmation_page_shortcode()`
- Both `render_booking_confirmation()` and `bookit_confirmation_page_shortcode()` load `booking-confirmed.php`

**Critical finding — `enqueue_wizard_assets()` is shared, not V1-only.** It handles V1 and V2 assets in one method. V1 assets enqueued here: `bookit-wizard` CSS/JS, `bookit-datetime-picker` CSS/JS, `bookit-contact-form` CSS/JS, `bookit-payment-step` CSS, `bookit-confirmation` CSS. V2 and magic link assets are also enqueued here. The method cannot be deleted — it must be modified to remove V1 asset enqueues and the `$has_wizard` / `$has_confirmation` guards.

**`get_no_texturize_shortcodes()`** — need to check whether `bookit_booking_wizard`, `bookit_booking_confirmation`, or `bookit_confirmation` are in this list. If so, remove them from the array.

**`admin_post_bookit_process_payment` handler** — registered in `class-payment-processor.php` constructor, not in shortcodes. The payment processor also handles `pay_on_arrival` and `use_package` which are V2 paths. The `process_payment()` method's Stripe branch (`process_stripe_payment()`) is V1-only (renders an inline HTML redirect page). The `pay_on_arrival` and `use_package` branches serve V2. So `process_payment()` itself is V1-only as an entry point (triggered by the V1 form POST to `admin-post.php`), but its sub-methods are shared. **This needs careful handling** — see below.

### File 2 — `tests/unit/test-booking-shortcode.php`

**All tests are V1-only.** Every test calls `do_shortcode('[bookit_booking_wizard]')` or asserts V1-specific asset handles (`bookit-wizard`, `booking-wizard.css`, `booking-wizard.js`). One test (`test_v2_shortcode_does_not_break_existing_wizard`) is in `test-booking-wizard-v2.php`, not this file. The entire `test-booking-shortcode.php` file can be deleted.

**However** — one test in `test-booking-wizard-v2.php` calls `do_shortcode('[bookit_booking_wizard]')` to assert V2 doesn't break V1. That test (`test_v2_shortcode_does_not_break_existing_wizard`) must be removed from `test-booking-wizard-v2.php` since V1 will no longer exist.

### File 3 — `tests/unit/test-wizard-navigation.php`

Not surfaced clearly in project knowledge — need Cursor to read the actual file content. I'll instruct Cursor to read it before acting.

### File 4 — `class-payment-processor.php` — `admin_post_bookit_process_payment`

**This is V1-only as a handler.** The V1 booking-step-5-payment.php template submits a form to `admin-post.php?action=bookit_process_payment`. V2 uses REST API (`POST bookit/v1/wizard/complete`) instead. So the `process_payment()` method and both `add_action('admin_post_...')` registrations in the constructor are V1-only and can be removed. The sub-methods (`process_pay_on_arrival()`, `process_use_package()`, `process_stripe_payment()`) are called by `process_payment()` — but `process_pay_on_arrival()` and `process_use_package()` are also called by `class-wizard-api.php` for V2. Only `process_stripe_payment()` (the inline HTML redirect method) is V1-only. The constructor hooks and `process_payment()` method go; the sub-methods stay.

### File 5 — `class-bookit-loader.php`

The loader instantiates `new Booking_System_Payment_Processor()` which registers the `admin_post` hooks. No other V1-specific hooks in the loader — everything else is shared.

---

## One additional finding before the prompt

`test-wizard-flow.php` (integration tests) calls `do_shortcode('[bookit_booking_wizard]')` in `post_step_and_assert()` and `test_wizard_with_javascript_disabled()`. These are V1-specific and must be removed or rewritten for V2. I'll instruct Cursor to read this file too.

---

Here is the Cursor prompt:

---

```
TASK: Remove V1 booking wizard — atomic removal, single commit
Sprint: Code Review (post-v1.0.0) | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/class-shortcodes.php` — read in full; you are modifying this file to remove V1 methods and V1 asset enqueues while preserving everything V2 and magic-link
2. `includes/payment/class-payment-processor.php` — read in full; you are removing the `admin_post` hooks from the constructor and the `process_payment()` method; sub-methods stay
3. `includes/class-bookit-loader.php` — confirm exactly how `Booking_System_Payment_Processor` is instantiated and whether any other V1-specific hooks are registered there
4. `tests/unit/test-booking-shortcode.php` — read in full; this file will be deleted entirely
5. `tests/unit/test-wizard-navigation.php` — read in full; determine whether it contains any V2 tests before deciding to delete or modify
6. `tests/integration/test-wizard-flow.php` — read in full; it calls `do_shortcode('[bookit_booking_wizard]')` and must be updated for V2
7. `tests/unit/test-booking-wizard-v2.php` — read in full; locate `test_v2_shortcode_does_not_break_existing_wizard()` which calls the V1 shortcode and must be removed

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The V1 booking wizard (`[bookit_booking_wizard]`) is being removed. V2 (`[bookit_wizard_v2]`) is the sole wizard going forward. This is an atomic removal — all V1 code, templates, assets, and tests are removed in one commit. Nothing V2, magic-link, or confirmation-v2 is touched. The `admin_post_bookit_process_payment` handler is V1-only (V2 uses the REST API via `POST bookit/v1/wizard/complete`). Sub-methods of the payment processor (`process_pay_on_arrival()`, `process_use_package()`) are shared and must be preserved.

Baseline: **993 tests, 0 failures.** Count will drop by however many V1-only tests are removed. Zero failures is non-negotiable.

---

## IMPLEMENTATION REQUIREMENTS

### Files to DELETE outright

Confirm each exists before deleting. If a file is missing, note it and continue — do not stop.

```
public/templates/booking-wizard-shell.php
public/templates/booking-step-1-services.php
public/templates/booking-step-2-staff.php
public/templates/booking-step-3-datetime.php
public/templates/booking-step-4-contact.php
public/templates/booking-step-5-payment.php
public/templates/booking-confirmed.php
public/assets/css/booking-wizard.css
public/assets/js/booking-wizard.js
public/assets/css/datetime-picker.css
public/assets/js/datetime-picker.js
public/assets/css/contact-form.css
public/assets/js/contact-form.js
public/assets/css/payment-step.css
public/assets/css/confirmation-page.css
tests/unit/test-booking-shortcode.php
```

---

### `public/class-shortcodes.php` — MODIFY

Read the file in full before making any changes. Then:

**Remove from `__construct()`:**
- `add_shortcode('bookit_booking_wizard', ...)`
- `add_shortcode('bookit_booking_confirmation', ...)`
- `add_shortcode('bookit_confirmation', ...)`

**Remove these methods entirely:**
- `render_booking_wizard()` — loads `booking-wizard-shell.php`
- `render_booking_confirmation()` — loads `booking-confirmed.php`
- `bookit_confirmation_page_shortcode()` — loads `booking-confirmed.php`

**Modify `enqueue_wizard_assets()`:**
- Remove `$has_wizard` variable and all references to it
- Remove `$has_confirmation` variable and all references to it
- Update the early-return guard to remove `$has_wizard` and `$has_confirmation` from the condition — keep `$has_wizard_v2`, `$has_confirmation_v2`, `$has_my_packages`, `$has_cancel`, `$has_reschedule`
- Remove the `wp_enqueue_style('bookit-wizard', 'booking-wizard.css', ...)` call
- Remove the `wp_enqueue_script('bookit-wizard', 'booking-wizard.js', ...)` call
- Remove the `wp_enqueue_style('bookit-datetime-picker', ...)` call
- Remove the `wp_enqueue_script('bookit-datetime-picker', ...)` call
- Remove the `wp_enqueue_style('bookit-contact-form', ...)` call
- Remove the `wp_enqueue_script('bookit-contact-form', ...)` call
- Remove the `wp_enqueue_style('bookit-payment-step', ...)` call
- Remove the `if ($has_confirmation) { wp_enqueue_style('bookit-confirmation', 'confirmation-page.css', ...) }` block
- Keep everything related to V2, magic-link, cancel, reschedule, and my-packages assets
- Keep the script localization (`wp_localize_script`) — check whether it references `bookit-wizard` handle; if so, update to reference the appropriate V2 handle or remove if V1-only

**Modify `get_no_texturize_shortcodes()`** (if it exists):
- Remove `bookit_booking_wizard`, `bookit_booking_confirmation`, `bookit_confirmation` from the array if present
- Keep `bookit_cancel_booking`, `bookit_reschedule_booking`, and any others

**Do not touch:**
- `render_booking_wizard_v2()`
- `render_booking_confirmed_v2()`
- `render_cancel_booking()`
- `render_reschedule_booking()`
- `render_my_packages()`
- `render_email_changed()`
- `register_wizard_v2_page_template()`
- `load_wizard_v2_page_template()`
- `render_reschedule_script()`
- `render_cancel_script()`
- All V2 and magic-link asset enqueues

---

### `includes/payment/class-payment-processor.php` — MODIFY

Read the file in full before making any changes.

**Remove from `__construct()`:**
- `add_action('admin_post_bookit_process_payment', ...)`
- `add_action('admin_post_nopriv_bookit_process_payment', ...)`

**Remove this method entirely:**
- `process_payment()` — the top-level handler that reads `$_POST['payment_method']` and dispatches. This is the `admin-post.php` handler entry point, V1-only.

**Remove this method entirely:**
- `process_stripe_payment()` — renders an inline HTML page with Stripe.js redirect. This is V1-only. V2 uses the REST API path in `class-wizard-api.php`.

**Keep all other methods untouched:**
- `process_pay_on_arrival()` — called by `class-wizard-api.php` for V2
- `process_use_package()` — called by `class-wizard-api.php` for V2
- `should_log()` — shared utility
- Any other methods that are not V1-specific

If after reading the file you find any other method that is exclusively called from `process_payment()` or `process_stripe_payment()` and has no other call sites, remove it too. If uncertain, stop and report.

---

### `includes/class-bookit-loader.php` — VERIFY ONLY

Read the file. Confirm that `new Booking_System_Payment_Processor()` is the only instantiation and that removing the constructor hooks (done above in the payment processor itself) is sufficient — no additional `add_action` calls for `admin_post_bookit_process_payment` should exist in the loader. If any exist, remove them. No other changes expected here.

---

### `tests/unit/test-wizard-navigation.php` — READ THEN DECIDE

Read the file in full. If all tests reference V1 templates, the V1 shortcode, or V1 session navigation via `[bookit_booking_wizard]` — delete the file. If any tests reference V2 behaviour — preserve those tests, remove only the V1-specific ones, and rename the class if appropriate. Report which decision was made.

---

### `tests/integration/test-wizard-flow.php` — MODIFY

Read the file in full. This file calls `do_shortcode('[bookit_booking_wizard]')` in `post_step_and_assert()` and `test_wizard_with_javascript_disabled()`. Update these calls to use `[bookit_wizard_v2]` instead, and update any assertions that check for V1-specific HTML (e.g. `bookit-wizard-container` → `bookit-v2-wizard-container`). If a test's entire purpose is validating V1 template output and cannot be meaningfully adapted, remove it. Do not remove tests that validate session persistence or REST API behaviour — those are V2-compatible.

---

### `tests/unit/test-booking-wizard-v2.php` — MODIFY

Read the file in full. Locate and remove `test_v2_shortcode_does_not_break_existing_wizard()` — this test calls `do_shortcode('[bookit_booking_wizard]')` and asserts V1 output, which will no longer work after removal. All other tests in this file must remain untouched.

---

## PHPUNIT REQUIREMENTS

Baseline: **993 tests, 0 failures.**

After removal, run:
```bash
cd bookit-booking-system && vendor/bin/phpunit
```

Expected: test count drops (V1-only tests removed), 0 failures. If any test fails, fix it before committing — do not commit failing tests. Report the final test count.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `[bookit_booking_wizard]` shortcode no longer exists — `shortcode_exists('bookit_booking_wizard')` returns false
- [ ] `[bookit_booking_confirmation]` and `[bookit_confirmation]` shortcodes no longer exist
- [ ] `[bookit_wizard_v2]` still renders correctly
- [ ] `[bookit_cancel_booking]` and `[bookit_reschedule_booking]` still render correctly
- [ ] `admin-post.php?action=bookit_process_payment` no longer responds (handler removed)
- [ ] V2 wizard REST flow (`POST bookit/v1/wizard/complete`) still works — verified by existing tests passing

### Technical
- [ ] No PHP warnings or notices on any page
- [ ] `booking-wizard.css`, `booking-wizard.js` no longer enqueued on any page
- [ ] V2 assets (`booking-wizard-v2.css`, `booking-wizard-v2.js`) still enqueue correctly on V2 wizard page
- [ ] PHPUnit passes (reduced count, 0 failures)

### Must NOT break
- [ ] `[bookit_wizard_v2]` — full V2 wizard flow
- [ ] `[bookit_booking_confirmed_v2]` — V2 confirmation page
- [ ] `[bookit_cancel_booking]` — magic link cancel
- [ ] `[bookit_reschedule_booking]` — magic link reschedule
- [ ] `[bookit_my_packages]` — packages page
- [ ] `[bookit_email_changed]` — email change confirmation
- [ ] `process_pay_on_arrival()` in payment processor — used by V2 REST path
- [ ] `process_use_package()` in payment processor — used by V2 REST path
- [ ] All existing V2 tests in `test-booking-wizard-v2.php` (except the one removed)
- [ ] All existing V2 confirmation tests in `test-booking-confirmed-v2.php`

---

## GIT COMMIT MESSAGE

```
Remove V1 booking wizard — superseded by V2

Shortcodes removed: bookit_booking_wizard, bookit_booking_confirmation,
bookit_confirmation
Methods removed: render_booking_wizard(), render_booking_confirmation(),
bookit_confirmation_page_shortcode(), process_payment(),
process_stripe_payment()
Constructor hooks removed: admin_post_bookit_process_payment (V1-only)
Templates removed: booking-wizard-shell.php, booking-step-1 through
booking-step-5, booking-confirmed.php
Assets removed: booking-wizard.css/js, datetime-picker.css/js,
contact-form.css/js, payment-step.css, confirmation-page.css
Tests removed/updated: test-booking-shortcode.php deleted,
test-wizard-navigation.php deleted/updated (read to decide),
test-wizard-flow.php updated for V2, test-booking-wizard-v2.php
had one V1 compatibility test removed
V2 wizard, V2 confirmation, magic link pages unaffected

Tests: [N] passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.