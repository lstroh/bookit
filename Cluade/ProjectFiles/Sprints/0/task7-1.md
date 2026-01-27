Excellent idea! Using `wp-env` is a much better approach for testing. It creates an isolated Docker-based WordPress environment specifically for testing. Let me create a proper setup for you.

---

## TASK 7 (REVISED): UNIT TEST SETUP WITH WP-ENV

### IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Set up PHPUnit testing with `wp-env` for isolated WordPress test environment. This creates a Docker-based WordPress installation specifically for testing, separate from your Local by Flywheel site.

**Benefits of wp-env:**
- Isolated test environment (doesn't affect your main site)
- Consistent across all developers
- Easy to reset/rebuild
- Includes WordPress test library automatically
- Standard WordPress plugin development workflow

**Requirements:**
- `wp-env` already installed globally
- Docker Desktop running
- Node.js/npm installed

**Setup:**
1. Configure `.wp-env.json` for plugin testing
2. Update bootstrap to work with wp-env
3. Add npm scripts for easy test running
4. Create proper PHPUnit configuration

---

### File 1: Create .wp-env.json

**Create in plugin root:**

```json
{
  "core": "WordPress/WordPress#6.4",
  "phpVersion": "8.0",
  "plugins": [ "." ],
  "env": {
    "tests": {
      "port": 8889
    }
  },
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  }
}
```

---

### File 2: Create package.json

**Create in plugin root:**

```json
{
  "name": "booking-system",
  "version": "1.0.0",
  "description": "WordPress Booking System Plugin",
  "scripts": {
    "wp-env": "wp-env",
    "wp-env:start": "wp-env start",
    "wp-env:stop": "wp-env stop",
    "wp-env:restart": "wp-env stop && wp-env start",
    "wp-env:destroy": "wp-env destroy",
    "test": "wp-env run tests-wordpress \"cd /var/www/html/wp-content/plugins/booking-system && vendor/bin/phpunit\"",
    "test:watch": "npm run test -- --watch",
    "test:verbose": "wp-env run tests-wordpress \"cd /var/www/html/wp-content/plugins/booking-system && vendor/bin/phpunit --verbose\"",
    "test:coverage": "wp-env run tests-wordpress \"cd /var/www/html/wp-content/plugins/booking-system && vendor/bin/phpunit --coverage-html coverage\""
  },
  "keywords": ["wordpress", "plugin", "booking"],
  "author": "Liron",
  "license": "GPL-2.0-or-later"
}
```

---

### File 3: Update tests/bootstrap.php

**Replace entire file:**

```php
<?php
/**
 * PHPUnit bootstrap file for wp-env.
 *
 * @package Booking_System
 */

// Composer autoloader
$autoload = dirname( __DIR__ ) . '/vendor/autoload.php';
if ( file_exists( $autoload ) ) {
	require_once $autoload;
} else {
	echo "Error: Run 'composer install' first\n";
	exit( 1 );
}

// WordPress test library directory
$_tests_dir = getenv( 'WP_TESTS_DIR' );

// If not set, use wp-env default location
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

// Fallback for wp-env (WordPress installed in container)
if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	// Try wp-env location
	$_tests_dir = '/wordpress-phpunit';
}

// Final fallback - load WordPress directly
if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	// Load WordPress from wp-env installation
	$wp_core_dir = getenv( 'WP_CORE_DIR' );
	if ( ! $wp_core_dir ) {
		$wp_core_dir = '/var/www/html';
	}
	
	if ( file_exists( $wp_core_dir . '/wp-load.php' ) ) {
		define( 'WP_USE_THEMES', false );
		require_once $wp_core_dir . '/wp-load.php';
		
		// Manually load the plugin
		require_once dirname( __DIR__ ) . '/booking-system.php';
		
		// Activate plugin programmatically
		if ( ! function_exists( 'activate_booking_system' ) ) {
			die( "Error: Plugin not loaded correctly\n" );
		}
		
		// Ensure tables exist
		global $wpdb;
		$table_name = $wpdb->prefix . 'bookings_services';
		$table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$table_name'" );
		
		if ( $table_exists !== $table_name ) {
			activate_booking_system();
		}
		
		// Stop here - WordPress loaded directly
		return;
	}
	
	die( "Error: WordPress test library not found. Make sure wp-env is running.\n" );
}

// Give access to tests_add_filter() function
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	require dirname( __DIR__ ) . '/booking-system.php';
}

// Load plugin before running tests
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment
require $_tests_dir . '/includes/bootstrap.php';

// Ensure plugin is activated
activate_plugin( 'booking-system/booking-system.php' );
```

---

### File 4: Update phpunit.xml

**Replace entire file:**

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
    verbose="true"
    beStrictAboutOutputDuringTests="false"
>
    <testsuites>
        <testsuite name="Booking System Test Suite">
            <directory>./tests/</directory>
            <exclude>./tests/bootstrap.php</exclude>
        </testsuite>
    </testsuites>
    
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./includes/</directory>
            <directory suffix=".php">./admin/</directory>
            <directory suffix=".php">./public/</directory>
        </include>
        <exclude>
            <directory>./vendor/</directory>
            <directory>./tests/</directory>
        </exclude>
    </coverage>
    
    <php>
        <env name="WP_TESTS_DIR" value="/tmp/wordpress-tests-lib" />
        <env name="WP_CORE_DIR" value="/var/www/html" />
    </php>
</phpunit>
```

---

### File 5: Update composer.json

**Replace scripts section:**

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
        "yoast/phpunit-polyfills": "^2.0"
    },
    "autoload": {
        "psr-4": {
            "BookingSystem\\": "includes/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "test:unit": "phpunit --testsuite 'Booking System Test Suite'",
        "test:coverage": "phpunit --coverage-html coverage",
        "test:verbose": "phpunit --verbose"
    },
    "config": {
        "allow-plugins": {
            "dealerdirect/phpcodesniffer-composer-installer": true
        }
    }
}
```

---

### File 6: Update .gitignore

**Add these lines:**

```gitignore
# wp-env
.wp-env.override.json

# Node
node_modules/
package-lock.json

# PHPUnit
/vendor/
/coverage/
.phpunit.result.cache

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

---

### File 7: Create README-TESTING.md

**Create documentation for running tests:**

```markdown
# Testing Guide

## Prerequisites

1. **Docker Desktop** - Must be running
2. **wp-env** - Install globally if not already:
   ```bash
   npm install -g @wordpress/env
   ```
3. **Composer** - For installing PHPUnit

## Setup

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install npm dependencies (for wp-env scripts)
npm install
```

### 2. Start wp-env

```bash
npm run wp-env:start
```

This will:
- Download WordPress
- Create Docker containers
- Install the plugin
- Set up test database

**Access:**
- WordPress site: http://localhost:8888
- Admin: http://localhost:8888/wp-admin (admin/password)
- Test instance: http://localhost:8889

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npm run test:verbose

# Run tests with code coverage
npm run test:coverage
```

## Common Commands

```bash
# Start wp-env
npm run wp-env:start

# Stop wp-env
npm run wp-env:stop

# Restart wp-env (useful after code changes)
npm run wp-env:restart

# Destroy and rebuild (fresh start)
npm run wp-env:destroy
npm run wp-env:start

# Run tests inside wp-env container
npm test

# Access WordPress container shell
wp-env run tests-wordpress bash

# Access database
wp-env run tests-cli wp db cli
```

## Troubleshooting

### Tests fail with "WordPress not found"

Make sure wp-env is running:
```bash
npm run wp-env:start
```

### Docker issues

Restart Docker Desktop and try again:
```bash
npm run wp-env:restart
```

### Database issues

Reset the test database:
```bash
npm run wp-env:destroy
npm run wp-env:start
```

### Port conflicts

If port 8888 or 8889 is already in use, edit `.wp-env.json` and change the ports.

## Test Organization

```
tests/
├── bootstrap.php              # Test setup
├── test-plugin-activation.php # Activation tests
├── test-database.php          # Database tests
├── test-logger.php            # Logger tests
└── test-auth.php              # Authentication tests
```

## Writing New Tests

1. Create file: `tests/test-feature.php`
2. Extend `PHPUnit\Framework\TestCase`
3. Name methods: `test_feature_description()`
4. Run tests: `npm test`

Example:

```php
<?php
use PHPUnit\Framework\TestCase;

class Test_My_Feature extends TestCase {
    public function test_something() {
        $this->assertTrue(true);
    }
}
```

## Continuous Integration

These tests can run in GitHub Actions or other CI environments using wp-env.

See `.github/workflows/test.yml` (to be created in later sprint).
```

---

**Installation Steps:**

After creating all files, follow these steps:

### Step 1: Install Composer Dependencies

```bash
cd C:\GitHub\bookit-imp\booking-system
composer install
```

### Step 2: Install npm Dependencies

```bash
npm install
```

### Step 3: Start wp-env

Make sure Docker Desktop is running, then:

```bash
npm run wp-env:start
```

**First run takes 5-10 minutes** (downloads WordPress, sets up containers).

You'll see output like:
```
✔ Downloading WordPress (if necessary)
✔ Creating WordPress and MySQL containers
✔ Installing WordPress
✔ Starting WordPress
✔ WordPress started
```

### Step 4: Run Tests

```bash
npm test
```

**Expected output:**

```
> booking-system@1.0.0 test
> wp-env run tests-wordpress "cd /var/www/html/wp-content/plugins/booking-system && vendor/bin/phpunit"

PHPUnit 9.x.x by Sebastian Bergmann

.................                  17 / 17 (100%)

Time: 00:02.456, Memory: 12.00 MB

OK (17 tests, 35 assertions)
```

### Step 5: Verify Setup

**Check WordPress is running:**

Open browser: http://localhost:8888

**Check test instance:**

Open browser: http://localhost:8889

**Access admin:**
- URL: http://localhost:8888/wp-admin
- Username: `admin`
- Password: `password`

**Expected Behavior:**

1. **wp-env creates isolated environment** - Doesn't touch your Local by Flywheel site
2. **Tests run in Docker container** - Consistent across all machines
3. **Database resets between test runs** - Clean state every time
4. **Fast test execution** - ~2-3 seconds for full suite
5. **Easy to rebuild** - `npm run wp-env:destroy` starts fresh

**Follow WordPress Coding Standards:**
- Use WordPress test library functions
- Tests run in actual WordPress environment
- Database queries work exactly like production

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Setup Verification

**Prerequisites:**

1. [ ] Docker Desktop installed and running
2. [ ] wp-env installed globally (`wp-env --version`)
3. [ ] Node.js/npm installed (`node --version`, `npm --version`)

**Installation:**

1. [ ] Run `composer install` - installs PHPUnit
2. [ ] Run `npm install` - installs wp-env scripts
3. [ ] Run `npm run wp-env:start` - starts Docker containers
4. [ ] Wait for "WordPress started" message (5-10 min first time)

**Verification:**

1. [ ] Visit http://localhost:8888 - WordPress site loads
2. [ ] Visit http://localhost:8888/wp-admin - Login works (admin/password)
3. [ ] Check Plugins page - "Booking System" appears and is active
4. [ ] Check database - all 10 tables exist

### Running Tests

**Basic Test Run:**

```bash
npm test
```

1. [ ] All tests execute
2. [ ] No fatal errors
3. [ ] Test summary shows at end
4. [ ] Exit code 0 (success)

**Verbose Test Run:**

```bash
npm run test:verbose
```

1. [ ] Shows each test name as it runs
2. [ ] Shows detailed output
3. [ ] Easier to see which test fails (if any)

**Coverage Report:**

```bash
npm run test:coverage
```

1. [ ] Generates `coverage/` directory
2. [ ] Open `coverage/index.html` in browser
3. [ ] Shows code coverage percentage
4. [ ] Highlights untested code

### Individual Test Verification

**Same as before - all tests should pass:**

- [ ] Plugin Activation Tests (6 tests) ✅
- [ ] Database Tests (5 tests) ✅
- [ ] Logger Tests (6 tests) ✅
- [ ] Auth Tests (5 tests) ✅

**Total: 17+ tests passing**

### wp-env Commands Test

**Test environment control:**

1. [ ] `npm run wp-env:stop` - Stops containers
2. [ ] `npm run wp-env:start` - Starts containers
3. [ ] `npm run wp-env:restart` - Restarts (quick)
4. [ ] `npm run wp-env:destroy` - Deletes everything (clean slate)

**After destroy, start again:**
```bash
npm run wp-env:start
npm test
```

All tests should still pass (fresh environment).

### Acceptance Criteria

- [ ] Criterion 1: wp-env starts successfully
- [ ] Criterion 2: WordPress accessible at localhost:8888
- [ ] Criterion 3: Plugin automatically activated in wp-env
- [ ] Criterion 4: All 17 tests pass with `npm test`
- [ ] Criterion 5: Tests run in under 5 seconds
- [ ] Criterion 6: Can destroy and rebuild environment
- [ ] Criterion 7: Tests isolated from main Local by Flywheel site
- [ ] Criterion 8: Coverage report generates successfully
- [ ] Criterion 9: All wp-env commands work
- [ ] Criterion 10: README-TESTING.md documents workflow

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
git add .
git commit -m "Sprint 0, Task 7: Unit test setup with wp-env complete

- Set up wp-env for isolated test environment:
  - Docker-based WordPress installation
  - Separate from Local by Flywheel site
  - Automated setup and teardown
- Configured PHPUnit with WordPress test library:
  - Bootstrap works with wp-env container paths
  - Proper test database isolation
  - Yoast polyfills for compatibility
- Created comprehensive test suite (17 tests):
  - Plugin activation tests (6 tests)
  - Database tests (5 tests) - all tables and constraints
  - Logger tests (6 tests) - security redaction verified
  - Authentication tests (5 tests) - password hashing verified
- Added npm scripts for easy testing:
  - npm test (run all tests)
  - npm run test:verbose (detailed output)
  - npm run test:coverage (code coverage report)
  - npm run wp-env:start/stop/restart/destroy
- Created comprehensive testing documentation

Tests: ✅ All 17 tests passing in wp-env

Environment: wp-env (Docker) - isolated and reproducible"
```

---

## COMMON ISSUES

### Issue 1: "Docker daemon not running"
**Symptoms:** wp-env fails to start
**Solution:**
- Open Docker Desktop
- Wait for Docker to fully start (whale icon in taskbar)
- Try `npm run wp-env:start` again

### Issue 2: Port already in use
**Symptoms:** "Port 8888 is already allocated"
**Solution:**
- Edit `.wp-env.json`
- Change port numbers:
  ```json
  "port": 8890,
  "env": {
    "tests": {
      "port": 8891
    }
  }
  ```

### Issue 3: wp-env command not found
**Symptoms:** `wp-env: command not found`
**Solution:**
```bash
npm install -g @wordpress/env
```

### Issue 4: Tests fail inside container
**Symptoms:** PHPUnit works locally but fails in wp-env
**Solution:**
- Check bootstrap.php paths are correct
- Verify composer install ran inside container
- Try: `wp-env run tests-wordpress "cd /var/www/html/wp-content/plugins/booking-system && composer install"`

### Issue 5: Slow first start
**Symptoms:** wp-env:start takes 10+ minutes
**Solution:**
- This is normal for first run (downloads WordPress, images)
- Subsequent starts take ~30 seconds
- Be patient on first run

### Issue 6: Tests pass but plugin not visible
**Symptoms:** Plugin not in wp-admin plugins list
**Solution:**
- Check `.wp-env.json` has `"plugins": [ "." ]`
- Restart wp-env: `npm run wp-env:restart`
- Check from container: `wp-env run tests-cli wp plugin list`

---

## TASK COMPLETION

When Liron reports "Task 7 complete with wp-env", confirm:
- [ ] Docker Desktop running?
- [ ] wp-env starts successfully?
- [ ] WordPress accessible at localhost:8888?
- [ ] `npm test` runs all tests?
- [ ] All 17+ tests passing?
- [ ] Can stop/start/destroy wp-env?
- [ ] Tests isolated from Local by Flywheel site?
- [ ] Code committed to Git?

If all ✅, respond: "Task 7 complete ✅ using wp-env. Professional testing infrastructure operational. Ready for Task 8: Sprint Integration Testing (Final Task)?"

---

This is **much better** than the manual WordPress test library setup! wp-env is the standard WordPress way and will make your life easier. 🚀

Let me know if you hit any issues during setup!