Good point — no, you don't need to regenerate everything from scratch. The progress bar is locked. The sticky footer (Continue + Back) is locked. The global decisions (680px, mobile-first, accent colour, border-highlight selected state) are all locked.

The only new components in Step 2 are:

- **Staff card** — avatar circle, name, title, price, one-liner bio with expand
- **"Any available team member" card** — visually distinct, always last
- **Greyed-out unavailable staff card** — same card, muted state
- **Layout switch** — 2-column grid for few staff, compact list for many

So the prompt should tell the tools to **reuse the Step 1 chrome** (progress bar at step 2, same footer) and focus effort on the new card components.

---

## Step 2 prompt — ready to paste

> Reuse the exact same wizard chrome from Step 1: same progress bar (5 labelled steps — "Service", "Staff", "Date & Time", "Your Details", "Payment" — now with "Staff" as the active step, underlined in accent colour), same sticky footer (full-width "Continue" button in accent colour, "Back" text link above it). Max-width 680px, centred, mobile-first, 375px viewport.
>
> This is Step 2: Staff Selection. Below the progress bar show the heading "Who would you like?" and subheading "Choose a team member for your appointment."
>
> Show a slim confirmation banner directly below the heading — a light grey pill or row showing the previously selected service: "Swedish Massage · 60 min" with a small "Change" text link on the right in muted grey.
>
> Below that, show two layout variants stacked vertically, separated by a section label:
>
> **Few staff (2-column grid):** Three staff cards in a 2-column grid (one card spans full width at the end if odd number). Each card contains: a circular avatar (initials "ET" on a coloured background, deterministic — each staff member always gets the same colour), name in bold, job title in muted grey, price (e.g. "£45"), and a one-line bio in small muted text (e.g. "Specialist in balayage and colour correction") with a small "Read more" link that expands inline. Selected state: accent colour border + subtle background tint. One card shown in selected state.
>
> **Many staff (compact list):** Six staff members in a single-column list layout. Each row contains: small avatar circle (32px) on the left, name + title stacked in the middle, price on the right. Same selected state (accent border + tint). More space-efficient for long lists.
>
> Below both layouts, always as the last item: an "Any available team member" card. Full width. Slightly different visual treatment — light background, softer border, no avatar. Text: "Any available team member" in bold, "We'll match you with the first available" in muted grey beneath. Same selected state as staff cards.
>
> Also show one greyed-out unavailable staff card (muted text, muted border, "No availability this month" label, not selectable).
>
> Monochromatic palette — white, light greys, dark grey text, one accent colour (same teal/green as Step 1). No icons except avatar initials. Mobile viewport (375px wide).

---

For Claude specifically, add:

> **"Please generate this as a single self-contained HTML file with all CSS inline or in a `<style>` block. No external dependencies. I want to open it in a browser at 375px width to use as a visual reference."**

Ready to run it through the tools?