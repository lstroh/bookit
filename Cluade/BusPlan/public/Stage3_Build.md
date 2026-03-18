# Stage 3 — Build
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.0
**Date:** March 2026
**Status:** Active Reference
**Applies To:** Every client build from brief confirmed to final approval

---

## Stage 3 Overview

Stage 3 is where you build the site. It starts the moment the Project Brief is confirmed and Invoice 1 is paid, and ends when the client gives final written approval and Invoice 2 is paid. Nothing goes live until both conditions are met.

This stage has one non-negotiable rule: **always build on staging first.** The client never sees a half-finished site. The client never interacts with a live system until launch day. Everything happens on staging — the build, the QA, the revisions — and the live site is a single clean migration at the end.

| Field | Detail |
|---|---|
| **Trigger** | Project Brief confirmed, Invoice 1 paid |
| **Goal** | Fully functional staging site reviewed, revised, and approved in writing by client |
| **Duration** | Typically 2–4 weeks |
| **Tools** | Local by Flywheel / WP Staging, Wordfence, Bonsai, Google Drive |
| **Outcome** | Written client approval received, Invoice 2 paid — Stage 4 (Launch) begins |

---

## Steps at a Glance

| Step | What Happens |
|---|---|
| **3.1 Staging Setup** | Create staging environment, install WordPress and plugin |
| **3.2 Plugin Configuration** | Services, staff, booking rules, payments, email, calendar sync |
| **3.3 Website Build** | Standard page set built to brief |
| **3.4 Internal QA** | Full testing checklist before client sees anything |
| **3.5 Design Review** | Screencast sent to client with staging link and login |
| **3.6 Invoice 2** | 40% raised on design delivery — not on client approval |
| **3.7 Revision Rounds** | Unlimited rounds within scope until client is satisfied |
| **3.8 Final Approval** | Written sign-off by email — saved to Google Drive |

---

## Step 3.1 — Staging Environment Setup

### What to Do

Before writing a single line of code or uploading a single image, the staging environment needs to be ready.

**Option A — Local by Flywheel (recommended for new builds)**
Use Local by Flywheel on your machine for the initial build. Fast, reliable, and free. Once the build is complete and approved, migrate to the live hosting environment.

**Option B — WP Staging on live server**
If the client has an existing WordPress site you are replacing, install WP Staging on their current server to create a subdomain staging environment (e.g. staging.clientdomain.co.uk).

### Setup Steps

1. Create a new local site in Local by Flywheel — name it `[businessname]-staging`
2. Install WordPress (latest version)
3. Install and activate the Wimbledon Smart Plugin
4. Install and activate Wordfence — run initial setup wizard
5. Install any theme or page builder required
6. Set WordPress to discourage search engines (Settings → Reading → discourage search engine indexing) — important on staging to prevent Google indexing a half-built site
7. Create a note in the Project Brief with the local URL and admin credentials

### What Not to Do

- Do not build directly on a live site
- Do not give the client access to staging until Step 3.5
- Do not install plugins you don't need — every extra plugin is a potential maintenance burden

---

## Step 3.2 — Plugin Configuration

**Source of truth: the Project Brief from Stage 2**

Open the Project Brief and work through each section in order. Do not rely on memory or go back to the intake questionnaire — the Project Brief should contain everything you need in one place.

### Services Configuration

For each service listed in the Project Brief:

- Service name (exactly as the client provided — check spelling)
- Description (brief, for the booking widget and services page)
- Duration in minutes
- Price (£)
- Assigned staff members
- Deposit rules — fixed amount or percentage, if applicable
- Any booking restrictions (e.g. new customers only, requires consultation first)
- Buffer time after the service (if not already covered by staff buffer)

**Test each service** after adding it — confirm it appears in the booking widget with the correct duration, price, and staff assignment.

### Staff Configuration

For each staff member listed in the Project Brief:

- Full name and display name
- Role/title (for customer-facing display)
- Profile photo (resize to consistent dimensions — e.g. 400×400px — before uploading)
- Working days and hours (set exactly as provided — double-check for any irregular patterns)
- Lunch breaks and regular blocks (add as recurring unavailability)
- Buffer time between appointments
- Assigned services
- Google Calendar email address (note: sync is tested in Step 3.4, requires client to grant access)

### Booking Rules

Set each of the following according to the Project Brief:

