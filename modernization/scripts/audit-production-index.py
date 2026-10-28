#!/usr/bin/env python3
"""Read-only structural and link-safety validation of the production search database."""
import json
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

PATH = Path(__file__).resolve().parents[2] / "site" / "search-index.json"
SAFE_PAGES = {"essentials.html", "library.html", "index.html", "reading.html"}
REQUIRED = ("id", "type", "subject", "title", "body", "href")

def inspect(data, min_records=0):
    problems = []
    if not isinstance(data, dict) or data.get("version") != 1 or not isinstance(data.get("items"), list):
        return {"valid": False, "problems": ["invalid production schema"]}
    items = data["items"]
    if len(items) < min_records:
        problems.append(f"record count dropped below {min_records}: {len(items)}")
    seen = set()
    kinds = Counter()
    for row, item in enumerate(items):
        if not isinstance(item, dict):
            problems.append(f"row {row}: not an object")
            continue
        for field in REQUIRED:
            if not isinstance(item.get(field), str):
                problems.append(f"row {row}: invalid {field}")
        key = item.get("id")
        if not isinstance(key, str) or not key.strip():
            problems.append(f"row {row}: missing id")
        elif key in seen:
            problems.append(f"row {row}: duplicate id {key}")
        else:
            seen.add(key)
        kind = item.get("type")
        if isinstance(kind, str) and kind:
            kinds[kind] += 1
        else:
            problems.append(f"row {row}: missing type")
        href = item.get("href")
        if isinstance(href, str):
            url = urlsplit(href)
            if (url.scheme or url.netloc or url.path not in SAFE_PAGES
                    or "\\" in href or any(ord(ch) < 32 for ch in href)):
                problems.append(f"row {row}: unsafe href")
    return {"valid": not problems, "total": len(items), "types": dict(kinds), "problems": problems}

if __name__ == "__main__":
    try:
        report = inspect(json.loads(PATH.read_text(encoding="utf-8")), min_records=3602)
    except (OSError, ValueError) as exc:
        report = {"valid": False, "problems": [str(exc)]}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not report["valid"]:
        sys.exit(1)
