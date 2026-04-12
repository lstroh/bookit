# Testing Site Build Log — `test.wimbledonsmart.co.uk`
## Wimbledon Smart Business — Internal Reference

**Document Version:** 1.0
**Date:** 3 April 2026
**Status:** Session 1 Complete — Plugin Development In Progress
**Purpose:** Full record of all steps completed, issues encountered, and resolutions during the testing site build. To be updated each session until the site is fully operational.

---

## Environment Summary

| Item | Detail |
|---|---|
| **Site URL** | `test.wimbledonsmart.co.uk` |
| **Hosting** | Hostinger Agency Startup |
| **WordPress** | Fresh install — April 2026 |
| **Plugin** | Wimbledon Smart Plugin (installed from GitHub zip) |
| **Email** | Brevo SMTP — sender `bookings@test.wimbledonsmart.co.uk` |
| **Payments** | Stripe test mode + PayPal sandbox (pending) |
| **Test customer inbox** | `wsb.testclient@gmail.com` (to be created) |
| **Business owner inbox** | `liron@wimbledonsmart.co.uk` (Hostinger email) |

---

## Session 1 — 3 April 2026

### Step 1 — Create `liron@wimbledonsmart.co.uk` email account
**Status:** ✅ Complete

- Created via Hostinger hPanel → Emails → Email Accounts
- Used as WordPress admin email and business owner test inbox
- Accessible via webmail at `webmail.wimbledonsmart.co.uk`

---

### Step 2 — Create subdomain `test.wimbledonsmart.co.uk`
**Status:** ✅ Complete

- Created via hPanel → Domains → Subdomains
- Document root: `public_html/test` (default)
- SSL provisioned automatically via Let's Encrypt

---

### Step 3 — Install WordPress on subdomain
**Status:** ✅ Complete

- Installed via hPanel → WordPress → Auto Installer
- Installation URL: `test.wimbledonsmart.co.uk`
- Site title: `WSB Test Site`
- Admin username: non-default (not `admin`)
- Admin email: `liron@wimbledonsmart.co.uk`

---

### Step 4 — Protect site from public access
**Status:** ✅ Complete

- Hostinger built-in maintenance mode enabled
- Location: hPanel → WordPress → Maintenance Mode
- Site shows maintenance page to any public visitor
- **Note:** Maintenance mode must be temporarily disabled when testing Stripe and PayPal webhooks (server-to-server calls cannot pass through maintenance mode). Re-enable after webhook testing is complete.

---

### Step 5 — WordPress basic configuration
**Status:** ✅ Complete

- Search engine indexing disabled: WordPress Admin → Settings → Reading → "Discourage search engines from indexing this site"
- Permalink structure set to Post name: WordPress Admin → Settings → Permalinks → Post name → Save Changes
- Default content deleted: sample post, sample page, and sample comment removed

---

### Step 6 — Install and activate Wimbledon Smart Plugin
**Status:** ✅ Complete

- Repository: GitHub (public)
- Method: Downloaded zip via GitHub → Code → Download ZIP, then uploaded via WordPress Admin → Plugins → Add New Plugin → Upload Plugin
- Plugin activated successfully
- Plugin menu visible in WordPress sidebar

**Deployment process established (for all future updates):**
1. Run locally: `composer install --no-dev --optimize-autoloader --classmap-authoritative`
2. Run tests: `vendor/bin/phpunit` (when PHP files were modified)
3. Zip the entire `bookit-booking-system/` folder
4. WordPress Admin → Plugins → Deactivate → Delete → Add New → Upload Plugin → Activate
5. If 409 Conflict error: manually delete the plugin folder first via hPanel → File Manager → `public_html/wp-content/plugins/`

---

### Step 7 — Install and activate Wordfence Security
**Status:** ✅ Complete

- Installed via WordPress Admin → Plugins → Add New Plugin → search "Wordfence Security"
- Free tier — no premium upgrade required
- Security alert email set to `liron@wimbledonsmart.co.uk`
- No additional configuration required at this stage

---

### Step 8 — LiteSpeed Cache configuration
**Status:** ✅ Complete

**Issue encountered:** LiteSpeed Cache was interfering with the Bookit dashboard — caching POST requests, breaking login form submission and PHP session handling.

**Resolution:** Added exclusion paths to Private Cached URIs in LiteSpeed Cache settings.

**Location:** WordPress Admin → LiteSpeed Cache → Cache → Private Cached URIs

**Paths added (one per line):**
```
/bookit-dashboard/
/bookit-dashboard/app/
/bookit-dashboard/setup/
/bookit-dashboard/logout/
/book/
/booking-confirmed/
/booking-confirmed-v2/
/my-packages/
/wp-json/bookit/
/bookit-cancel/
/bookit-reschedule/
/book-v2/
```

After saving: clicked **Flush All Cache**.

**⚠️ Must repeat on every new client site build — add to Stage 3 checklist.**

