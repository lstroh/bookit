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


## Role: WordPress Database Expert

**Scope:** Booking data model only (create → confirm, immutable)
**Phase:** 1B
**Environment:** WordPress + MySQL/MariaDB (InnoDB)
**Multisite:** Required
**Compliance:** UK GDPR / DPA 2018

---

# 1. Storage Strategy Decision

### 1.1 Custom Tables vs `posts/postmeta`

**Decision:** ✅ **Custom tables (mandatory)**

**Rationale (non-negotiable):**

* Atomic transactions required → **not safely achievable with postmeta**
* Hard uniqueness constraints needed → **postmeta cannot enforce**
* High read/write frequency → **postmeta causes performance & locking issues**
* GDPR erasure requires **targeted deletes**, not post graph traversal
* Multisite-safe table prefixing supported

⚠️ Using `wp_posts` would violate:

* Data integrity guarantees
* Performance requirements
* Compliance traceability

---

# 2. Core Booking Tables (Phase 1B Only)

## 2.1 `wp_bookit_bookings`

**Purpose:** Authoritative, immutable booking record

### Columns

| Column            | Type               | Notes                       |
| ----------------- | ------------------ | --------------------------- |
| `id`              | BIGINT UNSIGNED PK | Internal booking ID         |
| `site_id`         | BIGINT UNSIGNED    | `get_current_blog_id()`     |
| `event_id`        | BIGINT UNSIGNED    | FK reference (logical)      |
| `event_slot_id`   | BIGINT UNSIGNED    | Slot granularity (see §2.2) |
| `client_id`       | BIGINT UNSIGNED    | Internal client reference   |
| `booking_uuid`    | CHAR(36)           | Public-safe identifier      |
| `confirmed_at`    | DATETIME (UTC)     | Creation = confirmation     |
| `created_at`      | DATETIME (UTC)     | Same as confirmed_at        |
| `pii_snapshot_id` | BIGINT UNSIGNED    | FK to PII table             |
| `consent_version` | VARCHAR(20)        | Proof of consent            |
| `consent_at`      | DATETIME (UTC)     | Consent timestamp           |

---

### Constraints

```sql
PRIMARY KEY (id)

UNIQUE KEY uniq_site_slot (site_id, event_slot_id)

UNIQUE KEY uniq_booking_uuid (booking_uuid)

KEY idx_event (site_id, event_id)

KEY idx_client (site_id, client_id)
```

### Structural Guarantees

* **Double booking prevention:**
  `UNIQUE (site_id, event_slot_id)`
* **Immutability:**
  No status column
  No update flows
  No soft delete fields

⚠️ Any additional state column = **architecture breach**

---

## 2.2 `wp_bookit_event_slots` (Read-Only Reference)

**Purpose:** Slot identity & locking anchor
**Ownership:** Created elsewhere, immutable here

### Columns (minimal reference)

| Column      | Type               |
| ----------- | ------------------ |
| `id`        | BIGINT UNSIGNED PK |
| `site_id`   | BIGINT UNSIGNED    |
| `event_id`  | BIGINT UNSIGNED    |
| `starts_at` | DATETIME (UTC)     |
| `ends_at`   | DATETIME (UTC)     |

### Constraints

```sql
UNIQUE KEY uniq_site_event_time (site_id, event_id, starts_at)
```

⚠️ **No availability flags here**
Availability is derived:

> slot is available ⇔ no row exists in `wp_bookit_bookings`

---

# 3. PII Storage (GDPR-Isolated)

## 3.1 `wp_bookit_booking_pii`

**Purpose:** Isolate personal data for erasure

### Columns

| Column       | Type               | PII             |
| ------------ | ------------------ | --------------- |
| `id`         | BIGINT UNSIGNED PK | —               |
| `site_id`    | BIGINT UNSIGNED    | —               |
| `email`      | VARCHAR(191)       | ✅               |
| `first_name` | VARCHAR(100)       | ✅               |
| `last_name`  | VARCHAR(100)       | ✅               |
| `phone`      | VARCHAR(50)        | ✅               |
| `notes`      | TEXT               | ⚠️ User-entered |
| `created_at` | DATETIME (UTC)     | —               |

