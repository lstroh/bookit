**Role: Compliance Requirements Expert**
**Jurisdiction:** UK (GDPR + Data Protection Act 2018)
**Interpretation stance:** Conservative, SME-appropriate
**Scope respected:** Legal requirements only (no UX, no technical design, no prioritisation)

---

# Compliance Feedback to QA & Risk Analyst

**Subject:** Reminders, client data sufficiency, consent, deletion

This feedback responds **only** to the flagged risks and escalations.
Where decisions are required, I clearly mark **MANDATORY**, **CONDITIONAL**, or **OUT OF SCOPE**.

---

## 1. Risk: “Reminders reduce no-shows” vs GDPR complaints

**Status:** Blocking
**Escalation Owner:** Compliance
**Decision Authority:** Compliance (cannot be overridden)

### Legal Position (UK GDPR)

Booking reminders via **SMS or email** constitute **electronic communications** and involve **personal data processing**.

Key principles triggered:

* Lawfulness (Art. 6)
* Transparency (Art. 13)
* Purpose limitation
* Right to object / withdraw consent
* PECR interaction (for electronic messages)

---

### Compliance Determination

#### A. Are reminders allowed by default?

**Answer: NO, not without a lawful basis clearly established.**

There are **two lawful paths**, but only **one is safe for MVP**.

---

### Option 1 — Explicit Consent (SAFE, RECOMMENDED)

**MANDATORY if reminders are included in MVP**

Requirements:

1. **Explicit, unbundled consent before first reminder**

   * Separate from booking acceptance
   * Clear wording: *“I agree to receive booking reminders via [SMS/email].”*

2. **Consent must be:**

   * Freely given
   * Specific to reminders
   * Revocable at any time

3. **Immediate opt-out**

   * Withdrawal must take effect **before the next reminder**
   * No “processing delay” allowed

4. **Auditability**

   * Record:

     * Timestamp
     * Channel (SMS/email)
     * Method (checkbox, link, etc.)

📌 **Compliance Note:**
If consent cannot be reliably captured and respected across channels, **reminders must be excluded from MVP**.

---

### Option 2 — “Service Message” Legitimate Interest (RISKY)

This would argue reminders are *strictly necessary* to deliver the booking service.

**Compliance view:**
❌ **High risk** for SMEs, especially SMS.
❌ Likely to generate complaints.
❌ Requires Legitimate Interest Assessment (LIA) and opt-out logic anyway.

📌 **Conclusion:** Not suitable for MVP.

---

### Compliance Decision (Binding)

> **Reminders are OPTIONAL and BLOCKED unless explicit consent is implemented.**

If Product Owner wants reminders later:

* Consent model must be designed first
* Default must be **no reminders**

---

## 2. Risk: “Minimal client data is sufficient for dispute resolution”

**Status:** Ambiguous
**Escalation Owner:** Product Owner + Compliance

---

### Legal Requirement

Under GDPR:

* Data must be **adequate, relevant, and limited** (Art. 5(1)(c))
* BUT also **sufficient for the stated purpose**

The stated purpose includes:

* Booking confirmation
* Handling disputes
* Owner contacting client if needed

---

### Compliance Determination: Minimum Required Data

For this product **minimum lawful dataset is:**

**MANDATORY**

1. **Full name** (first + last)
2. **Exactly one reliable contact method**

   * Email *or*
   * Mobile phone number

**OPTIONAL (NOT REQUIRED for MVP)**

* Address
* Notes
* Payment details
* Demographics

---

### What is NOT sufficient (Non-compliant)

❌ First name only
❌ Nickname / handle
❌ Anonymous bookings
❌ “Messenger-only” identity without contact detail

📌 **Compliance rationale:**
If the owner cannot identify or contact a client involved in a dispute, the system fails its declared purpose → unlawful data minimisation.

---

### Required Product Alignment (Escalation Outcome)

Compliance requires Product Owner to **explicitly define**:

> “Minimal client identity = full name + one contact method”

Anything less is **non-compliant**, not just risky.

---

## 3. Consent Requirements (Summary)

### Mandatory Consent Points

| Scenario                             | Consent Required | Notes                 |
| ------------------------------------ | ---------------- | --------------------- |
| Booking itself                       | ❌ No             | Contractual necessity |
| Booking confirmation                 | ❌ No             | Service message       |
| Reschedule/cancellation confirmation | ❌ No             | Service message       |
| **Reminders**                        | ✅ Yes            | Explicit, prior       |
| Marketing                            | 🚫 Out of scope  | Explicitly excluded   |

---

## 4. Data Deletion & Erasure Obligations

**Status:** Mandatory, non-negotiable

---

### Legal Requirement

Under **Right to Erasure (Art. 17)** and **Accuracy (Art. 16)**:

When data is deleted:

* It must be deleted **everywhere**
* Including:

  * Active records
  * Logs *unless legally required*
  * Caches
  * Derived views

Partial deletion is **non-compliant**.

---

### Compliance Rules

1. **Deletion must be systemic**

   * No “soft delete only” unless justified and documented
2. **Owner-initiated deletion**

   * Allowed once no legal retention obligation exists
3. **Client-requested deletion**

   * Must be honoured unless:

     * Legal obligation applies
     * Dispute window is active

📌 **Audit logs:**
Booking change logs may be retained **if**:

* They are strictly limited
* Access-controlled
* Retained for a defined period
* Not repurposed

---

## 5. Compliance Summary for QA & Risk

### Blocking Items

🔴 Reminders without explicit consent
🔴 Ambiguous definition of “minimal client data”
🔴 Delayed or partial opt-out
🔴 Incomplete data deletion

---

### Compliance-Approved Positions

✅ Booking confirmations = service messages
✅ Full name + one contact method = lawful minimum
✅ Silent-by-default owner awareness is compliant
✅ No payments simplifies compliance

---

## Required Escalation Outcomes

1. **Product Owner**

   * Explicitly accept:

     > “Minimal client data = full name + one contact method”

2. **PM / Phase 0**

   * Decide:

     * Reminders **out of MVP**, or
     * Consent model added (with cost & risk)

---

**Compliance Position (Final):**
This product can be GDPR-compliant **only if reminders are opt-in and identity is sufficient for disputes**. Any shortcut here creates regulatory risk disproportionate to MVP value.

If you need next (still Compliance role only), I can provide:

* **Consent wording constraints**
* **Retention period recommendations**
* **Right-to-erasure edge cases for bookings**

Say which one.
