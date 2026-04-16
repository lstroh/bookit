I've read the sprint prompt and the cursor-prompt-generator skill. Here's my understanding of Sprint 6C:

**3 tasks, ~7h total. I'll generate one Cursor prompt per task, one at a time.**

- **6C-1** (~1h): Cache-busting fix — add `?v=BOOKIT_VERSION` to dashboard JS/CSS
- **6C-2** (~4h): Email notification hotfix — 3 pre-existing bugs
- **6C-3** (~2h): Brevo staff email template params

Starting with **Task 6C-1**. Here's the Cursor prompt:

---

```
TASK 1 OF 3: Cache-Busting Fix — Versioned Dashboard Asset URLs
Sprint: 6C | Est: 1h | Plugin root: bookit-booking-system/
```

## READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

1. `dashboard/app/index.php` — the file containing the hardcoded `<script>` and `<link>` tags to be fixed
2. `dashboard/setup.php` — may contain the same hardcoded pattern for the setup wizard; read it and apply the same fix if present
3. Search the plugin root for any other PHP file that outputs a raw `<script src>` or `<link href>` referencing `dashboard/dist/` — report any found before proceeding

If any file does not exist, stop and report back before proceeding.

---

## CONTEXT

The dashboard JS (`dashboard/dist/index.js`) and CSS (`dashboard/dist/style.css`) are loaded with hardcoded URLs and no version query parameter. Browsers and CDN cache these URLs indefinitely, requiring a 3-layer manual cache purge after every frontend deployment. This task appends `?v=BOOKIT_VERSION` to both asset URLs using WordPress's `add_query_arg()` function, so that a version bump causes browsers and CDN to fetch fresh assets automatically.

No frontend build is required. This is a PHP-only change. No Vue files are touched.

---

## IMPLEMENTATION REQUIREMENTS

### `dashboard/app/index.php` — MODIFY

- Read the full file first via GitHub before making any changes
- Find the `<script type="module">` tag that loads `dashboard/dist/index.js`
- Change it from:
  ```php
  <script type="module" src="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/index.js' ); ?>"></script>
  ```
  To:
  ```php
  <script type="module" src="<?php echo esc_url( add_query_arg( 'v', BOOKIT_VERSION, BOOKIT_PLUGIN_URL . 'dashboard/dist/index.js' ) ); ?>"></script>
  ```
- Find the `<link rel="stylesheet">` tag that loads `dashboard/dist/style.css`
- Change it from:
  ```php
  <link rel="stylesheet" href="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/style.css' ); ?>">
  ```
  To:
  ```php
  <link rel="stylesheet" href="<?php echo esc_url( add_query_arg( 'v', BOOKIT_VERSION, BOOKIT_PLUGIN_URL . 'dashboard/dist/style.css' ) ); ?>">
  ```
- Use `add_query_arg()` — it is the WordPress-standard function for appending query parameters and handles URL encoding correctly
- Do not modify any other lines in this file

### `dashboard/setup.php` — MODIFY (if applicable)

- Read the full file via GitHub
- If it contains a raw `<script src>` or `<link href>` referencing any file in `dashboard/dist/`, apply the same `add_query_arg( 'v', BOOKIT_VERSION, ... )` pattern
- If no such tags exist, make no changes and report that no fix was needed

---

## INFRASTRUCTURE REQUIREMENTS

No new DB tables, error codes, audit log events, or REST endpoints. This is a URL formatting change only.

---

## PHPUNIT REQUIREMENTS

Baseline: 976 tests, 0 failures — must not regress.

No new tests are required — there is no testable PHP logic in a URL formatting change.

After implementation, run:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All 976 tests must pass before marking task complete.

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] `dashboard/app/index.php` script tag URL includes `?v=` followed by the value of `BOOKIT_VERSION`
- [ ] `dashboard/app/index.php` stylesheet link URL includes `?v=` followed by the value of `BOOKIT_VERSION`
- [ ] `dashboard/setup.php` has the same fix applied if it contained hardcoded dist URLs
- [ ] No other PHP files have been modified

### Technical
- [ ] `add_query_arg()` is used (not string concatenation) for both URLs
- [ ] `esc_url()` wraps the full `add_query_arg()` call in both cases
- [ ] No PHP warnings or notices
- [ ] PHPUnit suite passes (976 tests, 0 failures)

### Must NOT break
- [ ] Dashboard loads correctly in browser
- [ ] Setup wizard loads correctly (if setup.php was modified)
- [ ] All existing functionality unaffected

---

## MANUAL VERIFICATION (after deploying to live site)

1. Open Chrome DevTools → Network tab
2. Hard reload the dashboard (`Ctrl+Shift+R`)
3. Confirm `index.js` request URL includes `?v=1.x.x` (actual BOOKIT_VERSION value)
4. Confirm `style.css` request URL includes `?v=1.x.x`

---

## GIT COMMIT MESSAGE

```
Sprint 6C, Task 1: Add version-based cache busting to dashboard assets

- dashboard/app/index.php: append ?v=BOOKIT_VERSION to index.js and style.css
- dashboard/setup.php: same fix applied (if applicable)
- Eliminates 3-layer manual cache purge after every frontend deployment

Tests: 976 passing, 0 failures
```

---

If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

---

Let me know when Task 6C-1 is confirmed complete and I'll generate the 6C-2 prompt. For 6C-2 I'll need to read 5 files via GitHub before writing anything — the root causes of Bugs 2 and 3 must be identified from code, not assumed.