#!/usr/bin/env python3
"""Read-only quality gate for the ten-chapter Zhu Tian Wan Jie v2 draft batch.

Usage: python3 scripts/audit_zhu_tian_v2.py
Never edits the legacy book manifest or production search index.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DRAFTS = ROOT / "drafts/zhu-tian-wan-jie/v2"
EXPECTED = list(range(1, 11))
errors = []
chapter_text = {}
for number in EXPECTED:
    path = DRAFTS / f"chapter-{number:03}.md"
    if not path.is_file():
        errors.append(f"Missing chapter {number:03}")
        continue
    raw = path.read_text(encoding="utf-8")
    heading = re.search(r"(?m)^##\s*第([一二三四五六七八九十]+)章\s+(.+)$", raw)
    if not heading:
        errors.append(f"Chapter {number:03}: missing numbered title")
    body = re.sub(r"(?m)^#{1,6}.*$", "", raw)
    chars = len(re.sub(r"\s", "", body))
    chapter_text[number] = body
    print(f"chapter-{number:03}: {chars} non-whitespace Unicode characters")
    if chars < 3000:
        errors.append(f"Chapter {number:03}: {chars} < 3000")
    if "顏凌淵" not in body:
        errors.append(f"Chapter {number:03}: protagonist name absent")
if len(chapter_text) == len(EXPECTED):
    joined = "\n".join(chapter_text.values())
    for name in ("沈月璃", "莫凡", "天道圖書館"):
        if name not in joined:
            errors.append(f"Batch lacks required reference: {name}")
print("NOTICE: Character counts are a mechanical minimum only, not literary editing.")
print("NOTICE: Passing does not authorize changing catalog.json or legacy 581-chapter manifest.")
if errors:
    for error in errors:
        print("FAIL:", error, file=sys.stderr)
    sys.exit(1)
print("PASS: 10 chapters present and mechanical draft checks passed; editorial review remains required.")
