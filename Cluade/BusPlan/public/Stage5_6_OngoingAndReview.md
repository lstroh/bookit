# Stage 5 & 6 — Ongoing Monthly and Quarterly Review
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.1
**Date:** March 2026
**Status:** Active Reference
**Applies To:** All live clients — Professional Plan

---

## Overview

Stages 5 and 6 are where the monthly subscription earns its keep — for both you and your clients. Stage 5 is the operational layer: keeping sites healthy, catching problems early, and making clients feel looked after without them having to ask. Stage 6 is the relationship layer: a quarterly conversation that protects retention, surfaces upsell opportunities, and gives you product feedback.

Together these two stages should take no more than 30–45 minutes per client per month on average, rising to around 60 minutes in months that include a quarterly review.

---

# STAGE 5 — Ongoing Monthly

**Trigger:** Automated — first working week of every month, per client
**Goal:** Site stays healthy, client feels looked after, issues caught before they become problems
**Time required:** 20–30 minutes per site per month (plus reactive time if issues arise)

| Field | Detail |
|---|---|
| **Trigger** | Recurring — first working week of each month |
| **Goal** | Site healthy, client informed, nothing breaking silently |
| **Tools** | UptimeRobot, BlogVault, Wordfence, Brevo, Local by Flywheel / WP Staging, Stripe, Bonsai |
| **Outcome** | Monthly report filed, check-in email sent, any issues resolved |

---

## The Monthly Maintenance Window

Set aside one dedicated session per client per month — ideally during the first working week. Do not let maintenance drift to the end of the month. Issues found early in the month can be resolved before the client notices; issues found at the end of the month mean you have been carrying a risk for weeks.

As you grow to 5+ clients, batch maintenance into a single morning or afternoon per week rather than spreading it across the month. This protects your evenings and weekends.

---

## Step 5.1 — Check Monitoring Dashboards (5 minutes)

Open each tool and review last month's status for the client.

**UptimeRobot:**
- Was the site up for the full month? (Target: 99.9%+)
- Any incidents? If yes: when, how long, was it resolved, did the client notice?
- If there was downtime you didn't catch in real time — investigate now
- **SSL certificate status:** UptimeRobot monitors SSL expiry automatically. Flag immediately if under 30 days to renewal. (This should never happen on Hostinger — SSL auto-renews — but confirm the auto-renewal succeeded.)

**BlogVault:**
- Did all daily backups complete? (30 or 31 out of 30/31 should show as successful)
- Any failures? If yes: what caused it, has it been resolved, is the backup now current?
- Verify the most recent backup is less than 24 hours old

**Wordfence:**
- Open Wordfence → Dashboard on the live site
- Any critical alerts? (Malware, vulnerabilities, blocked attacks that need review)
- Any plugin or theme vulnerabilities flagged?
- Note how many login attempts were blocked — informational, rarely needs action

**What to do if you find a problem:**
Resolve it before sending the monthly check-in email. The email should either report a clean month or explain what happened and what you did — never send the check-in email with an open unresolved issue.

---

## Step 5.2 — WordPress Updates (10–15 minutes)

**The rule: never auto-update a live client site. Always test on staging first.**

**Before you start — two pre-update checks:**
1. Confirm BlogVault shows a successful backup from the last 24 hours. If not, trigger a manual backup and wait for it to complete before touching anything.
2. Refresh the staging environment from the current live site if it hasn't been synced this month. Testing updates against a stale clone gives unreliable results.

**Update process:**
1. Log into the live WordPress admin
2. Check for pending updates: Dashboard → Updates
3. Note what needs updating: WordPress core, plugins, themes
4. **Read the changelog for any plugin with a major version bump before applying** — a changelog flagging "breaking changes" or "database schema changes" warrants extra caution on staging. This is especially important for Wimbledon Smart Plugin releases: check for downstream effects on Stripe, Brevo, and Google Calendar integrations before pushing to any client.
5. Go to the staging environment for this client (Local by Flywheel or WP Staging)
6. Apply all pending updates to staging
7. Test the full booking flow end-to-end on staging:
   - Make a test booking
   - Confirm deposit/payment processes correctly (test mode)
   - Confirm confirmation email sends
   - Confirm booking appears in dashboard
   - Confirm calendar sync triggers
   - Check Tools → Site Health for any new PHP errors or warnings
