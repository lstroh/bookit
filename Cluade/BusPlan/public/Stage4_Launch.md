# Stage 4 — Launch
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.2
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
| **4.5 Set Up Monitoring** | UptimeRobot, BlogVault, Wordfence, WP-Optimize, Broken Link Checker |
| **4.6 Set Up Subscription** | Stripe recurring at £99/month from launch date |
| **4.7 Onboarding Call** | 30–45 min Zoom. Recorded. Within 48 hours of launch. |
| **4.8 Send Handover Pack** | Quick-Start Guide, call recording, support details |
| **4.9 Welcome Email Sequence** | Add client to Brevo onboarding sequence |
| **4.10 Testimonial Request** | Set CRM reminder — email at 2 weeks post-launch |

---

## Step 4.1 — Pre-Launch Checklist

Complete this checklist **before** you raise Invoice 3 or touch DNS. Everything must pass before the site goes live. Work through each section in order.

**Payments:**
- [ ] Stripe switched from test mode to live
- [ ] Test live payment of £1 made and refunded
- [ ] Stripe webhook URL updated to live domain — test webhook sent and 200 response confirmed

**Brevo / Email:**
- [ ] Client sender domain verified in Brevo
- [ ] Test booking notification sent from client domain — lands in inbox, not spam
- [ ] All email templates correct (branding, contact details, links)

**Compliance:**
- [ ] GDPR consent checkbox present on booking form
- [ ] Privacy policy accurate (business name, contact details, data retention)
- [ ] Booking terms and cancellation policy confirmed accurate
- [ ] Cookie notice present on website

**Technical:**
- [ ] SSL certificate ready for live domain
- [ ] Google Analytics connected (or confirmed not required)
- [ ] Google Search Console set up
- [ ] Google Business Profile linked (if client has one)
- [ ] Staging backup taken before migration
- [ ] Domain registrar access confirmed
- [ ] Favicon uploaded
- [ ] Open Graph social sharing tags set

**Content:**
- [ ] All placeholder content removed
- [ ] All images have alt text (accessibility)
- [ ] Contact details correct throughout (including footer)

---

## Step 4.2 — Raise Invoice 3

Raise Invoice 3 (50% of setup fee) and send to the client before DNS is pointed. The site does not go live until this payment is confirmed in Stripe.

> *"The site is ready to launch. I've raised the final invoice — once that's settled I'll get everything pointed and live, typically within a few hours. [Invoice link]"*

Do not touch DNS until payment is confirmed. No exceptions.

---

## Step 4.3 — Migration and Go-Live

### Primary Route — Hostinger hPanel Publish

For all new builds on Hostinger:

1. Confirm Invoice 3 is paid
2. Take a manual BlogVault backup of staging — confirm it completes
3. In hPanel: WordPress → Staging → ⋮ → Publish
4. After publish completes, clear Hostinger cache: hPanel → WordPress → Cache → Purge Cache
5. Run Better Search Replace to update any remaining staging URLs to the live domain
6. Re-save permalink structure: Settings → Permalinks → Save Changes (fixes potential 404s post-migration)
7. Update Stripe webhook URL to live domain in Stripe Dashboard → Developers → Webhooks
8. Send a test webhook from Stripe dashboard — confirm 200 response before proceeding
9. Point DNS to the live hosting — inform the client before making this change
10. Wait for propagation — confirm SSL padlock is active on the live domain

### Fallback Route — Migration Plugin

If hPanel Publish is not available (cross-host migration or other reason):

1. Install All-in-One WP Migration on staging
2. Export as `.wpress` with live domain as the replacement URL
3. Import on a fresh WordPress installation at the live domain
4. Follow steps 4–10 above

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
- [ ] **Hostinger cache purged** — in hPanel go to WordPress → Cache → Purge Cache immediately after migration. Stale cached content can cause visitors to see old pages even after a successful Publish. Do this before any other post-launch testing.