- **Advance booking window** — how far ahead customers can book (e.g. up to 8 weeks)
- **Minimum notice** — minimum time before an appointment can be booked (e.g. 24 hours)
- **Online cancellation** — enabled/disabled; if enabled, minimum hours before appointment
- **Online rescheduling** — enabled/disabled; if enabled, minimum hours before appointment
- **Cancellation policy** — whether deposit is forfeited on late cancellation, and the threshold
- **Booking approval** — immediate confirmation or manual approval required

### Payment Gateway

Connect Stripe in **test mode first** — do not switch to live until the pre-launch checklist in Stage 4.

- Add Stripe test API keys
- Test a deposit payment end-to-end: make a booking with a test card, confirm the deposit appears in Stripe test dashboard, confirm the confirmation email fires
- Test a full payment end-to-end if applicable
- Add PayPal in test mode if the client requested it

**Stripe test card numbers:**
- Successful payment: 4242 4242 4242 4242
- Card declined: 4000 0000 0000 0002
- 3D Secure required: 4000 0025 0000 3155

### Email Notifications

Configure via Brevo SMTP. For staging, use your own Wimbledon Smart sender domain — the client's domain is verified and switched in Stage 4.

Set up and test the following notification emails:

| Notification | Recipients | Trigger |
|---|---|---|
| Booking confirmation | Customer | New booking confirmed |
| Booking notification | Business owner | New booking received |
| Staff notification | Assigned staff member | New booking assigned to them |
| Reminder | Customer | 24 hours before appointment |
| Cancellation confirmation | Customer | Booking cancelled |
| Cancellation notification | Business owner | Booking cancelled |
| Reschedule confirmation | Customer | Booking rescheduled |

Apply client branding to all templates:
- Client logo in header
- Client name in sender name field
- Client colours in template styling
- Client contact details in footer
- Reply-to set to client's business email address

### Dashboard Branding

- Upload client logo to dashboard header
- Apply primary and secondary brand colours
- Confirm "Powered by Wimbledon Smart" appears in dashboard footer only — not on customer-facing booking pages and not in customer emails

### Google Calendar Sync

Note in the Project Brief that Google Calendar sync requires the client (and each staff member) to grant calendar access after the site goes live. This cannot be fully tested on staging without live Google accounts. Flag this as a Step 4 action.

---

## Step 3.3 — Website Build

### Standard Page Set

Every Professional Plan site includes these seven pages as standard:

| Page | What Goes on It |
|---|---|
| **Home** | Hero section (headline, subheadline, CTA button to book), key benefits (3), social proof (Google reviews or testimonials), secondary CTA section |
| **About** | Business story (2–3 paragraphs), team photos and bios, values or approach |
| **Services** | All services listed with name, brief description, duration, price, and individual "Book Now" CTA per service |
| **Booking** | Embedded full booking widget (the complete customer-facing booking flow) |
| **Contact** | Address, phone, email, embedded map, contact form |
| **Privacy Policy** | GDPR-compliant — generate using the client's business details; have client review before launch |
| **Terms & Conditions** | Booking terms, cancellation policy, payment terms — derived from contract and Project Brief |

Additional pages are added if scoped during discovery and noted in the Project Brief.

### Build Order

Work in this order to avoid rework:

1. Install and configure theme / page builder
2. Set up global styles — fonts, colours, button styles — matching brand guidelines
3. Build the Services page first — it is the most content-heavy and confirms all services are correctly configured
4. Build the Booking page — embed the booking widget and test it immediately
5. Build the Home page — hero, benefits, social proof, CTA
6. Build the About page — team photos, bios, business story
7. Build the Contact page — form, map embed, contact details
8. Generate and add Privacy Policy and T&Cs
9. Set up header navigation and footer
10. Mobile and cross-browser check as you go — not just at the end

### Content Notes

**Copy editing:** Take what the client provided in the questionnaire and edit it for clarity, consistency, and professionalism. Do not publish rough notes verbatim. Do not rewrite entirely in a style that doesn't sound like them — find the balance.

**Photos:** Resize and compress all images before uploading. Large uncompressed images are the single most common cause of slow-loading sites. Target under 200KB per image where possible without visible quality loss. Use a tool like Squoosh or Imagify.

**Placeholder content:** If the client has not provided a photo or piece of copy for a specific section, use a clearly labelled placeholder (e.g. "[PHOTO — awaiting client]") rather than leaving the section blank or using something random. This makes the design review much easier for the client to navigate.

