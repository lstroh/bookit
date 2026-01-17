Perfect — PRE-02 is where **most AI agents accidentally overstep**, so this one needs *tight rails*.

Below is a **Cursor-safe PRE-02 execution pack**, matching your approach:

* Atomic
* Verifiable
* Irreversible once frozen
* Still **zero business logic**

---

# ✅ PRE-02 — Cursor Execution Pack

**Minimal Plugin Bootstrap (Frozen, Non-Functional)**

---

## 🎯 What PRE-02 Is (Very Precisely)

**PRE-02 exists to make the plugin loadable in a structured way without doing anything.**

It introduces:

* Namespaces
* Autoloading
* A single entry bootstrap
* Dependency wiring **without behavior**

> This is the *last step before “real code” begins.*

---

## 🚫 What PRE-02 Is NOT

PRE-02 must **not**:

* Register REST routes
* Register hooks (except one controlled bootstrap hook)
* Perform auth, booking, logging, or GDPR logic
* Touch DB, users, sessions, or options
* Contain conditionals or branching logic

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-02 for a WordPress plugin.

This task is BOOTSTRAP ONLY.
No business logic is allowed.

If any instruction is unclear, STOP and ask.

---

TASK ID:
PRE-02

OBJECTIVE:
Introduce a minimal, frozen plugin bootstrap with autoloading and a single entry point.

CONTEXT:
PRE-01 created the filesystem scaffold.
PRE-02 must only make the plugin loadable and structured.
All functional behavior will be added later in isolated tasks.

---

ALLOWED BEHAVIOR:
- Namespace declarations
- Class declarations with empty methods
- Composer autoload setup
- One WordPress hook to initialize the plugin

---

DISALLOWED BEHAVIOR:
- REST route registration
- Database access
- Security logic
- Booking logic
- GDPR logic
- Conditional branching based on runtime state
- More than one WordPress hook

---

FILES TO CREATE OR MODIFY:

1. composer.json
2. src/Infrastructure/Plugin.php
3. booking-plugin.php

---

REQUIRED IMPLEMENTATION DETAILS:

### composer.json
- PSR-4 autoloading
- Namespace root: BookingPlugin\
- Map to /src
- No dependencies required

---

### src/Infrastructure/Plugin.php
- Namespace: BookingPlugin\Infrastructure
- Class: Plugin
- Public method: boot(): void
- Method body must be empty or contain only comments
- No side effects

---

### booking-plugin.php
- Require Composer autoload
- Instantiate Plugin
- Call boot() via ONE WordPress hook only:
  add_action('plugins_loaded', ...)

No other hooks allowed.

---

OUT OF SCOPE:
- Service containers
- Config files
- Environment detection
- Error handling
- Logging
- Tests

---

DELIVERABLES:
- Plugin loads without error
- No visible behavior
- One bootstrap hook only

After completing the task:
- List all modified files
- Show the contents of booking-plugin.php
- Show the contents of src/Infrastructure/Plugin.php
```

---

# ✅ What You Should Expect Cursor to Produce

### 📄 composer.json

* Contains only:

  * name
  * description
  * autoload → psr-4
* No required packages

✅ Example (acceptable):

```json
{
  "autoload": {
    "psr-4": {
      "BookingPlugin\\": "src/"
    }
  }
}
```

❌ Reject if:

* Dependencies added
* Scripts added
* Env config added

---

### 📄 src/Infrastructure/Plugin.php

✅ Acceptable:

```php
<?php

namespace BookingPlugin\Infrastructure;

final class Plugin
{
    public function boot(): void
    {
        // Bootstrap only — logic added in later phases
    }
}
```

❌ Reject if:

* Additional methods exist
* Logic inside `boot()`
* Dependencies injected

---

### 📄 booking-plugin.php

✅ Acceptable:

```php
<?php
/**
 * Plugin Name: Booking Plugin
 */

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', function () {
    (new BookingPlugin\Infrastructure\Plugin())->boot();
});
```

❌ Reject if:

* More than one hook
* Any logic outside bootstrap
* try/catch blocks
* conditionals

---

# 🔍 How to Confirm Cursor Worked as Expected

## 1️⃣ Static Audit (Fast)

Search for:

* `add_action(` → **exactly one**
* `add_filter(` → **zero**
* `register_` → **zero**
* `wp_` calls → **zero**

---

## 2️⃣ Runtime Test (Critical)

1. Run:

```
composer dump-autoload
```

2. Activate plugin in WordPress

✅ Expected:

* Plugin activates
* No errors
* No output
* No UI changes
* No REST routes

Anything else = reject.

---

## 3️⃣ “Nothing Happens” Test

Ask:

> “If this plugin stays like this forever, does it change WordPress behavior?”

Correct answer:

> **No**

That means success.

---

## 4️⃣ Structural Integrity Check

Confirm:

* All logic entry points go through `Plugin::boot()`
* No other files are executable
* Future work has exactly one safe attachment point

---

# 🚫 Common Cursor Failure Modes (Auto-Reject)

Reject PRE-02 if Cursor:

* Adds a service container
* Adds config files
* Adds dependency injection
* Adds tests “helpfully”
* Adds constants or environment flags
* Adds TODO logic beyond comments

Those belong to **later PRE or Phase-2 tasks**.

---

# 🏁 PRE-02 Exit Criteria (Frozen)

You may mark PRE-02 complete **only if**:

* ✅ Plugin loads cleanly
* ✅ Exactly one WordPress hook exists
* ✅ boot() does nothing
* ✅ Autoloading works
* ✅ No behavior introduced

Once frozen:

> **All future functionality must hang off Plugin::boot()**

---

## 🔜 What Comes Next (Recommended Order)

**PRE-03** (still no business logic):

* PHPUnit bootstrap
* Test autoloading
* Empty test case

**Phase-2A**:

* Auth endpoint implementation (atomic)
* Unit tests per task (as you requested)

If you want, I can convert **PRE-03** or your **first Phase-2 task** into Cursor prompts next.
