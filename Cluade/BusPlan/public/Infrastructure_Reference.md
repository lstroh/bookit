# Infrastructure Reference
## Wimbledon Smart Business — Hosting, Email, and Services Strategy

**Document Version:** 1.0
**Date:** March 2026
**Status:** Reference Only — Not Active Workflow
**Purpose:** Full infrastructure research and options for Phase 2 planning. The decisions relevant to Phase 1 (first 10 clients) are summarised in Tools_Stack.md. This document contains the full detail for when you are ready to scale, add premium client tiers, or introduce services like SMS, Microsoft 365 reselling, or paid advertising infrastructure.

---

## How to Use This Document

**Right now (Phase 1 — first 10 clients):** Use Tools_Stack.md. Everything you need for standard client delivery is there.

**When you reach 5+ active clients:** Come back to the Brevo risk section and the email reseller options.

**When a client asks for premium infrastructure, eCommerce, or SMS:** Come back to the relevant section here.

**When you are ready to build a premium service tier:** The full cost structures, vendor links, and decision frameworks in this document give you everything to design it.

---

## Phase 1 Decisions Already Made (Summary)

These are the infrastructure decisions already embedded in the active workflow. They are recorded here for completeness.

| Decision | Choice | Rationale |
|---|---|---|
| Standard hosting | Hostinger Business Cloud (~£1.50/site/month) | UK servers, sufficient for 1–4 concurrent dashboard users, cost-effective margin |
| Premium hosting trigger | Kinsta Agency (~£11.20/site/month) | 5+ concurrent users, paid ads, or WooCommerce |
| Transactional email | Brevo shared account (free tier) | Single account, multiple verified sender domains, sufficient for current volume |
| Staff email | Personal email only | Staff log in with personal email; only owner/receptionist need business email |
| SMS | Phase 2 upsell — not included yet | Brevo SMS pay-as-you-go when ready |

---

## Hosting — Full Detail

### Why Dashboard Load Drives the Hosting Decision

The Wimbledon Smart Plugin has significantly higher server load than a typical WordPress site because of the Vue.js business dashboard. Unlike a standard website where users load pages, the dashboard makes continuous API calls to the WordPress REST API — on load, on auto-refresh, and every time a staff member takes an action.

**The load pattern that matters:**

A 7-staff salon at 9am with all staff checking their schedules simultaneously, a manager running a report, and customers booking online at the same time generates a combined database query load that shared hosting handles poorly. The result is slow dashboard load times (5–10 seconds instead of under 1), failed customer bookings, and risk of double-bookings under race conditions.

**The key qualification question:** How many staff members log into the dashboard simultaneously during busy periods?

- 1–4 concurrent users → Hostinger is fine
- 5+ concurrent users → Kinsta recommended

### Hostinger Business Cloud — Full Specification

**Product:** Business Cloud Hosting
**Price:** £14.99/month for 300 websites (~£1.50/site)
**Server Location:** London, UK
**Technology:** LiteSpeed web server, CloudLinux OS (resource isolation per account), 200 GB NVMe storage
**Uptime SLA:** 99.9% (~43 minutes downtime/month)
**Support:** 24/7 live chat
**Link:** https://www.hostinger.co.uk/wordpress-hosting

**Best for:** 1–4 staff, under 50 bookings/day, light dashboard usage

**Limitations:**
- Shared hosting — resource limits apply at peak
- No white-label reseller programme
- 100 concurrent connections per account limit

### Kinsta Agency Partner — Full Specification

**Product:** Agency Hosting Plan
**Price:** $280/month for 20 WordPress installs (~£11.20/site at £1=$1.25)
**Server:** Google Cloud Platform, London region
**Technology:** Isolated LXD container per site, NGINX, Cloudflare CDN included
**Uptime SLA:** 99.95% (~22 minutes downtime/month)
**Support:** 24/7 chat with WordPress specialists
**Link:** https://kinsta.com/agency-partner-program/

**Best for:** 5+ concurrent dashboard users, paid ad traffic, WooCommerce, performance-critical clients

