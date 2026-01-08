# Phase 1 — Compliance Clarification Addendum (Binding)

**Authority:** Compliance (Final)

**Applies to:** Phases 1–3

**Status:** Binding clarification — not a scope or requirement change

---

## Purpose

This addendum resolves GDPR-related semantic ambiguities identified during Phase 1 QA & Risk review.

It **does not alter, reopen, or replace**:

* Phase 0 Product Owner requirements
* Frozen MVP scope
* Product rules or UX principles
* Reminder channel decisions (email-only, opt-in)
* Client identity requirements

Its sole purpose is to **clarify compliance semantics** required for safe, consistent implementation and auditability.

---

## Non-Negotiable Statement

This addendum is **binding** for Phases 1–3.

Any reinterpretation, extension, or deviation requires a **new Compliance escalation**.

---

## 1. Consent Model Clarification

Consent is explicitly separated into **two legally distinct constructs**.

### 1.1 Runtime (Operational) Consent

Purpose:

* Determine eligibility for reminder delivery at execution time

Rules:

* MAY reference `booking_id`
* MUST NOT reference `client_id`
* MUST NOT store contact details (email, phone)
* MUST NOT be used for analytics or secondary purposes

Lifecycle:

* Exists only while the booking exists
* Deleted automatically upon:

  * Booking deletion, or
  * Client erasure

Compliance Position:

* Considered personal data **only until erasure**
* Permitted under GDPR Art. 6(1)(b) and Art. 25 (privacy by design)

---

### 1.2 Audit (Post-Erasure) Consent Records

Purpose:

* Demonstrate historical lawful basis
* Satisfy accountability and audit requirements

Rules:

* Fully anonymised
* No linkage to `client_id`, `booking_id`, or contact data
* Not used at runtime

Compliance Position:

* Retention permitted for audit purposes
* Must remain non-re-identifiable

---

## 2. Client Erasure Semantics

Client erasure follows a **two-phase deletion model**.

### 2.1 Phase 1 — Erasure Trigger (Transient)

* `deleted_at` MAY be set
* Used only to:

  * Cascade deletions
  * Invalidate sessions/tokens
  * Remove operational data

Restrictions:

* This state is temporary
* No functional use beyond deletion orchestration

---

### 2.2 Phase 2 — Final Deletion (Hard Delete)

* Client row is **physically deleted**
* No client record persists
* No tombstone or retained shell remains

Compliance Position:

* This satisfies GDPR Art. 17 (Right to Erasure)
* Retaining a client shell is **not permitted**

---

## 3. Booking Records After Client Erasure

### Clarification

After client erasure:

* Non-identifying booking data MAY be retained

Permitted fields include:

* Date
* Time
* Status

Restrictions:

* No direct or indirect identifiers
* No ability to reconstruct client identity
* No secondary use beyond operational integrity

Retention:

* Must be bounded by a defined retention period
* Default expectation: align with business record-keeping needs only

---

## 4. Notification Logs

### Permitted Stored Fields

* Event type
* Timestamp
* Provider message ID

Explicitly excluded:

* Message content
* Recipient identifiers
* Contact details

Purpose:

* Delivery verification only

Restrictions:

* No secondary use
* No behavioural analysis

Retention:

* Fixed retention period required
* Must be documented and enforced

---

## 5. JWTs and Tokens (Confirmation)

* JWTs are treated as **technical authentication artifacts**
* JWT claims MUST NOT include personal data
* Booking tokens MUST be opaque
* Tokens MUST NOT encode booking IDs or client data
* Server-side token identifiers are acceptable as non-PII technical identifiers

---

## 6. Impact Statement

* No MVP features added or removed
* No product rules changed
* No UX or sequencing impact
* No reopening of Phase 0 decisions

This addendum **unblocks Phase 1 implementation** without introducing scope drift or compliance risk.

---

## 7. Freeze Declaration

All clarifications in this document are **frozen**.

Any future change requires:

* Formal Compliance escalation
* Explicit impact analysis
* Phase reset if irreversible

---

**End of Compliance Clarification Addendum**
