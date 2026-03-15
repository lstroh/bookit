# Client Delivery Workflow
## Wimbledon Smart Business — Complete Process Guide

**Document Version:** 2.0
**Date:** March 2026
**Status:** Active Reference
**Applies To:** All new client engagements — Professional Plan

---

## Overview

This document covers every step a client goes through from first contact to ongoing monthly service. It defines inputs, outputs, tools used, internal records, and client-facing communications at each stage.

**The six stages:**
1. Pre-Sale — discovery to signed proposal
2. Onboarding — contract to build-ready brief
3. Build — staging site to client approval
4. Launch — go-live to handover
5. Ongoing Monthly — maintenance, monitoring, and check-ins
6. Quarterly Review — retention and growth

**Guiding principles:**
- No stage begins until the previous stage's outputs are confirmed
- No build begins without a signed contract and first payment received
- No site goes live without the final invoice paid
- Every client gets a personal experience — no template blasting

---

## Tools & Stack Reference

| Purpose | Tool | Notes |
|---|---|---|
| Booking system | Wimbledon Smart Plugin | Core product — also used for own discovery call scheduling |
| Website platform | WordPress | Self-hosted |
| Staging environment | Local by Flywheel or WP Staging | Build and test before going live |
| Payments — setup invoices | Stripe | One-off milestone invoices |
| Payments — subscriptions | Stripe | Recurring monthly billing |
| Bookkeeping | FreeAgent | UK sole trader accounts + self-assessment |
| CRM & client management | Bonsai (£17/month) → HoneyBook (£30/month) at 5+ clients | Proposals, contracts, invoices, client tracking |
| Contracts | Bonsai built-in (or DocuSign if needed separately) | Signed before any work begins |
| Scheduling | Wimbledon Smart Plugin | Use your own product — not Calendly |
| Intake forms | Bonsai built-in or Google Forms | Client questionnaire |
| Email sequences | Brevo | Transactional (SMTP) + marketing/onboarding sequences |
| Uptime monitoring | UptimeRobot | Free tier, 5-min checks |
| Backups | BlogVault | ~£1–2/site/month, daily offsite backups |
| Security | Wordfence | Free tier, weekly scans |
| Client calls | Zoom or Google Meet | All calls recorded where relevant |
| File storage | Google Drive | Per-client folders |

**CRM upgrade path:** Start with Bonsai at launch. Upgrade to HoneyBook when you reach 5+ active clients — automation at that scale saves several hours per week and provides a proper client portal.

**Brevo single-account risk:** One Brevo account covers all client sites with multiple verified sender domains. If the account is suspended or has a deliverability issue, all client booking notifications stop simultaneously. Review this risk and mitigation options when you reach 5+ active clients.

---

## Payment Milestone Structure

All amounts reference the Professional Plan. Adjust if introductory pricing applies (first two clients: £495 setup fee).

| Milestone | Amount | Timing | Method |
|---|---|---|---|
| Invoice 1 — Project Start | 10% of setup fee | After contract signed | Stripe |
| Invoice 2 — Design Review | 40% of setup fee | When design review is sent to client | Stripe |
| Invoice 3 — Final Delivery | 50% of setup fee | Before DNS pointed / site goes live | Stripe |
| Monthly Subscription | £99/month | From launch date, ongoing | Stripe recurring |

**Monthly subscription is optional but strongly encouraged.** Covers hosting, maintenance, updates, security monitoring, backups, and support. Clients who opt out receive the site files and data export but lose access to the booking functionality.

**Failed payment handling:**
- Stripe auto-retries after 3 days
- Still failed: email client to update payment method
- Unresolved after 7 days: manual follow-up call or email
- Unresolved after 14 days: suspend services (site offline, hosting paused)
- Resume immediately on payment — do not delete data

---

## STAGE 1 — PRE-SALE

**Trigger:** Prospect expresses interest (outreach response, Facebook group, referral, website enquiry)
**Goal:** Qualify the prospect, run a discovery call, send a personalised proposal
**Duration:** Typically 3–7 days

### Qualification Criteria

**Ideal client profile:**
- UK-based service business
- 1–10 staff members who take appointments
- Established 2+ years (has existing customers to migrate)
- Currently using manual bookings, WhatsApp, or outdated software
- Ready to start within 3 months