If anything fails, fix on live and retest before proceeding. Do not proceed to client-facing steps with known issues.

---

## Step 4.5 — Set Up Monitoring and Maintenance Plugins

Add every tool in sequence. Do not skip this step — if something breaks at 2am, you want to know before the client does. The plugins installed here run passively and feed directly into the monthly Stage 5 maintenance process.

### UptimeRobot

1. Log into UptimeRobot at https://uptimerobot.com
2. Add New Monitor → HTTP(s)
3. Friendly name: `[Business Name] — Live`
4. URL: `https://[clientdomain]`
5. Monitoring interval: 5 minutes
6. Alert contacts: your email address
7. Save — confirm status shows as Up
8. **Enable SSL monitoring:** on the monitor settings page, confirm the SSL certificate alert is active. UptimeRobot will automatically alert you if the certificate is approaching expiry. This feeds into the monthly SSL check in Stage 5.

### BlogVault

1. Log into BlogVault and add the new site
2. Install the BlogVault plugin on the live WordPress site
3. Connect the site to your BlogVault account
4. Trigger the first manual backup and confirm it completes
5. Confirm daily backup schedule is active

### Wordfence

1. Confirm Wordfence is active on the live site
2. Run a full scan — confirm no critical issues
3. Set scan schedule to weekly
4. Ensure email alerts are going to your address

### WP-Optimize

1. Install and activate WP-Optimize (WordPress admin → Plugins → Add New → search "WP-Optimize")
2. Go to WP-Optimize → Settings and enable scheduled automatic clean-up: weekly is sufficient
3. Run a manual optimisation now to establish a clean baseline: WP-Optimize → Database → Run all optimizations
4. This plugin runs in the background and is also triggered manually each month during Stage 5 housekeeping

### Broken Link Checker

1. Install and activate Broken Link Checker (WordPress admin → Plugins → Add New → search "Broken Link Checker")
2. Go to Tools → Broken Links — confirm the plugin is active and scanning
3. Set email notifications to your address so new broken links alert you automatically
4. No further configuration needed — it runs passively and surfaces broken links in the monthly Stage 5 housekeeping check

### Maintenance Calendar

Add the client to your internal monthly maintenance calendar — first working week of each month.

---

## Step 4.6 — Set Up Stripe Subscription

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

Schedule within **48 hours of launch**. Send the calendar invite immediately after confirming the site is live.

> *"The site is live — congratulations! I've booked an onboarding call for [date/time] so I can walk you through everything. Here's the link: [Zoom link]. It'll take about 30–40 minutes."*

### Agenda

**Dashboard walkthrough (10 minutes)**
- How to log in and navigate the dashboard
- How to view, manage and manually add bookings
- How to add or update services, staff hours, and pricing
- How to view reports and booking history

**Booking flow walkthrough (10 minutes)**
- Show them the booking widget from a customer's perspective
- Walk through the confirmation email and reminders they will receive
- Explain how deposits and payments work
- Show the cancellation and rescheduling flow

**Notifications and settings (5 minutes)**
- Where to update notification preferences
- How to set holiday/unavailable dates
- How to customise reminder timing

**Support and billing (5 minutes)**
- How to reach you — email response time, what counts as urgent
- Where to find invoices and receipts
- How subscription billing works
- How to raise a change request

**Questions (remaining time)**

### Recording

Start Jamie before joining. Confirm it is running. The recording goes into the handover pack.

---

## Step 4.8 — Send Handover Pack

Send within **24 hours of the onboarding call**.

The handover pack is a single email containing:
- Personalised Quick-Start Guide PDF (their screenshots, their URLs, their login details)
- Link to the onboarding call recording (Jamie or Zoom)
- Link to your support contact
- Reminder of subscription terms

> *"Hi [Name], great to meet you on the call today. Here's everything you need in one place:*
>
> *📄 Quick-Start Guide: [link]*
> *🎥 Call recording: [link]*
> *✉️ Support: [email address] — I aim to respond within 1 working day*
>
> *Your subscription of £99/month started today and will renew automatically. You can cancel with 30 days written notice.*
>
> *Let me know if anything comes up — I'm always happy to help.*
>
> *Liron"*

