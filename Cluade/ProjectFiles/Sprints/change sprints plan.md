You're right. We agreed on all of that but you haven't updated any files yet. Let me give you consolidated instructions covering everything we've discussed in this conversation — the sprint expansion, the Stripe correction, the extension plugin decision, and the features moved from Phase 2 — all in one go so you only need to do one update session.

---

## File 1: `progress.md`

Add this as a new dated entry at the bottom of the file:

---

**Update 27/02/26: Major sprint restructure — all local work before live site**

**Decision 1: Complete all locally-buildable features before deploying to a live environment.**

Sprint sequence restructured accordingly:

```
Sprint 4A:  ⏭️  Staff Dashboard + Reports (~112h)          — NEARLY COMPLETE
Sprint 4B:  □   Polish & Infrastructure (~54h)             — LOCAL
Sprint 4C:  □   Feature Completeness (~72h)                — LOCAL
Sprint 4D:  □   Package Bookings + New Booking Types (~80h) — LOCAL
Sprint 4E:  □   Security & Quality (~80h)                  — LOCAL
Sprint 5:   □   Live Environment Sprint                    — REQUIRES LIVE SITE
Sprint 6:   □   Launch Preparation                         — MIXED
```

**Extension plugins (separate Claude projects, built after Sprint 4B):**
```
Bookit Recurring  — Recurring appointments (~45h)
Bookit Classes    — Group bookings & classes (~90h)
Bookit Forms      — Custom intake forms (~25h)
```

**Sprint summaries:**

**Sprint 4B — Polish & Infrastructure (~54h) — LOCAL**
- Extension hook system — action and filter hooks added to core at key moments (booking wizard steps, availability calculation, booking created/updated/cancelled). Produces Extension Plugin API spec document.
- White-label / co-branded branding (logo, colours, business name, "Powered by")
- Optimistic locking on booking edit
- Comprehensive audit logging
- Database migration framework
- Custom booking reference format (BK2601-XXXX)
- Centralised error message system

**Sprint 4C — Feature Completeness (~72h) — LOCAL**
- Team calendar view (all staff schedules, admin sees everyone)
- Cancellation policy configuration UI — per-service overrides, refund percentage rules, time windows (settings only, no Stripe execution)
- Bulk booking actions (cancel/complete multiple at once)
- Contextual help tooltips throughout dashboard
- Customer data portability export (GDPR Art. 20)
- Setup wizard (4-step first-time configuration)

**Sprint 4D — Package Bookings + New Booking Types (~80h) — LOCAL**
- Package bookings — buy N sessions, redeem over time, credit balance on customer profile (stays in core — deeply integrated with payment step)
- Package bookings gated by admin settings toggle, disabled by default

**Sprint 4E — Security & Quality (~80h) — LOCAL**
- Accessibility audit + fixes (WCAG 2.1 AA)
- Performance optimisation (JS bundle, queries, lazy loading)
- Security hardening (OWASP checklist, rate limiting)
- PHPUnit test coverage for all Sprint 4B–4D code

**Items deferred to Sprint 5 (Live Environment):**
- Automatic refund execution via Stripe — requires real payment intent IDs and live/test Stripe API; cannot be meaningfully tested locally. Policy configuration UI built in Sprint 4C; execution wired up in Sprint 5.
- Waitlist email notifications for Bookit Classes — hooks built in extension, emails sent in Sprint 5
- Recurring appointment email notifications — hooks built in extension, emails sent in Sprint 5

**Total local work remaining after 4A:** ~286h in core (Sprints 4B–4E) + ~160h in extensions
**Status:** ON TRACK

---

**Decision 2: Extension plugin architecture**

Certain features will be built as separate WordPress plugins that extend the core Bookit plugin rather than being bundled into the core codebase. This reduces risk of optional features affecting users who don't use them.

**Extension strategy: Option 3 (separate dashboard pages)**
Each extension ships its own standalone Vue pages accessible via new dashboard routes. The core sidebar links to these pages when the extension is active. Can migrate to tighter integration later — the PHP side and component logic would not need to change, only the mounting approach.

**Features confirmed as extension plugins:**

| Feature | Plugin name | Built after |
|---------|-------------|-------------|
| Recurring appointments | Bookit Recurring | Core Sprint 4B complete |
| Group bookings & classes | Bookit Classes | Core Sprint 4B complete |
| Custom intake forms | Bookit Forms | Core Sprint 4B complete |

**Features confirmed to stay in core:**
- Package bookings — affects payment step, customer credit balance, bookings list; too deeply integrated to isolate cleanly
- All Sprint 4B, 4C, 4E items

