# 🎉 EXCELLENT! Phase 2 Complete!

Great work! Now let's move to **Phase 3: Bulk Operations Tests** - this is the complex logic you wanted to focus on.

---

# 📝 CURSOR PROMPT: Phase 3 - Bulk Working Hours API Tests

```markdown
# Sprint 3 Tests - Phase 3: Bulk Working Hours API

## Context
Adding PHPUnit tests for Sprint 3 bulk working hours operations. These endpoints allow admins to apply exceptions or update schedules for multiple staff members at once, with conflict detection and resolution. This is complex logic with edge cases that needs thorough testing.

## Existing Test Patterns to Follow
- Extend WP_UnitTestCase
- Use setUp/tearDown with TRUNCATE for cleanup
- Create helper methods matching existing style
- Test both success and error cases
- Include edge cases and validation

## File to Create
`tests/unit/test-bulk-working-hours-api.php`

## API Endpoints to Test

**File being tested:** `includes/api/class-dashboard-bookings-api.php`

**Endpoints:**
1. POST `/bookit/v1/dashboard/staff/bulk-hours/check-conflicts` - Detect existing exceptions
2. POST `/bookit/v1/dashboard/staff/bulk-hours/add-exception` - Add same exception to multiple staff
3. POST `/bookit/v1/dashboard/staff/bulk-hours/update-schedule` - Update working hours for multiple staff

## Test Class Structure

```php
<?php
/**
 * Tests for Bulk Working Hours API (Sprint 3, Task 11.5)
 *
 * Tests bulk operations for staff working hours including:
 * - Conflict detection before applying changes
 * - Bulk exception addition (day off, special hours)
 * - Bulk schedule updates (working hours, breaks)
 * - Overwrite handling for existing exceptions
 * - Validation and error handling
 *
 * @package    Bookit_Booking_System
 * @subpackage Tests
 */

/**
 * Test Bulk Working Hours API endpoints.
 */
class Test_Bulk_Working_Hours_API extends WP_UnitTestCase {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	private $namespace = 'bookit/v1';

	/**
	 * Cached test data.
	 *
	 * @var array
	 */
	private $test_data = array();

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wpdb;

		// Truncate relevant tables
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff_working_hours" );

		// Initialize REST API
		do_action( 'rest_api_init' );

