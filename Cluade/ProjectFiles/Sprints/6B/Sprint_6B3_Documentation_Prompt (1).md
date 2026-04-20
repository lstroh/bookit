# SPRINT 6B-3: DOCUMENTATION WRITING
# Bookit Booking System — Wimbledon Smart
# Three Markdown documents to produce in this chat

---

## YOUR ROLE

You are a technical writer producing three Markdown documentation guides
for the Bookit Booking System — a WordPress plugin built by Liron under
the brand Wimbledon Smart (wimbledonsmart.co.uk).

**Before writing anything:**
1. Search the project knowledge files for relevant details using the
   search tool. Key files to query: BusinessOwner-AdminRequirements.md,
   TargetAudience.md, CustomerJourney-01 through CustomerJourney-06,
   ScopeDefinition.md, progress.md, Bookit_REST_API_Reference_Phase1.md,
   Hosting_Infrastructure_Strategy.md.
2. If anything in this prompt is unclear, or if you are unsure about
   a specific feature or workflow, **stop and ask Liron before writing**.
   Do not assume or invent details.
3. Produce each document one at a time. Liron reviews and approves
   before you move to the next.

---

## PRODUCT CONTEXT

### What Bookit is

A WordPress plugin that gives UK service businesses a customer-facing
online booking wizard and a separate business management dashboard.

**Target clients:** Salons, spas, massage therapists, physiotherapists,
photographers, coaches, consultants — UK SMBs with 1–10 staff offering
appointment-based services.

**Key selling point:** Zero marketplace commission. The business owns
its bookings and customer data completely. The dashboard is outside
WordPress admin entirely — clients never need to touch WordPress.

### The two user types (CRITICAL — drives document tone and content)

**User Type 1: Business Client (admin-role dashboard user)**
The salon owner / business manager. Accesses the Bookit Dashboard only
at `yourdomain.com/bookit-dashboard`. Never touches WordPress admin.
Not technical. Assume zero WordPress knowledge. Do not use: "plugin",
"admin panel", "wp-admin", "shortcode", "PHP", "database". Use plain
business language throughout.

**User Type 2: Liron (Wimbledon Smart — the installer)**
A developer who installs and configures the plugin on client WordPress
sites. Full WordPress knowledge. Technical language is fine. References
to files, PHP, Composer, Hostinger, Vite, migrations, etc. are
appropriate.

### How Bookit works (high level — for your reference)

**Customer booking wizard** (`/book-v2/` page, shortcode `[bookit_wizard_v2]`):
5 steps: (1) Select service → (2) Select staff → (3) Choose date & time
→ (4) Enter contact details → (5) Pay or confirm
- No customer login required — guest checkout
- Payment via Stripe card, or Pay on Arrival (£0 now, pay at appointment)
- Session packages: buy prepaid bundles, redeem sessions from wizard Step 5
- 14-day cooling-off waiver checkbox required before payment
- After completion: customer lands on `/booking-confirmed-v2/` page
- Confirmation email sent immediately (contains Add to Calendar, Cancel,
  and Reschedule magic links)

**Magic link cancel/reschedule:**
- Every confirmation email contains unique secure links
- Cancel link: customer lands on `/bookit-cancel/`, confirms cancellation
- Reschedule link: customer lands on `/bookit-reschedule/`, picks new slot
- Policy window enforced (configurable hours — e.g. 24h notice required)
- Inside policy window: cancelled/rescheduled instantly
- Outside window (too close to appointment): blocked with policy message

**Business dashboard** (`/bookit-dashboard/` path):
- Completely separate from WordPress admin
- Login with email + password (not WordPress credentials)
- Two roles: Admin (full access) and Staff (own bookings only)
- Vue 3 SPA — runs in the browser, no page reloads

**Email notifications:**
- Powered by Brevo (transactional email)
- Customer emails: confirmation, cancellation, reschedule, 24h reminder
- Staff emails: new booking assigned, reschedule, cancellation,
  reassigned to/away, daily digest, weekly digest, daily schedule

**Google Calendar:**
- One-way sync: plugin → Google Calendar
- Each staff member connects their own Google account via My Profile
- Bookings appear automatically in their calendar

**Session packages:**
- Admin creates package types (e.g. "5 sessions for £200")
- Customers buy packages via Stripe from the booking wizard
- Sessions tracked and decremented on each redemption
- Admin can view and manage customer packages from dashboard

---

## PHASE 1 FEATURES — WHAT IS AND IS NOT BUILT

