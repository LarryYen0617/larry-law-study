#!/usr/bin/env python3
"""Read-only audit of the static site. JSON output; no source modification."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, sys

ROOT = Path(__file__).resolve().parents[2] / "site"
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.in_title, self.links, self.ids = [], False, [], []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "title": self.in_title = True
        if "id" in data: self.ids.append(data["id"])
        if tag in ("a", "link", "script", "img"):
            value = data.get("href") if tag in ("a", "link") else data.get("src")
            if value: self.links.append(value)
    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title.append(data)

def audit(root=ROOT):
    root = root.resolve()
    files = sorted(root.rglob("*.html"))
    if not files:
        return {"pages_checked": 0, "problem_count": 1, "problems": [{"page": ".", "type": "no_html_files"}]}
    problems = []
    titles = {}
    for file in files:
        rel = file.relative_to(root).as_posix()
        parser = PageParser()
        try:
            parser.feed(file.read_text(encoding="utf-8"))
        except (UnicodeError, OSError) as exc:
            problems.append({"page": rel, "type": "read_error", "detail": str(exc)})
            continue
        title = " ".join(parser.title).strip()
        if not title:
            problems.append({"page": rel, "type": "missing_title"})
        if len(title) > 150:
            problems.append({"page": rel, "type": "long_title", "detail": str(len(title))})
        if title:
            titles.setdefault(title, []).append(rel)
        for ident, count in Counter(parser.ids).items():
            if count > 1: problems.append({"page": rel, "type": "duplicate_id", "detail": ident})
        for href in parser.links:
            target = urlsplit(href)
            if target.scheme or target.netloc or href.startswith(("mailto:", "tel:", "data:", "javascript:", "//")):
                continue
            path = unquote(target.path)
            if path and (path.startswith("/") or "\\" in path):
                continue  # root-relative links depend on deployment base
            dest = (file.parent / path).resolve() if path else file
            if not dest.is_relative_to(root):
                continue
            if path and not dest.exists():
                problems.append({"page": rel, "type": "missing_local_resource", "detail": href})
            elif target.fragment and dest.is_file() and dest == file and target.fragment not in parser.ids:
                problems.append({"page": rel, "type": "missing_same_page_anchor", "detail": href})
    for title, locations in titles.items():
        if len(locations) > 1:
            problems.append({"page": ", ".join(locations), "type": "duplicate_title", "detail": title})
    return {"pages_checked": len(files), "problem_count": len(problems), "problems": problems}

if __name__ == "__main__":
    report = audit()
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    payload = json.dumps(report, ensure_ascii=False, indent=2)
    if output:
        output.write_text(payload + "\n", encoding="utf-8")
        counts = Counter(item["type"] for item in report["problems"])
        print(json.dumps({"pages_checked": report["pages_checked"], "problem_count": report["problem_count"], "problem_types": dict(counts), "sample": report["problems"][:8]}, ensure_ascii=False))
    else: print(payload)
    # Audit is informative: pre-existing issues do not break deployment.
