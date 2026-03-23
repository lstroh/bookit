# Stage 3 — Build
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.1
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
7. **Password-protect the staging subdomain** — if using Hostinger hPanel staging, add HTTP authentication via hPanel → Hosting → Advanced, or use a maintenance mode plugin. The staging site must never be publicly accessible. This prevents accidental Google indexing and keeps the client from stumbling on an unfinished build.
8. **Confirm PHP version parity** — check the PHP version in Local (site Info tab) and confirm it matches the PHP version set for this client's hosting account in hPanel (Hosting → PHP Configuration). Mismatches can cause silent plugin failures that only appear after migration.
9. Create a note in the Project Brief with the local URL, staging URL, and admin credentials

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
- Google Calendar email address (note: sync configured in Stage 4 — see below)

### Booking Rules

Set each of the following according to the Project Brief:

- **Advance booking window** — how far ahead customers can book (e.g. up to 8 weeks)
- **Minimum notice** — minimum time before an appointment can be booked (e.g. 2 hours)
- **Cancellation policy** — how far in advance a customer can cancel without penalty
- **Rescheduling policy** — whether customers can reschedule, and under what conditions

### Payments — Stripe

Connect Stripe in **test mode only** on staging. Never connect live Stripe keys to a staging or local environment.

1. Go to plugin settings → Payments
2. Enter the Stripe **test** publishable key and secret key
3. Process a test booking using Stripe's test card (4242 4242 4242 4242)
4. Confirm the test payment appears in your Stripe dashboard under test mode
5. Confirm the booking confirmation email triggers correctly

Switching to live Stripe keys is a Stage 4 action — not done here.

### Email Notifications — Brevo SMTP

1. In the plugin SMTP settings, configure Brevo as the mail provider
2. Set the sender domain to the client's verified sender domain (must be verified in Brevo with SPF + DKIM + CNAME records before this works)
3. Set the sender name to the client's business name
4. Set the reply-to address to the client's business email
5. Test all seven notification types — confirm each arrives in inbox, not spam, from the correct sender address

### Dashboard Branding

- Upload the client's logo
- Set brand colours to match the client's palette
- Confirm the footer shows "Powered by Wimbledon Smart" only — no other attribution

### Google Calendar Sync

**Do not configure Google Calendar sync on local or staging.** Google Calendar OAuth requires a redirect URI that is bound to a specific domain — it will not work on a local or staging URL, and attempting to set it up can create invalid token states that cause problems later.

Google Calendar sync is configured in Stage 4, on the live domain, after DNS has propagated and SSL is active. Note this in the Project Brief under "Stage 4 Actions."

---

## Step 3.3 — Website Build

### Standard Page Set

| Page | Contents |
|---|---|
| **Home** | Hero, key benefits, social proof (testimonials / Google review screenshots), CTA to book |
| **About** | Business story, team bios and photos, values or approach |
| **Services** | All services with duration and price, book CTA per service |
| **Booking** | Embedded booking widget — full booking flow |
| **Contact** | Address, phone, email, contact form, embedded map |
| **Privacy Policy** | GDPR-compliant — generate using a tool, then review for accuracy |
| **Terms & Conditions** | Booking terms, cancellation policy, deposit forfeiture rules |

Additional pages are added if scoped during discovery. No page is added outside the original scope without a written change request.

### Build Principles

**Consistency:** Global styles (fonts, colours, button styles, spacing) must be set once and applied everywhere. Do not hard-code styles per element — use theme or page builder global settings. This saves hours during revision rounds.

**Images:** All images must be resized and compressed before uploading. Target under 200KB per image where possible without visible quality loss. Use a tool like Squoosh or Imagify.

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

> *"Take your time reviewing — there's no rush. If you can send me all your feedback in a single reply, that helps me make the changes efficiently. The most important things to check are: all your services and prices are correct, staff hours are right, and the booking flow feels right for your customers."*

### The Email

Send the design review email and Invoice 2 at the same time — same email, or back to back within minutes. Do not wait for client feedback before raising Invoice 2.

Template:

> *Subject: Your website is ready for review — [Business Name]*
>
> *Hi [Name],*
>
> *Your site is ready for your first look — I think you're going to like it.*
>
> *Here's how to access it:*
> *→ Website: [staging URL]*
> *→ Dashboard login: [staging URL]/wp-admin*
> *→ Username: [username] | Password: [password]*
>
> *I've also recorded a short walkthrough so you can see everything in action before diving in yourself: [Loom link]*
>
> *When you're ready, send me your feedback as a single list — that makes it much easier for me to work through everything in one go. The most important things to check: services and prices, staff hours, and the booking flow.*
>
> *I'll also send Invoice 2 separately now — this covers the design delivery milestone.*
>
> *Any questions, just reply here.*
>
> *Liron*

