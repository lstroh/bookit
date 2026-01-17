Acknowledged. Moving forward **cleanly and correctly**.

Below is **Execution Pack 2 — REST Auth Endpoint: `/auth/refresh`**, decomposed into **≤5 atomic, Cursor-safe implementation tasks**, strictly within the frozen REST API Expert input.

No requirements are ambiguous.
No assumptions are introduced.
No scope leakage from login or JWT validation middleware.

---

# ✅ Execution Pack 2 — `/auth/refresh`

---

## Task 1 — Register `/auth/refresh` REST Route

### 1. Task Metadata

* **Task ID:** EP2-T1
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** None
* **Objective:** Register the `/auth/refresh` REST route with correct namespace, method, and callbacks.

---

### 2. Scope Definition

**In-scope**

* `register_rest_route`
* POST-only enforcement
* Namespace `/wp-json/bookit/v1`
* Public access (no JWT auth)

**Out-of-scope**

* Refresh token validation
* Token rotation logic
* Rate limiting
* Error handling

**Files allowed**

* `includes/rest/routes/auth-refresh.php` (new)
* `includes/rest/routes/index.php` (modify)

**Files that MUST NOT be touched**

* JWT middleware
* Login endpoint
* Database schema
* Booking routes

---

### 3. Cursor Implementation Prompt

```
You are registering a WordPress REST API route.

Target endpoint:
- POST /wp-json/bookit/v1/auth/refresh

Task:
- Register the route using register_rest_route
- Attach:
  - permission_callback (placeholder, return true)
  - callback (stub only, no logic)

DO:
- Enforce POST-only
- Register under rest_api_init
- Return WP_Error "not_implemented" from handler

DO NOT:
- Read request body
- Validate refresh tokens
- Implement rate limiting
- Generate JWTs

STOP IMMEDIATELY if:
- You feel tempted to reuse login logic
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for REST route registration.

Test location:
- tests/rest/auth/test-auth-refresh-route.php

Test cases:
- Route exists at /bookit/v1/auth/refresh
- Only POST method allowed
- Route does not require JWT auth

DO NOT:
- Test token logic
- Modify production code
```

---

### 5. Manual Verification Checklist

* Confirm correct namespace and path
* Confirm POST-only
* Confirm route loads without fatal errors

---

### 6. Escalation Flags

* If route version is unclear → STOP

---

## Task 2 — Token-Family Rate Limiting (Pre-flight)

### 1. Task Metadata

* **Task ID:** EP2-T2
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T1
* **Objective:** Enforce refresh-token-family rate limiting before controller execution.

---

### 2. Scope Definition

**In-scope**

* 10 requests per hour per token family
* Enforcement in `permission_callback`
* Immediate 429 on breach
* `retry_after = 3600`

**Out-of-scope**

* IP-based limits
* JWT-based limits
* Abuse heuristics
* Token revocation logic

**Files allowed**

* `includes/rest/rate-limit/auth-refresh-family.php` (new)
* `includes/rest/routes/auth-refresh.php` (modify)

**Files that MUST NOT be touched**

* Login rate limiter
* Global middleware

---

### 3. Cursor Implementation Prompt

```
Implement rate limiting for a SPECIFIC endpoint.

Target endpoint:
- POST /wp-json/bookit/v1/auth/refresh

Rules:
- Limit: 10 requests per hour
- Keyed by refresh token FAMILY identifier
- Check MUST run in permission_callback
- Controller MUST NOT execute on breach

On breach:
- Return HTTP 429
- Body:
  {
    "error": "rate_limited",
    "retry_after": 3600
  }

DO:
- Apply ONLY to /auth/refresh
- Fail closed

DO NOT:
- Key by IP
- Continue processing after breach
- Log token values

STOP IMMEDIATELY if:
- Token family identifier is unavailable
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for refresh token family rate limiting.

Test location:
- tests/rest/auth/test-auth-refresh-rate-limit.php

Test cases:
- 10 refresh attempts allowed per family per hour
- 11th attempt returns 429
- retry_after equals 3600
- Controller is not executed on 429

Negative:
- Different token families do not share limits
```

---

### 5. Manual Verification Checklist

* Confirm limiter runs before handler
* Confirm only refresh endpoint is affected
* Confirm correct retry_after

---

### 6. Escalation Flags

* If token family cannot be derived → STOP

---

## Task 3 — Refresh Token Validation & Reuse Detection

### 1. Task Metadata

* **Task ID:** EP2-T3
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T1
* **Objective:** Validate refresh token and detect reuse events.

---

### 2. Scope Definition

**In-scope**

* Presence check for `refresh_token`
* Detect invalid token → 401
* Detect reuse → 403
* Immediate family-wide failure

