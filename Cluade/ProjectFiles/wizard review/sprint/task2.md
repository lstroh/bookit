Let me read the design files and existing CSS before writing the prompt.I have everything I need. The full token list from `booking-wizard.css` is confirmed, the design decisions document is clear, and I can see the existing stub. Here is the Task 2 prompt:

---

```
TASK 2 OF 6: CSS implementation and progress bar partial
Sprint: Wizard-V2 | Est: ~4h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `public/assets/css/booking-wizard.css` — read the full `:root` token block; every `--bookit-*` token defined there must NOT be redeclared in the v2 `:root` block; use them by reference only
2. `public/assets/css/booking-wizard-v2.css` — the stub from Task 1 to replace with full implementation
3. `public/templates/partials/booking-wizard-v2-progress.php` — the stub from Task 1 to replace with full implementation
4. `design/wizard-design-decisions.md` — authoritative source for all visual decisions; read every section
5. `design/wizard-step1.html` — card and grid component reference; read the full CSS block for exact values
6. `design/wizard-step2-list.html` — staff list layout reference (1–3 staff)
7. `design/wizard-step2-grid.html` — staff grid layout reference (4+ staff)
8. `design/wizard-step3.html` — calendar and time slot component reference
9. `design/wizard-step4.html` — form, special requests, waiver, and checkbox component reference
10. `design/wizard-step5-no-package.html` — Zone A, Zone C, sticky footer, and payment row reference
11. `design/wizard-step5-with-package.html` — Zone B use-package variant reference
12. `design/wizard-step5-buy-package.html` — Zone B buy-package variant reference

If any file does not exist, stop and report back before proceeding.

---

## Context

This task implements the complete CSS for Wizard V2 and replaces the progress bar partial stub with its full implementation. No PHP step logic is touched — only `booking-wizard-v2.css` and `partials/booking-wizard-v2-progress.php` change. All design values come from the reference HTML files and `wizard-design-decisions.md`. The CSS must be complete and correct so that Tasks 3–6 can drop in step templates and see them styled immediately.

---

## Implementation requirements

### `public/assets/css/booking-wizard-v2.css` — MODIFY (replace stub entirely)

**Structure of the file (in this order):**
1. File header comment block
2. `:root` block — new `--bookit-v2-*` tokens only
3. Component styles — all scoped inside `.bookit-v2-wizard-container` except the `:root` block

---

**`:root` token block — declare these exact tokens, nothing else:**

```css
:root {
  --bookit-v2-max-width:          680px;
  --bookit-v2-progress-height:    2.5px;
  --bookit-v2-avatar-size-grid:   44px;
  --bookit-v2-avatar-size-list:   36px;
  --bookit-v2-slot-radius:        10px;
  --bookit-v2-banner-bg:          #f7f6f4;
  --bookit-v2-zone-label-size:    10px;
  --bookit-v2-zone-label-spacing: 0.08em;
  --bookit-v2-waiver-bg:          #fffbf0;
  --bookit-v2-waiver-border:      #e6a817;
  --bookit-v2-waiver-heading:     #92610a;
  --bookit-v2-waiver-text:        #5c3d06;
}
```

Do not declare any `--bookit-*` token (without the `v2` infix) in this block — those already exist in `booking-wizard.css` and are available globally.

---

**Component styles — implement all of the following, referencing the design HTML files for exact pixel/rem values:**

**1. Wizard container**
- `max-width: var(--bookit-v2-max-width)`, `margin: 0 auto`, `width: 100%`
- `font-family: var(--bookit-font-family)`
- `padding-bottom: 7rem` (space for sticky footer)

**2. Progress bar**
- `.bookit-v2-progress`: `display: flex`, `gap: 0`, each item takes equal `flex: 1`
- `.bookit-v2-step-item`: `display: flex`, `flex-direction: column`, `align-items: center`, `position: relative`, `padding-bottom: 8px`
- `.bookit-v2-step-label`: `font-size: 11px`, `font-weight: 500`, `letter-spacing: 0.02em`, `text-align: center`, `padding-bottom: 6px`
- Underline via `::after` pseudo-element on `.bookit-v2-step-item`: `content: ''`, `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`, `height: var(--bookit-v2-progress-height)`, `border-radius: 2px`
- **Active** (`.bookit-v2-step-item--active`): label colour `var(--bookit-primary)`, `font-weight: 600`; `::after` background `var(--bookit-primary)`
- **Done** (`.bookit-v2-step-item--done`): label colour `var(--bookit-text-secondary)`; `::after` background `var(--bookit-primary-light)`
- **Inactive** (`.bookit-v2-step-item--inactive`): label colour `var(--bookit-text-muted)`; `::after` background `transparent`
- Progress bar wrapper: `padding: 1rem 1rem 0`, `margin-bottom: 1.5rem`

**3. Confirmation banner**
- `.bookit-v2-confirm-banner`: `display: flex`, `align-items: flex-start`, `justify-content: space-between`, `gap: 12px`, `background: var(--bookit-v2-banner-bg)`, `border: 1px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 10px 14px`, `margin-bottom: 1.25rem`
- `.bookit-v2-confirm-banner-text`: `font-size: 13px`, `font-weight: 500`, `color: var(--bookit-text-primary)`, `line-height: 1.5`
- `.bookit-v2-confirm-banner-change`: `font-size: 12px`, `color: var(--bookit-text-muted)`, `background: none`, `border: none`, `cursor: pointer`, `padding: 0`, `flex-shrink: 0`, `margin-top: 1px`; hover: `color: var(--bookit-text-secondary)`

**4. Step heading and subheading**
- `.bookit-v2-step-heading`: `font-size: 22px`, `font-weight: 600`, `color: var(--bookit-text-primary)`, `letter-spacing: -0.02em`, `line-height: 1.25`, `margin-bottom: 4px`
- `.bookit-v2-step-subheading`: `font-size: 14px`, `color: var(--bookit-text-secondary)`, `margin-bottom: 1.5rem`, `line-height: 1.5`

**5. Step content padding**
- `.bookit-v2-step-body`: `padding: 0 1rem 1rem`

**6. Category label**
- `.bookit-v2-category-label`: `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--bookit-text-muted)`, `margin-bottom: 8px`, `margin-top: 16px`; first-child: `margin-top: 0`

**7. Service cards grid**
- `.bookit-v2-services-grid`: `display: grid`, `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, `gap: 10px`
- `.bookit-v2-services-grid--few`: `grid-template-columns: 1fr` (forces single column when ≤ 2 services)
- `.bookit-v2-service-card`: `background: var(--bookit-bg-card)`, `border: 1.5px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 1rem`, `cursor: pointer`, transition on border-color and background
- `.bookit-v2-service-card:hover`: `border-color` shifts to a mid-grey (`#d1d5db`)
- `.bookit-v2-service-card--selected`: `border-color: var(--bookit-primary)`, `background: var(--bookit-primary-light)`
- `.bookit-v2-service-name`: `font-size: 14px`, `font-weight: 600`, `color: var(--bookit-text-primary)`, `margin-bottom: 4px`
- `.bookit-v2-service-card--selected .bookit-v2-service-name`: `color: var(--bookit-primary)`
- `.bookit-v2-service-duration`: `font-size: 12px`, `color: var(--bookit-text-secondary)`

