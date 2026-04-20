# PLAYWRIGHT E2E TESTING SPRINT
# Bookit Booking System — Wimbledon Smart
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/

---

## YOUR ROLE

You are the Playwright Sprint Assistant. Your job is to write all E2E test
files, configuration, and helper code for the Bookit booking system.

**Before writing anything:**
- Search project knowledge for relevant feature details before writing
  tests for that feature. Key files: Playwright_E2E_Testing_Strategy.md,
  Bookit_REST_API_Reference_Phase1.md, progress.md.
- If anything is unclear about how a feature works, ask Liron before
  writing tests for it. Do not guess at UI selectors or API behaviour.
- Produce work in task order. Liron confirms each task before you proceed.

---

## ENVIRONMENT

**OS:** Windows
**Local site:** `http://plugin-test-1.local`
**Live site:** `https://test.wimbledonsmart.co.uk`
**Local WordPress port:** uses `.local` domain (no port number needed)
**Playwright location:** `bookit-booking-system/tests/e2e/`
**Playwright already installed:** yes (`@playwright/test` + chromium)
**Mailpit already installed:** yes (Windows binary, runs on `localhost:1025`
  SMTP, `localhost:8025` web UI)
**Stripe CLI already installed:** yes (authenticated with Stripe account)

---

## TWO-MODE ARCHITECTURE

One test suite, two modes controlled by environment variable:

```bash
# Smoke mode — runs against live site, no email/Stripe automation
MODE=smoke npx playwright test --grep @smoke

# Full mode — runs against local site, fully automated
MODE=full npx playwright test --grep @full
```

Tests tagged `@smoke` run against the live site.
Tests tagged `@full` run against local with Mailpit + Stripe CLI.
Tests tagged with both run in either mode against the appropriate base URL.

Shared navigation code is reused — no duplicated logic between modes.

---

## TEST DISTRIBUTION

### Smoke tests (`@smoke`) — live site only
Fast page load and API health checks. No email verification. No Stripe
automation. Manual prompts for anything requiring human action.
Target duration: under 2 minutes.

| Test | What it checks |
|------|---------------|
| `/book-v2/` loads | Wizard container renders, no PHP error |
| `/booking-confirmed-v2/` loads | Renders without params (no 500) |
| `/bookit-cancel/` loads | Shows invalid link message (correct without token) |
| `/bookit-reschedule/` loads | Shows invalid link message |
| `/my-packages/` loads | Page renders |
| Dashboard login page | `/bookit-dashboard/` redirects to login |
| Valid login | Correct credentials → dashboard home |
| Invalid login | Wrong credentials → error shown, no redirect |
| API: services | `GET /wp-json/bookit/v1/wizard/services` → 200, JSON array |
| API: staff | `GET /wp-json/bookit/v1/wizard/staff` → 200, JSON array |
| API: bad login | `POST /wp-json/bookit/v1/dashboard/login` no body → 400 not 500 |
| Wizard Step 1 | Services render in list after page load |
| Wizard Step 2 | Staff render after service selected and Continue clicked |

### Full E2E tests (`@full`) — local site only
Complete journey tests with email and Stripe automation.
Target duration: 10–20 minutes total.

**Customer booking flows:**
- Full wizard — Pay on Arrival (Steps 1–5, booking created, confirmation
  page loads, confirmation email in Mailpit)
- Full wizard — Stripe card (Steps 1–5, Stripe hosted checkout in headed
  browser, webhook fires via Stripe CLI, confirmation page, email in Mailpit)
- Step 4 validation (required fields enforced, invalid email rejected)
- Step 3 slot selection (calendar renders, slot selectable, Continue enabled)

**Magic link flows:**
- Cancel via magic link (extract URL from Mailpit email, navigate,
  confirm cancellation, cancellation email delivered to Mailpit)
- Reschedule via magic link (extract URL, select new slot, confirm,
  reschedule email in Mailpit, booking shows updated date/time)
- Invalid token (corrupt token → error message shown)
- Cancel inside policy window (blocked with policy message)

**Email content verification (via Mailpit API):**
- Confirmation email: subject line, booking reference, Cancel link
  present, Reschedule link present, Add to Calendar button present
