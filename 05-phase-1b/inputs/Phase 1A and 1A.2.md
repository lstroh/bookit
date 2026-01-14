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

## QA & Risk Analysis — Authentication & Security Surface

**Role:** QA & Risk Analyst
**Scope:** Adversarial testing, failure modes, edge cases
**Inputs analysed:** Security Foundations + Auth API Design
**Authority respected:** Security (non-overridable)

---

## 1. Unauthenticated Access Attempts

### 1.1 Missing / Malformed Authentication

**Test Scenarios**

* Call any non-`/auth/*` endpoint with:

  * No `Authorization` header
  * `Authorization: Bearer` (empty)
  * Non-Bearer scheme
  * Corrupted JWT format

**Expected**

* `401 Unauthorized`
* Uniform error body `{ "error": "unauthorized" }`

**Risk**

* Any endpoint accidentally registered without permission callback → silent auth bypass.

**Assumption (flagged)**

* Every non-auth route uses a centralized auth gate (not per-controller discretion).

---

### 1.2 “Optional Auth” Drift

**Test Scenarios**

* Attempt to access read-only booking or profile endpoints without JWT.
* Attempt to send JWT to public endpoints to influence behaviour.

**Expected**

* Public endpoints ignore JWT entirely.
* Authenticated endpoints hard-reject missing JWT.

**Risk**

* Future developer adds “helpful” optional auth for UX → scope confusion + data leak.

**Escalation**

* Product / Architecture review required if any endpoint attempts dual-mode behaviour.

---

### 1.3 Booking Surface Exposure

**Test Scenarios**

* Enumerate `/wp-json/bookit/v1/*` routes anonymously.
* Fuzz query params on public availability endpoints.

**Expected**

* No mutation endpoints callable without JWT.
* No PII or identity-linked data ever returned.

**Risk**

* Availability endpoints accidentally leaking:

  * Internal IDs
  * Actor identifiers
  * Time-based correlation data

---

## 2. Token Replay Scenarios

### 2.1 Stolen Access Token (Within TTL)

**Scenario**

* Capture valid JWT.
* Replay from:

  * Different IP
  * Different User-Agent
  * Different geo (if detectable)

**Expected**

* Token accepted until:

  * Expiry OR
  * Explicit revocation trigger

**Risk (accepted)**

* Short TTL is the *only* mitigation.
* No IP binding means replay is possible within window.

**Assumption**

* Business accepts ≤15 min replay exposure.

---

### 2.2 Replay After Revocation

**Test Scenarios**

* Use JWT after:

  * Logout
  * Refresh token reuse event
  * Manual revocation
  * Client erasure trigger

**Expected**

* Immediate `401` regardless of `exp`.

**Critical Risk**

* Any caching layer (object cache, transient, opcode) skipping revocation check.

**Escalation**

* Security authority if revocation lookup is not strictly per-request.

---

### 2.3 Refresh Token Replay

**Test Scenarios**

* Use same refresh token twice:

  * Sequentially
  * Concurrent requests (race condition)

**Expected**

* First succeeds.
* Second triggers:

  * `403 forbidden`
  * Entire token family revoked.

**Risk**

* DB race conditions on shared hosting could allow double-issue.

**Assumption (flagged)**

* Refresh rotation is atomic at DB level.

---

## 3. Revocation Enforcement Validation

### 3.1 Revocation Store Unavailable

**Test Scenarios**

* Simulate DB failure:

  * Table missing
  * Query timeout
  * Permission error

**Expected**

* Authentication fails closed → `401`.

**Risk**

* Availability degradation under DB stress.
* Clients perceive “random logouts”.

**Compliance Position**

* Acceptable tradeoff (explicitly documented).

---

### 3.2 Revocation Table Growth

**Test Scenarios**

* Long-running system with heavy auth churn.
* Cleanup logic triggered only via requests.

**Risk**

* Table grows unbounded if traffic is low.
* Cleanup never executes on idle systems.

**Assumption (flagged)**

* Some deterministic cleanup trigger exists without cron.
* This is not yet demonstrated.

**Escalation**

* Project Manager / Architecture sequencing risk.

---

## 4. Rate Limiting Coverage Gaps

### 4.1 Public Endpoints

**Test Scenarios**

* Flood availability endpoints from single IP.
* Distributed low-rate attack across many IPs.

**Expected**

* `429` consistently enforced per IP.

**Risk**

* Shared hosting may not distinguish proxies/CDNs.
* X-Forwarded-For trust assumptions unclear.

**Assumption (flagged)**

* IP resolution strategy is defined elsewhere (currently missing).

---

### 4.2 Authenticated Endpoints

**Test Scenarios**

* High-rate calls using:

  * Same JWT
  * Multiple JWTs from same actor

**Expected**

