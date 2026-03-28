Reuse the exact same wizard chrome from Steps 1–3: same progress bar (5 labelled steps — "Service", "Staff", "Date & Time", "Your Details", "Payment" — now with "Your Details" as the active step, "Service", "Staff" and "Date & Time" marked as completed with a faint underline). Same sticky footer (full-width "Continue" button in accent colour, "Back" text link above it). Max-width 680px, centred, mobile-first, 375px viewport.
This is Step 4: Your Details.
At the top, below the progress bar, show a slim confirmation banner showing all previous selections: "Swedish Massage · 60 min · Elena Torres · Wed 15 Apr, 11:00" with a small "Change" text link on the right. If the text wraps to two lines on mobile that is acceptable — do not truncate.
Below the banner: heading "Your details" and subheading "Almost there — just a few details to confirm your booking."
Below that: a single-column form with the following fields in this exact order:

First name (text input, required, autocomplete="given-name")
Last name (text input, required, autocomplete="family-name")
Email address (email input, required, autocomplete="email") — show this field in an error state: red border, red error message below reading "Please enter a valid email address"
Phone number (tel input, required, autocomplete="tel", placeholder "07700 900000")
A collapsed "Add special requests" text link — tapping it would reveal a textarea, but show it collapsed in this mockup
Marketing consent checkbox (optional): label reads "Keep me updated with offers and news" — unchecked by default, small muted helper text below: "You can unsubscribe at any time."
Cooling-off waiver block (required, shown because booking is within 14 days): visually distinct from the rest of the form — give it a warm amber/yellow tinted background (light, not strong), a left border accent in amber, and slightly more padding. Inside: a small bold heading "Important: Right to Cancel", then a short paragraph of plain English explanation: "Your appointment is within 14 days. By ticking this box you're asking us to confirm your booking immediately and acknowledge you'll lose your right to cancel once the service begins." Below that: a required checkbox with label "I understand and agree to waive my cancellation right." Show this checkbox as unchecked.

All form inputs: single column, full width, rounded corners, light grey border, generous padding. Labels above each field in small dark grey text. Required fields have no asterisk — rely on context. Error messages appear below the relevant field in small red text.
Monochromatic palette — white, light greys, dark grey text, one accent colour (same teal/green as Steps 1–3) — except the waiver block which uses a warm amber tint. No icons. Mobile viewport (375px wide).

Please generate this as a single self-contained HTML file with all CSS inline or in a <style> block. No external dependencies. I want to open it in a browser at 375px width to use as a visual reference.