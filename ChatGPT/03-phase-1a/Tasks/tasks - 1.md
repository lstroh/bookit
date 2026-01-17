Below is **Execution Pack 1 — REST Auth Endpoint: `/auth/login`**, translated into **atomic, Cursor-safe implementation tasks**, strictly within the frozen scope and constraints.

No requirements were ambiguous. No assumptions were added.

---

## Task 1 — Register `/auth/login` REST Route

### 1. Task Metadata

* **Task ID:** EP1-T1
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** None
* **Objective:** Register the `/auth/login` REST route with correct method, namespace, and callbacks.

---

### 2. Scope Definition

**In-scope**

* `register_rest_route` call
* HTTP method restriction (`POST` only)
* Namespace and version enforcement
* Hook placement (`rest_api_init`)

**Out-of-scope**

* Authentication logic
* JWT creation
* Rate limiting logic
* Request body validation
* Error handling logic

**Files allowed**

* `includes/rest/routes/auth-login.php` (new)
* `includes/rest/routes/index.php` (modify to include route file)

**Files that MUST NOT be touched**

* JWT utilities
* Database layer
* Any booking-related routes
* Global middleware

---

### 3. Cursor Implementation Prompt

```
You are implementing a WordPress REST API route.

Task:
- Register POST /wp-json/bookit/v1/auth/login
- Use register_rest_route
- Attach:
  - permission_callback (placeholder, return true for now)
  - callback (empty handler stub, no logic)

DO:
- Enforce POST-only
- Use application/json
- Place route registration under rest_api_init
- Keep handler body empty (return WP_Error "not_implemented")

DO NOT:
- Implement authentication
- Read request body
- Add rate limiting
- Generate JWTs
- Add logging

Security & Compliance:
- Do not leak any information
- No side effects

STOP IMMEDIATELY if:
- You need to decide response structure
- You feel tempted to implement auth logic
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for WordPress REST API route registration.

Framework:
- WordPress PHPUnit

Test location:
- tests/rest/auth/test-auth-login-route.php

Test cases:
- Route exists at /bookit/v1/auth/login
- Only POST method is allowed
- GET returns 404 or method_not_allowed
- Route is publicly accessible (no auth required)

DO NOT:
- Test authentication logic
- Test JWTs
- Modify production code
```

---

### 5. Manual Verification Checklist

* Inspect `register_rest_route` parameters
* Confirm namespace is exactly `bookit/v1`
* Confirm route path is exactly `/auth/login`
* Confirm method is POST only
* Confirm route loads without fatal errors

**Common failure modes**

* Wrong namespace
* GET accidentally enabled
* Route registered too late or outside `rest_api_init`

---

### 6. Escalation Flags

* If route namespace/version is unclear → **STOP**
* If Cursor attempts to implement auth logic → **STOP**

---

You’re absolutely right 👍
That is a **legitimate defect** in EP1-T2, and you caught it correctly.

This does **not** change requirements or scope, so we can safely **correct and harden the prompts** without re-planning.

Below is a **corrected, deterministic replacement** for **EP1-T2 only**.
Nothing else in Execution Pack 1 is modified.

---

# 🔧 Correction — EP1-T2 (Clarified & Cursor-Safe)

## Task 2 — IP-Based Rate Limiting (Pre-flight)

---

## 1. Task Metadata (Unchanged)

* **Task ID:** EP1-T2
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP1-T1
* **Objective:** Enforce IP-based rate limiting for **POST `/wp-json/bookit/v1/auth/login`** before controller execution.

---

## 2. Scope Definition (Unchanged)

**In-scope**

* Rate limit enforcement for **POST `/auth/login` only**
* IP-based keying
* Enforcement in `permission_callback`
* Immediate `429` response with `retry_after`

**Out-of-scope**

* Any other endpoint
* JWT-based limits
* Token-family limits
* Abuse heuristics

---

## 3. ✅ Corrected Cursor Implementation Prompt (Copy-Paste Ready)

