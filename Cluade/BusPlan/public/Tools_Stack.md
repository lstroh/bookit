# Wimbledon Smart Business — Tools Stack

**Document Version:** 1.2
**Date:** March 2026
**Status:** Active Reference
**Purpose:** All tools decided on for running the Wimbledon Smart client delivery operation — what each tool does, what it costs, and which workflow stage it supports.

---

## Quick Reference — All Tools

| Tool | Purpose | Cost | Stage(s) |
|---|---|---|---|
| **Wimbledon Smart Plugin** | Discovery call booking, client booking system | £0 (own product) | 1, 4, 5 |
| **Bonsai** | CRM, proposals, contracts, invoicing | ~£17/month (Starter) | 1, 2, 3, 4, 5, 6 |
| **Google Drive** | File storage, client folders, document archive | £0 (free) | 1, 2, 3, 4, 5, 6 |
| **Zoom** | Discovery calls, onboarding calls, client reviews | £0 (free basic) | 1, 3, 4, 6 |
| **Jamie** | Bot-free AI note-taking on calls | £0 free / ~€25/month Standard | 1, 4, 6 |
| **Brevo** | Transactional email (SMTP) + onboarding sequences | £0 (free tier) | 4, 5 |
| **Stripe** | Setup fee invoices, recurring subscription billing | ~1.5% + 25p/transaction | 2, 4, 5 |
| **FreeAgent** | UK bookkeeping, self-assessment tax | ~£19/month | Ongoing |
| **UptimeRobot** | Site uptime + SSL certificate monitoring | £0 (free tier) | 4, 5 |
| **BlogVault** | Daily offsite WordPress backups | ~£1–2/site/month | 4, 5 |
| **Wordfence** | WordPress security scanning | £0 (free tier) | 3, 4, 5 |
| **WP-Optimize** | Database optimisation — clears revisions, transients, spam | £0 (free tier) | 4, 5 |
| **Broken Link Checker** | Passive broken link detection with email alerts | £0 (free tier) | 4, 5 |
| **Local by Flywheel / WP Staging** | Staging environment for builds and updates | £0 (free) | 3, 5 |
| **Hostinger Business Cloud** | Live client site hosting — standard tier | ~£1.50/site/month | 4, 5 |
| **Kinsta Agency** | Live client site hosting — premium tier (upgrade path) | ~£11.20/site/month | 4, 5 |
| **Google Workspace** | Business email (liron@wimbledonsmart.co.uk) | ~£5/month | All stages |

---

## Tools Detail

---

### Wimbledon Smart Plugin
**What it does:** The core product. Used internally to run your own discovery call booking — prospects book their 30-minute call directly via your booking link. Also the product you deliver to clients.

**Why this tool:** Using your own product for your own discovery calls demonstrates it works, builds familiarity, and removes the need for any third-party scheduling tool (no Calendly required).

**Cost:** £0 — you built it.

**Used in:**
- Stage 1 (Step 1.1) — booking link for discovery calls sent to every prospect
- Stage 4 — the product you configure and deliver to clients
- Stage 5 — the live system you maintain for each client monthly

**Setup required:** Configure a "Discovery Call" service (30 min, 24hr minimum notice, 2-week booking window, evening/weekend availability). Auto-fire confirmation email with Zoom link and 24hr reminder.

---

### Bonsai
**What it does:** All-in-one CRM for solo operators. Manages your sales pipeline, stores prospect and client notes, sends proposals and contracts (with e-signature), raises invoices, and tracks project status.

**Why this tool:** Designed specifically for freelancers and solo service businesses. Handles the full client lifecycle from first contact to ongoing relationship in one place. Upgrade path to HoneyBook at 5+ clients for better automation and client portal.

**Cost:** ~£17/month (Starter plan).

**Used in:**
- Stage 1 — prospect record created; pipeline status tracked
- Stage 2 — contract sent and signed; Invoice 1 raised
- Stage 3 — Invoice 2 raised at design review; status updated to Awaiting Launch
- Stage 4 — Invoice 3 raised; subscription start date recorded; status updated to Live — Active Client
- Stage 5 — any issues or failed payments logged against client record
- Stage 6 — satisfaction status updated (Happy / Neutral / At Risk); upsell tags added

---

### Google Drive
**What it does:** Cloud file storage. Every client has their own folder containing all project documents, QA checklists, reports, handover packs, and correspondence archives.

**Why this tool:** Free, reliable, accessible from anywhere. The per-client folder structure means you can find anything quickly and have an audit trail if any dispute arises.

**Cost:** £0 (free tier — 15GB shared with Gmail and Google Photos; upgrade to Google One if needed).

**Used in:** All stages — file and archive everything throughout the client lifecycle.

---

### Zoom
**What it does:** Video calls for discovery, onboarding, and quarterly reviews.

