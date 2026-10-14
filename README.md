<p align="center">
  <img src="docs/assets/banner-dark.svg" alt="Levels: 17 skills for Claude Code. Think big. Type cheap." width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-c96442?labelColor=191817"></a>
  <img alt="Version 0.1.0" src="https://img.shields.io/badge/version-0.1.0-c96442?labelColor=191817">
  <img alt="17 skills" src="https://img.shields.io/badge/skills-17-c96442?labelColor=191817">
  <img alt="For Claude Code" src="https://img.shields.io/badge/for-Claude%20Code-c96442?labelColor=191817">
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#why-levels">Why Levels</a> ·
  <a href="#see-it-run">See it run</a> ·
  <a href="#the-levels">The levels</a> ·
  <a href="#how-a-run-goes">How a run goes</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#faq">FAQ</a>
</p>

# Levels

**Think big. Type cheap.**

Levels is a set of seventeen skills for Claude Code. Each layer skill rates one part of a project (interface, backend, tests, security and so on) on a scale from 1 to 5, shows what is missing for the level you choose, and proposes options. If you ask it to build, it splits the work into small sub-plans and hands them to cheaper models, after showing you the plan and asking first.

## Install

Use one method, not both. Installing both gives you every skill twice.

### As a plugin

```bash
claude plugin marketplace add codezeroexe/levels
```

```bash
claude plugin install levels@levels
```

Plugin skills carry the plugin name as a prefix. The conductor is `/levels:levels`, the design skill is `/levels:design-level`, and so on.

### By copying folders

```bash
git clone https://github.com/codezeroexe/levels.git
```

```bash
cp -R levels/skills/* ~/.claude/skills/
```

Skills installed this way have no prefix: `/levels`, `/design-level`. To update, pull and copy again. The copy replaces the seventeen folders and leaves your other skills alone.

The rest of this page writes commands without the prefix. Add `levels:` if you installed the plugin.

## Quick start

In a project folder, run:

```
/levels
```

It shows where the project stands, asks what you want to do with a tick-box prompt, proposes a target level for each skill you picked, and waits for you to confirm. It then runs the skills in a fixed order and asks before each one.

Other ways in:

- `/levels-help` explains the set. It changes nothing.
- `/levels-status` shows every recorded level and open gap. It changes nothing.
- `/levels-next` recommends one next step.
- `/test-level 3 audit` runs one skill directly, here the test skill against level 3.
- `/levels release` runs the checks before a release: tests, security, documentation and release steps.
- `/design-level 3 audit` rates the interface against level 3 and lists the gaps.
- `/backend-level 4 build server/` audits the `server/` folder, then plans and builds to level 4.

Layer skills start in `audit` mode unless you say `build`. An audit rates and proposes. It does not edit product code.

## Why Levels

**"Make it better" has no finish line.** Every skill has five named levels, so a target is a place you can name. For the interface they are Clean, Considered, Branded, Studio and Showcase. The skill states the level you are at now, with evidence from your files, and lists what separates you from the level you chose.

