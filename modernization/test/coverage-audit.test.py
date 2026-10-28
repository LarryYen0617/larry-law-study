"""Coverage report counts indexed material, not exam completeness."""
import importlib.util
import unittest
from pathlib import Path

MODULE=Path(__file__).resolve().parents[1]/"scripts"/"audit-coverage.py"
spec=importlib.util.spec_from_file_location("coverage_audit",MODULE)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class CoverageTests(unittest.TestCase):
    def test_nine_subjects_and_types(self):
        data=[{"subject":"tax","type":"question"},{"subject":"tax","type":"teacher"},
              {"subject":"crime","type":"note"},{"subject":"","type":"novel"}]
        report=audit.summarize(data)
        self.assertEqual(len(report),9)
        self.assertEqual(report["tax"]["total"],2)
        self.assertEqual(report["tax"]["teacher"],1)
        self.assertEqual(report["crime"]["notes"],1)
        self.assertEqual(report["family"]["total"],0)
        self.assertEqual(sum(row["total"] for row in report.values()),3)
        self.assertEqual(report["tax"]["questions"],1)

if __name__=="__main__":
    unittest.main()
