# TASK: Fix booking reference regex in test assertions
# Sprint: Playwright Sprint | Plugin root: bookit-booking-system/

---

## READ FIRST

1. `bookit-booking-system/includes/utils/class-bookit-reference-generator.php` — actual format
2. `bookit-booking-system/tests/e2e/tests/full/booking-poa.spec.ts`
3. `bookit-booking-system/tests/e2e/tests/email/confirmation.spec.ts`
4. `bookit-booking-system/tests/e2e/tests/email/cancellation.spec.ts`
5. `bookit-booking-system/tests/e2e/tests/email/reschedule.spec.ts`
6. `bookit-booking-system/tests/e2e/tests/full/magic-link.spec.ts`
7. `bookit-booking-system/tests/e2e/tests/full/booking-stripe.spec.ts`

---

## PROBLEM

The test assertions use `/BK-/` to match the booking reference on the
confirmation page and in emails. This never matches because the actual
booking reference format from `Bookit_Reference_Generator::generate()` is:

```
BK2504-A3F2
```

That is: `BK` + 4-digit YYMM date + hyphen + 4-char uppercase hash.
There is NO hyphen after `BK`. The pattern is `BK\d{4}-[A-Z0-9]{4}`.

---

## FIX

In every file that asserts `/BK-/` or `'BK-'`, replace with `/BK\d{4}-/`
which matches the actual format.

Also update the fallback format in `booking-confirmed-v2.php` — the
template has this fallback:
```php
'BK-' . str_pad( (string) $booking['id'], 8, '0', STR_PAD_LEFT );
```
This fallback produces `BK-00000042` which DOES contain `BK-`. So the
regex needs to match BOTH formats:
- Primary: `BK2504-A3F2` (from reference generator)
- Fallback: `BK-00000042` (when booking_reference column is empty)

Use this regex everywhere: `/BK[\d-]/`
This matches:
- `BK2504-` (primary format — digit after BK)
- `BK-` (fallback format — hyphen after BK)

---

## CHANGES REQUIRED

Search all `.spec.ts` files and `fixtures/` for `/BK-/` or `'BK-'` or
`expect(.*).toMatch(/BK-/)` or `toContainText(/BK-/)` and replace the
pattern with `/BK[\d-]/`.

Specific locations to check and fix:

**`tests/full/booking-poa.spec.ts`:**
```typescript
// Before:
await expect(page.locator('body')).toContainText(/BK-/);
// After:
await expect(page.locator('body')).toContainText(/BK[\d-]/);
```

**`tests/email/confirmation.spec.ts`:**
```typescript
// Before:
expect(email.HTML).toMatch(/BK-/);
// After:
expect(email.HTML).toMatch(/BK[\d-]/);
```

**`tests/full/booking-stripe.spec.ts`:**
```typescript
// Before:
await expect(page.locator('body')).toContainText(/BK-/);
// After:
await expect(page.locator('body')).toContainText(/BK[\d-]/);
```

Check all other spec files for any remaining `BK-` assertions and apply
the same fix.

---

## VERIFY

Run headed to confirm the booking reference is visible and matched:
```powershell
npx cross-env MODE=full npx playwright test tests/full/booking-poa.spec.ts --headed
```

The confirmation page should show something like `BK2504-A3F2` and the
assertion should now pass.

---

## ACCEPTANCE CRITERIA

- [ ] `booking-poa.spec.ts` passes fully end-to-end
- [ ] No remaining `/BK-/` assertions in any spec file
- [ ] All replaced with `/BK[\d-]/`