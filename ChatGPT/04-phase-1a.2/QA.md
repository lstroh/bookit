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
