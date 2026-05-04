# Website Research Workflow
## Wimbledon Smart Business — Internal Agent Workflow Definition

**Document Version:** 1.0  
**Date:** April 2026  
**Status:** Active Reference  
**Purpose:** Defines the end-to-end process for an autonomous AI agent to research and produce layered website design reference files, one business type at a time, one layer at a time.

---

## Overview

This workflow produces structured research files used during client discovery calls and website builds. Each file covers one business type (e.g. "hair salons UK") and is built in four layers, each reviewed and approved by Liron before the next begins.

The research answers three questions for every decision made in a website build:
1. **What** — what page, component, placement, or detail is recommended
2. **Why (UX/psychology)** — why it works based on user behaviour, cognitive psychology, and conversion principles
3. **Why (evidence)** — what data, studies, or credible best practices support it

---

## The Four Layers

| Layer | Scope | Output |
|---|---|---|
| **Layer 1** | Pages and their goals | A list of recommended pages, each with a defined goal, user intent, and evidence for inclusion |
| **Layer 2** | Components per page | For each approved page: a list of components needed to achieve the page goal, with UX and conversion rationale |
| **Layer 3** | Component placement | For each approved component: where it sits on the page, in what order, and why — including mobile vs desktop differences |
| **Layer 4** | Fine detail | Button placement, CTA wording, form field order, headline hierarchy, image treatment, whitespace — with supporting evidence |

Each layer is a separate execution. The agent does not begin the next layer until Liron has reviewed the output and explicitly approved it.

---

## Reuse Rules

Before starting any layer for any business type, the agent must check whether a research file already exists for that business type at that layer.

**Check location:** Dedicated research project (Google Drive or equivalent connected storage).

**File naming convention:**
```
/website-research/[business-type-slug]/layer-[n]-[business-type-slug].md
```

Examples:
```
/website-research/hair-salons-uk/layer-1-hair-salons-uk.md
/website-research/hair-salons-uk/layer-2-hair-salons-uk.md
/website-research/massage-spa-uk/layer-1-massage-spa-uk.md
```

**Reuse logic:**
- If the file exists and is marked `STATUS: APPROVED` → load it and proceed to the next layer
- If the file exists and is marked `STATUS: PENDING REVIEW` → notify Liron that review is required before proceeding
- If the file exists and is marked `STATUS: DRAFT` → a previous run was incomplete; ask Liron whether to continue or restart
- If no file exists → run the full layer research for this business type

**When to update vs reuse:**
- Research files older than 18 months should be flagged for refresh
- If Liron identifies that a sector has changed significantly (new platforms, design trends, user behaviour shifts), a refresh can be triggered manually

---

## Agent Trigger — How a Run Starts

Liron initiates a run by providing a brief. This can be done in chat or via a structured input. The agent must gather enough context before starting research.

### Minimum required input from Liron:
- Business type (e.g. "hair salon", "sports massage therapist", "life coach")
- Location context (default: UK, with London/SW London weighting where relevant)
- Any specific notes about the client that might affect the research (e.g. "luxury positioning", "solo operator", "primarily male clientele")
- Which layer to run (1, 2, 3, or 4)
- For Layer 2+: confirmation that the previous layer has been reviewed and approved

### If input is insufficient:
The agent must ask clarifying questions before starting. It must not begin research with ambiguous inputs. Questions to ask if needed:
- Is this a solo operator or a team business?
- Is the positioning budget, mid-range, or premium/luxury?
- Is the primary audience local walk-in clients, or does the business attract clients from a wider area?
- Are there any specific features or constraints already known (e.g. must include online booking, operates from a home studio)?

### Once input is complete:
Confirm back to Liron in one short paragraph:
- What business type is being researched
- Which layer is being run
- Whether existing research was found (and if so, what layer it covers)
- Estimated scope of the research run

Then begin.

---

## Layer 1 — Research Process

**Goal:** Produce a recommended page list for this business type, with each page justified by goal, user intent, UX evidence, and conversion rationale.

### Step 1 — Reuse Check
Check for existing Layer 1 file. If found and approved, skip to notification. If not found, proceed.

