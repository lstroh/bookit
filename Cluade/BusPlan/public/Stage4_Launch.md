# Stage 4 — Launch
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.1
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

**On Hostinger:** The preferred route is to use the hPanel native staging Publish button — this pushes the entire staging environment (files + database) to the live domain in one action. Hostinger automatically creates a backup before publishing so you can revert if needed. Only use the manual migration plugin route if the build was done entirely in Local by Flywheel without using Hostinger staging.

**On Kinsta:** Use the MyKinsta dashboard to create a new WordPress site. Use the 1-click staging push if available, or migrate manually.

### Migration Process — Hostinger hPanel (Primary Route)

1. In hPanel, go to **WordPress → Staging**
2. Click **⋮ → Publish** next to the staging environment
3. Confirm the pop-up — this replaces the live site files and database with the staging copy
4. Hostinger creates an automatic backup before publishing — confirm BlogVault also has a recent manual backup as a secondary safety net
5. Proceed to the post-migration steps below

### Migration Process — Manual Plugin (Fallback)

If migrating from Local by Flywheel directly to the live Hostinger environment:

1. **Export from staging** — use **All-in-One WP Migration** to export the site as a `.wpress` package. Specify the live domain as the replacement URL during export so URLs are updated automatically.

2. **Import to live hosting** — install All-in-One WP Migration on the clean live WordPress installation and import the `.wpress` file.

3. **Update all URLs** — run **Better Search Replace** plugin to confirm no staging or `.local` URLs remain in the database. Search for the old domain, replace with the live domain. This step is critical — missed staging URLs break images, links, and plugin callbacks.

4. **Re-save permalink structure** — go to Settings → Permalinks and click Save Changes without making any edits. This regenerates the `.htaccess` file and prevents 404 errors on the live domain. Do this even if nothing looks wrong — it takes 10 seconds and avoids a common post-launch issue.

5. **Update Stripe webhook** — go to Stripe Dashboard → Developers → Webhooks. Confirm the webhook endpoint URL points to the live domain. If it still shows the staging URL, delete the old endpoint and add a new one pointing to `https://[clientdomain]/[plugin-webhook-path]`. Then **send a test webhook from the Stripe dashboard** and confirm it returns a 200 response before proceeding. This 30-second check eliminates the most common cause of booking failures on Day 1.

6. **Update Brevo SMTP** — confirm the plugin SMTP settings are pointing to Brevo with the live sender domain credentials (not staging).

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
- [ ] **Hostinger cache purged** — in hPanel go to WordPress → Cache → Purge Cache immediately after migration. Stale cached content can cause visitors to see old pages even after a successful Publish. Do this before any other post-launch testing.

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
7. Save — confirm status shows as Up

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

### Maintenance Calendar

Add the client to your internal monthly maintenance calendar — first working week of each month.

---

## Step 4.6 — Set Up Subscription

Create the Stripe recurring subscription on launch day.

1. In Stripe, create a new subscription for the client
2. Amount: £99/month (or £1,188/year if on annual billing)
3. Billing date: today's date (launch date)
4. Send subscription confirmation email to client — include billing date and what is covered

Template:

> *"Your monthly subscription is now active at £99/month, billed on the [date] each month. This covers hosting, security, backups, monthly maintenance, and ongoing support. You can cancel anytime with 30 days' written notice."*

Record the subscription start date in Bonsai.

---

## Step 4.7 — Onboarding Call

Schedule within 48 hours of launch. 30–45 minutes on Zoom. Start Jamie recording before the call begins.

### Agenda

1. Confirm they can log in and everything is working from their end
2. Walk through the business dashboard — viewing bookings, blocking time, editing services, reading reports
3. Walk through the customer booking experience (book a test appointment together if helpful)
4. Explain email notifications — what triggers them, how to update contact details if they change
5. Explain support — email only, 24–48hr response, what counts as an emergency
6. Explain the monthly subscription — what is included, billing date, 30-day cancellation notice
7. Answer any questions

### What to Have Ready

- Their dashboard open on your screen
- A test booking ready to walk through
- The handover pack content drafted (you will send it after the call)

Do not rush this call. A client who feels confident using the system is a client who stays.

---

## Step 4.8 — Send Handover Pack

Send within 24 hours of the onboarding call. Email contents:

- Onboarding call recording (Google Drive link or Zoom recording link)
- Written Quick-Start Guide (PDF, specific to their setup) covering:
  - How to log in
  - How to view and manage bookings
  - How to block time off
  - How to update services and prices
  - How to handle a customer cancellation
  - How to export customer data
  - How to contact support and what to expect
- Support contact and expected response time
- Subscription summary — what is included, billing date, cancellation process
- What to do if the site goes down: contact Wimbledon Smart, do not attempt fixes independently

Save the Quick-Start Guide PDF to Google Drive: `[Client Name]/Ongoing/`.

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
- [ ] Site migrated to Hostinger or Kinsta (hPanel Publish preferred; migration plugin as fallback)
- [ ] All URLs updated from staging to live domain (Better Search Replace plugin)
- [ ] Permalink structure re-saved (Settings → Permalinks → Save Changes)
- [ ] Stripe webhook updated to live domain — test webhook sent and 200 response confirmed
- [ ] Brevo SMTP confirmed on live domain
- [ ] DNS pointed — client informed before change
- [ ] SSL certificate active — padlock confirmed
- [ ] End-to-end test booking completed on live site

**Step 4.4 — Post-Launch Verification:**
- [ ] Hostinger cache purged (hPanel → WordPress → Cache → Purge Cache)
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

*Document Version: 1.1 | Updated: March 2026 — Added hPanel Publish as primary migration route; Better Search Replace named explicitly; permalink re-save added; Stripe test webhook step added; Hostinger cache purge added to post-launch verification*
*Related documents: Stage3_Build.md | Client_Delivery_Workflow.md | Tools_Stack.md | Dev_Deployment_Workflow.md*
