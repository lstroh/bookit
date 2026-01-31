# 🎉 Excellent Work on Task 1!

**Task 1 Complete:** ✅ Booking Page Structure & Routing

You've successfully built:
- ✅ Session manager with security settings
- ✅ Booking wizard shortcode
- ✅ 4-step wizard shell
- ✅ REST API endpoints
- ✅ Navigation system
- ✅ Responsive CSS
- ✅ PHPUnit tests

---

## 📊 SPRINT 1 PROGRESS UPDATE

```
Sprint 1 Progress Tracker:

✅ Task 1: Booking Page Structure & Routing (14h) - COMPLETE
⏳ Task 2: Service Selection UI (20h) - NEXT
⬜ Task 3: Staff Selection UI (18h)
⬜ Task 4: Date Picker Integration (14h)
⬜ Task 5: Time Slot Availability Algorithm (28h) 🔥
⬜ Task 6: Contact Form with Validation (16h)
⬜ Task 7: Session Management & Navigation (18h)
⬜ Task 8: Responsive Design & Accessibility (24h)

Hours Completed: 14 / 161
Tasks Completed: 1 / 8
Current Progress: 12.5%
```

---

# 🚀 TASK 2: SERVICE SELECTION UI (STEP 1)

**Sprint 1, Task 2 of 8**  
**Estimated Time:** 20 hours  
**Complexity:** Medium  

---

## 📋 TASK OVERVIEW

Build the first step of the booking wizard where customers select which service they want to book.

### What You're Building

1. **Service Display Grid** (responsive 1-3 columns)
2. **Category Filtering** (if multiple categories exist)
3. **Service Cards** with name, duration, price, description
4. **"From £X" Pricing Logic** (when staff have different rates)
5. **AJAX Session Storage** (save selected service)
6. **Validation** (prevent progression without selection)

### What You're NOT Building Yet

- ❌ Staff selection (Task 3)
- ❌ Date/time picker (Tasks 4-5)
- ❌ Actual booking creation (Sprint 2)

---

## 🏗️ ARCHITECTURE REFERENCESPerfect! Now let me get the customer journey details:Perfect! I have all the information. Here's your **Task 2 Implementation Prompt**:

---

# 🚀 TASK 2: SERVICE SELECTION UI (STEP 1)

**Sprint 1, Task 2 of 8**  
**Estimated Time:** 20 hours  
**Complexity:** Medium  

---

## 📋 TASK OVERVIEW

Build the first step of the booking wizard where customers browse and select services organized by categories.

### What You're Building

1. **Service Display System** - Query and display active services
2. **Category Organization** - Group services by categories
3. **Service Cards** - Name, duration, price, description with responsive layout
4. **"From £X" Pricing** - Calculate and display when staff have different rates
5. **Service Selection** - Click handler that saves to session via AJAX
6. **Validation** - Ensure service selected before allowing Next button

### Database Context (From Sprint 0)

You already have these tables:
- `wp_bookings_services` - Service catalog
- `wp_bookings_categories` - Service categories
- `wp_bookings_service_categories` - Junction table (many-to-many)
- `wp_bookings_staff_services` - Staff pricing per service

---

## 🏗️ ARCHITECTURE REFERENCES

### MoSCoW Requirements (Task 2 Covers):

**MUST-001:** Display all active services organized by categories (8h)  
**MUST-002:** Show service name, duration, base price, description (4h)  
**MUST-003:** Responsive layout (1 column mobile, 3 columns desktop) (6h)  
**MUST-004:** Display "From £X" when staff have different pricing (3h)  
**MUST-005:** Persist service selection in PHP session storage (2h) ← **Uses Task 1's session manager**  
**MUST-006:** Validate service selection before progression (2h)

### Key Business Rules:

1. **Only show ACTIVE services** with at least one active staff member
2. **Categories displayed alphabetically** (Phase 1 - custom ordering is Phase 2)
3. **"From £X" pricing** when staff custom prices differ from base price
4. **Services can belong to multiple categories** (junction table)
5. **Mobile-first responsive:** 1 col mobile, 2 col tablet, 3 col desktop

---

## 💻 CURSOR IMPLEMENTATION PROMPT

**Copy the entire section below and paste into Cursor Composer:**

