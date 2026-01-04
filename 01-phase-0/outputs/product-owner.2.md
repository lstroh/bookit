**Role: Product Owner**
**Scope:** Product requirements, UX framing, and product-level rules only.
**Inputs used:**

* Customer Domain Expert (UK small service businesses)
* QA & Risk feedback
* Compliance feedback (explicitly incorporated)

**No technical, architectural, or implementation decisions included.**
**All previously flagged ambiguities are explicitly resolved where authority sits with Product Owner.**

---

## 1. Core Problem (Final)

UK small service businesses lose bookings and working time because booking is fragmented, interruptive, and unreliable. Owners cannot safely accept bookings or changes while working, yet fear losing control if clients act autonomously. Existing tools either demand constant attention or allow too much flexibility. The core problem is enabling **clear, rule-based, event-style booking and self-rescheduling** that clients understand, prevents last-minute chaos, reduces owner interruptions, and preserves trust—without complex setup or loss of control over client data.

---

## 2. Success Criteria (Final)

The MVP is successful if:

1. Clients clearly understand they are booking a **fixed event/session**, not a free-form appointment.
2. Self-booking and self-rescheduling **do not increase last-minute disruption**.
3. Owners can **identify and contact any client** involved in a booking or dispute.
4. **Double bookings and silent changes never occur**.
5. Owners receive **no unnecessary notifications** during normal operation.
6. Booking, rescheduling, or cancellation completes in **under 90 seconds on mobile**.
7. Owners trust the system enough to **stop manual double-checking**.

---

## 3. MVP Feature List (≤ 9 Core Features)

> Features include **explicit product rules and UX expectations**, not technical mechanisms.

1. **Event-Based Booking (Explicitly Framed)**

   * All bookings are fixed sessions with defined start and end times.
   * UX language avoids “open appointment” expectations.

2. **Rule-Bound Availability**

   * Only slots that comply with business rules can be booked or rescheduled.

3. **Client Self-Booking**

   * Clients book directly via a shared booking link.

4. **Client Self-Rescheduling (Constrained)**

   * Allowed only within business-defined rules:

     * Cut-off time before the event
     * Limit on number of changes

5. **Client Cancellation (Constrained)**

   * Cancellation allowed only within defined rules.
   * Late cancellations are blocked or clearly communicated as not allowed.

6. **Client Identity Rule (Compliance-Mandated)**

   * **Default requirement:** full name + one contact method (email *or* phone).
   * **Optional business rule:** require both email and phone (off by default).

7. **Automatic Confirmation & Change Acknowledgement**

   * Clients receive clear confirmation after booking, rescheduling, or cancellation.
   * Confirmation explicitly states the action is final.

8. **Email Reminders (Opt-In)**

   * Email reminders are included in MVP.
   * Clients must explicitly opt in to receive reminders.

9. **Owner Booking Overview**

   * Simple view of upcoming bookings and their status (confirmed / changed / cancelled).

---

## 4. Explicitly Excluded Features (MVP “Won’t Do” List)

The MVP will **not** include:

* SMS reminders or any non-email notification channels
* Payments, deposits, or refunds
* Manual owner approval for bookings or reschedules
* Free-form or open-ended appointments
* Unlimited or same-day rescheduling
* Client chat or messaging
* CRM profiles beyond booking identity
* Dispute resolution workflows
* Marketing, promotions, or loyalty tools
* Advanced notification or reminder customisation

---

## 5. Non-Negotiable Product Principles (Final)

1. **Clarity over flexibility**

   * Clients must immediately understand what they are booking.

2. **Rules create trust**

   * Client autonomy exists only inside predictable, visible limits.

3. **Zero interruption bias**

   * Normal, rule-compliant actions must not interrupt owners.

4. **Owner confidence first**

   * If owners cannot trust the system, it has failed.

5. **Sufficient, compliant client data**

   * Enough data to operate safely and resolve issues—no more, no less.

6. **Fast, final interactions**

   * Every action results in clear, irreversible confirmation.

---

## 6. Key User Journeys (Happy Path Only)

### Journey 1: Client First Booking (Correct Mental Model)

1. Client opens booking link.
2. Sees clearly labelled event/session with fixed time.
3. Selects an available slot.
4. Enters full name and contact detail (email or phone).
5. Opts in to email reminders (optional).
6. Receives confirmation stating:

   * Time and date
   * Change/cancellation rules
   * “This booking is confirmed.”

---

### Journey 2: Client Self-Rescheduling (Within Rules)

1. Client opens reschedule link.
2. System shows only allowed alternative slots.
3. Client selects a new slot.
4. Receives confirmation that the change is final.

---

### Journey 3: Owner During Workday (No Interruption)

1. Owner is with a client.
2. Booking or reschedule happens within rules.
3. No notification is sent.
4. Schedule remains reliable.

---

### Journey 4: Cancellation Within Rules

1. Client cancels before the cut-off.
2. Slot becomes available again.
3. Owner sees updated schedule when next checked.

---

## 7. Exit Criteria (Final)

* MVP contains **fewer than 10 core features** ✔
* Client identity requirements are **explicit and compliant** ✔
* Reminder channel and consent are **unambiguous** ✔
* Event-based booking is **clearly framed and understood** ✔
* Self-rescheduling is **rule-bound and trust-preserving** ✔
* Notification volume aligns with **zero interruption bias** ✔
* Clear, documented **“won’t do” list** ✔
* No technical or implementation decisions included ✔

---

**End of Phase 0 — Product Owner Output**