**Built (Phase 1):**
- 5-step booking wizard (V2 — `[bookit_wizard_v2]`)
- Stripe card payments and Pay on Arrival
- Session packages (buy and redeem)
- Magic link cancel/reschedule
- Customer confirmation, cancellation, reschedule, reminder emails
- Staff notification emails (new booking, reschedule, cancellation,
  digest, daily schedule)
- Google Calendar one-way sync (per staff)
- Business dashboard (full admin + staff roles)
- GDPR data export and right to erasure
- Customer email change workflow (admin-initiated)
- 14-day cooling-off waiver
- UK-first: GBP only, Europe/London timezone, UK bank holiday blocking

**NOT built (Phase 2+):**
- SMS notifications (coming Phase 2)
- PayPal payments (coming Phase 2)
- Two-way Google Calendar sync (coming Phase 2)
- Recurring appointment series (coming Phase 2)
- Group bookings / classes (coming Phase 2)
- Customer self-service portal / login (coming Phase 2)
- Mobile app (coming Phase 2)
- Invoice generation (coming Phase 2)

---

## DASHBOARD FEATURES REFERENCE

Search project knowledge for full detail on each.
Summary for quick reference:

**Bookings:**
- Calendar view (day/week/month) and list view
- Filter by staff, service, status, date range
- Manual booking creation (admin and staff — staff books for themselves)
- Edit booking (change date, time, staff, service)
- Mark complete / mark no-show
- Admin cancel (with automatic refund if Stripe payment)
- Bulk actions (admin only)
- Booking statuses: pending, pending_payment, confirmed, completed,
  cancelled, no_show

**Staff management (admin only):**
- Add/edit/deactivate staff
- Set working hours per day (including split shifts)
- Assign staff to services
- Staff-specific pricing override
- Notification preferences per staff member
- Google Calendar connect/disconnect status
- Show/hide earnings to staff (toggle)

**Services & categories (admin only):**
- Add/edit/deactivate services and categories
- Duration, price, buffer time per service
- Deposit settings: none / fixed amount / percentage
- Drag-and-drop reorder

**Customers (admin only):**
- Customer list with search
- Customer profile: booking history, packages, payments
- GDPR data export (JSON)
- GDPR erasure (anonymises personal data, retains anonymised records)
- Admin-initiated email change (sends verification to new address)

**Packages:**
- Create/edit package types
- View customer packages and redemption history
- Manually cancel a customer package

**My Profile (all staff):**
- Update name, photo, bio, job title, phone
- Change password
- Set notification preferences (immediate / daily digest / weekly digest)
- Enable/disable daily schedule email
- Connect/disconnect Google Calendar

**My Availability (all staff):**
- Set regular working hours
- Block time off (one-off days, holidays, breaks)

**My Schedule (all staff):**
- Personal schedule view (own appointments only)

**Reports (admin only):**
- Revenue report (date range)
- Booking analytics
- Staff performance report
- My Stats (per staff — own earnings if enabled by admin)

**Settings (admin only):**
- Business name, address, phone, email
- Cancellation policy window (hours)
- Email provider (Brevo / wp_mail fallback)
- Brevo API key, From name, From email
- Stripe keys (test/live toggle, publishable, secret, webhook secret)
- Google Calendar: Client ID, Client Secret, fallback toggle
- Packages enable/disable toggle
- Brevo template IDs (one per notification type)
- Email queue log

**Setup wizard:**
- First-time setup on initial login
- Guides admin through: business info → first service → working hours

---

## THREE DOCUMENTS TO PRODUCE

---

### DOCUMENT 1: BUSINESS CLIENT GUIDE

**Filename:** `bookit-client-guide.md`
**Audience:** Business owner / salon manager — the admin user
**Tone:** Warm, clear, non-technical. Like a well-written product guide.
          Never mention WordPress. Never use technical terms.
**Length:** Comprehensive — this replaces a training session
**Format:** Markdown with `##` main sections, `###` subsections.
            Use numbered lists for step-by-step instructions.
            Use bullet lists for reference information.
            Each section maps to a potential short video chapter (2–4 min).

**Before writing:** Search project knowledge for
BusinessOwner-AdminRequirements.md and CustomerJourney-03,
CustomerJourney-04, CustomerJourney-05, CustomerJourney-06
to get exact UI details and flows.

#### Sections to cover:

