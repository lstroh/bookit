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
