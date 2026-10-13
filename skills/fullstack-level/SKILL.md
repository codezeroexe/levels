---
name: fullstack-level
description: Run the design-level and backend-level skills together on one project, with one combined audit, one merged execution plan and one delegation gate. Use when the user runs /fullstack-level or asks to audit or raise both the interface and the backend.
argument-hint: "[design 1-5] [backend 1-5] [audit|build] [a11y] [compliance] [scope path]"
model: opus
---

# Fullstack level

Arguments: `$ARGUMENTS`

Parse the arguments:

- **DESIGN LEVEL**: the first number, 1 to 5. Default 4.
- **BACKEND LEVEL**: the second number, 1 to 5. Default 3. If only one number is given, use it for both.
- **MODE**: `audit` or `build`. Default `audit`.
- **Flags**: `a11y` goes to design-level, `compliance` and any scope path go to backend-level.

State the parsed settings in one line before starting.

This skill only coordinates. The rules for levels, edge cases, hosting, models, sub-plans and review live in the two skills. Do not restate or weaken them here. Where this skill and one of them differ, this skill wins only on ordering and on merging.

## Step 1: Load both skills

Invoke both with the Skill tool, always in `audit` mode at this point, whatever MODE is:

- `backend-level` with `<BACKEND LEVEL> audit` plus `compliance` and the scope path if given.
- `design-level` with `<DESIGN LEVEL> audit` plus `a11y` if given.

Use the names exactly as the skill listing shows them (a name may carry a prefix). If one of the two is missing, tell the user which one, and ask whether to continue with the other alone.

## Step 2: Audit, backend first

1. Run backend-level Step 0 (hosting profile) and wait for the user to confirm it. Run it once. The design audit reuses the profile: device types, network quality and expected load shape the performance budget and the live states.
2. Run the backend audit, then the design audit. Do not stop for choices between them.
3. Add a cross-layer check that neither skill covers alone:
   - Every state the backend can return (loading, empty, error, partial, conflict, rate-limited, offline, expired session) has a designed state in the interface.
   - Every edge case the backend handles is shown to the user in a way they can act on.
   - Every action in the interface maps to a backend entry point that validates it. Nothing is enforced only in the interface.
   - Live data in the interface matches what the backend can push or be polled for under the hosting profile.
4. Present one combined report: both current levels, both gap lists, the cross-layer gaps, then options. Rank across layers by the backend risk order first (data loss, security, outages, wrong results), then by how much a gap holds the design back.
5. Flag conflicts between the two targets, for example a design idea the host cannot support, and give the alternative.
6. Stop and wait for the user's choices. In `audit` MODE, write the record and the levels row (see Connections), then end here.

## Step 3: One merged plan

In `build` MODE, after the user chooses:

1. Write sub-plans by each skill's own Step 2 rules. Label each sub-plan `backend`, `design` or `cross`.
2. Order them so the backend contract comes first: a sub-plan that changes what the interface receives must finish before the design sub-plan that shows it. Sub-plans with no shared files and no dependency run in parallel across layers.
3. A `cross` sub-plan that touches both layers is split into a backend part and a design part unless the two cannot be checked apart.

## Step 4: One delegation gate

Run the gate once for the whole plan, not once per skill:

1. One table: number, layer, goal, files, data risk, model, parallel or sequential.
2. One warning line with the real counts: `Delegation: <n> sub-plans on Haiku, <n> on Sonnet (<n> backend, <n> design, <n> cross). Review on Opus.` Each sub-plan starts a new agent with its own start-up cost. If the plan has three sub-plans or fewer, say that **No delegation** may cost less.
3. Sub-plans with a data risk still need their own explicit yes, as backend-level requires.
4. Ask with AskUserQuestion using the same four choices as the two skills. Do not start until the user answers.

## Step 5: Execute and review

Execute by the skills' Step 4 rules. Then run both reviews: backend-level Step 5 first (tests, lint, build, edge case table), then design-level Step 5 (every changed screen at desktop and phone width with real content). Re-run the cross-layer check from Step 2. Report both levels reached, what moved and what is still open. One corrective round across both layers, then report the remainder. Report anything not verified.

## Connections

This skill coordinates `design-level` and `backend-level`, and connects to `idea-level`.

**Shared record.** At the start, read `LEVELS.md` in the project root if it exists and reuse the constraint profile, hosting profile and blueprint. At the end, make sure both the design and backend sections are updated, and add the cross-layer result and the date.

**Levels block.** Keep this block at the top of `LEVELS.md`, one row per layer, and update the `design` and `backend` rows: current level, target level, count of open gaps. Tools read it, so keep the format exact.

```
<!-- levels
design: 3/4 gaps=5
backend: 2/3 gaps=12
-->
```

**New-project path.** When called with a blueprint and there is no code yet (typically from `idea-level`): run the hosting profile, skip both audits, treat the blueprint as the chosen work, and go to Step 3. Plan the first version at both target levels, with the edge case catalogue applied to the planned entry points and every backend state given a designed state. The first review in Step 5 is then the first audit.

**Handoffs from this skill.**

- Both audits show the product has no clear concept or its rules are undecided: offer `idea-level` with the current product as the seed, then resume from Step 2 with its result.

**One hop.** While this skill runs, `design-level` and `backend-level` do not offer their own handoffs to each other: the cross-layer check in Step 2 covers that. Ask the user with AskUserQuestion before any handoff, saying which skill runs next, in which mode, and that it starts its own model spend. If a target skill is missing, say so and stop.
