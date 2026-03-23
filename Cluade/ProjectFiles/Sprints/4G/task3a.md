TASK 3A OF 3: CSS Custom Properties (Visual Token System)
Sprint: 4G | Est: ~2h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/assets/css/booking-wizard.css` — full file; check whether a `:root`
   block already exists. Identify every hardcoded colour value, border-radius,
   font-family, and shadow value. These are the targets for variable replacement.

2. `public/assets/css/confirmation-page.css` — full file; identify hardcoded
   colour values to replace with variables.

3. `public/assets/css/my-packages.css` — full file (created in Task 2b);
   identify hardcoded colour values to replace with variables.

4. `dashboard/tailwind.config.js` — read the colour definitions; the primary
   colour in the `:root` block must match the dashboard's primary brand colour
   so the public wizard visually aligns with the dashboard.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task defines the CSS custom property system that client themes can use to
override Bookit's visual tokens without touching the plugin's CSS files.
It is a CSS-only change — no PHP, no Vue, no tests required. The deliverable
is a `:root` block at the top of `booking-wizard.css` plus variable substitution
across the three CSS files. Task 3b (template loader) is independent and can
run after this.

---

## IMPLEMENTATION REQUIREMENTS

### public/assets/css/booking-wizard.css — MODIFY

Read the full file via GitHub before making any change.

**Step 1:** Add the following `:root` block at the very top of the file,
before any other rules. Verify the primary colour matches what is defined in
`dashboard/tailwind.config.js` — if it differs, use the Tailwind value:

```css
/**
 * Bookit CSS Custom Properties
 *
 * Override any of these in your theme stylesheet to customise
 * the booking wizard without modifying plugin files.
 *
 * Example:
 *   :root {
 *     --bookit-primary:       #E91E63;
 *     --bookit-border-radius: 4px;
 *   }
 */
:root {
  /* Brand colours */
  --bookit-primary:          #4F46E5;
  --bookit-primary-hover:    #4338CA;
  --bookit-primary-light:    #EEF2FF;
  --bookit-accent:           #10B981;

  /* Text */
  --bookit-text-primary:     #111827;
  --bookit-text-secondary:   #6B7280;
  --bookit-text-muted:       #9CA3AF;
  --bookit-text-inverse:     #FFFFFF;

  /* Backgrounds */
  --bookit-bg-page:          #F9FAFB;
  --bookit-bg-card:          #FFFFFF;
  --bookit-bg-input:         #FFFFFF;

  /* Borders */
  --bookit-border:           #E5E7EB;
  --bookit-border-focus:     #4F46E5;
  --bookit-border-radius:    8px;
  --bookit-border-radius-sm: 4px;

  /* Shadows */
  --bookit-shadow-sm:        0 1px 2px rgba(0,0,0,0.05);
  --bookit-shadow:           0 4px 6px rgba(0,0,0,0.07);

  /* Spacing */
  --bookit-spacing-xs:       4px;
  --bookit-spacing-sm:       8px;
  --bookit-spacing-md:       16px;
  --bookit-spacing-lg:       24px;
  --bookit-spacing-xl:       32px;

  /* Typography */
  --bookit-font-family:      -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --bookit-font-size-sm:     0.875rem;
  --bookit-font-size-base:   1rem;
  --bookit-font-size-lg:     1.125rem;
  --bookit-font-size-xl:     1.25rem;
  --bookit-line-height:      1.5;

  /* Buttons */
  --bookit-btn-primary-bg:   var(--bookit-primary);
  --bookit-btn-primary-text: var(--bookit-text-inverse);
  --bookit-btn-radius:       var(--bookit-border-radius);

  /* Status colours */
  --bookit-color-success:    #10B981;
  --bookit-color-warning:    #F59E0B;
  --bookit-color-error:      #EF4444;
  --bookit-color-info:       #3B82F6;

  /* Wizard step indicator */
  --bookit-step-active-bg:   var(--bookit-primary);
  --bookit-step-done-bg:     var(--bookit-accent);
  --bookit-step-inactive-bg: var(--bookit-border);
}
```

**Step 2:** Audit the rest of `booking-wizard.css`. For each hardcoded value
that matches a defined variable, replace it with the variable. Rules:

- Replace colour hex values that match variable values
- Replace `border-radius` values that match `--bookit-border-radius` or
  `--bookit-border-radius-sm`
- Replace `font-family` stacks that match `--bookit-font-family`
- Replace `box-shadow` values that match `--bookit-shadow` or `--bookit-shadow-sm`
- Do NOT change layout properties (margin, padding, width, display, flex, grid)
- Do NOT change values that have no matching variable — leave them as-is
- Do NOT change any property inside `@keyframes` blocks
- If a colour is close but not an exact match to a variable, leave it hardcoded

---

### public/assets/css/confirmation-page.css — MODIFY

Read the full file via GitHub before making any change.

Apply the same substitution pass as above:
- Replace hardcoded colour values that match defined variables with those variables
- Replace border-radius values where they match
- Do NOT add a second `:root` block — variables are defined once in
  `booking-wizard.css` and available globally
- Do NOT change layout properties

---

### public/assets/css/my-packages.css — MODIFY

Read the full file via GitHub before making any change.

Apply the same substitution pass:
- Replace hardcoded colour values that match defined variables
- This file was just created in Task 2b; it likely uses the same palette, so
  most colour values should be replaceable

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] No PHP changes required.
- [ ] No Vue changes required.
- [ ] No migrations required.
- [ ] No `npm run build` required (no dashboard JS changes).

---

## PHPUNIT REQUIREMENTS

No new PHPUnit tests required for this task. CSS changes are not unit-testable.

Baseline remains: 717 tests, 0 failures — must not regress.

Run after implementation to confirm no regressions:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `:root` block with all listed custom properties is present at the top
      of `booking-wizard.css`
- [ ] Hardcoded colour values in `booking-wizard.css` that match defined
      variables have been replaced with `var(--bookit-*)` references
- [ ] Same replacement applied in `confirmation-page.css`
- [ ] Same replacement applied in `my-packages.css`
- [ ] Booking wizard renders identically to before in Local by Flywheel
      (visual regression check — no layout or colour changes visible)
- [ ] Confirmation page renders identically to before
- [ ] My Packages page renders identically to before

### Technical
- [ ] No second `:root` block added to confirmation-page.css or my-packages.css
- [ ] No layout properties (margin, padding, width) changed
- [ ] No values changed that have no matching variable
- [ ] CSS is valid (no syntax errors)
- [ ] PHPUnit suite still passes (717 tests, 0 failures)

### Theme override test
- [ ] Adding the following to any theme's stylesheet changes the wizard's
      primary button colour to pink without any other side effects:
      `:root { --bookit-primary: #E91E63; }`

---

## GIT COMMIT MESSAGE

```
Sprint 4G, Task 3a: Add CSS custom properties to booking wizard CSS

- Add :root token block to booking-wizard.css with full set of
  --bookit-* custom properties
- Replace matching hardcoded colour/radius/shadow values with
  var(--bookit-*) references in booking-wizard.css
- Apply same variable substitution to confirmation-page.css
- Apply same variable substitution to my-packages.css

Tests: 717 passing, 0 failures
```

---

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.