**8. Staff list layout (1–3 staff)**
- `.bookit-v2-staff-list`: `display: flex`, `flex-direction: column`, `gap: 8px`
- `.bookit-v2-staff-row`: `display: flex`, `align-items: center`, `gap: 12px`, `background: var(--bookit-bg-card)`, `border: 1.5px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 12px 14px`, `cursor: pointer`, transition
- `.bookit-v2-staff-row:hover`: border shifts to `#d1d5db`
- `.bookit-v2-staff-row--selected`: `border-color: var(--bookit-primary)`, `background: var(--bookit-primary-light)`
- `.bookit-v2-staff-row--unavailable`: `opacity: 0.5`, `cursor: default`, `pointer-events: none`

**9. Staff grid layout (4+ staff)**
- `.bookit-v2-staff-grid`: `display: grid`, `grid-template-columns: 1fr 1fr`, `gap: 10px`
- `.bookit-v2-staff-grid .bookit-v2-staff-card:last-child:nth-child(odd)`: `grid-column: 1 / -1`
- `.bookit-v2-staff-card`: `background: var(--bookit-bg-card)`, `border: 1.5px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 1rem`, `cursor: pointer`, `text-align: center`, transition
- `.bookit-v2-staff-card:hover`: border shifts to `#d1d5db`
- `.bookit-v2-staff-card--selected`: `border-color: var(--bookit-primary)`, `background: var(--bookit-primary-light)`
- `.bookit-v2-staff-card--unavailable`: `opacity: 0.5`, `cursor: default`, `pointer-events: none`

