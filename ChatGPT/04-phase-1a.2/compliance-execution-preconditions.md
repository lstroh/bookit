## Compliance Implementation Output — Phase 1A

**Role:** Compliance Implementation Expert
**Scope:** GDPR-critical data handling, deletion guarantees, execution safety
**Authority:** Compliance (non-overridable)
**Applies to:** Phases 1–3
**Status:** Implementation-ready, binding

---

# 1. GDPR-Critical Data Classes (Explicit)

### 1.1 Notification Logs (Audit-Only)

**Purpose (sole):**

* Delivery verification
* Security troubleshooting
* Compliance accountability

**Permitted fields (hard-limited):**

* `event_type` (enum)
* `timestamp`
* `provider_message_id`
* `delivery_status`

**Explicitly forbidden:**

* Message content
* Email address / phone
* Client ID
* Booking ID
* Any indirect identifier

**Data classification:**

* **Non-PII by construction**
* Falls outside erasure scope **only if** constraints above are enforced

---

### 1.2 Reminder Execution Records (Operational, Time-Bounded PII)

**Purpose:**

* Determine whether a reminder should be sent

**Permitted fields:**

* `booking_id` (runtime reference only)
* `consent_granted_at`
* `consent_revoked_at` (nullable)

**Explicitly forbidden:**

* Contact details
* Client identifiers
* Analytics flags

**Lifecycle:**

* Exists **only while booking exists**
* Deleted immediately upon:

  * Booking deletion
  * Client erasure
  * Consent withdrawal

**Data classification:**

* **Time-bounded personal data**
* Subject to Art. 17 erasure

---

### 1.3 Time-Bounded PII (Core Identity Data)

Includes:

* Client name
* Email
* Phone

**Purpose:**

* Booking fulfilment
* Dispute resolution

**Rules:**

* Stored only in authoritative client/booking tables
* No duplication into logs, tokens, or caches
* No denormalised copies

**Lifecycle:**

* Deleted on client erasure
* Cascades to all dependent tables

---

# 2. Deletion Execution Guarantees (Hard Requirements)

## 2.1 Deletion Model — Deterministic, Inline, DB-Authoritative

**Trigger sources:**

* API-initiated client erasure
* API-initiated booking deletion
* Consent withdrawal

**Execution guarantees:**

* Deletion occurs **synchronously within the request lifecycle**
* No deferred background tasks
* No eventual consistency

**Rules:**

* API response MUST NOT return success until:

  * All targeted rows are deleted, or
  * Transaction is rolled back

---

## 2.2 Cascading Deletion Enforcement

**Mechanism (non-inventive):**

* Database-level referential integrity **or**
* Explicit deletion ordering within a DB transaction

**Mandatory cascade targets:**

* Reminder execution records
* Consent runtime records
* Refresh tokens
* Active sessions
* Any table containing client-linked data

**Fail behaviour:**

* Any cascade failure → hard error → no partial deletion

---

# 3. ≤90-Day Deletion Proof (Without Cron, Without Humans)

## 3.1 Retention Enforcement Model

**Retention applies to:**

* Notification logs
* Anonymised audit consent records (if time-limited)

**Hard rule:**

> Retention enforcement MUST be **request-driven**, not time-driven.

---

## 3.2 Deterministic Cleanup Strategy (Allowed)

**Execution points (any authenticated request):**

* Before request completes:

  * Execute bounded cleanup query:

    * `DELETE FROM logs WHERE expires_at < NOW() LIMIT N`

**Properties:**

* No cron dependency
* No background scheduler
* Guaranteed progress under normal system use
* Upper-bounded execution time

**Proof of ≤90 days:**

* `expires_at` is computed at insert time
* Any request after day 90 enforces deletion
* System cannot return data past retention window

---

## 3.3 Explicitly Forbidden Models (Rejected)

❌ WP Cron–based cleanup
❌ “Best-effort” background jobs
❌ Manual admin scripts
❌ Hosting-dependent scheduled tasks
❌ Lazy deletion on read (“if accessed, then delete”)

**Compliance position:**
All above models are **probabilistic** and violate Art. 5(1)(e).

---

# 4. Responsibility Boundaries (Enforced)

## 4.1 Plugin (This System)

**Responsible for:**

* Data lifecycle enforcement
* Deletion execution
* Retention limits
* Cascade integrity

**Must not delegate to:**

* Site owner
* Hosting provider
* WP Admin workflows

---

## 4.2 Site Owner (Controller)

**May request:**

* Client erasure (via API)
* Data export (future phase)

**Not responsible for:**

* Executing deletion logic
* Scheduling cleanup
* Verifying retention

---

## 4.3 Infrastructure (Hosting)

**Assumed only:**

* Persistent DB
* HTTPS transport

**No compliance dependency** on:

* Cron reliability
* Uptime guarantees beyond normal operation

---

# 5. Unsafe Execution Models — Formal Rejection

The following are **explicitly non-compliant** and must not be implemented:

* “Deletion happens when cron runs”
* “Deletion happens nightly”
* “Admin must trigger cleanup”
* “Logs are cleaned when table grows”
* “Best effort within X days”

**Rationale:**

* Violates deletion certainty
* Violates storage limitation principle
* Fails audit defensibility

---

# 6. Assumptions (Explicit)

* All erasure and deletion actions are API-driven
* Database supports transactions
* Request traffic occurs at least occasionally (normal operation)

If any assumption is false → **Compliance escalation required**

---

# 7. Residual Risks (Accepted / Monitored)

* **Low-traffic sites:** cleanup triggered less frequently
  → Mitigated by deletion on *any* request, including public endpoints

* **DB contention:** cleanup queries must be bounded
  → Limit rows per execution

No unresolved high-risk compliance gaps remain.

---

# 8. Exit Criteria — Compliance Implementation

✔ GDPR-critical data classes explicitly defined
✔ PII scope strictly minimised
✔ Deletion is synchronous and deterministic
✔ ≤90-day retention enforced without cron
✔ No human or admin dependency
✔ Unsafe models formally rejected

**Compliance Position:**
Deletion guarantees are **provable, enforceable, and audit-defensible**.
Phase 1A is **unblocked** from a GDPR implementation standpoint.
