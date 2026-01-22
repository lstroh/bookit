# COMPLIANCE REQUIREMENTS
## Legal Document Creation - Sprint 4-6

**Document Version:** 1.0  
**Date:** January 23, 2026  
**Status:** BACKLOG  
**Source:** UK_Compliance_Checklist_v1_0.md  
**Total Effort:** 30-43 hours  

---

## CRITICAL FOR LAUNCH (Sprint 6)

### REQ-LEGAL-001: Privacy Policy Template
**Priority:** MUST HAVE - BLOCKING LAUNCH  
**Effort:** 8-12 hours  
**Sprint:** Sprint 6 (Week 19-20)  
**Owner:** Project Lead + Legal Advisor (optional)  

**Description:**
Create comprehensive Privacy Policy compliant with UK GDPR Article 13 (transparency requirements).

**Acceptance Criteria:**
- [ ] All GDPR Article 13 elements included (see TechnicalRequirements.md §7.9)
- [ ] Data controller identity clearly stated
- [ ] Lawful basis for processing explained (contractual + consent)
- [ ] Data retention periods specified (7 years for financial records)
- [ ] All data subject rights explained (access, rectify, delete, export, object)
- [ ] Third-party data processors listed (Stripe, PayPal, Google Calendar, Email service)
- [ ] Contact details for exercising rights
- [ ] Link to ICO for complaints
- [ ] Plain English language (not legal jargon)
- [ ] Published and accessible from all pages (footer link)

**Template Source:** https://ico.org.uk/for-organisations/make-your-own-privacy-notice/

**Legal Review:** Recommended (£500-1,500)

---

### REQ-LEGAL-002: Terms & Conditions Template
**Priority:** MUST HAVE - BLOCKING LAUNCH  
**Effort:** 6-8 hours  
**Sprint:** Sprint 6 (Week 19-20)  
**Owner:** Project Lead + Legal Advisor (optional)  

**Description:**
Create Terms & Conditions compliant with Consumer Contracts Regulations 2013 and Consumer Rights Act 2015.

**Acceptance Criteria:**
- [ ] Service description clearly stated
- [ ] Pricing and payment terms
- [ ] Cancellation policy (24-hour notice, deposit forfeiture rules)
- [ ] Refund policy (timeline, conditions)
- [ ] Liability limitations (reasonable care and skill standard)
- [ ] Dispute resolution process
- [ ] Governing law (England and Wales)
- [ ] Business contact information
- [ ] Linked before payment checkout
- [ ] "I agree to Terms & Conditions" reference during booking

**Legal Review:** Recommended (£500-1,500)

---

### REQ-LEGAL-003: 14-Day Cooling-Off Waiver Consent
**Priority:** MUST HAVE  
**Effort:** 2-3 hours  
**Sprint:** Sprint 4 (Week 12-15)  
**Owner:** Developer  

**Description:**
Add explicit consent checkbox for waiving 14-day cooling-off period when service is scheduled within 14 days.

**Acceptance Criteria:**
- [ ] Checkbox on payment screen (CustomerJourney-03)
- [ ] Clear wording: "I expressly request the service to be performed before the 14-day cooling-off period expires, and I acknowledge that I will lose my right to cancel once the service begins"
- [ ] Checkbox must be checked before payment proceeds
- [ ] Consent stored in database with timestamp
- [ ] Consent included in booking confirmation email

**Location:** CustomerJourney-03-DateTimeSelectionPayment.md (payment screen)

**Regulatory Reference:** Consumer Contracts Regulations 2013, Regulation 36

---

### REQ-LEGAL-004: Data Processing Agreements Verification
**Priority:** HIGH  
**Effort:** 2-4 hours  
**Sprint:** Sprint 6 (Week 19-20)  
**Owner:** Project Lead  

**Description:**
Verify and document Data Processing Agreements (DPAs) with all third-party processors.

**Acceptance Criteria:**
- [ ] Stripe DPA confirmed (via Terms of Service)
- [ ] PayPal DPA confirmed (via Terms of Service)
- [ ] Google Calendar DPA confirmed (via Google Cloud Terms)
- [ ] Email service DPA confirmed (SendGrid/Mailgun/AWS SES - chosen provider)
- [ ] DPA locations documented
- [ ] DPAs stored in project compliance folder
- [ ] Client onboarding checklist updated with DPA references

