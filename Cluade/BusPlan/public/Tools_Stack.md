# Wimbledon Smart Business — Tools Stack

**Document Version:** 1.0
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
| **UptimeRobot** | Site uptime monitoring | £0 (free tier) | 5 |
| **BlogVault** | Daily offsite WordPress backups | ~£1–2/site/month | 5 |
| **Wordfence** | WordPress security scanning | £0 (free tier) | 5 |
| **Local by Flywheel / WP Staging** | Staging environment for builds and updates | £0 (free) | 3, 5 |
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

**Why this tool:** Designed specifically for freelancers and solo service businesses. Covers proposals, contracts, and invoicing natively without needing separate tools. Upgrade path to HoneyBook at 5+ active clients.

**Cost:** ~£17/month (Starter plan). Upgrade to HoneyBook (~£30/month) when you reach 5+ active clients — HoneyBook's automation at that scale saves several hours per week.

**Used in:**
- Stage 1 — prospect records, CRM status tracking, pre-call research notes, follow-up task reminders
- Stage 2 — contract creation and e-signature, Invoice 1 (10%)
- Stage 3 — project status tracking, Invoice 2 (40%)
- Stage 4 — Invoice 3 (50%), subscription setup confirmation
- Stage 5 — active client records, payment issue tracking
- Stage 6 — satisfaction status, upsell tagging, churn tracking

**Key setup tasks:**
- Create prospect record template with pre-call research notes fields
- Set up task template: "Pre-call research — 15 min" to auto-attach when status moves to Qualified
- Set up task template: "Send proposal" to fire next day after discovery call
- Set up follow-up cadence tasks (Day 3, 7, 14) to auto-attach when status moves to Proposal Sent
- Create contract template (have reviewed by UK solicitor before first use)
- Create proposal template

**CRM status labels to use:**

| Status | When |
|---|---|
| New Lead | Enquiry received, not yet replied |
| Contacted | Initial reply sent, call not booked |
| Qualified | Discovery call booked |
| Proposal Sent | Proposal emailed |
| Active Project | Confirmed — build started |
| Live — Active Client | Site launched, on subscription |
| Payment Issue | Failed payment |
| Upsell Opportunity | Eligible for SMS / marketing / refresh |
| At Risk | Churn signals noted |
| Churned | Cancelled |
| Win-Back | Former client — check in after 6 months |
| Lost — No Response | No reply after Day 14 |
| Lost — Not a Fit | Disqualified at discovery |

---

### Google Drive
**What it does:** File storage and document archive for every client engagement. One folder per client, structured consistently.

**Why this tool:** Free, reliable, universally accessible, integrates with Google Workspace.

**Cost:** £0 (free, included with Google Workspace account).

**Used in:** All stages — create client folder at first contact, populate throughout.

**Folder structure to use for every client:**
```
[Business Name]/
  ├── Brief & Assets/       (logo, photos, content, questionnaire responses)
  ├── Proposal/             (proposal email copy, any attachments)
  ├── Contracts/            (signed contract PDF)
  ├── Build/                (QA checklist, revision log, approval email)
  └── Ongoing/              (monthly reports, support tickets, review notes)
```

**Key rule:** Create the folder when you first reply to an enquiry (Step 1.1). Don't wait until the build starts.

---

### Zoom
**What it does:** Video calls for discovery calls (Stage 1), onboarding calls (Stage 4), and quarterly reviews (Stage 6).

**Why this tool:** Industry standard. Prospects and clients already have it. Integrates with Google Calendar for auto-generated meeting links.

**Cost:** £0 (free plan). Free plan limits calls to 40 minutes for group calls — fine for all your use cases since all calls are 1:1 or small groups.

**Used in:**
- Stage 1 (Step 1.3) — discovery calls
- Stage 4 — onboarding call at launch
- Stage 6 — quarterly review calls

**Setup:** Connect to Google Calendar so Zoom links auto-generate when you book calls via your Wimbledon Smart Plugin.

---

### Jamie
**What it does:** Bot-free AI note-taker. Captures your call audio directly from your device — no bot joins the meeting, nothing visible to the prospect. Transcribes in real time and generates a clean summary with action items within minutes of the call ending.

