#!/usr/bin/env python3
"""Check every SKILL.md against the rules in CONTRIBUTING.md.

    python3 scripts/validate.py

Exits 1 and lists every problem if a check fails. Standard library only.
"""
import re
import sys

from common import ORDER, ROOT, frontmatter

HELPERS = {"levels", "levels-status", "levels-next", "levels-help"}
LAYER_SECTIONS = ["Levels", "Models", "Step 0", "Step 1", "Step 2", "Step 3",
                  "Step 4", "Step 5", "Connections", "Quality bar"]
ROW = re.compile(
    r"(idea|ux|restyle|design|backend|data|test|security|perf|code|docs|ship|pitch)"
    r": [0-5]/[1-5] gaps=\d+|flow: phase=[A-Za-z]+ left=\d+")
BLOCK = re.compile(r"<!-- levels\n(.*?)\n-->", re.S)
# Lines that must read the same in every layer skill.
SHARED = [
    "Each level includes everything in the levels below it. The current level is the highest level",
    "- If this session is not running Opus, say which model is running and ask the user whether to continue on it or stop.",
    "`Delegation: <n> sub-plans on Haiku, <n> on Sonnet. Review on Opus.`",
    "**Rules for every handoff.** Ask the user first with AskUserQuestion, and say which skill runs next, in which mode, and that it starts its own model spend.",
    "This skill is one of the connected level skills",
]

problems = []


def problem(where, text):
    problems.append(f"{where}: {text}")


def main():
    folders = sorted(p.name for p in (ROOT / "skills").iterdir() if p.is_dir())
    if folders != sorted(ORDER):
        problem("scripts/common.py", "ORDER does not match the folders under skills/")

    for name in folders:
        path = ROOT / "skills" / name / "SKILL.md"
        where = f"skills/{name}/SKILL.md"
        if not path.exists():
            problem(where, "missing")
            continue
        text = path.read_text()
        fields = frontmatter(path)
        if fields is None:
            problem(where, "frontmatter missing or not plain `key: value` lines")
            continue
        if fields.get("name") != name:
            problem(where, f"name is {fields.get('name')!r}, folder is {name!r}")
        for key in ("description", "summary", "model"):
            if not fields.get(key):
                problem(where, f"frontmatter has no {key}")
        raw = re.search(r"^description: (.*)$", text, re.M)
        if raw and ": " in raw.group(1) and not raw.group(1).startswith('"'):
            problem(where, "description contains a colon and must be quoted")

        headings = re.findall(r"^## (.+)$", text, re.M)
        if name not in HELPERS:
            for section in LAYER_SECTIONS:
                if not any(h.startswith(section) for h in headings):
                    problem(where, f"no section starting '## {section}'")
            for line in SHARED:
                if line not in text:
                    problem(where, f"shared line missing or changed: {line[:60]}...")

        for target in set(re.findall(r"`((?:[a-z]+-level)|levels(?:-[a-z]+)?)`", text)):
            if target not in folders:
                problem(where, f"names a skill that does not exist: {target}")

    for path in [ROOT / "README.md", *(ROOT / "docs").glob("*.md"),
                 *(ROOT / "skills").glob("*/SKILL.md"), *(ROOT / "templates").rglob("SKILL.md")]:
        for block in BLOCK.findall(path.read_text()):
            for row in block.splitlines():
                if not ROW.fullmatch(row) and "<key>" not in row:
                    problem(str(path.relative_to(ROOT)), f"levels block row does not match the format: {row!r}")

    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print(f"{len(folders)} skills checked, no problems")


if __name__ == "__main__":
    main()
