# Hosting & Infrastructure Strategy
## Bookit Booking System - WordPress Booking Plugin

**Document Version:** 1.0  
**Last Updated:** February 7, 2026  
**Author:** Liron  
**Purpose:** Define hosting infrastructure, service stack, and vendor selection for agency clients using Bookit Booking System

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Load Analysis](#system-architecture-load-analysis)
3. [Hosting Strategy](#hosting-strategy)
4. [Email Services Strategy](#email-services-strategy)
5. [Transactional Email & Marketing](#transactional-email--marketing)
6. [SMS Services](#sms-services)
7. [Client Stack Configurations](#client-stack-configurations)
8. [Decision Framework](#decision-framework)
9. [Vendor Information & Links](#vendor-information--links)
10. [Financial Projections](#financial-projections)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Risk Management](#risk-management)

---

## Executive Summary

### Key Decisions

**Hosting:**
- **Regular Clients:** Hostinger Business Cloud (£1.50/site)
- **Premium Clients:** Kinsta Agency Partner Program (£11.20/site)

**Business Email:**
- **Primary:** Microsoft 365 CSP Reseller Program (£4.80-9.60 wholesale, £8-15 retail)
- **Alternative:** Google Workspace Reseller (same pricing model)

**Transactional Email:**
- **All Clients:** Brevo Lite (€25/month shared account for all clients)

**Marketing Email:**
- **Regular Clients:** Brevo Free (client self-manages)
- **Premium Clients:** Brevo Standard (€18/month, you manage)

**SMS:**
- **All Clients:** Brevo SMS (£3.45 per 100 SMS, Phase 2 upsell)

### Critical Insight: Dashboard Load Changes Everything

The Bookit Booking System has **significantly higher server load** than typical WordPress sites due to:

1. **Separate Vue.js Business Dashboard** - Makes frequent API calls vs traditional page loads
2. **Multiple Concurrent Staff Users** - 5-10 staff querying database simultaneously
3. **Real-Time Requirements** - Auto-refresh, instant booking updates, conflict prevention
4. **Background Automation** - Google Calendar sync, email notifications, webhooks
5. **Complex Booking Queries** - Availability calculations, conflict checks with database locks

**This means:** Standard booking volume thresholds (50-100 bookings/day) are LESS important than **number of concurrent dashboard users**.

---

## System Architecture Load Analysis

### Bookit Booking System Components

#### 1. Public Booking Interface (Customer-Facing)

**User Flow:**
```
Customer visits site
    ↓
Browse services (query services table)
    ↓
Select staff member (query staff availability)
    ↓
View calendar (query bookings for date range)
    ↓
Check time slot availability (complex query: conflicts, buffers, working hours)
    ↓
Create booking (insert + conflict check with DB lock)
    ↓
Redirect to Stripe Checkout (payment off-server)
    ↓
Payment confirmation webhook (update booking status)
    ↓
Send confirmation email via Brevo (API call)
```

**Load per booking:** Medium
- 5-10 database queries
- 2-3 API calls (Stripe, Brevo)
- Payment processing OFF-SERVER (Stripe Checkout)

#### 2. Business Dashboard (Staff Daily Usage)

**Vue.js SPA Architecture:**
```
Dashboard loads in browser (Vue.js)
    ↓
Makes API calls to WordPress REST endpoints
    ↓
Each page view = 10-20 separate API requests
    ↓
Auto-refresh every 30-60 seconds = repeat all calls
```

**Dashboard Features (from SRS):**
- Real-time calendar view (queries all bookings for date range)
- Today's appointments list (filtered queries)
- Upcoming appointments (date range queries)
- Customer management (search, filter, pagination)
- Booking modification (read/update with conflict checks)
- Staff schedule management (availability calculations)
- Reports & analytics (aggregate queries - HEAVY)
- Payment history (join bookings + payments tables)

**Load:** **HIGH** - Runs continuously during business hours
- Multiple staff users simultaneously
- Auto-refresh multiplies query load
- Report generation = expensive aggregate queries

#### 3. Automated Background Tasks

**Running via WP-Cron or System Cron:**
- Send reminder emails (hourly query + process)
- Sync to Google Calendar (every 15 minutes = 96 sync operations/day)
- Check abandoned bookings (cleanup queries)
- Generate daily reports (aggregation queries)
- Process payment webhooks (Stripe callbacks)

**Load:** Moderate but continuous (24/7)

#### 4. Mobile App (Future Phase 2+)

**API Load:**
- Polling for new bookings (every 30 seconds per device)
- Push notification triggers
- Real-time availability checks
- Calendar sync requests
- Offline data synchronization

**Load:** **HEAVY** - Mobile apps generate 10x web traffic in API calls

### Load Calculations by Business Size

#### Small Business (3 Staff, 20 Bookings/Day)

**Daily Traffic:**
- Public site: 500 visits/day (browsing + bookings)
- Dashboard: 3 staff × 8 hours × 2 checks/hour = 48 loads
- Auto-refresh: 48 loads × 4 refreshes/hour × 10 queries = 1,920 queries
- Background: 96 cron jobs × 5 queries = 480 queries

**Database Queries:**
- Customer bookings: 20 × 10 queries = 200
- Dashboard loads: 48 × 20 queries = 960
- Auto-refresh: 1,920 queries
- Cron jobs: 480 queries
- **TOTAL: ~3,560 queries/day**

**Verdict:** ✅ **Regular hosting handles comfortably**
- Well within Hostinger limits (10,000+ queries/day capacity)
- Peak times manageable
- Low concurrent user count

#### Medium Business (7 Staff, 80 Bookings/Day)

**Daily Traffic:**
- Public site: 2,000 visits/day
- Dashboard: 7 staff × 8 hours × 3 checks/hour = 168 loads
- Auto-refresh: 168 × 4 × 10 = 6,720 queries
- Reports: 7 staff × 2 reports/day × 500 queries = 7,000 queries

**Database Queries:**
- Customer bookings: 80 × 10 = 800
- Dashboard loads: 168 × 20 = 3,360
- Auto-refresh: 6,720
- Cron jobs: 480
- Reports: 7,000
- **TOTAL: ~18,360 queries/day**

**Verdict:** ⚠️ **Regular hosting MIGHT struggle, Premium recommended**
- Approaching shared hosting limits
- Peak times (9-10am) = all staff + customers simultaneously
- Report generation causes spikes
- Dashboard may slow during busy periods

#### Large Business (10+ Staff, 150+ Bookings/Day)

**Daily Traffic:**
- Public site: 5,000 visits/day
- Dashboard: 10 staff × 10 hours × 4 checks/hour = 400 loads
- Auto-refresh: 400 × 4 × 10 = 16,000 queries
- Reports: 10 staff × 3 reports/day × 500 queries = 15,000 queries

**Database Queries:**
- Customer bookings: 150 × 10 = 1,500
- Dashboard loads: 400 × 20 = 8,000
- Auto-refresh: 16,000
- Reports: 15,000
- Cron jobs: 960
- **TOTAL: ~41,460 queries/day**

**Verdict:** ❌ **Premium hosting REQUIRED**
- Exceeds shared hosting capacity
- Multiple concurrent dashboard users = resource contention
- Reports timeout on shared hosting
- Risk of database connection errors during peak

### The Concurrent Dashboard Users Problem

**Critical Scenario: 7-Staff Clinic at 9 AM**

```
Peak Morning Load:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Staff 1: Checking appointments        (15 queries)
Staff 2: Customer history lookup      (20 queries)
Staff 3: Modifying booking           (10 queries + write lock)
Staff 4: Generating morning report   (500 queries)
Staff 5: Adding new customer         (25 queries)
Receptionist: New booking            (30 queries)
Manager: Analytics dashboard         (200 queries)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIMULTANEOUS: ~800 queries in same moment
+ 5 customers booking online
+ Background cron syncing calendar
= SHARED HOSTING OVERLOAD
```

**Impact on Regular Hosting:**
- ⏱️ Dashboard loads: 5-10 seconds (vs <1 second)
- ⏱️ Reports timeout (30-second PHP limit exceeded)
- ⏱️ Customer bookings fail ("Database connection error")
- ⏱️ Staff frustration, productivity loss
- ⚠️ Risk of double-bookings (race conditions under load)

**Impact on Premium Hosting (Kinsta):**
- ✅ Dashboard loads: <1 second
- ✅ Reports generate quickly
- ✅ Zero customer booking failures
- ✅ Database locks work properly (prevents double-bookings)
- ✅ Happy staff, no complaints

### eCommerce vs Booking Payments Clarification

**IMPORTANT DISTINCTION:**

#### NOT eCommerce (Regular Hosting OK):

**Booking Payments via Stripe/PayPal Checkout:**
- Customer books appointment → Redirected to Stripe/PayPal hosted page
- Payment happens on **Stripe's/PayPal's servers** (not your website)
- Your site receives webhook: "payment successful"
- Minimal server load

**Examples that work on Regular hosting:**
- Salon booking with deposit payment (any volume)
- Photography session with full payment
- Therapy appointments paid upfront
- Service packages (3-5 package options with Stripe Checkout)
- Simple gift certificates (1 product type)
- Basic memberships via Stripe Billing

**Why Regular hosting handles this:**
- Stripe Checkout does heavy lifting (off your server)
- Your plugin: 1 database insert + 1 webhook update
- Even 200 paid bookings/day = No problem

#### YES, This IS eCommerce (Premium Required):

**WooCommerce Product Shop:**
- Shopping cart runs on YOUR server
- Product catalog with images loaded from YOUR server
- Inventory management queries YOUR database
- Customer accounts, order processing, calculations on YOUR server
- High resource usage

**Examples requiring Premium:**
- Salon selling 20+ hair products on site
- Photographer selling prints (500 images × 5 sizes = 2,500 SKUs)
- Spa with product shop + gift cards + memberships
- Any "Add to Cart" functionality

**Why Premium is essential:**
- WooCommerce = resource-intensive
- Product browsing: 50+ database queries per page
- Checkout: 20-30 queries + inventory locks
- Multiple shoppers simultaneously = high load

**Exception:** 1-3 simple "Buy Now" products (no shopping cart) = Regular OK
- Example: Photographer selling 3 digital guides with simple Stripe buttons
- Not using WooCommerce, minimal server load

---

## Hosting Strategy

### Regular Tier: Hostinger Business Cloud

#### Specifications

**Product:** Business Cloud Hosting  
**Price:** £14.99/month for 300 websites (£1.50 per site)  
**Server Location:** London, UK  
**Technology:**
- LiteSpeed web server with caching
- CloudLinux OS (resource isolation)
- 200 GB NVMe storage
- Free SSL certificates (Let's Encrypt)
- Daily backups (14-day retention)

**Performance:**
- 99.9% uptime guarantee
- Average load time: 2-3 seconds
- PHP 8.0-8.2 support
- MySQL 8.0 databases
- 200 GB bandwidth/month per site

**WordPress-Specific:**
- Managed WordPress hosting
- WordPress auto-updates
- Staging environment
- WordPress CLI access
- WP-CLI for automation

**Limitations:**
- Shared hosting (shared server resources)
- No white-label reseller program
- Standard support (24/7 chat, no phone)
- Resource limits: 100 concurrent connections per account

**Best For:**
- 1-4 staff businesses
- Under 50 bookings/day
- Light dashboard usage (1-2 concurrent users)
- Budget-conscious clients
- Traffic under 5,000 visits/month

**Link:** https://www.hostinger.co.uk/wordpress-hosting

#### Performance Expectations

**Load Times:**
- Homepage: 1.5-2.5 seconds
- Booking page: 2-3 seconds
- Dashboard: 2-4 seconds (depending on data volume)

**Concurrent Capacity:**
- 3-5 simultaneous dashboard users
- 10-20 simultaneous customer bookings
- Total: 50-100 concurrent connections

**Database Performance:**
- Simple queries (<100ms)
- Complex reports (1-5 seconds)
- Peak hour slowdown possible

### Premium Tier: Kinsta Agency Partner Program

#### Specifications

**Product:** Agency Hosting Plan  
**Price:** $280/month for 20 WordPress installs (£11.20 per site at £1=$1.25)  
**Server Location:** Google Cloud Platform - London  
**Technology:**
- Isolated container per site (LXD/LXC)
- NGINX web server
- Google Cloud's premium network
- Free Cloudflare CDN integration
- Automatic daily backups (14-day retention, downloadable)

**Performance:**
- 99.95% uptime guarantee (better SLA than Hostinger)
- Average load time: 0.5-1.5 seconds
- PHP 8.0-8.3 support (latest versions immediately)
- MariaDB 10.6+ databases
- Unlimited bandwidth (no caps)

**WordPress-Specific:**
- Managed WordPress (automatic updates, security patches)
- Staging environments (1-click creation)
- WordPress debugging tools
- SSH and WP-CLI access
- WordPress-specific caching (Kinsta MU Plugin)

**Premium Features:**
- Isolated resources (no "noisy neighbor" problem)
- Free agency site hosting (your business site)
- White-label dashboard access (remove Kinsta branding from WP admin)
- 10% lifetime commission on client referrals
- Premium support (WordPress experts, faster response)

**Limitations:**
- No full white-label reseller program (cannot brand as your own hosting)
- Billing still through Kinsta (cannot invoice clients directly for hosting)

**Best For:**
- 5+ staff businesses
- 50+ bookings/day
- Heavy dashboard usage (3+ concurrent users)
- Performance-critical clients
- Traffic over 10,000 visits/month
- Businesses running paid advertising
- eCommerce (if WooCommerce shop added)

**Link:** https://kinsta.com/agency-partner-program/

#### Performance Expectations

**Load Times:**
- Homepage: 0.5-1 second
- Booking page: 0.8-1.5 seconds
- Dashboard: 1-2 seconds (regardless of data volume)

**Concurrent Capacity:**
- 10-20 simultaneous dashboard users
- 50-100 simultaneous customer bookings
- Total: 200+ concurrent connections

**Database Performance:**
- Simple queries (<50ms)
- Complex reports (<2 seconds)
- No peak hour slowdown

### Hosting Comparison Matrix

| Feature | Hostinger Regular | Kinsta Premium |
|---------|------------------|----------------|
| **Monthly Cost** | £1.50/site | £11.20/site |
| **Setup Cost** | £0 | £0 |
| **Server Type** | Shared hosting | Isolated container |
| **Location** | London, UK | Google Cloud London |
| **Uptime SLA** | 99.9% (43 min/month) | 99.95% (22 min/month) |
| **Load Time** | 2-3 seconds | 0.5-1.5 seconds |
| **PHP Version** | 8.0-8.2 | 8.0-8.3 |
| **Bandwidth** | 200 GB/month | Unlimited |
| **Concurrent Users** | 50-100 | 200+ |
| **Dashboard Users** | 1-4 comfortable | 10+ comfortable |
| **Backups** | Daily, 14-day | Daily, 14-day |
| **Staging** | Yes | Yes (1-click) |
| **White-Label** | No | Partial (remove branding) |
| **Support** | 24/7 chat | 24/7 chat + WordPress experts |
| **Best For** | Budget clients | Performance clients |

---

## Email Services Strategy

### Business Email Reseller: Microsoft 365 CSP

#### Why Microsoft 365 for UK Market

**Market Reality:**
- 80% of UK small businesses use Microsoft Office
- Familiarity with Outlook, Word, Excel
- Desktop app preference over web-only
- "Professional" perception (vs free Gmail)

#### Cloud Solution Provider (CSP) Program

**How It Works:**
1. You become Microsoft CSP partner (via distributor)
2. Purchase Microsoft 365 licenses at wholesale prices
3. Resell to clients at your chosen retail price
4. Manage all licenses via Partner Sales Console
5. Bill clients directly (not Microsoft)

**Pricing Structure:**

| Plan | Wholesale Cost | Your Retail Price | Profit/User |
|------|----------------|------------------|-------------|
| **Microsoft 365 Basic** | £4.80/user/month | £8/user/month | £3.20 |
| **Microsoft 365 Standard** | £9.60/user/month | £15/user/month | £5.40 |
| **Microsoft 365 Premium** | £15.20/user/month | £25/user/month | £9.80 |

**Plan Features:**

**Basic (Recommend for Regular Clients):**
- Email: 50 GB mailbox
- Web-only Office apps (Word, Excel, PowerPoint online)
- OneDrive: 1 TB storage
- Teams for chat/meetings
- Mobile apps (iOS/Android)

**Standard (Recommend for Premium Clients):**
- Everything in Basic, PLUS:
- **Desktop Office apps** (Word, Excel, PowerPoint, Outlook installed on computer)
- Advanced security features
- Email archiving
- 50 GB mailbox → Unlimited archive

**Premium (Only for special requests):**
- Everything in Standard, PLUS:
- Advanced threat protection
- Device management
- Advanced compliance tools
- (Most small businesses don't need this)

#### CSP Program Requirements

**To Join:**
1. Company registered in UK
2. Business bank account
3. Apply through Microsoft-authorized distributor (cannot apply directly to Microsoft)
4. Agree to partner terms
5. Complete partner verification (2-3 weeks)

**UK Distributors (Aggregators):**

**Sherweb (Recommended):**
- UK-based support
- Partner portal in GBP
- 24/7 support for partners
- Billing automation tools
- Free partner training
- **Link:** https://www.sherweb.com/partners/csp-program/

**Grey Matter:**
- UK-based (Birmingham)
- Strong Microsoft relationship
- Partner onboarding support
- **Link:** https://www.greymatter.com/microsoft-csp

**Insight UK:**
- Large distributor
- More formal/enterprise-focused
- **Link:** https://uk.insight.com/partners

**Recommended:** Start with Sherweb (easiest onboarding, best portal)

#### Important CSP Rules

**Each Client = Separate Subscription:**
- CANNOT share one license pool across multiple clients
- Each client business must have their own subscription
- Example: Client A (5 users) and Client B (3 users) = 2 separate subscriptions

**Billing:**
- You pay distributor monthly (wholesale price)
- You bill clients monthly (your retail price)
- You keep the margin

**Minimum Commitment:**
- No minimum spend
- No minimum number of licenses
- Can start with 1 client, 1 user

**Support:**
- YOU provide Level 1 support to clients (password resets, setup)
- Distributor provides Level 2 support to YOU
- Microsoft provides Level 3 support (escalations)

### Alternative: Google Workspace Reseller

#### When to Recommend Google Over Microsoft

**Google is better for:**
- Startups and tech-savvy businesses
- Businesses that prioritize collaboration over desktop apps
- Teams already using Google Drive/Docs
- Mobile-first businesses
- Budget-conscious clients (both are same price, but Google perception as "free alternative")

**Google Workspace Plans:**

| Plan | Wholesale Cost | Your Retail Price | Profit/User |
|------|----------------|------------------|-------------|
| **Business Starter** | £4.80/user/month | £8/user/month | £3.20 |
| **Business Standard** | £9.60/user/month | £15/user/month | £5.40 |
| **Business Plus** | £15.20/user/month | £25/user/month | £9.80 |

**Plan Features:**

**Business Starter:**
- Gmail: 30 GB storage
- Google Drive: 30 GB per user (pooled)
- Google Docs, Sheets, Slides (web only)
- Google Meet: 100 participants

**Business Standard (Recommended):**
- Gmail: 2 TB storage
- Google Drive: 2 TB per user (pooled)
- Google Meet: 150 participants + recording
- Enhanced security features

**Reseller Program:**
- Same structure as Microsoft CSP
- Apply through Google Cloud Partner or reseller
- **Link:** https://workspace.google.com/partners

**UK Distributors for Google:**
- Sherweb also resells Google Workspace
- Same portal for both Microsoft and Google
- **Link:** https://www.sherweb.com/partners/google-workspace

---

## Transactional Email & Marketing

### Transactional Email: Brevo (formerly Sendinblue)

#### Why Brevo for Booking Confirmations

**Key Advantages:**
1. **One account for ALL clients** (unlike business email)
2. **Multiple sender domains** (you@client1.com, you@client2.com)
3. **High deliverability** (95.5% inbox rate)
4. **Built-in SMS** (booking reminders via text)
5. **Transactional + Marketing** in one platform
6. **SMTP + API** (plugin integrates both ways)

#### Brevo Pricing for Agencies

**Free Plan:**
- 300 emails/day (9,000/month)
- Unlimited contacts
- SMTP + API access
- Brevo branding in emails
- **Use Case:** Testing, development, single client with low volume

**Lite Plan (Recommended for Agency):**
- **Price:** €25/month (approximately £21)
- 20,000 emails/month
- No daily sending limit
- Remove Brevo branding
- Multiple sender domains
- **Use Case:** 20-30 booking clients (assuming 30 bookings/day average)

**Standard Plan:**
- **Price:** €65/month (£55)
- 20,000 emails/month
- Everything in Lite, PLUS:
- A/B testing
- Advanced statistics
- Marketing automation
- Landing pages
- **Use Case:** If managing marketing campaigns for premium clients

**Calculation for Lite Plan:**

```
20,000 emails/month ÷ 30 days = 667 emails/day

Per-client usage (average):
- Booking confirmation: 1 email
- 24-hour reminder: 1 email  
- Payment receipt: 1 email
= 3 emails per booking

667 emails/day ÷ 3 = 222 bookings/day capacity

If average client has 30 bookings/day:
222 ÷ 30 = 7 clients comfortably
+ Buffer for admin emails, password resets, etc.
= Support 20-25 clients on Lite Plan
```

**Cost per client:** £21 ÷ 20 clients = £1.05/month per client

#### Setting Up Multi-Client Sending

**How It Works:**
1. You create ONE Brevo account (your agency)
2. Add sender domains for each client:
   - noreply@salon1.com (verified via DNS)
   - bookings@clinic2.co.uk (verified via DNS)
   - appointments@photographer3.com (verified via DNS)
3. Booking plugin sends from appropriate domain per client
4. All emails tracked in single Brevo dashboard

**DNS Configuration Per Client:**
```
For client domain: salon1.com

Add these DNS records:
1. TXT: "v=spf1 include:spf.sendinblue.com ~all"
2. CNAME: mail._domainkey → mail._domainkey.sendinblue.com
3. CNAME: sendinblue-code → sendinblue.com (verification)
```

**Plugin Configuration:**
```php
// In booking plugin settings per client
'email_from' => 'noreply@salon1.com',
'email_from_name' => 'Salon Name',
'brevo_api_key' => 'your-agency-brevo-api-key', // Same key for all
'brevo_sender_id' => 'salon1_sender', // Unique identifier
```

#### Brevo White-Label Status

**IMPORTANT:** Brevo discontinued their white-label reseller program in 2023.

**Current Situation:**
- **No white-label reseller program** (old program closed to new partners)
- **Affiliate program only** (5% commission on referrals, but client owns account)
- **Shared account approach** (you own account, manage for clients)

**Implications:**
- You CANNOT rebrand Brevo as your own service
- Clients might see "Sent via Brevo" in email headers (can be removed on paid plans)
- You manage one account, clients don't need to know Brevo exists
- Bill clients for "Email Delivery Service" (don't mention Brevo specifically)

### Marketing Email Strategy

#### Regular Client Approach: Client Self-Manages

**Brevo Free Plan:**
- Each client creates their own free Brevo account
- 300 emails/day limit (9,000/month)
- Client manages their own campaigns, contact lists
- You provide setup and training (one-time)

**Your Service:**
- **Setup Fee:** £149 (one-time)
- **Includes:**
  - Create Brevo account for client
  - Verify domain (DNS configuration)
  - Import initial contact list (if provided)
  - Create 2-3 email templates (branded to client)
  - 1-hour training session (how to create campaign, manage contacts)
  - Written guide (screenshots, step-by-step)

**Ongoing:**
- Client manages themselves (no monthly fee from you)
- You provide ad-hoc support (billed hourly if needed)

**Best For:**
- Small businesses with marketing person or owner who can learn
- Infrequent campaigns (monthly newsletters, seasonal promotions)
- Budget-conscious clients
- Simple email marketing needs

#### Premium Client Approach: You Manage Campaigns

**Brevo Standard Plan:**
- **Price:** €18/month per client (£15)
- 5,000-1,000,000 emails/month (depends on plan tier)
- Advanced features: A/B testing, automation, landing pages

**Your Service:**
- **Setup Fee:** £295 (one-time)
- **Monthly Fee:** £50/month
- **Includes:**
  - Campaign strategy (monthly planning)
  - Design and send 2-4 campaigns/month
  - Manage contact list (imports, segmentation)
  - A/B test subject lines
  - Monthly performance report

**Your Cost:** £15/month (Brevo subscription)  
**Your Price:** £50/month  
**Your Profit:** £35/month per client

**Best For:**
- Businesses without marketing resources
- High-value clients willing to pay for service
- Businesses needing regular campaigns (weekly/monthly)
- Complex segmentation or automation needs

---

## SMS Services

### Brevo SMS Integration

#### Why Brevo SMS

**Advantages:**
1. **Same platform** as transactional email (unified dashboard)
2. **Pay-as-you-go** (no monthly minimum)
3. **Credits never expire** (buy in advance)
4. **API integration** (plugin sends programmatically)
5. **Transactional + Marketing** SMS (different regulations)

#### SMS Pricing

**UK SMS Costs:**
- **3.45 pence per SMS** (£3.45 per 100 SMS)
- No monthly fee, pay only for SMS sent
- Credits purchased in advance (£10, £50, £100, £500)

**International SMS:**
- **US:** $1.09 per 100 SMS (1.09 cents each)
- **Europe:** £2.50-4.50 per 100 SMS
- **Other countries:** Varies widely (check Brevo pricing page)

**Character Limits:**
- Standard SMS: 160 characters (1 credit)
- Long SMS: 306 characters (2 credits), 459 characters (3 credits), etc.
- Booking reminders typically 120-140 characters = 1 credit

#### SMS Use Cases for Booking Plugin

**Phase 2 Feature (Upsell after 6 months):**

1. **Appointment Reminders:**
   - 24-hour reminder before appointment
   - "Reminder: Your appointment at [Business] is tomorrow at [Time]. Reply CONFIRM or call [Phone]."
   - Reduces no-shows by 30-40%

2. **Last-Minute Cancellation Alerts:**
   - When appointment cancelled, SMS sent to waitlist
   - "A slot opened at [Business] today at [Time]. Book now: [Link]"
   - Fills gaps, maximizes revenue

3. **Confirmation SMS:**
   - Immediate SMS after online booking
   - "Booking confirmed at [Business] on [Date] at [Time]. Check email for details."
   - Reassurance for customer

#### SMS Cost Calculation

**Example: Salon with 30 bookings/day**

**SMS Strategy:**
- 24-hour reminder only (1 SMS per booking)
- 30 bookings/day × 30 days = 900 SMS/month
- Cost: 900 × £0.0345 = £31.05/month

**Your Pricing:**
- **Basic SMS Package:** £15/month (includes 100 SMS = £3.45 cost)
- **Standard SMS Package:** £25/month (includes 300 SMS = £10.35 cost)
- **Pro SMS Package:** £50/month (includes 1,000 SMS = £34.50 cost)

**Profit:**
- Basic: £15 - £3.45 = £11.55/month
- Standard: £25 - £10.35 = £14.65/month
- Pro: £50 - £34.50 = £15.50/month

**Alternative: Pass-Through Pricing:**
- Charge client actual cost + 50% markup
- Example: 900 SMS = £31.05 cost → Charge client £46.50
- Profit: £15.45/month
- More transparent, scales with usage

#### UK SMS Regulations (GDPR + PECR)

**Critical Rules:**

1. **Consent Required:**
   - **Transactional SMS** (booking confirmations, reminders): Consent implied by booking (OK to send)
   - **Marketing SMS** (promotions, offers): Explicit opt-in required (checkbox during booking)

2. **Opt-Out Mechanism:**
   - Every SMS must include opt-out option
   - Example: "Reply STOP to unsubscribe"
   - Must honor opt-out within 24 hours

3. **Sender ID:**
   - Use business name (11 characters max)
   - Example: "SalonName" or "DrSmith"
   - UK recipients see sender name, not phone number

4. **Sending Hours (Marketing SMS Only):**
   - Weekdays: 8am - 9pm
   - Weekends: 10am - 6pm
   - **Transactional SMS** (reminders): Can send 24/7

5. **Record Keeping:**
   - Maintain proof of consent for marketing SMS
   - Document opt-outs
   - Audit trail for compliance

---

## Client Stack Configurations

### Regular Client Stack (Budget-Conscious)

#### Target Customer Profile

**Business Characteristics:**
- 1-4 staff members
- Under 50 bookings/day
- Budget-conscious (setup <£750, monthly <£50)
- Simple operations (no complex reporting needs)
- Light dashboard usage (1-2 concurrent users)

**Business Types:**
- Solo practitioners (therapist, consultant, photographer)
- Small salons (2-3 stylists)
- Independent beauty professionals
- Mobile service providers
- Part-time professionals

#### Infrastructure Components

| Component | Provider | Plan | Your Cost | Your Price | Notes |
|-----------|----------|------|-----------|------------|-------|
| **Hosting** | Hostinger | Business Cloud | £1.50/month | £20/month | Shared hosting, London servers |
| **Business Email** | Microsoft 365 | Basic (4 users) | £19.20/month | £32/month | 50GB mailbox, web apps only |
| **Transactional Email** | Brevo | Lite (shared) | £1.05/month | £2/month | Booking confirmations (allocated) |
| **Marketing Email** | Brevo | Free (client) | £0/month | £0/month | Client self-manages |
| **SMS** | N/A | Not included | £0/month | £0/month | Phase 2 upsell |
| **Backup** | Hostinger | Included | £0/month | Included | Daily automated |
| **Security** | Wordfence | Free | £0/month | Included | Basic firewall |
| **Maintenance** | You | Essential | N/A | £8.25/month | Billed annually £99 |

**Monthly Totals:**
- **Your Total Cost:** £21.75/month
- **Your Total Revenue:** £62.25/month
- **Your Monthly Profit:** £40.50/month (186% margin)
- **Annual Profit:** £486/year per client

#### Pricing Presentation to Client

**Setup Fees (One-Time):**
- Website development: £495
- Email setup & training: Included
- Marketing email setup: £149
- **Total Setup: £644**

**Monthly Services:**
- Website hosting: £20/month
- Business email (4 users): £32/month
- Website maintenance: £8.25/month (billed annually £99)
- **Total Monthly: £60.25/month**

**Optional Add-Ons (Future):**
- Marketing campaign management: £50/month
- SMS appointment reminders: £15/month
- Additional email users: £8/user/month

### Premium Client Stack (Performance-Focused)

#### Target Customer Profile

**Business Characteristics:**
- 5-10+ staff members
- 50-150+ bookings/day
- Performance-critical (lost booking = significant revenue)
- Professional services (law, medical, consulting)
- Heavy dashboard usage (3+ concurrent users)
- Growth-oriented (plans to expand)

**Business Types:**
- Multi-practitioner clinics
- Busy salons/spas (5+ staff)
- Professional services firms
- Medical/dental practices
- Corporate training companies
- High-volume photography studios

#### Infrastructure Components

| Component | Provider | Plan | Your Cost | Your Price | Notes |
|-----------|----------|------|-----------|------------|-------|
| **Hosting** | Kinsta | Agency Partner | £11.20/month | £30/month | Isolated container, Google Cloud |
| **Business Email** | Microsoft 365 | Standard (4 users) | £38.40/month | £60/month | Desktop Office apps included |
| **Transactional Email** | Brevo | Lite (shared) | £1.05/month | £2/month | Booking confirmations |
| **Marketing Email** | Brevo | Standard | £15/month | £50/month | You manage campaigns |
| **SMS** | Brevo | Included | £10/month | £25/month | 300 SMS/month included |
| **Backup** | UpdraftPlus | Premium | £6/month | Included | Off-site backup to S3 |
| **Security** | Wordfence | Premium | £8/month | Included | Advanced firewall + malware removal |
| **Maintenance** | You | Professional | N/A | £41.60/month | Billed annually £499 |

**Monthly Totals:**
- **Your Total Cost:** £89.65/month
- **Your Total Revenue:** £208.60/month
- **Your Monthly Profit:** £118.95/month (133% margin)
- **Annual Profit:** £1,427/year per client

#### Pricing Presentation to Client

**Setup Fees (One-Time):**
- Website development: £995
- Email & productivity setup: Included
- Marketing campaign setup: £295
- **Total Setup: £1,290**

**Monthly Services:**
- Website hosting (premium): £30/month
- Business email (4 users, desktop apps): £60/month
- Website maintenance (priority): £41.60/month (billed annually £499)
- Marketing campaign management: £50/month
- SMS appointment reminders: £25/month
- **Total Monthly: £206.60/month**

---

## Decision Framework

### Qualification Questions to Ask Prospects

#### 1. Business Size & Volume

**Question:** *"How many staff members will be using the booking system?"*

**Analysis:**
- 1-3 staff → Regular likely sufficient
- 4-6 staff → Ask follow-up questions
- 7+ staff → Premium recommended

**Why it matters:** More staff = more concurrent dashboard users = higher server load

---

**Question:** *"How many appointments or bookings do you handle per day on average?"*

**Analysis:**
- Under 30/day → Regular sufficient
- 30-60/day → Consider Premium
- 60+/day → Premium recommended

**Why it matters:** High volume = more database queries, especially during peak hours

---

#### 2. Performance Requirements

**Question:** *"How much revenue would you lose if your booking system was unavailable for 2 hours?"*

**Analysis:**
- "Maybe £50" → Regular acceptable
- "£100-200" → Premium recommended
- "£500+" → Premium mandatory

**Why it matters:** Higher downtime cost justifies premium hosting investment

---

**Question:** *"Will you be running Google or Facebook ads to drive bookings?"*

**Analysis:**
- No paid ads → Regular
- Planning to run ads → Premium (traffic spikes from ads)
- Already running ads → Premium mandatory

**Why it matters:** Ad traffic is spiky and unpredictable; shared hosting struggles

---

### Automatic Premium Triggers (No Negotiation)

**These scenarios REQUIRE Premium, regardless of budget:**

1. **eCommerce (WooCommerce shop)**
   - Even small shop (20+ products)
   - Shared hosting cannot handle shopping cart load

2. **8+ staff members**
   - Too many concurrent dashboard users
   - Shared hosting will slow down

3. **150+ bookings/day**
   - Database load too high for shared hosting
   - Risk of timeouts and errors

4. **Mission-critical operations**
   - Medical/legal practices (compliance requirements)
   - Revenue loss >£500 for 2-hour outage

5. **High-traffic websites**
   - 20,000+ visits/month
   - Paid advertising (Google/Facebook ads)

6. **Mobile app integration (Phase 2+)**
   - Mobile apps = constant API polling
   - Too much load for shared hosting

7. **Multiple locations**
   - Complexity requires better performance
   - More staff = more dashboard users

---

## Vendor Information & Links

### Hosting Providers

#### Hostinger
- **Website:** https://www.hostinger.co.uk
- **Product Page:** https://www.hostinger.co.uk/wordpress-hosting
- **Pricing:** https://www.hostinger.co.uk/wordpress-hosting#pricing
- **Support:** https://www.hostinger.co.uk/contact

#### Kinsta
- **Website:** https://kinsta.com
- **Agency Partner Program:** https://kinsta.com/agency-partner-program/
- **Pricing:** https://kinsta.com/pricing/
- **Support:** https://kinsta.com/help/
- **MyKinsta Portal:** https://my.kinsta.com

### Email Service Providers

#### Microsoft 365 CSP via Sherweb
- **Sherweb Website:** https://www.sherweb.com
- **CSP Partner Program:** https://www.sherweb.com/partners/csp-program/
- **Partner Portal:** https://partner.sherweb.com

#### Google Workspace Reseller via Sherweb
- **Program Page:** https://www.sherweb.com/partners/google-workspace

### Transactional Email & Marketing

#### Brevo
- **Website:** https://www.brevo.com
- **Pricing:** https://www.brevo.com/pricing/
- **Documentation:** https://developers.brevo.com
- **Sign Up:** https://app.brevo.com/account/register

### Payment Gateways

**Stripe:**
- **Website:** https://stripe.com/gb
- **Dashboard:** https://dashboard.stripe.com
- **Pricing:** 1.5% + 20p per transaction (UK cards)

**PayPal:**
- **Website:** https://www.paypal.com/uk/business
- **Developer:** https://developer.paypal.com
- **Pricing:** 2.9% + 30p per transaction (UK)

---

## Financial Projections

### Revenue Model Breakdown

#### Per-Client Annual Value

**Regular Client (Year 1):**
- Setup fee: £644 (one-time)
- Monthly recurring: £60.25 × 12 = £723
- **Total Year 1 Revenue:** £1,367
- **Year 2+ Revenue:** £723/year (recurring only)

**Premium Client (Year 1):**
- Setup fee: £1,290 (one-time)
- Monthly recurring: £206.60 × 12 = £2,479
- **Total Year 1 Revenue:** £3,769
- **Year 2+ Revenue:** £2,479/year (recurring only)

#### Cost Structure Per Client

**Regular Client Costs:**
- Hosting: £1.50 × 12 = £18/year
- Email (4 users): £4.80 × 4 × 12 = £230/year
- Transactional email: £1.05 × 12 = £13/year
- **Total Annual Cost:** £261/year
- **Annual Profit:** £1,367 - £261 = **£1,106/year** (81% margin)

**Premium Client Costs:**
- Hosting: £11.20 × 12 = £134/year
- Email (4 users): £9.60 × 4 × 12 = £461/year
- Transactional email: £1.05 × 12 = £13/year
- Marketing email: £15 × 12 = £180/year
- SMS (300/month): £10 × 12 = £120/year
- Backup: £6 × 12 = £72/year
- Security: £8 × 12 = £96/year
- **Total Annual Cost:** £1,076/year
- **Annual Profit:** £3,769 - £1,076 = **£2,693/year** (71% margin)

### Growth Scenarios

#### Scenario 3: Mixed Portfolio (Realistic)

**5 Regular + 5 Premium Clients**

**Year 1:**
- Setup fees: (5 × £644) + (5 × £1,290) = £9,670
- Recurring revenue: (5 × £723) + (5 × £2,479) = £16,010
- **Total Revenue:** £25,680
- Total costs: (5 × £261) + (5 × £1,076) = £6,685
- **Total Profit:** £18,995 (74% margin)

**Year 2:**
- Recurring revenue: £16,010
- Total costs: £6,685
- **Total Profit:** £9,325 (58% margin)

**Monthly Cash Flow (Year 2):**
- Revenue: £1,334/month
- Costs: £557/month
- **Profit: £777/month**

---

## Implementation Roadmap

### Pre-Launch (Weeks 1-4)

#### Week 1: Infrastructure Setup
- Sign up for Hostinger Business Cloud
- Create agency website
- Set up Brevo account (free tier)
- Create Stripe account (test mode)
- Install Local by Flywheel

#### Week 2: Business Setup
- Register Microsoft 365 CSP via Sherweb
- Create pricing packages
- Design proposal templates
- Set up bookkeeping/accounting
- Create client contract template

#### Week 3: Marketing Preparation
- Create portfolio case studies
- Write website copy
- Set up Google Business Profile
- Join local business networking groups
- Prepare cold email templates
- Create LinkedIn company page

#### Week 4: First Client Outreach
- Identify 50 target prospects
- Send 10 cold emails per day
- Attend 2 networking events
- Post on LinkedIn (3 times per week)
- Book 3-5 discovery calls

### Phase 1: Months 1-3 (First 5 Clients)

**Goal:** Validate offering, build case studies

**Client Mix:** 4 Regular + 1 Premium

**Revenue Target:** £5,209 total
**Monthly Recurring (Month 3):** £447.60/month

### Phase 2: Months 4-6 (10 Total Clients)

**Goal:** Build momentum, refine processes

**Client Mix:** 7 Regular + 3 Premium

**Revenue Target:** £7,637 Phase 2
**Monthly Recurring (Month 6):** £1,041.55/month

### Phase 3: Months 7-12 (20 Total Clients)

**Goal:** Scale to sustainable business

**Client Mix:** 12 Regular + 8 Premium

**Revenue Target:** £23,925 Phase 3
**Monthly Recurring (Month 12):** £2,375.80/month

---

## Risk Management

### Technical Risks

#### Risk 1: Hosting Performance Issues

**Description:** Client websites slow down or crash due to inadequate hosting.

**Likelihood:** Medium (shared hosting has limits)

**Impact:** High (lost bookings, client churn)

**Mitigation:**
1. Monitor performance proactively
2. Move clients to Premium hosting when thresholds reached
3. Clear upgrade path in contracts

#### Risk 2: Email Deliverability Problems

**Description:** Booking confirmation emails go to spam.

**Likelihood:** Low (Brevo has 95.5% deliverability)

**Impact:** High (customers miss confirmations)

**Mitigation:**
1. Proper DNS configuration (SPF, DKIM)
2. Monitor bounce rates
3. Maintain sender reputation
4. Backup SMS confirmations (Phase 2)

---

## Summary & Key Takeaways

### Critical Decision Points

1. **Hosting choice driven by concurrent dashboard users**, not just booking volume
2. **eCommerce = Premium** (WooCommerce shop requires better hosting)
3. **Booking payments ≠ eCommerce** (Stripe Checkout is fine on Regular hosting)
4. **Microsoft 365 CSP** for email reselling (80% UK market preference)
5. **Brevo Lite** shared account for all client transactional email (cost-effective)
6. **SMS as Phase 2 upsell** (not included initially, add after 6 months)

### Financial Targets

**Year 1 (20 clients mixed):**
- Total revenue: £36,771
- Total profit: £30,815
- Monthly recurring profit (Month 12): £1,398

**Year 2 (20 clients recurring):**
- Total revenue: £28,508
- Total profit: £16,768
- Monthly recurring profit: £1,398

**Year 3 (30 clients):**
- Total revenue: £52,432
- Total profit: £35,688
- Monthly recurring profit: £2,169

### Next Actions

1. Week 1: Sign up Hostinger + Brevo
2. Week 2: Apply for Microsoft 365 CSP via Sherweb
3. Week 3: Build agency website + marketing materials
4. Week 4: Start client outreach (10 emails/day, 2 networking events)
5. Month 1: Sign first 2 clients

---

**End of Document**
