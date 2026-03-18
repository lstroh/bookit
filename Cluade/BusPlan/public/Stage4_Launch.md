# Stage 4 — Launch
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.0
**Date:** March 2026
**Status:** Active Reference
**Applies To:** Every client site going live — Professional Plan

---

## Stage 4 Overview

Stage 4 starts the moment the client gives written approval and Invoice 2 is paid. It ends when the site is live, the client is onboarded, monitoring is active, the subscription is running, and the handover pack has been sent.

This is the stage where most of the operational complexity lives. There are ten steps, several of which have hard dependencies — nothing goes live without Invoice 3 paid, no subscription starts without the site being live, no handover pack goes out without the onboarding call happening first.

Do not rush this stage. A clean launch that takes an extra day is far better than a rushed one that produces a support call on Day 1.

| Field | Detail |
|---|---|
| **Trigger** | Written client approval received, Invoice 2 paid |
| **Goal** | Live site, onboarded client, active monitoring, subscription running |
| **Duration** | Typically 3–5 working days |
| **Tools** | Hostinger or Kinsta, Stripe, Brevo, UptimeRobot, BlogVault, Wordfence, Zoom, Jamie, Google Drive, Bonsai |
| **Outcome** | Bonsai status: Live — Active Client. All systems confirmed active. |

---

## Steps at a Glance

| Step | What Happens |
|---|---|
| **4.1 Pre-Launch Checklist** | Complete 30-point checklist before touching DNS |
| **4.2 Raise Invoice 3** | 50% of setup fee. Site does not go live until paid. |
| **4.3 Migration and Go-Live** | Move from staging to live hosting, point DNS, SSL |
| **4.4 Post-Launch Verification** | Confirm everything works on the live domain |
| **4.5 Set Up Monitoring** | UptimeRobot, BlogVault, Wordfence all activated |
| **4.6 Set Up Subscription** | Stripe recurring at £99/month from launch date |
| **4.7 Onboarding Call** | 30–45 min Zoom. Recorded. Within 48 hours of launch. |
| **4.8 Send Handover Pack** | Quick-Start Guide, call recording, support details |
| **4.9 Welcome Email Sequence** | Add client to Brevo onboarding sequence |
| **4.10 Testimonial Request** | Set CRM reminder — email at 2 weeks post-launch |

---

## Step 4.1 — Pre-Launch Checklist

Complete this checklist **before** you raise Invoice 3 or touch DNS. Everything must pass before the site goes live. Work through each section in order.

### Payments

- [ ] Stripe switched from test mode to live — API keys updated in plugin settings
- [ ] Test live payment of £1 made with a real card and refunded immediately — confirms Stripe live mode is working
- [ ] PayPal connected in live mode and tested (if client requested PayPal)
- [ ] Stripe webhook endpoint confirmed as pointing to live domain (not staging URL)

### Brevo / Email

- [ ] Client sender domain verified in Brevo — SPF, DKIM, and verification CNAME records confirmed in DNS
- [ ] Test booking made → confirmation email received from client's domain (not your domain, not a Brevo address)
- [ ] Confirmation email lands in inbox — not spam folder (test with Gmail and ideally one other provider)
- [ ] All email templates checked — correct business name, contact details, logo, and links
- [ ] Reply-to address in email templates set to client's business email address
- [ ] Staff notification email confirmed working — assigned staff member receives notification

### Compliance

- [ ] GDPR consent checkbox present on booking form — customer cannot complete booking without ticking
- [ ] Privacy Policy is accurate — correct business name, address, email, and data retention period
- [ ] Booking Terms and Conditions are accurate — correct cancellation policy, deposit forfeiture rules, payment terms
- [ ] Cookie consent notice present on website — appears on first visit, allows accept/decline
- [ ] If client processes sensitive data (medical history, health forms): additional GDPR steps confirmed — data processing agreement in place

### Technical

