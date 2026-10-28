#!/usr/bin/env python3
"""Build a bounded static search index from verified HTML pages; stdlib only."""
from html.parser import HTMLParser
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[2] / "site"
PAGES = {
    "index.html": "首頁",
    "reading.html": "閱讀",
    "discover.html": "探索",
    "questions.html": "題庫",
    "legal-english.html": "法學英文",
    "photonics.html": "跨領域",
    "courses.html": "課程",
    "essentials.html": "筆記",
    "class-notes/property-midterm-1151.html": "民法物權",
}
class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip_stack = []
        self.title_depth = 0
        self.title = []
        self.body = []
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "footer", "noscript"):
            self.skip_stack.append(tag)
        elif tag == "title" and not self.skip_stack:
            self.title_depth += 1
    def handle_endtag(self, tag):
        if self.skip_stack and tag == self.skip_stack[-1]:
            self.skip_stack.pop()
        elif tag == "title" and self.title_depth:
            self.title_depth -= 1
    def handle_data(self, data):
        if self.skip_stack: return
        if self.title_depth: self.title.append(data)
        else: self.body.append(data)
def compact(value):
    return re.sub(r"\s+", " ", value).strip()
def build(root=ROOT):
    entries = []
    for url, subject in PAGES.items():
        path = root / url
        if not path.is_file():
            raise FileNotFoundError(f"Missing required page: {path}")
        parser = Extractor()
        parser.feed(path.read_text(encoding="utf-8"))
        entries.append({"url": url, "subject": subject,
                        "title": compact(" ".join(parser.title)) or url,
                        "body": compact(" ".join(parser.body))[:100000]})
    return entries
if __name__ == "__main__":
    result = build()
    output = ROOT / "search-index.json"
    output.write_text(json.dumps({"schemaVersion": 1, "pages": result}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(result)} pages to {output}")
