# WordPress Maintenance — Best Practices Reference
## Wimbledon Smart Business — Internal Reference

**Document Version:** 1.0
**Date:** March 2026
**Status:** Active Reference
**Purpose:** External best practice research to validate and improve Stage 5 maintenance process
**Audience:** Liron (solo operator)

---

## Overview

This document summarises current (2025–2026) best practices for maintaining a small portfolio of client WordPress sites. It is written specifically for Wimbledon Smart's stack: Hostinger Business Cloud, Wimbledon Smart Plugin, Stripe, Brevo SMTP, BlogVault, Wordfence, and UptimeRobot.

Flags throughout indicate where current best practice **confirms**, **improves upon**, or **conflicts with** what is documented in `Stage5_6_OngoingAndReview.md`.

---

## 1. Monthly Maintenance Routine — Recommended Order

The consensus across current best practice is to run maintenance tasks in a fixed sequence: monitoring first, updates second, functionality checks third. The logic: confirm the site is healthy before touching anything, then confirm it is still healthy after.

**Recommended order:**

1. **Review monitoring dashboards** — uptime, backup status, security alerts (UptimeRobot, BlogVault, Wordfence)
2. **Apply WordPress updates** — staging first, then live (see Section 2)
3. **Run a Wordfence scan** — if not already scheduled automatically
4. **Check plugin-level functionality** — payment gateway, calendar sync, email delivery
5. **Review error logs** — PHP errors, plugin conflicts, failed transactions
6. **Database optimisation** — clean post revisions, expired transients, spam comments
7. **Check SSL certificate expiry** — flag if under 30 days to renewal
8. **File internal monthly report**
9. **Send client check-in email**

**✅ Confirms Stage 5:** The existing step order in `Stage5_6_OngoingAndReview.md` (dashboards → updates → plugin check → report → email) matches this sequence well.

**⚠️ Improvement — Steps 6 & 7 missing from Stage 5:** Database optimisation and SSL certificate checking are both standard monthly tasks in current best practice guides but are absent from the current Stage 5 process. Both are low-effort:
- **Database:** WP-Optimize plugin handles cleanup in one click (clears post revisions, drafts, expired transients). Run monthly.
- **SSL:** UptimeRobot's free tier includes SSL expiry monitoring with automatic alerts. Add this as a one-time setup step in Stage 4 (Launch) alongside the existing UptimeRobot setup, so it is already running for every client before Stage 5 begins.

---

## 2. Testing Updates Before Applying to Live Sites

**The non-negotiable rule:** never apply updates directly to a live client site without staging validation first.

### Update Categories and Risk Levels

| Update Type | Risk Level | Recommended Approach |
|---|---|---|
| WordPress minor (e.g. 6.8.1 → 6.8.2) | Low | Apply to staging, quick smoke test, then live |
| WordPress major (e.g. 6.8 → 6.9) | Medium–High | Apply to staging, full booking flow test, monitor 24–48h before live |
| Plugin updates (third-party) | Medium | Apply to staging, test affected functionality, then live |
| Wimbledon Smart Plugin updates | High | Test on all staging environments before pushing to any live site — one broken update affects every client simultaneously |
| Theme updates | Low–Medium | Apply to staging; verify no visual regressions, especially on mobile |

### Staging Approach for a Small Portfolio

At 3–5 sites, there are two practical options:

**Option A — WP Staging plugin (recommended at current scale)**
Clones the live site to a staging subdirectory with one click. Test updates on the clone, then apply to live. No separate hosting environment needed. The free tier covers the core use case; WP Staging Pro adds push-to-live functionality.

**Option B — Local by Flywheel (already in the stack)**
Pull a copy of the live site to local, apply and test updates locally, then push changes. More setup overhead per session, but fully offline and zero risk of staging being accidentally indexed.

**Note on staging environment freshness:** Refresh (re-sync) the staging environment from the live site before each monthly update session. Testing updates against a stale clone that is weeks out of date gives unreliable results.

### What to Test After Every Update

Run through this sequence on staging before applying to live:

