**Role:** Solution Architect
**Scope:** System boundaries, components, data flows, trust boundaries, scalability
**Constraints respected:** API-first, WordPress backend only, no WP Admin ops, no schemas/endpoints/UI
**Inputs treated as LOCKED where stated**

---

# Phase 1 Architecture Definition — Booking Plugin (API-First, WordPress Backend)

This output defines the **implementation-ready architectural foundation** required to safely execute Phases 1–3 **without reopening frozen product or compliance decisions**.

I do **not** reinterpret product rules. I translate them into **system structure**.

---

## 1. System Boundaries (Hard)

### In-Scope

* WordPress instance acting as:

  * Database host
  * REST API provider
  * Authentication authority
* Stateless, API-driven booking system
* Event-based booking model only
* Email-based outbound communication (confirmation + optional reminders)
* JWT-secured access for owner-facing and system actions

### Explicitly Out-of-Scope

* WP Admin UI for operations
* Manual booking edits via backend
* CRM, marketing, analytics
* Payments or messaging
* SMS or multi-channel notifications
* Any non-event booking abstractions

📌 **Boundary Rule:**
If a capability requires WP Admin interaction after setup → **architecture violation**

---

## 2. High-Level Architectural Pattern

**Pattern:**

> **Modular, API-first, stateless application layered on WordPress core**

**Key characteristics:**

* WordPress is **infrastructure**, not “the app”
* Business logic isolated from WP UI
* Stateless REST requests
* Explicit trust boundaries between public clients and owner/system actions
* Designed for caching and horizontal scaling at API layer

---

## 3. Major Components (Logical)

### 3.1 Public Booking API Layer

**Responsibility**

* Exposes booking, rescheduling, cancellation flows
* Enforces **product rules** (event-based, rule-bound availability)
* Accepts minimal client identity data (per frozen rule)
* Issues immutable booking state transitions

**Characteristics**

* Publicly accessible
* Rate-limited
* Stateless
* No authentication beyond booking tokens / signed links

**Owns**

* Booking intent validation
* Rule enforcement
* Transition to “confirmed / changed / cancelled”

---

### 3.2 Owner / System API Layer (Authenticated)

**Responsibility**

* Owner access to booking data
* Business rule configuration (cut-offs, limits, identity strictness)
* Pull-based overview (no push notifications)

**Characteristics**

* JWT-protected
* No reliance on WP Admin UI
* Mobile-first consumer expected

**Owns**

* Rule configuration state
* Secure data access
* Owner trust surface

---

### 3.3 Booking Domain Engine (Core Logic)

**Responsibility**

* Centralised business logic for:

  * Event-based booking
  * Availability calculation
  * Rule-bound rescheduling and cancellation
* Guarantees:

  * No double bookings
  * No silent changes
  * Finality of actions

**Characteristics**

* Pure domain logic
* No awareness of UI or transport
* Deterministic outcomes

📌 **Critical Rule:**
All booking mutations pass through this engine — **no bypass**

---

### 3.4 Identity & Consent Module

**Responsibility**

* Capture and validate:

  * Full name
  * Contact method(s) per rule
* Store reminder consent state
* Enforce opt-in logic

**Characteristics**

* Minimal data handling
* Purpose-limited
* Explicit consent flags
* No reuse beyond booking lifecycle

**Owns**

* Consent truth
* Identity sufficiency guarantees

---

### 3.5 Notification Service (Email Only)

**Responsibility**

* Send:

  * Booking confirmations
  * Change confirmations
  * Optional reminders (opt-in only)

**Characteristics**

* Asynchronous
* Idempotent
* Strict channel enforcement (email only)

📌 **Hard Constraint:**
No message is sent without an explicit triggering event + consent check.

---

### 3.6 Persistence Layer (WordPress DB)

**Responsibility**

* Store bookings, rules, identity, consent
* Maintain booking state integrity

**Characteristics**

* Accessed only via domain logic
* No direct manipulation via Admin UI
* Supports transactional guarantees (as available in WP context)

---

## 4. Component Diagram (Textual)

```
[ Mobile / Web Client ]
           |
           v
[ Public Booking API ] ----+
                           |
[ Owner Client (JWT) ] --> [ Owner/System API ]
                           |
                           v
                  [ Booking Domain Engine ]
                           |
        +------------------+------------------+
        |                  |                  |
[ Identity & Consent ] [ Availability ] [ Rules Engine ]
        |
        v
[ Notification Service (Email) ]
        |
        v
[ Email Provider ]

All persistence → [ WordPress Database ]
```

---

## 5. Trust Boundaries

### Boundary 1: Public Client → System

* Unauthenticated
* Assumed hostile
* Strict validation
* No data leakage
* No rule override

### Boundary 2: Owner → System

* JWT-authenticated
* Higher trust, but **not omnipotent**
* Cannot violate frozen product/compliance rules

### Boundary 3: System → External Email Provider

* One-way
* Minimal payload
* No personal data reuse

---

## 6. Integration Points

### Frontend (Mobile / Web)

* Consumes REST APIs only
* No server-side rendering assumptions
* Handles booking and owner views
* Treated as **untrusted**

### Email Provider

* Transactional email only
* No marketing features
* No analytics feedback loops required

---

## 7. Scalability Considerations

### Designed For

* Stateless API scaling
* Caching of availability reads
* Horizontal scaling behind reverse proxy / CDN
* Async processing for emails

### Known Constraints

* WordPress DB as single logical datastore
* Write contention on booking slots
* Transaction semantics limited by WP stack

📌 **Mitigation Pattern:**
Centralised booking engine + atomic slot locking logic (implementation detail deferred)

---

## 8. WordPress-Specific Limitations (Acknowledged)

* No native domain-layer separation → must be enforced structurally
* WP cron reliability varies → reminders must tolerate delay
* Plugin lifecycle constraints → migrations must be controlled
* REST performance depends on hosting

These are **accepted constraints**, not design failures.

---

## 9. Explicit Assumptions (Declared)

1. WordPress hosting supports REST and background tasks
2. Email provider supports idempotent sends
3. JWT infrastructure is acceptable for owner auth
4. No multi-tenant cross-business booking in MVP
5. Single business per WP instance (unless specified later by PO)

⚠️ If any assumption is false → escalation to **Project Manager**

---

## 10. Key Architectural Risks

| Risk                         | Impact                    | Owner              |
| ---------------------------- | ------------------------- | ------------------ |
| WP Admin misuse sneaks in    | Compliance + trust breach | PM / QA            |
| Booking logic fragmented     | Double bookings           | Solution Architect |
| Consent logic bypassed       | GDPR breach               | Compliance         |
| Overcoupling to WP internals | Maintainability loss      | Solution Architect |
| Notification side-effects    | Interruption bias         | Product Owner      |

---

## 11. Exit Criteria (Architecture Phase)

Architecture is **accepted and frozen** when:

* System boundaries are agreed
* All booking mutations flow through domain engine
* No component violates frozen product or compliance rules
* No WP Admin operational dependency exists
* Phase 1 can proceed **without architectural rework**

---

**Solution Architect Sign-off:**
This architecture **fully supports** the frozen Phase 0 decisions and Phase 1 scope, and safely scales through Phases 2–3 **without reopening compliance, trust, or mental-model risks**.
