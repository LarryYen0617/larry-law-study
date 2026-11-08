#!/usr/bin/env python3
"""Read-only release gate for the v2 novel. Never edits the published site."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAFTS = ROOT / "drafts/zhu-tian-wan-jie/v2"
CATALOG = ROOT / "site/books/catalog.json"
MANIFEST = ROOT / "site/books/wan-jie-fa-shen/manifest.json"
MIN_HAN = 3000
BATCH = 10

def check():
    problems = []
    report = []
    for number in range(1, BATCH + 1):
        path = DRAFTS / f"chapter-{number:03d}.md"
        if not path.is_file():
            problems.append(f"Missing chapter {number}: {path}")
            continue
        raw = path.read_text(encoding="utf-8")
        body = re.sub(r"(?m)^#{1,6} .*?$", "", raw)
        body = re.sub(r"(?m)^\s*(?:---|\*\*\*)\s*$", "", body)
        count = len(re.findall(r"[\u3400-\u9fff]", body))
        headings = re.findall(r"(?m)^#{1,6}\s+.*?第[一二三四五六七八九十百零]+章.*$", raw)
        if len(headings) != 1:
            problems.append(f"Chapter {number}: expected exactly one numbered chapter heading")
        if count < MIN_HAN:
            problems.append(f"Chapter {number}: {count} Han characters < {MIN_HAN}")
        report.append({"chapter": number, "han_body": count, "file": str(path.relative_to(ROOT))})
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    legacy = next((x for x in catalog if x.get("id") == "wan-jie-fa-shen"), None)
    if legacy and legacy.get("chapterCount") == 581:
        problems.append("Legacy 581-chapter catalog is still the source entry; no v2 publication switch verified")
    if manifest.get("chapterCount") == 581:
        problems.append("Legacy 581-chapter manifest is still present; no v2 publication switch verified")
    result = {"status": "BLOCKED" if problems else "DRAFT_CHECK_PASS_ONLY",
              "drafts": report, "blockers": problems,
              "note": "Editorial continuity, rollback snapshot, CI and live chapter links require separate verification."}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if problems else 0

if __name__ == "__main__":
    sys.exit(check())