**The expensive model should think, not type.** Opus handles context, audit, options, planning and review. Haiku, or Sonnet where the work cannot be fully written out in advance, does the execution, one small sub-plan at a time. See [Models and cost](#models-and-cost).

**Nothing builds until you say so.** Skills audit first. They stop after the options and wait. Before any sub-plan runs, a gate shows which model will do which piece and asks you. A skill started by another skill asks again.

**It tells you when to stop.** Level 5 is not the goal. The skills are written to say when a target is too high for the product. In the [first test run](docs/example-LEVELS.md), the interface audit of a one-screen notes tool noted that level 3 was too high and level 2 fit.

## See it run

<p align="center">
  <img src="docs/assets/session.svg" alt="Illustrative output of an audit and of the delegation gate." width="100%">
</p>

This is example output, adapted from the [first test run](docs/example-LEVELS.md) on a one-page notes app. The delegation counts in the build panel are illustrative. Your output depends on your project.

## The levels

<p align="center">
  <img src="docs/assets/levels-matrix.svg" alt="The five named levels of each of the thirteen layer skills." width="100%">
</p>

- Each level includes everything in the levels below it.
- Your current level is the highest level whose requirements, and those of every level below it, are all met.
- A project that does not meet level 1 is recorded as level 0. Requirements already met above your level are listed as ahead.

## How a run goes

<p align="center">
  <img src="docs/assets/flow.svg" alt="The seven steps of a run: context, audit, options, plan, delegation gate, execution, review." width="100%">
</p>

A layer skill follows these steps:

1. **Context.** It reads the project, then asks you only what it could not find, in at most two rounds.
2. **Audit.** It states the level the project is at now, with evidence, and lists the gaps.
3. **Options.** For the main gaps it gives two or three choices with their costs and marks one as recommended. Then it stops and waits. In `audit` mode the run ends here.
4. **Plan.** In `build` mode it splits what you chose into sub-plans. The number follows the size of the work.
5. **Delegation gate.** It shows which model will do each sub-plan and asks before anything runs.
6. **Execution.** Sub-plans run on the models you approved.
7. **Review.** It checks the result, runs at most one corrective round, and reports what moved, what is still open and what it could not verify.

Accessibility requirements (WCAG AA contrast, keyboard access, visible focus) are off by default. Pass `a11y` to `design-level` or `restyle-level` to turn them on.

## Skills

<p align="center">
  <img src="docs/assets/skills-map.svg" alt="The seventeen skills grouped into seven phases, plus three that can run at any time." width="100%">
</p>

`/levels` runs the phases in this order and asks before each skill. Skip a phase that does not apply: a project with no interface skips Shape, and a tool nobody else will run skips Release.

<details>
<summary>All seventeen skills, and what each one does</summary>

<!-- skills-table:start -->
| Skill | Use it to |
|---|---|
| `levels` | Run several skills as one workflow |
| `levels-status` | See every level and open gap in one table |
| `levels-next` | Get the single best next step |
| `levels-help` | Read the guide |
| `idea-level` | Find or sharpen a project idea, up to a build-ready blueprint |
| `ux-level` | Check whether users can finish their tasks |
| `restyle-level` | See alternative looks and layouts as mockups |
| `design-level` | Raise the quality of the interface |
| `backend-level` | Harden the server, logic and edge cases |
| `data-level` | Fix stored data shape, integrity and migrations |
| `test-level` | Prove the product works |
| `security-level` | Find and close security weaknesses |
| `perf-level` | Measure and improve speed |
| `code-level` | Clean up structure without changing behaviour |
| `docs-level` | Make documentation accurate and usable |
| `ship-level` | Prepare a safe, repeatable release |
| `pitch-level` | Prepare a demo, talk or submission |
<!-- skills-table:end -->

</details>

Two skills use different mode names: `idea-level` takes `ideas` or `develop`, and `restyle-level` takes `explore` or `refine`. Run `/levels-help <skill>` for the arguments of one skill.

### Shortcuts for `/levels`

Pass a route to skip the question prompt: `/levels <route> [audit|build]`.

| Route | What it runs |
|---|---|
| `new` | Define, Shape, Build, Harden and Release |
| `raise` | The skills `levels-next` ranks highest, one at a time |
| `redesign` | Shape, then `design-level` in `build` mode, then `test-level` |
| `release` | `test-level`, `security-level`, then Release |
| `present` | `pitch-level` only |

## Models and cost

Think big, type cheap:

- Context, audit, options, planning and review are written to run on Opus. The skills set `model: opus` in their frontmatter.
- Execution is delegated to Haiku, or to Sonnet where the work cannot be fully written out in advance. `restyle-level` is the exception and defaults to Sonnet for first screens.
- Before any sub-plan runs, the skill prints a line such as `Delegation: 6 sub-plans on Haiku, 2 on Sonnet. Review on Opus.` and offers four choices: delegate as planned, Haiku only, Sonnet for all, or no delegation. `data-level` and `security-level` replace "Haiku only" with "Haiku where allowed", because they keep migrations and sign-in work off Haiku.
- A skill's `model` setting changes the model of your session for the rest of that turn. `levels-help` and `levels-status` set Haiku, `levels-next` sets Sonnet, and the rest set Opus.
- If the session cannot use Opus, the skill says which model is running and asks whether to continue or stop.
- Nothing builds until you answer. A skill started by another skill asks again.
- An Opus audit of a large project uses a lot of tokens. To spend least: run audits only, pick few gaps and keep the target level modest.

## Safety limits

These limits are instructions in the skill text. They are not enforced by code, so read the plan at the delegation gate before you approve it.

- No skill deploys or acts on a live system. Steps on a live system are written out for you to run, with a way back.
- No skill works on real data. `data-level` works on a copy.
- `test-level` writes tests only and does not change product code.
- `code-level` changes structure only and does not change behaviour.
- `restyle-level` writes mockups under `mockups/` and does not edit product code.
- `docs-level` and `pitch-level` do not change product code.
- `security-level` works on your own project in a local copy. It does not probe live systems and does not print secret values.
- One skill may offer to start another. It asks first, and the skill it starts does not start a third.

## The LEVELS.md record

The skills keep one file, `LEVELS.md`, in the root of your project. It starts with a levels block that tools can read:

```
<!-- levels
design: 3/4 gaps=5
backend: 2/3 gaps=12
-->
```

Below the block, each skill keeps a section with its profile, findings and date, so later skills do not ask the same questions again. The format, including the parts that are not yet fixed, is described in [docs/levels-md-format.md](docs/levels-md-format.md). A filled-in example is in [docs/example-LEVELS.md](docs/example-LEVELS.md).

## FAQ

**Will it change my code?** Not in `audit` mode. In `build` mode, only after you pick options and approve the delegation gate.

**Can I stop halfway?** Yes. Progress is kept in `LEVELS.md`. Run `/levels` again to resume.

**Do I need every skill?** No. Skip what does not apply. The skills say so when a requirement does not fit the product.

**What does it cost?** It depends on the project and the plan. Each sub-plan starts an agent with its own start-up cost, so for a plan of three sub-plans or fewer the gate says that no delegation may cost less. To spend least, run audits only, pick few gaps and keep the target level modest.

**Which models does it use?** Opus for thinking and review, Haiku or Sonnet for execution. See [Models and cost](#models-and-cost).

**Does it work with other agents?** Levels is written for Claude Code. Use with other agents is unconfirmed.

**It asked for a level I do not understand.** Run `/levels-help <skill>` to see that skill's five levels.

**A skill is missing.** The others still work. Handoffs to a missing skill stop and tell you.

## Reporting problems

Open an issue at <https://github.com/codezeroexe/levels/issues>. There is a template for a bug in a skill and one for proposing a new skill. For a bug, include the skill name, the exact command, your Claude Code version, how you installed the set, and what the skill did against what its `SKILL.md` says.

To contribute, read [CONTRIBUTING.md](CONTRIBUTING.md). If Levels is useful to you, a star helps other people find it.

## Credits

The simplification ladder in `code-level` is adapted from the [ponytail](https://github.com/DietrichGebert/ponytail) plugin by Dietrich Gebert, which is MIT licensed.

`restyle-level` borrows from the [impeccable](https://github.com/pbakaus/impeccable) project by Paul Bakaus, which is licensed under Apache 2.0. Copies of its licence and notice file are in [third-party/](third-party/).

## Licence

MIT. See [LICENSE](LICENSE).
