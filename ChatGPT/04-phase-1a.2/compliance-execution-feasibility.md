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
