# Sprint 3 Implementation Prompt - Generation 🚀

Perfect timing! Let me create a comprehensive Sprint 3 prompt based on your workflow and Sprint 2 learnings.

First, let me check the project knowledge for Sprint 3 requirements...I notice there's a discrepancy - the project knowledge shows **Sprint 4** as the Business Dashboard, but your summary says you're moving to **Sprint 3** for the dashboard. Let me clarify the correct sequence and create the appropriate prompt.Perfect! I now see the correct sequence. Based on your summary, you want to **skip the original Sprint 3 (Email Notifications/Magic Links)** and go straight to **Sprint 4 (Business Dashboard)** - which you're calling "Sprint 3" in your workflow.

Let me create the Sprint 3 (Business Dashboard) implementation prompt now...# Sprint 3 (Business Dashboard) Implementation Prompt Ready! ✅

## 📥 Download Your Prompt

I've created a comprehensive **Sprint 3 Business Dashboard Implementation Prompt** (~300+ lines) ready to paste into a new Claude chat.

---

## 🎯 Key Adjustments Made

### **Sprint Sequence Clarification**

Based on your summary, I've adjusted the sprint sequence:

**Original Plan:**
- Sprint 3 = Email Notifications/Magic Links (160h)
- Sprint 4 = Business Dashboard (259h)

**Your New Plan (Smart!):**
- Sprint 3 = **Business Dashboard** (112h adjusted)
- Email Notifications = Postponed (like PayPal/refunds)

**Rationale Applied:**
- ✅ Dashboard can be built/tested locally (no live site needed)
- ✅ Core features working (bookings, payments)
- ✅ Business needs usable interface NOW
- ⏭️ Email notifications require live environment (test later with PayPal)

---

## 📊 Sprint 3 Overview

### **12 Tasks, 112 Hours** (reduced from original 259h)

**Focused on MUST-HAVE features only:**

| Task | Hours | What It Does |
|------|-------|--------------|
| Vue 3 Setup | 12h | Project scaffolding, Vite, Tailwind |
| Authentication | 10h | Login/logout, session management |
| Today's Schedule | 10h | Dashboard homepage widget |
| Bookings List | 12h | Table with filters, search, pagination |
| Manual Booking | 12h | Create bookings for customers |
| Edit Booking | 10h | Reschedule, change service/staff |
| Services CRUD | 10h | Add/edit/delete services |
| Categories CRUD | 6h | Manage service categories |
| Staff CRUD | 10h | Add/edit/delete staff |
| Working Hours | 12h | Configure staff schedules |
| Settings Pages | 10h | Payment, policy, branding config |
| Polish & Mobile | 8h | Responsive design, UX improvements |

**What's Deferred to Phase 2:**
- ❌ Calendar view (complex)
- ❌ Revenue reports
- ❌ Customer database
- ❌ Setup wizard
- ❌ CSV export
- ❌ Drag-and-drop

---

## 🌟 Why This Sprint Is Special

### **Your Unique Differentiator!**

This is the feature that **NO competitor offers:**
- Separate dashboard (not WordPress admin)
- Business owners need ZERO WordPress knowledge
- Professional, branded interface
- Vue 3 SPA = Modern, fast, interactive

**Market Impact:**
- Fresha: SaaS with ongoing fees
- Bookly/Amelia: Require WordPress admin
- **You: Professional dashboard, no monthly fees, data ownership** ✅

---

## 🛠️ Technology Stack

### **Frontend: Vue 3 Ecosystem**

```
Vue 3 (Composition API)
├── Vite (dev server + build)
├── Vue Router 4 (routing)
├── Tailwind CSS 3 (styling)
├── Axios (HTTP client)
└── Jest + Vue Test Utils (testing)
```

### **Backend: WordPress REST API**

```php
/wp-json/bookit/v1/dashboard/auth/login
/wp-json/bookit/v1/dashboard/bookings
/wp-json/bookit/v1/dashboard/services
/wp-json/bookit/v1/dashboard/staff
/wp-json/bookit/v1/dashboard/settings
```

### **Authentication: PHP Session**

- Separate from WordPress users
- Stored in `wp_bookings_users` table
- 8-hour timeout
- Session-based (not JWT for simplicity)

---

## 📋 Sprint 3 Learnings Applied

### **From Sprint 2:**

✅ **Better Unit Test Prompts**
- Include test structure upfront
- Provide Jest patterns for Vue
- PHPUnit patterns for REST API

✅ **Local Development Works**
- Dashboard builds/tests locally
- No live site needed (unlike payments)
- Vue dev server = hot reload

✅ **What Worked in Sprint 2:**
- Cursor prompts effective
- Database-backed systems reliable
- REST API architecture solid
- 87 unit tests passing foundation

---

## 🎯 Sprint 3 Success Criteria

