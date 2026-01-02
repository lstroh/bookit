Below is the **recreated Project Manager output**, updated to reflect:

* The **revised Product Owner input**
* QA & Risk feedback
* Explicit handling of the **WP Admin boundary risk**
* Strict adherence to PM scope (sequencing, risks, decisions only)

No solutioning, no technical design, no policy interpretation.

---

# Project Plan — Phases 0–3 (Revalidated)

**Operating Mode:** Solo developer + AI assistants
**Optimisation Goal:** Fast feedback, minimal rework, owner trust first

---

## Phase 0 — Alignment, Boundaries & Risk Lock-In

### Goal

Ensure the project can start **without scope drift, compliance rework, or operational ambiguity**, especially around **WP Admin usage** and **rule-bound autonomy**.

### Primary Outcome

A **frozen definition of “what exists where”**, what is allowed once live, and what is permanently out of bounds.

---

### Phase 0 Key Workstreams (PM View)

1. **Role Alignment & Scope Freeze**

   * Updated Product Owner requirements accepted
   * QA & Risk feedback incorporated
   * MVP feature list revalidated (≤9)

2. **WP Admin Boundary Definition (Critical)**

   * Explicitly define:

     * What counts as *first-time setup*
     * What is *never allowed* post-launch
   * Boundary documented as a **non-negotiable constraint**

3. **Escalation Closure**

   * Compliance: confirmation wording, reminder consent
   * Security: audit expectations for booking changes

---

### WP Admin Boundary — PM Definition (Non-Solution, Scope Boundary)

**Allowed (One-Time, Pre-Live Only):**

* Initial plugin activation
* Initial system bootstrap required to enable the product

**Disallowed (Operational Use):**

* Viewing bookings
* Managing availability
* Handling changes, cancellations, or clients
* Daily or recurring actions of any kind

📌 **Risk Note:**
Any Phase 1–3 work that *implicitly assumes returning to WP Admin* is a **blocking issue** and must be escalated.

---

### Early Irreversible Decisions (Must Close in Phase 0)

1. **WP Admin boundary (above)** 🔴
2. **Consent model for reminders**
3. **Confirmation wording obligations**
4. **Audit expectations for booking changes**
5. **Rule authority**

   * System rules override manual flexibility (already aligned)

These decisions are **expensive or unsafe to reverse later**.

---

### Phase 0 Validation Checkpoint (Exit Criteria)

* WP Admin boundary documented and accepted by all roles
* All escalations assigned owners and deadlines
* MVP scope frozen with no conditional features
* Phase 1 can proceed without reopening scope

---

## Phase 1 — Core Booking Certainty Loop

### Goal

Deliver **booking certainty**: clients book fixed events, rules are enforced, owners are not interrupted.

### Primary Outcome

A booking can be made safely **without owner awareness or approval**, and without future surprises.

---

### Phase 1 Focus (Sequencing Only)

* Event-based booking with explicit mental model
* Rule-bound availability
* Client self-booking
* Automatic confirmation
* Sufficient client identity capture

🚫 **Explicitly Not a Goal**

* Rescheduling
* Cancellations
* Notifications
* Owner “management” actions

---

### High-Risk Unknowns (Phase 1)

| Risk                          | Impact          |
| ----------------------------- | --------------- |
| Client misunderstands “event” | Trust loss      |
| Rules feel invisible          | Chaos later     |
| Mobile friction >90s          | Abandonment     |
| Implicit admin assumptions    | Scope violation |

---

### Phase 1 Validation Checkpoint (Exit Criteria)

* Clients clearly understand what they are booking
* Double bookings are impossible
* Every action ends with clear confirmation
* Owner can ignore the system safely
* No WP Admin involvement implied or required

---

## Phase 2 — Rule-Bound Change Handling

### Goal

Allow **controlled autonomy**: clients may change plans *only inside safe, predictable rules*.

### Primary Outcome

Self-rescheduling and cancellation **do not create chaos or notifications**.

---

### Phase 2 Focus

* Client self-rescheduling (constrained)
* Client cancellation (constrained)
* Slot recovery
* Silent-by-default owner awareness

📌 Owner awareness is **pull-based**, not interruptive.

---

### Dependencies

* Phase 1 proven stable
* Compliance decisions resolved:

  * Confirmation language
  * Reminder consent (even if reminders are deferred)

---

### High-Risk Unknowns (Phase 2)

| Risk                     | Impact            |
| ------------------------ | ----------------- |
| Rule edge cases          | Owner distrust    |
| Late-change expectations | Disputes          |
| Notification creep       | Interruption bias |
| “Invisible” changes      | Surprise risk     |

---

### Phase 2 Validation Checkpoint (Exit Criteria)

* Clients can only reschedule/cancel within rules
* Changes are final and acknowledged
* Owner is never surprised when checking schedule
* No notification flood introduced
* No manual intervention required

---

## Phase 3 — Owner Confidence & Adoption Readiness

### Goal

Make the system **emotionally safe to rely on** for daily operations.

### Primary Outcome

Owners trust the system enough to stop manual backups and workarounds.

---

### Phase 3 Focus

* Owner booking overview (status-based)
* Clear visibility of changes
* Data clarity and exit reassurance

🚫 **Explicitly Not a Goal**

* Payments
* Advanced controls
* Staff rotas
* Integrations
* Analytics

---

### High-Risk Unknowns (Phase 3)

| Risk                        | Impact          |
| --------------------------- | --------------- |
| Owner feels loss of control | Disable feature |
| Overview creates admin load | Abandonment     |
| Data trust unclear          | Churn           |

---

### Phase 3 Validation Checkpoint (Exit Criteria)

* Owner can check bookings in seconds
* Status (confirmed / changed / cancelled) is clear
* No operational WP Admin usage required
* Owner confidence is increased, not reduced

---

## Execution Order (Strict)

1. **Phase 0** — Boundaries & irreversible decisions
2. **Phase 1** — Booking certainty
3. **Phase 2** — Safe autonomy
4. **Phase 3** — Trust & adoption

⛔ No phase starts until the previous exit criteria are met.

---

## Key Delivery Risks (PM Summary)

| Risk                  | Phase | Mitigation               |
| --------------------- | ----- | ------------------------ |
| WP Admin scope creep  | 0–3   | Hard boundary definition |
| Compliance ambiguity  | 0–2   | Force early escalation   |
| Owner trust erosion   | 1–3   | Conservative rules       |
| Notification overload | 2     | Zero-interruption bias   |
| Solo dev overload     | All   | Hard phase gates         |

---

## Final MVP Exit Criteria

The MVP is complete when:

* All Phase 3 exit criteria are met
* WP Admin is non-operational post-setup
* Self-rescheduling is rule-bound and trusted
* No unresolved compliance or security escalations remain
* Scope remains within the defined MVP

---

**End of Project Manager output**

If you want next (still PM role only), I can provide:

* A **Phase 0 decision checklist**
* A **risk register with owners**
* A **week-by-week execution cadence**

Say which one.
