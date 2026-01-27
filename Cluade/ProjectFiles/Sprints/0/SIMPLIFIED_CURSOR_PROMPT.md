# CURSOR PROMPT: RESOLVE PLUGIN NAMESPACE CONFLICTS
## Change "Booking" to "Bookit" in Code Only

**PASTE THIS INTO CURSOR COMPOSER (Ctrl+I)**

---

## 🎯 OBJECTIVE

**Change all code identifiers** from `booking*` to `bookit*` to prevent conflicts with existing "Booking System" plugin in WordPress.org directory.

**Keep generic language** like "booking system" in comments, documentation, and user-facing text.

---

## ⚠️ CRITICAL RULE

**CHANGE:** Code identifiers (functions, classes, constants, files, hooks, options)  
**KEEP:** User-facing language, descriptions, generic terms

---

## 📋 WHAT TO CHANGE

### 1. Plugin Header (REQUIRED for WordPress.org)

```php
// OLD
/**
 * Plugin Name: Booking System
 * Text Domain: booking-system
 */

// NEW
/**
 * Plugin Name: Bookit Booking System
 * Description: Professional booking system for UK service businesses
 * Text Domain: bookit-booking-system
 */
```

### 2. Constants

```php
// OLD → NEW
BOOKING_VERSION → BOOKIT_VERSION
BOOKING_PLUGIN_DIR → BOOKIT_PLUGIN_DIR
BOOKING_PLUGIN_URL → BOOKIT_PLUGIN_URL
BOOKING_PLUGIN_BASENAME → BOOKIT_PLUGIN_BASENAME
```

### 3. Functions

```php
// OLD → NEW
function booking_activate() → function bookit_activate()
function booking_deactivate() → function bookit_deactivate()
function booking_create_booking() → function bookit_create_booking()
function booking_log_error() → function bookit_log_error()
// ... all booking_* functions
```

### 4. Classes

```php
// OLD → NEW
class Booking_System_Activator → class Bookit_Activator
class Booking_System_Logger → class Bookit_Logger
class Booking_System_Admin → class Bookit_Admin
class Booking_Activator → class Bookit_Activator
// ... all Booking_* classes
```

### 5. File Names

```bash
# OLD → NEW
booking-system.php → bookit-booking-system.php
class-booking-system-*.php → class-bookit-*.php
class-booking-*.php → class-bookit-*.php
```

### 6. Options (WordPress database)

```php
// OLD → NEW
get_option('booking_settings') → get_option('bookit_settings')
update_option('booking_version') → update_option('bookit_version')
// ... all booking_* options
```

### 7. Hooks (Actions & Filters)

```php
// OLD → NEW
do_action('booking_after_save') → do_action('bookit_after_save')
add_action('booking_init') → add_action('bookit_init')
apply_filters('booking_slots') → apply_filters('bookit_slots')
// ... all booking_* hooks
```

### 8. CSS/JS Handles

```php
// OLD → NEW
wp_enqueue_style('booking-admin') → wp_enqueue_style('bookit-admin')
wp_enqueue_script('booking-wizard') → wp_enqueue_script('bookit-wizard')
```

### 9. User Roles

```php
// OLD → NEW
add_role('booking_admin') → add_role('bookit_admin')
add_role('booking_staff') → add_role('bookit_staff')
```

### 10. Text Domain (i18n)

```php
// OLD → NEW
__('Text', 'booking-system') → __('Text', 'bookit-booking-system')
_e('Text', 'booking-system') → _e('Text', 'bookit-booking-system')
```

---

## ✅ WHAT TO KEEP UNCHANGED

### 1. Database Tables

```php
// ✅ KEEP AS-IS
$wpdb->prefix . 'bookings'
$wpdb->prefix . 'bookings_services'
$wpdb->prefix . 'bookings_staff'
// ... all wp_bookings_* tables
```

**Reason:** Already created, describe what they store, no conflict risk.

### 2. Generic Terms in Comments

