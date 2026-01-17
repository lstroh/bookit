Below is the **Project Manager output** only.
Scope strictly limited to **sequencing, phases, risks, and decision timing**.
No feature design, no architecture, no compliance interpretation.

---

# Project Plan — Phases 0–3

**Context:** Solo developer + AI assistants, fast feedback, API-first WordPress backend, GDPR-critical.

---

## Phase 0 — Foundations & Alignment (Pre-Build)

**Goal**
Create a *locked, shared understanding* of what is being built, in what order, and what must not change later.

**Primary Outcome**
The project is *safe to start building* without rework due to scope, compliance, or user-reality mismatch.

### Phase 0 Deliverables

1. **Role outputs completed & signed off**

   * Customer Domain Expert ✅
   * Product Owner ✅
   * Project Manager (this document)
2. **Explicit MVP scope freeze**

   * ≤9 features confirmed
   * “Won’t do” list confirmed
3. **Open questions logged and assigned**

   * Compliance decisions (reminders, consent)
4. **Phase gates defined (0→1, 1→2, etc.)**

### Dependencies

* Compliance & Security input **must exist** before Phase 1.
* Product Owner scope **must be frozen** before any build.

### Validation Checkpoint (Exit Criteria)

* All open questions have an owner and deadline.
* No unresolved conflicts between Product Owner and Domain Expert.
* Team agrees Phase 1 can start without revisiting scope.

---

## Phase 1 — Core Booking Loop (MVP Backbone)

**Goal**
Enable the *single most important flow*:

> A real client books → system confirms → owner does nothing.

**Primary Outcome**
A **working booking loop** that prevents double bookings and requires zero manual admin.

### In-Scope (from Product Owner)

* Event-based booking
* Real-time availability
* Client self-booking
* Automatic confirmation
* Minimal client data capture

### Explicitly Not a Goal

* Reminders
* Rescheduling
* Owner dashboards
* Polish or optimisations

### Dependencies

* JWT auth approach agreed (security dependency)
* Data ownership rules confirmed (compliance dependency)

### High-Risk Unknowns (Flagged)

* Event vs appointment mental model confusion (adoption risk)
* Latency / mobile reliability (user trust risk)

### Validation Checkpoint (Exit Criteria)

* A booking cannot be double-booked under normal usage.
* Client receives immediate confirmation.
* Owner does not need to log in or approve anything.
* Flow works on mobile in <90 seconds.

---

## Phase 2 — Change Handling & Trust Reinforcement

**Goal**
Handle *real-life disruption* safely: changes, cancellations, and reminders.

**Primary Outcome**
The system remains reliable when plans change — without owner intervention.

### In-Scope

* Client self-rescheduling (required)
* Cancellation handling
* Slot recovery
* Automated reminders (channel subject to compliance decision)
* Owner notifications (read-only)

### Dependencies

* **Compliance decision required**:

  * Reminder channel (SMS/email/both)
  * Consent + opt-out rules
* Phase 1 stability proven

### High-Risk Unknowns

* Reminder opt-out expectations (GDPR + trust risk)
* Notification fatigue for owners

### Validation Checkpoint (Exit Criteria)

* Client can reschedule without contacting owner.
* Owner is informed, not required to act.
* Cancelled slots reliably reappear.
* No new configuration required to enable this phase.

---

## Phase 3 — Owner Visibility & Adoption Readiness

**Goal**
Make the product *comfortable to live with daily* for owners.

**Primary Outcome**
Owners trust the system enough to stop manual workarounds.

### In-Scope

* Simple owner booking overview (today / next few days)
* Data clarity (what data exists, who owns it)
* Basic export / exit reassurance (non-technical)

### Explicitly Not a Goal

* Advanced reporting
* Staff rotas
* Integrations
* Payments

### Dependencies

* Proven usage of Phases 1–2
* No new compliance surface introduced

### Validation Checkpoint (Exit Criteria)

* Owner can check upcoming bookings in seconds.
* No WP Admin required for daily use.
* Clear “I can leave anytime” signal exists.

---

# Early Irreversible Decisions (Must Be Made Before Phase 1)

These decisions are **expensive or dangerous to change later**:

1. **Consent model for reminders**

   * Opt-out vs opt-in
2. **Data ownership & deletion semantics**

   * Who can delete what, when
3. **Booking confirmation authority**

   * System-confirmed vs owner-confirmed (already aligned: system-confirmed)
4. **Event definition rigidity**

   * Events as primary unit (already locked by PO)

➡️ These must be escalated to **Compliance / Product Owner** before build.

---

# High-Level Execution Order (Strict)

1. Phase 0 — Alignment & freeze
2. Phase 1 — Booking loop works end-to-end
3. Phase 2 — Handle disruption safely
4. Phase 3 — Improve daily trust & adoption

**Rule:**
No phase starts until the previous phase’s exit criteria are met.

---

# Key Delivery Risks (PM View)

| Risk                 | Phase | Impact              | Mitigation              |
| -------------------- | ----- | ------------------- | ----------------------- |
| Compliance ambiguity | 0–2   | Rework / legal risk | Force early decisions   |
| Over-scoping         | All   | Delays              | Enforce “won’t do” list |
| Mobile UX friction   | 1–3   | Adoption failure    | Validate on phone only  |
| Owner trust loss     | 2     | Abandonment         | Conservative defaults   |
| Solo dev overload    | All   | Burnout             | Hard phase gates        |

---

# Final Exit Criteria (Overall MVP)

The MVP is complete when:

* All Phase 3 exit criteria are met
* No unresolved compliance questions remain
* Scope has not exceeded the 9 core features
* Owners can book, change, and trust the system without admin work

---

**End of Project Manager output**
If you want next:
➡️ a **Phase 0 task checklist**,
➡️ a **risk register**, or
➡️ a **week-by-week execution plan**, say which and I’ll stay in PM role.
