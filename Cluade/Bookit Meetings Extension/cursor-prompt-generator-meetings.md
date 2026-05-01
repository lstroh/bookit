---
name: cursor-prompt-generator
description: >
  Generates Cursor-ready implementation prompts for the Bookit Meetings
  extension plugin. Use this skill whenever a sprint agent needs to produce
  a Cursor prompt for any implementation task — PHP, Vue, SQL, REST
  endpoints, PHPUnit tests, migrations, or bug fixes. Also use it when
  the user asks to "generate a prompt for Cursor", "write a Cursor
  prompt", "create an implementation prompt", or says "ready for Task N"
  during a sprint. Always use this skill before writing any Cursor prompt
  to ensure the output follows the established quality standards for this
  project.
---

# Cursor Prompt Generator — Bookit Meetings Extension

This skill produces Cursor implementation prompts for the Bookit Meetings
extension plugin (PHP 8.0+, WordPress 6.0+, Vue 3, Vite, PHPUnit).
Every prompt must follow the structure and rules below.

---

## BEFORE WRITING ANY PROMPT — MANDATORY CHECKS

Before generating a prompt, verify you have answers to all of these.
If any are unknown, use GitHub to read the relevant files first.

1. **What files already exist** that this task touches or depends on?
   → Use GitHub to read them. Never assume file contents.

2. **What patterns are already established** in similar files?
   → The prompt must direct Cursor to follow existing patterns, not
   invent new ones.

3. **Which extension infrastructure applies?**
   - New DB changes → migration file in `database/migrations/NNNN-description.php`
   - New REST endpoints → must use `bookit-meetings/v1/` namespace, never `bookit/v1/`
   - Dashboard endpoints → auth via `Bookit_Auth::is_authenticated()`
   - Public endpoints → auth via HMAC-SHA256, never `wp_verify_nonce()`
   - Settings reads → `$wpdb->get_col()` on `{prefix}bookings_settings`, never `get_option()` and never `$wpdb->get_var()` (see KNOWN GOTCHAS)

4. **Does the task touch any external library?**
   → Use Context7 to resolve and query current docs before writing
   any library-specific implementation guidance.

5. **What is the current PHPUnit test count?**
   → State the baseline in the prompt so Cursor knows the floor.
   → Baseline entering Sprint 2: 45 tests, 94 assertions, 0 failures.
   → Update this after each sprint.

6. **Does the task read data written by a preceding hook in the same request?**
   → If yes, the `$booking` array passed by core will be stale. Direct
   Cursor to re-read the required fields from the DB inside the callback.
   Never rely on `$booking` fields that may have been written after the
   array was assembled (see KNOWN GOTCHAS).

---

## PROMPT STRUCTURE

Every Cursor prompt must contain these sections in this order:

### 1. TASK HEADER
```
TASK [N] OF [TOTAL]: [Task name]
Sprint: [Sprint ID] | Est: [Xh] | Plugin root: bookit-meetings/
```

### 2. READ FIRST (mandatory — always the first instruction)
List every file Cursor must read before writing a single line of code.
Be explicit and specific. Include:
- All existing files that will be modified
- All existing files whose patterns must be followed
- All core infrastructure classes relevant to this task

Format:
```
## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. [path/to/file] — [why it must be read]
2. [path/to/file] — [why it must be read]
...

If any file does not exist, stop and report back before proceeding.
```

For tasks that reference core REST API classes, the correct path is:
`bookit-booking-system/includes/api/` (not `bookit-booking-system/api/`).
Confirmed correct files for permission patterns:
- `bookit-booking-system/includes/api/class-extensions-api.php` — dashboard permission pattern
- `bookit-booking-system/includes/api/class-customers-api.php` — admin permission pattern

### 3. CONTEXT
2–4 sentences explaining:
- What this task delivers
- Where it fits in the sprint
- Any decisions already made that constrain the implementation

### 4. IMPLEMENTATION REQUIREMENTS
File-by-file breakdown. For each file:
```
### [path/to/file] — [CREATE|MODIFY]
- Bullet list of specific requirements for this file
- Reference existing patterns by name where relevant
- State constraints explicitly (e.g. "must not break existing X")
```

Group files logically: PHP backend first, then Vue frontend, then
tests. Never mix backend and frontend requirements in the same block.

