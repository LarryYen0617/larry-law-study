"""Exclude source-only teacher originals from the GitHub Pages build, not Git history.

This must run after source-based tests and before rebuilding the published
search index. The checked-in imports remain unchanged for private review.
"""
import json
import re
import subprocess
from pathlib import Path
from check_public_source_leak import (TEXT_EXTENSIONS, _canonical_private_text,
                                      _decoded_public_text, _encoded_needles,
                                      _private_segments)

EXPECTED_ORIGINALS = 91
MIN_PUBLIC_SEARCH_ITEMS = 3602
CHUNKS = tuple(f"library-teacher-{number:02}.js" for number in range(1, 6))
PUSH_PATTERN = re.compile(r"window\.LEX_LIBRARY\.teacherQuestions\.push\(\.\.\.(\[[\s\S]*\])\);\s*$")


def extract_originals(site):
    originals = []
    for name in CHUNKS:
        payload = (site / name).read_text(encoding="utf-8")
        match = PUSH_PATTERN.search(payload)
        if match is None:
            raise ValueError(f"Unexpected teacher import format: {name}")
        rows = json.loads(match.group(1))
        if not isinstance(rows, list):
            raise ValueError(f"Teacher import is not an array: {name}")
        originals.extend(rows)
    ids = [row.get("id") for row in originals]
    if len(originals) != EXPECTED_ORIGINALS or len(set(ids)) != EXPECTED_ORIGINALS:
        raise ValueError("Teacher original inventory changed; review release sanitizer before publishing")
    if any(not isinstance(row.get("question"), str) or not isinstance(row.get("answer"), str)
           or not isinstance(row.get("source"), str) for row in originals):
        raise ValueError("Teacher original inventory contains malformed rows")
    return originals


def sanitize(site):
    originals = extract_originals(site)
    for index, name in enumerate(CHUNKS):
        replacement = ("window.LEX_LIBRARY.teacherQuestions=[];\n" if index == 0 else
                       "// Source-only teacher questions excluded from public Pages.\n")
        (site / name).write_text(replacement, encoding="utf-8")
    # Keep the remaining authored cases discoverable without offering a
    # source-only filter. These edits apply to the build artifact only.
    reader = site / "library.js"
    content = reader.read_text(encoding="utf-8")
    old_default = "let teacherFilter='original'"
    old_filters = "[['original','老師原題'],['authored','補充自編題'],['all','全部']]"
    if content.count(old_default) != 1 or content.count(old_filters) != 1:
        raise ValueError("Unexpected public reader controls; manual review required")
    reader.write_text(content.replace(old_default, "let teacherFilter='authored'")
                      .replace(old_filters, "[['authored','自編案例'],['all','全部']]"),
                      encoding="utf-8")
    html_page = site / "library.html"
    markup = html_page.read_text(encoding="utf-8")
    old_label = "課堂原題與擬答"
    if markup.count(old_label) != 1:
        raise ValueError("Unexpected library navigation; manual review required")
    html_page.write_text(markup.replace(old_label, "課堂案例與自編擬答"), encoding="utf-8")
    return originals


def validate_public(site, originals):
    data = json.loads((site / "search-index.json").read_text(encoding="utf-8"))
    items = data.get("items", [])
    if data.get("version") != 1 or len(items) < MIN_PUBLIC_SEARCH_ITEMS:
        raise ValueError("Public search index is incomplete after teacher-source isolation")
    original_ids = {row["id"] for row in originals}
    if any(item.get("id") == "teacher:" + original_id for item in items
           for original_id in original_ids):
        raise ValueError("Private teacher item remains in the public search index")
    authored = [item for item in items if item.get("type") == "teacher"]
    if len(authored) != 18:
        raise ValueError(f"Expected 18 authored public teacher-case summaries, found {len(authored)}")
    # Use the same overlapping excerpt gate for teacher questions and answers.
    # Three sampled excerpts miss verbatim passages between sample positions.
    needles = [(row["id"], needle) for row in originals
               for text in (row["question"], row["answer"])
               for segment in _private_segments(text)
               for needle in _encoded_needles(segment)]
    canonical_needles = [
        (case_id, needle, _canonical_private_text(needle))
        for case_id, needle in needles
    ]
    checked = 0
    for path in site.rglob("*"):
        if not path.is_file() or path.is_symlink() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        payload = path.read_text(encoding="utf-8")
        decoded = _decoded_public_text(payload)
        canonical = _canonical_private_text(decoded)
        checked += 1
        for case_id, needle, normalized_needle in canonical_needles:
            if (needle in payload or needle in decoded
                    or normalized_needle in canonical):
                raise ValueError(
                    f"Restricted teacher text remains in Pages file {path.relative_to(site)} (case {case_id})")
    return len(items), len(authored), checked


def main():
    root = Path(__file__).resolve().parents[1]
    site = root / "site"
    originals = sanitize(site)
    subprocess.run(["node", str(root / "scripts/build_search_index.cjs")], cwd=root, check=True)
    total, authored, files = validate_public(site, originals)
    print(f"PASS: withheld {len(originals)} source-only teacher items from Pages; "
          f"{authored} authored cases, {total} search items and {files} public text files validated")


if __name__ == "__main__":
    main()
