# Playwright E2E Testing Strategy
## Bookit Booking System — Phase 1

**Document Version:** 1.0
**Date:** April 2026
**Status:** APPROVED — Implement after Phase 1 code-complete
**Sprint:** Playwright Sprint (after Sprint 6D)

---

## Decision Summary

E2E browser automation using Playwright. One suite, two modes. Semi-automated
for live site (manual prompts for email and Stripe). Fully automated for local
development (Mailpit for email, Stripe CLI for webhooks).

---

## Tool Decisions

| Tool | Purpose | Cost |
|------|---------|------|
| **Playwright** | E2E browser automation framework | Free, open source |
| **Mailpit** | Local SMTP capture for email verification | Free, open source |
| **Stripe CLI** | Local webhook forwarding for Stripe tests | Free |
| **GitHub Actions** | CI/CD — runs smoke tests on every push | Free tier sufficient |

**Playwright installation:** via npm, in `tests/e2e/` directory (separate from
Vue dashboard build).

**Email approach:** Option B — Mailpit captures emails locally, Playwright
queries Mailpit API (`localhost:8025/api/v1/messages`) to verify delivery and
content. Manual prompt on live site.

---

## Two-Mode Architecture

One test suite, controlled by environment variable:

```bash
MODE=smoke npx playwright test    # Live site — skips email/Stripe automation
MODE=full npx playwright test     # Local — fully automated including email/Stripe
```

Tests tagged with `@smoke`, `@full`, or both. Shared navigation/assertion
code is reused across both modes — no duplicated logic.

```typescript
// Smoke only
test('booking wizard loads', { tag: '@smoke' }, async ({ page }) => { ... })

// Full only
test('booking confirmed email delivered', { tag: '@full' }, async ({ page }) => { ... })

// Both modes
test('step 1 renders services', { tag: ['@smoke', '@full'] }, async ({ page }) => { ... })
```

---

## Environment Variables

Never hardcode credentials in test files. All environment-specific values in
`.env.test.local` (gitignored) and `.env.test.live`:

```
# Shared
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=...
BOOKIT_TEST_STAFF_EMAIL=staff@test.com
BOOKIT_TEST_STAFF_PASSWORD=...

# Local (full mode)
BASE_URL=http://localhost:10000
MAILPIT_URL=http://localhost:8025
STRIPE_TEST_CARD=4242424242424242

# Live (smoke mode)
BASE_URL=https://test.wimbledonsmart.co.uk
```

---

## Test Suite Structure

### Tier 1 — Smoke Tests (`@smoke`)
**Environment:** Live site (`test.wimbledonsmart.co.uk`)
**When:** After every deployment to live
**Duration:** Under 2 minutes
**Email/Stripe:** Manual prompts only

| Test | What it verifies |
|------|----------------|
| `/book-v2/` loads | Wizard container renders, no PHP errors |
| `/booking-confirmed-v2/` loads | Renders without params (no 500) |
| `/bookit-cancel/` loads | Shows invalid link message (correct without token) |
| `/bookit-reschedule/` loads | Shows invalid link message |
| `/my-packages/` loads | Page renders |
| Dashboard login page | `/bookit-dashboard/` redirects to login |
| Valid login | Correct credentials → dashboard home |
| Invalid login | Wrong credentials → error shown, no access |
| API health: services | `GET /wp-json/bookit/v1/wizard/services` → 200 |
| API health: staff | `GET /wp-json/bookit/v1/wizard/staff` → 200 |
| API health: bad login | `POST /wp-json/bookit/v1/dashboard/login` no body → 400 not 500 |
| Wizard Step 1 | Services render in list |
| Wizard Step 2 | Staff render after service selected |

### Tier 2 — Full E2E Suite (`@full`)
**Environment:** Local (Local by Flywheel)
**When:** Before deploying to live
**Duration:** 10–20 minutes
**Email:** Mailpit automated
**Stripe:** Stripe CLI + headed browser

#### Customer booking flows
| Test | Coverage |
|------|---------|
| Full wizard — Pay on Arrival | Steps 1–5, booking created, confirmation page, confirmation email delivered to Mailpit |
| Full wizard — Stripe card | Steps 1–5, Stripe hosted checkout (headed), webhook fires via CLI, confirmation page, email |
| Full wizard — Use a package | Select package in Step 5, booking created, package session decremented |
| Full wizard — Buy a package | Buy package via Stripe, `wp_bookings_customer_packages` row created |
| Step 4 validation | Required fields enforced, invalid phone rejected |
| Step 3 slot selection | Calendar renders, unavailable slots blocked |
| No-deposit service | Pay by Card and PayPal hidden, Pay in Person default |

#### Magic link flows
| Test | Coverage |
|------|---------|
| Cancel via magic link | Extract cancel URL from Mailpit email, navigate, confirm, booking cancelled, cancellation email delivered |
| Reschedule via magic link | Extract reschedule URL, select new slot, confirm, booking updated, reschedule email delivered |
| Invalid token | Corrupt token → 403, error page shown |
| Already cancelled | Cancel a cancelled booking → appropriate error |
| Within cancellation window | Booking within window → blocked with policy message |
| Rate limiting | 11 cancel attempts → rate limit response |

#### Email verification (via Mailpit)
| Test | Coverage |
|------|---------|
| Confirmation email content | Subject line, booking reference, service name, date/time, Cancel/Reschedule/Add to Calendar buttons present |
| Reschedule email content | Updated date/time, action buttons present |
| Cancellation email content | Service name, original date confirmed |
| Staff notification | New booking → staff email in Mailpit with correct booking details |
| .ics download | Add to Calendar button → valid .ics file, correct DTSTART/DTEND |

