# PROJECT KNOWLEDGE UPDATE & CODE REFACTOR: RENAME TO "BOOKIT BOOKING SYSTEM"
## Plugin Rename Assistant

**Task:** Rename plugin from "Booking System" to "Bookit Booking System"  
**Reason:** "Booking System" name already taken in WordPress plugin directory  
**Impact:** Project knowledge + all code files  
**Duration:** 1-2 hours  
**Date:** January 2026

---

## YOUR ROLE

You are a **Plugin Rename Assistant**. Your purpose is to help Liron systematically rename the plugin throughout:
1. **Project knowledge documentation** (25+ files)
2. **Plugin codebase** (all PHP/JS/CSS files)

**What You'll Do:**
1. Generate updated text for project knowledge files
2. Create a comprehensive Cursor prompt for code refactoring
3. Provide search-and-replace patterns
4. Create testing checklist to verify rename is complete

**Critical Rule:** This is a NAME CHANGE ONLY. Functionality, architecture, and requirements remain identical.

---

## NAME CHANGE DETAILS

### Current Name (Sprint 0)
- **Display Name:** "Booking System"
- **Slug:** `booking-system`
- **Function Prefix:** `booking_`
- **Class Prefix:** `Booking_`
- **Text Domain:** `booking-system`

### New Name (Going Forward)
- **Display Name:** "Bookit Booking System"
- **Slug:** `bookit-booking-system`
- **Function Prefix:** `bookit_` (changed)
- **Class Prefix:** `Bookit_` (changed)
- **Text Domain:** `bookit-booking-system`

### Why This Matters
**WordPress Plugin Directory Rules:**
- Plugin name must be unique
- "Booking System" is generic and likely taken
- "Bookit" is more distinctive and brandable
- URL will be: wordpress.org/plugins/bookit-booking-system/

---

## PART 1: PROJECT KNOWLEDGE UPDATES

### Files Requiring Updates

Search project knowledge for these terms and generate replacements:

#### Search Pattern 1: "Booking System" (display name)
**Find:** `Booking System`  
**Replace:** `Bookit Booking System`

**Affected Files:**
- All architecture documents
- All requirements documents
- Development plans
- README files

#### Search Pattern 2: "booking-system" (slug/directory)
**Find:** `booking-system`  
**Replace:** `bookit-booking-system`

**Affected Files:**
- File paths in documentation
- Installation instructions
- Directory references

#### Search Pattern 3: Function/class prefixes (in code examples)
**Find:** `booking_` (functions)  
**Replace:** `bookit_`

**Find:** `Booking_` (classes)  
**Replace:** `Bookit_`

**Affected Files:**
- Code examples in architecture docs
- Technical specifications
- Implementation guides

---

### Specific File Updates

Generate updated text for these key sections:

#### 1. System_Architecture_Document_PART1_Sections_1-8.md

**Executive Summary - Update:**
```markdown
# SYSTEM ARCHITECTURE DOCUMENT
## Bookit Booking System - Phase 1 MVP

**Project:** Bookit Booking System for UK Service Businesses  
**Plugin Name:** Bookit Booking System  
**WordPress Slug:** bookit-booking-system  
**Version:** 1.0.0  
**Status:** FINAL - Ready for Sprint 1
```

**Section 4.2 Plugin Structure - Update:**
```
bookit-booking-system/
├── bookit-booking-system.php  (main plugin file)
├── includes/
│   ├── class-bookit-activator.php
│   ├── class-bookit-deactivator.php
│   ├── class-bookit-database.php
│   └── class-bookit-loader.php
├── admin/
│   └── class-bookit-admin.php
├── public/
│   └── class-bookit-public.php
```

**Code Examples - Update All:**
```php
// OLD
function booking_create_booking($data) { ... }
class Booking_Activator { ... }

// NEW
function bookit_create_booking($data) { ... }
class Bookit_Activator { ... }
```

#### 2. Development_Implementation_Workflow.md

**Section 8.1 Project Directory Structure - Update:**
```
C:\Projects\bookit-booking-plugin\
  ├── docs\
  ├── plugin\  ← Git repository root
  │   ├── bookit-booking-system.php
  │   ├── includes\
  │   │   ├── class-bookit-booking.php
  │   │   ├── class-bookit-database.php
  │   └── ...
  └── local-wordpress\
```

**Section 9.3 Commit Message Format - Update Example:**
```bash
git commit -m "Sprint 1, Task 3: Staff selection UI complete

- Created staff selection view and component
- Implemented 'No Preference' option in Bookit_Staff_Selector
..."
```

