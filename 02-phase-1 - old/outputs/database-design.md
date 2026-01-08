**Role:** WordPress Database Expert
**Phase:** 1 — Persistence Finalisation
**Status:** ✅ **Implementation-ready and LOCKED** (product + compliance incorporated)

I am acting **strictly within database authority**.
All prior ambiguities are now resolved by **Product Owner** and **Compliance** and are treated as **non-negotiable inputs**.

---

# 1. Storage Strategy (Final)

## Custom Tables vs WP Core

**Decision:** ✅ **Custom tables only**

**Final justification (unchanged, now locked):**

* High-volume relational writes (bookings, availability)
* Strong GDPR deletion and anonymisation guarantees
* Multisite-safe isolation
* No operational WP Admin usage

📌 **Rule (Frozen):**
No booking, event, client, consent, or notification data is stored in `wp_posts`, `postmeta`, `usermeta`, or any WP core tables.

---

# 2. Core Entities (Final)

The following entities are **final and complete**:

* Business
* Event
* Availability
* Client
* Booking
* Consent (audit-safe)
* Notification Log (non-PII, expiring)

---

# 3. Entity & Table Definitions (Final)

## 3.1 Business

**Table:** `bookit_business`

| Field        | PII | Notes                  |
| ------------ | --- | ---------------------- |
| `id`         | ❌   | PK                     |
| `site_id`    | ❌   | WP multisite isolation |
| `timezone`   | ❌   |                        |
| `created_at` | ❌   |                        |
| `deleted_at` | ❌   | Soft delete            |

**Retention:** Exists for site lifetime

---

## 3.2 Event

**Table:** `bookit_events`

| Field              | PII | Notes       |
| ------------------ | --- | ----------- |
| `id`               | ❌   | PK          |
| `business_id`      | ❌   | FK          |
| `title`            | ❌   |             |
| `description`      | ❌   |             |
| `duration_minutes` | ❌   |             |
| `buffer_before`    | ❌   |             |
| `buffer_after`     | ❌   |             |
| `is_active`        | ❌   |             |
| `created_at`       | ❌   |             |
| `deleted_at`       | ❌   | Soft delete |

**Retention:** Until owner deletes event

---

## 3.3 Availability

**Table:** `bookit_availability_rules`

| Field         | PII | Notes    |
| ------------- | --- | -------- |
| `id`          | ❌   | PK       |
| `event_id`    | ❌   | FK       |
| `day_of_week` | ❌   | 0–6      |
| `start_time`  | ❌   |          |
| `end_time`    | ❌   |          |
| `valid_from`  | ❌   | Optional |
| `valid_to`    | ❌   | Optional |
| `created_at`  | ❌   |          |

**Retention:** While rule is active

---

## 3.4 Client (Data Subject)

**Table:** `bookit_clients`

| Field        | PII | Notes            |
| ------------ | --- | ---------------- |
| `id`         | ❌   | PK               |
| `full_name`  | 🔴  | Required         |
| `email`      | 🔴  | Nullable         |
| `phone`      | 🔴  | Nullable         |
| `created_at` | ❌   |                  |
| `deleted_at` | 🔴  | Triggers erasure |

**Rules (Frozen):**

* At least **one** contact method required
* No anonymous or placeholder clients
* Client deletion is **final and irreversible**

**Retention:**
Deleted on erasure request

---

## 3.5 Booking

**Table:** `bookit_bookings`

| Field                 | PII    | Notes                               |
| --------------------- | ------ | ----------------------------------- |
| `id`                  | ❌      | PK                                  |
| `event_id`            | ❌      | FK                                  |
| `client_id`           | 🔴 → ❌ | Nullified on erasure                |
| `start_datetime`      | ❌      | UTC                                 |
| `end_datetime`        | ❌      | UTC                                 |
| `status`              | ❌      | confirmed / cancelled / rescheduled |
| `created_at`          | ❌      |                                     |
| `cancelled_at`        | ❌      | Nullable                            |
| `rescheduled_from_id` | ❌      | Self-FK                             |
| `booking_token`       | ❌      | Public reference                    |

