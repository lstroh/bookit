# 🎯 Quick Decision Guide: New Chat vs. Continue Here

---

## 📊 TOKEN USAGE CHECK

**Current conversation:**
- **Used:** ~120,000 tokens
- **Remaining:** ~70,000 tokens  
- **Status:** 🟡 **Medium** - We have room, but getting fuller

---

## ✅ MY RECOMMENDATION: **Continue Here**

**Why continue in this chat:**

1. ✅ **I have full context** of your actual schema (the differences we just fixed)
2. ✅ **I know your exact table structure** (is_active vs status, price vs base_price, etc.)
3. ✅ **70K tokens is enough** for Task 3 implementation + tests
4. ✅ **Faster** - No need to re-explain schema differences

**When to start new chat:**
- After Task 3 is complete
- Before Task 4 (Date Picker) - fresh start with clean context

---

## 🚀 LET'S CONTINUE - TASK 3 CORRECTED PROMPT

Here's the **Task 3 implementation prompt tailored to YOUR ACTUAL SCHEMA**:

---

# 💻 TASK 3: STAFF SELECTION UI (CORRECTED FOR YOUR SCHEMA)

**Sprint 1, Task 3 of 8**  
**Estimated Time:** 18 hours  
**Complexity:** Medium  

---

## CURSOR IMPLEMENTATION PROMPT

**Copy this entire section and paste into Cursor:**

```markdown
# TASK: Build Staff Selection UI - Step 2 (Sprint 1, Task 3)

## Context
I'm building Step 2 of the booking wizard for "Bookit Booking System" WordPress plugin. Customer has already selected a service in Step 1, now they select which staff member they want (or "No Preference").

## My Actual Database Schema

**IMPORTANT:** My schema uses these exact column names (verified):

### wp_bookings_staff:
- `id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`
- `photo_url` (can be NULL)
- `bio` (can be NULL)  
- `title` (can be NULL)
- `role` (enum: 'staff', 'admin')
- `google_calendar_id`
- `is_active` (TINYINT 0/1, not ENUM status)
- `display_order`, `created_at`, `updated_at`, `deleted_at`

### wp_bookings_services:
- `id`, `name`, `description`, `duration`, `price` (NOT base_price)
- `deposit_amount`, `deposit_type`, `buffer_before`, `buffer_after`
- `is_active` (TINYINT 0/1, not ENUM status)
- `display_order`, `created_at`, `updated_at`, `deleted_at`

### wp_bookings_staff_services:
- `id`, `staff_id`, `service_id`
- `custom_price` (DECIMAL NULL - if NULL use service.price)
- `created_at`

## Existing Infrastructure (From Tasks 1-2)
- Session manager: `Bookit_Session_Manager` (Task 1)
- Service model: `Bookit_Service_Model` (Task 2)
- Wizard shell and navigation (Task 1)
- Step 2 template: `public/templates/booking-step-2-staff.php` (needs implementation)
- Session contains: `service_id`, `service_name`, `service_duration`, `service_price`

## Requirements

### 1. Create Staff Model Class

**File:** `includes/models/class-staff-model.php`

Create model with these methods:

**`get_staff_for_service($service_id)`**
Returns active staff offering the service, sorted alphabetically by first_name.

```php
<?php
/**
 * Staff Model
 */
class Bookit_Staff_Model {
    
