SECURITY RULES (NON-NEGOTIABLE)

JWT is mandatory for all non-public endpoints

JWT revocation must be DB-authoritative

No cache-only

No transients

Fail-closed authentication

Invalid / revoked token = hard reject

Rate limiting is mandatory

Especially for auth & booking endpoints

No security added “later”

All security is Phase 1-only

🚫 Forbidden:

Long-lived tokens without revocation

Trusting client-side state

Anonymous booking creation

⚖️ COMPLIANCE RULES (GDPR + UK DPA 2018)

Right to erasure is guaranteed

No “best effort”

Personal data retention is enforced automatically

≤ 90 days where specified

No manual compliance processes

No WP Admin intervention

Deletion must not rely on WP cron reliability

Data purpose limitation is explicit

Each field has a reason to exist

🚫 Forbidden:

Cron-only deletion guarantees

Human-triggered cleanups

Silent retention drift

🧱 WORDPRESS PLATFORM RULES

WordPress is backend only

WordPress provides DB, REST API, and web application capabilities.
The plugin may render web UI.
WP Admin must not be required for day-to-day operation.

Admin ≠ control plane

No dependency on third-party SaaS for core logic

Plugin must work on typical UK shared hosting

🚫 Forbidden:

Admin dashboards as system controls

Required external schedulers

Mandatory premium hosting

📱 API & CLIENT MODEL RULES

API-first architecture

Mobile app is a first-class client

No hidden server-side assumptions

Client trust boundaries are explicit

🚫 Forbidden:

Server-only flows invisible to clients

Admin-only state mutations

🧠 PRODUCT & SCOPE RULES

Phase isolation

Phase 1 ≠ Phase 2

Booking creation is final in Phase 1

No reschedule / cancel yet

No future promises

Only what exists now is designed

No scope creep disguised as flexibility

🧪 HOW THESE RULES ARE ENFORCED
1️⃣ Phase 0 Freeze

Product

Compliance

Customer mental model
→ LOCKED

2️⃣ QA / Risk Analyst Authority

QA has veto power if:

Any rule is violated

Any rule is deferred

Any rule is reinterpreted

3️⃣ Phase Gates

Each phase gate explicitly checks:

Rule compliance

No weakening

No hidden exceptions

4️⃣ Retroactive Invalidation

If a frozen rule is violated:

The phase is considered never completed

All dependent work is void