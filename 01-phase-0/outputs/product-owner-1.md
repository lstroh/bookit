**Role: Product Owner**
**Scope:** Product requirements only (UX framing, policies, rules).
**Inputs used:**

* Customer Domain Expert (UK small service businesses)
* QA & Risk feedback
  **No technical or implementation decisions included.**
  **Ambiguities explicitly resolved where escalated to Product Owner.**

---

## 1. Core Problem (Updated)

UK small service businesses lose bookings and working time because booking is reactive, fragmented, and uncertain. Owners cannot safely accept bookings or changes without interrupting paid work, yet fear losing control if clients act autonomously. The core problem is to provide **clear, rule-based, event-style booking and rescheduling** that clients intuitively understand, prevents chaos (last-minute changes, double bookings), and gives owners confidence—without increasing notifications or admin burden.

---

## 2. Success Criteria (Updated)

The MVP is successful if:

1. **Clients correctly understand what they are booking** (a session/event, not an open-ended appointment).
2. **Self-rescheduling does not increase operational disruption** (no last-minute chaos).
3. Owners can **identify and contact any client involved in a dispute**.
4. **Double bookings and silent changes never occur**.
5. Owners do **not receive unnecessary notifications**, yet are never surprised.
6. A solo operator can manage bookings **mid-job without intervention**.
7. Owners report **increased trust**, not loss of control, after enabling self-rescheduling.

---

## 3. MVP Feature List (≤ 9 Core Features)

> MVP features updated to include **policy clarity and UX framing**, not new capabilities.

1. **Event-Based Booking (Explicitly Framed)**

   * Booking UI clearly labels sessions as fixed events with defined start/end.
   * Language avoids “appointment anytime” ambiguity.

2. **Rule-Bound Availability**

   * Only slots that respect business rules can be booked or rescheduled into.

3. **Client Self-Booking**

   * Clients book directly without owner approval.

4. **Client Self-Rescheduling (Constrained)**

   * Rescheduling allowed **only within owner-defined rules**:

     * Cut-off time before event
     * Maximum number of changes per booking

5. **Client Cancellation (Constrained)**

   * Cancellation allowed only within defined rules.
   * Late cancellations are blocked or clearly flagged.

6. **Automatic Confirmation & Change Acknowledgement**

   * Clients always receive confirmation after booking, rescheduling, or cancellation.
   * Confirms the action is final.

7. **Minimal but Sufficient Client Identity**

   * Client provides:

     * Full name
     * One reliable contact method (phone *or* email)
   * Explicitly sufficient for follow-up or disputes.

8. **Owner Booking Overview**

   * Simple list of upcoming bookings with status (confirmed / changed / cancelled).

9. **Silent-by-Default Owner Awareness**

   * Owner can see changes when checking bookings.
   * No notification flood for normal, rule-compliant actions.

---

## 4. Explicitly Excluded Features (Updated “Won’t Do” List)

The MVP will **not** include:

* Payments, deposits, or refunds
* Manual owner approval for bookings or reschedules
* Free-form appointment creation
* Unlimited or same-day rescheduling
* Client chat or messaging
* CRM profiles beyond booking identity
* Dispute handling workflows
* Marketing or reminder customisation
* Advanced notification controls

---

## 5. Non-Negotiable Product Principles (Refined)

1. **Clarity over flexibility**

   * Users must understand *what kind of booking this is*.

2. **Rules create trust**

   * Client autonomy exists only inside clear, predictable limits.

3. **Zero interruption bias**

   * No notification unless something breaks a rule or needs attention.

4. **Owner confidence first**

   * If owners don’t trust the system, they will disable it.

5. **Sufficient data, not minimal for its own sake**

   * Only data needed to operate safely and resolve issues.

6. **Fast, final interactions**

   * Every action gives clear, irreversible confirmation.

---

## 6. Key User Journeys (Happy Path Only)

### Journey 1: Client First Booking (Correct Mental Model)

1. Client opens booking link.
2. Sees clearly labelled session/event with fixed time.
3. Selects available slot.
4. Enters name + contact detail.
5. Receives confirmation stating:

   * Time
   * Change/cancellation rules
   * “This booking is confirmed.”

---

### Journey 2: Client Rescheduling (Responsible Autonomy)

1. Client opens reschedule link.
2. System shows only allowed alternative slots.
3. Client selects new slot.
4. Receives confirmation that change is final.
5. Owner sees updated booking when checking schedule.

---

### Journey 3: Owner During Workday (No Interruption)

1. Owner is with a client.
2. Booking or reschedule occurs within rules.
3. No notification is sent.
4. Schedule remains reliable.

---

### Journey 4: Cancellation Within Rules

1. Client cancels before cut-off.
2. Slot becomes available again.
3. Owner sees updated availability later.

---

## 7. Exit Criteria (Revalidated)

* MVP contains **≤ 9 core features** ✔
* Event-based model is **explicitly understandable** ✔
* Self-rescheduling is **rule-bound and predictable** ✔
* Client identity is **sufficient for disputes** ✔
* Notification load aligns with **zero interruption bias** ✔
* Clear, documented **“won’t do” list** ✔
* No technical decisions made ✔

---

## 8. Remaining Escalations (Not Resolved Here)

1. **Compliance**

   * Confirmation wording requirements
   * Reminder consent and opt-out rules

2. **Security**

   * Audit expectations for booking changes

---

**End of Updated Product Owner Output**

