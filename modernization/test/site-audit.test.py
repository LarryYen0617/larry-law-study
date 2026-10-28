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
    def test_empty_site_reports_problem(self):
        with tempfile.TemporaryDirectory() as temp:
            report = audit_module.audit(Path(temp))
            self.assertEqual(report["pages_checked"], 0)
            self.assertEqual(report["problems"][0]["type"], "no_html_files")
    def test_spa_hash_route_is_not_a_missing_anchor(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'index.html').write_text('<title>SPA</title><a href="#/dashboard">首頁</a>', encoding='utf-8')
            self.assertEqual(audit_module.audit(root)['blocking_problem_count'], 0)
    def test_dynamic_practice_anchor_is_warning(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'practice.html').write_text('<title>申論</title><div id="practiceFields"></div><a href="#practice-issue">爭點</a>', encoding='utf-8')
            report = audit_module.audit(root)
            self.assertEqual(report['blocking_problem_count'], 0)
            self.assertEqual(report['problems'][0]['type'], 'dynamic_anchor_unverified')
    def test_valid_page(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "index.html").write_text('<html><head><title>正常</title></head><body><a href="#ok">jump</a><h2 id="ok">內容</h2></body></html>', encoding="utf-8")
            self.assertEqual(audit_module.audit(root)["problem_count"], 0)
if __name__ == "__main__":
    unittest.main()