**Red flags — likely not a good fit:**
- Total budget under £500
- Needs features well beyond booking (full eCommerce, membership site, CRM)
- Expecting a complete website in under 2 weeks
- Unwilling to pay monthly for hosting and ongoing support
- Vague about their needs ("I just want a website")
- Very low tech tolerance with no-one on their team who can help

### Steps

**1.1 — Initial Response**
Reply within 24 hours. Keep it short and human. Offer a discovery call with a booking link (Wimbledon Smart Plugin).

> *"Hi [Name], great to hear from you. I'd love to find out more about your business and show you what the system looks like. Here's a link to book a 30-minute call at a time that suits you: [booking link]"*

**1.2 — Pre-Call Research (15 minutes)**
Before the discovery call:
- Review their website if one exists
- Check social media (Facebook, Instagram) and Google reviews
- Note how they currently handle bookings
- Identify 1–2 specific pain points to reference on the call

**1.3 — Discovery Call (30–45 minutes, Zoom)**

Purpose: Understand their situation well enough to write a relevant, personalised proposal.

Topics to cover:
- How do they currently handle bookings? (phone, WhatsApp, paper diary, existing software)
- How many staff need access to the system?
- What services do they offer and how long does each take?
- Do they take deposits or payments upfront?
- Do they have an existing website? A logo? Brand colours?
- What is their biggest frustration with their current setup?
- What does success look like for them in 3 months?
- What is their timeline — any hard deadlines? (seasonal rush, planned event)

What to share on the call:
- Brief overview of what Wimbledon Smart builds
- Show the demo site (screen share)
- Explain the dashboard — what the business owner and staff will see
- Explain pricing clearly — setup fee, monthly, what is included, how to cancel

Do not hard-sell. Listen more than you talk. The demo does the work.

Close with clear next steps:
> *"I'll put together a custom proposal within 24 hours. You can review it in your own time, and if you have questions we can do a quick call to go through it together."*

**1.4 — Internal Note**
After the call, add the prospect to your CRM (Bonsai) with:
- Business name and contact name
- Industry and team size
- Current booking setup
- Key pain points mentioned
- Services and staff count (for scoping)
- Any flags (very low tech comfort, complex requirements, price sensitivity)
- Expected deal value
- Status: Proposal Sent

**1.5 — Proposal Email (within 24 hours of discovery call)**
Not a long PDF. A clear, personal email. Structure:

- One paragraph summarising what you heard on the call (shows you listened)
- What you will build specifically for them
- What is included (feature list, support, hosting)
- Pricing with payment milestones (10% / 40% / 50%)
- Timeline overview (6 weeks from brief received)
- What happens next (sign contract, first invoice, questionnaire)
- A simple call to action: *"Reply to confirm you'd like to go ahead and I'll send the contract over."*

### Proposal Follow-Up Timeline

| Day | Action |
|---|---|
| Day 0 | Proposal sent |
| Day 3 | If no response: short follow-up email ("Just checking this landed OK") |
| Day 7 | If still no response: brief phone call |
| Day 14 | If still no response: final email, then mark as Lost — No Response in CRM |

### Common Objections and Responses

**"The price is too high"**
> *"I understand. Can I ask what you were expecting? [Pause and let them answer.] The setup fee covers 25–30 hours of work — website design, booking system configuration, payment setup, and full testing. Unlike DIY plugins, your staff never need to touch WordPress. If Year 1 cost is the concern, the annual plan reduces it to £1,683 — saving £500 compared to monthly billing."*

**"I need to think about it"**
> *"Of course. Can I ask what specifically you're weighing up? If it's a particular feature or concern, I'd rather address it now than leave you with an unanswered question."*

**"I'm comparing with other options"**
> *"That's smart. Worth knowing: most booking platforms charge commission on new client bookings — Fresha takes 20%, which adds up quickly. And unlike DIY plugins, your staff never log into WordPress admin. Happy to answer any specific questions as you compare."*

**"Can you lower the setup fee?"**
> *"The setup fee covers the full build — reducing it would mean reducing scope. What I can offer instead is the annual plan, which drops the setup fee to £495 and saves £500 overall in Year 1."*

### Inputs
- Prospect enquiry

### Outputs
- Discovery call booking confirmation (via Wimbledon Smart Plugin)
- Discovery call notes (CRM)
- Personalised proposal email