```php
// ✅ KEEP AS-IS
/**
 * Creates a new booking in the database
 * 
 * This booking system uses optimistic locking...
 */
function bookit_create_booking($data) { }
              ↑
         Code identifier (changed)
```

### 3. User-Facing Menu Labels

```php
// ✅ OK TO KEEP GENERIC
add_menu_page(
    'Bookings',           // ← Page title (generic OK)
    'Bookings',           // ← Menu title (generic OK)  
    'manage_options',
    'bookit-bookings',    // ← Menu slug (MUST be unique)
    'bookit_bookings_page' // ← Callback (MUST be unique)
);
```

### 4. Documentation Prose

```markdown
✅ KEEP AS-IS:
"This booking system allows customers to book appointments online."
"The system supports multiple payment methods."
"Configure your booking policies in settings."

❌ CHANGE ONLY CODE:
"Call booking_create_booking()" → "Call bookit_create_booking()"
```

---

## 🔍 SEARCH & REPLACE CHECKLIST

Perform these in order:

### Phase 1: Critical Code Identifiers

- [ ] **1. Main file:** Rename `booking-system.php` → `bookit-booking-system.php`
- [ ] **2. Plugin header:** Update Plugin Name and Text Domain
- [ ] **3. Constants:** `BOOKING_*` → `BOOKIT_*`
- [ ] **4. Functions:** `function booking_*` → `function bookit_*`
- [ ] **5. Classes:** `class Booking_*` → `class Bookit_*`
- [ ] **6. File names:** All `*booking*.php` → `*bookit*.php`

### Phase 2: WordPress Integration

- [ ] **7. Options:** `get_option('booking_*')` → `get_option('bookit_*')`
- [ ] **8. Hooks:** `do_action('booking_*')` → `do_action('bookit_*')`
- [ ] **9. Filters:** `apply_filters('booking_*')` → `apply_filters('bookit_*')`
- [ ] **10. Roles:** `add_role('booking_*')` → `add_role('bookit_*')`

### Phase 3: Assets & i18n

- [ ] **11. CSS handles:** `wp_enqueue_style('booking-*')` → `wp_enqueue_style('bookit-*')`
- [ ] **12. JS handles:** `wp_enqueue_script('booking-*')` → `wp_enqueue_script('bookit-*')`
- [ ] **13. Text domain:** `'booking-system'` → `'bookit-booking-system'`

---

## 🧪 TESTING

After refactoring:

```bash
# 1. Activate plugin
wp plugin activate bookit-booking-system

# 2. Check for errors
# Should see NO errors

# 3. Verify database tables
wp db query "SHOW TABLES LIKE 'wp_bookings%';"
# Should show 10 tables (unchanged)

# 4. Run tests
vendor/bin/phpunit

# 5. Check for old naming
grep -r "function booking_" --include="*.php" .
grep -r "class Booking_" --include="*.php" .
# Should find ZERO results in active code
```

---

## 📝 GIT COMMIT

```bash
# Rename files properly
git mv booking-system.php bookit-booking-system.php
git mv includes/class-booking-*.php includes/class-bookit-*.php
# ... etc

# Stage all changes
git add -A

# Commit
git commit -m "Resolve namespace conflict: booking → bookit

- Changed all code identifiers to bookit_* prefix
- Prevents conflicts with existing 'Booking System' plugin
- Database tables remain wp_bookings_* (unchanged)
- Generic 'booking system' language kept in docs/UI

Plugin tested and functional. Ready for Sprint 1."
```

---

## ⚠️ TROUBLESHOOTING

### "Class 'Booking_*' not found"
→ Check class name updated AND instantiation updated

### "Call to undefined function booking_*()"  
→ Check function name updated AND all call sites updated

### Database errors
→ Verify NOT changing table names (should stay wp_bookings_*)

---

## ✅ SUCCESS CRITERIA

- [ ] Plugin activates without errors
- [ ] No "Class not found" errors
- [ ] No "Undefined function" errors
- [ ] Database tables intact
- [ ] PHPUnit tests pass
- [ ] No old booking_* identifiers in active code

---

**END OF PROMPT - Let Cursor refactor the code**