```markdown
# TASK: Build Service Selection UI (Sprint 1, Task 2)

## Context
I'm building Step 1 of the booking wizard for "Bookit Booking System" WordPress plugin. I completed Task 1 (wizard foundation) and now need to build the service selection interface where customers choose which service to book.

## Existing Infrastructure (From Task 1)
- Session manager: `Bookit_Session_Manager` class (already built)
- Wizard shell: `public/templates/booking-wizard-shell.php` (already built)
- Step 1 template placeholder: `public/templates/booking-step-1-services.php` (needs implementation)
- REST API framework: Ready for new endpoints
- CSS framework: `public/assets/css/booking-wizard.css` (extend this)
- JS framework: `public/assets/js/booking-wizard.js` (extend this)

## Database Schema (Already Created in Sprint 0)

### Services Table
```sql
wp_bookings_services:
- id (PK)
- name VARCHAR(200)
- description TEXT
- duration INT (minutes)
- base_price DECIMAL(10,2)
- buffer_time INT (minutes)
- status ENUM('active', 'inactive')
- created_at DATETIME
```

### Categories Table
```sql
wp_bookings_categories:
- id (PK)
- name VARCHAR(100)
- description TEXT
- display_order INT
- status ENUM('active', 'inactive')
```

### Service-Category Junction Table
```sql
wp_bookings_service_categories:
- id (PK)
- service_id (FK)
- category_id (FK)
- display_order INT
```

### Staff-Service Pricing Table
```sql
wp_bookings_staff_services:
- id (PK)
- staff_id (FK)
- service_id (FK)
- custom_price DECIMAL(10,2) NULL (if NULL, use service base_price)
```

## Requirements

### 1. Create Service Model Class

**File:** `includes/models/class-service-model.php`

Create a model class with these methods:

**`get_active_services_by_category()`**
- Returns array of categories, each containing array of services
- Only include active services with at least one active staff member
- Categories sorted alphabetically
- Services within category sorted alphabetically by name
- Calculate pricing: If staff have custom prices different from base_price, return min/max

```php
// Expected return structure:
[
    'Haircuts' => [
        [
            'id' => 1,
            'name' => 'Women\'s Haircut',
            'description' => 'Cut and blow-dry...',
            'duration' => 45,
            'base_price' => 35.00,
            'min_staff_price' => 30.00,  // Lowest staff custom_price
            'max_staff_price' => 45.00,  // Highest staff custom_price
            'has_variable_pricing' => true,  // true if staff prices differ
            'categories' => ['Haircuts', 'Special Offers']  // All categories this service belongs to
        ],
        // More services...
    ],
    'Coloring' => [
        // Services in this category...
    ]
]
```

**SQL Query Logic:**
```sql
SELECT 
    s.id,
    s.name,
    s.description,
    s.duration,
    s.base_price,
    MIN(COALESCE(ss.custom_price, s.base_price)) as min_staff_price,
    MAX(COALESCE(ss.custom_price, s.base_price)) as max_staff_price,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') as categories
FROM wp_bookings_services s
INNER JOIN wp_bookings_staff_services ss ON s.id = ss.service_id
INNER JOIN wp_bookings_staff st ON ss.staff_id = st.id
INNER JOIN wp_bookings_service_categories sc ON s.id = sc.service_id
INNER JOIN wp_bookings_categories c ON sc.category_id = c.id
WHERE s.status = 'active'
  AND st.status = 'active'
  AND c.status = 'active'
GROUP BY s.id
ORDER BY c.name ASC, s.name ASC
```

**`get_service_by_id($service_id)`**
- Returns single service with full details
- Used for step navigation when returning to Step 1

### 2. Update Step 1 Template

**File:** `public/templates/booking-step-1-services.php`

Replace placeholder content with full service selection UI:

**HTML Structure:**
```php
<?php
/**
 * Booking Wizard - Step 1: Service Selection
 * 
 * @package Bookit_Booking_System
 */

// Get services organized by category
$service_model = new Bookit_Service_Model();
$services_by_category = $service_model->get_active_services_by_category();

// Check if any services exist
if (empty($services_by_category)) {
    // Show "no services available" message
    ?>
    <div class="bookit-no-services">
        <h2><?php esc_html_e('No Services Available', 'bookit-booking-system'); ?></h2>
        <p><?php esc_html_e('We\'re currently not taking new bookings. Please check back soon!', 'bookit-booking-system'); ?></p>
    </div>
    <?php
    return;
}
?>

