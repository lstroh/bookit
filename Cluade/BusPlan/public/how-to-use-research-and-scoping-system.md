# How to Use the Website Research and Scoping System
## Wimbledon Smart Business — Instructions for Liron and AI Agents

**Document Version:** 1.0
**Date:** April 2026
**Owner:** Liron, Wimbledon Smart Business
**Applies To:** Every client website build

---

## What This System Is

This system ensures every Wimbledon Smart website build is grounded in research, not guesswork. It replaces open-ended client questions ("what pages do you want?") with evidence-based recommendations ("here's what works for businesses like yours, and why").

It consists of two documents and one output per client:

| Document | Purpose | Used when |
|---|---|---|
| `website-research-workflow.md` | Instructions for running sector research, layer by layer | Before or during client scoping — once per sector |
| `website-scoping-document.md` | Template for scoping each individual client's website | After contract signed — once per client |
| `[client]-website-scoping.md` | Filled-in scoping document for a specific client | During and after the scoping process |

---

## The Two Documents Explained

### Document 1 — Website Research Workflow

**What it is:** A process definition for an AI agent (or Liron) to research a business sector and produce structured reference files, one layer at a time.

**What it produces:** A set of markdown research files stored in the dedicated research project, covering:
- Layer 1 — Recommended pages and their goals
- Layer 2 — Components per page
- Layer 3 — Component placement (desktop and mobile)
- Layer 4 — Fine detail (copy, buttons, forms, imagery)

**Key principle:** Research is done once per sector. Once a sector is researched and approved, it is reused for every future client in that sector. It is only repeated if the research is more than 18 months old or the sector has changed significantly.

---

### Document 2 — Website Scoping Document

**What it is:** A template completed for every individual client after the contract is signed. It pulls from the sector research and the client questionnaire to produce a complete, approved plan before the build begins.

**What it produces:**
- An internal record of every page, component, and design decision for this client
- The source material for the client-facing design presentation
- A build brief (Section 7) that Liron uses to start the build

**Key principle:** One copy per client. Never edit the template itself — always work from a named copy.

---

## File Locations

| File | Location |
|---|---|
| `website-research-workflow.md` | Research project root |
| `website-scoping-document.md` (template) | Business planning project AND research project root |
| `STATUS.md` | Research project root — updated after every research run |
| Sector research files | `/website-research/[sector-slug]/layer-[n]-[sector-slug].md` |
| Client scoping documents | `/[ClientName]/02-Scoping/[clientslug]-website-scoping.md` |

---

## When to Use Each Document

### Use the Research Workflow when:
- A new client is in a sector that has not been researched yet
- Existing sector research is more than 18 months old
- Liron decides the sector has changed enough to warrant a refresh
- A new layer is ready to be run for an existing sector

### Use the Scoping Document when:
- A contract has been signed with a new client
- The client questionnaire has been returned
- You are ready to make page, component, and design decisions for a specific client

---

## The Full Sequence — Step by Step

### Step 1 — After the Discovery Call
*Before contract is signed.*

- Note the client's sector
- Check `STATUS.md` in the research project — does Layer 1 research exist for this sector?
- If yes and approved → research is ready to use when needed
- If no → make a note to trigger research after contract is signed

---

### Step 2 — After Contract is Signed
*Build starts here.*

**2a — Trigger sector research (if needed)**

If no approved Layer 1 exists for this sector:
- Open `website-research-workflow.md`
- Follow the agent trigger instructions in the "Agent Trigger" section
- Provide the agent with: sector, location context, client positioning notes, and "run Layer 1"
- Agent runs research, saves output, updates `STATUS.md`, notifies you
- Review Layer 1 output — approve or request changes
- Repeat for Layers 2, 3, 4 as needed — one layer at a time

If approved research already exists:
- Skip to Step 2b

**2b — Create the client scoping document**

- Make a copy of `website-scoping-document.md`
- Name it: `[clientslug]-website-scoping.md` (e.g. `bloom-salon-website-scoping.md`)
- Save it to: `/[ClientName]/02-Scoping/`
- Begin completing sections in order

---

### Step 3 — Complete the Scoping Document

Complete sections in this order. Do not skip ahead.

**Section 1 — Client Brief**
*Who completes it:* Liron, from discovery call notes and questionnaire
*When:* As soon as questionnaire is returned
*What you need:* Discovery call notes, completed client questionnaire

**Section 2 — Sector Research Reference**
*Who completes it:* Liron or AI agent
*When:* After Section 1 is complete
*What you need:* Approved research files from the research project
*Agent instruction:* "Load the approved research files for [sector] and populate Section 2 of the scoping document for [client name]."

**Section 3 — Page Plan**
*Who completes it:* Liron, informed by research and client brief
*When:* After Section 2 is loaded
*What you need:* Approved Layer 1 research file, client questionnaire Section 6
*Note:* This can be done collaboratively with the client if they are engaged in the process — but Liron makes the final recommendation based on research