**GDPR Requirement:** Article 28 (Processor obligations)

---

## MEDIUM PRIORITY (Sprint 5-6 or Post-Launch)

### REQ-LEGAL-005: Accessibility Statement
**Priority:** SHOULD HAVE (if targeting public sector)  
**Effort:** 4 hours  
**Sprint:** Sprint 5/6 (Week 16-20)  
**Owner:** Project Lead  

**Description:**
Create Accessibility Statement for Public Sector Bodies Accessibility Regulations 2018 compliance.

**Acceptance Criteria:**
- [ ] WCAG 2.1 AA compliance status documented
- [ ] Known accessibility issues listed (if any)
- [ ] Testing methodology described
- [ ] Contact method for accessibility issues
- [ ] Disproportionate burden assessment (if claiming exemptions)
- [ ] Published and linked from footer

**Template:** https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps

**Required for:** NHS, universities, government contractors

---

### REQ-LEGAL-006: ICO Registration Guidance
**Priority:** SHOULD HAVE  
**Effort:** 2 hours  
**Sprint:** Sprint 6 (Week 19-20)  
**Owner:** Project Lead  

**Description:**
Create guidance document for clients on ICO registration requirements.

**Acceptance Criteria:**
- [ ] Determine if registration required (most booking systems: yes)
- [ ] Step-by-step registration guide
- [ ] Fee information (£40-60/year for SMBs)
- [ ] Data processing activities to declare
- [ ] Registration timeline (before first booking)
- [ ] Add to client onboarding checklist

**ICO Reference:** https://ico.org.uk/registration/new

---

### REQ-LEGAL-007: Email Change Verification Workflow
**Priority:** SHOULD HAVE (GDPR Right to Rectification)  
**Effort:** 6-8 hours  
**Sprint:** Sprint 5 OR v1.1 (Week 16-18 or post-launch)  
**Owner:** Developer  

**Description:**
Implement secure email change verification workflow to comply with GDPR Right to Rectification.

**Acceptance Criteria:**
- [ ] Customer requests email change via dashboard
- [ ] Verification email sent to OLD email address (with 15-min expiry link)
- [ ] Confirmation email sent to NEW email address (with 15-min expiry link)
- [ ] Both links must be clicked within timeframe to complete change
- [ ] Old email receives "Your email has been changed" notification
- [ ] Audit log records email change with timestamp and IP

**Alternative for Phase 1:** Business Owner can manually update email via admin dashboard (acceptable interim solution)

**Source:** Gap_Analysis_Report Critical Issue #2

---

## SUMMARY

| ID | Requirement | Priority | Effort | Sprint | Owner |
|----|-------------|----------|--------|--------|-------|
| REQ-LEGAL-001 | Privacy Policy | MUST (Blocking) | 8-12h | Sprint 6 | PM/Legal |
| REQ-LEGAL-002 | Terms & Conditions | MUST (Blocking) | 6-8h | Sprint 6 | PM/Legal |
| REQ-LEGAL-003 | 14-Day Waiver | MUST | 2-3h | Sprint 4 | Dev |
| REQ-LEGAL-004 | DPA Verification | HIGH | 2-4h | Sprint 6 | PM |
| REQ-LEGAL-005 | Accessibility Statement | SHOULD | 4h | Sprint 5/6 | PM |
| REQ-LEGAL-006 | ICO Registration Guide | SHOULD | 2h | Sprint 6 | PM |
| REQ-LEGAL-007 | Email Change Workflow | SHOULD | 6-8h | Sprint 5/v1.1 | Dev |

**Total Effort:** 30-43 hours (matches UK_Compliance_Checklist estimate)

**Critical Path:** REQ-LEGAL-001, REQ-LEGAL-002 block launch

---

**Version Control:**
- v1.0 - Initial compliance requirements (2026-01-23)

**References:**
- UK_Compliance_Checklist_v1_0.md
- Gap_Analysis_Report_WordPress_Booking_Plugin.md
- TechnicalRequirements.md §7 (GDPR)