<div class="bookit-step bookit-step-1-services">
    <h2><?php esc_html_e('Select a Service', 'bookit-booking-system'); ?></h2>
    <p class="bookit-step-intro"><?php esc_html_e('Choose the service you\'d like to book', 'bookit-booking-system'); ?></p>
    
    <?php foreach ($services_by_category as $category_name => $services): ?>
        <div class="bookit-category-section">
            <h3 class="bookit-category-title"><?php echo esc_html($category_name); ?></h3>
            
            <div class="bookit-services-grid">
                <?php foreach ($services as $service): ?>
                    <div class="bookit-service-card" data-service-id="<?php echo esc_attr($service['id']); ?>">
                        <div class="bookit-service-card-content">
                            <h4 class="bookit-service-name"><?php echo esc_html($service['name']); ?></h4>
                            
                            <div class="bookit-service-meta">
                                <span class="bookit-service-duration">
                                    <span class="dashicons dashicons-clock" aria-hidden="true"></span>
                                    <?php echo esc_html($service['duration']); ?> <?php esc_html_e('min', 'bookit-booking-system'); ?>
                                </span>
                                
                                <span class="bookit-service-price">
                                    <?php if ($service['has_variable_pricing']): ?>
                                        <?php echo esc_html(sprintf(__('from £%s', 'bookit-booking-system'), number_format($service['min_staff_price'], 2))); ?>
                                    <?php else: ?>
                                        <?php echo esc_html(sprintf(__('£%s', 'bookit-booking-system'), number_format($service['base_price'], 2))); ?>
                                    <?php endif; ?>
                                </span>
                            </div>
                            
                            <p class="bookit-service-description"><?php echo esc_html($service['description']); ?></p>
                            
                            <?php if (count($service['categories']) > 1): ?>
                                <p class="bookit-service-multi-category">
                                    💡 <?php esc_html_e('Also in:', 'bookit-booking-system'); ?>
                                    <?php echo esc_html(implode(', ', array_filter($service['categories'], function($cat) use ($category_name) {
                                        return $cat !== $category_name;
                                    }))); ?>
                                </p>
                            <?php endif; ?>
                            
                            <button 
                                type="button" 
                                class="bookit-btn-select-service" 
                                data-service-id="<?php echo esc_attr($service['id']); ?>"
                                data-service-name="<?php echo esc_attr($service['name']); ?>"
                                data-service-duration="<?php echo esc_attr($service['duration']); ?>"
                                data-service-price="<?php echo esc_attr($service['base_price']); ?>"
                            >
                                <?php esc_html_e('Book Now', 'bookit-booking-system'); ?> →
                            </button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>
```

**Key Features:**
- Loop through categories alphabetically
- Display service cards in responsive grid
- Show "from £X" when staff pricing varies
- Multi-category indicator if service in multiple categories
- Data attributes on button for JavaScript selection

### 3. Create REST API Endpoint for Service Selection

**File:** `includes/api/class-service-api.php`

Create REST endpoint to save selected service to session:

```php
<?php
/**
 * Service Selection API
 */
class Bookit_Service_API {
    
    private $session_manager;
    
    public function __construct() {
        $this->session_manager = new Bookit_Session_Manager();
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    public function register_routes() {
        register_rest_route('bookit/v1', '/service/select', [
            'methods' => 'POST',
            'callback' => [$this, 'select_service'],
            'permission_callback' => '__return_true',
            'args' => [
                'service_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    }
                ]
            ]
        ]);
    }
    
    public function select_service($request) {
        // Verify nonce
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', ['status' => 403]);
        }
        
        $service_id = absint($request->get_param('service_id'));
        
        // Verify service exists and is active
        $service_model = new Bookit_Service_Model();
        $service = $service_model->get_service_by_id($service_id);
        
        if (!$service || $service['status'] !== 'active') {
            return new WP_Error('invalid_service', 'Service not found or inactive', ['status' => 404]);
        }
        
        // Save to session
        $this->session_manager->init();
        $wizard_data = $this->session_manager->get_wizard_data();
        $wizard_data['service_id'] = $service_id;
        $wizard_data['service_name'] = $service['name'];
        $wizard_data['service_duration'] = $service['duration'];
        $wizard_data['service_price'] = $service['base_price'];
        $wizard_data['current_step'] = 2;  // Progress to step 2
        $this->session_manager->set_wizard_data($wizard_data);
        
        return rest_ensure_response([
            'success' => true,
            'service' => [
                'id' => $service_id,
                'name' => $service['name'],
                'duration' => $service['duration'],
                'price' => $service['base_price']
            ],
            'next_step' => 2
        ]);
    }
}