**Premium features:**
- Isolated resources — no "noisy neighbour" problem
- Free agency site hosting (your own wimbledonsmart.co.uk)
- Partial white-label (remove Kinsta branding from WP admin)
- 10% lifetime commission on client referrals
- One-click staging environments

**Important limitation:** No full white-label reseller programme. You cannot invoice clients directly for "Kinsta hosting" — you manage and pay for it, then pass the cost through in the monthly subscription.

### Hosting Decision Matrix

| Factor | Hostinger | Kinsta |
|---|---|---|
| Monthly cost per site | ~£1.50 | ~£11.20 |
| Concurrent dashboard users | 1–4 comfortable | 10+ comfortable |
| Bookings per day | Under 50 | 50–150+ |
| Page load time | 1.5–3 seconds | 0.5–1.5 seconds |
| Dashboard load time | 2–4 seconds | Under 2 seconds |
| Running paid ads | Not recommended | Recommended |
| WooCommerce shop | Not recommended | Required |
| Uptime SLA | 99.9% | 99.95% |

### Booking Payments Are Not eCommerce

An important distinction that affects the hosting decision:

**Booking deposits and payments via Stripe Checkout are NOT eCommerce.** When a customer books and pays a deposit, they are redirected to Stripe's hosted payment page — the payment processing happens on Stripe's servers, not yours. Your server receives a webhook: "payment confirmed." This generates minimal load and works fine on Hostinger.

**WooCommerce IS eCommerce.** If a client wants to sell products (hair products, skincare, gift cards with a shopping cart), WooCommerce runs entirely on your server — browsing, cart, checkout, inventory. This requires Kinsta regardless of team size.

**Exception:** 1–3 simple "Buy Now" Stripe links (no shopping cart, no WooCommerce) — fine on Hostinger.

---

## Email Services — Full Detail

### The Staff Email Insight

Only the business owner and receptionist (if separate) need a professional business email address. All other staff:
- Log into the dashboard with their personal email (sarah@gmail.com)
- Receive booking notifications at their personal email
- Sync bookings to their personal Google Calendar

**Email account count by business size:**

| Business Size | Email Accounts Needed |
|---|---|
| Solo practitioner | 1 (owner only) |
| 2–4 staff | 1–2 (owner + reception if applicable) |
| 5–8 staff | 2 (owner + admin/reception) |
| 10+ staff | 2–3 (owner + reception + manager) |

Email cost scales with roles that send business correspondence — not with team headcount.

### Option 1 — cPanel Forwarding with Gmail Send As (Free)

**Best for:** Budget-conscious clients, solo practitioners, owner comfortable with Gmail

**How it works:**
1. Create email forwarding in cPanel: bookings@salonname.com → owner@gmail.com
2. Configure Gmail "Send As" feature to reply from bookings@salonname.com
3. Owner receives in Gmail, replies appear from the business address

**Setup steps:**
1. cPanel → Email → Forwarders → Create forwarder
2. Gmail Settings → Accounts and Import → Add another email address
3. Enter business email address
4. Configure outgoing SMTP with cPanel credentials
5. Verify ownership via confirmation email
6. Set as default Send As

**Cost to client:** £0/month
**One-time setup fee you might charge:** £25

**Limitations:** Slight deliverability risk (Gmail sending via cPanel SMTP), not suitable if multiple people need to send from the same address.

### Option 2 — Microsoft 365 via CSP Reseller (Recommended for Professional Clients)

**Best for:** Established businesses wanting professional email, clients who use Office (Word, Excel), 1–2 people need to send business emails

**Why Microsoft 365 for UK market:** ~80% of UK small businesses use Microsoft Office. Familiarity with Outlook drives adoption.

**CSP (Cloud Solution Provider) programme:** You purchase Microsoft 365 licenses at wholesale through an authorised distributor and resell to clients at your own retail price. You manage billing; clients pay you.

**Pricing structure:**

| Plan | Your Wholesale Cost | Suggested Retail | Margin/User |
|---|---|---|---|
| Microsoft 365 Basic | £4.80/user/month | £8/user/month | £3.20 |
| Microsoft 365 Standard | £9.60/user/month | £15/user/month | £5.40 |

