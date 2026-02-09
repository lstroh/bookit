1.Dashboard Authentication Architecture - CLARIFICATION ⚠️
I found a CRITICAL DISCREPANCY between what I told you in the Sprint 3 prompt and what's actually in your architecture!
Let me search for the actual database schema...Searched project for “CREATE TABLE wp_bookings database schema staff password authentication bcrypt user_id wordpress_user_id”Searched project for “CREATE TABLE wp_bookings database schema staff password authentication bcrypt user_id wordpress_user_id”5 resultsSystem_Architecture_Document_PART1_Sections_1-8.md3 relevant sectionstextSRS_WordPress_Booking_Plugin_v1.0.md2 relevant sectionstextTechnicalRequirements.mdtextDevelopment_Sequence_Plan.mdtextDevelopment_Sequence_Plan.mdtextDone🚨 CRITICAL CORRECTION - Dashboard Authentication
The ACTUAL Architecture (From Your Docs)
NOT a Separate wp_bookings_users Table! ⚠️
Your architecture uses Approach C: Hybrid WordPress Users

✅ CORRECT AUTHENTICATION ARCHITECTURE
Staff Table Schema (Actual)
From wp_bookings_staff:
sqlCREATE TABLE wp_bookings_staff (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  wordpress_user_id BIGINT UNSIGNED NOT NULL,  -- ← Links to wp_users!
  display_name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  bio TEXT,
  photo_url VARCHAR(255),
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_oauth_token TEXT, /* Encrypted */
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  UNIQUE KEY unique_wp_user (wordpress_user_id),
  INDEX idx_active (is_active)
);
Key Points:

✅ Uses WordPress wp_users table for authentication
✅ wp_bookings_staff.wordpress_user_id links to wp_users.ID
✅ NO separate password storage (uses WordPress password hashing)
✅ bookit_dashboard_only usermeta flag prevents WP admin access


📋 How Authentication ACTUALLY Works
System Architecture Document Section 3.4:
Approach C: Hybrid - WordPress Users + Dashboard-Only Flag ✅
php// 1. Create WordPress user
$user_id = wp_create_user($email, $password, $email);

// 2. Set custom role
$user = new WP_User($user_id);
$user->set_role('bookit_admin'); // or 'bookit_staff'

// 3. Add dashboard-only flag
add_user_meta($user_id, 'bookit_dashboard_only', 1);

// 4. Create staff record
$wpdb->insert('wp_bookings_staff', [
    'wordpress_user_id' => $user_id,
    'display_name' => $first_name . ' ' . $last_name,
    'is_active' => 1,
]);
Login Process:
phpfunction bookit_authenticate_dashboard_user($email, $password) {
    // 1. Use WordPress authentication
    $user = wp_authenticate($email, $password);
    
    if (is_wp_error($user)) {
        return $user; // Invalid credentials
    }
    
    // 2. Check bookit_dashboard_only flag
    $dashboard_only = get_user_meta($user->ID, 'bookit_dashboard_only', true);
    if (!$dashboard_only) {
        return new WP_Error('not_dashboard_user', 'Not a dashboard user');
    }
    
    // 3. Create dashboard session (NOT WordPress admin session)
    session_start();
    session_regenerate_id(true);
    $_SESSION['bookit_dashboard_user_id'] = $user->ID;
    $_SESSION['bookit_dashboard_role'] = $user->roles[0];
    
    return $user;
}
WordPress Admin Prevention Hook:
php// Prevent dashboard users from accessing /wp-admin/
add_action('admin_init', function() {
    $user_id = get_current_user_id();
    $dashboard_only = get_user_meta($user_id, 'bookit_dashboard_only', true);
    
    if ($dashboard_only && !wp_doing_ajax()) {
        wp_redirect(home_url('/dashboard/'));
        exit;
    }
});
```

---

## 🔄 Updated Sprint 3 Task 2 Requirements

### **Task 2: Dashboard Authentication & Login (CORRECTED)**

**Database Tables Involved:**

1. **`wp_users`** (WordPress core table)
   - Stores username, email, password_hash
   - Uses WordPress bcrypt hashing

2. **`wp_usermeta`** (WordPress core table)
   - `bookit_dashboard_only = 1` (prevents admin access)
   - `bookit_user_role = 'business_owner'` or `'staff'`

3. **`wp_bookings_staff`** (Your custom table)
   - Links to `wp_users.ID` via `wordpress_user_id`
   - Stores dashboard-specific data (photo, bio, etc.)

**Authentication Flow (CORRECTED):**
```
1. User enters email + password
2. POST /wp-json/bookit/v1/dashboard/auth/login
3. PHP calls wp_authenticate($email, $password)
4. Verify bookit_dashboard_only = 1 in usermeta
5. Get staff record from wp_bookings_staff WHERE wordpress_user_id = user_id
6. Create PHP session with staff_id
7. Return success + user data
```

**Benefits of This Approach:**

✅ **Leverages WordPress infrastructure:**
- Password hashing (bcrypt)
- Password reset functionality
- User management UI (if needed)
- Security updates maintained by WordPress

✅ **True separation:**
- `bookit_dashboard_only` flag prevents WP admin access
- Dashboard uses separate PHP session (not WordPress auth cookies)
- Can't accidentally break site from dashboard

✅ **Single user database:**
- Easier for you to manage users
- No duplicate user records
- Can "upgrade" user to WP admin access if needed later

---

## 📝 What Needs to Change in Sprint 3 Prompt

### **BEFORE (Incorrect in my prompt):**
```
Dashboard users stored in wp_bookings_users table
- id
- email
- password_hash (bcrypt)
- first_name
- last_name
- role (business_owner, staff)
```

### **AFTER (Correct architecture):**
```
Dashboard users use THREE tables:

1. wp_users (WordPress core)
   - ID
   - user_login
   - user_email
   - user_pass (bcrypt by WordPress)

2. wp_usermeta (WordPress core)
   - bookit_dashboard_only = 1
   - bookit_user_role = 'business_owner' | 'staff'

3. wp_bookings_staff (custom)
   - id
   - wordpress_user_id (FK to wp_users.ID)
   - display_name
   - photo_url
   - bio
   - is_active

🛠️ Implementation Changes for Task 2
Creating a Dashboard User:
php// includes/controllers/class-dashboard-auth-controller.php

function create_dashboard_user($email, $password, $first_name, $last_name, $role) {
    // 1. Create WordPress user
    $user_id = wp_create_user($email, $password, $email);
    
    if (is_wp_error($user_id)) {
        return $user_id;
    }
    
    // 2. Set WordPress role
    $wp_role = ($role === 'business_owner') ? 'bookit_admin' : 'bookit_staff';
    $user = new WP_User($user_id);
    $user->set_role($wp_role);
    
    // 3. Set dashboard-only flag
    add_user_meta($user_id, 'bookit_dashboard_only', 1);
    add_user_meta($user_id, 'bookit_user_role', $role);
    
    // 4. Update wp_users profile
    wp_update_user([
        'ID' => $user_id,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'display_name' => $first_name . ' ' . $last_name,
    ]);
    
    // 5. Create staff record
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'bookings_staff', [
        'wordpress_user_id' => $user_id,
        'display_name' => $first_name . ' ' . $last_name,
        'is_active' => 1,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
    ]);
    
    return $user_id;
}
Login Endpoint:
php// REST API: POST /wp-json/bookit/v1/dashboard/auth/login