// Initialize
new Bookit_Service_API();
```

### 4. Add JavaScript Selection Handler

**File:** `public/assets/js/booking-wizard.js`

Add service selection functionality to existing wizard JavaScript:

```javascript
// Add to existing booking-wizard.js file

/**
 * Initialize service selection handlers
 */
function initServiceSelection() {
    const selectButtons = document.querySelectorAll('.bookit-btn-select-service');
    
    selectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const serviceId = this.dataset.serviceId;
            const serviceName = this.dataset.serviceName;
            const serviceDuration = this.dataset.serviceDuration;
            const servicePrice = this.dataset.servicePrice;
            
            // Disable button during request
            this.disabled = true;
            this.textContent = 'Selecting...';
            
            // Send AJAX request
            fetch(bookitWizard.restUrl + 'bookit/v1/service/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': bookitWizard.nonce
                },
                body: JSON.stringify({
                    service_id: serviceId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update progress indicator
                    updateProgressIndicator(2);
                    
                    // Navigate to step 2
                    goToStep(2);
                } else {
                    alert('Error selecting service. Please try again.');
                    this.disabled = false;
                    this.textContent = 'Book Now →';
                }
            })
            .catch(error => {
                console.error('Service selection error:', error);
                alert('Error selecting service. Please try again.');
                this.disabled = false;
                this.textContent = 'Book Now →';
            });
        });
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
    initWizard();  // Existing function from Task 1
    initServiceSelection();  // New function for Task 2
});
```

### 5. Add Responsive CSS

**File:** `public/assets/css/booking-wizard.css`

Add service selection styles to existing CSS file:

```css
/* Service Selection Styles */

.bookit-step-1-services {
    padding: 20px 0;
}

.bookit-step-intro {
    color: #666;
    margin-bottom: 30px;
    font-size: 1.1rem;
}

.bookit-category-section {
    margin-bottom: 40px;
}

.bookit-category-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #0073aa;
    color: #333;
}

/* Services Grid - Mobile First */
.bookit-services-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
    .bookit-services-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
    .bookit-services-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Service Card */
.bookit-service-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
}

.bookit-service-card:hover {
    border-color: #0073aa;
    box-shadow: 0 4px 12px rgba(0, 115, 170, 0.1);
    transform: translateY(-2px);
}

.bookit-service-card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.bookit-service-name {
    font-size: 1.25rem;
    margin: 0 0 12px 0;
    color: #333;
    font-weight: 600;
}

.bookit-service-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.bookit-service-duration,
.bookit-service-price {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.95rem;
    color: #666;
}

.bookit-service-price {
    font-weight: 600;
    color: #0073aa;
    font-size: 1.1rem;
}

.bookit-service-description {
    flex-grow: 1;
    color: #666;
    line-height: 1.6;
    margin-bottom: 15px;
    font-size: 0.95rem;
}

.bookit-service-multi-category {
    font-size: 0.85rem;
    color: #999;
    font-style: italic;
    margin-bottom: 15px;
}

.bookit-btn-select-service {
    width: 100%;
    padding: 12px 24px;
    background: #0073aa;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
    margin-top: auto;  /* Push button to bottom of card */
}

.bookit-btn-select-service:hover {
    background: #005a87;
}

.bookit-btn-select-service:focus {
    outline: 2px solid #0073aa;
    outline-offset: 2px;
}

.bookit-btn-select-service:disabled {
    background: #ccc;
    cursor: not-allowed;
}

/* No Services Message */
.bookit-no-services {
    text-align: center;
    padding: 60px 20px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 2px dashed #ddd;
}

.bookit-no-services h2 {
    color: #666;
    margin-bottom: 10px;
}

.bookit-no-services p {
    color: #999;
}

/* Accessibility: Focus indicators */
.bookit-service-card:focus-within {
    outline: 2px solid #0073aa;
    outline-offset: 2px;
}

/* Touch targets on mobile (WCAG 2.1) */
@media (max-width: 767px) {
    .bookit-btn-select-service {
        min-height: 44px;  /* WCAG minimum touch target */
    }
}
```

### 6. Register New Files in Main Plugin

**File:** `bookit-booking-system.php`

Add to plugin initialization (near where you load other classes):

```php
// Load service model
require_once BOOKIT_PLUGIN_DIR . 'includes/models/class-service-model.php';

