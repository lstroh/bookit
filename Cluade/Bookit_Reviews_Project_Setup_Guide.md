# Bookit Reviews — New Claude Project Setup Guide

**Prepared:** 21 March 2026  
**To be used when:** You are ready to start building the Bookit Reviews extension (Phase 2 / post-launch)

---

## 1. Create the Claude Project

1. Open Claude.ai and click **New Project**
2. Name it: `Bookit Reviews`
3. Add a project description (optional but useful):
   > Extension plugin for Bookit Booking System. Sends post-appointment review request emails to customers via Google and/or Facebook. Built as a separate WordPress plugin using the Bookit Extension Plugin API.

---

## 2. Files to Upload to the Project

Upload these files from the core project knowledge in this order. They give the new project everything it needs to understand the architecture and conventions.

### Required (upload all of these)

| File | Why |
|------|-----|
| `Extension_Plugin_API_Spec.md` | The complete API contract: registration, hooks, filters, nav items, migrations, versioning. The single most important file. |
| `Future_Features_Backlog.md` | Contains the Bookit Reviews architecture decision section with full scope, DB schema intent, and Phase 1/2 split. |
| `System_Architecture_Document_PART1_Sections_1-8.md` | Core plugin architecture, DB table conventions, naming patterns. |
| `System_Architecture_Document_PART2_Sections_9-19.md` | REST API conventions, authentication, error handling patterns. |
| `TechnicalRequirements.md` | PHP/WP version requirements, coding standards. |
| `wp-env-quick-reference.md` | PHPUnit and wp-env setup — needed for running tests. |

### Recommended (adds useful context)

| File | Why |
|------|-----|
| `Development_Implementation_Workflow.md` | Sprint workflow, Cursor prompt conventions, commit standards. |
| `progress.md` | Shows current core plugin state and which hooks exist. |

---

## 3. Project Instructions

Paste the following as the **Project Instructions** (the system prompt for the project):

---

```
You are the development assistant for the Bookit Reviews extension plugin — a WordPress plugin that integrates with the Bookit Booking System core plugin to send post-appointment review request emails to customers.

## What this project is

Bookit Reviews is a Bookit extension plugin. It:
- Registers with core via bookit_register_extension()
- Hooks into bookit_after_booking_completed to schedule review request emails
- Uses WP-Cron for delayed sending (configurable: 0 / 2h / 4h / 24h / 48h)
- Sends a friendly email with a direct link to the business's Google and/or Facebook review page
- Has its own dashboard settings page (Vue 3) and a simple stats view
- Owns its own database table: wp_bookit_review_requests
- Can be deactivated without affecting core booking functionality

## Architecture rules

- Never modify core plugin files
- Never register routes under the bookit/v1 namespace — use bookit-reviews/v1
- All DB schema changes go in this extension's own migrations
- Follow the Extension Plugin API Spec exactly for registration, nav items, and hook usage
- No new core hooks are needed — bookit_after_booking_completed already exists

## Development workflow

- Claude generates structured Cursor AI prompts for each sub-task
- Cursor implements the code
- Liron runs PHPUnit and reports the test count
- Claude reviews, Liron commits
- One sub-task at a time — no overlap

## Stack

- PHP 8.0+, WordPress 6.0+
- Vue 3 (dashboard settings page)
- WP-Cron for scheduled email delivery
- PHPUnit + WP_UnitTestCase for tests
- Local by Flywheel (dev), wp-env/Docker (PHPUnit)
- GitHub repo: lstroh/bookit-imp (or a new repo — confirm with Liron)

## Conventions

- Plugin slug: bookit-reviews
- Plugin folder: bookit-reviews/
- Text domain: bookit-reviews
- REST namespace: bookit-reviews/v1
- Table name: wp_bookit_review_requests
- Class prefix: Bookit_Reviews_
- Constants: BOOKIT_REVIEWS_VERSION, BOOKIT_REVIEWS_PLUGIN_DIR, BOOKIT_REVIEWS_PLUGIN_URL

## Before generating any Cursor prompt

Always search project knowledge using specific class names or method names — not feature descriptions — to locate the correct reference implementations before writing code. Two targeted searches per task is the standard.

## Tone and format

Be concise. Liron is an experienced developer. Use "All good" / "All done" confirmations. Ask one question at a time if clarification is needed. Always propose a task breakdown and wait for approval before generating the first Cursor prompt.
```

---

## 4. First Prompt (paste this to start the project)

Once the project is created, files uploaded, and instructions saved, start the conversation with:

---

```
I'm ready to start planning the Bookit Reviews extension plugin.

Here's the context:
- This is a Bookit extension plugin that sends post-appointment review request emails
- It hooks into bookit_after_booking_completed (already exists in core)
- Uses WP-Cron for configurable delay before sending
- Targets Google and/or Facebook review URLs configured in settings
- Needs a dashboard settings page (Vue 3) and a wp_bookit_review_requests DB table
- Phase 1 only for now — no SMS, no click tracking

Please search the project knowledge to confirm the core hook name and the extension registration pattern, then propose a sprint task breakdown for Phase 1 with effort estimates. Don't generate any Cursor prompts yet — just the breakdown for my review.
```

---

## 5. Suggested Phase 1 Sprint Structure (for reference)

This is a starting point — Claude will refine it based on knowledge search results.

| Task | Description | Est. |
|------|-------------|------|
| 1 | Plugin scaffold + extension registration + migration for wp_bookit_review_requests | 3h |
| 2 | Hook into bookit_after_booking_completed, schedule WP-Cron job with delay | 3h |
| 3 | Email template + send logic (platform URL substitution, deduplication check) | 4h |
| 4 | Vue dashboard settings page (platform URLs, delay, toggle) | 4h |
| 5 | Vue dashboard stats page (requests sent, pending, failed) | 2h |
| 6 | PHPUnit tests for cron scheduling, send logic, deduplication | 4h |

**Estimated total:** ~20h

---

## Notes

- The extension does **not** need a live environment for Phase 1 — all logic is local (WP-Cron + email)
- Confirm whether the plugin lives in the existing `lstroh/bookit-imp` repo (as a sibling to the core plugin) or in its own repo, before the first Cursor prompt
- The `bookit_after_booking_completed` hook name should be verified against the actual core codebase before building — search for it in the Extension Plugin API Spec and progress.md
