Task 10 — the final manual testing and polish pass. This is different from the previous tasks, no Cursor prompt needed. It's about systematically going through the entire Sprint 4A work and making sure everything is solid before calling the sprint done.

---

```
Sprint 4A Progress: 9/10 tasks complete

✅ Task 1:  Staff Schedule View + Mark Actions (16h)
✅ Task 2:  Time-Off Blocking (18h)
✅ Task 3:  Staff Earnings Display (6h)
✅ Task 4:  Reports Nav + Overview Dashboard (8h)
✅ Task 5:  Revenue Report (14h)
✅ Task 6:  Booking Analytics (10h)
✅ Task 7:  Staff Performance Report (10h)
✅ Task 8:  Customer Database + GDPR (16h)
✅ Task 9:  PHPUnit Tests (12h)
⏭️ Task 10: Manual Testing & Polish (4h)  — NEXT

Hours completed: 110 / 112
```

---

## Task 10 — Manual Testing & Polish Checklist

Work through this in your Local by Flywheel environment. The goal is to catch anything PHPUnit can't — visual issues, edge cases with real data, and cross-feature interactions.

---

### 1. Staff Dashboard Features (Tasks 1–3)

**As a staff user (not admin):**
- [ ] Schedule view loads showing this week's bookings
- [ ] Can navigate to previous/next week
- [ ] Can mark a booking as Complete, No-Show from the schedule
- [ ] Status change is reflected immediately without page refresh
- [ ] Time-off block form works — create a block for next week
- [ ] Conflict warning appears when trying to block a date with existing bookings
- [ ] My Stats section visible when earnings toggle is ON in Settings
- [ ] My Stats section hidden when earnings toggle is OFF
- [ ] Stats show correct £ values with 2 decimal places

---

### 2. Reports — Overview (Task 4)

**As admin:**
- [ ] Reports nav section visible in sidebar
- [ ] All 5 report links in sidebar navigate correctly
- [ ] Overview page loads — three period tabs work (This Week / This Month / All Time)
- [ ] Four summary cards show real numbers
- [ ] Bar chart renders for This Week and This Month
- [ ] Chart is hidden on All Time tab
- [ ] Rate colour coding correct (try periods with high/low cancellation rates)

---

### 3. Revenue Report (Task 5)

- [ ] Date range selector — all quick filters work (Today, This Week, Last Month etc.)
- [ ] Custom date range with start > end shows validation error
- [ ] Summary cards update when date range changes
- [ ] Line chart updates when date range changes
- [ ] By Service table shows correct data, no duplicate rows
- [ ] By Staff table correct
- [ ] By Payment Method table correct
- [ ] CSV export downloads a clean file — open in Excel and verify columns, currency formatting, no escaped quotes
- [ ] "Today's data is preliminary" banner appears when today is in the selected range

---

### 4. Booking Analytics (Task 6)

- [ ] Default range is last 30 days
- [ ] All 6 summary cards correct
- [ ] "Not enough data" notice appears when < 10 bookings in range (try a narrow date range)
- [ ] Bookings Over Time bar chart renders
- [ ] Popular Days horizontal bar chart — Mon–Sun labels correct
- [ ] Popular Times horizontal bar chart — 07:00–21:00 labels correct
- [ ] Peak Hours Heatmap grid renders — cells darker for busier slots
- [ ] Hovering a heatmap cell shows tooltip with day, time, count
- [ ] Heatmap scrolls horizontally on a narrow window (test at ~768px width)
- [ ] Lead Time bar chart — 5 buckets with correct labels
- [ ] Avg lead days shown in section subtitle

---

### 5. Staff Performance (Task 7)

- [ ] Staff list table shows all active staff
- [ ] Sortable by Revenue, Bookings, No-Show Rate — toggle ASC/DESC works
- [ ] No-show rate colour coding correct
- [ ] Clicking a staff row navigates to the detail page
- [ ] Back button returns to staff list
- [ ] Detail page: name, title, member since correct
- [ ] 6 summary cards correct
- [ ] All-time stats row visible
- [ ] Performance tab: weekly line chart renders
- [ ] Services tab: table shows correct service breakdown
- [ ] Time Off tab: upcoming blocks listed with human-readable reason labels
- [ ] Time Off tab: empty state shown when no upcoming blocks
- [ ] Changing date range on detail page re-fetches correctly

---

### 6. Customer Database (Task 8)

- [ ] Customer list loads with all customers
- [ ] Search by name works (try partial name)
- [ ] Search by email works
- [ ] Search by phone works
- [ ] Status filter: Active / Inactive / New each work correctly
- [ ] Per page selector (25/50/100) works
- [ ] Pagination works if > 25 customers
- [ ] Clicking a row navigates to customer profile
- [ ] Customer profile: all stats correct
- [ ] Edit form: can update name, phone, marketing consent, notes
- [ ] Edit form: email field is NOT present
- [ ] Save updates data, cancel discards changes
- [ ] Booking history tab: bookings listed most recent first, correct status badge colours
- [ ] Payment history tab: correct method and type labels
- [ ] Delete button: confirmation modal shows GDPR warning text
- [ ] Delete blocked with helpful message if customer has upcoming bookings
- [ ] Successful delete: redirected to customer list, customer gone
- [ ] Check DB directly: customer anonymised but booking records intact
- [ ] Previously deleted customer's bookings still visible in Bookings list as "Deleted Customer"
- [ ] CSV export: downloads clean file, open in Excel and verify all 12 columns

---

### 7. Cross-feature checks

- [ ] Staff user cannot access any Reports or Customers pages (redirected or 403)
- [ ] All pages have correct loading states (skeleton placeholders, not blank flashes)
- [ ] All pages have correct empty states (not blank or broken)
- [ ] All pages have correct error states — test by temporarily breaking the API URL and refreshing
- [ ] No JavaScript console errors on any page (check browser DevTools)
- [ ] No PHP errors in `wp-content/uploads/booking-system-logs/` debug log
- [ ] Mobile view (~375px): all pages usable, tables scroll horizontally where needed

---

### 8. Final commit

Once everything above is ticked:

```bash
# Make sure all tests still pass
npm test

# Commit the sprint
git add -A
git commit -m "Sprint 4A complete: Staff dashboard, Reports & Analytics, Customer database, PHPUnit tests"
git tag sprint-4a-complete
```

---

Work through the checklist and report back with anything that needs fixing. Once it's all green we'll update the progress doc and plan Sprint 4B.