# 🔵 TASK 6: IDEMPOTENCY KEYS - IMPLEMENTATION

**Status:** Tests created ✅ - Now implementing the feature

---

## 📝 IMPLEMENTATION OVERVIEW

We'll create this in 3 parts:

1. **Idempotency Handler Class** - Core idempotency logic
2. **Database Migration** - Create idempotency table
3. **Integration** - Wire into Stripe Checkout and Email Sender

Let's build them in order.

---

## 📝 PART 1: IDEMPOTENCY HANDLER CLASS

### CURSOR PROMPT: Create Idempotency Handler

Copy this into **Cursor Composer**:

```
TASK: Implement Idempotency Handler (Sprint 2, Task 6 - Part 1)

CONTEXT:
Sprint 2, Task 6 - Implementation. Create a database-backed idempotency system to prevent duplicate operations (Stripe checkouts, emails, webhooks). We have 12 PHPUnit tests waiting.

CREATE NEW FILE: includes/core/class-idempotency-handler.php

```php
<?php
/**
 * Idempotency Handler
 * Database-backed idempotency tracking for operations
 * 
 * @package Booking_System
 * @subpackage Core
 */

class Booking_System_Idempotency_Handler {
    
    /**
     * Table name for idempotency records
     */
    private $table_name;
    
    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bookings_idempotency';
    }
    
    /**
     * Generate unique idempotency key
     * 
     * @return string 32-character unique key
     */
    public function generate_key() {
        return bin2hex(random_bytes(16)); // 32 hex characters
    }
    
    /**
     * Start an operation with idempotency tracking
     * 
     * @param string $operation_type Type of operation (e.g., 'stripe_checkout', 'email_send')
     * @param string $idempotency_key Unique key for this operation
     * @param array $request_data Request data to hash for duplicate detection
     * @return array|WP_Error Operation record or error
     */
    public function start_operation($operation_type, $idempotency_key, $request_data = array()) {
        global $wpdb;
        
        // Validate inputs
        if (empty($operation_type) || empty($idempotency_key)) {
            return new WP_Error('invalid_input', 'Operation type and idempotency key are required');
        }
        
        // Create hash of request data for comparison
        $request_hash = hash('sha256', json_encode($request_data));
        
        // Check if operation already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE idempotency_key = %s",
            $idempotency_key
        ), ARRAY_A);
        
        if ($existing) {
            // Operation already exists
            
            // Check if data matches (prevent key reuse with different data)
            if ($existing['request_hash'] !== $request_hash) {
                return new WP_Error(
                    'idempotency_mismatch',
                    'Idempotency key reused with different data'
                );
            }
            
            // Return existing record
            return $existing;
        }
        
        // Create new operation record
        $inserted = $wpdb->insert(
            $this->table_name,
            array(
                'idempotency_key' => $idempotency_key,
                'operation_type' => $operation_type,
                'request_hash' => $request_hash,
                'status' => 'processing',
                'created_at' => current_time('mysql'),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if (!$inserted) {
            // Handle race condition - another request may have inserted
            $existing = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE idempotency_key = %s",
                $idempotency_key
            ), ARRAY_A);
            
            if ($existing) {
                return $existing;
            }
            
            error_log('Idempotency: Failed to insert record - ' . $wpdb->last_error);
            return new WP_Error('database_error', 'Failed to create idempotency record');
        }
        
        // Return newly created record
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $wpdb->insert_id
        ), ARRAY_A);
    }
    
    /**
     * Complete an operation successfully
     * 
     * @param string $idempotency_key
     * @param mixed $response_data Response data to store
     * @return bool|WP_Error
     */
    public function complete_operation($idempotency_key, $response_data = null) {
        global $wpdb;
        
        $updated = $wpdb->update(
            $this->table_name,
            array(
                'status' => 'completed',
                'response_data' => is_array($response_data) ? json_encode($response_data) : $response_data,
                'completed_at' => current_time('mysql')
            ),
            array('idempotency_key' => $idempotency_key),
            array('%s', '%s', '%s'),
            array('%s')
        );
        
        if ($updated === false) {
            error_log('Idempotency: Failed to complete operation - ' . $wpdb->last_error);
            return new WP_Error('database_error', 'Failed to complete operation');
        }
        
        return true;
    }
    
    /**
     * Mark an operation as failed
     * 
     * @param string $idempotency_key
     * @param string $error_message Error message
     * @return bool|WP_Error
     */
    public function fail_operation($idempotency_key, $error_message) {
        global $wpdb;
        
        $updated = $wpdb->update(
            $this->table_name,
            array(
                'status' => 'failed',
                'response_data' => $error_message,
                'completed_at' => current_time('mysql')
            ),
            array('idempotency_key' => $idempotency_key),
            array('%s', '%s', '%s'),
            array('%s')
        );
        
        if ($updated === false) {
            error_log('Idempotency: Failed to mark operation as failed - ' . $wpdb->last_error);
            return new WP_Error('database_error', 'Failed to mark operation as failed');
        }
        
        return true;
    }
    
    /**
     * Get operation by idempotency key
     * 
     * @param string $idempotency_key
     * @return array|null
     */
    public function get_operation($idempotency_key) {
        global $wpdb;
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE idempotency_key = %s",
            $idempotency_key
        ), ARRAY_A);
    }
    
    /**
     * Check if operation can be retried
     * Operations can be retried if they failed or expired
     * 
     * @param string $idempotency_key
     * @return bool
     */
    public function can_retry($idempotency_key) {
        $operation = $this->get_operation($idempotency_key);
        
        if (!$operation) {
            return true; // No operation exists, can proceed
        }
        
        // Can retry if failed
        if ($operation['status'] === 'failed') {
            return true;
        }
        
        // Can retry if expired
        if (strtotime($operation['expires_at']) < time()) {
            return true;
        }
        
        // Cannot retry if processing or completed
        return false;
    }
    
    /**
     * Clean up expired idempotency records
     * Should be run via cron job daily
     * 
     * @param int $days_old Delete records older than this many days (default: 30)
     * @return int Number of records deleted
     */
    public function cleanup_expired($days_old = 30) {
        global $wpdb;
        
        $cutoff_date = date('Y-m-d H:i:s', strtotime("-{$days_old} days"));
        
        $deleted = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$this->table_name} WHERE created_at < %s",
            $cutoff_date
        ));
        
        if ($deleted > 0) {
            error_log("Idempotency: Cleaned up {$deleted} expired records");
        }
        
        return $deleted;
    }
    
    /**
     * Delete operation by key
     * 
     * @param string $idempotency_key
     * @return bool
     */
    public function delete_operation($idempotency_key) {
        global $wpdb;
        
        $deleted = $wpdb->delete(
            $this->table_name,
            array('idempotency_key' => $idempotency_key),
            array('%s')
        );
        
        return $deleted !== false;
    }
}
```

CRITICAL REQUIREMENTS:

1. Database-backed (not transients) for permanence
2. Hash request data to detect duplicates
3. Handle race conditions (concurrent requests with same key)
4. Allow retries for failed operations
5. 24-hour expiry on records
6. Cleanup old records (30 days)
7. Store response data for completed operations
8. Status tracking: processing → completed/failed

OPERATION LIFECYCLE:

```
start_operation() → status='processing'
  ↓ (success)