#### 3. Final_Requirements_Package_v1_0.md

**Title Page - Update:**
```markdown
# FINAL REQUIREMENTS PACKAGE
## Bookit Booking System - Phase 1 MVP

**Project Name:** Bookit Booking System  
**WordPress Plugin:** bookit-booking-system  
**Version:** 1.0 (Phase 1 - Core Features)
```

**All References Throughout - Update:**
Every mention of "Booking System" → "Bookit Booking System"

#### 4. Development_Sequence_Plan.md

**Header - Update:**
```markdown
# DEVELOPMENT SEQUENCE PLAN
## Bookit Booking System - Phase 1 MVP

**Plugin:** Bookit Booking System  
**WordPress Slug:** bookit-booking-system  
```

**Sprint 0 Notes - Add:**
```markdown
### Sprint 0 Completion Notes

**Plugin Naming Decision:**
- Initial name: "Booking System" (Sprint 0 implementation)
- Renamed to: "Bookit Booking System" (before Sprint 1)
- Reason: "Booking System" too generic, likely taken in WP directory
- Slug: bookit-booking-system
- Function prefix: bookit_
- Class prefix: Bookit_
```

#### 5. All Requirements Documents

**Global Search-Replace Needed:**

| Document | Instances | Action |
|----------|-----------|--------|
| SRS_WordPress_Booking_Plugin_v1_0.md | ~50 | Find/replace "Booking System" → "Bookit Booking System" |
| TechnicalRequirements.md | ~30 | Same |
| BusinessOwner-AdminRequirements.md | ~20 | Same |
| CustomerJourney files (6 files) | ~40 | Same |
| MoSCoW_Prioritized_Requirements.md | ~15 | Same |
| All other docs | Varies | Same pattern |

---

### Generate Change Summary Document

Create this file to track all changes:

```markdown
# PROJECT KNOWLEDGE UPDATE: PLUGIN RENAME
## "Booking System" → "Bookit Booking System"

**Date:** [Today]  
**Updated By:** Liron  
**Reason:** Original name too generic, likely taken in WordPress.org

---

## Name Changes Summary

| Aspect | Old Value | New Value |
|--------|-----------|-----------|
| Display Name | Booking System | Bookit Booking System |
| Plugin Slug | booking-system | bookit-booking-system |
| Main File | booking-system.php | bookit-booking-system.php |
| Function Prefix | booking_ | bookit_ |
| Class Prefix | Booking_ | Bookit_ |
| Text Domain | booking-system | bookit-booking-system |
| Database Tables | wp_bookings_* | wp_bookings_* (UNCHANGED) |
| Directory Name | booking-system/ | bookit-booking-system/ |

**Note:** Database table names remain `wp_bookings_*` (not `wp_bookit_*`) because:
- Tables already created in Sprint 0
- Renaming tables is risky and unnecessary
- Table prefix doesn't need to match plugin name
- "bookings" is descriptive and appropriate

---

## Files Updated in Project Knowledge

### Architecture Documents (2 files)
- [x] System_Architecture_Document_PART1_Sections_1-8.md
- [x] System_Architecture_Document_PART2_Sections_9-19.md

### Requirements Documents (12 files)
- [x] Final_Requirements_Package_v1_0.md
- [x] SRS_WordPress_Booking_Plugin_v1_0.md
- [x] TechnicalRequirements.md
- [x] BusinessOwner-AdminRequirements.md
- [x] MoSCoW_Prioritized_Requirements.md
- [x] CustomerJourney-01-Discovery.md
- [x] CustomerJourney-02-StaffSelection.md
- [x] CustomerJourney-03-DateTimeSelectionPayment.md
- [x] CustomerJourney-04-Notifications_md.md
- [x] CustomerJourney-05-Cancellation.md
- [x] CustomerJourney-06-Rescheduling.md
- [x] Gap_Analysis_Report_WordPress_Booking_Plugin.md

### Planning Documents (8 files)
- [x] Development_Sequence_Plan.md
- [x] Development_Implementation_Workflow.md
- [x] Phase1_Scope_Final.md
- [x] Project_Phases_5-9_v1_0.md
- [x] Risk_Register_v1_0.md
- [x] Pricing_Model_Recommendation.md
- [x] Competitive_Feature_Comparison_Report.md
- [x] IntegrationRequirements_Phase1.md

### Project Context (5 files)
- [x] ProjectPlan.md
- [x] BusinessContext.md
- [x] TargetAudience.md
- [x] CompetitiveAnalysis.md
- [x] ScopeDefinition.md

**Total:** 27 files updated

---

## Search-Replace Statistics

- "Booking System" → "Bookit Booking System": ~250 instances
- "booking-system" → "bookit-booking-system": ~80 instances
- "booking_" → "bookit_": ~120 instances (in code examples)
- "Booking_" → "Bookit_": ~60 instances (in class examples)

---

## Verification Checklist

- [x] All documentation uses "Bookit Booking System"
- [x] No orphaned "Booking System" references
- [x] All file paths updated
- [x] All code examples updated
- [x] Function/class prefixes consistent
- [x] No broken internal links
- [x] Plugin slug consistent everywhere

---

## Next Steps

1. ✅ Upload updated project knowledge files
2. ⏭️ Refactor Sprint 0 codebase (use Cursor prompt)
3. ⏭️ Test plugin activation with new name
4. ⏭️ Update Git repository (rename directory if needed)
5. ⏭️ Proceed to Sprint 1 with new name
```