**1. Welcome and Getting Started**
- What Bookit does for your business (2–3 sentences)
- How to log into your dashboard (URL pattern, email, password)
- The first-time setup wizard (what it asks, what it sets up)
- Overview of dashboard navigation — what each menu item does (one line)
- How to log out

**2. Managing Your Services**
- What a "service" is (e.g. "Haircut", "Deep Tissue Massage")
- Adding a new service: name, duration, price, deposit settings, buffer time
- Service categories — what they are and how to organise them
- Making a service active or inactive
- Editing and reordering services

**3. Managing Your Staff**
- Adding a new staff member: name, email, phone, photo, job title, bio
- Setting which services each staff member offers
- Setting working hours (days and times, split shifts)
- Blocking time off (holidays, one-off days, lunch breaks)
- Notification preferences — what each option means in plain English
- Making a staff member active or inactive

**4. Managing Bookings**
- Viewing today's schedule
- Calendar view vs list view — when to use each
- Filtering bookings by date, staff, service, status
- Creating a manual booking for a customer
- Editing a booking (changing date, time, staff, service)
- Marking a booking as complete or no-show
- Cancelling a booking (and what happens to the payment)
- Understanding booking statuses in plain English: pending, confirmed,
  pending payment, completed, cancelled, no-show

**5. Payments and Packages**
- How Stripe card payments work (customer pays at time of booking,
  you never see card details)
- How pay on arrival works (customer pays you in person at the appointment)
- How to mark a pay-on-arrival booking as paid
- What session packages are (prepaid bundles)
- Creating and managing package types
- Viewing a customer's packages and redemption history

**6. Your Customers**
- Viewing the customer list and searching
- Viewing a customer's profile (booking history, packages, payments)
- Changing a customer's email address (and what the customer receives)
- Exporting a customer's data (GDPR data portability)
- Deleting a customer record (GDPR right to erasure) — what gets deleted
  and what is retained for legal reasons (anonymised booking records
  kept for tax purposes — 7 years)

**7. Email Notifications**
- What emails are sent automatically to customers:
  confirmation, 24h reminder, cancellation, reschedule
- What the confirmation email contains:
  booking details, Add to Calendar button, Cancel link, Reschedule link
- How customers cancel or reschedule using the links in their email
- What emails your staff receive
- Where the email log is if you need to check whether an email was sent

**8. Settings**
- Business information (name, address, phone, email)
- Cancellation policy — what the window means and how to set it
- Email settings (who sends emails, from what name and address)
- Turning session packages on or off

**9. Understanding What Your Customers See**
- The 5 steps of the booking wizard from the customer's perspective
- What the confirmation page looks like
- What the confirmation email looks like
- How cancellation and rescheduling work from the customer's side
- What happens if a customer tries to cancel inside the policy window

**10. Getting Help**
- Who to contact: wimbledonsmart.co.uk
- What information to have ready when reporting an issue

---

### DOCUMENT 2: STAFF GUIDE

**Filename:** `bookit-staff-guide.md`
**Audience:** Individual staff members who receive bookings
**Tone:** Friendly, concise, practical. Assumes they just need to know
          their own slice. Not technical. Shorter than the client guide.
**Length:** Short — covers only what a staff member needs day-to-day
**Format:** Same Markdown conventions. Each section maps to a 1–3 min video.

**Before writing:** Search project knowledge for ScopeDefinition.md
role/permission tables and BusinessOwner-AdminRequirements.md staff
user stories. Note: staff can only see their own bookings, cannot see
all customers or revenue, cannot manage services.

#### Sections to cover:

**1. Welcome**
- What Bookit is and what it means for them (bookings assigned to them
  appear here, no phone calls needed, they can manage their own schedule)
- The dashboard URL and how to log in
- Key difference from admin role: they see their own bookings, cannot
  manage services, cannot see all customers or business-wide revenue

**2. Your Schedule**
- How to view today's appointments (My Schedule)
- How to view your upcoming schedule
- What each booking status means in plain English
- How to mark a booking complete or no-show

**3. Managing Your Availability**
- How to set your regular working hours (My Availability)
- How to block time off (holidays, one-off days, lunch breaks)

**4. Your Profile**
- Updating your name, photo, bio, job title, phone
- Changing your password
- Setting your notification preferences:
  - Immediate: email as soon as a booking is assigned to you
  - Daily digest: one email per day summarising new bookings
  - Weekly digest: one email per week
  - Daily schedule email: morning email with today's appointments

