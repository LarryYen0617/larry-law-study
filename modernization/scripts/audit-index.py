#!/usr/bin/env python3
"""Validate structure, URL safety, and content quality of a static search index."""
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "site" / "search-preview-index.json"
REQUIRED = ("url", "subject", "title", "body")
def validate(data, site_root=ROOT / "site"):
    issues = []
    if not isinstance(data, dict) or data.get("schemaVersion") != 1 or not isinstance(data.get("pages"), list):
        return ["Invalid index schema"]
    seen = set()
    for row, item in enumerate(data["pages"]):
        if not isinstance(item, dict):
            issues.append(f"Row {row}: not an object")
            continue
        for key in REQUIRED:
            if not isinstance(item.get(key), str) or not item[key].strip():
                issues.append(f"Row {row}: missing {key}")
        url = item.get("url")
        if not isinstance(url, str): continue
        # urlsplit() silently strips tabs and newlines; check raw URLs first.
        if (any(ord(ch) < 32 or ord(ch) == 127 for ch in url)
                or "\\" in url or "%" in url.split("?", 1)[0].split("#", 1)[0]):
            issues.append(f"Row {row}: unsafe URL")
            continue
        try:
            parsed = urlsplit(url)
        except ValueError:
            issues.append(f"Row {row}: unsafe URL")
            continue
        if (parsed.scheme or parsed.netloc or parsed.query or parsed.fragment
                or url.startswith("/") or any(part in ("", ".", "..") for part in parsed.path.split("/"))):
            issues.append(f"Row {row}: unsafe URL")
            continue
        target = (site_root / url).resolve()
        if not target.is_relative_to(site_root.resolve()) or target.suffix != ".html":
            issues.append(f"Row {row}: URL outside HTML scope")
        elif not target.is_file():
            issues.append(f"Row {row}: missing source HTML {url}")
        if url in seen: issues.append(f"Row {row}: duplicate URL {url}")
        if isinstance(item.get("title"), str) and len(item["title"]) > 300:
            issues.append(f"Row {row}: title too long")
        if isinstance(item.get("subject"), str) and len(item["subject"]) > 100:
            issues.append(f"Row {row}: subject too long")
        seen.add(url)
        if isinstance(item.get("body"), str) and len(item["body"]) > 100000:
            issues.append(f"Row {row}: body too long")
    return issues
if __name__ == "__main__":
    try:
        data = json.loads(INDEX.read_text(encoding="utf-8"))
        issues = validate(data)
    except (OSError, ValueError) as exc:
        issues = [str(exc)]
    if issues:
        print("\n".join(issues), file=sys.stderr)
        sys.exit(1)
    print(f"Validated {len(data['pages'])} search index records")
