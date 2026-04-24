# Bookit Extension Developer Handbook
**Version:** 1.0  
**Applies to core version:** 1.5.0  
**Last updated:** April 2026  
**Owner:** Wimbledon Smart / Liron

This handbook is the single reference for building a Bookit extension plugin.
Every extension project receives this file in its Claude project knowledge.
Read it before starting any sprint.

---

## Table of Contents

1. [Repository Setup](#1-repository-setup)
2. [Local Development Environment](#2-local-development-environment)
3. [Database Migrations](#3-database-migrations)
4. [REST API Conventions](#4-rest-api-conventions)
5. [Dashboard Vue App](#5-dashboard-vue-app)
6. [PHPUnit Tests](#6-phpunit-tests)
7. [Playwright E2E Tests](#7-playwright-e2e-tests)
8. [Cursor IDE Setup](#8-cursor-ide-setup)
9. [Claude Project Setup](#9-claude-project-setup)
10. [BKMs — Best Known Methods](#10-bkms--best-known-methods)
11. [CI / GitHub Actions](#11-ci--github-actions)

---

## 1. Repository Setup

### Directory layout

Follow this structure exactly. Deviations require a documented reason.

```
bookit-{slug}/
├── bookit-{slug}.php                     # Main plugin file
├── composer.json                         # PHP dependencies
├── package.json                          # Node dependencies (if Vue dashboard)
├── .gitignore
├── .wp-env.json                          # wp-env config
├── .github/
│   └── workflows/
│       ├── phpunit.yml                   # Runs on every PR
│       └── e2e-smoke.yml                 # Runs on every push
├── includes/
│   └── class-bookit-{slug}-loader.php   # Registers all hooks
├── database/
│   └── migrations/
│       └── 0001-add-{slug}-tables.php   # Numbered migration files
├── api/
│   └── class-{slug}-api.php             # REST endpoint registration
├── tests/
│   ├── bootstrap.php                    # PHPUnit bootstrap
│   ├── unit/                            # PHPUnit test files
│   │   └── test-{feature}.php
│   └── e2e/                             # Playwright (if applicable)
│       ├── playwright.config.ts
│       ├── package.json
│       ├── .env.test.local              # gitignored
│       ├── .env.test.live               # gitignored
│       └── tests/
│           ├── smoke/
│           └── full/
└── dashboard/                           # Vue 3 app (if applicable)
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── main.js
    │   └── App.vue
    └── dist/                            # gitignored — built assets
```

### `.gitignore`

```gitignore
# Dependencies
vendor/
node_modules/
dashboard/node_modules/

# Built assets
dashboard/dist/
tests/e2e/node_modules/

# Environment
.env
.env.local
tests/e2e/.env.test.local
tests/e2e/.env.test.live

# IDE
.vscode/
.idea/
.cursor/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# wp-env runtime
.wp-env/
```

### `composer.json`

```json
{
  "name": "wimbledonsmart/bookit-{slug}",
  "description": "Bookit {Feature Name} extension plugin",
  "type": "wordpress-plugin",
  "require-dev": {
    "phpunit/phpunit": "^9.5",
    "yoast/phpunit-polyfills": "^2.0"
  },
  "autoload-dev": {
    "psr-4": {
      "Bookit\\Tests\\": "tests/"
    }
  },
  "scripts": {
    "test": "vendor/bin/phpunit"
  }
}
```

### `package.json` (root — wp-env only)

```json
{
  "name": "bookit-{slug}-dev",
  "private": true,
  "scripts": {
    "wp-env:start": "wp-env start",
    "wp-env:stop": "wp-env stop",
    "wp-env:destroy": "wp-env destroy",
    "test": "wp-env run tests vendor/bin/phpunit"
  },
  "devDependencies": {
    "@wordpress/env": "^10.0.0"
  }
}
```

### Branch strategy

```
main          ← production-ready, tagged releases only
feature/*     ← one branch per sprint task, merged via PR
```

Commit after every completed task. Tag each sprint completion:
`git tag -a v1.0.0 -m "Sprint 1 complete: plugin scaffold"`

### Commit message format

```
Sprint [N], Task [N]: [Brief description]

- Change 1
- Change 2

Tests: [N] passing, 0 failures
```

---

## 2. Local Development Environment

### Core plugin dependency

The extension runs alongside the Bookit core plugin. Install core as a
**`.zip` file** into `wp-env` — do not reference a local path.

Download the latest `bookit-booking-system.zip` from the
`lstroh/bookit-imp` GitHub releases page (tag: `v1.5.0`).

### `.wp-env.json`

Place in the plugin root. Installs core as a plugin alongside your extension.

```json
{
  "core": null,
  "phpVersion": "8.0",
  "plugins": [
    ".",
    "./bookit-booking-system.zip"
  ],
  "mappings": {
    "wp-content/plugins/bookit-booking-system": "./bookit-booking-system.zip"
  },
  "env": {
    "tests": {
      "plugins": [
        ".",
        "./bookit-booking-system.zip"
      ]
    }
  }
}
```

### Starting the environment

```bash
# Install dependencies
npm install
composer install

# Start wp-env (development site: localhost:8888, test site: localhost:8889)
npm run wp-env:start

# Activate both plugins in wp-admin or via WP-CLI
wp-env run development wp plugin activate bookit-booking-system
wp-env run development wp plugin activate bookit-{slug}
```

### Database access

Install Adminer as a single file in the WordPress root:

```bash
# Copy adminer.php into wp-env WordPress root
wp-env run development bash -c "curl -o /var/www/html/adminer.php https://www.adminer.org/latest.php"
```

Access at: `http://localhost:8888/adminer.php`
Credentials: server `mysql`, user `root`, password `password`, database `wordpress`

### WordPress version and environment

| Setting | Value |
|---------|-------|
| PHP | 8.0 |
| WordPress | 6.4+ |
| MariaDB | 11.4 (production) — use MySQL 8.0 locally, same behaviour |
| WP_DEBUG | true in development |

Enable debug logging in `wp-env`:

```json
{
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "WP_DEBUG_DISPLAY": false
  }
}
```

---

## 3. Database Migrations

The core plugin ships a migration framework. Extensions register their own
migration path and use the same runner.

### Registration

Register your migration path inside your loader, **after** `bookit_register_extension()`
succeeds, on `plugins_loaded` priority 5:

```php
bookit_register_migration_path(
    'bookit-{slug}',
    BOOKIT_{SLUG}_PLUGIN_DIR . 'database/migrations/'
);
```

### Running on activation

```php
register_activation_hook( __FILE__, function() {
    if ( ! class_exists( 'Bookit_Migration_Runner' ) ) {
        return; // Core not active — bail silently
    }
    bookit_register_migration_path( 'bookit-{slug}', BOOKIT_{SLUG}_PLUGIN_DIR . 'database/migrations/' );
    Bookit_Migration_Runner::run_pending( 'bookit-{slug}' );
} );
```

### Rolling back on deactivation

```php
register_deactivation_hook( __FILE__, function() {
    if ( ! class_exists( 'Bookit_Migration_Runner' ) ) {
        return;
    }
    Bookit_Migration_Runner::rollback_last( 'bookit-{slug}' );
} );
```

### Naming convention

Files must match `NNNN-description.php`. Class name is derived from filename:

| File | Class |
|------|-------|
| `0001-add-meetings-tables.php` | `Bookit_Migration_0001_Add_Meetings_Tables` |
| `0002-add-meeting-link-column.php` | `Bookit_Migration_0002_Add_Meeting_Link_Column` |

### Migration file contract

```php
<?php
if ( ! defined( 'WPINC' ) ) { die; }

class Bookit_Migration_0001_Add_Meetings_Tables extends Bookit_Migration_Base {

    public function migration_id(): string {
        return '0001-add-meetings-tables';
    }

    public function plugin_slug(): string {
        return 'bookit-{slug}';
    }

    public function up(): void {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();

        // Column existence check — ALWAYS use information_schema, never SHOW COLUMNS LIKE
        $col_exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = %s
             AND TABLE_NAME = %s
             AND COLUMN_NAME = 'meeting_link'",
            DB_NAME,
            $wpdb->prefix . 'bookings'
        ) );

        if ( ! $col_exists ) {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            $wpdb->query( "ALTER TABLE {$wpdb->prefix}bookings ADD COLUMN meeting_link VARCHAR(500) NULL DEFAULT NULL" );
        }
    }

    public function down(): void {
        global $wpdb;
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
        $wpdb->query( "ALTER TABLE {$wpdb->prefix}bookings DROP COLUMN IF EXISTS meeting_link" );
    }
}
```

### Critical rules

- **Always use `information_schema.COLUMNS`** to check column existence. Never
  `SHOW COLUMNS LIKE` — MariaDB treats `_` as a single-character wildcard.
- **Always use `information_schema.TABLES`** to check table existence. Never
  `SHOW TABLES LIKE`.
- `down()` must be the exact inverse of `up()`. Test both directions.
- Never use `JSON_CONTAINS()` — broken on MariaDB 11.4. Use `json_decode()` +
  `in_array()` in PHP instead.
- All tables must use `ENGINE=InnoDB` and `utf8mb4_unicode_ci` charset.

---

## 4. REST API Conventions

### Namespace

All extension endpoints use their own namespace. Never register under `bookit/v1`.

```
bookit-{slug}/v1/
```

Example: `bookit-meetings/v1/settings`, `bookit-meetings/v1/bookings/{id}/link`

### Authentication

**Dashboard endpoints** (require logged-in admin or staff):

```php
private function check_dashboard_permission(): bool|WP_Error {
    if ( ! Bookit_Auth::is_authenticated() ) {
        return new WP_Error(
            'bookit_unauthorized',
            __( 'Authentication required.', 'bookit-{slug}' ),
            [ 'status' => 401 ]
        );
    }
    return true;
}
```

**Public endpoints** (called without session, e.g. from wizard):
Use HMAC-SHA256 token verification. Do **not** use `wp_verify_nonce()` —
it fails on public REST endpoints because nonces are session-specific.

### Response envelope

Match core's response format exactly:

```php
// Success
return rest_ensure_response( [
    'success' => true,
    'data'    => $your_data,
] );

// Error
return new WP_Error(
    'bookit_{slug}_error_code',
    __( 'Human-readable message.', 'bookit-{slug}' ),
    [ 'status' => 400 ]
);
```

### Endpoint registration

```php
class Bookit_Meetings_Api {

    public function register_routes(): void {
        register_rest_route( 'bookit-meetings/v1', '/settings', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ $this, 'get_settings' ],
            'permission_callback' => [ $this, 'check_dashboard_permission' ],
        ] );
    }
}

// In your loader:
add_action( 'rest_api_init', [ new Bookit_Meetings_Api(), 'register_routes' ] );
```

### MariaDB gotchas

- `JSON_CONTAINS()` — **do not use**. Use `json_decode()` + `in_array()` in PHP.
- `SHOW COLUMNS LIKE` — **do not use**. Use `information_schema.COLUMNS`.
- `SHOW TABLES LIKE` — **do not use**. Use `information_schema.TABLES`.
- Never pass base64-encoded strings through `sanitize_text_field()` — it strips
  `+`, `/`, and `=` characters.

---

## 5. Dashboard Vue App

Extensions that need a dashboard UI ship their own standalone Vue 3 app.

### Vite config

```js
// dashboard/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig( {
    plugins: [ vue() ],
    base: './',          // ← CRITICAL — must be './' not '/'
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                entryFileNames: 'app.js',
                assetFileNames: 'app.[ext]',
            },
        },
    },
} )
```

**Never change `base` away from `'./'`**. Using `'/'` causes the double-mount
crash seen in core development (Vite `base: '/'` + `?v=` query string = two
Vue instances mounting to the same element).

### Enqueueing assets

Use the `bookit_dashboard_loaded` action — this fires after the dashboard
authentication check, before the Vue app boots:

```php
add_action( 'bookit_dashboard_loaded', function( array $current_user ) {
    wp_enqueue_script(
        'bookit-{slug}-app',
        BOOKIT_{SLUG}_PLUGIN_URL . 'dashboard/dist/app.js',
        [],
        BOOKIT_{SLUG}_VERSION,
        true
    );
    wp_enqueue_style(
        'bookit-{slug}-app',
        BOOKIT_{SLUG}_PLUGIN_URL . 'dashboard/dist/app.css',
        [],
        BOOKIT_{SLUG}_VERSION
    );

    // Output mount point via wp_footer — never echo directly here
    add_action( 'wp_footer', function() {
        echo '<div id="bookit-{slug}-app"></div>';
    } );
} );
```

**Never call `wp_enqueue_media()` at dashboard boot time** — it causes a
double asset load. Only enqueue it lazily when actually needed.

### Mounting

```js
// dashboard/src/main.js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp( App )
app.mount( '#bookit-{slug}-app' )
```

### Accessing core data

The `window.bookitDashboard` object is available when your app mounts:

```js
const apiBase  = window.bookitDashboard.apiBase   // e.g. https://example.com/wp-json
const nonce    = window.bookitDashboard.nonce      // X-WP-Nonce header value
const user     = window.bookitDashboard.currentUser
const settings = window.bookitDashboard.settings
```

Pass extension-specific config via the `bookit_dashboard_js_data` filter:

```php
add_filter( 'bookit_dashboard_js_data', function( array $js_data ): array {
    $js_data['meetings'] = [
        'zoom_connected' => my_zoom_is_connected(),
        'platforms'      => [ 'zoom', 'meet', 'whatsapp', 'teams', 'generic' ],
    ];
    return $js_data;
} );
```

### CSS conventions

Use the same CSS custom properties as core. Never hardcode colours.

```css
/* ✅ Correct */
color: var(--bookit-text-primary);
background: var(--bookit-bg-card);
border-color: var(--bookit-color-primary);

/* ❌ Wrong */
color: #1a1a1a;
background: #ffffff;
```

Core CSS variables are injected into the page by the dashboard. Your Vue
app inherits them automatically.

### File upload from Vue

If your extension needs file uploads, use `fetch()` + `FormData`. **Never
use `useApi()` (axios) for file uploads** — axios hardcodes
`Content-Type: application/json` which breaks the multipart boundary.

```js
const formData = new FormData()
formData.append( 'file', fileInput.files[0] )

const response = await fetch( `${apiBase}/bookit-{slug}/v1/upload`, {
    method: 'POST',
    headers: { 'X-WP-Nonce': nonce },
    body: formData
    // Do NOT set Content-Type manually — let the browser set it from FormData
} )
```

### Build and deploy

After any Vue/JS change:

```bash
cd dashboard
npm run build
```

Then upload the `dist/` folder to the server. **Always delete the entire
`dist/` folder on the server first, then upload** — partial uploads with
stale files cause hard-to-diagnose cache issues.

After upload, perform the three-layer cache purge:
1. LiteSpeed cache (wp-admin → LiteSpeed Cache → Purge All)
2. Hostinger server cache (control panel)
3. CDN cache (if applicable)

---

## 6. PHPUnit Tests

### Bootstrap

Create `tests/bootstrap.php`. It must load both the core plugin (from the
installed zip) and your extension:

```php
<?php
// tests/bootstrap.php

$_tests_dir = getenv( 'WP_TESTS_DIR' ) ?: '/tmp/wordpress-tests-lib';

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
    die( "ERROR: WordPress test library not found. Is wp-env running?\n" );
}

// Suppress debug output during test runs
if ( ! defined( 'WP_DEBUG' ) ) { define( 'WP_DEBUG', false ); }
if ( ! defined( 'WP_DEBUG_DISPLAY' ) ) { define( 'WP_DEBUG_DISPLAY', false ); }
ini_set( 'log_errors', '0' );

require_once $_tests_dir . '/includes/functions.php';

function _manually_load_plugins() {
    // Load core first, then the extension
    require dirname( __DIR__, 2 ) . '/bookit-booking-system/bookit-booking-system.php';
    require dirname( __DIR__ ) . '/bookit-{slug}.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugins' );

require $_tests_dir . '/includes/bootstrap.php';
```

### `phpunit.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
    <testsuites>
        <testsuite name="unit">
            <directory>tests/unit</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### Running tests

```bash
# Via wp-env (recommended — uses isolated test DB)
npm test

# Direct (if wp-env is running)
wp-env run tests vendor/bin/phpunit
```

### Test file naming

```
tests/unit/test-{feature}.php
```

Each test class extends `WP_UnitTestCase`. Test method names must be
descriptive enough to understand without reading the body:

```php
class Test_Meetings_Settings extends WP_UnitTestCase {

    public function test_get_settings_requires_authentication(): void { ... }
    public function test_zoom_connection_returns_false_when_not_configured(): void { ... }
    public function test_meeting_link_generated_for_whatsapp_platform(): void { ... }
}
```

### Coverage expectations

Aim for 100% coverage of:
- All REST endpoint permission callbacks
- All migration `up()` and `down()` methods
- All business logic classes
- All hook callbacks that contain logic (not just pass-throughs)

### Key gotchas

- `wp_verify_nonce()` fails on public REST endpoints — never use it there.
  Use HMAC-SHA256 for public endpoint auth.
- `sanitize_text_field()` strips base64 characters (`+`, `/`, `=`). Never
  run OAuth state tokens or base64 values through it.
- `information_schema.COLUMNS` for column checks in tests — same rule as
  production code.

---

## 7. Playwright E2E Tests

### Two-mode architecture

One test suite, controlled by environment variable. Mirrors the core plugin
Playwright setup exactly:

```bash
MODE=smoke npx playwright test    # Against live site — no email/external tools needed
MODE=full  npx playwright test    # Against local — fully automated with Mailpit
```

### Setup

```bash
cd tests/e2e
npm install
npx playwright install chromium
```

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

const mode = process.env.MODE || 'smoke'
const isFullMode = mode === 'full'

dotenv.config( {
    path: path.resolve( __dirname, isFullMode ? '.env.test.local' : '.env.test.live' ),
} )

export default defineConfig( {
    testDir: './tests',
    timeout: 90_000,
    retries: isFullMode ? 0 : 1,
    workers: 1,
    reporter: [ [ 'html', { open: 'never' } ], [ 'list' ] ],
    use: {
        baseURL: process.env.BASE_URL,
        headless: ! isFullMode,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [ { name: 'chromium', use: { ...devices[ 'Desktop Chrome' ] } } ],
} )
```

### Writing tests that depend on core

Your extension's E2E tests will need core to be running (bookings, dashboard,
wizard). Always:

1. Authenticate via the core dashboard login before testing extension pages.
2. Create test data (bookings, services) via the core REST API or wp-admin,
   not by inserting directly into the DB.
3. **Check the timeslots API response before asserting slot availability** —
   calendar day appearance and slot availability are independent. Register
   `waitForResponse` before clicking a calendar day:

```typescript
const slotsPromise = page.waitForResponse( r =>
    r.url().includes( '/wizard/timeslots' ) && r.status() === 200
)
await page.click( '[data-date="2026-05-15"]' )
const slotsResponse = await slotsPromise
const slots = await slotsResponse.json()
expect( slots.data.available ).toBeTruthy()
```

### Smoke vs full

| Tag | Environment | When |
|-----|-------------|------|
| `@smoke` | Live site | After every deploy |
| `@full` | Local + Mailpit | Before every PR merge |

```typescript
// Smoke only — page loads and extension UI renders
test( 'meetings settings page loads', { tag: '@smoke' }, async ( { page } ) => { ... } )

// Full — end-to-end meeting link generation
test( 'meeting link appears on confirmation', { tag: '@full' }, async ( { page } ) => { ... } )
```

### Environment files

```bash
# tests/e2e/.env.test.local (gitignored)
BASE_URL=http://localhost:8888
BOOKIT_TEST_ADMIN_EMAIL=admin@test.com
BOOKIT_TEST_ADMIN_PASSWORD=password

# tests/e2e/.env.test.live (gitignored)
BASE_URL=https://your-test-site.com
BOOKIT_TEST_ADMIN_EMAIL=admin@your-site.com
BOOKIT_TEST_ADMIN_PASSWORD=...
```

---

## 8. Cursor IDE Setup

### `.cursor/rules`

Create `.cursor/rules` in the extension repo root. This file tells Cursor
about the project every time it opens a file. Keep it concise — one screen.

```
# Bookit {Extension Name} Extension

## Stack
PHP 8.0+, WordPress 6.4, MariaDB 11.4
Vue 3 + Vite (dashboard only)
PHPUnit 9.5, Playwright 1.44

## This is an extension plugin
- Never modify core plugin files
- Register all routes under bookit-{slug}/v1/ namespace, never bookit/v1/
- All DB changes via migration files in database/migrations/
- Extension hooks only — consume bookit_* actions and filters, don't fire them

## Read before write
- Always read existing files via GitHub before modifying them
- Never assume file contents — always verify

## Naming
- PHP classes: Bookit_{Slug}_Loader, Bookit_{Slug}_Api, etc.
- DB tables: {wpdb_prefix}bookit_{slug}_*
- Constants: BOOKIT_{SLUG}_VERSION, BOOKIT_{SLUG}_PLUGIN_DIR

## Critical gotchas
- NEVER use JSON_CONTAINS() — broken on MariaDB 11.4
- NEVER use SHOW COLUMNS LIKE or SHOW TABLES LIKE — use information_schema
- NEVER use sanitize_text_field() on base64 or OAuth tokens
- NEVER use wp_verify_nonce() on public REST endpoints
- NEVER set Content-Type manually when using FormData (file uploads)
- Vue builds: base must be './' in vite.config.js — never '/'
- After any Vue change: npm run build in dashboard/ (manual step)
- dist/ is gitignored — never commit built assets

## Infrastructure
- New DB tables → database/migrations/NNNN-description.php
- REST endpoints → api/class-{slug}-api.php
- Hooks registered → includes/class-bookit-{slug}-loader.php

## Escalate if unsure
Stop and report before writing code if architecture is unclear.
```

### Composer vs Agent mode

| Mode | Use for |
|------|---------|
| **Composer** (`Ctrl+I`) | Creating new files, multi-file features, initial implementation |
| **Agent / Chat** (`Ctrl+L`) | Single-file edits, bug fixes, adding one function, test fixes |

Use Composer for any task that touches more than 2 files. Use Agent for
targeted edits where you know exactly which file and line.

### `@` file references

Always reference specific files in Cursor prompts, never whole folders:

```
✅  @includes/class-bookit-meetings-loader.php
✅  @database/migrations/0001-add-meetings-tables.php
❌  @includes/          (too broad — Cursor may miss the relevant file)
❌  @database/          (too broad)
```

Reference the migration runner from core to show Cursor the pattern:
```
@bookit-booking-system/includes/class-bookit-migration-runner.php
```

### Recommended Cursor settings

```json
{
  "editor.formatOnSave": true,
  "files.associations": {
    "*.php": "php"
  },
  "phpcs.standard": "WordPress",
  "editor.tabSize": 4,
  "editor.insertSpaces": false
}
```

### What Cursor cannot access

- The live site (no internet from Cursor's container)
- The `wp-env` database directly (use Adminer in the browser)
- Built Vue assets (`dist/`) — these are gitignored and must be built manually

### Prompt discipline

Every Cursor prompt handed off from a sprint chat must:

1. Open with **READ FIRST** — list every file to read before writing any code
2. Reference the core plugin file for any pattern being followed
3. Include a **Context7 note** for any library-specific implementation
4. End with the **escalation note**: "Stop and report if architecture is unclear"
5. Include the **build instruction** if any Vue files are modified

---

## 9. Claude Project Setup

### Project knowledge files

Every extension's Claude project must contain exactly these files:

| File | Purpose |
|------|---------|
| `Extension_Developer_Handbook.md` | This file — all conventions and BKMs |
| `Extension_Plugin_API_Spec.md` | Hook and filter contract with core v1.5.0 |
| `Extension_Context_Brief.md` | Core version, table names, env specs, auth model |
| `Bookit_REST_API_Reference_Phase1.md` | Core REST endpoints the extension can call |

Do **not** add `progress.md`, customer journey docs, SRS, legal checklist,
hosting strategy, or any other core project file. Extension projects are
self-contained.

### PA chat system prompt

Each extension's PA (Project Assistant) chat uses the
`Extension_PA_System_Prompt_Template.md` file, filled in with the
extension-specific values. The PA chat is a long-running strategic chat —
one per extension project, never restarted.

The PA chat does **not** write code. It plans sprints, reviews completions,
and produces sprint prompts as downloadable files.

### Sprint chats

One new chat per sprint. Before starting any sprint chat, enable:

| Tool | Why |
|------|-----|
| **GitHub connector** | Sprint agent reads current file contents before any implementation |
| **Context7 connector** | Sprint agent fetches current library docs (Vue 3, WP REST API, PHPUnit) |
| **cursor-prompt-generator skill** | Enforces consistent, high-quality Cursor prompt structure |

### cursor-prompt-generator skill

The core project's `cursor-prompt-generator` skill lives at
`/mnt/skills/user/cursor-prompt-generator/SKILL.md` in the core Claude project.

For an extension project, **copy and adapt** it:

1. Copy the skill file into the extension's Claude project as a user skill
2. Update the **TASK HEADER** section to reference the extension's plugin root
3. Update the **INFRASTRUCTURE WIRING** section — replace Sprint 4B core references
   with the extension's own migration runner registration pattern
4. Update the **COMMON PATTERNS REFERENCE** table — replace core file paths with
   extension file paths
5. Update the **KNOWN GOTCHAS** — keep all cross-cutting gotchas, remove core-specific ones

Keep the structure identical. Only change the project-specific references.

### Project naming convention

| Extension | Claude project name | Repo |
|-----------|---------------------|------|
| Bookit Meetings | `Bookit Meetings` | `lstroh/bookit-meetings` |
| Bookit Recurring | `Bookit Recurring` | `lstroh/bookit-recurring` |
| Bookit Classes | `Bookit Classes` | `lstroh/bookit-classes` |
| Bookit Forms | `Bookit Forms` | `lstroh/bookit-forms` |
| Bookit Reviews | `Bookit Reviews` | `lstroh/bookit-reviews` |

---

## 10. BKMs — Best Known Methods

Accumulated from Phase 1 development. Read before every sprint.

### Database

**`JSON_CONTAINS()` is broken on MariaDB 11.4.**
Never use it. Instead, fetch the JSON column value and use PHP:
```php
$ids = json_decode( $row['applicable_service_ids'], true ) ?? [];
if ( in_array( $service_id, $ids, true ) ) { ... }
```

**Column existence checks must use `information_schema.COLUMNS`.**
`SHOW COLUMNS LIKE 'name'` treats `_` as a single-character wildcard in
MariaDB, causing false positives on column names that share a prefix.
```php
$exists = $wpdb->get_var( $wpdb->prepare(
    "SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
    DB_NAME, $wpdb->prefix . 'your_table', 'your_column'
) );
```

**Same rule applies to table existence checks.**
Use `information_schema.TABLES`, not `SHOW TABLES LIKE`.

**All tables must use InnoDB + utf8mb4.**
```sql
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### Authentication and security

**`wp_verify_nonce()` fails on public REST endpoints.**
Nonces are tied to a WordPress session. Public endpoints have no session.
Use HMAC-SHA256 tokens for public endpoint authentication instead.

**Never expose OAuth tokens in API responses.**
Always `unset()` token fields before returning any response that includes
credential or OAuth data.

**`sanitize_text_field()` strips base64 characters.**
The characters `+`, `/`, and `=` are removed. Never pass OAuth state tokens,
base64-encoded values, or cryptographic tokens through `sanitize_text_field()`.

### REST API

**Session auth vs HMAC auth.**
Dashboard endpoints (admin/staff): use `Bookit_Auth::is_authenticated()`
(session-based). Public endpoints (no session): use HMAC-SHA256.

**Never register routes under `bookit/v1`.**
This namespace belongs to core. Extension routes: `bookit-{slug}/v1/`.

### Vue / Frontend

**`base: './'` in Vite config is mandatory.**
Using `base: '/'` combined with WordPress's `?v=` cache-busting query string
causes two Vue instances to mount to the same DOM element (double-mount crash).
Always `base: './'`.

**File uploads must use `fetch()` + `FormData`, not axios.**
`useApi()` (axios) hardcodes `Content-Type: application/json`. Multipart
file uploads require the browser to set the Content-Type with the boundary.
Never set `Content-Type` manually when using FormData.

**`wp_enqueue_media()` must not be called at dashboard boot.**
It causes a double asset load. Only call it lazily when needed (e.g. inside
a click handler that opens a media picker).

**`<script>` blocks from shortcodes must go via `wp_footer`.**
Never `return` script tags from a shortcode callback — they render inline in
the content and break in some WordPress page builders. Use `add_action('wp_footer', ...)`.

**After every Vue change, `npm run build` must be run manually.**
The `dist/` directory is gitignored. Cursor's container does not have access
to your local `wp-env` site. The build must be run in your local environment.

**Deploying `dist/`:**
Always delete the entire `dist/` folder on the server first, then upload the
new build. Partial uploads with stale files cause silent rendering failures.
After upload: three-layer cache purge (LiteSpeed → server cache → CDN).

### Booking data

**Cancelled bookings have `start_time = NULL` and `end_time = NULL`.**
Original slot times are in `cancelled_start_time` and `cancelled_end_time`.
Any function that formats or displays booking times must null-guard both fields.

**`get_full_booking()` must not filter `deleted_at IS NULL`.**
The notifier and magic link handlers need to access cancelled bookings. A
hard `deleted_at IS NULL` filter in `get_full_booking()` will silently break
cancellation email delivery.

### Action Scheduler

**3-parameter Action Scheduler callbacks use positional array args only.**
When scheduling actions with multiple parameters, pass them as a positional
array. Do not use named keys.

### Deployment

**Three-layer cache purge after every deploy:**
1. LiteSpeed cache (wp-admin → LiteSpeed Cache → Purge All)
2. Hostinger server cache (hosting control panel)
3. CDN cache (if active)

Skipping any layer causes customers to see stale pages even after a
successful deployment.

---

## 11. CI / GitHub Actions

### PHPUnit on every PR

```yaml
# .github/workflows/phpunit.yml
name: PHPUnit

on:
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install wp-env
        run: npm install

      - name: Start wp-env
        run: npm run wp-env:start

      - name: Install PHP dependencies
        run: npm run wp-env:run -- development composer install

      - name: Run PHPUnit
        run: npm test
```

### Playwright smoke on every push

```yaml
# .github/workflows/e2e-smoke.yml
name: Playwright Smoke

on:
  push:
    branches: [ main ]

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Playwright dependencies
        run: |
          cd tests/e2e
          npm ci
          npx playwright install chromium

      - name: Run smoke tests
        run: |
          cd tests/e2e
          MODE=smoke npx playwright test --grep "@smoke"
        env:
          BASE_URL: ${{ secrets.TEST_SITE_URL }}
          BOOKIT_TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          BOOKIT_TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

### GitHub Actions secrets

Store all credentials as repository secrets — never in files:

| Secret | Value |
|--------|-------|
| `TEST_SITE_URL` | URL of the test WordPress site |
| `TEST_ADMIN_EMAIL` | Test site admin email |
| `TEST_ADMIN_PASSWORD` | Test site admin password |

Smoke tests run against the live test site. Never run full E2E tests in CI —
they require Mailpit and other local tools.