function handle_dashboard_login($request) {
    $email = sanitize_email($request['email']);
    $password = $request['password'];
    
    // Rate limiting check
    if (is_rate_limited($_SERVER['REMOTE_ADDR'], 'dashboard_login')) {
        return new WP_Error('rate_limited', 'Too many attempts', ['status' => 429]);
    }
    
    // Authenticate with WordPress
    $user = wp_authenticate($email, $password);
    
    if (is_wp_error($user)) {
        increment_failed_attempts($_SERVER['REMOTE_ADDR'], 'dashboard_login');
        return new WP_Error('invalid_credentials', 'Invalid email or password', ['status' => 401]);
    }
    
    // Check dashboard-only flag
    $dashboard_only = get_user_meta($user->ID, 'bookit_dashboard_only', true);
    if (!$dashboard_only) {
        return new WP_Error('unauthorized', 'Not authorized for dashboard', ['status' => 403]);
    }
    
    // Get staff record
    global $wpdb;
    $staff = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bookings_staff WHERE wordpress_user_id = %d AND is_active = 1",
        $user->ID
    ));
    
    if (!$staff) {
        return new WP_Error('no_staff_record', 'Staff record not found', ['status' => 404]);
    }
    
    // Create session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    session_regenerate_id(true);
    
    $_SESSION['bookit_dashboard_user_id'] = $user->ID;
    $_SESSION['bookit_dashboard_staff_id'] = $staff->id;
    $_SESSION['bookit_dashboard_role'] = get_user_meta($user->ID, 'bookit_user_role', true);
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();
    
    // Return user data
    return [
        'success' => true,
        'user' => [
            'id' => $user->ID,
            'email' => $user->user_email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'role' => $_SESSION['bookit_dashboard_role'],
            'staff_id' => $staff->id,
        ],
    ];
}

✅ CORRECTED Sprint 3 Task 2 Summary
What EXISTS in Database (from Sprint 0):
✅ wp_bookings_staff table with wordpress_user_id column
✅ WordPress wp_users and wp_usermeta tables (core)
✅ Custom roles created: bookit_admin, bookit_staff
What Task 2 Needs to Build:

REST API Login Endpoint:

POST /wp-json/bookit/v1/dashboard/auth/login
Uses wp_authenticate()
Checks bookit_dashboard_only flag
Creates PHP session


Admin Hook to Prevent WP Admin Access:

Redirect dashboard-only users from /wp-admin/


Vue Login Component:

Login form (email + password)
Call login endpoint
Store session in Vue app state
Redirect to dashboard


Session Management:

8-hour timeout
HttpOnly, Secure, SameSite=Lax cookies
Rate limiting (5 attempts / 15 min)

2.
DESCRIBE wp_bookings_users;
Error in query (1146): Table 'local.wp_bookings_users' doesn't exist
DESCRIBE wp_bookings_working_hours;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
staff_id	bigint unsigned	NO	MUL	NULL	
day_of_week	tinyint unsigned	NO	MUL	NULL	
start_time	time	NO		NULL	
end_time	time	NO		NULL	
is_active	tinyint(1)	YES	MUL	1	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
updated_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED on update CURRENT_TIMESTAMP
DESCRIBE wp_bookings_services;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
name	varchar(255)	NO		NULL	
description	text	YES		NULL	
duration	int unsigned	NO		NULL	
price	decimal(10,2)	NO		0.00	
deposit_amount	decimal(10,2)	YES		NULL	
deposit_type	enum('fixed','percentage')	YES		fixed	
buffer_before	int unsigned	YES		0	
buffer_after	int unsigned	YES		0	
is_active	tinyint(1)	YES	MUL	1	
display_order	int	YES	MUL	0	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
updated_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED on update CURRENT_TIMESTAMP
deleted_at	datetime	YES	MUL	NULL	
DESCRIBE wp_bookings_staff;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
email	varchar(255)	NO	UNI	NULL	
password_hash	varchar(255)	NO		NULL	
first_name	varchar(100)	NO		NULL	
last_name	varchar(100)	NO		NULL	
phone	varchar(20)	YES		NULL	
photo_url	varchar(500)	YES		NULL	
bio	text	YES		NULL	
title	varchar(100)	YES		NULL	
role	enum('staff','admin')	YES	MUL	staff	
google_calendar_id	varchar(255)	YES		NULL	
is_active	tinyint(1)	YES	MUL	1	
display_order	int	YES		0	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
updated_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED on update CURRENT_TIMESTAMP
deleted_at	datetime	YES	MUL	NULL	
DESCRIBE wp_bookings_service_categories;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
service_id	bigint unsigned	NO	MUL	NULL	
category_id	bigint unsigned	NO	MUL	NULL	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
DESCRIBE wp_bookings_bookings;
Error in query (1146): Table 'local.wp_bookings_bookings' doesn't exist
DESCRIBE wp_bookings_customers;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
email	varchar(255)	NO	UNI	NULL	
first_name	varchar(100)	NO		NULL	
last_name	varchar(100)	NO		NULL	
phone	varchar(20)	NO	MUL	NULL	
marketing_consent	tinyint(1)	YES		0	
marketing_consent_date	datetime	YES		NULL	
notes	text	YES		NULL	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
updated_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED on update CURRENT_TIMESTAMP
deleted_at	datetime	YES	MUL	NULL	

