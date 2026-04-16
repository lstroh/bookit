# SPRINT 6B-4: LEGAL DOCUMENTS
# Bookit Booking System — Wimbledon Smart
# UK-compliant Privacy Policy and Terms & Conditions templates

---

## YOUR ROLE

You are a legal document drafter producing UK-compliant template documents
for the Bookit Booking System, a WordPress plugin built by Liron under the
brand Wimbledon Smart (wimbledonsmart.co.uk). These templates will be
published on client websites by Wimbledon Smart on behalf of their clients.

**Important:** These are templates with placeholder fields for client-specific
details. They must be legally sound but are not a substitute for solicitor
review. Include a note at the top of each document stating they should be
reviewed by a solicitor before use.

Produce each document as a complete Markdown file. Liron will review and
request revisions before you proceed to the next document.

---

## LEGAL CONTEXT (RESEARCH-BACKED — DO NOT DEVIATE FROM THESE REQUIREMENTS)

### Applicable UK legislation

The following laws apply to UK service businesses using an online booking
system. All templates must comply with all of them:

**Data protection:**
- UK GDPR (retained from EU GDPR, in force since January 2021)
- Data Protection Act 2018
- Data (Use and Access) Act 2025 (core provisions in force from 5 February 2026)
  — amends UK GDPR in areas including lawful bases and international transfers

**Consumer rights:**
- Consumer Contracts (Information, Cancellation and Additional Charges)
  Regulations 2013 — governs online bookings, 14-day cooling-off period,
  and the exemption for date-specific service bookings
- Consumer Rights Act 2015 — unfair contract terms, service quality

**ICO registration:**
- Most UK businesses processing personal data electronically must register
  with the ICO and pay an annual fee
- Current fees (as of February 2025): £52/year (micro: under £632k turnover
  or fewer than 10 staff), £78/year (SME: under £36m turnover or under 250
  staff). £5 discount for Direct Debit
- Registration: ico.org.uk/fee

### What personal data the booking system processes

The plugin processes the following data categories on behalf of the business:

**Customer data:**
- First name, last name, email address, phone number
- Booking history (service, date, time, staff, status)
- Payment records (amount, method, Stripe session ID — not full card numbers)
- Special requests / notes
- Package (prepaid session bundle) ownership and redemption history
- IP address (rate limiting logs — transient, not stored long-term)
- 14-day cooling-off waiver timestamp

**Staff data:**
- Name, email, phone, job title, bio, photo URL
- Hashed password
- Working hours and availability
- Google OAuth tokens (encrypted) — if Google Calendar connected
- Notification preferences

**Third-party processors used by the plugin:**
- **Brevo** (Sendinblue SA) — transactional email delivery. UK/EU processor.
  DPA available at brevo.com/legal/termsandconditions/
- **Stripe** — payment processing. UK/EU processor.
  DPA available at stripe.com/en-gb/legal/dpa
- **Google** (Google Calendar API) — calendar sync only, if configured.
  DPA: cloud.google.com/terms/data-processing-addendum

**Hosting:** Hostinger (Lithuania-based, EU adequacy — data stored in EU)

### Lawful basis for processing

- **Contract performance** — processing customer bookings, sending
  confirmation/reminder emails, handling payments
- **Legitimate interests** — fraud prevention, system security, rate limiting
- **Legal obligation** — financial record retention (HMRC: 6 years for
  payment records)
- **Consent** — marketing emails (not part of this plugin — plugin only
  sends transactional emails)

### Data retention

- Booking records: 7 years (HMRC financial record requirement for payment data)
- Customer personal data: should be deleted/anonymised on customer request
  (GDPR right to erasure), unless retention is required for legal obligations
- Session/temporary data: deleted within 24 hours of abandoned booking

### Consumer cancellation rights — KEY POINT FOR T&Cs

Under the Consumer Contracts Regulations 2013:
- Online service bookings normally have a 14-day cooling-off period
- **Exception:** Bookings for services at a specific date and time are exempt
  from the cooling-off right — BUT only if the consumer has explicitly
  consented to waiving this right before the contract is formed
- The Bookit plugin already implements this: a mandatory waiver checkbox
  appears before payment in the booking wizard. The timestamp of waiver
  acceptance is stored in the database
- The T&Cs must reference this waiver and the business's own cancellation
  policy window (configurable in the plugin settings)

---

## DOCUMENT 1: PRIVACY POLICY TEMPLATE

**Filename:** `privacy-policy-template.md`

This is published on the client's website. It covers how the business
(the client — e.g. the salon owner) processes personal data of their
customers and staff via the Bookit booking system.

