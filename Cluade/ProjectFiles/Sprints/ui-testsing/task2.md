# TASK: Fix wizard.ts — staff selection reload race + month navigation
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/tests/e2e/fixtures/wizard.ts` — current state
2. `bookit-booking-system/public/assets/js/booking-wizard-v2.js` — initStep2() specifically
3. `bookit-booking-system/public/templates/booking-wizard-v2-step-3.php` — month nav link HTML

---

## CONTEXT

Two specific bugs in `fixtures/wizard.ts` are causing all 7 failures.
Fix both. Do not change anything else.

---

## BUG 1 — Staff selection: clicking Continue after staff click races with page reload

### Root cause

In `booking-wizard-v2.js`, `initStep2()` works like this:
```javascript
// On staff row click → calls bookit/v1/staff/select API → on success:
window.location.reload();
```

The page **automatically reloads to Step 3** after a successful staff click.
There is NO Continue button needed after staff selection — the reload IS the
navigation to Step 3.

The current fixture does this:
```typescript
await staffRow.first().click();
await page.locator('#bookit-v2-continue').click();  // ← WRONG, this races with reload
```

The `#bookit-v2-continue` click either fires before the reload (clicking
Continue on Step 2 increments the step incorrectly) or after (the element
no longer exists), causing the session to be corrupted and the wizard to
loop back to the beginning.

### Fix

Replace the Step 2 block with:
```typescript
// booking-wizard-v2.js calls window.location.reload() after staff/select succeeds.
// Wait for that reload to complete — do NOT click Continue after staff selection.
await Promise.all([
  page.waitForNavigation({ waitUntil: 'load', timeout: 20_000 }),
  staffRow.first().click(),
]);
// Page has now reloaded onto Step 3 — do not click Continue here.
```

---

## BUG 2 — Month navigation: clicking anchor link needs waitForNavigation

### Root cause

In `booking-wizard-v2-step-3.php`, the month navigation arrows are `<a href>`
links that load the next month via a full PHP page load (not JS). Clicking
them triggers a page navigation. The current fixture does:

```typescript
const nextNav = page.locator('.bookit-v2-calendar-nav').last();
await nextNav.click();
await page.waitForTimeout(600);
```

Clicking an `<a href>` and then waiting 600ms is a race — the page navigation
may not have completed. This causes the "Missing .bookit-v2-calendar" error
because the code tries to interact with the calendar before the new month has
loaded.

### Fix

Replace the month navigation click with `waitForNavigation`:
```typescript
await Promise.all([
  page.waitForNavigation({ waitUntil: 'load', timeout: 15_000 }),
  page.locator('.bookit-v2-calendar-nav').last().click(),
]);
```

---

## COMPLETE REWRITE OF `fixtures/wizard.ts`

Write the full file with both fixes applied:

```typescript
import { Page } from '@playwright/test';
import { clearMailpit } from './mailpit';

const TEST_EMAIL = process.env.BOOKIT_TEST_CUSTOMER_EMAIL || 'testcustomer@bookit-e2e.local';

/**
 * Complete the booking wizard Steps 1–4.
 *
 * Selects service and staff by name from env vars:
 *   BOOKIT_TEST_SERVICE_NAME — exact name of service card to select
 *   BOOKIT_TEST_STAFF_NAME   — exact name of staff member to select
 *
 * KEY BEHAVIOURS:
 * - Step 2: clicking a staff row calls bookit/v1/staff/select which triggers
 *   window.location.reload() on success — no Continue click needed or wanted.
 * - Step 3: month nav arrows are <a href> links causing full page loads —
 *   must use waitForNavigation alongside the click.
 */
export async function completeWizardSteps1To4(page: Page): Promise<string> {
  await clearMailpit();
  await page.goto('/book-v2/');

  // -----------------------------------------------------------------------
  // Step 1: Select service by name
  // -----------------------------------------------------------------------
  const serviceName = process.env.BOOKIT_TEST_SERVICE_NAME;
  if (!serviceName) {
    throw new Error('BOOKIT_TEST_SERVICE_NAME is not set in .env.test.local');
  }

  await page.waitForSelector('.bookit-v2-service-card');

  const serviceCard = page.locator(
    `.bookit-v2-service-card[data-service-name="${serviceName}"]`
  );
  if ((await serviceCard.count()) === 0) {
    throw new Error(
      `Service card not found for BOOKIT_TEST_SERVICE_NAME="${serviceName}". ` +
      `Check the service exists and is active on the local site.`
    );
  }
  await serviceCard.first().click();

  // Wait for Continue to be enabled, then click it (Step 1 does need Continue)
  await page.waitForFunction(() => {
    const btn = document.querySelector<HTMLButtonElement>('#bookit-v2-continue');
    return btn !== null && !btn.disabled;
  });
  await page.locator('#bookit-v2-continue').click();

  // -----------------------------------------------------------------------
  // Step 2: Select staff by name — page reloads automatically on success
  // DO NOT click Continue after staff selection
  // -----------------------------------------------------------------------
  const staffName = process.env.BOOKIT_TEST_STAFF_NAME;
  if (!staffName) {
    throw new Error('BOOKIT_TEST_STAFF_NAME is not set in .env.test.local');
  }

  await page.waitForSelector('.bookit-v2-staff-row, .bookit-v2-staff-card');

  const staffRow = page
    .locator(
      '.bookit-v2-staff-row:not(.bookit-v2-staff-row--unavailable), ' +
      '.bookit-v2-staff-card:not(.bookit-v2-staff-card--unavailable)'
    )
    .filter({ hasText: staffName });

  if ((await staffRow.count()) === 0) {
    throw new Error(
      `Staff row not found for BOOKIT_TEST_STAFF_NAME="${staffName}". ` +
      `Check the staff member exists, is active, and is assigned to ` +
      `service "${serviceName}" on the local site.`
    );
  }

  // Click staff row and wait for the automatic page reload to Step 3.
  // booking-wizard-v2.js calls window.location.reload() after staff/select succeeds.
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 20_000 }),
    staffRow.first().click(),
  ]);
  // Page is now on Step 3. Do NOT click Continue here.

  // -----------------------------------------------------------------------
  // Step 3: Find an available day (navigate months if needed), pick a slot
  // Month nav arrows are <a href> links — must waitForNavigation with click
  // -----------------------------------------------------------------------
  await page.waitForSelector('.bookit-v2-calendar', { timeout: 15_000 });

  let slotPicked = false;

  for (let month = 0; month < 3; month++) {
    // Try each available day in this month until one has slots
    const availableDays = page.locator('.bookit-v2-day--available');
    const dayCount = await availableDays.count();

    for (let i = 0; i < Math.min(dayCount, 8); i++) {
      await availableDays.nth(i).click();
      // Slots load asynchronously via fetch after a day click
      const slotVisible = await page
        .locator('.bookit-v2-slot--available')
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      if (slotVisible) {
        await page.locator('.bookit-v2-slot--available').first().click();
        slotPicked = true;
        break;
      }
      // This day has no slots — try the next available day
    }

    if (slotPicked) break;

    // No slots found this month — navigate to next month via <a href> link
    // Must waitForNavigation because clicking the link causes a full page load
    if (month < 2) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15_000 }),
        page.locator('.bookit-v2-calendar-nav').last().click(),
      ]);
      await page.waitForSelector('.bookit-v2-calendar', { timeout: 10_000 });
    }
  }

  if (!slotPicked) {
    throw new Error(
      `No bookable time slots found in the next 3 months for ` +
      `staff "${staffName}" / service "${serviceName}". ` +
      `Go to Dashboard → Staff → ${staffName} → Working Hours and confirm ` +
      `availability is configured and the service is assigned to this staff member.`
    );
  }

  // Continue is enabled once a slot is selected
  await page.waitForFunction(() => {
    const btn = document.querySelector<HTMLButtonElement>('#bookit-v2-continue');
    return btn !== null && !btn.disabled;
  });
  await page.locator('#bookit-v2-continue').click();

  // -----------------------------------------------------------------------
  // Step 4: Fill contact form
  // -----------------------------------------------------------------------
  await page.waitForSelector('#bookit-contact-form', { timeout: 15_000 });
  await page.fill('#first-name', 'Test');
  await page.fill('#last-name', 'Bookit');
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#phone', '07700900000');

  // Check cooling-off waiver if visible (only shown for near-term bookings)
  if (await page.locator('#cooling-off-waiver-group').isVisible()) {
    await page.check('#cooling-off-waiver');
  }

  // Submit Step 4 — triggers session save and advances to Step 5
  await page.locator(
    '#bookit-contact-form button[type="submit"].bookit-v2-cta-btn'
  ).click();

  // Wait for Step 5 CTA to confirm we've advanced
  await page.waitForSelector('#bookit-v2-cta-btn', { timeout: 15_000 });

  return TEST_EMAIL;
}
```

---

## VERIFY WITH HEADED MODE FIRST

Before running the full suite, run one test in headed mode to watch it:
```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

You should see:
1. Step 1: correct service card highlighted, Continue clicked
2. Step 2: correct staff row highlighted, then page automatically reloads (no Continue click)
3. Step 3: calendar appears, a date is clicked, slots appear, first slot clicked, Continue clicked
4. Step 4: contact form fills, submits
5. Step 5: payment options appear

If step 2 still loops back to step 1, check the browser console for errors
from the `bookit/v1/staff/select` API call (401 nonce error is common in
headed mode if the session cookie isn't being sent).

---

## ACCEPTANCE CRITERIA

- [ ] Headed mode run of `booking-poa.spec.ts` reaches Step 4 contact form
- [ ] No Continue click after Step 2 staff selection
- [ ] Month navigation uses `waitForNavigation` alongside the anchor click
- [ ] `npm run test:full` — the 7 calendar/wizard failures are resolved or
      produce the descriptive "no working hours" error instead of a timeout