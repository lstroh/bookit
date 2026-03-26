# Booking Wizard — UX Review

## Context
I am building a WordPress booking plugin called Bookit for UK service
businesses (salons, spas, therapists, photographers, coaches) with
1–10 staff. The plugin has a customer-facing booking wizard (PHP
templates) and a separate Vue 3 business dashboard.

The primary goal of the wizard is to help the customer book the service
they need and, where relevant, their preferred staff member — with as
little friction as possible. The wizard should guide rather than
overwhelm: each step should feel like a natural next question, not a
form to fill in.

A secondary future goal: the wizard may gain an optional upsell step
(suggesting a related or upgraded service, or an add-on). This step
does not exist yet, but recommendations should be compatible with its
eventual addition — for example, noting where in the flow it would
fit best and what constraints would apply.

---

## Current wizard structure (5 steps)

**Step 1 — Service selection**
Grid of services grouped by category. Each card shows name,
duration, price. Customer clicks to select and advance.

**Step 2 — Staff selection**
Staff cards with photo/initials, name, title, price. "No Preference"
option always appears last. Customer selects a staff member or No
Preference, then advances.

**Step 3 — Date & time selection**
Month calendar, then time slot grid for the selected date. Slots
grouped into Morning / Afternoon / Evening. Customer selects date
then time, then advances.

**Step 4 — Contact details**
Fields: first name, last name, email, phone, special requests,
marketing consent checkbox, cooling-off waiver checkbox (UK legal
requirement — cannot be removed).

**Step 5 — Payment**
Booking summary, cancellation policy text, payment method selection
(Stripe card / PayPal / Pay on Arrival). If a deposit applies, the
split is shown. Two additional optional sections:
- "Use one of your packages" — shown when the customer has active
  packages applicable to this service; displays each package with
  sessions remaining and expiry date as radio options
- "Buy a session package" — shown when packages are enabled and
  packages exist for this service; displays purchasable bundles
  as radio options
The three groups (payment methods / use package / buy package) are
mutually exclusive and JS-managed.

---

## What I want from this review

Please research current best practices and common patterns for
multi-step booking wizards, then review each step of the current
flow against those standards.

For each step cover:

**Step flow and order** — is the sequence logical? Should any steps
be combined, split, or reordered? Where in the flow would a future
optional upsell step fit best?

**Visual design and layout** — layout patterns, information hierarchy,
use of space, card vs list vs grid choices

**Mobile experience** — thumb-friendly targets, scroll behaviour,
sticky elements, one-column layout considerations

**Copy and microcopy** — labels, button text, placeholder text, error
messages, helper text; are they clear and action-oriented for a UK
audience?

**Payment step specifically** — this is the most complex step; what
are best practices for presenting deposit splits, package use/purchase
options, and payment method choice without overwhelming the customer?
The package sections add significant complexity — how should they be
presented so they feel like a benefit rather than a burden?

**Accessibility** — anything beyond what WCAG 2.1 AA requires that
would meaningfully improve the experience for all users

For each area provide:
- What the current approach does well
- Specific improvements with reasoning
- Relevant examples from well-regarded booking products (Calendly,
  Acuity, Fresha, Square Appointments) where applicable

---

## Three specific open questions to address

**Q1 — Single service:** If the business only has one service, should
Step 1 be skipped entirely (auto-selecting it and going straight to
Step 2), or shown with a single card as confirmation? What are the
UX trade-offs?

**Q2 — Single staff:** If the business only has one staff member,
should Step 2 be skipped entirely (auto-selecting them), or shown?
Same question: what are the trade-offs?

**Q3 — Hidden staff choice:** The business has multiple staff members
but does not want customers to choose — all bookings should go through
the "No Preference" algorithm. How should this be handled in the UX?
Options include: skip Step 2 entirely (auto-assign), show Step 2 but
hide individual staff names (show only "Book with our team"), or show
"No Preference" as the only option. What is the best approach and why?

---

## Constraints to respect

- **UK audience** — GBP, UK date formats (DD/MM/YYYY), UK phone
  format
- **Cooling-off waiver** — the checkbox on Step 4 is a legal
  requirement under UK Consumer Contracts Regulations 2013; it cannot
  be removed or hidden, but its presentation can be improved
- **PHP templates, not Vue** — the wizard renders as server-side PHP
  templates. UX changes are implemented as PHP/HTML/CSS/vanilla JS,
  not Vue components
- **Scoped CSS** — all classes are prefixed `bookit-` to avoid
  conflicts with theme styles; the theme override system (WooCommerce-
  style template overrides + CSS custom properties) is already built
  and in production from Sprint 4G
- **Email confirmation timing** — booking confirmation emails are
  now sent asynchronously via a background queue (not synchronously
  during the booking request), so the confirmation page no longer
  needs to wait for email delivery. This is relevant context for
  the Step 5 / confirmation page UX

---

## Files to read before making recommendations

Use the GitHub connector to read the following files before making
specific recommendations — so suggestions are grounded in what
actually exists:

- `public/templates/booking-step-1-services.php`
- `public/templates/booking-step-2-staff.php`
- `public/templates/booking-step-3-datetime.php`
- `public/templates/booking-step-4-contact.php`
- `public/templates/booking-step-5-payment.php`
- `public/assets/css/booking-wizard.css`
- `public/assets/js/booking-wizard.js`
- `public/assets/js/contact-form.js`

---

## What is already built — do not re-commission

The theme override architecture from the original prompt is complete:
- CSS custom properties (`--bookit-*` tokens) are defined in
  `booking-wizard.css`
- `Bookit_Template_Loader` class provides WooCommerce-style template
  overrides (`{theme}/bookit/` directory)
- All step templates are loaded through the template loader

The UX review should note where CSS or template changes would be
needed to implement recommendations, but does not need to redesign
the override system itself.

---

## Output format

Please work through the review step by step. For each of the five
wizard steps, produce a short structured section with the sub-headings
above. At the end, address the three open questions directly with a
clear recommendation for each.

Use web search to check current best practices before writing
recommendations — particularly for multi-step booking UX, payment
step design, and mobile booking flows.