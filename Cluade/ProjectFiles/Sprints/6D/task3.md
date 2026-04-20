6D-2 confirmed complete. Now generating the 6D-3 prompt. Let me verify the current Vite manifest API first.Good — confirmed. Now let me read the current vite.config.js and index.php from project knowledge.I have everything I need. Here is the 6D-3 prompt:

---

```
TASK 3 OF 4: Vite Manifest Hash Cache-Busting
Sprint: 6D | Est: ~2h | Plugin root: bookit-booking-system/

════════════════════════════════════════════════════════════
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES
════════════════════════════════════════════════════════════

1. dashboard/vite.config.js — read in full before any changes
2. dashboard/app/index.php — read in full before any changes
3. dashboard/.gitignore (or root .gitignore) — confirm dist/ is
   already gitignored so dist/.vite/ needs no new entry

If any file does not exist at the path shown, STOP and report back.

════════════════════════════════════════════════════════════
CONTEXT
════════════════════════════════════════════════════════════

Currently the dashboard entry file is always named index.js and
style.css with no content hash. After every deployment a 3-layer
manual cache purge is required (LiteSpeed → Hostinger → CDN).

The correct fix is Vite manifest hash — Vite generates unique
content hashes in filenames (e.g. index.abc123.js) and outputs
dist/.vite/manifest.json mapping source files to their hashed
output names. PHP reads manifest.json to find the current filename.

CRITICAL KNOWN CONSTRAINT from Sprint 6C:
  Vite is configured with base: './' which uses relative chunk
  imports. Adding ?v= query strings to index.js caused a double
  Vue mount crash. The manifest hash approach avoids this entirely
  because the hash is in the filename, not a query string.
  NEVER add query params to the entry JS file URL.

════════════════════════════════════════════════════════════
IMPLEMENTATION REQUIREMENTS
════════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────
### dashboard/vite.config.js — MODIFY
─────────────────────────────────────────────────────────

Read the current file first. Then make these targeted changes
to the build config only — do NOT change base, plugins, server,
or resolve sections:

Add manifest: true to the build object.

Change output filenames to include hashes:
- entryFileNames: 'index.[hash].js'   (was: 'index.js')
- chunkFileNames: 'chunks/[name]-[hash].js'  (unchanged)
- assetFileNames: for .css files return 'style.[hash].css'
  (was: 'style.css'). For all other assets keep existing pattern.

The resulting build section should look like:

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.js'),
      output: {
        entryFileNames: 'index.[hash].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'style.[hash].css'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },

After this change, `npm run build` will:
- Output dist/.vite/manifest.json
- Generate dist/index.{hash}.js (not dist/index.js)
- Generate dist/style.{hash}.css (not dist/style.css)

─────────────────────────────────────────────────────────
### dashboard/app/index.php — MODIFY
─────────────────────────────────────────────────────────

Read the current file first. Replace the hardcoded index.js and
style.css references with PHP that reads manifest.json.

The manifest.json structure (confirmed from Vite docs) is:
  {
    "src/main.js": {
      "file": "index.abc123.js",
      "css": ["style.abc123.css"],
      "isEntry": true
    },
    ...
  }

Add this PHP block immediately before the <head> section opens
(or at the top of the PHP logic area, before any HTML output):

  // Read Vite manifest to get hashed asset filenames.
  $manifest_path = BOOKIT_PLUGIN_DIR . 'dashboard/dist/.vite/manifest.json';
  $manifest      = array();
  if ( file_exists( $manifest_path ) ) {
      $raw      = file_get_contents( $manifest_path ); // phpcs:ignore
      $manifest = json_decode( $raw, true ) ?? array();
  }
  $js_file  = $manifest['src/main.js']['file'] ?? 'index.js';
  $css_file = isset( $manifest['src/main.js']['css'][0] )
      ? $manifest['src/main.js']['css'][0]
      : 'style.css';

Then replace the two existing conditional blocks:

OLD CSS block:
  <?php if ( file_exists( BOOKIT_PLUGIN_DIR . 'dashboard/dist/style.css' ) ) : ?>
      <link rel="stylesheet" href="...dashboard/dist/style.css...">
  <?php endif; ?>

NEW CSS block:
  <?php if ( file_exists( BOOKIT_PLUGIN_DIR . 'dashboard/dist/' . $css_file ) ) : ?>
      <link rel="stylesheet" href="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/' . $css_file ); ?>">
  <?php endif; ?>

OLD JS block:
  <?php if ( file_exists( BOOKIT_PLUGIN_DIR . 'dashboard/dist/index.js' ) ) : ?>
      <script type="module" src="...dashboard/dist/index.js..."></script>
  <?php else : ?>
      <script type="module" src="http://localhost:5173/@vite/client"></script>
      <script type="module" src="http://localhost:5173/src/main.js"></script>
  <?php endif; ?>

NEW JS block — preserve the local dev fallback exactly:
  <?php if ( file_exists( BOOKIT_PLUGIN_DIR . 'dashboard/dist/' . $js_file ) ) : ?>
      <script type="module" src="<?php echo esc_url( BOOKIT_PLUGIN_URL . 'dashboard/dist/' . $js_file ); ?>"></script>
  <?php else : ?>
      <script type="module" src="http://localhost:5173/@vite/client"></script>
      <script type="module" src="http://localhost:5173/src/main.js"></script>
  <?php endif; ?>

The fallback to localhost:5173 must be preserved exactly as it is
now — this is how local development works and must not be broken.

─────────────────────────────────────────────────────────
### .gitignore — VERIFY ONLY, no change expected
─────────────────────────────────────────────────────────

Confirm that dist/ is already gitignored. If it is, then
dist/.vite/manifest.json is automatically excluded — no new
.gitignore entry is needed. Report what you find but do not
add any new entries unless dist/ is NOT already ignored.

════════════════════════════════════════════════════════════
PHPUNIT REQUIREMENTS
════════════════════════════════════════════════════════════

Baseline: 986 tests, 0 failures — must not regress.
No new test file required — this is a build config and PHP
template change only.

Run after implementation:
  cd bookit-booking-system && vendor/bin/phpunit
Must show 986 tests, 0 failures.

════════════════════════════════════════════════════════════
GIT COMMIT MESSAGE
════════════════════════════════════════════════════════════

Sprint 6D, Task 3: Vite manifest hash cache-busting

- dashboard/vite.config.js: manifest: true, hashed entry/asset names
- dashboard/app/index.php: reads dist/.vite/manifest.json for
  current hashed filenames
- Eliminates 3-layer manual cache purge after frontend deployments
- CDN automatically fetches fresh JS/CSS when content changes

Tests: 986 passing, 0 failures

════════════════════════════════════════════════════════════
ESCALATION
════════════════════════════════════════════════════════════

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not resolve,
STOP and report back before writing any code.
```