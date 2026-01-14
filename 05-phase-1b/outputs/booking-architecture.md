## Solution Architecture — Booking-Only Surface (Phase 1B)

**Role:** Solution Architect
**Scope enforced:** Booking creation & confirmation only
**Explicit exclusions enforced:** rescheduling, cancellation, reminders
**Authority respected:** Security & Compliance (non-overridable)

---

## 1. System Boundaries (Booking-Only)

### 1.1 In-Scope Components

**WordPress (Backend-Only)**

* Acts as:

  * Data store (MySQL)
  * REST API provider
  * Enforcement point for:

    * Auth
    * Authorization
    * GDPR deletion rules
* Contains:

  * Booking domain logic (create → confirm only)
  * Event availability resolution (read-only)
  * Transactional persistence

**API Consumers (Out of Scope Internals)**

* Mobile app
* Web app
* Any headless frontend

> These are **external clients**, never trusted, never stateful.

---

### 1.2 Explicitly Out-of-Scope (Hard Exclusions)

The following **must not exist in code, schema, or API contracts**:

* ❌ Booking rescheduling
* ❌ Booking cancellation
* ❌ Reminder scheduling or delivery
* ❌ Background jobs / cron
* ❌ Admin UI flows
* ❌ Owner-side manual overrides

If discovered → **Architecture violation, Phase 1B gate failure**

---

## 2. Booking Domain — System Boundary Definition

### 2.1 Booking as a Final Event

**Architectural rule (frozen):**

> A booking, once confirmed, is immutable.

This means:

* No state transitions beyond `CONFIRMED`
* No update endpoints
* No delete endpoints (except via GDPR erasure, not booking logic)
* No temporal mutation (time/date fixed)

---

### 2.2 Booking Lifecycle (Only One Path)

```
Availability (read-only)
        ↓
Booking Creation (tentative, atomic)
        ↓
Booking Confirmation (final, irreversible)
```

There are **no alternate paths**.

---

## 3. Booking Flow (Create → Confirm)

### 3.1 Step 1 — Availability Discovery (Read-Only)

**Purpose**

* Allow clients to discover free event slots

**Characteristics**

* Public or authenticated (decision already defined elsewhere)
* No PII
* No reservation
* No locking

**Ownership**

* WordPress backend is authoritative
* Clients treat responses as **advisory only**

---

### 3.2 Step 2 — Booking Creation (Atomic)

**Trigger**

* Client submits booking request for a specific event slot

**System Behaviour**

* Validate:

  * Slot still available
  * Input integrity
  * Consent presence (if required)
* Execute **single DB transaction**:

  * Insert booking row
  * Bind booking to:

    * Event slot
    * Client identity
* No intermediate “pending” state exposed externally

**Failure Handling**

* Any failure → rollback
* API returns error
* No partial booking artifacts allowed

---

### 3.3 Step 3 — Booking Confirmation (Final)

**Definition**

* Confirmation is **the same transaction** as creation
  OR
* A deterministic, immediate follow-up action in the same request

**Architectural Rule**

> There is no externally observable “tentative booking”.

**Result**

* Booking exists
* Slot is consumed
* Booking is final

---

## 4. Data Ownership (Authoritative Sources)

### 4.1 Ownership Matrix

| Data Object        | Authoritative Owner | Notes                            |
| ------------------ | ------------------- | -------------------------------- |
| Event definition   | WordPress backend   | Immutable during booking         |
| Availability state | WordPress backend   | Derived, never cached externally |
| Booking record     | WordPress backend   | Final, immutable                 |
| Client PII         | WordPress backend   | Subject to GDPR erasure          |
| JWT / auth context | Security layer      | Stateless, non-PII               |

**Clients never own data.
Clients never decide state.**

---

### 4.2 Data Mutation Rules

* Only the backend may:

  * Create bookings
  * Consume availability
  * Delete data (GDPR-triggered only)
* Clients:

  * Submit intents
  * Receive outcomes

---

## 5. Trust Boundaries

### 5.1 Boundary Map

```
[ Untrusted Client ]
        |
        |  HTTPS + JWT
        v
[ WordPress REST API ]
        |
        |  Transactional DB access
        v
[ MySQL (Authoritative Store) ]
```

---

### 5.2 Explicit Trust Decisions

**Untrusted**

* All API clients
* All request payloads
* All headers (except validated JWT)

**Trusted (Conditionally)**

* WordPress execution environment
* Database integrity (InnoDB enforced)

**Never Trusted**

* Client-side availability assumptions
* Client-side booking state
* Client retries (must be idempotent or rejected)

---

## 6. Explicit Exclusions (Reconfirmed)

To prevent Phase 2 leakage, the following **must not appear**:

* Booking status enums beyond `CONFIRMED`
* Timestamps like `rescheduled_at`, `cancelled_at`
* Reminder tables
* “Soft delete” flags
* Future booking mutations

If present → **Architecture breach**

---

## 7. Risks (Architecture-Level)

### 7.1 Slot Contention

* Two clients attempt same slot concurrently
* Mitigation:

  * DB-level uniqueness / locking
  * Transactional enforcement

(Implementation detail — acknowledged, not solved here)

---

### 7.2 Assumption: Immediate Confirmation

* No payment step included in Phase 1B
* Booking confirmation is immediate

⚠️ If payments are introduced later → **new phase required**

---

## 8. Explicit Assumptions (Flagged)

* Booking does not require asynchronous confirmation
* Availability is event-based, not free-form time ranges
* One booking consumes exactly one slot
* No partial success model is allowed

If any assumption is false → **Product / Architecture escalation required**

---

## 9. Exit Criteria — Architecture Gate (Phase 1B)

✔ Booking treated as **final, immutable event**
✔ No reschedule, cancel, or reminder concepts present
✔ Clear backend ownership of all booking state
✔ Clients are fully untrusted
✔ System boundaries explicit and enforced
✔ No Phase 2 concepts leaked

---

### **Solution Architect Position**

The booking surface is **minimal, final, and defensible**.

It creates a **hard architectural floor** for future phases without contaminating Phase 1B with reversible or time-based complexity.

Phase 1B booking architecture is **approved and stable**.