### Indexes

```sql
KEY idx_site_email (site_id, email)
```

---

## 3.2 PII Identification (Explicit)

**PII Fields (GDPR-relevant):**

* email
* first_name
* last_name
* phone
* notes (free-text → assume PII)

**Non-PII:**

* booking_uuid
* event_id / slot_id
* timestamps
* consent metadata

---

# 4. Retention & Erasure Model

## 4.1 GDPR Erasure Strategy

**Rule:** Booking remains, PII is erased

### On Erasure Request

1. Delete row from `wp_bookit_booking_pii`
2. Null or replace `pii_snapshot_id` in bookings
3. Preserve booking record for:

   * Accounting
   * Capacity history
   * Fraud prevention

⚠️ Booking row **must not be deleted via booking logic**

---

## 4.2 Retention-Relevant Fields

| Field             | Reason                       |
| ----------------- | ---------------------------- |
| `confirmed_at`    | Retention window calculation |
| `event_id`        | Operational records          |
| `event_slot_id`   | Capacity audit               |
| `consent_version` | Compliance proof             |
| `consent_at`      | Compliance proof             |

---

# 5. Transaction & Locking Model (DB-Level)

## 5.1 Booking Creation (Single Transaction)

**Required sequence (InnoDB):**

1. `SELECT slot FOR UPDATE` (optional but recommended)
2. Insert into `wp_bookit_booking_pii`
3. Insert into `wp_bookit_bookings`
4. Commit

**Failure modes:**

* Duplicate slot → unique constraint violation
* Any failure → rollback → no artifacts

---

# 6. Data Volume & Growth Estimates (UK SMB)

### Assumptions (Flagged)

* ≤ 10k bookings / year / site
* ≤ 5 slots per event per day

### Impact

* Tables remain small
* Indexes stay hot
* No sharding required

⚠️ If bookings exceed ~1M/site → reindexing strategy required (future phase)

---

# 7. Risks & Flags

### Risk 1: Slot Identity Ambiguity

* If `event_slot_id` is not globally stable → double booking risk

➡️ **Escalate to Solution Architect if slot identity is not immutable**

---

### Risk 2: Free-Text Notes

* Notes may contain excessive PII

➡️ Acceptable but **must be erased fully**

---

# 8. Explicit Assumptions (Reconfirmed)

* One booking consumes exactly one slot
* Slot IDs are immutable
* No booking updates ever occur
* No soft deletes anywhere

If false → **Architecture / Compliance escalation**

---

# 9. Exit Criteria — Database Gate (Phase 1B)

✔ Double booking structurally impossible (DB-enforced)
✔ Booking immutability enforced by schema
✔ PII explicitly isolated
✔ GDPR erasure supported without data corruption
✔ Multisite-safe (`site_id` everywhere)
✔ No Phase 2 leakage (no cancel/reschedule fields)

---

### **Database Expert Position**

This schema provides **hard guarantees**, not conventions.

If a booking exists:

* It is confirmed
* It is final
* It consumed a slot
* It cannot be duplicated

Any deviation requires **formal escalation**.

# WordPress REST API Expert — Phase 1B

**Scope:** Booking creation & confirmation only
**Authority respected:** Solution Architecture, Security & Compliance
**Status:** Implementation-ready API contract

---

## 1. API Design Principles (Non-Negotiable)

* **Stateless**: Every request is self-contained
* **Secure-by-default**:

  * HTTPS only
  * JWT required where PII is submitted
* **Mobile-first**:

  * Minimal round-trips
  * Single atomic booking call
* **No mutable resources**:

  * No PUT / PATCH / DELETE for bookings
* **No hidden states**:

  * Only observable state = booking exists (confirmed)

---

## 2. API Versioning Strategy

### 2.1 Versioning Scheme

* **URL-based versioning**

```
/wp-json/bookit/v1/
```

**Rationale**

* Explicit
* Cache-safe
* Mobile client friendly
* Avoids header negotiation complexity

⚠️ **Breaking changes require `/v2/`**
No silent mutations allowed.

---

## 3. Authentication Model (JWT)

### 3.1 Auth Requirement by Endpoint