**5. Notifications You Will Receive**
- New booking assigned to you
- Booking rescheduled (with new date/time)
- Booking cancelled (removed from your schedule)
- Daily schedule email (if enabled in your preferences)

**6. Google Calendar (if connected)**
- How to connect your Google Calendar (My Profile → Google Calendar section)
- What gets added to your calendar automatically (new bookings, updates,
  cancellations)
- How to disconnect

**7. Getting Help**
- Contact your admin if you have questions about a specific booking
- Contact Wimbledon Smart for technical issues

---

### DOCUMENT 3: SETUP GUIDE (FOR LIRON)

**Filename:** `bookit-setup-guide.md`
**Audience:** Liron — the developer setting up Bookit on a client
              WordPress site
**Tone:** Technical, precise. Full WordPress and PHP knowledge assumed.
**Length:** Comprehensive reference — a practical guide not a tutorial
**Format:** Same Markdown conventions. Use code blocks for commands
            and config values.

**Before writing:** Search project knowledge for:
- Hosting_Infrastructure_Strategy.md (Brevo, Hostinger, LiteSpeed details)
- progress.md (known technical decisions — critical gotchas)
- UK_Compliance_Checklist_v1_0.md (pre-launch compliance items)
- Bookit_REST_API_Reference_Phase1.md (settings keys reference)

Key technical decisions from progress.md that MUST be included:
- LiteSpeed cache exclusion URIs (exact list)
- Three-layer cache purge after every frontend deployment
- Vite manifest hash — never add ?v= query strings to entry JS
- Google Cloud Console: app stays in Testing mode, staff Gmail must be
  added as Test Users before connecting
- Stripe config reads from wp_bookings_settings, not get_option()
- dist/ deployment: always delete entire folder on server first
- Shortcode <script> blocks must go via wp_footer, not returned from handler
- information_schema for column checks, not SHOW COLUMNS LIKE (MariaDB
  underscore wildcard issue)

#### Sections to cover:

**1. Prerequisites**
- WordPress 6.0+, PHP 8.0+ (8.2 recommended), MySQL 5.7+ or MariaDB 10.3+
- Hostinger shared hosting (Hostinger-specific notes throughout)
- LiteSpeed web server (key for cache configuration section)
- Brevo account (free plan: 300 emails/day — sufficient for most clients)
- Stripe account (test mode for setup; switch to live at go-live)
- Google Cloud Console project (for Google Calendar OAuth — per client)
- Node.js 18+ and Composer 2.0+ (for local build steps)

**2. Building Locally Before Deployment**
- PHP dependencies:
  `composer install --no-dev --optimize-autoloader`
  in `bookit-booking-system/`
- Vue dashboard:
  `npm run build` in `bookit-booking-system/dashboard/`
- Vite manifest hash explained: `dist/.vite/manifest.json` is generated,
  PHP reads it for hashed filenames (e.g. `index.DuvrpLnL.js`).
  NEVER add ?v= query strings — causes double Vue mount crash due to
  Vite's `base: './'` relative chunk imports
- Creating the zip: zip `bookit-booking-system/` folder
- dist/ is gitignored — always rebuild locally before deploying

**3. Initial Deployment**
- WordPress: Plugins → Add New → Upload Plugin → Activate
- What activation does: runs pending DB migrations, seeds default settings,
  auto-creates these pages if they don't exist:
  - `/book-v2/` — shortcode `[bookit_wizard_v2]`
  - `/booking-confirmed-v2/` — shortcode `[bookit_booking_confirmed_v2]`
  - `/bookit-cancel/` — shortcode `[bookit_cancel_booking]`
  - `/bookit-reschedule/` — shortcode `[bookit_reschedule_booking]`
  - `/my-packages/` — shortcode `[bookit_my_packages]`
  - `/bookit-email-changed/` — shortcode `[bookit_email_changed]`
- Post-activation checklist: confirm pages exist, no PHP errors,
  dashboard accessible at `/bookit-dashboard/`

**4. LiteSpeed Cache Configuration (CRITICAL — do this before anything else)**
- Why: without exclusions, dashboard login loops endlessly, wizard sessions
  fail, REST API responses are cached and served stale
- In LiteSpeed Cache plugin → Exclude → Do Not Cache URIs, add:
  ```
  /bookit-dashboard/
  /bookit-dashboard/app/
  /bookit-dashboard/setup/
  /bookit-dashboard/logout/
  /book-v2/
  /booking-confirmed-v2/
  /my-packages/
  /bookit-cancel/
  /bookit-reschedule/
  /bookit-email-changed/
  /wp-json/bookit/
  ```