### 5. EXTENSION INFRASTRUCTURE WIRING
Explicit checklist of extension infrastructure that must be wired up:
```
## INFRASTRUCTURE WIRING
- [ ] Migration registered: bookit_register_migration_path( 'bookit-meetings', ... )
- [ ] Migration file created: database/migrations/NNNN-description.php
- [ ] REST routes registered under: bookit-meetings/v1/
- [ ] Dashboard auth uses: Bookit_Auth::is_authenticated()
- [ ] Nav item registered via: bookit_register_nav_item()
- [ ] JS data passed via: bookit_dashboard_js_data filter
- [ ] Booking response extended via: bookit_booking_response filter
```

Omit any line that does not apply to this task.

### 6. PHPUNIT TESTS
```
## PHPUNIT REQUIREMENTS
Baseline: [N] tests, [N] assertions, 0 failures — must not regress.

Write tests in: tests/unit/test-[feature-name].php

Required test cases:
- [test name]: [what it verifies]
- [test name]: [what it verifies]
...

Run after implementation:
wp-env run tests vendor/bin/phpunit
All tests must pass before marking task complete.
```

### 7. ACCEPTANCE CRITERIA
Explicit, binary checklist. Every item must be independently
verifiable. No vague items like "works correctly".

```
## ACCEPTANCE CRITERIA
### Functional
- [ ] [Specific verifiable behaviour]
- [ ] [Specific verifiable behaviour]

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] REST namespace is bookit-meetings/v1/ — not bookit/v1/
- [ ] PHPUnit suite passes ([N]+ tests, [N]+ assertions, 0 failures)

### Must NOT break
- [ ] Core plugin activates and functions normally alongside this extension
- [ ] Extension deactivates cleanly (migration down() runs without error)
```

### 8. GIT COMMIT
Provide the exact commit message to use:
```
## GIT COMMIT MESSAGE
Sprint [ID], Task [N]: [description]

- [change 1]
- [change 2]
- [change 3]

Tests: [N] passing, [N] assertions, 0 failures
```

---

## RULES

**Read before write.** The single most important rule. Every prompt
must open with explicit read instructions. Cursor generating code
based on assumptions about existing files is the primary cause of
bugs and rework in this project.

**One task, one prompt.** Never combine two tasks into one prompt.
If a task is naturally split (e.g. backend + frontend are large),
split into Task Na and Task Nb.

**No mass updates.** For operations affecting multiple database rows
or bookings, direct Cursor to process each record individually in a
loop, not with a single bulk SQL UPDATE.

**Context7 for libraries.** Any prompt that involves Vue 3 APIs,
WordPress REST API patterns, PHPUnit assertions, or any npm/composer
package must include a note to use Context7 to verify current API
before implementing. Format:
```
Note: Before implementing [library feature], use Context7 to resolve
'[library name]' and confirm the current API.
```

**GitHub for existing code.** Any prompt that modifies an existing
file must instruct Cursor to read the current file from GitHub first.
Never describe what you think is in the file — always direct Cursor
to read it.

**Frontend builds.** Any task that modifies Vue/JS files must end
with:
```
After implementation, run: npm run build
(in bookit-meetings/dashboard/)
The dist/ directory is gitignored — the build must be run manually
in your local wp-env environment after Cursor completes its changes.
```

**Admin-only features.** Any admin-only endpoint or UI must explicitly
state: `bookit_staff role must be blocked from this endpoint/UI`.
Use `Bookit_Auth::get_current_user()` and check `role === 'admin'`.

**Escalation note.** Every prompt must end with:
```
If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```

---

## COMMON PATTERNS REFERENCE

Quick reference for patterns to direct Cursor toward. Read the
actual file for full implementation details.

| Pattern | Reference file |
|---------|---------------|
| Main plugin file | `bookit-booking-system/bookit-booking-system.php` |
| Loader class | `bookit-booking-system/includes/class-bookit-loader.php` |
| Migration file | `bookit-meetings/database/migrations/0001-add-meetings-schema.php` |
| Migration runner | `bookit-booking-system/includes/class-bookit-migration-runner.php` |
| REST endpoint class | `bookit-meetings/api/class-meetings-api.php` |
| Dashboard REST auth | `bookit-booking-system/includes/api/class-extensions-api.php` |
| Admin REST auth | `bookit-booking-system/includes/api/class-customers-api.php` |
| Auth check | `Bookit_Auth::is_authenticated()` — safe to call from extension |
| Logger | `Bookit_Logger::info()`, `::error()`, `::warning()` |
| Extension registry | `Bookit_Extension_Registry::is_registered()` |
| Settings read | `$wpdb->get_col()` — see KNOWN GOTCHAS for full pattern |
| Link generator | `bookit-meetings/includes/class-bookit-meetings-link-generator.php` |
| Customer surfaces | `bookit-meetings/includes/class-bookit-meetings-customer-surfaces.php` |