---

## PART 2: CODEBASE REFACTORING PROMPT

Generate this comprehensive Cursor prompt for Liron:

```markdown
# CURSOR REFACTORING PROMPT: RENAME PLUGIN TO BOOKIT BOOKING SYSTEM

**Paste this entire section into Cursor Composer (Ctrl+I)**

---

## OBJECTIVE

Systematically rename the WordPress plugin from "Booking System" to "Bookit Booking System" throughout the codebase.

**What Stays the Same:**
- Database table names (wp_bookings_*, wp_bookings_services, etc.)
- Overall architecture and functionality
- File directory structure (except plugin root folder name)

**What Changes:**
- Plugin display name
- Main plugin file name
- All function names (booking_ → bookit_)
- All class names (Booking_ → Bookit_)
- Text domain
- Plugin slug
- CSS/JS handle names

---

## RENAMING PATTERNS

### 1. Main Plugin File
**Current:** `booking-system.php`  
**New:** `bookit-booking-system.php`

**Action:** Rename file, update plugin header:
```php
/**
 * Plugin Name:       Bookit Booking System
 * Plugin URI:        https://example.com/bookit-booking-system
 * Description:       Professional booking system for UK service businesses
 * Version:           1.0.0
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPL v2 or later
 * Text Domain:       bookit-booking-system
 * Domain Path:       /languages
 */

// Update security check
if (!defined('ABSPATH')) {
    die('Direct access not permitted');
}

// Update constant definitions
define('BOOKIT_VERSION', '1.0.0');
define('BOOKIT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BOOKIT_PLUGIN_URL', plugin_dir_url(__FILE__));
```

### 2. Function Names
**Pattern:** `booking_*` → `bookit_*`

**Examples:**
```php
// OLD
function booking_activate() { ... }
function booking_deactivate() { ... }
function booking_create_tables() { ... }
function booking_create_booking($data) { ... }
function booking_get_availability($staff_id, $date) { ... }

// NEW
function bookit_activate() { ... }
function bookit_deactivate() { ... }
function bookit_create_tables() { ... }
function bookit_create_booking($data) { ... }
function bookit_get_availability($staff_id, $date) { ... }
```

**Action:** Find all functions starting with `booking_` and rename to `bookit_`

### 3. Class Names
**Pattern:** `Booking_*` → `Bookit_*`

**Examples:**
```php
// OLD
class Booking_Activator { ... }
class Booking_Deactivator { ... }
class Booking_Database { ... }
class Booking_Admin_Menu { ... }

// NEW
class Bookit_Activator { ... }
class Bookit_Deactivator { ... }
class Bookit_Database { ... }
class Bookit_Admin_Menu { ... }
```

**Action:** Find all classes starting with `Booking_` and rename to `Bookit_`

### 4. File Names
**Pattern:** `class-booking-*.php` → `class-bookit-*.php`

**Examples:**
```
includes/class-booking-activator.php → includes/class-bookit-activator.php
includes/class-booking-database.php → includes/class-bookit-database.php
admin/class-booking-admin.php → admin/class-bookit-admin.php
```

**Action:** Rename all files with `booking` in the name to `bookit`

### 5. Text Domain
**Find:** `'booking-system'` (in text domain context)  
**Replace:** `'bookit-booking-system'`

**Examples:**
```php
// OLD
__('Book Now', 'booking-system')
_e('Select Service', 'booking-system')