```
You are implementing IP-based rate limiting for a SPECIFIC WordPress REST endpoint.

Target endpoint (ONLY):
- POST /wp-json/bookit/v1/auth/login

Task:
- Enforce a limit of 5 requests per 60 seconds
- Key rate limits strictly by client IP address
- The check MUST run in the permission_callback for THIS route
- The controller callback MUST NOT execute if the limit is exceeded

On rate limit breach:
- Immediately return WP_Error
- HTTP status: 429
- Response body (exact):
  {
    "error": "rate_limited",
    "retry_after": 60
  }

DO:
- Apply rate limiting ONLY to /auth/login
- Execute rate check before any authentication or validation logic
- Fail closed

DO NOT:
- Apply this limiter to other endpoints
- Perform authentication or credential checks
- Log identifiers or secrets
- Continue processing after a rate-limit breach
- Add silent throttling or delays

Security & Compliance:
- Rate limiting MUST be explicit and visible
- No information leakage about counters or thresholds

STOP IMMEDIATELY if:
- You are unsure which endpoint this applies to
- You feel tempted to reuse this limiter globally
```

---

## 4. ✅ Corrected Unit Test Prompt (Separate, Copy-Paste Ready)

```
Write PHPUnit tests for IP-based rate limiting on a SPECIFIC REST endpoint.

Target endpoint:
- POST /wp-json/bookit/v1/auth/login

Framework:
- WordPress PHPUnit

Test file location:
- tests/rest/auth/test-auth-login-rate-limit.php

Required test cases:
1. Up to 5 POST requests from the same IP within 60 seconds succeed
2. 6th POST request from the SAME IP returns:
   - HTTP 429
   - Body contains { "error": "rate_limited" }
   - retry_after equals 60
3. Controller callback is NOT executed when 429 is returned
4. Requests from a DIFFERENT IP are not affected by the first IP’s limit

Negative / edge cases:
- GET /auth/login is NOT rate-limited by this logic
- Other routes are NOT affected

DO NOT:
- Test JWTs
- Test authentication logic
- Modify production code
```

---

## 5. Manual Verification Checklist (Clarified)

* Confirm rate limiting exists **only** in `/auth/login` permission_callback
* Send 6 rapid POST requests from same IP → 6th returns 429
* Confirm handler logic is never executed on 429
* Send requests from another IP → unaffected

**Common failure modes**

* Rate limiter applied globally
* Rate check after controller logic
* Missing retry_after

---

## 6. Escalation Flags (Unchanged)

* If client IP cannot be reliably determined → **STOP**
* If rate limiting executes outside permission_callback → **STOP**

---

### ✅ Status

EP1-T2 is now **precise, endpoint-scoped, and Cursor-proof**.

Excellent catch — this is exactly the kind of ambiguity that causes agents to over-generalize.
When ready, we can proceed to **Execution Pack 2 — `/auth/refresh`** or continue refining another task if needed.


## Task 3 — Request Body Validation

### 1. Task Metadata

* **Task ID:** EP1-T3
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP1-T1
* **Objective:** Validate `/auth/login` request body schema before authentication.

---

### 2. Scope Definition

**In-scope**

* Presence checks for:

  * `identifier`
  * `secret`
  * `client_type`
* `client_type` allowed values: `mobile`, `web`
* Uniform failure response

**Out-of-scope**

* Credential verification
* Identifier semantics
* Normalization
* Logging

**Files allowed**

* `includes/rest/validation/auth-login.php` (new)
* `includes/rest/routes/auth-login.php` (modify)

**Files that MUST NOT be touched**

* Auth service
* User database queries
* JWT utilities

---

### 3. Cursor Implementation Prompt

```
Implement request validation for POST /auth/login.

Rules:
- Require identifier, secret, client_type
- client_type must be "mobile" or "web"
- On ANY validation failure:
  - Return 401
  - Body: { "error": "invalid_credentials" }

DO:
- Treat all validation failures identically
- Fail closed

DO NOT:
- Reveal which field failed
- Return 400
- Add field-level error messages

Security:
- Validation must not leak account existence

STOP IMMEDIATELY if:
- You feel tempted to distinguish error reasons
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for auth login request validation.

Test location:
- tests/rest/auth/test-auth-login-validation.php

Test cases:
- Missing identifier → 401 invalid_credentials
- Missing secret → 401 invalid_credentials
- Missing client_type → 401 invalid_credentials
- Invalid client_type → 401 invalid_credentials

Negative:
- All fields present passes validation

DO NOT:
- Test authentication success
```

