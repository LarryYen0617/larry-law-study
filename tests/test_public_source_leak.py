"""Regression tests for source-only teacher material in Pages artifacts."""
import base64
import sys
from urllib.parse import quote
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_public_source_leak import validate_public_site_text


class PublicSourceLeakTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.prompt = "Exam question about transfer of ownership with enough detail to be a private teacher original."
        self.source = {"cases": [{
            "id": "exam-1", "originalQuestion": self.prompt,
            "originalQuestionSha256": "a" * 64
        }]}

    def tearDown(self):
        self.temp.cleanup()

    def test_sanitized_public_artifact_passes(self):
        (self.root / "index.html").write_text("<h1>Summary</h1>", encoding="utf-8")
        self.assertEqual(validate_public_site_text(self.source, self.root), 1)

    def test_verbatim_question_fails_without_leaking_question_in_error(self):
        (self.root / "search-index.json").write_text(self.prompt, encoding="utf-8")
        with self.assertRaises(ValueError) as caught:
            validate_public_site_text(self.source, self.root)
        self.assertIn("exam-1", str(caught.exception))
        self.assertNotIn(self.prompt, str(caught.exception))

    def test_source_only_hash_fails(self):
        (self.root / "knowledge-data.js").write_text("a" * 64, encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_encoded_source_text_in_svg_source_map_and_manifest_fails(self):
        for filename in ("diagram.svg", "app.js.map", "site.webmanifest", "captions.vtt"):
            with self.subTest(filename=filename):
                path = self.root / filename
                path.write_text(quote(self.prompt, safe=""), encoding="utf-8")
                with self.assertRaises(ValueError):
                    validate_public_site_text(self.source, self.root)
                path.unlink()

    def test_base64_encoded_source_question_blocks_release(self):
        raw = self.prompt.encode("utf-8")
        for encoded in (base64.b64encode(raw).decode("ascii"),
                        base64.urlsafe_b64encode(raw).decode("ascii")):
            with self.subTest(encoding=encoded[:10]):
                path = self.root / "payload.js"
                path.write_text('const hidden = "' + encoded + '";', encoding="utf-8")
                with self.assertRaisesRegex(ValueError, "Private source-only"):
                    validate_public_site_text(self.source, self.root)
                path.unlink()

    def test_non_deployed_source_types_are_ignored(self):
        (self.root / "draft.py").write_text(self.prompt, encoding="utf-8")
        self.assertEqual(validate_public_site_text(self.source, self.root), 0)


    def test_html_entities_do_not_bypass_source_check(self):
        encoded = "".join("&#%d;" % ord(ch) for ch in self.prompt)
        (self.root / "index.html").write_text(encoded, encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_unicode_escaped_js_does_not_bypass_source_check(self):
        encoded = "".join("\\u%04x" % ord(ch) for ch in self.prompt)
        (self.root / "data.js").write_text(encoded, encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_url_encoded_question_does_not_bypass_source_check(self):
        (self.root / "data.json").write_text(quote(self.prompt, safe=""), encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_nested_url_encoding_does_not_bypass_source_check(self):
        (self.root / "data.json").write_text(
            quote(quote(self.prompt, safe=""), safe=""), encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_nested_html_entities_do_not_bypass_source_check(self):
        import html
        entities = "".join("&#%d;" % ord(ch) for ch in self.prompt)
        (self.root / "data.html").write_text(html.escape(entities), encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_mixed_nested_encodings_do_not_bypass_source_check(self):
        entities = "".join("&#%d;" % ord(ch) for ch in self.prompt)
        (self.root / "data.js").write_text(quote(entities, safe=""), encoding="utf-8")
        with self.assertRaises(ValueError):
            validate_public_site_text(self.source, self.root)

    def test_inventory_fingerprint_does_not_bypass_source_check(self):
        self.source["inventory"] = [{"id": "private-teacher-file", "sha256": "b" * 64}]
        (self.root / "data.js").write_text("b" * 64, encoding="utf-8")
        with self.assertRaises(ValueError) as caught:
            validate_public_site_text(self.source, self.root)
        self.assertIn("private-teacher-file", str(caught.exception))

    def test_safe_public_fingerprint_is_not_rejected(self):
        self.source["inventory"] = [{"id": "private-teacher-file", "sha256": "b" * 64}]
        (self.root / "index.html").write_text("<p>概念複習</p>", encoding="utf-8")
        self.assertEqual(validate_public_site_text(self.source, self.root), 1)


    def test_published_library_inventory_has_no_source_hashes(self):
        public = (Path(__file__).resolve().parents[1] / "site/library-data.js").read_text(encoding="utf-8")
        self.assertNotIn('"sha256":', public)


if __name__ == "__main__":
    unittest.main()
