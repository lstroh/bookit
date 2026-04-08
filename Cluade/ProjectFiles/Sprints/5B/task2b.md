No questions — Option B is clean and the booking data is already in the wizard session when the customer hits the CTA, so it can all go into Stripe metadata. One thing I want to confirm from the code before writing the prompt:I have exactly what I need. Key finding from the code:

- **V2 wizard** (`booking-wizard-v2-step-5.php`): buy package radio value is `buy_{id}` (e.g. `buy_3`), not `buy_package_3`
- **V1 wizard** (`booking-step-5-payment.php`): buy package sets `payment_method` to `'stripe'` and stores the package ID separately in `bookit_selected_package_id` — a completely different flow
- The V2 CTA text is already "Buy package & confirm" — the UX intent for Option B (buy and book in one step) is already designed in, we just need to wire it

No further questions needed. Here is the updated Part B prompt for Option B:

---

## 5B-2 — Cursor Prompt: Part B — Package Purchase + Immediate Booking (Option B)

```
TASK 2 OF 3: Package Purchase Stripe Routing — Buy & Book in One Step
Sprint: 5B | Est: 6h | Plugin root: bookit-booking-system/

---

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. includes/api/class-wizard-api.php
   — Read complete_booking() in full. Find the existing normalisation
   for use_package_{id} and card→stripe. You will add detection for
   the buy_{id} format (V2 buy package radio value) immediately after.

2. public/templates/booking-wizard-v2-step-5.php
   — Confirm the radio value format for buy package selection.
   It is buy_{package_type_id} (e.g. value="buy_3"). This is what
   gets stored in the session as payment_method.

3. includes/payment/class-stripe-checkout.php
   — Read create_checkout_session() in full. Understand how V2
   metadata is built and how the Stripe client is initialised.
   You will add a new method alongside this one.

4. includes/api/class-stripe-webhook.php
   — Read handle_checkout_completed() in full. Understand the full
   flow: metadata extraction, customer upsert, booking creation via
   Booking_System_Booking_Creator, payment record insert, audit log,
   idempotency transient. Your new handler replicates and extends
   this pattern.

5. includes/booking/class-booking-creator.php
   — Read create_booking() method signature and required fields.
   The webhook will call this directly to create the booking after
   package purchase.

6. includes/api/class-customer-packages-api.php
   — Read create_customer_package() to understand how a
   wp_bookings_customer_packages row is built — specifically how
   sessions_total, sessions_remaining, purchase_price, expires_at,
   payment_method, and payment_reference are set.

7. database/migrations/0006-create-customer-packages-table.php
   — Read full schema for wp_bookings_customer_packages. Confirm
   all columns and types before writing any INSERT.

8. includes/config/error-codes.php
   — Read existing registrations to follow the pattern precisely.

9. tests/unit/test-stripe-v2-wiring.php
   — Read existing test setup, mock patterns, and teardown before
   adding new tests.

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

When a customer selects "Buy a Package" in V2 wizard Step 5, the
radio stores payment_method as "buy_{package_type_id}" in the
session. This task wires that to a Stripe Checkout Session. When
the customer returns after payment, the webhook:
  1. Creates a wp_bookings_customer_packages row (the package)
  2. Immediately redeems one session to create the booking for
     today's appointment (the "buy and book" in one step)
  3. Links the booking to the package via customer_package_id
  4. Redirects to /booking-confirmed-v2/ with the booking_id

The PHP session MUST NOT be relied on in the webhook handler —
it will have expired by the time Stripe fires. All booking data
(service_id, staff_id, booking_date, booking_time, customer
details) must be stored in Stripe metadata at checkout creation
time and reconstructed in the webhook.

---

## IMPLEMENTATION REQUIREMENTS

### includes/api/class-wizard-api.php — MODIFY

In complete_booking(), after the existing use_package normalisation
and card→stripe normalisation, add:

- Detect buy_{id} format: preg_match('/^buy_(\d+)$/', $payment_method, $m)
- Extract package_type_id = (int) $m[1]
- Look up the package type from wp_bookings_package_types:
  SELECT id, name, sessions_count, price_mode, fixed_price,
  discount_percentage, expiry_enabled, expiry_days, is_active
  WHERE id = %d AND is_active = 1
  If not found or inactive: return Bookit_Error_Registry::to_wp_error('E5001')
- Calculate charge amount:
  - price_mode = 'fixed': $charge = (float) $package_type['fixed_price']
  - price_mode = 'discount': read $service_price from session_data.
    The session stores the service price — check what key it uses
    by reading the session data structure in class-wizard-api.php.
    $charge = $service_price * (1 - $discount_percentage / 100)
    Round to 2 decimal places.
  - If $charge <= 0: return PACKAGE_PRICE_INVALID error (HTTP 422)
    Register this code in error-codes.php if not present.
- Call $stripe_checkout->create_package_checkout_session() passing:
  - $package_type (full row array)
  - $charge_amount
  - $session_data (full wizard session — contains all booking
    fields and customer details for metadata)
- On Stripe\Exception\ApiErrorException: map to E3010, HTTP 500
- On success: return WP_REST_Response({
    success: true,
    redirect_url: $session->url
  }, 200)

### includes/payment/class-stripe-checkout.php — MODIFY

Add new public method create_package_checkout_session(
  array $package_type,
  float $charge_amount,
  array $session_data
): \Stripe\Checkout\Session

- Initialise Stripe client via Bookit_Stripe_Config (same pattern
  as create_checkout_session())
- Build metadata array — this must include ALL fields needed to
  reconstruct the booking AND the package in the webhook:
  flow_type: 'package'
  package_type_id: (string) $package_type['id']
  package_name: $package_type['name']
  sessions_total: (string) $package_type['sessions_count']
  expiry_enabled: (string) $package_type['expiry_enabled']
  expiry_days: (string) ($package_type['expiry_days'] ?? '')
  — Booking fields (from $session_data — read the session keys
    used in create_checkout_session() for the booking flow and
    use the same keys):
  service_id, staff_id, booking_date, booking_time
  customer_email, customer_first_name, customer_last_name,
  customer_phone, special_requests, cooling_off_waiver
- line_items: one item
  product name: $package_type['name']
  unit_amount: (int) round($charge_amount * 100)  [pence]
  currency: 'gbp'
  quantity: 1
- mode: 'payment'
- customer_email: from $session_data
- success_url: trailingslashit(
    get_option('bookit_confirmed_v2_url', home_url('/booking-confirmed-v2/'))
  ) . '?booking_id={CHECKOUT_SESSION_ID}'
  NOTE: The confirmation page will receive booking_id via a
  query param — but at webhook time we do not yet have the
  booking_id. Use a special marker: instead of booking_id,
  pass session_id and let the confirmation page look up by
  stripe_session_id just as it does for regular Stripe bookings.
  CORRECTION: Use:
  success_url = trailingslashit(v2_base) . '?session_id={CHECKOUT_SESSION_ID}'
  This is consistent with the regular Stripe booking flow —
  the confirmation page already handles session_id lookup via
  get_booking_by_stripe_session().
- cancel_url: home_url('/book-v2/')
- Return the Stripe Session object directly (do not catch
  exceptions here — let the caller handle them)

Note: Before implementing any Stripe SDK calls, use Context7 to
resolve 'Stripe PHP' and confirm the current checkout session
creation API for SDK v13.

### includes/api/class-stripe-webhook.php — MODIFY

In the main event dispatch switch/handle method:
- After extracting metadata with ->toArray() (already fixed in
  Part A), check flow_type value.
- If flow_type === 'package': call handle_package_purchase_completed($event)
- If flow_type === 'booking' or flow_type absent: existing
  handle_checkout_completed($event) — UNCHANGED.

New private method handle_package_purchase_completed($event):

Step 1 — Guard checks:
- $session = $event->data->object
- If $session->payment_status !== 'paid': return true (skip)
- Idempotency: $key = 'stripe_pkg_' . $session->id
  If get_transient($key) exists: return true (already processed)

Step 2 — Extract and validate metadata:
- $metadata = $session->metadata->toArray()
- Required fields: package_type_id, sessions_total, customer_email,
  customer_first_name, customer_last_name, service_id, staff_id,
  booking_date, booking_time
- If any missing: return WP_Error('missing_package_metadata', ...)

Step 3 — Wrap everything in a DB transaction:
- $wpdb->query('START TRANSACTION')
- On any WP_Error or exception: $wpdb->query('ROLLBACK'), return error

Step 4 — Find or create customer (same pattern as handle_checkout_completed):
- Look up by customer_email in wp_bookings_customers
- If not found: INSERT new customer row
- $customer_id = result

Step 5 — Create wp_bookings_customer_packages row:
- sessions_total = (int) $metadata['sessions_total']
- sessions_remaining = sessions_total (full on purchase — will
  decrement by 1 in Step 6)
- purchase_price = $session->amount_total / 100 (pounds)
- purchased_at = current_time('mysql')
- expires_at: if expiry_enabled == '1' && expiry_days > 0:
  (new DateTime())->modify('+N days')->format('Y-m-d H:i:s')
  else NULL
- status = 'active'
- payment_method = 'stripe'
- payment_reference = $session->id
- $customer_package_id = $wpdb->insert_id after INSERT

Step 6 — Create the booking (redeem first session):
- Build $booking_data from metadata (same field mapping as
  handle_checkout_completed for service_id, staff_id, etc.)
- Add: customer_package_id = $customer_package_id
- Add: payment_method = 'package_redemption'
- Add: stripe_session_id = $session->id (for confirmation page lookup)
- Call Booking_System_Booking_Creator->create_booking($booking_data)
- If WP_Error: ROLLBACK and return error

Step 7 — Decrement sessions_remaining:
- UPDATE wp_bookings_customer_packages
  SET sessions_remaining = sessions_remaining - 1
  WHERE id = $customer_package_id
  Use SQL expression decrement (not PHP read-modify-write)

Step 8 — Insert redemption record:
- INSERT into wp_bookings_package_redemptions:
  customer_package_id, booking_id, redeemed_at = current_time('mysql'),
  redeemed_by = 0 (customer self-service), notes = 'Redeemed at package purchase via Stripe'

Step 9 — Insert payment record:
- INSERT into wp_bookings_payments:
  booking_id, amount = $session->amount_total / 100,
  payment_method = 'stripe', status = 'completed',
  payment_intent_id = $session->payment_intent ?? ''
  (follow the same pattern as handle_checkout_completed)

Step 10 — Commit and wrap up:
- $wpdb->query('COMMIT')
- Bookit_Audit_Logger::log('package.purchased', 'customer_package',
  $customer_package_id, ['notes' => 'Package purchased and first session redeemed via Stripe'])
- do_action('bookit_after_booking_created', $booking_id, $booking_data)
- set_transient($key, $customer_package_id, 24 * HOUR_IN_SECONDS)
- Return true

### includes/config/error-codes.php — MODIFY

Register if not already present:
- PACKAGE_PRICE_INVALID: 'Package price could not be calculated',
  HTTP 422

---

## INFRASTRUCTURE REQUIREMENTS

- [ ] Error code registered: PACKAGE_PRICE_INVALID (HTTP 422)
- [ ] Audit log fired: 'package.purchased' after successful commit
- [ ] DB transaction wraps Steps 4–9 — ROLLBACK on any failure
- [ ] Idempotency transient: 'stripe_pkg_' . $session->id
      prevents duplicate rows on webhook retry
- [ ] No new migration required — all tables exist

---

## PHPUNIT REQUIREMENTS

Baseline: 865 tests, 0 failures — must not regress.

Add to tests/unit/test-stripe-v2-wiring.php:

- test_complete_booking_buy_package_returns_redirect_url
  Insert a fixed-price package type in the test DB. Set session
  payment_method to 'buy_{id}'. Mock Stripe. Assert HTTP 200
  and redirect_url present in response.

- test_complete_booking_buy_package_not_found_returns_404
  Set payment_method to 'buy_99999' (non-existent ID). Assert
  E5001 / HTTP 404.

- test_complete_booking_buy_package_price_invalid_returns_422
  Insert a fixed-price package type with fixed_price = 0. Assert
  PACKAGE_PRICE_INVALID / HTTP 422.

- test_webhook_package_flow_creates_customer_package_and_booking
  Simulate checkout.session.completed with flow_type = 'package'
  and all required metadata. Assert:
  - One wp_bookings_customer_packages row with status = 'active',
    payment_method = 'stripe', sessions_remaining = sessions_total - 1
  - One wp_bookings row with payment_method = 'package_redemption'
    and stripe_session_id matching the session
  - One wp_bookings_package_redemptions row

- test_webhook_package_flow_idempotency_prevents_duplicate
  Fire the same package webhook event twice. Assert only one
  customer_package row and one booking row exist.

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] V2 wizard buy_{id} payment method creates Stripe Checkout Session
- [ ] Stripe line item shows package name and correct price in pence
- [ ] After payment, confirmation page shows booking details
      (retrieved by stripe_session_id lookup)
- [ ] wp_bookings_customer_packages row created with status = 'active'
- [ ] wp_bookings row created with payment_method = 'package_redemption'
- [ ] sessions_remaining = sessions_total - 1 (first session redeemed)
- [ ] wp_bookings_package_redemptions row created
- [ ] Webhook idempotency prevents duplicate rows on retry
- [ ] DB transaction: if booking creation fails, no orphan
      customer_package row left behind

### Technical
- [ ] flow_type = 'package' routes to new handler
- [ ] flow_type = 'booking' still routes to existing handler unchanged
- [ ] PHP session not relied on in webhook handler
- [ ] sessions_remaining decremented via SQL expression, not PHP
- [ ] No PHP warnings or notices
- [ ] PHPUnit: 865+ tests, 0 failures

### Must NOT break
- [ ] Regular Stripe booking flow (flow_type = 'booking') unchanged
- [ ] use_package (redeem existing package) flow unchanged
- [ ] Pay on Arrival flow unchanged
- [ ] V1 wizard unchanged

---

## GIT COMMIT MESSAGE

Sprint 5B, Task 2 of 3: Package purchase Stripe routing — buy and book in one step

- complete_booking(): buy_{id} case creates package Stripe Checkout Session
- class-stripe-checkout.php: create_package_checkout_session() with
  full booking + package metadata
- class-stripe-webhook.php: flow_type=package routes to
  handle_package_purchase_completed(); DB transaction creates
  customer_package + booking + redemption record atomically
- sessions_remaining decremented via SQL expression
- PACKAGE_PRICE_INVALID error code registered
- 5 new PHPUnit tests

Tests: 870+ passing, 0 failures

---

If you encounter an architecture decision not covered above, or a
conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```