- Cancellation email: subject line, service name present
- Reschedule email: subject line, new date/time present, action
  buttons present

**Dashboard flows:**
- Admin login → views today's schedule
- Admin creates manual booking → booking appears in list
- Admin cancels booking → status changes to cancelled
- Admin marks booking complete → status changes to completed
- Admin marks booking no-show → status changes to no_show
- Staff login → sees only own bookings (not all bookings)

---

## FILE STRUCTURE TO CREATE

```
bookit-booking-system/tests/e2e/
├── playwright.config.ts
├── package.json                    (update existing or create)
├── .env.test.local                 (gitignored — local credentials)
├── .env.test.live                  (gitignored — live credentials)
├── .gitignore                      (ignore .env files and test results)
├── fixtures/
│   ├── auth.ts                     (login helpers for admin and staff)
│   ├── mailpit.ts                  (Mailpit API helpers)
│   └── stripe.ts                   (Stripe CLI helpers)
├── tests/
│   ├── smoke/
│   │   ├── pages.spec.ts           (page load checks)
│   │   ├── api.spec.ts             (REST API health)
│   │   └── auth.spec.ts            (dashboard login flows)
│   ├── full/
│   │   ├── booking-poa.spec.ts     (pay on arrival full journey)
│   │   ├── booking-stripe.spec.ts  (Stripe payment full journey)
│   │   ├── magic-link.spec.ts      (cancel and reschedule via email)
│   │   └── dashboard.spec.ts       (admin and staff dashboard flows)
│   └── email/
│       ├── confirmation.spec.ts    (confirmation email content)
│       ├── cancellation.spec.ts    (cancellation email content)
│       └── reschedule.spec.ts      (reschedule email content)
└── results/                        (gitignored — test output)
```

---

## TASK BREAKDOWN

---

### TASK 1 — Configuration and environment setup (~2h)

