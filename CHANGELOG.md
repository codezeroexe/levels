# Changelog

All notable changes to this project are recorded here. Versions follow the `version` field in `.claude-plugin/plugin.json`.

## 0.1.0 - unreleased

First packaged version.

### Added

- Eighteen skills under `skills/`: `levels`, `levels-status`, `levels-next`, `levels-help`, `idea-level`, `ux-level`, `restyle-level`, `design-level`, `backend-level`, `fullstack-level`, `data-level`, `test-level`, `security-level`, `perf-level`, `code-level`, `docs-level`, `ship-level`, `pitch-level`.
- Plugin manifest and marketplace manifest under `.claude-plugin/`.
- `README.md`, `CONTRIBUTING.md`, `LICENSE` (MIT).
- `docs/levels-md-format.md`, describing the `LEVELS.md` record.
- Issue templates for a bug in a skill and for a new skill proposal.
- `templates/layer-skill/SKILL.md`, a template for a new layer skill.

### Known limits

- No skill has been run from start to finish.
- The `model` frontmatter and the fallback for sessions not running Opus are unverified.
- Parts of the `LEVELS.md` format are not yet defined. See the format page.
