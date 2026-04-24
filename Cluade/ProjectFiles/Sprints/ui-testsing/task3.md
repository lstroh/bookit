# TASK: Fix wizard.ts — slot click timing in Step 3
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST

1. `bookit-booking-system/tests/e2e/fixtures/wizard.ts` — current state
2. `bookit-booking-system/public/assets/js/booking-wizard-v2.js` — slot click handler in initStep3()

---

## ROOT CAUSE

The Step 4 template shows "Please complete the previous steps first" because
`session['date']` and `session['time']` are missing when Step 4 renders.

Here is the exact slot click flow from `booking-wizard-v2.js`:

```javascript
// Slot click handler:
postToSession({ current_step: 3, date: dateVal, time: slot.dataset.time })
  .then(function() {
    cont.removeAttribute('disabled');  // Continue enabled AFTER fetch resolves
  });
```

And the Continue click handler (`advanceStep`):
```javascript
function advanceStep(step) {
  postToSession({ current_step: step + 1 }).then(function() {
    window.location.href = base;  // navigate to Step 4
  });
}
```

**The problem:** The fixture clicks the slot, then immediately checks if
`#bookit-v2-continue` is not disabled, then clicks it. But there are
TWO async operations happening:

1. Slot click → `postToSession(date + time)` → on resolve: removes `disabled`
2. Continue click → `postToSession(current_step: 4)` → on resolve: navigates

The `postToSession(current_step: 4)` in step 2 only sends `current_step`.
It does NOT resend `date` or `time`. So the session only has `date` and `time`
if step 1's POST completed before step 2's POST fires.

The fixture's `waitForFunction(() => !btn.disabled)` correctly waits for the
slot POST to complete (because disabled is only removed in the `.then()`).
However, there is a subtle race: the Continue button becoming `not disabled`
means the slot POST is done, but the session write on the server may not have
fully committed before the next POST arrives.

**The actual fix:** After clicking the slot and confirming `#bookit-v2-continue`
is enabled, add a small wait (500ms) before clicking Continue to ensure the
session write from the slot POST has committed server-side before the
`current_step: 4` POST fires.

---

## CHANGE REQUIRED

In `fixtures/wizard.ts`, find the Step 3 slot selection and Continue click
section. It currently looks like:

```typescript
await page.locator('.bookit-v2-slot--available').first().click();
slotPicked = true;
break;
// ... later:
await page.waitForFunction(() => {
  const btn = document.querySelector('#bookit-v2-continue');
  return btn !== null && !btn.disabled;
});
await page.locator('#bookit-v2-continue').click();
```

Change it to add a 500ms wait after the Continue button becomes enabled,
before clicking it:

```typescript
await page.locator('.bookit-v2-slot--available').first().click();
slotPicked = true;
break;
// ... later:
await page.waitForFunction(() => {
  const btn = document.querySelector('#bookit-v2-continue');
  return btn !== null && !btn.disabled;
});
// Wait for the slot's postToSession to fully commit server-side
// before the advanceStep POST fires — prevents missing date/time in session
await page.waitForTimeout(500);
await page.locator('#bookit-v2-continue').click();
```

**Only change this one section.** Do not rewrite the rest of the fixture.

---

## VERIFY

Run headed:
```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

The browser should now:
1. Select service ✓
2. Select staff → page reloads automatically ✓
3. Select date → slots appear ✓
4. Select slot → Continue becomes enabled ✓
5. (500ms pause)
6. Click Continue → **Step 4 contact form appears** ← this is what was failing
7. Fill form → submit → Step 5

If Step 4 still shows "Please complete the previous steps first", increase
the wait from 500ms to 1000ms and try again.

---

## ACCEPTANCE CRITERIA

- [ ] Headed run reaches Step 4 contact form (not the error message)
- [ ] `npm run test:full tests/full/booking-poa.spec.ts` passes