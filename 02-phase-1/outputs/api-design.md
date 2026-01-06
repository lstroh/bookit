You are acting within a **locked Phase 1 context**.
Below is an **implementation-ready REST API specification** written **strictly from the WordPress REST API Expert role**, aligned to the frozen **Architecture + Database decisions** you provided.

No product, compliance, database, or architectural decisions are reinterpreted.

---

# Phase 1 — REST API Definition

**Role:** WordPress REST API Expert
**Status:** ✅ Implementation-ready
**Scope:** Endpoints, schemas, auth, errors, versioning
**Explicitly excluded:** WP hooks, controllers, SQL, UI, cron, logic internals

---

## 1. API Versioning Strategy (LOCKED)

### Strategy

**URI-based versioning**

```
/wp-json/bookit/v1/
```

### Rationale

* Mobile-friendly
* Cache-safe
* Explicit breaking-change control
* Compatible with WordPress REST routing

📌 **Rule**

* v1 is immutable once released
* Breaking changes require `/v2/`
* Additive fields allowed within v1 (non-breaking)

---

## 2. Authentication Model (JWT)

### Auth Types

| Context         | Mechanism       | Notes                   |
| --------------- | --------------- | ----------------------- |
| Public booking  | ❌ None          | Token-based access only |
| Owner/System    | ✅ JWT (Bearer)  | Short-lived             |
| Booking actions | ✅ Booking token | Scoped + immutable      |

---

### 2.1 JWT Flow (Owner/System)

**Login**

```
POST /wp-json/bookit/v1/auth/login
```

**Headers**

```
Content-Type: application/json
```

**Request**

```json
{
  "email": "owner@example.com",
  "password": "••••••••"
}
```

**Response**

