# PHASE 1 MVP SCOPE - FINAL
## WordPress Booking Plugin - Executive Summary

**Document Version:** 1.0  
**Date:** January 22, 2026  
**Status:** APPROVED FOR DEVELOPMENT  
**Target Launch:** Q2 2026 (First Client)

---

## EXECUTIVE SUMMARY

### What We're Building

A WordPress booking plugin that enables UK service businesses to accept online appointments 24/7. The key differentiator is a **separate business dashboard** that doesn't require WordPress admin access—a feature no competitor offers.

### Target Market

- **Primary:** UK SMBs (1-10 staff) in service industries
- **Industries:** Salons, photographers, solo consultants, therapists, wellness providers
- **Client Profile:** Low technical comfort, need minimal training, want professional results without complexity

### Core Value Proposition

> "Professional booking websites built for UK businesses. Unlike DIY plugins that require WordPress expertise, or expensive platforms that rent you features forever while taking commissions, you get a complete solution: professional website + booking system + dashboard your team actually understands."

---

## PHASE 1 FEATURES INCLUDED

### Customer Booking Experience ✅

**Complete 4-Step Booking Flow:**
1. **Service Selection** - Categories, descriptions, pricing display
2. **Staff Selection** - Profiles, "No Preference" option, availability status
3. **Date/Time Selection** - Calendar interface, real-time availability, UK bank holidays
4. **Contact & Payment** - Guest checkout, Stripe, PayPal, Pay-on-Arrival

**Post-Booking Features:**
- Email confirmation with iCal attachment
- 24-hour reminder emails
- Magic link cancellation (7-day validity)
- Magic link rescheduling
- Automatic refund processing (within policy window)

### Business Owner Dashboard ✅

**Day-to-Day Operations:**
- Calendar and list booking views
- Manual booking creation (walk-ins)
- Booking search and filtering
- Quick actions (complete, no-show, reschedule)

**Configuration:**
- Service management (CRUD, categories)
- Staff management (profiles, working hours, split shifts)
- Staff-specific pricing
- Cancellation policy settings
- Payment gateway configuration

**Customer Management:**
- Customer database with search
- Booking history per customer
- Private notes
- CSV export for marketing
- GDPR data deletion

**Reporting (SHOULD HAVEs Included):**
- Today's schedule dashboard
- Weekly/monthly revenue totals
- Revenue by date range
- Breakdown by service/staff/payment method

### Staff Dashboard ✅

- Personal schedule view
- Upcoming appointments with customer details
- Mark appointments complete/no-show
- Block time off
- Recurring time blocks (lunch breaks)

### Integrations ✅

| Integration | Scope | Status |
|-------------|-------|--------|
| **Stripe** | Full payment + refund | MUST |
| **PayPal** | Full payment + refund | MUST |
| **Pay-on-Arrival** | Tracking only | MUST |
| **Google Calendar** | One-way sync (plugin→Google) | MUST |
| **Transactional Email** | SendGrid/Mailgun/SES | MUST |

### Technical Foundation ✅

| Requirement | Target |
|-------------|--------|
| Page Load | ≤2.0 seconds on 3G |
| Booking Completion | ≤3 minutes average |
| Concurrent Users | 50 booking attempts |
| Monthly Capacity | 10,000 bookings |
| Security | PCI DSS Level 1 SAQ A |
| Privacy | UK GDPR compliant |
| Accessibility | WCAG 2.1 AA |

---

## PHASE 1 FEATURES EXCLUDED

### Confirmed for Phase 2

| Feature | Reason | Competitive Impact |
|---------|--------|-------------------|
| **SMS Notifications** | 20-30h development, tight timeline | CRITICAL GAP - add early Phase 2 |
| 2-Way Calendar Sync | Complex conflict resolution | 5/6 competitors have |
| Recurring Appointments | 40-60h development | 5/6 competitors have |
| Package Bookings | Inventory complexity | 4/6 competitors have |
| Group Bookings | Capacity management | 4/6 competitors have |
| Multi-Location | Architecture change | Some competitors have |

### Confirmed for Phase 3+

| Feature | Reason |
|---------|--------|
| Customer Loyalty Programs | CRM territory |
| Gift Cards/Vouchers | Payment complexity |
| Mobile Apps (iOS/Android) | Web-responsive covers 90% |
| Multi-Currency | UK-first strategy |
| REST API (Public) | Schema designed, not exposed |

### Permanently Out of Scope

- POS integration
- Shift scheduling/payroll
- Marketing automation
- Social media booking
- Membership/subscription billing

---

## UNIQUE DIFFERENTIATORS

### 1. Separate Business Dashboard 🏆
**No competitor offers this.** Staff and business owners access a professional dashboard without ever touching WordPress admin. This solves the #1 pain point with WordPress booking plugins.

### 2. No Marketplace Commissions
Unlike Fresha (20% commission), you keep 100% of booking revenue. For a business earning £1,000/week from new clients, that's **£10,000/year in savings**.

### 3. UK-First Design
- GDPR compliant from Day 1
- **WCAG 2.1 AA accessible** (required for NHS, universities)
- UK phone validation, GBP currency, UK bank holidays
- UK timezone handling

### 4. Data Ownership
Clients own their data and WordPress site. No platform lock-in unlike SaaS solutions.

### 5. Month-to-Month Pricing
Cancel anytime. No annual contracts. Demonstrates confidence in the product.

---

## ESTIMATED EFFORT

### By Category