**Recommended plans:**
- Basic: web-only Office apps, 50 GB mailbox, OneDrive 1 TB, Teams
- Standard: everything in Basic plus full desktop Office installation (Word, Excel, PowerPoint, Outlook installed on computer)

**To join the CSP programme:**
1. Register as a UK company with a business bank account
2. Apply through a Microsoft-authorised distributor (not directly to Microsoft)
3. Sherweb is recommended for UK — strong support, GBP billing, easy onboarding
4. Verification takes 2–3 weeks

**Recommended UK distributor:**
- **Sherweb** — https://www.sherweb.com/partners/csp-program/
- UK-based support, GBP portal, also resells Google Workspace

**CSP rules to know:**
- Each client must have their own separate subscription — you cannot pool licenses across clients
- You provide Level 1 support (password resets, setup); distributor provides Level 2
- No minimum spend, no minimum license count

**When to set this up:** When you have 3+ active clients asking for professional email. Not worth the CSP application overhead for 1–2 clients — use cPanel forwarding or direct Google Workspace signup in those early cases.

### Option 3 — Google Workspace Reseller

**Best for:** Tech-savvy clients, businesses already in the Google ecosystem, mobile-first teams

**Pricing (via Sherweb — same distributor as Microsoft):**

| Plan | Your Wholesale Cost | Suggested Retail | Margin/User |
|---|---|---|---|
| Business Starter | £4.80/user/month | £8/user/month | £3.20 |
| Business Standard | £9.60/user/month | £15/user/month | £5.40 |

**Recommended plans:**
- Business Starter: Gmail 30 GB, Drive 30 GB per user, Docs/Sheets/Slides, Meet
- Business Standard: Gmail 2 TB, Drive 2 TB per user, Meet recording

**Link:** https://www.sherweb.com/partners/google-workspace

**Choose Microsoft vs Google based on:** What the client currently uses. If they have Office installed and use Excel, Microsoft. If they live in Chrome and Google Drive, Google.

---

## Transactional Email — Full Detail

### Brevo Multi-Client Setup

The shared Brevo account model means one Brevo account sends transactional email for all clients using their own verified sender domains.

**How multiple sender domains work:**
1. One Brevo account (your agency account)
2. Add a verified sender domain per client: noreply@salon1.com, bookings@clinic2.co.uk, etc.
3. Each domain verified via DNS records (SPF, DKIM)
4. Plugin sends from the correct domain per client
5. All emails tracked in one Brevo dashboard

**DNS configuration required per client domain:**
```
TXT record:   v=spf1 include:spf.sendinblue.com ~all
CNAME record: mail._domainkey → mail._domainkey.sendinblue.com
CNAME record: sendinblue-code → sendinblue.com
```

**Brevo plan capacity:**

| Plan | Cost | Emails/Month | Clients Supported (est.) |
|---|---|---|---|
| Free | £0 | 9,000 (300/day) | 1–3 clients (low volume) |
| Lite | ~£21/month | 20,000 | 20–25 clients comfortably |
| Standard | ~£55/month | 20,000 + automation | Agencies managing campaigns |

**When to upgrade from free to Lite:** When you have 4+ active clients with regular booking volumes. At 20 clients the Lite plan costs £1.05/client/month — negligible.

**Brevo white-label status:** Brevo discontinued their white-label reseller programme in 2023. You cannot rebrand Brevo as your own service. You manage one account; clients do not need to know Brevo is involved. Bill clients for "email delivery" as part of the monthly subscription — do not itemise Brevo specifically.

### Single Account Risk

One Brevo account for all clients means a single point of failure. If the account is suspended (e.g. spam complaint triggers a review), all clients' booking notification emails stop simultaneously.

**Mitigation options to consider at 5+ active clients:**
- Maintain a secondary Brevo account as a backup, ready to switch DNS
- Monitor Brevo sender reputation monthly (bounce rate, complaint rate)
- Document the DNS re-pointing process so you can action it quickly if needed
- Consider separate accounts per client at 10+ clients (higher cost, better isolation)

---