**10. Avatar circle**
- `.bookit-v2-avatar`: `border-radius: 50%`, `display: flex`, `align-items: center`, `justify-content: center`, `font-weight: 600`, `color: #ffffff`, `flex-shrink: 0`, `font-size: 13px`
- In list context (`.bookit-v2-staff-row .bookit-v2-avatar`): `width: var(--bookit-v2-avatar-size-list)`, `height: var(--bookit-v2-avatar-size-list)`
- In grid context (`.bookit-v2-staff-card .bookit-v2-avatar`): `width: var(--bookit-v2-avatar-size-grid)`, `height: var(--bookit-v2-avatar-size-grid)`, `margin: 0 auto 8px`

**11. Staff info**
- `.bookit-v2-staff-info`: `flex: 1`, `min-width: 0`
- `.bookit-v2-staff-name`: `font-size: 14px`, `font-weight: 600`, `color: var(--bookit-text-primary)`
- `.bookit-v2-staff-row--selected .bookit-v2-staff-name`, `.bookit-v2-staff-card--selected .bookit-v2-staff-name`: `color: var(--bookit-primary)`
- `.bookit-v2-staff-title`: `font-size: 12px`, `color: var(--bookit-text-secondary)`, `margin-top: 1px`
- `.bookit-v2-staff-price`: `font-size: 13px`, `font-weight: 600`, `color: var(--bookit-text-primary)`, `flex-shrink: 0`
- `.bookit-v2-staff-bio`: `font-size: 12px`, `color: var(--bookit-text-secondary)`, `margin-top: 4px`, `line-height: 1.4`

**12. "Any available" row**
- `.bookit-v2-any-available`: `background: var(--bookit-v2-banner-bg)`, always full width; in grid context force `grid-column: 1 / -1`
- `.bookit-v2-any-available-name`: `font-size: 14px`, `font-weight: 600`, `color: var(--bookit-text-primary)`
- `.bookit-v2-any-available.bookit-v2-staff-row--selected .bookit-v2-any-available-name`: `color: var(--bookit-primary)`
- `.bookit-v2-any-available-sub`: `font-size: 12px`, `color: var(--bookit-text-secondary)`, `line-height: 1.4`

**13. Calendar**
- `.bookit-v2-calendar`: `width: 100%`, `margin-bottom: 1.5rem`
- `.bookit-v2-calendar-header`: `display: flex`, `align-items: center`, `justify-content: space-between`, `margin-bottom: 12px`
- `.bookit-v2-calendar-title`: `font-size: 15px`, `font-weight: 600`, `color: var(--bookit-text-primary)`
- `.bookit-v2-calendar-nav`: `background: none`, `border: none`, `cursor: pointer`, `padding: 4px 8px`, `color: var(--bookit-text-secondary)`, `font-size: 16px`; hover: `color: var(--bookit-text-primary)`
- `.bookit-v2-calendar-grid`: `display: grid`, `grid-template-columns: repeat(7, 1fr)`, `gap: 2px`
- `.bookit-v2-calendar-dow`: `font-size: 10px`, `font-weight: 600`, `text-transform: uppercase`, `color: var(--bookit-text-muted)`, `text-align: center`, `padding: 4px 0`
- `.bookit-v2-day`: `aspect-ratio: 1`, `display: flex`, `align-items: center`, `justify-content: center`, `border-radius: 50%`, `font-size: 13px`, `cursor: pointer`, `min-height: 36px`, `position: relative`
- `.bookit-v2-day--available`: `color: var(--bookit-text-primary)`, `font-weight: 500`; hover: `background: var(--bookit-primary-light)`
- `.bookit-v2-day--selected`: `background: var(--bookit-primary)`, `color: #ffffff`, `font-weight: 600`; hover: same
- `.bookit-v2-day--disabled`: `opacity: 0.35`, `cursor: default`, `pointer-events: none`
- `.bookit-v2-day--other-month`: `opacity: 0.4`, `cursor: default`
- `.bookit-v2-day--today::after`: `content: ''`, `position: absolute`, `bottom: 3px`, `left: 50%`, `transform: translateX(-50%)`, `width: 4px`, `height: 4px`, `border-radius: 50%`, `background: var(--bookit-primary)`
- `.bookit-v2-day--today.bookit-v2-day--selected::after`: `background: #ffffff`

