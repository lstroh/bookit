## QA & Risk Analysis — Phase 1 Architecture, DB, API, Security & Compliance

**Role:** QA & Risk Analyst
**Authority:** Identify risks, gaps, contradictions, edge cases
**Outcome:** ❌ *Conditional sign-off* (see blockers)

---

# 1. Identified Contradictions

### 1.1 Consent Table vs API / Compliance Flow

**Observation**

* `bookit_consents` table explicitly forbids `client_id` and `booking_id`
* Compliance flow Step 4 says: “Scrub consent records” after erasure
* API requires consent to be evaluated “at execution time”

**Risk**

* Without linkage, **runtime consent validation for reminders is impossible**
* You cannot determine *which booking* has reminder consent without a join key

**Classification**

* ❗ **Logical contradiction** between:

  * Audit-safe anonymisation
  * Operational consent enforcement

**Escalation Required**

* ➜ **Compliance & Security**

  * Must clarify *how* reminder eligibility is determined without linkage
  * Either:

    * Consent snapshot copied to booking at creation (non-PII boolean), or
    * Consent table temporarily linkable pre-erasure (currently forbidden)

---

### 1.2 Client Deletion: Hard Delete vs `deleted_at`

**Observation**

* Client table states:

  * “Hard delete on erasure”
  * Field `deleted_at` exists and is “Triggers erasure”

**Risk**

* Ambiguity whether:

  * Row is physically deleted, or
  * Row retained with tombstone

**Why This Matters**

* A retained row with `deleted_at` still counts as personal data if `id` exists
* Conflicts with “irreversible deletion” claim

**Escalation Required**

* ➜ **Compliance**

  * Clarify whether `deleted_at` is:

    * Pre-delete marker only, or
    * Final retained state (which would violate stated rule)

---

# 2. Security Gaps

### 2.1 Booking Token Enumeration Risk

**Observation**

* `/bookings/{token}` is publicly accessible
* No documented entropy guarantees, length, or rotation strategy
* No rate limit explicitly declared for token-based endpoints

**Attack Scenario**

* Brute-force token guessing
* Replay access to bookings (even without PII)

**Risk Level**

* 🔴 High (public, unauthenticated surface)

**Escalation Required**

* ➜ **Security**

  * Confirm:

    * Token entropy (bits)
    * Rate limiting on all `/bookings/{token}/*` endpoints
    * Lockout / throttling behavior

---

### 2.2 JWT Revocation Table Undefined

**Observation**

* Security mandates DB-backed denylist
* No table defined in DB schema section

**Risk**

* Implementation ambiguity:

  * Developers may store in ad-hoc tables
  * Or misuse options/transients (forbidden)

**Impact**

* Silent security regression

**Escalation Required**

* ➜ **Solution Architect**

  * Explicitly name and freeze:

    * Revocation table
    * Retention rules
    * Indexing strategy

---

### 2.3 Email Provider Failure Modes Untested

**Observation**

* Notification service is “idempotent”
* No failure scenarios defined:

  * Provider downtime
  * Duplicate sends
  * Delayed cron execution

**Risk**

* Double emails
* Missed confirmations
* Consent violation if retries ignore state

**QA Requirement**

* Test scenarios required for:

  * At-least-once vs exactly-once delivery
  * Reminder sent after erasure edge case

---

# 3. WordPress-Specific Incompatibilities

### 3.1 WP Cron Reliability vs Compliance Timers

**Observation**

* Notification purge ≤ 90 days is compliance-required
* WP cron is explicitly “unreliable”

**Risk**

* Expired notification logs retained indefinitely
* Silent GDPR breach

**Escalation Required**

* ➜ **Project Manager**

  * Must accept:

    * External cron requirement, or
    * Manual purge fallback (currently forbidden)

---

### 3.2 REST API Rate Limiting on Shared Hosting

**Observation**

* Rate limiting is mandatory
* No infrastructure assumed (no Redis, no Nginx rules)

**Risk**

* PHP-level rate limiting on shared hosting is:

  * Slow
  * Race-prone
  * Bypassable under concurrency

**QA Position**

* High likelihood of inconsistent enforcement

**Escalation Required**

* ➜ **Solution Architect**

  * Clarify minimum acceptable guarantees under shared hosting

---

# 4. Scaling Risks

### 4.1 Availability Calculation Under Load

**Observation**

* Availability is public + cacheable
* Booking writes are uncached and contention-heavy

**Failure Scenario**

* Cache shows slot available
* Multiple concurrent POST `/bookings`
* DB locking insufficient → double-book attempt storm

**QA Gap**

* No defined behavior for:

  * Thundering herd
  * Conflict retry limits
  * Client-visible error consistency

**Test Scenarios Required**

* 10–100 concurrent booking attempts on same slot
* Verify:

  * Single success
  * Deterministic 409s
  * No partial writes

---

### 4.2 Notification Volume Growth

**Observation**

* Notifications: 1–3 × bookings
* Auto-expire job depends on cron

**Risk**

* Table grows unbounded if cron fails
* Impacts DB performance over years

---

# 5. Compliance Leak Risks

### 5.1 Owner Booking Endpoints Returning PII

**Observation**

* Owner endpoints may return client PII “if not erased”
* No schema shown for owner booking detail

**Risk**

* Over-exposure:

  * Email + phone returned where not needed
  * Mobile clients caching PII

**QA Requirement**

* Explicit field-level response schemas for owner endpoints
* Default-minimal principle not demonstrated

---

### 5.2 Logs & Error Messages

**Observation**

* “No PII in logs” stated
* No concrete test enforcement described

**Risk**

* Validation errors echo user input (common WP behavior)
* Email / name leaks via error responses

**Test Requirement**

* Fuzz invalid inputs containing PII
* Assert:

  * Logs are clean
  * Error messages generic

---

# 6. Summary of Blockers

| Category                         | Status    | Authority to Resolve |
| -------------------------------- | --------- | -------------------- |
| Consent linkage contradiction    | ❌ Blocker | Compliance           |
| Client deletion semantics        | ❌ Blocker | Compliance           |
| Booking token abuse risk         | ❌ Blocker | Security             |
| JWT revocation storage undefined | ❌ Blocker | Solution Architect   |
| WP cron vs GDPR purge            | ❌ Blocker | Project Manager      |

---

# 7. QA Exit Decision

### ❌ **Sign-off Withheld**

**Reason**

* Multiple **cross-authority contradictions**
* At least **one GDPR enforcement ambiguity**
* One **public security abuse vector** not closed

### Conditions for Sign-off

QA sign-off can be granted once:

1. Compliance clarifies consent & erasure contradictions (binding)
2. Security closes booking-token abuse surface
3. SA freezes JWT revocation persistence
4. PM accepts or mitigates cron compliance risk

---

## QA Final Statement

> The system is **well-structured and disciplined**, but currently fails QA acceptance due to **enforcement ambiguities**, not design intent.
>
> Once the above blockers are resolved by their respective authorities, **no further QA objections are anticipated**.