#### Dashboard flows
| Test | Coverage |
|------|---------|
| Admin creates manual booking | Form fills, booking appears in list |
| Admin cancels booking | Status changes to cancelled |
| Admin reschedules booking | Date/time updated |
| Admin marks complete | Status changes to completed |
| Admin marks no-show | Status changes to no_show |
| Staff login — own schedule only | Staff sees only their bookings |
| Staff cannot access admin routes | 403 on admin-only endpoints |

#### Package flows
| Test | Coverage |
|------|---------|
| Create package type | Admin creates package, appears in list |
| Customer buys package | Stripe payment, package row created |
| Customer redeems package | Use Package in wizard, sessions decremented |
| Package expiry display | Expiry date shown correctly |

#### Google Calendar
| Test | Coverage |
|------|---------|
| Connect flow | OAuth URL generated, mock callback stores tokens |
| Event created on booking | `google_calendar_event_id` populated after booking |
| Event deleted on cancel | `google_calendar_event_id` cleared |

---

## Semi-Automated Live Site QA Pass

For the live site, Playwright pauses at steps requiring human action using
`test.step()` with manual prompts. The operator sees a prompt in the terminal,
performs the manual action (checks inbox, completes Stripe payment), and
confirms pass/fail.

### Manual prompt steps (live mode only)

```
⏸ [MANUAL] Check inbox for confirmation email
           → Booking reference shown: [BK-XXXXXXXX]
           → Cancel and Reschedule links present
           → Press Y to confirm, N to fail: _

⏸ [MANUAL] Navigate to Stripe Checkout (opening in browser)
           → Use test card: 4242 4242 4242 4242, any expiry, any CVC
           → Complete payment and wait for redirect
           → Press Y when back on confirmation page: _

⏸ [MANUAL] Check inbox for Stripe booking confirmation
           → Press Y to confirm, N to fail: _
```

At the end of the run, Playwright generates an HTML report showing:
- Auto steps: pass/fail with screenshots
- Manual steps: operator-confirmed pass/fail
- Full audit trail suitable for pre-launch sign-off

---

## Stripe Test Setup (Local)

Prerequisites before running full suite locally:
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or
   download from `stripe.com/docs/stripe-cli`
2. Authenticate: `stripe login`
3. Start webhook forwarding before running tests:
   `stripe listen --forward-to http://localhost:10000/wp-json/bookit/v1/stripe/webhook`
4. Playwright runs Stripe tests in headed mode (visible browser) to avoid
   bot detection on Stripe's hosted checkout page

---

## Mailpit Setup (Local)

1. Download Mailpit binary from `github.com/axllent/mailpit/releases`
   or: `brew install mailpit` (Mac)
2. Run: `mailpit` (starts SMTP on port 1025, web UI on port 8025)
3. Configure Local by Flywheel WordPress to use SMTP:
   - Host: `localhost`
   - Port: `1025`
   - No authentication
   - In Bookit Dashboard → Settings → Email: switch to `wp_mail` provider
     (so emails go through WordPress SMTP, not directly to Brevo)
4. Playwright queries `http://localhost:8025/api/v1/messages` after each
   email-triggering action

---

## GitHub Actions (CI)

Smoke tests only in CI — full suite is too slow and requires local tools
(Mailpit, Stripe CLI).

```yaml
# .github/workflows/e2e-smoke.yml
on: [push]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: MODE=smoke npx playwright test --tag @smoke
        env:
          BASE_URL: https://test.wimbledonsmart.co.uk
          BOOKIT_TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          BOOKIT_TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

GitHub Actions secrets store the live site credentials — never in the repo.

---

## File Structure

```
tests/
  e2e/
    playwright.config.ts
    .env.test.local          (gitignored)
    .env.test.live           (gitignored)
    fixtures/
      auth.ts                (login helpers)
      mailpit.ts             (email query helpers)
      stripe.ts              (Stripe CLI helpers)
    tests/
      smoke/
        pages.spec.ts        (page load checks)
        api.spec.ts          (REST API health)
        auth.spec.ts         (login flows)
      full/
        booking-poa.spec.ts
        booking-stripe.spec.ts
        magic-link.spec.ts
        packages.spec.ts
        dashboard.spec.ts
        google-calendar.spec.ts
      email/
        confirmation.spec.ts
        reschedule.spec.ts
        cancellation.spec.ts
        staff-notifications.spec.ts
```

---

## When to Run

| Situation | Command | Duration |
|-----------|---------|---------|
| Before pushing code changes | `MODE=full npx playwright test` | ~15 min |
| After deploying to live | `MODE=smoke npx playwright test` | ~2 min |
| Full live QA pass (pre-client launch) | `MODE=smoke npx playwright test --headed` (with manual prompts) | ~30 min |
| On every GitHub push (automated) | CI runs smoke via GitHub Actions | ~3 min |

---

## Sprint Estimate

**Playwright Sprint: ~12h**

| Task | Hours |
|------|-------|
| Setup: Playwright install, config, env vars, GitHub Actions | 2h |
| Smoke test suite | 2h |
| Mailpit + Stripe CLI integration helpers | 1h |
| Full E2E: booking flows (POA + Stripe) | 2h |
| Full E2E: magic link flows | 2h |
| Full E2E: email verification | 1h |
| Full E2E: dashboard flows | 1h |
| Manual prompt framework for live mode | 1h |

**Prerequisite:** Phase 1 code-complete (Sprint 6D done).