### Step 2 — Sector Research
Using web search and any available deep research tools (Perplexity, Claude deep research, or equivalent):

**2a — Analyse real UK business websites in this sector**
- Find 8–12 actively trading UK businesses in this sector with well-regarded websites
- Prioritise: London and major UK cities, businesses with strong Google reviews (4.5+), businesses that appear in "best [sector] in [city]" editorial lists
- For each site, record: pages present, primary CTA, booking method, any pages beyond the standard set
- Note patterns — pages that appear on 7+ out of 10 sites are likely standard; pages on 3 or fewer are sector-specific or optional

**2b — Research user intent for this sector**
- What does a user searching for this service actually want to know before booking?
- What search queries bring users to these sites? (informational, navigational, transactional)
- What questions does this type of customer typically have before committing to a booking?
- Are there trust barriers specific to this sector? (e.g. health and safety for massage, credentials for therapy, portfolio quality for photography)

**2c — Research conversion principles relevant to this sector**
- What is the typical decision-making journey for this type of service? (impulse vs considered purchase)
- What trust signals matter most to this audience?
- Are there documented conversion studies relevant to service booking websites?
- What does the data say about where users drop off in booking flows for this type of service?

**2d — Research psychological principles applicable to page structure**
- Which cognitive biases are most relevant to this purchase decision? (social proof, authority, scarcity, reciprocity, loss aversion, etc.)
- How do users scan and read pages in this context? (F-pattern, Z-pattern, fold behaviour)
- What emotional state is the user typically in when they arrive? (stressed, treating themselves, in pain, planning ahead)
- How does this emotional state affect what they need to see first?

### Step 3 — Synthesise and Write Layer 1 Output
Write the Layer 1 research file using the Layer 1 Output Template (see below).

### Step 4 — Confidence Flagging
For every claim, data point, or recommendation, apply one of three confidence markers:
- `[CITED]` — backed by a named study, report, or source with reference included
- `[BEST PRACTICE]` — widely accepted in UX/CRO/design community, not tied to a single study
- `[INFORMED]` — reasoned recommendation based on sector patterns observed, no direct citation

### Step 5 — Save and Notify
- Save the file to the correct location in the research project
- Set file STATUS to `PENDING REVIEW`
- Update `STATUS.md` in the research project root
- Notify Liron in chat (see Notification Format below)

---

## Layer 2 — Research Process

**Prerequisite:** Layer 1 file for this business type must be STATUS: APPROVED. Liron must have confirmed which pages from Layer 1 are included in the build.

**Goal:** For each approved page, define the components needed to achieve the page goal — with UX, psychological, and conversion rationale for each component.

### Step 1 — Load Approved Page List
Read the approved Layer 1 file. Extract only the pages marked as included. Do not research components for excluded pages.

### Step 2 — Component Research (per page)
For each approved page:

**2a — Research what components successful UK sector websites use on this page**
- What sections appear consistently on this page type across the 8–12 sites identified in Layer 1?
- Are there components that high-performing sites use that lower-performing sites omit?
- Are there components that appear outdated or that users are known to ignore?

**2b — Research UX rationale for each component**
- What user need does this component address?
- What happens (to conversion or trust) if this component is absent?
- Is there data on user engagement with this component type? (scroll depth, click rate, time on section)

**2c — Research psychological rationale for each component**
- Which cognitive principle does this component activate?
- Is this component primarily a trust signal, a decision aid, a friction reducer, or an action driver?
- Does this component address a specific fear or objection common to this type of buyer?

**2d — Mobile vs desktop considerations**
- Does this component behave differently on mobile?
- Should it be prioritised, deprioritised, or restructured for mobile users?
- For this sector's audience, what proportion of users are likely on mobile? (cite if data available)

### Step 3 — Synthesise and Write Layer 2 Output
Write the Layer 2 research file using the Layer 2 Output Template (see below).

### Step 4 — Confidence Flagging
Apply `[CITED]`, `[BEST PRACTICE]`, or `[INFORMED]` to every recommendation.

### Step 5 — Save and Notify
Same as Layer 1 Step 5.

---

## Layer 3 — Research Process

**Prerequisite:** Layer 2 file approved. Liron has confirmed which components are included per page.

