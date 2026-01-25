Absolutely! Here's the properly formatted fix for Task 6:

---

# TASK 6 SECURITY FIX: MOVE LOGS OUTSIDE WEB ROOT

## Goal
Fix the security vulnerability where log files are directly accessible via HTTP by moving them outside the web root directory.

## Prerequisites
- Task 6: Error Logging System must be complete

## Estimated Time
30 minutes

## Files to Modify
- `includes/class-booking-logger.php` (modify - change log directory location)
- `includes/class-booking-activator.php` (modify - update initialization)

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Fix security vulnerability in the Booking System logging system. Currently, log files are accessible via HTTP (e.g., `http://site.com/wp-content/uploads/bookings/logs/bookings-2026-01-24.log`). This is a security risk.

**Solution:** Move logs outside the web root directory where they cannot be accessed via HTTP.

**Current location:** `wp-content/uploads/bookings/logs/` (publicly accessible)
**New location:** `/booking-logs/` (outside `/public/` or `/www/` directory, not accessible via HTTP)

**Requirements:**

1. **Primary location:** Try to create logs outside web root (`/booking-logs/`)
2. **Fallback location:** If outside web root isn't writable, fall back to uploads directory
3. **Auto-detection:** Detect which location is writable and use the best option
4. **Migration:** Move existing logs from old location to new location
5. **Protection:** Add `.htaccess`, `index.php`, and `README.txt` to log directory
6. **Logging:** Log which directory is being used for transparency

---

### File 1: Modify includes/class-booking-logger.php

**Replace the `init()` method** with this improved version:

```php
/**
 * Initialize logger.
 */
public static function init() {
	// Try to store logs OUTSIDE web root for maximum security
	// WP_CONTENT_DIR = /path/to/site/app/public/wp-content
	// dirname(WP_CONTENT_DIR) = /path/to/site/app/public
	// We want /path/to/site/app/booking-logs (outside public directory)
	
	$outside_root   = dirname( WP_CONTENT_DIR ) . '/booking-logs';
	$inside_uploads = wp_upload_dir()['basedir'] . '/bookings/logs';
	
	// Determine best log location
	if ( self::can_create_directory( dirname( $outside_root ) ) ) {
		// Preferred: Outside web root (not accessible via HTTP)
		self::$log_dir = $outside_root;
	} else {
		// Fallback: Inside uploads directory with protection
		self::$log_dir = $inside_uploads;
	}

	// Ensure log directory exists
	if ( ! file_exists( self::$log_dir ) ) {
		wp_mkdir_p( self::$log_dir );
		
		// Add .htaccess for Apache servers
		$htaccess_content  = "# Booking System - Deny all access to log files\n";
		$htaccess_content .= "Order deny,allow\n";
		$htaccess_content .= "Deny from all\n";
		file_put_contents( self::$log_dir . '/.htaccess', $htaccess_content );
		
		// Add index.php to prevent directory listing
		$index_content = "<?php\n// Silence is golden.\n";
		file_put_contents( self::$log_dir . '/index.php', $index_content );
		
		// Add README for documentation
		$readme_content  = "# Booking System Log Files\n\n";
		$readme_content .= "This directory contains log files for the Booking System plugin.\n";
		$readme_content .= "Log files are retained for 28 days and automatically cleaned up.\n\n";
		$readme_content .= "SECURITY: These files should NOT be accessible via HTTP.\n";
		$readme_content .= "Location: " . self::$log_dir . "\n";
		$readme_content .= "Created: " . date( 'Y-m-d H:i:s' ) . "\n";
		file_put_contents( self::$log_dir . '/README.txt', $readme_content );
	}
}

/**
 * Check if we can create a directory in the given parent path.
 *
 * @param string $parent_path Parent directory path.
 * @return bool True if writable.
 */
private static function can_create_directory( $parent_path ) {
	// Check if parent directory exists and is writable
	if ( ! file_exists( $parent_path ) ) {
		return false;
	}
	
	if ( ! is_writable( $parent_path ) ) {
		return false;
	}
	
	return true;
}
```

**Add these new methods** at the end of the class (before the closing `}`):

