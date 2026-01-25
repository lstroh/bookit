Excellent! Let's continue with Task 6:

---

# TASK 6: ERROR LOGGING SYSTEM

## Goal
Create a robust error logging system for the plugin that writes to dedicated log files, includes log rotation, and filters sensitive data to ensure security.

## Prerequisites
- Task 1: Plugin Boilerplate must be complete
- Log directory created during activation

## Estimated Time
4 hours

## Files to Create/Modify
- `includes/class-booking-logger.php` (new - logging class)
- `includes/class-booking-activator.php` (modify - add log cleanup cron)
- `includes/class-booking-deactivator.php` (modify - remove log cleanup cron)
- `includes/class-booking-loader.php` (modify - load logger class)

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Create a comprehensive error logging system for the Booking System plugin. Reference: System Architecture Document Part 2, Section 16 for logging requirements.

**Logging Requirements:**

1. **Log Levels:** INFO, WARNING, ERROR
2. **Log Location:** `wp-content/uploads/bookings/logs/`
3. **Log File Naming:** `bookings-YYYY-MM-DD.log` (daily rotation)
4. **Log Retention:** Keep 28 days (4 weeks), auto-delete older
5. **Sensitive Data:** NEVER log passwords, API keys, card numbers, customer PII
6. **Format:** `[YYYY-MM-DD HH:MM:SS] [LEVEL] Message`
7. **Performance:** Non-blocking, minimal overhead

**What to Log:**
- ✅ Booking creation/modification/cancellation
- ✅ Payment events (success, failure, refund)
- ✅ Authentication events (login, logout, failed attempts)
- ✅ Email sending (success/failure)
- ✅ API calls (Stripe, PayPal, Google Calendar)
- ✅ Database errors
- ✅ Plugin activation/deactivation
- ❌ Passwords or password hashes
- ❌ Full credit card numbers
- ❌ API keys or secrets
- ❌ Customer personal information (except IDs/emails in context)

---

### File 1: includes/class-booking-logger.php

