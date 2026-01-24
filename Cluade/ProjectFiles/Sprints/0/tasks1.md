# SPRINT 0 TASK BREAKDOWN - ALL 8 TASKS

**Generated:** January 24, 2026
**Sprint:** Sprint 0 (Foundation & Setup)
**Total Estimated Hours:** 52 hours

---

# TASK 1: PLUGIN BOILERPLATE

## Goal
Create the foundational WordPress plugin structure with proper activation/deactivation hooks, security checks, and file organization following WordPress coding standards.

## Prerequisites
None - This is the first task

## Estimated Time
8 hours

## Files to Create/Modify
- `booking-system.php` (main plugin file)
- `includes/class-booking-activator.php`
- `includes/class-booking-deactivator.php`
- `includes/class-booking-loader.php`
- `admin/class-booking-admin.php`
- `public/class-booking-public.php`
- `.gitignore`
- `composer.json`
- `README.md`
- `uninstall.php`

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Create a WordPress plugin boilerplate for the "Booking System" plugin following WordPress coding standards and the MVC pattern.

**Plugin Details:**
- **Plugin Name:** Booking System
- **Description:** Professional appointment booking system for UK service businesses
- **Version:** 1.0.0
- **Author:** Liron (or your name)
- **License:** GPL-2.0+
- **Text Domain:** booking-system
- **Requires at least:** WordPress 6.0
- **Requires PHP:** 8.0

**Directory Structure to Create:**
```
booking-system/
├── booking-system.php          (main plugin file)
├── uninstall.php               (cleanup on uninstall)
├── .gitignore
├── composer.json
├── README.md
├── includes/
│   ├── class-booking-activator.php
│   ├── class-booking-deactivator.php
│   └── class-booking-loader.php
├── admin/
│   ├── class-booking-admin.php
│   └── css/
│   └── js/
├── public/
│   ├── class-booking-public.php
│   └── css/
│   └── js/
└── tests/
    └── (empty for now, Task 7 will populate)
```

**booking-system.php (Main Plugin File):**
```php
<?php
/**
 * Plugin Name:       Booking System
 * Plugin URI:        https://example.com/booking-system
 * Description:       Professional appointment booking system for UK service businesses
 * Version:           1.0.0
 * Author:            Liron
 * Author URI:        https://example.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       booking-system
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Current plugin version.
 */
define( 'BOOKING_SYSTEM_VERSION', '1.0.0' );

/**
 * Plugin directory path.
 */
define( 'BOOKING_SYSTEM_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Plugin directory URL.
 */
define( 'BOOKING_SYSTEM_URL', plugin_dir_url( __FILE__ ) );

/**
 * The code that runs during plugin activation.
 */
function activate_booking_system() {
	require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-activator.php';
	Booking_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_booking_system() {
	require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-deactivator.php';
	Booking_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_booking_system' );
register_deactivation_hook( __FILE__, 'deactivate_booking_system' );

/**
 * The core plugin class.
 */
require BOOKING_SYSTEM_PATH . 'includes/class-booking-loader.php';

/**
 * Begins execution of the plugin.
 */
function run_booking_system() {
	$plugin = new Booking_Loader();
	$plugin->run();
}
run_booking_system();
```

**includes/class-booking-activator.php:**
```php
<?php
/**
 * Fired during plugin activation.
 *
 * @package    Booking_System
 * @subpackage Booking_System/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Fired during plugin activation.
 */
class Booking_Activator {

	/**
	 * Activation tasks.
	 *
	 * - Create database tables (handled in Tasks 2 & 3)
	 * - Set default options
	 * - Check system requirements
	 * - Create log directory
	 */
	public static function activate() {
		// Check PHP version
		if ( version_compare( PHP_VERSION, '8.0', '<' ) ) {
			deactivate_plugins( plugin_basename( __FILE__ ) );
			wp_die(
				esc_html__( 'Booking System requires PHP 8.0 or higher.', 'booking-system' )
			);
		}

		// Check WordPress version
		global $wp_version;
		if ( version_compare( $wp_version, '6.0', '<' ) ) {
			deactivate_plugins( plugin_basename( __FILE__ ) );
			wp_die(
				esc_html__( 'Booking System requires WordPress 6.0 or higher.', 'booking-system' )
			);
		}

		// Create log directory
		$log_dir = wp_upload_dir()['basedir'] . '/bookings/logs';
		if ( ! file_exists( $log_dir ) ) {
			wp_mkdir_p( $log_dir );
			// Add .htaccess to protect logs
			$htaccess_content = "Deny from all\n";
			file_put_contents( $log_dir . '/.htaccess', $htaccess_content );
		}

		// Set plugin version option
		update_option( 'booking_system_version', BOOKING_SYSTEM_VERSION );

		// Set default settings
		$default_settings = array(
			'timezone'              => 'Europe/London',
			'currency'              => 'GBP',
			'date_format'           => 'd/m/Y',
			'time_format'           => 'H:i',
			'booking_buffer_before' => 0,
			'booking_buffer_after'  => 0,
			'min_booking_notice'    => 60, // 1 hour in minutes
			'max_booking_advance'   => 90, // 90 days
		);
		add_option( 'booking_system_settings', $default_settings );

		// Database setup will be added in Tasks 2 & 3
		// For now, just set a flag
		update_option( 'booking_system_db_version', '1.0' );

		// Flush rewrite rules (for dashboard endpoints)
		flush_rewrite_rules();
	}
}
```

**includes/class-booking-deactivator.php:**
```php
<?php
/**
 * Fired during plugin deactivation.
 *
 * @package    Booking_System
 * @subpackage Booking_System/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Fired during plugin deactivation.
 */
class Booking_Deactivator {

	/**
	 * Deactivation tasks.
	 *
	 * - Clear scheduled events
	 * - Flush rewrite rules
	 * - DO NOT delete database tables (preserve data)
	 * - DO NOT delete settings
	 */
	public static function deactivate() {
		// Clear any scheduled cron events
		$timestamp = wp_next_scheduled( 'booking_system_cleanup_logs' );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'booking_system_cleanup_logs' );
		}

		// Flush rewrite rules
		flush_rewrite_rules();

		// Log deactivation
		error_log( '[Booking System] Plugin deactivated at ' . current_time( 'mysql' ) );
	}
}
```

**includes/class-booking-loader.php:**
```php
<?php
/**
 * The core plugin class.
 *
 * @package    Booking_System
 * @subpackage Booking_System/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The core plugin class.
 */
class Booking_Loader {

	/**
	 * The loader that's responsible for maintaining and registering all hooks.
	 *
	 * @var Booking_Loader
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @var string
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @var string
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 */
	public function __construct() {
		$this->version     = BOOKING_SYSTEM_VERSION;
		$this->plugin_name = 'booking-system';

		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 */
	private function load_dependencies() {
		// Admin-specific functionality
		require_once BOOKING_SYSTEM_PATH . 'admin/class-booking-admin.php';

		// Public-facing functionality
		require_once BOOKING_SYSTEM_PATH . 'public/class-booking-public.php';
	}

	/**
	 * Register all hooks related to the admin area functionality.
	 */
	private function define_admin_hooks() {
		$plugin_admin = new Booking_Admin( $this->get_plugin_name(), $this->get_version() );

		// Admin menu will be added in Task 5
	}

	/**
	 * Register all hooks related to the public-facing functionality.
	 */
	private function define_public_hooks() {
		$plugin_public = new Booking_Public( $this->get_plugin_name(), $this->get_version() );

		// Public hooks will be added in later sprints
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 */
	public function run() {
		// Plugin is loaded and hooks are registered
	}

	/**
	 * The name of the plugin.
	 *
	 * @return string The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return string The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
```