### Response Window

Set a Bonsai task: "Design review response due — [3 working days from today]."

If no response after 3 working days, send one chase:

> *"Just checking you received the design review — let me know if you have any issues accessing the site or the recording."*

If still no response after a further 3 working days, proceed as if approved (note this in Bonsai) and follow up by phone if possible.

---

## Step 3.6 — Invoice 2 (40%)

Invoice 2 is raised at design delivery — not at client approval. This is the design delivery milestone.

| Pricing Option | Setup Fee | Invoice 2 (40%) |
|---|---|---|
| Standard monthly | £995 | £398 |
| Standard annual | £995 | £398 |
| Introductory (first 2 clients) | £495 | £198 |

Send Invoice 2 at the same time as the design review email. It does not need to be paid before revision rounds begin, but it must be paid before the site goes live.

If Invoice 2 is still outstanding at the time of final approval, hold the launch until it clears.

---

## Step 3.7 — Revision Rounds

### How to Handle Feedback

Ask the client to compile all feedback into a single reply. Avoid acting on drip-fed changes — each round of revisions should be a complete batch, not a stream of individual messages.

**What is in scope:**
- Changes to content, layout, colours, fonts, images within the original brief
- Corrections to services, prices, staff hours
- Adjustments to booking rules
- Fixing anything that doesn't work as agreed

**What is out of scope:**
- New pages not in the original brief
- New features not in the plugin scope
- Structural redesigns (e.g. changing the theme or rebuilding a page from scratch)

When out-of-scope work comes in, acknowledge it positively and quote separately:

> *"That's a great idea — it's outside the original scope but I can quote for it as a separate add-on. Want me to send a quick estimate?"*

### Revision Log

Keep a running log of all changes requested and implemented. Save it to Google Drive: `[Client Name]/Build/Revision_Log.md`. This protects you if there is ever a dispute about what was agreed.

### How Many Rounds

There is no limit to revision rounds within scope. The job is not done until the client is satisfied with what was in the brief. Do not rush this stage — a client who launches feeling lukewarm about their site will be harder to work with in the ongoing relationship.

---

## Step 3.8 — Final Approval

### What Counts as Approval

A written confirmation by email that the client is happy and approves the site to go live. It does not need to be formal — any clear positive response qualifies:

> *"Yes, looks great — happy to go ahead!"*
> *"All good from my end, let's launch."*
> *"Perfect, I'm happy with everything."*

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
- [ ] Staging subdomain password-protected — HTTP auth via hPanel or maintenance mode plugin active
- [ ] PHP version in Local confirmed matching Hostinger PHP configuration for this client's account
- [ ] Staging credentials noted in Project Brief

**Step 3.2 — Plugin Configuration:**
- [ ] All services added — name, duration, price, deposit, staff assignment
- [ ] All staff members added — hours, buffers, assigned services
- [ ] Booking rules configured — advance window, minimum notice, cancellation, rescheduling
- [ ] Stripe connected in test mode — test payment processed successfully
- [ ] Email notifications configured — all seven types tested
- [ ] Client branding applied to all email templates
- [ ] Dashboard branding applied — logo, colours, "Powered by Wimbledon Smart" in footer only
- [ ] Google Calendar sync confirmed as Stage 4 action — not configured here (OAuth requires live domain)

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

**Success measure:** The staging site is fully functional, all QA checks pass, the client has given written approval, and Invoice 2 is paid.

---

## Stage 3 — Inputs and Outputs

| Item | Detail |
|---|---|
| **Inputs from client** | Revision feedback · Final written approval by email |
| **Outputs to client** | Design review screencast · Staging site link · Login credentials · Revised staging links (per revision round) |
| **Internal records** | QA checklist (completed, filed in Drive) · Revision Log (Drive) · Final approval email (PDF, Drive) · Bonsai status: Awaiting Launch |
| **Stage 3 complete when** | Written client approval received, Invoice 2 paid, Bonsai status updated |

---

*Document Version: 1.1 | Updated: March 2026 — Added staging password protection, PHP version parity check, and Google Calendar sync rationale*
*Related documents: Stage2_Onboarding.md | Client_Delivery_Workflow.md | Tools_Stack.md | Dev_Deployment_Workflow.md*
