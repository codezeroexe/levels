#!/usr/bin/env python3
"""Run audit fixtures headless and compare the grade with the expected one.

    python3 scripts/fixtures.py                     # list cases, run nothing
    python3 scripts/fixtures.py test-level          # run every test-level case
    python3 scripts/fixtures.py test-level L2       # cases whose name starts with L2
    python3 scripts/fixtures.py docs-level L1-meets --repeat 3 --budget 2
    python3 scripts/fixtures.py test-level --dry-run

Each case is fixtures/base plus fixtures/<skill>/<case>/project, copied to a
temporary folder with its own git repository. The skill runs there in audit
mode through `claude -p`, loaded from this repository with --plugin-dir. The
grade is read from the levels row the skill writes to LEVELS.md. Tokens and
cost come from the JSON result. Everything is saved under fixtures/results/.

Arguments after `--` are passed to claude unchanged, for example `-- --model opus`.
Exits 1 if any run's grade differs from the expected one. Standard library only.
"""
import argparse
import datetime
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

from common import ROOT

FIXTURES = ROOT / "fixtures"
PROMPT = """This is a non-interactive grading run. Nobody will answer questions.
Do not call AskUserQuestion and do not wait for a confirmation. Use these
answers for Step 0 and treat the profile as confirmed: {answers}
Run audit mode only. Write LEVELS.md as the skill says, then stop."""


def cases(skill=None, prefix=""):
    for case in sorted(FIXTURES.glob("*-level/*/case.json")):
        name, folder = case.parent.parent.name, case.parent.name
        if (skill in (None, name)) and folder.startswith(prefix):
            yield name, folder, json.loads(case.read_text())


def grade(levels_md, key):
    """Return (current, gaps) from the levels row for key, or None."""
    if not levels_md.exists():
        return None
    block = re.search(r"<!-- levels\n(.*?)\n-->", levels_md.read_text(), re.S)
    row = block and re.search(rf"^{key}: (\d)/\d gaps=(\d+)$", block.group(1), re.M)
    return (int(row.group(1)), int(row.group(2))) if row else None


def run(skill, folder, case, args, extra, out):
    work = pathlib.Path(tempfile.mkdtemp(prefix=f"{skill}-{folder}-"))
    shutil.copytree(FIXTURES / "base", work, dirs_exist_ok=True)
    shutil.copytree(FIXTURES / skill / folder / "project", work, dirs_exist_ok=True)
    git = ["git", "-c", "user.name=fixture", "-c", "user.email=fixture@example.com",
           "-c", "core.excludesFile=/dev/null"]
    for step in (["init", "-q"], ["add", "-A"], ["commit", "-qm", "fixture"]):
        subprocess.run(git + step, cwd=work, check=True)

    answers = (FIXTURES / skill / "answers.txt").read_text().strip()
    cmd = ["claude", "-p", f"/levels:{skill} {case['target']} audit",
           "--plugin-dir", str(ROOT), "--output-format", "json",
           "--no-session-persistence",
           "--append-system-prompt", PROMPT.format(answers=answers),
           "--allowedTools", "Bash", "Read", "Write", "Edit", "Glob", "Grep",
           "--disallowedTools", "Agent", "AskUserQuestion", "WebFetch", "WebSearch"]
    if args.budget:
        cmd += ["--max-budget-usd", str(args.budget)]
    cmd += extra
    if args.dry_run:
        print("  cd", work, "&&", " ".join(cmd[:3]), "...")
        shutil.rmtree(work)
        return None

    proc = subprocess.run(cmd, cwd=work, capture_output=True, text=True)
    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError:
        result = {"is_error": True, "result": proc.stdout[-2000:] + proc.stderr[-2000:]}
    got = grade(work / "LEVELS.md", skill.removesuffix("-level"))
    out.mkdir(parents=True, exist_ok=True)
    if (work / "LEVELS.md").exists():
        shutil.copy(work / "LEVELS.md", out / "LEVELS.md")
    (out / "result.txt").write_text(str(result.get("result", "")))
    shutil.rmtree(work)
    usage = result.get("usage", {})
    return {
        "skill": skill, "case": folder, "expect": case["expect"],
        "got": got[0] if got else None, "gaps": got[1] if got else None,
        "error": bool(result.get("is_error")) or proc.returncode != 0,
        "cost_usd": result.get("total_cost_usd"),
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "cache_read_tokens": usage.get("cache_read_input_tokens"),
        "cache_write_tokens": usage.get("cache_creation_input_tokens"),
        "turns": result.get("num_turns"),
        "seconds": round(result.get("duration_ms", 0) / 1000),
        "models": sorted(result.get("modelUsage", {})),
    }


def main():
    argv, extra = sys.argv[1:], []
    if "--" in argv:
        argv, extra = argv[:argv.index("--")], argv[argv.index("--") + 1:]
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("skill", nargs="?")
    p.add_argument("case", nargs="?", default="", help="case name prefix, e.g. L2")
    p.add_argument("--repeat", type=int, default=1, help="runs per case (default 1)")
    p.add_argument("--budget", type=float, help="--max-budget-usd for each run")
    p.add_argument("--dry-run", action="store_true", help="show commands, spend nothing")
    args = p.parse_args(argv)

    selected = list(cases(args.skill, args.case))
    if not selected:
        sys.exit("No case matches.")
    if not args.skill:
        for skill, folder, case in selected:
            print(f"{skill} {folder}: expect {case['expect']}. {case['why']}")
        print("\nName a skill to run its cases. Each run costs a full audit.")
        return

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    log = FIXTURES / "results" / f"{stamp}.jsonl"
    failed = 0
    for skill, folder, case in selected:
        for n in range(1, args.repeat + 1):
            print(f"{skill} {folder} run {n}: expect {case['expect']}", flush=True)
            row = run(skill, folder, case, args, extra,
                      FIXTURES / "results" / stamp / f"{skill}-{folder}-{n}")
            if row is None:
                continue
            ok = row["got"] == row["expect"] and not row["error"]
            failed += not ok
            print(f"  {'PASS' if ok else 'FAIL'} got {row['got']}"
                  f"{' (error)' if row['error'] else ''}, ${row['cost_usd']},"
                  f" {row['output_tokens']} output tokens, {row['seconds']}s")
            with log.open("a") as f:
                f.write(json.dumps(row) + "\n")
    if not args.dry_run:
        print(f"\n{failed} failed. Log: {log.relative_to(ROOT)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
