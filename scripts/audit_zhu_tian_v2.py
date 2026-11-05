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
CHINESE_NUMERALS = ("一", "二", "三", "四", "五", "六", "七", "八", "九", "十")
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
    elif heading.group(1) != CHINESE_NUMERALS[number - 1]:
        errors.append(f"Chapter {number:03}: heading says 第{heading.group(1)}章, expected 第{CHINESE_NUMERALS[number - 1]}章")
    elif not heading.group(2).strip():
        errors.append(f"Chapter {number:03}: empty chapter title")
    body = re.sub(r"(?m)^#{1,6}.*$", "", raw)
    chars = len(re.sub(r"\s", "", body))
    han_chars = len(re.findall(r"[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]", body))
    chapter_text[number] = body
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if len(p.strip()) >= 35]
    if len(paragraphs) != len(set(paragraphs)):
        errors.append(f"Chapter {number:03}: duplicate substantial paragraphs")
    print(f"chapter-{number:03}: {chars} non-whitespace Unicode characters; {han_chars} Han characters")
    if han_chars < 3000:
        errors.append(f"Chapter {number:03}: {han_chars} Han characters < 3000 (punctuation excluded)")
    if chars < 3000:
        errors.append(f"Chapter {number:03}: {chars} < 3000")
    if "顏凌淵" not in body:
        errors.append(f"Chapter {number:03}: protagonist name absent")
if len(chapter_text) == len(EXPECTED):
    joined = "\n".join(chapter_text.values())
    for name in ("沈月璃", "莫凡", "天道圖書館"):
        if name not in joined:
            errors.append(f"Batch lacks required reference: {name}")
print("NOTICE: Han character count excludes punctuation, Latin letters and digits; editorial review remains required.")
print("NOTICE: Passing does not authorize changing catalog.json or legacy 581-chapter manifest.")
if errors:
    for error in errors:
        print("FAIL:", error, file=sys.stderr)
    sys.exit(1)
print("PASS: 10 chapters present and mechanical draft checks passed; editorial review remains required.")
