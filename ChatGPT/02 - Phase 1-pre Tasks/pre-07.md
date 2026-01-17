Short answer: **yes, there is one more PRE task — but JWT itself is *not* a PRE task**.

You’re asking exactly the right question, so I’ll be very precise and conservative here.

---

## 🔒 First: What PRE tasks are allowed to do (rule reminder)

**PRE tasks may only do infrastructure, wiring, and safety scaffolding.**
They must **not**:

* Change system behavior
* Introduce security policy
* Issue tokens
* Make trust decisions
* Create persistence models

JWT **is a trust system**, so it cannot be a PRE task.

---

## ✅ The Final Missing PRE Task (Optional but Strongly Recommended)

### 🧱 PRE-07 — Cryptographic Readiness & Dependency Lock

This is the *last* legitimate PRE task.

It does **not implement JWT**, but it ensures:

* Crypto dependencies are locked
* Algorithms are explicitly constrained
* No future agent can “wing it” with insecure defaults

---

# ✅ PRE-07 — What It Is (Exactly)

PRE-07 introduces:

* A **cryptography policy boundary**
* Locked libraries
* Explicit algorithm allow-list

But:

> **No tokens are created, verified, or decoded**

---

## 🚫 What PRE-07 Is NOT

PRE-07 must **not**:

* Generate JWTs
* Validate JWTs
* Store secrets
* Register auth middleware
* Create REST endpoints
* Make security decisions

---

## 🧑‍💻 PRE-07 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-07 for a WordPress plugin.

This task prepares cryptographic dependencies ONLY.
No authentication or authorization behavior is allowed.

If any instruction is unclear, STOP and ask.

---

TASK ID:
PRE-07

OBJECTIVE:
Prepare cryptographic dependencies and lock security defaults.

CONTEXT:
PRE-06 completed safe plugin lifecycle wiring.
PRE-07 ensures JWT implementation later cannot be insecure by default.

---

ALLOWED BEHAVIOR:
- Add cryptographic libraries as dependencies
- Create configuration constants
- Document allowed algorithms

---

DISALLOWED BEHAVIOR:
- JWT creation
- JWT verification
- Token parsing
- Key storage
- REST endpoints
- Security decisions

---

FILES TO CREATE OR MODIFY:

1. composer.json
2. src/Security/CryptoConfig.php

---

REQUIRED IMPLEMENTATION DETAILS:

### composer.json
- Add dependency:
  - firebase/php-jwt
- Lock version explicitly
- Do NOT add scripts

---

### src/Security/CryptoConfig.php
- Namespace: BookingPlugin\Security
- Class: CryptoConfig
- Public constants ONLY:
  - ALLOWED_JWT_ALGOS (array)
  - JWT_LEEWAY_SECONDS (int)

Example:
- ALLOWED_JWT_ALGOS = ['HS256']
- JWT_LEEWAY_SECONDS = 60

No methods allowed.
No secret values allowed.

---

OUT OF SCOPE:
- Env vars
- Secret handling
- Token TTL
- Key rotation

---

DELIVERABLES:
- Dependencies installed
- Config class exists
- No executable behavior added

After completing the task:
- List modified files
- Show composer.json diff
- Show CryptoConfig.php
```

---

# ✅ What You Should Expect Cursor to Produce

---

## 📄 composer.json (delta only)

✅ Acceptable:

```json
"require": {
  "firebase/php-jwt": "^6.10"
}
```

❌ Reject if:

* Dev-only dependency
* Unpinned versions
* JWT helpers added elsewhere

---

## 📄 src/Security/CryptoConfig.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Security;

final class CryptoConfig
{
    public const ALLOWED_JWT_ALGOS = ['HS256'];
    public const JWT_LEEWAY_SECONDS = 60;
}
```

❌ Reject if:

* Methods exist
* Secrets exist
* Token TTL defined
* Defaults undocumented

---

# 🔍 How to Confirm Cursor Worked as Expected

---

## 1️⃣ Composer Install

```bash
composer install
```

✅ Expected:

* JWT library installed
* No errors

---

## 2️⃣ Static Safety Check

Search codebase for:

* `JWT::encode`
* `JWT::decode`
* `Authorization`

✅ Expected:

* No matches

---

## 3️⃣ Dependency Lock Check

Open `composer.lock`.

Confirm:

* `firebase/php-jwt` version pinned
* No transitive crypto libs added unexpectedly

---

## 4️⃣ Negative Control

Temporarily attempt to use JWT in code.

✅ Expected:

* You must write new code
* Nothing “just works” implicitly

This proves:

> PRE-07 prepared the ground but didn’t cross the line.

---

# 🏁 PRE-07 Exit Criteria (Frozen)

PRE-07 is complete only if:

* ✅ Crypto library is installed
* ✅ Allowed algorithms are explicit
* ✅ No auth behavior exists
* ✅ No secrets introduced
* ✅ No executable security logic

Once frozen:

> **JWT implementation must occur in Phase 1A only** and will be fully test-driven.

---

# 🔐 Now: When DOES JWT Actually Get Implemented?

JWT belongs to:

### 🔴 Phase 1A — Security Foundations

Specifically:

* Phase-1A-02 → JWT issuance
* Phase-1A-03 → JWT verification & revocation

Those phases:

* Create tokens
* Validate tokens
* Enforce trust boundaries
* Require unit + WP REST tests

---

## ✅ Final Answer (Clear & Direct)

* ✔️ **No more mandatory PRE tasks after PRE-07**
* ❌ **JWT is NOT a PRE task**
* 🔐 **JWT begins only in Phase 1A**
* 🧱 **PRE-07 is the last safe scaffolding step**

If you want next, I can:

* Convert **PRE-07** into Cursor prompts (fully atomic), or
* Start **Phase-1A-01** JWT issuance execution packs

Just tell me which you want to run next.
