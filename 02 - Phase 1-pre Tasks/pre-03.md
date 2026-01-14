Excellent — **PRE-03 is the last “invisible” step before real engineering begins**, and it’s where we *lock the testing spine* so Cursor can’t improvise later.

Below is a **Cursor-safe, atomic PRE-03 execution pack**, aligned with your rules:

* Zero business logic
* No production impact
* Test infra only
* Fully verifiable

---

# ✅ PRE-03 — Cursor Execution Pack

**PHPUnit & Test Infrastructure Bootstrap (Frozen)**

---

## 🎯 What PRE-03 Is (Precisely)

PRE-03 introduces a **testing runtime only**:

* PHPUnit configuration
* Test autoloading
* A single empty test case
* WordPress test bootstrap (but no DB, no REST)

This ensures:

> Every future Cursor task *must* ship with tests.

---

## 🚫 What PRE-03 Is NOT

PRE-03 must **not**:

* Test real plugin behavior
* Touch the database
* Load WordPress hooks
* Register REST routes
* Assert business rules
* Create mocks of future services

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-03 for a WordPress plugin.

This task is TEST INFRASTRUCTURE ONLY.
No production logic is allowed.

If any instruction is unclear, STOP and ask.

---

TASK ID:
PRE-03

OBJECTIVE:
Introduce PHPUnit test infrastructure without testing plugin behavior.

CONTEXT:
PRE-02 created a loadable plugin bootstrap.
PRE-03 prepares the testing spine only.

---

ALLOWED BEHAVIOR:
- PHPUnit config files
- Test bootstrap files
- Empty or trivial test cases
- Composer dev dependencies only

---

DISALLOWED BEHAVIOR:
- Production code changes (except autoload wiring)
- Database access
- REST API calls
- WordPress hooks inside tests
- Assertions about plugin behavior

---

FILES TO CREATE OR MODIFY:

1. composer.json
2. phpunit.xml
3. tests/bootstrap.php
4. tests/Infrastructure/PluginTest.php

---

REQUIRED IMPLEMENTATION DETAILS:

### composer.json
- Add require-dev only:
  - phpunit/phpunit (compatible with PHP 8.x)
- Add autoload-dev:
  - PSR-4 namespace: BookingPlugin\Tests\
  - Map to /tests
- Do NOT add scripts

---

### phpunit.xml
- Bootstrap file: tests/bootstrap.php
- Define testsuite "Booking Plugin"
- No coverage config required

---

### tests/bootstrap.php
- Load Composer autoloader
- Do NOT load WordPress
- Do NOT load the plugin file
- No side effects

---

### tests/Infrastructure/PluginTest.php
- Namespace: BookingPlugin\Tests\Infrastructure
- Class: PluginTest
- One test method only:
  - test_plugin_class_exists()
- Assertion allowed:
  - class_exists(BookingPlugin\Infrastructure\Plugin::class)

No other assertions allowed.

---

OUT OF SCOPE:
- WP_UnitTestCase
- Database setup
- Fixtures
- Mocks
- REST testing

---

DELIVERABLES:
- PHPUnit runs successfully
- One passing test
- Zero production behavior

After completing the task:
- List all modified files
- Show phpunit.xml
- Show tests/Infrastructure/PluginTest.php
```

---

# ✅ What You Should Expect Cursor to Produce

---

## 📄 composer.json (delta only)

✅ Expected additions:

```json
"require-dev": {
  "phpunit/phpunit": "^10.0"
},
"autoload-dev": {
  "psr-4": {
    "BookingPlugin\\Tests\\": "tests/"
  }
}
```

❌ Reject if:

* Prod dependencies added
* Composer scripts added
* Autoload-prod modified

---

## 📄 phpunit.xml

✅ Acceptable:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php">
    <testsuites>
        <testsuite name="Booking Plugin">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

❌ Reject if:

* Coverage config added
* Env vars added
* WP bootstrap referenced

---

## 📄 tests/bootstrap.php

✅ Acceptable:

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';
```

❌ Reject if:

* Plugin file included
* WordPress loaded
* Globals declared

---

## 📄 tests/Infrastructure/PluginTest.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Tests\Infrastructure;

use PHPUnit\Framework\TestCase;
use BookingPlugin\Infrastructure\Plugin;

final class PluginTest extends TestCase
{
    public function test_plugin_class_exists(): void
    {
        $this->assertTrue(class_exists(Plugin::class));
    }
}
```

❌ Reject if:

* Additional tests added
* Assertions about behavior
* Mocking introduced

---

# 🔍 How to Confirm Cursor Worked as Expected

---

## 1️⃣ Install Dev Dependencies

Run:

```
composer install
```

✅ Expect:

* phpunit installed
* No errors

---

## 2️⃣ Run Tests

Run:

```
vendor/bin/phpunit
```

✅ Expected output:

* 1 test
* 1 assertion
* Green

❌ Reject if:

* WordPress errors
* Database errors
* Multiple tests run

---

## 3️⃣ Negative Test (Important)

Temporarily rename:

```
src/Infrastructure/Plugin.php
```

Re-run PHPUnit.

✅ Expected:

* Test fails

Restore file → test passes again.

This proves the test is **real but minimal**.

---

## 4️⃣ “Zero Coupling” Check

Confirm:

* Tests do NOT load WordPress
* Tests do NOT load plugin entry file
* Tests rely only on autoloading

This guarantees future tests can be layered safely.

---

# 🏁 PRE-03 Exit Criteria (Frozen)

PRE-03 is complete only if:

* ✅ PHPUnit runs clean
* ✅ Exactly one test exists
* ✅ Test checks only class existence
* ✅ No WordPress runtime involved
* ✅ No production behavior added

Once frozen:

> **Every future Cursor task must include tests or be rejected**

---

# 🔜 What Comes Next (Safe Path)

Recommended next steps:

**PRE-04 (optional but strong)**

* WordPress test bootstrap (WP_UnitTestCase)
* Still zero business logic

**Phase-2A-01**

* `/auth/login` endpoint
* Rate limiting
* Request validation
* Unit + integration tests

If you want, I can:

* Convert **PRE-04** into Cursor prompts, or
* Start **Phase-2A-01** as an Execution Pack (atomic, test-first)

Just tell me which one you want next.
