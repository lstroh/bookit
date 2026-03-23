# Dev → Staging → Production: Deployment Workflow Reference
## Wimbledon Smart Business — Technical Reference

**Document Version:** 1.0
**Date:** March 2026
**Status:** Active Reference
**Applies To:** All new client builds using the standard stack (Local by Flywheel → Hostinger Business Cloud, Wimbledon Smart Plugin, Stripe, Brevo SMTP)

---

## Overview

Every client build passes through three environments in sequence:

| Environment | Tool | Purpose |
|---|---|---|
| **Local** | Local by Flywheel (your machine) | Initial build, fast iteration, no hosting costs |
| **Staging** | Hostinger hPanel built-in staging (subdomain) | Client review, QA, final approval |
| **Production** | Hostinger Business Cloud (live domain) | Go-live after Invoice 3 paid |

The rule is simple: **code and content move forward, never backward in the chain.** You build on local, show the client on staging, launch to production. Any post-launch changes go local → staging → production again.

---

## Environment 1 → 2: Local to Staging

### When This Happens
After the build is complete internally and you are ready for client-facing review (Step 3.4 → 3.5 in Stage3_Build.md).

### The Standard Process

**Option A — Recommended: Hostinger hPanel Native Staging**

Hostinger Business Cloud includes a built-in staging tool accessible from hPanel. This is the preferred approach for new client builds.

1. In hPanel, go to **WordPress → Staging → Create Staging**
2. Enter a subdomain name (e.g. `staging.clientdomain.co.uk`) — takes up to 15 minutes to create
3. Access the staging admin panel via **Manage Staging → Staging Admin Panel**
4. Build (or finalise) on staging, or push content from local using a migration plugin (see below)
5. Once approved by client, use **Publish** (⋮ → Publish) to push staging to production — Hostinger auto-creates a backup first

**Important:** The hPanel staging tool is only available on Business Cloud and above plans. You are on Business Cloud, so this is available for all standard client sites.

**Option B — Migration Plugin (Local → Staging)**

If you have built locally in Local by Flywheel and want to push to the Hostinger staging subdomain:

1. Install **All-in-One WP Migration** (free, widely reliable) on the local site
2. Export the site as a `.wpress` package — the plugin handles the URL search-and-replace automatically (replacing `sitename.local` with the staging subdomain URL)
3. Install the same plugin on the fresh Hostinger staging subdomain
4. Import the `.wpress` package
5. Verify the site loads correctly on the staging subdomain

**Recommended migration plugins in order of preference:**
- All-in-One WP Migration (simplest, handles URL replacement automatically)
- Duplicator (more control, good for large sites)
- WP Migrate DB Pro (best for database-only pushes in ongoing development)

### What Must Be Done After Any Migration
After every environment move, run through this short checklist before showing anything to the client or going live:

- [ ] URLs correct — no references to the old environment domain (use Better Search Replace plugin to check)
- [ ] Search engine indexing **discouraged** on staging (Settings → Reading → "Discourage search engines")
- [ ] Staging is password-protected — add HTTP auth via hPanel or use a Maintenance Mode plugin to prevent public access and accidental Google indexing
- [ ] Stripe in **test mode** on staging — never live keys on a non-production environment
- [ ] Brevo SMTP sender domain configured correctly for the staging environment
- [ ] All email notifications tested — confirm they arrive in inbox (not spam) from the correct sender address

---

## Environment 2 → 3: Staging to Production

### When This Happens
After written client approval and Invoice 2 paid (Step 4.3 in Stage4_Launch.md).

### The Standard Process

**Option A — Hostinger hPanel Publish (Recommended for clean builds)**

If the entire build happened on Hostinger staging:

1. Ensure **Invoice 3 is raised** and payment confirmed (no exceptions)
2. Take a manual backup of current staging via BlogVault **before** touching anything
3. In hPanel: **WordPress → Staging → ⋮ → Publish**
4. Confirm the pop-up — this replaces the live site files and database with the staging copy
5. Hostinger auto-creates a backup automatically before publishing, but confirm BlogVault has a separate copy as a secondary safety net
6. Proceed immediately to the post-migration checklist below

**Note:** Any changes made to the live site after the staging snapshot was created will be overwritten. For new client launches this is not a concern (no live content to lose). For updates to existing live sites, communicate the maintenance window to the client before publishing.