**Why this tool:** Preferred over Fathom (the leading alternative) because it requires no bot participant in the call, which keeps discovery calls feeling natural and personal. GDPR-compliant, data stored in Germany, audio deleted after transcription. Works on Mac and Windows across any platform — Zoom, Google Meet, in-person.

**Why not Fathom:** Fathom is technically superior on features and completely free with unlimited recordings, but joins calls as a visible bot participant. This can make prospects self-conscious and disrupts the natural conversation flow on discovery calls — exactly where you need the most authentic interaction.

**Cost:**
- **Free plan** — 10 meetings/month, 30-minute limit per meeting. Sufficient for your current volume (2–3 discovery calls + a handful of client calls per month).
- **Standard plan** — €25/month (~£21), 20 meetings/month, 2-hour limit. Upgrade when active client calls alongside discovery calls push past the free tier.

**When to upgrade:** When you have 5+ active clients running monthly check-ins alongside new discovery calls — probably around Month 9–12.

**Used in:**
- Stage 1 (Step 1.3) — note-taking on discovery calls. Frees you to focus entirely on listening rather than writing.
- Stage 4 — note-taking on onboarding calls. Generates a summary you can send to the client as a record of what was covered.
- Stage 6 — note-taking on quarterly review calls. Summary feeds directly into your post-call actions and Bonsai record.

**Key setup tasks:**
- Download desktop app (Mac or Windows)
- Connect to Google Calendar so Jamie knows when calls are starting
- Set default summary template to "Sales Call" or "Discovery Call"
- After each call: copy the Jamie summary into the relevant Bonsai record notes field

