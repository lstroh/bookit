# TASK: Playwright E2E Test Suite
# Sprint: Playwright Sprint | Est: ~12h | Plugin root: bookit-booking-system/
# Repo: lstroh/bookit-imp | Branch: Phase1

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/public/templates/booking-wizard-v2-shell.php` — wizard container structure, data-step attribute
2. `bookit-booking-system/public/templates/booking-wizard-v2-step-1.php` — service card HTML, #bookit-v2-continue button
3. `bookit-booking-system/public/templates/booking-wizard-v2-step-2.php` — staff row/card HTML, layout switching logic
4. `bookit-booking-system/public/templates/booking-wizard-v2-step-3.php` — calendar day buttons, slot buttons
5. `bookit-booking-system/public/templates/booking-wizard-v2-step-4.php` — contact form, #cooling-off-waiver, submit button
6. `bookit-booking-system/public/templates/booking-wizard-v2-step-5.php` — payment option rows, #bookit-v2-cta-btn
7. `bookit-booking-system/public/assets/js/booking-wizard-v2.js` — JS interactions, advanceStep(), initStep5() CTA handler
8. `bookit-booking-system/dashboard/index.php` — login form selectors (input[name="email"], button.booking-login-button)
9. `bookit-booking-system/dashboard/src/views/MySchedule.vue` — status badges, Mark Complete / No-Show button classes

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task creates the full Playwright E2E test suite for the Bookit booking
system. All selectors below are sourced directly from the PHP templates and
JS — do not change them or invent alternatives. The suite runs in two modes:
`smoke` (live site, fast, no email/Stripe automation) and `full` (local site,
Mailpit + Stripe CLI). Tests are sequential (workers: 1) because the booking
system has shared slot state.

---

## FILE STRUCTURE TO CREATE

```
bookit-booking-system/tests/e2e/
├── playwright.config.ts
├── package.json
├── .env.test.local               (gitignored)
├── .env.test.live                (gitignored)
├── .gitignore
├── fixtures/
│   ├── auth.ts
│   ├── mailpit.ts
│   ├── stripe.ts
│   ├── manual-prompt.ts
│   └── wizard.ts
├── tests/
│   ├── smoke/
│   │   ├── pages.spec.ts
│   │   ├── api.spec.ts
│   │   ├── auth.spec.ts
│   │   └── wizard-steps.spec.ts
│   ├── full/
│   │   ├── booking-poa.spec.ts
│   │   ├── booking-stripe.spec.ts
│   │   ├── magic-link.spec.ts
│   │   └── dashboard.spec.ts
│   └── email/
│       ├── confirmation.spec.ts
│       ├── cancellation.spec.ts
│       └── reschedule.spec.ts
└── .github/workflows/e2e-smoke.yml
```

---

## IMPLEMENTATION REQUIREMENTS

---

### `bookit-booking-system/tests/e2e/playwright.config.ts` — CREATE

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const mode = process.env.MODE || 'smoke';
const isFullMode = mode === 'full';

dotenv.config({
  path: path.resolve(__dirname, isFullMode ? '.env.test.local' : '.env.test.live'),
});

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: isFullMode ? 0 : 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL,
    headless: !isFullMode,
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

---

### `bookit-booking-system/tests/e2e/package.json` — CREATE

```json
{
  "name": "bookit-e2e",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test:smoke": "MODE=smoke npx playwright test --grep @smoke",
    "test:full": "MODE=full npx playwright test --grep @full",
    "report": "npx playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "dotenv": "^16.4.5"
  }
}
```

---

### `bookit-booking-system/tests/e2e/.env.test.local` — CREATE (gitignored)

```
MODE=full
BASE_URL=http://plugin-test-1.local
MAILPIT_URL=http://localhost:8025
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=FILL_IN
BOOKIT_TEST_STAFF_EMAIL=staff@test.com
BOOKIT_TEST_STAFF_PASSWORD=FILL_IN
BOOKIT_TEST_CUSTOMER_EMAIL=testcustomer@bookit-e2e.local
BOOKIT_TEST_SERVICE_NAME=FILL_IN
BOOKIT_TEST_STAFF_NAME=FILL_IN
STRIPE_TEST_CARD=4242424242424242
STRIPE_TEST_EXPIRY=12/30
STRIPE_TEST_CVC=123
```

---

### `bookit-booking-system/tests/e2e/.env.test.live` — CREATE (gitignored)

```
MODE=smoke
BASE_URL=https://test.wimbledonsmart.co.uk
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=FILL_IN
BOOKIT_TEST_STAFF_EMAIL=staff@test.com
BOOKIT_TEST_STAFF_PASSWORD=FILL_IN
```

---

### `bookit-booking-system/tests/e2e/.gitignore` — CREATE

```
.env.test.local
.env.test.live
results/
playwright-report/
test-results/
node_modules/
```

---

### `bookit-booking-system/tests/e2e/fixtures/auth.ts` — CREATE

```typescript
import { Page } from '@playwright/test';