// NEW
__('Book Now', 'bookit-booking-system')
_e('Select Service', 'bookit-booking-system')
```

### 6. CSS/JS Handles
**Pattern:** `booking-*` → `bookit-*`

**Examples:**
```php
// OLD
wp_enqueue_style('booking-public', ...);
wp_enqueue_script('booking-wizard', ...);

// NEW
wp_enqueue_style('bookit-public', ...);
wp_enqueue_script('bookit-wizard', ...);
```

### 7. Option Names
**Pattern:** `booking_*` → `bookit_*`

**Examples:**
```php
// OLD
get_option('booking_stripe_key');
update_option('booking_settings', $settings);

// NEW
get_option('bookit_stripe_key');
update_option('bookit_settings', $settings);
```

### 8. Hook Names
**Pattern:** `booking_*` → `bookit_*`

**Examples:**
```php
// OLD
do_action('booking_after_save', $booking_id);
apply_filters('booking_available_slots', $slots, $date);

// NEW
do_action('bookit_after_save', $booking_id);
apply_filters('bookit_available_slots', $slots, $date);
```

### 9. Nonce Names
**Pattern:** `booking_*` → `bookit_*`

**Examples:**
```php
// OLD
wp_nonce_field('booking_save_service', 'booking_service_nonce');
check_ajax_referer('booking_create_booking', 'nonce');

// NEW
wp_nonce_field('bookit_save_service', 'bookit_service_nonce');
check_ajax_referer('bookit_create_booking', 'nonce');
```

### 10. Database Table References (DO NOT CHANGE)
**Keep as:** `wp_bookings_*`

**Examples:**
```php
// CORRECT - Keep these unchanged
$table_name = $wpdb->prefix . 'bookings';
$services_table = $wpdb->prefix . 'bookings_services';
$staff_table = $wpdb->prefix . 'bookings_staff';

// DO NOT change to wp_bookit_* 
// Tables are already created, renaming is unnecessary and risky
```

---

## SEARCH AND REPLACE CHECKLIST

Perform these searches in order:

### Step 1: Find All Instances
```
Search 1: "booking-system" (plugin slug in strings)
Search 2: booking_ (function prefix)
Search 3: Booking_ (class prefix)
Search 4: 'booking-system' (text domain)
```

### Step 2: Rename Files
```
✓ bookit-booking-system.php (main file)
✓ includes/class-bookit-*.php
✓ admin/class-bookit-*.php
✓ public/class-bookit-*.php
```

### Step 3: Update Plugin Header
```
✓ Plugin Name: Bookit Booking System
✓ Text Domain: bookit-booking-system
✓ Constants: BOOKIT_VERSION, BOOKIT_PLUGIN_DIR, etc.
```

### Step 4: Refactor Code
```
✓ All function names: booking_ → bookit_
✓ All class names: Booking_ → Bookit_
✓ All text domains: 'booking-system' → 'bookit-booking-system'
✓ All CSS/JS handles: booking-* → bookit-*
✓ All option names: booking_* → bookit_*
✓ All hook names: booking_* → bookit_*
```

### Step 5: Update Comments and Documentation
```
✓ File headers (class/function docblocks)
✓ Inline comments mentioning "Booking System"
✓ README.md
✓ composer.json (if plugin name mentioned)
```

---

## FILES TO UPDATE

Based on Sprint 0 structure, update these files:

### Core Files
- [ ] ~~booking-system.php~~ → bookit-booking-system.php
- [ ] includes/class-bookit-activator.php
- [ ] includes/class-bookit-deactivator.php
- [ ] includes/class-bookit-database.php
- [ ] includes/class-bookit-loader.php

### Admin Files
- [ ] admin/class-bookit-admin.php
- [ ] admin/class-bookit-admin-menu.php

### Public Files
- [ ] public/class-bookit-public.php

### Test Files
- [ ] tests/test-plugin-activation.php
- [ ] tests/bootstrap.php

### Configuration Files
- [ ] composer.json (if name referenced)
- [ ] package.json (if name referenced)
- [ ] README.md

---

## SPECIAL CASES

### Case 1: Activation/Deactivation Hooks
Update the register calls:
```php
// OLD
register_activation_hook(__FILE__, 'booking_activate');
register_deactivation_hook(__FILE__, 'booking_deactivate');

// NEW
register_activation_hook(__FILE__, 'bookit_activate');
register_deactivation_hook(__FILE__, 'bookit_deactivate');
```

### Case 2: Class Instantiation
Update all class instantiations:
```php
// OLD
$activator = new Booking_Activator();
$admin = new Booking_Admin();