---

### 5. Manual Verification Checklist

* Inspect validation logic
* Confirm identical error response for all failures
* Confirm no field names appear in response

**Common failure modes**

* Returning 400 instead of 401
* Revealing validation detail

---

### 6. Escalation Flags

* If client_type values are unclear → **STOP**

---

## Task 4 — Error Semantics Enforcement (401 / 429 Only)

### 1. Task Metadata

* **Task ID:** EP1-T4
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP1-T2, EP1-T3
* **Objective:** Enforce contractual error semantics for `/auth/login`.

---

### 2. Scope Definition

**In-scope**

* Mapping all failures to:

  * 401 `{ "error": "invalid_credentials" }`
  * 429 `{ "error": "rate_limited", "retry_after": 60 }`
* Eliminate other error codes

**Out-of-scope**

* 403 handling
* Refresh token errors
* JWT errors

**Files allowed**

* `includes/rest/errors/auth-login.php` (new)
* `includes/rest/routes/auth-login.php` (modify)

**Files that MUST NOT be touched**

* Global error handlers
* Other endpoints

---

### 3. Cursor Implementation Prompt

```
Normalize all /auth/login errors.

Rules:
- ONLY allowed responses:
  - 401 invalid_credentials
  - 429 rate_limited
- No other status codes
- No WP default error leakage

DO:
- Wrap WP_Errors as needed
- Enforce uniform JSON shape

DO NOT:
- Expose internal error messages
- Return stack traces

STOP IMMEDIATELY if:
- Another status code seems necessary
```

---

### 4. Unit Test Prompt (Separate)

```
Write tests to assert error semantics.

Test location:
- tests/rest/auth/test-auth-login-errors.php

Test cases:
- Validation failure → 401 invalid_credentials
- Rate limit breach → 429 rate_limited
- No other status codes possible

DO NOT:
- Modify production code
```

---

### 5. Manual Verification Checklist

* Force validation failure → inspect response
* Force rate limit breach → inspect response
* Ensure no WP default error fields appear

---

### 6. Escalation Flags

* If another error code is required → **STOP**

---

## Task 5 — Success Response Shape Stub (No JWT Internals)

### 1. Task Metadata

* **Task ID:** EP1-T5
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP1-T3
* **Objective:** Stub the success response shape without implementing JWT logic.

---

### 2. Scope Definition

**In-scope**

* Static response shape:

  * `access_token`
  * `expires_in`
  * `refresh_token`
  * `token_type`
  * `scope`

**Out-of-scope**

* Token generation
* Claim population
* Expiry logic

**Files allowed**

* `includes/rest/routes/auth-login.php` (modify)

**Files that MUST NOT be touched**

* JWT utilities
* Security services

---

### 3. Cursor Implementation Prompt

```
Stub a successful /auth/login response.

Rules:
- Return HTTP 200
- Return JSON object with correct keys
- Values may be placeholders

DO:
- Match response contract exactly

DO NOT:
- Generate real JWTs
- Include PII
- Include additional fields

STOP IMMEDIATELY if:
- You need to decide JWT contents
```

---

### 4. Unit Test Prompt (Separate)

```
Write tests for success response shape.

Test location:
- tests/rest/auth/test-auth-login-success-shape.php

Test cases:
- Response is 200
- All required keys exist
- No extra keys present

DO NOT:
- Assert token validity
```

---

### 5. Manual Verification Checklist

* Inspect response JSON keys
* Confirm no JWT internals exposed
* Confirm expires_in is numeric

---

### 6. Escalation Flags

* If token fields are unclear → **STOP**

---

✅ **Execution Pack 1 complete**
Ready for **Execution Pack 2 — `/auth/refresh`** when you are.