- Three-layer cache purge required after every frontend deployment:
  1. LiteSpeed Cache plugin → Purge All
  2. Hostinger hPanel → Cache Manager → Purge All
  3. Hostinger hPanel → CDN → Purge Cache
  (CDN is the most persistent — always purge all three in order)
- Always verify in incognito with DevTools Network tab (disable cache)

**5. First-Run Setup Wizard**
- Access: `/bookit-dashboard/setup/`
- Creates first admin account, sets business name and contact details
- After completion: redirects to `/bookit-dashboard/app/`

**6. Email Configuration (Brevo)**
- Create Brevo account, verify sender domain (SPF + DKIM required)
- Generate Brevo API key (Settings → API Keys → Create API Key)
- In Bookit Dashboard → Settings → Email:
  - Provider: Brevo
  - API Key: enter key (stored encrypted, masked as SAVED after save)
  - From Name: client business name
  - From Email: verified sender address
- Send test email to verify delivery
- Free plan: 300 emails/day — adequate for most small clients
- Brevo template IDs: optional. If left blank, pre-rendered HTML emails
  are sent (fully functional). Template IDs enable Brevo-designed templates.
- Staff notification emails pass booking field params to Brevo:
  `{{ params.service_name }}`, `{{ params.customer_first }}` etc.

**7. Stripe Configuration**
- Dashboard → Settings → Payments
- Enter test publishable key and test secret key
- Register webhook in Stripe Dashboard:
  - Endpoint: `https://clientdomain.com/wp-json/bookit/v1/stripe/webhook`
  - Events to listen for: `checkout.session.completed`, `charge.refunded`
- Enter webhook signing secret in Dashboard → Settings → Payments
- Test mode: complete a test booking with card `4242 4242 4242 4242`
- IMPORTANT: Stripe config is read from `wp_bookings_settings` table
  directly via `$wpdb->get_var()` — never from `get_option()`.
  This is by design — do not change this pattern.
- Switching to live at go-live: swap keys, register live webhook,
  flip mode dropdown — 5-minute task

**8. Google Calendar OAuth Setup (per client)**
- Each client needs its own Google Cloud Console project
  (redirect URIs are domain-specific)
- Steps:
  1. console.cloud.google.com → New Project → name it e.g. "ClientName Bookit"
  2. Enable Google Calendar API
  3. Configure OAuth consent screen:
     - User type: External
     - App name: client business name
     - Authorised domain: client domain
     - Scopes: `https://www.googleapis.com/auth/calendar.events`
     + `openid` + `email`
  4. Add all staff Gmail addresses to Test Users list
     (REQUIRED — "Access blocked" error if staff not in list)
     Maximum 100 Test Users — sufficient for all small client installs
  5. Create OAuth 2.0 Client ID (Web application type):
     - Redirect URI:
       `https://clientdomain.com/wp-json/bookit/v1/google-calendar/callback`
       (must match exactly — no trailing slash, https, correct subdomain)
  6. Copy Client ID and Client Secret
- In Dashboard → Settings → Integrations:
  - Google Client ID: enter (displayed plain)
  - Google Client Secret: enter (stored encrypted, masked as SAVED)
  - Fallback calendar: if enabled, bookings where staff has no Google
    connection sync to first connected admin calendar
- Staff connect individually via My Profile → Google Calendar → Connect
- Store Client Secret in password manager (not notes)

**9. Configuring Services and Staff**
- Create service categories first (services are grouped into them)
- Create services: name, duration (minutes), price, buffer time,
  deposit (none / fixed / percentage)
- Create staff: name, email (used for dashboard login), phone, role
  (admin or staff)
- Assign staff to services (staff only appear in wizard for their services)
- Set working hours per staff member (supports split shifts — add multiple
  time ranges per day)

**10. Deploying Updates**
- Build locally: `composer install --no-dev` + `npm run build`
- dist/ deployment procedure:
  1. Connect to Hostinger File Manager
  2. **Delete the entire `dist/` folder** on the server
  3. Upload fresh `dist/` folder
  (Never overwrite individual files — stale Vite-hashed chunks remain
  and the browser loads mismatched JS)
- Migrations run automatically on next WordPress page load
  (version check in `Bookit_Loader::run_pending_migrations()`)
- After upload: purge all three cache layers (see §4)
- Plugin reinstall via WordPress admin does NOT reliably update dist/ —
  always deploy dist/ manually via File Manager

