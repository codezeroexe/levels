# Audit fixtures

Small projects with a known level, used to check that a skill's audit grades the same way after the skill text changes.

Each case is the shared `base/` project (a one-file Python tool, `tally.py`, and a sample CSV) with the files in `<skill>/<case>/project/` copied over it. `case.json` holds the target level passed to the skill, the level the audit should report, and why.

For each level there are two cases:

- `L<n>-meets`: the smallest project that meets level n and nothing above it.
- `L<n>-near-miss`: the same project with one requirement of level n removed, so it should grade at n - 1.

A near-miss that grades at n means the audit missed the one property that separates the two. A meets case that grades below n means the audit asks for more than the level text says.

## Cases

| Skill | Case | Expect | Difference |
|---|---|---|---|
| `docs-level` | `L1-meets` | 1 | README says what, who, install and run |
| `docs-level` | `L1-near-miss` | 0 | no run command |
| `docs-level` | `L2-meets` | 2 | adds input format, configuration, common tasks, known problems |
| `docs-level` | `L2-near-miss` | 1 | `TALLY_CURRENCY` not documented |
| `test-level` | `L1-meets` | 1 | run command, check command, manual checklist |
| `test-level` | `L1-near-miss` | 0 | no manual checklist |
| `test-level` | `L2-meets` | 2 | adds a `unittest` suite that fails when the sum is broken |
| `test-level` | `L2-near-miss` | 1 | tests assert only types and counts, so breaking the sum fails none |

Levels 3 to 5 have no cases yet. They need things a fixture cannot easily hold (CI, a site, a load test), so each will need its own stand-in.

Two cases rest on a judgement the level text leaves open. `test-level` level 1 asks for "lint or type checks"; the fixtures use `python3 -m py_compile`. If the audit does not accept that, both `test-level` L1 cases fail for that reason, not because of the property they test.

## Running

```bash
python3 scripts/fixtures.py                       # list cases, spend nothing
python3 scripts/fixtures.py test-level --dry-run  # show the commands, spend nothing
python3 scripts/fixtures.py test-level L2         # run the L2 cases of one skill
python3 scripts/fixtures.py docs-level L1-meets --repeat 3 --budget 2
```

Each run is one full audit through `claude -p`, so it costs about as much as running the skill by hand. Run one skill or one case at a time. `--budget` passes `--max-budget-usd` to each run. `--repeat` runs a case more than once, to see whether the grade changes between runs of the same text.

The script copies the case to a temporary folder, makes it a git repository, and runs `/levels:<skill> <target> audit` there with this repository loaded through `--plugin-dir`. A system prompt supplies the Step 0 answers from `<skill>/answers.txt`, so no question is asked. Sub-agents and web tools are turned off. The grade is the `<current>` value of the skill's row in the `LEVELS.md` the audit writes.

Results go to `fixtures/results/` (not committed): one JSON line per run with the expected and reported level, the gap count, cost in dollars, input, output and cache tokens, turns, seconds and the models used, plus a copy of each run's `LEVELS.md` and final message. The script exits 1 if any run reports a different level or fails.

Arguments after `--` go to `claude` unchanged, for example `-- --model opus`. Your own `CLAUDE.md`, output style and hooks still apply to these runs and can change the result. Note them when you compare results across machines.