### **Must Work:**

**Business Owner Can:**
- ✅ Log in to separate dashboard (/dashboard/)
- ✅ View today's upcoming bookings
- ✅ See all bookings (list with filters)
- ✅ Create manual booking for customer
- ✅ Edit existing booking
- ✅ Add/edit/delete services
- ✅ Add/edit/delete staff
- ✅ Configure working hours
- ✅ Update settings (payment keys, policy)

**Technical:**
- ✅ Vue 3 app builds without errors
- ✅ All REST API endpoints working
- ✅ Dashboard responsive (mobile/tablet/desktop)
- ✅ Jest tests passing (Vue components)
- ✅ PHPUnit tests passing (REST API)
- ✅ No console errors

---

## 🚀 How to Use This Prompt

### **Step 1: Download & Save**
- Download: `Sprint_3_Business_Dashboard_Implementation_Prompt.md`
- Save locally: `C:\Projects\booking-plugin\docs\sprint-prompts\`

### **Step 2: Open New Chat**
- **Open BRAND NEW Claude chat** (not this Project Assistant chat)
- **Name it:** "Sprint 3 Business Dashboard Implementation"

### **Step 3: Paste & Start**
- Paste **entire prompt** into new chat
- Sprint Assistant will initialize
- Say: "Ready for Task 1"
- Get full implementation details

### **Step 4: Development Workflow**
```
For each of 12 tasks:
1. Request task from Sprint Assistant
2. Get Cursor-ready implementation prompt
3. Paste into Cursor Composer
4. Implement (Vue + PHP)
5. Test (Jest + PHPUnit + manual)
6. Commit to Git
7. Return to Sprint chat: "Task complete"
8. Move to next task
```

### **Step 5: Sprint Completion**
- Complete all 12 tasks
- Run full test suite
- Test dashboard end-to-end
- Return to **Project Assistant** (this chat) with completion report

---

## ⚠️ Important Notes

### **Vue 3 Learning Curve**

This is your **first Vue 3 work** in the project:

**Expect:**
- Initial setup might take longer (learning Vite, Vue Router)
- Component structure new compared to vanilla JS
- Composition API is different from Options API
- But: MUCH better for complex UIs like dashboards

**Resources:**
- Vue 3 docs: https://vuejs.org/
- Vite docs: https://vitejs.dev/
- Vue Router: https://router.vuejs.org/
- Cursor will help generate boilerplate!

### **Complex Tasks Flagged**

**Task 5: Manual Booking Creation (12h)** 🔥
- Reuses availability algorithm from Sprint 1
- Multi-step modal
- Payment handling

**Task 10: Staff Working Hours (12h)** 🔥
- Complex UI (weekly grid + exceptions)
- Split shift support
- Database operations for multiple records

**Recommendation:** Take breaks during complex tasks, test thoroughly.

---

## 📈 Expected Timeline

**Estimated Duration:** 4-5 weeks at your pace

**Based on Sprint 2 performance:**
- Sprint 2: 44% complete in your session
- You work efficiently
- 112 hours = ~3-4 weeks at 30-35h/week

**Realistic Timeline:**
- Week 1: Tasks 1-3 (Vue setup, auth, today's schedule)
- Week 2: Tasks 4-6 (bookings management)
- Week 3: Tasks 7-9 (services/staff CRUD)
- Week 4: Tasks 10-12 (working hours, settings, polish)

---

## 🎉 After Sprint 3

### **What You'll Have:**

✅ **Fully functional business dashboard** (your unique differentiator!)  
✅ **Vue 3 expertise** (new skill!)  
✅ **Core booking management** (CRUD operations)  
✅ **Professional interface** (no WordPress admin needed)

### **What's Still Pending:**

⏭️ **Email Notifications** (original Sprint 3 - requires live site)  
⏭️ **PayPal Integration** (Sprint 2 remainder - requires live site)  
⏭️ **Refund Processing** (Sprint 2 remainder - requires live site)  
⏭️ **Google Calendar** (Sprint 5 - can do locally with test account)

### **Next Steps Options:**

**Option A:** Deploy to live dev site, complete Sprint 2 pending items (PayPal, refunds, test emails)  
**Option B:** Continue to Google Calendar integration (Sprint 5) - can test locally  
**Option C:** Go back to email notifications (original Sprint 3) - requires live site

**Recommendation:** Complete Sprint 3 (Dashboard), then deploy to live dev site and complete all pending live-testing items together.

---

## ✅ Summary

**Sprint 3 Prompt Generated:**
- 12 tasks, 112 hours
- Vue 3 Business Dashboard
- Your unique differentiator
- Can build/test entirely locally
- Includes Sprint 2 learnings (better test prompts)

**Ready to paste into new chat and start building!** 🚀

**Need anything else before starting Sprint 3?**