3.
Namespace
Yes, the namespace is bookit/v1, so all endpoints live under /wp-json/bookit/v1/.
Existing Endpoints (Sprints 1-2)
All 8 endpoints are customer-facing (the booking wizard flow):
#	Route	Method	Class	Purpose
1	/service/select	POST	Bookit_Service_API	Select a service
2	/staff/select	POST	Bookit_Staff_API	Select a staff member
3	/timeslots	GET	Bookit_DateTime_API	Get available timeslots for a date
4	/datetime/select	POST	Bookit_DateTime_API	Confirm date/time selection
5	/wizard/session	GET	Bookit_Wizard_API	Retrieve wizard session state
6	/wizard/session	POST	Bookit_Wizard_API	Update wizard session state
7	/contact/save	POST	Bookit_Contact_API	Save customer contact details
8	/stripe/webhook	POST	Booking_System_Stripe_Webhook	Handle Stripe webhook events
Organization Pattern
One class per resource, all in includes/api/
Each class hooks into rest_api_init in its constructor
Some self-instantiate at the bottom of their file; others are instantiated in class-bookit-loader.php
Dashboard Namespace Recommendation
Your proposed /dashboard/ prefix structure is a great approach and won't conflict with anything existing:
/wp-json/bookit/v1/dashboard/auth/login/wp-json/bookit/v1/dashboard/bookings/wp-json/bookit/v1/dashboard/bookings/{id}/wp-json/bookit/v1/dashboard/settings...etc
This is clean because:
Zero conflict risk — all existing routes are top-level (/service/, /staff/, /wizard/, etc.), so the /dashboard/ prefix creates a completely separate namespace.
Clear separation of concerns — customer-facing endpoints stay at the root, admin/dashboard endpoints are grouped under /dashboard/.
Consistent with the existing pattern — you'd create new classes like Bookit_Dashboard_Auth_API, Bookit_Dashboard_Bookings_API, etc., following the same one-class-per-resource pattern already established in includes/api/.
The only thing to decide is whether the dashboard API classes should live in includes/api/ alongside the existing ones, or in a subfolder like includes/api/dashboard/ to mirror the route structure. Given the existing flat structure, either works — but a subfolder would keep things tidy as the dashboard API grows.

4.
\bookit-booking-system\dashboard already exists with the files: logout.php,index.php, dashboard-home.php, css\dashboard-auth.css

Here's a summary of all four files:
dashboard/index.php — Login Page
The staff login page. It's a server-side PHP form (not SPA/REST-based):
Auth check: If already logged in via Bookit_Auth::is_logged_in(), redirects to /bookit-dashboard/home/
Login flow: Handles POST form submission directly in the same file:
Verifies WordPress nonce (booking_login)
Sanitizes email + password
Calls Bookit_Auth::authenticate( $email, $password )
On success: Bookit_Auth::login( $staff ) → redirect to /bookit-dashboard/home/ (or a redirect_to param)
On failure: displays error message inline
UI: Centered login card with email/password fields, "Forgot password?" link (points to /bookit-dashboard/forgot-password/ — likely not implemented yet), and a help note
Uses WordPress theme via get_header() / get_footer()
dashboard/dashboard-home.php — Dashboard Home (Post-Login)
A placeholder landing page after login:
Auth guard: Calls Bookit_Auth::require_auth() at the top — redirects to login if not authenticated
Staff context: Retrieves current staff via Bookit_Auth::get_current_staff() and displays "Welcome, {name} ({role})"
Content: Three static stat cards — all hardcoded to zero:
Today's Bookings: 0
Pending Bookings: 0
Total Revenue (This Month): £0.00
Logout link: Points to /bookit-dashboard/logout/
Note at bottom: Explicitly says "Dashboard features will be implemented in Sprint 4"
This is purely scaffolding — no real data, no API calls.
dashboard/logout.php — Logout Handler
Minimal — just 3 lines of logic:
Calls Bookit_Auth::logout() to destroy the session
Redirects to /bookit-dashboard/?logged_out=1
Exits
dashboard/css/dashboard-auth.css — Shared Styles
184 lines of CSS covering both the login page and the dashboard home page:
Login page: Centered card layout (400px max-width), white card with shadow on #f5f5f5 background, green (#4caf50) accent color for buttons/links/focus states, error banner in red
Dashboard home: 1200px max-width wrapper, flex header with user info + logout, responsive 3-column stat card grid using CSS Grid (repeat(auto-fit, minmax(250px, 1fr)))
Design language: Clean, minimal, green-accented — consistent but basic
Key Takeaway
These four files form a server-rendered PHP authentication shell — traditional WordPress page templates, not a JavaScript SPA. The login works via form POST with session-based auth (Bookit_Auth + Bookit_Session), and the dashboard home is a static placeholder. Everything is wired through WordPress's get_header()/get_footer() and URL routing via /bookit-dashboard/* paths.
For Sprint 3, the decision is whether to keep building on this server-rendered approach (adding more PHP template pages) or pivot to a REST API + JavaScript SPA inside the dashboard wrapper. The REST API endpoints we discussed earlier (/dashboard/auth/login, /dashboard/bookings, etc.) suggest the latter — you'd keep the PHP shell for the initial page load but drive all the dashboard interactivity through fetch calls to the API.

