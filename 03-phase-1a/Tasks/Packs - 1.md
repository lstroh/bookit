STOP — more than **5 atomic implementation tasks** are required for this frozen input.

Per your HARD OUTPUT CONSTRAINTS, I will **NOT** generate tasks.

---

## Proposed Execution Packs (Deterministic, Non-Overlapping)

Each Execution Pack must be processed **one at a time** in a separate request.

### Execution Pack 1 — REST Auth Endpoint: `/auth/login`

Scope:

* Route registration
* Rate limiting (IP-based, pre-flight)
* Request validation
* Error semantics (401 / 429 only)
* Response shape (no JWT internals)

---

### Execution Pack 2 — REST Auth Endpoint: `/auth/refresh`

Scope:

* Route registration
* Refresh-token-only auth flow
* Token family rate limiting
* Reuse detection error handling (401 / 403 / 429)
* Response shape (no JWT internals)

---

### Execution Pack 3 — JWT Validation Middleware (Authenticated APIs)

Scope:

* Authorization header extraction
* JWT signature + claim validation
* Fail-closed behavior
* Scope enforcement → 403
* Uniform 401 error semantics

---

### Execution Pack 4 — Rate Limiting Infrastructure (REST Layer)

Scope:

* Pre-controller enforcement
* Key strategies (IP / token family / jti)
* 429 responses with `retry_after`
* Hard stop on breach
* No silent throttling

---

### Execution Pack 5 — Error Semantics & Response Normalization

Scope:

* Centralized error helpers
* Contractual JSON shapes
* 401 vs 403 boundary enforcement
* No information leakage
* Consistency across auth surfaces

---

## Next Step

Please provide **ONE** of the above Execution Packs as the next input.

Do **NOT** combine packs.
Do **NOT** summarize or restate requirements.
Paste only the frozen inputs relevant to the selected pack.
