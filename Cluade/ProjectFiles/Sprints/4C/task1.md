Let me read the relevant code files before writing the prompt.I have everything I need. Here is the Cursor prompt for Task 1a.

---

## Task 1a Cursor Prompt — Team Calendar: Day & Week Time-Grid Views

```
# TASK 1a: Team Calendar — Day & Week Time-Grid Views
# Sprint 4C | Bookit Booking System
# Estimated: 10 hours

## CONTEXT

You are implementing the admin-only Team Calendar feature for the Bookit
Booking System. This is a new Vue 3 view at the route /team-calendar,
visible only to bookit_admin users.

The calendar shows all staff members' bookings and time-off blocks in a
time-grid layout. Staff members are displayed as columns. Time slots run
down the left axis. The view supports two modes in this task: Day view
(one day, all staff as columns) and Week view (Mon–Sun, all staff as
columns). A separate task (1b) will add the Month grid view and the
full view-toggle switcher.

Admin users see all staff. Staff users should NOT be able to access this
view — the route must be guarded with requiresAdmin: true.

There is NO third-party calendar library. Build everything custom using
Tailwind CSS, consistent with the existing codebase. Study the patterns
in MySchedule.vue before writing any code.

---

## MANDATORY: READ THESE FILES FIRST

Before writing any code, read:

1. dashboard/src/views/MySchedule.vue
   — Week navigation pattern (currentMonday, prevWeek, nextWeek, goToday),
     API fetch pattern, day/booking card structure, date utility functions

2. dashboard/src/components/Sidebar.vue
   — mainNavigation array, isAdmin check pattern, nav-item class,
     how to add a new admin-only nav entry

3. dashboard/src/router/index.js
   — Route structure, requiresAdmin meta flag pattern

4. dashboard/src/main.js
   — How requiresAdmin is enforced in the router beforeEach guard

5. dashboard/src/views/Staff.vue
   — How getColorForInitials() and getInitials() work (needed for
     staff colour coding in the calendar)

6. includes/api/
   — Read ALL existing REST controller files to understand the
     established endpoint pattern before writing any PHP

7. includes/class-bookit-audit-logger.php
   — The audit log API; no new audit entries are needed for a read-only
     view but understand the pattern for future tasks

Do not guess at any existing implementation. Read first.

---

## WHAT TO BUILD

### 1. PHP: New REST API Endpoint

File: includes/api/class-team-calendar-api.php

Register a new REST controller following the exact pattern of existing
controllers. Do not deviate from the established pattern.

Endpoint:
  GET /wp-json/bookit/v1/team-calendar

Permission:
  bookit_admin role only. Staff must receive 403.

Query parameters:
  view_type  — 'day' or 'week' (required)
  date       — ISO date string YYYY-MM-DD (required)
               For day view: the specific day to load
               For week view: any date within the target week;
               the endpoint normalises to Monday of that week

Response shape:
  {
    "success": true,
    "view_type": "day",         // or "week"
    "date_start": "2026-03-02", // first day of the period
    "date_end": "2026-03-02",   // last day of the period (same as start for day view)
    "staff": [
      {
        "id": 1,
        "full_name": "Emma Thompson",
        "initials": "ET",
        "colour": "#4F46E5",     // deterministic hex colour derived from staff ID
        "photo_url": null
      }
    ],
    "days": [
      {
        "date": "2026-03-02",
        "label": "Monday 2 March",
        "is_today": true,
        "bookings": [
          {
            "id": 42,
            "staff_id": 1,
            "customer_name": "Sarah Johnson",
            "service_name": "Women's Haircut",
            "start_time": "09:00",
            "end_time": "10:00",
            "status": "confirmed",
            "payment_status": "paid",
            "total_price": "45.00"
          }
        ],
        "time_off": [
          {
            "staff_id": 1,
            "label": "Holiday",
            "all_day": true,
            "start_time": null,
            "end_time": null
          }
        ]
      }
    ]
  }

Staff colour assignment:
  Derive a deterministic hex colour from the staff ID using a fixed
  palette (at least 10 colours). Cycle through the palette using
  modulo: STAFF_COLOURS[ staff_id % count ]. Use colours that are
  visually distinct and work well on white backgrounds with white text.

  Suggested palette (feel free to adjust for contrast):
  #4F46E5, #0891B2, #059669, #D97706, #DC2626,
  #7C3AED, #DB2777, #0284C7, #65A30D, #EA580C

Time off data:
  Query the time-off / exceptions tables that were built in Sprint 4A.
  Read the existing time-off API controller to understand the exact
  table structure before querying.

Performance:
  Fetch all data in as few queries as possible. Use JOINs, not N+1 loops.
  For week view, fetch the entire week's data in one query.

Register the controller in the plugin's main API registration point,
following the exact same pattern as every other controller.

---

### 2. Vue: TeamCalendar.vue

File: dashboard/src/views/TeamCalendar.vue

#### Overall page structure

Header:
  - Page title: "Team Calendar"
  - Date navigation row:
    - [← Prev] [Today] [Next →] buttons — same style as MySchedule.vue
    - Current period label (e.g. "Monday 2 March 2026" for day view,
      "2–8 March 2026" for week view)
  - View toggle buttons: [Day] [Week] — highlight the active view
    (Month button will be added in Task 1b; leave a placeholder slot)

Loading state: use the same skeleton/spinner pattern as MySchedule.vue
Error state: use the ErrorState component as in MySchedule.vue
Empty state: if no staff exist, show EmptyState with helpful message

#### Day View layout

A horizontal time-grid:

- Left column: time axis, 30-minute slots from earliest staff start time
  to latest staff end time (or 08:00–20:00 as fallback).
  Show labels every 60 minutes (09:00, 10:00, etc.).
  Show minor tick marks for 30-minute slots.

- One column per staff member:
  Header cell: staff avatar (photo or coloured initials circle) + name.
  Each column is scrollable with the time axis locked.

- Booking blocks:
  Rendered as absolutely-positioned coloured cards within their column.
  Position and height calculated from start_time and end_time.
  Background: the staff member's colour (with slight transparency, e.g.
  bg-opacity-20 or a light tint).
  Border-left: 3px solid with the staff member's colour (full opacity).
  Card shows: customer name, service name, time range.
  If the booking is too short to show all text, show only customer name.
  On click: open a read-only booking detail popover/tooltip showing all
  fields (customer, service, staff, time, status, payment status, price).

- Time-off blocks:
  Rendered similarly to bookings but with a striped or muted grey
  background and a label ("Time Off" or the specific label from the DB).
  All-day time-off spans the full column height.

- Slot height: each 30-minute slot should be 40px tall (so 1 hour = 80px).
  This gives enough room for booking cards without being too cramped.

- Scrolling: the time grid scrolls vertically. The staff header row and
  time axis column must remain fixed (sticky) during scroll.
  On mobile, the entire grid scrolls horizontally as well.

#### Week View layout

Identical structure to day view, but:
- Columns are days (Mon–Sun), not staff members.
- Each day column contains all staff bookings for that day, grouped
  visually by staff colour.
- Booking cards show staff name, customer name, and service name.
- Time axis and behaviour are the same as day view.

For week view, if a day column would be very narrow on smaller screens,
allow horizontal scrolling rather than truncating content.

#### Shared requirements

- All times in 24-hour format (UK standard), e.g. 09:00, 14:30.
- Status badges on booking cards: confirmed (green), pending (amber),
  cancelled (red), completed (grey), no-show (dark red).
  Use the same badge style as the existing Bookings list view.
- "Today" column/day highlighted with a subtle background tint
  (e.g. bg-primary-50) in week view.
- Fully responsive. On mobile (< lg breakpoint), day view should still
  be usable; consider reducing column width minimums.
- WCAG 2.1 AA: all interactive elements keyboard-accessible,
  appropriate aria-labels on navigation buttons,
  sufficient colour contrast for text on booking cards.
- No third-party calendar library. All layout is custom CSS/Tailwind.

#### State management

Reactive state:
  currentView — ref('day') | ref('week')
  currentDate — ref(new Date())  // the "anchor" date

Computed:
  dateStart — Monday of the week for week view; currentDate for day view
  dateEnd   — Sunday of the week view; currentDate for day view
  periodLabel — human-readable string shown in the header

Navigation:
  prevPeriod() — subtract 1 day (day view) or 7 days (week view)
  nextPeriod() — add 1 day or 7 days
  goToday()    — reset currentDate to today

When currentView or currentDate changes, re-fetch from the API.

#### API integration

Use the useApi() composable exactly as in MySchedule.vue.
Fetch from /team-calendar with params { view_type, date }.
Handle loading / error / success states.

---

### 3. Router: Add the new route

File: dashboard/src/router/index.js

Add:
  {
    path: '/team-calendar',
    name: 'TeamCalendar',
    component: () => import('../views/TeamCalendar.vue'),
    meta: { title: 'Team Calendar', requiresAdmin: true }
  }

Place it logically after the existing /my-schedule and /my-availability
routes, before the /reports block.

---

### 4. Sidebar: Add the Team Calendar nav link

File: dashboard/src/components/Sidebar.vue

Add a new entry to mainNavigation for admin users only:
  { name: 'teamCalendar', path: '/team-calendar', icon: '👥', label: 'Team Calendar' }

The Team Calendar link must only be visible to admins. The existing
mainNavigation array is shown to all users — you have two options:

  Option A (preferred): Add a separate adminNavigation array and render
  it with a v-if="isAdmin" wrapper, keeping it visually between the
  main nav items and the Reports section.

  Option B: Filter mainNavigation in the template using v-if on the
  individual router-link.

Choose whichever approach is cleaner given the existing template
structure, but do not break the existing nav items.

---

## CONSTRAINTS

- No third-party calendar library. No FullCalendar, vue-cal, or any
  other npm package. Custom layout only.
- Admin-only: the route guard already enforces this via requiresAdmin,
  but also guard the PHP endpoint at the permission_callback level.
- Read-only view: no drag-and-drop, no click-to-create, no editing.
  Clicking a booking shows a read-only detail popover only.
- No audit log entry needed for viewing the team calendar (read-only).
- Month view is NOT part of this task. Leave the [Month] button visible
  in the view toggle but disabled/greyed out with a tooltip:
  "Month view coming soon" — it will be enabled in Task 1b.
- Use the Bookit_Error_Registry for any new PHP error conditions.
- Follow WordPress Coding Standards throughout the PHP.

---

## TESTING CHECKLIST

### PHP / API
- [ ] GET /team-calendar with view_type=day and a valid date returns
      correct bookings and time-off for all staff
- [ ] GET /team-calendar with view_type=week returns data for Mon–Sun
      of the target week
- [ ] Request with a bookit_staff session returns 403
- [ ] Request with no session returns 401
- [ ] Invalid view_type returns 400 with a clear error message
- [ ] Missing date param returns 400 with a clear error message
- [ ] Staff with no bookings still appear in the staff array
- [ ] Verify time-off blocks appear correctly in the response

### Vue / UI
- [ ] Day view renders all staff as columns with correct header
- [ ] Week view renders all days as columns with bookings grouped by
      staff colour
- [ ] Booking cards positioned correctly based on start/end time
- [ ] Time-off blocks render with muted styling
- [ ] Prev/Next/Today navigation updates the view and re-fetches data
- [ ] Day ↔ Week view toggle re-fetches with the correct view_type
- [ ] Clicking a booking card shows a read-only detail popover
- [ ] Loading skeleton shown while fetching
- [ ] Error state shown if API call fails
- [ ] Empty state shown if no staff exist
- [ ] "Month view coming soon" tooltip shown on disabled Month button
- [ ] Today highlighted correctly in week view
- [ ] Time axis labels every 60 min, ticks every 30 min
- [ ] Sticky time axis and staff header during vertical scroll
- [ ] Horizontal scroll works on mobile
- [ ] Sidebar shows "Team Calendar" link for admin, not for staff
- [ ] Route /team-calendar redirects non-admins to /

### Accessibility
- [ ] Prev/Next/Today buttons have aria-label
- [ ] View toggle buttons use aria-pressed
- [ ] Booking card popover has role="dialog" and is keyboard-dismissible
- [ ] Sufficient colour contrast on booking card text

---

## GIT COMMIT MESSAGE (use when done)

Sprint 4C Task 1a: Team Calendar day and week time-grid views

- PHP: GET /bookit/v1/team-calendar endpoint (admin only, day + week)
- Vue: TeamCalendar.vue with day/week time-grid layout
- Custom time-grid: staff columns, 30-min slots, booking cards,
  time-off blocks, sticky axis, horizontal scroll on mobile
- Booking detail popover (read-only)
- Router: /team-calendar route with requiresAdmin guard
- Sidebar: Team Calendar link (admin only)
- Month view placeholder button (disabled, tooltip, ready for Task 1b)
```

---

Once Task 1a is complete and committed, come back here and I'll update the progress tracker and generate the Task 1b prompt (Month grid + view toggle completion). Good luck!