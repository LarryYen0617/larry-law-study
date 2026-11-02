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
    def test_head_metadata_not_indexed(self):
        parser = builder.Extractor()
        parser.feed("<head><title>標題</title><meta name=\"description\" content=\"私密\"></head><body><p>正文</p></body>")
        self.assertEqual(builder.compact(" ".join(parser.body)), "正文")
    def test_nested_navigation_not_indexed(self):
        parser = builder.Extractor()
        parser.feed("<nav><span>隱藏</span><nav>內層</nav>仍隱藏</nav><p>可搜尋</p>")
        self.assertEqual(builder.compact(" ".join(parser.body)), "可搜尋")
    def test_hidden_teacher_material_not_indexed(self):
        parser = builder.Extractor()
        parser.feed('<div hidden>限制閱覽原題<span>不可公開</span><img src="x"></div><p>公開筆記</p>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "公開筆記")

    def test_aria_hidden_nested_content_not_indexed(self):
        parser = builder.Extractor()
        parser.feed('<div aria-hidden="true"><strong>隱藏</strong>仍隱藏</div><p>可搜尋</p>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "可搜尋")

    def test_template_and_svg_titles_not_indexed(self):
        parser = builder.Extractor()
        parser.feed('<template><p>模板</p></template><svg><title>圖表標題</title><text>秘密</text></svg><h1>可見</h1>')
        self.assertEqual(builder.compact(" ".join(parser.title)), "")
        self.assertEqual(builder.compact(" ".join(parser.body)), "可見")

    def test_void_element_inside_hidden_region(self):
        parser = builder.Extractor()
        parser.feed('<nav><input type="hidden"><br><span>隱藏</span></nav><p>正常</p>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "正常")

    def test_inline_css_hidden_blocks_not_indexed(self):
        parser = builder.Extractor()
        parser.feed('<div style="display: none !important"><span>不得索引</span></div>'
                    '<section style="visibility:hidden">隱藏</section>'
                    '<aside style="content-visibility: hidden">未顯示</aside><p>可見筆記</p>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "可見筆記")

    def test_case_insensitive_aria_and_inert_blocks(self):
        parser = builder.Extractor()
        parser.feed('<div aria-hidden=" TRUE ">敏感</div><section inert>略過</section><p>公開</p>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "公開")

    def test_hidden_inline_css_does_not_hide_later_siblings(self):
        parser = builder.Extractor()
        parser.feed('<div style="display:none"><span>內層</span><br>仍隱藏</div>'
                    '<div style="display:block">正常</div>')
        self.assertEqual(builder.compact(" ".join(parser.body)), "正常")

    def test_missing_source_is_error(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(FileNotFoundError):
                builder.build(Path(temp))

if __name__ == "__main__":
    unittest.main()
