# STANDALONE PATCH: Playwright Reschedule Test Robustness
Sprint: 6E | Est: ~45min | No PHP changes — Playwright TypeScript only

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `tests/e2e/tests/full/magic-link.spec.ts` — Read in full.
   Focus on the `reschedule via magic link` test. Note the exact
   lines that click a date and wait for `.bookit-v2-slot--available`.

2. `tests/e2e/tests/email/reschedule.spec.ts` — Read in full.
   Note the identical slot-selection block — both files have the same
   broken pattern and both need the same fix.

3. `tests/e2e/fixtures/wizard.ts` — Read the Step 3 slot-picking loop
   in full (the `for (let month = 0; month < 3; month++)` block).
   This is the working reference pattern you will port to the two
   test files above. Understand every part of it before writing
   anything.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The reschedule page calendar (`public/templates/reschedule-booking.php`)
marks every non-past, non-bank-holiday day as `.bookit-v2-day--available`
regardless of whether the staff member actually has working hours that day.
The calendar appearance and the actual slot availability are independent.

Both failing tests currently do this:

```typescript
const dates = page.locator('.bookit-v2-day--available');
const count = await dates.count();
await dates.nth(count > 1 ? 1 : 0).click();          // picks one calendar day
await page.waitForSelector('.bookit-v2-slot--available', { timeout: 10_000 }); // times out
```

When the selected date has no working hours configured for the staff member,
the timeslots API returns zero slots, the "No available times" message shows,
and `.bookit-v2-slot--available` never appears. The test times out.

The wizard fixture (`fixtures/wizard.ts`) already solves this correctly
with a retry loop: call the timeslots API for each candidate date, check
`available === true` in the JSON response before proceeding, advance to
the next month if needed. Port the same pattern to the two failing tests.

**Key difference from the wizard fixture:** The reschedule page does NOT
use wizard session POSTs when a day is clicked. A day click on the
reschedule page fires a direct GET to `/wizard/timeslots?staff_id=X&service_id=Y&date=Z`
and renders the slots client-side via JavaScript. There is no session POST
to wait for — only the timeslots GET response.

---

## IMPLEMENTATION REQUIREMENTS

### tests/e2e/tests/full/magic-link.spec.ts — MODIFY

Read the file first. Find the `reschedule via magic link` test.

Replace the current slot-selection block (from after
`await page.waitForSelector('.bookit-v2-day--available', ...)` through
to the `confirmBtn.click()` call) with the retry helper described below.

Do NOT touch the `cancel via magic link` test or any other part of the
file.

### tests/e2e/tests/email/reschedule.spec.ts — MODIFY

Read the file first. Apply the same replacement to the identical
slot-selection block in this file.

### Shared helper: `pickRescheduleSlot`

Because the same logic is needed in both files, extract it into a
shared helper. Two options — choose whichever is simpler:

**Option A (preferred):** Add a named helper function at the top of
each file (above the `test.describe` block), duplicated in both files.
This avoids creating a new fixture file for a small patch.

**Option B:** Add `pickRescheduleSlot` to `fixtures/wizard.ts` as an
exported function alongside the existing helpers.

Either approach is acceptable. Read both files and choose whichever
requires fewer changes.

### The `pickRescheduleSlot` helper logic

```typescript
/**
 * On the reschedule page, find a date that actually has slots available
 * and click the first slot. Retries across up to 3 months.
 *
 * The reschedule calendar marks all non-past days as .bookit-v2-day--available
 * regardless of staff working hours — so we must check the timeslots API
 * response, not just the DOM class, to find a bookable day.
 *
 * Unlike the wizard fixture (which waits for a session POST after each day
 * click), the reschedule page fires only a timeslots GET on day click.
 * We intercept that GET to check availability before touching the DOM.
 */
async function pickRescheduleSlot(page: Page): Promise<void> {
  let slotPicked = false;

  for (let month = 0; month < 3; month++) {
    await page.waitForSelector('.bookit-v2-day--available', { timeout: 15_000 });

    const availableDays = page.locator('.bookit-v2-day--available');
    const dayCount = await availableDays.count();

    for (let i = 0; i < dayCount; i++) {
      const dayBtn = availableDays.nth(i);

      // Register the timeslots response promise BEFORE clicking,
      // so we don't miss the GET that fires immediately on click.
      const timeslotsPromise = page
        .waitForResponse(
          (r) =>
            r.url().includes('/wizard/timeslots') && r.request().method() === 'GET',
          { timeout: 10_000 }
        )
        .catch(() => null);

      await dayBtn.click();

      const timeslotsResponse = await timeslotsPromise;
      if (!timeslotsResponse) continue; // GET timed out — try next day

      const timeslotsJson = await timeslotsResponse.json().catch(() => null);
      if (!timeslotsJson?.success || !timeslotsJson?.available) continue; // no slots

      // Slots are now in the DOM — click the first one.
      await page.waitForSelector('.bookit-v2-slot--available', { timeout: 5_000 });
      await page.locator('.bookit-v2-slot--available').first().click();
      slotPicked = true;
      break;
    }

    if (slotPicked) break;

    // No slots found this month — click the next-month button and rebuild.
    // The reschedule calendar uses JS to rebuild the grid on next/prev click
    // (class-shortcodes.php buildGrid() function), so wait for the grid to
    // update rather than a navigation event.
    const nextBtn = page.locator('#bookit-reschedule-next-month');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500); // allow JS grid rebuild
    } else {
      break; // no next-month button — can't advance
    }
  }

  if (!slotPicked) {
    throw new Error(
      'pickRescheduleSlot: no bookable slot found in 3 months. ' +
      'Ensure the test staff member has working hours configured.'
    );
  }
}
```