### Internal Records
- CRM (Bonsai): prospect record created, deal value logged, status set
- Google Drive: client folder created at proposal stage

---

## STAGE 2 — ONBOARDING

**Trigger:** Client confirms verbally or by email they want to proceed
**Goal:** Signed contract, first payment, and complete brief ready before build starts
**Duration:** Typically 5–10 working days (depends on client response speed)

### Steps

**2.1 — Send Contract**
Use Bonsai's built-in contract feature (or DocuSign if needed). Contract must be signed before any work begins or invoice is raised.

Contract must cover at minimum:

*Scope and delivery*
- Specific deliverables (what is being built)
- What is explicitly out of scope (custom features, content writing, logo design)
- Client asset delivery window (3–5 working days)
- Revision policy (unlimited rounds within original scope; new scope quoted separately)
- Estimated duration (6 weeks from brief confirmed)

*Payment*
- Payment milestones (10% / 40% / 50% with trigger for each)
- Monthly subscription terms (optional, what is included, 30-day cancellation notice)
- Late payment terms (reminder at 7 days, suspension at 14 days)

*Ownership and rights*
- Client owns the final website and all their content
- Wimbledon Smart retains plugin intellectual property
- Wimbledon Smart retains portfolio rights unless client objects in writing
- Third-party licences (WordPress, theme, plugins) remain with their respective owners

*Responsibilities*
- Client: provide content, give timely feedback, pay on schedule
- Wimbledon Smart: design, build, configure, train, support

*Data and compliance*
- Client owns all their customer data
- Client is data controller under GDPR for their customers' data
- On cancellation: data export within 7 days, plugin deactivation after 30 days, data deletion after 90 days

*Legal*
- 30-day bug fix warranty after launch
- Limitation of liability capped at total fees paid
- UK law applies

*Note: Have a UK-qualified solicitor review the contract template before first use. One-off cost — worth it.*

**2.2 — Raise Invoice 1 (10%)**
Send via Stripe once contract is signed. Work does not begin until payment is confirmed.

**2.3 — Send Welcome Pack Email**
Sent immediately after payment confirmed.

Contents:
- Welcome and confirmation that you are ready to start
- What happens next (intake questionnaire, asset collection)
- Estimated timeline from brief received to launch (6 weeks)
- What you need from them and by when (3–5 working days)
- Your contact details and response time (email, 24–48hr)
- Link to intake questionnaire

**2.4 — Intake Questionnaire**
Built in Bonsai or Google Forms. One form covering everything needed to build the site.

*Business Details*
- Legal business name and trading name (if different)
- Business address, phone number, email (for booking notifications)
- Website URL if existing
- Social media links (Facebook, Instagram, LinkedIn, other)
- VAT number if registered

*Branding*
- Logo file upload (SVG or PNG, high resolution)
- Primary and secondary brand colours (hex codes or description)
- Preferred fonts if known
- 2–3 examples of websites they like (URLs)
- Tone preference: professional / friendly / luxury / casual

*Services (repeat for each service, up to 15)*
- Service name and brief description
- Duration in minutes
- Price
- Which staff members deliver it
- Deposit required? (yes/no — amount or percentage)
- Any booking notes (e.g. "consultation required before first booking")

*Staff Members (repeat for each, up to 10)*
- Full name and role
- Working days and hours
- Lunch break or regular blocks to exclude
- Buffer time needed between appointments
- Google Calendar email address (for sync)
- Photo (optional) and short bio (optional)

*Booking Preferences*
- How far in advance can customers book?
- Minimum notice required for a new booking?
- Can customers cancel online? If yes, how many hours before?
- Can customers reschedule online? If yes, how many hours before?
- Cancellation fee? (e.g. deposit forfeited)
- Payment methods: Stripe / PayPal / Pay on arrival / mix

*Content*
- About the business (2–3 paragraphs or bullet points — informal is fine, will be edited)
- Existing testimonials or Google reviews to include
- Photos (upload — location, staff, services in action; smartphone photos are fine)
- Any specific page requests beyond the standard set

*Technical*
- Domain registrar (GoDaddy, 123-reg, Namecheap, etc.)
- Google Analytics account (if existing)
- Google Business Profile URL (if existing)
- Any other tools currently in use