**14. Time slot sections**
- `.bookit-v2-time-section`: `margin-bottom: 1.25rem`
- `.bookit-v2-time-section-label`: `font-size: var(--bookit-v2-zone-label-size)`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: var(--bookit-v2-zone-label-spacing)`, `color: var(--bookit-text-muted)`, `margin-bottom: 8px`
- `.bookit-v2-slots-grid`: `display: grid`, `grid-template-columns: repeat(3, 1fr)`, `gap: 8px`
- `.bookit-v2-slot`: `padding: 10px 6px`, `border-radius: var(--bookit-v2-slot-radius)`, `border: 1.5px solid var(--bookit-border)`, `background: var(--bookit-bg-card)`, `font-size: 13px`, `font-weight: 500`, `text-align: center`, `cursor: pointer`, transition
- `.bookit-v2-slot--available:hover`: `border-color: var(--bookit-primary)`, `color: var(--bookit-primary)`
- `.bookit-v2-slot--selected`: `background: var(--bookit-primary)`, `color: #ffffff`, `border-color: var(--bookit-primary)`
- `.bookit-v2-slot--unavailable`: `opacity: 0.5`, `cursor: default`, `pointer-events: none`, `background: var(--bookit-v2-banner-bg)`

**15. Form fields**
- `.bookit-v2-form-group`: `margin-bottom: 1.125rem`
- `.bookit-v2-form-label`: `display: block`, `font-size: 13px`, `font-weight: 500`, `color: var(--bookit-text-primary)`, `margin-bottom: 6px`
- `.bookit-v2-form-input`: `width: 100%`, `padding: 12px 14px`, `font-size: 15px`, `font-family: inherit`, `color: var(--bookit-text-primary)`, `background: var(--bookit-bg-input)`, `border: 1.5px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `outline: none`, `transition: border-color 0.15s ease`, `box-sizing: border-box`, `appearance: none`
- `.bookit-v2-form-input::placeholder`: `color: var(--bookit-text-muted)`
- `.bookit-v2-form-input:focus`: `border-color: var(--bookit-primary)`
- `.bookit-v2-form-input.bookit-v2-input--error`: `border-color: var(--bookit-color-error)`, `background: #fef2f2`
- `.bookit-v2-field-error`: `display: block`, `font-size: 12px`, `color: var(--bookit-color-error)`, `margin-top: 5px`, `line-height: 1.4`

**16. Special requests toggle**
- `.bookit-v2-special-requests-toggle`: `display: inline-flex`, `align-items: center`, `gap: 4px`, `font-size: 13px`, `font-weight: 500`, `color: var(--bookit-primary)`, `background: none`, `border: none`, `cursor: pointer`, `font-family: inherit`, `padding: 0`, `margin-bottom: 1.125rem`; hover: `text-decoration: underline`

**17. Form divider**
- `.bookit-v2-form-divider`: `height: 1px`, `background: var(--bookit-border)`, `margin: 1.25rem 0`

**18. Checkbox group**
- `.bookit-v2-checkbox-group`: `display: flex`, `align-items: flex-start`, `gap: 10px`, `margin-bottom: 0.75rem`
- `.bookit-v2-checkbox-group input[type="checkbox"]`: `width: 18px`, `height: 18px`, `flex-shrink: 0`, `margin-top: 1px`, `accent-color: var(--bookit-primary)`, `cursor: pointer`
- `.bookit-v2-checkbox-label`: `font-size: 14px`, `color: var(--bookit-text-primary)`, `line-height: 1.4`, `cursor: pointer`
- `.bookit-v2-checkbox-helper`: `font-size: 12px`, `color: var(--bookit-text-muted)`, `margin-top: 3px`, `margin-left: 28px`, `line-height: 1.4`