1. Homepage loads correctly
2. Booking flow end-to-end — make a test booking, confirm it appears in the dashboard
3. Payment processes in Stripe test mode
4. Confirmation email sends via Brevo
5. Calendar sync triggers (where applicable)
6. No PHP errors in admin (check Tools → Site Health, or Query Monitor plugin)

**⚠️ Improvement — changelog review:** Current best practice recommends reading plugin changelogs *before* applying updates, not after. A changelog flagging "significant database changes" or "breaking change for custom integrations" warrants extra caution on staging. This is particularly relevant for Wimbledon Smart Plugin releases: document what changed in each version and check for downstream effects on Stripe, Brevo, and Google Calendar integrations before pushing to any live site.

**✅ Confirms Stage 5:** The staging-first rule, the booking flow test checklist, and the instruction never to auto-update live sites are all consistent with current best practice.

---

## 3. Efficiently Managing Updates Across Multiple Client Sites

### Batching

The most effective time-saving habit for a solo operator is batching all site maintenance into a fixed monthly window — e.g. first Tuesday morning of each month — rather than handling updates ad-hoc as they appear. This protects evenings and weekends, creates a repeatable rhythm, and reduces context-switching.

**✅ Confirms Stage 5:** The existing guidance to batch into a single session at 5+ clients is consistent with best practice.

### Update Sequencing Across Clients

When the same plugin update needs to go to all clients, apply it to one staging environment first, verify it passes, then roll it through the remaining staging environments. Once all staging environments pass, apply to live sites one at a time rather than simultaneously — this limits blast radius if something behaves unexpectedly on live.

### Rollback Readiness

Before applying any update to a live site, confirm BlogVault shows a successful backup from the last 24 hours. If the most recent backup is older than 24 hours, trigger a manual backup first, wait for it to complete, then proceed. Never update a live site without a confirmed recent backup.

**✅ Confirms Stage 5:** BlogVault backup verification is Step 1 in the current process. This sequencing is correct.

---

## 4. Multi-Site Management Tools — Evaluation for Wimbledon Smart

At 3–5 sites, the current approach of logging into each site individually each month is viable with no additional overhead cost. A centralised management dashboard becomes worth the investment at 8–10+ sites.

### The Main Options

**ManageWP**
Cloud-based dashboard for managing updates, backups, security, and uptime across all connected sites. The core product is free; premium add-ons are priced per site (around £2/site/month for on-demand backups). Owned by GoDaddy since 2016.

- Pros: Easy to set up, clean interface, good client reporting
- Cons: Per-site billing for premium features adds up at scale. As a cloud tool owned by GoDaddy, client site data passes through a third-party US-owned server — this has GDPR implications for a UK business. ManageWP's Data Processing Agreement would need to be reviewed, and clients may need to be informed.
- Best for: Operators who want ease of use and are comfortable with cloud-hosted tooling

**MainWP**
Self-hosted. Install a central WordPress dashboard on your own server; connect client sites via a lightweight child plugin. Core functionality is free for unlimited sites; premium extensions (including client reports and additional integrations) available at around £29/month or a one-off lifetime fee of around £600.

- Pros: GDPR-friendly by design — no client data leaves your own server. No per-site billing. Integrates with tools already in the stack (BlogVault, Wordfence). Flat-fee pricing scales well across 10, 15, or 20 sites at no extra cost.
- Cons: More setup effort than ManageWP. You are responsible for keeping the central dashboard installation itself updated. Steeper initial learning curve.
- Best for: Privacy-conscious operators managing 10+ sites, or anyone wanting predictable flat-fee pricing at scale

**WP Remote**
Built on BlogVault (already in the stack). Provides centralised plugin/theme/core updates, uptime monitoring, client reports, and staging environments — free for core features. Because BlogVault is already paid per site, WP Remote may offer a useful unified management view with minimal additional cost or setup.

### Recommendation for Wimbledon Smart

**Now (3–5 sites):** No management platform needed. Current manual process is fine.

**At 6–8 sites:** Evaluate WP Remote first — it leverages the existing BlogVault relationship and may cover the main update and reporting workflow without adding a new vendor.

