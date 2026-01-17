Absolutely. Below is a **ready-to-use Cursor execution pack for PRE-01**, written so that:

* Cursor cannot overstep
* You can verify correctness quickly
* Failure modes are obvious
* No business logic can “accidentally” slip in

This is **copy-paste safe**.

---

# ✅ PRE-01 — Cursor Execution Pack

**Plugin Skeleton & Directory Structure**

---

## 🎯 What PRE-01 Is (Re-stated)

**PRE-01 exists only to create a filesystem skeleton.**

It does **not**:

* Implement features
* Register hooks
* Touch WordPress runtime behavior
* Make architectural decisions

Think of it as:

> *“Create empty rooms, do not furnish them.”*

---

# 🧑‍💻 Cursor Prompt (Copy-Paste)

```
You are implementing PRE-01 for a WordPress plugin.

This task is SCAFFOLDING ONLY.

DO NOT:
- Add business logic
- Register WordPress hooks
- Create REST routes
- Write to the database
- Add cron jobs
- Add admin pages
- Add authentication or booking code

If anything is unclear, STOP and ask.

---

TASK ID:
PRE-01

OBJECTIVE:
Create the plugin directory and file structure only.

CONTEXT:
This plugin will be implemented incrementally.
All product, security, and compliance logic will be added later in separate tasks.

SCOPE:
Filesystem structure only.

REQUIRED DIRECTORY STRUCTURE:

wp-booking-plugin/
├── booking-plugin.php
├── readme.txt
├── composer.json
├── phpunit.xml
├── src/
│   ├── Infrastructure/
│   ├── Security/
│   ├── Compliance/
│   ├── Booking/
│   ├── API/
│   └── Shared/
├── tests/
│   ├── Unit/
│   │   ├── Security/
│   │   ├── Compliance/
│   │   ├── Booking/
│   │   └── API/
│   └── bootstrap.php
└── vendor/

REQUIREMENTS:
- Create empty directories as listed
- Create empty files where listed
- booking-plugin.php may contain only:
  - Plugin header comment
  - No executable logic
- composer.json and phpunit.xml may be placeholders
- tests/bootstrap.php may be empty

OUT OF SCOPE:
- Any PHP class implementations
- Any WordPress hooks or filters
- Any logic beyond empty scaffolding

DELIVERABLES:
- Directory tree exactly as specified
- No additional files
- No missing files

After completing the task, list all created files and directories.
```

---

# ✅ What You Should Expect Cursor to Produce

### 📁 Files & Directories

* Exact directory structure as specified
* No extras
* No missing paths

### 📄 File contents

* `booking-plugin.php`:

  * Contains **only** plugin metadata comment
  * No `add_action`, `add_filter`, or executable code
* Other files:

  * Can be empty or placeholder comments
  * No logic

### 🧠 Cursor behavior

* Cursor should **not ask design questions**
* Cursor should **not propose improvements**
* Cursor should **not add “helpful” defaults**

If it does → reject.

---

# 🔍 How to Verify Cursor Worked Correctly

Use this **5-minute verification checklist**.

---

## 1️⃣ Filesystem Check

Run (or visually inspect):

```
wp-booking-plugin/
```

Confirm:

* All directories exist
* Names match exactly
* Case sensitivity is correct

❌ Any deviation = reject.

---

## 2️⃣ booking-plugin.php Audit

Open `booking-plugin.php`.

✅ Acceptable:

```php
<?php
/**
 * Plugin Name: Booking Plugin
 * Description: API-first booking plugin
 * Version: 0.1.0
 */
```

❌ Reject if you see:

* `add_action`
* `register_activation_hook`
* `require_once`
* Any executable code

---

## 3️⃣ Grep for Logic (Fast Safety Check)

Search for:

* `add_action`
* `add_filter`
* `wp_`
* `do_action`

There should be **zero meaningful results**.

---

## 4️⃣ WordPress Activation Test

* Place plugin folder in `/wp-content/plugins`
* Activate plugin in WP Admin

✅ Expected result:

* Plugin activates cleanly
* Nothing happens
* No errors
* No UI changes

Anything else → reject.

---

## 5️⃣ Intent Check (Most Important)

Ask yourself:

> “If this plugin stayed like this forever, would it do anything?”

Correct answer:

> **No.**

That’s success.

---

# 🚫 Common Cursor Failure Modes (Auto-Reject)

Reject the task if Cursor:

* Adds a namespace bootstrap
* Adds an autoloader require
* Adds constants “for later”
* Adds TODO logic
* Adds sample classes

Those belong to **later pre-steps**, not PRE-01.

---

# 🏁 PRE-01 Exit Criteria (Final)

You may mark PRE-01 complete **only if**:

* ✅ Structure matches spec exactly
* ✅ Plugin activates and does nothing
* ✅ No hooks or logic exist
* ✅ No assumptions were made

Only then may you proceed to:

> **PRE-02 — Plugin Bootstrap (Minimal, Frozen)**

---

If you want next, I can:

* Convert **PRE-02** into a Cursor prompt
* Provide a **one-page “what to reject” guide**
* Help you chain these prompts cleanly in Cursor
* Create a **Phase 1 pre-flight checklist**

Just tell me what you want next.
