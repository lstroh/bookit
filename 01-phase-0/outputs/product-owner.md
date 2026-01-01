**Role: Product Owner**
**Scope:** Product requirements only. No technical, architectural, or implementation decisions.
**Inputs used:** Customer Domain Expert (UK small service businesses).
**Ambiguities flagged where required.**

---

## 1. Core Problem (1 paragraph)

UK small service businesses lose bookings and time because booking management is fragmented across messages, calendars, and memory. Owners cannot reliably see real-time availability, avoid double bookings, refill cancelled slots, or send reminders without interrupting paid work. Existing tools are either too complex, too generic, or demand upfront configuration that blocks adoption. The core problem is enabling **fast, reliable, low-effort booking and rescheduling** that works in real life—on a phone, mid-job—without admin overhead or loss of control over client data.

---

## 2. Success Criteria (Measurable, Outcome-Focused)

The MVP is successful if:

1. A business can accept its **first real booking within 15 minutes** of setup.
2. **Double bookings are impossible** in normal usage.
3. At least **80% of bookings are completed without manual back-and-forth**.
4. Clients receive **clear confirmation** of booking and changes.
5. Owners report **reduced interruptions** during working hours.
6. A solo operator can manage bookings **entirely from a mobile device**.
7. The product can be stopped without fear (data ownership is clear and respected).

---

## 3. MVP Feature List (≤ 9 Core Features)

> Focus: reduce interruptions, prevent errors, confirm certainty.

1. **Event-Based Booking**

   * Businesses define bookable events/sessions (not free-form appointments).

2. **Real-Time Availability**

   * Only available slots can be booked; no manual approval required.

3. **Client Self-Booking**

   * Clients book directly via a shareable link.

4. **Client Self-Rescheduling**

   * Clients can reschedule within defined rules.
   * Admins are notified of changes. *(Required per Domain Expert)*

5. **Automatic Booking Confirmation**

   * Clear “confirmed” feedback to clients after booking or rescheduling.

6. **Cancellation Handling**

   * Clients can cancel; freed slots return to availability.

7. **Automated Reminders**

   * Reminder messages sent before the event.
   * **Ambiguity:** channel (SMS/email) requires Compliance decision.

8. **Minimal Client Data Capture**

   * Only essential information required to complete a booking.

9. **Owner Booking Overview**

   * Simple view of upcoming bookings (today / next few days).

---

## 4. Explicitly Excluded Features (MVP “Won’t Do” List)

The following are **out of scope for MVP**:

* Payments or deposits (post-MVP only)
* Invoicing or accounting features
* Advanced staff scheduling or rota management
* Custom workflows or automation rules
* Loyalty programs or marketing tools
* Integrations with external calendars (e.g. Google sync)
* Client CRM or notes beyond booking context
* Waitlists or overbooking logic
* Complex configuration dashboards

---

## 5. Non-Negotiable Product Principles

1. **Simplicity beats flexibility**

   * Fewer choices, safer defaults.

2. **Booking certainty**

   * When a slot is booked, everyone knows it is final.

3. **Zero interruption bias**

   * The product must reduce messages, not create new ones.

4. **Mobile-first reality**

   * Every core action must work comfortably on a phone.

5. **Client data belongs to the business**

   * Clear ownership and easy exit.

6. **Fast interactions**

   * Any common action must fit within ~30–90 seconds.

7. **Trust through clarity**

   * Plain UK-focused language, no SaaS jargon.

---

## 6. Key User Journeys (Happy Path Only)

### Journey 1: First Booking (Client)

1. Client opens booking link.
2. Sees only available events.
3. Selects a slot.
4. Enters minimal details.
5. Receives immediate confirmation.

---

### Journey 2: Owner During Workday

1. Owner is with a client.
2. New booking happens automatically.
3. Owner receives confirmation (no action required).
4. Calendar is already correct.

---

### Journey 3: Client Rescheduling

1. Client opens reschedule link.
2. Chooses a new available slot.
3. Receives confirmation.
4. Owner is notified of the change.

---

### Journey 4: Cancellation & Slot Recovery

1. Client cancels booking.
2. Slot becomes available again.
3. Another client can book it without owner involvement.

---

## 7. Exit Criteria (MVP Acceptance)

* MVP contains **≤ 9 core features** (met).
* Clear, documented **“won’t do” list** (met).
* All journeys complete without manual admin steps (met).
* No technical or architectural assumptions made (met).
* Open questions clearly flagged (see below).

---

## 8. Open Questions & Required Escalation

1. **Compliance / Security**

   * Are automated reminders sent via SMS, email, or both?
   * Consent and opt-out rules must be defined.

2. **Product Scope (Resolved)**

   * Payments: **Optional post-MVP, required long-term** ✔
   * Client self-rescheduling: **Required with admin notification** ✔

---

**End of Product Owner Output**
