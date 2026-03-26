Let me check what's documented about each extension before writing the instructions.I have everything I need. Here are the complete instructions for all three extension projects.

Need to add:
In every extraction use a name for that plugin extntion, as there might be other extractions. This should be for every function,class, DB migration and so on.
I have access to the core plugin and other extractions if you have any question or not sure about code from the core plugin please ask.


---

## PROJECT SETUP INSTRUCTIONS

All three projects follow the same setup pattern. The differences are in the project name, knowledge files, and opening message.

---

### FILES TO UPLOAD TO ALL THREE PROJECTS

These four files are the same for every extension project — upload them to each:

1. `Extension_Plugin_API_Spec.md` — the extension contract (hooks, migrations, registration pattern)
2. `System_Architecture_Document_PART1_Sections_1-8.md` — core plugin architecture
3. `BusinessContext.md` — what Bookit is and who it serves
4. `progress.md` — current sprint state and decisions

---

## PROJECT 1: Bookit Recurring

**Project name:** `Bookit Recurring Extension`

**Opening message:**

```
# Bookit Recurring Extension — Project Initialisation

I am building a WordPress extension plugin called Bookit Recurring
for the Bookit Booking System core plugin.

## What this extension does
Adds recurring appointment support. A customer or admin can create
a series of repeating bookings (e.g. "Every Monday at 10am for 8
weeks") rather than booking each session individually. Each
occurrence is a full booking in the core wp_bookings table. The
series is managed as a linked group.

## Parent plugin context
- Core plugin: bookit-booking-system (repo: lstroh/bookit-imp,
  branch: Phase1)
- Extension API spec: uploaded to this project's knowledge
- Core plugin has: extension registry, migration runner, audit
  logger, error registry, booking lifecycle hooks
  (bookit_after_booking_created, bookit_before_booking_cancelled,
  bookit_available_slots filter, bookit_booking_data_before_insert)
- PHPUnit baseline at Sprint 4D close: 686 tests, 0 failures

## Extension identity
- Plugin slug: bookit-recurring
- Plugin name: Bookit Recurring
- Text domain: bookit-recurring
- Repo: lstroh/bookit-recurring (create when ready)
- Requires core: 1.0.0+
- Estimated scope: ~45h

## Key scope decisions
- Each occurrence is a standard booking row in wp_bookings — the
  extension adds a recurring_group_id column (via migration) to
  link occurrences together
- Individual occurrence editing is supported (change one, not all)
- Batch cancellation of remaining occurrences is supported
- Email notifications for the series fire via Sprint 5 live
  environment (email delivery requires live transactional service)
- The extension uses bookit_booking_data_before_insert to inject
  recurring_group_id on each occurrence insert
- The extension uses bookit_available_slots to verify availability
  across all occurrence dates before confirming the series

## Target customers (from business context)
Primarily health & wellness businesses — physiotherapists, personal
trainers, nutritionists — who run weekly recurring sessions with
the same client. Also coaches and tutors with regular weekly slots.

## My ask for this first session
Confirm you have understood the extension architecture and the
decisions above. Then help me plan the full sprint scope for
Bookit Recurring, broken into tasks with hour estimates. We will
generate Cursor prompts task by task when we are ready to build.
```

---

## PROJECT 2: Bookit Classes

**Project name:** `Bookit Classes Extension`

**Opening message:**