**admin/class-booking-admin.php:**
```php
<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package    Booking_System
 * @subpackage Booking_System/admin
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The admin-specific functionality of the plugin.
 */
class Booking_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @var string
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @var string
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param string $plugin_name The name of this plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the stylesheets for the admin area.
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			$this->plugin_name,
			BOOKING_SYSTEM_URL . 'admin/css/booking-admin.css',
			array(),
			$this->version,
			'all'
		);
	}

	/**
	 * Register the JavaScript for the admin area.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			$this->plugin_name,
			BOOKING_SYSTEM_URL . 'admin/js/booking-admin.js',
			array( 'jquery' ),
			$this->version,
			false
		);
	}
}
```

**public/class-booking-public.php:**
```php
<?php
/**
 * The public-facing functionality of the plugin.
 *
 * @package    Booking_System
 * @subpackage Booking_System/public
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The public-facing functionality of the plugin.
 */
class Booking_Public {

	/**
	 * The ID of this plugin.
	 *
	 * @var string
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @var string
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param string $plugin_name The name of the plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the stylesheets for the public-facing side.
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			$this->plugin_name,
			BOOKING_SYSTEM_URL . 'public/css/booking-public.css',
			array(),
			$this->version,
			'all'
		);
	}

	/**
	 * Register the JavaScript for the public-facing side.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			$this->plugin_name,
			BOOKING_SYSTEM_URL . 'public/js/booking-public.js',
			array( 'jquery' ),
			$this->version,
			false
		);
	}
}
```

**uninstall.php:**
```php
<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package Booking_System
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * NOTE: Uninstall currently does NOT delete data.
 * This preserves customer bookings, payment records, etc.
 * 
 * To enable data deletion on uninstall:
 * 1. Uncomment the code below
 * 2. Add a settings option for "Delete data on uninstall"
 * 3. Only delete if that option is checked
 */

// Global database object
global $wpdb;

// Uncomment to enable data deletion
/*
// Delete all database tables
$tables = array(
	$wpdb->prefix . 'bookings',
	$wpdb->prefix . 'bookings_services',
	$wpdb->prefix . 'bookings_categories',
	$wpdb->prefix . 'bookings_service_categories',
	$wpdb->prefix . 'bookings_staff',
	$wpdb->prefix . 'bookings_staff_services',
	$wpdb->prefix . 'bookings_customers',
	$wpdb->prefix . 'bookings_payments',
	$wpdb->prefix . 'bookings_working_hours',
	$wpdb->prefix . 'bookings_settings',
);

foreach ( $tables as $table ) {
	$wpdb->query( "DROP TABLE IF EXISTS $table" );
}

// Delete all plugin options
delete_option( 'booking_system_version' );
delete_option( 'booking_system_db_version' );
delete_option( 'booking_system_settings' );

// Delete log directory
$log_dir = wp_upload_dir()['basedir'] . '/bookings/logs';
if ( file_exists( $log_dir ) ) {
	array_map( 'unlink', glob( "$log_dir/*.*" ) );
	rmdir( $log_dir );
}
*/
```

**.gitignore:**
```
# WordPress
wp-config.php
wp-content/advanced-cache.php
wp-content/backup-db/
wp-content/backups/
wp-content/blogs.dir/
wp-content/cache/
wp-content/upgrade/
wp-content/uploads/
wp-content/mu-plugins/
wp-content/wp-cache-config.php
wp-content/plugins/hello.php

# Plugin-specific
*.log
.DS_Store
Thumbs.db

# Composer
/vendor/
composer.lock

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Node (if added later)
node_modules/
package-lock.json

# Environment
.env
.env.local
```

**composer.json:**
```json
{
    "name": "booking-system/wordpress-plugin",
    "description": "Professional appointment booking system for UK service businesses",
    "type": "wordpress-plugin",
    "license": "GPL-2.0-or-later",
    "authors": [
        {
            "name": "Liron",
            "email": "your-email@example.com"
        }
    ],
    "require": {
        "php": ">=8.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^9.5",
        "wp-coding-standards/wpcs": "^2.3"
    },
    "autoload": {
        "psr-4": {
            "BookingSystem\\": "includes/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "phpcs": "phpcs --standard=WordPress --extensions=php .",
        "phpcbf": "phpcbf --standard=WordPress --extensions=php ."
    }
}
```

**README.md:**
```markdown
# Booking System - WordPress Plugin

Professional appointment booking system for UK service businesses.

## Features

- Appointment scheduling for service businesses
- Staff management with service assignments
- Customer database with GDPR compliance
- Payment processing (Stripe, PayPal)
- Email notifications via transactional email service
- Google Calendar integration
- Separate business dashboard (non-WordPress admin)

## Requirements

- WordPress 6.0 or higher
- PHP 8.0 or higher
- MySQL 5.7 or higher
- HTTPS enabled (required for payment processing)

## Installation

1. Upload the `booking-system` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to Booking System > Settings to configure

## Development

### Setup

```bash
# Install Composer dependencies
composer install

# Run tests
composer test

# Check coding standards
composer phpcs

# Fix coding standards automatically
composer phpcbf
```

### Directory Structure

```
booking-system/
├── admin/              Admin-specific functionality
├── includes/           Core plugin classes
├── public/             Public-facing functionality
├── tests/              PHPUnit tests
└── booking-system.php  Main plugin file
```

## Testing

Run PHPUnit tests:
```bash
vendor/bin/phpunit
```

## License

GPL-2.0-or-later

## Support

For support, please contact: your-email@example.com
```

**Additional Requirements:**

1. Create empty CSS/JS files:
   - `admin/css/booking-admin.css` (empty file)
   - `admin/js/booking-admin.js` (empty file)
   - `public/css/booking-public.css` (empty file)
   - `public/js/booking-public.js` (empty file)

2. Create empty `tests/` directory (will be populated in Task 7)

**Follow WordPress Coding Standards:**
- All functions prefixed with `booking_`
- All classes prefixed with `Booking_`
- Use `esc_html()`, `esc_attr()`, `esc_url()` for all output
- Use prepared statements for database queries (will be added in Tasks 2-3)
- Add docblocks to all functions and classes
- Use single quotes for strings (unless interpolation needed)
- Proper indentation (tabs, not spaces)

**Expected Behavior After Implementation:**
- Plugin appears in WordPress Plugins list
- Can be activated without errors
- Creates log directory on activation
- Sets default options
- Does NOT create database tables yet (Tasks 2-3)
- No PHP errors or warnings

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Automated Tests (PHPUnit)
- [ ] Test 1: Plugin activation test (will be created in Task 7)
- [ ] Test 2: Version constant test (will be created in Task 7)

**Note:** PHPUnit setup happens in Task 7. For Task 1, we'll use manual testing only.

### Manual Tests

**File Structure Verification:**

1. [ ] Navigate to `C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system\`
2. [ ] Verify all files created:
   - [ ] `booking-system.php` exists
   - [ ] `uninstall.php` exists
   - [ ] `.gitignore` exists
   - [ ] `composer.json` exists
   - [ ] `README.md` exists
   - [ ] `includes/class-booking-activator.php` exists
   - [ ] `includes/class-booking-deactivator.php` exists
   - [ ] `includes/class-booking-loader.php` exists
   - [ ] `admin/class-booking-admin.php` exists
   - [ ] `public/class-booking-public.php` exists
   - [ ] Empty CSS/JS files created

**WordPress Plugin Activation:**

1. [ ] Open WordPress admin: `http://localhost:10000/wp-admin/`
2. [ ] Navigate to Plugins page
3. [ ] Find "Booking System" in plugins list
4. [ ] Check plugin details show correctly:
   - [ ] Name: "Booking System"
   - [ ] Version: 1.0.0
   - [ ] Description shows correctly