* Limit keyed strictly by `jti`.

**Risk**

* Attacker logs in repeatedly → many JWTs → bypass per-token limits.

**Escalation**

* Security/Product to confirm if actor-level throttling is needed later.

---

## 5. “Later” or Implicit Security Assumptions (Flagged)

These are **not fully resolved** in current inputs:

* Secure refresh token storage on mobile is assumed, not verified.
* Atomicity of refresh rotation under concurrency is assumed.
* IP trust model (proxy headers) is undefined.
* Key rotation procedure exists conceptually but is untested.
* Cleanup of revocation + rate-limit tables without cron is underspecified.
* No explicit monitoring / alerting for abuse signals.

**Risk Classification**

* Medium (operational) but not blockers for Phase 1 **if explicitly accepted**.

---

## 6. Cross-Role Conflict Check

* **No conflict** with Security authority detected.
* **Potential future conflict** if Product requests:

  * Longer JWT TTL
  * Optional auth endpoints
  * Reduced revocation checks for performance

These would require formal escalation.

---

## 7. Exit Criteria Validation (QA Gate)

✔️ Revoked tokens are rejected (fail-closed confirmed)
✔️ Rate limiting exists on all public + auth endpoints
✔️ No unauthenticated booking access defined
⚠️ No deferred security items **only if** flagged assumptions are formally accepted

---

## QA Position (Formal)

The authentication and security surface is **testable, adversarially sound, and Phase-1 acceptable**, **provided** the flagged assumptions are explicitly acknowledged and tracked as operational risks rather than silently deferred.

No blockers raised.
Several **latent risks** identified for future phases.


## WordPress Backend Feasibility Assessment — Phase 1A

**Role:** WordPress Backend Expert
**Decision Authority:** Advisory (Compliance is binding)
**Scope:** Technical feasibility on typical UK shared hosting
**Status:** Implementation-feasible with explicit constraints

---

## 1. Feasibility on Typical UK Shared Hosting

**Assessment:** ✅ **Feasible**

All mandated compliance behaviours can be implemented using **standard WordPress + MySQL/MariaDB capabilities** commonly available on UK shared hosting (e.g. cPanel hosts, managed WP hosts).

### Supporting Factors

* **Synchronous deletion**

  * Supported via:

    * `$wpdb` transactional queries (`START TRANSACTION / COMMIT / ROLLBACK`)
    * InnoDB tables (default on most hosts)
* **Request-driven retention cleanup**

  * Executable during REST API request lifecycle
  * No dependency on cron, WP Admin, or shell access
* **JWT-secured REST API**

  * Commonly supported via PHP + REST hooks
* **Custom tables**

  * Fully supported; preferable over CPTs for strict control

### Explicit Non-Dependencies (Confirmed)

* ❌ WP Cron
* ❌ WP Admin screens
* ❌ Background workers
* ❌ Hosting-level schedulers
* ❌ CLI access

---

## 2. Required Hosting Assumptions (Explicit & Bounded)

The following are **minimum, unavoidable assumptions**. All are typical for UK shared hosting.

### 2.1 Database Capabilities (Required)

* MySQL or MariaDB with:

  * **InnoDB engine**
  * **Transaction support**
* Permissions to:

  * Create custom tables
  * Execute `DELETE … WHERE … LIMIT N`
  * Execute `NOW()` / `CURRENT_TIMESTAMP`

⚠️ **If transactions are not supported → Compliance escalation required**

---

### 2.2 PHP / WordPress Runtime (Required)

* PHP ≥ 7.4 (transaction handling stability)
* Ability to:

  * Register REST routes (`register_rest_route`)
  * Execute inline DB logic during REST requests
* Normal request traffic (even low volume is acceptable)

---

### 2.3 Request Execution Time (Bounded)

* REST requests must allow:

  * **One bounded cleanup query**
  * **One deletion transaction**

Mitigation already defined:

* Cleanup queries are `LIMIT N`
* No unbounded scans
* No table locks beyond transaction scope

---

## 3. WP Admin Dependency Check

**Result:** ✅ **No WP Admin dependency**

All required mechanisms are compatible with **headless / API-only WordPress usage**.

### Explicit Confirmations

* No reliance on:

  * Admin UI actions
  * Admin-triggered cleanup
  * Admin settings pages
* Plugin operates via:

  * Activation hook (table creation only)
  * REST API requests
  * Internal service classes

WP Admin may exist but is **non-operational and irrelevant**.

---

## 4. WordPress Constraints & Workarounds (Non-Inventive)

### 4.1 Custom Tables (Mandatory)

**Constraint:**

* CPTs are unsuitable for:

  * Hard PII minimisation
  * Cascading deletes
  * Transactional guarantees

**Resolution (Allowed):**

