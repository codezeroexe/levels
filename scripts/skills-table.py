#!/usr/bin/env python3
"""Write the skill table in README.md and skills/levels-help/SKILL.md from the
`summary` field of each skill's frontmatter.

    python3 scripts/skills-table.py           rewrite both tables
    python3 scripts/skills-table.py --check   exit 1 if a table is out of date
"""
import re
import sys

from common import ORDER, ROOT, frontmatter

TARGETS = ["README.md", "skills/levels-help/SKILL.md"]
BLOCK = re.compile(r"(<!-- skills-table:start -->\n).*?(<!-- skills-table:end -->)", re.S)


def table():
    rows = ["| Skill | Use it to |", "|---|---|"]
    for name in ORDER:
        summary = frontmatter(ROOT / "skills" / name / "SKILL.md")["summary"]
        rows.append(f"| `{name}` | {summary} |")
    return "\n".join(rows) + "\n"


def main():
    check = "--check" in sys.argv
    stale = []
    for target in TARGETS:
        path = ROOT / target
        old = path.read_text()
        if not BLOCK.search(old):
            sys.exit(f"{target}: skills-table markers not found")
        new = BLOCK.sub(lambda m: m.group(1) + table() + m.group(2), old)
        if new != old:
            stale.append(target)
            if not check:
                path.write_text(new)
    if check and stale:
        sys.exit("Out of date: " + ", ".join(stale) + ". Run scripts/skills-table.py")
    print("up to date" if not stale else "rewrote " + ", ".join(stale))


if __name__ == "__main__":
    main()