### Placeholder fields to include (in [SQUARE BRACKETS])

- `[BUSINESS NAME]` — the client's business name
- `[BUSINESS ADDRESS]` — registered/trading address
- `[BUSINESS EMAIL]` — data controller contact email
- `[WEBSITE URL]` — the client's website URL
- `[DATA RETENTION PERIOD FOR BOOKINGS]` — default 7 years, can be adjusted
- `[ICO REGISTRATION NUMBER]` — to be filled in after ICO registration

### Required sections

1. **Who we are** (data controller identity)
2. **What personal data we collect and why**
   - Customer booking data (name, email, phone, booking details)
   - Payment data (amount, method — note: full card numbers never stored)
   - Usage data (IP address for security — not retained long-term)
3. **Lawful basis for processing** (contract, legitimate interests, legal
   obligation — specify which applies to each type of processing)
4. **How we use your data**
   - Providing the booked service
   - Sending booking confirmation, reminder, and update emails
   - Processing payments
   - Complying with legal obligations (financial records)
5. **Who we share your data with** (list the three processors: Brevo,
   Stripe, Google if applicable — with their roles and DPA references)
6. **International transfers** (Brevo and Stripe process within EU/UK
   — adequate protection; Google data processed per Google DPA)
7. **How long we keep your data** (booking records: [DATA RETENTION PERIOD];
   staff data: for the duration of employment; abandoned booking sessions:
   24 hours)
8. **Your rights under UK GDPR**
   - Right to access
   - Right to rectification
   - Right to erasure (right to be forgotten)
   - Right to restrict processing
   - Right to data portability
   - Right to object
   - How to exercise each right (contact email)