5. [ ] Click "Activate"
6. [ ] Plugin activates WITHOUT errors
7. [ ] No PHP warnings in WordPress admin
8. [ ] Page reloads successfully

**Activation Tasks Verification:**

1. [ ] Check log directory created:
   - Navigate to: `C:\Local Sites\your-site\app\public\wp-content\uploads\bookings\logs\`
   - Verify directory exists
   - Verify `.htaccess` file exists in logs directory
2. [ ] Check options created in database:
   - Open Adminer: `http://localhost:10000/wp-content/adminer.php`
   - Login with database credentials
   - Navigate to `wp_options` table
   - Search for `booking_system_version` - should be "1.0.0"
   - Search for `booking_system_db_version` - should be "1.0"
   - Search for `booking_system_settings` - should contain JSON with default settings

**Deactivation Test:**

1. [ ] In WordPress admin, go to Plugins
2. [ ] Click "Deactivate" on Booking System
3. [ ] Plugin deactivates WITHOUT errors
4. [ ] Check that options still exist (data preserved)
5. [ ] Re-activate plugin
6. [ ] Plugin activates successfully

**PHP Error Check:**

1. [ ] Enable WordPress debugging:
   - Edit `wp-config.php`
   - Set `define( 'WP_DEBUG', true );`
   - Set `define( 'WP_DEBUG_LOG', true );`
2. [ ] Deactivate and re-activate plugin
3. [ ] Check debug log: `wp-content/debug.log`
4. [ ] Should have NO PHP errors, warnings, or notices

**Browser Console Check:**

1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Reload WordPress admin page
4. [ ] Should have NO JavaScript errors

### Edge Cases

- [ ] Edge case 1: PHP version check
  - Verify error message shows if PHP < 8.0 (difficult to test without changing PHP version)
  - Code review: Check logic in `class-booking-activator.php`
- [ ] Edge case 2: WordPress version check
  - Verify error message shows if WP < 6.0 (difficult to test without downgrading)
  - Code review: Check logic in `class-booking-activator.php`
- [ ] Edge case 3: Log directory permissions
  - Verify plugin handles case where log directory can't be created
  - Try creating directory manually, then check plugin behavior

### Acceptance Criteria

- [ ] Criterion 1: Plugin activates without errors in WordPress admin
- [ ] Criterion 2: All required files and directories created correctly
- [ ] Criterion 3: Plugin follows WordPress coding standards (indentation, naming, security)
- [ ] Criterion 4: Log directory created with `.htaccess` protection
- [ ] Criterion 5: Default options saved to database
- [ ] Criterion 6: Plugin deactivates cleanly without deleting data
- [ ] Criterion 7: No PHP errors, warnings, or notices in debug.log
- [ ] Criterion 8: `composer.json` is valid JSON

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, initialize Git repository and commit your work:

```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

# Initialize Git repository (first time only)
git init
git branch -M develop

# Add all files
git add .

# First commit
git commit -m "Sprint 0, Task 1: Plugin boilerplate complete

- Created WordPress plugin structure with proper headers
- Implemented activation/deactivation hooks
- Added security checks (PHP 8.0+, WP 6.0+ requirements)
- Created log directory with .htaccess protection
- Set up default plugin options
- Added composer.json for dependency management
- Created admin and public class structure
- Added .gitignore for version control
- Included comprehensive README.md

Tests: Manual tests passing (PHPUnit setup in Task 7)"
```

**Commit message format:**
- First line: "Sprint 0, Task 1: Plugin boilerplate complete"
- Blank line
- Bullet points for key changes
- Test status line

**Note:** You'll push to remote repository later. For now, local commits are sufficient.

---

## COMMON ISSUES

### Issue 1: Plugin doesn't appear in WordPress plugins list
**Symptoms:** Booking System not showing in wp-admin > Plugins
**Solution:** 
- Check file path: Must be `wp-content/plugins/booking-system/booking-system.php`
- Check plugin headers: Must have `Plugin Name:` at minimum
- Check PHP syntax errors: Look in debug.log
- Try: Visit wp-admin > Plugins and click "Check for updates" to refresh list

### Issue 2: Activation errors - "Plugin could not be activated"
**Symptoms:** WordPress shows error message on activation
**Solution:**
- Enable WP_DEBUG and check debug.log for specific error
- Common causes:
  - PHP syntax error in plugin files
  - Missing required files (check all includes)
  - PHP version check failing (if testing on PHP < 8.0)
- Check that all `require` and `require_once` paths are correct

### Issue 3: Log directory not created
**Symptoms:** `wp-content/uploads/bookings/logs/` doesn't exist
**Solution:**
- Check file permissions on `wp-content/uploads/` directory
- On Windows with Local by Flywheel, permissions usually work
- If needed, create directory manually and check plugin handles it gracefully
- Verify `wp_upload_dir()` returns correct path

### Issue 4: Composer install fails
**Symptoms:** `composer install` shows errors
**Solution:**
- Verify Composer is installed: `composer --version`
- If not installed: Download from https://getcomposer.org/
- Check PHP version: `php --version` (must be 8.0+)
- Try: `composer update` instead
- Delete `vendor/` folder and try again

### Issue 5: Plugin constants not defined
**Symptoms:** `BOOKING_SYSTEM_PATH` or `BOOKING_SYSTEM_URL` undefined
**Solution:**
- Check that constants are defined in `booking-system.php` BEFORE any includes
- Verify `plugin_dir_path(__FILE__)` and `plugin_dir_url(__FILE__)` are correct
- Add error checking: `if ( ! defined( 'BOOKING_SYSTEM_PATH' ) ) { ... }`

### Issue 6: "Class not found" errors
**Symptoms:** Fatal error: Class 'Booking_Activator' not found
**Solution:**
- Check file naming: Must match class name exactly
- Verify `require_once` paths are correct
- Check that files start with `<?php` (no spaces before)
- Ensure no trailing `?>` at end of files (WordPress standard)

---

## TASK COMPLETION

When Liron reports "Task 1 complete", confirm:
- [ ] All acceptance criteria met?
- [ ] Plugin activates without errors?
- [ ] All files created correctly?
- [ ] Code follows WordPress standards?
- [ ] Git repository initialized and committed?

If all ✅, respond: "Task 1 complete ✅. Ready for Task 2: Database Schema Part 1?"

---

# TASK 2: DATABASE SCHEMA - PART 1 (TABLES 1-5)

## Goal
Create the first 5 database tables (services, categories, service_categories, staff, staff_services) with proper indexes, foreign keys, and version control.

## Prerequisites
- Task 1: Plugin Boilerplate must be complete
- Plugin must be activated in WordPress

## Estimated Time
8 hours

## Files to Create/Modify
- `includes/class-booking-database.php` (new file - database setup class)
- `includes/class-booking-activator.php` (modify - add database setup call)
- `includes/class-booking-loader.php` (modify - require database class)

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Create database tables for the Booking System plugin - Part 1 (5 tables). Reference the System Architecture Document Part 1, Section 5.2 for complete schema.

**Tables to Create:**
1. `wp_bookings_services` - Service catalog
2. `wp_bookings_categories` - Service categories
3. `wp_bookings_service_categories` - Many-to-many junction table
4. `wp_bookings_staff` - Staff members
5. `wp_bookings_staff_services` - Staff-service junction table

**Create new file: includes/class-booking-database.php**

