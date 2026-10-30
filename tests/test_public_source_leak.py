"""Regression tests for source-only teacher material in Pages artifacts."""
import sys
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

    def test_non_deployed_source_types_are_ignored(self):
        (self.root / "draft.py").write_text(self.prompt, encoding="utf-8")
        self.assertEqual(validate_public_site_text(self.source, self.root), 0)


if __name__ == "__main__":
    unittest.main()