**Why this tool:** Universal, free for the host on the basic plan. Clients are familiar with it. Call recording is built in on paid plans — use Jamie for note-taking on the free plan.

**Cost:** £0 (free basic — 40-minute limit on group calls; one-to-one calls unlimited).

**Used in:**
- Stage 1 — discovery call
- Stage 4 — onboarding call (record this one)
- Stage 6 — quarterly review call

---

### Jamie
**What it does:** AI meeting note-taker. Joins calls silently (no bot visible to the other party), transcribes, and produces a structured summary.

**Why this tool:** Chosen over Fathom for GDPR compliance — no bot appears in the call, no data stored on US servers by default. Lets you focus on the conversation rather than taking notes.

**Cost:** £0 free tier (limited summaries) / ~€25/month Standard at scale.

**Used in:**
- Stage 1 — discovery call notes
- Stage 4 — onboarding call notes and recording
- Stage 6 — quarterly review notes

---

### Brevo
**What it does:** Two functions: (1) SMTP email delivery — powers all transactional emails sent by the Wimbledon Smart Plugin (booking confirmations, reminders, cancellations) via each client's verified sender domain. (2) Marketing sequences — the post-launch onboarding email sequence sent to new clients.

**Why this tool:** Free tier handles high transactional volume. Single Brevo account with multiple verified client sender domains keeps costs at zero while maintaining professional per-client email identity.

**Cost:** £0 (free tier — 300 emails/day; sufficient for current volume).

**Risk note:** One Brevo account covers all client sites. If the account is suspended or has a deliverability issue, all client booking notifications stop simultaneously. Review this risk and mitigation options at 5+ active clients.

**Used in:**
- Stage 4 — verify client sender domain; activate onboarding email sequence
- Stage 5 — monthly delivery rate check via Brevo Statistics

---

### Stripe
**What it does:** Payment processing. Handles all three milestone invoices during the build and the ongoing monthly subscription after launch.

**Why this tool:** Industry standard, integrates with Bonsai for invoicing and the Wimbledon Smart Plugin for client payments.

**Cost:** ~1.5% + 25p per transaction (UK cards). No monthly fee.

**Payment milestone structure:**

| Invoice | Amount | Trigger |
|---|---|---|
| Invoice 1 | 10% of setup fee | Contract signed |
| Invoice 2 | 40% of setup fee | Design review sent |
| Invoice 3 | 50% of setup fee | Final approval received |
| Monthly subscription | £99/month | From launch date, recurring |

**Used in:**
- Stage 2 — Invoice 1 raised after contract signed
- Stage 3 — Invoice 2 raised at design review
- Stage 4 — Invoice 3 raised before go-live; recurring subscription activated on launch day
- Stage 5 — auto-retries failed payments; manual follow-up if unresolved after 7 days

---

### FreeAgent
**What it does:** UK bookkeeping for a sole trader. Tracks income and expenses, prepares self-assessment tax return, connects to your bank account.

**Why this tool:** Designed specifically for UK freelancers and sole traders. Handles self-assessment, which is non-negotiable as a sole trader.

**Cost:** ~£19/month (sole trader plan). Often available free for the first year via certain UK banks.

**Used in:** Ongoing — not tied to a specific delivery stage. Run monthly reconciliation, use at year-end for self-assessment.

---

### UptimeRobot
**What it does:** Monitors every live client site every 5 minutes. Sends an email alert if a site goes down. Also monitors SSL certificate expiry and alerts if a certificate is approaching renewal.

**Why this tool:** Free for up to 50 monitors with 5-minute checks. Gives you visibility of client site health — both uptime and SSL status — without any manual checking between maintenance windows.

**Cost:** £0 (free tier — sufficient for up to 50 sites).

**Used in:**
- Stage 4 — add site to UptimeRobot on launch day; enable SSL monitoring toggle on the monitor
- Stage 5 — monthly review of uptime report and SSL status per client; investigate and resolve any incidents

**Alert threshold:** Investigate immediately on any downtime alert. Notify client only if downtime exceeds 15 minutes. Flag SSL expiry if under 30 days to renewal (should auto-renew on Hostinger, but confirm).

---

### BlogVault
**What it does:** Daily automated offsite backups for every WordPress site. One-click restore if something goes wrong.

**Why this tool:** WordPress sites can break after plugin updates. Having a clean daily backup means you can restore in minutes rather than hours. Offsite storage means the backup is safe even if the server has a problem.

**Cost:** ~£1–2/site/month.

**Used in:**
- Stage 4 — add site to BlogVault on launch day; confirm first daily backup completes
- Stage 5 — monthly check that all daily backups completed; quarterly backup restoration test to confirm recoverability

---

