CONTEXT
=======
Plugin: bookit-booking-system (WordPress plugin)
Branch: Phase1
Environment: Local by Flywheel (dev) + wp-env (PHPUnit)
PHP: 8.0+ / WordPress 6.0+
All code follows WordPress Coding Standards.

BACKGROUND
==========
Currently, migrations run inline in class-bookit-activator.php or as simple
file-based classes in database/migrations/ (e.g. migration-add-status-log.php,
migration-add-staff-working-hours.php). These existing migrations have no
tracking — they run IF conditions on every activation. Sprint 4B introduces a
proper migration framework with a state tracking table.

YOUR TASK
=========
Implement the Bookit Migration Framework. Do not modify any existing migration
files or the activator yet — the integration step comes at the end.

DELIVERABLES — implement in this exact order:

───────────────────────────────────────────────────────────────────────────────
STEP 1: Abstract base class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/database/migrations/class-bookit-migration-base.php

<?php
if ( ! defined( 'WPINC' ) ) { die; }

abstract class Bookit_Migration_Base {

    /** @return string Unique migration ID, must match filename without .php */
    abstract public function migration_id(): string;

    /** @return string Plugin slug this migration belongs to */
    public function plugin_slug(): string {
        return 'bookit-booking-system';
    }

    /** Run the migration (forward). */
    abstract public function up(): void;

    /** Roll back the migration (reverse). */
    abstract public function down(): void;
}

───────────────────────────────────────────────────────────────────────────────
STEP 2: Migration Runner class
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/class-bookit-migration-runner.php

The class must:

a) Maintain a static registry of migration paths:
   private static array $migration_paths = [];
   
   public static function register_migration_path( string $plugin_slug, string $path ): void
   // Stores $path keyed by $plugin_slug. Extensions call this on plugins_loaded.
   // Core's own path is registered automatically inside the class (do not
   // require external registration for the core plugin).
   // Core path: BOOKIT_PLUGIN_DIR . 'database/migrations/'

b) Implement:

   public static function run_pending( string $plugin_slug = 'bookit-booking-system' ): array
   // Returns array of migration IDs that were run.
   // Algorithm:
   //   1. Get the migrations path for $plugin_slug.
   //   2. Scan directory for files matching /^\d{4}-.+\.php$/ (new numbered format).
   //      Sort alphabetically (which gives correct numeric order by prefix).
   //   3. For each file: check has_run(). If not run: require_once, instantiate
   //      the class (class name derived from filename — see naming convention below),
   //      call up(), then record in wp_bookings_migrations.
   //   4. Silently skip files that don't match the naming pattern (this allows
   //      old-style migration-*.php files to coexist without errors).
   //   5. Wrap each migration in a try/catch. On failure: log via Bookit_Logger,
   //      stop running further migrations for this slug, return what ran so far.

   public static function has_run( string $migration_id, string $plugin_slug = 'bookit-booking-system' ): bool
   // SELECT from wp_bookings_migrations WHERE migration_id = ? AND plugin_slug = ?

   public static function mark_as_run( string $migration_id, string $plugin_slug = 'bookit-booking-system' ): void
   // INSERT IGNORE into wp_bookings_migrations

   public static function rollback_last( string $plugin_slug = 'bookit-booking-system' ): bool
   // Find the most recent migration for $plugin_slug from wp_bookings_migrations.
   // Require the file, instantiate, call down(), DELETE the record.
   // Returns true on success, false if no migrations found or on error.

   public static function rollback_to( string $target_migration_id, string $plugin_slug = 'bookit-booking-system' ): void
   // Roll back all migrations newer than $target_migration_id for $plugin_slug,
   // in reverse order (newest first). Calls down() + deletes record for each.

   public static function create_migrations_table(): void
   // Creates wp_bookings_migrations if it doesn't exist.
   // Uses $wpdb->query() directly — NOT dbDelta() — for simplicity.
   // SQL:
   //   CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bookings_migrations (
   //     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   //     migration_id VARCHAR(200) NOT NULL,
   //     plugin_slug VARCHAR(100) NOT NULL DEFAULT 'bookit-booking-system',
   //     ran_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   //     UNIQUE KEY uq_migration (migration_id, plugin_slug),
   //     KEY idx_plugin_slug (plugin_slug)
   //   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

c) CLASS NAMING CONVENTION for numbered migrations:
   Filename: 0001-add-booking-reference.php
   Class name: Bookit_Migration_0001_Add_Booking_Reference
   Derivation: 'Bookit_Migration_' + ucwords(str_replace('-', '_', filename_without_extension))
   
   Implement a private helper:
   private static function class_name_from_filename( string $filename ): string
   // $filename = '0001-add-booking-reference'  (no .php)
   // return 'Bookit_Migration_' . str_replace( '-', '_', ucwords( $filename, '-' ) );
   // Result: 'Bookit_Migration_0001_Add_Booking_Reference'
   
   Note: str_replace( '-', '_', ucwords( $filename, '-' ) ) first ucwords on '-' delimiter,
   then replaces hyphens with underscores.

d) All wpdb calls must use $wpdb->prepare() where values are substituted.
   Use WordPress direct DB query suppression comments where needed (phpcs:ignore).
   Never suppress prepare() warnings — always prepare when values present.

───────────────────────────────────────────────────────────────────────────────
STEP 3: Global registration function
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/includes/functions-migration.php

<?php
if ( ! defined( 'WPINC' ) ) { die; }