complete_operation() → status='completed', response stored
  ↓ OR (failure)
fail_operation() → status='failed', error stored
  ↓ (after 30 days)
cleanup_expired() → record deleted
```

SUCCESS CRITERIA:
- Prevents duplicate operations with same key
- Detects key reuse with different data
- Handles concurrent requests safely
- Allows retries for failed operations
- Cleans up old records
- All tests pass

Please generate the complete idempotency handler class.
```

---

## 📝 PART 2: DATABASE MIGRATION

### CURSOR PROMPT: Create Idempotency Table Migration

```
TASK: Create Database Migration for Idempotency Table (Sprint 2, Task 6 - Part 2)

CONTEXT:
Need to create the wp_bookings_idempotency table for database-backed idempotency tracking.

CREATE NEW FILE: includes/database/migration-idempotency-table.php

```php
<?php
/**
 * Database Migration: Idempotency Table
 * Creates wp_bookings_idempotency table
 * 
 * @package Booking_System
 * @subpackage Database
 */

function bookit_create_idempotency_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'bookings_idempotency';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE {$table_name} (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        operation_type VARCHAR(50) NOT NULL,
        request_hash VARCHAR(64) NOT NULL,
        response_data TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'processing',
        created_at DATETIME NOT NULL,
        completed_at DATETIME NULL,
        expires_at DATETIME NOT NULL,
        INDEX idx_key (idempotency_key),
        INDEX idx_expires (expires_at),
        INDEX idx_status (status),
        INDEX idx_operation_type (operation_type)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Verify table was created
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_name}'");
    
    if ($table_exists) {
        error_log('Idempotency table created successfully');
        return true;
    } else {
        error_log('Failed to create idempotency table');
        return false;
    }
}