**Goal:** For each approved component, define where it sits on the page, in what order relative to other components, and why — with mobile and desktop treated separately where they differ.

### Step 1 — Load Approved Component List
Read approved Layer 2 file. Extract only included components per page.

### Step 2 — Placement Research (per component)
For each approved component on each page:

**2a — Above or below the fold**
- Should this component be visible without scrolling?
- What does the data say about fold behaviour for this type of page and this type of user?
- If below the fold, what needs to be above it to earn the scroll?

**2b — Sequence and flow**
- What is the logical and psychological order of components on this page?
- What does the user need to know/feel before they see this component?
- What should come immediately after this component to maintain momentum?

**2c — Visual weight and hierarchy**
- Should this component dominate, support, or recede visually?
- How does its visual prominence relate to its role in the conversion journey?

**2d — Mobile-specific placement**
- Does the order or prominence of this component change on mobile?
- Are there components that should be hidden, collapsed, or restructured on mobile?
- What does thumb-reach and scroll behaviour on mobile mean for CTA placement?

### Step 3 — Synthesise and Write Layer 3 Output
Write the Layer 3 research file using the Layer 3 Output Template (see below).

### Step 4 — Confidence Flagging
Apply confidence markers as per Layers 1 and 2.

### Step 5 — Save and Notify

---

## Layer 4 — Research Process

**Prerequisite:** Layer 3 file approved. Liron has confirmed placement decisions.

**Goal:** Define the fine detail within each component — button wording, CTA placement, form field order, headline hierarchy, image treatment, whitespace, typography decisions — with evidence for each.

### Step 1 — Load Approved Placement Map
Read approved Layer 3 file.

### Step 2 — Fine Detail Research (per component)
For each component:

**2a — Copy and wording**
- What CTA wording converts best for this action type in this sector?
- What headline patterns work best for this type of content? (question, statement, benefit-led, curiosity)
- What microcopy reduces friction at key decision points?

**2b — Form and interaction design**
- If the component contains a form or interactive element: what field order reduces abandonment?
- How many fields is too many? What does the data say?
- What input types, labels, and error messages reduce friction?

**2c — Visual detail**
- Image treatment — real photos vs illustration vs stock; authentic vs aspirational
- Whitespace — what does breathing room communicate in this context?
- Typography — size, weight, and contrast decisions that support readability and hierarchy

**2d — Button and CTA specifics**
- Colour, size, and placement of primary CTA
- Single vs multiple CTAs — what does the data say for this page type?
- What happens to conversion when secondary CTAs compete with the primary?

### Step 3 — Synthesise and Write Layer 4 Output
Write the Layer 4 research file using the Layer 4 Output Template (see below).

### Step 4 — Confidence Flagging
### Step 5 — Save and Notify

---

## Output Templates

### Layer 1 Output Template

```markdown
# Website Research — Layer 1: Pages and Goals
## Business Type: [Business Type]
## Location Context: [UK / London / SW London weighted]
## Research Date: [Date]
## Researched By: [Agent name or "AI Agent"]
## STATUS: DRAFT | PENDING REVIEW | APPROVED

---

## Research Basis

### Websites Analysed
| Business Name | URL | Location | Notable Features |
|---|---|---|---|
| | | | |

### Sources Referenced
- [Source name — URL — relevance]

---

## User Profile for This Sector

**Who is visiting this website:**
[2–3 sentences describing the typical user — demographics, intent, emotional state on arrival]

**Primary user questions before booking:**
- [Question 1]
- [Question 2]
- [Question 3]

**Trust barriers specific to this sector:**
- [Barrier 1 — why it exists — how a website addresses it]

**Decision type:**
[Impulse / Considered / Researched — with rationale]

---

## Recommended Pages

### Page 1 — [Page Name]

**Goal:** [One sentence — what this page must achieve]

**User intent on this page:** [What the user is trying to do or decide]

**Why this page is needed:**
[2–3 sentences — business case and UX rationale]

**Evidence:**
- [CITED / BEST PRACTICE / INFORMED] [Specific data point or principle — source if cited]

**Appears on:** [X out of Y sites analysed]

**Mobile priority:** [High / Medium / Low — with brief rationale]

---

[Repeat for each recommended page]

---

## Optional Pages — Sector Specific

[Pages that appear on fewer than half of analysed sites but serve a legitimate purpose for certain businesses in this sector]

### Optional Page — [Page Name]

**When to include:** [Specific condition — e.g. "only if business has 5+ staff members"]
**Goal:** [One sentence]
**Evidence:** [CITED / BEST PRACTICE / INFORMED] [Source]

---

## Pages to Avoid or Defer

[Pages that are commonly requested by clients but have poor conversion outcomes or introduce unnecessary complexity]

| Page | Reason to avoid or defer |
|---|---|
| | |

---

## Review Notes for Liron

**Decisions required before Layer 2 can begin:**
- [ ] Confirm which pages from the recommended list are included
- [ ] Confirm which optional pages (if any) are included
- [ ] Note any pages not on this list that the client has specifically requested

**Open questions:**
- [Any ambiguity from the client brief that affects page decisions]
```