**11. Known Technical Gotchas**

Document all of these — they are non-obvious and cost significant
debugging time when encountered:

- **Stripe config must come from wp_bookings_settings** — never
  `get_option()`. If Stripe appears unconfigured despite keys being set,
  this is the first thing to check.
- **applicable_service_ids filtering** — always PHP `json_decode()` +
  `in_array()`, never SQL `JSON_CONTAINS()` (MariaDB 11.4 incompatibility)
- **get_full_booking() in lifecycle hooks** — must NOT filter
  `deleted_at IS NULL`. Cancellation hook fires after soft-delete.
- **Shortcode `<script>` blocks** — must be output via `wp_footer` action,
  not returned from the shortcode handler. WordPress `the_content` pipeline
  encodes `&&` as `&#038;` in returned content regardless of
  `no_texturize_shortcodes`.
- **wp_bookings_staff.id** — is the primary key (there is no separate
  `staff_id` column). Always `WHERE id = %d`.
- **Column existence checks in migrations** — use `information_schema.COLUMNS`,
  not `SHOW COLUMNS LIKE` (MariaDB underscore wildcard matches unexpectedly).
- **wp_enqueue_media()** — must not be called at dashboard app page boot.
  Load lazily only when staff photo upload is needed.
- **OAuth state param** — do not apply `sanitize_text_field()` to base64
  OAuth state params — silently strips `+`, `/`, `=` characters.
- **Action Scheduler 3-param callbacks** — must use positional array args,
  not associative (AS and WP-Cron handle arg passing differently).

**12. Monitoring and Maintenance**
- Email queue log: Dashboard → Settings → Email Queue tab
  (check after go-live — shows sent, failed, pending rows)
- DB migrations: tracked in `wp_bookit_migrations` table
- Action Scheduler jobs (email queue + Google Calendar sync):
  WordPress Admin → Tools → Scheduled Actions
- PHP error log: Hostinger hPanel → File Manager → error_log
- Backup: Hostinger daily backup enabled by default — confirm retention
  period with client (recommend 30 days)

**13. Pre-Launch Checklist**
- [ ] Plugin activated, no PHP errors
- [ ] All pages auto-created (`/book-v2/`, `/booking-confirmed-v2/`,
      `/bookit-cancel/`, `/bookit-reschedule/`, `/my-packages/`)
- [ ] LiteSpeed cache exclusions added
- [ ] Brevo configured, test email received in inbox (not spam)
- [ ] Stripe in test mode, full end-to-end booking tested
      (use test card `4242 4242 4242 4242`)
- [ ] At least one service and one staff member created with working hours
- [ ] Google Calendar set up (if client wants it) — test connection works
- [ ] Stripe switched to live mode with live webhook registered
- [ ] Privacy Policy published on client site, linked in footer
- [ ] Terms & Conditions published on client site, linked in footer
- [ ] ICO registration confirmed for client (see legal checklist document)
- [ ] Full end-to-end live booking tested (real card, £0.50 test service)
- [ ] Accessibility Statement scheduled (within 30 days of go-live)

---

## HOW TO PRODUCE THE DOCUMENTS

1. **Search project knowledge first** — before writing each document,
   search for relevant source material. Key search queries to try:
   - "business owner dashboard features booking management"
   - "customer journey wizard steps service staff payment"
   - "staff role permissions schedule availability"
   - "Hostinger LiteSpeed cache configuration deployment"
   - "Brevo email configuration SPF DKIM API key"
   - "Google Calendar OAuth setup Test Users"
   - "known technical decisions gotchas MariaDB Stripe Vite"

2. **Ask before writing if:**
   - You are unsure whether a feature works a certain way
   - A specific UI label or menu path is unclear
   - You cannot find a detail in project knowledge
   - You are about to describe something that seems to contradict
     what you have read elsewhere

3. **Produce one document at a time.** Liron reviews and approves
   before you move to the next.

**Tone rules:**
- Client Guide: warm, plain English, zero technical terms, no WordPress
- Staff Guide: friendly, concise, practical, short sentences
- Setup Guide: technical, precise, direct — assume full WP knowledge

**Format rules:**
- `##` for main sections, `###` for subsections
- Numbered lists for step-by-step instructions
- Bullet lists for reference information
- Code blocks for commands, URLs, and config values
- Do not start any section with "In this section..."
- No excessive bold — reserve for genuine warnings only

**Start by producing Document 1: `bookit-client-guide.md`**