// Load service API
require_once BOOKIT_PLUGIN_DIR . 'includes/api/class-service-api.php';
```

### 7. Localize Script for REST API

Update shortcode class to pass REST URL and nonce to JavaScript:

**File:** `public/class-shortcodes.php`

```php
public function enqueue_scripts() {
    wp_enqueue_script(
        'bookit-wizard',
        BOOKIT_PLUGIN_URL . 'public/assets/js/booking-wizard.js',
        ['jquery'],
        BOOKIT_VERSION,
        true
    );
    
    // Pass REST API URL and nonce to JavaScript
    wp_localize_script('bookit-wizard', 'bookitWizard', [
        'restUrl' => rest_url(),
        'nonce' => wp_create_nonce('wp_rest'),
        'ajaxUrl' => admin_url('admin-ajax.php')
    ]);
}
```

## WordPress Standards
- Follow WordPress Coding Standards for PHP
- Use `esc_html()`, `esc_attr()`, `esc_url()` for output escaping
- Use `$wpdb->prepare()` for all SQL queries with user input
- Use WordPress nonce for AJAX security
- Use `wp_localize_script()` to pass data to JavaScript
- Handle AJAX errors gracefully with user-friendly messages

## Accessibility Requirements (WCAG 2.1 AA)
- Service cards must be keyboard navigable (Tab through cards, Enter to select)
- Focus indicators visible on all interactive elements (≥2px outline)
- Color contrast ≥4.5:1 for text, ≥3:1 for UI components
- Touch targets ≥44×44px on mobile
- Screen reader support with proper ARIA labels
- Category headings use proper heading hierarchy (H2 for step, H3 for categories, H4 for service names)

## Testing Requirements

After implementation, verify:
- [ ] Services display organized by category (alphabetically)
- [ ] Service cards show all required info (name, duration, price, description)
- [ ] "From £X" displays when staff have different prices
- [ ] Multi-category indicator shows when service in multiple categories
- [ ] Clicking "Book Now" saves to session and advances to step 2
- [ ] Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] No services message displays if no active services
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible on all interactive elements
- [ ] No JavaScript console errors
- [ ] Session persists service selection on page refresh

Generate the complete implementation following WordPress best practices and the existing project architecture.
```

---

## ✅ TESTING CHECKLIST

After Cursor generates the code:

### Functional Testing

- [ ] **Services Display:** Visit booking page, services appear organized by category
- [ ] **Categories Alphabetical:** Verify categories sorted A-Z
- [ ] **Service Cards Complete:** Each card shows name, duration, price, description
- [ ] **"From £X" Pricing:** Create test data with different staff prices, verify "from" displays
- [ ] **Multi-Category:** Assign service to 2+ categories, verify "Also in:" shows
- [ ] **Service Selection:** Click "Book Now", verify AJAX call succeeds (check Network tab)
- [ ] **Session Storage:** After selection, refresh page, go back to step 1, service still selected
- [ ] **Step Progression:** After selection, automatically advances to step 2
- [ ] **No Services:** Deactivate all services in database, verify friendly message shows

### Responsive Testing

- [ ] **Mobile (320px):** 1 column grid, cards stack vertically, no horizontal scroll
- [ ] **Tablet (768px):** 2 column grid, cards side-by-side
- [ ] **Desktop (1920px):** 3 column grid, proper spacing

### Accessibility Testing

- [ ] **Keyboard Navigation:** Tab through all service cards and buttons
- [ ] **Focus Indicators:** Visible 2px outline on focused elements
- [ ] **Screen Reader:** Use NVDA/VoiceOver, verify announcements make sense
- [ ] **Touch Targets:** On mobile, buttons at least 44×44px (measure in DevTools)
- [ ] **Color Contrast:** Use WebAIM contrast checker, verify ≥4.5:1
- [ ] **Heading Hierarchy:** Use headingsMap extension, verify H2→H3→H4 order

### Database Testing

Create test data:

```sql
-- Insert test category
INSERT INTO wp_bookings_categories (name, description, display_order, status) 
VALUES ('Haircuts', 'Hair cutting services', 1, 'active');

-- Insert test service
INSERT INTO wp_bookings_services (name, description, duration, base_price, buffer_time, status) 
VALUES ('Women\'s Haircut', 'Cut and blow-dry with styling', 45, 35.00, 15, 'active');

-- Link service to category
INSERT INTO wp_bookings_service_categories (service_id, category_id, display_order) 
VALUES (1, 1, 1);

-- Insert test staff
INSERT INTO wp_bookings_staff (first_name, last_name, email, status) 
VALUES ('Emma', 'Thompson', 'emma@example.com', 'active');

-- Assign staff to service with custom price
INSERT INTO wp_bookings_staff_services (staff_id, service_id, custom_price) 
VALUES (1, 1, 45.00);
```