---

### Step 8b — LiteSpeed Object Cache enabled
**Status:** ✅ Complete

- Redis object cache enabled at server level
- Location: hPanel → WordPress → LiteSpeed Cache → Object (toggle ON)
- Safe to enable — speeds up database queries, does not interfere with PHP sessions
- Can be flushed at any time via hPanel → Clear Cache or WordPress Admin → LiteSpeed Cache → Purge All

---

### Step 8c — Permalink flush after plugin activation
**Status:** ✅ Complete

- Flushed rewrite rules after plugin activation so `/bookit-dashboard/` routes register correctly
- Location: WordPress Admin → Settings → Permalinks → Save Changes
- **Note:** Must be done after every plugin activation or update.

---

### Step 9 — Brevo account setup
**Status:** ✅ Complete

- Account created at brevo.com using `liron@wimbledonsmart.co.uk`
- Company name: Wimbledon Smart Business
- Plan: Free (300 emails/day — sufficient for testing and early clients)

---

### Step 10 — Brevo sender domain authentication
**Status:** ✅ Complete

- Domain added: `test.wimbledonsmart.co.uk`
- Authentication method: Automatic (Brevo connected directly to Hostinger DNS)
- Records added automatically: SPF, DKIM, DMARC
- Domain status: ✅ Authenticated (confirmed same session — no propagation delay)

DNS records added:
```
SPF:  TXT  @   v=spf1 include:spf.sendinblue.com ~all
DKIM: CNAME mail._domainkey → mail._domainkey.sendinblue.com
```

---

### Step 11 — Brevo sender address created
**Status:** ✅ Complete

- Sender email: `bookings@test.wimbledonsmart.co.uk`
- Sender name: WSB Test
- Accepted by Brevo without requiring confirmation email

---

### Step 12 — Brevo API key generated and configured in plugin
**Status:** ✅ Complete

- API key generated: Brevo → top-right menu → SMTP & API → API Keys tab → Generate new key
- Key format: starts with `xkeysib-...`
- Saved in: Bookit Dashboard → Settings → Email → Email Provider → Brevo → API Key field
- From Name: set to business name
- From Email: `bookings@test.wimbledonsmart.co.uk`
- Status indicator: ✅ Green (Connected)

**Test email result:** Test email sent to personal Gmail account — landed in primary inbox (not spam). Brevo connection confirmed working.

---

### Step 13 — Admin password reset via phpMyAdmin
**Status:** ✅ Complete

**Issue encountered:** Could not log in to Bookit dashboard after first-time setup — no self-service password reset exists yet (planned Phase 2).

**Resolution:** Reset password directly in the database.

**Location:** hPanel → Databases → phpMyAdmin → SQL tab

**SQL used:**
```sql
UPDATE wp_bookings_staff
SET password_hash = '$2b$12$[generated-hash]',
    updated_at    = NOW()
WHERE email = 'your-admin-email@example.com'
  AND role  = 'admin';
```

