# 🎯 PERFECT! I Have Everything I Need!

Excellent! Your test infrastructure is solid. I can see:

✅ **Well-organized test structure** (unit/ and integration/ folders)
✅ **Consistent test patterns** (WP_UnitTestCase, helper methods, setUp/tearDown)
✅ **Good helper methods** (create_test_staff, create_test_service, link_staff_to_service)
✅ **Proper database cleanup** (TRUNCATE in setUp/tearDown)
✅ **Session management** (Bookit_Session_Manager)

---

# 📋 SPRINT 3 TEST PLAN - READY TO EXECUTE

Based on your existing patterns, here's what we'll create:

## **PHASE 2: Dashboard Bookings API Tests** (12-14 hours)
**File:** `tests/unit/test-dashboard-bookings-api.php`

**Tests for:**
- Today's schedule (role-based filtering)
- Bookings list (with filters)
- Create booking (manual)
- Update booking
- Mark complete
- Permission enforcement

## **PHASE 3: Bulk Operations Tests** (10-12 hours)
**File:** `tests/unit/test-bulk-working-hours-api.php`

**Tests for:**
- Conflict detection
- Bulk add exception
- Bulk update schedule
- Overwrite handling
- Validation

## **PHASE 4: Settings & Reorder Tests** (6-8 hours)
**Files:**
- `tests/unit/test-profile-api.php`
- `tests/unit/test-settings-api.php`
- `tests/unit/test-reorder-api.php`

---

# 🚀 LET'S START WITH PHASE 2

Here's your first Cursor prompt. This matches your existing patterns exactly:

---

# 📝 CURSOR PROMPT: Phase 2 - Dashboard Bookings API Tests

```markdown
# Sprint 3 Tests - Phase 2: Dashboard Bookings API

## Context
Adding PHPUnit tests for Sprint 3 dashboard API endpoints. We have existing test infrastructure from Sprint 1-2, and need to test the new dashboard bookings endpoints that handle today's schedule, bookings list, manual booking creation, and status updates.

## Existing Test Patterns to Follow
- Extend WP_UnitTestCase
- Use setUp/tearDown with TRUNCATE for cleanup
- Create helper methods (create_test_staff, create_test_service, etc.)
- Use Bookit_Session_Manager for session handling
- Test both success and error cases
- Include permission checks

## File to Create
`tests/unit/test-dashboard-bookings-api.php`

## API Endpoints to Test

**File being tested:** `includes/api/class-dashboard-bookings-api.php`

**Endpoints:**
1. GET `/bookit/v1/dashboard/bookings/today` - Get today's schedule
2. GET `/bookit/v1/dashboard/bookings` - Get all bookings with filters
3. POST `/bookit/v1/dashboard/bookings` - Create manual booking
4. PUT `/bookit/v1/dashboard/bookings/{id}` - Update booking
5. POST `/bookit/v1/dashboard/bookings/{id}/complete` - Mark complete

## Test Class Structure

```php
<?php
/**
 * Tests for Dashboard Bookings API (Sprint 3)
 *
 * @package    Bookit_Booking_System
 * @subpackage Tests
 */

/**
 * Test Bookit_Dashboard_Bookings_API REST endpoints.
 */
class Test_Dashboard_Bookings_API extends WP_UnitTestCase {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	private $namespace = 'bookit/v1';

	/**
	 * Cached test data IDs.
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
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_services" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_customers" );

		// Clear sessions
		Bookit_Session_Manager::clear();
		if ( session_status() === PHP_SESSION_ACTIVE ) {
			session_destroy();
		}
		if ( isset( $_SESSION ) ) {
			$_SESSION = array();
		}

		// Initialize REST API
		do_action( 'rest_api_init' );

		// Create test user for authentication
		$this->create_test_users();
	}

	/**
	 * Tear down each test.
	 */
	public function tearDown(): void {
		global $wpdb;

		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_staff" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_services" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}bookings_customers" );