- [ ] SSL certificate ready for live domain — confirmed it will auto-install on DNS switch (Let's Encrypt via Hostinger, or Cloudflare on Kinsta)
- [ ] Google Analytics connected — GA4 tracking ID installed and verified firing (or confirmed not required by client)
- [ ] Google Search Console set up — domain verified, sitemap submitted
- [ ] Google Business Profile linked to website (if client has one)
- [ ] Staging backup taken and saved to Google Drive before migration
- [ ] Domain registrar access confirmed — you can point DNS when needed, or client knows how and has instructions
- [ ] Favicon uploaded and displaying correctly
- [ ] Open Graph tags set — title, description, and image for social sharing previews
- [ ] All staging-specific settings removed — search engine indexing re-enabled, staging passwords removed

### Content

- [ ] All placeholder content removed — no [BRACKETS] remaining
- [ ] All images have descriptive alt text (accessibility and SEO)
- [ ] Contact details correct throughout — header, footer, contact page, email templates
- [ ] Business address and phone number correct
- [ ] All service prices and durations match the signed-off Project Brief exactly

---

## Step 4.2 — Raise Invoice 3 (50%)

Send Invoice 3 before DNS is pointed. The site does not go live until this payment is confirmed. No exceptions.

| Pricing Option | Setup Fee | Invoice 3 (50%) |
|---|---|---|
| Standard monthly | £995 | £497.50 |
| Standard annual | £995 | £497.50 |
| Introductory (first 2 clients) | £495 | £247.50 |

Add a note to the invoice:

> *"Final milestone — site approved and ready to launch. Once payment is confirmed I'll point DNS and have you live within a few hours."*

Payment due immediately — this is the go-live gate. If payment takes more than 24 hours, send a polite nudge:

> *"Just checking Invoice 3 landed okay — everything is ready to launch on my end, just waiting for payment to clear before I point DNS. Let me know if you have any questions."*

Once paid, confirm in Bonsai and move immediately to Step 4.3.

---

## Step 4.3 — Migration and Go-Live

### What Goes Into Hostinger (Standard) or Kinsta (Premium)

Every site gets its own WordPress installation on the hosting account — not a subdirectory, a separate installation with its own database.

**On Hostinger:** Create a new WordPress installation via the Hostinger hPanel. Name it clearly (e.g. `salonname-live`). Do not use the staging site — create a clean installation and migrate the staging content across.

**On Kinsta:** Use the MyKinsta dashboard to create a new WordPress site. Use the 1-click staging push if available, or migrate manually.

### Migration Process

1. **Export from staging** — export the WordPress database and all files (plugins, themes, uploads). Use a migration plugin such as All-in-One WP Migration or Duplicator, or export/import manually via phpMyAdmin and SFTP.

2. **Import to live hosting** — install on the live Hostinger or Kinsta environment. Update wp-config.php with live database credentials.

3. **Update all URLs** — run a search-and-replace to update staging URLs to the live domain. Use WP-CLI or a plugin like Better Search Replace. This step is critical — missed staging URLs break images, links, and plugin callbacks.

4. **Update Stripe webhook** — go to Stripe Dashboard → Developers → Webhooks. Add the live domain webhook endpoint and confirm it matches what is configured in the plugin.

5. **Update Brevo SMTP** — confirm the plugin SMTP settings are pointing to Brevo with the live sender domain credentials (not staging).

### Pointing DNS

Before touching DNS, confirm you have a rollback plan — the staging site is still intact and can be made live again if something goes wrong.

**Standard DNS change:**
1. Log into the client's domain registrar (details in Project Brief under Technical)
2. Update the A record to point to the Hostinger or Kinsta IP address
3. If using Cloudflare (Kinsta default), update nameservers to Cloudflare's

**DNS propagation:** Changes typically take 15 minutes to 2 hours. During this window, some visitors will see the old site and some will see the new one. This is normal and resolves automatically.

**SSL activation:** On Hostinger, SSL auto-installs via Let's Encrypt once DNS propagates. On Kinsta, Cloudflare SSL is active immediately. Confirm the padlock appears before sending the client anything.

**Inform the client before you point DNS:**

> *"Payment confirmed — I'm pointing DNS now. The site will be live within 1–2 hours. I'll message you as soon as I've confirmed everything is working."*

### Post-DNS Confirmation

Once DNS has propagated:

1. Visit the live domain — confirm the site loads correctly
2. Check SSL padlock is present
3. Run one complete test booking end-to-end — real payment, real email, real calendar event
4. Confirm confirmation email arrives from the client's domain, lands in inbox
5. Confirm booking appears in the dashboard
6. Confirm Google Calendar sync triggers if configured

Do not proceed to Step 4.4 until all of the above pass.

---

## Step 4.4 — Post-Launch Verification

A second pass over everything now that it is on the live domain. Some issues only appear on live that don't show on staging — mixed content warnings, webhook failures, email delivery differences.

- [ ] Live site loads at client's domain — no redirect loops, no SSL warnings
- [ ] Site loads correctly on mobile (iOS and Android) — check from your phone, not just a browser emulator
- [ ] Complete booking flow tested on live — end-to-end with a real payment
- [ ] Booking confirmation email received from client's domain — not spam
- [ ] Business owner dashboard accessible at live domain and all logins working
- [ ] Staff member login tested — correct permissions, only their bookings visible
- [ ] Google Calendar event created from test booking — visible in staff member's calendar
- [ ] No mixed content warnings in browser console (HTTP assets on HTTPS page)
- [ ] No JavaScript errors in browser console
- [ ] Google Analytics firing — confirm real-time view shows your test visit
- [ ] All page load times acceptable — no pages taking more than 3 seconds

If anything fails, fix on live and retest before proceeding. Do not proceed to client-facing steps with known issues.

---

## Step 4.5 — Set Up Monitoring

Add every tool in sequence. Do not skip this step — if something breaks at 2am, you want to know before the client does.

### UptimeRobot

1. Log into UptimeRobot at https://uptimerobot.com
2. Add New Monitor → HTTP(s)
3. Friendly name: `[Business Name] — Live`
4. URL: `https://[clientdomain]`
5. Monitoring interval: 5 minutes
6. Alert contacts: your email address
7. Save and confirm the monitor shows as Up

### BlogVault

1. Log into BlogVault at https://blogvault.net
2. Add Site → enter live domain and WordPress admin credentials
3. Confirm connection successful
4. Trigger a manual backup — confirm it completes
5. Set schedule to daily
6. Confirm backup storage destination (BlogVault cloud — offsite from hosting)

Note in the monthly maintenance calendar: first automated backup should complete within 24 hours of setup. Check it did.

### Wordfence

Wordfence was installed and activated during Stage 3. On launch:

1. Log into WordPress admin on live site
2. Wordfence → Dashboard — confirm no critical alerts
3. Wordfence → Scan → Start New Scan — run a full scan on the fresh live site
4. Confirm scan completes with no malware or critical issues
5. Wordfence → Firewall → confirm Learning Mode has completed and firewall is set to Enabled and Protecting

### Monthly Maintenance Calendar

Add the client to your internal maintenance schedule. Use Google Calendar or a Bonsai recurring task:

- Task: `Monthly maintenance — [Business Name]`
- Frequency: First working week of each month
- Duration: Allow 30 minutes

---

## Step 4.6 — Set Up Stripe Subscription

If the client has opted in to the monthly subscription (strongly recommended — this is the ongoing revenue that makes the business work):

1. In Stripe Dashboard → Customers — find or create the client as a customer
2. Create a Subscription:
   - Product: `Wimbledon Smart Monthly — Professional`
   - Price: £99/month recurring
   - Billing cycle start: today (launch date)
   - Payment method: the card used for Invoice 3 (already on file) or request a new card
3. Send the subscription confirmation email:

> *"Your monthly subscription is now active — £99/month starting today. This covers hosting, maintenance, security updates, and email support. You'll receive an automatic receipt each month. You can cancel anytime with 30 days written notice. Full details are in the handover pack I'll send after our call."*

4. Record subscription start date in Bonsai under the client record.

---

## Step 4.7 — Onboarding Call

### Timing

Schedule within **48 hours of launch**. Send the calendar invite immediately after confirming the site is live — do not wait for them to reach out.

> *"The site is live — congratulations! I've booked an onboarding call for [date/time] so I can walk you through everything. Here's the link: [Zoom link]. It'll take about 30–40 minutes."*

Use your Wimbledon Smart Plugin booking link if the client needs to reschedule — don't do this over email back-and-forth.

### Before the Call

- Start Jamie recording before joining
- Have the live site and dashboard open and ready to share screen
- Have the client's Project Brief open for reference (service names, staff names)
- Test that you can log in as both the business owner and a staff member

### Onboarding Call Agenda

**Welcome and confirm access (5 minutes)**
> *"Can you confirm you can log into the dashboard at [URL]? Let's start there."*

If they cannot log in, troubleshoot immediately before proceeding.

**Business dashboard walkthrough (15 minutes)**
Walk through each section while they follow along on their own screen:

- Calendar view — how to read it, how bookings appear, how to switch between day/week/month view
- Today's appointments — the first thing they'll look at each morning
- How to add a manual booking (for phone calls and walk-ins)
- How to block time (holiday, personal appointments)
- How to edit a service or update a price
- Customer list — how to search, how to view a customer's booking history
- Reports — how to read the basics (bookings this week, revenue this month)

**Customer booking experience (5 minutes)**
Share screen and walk through a booking as if you are a customer:

> *"This is what your customers see when they visit your site. Let's go through it together."*

Confirm they understand: this is fully automatic — no action needed from them when a customer books.

**Email notifications (5 minutes)**
Explain each notification:
- Customer confirmation — sent immediately on booking
- Staff notification — sent to the assigned staff member
- 24-hour reminder — sent automatically the day before
- Cancellation — what happens when a customer cancels via magic link

**Support and subscription (5 minutes)**
- Email only — reply within 24–48 hours on working days
- What the £99/month covers (hosting, updates, security, support)
- Billing date is today's date each month
- Cancellation: 30 days written notice, they keep their data
- If the site ever goes down: email Wimbledon Smart immediately — do not attempt any fixes independently

**Questions (5 minutes)**
> *"Before we finish — is there anything you're unsure about or want to go through again?"*

**Close**
> *"I'll send you the recording of this call plus a written guide within 24 hours. You've got everything you need to get started. Good luck with the first booking!"*

---

## Step 4.8 — Send Handover Pack

Send within **24 hours of the onboarding call**. This is the client's permanent reference document — they should never need to contact you for basic how-to questions if this pack is comprehensive.

### Handover Pack Email Template

> **Subject:** Your Wimbledon Smart handover pack — [Business Name]

> Hi [First Name],
>
> Great speaking with you today. Here's everything you need in one place.
>
> **Onboarding call recording:**
> [Google Drive link — set to "anyone with the link can view"]
>
> **Your Quick-Start Guide:**
> [PDF download link]
> Covers: logging in, managing bookings, blocking time, updating services, handling cancellations, exporting data, and how to contact support.
>
> **Your dashboard:**
> [https://yourdomain.com/dashboard]
> Login: [their email address]
>
> **Your live site:**
> [https://yourdomain.com]
>
> **Support:**
> Email: liron@wimbledonsmart.co.uk
> Response time: within 24–48 hours on working days
>
> **Your subscription:**
> £99/month — billing started today [date]
> Cancel anytime with 30 days written notice
>
> If anything comes up that the guide doesn't cover, just email me.
>
> Really proud of how this one came out — enjoy it.
>
> Liron

### Quick-Start Guide Content

Create this as a PDF for each client. Keep it to 8–10 pages. Use screenshots from their actual live site — not generic screenshots. Personalise it with their business name throughout.

Sections to include:

1. **Logging in** — URL, email address, password reset process
2. **Viewing your bookings** — calendar view, today's list, upcoming appointments
3. **Adding a manual booking** — for phone and walk-in bookings
4. **Blocking time** — for holidays, personal time, staff leave
5. **Managing a cancellation** — what happens automatically, when you need to act
6. **Updating a service** — changing price, duration, assigned staff
7. **Exporting customer data** — how to download a CSV of your customer list
8. **What happens if the site goes down** — contact Wimbledon Smart, what not to do
9. **Support contact and billing** — email, response time, cancellation process

Store the PDF in Google Drive: `[Business Name]/Ongoing/Handover_Pack_[date].pdf`

---

## Step 4.9 — Welcome Email Sequence

Add the client to the Brevo onboarding sequence on launch day — not after the onboarding call, on launch day itself. The sequence runs automatically from that point.

In Brevo, add the client's business email address to the onboarding list. Confirm the Day 0 email fires correctly.

**Sequence:**

| Day | Subject | Content |
|---|---|---|
| Day 0 | You're live — welcome to Wimbledon Smart | Congratulations message, dashboard link, quick-start guide link |
| Day 2 | Have you tested your first booking? | Prompt to make a test booking, link to tutorial, reassurance it's normal to test |
| Day 5 | Reduce no-shows by up to 40% | How reminder emails work, how to check reminder settings, tip on cancellation policy wording |
| Day 30 | One month in — here's what to check | How to read the reports, what to look for, prompt to reach out with any questions |

Write these emails once and reuse them for every client. The only personalisation needed is the first name and business name — use Brevo merge tags.

---

## Step 4.10 — Testimonial Request

Set a Bonsai task on launch day: **"Testimonial request — [Business Name]"** due 14 days from today.

When the task fires, send this email:

> **Subject:** Quick favour — [Business Name]

> Hi [First Name],
>
> It's been two weeks since we launched — I hope the bookings are coming in!
>
> If you've had a chance to use the system and you're happy with it, I'd really appreciate a quick Google review. It makes a big difference for a small business like mine. Here's the direct link: [Google review link]
>
> No pressure at all — and thank you again for trusting me with your site.
>
> Liron

**If they leave a review:** Screenshot it, save it to Google Drive under `Ongoing/`, and add a note to Bonsai. This review becomes social proof for future proposals.

**If they don't respond:** Follow up once after 7 days. If still nothing, let it go — do not chase more than twice.

---

## Stage 4 — Checklist

**Step 4.1 — Pre-Launch:**
- [ ] All payments items checked (Stripe live mode, test payment, webhooks)
- [ ] All Brevo/email items checked (domain verified, test email in inbox)
- [ ] All compliance items checked (GDPR, privacy policy, T&Cs, cookie notice)
- [ ] All technical items checked (SSL, Analytics, Search Console, favicon, OG tags)
- [ ] All content items checked (no placeholders, alt text, contact details correct)

**Step 4.2 — Invoice 3:**
- [ ] Invoice 3 raised and sent before DNS pointed
- [ ] Payment confirmed in Stripe before proceeding

**Step 4.3 — Migration:**
- [ ] Staging backup saved to Google Drive before migration
- [ ] Site migrated to Hostinger or Kinsta
- [ ] All URLs updated from staging to live domain
- [ ] Stripe webhook updated to live domain
- [ ] Brevo SMTP confirmed on live domain
- [ ] DNS pointed — client informed before change
- [ ] SSL certificate active — padlock confirmed
- [ ] End-to-end test booking completed on live site

**Step 4.4 — Post-Launch Verification:**
- [ ] Live site loads correctly on desktop and mobile
- [ ] No SSL warnings, no mixed content errors, no JS console errors
- [ ] Complete booking flow confirmed end-to-end
- [ ] Confirmation email lands in inbox (not spam) from client's domain
- [ ] Dashboard and all logins working
- [ ] Google Calendar sync confirmed

**Step 4.5 — Monitoring:**
- [ ] UptimeRobot monitor created — status showing as Up
- [ ] BlogVault connected — first manual backup completed
- [ ] Wordfence scan completed — no critical issues
- [ ] Client added to monthly maintenance calendar

**Step 4.6 — Subscription:**
- [ ] Stripe subscription created at £99/month from launch date
- [ ] Subscription confirmation email sent to client
- [ ] Subscription start date recorded in Bonsai

**Step 4.7 — Onboarding Call:**
- [ ] Call scheduled within 48 hours of launch
- [ ] Jamie recording started before call
- [ ] Full agenda covered — dashboard, booking flow, notifications, support, billing
- [ ] Questions answered

**Step 4.8 — Handover Pack:**
- [ ] Quick-Start Guide created (personalised PDF with their screenshots)
- [ ] Handover pack email sent within 24 hours of onboarding call
- [ ] PDF saved to Google Drive: `Ongoing/`
- [ ] Call recording link included

**Step 4.9 — Welcome Sequence:**
- [ ] Client added to Brevo onboarding sequence on launch day
- [ ] Day 0 email confirmed as sent

**Step 4.10 — Testimonial:**
- [ ] Bonsai task set for 14 days from launch: "Testimonial request"

**Final:**
- [ ] Bonsai status updated to **Live — Active Client**
- [ ] Google Drive fully organised — all Stage 4 records filed

**Success measure:** The site is live, the client can log in and use the dashboard independently, all monitoring is active, the subscription is running, and the handover pack is in their inbox.

---

## Stage 4 — Inputs and Outputs

| Item | Detail |
|---|---|
| **Inputs from client** | Invoice 3 payment · DNS access or action · Attendance at onboarding call |
| **Outputs to client** | Live website · Onboarding call (recorded) · Handover pack (PDF + call recording) · Brevo welcome sequence · Subscription confirmation |
| **Internal records** | Bonsai status: Live — Active Client · Pre-launch checklist (Drive) · Monitoring all active · Stripe subscription confirmed · Monthly maintenance calendar updated |
| **Stage 4 complete when** | All monitoring active, subscription running, handover pack sent, Bonsai status updated |

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Stage3_Build.md | Client_Delivery_Workflow.md | Tools_Stack.md | Infrastructure_Reference.md*
