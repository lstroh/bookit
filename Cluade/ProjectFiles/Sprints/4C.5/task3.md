Perfect. 10 new tests added (561 → 571), all passing.

---

**SPRINT 4C.5 PROGRESS TRACKER**

| Task | Status | Est | Actual |
|------|--------|-----|--------|
| Task 1: Bulk Booking Actions | ✅ Complete | ~6h | — |
| Task 2: GDPR Data Portability Export | ✅ Complete | ~8h | — |
| Task 3: Contextual Help Tooltips | 🔄 In progress | ~6h | — |

**PHPUnit:** 571 tests, 1821 assertions, 0 failures
**Sprint status:** Task 3 in progress

---

Here is the Task 3 Cursor prompt.

---

```
# CURSOR IMPLEMENTATION PROMPT
## Sprint 4C.5 — Task 3: Contextual Help Tooltips
## Bookit Booking System | Branch: Phase1

---

## MANDATORY READS — DO THESE FIRST

Read these files completely before writing any code:

1. `bookit-booking-system/dashboard/src/components/`
   — scan ALL component files for any existing tooltip component,
   directive, or composable. Search for: "tooltip", "Tooltip",
   "v-tooltip", "useTooltip", "HelpIcon", "InfoIcon". If anything
   exists, you MUST extend it rather than create something new.

2. `bookit-booking-system/dashboard/src/views/Settings.vue`
   (or the settings area components — check the actual file
   structure) — read the cancellation policy fields, deposit
   settings fields, payment gateway fields, and branding settings.
   You need to understand the exact label/input structure before
   adding tooltip triggers.

3. `bookit-booking-system/dashboard/src/views/Bookings.vue`
   — find the status badge rendering and booking reference display.

4. `bookit-booking-system/dashboard/src/views/Staff.vue` (or
   equivalent) — find split shift config and buffer time fields
   on the working hours / service settings views.

5. `bookit-booking-system/dashboard/src/main.js` (or app entry
   point) — check how global components and directives are
   registered; follow the same pattern for any new global
   registration.

6. `bookit-booking-system/dashboard/package.json`
   — check what packages are already installed. If Floating UI
   (@floating-ui/vue) or Tippy.js is already present, use it.
   If not, implement a lightweight custom component — do NOT
   add a new npm dependency without confirming it is needed.

---

## DECISION: EXTEND OR CREATE

After reading the components directory:

- IF a tooltip component or infrastructure already exists →
  extend it to cover all the targets listed below. Do not
  create a parallel system.

- IF nothing exists → create a single lightweight
  `BookitTooltip.vue` component (spec below). Do not install
  any new npm packages.

---

## IF CREATING A NEW COMPONENT: BookitTooltip.vue

Create at:
`bookit-booking-system/dashboard/src/components/BookitTooltip.vue`

### Props
```js
props: {
  content: { type: String, required: true },
  position: { type: String, default: 'top' }
  // position: 'top' | 'bottom' | 'left' | 'right'
}
```

### Trigger element
A small `?` button rendered inline next to the label:
```html
<button
  type="button"
  class="bookit-tooltip-trigger"
  aria-label="Help"
  @mouseenter="show"
  @mouseleave="hide"
  @focus="show"
  @blur="hide"
  @keydown.escape="hide"
>
  ?