* Use `$wpdb` + custom tables
* Explicit foreign keys *or* enforced deletion ordering

✔ Aligned with compliance input
✔ Common WordPress pattern for serious data models

---

### 4.2 Transactions in WordPress

**Constraint:**

* WordPress does not abstract transactions

**Resolution:**

* Use raw SQL via `$wpdb->query()`
* Explicit `START TRANSACTION`

⚠️ Requires developer discipline, not platform support
✔ Technically feasible

---

### 4.3 Low-Traffic Sites

**Constraint:**

* Cleanup is request-driven

**Mitigation (Already compliant):**

* Cleanup runs on **any** request:

  * Authenticated
  * Public (non-PII endpoints)

✔ No compliance breach
✔ Explicitly accepted residual risk

---

## 5. Unavoidable Constraints (Explicitly Flagged)

These cannot be eliminated without violating Compliance Authority decisions.

### 5.1 No Absolute Wall-Clock Guarantees

* If **no HTTP requests occur after day 90**, cleanup executes on next request
* This is explicitly accepted in Compliance output

✔ Still compliant
✔ Deterministic once request occurs

---

### 5.2 Table Engine Enforcement

* Plugin **must enforce InnoDB**
* Activation must fail loudly if unsupported

⚠️ This is a **hard technical guardrail**, not optional

---

### 5.3 Bounded Cleanup Only

* Cleanup **must always be limited**
* Full-table cleanup in one request is unsafe

✔ Already mandated
✔ Compatible with shared hosting limits

---

## 6. Explicit Non-Issues (Confirmed)

The following are **not blockers** on shared hosting:

* JWT auth
* REST API throughput
* Synchronous deletion
* Cascade deletes
* Retention enforcement
* Audit-log expiry via `expires_at`

---

## 7. Risks (Technical, Not Compliance)

| Risk                          | Status             | Notes                       |
| ----------------------------- | ------------------ | --------------------------- |
| Poorly configured DB (MyISAM) | ⚠️ Guarded         | Detect + fail activation    |
| Extremely large log tables    | ⚠️ Managed         | Bounded deletes             |
| Plugin conflicts              | ⚠️ General WP risk | Namespacing + custom tables |

No unresolved **blocking** risks identified.

---

## 8. Exit Criteria Assessment

| Exit Criterion                       | Status |
| ------------------------------------ | ------ |
| Execution model technically feasible | ✔ Yes  |
| Hosting assumptions explicit         | ✔ Yes  |
| WP Admin dependency eliminated       | ✔ Yes  |
| Constraints explicit and bounded     | ✔ Yes  |

---

## Final Position — WordPress Backend Expert

**The Phase 1A compliance execution model is fully implementable on typical UK shared hosting**, using standard WordPress + MySQL capabilities, **without violating any hard constraints**.

No compliance escalation required from a backend feasibility standpoint.

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

## QA & Risk Analysis — Phase 1A

**Role:** QA & Risk Analyst
**Authority:** Advisory (cannot override Compliance / Security)
**Scope:** Failure modes, edge cases, test scenarios, gaps
**Status:** Review complete — conditional risks identified

---

## 1. High-Risk Failure Scenarios

### 1.1 Silent PII Leakage via “Non-PII” Logs

**Risk:**
Despite strict field definitions, developers may accidentally log:

* `booking_id` in notification logs
* Error payloads containing emails/phones
* Third-party provider responses with embedded PII

**Failure Mode:**

* Logs become personal data unknowingly
* Retention rules silently violated
* Erasure scope incorrectly bypassed

**QA Position:**
This is a **systemic regression risk**, not a one-off bug.

**Required Tests:**

* Static audit of all log write paths
* Runtime test: trigger failures and inspect persisted logs
* Ensure provider SDK responses are sanitised before logging

**Assumption Flagged:**
Developers strictly adhere to log schema.
⚠️ This is **not enforceable by policy alone**.

---

### 1.2 Transaction Boundary Drift in WordPress

**Risk:**
WordPress does not natively manage DB transactions.

**Failure Modes:**

* A `COMMIT` occurs after partial deletion
* An exception occurs after some tables are deleted
* Another plugin issues queries inside the same connection

**Impact:**

* Partial erasure → direct GDPR violation (Art. 17)

**QA Position:**
This is a **high-severity technical fragility**, even if feasible.

**Required Tests:**

* Forced failure mid-transaction (e.g. FK violation)
* Assert zero residual rows across *all* cascade targets
* Concurrent request simulation during deletion

**Escalation Condition:**
If transactional isolation cannot be proven → **Compliance escalation required**

---

### 1.3 Request-Driven Cleanup Starvation

**Risk:**
Retention cleanup depends on HTTP requests.

**Edge Case:**

* Site receives traffic once every 6–12 months
* Logs exceed 90 days before next request