---

### Layer 2 Output Template

```markdown
# Website Research — Layer 2: Components Per Page
## Business Type: [Business Type]
## Approved Pages: [List from Layer 1]
## Research Date: [Date]
## STATUS: DRAFT | PENDING REVIEW | APPROVED

---

## Page: [Page Name]

**Page goal (from Layer 1):** [Restate the goal]

### Component: [Component Name]

**What it is:** [One sentence description]

**Goal of this component:** [What specific user action or feeling does it drive?]

**UX rationale:**
[Why this component is needed from a user experience perspective — what happens without it]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Psychological principle:**
[Which cognitive principle this activates — e.g. social proof, authority, reciprocity]
[How it applies specifically to this sector's buyer]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Conversion rationale:**
[How this component directly contributes to the page goal and the overall booking conversion]
[CITED / BEST PRACTICE / INFORMED] [Source or data point]

**Mobile behaviour:**
[How this component should behave on mobile — same / restructured / deprioritised]
[Mobile audience note for this sector if data available]

**Risk of omitting:**
[What is lost — in trust, conversion, or user experience — if this component is excluded]

---

[Repeat for each component on this page]
[Repeat for each approved page]

---

## Review Notes for Liron

**Decisions required before Layer 3 can begin:**
- [ ] Confirm which components are included per page
- [ ] Note any components not on this list requested by the client
```

---

### Layer 3 Output Template

```markdown
# Website Research — Layer 3: Component Placement
## Business Type: [Business Type]
## Research Date: [Date]
## STATUS: DRAFT | PENDING REVIEW | APPROVED

---

## Page: [Page Name]

### Desktop Layout

**Component order (top to bottom):**

| Order | Component | Fold position | Rationale |
|---|---|---|---|
| 1 | [Component] | Above fold | [Why first] |
| 2 | [Component] | Above fold | [Why second] |
| 3 | [Component] | Below fold | [Why here] |

**Flow rationale:**
[2–3 sentences explaining the overall sequence logic — what the user needs to know/feel at each stage]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Visual hierarchy notes:**
[Which component dominates, which supports, which recedes — and why]

---

### Mobile Layout

**Differences from desktop:**
[List any components that change order, collapse, are hidden, or are restructured on mobile]

**Mobile-specific rationale:**
[Thumb reach, scroll behaviour, screen size constraints, audience mobile usage data]
[CITED / BEST PRACTICE / INFORMED] [Source]

---

[Repeat for each approved page]

---

## Review Notes for Liron

**Decisions required before Layer 4 can begin:**
- [ ] Confirm placement decisions per page
- [ ] Confirm any mobile-specific overrides
```

---

### Layer 4 Output Template