```php
<?php
/**
 * Database setup and management.
 *
 * @package    Booking_System
 * @subpackage Booking_System/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Database setup and management class.
 */
class Booking_Database {

	/**
	 * Current database version.
	 *
	 * @var string
	 */
	const DB_VERSION = '1.0';

	/**
	 * Create all database tables.
	 *
	 * Uses dbDelta() function for safe table creation/updates.
	 */
	public static function create_tables() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();
		$table_prefix    = $wpdb->prefix;

		// Get current database version
		$installed_version = get_option( 'booking_system_db_version', '0' );

		// Only create tables if not already at current version
		if ( version_compare( $installed_version, self::DB_VERSION, '<' ) ) {
			
			// Load WordPress upgrade functions
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';

			// Create tables
			self::create_services_table( $table_prefix, $charset_collate );
			self::create_categories_table( $table_prefix, $charset_collate );
			self::create_service_categories_table( $table_prefix, $charset_collate );
			self::create_staff_table( $table_prefix, $charset_collate );
			self::create_staff_services_table( $table_prefix, $charset_collate );

			// Update database version
			update_option( 'booking_system_db_version', self::DB_VERSION );
		}
	}

	/**
	 * Create wp_bookings_services table.
	 *
	 * @param string $table_prefix    WordPress table prefix.
	 * @param string $charset_collate Database charset collation.
	 */
	private static function create_services_table( $table_prefix, $charset_collate ) {
		$table_name = $table_prefix . 'bookings_services';

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			description TEXT NULL,
			duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes',
			price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
			deposit_amount DECIMAL(10,2) NULL DEFAULT NULL COMMENT 'Optional deposit amount',
			deposit_type ENUM('fixed','percentage') DEFAULT 'fixed',
			buffer_before INT UNSIGNED DEFAULT 0 COMMENT 'Buffer time before appointment (minutes)',
			buffer_after INT UNSIGNED DEFAULT 0 COMMENT 'Buffer time after appointment (minutes)',
			is_active TINYINT(1) DEFAULT 1,
			display_order INT DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
			PRIMARY KEY (id),
			KEY idx_is_active (is_active),
			KEY idx_deleted_at (deleted_at),
			KEY idx_display_order (display_order)
		) $charset_collate;";

		dbDelta( $sql );
	}

	/**
	 * Create wp_bookings_categories table.
	 *
	 * @param string $table_prefix    WordPress table prefix.
	 * @param string $charset_collate Database charset collation.
	 */
	private static function create_categories_table( $table_prefix, $charset_collate ) {
		$table_name = $table_prefix . 'bookings_categories';

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			description TEXT NULL,
			display_order INT DEFAULT 0,
			is_active TINYINT(1) DEFAULT 1,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			deleted_at DATETIME NULL DEFAULT NULL,
			PRIMARY KEY (id),
			KEY idx_is_active (is_active),
			KEY idx_deleted_at (deleted_at),
			KEY idx_display_order (display_order)
		) $charset_collate;";

		dbDelta( $sql );
	}

	/**
	 * Create wp_bookings_service_categories table (junction table).
	 *
	 * @param string $table_prefix    WordPress table prefix.
	 * @param string $charset_collate Database charset collation.
	 */
	private static function create_service_categories_table( $table_prefix, $charset_collate ) {
		$table_name = $table_prefix . 'bookings_service_categories';

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			service_id BIGINT UNSIGNED NOT NULL,
			category_id BIGINT UNSIGNED NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY unique_service_category (service_id, category_id),
			KEY idx_service_id (service_id),
			KEY idx_category_id (category_id)
		) $charset_collate;";

		dbDelta( $sql );
	}

	/**
	 * Create wp_bookings_staff table.
	 *
	 * @param string $table_prefix    WordPress table prefix.
	 * @param string $charset_collate Database charset collation.
	 */
	private static function create_staff_table( $table_prefix, $charset_collate ) {
		$table_name = $table_prefix . 'bookings_staff';

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			email VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			phone VARCHAR(20) NULL,
			role ENUM('staff','admin') DEFAULT 'staff',
			google_calendar_id VARCHAR(255) NULL COMMENT 'For calendar sync',
			is_active TINYINT(1) DEFAULT 1,
			display_order INT DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			deleted_at DATETIME NULL DEFAULT NULL,
			PRIMARY KEY (id),
			UNIQUE KEY unique_email (email),
			KEY idx_role (role),
			KEY idx_is_active (is_active),
			KEY idx_deleted_at (deleted_at)
		) $charset_collate;";

		dbDelta( $sql );
	}

	/**
	 * Create wp_bookings_staff_services table (junction table).
	 *
	 * @param string $table_prefix    WordPress table prefix.
	 * @param string $charset_collate Database charset collation.
	 */
	private static function create_staff_services_table( $table_prefix, $charset_collate ) {
		$table_name = $table_prefix . 'bookings_staff_services';

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			staff_id BIGINT UNSIGNED NOT NULL,
			service_id BIGINT UNSIGNED NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY unique_staff_service (staff_id, service_id),
			KEY idx_staff_id (staff_id),
			KEY idx_service_id (service_id)
		) $charset_collate;";

		dbDelta( $sql );
	}

	/**
	 * Drop all plugin tables.
	 *
	 * WARNING: This deletes all data. Only call from uninstall.php.
	 */
	public static function drop_tables() {
		global $wpdb;
		$table_prefix = $wpdb->prefix;

		$tables = array(
			$table_prefix . 'bookings_staff_services',
			$table_prefix . 'bookings_service_categories',
			$table_prefix . 'bookings_staff',
			$table_prefix . 'bookings_categories',
			$table_prefix . 'bookings_services',
		);

		foreach ( $tables as $table ) {
			$wpdb->query( "DROP TABLE IF EXISTS $table" );
		}
	}
}
```

**Modify: includes/class-booking-activator.php**

Add database setup call to the `activate()` method, right after the default settings:

```php
// Add this after the default settings code (around line 60)

// Create database tables (Part 1: Tables 1-5)
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-database.php';
Booking_Database::create_tables();
```

**Modify: includes/class-booking-loader.php**

Add database class to dependencies, in the `load_dependencies()` method:

```php
// Add this in load_dependencies() method, before admin/public classes

// Database management
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-database.php';
```

**Important Database Guidelines:**

1. **Use dbDelta() function** - WordPress standard for table creation
2. **Key spacing matters** - dbDelta is picky about formatting:
   - Two spaces between PRIMARY KEY and (id)
   - Two spaces between KEY idx_name and (column)
   - Exact capitalization (PRIMARY KEY, not primary key)
3. **Character set** - Always use `$charset_collate` from `$wpdb->get_charset_collate()`
4. **Table prefix** - Always use `$wpdb->prefix` for table names
5. **Version control** - Only create tables if DB version changed
6. **Indexes** - Add indexes for columns used in WHERE, JOIN, ORDER BY
7. **UNIQUE constraints** - Prevent duplicate data
8. **Soft deletes** - Use `deleted_at` column (NULL = active, datetime = deleted)

**Expected Behavior:**
- Tables created on plugin activation
- Tables NOT recreated if already exist (version check)
- No PHP errors during creation
- All indexes and constraints applied correctly

**Follow WordPress Coding Standards:**
- Use prepared statements for queries (not needed yet, just table creation)
- Docblocks on all methods
- Proper indentation (tabs)
- Constants in UPPERCASE
- Private methods for internal use

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Automated Tests (PHPUnit)
- [ ] Test 1: Database table creation test (will be added in Task 7)
- [ ] Test 2: Table structure verification test (will be added in Task 7)

**Note:** Focus on manual testing for now. Automated tests in Task 7.

### Manual Tests

**Database Table Verification:**

1. [ ] Deactivate and reactivate plugin:
   - Go to wp-admin > Plugins
   - Deactivate "Booking System"
   - Activate "Booking System"
   - Should activate without errors

2. [ ] Open Adminer:
   - Navigate to: `http://localhost:10000/wp-content/adminer.php`
   - OR use phpMyAdmin if available
   - Login with database credentials (found in Local by Flywheel)