### **Retention (Product + Compliance Locked)**

* After client deletion:

  * `client_id` **removed**
  * Booking retained **indefinitely**
  * No placeholder identity
* Booking history is **non-PII** post-erasure

---

## 3.6 Consent (Audit-Safe)

**Table:** `bookit_consents`

| Field               | PII | Notes                   |
| ------------------- | --- | ----------------------- |
| `id`                | ❌   | PK                      |
| `consent_type`      | ❌   | reminder / confirmation |
| `channel`           | ❌   | email only              |
| `consent_timestamp` | ❌   |                         |
| `policy_version`    | ❌   |                         |
| `legal_basis`       | ❌   |                         |
| `created_at`        | ❌   |                         |

### **Critical Compliance Rule (Frozen)**

* On client erasure:

  * **All identifiers removed**
  * **No client_id**
  * **No booking_id**
* Records must be **non-linkable**

**Retention:**
Indefinite (audit-only, non-personal)

---

## 3.7 Notification Log

**Table:** `bookit_notifications`

| Field                 | PII | Notes                   |
| --------------------- | --- | ----------------------- |
| `id`                  | ❌   | PK                      |
| `booking_id`          | ❌   | Optional                |
| `type`                | ❌   | confirmation / reminder |
| `sent_at`             | ❌   |                         |
| `provider_message_id` | ❌   |                         |

**Hard Constraints (Frozen):**

* No recipient data
* No content
* No cross-linking to client
* No analytics use

**Retention:**
⏱ **Auto-expire ≤ 90 days** (compliance-required)

---

# 4. Relationships (Final)

```
Business 1 ── * Event
Event    1 ── * Availability
Event    1 ── * Booking
Booking  1 ── * Booking (reschedule chain)
Booking  0 ── * Notification
```

📌 After client erasure:

* Bookings remain
* No entity references the client

---

# 5. Index Strategy (Final)

## Booking-Critical

* `(event_id, start_datetime)`
* `(event_id, status)`
* `(start_datetime, end_datetime)`
* `booking_token` (unique)

## Availability

* `(event_id, day_of_week)`

## Client (pre-erasure only)

* `email`
* `phone`

## Multisite

* `site_id` indexed where present

---

# 6. Expected Data Growth (Validated)

| Entity             | Volume         |
| ------------------ | -------------- |
| Events             | 5–50           |
| Bookings           | 1k–50k / year  |
| Clients            | ≤ bookings     |
| Availability rules | <500           |
| Notifications      | 1–3 × bookings |

Custom tables scale comfortably for **multi-year SME usage**.

---

# 7. GDPR Field Classification (Final)

| Entity               | PII Status      |
| -------------------- | --------------- |
| Client               | 🔴 Direct       |
| Booking              | ❌ after erasure |
| Consent              | ❌ anonymised    |
| Notification         | ❌ non-personal  |
| Event / Availability | ❌               |

---

# 8. Retention Summary (Locked)

| Data               | Retention                          |
| ------------------ | ---------------------------------- |
| Client PII         | Deleted on erasure                 |
| Bookings           | Retained indefinitely (anonymised) |
| Reschedule history | Retained in full                   |
| Consent audit      | Retained anonymised                |
| Notification logs  | ≤ 90 days                          |

---

# 9. Exit Criteria — Database Phase

✅ Core entities defined
✅ Custom tables locked
✅ Relationships frozen
✅ Indexes declared
✅ Product intent applied verbatim
✅ Compliance decisions enforced
✅ GDPR erasure semantics explicit
✅ No SQL written
✅ No migrations designed

---

## **Final Sign-off — WordPress Database Expert**

The persistence model is now **fully aligned** with:

* Product Owner’s final intent
* Compliance’s frozen GDPR position
* Architecture constraints
* UK SME operational reality

The database layer can proceed to **implementation without risk of future product or compliance rework**.
