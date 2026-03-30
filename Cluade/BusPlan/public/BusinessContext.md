# Business Context

## My Business Model
- I run a website development service in the UK
- This plugin is a value-add feature, not sold standalone
- I will build websites that include this booking functionality
- Target: UK-based SMBs across multiple service industries

## Business Identity

**Business name:** Wimbledon Smart Business (short form: Wimbledon Smart)
**Primary domain:** wimbledonsmart.co.uk
**Redirect domain:** wimbledonsmart.com (301 redirect to .co.uk)
**Business email:** liron@wimbledonsmart.co.uk
**Location:** Wimbledon, SW London
**Hosting:** Hostinger Agency Startup (purchased March 2026)

---

## Plugin Positioning
- Part of a complete website solution
- Differentiator for my web dev service
- Must be flexible enough for various industries
- Should reduce my custom dev time per client

## Success Criteria
- Reduces time to launch booking-enabled websites
- Clients can manage bookings without contacting me
- Professional enough to justify premium pricing
- Scalable to future mobile app

## Key Architectural Decisions

### Custom Frontend Dashboard (Confirmed)
- Business owners get separate login (NOT WP admin access)
- Clean, branded interface for booking management
- Staff can access without WordPress knowledge
- Website admin uses WP admin for plugin configuration
- Dashboard must be white-labelable (my branding or client's)

**Rationale:** 
- Differentiates my service from DIY solutions
- Professional feel justifies premium pricing
- Clients can't accidentally break their website
- Easier to upsell mobile app later (same API backend)

### User Roles Architecture
1. **WordPress Admin** - Site configuration, plugin settings (me or technical client)
2. **Business Owner** - Full dashboard access, reports, settings (frontend)
3. **Staff Member** - Limited dashboard access, their bookings only (frontend)
4. **Customer** - Booking interface only (frontend)


### Branding & White-labeling Strategy

**Dashboard Branding Options:**
1. **Default Mode:** My company branding throughout dashboard
2. **White-label Mode:** Client's logo, colors, branding (premium feature)
3. **Co-branded Mode:** Client branding + "Powered by [MyCompany]" footer

**Implementation:**
- Configurable per installation (set during website delivery)
- Logo upload, color scheme customization
- Custom domain for dashboard (e.g., bookings.clientdomain.com) vs subdirectory
- Email templates should respect branding choice

**Business Logic:**
- Standard websites = My branding (builds brand awareness)
- Premium tier = Full white-label option (upsell opportunity)
- All versions include "Powered by" in code footer (marketing)