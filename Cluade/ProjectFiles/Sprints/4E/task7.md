Good. Let me get the Vue 3 accessibility docs from Context7 before writing the Task 7 prompt, since this task involves ARIA patterns and focus management.Good. I have the Vue 3 accessibility patterns confirmed. Now let me check what new Vue views were added in Sprints 4C–4D to know exactly what to audit.Excellent — I can see the current state of `Packages.vue`. The modal already has a focus trap implemented (`trapFocusHandler`, `redeemModalRef`, `redeemPreviousActive`). Let me check the booking step 5 template and a couple more views.Good — now I have a clear picture. The key findings from reading the existing code:

- `Packages.vue` already has a proper focus trap with `redeemModalRef`, `redeemPreviousActive`, `trapFocusHandler`, and Escape key support ✅
- `BookingModal.vue` has a focus trap already ✅  
- `booking-wizard-shell.php` has skip link, ARIA labels on nav, `role="main"`, `role="navigation"` ✅
- `booking-step-5-payment.php` has proper `<label for>` on all radio inputs ✅

This means the most common WCAG fixes are already in place. Task 7 will be a targeted gap-fill rather than a wholesale audit. Now I can write a precise prompt.

---

## TASK 7 OF 8: WCAG 2.1 AA Accessibility Fixes (~12h, likely 4–6h actual)

```
TASK 7 OF 8: WCAG 2.1 AA Accessibility Fixes
Sprint: 4E | Est: 12h | Plugin root: bookit-booking-system/
```

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

Read every file listed below via GitHub (lstroh/bookit-imp, branch: Phase1) before writing any code. If any file does not exist, stop and report back.

1. `dashboard/src/views/Packages.vue` — read the full file; note existing focus trap on redeem modal; identify any status badges, loading states, aria-live regions, and expandable redemption rows
2. `dashboard/src/views/CustomerProfile.vue` — read the full file; check Packages tab UI for focus management, keyboard-accessible expandable rows, status badges, aria attributes
3. `dashboard/src/views/Settings.vue` — read the packages section; check for aria labels on the toggle, loading states
4. `dashboard/src/components/SetupGuideOverlay.vue` — read the full file; this is the reference focus trap pattern to follow for any gaps
5. `dashboard/src/components/BookitTooltip.vue` — read to understand the existing accessible tooltip pattern
6. `dashboard/src/App.vue` — check skip link, aria-labels, existing accessibility foundations
7. `public/templates/booking-step-5-payment.php` — check package UI section (added Sprint 4D) for keyboard navigation and ARIA
8. `public/templates/booking-wizard-shell.php` — already read; note the existing skip link and ARIA structure

Note: Before implementing any Vue ARIA or focus management code, use Context7 to resolve 'Vue 3' and confirm current patterns for `ref`, `onMounted`, `nextTick`, `document.addEventListener`, and `aria-*` template attributes.

---

## CONTEXT

Several accessibility foundations are already solid: `Packages.vue` has a complete focus trap on its redeem modal, `BookingModal.vue` has a focus trap, and `booking-wizard-shell.php` has skip link and ARIA navigation labels. This task fills the remaining gaps found during the sprint audit. All changes are targeted fixes — do not rewrite working components.

---

## IMPLEMENTATION REQUIREMENTS

### `dashboard/src/views/Packages.vue` — MODIFY (targeted gaps only)

Read the full file first, then fix only what is missing:

**Gap 1 — Status badges must convey meaning via text, not colour alone:**

Locate the status badge rendering (likely showing "active", "exhausted", "expired", "cancelled" with colour classes). Verify that each badge includes visible text alongside any colour indicator. If status is conveyed only via a colour-coded dot or background with no visible text label, add the text. If text is already present alongside colour, add a comment confirming this and skip.

**Gap 2 — Redemption history expandable rows must be keyboard-accessible:**

