# Testing Site — Setup Decisions & Configuration
## Wimbledon Smart Business — Internal Reference

**Document Version:** 1.0
**Date:** March 2026
**Status:** Active Reference
**Purpose:** Record all decisions made for the internal testing site setup. This site is for development and functional testing only — it is never shown to clients or prospects.

---

## Overview

A dedicated internal testing environment built as a staging site on `test.wimbledonsmart.co.uk`. Used to test the full Wimbledon Smart Plugin stack end to end — bookings, payments, email notifications, and dashboard — before building the real client demo site.

---

## Decisions Summary

### Site & Domain

| Decision | Choice | Rationale |
|---|---|---|
| Site URL | `test.wimbledonsmart.co.uk` | Subdomain on existing domain — no extra cost, no new registration needed |
| Hosting | Hostinger Agency Startup (existing account) | Already purchased, subdomain setup is straightforward in hPanel |
| WordPress install | Fresh install on subdomain | Clean environment, no legacy issues |
| Search engine indexing | Disabled | Staging/test site must never be indexed by Google |
| Public access | Password-protected (HTTP auth via hPanel) | Internal use only — not accessible to clients or the public |
| SSL | Free via Hostinger / Let's Encrypt | Standard on all Hostinger subdomains |

---

### Email — Brevo SMTP

| Decision | Choice | Rationale |
|---|---|---|
| Email provider | Brevo SMTP | Full production stack test — same setup as every real client |
| Verified sender domain | `test.wimbledonsmart.co.uk` | Already owned, DNS managed in Hostinger — no new domain needed |
| Sender email address | `bookings@test.wimbledonsmart.co.uk` | Realistic sender format matching what real clients will use |
| DNS records to set up | SPF, DKIM, DMARC on `test.wimbledonsmart.co.uk` | Required for inbox delivery via Brevo |
| Why Brevo and not Mailtrap | Testing real deliverability | Mailtrap catches emails without delivering — Brevo tests the full production flow including spam filter behaviour |

**What this tests:**
- Plugin triggers email via Brevo SMTP correctly
- Brevo sends from a verified sender domain
- SPF, DKIM, DMARC DNS records are correctly configured
- Emails land in inbox, not spam
- Exact DNS setup process that will be repeated for every real client

---

### Payments — Stripe

| Decision | Choice | Rationale |
|---|---|---|
| Mode | Test mode | Safe for development — no real charges |
| API keys | Stripe test publishable + secret keys | Added to plugin settings |
| Test card | 4242 4242 4242 4242 (any future expiry, any CVC) | Stripe standard test card for successful payments |
| Confirm in | Stripe test dashboard | Verify payment appears and triggers booking confirmation |

---

### Payments — PayPal

| Decision | Choice | Rationale |
|---|---|---|
| Mode | PayPal sandbox | Safe for development — no real charges |
| Accounts needed | Sandbox business account + sandbox buyer account | Created free at developer.paypal.com |
| Credentials | Sandbox client ID + secret | Added to plugin settings |

---

### Test Email Accounts — Personas

Two email personas are used to simulate both sides of a real booking:

| Role | Email | Purpose |
|---|---|---|
| Business owner | liron@wimbledonsmart.co.uk | Receives staff/owner booking notifications |
| Test customer | wsb.testclient@gmail.com | Receives customer confirmation and reminder emails |

**Why Gmail for the test customer:**
Gmail has aggressive, real-world spam filters. If Brevo-sent emails land cleanly in Gmail, SPF/DKIM/DMARC is correctly configured and real-world deliverability is confirmed. A more permissive inbox (e.g. Hostinger webmail) would not provide the same confidence.

**Setup required:**
- Create a new throwaway Google account: `wsb.testclient@gmail.com` (or similar)
- Use this email as the customer email when making all test bookings
- Check this inbox to verify confirmation and reminder emails arrive, are correctly formatted, and land in the primary inbox (not spam)

---

## What This Testing Site Is NOT

- Not a client demo site — never shown to prospects
- Not a permanent production environment
- Not a substitute for the `demo.wimbledonsmart.co.uk` demo site (to be built separately when ready for outreach)

---

## Future: Demo Site (Separate Build)

When ready to show the product to prospects, a separate demo site will be built:

| Decision | Planned Choice |
|---|---|
| Site URL | `demo.wimbledonsmart.co.uk` |
| Mock business | Glow Hair & Beauty, Wimbledon SW19 |
| Sender domain | `glowwimbledon.co.uk` (register ~£10 when ready) |
| Sender email | `bookings@glowwimbledon.co.uk` |
| Public access | Yes — password optional, or fully public |
| Purpose | Shown to all prospects during discovery calls |

This is a separate build, done after the testing site confirms the plugin is stable.

---

## Documentation Protocol for Testing Site Build

As the testing site is built, all steps, issues encountered, and resolutions are documented in a separate build log. This log feeds into:
- Updates to `Stage3_Build.md` and `Stage4_Launch.md` where gaps are found
- A future `Theme_Build_Reference.md` based on actual build experience
- The WordPress staging-to-production workflow reference

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Tools_Stack.md | Stage3_Build.md | Stage4_Launch.md | Infrastructure_Reference.md*