**Hash generated via:**
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
```

Admin password subsequently changed to a strong password via Bookit Dashboard → Profile. ✅

---

### Step 14 — WP_DEBUG temporarily enabled
**Status:** ⚠️ Currently ON — intentional for plugin development session

- Enabled to diagnose Brevo fatal error — now resolved
- Location: hPanel → File Manager → public_html → wp-config.php

```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_DISPLAY', true );
define( 'WP_DEBUG_LOG', true );
```

**⚠️ Must be turned OFF before any client-facing use or go-live. Set all three to `false` or remove the lines.**

---

### Step 15 — Stripe test mode configuration
**Status:** ✅ Complete

**Part A — API Keys**

Keys retrieved from Stripe Dashboard → Test mode → Developers → API keys:
- Publishable key: `pk_test_...` (visible in Bookit Dashboard → Settings → Payments)
- Secret key: `sk_test_...` (shows as `SAVED` once stored)

Keys entered in: Bookit Dashboard → Settings → Payments

**Verification method:** If the publishable key field shows the correct `pk_test_...` 
value, both keys are correctly saved — they are always saved together.

**Part B — Webhook**

Webhook configured in Stripe Dashboard → Test mode → Developers → Webhooks → 
Add endpoint:

- Endpoint URL: `https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/stripe/webhook`
- Events registered:
  - `checkout.session.completed`
  - `charge.refunded`

Signing Secret (`whsec_...`) revealed after saving the endpoint and entered in:
Bookit Dashboard → Settings → Payments → Webhook Signing Secret field

**Final settings confirmed in Bookit Dashboard → Settings → Payments:**
- Stripe Mode: Test
- Publishable key: `pk_test_...` (confirmed correct)
- Secret key: SAVED
- Webhook Signing Secret: SAVED

⚠️ Reminder: Maintenance mode must be temporarily disabled when testing 
Stripe webhooks — server-to-server calls cannot pass through maintenance mode. 
Re-enable immediately after webhook testing is complete.

----

### Step 16 — Test persona email accounts confirmed
**Status:** ✅ Complete

Three email personas established for end-to-end testing:

| Persona | Email | Purpose |
|---|---|---|
| Test customer | `wsb.testclient@gmail.com` | Customer confirmation and reminder 
emails — Gmail spam filter test |
| Test staff member | `wsb.teststaff@test.wimbledonsmart.co.uk` | Staff booking 
notifications |
| Business owner | `liron@wimbledonsmart.co.uk` | Owner booking notifications |

**Notes:**
- Gmail used for test customer — aggressive spam filtering confirms real-world 
  deliverability if emails land in primary inbox
- | Email personas | ✅ All three confirmed — see Step 16 |
- A second Gmail account for staff could not be created (Google account limit) — 
  Hostinger email on the test domain is a suitable alternative for staff 
  notification testing

  ----

  ### Step 17 — Caching layers: clear after every frontend deployment
**Status:** 📋 Development reference — action required after every plugin update

Three separate caching layers exist on the Hostinger setup. All three must be 
cleared after every frontend deployment, in this order:

**1 — LiteSpeed Cache Plugin (WordPress)**
- WordPress Admin → LiteSpeed Cache → Manage → Purge All
- Also check: LiteSpeed Cache → Page Optimization → JS Settings
- Confirm JS Minify and JS Combine are both OFF

**2 — Hostinger Server Cache (hPanel)**
- hPanel → Hosting → Manage → Cache Manager → Purge All / Clear Cache
- ⚠️ This caches static JS/CSS files at server level independently of WordPress
- This was the cache causing deployment issues — must not be skipped

**3 — Hostinger CDN Cache**
- hPanel → find CDN section → Purge / Clear CDN cache
- CDN serves cached JS files from edge servers and ignores both WordPress 
  and server-level purges
- This was the final culprit — always clear last, after the above two

**⚠️ All three must be cleared every time. Clearing only one or two is not 
sufficient — stale JS/CSS will persist at whichever layer was skipped.**

## Outstanding — To Complete in Next Session

| Item | Notes |
|---|---|
| Create `wsb.testclient@gmail.com` | Throwaway Gmail for test customer persona — first thing next session |
| Turn off WP_DEBUG | hPanel → File Manager → wp-config.php — before go-live |
| Stripe test mode configuration | Add test API keys to plugin settings |
| PayPal sandbox configuration | Create sandbox accounts at developer.paypal.com, add credentials |
| Webhook testing | Requires temporarily disabling maintenance mode — re-enable after |
| Full booking flow test | End-to-end: booking → payment → email to both personas |
| Google Calendar OAuth | Requires live domain — Stage 4 action, not testable here |

---

## Notes for Stage 3 Checklist Updates

The following items were identified during this build and must be added to the standard Stage 3 checklist for all future client builds:

1. **LiteSpeed Cache exclusions** — add all Bookit paths to Private Cached URIs immediately after plugin activation. This is a required step, not optional.
2. **Permalink flush** — always flush rewrite rules after plugin activation (Settings → Permalinks → Save Changes).
3. **LiteSpeed Object Cache** — enable Redis object cache via hPanel on every new site.

---
## Post-Launch Notes

### Brevo Email Templates (Optional — Post-Launch)

**Status:** Not required before launch — plain HTML emails via Brevo are fully working.

The plugin currently sends its own plain HTML emails via Brevo. No action is required before launch.

Brevo supports branded transactional email templates (logo, colours, footer, unsubscribe link) designed in their drag-and-drop editor. The plugin has been built to support these — six template ID fields are available in Bookit Dashboard → Settings → Email → Brevo Email Templates, one per notification type:

- Booking confirmation (customer)
- Booking cancellation (customer)
- Booking rescheduled (customer)
- Magic link cancellation email
- Magic link reschedule email
- Business/staff new booking alert

**How to set up a Brevo template (when ready):**
1. Log into Brevo → Transactional → Templates → Create a new template
2. Design using Brevo's editor — add variable placeholders such as `{{ params.customer_name }}`, `{{ params.service_name }}`, `{{ params.booking_date }}` for dynamic content
3. Publish the template — Brevo assigns a numeric ID (e.g. `5`)
4. Enter that ID in the relevant field in Bookit Dashboard → Settings → Email → Brevo Email Templates
5. Save — future emails of that type will use the Brevo template design

Any field left blank continues to use the plain HTML fallback. Can be done one notification type at a time, in any order. Zero-downtime change — no code deployment required.

**Timing:** Post-launch, client-facing task. Requires access to the client's Brevo account and their brand assets (logo, colours). Suggested timing: after the first week of live bookings, once the client is comfortable with the system.



*Document Version: 1.0 | Created: 3 April 2026*
*Related documents: Testing_Site_Decisions.md | Stage3_Build.md | Stage4_Launch.md | Tools_Stack.md*