3. [ ] Verify tables exist:
   - [ ] Table: `wp_bookings_services` exists
   - [ ] Table: `wp_bookings_categories` exists
   - [ ] Table: `wp_bookings_service_categories` exists
   - [ ] Table: `wp_bookings_staff` exists
   - [ ] Table: `wp_bookings_staff_services` exists

4. [ ] Check `wp_bookings_services` structure:
   - [ ] Column: `id` (BIGINT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
   - [ ] Column: `name` (VARCHAR 255, NOT NULL)
   - [ ] Column: `description` (TEXT, NULL)
   - [ ] Column: `duration` (INT UNSIGNED, NOT NULL)
   - [ ] Column: `price` (DECIMAL 10,2, NOT NULL)
   - [ ] Column: `deposit_amount` (DECIMAL 10,2, NULL)
   - [ ] Column: `deposit_type` (ENUM, fixed/percentage)
   - [ ] Column: `buffer_before` (INT UNSIGNED, DEFAULT 0)
   - [ ] Column: `buffer_after` (INT UNSIGNED, DEFAULT 0)
   - [ ] Column: `is_active` (TINYINT 1, DEFAULT 1)
   - [ ] Column: `display_order` (INT, DEFAULT 0)
   - [ ] Column: `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
   - [ ] Column: `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)
   - [ ] Column: `deleted_at` (DATETIME, NULL)
   - [ ] Index: `PRIMARY` on `id`
   - [ ] Index: `idx_is_active` on `is_active`
   - [ ] Index: `idx_deleted_at` on `deleted_at`
   - [ ] Index: `idx_display_order` on `display_order`

5. [ ] Check `wp_bookings_categories` structure:
   - [ ] Columns: id, name, description, display_order, is_active, created_at, updated_at, deleted_at
   - [ ] PRIMARY KEY on id
   - [ ] Indexes on is_active, deleted_at, display_order

6. [ ] Check `wp_bookings_service_categories` structure:
   - [ ] Columns: id, service_id, category_id, created_at
   - [ ] PRIMARY KEY on id
   - [ ] UNIQUE KEY on (service_id, category_id)
   - [ ] Index on service_id
   - [ ] Index on category_id

7. [ ] Check `wp_bookings_staff` structure:
   - [ ] Columns: id, email, password_hash, first_name, last_name, phone, role, google_calendar_id, is_active, display_order, created_at, updated_at, deleted_at
   - [ ] PRIMARY KEY on id
   - [ ] UNIQUE KEY on email
   - [ ] Indexes on role, is_active, deleted_at

8. [ ] Check `wp_bookings_staff_services` structure:
   - [ ] Columns: id, staff_id, service_id, created_at
   - [ ] PRIMARY KEY on id
   - [ ] UNIQUE KEY on (staff_id, service_id)
   - [ ] Index on staff_id
   - [ ] Index on service_id

**Version Control Check:**

1. [ ] Check database version option:
   - In Adminer, go to `wp_options` table
   - Search for `booking_system_db_version`
   - Should show: `1.0`

2. [ ] Test version control (tables not recreated):
   - Deactivate plugin
   - Reactivate plugin
   - Check tables still exist (not dropped and recreated)
   - Verify data would be preserved (if any existed)

**PHP Error Check:**

1. [ ] Check WordPress debug log:
   - Location: `wp-content/debug.log`
   - Should have NO errors related to database table creation
   - Should have NO SQL syntax errors
   - Should have NO warnings about dbDelta

2. [ ] Check plugin log:
   - Location: `wp-content/uploads/bookings/logs/bookings-YYYY-MM-DD.log`
   - Check for any database-related errors

### Edge Cases

- [ ] Edge case 1: Plugin already activated (tables already exist)
  - Deactivate and reactivate plugin
  - Tables should NOT be dropped and recreated
  - Version check should prevent recreation
- [ ] Edge case 2: Manual table deletion
  - In Adminer, drop one table (e.g., `wp_bookings_services`)
  - Deactivate and reactivate plugin
  - Table should be recreated by dbDelta
- [ ] Edge case 3: Table structure change (future migrations)
  - Code review: Verify version compare logic in `create_tables()`
  - When DB_VERSION incremented, tables should update

### Acceptance Criteria

- [ ] Criterion 1: All 5 tables exist in database with correct names
- [ ] Criterion 2: All columns present with correct data types
- [ ] Criterion 3: All PRIMARY KEYs created correctly
- [ ] Criterion 4: All UNIQUE KEYs created correctly
- [ ] Criterion 5: All indexes (KEY) created correctly
- [ ] Criterion 6: Version control works (tables not recreated on reactivation)
- [ ] Criterion 7: No PHP errors during table creation
- [ ] Criterion 8: Database version option updated to "1.0"

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

git add .
git commit -m "Sprint 0, Task 2: Database schema Part 1 complete

- Created Booking_Database class for table management
- Implemented 5 database tables with dbDelta:
  - wp_bookings_services (service catalog)
  - wp_bookings_categories (service categories)
  - wp_bookings_service_categories (junction table)
  - wp_bookings_staff (staff members)
  - wp_bookings_staff_services (junction table)
- Added version control for database migrations
- Implemented soft delete columns (deleted_at)
- Added appropriate indexes for performance
- Created UNIQUE constraints to prevent duplicates

Tests: Manual database verification passing"
```

---

## COMMON ISSUES

### Issue 1: dbDelta doesn't create tables
**Symptoms:** Tables don't appear in database after activation
**Solution:**
- Check spacing in SQL: dbDelta requires TWO SPACES between KEY and column name
- Check capitalization: Must be `PRIMARY KEY`, not `primary key`
- Enable WP_DEBUG and check debug.log for SQL errors
- Verify `require_once ABSPATH . 'wp-admin/includes/upgrade.php';` is called
- Try dropping tables manually and reactivating plugin

### Issue 2: "Duplicate column name" error
**Symptoms:** WordPress shows database error on activation
**Solution:**
- This happens if tables partially exist from previous attempt
- Drop all plugin tables manually in Adminer
- Deactivate and reactivate plugin
- Or: Implement proper version checking (already in code)

### Issue 3: Foreign key constraints not working
**Symptoms:** Can insert invalid data (e.g., service_id that doesn't exist)
**Solution:**
- WordPress `dbDelta()` does NOT support FOREIGN KEY constraints
- This is a known WordPress limitation
- Solution: Enforce referential integrity in application code (later sprints)
- Document this limitation in architecture

### Issue 4: ENUM type not recognized
**Symptoms:** Column shows as VARCHAR instead of ENUM
**Solution:**
- Some MySQL versions handle ENUM differently
- dbDelta may convert ENUM to VARCHAR
- Verify column type in Adminer
- If needed: Use VARCHAR with validation in application code
- Or: Use CHECK constraints (MySQL 8.0.16+)

### Issue 5: Timestamp columns not auto-updating
**Symptoms:** `updated_at` doesn't change on UPDATE
**Solution:**
- Verify SQL syntax: `ON UPDATE CURRENT_TIMESTAMP`
- Check MySQL version (5.7+ supports this)
- Test with manual UPDATE query:
  ```sql
  UPDATE wp_bookings_services SET name = 'Test' WHERE id = 1;
  ```
- Check if `updated_at` changed

### Issue 6: Character set issues
**Symptoms:** Special characters (£, é, etc.) display incorrectly
**Solution:**
- Verify `$charset_collate` is used in all CREATE TABLE statements
- Check database collation: Should be `utf8mb4_unicode_ci`
- Verify WordPress DB_CHARSET in wp-config.php
- If needed: Convert tables manually:
  ```sql
  ALTER TABLE wp_bookings_services CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

---

## TASK COMPLETION