**Testimonials:** If the client has Google reviews, screenshot the best 3–5 and use them as social proof on the Home page and/or Services page. Always attribute accurately.

### SEO Basics

For every page, set:
- Page title (descriptive, includes business name and location where relevant)
- Meta description (1–2 sentences, written to be clicked — not stuffed with keywords)
- H1 heading (one per page, clear and descriptive)
- Alt text on all images

This is the minimum viable SEO setup. It is not a full SEO engagement — that is out of scope — but these basics ensure the site is indexable and not actively harming the client in search.

---

## Step 3.4 — Internal QA Checklist

**Complete this checklist before the client sees anything.** Never send a staging link with broken flows, obvious errors, or untested functionality. One bad first impression at design review costs you hours of trust repair in revision rounds.

Test on:
- Desktop (Chrome, Safari, Firefox)
- Mobile iOS (Safari)
- Mobile Android (Chrome)

### Booking Flow

- [ ] Customer can browse and select a service on the Services page
- [ ] Customer can select a staff member or "any available"
- [ ] Calendar shows correct availability based on working hours, buffer times, and existing blocks
- [ ] Date and time selection works correctly in all tested browsers
- [ ] Deposit or full payment collected correctly in test mode — Stripe test card works
- [ ] Booking confirmation email sent to customer — correct content, branding, sender name, no broken links
- [ ] Booking notification email sent to business owner — correct content
- [ ] Booking notification email sent to assigned staff member — correct content
- [ ] Booking appears correctly in business dashboard
- [ ] Booking appears correctly in staff member's dashboard view
- [ ] Cancellation via magic link in confirmation email works correctly
- [ ] Rescheduling via magic link in confirmation email works correctly
- [ ] Reminder email configured — verify timing setting is correct (cannot fully test without waiting)
- [ ] Dashboard branding correct — logo, colours, "Powered by Wimbledon Smart" in footer only

### Website

- [ ] All seven standard pages load correctly — no blank sections, no PHP errors
- [ ] All additional scoped pages load correctly
- [ ] All internal navigation links work — header, footer, in-page CTAs
- [ ] No broken external links
- [ ] Mobile responsive on iOS and Android — all sections stack correctly, no overflow
- [ ] Contact form submits successfully — notification email received
- [ ] All images load — no broken image icons
- [ ] Images optimised — no page takes more than 3 seconds to load on a standard connection
- [ ] Privacy Policy is present and accurate (business name, contact details, data retention period)
- [ ] Terms and Conditions are present and accurate
- [ ] GDPR consent checkbox present on booking form — customer cannot complete booking without ticking
- [ ] Cookie notice present on website
- [ ] Wordfence active and showing no critical alerts
- [ ] Lighthouse performance score ≥ 90 (run via Chrome DevTools)

### Content

- [ ] No placeholder text remaining — all [BRACKETS] resolved or flagged for client
- [ ] No Lorem Ipsum text anywhere
- [ ] Spelling and grammar checked on all pages
- [ ] All prices and service durations match the Project Brief exactly
- [ ] Staff names and roles correct
- [ ] Contact details correct throughout — header, footer, contact page, email templates
- [ ] Business address correct
- [ ] Social media links work and go to the correct accounts

### Dashboard and Admin

- [ ] Business owner login works — correct permissions (can see all bookings, all staff, reports)
- [ ] Staff member login works — correct permissions (can see only their own bookings)
- [ ] Test booking visible in both dashboard views
- [ ] Block time function works correctly
- [ ] Manual booking entry by business owner works correctly

---

## Step 3.5 — Design Review to Client

### What to Send

Once the internal QA checklist is fully ticked, prepare the design review package:

**1. Screencast recording (10–15 minutes)**
Record a walkthrough of the full site and dashboard using Loom, QuickTime, or any screen recording tool. Cover:
- Customer booking flow end-to-end (as if you are a customer)
- All website pages in order
- Business owner dashboard — bookings, calendar, adding a service, blocking time
- One staff member dashboard view

Keep the tone warm and conversational — you are showing them something you built for them, not delivering a presentation. Point out things you think they will be pleased with.

**2. Staging link**
Include the full URL to the staging site so they can click through it themselves.

**3. Dashboard login credentials**
Business owner username and temporary password. Remind them to change the password after logging in.

**4. Clear instructions**

