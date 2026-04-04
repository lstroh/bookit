**5B-1 (Test Mode) — ✅ COMPLETE**

Now for the code task. Let me read the relevant files before generating the Cursor prompt.Now let me read the key files before writing the prompt.No GitHub connector is available in this chat — I'll read the files from the project mount and use Context7 for the Stripe SDK. Let me read the key implementation files now.Good — Stripe SDK patterns confirmed. Now let me read the sprint 4D decisions for package routing context:I now have everything I need. The 5B-2 task is large — I'll split it into three Cursor prompts: Part A (V2 card payment wiring), Part B (package Stripe routing), and Part C (refund state). Let me generate Part A first.

---

## 5B-2 — Cursor Prompt: Part A — V2 Wizard Card Payment Wiring

```
TASK 1 OF 3: V2 Wizard Stripe Card Payment Wiring
Sprint: 5B | Est: 5h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-wizard-api.php
   — Read complete_booking() and the existing route registration.
   The 'stripe' and 'paypal' payment_method cases currently return
   400 payment_method_not_available. This is what you are wiring.

2. includes/payment/class-stripe-checkout.php
   — Read create_checkout_session() in full. Understand the existing
   V1 flow: how the session is built, how wizard_version is handled,
   how success_url is constructed. You are extending this, not replacing it.

3. includes/payment/class-payment-processor.php
   — Read process_pay_on_arrival() and any existing stripe routing.
   Understand what complete_booking() currently delegates to.

4. public/assets/js/booking-wizard-v2.js
   — Read initStep5() and the CTA handler. Confirm the branch that
   handles redirect_url in the fetch() response — it should already
   call window.location.href = data.redirect_url. Do not modify this
   file unless redirect_url handling is confirmed missing.

5. includes/class-bookit-error-registry.php
   — Read existing error codes so you can register any new ones
   following the established pattern.

6. tests/unit/test-wizard-api.php
   — Read existing test structure and mock patterns before writing
   new tests.

7. tests/unit/test-stripe-checkout.php (if it exists)
   — Read for the established Stripe mock pattern. If it does not
   exist, report back before writing any mocks.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

This task wires the 'stripe' payment_method case in complete_booking()
in class-wizard-api.php so that V2 wizard card payments redirect to
Stripe Checkout instead of returning 400. The V2 wizard JS already
handles a redirect_url in the response — the JS does not need to change.
PayPal has no checkout class yet and must return HTTP 501 (not 400)
with a clear not_supported error. Do not implement PayPal. Do not
modify V1 wizard flow.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-wizard-api.php — MODIFY

- In complete_booking(), locate the switch/if block that handles
  payment_method.
- Add a case for payment_method === 'stripe':
  - Retrieve the booking session data needed to build the Stripe
    session (service_id, staff_id, booking_date, booking_time,
    total_price, customer_email — from the wizard session).
  - Call create_checkout_session() on the existing
    Bookit_Stripe_Checkout class, passing wizard_version = 'v2'.
  - On success: return WP_REST_Response with
    { success: true, redirect_url: $session->url }, HTTP 200.
  - On Stripe exception: log the error, return a WP_REST_Response
    with a registered error code (E-code from error registry),
    HTTP 500.
- Add a case for payment_method === 'paypal':
  - Return WP_REST_Response with error code
    PAYMENT_METHOD_NOT_SUPPORTED, HTTP 501.
  - Register this error code in class-bookit-error-registry.php if
    it does not already exist.
- Remove (or replace) the existing 400 payment_method_not_available
  stubs for 'stripe' and 'paypal' only. Do not touch other payment
  method cases.

### includes/payment/class-stripe-checkout.php — MODIFY (if needed)

- Read create_checkout_session() first.
- If wizard_version = 'v2' is already handled and the success_url
  already routes to /booking-confirmed-v2/ with
  ?session_id={CHECKOUT_SESSION_ID}, no change is needed — confirm
  this in your READ FIRST step and report.
- If the V2 success_url is missing, add it:
  success_url must be:
  home_url('/booking-confirmed-v2/') . '?session_id={CHECKOUT_SESSION_ID}'
  Use {CHECKOUT_SESSION_ID} exactly — Stripe replaces this literal
  at redirect time.
- The cancel_url should return the customer to /book-v2/.
- Do not change the V1 flow.
- currency must be 'gbp' (UK business — confirm this matches existing
  sessions).
- The Stripe Checkout Session must include:
  - mode: 'payment'
  - customer_email from wizard session
  - line_items with unit_amount in pence (price * 100, rounded to int)
  - metadata: flow_type = 'booking', wizard_version = 'v2'

Note: Before writing any Stripe SDK calls, use Context7 to resolve
'Stripe PHP' and confirm the current checkout session creation API
for SDK v13.

### includes/class-bookit-error-registry.php — MODIFY

- Register new error code if not present:
  PAYMENT_METHOD_NOT_SUPPORTED: 'Payment method not supported',
  HTTP 501.
- Follow the exact pattern of existing error code registrations in
  this file.

### tests/unit/test-stripe-v2-wiring.php — CREATE

Write tests in this new file. Follow the mock pattern from
test-stripe-checkout.php (or test-wizard-api.php if no Stripe mock
exists yet).

Required test cases:
- test_complete_booking_stripe_returns_redirect_url
  Mock Stripe SDK so create_checkout_session returns a session object
  with a url property. Call the complete_booking endpoint with
  payment_method = 'stripe'. Assert HTTP 200 and that redirect_url
  is present in response body.
- test_complete_booking_paypal_returns_501
  Call complete_booking with payment_method = 'paypal'. Assert HTTP
  501 and PAYMENT_METHOD_NOT_SUPPORTED error code.
- test_complete_booking_stripe_exception_returns_500
  Mock Stripe SDK to throw \Stripe\Exception\ApiErrorException. Assert
  HTTP 500 returned and no booking created.

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Error code registered: PAYMENT_METHOD_NOT_SUPPORTED (HTTP 501)
      in includes/class-bookit-error-registry.php
- [ ] Audit log: no new audit event required for this task
      (payment completion audit fires in the webhook handler, not here)
- [ ] REST endpoint: complete_booking() already registered —
      do not re-register the route

---

## PHPUNIT REQUIREMENTS

Baseline: 861 tests, 0 failures — must not regress.

Write tests in: tests/unit/test-stripe-v2-wiring.php

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] POST bookit/v1/wizard/complete with payment_method = 'stripe'
      returns { success: true, redirect_url: 'https://checkout.stripe.com/...' }
- [ ] POST bookit/v1/wizard/complete with payment_method = 'paypal'
      returns HTTP 501 with PAYMENT_METHOD_NOT_SUPPORTED
- [ ] V2 wizard success_url routes to /booking-confirmed-v2/?session_id=...
- [ ] V1 wizard card payment flow is unchanged

### Technical
- [ ] No PHP warnings or notices
- [ ] Stripe exception caught and returns HTTP 500, not uncaught fatal
- [ ] PHPUnit suite passes (861+ tests, 0 failures)

### Must NOT break
- [ ] Pay on Arrival flow — still completes without Stripe
- [ ] Package use_package flow — still routes correctly
- [ ] V1 wizard — unmodified
- [ ] Existing Brevo email sending

---

## GIT COMMIT MESSAGE

Sprint 5B, Task 1 of 3: Wire Stripe card payment in V2 wizard

- complete_booking() stripe case creates Checkout Session + returns redirect_url
- paypal case returns HTTP 501 PAYMENT_METHOD_NOT_SUPPORTED
- PAYMENT_METHOD_NOT_SUPPORTED error code registered
- V2 success_url routes to /booking-confirmed-v2/?session_id={CHECKOUT_SESSION_ID}
- 3 new PHPUnit tests in test-stripe-v2-wiring.php

Tests: 864+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```

---

Run this in Cursor, paste back the results (including PHPUnit output), and once Part A is confirmed I'll generate Part B (package Stripe routing).