When Liron reports "Task 2 complete", confirm:
- [ ] All 5 tables exist in database?
- [ ] All columns match schema exactly?
- [ ] All indexes created correctly?
- [ ] Version control working (tables not recreated)?
- [ ] No PHP errors in debug.log?
- [ ] Code committed to Git?

If all ✅, respond: "Task 2 complete ✅. Ready for Task 3: Database Schema Part 2?"

---

# TASK 3: DATABASE SCHEMA - PART 2 (TABLES 6-10)

## Goal
Create the remaining 5 database tables (customers, bookings, payments, working_hours, settings) including the CRITICAL double-booking prevention constraint on the bookings table.

## Prerequisites
- Task 1: Plugin Boilerplate must be complete
- Task 2: Database Schema Part 1 must be complete
- All 5 tables from Part 1 must exist in database

## Estimated Time
8 hours

## Files to Create/Modify
- `includes/class-booking-database.php` (modify - add 5 more tables)

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Add the remaining 5 database tables to the Booking System plugin - Part 2. Reference the System Architecture Document Part 1, Section 5.2 for complete schema.

**Tables to Create:**
6. `wp_bookings_customers` - Customer records
7. `wp_bookings` - Main bookings table (with CRITICAL double-booking prevention)
8. `wp_bookings_payments` - Payment transactions
9. `wp_bookings_working_hours` - Staff availability schedules
10. `wp_bookings_settings` - Plugin configuration (key-value store)

**CRITICAL REQUIREMENT for wp_bookings table:**
Must include this UNIQUE constraint to prevent double-booking at database level:
```sql
UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)
```

This is Gap #1 resolution from the Gap Analysis Report. This constraint prevents two bookings for the same staff member at the same date/time, even under race conditions.

**Modify: includes/class-booking-database.php**

Add these 5 new methods after the existing table creation methods:

```php
/**
 * Create wp_bookings_customers table.
 *
 * @param string $table_prefix    WordPress table prefix.
 * @param string $charset_collate Database charset collation.
 */
private static function create_customers_table( $table_prefix, $charset_collate ) {
	$table_name = $table_prefix . 'bookings_customers';

	$sql = "CREATE TABLE $table_name (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		email VARCHAR(255) NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		phone VARCHAR(20) NOT NULL,
		marketing_consent TINYINT(1) DEFAULT 0 COMMENT 'GDPR marketing consent',
		marketing_consent_date DATETIME NULL COMMENT 'When consent was given',
		notes TEXT NULL COMMENT 'Internal staff notes about customer',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		deleted_at DATETIME NULL DEFAULT NULL,
		PRIMARY KEY (id),
		UNIQUE KEY unique_email (email),
		KEY idx_deleted_at (deleted_at),
		KEY idx_phone (phone)
	) $charset_collate;";

	dbDelta( $sql );
}

/**
 * Create wp_bookings table (MAIN BOOKINGS TABLE).
 *
 * CRITICAL: Includes UNIQUE constraint on (staff_id, booking_date, start_time)
 * to prevent double-booking at database level (Gap #1 resolution).
 *
 * @param string $table_prefix    WordPress table prefix.
 * @param string $charset_collate Database charset collation.
 */
private static function create_bookings_table( $table_prefix, $charset_collate ) {
	$table_name = $table_prefix . 'bookings';

	$sql = "CREATE TABLE $table_name (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		customer_id BIGINT UNSIGNED NOT NULL,
		service_id BIGINT UNSIGNED NOT NULL,
		staff_id BIGINT UNSIGNED NOT NULL,
		booking_date DATE NOT NULL,
		start_time TIME NOT NULL,
		end_time TIME NOT NULL,
		duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes (cached from service)',
		status ENUM('pending','confirmed','cancelled','completed','no_show') DEFAULT 'pending',
		total_price DECIMAL(10,2) NOT NULL,
		deposit_amount DECIMAL(10,2) NULL DEFAULT NULL,
		deposit_paid TINYINT(1) DEFAULT 0,
		full_amount_paid TINYINT(1) DEFAULT 0,
		payment_method VARCHAR(50) NULL COMMENT 'stripe, paypal, cash, card',
		customer_notes TEXT NULL COMMENT 'Notes from customer during booking',
		staff_notes TEXT NULL COMMENT 'Internal staff notes',
		cancellation_reason TEXT NULL,
		cancelled_at DATETIME NULL,
		cancelled_by VARCHAR(50) NULL COMMENT 'customer, staff, system',
		google_calendar_event_id VARCHAR(255) NULL COMMENT 'For calendar sync',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		deleted_at DATETIME NULL DEFAULT NULL,
		PRIMARY KEY (id),
		UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time),
		KEY idx_customer_id (customer_id),
		KEY idx_service_id (service_id),
		KEY idx_staff_id (staff_id),
		KEY idx_booking_date (booking_date),
		KEY idx_status (status),
		KEY idx_deleted_at (deleted_at),
		KEY idx_date_time (booking_date, start_time)
	) $charset_collate;";

	dbDelta( $sql );
}

/**
 * Create wp_bookings_payments table.
 *
 * @param string $table_prefix    WordPress table prefix.
 * @param string $charset_collate Database charset collation.
 */
private static function create_payments_table( $table_prefix, $charset_collate ) {
	$table_name = $table_prefix . 'bookings_payments';

	$sql = "CREATE TABLE $table_name (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		booking_id BIGINT UNSIGNED NOT NULL,
		customer_id BIGINT UNSIGNED NOT NULL,
		amount DECIMAL(10,2) NOT NULL,
		payment_type ENUM('deposit','full_payment','refund') DEFAULT 'full_payment',
		payment_method VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, cash, card',
		payment_status ENUM('pending','completed','failed','refunded','partially_refunded') DEFAULT 'pending',
		stripe_payment_intent_id VARCHAR(255) NULL COMMENT 'Stripe PaymentIntent ID',
		stripe_charge_id VARCHAR(255) NULL COMMENT 'Stripe Charge ID',
		paypal_order_id VARCHAR(255) NULL COMMENT 'PayPal Order ID',
		paypal_capture_id VARCHAR(255) NULL COMMENT 'PayPal Capture ID',
		refund_amount DECIMAL(10,2) NULL DEFAULT NULL,
		refund_reason TEXT NULL,
		refunded_at DATETIME NULL,
		transaction_date DATETIME NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_booking_id (booking_id),
		KEY idx_customer_id (customer_id),
		KEY idx_payment_status (payment_status),
		KEY idx_transaction_date (transaction_date),
		KEY idx_stripe_payment_intent (stripe_payment_intent_id),
		KEY idx_paypal_order (paypal_order_id)
	) $charset_collate;";

	dbDelta( $sql );
}

/**
 * Create wp_bookings_working_hours table.
 *
 * @param string $table_prefix    WordPress table prefix.
 * @param string $charset_collate Database charset collation.
 */
private static function create_working_hours_table( $table_prefix, $charset_collate ) {
	$table_name = $table_prefix . 'bookings_working_hours';

	$sql = "CREATE TABLE $table_name (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		staff_id BIGINT UNSIGNED NOT NULL,
		day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 6=Saturday',
		start_time TIME NOT NULL,
		end_time TIME NOT NULL,
		is_active TINYINT(1) DEFAULT 1,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_staff_id (staff_id),
		KEY idx_day_of_week (day_of_week),
		KEY idx_is_active (is_active)
	) $charset_collate;";

	dbDelta( $sql );
}

/**
 * Create wp_bookings_settings table (key-value store).
 *
 * @param string $table_prefix    WordPress table prefix.
 * @param string $charset_collate Database charset collation.
 */
private static function create_settings_table( $table_prefix, $charset_collate ) {
	$table_name = $table_prefix . 'bookings_settings';

	$sql = "CREATE TABLE $table_name (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		setting_key VARCHAR(100) NOT NULL,
		setting_value LONGTEXT NULL,
		autoload TINYINT(1) DEFAULT 1 COMMENT 'Load on plugin init like wp_options',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		UNIQUE KEY unique_setting_key (setting_key),
		KEY idx_autoload (autoload)
	) $charset_collate;";

	dbDelta( $sql );
}
```

