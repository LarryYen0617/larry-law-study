"""Smoke tests for read-only website audit."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
MODULE = Path(__file__).resolve().parents[1] / "scripts" / "audit-site.py"
spec = importlib.util.spec_from_file_location("site_audit", MODULE)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)
class SiteAuditTests(unittest.TestCase):
    def test_broken_local_link_and_duplicate_id(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "index.html").write_text('<html><head><title>測試</title></head><body><a href="missing.html">link</a><div id="x"></div><p id="x"></p></body></html>', encoding="utf-8")
            report = audit_module.audit(root)
            kinds = {p["type"] for p in report["problems"]}
            self.assertIn("missing_local_resource", kinds)
            self.assertIn("duplicate_id", kinds)
    def test_valid_page(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "index.html").write_text('<html><head><title>正常</title></head><body><a href="#ok">jump</a><h2 id="ok">內容</h2></body></html>', encoding="utf-8")
            self.assertEqual(audit_module.audit(root)["problem_count"], 0)
if __name__ == "__main__":
    unittest.main()
