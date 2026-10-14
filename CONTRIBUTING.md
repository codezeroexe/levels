# Contributing

Thank you for looking at this. The set is new, so the most useful contributions right now are reports of what happens when a skill is run on a real project.

## Reporting a bug

Use the "Bug in a skill" issue template. Say which skill, the exact command, your Claude Code version, how you installed the set (plugin or copied folders), and what the skill did against what its `SKILL.md` says.

## Changing a skill

1. Edit the file under `skills/<name>/SKILL.md`. This repository is the source of truth, not an installed copy.
2. Keep the change small. Prefer deleting repeated or unclear text over adding rules.
3. Run the validator from the repository root:

   ```bash
   claude plugin validate . --strict
   ```

   ```bash
   python3 scripts/validate.py
   ```

   The second command checks the frontmatter, the required sections, the lines every layer skill shares, the skill names used in handoffs and the levels block examples. The same checks run on every push and pull request.

   ```bash
   node --test scripts/install.test.js
   ```

   This checks that `install.js` still translates every skill for other agents. It fails if a Claude-only term (a model name, `AskUserQuestion`, `$ARGUMENTS`, the Agent tool) is left after translation. If you add such a term in a new sentence, add a rule for it to `LINE_RULES` or `WORD_RULES` in `install.js`.

4. Try the skill. Load the repository as a plugin for one session with `claude --plugin-dir .`, then run the skill in a throwaway project. Say in the pull request what you ran and what you did not run.
5. Add a line to `CHANGELOG.md`.

## The contract for layer skills

A layer skill rates one part of a project. Every layer skill, new or changed, must keep these rules. A pull request that breaks one needs to say why.

1. **Same steps.** The skill rates its part on a 1 to 5 scale and follows the same steps in the same order: context questions (look first, then ask in at most two rounds), audit with evidence, two or three options per gap, an execution plan split into sub-plans, a delegation gate, execution, review.
2. **Models.** Planning, audit and review run on Opus or Fable only, on the model the user picked (`model: inherit`). Execution runs on Haiku, or on Sonnet when required. Executors are spawned with an explicit model, never with the model left unset.
3. **Delegation gate.** Before any executor runs, the skill prints `Delegation: <n> sub-plans on Haiku, <n> on Sonnet. Review on Opus.` with the real counts, and asks the user with four choices. Nothing runs until the user answers.
4. **Flexible sub-plan count.** The number of sub-plans follows the size of the work. No fixed count, no padding, no merging of unrelated work.
5. **Accessibility is opt-in.** Accessibility requirements (WCAG AA, keyboard access, visible focus) are off unless the user passes a switch.
6. **One shared record.** The skill reads and writes `LEVELS.md` in the root of the user's project, keeps the levels block at the top, updates only its own row and its own section, and leaves the rest intact. The format is in [docs/levels-md-format.md](docs/levels-md-format.md).
7. **Handoffs.** A handoff to another skill asks the user first and goes one hop only: a skill started by a handoff reports back and does not start another. When `levels` calls a skill, that skill offers no handoff of its own.
8. **No theme, no stack.** The skill names no fonts, frameworks or hosts as requirements. Levels describe maturity, not a technology choice.

Each level includes everything in the levels below it. Level 5 carries a sentence saying when it is the right choice, because for most projects it is not.

Some existing skills differ from this contract in small ways (for example, `restyle-level` defaults to Sonnet, and `data-level` and `security-level` keep some work off Haiku). These are listed in the README. Do not copy an exception into a new skill without a reason.

## Adding a layer skill

1. Open a "New skill proposal" issue first, so the scope can be agreed before you write.
2. Copy `templates/layer-skill/` to `skills/<name>-level/` and fill it in. Keep the section order.
3. Choose a row key for the levels block: one lowercase word, not used by another skill. Add it to the table in `docs/levels-md-format.md` and to the row pattern in `scripts/validate.py`.
4. Give the skill a `summary` line in its frontmatter, add its name to `ORDER` in `scripts/common.py`, and run `python3 scripts/skills-table.py`. This writes the tables in `README.md` and `skills/levels-help/SKILL.md`; do not edit them by hand. Add the skill to the phase table and the prompt in `skills/levels/SKILL.md`, and to the ordering rules in `skills/levels-next/SKILL.md`.
5. Every skill named in a handoff must exist in `skills/`.

## Writing style

Plain, clear English. Short sentences. One term per thing. No marketing language, and no claim that has not been checked. If something is untested, say so.

## Licence

By contributing you agree that your contribution is licensed under the MIT licence in `LICENSE`.
