# VERSION UPDATE — 1.0.0 → 1.5.0
# Bookit Booking System — WordPress Plugin
# Repo: lstroh/bookit-imp | Branch: Phase1 | Plugin root: bookit-booking-system/

---

## TASK

Update all version references in the plugin from `1.0.0` or any other version number to `1.5.0`,
then create and push a new Git tag `v1.5.0`.

This is a mechanical find-and-replace task. Read each file before
editing. Confirm PHPUnit still passes after changes. No architectural
decisions required — if anything unexpected is found, report back
before acting.

---

## FILES TO UPDATE

Read each file in full via GitHub connector before making any changes.

### 1. `bookit-booking-system.php` (main plugin file)

Find and update:
- Plugin header: `Version: 1.0.0` → `Version: 1.5.0`
- `define( 'BOOKIT_VERSION', '1.0.0' )` → `define( 'BOOKIT_VERSION', '1.5.0' )`

### 2. `includes/class-bookit-loader.php`

Find and update:
- Fallback version string in constructor:
  `$this->version = defined( 'BOOKIT_VERSION' ) ? BOOKIT_VERSION : '1.0.0';`
  → change fallback to `'1.5.0'`

### 3. `readme.txt` (if it exists)

Search for `Stable tag: 1.0.0` or `Version: 1.0.0` — update to `1.5.0`.
If `readme.txt` does not exist, skip this step and note it.

### 4. `package.json` in `bookit-booking-system/` (root)

If a `version` field exists, update `"version": "1.0.0"` → `"version": "1.5.0"`.
If the file does not exist or has no version field, skip and note it.

### 5. `dashboard/package.json`

Same as above — if a `version` field exists, update it to `1.5.0`.

### 6. `composer.json`

If a `version` field exists, update it to `1.5.0`.
Many composer.json files for WordPress plugins omit the version field —
if absent, skip and note it.

---

## FILES TO LEAVE UNCHANGED

Do NOT change version references in:

- `database/migrations/` — migration files contain version strings
  that refer to what core version they were written for. Do not touch.
- `tests/test-plugin-activation.php` — contains
  `$this->assertEquals( '1.0.3', $db_version )` which refers to the
  DB schema version, not the plugin version. Do not touch.
- `Extension_Plugin_API_Spec.md` — documents the API spec version
  and minimum core version for extensions. Do not touch.
- Any `BOOKIT_{SLUG}_REQUIRES_CORE` constant — these are extension
  compatibility declarations, not the core version.
- Any file in `vendor/` — Composer dependencies, never edit.

---

## SEARCH TO RUN FIRST

Before making any changes, search the codebase for all occurrences
of `1.0.0` in PHP, JSON, and txt files:

```bash
grep -r "1\.0\.0" bookit-booking-system/ \
  --include="*.php" \
  --include="*.json" \
  --include="*.txt" \
  --exclude-dir=vendor \
  --exclude-dir=node_modules \
  -l
```

List all matching files here before editing any of them. This ensures
no version references are missed.

---

## PHPUNIT VERIFICATION

After all changes:

```bash
cd bookit-booking-system && vendor/bin/phpunit
```

Expected: 976 tests, 0 failures.

The version format test in `test-plugin-activation.php` uses a regex
`/^\d+\.\d+\.\d+$/` — `1.5.0` matches this pattern, so the test
will continue to pass.

---

## GIT TAG

After PHPUnit passes:

```bash
git add -A
git commit -m "Version bump: 1.0.0 → 1.5.0

All pre-Phase 2 tasks complete. Codebase stable.
976 tests, 0 failures. Playwright: 10 passed, 3 skipped."

git tag -a v1.5.0 -m "v1.5.0 — Phase 1 complete, pre-Phase 2 stable release

Changes since v1.0.0:
- Dead code removal and coverage improvements
- V1 booking wizard removed (superseded by V2)
- Playwright E2E test suite (10 passing, 3 skipped)
- Cancelled slot unique constraint bug fixed
- Staff photo upload REST endpoint added
- StaffFormModal photo upload via file input
- Email notification bugs fixed (reschedule, cancellation paths)
- Vite manifest hash cache-busting implemented
- Customer email change workflow (GDPR Right to Rectification)
- UK compliance: 88/89 items closed
- Google Calendar OAuth integration"

git push origin Phase1
git push origin v1.5.0
```

---

## REPORT BACK

After completing, confirm:
- [ ] All files updated (list which ones were changed)
- [ ] Files skipped (list which ones didn't have version references)
- [ ] PHPUnit: 976 tests, 0 failures
- [ ] Git tag v1.5.0 pushed
- [ ] `BOOKIT_VERSION` constant now returns `'1.5.0'`