/**
 * Register activation hook to create table
 */
register_activation_hook(
    dirname(dirname(__DIR__)) . '/booking-system.php',
    'bookit_create_idempotency_table'
);
```

TABLE SCHEMA:

- id: Primary key
- idempotency_key: Unique key for operation (32 chars)
- operation_type: Type of operation (stripe_checkout, email_send, webhook)
- request_hash: SHA256 hash of request data
- response_data: JSON or text response (for completed operations)
- status: processing, completed, failed
- created_at: When operation started
- completed_at: When operation finished
- expires_at: 24 hours after created_at

INDEXES:
- idx_key: Fast lookup by idempotency_key
- idx_expires: Fast cleanup of expired records
- idx_status: Filter by status
- idx_operation_type: Filter by operation type

SUCCESS CRITERIA:
- Table created on plugin activation
- All columns present
- Indexes created
- UNIQUE constraint on idempotency_key

Please generate the migration file.
```

---

## 📝 PART 3: INTEGRATE WITH EXISTING CODE

### CURSOR PROMPT: Integrate Idempotency into Stripe Checkout

```
TASK: Integrate Idempotency into Stripe Checkout (Sprint 2, Task 6 - Part 3)

CONTEXT:
Sprint 2, Task 6 - Add idempotency to Stripe Checkout Session creation to prevent duplicate sessions.

FIND FILE: includes/payment/class-stripe-checkout.php

FIND METHOD: create_checkout_session()

ADD IDEMPOTENCY LOGIC:

STEP 1: Add at the beginning of create_checkout_session():

```php
public function create_checkout_session($session_data) {
    // Generate idempotency key from session data
    $idempotency_key = 'stripe_checkout_' . hash('sha256', json_encode($session_data));
    
    // Initialize idempotency handler
    require_once dirname(dirname(__DIR__)) . '/includes/core/class-idempotency-handler.php';
    $idempotency = new Booking_System_Idempotency_Handler();
    
    // Start operation (or get existing)
    $operation = $idempotency->start_operation('stripe_checkout', $idempotency_key, $session_data);
    
    if (is_wp_error($operation)) {
        return $operation;
    }
    
    // If operation already completed, return cached session ID
    if ($operation['status'] === 'completed' && !empty($operation['response_data'])) {
        $cached_data = json_decode($operation['response_data'], true);
        if (!empty($cached_data['session_id'])) {
            error_log('Stripe Checkout: Returning cached session ID ' . $cached_data['session_id']);
            return $cached_data['session_id'];
        }
    }
    
    // Continue with existing validation...
    $validation = $this->validate_session_data($session_data);
    // ... rest of method
}
```

STEP 2: After successful Stripe session creation, add:

```php
try {
    $checkout_session = \Stripe\Checkout\Session::create($params);
    $session_id = $checkout_session->id;
    
    // Mark operation as completed with session ID
    $idempotency->complete_operation($idempotency_key, [
        'session_id' => $session_id,
        'amount' => $checkout_session->amount_total
    ]);
    
    return $session_id;
} catch (\Exception $e) {
    error_log('Stripe Checkout Session Error: ' . $e->getMessage());
    
    // Mark operation as failed
    $idempotency->fail_operation($idempotency_key, $e->getMessage());
    
    return new WP_Error('stripe_error', 'Unable to create checkout session: ' . $e->getMessage());
}
```

SUCCESS CRITERIA:
- Duplicate checkout sessions prevented
- Cached session IDs returned for duplicate requests
- Failed operations allow retry
- All existing tests still pass

Please integrate idempotency into the Stripe Checkout class.
```

---

## 📝 PART 4: ADD CLEANUP CRON JOB

### CURSOR PROMPT: Add Idempotency Cleanup Cron