### PHPUnit Tests

**File:** `tests/unit/test-service-model.php`

```php
<?php
class Test_Service_Model extends WP_UnitTestCase {
    
    private $service_model;
    
    public function setUp(): void {
        parent::setUp();
        $this->service_model = new Bookit_Service_Model();
    }
    
    public function test_get_active_services_returns_array() {
        $services = $this->service_model->get_active_services_by_category();
        $this->assertIsArray($services);
    }
    
    public function test_inactive_services_excluded() {
        // Create active and inactive services
        // Verify only active returned
    }
    
    public function test_variable_pricing_detected() {
        // Create service with different staff prices
        // Verify has_variable_pricing is true
    }
}
```

Run tests:
```bash
npm test -- tests/unit/test-service-model.php
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Services Not Displaying

**Symptoms:** Empty page or "No services" message

**Solutions:**
1. Check database: Do active services exist?
   ```sql
   SELECT * FROM wp_bookings_services WHERE status = 'active';
   ```
2. Check SQL query for errors (enable `WP_DEBUG`)
3. Verify service has active staff assigned
4. Check junction table links service to category

### Issue: "From £X" Not Showing

**Symptoms:** Base price shows even when staff prices differ

**Solutions:**
1. Verify staff custom prices exist in `wp_bookings_staff_services`
2. Check SQL `COALESCE` logic in query
3. Debug: `var_dump($service['min_staff_price'], $service['max_staff_price']);`

### Issue: AJAX Request Fails

**Symptoms:** 404 or 403 error in Network tab

**Solutions:**
1. Verify REST route registered: Visit `/wp-json/bookit/v1/service/select` directly
2. Check nonce is passed correctly in headers
3. Verify `wp_localize_script` is called before script enqueued
4. Flush permalinks: Settings → Permalinks → Save

### Issue: Responsive Grid Not Working

**Symptoms:** Layout doesn't change at breakpoints

**Solutions:**
1. Check CSS media queries syntax
2. Verify viewport meta tag exists in theme header
3. Test in browser DevTools responsive mode
4. Clear browser cache

---

## 📝 GIT COMMIT MESSAGE

When task complete:

```bash
git add .
git commit -m "Sprint 1, Task 2: Service selection UI complete

- Created service model with category organization
- Implemented responsive service grid (1-3 columns)
- Added 'from £X' pricing for variable staff rates
- Built REST API endpoint for service selection
- Added JavaScript selection handler with AJAX
- Integrated with Task 1 session management
- Created comprehensive service card styling
- Added multi-category indicator for services

Refs: MUST-001 to MUST-006
Files: 5 created, 3 modified
Tests: Manual testing complete, PHPUnit tests added
"
```

---

## 🎯 COMPLETION CRITERIA

Task 2 is complete when:

- ✅ Services display in responsive grid (1-3 columns)
- ✅ Services organized by categories (alphabetical)
- ✅ Service cards show all required information
- ✅ "From £X" displays for variable pricing
- ✅ Multi-category indicator appears when relevant
- ✅ Service selection saves to session via AJAX
- ✅ Automatically progresses to step 2 after selection
- ✅ Mobile responsive (tested 320px to 1920px)
- ✅ Accessibility compliant (keyboard, screen reader, WCAG AA)
- ✅ No JavaScript console errors
- ✅ PHPUnit tests passing

---

## 📊 PROGRESS UPDATE

After Task 2 completion:

```
Sprint 1 Progress:
✅ Task 1: Booking Page Structure (14h) - COMPLETE
✅ Task 2: Service Selection UI (20h) - COMPLETE
⏳ Task 3: Staff Selection UI (18h) - NEXT

Hours Completed: 34 / 161 (21%)
Tasks Completed: 2 / 8 (25%)
```

---

**Ready to paste into Cursor?** This will build a complete, professional service selection interface that integrates perfectly with your Task 1 foundation! 🚀

Let me know when Task 2 is complete and we'll move to Task 3: Staff Selection UI!