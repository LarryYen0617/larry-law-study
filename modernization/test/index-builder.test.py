"""Unit and coverage tests for the preview HTML index builder."""
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
    def test_head_metadata_not_indexed(self):
        parser = builder.Extractor()
        parser.feed('<head><title>標題</title><meta name="description" content="私密"></head><body><p>正文</p></body>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "正文")
    def test_nested_navigation_not_indexed(self):
        parser = builder.Extractor()
        parser.feed("<nav><span>隱藏</span><nav>內層</nav>仍隱藏</nav><p>可搜尋</p>")
        self.assertEqual(builder.compact(" ".join(parser.body)), "可搜尋")
    def test_missing_source_is_error(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(FileNotFoundError):
                builder.build(Path(temp))
    def test_discovers_nested_materials_without_mutating_sources(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in builder.PAGES:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('<title>基本</title><main>課程內容</main>', encoding='utf-8')
            extra = root / 'class-notes' / 'criminal-law' / 'lesson.html'
            extra.parent.mkdir(parents=True, exist_ok=True)
            extra.write_text('<title>刑法專題</title><main>構成要件</main>', encoding='utf-8')
            original = extra.read_bytes()
            entries = builder.build(root)
            self.assertEqual(len(entries), len(builder.PAGES) + 1)
            self.assertEqual(len({item['url'] for item in entries}), len(entries))
            found = next(item for item in entries if item['url'] == 'class-notes/criminal-law/lesson.html')
            self.assertEqual(found['title'], '刑法專題')
            self.assertIn('構成要件', found['body'])
            self.assertEqual(extra.read_bytes(), original)
            self.assertFalse((root / 'search-index.json').exists())
    def test_missing_required_page_fails_even_with_extra_pages(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'extra.html').write_text('extra', encoding='utf-8')
            with self.assertRaises(FileNotFoundError):
                builder.build(root)

if __name__ == "__main__":
    unittest.main()
