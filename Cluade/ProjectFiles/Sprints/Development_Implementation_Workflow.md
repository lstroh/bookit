# DEVELOPMENT IMPLEMENTATION WORKFLOW
## WordPress Booking Plugin - Sprint Execution Guide

**Project:** WordPress Booking Plugin for UK Service Businesses  
**Document Version:** 1.0  
**Date:** January 24, 2026  
**Status:** Reference Guide for All Sprints  
**Platform:** Windows, Local by Flywheel, Cursor IDE

---

## DOCUMENT PURPOSE

This document defines the **complete workflow** for implementing the WordPress Booking Plugin across all 6 development sprints (Sprint 0 through Sprint 5). Both Liron and AI assistants (Claude) should reference this document to maintain consistency throughout the development process.

**Key Principle:** Separation of concerns between strategic planning and tactical execution through dedicated chat contexts.

---

## TABLE OF CONTENTS

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Roles & Responsibilities](#2-roles--responsibilities)
3. [Chat Architecture](#3-chat-architecture)
4. [Sprint Workflow (Step-by-Step)](#4-sprint-workflow-step-by-step)
5. [Task Execution Pattern](#5-task-execution-pattern)
6. [Testing Strategy](#6-testing-strategy)
7. [Tools & Environment](#7-tools--environment)
8. [File Organization](#8-file-organization)
9. [Git Version Control](#9-git-version-control)
10. [Troubleshooting & Escalation](#10-troubleshooting--escalation)
11. [Progress Tracking](#11-progress-tracking)
12. [Quality Standards](#12-quality-standards)
13. [Workflow Examples](#13-workflow-examples)

---

# 1. OVERVIEW & PHILOSOPHY

## 1.1 Core Workflow Principle

The development process uses a **dual-chat architecture** to separate strategic planning from tactical execution:

```
┌─────────────────────────────────────────────────────┐
│ PROJECT ASSISTANT CHAT (Strategic)                  │
│ - Architecture decisions                            │
│ - Sprint planning & transitions                     │
│ - Progress reviews                                  │
│ - Scope management                                  │
└─────────────────────────────────────────────────────┘
                      ↓
         [Generates Sprint Prompt]
                      ↓
┌─────────────────────────────────────────────────────┐
│ SPRINT IMPLEMENTATION CHAT (Tactical)               │
│ - Task breakdowns                                   │
│ - Implementation guidance                           │
│ - Code generation prompts                           │
│ - Testing checklists                                │
└─────────────────────────────────────────────────────┘
                      ↓
              [Work in Cursor]
                      ↓
┌─────────────────────────────────────────────────────┐
│ CURSOR IDE (Execution)                              │
│ - Write actual code                                 │
│ - Run tests                                         │
│ - Debug issues                                      │
│ - Local WordPress testing                           │
└─────────────────────────────────────────────────────┘
```

## 1.2 Why This Approach Works

**Prevents Context Bloat:**
- Each sprint chat stays focused on one sprint's tasks
- Project Assistant maintains high-level view across all sprints
- No single chat becomes unmanageably long

**Creates Natural Checkpoints:**
- Complete sprint → Return to Project Assistant → Review → Plan next sprint
- Clear start/end boundaries for each development phase

**Maintains Quality:**
- Architecture decisions stay in Project Assistant (strategic)
- Implementation details stay in Sprint chats (tactical)
- Testing integrated into every task

**Scales Across 6 Sprints:**
- Same pattern works for Sprint 0, 1, 2, 3, 4, 5
- Predictable, repeatable process
- Easy to track progress

---

# 2. ROLES & RESPONSIBILITIES

## 2.1 Liron (Developer)

**Strategic Responsibilities:**
- Review and approve sprint plans
- Make final decisions on scope/architecture
- Track overall project progress
- Manage timeline expectations

**Tactical Responsibilities:**
- Execute tasks in Cursor
- Run tests (automated + manual)
- Commit code to Git
- Report sprint completion

**Time Management:**
- Allocate hours per week for development
- Complete tasks sequentially (no parallel work on different sprints)
- Track actual vs. estimated hours

## 2.2 Project Assistant (Claude - Main Chat)

**Primary Chat:** Long-running conversation about the entire project

**Responsibilities:**
- Generate sprint implementation prompts
- Answer architecture questions
- Review sprint completion reports
- Adjust timeline/estimates based on actual progress
- Resolve scope ambiguities
- Maintain project knowledge continuity

**Does NOT:**
- Write implementation code
- Generate Cursor-specific prompts (that's Sprint Assistant's job)
- Debug task-level issues (escalate from Sprint Assistant if needed)

## 2.3 Sprint Implementation Assistant (Claude - Sprint Chats)

**One Chat Per Sprint:** New conversation for each sprint

**Responsibilities:**
- Break sprint into 6-10 manageable tasks
- Generate Cursor-ready implementation prompts per task
- Provide testing checklists per task
- Answer implementation questions
- Track task completion within sprint
- Confirm sprint completion criteria met

**Does NOT:**
- Make architecture decisions (escalate to Project Assistant)
- Change sprint scope (escalate to Project Assistant)
- Adjust estimates across sprints (that's Project Assistant)

## 2.4 Cursor IDE

**Role:** Code execution environment

**Used For:**
- Writing PHP, JavaScript, SQL, CSS code
- Running PHPUnit tests
- Accessing local WordPress environment
- File/folder management
- Git operations (commit, push)

**Modes:**
- **Composer Mode:** Multi-file features, planning
- **Agent Mode:** Single-file focus, bug fixes, tests

---

# 3. CHAT ARCHITECTURE

## 3.1 Project Assistant Chat (This One)

**Location:** Main ongoing conversation  
**Lifespan:** Entire project (Phases 1-9)  
**Context:** All project knowledge files  

**Project Knowledge Files Available:**
- All Phase 1-4 requirements documents (25 files)
- System Architecture Document Parts 1 & 2
- Development roadmap and sprint plans
- This workflow document

**Typical Interactions:**

```
Liron: "Sprint 0 complete. Ready for Sprint 1."
Project Assistant: [Reviews Sprint 0 completion]
                   [Generates Sprint_1_Implementation_Prompt.md]
                   [Provides Sprint 1 overview]

Liron: "Architecture question: Should feature X use approach A or B?"
Project Assistant: [References architecture docs]
                   [Provides decision with justification]

Liron: "Sprint 2 taking longer than expected, should I adjust?"
Project Assistant: [Analyzes impact]
                   [Recommends timeline adjustment]
```

## 3.2 Sprint Implementation Chats

**Pattern:** One new chat per sprint

**Naming Convention:**
- Sprint 0 Implementation Chat
- Sprint 1 Implementation Chat
- Sprint 2 Implementation Chat
- Sprint 3 Implementation Chat
- Sprint 4 Implementation Chat
- Sprint 5 Implementation Chat

**How to Start:**
1. Get sprint prompt from Project Assistant (e.g., `Sprint_0_Implementation_Prompt.md`)
2. Open NEW Claude chat
3. Paste entire prompt file
4. Sprint Assistant initializes and generates task breakdown

**Typical Interaction:**

```
[New Chat - Sprint 0 Implementation]
Liron: [Pastes Sprint_0_Implementation_Prompt.md]
Sprint Assistant: [Generates 8 tasks with implementation prompts]
                  "Ready to begin Sprint 0. Which task would you like to start?"

Liron: "Start Task 1: Plugin Boilerplate"
Sprint Assistant: [Provides Cursor-ready implementation prompt]
                  [Provides testing checklist]
                  [Provides manual verification steps]

Liron: "Task 1 code written. How do I test?"
Sprint Assistant: [Guides through testing process]

Liron: "Task 1 complete ✅"
Sprint Assistant: [Updates progress tracker]
                  "Great! Ready for Task 2?"

[... continue through all tasks ...]

Liron: "All tasks done. Is sprint complete?"
Sprint Assistant: [Runs sprint completion checklist]
                  [Confirms all acceptance criteria met]
                  "Sprint 0 complete ✅. Return to Project Assistant."
```

## 3.3 Chat Lifecycle

```
Project Start (Phase 5)
  ↓
Project Assistant Chat (ongoing)
  ↓
Sprint 0 Implementation Chat (2 weeks)
  → Completes → Archive
  ↓
Back to Project Assistant
  ↓
Sprint 1 Implementation Chat (3 weeks)
  → Completes → Archive
  ↓
Back to Project Assistant
  ↓
Sprint 2 Implementation Chat (3 weeks)
  → Completes → Archive
  ↓
[Continue pattern through Sprint 5]
  ↓
Back to Project Assistant (Launch review)
```

---

# 4. SPRINT WORKFLOW (STEP-BY-STEP)

## 4.1 Before Sprint Starts

**In Project Assistant Chat:**

**Step 1: Confirm Readiness**
```
Liron: "Ready to start Sprint 0"
       OR
       "Sprint 0 complete, ready for Sprint 1"
```

**Step 2: Get Sprint Overview**
```
Project Assistant provides:
- Sprint goal and deliverables
- Estimated hours (e.g., 52 hours for Sprint 0)
- Key features to build
- Dependencies from previous sprint
- Success criteria
```

**Step 3: Request Sprint Prompt**
```
Liron: "Generate Sprint 0 implementation prompt"

Project Assistant creates:
- Sprint_0_Implementation_Prompt.md (comprehensive file)
- Saves to /mnt/user-data/outputs/
- Provides download link
```

**Step 4: Save Prompt File**
```
Liron saves to local machine:
C:\Projects\booking-plugin\docs\sprint-prompts\Sprint_0_Implementation_Prompt.md
```

## 4.2 Sprint Initialization

**Step 5: Create New Sprint Chat**
```
1. Open new Claude chat (NOT this Project Assistant chat)
2. Name it: "Sprint 0 Implementation" (or current sprint number)
3. Copy entire contents of Sprint_0_Implementation_Prompt.md
4. Paste into new chat
5. Send
```

**Step 6: Sprint Assistant Initializes**
```
Sprint Assistant will:
1. Confirm it understands the sprint context
2. Generate 6-10 tasks (depending on sprint size)
3. Provide task overview with estimates
4. Ask: "Which task would you like to start?"
```

**Expected Task Breakdown Format:**
```markdown
# SPRINT 0 TASK BREAKDOWN

## Task 1: Plugin Boilerplate (8 hours)
**Goal:** Create basic WordPress plugin structure
**Prerequisites:** None
**Deliverables:** 
- Main plugin file (booking-system.php)
- Directory structure
- Activation/deactivation hooks
**Acceptance Criteria:**
- Plugin appears in WordPress admin
- Activates without errors
- Deactivates cleanly

## Task 2: Database Schema - Part 1 (8 hours)
[... similar format ...]

[6-10 tasks total per sprint]
```

## 4.3 Task Execution Loop

**For EACH Task in the Sprint:**

### Step 7: Request Task Implementation Prompt

```
Liron: "Ready for Task 1" 
       OR 
       "Start Task 1: Plugin Boilerplate"
```

**Sprint Assistant provides:**
```markdown
# TASK 1 IMPLEMENTATION PROMPT FOR CURSOR

[Detailed technical specifications]
[Code examples from architecture]
[WordPress coding standards]
[Files to create/modify]
[Expected outcomes]

[Paste this entire section into Cursor Composer]
```

### Step 8: Implement in Cursor

**Open Cursor IDE:**
```
1. Navigate to plugin directory
   C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system\

2. Open Cursor Composer (Ctrl+I or Cmd+I)

3. Paste implementation prompt from Sprint Assistant

4. Cursor generates code across multiple files

5. Review generated code

6. Make adjustments if needed

7. Save all files
```

**Cursor Mode Selection:**
- **Use Composer:** Multi-file features, planning, creating new components
- **Use Agent (Chat):** Single-file edits, bug fixes, adding one function

### Step 9: Manual Verification (First Check)

**Immediately after code generation:**
```
1. Check WordPress admin (if applicable)
   - Does plugin show up?
   - Any PHP errors?

2. Check database (if applicable)
   - Open Adminer/phpMyAdmin
   - Verify tables created
   - Check column structure

3. Check browser (if applicable)
   - Load booking page
   - Does it render?
   - Any JavaScript errors? (F12 console)

4. Quick sanity test
   - Does basic functionality work?
```

### Step 10: Request Testing Checklist

```
Liron: "Task 1 code complete. How do I test it?"
       OR
       "Ready to test Task 1"
```

**Sprint Assistant provides:**
```markdown
# TASK 1 TESTING CHECKLIST

## Automated Tests (PHPUnit)
- [ ] Run: vendor/bin/phpunit tests/test-plugin-activation.php
- [ ] Expected: All tests pass (green)

## Manual Tests
- [ ] Navigate to WordPress admin → Plugins
- [ ] Verify "Booking System" appears
- [ ] Click "Activate"
- [ ] Verify no error messages
- [ ] Click "Deactivate"
- [ ] Click "Activate" again
- [ ] Expected: Activates cleanly both times

## Acceptance Criteria Verification
- [ ] Plugin file exists at wp-content/plugins/booking-system/booking-system.php
- [ ] Plugin has correct header (Name, Version, Author)
- [ ] Activation hook runs without errors
- [ ] Deactivation hook runs without errors

## Success Criteria
All checkboxes above must be ✅ before marking task complete.
```

### Step 11: Execute Testing

**Run Automated Tests:**
```bash
# In terminal (Git Bash on Windows or Command Prompt)
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

# Run PHPUnit tests
vendor/bin/phpunit

# Or run specific test file
vendor/bin/phpunit tests/test-plugin-activation.php
```

**Run Manual Tests:**
- Follow checklist step-by-step
- Check each item as you complete it
- Document any failures or issues

### Step 12: Report Test Results

**If Tests Pass:**
```
Liron: "All tests passing ✅. Task 1 complete."
Sprint Assistant: [Updates progress tracker]
                  [Marks Task 1 as complete]
                  "Excellent! Ready for Task 2?"
```

**If Tests Fail:**
```
Liron: "Test #3 failing: Plugin won't activate. Error: [paste error]"
Sprint Assistant: [Analyzes error]
                  [Provides fix or debugging steps]
                  [May generate updated code for Cursor]

[Fix in Cursor → Re-test → Report results]
```

### Step 13: Git Commit

**After Each Successful Task:**
```bash
cd C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system

# Stage changes
git add .

# Commit with clear message
git commit -m "Sprint 0, Task 1: Plugin boilerplate complete

- Created main plugin file with headers
- Set up directory structure
- Added activation/deactivation hooks
- All tests passing"

# Push to remote (if you have one)
git push origin develop
```

**Commit Message Format:**
```
Sprint [N], Task [N]: [Brief description]

[Detailed changes]
- Change 1
- Change 2
- Change 3

[Test status: All tests passing / Integration tests pending]
```

### Step 14: Move to Next Task

```
Liron: "Task 1 complete. Ready for Task 2."
Sprint Assistant: "Great progress! Here's Task 2: Database Schema Part 1..."
                  [Provides Task 2 implementation prompt]

[Repeat Steps 7-13 for each task]
```

## 4.4 Sprint Completion

**After All Tasks Complete:**

### Step 15: Request Sprint Completion Check

```
Liron: "All tasks complete. Is Sprint 0 done?"
       OR
       "Ready for sprint completion verification"
```

**Sprint Assistant provides:**
```markdown
# SPRINT 0 COMPLETION CHECKLIST

## Individual Tasks
- [x] Task 1: Plugin Boilerplate ✅
- [x] Task 2: Database Schema Part 1 ✅
- [x] Task 3: Database Schema Part 2 ✅
- [x] Task 4: Authentication Framework ✅
- [x] Task 5: Admin Menu Structure ✅
- [x] Task 6: Error Logging ✅
- [x] Task 7: Unit Test Setup ✅
- [x] Task 8: Integration Testing ✅

## Sprint-Level Integration Tests
- [ ] All 10 database tables exist and have correct schema
- [ ] Can login to /dashboard/ with test credentials
- [ ] Error logs write to file correctly
- [ ] PHPUnit test suite runs without errors
- [ ] WordPress admin menu shows plugin sections
- [ ] Plugin activates/deactivates cleanly

## Code Quality
- [ ] All code follows WordPress Coding Standards
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] All functions have docblocks

## Git Status
- [ ] All changes committed
- [ ] Git history is clean (meaningful commit messages)
- [ ] No uncommitted files

## Documentation
- [ ] PROGRESS.md updated
- [ ] Any architectural decisions documented

## Sprint Deliverables (from Sprint Plan)
- [ ] WordPress plugin structure ✅
- [ ] Database with 10 tables ✅
- [ ] Basic authentication system ✅
- [ ] Admin menu framework ✅
- [ ] Error logging functional ✅
- [ ] Unit test infrastructure ✅

## Ready for Next Sprint?
- [ ] All above items checked
- [ ] No blocking issues
- [ ] Development environment stable
```

### Step 16: Execute Sprint Integration Tests

**Run Full Test Suite:**
```bash
# All PHPUnit tests
vendor/bin/phpunit

# Check code coverage (optional)
vendor/bin/phpunit --coverage-html coverage/

# Manual integration test
# → Test complete booking flow end-to-end (if applicable)
```

**Verify in Browser:**
- WordPress admin accessible
- Plugin shows up correctly
- No errors in any section
- Database has all expected tables

**Check Git Status:**
```bash
git status
# Should show: "nothing to commit, working tree clean"

git log --oneline -10
# Should show all task commits
```

### Step 17: Confirm Sprint Complete

**If All Checks Pass:**
```
Liron: "All sprint completion criteria met ✅"
Sprint Assistant: "Congratulations! Sprint 0 is complete.
                   
                   Summary:
                   - 8/8 tasks completed
                   - 52 hours estimated, ~[X] hours actual
                   - All tests passing
                   - All deliverables met
                   
                   Next steps:
                   1. Return to Project Assistant chat
                   2. Report Sprint 0 completion
                   3. Get Sprint 1 prompt
                   
                   Well done!"
```

**If Issues Remain:**
```
Sprint Assistant: "Sprint not complete yet. Outstanding items:
                   - [ ] Task 7 has 2 failing tests
                   - [ ] Git has uncommitted changes
                   
                   Please resolve these before marking sprint complete."
```

## 4.5 Return to Project Assistant

### Step 18: Report Sprint Completion

**Back in Project Assistant Chat:**
```
Liron: "Sprint 0 complete ✅
        
        Summary:
        - 8/8 tasks completed
        - Estimated: 52 hours
        - Actual: 58 hours (~12% over)
        - All tests passing
        - All deliverables met
        
        Notes:
        - Database migration took longer than expected (Task 2-3)
        - Authentication was smoother than anticipated (Task 4)
        
        Ready for Sprint 1?"
```

**Project Assistant responds:**
```
Project Assistant: "Excellent work on Sprint 0! 
                    
                    Analysis:
                    - 12% time variance is acceptable (learning curve)
                    - Future sprints will likely be more accurate
                    - Database work is solid foundation
                    
                    Sprint 0 → Sprint 1 Transition:
                    - Sprint 1: Customer Booking Flow (146 hours, 3 weeks)
                    - Builds on database/auth from Sprint 0
                    - Will require frontend work (new skill area)
                    
                    Adjusted estimate: Add 10% buffer = 161 hours
                    
                    Ready to generate Sprint 1 prompt?"
```

### Step 19: Get Next Sprint Prompt

```
Liron: "Yes, generate Sprint 1 prompt"

Project Assistant: [Creates Sprint_1_Implementation_Prompt.md]
                   [Saves to outputs]
                   [Provides download]
                   
                   "Sprint 1 prompt ready. 
                    Same pattern:
                    1. Save file
                    2. New chat
                    3. Paste prompt
                    4. Begin Sprint 1
                    
                    Good luck!"
```

### Step 20: Begin Next Sprint

**Repeat Steps 5-19 for Sprint 1, 2, 3, 4, 5**

---

# 5. TASK EXECUTION PATTERN

## 5.1 Task Template

Every task follows this structure:

```markdown
# TASK [N]: [Task Name]

## Goal
[What this task accomplishes]

## Prerequisites
[What must be complete before starting this task]

## Estimated Time
[Hours]

## Files to Create/Modify
- path/to/file1.php
- path/to/file2.js
- path/to/file3.css

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Code Examples
[Relevant code from architecture document]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Testing Checklist
### Automated Tests
- [ ] Unit test 1
- [ ] Unit test 2

### Manual Tests
- [ ] Manual test 1
- [ ] Manual test 2

## Verification
[How to verify task is complete]

## Common Issues
[Known pitfalls and solutions]
```

## 5.2 Task Size Guidelines

**Ideal Task Duration:**
- Minimum: 4 hours
- Maximum: 12 hours
- Target: 6-8 hours

**Why These Sizes:**
- 4 hours: Minimum for meaningful feature
- 8 hours: One full focused work day
- 12 hours: Maximum before losing focus

**If Task > 12 Hours:**
- Split into subtasks (e.g., Task 2a, Task 2b)
- Keeps progress visible
- Enables daily commits

## 5.3 Task Dependencies

**Sequential Tasks:**
```
Task 1 (Plugin Boilerplate)
  ↓ [Must complete before Task 2]
Task 2 (Database Schema)
  ↓ [Must complete before Task 4]
Task 4 (Authentication - uses database)
```

**Parallel-Ready Tasks:**
```
Task 5 (Admin Menu) ← Independent
Task 6 (Error Logging) ← Independent
```

**Rule:** Complete tasks in order unless Sprint Assistant explicitly says tasks can be parallelized (which won't happen for solo developer).

---

# 6. TESTING STRATEGY

## 6.1 Testing Layers

### Layer 1: Unit Tests (PHPUnit)
**When:** After implementing any function with logic
**Tool:** PHPUnit
**Coverage Target:** 80% of core business logic

**Example:**
```php
// tests/test-booking-validation.php
class Test_bookit_Validation extends WP_UnitTestCase {
    public function test_rejects_past_dates() {
        $result = validate_booking_date('2024-01-01');
        $this->assertWPError($result);
    }
}
```

**Run:** `vendor/bin/phpunit`

### Layer 2: Integration Tests
**When:** After completing features that interact with external services
**Tool:** Manual testing or Postman
**Focus:** Payment webhooks, email sending, calendar sync

**Example:**
```bash
# Test Stripe webhook locally
stripe listen --forward-to localhost:8080/wp-json/bookings/v1/stripe-webhook
stripe trigger payment_intent.succeeded
```

### Layer 3: Manual Browser Testing
**When:** After completing any user-facing feature
**Tool:** Your browser + WordPress site
**Focus:** Does it work as a user?

**Example Checklist:**
```
As a Customer:
- [ ] Can I load booking page?
- [ ] Can I select a service?
- [ ] Can I choose a staff member?
- [ ] Can I pick a date/time?
- [ ] Can I complete payment?
- [ ] Do I receive confirmation email?
```

### Layer 4: Accessibility Testing
**When:** After completing UI components
**Tool:** aXe DevTools browser extension
**Focus:** WCAG 2.1 AA compliance

**Example:**
```
1. Install aXe DevTools in Chrome/Firefox
2. Load booking page
3. Click "Scan for accessibility issues"
4. Fix all Critical and Serious issues
5. Document Moderate issues for later
```

## 6.2 Testing Workflow Per Task

```
Write Code in Cursor
  ↓
Run Automated Tests (PHPUnit)
  ↓ [If tests fail]
Fix Code → Re-run Tests
  ↓ [If tests pass]
Manual Browser Test
  ↓ [If manual test fails]
Fix Code → Re-run All Tests
  ↓ [If both pass]
Git Commit
  ↓
Mark Task Complete
```

## 6.3 Test Data Management

**Create Test Data Once (Sprint 0 or 1):**
```sql
-- Test services
INSERT INTO wp_bookings_services (name, duration_minutes, base_price) VALUES
('Test Service 1', 60, 50.00),
('Test Service 2', 30, 25.00);

-- Test staff
INSERT INTO wp_bookings_staff (first_name, email, password_hash) VALUES
('Test', 'staff@test.com', '$2y$10$...');

-- Test customer
INSERT INTO wp_bookings_customers (first_name, email) VALUES
('Test', 'customer@test.com');
```

**Use Same Test Data Throughout:**
- Consistency across tests
- Easier to debug
- Faster testing

---

# 7. TOOLS & ENVIRONMENT

## 7.1 Development Environment

**Local WordPress:**
- **Tool:** Local by Flywheel or wp-env
- **Version:** WordPress 6.0+
- **PHP:** 8.0+
- **Database:** MySQL 5.7+ or MariaDB 10.3+

**Local Site Structure:**
```
C:\Local Sites\booking-plugin-dev\
  ├── app\
  │   └── public\
  │       ├── wp-admin\
  │       ├── wp-content\
  │       │   └── plugins\
  │       │       └── booking-system\  ← Your plugin
  │       └── wp-config.php
  └── logs\
```

## 7.2 Cursor IDE

**Installation:** Download from cursor.sh

**Key Features:**
- **Composer (Ctrl+I):** Multi-file features
- **Chat (Ctrl+L):** Single-file edits
- **Terminal:** Built-in Git Bash/PowerShell

**Recommended Settings:**
```json
{
  "editor.formatOnSave": true,
  "files.associations": {
    "*.php": "php"
  },
  "phpcs.standard": "WordPress"
}
```

## 7.3 Database Tools

**Option 1: Adminer** (Recommended)
- Lightweight, single-file
- Install in WordPress root: `wp-content/adminer.php`
- Access: `http://localhost:10000/wp-content/adminer.php`

**Option 2: phpMyAdmin**
- Included with Local by Flywheel
- Access via Local app → Database tab

**Option 3: TablePlus** (Premium)
- Native Windows app
- Better UI than web-based tools

## 7.4 Testing Tools

**PHPUnit:**
```bash
# Install (if not already in composer.json)
composer require --dev phpunit/phpunit

# Run tests
vendor/bin/phpunit

# Run specific test file
vendor/bin/phpunit tests/test-booking-validation.php

# Run with coverage
vendor/bin/phpunit --coverage-html coverage/
```

**Browser DevTools:**
- **Chrome DevTools** (F12): Console, Network, Elements
- **aXe DevTools Extension:** Accessibility testing
- **Lighthouse:** Performance testing

**Postman:**
- API testing (webhooks, REST endpoints)
- Download from postman.com

## 7.5 Git

**Git for Windows:**
- Download from git-scm.com
- Includes Git Bash terminal
- Integrated with Cursor

**Git GUI Options:**
- **GitKraken:** Visual Git client (free for open source)
- **Git Bash:** Command line (faster for experts)
- **Cursor built-in:** Source control tab

---

# 8. FILE ORGANIZATION

## 8.1 Project Directory Structure

```
C:\Projects\booking-plugin\
  ├── docs\
  │   ├── architecture\
  │   │   ├── System_Architecture_Document_PART1_Sections_1-8.md
  │   │   └── System_Architecture_Document_PART2_Sections_9-19.md
  │   ├── requirements\
  │   │   ├── SRS_WordPress_bookit_Plugin_v1_0.md
  │   │   ├── TechnicalRequirements.md
  │   │   └── [other requirement docs]
  │   ├── sprint-prompts\
  │   │   ├── Sprint_0_Implementation_Prompt.md
  │   │   ├── Sprint_1_Implementation_Prompt.md
  │   │   └── [future sprint prompts]
  │   └── workflow\
  │       └── Development_Implementation_Workflow.md  ← This document
  │
  ├── plugin\  ← Git repository root
  │   ├── .git\
  │   ├── .gitignore
  │   ├── booking-system.php  ← Main plugin file
  │   ├── composer.json
  │   ├── package.json
  │   ├── README.md
  │   ├── PROGRESS.md  ← Track sprint/task completion
  │   │
  │   ├── includes\
  │   │   ├── class-booking.php
  │   │   ├── class-database.php
  │   │   ├── class-email.php
  │   │   └── [other classes]
  │   │
  │   ├── admin\
  │   │   ├── class-admin-menu.php
  │   │   ├── views\
  │   │   └── assets\
  │   │
  │   ├── public\
  │   │   ├── class-booking-page.php
  │   │   ├── views\
  │   │   └── assets\
  │   │
  │   ├── dashboard\  ← Separate business dashboard (Vue 3)
  │   │   ├── index.php
  │   │   ├── src\
  │   │   └── dist\
  │   │
  │   ├── tests\
  │   │   ├── bootstrap.php
  │   │   ├── test-booking-validation.php
  │   │   └── [other tests]
  │   │
  │   ├── database\
  │   │   └── migrations\
  │   │
  │   └── vendor\  ← Composer dependencies
  │
  └── local-wordpress\  ← Local by Flywheel site (symlinked to plugin)
```

## 8.2 File Naming Conventions

**PHP Files:**
- Classes: `class-{name}.php` (e.g., `class-booking.php`)
- Functions: `functions-{purpose}.php` (e.g., `functions-validation.php`)
- Views: `view-{name}.php` (e.g., `view-booking-form.php`)

**JavaScript Files:**
- `{purpose}.js` (e.g., `booking-form.js`)
- Vue components: `{ComponentName}.vue` (e.g., `BookingCalendar.vue`)

**Test Files:**
- `test-{feature}.php` (e.g., `test-booking-validation.php`)

**CSS Files:**
- `{purpose}.css` (e.g., `booking-form.css`)
- Dashboard: `dashboard.css`

## 8.3 WordPress Plugin Structure (Follows Architecture Doc Section 4)

See `System_Architecture_Document_PART1_Sections_1-8.md` Section 4.2 for complete directory tree.

---

# 9. GIT VERSION CONTROL

## 9.1 Repository Setup

**Initialize Git (Sprint 0, Task 1):**
```bash
cd C:\Projects\booking-plugin\plugin
git init
git add .
git commit -m "Initial commit: WordPress plugin boilerplate"
```

**Create .gitignore:**
```
# WordPress
wp-config.php
wp-content/uploads/
wp-content/cache/

# Dependencies
node_modules/
vendor/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Environment
.env
.env.local
```

## 9.2 Branching Strategy

**Main Branches:**
- `main` → Production-ready code (only merge from develop after sprint completion)
- `develop` → Active development (merge tasks here)

**Feature Branches (Optional for solo dev):**
- `feature/sprint-0-task-1` → If you want isolation
- Most tasks can commit directly to `develop`

**Recommended for Solo Developer:**
```
main (production)
  ↑ [Merge after sprint completion]
develop (active development)
  ← [Commit after each task]
```

## 9.3 Commit Workflow

**After Each Task:**
```bash
# Check status
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Sprint 0, Task 1: Plugin boilerplate complete

- Created main plugin file with standard headers
- Set up directory structure (includes/, admin/, public/)
- Added activation/deactivation hooks
- Basic admin menu placeholder

Tests: All passing (2/2 unit tests)"

# Push to remote (if using GitHub/GitLab)
git push origin develop
```

**After Each Sprint:**
```bash
# Switch to main
git checkout main

# Merge develop
git merge develop

# Tag the release
git tag -a v0.1.0 -m "Sprint 0 complete: Foundation & Setup"

# Push everything
git push origin main --tags

# Switch back to develop
git checkout develop
```

## 9.4 Commit Message Format

```
Sprint [N], Task [N]: [Brief description (50 chars)]

[Detailed explanation of changes]
- Bullet point 1
- Bullet point 2
- Bullet point 3

[Optional: Reference to requirements]
Implements: MUST-45, MUST-46, MUST-47

[Optional: Test status]
Tests: All passing (15/15 unit tests, manual tests complete)
```

**Examples:**

```
Sprint 0, Task 2: Database schema Part 1 implemented

- Created 5 database tables (services, staff, customers, bookings, payments)
- Added primary keys and foreign key constraints
- Implemented soft delete columns (deleted_at)
- Added composite indexes for performance

Implements: Database schema from Architecture Doc Section 5.2

Tests: Schema verified in phpMyAdmin, migration runs cleanly
```

```
Sprint 1, Task 3: Service selection step complete

- Built service selection UI (step 1 of booking flow)
- Added service filtering by category
- Implemented "No Preference" staff option
- Responsive design with Tailwind CSS

Implements: MUST-1, MUST-2, MUST-3

Tests: Manual browser testing complete, accessibility scan passed (0 issues)
```

## 9.5 Git Best Practices

**DO:**
- ✅ Commit after each completed task
- ✅ Write descriptive commit messages
- ✅ Test before committing (all tests passing)
- ✅ Commit working code only
- ✅ Use `.gitignore` to exclude generated files

**DON'T:**
- ❌ Commit broken code
- ❌ Commit sensitive data (API keys, passwords)
- ❌ Use vague messages ("fixed stuff", "updates")
- ❌ Go multiple days without committing
- ❌ Commit directly to `main` branch

---

# 10. TROUBLESHOOTING & ESCALATION

## 10.1 Troubleshooting Decision Tree

```
Problem Occurs
  ↓
Can I Google the exact error? → YES → Try solution → Fixed? → Continue
  ↓ NO or NOT FIXED
Is it a Cursor usage question? → YES → Ask Sprint Assistant
  ↓ NO
Is it a WordPress/PHP question? → YES → Ask Sprint Assistant
  ↓ NO
Is it an architecture decision? → YES → ESCALATE to Project Assistant
  ↓ NO
Is it a scope question? → YES → ESCALATE to Project Assistant
  ↓ NO
Spent >30 minutes stuck? → YES → Ask Sprint Assistant
```

## 10.2 When to Ask Sprint Assistant

**Implementation Questions:**
- "How should I structure this class?"
- "What's the best way to validate this input?"
- "How do I test this webhook?"
- "Cursor generated code that doesn't work, what's wrong?"
- "I'm getting PHP error X, how do I fix it?"

**Testing Questions:**
- "What tests should I write for this function?"
- "How do I mock this external API call?"
- "Is this test coverage sufficient?"

**WordPress Questions:**
- "What's the WordPress way to do X?"
- "Which hook should I use here?"
- "How do I enqueue this script properly?"

**Pattern:**
```
Liron: "Getting error when activating plugin: 
       Fatal error: Class 'bookit_Database' not found
       
       Code is in includes/class-database.php
       Main file has: require_once 'includes/class-database.php'
       
       What's wrong?"

Sprint Assistant: [Analyzes issue]
                  "The problem is the require_once path. In WordPress plugins,
                   you need to use plugin_dir_path() for reliable paths.
                   
                   Change to:
                   require_once plugin_dir_path(__FILE__) . 'includes/class-database.php'
                   
                   This gives you absolute path regardless of where WordPress is installed."
```

## 10.3 When to Escalate to Project Assistant

**Architecture Decisions:**
- "Should I use custom post types or custom tables for X?"
- "Architecture doc says Y, but I think Z is better. Should I deviate?"
- "This approach conflicts with the architecture, what should I do?"

**Scope Questions:**
- "Is feature X in Sprint 1 or Sprint 2?"
- "Should this be a MUST HAVE or SHOULD HAVE?"
- "Customer asked for feature Y, should I add it?"

**Timeline/Planning:**
- "Sprint 1 is taking much longer than 146 hours, what should I do?"
- "I want to reorder tasks in Sprint 2, is that okay?"
- "Should I split Sprint 3 into two sprints?"

**Pattern:**
```
[In Sprint 1 Chat]
Liron: "I think the 'No Preference' algorithm is too complex for Sprint 1.
        Should I defer it to Sprint 2?"

Sprint Assistant: "This is a scope decision. Please escalate to Project Assistant.
                   
                   Context to provide:
                   - Current task: Service Selection (Step 2)
                   - Issue: 'No Preference' algorithm complexity
                   - Proposed change: Defer to Sprint 2
                   - Impact: Sprint 1 timeline, customer booking flow
                   
                   Tag me (@Sprint 1 Assistant) when you return with decision."

[Switch to Project Assistant Chat]
Liron: "Scope question from Sprint 1:
        
        'No Preference' algorithm (MUST-7) proving more complex than estimated.
        Would add ~20 hours to Sprint 1 (already at 150/146 hours).
        
        Options:
        1. Continue, accept Sprint 1 delay
        2. Defer to Sprint 2, manually assign staff for now
        
        Recommendation?"

Project Assistant: [Analyzes requirements]
                   [Reviews architecture doc]
                   
                   "MUST-7 is required for MVP launch.
                    
                    Decision: Continue in Sprint 1, but simplify algorithm.
                    
                    Phase 1 approach:
                    - Random staff selection (1 hour to implement)
                    - Phase 2: Implement intelligent algorithm
                    
                    This satisfies MUST-7 (feature exists) while managing timeline.
                    
                    Return to Sprint 1 Assistant with this direction."

[Back to Sprint 1 Chat]
Liron: "Project Assistant decision: Implement simplified 'No Preference' algorithm
        - Random selection from available staff
        - Defer intelligent matching to Phase 2
        
        Proceeding with simplified approach."

Sprint Assistant: "Understood. I'll adjust Task 3 guidance for simplified algorithm.
                   Ready to continue?"
```

## 10.4 Common Issues & Solutions

### Issue: Plugin Won't Activate
**Symptoms:** White screen, fatal error
**Debug:**
```bash
# Enable WordPress debug mode
# Edit: C:\Local Sites\your-site\app\public\wp-config.php

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

# Check debug log
C:\Local Sites\your-site\app\public\wp-content\debug.log
```

### Issue: Database Tables Not Creating
**Symptoms:** Tables missing in phpMyAdmin
**Debug:**
```php
// In plugin activation function, add:
global $wpdb;
echo $wpdb->last_error; // Shows SQL error
echo $wpdb->last_query; // Shows last SQL query
```

### Issue: Cursor Generated Code Doesn't Match Architecture
**Symptoms:** Code structure differs from architecture doc
**Solution:**
- Reference architecture doc section in Cursor prompt
- Paste specific code example from architecture
- Tell Cursor: "Follow this exact pattern from architecture document"

### Issue: Tests Failing After Code Change
**Symptoms:** PHPUnit shows errors
**Debug:**
```bash
# Run with verbose output
vendor/bin/phpunit --verbose

# Run specific test
vendor/bin/phpunit tests/test-booking-validation.php --verbose

# Check test logic vs. actual code
```

### Issue: Git Conflicts (If Using Remote)
**Symptoms:** `git push` fails with conflict
**Solution:**
```bash
# Pull latest changes
git pull origin develop

# If conflicts, resolve manually
# Then:
git add .
git commit -m "Resolved merge conflicts"
git push origin develop
```

---

# 11. PROGRESS TRACKING

## 11.1 Progress Tracking File

**Create: `PROGRESS.md` in Plugin Root**

```markdown
# WordPress Booking Plugin - Development Progress

**Project Start:** January 24, 2026  
**Target Launch:** Week 22 (June 2026)

---

## SPRINT 0: Foundation & Setup (Weeks 3-4)
**Status:** ✅ COMPLETE  
**Duration:** January 24 - February 7, 2026  
**Estimated Hours:** 52  
**Actual Hours:** 58  

### Tasks
- [x] Task 1: Plugin Boilerplate (8h → 7h) ✅ Jan 24
- [x] Task 2: Database Schema Part 1 (8h → 10h) ✅ Jan 25
- [x] Task 3: Database Schema Part 2 (8h → 9h) ✅ Jan 26
- [x] Task 4: Authentication Framework (8h → 8h) ✅ Jan 27-28
- [x] Task 5: Admin Menu Structure (4h → 4h) ✅ Jan 29
- [x] Task 6: Error Logging (4h → 5h) ✅ Jan 30
- [x] Task 7: Unit Test Setup (4h → 6h) ✅ Jan 31
- [x] Task 8: Integration Testing (8h → 9h) ✅ Feb 1-2

### Deliverables
- [x] WordPress plugin structure ✅
- [x] Database with 10 tables ✅
- [x] Basic authentication system ✅
- [x] Admin menu framework ✅
- [x] Error logging functional ✅
- [x] Unit test infrastructure ✅

### Learnings
- Database migrations took longer than expected (foreign key constraints)
- Authentication simpler than anticipated
- Unit test setup required more configuration than planned

---

## SPRINT 1: Customer Booking Flow (Weeks 5-7)
**Status:** 🟡 IN PROGRESS  
**Duration:** February 8 - February 28, 2026  
**Estimated Hours:** 146 (adjusted to 161 with buffer)  

### Tasks
- [x] Task 1: Booking Page Structure (12h → 14h) ✅ Feb 8-9
- [x] Task 2: Service Selection UI (16h → 18h) ✅ Feb 10-12
- [ ] Task 3: Staff Selection UI (16h) 🔄 In Progress
- [ ] Task 4: Date/Time Picker (20h)
- [ ] Task 5: Contact Form (12h)
- [ ] Task 6: Session Management (16h)
- [ ] Task 7: Availability Algorithm (24h)
- [ ] Task 8: Integration Testing (16h)

### Deliverables
- [ ] 4-step booking wizard
- [ ] Service filtering by category
- [ ] Staff selection with "No Preference"
- [ ] Date/time slot selection
- [ ] Customer contact form
- [ ] Session persistence
- [ ] Real-time availability checking

---

## SPRINT 2: Payment Integration (Weeks 8-10)
**Status:** ⚪ NOT STARTED  
**Duration:** March 1 - March 21, 2026  
**Estimated Hours:** 123  

[Tasks to be generated when Sprint 1 completes]

---

## Overall Progress

**Sprints Complete:** 1/6 (17%)  
**Total Hours:** 58/1,041 (6%)  
**Current Sprint:** Sprint 1 (Week 1 of 3)  
**On Track:** ✅ Yes (slightly ahead)  

**Next Milestone:** Sprint 1 Complete (Feb 28)
```

## 11.2 Updating Progress

**After Each Task:**
```markdown
Update task line:
- [x] Task 3: Database Schema Part 2 (8h → 9h) ✅ Jan 26
     ↑ Status    ↑ Task name        ↑ Actual  ↑ Date
```

**After Each Sprint:**
```markdown
Change sprint status:
**Status:** ✅ COMPLETE

Add learnings:
### Learnings
- Key insight 1
- Key insight 2
```

**Weekly Review:**
```markdown
Update "Overall Progress":
**Sprints Complete:** 2/6 (33%)
**Total Hours:** 204/1,041 (20%)
**On Track:** ✅ Yes / ⚠️ Slightly behind / 🔴 Behind
```

## 11.3 Sprint Chat Progress Tracking

**Sprint Assistant maintains a checklist in chat:**

```markdown
# SPRINT 0 PROGRESS TRACKER

## Tasks
- [x] Task 1: Plugin Boilerplate ✅ (7h actual)
- [x] Task 2: Database Part 1 ✅ (10h actual)
- [x] Task 3: Database Part 2 ✅ (9h actual)
- [x] Task 4: Authentication ✅ (8h actual)
- [x] Task 5: Admin Menu ✅ (4h actual)
- [x] Task 6: Error Logging ✅ (5h actual)
- [x] Task 7: Unit Tests ✅ (6h actual)
- [x] Task 8: Integration ✅ (9h actual)

## Total Hours
Estimated: 52h
Actual: 58h
Variance: +6h (+12%)

## Sprint Status
All tasks complete ✅
All tests passing ✅
All deliverables met ✅
Sprint 0: COMPLETE ✅
```

---

# 12. QUALITY STANDARDS

## 12.1 Code Quality Checklist

**Before Marking Task Complete:**

```markdown
## Code Quality Checklist

### WordPress Standards
- [ ] Follows WordPress Coding Standards (PHP, JS, CSS)
- [ ] Functions have docblocks
- [ ] Variables use descriptive names
- [ ] No hardcoded values (use constants/settings)

### Security
- [ ] All inputs validated/sanitized
- [ ] All outputs escaped
- [ ] Prepared statements for database queries
- [ ] Nonces for forms/AJAX

### Accessibility
- [ ] Semantic HTML5
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast ≥4.5:1

### Performance
- [ ] No N+1 query problems
- [ ] Assets minified (production)
- [ ] Images optimized
- [ ] Database queries use indexes

### Testing
- [ ] Unit tests written and passing
- [ ] Manual tests completed
- [ ] Edge cases considered

### Documentation
- [ ] Code comments for complex logic
- [ ] README updated (if applicable)
- [ ] PROGRESS.md updated
```

## 12.2 Acceptance Criteria Format

**Every task has specific, measurable criteria:**

```markdown
## Acceptance Criteria

### Functional
- [ ] User can select a service from dropdown
- [ ] Service price displays correctly
- [ ] "No services available" shows if none exist
- [ ] Service selection persists in session

### Technical
- [ ] Service data fetched from wp_bookings_services table
- [ ] Query uses INDEX on is_active column
- [ ] JavaScript has no console errors
- [ ] Works in Chrome, Firefox, Safari, Edge

### Quality
- [ ] Passes aXe accessibility scan (0 critical issues)
- [ ] Page load <2 seconds
- [ ] Mobile responsive (320px to 1920px)
- [ ] PHPUnit tests pass (100%)

### Definition of Done
ALL checkboxes above must be ✅ before task is complete.
```

## 12.3 Definition of Done (Sprint Level)

**A Sprint is complete when:**

```markdown
## Sprint Definition of Done

### All Tasks
- [ ] Every task marked complete with ✅
- [ ] All task acceptance criteria met

### Testing
- [ ] All PHPUnit tests passing
- [ ] Integration tests complete
- [ ] Manual testing complete
- [ ] Accessibility scan shows 0 critical issues

### Code Quality
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Code follows WordPress standards
- [ ] All functions documented

### Version Control
- [ ] All changes committed to Git
- [ ] Meaningful commit messages
- [ ] No uncommitted files
- [ ] Sprint tagged (e.g., v0.1.0)

### Documentation
- [ ] PROGRESS.md updated
- [ ] Architectural decisions documented
- [ ] Known issues logged

### Sprint Deliverables
- [ ] All deliverables from sprint plan met
- [ ] Feature works end-to-end
- [ ] No blocking bugs

### Deployment Readiness
- [ ] Plugin activates/deactivates cleanly
- [ ] Database migration runs successfully
- [ ] No conflicts with WordPress core
- [ ] Ready for next sprint
```

---

# 13. WORKFLOW EXAMPLES

## 13.1 Complete Sprint Workflow Example

**Example: Sprint 0 - Full Lifecycle**

### Week 1: Planning & Setup

**Monday (Project Assistant Chat):**
```
Liron: "Ready to start Sprint 0"

Project Assistant: [Provides Sprint 0 overview]
                   [Generates Sprint_0_Implementation_Prompt.md]
                   
Liron: [Downloads file]
       [Saves to C:\Projects\booking-plugin\docs\sprint-prompts\]
```

**Tuesday (New Sprint 0 Chat):**
```
[Opens new Claude chat]
Liron: [Pastes entire Sprint_0_Implementation_Prompt.md]

Sprint Assistant: "Sprint 0 initialized. 8 tasks ready.
                   
                   Task 1: Plugin Boilerplate (8h)
                   Task 2: Database Schema Part 1 (8h)
                   ...
                   
                   Which task would you like to start?"

Liron: "Start Task 1"

Sprint Assistant: [Provides implementation prompt for Cursor]

Liron: [Opens Cursor]
       [Pastes prompt into Composer]
       [Cursor generates plugin structure]
       [Reviews code]
       [Saves files]

Liron: "Task 1 code complete. How do I test?"

Sprint Assistant: [Provides testing checklist]

Liron: [Runs manual tests]
       [Plugin activates successfully ✅]
       
Liron: "All tests passing ✅"

Sprint Assistant: "Great! Commit and move to Task 2?"

Liron: [Commits to Git]
       git commit -m "Sprint 0, Task 1: Plugin boilerplate complete"

Liron: "Task 1 complete. Ready for Task 2."
```

### Week 2: Development

**Wednesday-Friday:**
```
[Repeat Task 2, 3, 4 following same pattern]
- Get implementation prompt
- Code in Cursor
- Test
- Commit
- Move to next task
```

**Weekend:**
```
[Optional: Review progress, catch up if needed]
```

### Week 3: Completion

**Monday-Tuesday:**
```
[Complete Tasks 5, 6, 7]
```

**Wednesday:**
```
Liron: "All tasks 1-7 complete. Ready for Task 8: Integration Testing"

Sprint Assistant: [Provides integration test checklist]

Liron: [Runs full test suite]
       [Tests complete booking flow]
       [Verifies all database tables]
       [Checks WordPress admin]

Liron: "All integration tests passing ✅"

Sprint Assistant: "Excellent! Let's verify sprint completion..."
                  [Runs sprint completion checklist]
                  
                  "Sprint 0 COMPLETE ✅
                   
                   Summary:
                   - 8/8 tasks complete
                   - All tests passing
                   - All deliverables met
                   
                   Return to Project Assistant chat to report completion."
```

**Thursday (Back to Project Assistant Chat):**
```
Liron: "Sprint 0 complete ✅
        
        Summary:
        - 8/8 tasks done
        - 52h estimated, 58h actual (+12%)
        - All tests passing
        
        Database migrations took longer than expected.
        Ready for Sprint 1?"

Project Assistant: "Excellent work! +12% variance acceptable for first sprint.
                    
                    Sprint 1: Customer Booking Flow
                    - 146 hours estimated
                    - Adjusted to 161h with 10% buffer
                    - 3 weeks duration
                    
                    Generate Sprint 1 prompt?"

Liron: "Yes, generate Sprint 1 prompt"

Project Assistant: [Creates Sprint_1_Implementation_Prompt.md]
                   [Provides download]

Liron: [Saves file]
       [Weekend break before starting Sprint 1]
```

**Next Monday:**
```
[Opens new Claude chat for Sprint 1]
[Pastes Sprint_1_Implementation_Prompt.md]
[Sprint 1 begins...]
```

## 13.2 Task Execution Example

**Example: Sprint 1, Task 3 - Staff Selection UI**

```
[Sprint 1 Chat]

Liron: "Ready for Task 3: Staff Selection UI"

Sprint Assistant: "Task 3: Staff Selection UI (16 hours)
                   
                   IMPLEMENTATION PROMPT FOR CURSOR:
                   [Provides detailed prompt - paste into Cursor]
                   
                   Key requirements:
                   - Display available staff for selected service
                   - Show staff photos (if available) or initials
                   - Implement 'No Preference' option
                   - Highlight recommended staff
                   
                   Ready to begin?"

Liron: "Yes"
       [Opens Cursor Composer]
       [Pastes implementation prompt]

Cursor: [Generates files:]
        - public/views/view-staff-selection.php
        - public/assets/js/staff-selection.js
        - public/assets/css/staff-selection.css
        - includes/class-staff-selector.php

Liron: [Reviews generated code]
       [Makes minor adjustments]
       [Saves all files]
       [Loads booking page in browser]
       
       "Staff selection UI rendering correctly ✅
        How do I test it?"

Sprint Assistant: [Provides testing checklist:]
                  
                  "TESTING CHECKLIST:
                  
                  Automated Tests:
                  - [ ] vendor/bin/phpunit tests/test-staff-selector.php
                  
                  Manual Tests:
                  1. Select a service
                  2. Verify staff list appears
                  3. Click each staff member
                  4. Verify selection persists
                  5. Click 'No Preference'
                  6. Verify 'Any available' selected
                  
                  Accessibility:
                  - [ ] Run aXe scan on booking page
                  - [ ] Keyboard navigation (Tab through staff)
                  - [ ] Focus indicators visible
                  
                  Edge Cases:
                  - [ ] Service with 0 staff (should show message)
                  - [ ] Service with 1 staff (auto-select?)
                  - [ ] Service with 10+ staff (scrollable?)"

Liron: [Runs PHPUnit tests]
       vendor/bin/phpunit tests/test-staff-selector.php
       
       "2 tests failing:
        - testNoPreferenceSelection() failing
        - Error: 'No preference' option not found in DOM"

Sprint Assistant: "The 'No Preference' option needs to be added to the HTML.
                   
                   In public/views/view-staff-selection.php, add:
                   
                   <div class='staff-option no-preference'>
                     <input type='radio' name='staff_id' value='0' id='staff-none'>
                     <label for='staff-none'>
                       No Preference - Any Available Staff
                     </label>
                   </div>
                   
                   Then update JavaScript to handle value='0'"

Liron: [Makes fix in Cursor]
       [Re-runs tests]
       
       "All tests passing ✅"
       
       [Runs manual tests]
       [All manual tests passing ✅]
       
       [Runs aXe accessibility scan]
       "0 critical issues, 1 moderate (color contrast on disabled state)"

Sprint Assistant: "Moderate issue acceptable for now. Log it for Sprint 5 (Polish).
                   
                   Ready to commit?"

Liron: "Yes"
       
       git add .
       git commit -m "Sprint 1, Task 3: Staff selection UI complete
       
       - Created staff selection view and component
       - Implemented 'No Preference' option
       - Added staff photos with fallback to initials
       - Responsive grid layout (1-4 columns)
       - Keyboard accessible, ARIA labels
       
       Tests: 8/8 unit tests passing, manual tests complete
       Accessibility: aXe scan 0 critical (1 moderate logged)"
       
       git push origin develop

Liron: "Task 3 complete ✅. Ready for Task 4."

Sprint Assistant: [Updates progress tracker]
                  [Provides Task 4 prompt]
```

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | Initial version - Complete workflow documentation |

---

## QUICK REFERENCE

### Chat Roles Summary
- **Project Assistant** (main chat) = Strategic planning, sprint transitions
- **Sprint Assistant** (per sprint) = Task breakdowns, implementation guidance
- **Cursor** = Code execution

### File Locations
- Sprint prompts: `C:\Projects\booking-plugin\docs\sprint-prompts\`
- Plugin code: `C:\Local Sites\your-site\app\public\wp-content\plugins\booking-system\`
- Progress tracking: `C:\Projects\booking-plugin\plugin\PROGRESS.md`

### Key Commands
```bash
# Run tests
vendor/bin/phpunit

# Git commit
git add .
git commit -m "Sprint N, Task N: Description"

# Check WordPress logs
C:\Local Sites\your-site\app\public\wp-content\debug.log
```

### When to Escalate
- Architecture decisions → Project Assistant
- Scope changes → Project Assistant
- Implementation questions → Sprint Assistant
- Stuck >30 minutes → Sprint Assistant

---

**END OF WORKFLOW DOCUMENTATION**

This document should be uploaded to Project Knowledge and referenced by both Liron and Claude throughout all sprints.
