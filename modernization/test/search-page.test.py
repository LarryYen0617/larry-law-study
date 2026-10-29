"""Static smoke checks for the full-corpus search page (not a browser E2E test)."""
import unittest
from html.parser import HTMLParser
from pathlib import Path

PAGE = Path(__file__).resolve().parents[2] / "site" / "search-preview.html"

class Inspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.labels = set()
        self.links = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"])
        if tag == "label" and data.get("for"):
            self.labels.add(data["for"])
        if tag == "a":
            self.links.append(data.get("href", ""))

class SearchPageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.parser = Inspector()
        cls.parser.feed(cls.html)

    def test_accessible_controls(self):
        self.assertTrue({"query", "subject", "kind", "status", "results", "retry", "pager"}.issubset(self.parser.ids))
        self.assertTrue({"query", "subject", "kind"}.issubset(self.parser.labels))
        self.assertIn('aria-live="polite"', self.html)

    def test_reads_existing_corpus_without_mutation(self):
        self.assertIn('fetch("search-index.json"', self.html)
        self.assertNotIn('fetch("search-preview-index.json"', self.html)
        self.assertNotIn("localStorage.setItem", self.html)
        self.assertNotIn("innerHTML", self.html)
        self.assertIn("const minRecords=3602", self.html)
        self.assertIn("clean.length<minRecords", self.html)
        self.assertIn("第757條", self.html)

    def test_course_link(self):
        catalog = PAGE.with_name("courses.html").read_text(encoding="utf-8")
        self.assertIn('href="search-preview.html"', catalog)

if __name__ == "__main__":
    unittest.main()
