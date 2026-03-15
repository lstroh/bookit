# Booking Wizard — UX Review & Theme Override Architecture

## Context
I am building a WordPress booking plugin called Bookit for UK service
businesses (salons, spas, therapists, photographers, coaches) with
1–10 staff. The plugin has a customer-facing booking wizard and a
separate Vue 3 business dashboard. I want to:

1. Review and improve the booking wizard UX across all dimensions
2. Design a theme override system so client WordPress themes can
   customise the wizard's appearance

Please work through these two areas in order — UX review first,
theme override architecture second.

---

## PART 1: UX REVIEW

### Current wizard structure (5 steps)
- Step 1: Service selection — grid of services grouped by category,
  name, duration, price
- Step 2: Staff selection — staff cards with photo/initials, name,
  title, price; "No Preference" option always last
- Step 3: Date & time selection — date picker, then time slot grid
  for the selected date
- Step 4: Contact details — first name, last name, email, phone,
  special requests, marketing consent checkbox, cooling-off waiver
  checkbox (UK legal requirement)
- Step 5: Payment — booking summary, cancellation policy text,
  payment method selection (Stripe card / PayPal / Pay on Arrival),
  deposit split display if applicable, "Use a Package" option if
  customer has active packages, "Buy a Package" option if packages
  are enabled

### What I want from the UX review
Please research current best practices and common patterns for
multi-step booking wizards, then review each step of our current
flow against those standards. For each step cover:

- Step flow and order — is the sequence logical? Should any steps
  be combined, split, or reordered?
- Visual design and layout — layout patterns, information hierarchy,
  use of space, card vs list vs grid choices
- Mobile experience — thumb-friendly targets, scroll behaviour,
  sticky elements, one-column vs two-column decisions
- Copy and microcopy — labels, button text, placeholder text,
  error messages, helper text; are they clear and action-oriented?
- Payment step specifically — this is the most complex step; what
  are best practices for presenting deposit splits, package options,
  and payment method choice without overwhelming the customer?
- Accessibility — anything beyond what WCAG 2.1 AA requires that
  would meaningfully improve the experience for all users

For each area, provide:
- What the current approach does well
- Specific improvements with reasoning
- Any research or examples from well-regarded booking products
  (Calendly, Acuity, Fresha, Square Appointments) that are relevant

Use web search to find current best practices and recent UX research
on multi-step booking flows before making recommendations.

### Constraints to respect
- UK audience — GBP, UK date formats (DD/MM/YYYY), UK phone format
- The cooling-off waiver checkbox on Step 4 is a legal requirement
  (UK Consumer Contracts Regulations 2013) — it cannot be removed
  or hidden, but its presentation can be improved
- The wizard is rendered as PHP templates, not a Vue app — changes
  are to PHP/HTML/CSS, not Vue components
- The plugin uses its own scoped CSS classes (prefixed bookit-)
  so it does not conflict with theme styles

---

## PART 2: THEME OVERRIDE ARCHITECTURE

After the UX review is complete, help me design a theme override
system that allows client WordPress themes to customise the booking
wizard. The system should support both levels:

**Level 1 — CSS custom properties (variables)**
Client themes can override visual properties without touching
templates: colours, fonts, border radius, spacing, button styles.
The plugin defines sensible defaults; themes override via their
own stylesheet.

**Level 2 — Template overrides (like WooCommerce)**
Client themes can place override template files in their theme
folder to replace individual step templates entirely.
Pattern: `{theme}/bookit/booking-step-{n}.php` overrides
`{plugin}/public/templates/booking-step-{n}.php`

For the theme override architecture, cover:
- The template loader pattern (how WordPress theme overrides work,
  how WooCommerce implements it, what Bookit should copy)
- Which CSS custom properties to expose (full list with sensible
  defaults)
- How to document the override system for clients/developers
- Any gotchas or risks (e.g. template versioning when the plugin
  updates)
- What the five theme integration features look like as concrete
  development tasks with hour estimates:
  1. Template override system
  2. Dashboard serving handler
  3. White-label settings storage (already partially built)
  4. Branding helper functions
  5. Consistent CSS class standards

---

## Files available in project knowledge
The full plugin codebase is accessible — use GitHub connector to
read any specific files before making recommendations. Key files
for this session:
- `public/templates/booking-step-1-services.php`
- `public/templates/booking-step-2-staff.php`
- `public/templates/booking-step-3-datetime.php`
- `public/templates/booking-step-4-contact.php`
- `public/templates/booking-step-5-payment.php`
- `public/assets/css/` — wizard stylesheets
- `public/class-shortcodes.php` — shortcode handler
- `public/class-bookit-public.php` — public asset enqueuing

Please read the relevant template files before making specific
recommendations so your suggestions are grounded in what actually
exists rather than assumptions.

Start with Part 1 — the UX review. Begin by searching for current
best practices on multi-step booking wizard UX, then work through
each step of the current wizard with specific recommendations.