</button>
```

### Tooltip panel
- Rendered via `<Teleport to="body">` so it is never clipped
  by modal or sidebar overflow:hidden boundaries
- Positioned using JavaScript (getBoundingClientRect) relative
  to the trigger button — recalculate on show
- z-index high enough to appear above modals (use z-50 or
  higher, check what z-index modals use in the existing code)
- Does NOT disappear when the user moves their mouse from the
  trigger onto the tooltip panel itself — attach mouseenter/
  mouseleave to the panel as well

### Accessibility (WCAG 2.1 AA required)
- Trigger button is keyboard focusable (it is a <button> so
  this is automatic)
- Tooltip shows on focus AND hover
- Escape key dismisses the tooltip (keydown.escape on trigger)
- Tooltip panel has role="tooltip" and the trigger has
  aria-describedby pointing to the tooltip panel's id
- Tooltip text has sufficient contrast — use existing dark
  background utility classes from the rest of the app

### Styling
Use only Tailwind utility classes already used elsewhere in
the app. Do not write custom CSS. The tooltip panel should
look consistent with other UI elements (dark background,
white text, small rounded corners, small shadow).

### Register globally
In main.js (or wherever global components are registered),
register BookitTooltip globally so it can be used as
<BookitTooltip> in any view without importing.

---

## WHERE TO ADD TOOLTIPS

Add a <BookitTooltip> (or equivalent) adjacent to the label
of each field listed below. Place it immediately after the
label text, before the input.

Read the actual component structure before placing — do not
guess at the HTML structure.

### Settings — Cancellation Policy section
- **Cancellation window** — "The number of hours before an
  appointment during which customers can cancel. Cancellations
  after this window follow the refund policy below."
- **Full refund threshold** — "Cancellations made this many
  hours or more before the appointment receive a full refund."
- **Partial refund percentage** — "The percentage of the
  booking total refunded for cancellations within the
  cancellation window but before the no-refund threshold."
- **No-show policy** — "Applied when a customer does not
  attend their appointment without cancelling. Choose whether
  to retain the full amount or apply a partial charge."

### Settings — Deposit Settings section
- **Default deposit type** — "Whether deposits are calculated
  as a fixed amount or a percentage of the service price."
- **Minimum deposit amount** — "The lowest deposit amount
  that can be required, regardless of percentage calculation."
- **Refund deposit on cancellation** — "Controls whether the
  deposit is returned if a customer cancels within the
  allowed cancellation window."

### Settings — Payment Gateway section
- **Test mode toggle** — "When enabled, no real payments are
  processed. Use test card numbers to simulate transactions.
  Disable before going live."
- **Publishable key** — "Your Stripe publishable key. Safe
  to expose in frontend code. Starts with pk_test_ or pk_live_."
- **Secret key** — "Your Stripe secret key. Never share this.
  Keep it server-side only. Starts with sk_test_ or sk_live_."

### Settings — Branding section
- **Powered-by toggle** — "Shows or hides the 'Powered by
  Bookit' attribution in the customer-facing booking widget."
- **Primary colour** — "Sets the main accent colour used in
  buttons and highlights throughout the booking widget."

### Bookings list
- **Status badges** — add a single tooltip on the status
  column header (not each individual badge) explaining what
  each status means:
  "Pending: awaiting confirmation. Confirmed: appointment
  set. Completed: attended. Cancelled: booking cancelled.
  No-show: customer did not attend."
- **Booking reference column header** — "Unique booking
  identifier in format BK[YYMM]-XXXX. Use this to look up
  or reference a specific appointment."

### Staff / Working hours
- **Split shift** — "Allows a staff member to work two
  separate blocks in one day, e.g. 9am–1pm and 3pm–6pm,
  with a gap in between."
- **Buffer time (on service settings)** — "Adds padding
  before and/or after each appointment of this service.
  Useful for setup, cleanup, or travel time."

---

## NO PHPUNIT TESTS NEEDED

Tooltips are purely frontend. No backend changes, no PHP.

Manual testing checklist (verify each before committing):

- [ ] All tooltip targets listed above show a tooltip on hover
- [ ] All tooltips show on keyboard focus (Tab to the ? button)
- [ ] Escape key dismisses the tooltip
- [ ] Tooltip does not disappear when mouse moves from trigger
      onto the tooltip panel
- [ ] Tooltip is not clipped inside the Settings modals or
      sidebar panels — it appears above all other elements
- [ ] Tooltip is visible on the Bookings list view
- [ ] No JavaScript console errors
- [ ] Tooltip contrast is readable (dark bg / white text or
      equivalent)

---

## ACCEPTANCE CRITERIA

- [ ] Single tooltip component/system — no parallel
      implementations
- [ ] All targeted fields have working tooltips
- [ ] Keyboard accessible (focus shows tooltip, Escape hides)
- [ ] Not clipped by modals or sidebars (Teleport to body)
- [ ] No new npm packages added (unless already in package.json)
- [ ] No PHP changes
- [ ] No existing tests broken (run full suite to confirm)
- [ ] `npm run build` completes without errors
- [ ] Committed with message:
      "Sprint 4C.5, Task 3: Contextual help tooltips"

---

## THINGS TO WATCH OUT FOR

- Teleport to body is essential. Without it, tooltips inside
  modals with overflow:hidden will be clipped. Do not skip this.

- The ? trigger must be a <button type="button"> not a <span>
  or <div> — keyboard focusability requires a native interactive
  element.

- Do not use v-html for tooltip content — all tooltip strings
  are plain text passed as props.

- After adding tooltips to many components, run npm run build
  to confirm no import errors or missing component registrations.

- The Bookings list status tooltip goes on the column header,
  not on every individual badge — one tooltip explaining all
  statuses is cleaner than 50 identical badges each with a
  tooltip.
```

---

When Task 3 is complete, come back with:
- PHPUnit count (should still be 571 — no new PHP tests for this task)
- Confirmation that the manual checklist above has been worked through
- Any decisions Cursor made that weren't covered above

After that we can do the sprint completion check and hand back to the Project Assistant.