Locate where redemption history rows are toggled (the expand/collapse for a customer package's booking history). The toggle trigger must be a `<button>` (not a `<div>` or `<tr>` with a click handler). Verify:
- Toggle trigger is a `<button>` element
- Button has `aria-expanded="true/false"` bound to the open/closed state
- Button has `aria-controls` pointing to the ID of the panel it controls
- Panel has the matching `id` attribute
- Panel section has `aria-live="polite"` if it loads data asynchronously

If already correct: add audit comment, skip. If not: fix to match the pattern above.

**Gap 3 — Loading states use `aria-live`:**

Find where loading spinners or loading text appear (e.g. while packages list is fetching). Verify there is a screen-reader-accessible live region announcing loading/loaded state. If missing, wrap the loading message in:
```html
<span role="status" aria-live="polite" class="sr-only">Loading packages...</span>
```
Use `class="sr-only"` (visually hidden but screen-reader accessible) if the loading message is already visible; add visually-hidden text only if it isn't announced any other way.

**Gap 4 — Error messages use `role="alert"`:**

Find where error messages are rendered (API errors, redemption errors). Verify they use `role="alert"` so screen readers announce them immediately. If missing, add `role="alert"` to the error container element.

---

### `dashboard/src/views/CustomerProfile.vue` — MODIFY (targeted gaps only)

Read the full file first, then:

**Gap 1 — Packages tab expandable rows (same pattern as Packages.vue):**
Apply the same `aria-expanded` / `aria-controls` / matching `id` pattern to any expandable redemption history rows in the Packages tab.

**Gap 2 — Status badges:**
Same fix as Packages.vue — verify text is present alongside colour, not colour alone.

**Gap 3 — Loading states and error messages:**
Apply `aria-live="polite"` to loading regions and `role="alert"` to error message containers in the packages tab section.

---

### `dashboard/src/views/Settings.vue` — MODIFY (targeted gaps only)

Read the packages section of the settings file first, then:

**Gap — `packages_enabled` toggle must have an explicit label:**

Find the toggle for `packages_enabled`. Verify it has:
- An explicit `<label>` element associated via `for`/`id`, OR an `aria-label` on the input, OR an `aria-labelledby` pointing to a visible label element
- If the toggle uses a custom UI component: check that the underlying `<input type="checkbox">` or `<button role="switch">` has the label correctly wired

If already labelled correctly: add audit comment, skip.

---

### `public/templates/booking-step-5-payment.php` — MODIFY (targeted gaps only)

Read the file first (you already read it in Task 1, but re-read to see the package UI section specifically). Then:

**Gap 1 — Package selector keyboard navigation:**

Find the "Use a Package" section (the radio list of existing packages). Verify:
- Each package option is an `<input type="radio">` with an associated `<label for="...">` — these should already be present from Task 1's XSS audit
- The radio group has a `<fieldset>` and `<legend>` wrapping the group, with the legend text describing the choice (e.g. "Select a package to use for this booking")
- If `<fieldset>`/`<legend>` are missing: add them around the radio group

**Gap 2 — Package cards show sessions/expiry in text:**

Verify that session count and expiry date are rendered as visible text within each package label (not just as visual badges). From what was already read in the search results, this appears to be already done (`sessions_remaining/sessions_total` and `expires_at` are rendered as text). If confirmed: add audit comment.

**Gap 3 — `lang="en-GB"` on booking wizard HTML root:**

Check `booking-wizard-shell.php` — the outer `<div class="bookit-wizard-container">` is not an HTML root element, so `lang` doesn't apply here. The `lang` attribute must be on the `<html>` element of the page, which is controlled by WordPress/the theme, not the plugin. This is outside plugin scope — document this in a code comment and skip.

---

## MANUAL TESTING CHECKLIST

After implementation, Cursor must provide this checklist for manual verification:

**Keyboard navigation (no mouse):**
- [ ] Tab through booking wizard Step 5 — all package radio options are reachable and selectable with keyboard
- [ ] Tab into the Packages view in dashboard — status badges are readable as text, not colour only
- [ ] Open the redeem session modal — Tab and Shift+Tab cycle within modal only (confirm existing trap still works)
- [ ] Press Escape in redeem modal — modal closes, focus returns to trigger button
- [ ] Expand a redemption history row — Enter/Space on the toggle button works
- [ ] Tab past all rows — focus never gets stuck

**Screen reader (use browser DevTools accessibility panel or NVDA/VoiceOver):**
- [ ] Trigger a loading state in Packages view — loading announcement is made
- [ ] Trigger an API error — error is announced immediately (role="alert")
- [ ] Open/close redemption history — aria-expanded state change is announced

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No new PHP files
- [ ] No new Vue component files (modify existing only)
- [ ] No new migrations
- [ ] No new error codes

---

## PHPUNIT REQUIREMENTS

**Baseline: 703 tests, 0 failures — must not regress.**

No new PHPUnit tests for accessibility changes. All existing tests must continue to pass.

**After any Vue changes, run:**
```
npm run build
(in bookit-booking-system/dashboard/)
```
Then run:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Status badges in Packages view and CustomerProfile Packages tab include visible text alongside colour
- [ ] Redemption history expandable rows are triggered by `<button>` with `aria-expanded` and `aria-controls`
- [ ] Loading states in Packages view and CustomerProfile Packages tab have `aria-live` regions
- [ ] Error messages in affected views use `role="alert"`
- [ ] `packages_enabled` toggle in Settings has explicit label or `aria-label`
- [ ] Package radio group in wizard Step 5 has `<fieldset>` and `<legend>`
- [ ] Existing focus trap in redeem modal still works (not broken by changes)
- [ ] `npm run build` passes after Vue changes

### Technical
- [ ] No new `outline: none` without accessible replacement introduced
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] PHPUnit suite passes (703 tests, 0 failures)

### Must NOT break
- [ ] Package redemption flow (wizard and dashboard)
- [ ] Redeem session modal (existing focus trap must remain intact)
- [ ] Packages list, CustomerProfile packages tab, Settings packages toggle
- [ ] Booking wizard Step 5 payment flow

---

## GIT COMMIT MESSAGE

```
Sprint 4E, Task 7: WCAG 2.1 AA accessibility fixes

- Status badges: added visible text alongside colour in Packages/CustomerProfile
- Expandable rows: aria-expanded + aria-controls on redemption history toggles
- Loading states: aria-live="polite" regions in Packages and CustomerProfile
- Error messages: role="alert" on error containers in affected views
- Settings packages toggle: explicit label/aria-label confirmed or added
- Step 5 package radio group: fieldset + legend added
- lang="en-GB": confirmed this is theme scope, not plugin scope (commented)

Tests: 703 passing, 0 failures
```

---

If you encounter an existing ARIA implementation that looks different from what is described above (because the file has changed since the sprint plan was written), **read what is there and adapt the fix accordingly — do not overwrite a working implementation with the pattern described above**. If you find something already correct, add an audit comment and skip.

If you encounter an architecture decision not covered above, **STOP and report back before writing any code.**