```php
<?php
/**
 * Error logging system.
 *
 * @package    Booking_System
 * @subpackage Booking_System/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Logger class.
 */
class Booking_Logger {

	/**
	 * Log directory path.
	 *
	 * @var string
	 */
	private static $log_dir = '';

	/**
	 * Initialize logger.
	 */
	public static function init() {
		$upload_dir    = wp_upload_dir();
		self::$log_dir = $upload_dir['basedir'] . '/bookings/logs';

		// Ensure log directory exists
		if ( ! file_exists( self::$log_dir ) ) {
			wp_mkdir_p( self::$log_dir );

			// Add .htaccess to protect logs
			$htaccess_content = "Deny from all\n";
			file_put_contents( self::$log_dir . '/.htaccess', $htaccess_content );
		}
	}

	/**
	 * Log INFO level message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Additional context data.
	 */
	public static function info( $message, $context = array() ) {
		self::log( 'INFO', $message, $context );
	}

	/**
	 * Log WARNING level message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Additional context data.
	 */
	public static function warning( $message, $context = array() ) {
		self::log( 'WARNING', $message, $context );
	}

	/**
	 * Log ERROR level message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Additional context data.
	 */
	public static function error( $message, $context = array() ) {
		self::log( 'ERROR', $message, $context );
	}

	/**
	 * Write log entry.
	 *
	 * @param string $level   Log level (INFO, WARNING, ERROR).
	 * @param string $message Log message.
	 * @param array  $context Additional context data.
	 */
	private static function log( $level, $message, $context = array() ) {
		self::init();

		// Sanitize sensitive data from context
		$context = self::sanitize_context( $context );

		// Format timestamp
		$timestamp = current_time( 'Y-m-d H:i:s' );

		// Build log entry
		$log_entry = sprintf(
			"[%s] [%s] %s",
			$timestamp,
			$level,
			$message
		);

		// Add context if provided
		if ( ! empty( $context ) ) {
			$log_entry .= ' | Context: ' . wp_json_encode( $context );
		}

		$log_entry .= "\n";

		// Get log file path (daily rotation)
		$log_file = self::get_log_file();

		// Write to log file
		// Suppress errors to prevent breaking the application
		@file_put_contents( $log_file, $log_entry, FILE_APPEND );

		// Also write to WordPress debug.log if WP_DEBUG is enabled
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[Booking System] ' . $log_entry );
		}
	}

	/**
	 * Get current log file path.
	 *
	 * @return string Log file path.
	 */
	private static function get_log_file() {
		$date     = current_time( 'Y-m-d' );
		$filename = 'bookings-' . $date . '.log';
		return self::$log_dir . '/' . $filename;
	}

	/**
	 * Sanitize context data to remove sensitive information.
	 *
	 * @param array $context Context data.
	 * @return array Sanitized context.
	 */
	private static function sanitize_context( $context ) {
		if ( ! is_array( $context ) ) {
			return $context;
		}

		// List of sensitive keys to redact
		$sensitive_keys = array(
			'password',
			'password_hash',
			'api_key',
			'secret',
			'secret_key',
			'stripe_secret',
			'paypal_secret',
			'card_number',
			'cvv',
			'cvc',
			'credit_card',
		);

		foreach ( $context as $key => $value ) {
			// Check if key contains sensitive data
			$key_lower = strtolower( $key );
			foreach ( $sensitive_keys as $sensitive ) {
				if ( strpos( $key_lower, $sensitive ) !== false ) {
					$context[ $key ] = '[REDACTED]';
					break;
				}
			}

			// Recursively sanitize nested arrays
			if ( is_array( $value ) ) {
				$context[ $key ] = self::sanitize_context( $value );
			}
		}

		return $context;
	}

	/**
	 * Clean up old log files (keep 28 days).
	 *
	 * Called by scheduled cron job.
	 */
	public static function cleanup_old_logs() {
		self::init();

		$retention_days = 28; // Keep 4 weeks
		$cutoff_time    = strtotime( "-{$retention_days} days" );

		// Get all log files
		$log_files = glob( self::$log_dir . '/bookings-*.log' );

		if ( empty( $log_files ) ) {
			return;
		}

		$deleted_count = 0;

		foreach ( $log_files as $log_file ) {
			// Get file modification time
			$file_time = filemtime( $log_file );

			// Delete if older than retention period
			if ( $file_time < $cutoff_time ) {
				if ( @unlink( $log_file ) ) {
					$deleted_count++;
				}
			}
		}

		if ( $deleted_count > 0 ) {
			self::info( "Cleaned up {$deleted_count} old log files (older than {$retention_days} days)" );
		}
	}

	/**
	 * Get all log files (for admin viewing).
	 *
	 * @return array Array of log file paths.
	 */
	public static function get_log_files() {
		self::init();
		$log_files = glob( self::$log_dir . '/bookings-*.log' );
		return $log_files ? $log_files : array();
	}

	/**
	 * Get log file contents (for admin viewing).
	 *
	 * @param string $date Date in YYYY-MM-DD format.
	 * @return string|false Log contents or false if not found.
	 */
	public static function get_log_contents( $date ) {
		self::init();
		$filename = 'bookings-' . $date . '.log';
		$filepath = self::$log_dir . '/' . $filename;

		if ( ! file_exists( $filepath ) ) {
			return false;
		}

		return file_get_contents( $filepath );
	}

	/**
	 * Get today's log file path.
	 *
	 * @return string Log file path.
	 */
	public static function get_todays_log_file() {
		return self::get_log_file();
	}

	/**
	 * Check if logging is working.
	 *
	 * @return bool True if can write to log.
	 */
	public static function test_logging() {
		self::init();

		$test_message = 'Test log entry - ' . time();
		$log_file     = self::get_log_file();

		// Try to write test message
		$result = @file_put_contents( $log_file, $test_message . "\n", FILE_APPEND );

		return $result !== false;
	}
}
```

