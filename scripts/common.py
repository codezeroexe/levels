"""Shared helpers for the repository scripts. Standard library only."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Order of the skill table: the four helpers, then the layer skills.
ORDER = [
    "levels", "levels-status", "levels-next", "levels-help",
    "idea-level", "ux-level", "restyle-level", "design-level", "backend-level",
    "data-level", "test-level", "security-level", "perf-level",
    "code-level", "docs-level", "ship-level", "pitch-level",
]


def frontmatter(path):
    """Return the frontmatter of a SKILL.md as a dict of plain strings."""
    text = path.read_text()
    match = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not match:
        return None
    fields = {}
    for line in match.group(1).splitlines():
        key, sep, value = line.partition(":")
        if not sep or not re.fullmatch(r"[a-z-]+", key):
            return None
        fields[key] = value.strip().strip('"')
    return fields
