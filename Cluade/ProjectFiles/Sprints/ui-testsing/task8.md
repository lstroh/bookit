# TASK: Fix Step 5 payment row click in booking-poa.spec.ts and related files
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/public/assets/js/booking-wizard-v2.js` — read initStep5() in full
2. `bookit-booking-system/tests/e2e/tests/full/booking-poa.spec.ts` — current state
3. `bookit-booking-system/tests/e2e/tests/email/confirmation.spec.ts` — current state
4. `bookit-booking-system/tests/e2e/tests/email/cancellation.spec.ts` — current state
5. `bookit-booking-system/tests/e2e/tests/email/reschedule.spec.ts` — current state
6. `bookit-booking-system/tests/e2e/tests/full/magic-link.spec.ts` — current state

---

## ROOT CAUSE

The previous fix added `waitForResponse` on the payment row click
(`#bookit-v2-pay-person`). This is wrong.

Reading `initStep5()` in `booking-wizard-v2.js`, clicking a payment row
does **only this**:
- Updates the selected visual state
- Checks the radio button
- Calls `updateCtaLabel()` to change the CTA button text

**There is no `postToSession()` call on payment row click.**
No network request fires. The test times out waiting for a POST that
never happens.

The payment method is only saved to the session when the **CTA button
is clicked**, inside its click handler:
```javascript
cta.addEventListener('click', function() {
  var choice = getPaymentChoiceValue();  // reads checked radio
  postToSession({ current_step: 5, payment_method: choice })
    .then(function() {
      fetch('bookit/v1/wizard/complete', ...);  // then completes booking
    });
});
```

Both the session save and the complete call happen **inside the same
chained promise** when the CTA is clicked. The browser handles cookie
state correctly within a single JS execution context.

---

## THE FIX

In every file that currently has `waitForResponse` on the payment row
click, remove it. The correct pattern is:

1. Click the payment row (no await on network — it's UI only)
2. Click the CTA and intercept `wizard/complete` only

### Correct Step 5 pattern:

```typescript
// Click Pay in Person — UI only, no network request
await page.locator('#bookit-v2-pay-person').click();

// CTA click fires two chained fetches internally:
//   1. POST /wizard/session (saves payment_method)
//   2. POST /wizard/complete (creates booking)
// Intercept wizard/complete to get the result before asserting URL.
const [completeResponse] = await Promise.all([
  page.waitForResponse(
    r => r.url().includes('/wizard/complete') && r.request().method() === 'POST',
    { timeout: 20_000 }
  ),
  page.locator('#bookit-v2-cta-btn').click(),
]);

const completeJson = await completeResponse.json().catch(() => null);
if (!completeJson?.success) {
  throw new Error(`wizard/complete failed: ${JSON.stringify(completeJson)}`);
}

await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });
```

---

## CHANGES REQUIRED

### `tests/full/booking-poa.spec.ts`

Remove any `waitForResponse` block associated with `#bookit-v2-pay-person`
click. Apply the correct pattern above. Remove any retry loop — keep the
test simple.

Final Step 5 block should be exactly:

```typescript
// Step 5: select Pay in Person (UI only — no network request on row click)
await page.locator('#bookit-v2-pay-person').click();

// CTA click: POST /wizard/session then POST /wizard/complete (chained in JS)
const [completeResponse] = await Promise.all([
  page.waitForResponse(
    r => r.url().includes('/wizard/complete') && r.request().method() === 'POST',
    { timeout: 20_000 }
  ),
  page.locator('#bookit-v2-cta-btn').click(),
]);

const completeJson = await completeResponse.json().catch(() => null);
if (!completeJson?.success) {
  throw new Error(`wizard/complete failed: ${JSON.stringify(completeJson)}`);
}

await page.waitForURL('**/booking-confirmed-v2/**', { timeout: 20_000 });
await expect(page.locator('body')).toContainText(/BK[\d-]/);

const email = await getLatestEmail(testEmail);
expect(email.Subject.toLowerCase()).toContain('confirmed');
expect(email.HTML).toMatch(/BK[\d-]/);
expect(email.HTML.toLowerCase()).toContain('cancel');
expect(email.HTML.toLowerCase()).toContain('reschedule');
expect(email.HTML.toLowerCase()).toContain('calendar');
```

### `tests/email/confirmation.spec.ts`
### `tests/email/cancellation.spec.ts`
### `tests/email/reschedule.spec.ts`
### `tests/full/magic-link.spec.ts` (the `createBookingAndGetEmail` helper)

Apply the same fix in each — remove any `waitForResponse` on the payment
row click, keep only the `waitForResponse` on `wizard/complete`.

---

## WHAT NOT TO CHANGE

- Do NOT change `fixtures/wizard.ts`
- Do NOT change any PHP files
- Do NOT add any `waitForTimeout` delays

---

## VERIFY

Run headed after applying the fix:
```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

Watch for:
- Pay in person row highlights when clicked (no network request)
- CTA button changes to "Confirm booking"
- CTA click → two network requests fire (session POST then complete POST)
- If `wizard/complete` returns 400, the test throws a descriptive error
  showing the exact JSON response — report that back

If `wizard/complete` still returns 400, do NOT add more workarounds.
Report the exact `completeJson` error body so the session state can
be investigated.