```
# Bookit Classes Extension — Project Initialisation

I am building a WordPress extension plugin called Bookit Classes
for the Bookit Booking System core plugin.

## What this extension does
Adds group bookings and class/event support. Instead of one customer
booking one staff member, multiple customers can book the same
class (e.g. a Pilates session with a capacity of 10). Includes
capacity management, waitlist functionality, and roster management
(admin sees who is attending each class).

## Parent plugin context
- Core plugin: bookit-booking-system (repo: lstroh/bookit-imp,
  branch: Phase1)
- Extension API spec: uploaded to this project's knowledge
- Core plugin has: extension registry, migration runner, audit
  logger, error registry, booking lifecycle hooks, and the
  bookit_available_slots filter which this extension uses to
  remove fully-booked class slots from public availability
- PHPUnit baseline at Sprint 4D close: 686 tests, 0 failures

## Extension identity
- Plugin slug: bookit-classes
- Plugin name: Bookit Classes
- Text domain: bookit-classes
- Repo: lstroh/bookit-classes (create when ready)
- Requires core: 1.0.0+
- Estimated scope: ~90h

## Key scope decisions
- A class is a service configured with a capacity > 1 and a
  specific date/time (not a recurring availability window)
- The extension adds its own tables for class definitions,
  rosters, and waitlist entries via the migration runner
- The bookit_available_slots filter removes class slots from
  the public wizard when the class is full
- Waitlist: when a spot opens (cancellation), the next person
  on the waitlist is notified — email notifications fire via
  Sprint 5 live environment
- Group pricing is supported: a flat price per class place
  (different from the service's per-person base price)
- Admin sees a roster view (who is attending) in the dashboard
  via a standalone Vue page registered through the extension
- The extension does NOT share Vue state with core — it mounts
  its own standalone Vue app at /bookit-dashboard/app/classes

## Target customers (from business context)
Health & wellness businesses running group classes: Pilates,
yoga, group personal training, group therapy sessions. Also
creative tutors running group workshops.

## My ask for this first session
Confirm you have understood the extension architecture and the
decisions above. Then help me plan the full sprint scope for
Bookit Classes, broken into tasks with hour estimates. We will
generate Cursor prompts task by task when we are ready to build.
```

---

## PROJECT 3: Bookit Forms

**Project name:** `Bookit Forms Extension`

**Opening message:**

```
# Bookit Forms Extension — Project Initialisation

I am building a WordPress extension plugin called Bookit Forms
for the Bookit Booking System core plugin.

## What this extension does
Adds custom intake forms per service. Admin can define a set of
fields (text, checkbox, dropdown, file upload) attached to a
specific service. When a customer books that service, the form
appears at Step 4 of the booking wizard (after contact details).
Responses are stored per booking and visible in the dashboard.

## Parent plugin context
- Core plugin: bookit-booking-system (repo: lstroh/bookit-imp,
  branch: Phase1)
- Extension API spec: uploaded to this project's knowledge
- Core plugin has: extension registry, migration runner, audit
  logger, error registry, and the booking wizard which renders
  PHP templates at public/templates/booking-step-4-contact.php
- The extension injects its form fields into Step 4 using the
  bookit_booking_data_before_insert filter (to store responses)
  and a core hook that fires during Step 4 template rendering
- PHPUnit baseline at Sprint 4D close: 686 tests, 0 failures

## Extension identity
- Plugin slug: bookit-forms
- Plugin name: Bookit Forms
- Text domain: bookit-forms
- Repo: lstroh/bookit-forms (create when ready)
- Requires core: 1.0.0+
- Estimated scope: ~25h

## Key scope decisions
- Form definitions are per-service, stored in extension tables
  via the migration runner
- Field types in Phase 1: short text, long text, checkbox (yes/no),
  dropdown (select from options), file upload (images/PDFs only)
- GDPR: form responses are included in the customer GDPR data
  export (the core export already has an extension hook for this)
- GDPR: form responses are deleted/anonymised when a customer
  exercises their right to erasure, consistent with core behaviour
- Responses are visible in the booking detail view in the dashboard
  — injected via the bookit_booking_response filter
- No public form builder UI in Phase 1 — admin defines forms in
  the dashboard via a standalone Vue page
- File uploads use WordPress media library conventions (wp_handle_upload)
  with MIME type validation and 5MB size limit (matching core)

## Target customers (from business context)
Health & wellness businesses needing medical/consent forms before
a first appointment: physiotherapists, massage therapists,
nutritionists, personal trainers. Also photographers needing
brief intake on shoot requirements.

## My ask for this first session
Confirm you have understood the extension architecture and the
decisions above. Then help me plan the full sprint scope for
Bookit Forms, broken into tasks with hour estimates. We will
generate Cursor prompts task by task when we are ready to build.
```

---

## QUICK REFERENCE

| Project | Slug | Est. scope | Primary target customer |
|---------|------|-----------|------------------------|
| Bookit Recurring | bookit-recurring | ~45h | Physios, coaches, tutors |
| Bookit Classes | bookit-classes | ~90h | Yoga/Pilates, workshops |
| Bookit Forms | bookit-forms | ~25h | Health & wellness, photographers |
| Bookit Meetings | bookit-meetings | ~60h | Coaches, consultants, tutors |

All four projects use the same four knowledge files. All four follow the same sprint planning pattern — first session scopes the tasks, then Cursor prompts are generated one task at a time.