## SMS Services — Phase 2 Upsell

### Brevo SMS

**Why Brevo SMS:** Same platform as transactional email. Pay-as-you-go with no monthly minimum. Credits never expire. UK regulations (GDPR + PECR) compliance built in.

**UK pricing:** £3.45 per 100 SMS (3.45p per message). Standard booking reminders are typically 120–140 characters = 1 credit each.

**Use cases to introduce at 6 months post-launch:**
- 24-hour appointment reminder (reduces no-shows by 30–40%)
- Last-minute cancellation alert to waitlist
- Booking confirmation SMS (immediate reassurance)

**UK regulatory requirements:**
- Transactional SMS (reminders, confirmations): consent implied by booking — OK to send
- Marketing SMS (promotions, offers): explicit opt-in required at booking
- Every SMS must include opt-out: "Reply STOP to unsubscribe"
- Honour opt-outs within 24 hours
- Marketing SMS hours: weekdays 8am–9pm, weekends 10am–6pm
- Transactional SMS: can send 24/7

**Suggested SMS package pricing (when you introduce it):**

| Package | Your Price | SMS Included | Your Cost | Margin |
|---|---|---|---|---|
| Basic | £15/month | 100 SMS | £3.45 | £11.55 |
| Standard | £25/month | 300 SMS | £10.35 | £14.65 |
| Pro | £50/month | 1,000 SMS | £34.50 | £15.50 |

**Alternative:** Pass-through pricing at cost + 50% markup. More transparent, scales automatically with usage.

---

## Premium Client Stack — Phase 2 Reference

When you are ready to offer a premium service tier, the infrastructure stack looks like this:

| Component | Provider | Your Cost | Notes |
|---|---|---|---|
| Hosting | Kinsta Agency | ~£11.20/site/month | Isolated container, Google Cloud |
| Business email | Microsoft 365 Standard (2 users) | £19.20/month | Owner + admin, desktop Office apps |
| Transactional email | Brevo Lite (shared) | ~£1.05/month allocated | Same shared account |
| Marketing email | Brevo Standard | £15/month | You manage campaigns for client |
| SMS | Brevo SMS (300/month) | ~£10.35/month | Standard package |
| Backups | BlogVault | ~£2/month | Daily offsite |
| Security | Wordfence Premium | ~£8/month | Advanced firewall + malware removal |

**Approximate total cost per premium client:** ~£67/month
**Suggested premium monthly subscription:** £150–180/month
**Gross margin:** ~55–60%

This is Phase 2 territory. Do not introduce it until you have 5+ standard clients live and the delivery process is running smoothly.

---

## Financial Reference — Infrastructure Costs by Scale

| Scale | Standard Clients | Hostinger Cost | Brevo Cost | Total Hosting + Email |
|---|---|---|---|---|
| 0 clients | 0 | £14.99 (account) | £0 | £14.99/month |
| 3 clients | 3 | £14.99 (account) | £0 | £14.99/month |
| 5 clients | 5 | £14.99 (account) | £0 | £14.99/month |
| 10 clients | 10 | £14.99 (account) | ~£21 (Lite) | £35.99/month |
| 20 clients | 20 | £14.99 (account) | ~£21 (Lite) | £35.99/month |

Note: Hostinger account fee is fixed regardless of number of sites (up to 300). The main variable cost as you scale is Brevo once you exceed the free tier volume.

---

## Vendor Links

| Vendor | Purpose | Link |
|---|---|---|
| Hostinger | Standard hosting | https://www.hostinger.co.uk/wordpress-hosting |
| Kinsta | Premium hosting | https://kinsta.com/agency-partner-program/ |
| Brevo | Transactional email + SMS | https://www.brevo.com |
| Sherweb | Microsoft 365 + Google Workspace CSP | https://www.sherweb.com/partners/csp-program/ |
| Stripe | Payment processing | https://stripe.com/gb |

---

*Document Version: 1.0 | Created: March 2026*
*Status: Reference only — active decisions in Tools_Stack.md*
*Related documents: Tools_Stack.md | Client_Delivery_Workflow.md | 12_Month_Business_Plan.md*