**Update the `create_tables()` method** to call these new methods:

```php
// In the create_tables() method, after the existing table creation calls, add:

// Part 2: Tables 6-10
self::create_customers_table( $table_prefix, $charset_collate );
self::create_bookings_table( $table_prefix, $charset_collate );
self::create_payments_table( $table_prefix, $charset_collate );
self::create_working_hours_table( $table_prefix, $charset_collate );
self::create_settings_table( $table_prefix, $charset_collate );
```

**Update the `drop_tables()` method** to include all 10 tables (add new tables at beginning of array, before existing ones):

```php
$tables = array(
	// Part 2 tables (drop first due to dependencies)
	$table_prefix . 'bookings_payments',
	$table_prefix . 'bookings',
	$table_prefix . 'bookings_working_hours',
	$table_prefix . 'bookings_customers',
	$table_prefix . 'bookings_settings',
	// Part 1 tables (existing)
	$table_prefix . 'bookings_staff_services',
	$table_prefix . 'bookings_service_categories',
	$table_prefix . 'bookings_staff',
	$table_prefix . 'bookings_categories',
	$table_prefix . 'bookings_services',
);
```

**Important Notes:**

1. **UNIQUE constraint on bookings table is CRITICAL:**
   ```sql
   UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)
   ```
   This prevents the double-booking race condition identified in Gap Analysis.

2. **ENUM values:**
   - Booking status: 'pending','confirmed','cancelled','completed','no_show'
   - Payment type: 'deposit','full_payment','refund'
   - Payment status: 'pending','completed','failed','refunded','partially_refunded'

3. **Soft deletes:**
   - All tables except settings use `deleted_at` column
   - NULL = active record, datetime = soft deleted

4. **Indexes for performance:**
   - Foreign key columns (customer_id, service_id, staff_id, booking_id)
   - Date/time columns (booking_date, start_time, transaction_date)
   - Status columns (status, payment_status, is_active)
   - External IDs (stripe_payment_intent_id, paypal_order_id, google_calendar_event_id)

5. **Comments for documentation:**
   - GDPR fields documented
   - External integration fields documented
   - Enum values clarified

**Expected Behavior:**
- All 10 tables created on plugin activation
- UNIQUE constraint prevents duplicate bookings at database level
- No PHP errors during creation
- Version control still works (tables not recreated)

**Follow WordPress Coding Standards:**
- Docblocks on all methods
- Proper indentation (tabs)
- Comments explain complex logic

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Automated Tests (PHPUnit)
- [ ] Test 1: All 10 tables exist (will be added in Task 7)
- [ ] Test 2: UNIQUE constraint test (will be added in Task 7)

### Manual Tests

**Database Table Verification:**

1. [ ] Deactivate and reactivate plugin:
   - Go to wp-admin > Plugins
   - Deactivate "Booking System"
   - Activate "Booking System"
   - Should activate without errors

2. [ ] Open Adminer:
   - Navigate to: `http://localhost:10000/wp-content/adminer.php`
   - Login with database credentials

3. [ ] Verify all 10 tables exist:
   - [ ] Table: `wp_bookings_services` (from Part 1)
   - [ ] Table: `wp_bookings_categories` (from Part 1)
   - [ ] Table: `wp_bookings_service_categories` (from Part 1)
   - [ ] Table: `wp_bookings_staff` (from Part 1)
   - [ ] Table: `wp_bookings_staff_services` (from Part 1)
   - [ ] Table: `wp_bookings_customers` (new)
   - [ ] Table: `wp_bookings` (new - MAIN TABLE)
   - [ ] Table: `wp_bookings_payments` (new)
   - [ ] Table: `wp_bookings_working_hours` (new)
   - [ ] Table: `wp_bookings_settings` (new)

4. [ ] Check `wp_bookings_customers` structure:
   - [ ] Columns: id, email, first_name, last_name, phone, marketing_consent, marketing_consent_date, notes, created_at, updated_at, deleted_at
   - [ ] PRIMARY KEY on id
   - [ ] UNIQUE KEY on email
   - [ ] Index on deleted_at
   - [ ] Index on phone

5. [ ] Check `wp_bookings` structure (CRITICAL TABLE):
   - [ ] Columns: id, customer_id, service_id, staff_id, booking_date, start_time, end_time, duration, status, total_price, deposit_amount, deposit_paid, full_amount_paid, payment_method, customer_notes, staff_notes, cancellation_reason, cancelled_at, cancelled_by, google_calendar_event_id, created_at, updated_at, deleted_at
   - [ ] PRIMARY KEY on id
   - [ ] **UNIQUE KEY on (staff_id, booking_date, start_time)** ← CRITICAL
   - [ ] Index on customer_id
   - [ ] Index on service_id
   - [ ] Index on staff_id
   - [ ] Index on booking_date
   - [ ] Index on status
   - [ ] Index on deleted_at
   - [ ] Composite index on (booking_date, start_time)

6. [ ] Check `wp_bookings_payments` structure:
   - [ ] Columns: id, booking_id, customer_id, amount, payment_type, payment_method, payment_status, stripe_payment_intent_id, stripe_charge_id, paypal_order_id, paypal_capture_id, refund_amount, refund_reason, refunded_at, transaction_date, created_at, updated_at
   - [ ] PRIMARY KEY on id
   - [ ] Index on booking_id
   - [ ] Index on customer_id
   - [ ] Index on payment_status
   - [ ] Index on transaction_date
   - [ ] Index on stripe_payment_intent_id
   - [ ] Index on paypal_order_id

7. [ ] Check `wp_bookings_working_hours` structure:
   - [ ] Columns: id, staff_id, day_of_week, start_time, end_time, is_active, created_at, updated_at
   - [ ] PRIMARY KEY on id
   - [ ] Index on staff_id
   - [ ] Index on day_of_week
   - [ ] Index on is_active

8. [ ] Check `wp_bookings_settings` structure:
   - [ ] Columns: id, setting_key, setting_value, autoload, created_at, updated_at
   - [ ] PRIMARY KEY on id
   - [ ] UNIQUE KEY on setting_key
   - [ ] Index on autoload

**CRITICAL: Double-Booking Prevention Test:**

This is the most important test - it verifies Gap #1 resolution.

1. [ ] Manually insert test data using Adminer:

   **Insert test customer:**
   ```sql
   INSERT INTO wp_bookings_customers (email, first_name, last_name, phone) 
   VALUES ('test@example.com', 'Test', 'Customer', '01234567890');
   ```

   **Insert test service:**
   ```sql
   INSERT INTO wp_bookings_services (name, duration, price) 
   VALUES ('Test Service', 60, 50.00);
   ```

   **Insert test staff:**
   ```sql
   INSERT INTO wp_bookings_staff (email, password_hash, first_name, last_name, role) 
   VALUES ('staff@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'Test', 'Staff', 'staff');
   ```

2. [ ] Insert first booking:
   ```sql
   INSERT INTO wp_bookings (customer_id, service_id, staff_id, booking_date, start_time, end_time, duration, status, total_price) 
   VALUES (1, 1, 1, '2026-02-01', '10:00:00', '11:00:00', 60, 'confirmed', 50.00);
   ```
   Expected: Insert successful