/**
 * Register a migration path for an extension plugin.
 * Extensions call this on the plugins_loaded hook.
 *
 * @param string $plugin_slug  Extension's plugin slug (e.g. 'bookit-recurring').
 * @param string $path         Absolute filesystem path to the migrations directory.
 */
function bookit_register_migration_path( string $plugin_slug, string $path ): void {
    Bookit_Migration_Runner::register_migration_path( $plugin_slug, $path );
}

───────────────────────────────────────────────────────────────────────────────
STEP 4: Integrate into activator
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-activator.php

In the activate() method, BEFORE the existing migration require_once/up() calls:

1. Add require_once for the migration runner and functions file:
   require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-migration-runner.php';
   require_once BOOKIT_PLUGIN_DIR . 'includes/functions-migration.php';

2. Call Bookit_Migration_Runner::create_migrations_table() immediately.

3. After create_migrations_table(), mark the two existing old-style migrations
   as already-run (so run_pending() never tries to re-run them):
   
   Bookit_Migration_Runner::mark_as_run( 'migration-add-staff-working-hours', 'bookit-booking-system' );
   Bookit_Migration_Runner::mark_as_run( 'migration-add-status-log', 'bookit-booking-system' );
   
   These use the old filename (without .php) as the migration_id. This is
   intentional — it uniquely identifies them without needing to refactor the
   files themselves.

4. Then call:
   Bookit_Migration_Runner::run_pending();
   
   This will run any new numbered migrations (0001-*.php, etc.) that don't
   already have a record. On first activation of an existing install, only
   the two mark_as_run() calls above are new — run_pending() will find zero
   new migrations to run (unless Task 6's migration file is already present).

5. Keep the existing explicit require_once/up() calls for staff-working-hours
   and status-log BELOW run_pending() as a safety fallback for fresh installs
   where the table might not exist yet. Add a comment explaining this.
   
   Actually — reconsider this. On a FRESH install, run_pending() will call
   0001-*.php etc. but the old migrations (staff-working-hours, status-log)
   need to run too. They're still triggered by the existing explicit calls
   in the activator, so leave those explicit calls in place. The mark_as_run()
   calls ensure run_pending() doesn't try to re-process them if someone
   ever converts them to numbered files later.

───────────────────────────────────────────────────────────────────────────────
STEP 5: Load migration runner in class-bookit-loader.php
───────────────────────────────────────────────────────────────────────────────
Edit: bookit-booking-system/includes/class-bookit-loader.php

In load_dependencies(), add near the top (after logger):
   require_once BOOKIT_PLUGIN_DIR . 'includes/class-bookit-migration-runner.php';
   require_once BOOKIT_PLUGIN_DIR . 'includes/functions-migration.php';

Add a hook in define_admin_hooks() or define_public_hooks() — actually, add
it in __construct() after load_dependencies():

   add_action( 'plugins_loaded', array( $this, 'run_pending_migrations' ), 20 );

Add the method:
   public function run_pending_migrations(): void {
       $installed_version = get_option( 'bookit_version', '0.0.0' );
       if ( version_compare( $installed_version, BOOKIT_VERSION, '<' ) ) {
           Bookit_Migration_Runner::run_pending();
           update_option( 'bookit_version', BOOKIT_VERSION );
       }
   }

This ensures migrations run on upgrade (when bookit_version in DB is older
than the current BOOKIT_VERSION constant), without running on every page load.

───────────────────────────────────────────────────────────────────────────────
STEP 6: Verify with a stub migration (for testing only — delete after tests pass)
───────────────────────────────────────────────────────────────────────────────
Create: bookit-booking-system/database/migrations/0000-test-migration.php

<?php
if ( ! defined( 'WPINC' ) ) { die; }

class Bookit_Migration_0000_Test_Migration extends Bookit_Migration_Base {
    public function migration_id(): string { return '0000-test-migration'; }
    public function up(): void {
        // No-op test migration — just confirms the framework can run a migration.
        Bookit_Logger::info( 'Test migration 0000 up() called' );
    }
    public function down(): void {
        Bookit_Logger::info( 'Test migration 0000 down() called' );
    }
}

After confirming the framework runs this migration correctly (check
wp_bookings_migrations table in your dev DB), DELETE this file and its
corresponding record from the migrations table. This file is scaffolding only.

TESTING AFTER IMPLEMENTATION
=============================
After implementation, verify manually:

1. Activate/deactivate/reactivate the plugin in your Local by Flywheel site.
2. Check wp_bookings_migrations table exists with correct schema.
3. Confirm the test migration (0000-test-migration) has a row in the table.
4. Run from WP-CLI if available: wp eval "Bookit_Migration_Runner::has_run('0000-test-migration');"
5. Check that migration-add-staff-working-hours and migration-add-status-log
   both appear in wp_bookings_migrations (marked by the activator).
6. Delete the 0000 test file, delete its DB row manually, confirm run_pending()
   finds nothing new to run on next page load (version matches).

DO NOT WRITE PHPUnit TESTS YET — those are Task 9.
DO NOT create any numbered migration files beyond 0000 test — Tasks 4 and 6
will create 0001, 0002, 0003.

CODING STANDARDS
================
- WordPress Coding Standards (WPCS) throughout
- All strings in proper phpcs:ignore only where documented as needed
- No dynamic SQL without $wpdb->prepare()
- File headers: @package Bookit_Booking_System / @subpackage includes
- Class methods: use type hints (PHP 8.0 style)
- No short closures — use proper functions/methods