---

## KNOWN GOTCHAS

Before finalising any prompt, check whether the task touches any of
these categories:

- **Task touches Vue files** → include `base: './'` Vite note + build instruction

- **Task adds a new DB table or column** → must use migration file, `information_schema` checks only

- **Task checks column existence** → `information_schema.COLUMNS` — never `SHOW COLUMNS LIKE`

- **Task checks table existence** → `information_schema.TABLES` — never `SHOW TABLES LIKE`

- **Task uses JSON column data** → never `JSON_CONTAINS()` — use `json_decode()` + `in_array()` in PHP

- **Task adds a public REST endpoint** → HMAC-SHA256 auth — never `wp_verify_nonce()`

- **Task handles OAuth tokens or base64** → never pass through `sanitize_text_field()`

- **Task does file uploads** → use `fetch()` + `FormData`, not axios/`useApi()`

- **Task reads booking times** → null-guard `start_time` and `end_time` — both are NULL on cancelled bookings

- **Task enqueues assets** → use `bookit_dashboard_loaded` action, never enqueue at `init` or `wp_enqueue_scripts`

- **Task outputs a mount point div** → output via `wp_footer` action, never echo directly in action callback

- **Task reads settings** → use `$wpdb->get_col()` — never `get_option()` and never `$wpdb->get_var()`.
  Full pattern:
  ```php
  $results = $wpdb->get_col( $wpdb->prepare(
      "SELECT setting_value FROM {$wpdb->prefix}bookings_settings WHERE setting_key = %s LIMIT 1",
      $key
  ) );
  return empty( $results ) ? $default : (string) $results[0];
  ```
  Reason: `$wpdb->get_var()` returns PHP `null` for empty string values (`''`),
  making it impossible to distinguish "row exists with empty value" from "row missing".
  `get_col()` returns an empty array for missing rows and `['']` for an empty string value.

- **Task adds a migration file** → class name must be `Bookit_Meetings_NNNN_Description`
  (not `Bookit_Migration_NNNN_Description`) — PHP class names are global across the entire
  WordPress runtime. Core uses `Bookit_Migration_0001_*` and if the extension also uses
  that prefix a PHP fatal error occurs on class redefinition. The slug prefix guarantees
  uniqueness. The existing `class_alias()` workaround in `0001-add-meetings-schema.php`
  must remain until core REQUEST 2 is implemented.

- **Task adds DDL tests (CREATE TABLE / ALTER TABLE)** → do NOT test `down()` in PHPUnit.
  `ALTER TABLE` and `CREATE TABLE` cause implicit commits in MariaDB, breaking
  `WP_UnitTestCase`'s transaction wrapper. Test `up()` only. Verify `down()` manually
  via plugin deactivation in wp-env.

- **Task reads a `$booking` array passed by a core filter** → the array may be stale.
  Core assembles `$booking` before firing action hooks, so any field written to the DB
  by a hook in the same request (e.g. `meeting_link` written by `bookit_after_booking_confirmed`)
  will be `null` in the filter's `$booking` parameter. Always re-read required fields
  directly from the DB using `$booking['id']` inside the filter callback. Never rely on
  `$booking['meeting_link']` or any other field that a preceding hook may have written.

---

## QUALITY CHECKLIST (run before delivering any prompt)

- [ ] READ FIRST section lists all files that will be touched
- [ ] Every implementation requirement is file-specific
- [ ] Extension infrastructure wiring checklist is explicit
- [ ] PHPUnit section states the baseline test count AND assertion count
- [ ] Acceptance criteria are all binary and verifiable
- [ ] No vague instructions ("handle errors appropriately")
- [ ] Context7 note included for any library-specific code
- [ ] Frontend build instruction included if Vue files are modified
- [ ] REST namespace is `bookit-meetings/v1/` throughout
- [ ] Admin-only note included for any admin-restricted feature
- [ ] Git commit message includes test count AND assertion count
- [ ] Escalation note present at the end
- [ ] Settings reads use `get_col()` pattern — not `get_var()`
- [ ] Any filter reading `$booking` data re-reads from DB if the field may be stale