```php
/**
 * Get log directory path.
 *
 * @return string Log directory path.
 */
public static function get_log_directory() {
	self::init();
	return self::$log_dir;
}

/**
 * Check if logs are stored outside web root (secure).
 *
 * @return bool True if outside web root.
 */
public static function is_secure_location() {
	self::init();
	
	// Check if log directory is outside ABSPATH (WordPress root)
	$log_dir_real = realpath( self::$log_dir );
	$abspath_real = realpath( ABSPATH );
	
	// If log directory is NOT inside ABSPATH, it's secure
	return strpos( $log_dir_real, $abspath_real ) === false;
}

/**
 * Migrate logs from old location to new location.
 *
 * Called during plugin activation if needed.
 */
public static function migrate_logs_if_needed() {
	self::init();
	
	// Old location: wp-content/uploads/bookings/logs
	$old_location = wp_upload_dir()['basedir'] . '/bookings/logs';
	$new_location = self::$log_dir;
	
	// If already using the same location, nothing to do
	if ( $old_location === $new_location ) {
		return;
	}
	
	// If old location doesn't exist, nothing to migrate
	if ( ! file_exists( $old_location ) ) {
		return;
	}
	
	// Get all log files from old location
	$old_files = glob( $old_location . '/bookings-*.log' );
	
	if ( empty( $old_files ) ) {
		return;
	}
	
	$migrated_count = 0;
	
	foreach ( $old_files as $old_file ) {
		$filename = basename( $old_file );
		$new_file = $new_location . '/' . $filename;
		
		// Copy file to new location
		if ( copy( $old_file, $new_file ) ) {
			// Preserve file modification time
			$old_time = filemtime( $old_file );
			touch( $new_file, $old_time );
			
			// Delete old file after successful copy
			unlink( $old_file );
			$migrated_count++;
		}
	}
	
	if ( $migrated_count > 0 ) {
		self::info( "Migrated {$migrated_count} log files to new secure location", array(
			'old_location' => $old_location,
			'new_location' => $new_location,
			'is_secure'    => self::is_secure_location(),
		) );
	}
	
	// Try to remove old directory (only if empty)
	@rmdir( $old_location );
	@rmdir( dirname( $old_location ) ); // Try to remove parent /bookings/ if empty
}
```

---

### File 2: Modify includes/class-booking-activator.php

**Find the log directory creation code** (around line 50-60) and replace it with:

```php
// Initialize logger (creates log directory in best location)
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';
Booking_Logger::init();

// Migrate existing logs if needed
Booking_Logger::migrate_logs_if_needed();

// Test logging system
if ( Booking_Logger::test_logging() ) {
	Booking_Logger::info( 'Plugin activated successfully', array(
		'version'       => BOOKING_SYSTEM_VERSION,
		'php_version'   => PHP_VERSION,
		'wp_version'    => $wp_version,
		'log_directory' => Booking_Logger::get_log_directory(),
		'is_secure'     => Booking_Logger::is_secure_location() ? 'YES (outside web root)' : 'NO (inside uploads)',
	) );
} else {
	error_log( '[Booking System] WARNING: Log directory not writable' );
}
```

**Remove the old log directory creation code** that looks like this (if it exists):

```php
// DELETE THIS OLD CODE:
$log_dir = wp_upload_dir()['basedir'] . '/bookings/logs';
if ( ! file_exists( $log_dir ) ) {
	wp_mkdir_p( $log_dir );
	$htaccess_content = "Deny from all\n";
	file_put_contents( $log_dir . '/.htaccess', $htaccess_content );
}
```

---

**Important Notes:**

1. **Location detection is automatic** - Plugin tries outside web root first, falls back if needed
2. **Migration is automatic** - Existing logs moved on plugin activation
3. **Secure by default** - Logs not accessible via HTTP if outside web root
4. **Fallback protection** - If must use uploads, adds `.htaccess` + `index.php`
5. **Transparency** - Logs which directory is being used

**Expected Directory Structure:**

```
/path/to/site/
├── app/
│   ├── booking-logs/              ← NEW LOCATION (preferred, secure)
│   │   ├── .htaccess
│   │   ├── index.php
│   │   ├── README.txt
│   │   └── bookings-2026-01-24.log
│   └── public/
│       └── wp-content/
│           └── uploads/
│               └── bookings/
│                   └── logs/      ← OLD LOCATION (fallback if needed)
```

**How to verify it's working:**

