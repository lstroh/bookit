# TASK: Fix wizard.ts Step 3 — use waitForResponse instead of session polling
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST

1. `bookit-booking-system/tests/e2e/fixtures/wizard.ts` — full current state
2. `bookit-booking-system/public/assets/js/booking-wizard-v2.js` — slot click handler

---

## THE PROBLEM

The current fixture polls `GET /wp-json/bookit/v1/wizard/session` after the
slot click to confirm `date` and `time` are in the session. This approach has
a fundamental flaw:

The PHP session uses cookie-based session IDs. When the slot click fires
`POST /wp-json/bookit/v1/wizard/session` with `{date, time}`, the server may
regenerate the session cookie. The subsequent GET polling request may carry
the OLD cookie (before the browser has processed the Set-Cookie header from
the POST response), so the GET returns a session that doesn't have the date
and time yet — or worse, a completely different session.

This explains why the test passes intermittently (sometimes the cookie
rotation hasn't happened yet) and fails other times (cookie was rotated).

## THE FIX

Instead of polling the GET session endpoint, use Playwright's
`page.waitForResponse()` to intercept the POST response from the slot click
itself. The POST response contains the updated session data. If it returns
`success: true`, the session write succeeded in that exact request — no
polling needed.

This approach is deterministic because we're reading the response of the
actual write operation, not a subsequent read that may use a stale cookie.

---

## REWRITE — Step 3 slot selection in `fixtures/wizard.ts`

Replace the entire Step 3 section (from `await page.waitForSelector('.bookit-v2-calendar'`
to `await page.locator('#bookit-v2-continue').click()`) with this:

```typescript
  // -----------------------------------------------------------------------
  // Step 3: Find an available day, pick a slot, confirm session write
  // Uses waitForResponse on the slot POST — avoids cookie rotation race
  // -----------------------------------------------------------------------
  await page.waitForSelector('.bookit-v2-calendar', { timeout: 15_000 });

  let slotPicked = false;

  for (let month = 0; month < 3; month++) {
    const availableDays = page.locator('.bookit-v2-day--available');
    const dayCount = await availableDays.count();

    for (let i = 0; i < Math.min(dayCount, 8); i++) {
      const dayBtn = availableDays.nth(i);

      // Click the day and wait for the day's session POST to complete.
      // The day click posts {current_step:3, date:X} to the session API.
      const [dayResponse] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/wp-json/bookit/v1/wizard/session') && r.request().method() === 'POST',
          { timeout: 10_000 }
        ),
        dayBtn.click(),
      ]);

      // Check the day POST succeeded
      const dayJson = await dayResponse.json().catch(() => null);
      if (!dayJson?.success) {
        // Day POST failed — try the next day
        continue;
      }

      // Wait for slots to appear (loaded asynchronously via fetch after day POST)
      const slotVisible = await page
        .locator('.bookit-v2-slot--available')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (!slotVisible) {
        // No slots on this day — try next day
        continue;
      }

      // Click a slot and wait for the slot's session POST to complete.
      // The slot POST contains {current_step:3, date:X, time:Y}.
      // Reading the POST response directly avoids cookie-rotation race.
      const [slotResponse] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/wp-json/bookit/v1/wizard/session') && r.request().method() === 'POST',
          { timeout: 10_000 }
        ),
        page.locator('.bookit-v2-slot--available').first().click(),
      ]);

      const slotJson = await slotResponse.json().catch(() => null);
      if (!slotJson?.success) {
        // Slot POST failed — try next day
        continue;
      }

      slotPicked = true;
      break;
    }

    if (slotPicked) break;

    // No slots found this month — navigate to next month via <a href> link
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

  // Wait for Continue button to be enabled (JS enables it in the slot POST .then())
  await page.waitForFunction(() => {
    const btn = document.querySelector<HTMLButtonElement>('#bookit-v2-continue');
    return btn !== null && !btn.disabled;
  }, { timeout: 10_000 });

  await page.locator('#bookit-v2-continue').click();
```

**Remove all the session GET polling code** — the `for (let attempt = 0; attempt < 50; attempt++)` blocks that call `GET /wp-json/bookit/v1/wizard/session`. Replace entirely with the above.

---

## WHY THIS IS BETTER

| Old approach | New approach |
|---|---|
| POST slot → poll GET session 50 times | POST slot → read POST response directly |
| Reads from potentially stale cookie | Reads from the exact response of the write |
| Intermittent — depends on cookie rotation timing | Deterministic — POST success means write succeeded |
| 50 × 200ms = up to 10s polling per attempt | Single waitForResponse, typically <500ms |

---

## VERIFY

```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

Watch for:
1. Day click → POST intercepted → slots appear
2. Slot click → POST intercepted → Continue becomes enabled
3. Continue clicked → Step 4 contact form appears (not the error message)
4. Form filled → Step 5 payment options appear
5. Pay in Person → Confirm → booking confirmed page

If it still fails at Step 4 with "Please complete the previous steps first",
open the trace and check what the slot POST response body actually contains.
The response should include `success: true` and the session data.

---

## ACCEPTANCE CRITERIA

- [ ] Headed run reaches Step 4 contact form reliably
- [ ] No GET session polling loops in the fixture
- [ ] `npm run test:full tests/full/booking-poa.spec.ts` passes 3 consecutive runs