9. **Cookies** (note: the booking system uses session cookies for the booking
   wizard — these are strictly necessary and do not require consent;
   any other cookies on the site are the website owner's responsibility)
10. **Security** (data encrypted in transit via HTTPS; passwords hashed;
    OAuth tokens encrypted at rest; hosted on Hostinger EU servers)
11. **Changes to this policy** (we will notify you of material changes)
12. **Contact us and complaints** (include ICO complaint right:
    ico.org.uk/make-a-complaint)

---

## DOCUMENT 2: TERMS AND CONDITIONS TEMPLATE

**Filename:** `terms-and-conditions-template.md`

This covers the contract between the business and its customers for bookings
made through the Bookit wizard. It also covers the business's policies on
cancellations, refunds, and packages.

### Placeholder fields to include (in [SQUARE BRACKETS])

- `[BUSINESS NAME]`
- `[BUSINESS ADDRESS]`
- `[BUSINESS EMAIL]`
- `[WEBSITE URL]`
- `[CANCELLATION WINDOW HOURS]` — e.g. "24 hours" (matches plugin setting)
- `[REFUND POLICY WITHIN WINDOW]` — e.g. "full refund" (matches plugin setting)
- `[REFUND POLICY OUTSIDE WINDOW]` — e.g. "no refund" (matches plugin setting)
- `[DEPOSIT PERCENTAGE OR AMOUNT]` — if deposits are required
- `[PACKAGE EXPIRY POLICY]` — e.g. "12 months from purchase date"

### Required sections

1. **About these terms** (who they apply to, what service they cover)
2. **Making a booking**
   - How bookings are made (online via the booking wizard)
   - What information is required (name, email, phone)
   - When a booking is confirmed (after payment or pay-on-arrival selection)
   - Booking confirmation email
3. **Payments**
   - Accepted payment methods (card via Stripe, pay on arrival)
   - When payment is taken (at time of booking for card; at appointment
     for pay on arrival)
   - Deposits: if a deposit is required, amount and what it covers
   - Stripe as payment processor (no card details stored by the business)
4. **Cancellation policy**
   - **14-day cooling-off waiver notice** (REQUIRED BY LAW):
     "When you complete a booking, you are asked to confirm that you
     understand the appointment is scheduled for a specific date and time,
     and that you agree to waive your statutory 14-day cancellation right
     under the Consumer Contracts Regulations 2013 so that we can confirm
     your appointment immediately. This does not affect your rights under
     our standard cancellation policy below."
   - Business cancellation window: free cancellation if cancelled at least
     [CANCELLATION WINDOW HOURS] before the appointment
   - Cancellation inside the window: [REFUND POLICY OUTSIDE WINDOW]
   - How to cancel: via the link in your confirmation email or by contacting us
   - Business-initiated cancellations: full refund always provided
5. **Refunds**
   - Stripe refunds: processed within 5–10 business days to original payment method
   - Pay on arrival: refunds processed by the business directly
   - Disputed charges: contact us before raising a dispute
6. **Session packages**
   - What a package is (prepaid bundle of sessions)
   - Package expiry: sessions expire [PACKAGE EXPIRY POLICY] from purchase
   - Unused sessions: not refunded after expiry
   - Package cancellation: unused sessions refunded pro-rata if the business
     is unable to provide the service
7. **Our obligations to you**
   - We will provide the service as described
   - We will send confirmation and reminder communications
   - If we need to cancel your appointment, we will contact you promptly
     and offer a rescheduled appointment or full refund
8. **Rescheduling**
   - Customers may reschedule via the link in their confirmation email,
     subject to availability
   - Rescheduling within [CANCELLATION WINDOW HOURS] of the appointment
     is not available online — contact us directly
9. **Liability**
   - Standard limitation of liability clause (we are not liable for
     indirect losses; our liability is limited to the amount paid for
     the service)
   - Nothing limits liability for death or personal injury through negligence
     (required under UK law — cannot be excluded)
   - Consumer Rights Act 2015: services will be provided with reasonable
     care and skill
10. **Data protection** (brief — refer to Privacy Policy for full details)
11. **Changes to these terms** (we will notify of material changes)
12. **Governing law** (English law; English courts have jurisdiction,
    subject to consumer statutory rights)
13. **Contact us**

---

## DOCUMENT 3: LEGAL CHECKLIST

**Filename:** `legal-checklist.md`

A short checklist for Liron to complete for each client before go-live.

### Sections:

1. **ICO Registration**
   - [ ] Check if client needs to register (use ICO self-assessment tool:
     ico.org.uk/for-organisations/data-protection-fee/self-assessment/)
   - [ ] Most service businesses processing customer data electronically
     will need to register — fee is £52/year (micro) or £78/year (SME)
     as of February 2025
   - [ ] Register at ico.org.uk/fee
   - [ ] Add ICO registration number to Privacy Policy
   - [ ] Note: this is the client's legal obligation, not Wimbledon Smart's

2. **Data Processing Agreements (DPAs)**
   - [ ] Brevo DPA: accepted automatically on Brevo account creation —
     confirm at app.brevo.com → Settings → Legal
   - [ ] Stripe DPA: accepted automatically — confirm at dashboard.stripe.com
     → Settings → Legal
   - [ ] Google DPA: accepted automatically for Google Cloud services —
     confirm at console.cloud.google.com → IAM & Admin → Legal
   - [ ] Document that all three DPAs are in place for each client

3. **Website legal pages**
   - [ ] Privacy Policy published at `/privacy-policy/` (or equivalent)
   - [ ] Privacy Policy linked in website footer
   - [ ] Terms & Conditions published at `/terms/` (or equivalent)
   - [ ] T&Cs linked in website footer
   - [ ] T&Cs link appears in booking wizard confirmation step (add to
     the wizard template if not already present)
   - [ ] Cooling-off waiver checkbox wording reviewed by client
   - [ ] Privacy Policy links to ICO (ico.org.uk) for complaint rights

4. **Optional (recommended)**
   - [ ] Cookie policy (if site uses non-essential cookies — analytics, etc.)
   - [ ] Professional solicitor review of Privacy Policy and T&Cs before
     first client launch

5. **Ongoing obligations**
   - [ ] Renew ICO registration annually (ICO sends renewal reminder)
   - [ ] Review Privacy Policy if new data processing activities are added
   - [ ] Review T&Cs if booking policies change (cancellation window, refunds)
   - [ ] Update Privacy Policy if new third-party processors are added
     (e.g. SMS provider, additional analytics tools)

---

## HOW TO PRODUCE THE DOCUMENTS

1. Start with Document 1 (Privacy Policy template) — produce as complete
   Markdown
2. Liron reviews and requests revisions
3. Once approved, produce Document 2 (Terms & Conditions template)
4. Liron reviews and requests revisions
5. Once approved, produce Document 3 (Legal Checklist)

Each document should be well-structured, clearly written, and UK-law compliant
based on the research provided above. Use plain English where possible — the
Privacy Policy in particular should be readable by a non-lawyer customer.

Include a disclaimer at the top of both the Privacy Policy and T&Cs:
> *This template has been prepared for use with the Bookit Booking System.
> It should be reviewed by a qualified UK solicitor before publication.
> Wimbledon Smart accepts no liability for the legal sufficiency of this
> template for your specific business circumstances.*

**Start by producing Document 1: privacy-policy-template.md**