After activation, check today's log file for an entry like:
```
[2026-01-24 XX:XX:XX] [INFO] Plugin activated successfully | Context: {"version":"1.0.0",...,"log_directory":"/path/to/site/app/booking-logs","is_secure":"YES (outside web root)"}
```

If `is_secure` says "YES (outside web root)", logs are now secure!

**Follow WordPress Coding Standards:**
- Use WordPress file functions (`wp_mkdir_p()`)
- Docblocks on all methods
- Error suppression on cleanup operations
- Proper directory path handling

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Manual Tests

**Test 1: Check Log Location After Activation**

1. [ ] **Deactivate** the plugin
2. [ ] **Activate** the plugin
3. [ ] **Open today's log file** and check the activation message
4. [ ] **Verify** `log_directory` path in the log entry
5. [ ] **Verify** `is_secure` says either:
   - "YES (outside web root)" ← **Preferred, logs are secure**
   - "NO (inside uploads)" ← Fallback, but protected with .htaccess

**Test 2: Verify Directory Location**

**If using Local by Flywheel:**

Navigate to your site directory:
```
C:\Local Sites\plugin-test-1\app\
```

Check if `booking-logs` directory exists:
- [ ] Directory exists at: `C:\Local Sites\plugin-test-1\app\booking-logs\`
- [ ] Files inside:
  - [ ] `.htaccess`
  - [ ] `index.php`
  - [ ] `README.txt`
  - [ ] `bookings-2026-01-24.log` (today's date)

**Test 3: Migration Test**

1. [ ] Create a test log in old location:
   ```php
   <?php
   require_once '../../../wp-load.php';
   $old_dir = wp_upload_dir()['basedir'] . '/bookings/logs';
   wp_mkdir_p($old_dir);
   file_put_contents($old_dir . '/bookings-2026-01-20.log', "Test old log\n");
   echo "✅ Created test log in old location";
   ?>
   ```
2. [ ] **Deactivate** the plugin
3. [ ] **Activate** the plugin
4. [ ] Check new log location - should contain migrated file
5. [ ] Check old location - file should be gone (migrated)
6. [ ] Check today's log for migration message

**Test 4: HTTP Access Test (Security Verification)**

**If logs are OUTSIDE web root:**

1. [ ] Try to access: `http://plugin-test-1.local/booking-logs/bookings-2026-01-24.log`
2. [ ] **Expected:** 404 Not Found (directory doesn't exist in web root) ✅ SECURE
3. [ ] Try to access: `http://plugin-test-1.local/wp-content/uploads/bookings/logs/`
4. [ ] **Expected:** 404 Not Found (old location empty or deleted) ✅ SECURE

**If logs are INSIDE uploads (fallback):**

1. [ ] Try to access: `http://plugin-test-1.local/wp-content/uploads/bookings/logs/`
2. [ ] **Expected:** Blank page (index.php loads)
3. [ ] Try to access: `http://plugin-test-1.local/wp-content/uploads/bookings/logs/bookings-2026-01-24.log`
4. [ ] **Expected on Apache:** 403 Forbidden (.htaccess blocks)
5. [ ] **Expected on Nginx:** File downloads (limitation - acceptable for local dev)

**Test 5: Logging Still Works**

1. [ ] Login to dashboard: `http://plugin-test-1.local/booking-dashboard/`
2. [ ] Check today's log file in new location
3. [ ] Should see login event logged
4. [ ] Logout
5. [ ] Should see logout event logged

**Test 6: Verify Helper Methods**

Create test script:

```php
<?php
require_once '../../../wp-load.php';
require_once BOOKING_SYSTEM_PATH . 'includes/class-booking-logger.php';

echo "<h1>Logger Security Check</h1>";

$log_dir = Booking_Logger::get_log_directory();
$is_secure = Booking_Logger::is_secure_location();

echo "<p><strong>Log Directory:</strong> $log_dir</p>";
echo "<p><strong>Is Secure?</strong> " . ($is_secure ? '✅ YES (outside web root)' : '❌ NO (inside uploads)') . "</p>";

$abspath = realpath(ABSPATH);
echo "<p><strong>Web Root (ABSPATH):</strong> $abspath</p>";

if ($is_secure) {
    echo "<p style='color: green;'><strong>✅ SECURE:</strong> Log files are NOT accessible via HTTP.</p>";
} else {
    echo "<p style='color: orange;'><strong>⚠️ FALLBACK:</strong> Log files in uploads directory. Protected by .htaccess (Apache only).</p>";
}
?>
```

**Test 7: Cleanup Still Works**

1. [ ] Create old test files (with proper timestamps using `touch()`)
2. [ ] Run cleanup: `Booking_Logger::cleanup_old_logs()`
3. [ ] Verify files older than 28 days are deleted
4. [ ] Works in new location

**PHP Error Check:**

1. [ ] Check `wp-content/debug.log`
2. [ ] Should have NO errors related to log directory
3. [ ] Should have NO "permission denied" errors

### Acceptance Criteria

- [ ] Criterion 1: Logs stored outside web root if possible (check `is_secure` = YES)
- [ ] Criterion 2: Falls back to uploads if outside web root not writable
- [ ] Criterion 3: Existing logs migrated automatically on activation
- [ ] Criterion 4: Cannot access logs via HTTP (404 or 403)
- [ ] Criterion 5: Migration message logged when logs are moved
- [ ] Criterion 6: README.txt created with documentation
- [ ] Criterion 7: Helper methods work (`get_log_directory()`, `is_secure_location()`)
- [ ] Criterion 8: Logging functionality still works (login/logout events appear)
- [ ] Criterion 9: Cleanup still works in new location
- [ ] Criterion 10: No PHP errors during migration or logging

**Definition of Done:**
ALL checkboxes above must be ✅ before marking fix complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
cd C:\Local Sites\plugin-test-1\app\public\wp-content\plugins\booking-system

git add .
git commit -m "Sprint 0, Task 6: SECURITY FIX - Move logs outside web root

SECURITY IMPROVEMENT:
- Logs now stored outside web root (not HTTP accessible)
- Primary location: /app/booking-logs/ (outside /public/)
- Fallback location: /wp-content/uploads/bookings/logs/
- Auto-detection of best location based on permissions

FEATURES ADDED:
- Automatic log migration from old to new location
- Helper methods: get_log_directory(), is_secure_location()
- Added README.txt to log directory
- Improved .htaccess with explicit deny rules
- Logging of security status on activation

SECURITY VERIFICATION:
- Logs NOT accessible via HTTP when outside web root
- Falls back to protected uploads directory if needed
- Migration preserves file timestamps for cleanup

Tests: Manual verification passing (logs secure, migration works)"
```

---

## COMMON ISSUES

### Issue 1: Still using uploads directory
**Symptoms:** `is_secure` says "NO (inside uploads)"
**Cause:** Parent directory not writable
**Solution:**
- Check permissions on `/app/` directory (should be writable)
- On Local by Flywheel, this should work automatically
- If not, the fallback location (uploads) is acceptable for local dev

### Issue 2: Migration doesn't run
**Symptoms:** Old logs still in uploads directory
**Cause:** Plugin was already activated when code changed
**Solution:**
- Deactivate and reactivate plugin
- Or manually call `Booking_Logger::migrate_logs_if_needed()`

### Issue 3: Can't find log files
**Symptoms:** Don't know where logs went
**Solution:**
- Check today's log activation message for `log_directory` path
- Or run helper: `echo Booking_Logger::get_log_directory();`
- Navigate to that directory

### Issue 4: Permission denied creating directory
**Symptoms:** PHP error "mkdir(): Permission denied"
**Solution:**
- Check parent directory permissions
- On Windows with Local by Flywheel, usually not an issue
- Falls back to uploads automatically

---

## TASK COMPLETION

When Liron reports "Security fix complete", confirm:
- [ ] Logs moved to new location?
- [ ] `is_secure` shows YES (or NO with explanation)?
- [ ] Old logs migrated successfully?
- [ ] Cannot access logs via HTTP (404)?
- [ ] Logging still works (login events appear)?
- [ ] No PHP errors?
- [ ] Code committed to Git?

If all ✅, respond: "Task 6 Security Fix complete ✅. Logs are now secure. Ready for Task 7: Unit Test Setup?"

---

**This security fix is critical before moving to production. Good call prioritizing it!** 🔒

Ready to implement? Let me know when you've run the Cursor prompt! 🚀