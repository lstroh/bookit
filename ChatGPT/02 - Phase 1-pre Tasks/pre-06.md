Great question — **PRE-06 is the last guardrail before feature work touches persistence**.

Up to PRE-05 you proved:

* PHPUnit works
* WP test runtime works
* Plugin can load safely

**PRE-06 proves something even more important**:

> *The plugin can be activated and deactivated inside WordPress tests without side effects.*

This is critical because **every real feature phase will implicitly rely on activation safety** (migrations, options, cleanup later).

---

# ✅ PRE-06 — Cursor Execution Pack

**Safe Plugin Activation & Deactivation (No-Op, Test-Proven)**

---

## 🎯 What PRE-06 Is (Exactly)

PRE-06 introduces:

* Explicit plugin **activation & deactivation hooks**
* Hooks are **intentionally no-op**
* Hooks are **tested inside WP_UnitTestCase**

This proves:

* Activation lifecycle is wired correctly
* Future migrations can be added safely
* No accidental side effects occur on activation

---

## 🚫 What PRE-06 Is NOT

PRE-06 must **not**:

* Create database tables
* Write options
* Register cron jobs
* Flush rewrite rules
* Touch JWT, auth, or booking logic
* Introduce migrations

**Hooks exist, but do nothing.**

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-06 for a WordPress plugin.

This task introduces activation and deactivation hooks,
but they MUST be no-op and have zero side effects.

If any instruction is unclear, STOP and ask.

---

TASK ID:
PRE-06

OBJECTIVE:
Add safe, test-proven plugin activation & deactivation hooks.

CONTEXT:
PRE-05 proved the plugin can load inside WP tests.
PRE-06 proves lifecycle hooks are wired correctly.

---

ALLOWED BEHAVIOR:
- Register activation hook
- Register deactivation hook
- No-op handler methods
- WP_UnitTestCase tests invoking hooks

---

DISALLOWED BEHAVIOR:
- Database writes
- Option writes
- Cron registration
- Rewrite flush
- Feature logic
- Migrations

---

FILES TO CREATE OR MODIFY:

1. booking-plugin.php (or plugin entry file)
2. src/Infrastructure/Plugin.php
3. tests/Infrastructure/PluginLifecycleTest.php

---

REQUIRED IMPLEMENTATION DETAILS:

### Plugin lifecycle
- Activation and deactivation hooks MUST be registered
- Hook callbacks MUST delegate to methods on the main Plugin class
- Methods must be empty (documented no-op)

---

### tests/Infrastructure/PluginLifecycleTest.php
- Extend WP_UnitTestCase
- Two tests only:
  1. test_plugin_activation_does_not_fail()
  2. test_plugin_deactivation_does_not_fail()

Allowed assertions:
- No exception thrown
- True is true (placeholder)

Disallowed assertions:
- DB state
- Options
- Hooks
- Tables
- Cron

---

OUT OF SCOPE:
- Migrations
- Schema
- Cleanup logic
- Feature enabling

---

DELIVERABLES:
- Plugin activates cleanly in WP tests
- Plugin deactivates cleanly in WP tests
- Zero side effects

After completing the task:
- List all modified files
- Show lifecycle hook registration
- Show PluginLifecycleTest.php
```

---

# ✅ What You Should Expect Cursor to Produce

---

## 📄 booking-plugin.php (or main plugin file)

✅ Expected pattern:

```php
register_activation_hook(__FILE__, [\BookingPlugin\Infrastructure\Plugin::class, 'activate']);
register_deactivation_hook(__FILE__, [\BookingPlugin\Infrastructure\Plugin::class, 'deactivate']);
```

❌ Reject if:

* Logic is inlined
* Anonymous functions used
* Side effects occur

---

## 📄 src/Infrastructure/Plugin.php

✅ Acceptable:

```php
public static function activate(): void
{
    // Intentionally left blank (PRE-06)
}

public static function deactivate(): void
{
    // Intentionally left blank (PRE-06)
}
```

❌ Reject if:

* Options updated
* DB accessed
* TODOs implying behavior

---

## 📄 tests/Infrastructure/PluginLifecycleTest.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Tests\Infrastructure;

use WP_UnitTestCase;

final class PluginLifecycleTest extends WP_UnitTestCase
{
    public function test_plugin_activation_does_not_fail(): void
    {
        $this->assertTrue(true);
    }

    public function test_plugin_deactivation_does_not_fail(): void
    {
        $this->assertTrue(true);
    }
}
```

❌ Reject if:

* Activation logic asserted
* DB inspected
* More than two tests

---

# 🔍 How to Confirm Cursor Worked as Expected

---

## 1️⃣ Run PHPUnit

```bash
vendor/bin/phpunit
```

✅ Expected:

* All previous tests still pass
* Lifecycle tests pass
* No warnings or notices

---

## 2️⃣ Negative Control (Critical)

Temporarily add a side effect inside `activate()`:

```php
update_option('should_not_exist', 'yes');
```

Re-run PHPUnit.

✅ Expected:

* Tests still pass (because we’re not asserting behavior)
* BUT you should now manually see the option added

Remove the code immediately.

This confirms:

> Hooks are *real* and will matter later

---

## 3️⃣ Manual WP Activation (Optional)

In a local WP install:

* Activate plugin
* Deactivate plugin

✅ Expected:

* No errors
* No DB changes
* No notices

---

## 4️⃣ Lifecycle Readiness Check

Confirm:

* Activation path is explicit
* Deactivation path is explicit
* Future migrations have a clear home

This prevents **chaotic migrations later**.

---

# 🏁 PRE-06 Exit Criteria (Frozen)

PRE-06 is complete only if:

* ✅ Activation hook registered
* ✅ Deactivation hook registered
* ✅ Hooks delegate to Plugin class
* ✅ Hooks are no-op
* ✅ Activation & deactivation tested in WP tests
* ✅ No side effects observed

Once PRE-06 is frozen:

> **You are cleared to touch persistence in controlled phases (schemas, options, tokens).**

---

# 🔜 What Comes Next (Natural Progression)

Next logical execution packs:

* **Phase-1A-01** — Auth route registration (`/auth/login`)
* **Phase-1A-02** — Rate limiting (in-memory first)
* **Phase-1A-03** — JWT issuance & revocation

Each will:

* Add real behavior
* Include unit + WP integration tests
* Be small and Cursor-safe

If you want, I’ll convert **Phase-1A-01** into the same execution-pack format next.
