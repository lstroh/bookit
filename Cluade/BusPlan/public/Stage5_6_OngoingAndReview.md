# Stage 5 & 6 — Ongoing Monthly and Quarterly Review
## Wimbledon Smart Business — Complete Step-by-Step Operational Guide

**Document Version:** 1.0
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

1. Log into the live WordPress admin
2. Check for pending updates: Dashboard → Updates
3. Note what needs updating: WordPress core, plugins, themes
4. Go to the staging environment for this client (Local by Flywheel or WP Staging)
5. Apply all pending updates to staging
6. Test the full booking flow end-to-end on staging:
   - Make a test booking
   - Confirm deposit/payment processes correctly (test mode)
   - Confirm confirmation email sends
   - Confirm booking appears in dashboard
   - Confirm calendar sync triggers
7. Check all pages load correctly after the update
8. If staging passes: apply the same updates to live
9. Repeat the booking flow test on live (brief — just confirm it's working)
10. Log everything applied in the monthly report

**If an update breaks staging:** Do not apply to live. Investigate — is it a plugin conflict? A theme incompatibility? Resolve on staging first, then apply to live. If you cannot resolve it quickly, note it in the report and schedule a fix.

**WordPress core updates:** Apply minor version updates (e.g. 6.5.1 → 6.5.2) as routine. Treat major version updates (e.g. 6.5 → 6.6) with more caution — test on staging for longer before applying to live.

**Wimbledon Smart Plugin updates:** When you release a new version of your own plugin, test it on staging for every client before pushing to live. Your plugin updates affect the core booking functionality — one broken update affects every client.

---

## Step 5.3 — Plugin and System Check (5 minutes)

Log into the WordPress admin on the live site and check:

- **Plugin error logs:** Any errors logged since last month? Failed bookings, failed notifications, failed calendar syncs?
- **Stripe connection:** Is the payment gateway still connected and processing? Check Stripe Dashboard → Payments for any recent failures
- **Google Calendar sync:** Is it still active for all staff? Calendar sync tokens expire — if a staff member changed their Google password, the sync will have broken silently
- **Brevo email delivery:** Log into Brevo → Statistics. Any unusual drop in delivery rate? Any spike in bounces or spam reports?

**If Google Calendar sync has broken for a staff member:**
> *"Hi [Staff Name / Business Owner], I noticed the calendar sync for [staff name] has disconnected — this sometimes happens when a Google password is changed. They just need to reconnect it: [dashboard URL] → Settings → Calendar Sync → Reconnect Google Calendar. Takes about 30 seconds."*

---

## Step 5.4 — Internal Monthly Report

File this to Google Drive after completing steps 5.1–5.3. This is for your records — not sent to the client. It protects you if there is ever a dispute about what maintenance was done and when.

Save as: `[Business Name]/Ongoing/Monthly_Report_[YYYY-MM].md`

```
CLIENT: [Business Name]
MONTH: [Month Year]
MAINTENANCE DATE: [Date]
---
UPTIME: [e.g. 100% — 0 incidents | 99.94% — 1 incident, 32 min, resolved]
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
SUPPORT TICKETS: [e.g. None | 1 — password reset, resolved same day]
NOTES: [Anything unusual worth recording]
NEXT MONTH: [Any planned actions — pending update, scheduled feature change, etc.]
```

---

## Step 5.5 — Monthly Check-in Email

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
> I applied a WordPress security update and a small update to the booking plugin this week. Both tested and confirmed on staging before going live. Nothing changes for you or your customers.
>
> [Optional: something specific — "I noticed you had your busiest Saturday since launch last week — 18 bookings in one day. Great sign."]
>
> [Optional: proactive tip — "With [season] coming up, it might be worth updating your available hours in the dashboard if your opening times are changing."]
>
> As always, if anything comes up just reply to this email.
>
> Liron

**What makes a good check-in email:**
- It is short — they should be able to read it in 30 seconds
- It mentions something specific to their business or month — not generic
- It does not ask them to do anything unless necessary
- It ends with an open door — not a call to action

**What makes a bad one:**
- A wall of text listing every update applied
- Generic filler ("I hope you're well")
- Raising an issue you haven't already resolved
- Asking for a call when an email will do

---

## Proactive Alerts — When to Contact Between Check-ins

Do not wait for the monthly window if something requires immediate action.

| Alert | Tool | Your Action | Notify Client? |
|---|---|---|---|
| Site down | UptimeRobot (immediate) | Investigate and fix immediately | Yes — if downtime exceeds 15 minutes |
| Backup failed 2+ days in a row | BlogVault (daily) | Investigate and resolve | Only if data is at risk |
| Security threat detected | Wordfence (immediate) | Investigate, clean if needed | Only if action needed from client |
| Email delivery failing | Brevo (monitor) | Investigate and resolve | Only if bookings are being affected |
| Payment failed | Stripe (immediate) | Follow failed payment process | Yes — see below |

**Downtime notification template:**
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

- [ ] UptimeRobot reviewed — uptime noted, any incidents investigated
- [ ] BlogVault reviewed — all backups confirmed complete
- [ ] Wordfence reviewed — no critical alerts, scan results noted
- [ ] WordPress and plugin updates applied to staging and tested
- [ ] Updates applied to live and booking flow confirmed working
- [ ] Plugin and system check complete — Stripe, Calendar sync, Brevo delivery
- [ ] Monthly report filed to Google Drive
- [ ] Monthly check-in email sent to client
- [ ] Any failed payments followed up

**Time target:** 20–30 minutes per client. If a month is taking longer, identify what is causing it — likely an unresolved issue that needs proper attention, not a faster process.

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

## Step 6.5 — Referral Ask

If the call went well and the client is clearly happy — introduce this naturally at the end, not as a scripted close:

> *"One last thing — if you know any other business owners who have the same booking headaches you had before, I'd love an introduction. Happy to offer you a free month if anyone you refer signs up."*

Not every quarterly review warrants this. Use your judgement:
- **Happy, engaged, talking positively about results** → ask
- **Neutral or didn't use many features** → not yet
- **At Risk or had complaints** → definitely not

---

## Step 6.6 — Upsell Opportunities

Introduce upsells at the right review — not before the client is settled and seeing value. Rushing an upsell before month 6 usually backfires.

**6-month review — SMS reminders:**

> *"I've started offering SMS appointment reminders for existing clients. Most businesses see a 30–40% drop in no-shows — it sends automatically 24 hours before each appointment. It's £25/month for up to 300 messages. Given how many bookings you're running, I thought it was worth mentioning. Want me to set it up this week?"*

Introduce only if: they have mentioned no-shows as an issue, OR they are running 20+ bookings per month.

**9-month review — email marketing campaigns:**

> *"Quick question — when did you last email your full customer list? I now offer a monthly campaign management service: two or three branded emails per month, fully managed, promoting your services, seasonal offers, whatever makes sense. It's £50/month. Want me to put together an example for your business so you can see what it would look like?"*

Introduce only if: they have an active customer list and haven't been marketing to it, OR they mentioned wanting to do more marketing.

**12-month review — website refresh:**

> *"Your site has been live for a year — which is a great milestone. Worth asking: are there services you've added, team changes, new photos, or anything that's changed that you'd like reflected? I can also do a light design refresh if you want to keep things feeling current. Happy to look at what makes sense once I know what you have in mind."*

Introduce at every 12-month anniversary as standard — this is almost always relevant.

---

## Step 6.7 — Handling Cancellations

When a client requests to cancel, always respond before processing:

> *"Thanks for letting me know. Before I process anything, can I ask what the main reason is? I'd genuinely like to understand — and in some cases there may be something I can do that I haven't thought to offer."*

**Common reasons and how to respond:**

**"Too expensive"**
> *"I understand. Can I ask — are you using the booking system actively? If it's fully embedded in how you run the business, the £99 is working hard for you. If you're not using it much, that's worth understanding too — it might be a training gap I can help with."*

Consider a temporary reduced rate for a client you want to keep — but do not make this a blanket offer and do not offer it immediately. Make them work slightly for it by understanding the real reason first.

**"Not using it / customers aren't booking online"**
> *"That's worth understanding. Have you promoted the booking link directly to your customers — in your email signature, on Instagram, on a note at the till? Most businesses find it takes 4–6 weeks of actively pointing customers to the link before they start using it habitually. I can help you with a quick push if you'd like to try that before we make a decision."*

**"Switching to Fresha / another platform"**
> *"Happy to talk through what's pulling you that way — is it a specific feature, or the cost? If it's a feature the system doesn't currently have, it's worth knowing whether it's on the roadmap before you go through the effort of switching."*

**If they have decided and the reason is legitimate:**
Accept the cancellation gracefully. Process it professionally. A client who leaves well may come back, and they will definitely talk to other business owners.

**Cancellation process:**
1. Confirm cancellation in writing by email
2. Note 30-day notice period — final billing date
3. Within 7 days: provide full data export (WordPress XML, database SQL, customer CSV, booking history CSV, payment CSV)
4. After 30 days: take site offline, deactivate plugin, cancel Stripe subscription
5. After 90 days: delete all client data from hosting and Google Drive
6. Update Bonsai status to **Churned — [Reason]**
7. Add to **Win-Back** list with a 6-month reminder

**Win-back message (6 months after churn):**
> *"Hi [Name], it's been a few months since we last worked together. I hope things are going well. I've added a few new features since you left — [mention 1–2 genuinely relevant items]. If your situation has changed and you'd like to revisit, I'd love to chat."*

Send this once only. If no response, remove from win-back list.

---

## Stage 6 — Checklist (Per Client, Per Quarter)

**One week before:**
- [ ] Pre-call email sent — call booked via booking link

**Before the call:**
- [ ] Jamie recording started
- [ ] Bonsai record reviewed — previous notes checked
- [ ] Last monthly report reviewed
- [ ] Live site open for reference

**On the call:**
- [ ] "How's it going?" section covered — experience, friction, no-shows
- [ ] Results section covered — wins noted for case study if relevant
- [ ] Roadmap items shared — feature requests logged
- [ ] Housekeeping covered — updates needed, support feedback, billing questions
- [ ] Next review booked before call ends

**After the call:**
- [ ] Jamie summary reviewed
- [ ] Bonsai satisfaction status updated: Happy / Neutral / At Risk
- [ ] Feature requests logged in product feedback log
- [ ] Next quarterly review set in Google Calendar
- [ ] Follow-up email sent within 48 hours
- [ ] Any agreed changes actioned within 48 hours
- [ ] Referral ask made (if appropriate)
- [ ] Upsell introduced (if appropriate — see timing guidance above)

**Success measure:** Client satisfaction status confirmed in Bonsai. Any churn risk identified and flagged. Next review scheduled before ending the call.

---

## Stages 5 & 6 — Inputs and Outputs

| Item | Stage 5 | Stage 6 |
|---|---|---|
| **Inputs from client** | Nothing required | Call attendance and honest feedback |
| **Outputs to client** | Monthly check-in email | Follow-up email, changes actioned, upsell email if relevant |
| **Internal records** | Monthly report (Drive), Bonsai updated for any issues | Satisfaction status (Bonsai), feature requests logged, next review scheduled |
| **Complete when** | Report filed, check-in email sent | Follow-up email sent, Bonsai updated |

---

## Time Budget — Stages 5 and 6 Combined

| Clients | Stage 5 Monthly | Stage 6 Quarterly | Total Monthly Average |
|---|---|---|---|
| 3 clients | 3 × 25 min = 75 min | 1 × 30 min = 30 min | ~105 min/month |
| 5 clients | 5 × 25 min = 125 min | 1–2 × 30 min = 45 min | ~170 min/month |
| 10 clients | 10 × 25 min = 250 min | 2–3 × 30 min = 75 min | ~325 min/month |

At 10 clients you are spending roughly 5.5 hours per month on Stages 5 and 6 combined — well within the 5–10 hours per week available. Reactive support time adds to this, but a well-maintained estate with good documentation significantly reduces inbound queries.

---

*Document Version: 1.0 | Created: March 2026*
*Related documents: Stage4_Launch.md | Client_Delivery_Workflow.md | Tools_Stack.md*