*Legal*
- Existing Terms & Conditions and Privacy Policy (upload or URL if yes)
- Does the business process sensitive customer data? (e.g. medical history for physiotherapists — flags additional GDPR steps)

**2.5 — Asset Collection**
Client uploads logo, photos, and content via the questionnaire or a shared Google Drive folder.

**2.6 — Brief Review and Sign-Off**
Once everything is received (or the 3–5 day window has passed):
- Review questionnaire completeness
- Chase missing items once by email
- Create internal Project Brief document
- Send client confirmation: *"I have everything I need — build starts [date], estimated launch [date]."*

If the client is significantly late returning assets, the timeline shifts accordingly. Note this in CRM.

### Inputs from Client
- Signed contract
- Invoice 1 payment (10%)
- Completed intake questionnaire
- Brand assets (logo, photos, content)

### Outputs
- Welcome pack email
- Intake questionnaire link
- Internal project brief (Google Drive)
- Build start confirmation email

### Internal Records
- CRM: status updated to "Active Project"
- Google Drive: client folder populated (brief, assets, signed contract copy)
- Staging environment created

---

## STAGE 3 — BUILD

**Trigger:** Project brief confirmed, all assets received, Invoice 1 paid
**Goal:** Fully functional staging site approved by client
**Duration:** Typically 2–4 weeks

### Steps

**3.1 — Staging Environment Setup**
- Create staging site (Local by Flywheel or WP Staging)
- Install WordPress and Wimbledon Smart Plugin
- Configure hosting environment

**3.2 — Plugin Configuration**
Using the intake questionnaire as the source of truth:
- Add all services (name, duration, price, deposit rules, assigned staff)
- Add all staff members (working hours, buffer times, assigned services)
- Configure booking rules (advance window, cancellation policy, minimum notice)
- Connect payment gateway (Stripe and/or PayPal — test mode first)
- Set up Google Calendar sync for each staff member
- Configure Brevo SMTP — add client's verified sender domain
- Configure email notification templates with client branding
- Apply dashboard branding (client logo, brand colours)

**3.3 — Website Build**
Standard page set for the Professional Plan:

| Page | Contents |
|---|---|
| Home | Hero, key benefits, social proof, CTA to book |
| About | Business story, team, values |
| Services | All services with duration and price, book CTA per service |
| Booking | Embedded booking widget (full flow) |
| Contact | Address, phone, email, contact form, map |
| Privacy Policy | GDPR-compliant — generated and reviewed |
| Terms & Conditions | Booking terms, cancellation policy |

Additional pages added if scoped during discovery.

**3.4 — Internal QA Checklist**
Complete before sending to client. Test on desktop and mobile (iOS and Android). Test on Chrome, Safari, and Firefox.

*Booking Flow*
- [ ] Customer can browse and select a service
- [ ] Customer can select a staff member (or any available)
- [ ] Calendar shows correct availability based on working hours and buffers
- [ ] Deposit or payment collected correctly in test mode
- [ ] Confirmation email sent to customer (correct content, branding, sender domain)
- [ ] Notification email sent to business owner
- [ ] Notification email sent to assigned staff member
- [ ] Booking appears in business dashboard and staff dashboard
- [ ] Google Calendar sync working for each staff member
- [ ] Cancellation via magic link works
- [ ] Rescheduling via magic link works
- [ ] Reminder email sends at correct interval

*Website*
- [ ] All pages load correctly
- [ ] All links work (no broken links)
- [ ] Mobile responsive on iOS and Android
- [ ] Contact form submits and sends notification
- [ ] Images optimised (no slow loading)
- [ ] SSL certificate active on staging
- [ ] Privacy policy and T&Cs live and accurate
- [ ] GDPR consent checkbox present on booking form
- [ ] Lighthouse performance score ≥ 90

*Dashboard*
- [ ] Business owner can log in, view all bookings, add bookings, block time, view reports
- [ ] Staff member can log in and see only their own bookings
- [ ] Client branding applied correctly (logo, colours) throughout dashboard
- [ ] "Powered by Wimbledon Smart" visible in dashboard footer only — not on customer-facing booking pages or customer emails