| Endpoint              | Auth Required      | Reason        |
| --------------------- | ------------------ | ------------- |
| GET availability      | Optional / Public* | No PII        |
| POST booking          | ✅ Required         | PII + consent |
| GET booking (by UUID) | ✅ Required         | PII exposure  |

* Exact availability auth policy is **defined elsewhere** — not assumed here.

---

### 3.2 JWT Expectations (Input Contract)

* Header:

```
Authorization: Bearer <JWT>
```

* JWT must already be:

  * Verified
  * Not expired
  * Bound to a client identity (`sub`)

⚠️ **API does not refresh or issue tokens**
Out of scope.

---

## 4. Endpoint Definitions

---

## 4.1 Availability Discovery (Read-Only)

### Endpoint

```
GET /wp-json/bookit/v1/events/{event_id}/availability
```

### Characteristics

* Read-only
* Advisory only
* No locking
* No guarantees

### Response (200 OK)

```json
{
  "event_id": 123,
  "slots": [
    {
      "event_slot_id": 456,
      "starts_at": "2026-02-10T09:00:00Z",
      "ends_at": "2026-02-10T09:30:00Z"
    }
  ]
}
```

### Validation Rules

* `event_id` must exist
* Slots returned **may already be consumed by the time client books**

⚠️ **Clients must assume race conditions**

---

## 4.2 Booking Creation & Confirmation (Atomic)

### Endpoint

```
POST /wp-json/bookit/v1/bookings
```

> **Creation = Confirmation**
> No tentative or pending state exists.

---

### Required Headers

```
Authorization: Bearer <JWT>
Idempotency-Key: <UUID v4>
Content-Type: application/json
```

---

### Request Body

```json
{
  "event_id": 123,
  "event_slot_id": 456,
  "client": {
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone": "+447700900123",
    "notes": "Optional message"
  },
  "consent": {
    "version": "v1.0",
    "accepted_at": "2026-01-08T21:30:00Z"
  }
}
```

---

### Validation Rules (Strict)

#### Structural

* All required fields present
* JSON only
* No extra properties allowed (reject unknown keys)

#### Business

* `event_id` exists
* `event_slot_id` exists
* Slot belongs to event
* Slot not already booked
* Consent block present and complete
* JWT subject (`sub`) matches client context (implementation-specific)

#### Security

* Email format validated
* Phone length capped
* Notes length capped (recommend ≤ 1,000 chars)

---

### Success Response (201 Created)

```json
{
  "booking_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": 123,
  "event_slot_id": 456,
  "confirmed_at": "2026-01-08T21:30:05Z"
}
```

**Guarantees**

* Booking is confirmed
* Slot is consumed
* Booking is immutable

---

## 5. Idempotency Strategy (Mandatory)

### 5.1 Mechanism

* **Client-supplied `Idempotency-Key` header**
* UUID v4 required
* Key is scoped to:

  * JWT subject
  * Endpoint
  * Payload hash

---

### 5.2 Behaviour

| Scenario                     | Result                           |
| ---------------------------- | -------------------------------- |
| Same key + same payload      | Return original success response |
| Same key + different payload | **409 Conflict**                 |
| No idempotency key           | **400 Bad Request**              |

⚠️ Prevents:

* Mobile retries
* Network timeouts
* Double bookings

---

## 6. Confirmation Semantics (Explicit)

* There is **no separate confirmation endpoint**
* Confirmation occurs:

  * In the same DB transaction as creation
* Observable outcomes:

  * **201** → booking exists & is final
  * **409** → slot already consumed
  * **422** → validation failure

---

## 7. Error Handling Standard

### 7.1 Error Envelope (All Errors)

```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "The selected slot is no longer available.",
    "request_id": "req_abc123"
  }
}
```

---

### 7.2 Error Codes (Defined Set)

| HTTP | Code                 | Meaning                     |
| ---- | -------------------- | --------------------------- |
| 400  | INVALID_REQUEST      | Malformed input             |
| 401  | UNAUTHENTICATED      | Missing / invalid JWT       |
| 403  | UNAUTHORISED         | Token valid but not allowed |
| 409  | SLOT_ALREADY_BOOKED  | Uniqueness violation        |
| 409  | IDEMPOTENCY_CONFLICT | Same key, different payload |
| 422  | VALIDATION_FAILED    | Business rule failure       |
| 500  | INTERNAL_ERROR       | Unexpected failure          |