**Import note:** If you put `pickRescheduleSlot` in `fixtures/wizard.ts`,
import `Page` from `@playwright/test` (it is already imported there).
If you keep it local to each test file, `Page` is already imported via
`import { test, expect, Page } from '@playwright/test'` in magic-link.spec.ts.
For reschedule.spec.ts, add `Page` to the existing import if it is missing.

### Replacing the slot-selection block

In both test files, replace the existing slot-selection code with a call
to the helper, followed by the confirm button interaction. The block to
replace in both files looks like:

```typescript
// REMOVE THIS:
await page.waitForSelector('.bookit-v2-day--available', { timeout: 20_000 });
const dates = page.locator('.bookit-v2-day--available');
const count = await dates.count();
await dates.nth(count > 1 ? 1 : 0).click();
await page.waitForSelector('.bookit-v2-slot--available', { timeout: 10_000 });
await page.locator('.bookit-v2-slot--available').first().click();
const confirmBtn = page.locator('#bookit-reschedule-confirm');
if (await confirmBtn.isVisible()) {
  await expect(confirmBtn).toBeEnabled({ timeout: 10_000 });
  await confirmBtn.click();
}
```

```typescript
// REPLACE WITH:
await pickRescheduleSlot(page);

const confirmBtn = page.locator('#bookit-reschedule-confirm');
if (await confirmBtn.isVisible()) {
  await expect(confirmBtn).toBeEnabled({ timeout: 10_000 });
  await confirmBtn.click();
}
```

The `await page.waitForLoadState('networkidle', ...)` line that precedes
the slot-selection block in both files should be kept as-is.

---

## ACCEPTANCE CRITERIA

- [ ] `tests/full/magic-link.spec.ts` — reschedule test passes even when
      the booked day (tomorrow) has no staff availability
- [ ] `tests/email/reschedule.spec.ts` — reschedule email test passes
      under the same condition
- [ ] If no slots are found across 3 months, the test throws a clear
      error message identifying the cause (working hours not configured)
      rather than a generic timeout
- [ ] The `cancel via magic link` test is unchanged and still passes
- [ ] All other passing tests remain green
- [ ] No TypeScript compilation errors (`npx tsc --noEmit` in `tests/e2e/`)

---

## VERIFICATION

Run the full Playwright suite:
```bash
cd bookit-booking-system/tests/e2e
npm run test:full
```

Expected result:
- `magic-link.spec.ts` reschedule test: ✅ passes
- `email/reschedule.spec.ts`: ✅ passes
- All previously passing tests: ✅ still pass
- Maximum 1 skip (Stripe)

Report the pass/fail counts back.

---

## NO PHPUnit CHANGES

This patch is Playwright TypeScript only. Do not touch any PHP files.
PHPUnit baseline remains 976 tests, 0 failures — no regression expected.

---

## GIT COMMIT MESSAGE

```
Playwright: fix reschedule test flakiness — slot retry loop

- magic-link.spec.ts: replace blind day click with pickRescheduleSlot()
  helper that checks timeslots API response before selecting a slot
- email/reschedule.spec.ts: same fix applied
- Tests now retry across days and months until a genuinely bookable
  slot is found, matching the pattern in fixtures/wizard.ts

Root cause: reschedule calendar marks all non-past days as
.bookit-v2-day--available regardless of staff working hours.
The previous code assumed any calendar day would have slots.
```

---

If you encounter an architecture decision not covered above, or a conflict
with existing code that this prompt does not resolve, STOP and report back
before writing any code.