**3.5 — Design Review to Client**
Once internal QA passes:
- Record a screencast (10–15 min) walking through the staging site and dashboard
- Send to client with staging URL and login credentials
- Give clear instructions: *"Please review and reply with any changes. If I don't hear back within 3 working days I'll send a follow-up."*

**3.6 — Raise Invoice 2 (40%)**
Sent with the design review email. Triggered by design delivery, not by client approval.

**3.7 — Revision Rounds**
- Ask client to compile all feedback into a single reply
- Implement on staging and send updated link
- Repeat until client is satisfied
- Revisions are unlimited within original scope
- New features or significant scope changes are quoted separately before work begins

**3.8 — Final Written Approval**
Client confirms by email that they are happy and approve the site to go live. Save this email to Google Drive. Do not proceed to launch without it.

### Inputs from Client
- Revision feedback
- Final written approval (email)

### Outputs
- Staging site (fully functional)
- Design review screencast
- QA checklist (completed and filed)
- Revision log (email thread, saved to Drive)

### Internal Records
- CRM: status updated to "Awaiting Launch"
- Google Drive: QA checklist, revision log, and approval email filed
- Invoice 2 raised and payment confirmed before proceeding

---

## STAGE 4 — LAUNCH

**Trigger:** Final written approval received, Invoice 2 paid
**Goal:** Live site, onboarded client, active monitoring, subscription started
**Duration:** Typically 3–5 working days

### Steps

**4.1 — Pre-Launch Checklist**

*Payments*
- [ ] Stripe switched from test mode to live
- [ ] Test live payment of £1 made and refunded
- [ ] PayPal connected in live mode (if applicable)

*Brevo / Email*
- [ ] Client sender domain verified in Brevo
- [ ] Test booking notification sent from client domain — lands in inbox, not spam
- [ ] All email templates correct (branding, contact details, links)

*Compliance*
- [ ] GDPR consent checkbox present on booking form
- [ ] Privacy policy accurate (business name, contact details, data retention)
- [ ] Booking terms and cancellation policy confirmed accurate
- [ ] Cookie notice present on website

*Technical*
- [ ] SSL certificate ready for live domain
- [ ] Google Analytics connected (or confirmed not required)
- [ ] Google Search Console set up
- [ ] Google Business Profile linked (if client has one)
- [ ] Staging backup taken before migration
- [ ] Domain registrar access confirmed
- [ ] Favicon uploaded
- [ ] Open Graph social sharing tags set

*Content*
- [ ] All placeholder content removed
- [ ] All images have alt text (accessibility)
- [ ] Contact details correct throughout (including footer)

**4.2 — Raise Invoice 3 (50%)**
Send before DNS is pointed. Site does not go live until this payment is confirmed.

**4.3 — Migration and Go-Live**
- Migrate from staging to live hosting
- Point DNS to live server
- Activate SSL on live domain
- Run one complete test booking on the live site (real payment, real email)
- Confirm everything working end to end

**4.4 — Post-Launch Verification**
- [ ] Live site loads at client's domain
- [ ] Booking flow works on live
- [ ] Confirmation email received from client's domain (not spam)
- [ ] Dashboard accessible and all logins working
- [ ] Google Calendar sync active

**4.5 — Set Up Monitoring**
- Add site to UptimeRobot (5-minute checks, email and SMS alert)
- Add site to BlogVault (confirm first daily backup completes)
- Confirm Wordfence active with weekly scan schedule
- Add client to internal monthly maintenance calendar

**4.6 — Set Up Subscription**
If client has opted in to monthly subscription:
- Create Stripe recurring subscription at £99/month
- Set billing date to launch date
- Send subscription confirmation email

**4.7 — Onboarding Call (30–45 minutes, Zoom)**
Schedule within 48 hours of launch. Record the call.

Agenda:
- Confirm they can log in and everything is working
- Walk through the business dashboard: viewing bookings, blocking time, editing services, reading reports
- Walk through the customer booking experience
- Explain email notifications (what triggers them, how to update contact details)
- Explain support: email only, 24–48hr response
- Explain monthly subscription: what is included, billing date, 30-day cancellation notice
- Answer any questions

**4.8 — Send Handover Pack**
Email within 24 hours of onboarding call. Contents:
- Onboarding call recording (Google Drive link)
- Written Quick-Start Guide (PDF, specific to their setup):
  - How to log in
  - How to view and manage bookings
  - How to block time
  - How to update services
  - How to handle a cancellation
  - How to export customer data
  - How to contact support
