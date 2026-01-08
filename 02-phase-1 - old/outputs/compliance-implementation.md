## Phase 1 — Compliance Implementation Mapping

**Role:** Compliance Implementation Expert
**Scope:** GDPR → enforceable technical controls only
**Status:** ✅ Implementation-ready
**Authority:** Compliance & Security (non-overridable)

All inputs below are treated as **locked**. No reinterpretation of law, no scope changes, no UX decisions.

---

# 1. GDPR Requirements → Technical Controls (Mapped)

### 1.1 Lawfulness, Fairness, Transparency (UK GDPR Art. 5(1)(a), 6)

**Controls**

* **Explicit consent flags** required at booking creation (`consents.reminder`)
* Consent stored in `bookit_consents` with:

  * `consent_type`
  * `channel`
  * `policy_version`
  * `legal_basis`
  * `consent_timestamp`
* No implied or default consent
* No silent opt-ins

**Enforcement**

* API rejects booking creation if required consent flag missing
* Consent records written atomically with booking creation

---

### 1.2 Purpose Limitation (Art. 5(1)(b))

**Controls**

* Client PII stored **only** in `bookit_clients`
* PII never duplicated into:

  * bookings
  * notifications
  * consents
* Booking table references client **by ID only**, removable

**Enforcement**

* Schema-level separation
* API response filtering (public endpoints never return PII)

---

### 1.3 Data Minimisation (Art. 5(1)(c))

**Controls**

* Client table contains only:

  * full_name
  * email (optional)
  * phone (optional)
* No free-text notes
* No metadata blobs
* Tokens (JWT, booking_token) explicitly non-PII

**Enforcement**

* Request schema whitelisting
* Over-posting rejected at REST layer

---

### 1.4 Accuracy (Art. 5(1)(d))

**Controls**

* Clients editable only via booking lifecycle (reschedule creates new booking)
* No historical mutation of completed bookings

**Enforcement**

* No PATCH endpoint for client PII
* Changes require new booking instance

---

### 1.5 Storage Limitation (Art. 5(1)(e))

**Controls**

| Data Type     | Mechanism              |
| ------------- | ---------------------- |
| Client PII    | Hard delete on erasure |
| Bookings      | Retained, anonymised   |
| Notifications | Auto-delete ≤ 90 days  |
| Consents      | Retained anonymised    |

**Enforcement**

* Scheduled purge job for notifications
* Erasure workflow enforces irreversible deletion

---

### 1.6 Integrity & Confidentiality (Art. 5(1)(f), Art. 32)

**Controls**

* JWT-secured owner endpoints
* Booking-token scoped public access
* Rate limiting on all public endpoints
* No PII in logs, tokens, URLs

**Enforcement**

* Central auth middleware
* Structured logging with PII exclusion

---

### 1.7 Privacy by Design & Default (Art. 25)

**Controls**

* Default API responses exclude PII
* Public endpoints expose zero personal data
* Erasure breaks all links automatically

**Enforcement**

* Serializer layer enforces field-level visibility
* No conditional “admin override” paths

---

# 2. Data Deletion (Right to Erasure — Art. 17)

## 2.1 Trigger Conditions

* Explicit erasure request (authenticated owner action)
* No automated or implicit deletion

---

## 2.2 Erasure Flow (Deterministic)

### Step 1 — Identify Client

* Resolve `client_id`
* Lock client row for deletion

---

### Step 2 — Delete Client PII

* Hard delete row from `bookit_clients`
* Set `deleted_at` timestamp

**Forbidden**

* Soft anonymisation
* Placeholder identities
* Hashing instead of deletion

---

### Step 3 — Anonymise Related Bookings

* Set `client_id = NULL` on `bookit_bookings`
* Preserve:

  * event_id
  * timings
  * status
  * reschedule chain

---

### Step 4 — Scrub Consent Records

* Remove any foreign keys
* Ensure no linkability remains
* Retain:

  * consent_type
  * timestamp
  * policy_version
  * legal_basis

---

### Step 5 — Verify Completion

* Referential integrity check:

  * No table references deleted client
* Operation is **final and irreversible**

---

## 2.3 Compliance Guarantees

* No residual identifiers
* No re-identification path
* No rollback capability

---

# 3. Data Export (Right of Access & Portability — Art. 15, 20)

## 3.1 Scope of Export

**Includes**

* Client PII (if not erased)
* Client’s own bookings
* Booking timestamps
* Event titles (context only)

**Excludes**

* Other clients
* Internal IDs
* Audit-only consent records
* Security metadata

---

## 3.2 Export Format

* Machine-readable JSON
* UTF-8 encoded
* Deterministic schema

---

## 3.3 Export Flow

1. Authenticate owner via JWT
2. Select client
3. Generate export snapshot
4. Deliver via API response (no email, no storage)

---

## 3.4 Post-Erasure Behaviour

* Export returns **no personal data**
* Only anonymised booking history (non-PII)

---

# 4. Consent Handling (Explicit & Auditable)

## 4.1 Consent Capture Rules

* Consent required per purpose
* Boolean, explicit, unbundled
* Captured at time of action

---

## 4.2 Storage Rules

* Stored in `bookit_consents`
* No linkage after erasure
* No updates or revocations retroactively applied

---

## 4.3 Use Rules

* Consent evaluated **only at execution time**
* No inferred consent
* No cross-purpose reuse

---

## 4.4 Audit Safety

* Records are non-personal after erasure
* Retained indefinitely
* Safe for regulator inspection

---

# 5. Auditability & Accountability (Art. 5(2), 30)

## 5.1 Required Audit Events

| Event                      | Logged |
| -------------------------- | ------ |
| Booking created            | ✅      |
| Booking cancelled          | ✅      |
| Booking rescheduled        | ✅      |
| Consent recorded           | ✅      |
| Client erased              | ✅      |
| Data exported              | ✅      |
| Auth login success/failure | ✅      |

---

## 5.2 Audit Log Rules

* No PII stored
* Event type + timestamp only
* Actor type (public / owner / system)
* Immutable, append-only

---

## 5.3 Prohibited

* Manual logs
* WP debug logs containing PII
* Free-text audit notes

---

# 6. Explicit Assumptions (Flagged)

* Erasure requests are initiated by authenticated owner
* No direct data subject self-service in v1
* No offline/manual processing allowed

---

# 7. Risks (Explicit)

* **Risk:** Owner exports data after erasure
  **Mitigation:** Export returns anonymised data only

* **Risk:** Developer adds PII to logs
  **Mitigation:** Central logging contract + review gate

---

# 8. Exit Criteria — Compliance Implementation

✅ All GDPR principles mapped to controls
✅ Erasure flow deterministic and irreversible
✅ Export flow defined and enforceable
✅ Consent capture auditable and non-linkable
✅ No manual processes
✅ No security weakening
✅ No scope creep

---

## **Final Compliance Close Statement**

> All applicable UK GDPR obligations have been translated into **concrete, technically enforceable controls** aligned with the locked database, API, and security architecture.
>
> No manual compliance steps are assumed.
>
> This implementation is **audit-safe, privacy-by-default, and production-ready**.