---

### File 2: Modify includes/class-booking-activator.php

Add scheduled log cleanup cron job. Add this code after the database setup call:

```php
// Schedule log cleanup (daily at 3 AM)
if ( ! wp_next_scheduled( 'booking_system_cleanup_logs' ) ) {
	wp_schedule_event( strtotime( '03:00:00' ), 'daily', 'booking_system_cleanup_logs' );
}

// Test logging system
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';
if ( Booking_Logger::test_logging() ) {
	Booking_Logger::info( 'Plugin activated successfully', array(
		'version' => BOOKING_SYSTEM_VERSION,
		'php_version' => PHP_VERSION,
		'wp_version' => $wp_version,
	) );
} else {
	error_log( '[Booking System] WARNING: Log directory not writable' );
}
```

---

### File 3: Modify includes/class-booking-deactivator.php

The deactivation code for cron cleanup is already present from Task 1. Just verify it exists:

```php
// Clear any scheduled cron events
$timestamp = wp_next_scheduled( 'booking_system_cleanup_logs' );
if ( $timestamp ) {
	wp_unschedule_event( $timestamp, 'booking_system_cleanup_logs' );
}
```

If it's not there, add it to the `deactivate()` method.

---

### File 4: Modify includes/class-booking-loader.php

Add logger initialization and cron hook. In the `load_dependencies()` method:

```php
// Logger
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';
```

Then add a new method to the class:

```php
/**
 * Register cron hooks.
 */
private function define_cron_hooks() {
	// Log cleanup cron
	add_action( 'booking_system_cleanup_logs', array( 'Booking_Logger', 'cleanup_old_logs' ) );
}
```

And call it from the constructor (after `define_public_hooks()`):

```php
$this->define_cron_hooks();
```

---

### File 5: Update other files to use logger

**Modify:** `includes/class-booking-auth.php`

Replace `error_log()` calls with `Booking_Logger` calls:

```php
// At the top of the file, after the class declaration, add:
// Note: Logger will be loaded by class-booking-loader.php

// In authenticate() method:
if ( ! $staff ) {
	Booking_Logger::warning( 'Login failed: Email not found', array(
		'email' => $email,
	) );
	return false;
}

// Password verification failed:
if ( ! $password_match ) {
	Booking_Logger::warning( 'Login failed: Invalid password', array(
		'email' => $email,
	) );
	return false;
}

// Login successful:
Booking_Logger::info( 'User login successful', array(
	'staff_id' => $staff['id'],
	'email' => $email,
	'role' => $staff['role'],
) );

// In logout() method:
Booking_Logger::info( 'User logged out', array(
	'staff_id' => $staff_id,
) );
```

**Modify:** `includes/class-booking-session.php`

Replace `error_log()` calls:

```php
// In init() method:
Booking_Logger::info( 'Session started', array(
	'session_id' => session_id(),
) );

// In destroy() method:
Booking_Logger::info( 'Session destroyed' );

// In regenerate() method:
Booking_Logger::info( 'Session ID regenerated' );
```

**Modify:** `includes/class-booking-database.php`

Replace `error_log()` calls:

```php
// In create_tables() method:
Booking_Logger::info( 'Database tables creation started', array(
	'db_version' => self::DB_VERSION,
) );

// After table creation:
Booking_Logger::info( 'Database tables created successfully', array(
	'tables_created' => 10,
) );

// If version check fails:
Booking_Logger::info( 'Database already at current version, skipping table creation', array(
	'current_version' => $installed_version,
) );
```

---

**Important Implementation Notes:**