**Out-of-scope**

* Token rotation
* JWT issuance
* DB schema decisions

**Files allowed**

* `includes/rest/validation/auth-refresh.php` (new)
* `includes/rest/routes/auth-refresh.php` (modify)

**Files that MUST NOT be touched**

* JWT middleware
* Login validation

---

### 3. Cursor Implementation Prompt

```
Implement refresh token validation logic.

Rules:
- Require refresh_token in request body
- If token is invalid or unknown:
  - Return 401
  - Body: { "error": "invalid_refresh_token" }
- If token reuse is detected:
  - Revoke entire token family immediately
  - Return 403
  - Body: { "error": "refresh_token_reuse_detected" }

DO:
- Fail closed
- Treat reuse as a hard security event

DO NOT:
- Allow partial success
- Implement grace windows
- Reveal token state

STOP IMMEDIATELY if:
- Reuse detection semantics are unclear
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for refresh token validation.

Test location:
- tests/rest/auth/test-auth-refresh-validation.php

Test cases:
- Missing refresh_token → 401 invalid_refresh_token
- Invalid token → 401 invalid_refresh_token
- Reused token → 403 refresh_token_reuse_detected

DO NOT:
- Test JWT generation
```

---

### 5. Manual Verification Checklist

* Verify reuse causes immediate failure
* Verify no partial success path exists

---

### 6. Escalation Flags

* If reuse detection is not DB-authoritative → STOP

---

## Task 4 — Error Semantics Enforcement (401 / 403 / 429)

### 1. Task Metadata

* **Task ID:** EP2-T4
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T2, EP2-T3
* **Objective:** Enforce contractual error semantics for `/auth/refresh`.

---

### 2. Scope Definition

**In-scope**

* Enforce only allowed errors:

  * 401 invalid_refresh_token
  * 403 refresh_token_reuse_detected
  * 429 rate_limited
* Uniform JSON shapes

**Out-of-scope**

* 400 / 500 handling
* Login error semantics

**Files allowed**

* `includes/rest/errors/auth-refresh.php` (new)
* `includes/rest/routes/auth-refresh.php` (modify)

---

### 3. Cursor Implementation Prompt

```
Normalize ALL /auth/refresh errors.

Allowed responses ONLY:
- 401 { "error": "invalid_refresh_token" }
- 403 { "error": "refresh_token_reuse_detected" }
- 429 { "error": "rate_limited", "retry_after": 3600 }

DO:
- Strip WP default error fields
- Enforce exact error strings

DO NOT:
- Return any other status codes
- Expose internal messages

STOP IMMEDIATELY if:
- Another status code seems necessary
```

---

### 4. Unit Test Prompt (Separate)

```
Write tests for /auth/refresh error semantics.

Test location:
- tests/rest/auth/test-auth-refresh-errors.php

Test cases:
- Invalid token → 401 only
- Reuse → 403 only
- Rate limit → 429 only
- No other status codes possible
```

---

### 5. Manual Verification Checklist

* Force each error path
* Inspect exact JSON body
* Confirm no WP leakage

---

### 6. Escalation Flags

* If Cursor introduces 400 or 500 → STOP

---

## Task 5 — Success Response Shape Stub (No JWT Internals)

### 1. Task Metadata

* **Task ID:** EP2-T5
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T3
* **Objective:** Return correct success response shape for `/auth/refresh`.

---

### 2. Scope Definition

**In-scope**

* Response keys:

  * access_token
  * expires_in
  * refresh_token
  * token_type
  * scope

**Out-of-scope**

* JWT claims
* Token generation
* Expiry calculation

---

### 3. Cursor Implementation Prompt

```
Stub a successful /auth/refresh response.

Rules:
- HTTP 200
- JSON keys EXACTLY:
  - access_token
  - expires_in
  - refresh_token
  - token_type
  - scope

DO:
- Use placeholder values
- Match /auth/login success shape exactly

DO NOT:
- Include JWT internals
- Add or remove keys

STOP IMMEDIATELY if:
- You need to decide JWT content
```

---

### 4. Unit Test Prompt (Separate)

```
Write tests for /auth/refresh success response shape.

Test location:
- tests/rest/auth/test-auth-refresh-success-shape.php

Test cases:
- HTTP 200
- All required keys present
- No extra keys
```

---

### 5. Manual Verification Checklist

* Compare response shape to login
* Confirm refresh_token rotates (placeholder OK)

---

### 6. Escalation Flags

* If response deviates from login shape → STOP

---

✅ **Execution Pack 2 complete**
When ready, we can proceed to **Execution Pack 3 — JWT Validation Middleware**.
