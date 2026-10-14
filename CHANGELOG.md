# Changelog

All notable changes to this project are recorded here. Versions follow the `version` field in `.claude-plugin/plugin.json`.

## 0.1.0 - unreleased

First packaged version.

### Added

- Seventeen skills under `skills/`: `levels`, `levels-status`, `levels-next`, `levels-help`, `idea-level`, `ux-level`, `restyle-level`, `design-level`, `backend-level`, `data-level`, `test-level`, `security-level`, `perf-level`, `code-level`, `docs-level`, `ship-level`, `pitch-level`.
- Plugin manifest and marketplace manifest under `.claude-plugin/`.
- `README.md`, `CONTRIBUTING.md`, `LICENSE` (MIT).
- `docs/levels-md-format.md`, describing the `LEVELS.md` record.
- Issue templates for a bug in a skill and for a new skill proposal.
- `install.js`: installs the skills for Codex CLI, Gemini CLI, opencode, Cursor and GitHub Copilot CLI, translating Claude model names to per-agent models and writing executor sub-agents. Checked by `scripts/install.test.js` in CI.
- Fable as a planner: the skills that set `model: opus` now set `model: inherit` and accept a session on Opus or Fable. The installer accepts `gpt-6-astra` as the Codex planner next to `gpt-6.1-sol`.
- `templates/layer-skill/SKILL.md`, a template for a new layer skill.

### Changed after the first test run

- Level 0 is defined as "below level 1", and the current level is the highest level with every lower requirement met.
- `audit` mode writes the record before it ends.
- `backend-level` records the edge cases not handled, and `test-level` reads that list.
- `levels-next` sets `model: sonnet`.
- A session that cannot use Opus is asked whether to continue, instead of moving the audit into a sub-agent.
- The delegation gate warns when a plan is small.
- `test-level` may write test configuration and the test command, and offers a handoff when the product cannot be tested as written.
- `levels-status` reads the date from the section and compares it with the last commit.

- `design-level` has a Step 0 that asks for a design profile.
- Each skill has a `summary` line in its frontmatter. `scripts/skills-table.py` writes the skill tables from it.
- `scripts/validate.py` and a GitHub Actions workflow check every `SKILL.md`.
- `data-level`, `pitch-level` and `idea-level` use the shared handoff rule and delegation line word for word.
- `docs/example-LEVELS.md`, a filled-in record from the test run.

### Changed

- `security-level` level 1 is named Basic instead of Clean, so `design-level` is the only skill with a level called Clean.

### Removed

- `fullstack-level`. `levels` runs `backend-level` and `design-level` in order and now carries the cross-layer check. `idea-level`, `design-level`, `backend-level`, `restyle-level` and `levels-next` point to `levels` or to the single layer skills instead.
