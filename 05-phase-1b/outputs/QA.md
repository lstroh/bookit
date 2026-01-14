# QA & Risk Analysis — Phase 1B (Booking-Only Surface)

**Role:** QA & Risk Analyst
**Scope:** Booking creation & confirmation only
**Authority:** Non-decision-making; challenge, test, and flag
**Mindset:** Adversarial, failure-driven, real-world hosting assumptions

---

## 1. High-Risk Failure Scenarios (Must Be Tested)

### 1.1 Concurrency & Race Conditions

**Scenario:**
Two or more clients attempt to book the same `event_slot_id` concurrently.

**Risks:**

* Double booking if DB constraints are misapplied
* Silent overwrite if transaction isolation is incorrect
* Incorrect 201 returned to both clients under load

**Required Test Scenarios:**

* Parallel POST requests (≥10) for the same slot
* Mixed success/failure ordering
* Verify:

  * Exactly **one** booking row exists
  * All other requests return **409 SLOT_ALREADY_BOOKED**
  * No orphaned PII rows exist after rollback

**Assumption Flagged:**
InnoDB + unique constraints are correctly enforced in all hosting environments.

---

### 1.2 Idempotency Misuse & Abuse

**Scenario:**
Client retries due to network loss, app crash, or timeout.

**Risks:**

* Duplicate bookings if idempotency storage fails
* Incorrect conflicts if payload hash comparison is inconsistent
* Memory/DB exhaustion via idempotency-key flooding

**Required Test Scenarios:**

* Same `Idempotency-Key`, same payload → repeat 201 with identical body
* Same `Idempotency-Key`, different payload → 409 IDEMPOTENCY_CONFLICT
* Missing `Idempotency-Key` → 400 INVALID_REQUEST
* High volume of unique idempotency keys from same JWT

**Risk Flagged:**
Idempotency persistence mechanism is **not specified** (acceptable but risky).

---

### 1.3 Partial Transaction Failure (PII vs Booking)

**Scenario:**
Failure occurs between:

* Inserting PII row
* Inserting booking row

**Risks:**

* Orphaned PII rows (GDPR breach)
* Inconsistent booking state
* False availability signals

**Required Test Scenarios:**

* Forced DB error after PII insert
* Forced unique constraint violation on booking insert
* Verify:

  * Full rollback
  * No residual PII rows
  * Slot remains available

**Compliance Risk:**
Residual PII = **GDPR violation**

---

## 2. Input & Client Error Edge Cases

### 2.1 Malformed or Malicious Payloads

**Scenarios:**

* Extra unexpected JSON keys
* Oversized `notes` field
* Invalid UTF-8 / emoji spam
* SQL-like payloads in free text

**Expected Behaviour:**

* Reject unknown fields (400)
* Enforce strict length caps
* Sanitisation without mutation of meaning
* No data truncation without error

**Risk Flagged:**
Silent truncation would violate user expectation and auditability.

---

### 2.2 Consent Integrity Failures

**Scenarios:**

* Missing consent block
* `accepted_at` in the future
* Consent version not recognised
* Consent timestamp mismatches server time significantly

**Expected Behaviour:**

* 422 VALIDATION_FAILED
* No booking or PII persistence

**Assumption Flagged:**
Valid consent versions are defined elsewhere and centrally enforced.

---

## 3. Authentication & Authorization Abuse Scenarios

### 3.1 JWT Boundary Attacks

**Scenarios:**

* Valid JWT, altered payload attempting to book for another user
* JWT replay from another device
* Expired JWT during retry

**Expected Behaviour:**

* Client identity derived **only** from JWT `sub`
* Payload client info treated as descriptive only
* Expired JWT → 401, even with valid idempotency key

**Risk Flagged:**
Clock skew between JWT issuer and server may cause false expiry.

---

### 3.2 Booking UUID Enumeration

**Scenarios:**

* Guessing booking UUIDs
* Accessing booking via UUID without ownership

**Expected Behaviour:**

* 403 or 404 indistinguishable responses
* No leakage of existence signals

**Test Requirement:**

* UUID-only access must never succeed

---

## 4. Availability Surface Risks

### 4.1 Stale Availability Assumptions

**Scenario:**
Client treats availability as authoritative.

**Risks:**

* User confusion when booking fails
* Increased retry storms

**QA Position:**

* This is **expected**
* Must be documented and observable via 409 responses

**Test Scenarios:**

* Book slot immediately after availability fetch
* Ensure correct conflict handling

---

### 4.2 Slot Identity Integrity

**Scenario:**
`event_slot_id` reused, regenerated, or mutated upstream.

**Risks:**

* Double booking despite DB constraints
* Booking tied to incorrect time window

**Escalation Trigger:**
If slot IDs are not immutable → **Architecture breach**

---

## 5. GDPR & Data Protection Edge Cases

### 5.1 Erasure While Booking Exists

**Scenario:**
User requests GDPR erasure after booking creation.

**Risks:**

* Booking row deleted incorrectly
* PII partially erased
* Referential integrity break

**Required Test Scenarios:**

* Erasure removes PII row only
* Booking row persists
* `pii_snapshot_id` safely nullified or replaced
* Booking remains inaccessible to user (depending on policy)

**Compliance Risk:**
Deleting booking row = **audit & accounting breach**

---

### 5.2 Free-Text Notes as PII Vector

**Scenario:**
User enters sensitive data in notes.

**Risks:**

* Over-retention
* Missed erasure
* Unexpected compliance scope expansion

**QA Position:**

* Treat notes as **always PII**
* Must be fully erased on request

---

## 6. Hosting & Operational Risk Assumptions

### 6.1 Shared Hosting Limitations

**Scenarios:**

* Transient eviction
* No persistent object cache
* MySQL slow queries under load

**Risks:**

* Rate limiting degradation
* Idempotency failures
* Increased race condition exposure

**QA Position:**

* Acceptable for Phase 1B
* Must be observable via logs/metrics (outside scope)

---

### 6.2 Timezone & Clock Drift

**Scenario:**
Server clock skew affects:

* `confirmed_at`
* `consent_at` validation

**Risks:**

* False validation failures
* Inconsistent audit trail

**Assumption Flagged:**
Server time is UTC and reasonably accurate.

---

## 7. Negative Scope Enforcement Tests (Critical)

### 7.1 Forbidden Capabilities Verification

**Must Explicitly Test Absence Of:**

* Any `status` field
* Any update endpoint
* Any delete endpoint
* Any admin override logic
* Any cron/background job

**Test Method:**

* Route enumeration
* Schema inspection
* Static code scan

**Failure = Phase 1B Gate Failure**

---

## 8. Explicit Assumptions (QA-Tracked)

* Slot IDs are immutable and globally unique per site
* JWT issuer is reliable and secure
* Consent versions are centrally managed
* No payment or async confirmation exists
* Booking volume remains within stated bounds

➡️ If any assumption breaks → **Escalation required**

---

## 9. QA Exit Criteria — Phase 1B

✔ No double booking possible under concurrency
✔ No partial data persistence on failure
✔ All client retries are safe or rejected deterministically
✔ No mutable booking state detectable
✔ GDPR erasure removes all PII reliably
✔ Forbidden features demonstrably absent
✔ Failure modes produce correct HTTP + error codes

---

### **QA & Risk Analyst Position**

The design is **defensible but unforgiving**.

It will fail **loudly and correctly** if:

* DB guarantees are broken
* Idempotency is mis-implemented
* Slot identity is unstable

This is acceptable and aligned with Phase 1B — **provided all above risks are tested explicitly before gate approval**.