### Wordfence
**What it does:** WordPress security plugin. Blocks malicious login attempts, scans for malware, alerts you to security issues including abandoned or vulnerable plugins.

**Why this tool:** Free tier is sufficient for your client sites. Runs weekly scans automatically and sends email alerts for anything requiring action.

**Cost:** £0 (free tier).

**Used in:**
- Stage 3 — install and activate during build phase
- Stage 4 — confirm active on launch day; run full scan
- Stage 5 — review weekly scan results during monthly maintenance window; quarterly plugin audit uses Wordfence vulnerability flags

---

### WP-Optimize
**What it does:** Database maintenance plugin. Clears post revisions, auto-drafts, expired transients, and spam comments that accumulate over time and slow database queries.

**Why this tool:** WordPress databases grow with unnecessary data — post revisions alone can run to hundreds of rows per page. Left unmanaged this degrades query performance. WP-Optimize runs the cleanup in one click and can be scheduled automatically.

**Cost:** £0 (free tier — sufficient for maintenance needs).

**Used in:**
- Stage 4 — install on launch day; enable weekly scheduled clean-up; run baseline optimisation
- Stage 5 — manual run as part of Step 5.4 monthly housekeeping

---

### Broken Link Checker
**What it does:** Passively scans every live client site for broken internal and external links. Sends an email alert when new broken links are detected.

**Why this tool:** Service business websites lose links over time — staff leave, services change, external sites go offline. A broken link on a client's site reflects poorly on them and on you. This plugin catches them automatically without any monthly manual checking.

**Cost:** £0 (free tier).

**Used in:**
- Stage 4 — install on launch day; confirm active and scanning; set email alerts to your address
- Stage 5 — review any flagged links as part of Step 5.4 monthly housekeeping; fix internal links, note external links for client

---

### Local by Flywheel / WP Staging
**What it does:** Creates a staging environment — a private copy of a WordPress site where you can test changes, updates, and new builds before pushing anything to the live site.

**Why this tool:** Never update a live client site directly. Always test on staging first. Staging prevents you from accidentally breaking a client's live booking system during a plugin update.

**Cost:** £0 (both free tools).

**Used in:**
- Stage 3 — build the entire site on staging before the client sees it
- Stage 5 — apply all WordPress core and plugin updates to staging first, test the full booking flow, then push to live. Refresh staging from live at the start of each monthly update session.

---

### Hostinger Business Cloud — Standard Hosting Tier

**What it does:** Live hosting for all standard client sites. This is where every built and approved site lives once it goes live.

**Why this tool:** Hostinger Business Cloud hosts up to 300 WordPress sites on a single account at ~£1.50 per site per month. UK-based servers (London), LiteSpeed caching, daily backups included, and free SSL certificates. The per-client cost is low enough that it comfortably fits within your £99/month subscription margin.

**Cost:** £14.99/month for the Business Cloud account — covering up to 300 sites. Per-client cost: approximately £1.50/site/month.

**Suitable for:** Clients with 1–4 concurrent dashboard users and under 50 bookings per day. This covers the vast majority of your target clients — salons, therapists, coaches, photographers with small teams.

**Performance expectations:**
- Page load time: 1.5–3 seconds
- Dashboard load: 2–4 seconds
- Concurrent dashboard users: up to 3–5 comfortably
- Uptime SLA: 99.9%