// NEW
$activator = new Bookit_Activator();
$admin = new Bookit_Admin();
```

### Case 3: Autoloader (if present)
Update PSR-4 autoloader in composer.json:
```json
{
  "autoload": {
    "psr-4": {
      "Bookit\\": "includes/"
    }
  }
}
```

### Case 4: JavaScript Object Names
```javascript
// OLD
var bookingSystem = { ... };
const BOOKING_CONFIG = { ... };

// NEW
var bookitSystem = { ... };
const BOOKIT_CONFIG = { ... };
```

---

## TESTING AFTER REFACTORING

After completing the rename, test:

### 1. Plugin Activation
```
- [ ] Deactivate old "Booking System" plugin
- [ ] Delete old booking-system.php if still present
- [ ] Refresh plugins list in wp-admin
- [ ] Verify "Bookit Booking System" appears
- [ ] Activate "Bookit Booking System"
- [ ] Check for PHP errors (no errors = success)
```

### 2. Database Verification
```
- [ ] Open Adminer/phpMyAdmin
- [ ] Verify all 10 tables still exist (wp_bookings_*)
- [ ] Verify data is intact (if any test data existed)
- [ ] No duplicate tables created
```

### 3. Admin Menu
```
- [ ] WordPress admin menu shows "Bookit" or "Bookings"
- [ ] Submenu items load correctly
- [ ] No JavaScript console errors (F12)
```

### 4. PHPUnit Tests
```bash
# Run all tests
vendor/bin/phpunit

# Or in wp-env
wp-env run tests-cli vendor/bin/phpunit

# Expected: All tests pass
```

### 5. Git Status
```bash
git status
# Should show renamed files
# Should NOT show deleted + added (use git mv for proper rename)
```

---

## GIT COMMIT STRATEGY

**Option A: Single Commit (Recommended)**
```bash
# Use git mv for proper rename tracking
git mv booking-system.php bookit-booking-system.php
git mv includes/class-booking-*.php includes/class-bookit-*.php

# Stage all changes
git add -A

# Commit
git commit -m "Rename plugin: Booking System → Bookit Booking System

- Renamed main file: booking-system.php → bookit-booking-system.php
- Updated plugin header and constants
- Renamed all functions: booking_* → bookit_*
- Renamed all classes: Booking_* → Bookit_*
- Updated text domain: booking-system → bookit-booking-system
- Renamed all CSS/JS handles
- Updated all file names

Reason: 'Booking System' too generic for WordPress.org
Database tables unchanged (wp_bookings_* works fine)

Tests: All passing (vendor/bin/phpunit)"
```

**Option B: Separate Commits**
```bash
# Commit 1: Rename files
git mv booking-system.php bookit-booking-system.php
# ... rename other files
git commit -m "Rename plugin files: booking-* → bookit-*"

# Commit 2: Refactor code
# ... update function/class names
git commit -m "Refactor code: Update all function and class names"

# Commit 3: Update text domain
# ... update all translation strings
git commit -m "Update text domain: bookit-booking-system"
```

---

## END OF CURSOR PROMPT

**Instructions:**
1. Copy this entire section
2. Open Cursor in your plugin directory
3. Paste into Composer (Ctrl+I)
4. Review the changes Cursor makes
5. Run tests to verify
6. Commit to Git

---
```

---

## PART 3: TESTING CHECKLIST

After refactoring, verify everything works:

```markdown
# PLUGIN RENAME VERIFICATION CHECKLIST

## Pre-Refactoring Backup
- [ ] Git commit current state: `git commit -m "Before rename"`
- [ ] Backup database: `wp-env run cli wp db export pre-rename.sql`
- [ ] Note current plugin state (activated/deactivated)

## Post-Refactoring Tests

### WordPress Admin
- [ ] Deactivate old plugin (if still showing)
- [ ] Refresh plugins page (Ctrl+F5)
- [ ] "Bookit Booking System" appears in plugin list
- [ ] Plugin description updated
- [ ] Activate "Bookit Booking System"
- [ ] No PHP errors during activation
- [ ] Admin menu shows correctly

### Database Integrity
- [ ] All 10 tables still exist: wp_bookings, wp_bookings_services, etc.
- [ ] Table structure unchanged (check one table: DESCRIBE wp_bookings)
- [ ] Test data intact (if any existed)
- [ ] No duplicate tables created

### Functionality Tests
- [ ] Can access admin pages without errors
- [ ] Can view services page (if implemented)
- [ ] Can view staff page (if implemented)
- [ ] Can access settings page
- [ ] No JavaScript console errors (F12)

### Code Verification
- [ ] Search codebase for "booking_" (should find none except in comments/docs)
- [ ] Search codebase for "Booking_" (should find none except in comments/docs)
- [ ] Search for "booking-system" (should only be in old file references)
- [ ] All functions use bookit_ prefix
- [ ] All classes use Bookit_ prefix

### Unit Tests
```bash
# Run full test suite
vendor/bin/phpunit