**1a — `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

const mode = process.env.MODE || 'smoke';
const isFullMode = mode === 'full';

dotenv.config({
  path: isFullMode ? '.env.test.local' : '.env.test.live'
});

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: isFullMode ? 0 : 1,
  workers: 1,                       // Sequential — booking system has state
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL,
    headless: !isFullMode,          // Headed for full mode (Stripe bot detection)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**1b — `.env.test.local`** (gitignored — create file, do not commit)

```
MODE=full
BASE_URL=http://plugin-test-1.local
MAILPIT_URL=http://localhost:8025
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=FILL_IN
BOOKIT_TEST_STAFF_EMAIL=staff@test.com
BOOKIT_TEST_STAFF_PASSWORD=FILL_IN
BOOKIT_TEST_SERVICE_NAME=FILL_IN
BOOKIT_TEST_STAFF_NAME=FILL_IN
STRIPE_TEST_CARD=4242424242424242
STRIPE_TEST_EXPIRY=12/30
STRIPE_TEST_CVC=123
```

**1c — `.env.test.live`** (gitignored)

```
MODE=smoke
BASE_URL=https://test.wimbledonsmart.co.uk
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=FILL_IN
BOOKIT_TEST_STAFF_EMAIL=staff@test.com
BOOKIT_TEST_STAFF_PASSWORD=FILL_IN
```

**1d — `.gitignore`** in `tests/e2e/`

```
.env.test.local
.env.test.live
results/
playwright-report/
test-results/
```

**1e — `fixtures/auth.ts`**

Helper that logs into the dashboard and returns a logged-in page context.
Uses `POST /wp-json/bookit/v1/dashboard/login` directly (faster than
navigating the login form for every test).

```typescript
import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/bookit-dashboard/');
  await page.fill('input[name="email"]', process.env.BOOKIT_TEST_ADMIN_EMAIL!);
  await page.fill('input[name="password"]', process.env.BOOKIT_TEST_ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/bookit-dashboard/app/**');
}

export async function loginAsStaff(page: Page): Promise<void> {
  await page.goto('/bookit-dashboard/');
  await page.fill('input[name="email"]', process.env.BOOKIT_TEST_STAFF_EMAIL!);
  await page.fill('input[name="password"]', process.env.BOOKIT_TEST_STAFF_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/bookit-dashboard/app/**');
}
```

Note: before writing selectors, ask Liron to open the dashboard login
page and inspect the actual input field names — do not guess them.

**1f — `fixtures/mailpit.ts`**

```typescript
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

export interface MailpitMessage {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
  Text: string;
  HTML: string;
}

export async function getLatestEmail(
  toAddress: string,
  timeoutMs = 15000
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await res.json();
    const messages: MailpitMessage[] = data.messages || [];
    const match = messages.find(m =>
      m.To.some(t => t.Address === toAddress)
    );
    if (match) {
      // Fetch full message with HTML body
      const full = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      return await full.json();
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`No email found for ${toAddress} within ${timeoutMs}ms`);
}

export async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

export function extractLinkFromEmail(html: string, linkText: string): string {
  // Parse anchor tags from email HTML and find matching link text
  const regex = new RegExp(
    `<a[^>]+href="([^"]+)"[^>]*>\\s*${linkText}\\s*<\\/a>`,
    'i'
  );
  const match = html.match(regex);
  if (!match) throw new Error(`Link "${linkText}" not found in email`);
  return match[1];
}
```

**1g — `fixtures/stripe.ts`**

Helper notes for running Stripe tests. The Stripe CLI must be running
in a separate terminal before executing Stripe tests:

```
stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook
```

```typescript
// stripe.ts — helpers for Stripe test card entry on hosted checkout
export const STRIPE_TEST_CARD = process.env.STRIPE_TEST_CARD || '4242424242424242';
export const STRIPE_TEST_EXPIRY = process.env.STRIPE_TEST_EXPIRY || '12/30';
export const STRIPE_TEST_CVC = process.env.STRIPE_TEST_CVC || '123';

export async function fillStripeCheckout(page: any): Promise<void> {
  // Stripe hosted checkout runs on checkout.stripe.com
  // Wait for Stripe iframe to load
  await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 });

  // Fill card details in Stripe's hosted form
  // Note: Stripe hosted checkout uses standard input fields
  // Ask Liron to verify these selectors on the actual Stripe test page
  // before finalising — Stripe occasionally changes their hosted checkout UI
  await page.fill('[placeholder*="Card number"]', STRIPE_TEST_CARD);
  await page.fill('[placeholder*="MM / YY"]', STRIPE_TEST_EXPIRY);
  await page.fill('[placeholder*="CVC"]', STRIPE_TEST_CVC);
  await page.click('button[type="submit"]');

  // Wait for redirect back to confirmation page
  await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 30000 });
}
```

**1h — Mailpit SMTP configuration for Local by Flywheel**

Instructions to include in the prompt for Liron to configure manually:

1. Install WP Mail SMTP plugin on the local site
2. Configure: Mailer = Other SMTP, Host = `localhost`, Port = `1025`,
   Encryption = None, No authentication
3. In Bookit Dashboard → Settings → Email: switch provider to `wp_mail`
4. Start Mailpit: run `mailpit.exe` from wherever you unzipped it
5. Verify: send a test email from Bookit Settings → it should appear
   at `http://localhost:8025`

---

### TASK 2 — Smoke test suite (~2h)

**`tests/smoke/pages.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page load checks @smoke', () => {

  test('booking wizard loads at /book-v2/', async ({ page }) => {
    await page.goto('/book-v2/');
    // Assert wizard container present (no PHP error, no blank page)
    // Ask Liron: what is the CSS class or ID of the wizard container?
    // Do not use a guess — inspect the actual page first
  });

  test('/booking-confirmed-v2/ loads without params', async ({ page }) => {
    await page.goto('/booking-confirmed-v2/');
    // Should render an error/not-found state — not a 500
    await expect(page).not.toHaveTitle(/Error/i);
  });

  test('/bookit-cancel/ shows invalid link message', async ({ page }) => {
    await page.goto('/bookit-cancel/');
    // Without a valid token, should show an error message not a crash
  });

  test('/bookit-reschedule/ shows invalid link message', async ({ page }) => {
    await page.goto('/bookit-reschedule/');
  });

  test('/my-packages/ loads', async ({ page }) => {
    await page.goto('/my-packages/');
    await expect(page).not.toHaveTitle(/Error/i);
  });

});
```

**`tests/smoke/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard auth @smoke', () => {

  test('dashboard redirects to login', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    // Should see login form — not the app
  });

  test('valid credentials reach dashboard', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    await page.fill('input[name="email"]', process.env.BOOKIT_TEST_ADMIN_EMAIL!);
    await page.fill('input[name="password"]', process.env.BOOKIT_TEST_ADMIN_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/bookit-dashboard/app/**');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on login page and show an error
    await expect(page).not.toHaveURL('**/bookit-dashboard/app/**');
  });

});
```

**`tests/smoke/api.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('REST API health @smoke', () => {

  test('wizard/services returns 200 with array', async ({ request }) => {
    const res = await request.get('/wp-json/bookit/v1/wizard/services');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('wizard/staff returns 200 with array', async ({ request }) => {
    const res = await request.get('/wp-json/bookit/v1/wizard/staff');
    expect(res.status()).toBe(200);
  });

  test('dashboard/login with no body returns 400 not 500', async ({ request }) => {
    const res = await request.post('/wp-json/bookit/v1/dashboard/login', {
      data: {}
    });
    expect(res.status()).toBe(400);
  });

});
```

**`tests/smoke/wizard-steps.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Wizard step rendering @smoke', () => {

  test('Step 1 renders service list', async ({ page }) => {
    await page.goto('/book-v2/');
    // Assert at least one service is visible
    // Ask Liron: what selector identifies a service card or list item?
  });

  test('Step 2 renders after service selection', async ({ page }) => {
    await page.goto('/book-v2/');
    // Click first service, click Continue, assert Step 2 loads
    // Selectors to confirm with Liron before writing
  });

});
```

---

### TASK 3 — Full E2E: Pay on Arrival booking journey (~2h)

**`tests/full/booking-poa.spec.ts`**

Complete journey: wizard Steps 1–5 → POA → confirmation page →
confirmation email in Mailpit.

Before writing this file, ask Liron to:
1. Open `http://plugin-test-1.local/book-v2/` in Chrome with DevTools
2. Inspect the CSS selectors for: service card/button, Continue button,
   staff card/button, calendar day element, time slot element, contact
   form fields (first name, last name, email, phone), cooling-off waiver
   checkbox, Pay in Person option, Confirm button
3. Paste the selectors here — do not guess them

The test should:
1. Navigate to `/book-v2/`
2. Clear Mailpit (`clearMailpit()`)
3. Select first available service
4. Click Continue → Step 2
5. Select first available staff (or "No Preference" if available)
6. Click Continue → Step 3
7. Click first available date in calendar
8. Click first available time slot
9. Click Continue → Step 4
10. Fill in: first name, last name, email (use test address that Mailpit
    captures), phone
11. Check cooling-off waiver if visible
12. Click Continue → Step 5
13. Select "Pay in Person" / "Pay on Arrival" option
14. Click Confirm / Complete booking button
15. Assert: confirmation page loads with booking reference visible
16. Assert: confirmation email arrives in Mailpit for the test email address
    (`getLatestEmail(testEmail)`)
17. Assert: email subject contains "confirmed" (case-insensitive)
18. Assert: email HTML contains booking reference

---

### TASK 4 — Full E2E: Stripe booking journey (~2h)

**`tests/full/booking-stripe.spec.ts`**

Same wizard flow as POA but selecting card payment and completing
Stripe hosted checkout.

**Prerequisites before running this test:**
Stripe CLI must be running in a separate terminal:
```
stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook
```

The test must run in headed mode (configured automatically in full mode
via `playwright.config.ts`).

Before writing this file, confirm with Liron:
- What is the selector for the "Pay by Card" / Stripe option in Step 5?
- Does the service configured for testing have a deposit or full payment?

Test flow mirrors booking-poa.spec.ts Steps 1–14, then:
- Select "Pay by Card" option
- Click button to proceed to Stripe
- Wait for redirect to `checkout.stripe.com`
- Fill Stripe test card using `fillStripeCheckout(page)`
- Wait for redirect back to `/booking-confirmed-v2/`
- Assert confirmation page shows booking reference
- Wait for Stripe CLI webhook (add 3 second wait after redirect)
- Assert confirmation email in Mailpit

---

### TASK 5 — Full E2E: Magic link flows (~2h)

**`tests/full/magic-link.spec.ts`**

Depends on Task 3 (POA booking) — reuse the POA booking flow as a
`beforeEach` to create a fresh booking before each magic link test.

**Cancel flow:**
1. Create booking via POA flow
2. Get confirmation email from Mailpit
3. Extract cancel link from email HTML using `extractLinkFromEmail(html, 'Cancel')`
4. Navigate to the cancel URL
5. Assert cancel confirmation page loads
6. Click Confirm Cancellation button
7. Assert success message shown
8. Assert cancellation email arrives in Mailpit

**Reschedule flow:**
1. Create booking via POA flow
2. Get confirmation email from Mailpit
3. Extract reschedule link from email HTML
4. Navigate to the reschedule URL
5. Assert reschedule calendar loads
6. Select a different available date and time slot
7. Click Confirm Reschedule
8. Assert success message shown
9. Assert reschedule confirmation email arrives in Mailpit
10. Assert email contains updated date/time

**Invalid token:**
1. Navigate to `/bookit-cancel/?booking_id=1&token=invalidtoken123`
2. Assert error message is shown (not a crash)

**Cancel inside policy window:**
1. Create a booking for a date within the cancellation window
   (e.g. within 24 hours if cancellation window is 24h)
2. Follow cancel link
3. Assert blocked message shown (not a crash)

---

### TASK 6 — Full E2E: Dashboard flows (~1h)

**`tests/full/dashboard.spec.ts`**

Uses `loginAsAdmin()` and `loginAsStaff()` from `fixtures/auth.ts`.

Before writing selectors, ask Liron to inspect the dashboard Vue app
and provide selectors for:
- "Today's Schedule" section or tab
- "Create Booking" / manual booking button
- Booking list table rows
- Status badge/column in booking list
- Cancel booking button/action
- Mark complete button/action
- Mark no-show button/action

Tests:
- Admin logs in → dashboard home loads → today's schedule visible
- Admin creates manual booking via form → booking appears in list
- Admin cancels a booking → status badge changes to "Cancelled"
- Admin marks booking complete → status badge changes to "Completed"
- Admin marks booking no-show → status badge changes to "No-show"
- Staff logs in → can see own bookings → cannot see admin-only nav items

---

### TASK 7 — Email content tests (~1h)

**`tests/email/confirmation.spec.ts`**
**`tests/email/cancellation.spec.ts`**
**`tests/email/reschedule.spec.ts`**

These tests create a booking, trigger the relevant email, and assert
content using the Mailpit API.

**Confirmation email assertions:**
- Subject contains "confirmed" (case-insensitive)
- HTML contains booking reference (format: `BK-`)
- HTML contains "Cancel" link (href present)
- HTML contains "Reschedule" link (href present)
- HTML contains "Add to Calendar" text or button

**Cancellation email assertions:**
- Subject contains "cancelled" (case-insensitive)
- HTML contains service name

**Reschedule email assertions:**
- Subject contains "rescheduled" (case-insensitive)
- HTML contains updated date or time
- HTML contains Cancel link
- HTML contains Reschedule link

---

### TASK 8 — GitHub Actions workflow (~30min)

**`.github/workflows/e2e-smoke.yml`**

Runs smoke tests automatically on every push to `Phase1`:

```yaml
name: E2E Smoke Tests

on:
  push:
    branches: [Phase1]

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Playwright dependencies
        working-directory: bookit-booking-system/tests/e2e
        run: |
          npm ci
          npx playwright install chromium --with-deps

      - name: Run smoke tests
        working-directory: bookit-booking-system/tests/e2e
        run: MODE=smoke npx playwright test --grep @smoke
        env:
          BASE_URL: https://test.wimbledonsmart.co.uk
          BOOKIT_TEST_ADMIN_EMAIL: ${{ secrets.BOOKIT_TEST_ADMIN_EMAIL }}
          BOOKIT_TEST_ADMIN_PASSWORD: ${{ secrets.BOOKIT_TEST_ADMIN_PASSWORD }}
          BOOKIT_TEST_STAFF_EMAIL: ${{ secrets.BOOKIT_TEST_STAFF_EMAIL }}
          BOOKIT_TEST_STAFF_PASSWORD: ${{ secrets.BOOKIT_TEST_STAFF_PASSWORD }}

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: bookit-booking-system/tests/e2e/playwright-report/
```

**GitHub Secrets to add** (Settings → Secrets → Actions in the repo):
- `BOOKIT_TEST_ADMIN_EMAIL`
- `BOOKIT_TEST_ADMIN_PASSWORD`
- `BOOKIT_TEST_STAFF_EMAIL`
- `BOOKIT_TEST_STAFF_PASSWORD`

---

### TASK 9 — Manual prompt framework for live mode (~30min)

For smoke mode tests that involve Stripe payment or email verification
on the live site, Playwright pauses and prompts Liron for manual
confirmation using a helper:

**`fixtures/manual-prompt.ts`**

```typescript
import * as readline from 'readline';

export async function manualConfirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n⏸  [MANUAL] ${message}\n   Press Y to confirm, N to fail: `, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'Y');
    });
  });
}
```

Usage in a smoke test that involves live email:

```typescript
const confirmed = await manualConfirm(
  'Check your inbox for a confirmation email.\n' +
  '   → Booking reference should be visible\n' +
  '   → Cancel and Reschedule links should be present'
);
expect(confirmed).toBe(true);
```

---

## HOW TO RUN

**Before running full mode locally:**
1. Start Mailpit: run `mailpit.exe`
2. Start Stripe CLI:
   `stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook`
3. Ensure Local by Flywheel site is running
4. Ensure Bookit Settings → Email is set to `wp_mail` provider locally

**Commands:**

```bash
# From bookit-booking-system/tests/e2e/

# Run smoke tests against live site
MODE=smoke npx playwright test --grep @smoke

# Run full E2E suite against local site
MODE=full npx playwright test --grep @full

# Run a specific test file
MODE=full npx playwright test tests/full/booking-poa.spec.ts

# Run with visible browser (debug mode)
MODE=full npx playwright test --headed

# Open interactive UI mode (best for debugging)
MODE=full npx playwright test --ui

# View last test report
npx playwright show-report
```

---

## IMPORTANT NOTES FOR THE AGENT

1. **Ask before writing selectors.** The Vue dashboard and vanilla JS
   wizard both use specific CSS classes. Never guess a selector — ask
   Liron to inspect the element in Chrome DevTools and provide the
   correct selector before you write the test.

2. **Selectors to confirm before Tasks 3–6:**
   - Wizard service card selector (Step 1)
   - Continue button selector
   - Staff card selector (Step 2)
   - Calendar day selector (Step 3)
   - Time slot selector (Step 3)
   - Contact form field names (Step 4): first name, last name, email, phone
   - Cooling-off waiver checkbox ID
   - Pay on Arrival option selector (Step 5)
   - Confirm/Submit button selector (Step 5)
   - Dashboard: login form field names
   - Dashboard: booking status badge selector
   - Dashboard: action button selectors (cancel, complete, no-show)

3. **Tests must be independent.** Each test creates its own data and
   does not rely on data from another test. Use `beforeEach` to set up
   and `afterEach` to clean up where needed.

4. **Rate limiting awareness.** The booking creation endpoint is rate
   limited to 10/hour/IP. If tests fail with 429 errors, add a delay
   between booking creation tests or use a different IP for each test
   where possible.

5. **Stripe tests are headed.** Stripe's hosted checkout has bot
   detection. The Playwright config sets `headless: false` in full mode
   automatically — do not override this for Stripe tests.

6. **Mailpit must be running.** If Mailpit is not running, email tests
   will timeout after 15 seconds. The `getLatestEmail()` helper throws
   a clear error in this case.

7. **Worker count is 1.** Tests run sequentially. This is intentional —
   the booking system has shared state (available slots, rate limits)
   that causes flaky failures when tests run in parallel.

---

## START HERE

1. Confirm you have read and understood this prompt
2. **Ask Liron for the UI selectors listed in Note 2 above before
   writing any test files** — start by asking for the wizard selectors,
   then the dashboard selectors
3. Once selectors are confirmed, start with **Task 1** (config files)
4. Liron confirms each task before you proceed to the next
5. After all tasks are complete, run the smoke suite against the live
   site as a final verification

If anything about a feature's behaviour is unclear, ask before writing
the test. A test that asserts incorrect behaviour is worse than no test.