**Included features:**
- Daily backups (14-day retention) — BlogVault still used as a second offsite backup layer
- Free SSL (Let's Encrypt) with auto-renewal
- LiteSpeed caching
- Staging environment (hPanel Publish used as primary migration route)
- WordPress CLI access

**Used in:**
- Stage 4 — migrate from staging to Hostinger on launch day; point DNS
- Stage 5 — hosting management, updates, and maintenance

---

### Kinsta Agency — Premium Hosting Tier (Upgrade Path)

**What it does:** Premium hosting for clients who outgrow Hostinger. Isolated container per site on Google Cloud Platform (London), significantly faster performance, and better handling of high concurrent dashboard usage.

**Why this tool:** When a client has 5+ staff using the dashboard simultaneously, or is running paid advertising driving unpredictable traffic spikes, Hostinger shared hosting can slow under the combined load. Kinsta's isolated containers mean one client's activity never affects another site.

**Cost:** ~$280/month for 20 WordPress installs on the Agency plan — approximately £11.20/site/month at current rates.

**When to upgrade a client from Hostinger to Kinsta:**

| Trigger | Detail |
|---|---|
| 5+ concurrent dashboard users | Multiple staff simultaneously using the system |
| 50+ bookings per day consistently | Higher database query load |
| Running paid ads (Google/Facebook) | Unpredictable traffic spikes |
| Dashboard consistently slow | Client or staff complaints about load times |
| WooCommerce shop added | eCommerce requires isolated resources |

**Performance expectations:**
- Page load time: 0.5–1.5 seconds
- Dashboard load: under 2 seconds regardless of data volume
- Concurrent dashboard users: 10+ comfortably
- Uptime SLA: 99.95%

**Used in:** Stage 4 and Stage 5 — for clients assessed as needing premium hosting at discovery, or migrated up from Hostinger later.

---

### Google Workspace
**What it does:** Business email at your domain (e.g. liron@wimbledonsmart.co.uk). Also provides Google Drive, Docs, and Calendar.

**Why this tool:** Professional email address is essential for client-facing communication and domain credibility.

**Cost:** ~£5/month (Business Starter plan).

**Note on client email:** Staff members at client sites do not need Google Workspace. They log into the booking dashboard with their personal email (e.g. sarah@gmail.com) and receive booking notifications at that personal address. Only the business owner — and a receptionist if there is one — needs a professional business email address.

For clients who want professional email setup, refer to `Infrastructure_Reference.md` for the full options — Microsoft 365, Google Workspace reseller, or free cPanel forwarding with Gmail Send As.

**Used in:** All stages — all client communication sent from liron@wimbledonsmart.co.uk.

---

## Tools by Stage — Cross-Reference

| Stage | Tools Used |
|---|---|
| **Stage 1 — Pre-Sale** | Wimbledon Smart Plugin (booking), Bonsai (CRM), Google Drive (folder), Zoom (discovery call), Jamie (note-taking), Google Workspace (email) |
| **Stage 2 — Onboarding** | Bonsai (contract, Invoice 1), Stripe (payment), Google Drive (questionnaire, brief) |
| **Stage 3 — Build** | Local by Flywheel / WP Staging (staging), Wordfence (security), Bonsai (Invoice 2, status), Google Drive (QA checklist) |
| **Stage 4 — Launch** | Hostinger or Kinsta (live hosting), Stripe (Invoice 3, subscription), Brevo (sender domain, onboarding sequence), UptimeRobot (uptime + SSL monitoring), BlogVault (backups), WP-Optimize (database maintenance), Broken Link Checker (link monitoring), Wordfence (security scan), Wimbledon Smart Plugin (live), Jamie (onboarding call notes), Zoom (onboarding call) |
| **Stage 5 — Monthly** | UptimeRobot (uptime + SSL review), BlogVault (backup check + quarterly restore test), Wordfence (scan review), Brevo (delivery check), WP-Optimize (database cleanup), Broken Link Checker (broken link review), Local by Flywheel / WP Staging (update testing), Stripe (payment monitoring), Hostinger or Kinsta (hosting management) |
| **Stage 6 — Quarterly** | Zoom (review call), Jamie (note-taking), Bonsai (satisfaction status, upsell tags) |

---

## Total Monthly Tool Cost

| Tool | Monthly Cost |
|---|---|
| Bonsai (Starter) | ~£17 |
| Google Workspace | ~£5 |
| FreeAgent | ~£19 |
| Hostinger Business Cloud (account) | ~£15 (covers all standard client sites up to 300) |
| Jamie (free to start) | £0 → ~£21 at scale |
| BlogVault (per client site) | ~£1–2 per site |
| WP-Optimize | £0 |
| Broken Link Checker | £0 |
| All other tools | £0 |
| **Total (no clients yet)** | **~£56/month** |
| **Total (5 active clients on Hostinger)** | **~£71/month** |
| **Total (10 active clients on Hostinger)** | **~£82/month** |

**Note on Hostinger:** The £14.99/month account fee is fixed regardless of how many sites you host — up to 300. Your per-client cost drops as you add more clients. At 10 clients it is ~£1.50/site; at 3 clients it is ~£5/site. Factor this into early-client margin calculations.

**Note on Kinsta:** If any client requires premium hosting, add ~£11.20/month per site. The £99/month subscription provides enough margin to absorb this without a price change. For exceptional cases with very high traffic or large teams, surface it as a transparent line item.

**Note on WP-Optimize and Broken Link Checker:** Both are free WordPress plugins installed on each client site — no additional cost per site. They add no meaningful server overhead.

---

*Document Version: 1.2 | Updated: March 2026*
*Changes from v1.1: Added WP-Optimize entry (Quick Reference, Tools Detail, Tools by Stage, cost table); added Broken Link Checker entry (Quick Reference, Tools Detail, Tools by Stage, cost table); updated UptimeRobot entry to reflect SSL monitoring; updated BlogVault entry to reflect quarterly restore test; updated Wordfence entry to reflect quarterly plugin audit use; updated Local by Flywheel entry to reflect staging refresh requirement.*
*Related documents: Stage4_Launch.md | Stage5_6_OngoingAndReview.md | Client_Delivery_Workflow.md | Infrastructure_Reference.md*