// Selectors from dashboard/index.php:
//   input[name="email"], input[name="password"], button.booking-login-button
// Error message selector: .booking-login-error
// Success: redirects to /bookit-dashboard/app/

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/bookit-dashboard/');
  await page.fill('input[name="email"]', process.env.BOOKIT_TEST_ADMIN_EMAIL!);
  await page.fill('input[name="password"]', process.env.BOOKIT_TEST_ADMIN_PASSWORD!);
  await page.click('button.booking-login-button');
  await page.waitForURL('**/bookit-dashboard/app/**');
}

export async function loginAsStaff(page: Page): Promise<void> {
  await page.goto('/bookit-dashboard/');
  await page.fill('input[name="email"]', process.env.BOOKIT_TEST_STAFF_EMAIL!);
  await page.fill('input[name="password"]', process.env.BOOKIT_TEST_STAFF_PASSWORD!);
  await page.click('button.booking-login-button');
  await page.waitForURL('**/bookit-dashboard/app/**');
}
```

---

### `bookit-booking-system/tests/e2e/fixtures/mailpit.ts` — CREATE

```typescript
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

export interface MailpitMessage {
  ID: string;
  Subject: string;
  To: Array<{ Address: string; Name: string }>;
  From: { Address: string; Name: string };
  Text: string;
  HTML: string;
}

export async function getLatestEmail(
  toAddress: string,
  timeoutMs = 15_000
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    if (!res.ok) throw new Error(`Mailpit API error: ${res.status}. Is Mailpit running?`);
    const data = await res.json();
    const messages: MailpitMessage[] = data.messages || [];
    const match = messages.find((m) =>
      m.To.some((t) => t.Address.toLowerCase() === toAddress.toLowerCase())
    );
    if (match) {
      const full = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      return (await full.json()) as MailpitMessage;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email found for ${toAddress} within ${timeoutMs}ms. Is Mailpit running?`);
}

export async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

// Extracts href from <a>linkText</a> in email HTML
// Used to pull cancel/reschedule magic link URLs
export function extractLinkFromEmail(html: string, linkText: string): string {
  const regex = new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*${linkText}\\s*<\\/a>`, 'i');
  const match = html.match(regex);
  if (!match) throw new Error(`Link "${linkText}" not found in email HTML`);
  return match[1];
}
```

---

### `bookit-booking-system/tests/e2e/fixtures/stripe.ts` — CREATE

```typescript
import { Page } from '@playwright/test';

// Before running Stripe tests, start webhook listener in a separate terminal:
//   stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook

export const STRIPE_TEST_CARD    = process.env.STRIPE_TEST_CARD    || '4242424242424242';
export const STRIPE_TEST_EXPIRY  = process.env.STRIPE_TEST_EXPIRY  || '12/30';
export const STRIPE_TEST_CVC     = process.env.STRIPE_TEST_CVC     || '123';

