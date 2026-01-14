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

## Task 2 — IP-Based Rate Limiting (Pre-flight)

### 1. Task Metadata

* **Task ID:** EP1-T2
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP1-T1
* **Objective:** Enforce IP-based rate limiting for `/auth/login` before controller execution.

---

### 2. Scope Definition

**In-scope**

* Rate limit check in `permission_callback`
* IP-based keying
* Hard stop with 429 response
* `retry_after` field

**Out-of-scope**

* Token-family limits
* JWT-based limits
* Abuse signaling
* Persistent storage design

**Files allowed**

* `includes/rest/rate-limit/auth-login-ip.php` (new)
* `includes/rest/routes/auth-login.php` (modify)

**Files that MUST NOT be touched**

* Global rate limit systems
* Refresh endpoint logic
* JWT revocation logic

---

### 3. Cursor Implementation Prompt

```
You are implementing rate limiting for a REST endpoint.

Task:
- Enforce 5 requests per minute per IP
- Check MUST occur in permission_callback
- On breach:
  - Return WP_Error
  - HTTP 429
  - Body: { "error": "rate_limited", "retry_after": 60 }
- If rate-limited, controller MUST NOT execute

DO:
- Key strictly by client IP
- Fail closed

DO NOT:
- Log identifiers
- Reveal internal counters
- Continue processing after limit breach
- Add silent throttling

Security:
- Rate limiting must be explicit and visible

STOP IMMEDIATELY if:
- You need to decide storage strategy beyond provided utilities
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for IP-based rate limiting.

Test location:
- tests/rest/auth/test-auth-login-rate-limit.php

Test cases:
- 5 requests allowed within 60 seconds
- 6th request returns 429
- retry_after equals 60
- Controller callback is not invoked on 429

Negative cases:
- Different IPs do not share limits

DO NOT:
- Mock JWTs
- Modify production code
```

---

### 5. Manual Verification Checklist

* Verify permission_callback executes before handler
* Verify 429 response body matches contract
* Verify no further logic executes after breach

**Common failure modes**

* Rate limiting after controller execution
* Incorrect HTTP status
* Missing retry_after

---

### 6. Escalation Flags

* If IP cannot be reliably determined → **STOP**
* If rate limiting storage is unavailable → **STOP**

---

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
