Excellent! 🎉 Let's continue with Tasks 5-8:

---

# TASK 5: ADMIN MENU STRUCTURE

## Goal
Create the WordPress admin menu structure for the plugin with main menu and submenus for Bookings, Services, Staff, Customers, and Settings.

## Prerequisites
- Task 1: Plugin Boilerplate must be complete
- Task 2-3: Database Schema must be complete
- Task 4: Authentication Framework must be complete

## Estimated Time
4 hours

## Files to Create/Modify
- `admin/class-booking-admin-menu.php` (new - admin menu class)
- `admin/pages/bookings.php` (new - bookings page)
- `admin/pages/services.php` (new - services page)
- `admin/pages/staff.php` (new - staff page)
- `admin/pages/customers.php` (new - customers page)
- `admin/pages/settings.php` (new - settings page)
- `includes/class-booking-loader.php` (modify - register admin menu hooks)

---

## IMPLEMENTATION PROMPT FOR CURSOR

**Paste this entire section into Cursor Composer (Ctrl+I):**

---

Create the WordPress admin menu structure for the Booking System plugin. This provides the WordPress admin interface (separate from the dashboard for business owners - that's Sprint 4).

**Reference:** System Architecture Document Part 1, Section 4 for menu structure.

**Menu Structure:**

```
Booking System (main menu - icon: calendar)
├── Bookings
│   ├── Calendar View (submenu)
│   ├── List View (submenu)
│   └── Add New (submenu)
├── Services
│   ├── All Services (submenu)
│   ├── Categories (submenu)
│   └── Add New (submenu)
├── Staff
│   ├── All Staff (submenu)
│   └── Add New (submenu)
├── Customers
│   ├── All Customers (submenu)
│   └── Export (submenu)
└── Settings
    ├── General (submenu)
    ├── Payment (submenu)
    ├── Email (submenu)
    └── Calendar (submenu)
```

**Important Notes:**

1. **This is WordPress admin only** - for site administrators
2. **Pages are placeholder stubs** - actual functionality in Sprints 1-3
3. **Just creates menu structure** - no data display yet
4. **Capability checks** - only administrators can access
5. **Dashicons** - uses WordPress dashicons for icons

---

### File 1: admin/class-booking-admin-menu.php

```php
<?php
/**
 * Admin menu structure.
 *
 * @package    Booking_System
 * @subpackage Booking_System/admin
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Admin menu class.
 */
class Booking_Admin_Menu {

	/**
	 * Register admin menu.
	 */
	public function register_menu() {
		// Main menu page
		add_menu_page(
			__( 'Booking System', 'booking-system' ),           // Page title
			__( 'Booking System', 'booking-system' ),           // Menu title
			'manage_options',                                   // Capability
			'booking-system',                                   // Menu slug
			array( $this, 'render_bookings_page' ),            // Callback
			'dashicons-calendar-alt',                          // Icon
			30                                                  // Position
		);

		// Bookings submenu
		add_submenu_page(
			'booking-system',
			__( 'Bookings', 'booking-system' ),
			__( 'Bookings', 'booking-system' ),
			'manage_options',
			'booking-system',
			array( $this, 'render_bookings_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Calendar View', 'booking-system' ),
			__( 'Calendar View', 'booking-system' ),
			'manage_options',
			'booking-calendar',
			array( $this, 'render_calendar_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Add New Booking', 'booking-system' ),
			__( 'Add New', 'booking-system' ),
			'manage_options',
			'booking-add-new',
			array( $this, 'render_add_booking_page' )
		);

		// Services submenu
		add_submenu_page(
			'booking-system',
			__( 'Services', 'booking-system' ),
			__( 'Services', 'booking-system' ),
			'manage_options',
			'booking-services',
			array( $this, 'render_services_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Service Categories', 'booking-system' ),
			__( 'Categories', 'booking-system' ),
			'manage_options',
			'booking-service-categories',
			array( $this, 'render_categories_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Add New Service', 'booking-system' ),
			__( 'Add New', 'booking-system' ),
			'manage_options',
			'booking-add-service',
			array( $this, 'render_add_service_page' )
		);

		// Staff submenu
		add_submenu_page(
			'booking-system',
			__( 'Staff', 'booking-system' ),
			__( 'Staff', 'booking-system' ),
			'manage_options',
			'booking-staff',
			array( $this, 'render_staff_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Add New Staff', 'booking-system' ),
			__( 'Add New', 'booking-system' ),
			'manage_options',
			'booking-add-staff',
			array( $this, 'render_add_staff_page' )
		);

		// Customers submenu
		add_submenu_page(
			'booking-system',
			__( 'Customers', 'booking-system' ),
			__( 'Customers', 'booking-system' ),
			'manage_options',
			'booking-customers',
			array( $this, 'render_customers_page' )
		);

		add_submenu_page(
			'booking-system',
			__( 'Export Customers', 'booking-system' ),
			__( 'Export', 'booking-system' ),
			'manage_options',
			'booking-export-customers',
			array( $this, 'render_export_page' )
		);

		// Settings submenu
		add_submenu_page(
			'booking-system',
			__( 'Settings', 'booking-system' ),
			__( 'Settings', 'booking-system' ),
			'manage_options',
			'booking-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Render bookings page.
	 */
	public function render_bookings_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/bookings.php';
	}

	/**
	 * Render calendar page.
	 */
	public function render_calendar_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/calendar.php';
	}

	/**
	 * Render add booking page.
	 */
	public function render_add_booking_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/add-booking.php';
	}

	/**
	 * Render services page.
	 */
	public function render_services_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/services.php';
	}

	/**
	 * Render categories page.
	 */
	public function render_categories_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/categories.php';
	}

	/**
	 * Render add service page.
	 */
	public function render_add_service_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/add-service.php';
	}

	/**
	 * Render staff page.
	 */
	public function render_staff_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/staff.php';
	}

	/**
	 * Render add staff page.
	 */
	public function render_add_staff_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/add-staff.php';
	}

	/**
	 * Render customers page.
	 */
	public function render_customers_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/customers.php';
	}

	/**
	 * Render export page.
	 */
	public function render_export_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/export.php';
	}

	/**
	 * Render settings page.
	 */
	public function render_settings_page() {
		require_once BOOKING_SYSTEM_PATH . 'admin/pages/settings.php';
	}
}
```

---

### File 2: admin/pages/bookings.php

```php
<?php
/**
 * Bookings list page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'Bookings', 'booking-system' ); ?></h1>
	<a href="<?php echo esc_url( admin_url( 'admin.php?page=booking-add-new' ) ); ?>" class="page-title-action">
		<?php esc_html_e( 'Add New', 'booking-system' ); ?>
	</a>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'This is a placeholder page. Booking management functionality will be implemented in Sprint 1-2.', 'booking-system' ); ?>
		</p>
		<p>
			<?php esc_html_e( 'Expected features:', 'booking-system' ); ?>
		</p>
		<ul>
			<li><?php esc_html_e( 'View all bookings in table format', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Filter by date, status, staff, customer', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Quick actions: Confirm, Cancel, Edit', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Bulk actions for multiple bookings', 'booking-system' ); ?></li>
		</ul>
	</div>

	<div class="booking-placeholder-content">
		<h2><?php esc_html_e( 'Recent Bookings', 'booking-system' ); ?></h2>
		<p><?php esc_html_e( 'No bookings yet. Booking list will appear here.', 'booking-system' ); ?></p>
	</div>
</div>
```

---

### File 3: admin/pages/calendar.php

```php
<?php
/**
 * Calendar view page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Calendar View', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Calendar view will be implemented in Sprint 2. This will show bookings in a visual calendar interface.', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 4: admin/pages/add-booking.php

```php
<?php
/**
 * Add new booking page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Add New Booking', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Add booking form will be implemented in Sprint 2.', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 5: admin/pages/services.php

```php
<?php
/**
 * Services list page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'Services', 'booking-system' ); ?></h1>
	<a href="<?php echo esc_url( admin_url( 'admin.php?page=booking-add-service' ) ); ?>" class="page-title-action">
		<?php esc_html_e( 'Add New', 'booking-system' ); ?>
	</a>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Service management will be implemented in Sprint 1.', 'booking-system' ); ?>
		</p>
		<p>
			<?php esc_html_e( 'Expected features:', 'booking-system' ); ?>
		</p>
		<ul>
			<li><?php esc_html_e( 'List all services with name, duration, price', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Add/Edit/Delete services', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Assign services to categories', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Set deposit requirements', 'booking-system' ); ?></li>
		</ul>
	</div>
</div>
```

---

### File 6: admin/pages/categories.php

```php
<?php
/**
 * Service categories page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Service Categories', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Category management will be implemented in Sprint 1.', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 7: admin/pages/add-service.php

```php
<?php
/**
 * Add new service page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Add New Service', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Add service form will be implemented in Sprint 1.', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 8: admin/pages/staff.php

```php
<?php
/**
 * Staff list page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'Staff', 'booking-system' ); ?></h1>
	<a href="<?php echo esc_url( admin_url( 'admin.php?page=booking-add-staff' ) ); ?>" class="page-title-action">
		<?php esc_html_e( 'Add New', 'booking-system' ); ?>
	</a>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Staff management will be implemented in Sprint 1.', 'booking-system' ); ?>
		</p>
		<p>
			<?php esc_html_e( 'Expected features:', 'booking-system' ); ?>
		</p>
		<ul>
			<li><?php esc_html_e( 'List all staff members', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Add/Edit/Delete staff', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Assign services to staff', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Set working hours', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Google Calendar integration', 'booking-system' ); ?></li>
		</ul>
	</div>
</div>
```

---

### File 9: admin/pages/add-staff.php

```php
<?php
/**
 * Add new staff page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Add New Staff', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Add staff form will be implemented in Sprint 1.', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 10: admin/pages/customers.php

```php
<?php
/**
 * Customers list page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1 class="wp-heading-inline"><?php esc_html_e( 'Customers', 'booking-system' ); ?></h1>
	<a href="<?php echo esc_url( admin_url( 'admin.php?page=booking-export-customers' ) ); ?>" class="page-title-action">
		<?php esc_html_e( 'Export', 'booking-system' ); ?>
	</a>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Customer management will be implemented in Sprint 2.', 'booking-system' ); ?>
		</p>
		<p>
			<?php esc_html_e( 'Expected features:', 'booking-system' ); ?>
		</p>
		<ul>
			<li><?php esc_html_e( 'List all customers with contact details', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'View customer booking history', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'GDPR-compliant data export', 'booking-system' ); ?></li>
			<li><?php esc_html_e( 'Marketing consent tracking', 'booking-system' ); ?></li>
		</ul>
	</div>
</div>
```

---

### File 11: admin/pages/export.php

```php
<?php
/**
 * Export customers page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Export Customers', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Customer export functionality will be implemented in Sprint 2 (GDPR compliance).', 'booking-system' ); ?>
		</p>
	</div>
</div>
```

---

### File 12: admin/pages/settings.php

```php
<?php
/**
 * Settings page (WordPress admin).
 *
 * @package Booking_System
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Check user capabilities
if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'booking-system' ) );
}
?>

<div class="wrap">
	<h1><?php esc_html_e( 'Booking System Settings', 'booking-system' ); ?></h1>
	<hr class="wp-header-end">

	<div class="booking-admin-notice notice notice-info">
		<p>
			<strong><?php esc_html_e( 'Sprint 0: Foundation Phase', 'booking-system' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Settings pages will be implemented across Sprints 1-3.', 'booking-system' ); ?>
		</p>
		<p>
			<?php esc_html_e( 'Expected settings tabs:', 'booking-system' ); ?>
		</p>
		<ul>
			<li><strong><?php esc_html_e( 'General:', 'booking-system' ); ?></strong> <?php esc_html_e( 'Business name, timezone, date/time formats, booking rules', 'booking-system' ); ?></li>
			<li><strong><?php esc_html_e( 'Payment:', 'booking-system' ); ?></strong> <?php esc_html_e( 'Stripe/PayPal API keys, deposit settings, refund policy', 'booking-system' ); ?></li>
			<li><strong><?php esc_html_e( 'Email:', 'booking-system' ); ?></strong> <?php esc_html_e( 'SMTP configuration, email templates, notification settings', 'booking-system' ); ?></li>
			<li><strong><?php esc_html_e( 'Calendar:', 'booking-system' ); ?></strong> <?php esc_html_e( 'Google Calendar sync, working hours, holidays', 'booking-system' ); ?></li>
		</ul>
	</div>

	<h2><?php esc_html_e( 'Current Settings (from activation):', 'booking-system' ); ?></h2>
	<?php
	$settings = get_option( 'booking_system_settings', array() );
	if ( ! empty( $settings ) ) {
		echo '<pre>';
		print_r( $settings );
		echo '</pre>';
	} else {
		echo '<p>' . esc_html__( 'No settings found.', 'booking-system' ) . '</p>';
	}
	?>
</div>
```

---

### File 13: Modify includes/class-booking-loader.php

Add admin menu registration. In the `define_admin_hooks()` method:

```php
/**
 * Register all hooks related to the admin area functionality.
 */
private function define_admin_hooks() {
	$plugin_admin = new Booking_Admin( $this->get_plugin_name(), $this->get_version() );

	// Load admin menu class
	require_once BOOKING_SYSTEM_PATH . 'admin/class-booking-admin-menu.php';
	$admin_menu = new Booking_Admin_Menu();

	// Register admin menu
	add_action( 'admin_menu', array( $admin_menu, 'register_menu' ) );
}
```

---

**Important Implementation Notes:**

1. **All pages are placeholders** - They display "Sprint 0: Foundation Phase" notices
2. **Capability checks** - Only administrators (manage_options) can access
3. **WordPress standards** - Uses WordPress admin UI conventions
4. **Internationalization** - All strings wrapped in `__()` for translation
5. **Security** - All output escaped with `esc_html()`, `esc_url()`, etc.

**Expected Behavior:**
- "Booking System" menu appears in WordPress admin sidebar
- Calendar icon (dashicons-calendar-alt)
- All submenu items clickable and functional
- Each page shows placeholder notice
- Professional WordPress admin styling
- No errors

**Follow WordPress Coding Standards:**
- Use `current_user_can()` for capability checks
- Escape all output
- Use WordPress translation functions
- Consistent naming conventions

---

**[End of Cursor prompt - copy up to this line]**

---

## TESTING CHECKLIST

### Automated Tests (PHPUnit)
- [ ] Test 1: Admin menu registration (will be added in Task 7)

### Manual Tests

**File Creation Verification:**

1. [ ] Verify all files created:
   - [ ] `admin/class-booking-admin-menu.php`
   - [ ] `admin/pages/bookings.php`
   - [ ] `admin/pages/calendar.php`
   - [ ] `admin/pages/add-booking.php`
   - [ ] `admin/pages/services.php`
   - [ ] `admin/pages/categories.php`
   - [ ] `admin/pages/add-service.php`
   - [ ] `admin/pages/staff.php`
   - [ ] `admin/pages/add-staff.php`
   - [ ] `admin/pages/customers.php`
   - [ ] `admin/pages/export.php`
   - [ ] `admin/pages/settings.php`
   - [ ] `includes/class-booking-loader.php` modified

**WordPress Admin Menu Test:**

1. [ ] Login to WordPress admin: `http://localhost:10000/wp-admin/`
2. [ ] Look in left sidebar for "Booking System" menu
3. [ ] Verify:
   - [ ] Menu appears with calendar icon
   - [ ] Menu is positioned below "Settings" (position 30)
   - [ ] Menu is visible (not hidden)

**Main Menu Click Test:**

1. [ ] Click "Booking System" in sidebar
2. [ ] Should load bookings page
3. [ ] Should show:
   - [ ] "Bookings" heading
   - [ ] "Add New" button
   - [ ] Blue info notice "Sprint 0: Foundation Phase"
   - [ ] List of expected features

**Submenu Structure Test:**

1. [ ] Hover over "Booking System" menu
2. [ ] Verify submenu items appear:
   - [ ] Bookings (main link - same as parent)
   - [ ] Calendar View
   - [ ] Add New (under Bookings section)
   - [ ] Services
   - [ ] Categories
   - [ ] Add New (under Services section)
   - [ ] Staff
   - [ ] Add New (under Staff section)
   - [ ] Customers
   - [ ] Export
   - [ ] Settings

**Bookings Submenu Tests:**

1. [ ] Click "Bookings" → Loads bookings.php
2. [ ] Click "Calendar View" → Loads calendar.php with placeholder
3. [ ] Click "Add New" (under Bookings) → Loads add-booking.php with placeholder
4. [ ] All pages show "Sprint 0: Foundation Phase" notice

**Services Submenu Tests:**

1. [ ] Click "Services" → Loads services.php
2. [ ] Should see "Add New" button linking to add-service page
3. [ ] Click "Categories" → Loads categories.php
4. [ ] Click "Add New" (under Services) → Loads add-service.php
5. [ ] All pages show placeholder notices

**Staff Submenu Tests:**

1. [ ] Click "Staff" → Loads staff.php
2. [ ] Should see "Add New" button
3. [ ] Click "Add New" (under Staff) → Loads add-staff.php
4. [ ] All pages show placeholder notices

**Customers Submenu Tests:**

1. [ ] Click "Customers" → Loads customers.php
2. [ ] Should see "Export" button in header
3. [ ] Click "Export" → Loads export.php
4. [ ] All pages show placeholder notices

**Settings Page Test:**

1. [ ] Click "Settings" → Loads settings.php
2. [ ] Should show:
   - [ ] "Booking System Settings" heading
   - [ ] Placeholder notice with expected tabs
   - [ ] "Current Settings" section
   - [ ] Array output showing default settings from activation
3. [ ] Verify settings array contains:
   - timezone: Europe/London
   - currency: GBP
   - date_format: d/m/Y
   - time_format: H:i

**Capability Check Test:**

1. [ ] Create a test subscriber user (wp-admin > Users > Add New)
   - Username: testsubscriber
   - Role: Subscriber
2. [ ] Logout from admin
3. [ ] Login as testsubscriber
4. [ ] Verify "Booking System" menu does NOT appear (subscribers can't manage_options)
5. [ ] Try to access directly: `/wp-admin/admin.php?page=booking-system`
6. [ ] Should see: "You do not have sufficient permissions"
7. [ ] Logout and login as admin again

**Link Navigation Test:**

1. [ ] On bookings page, click "Add New" button → Goes to add-booking page
2. [ ] On services page, click "Add New" button → Goes to add-service page
3. [ ] On staff page, click "Add New" button → Goes to add-staff page
4. [ ] On customers page, click "Export" button → Goes to export page
5. [ ] All navigation should work without 404 errors

**WordPress Admin Styling Test:**

1. [ ] Check pages use standard WordPress admin styles:
   - [ ] `.wrap` container
   - [ ] `.wp-heading-inline` for page titles
   - [ ] `.page-title-action` for buttons
   - [ ] `.notice` for info boxes
   - [ ] Horizontal rule after title
2. [ ] Pages should look like native WordPress admin pages

**PHP Error Check:**

1. [ ] Check `wp-content/debug.log`
2. [ ] Should have NO PHP errors or warnings
3. [ ] No "undefined function" errors
4. [ ] No "file not found" errors

**Browser Console Check:**

1. [ ] Open browser DevTools (F12)
2. [ ] Navigate through all menu pages
3. [ ] Console tab should show NO JavaScript errors

### Edge Cases

- [ ] Edge case 1: Direct URL access
  - Navigate to: `/wp-admin/admin.php?page=booking-services`
  - Should load services page correctly
- [ ] Edge case 2: Invalid page slug
  - Navigate to: `/wp-admin/admin.php?page=booking-invalid`
  - Should show WordPress 404 or redirect
- [ ] Edge case 3: Menu order
  - Check menu appears after "Settings" (position 30)
  - Should not conflict with other plugins

### Acceptance Criteria

- [ ] Criterion 1: "Booking System" menu appears in WordPress admin sidebar
- [ ] Criterion 2: Menu uses calendar icon (dashicons-calendar-alt)
- [ ] Criterion 3: All 12 submenu items present and functional
- [ ] Criterion 4: Each page loads without errors
- [ ] Criterion 5: Each page shows "Sprint 0: Foundation Phase" notice
- [ ] Criterion 6: Only administrators can access (capability check works)
- [ ] Criterion 7: Navigation between pages works correctly
- [ ] Criterion 8: Settings page shows current plugin settings
- [ ] Criterion 9: All strings are internationalized (wrapped in `__()`)
- [ ] Criterion 10: No PHP errors in debug.log

**Definition of Done:**
ALL checkboxes above must be ✅ before marking task complete.

---

## GIT COMMIT

After all tests pass, commit your work:

```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

git add .
git commit -m "Sprint 0, Task 5: Admin menu structure complete

- Created admin menu class (Booking_Admin_Menu):
  - Main menu: Booking System with calendar icon
  - Position 30 (after Settings)
  - Capability: manage_options (administrators only)
- Created submenu structure:
  - Bookings: List, Calendar, Add New
  - Services: All Services, Categories, Add New
  - Staff: All Staff, Add New
  - Customers: All Customers, Export
  - Settings: Placeholder for future tabs
- Created 12 placeholder admin pages:
  - All show 'Sprint 0: Foundation Phase' notices
  - Professional WordPress admin styling
  - Capability checks on all pages
  - Internationalized strings
- Registered menu in class-booking-loader.php
- Settings page displays current plugin configuration

Tests: Manual verification passing (all menu items functional)"
```

---

## COMMON ISSUES

### Issue 1: Menu doesn't appear in sidebar
**Symptoms:** No "Booking System" menu visible
**Solution:**
- Check that `add_action( 'admin_menu', ... )` is registered
- Verify admin menu class is loaded in class-booking-loader.php
- Try clearing WordPress cache
- Check capability - must be logged in as administrator
- Deactivate/reactivate plugin

### Issue 2: "Page not found" when clicking menu items
**Symptoms:** Submenu items show 404 error
**Solution:**
- Verify all page files exist in `admin/pages/` directory
- Check file paths in callback functions match actual files
- Make sure BOOKING_SYSTEM_PATH constant is defined
- Check for typos in page slugs

### Issue 3: Submenu items appear outside main menu
**Symptoms:** Submenu items scattered, not grouped under "Booking System"
**Solution:**
- First parameter of `add_submenu_page()` must match main menu slug
- Main menu slug: `booking-system`
- All submenus should have `'booking-system'` as first parameter

### Issue 4: Settings array not showing
**Symptoms:** Settings page says "No settings found"
**Solution:**
- Settings are created during activation
- Deactivate and reactivate plugin
- Or manually insert in database:
  ```sql
  SELECT * FROM wp_options WHERE option_name = 'booking_system_settings';
  ```
- If missing, rerun activation

### Issue 5: Permission error even as administrator
**Symptoms:** "You do not have sufficient permissions" message
**Solution:**
- Verify user role is Administrator (not Editor/Author)
- Check in Users > Your Profile > Role
- If in doubt, create fresh admin user
- Try different browser (clear cookies)

### Issue 6: Menu appears twice
**Symptoms:** Duplicate "Booking System" menus
**Solution:**
- Check `add_action( 'admin_menu', ... )` only called once
- Look for duplicate code in class-booking-loader.php
- Clear WordPress object cache if using caching plugin

### Issue 7: Styling looks broken
**Symptoms:** Pages don't look like WordPress admin
**Solution:**
- Check page files use `.wrap` class
- Verify WordPress admin styles are loading
- Check for CSS conflicts from theme
- Disable all other plugins temporarily to test

---

## TASK COMPLETION

When Liron reports "Task 5 complete", confirm:
- [ ] Menu appears in WordPress admin?
- [ ] All 12 submenu items functional?
- [ ] All pages load without errors?
- [ ] Capability checks working (subscribers can't access)?
- [ ] Settings page shows configuration?
- [ ] No PHP errors?
- [ ] Code committed to Git?

If all ✅, respond: "Task 5 complete ✅. Admin menu structure operational. Ready for Task 6: Error Logging System?"

---

**Progress Check:**
- ✅ Task 1: Plugin Boilerplate (8h)
- ✅ Task 2: Database Schema Part 1 (8h)
- ✅ Task 3: Database Schema Part 2 (8h)
- ✅ Task 4: Authentication Framework (8h)
- ✅ Task 5: Admin Menu Structure (4h)
- **Total so far: 36/52 hours (69% of Sprint 0)**

Excellent progress! Ready to continue with Task 6 (Error Logging) when you are! 🚀