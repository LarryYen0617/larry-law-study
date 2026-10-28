"""Regression tests for the immutable production search database."""
import importlib.util
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "audit-production-index.py"
spec = importlib.util.spec_from_file_location("production_audit", MODULE)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

def record(**overrides):
    item = {"id": "note:1", "type": "note", "subject": "property",
            "title": "物權法定", "body": "民法第757條", "href": "essentials.html?subject=property#note"}
    item.update(overrides)
    return item

class ProductionAuditTests(unittest.TestCase):
    def test_valid_record(self):
        self.assertTrue(audit.inspect({"version": 1, "items": [record()]})["valid"])

    def test_duplicate_ids(self):
        report = audit.inspect({"version": 1, "items": [record(), record()]})
        self.assertTrue(any("duplicate id" in p for p in report["problems"]))

    def test_unsafe_link(self):
        for href in ("https://example.com/", "javascript:alert(1)", "../outside.html", "/index.html"):
            with self.subTest(href=href):
                report = audit.inspect({"version": 1, "items": [record(href=href)]})
                self.assertFalse(report["valid"])

    def test_missing_fields(self):
        data = record()
        del data["body"]
        self.assertFalse(audit.inspect({"version": 1, "items": [data]})["valid"])

    def test_record_count_regression(self):
        report = audit.inspect({"version": 1, "items": [record()]}, min_records=3602)
        self.assertTrue(any("record count dropped" in p for p in report["problems"]))

if __name__ == "__main__":
    unittest.main()
