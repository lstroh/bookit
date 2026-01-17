## Role: WordPress Database Expert

**Scope:** Booking data model only (create → confirm, immutable)
**Phase:** 1B
**Environment:** WordPress + MySQL/MariaDB (InnoDB)
**Multisite:** Required
**Compliance:** UK GDPR / DPA 2018

---

# 1. Storage Strategy Decision

### 1.1 Custom Tables vs `posts/postmeta`

**Decision:** ✅ **Custom tables (mandatory)**

**Rationale (non-negotiable):**

* Atomic transactions required → **not safely achievable with postmeta**
* Hard uniqueness constraints needed → **postmeta cannot enforce**
* High read/write frequency → **postmeta causes performance & locking issues**
* GDPR erasure requires **targeted deletes**, not post graph traversal
* Multisite-safe table prefixing supported

⚠️ Using `wp_posts` would violate:

* Data integrity guarantees
* Performance requirements
* Compliance traceability

---

# 2. Core Booking Tables (Phase 1B Only)

## 2.1 `wp_bookit_bookings`

**Purpose:** Authoritative, immutable booking record

### Columns

| Column            | Type               | Notes                       |
| ----------------- | ------------------ | --------------------------- |
| `id`              | BIGINT UNSIGNED PK | Internal booking ID         |
| `site_id`         | BIGINT UNSIGNED    | `get_current_blog_id()`     |
| `event_id`        | BIGINT UNSIGNED    | FK reference (logical)      |
| `event_slot_id`   | BIGINT UNSIGNED    | Slot granularity (see §2.2) |
| `client_id`       | BIGINT UNSIGNED    | Internal client reference   |
| `booking_uuid`    | CHAR(36)           | Public-safe identifier      |
| `confirmed_at`    | DATETIME (UTC)     | Creation = confirmation     |
| `created_at`      | DATETIME (UTC)     | Same as confirmed_at        |
| `pii_snapshot_id` | BIGINT UNSIGNED    | FK to PII table             |
| `consent_version` | VARCHAR(20)        | Proof of consent            |
| `consent_at`      | DATETIME (UTC)     | Consent timestamp           |

---

### Constraints

```sql
PRIMARY KEY (id)

UNIQUE KEY uniq_site_slot (site_id, event_slot_id)

UNIQUE KEY uniq_booking_uuid (booking_uuid)

KEY idx_event (site_id, event_id)

KEY idx_client (site_id, client_id)
```

### Structural Guarantees

* **Double booking prevention:**
  `UNIQUE (site_id, event_slot_id)`
* **Immutability:**
  No status column
  No update flows
  No soft delete fields

⚠️ Any additional state column = **architecture breach**

---

## 2.2 `wp_bookit_event_slots` (Read-Only Reference)

**Purpose:** Slot identity & locking anchor
**Ownership:** Created elsewhere, immutable here

### Columns (minimal reference)

| Column      | Type               |
| ----------- | ------------------ |
| `id`        | BIGINT UNSIGNED PK |
| `site_id`   | BIGINT UNSIGNED    |
| `event_id`  | BIGINT UNSIGNED    |
| `starts_at` | DATETIME (UTC)     |
| `ends_at`   | DATETIME (UTC)     |

### Constraints

```sql
UNIQUE KEY uniq_site_event_time (site_id, event_id, starts_at)
```

⚠️ **No availability flags here**
Availability is derived:

> slot is available ⇔ no row exists in `wp_bookit_bookings`

---

# 3. PII Storage (GDPR-Isolated)

## 3.1 `wp_bookit_booking_pii`

**Purpose:** Isolate personal data for erasure

### Columns

| Column       | Type               | PII             |
| ------------ | ------------------ | --------------- |
| `id`         | BIGINT UNSIGNED PK | —               |
| `site_id`    | BIGINT UNSIGNED    | —               |
| `email`      | VARCHAR(191)       | ✅               |
| `first_name` | VARCHAR(100)       | ✅               |
| `last_name`  | VARCHAR(100)       | ✅               |
| `phone`      | VARCHAR(50)        | ✅               |
| `notes`      | TEXT               | ⚠️ User-entered |
| `created_at` | DATETIME (UTC)     | —               |

### Indexes

```sql
KEY idx_site_email (site_id, email)
```

---

## 3.2 PII Identification (Explicit)

**PII Fields (GDPR-relevant):**

* email
* first_name
* last_name
* phone
* notes (free-text → assume PII)

**Non-PII:**

* booking_uuid
* event_id / slot_id
* timestamps
* consent metadata

---

# 4. Retention & Erasure Model

## 4.1 GDPR Erasure Strategy

**Rule:** Booking remains, PII is erased

### On Erasure Request

1. Delete row from `wp_bookit_booking_pii`
2. Null or replace `pii_snapshot_id` in bookings
3. Preserve booking record for:

   * Accounting
   * Capacity history
   * Fraud prevention

⚠️ Booking row **must not be deleted via booking logic**

---

## 4.2 Retention-Relevant Fields

| Field             | Reason                       |
| ----------------- | ---------------------------- |
| `confirmed_at`    | Retention window calculation |
| `event_id`        | Operational records          |
| `event_slot_id`   | Capacity audit               |
| `consent_version` | Compliance proof             |
| `consent_at`      | Compliance proof             |

---

# 5. Transaction & Locking Model (DB-Level)

## 5.1 Booking Creation (Single Transaction)

**Required sequence (InnoDB):**

1. `SELECT slot FOR UPDATE` (optional but recommended)
2. Insert into `wp_bookit_booking_pii`
3. Insert into `wp_bookit_bookings`
4. Commit

**Failure modes:**

* Duplicate slot → unique constraint violation
* Any failure → rollback → no artifacts

---

# 6. Data Volume & Growth Estimates (UK SMB)

### Assumptions (Flagged)

* ≤ 10k bookings / year / site
* ≤ 5 slots per event per day

### Impact

* Tables remain small
* Indexes stay hot
* No sharding required

⚠️ If bookings exceed ~1M/site → reindexing strategy required (future phase)

---

# 7. Risks & Flags

### Risk 1: Slot Identity Ambiguity

* If `event_slot_id` is not globally stable → double booking risk

➡️ **Escalate to Solution Architect if slot identity is not immutable**

---

### Risk 2: Free-Text Notes

* Notes may contain excessive PII

➡️ Acceptable but **must be erased fully**

---

# 8. Explicit Assumptions (Reconfirmed)

* One booking consumes exactly one slot
* Slot IDs are immutable
* No booking updates ever occur
* No soft deletes anywhere

If false → **Architecture / Compliance escalation**

---

# 9. Exit Criteria — Database Gate (Phase 1B)

✔ Double booking structurally impossible (DB-enforced)
✔ Booking immutability enforced by schema
✔ PII explicitly isolated
✔ GDPR erasure supported without data corruption
✔ Multisite-safe (`site_id` everywhere)
✔ No Phase 2 leakage (no cancel/reschedule fields)

---

### **Database Expert Position**

This schema provides **hard guarantees**, not conventions.

If a booking exists:

* It is confirmed
* It is final
* It consumed a slot
* It cannot be duplicated

Any deviation requires **formal escalation**.
