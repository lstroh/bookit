## Role: WordPress Security Expert

**Scope:** Authentication, authorization, API security, threat modeling
**Authority:** Security (non-overridable)
**Constraints respected:** JWT-only, shared hosting, DB-authoritative, no cron reliance, no WP Admin dependency
**No booking logic referenced.**

---

# 1. JWT Lifecycle (Implementation-Ready)

## 1.1 Issuance

**When issued:**

* Only after successful authentication via a dedicated auth endpoint.
* Only for identified actors (owner or client) — **never anonymous**.

**Rules:**

* JWTs are **short-lived access tokens only**.
* JWT payload (claims) MUST include:

  * `jti` (unique token ID, random, non-derivable)
  * `sub` (internal actor identifier, non-PII)
  * `iat`
  * `exp`
  * `scope` (see Section 3)
* JWT MUST NOT include:

  * Email
  * Phone
  * Name
  * Booking IDs
  * Any personal data (Compliance Addendum §5)

**Signing:**

* HMAC-SHA256 or stronger.
* Secret stored outside repo, loaded via environment or wp-config.php.
* Key rotation supported (see Risks).

---

## 1.2 Expiration

**Hard requirement:**

* Access token lifetime: **≤ 15 minutes**

**Rationale:**

* Limits replay window
* Required because shared hosting compromise risk exists

**Rules:**

* Expired token = **hard reject**
* No grace period
* Fail-closed

---

## 1.3 Refresh

**Model:**

* **Rotating refresh tokens**, DB-stored, single-use.

**Refresh token rules:**

* Stored hashed in DB (never plaintext).
* Bound to:

  * actor
  * client type (mobile/web)
* Rotation enforced:

  * Refresh → invalidate old → issue new pair
* Lifetime: **≤ 30 days**

**Failure handling:**

* Reuse of an already-used refresh token:

  * Immediately revoke entire token family
  * Force re-authentication

**Assumption (explicit):**

* Separate refresh endpoint exists.
* Client can store refresh token securely.

---

## 1.4 Revocation (Mandatory)

**What triggers revocation:**

* Explicit logout
* Client erasure trigger
* Security event (suspected abuse)
* Refresh token misuse
* Manual owner session invalidation (via API, not Admin UI)

**Rules:**

* Revocation is **immediate**
* Revoked token MUST fail even if not expired
* No cache-only revocation
* No cron dependency

---

# 2. Persistent Revocation — Source of Truth

## 2.1 Revocation Store (Authoritative)

**Storage:**

* Dedicated DB table (e.g. `wp_bookit_revoked_tokens`)

**Fields (minimum):**

* `jti` (indexed, unique)
* `revoked_at`
* `reason` (enum/string, non-PII)
* `expires_at` (to allow cleanup)

**Rules:**

* Every authenticated request MUST:

  1. Validate JWT signature
  2. Validate expiry
  3. Check `jti` against revocation table
* Any failure → **401 Unauthorized**

**Cleanup:**

* Old revoked tokens may be deleted **after their natural expiry**
* Cleanup must be:

  * Triggered inline during normal requests **or**
  * Via deterministic server-side execution
* **Must not rely on WP cron** (Compliance rule)

---

## 2.2 Fail-Closed Requirement

If revocation table is:

* Unreachable
* Corrupt
* Query fails

→ Authentication **fails closed**.

---

# 3. Token Scope Model (Least Privilege)

## 3.1 Scope Principles

* Scopes are **capabilities**, not roles.
* No wildcard scopes.
* Scopes are immutable per token.

## 3.2 Defined Scopes (Initial)

**Public (no JWT):**

* `public:read` (implicit, not a JWT scope)

**Authenticated:**

* `auth:self`

  * Token introspection
  * Logout
* `booking:read:self`
* `booking:write:self`
* `profile:read:self`

**Explicitly forbidden:**

* `admin:*`
* `booking:write:any`
* Cross-user scopes

**Assumption (explicit):**

* Owner vs client distinction is enforced via scope issuance, not runtime guessing.

---

# 4. Public vs Authenticated Endpoint Boundaries

## 4.1 Public Endpoints (No JWT)

Allowed:

* Read-only availability discovery
* Booking link resolution (opaque token only)

Rules:

* No personal data returned
* Aggressively rate-limited
* No state mutation

---

## 4.2 Authenticated Endpoints (JWT Required)

All endpoints that:

* Create
* Modify
* Cancel
* Reschedule
* Access identity-linked data

Rules:

* JWT mandatory
* Scope check mandatory
* Revocation check mandatory

**Forbidden:**

* “Optional auth”
* Dual-mode endpoints
* Admin-only bypasses

---

# 5. Rate Limiting Policy (Mandatory)

## 5.1 Enforcement Layer

* Implemented at REST API level
* Backed by DB counters or memory + DB fallback
* No reliance on external SaaS

---

## 5.2 Rate Limits (Concrete)

**Authentication endpoints:**

* 5 requests / minute / IP
* Burst blocked
* Progressive backoff

**Refresh endpoint:**

* 10 requests / hour / refresh token family

**Public booking-related endpoints:**

* 30 requests / minute / IP

**Authenticated endpoints:**

* 60 requests / minute / token

**Rules:**

* Limit violations → `429 Too Many Requests`
* Rate limit state is **authoritative**
* No silent degradation

---

## 5.3 Abuse Signals

Trigger immediate token revocation if:

* Repeated refresh token reuse
* Excessive 401s with same token
* Scope violation attempts

---

# 6. Threat Model (Explicit)

## 6.1 Token Replay

**Threat:**

* Stolen JWT reused

**Mitigations:**

* Short-lived access tokens
* DB-backed revocation
* HTTPS-only
* No personal data in JWT

---

## 6.2 Brute Force (Auth)

**Threat:**

* Credential stuffing
* Enumeration

**Mitigations:**

* Strict rate limiting
* Uniform error messages
* No user existence leakage

---

## 6.3 Token Forgery

**Threat:**

* Key leakage

**Mitigations:**

* Strong secrets
* Key rotation support
* jti revocation enforcement

---

## 6.4 Abuse of Public Endpoints

**Threat:**

* Scraping
* DoS

**Mitigations:**

* IP-based rate limiting
* No sensitive data exposure
* Opaque identifiers only

---

# 7. Explicit Assumptions (Flagged)

* HTTPS is enforced by hosting or plugin checks.
* Environment secrets are available (wp-config or env vars).
* Mobile client can securely store refresh tokens.
* DB access is reliable enough for per-request revocation checks.

---

# 8. Explicit Risks (Flagged)

* **Shared hosting DB latency** may impact auth performance.
* **Key rotation complexity** must be handled carefully to avoid lockouts.
* **Rate limiting storage growth** must be bounded.
* **Fail-closed revocation checks** may reduce availability during DB outages (accepted security tradeoff).

---

# 9. Exit Criteria — Security Role

✔ JWT issuance, expiry, refresh, revocation fully defined
✔ Revocation is DB-authoritative and persistent
✔ Token replay risk explicitly mitigated
✔ Rate limiting is mandatory and enforced
✔ Public vs authenticated boundaries are explicit
✔ No booking logic referenced

**Security position:**
This design is **Phase 1–ready**, compliant with frozen rules, and safe for shared hosting without weakening GDPR or security guarantees.