- Tutorial video links (unlisted YouTube playlist)
- Support contact and expected response time
- Subscription summary (what is included, billing date, cancellation process)
- What to do if the site goes down: contact Wimbledon Smart, do not attempt fixes independently

**4.9 — Welcome Email Sequence (Brevo)**
Add client to onboarding sequence on launch day:

| Day | Email | Purpose |
|---|---|---|
| Day 0 | Welcome — you're live | Celebrate launch, link to dashboard |
| Day 2 | Have you tested your first booking? | Encourage a test, link to tutorial |
| Day 5 | Tips for reducing no-shows | Reminder settings, cancellation policy advice |
| Day 30 | One month in — here's what to check | Reports overview, prompt to reach out |

**4.10 — Testimonial Request (2 weeks after launch)**
Set a CRM reminder at launch. Send a short personal email at the 2-week mark:
> *"Hi [Name], it's been two weeks since we launched — I hope the bookings are coming in! If you've had a chance to use the system, I'd really appreciate a quick Google review. Here's the link: [link]. No pressure at all — and thank you for trusting me with your site."*

### Inputs from Client
- Invoice 3 payment (50%)
- DNS access or action
- Attendance at onboarding call

### Outputs
- Live website
- Post-launch verification (internal)
- Onboarding call recording
- Handover pack (PDF + videos + links)
- Brevo welcome sequence activated
- Testimonial request (2 weeks post-launch)

### Internal Records
- CRM: status updated to "Live — Active Client"
- Google Drive: pre-launch checklist and handover pack filed
- UptimeRobot, BlogVault, Wordfence: all active and confirmed
- Brevo: sender domain verified, onboarding sequence triggered
- Stripe subscription created and confirmed
- Monthly maintenance calendar updated

---

## STAGE 5 — ONGOING MONTHLY

**Trigger:** Automated — runs on the 1st working week of each month per client
**Goal:** Site stays healthy, client feels looked after, issues caught before they become problems
**Time Required:** 20–30 minutes per site per month (plus reactive time if issues arise)

### Monthly Maintenance Window

**Step 1 — Check Monitoring Dashboards (5 min)**
- UptimeRobot: review uptime for the month, note any incidents
- BlogVault: confirm all daily backups completed, flag failures
- Wordfence: review security scan results, note any actions taken

**Step 2 — WordPress Updates (10–15 min)**
- Check for WordPress core, plugin, and theme updates
- Apply to staging first, test full booking flow
- If staging passes, apply to live site
- Confirm live site and booking flow work after update
- Log all updates applied

*Never auto-update live sites. Always test on staging first.*

**Step 3 — Wimbledon Smart Plugin Check (5 min)**
- Check plugin error logs for failed bookings or notification failures
- Confirm Stripe/PayPal still connected and processing
- Confirm Google Calendar sync active for all staff
- Confirm Brevo email notifications delivering correctly

**Step 4 — Internal Monthly Report**
File to Google Drive under client folder:

```
CLIENT: [Business Name]
MONTH: [Month Year]
---
UPTIME: [e.g. 99.98% — 0 incidents]
BACKUPS: [e.g. All 30 daily backups completed]
SECURITY: [e.g. No threats / 1 blocked login attempt — no action required]
UPDATES APPLIED: [e.g. WordPress 6.5.2, Wimbledon Smart Plugin 1.4.1]
PLUGIN STATUS: [e.g. All systems normal]
EMAIL DELIVERY: [e.g. Brevo — all notifications delivering]
SUPPORT TICKETS: [e.g. None / 1 — resolved same day]
NOTES: [Anything unusual]
NEXT MONTH: [Planned actions]
```

**Step 5 — Monthly Client Check-in Email**
Personal, not templated. Sent within the first week of the month.

Tailor to each client individually. Consider:
- Any incidents that month and what you did
- Any updates that improve their experience
- Patterns in their booking data worth noting
- One proactive tip relevant to their business
- Reminder you are available if they need anything

Keep it to 5–8 sentences. It should feel like a message from someone paying attention to their business.

### Proactive Alerts