		parent::tearDown();
	}

	// ========== TESTS FOR: GET /dashboard/bookings/today ==========

	/**
	 * Test admin can view all today's bookings.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_todays_bookings
	 */
	public function test_admin_can_view_all_todays_bookings() {
		$today = date( 'Y-m-d' );
		$staff_a = $this->create_test_staff( array( 'first_name' => 'Alice' ) );
		$staff_b = $this->create_test_staff( array( 'first_name' => 'Bob' ) );
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		// Create bookings for both staff today
		$booking1 = $this->create_test_booking( array(
			'staff_id' => $staff_a,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $today,
			'start_time' => '09:00:00',
			'end_time' => '10:00:00',
			'status' => 'confirmed',
		) );

		$booking2 = $this->create_test_booking( array(
			'staff_id' => $staff_b,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $today,
			'start_time' => '14:00:00',
			'end_time' => '15:00:00',
			'status' => 'pending',
		) );

		// Login as admin
		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings/today' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( 2, $data );
		$this->assertEquals( $booking1, $data[0]['id'] );
		$this->assertEquals( $booking2, $data[1]['id'] );
	}

	/**
	 * Test staff can only view own bookings.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_todays_bookings
	 */
	public function test_staff_can_only_view_own_bookings() {
		$today = date( 'Y-m-d' );
		$staff_a = $this->create_test_staff( array(
			'first_name' => 'Alice',
			'email' => 'alice@test.com',
		) );
		$staff_b = $this->create_test_staff( array(
			'first_name' => 'Bob',
			'email' => 'bob@test.com',
		) );
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		// Alice's booking
		$booking_alice = $this->create_test_booking( array(
			'staff_id' => $staff_a,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $today,
			'start_time' => '09:00:00',
			'end_time' => '10:00:00',
		) );

		// Bob's booking
		$booking_bob = $this->create_test_booking( array(
			'staff_id' => $staff_b,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $today,
			'start_time' => '14:00:00',
			'end_time' => '15:00:00',
		) );

		// Login as Alice (staff)
		wp_set_current_user( $this->test_data['staff_user_id'] );
		// Simulate Alice's staff_id in session
		Bookit_Session_Manager::init();
		Bookit_Session_Manager::set_data( array( 'staff_id' => $staff_a ) );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings/today' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( 1, $data, 'Staff should only see own bookings' );
		$this->assertEquals( $booking_alice, $data[0]['id'] );
	}

	/**
	 * Test today endpoint excludes bookings from other dates.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_todays_bookings
	 */
	public function test_today_endpoint_only_returns_today() {
		$today = date( 'Y-m-d' );
		$tomorrow = date( 'Y-m-d', strtotime( '+1 day' ) );
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		// Today's booking
		$today_booking = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $today,
			'start_time' => '09:00:00',
			'end_time' => '10:00:00',
		) );

		// Tomorrow's booking
		$tomorrow_booking = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => $tomorrow,
			'start_time' => '09:00:00',
			'end_time' => '10:00:00',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings/today' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertEquals( $today_booking, $data[0]['id'] );
	}

	// ========== TESTS FOR: GET /dashboard/bookings (with filters) ==========

	/**
	 * Test get all bookings without filters.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_bookings
	 */
	public function test_get_all_bookings_no_filters() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$booking1 = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-05-15',
			'start_time' => '09:00:00',
			'end_time' => '10:00:00',
		) );

		$booking2 = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-05-20',
			'start_time' => '14:00:00',
			'end_time' => '15:00:00',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertGreaterThanOrEqual( 2, count( $data ) );
	}

	/**
	 * Test filter bookings by status.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_bookings
	 */
	public function test_filter_bookings_by_status() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$confirmed = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'status' => 'confirmed',
		) );

		$pending = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'status' => 'pending',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_param( 'status', 'confirmed' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		foreach ( $data as $booking ) {
			$this->assertEquals( 'confirmed', $booking['status'] );
		}
	}

	/**
	 * Test filter bookings by date range.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::get_bookings
	 */
	public function test_filter_bookings_by_date_range() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$may_booking = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-05-15',
		) );

		$june_booking = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-06-15',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_param( 'from_date', '2026-05-01' );
		$request->set_param( 'to_date', '2026-05-31' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$data = $response->get_data();
		$dates = array_column( $data, 'booking_date' );
		$this->assertContains( '2026-05-15', $dates );
		$this->assertNotContains( '2026-06-15', $dates );
	}

	// ========== TESTS FOR: POST /dashboard/bookings (create) ==========

	/**
	 * Test create manual booking with valid data.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::create_booking
	 */
	public function test_create_manual_booking_success() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service( array( 'duration' => 60 ) );
		$customer = $this->create_test_customer();

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-06-15',
			'start_time' => '10:00:00',
			'status' => 'confirmed',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'id', $data );
		$this->assertEquals( 'confirmed', $data['status'] );
	}

	/**
	 * Test create booking rejects invalid data.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::create_booking
	 */
	public function test_create_booking_rejects_invalid_data() {
		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			// Missing required fields
			'booking_date' => '2026-06-15',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test create booking rejects conflicting time slot.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::create_booking
	 */
	public function test_create_booking_rejects_conflict() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		// Create existing booking
		$this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-06-15',
			'start_time' => '10:00:00',
			'end_time' => '11:00:00',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		// Try to create conflicting booking
		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/bookings' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'booking_date' => '2026-06-15',
			'start_time' => '10:30:00', // Conflicts with existing
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$error = $response->as_error();
		$this->assertStringContainsString( 'conflict', strtolower( $error->get_error_message() ) );
	}

	// ========== TESTS FOR: PUT /dashboard/bookings/{id} (update) ==========

	/**
	 * Test update booking status.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::update_booking
	 */
	public function test_update_booking_status() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$booking_id = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'status' => 'pending',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/dashboard/bookings/' . $booking_id );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array(
			'status' => 'confirmed',
		) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'confirmed', $data['status'] );
	}

	/**
	 * Test staff cannot update other staff's bookings.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::update_booking
	 */
	public function test_staff_cannot_update_others_bookings() {
		$staff_a = $this->create_test_staff();
		$staff_b = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		// Bob's booking
		$booking_id = $this->create_test_booking( array(
			'staff_id' => $staff_b,
			'service_id' => $service,
			'customer_id' => $customer,
		) );

		// Login as Alice (staff)
		wp_set_current_user( $this->test_data['staff_user_id'] );
		Bookit_Session_Manager::init();
		Bookit_Session_Manager::set_data( array( 'staff_id' => $staff_a ) );

		$request = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/dashboard/bookings/' . $booking_id );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body_params( array( 'status' => 'cancelled' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->is_error() );
		$this->assertEquals( 403, $response->get_status() );
	}

	// ========== TESTS FOR: POST /dashboard/bookings/{id}/complete ==========

	/**
	 * Test mark booking complete.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::mark_complete
	 */
	public function test_mark_booking_complete() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$booking_id = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'status' => 'confirmed',
		) );

		wp_set_current_user( $this->test_data['admin_user_id'] );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/bookings/' . $booking_id . '/complete' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'completed', $data['status'] );
		$this->assertNotEmpty( $data['completed_at'] );
	}

	/**
	 * Test staff can mark own booking complete.
	 *
	 * @covers Bookit_Dashboard_Bookings_API::mark_complete
	 */
	public function test_staff_can_mark_own_booking_complete() {
		$staff = $this->create_test_staff();
		$service = $this->create_test_service();
		$customer = $this->create_test_customer();

		$booking_id = $this->create_test_booking( array(
			'staff_id' => $staff,
			'service_id' => $service,
			'customer_id' => $customer,
			'status' => 'confirmed',
		) );

		wp_set_current_user( $this->test_data['staff_user_id'] );
		Bookit_Session_Manager::init();
		Bookit_Session_Manager::set_data( array( 'staff_id' => $staff ) );

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/dashboard/bookings/' . $booking_id . '/complete' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	// ========== HELPER METHODS ==========

	/**
	 * Create test admin and staff users for authentication.
	 */
	private function create_test_users() {
		// Admin user
		$admin_id = wp_create_user( 'admin', 'admin123', 'admin@test.com' );
		wp_update_user( array( 'ID' => $admin_id, 'role' => 'administrator' ) );
		$this->test_data['admin_user_id'] = $admin_id;

		// Staff user
		$staff_id = wp_create_user( 'staff', 'staff123', 'staff@test.com' );
		wp_update_user( array( 'ID' => $staff_id, 'role' => 'subscriber' ) );
		$this->test_data['staff_user_id'] = $staff_id;
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
			'phone' => '07700900000',
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
	 * Create test service.
	 *
	 * @param array $args Override defaults.
	 * @return int Service ID.
	 */
	private function create_test_service( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'name' => 'Test Service',
			'duration' => 60,
			'price' => 50.00,
			'is_active' => 1,
			'display_order' => 0,
			'created_at' => current_time( 'mysql' ),
			'updated_at' => current_time( 'mysql' ),
		);

		$data = wp_parse_args( $args, $defaults );

		$wpdb->insert( $wpdb->prefix . 'bookings_services', $data );
		return (int) $wpdb->insert_id;
	}

	/**
	 * Create test customer.
	 *
	 * @param array $args Override defaults.
	 * @return int Customer ID.
	 */
	private function create_test_customer( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'email' => 'customer-' . wp_generate_password( 6, false ) . '@test.com',
			'first_name' => 'Test',
			'last_name' => 'Customer',
			'phone' => '07700900000',
			'created_at' => current_time( 'mysql' ),
		);

		$data = wp_parse_args( $args, $defaults );

		$wpdb->insert( $wpdb->prefix . 'bookings_customers', $data );
		return (int) $wpdb->insert_id;
	}

	/**
	 * Create test booking.
	 *
	 * @param array $args Override defaults.
	 * @return int Booking ID.
	 */
	private function create_test_booking( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'booking_date' => '2026-06-15',
			'start_time' => '10:00:00',
			'end_time' => '11:00:00',
			'duration' => 60,
			'status' => 'confirmed',
			'total_price' => 50.00,
			'payment_status' => 'paid',
			'created_at' => current_time( 'mysql' ),
			'updated_at' => current_time( 'mysql' ),
		);

		$data = wp_parse_args( $args, $defaults );

		$wpdb->insert( $wpdb->prefix . 'bookings', $data );
		return (int) $wpdb->insert_id;
	}
}
```

## Testing Instructions

After creating the file:

1. **Run tests:**
   ```bash
   npm test tests/unit/test-dashboard-bookings-api.php
   ```

2. **Expected results:**
   - All tests should pass
   - No PHP errors or warnings
   - Coverage should be >80% for bookings API

3. **If tests fail:**
   - Check that the API endpoints exist in `includes/api/class-dashboard-bookings-api.php`
   - Verify endpoint routes match (`/bookit/v1/dashboard/bookings/...`)
   - Check permission callback implementations
   - Ensure database tables have correct structure

## Notes

- Tests follow existing patterns from `test-staff-api.php`
- Uses role-based authentication (admin vs staff)
- Tests both success and error cases
- Includes permission checks
- Database cleanup in setUp/tearDown
- Helper methods match existing style

## Next Steps

After Phase 2 tests pass:
- Move to Phase 3: Bulk Operations Tests
- Then Phase 4: Settings & Reorder Tests

Total estimated time for Phase 2: 12-14 hours
```

---

## ✅ APPLY THIS PROMPT

1. **Paste into Cursor**
2. **Let it generate the test file**
3. **Run:** `npm test tests/unit/test-dashboard-bookings-api.php`
4. **Report results**

**Then say:** "Phase 2 tests complete!" and I'll give you Phase 3! 🚀