5.
Core Booking Creator
Class: Booking_System_Booking_Creator
File: includes/booking/class-booking-creator.php
Method: create_booking( $data ) (line 35)
Parameters ($data array)
Parameter	Type	Required	Notes
service_id	int	Yes	
staff_id	int	Yes	
booking_date	string	Yes	YYYY-MM-DD
booking_time	string	Yes	HH:MM or HH:MM:SS
customer_email	string	Yes	
customer_first_name	string	Yes	
customer_last_name	string	Yes	
customer_phone	string	No	
payment_method	string	Yes	'stripe', 'pay_on_arrival', etc.
amount_paid	float	Yes	
payment_intent_id	string	No	Stripe-specific
stripe_session_id	string	No	Stripe-specific
special_requests	string	No	
Returns
Success: int (booking ID)
Failure: WP_Error with codes like 'missing_field', 'invalid_email', 'invalid_date', 'slot_unavailable', 'database_error'
What It Already Handles
Capability	Handled?	Details
Validation	Yes	Validates all required fields, email format, date/time format, service/staff existence
Availability checking	Yes	Via private check_booking_conflict() (lines 309-336)
Conflict detection	Yes	Queries for overlapping time ranges on the same staff + date, excludes cancelled bookings
Customer get-or-create	Yes	Finds existing customer by email or creates a new one
Database insertion	Yes	Inserts into {prefix}bookings and {prefix}bookings_payments
Email sending	No — by design	Emails are sent by the caller, not by create_booking() itself
Current Entry Points (2 callers)
1. Stripe Webhook (after payment succeeds)
Booking_System_Stripe_Webhook::handle_checkout_completed() in includes/api/class-stripe-webhook.php
Flow: Stripe webhook → verify signature → check idempotency → extract metadata → create_booking() → store idempotency key. Emails sent later when user hits the confirmation page.
2. Pay on Arrival
Booking_System_Payment_Processor::process_pay_on_arrival() in includes/payment/class-payment-processor.php
Flow: Form submission → validate session → map session data → create_booking() → send emails immediately → redirect to confirmation page.
What This Means for Task 5 (Manual Dashboard Booking)
The good news: create_booking() is already cleanly decoupled. It doesn't care who calls it or how authentication works — it just takes a $data array and returns a booking ID or error. No session dependency, no Stripe dependency baked in.
A dashboard manual booking endpoint would be a third caller with a flow like:
// Pseudocode for the dashboard endpoint callbackpublic function create_manual_booking( $request ) {    // 1. Auth already verified by permission_callback (admin/staff check)        // 2. Build the $data array from the REST request    $data = [        'service_id'          => $request['service_id'],        'staff_id'            => $request['staff_id'],        'booking_date'        => $request['booking_date'],        'booking_time'        => $request['booking_time'],        'customer_email'      => $request['customer_email'],        'customer_first_name' => $request['customer_first_name'],        'customer_last_name'  => $request['customer_last_name'],        'customer_phone'      => $request->get_param('customer_phone'),        'payment_method'      => 'pay_on_arrival', // or 'manual'        'amount_paid'         => 0,        'special_requests'    => $request->get_param('special_requests'),    ];        // 3. Reuse the exact same booking creator    $creator = new Booking_System_Booking_Creator();    $result  = $creator->create_booking( $data );        if ( is_wp_error( $result ) ) {        return $result; // WP_Error auto-maps to REST error response    }        // 4. Optionally send confirmation email    $booking   = $retriever->get_booking( $result );    $email     = new Booking_System_Email_Sender();    $email->send_customer_confirmation( $booking );    $email->send_business_notification( $booking );        return rest_ensure_response( ['booking_id' => $result] );}
The only consideration: you may want to add a new payment_method value like 'manual' or 'dashboard' to distinguish dashboard-created bookings from customer-created ones, for reporting purposes. The existing method doesn't restrict payment method values, so this should work without any modifications to Booking_System_Booking_Creator.

