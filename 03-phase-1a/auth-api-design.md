## Role: WordPress REST API Expert

**Scope:** Authentication endpoints, JWT validation flow, error semantics, rate-limit placement
**Authority respected:** Security (non-overridable)
**Constraints:** Stateless, JWT-only, mobile-first, secure-by-default
**Out of scope:** Booking endpoints, business logic, DB schema, compliance interpretation

---

# API Versioning Strategy (Applies to All Below)

* **Base path:** `/wp-json/bookit/v1`
* **Versioning rule:**

  * Breaking auth changes → new version (`/v2`)
  * No silent behaviour changes
* **Content type:** `application/json; charset=utf-8`

---

# Authentication Endpoints (Only)

## 1. `POST /auth/login`

### Purpose

Issue **short-lived access JWT** + **rotating refresh token** after successful authentication.

### Auth

* **No JWT required**
* Rate-limited (see Rate Limiting section)

### Request Schema

```json
{
  "identifier": "string",
  "secret": "string",
  "client_type": "mobile | web"
}
```

**Notes:**

* `identifier` may be email/username/phone (opaque to API layer).
* API MUST NOT reveal which identifiers are valid.

### Success Response — `200 OK`

```json
{
  "access_token": "jwt-string",
  "expires_in": 900,
  "refresh_token": "opaque-string",
  "token_type": "Bearer",
  "scope": [
    "auth:self",
    "profile:read:self"
  ]
}
```

**Rules enforced (from Security):**

* JWT contains `jti`, `sub`, `iat`, `exp`, `scope`
* `exp` ≤ 15 minutes
* No PII in JWT

### Failure Responses

* `401 Unauthorized`

```json
{
  "error": "invalid_credentials"
}
```

* `429 Too Many Requests`

```json
{
  "error": "rate_limited",
  "retry_after": 60
}
```

**Security rule:**
Errors MUST be indistinguishable for non-existent users vs wrong secrets.

---

## 2. `POST /auth/refresh`

### Purpose

Rotate refresh token and issue a **new access JWT**.

### Auth

* **No access JWT**
* Requires **refresh token only**
* Rate-limited per refresh-token family

### Request Schema

```json
{
  "refresh_token": "opaque-string",
  "client_type": "mobile | web"
}
```

### Success Response — `200 OK`

```json
{
  "access_token": "jwt-string",
  "expires_in": 900,
  "refresh_token": "new-opaque-string",
  "token_type": "Bearer",
  "scope": [
    "auth:self",
    "profile:read:self"
  ]
}
```

### Failure Responses

* `401 Unauthorized`

```json
{
  "error": "invalid_refresh_token"
}
```

* `403 Forbidden`

```json
{
  "error": "refresh_token_reuse_detected"
}
```

* `429 Too Many Requests`

```json
{
  "error": "rate_limited",
  "retry_after": 3600
}
```

**Mandatory behaviour:**

* Reuse detection → revoke entire token family immediately
* No partial success
* No grace window

---

# JWT Validation Flow (All Authenticated Endpoints)

**Executed for every request with `Authorization: Bearer <jwt>`**

### Step-by-step (Fail-Closed)

1. **Extract token**

   * Missing / malformed → `401`
2. **Verify signature**

   * Invalid → `401`
3. **Validate standard claims**

   * `exp` expired → `401`
   * `iat` in future → `401`
4. **Validate required claims**

   * Missing `jti`, `sub`, `scope` → `401`
5. **Revocation check (DB-authoritative)**

   * `jti` found → `401`
   * DB unavailable → `401` (fail-closed)
6. **Scope enforcement**

   * Scope insufficient → `403`

**No caching shortcuts allowed.**

---

# Error Semantics (Contractual)

## 401 Unauthorized

Used when **authentication is invalid or missing**.

**Triggers:**

* Missing JWT
* Invalid signature
* Expired token
* Revoked token
* Invalid refresh token

**Response shape (uniform):**

```json
{
  "error": "unauthorized"
}
```

---

## 403 Forbidden

Used when **authentication is valid but not permitted**.

**Triggers:**

* Missing required scope
* Refresh token reuse detected
* Explicit security revocation event

```json
{
  "error": "forbidden"
}
```

---

## 429 Too Many Requests

Used when **rate limits are exceeded**.

```json
{
  "error": "rate_limited",
  "retry_after": 60
}
```

**Rule:**
Rate limiting MUST be visible and explicit — never silent.

---

# Rate Limiting Enforcement

## Enforcement Location

* **Inside WordPress REST API layer**
* Implemented via:

  * `register_rest_route` → `permission_callback` (pre-flight)
  * Early middleware before controller logic

## Applied Limits (Authoritative)

| Endpoint             | Limit         | Keyed By     |
| -------------------- | ------------- | ------------ |
| `POST /auth/login`   | 5 req / min   | IP           |
| `POST /auth/refresh` | 10 req / hour | Token family |
| Authenticated APIs   | 60 req / min  | JWT `jti`    |

**On breach:**

* Immediate `429`
* No processing continues
* Optionally signal abuse to revocation layer (per Security rules)

---

# Public vs Authenticated — Explicit Decision

| Endpoint           | Auth Required             |
| ------------------ | ------------------------- |
| `/auth/login`      | ❌ No                      |
| `/auth/refresh`    | ❌ No (refresh token only) |
| Any other endpoint | ✅ Yes                     |

**Rules enforced:**

* No “optional auth”
* No dual-mode endpoints
* No booking surface exposed here

---

# Explicit Assumptions (REST Role)

* WordPress REST hooks are available for early request interception.
* Headers can be reliably read (`Authorization`).
* DB calls are acceptable per request (revocation + rate limits).

---

# Explicit Risks (REST Role)

* Revocation DB lookups add latency (accepted security tradeoff).
* Shared hosting may throttle DB under load → increased 401s.
* Mobile clients mishandling refresh tokens will cause forced re-auth.

---

# Exit Criteria — REST API Role

✔ `login` and `refresh` endpoints fully defined
✔ JWT validation flow is explicit and fail-closed
✔ Error semantics are consistent and contractually visible
✔ Rate limiting location and behaviour defined
✔ No booking or business logic present

**REST API position:**
Authentication surface is **implementation-ready**, security-aligned, and compliant with all non-overridable constraints.
