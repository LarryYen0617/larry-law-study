import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from public_learning import public_knowledge, validate_public_knowledge


class PublicLearningTests(unittest.TestCase):
    def test_projection_preserves_canonical_and_public_analysis(self):
        source = {"cases": [{"id": "sample", "facts": "public facts", "answer": ["analysis"], "originalQuestion": "source text"}]}
        projected = public_knowledge(source)
        validate_public_knowledge(projected)
        self.assertEqual(source["cases"][0]["originalQuestion"], "source text")
        self.assertEqual(projected["cases"][0]["facts"], "public facts")
        self.assertEqual(projected["cases"][0]["answer"], ["analysis"])

    def test_projection_removes_private_file_fingerprints(self):
        source = {"cases": [], "inventory": [{"id": "exam", "sha256": "a" * 64, "status": "summary"}]}
        public = public_knowledge(source)
        self.assertNotIn("sha256", public["inventory"][0])
        self.assertEqual(source["inventory"][0]["sha256"], "a" * 64)
        validate_public_knowledge(public)

    def test_final_guard_rejects_restored_file_fingerprint(self):
        with self.assertRaises(ValueError):
            validate_public_knowledge({"cases": [], "inventory": [{"id": "exam", "sha256": "a" * 64}]})

    def test_final_guard_rejects_restored_source_fields(self):
        with self.assertRaises(ValueError):
            validate_public_knowledge({"cases": [{"id": "sample", "originalQuestion": "source text"}]})


if __name__ == "__main__":
    unittest.main()