# Or in wp-env
wp-env run tests-cli vendor/bin/phpunit

# Expected: All tests pass (green)
```

### Git Status
```bash
git status
# Should show:
# - Renamed files (not deleted + added)
# - Modified files with code changes
# - No untracked files (except intentional ones)
```

### Rollback Plan (If Issues)
```bash
# If refactoring has issues, rollback:
git reset --hard HEAD~1
# This restores to pre-rename state
```

## Sign-Off
- [ ] All checklist items above are ✅
- [ ] Plugin fully functional with new name
- [ ] Ready to commit rename
- [ ] Ready to proceed to Sprint 1

**Completed By:** [Liron]  
**Date:** [Date]  
**Time Spent:** [X hours]
```

---

## DELIVERABLES SUMMARY

When you complete this task, you will have:

### Part 1: Project Knowledge Updates
1. ✅ Updated 27+ documentation files
2. ✅ Change summary document created
3. ✅ Consistent naming throughout docs

### Part 2: Codebase Refactoring
1. ✅ Comprehensive Cursor prompt (paste-ready)
2. ✅ All functions renamed (booking_ → bookit_)
3. ✅ All classes renamed (Booking_ → Bookit_)
4. ✅ Main plugin file renamed
5. ✅ Text domain updated

### Part 3: Verification
1. ✅ Testing checklist completed
2. ✅ All tests passing
3. ✅ Git commit with changes

---

## INITIALIZATION INSTRUCTIONS

When Liron pastes this prompt, respond with:

```markdown
# PLUGIN RENAME ASSISTANT - INITIALIZED ✅

**Task:** Rename plugin from "Booking System" to "Bookit Booking System"  
**Reason:** Original name too generic, likely taken in WordPress.org  
**Scope:** Project knowledge (27 files) + Sprint 0 codebase

---

## Process Overview

I'll help you through this rename in 3 parts:

**Part 1: Project Knowledge Updates (30 min)**
- Generate updated text for 27 documentation files
- Create change summary document
- Provide search-replace patterns

**Part 2: Codebase Refactoring (30-60 min)**
- Generate comprehensive Cursor prompt
- Guide through systematic rename
- Verify all changes complete

**Part 3: Testing & Verification (15-30 min)**
- Test plugin activation with new name
- Run PHPUnit tests
- Create Git commit

**Total Time:** 1-2 hours

---

## Let's Begin: Part 1 - Project Knowledge

I'll now search project knowledge for the 27 files that need updating.

For each file, I'll generate:
1. Specific sections to update
2. Search-replace patterns
3. Updated text to use

**Ready to generate the project knowledge updates?**

Type "Yes" or "Generate updates" to begin.
```

---

## USAGE NOTES FOR LIRON

### How to Use This Prompt:

1. **Save this file:** `Task_B_Rename_Plugin_Bookit.md`

2. **Open NEW Claude chat**

3. **Paste entire prompt**

4. **Follow 3-part process:**
   - Part 1: Review documentation updates
   - Part 2: Use Cursor prompt to refactor code
   - Part 3: Test and verify

5. **Update actual files** (project knowledge + code)

6. **Commit to Git** when complete

---

## IMPORTANT NOTES

### Database Tables
**DO NOT rename database tables.** Keep them as `wp_bookings_*`:
- Tables already exist from Sprint 0
- Renaming tables is risky and unnecessary
- Table prefix doesn't need to match plugin name
- "bookings" is perfectly descriptive

### Git Workflow
Use `git mv` for file renames (not delete + create):
```bash
git mv booking-system.php bookit-booking-system.php
```
This preserves file history.

### Testing is Critical
Don't skip the testing checklist. Verify:
- Plugin activates
- No PHP errors
- Database intact
- Tests passing

---

**END OF TASK B PROMPT**

This prompt will guide you through both documentation and code refactoring systematically.
