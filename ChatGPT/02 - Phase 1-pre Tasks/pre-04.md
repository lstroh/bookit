Perfect timing. **PRE-04 is the “WordPress-aware but still harmless” step** — it introduces the *WordPress testing runtime* without unlocking any product behavior.

Below is a **Cursor-safe, atomic PRE-04 execution pack**, fully aligned with your phase gates and “no silent scope creep” rule.

---

# ✅ PRE-04 — Cursor Execution Pack

**WordPress Test Runtime Bootstrap (WP_UnitTestCase)**

---

## 🎯 What PRE-04 Is (Exactly)

PRE-04 introduces the **official WordPress testing environment**, so future tests can safely:

* Use `WP_UnitTestCase`
* Spin up an isolated WP database
* Test REST routes, hooks, and auth **later**

But in PRE-04:

> **Nothing meaningful is tested yet**

---

## 🚫 What PRE-04 Is NOT

PRE-04 must **not**:

* Register REST routes
* Load plugin hooks
* Touch booking logic
* Create or assert business behavior
* Add cron, JWT, or security logic

This is **infrastructure only**, just like PRE-03.

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-04 for a WordPress plugin.

This task sets up the WordPress testing environment only.
NO business logic or feature tests are allowed.

If anything is unclear, STOP and ask.

---

TASK ID:
PRE-04

OBJECTIVE:
Add WordPress test bootstrap using WP_UnitTestCase.

CONTEXT:
PRE-03 added PHPUnit and basic test infrastructure.
PRE-04 adds WordPress core test loading.

---

ALLOWED BEHAVIOR:
- WordPress test bootstrap files
- WP_UnitTestCase usage
- Test config for WP tests
- Composer dev config if needed

---

DISALLOWED BEHAVIOR:
- Production feature code
- REST routes
- Plugin hooks execution
- Database schema creation
- Assertions about plugin behavior

---

FILES TO CREATE OR MODIFY:

1. phpunit.xml (update)
2. tests/wp-bootstrap.php
3. tests/Infrastructure/WPEnvironmentTest.php

---

REQUIRED IMPLEMENTATION DETAILS:

### phpunit.xml
- Keep existing configuration
- Add a second testsuite named "WordPress"
- That suite must load only tests requiring WP

---

### tests/wp-bootstrap.php
- Load Composer autoloader
- Load WordPress test library bootstrap
- Do NOT load the plugin main file
- Do NOT register hooks

---

### tests/Infrastructure/WPEnvironmentTest.php
- Extend WP_UnitTestCase
- One test only:
  - test_wordpress_test_environment_loaded()
- Allowed assertions:
  - assertTrue( function_exists('do_action') )
  - assertInstanceOf( WP_UnitTestCase::class, $this )

No other assertions allowed.

---

ASSUMPTIONS:
- WordPress test library is available via environment variables
- Use standard WP_TESTS_DIR resolution

---

OUT OF SCOPE:
- REST API testing
- Authentication
- Database assertions
- Plugin activation

---

DELIVERABLES:
- PHPUnit runs with two test suites
- WordPress test suite passes
- No plugin behavior tested

After completing the task:
- List all modified files
- Show phpunit.xml changes
- Show tests/wp-bootstrap.php
- Show WPEnvironmentTest.php
```

---

# ✅ What You Should Expect Cursor to Produce

---

## 📄 phpunit.xml (Updated)

✅ Expected pattern:

```xml
<testsuites>
    <testsuite name="Booking Plugin">
        <directory>tests</directory>
    </testsuite>

    <testsuite name="WordPress">
        <directory suffix="Test.php">tests</directory>
    </testsuite>
</testsuites>
```

❌ Reject if:

* Existing suite removed
* Coverage config added
* Plugin file referenced

---

## 📄 tests/wp-bootstrap.php

✅ Acceptable example:

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

$wpTestsDir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

require_once $wpTestsDir . '/includes/functions.php';

require_once $wpTestsDir . '/includes/bootstrap.php';
```

❌ Reject if:

* Plugin file is loaded
* Hooks are registered
* Globals modified

---

## 📄 tests/Infrastructure/WPEnvironmentTest.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Tests\Infrastructure;

use WP_UnitTestCase;

final class WPEnvironmentTest extends WP_UnitTestCase
{
    public function test_wordpress_test_environment_loaded(): void
    {
        $this->assertTrue(function_exists('do_action'));
        $this->assertInstanceOf(WP_UnitTestCase::class, $this);
    }
}
```

❌ Reject if:

* Any plugin-specific assertion
* REST calls
* Database queries

---

# 🔍 How to Confirm Cursor Worked as Expected

---

## 1️⃣ Install WordPress Test Library

Step 1: Install the Prerequisites
Install Docker Desktop: Download and install Docker for Windows. (Make sure it is running).

Install Node.js: Download and install Node.js.

Step 2: Install WP-Env
Open your terminal (standard PowerShell or CMD is fine now) and run:

Bash

npm install -g @wordpress/env
Step 3: Start the Environment
Navigate to your plugin folder (wp-booking-plugin) and run:

Bash

wp-env start
This command will automatically download WordPress and the Test Library into a hidden Docker container. It won't mess with your C:\Windows\TEMP or your Local WP setup.

Step 4: Run Your Tests
To run your PHPUnit tests, you simply run:

Bash

wp-env run tests-cli --env-cwd=wp-content/plugins/wp-booking-plugin vendor/bin/phpunit

wp-env start
wp-env stop
wp-env destroy

---

## 2️⃣ Run PHPUnit

Run:

```bash
vendor/bin/phpunit
```

✅ Expected:

* Two test suites run
* 2 total tests
* All green

❌ Reject if:

* Plugin activation errors
* Missing WP bootstrap errors
* DB schema errors

---

## 3️⃣ Negative Control (Critical)

Temporarily break WP bootstrap path.

Re-run PHPUnit.

✅ Expected:

* WP test fails
* Non-WP test still passes

Restore path → both pass.

This confirms **suite separation** is correct.

---

## 4️⃣ Isolation Check

Confirm:

* Plugin main file is NOT loaded
* No hooks are registered
* No tables created

This guarantees:

> **Future tests can opt-in to WP safely**

---

# 🏁 PRE-04 Exit Criteria (Frozen)

PRE-04 is complete only if:

* ✅ PHPUnit runs with and without WP
* ✅ WP_UnitTestCase is available
* ✅ No plugin logic executed
* ✅ No DB schema created
* ✅ Tests are trivial and structural only

Once PRE-04 is frozen:

> You are cleared to start **Phase 2A / Phase 1A execution tasks** (auth, security, REST) with full test coverage.

---

# 🔜 What Comes Next (Recommended)

**Phase-2A-01**

* `/auth/login` REST endpoint
* Request validation
* Rate limiting
* Unit + WP integration tests

If you want, I can convert **Phase-2A-01** into the same **Cursor-safe execution pack** style.

Just say the word.