1. **Log rotation is automatic** - New file created daily
2. **Sensitive data is filtered** - Password, API keys, etc. redacted
3. **Cron cleanup runs daily at 3 AM** - Deletes logs older than 28 days
4. **Non-blocking writes** - Uses `@` suppression to prevent errors
5. **Also writes to WP debug.log** - If WP_DEBUG enabled
6. **Protected directory** - .htaccess prevents web access

**Expected Behavior:**
- Log files created in `wp-content/uploads/bookings/logs/`
- Filename format: `bookings-2026-01-24.log`
- Log entries include timestamp, level, message
- Sensitive data automatically redacted
- Old logs cleaned up after 28 days
- Can test logging via `Booking_Logger::test_logging()`

**Usage Examples:**

```php
// Info level (normal operations)
Booking_Logger::info( 'Booking created', array(
	'booking_id' => 123,
	'customer_id' => 45,
	'service_id' => 7,
) );

// Warning level (non-critical issues)
Booking_Logger::warning( 'Email failed to send', array(
	'booking_id' => 123,
	'error' => 'SMTP timeout',
) );

// Error level (critical issues)
Booking_Logger::error( 'Payment processing failed', array(
	'booking_id' => 123,
	'amount' => 50.00,
	'error' => 'Card declined',
) );

// Sensitive data automatically redacted
Booking_Logger::info( 'Staff created', array(
	'email' => 'staff@example.com',
	'password' => 'secret123',  // Will become '[REDACTED]'
	'api_key' => 'sk_live_abc',  // Will become '[REDACTED]'
) );
```

**Follow WordPress Coding Standards:**
- Use WordPress time functions (`current_time()`)
- File operations with error suppression
- JSON encoding for context data
- Proper file path handling

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Automated Tests (PHPUnit)
- [ ] Test 1: Logger initialization (will be added in Task 7)
- [ ] Test 2: Sensitive data redaction (will be added in Task 7)

### Manual Tests

**File Creation Verification:**

1. [ ] Verify all files created/modified:
   - [ ] `includes/class-booking-logger.php` created
   - [ ] `includes/class-booking-activator.php` modified
   - [ ] `includes/class-booking-deactivator.php` verified
   - [ ] `includes/class-booking-loader.php` modified
   - [ ] `includes/class-booking-auth.php` modified
   - [ ] `includes/class-booking-session.php` modified
   - [ ] `includes/class-booking-database.php` modified

**Plugin Activation Test:**

1. [ ] Deactivate the plugin
2. [ ] Activate the plugin
3. [ ] Check log directory:
   - Navigate to: `wp-content/uploads/bookings/logs/`
   - Verify directory exists
   - Check `.htaccess` file exists
