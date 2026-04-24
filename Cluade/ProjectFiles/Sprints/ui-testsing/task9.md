# TASK: Add session state verification to booking-poa.spec.ts to diagnose slot_unavailable
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `bookit-booking-system/tests/e2e/tests/full/booking-poa.spec.ts`
   — read the full current content before making any changes

2. `bookit-booking-system/tests/e2e/fixtures/wizard.ts`
   — understand how Steps 1-4 complete and what session POSTs happen

3. `bookit-booking-system/includes/api/class-wizard-api.php`
   — read the `get_session()` method to confirm the GET /wizard/session
   endpoint returns `{ success: true, data: { date, time, payment_method, ... } }`

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When `booking-poa.spec.ts` is run twice in a row (no parallel runs),
the second run occasionally gets `slot_unavailable` from `wizard/complete`.

The plugin code is correct — `get_available_slots()` excludes
`pending_payment` bookings from the UI, so the slot picker should
never show a booked slot. But the `slot_unavailable` error proves
`wizard/complete` is trying to book a slot that IS already taken.

The hypothesis: the session cookie rotation that happens on every
`POST /wizard/session` call (in Steps 1-4) means that by the time
`wizard/complete` fires, the session may contain a **stale date or
time** from a previous test run rather than what was just selected.

The diagnostic: immediately before clicking the CTA in Step 5, make a
`GET /wizard/session` call and log what `date` and `time` are in the
session. This will confirm whether the session has the correct values
or stale ones from a previous run.

---

## IMPLEMENTATION REQUIREMENTS

### `tests/e2e/tests/full/booking-poa.spec.ts` — MODIFY

After `await page.locator('#bookit-v2-pay-person').click();` and
BEFORE setting up the `page.route()` intercept for `wizard/complete`,
add a session GET check:

```typescript
// --- DIAGNOSTIC: verify session contains correct date/time ---
// If slot_unavailable occurs, this log will show whether the session
// has the slot that was just selected, or a stale slot from a prior run.
const baseUrl = process.env.BASE_URL || 'http://plugin-test-1.local';
const nonce = await page.evaluate(() => {
  return (window as any).bookitWizardV2?.nonce || '';
});
const sessionCheck = await page.request.get(
  `${baseUrl}/wp-json/bookit/v1/wizard/session`,
  { headers: { 'X-WP-Nonce': nonce } }
).catch(() => null);

if (sessionCheck) {
  const sessionData = await sessionCheck.json().catch(() => null);
  console.log('[SESSION CHECK before complete]', JSON.stringify({
    date: sessionData?.data?.date,
    time: sessionData?.data?.time,
    payment_method: sessionData?.data?.payment_method,
    customer_email: sessionData?.data?.customer_email,
    current_step: sessionData?.data?.current_step,
  }));
} else {
  console.log('[SESSION CHECK] failed to fetch session');
}
// --- END DIAGNOSTIC ---
```

Place this block immediately after:
```typescript
await page.locator('#bookit-v2-pay-person').click();
```

And immediately before:
```typescript
// Intercept wizard/complete at network level BEFORE clicking CTA
let capturedBody: string | null = null;
await page.route('**/wizard/complete', async (route) => {
```

No other changes to the spec file.

---

## WHAT TO LOOK FOR IN THE OUTPUT

When you run the test, look for the `[SESSION CHECK before complete]`
line in the terminal output. It will show one of two things:

**Case A — session is correct:**
```
[SESSION CHECK before complete] {"date":"2026-05-01","time":"09:00:00","payment_method":"person","customer_email":"testcustomer@bookit-e2e.local","current_step":5}
```
If this is a slot that was booked in the previous run → the timeslots
endpoint has a bug and IS showing booked slots.

**Case B — session is stale/empty:**
```
[SESSION CHECK before complete] {"date":null,"time":null,"payment_method":null,"customer_email":null,"current_step":1}
```
Or a date/time from a previous test run → confirms session cookie
rotation is causing the session to lose the selected slot data.

---

## HOW TO RUN

```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

Run the test **twice in a row** without clearing the database between
runs. On the second run, paste the `[SESSION CHECK before complete]`
output back here so we can diagnose the root cause.

---

## ACCEPTANCE CRITERIA

- [ ] `[SESSION CHECK before complete]` line appears in terminal output
- [ ] The log includes `date`, `time`, `payment_method`, `customer_email`,
      `current_step` values
- [ ] No other changes made to any file
- [ ] Test still runs to completion (pass or fail) — the diagnostic
      must not break the test flow

---

## IMPORTANT CONSTRAINTS

- Do NOT change `fixtures/wizard.ts`
- Do NOT change any PHP files
- Do NOT add `waitForTimeout` delays
- Do NOT change the `page.route()` intercept for `wizard/complete`
- This is a **diagnostic change only** — we are reading the session,
  not fixing anything yet

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve, STOP
and report back before writing any code.