| Alert Type | Tool | Your Action | Client Notified? |
|---|---|---|---|
| Site down | UptimeRobot (immediate) | Investigate and fix immediately | Only if downtime > 15 min |
| Backup failed | BlogVault (same day) | Investigate and resolve | Only if data risk |
| Security threat | Wordfence (immediate) | Investigate, clean if needed | Only if action required |
| Email delivery issue | Brevo (monthly check) | Investigate and resolve | Only if bookings affected |
| Plugin conflict | Manual monthly check | Test on staging, resolve | Only if site affected |

**Downtime client notification template:**
> *"Hi [Name], I wanted to let you know your site experienced a brief outage earlier today. It was back online within [X] minutes. I've investigated and [resolved it / am monitoring it]. Your bookings were not affected / [note any impact]. No action needed from you."*

---

## STAGE 6 — QUARTERLY REVIEW

**Trigger:** Every 3 months from launch date (set recurring reminder in calendar on launch day)
**Goal:** Confirm satisfaction, gather product feedback, catch churn risk early, create referral and upsell opportunities
**Duration:** 20–30 minute Zoom call

### Steps

**6.1 — Pre-Call Email (1 week before)**
> *"Hi [Name], it's been [3/6/9] months since we launched your booking site — time flies! I'd love to spend 20 minutes checking in on how it's going. Does [day/time] work, or here's my calendar link: [booking link]"*

**6.2 — Quarterly Review Call Agenda**

*How's it going? (10 min)*
- How are they finding the system day to day?
- Are customers using online booking? Any feedback from customers?
- Any friction points or things not working as expected?
- Is the dashboard easy for staff to use?

*Results (5 min)*
- More bookings than before?
- No-shows reduced?
- Time saved on admin?
- Any specific win worth noting for a case study?

*What's coming (5 min)*
- Share relevant Phase 2 roadmap items (SMS, package bookings, recurring appointments)
- "Is there anything you wish the system could do that it currently can't?" — log all feedback

*Housekeeping (5 min)*
- Changes needed? (new staff, new service, updated hours)
- Happy with support response times?
- Questions about billing?

**6.3 — Post-Call Actions**

Internal (same day):
- Update CRM satisfaction level: Happy / Neutral / At Risk
- Log feature requests in product feedback log
- Note churn signals if any
- Schedule next quarterly review

Client-facing (within 48 hours):
- Brief follow-up email summarising any agreed actions
- Action any requested changes immediately
- Referral ask if client is clearly happy:
  > *"One last thing — if you know any other business owners who struggle with the same booking headaches you had before, I'd love an introduction. Happy to offer you a free month if anyone you refer signs up."*

**6.4 — Upsell Opportunities**

Introduce these at the right quarterly review — not before the client is settled.

*SMS reminders — introduce at 6-month review:*
> *"I'm now offering SMS appointment reminders for existing clients. Most businesses see a 30–40% drop in no-shows. It's £25/month for up to 300 messages, sent automatically 24 hours before each appointment. Happy to set it up this week if you'd like to try it."*

*Email marketing campaigns — introduce at 9-month review:*
> *"Quick question — when did you last email your full customer list? I now offer a monthly campaign service: 2–4 branded emails per month, fully managed. Seasonal promotions, tips, news. £50/month. Want me to put together an example for your business?"*

*Website refresh — introduce at 12-month review:*
> *"Your site has been live for a year — great milestone. Are there any services you've added, team changes, or new photos you'd like updated? I can also do a design refresh if you want to keep things feeling current. Happy to quote once I know what you have in mind."*

**6.5 — Handling Cancellations**

When a client requests to cancel, respond before processing:
> *"Thanks for letting me know. Before I process the cancellation, can I ask what the main reason is? I'd genuinely like to understand if there's something I could have done better, and in some cases there may be a solution I haven't offered yet."*

*Common reasons and responses:*

*"Too expensive"* — Consider a reduced rate on a case-by-case basis. Do not make this a blanket offer.

*"Not using it enough"* — > *"Have you promoted the booking link to your customers directly? Adding it to your Instagram bio and WhatsApp status makes a big difference. I can send you a short template to share if that would help."*

*"Business closing" or "Going with another provider"* — Process promptly and professionally.

