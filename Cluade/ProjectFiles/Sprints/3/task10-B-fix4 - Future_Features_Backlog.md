## Sprint 4 / Phase 2 Features

### Task 11.6: Shift-Based Scheduling (8-10 hours)

**User Story:**
As a business owner with part-time or rotating staff, I want to create 
custom schedules for each staff member by week or month, so that their 
availability reflects their actual shifts.

**Technical Approach:**
- New table: wp_bookings_staff_shift_schedules
- schedule_mode field on staff table (recurring vs shifts)
- Model automatically chooses correct table
- No changes to recurring schedule system

**Business Value:**
- Handles part-time staff at salons/spas
- Supports rotating schedules
- Expands addressable market
- Still suitable for core target (service businesses)

**Priority:** Medium-High
**Estimated:** 8-10 hours
**Target:** Sprint 4 or Early Phase 2