Yes — **PRE-05 is the final “arming” step before real feature work**.

It is where we **allow the plugin to be loaded inside the WordPress test runtime**, while still **forbidding any business behavior**.

After PRE-05:

* Cursor can safely write **real REST endpoints, auth, security**
* Tests can exercise **actual plugin loading**
* You still haven’t committed to schemas, cron, or logic

This is the **last irreversible test-infra step**.

---

# ✅ PRE-05 — Cursor Execution Pack

**Controlled Plugin Loading in WordPress Tests**

---

## 🎯 What PRE-05 Is (Exactly)

PRE-05 enables **explicit, controlled plugin loading** in the WordPress test environment.

Key idea:

> The plugin may now load — but must do *nothing observable*.

This proves:

* Autoloading works under WP
* Plugin bootstrap is safe
* No side effects occur on load

---

## 🚫 What PRE-05 Is NOT

PRE-05 must **not**:

* Register REST routes
* Create database tables
* Register cron jobs
* Add rewrite rules
* Attach hooks with behavior
* Perform auth, JWT, or rate limiting

**Plugin load ≠ plugin behavior**

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-05 for a WordPress plugin.

This task allows the plugin to load inside WordPress tests,
but must introduce ZERO observable behavior.

If any instruction is unclear, STOP and ask.

---

TASK ID:
PRE-05

OBJECTIVE:
Enable controlled plugin loading in WordPress test environment.

CONTEXT:
PRE-04 added WP_UnitTestCase and WordPress test bootstrap.
PRE-05 loads the plugin safely inside WP tests.

---

ALLOWED BEHAVIOR:
- Loading the plugin main file in WP tests
- Minimal bootstrap wiring
- No-op hooks (if unavoidable)

---

DISALLOWED BEHAVIOR:
- REST route registration
- Database access
- Cron scheduling
- Option writes
- JWT or auth logic
- Any booking-related logic

---

FILES TO CREATE OR MODIFY:

1. tests/wp-bootstrap.php (update)
2. tests/Infrastructure/PluginLoadTest.php

---

REQUIRED IMPLEMENTATION DETAILS:

### tests/wp-bootstrap.php
- After WordPress bootstrap:
  - Load the plugin main file explicitly
- Do NOT call plugin activation hooks
- Do NOT register custom hooks here

---

### tests/Infrastructure/PluginLoadTest.php
- Extend WP_UnitTestCase
- One test only:
  - test_plugin_loads_without_side_effects()

Allowed assertions:
- Plugin main class exists
- Plugin version constant exists (if defined)

Disallowed assertions:
- REST routes exist
- Tables exist
- Options exist
- Hooks fired

---

ASSUMPTIONS:
- Plugin entry file already exists (from PRE-02)
- Plugin main class is autoloadable

---

OUT OF SCOPE:
- Activation / deactivation hooks
- Feature testing
- REST requests
- Database inspection

---

DELIVERABLES:
- PHPUnit runs with plugin loaded
- No side effects observed
- Tests pass consistently

After completing the task:
- List all modified files
- Show updated wp-bootstrap.php
- Show PluginLoadTest.php
```

---

# ✅ What You Should Expect Cursor to Produce

---

## 📄 tests/wp-bootstrap.php (Updated)

✅ Acceptable pattern:

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

$wpTestsDir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

require_once $wpTestsDir . '/includes/functions.php';
require_once $wpTestsDir . '/includes/bootstrap.php';

/**
 * Load the plugin under test.
 */
require_once dirname(__DIR__) . '/booking-plugin.php';
```

❌ Reject if:

* Activation hooks invoked
* Plugin logic executed conditionally
* Globals modified

---

## 📄 tests/Infrastructure/PluginLoadTest.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Tests\Infrastructure;

use WP_UnitTestCase;
use BookingPlugin\Infrastructure\Plugin;

final class PluginLoadTest extends WP_UnitTestCase
{
    public function test_plugin_loads_without_side_effects(): void
    {
        $this->assertTrue(class_exists(Plugin::class));
    }
}
```

❌ Reject if:

* Assertions about REST routes
* DB queries
* Hook inspection
* More than one test

---

# 🔍 How to Confirm Cursor Worked as Expected

---

## 1️⃣ Run PHPUnit

```bash
vendor/bin/phpunit
```

✅ Expected:

* All previous tests still pass
* PluginLoadTest passes
* No warnings or notices

---

## 2️⃣ Side-Effect Detection (Critical)

Add temporary debug code to detect side effects:

```php
add_action('init', function () {
    throw new Exception('Side effect detected');
});
```

Re-run PHPUnit.

✅ Expected:

* Test FAILS immediately

Remove the code → tests pass again.

This confirms:

> Plugin load path is clean and observable

---

## 3️⃣ Database Sanity Check

After PHPUnit run:

* No new tables created
* No new options added

You can confirm via:

```sql
SHOW TABLES;
SELECT * FROM wp_options ORDER BY option_id DESC LIMIT 5;
```

✅ Expected: nothing new.

---

## 4️⃣ Hook Isolation Check

Confirm:

* No custom hooks registered automatically
* No REST routes registered

This ensures:

> Phase 1 endpoints won’t inherit hidden behavior

---

# 🏁 PRE-05 Exit Criteria (Frozen)

PRE-05 is complete only if:

* ✅ Plugin loads inside WP tests
* ✅ No activation logic executed
* ✅ No DB writes occur
* ✅ No REST routes registered
* ✅ Tests assert existence only

Once frozen:

> **You are officially allowed to implement Phase 1 endpoints and security logic**

---

# 🔜 What Comes Next (This Is the Big Shift)

From here, **every Cursor task becomes real engineering**.

Recommended next execution packs:

* **Phase-1A-01** — `/auth/login` route registration
* **Phase-1A-02** — Rate limiting middleware
* **Phase-1A-03** — JWT issuance & revocation

Each will:

* Modify production code
* Include unit + WP integration tests
* Respect the gates you already froze

If you want, I’ll convert **Phase-1A-01** into the same Cursor-safe execution format next.
