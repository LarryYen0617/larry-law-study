"""Regression tests for the immutable production search-index contract."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "audit-production-index.py"
spec = importlib.util.spec_from_file_location("production_audit", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def item(key="id-1", href="index.html#example"):
    return {"id": key, "type": "note", "subject": "civilgeneral",
            "title": "民法", "body": "物權", "href": href}

class ProductionIndexAuditTests(unittest.TestCase):
    def test_valid_record(self):
        self.assertTrue(module.inspect({"version": 1, "items": [item()]}, min_records=1)["valid"])
    def test_rejects_truncated_database(self):
        report = module.inspect({"version": 1, "items": [item()]}, min_records=3602)
        self.assertFalse(report["valid"])
        self.assertTrue(any("record count dropped" in x for x in report["problems"]))
    def test_rejects_duplicate_ids(self):
        self.assertFalse(module.inspect({"version": 1, "items": [item(), item()]})["valid"])
    def test_rejects_external_href(self):
        self.assertFalse(module.inspect({"version": 1, "items": [item(href="https://evil.example/")]})["valid"])
    def test_rejects_traversal_href(self):
        self.assertFalse(module.inspect({"version": 1, "items": [item(href="../index.html")]})["valid"])
    def test_rejects_javascript_href(self):
        self.assertFalse(module.inspect({"version": 1, "items": [item(href="javascript:alert(1)")]})["valid"])
    def test_rejects_missing_required_field(self):
        record = item()
        del record["body"]
        self.assertFalse(module.inspect({"version": 1, "items": [record]})["valid"])
    def test_rejects_empty_id(self):
        self.assertFalse(module.inspect({"version": 1, "items": [item(key="")]})["valid"])
    def test_rejects_non_object_record(self):
        self.assertFalse(module.inspect({"version": 1, "items": [None]})["valid"])
    def test_rejects_loss_of_record_category_even_if_total_is_unchanged(self):
        records = [item("id-1"), item("id-2")]
        report = module.inspect({"version": 1, "items": records},
                                min_records=2, baseline_types={"note": 1, "teacher": 1})
        self.assertFalse(report["valid"])
        self.assertTrue(any("type teacher dropped" in x for x in report["problems"]))
    def test_accepts_category_baseline(self):
        report = module.inspect({"version": 1, "items": [item()]},
                                min_records=1, baseline_types={"note": 1})
        self.assertTrue(report["valid"])
    def test_public_teacher_baseline_counts_authored_cases_not_private_originals(self):
        self.assertEqual(module.BASELINE_TYPES["teacher"], 18)
        rows = [item(f"teacher:authored-{i}") for i in range(18)]
        for row in rows:
            row["type"] = "teacher"
        self.assertTrue(module.inspect({"version": 1, "items": rows},
                                       min_records=18, baseline_types={"teacher": 18})["valid"])
        self.assertFalse(module.inspect({"version": 1, "items": rows[:-1]},
                                        min_records=17, baseline_types={"teacher": 18})["valid"])

    def test_rejects_blank_title(self):
        record = item()
        record["title"] = "   "
        self.assertFalse(module.inspect({"version": 1, "items": [record]})["valid"])
    def test_allows_uncategorized_records(self):
        record = item()
        record["subject"] = ""
        self.assertTrue(module.inspect({"version": 1, "items": [record]})["valid"])
    def test_rejects_invalid_schema(self):
        self.assertFalse(module.inspect({"schemaVersion": 1, "pages": []})["valid"])

if __name__ == "__main__":
    unittest.main()
