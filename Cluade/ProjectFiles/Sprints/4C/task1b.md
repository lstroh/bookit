Great. Let me read the code before writing the prompt.Searched memorySearched memorySearched project for “TeamCalendar.vue team calendar view toggle day week implementation”5 resultsbookit-booking-system/dashboard/src/views/TeamCalendar.vue4 relevant sectionstextFinal_Requirements_Package_v1_0.mdtextFuture_Features_Backlog.mdtextScopeDefinition.mdtextbookit-booking-system/dashboard/src/views/StaffHours.vuetextSearched project for “team-calendar PHP API endpoint controller class implementation”4 resultsbookit-booking-system/includes/api/class-team-calendar-api.php4 relevant sectionstextSystem_Architecture_Document_PART1_Sections_1-8.md2 relevant sectionstextSRS_WordPress_Booking_Plugin_v1.0.mdtextSRS_WordPress_Booking_Plugin_v1.0.mdtextDoneI can see Task 1a is fully implemented from the code in project knowledge. Here's the Task 1b prompt:

Task 1b Cursor Prompt — Team Calendar: Month Grid View + View Toggle Completion
# TASK 1b: Team Calendar — Month Grid View + View Toggle Completion
# Sprint 4C | Bookit Booking System
# Estimated: 8 hours

## CONTEXT

Task 1a delivered Day and Week time-grid views in TeamCalendar.vue, plus
the PHP endpoint at GET /bookit/v1/team-calendar supporting view_type=day
and view_type=week.

Task 1b adds:
1. Month grid view — a traditional calendar grid (Mon–Sun columns, rows
   of weeks) showing booking counts/indicators per staff per day
2. Enable the [Month] view toggle button (currently disabled/greyed out)
3. Extend the PHP endpoint to support view_type=month
4. The view switcher should now fully work across all three views:
   Day | Week | Month

No new routes, no new sidebar entries, no new PHP controllers.
Everything builds on what Task 1a created.

---

## MANDATORY: READ THESE FILES FIRST

Before writing any code, read:

1. dashboard/src/views/TeamCalendar.vue
   — The ENTIRE file. Understand the existing data flow, computed
     properties (columns, timeBounds, slots, gridHeight), the
     fetchCalendar() function, the periodLabel computed, the currentView
     ref, and exactly how the Day/Week grid is rendered in the template.
     Month view must integrate cleanly without breaking Day or Week.

2. includes/api/class-team-calendar-api.php
   — The ENTIRE file. Understand get_team_calendar(), the date range
     logic, the bookings query, the time_off query, and the response
     shape. Month view extends this endpoint — do not duplicate code,
     extend it.

3. dashboard/src/views/MySchedule.vue
   — For date utility function patterns (dateToYMD, addDays, etc.)
     that may be reused or referenced.

Do not write any code until you have read all three files fully.

---

## WHAT TO BUILD

### 1. PHP: Extend the endpoint for view_type=month

File: includes/api/class-team-calendar-api.php

Add 'month' to the accepted view_type values. When view_type=month:

Date range:
  - Normalise the input date to the 1st of that month
  - date_start = first day of the month (e.g. 2026-03-01)
  - date_end = last day of the month (e.g. 2026-03-31)
  - Return ALL days in the month, even those with no bookings

Response shape:
  Identical to the existing shape — same staff array, same days array.
  The frontend handles rendering differently based on view_type.
  Do not add new top-level fields.

  Each day object in the days array needs one additional field:
    "booking_count": 3   // total bookings across all staff that day

  This allows the month grid to show a simple summary count without
  rendering individual booking cards (which would be too small).

Performance:
  A month fetch covers up to 31 days. The existing single-query approach
  for bookings and time_off works fine — just ensure the date range
  passed to those queries covers the full month. Do not add extra queries.

The existing day/week behaviour must not change.

---

### 2. Vue: Month grid view in TeamCalendar.vue

File: dashboard/src/views/TeamCalendar.vue

#### Enable the Month button

The [Month] button is currently disabled with title="Month view coming
soon". Remove the disabled attribute and the tooltip. Wire it up exactly
like the Day and Week buttons — clicking it sets currentView = 'month'
and triggers a fetch.

Update aria-pressed on all three buttons to reflect the active state.

#### Month view rendering

The month grid is a traditional calendar layout:
- Column headers: Mon | Tue | Wed | Thu | Fri | Sat | Sun
- Rows: one row per week that contains days in the displayed month
- Each cell represents one calendar day

Layout rules:
- The grid always starts on Monday (UK week start)
- If the 1st of the month is not a Monday, pad the start of the first
  row with empty cells for days from the previous month
- Similarly pad the end of the last row with empty cells if the month
  does not end on a Sunday
- These padding cells should be visually muted (grey background) and
  show the day number in light text — they are non-interactive

Day cells (current month):
  - Show the day number prominently in the top-left corner
  - Today's cell: highlighted background (bg-primary-50 border
    border-primary-300 or similar — consistent with how "today" is
    shown in week view)
  - If the day has bookings: show a summary indicator. Use one of:
      Option A (preferred): coloured dot per staff member who has
      bookings that day (up to 4 dots, then "+N more" if more than 4
      staff have bookings)
      Option B: a simple count badge ("3 bookings")
    Choose whichever renders more cleanly given the cell size.
  - If the day has time-off: show a small grey indicator (e.g. a grey
    dash or "1 off" text) — subtle, not prominent
  - Clicking a day cell navigates to the Day view for that specific date
    (set currentDate to that date and currentView to 'day'). This is the
    primary drill-down interaction.

