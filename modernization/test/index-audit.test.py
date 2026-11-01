import importlib.util
import tempfile
import unittest
from pathlib import Path
MODULE=Path(__file__).resolve().parents[1]/"scripts"/"audit-index.py"
spec=importlib.util.spec_from_file_location("index_audit",MODULE)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class IndexAuditTests(unittest.TestCase):
    def test_rejects_unsafe_url(self):
        with tempfile.TemporaryDirectory() as tmp:
            data={"schemaVersion":1,"pages":[{"url":"../outside.html","subject":"民法","title":"測試","body":"內容"}]}
            self.assertTrue(module.validate(data,Path(tmp)))
    def test_rejects_duplicate_url(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"ok.html").write_text("<title>OK</title>",encoding="utf-8")
            item={"url":"ok.html","subject":"民法","title":"測試","body":"內容"}
            self.assertTrue(any("duplicate" in x for x in module.validate({"schemaVersion":1,"pages":[item,item]},root)))
    def test_rejects_oversized_title(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"ok.html").write_text("<title>OK</title>",encoding="utf-8")
            data={"schemaVersion":1,"pages":[{"url":"ok.html","subject":"民法","title":"甲"*301,"body":"內容"}]}
            self.assertTrue(any("title too long" in x for x in module.validate(data,root)))
    def test_rejects_control_and_encoded_preview_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ok.html").write_text("<title>OK</title>", encoding="utf-8")
            for url in ("ok.html\\n", "ok.html\\x7f", "ok.html?x=1",
                        "ok.html#frag", "ok%2ehtml", "ok.html\\\\bad",
                        "./ok.html", "folder//ok.html"):
                with self.subTest(url=repr(url)):
                    row = {"url": url, "subject": "民法", "title": "測試", "body": "內容"}
                    issues = module.validate({"schemaVersion": 1, "pages": [row]}, root)
                    self.assertTrue(issues, url)

    def test_accepts_valid_entry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"ok.html").write_text("<title>OK</title>",encoding="utf-8")
            data={"schemaVersion":1,"pages":[{"url":"ok.html","subject":"民法","title":"測試","body":"內容"}]}
            self.assertEqual(module.validate(data,root),[])
if __name__=="__main__":
    unittest.main()