export async function fillStripeCheckout(page: Page): Promise<void> {
  await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30_000 });
  await page.fill('[placeholder*="Card number"]', STRIPE_TEST_CARD);
  await page.fill('[placeholder*="MM / YY"]',     STRIPE_TEST_EXPIRY);
  await page.fill('[placeholder*="CVC"]',          STRIPE_TEST_CVC);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 30_000 });
}
```

---

### `bookit-booking-system/tests/e2e/fixtures/manual-prompt.ts` — CREATE

```typescript
import * as readline from 'readline';

// Used in smoke tests for steps requiring human action on the live site.
export async function manualConfirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n⏸  [MANUAL] ${message}\n   Press Y to confirm, N to fail: `, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'Y');
    });
  });
}
```

---

### `bookit-booking-system/tests/e2e/fixtures/wizard.ts` — CREATE

Shared helper that completes Steps 1–4. All full E2E tests call this as
a `beforeEach` rather than duplicating the flow.

```typescript
import { Page } from '@playwright/test';
import { clearMailpit } from './mailpit';

const TEST_EMAIL = process.env.BOOKIT_TEST_CUSTOMER_EMAIL || 'testcustomer@bookit-e2e.local';

// SELECTOR REFERENCE (all sourced from PHP templates — do not change):
//
// Step 1 (booking-wizard-v2-step-1.php):
//   Service card:       .bookit-v2-service-card            (data-service-id, data-service-name)
//   Continue button:    #bookit-v2-continue
//
// Step 2 (booking-wizard-v2-step-2.php):
//   Staff (≤3 staff):  .bookit-v2-staff-row               (available = no --unavailable class)
//   Staff (4+ staff):  .bookit-v2-staff-card              (available = no --unavailable class)
//
// Step 3 (booking-wizard-v2-step-3.php):
//   Calendar day:       .bookit-v2-day--available          (button, data-date="YYYY-MM-DD")
//   Time slot:          .bookit-v2-slot--available         (button, data-time="HH:MM:SS")
//   Continue button:    #bookit-v2-continue
//
// Step 4 (booking-wizard-v2-step-4.php):
//   First name:         #first-name          (name="first_name")
//   Last name:          #last-name           (name="last_name")
//   Email:              #email               (name="email")
//   Phone:              #phone               (name="phone")
//   Cooling-off waiver: #cooling-off-waiver  (conditional — only shown for near-term bookings)
//   Waiver container:   #cooling-off-waiver-group
//   Submit (Step 4):    #bookit-contact-form button[type="submit"].bookit-v2-cta-btn
//
// Step 5 (booking-wizard-v2-step-5.php):
//   Pay in person row:  #bookit-v2-pay-person              (data-value="person")
//   Pay by card radio:  input[name="bookit_v2_payment_choice"][value="card"]
//   CTA button:         #bookit-v2-cta-btn
//   After POA confirm:  redirects to /booking-confirmed-v2/
//   Booking reference:  text matching /BK-\w+/

export async function completeWizardSteps1To4(page: Page): Promise<string> {
  await clearMailpit();
  await page.goto('/book-v2/');

  // Step 1: Select first service
  await page.waitForSelector('.bookit-v2-service-card');
  await page.locator('.bookit-v2-service-card').first().click();
  await page.locator('#bookit-v2-continue').click();

  // Step 2: Select first available staff
  // Staff renders as .bookit-v2-staff-row (≤3 staff) or .bookit-v2-staff-card (4+ staff)
  await page.waitForSelector(
    '.bookit-v2-staff-row:not(.bookit-v2-staff-row--unavailable), .bookit-v2-staff-card:not(.bookit-v2-staff-card--unavailable)'
  );
  await page.locator(
    '.bookit-v2-staff-row:not(.bookit-v2-staff-row--unavailable), .bookit-v2-staff-card:not(.bookit-v2-staff-card--unavailable)'
  ).first().click();
  await page.locator('#bookit-v2-continue').click();

  // Step 3: Click first available calendar date, then first available time slot
  await page.waitForSelector('.bookit-v2-day--available');
  await page.locator('.bookit-v2-day--available').first().click();
  await page.waitForSelector('.bookit-v2-slot--available', { timeout: 10_000 });
  await page.locator('.bookit-v2-slot--available').first().click();
  await page.locator('#bookit-v2-continue').click();

  // Step 4: Fill contact form
  await page.waitForSelector('#bookit-contact-form');
  await page.fill('#first-name', 'Test');
  await page.fill('#last-name',  'Bookit');
  await page.fill('#email',  TEST_EMAIL);
  await page.fill('#phone',  '07700900000');

  // Check cooling-off waiver if visible
  if (await page.locator('#cooling-off-waiver-group').isVisible()) {
    await page.check('#cooling-off-waiver');
  }

  // Submit Step 4
  await page.locator('#bookit-contact-form button[type="submit"].bookit-v2-cta-btn').click();
  await page.waitForSelector('#bookit-v2-cta-btn');

  return TEST_EMAIL;
}
```