6.
Yes: the teable is wp_bookings_staff_services
DESCRIBE wp_bookings_staff_services;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
staff_id	bigint unsigned	NO	MUL	NULL	
service_id	bigint unsigned	NO	MUL	NULL	
custom_price	decimal(10,2)	YES		NULL	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED

7.
Deposit Type Configuration
Deposits are configured per service in the wp_bookings_services table:
deposit_amount DECIMAL(10,2) NULL DEFAULT NULL,deposit_type   ENUM('fixed','percentage') DEFAULT 'fixed',
There are effectively three modes, but only two are enum values:
Mode	How it works
Full payment	deposit_type is NULL or deposit_amount is NULL — defaults to charging the full service price
Fixed	deposit_type = 'fixed' — charges the exact deposit_amount (capped at service price)
Percentage	deposit_type = 'percentage' — charges (price * deposit_amount) / 100
Deposit Calculation
The calculation lives in Booking_System_Stripe_Checkout::calculate_deposit() in includes/payment/class-stripe-checkout.php (lines 358-415).
Key point: this method is currently on the Stripe checkout class, which means it's tightly coupled to Stripe. For Task 5 (manual bookings), you'd want to either reuse it directly or extract it to a shared utility so the dashboard can also calculate deposits without instantiating a Stripe class.
Payment Handling Classes
There's no single unified Payment_Handler. Payment logic is spread across three classes:
Class	File	Role
Booking_System_Payment_Processor	includes/payment/class-payment-processor.php	Routes to the correct payment method
Booking_System_Stripe_Checkout	includes/payment/class-stripe-checkout.php	Creates Stripe sessions + deposit calculation
Booking_System_Stripe_Webhook	includes/api/class-stripe-webhook.php	Handles post-payment booking creation
The payment processor routes based on payment_method:
'stripe' → creates Stripe Checkout session
'pay_on_arrival' → creates booking immediately with status = 'pending_payment'
'paypal' → placeholder, not implemented
Booking Status Based on Payment
From class-booking-creator.php (lines 89-92):
$status = ( 'pay_on_arrival' === $data['payment_method'] )    ? 'pending_payment'    : 'confirmed';
Full status enum in the database:
Status	Used when
pending	Default (not actively used in current flows)
pending_payment	Pay on arrival bookings
confirmed	Stripe payment completed
cancelled	Booking cancelled
completed	Appointment finished
no_show	Customer didn't show
Database Schema (Payment Columns)
wp_bookings table tracks the booking-level payment state:
total_price — full service price
deposit_amount — configured deposit from the service
deposit_paid — actual amount collected (0 for pay on arrival)
balance_due — total_price - deposit_paid
full_amount_paid — boolean flag
payment_method — 'stripe', 'pay_on_arrival', etc.
wp_bookings_payments table tracks individual payment transactions:
payment_type — ENUM('deposit', 'full_payment', 'refund')
payment_method — 'stripe', 'paypal', 'cash', 'card'
payment_status — ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded')
Should Dashboard Support "Paid Outside System"?
Yes, and the schema already supports it. The payment_method column on both tables is a VARCHAR(50), not an enum — it can accept any string value. And the payments table already lists 'cash' and 'card' as example values in its comment.
For dashboard manual bookings, I'd recommend supporting these scenarios:
Scenario	payment_method	status	deposit_paid	balance_due
Unpaid (book now, pay later)	'manual'	'pending_payment'	0	full price
Paid by cash	'cash'	'confirmed'	amount collected	remainder
Paid by card (outside system)	'card_external'	'confirmed'	amount collected	remainder
Paid by check	'check'	'confirmed'	amount collected	remainder
Complimentary/free	'complimentary'	'confirmed'	0	0
This needs zero schema changes. The existing Booking_Creator::create_booking() determines status based on payment_method === 'pay_on_arrival', so you'd just need to extend that condition to cover the new manual/external methods — a small tweak to the status logic.
The one thing worth extracting is calculate_deposit() — moving it out of Booking_System_Stripe_Checkout into a shared class (e.g., Booking_System_Deposit_Calculator) so both the Stripe flow and the dashboard flow can use it without coupling to Stripe.