**Prerequisites before building any extension:**
- Sprint 4B must add extension hooks to core PHP and produce an **Extension Plugin API spec document** in this project
- Each extension gets its own separate Claude project
- The Extension Plugin API spec is added to each extension project as its first piece of knowledge

**Claude project naming:**
- Core: this project
- `Bookit Recurring`, `Bookit Classes`, `Bookit Forms` — created when ready

---

## File 2: `Development_Sequence_Plan.md`

Add this block directly below the existing `⚠️ REVISION — 23/02/26` note:

---

**⚠️ REVISION — 27/02/26: Sprint sequence restructured + extension plugin architecture adopted**

**Sprint sequence changes:**

All locally-buildable work is now completed before any live site deployment. The original Sprint 4B (Performance + Accessibility + Security) has been pushed back to Sprint 4E. The following new local sprints have been added:

- **Sprint 4B** (~54h): Polish & Infrastructure — extension hook system + API spec, branding, audit logging, migration framework, error system, booking reference format, optimistic locking
- **Sprint 4C** (~72h): Feature Completeness — team calendar, setup wizard, per-service cancellation policy UI (no Stripe execution), bulk actions, GDPR data portability, tooltips
- **Sprint 4D** (~80h): Package Bookings — prepaid session bundles, credit balance, redemption tracking (stays in core, gated by settings toggle)
- **Sprint 4E** (~80h): Security & Quality — WCAG audit, performance optimisation, security hardening, full test coverage

**Sprint 5 (Live Environment) scope additions:**
- Automatic refund execution via Stripe (policy rules configured in Sprint 4C)
- Email notifications for extension plugin features (recurring, classes, waitlist)

**Extension plugin architecture:**
Three features moved out of the core plugin into separate extension plugins, each with its own Claude project:
- Recurring appointments → **Bookit Recurring**
- Group bookings & classes → **Bookit Classes**
- Custom intake forms → **Bookit Forms**

Extension plugins are built after Sprint 4B completes and the Extension Plugin API spec document exists. Package bookings remains in core.

**Total local work remaining after Sprint 4A:** ~286h core + ~160h extensions
**Refer to `progress.md` for full sprint details.**

---

## File 3: `Future_Features_Backlog.md`

Add this note at the very top of the file, before any existing content:

---

**⚠️ NOTE — 27/02/26: Features moved from Phase 2 / deferred into Phase 1**

The following features previously documented as Phase 2, deferred, or COULD HAVE have been pulled into Phase 1. Some are in the core plugin; others are in separate extension plugins.

**Moved into core plugin (Phase 1):**

| Feature | Previously | Now |
|---------|-----------|-----|
| White-label / co-branded branding | Phase 2 | Core Sprint 4B |
| Extension hook system + API spec | Not planned | Core Sprint 4B |
| Optimistic locking on booking edit | COULD-012 deferred | Core Sprint 4B |
| Comprehensive audit logging | COULD-017 deferred | Core Sprint 4B |
| Database migration framework | COULD-016 deferred | Core Sprint 4B |
| Custom booking reference format | COULD-009 deferred | Core Sprint 4B |
| Centralised error message system | COULD-014 deferred | Core Sprint 4B |
| Team calendar view | COULD-005 deferred | Core Sprint 4C |
| Cancellation policy config UI (per-service) | Deferred | Core Sprint 4C |
| Bulk booking actions | Deferred | Core Sprint 4C |
| Customer data portability (GDPR Art. 20) | Deferred | Core Sprint 4C |
| Setup wizard | Missed from Sprint 3 | Core Sprint 4C |
| Contextual help tooltips | COULD-010 deferred | Core Sprint 4C |
| Package bookings | Phase 2 Priority 2 | Core Sprint 4D |

**Moved into extension plugins (Phase 1, separate codebases):**

| Feature | Previously | Now |
|---------|-----------|-----|
| Recurring appointments | Phase 2 Priority 2 | Bookit Recurring extension |
| Group bookings & classes | Phase 2 Priority 3 | Bookit Classes extension |
| Custom intake forms per service | Phase 2 / Deferred | Bookit Forms extension |

**Still deferred to Phase 2 / post-launch:**
- Automatic refund *execution* via Stripe — Sprint 5 (requires live payment infrastructure)
- SMS notifications — Phase 2 Priority 1 (Twilio integration)
- 2-way Google Calendar sync — Phase 2 Priority 2
- Customer portal (full self-service) — Phase 2 Priority 2
- PDF report exports — Phase 2
- Scheduled report emails — Phase 2
- Email notifications for extension features — Sprint 5 (requires live email delivery)

---

That covers all three files in one update. Once done, the project knowledge will fully reflect every decision made in this conversation.