⚠️ **No DB or stack traces exposed**

---

## 8. Explicit Exclusions (Enforced)

The following **do not exist** in API surface:

* ❌ `PUT /bookings`
* ❌ `DELETE /bookings`
* ❌ `/cancel`
* ❌ `/reschedule`
* ❌ `/confirm`
* ❌ Status fields

If requested → **Product / Architecture escalation**

---

## 9. Mobile-First Assumptions (Explicit)

* Clients may:

  * Retry requests
  * Lose connectivity mid-request
* API must:

  * Be idempotent
  * Avoid multi-step flows
  * Minimise payload size

---

## 10. Risks & Flags

### Risk 1: Idempotency Storage

* Requires backend persistence (not defined here)
* Must survive short outages

➡️ **Implementation detail, acknowledged**

---

### Risk 2: Slot Race Conditions

* Expected under load
* Properly handled via 409 responses

➡️ **Correct by design**

---

## 11. Exit Criteria — REST API Gate (Phase 1B)

✔ Single atomic booking endpoint
✔ No observable tentative state
✔ Idempotent by contract
✔ Error model explicit and stable
✔ Mobile retry safe
✔ No reschedule / cancel surface

---

### **WordPress REST API Expert Position**

This API surface is **minimal, defensive, and final**.

It:

* Treats clients as untrusted
* Makes bookings irreversible
* Survives mobile reality
* Enforces architecture guarantees at the contract level

Any deviation requires **formal escalation** under decision authority rules.

# WordPress Security Expert — Phase 1B Security Confirmation

**Role:** WordPress Security Expert
**Scope:** Auth, authorization, rate limiting, endpoint protection
**Decision authority respected:** Security & Compliance (non-overridable)
**Status:** Implementation-ready confirmation + flagged risks

---

## 1. Authentication Confirmation (JWT)

### 1.1 Booking Endpoint Auth (`POST /bookings`)

**Confirmed Requirements (Mandatory):**

* ✅ **JWT required**

  * `Authorization: Bearer <JWT>`
* ✅ Token must be:

  * Cryptographically verified (HS256 or RS256 — see assumptions)
  * Not expired
  * Have a valid `sub` claim (client identity)
* ✅ No fallback auth mechanisms

  * ❌ Cookies
  * ❌ WP nonces
  * ❌ API keys

**Enforcement Point (WP):**

* Custom `permission_callback` on REST route
* Reject request **before controller execution** if:

  * JWT missing
  * JWT invalid
  * JWT expired

**Security Guarantee:**

> No unauthenticated booking creation is possible, even if endpoint is discovered.

---

### 1.2 Availability Endpoint Auth (`GET /availability`)

**Confirmed Scope:**

* Read-only
* No PII
* Advisory only

**Security Position:**

* ✅ May be public **or** authenticated
* ❌ Must not leak:

  * Client IDs
  * Booking existence tied to identities
* ❌ Must not expose internal slot IDs beyond `event_slot_id`

⚠️ **Assumption flagged:**
Exact auth policy for availability is defined elsewhere.
**No security dependency exists on availability auth.**

---

## 2. Authorization Rules (Least Privilege)

### 2.1 Booking Creation Authorization

**Rule:**

* JWT subject (`sub`) == booking `client` context

**Enforcement:**

* Server derives `client_id` exclusively from JWT
* Client-supplied identifiers **must not override identity**

```text
JWT → subject → internal client_id
```

**Explicitly Forbidden:**

* Client passes `client_id`
* Booking on behalf of another subject

➡️ Violation = **403 UNAUTHORISED**

---

### 2.2 Booking Retrieval (`GET booking by UUID`)

**Confirmed Rule:**

* JWT subject must own the booking
* Booking UUID alone is **not sufficient**

**Mitigation:**

* Query must join:

  * `booking_uuid`
  * `client_id` (from JWT)
  * `site_id`

Prevents:

* Enumeration
* UUID leakage abuse

---

## 3. Rate Limiting (Shared Hosting Safe)

### 3.1 Booking Endpoint Rate Limiting