8. Check all pages load correctly after the update
9. If staging passes: apply the same updates to live
10. Repeat the booking flow test on live (brief — just confirm it's working)
11. Log everything applied in the monthly report

**If an update breaks staging:** Do not apply to live. Investigate — is it a plugin conflict? A theme incompatibility? Resolve on staging first, then apply to live. If you cannot resolve it quickly, note it in the report and schedule a fix.

**WordPress core updates:** Apply minor version updates (e.g. 6.5.1 → 6.5.2) as routine. Treat major version updates (e.g. 6.5 → 6.6) with more caution — test on staging for longer before applying to live.

**Wimbledon Smart Plugin updates:** When you release a new version of your own plugin, test it on staging for every client before pushing to live. Your plugin updates affect the core booking functionality — one broken update affects every client.

---

## Step 5.3 — Plugin and System Check (5 minutes)

Log into the WordPress admin on the live site and check:

- **Plugin error logs:** Any errors logged since last month? Failed bookings, failed notifications, failed calendar syncs? After reviewing, **clear the log** so next month's entries are fresh — carried-over noise makes it harder to spot new problems.
- **WP_DEBUG status:** Confirm `WP_DEBUG` is set to `false` in `wp-config.php` on all live client sites. Debug logging should only ever be enabled temporarily when actively diagnosing a specific issue, then turned off immediately. Leaving it on degrades performance and can expose sensitive path information.
- **Stripe connection:** Is the payment gateway still connected and processing? Check Stripe Dashboard → Payments for any recent failures
- **Google Calendar sync:** Is it still active for all staff? Calendar sync tokens expire — if a staff member changed their Google password, the sync will have broken silently
- **Brevo email delivery:** Log into Brevo → Statistics. Any unusual drop in delivery rate? Any spike in bounces or spam reports?

**If Google Calendar sync has broken for a staff member:**
> *"Hi [Staff Name / Business Owner], I noticed the calendar sync for [staff name] has disconnected — this sometimes happens when a Google password is changed. They just need to reconnect it: [dashboard URL] → Settings → Calendar Sync → Reconnect Google Calendar. Takes about 30 seconds."*

---

## Step 5.4 — Housekeeping (5 minutes)

These are fast, low-effort tasks that prevent slow-accumulating problems.

**Database optimisation:**
- Run WP-Optimize (WordPress admin → WP-Optimize → Run all optimizations)
- This clears post revisions, auto-drafts, expired transients, and spam comments
- Takes under a minute. Keeps the database clean and queries fast over time.
- If WP-Optimize is not yet installed on this client's site, install it now and run it.

**Broken links:**
- If Broken Link Checker is installed (it should be — see Stage 4 setup), check for any newly flagged broken links
- Fix or remove any broken internal links. Note external link breaks in the monthly report — the client may want to update their content.

**Error log:**
- Confirm the error log has been reviewed and cleared (covered in Step 5.3 above)

---

## Step 5.5 — Internal Monthly Report

File this to Google Drive after completing steps 5.1–5.4. This is for your records — not sent to the client. It protects you if there is ever a dispute about what maintenance was done and when.

Save as: `[Business Name]/Ongoing/Monthly_Report_[YYYY-MM].md`

```
CLIENT: [Business Name]
MONTH: [Month Year]
MAINTENANCE DATE: [Date]
---
UPTIME: [e.g. 100% — 0 incidents | 99.94% — 1 incident, 32 min, resolved]
SSL: [e.g. Valid — renews [date] | Flagged — under 30 days, actioned]
BACKUPS: [e.g. All 31 daily backups completed | 29/31 — 2 failures on [dates], resolved]
SECURITY: [e.g. No threats detected | 47 blocked login attempts — no action required]
UPDATES APPLIED:
  - WordPress [version]
  - Wimbledon Smart Plugin [version]
  - [Plugin name] [version]
  - [Plugin name] [version]
PLUGIN STATUS: [e.g. All systems normal | Calendar sync broken for [staff] — notified owner]
STRIPE: [e.g. Processing normally | 1 failed payment — client notified]
EMAIL DELIVERY: [e.g. Brevo delivering normally | Delivery rate dropped — investigated, resolved]
ERROR LOG: [e.g. No errors | 3 PHP notices — reviewed, no action required / actioned]
DATABASE: [e.g. WP-Optimize run — clean]
BROKEN LINKS: [e.g. None flagged | 2 flagged — fixed]
SUPPORT TICKETS: [e.g. None | 1 — password reset, resolved same day]
NOTES: [Anything unusual worth recording]
NEXT MONTH: [Any planned actions — pending update, scheduled feature change, etc.]
```

---

## Step 5.6 — Monthly Check-in Email

Send within the first week of the month — after maintenance is complete, not before.

This email should feel personal, not templated. Five to eight sentences. The client should feel like someone is genuinely keeping an eye on their business, not receiving a status report from a system.

**What to include (pick what's relevant that month):**
- Any incidents that occurred and what you did
- Notable updates applied and what they improve
- A pattern you noticed in their booking data worth mentioning
- One proactive tip relevant to their business or time of year
- Reassurance that you are available if they need anything

**Template to adapt — not to copy verbatim:**

> Hi [First Name],
>
> Quick monthly check-in from me. Everything is running smoothly — no issues to report this month.
>
> I applied a WordPress core update and a couple of plugin updates this week — all tested and working correctly. Nothing that changes anything for you or your customers.
>
> [Optional: one relevant observation about their booking data or a seasonal tip]
>
> As always, drop me a message any time if anything comes up.
>
> Liron

**If there was an incident:**

> Hi [First Name],
>
> Monthly check-in from me — and a quick note on something that happened this month.
>
> [Brief explanation: what happened, when, how long, what you did, whether bookings were affected.]
>
> It's been resolved and I've [note any preventive action taken]. No action needed from you.
>
> [Continue with any other updates or observations.]
>
> Liron

---

## Proactive Alerts (Outside the Monthly Cycle)

These happen in real time — do not wait for the monthly window.

| Alert Type | Tool | Your Action | Client Notified? |
|---|---|---|---|
| Site down | UptimeRobot (immediate) | Investigate and fix immediately | Only if downtime > 15 min |
| Backup failed | BlogVault (same day) | Investigate and resolve | Only if data risk |
| Security threat | Wordfence (immediate) | Investigate, clean if needed | Only if action required |
| Email delivery issue | Brevo (monthly check) | Investigate and resolve | Only if bookings affected |
| SSL expiry warning | UptimeRobot (automatic) | Check auto-renewal, renew manually if needed | Only if there is any risk of expiry |
| Plugin conflict | Manual monthly check | Test on staging, resolve | Only if site affected |

**Downtime client notification template:**
> *"Hi [Name], I wanted to let you know your site experienced a brief outage earlier today. It was back online within [X] minutes. I've investigated and [resolved the cause / am monitoring closely]. Your bookings were [not affected / I'll note any that need following up]. No action needed from you."*

---

## Failed Payment Process

When Stripe reports a failed subscription payment:

| Day | Action |
|---|---|
| Day 0 | Stripe auto-retries — no action from you yet |
| Day 3 | Stripe retries again automatically |
| Day 7 (if still failed) | Email client: *"Hi [Name], your monthly payment didn't go through this month — can you update your card details here: [Stripe link]? Happy to help if you run into any issues."* |
| Day 14 (if still failed) | Call or text the client directly. Suspend services if no response: site goes offline, hosting paused. Do not delete any data. |
| On payment | Restore services immediately. Resume normally. |

Keep the tone professional and non-accusatory — missed payments are usually admin errors, not intent to avoid paying.

---

## Stage 5 — Checklist (Per Client, Per Month)

- [ ] UptimeRobot reviewed — uptime noted, SSL status confirmed, any incidents investigated
- [ ] BlogVault reviewed — all backups confirmed complete, most recent under 24h old
- [ ] Wordfence reviewed — no critical alerts, scan results noted
- [ ] Staging environment refreshed from live before update session
- [ ] Plugin changelogs reviewed for any major version bumps
- [ ] WordPress and plugin updates applied to staging and tested (booking flow, payment, email, calendar)
- [ ] Updates applied to live and booking flow confirmed working
- [ ] Plugin and system check complete — Stripe, Calendar sync, Brevo delivery
- [ ] Error log reviewed and cleared
- [ ] WP_DEBUG confirmed off on live site
- [ ] WP-Optimize run — database cleaned
- [ ] Broken Link Checker reviewed — any flagged links addressed
- [ ] Monthly report filed to Google Drive
- [ ] Monthly check-in email sent to client
- [ ] Any failed payments followed up

**Time target:** 25–35 minutes per client. The additional housekeeping steps add around 5 minutes versus the previous process.

---

# STAGE 6 — Quarterly Review

**Trigger:** Every 3 months from launch date — set a recurring calendar reminder on launch day
**Goal:** Confirm satisfaction, surface problems early, create referral and upsell opportunities, gather product feedback
**Duration:** 20–30 minutes on Zoom

| Field | Detail |
|---|---|
| **Trigger** | Every 3 months from launch date |
| **Goal** | Retention protected, satisfaction confirmed, upsells introduced at right moment |
| **Tools** | Zoom, Jamie (note-taking), Bonsai (satisfaction status), Google Drive |
| **Outcome** | Bonsai satisfaction status updated, follow-up email sent, next review scheduled |

---

## Step 6.1 — Pre-Call Email (1 week before)

Send a short, warm email to book the call. Use your Wimbledon Smart Plugin booking link — do not negotiate times by email.

> *"Hi [Name], it's been [3 / 6 / 9 / 12] months since we launched your booking site — time flies. I'd love to spend 20 minutes catching up on how it's going and sharing a few things I've been working on. Does [suggested date/time] work, or here's my calendar link: [booking link]"*

If they don't respond within 3 days, send one nudge. If still nothing, try a brief phone call. If they genuinely can't make time for a call, send a short email asking the same questions — some clients prefer written check-ins.

---

## Step 6.2 — Before the Call

- Start Jamie recording before joining
- Open the client's Bonsai record — review any notes from the last review
- Open their Google Drive folder — glance at last month's maintenance report
- Have their live site open to reference specific things during the call
- Set a mental intention: you are here to listen, not to sell

---

## Step 6.3 — Quarterly Review Call Agenda

Keep this conversational — not a formal review. You are checking in as a partner, not presenting a report.

**How's it going? (10 minutes)**

Open with their experience, not your updates:

> *"Let's start with you — how's the system been working day to day? What's been good, and has anything been frustrating?"*

Questions to weave in naturally:
- Are customers actually using online booking, or are most still calling?
- Any feedback from customers about the booking experience?
- Is the dashboard easy for your staff to use, or has anything confused people?
- Has the number of no-shows changed since you launched?
- Are there any admin tasks you're still doing manually that you expected the system to handle?

**Results (5 minutes)**

Help them articulate the value — this reinforces retention and gives you case study material:

- Are you taking more bookings than before?
- Has the system saved you any meaningful time?
- Any specific win — a busy period that was easier to manage, a customer who commented on how easy it was to book?

If they give you a concrete win, note it in Bonsai. Ask if you can use it as a case study.

**What's coming (5 minutes)**

Share one or two relevant things on your roadmap — not a full product demo, just a teaser that keeps them feeling invested in the platform:

> *"I wanted to mention a couple of things I'm working on that might be relevant for you..."*

Then ask:
> *"Is there anything you wish the system could do that it currently can't?"*

Log everything they say here. This is your most valuable product feedback. The clients who tell you what they need are doing your product roadmap for you.

**Housekeeping (5 minutes)**

Cover practical items naturally at the end:
- Any services, staff, or hours that need updating?
- Happy with the support response time when you've needed it?
- Any questions about the billing or subscription?

**Close**

> *"This has been really helpful — thank you. I'll send a quick follow-up with anything we agreed to action. When's a good time to do this again in three months?"*

Book the next review before ending the call. Don't leave it to a future email.

---

## Step 6.4 — Post-Call Actions

**Same day — internal:**
- Review Jamie summary
- Update Bonsai satisfaction status: **Happy / Neutral / At Risk**
- Log any feature requests in your product feedback log (a simple Google Sheet is fine)
- Note any churn signals — complaints, mentions of cost, low usage
- Set the next quarterly review in Google Calendar
- If the client is At Risk: flag for closer monitoring this month and consider a proactive offer before the next review

**Within 48 hours — client-facing:**
Send a brief follow-up email covering any agreed actions:

> *"Really enjoyed catching up. A few things to follow up on:*
>
> *- [Action 1 — e.g. "I'll update your Tuesday hours to 9am–7pm this week"]*
> *- [Action 2 — e.g. "I'll look into the calendar sync issue you mentioned and come back to you"]*
>
> *[If nothing to action: "Everything's in great shape — I'll leave it with you and we'll catch up again in three months."]*
>
> *Next review: [date]*
>
> *Liron"*

Action any site changes within 48 hours of the call. Do not let agreed changes sit — following through quickly reinforces trust.

---

## Step 6.5 — Quarterly Technical Checks (Internal — Not on the Call)

In the same week as each quarterly review, run these additional technical checks that go deeper than the monthly routine. These are internal — not discussed with the client unless something needs actioning.

**PHP version check:**
- In Hostinger hPanel → Hosting → PHP Configuration, confirm the PHP version for this client's site
- Minimum acceptable: PHP 8.2+
- If below 8.2: test a PHP upgrade on staging first, confirm the booking flow and all plugins work, then upgrade live
- Note the PHP version in the quarterly report

**Backup restoration test:**
- In BlogVault, select the most recent backup for this client
- Restore it to the staging environment
- Verify the staging site loads correctly and the full booking flow works
- This confirms the backups are not just completing — they are actually restorable
- Log the result: "Restoration test passed — [date]" or note any issue found
- You do not need to do this every month. Once per quarter per client is sufficient.

**Plugin audit:**
- Review the full list of installed plugins on the live site
- Flag any plugin that has not received an update in the last 12 months — Wordfence also flags these automatically
- For any flagged plugin: check the WordPress.org plugin page to confirm whether it is actively maintained or abandoned
- If abandoned: find a maintained alternative or remove it if no longer needed
- Abandoned plugins with known vulnerabilities are a security risk and should be replaced promptly

**Note:** These quarterly checks add approximately 20–30 minutes to the review month. The time budget table below accounts for this.

---

## Step 6.6 — Referral Ask

If the call went well and the client is clearly happy — introduce this naturally at the end, not as a scripted close:

> *"One last thing — if you know any other business owners who have the same booking headaches you had before, I'd love an introduction. Happy to offer you a free month if anyone you refer signs up."*

Not every quarterly review warrants this. Use your judgement:
- **Happy, engaged, talking positively about results** → ask
- **Neutral or didn't use many features** → not yet
- **At Risk or had complaints** → definitely not

---

## Step 6.7 — Upsell Opportunities

Introduce upsells at the right review — not before the client is settled and seeing value. Rushing an upsell before month 6 usually backfires.

**6-month review — SMS reminders:**

> *"I've started offering SMS appointment reminders for existing clients. Most businesses see a 30–40% drop in no-shows — it sends automatically 24 hours before each appointment. It's £25/month for up to 300 messages. Given how many bookings you're running, I thought it was worth mentioning. Want me to set it up this week?"*

**9-month review — email marketing:**

> *"Something I've been rolling out for clients is a simple monthly email to their customer list — things like seasonal promotions, rebooking reminders, or a newsletter. It runs through the same system as your booking emails, so the setup is minimal. Worth a conversation if that's something you'd find useful?"*

**12-month review — website refresh:**

> *"It's been a year — the site's been working hard. A lot of clients at the 12-month mark find it's worth a small refresh: updating the photography, tightening the copy, maybe adding a page or two. It's not a rebuild — just bringing it up to date. I can put together a quick proposal if you're interested."*

---

## Stage 6 — Checklist (Per Client, Per Quarter)

**Before the call:**
- [ ] Pre-call email sent 1 week before
- [ ] Jamie recording started
- [ ] Last maintenance report reviewed
- [ ] Bonsai notes reviewed

**On the call:**
- [ ] "How's it going?" conversation — listen first
- [ ] Results conversation — any wins noted for case study potential
- [ ] Roadmap tease — relevant features shared
- [ ] Feature requests logged
- [ ] Housekeeping items noted
- [ ] Next review booked before ending the call

**After the call:**
- [ ] Bonsai satisfaction status updated (Happy / Neutral / At Risk)
- [ ] Feature requests added to product feedback log
- [ ] Follow-up email sent within 48 hours
- [ ] Any agreed site changes actioned within 48 hours
- [ ] Referral ask actioned if appropriate
- [ ] Upsell follow-up sent if appropriate (see timing guide above)

**Technical checks (same week — internal):**
- [ ] PHP version confirmed — 8.2+ (note version in quarterly report)
- [ ] Backup restoration test completed and logged
- [ ] Plugin audit completed — any abandoned plugins flagged and actioned

---

## Stages 5 & 6 — Inputs and Outputs

| Item | Stage 5 | Stage 6 |
|---|---|---|
| **Inputs from client** | Nothing required | Call attendance and honest feedback |
| **Outputs to client** | Monthly check-in email | Follow-up email, changes actioned, upsell email if relevant |
| **Internal records** | Monthly report (Drive), Bonsai updated for any issues | Satisfaction status (Bonsai), feature requests logged, quarterly technical checks logged, next review scheduled |
| **Complete when** | Report filed, check-in email sent | Follow-up email sent, Bonsai updated, technical checks done |

---

## Time Budget — Stages 5 and 6 Combined

| Clients | Stage 5 Monthly | Stage 6 Quarterly (call + technical checks) | Total Monthly Average |
|---|---|---|---|
| 3 clients | 3 × 30 min = 90 min | 1 × 50 min = 50 min | ~115 min/month |
| 5 clients | 5 × 30 min = 150 min | 1–2 × 50 min = 65 min | ~190 min/month |
| 10 clients | 10 × 30 min = 300 min | 2–3 × 50 min = 115 min | ~380 min/month |

At 10 clients you are spending roughly 6.5 hours per month on Stages 5 and 6 combined — still comfortably within the 5–10 hours per week available. Reactive support time adds to this, but a well-maintained estate with good documentation significantly reduces inbound queries.

---

*Document Version: 1.1 | Updated: March 2026*
*Changes from v1.0: Added SSL monitoring to Step 5.1; added staging refresh and changelog review to Step 5.2; added WP_DEBUG check and error log clearing to Step 5.3; added new Step 5.4 (Housekeeping — WP-Optimize, broken links); expanded monthly report template; renumbered Steps 5.4/5.5 to 5.5/5.6; added SSL and broken links to Stage 5 checklist; added Step 6.5 (Quarterly Technical Checks — PHP version, backup restoration test, plugin audit); updated Stage 6 checklist and time budget.*
*Related documents: Stage4_Launch.md | Client_Delivery_Workflow.md | Tools_Stack.md | WordPress_Maintenance_Reference.md*