Cell sizing:
  - Each row has a fixed minimum height (e.g. min-h-[80px] or
    min-h-[100px]) — enough to show the day number and indicators
  - On mobile, reduce cell size (min-h-[60px]) and show only the day
    number and a count badge — no staff dots

Navigation in month view:
  - [← Prev] moves back one month (not 7 days, not 1 day)
  - [Next →] moves forward one month
  - [Today] returns to the current month
  - The period label shows the month and year: "March 2026"
  - Update prevPeriod() and nextPeriod() to handle this:
    when currentView === 'month', subtract/add 1 month rather than
    1 day or 7 days

#### periodLabel update

The existing periodLabel computed handles 'day' and 'week'. Add 'month':
  'month' → format as "March 2026" using en-GB locale

#### Month grid computed property

Add a new computed property monthGrid that transforms the days array
from the API into a 2D structure suitable for rendering:

  monthGrid: Array of week rows
    Each row: Array of 7 day cells (Mon–Sun)
    Each cell: { date, dayNumber, isCurrentMonth, isToday, bookings,
                 timeOff, bookingCount, staffWithBookings }
    Padding cells: { date: null, isCurrentMonth: false, dayNumber: N }
                   (show day number from prev/next month, greyed out)

staffWithBookings per cell: derive from the bookings array — unique
staff_ids that have at least one booking on that day. Used to render
the coloured staff dots. Map each staff_id to its colour using the
staffMap computed already in the component.

#### Watch / fetch trigger

The existing watch on currentView and currentDate already calls
fetchCalendar(). This should work for month view without changes —
verify it does, and fix it if not.

When switching from month view (clicking a day cell) to day view, the
watch must fire and fetch day data for the newly set date. Confirm this
works correctly.

---

### 3. View toggle: aria-pressed and accessibility

Update all three view toggle buttons to use aria-pressed properly:

  <button :aria-pressed="currentView === 'day'" ...>Day</button>
  <button :aria-pressed="currentView === 'week'" ...>Week</button>
  <button :aria-pressed="currentView === 'month'" ...>Month</button>

aria-pressed should be a boolean (true/false), not a string.

---

## CONSTRAINTS

- Do not modify Day or Week view rendering. Month view is additive only.
- Do not add new npm packages.
- Do not add a new PHP controller or endpoint. Extend the existing one.
- Clicking a month day cell must navigate to day view — this is the
  only interaction on the month grid (no popovers on month view).
- Month view is read-only, like day and week.
- All new DB queries must use $wpdb->prepare() for any variable input.
- Use Bookit_Error_Registry for any new PHP error conditions introduced.

---

## TESTING CHECKLIST

### PHP / API
- [ ] GET /team-calendar?view_type=month&date=2026-03-15 returns
      date_start=2026-03-01 and date_end=2026-03-31
- [ ] All 31 days of March appear in the days array
- [ ] Each day object includes booking_count field
- [ ] Days with no bookings have booking_count=0 (not missing)
- [ ] view_type=day and view_type=week still work identically to Task 1a
- [ ] view_type=invalid still returns 400

### Vue / UI — Month view rendering
- [ ] [Month] button is now enabled and clickable
- [ ] Clicking [Month] fetches month data and renders the grid
- [ ] Grid has 7 columns labelled Mon–Tue–Wed–Thu–Fri–Sat–Sun
- [ ] Days from previous/next month shown as muted padding cells
- [ ] Today's cell has a visible highlight
- [ ] Days with bookings show staff colour dots (or count badge)
- [ ] Days with time-off show a subtle grey indicator
- [ ] Clicking a day cell switches to Day view for that exact date
- [ ] Day view loads correctly after clicking through from month

### Vue / UI — Navigation in month view
- [ ] [← Prev] moves back one full month (e.g. March → February)
- [ ] [Next →] moves forward one full month
- [ ] [Today] returns to the current month
- [ ] Period label shows "March 2026" format (not a date range)
- [ ] Switching from Month to Day/Week view uses the correct date

### View toggle
- [ ] All three buttons have correct aria-pressed state
- [ ] Active button is visually highlighted
- [ ] Switching views re-fetches data with the correct view_type

### Regression
- [ ] Day view still works exactly as in Task 1a
- [ ] Week view still works exactly as in Task 1a
- [ ] No JavaScript console errors in any view
- [ ] PHPUnit: npm test — zero failures, all existing tests pass

---

## GIT COMMIT MESSAGE (use when done)

Sprint 4C Task 1b: Team Calendar month grid view + view toggle complete

- PHP: Extend /team-calendar to support view_type=month (full month
  range, booking_count per day)
- Vue: Month grid with week rows, staff colour dots, today highlight,
  prev/next month navigation, day-cell drill-down to day view
- View toggle: [Month] button enabled, aria-pressed on all three buttons
- Period label: "March 2026" format for month view
- Day and Week views unchanged

Once Task 1b is committed, come back and I'll mark Tasks 1a + 1b complete on the progress tracker and generate the Task 2 prompt (Setup Wizard — Backend + State).