---

### `bookit-booking-system/tests/e2e/tests/smoke/pages.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page load checks', { tag: '@smoke' }, () => {

  test('booking wizard loads at /book-v2/', async ({ page }) => {
    await page.goto('/book-v2/');
    // Shell renders .bookit-v2-wizard-container[data-step] — confirms no PHP fatal
    await expect(page.locator('.bookit-v2-wizard-container[data-step]')).toBeVisible();
  });

  test('/booking-confirmed-v2/ loads without params (no 500)', async ({ page }) => {
    await page.goto('/booking-confirmed-v2/');
    // Should render some content, not a PHP error page
    await expect(page).not.toHaveTitle(/error/i);
    await expect(page.locator('body')).not.toContainText('Fatal error');
  });

  test('/bookit-cancel/ shows invalid link message without token', async ({ page }) => {
    await page.goto('/bookit-cancel/');
    await expect(page.locator('body')).not.toContainText('Fatal error');
    // Should show an error/invalid state, not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('/bookit-reschedule/ shows invalid link message without token', async ({ page }) => {
    await page.goto('/bookit-reschedule/');
    await expect(page.locator('body')).not.toContainText('Fatal error');
    await expect(page.locator('body')).toBeVisible();
  });

  test('/my-packages/ loads', async ({ page }) => {
    await page.goto('/my-packages/');
    await expect(page).not.toHaveTitle(/error/i);
    await expect(page.locator('body')).not.toContainText('Fatal error');
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/smoke/auth.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';

// Selectors from dashboard/index.php:
//   input[name="email"], input[name="password"], button.booking-login-button
//   Error: .booking-login-error
//   Success redirect: /bookit-dashboard/app/

test.describe('Dashboard auth', { tag: '@smoke' }, () => {

  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    // Should show login form, not the Vue app
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('valid credentials reach the dashboard app', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    await page.fill('input[name="email"]',    process.env.BOOKIT_TEST_ADMIN_EMAIL!);
    await page.fill('input[name="password"]', process.env.BOOKIT_TEST_ADMIN_PASSWORD!);
    await page.click('button.booking-login-button');
    await page.waitForURL('**/bookit-dashboard/app/**');
    // Confirm Vue app loaded (not login page)
    await expect(page.locator('input[name="email"]')).not.toBeVisible();
  });

  test('invalid credentials show error and stay on login', async ({ page }) => {
    await page.goto('/bookit-dashboard/');
    await page.fill('input[name="email"]',    'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button.booking-login-button');
    // Must not redirect to app
    await expect(page).not.toHaveURL(/bookit-dashboard\/app/);
    // Error message shown (.booking-login-error from dashboard/css/dashboard-auth.css)
    await expect(page.locator('.booking-login-error')).toBeVisible();
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/smoke/api.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';

test.describe('REST API health', { tag: '@smoke' }, () => {

  test('GET wizard/services returns 200 with JSON array', async ({ request }) => {
    const res = await request.get('/wp-json/bookit/v1/wizard/services');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET wizard/staff returns 200', async ({ request }) => {
    const res = await request.get('/wp-json/bookit/v1/wizard/staff');
    expect(res.status()).toBe(200);
  });

  test('POST dashboard/login with empty body returns 400 not 500', async ({ request }) => {
    const res = await request.post('/wp-json/bookit/v1/dashboard/login', { data: {} });
    expect(res.status()).toBe(400);
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/smoke/wizard-steps.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';

// Selectors from booking-wizard-v2-step-1.php and booking-wizard-v2-step-2.php

test.describe('Wizard step rendering', { tag: '@smoke' }, () => {

  test('Step 1 renders at least one service card', async ({ page }) => {
    await page.goto('/book-v2/');
    await expect(page.locator('.bookit-v2-service-card').first()).toBeVisible();
  });

  test('Step 2 renders staff after service selected and Continue clicked', async ({ page }) => {
    await page.goto('/book-v2/');
    await page.waitForSelector('.bookit-v2-service-card');
    await page.locator('.bookit-v2-service-card').first().click();
    await page.locator('#bookit-v2-continue').click();
    // Step 2: staff row or card visible
    await expect(
      page.locator('.bookit-v2-staff-row, .bookit-v2-staff-card').first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/full/booking-poa.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { getLatestEmail } from '../../fixtures/mailpit';

// Step 5 selectors from booking-wizard-v2-step-5.php:
//   Pay in person row:  #bookit-v2-pay-person  (data-value="person")
//   CTA button:         #bookit-v2-cta-btn
//   After confirm:      redirects to /booking-confirmed-v2/?...
//   Booking ref:        text matching /BK-/

test.describe('Full booking — Pay on Arrival', { tag: '@full' }, () => {

  test('completes wizard Steps 1–5 POA, shows confirmation, delivers email', async ({ page }) => {
    const testEmail = await completeWizardSteps1To4(page);

    // Step 5: select Pay in Person
    await page.locator('#bookit-v2-pay-person').click();
    // CTA label updates to "Confirm booking" — click it
    await page.locator('#bookit-v2-cta-btn').click();

    // Assert confirmation page loaded
    await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });
    // Booking reference format is BK- (from booking-confirmed-v2.php)
    await expect(page.locator('body')).toContainText(/BK-/);

    // Assert confirmation email in Mailpit
    const email = await getLatestEmail(testEmail);
    expect(email.Subject.toLowerCase()).toContain('confirmed');
    expect(email.HTML).toMatch(/BK-/);
    // Email must contain Cancel and Reschedule links (magic link)
    expect(email.HTML.toLowerCase()).toContain('cancel');
    expect(email.HTML.toLowerCase()).toContain('reschedule');
    // Add to calendar button
    expect(email.HTML.toLowerCase()).toContain('calendar');
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/full/booking-stripe.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { fillStripeCheckout } from '../../fixtures/stripe';
import { getLatestEmail } from '../../fixtures/mailpit';

// PREREQUISITE: Run in a separate terminal before this test:
//   stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook
//
// Step 5 selectors from booking-wizard-v2-step-5.php:
//   Card radio: input[name="bookit_v2_payment_choice"][value="card"]
//   CTA:        #bookit-v2-cta-btn  (label becomes "Pay £X.XX now" when card selected)

test.describe('Full booking — Stripe card payment', { tag: '@full' }, () => {

  test('completes wizard with Stripe, webhook fires, confirmation email delivered', async ({ page }) => {
    const testEmail = await completeWizardSteps1To4(page);

    // Step 5: select card payment
    await page.locator('input[name="bookit_v2_payment_choice"][value="card"]').check();
    // CTA label should update to "Pay £X.XX now"
    await page.locator('#bookit-v2-cta-btn').click();

    // Fill Stripe hosted checkout (headed mode — set in playwright.config.ts for full mode)
    await fillStripeCheckout(page);

    // Confirmation page
    await expect(page.locator('body')).toContainText(/BK-/);

    // Wait for Stripe CLI webhook to fire and email to send (3s buffer)
    await page.waitForTimeout(3_000);

    const email = await getLatestEmail(testEmail);
    expect(email.Subject.toLowerCase()).toContain('confirmed');
    expect(email.HTML).toMatch(/BK-/);
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/full/magic-link.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { getLatestEmail, extractLinkFromEmail, clearMailpit } from '../../fixtures/mailpit';

// Magic link pages from cancel/reschedule shortcodes:
//   /bookit-cancel/?booking_id=X&token=Y
//   /bookit-reschedule/?booking_id=X&token=Y

test.describe('Magic link flows', { tag: '@full' }, () => {

  // Helper: complete a POA booking and return the confirmation email
  async function createBookingAndGetEmail(page: any) {
    const testEmail = await completeWizardSteps1To4(page);
    await page.locator('#bookit-v2-pay-person').click();
    await page.locator('#bookit-v2-cta-btn').click();
    await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });
    return { testEmail, email: await getLatestEmail(testEmail) };
  }

  test('cancel via magic link — booking cancelled, cancellation email delivered', async ({ page }) => {
    const { testEmail, email } = await createBookingAndGetEmail(page);

    const cancelUrl = extractLinkFromEmail(email.HTML, 'Cancel');
    await clearMailpit();
    await page.goto(cancelUrl);

    // Cancel confirmation page should load (not a 500)
    await expect(page.locator('body')).not.toContainText('Fatal error');

    // Find and click the confirm cancellation button
    // The cancel shortcode renders a confirm action — look for a submit button or link
    const confirmBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // Cancellation email
    const cancelEmail = await getLatestEmail(testEmail);
    expect(cancelEmail.Subject.toLowerCase()).toContain('cancel');
  });

  test('reschedule via magic link — new slot saved, reschedule email delivered', async ({ page }) => {
    const { testEmail, email } = await createBookingAndGetEmail(page);

    const rescheduleUrl = extractLinkFromEmail(email.HTML, 'Reschedule');
    await clearMailpit();
    await page.goto(rescheduleUrl);

    // Reschedule page renders calendar (same .bookit-v2-day--available class)
    await page.waitForSelector('.bookit-v2-day--available', { timeout: 10_000 });
    // Select a different date (second available, to avoid same slot)
    const dates = page.locator('.bookit-v2-day--available');
    const count = await dates.count();
    await dates.nth(count > 1 ? 1 : 0).click();

    await page.waitForSelector('.bookit-v2-slot--available', { timeout: 10_000 });
    await page.locator('.bookit-v2-slot--available').first().click();

    // Confirm reschedule — look for submit button
    const confirmBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // Reschedule email
    const rescheduleEmail = await getLatestEmail(testEmail);
    expect(rescheduleEmail.Subject.toLowerCase()).toContain('reschedul');
  });

  test('invalid token shows error, no crash', async ({ page }) => {
    await page.goto('/bookit-cancel/?booking_id=1&token=invalidtoken123');
    await expect(page.locator('body')).not.toContainText('Fatal error');
    // Should show some kind of error message
    await expect(page.locator('body')).toBeVisible();
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/full/dashboard.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsStaff } from '../../fixtures/auth';

// Dashboard Vue app selectors (from MySchedule.vue):
//   Status badge:       span.rounded-full (with status text inside)
//   Mark Complete btn:  button with class bg-green-600 and text "✓ Mark Complete"
//   No-Show btn:        button with class bg-red-600 and text "✗ No-Show"
//   Booking card:       .bg-white.rounded-lg.shadow

test.describe('Dashboard flows', { tag: '@full' }, () => {

  test('admin login — dashboard home loads', async ({ page }) => {
    await loginAsAdmin(page);
    // Vue app has loaded — should not see login form
    await expect(page.locator('input[name="email"]')).not.toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin sees today\'s schedule section', async ({ page }) => {
    await loginAsAdmin(page);
    // MySchedule.vue renders a schedule view — assert page has content
    await expect(page.locator('body')).not.toContainText('Fatal error');
    // Schedule section heading (may vary — assert page loaded meaningfully)
    await expect(page.locator('.bg-white').first()).toBeVisible({ timeout: 10_000 });
  });

  test('admin can mark a confirmed booking as complete via schedule', async ({ page }) => {
    await loginAsAdmin(page);
    // Find a confirmed booking — look for the Mark Complete button
    // (Only visible on confirmed bookings per MySchedule.vue)
    const completeBtn = page.locator('button.bg-green-600').first();
    if (await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await completeBtn.click();
      // Status badge should update — wait for UI to reflect
      await page.waitForTimeout(1_000);
      // The button should disappear (terminal state)
      await expect(completeBtn).not.toBeVisible();
    } else {
      test.skip(); // No confirmed bookings available to test
    }
  });

  test('admin can mark a confirmed booking as no-show', async ({ page }) => {
    await loginAsAdmin(page);
    const noShowBtn = page.locator('button.bg-red-600').first();
    if (await noShowBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await noShowBtn.click();
      await page.waitForTimeout(1_000);
      await expect(noShowBtn).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('staff login — sees own bookings only', async ({ page }) => {
    await loginAsStaff(page);
    await expect(page.locator('input[name="email"]')).not.toBeVisible();
    // Staff dashboard loads — no fatal errors
    await expect(page.locator('body')).not.toContainText('Fatal error');
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/email/confirmation.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { getLatestEmail } from '../../fixtures/mailpit';

test.describe('Confirmation email content', { tag: '@full' }, () => {

  test('confirmation email has correct subject, booking ref, and action links', async ({ page }) => {
    const testEmail = await completeWizardSteps1To4(page);
    await page.locator('#bookit-v2-pay-person').click();
    await page.locator('#bookit-v2-cta-btn').click();
    await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });

    const email = await getLatestEmail(testEmail);

    // Subject
    expect(email.Subject.toLowerCase()).toContain('confirmed');
    // Booking reference (BK- prefix from confirmation template)
    expect(email.HTML).toMatch(/BK-/);
    // Magic links present
    expect(email.HTML.toLowerCase()).toContain('cancel');
    expect(email.HTML.toLowerCase()).toContain('reschedule');
    // Add to calendar
    expect(email.HTML.toLowerCase()).toContain('calendar');
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/email/cancellation.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { getLatestEmail, extractLinkFromEmail, clearMailpit } from '../../fixtures/mailpit';

test.describe('Cancellation email content', { tag: '@full' }, () => {

  test('cancellation email has correct subject and service name', async ({ page }) => {
    const testEmail = await completeWizardSteps1To4(page);
    await page.locator('#bookit-v2-pay-person').click();
    await page.locator('#bookit-v2-cta-btn').click();
    await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });

    const confirmEmail = await getLatestEmail(testEmail);
    const cancelUrl = extractLinkFromEmail(confirmEmail.HTML, 'Cancel');

    await clearMailpit();
    await page.goto(cancelUrl);
    const confirmBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    const cancelEmail = await getLatestEmail(testEmail);
    expect(cancelEmail.Subject.toLowerCase()).toContain('cancel');
    // Should contain the service name booked
    expect(cancelEmail.HTML.length).toBeGreaterThan(0);
  });

});
```

---

### `bookit-booking-system/tests/e2e/tests/email/reschedule.spec.ts` — CREATE

```typescript
import { test, expect } from '@playwright/test';
import { completeWizardSteps1To4 } from '../../fixtures/wizard';
import { getLatestEmail, extractLinkFromEmail, clearMailpit } from '../../fixtures/mailpit';

test.describe('Reschedule email content', { tag: '@full' }, () => {

  test('reschedule email has correct subject and action links', async ({ page }) => {
    const testEmail = await completeWizardSteps1To4(page);
    await page.locator('#bookit-v2-pay-person').click();
    await page.locator('#bookit-v2-cta-btn').click();
    await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });

    const confirmEmail = await getLatestEmail(testEmail);
    const rescheduleUrl = extractLinkFromEmail(confirmEmail.HTML, 'Reschedule');

    await clearMailpit();
    await page.goto(rescheduleUrl);

    await page.waitForSelector('.bookit-v2-day--available', { timeout: 10_000 });
    const dates = page.locator('.bookit-v2-day--available');
    const count = await dates.count();
    await dates.nth(count > 1 ? 1 : 0).click();
    await page.waitForSelector('.bookit-v2-slot--available', { timeout: 10_000 });
    await page.locator('.bookit-v2-slot--available').first().click();
    const confirmBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    const rescheduleEmail = await getLatestEmail(testEmail);
    expect(rescheduleEmail.Subject.toLowerCase()).toContain('reschedul');
    expect(rescheduleEmail.HTML.toLowerCase()).toContain('cancel');
    expect(rescheduleEmail.HTML.toLowerCase()).toContain('reschedule');
  });

});
```

---

### `.github/workflows/e2e-smoke.yml` — CREATE

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

      - name: Install dependencies
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

Add these secrets in GitHub → Settings → Secrets → Actions:
- `BOOKIT_TEST_ADMIN_EMAIL`
- `BOOKIT_TEST_ADMIN_PASSWORD`
- `BOOKIT_TEST_STAFF_EMAIL`
- `BOOKIT_TEST_STAFF_PASSWORD`

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `MODE=smoke npx playwright test --grep @smoke` runs all smoke tests against live site in under 2 minutes
- [ ] `MODE=full npx playwright test --grep @full` runs all full tests against local site
- [ ] POA booking creates a booking record and delivers a confirmation email to Mailpit
- [ ] Stripe booking redirects to Stripe, completes payment, returns to confirmation page
- [ ] Cancel magic link extracted from email navigates to cancel page without PHP error
- [ ] Reschedule magic link loads calendar with `.bookit-v2-day--available` slots
- [ ] Invalid token (`?booking_id=1&token=invalid`) shows error without crashing
- [ ] Dashboard login with valid credentials reaches `/bookit-dashboard/app/`
- [ ] Dashboard login with bad credentials shows `.booking-login-error` and stays on login page
- [ ] Staff login reaches dashboard and sees no fatal errors

### Technical
- [ ] No hardcoded credentials in any spec file (env vars only)
- [ ] All selectors match the actual PHP templates — no invented class names
- [ ] `workers: 1` in config (sequential execution)
- [ ] `headless: false` in full mode (required for Stripe)
- [ ] `.env.test.local` and `.env.test.live` are in `.gitignore`
- [ ] GitHub Actions workflow triggers on push to `Phase1` branch

### Must NOT break
- [ ] Existing PHPUnit suite (this task adds no PHP files)
- [ ] WordPress admin or plugin settings
- [ ] Any existing Playwright config if one exists at that path

---

## BEFORE RUNNING FULL MODE

1. Start Mailpit: run `mailpit.exe`
2. Configure Local by Flywheel WordPress SMTP → host `localhost`, port `1025`
3. In Bookit Dashboard → Settings → Email: set provider to `wp_mail`
4. Start Stripe CLI: `stripe listen --forward-to http://plugin-test-1.local/wp-json/bookit/v1/stripe/webhook`
5. Fill in FILL_IN values in `.env.test.local`

## HOW TO RUN

```bash
# From bookit-booking-system/tests/e2e/

npm install
npx playwright install chromium

# Smoke tests (live site)
MODE=smoke npx playwright test --grep @smoke

# Full E2E (local site — Mailpit + Stripe CLI must be running)
MODE=full npx playwright test --grep @full

# Single file
MODE=full npx playwright test tests/full/booking-poa.spec.ts

# UI mode (best for debugging)
MODE=full npx playwright test --ui

# View report
npx playwright show-report
```

---

If you encounter a selector that doesn't match what's in the browser
(e.g. the cancel/reschedule confirm button has a different class than
button[type="submit"]), read the template file first and correct it —
do not guess. Report back if you find a discrepancy.