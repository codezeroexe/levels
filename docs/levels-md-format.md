# The LEVELS.md format

`LEVELS.md` is the record the level skills share. It lives in the root of the user's project. Skills read it at the start so they do not ask the same questions twice, and write to it at the end.

This page describes the format as the skills in version 0.1.0 write it. Where the skills do not fix a detail, this page says so under [Not yet defined](#not-yet-defined) and does not invent a rule. Tools should read only the parts marked as defined.

## File layout

1. The levels block, at the top of the file.
2. A shared part, written by `levels`: what the product is for, who uses it, where it runs, any date, and the accepted model spend.
3. One section per skill that has run.
4. A flow section, written by `levels` only.

Every skill keeps the sections of other skills intact.

## The levels block

Defined. The block is an HTML comment, so it does not show when the file is rendered.

```
<!-- levels
design: 3/4 gaps=5
backend: 2/3 gaps=12
test: 2/3 gaps=7
flow: phase=harden left=3
-->
```

Rules:

- The first line is exactly `<!-- levels`. The last line is exactly `-->`.
- Between them there is one row per line.
- There is at most one row per key. A skill updates only its own row and leaves the others as they are.
- A layer with no row has not been run.

### Layer rows

```
<key>: <current>/<target> gaps=<count>
```

- `<key>` is one of the keys in the table below.
- `<current>` and `<target>` are whole numbers from 1 to 5.
- `<count>` is a whole number, 0 or more.

As a regular expression:

```
^(idea|ux|restyle|design|backend|data|test|security|perf|code|docs|ship|pitch): [1-5]/[1-5] gaps=\d+$
```

| Key | Written by | What `gaps` counts |
|---|---|---|
| `idea` | `idea-level` | open gaps |
| `ux` | `ux-level` | open findings |
| `restyle` | `restyle-level` | open decisions. `<current>` is the level reached |
| `design` | `design-level`, `fullstack-level` | open gaps |
| `backend` | `backend-level`, `fullstack-level` | open gaps |
| `data` | `data-level` | not stated by the skill |
| `test` | `test-level` | open gaps |
| `security` | `security-level` | open findings |
| `perf` | `perf-level` | tasks over budget plus open findings |
| `code` | `code-level` | open findings |
| `docs` | `docs-level` | open gaps |
| `ship` | `ship-level` | open gaps |
| `pitch` | `pitch-level` | not stated by the skill |

`fullstack-level` has no row of its own. It updates the `design` and `backend` rows.

### The flow row

```
flow: phase=<phase> left=<count>
```

Written by `levels` only. It is not a layer and must be kept out of any table of layers. `<phase>` is the current phase, and `<count>` is the number of skills left to run. The skills show one example, `phase=harden`. The phase names in `levels` are Orient, Define, Shape, Build, Harden, Release and Present.

## Skill sections

Each skill creates or updates one section. The content below is what each `SKILL.md` says it records.

| Skill | Section | Content |
|---|---|---|
| `idea-level` | not named | constraint profile, scoring criteria, the chosen idea and its blueprint, date |
| `ux-level` | UX | user profile, target and reached level, steps and decisions per key task before and after, open findings marked as expert review or observed, date |
| `restyle-level` | restyle | profile, reading of the current design, every direction shown with its status and reason, contract of the chosen direction, level reached, date |
| `design-level` | design | target and reached level, what was chosen, open gaps, date |
| `backend-level` | backend | hosting profile, target and reached level, edge case counts, open gaps, date |
| `fullstack-level` | design and backend | both sections above, plus the cross-layer result and date |
| `data-level` | data | data profile, target and reached level, integrity counts, pending live steps, open findings, date. No real data values |
| `test-level` | test | test profile, target and reached level, critical behaviours tested and not tested, bugs found, date |
| `security-level` | security | threat profile, target and reached level, open findings by severity, accepted risks with reasons, date. No secret and no working attack |
| `perf-level` | performance | performance profile, target and reached level, each key task with budget, measured value and conditions, open findings, date |
| `code-level` | code | code profile, target and reached level, hotspots, files touched per typical change before and after, open findings, recorded shortcuts, date |
| `docs-level` | docs | reader profile, target and reached level, open gaps, unanswered questions, date |
| `ship-level` | ship | release profile, target and reached level, concerns tried and never tried, pending live steps, date. No secret |
| `pitch-level` | pitch | audience profile, chosen story, target and reached level, criteria with no evidence, date |

Profiles are reused across skills. For example, `backend-level` writes the hosting profile, and `design-level`, `test-level`, `security-level`, `perf-level` and `ship-level` read it.

## The flow section

Written by `levels`: the selection, the mode, the level plan, each skill with its status (done, skipped, queued, stopped) and date, and the queue of skills waiting to run.

## What must never be written

- Secret values.
- Working attacks. Security findings are described by location and type only.
- Real data values. Data is described by shape, counts and redacted samples.

## Not yet defined

These details are not fixed by the skills in 0.1.0. A tool must not depend on them.

- **Section headings.** The skills name sections in prose ("its design section") and do not give the exact heading text or level.
- **The idea section.** `idea-level` does not name its section.
- **Dates.** Each section carries a date, but no format is given. The levels block carries no date, although `levels-status` shows a date per layer and must read it from the sections.
- **Pending actions and accepted risks.** `levels-status` lists "waiting on you" items and accepted risks from any section. Their place and form inside a section are not given.
- **The meaning of `gaps` for `data` and `pitch`.** The two skills do not say what the count holds.
- **Case of the flow phase.** The example is lowercase. The phase names are written with a capital elsewhere.
- **The shared part.** Its heading and layout are not given.
- **Order of rows** in the levels block.
- **A format version.** The block has none, so a later change to the format cannot be detected.

These gaps are tracked for a later version. Until then, the levels block rows are the only part meant for tools.
