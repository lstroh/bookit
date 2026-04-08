TASK: Fix two bugs in Stripe V2 checkout flow
Sprint: 5B | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-stripe-webhook.php
   — Read handle_checkout_completed() in full. Find where $metadata
   is extracted from $session->metadata and where required_fields
   are checked. This is where the metadata cast bug lives.

2. includes/payment/class-stripe-checkout.php
   — Read build_checkout_params() or wherever success_url is
   constructed for wizard_version === 'v2'. Confirm the exact
   string used for success_url.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

Two bugs were identified from a live Stripe test run:

Bug 1 — Webhook metadata cast failure:
The webhook handler returns HTTP 200 with error "Missing required
metadata field: service_id" even though service_id is present in
the Stripe session metadata. Root cause: $session->metadata is a
Stripe\StripeObject — casting it with (array) is unreliable. The
fix is to use the Stripe SDK's correct method to convert metadata
to a plain PHP array.

Bug 2 — Success URL placeholder not replaced:
The Stripe session success_url was registered as:
https://test.wimbledonsmart.co.uk/booking-confirmed-v2?session_id={CHECKOUT_SESSION_ID}
The {CHECKOUT_SESSION_ID} placeholder was not replaced by Stripe
at redirect time, and the customer was sent to the cancel URL
instead. Root cause: the success_url is missing the trailing slash
before the query string. Stripe requires the base URL to be a
valid page URL. The correct format is:
https://test.wimbledonsmart.co.uk/booking-confirmed-v2/?session_id={CHECKOUT_SESSION_ID}
Note the trailing slash before the ?. Confirm by reading how
home_url() and rtrim() interact in the current success_url
construction.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-stripe-webhook.php — MODIFY

- In handle_checkout_completed(), find the line that extracts
  metadata from the Stripe session object.
- Replace the (array) cast with the correct approach:
  $metadata = $session->metadata->toArray();
  This uses the Stripe SDK's built-in toArray() method on
  StripeObject, which reliably converts all metadata fields to
  a plain PHP associative array.
- Do not change any other logic in this method.
- Do not change the required_fields check — once metadata is
  correctly cast, service_id will be found.

### includes/payment/class-stripe-checkout.php — MODIFY

- Find the success_url construction for wizard_version === 'v2'.
- Ensure the base URL always has a trailing slash before the
  query string. The correct pattern is:
  $v2_base = trailingslashit(
      get_option( 'bookit_confirmed_v2_url', home_url( '/booking-confirmed-v2/' ) )
  );
  $success_url = $v2_base . '?session_id={CHECKOUT_SESSION_ID}';
  Use WordPress's trailingslashit() — do not use rtrim() + manual
  slash concatenation as this can strip the slash incorrectly.
- Do not change the V1 success_url.
- Do not change any other session parameters.

---

## PHPUNIT REQUIREMENTS

Baseline: 864 tests, 0 failures — must not regress.

Add to tests/unit/test-stripe-v2-wiring.php:

- test_webhook_metadata_toArray_finds_service_id
  Simulate a Stripe session object where metadata contains
  service_id. Confirm handle_checkout_completed() does not
  return a missing_metadata WP_Error for service_id.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Webhook receives checkout.session.completed with valid
      metadata and creates a booking row in wp_bookings
- [ ] Booking row has stripe_session_id matching the session ID
- [ ] Customer lands on /booking-confirmed-v2/?session_id=cs_test_...
      (real session ID in URL, not literal placeholder)
- [ ] Confirmation page shows booking details

### Technical
- [ ] $session->metadata->toArray() used in webhook handler
- [ ] success_url uses trailingslashit() for base URL
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (864+ tests, 0 failures)

### Must NOT break
- [ ] V1 wizard Stripe flow unchanged
- [ ] Pay on Arrival flow unchanged
- [ ] Webhook idempotency check still fires before booking creation

---

## GIT COMMIT MESSAGE

Sprint 5B: Fix Stripe webhook metadata cast + V2 success_url trailing slash

- class-stripe-webhook.php: use ->toArray() instead of (array) cast
  on Stripe\StripeObject metadata — fixes "Missing required metadata
  field" false positive
- class-stripe-checkout.php: use trailingslashit() for V2 success_url
  base — fixes {CHECKOUT_SESSION_ID} placeholder not being replaced
- 1 new PHPUnit test in test-stripe-v2-wiring.php

Tests: 865+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.