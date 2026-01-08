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
