"""Unit tests for the static HTML index extractor."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "build-search-index.py"
spec = importlib.util.spec_from_file_location("index_builder", MODULE)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class IndexBuilderTests(unittest.TestCase):
    def test_ignores_script_and_navigation(self):
        parser = builder.Extractor()
        parser.feed("<html><head><title>民法 &amp; 刑法</title><style>hidden</style></head><body><nav>不要索引</nav><main>物權 <strong>法定</strong></main><script>secret</script></body></html>")
        self.assertEqual(builder.compact(" ".join(parser.title)), "民法 & 刑法")
        self.assertEqual(builder.compact(" ".join(parser.body)), "物權 法定")
    def test_nested_navigation_not_indexed(self):
        parser = builder.Extractor()
        parser.feed("<nav><span>隱藏</span><nav>內層</nav>仍隱藏</nav><p>可搜尋</p>")
        self.assertEqual(builder.compact(" ".join(parser.body)), "可搜尋")
    def test_missing_source_is_error(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(FileNotFoundError):
                builder.build(Path(temp))

if __name__ == "__main__":
    unittest.main()
