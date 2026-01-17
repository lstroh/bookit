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

Perfect — this clarification **resolves the ambiguity correctly** and keeps authority boundaries intact.

Because the **rate-limit key is now explicitly DB-derived and server-side only**, we must **update EP2 tasks** to remove any notion of a client-visible or token-embedded *family identifier*.

Per your instruction:

* **EP2-T1 is already completed → reused unchanged**
* We will **surgically update EP2-T2 and EP2-T3**
* No new tasks added
* No scope expansion
* Still ≤5 tasks total

Below is the **UPDATED Execution Pack 2**, with **only the necessary corrections applied**.

---

# 🔄 Execution Pack 2 — `/auth/refresh` (UPDATED)

---

## ✅ EP2-T1 — Register `/auth/refresh` REST Route

**Status:** COMPLETED
(No changes)

---

## 🔁 EP2-T2 — Server-Side Token-Family Rate Limiting (UPDATED)

### 1. Task Metadata

* **Task ID:** EP2-T2
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T1
* **Objective:** Enforce refresh rate limiting **per token family**, resolved internally from the database.

---

### 2. Scope Definition

**In-scope**

* Hash incoming `refresh_token`
* DB lookup for matching refresh token row
* Read `family_internal_id` from DB
* Rate limit: **10 refreshes per family per 60 minutes**
* Immediate 429 on breach

**Out-of-scope**

* Client-provided family identifiers
* JWT claims
* IP-based limits
* Abuse heuristics

**Files allowed**

* `includes/rest/rate-limit/auth-refresh-family.php` (new)
* `includes/rest/routes/auth-refresh.php` (modify)

**Files that MUST NOT be touched**

* Login rate limiter
* JWT middleware
* DB schema definitions

---

### 3. Cursor Implementation Prompt

```
You are implementing server-side rate limiting for a REST endpoint.

Target endpoint:
- POST /wp-json/bookit/v1/auth/refresh

Authoritative flow:
1. Read refresh_token from JSON body
2. Hash refresh_token
3. Look up matching DB row
4. If not found → STOP (handled elsewhere)
5. Read family_internal_id from DB row
6. Count refresh attempts for this family_internal_id
   - Window: last 60 minutes
   - Limit: 10
7. If limit exceeded:
   - Return HTTP 429
   - Body:
     {
       "error": "rate_limited",
       "retry_after": 3600
     }
   - STOP execution

DO:
- Derive family identifier ONLY from DB
- Enforce rate limiting before reuse detection and rotation
- Fail closed

DO NOT:
- Expect family identifiers from the client
- Read JWT claims
- Key by IP
- Continue execution after 429

Security:
- Token-family identity is server-authoritative
- No information leakage

STOP IMMEDIATELY if:
- You need to invent a client-visible family identifier
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for server-side refresh token family rate limiting.

Test location:
- tests/rest/auth/test-auth-refresh-rate-limit.php

Test cases:
1. Valid refresh token resolves to a family_internal_id
2. ≤10 refresh attempts in 60 minutes succeed
3. 11th attempt returns:
   - HTTP 429
   - { "error": "rate_limited" }
   - retry_after = 3600
4. Rate limiting is keyed by family_internal_id, not token value
5. Controller is not executed after 429

DO NOT:
- Pass family identifiers via request
- Modify production code
```

---

### 5. Manual Verification Checklist

* Confirm family ID is resolved from DB, not request
* Confirm rate limit applies across rotated tokens
* Confirm retry_after is correct

---

### 6. Escalation Flags

* If family_internal_id is not available from DB → **STOP**
* If rate limit executes after reuse detection → **STOP**

---

## 🔁 EP2-T3 — Refresh Token Validation, Reuse Detection & Rotation (UPDATED)

### 1. Task Metadata

* **Task ID:** EP2-T3
* **Phase / Sub-phase:** Phase 2 — REST API / Auth
* **Depends on:** EP2-T2
* **Objective:** Validate refresh token, detect reuse, and rotate within same family.

---

### 2. Scope Definition

**In-scope**

* Hash incoming refresh_token
* DB lookup
* Reuse detection via `used_at`
* Family-wide revocation on reuse
* Rotation:

  * Mark old token `used_at`
  * Issue new refresh token
  * Preserve same `family_internal_id`

**Out-of-scope**

* JWT generation
* DB schema changes
* Grace windows

---

### 3. Cursor Implementation Prompt

```
Implement refresh token validation and rotation.

Authoritative flow:
1. Read refresh_token from request body
2. Hash token
3. DB lookup
4. If not found:
   - Return 401
   - { "error": "invalid_refresh_token" }
5. If used_at already set:
   - Revoke entire token family
   - Return 403
   - { "error": "refresh_token_reuse_detected" }
6. Else:
   - Mark old token used_at
   - Issue new refresh token
   - Reuse same family_internal_id

DO:
- Treat reuse as a hard security event
- Fail closed

DO NOT:
- Allow partial success
- Implement grace windows
- Expose token state

STOP IMMEDIATELY if:
- Token reuse semantics are unclear
```

---

### 4. Unit Test Prompt (Separate)

```
Write PHPUnit tests for refresh token validation and reuse detection.

Test location:
- tests/rest/auth/test-auth-refresh-validation.php

Test cases:
- Missing token → 401 invalid_refresh_token
- Invalid token → 401 invalid_refresh_token
- used_at already set → 403 refresh_token_reuse_detected
- Valid unused token rotates successfully
- Rotated token keeps same family_internal_id

DO NOT:
- Assert JWT contents
```

---

### 5. Manual Verification Checklist

* Verify reuse revokes entire family
* Verify rotation preserves family_internal_id
* Verify no partial success paths

---

### 6. Escalation Flags

* If reuse detection is not DB-authoritative → **STOP**

---

## EP2-T4 & EP2-T5

✅ **Remain unchanged**
(Error semantics + success response shape are still valid)

---

## ✅ Final Status

* Ambiguity resolved **without guessing**
* REST / Security boundary preserved
* Cursor no longer blocked
* EP2 is now **fully implementation-safe**

When ready, we can proceed to **Execution Pack 3 — JWT Validation Middleware**.


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