8.
Email Sender Class
Class: Booking_System_Email_Sender
File: includes/email/class-email-sender.php
Everything is centralized in this one class with two public methods:
Method	Recipient	Subject	Lines
send_customer_confirmation( $booking )	$booking['customer_email']	"Booking Confirmed - {service_name}"	37-70
send_business_notification( $booking )	get_option('admin_email')	"New Booking - {service_name} on {date}"	78-110
Both accept a $booking array and return true on success or WP_Error on failure. Emails are sent via wp_mail().
Templates
Templates are inline HTML generated by two private methods — no separate template files:
Method	Format	Lines
generate_customer_email( $booking )	Styled HTML with inline CSS	118-233
generate_business_email( $booking )	Minimal HTML	241-295
Customer email includes: greeting, service/date/time/staff details, payment summary (deposit paid vs balance due vs pay on arrival), special requests, and cancellation info.
Business email includes: customer name/email/phone, booking details, payment info, special requests.
Who Calls It (2 Call Sites)
1. Pay on Arrival flow
class-payment-processor.php lines 185-198 — sends both emails immediately after create_booking().
2. Confirmation page (Stripe)
booking-confirmed.php lines 65-82 — sends both emails when the customer lands on the confirmation page after Stripe payment. Uses a transient (bookit_email_sent_{booking_id}) to prevent duplicates.
Notably, the Stripe webhook does NOT send emails — it only creates the booking. Emails wait until the user hits the confirmation page.
Email Toggle
There's already a WordPress filter for disabling emails:
// Lines 39, 80if ( ! apply_filters( 'bookit_send_email', true ) ) {    return true; // silently skip}
Currently used in tests to suppress emails. There's no admin UI for it yet.
Configuration
Setting	Source	Customizable?
From name	get_bloginfo('name')	Only via WP settings
From address	get_option('admin_email')	Only via WP settings
Business notification recipient	get_option('admin_email')	Only via WP settings
Enable/disable	bookit_send_email filter	Code-only (no UI)
Custom templates	N/A	Not implemented
Should Dashboard Manual Bookings Have a "Send Confirmation Email" Toggle?
Yes, absolutely. Here's why and how it fits cleanly:
The use case is real: When a business owner creates a booking manually (e.g., phone call, walk-in), they may or may not want the customer to get an email:
Walk-in who's already there → no email needed
Phone booking → yes, send confirmation
Rebooking a cancelled appointment → probably yes
The implementation is straightforward. Since emails are already decoupled from create_booking() (the caller decides), the dashboard endpoint just needs a boolean flag:
// In the dashboard manual booking endpoint$data = [ /* ...booking fields... */ ];$creator = new Booking_System_Booking_Creator();$result  = $creator->create_booking( $data );if ( ! is_wp_error( $result ) && $request->get_param( 'send_confirmation' ) ) {    $booking = $retriever->get_booking( $result );    $email   = new Booking_System_Email_Sender();    $email->send_customer_confirmation( $booking );    $email->send_business_notification( $booking );}
The existing bookit_send_email filter also provides a global override if the business wants to suppress all emails system-wide (e.g., during data migration).
No changes to Booking_System_Email_Sender are needed — the toggle lives entirely in the dashboard endpoint as a request parameter like send_confirmation: true/false, defaulting to true.