**Option B — Manual Migration Plugin Push (for Local → Live, or cross-host migrations)**

If migrating from Local by Flywheel directly to the live Hostinger environment (bypassing Hostinger's built-in staging):

1. Install All-in-One WP Migration on the local site
2. Export, specifying the live domain as the replacement URL
3. Create a fresh WordPress installation on Hostinger for the client's live domain
4. Import the `.wpress` file via All-in-One WP Migration on the live install
5. Run the post-migration checklist below

### Post-Migration Checklist (Critical — Do Before Pointing DNS or Going Public)

**URLs and database:**
- [ ] All URLs updated from staging/local to the live domain — run a search-and-replace check using Better Search Replace plugin
- [ ] Permalink structure re-saved (Settings → Permalinks → Save Changes, even without changes — this regenerates `.htaccess`)
- [ ] wp-config.php pointing to the correct live database credentials
- [ ] No remaining references to `.local`, `staging.`, or any dev subdomain in the database

**Stripe (critical — most common failure point):**
- [ ] Switch from **test mode to live mode** — update API keys in the Wimbledon Smart Plugin settings
- [ ] Go to **Stripe Dashboard → Developers → Webhooks** — confirm the webhook endpoint URL points to the live domain (not staging)
- [ ] If the webhook endpoint still shows the staging URL, delete it and create a new endpoint pointing to `https://[clientdomain]/[plugin-webhook-path]`
- [ ] Make a real £1 test payment with a live card and confirm it completes — then refund immediately
- [ ] Confirm the booking appears in the dashboard and the payment appears in Stripe live mode

**Brevo SMTP:**
- [ ] Confirm the plugin SMTP settings point to Brevo using the **client's verified sender domain** (not the staging address or your own domain)
- [ ] SPF, DKIM, and CNAME verification records confirmed in DNS for the client's sender domain
- [ ] Test booking made → confirmation email arrives in inbox (not spam) from client's domain
- [ ] Check with both Gmail and one other provider (Outlook or Apple Mail) — different spam filtering behaviour

**DNS and SSL:**
- [ ] Point DNS A record to the Hostinger server IP (from hPanel → Domain → DNS Zone)
- [ ] SSL auto-installs via Let's Encrypt once DNS propagates — confirm the padlock appears before sending anything to the client
- [ ] DNS propagation typically takes 15 minutes to 2 hours — check propagation at whatsmydns.net
- [ ] No mixed content warnings (HTTP assets on HTTPS page) — check in browser developer console

**WordPress settings:**
- [ ] Search engine indexing **re-enabled** (Settings → Reading — uncheck "Discourage search engines")
- [ ] Staging password protection removed if added
- [ ] Staging maintenance mode plugin deactivated or removed
- [ ] Google Analytics GA4 tracking ID installed and confirmed firing
- [ ] Google Search Console domain verified, sitemap submitted

---

## Common Failure Points and How to Avoid Them

### 1. Stale URL References in the Database
**What goes wrong:** WordPress stores URLs in the database, not just in files. After migration, internal links, image URLs, and plugin callbacks still reference the old domain.

**How to avoid it:** Always run Better Search Replace plugin after any migration. Search for the old domain (e.g. `sitename.local` or `staging.clientdomain.co.uk`) and replace with the new domain. Do this before testing anything — a missed URL can cause booking confirmation links to go to the wrong place.

### 2. Stripe Webhook Pointing to Staging
**What goes wrong:** The booking plugin registers a Stripe webhook endpoint when first connected. If that endpoint still points to the staging subdomain after go-live, Stripe will fail to deliver payment events — bookings may complete in Stripe but the plugin won't update booking status, and confirmation emails may not send.

**How to avoid it:** After every migration to production, go to Stripe Dashboard → Developers → Webhooks. Verify the endpoint URL. If it still references staging, delete the old endpoint and add a new one pointing to the live domain. Then send a test webhook from the Stripe dashboard to confirm it returns a 200 response.

### 3. Stripe Test Mode Left Active on Production
**What goes wrong:** The site goes live but Stripe is still in test mode. Real customers enter real card details and the payment silently fails because the live API keys are not active.

**How to avoid it:** This is on the Stage 4 pre-launch checklist. Make it the first thing you check after migration, before touching DNS or sending anything to the client. The test payment step (£1 with a real card, refunded immediately) is the proof.

### 4. Brevo SMTP Sending From Wrong Domain
**What goes wrong:** Booking confirmation emails arrive at customers from `noreply@wimbledonsmart.co.uk` or a Brevo test address rather than from the client's own domain. This looks unprofessional, damages trust, and may land in spam.

**How to avoid it:** Each client must have their sender domain verified in Brevo (SPF + DKIM + CNAME records in DNS). After migration, confirm the plugin SMTP settings explicitly reference the client's sender domain, not any shared or default address. Test with a real booking and check the From address in the received email.

### 5. PHP Version Mismatch Between Environments
**What goes wrong:** The Wimbledon Smart Plugin runs correctly on local (which uses whatever PHP version Local installed) but behaves unexpectedly on Hostinger because of a version difference. Custom plugin code that works on PHP 8.1 may have deprecation warnings or silent failures on PHP 8.0 or earlier.

**How to avoid it:** In hPanel, confirm the PHP version for the live site matches the version used in Local. You can set the PHP version per domain in hPanel under **Hosting → PHP Configuration**. Check Local's PHP version under the site's **Info** tab.

### 6. Caching Serving Stale Content After Migration
**What goes wrong:** You push staging to production but Hostinger's server-side cache or a caching plugin serves old cached pages. The site appears to show the correct content in admin but visitors see outdated pages.

**How to avoid it:** After any migration push via hPanel, clear the Hostinger cache from hPanel → **WordPress → Cache → Purge Cache**. If you have any caching plugin (LiteSpeed Cache, W3 Total Cache) installed, clear its cache from the WordPress admin as well immediately after migration.

### 7. Google Site Kit Asking for Re-Setup After Migration
**What goes wrong:** If Google Site Kit (or similar analytics connector) was set up on staging, migrating to production may invalidate its OAuth tokens because the domain has changed.

**How to avoid it:** Reset Site Kit on staging before pushing to production. On the live site, reconnect Site Kit from scratch. Your historical Analytics data is safe — it lives in Google's servers, not in WordPress.

### 8. Staging Subdomain Indexed by Google
**What goes wrong:** You forget to discourage search engine indexing on the staging subdomain. Google indexes it. The client's site now has a duplicate content issue, and Google Search Console may show the staging URL in search results.

**How to avoid it:** Always set Settings → Reading → "Discourage search engines" on staging. Better yet, add HTTP auth password protection via hPanel so the staging subdomain is inaccessible to crawlers entirely.

---

## Custom Plugin Considerations (Wimbledon Smart Plugin)

The Wimbledon Smart Plugin has specific behaviours at each migration point that standard WordPress plugins do not have. These must be handled explicitly.

### Stripe Integration
- The plugin stores Stripe API keys (both test and live) and a webhook secret in the WordPress database
- After any migration, these database values carry over but may reference the wrong environment or domain
- **At local → staging:** Set test mode keys. Do not connect to live Stripe on staging — ever.
- **At staging → production:** Switch to live keys, update the webhook URL in Stripe dashboard, and run the £1 test payment

### Brevo SMTP
- The plugin stores the SMTP host, port, credentials, and sender domain in the database
- After migration these carry over, but the sender domain must be verified in Brevo for the client's domain
- If a staging sender address was used (e.g. a test domain), update it to the client's verified domain before testing email delivery on production

### Vue.js Business Dashboard
- The dashboard makes REST API calls back to the WordPress domain
- If any hardcoded URLs exist in plugin assets (JS/CSS), they must reference the correct domain
- After migration, open the dashboard and monitor the browser's network tab for failed API calls — any 404s indicate a URL mismatch

### Google Calendar Sync
- Google Calendar sync requires OAuth credentials that are bound to a specific domain (the redirect URI registered in Google Cloud Console)
- **Never configure Google Calendar sync on local or staging** — it will not work and may create invalid token states
- Google Calendar sync is a Stage 4 action: configured on the live domain only, after DNS has propagated and SSL is active
- This is already noted in Stage3_Build.md Step 3.2 and on the QA checklist

### Custom Database Tables
- The Wimbledon Smart Plugin creates its own custom database tables (separate from standard WordPress tables with the `wp_` prefix)
- When using All-in-One WP Migration or WP Staging push, custom tables are included by default — confirm this in the migration tool settings
- After migration, verify bookings, services, and staff data appear correctly in the dashboard — this confirms the custom tables migrated intact

---

## Hostinger-Specific Notes

### hPanel Native Staging — What It Does and Doesn't Do
- Creates a subdomain staging environment as a full copy of the live site (files + database)
- The **Publish** button does a full file + database overwrite of the live site with the staging version
- It does **not** do selective sync — it is all-or-nothing (entire staging → entire production)
- This is fine for new builds (nothing to lose on production). For updates to existing live sites, time the Publish carefully to avoid overwriting recent live bookings
- Hostinger creates an automatic backup before publishing — but always verify BlogVault has a separate recent backup as a secondary safety net

### Rollback
- After a failed Publish: in hPanel → WordPress → Staging → **Revert** to restore the previous live version from Hostinger's auto-backup
- After any migration failure: restore from the most recent BlogVault backup (daily offsite backups)
- Keep the staging environment intact until you have confirmed the live site is working correctly — do not delete staging immediately after go-live

### Subdomain Password Protection on Hostinger
To prevent the staging subdomain from being publicly accessible, add HTTP authentication via hPanel:
1. hPanel → **Hosting → Advanced → Directory Index**
2. Or use the **.htpasswd** method via File Manager
3. Alternatively, install a staging maintenance mode plugin like "Maintenance" (DesignWall) and configure it on staging only

---

## Summary: The Three Transition Checklists

### Local → Staging
- [ ] Export from Local using All-in-One WP Migration (or equivalent)
- [ ] URL search-and-replace confirms no `.local` URLs remain
- [ ] Indexing discouraged on staging
- [ ] Staging password-protected
- [ ] Stripe in test mode
- [ ] Email notifications tested from staging

### Staging → Production (after Invoice 3 paid)
- [ ] BlogVault backup of staging taken manually
- [ ] URLs confirmed pointing to live domain (no staging references)
- [ ] Stripe switched to live mode, webhook URL updated in Stripe dashboard, £1 test payment completed
- [ ] Brevo SMTP sending from client's verified sender domain, confirmation email lands in inbox
- [ ] Permalink structure re-saved
- [ ] DNS pointed, SSL active, padlock confirmed
- [ ] Indexing re-enabled on production
- [ ] Staging password protection removed
- [ ] Hostinger cache purged
- [ ] Google Calendar sync configured on live domain (first time only)

### Post-Launch Spot Checks (Within 30 Minutes of Go-Live)
- [ ] End-to-end booking flow on live domain — real payment, real email, calendar event created
- [ ] Dashboard accessible, all logins working
- [ ] No mixed content warnings in browser console
- [ ] UptimeRobot monitor showing Up
- [ ] Google Analytics real-time view confirming tracking is firing

---

## Flags for Stage3_Build.md and Stage4_Launch.md

The following are gaps or improvements identified by cross-referencing current workflow docs against industry practice:

**Stage3_Build.md — Gaps to Address:**
1. Step 3.1 currently does not mention password-protecting the staging subdomain. This should be a mandatory setup step, not optional. Publicly accessible staging subdomains risk indexing and client confusion.
2. PHP version parity between Local and Hostinger is not mentioned. Add a check: confirm Local PHP version matches Hostinger's PHP configuration for the client's hosting account.
3. The Google Calendar sync note ("flagged as Stage 4 action") is correct but could be more explicit about *why* — OAuth redirect URIs are domain-bound and simply will not work on local or staging.

**Stage4_Launch.md — Gaps to Address:**
1. Step 4.3 mentions running "search-and-replace to update staging URLs to the live domain" but does not specify the recommended tool. Name Better Search Replace explicitly as the plugin to use for this — WP-CLI is listed but requires SSH access which may not always be available.
2. The migration step does not mention re-saving permalink structure after migration. This is a common cause of 404 errors post-migration and should be a named action in Step 4.3.
3. The Stripe webhook update step is correct but should add: after updating the webhook URL in Stripe, send a test webhook from the Stripe dashboard and confirm a 200 response before proceeding. This takes 30 seconds and eliminates a common source of booking failures on Day 1.
4. No mention of clearing Hostinger's server-side cache after the Publish push. Add a cache purge step in Step 4.4 Post-Launch Verification.
5. The Hostinger native staging "Publish" button makes the All-in-One WP Migration plugin approach potentially redundant for new builds. Consider documenting the hPanel Publish path as the primary route and migration plugin as the fallback.

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Stage3_Build.md | Stage4_Launch.md | Tools_Stack.md | Infrastructure_Reference.md*