**19. Waiver block — uses fixed token values, NOT `--bookit-primary`**
- `.bookit-v2-waiver-block`: `background: var(--bookit-v2-waiver-bg)`, `border: 1px solid #f0d080`, `border-left: 3.5px solid var(--bookit-v2-waiver-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 1rem 1.125rem`, `margin-top: 1.125rem`
- `.bookit-v2-waiver-heading`: `font-size: 13px`, `font-weight: 700`, `color: var(--bookit-v2-waiver-heading)`, `margin-bottom: 6px`, `line-height: 1.3`
- `.bookit-v2-waiver-body`: `font-size: 13px`, `color: var(--bookit-v2-waiver-text)`, `line-height: 1.55`, `margin-bottom: 12px`
- `.bookit-v2-waiver-block .bookit-v2-checkbox-group input[type="checkbox"]`: `accent-color: var(--bookit-v2-waiver-border)` — override the global checkbox accent for the waiver only
- `.bookit-v2-waiver-block .bookit-v2-checkbox-label`: `color: var(--bookit-v2-waiver-text)`, `font-weight: 500`

**20. Zone labels (Step 5)**
- `.bookit-v2-zone-label`: `font-size: var(--bookit-v2-zone-label-size)`, `font-weight: 600`, `color: var(--bookit-text-muted)`, `letter-spacing: var(--bookit-v2-zone-label-spacing)`, `text-transform: uppercase`, `margin-bottom: 12px`

**21. Zone A — booking summary**
- `.bookit-v2-zone-a`: `padding: 1.25rem 1rem`, `border-bottom: 1px solid var(--bookit-border)`
- `.bookit-v2-summary-rows`: `display: flex`, `flex-direction: column`, `gap: 6px`, `margin-bottom: 14px`
- `.bookit-v2-summary-row`: `display: flex`, `justify-content: space-between`, `align-items: baseline`, `gap: 8px`
- `.bookit-v2-summary-key`: `font-size: 13px`, `color: var(--bookit-text-secondary)`, `flex-shrink: 0`
- `.bookit-v2-summary-val`: `font-size: 13px`, `color: var(--bookit-text-primary)`, `font-weight: 500`, `text-align: right`
- `.bookit-v2-zone-divider`: `height: 1px`, `background: var(--bookit-border)`, `margin: 12px 0`
- `.bookit-v2-deposit-rows`: `display: flex`, `flex-direction: column`, `gap: 5px`, `margin-bottom: 12px`
- `.bookit-v2-deposit-row`: `display: flex`, `justify-content: space-between`, `align-items: baseline`
- `.bookit-v2-deposit-key`: `font-size: 13px`, `color: var(--bookit-text-secondary)`
- `.bookit-v2-deposit-val`: `font-size: 13px`, `color: var(--bookit-text-primary)`, `font-weight: 500`
- `.bookit-v2-deposit-row--total .bookit-v2-deposit-key`: `font-weight: 600`, `color: var(--bookit-text-primary)`, `font-size: 14px`
- `.bookit-v2-deposit-row--total .bookit-v2-deposit-val`: `font-size: 15px`, `font-weight: 700`

**22. Cancellation policy disclosure**
- `.bookit-v2-policy-disclosure`: `width: 100%`, `border: none`, `background: none`, `padding: 0`
- `.bookit-v2-policy-disclosure summary`: `display: flex`, `justify-content: space-between`, `align-items: center`, `font-size: 13px`, `color: var(--bookit-text-secondary)`, `cursor: pointer`, `list-style: none`, `padding: 8px 0`, `border-top: 1px solid var(--bookit-border)`, `user-select: none`
- `.bookit-v2-policy-disclosure summary::-webkit-details-marker`: `display: none`
- `.bookit-v2-policy-chevron`: `font-size: 11px`, `color: var(--bookit-text-muted)`, `transition: transform 0.2s ease`
- `.bookit-v2-policy-disclosure[open] .bookit-v2-policy-chevron`: `transform: rotate(180deg)`
- `.bookit-v2-policy-body`: `font-size: 13px`, `color: var(--bookit-text-secondary)`, `line-height: 1.6`, `padding: 8px 0 4px`

**23. Zone B — packages**
- `.bookit-v2-zone-b`: `padding: 1.25rem 1rem`, `border-bottom: 1px solid var(--bookit-border)`
- `.bookit-v2-zone-b--use-package`: `background: var(--bookit-primary-light)`
- `.bookit-v2-zone-b--buy-package`: `background: #fafaf9`
- `.bookit-v2-zone-b-intro`: `font-size: 13px`, `color: var(--bookit-text-secondary)`, `margin-bottom: 12px`, `line-height: 1.5`