3. [ ] Try to insert duplicate booking (SHOULD FAIL):
   ```sql
   INSERT INTO wp_bookings (customer_id, service_id, staff_id, booking_date, start_time, end_time, duration, status, total_price) 
   VALUES (1, 1, 1, '2026-02-01', '10:00:00', '11:00:00', 60, 'confirmed', 50.00);
   ```
   Expected: **Error: Duplicate entry for key 'unique_booking_slot'**
   This proves double-booking is prevented at database level ✅

4. [ ] Try to insert booking at different time (SHOULD SUCCEED):
   ```sql
   INSERT INTO wp_bookings (customer_id, service_id, staff_id, booking_date, start_time, end_time, duration, status, total_price) 
   VALUES (1, 1, 1, '2026-02-01', '11:00:00', '12:00:00', 60, 'confirmed', 50.00);
   ```
   Expected: Insert successful (different start_time)

5. [ ] Try to insert booking for different staff at same time (SHOULD SUCCEED):
   ```sql
   -- First insert another staff member
   INSERT INTO wp_bookings_staff (email, password_hash, first_name, last_name, role) 
   VALUES ('staff2@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'Another', 'Staff', 'staff');
   
   -- Then insert booking
   INSERT INTO wp_bookings (customer_id, service_id, staff_id, booking_date, start_time, end_time, duration, status, total_price) 
   VALUES (1, 1, 2, '2026-02-01', '10:00:00', '11:00:00', 60, 'confirmed', 50.00);
   ```
   Expected: Insert successful (different staff_id)

6. [ ] Clean up test data:
   ```sql
   DELETE FROM wp_bookings;
   DELETE FROM wp_bookings_staff;
   DELETE FROM wp_bookings_services;
   DELETE FROM wp_bookings_customers;
   ```

**Version Control Check:**

1. [ ] Check database version still "1.0"
2. [ ] Deactivate and reactivate plugin
3. [ ] Verify all 10 tables still exist (not dropped)

**PHP Error Check:**

1. [ ] Check WordPress debug log: `wp-content/debug.log`
   - Should have NO errors
2. [ ] Check plugin log: `wp-content/uploads/bookings/logs/bookings-YYYY-MM-DD.log`
   - Should have NO database errors

### Edge Cases

- [ ] Edge case 1: Overlapping bookings (NOT prevented by UNIQUE constraint)
  - Booking 1: 10:00-11:00
  - Booking 2: 10:30-11:30 (overlaps, but starts at different time)
  - Expected: Booking 2 succeeds (different start_time)
  - Note: Overlap prevention must be handled in application code (Sprint 2)
- [ ] Edge case 2: Cancelled bookings still occupy slots
  - Insert booking with status='cancelled'
  - Try to insert another booking at same time
  - Expected: Fails due to UNIQUE constraint
  - Note: Cancelled bookings should be excluded from availability checks in application code
- [ ] Edge case 3: Soft deleted bookings
  - Insert booking with deleted_at = NOW()
  - Try to insert another booking at same time
  - Expected: Fails due to UNIQUE constraint
  - Note: Soft deleted bookings should be excluded from availability checks

### Acceptance Criteria

- [ ] Criterion 1: All 10 tables exist in database
- [ ] Criterion 2: All columns match schema exactly
- [ ] Criterion 3: **UNIQUE constraint on (staff_id, booking_date, start_time) prevents duplicate bookings**
- [ ] Criterion 4: All indexes created correctly
- [ ] Criterion 5: ENUM columns have correct values
- [ ] Criterion 6: Soft delete columns (deleted_at) present where specified
- [ ] Criterion 7: No PHP errors during table creation
- [ ] Criterion 8: Manual double-booking test fails as expected (proves constraint works)

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

git add .
git commit -m "Sprint 0, Task 3: Database schema Part 2 complete

- Created 5 additional database tables:
  - wp_bookings_customers (customer records)
  - wp_bookings (main bookings table)
  - wp_bookings_payments (payment transactions)
  - wp_bookings_working_hours (staff schedules)
  - wp_bookings_settings (key-value configuration)
- Implemented CRITICAL double-booking prevention:
  - UNIQUE constraint on (staff_id, booking_date, start_time)
  - Resolves Gap #1 from Gap Analysis Report
  - Prevents race conditions at database level
- Added comprehensive indexes for performance
- Implemented soft delete pattern on booking-related tables
- Added ENUM columns for status management
- Total: 10/10 database tables complete

Tests: Manual verification passing, double-booking prevention confirmed"
```

---

## COMMON ISSUES

### Issue 1: UNIQUE constraint not created
**Symptoms:** Can insert duplicate bookings (manual test succeeds when it should fail)
**Solution:**
- Check SQL syntax: `UNIQUE KEY unique_booking_slot (staff_id, booking_date, start_time)`
- Verify spacing (dbDelta is picky)
- Drop table and recreate:
  ```sql
  DROP TABLE wp_bookings;
  ```
  Then deactivate/reactivate plugin
- Verify in Adminer: Go to table structure, check "Indexes" section

### Issue 2: ENUM columns show as VARCHAR
**Symptoms:** Column type is VARCHAR instead of ENUM in Adminer
**Solution:**
- This is normal with dbDelta - it may convert ENUM to VARCHAR
- As long as values are correct, functionality works
- Application code should validate enum values
- Alternative: Use VARCHAR with CHECK constraints (MySQL 8.0.16+)

### Issue 3: Foreign key relationships not enforced
**Symptoms:** Can insert booking with non-existent customer_id
**Solution:**
- WordPress dbDelta does NOT support FOREIGN KEY constraints
- This is expected and documented
- Solution: Application code must validate references (Sprint 2-3)
- Add checks before INSERT/UPDATE queries

### Issue 4: "Table already exists" error
**Symptoms:** WordPress error on activation, tables from Part 1 conflict
**Solution:**
- The version control should prevent this
- If occurs: Check `booking_system_db_version` option
- Verify version_compare logic in `create_tables()` method
- If needed: Change DB_VERSION to "1.1" to force update

### Issue 5: Overlapping bookings still possible
**Symptoms:** Can book 10:00-11:00 and 10:30-11:30 for same staff
**Solution:**
- This is EXPECTED behavior
- UNIQUE constraint only prevents exact same start_time
- Overlap detection must be done in application code (Sprint 2)
- Query to check overlaps:
  ```sql
  SELECT * FROM wp_bookings 
  WHERE staff_id = ? 
  AND booking_date = ? 
  AND deleted_at IS NULL
  AND (
    (start_time < ? AND end_time > ?) OR
    (start_time >= ? AND start_time < ?)
  );
  ```

### Issue 6: Time zone handling
**Symptoms:** Times stored in wrong timezone
**Solution:**
- All times stored as local business times (Europe/London)
- WordPress timezone set in Settings > General
- PHP date_default_timezone_set() handled in plugin init
- No timezone conversion at database level

---

## TASK COMPLETION

When Liron reports "Task 3 complete", confirm:
- [ ] All 10 tables exist in database?
- [ ] UNIQUE constraint on bookings table verified?
- [ ] Manual double-booking test failed as expected (proves constraint works)?
- [ ] All columns and indexes match schema?
- [ ] No PHP errors?
- [ ] Code committed to Git?

If all ✅, respond: "Task 3 complete ✅. Database schema complete (10/10 tables). Ready for Task 4: Authentication Framework?"

---

**Progress Check:**
- ✅ Task 1: Plugin Boilerplate (8h)
- ✅ Task 2: Database Schema Part 1 (8h)
- ✅ Task 3: Database Schema Part 2 (8h)
- **Total so far: 24/52 hours (46% of Sprint 0)**

Excellent progress! Moving on to authentication next... 

Would you like me to continue with Tasks 4-8, or shall we pause here and wait for you to complete Tasks 1-3 first?