    private $wpdb;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }
    
    /**
     * Get all active staff who offer a specific service
     * Sorted alphabetically by first_name
     * 
     * @param int $service_id Service ID
     * @return array Array of staff members with pricing
     */
    public function get_staff_for_service($service_id) {
        $sql = $this->wpdb->prepare("
            SELECT 
                s.id,
                s.first_name,
                s.last_name,
                CONCAT(s.first_name, ' ', s.last_name) as full_name,
                s.email,
                s.phone,
                s.photo_url,
                s.bio,
                s.title,
                COALESCE(ss.custom_price, srv.price) as price
            FROM {$this->wpdb->prefix}bookings_staff s
            INNER JOIN {$this->wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
            INNER JOIN {$this->wpdb->prefix}bookings_services srv ON ss.service_id = srv.id
            WHERE s.is_active = 1
              AND srv.id = %d
              AND srv.is_active = 1
            ORDER BY s.first_name ASC, s.last_name ASC
        ", $service_id);
        
        return $this->wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Get lowest price among staff for a service
     * Used for "No Preference" card
     * 
     * @param int $service_id Service ID
     * @return float Lowest price
     */
    public function get_lowest_staff_price_for_service($service_id) {
        $sql = $this->wpdb->prepare("
            SELECT MIN(COALESCE(ss.custom_price, srv.price)) as min_price
            FROM {$this->wpdb->prefix}bookings_staff s
            INNER JOIN {$this->wpdb->prefix}bookings_staff_services ss ON s.id = ss.staff_id
            INNER JOIN {$this->wpdb->prefix}bookings_services srv ON ss.service_id = srv.id
            WHERE s.is_active = 1
              AND srv.id = %d
              AND srv.is_active = 1
        ", $service_id);
        
        $result = $this->wpdb->get_var($sql);
        return $result ? floatval($result) : 0.00;
    }
    
    /**
     * Get single staff member by ID
     * 
     * @param int $staff_id Staff ID
     * @return array|null Staff data or null
     */
    public function get_staff_by_id($staff_id) {
        $sql = $this->wpdb->prepare("
            SELECT 
                id,
                email,
                first_name,
                last_name,
                CONCAT(first_name, ' ', last_name) as full_name,
                phone,
                photo_url,
                bio,
                title,
                is_active
            FROM {$this->wpdb->prefix}bookings_staff
            WHERE id = %d
        ", $staff_id);
        
        $staff = $this->wpdb->get_row($sql, ARRAY_A);
        
        // Return null if not found or inactive
        if (!$staff || !$staff['is_active']) {
            return null;
        }
        
        return $staff;
    }
}
```

### 2. Update Step 2 Template

**File:** `public/templates/booking-step-2-staff.php`

```php
<?php
/**
 * Booking Wizard - Step 2: Staff Selection
 */

// Get service from session
$session_manager = new Bookit_Session_Manager();
$session_manager->init();
$wizard_data = $session_manager->get_wizard_data();

if (empty($wizard_data['service_id'])) {
    echo '<p>Please select a service first.</p>';
    return;
}

$service_id = $wizard_data['service_id'];
$service_name = $wizard_data['service_name'];

// Get staff for this service
$staff_model = new Bookit_Staff_Model();
$staff_members = $staff_model->get_staff_for_service($service_id);
$lowest_price = $staff_model->get_lowest_staff_price_for_service($service_id);

if (empty($staff_members)) {
    ?>
    <div class="bookit-no-staff">
        <h2><?php esc_html_e('No Staff Available', 'bookit-booking-system'); ?></h2>
        <p><?php esc_html_e('All staff members are currently unavailable for this service.', 'bookit-booking-system'); ?></p>
    </div>
    <?php
    return;
}
?>

<div class="bookit-step bookit-step-2-staff">
    <h2><?php esc_html_e('Select Staff Member', 'bookit-booking-system'); ?></h2>
    <p class="bookit-step-intro">
        <?php echo esc_html(sprintf(__('Who would you like for your %s?', 'bookit-booking-system'), $service_name)); ?>
    </p>
    
    <div class="bookit-staff-grid">
        <?php foreach ($staff_members as $staff): ?>
            <div class="bookit-staff-card" data-staff-id="<?php echo esc_attr($staff['id']); ?>">
                <div class="bookit-staff-card-content">
                    <!-- Photo or Initials -->
                    <div class="bookit-staff-photo">
                        <?php if (!empty($staff['photo_url'])): ?>
                            <img 
                                src="<?php echo esc_url($staff['photo_url']); ?>" 
                                alt="<?php echo esc_attr(sprintf(__('Photo of %s', 'bookit-booking-system'), $staff['full_name'])); ?>"
                                loading="lazy"
                            />
                        <?php else: ?>
                            <?php
                            // Generate initials and color
                            $initials = strtoupper(substr($staff['first_name'], 0, 1) . substr($staff['last_name'], 0, 1));
                            $colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                            $hash = 0;
                            for ($i = 0; $i < strlen($staff['full_name']); $i++) {
                                $hash = ord($staff['full_name'][$i]) + (($hash << 5) - $hash);
                            }
                            $color = $colors[abs($hash) % count($colors)];
                            ?>
                            <div class="bookit-staff-initials" style="background-color: <?php echo esc_attr($color); ?>">
                                <?php echo esc_html($initials); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <!-- Staff Info -->
                    <div class="bookit-staff-info">
                        <h3 class="bookit-staff-name"><?php echo esc_html($staff['full_name']); ?></h3>
                        
                        <?php if (!empty($staff['title'])): ?>
                            <p class="bookit-staff-title"><?php echo esc_html($staff['title']); ?></p>
                        <?php endif; ?>
                        
                        <p class="bookit-staff-price">
                            <?php echo esc_html(sprintf(__('£%s', 'bookit-booking-system'), number_format($staff['price'], 2))); ?>
                        </p>
                        
                        <?php if (!empty($staff['bio'])): ?>
                            <p class="bookit-staff-bio"><?php echo esc_html($staff['bio']); ?></p>
                        <?php endif; ?>
                    </div>
                    
                    <!-- Select Button -->
                    <button 
                        type="button" 
                        class="bookit-btn-select-staff" 
                        data-staff-id="<?php echo esc_attr($staff['id']); ?>"
                        data-staff-name="<?php echo esc_attr($staff['full_name']); ?>"
                        data-staff-price="<?php echo esc_attr($staff['price']); ?>"
                    >
                        <?php echo esc_html(sprintf(__('Select %s', 'bookit-booking-system'), $staff['first_name'])); ?> →
                    </button>
                </div>
            </div>
        <?php endforeach; ?>
        
        <!-- "No Preference" Card -->
        <div class="bookit-staff-card bookit-staff-card-no-preference" data-staff-id="0">
            <div class="bookit-staff-card-content">
                <div class="bookit-staff-photo">
                    <div class="bookit-staff-icon">
                        <span class="dashicons dashicons-randomize" aria-hidden="true"></span>
                    </div>
                </div>
                
                <div class="bookit-staff-info">
                    <h3 class="bookit-staff-name"><?php esc_html_e('No Preference', 'bookit-booking-system'); ?></h3>
                    <p class="bookit-staff-title"><?php esc_html_e('First Available', 'bookit-booking-system'); ?></p>
                    <p class="bookit-staff-price">
                        <?php echo esc_html(sprintf(__('from £%s', 'bookit-booking-system'), number_format($lowest_price, 2))); ?>
                    </p>
                    <p class="bookit-staff-bio">
                        <?php esc_html_e('We\'ll assign the first available staff member.', 'bookit-booking-system'); ?>
                    </p>
                </div>
                
                <button 
                    type="button" 
                    class="bookit-btn-select-staff" 
                    data-staff-id="0"
                    data-staff-name="No Preference"
                    data-staff-price="<?php echo esc_attr($lowest_price); ?>"
                >
                    <?php esc_html_e('Select Anyone', 'bookit-booking-system'); ?> →
                </button>
            </div>
        </div>
    </div>
</div>
```

### 3. Create REST API Endpoint

**File:** `includes/api/class-staff-api.php`

```php
<?php
/**
 * Staff Selection REST API
 */
class Bookit_Staff_API {
    
    private $session_manager;
    
    public function __construct() {
        $this->session_manager = new Bookit_Session_Manager();
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    public function register_routes() {
        register_rest_route('bookit/v1', '/staff/select', [
            'methods' => 'POST',
            'callback' => [$this, 'select_staff'],
            'permission_callback' => '__return_true',
            'args' => [
                'staff_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param >= 0;
                    }
                ]
            ]
        ]);
    }
    
    public function select_staff($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', ['status' => 403]);
        }
        
        $staff_id = absint($request->get_param('staff_id'));
        
        $this->session_manager->init();
        $wizard_data = $this->session_manager->get_wizard_data();
        
        if (empty($wizard_data['service_id'])) {
            return new WP_Error('no_service', 'Please select a service first', ['status' => 400]);
        }
        
        $service_id = $wizard_data['service_id'];
        $staff_model = new Bookit_Staff_Model();
        
        // Handle "No Preference"
        if ($staff_id === 0) {
            $lowest_price = $staff_model->get_lowest_staff_price_for_service($service_id);
            
            $wizard_data['staff_id'] = 0;
            $wizard_data['staff_name'] = 'No Preference';
            $wizard_data['staff_price'] = $lowest_price;
            $wizard_data['current_step'] = 3;
            $this->session_manager->set_wizard_data($wizard_data);
            
            return rest_ensure_response([
                'success' => true,
                'staff' => [
                    'id' => 0,
                    'name' => 'No Preference',
                    'price' => $lowest_price
                ],
                'next_step' => 3
            ]);
        }
        
        // Verify staff exists and offers service
        $staff = $staff_model->get_staff_by_id($staff_id);
        if (!$staff) {
            return new WP_Error('invalid_staff', 'Staff not found', ['status' => 404]);
        }
        
        $staff_for_service = $staff_model->get_staff_for_service($service_id);
        $staff_ids = array_column($staff_for_service, 'id');
        
        if (!in_array($staff_id, $staff_ids)) {
            return new WP_Error('staff_not_available', 'Staff does not offer this service', ['status' => 400]);
        }
        
        // Get staff price
        $staff_data = array_filter($staff_for_service, function($s) use ($staff_id) {
            return $s['id'] === $staff_id;
        });
        $staff_data = reset($staff_data);
        
        // Save to session
        $wizard_data['staff_id'] = $staff_id;
        $wizard_data['staff_name'] = $staff['full_name'];
        $wizard_data['staff_price'] = $staff_data['price'];
        $wizard_data['current_step'] = 3;
        $this->session_manager->set_wizard_data($wizard_data);
        
        return rest_ensure_response([
            'success' => true,
            'staff' => [
                'id' => $staff_id,
                'name' => $staff['full_name'],
                'price' => $staff_data['price']
            ],
            'next_step' => 3
        ]);
    }
}

new Bookit_Staff_API();
```

### 4. JavaScript (Add to booking-wizard.js)

```javascript
function initStaffSelection() {
    const selectButtons = document.querySelectorAll('.bookit-btn-select-staff');
    
    selectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const staffId = this.dataset.staffId;
            
            selectButtons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = 'Selecting...';
            });
            
            fetch(bookitWizard.restUrl + 'bookit/v1/staff/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': bookitWizard.nonce
                },
                body: JSON.stringify({ staff_id: staffId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateProgressIndicator(3);
                    goToStep(3);
                } else {
                    alert(data.message || 'Error selecting staff');
                    selectButtons.forEach(btn => btn.disabled = false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error selecting staff');
                selectButtons.forEach(btn => btn.disabled = false);
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initWizard();
    initServiceSelection();
    initStaffSelection(); // Add this
});
```

### 5. CSS (Add to booking-wizard.css)

Use the complete CSS from my previous Task 3 prompt (staff cards, grid, responsive styles).

### 6. Register Files

In `bookit-booking-system.php`:
```php
require_once BOOKIT_PLUGIN_DIR . 'includes/models/class-staff-model.php';
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-staff-api.php';
```

## Testing
- [ ] Staff display alphabetically
- [ ] Photos or initials show
- [ ] Custom pricing displays correctly
- [ ] "No Preference" shows lowest price
- [ ] Selection saves and advances to step 3
- [ ] Responsive 1/2/3 column grid
- [ ] Keyboard navigation works
- [ ] All tests pass: `npm test`

Generate complete implementation matching my exact schema (is_active not status, price not base_price, custom_price in staff_services).
```

---

## 🎯 NEXT STEPS

1. **Paste the prompt above into Cursor**
2. **Let Cursor generate the code**
3. **Test the staff selection**
4. **Come back here for Task 3 unit tests prompt**

Should I wait for you to implement, or provide the **Task 3 unit tests prompt** now as well?