**24. Zone C — payment rows**
- `.bookit-v2-zone-c`: `padding: 1.25rem 1rem`
- `.bookit-v2-payment-rows`: `display: flex`, `flex-direction: column`, `gap: 8px`
- `.bookit-v2-payment-row`: `display: flex`, `align-items: center`, `gap: 12px`, `background: var(--bookit-bg-card)`, `border: 1.5px solid var(--bookit-border)`, `border-radius: var(--bookit-border-radius)`, `padding: 14px`, `cursor: pointer`, transition
- `.bookit-v2-payment-row:hover`: `border-color: #d1d5db`
- `.bookit-v2-payment-row--selected`: `border-color: var(--bookit-primary)`, `background: var(--bookit-primary-light)`
- `.bookit-v2-payment-row--disabled`: `opacity: 0.4`, `pointer-events: none`
- `.bookit-v2-payment-row input[type="radio"]`: `width: 18px`, `height: 18px`, `flex-shrink: 0`, `accent-color: var(--bookit-primary)`, `cursor: pointer`
- `.bookit-v2-payment-label-group`: `flex: 1`
- `.bookit-v2-payment-label`: `font-size: 14px`, `font-weight: 600`, `color: var(--bookit-text-primary)`, `line-height: 1.3`
- `.bookit-v2-payment-row--selected .bookit-v2-payment-label`: `color: var(--bookit-primary)`
- `.bookit-v2-payment-sub`: `font-size: 12px`, `color: var(--bookit-text-secondary)`, `margin-top: 2px`
- `.bookit-v2-payment-logos`: `display: flex`, `gap: 4px`, `flex-shrink: 0`
- `.bookit-v2-logo-pill`: `font-size: 9px`, `font-weight: 700`, `padding: 3px 6px`, `border-radius: 4px`, `letter-spacing: 0.04em`, `color: #ffffff`
- `.bookit-v2-logo-pill--visa`: `background: #1a1f71`
- `.bookit-v2-logo-pill--mc`: `background: #eb001b`
- `.bookit-v2-logo-pill--paypal`: `background: #003087`

**25. Package radio rows (Zone B)**
- `.bookit-v2-package-row`: same base styles as `.bookit-v2-payment-row`; selected state: `border-color: var(--bookit-primary)`, `background: var(--bookit-primary-light)`
- `.bookit-v2-package-name`: `font-size: 14px`, `font-weight: 600`, `color: var(--bookit-text-primary)`
- `.bookit-v2-package-meta`: `font-size: 12px`, `color: var(--bookit-text-secondary)`, `margin-top: 2px`
- `.bookit-v2-package-saving`: `font-size: 12px`, `font-weight: 600`, `color: var(--bookit-primary)`
- `.bookit-v2-package-price`: `font-size: 14px`, `font-weight: 700`, `color: var(--bookit-text-primary)`, `flex-shrink: 0`