**How to use it on a discovery call:**
1. Start Jamie recording before joining Zoom
2. Run the call normally — no mention of recording needed (Jamie captures your device audio, not the call itself — though best practice is to mention you're taking notes)
3. After the call ends, Jamie summary arrives within minutes
4. Review and paste the key fields into your Bonsai call summary template

---

### Brevo
**What it does:** Two things. First, transactional email — the SMTP relay that sends all booking notification emails from your clients' own domains (confirmations, reminders, cancellations). Second, marketing/onboarding email sequences — the automated welcome emails new clients receive after launch.

**Why this tool:** Already integrated into the Wimbledon Smart Plugin for transactional email. Free tier covers both use cases at current volume.

**Cost:** £0 (free tier — up to 300 emails/day, unlimited contacts).

**Risk to note:** One Brevo account covers all client sites. If the account is suspended or has a deliverability issue, all client booking notifications stop simultaneously. Review this risk and mitigation options when you reach 5+ active clients.

**Used in:**
- Stage 4 — configure client's verified sender domain during launch; activate client onboarding email sequence
- Stage 5 — monthly check that email delivery is working for all active clients

**Onboarding sequence to set up (fires from launch date):**

| Day | Email | Purpose |
|---|---|---|
| Day 0 | Welcome — you're live | Celebrate launch, link to dashboard |
| Day 2 | Have you tested your first booking? | Encourage a test, link to tutorial |
| Day 5 | Tips for reducing no-shows | Reminder settings, cancellation policy |
| Day 30 | One month in — here's what to check | Reports overview, prompt to reach out |

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

**Failed payment process:**
1. Stripe auto-retries after 3 days
2. Still failed: email client to update payment method
3. Unresolved after 7 days: manual follow-up call or email
4. Unresolved after 14 days: suspend services (site offline, hosting paused)
5. Resume immediately on payment — do not delete data

---

### FreeAgent
**What it does:** UK bookkeeping for a sole trader. Tracks income and expenses, prepares self-assessment tax return, connects to your bank account.

**Why this tool:** Designed specifically for UK freelancers and sole traders. Handles self-assessment, which is non-negotiable as a sole trader.

**Cost:** ~£19/month (sole trader plan). Often available free for the first year via certain UK banks.

**Used in:** Ongoing — not tied to a specific delivery stage. Run monthly reconciliation, use at year-end for self-assessment.

---

### UptimeRobot
**What it does:** Monitors every live client site every 5 minutes. Sends an email and SMS alert if a site goes down.

**Why this tool:** Free for up to 50 monitors with 5-minute checks. Gives you visibility of client site health without any manual checking.

**Cost:** £0 (free tier — sufficient for up to 50 sites).

**Used in:**
- Stage 4 — add site to UptimeRobot on launch day
- Stage 5 — monthly review of uptime report per client; investigate and resolve any incidents

**Alert threshold:** Investigate immediately on any downtime alert. Notify client only if downtime exceeds 15 minutes.

---

### BlogVault
**What it does:** Daily automated offsite backups for every WordPress site. One-click restore if something goes wrong.

**Why this tool:** WordPress sites can break after plugin updates. Having a clean daily backup means you can restore in minutes rather than hours. Offsite storage means the backup is safe even if the server has a problem.

**Cost:** ~£1–2/site/month.

**Used in:**
- Stage 4 — add site to BlogVault on launch day; confirm first daily backup completes
- Stage 5 — monthly check that all daily backups completed; restore test if needed

---

### Wordfence
**What it does:** WordPress security plugin. Blocks malicious login attempts, scans for malware, alerts you to security issues.

**Why this tool:** Free tier is sufficient for your client sites. Runs weekly scans automatically and sends email alerts for anything requiring action.

**Cost:** £0 (free tier).

**Used in:**
- Stage 3 — install and activate during build phase
- Stage 4 — confirm active on launch day
- Stage 5 — review weekly scan results during monthly maintenance window

---

### Local by Flywheel / WP Staging
**What it does:** Creates a staging environment — a private copy of a WordPress site where you can test changes, updates, and new builds before pushing anything to the live site.

**Why this tool:** Never update a live client site directly. Always test on staging first. Staging prevents you from accidentally breaking a client's live booking system during a plugin update.

**Cost:** £0 (both free tools).

**Used in:**
- Stage 3 — build the entire site on staging before the client sees it
- Stage 5 — apply all WordPress core and plugin updates to staging first, test the full booking flow, then push to live

---

### Google Workspace
**What it does:** Business email at your domain (e.g. liron@wimbledonsmart.co.uk). Also provides Google Calendar, Google Drive, and Google Meet as part of the package.

**Why this tool:** A Gmail address would look unprofessional when sending proposals and contracts to clients. A branded email address costs £5/month and immediately signals that this is a real business.

**Cost:** ~£5/month (Business Starter plan).

**Used in:** All stages — every email to prospects and clients goes from your business address.

---

## Tools by Stage — Cross-Reference

| Stage | Tools Used |
|---|---|
| **Stage 1 — Pre-Sale** | Wimbledon Smart Plugin (booking), Bonsai (CRM), Google Drive (folder), Zoom (discovery call), Jamie (note-taking), Google Workspace (email) |
| **Stage 2 — Onboarding** | Bonsai (contract, Invoice 1), Stripe (payment), Google Drive (questionnaire, brief) |
| **Stage 3 — Build** | Local by Flywheel / WP Staging (staging), Wordfence (security), Bonsai (Invoice 2, status), Google Drive (QA checklist) |
| **Stage 4 — Launch** | Stripe (Invoice 3, subscription), Brevo (sender domain, onboarding sequence), UptimeRobot (monitoring setup), BlogVault (backups), Wimbledon Smart Plugin (live), Jamie (onboarding call notes), Zoom (onboarding call) |
| **Stage 5 — Monthly** | UptimeRobot (uptime review), BlogVault (backup check), Wordfence (scan review), Brevo (delivery check), Local by Flywheel / WP Staging (update testing), Stripe (payment monitoring) |
| **Stage 6 — Quarterly** | Zoom (review call), Jamie (note-taking), Bonsai (satisfaction status, upsell tags) |

---

## Total Monthly Tool Cost

| Tool | Monthly Cost |
|---|---|
| Bonsai (Starter) | ~£17 |
| Google Workspace | ~£5 |
| FreeAgent | ~£19 |
| Jamie (free to start) | £0 → ~£21 at scale |
| BlogVault (per client site) | ~£1–2 per site |
| All other tools | £0 |
| **Total (no clients yet)** | **~£41/month** |
| **Total (5 active clients)** | **~£66/month** |
| **Total (10 active clients)** | **~£82/month** |

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Client_Delivery_Workflow.md | Stage1_PreSale_Guide.md | 12_Month_Business_Plan.md*