```markdown
# Website Research — Layer 4: Fine Detail
## Business Type: [Business Type]
## Research Date: [Date]
## STATUS: DRAFT | PENDING REVIEW | APPROVED

---

## Component: [Component Name] on [Page Name]

### CTA / Button Detail

**Recommended wording:** [Exact text or options]
**Rationale:** [Why this wording — specificity, benefit-led, action verb]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Button placement within component:** [Described precisely]
**Single or multiple CTAs:** [Decision + rationale]
[CITED / BEST PRACTICE / INFORMED] [Source]

---

### Copy and Headline Detail

**Headline pattern:** [Question / Statement / Benefit-led / Curiosity]
**Rationale:** [Why for this component in this position]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Microcopy notes:** [Any friction-reducing copy at decision points]

---

### Form Detail (if applicable)

**Field order:** [List fields in recommended order]
**Field count rationale:** [Why this number — not more, not fewer]
[CITED / BEST PRACTICE / INFORMED] [Source]
**Labels and error messages:** [Any specific guidance]

---

### Visual Detail

**Image treatment:** [Real / Stock / Illustration — authentic vs aspirational — why]
[CITED / BEST PRACTICE / INFORMED] [Source]

**Whitespace:** [How much — what it communicates in this context]
**Typography:** [Size, weight, contrast decisions relevant to this component]

---

[Repeat for each component]

---

## Review Notes for Liron

**This is the final layer. After approval, this file is ready for use in builds.**
- [ ] Confirm all fine detail decisions
- [ ] Flag any client-specific overrides to note in the project brief
```

---

## Status File Format

A `STATUS.md` file lives in the root of the research project. The agent updates it at the end of every run.

```markdown
# Website Research — Status
## Last updated: [Date]

| Business Type | Layer 1 | Layer 2 | Layer 3 | Layer 4 |
|---|---|---|---|---|
| Hair Salons UK | APPROVED | PENDING REVIEW | — | — |
| Massage & Spa UK | APPROVED | APPROVED | DRAFT | — |
| Photographers UK | — | — | — | — |

---

## Pending Actions for Liron

- [ ] Review Layer 2 — Hair Salons UK — ready since [date]
- [ ] Approve Layer 3 — Massage & Spa UK — draft complete

---

## Recently Completed

- [Date] — Layer 2 Hair Salons UK — PENDING REVIEW
- [Date] — Layer 3 Massage & Spa UK — DRAFT saved
```

---

## Notification Format (In-Chat)

When a layer run is complete, the agent sends this message in chat:

```
✅ Layer [N] research complete — [Business Type]

File saved: /website-research/[slug]/layer-[n]-[slug].md
Status: PENDING REVIEW

What was researched:
[2–3 bullet points summarising the key findings or recommendations]

Decisions needed from you before Layer [N+1] can begin:
- [Decision 1]
- [Decision 2]

When you're ready, reply with your decisions and I'll begin Layer [N+1].
```

---

## Quality Standards

Every research output must meet these standards before being marked PENDING REVIEW:

- Every recommended page, component, placement, or detail has at least one rationale statement
- Every rationale is tagged with a confidence marker (`[CITED]`, `[BEST PRACTICE]`, or `[INFORMED]`)
- Every `[CITED]` claim includes the source name and URL
- Mobile is addressed for every page and every component
- The psychological principle behind each recommendation is named explicitly
- The output is written so a non-designer (Liron) can read and make decisions from it
- The output is structured so an AI agent can load it and act on it without ambiguity

---

## Workflow Summary

```
Liron provides client brief
        ↓
Agent asks clarifying questions if needed
        ↓
Agent confirms scope back to Liron
        ↓
Reuse check — does Layer 1 file exist for this business type?
    YES (APPROVED) → skip to Layer 2
    YES (PENDING)  → notify Liron, wait for approval
    NO             → run Layer 1 research
        ↓
Agent runs Layer 1 research
        ↓
Agent writes Layer 1 output file
        ↓
Agent saves file, updates STATUS.md, notifies Liron in chat
        ↓
Liron reviews, makes page decisions, approves Layer 1
        ↓
Agent runs Layer 2 (components for approved pages only)
        ↓
[Repeat cycle through Layers 3 and 4]
        ↓
Layer 4 approved → research file set complete for this business type
        ↓
Files used in discovery calls and website builds
```

---

*Document Version: 1.0 | Created: April 2026*
*Owner: Liron, Wimbledon Smart Business*
*Related: Stage1_Step1.3_DiscoveryCall.md | Stage2_Onboarding.md | Stage3_Build.md*