**26. Sticky footer**
- `.bookit-v2-sticky-footer`: `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `background: rgba(255,255,255,0.96)`, `backdrop-filter: blur(8px)`, `-webkit-backdrop-filter: blur(8px)`, `border-top: 1px solid var(--bookit-border)`, `padding: 1rem`, `z-index: 100`
- `.bookit-v2-footer-inner`: `max-width: var(--bookit-v2-max-width)`, `margin: 0 auto`, `display: flex`, `flex-direction: column`, `gap: 10px`
- `.bookit-v2-cta-btn`: `width: 100%`, `background: var(--bookit-btn-primary-bg)`, `color: var(--bookit-btn-primary-text)`, `border: none`, `border-radius: var(--bookit-btn-radius)`, `padding: 15px 24px`, `font-size: 15px`, `font-weight: 600`, `cursor: pointer`, `font-family: inherit`, `transition: background 0.15s ease`; hover: slightly darker (use `var(--bookit-primary-hover)`); disabled: `background: var(--bookit-border)`, `color: var(--bookit-text-muted)`, `cursor: not-allowed`
- `.bookit-v2-btn-back`: `background: none`, `border: none`, `color: var(--bookit-text-secondary)`, `font-size: 13px`, `cursor: pointer`, `padding: 2px`, `text-align: center`, `font-family: inherit`
- `.bookit-v2-btn-back--disabled`: `opacity: 0.4`, `cursor: default`, `pointer-events: none`

**27. Responsive — `@media (max-width: 500px)`**
- `.bookit-v2-step-label`: `font-size: 10px`
- `.bookit-v2-wizard-container`: reduce horizontal padding where applicable
- `.bookit-v2-slots-grid`: keep `repeat(3, 1fr)` — do not collapse to fewer columns
- Body/page bottom padding: `7rem` remains sufficient at mobile widths

---

### `public/templates/partials/booking-wizard-v2-progress.php` — MODIFY (replace stub)

Replace the stub with this full implementation. The `$current_step` variable is passed in via `Bookit_Template_Loader::get_template()` args from the shell template:

```php
<?php
/**
 * Booking Wizard V2 progress bar partial.
 *
 * @package    Bookit_Booking_System
 * @subpackage Bookit_Booking_System/public/templates
 *
 * @var int $current_step Current wizard step (1–5), passed from shell template.
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

$step_labels = array(
    1 => __( 'Service',      'bookit-booking-system' ),
    2 => __( 'Staff',        'bookit-booking-system' ),
    3 => __( 'Date & Time',  'bookit-booking-system' ),
    4 => __( 'Your Details', 'bookit-booking-system' ),
    5 => __( 'Payment',      'bookit-booking-system' ),
);
?>
<div class="bookit-v2-progress-wrap">
    <nav class="bookit-v2-progress" aria-label="<?php esc_attr_e( 'Booking progress', 'bookit-booking-system' ); ?>">
        <?php for ( $i = 1; $i <= 5; $i++ ) : ?>
            <?php
            if ( $i < $current_step ) {
                $item_class = 'bookit-v2-step-item bookit-v2-step-item--done';
                $aria_label = sprintf( __( 'Step %d: %s — completed', 'bookit-booking-system' ), $i, $step_labels[ $i ] );
            } elseif ( $i === $current_step ) {
                $item_class = 'bookit-v2-step-item bookit-v2-step-item--active';
                $aria_label = sprintf( __( 'Step %d: %s — current', 'bookit-booking-system' ), $i, $step_labels[ $i ] );
            } else {
                $item_class = 'bookit-v2-step-item bookit-v2-step-item--inactive';
                $aria_label = sprintf( __( 'Step %d: %s', 'bookit-booking-system' ), $i, $step_labels[ $i ] );
            }
            ?>
            <span class="<?php echo esc_attr( $item_class ); ?>" aria-label="<?php echo esc_attr( $aria_label ); ?>">
                <span class="bookit-v2-step-label" aria-hidden="true"><?php echo esc_html( $step_labels[ $i ] ); ?></span>
            </span>
        <?php endfor; ?>
    </nav>
</div>
```

---

## PHPUnit requirements

Baseline: 768 tests, 0 failures — must not regress.

No new tests required for this task — CSS and a PHP partial with no logic do not warrant unit tests. Confirm all 768 existing tests still pass.

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```

---

## Acceptance criteria

### Functional
- [ ] Progress bar renders with correct `--active`, `--done`, `--inactive` classes per step
- [ ] Active step label is in `var(--bookit-primary)` colour with accent underline
- [ ] Completed step labels are muted grey with faint accent underline
- [ ] Inactive step labels are muted grey with no underline
- [ ] Wizard container constrained to 680px max-width, centred
- [ ] Sticky footer visible at bottom of viewport on mobile (375px)
- [ ] Waiver block uses `--bookit-v2-waiver-*` tokens, no `--bookit-primary` anywhere in waiver selectors

### Technical
- [ ] All component selectors scoped inside `.bookit-v2-wizard-container` (except `:root`)
- [ ] No `--bookit-*` tokens (without `v2` infix) declared in the `:root` block
- [ ] All 12 `--bookit-v2-*` tokens present in `:root` block
- [ ] No CSS outside `.bookit-v2-wizard-container` scope except `:root` and `@media` blocks
- [ ] PHPUnit suite passes (768 tests, 0 failures)

### Must NOT break
- [ ] `public/assets/css/booking-wizard.css` is unchanged
- [ ] Existing v1 wizard visual appearance unchanged
- [ ] All 768 existing PHPUnit tests still pass

---

## Git commit message

```
Sprint Wizard-V2, Task 2: CSS implementation and progress bar partial

- Implement booking-wizard-v2.css with all 27 component sections
- Add --bookit-v2-* token block (12 tokens, no existing token redeclared)
- All selectors scoped inside .bookit-v2-wizard-container
- Waiver block uses fixed amber tokens, not --bookit-primary
- Sticky footer with backdrop-filter blur
- Replace progress bar partial stub with full aria-labelled implementation

Tests: 768 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.