> *"Take your time reviewing — there's no rush. When you're ready, reply to this email with any changes you'd like. Please try to compile all your feedback into one reply if possible, so I can action everything in one round. If I don't hear back within 3 working days I'll send a follow-up."*

### Design Review Email Template

> **Subject:** Your site is ready to review — [Business Name]

> Hi [First Name],
>
> Your site is ready for your first look. I'm really pleased with how it's come together.
>
> **Watch the walkthrough first:** [Loom/recording link]
> This is a 12-minute video walking you through the full site and your dashboard. Worth watching before you click around yourself — it'll make more sense that way.
>
> **Then explore it yourself:** [Staging URL]
>
> **Your dashboard login:**
> URL: [staging URL]/dashboard
> Username: [username]
> Password: [temporary password]
> (Please change the password after your first login — Settings → My Account)
>
> **What to do next:**
> Reply to this email with any changes you'd like — a list is fine, as much detail as you can. Please try to send all your feedback in one go so I can action everything together.
>
> If anything is unclear or you'd find it helpful to talk through any section, just reply and we can jump on a quick call.
>
> Looking forward to your thoughts.
>
> Liron

---

## Step 3.6 — Raise Invoice 2 (40%)

Send Invoice 2 **at the same time** as the design review email. Invoice 2 is triggered by design delivery — not by client approval.

| Pricing Option | Setup Fee | Invoice 2 (40%) |
|---|---|---|
| Standard monthly | £995 | £398 |
| Standard annual | £995 | £398 |
| Introductory (first 2 clients) | £495 | £198 |

Add a note to the invoice:

> *"Milestone 2 — design review delivered. Thank you."*

Payment due within 5 working days. If payment is not received by the time the client approves the site and is ready to go live, pause Stage 4 until it is cleared. Do not go live with an outstanding invoice.

---

## Step 3.7 — Revision Rounds

### The Rule

Revisions are **unlimited within the original agreed scope**. Any new features, additional pages, or significant changes that were not in the original proposal are quoted separately before work begins.

If a client requests something out of scope, respond promptly and clearly:

> *"Happy to add that. It's outside the original scope, so I'd quote it separately — probably [£X / a few hours of work]. Want me to put a quick quote together, or shall we keep the current scope for now and add it as a follow-on?"*

Never do out-of-scope work without agreement. Never agree to out-of-scope work without a written confirmation (email is fine).

### How to Handle Feedback

**Ask for consolidated feedback:**
> *"To keep things moving efficiently, please compile all your feedback into one reply if possible. I'll action everything in one round and send you an updated link."*

If the client sends feedback in dribs and drabs across multiple messages — a common pattern — acknowledge each message but implement all changes at once at the end of the feedback thread:

> *"Got it — I'll add this to the list and implement everything together once you've had a chance to review the full site."*

**Implement on staging, not live.** All revisions go to the staging site. When the round is complete, send the updated staging link.

**Log all revisions** in a simple Revision Log saved to Google Drive: `[Business Name]/Build/Revision_Log.md`

```
REVISION LOG — [Business Name]

Round 1 — [date received]
- [Change 1]
- [Change 2]
- [Change 3]
Implemented: [date]
Staging link sent: [date]

Round 2 — [date received]
- [Change 1]
Implemented: [date]
Staging link sent: [date]
```

This log protects you if there is ever a dispute about what was agreed, and it is a useful reference when building future sites.

### Common Revision Requests and How to Handle Them

**"Can we change the colours?"**
Fine — within scope. Ask for the specific hex codes if not already in the brand guidelines.

**"Can we add another page?"**
If it is a simple informational page (e.g. a FAQ page, a gallery page), use your judgement — a single additional page is not worth a scope conversation. If it is a complex page or requires significant content work, quote it.

**"Can we change how the booking system works?"**
This depends on what they mean. Adjusting booking rules (minimum notice, cancellation policy) — fine. Adding a fundamentally different booking flow or feature not in the original scope — quote it.

**"Can we add a blog?"**
Out of scope for the Professional Plan. Quote it separately or park it for Phase 2.

**"I've changed the logo / brand colours"**
This happens. Update the site, email templates, and dashboard branding. Within scope — but note in the Revision Log and update the Project Brief.

---

## Step 3.8 — Final Written Approval

### What You Need

Before Stage 4 begins, you need the client's explicit written approval by email. A Zoom call saying "yes I'm happy" is not sufficient — you need it in writing.

Ask for it directly when you believe the site is in its final state:

> *"Are you happy for this to go live? If so, just reply to this email confirming approval and I'll move into launch preparation."*

Their reply — even a simple "yes, happy to go live!" — is your approval. Save it immediately.

### What to Do With It

- Save the approval email as a PDF: `[Business Name]/Build/Final_Approval_[date].pdf`
- Update Bonsai status to **Awaiting Launch**
- Confirm Invoice 2 has been paid before proceeding

### Do Not Proceed Without Both

- Written approval from client ✓
- Invoice 2 paid ✓

If Invoice 2 is outstanding when approval arrives, send a friendly reminder:

> *"Brilliant — thank you. I'll get the launch preparation started as soon as Invoice 2 is cleared. [Invoice link]"*

---

## Stage 3 — Checklist

**Step 3.1 — Staging Setup:**
- [ ] Staging environment created in Local by Flywheel or WP Staging
- [ ] WordPress installed — latest version
- [ ] Wimbledon Smart Plugin installed and activated
- [ ] Wordfence installed and activated
- [ ] Search engine indexing discouraged on staging
- [ ] Staging credentials noted in Project Brief

**Step 3.2 — Plugin Configuration:**
- [ ] All services added — name, duration, price, deposit, staff assignment
- [ ] All staff members added — hours, buffers, assigned services
- [ ] Booking rules configured — advance window, minimum notice, cancellation, rescheduling
- [ ] Stripe connected in test mode — test payment processed successfully
- [ ] Email notifications configured — all seven types tested
- [ ] Client branding applied to all email templates
- [ ] Dashboard branding applied — logo, colours, "Powered by Wimbledon Smart" in footer only
- [ ] Google Calendar sync flagged as Stage 4 action (requires live credentials)

**Step 3.3 — Website Build:**
- [ ] All seven standard pages built
- [ ] Additional scoped pages built
- [ ] Global styles consistent — fonts, colours, buttons
- [ ] All images resized and compressed
- [ ] Basic SEO set — page titles, meta descriptions, H1s, alt text
- [ ] No placeholder content remaining (or clearly flagged for client)

**Step 3.4 — Internal QA:**
- [ ] Full booking flow tested end-to-end on desktop and mobile
- [ ] All email notifications tested and confirmed landing in inbox
- [ ] All pages load correctly — desktop, iOS, Android
- [ ] All links and forms tested
- [ ] Content checked — spelling, prices, contact details, staff names
- [ ] Dashboard permissions tested — owner and staff views correct
- [ ] Lighthouse performance score ≥ 90
- [ ] Wordfence showing no critical alerts

**Step 3.5 — Design Review:**
- [ ] Screencast recorded — 10–15 minutes, full site and dashboard walkthrough
- [ ] Design review email sent — staging URL, login credentials, clear instructions
- [ ] 3-working-day response window set (Bonsai task)

**Step 3.6 — Invoice 2:**
- [ ] Invoice 2 raised at same time as design review email
- [ ] Amount correct for pricing tier
- [ ] Payment confirmed before proceeding to Stage 4

**Step 3.7 — Revisions:**
- [ ] Client feedback received and logged in Revision Log
- [ ] All in-scope changes implemented on staging
- [ ] Out-of-scope requests handled — quoted separately or parked
- [ ] Revision Log saved to Google Drive: `Build/`

**Step 3.8 — Final Approval:**
- [ ] Written approval received by email
- [ ] Approval email saved as PDF to Google Drive: `Build/Final_Approval_[date].pdf`
- [ ] Invoice 2 confirmed paid
- [ ] Bonsai status updated to Awaiting Launch

**Success measure:** The staging site is fully functional, all QA checks pass, the client has given written approval, and Invoice 2 is paid. Everything is ready for Stage 4 — Launch.

---

## Stage 3 — Inputs and Outputs

| Item | Detail |
|---|---|
| **Inputs from client** | Revision feedback · Final written approval by email |
| **Outputs to client** | Design review screencast · Staging site link · Login credentials · Revised staging links (per revision round) |
| **Internal records** | QA checklist (completed, filed in Drive) · Revision Log (Drive) · Final approval email (PDF, Drive) · Bonsai status: Awaiting Launch |
| **Stage 3 complete when** | Written client approval received, Invoice 2 paid, Bonsai status updated |

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Stage2_Onboarding.md | Client_Delivery_Workflow.md | Tools_Stack.md*
