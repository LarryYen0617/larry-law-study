#!/usr/bin/env python3
"""Read-only structural validation of the existing production search database."""
import json
import sys
from collections import Counter
from pathlib import Path

PATH = Path(__file__).resolve().parents[2] / "site" / "search-index.json"
def inspect(data):
    problems = []
    if not isinstance(data, dict) or data.get("version") != 1 or not isinstance(data.get("items"), list):
        return {"valid": False, "problems": ["invalid production schema"]}
    seen = set()
    kinds = Counter()
    for row, item in enumerate(data["items"]):
        if not isinstance(item, dict):
            problems.append(f"row {row}: not an object")
            continue
        key = item.get("id")
        if not isinstance(key, str) or not key.strip():
            problems.append(f"row {row}: missing id")
        elif key in seen:
            problems.append(f"row {row}: duplicate id {key}")
        else:
            seen.add(key)
        kind = item.get("type")
        if not isinstance(kind, str) or not kind:
            problems.append(f"row {row}: missing type")
        else:
            kinds[kind] += 1
    return {"valid": not problems, "total": len(data["items"]), "types": dict(kinds), "problems": problems}
if __name__ == "__main__":
    try:
        report = inspect(json.loads(PATH.read_text(encoding="utf-8")))
    except (OSError, ValueError) as exc:
        report = {"valid": False, "problems": [str(exc)]}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not report["valid"]:
        sys.exit(1)
