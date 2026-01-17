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