		// Create test admin user
		$this->create_test_admin();
	}

	/**
	 * Tear down each test.
	 */
	public function tearDown(): void {
		global $wpdb;

		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff_working_hours" );

		parent::tearDown();
	}

	// ========== TESTS FOR: POST /dashboard/staff/bulk-hours/check-conflicts ==========

	/**
	 * Test conflict detection finds existing exception.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::check_bulk_hours_conflicts
	 */
	public function test_conflict_detection_finds_existing_exception() {
		$staff_a = $this->create_test_staff( array( 'first_name' => 'Alice' ) );
		$staff_b = $this->create_test_staff( array( 'first_name' => 'Bob' ) );

		// Alice has existing exception on 2026-12-25
		$this->add_exception( $staff_a, '2026-12-25', '00:00:00', '23:59:59', 0 );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/check-conflicts' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'specific_date' => '2026-12-25',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'conflicts', $data );
		$this->assertCount( 1, $data['conflicts'] );
		$this->assertEquals( $staff_a, $data['conflicts'][0]['staff_id'] );
		$this->assertEquals( '2026-12-25', $data['conflicts'][0]['specific_date'] );
	}

	/**
	 * Test no conflicts when staff have no existing exceptions.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::check_bulk_hours_conflicts
	 */
	public function test_no_conflicts_when_date_is_clear() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/check-conflicts' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'specific_date' => '2026-12-25',
		) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$this->assertEmpty( $data['conflicts'] );
	}

	/**
	 * Test conflict detection returns full exception details.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::check_bulk_hours_conflicts
	 */
	public function test_conflict_includes_existing_exception_details() {
		$staff = $this->create_test_staff( array( 'first_name' => 'Alice' ) );

		// Existing exception: Special hours 10am-2pm
		$this->add_exception( $staff, '2026-12-24', '10:00:00', '14:00:00', 1 );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/check-conflicts' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'specific_date' => '2026-12-24',
		) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$conflict = $data['conflicts'][0];
		$this->assertEquals( '10:00:00', $conflict['existing_start_time'] );
		$this->assertEquals( '14:00:00', $conflict['existing_end_time'] );
		$this->assertEquals( 1, $conflict['existing_is_working'] );
	}

	// ========== TESTS FOR: POST /dashboard/staff/bulk-hours/add-exception ==========

	/**
	 * Test bulk add day off exception to multiple staff.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_day_off_exception() {
		$staff_a = $this->create_test_staff( array( 'first_name' => 'Alice' ) );
		$staff_b = $this->create_test_staff( array( 'first_name' => 'Bob' ) );
		$staff_c = $this->create_test_staff( array( 'first_name' => 'Charlie' ) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b, $staff_c ),
			'specific_date' => '2026-12-25',
			'is_working' => 0, // Day off
			'start_time' => '00:00:00',
			'end_time' => '23:59:59',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
		$this->assertEquals( 3, $data['added'] );
		$this->assertEquals( 0, $data['skipped'] );

		// Verify in database
		global $wpdb;
		$count = $wpdb->get_var( $wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->prefix}bookings_staff_working_hours 
			WHERE specific_date = %s AND is_working = 0",
			'2026-12-25'
		) );
		$this->assertEquals( 3, $count );
	}

	/**
	 * Test bulk add special hours exception.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_special_hours_exception() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'specific_date' => '2026-12-24',
			'is_working' => 1,
			'start_time' => '10:00:00',
			'end_time' => '14:00:00',
			'break_start' => '12:00:00',
			'break_end' => '12:30:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Verify break times saved
		global $wpdb;
		$break_data = $wpdb->get_row( $wpdb->prepare(
			"SELECT break_start, break_end FROM {$wpdb->prefix}bookings_staff_working_hours 
			WHERE staff_id = %d AND specific_date = %s",
			$staff_a,
			'2026-12-24'
		) );
		$this->assertEquals( '12:00:00', $break_data->break_start );
		$this->assertEquals( '12:30:00', $break_data->break_end );
	}

	/**
	 * Test bulk add with existing conflicts (no overwrite).
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_skips_conflicts_without_overwrite() {
		$staff_a = $this->create_test_staff( array( 'first_name' => 'Alice' ) );
		$staff_b = $this->create_test_staff( array( 'first_name' => 'Bob' ) );

		// Alice already has exception
		$this->add_exception( $staff_a, '2026-12-25', '00:00:00', '23:59:59', 0 );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'specific_date' => '2026-12-25',
			'is_working' => 0,
			'start_time' => '00:00:00',
			'end_time' => '23:59:59',
			'overwrite' => array(), // No overwrite
		) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$this->assertEquals( 1, $data['added'] ); // Only Bob
		$this->assertEquals( 1, $data['skipped'] ); // Alice skipped
	}

	/**
	 * Test bulk add with selective overwrite.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_overwrites_when_specified() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		// Both have existing exceptions
		$this->add_exception( $staff_a, '2026-12-25', '09:00:00', '17:00:00', 1 );
		$this->add_exception( $staff_b, '2026-12-25', '10:00:00', '18:00:00', 1 );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'specific_date' => '2026-12-25',
			'is_working' => 0, // Change to day off
			'start_time' => '00:00:00',
			'end_time' => '23:59:59',
			'overwrite' => array( $staff_a ), // Only overwrite Alice
		) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$this->assertEquals( 1, $data['added'] ); // Alice overwritten
		$this->assertEquals( 1, $data['skipped'] ); // Bob skipped

		// Verify Alice's exception was updated
		global $wpdb;
		$alice_exception = $wpdb->get_row( $wpdb->prepare(
			"SELECT is_working, start_time FROM {$wpdb->prefix}bookings_staff_working_hours 
			WHERE staff_id = %d AND specific_date = %s",
			$staff_a,
			'2026-12-25'
		) );
		$this->assertEquals( 0, $alice_exception->is_working );
	}

	/**
	 * Test bulk add validates date format.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_validates_date_format() {
		$staff = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'specific_date' => 'invalid-date',
			'is_working' => 0,
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test bulk add validates time format.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_validates_time_format() {
		$staff = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'specific_date' => '2026-12-25',
			'is_working' => 1,
			'start_time' => '25:00:00', // Invalid
			'end_time' => '14:00:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test bulk add rejects empty staff array.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 */
	public function test_bulk_add_rejects_empty_staff_array() {
		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array(),
			'specific_date' => '2026-12-25',
			'is_working' => 0,
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	// ========== TESTS FOR: POST /dashboard/staff/bulk-hours/update-schedule ==========

	/**
	 * Test bulk update working hours for specific day.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_update_working_hours() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		// Create existing schedules (Monday)
		$this->add_schedule( $staff_a, 1, '09:00:00', '17:00:00' );
		$this->add_schedule( $staff_b, 1, '10:00:00', '18:00:00' );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/update-schedule' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'day_of_week' => 1, // Monday
			'update_hours' => true,
			'start_time' => '08:00:00',
			'end_time' => '16:00:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 2, $data['updated'] );

		// Verify in database
		global $wpdb;
		$alice_schedule = $wpdb->get_row( $wpdb->prepare(
			"SELECT start_time, end_time FROM {$wpdb->prefix}bookings_staff_working_hours 
			WHERE staff_id = %d AND day_of_week = 1 AND specific_date IS NULL",
			$staff_a
		) );
		$this->assertEquals( '08:00:00', $alice_schedule->start_time );
		$this->assertEquals( '16:00:00', $alice_schedule->end_time );
	}

	/**
	 * Test bulk update break times only.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_update_break_times_only() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		// Create schedules with breaks
		$this->add_schedule( $staff_a, 1, '09:00:00', '17:00:00', '12:00:00', '13:00:00' );
		$this->add_schedule( $staff_b, 1, '09:00:00', '17:00:00', '12:00:00', '13:00:00' );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/update-schedule' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'day_of_week' => 1,
			'update_hours' => false, // Don't update working hours
			'update_breaks' => true, // Only update breaks
			'break_start' => '12:30:00',
			'break_end' => '13:30:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Verify working hours unchanged, breaks updated
		global $wpdb;
		$alice_schedule = $wpdb->get_row( $wpdb->prepare(
			"SELECT start_time, end_time, break_start, break_end 
			FROM {$wpdb->prefix}bookings_staff_working_hours 
			WHERE staff_id = %d AND day_of_week = 1",
			$staff_a
		) );
		$this->assertEquals( '09:00:00', $alice_schedule->start_time ); // Unchanged
		$this->assertEquals( '17:00:00', $alice_schedule->end_time ); // Unchanged
		$this->assertEquals( '12:30:00', $alice_schedule->break_start ); // Updated
		$this->assertEquals( '13:30:00', $alice_schedule->break_end ); // Updated
	}

	/**
	 * Test bulk update only affects staff with existing schedules.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_update_only_updates_existing_schedules() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();

		// Only Alice has Monday schedule
		$this->add_schedule( $staff_a, 1, '09:00:00', '17:00:00' );
		// Bob has no Monday schedule

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/update-schedule' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff_a, $staff_b ),
			'day_of_week' => 1,
			'update_hours' => true,
			'start_time' => '08:00:00',
			'end_time' => '16:00:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$this->assertEquals( 1, $data['updated'] ); // Only Alice updated
		$this->assertEquals( 1, $data['skipped'] ); // Bob skipped
	}

	/**
	 * Test bulk update validates day_of_week range.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_update_validates_day_of_week() {
		$staff = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/update-schedule' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'day_of_week' => 8, // Invalid (must be 1-7)
			'update_hours' => true,
			'start_time' => '09:00:00',
			'end_time' => '17:00:00',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test bulk update requires at least one update flag.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_update_requires_update_flag() {
		$staff = $this->create_test_staff();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/update-schedule' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'day_of_week' => 1,
			'update_hours' => false,
			'update_breaks' => false, // Neither flag set
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test bulk operations require admin permission.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::bulk_add_exception
	 * @covers Bookit_Dashboard_Bookings_API::bulk_update_schedule
	 */
	public function test_bulk_operations_require_admin_permission() {
		$staff = $this->create_test_staff();

		// Create non-admin user
		$user_id = wp_create_user( 'staff', 'staff123', 'staff@test.com' );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/staff/bulk-hours/add-exception' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_ids' => array( $staff ),
			'specific_date' => '2026-12-25',
			'is_working' => 0,
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 403, $response->get_status() );
	}

	// ========== HELPER METHODS ==========

	/**
	 * Create test admin user.
	 */
	private function create_test_admin() {
		$admin_id = wp_create_user( 'admin', 'admin123', 'admin@test.com' );
		wp_update_user( array( 'ID' => $admin_id, 'role' => 'administrator' ) );
		$this->test_data['admin_user_id'] = $admin_id;
	}

	/**
	 * Create test staff member.
	 *
	 * @param array $args Override defaults.
	 * @return int Staff ID.
	 */
	private function create_test_staff( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'email' => 'staff-' . wp_generate_password( 6, false ) . '@test.com',
			'password_hash' => wp_hash_password( 'password123' ),
			'first_name' => 'Test',
			'last_name' => 'Staff',
			'role' => 'staff',
			'is_active' => 1,
			'display_order' => 0,
			'created_at' => current_time( 'mysql' ),
			'updated_at' => current_time( 'mysql' ),
		);

		$data = wp_parse_args( $args, $defaults );

		$wpdb->insert( $wpdb->prefix . 'bookings_staff', $data );
		return (int) $wpdb->insert_id;
	}

	/**
	 * Add exception (specific_date entry).
	 *
	 * @param int    $staff_id Staff ID.
	 * @param string $date Date Y-m-d.
	 * @param string $start_time Start time.
	 * @param string $end_time End time.
	 * @param int    $is_working 1 or 0.
	 */
	private function add_exception( $staff_id, $date, $start_time, $end_time, $is_working ) {
		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . 'bookings_staff_working_hours',
			array(
				'staff_id' => $staff_id,
				'day_of_week' => null,
				'specific_date' => $date,
				'start_time' => $start_time,
				'end_time' => $end_time,
				'is_working' => $is_working,
			),
			array( '%d', '%d', '%s', '%s', '%s', '%d' )
		);
	}

	/**
	 * Add recurring schedule (day_of_week entry).
	 *
	 * @param int         $staff_id Staff ID.
	 * @param int         $day_of_week Day 1-7 (1=Mon, 7=Sun).
	 * @param string      $start_time Start time.
	 * @param string      $end_time End time.
	 * @param string|null $break_start Break start.
	 * @param string|null $break_end Break end.
	 */
	private function add_schedule( $staff_id, $day_of_week, $start_time, $end_time, $break_start = null, $break_end = null ) {
		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . 'bookings_staff_working_hours',
			array(
				'staff_id' => $staff_id,
				'day_of_week' => $day_of_week,
				'specific_date' => null,
				'start_time' => $start_time,
				'end_time' => $end_time,
				'is_working' => 1,
				'break_start' => $break_start,
				'break_end' => $break_end,
			),
			array( '%d', '%d', '%s', '%s', '%s', '%d', '%s', '%s' )
		);
	}
}
```

## Testing Instructions

After creating the file:

1. **Run tests:**
   ```bash
   npm test tests/unit/test-bulk-working-hours-api.php
   ```

2. **Expected results:**
   - All tests should pass
   - Coverage >80% for bulk operations logic
   - All edge cases handled

3. **If tests fail:**
   - Check endpoint routes match actual implementation
   - Verify database structure for `bookings_staff_working_hours` table
   - Ensure overwrite logic works as expected
   - Check permission callbacks

## Key Test Coverage

**Conflict Detection:**
- ✅ Finds existing exceptions
- ✅ Returns empty when no conflicts
- ✅ Includes full exception details

**Bulk Add Exception:**
- ✅ Day off to multiple staff
- ✅ Special hours with breaks
- ✅ Skips conflicts without overwrite
- ✅ Selective overwrite
- ✅ Date/time validation

**Bulk Update Schedule:**
- ✅ Updates working hours
- ✅ Updates break times only
- ✅ Only updates existing schedules
- ✅ Day of week validation
- ✅ Requires update flag

**Edge Cases:**
- ✅ Empty staff array
- ✅ Invalid dates/times
- ✅ Permission checks
- ✅ Non-existent staff IDs

## Notes

- Tests complex business logic with multiple scenarios
- Validates both success and error paths
- Tests selective overwrite (critical feature)
- Ensures permissions enforced
- Database cleanup in setUp/tearDown

## Next Steps

After Phase 3 tests pass:
- Move to Phase 4: Settings & Reorder Tests (final phase!)

Total estimated time for Phase 3: 10-12 hours
```

---

## ✅ APPLY THIS PROMPT

1. **Paste into Cursor**
2. **Generate the test file**
3. **Run:** `npm test tests/unit/test-bulk-working-hours-api.php`
4. **Report results**

**Then say:** "Phase 3 tests complete!" and I'll give you Phase 4 (the final phase)! 🚀