**Compliance Position:**
Accepted *once a request occurs* — but…

**QA Concern:**
From an audit perspective, evidence must show:

* Why data exceeded 90 days
* Why this is still compliant

**Required Tests / Evidence:**

* Table design enforces `expires_at` on insert
* API must never return expired rows
* Audit documentation explicitly explains request-driven model

**Residual Risk:**
⚠️ Medium — accepted but must be **documented defensively**

---

## 2. Edge Cases Requiring Explicit Test Coverage

### 2.1 Consent Withdrawal Timing

**Scenario:**

* Consent withdrawn while reminder execution is in progress

**Risks:**

* Reminder sent after withdrawal
* Execution record recreated after deletion

**Test Scenarios:**

* Withdraw consent milliseconds before reminder send
* Assert no reminder execution record persists
* Assert no outbound request occurs

---

### 2.2 Concurrent Erasure Requests

**Scenario:**

* Two erasure requests for same client arrive concurrently

**Risks:**

* Deadlocks
* One request succeeds, one partially fails
* Inconsistent API responses

**Test Scenarios:**

* Parallel erasure calls
* Idempotency validation
* Second call returns deterministic, non-error response

---

### 2.3 Refresh Tokens & Sessions

**Risk:**
Tokens are listed as mandatory cascade targets, but:

* Long-lived JWT refresh tokens are notoriously easy to miss
* Token storage location ambiguity (DB vs cache)

**QA Gap Identified:**
Storage mechanism for:

* Refresh tokens
* Session invalidation
  is not described here (may exist elsewhere)

**Required QA Action:**

* Enumerate *all* token persistence locations
* Verify deletion on:

  * Client erasure
  * Consent withdrawal (if applicable)

⚠️ **If any token survives erasure → critical security incident**

---

## 3. Assumptions That Must Be Actively Tested

### 3.1 “Any Request” Includes Public Endpoints

**Assumption:**
Cleanup runs on *any* request, including unauthenticated ones.

**Risks:**

* Middleware short-circuits public routes
* Cleanup logic is only attached to authenticated flows

**Test Scenarios:**

* Hit lowest-privilege public endpoint
* Verify cleanup query executes
* Verify bounded execution time

---

### 3.2 InnoDB Enforcement Is Reliable

**Assumption:**
Activation fails if InnoDB unsupported.

**Edge Case:**

* Mixed engine environments
* Table created as InnoDB, but altered later by host tooling

**QA Recommendation:**

* Runtime assertion on every deletion transaction
* Fail loudly if engine mismatch detected

---

## 4. Negative Testing (Adversarial)

### 4.1 Plugin Conflict Injection

**Scenario:**

* Another plugin hooks into `rest_api_init` or DB queries

**Risks:**

* Extra queries inside transaction
* Unexpected commits / rollbacks

**Test Scenarios:**

* Simulated conflicting plugin
* Verify deletion atomicity holds

---

### 4.2 Error Handling Pathways

**Risk:**
Error handlers often log “helpful context”.

**Test Scenarios:**

* Force DB error during deletion
* Inspect logs for accidental PII
* Ensure API response does not echo identifiers

---

## 5. Documentation & Audit Gaps (Non-Code)

### 5.1 Audit Defensibility

**QA Finding:**
While implementation is compliant, **audit narrative is fragile** unless documented.

**Missing Artifacts:**

* Explicit explanation of request-driven retention
* Rationale for low-traffic behaviour
* Mapping of data classes → tables → lifecycles

**Risk:**
Auditor interprets delayed cleanup as policy failure.

---

## 6. Summary Risk Register (QA View)

| Risk                                      | Severity | Status                |
| ----------------------------------------- | -------- | --------------------- |
| Accidental PII in logs                    | High     | ⚠️ Active risk        |
| Partial deletion due to transaction drift | High     | ⚠️ Must test          |
| Token persistence after erasure           | High     | ⚠️ Gap                |
| Cleanup starvation optics                 | Medium   | Accepted but document |
| Plugin interaction side effects           | Medium   | Test required         |

---

## 7. QA Gate Position — Phase 1A

**Compliance:** ✔ Not challenged
**Feasibility:** ✔ Not challenged
**QA Position:** ⚠️ **Conditionally pass**

### Conditions to Clear QA Gate:

* Transaction atomicity proven under failure
* Log paths audited for PII leakage
* Token/session deletion verified end-to-end
* Request-driven cleanup demonstrably runs on public endpoints
* Audit narrative documented

**No new requirements introduced.**
**No compliance decisions overridden.**

---

**QA & Risk Analyst Final Note:**
This design is *compliant by intent*, but **fragile by execution**.
Without aggressive negative testing, the system is at high risk of *accidental non-compliance*, not deliberate failure.