```
TASK: Add Cron Job for Idempotency Cleanup (Sprint 2, Task 6 - Part 4)

CONTEXT:
Sprint 2, Task 6 - Add daily cron job to clean up old idempotency records (30+ days old).

CREATE NEW FILE: includes/cron/class-idempotency-cleanup.php

```php
<?php
/**
 * Idempotency Cleanup Cron Job
 * Cleans up expired idempotency records daily
 * 
 * @package Booking_System
 * @subpackage Cron
 */

class Booking_System_Idempotency_Cleanup {
    
    /**
     * Constructor - Register cron hooks
     */
    public function __construct() {
        // Register cron action
        add_action('bookit_daily_idempotency_cleanup', array($this, 'cleanup'));
        
        // Schedule cron if not already scheduled
        if (!wp_next_scheduled('bookit_daily_idempotency_cleanup')) {
            wp_schedule_event(time(), 'daily', 'bookit_daily_idempotency_cleanup');
        }
    }
    
    /**
     * Cleanup expired idempotency records
     */
    public function cleanup() {
        require_once dirname(dirname(__FILE__)) . '/core/class-idempotency-handler.php';
        
        $handler = new Booking_System_Idempotency_Handler();
        $deleted = $handler->cleanup_expired(30); // Delete records older than 30 days
        
        error_log("Idempotency Cleanup: Removed {$deleted} expired records");
    }
}

// Initialize
new Booking_System_Idempotency_Cleanup();

/**
 * Clear cron on plugin deactivation
 */
register_deactivation_hook(
    dirname(dirname(__DIR__)) . '/booking-system.php',
    function() {
        wp_clear_scheduled_hook('bookit_daily_idempotency_cleanup');
    }
);
```

SUCCESS CRITERIA:
- Cron job registered on plugin activation
- Runs daily
- Cleans up records older than 30 days
- Deregisters on plugin deactivation
- Logs cleanup activity

Please create the cron job file.
```

---

## 📝 PART 5: INCLUDE NEW FILES

### CURSOR PROMPT: Include Idempotency Files in Main Plugin

```
TASK: Include Idempotency Files in Main Plugin (Sprint 2, Task 6 - Part 5)

CONTEXT:
Sprint 2, Task 6 - Include the new idempotency files in the main plugin file.

FIND FILE: booking-system.php

ADD THESE LINES (after other includes):

```php
// Idempotency handling
require_once plugin_dir_path(__FILE__) . 'includes/core/class-idempotency-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/cron/class-idempotency-cleanup.php';
require_once plugin_dir_path(__FILE__) . 'includes/database/migration-idempotency-table.php';
```

SUCCESS CRITERIA:
- Files included in main plugin
- No syntax errors on plugin load
- Cron job registered automatically
- Table created on activation

Please add the includes to the main plugin file.
```

---

## ⏸️ AFTER CURSOR GENERATES ALL CODE

### Step 1: Verify Files Created

Check these files exist:
- [ ] `includes/core/class-idempotency-handler.php`
- [ ] `includes/database/migration-idempotency-table.php`
- [ ] `includes/cron/class-idempotency-cleanup.php`
- [ ] Updated: `includes/payment/class-stripe-checkout.php` (has idempotency)
- [ ] Updated: `booking-system.php` (includes new files)

### Step 2: Activate Plugin (Creates Table)

In WordPress Admin:
1. Deactivate "Booking System"
2. Activate "Booking System"
3. Check for PHP errors

**Verify table created:**
```sql
DESCRIBE wp_bookings_idempotency;
```

**Expected:** Table exists with all columns.

### Step 3: Run Tests

```bash
vendor/bin/phpunit tests/test-idempotency.php
```

**Expected:**
```
PHPUnit 9.x.x

............  12 / 12 (100%)

OK (12 tests, 36 assertions)
```

### Step 4: Run All Sprint 2 Tests

Make sure we didn't break anything:

```bash
vendor/bin/phpunit tests/test-stripe-checkout.php
vendor/bin/phpunit tests/test-stripe-webhook.php
vendor/bin/phpunit tests/test-payment-success.php
vendor/bin/phpunit tests/test-idempotency.php
```

**Expected:** All tests passing ✅

---

**Reply with:**
- "All Task 6 tests passing ✅" (if all 12 pass), OR
- Paste any test failures so I can help fix them

Once tests pass, we'll commit Task 6 and move to Task 13 (Pay on Arrival)! 🚀