| Category | Requirements | Hours |
|----------|-------------|-------|
| Customer Booking Flow | 33 | 191h |
| Post-Booking Management | 19 | 130h |
| Business Owner Dashboard | 32 | 274h |
| Staff Dashboard | 6 | 50h |
| Technical/Security/GDPR | 30 | 134h |
| Integrations | 14 | 124h |
| Database & Infrastructure | 6 | 64h |
| Testing & QA | - | 100h |
| Documentation | - | 30h |
| **TOTAL** | **140** | **~900h** |

### Timeline

| Milestone | Week | Cumulative |
|-----------|------|------------|
| Sprint 0: Foundation | Weeks 1-2 | 2 weeks |
| Sprint 1: Core Booking | Weeks 3-5 | 5 weeks |
| Sprint 2: Payments | Weeks 6-8 | 8 weeks |
| Sprint 3: Post-Booking | Weeks 9-11 | 11 weeks |
| Sprint 4: Dashboard | Weeks 12-15 | 15 weeks |
| Sprint 5: Integration/Polish | Weeks 16-18 | 18 weeks |
| Sprint 6: Launch Prep | Weeks 19-21 | 21 weeks |

**TOTAL TIMELINE: 20-22 weeks (5-5.5 months)**

---

## SUCCESS CRITERIA

### MVP is "Launch Ready" When:

1. ✅ Customer can complete booking 24/7 (guest checkout)
2. ✅ Stripe payment processes successfully
3. ✅ PayPal payment processes successfully
4. ✅ Confirmation email sends with iCal
5. ✅ Reminder email sends 24h before
6. ✅ Cancel via magic link works
7. ✅ Reschedule via magic link works
8. ✅ Business Owner can view all bookings
9. ✅ Business Owner can create manual booking
10. ✅ Staff can view personal schedule
11. ✅ Google Calendar sync creates events
12. ✅ Refunds process automatically
13. ✅ GDPR data deletion works
14. ✅ WCAG 2.1 AA audit passes
15. ✅ Load test passes (50 concurrent users)

### First Client Success When:

1. Client goes live within 1 week of delivery
2. Client accepts ≥10 bookings in first month
3. Client reports ≤2 support issues in first month
4. Client renews for Month 2

---

## RISK ASSESSMENT

### High Risk Items

| Risk | Mitigation |
|------|------------|
| Payment integration complexity | Start Stripe early (Sprint 2), test extensively |
| Calendar sync reliability | Comprehensive error handling, retry logic |
| Performance on shared hosting | Early performance testing, optimization budget |
| Accessibility compliance | Audit at 50% and 90% completion |

### Medium Risk Items

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MoSCoW enforcement, change control |
| Third-party API changes | Monitor Stripe/PayPal changelogs |
| Email deliverability | Use transactional service, not wp_mail() |

### Quick Wins (Low Risk, High Value)

| Feature | Effort | Impact |
|---------|--------|--------|
| Service categories | 6h | Better organization |
| UK bank holiday blocking | 4h | Professional touch |
| Guest checkout | Included | Removes booking friction |
| Email confirmation | 6h | Immediate value |

---

## COMPETITIVE POSITIONING

### Feature Parity: 85-90%

Your Phase 1 MVP achieves **85-90% feature parity** with established competitors while offering unique differentiators.

### vs. WordPress Plugins (Bookly, Amelia)

| Factor | Competitor | You | Advantage |
|--------|-----------|-----|-----------|
| Dashboard | In WordPress admin | Separate dashboard | ✅ YOU |
| Setup Fee | One-time £89-349 | £995 setup | They're cheaper |
| Monthly Fee | £0-25/month (add-ons) | £99/month | They're cheaper |
| Total Year 1 | £200-400 | £2,183 | They're cheaper |
| **Complete Solution** | DIY plugin only | Website + plugin + support | ✅ YOU |
| **Staff Training** | Required (WP admin) | Not required | ✅ YOU |

**Sales Message:** "Yes, we're more expensive than DIY plugins. But we build everything for you, and your team never touches WordPress."

### vs. SaaS Platforms (Fresha, Acuity)

| Factor | Competitor | You | Advantage |
|--------|-----------|-----|-----------|
| Commission | Fresha: 20% | 0% | ✅ YOU |
| Per-User Fee | £10-20/user/month | £0 | ✅ YOU |
| Data Ownership | Platform owns | Client owns | ✅ YOU |
| Lock-In | Yes | No | ✅ YOU |
| Total Year 1 | £2,400-5,000+ | £2,183 | ✅ YOU (often) |
| **WCAG 2.1 AA** | Not guaranteed | Built-in | ✅ YOU |

**Sales Message:** "Fresha takes 20% of your new client revenue—that's £5,000/year out of your pocket. With us, you keep 100%."

---

## NEXT STEPS

### Immediate (This Week)

1. ✅ Review and approve this MoSCoW prioritization
2. ⬜ Finalize pricing model recommendation
3. ⬜ Create Sprint 0 task breakdown
4. ⬜ Set up development environment

### Week 1

1. ⬜ Database schema implementation
2. ⬜ WordPress plugin boilerplate
3. ⬜ Authentication framework
4. ⬜ Development environment complete

### Week 2

1. ⬜ Core booking flow wireframes
2. ⬜ Dashboard wireframes
3. ⬜ Begin Sprint 1 development
4. ⬜ Stripe sandbox account setup

---

## DOCUMENT APPROVAL

| Role | Name | Status | Date |
|------|------|--------|------|
| Project Lead | Liron | Pending | |
| Technical Lead | TBD | Pending | |

---

**Document Version:** 1.0  
**Created:** January 22, 2026  
**Based On:** MoSCoW Prioritized Requirements v1.0

---

*End of Phase 1 Scope Summary*