**Section 4 — Component Plan**
*Who completes it:* Liron alone
*When:* After page plan is confirmed
*What you need:* Approved Layer 2 and Layer 3 research files

**Section 5 — Design Direction**
*Who completes it:* Liron alone (internal rationale) — then presented to client
*When:* After component plan is confirmed
*What you need:* Sector research design patterns, client questionnaire Section 2 (branding), any reference sites the client provided
*Output:* Produces the Client Design Presentation (see Step 4)

**Section 6 — Scope Boundaries**
*Who completes it:* Liron alone
*When:* After client approves design direction
*What you need:* Confirmed page list, confirmed features, client asset status

**Section 7 — Build Brief**
*Who completes it:* Liron alone
*When:* After all sections are complete and approved
*What you need:* All previous sections

---

### Step 4 — Produce the Client Design Presentation

*When:* After Section 5 (Design Direction) internal rationale is complete
*Source:* Use the client-facing version of each option in Section 5
*Format:* Slides (PowerPoint or equivalent) — one slide per option, plus one recommendation slide
*Content per option slide:*
- Option name and mood sentence
- "This option is right for you if..." statement
- Colour swatches with simple names
- Font sample
- 3 mood reference images

*Present to client:* In a call or async — ask them to approve one option or request adjustments
*Record decision:* In Section 5.4 of the scoping document

---

### Step 5 — Begin the Build

*When:* All seven sections of the scoping document are complete and design direction is approved
*Reference:* Use Section 7 (Build Brief) as the primary build reference
*Also reference:* `bookit-setup-guide.md` for technical setup, `legal-checklist.md` for compliance go-live checklist

---

## Instructions for AI Agents

If you are an AI agent reading this document, follow these rules:

### Running Sector Research
1. Read `website-research-workflow.md` in full before starting any research run
2. Always check `STATUS.md` before starting — do not repeat approved research
3. Ask Liron clarifying questions if the brief is incomplete — do not start with ambiguous inputs
4. Confirm scope back to Liron before beginning research
5. Run one layer at a time — do not proceed to the next layer without explicit approval
6. Save output files using the exact naming convention in the workflow document
7. Update `STATUS.md` after every run
8. Notify Liron in chat using the notification format in the workflow document

### Completing the Scoping Document
1. Never edit the template file — always work from a named client copy
2. Complete sections in order — do not populate a later section before earlier ones are complete
3. When populating Section 2, load the actual research files — do not summarise from memory
4. When producing design options in Section 5, base them on the sector research — do not invent options without research basis
5. Flag any missing information clearly rather than filling gaps with assumptions
6. When a section is complete, notify Liron and state what is needed before the next section can begin

### General Rules
- Never make decisions on Liron's behalf — present options and rationale, then wait for a decision
- Always cite the research file and layer when referencing a recommendation
- If research files are missing or incomplete, flag this before proceeding — do not work around it
- Confidence markers `[CITED]`, `[BEST PRACTICE]`, and `[INFORMED]` must be applied to every recommendation

---

## Quick Reference — Who Does What

| Task | Liron | AI Agent | Client |
|---|---|---|---|
| Trigger research run | ✅ | | |
| Run sector research | | ✅ | |
| Review and approve research layers | ✅ | | |
| Complete Section 1 — Client Brief | ✅ | | |
| Load Section 2 — Research Reference | ✅ | ✅ | |
| Complete Section 3 — Page Plan | ✅ | With guidance | Optional |
| Complete Section 4 — Component Plan | ✅ | With guidance | |
| Complete Section 5 — Design Direction (internal) | ✅ | With guidance | |
| Produce client design presentation | ✅ | ✅ | |
| Approve design direction | | | ✅ |
| Complete Section 6 — Scope Boundaries | ✅ | | |
| Complete Section 7 — Build Brief | ✅ | ✅ | |

---

## Quick Reference — Document Status Checks

Before starting any task, check:

| Check | Where to look |
|---|---|
| Has this sector been researched? | `STATUS.md` in research project |
| Which layers are approved? | `STATUS.md` — or open the sector folder |
| Is the scoping document complete? | Document status table at the bottom of the scoping document |
| Is the design direction approved? | Section 5.4 of the scoping document |
| Is the build brief ready? | Section 7 of the scoping document — all sections must be complete first |

---

## Related Documents

| Document | Purpose |
|---|---|
| `website-research-workflow.md` | Full research process definition |
| `website-scoping-document.md` | Scoping document template |
| `Stage1_Step1.3_DiscoveryCall.md` | Discovery call process and question banks |
| `Stage2_Onboarding.md` | Client questionnaire |
| `bookit-setup-guide.md` | Technical build reference |
| `bookit-client-guide.md` | Client training document |
| `legal-checklist.md` | Pre-launch compliance checklist |

---

*Document Version: 1.0 | Created: April 2026*
*Owner: Liron, Wimbledon Smart Business*
