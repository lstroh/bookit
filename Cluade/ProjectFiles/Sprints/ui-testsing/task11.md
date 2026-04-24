# TASK: Fix wizard/complete interception in email specs and magic-link spec
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/tests/e2e/tests/full/booking-poa.spec.ts`
   — this is the REFERENCE implementation. Read its Step 5 block in
   full — specifically the page.route() intercept pattern for
   wizard/complete. Every other spec must match this pattern exactly.

2. `bookit-booking-system/tests/e2e/tests/email/confirmation.spec.ts`
3. `bookit-booking-system/tests/e2e/tests/email/cancellation.spec.ts`
4. `bookit-booking-system/tests/e2e/tests/email/reschedule.spec.ts`
5. `bookit-booking-system/tests/e2e/tests/full/magic-link.spec.ts`
   — read all four current implementations before changing any of them

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

`booking-poa.spec.ts` uses `page.route()` to intercept `wizard/complete`
at the network level, capturing the response body before page navigation
discards it. This is the correct pattern.

The email specs and magic-link spec still use the old pattern:
```typescript
const [completeResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/wizard/complete') ...),
  page.locator('#bookit-v2-cta-btn').click(),
]);
const body = await completeResponse.body();
```

This fails because `response.body()` returns empty bytes after the page
navigates to `/booking-confirmed-v2/` — the response stream is gone.
Result: `completeJson` is null and the test throws
`wizard/complete failed: null`.

---

## THE CORRECT PATTERN (from booking-poa.spec.ts)

```typescript
// Step 5: select Pay in Person (UI only — no network request on row click)
await page.locator('#bookit-v2-pay-person').click();

// Intercept wizard/complete at network level BEFORE clicking CTA.
// page.route() captures the response body before page navigation discards it.
let capturedBody: string | null = null;
await page.route('**/wizard/complete', async (route) => {
  const response = await route.fetch();
  capturedBody = await response.text();
  await route.fulfill({ response });
});

// CTA click: fires POST /wizard/session then POST /wizard/complete
await page.locator('#bookit-v2-cta-btn').click();

// Wait for route handler to capture the body
const deadline = Date.now() + 15_000;
while (capturedBody === null && Date.now() < deadline) {
  await page.waitForTimeout(100);
}

let completeJson: any = null;
try {
  if (capturedBody) completeJson = JSON.parse(capturedBody);
} catch { /* ignore */ }

if (!completeJson?.success) {
  throw new Error(`wizard/complete failed: ${capturedBody}`);
}

await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });
```

---

## CHANGES REQUIRED

### `tests/email/confirmation.spec.ts` — MODIFY

Replace the entire Step 5 + URL wait block with the correct pattern above.
Keep all email assertions after `waitForURL` unchanged.

### `tests/email/cancellation.spec.ts` — MODIFY

Same replacement. Keep all email assertions unchanged.

### `tests/email/reschedule.spec.ts` — MODIFY

Same replacement. Keep all reschedule flow (goto rescheduleUrl, pick slot,
click confirm) and email assertions unchanged.

### `tests/full/magic-link.spec.ts` — MODIFY

The `createBookingAndGetEmail` helper function contains the same broken
pattern. Replace its Step 5 + URL wait block with the correct pattern.

Also fix this line in `createBookingAndGetEmail`:
```typescript
return { testEmail, email: await getLatestEmail(testEmail) };
```
Must be:
```typescript
return { testEmail, email: await getLatestEmail(testEmail, page) };
```

---

## WHAT NOT TO CHANGE

- Do NOT change `booking-poa.spec.ts` — it is already correct
- Do NOT change `fixtures/wizard.ts`
- Do NOT change `fixtures/mailpit.ts`
- Do NOT change any PHP files
- Do NOT change any email assertions or test logic after `waitForURL`

---

## VERIFY

Run only the email specs and magic-link spec:

```powershell
npx cross-env MODE=full npx playwright test tests/email/ tests/full/magic-link.spec.ts --headed --reporter=list
```

Expected: all 5 tests pass (3 email + 2 magic-link; invalid token test
already passes and should continue to pass).

If any test still fails with `wizard/complete failed`, report the exact
`capturedBody` value — do not add workarounds.

---

If you encounter a conflict between the existing code and these
instructions, or a TypeScript scoping issue with `capturedBody`, stop
and report back before writing any code.