```json
{
  "access_token": "jwt...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

📌 **Rules**

* JWT required on all owner/system endpoints
* No refresh token in v1 (explicit re-login)
* JWT scope = business context only

---

### 2.2 Booking Token (Public)

* Issued at booking creation
* Immutable
* Used for:

  * View booking
  * Cancel
  * Reschedule
* Not reusable across bookings

---

## 3. Endpoint Groups (Final)

### Groups

1. Auth
2. Public Booking
3. Owner / System
4. Availability (read-only public)
5. Events (read-only public)

---

## 4. Endpoint Table (Final)

### 4.1 Authentication

| Method | Endpoint      | Auth | Purpose   |
| ------ | ------------- | ---- | --------- |
| POST   | `/auth/login` | ❌    | Issue JWT |

---

### 4.2 Public Booking (Unauthenticated)

| Method | Endpoint                       | Auth          | Purpose            |
| ------ | ------------------------------ | ------------- | ------------------ |
| GET    | `/events`                      | ❌             | List active events |
| GET    | `/events/{id}`                 | ❌             | Event details      |
| GET    | `/availability`                | ❌             | Available slots    |
| POST   | `/bookings`                    | ❌             | Create booking     |
| GET    | `/bookings/{token}`            | Booking token | View booking       |
| POST   | `/bookings/{token}/cancel`     | Booking token | Cancel booking     |
| POST   | `/bookings/{token}/reschedule` | Booking token | Reschedule         |

---

### 4.3 Owner / System (JWT)

| Method | Endpoint               | Auth | Purpose        |
| ------ | ---------------------- | ---- | -------------- |
| GET    | `/owner/bookings`      | JWT  | List bookings  |
| GET    | `/owner/bookings/{id}` | JWT  | Booking detail |
| GET    | `/owner/events`        | JWT  | Manage events  |
| POST   | `/owner/events`        | JWT  | Create event   |
| PATCH  | `/owner/events/{id}`   | JWT  | Update event   |
| DELETE | `/owner/events/{id}`   | JWT  | Soft delete    |
| GET    | `/owner/settings`      | JWT  | Rule config    |
| PATCH  | `/owner/settings`      | JWT  | Update rules   |

---

## 5. Request / Response Schemas (Canonical)

### 5.1 Create Booking

**POST `/bookings`**

**Request**

```json
{
  "event_id": 123,
  "start_datetime": "2026-02-01T10:00:00Z",
  "client": {
    "full_name": "Jane Doe",
    "email": "jane@example.com"
  },
  "consents": {
    "reminder": true
  }
}
```

**Validation Rules**

* `event_id` must exist + active
* `start_datetime` must match availability
* `full_name` required
* At least one contact method required
* Consent flags must be explicit boolean

**Response**

```json
{
  "booking_token": "bk_8f92...",
  "status": "confirmed",
  "start_datetime": "2026-02-01T10:00:00Z",
  "end_datetime": "2026-02-01T10:30:00Z"
}
```

---

### 5.2 View Booking (Public)

**GET `/bookings/{token}`**

**Response**

```json
{
  "event": {
    "id": 123,
    "title": "Consultation"
  },
  "status": "confirmed",
  "start_datetime": "2026-02-01T10:00:00Z",
  "end_datetime": "2026-02-01T10:30:00Z"
}
```

📌 **Rule**

* No client PII ever returned

---

### 5.3 Availability Query

**GET `/availability`**

**Query Params**

```
event_id=123
from=2026-02-01
to=2026-02-07
```

**Response**

```json
{
  "event_id": 123,
  "slots": [
    {
      "start": "2026-02-01T10:00:00Z",
      "end": "2026-02-01T10:30:00Z"
    }
  ]
}
```

---

### 5.4 Owner Booking List

**GET `/owner/bookings`**

**Headers**

```
Authorization: Bearer <jwt>
```

**Response**

```json
{
  "bookings": [
    {
      "id": 456,
      "event_id": 123,
      "start_datetime": "2026-02-01T10:00:00Z",
      "status": "confirmed"
    }
  ]
}
```

📌 **Rule**

* Client PII returned **only if not erased**
* Null-safe responses required

---

## 6. Error Handling Standard (LOCKED)

### Error Envelope (All Endpoints)

```json
{
  "error": {
    "code": "booking_unavailable",
    "message": "Selected slot is no longer available",
    "status": 409
  }
}
```

### Standard HTTP Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 400  | Validation error        |
| 401  | Auth required / invalid |
| 403  | Forbidden               |
| 404  | Not found               |
| 409  | Conflict (booking race) |
| 422  | Business rule violation |
| 429  | Rate limited            |
| 500  | Server error            |

📌 **Rule**

* No WP default error leakage
* No stack traces
* Deterministic error codes

---

## 7. Validation & Security Rules (Explicit)

* All input JSON schema validated
* Strict date parsing (UTC only)
* Rate limiting on:

  * `/bookings`
  * `/availability`
* No over-posting allowed
* PATCH endpoints are **field-whitelisted**
* All owner endpoints require JWT

---

## 8. Caching Rules (Declarative)

| Endpoint        | Cache               |
| --------------- | ------------------- |
| `/events`       | Public, short-lived |
| `/availability` | Public, short-lived |
| `/bookings/*`   | No cache            |
| `/owner/*`      | No cache            |

---

## 9. Explicit Non-Responsibilities (REST Layer)

* No booking logic
* No slot locking
* No GDPR interpretation
* No DB access patterns
* No email sending

All delegated to **Domain Engine / Services**

---

## 10. Open Ambiguities (None)

✔ All required inputs provided
✔ No conflicts detected
✔ No authority violations

---

## 11. Exit Criteria — REST API Phase

✅ Endpoint groups defined
✅ Auth model locked
✅ Schemas specified
✅ Error conventions frozen
✅ Versioning strategy declared
✅ Secure-by-default enforced
✅ Mobile-first compatible
✅ No WP hooks
✅ No code

---

### **Final Sign-off — WordPress REST API Expert**

The REST API layer is **fully defined, secure, versioned, and implementation-ready**, and can now be handed off to:

* **Implementation engineers** (controllers, routes)
* **QA** (contract testing)
* **Mobile/Web clients** (integration)

No further clarification required unless **Product Owner** or **Compliance** reopens scope.