9. 
Yes
DESCRIBE wp_bookings_working_hours;
Field	Type	Null	Key	Default	Extra
id	bigint unsigned	NO	PRI	NULL	auto_increment
staff_id	bigint unsigned	NO	MUL	NULL	
day_of_week	tinyint unsigned	NO	MUL	NULL	
start_time	time	NO		NULL	
end_time	time	NO		NULL	
is_active	tinyint(1)	YES	MUL	1	
created_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED
updated_at	datetime	NO		CURRENT_TIMESTAMP	DEFAULT_GENERATED on update CURRENT_TIMESTAMP

10.
Storage Method: WordPress Options API
All plugin settings use get_option() / update_option() in the wp_options table. No constants for configuration, no custom settings storage in use.
General Settings — bookit_settings (single array)
Set during activation in class-bookit-activator.php line 68:
Key	Default	Notes
timezone	'Europe/London'	
currency	'GBP'	
date_format	'd/m/Y'	
time_format	'H:i'	
booking_buffer_before	0	minutes
booking_buffer_after	0	minutes
min_booking_notice	60	minutes
max_booking_advance	90	days
Admin UI: Placeholder only (admin/pages/settings.php) — displays the array as debug output. No functional form yet.
Stripe Settings — Individual Options
Managed via WordPress Settings API in admin/settings/stripe-settings.php with a working form:
Option Key	Status
bookit_stripe_test_mode	Active (boolean toggle)
bookit_stripe_test_publishable_key	Active
bookit_stripe_test_secret_key	Active
bookit_stripe_test_webhook_secret	Active
bookit_stripe_live_publishable_key	Prepared, UI disabled
bookit_stripe_live_secret_key	Prepared, UI disabled
bookit_stripe_live_webhook_secret	Prepared, UI disabled
Read through Bookit_Stripe_Config (includes/payment/class-stripe-config.php) which auto-selects test vs live keys based on mode.
System/Internal Options
Option Key	Purpose
bookit_version	Plugin version tracking
bookit_db_version	Schema migration versioning
bookit_idempotency_last_cleanup	Cron housekeeping
bookit_idempotency_last_cleanup_count	Cron housekeeping
Custom Tables for Entity Data
Service, staff, and scheduling data lives in custom tables — not in wp_options:
Table	Stores	Key columns
wp_bookings_services	Service config	price, duration, deposit_amount, deposit_type, buffer_before, buffer_after
wp_bookings_staff	Staff profiles	photo_url, bio, title, google_calendar_id
wp_bookings_staff_services	Staff-service links	custom_price (overrides service base price)
wp_bookings_working_hours	Availability	Per-staff, per-day working hours
The Unused Custom Settings Table
There's a wp_bookings_settings table already created in the schema (class-bookit-database.php lines 396-412):
setting_key   VARCHAR(100) UNIQUE,setting_value LONGTEXT,autoload      TINYINT(1) DEFAULT 1
It's a key-value store that exists in the database but nothing reads or writes to it. It was likely created as a forward-looking design for plugin-specific settings that shouldn't clutter wp_options.
What This Means for Sprint 3
For the dashboard settings endpoints, you have two reasonable paths:
Option A: Continue with wp_options — Add new options like bookit_business_name, bookit_business_email, bookit_email_notifications_enabled, etc. This is the WordPress-conventional approach and consistent with what you already have.
Option B: Use the existing wp_bookings_settings table — Since it's already there and purpose-built, you could start using it for dashboard-configurable settings. This keeps all bookit data in custom tables (cleaner uninstall, no wp_options pollution).
Either works, but since the Stripe settings and bookit_settings array are already in wp_options, I'd lean toward Option A for consistency — unless you want to migrate everything to the custom table later. Mixing both storage locations would create confusion about "where does this setting live?"
For the dashboard settings API endpoint (/wp-json/bookit/v1/dashboard/settings), the endpoint would just read/write whichever storage you pick, so this is a decision to make now before building Task 6.



Do you have any questions or can we start working on this sprint?