Save the PDF to Google Drive: `[Business Name]/Ongoing/Handover_Pack_[date].pdf`

---

## Step 4.9 — Welcome Email Sequence

Add the client to the Brevo onboarding sequence on launch day.

| Day | Email | Purpose |
|---|---|---|
| Day 0 | Welcome — you're live | Celebrate launch, link to dashboard |
| Day 2 | Have you tested your first booking? | Encourage a test, link to tutorial |
| Day 5 | Tips for reducing no-shows | Reminder settings, cancellation policy advice |
| Day 30 | One month in — here's what to check | Reports overview, prompt to reach out |

Confirm the Day 0 email has sent before closing out Stage 4.

---

## Step 4.10 — Testimonial Request

Set a Bonsai task for 14 days from launch: "Testimonial request — [Client Name]."

When the reminder fires, send:

> *"Hi [Name], it's been two weeks since we launched — I hope the bookings are coming in!*
>
> *If you've had a chance to use the system and you're happy with it, I'd really appreciate a quick Google review. It makes a big difference for a small business like mine. Here's the direct link: [Google review link]*
>
> *No pressure at all — and thank you again for trusting me with your site.*
>
> *Liron"*

**If they leave a review:** Screenshot it, save it to Google Drive under `Ongoing/`, and add a note to Bonsai.

**If they don't respond:** Follow up once after 7 days. If still nothing, let it go — do not chase more than twice.

---

## Stage 4 — Checklist

**Step 4.1 — Pre-Launch:**
- [ ] All payment items checked (Stripe live mode, test payment, webhooks)
- [ ] All Brevo/email items checked (domain verified, test email in inbox)
- [ ] All compliance items checked (GDPR, privacy policy, T&Cs, cookie notice)
- [ ] All technical items checked (SSL, Analytics, Search Console, favicon, OG tags)
- [ ] All content items checked (no placeholders, alt text, contact details correct)

**Step 4.2 — Invoice 3:**
- [ ] Invoice 3 raised and sent before DNS pointed
- [ ] Payment confirmed in Stripe before proceeding

**Step 4.3 — Migration:**
- [ ] Staging backup saved to Google Drive before migration
- [ ] Site migrated to Hostinger or Kinsta (hPanel Publish preferred; migration plugin as fallback)
- [ ] Hostinger cache purged immediately after Publish
- [ ] All URLs updated from staging to live domain (Better Search Replace plugin)
- [ ] Permalink structure re-saved (Settings → Permalinks → Save Changes)
- [ ] Stripe webhook updated to live domain — test webhook sent and 200 response confirmed
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

**Step 4.5 — Monitoring and Maintenance Plugins:**
- [ ] UptimeRobot monitor created — status showing as Up
- [ ] UptimeRobot SSL monitoring enabled on the monitor
- [ ] BlogVault connected — first manual backup completed
- [ ] Wordfence scan completed — no critical issues
- [ ] WP-Optimize installed — scheduled weekly clean-up enabled, baseline optimisation run
- [ ] Broken Link Checker installed — active and scanning, email alerts configured
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

**Success measure:** The site is live, the client can log in and use the dashboard independently, all monitoring is active, both maintenance plugins are installed and running, the subscription is running, and the handover pack is in their inbox.

---

*Document Version: 1.2 | Updated: March 2026*
*Changes from v1.1: Added SSL monitoring toggle to UptimeRobot setup in Step 4.5; added WP-Optimize installation and setup to Step 4.5; added Broken Link Checker installation and setup to Step 4.5; updated Steps at a Glance summary; updated Stage 4 checklist to reflect all three additions.*
*Related documents: Stage3_Build.md | Client_Delivery_Workflow.md | Tools_Stack.md | Dev_Deployment_Workflow.md*