**At 10+ sites:** Adopt MainWP. The GDPR self-hosted advantage is meaningful in a UK B2B context, flat-fee pricing is clearly more economical than per-site billing at this scale, and it integrates with BlogVault and Wordfence which already run on every client site.

---

## 5. Additional Best Practices Not Currently in Stage 5

The following are mentioned consistently in current best practice sources and are worth adding to Stage 5 or the Stage 6 Quarterly Review.

### PHP Version Monitoring
WordPress performance and security depend partly on the PHP version running on each site's hosting. Outdated PHP versions are a common attack vector and can also block newer plugin versions from installing. Check the PHP version per site in Hostinger dashboard or via WordPress → Tools → Site Health. Current recommended minimum is PHP 8.2+.

**Suggested action:** Add a quarterly PHP version check to the Stage 6 Quarterly Review checklist.

### Broken Link Checking
Broken internal and external links are a recurring minor issue on service business sites — staff change, services are removed, external sites go offline. Broken Link Checker plugin runs passively in the background and emails alerts when broken links are detected.

**Suggested action:** Install Broken Link Checker at Stage 3 or 4. Review any flagged links as part of the monthly report or client check-in email.

### Backup Restoration Testing
A backup that cannot be restored is worthless. Having BlogVault show 31 successful backups does not confirm those backups can be restored. Current best practice recommends testing restoration at least quarterly — not restoring the live site itself, but verifying a recent backup can be retrieved and mounted in a staging environment with the booking flow intact. BlogVault includes restoration tools.

**Suggested action:** Add a quarterly backup restoration test to the Stage 6 Quarterly Review. Document the result in the client record.

### Plugin Audit (Quarterly)
Plugins that have not received an update in 12+ months are potentially abandoned and represent a growing security risk. At each quarterly review, check the installed plugin list for anything flagged as abandoned or with known vulnerabilities (Wordfence flags these automatically). Remove or replace as needed.

**Suggested action:** Add a plugin audit to the Stage 6 Quarterly Review checklist.

---

## 6. Summary: Flags Against Stage5_6_OngoingAndReview.md

| Item | Status | Suggested Action |
|---|---|---|
| Step order (dashboards → updates → plugin check → report → email) | ✅ Confirmed as best practice | No change needed |
| Staging-before-live rule | ✅ Confirmed | No change needed |
| Batching maintenance sessions at scale | ✅ Confirmed | No change needed |
| BlogVault backup check before applying updates | ✅ Confirmed as correct sequencing | No change needed |
| Database optimisation (monthly) | ⚠️ Missing | Add WP-Optimize step after plugin check in Step 5.3 |
| SSL certificate expiry monitoring | ⚠️ Missing | Add to Stage 4 UptimeRobot setup; review status monthly |
| Staging environment refresh before update session | ⚠️ Not mentioned | Add note to Step 5.2 |
| Changelog review before applying updates | ⚠️ Not mentioned | Add to Step 5.2 guidance |
| Backup restoration testing (quarterly) | ⚠️ Missing | Add to Stage 6 Quarterly Review checklist |
| PHP version monitoring (quarterly) | ⚠️ Missing | Add to Stage 6 Quarterly Review checklist |
| Broken link checking | ⚠️ Missing | Add as passive plugin at Stage 4 Launch; review monthly |
| Plugin audit for abandoned plugins (quarterly) | ⚠️ Missing | Add to Stage 6 Quarterly Review checklist |
| Multi-site management tool | ℹ️ Not yet needed | Revisit at 6–8 sites (WP Remote); adopt MainWP at 10+ |

---

*Document Version: 1.0 | Created: March 2026*
*Sources: StellarWP (Apr 2025), Pagely (Dec 2025), MantyWeb (Jan 2026), DreamHost (Sep 2025), WPDive (Dec 2025), WisdmLabs (Nov 2025), InstaWP (Jan 2026), MalCare (Jun 2025)*
*Related documents: Stage5_6_OngoingAndReview.md | Stage4_Launch.md | Tools_Stack.md*