4. [ ] Check today's log file:
   - File should exist: `bookings-2026-01-24.log` (or today's date)
   - Open the file
   - Should see: `[2026-01-24 XX:XX:XX] [INFO] Plugin activated successfully`
   - Should include context: version, php_version, wp_version

**Log File Format Test:**

1. [ ] Open today's log file: `wp-content/uploads/bookings/logs/bookings-YYYY-MM-DD.log`
2. [ ] Verify format of entries:
   ```
   [2026-01-24 14:30:15] [INFO] Plugin activated successfully | Context: {"version":"1.0.0","php_version":"8.2.0","wp_version":"6.4"}
   ```
3. [ ] Check components:
   - [ ] Timestamp in brackets: `[YYYY-MM-DD HH:MM:SS]`
   - [ ] Log level in brackets: `[INFO]`, `[WARNING]`, or `[ERROR]`
   - [ ] Message text
   - [ ] Context data (if provided) after pipe: `| Context: {json}`

**Login/Logout Logging Test:**

1. [ ] Navigate to: `http://localhost:10000/booking-dashboard/`
2. [ ] Login with test credentials (admin@test.com / password123)
3. [ ] Check today's log file
4. [ ] Should see new entries:
   ```
   [YYYY-MM-DD HH:MM:SS] [INFO] Session started | Context: {"session_id":"..."}
   [YYYY-MM-DD HH:MM:SS] [INFO] User login successful | Context: {"staff_id":1,"email":"admin@test.com","role":"admin"}
   ```
5. [ ] Logout from dashboard
6. [ ] Check log file again
7. [ ] Should see:
   ```
   [YYYY-MM-DD HH:MM:SS] [INFO] User logged out | Context: {"staff_id":1}
   [YYYY-MM-DD HH:MM:SS] [INFO] Session destroyed
   ```

**Failed Login Logging Test:**

1. [ ] Try to login with wrong password:
   - Email: admin@test.com
   - Password: wrongpassword
2. [ ] Check log file
3. [ ] Should see WARNING:
   ```
   [YYYY-MM-DD HH:MM:SS] [WARNING] Login failed: Invalid password | Context: {"email":"admin@test.com"}
   ```

**Sensitive Data Redaction Test:**

Create temporary test file to verify redaction works:

**Create:** `wp-content/plugins/booking-system/test-logger.php`

```php
<?php
require_once '../../../wp-load.php';
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';

echo "<h1>Logger Redaction Test</h1>";

// Test 1: Password redaction
Booking_Logger::info( 'Test sensitive data', array(
	'email' => 'test@example.com',
	'password' => 'secret123',
	'api_key' => 'sk_live_abc123',
	'card_number' => '4242424242424242',
	'normal_data' => 'This should appear',
) );

echo "<p>✅ Test logged. Check today's log file.</p>";
echo "<p>Expected: password, api_key, card_number should be [REDACTED]</p>";

$log_file = Booking_Logger::get_todays_log_file();
echo "<h2>Log File Contents:</h2>";
echo "<pre>" . file_get_contents( $log_file ) . "</pre>";
?>
```

**Steps:**

1. [ ] Access: `http://localhost:10000/wp-content/plugins/booking-system/test-logger.php`
2. [ ] Check output shows log entries
3. [ ] Verify sensitive fields are redacted:
   - [ ] `"password":"[REDACTED]"`
   - [ ] `"api_key":"[REDACTED]"`
   - [ ] `"card_number":"[REDACTED]"`
   - [ ] `"email":"test@example.com"` (NOT redacted - email is OK in context)
   - [ ] `"normal_data":"This should appear"` (NOT redacted)
4. [ ] Delete test file after verification

**Log Levels Test:**

1. [ ] Create test file to log all levels:

```php
<?php
require_once '../../../wp-load.php';
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';

Booking_Logger::info( 'This is an INFO message' );
Booking_Logger::warning( 'This is a WARNING message' );
Booking_Logger::error( 'This is an ERROR message' );

echo "✅ All log levels tested. Check today's log file.";
?>
```

2. [ ] Run the test
3. [ ] Check log file shows all three levels:
   ```
   [YYYY-MM-DD HH:MM:SS] [INFO] This is an INFO message
   [YYYY-MM-DD HH:MM:SS] [WARNING] This is a WARNING message
   [YYYY-MM-DD HH:MM:SS] [ERROR] This is an ERROR message
   ```

**Cron Job Registration Test:**

1. [ ] In WordPress admin, install "WP Crontrol" plugin (optional but helpful)
2. [ ] Or check via code:

```php
<?php
require_once '../../../wp-load.php';
$timestamp = wp_next_scheduled( 'booking_system_cleanup_logs' );
echo "Cron scheduled: " . ($timestamp ? 'YES' : 'NO') . "<br>";
if ($timestamp) {
    echo "Next run: " . date('Y-m-d H:i:s', $timestamp);
}
?>
```

3. [ ] Should show cron is scheduled
4. [ ] Next run should be at 03:00:00 (3 AM)

**Manual Cron Cleanup Test:**

1. [ ] Create some old log files manually:

```php
<?php
require_once '../../../wp-load.php';

$log_dir = wp_upload_dir()['basedir'] . '/bookings/logs';

// Create fake old log files
for ($i = 30; $i <= 35; $i++) {
    $date = date('Y-m-d', strtotime("-{$i} days"));
    $filename = "bookings-{$date}.log";
    file_put_contents("{$log_dir}/{$filename}", "Old log file\n");
}

echo "✅ Created 6 fake old log files (30-35 days old)";
?>
```

2. [ ] Check log directory - should see old files
3. [ ] Run cleanup manually:

```php
<?php
require_once '../../../wp-load.php';
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';

Booking_Logger::cleanup_old_logs();

echo "✅ Cleanup complete. Check log directory and today's log for cleanup message.";
?>
```

4. [ ] Check log directory - files older than 28 days should be deleted
5. [ ] Check today's log - should see cleanup message with count

**Log Directory Protection Test:**

1. [ ] Try to access log directory in browser:
   ```
   http://localhost:10000/wp-content/uploads/bookings/logs/
   ```
2. [ ] Should see: "403 Forbidden" (blocked by .htaccess)
3. [ ] Try to access log file directly:
   ```
   http://localhost:10000/wp-content/uploads/bookings/logs/bookings-2026-01-24.log
   ```
4. [ ] Should also be blocked (403 Forbidden)
5. [ ] This confirms .htaccess is working

**PHP Error Check:**

1. [ ] Check `wp-content/debug.log`
2. [ ] Should see logger messages if WP_DEBUG is enabled
3. [ ] Should have NO PHP errors or warnings
4. [ ] No file permission errors

**Performance Test:**

1. [ ] Log 100 entries quickly:

```php
<?php
require_once '../../../wp-load.php';
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';

$start = microtime(true);

for ($i = 1; $i <= 100; $i++) {
    Booking_Logger::info("Test log entry #{$i}");
}

$end = microtime(true);
$duration = $end - $start;

echo "✅ Logged 100 entries in " . number_format($duration, 4) . " seconds<br>";
echo "Average: " . number_format($duration / 100, 6) . " seconds per log entry";
?>
```

2. [ ] Should complete in under 0.5 seconds total
3. [ ] This confirms logging is non-blocking

### Edge Cases

- [ ] Edge case 1: Log directory not writable
  - Manually remove write permissions on log directory
  - Try to log something
  - Should fail gracefully (no fatal error)
  - Reset permissions after test
- [ ] Edge case 2: Disk full scenario
  - Not practical to test, but code uses `@` suppression
  - Application should continue even if logging fails
- [ ] Edge case 3: Very long log messages
  - Log a message with 1000+ characters
  - Should write successfully
  - No truncation or errors
- [ ] Edge case 4: Special characters in log messages
  - Log message with: `<script>`, `"quotes"`, `'apostrophes'`, unicode: 🎉
  - Should handle gracefully, no encoding issues

### Acceptance Criteria

- [ ] Criterion 1: Logger class created and functional
- [ ] Criterion 2: Log files created in correct directory with correct naming
- [ ] Criterion 3: Log entries have correct format (timestamp, level, message)
- [ ] Criterion 4: Three log levels work (INFO, WARNING, ERROR)
- [ ] Criterion 5: Sensitive data automatically redacted
- [ ] Criterion 6: Context data included when provided
- [ ] Criterion 7: Cron job scheduled for daily cleanup
- [ ] Criterion 8: Old logs deleted after 28 days
- [ ] Criterion 9: Log directory protected with .htaccess
- [ ] Criterion 10: Logging is non-blocking and fast
- [ ] Criterion 11: Auth and session classes use logger
- [ ] Criterion 12: No PHP errors in debug.log

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

git add .
git commit -m "Sprint 0, Task 6: Error logging system complete

- Created comprehensive logging class (Booking_Logger):
  - Three log levels: INFO, WARNING, ERROR
  - Daily log rotation (bookings-YYYY-MM-DD.log)
  - Log retention: 28 days (auto-cleanup)
  - Sensitive data filtering (passwords, API keys, etc.)
  - Context data support (JSON encoded)
  - Non-blocking file writes
- Implemented automatic log cleanup:
  - Cron job scheduled daily at 3 AM
  - Deletes logs older than 28 days
  - Logs cleanup activity
- Secured log directory:
  - Protected with .htaccess (deny from all)
  - Prevents web access to log files
- Updated existing classes to use logger:
  - Booking_Auth: Login/logout/failed attempts
  - Booking_Session: Session events
  - Booking_Database: Table creation
- Added logging test on plugin activation
- Fast performance (non-blocking writes)

Tests: Manual verification passing (logging, rotation, redaction)"
```

---

## COMMON ISSUES

### Issue 1: Log directory not created
**Symptoms:** No logs directory in wp-content/uploads/bookings/
**Solution:**
- Check directory permissions on wp-content/uploads/
- Try creating manually and check plugin handles it
- On Windows with Local by Flywheel, permissions usually work
- Verify `wp_mkdir_p()` is being called

### Issue 2: Log files not being created
**Symptoms:** Directory exists but no .log files
**Solution:**
- Check file write permissions
- Look for PHP errors in wp-content/debug.log
- Test logging with `Booking_Logger::test_logging()`
- Verify `file_put_contents()` not failing silently

### Issue 3: Sensitive data not redacted
**Symptoms:** Passwords or API keys appear in logs
**Solution:**
- Check `sanitize_context()` method is being called
- Verify sensitive key names match filter list
- Add more patterns to `$sensitive_keys` array if needed
- Test with the redaction test script

### Issue 4: Cron job not running
**Symptoms:** Old logs never deleted
**Solution:**
- Check cron is scheduled: `wp_next_scheduled( 'booking_system_cleanup_logs' )`
- WordPress cron requires site traffic to trigger
- Test manually: `Booking_Logger::cleanup_old_logs()`
- Install WP Crontrol plugin to verify/trigger cron

### Issue 5: .htaccess not protecting logs
**Symptoms:** Can access logs via browser
**Solution:**
- Check `.htaccess` file exists in logs directory
- Verify Apache mod_rewrite is enabled
- On Nginx, add equivalent deny rule
- Test with different browsers (clear cache)

### Issue 6: Logs too large (disk space)
**Symptoms:** Log files consuming too much disk space
**Solution:**
- Check cleanup cron is running
- Reduce retention from 28 to 14 days if needed
- Consider log level filtering (only ERROR, not INFO)
- Monitor high-traffic sites closely

### Issue 7: Timezone issues in timestamps
**Symptoms:** Log timestamps don't match local time
**Solution:**
- Uses `current_time()` which respects WordPress timezone
- Check WordPress Settings > General > Timezone
- Should be set to "Europe/London" for UK businesses
- Verify timezone in log entries

---

## TASK COMPLETION

When Liron reports "Task 6 complete", confirm:
- [ ] Logger class functional and writing logs?
- [ ] Log files in correct directory with correct naming?
- [ ] Sensitive data being redacted?
- [ ] Cron job scheduled for cleanup?
- [ ] Log directory protected from web access?
- [ ] Auth/session classes using logger?
- [ ] No PHP errors?
- [ ] Code committed to Git?

If all ✅, respond: "Task 6 complete ✅. Error logging system operational. Ready for Task 7: Unit Test Setup?"

---

**Progress Check:**
- ✅ Task 1: Plugin Boilerplate (8h)
- ✅ Task 2: Database Schema Part 1 (8h)
- ✅ Task 3: Database Schema Part 2 (8h)
- ✅ Task 4: Authentication Framework (8h)
- ✅ Task 5: Admin Menu Structure (4h)
- ✅ Task 6: Error Logging System (4h)
- **Total so far: 40/52 hours (77% of Sprint 0)**

Almost there! Ready to continue with Task 7 (Unit Test Setup) when you are! 🚀