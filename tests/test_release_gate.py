"""Guardrails for the production GitHub Pages release sequence.

The news/editorial source check must run before uploading or deploying a
release. A failed check must leave the previously deployed site untouched.
"""
import unittest
from pathlib import Path

WORKFLOW = (Path(__file__).resolve().parents[1] / ".github" / "workflows" / "daily.yml")


class ReleaseGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = WORKFLOW.read_text(encoding="utf-8")

    def step(self, name):
        marker = "      - name: " + name
        self.assertEqual(self.workflow.count(marker), 1, f"expected exactly one step: {name}")
        return self.workflow.index(marker)

    def test_news_failure_gate_precedes_pages_upload_and_deployment(self):
        gate = self.step("若所有消息來源失敗，明確回報（網站仍保留可用內容）")
        upload = self.step("上傳網站（不包含教材原始檔、腳本或任何秘密）")
        deploy = self.step("發布到 GitHub Pages")
        self.assertLess(gate, upload)
        self.assertLess(upload, deploy)
        gate_body = self.workflow[gate:upload]
        self.assertIn("sys.exit(1 if", gate_body)
        self.assertIn("newsState", gate_body)
        self.assertIn("no_sources", gate_body)

    def test_privacy_and_index_checks_precede_release(self):
        privacy = self.step("驗證最終網站資料隔離")
        audit = self.step("升級版搜尋、資料安全及 Chromium 實測")
        upload = self.step("上傳網站（不包含教材原始檔、腳本或任何秘密）")
        self.assertLess(privacy, upload)
        self.assertLess(audit, upload)
        self.assertEqual(self.workflow.count("uses: actions/deploy-pages@v4"), 1)


if __name__ == "__main__":
    unittest.main()
