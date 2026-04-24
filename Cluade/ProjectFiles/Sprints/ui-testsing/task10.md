# TASK: Fix Step 3 slot selection timing in fixtures/wizard.ts
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/tests/e2e/fixtures/wizard.ts`
   — read the full Step 3 block carefully, from the comment
   `// Step 3: Find an available day` to the end of the slot
   selection loop

2. `bookit-booking-system/public/assets/js/booking-wizard-v2.js`
   — read `initStep3()` specifically the day click handler to
   understand the exact sequence of network calls

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When a day button is clicked in Step 3, the JS fires two sequential
network calls in a `.then()` chain:

1. `POST /wizard/session` — saves the selected date
2. `GET /wizard/timeslots?date=X` — fetches slots for that date
   (only fires AFTER the session POST resolves)
3. Slots are rendered into the DOM (only AFTER the timeslots GET resolves)

The current fixture does this:
```typescript
// Click day → wait for session POST
const [dayResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/wizard/session') && r.request().method() === 'POST'),
  dayBtn.click(),
]);

// Then check if slots are visible (5 second timeout)
const slotVisible = await page.locator('.bookit-v2-slot--available')
  .first().isVisible({ timeout: 5_000 }).catch(() => false);
```

**The bug:** The `waitForResponse` on the session POST resolves as
soon as the POST response arrives — but the timeslots GET hasn't
fired yet (it fires in the `.then()` callback client-side). The
fixture then immediately checks `isVisible` and may see stale slots
from a previously selected day still in the DOM. It clicks a stale
slot for the wrong date, leading to `slot_unavailable` at
`wizard/complete`.

**The fix:** After the session POST resolves, also wait for the
`GET /wizard/timeslots` response before checking slot visibility.
This guarantees the slots in the DOM are for the currently selected
day.

---

## IMPLEMENTATION REQUIREMENTS

### `tests/e2e/fixtures/wizard.ts` — MODIFY (Step 3 block only)

Find the section that begins with:
```typescript
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
const [slotResponse] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes('/wp-json/bookit/v1/wizard/session') &&
      r.request().method() === 'POST',
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
```

Replace that entire section with:

```typescript
// Wait for the timeslots GET that fires automatically after the
// session POST resolves client-side. This guarantees slots in the
// DOM are for the currently selected day — not stale slots from
// a previous day selection.
//
// IMPORTANT: set up waitForResponse BEFORE the session POST
// resolves, so we don't miss the timeslots GET firing in the
// JS .then() callback. Use a separate promise registered before
// the day click resolves.
const timeslotsPromise = page.waitForResponse(
  (r) =>
    r.url().includes('/wizard/timeslots') &&
    r.request().method() === 'GET',
  { timeout: 10_000 }
).catch(() => null);

// The timeslots GET fires automatically after dayResponse — no
// additional click needed. Just await the promise.
const timeslotsResponse = await timeslotsPromise;
if (!timeslotsResponse) {
  // Timeslots fetch timed out — try next day
  continue;
}

const timeslotsJson = await timeslotsResponse.json().catch(() => null);
if (!timeslotsJson?.success || !timeslotsJson?.available) {
  // No slots available on this day
  continue;
}

// Slots are now guaranteed to be in the DOM for the selected day.
// Click the first available slot and wait for its session POST.
const [slotResponse] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes('/wp-json/bookit/v1/wizard/session') &&
      r.request().method() === 'POST',
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
```

**CRITICAL placement:** The `timeslotsPromise` must be registered
BEFORE `dayResponse` is awaited — otherwise the timeslots GET may
fire and complete before the promise listener is attached.

This means the `timeslotsPromise` registration must move BEFORE the
`Promise.all` that awaits the day click. The final order in the day
loop must be:

1. Register `timeslotsPromise = page.waitForResponse(...)` for the
   timeslots GET — **before the day click**
2. `Promise.all([waitForResponse(session POST), dayBtn.click()])` —
   clicks the day and waits for session POST
3. Check `dayJson?.success` — skip to next day if failed
4. `await timeslotsPromise` — wait for timeslots GET to complete
5. Check `timeslotsJson?.available` — skip if no slots
6. `Promise.all([waitForResponse(session POST), slot.click()])` —
   click slot and wait for its session POST
7. Check `slotJson?.success` — skip if failed
8. `slotPicked = true; break;`

---

## WHAT NOT TO CHANGE

- Do NOT change the month navigation logic
- Do NOT change the day loop structure (`for (let i = 0; ...)`)
- Do NOT change anything in Step 1, Step 2, or Step 4
- Do NOT change any PHP files
- Do NOT add `waitForTimeout` delays
- Do NOT change `booking-poa.spec.ts` or any spec files

---

## VERIFY

After making the change, run the test **twice in a row** without
clearing the database between runs:

```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed --reporter=list
```

Then immediately again:

```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed --reporter=list
```

Both runs must pass. The `[SESSION CHECK before complete]` lines must
show different times on each run (confirming the fixture picked a
genuinely different slot, not a stale one).

If the second run still gets `slot_unavailable`, do NOT add
workarounds. Report the `[SESSION CHECK before complete]` output and
the Bookit log entries for `get_staff_availability` from both runs.

---

If you encounter a conflict between the existing code and these
instructions, or if the `timeslotsPromise` placement creates a
TypeScript scoping issue, stop and report back before writing any code.