*Exit process:*
1. Confirm 30-day notice period in writing
2. Continue full service for 30 days
3. Within 7 days: provide WordPress export (XML), database backup (SQL), customer data export (CSV), booking history export (CSV)
4. After 30 days: remove hosting, deactivate plugin
5. After 90 days: delete all client data from servers
6. Update CRM: Churned — [Reason]
7. Add to Win-Back list

*Win-back attempt (6 months after churn):*
> *"Hi [Name], it's been a few months since we last worked together. I hope things are going well. I've added some new features since you left — [mention 1–2 relevant items]. If your situation has changed and you'd like to revisit, I'd love to chat."*

### Inputs from Client
- Call attendance and honest feedback

### Outputs
- Post-call follow-up email
- Any site changes actioned within 48 hours
- Referral ask (if appropriate)
- Upsell follow-up email (if appropriate — separate from the review call)

### Internal Records
- CRM: satisfaction status updated (Happy / Neutral / At Risk)
- CRM tags: Upsell Opportunity — SMS / Marketing / Refresh (as applicable)
- Feature request log updated
- Next quarterly review scheduled
- Win-back list updated (if churned)

---

## Summary: Inputs & Outputs by Stage

| Stage | Key Inputs from Client | Key Outputs to Client | Internal Records |
|---|---|---|---|
| 1 — Pre-Sale | Enquiry, discovery call attendance | Proposal email | CRM record, Drive folder |
| 2 — Onboarding | Signed contract, 10% payment, questionnaire + assets | Welcome pack, brief confirmation | Project brief, Drive folder |
| 3 — Build | Revision feedback, final written approval | Design review screencast, revised staging link | QA checklist, revision log |
| 4 — Launch | 50% payment, DNS action, onboarding call | Live site, handover pack, onboarding recording, Brevo sequence | Monitoring active, Stripe subscription, Drive records |
| 5 — Monthly | Nothing required | Personal check-in email | Internal monthly report |
| 6 — Quarterly | Call attendance, feedback | Follow-up email, changes actioned, upsell email if relevant | Satisfaction status, feature log, churn risk notes |

---

## Summary: Payment Flow

| Invoice | Amount | Trigger | Blocker? |
|---|---|---|---|
| Invoice 1 | 10% of setup fee | Contract signed | Yes — build does not start until paid |
| Invoice 2 | 40% of setup fee | Design review sent to client | No — raised at delivery, not on approval |
| Invoice 3 | 50% of setup fee | Final written approval received | Yes — site does not go live until paid |
| Monthly | £99/month | Launch date, recurring | No — optional but strongly encouraged |

---

## Key Timelines and Expectations

| Expectation | Detail |
|---|---|
| Client asset return window | 3–5 working days from welcome pack |
| Design review response window | 3 working days (one chase, then proceed) |
| Revisions included | Unlimited rounds within original scope |
| Additional scope or new features | Quoted separately before work begins |
| Support response time | 24–48 hours (email only) |
| Downtime alert threshold | Immediate investigation; client notified if > 15 min |
| Monthly maintenance window | First working week of each month |
| Quarterly review | Every 3 months from launch date |
| Cancellation notice | 30 days written notice |
| Data handover on cancellation | Within 7 days of cancellation confirmation |
| Data deletion after cancellation | 90 days (GDPR retention period) |
| Failed payment suspension | 14 days after first failed payment attempt |

---

## CRM Status Reference

Use these tags consistently in Bonsai (and later HoneyBook) to maintain a clean pipeline.

| Status | Meaning |
|---|---|
| New Lead | Enquiry received, not yet contacted |
| Contacted | Initial response sent, awaiting discovery call |
| Qualified | Discovery call complete, proposal being prepared |
| Proposal Sent | Proposal emailed, awaiting response |
| Active Project | Contract signed, build in progress |
| Live — Active Client | Site launched, on monthly subscription |
| Payment Issue | Failed payment, following up |
| Upsell Opportunity | Eligible for SMS / marketing / refresh |
| At Risk | Low engagement, complaints, or churn signals noted |
| Churned | Cancelled — note reason |
| Win-Back | Former client — check in after 6 months |
| Lost — No Response | No reply after 14 days |
| Lost — Not a Fit | Disqualified at discovery stage |

---

*End of Client Delivery Workflow — Version 2.0*
*Related documents: 12_Month_Business_Plan.md | Pricing_Model_Recommendation.md*