**Mandatory Controls:**

* Apply rate limiting to:

  * `POST /bookings`
  * `GET /bookings/{uuid}`

**Recommended Limits (Conservative):**

| Endpoint     | Limit                              |
| ------------ | ---------------------------------- |
| POST booking | 5 requests / minute / JWT subject  |
| GET booking  | 30 requests / minute / JWT subject |

**Implementation Constraints:**

* Shared hosting compatible
* No Redis dependency assumed

**Acceptable Storage Options:**

* Transients (site-scoped)
* Custom lightweight DB table

⚠️ **Risk flagged:**
Transients may be evicted under load → limits are **best-effort**, not absolute.

---

### 3.2 Abuse Mitigations

* Hard cap on payload size
* Reject excessive notes length
* Fail fast on auth before DB access

---

## 4. Scope Enforcement Confirmation

### 4.1 Booking Surface Enforcement

**Confirmed as Enforced:**

* ✅ Only one mutable action exists: **create booking**
* ❌ No update endpoints
* ❌ No delete endpoints
* ❌ No status transitions

**Security Validation:**

* No route registration exists for:

  * `PUT /bookings`
  * `PATCH /bookings`
  * `DELETE /bookings`
* Schema contains no mutable state fields

➡️ Scope enforced structurally, not by convention.

---

### 4.2 Admin & WP-Admin Surface

**Confirmed Position:**

* ❌ No operational use of WP Admin
* ❌ No admin UI for bookings
* ❌ No capability-based admin overrides

**Security Benefit:**

* Eliminates:

  * Privilege escalation via admin
  * CSRF via wp-admin
  * Human error attack surface

---

## 5. Public Booking Surface Confirmation

### 5.1 Booking Creation

**Confirmed:**

* ❌ No public booking creation
* ❌ No unauthenticated POST access
* ❌ No guest booking mode

Even if:

* Endpoint is discovered
* Payload is valid

➡️ Request is rejected at auth layer.

---

### 5.2 Data Exposure

* Booking UUID is:

  * Non-sequential
  * Non-guessable
* But **never sufficient alone** for access

---

## 6. Secrets & Key Handling

### 6.1 JWT Secrets

**Assumptions (Flagged):**

* JWT signing key stored:

  * Outside repo
  * In `wp-config.php` or environment variable
* Key rotation supported (future phase)

**Hard Rules:**

* ❌ No hardcoded secrets
* ❌ No secrets in DB
* ❌ No secrets in plugin files

---

## 7. Inherited Phase 1A Protections (Confirmed)

Booking endpoints **inherit all Phase 1A security controls**, including:

* HTTPS enforced
* REST namespace isolation
* Input sanitisation
* Output escaping
* No stack traces in responses
* Structured error responses only

✔ **Inheritance confirmed**

---

## 8. Risks & Explicit Flags

### Risk 1: JWT Library Quality

* Weak or outdated JWT implementation → catastrophic auth failure

➡️ **Must use a maintained JWT library**
(Security decision — non-overridable)

---

### Risk 2: Rate Limiting Degradation

* Shared hosting eviction may reduce effectiveness

➡️ Acceptable for Phase 1B
➡️ Monitor abuse signals

---

### Risk 3: Idempotency Storage Abuse

* Attacker floods with unique idempotency keys

➡️ Mitigated by:

* Rate limiting
* Payload hash checks

---

## 9. Explicit Assumptions (Reconfirmed)

* JWT issuance handled externally
* No anonymous bookings
* No cross-client booking access
* Availability leaks are non-sensitive

If any assumption is false → **Security escalation required**

---

## 10. Exit Criteria — Security Gate (Phase 1B)

✔ Booking endpoints require JWT
✔ No public booking creation
✔ Authorization bound to JWT subject
✔ Rate limiting applied
✔ Scope enforced structurally
✔ Phase 1A protections inherited

---

### **WordPress Security Expert Position**

The booking surface is:

* **Authenticated**
* **Authorised**
* **Rate-limited**
* **Minimal**
* **Defensible on shared hosting**

No unresolved security blockers identified for Phase 1B.

Any deviation from the above requires **formal escalation under Decision Authority Rules**.

